(function () {
  const CACHE_KEY = "mm_flashcards_cache_v2";
  const STUDY_CACHE_KEY = "mm_flashcards_study_v1";
  const DEFAULT_DECK_COLOR = "#1E63FF";
  const SYNC_DEBOUNCE_MS = 1000;
  const CHUNK_SIZE = 200;
  const SYNC_BATCH_TARGET_BYTES = 24 * 1024;
  const SAFE_DELETE_HYDRATION_WINDOW_MS = 30 * 1000;
  const DEBUG_CLIENT_LOGS =
    window.__MM_ENV__ === "dev" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const syncState = {
    timer: null,
    inFlight: false,
    pendingUsers: new Set(),
    initPromises: new Map(),
    userSyncLocks: new Map(),
  };
  let syncGatewayModulePromise = null;

  async function getSyncGateway() {
    try {
      if (!syncGatewayModulePromise) {
        syncGatewayModulePromise = import("/dist/sync/syncGateway.js");
      }
      const mod = await syncGatewayModulePromise;
      return mod?.syncGateway || null;
    } catch (error) {
      console.warn("[flashcardsCache] failed to load syncGateway module", error);
      return null;
    }
  }

  function isDeferredSyncGatewayError(error) {
    const message = String(error?.message || error || "").toLowerCase();
    if (!message) return false;
    return (
      message.includes("sync_gateway_not_ready_timeout") ||
      message.includes("sync_gateway_unavailable") ||
      message.includes("outbox_flush_timeout")
    );
  }

  function emitLocalWriteError(kind, error) {
    try {
      console.error(`[flashcardsCache] local write failed (${kind})`, error);
      window.dispatchEvent(
        new CustomEvent("flashcards-cache-write-error", {
          detail: {
            kind: String(kind || "cache"),
            message: error instanceof Error ? error.message : String(error || "unknown_error"),
          },
        }),
      );
    } catch (_) {
      /* noop */
    }
  }

  function emitSyncStatus(detail) {
    try {
      window.dispatchEvent(
        new CustomEvent("flashcards-sync-status", {
          detail: {
            ts: Date.now(),
            ...detail,
          },
        }),
      );
    } catch (_) {
      /* noop */
    }
  }

  function getSupabaseClient() {
    return window.supabaseClient || null;
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || ""),
    );
  }

  function canUseRemote(userId) {
    return Boolean(getSupabaseClient()) && isUuid(userId);
  }

  function jsonByteSize(value) {
    try {
      return new TextEncoder().encode(JSON.stringify(value ?? null)).byteLength;
    } catch (_) {
      try {
        return JSON.stringify(value ?? null).length;
      } catch (_) {
        return 0;
      }
    }
  }

  function chunkRowsForSync(rows, targetBytes = SYNC_BATCH_TARGET_BYTES) {
    const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if (!list.length) return [];
    const chunks = [];
    let current = [];
    let currentBytes = 2;
    list.forEach((row) => {
      const rowBytes = Math.max(2, jsonByteSize(row));
      const separatorBytes = current.length ? 1 : 0;
      const wouldExceed = current.length > 0 && currentBytes + separatorBytes + rowBytes > targetBytes;
      if (wouldExceed) {
        chunks.push(current);
        current = [row];
        currentBytes = 2 + rowBytes;
        return;
      }
      current.push(row);
      currentBytes += separatorBytes + rowBytes;
    });
    if (current.length) chunks.push(current);
    return chunks;
  }

  function readStore() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) {
        return {
          decks: [],
          updatedAt: null,
          lastHydratedAtByUser: {},
          remoteFingerprintByUser: {},
          pendingSyncOpsByUser: {},
        };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return {
          decks: [],
          updatedAt: null,
          lastHydratedAtByUser: {},
          remoteFingerprintByUser: {},
          pendingSyncOpsByUser: {},
        };
      }
      return {
        decks: Array.isArray(parsed.decks) ? parsed.decks : [],
        updatedAt: parsed.updatedAt || null,
        lastHydratedAtByUser:
          parsed.lastHydratedAtByUser && typeof parsed.lastHydratedAtByUser === "object"
            ? parsed.lastHydratedAtByUser
            : {},
        remoteFingerprintByUser:
          parsed.remoteFingerprintByUser && typeof parsed.remoteFingerprintByUser === "object"
            ? parsed.remoteFingerprintByUser
            : {},
        pendingSyncOpsByUser:
          parsed.pendingSyncOpsByUser && typeof parsed.pendingSyncOpsByUser === "object"
            ? parsed.pendingSyncOpsByUser
            : {},
      };
    } catch (_) {
      return {
        decks: [],
        updatedAt: null,
        lastHydratedAtByUser: {},
        remoteFingerprintByUser: {},
        pendingSyncOpsByUser: {},
      };
    }
  }

  function writeStore(next) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          decks: Array.isArray(next?.decks) ? next.decks : [],
          updatedAt: Date.now(),
          lastHydratedAtByUser:
            next?.lastHydratedAtByUser && typeof next.lastHydratedAtByUser === "object"
              ? next.lastHydratedAtByUser
              : {},
          remoteFingerprintByUser:
            next?.remoteFingerprintByUser && typeof next.remoteFingerprintByUser === "object"
              ? next.remoteFingerprintByUser
              : {},
          pendingSyncOpsByUser:
            next?.pendingSyncOpsByUser && typeof next.pendingSyncOpsByUser === "object"
              ? next.pendingSyncOpsByUser
              : {},
        }),
      );
      return true;
    } catch (error) {
      emitLocalWriteError("cache", error);
      return false;
    }
  }

  function readStudyStore() {
    try {
      const raw = localStorage.getItem(STUDY_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeStudyStore(next) {
    try {
      localStorage.setItem(STUDY_CACHE_KEY, JSON.stringify(next || {}));
      return true;
    } catch (error) {
      emitLocalWriteError("study", error);
      return false;
    }
  }

  function normalizeName(name) {
    return String(name || "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  function normalizeDeck(deck) {
    const legacyCards = Array.isArray(deck?.cards) ? deck.cards : [];
    const topics =
      Array.isArray(deck?.topics) && deck.topics.length
        ? deck.topics.map((topic) => ({
            ...topic,
            cards: (Array.isArray(topic?.cards) ? topic.cards : []).map((card) => ({
              ...card,
              subtopicId: card?.subtopicId ? String(card.subtopicId) : null,
            })),
            subtopics: Array.isArray(topic?.subtopics) ? topic.subtopics : [],
          }))
        : legacyCards.length
          ? [
              {
                id: "topic_legacy",
                name: "Geral",
                cards: legacyCards.map((card) => ({
                  ...card,
                  subtopicId: card?.subtopicId ? String(card.subtopicId) : null,
                })),
                subtopics: [],
                createdAt: deck?.createdAt || new Date().toISOString(),
                updatedAt: deck?.updatedAt || new Date().toISOString(),
              },
            ]
          : [];

    const cardsCount = topics.reduce((sum, topic) => sum + topic.cards.length, 0);
    return {
      ...deck,
      color: deck?.color || DEFAULT_DECK_COLOR,
      topics,
      cards: [],
      cardsCount,
    };
  }

  function safeUserId(userId) {
    return String(userId || "anonymous");
  }

  function ensurePendingSyncRoot(store) {
    if (!store.pendingSyncOpsByUser || typeof store.pendingSyncOpsByUser !== "object") {
      store.pendingSyncOpsByUser = {};
    }
    return store.pendingSyncOpsByUser;
  }

  function ensurePendingSyncUser(store, userId) {
    const root = ensurePendingSyncRoot(store);
    const uid = safeUserId(userId);
    if (!root[uid] || typeof root[uid] !== "object") {
      root[uid] = {
        upserts: {},
        deletes: {},
      };
    }
    const bucket = root[uid];
    if (!bucket.upserts || typeof bucket.upserts !== "object") bucket.upserts = {};
    if (!bucket.deletes || typeof bucket.deletes !== "object") bucket.deletes = {};
    return bucket;
  }

  function queueSyncUpsert(store, userId, table, rowKey, row) {
    const uid = safeUserId(userId);
    const key = String(rowKey || "");
    if (!key || !row || typeof row !== "object") return;
    const bucket = ensurePendingSyncUser(store, uid);
    if (!bucket.upserts[table] || typeof bucket.upserts[table] !== "object") {
      bucket.upserts[table] = {};
    }
    bucket.upserts[table][key] = row;
    if (Array.isArray(bucket.deletes[table])) {
      bucket.deletes[table] = bucket.deletes[table].filter((id) => String(id || "") !== key);
    }
  }

  function queueSyncDelete(store, userId, table, rowKey) {
    const uid = safeUserId(userId);
    const key = String(rowKey || "");
    if (!key) return;
    const bucket = ensurePendingSyncUser(store, uid);
    if (!Array.isArray(bucket.deletes[table])) bucket.deletes[table] = [];
    if (!bucket.deletes[table].includes(key)) bucket.deletes[table].push(key);
    if (bucket.upserts[table] && typeof bucket.upserts[table] === "object") {
      delete bucket.upserts[table][key];
    }
  }

  function getPendingSyncOpsForUser(store, userId) {
    const uid = safeUserId(userId);
    const root = ensurePendingSyncRoot(store);
    const bucket = root[uid];
    if (!bucket || typeof bucket !== "object") return null;
    return bucket;
  }

  function clearPendingSyncOpsForUser(store, userId) {
    const uid = safeUserId(userId);
    const root = ensurePendingSyncRoot(store);
    if (root[uid]) delete root[uid];
  }

  function hasPendingSyncOps(bucket) {
    if (!bucket || typeof bucket !== "object") return false;
    const upserts = bucket.upserts && typeof bucket.upserts === "object" ? bucket.upserts : {};
    const deletes = bucket.deletes && typeof bucket.deletes === "object" ? bucket.deletes : {};
    const hasUpserts = Object.values(upserts).some((tableRows) =>
      tableRows && typeof tableRows === "object" && Object.keys(tableRows).length > 0,
    );
    if (hasUpserts) return true;
    return Object.values(deletes).some((ids) => Array.isArray(ids) && ids.length > 0);
  }

  function buildDeckRow(deck, userId) {
    return {
      id: String(deck?.id || ""),
      user_id: safeUserId(userId),
      name: String(deck?.name || ""),
      color: String(deck?.color || DEFAULT_DECK_COLOR),
      sort_order: Number.isFinite(deck?.sortOrder) ? Number(deck.sortOrder) : 0,
      created_at: deck?.createdAt || new Date().toISOString(),
      updated_at: deck?.updatedAt || new Date().toISOString(),
    };
  }

  function buildTopicRow(topic, deckId, userId) {
    return {
      id: String(topic?.id || ""),
      deck_id: String(deckId || ""),
      user_id: safeUserId(userId),
      name: String(topic?.name || ""),
      sort_order: Number.isFinite(topic?.sortOrder) ? Number(topic.sortOrder) : 0,
      created_at: topic?.createdAt || new Date().toISOString(),
      updated_at: topic?.updatedAt || new Date().toISOString(),
    };
  }

  function buildSubtopicRow(subtopic, topicId, deckId, userId) {
    return {
      id: String(subtopic?.id || ""),
      topic_id: String(topicId || ""),
      deck_id: String(deckId || ""),
      user_id: safeUserId(userId),
      name: String(subtopic?.name || ""),
      sort_order: Number.isFinite(subtopic?.sortOrder) ? Number(subtopic.sortOrder) : 0,
      created_at: subtopic?.createdAt || new Date().toISOString(),
      updated_at: subtopic?.updatedAt || new Date().toISOString(),
    };
  }

  function buildCardRow(card, topicId, deckId, userId) {
    return {
      id: String(card?.id || ""),
      topic_id: String(topicId || ""),
      deck_id: String(deckId || ""),
      subtopic_id: card?.subtopicId ? String(card.subtopicId) : null,
      user_id: safeUserId(userId),
      front_html: String(card?.frontHtml || ""),
      back_html: String(card?.backHtml || ""),
      reverse: Boolean(card?.reverse),
      sort_order: Number.isFinite(card?.sortOrder) ? Number(card.sortOrder) : 0,
      created_at: card?.createdAt || new Date().toISOString(),
      updated_at: card?.updatedAt || new Date().toISOString(),
    };
  }

  function buildStudyRow(cardId, entry, userId) {
    return {
      user_id: safeUserId(userId),
      card_id: String(cardId || ""),
      status: entry?.status === "mastered" ? "mastered" : "in_progress",
      last_studied_date: entry?.lastStudiedDate || null,
      next_review_at: entry?.nextReviewAt || null,
      updated_at: entry?.updatedAt || new Date().toISOString(),
    };
  }

  function withUserDecksMutated(userId, mutator) {
    const uid = safeUserId(userId);
    const store = readStore();
    const decks = store.decks.map(normalizeDeck);
    const userDecks = decks.filter((deck) => safeUserId(deck.userId) === uid);
    const otherDecks = decks.filter((deck) => safeUserId(deck.userId) !== uid);

    const nextUserDecks = mutator(userDecks);
    store.decks = [...otherDecks, ...(Array.isArray(nextUserDecks) ? nextUserDecks : userDecks)];
    return writeStore(store) ? store : null;
  }

  function loadDecksByUser(userId) {
    const uid = safeUserId(userId);
    const { decks } = readStore();
    return decks
      .filter((deck) => safeUserId(deck.userId) === uid)
      .map(normalizeDeck)
      .sort((a, b) => {
        const ai = Number.isFinite(a?.sortOrder) ? Number(a.sortOrder) : Number.MAX_SAFE_INTEGER;
        const bi = Number.isFinite(b?.sortOrder) ? Number(b.sortOrder) : Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });
  }

  function loadDeckById(userId, deckId) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    if (!safeDeckId) return null;
    const { decks } = readStore();
    const deck = decks.find(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    return deck ? normalizeDeck(deck) : null;
  }

  function existsDeckName(userId, name) {
    const uid = safeUserId(userId);
    const normalized = normalizeName(name);
    if (!normalized) return false;
    const { decks } = readStore();
    return decks.some(
      (deck) => safeUserId(deck.userId) === uid && normalizeName(deck.name) === normalized,
    );
  }

  function existsTopicName(userId, deckId, topicName) {
    const deck = loadDeckById(userId, deckId);
    const normalized = normalizeName(topicName);
    if (!deck || !normalized) return false;
    return deck.topics.some((topic) => normalizeName(topic.name) === normalized);
  }

  function existsSubtopicName(userId, deckId, topicId, subtopicName) {
    const deck = loadDeckById(userId, deckId);
    const normalized = normalizeName(subtopicName);
    if (!deck || !normalized) return false;
    const topic = deck.topics.find((item) => String(item.id) === String(topicId));
    if (!topic) return false;
    return (Array.isArray(topic.subtopics) ? topic.subtopics : []).some(
      (subtopic) => normalizeName(subtopic.name) === normalized,
    );
  }

  function makeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  }

  function createDeck(userId, name, color) {
    const uid = safeUserId(userId);
    const safeName = String(name || "").trim();
    const safeColor = String(color || DEFAULT_DECK_COLOR).trim() || DEFAULT_DECK_COLOR;
    if (!safeName) return { ok: false, reason: "empty_name" };
    if (existsDeckName(uid, safeName)) return { ok: false, reason: "duplicate_name" };

    const deck = {
      id: makeId("deck"),
      userId: uid,
      name: safeName,
      color: safeColor,
      topics: [],
      cards: [],
      cardsCount: 0,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const store = readStore();
    const decks = store.decks.map(normalizeDeck);
    const userDecks = decks.filter((item) => safeUserId(item.userId) === uid);
    const otherDecks = decks.filter((item) => safeUserId(item.userId) !== uid);
    const nextUserDecks = [deck, ...userDecks].map((item, index) => ({ ...item, sortOrder: index }));
    const createdDeck = nextUserDecks.find((item) => String(item.id) === String(deck.id)) || deck;
    store.decks = [...otherDecks, ...nextUserDecks];
    nextUserDecks.forEach((entry) => {
      queueSyncUpsert(store, uid, "flashcard_decks", entry.id, buildDeckRow(entry, uid));
    });
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, deck: createdDeck };
  }

  function renameDeck(userId, deckId, nextName) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeName = String(nextName || "").trim();
    if (!safeDeckId) return { ok: false, reason: "invalid_deck_id" };
    if (!safeName) return { ok: false, reason: "empty_name" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const duplicate = store.decks.some(
      (entry, index) =>
        index !== deckIndex &&
        safeUserId(entry.userId) === uid &&
        normalizeName(entry.name) === normalizeName(safeName),
    );
    if (duplicate) return { ok: false, reason: "duplicate_name" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    deck.name = safeName;
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";
    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, deck };
  }

  function createTopic(userId, deckId, topicName) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeName = String(topicName || "").trim();

    if (!safeDeckId) return { ok: false, reason: "invalid_deck_id" };
    if (!safeName) return { ok: false, reason: "empty_topic_name" };
    if (existsTopicName(uid, safeDeckId, safeName)) return { ok: false, reason: "duplicate_topic_name" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topic = {
      id: makeId("topic"),
      name: safeName,
      cards: [],
      subtopics: [],
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    deck.topics = [topic, ...deck.topics].map((item, index) => ({ ...item, sortOrder: index }));
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";
    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(store, uid, "flashcard_topics", topic.id, buildTopicRow(topic, deck.id, uid));
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, topic, deck };
  }

  function renameTopic(userId, deckId, topicId, nextName) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    const safeName = String(nextName || "").trim();

    if (!safeDeckId || !safeTopicId) return { ok: false, reason: "invalid_ids" };
    if (!safeName) return { ok: false, reason: "empty_name" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicIndex = deck.topics.findIndex((topic) => String(topic.id) === safeTopicId);
    if (topicIndex < 0) return { ok: false, reason: "topic_not_found" };

    const duplicate = deck.topics.some(
      (topic, index) => index !== topicIndex && normalizeName(topic.name) === normalizeName(safeName),
    );
    if (duplicate) return { ok: false, reason: "duplicate_name" };

    deck.topics[topicIndex].name = safeName;
    deck.topics[topicIndex].updatedAt = new Date().toISOString();
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";
    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(
      store,
      uid,
      "flashcard_topics",
      deck.topics[topicIndex].id,
      buildTopicRow(deck.topics[topicIndex], deck.id, uid),
    );
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, topic: deck.topics[topicIndex], deck };
  }

  function createSubtopic(userId, deckId, topicId, subtopicName) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    const safeName = String(subtopicName || "").trim();

    if (!safeDeckId || !safeTopicId) return { ok: false, reason: "invalid_ids" };
    if (!safeName) return { ok: false, reason: "empty_subtopic_name" };
    if (existsSubtopicName(uid, safeDeckId, safeTopicId, safeName)) {
      return { ok: false, reason: "duplicate_subtopic_name" };
    }

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicIndex = deck.topics.findIndex((topic) => String(topic.id) === safeTopicId);
    if (topicIndex < 0) return { ok: false, reason: "topic_not_found" };

    const nextSubtopic = {
      id: makeId("subtopic"),
      name: safeName,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentSubtopics = Array.isArray(deck.topics[topicIndex].subtopics) ? deck.topics[topicIndex].subtopics : [];
    deck.topics[topicIndex].subtopics = [nextSubtopic, ...currentSubtopics].map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
    deck.topics[topicIndex].updatedAt = new Date().toISOString();
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";

    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(
      store,
      uid,
      "flashcard_topics",
      deck.topics[topicIndex].id,
      buildTopicRow(deck.topics[topicIndex], deck.id, uid),
    );
    queueSyncUpsert(
      store,
      uid,
      "flashcard_subtopics",
      nextSubtopic.id,
      buildSubtopicRow(nextSubtopic, deck.topics[topicIndex].id, deck.id, uid),
    );
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, subtopic: nextSubtopic, topic: deck.topics[topicIndex], deck };
  }

  function renameSubtopic(userId, deckId, topicId, subtopicId, nextName) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    const safeSubtopicId = String(subtopicId || "");
    const safeName = String(nextName || "").trim();

    if (!safeDeckId || !safeTopicId || !safeSubtopicId) return { ok: false, reason: "invalid_ids" };
    if (!safeName) return { ok: false, reason: "empty_name" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicIndex = deck.topics.findIndex((topic) => String(topic.id) === safeTopicId);
    if (topicIndex < 0) return { ok: false, reason: "topic_not_found" };

    const subtopics = Array.isArray(deck.topics[topicIndex].subtopics) ? deck.topics[topicIndex].subtopics : [];
    const subtopicIndex = subtopics.findIndex((item) => String(item.id) === safeSubtopicId);
    if (subtopicIndex < 0) return { ok: false, reason: "subtopic_not_found" };

    const duplicate = subtopics.some(
      (item, index) => index !== subtopicIndex && normalizeName(item.name) === normalizeName(safeName),
    );
    if (duplicate) return { ok: false, reason: "duplicate_subtopic_name" };

    subtopics[subtopicIndex].name = safeName;
    subtopics[subtopicIndex].updatedAt = new Date().toISOString();
    deck.topics[topicIndex].subtopics = subtopics;
    deck.topics[topicIndex].updatedAt = new Date().toISOString();
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";

    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(
      store,
      uid,
      "flashcard_topics",
      deck.topics[topicIndex].id,
      buildTopicRow(deck.topics[topicIndex], deck.id, uid),
    );
    queueSyncUpsert(
      store,
      uid,
      "flashcard_subtopics",
      subtopics[subtopicIndex].id,
      buildSubtopicRow(subtopics[subtopicIndex], deck.topics[topicIndex].id, deck.id, uid),
    );
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, subtopic: subtopics[subtopicIndex], topic: deck.topics[topicIndex], deck };
  }

  function deleteSubtopic(userId, deckId, topicId, subtopicId) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    const safeSubtopicId = String(subtopicId || "");

    if (!safeDeckId || !safeTopicId || !safeSubtopicId) return { ok: false, reason: "invalid_ids" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicIndex = deck.topics.findIndex((topic) => String(topic.id) === safeTopicId);
    if (topicIndex < 0) return { ok: false, reason: "topic_not_found" };

    const subtopics = Array.isArray(deck.topics[topicIndex].subtopics) ? deck.topics[topicIndex].subtopics : [];
    const nextSubtopics = subtopics.filter((item) => String(item.id) !== safeSubtopicId);
    if (nextSubtopics.length === subtopics.length) return { ok: false, reason: "subtopic_not_found" };

    deck.topics[topicIndex].subtopics = nextSubtopics.map((item, index) => ({ ...item, sortOrder: index }));
    deck.topics[topicIndex].cards = (Array.isArray(deck.topics[topicIndex].cards) ? deck.topics[topicIndex].cards : []).map(
      (card) =>
        String(card?.subtopicId || "") === safeSubtopicId
          ? { ...card, subtopicId: null, updatedAt: new Date().toISOString() }
          : card,
    );
    deck.topics[topicIndex].updatedAt = new Date().toISOString();
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";

    store.decks[deckIndex] = deck;
    queueSyncDelete(store, uid, "flashcard_subtopics", safeSubtopicId);
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(
      store,
      uid,
      "flashcard_topics",
      deck.topics[topicIndex].id,
      buildTopicRow(deck.topics[topicIndex], deck.id, uid),
    );
    (Array.isArray(deck.topics[topicIndex].cards) ? deck.topics[topicIndex].cards : []).forEach((card) => {
      queueSyncUpsert(
        store,
        uid,
        "flashcard_cards",
        card.id,
        buildCardRow(card, deck.topics[topicIndex].id, deck.id, uid),
      );
    });
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, topic: deck.topics[topicIndex], deck };
  }

  function addCardToTopic(userId, deckId, topicId, card) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    if (!safeDeckId || !safeTopicId) return { ok: false, reason: "invalid_ids" };

    const frontHtml = String(card?.frontHtml || "").trim();
    const backHtml = String(card?.backHtml || "").trim();
    const reverse = Boolean(card?.reverse);
    const rawSubtopicId = String(card?.subtopicId || "").trim();
    const subtopicId = rawSubtopicId || null;
    if (!frontHtml && !backHtml) return { ok: false, reason: "empty_card" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicIndex = deck.topics.findIndex((topic) => String(topic.id) === safeTopicId);
    if (topicIndex < 0) return { ok: false, reason: "topic_not_found" };
    const subtopics = Array.isArray(deck.topics[topicIndex].subtopics) ? deck.topics[topicIndex].subtopics : [];
    if (subtopicId && !subtopics.some((item) => String(item.id) === subtopicId)) {
      return { ok: false, reason: "subtopic_not_found" };
    }

    const nextCard = {
      id: makeId("card"),
      frontHtml,
      backHtml,
      reverse,
      subtopicId,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    deck.topics[topicIndex].cards = [nextCard, ...deck.topics[topicIndex].cards].map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
    deck.topics[topicIndex].updatedAt = new Date().toISOString();
    deck.cardsCount = deck.topics.reduce((sum, topic) => sum + topic.cards.length, 0);
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";

    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(
      store,
      uid,
      "flashcard_topics",
      deck.topics[topicIndex].id,
      buildTopicRow(deck.topics[topicIndex], deck.id, uid),
    );
    queueSyncUpsert(
      store,
      uid,
      "flashcard_cards",
      nextCard.id,
      buildCardRow(nextCard, deck.topics[topicIndex].id, deck.id, uid),
    );
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, card: nextCard, deck, topic: deck.topics[topicIndex] };
  }

  function addCardToDeck(userId, deckId, card) {
    const deck = loadDeckById(userId, deckId);
    if (!deck) return { ok: false, reason: "deck_not_found" };

    let topic = Array.isArray(deck.topics) && deck.topics.length ? deck.topics[0] : null;
    if (!topic) {
      const createdTopic = createTopic(userId, deckId, "Geral");
      if (!createdTopic.ok) return { ok: false, reason: "topic_not_found" };
      topic = createdTopic.topic;
    }

    return addCardToTopic(userId, deckId, topic.id, card);
  }

  function deleteDeck(userId, deckId) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    if (!safeDeckId) return { ok: false, reason: "invalid_deck_id" };

    const store = readStore();
    const deckToRemove = store.decks
      .map(normalizeDeck)
      .find((deck) => safeUserId(deck.userId) === uid && String(deck.id || "") === safeDeckId);
    const nextDecks = store.decks
      .filter(
        (deck) => !(safeUserId(deck.userId) === uid && String(deck.id || "") === safeDeckId),
      )
      .map(normalizeDeck);

    if (nextDecks.length === store.decks.length) return { ok: false, reason: "deck_not_found" };
    store.decks = nextDecks;
    if (deckToRemove) {
      queueSyncDelete(store, uid, "flashcard_decks", deckToRemove.id);
      (Array.isArray(deckToRemove.topics) ? deckToRemove.topics : []).forEach((topic) => {
        queueSyncDelete(store, uid, "flashcard_topics", topic.id);
        (Array.isArray(topic.subtopics) ? topic.subtopics : []).forEach((subtopic) => {
          queueSyncDelete(store, uid, "flashcard_subtopics", subtopic.id);
        });
        (Array.isArray(topic.cards) ? topic.cards : []).forEach((card) => {
          queueSyncDelete(store, uid, "flashcard_cards", card.id);
          queueSyncDelete(store, uid, "flashcard_study_progress", card.id);
        });
      });
    }
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true };
  }

  function deleteTopic(userId, deckId, topicId) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    if (!safeDeckId || !safeTopicId) return { ok: false, reason: "invalid_ids" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicToRemove = deck.topics.find((topic) => String(topic.id) === safeTopicId) || null;
    const nextTopics = deck.topics.filter((topic) => String(topic.id) !== safeTopicId);
    if (nextTopics.length === deck.topics.length) return { ok: false, reason: "topic_not_found" };

    deck.topics = nextTopics.map((item, index) => ({ ...item, sortOrder: index }));
    deck.cardsCount = deck.topics.reduce((sum, topic) => sum + topic.cards.length, 0);
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";

    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    if (topicToRemove) {
      queueSyncDelete(store, uid, "flashcard_topics", topicToRemove.id);
      (Array.isArray(topicToRemove.subtopics) ? topicToRemove.subtopics : []).forEach((subtopic) => {
        queueSyncDelete(store, uid, "flashcard_subtopics", subtopic.id);
      });
      (Array.isArray(topicToRemove.cards) ? topicToRemove.cards : []).forEach((card) => {
        queueSyncDelete(store, uid, "flashcard_cards", card.id);
        queueSyncDelete(store, uid, "flashcard_study_progress", card.id);
      });
    }
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true };
  }

  function moveTopicToDeck(userId, sourceDeckId, topicId, targetDeckId) {
    const uid = safeUserId(userId);
    const safeSourceDeckId = String(sourceDeckId || "");
    const safeTopicId = String(topicId || "");
    const safeTargetDeckId = String(targetDeckId || "");
    if (!safeSourceDeckId || !safeTopicId || !safeTargetDeckId) return { ok: false, reason: "invalid_ids" };
    if (safeSourceDeckId === safeTargetDeckId) return { ok: false, reason: "same_deck" };

    const store = readStore();
    const sourceIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeSourceDeckId,
    );
    if (sourceIndex < 0) return { ok: false, reason: "source_deck_not_found" };

    const targetIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeTargetDeckId,
    );
    if (targetIndex < 0) return { ok: false, reason: "target_deck_not_found" };

    const sourceDeck = normalizeDeck(store.decks[sourceIndex]);
    const topicToMove = sourceDeck.topics.find((topic) => String(topic.id) === safeTopicId) || null;
    if (!topicToMove) return { ok: false, reason: "topic_not_found" };

    if (existsTopicName(uid, safeTargetDeckId, topicToMove.name)) {
      return { ok: false, reason: "duplicate_topic_name" };
    }

    const targetDeck = normalizeDeck(store.decks[targetIndex]);

    sourceDeck.topics = sourceDeck.topics
      .filter((topic) => String(topic.id) !== safeTopicId)
      .map((item, index) => ({ ...item, sortOrder: index }));
    sourceDeck.cardsCount = sourceDeck.topics.reduce((sum, topic) => sum + topic.cards.length, 0);
    sourceDeck.updatedAt = new Date().toISOString();
    sourceDeck.syncStatus = "pending";

    const movedTopic = { ...topicToMove, updatedAt: new Date().toISOString() };
    targetDeck.topics = [movedTopic, ...targetDeck.topics].map((item, index) => ({ ...item, sortOrder: index }));
    targetDeck.cardsCount = targetDeck.topics.reduce((sum, topic) => sum + topic.cards.length, 0);
    targetDeck.updatedAt = new Date().toISOString();
    targetDeck.syncStatus = "pending";

    store.decks[sourceIndex] = sourceDeck;
    store.decks[targetIndex] = targetDeck;

    queueSyncUpsert(store, uid, "flashcard_decks", sourceDeck.id, buildDeckRow(sourceDeck, uid));
    queueSyncUpsert(store, uid, "flashcard_decks", targetDeck.id, buildDeckRow(targetDeck, uid));

    const finalTopic = targetDeck.topics.find((topic) => String(topic.id) === safeTopicId);
    queueSyncUpsert(store, uid, "flashcard_topics", finalTopic.id, buildTopicRow(finalTopic, targetDeck.id, uid));
    (Array.isArray(finalTopic.subtopics) ? finalTopic.subtopics : []).forEach((subtopic) => {
      queueSyncUpsert(
        store,
        uid,
        "flashcard_subtopics",
        subtopic.id,
        buildSubtopicRow(subtopic, finalTopic.id, targetDeck.id, uid),
      );
    });
    (Array.isArray(finalTopic.cards) ? finalTopic.cards : []).forEach((card) => {
      queueSyncUpsert(store, uid, "flashcard_cards", card.id, buildCardRow(card, finalTopic.id, targetDeck.id, uid));
    });

    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, topic: finalTopic, sourceDeck, targetDeck };
  }

  function deleteCardFromTopic(userId, deckId, topicId, cardId) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    const safeCardId = String(cardId || "");
    if (!safeDeckId || !safeTopicId || !safeCardId) return { ok: false, reason: "invalid_ids" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicIndex = deck.topics.findIndex((topic) => String(topic.id) === safeTopicId);
    if (topicIndex < 0) return { ok: false, reason: "topic_not_found" };

    const nextCards = deck.topics[topicIndex].cards.filter((item) => String(item.id) !== safeCardId);
    if (nextCards.length === deck.topics[topicIndex].cards.length) {
      return { ok: false, reason: "card_not_found" };
    }

    deck.topics[topicIndex].cards = nextCards.map((item, index) => ({ ...item, sortOrder: index }));
    deck.topics[topicIndex].updatedAt = new Date().toISOString();
    deck.cardsCount = deck.topics.reduce((sum, topic) => sum + topic.cards.length, 0);
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";

    store.decks[deckIndex] = deck;
    queueSyncDelete(store, uid, "flashcard_cards", safeCardId);
    queueSyncDelete(store, uid, "flashcard_study_progress", safeCardId);
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(
      store,
      uid,
      "flashcard_topics",
      deck.topics[topicIndex].id,
      buildTopicRow(deck.topics[topicIndex], deck.id, uid),
    );
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    const studyStore = readStudyStore();
    if (studyStore[uid] && studyStore[uid][safeCardId]) {
      delete studyStore[uid][safeCardId];
      if (!writeStudyStore(studyStore)) return { ok: false, reason: "local_write_failed" };
    }

    enqueueUserSync(uid);
    return { ok: true };
  }

  function renameCardInTopic(userId, deckId, topicId, cardId, nextFrontHtml) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    const safeCardId = String(cardId || "");
    const safeFrontHtml = String(nextFrontHtml || "").trim();

    if (!safeDeckId || !safeTopicId || !safeCardId) return { ok: false, reason: "invalid_ids" };
    if (!safeFrontHtml) return { ok: false, reason: "empty_name" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicIndex = deck.topics.findIndex((topic) => String(topic.id) === safeTopicId);
    if (topicIndex < 0) return { ok: false, reason: "topic_not_found" };

    const cardIndex = deck.topics[topicIndex].cards.findIndex((card) => String(card.id) === safeCardId);
    if (cardIndex < 0) return { ok: false, reason: "card_not_found" };

    deck.topics[topicIndex].cards[cardIndex].frontHtml = safeFrontHtml;
    deck.topics[topicIndex].cards[cardIndex].updatedAt = new Date().toISOString();
    deck.topics[topicIndex].updatedAt = new Date().toISOString();
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";

    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(
      store,
      uid,
      "flashcard_topics",
      deck.topics[topicIndex].id,
      buildTopicRow(deck.topics[topicIndex], deck.id, uid),
    );
    queueSyncUpsert(
      store,
      uid,
      "flashcard_cards",
      deck.topics[topicIndex].cards[cardIndex].id,
      buildCardRow(deck.topics[topicIndex].cards[cardIndex], deck.topics[topicIndex].id, deck.id, uid),
    );
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, card: deck.topics[topicIndex].cards[cardIndex] };
  }

  function updateCardInTopic(userId, deckId, topicId, cardId, payload) {
    const uid = safeUserId(userId);
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    const safeCardId = String(cardId || "");
    const frontHtml = String(payload?.frontHtml || "").trim();
    const backHtml = String(payload?.backHtml || "").trim();
    const reverse = Boolean(payload?.reverse);
    const rawSubtopicId = String(payload?.subtopicId || "").trim();
    const subtopicId = rawSubtopicId || null;

    if (!safeDeckId || !safeTopicId || !safeCardId) return { ok: false, reason: "invalid_ids" };
    if (!frontHtml && !backHtml) return { ok: false, reason: "empty_card" };

    const store = readStore();
    const deckIndex = store.decks.findIndex(
      (entry) => safeUserId(entry.userId) === uid && String(entry.id || "") === safeDeckId,
    );
    if (deckIndex < 0) return { ok: false, reason: "deck_not_found" };

    const deck = normalizeDeck(store.decks[deckIndex]);
    const topicIndex = deck.topics.findIndex((topic) => String(topic.id) === safeTopicId);
    if (topicIndex < 0) return { ok: false, reason: "topic_not_found" };
    const subtopics = Array.isArray(deck.topics[topicIndex].subtopics) ? deck.topics[topicIndex].subtopics : [];
    if (subtopicId && !subtopics.some((item) => String(item.id) === subtopicId)) {
      return { ok: false, reason: "subtopic_not_found" };
    }

    const cardIndex = deck.topics[topicIndex].cards.findIndex((card) => String(card.id) === safeCardId);
    if (cardIndex < 0) return { ok: false, reason: "card_not_found" };

    deck.topics[topicIndex].cards[cardIndex].frontHtml = frontHtml;
    deck.topics[topicIndex].cards[cardIndex].backHtml = backHtml;
    deck.topics[topicIndex].cards[cardIndex].reverse = reverse;
    deck.topics[topicIndex].cards[cardIndex].subtopicId = subtopicId;
    deck.topics[topicIndex].cards[cardIndex].updatedAt = new Date().toISOString();
    deck.topics[topicIndex].updatedAt = new Date().toISOString();
    deck.updatedAt = new Date().toISOString();
    deck.syncStatus = "pending";

    store.decks[deckIndex] = deck;
    queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    queueSyncUpsert(
      store,
      uid,
      "flashcard_topics",
      deck.topics[topicIndex].id,
      buildTopicRow(deck.topics[topicIndex], deck.id, uid),
    );
    queueSyncUpsert(
      store,
      uid,
      "flashcard_cards",
      deck.topics[topicIndex].cards[cardIndex].id,
      buildCardRow(deck.topics[topicIndex].cards[cardIndex], deck.topics[topicIndex].id, deck.id, uid),
    );
    if (!writeStore(store)) return { ok: false, reason: "local_write_failed" };

    enqueueUserSync(uid);
    return { ok: true, card: deck.topics[topicIndex].cards[cardIndex] };
  }

  function saveDeckOrderByUser(userId, orderedIds) {
    const uid = safeUserId(userId);
    if (!Array.isArray(orderedIds) || !orderedIds.length) return loadDecksByUser(uid);

    const store = readStore();
    const userDecks = store.decks
      .filter((deck) => safeUserId(deck.userId) === uid)
      .map(normalizeDeck);
    const otherDecks = store.decks
      .filter((deck) => safeUserId(deck.userId) !== uid)
      .map(normalizeDeck);

    const byId = new Map(userDecks.map((deck) => [deck.id, deck]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    const missing = userDecks.filter((deck) => !orderedIds.includes(deck.id));
    const nextUserDecks = [...reordered, ...missing].map((deck, index) => ({
      ...deck,
      sortOrder: index,
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
    }));

    store.decks = [...otherDecks, ...nextUserDecks];
    nextUserDecks.forEach((deck) => {
      queueSyncUpsert(store, uid, "flashcard_decks", deck.id, buildDeckRow(deck, uid));
    });
    if (!writeStore(store)) return loadDecksByUser(uid);

    enqueueUserSync(uid);
    return loadDecksByUser(uid);
  }

  function clearLocalCacheByUser(userId) {
    const uid = safeUserId(userId);
    const store = readStore();
    store.decks = store.decks.filter((deck) => safeUserId(deck.userId) !== uid);
    if (store.lastHydratedAtByUser && store.lastHydratedAtByUser[uid]) {
      delete store.lastHydratedAtByUser[uid];
    }
    if (store.remoteFingerprintByUser && store.remoteFingerprintByUser[uid]) {
      delete store.remoteFingerprintByUser[uid];
    }
    clearPendingSyncOpsForUser(store, uid);
    writeStore(store);

    const studyStore = readStudyStore();
    if (studyStore[uid]) {
      delete studyStore[uid];
      writeStudyStore(studyStore);
    }

    return [];
  }

  function clearDecksByUser(userId, options = {}) {
    const uid = safeUserId(userId);
    const removeRemote = options?.removeRemote !== false;
    clearLocalCacheByUser(uid);

    if (removeRemote) {
      enqueueUserSync(uid);
      flushSyncQueue();
    }

    return [];
  }

  function getUserStudyEntries(userId) {
    const uid = safeUserId(userId);
    const store = readStudyStore();
    const userEntries = store[uid];
    return userEntries && typeof userEntries === "object" ? userEntries : {};
  }

  function setUserStudyEntries(userId, entries) {
    const uid = safeUserId(userId);
    const store = readStudyStore();
    store[uid] = entries && typeof entries === "object" ? entries : {};
    return writeStudyStore(store);
  }

  function chunkArray(list, size = CHUNK_SIZE) {
    const result = [];
    for (let i = 0; i < list.length; i += size) {
      result.push(list.slice(i, i + size));
    }
    return result;
  }

  function getUserDeckSnapshot(userId) {
    const uid = safeUserId(userId);
    const decks = loadDecksByUser(uid);

    const deckRows = [];
    const topicRows = [];
    const subtopicRows = [];
    const cardRows = [];

    decks.forEach((deck, deckIndex) => {
      const deckRow = {
        id: String(deck.id),
        user_id: uid,
        name: String(deck.name || ""),
        color: String(deck.color || DEFAULT_DECK_COLOR),
        sort_order: Number.isFinite(deck?.sortOrder) ? Number(deck.sortOrder) : deckIndex,
        created_at: deck.createdAt || new Date().toISOString(),
        updated_at: deck.updatedAt || new Date().toISOString(),
      };
      deckRows.push(deckRow);

      (Array.isArray(deck.topics) ? deck.topics : []).forEach((topic, topicIndex) => {
        const topicRow = {
          id: String(topic.id),
          deck_id: String(deck.id),
          user_id: uid,
          name: String(topic.name || ""),
          sort_order: Number.isFinite(topic?.sortOrder) ? Number(topic.sortOrder) : topicIndex,
          created_at: topic.createdAt || new Date().toISOString(),
          updated_at: topic.updatedAt || new Date().toISOString(),
        };
        topicRows.push(topicRow);

        (Array.isArray(topic.subtopics) ? topic.subtopics : []).forEach((subtopic, subtopicIndex) => {
          subtopicRows.push({
            id: String(subtopic.id),
            topic_id: String(topic.id),
            deck_id: String(deck.id),
            user_id: uid,
            name: String(subtopic.name || ""),
            sort_order: Number.isFinite(subtopic?.sortOrder) ? Number(subtopic.sortOrder) : subtopicIndex,
            created_at: subtopic.createdAt || new Date().toISOString(),
            updated_at: subtopic.updatedAt || new Date().toISOString(),
          });
        });

        (Array.isArray(topic.cards) ? topic.cards : []).forEach((card, cardIndex) => {
          cardRows.push({
            id: String(card.id),
            topic_id: String(topic.id),
            deck_id: String(deck.id),
            subtopic_id: card?.subtopicId ? String(card.subtopicId) : null,
            user_id: uid,
            front_html: String(card.frontHtml || ""),
            back_html: String(card.backHtml || ""),
            reverse: Boolean(card.reverse),
            sort_order: Number.isFinite(card?.sortOrder) ? Number(card.sortOrder) : cardIndex,
            created_at: card.createdAt || new Date().toISOString(),
            updated_at: card.updatedAt || new Date().toISOString(),
          });
        });
      });
    });

    const studyEntries = getUserStudyEntries(uid);
    const existingCardIds = new Set(cardRows.map((card) => card.id));
    const studyRows = Object.entries(studyEntries)
      .filter(([cardId, entry]) => existingCardIds.has(String(cardId)) && entry && typeof entry === "object")
      .map(([cardId, entry]) => ({
        user_id: uid,
        card_id: String(cardId),
        status: entry.status === "mastered" ? "mastered" : "in_progress",
        last_studied_date: entry.lastStudiedDate || null,
        next_review_at: entry.nextReviewAt || null,
        updated_at: entry.updatedAt || new Date().toISOString(),
      }));

    return { deckRows, topicRows, subtopicRows, cardRows, studyRows };
  }

  async function upsertRows(table, rows, onConflict) {
    if (!rows.length) return;
    const syncGateway = await getSyncGateway();
    if (!syncGateway || typeof syncGateway.enqueueUpsert !== "function") {
      throw new Error("sync_gateway_unavailable");
    }
    if (table === "flashcard_study_progress" || table === "flashcard_cards") {
      const sampleUserId = rows[0]?.user_id || null;
      const batches = chunkRowsForSync(rows);
      for (let i = 0; i < batches.length; i += 1) {
        const batchRows = batches[i];
        await syncGateway.enqueueUpsert({
          table,
          key: `batch:${safeUserId(sampleUserId || "anonymous")}:${i}`,
          payload: batchRows,
          userId: sampleUserId,
          onConflict,
          flush: "none",
        });
      }
      return;
    }
    for (const row of rows) {
      const rowId = String(row?.id || row?.card_id || "");
      if (!rowId) continue;
      await syncGateway.enqueueUpsert({
        table,
        key: rowId,
        payload: row,
        userId: row?.user_id || null,
        onConflict,
        flush: "none",
      });
    }
  }

  async function deleteRowsByIds(table, userId, idColumn, ids) {
    if (!ids.length) return;
    const syncGateway = await getSyncGateway();
    if (!syncGateway || typeof syncGateway.enqueueDelete !== "function") {
      throw new Error("sync_gateway_unavailable");
    }
    if (table === "flashcard_study_progress" && idColumn === "card_id") {
      const uniqueIds = [...new Set(ids.map((id) => String(id || "")).filter(Boolean))];
      if (!uniqueIds.length) return;
      await syncGateway.enqueueDelete({
        table,
        key: `batch:${safeUserId(userId)}:card_id`,
        userId,
        filters: [
          { op: "eq", column: "user_id", value: userId },
          { op: "in", column: idColumn, values: uniqueIds },
        ],
        flush: "none",
      });
      return;
    }
    if (table === "flashcard_cards") {
      const uniqueIds = [...new Set(ids.map((id) => String(id || "")).filter(Boolean))];
      if (!uniqueIds.length) return;
      await syncGateway.enqueueDelete({
        table,
        key: `batch:${safeUserId(userId)}:${String(idColumn || "id")}`,
        userId,
        filters: [
          { op: "eq", column: "user_id", value: userId },
          { op: "in", column: String(idColumn || "id"), values: uniqueIds },
        ],
        flush: "none",
      });
      return;
    }
    for (const id of ids) {
      const safeId = String(id || "");
      if (!safeId) continue;
      await syncGateway.enqueueDelete({
        table,
        key: safeId,
        userId,
        filters: [
          { op: "eq", column: "user_id", value: userId },
          { op: "in", column: idColumn, values: [safeId] },
        ],
        flush: "none",
      });
    }
  }

  function getConflictByTable(table) {
    if (table === "flashcard_study_progress") return "user_id,card_id";
    return "id";
  }

  function getDeleteIdColumnByTable(table) {
    if (table === "flashcard_study_progress") return "card_id";
    return "id";
  }

  async function applyPendingSyncOpsToRemote(userId, pendingOps) {
    const uid = safeUserId(userId);
    if (!pendingOps || typeof pendingOps !== "object") return false;
    const upserts = pendingOps.upserts && typeof pendingOps.upserts === "object" ? pendingOps.upserts : {};
    const deletes = pendingOps.deletes && typeof pendingOps.deletes === "object" ? pendingOps.deletes : {};

    const tables = [
      "flashcard_decks",
      "flashcard_topics",
      "flashcard_subtopics",
      "flashcard_cards",
      "flashcard_study_progress",
    ];

    for (const table of tables) {
      const tableRowsMap = upserts[table];
      const rows = tableRowsMap && typeof tableRowsMap === "object" ? Object.values(tableRowsMap) : [];
      if (rows.length) {
        await upsertRows(table, rows, getConflictByTable(table));
      }
    }

    for (const table of tables) {
      const ids = Array.isArray(deletes[table]) ? deletes[table] : [];
      if (ids.length) {
        await deleteRowsByIds(table, uid, getDeleteIdColumnByTable(table), ids);
      }
    }

    return true;
  }

  async function fetchRemoteIds(userId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        deckIds: [],
        topicIds: [],
        subtopicIds: [],
        cardIds: [],
        progressCardIds: [],
      };
    }

    const [decksRes, topicsRes, subtopicsRes, cardsRes, progressRes] = await Promise.all([
      supabase.from("flashcard_decks").select("id").eq("user_id", userId),
      supabase.from("flashcard_topics").select("id").eq("user_id", userId),
      supabase.from("flashcard_subtopics").select("id").eq("user_id", userId),
      supabase.from("flashcard_cards").select("id").eq("user_id", userId),
      supabase.from("flashcard_study_progress").select("card_id").eq("user_id", userId),
    ]);

    if (decksRes.error) throw decksRes.error;
    if (topicsRes.error) throw topicsRes.error;
    if (subtopicsRes.error) throw subtopicsRes.error;
    if (cardsRes.error) throw cardsRes.error;
    if (progressRes.error) throw progressRes.error;

    return {
      deckIds: (decksRes.data || []).map((row) => String(row.id)),
      topicIds: (topicsRes.data || []).map((row) => String(row.id)),
      subtopicIds: (subtopicsRes.data || []).map((row) => String(row.id)),
      cardIds: (cardsRes.data || []).map((row) => String(row.id)),
      progressCardIds: (progressRes.data || []).map((row) => String(row.card_id)),
    };
  }

  function difference(base, next) {
    const set = new Set(next.map(String));
    return base.filter((item) => !set.has(String(item)));
  }

  function hasRecentHydrationForUser(userId) {
    const uid = safeUserId(userId);
    const store = readStore();
    const hydratedAt = store?.lastHydratedAtByUser?.[uid];
    const hydratedTs = Date.parse(String(hydratedAt || ""));
    return Number.isFinite(hydratedTs) && Date.now() - hydratedTs <= SAFE_DELETE_HYDRATION_WINDOW_MS;
  }

  function getCachedRemoteFingerprintForUser(userId) {
    const uid = safeUserId(userId);
    const store = readStore();
    const fp = store?.remoteFingerprintByUser?.[uid];
    return fp && typeof fp === "object" ? fp : null;
  }

  function setCachedRemoteFingerprintForUser(userId, fingerprint) {
    const uid = safeUserId(userId);
    if (!fingerprint || typeof fingerprint !== "object") return false;
    const store = readStore();
    store.remoteFingerprintByUser = {
      ...(store.remoteFingerprintByUser && typeof store.remoteFingerprintByUser === "object"
        ? store.remoteFingerprintByUser
        : {}),
      [uid]: fingerprint,
    };
    return writeStore(store);
  }

  function buildTableFingerprintFromRows(rows, updatedField = "updated_at") {
    const list = Array.isArray(rows) ? rows : [];
    let maxUpdatedAt = null;
    list.forEach((row) => {
      const value = row && typeof row === "object" ? row[updatedField] : null;
      const parsed = Date.parse(String(value || ""));
      if (!Number.isFinite(parsed)) return;
      if (!maxUpdatedAt || parsed > Date.parse(String(maxUpdatedAt))) {
        maxUpdatedAt = new Date(parsed).toISOString();
      }
    });
    return {
      count: list.length,
      maxUpdatedAt,
    };
  }

  function normalizeTableFingerprint(source, updatedField = "updated_at") {
    const data = Array.isArray(source?.data) ? source.data : [];
    const count =
      Number.isFinite(source?.count) && Number(source.count) >= 0
        ? Number(source.count)
        : data.length;
    let maxUpdatedAt = null;
    if (data.length) {
      const first = data[0];
      const candidate = first && typeof first === "object" ? first[updatedField] : null;
      const parsed = Date.parse(String(candidate || ""));
      if (Number.isFinite(parsed)) maxUpdatedAt = new Date(parsed).toISOString();
    }
    return { count, maxUpdatedAt };
  }

  function fingerprintsEqual(a, b) {
    const left = a && typeof a === "object" ? a.tables || a : null;
    const right = b && typeof b === "object" ? b.tables || b : null;
    if (!left || !right) return false;
    const tables = [
      "flashcard_decks",
      "flashcard_topics",
      "flashcard_subtopics",
      "flashcard_cards",
      "flashcard_study_progress",
    ];
    return tables.every((table) => {
      const l = left[table] || {};
      const r = right[table] || {};
      return Number(l.count || 0) === Number(r.count || 0) && String(l.maxUpdatedAt || "") === String(r.maxUpdatedAt || "");
    });
  }

  async function fetchRemoteFingerprint(userId) {
    const uid = safeUserId(userId);
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const [decksRes, topicsRes, subtopicsRes, cardsRes, studyRes] = await Promise.all([
      supabase
        .from("flashcard_decks")
        .select("updated_at", { count: "exact" })
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(1),
      supabase
        .from("flashcard_topics")
        .select("updated_at", { count: "exact" })
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(1),
      supabase
        .from("flashcard_subtopics")
        .select("updated_at", { count: "exact" })
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(1),
      supabase
        .from("flashcard_cards")
        .select("updated_at", { count: "exact" })
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(1),
      supabase
        .from("flashcard_study_progress")
        .select("updated_at", { count: "exact" })
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    if (decksRes.error) throw decksRes.error;
    if (topicsRes.error) throw topicsRes.error;
    if (subtopicsRes.error) throw subtopicsRes.error;
    if (cardsRes.error) throw cardsRes.error;
    if (studyRes.error) throw studyRes.error;

    return {
      version: 1,
      checkedAt: new Date().toISOString(),
      tables: {
        flashcard_decks: normalizeTableFingerprint(decksRes),
        flashcard_topics: normalizeTableFingerprint(topicsRes),
        flashcard_subtopics: normalizeTableFingerprint(subtopicsRes),
        flashcard_cards: normalizeTableFingerprint(cardsRes),
        flashcard_study_progress: normalizeTableFingerprint(studyRes),
      },
    };
  }

  async function syncUserSnapshotToRemote(userId) {
    const uid = safeUserId(userId);
    if (!canUseRemote(uid)) return;

    const currentStore = readStore();
    const pendingOps = getPendingSyncOpsForUser(currentStore, uid);
    if (hasPendingSyncOps(pendingOps)) {
      await applyPendingSyncOpsToRemote(uid, pendingOps);
      const syncGatewayInc = await getSyncGateway();
      if (syncGatewayInc && typeof syncGatewayInc.flushNow === "function") {
        const flush = await syncGatewayInc.flushNow({ timeoutMs: 20000 });
        if (!flush?.ok) throw new Error(`outbox_flush_timeout:${flush?.reason || "unknown"}`);
      }
      const updatedStore = readStore();
      updatedStore.decks = updatedStore.decks.map((deck) => {
        if (safeUserId(deck.userId) !== uid) return deck;
        return {
          ...deck,
          syncStatus: "synced",
        };
      });
      clearPendingSyncOpsForUser(updatedStore, uid);
      writeStore(updatedStore);
      return;
    }

    const { deckRows, topicRows, subtopicRows, cardRows, studyRows } = getUserDeckSnapshot(uid);
    const remoteIds = await fetchRemoteIds(uid);

    await upsertRows("flashcard_decks", deckRows, "id");
    await upsertRows("flashcard_topics", topicRows, "id");
    await upsertRows("flashcard_subtopics", subtopicRows, "id");
    await upsertRows("flashcard_cards", cardRows, "id");
    await upsertRows("flashcard_study_progress", studyRows, "user_id,card_id");

    const localDeckIds = deckRows.map((row) => row.id);
    const localTopicIds = topicRows.map((row) => row.id);
    const localSubtopicIds = subtopicRows.map((row) => row.id);
    const localCardIds = cardRows.map((row) => row.id);
    const localProgressCardIds = studyRows.map((row) => row.card_id);

    const progressToDelete = difference(remoteIds.progressCardIds, localProgressCardIds);
    const cardsToDelete = difference(remoteIds.cardIds, localCardIds);
    const subtopicsToDelete = difference(remoteIds.subtopicIds, localSubtopicIds);
    const topicsToDelete = difference(remoteIds.topicIds, localTopicIds);
    const decksToDelete = difference(remoteIds.deckIds, localDeckIds);

    const canRunDeletePhase = hasRecentHydrationForUser(uid);
    if (canRunDeletePhase) {
      await deleteRowsByIds("flashcard_study_progress", uid, "card_id", progressToDelete);
      await deleteRowsByIds("flashcard_cards", uid, "id", cardsToDelete);
      await deleteRowsByIds("flashcard_subtopics", uid, "id", subtopicsToDelete);
      await deleteRowsByIds("flashcard_topics", uid, "id", topicsToDelete);
      await deleteRowsByIds("flashcard_decks", uid, "id", decksToDelete);
    } else if (
      progressToDelete.length ||
      cardsToDelete.length ||
      subtopicsToDelete.length ||
      topicsToDelete.length ||
      decksToDelete.length
    ) {
      if (DEBUG_CLIENT_LOGS) {
        console.info("[flashcardsCache] delete phase skipped (snapshot may be stale)", {
          userId: uid,
          pendingDeletes: {
            progress: progressToDelete.length,
            cards: cardsToDelete.length,
            subtopics: subtopicsToDelete.length,
            topics: topicsToDelete.length,
            decks: decksToDelete.length,
          },
        });
      }
    }

    const syncGateway = await getSyncGateway();
    if (syncGateway && typeof syncGateway.flushNow === "function") {
      const flush = await syncGateway.flushNow({ timeoutMs: 20000 });
      if (!flush?.ok) throw new Error(`outbox_flush_timeout:${flush?.reason || "unknown"}`);
    }

    const store = readStore();
    store.decks = store.decks.map((deck) => {
      if (safeUserId(deck.userId) !== uid) return deck;
      return {
        ...deck,
        syncStatus: "synced",
      };
    });
    clearPendingSyncOpsForUser(store, uid);
    writeStore(store);
  }

  function enqueueUserSync(userId) {
    const uid = safeUserId(userId);
    if (!canUseRemote(uid)) return;
    syncState.pendingUsers.add(uid);
    if (syncState.timer) clearTimeout(syncState.timer);
    syncState.timer = setTimeout(() => {
      flushSyncQueue();
    }, SYNC_DEBOUNCE_MS);
  }

  function scheduleStudySync(userId) {
    enqueueUserSync(userId);
  }

  function runUserSyncLocked(userId, task) {
    const uid = safeUserId(userId);
    const previous = syncState.userSyncLocks.get(uid) || Promise.resolve();
    const next = previous.catch(() => {}).then(() => task());
    syncState.userSyncLocks.set(
      uid,
      next.finally(() => {
        if (syncState.userSyncLocks.get(uid) === next) syncState.userSyncLocks.delete(uid);
      }),
    );
    return next;
  }

  async function flushSyncQueue() {
    if (syncState.inFlight) return;
    syncState.inFlight = true;

    try {
      while (syncState.pendingUsers.size > 0) {
        const uid = syncState.pendingUsers.values().next().value;
        syncState.pendingUsers.delete(uid);
        try {
          await runUserSyncLocked(uid, () => syncUserSnapshotToRemote(uid));
          emitSyncStatus({ state: "synced", userId: uid, source: "queue" });
        } catch (error) {
          console.warn("[flashcardsCache] sync failed", error);
          emitSyncStatus({
            state: "retrying",
            userId: uid,
            source: "queue",
            reason: error instanceof Error ? error.message : String(error || "sync_failed"),
          });
          syncState.pendingUsers.add(uid);
          break;
        }
      }
    } finally {
      syncState.inFlight = false;
      if (syncState.pendingUsers.size > 0) {
        if (syncState.timer) clearTimeout(syncState.timer);
        syncState.timer = setTimeout(() => {
          flushSyncQueue();
        }, 2500);
      }
    }
  }

  async function flushUserNow(userId) {
    const uid = safeUserId(userId);
    if (!canUseRemote(uid)) return { ok: true, mode: "local_only" };
    syncState.pendingUsers.delete(uid);
    try {
      await runUserSyncLocked(uid, () => syncUserSnapshotToRemote(uid));
      emitSyncStatus({ state: "synced", userId: uid, source: "flush_now" });
    } catch (error) {
      syncState.pendingUsers.add(uid);
      if (syncState.timer) clearTimeout(syncState.timer);
      syncState.timer = setTimeout(() => {
        flushSyncQueue();
      }, 2500);
      emitSyncStatus({
        state: "retrying",
        userId: uid,
        source: "flush_now",
        reason: error instanceof Error ? error.message : String(error || "sync_failed"),
      });
      throw error;
    }
    return { ok: true, mode: "synced" };
  }

  function hasPendingSyncForUser(userId) {
    const uid = safeUserId(userId);
    if (syncState.pendingUsers.has(uid)) return true;
    const store = readStore();
    if (hasPendingSyncOps(getPendingSyncOpsForUser(store, uid))) return true;
    const decks = loadDecksByUser(uid);
    return decks.some((deck) => String(deck?.syncStatus || "") === "pending");
  }

  function composeDecksFromRemoteRows(deckRows, topicRows, subtopicRows, cardRows) {
    const topicsByDeck = new Map();
    const subtopicsByTopic = new Map();
    const cardsByTopic = new Map();

    (subtopicRows || []).forEach((row) => {
      const topicId = String(row.topic_id || "");
      if (!subtopicsByTopic.has(topicId)) subtopicsByTopic.set(topicId, []);
      subtopicsByTopic.get(topicId).push({
        id: String(row.id),
        name: String(row.name || ""),
        sortOrder: Number.isFinite(row.sort_order) ? Number(row.sort_order) : 0,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      });
    });

    (cardRows || []).forEach((row) => {
      const topicId = String(row.topic_id || "");
      if (!cardsByTopic.has(topicId)) cardsByTopic.set(topicId, []);
      cardsByTopic.get(topicId).push({
        id: String(row.id),
        subtopicId: row.subtopic_id ? String(row.subtopic_id) : null,
        frontHtml: String(row.front_html || ""),
        backHtml: String(row.back_html || ""),
        reverse: Boolean(row.reverse),
        sortOrder: Number.isFinite(row.sort_order) ? Number(row.sort_order) : 0,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      });
    });

    (topicRows || []).forEach((row) => {
      const deckId = String(row.deck_id || "");
      const topicId = String(row.id || "");
      if (!topicsByDeck.has(deckId)) topicsByDeck.set(deckId, []);
      const subtopics = (subtopicsByTopic.get(topicId) || [])
        .sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return String(a.createdAt).localeCompare(String(b.createdAt));
        })
        .map((subtopic, index) => ({ ...subtopic, sortOrder: index }));
      const cards = (cardsByTopic.get(topicId) || [])
        .sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return String(a.createdAt).localeCompare(String(b.createdAt));
        })
        .map((card, index) => ({ ...card, sortOrder: index }));

      topicsByDeck.get(deckId).push({
        id: topicId,
        name: String(row.name || ""),
        cards,
        subtopics,
        sortOrder: Number.isFinite(row.sort_order) ? Number(row.sort_order) : 0,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      });
    });

    return (deckRows || [])
      .map((row) => {
        const deckId = String(row.id || "");
        const topics = (topicsByDeck.get(deckId) || [])
          .sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return String(a.createdAt).localeCompare(String(b.createdAt));
          })
          .map((topic, index) => ({ ...topic, sortOrder: index }));

        return {
          id: deckId,
          userId: String(row.user_id || ""),
          name: String(row.name || ""),
          color: String(row.color || DEFAULT_DECK_COLOR),
          topics,
          cards: [],
          cardsCount: topics.reduce((sum, topic) => sum + topic.cards.length, 0),
          sortOrder: Number.isFinite(row.sort_order) ? Number(row.sort_order) : 0,
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          syncStatus: "synced",
        };
      })
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return String(a.createdAt).localeCompare(String(b.createdAt));
      })
      .map((deck, index) => ({ ...deck, sortOrder: index }));
  }

  function composeStudyEntriesFromRows(rows) {
    const next = {};
    (rows || []).forEach((row) => {
      const cardId = String(row.card_id || "");
      if (!cardId) return;
      next[cardId] = {
        status: row.status === "mastered" ? "mastered" : "in_progress",
        lastStudiedDate: row.last_studied_date || null,
        nextReviewAt: row.next_review_at || null,
        updatedAt: row.updated_at || new Date().toISOString(),
      };
    });
    return next;
  }

  async function fetchRemoteSnapshot(userId) {
    const uid = safeUserId(userId);
    const supabase = getSupabaseClient();
    if (!supabase) return { decks: [], studyEntries: {} };

    const [decksRes, topicsRes, subtopicsRes, cardsRes, studyRes] = await Promise.all([
      supabase
        .from("flashcard_decks")
        .select("id,user_id,name,color,sort_order,created_at,updated_at")
        .eq("user_id", uid)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("flashcard_topics")
        .select("id,deck_id,user_id,name,sort_order,created_at,updated_at")
        .eq("user_id", uid)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("flashcard_subtopics")
        .select("id,topic_id,deck_id,user_id,name,sort_order,created_at,updated_at")
        .eq("user_id", uid)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("flashcard_cards")
        .select("id,topic_id,deck_id,subtopic_id,user_id,front_html,back_html,reverse,sort_order,created_at,updated_at")
        .eq("user_id", uid)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("flashcard_study_progress")
        .select("card_id,status,last_studied_date,next_review_at,updated_at")
        .eq("user_id", uid),
    ]);

    if (decksRes.error) throw decksRes.error;
    if (topicsRes.error) throw topicsRes.error;
    if (subtopicsRes.error) throw subtopicsRes.error;
    if (cardsRes.error) throw cardsRes.error;
    if (studyRes.error) throw studyRes.error;

    const decksData = decksRes.data || [];
    const topicsData = topicsRes.data || [];
    const subtopicsData = subtopicsRes.data || [];
    const cardsData = cardsRes.data || [];
    const studyData = studyRes.data || [];

    return {
      decks: composeDecksFromRemoteRows(
        decksData,
        topicsData,
        subtopicsData,
        cardsData,
      ),
      studyEntries: composeStudyEntriesFromRows(studyData),
      fingerprint: {
        version: 1,
        checkedAt: new Date().toISOString(),
        tables: {
          flashcard_decks: buildTableFingerprintFromRows(decksData),
          flashcard_topics: buildTableFingerprintFromRows(topicsData),
          flashcard_subtopics: buildTableFingerprintFromRows(subtopicsData),
          flashcard_cards: buildTableFingerprintFromRows(cardsData),
          flashcard_study_progress: buildTableFingerprintFromRows(studyData),
        },
      },
    };
  }

  function replaceLocalUserSnapshot(userId, decks, studyEntries) {
    const uid = safeUserId(userId);
    const store = readStore();

    // Proteção contra corrida: se uma mutação local (criar/editar/mover cartão,
    // tópico, deck...) ficou pendente de sync depois que este snapshot remoto
    // começou a ser buscado, não sobrescreva o estado local com dados mais
    // antigos — isso apagaria a mudança do usuário e removeria seu registro
    // pendente da fila de sync. Aborta o replace; a mudança pendente segue
    // sendo sincronizada normalmente e um próximo ciclo de hidratação tenta de novo.
    if (hasPendingSyncOps(getPendingSyncOpsForUser(store, uid))) {
      return false;
    }

    const otherDecks = store.decks.filter((deck) => safeUserId(deck.userId) !== uid);

    store.decks = [...otherDecks, ...(Array.isArray(decks) ? decks : [])];
    store.lastHydratedAtByUser = {
      ...(store.lastHydratedAtByUser || {}),
      [uid]: new Date().toISOString(),
    };
    clearPendingSyncOpsForUser(store, uid);
    const wroteCache = writeStore(store);
    if (!wroteCache) {
      throw new Error("local_snapshot_write_failed");
    }
    const wroteStudy = setUserStudyEntries(uid, studyEntries || {});
    if (!wroteStudy) throw new Error("local_snapshot_write_failed");
    return true;
  }

  function markLocalUserHydrationFresh(userId) {
    const uid = safeUserId(userId);
    const store = readStore();
    store.lastHydratedAtByUser = {
      ...(store.lastHydratedAtByUser || {}),
      [uid]: new Date().toISOString(),
    };
    writeStore(store);
  }

  function parseTimestamp(value) {
    const ts = Date.parse(String(value || ""));
    return Number.isFinite(ts) ? ts : 0;
  }

  function sortByOrderThenCreated(items) {
    return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
      const ao = Number.isFinite(a?.sortOrder) ? Number(a.sortOrder) : Number.MAX_SAFE_INTEGER;
      const bo = Number.isFinite(b?.sortOrder) ? Number(b.sortOrder) : Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return String(a?.createdAt || "").localeCompare(String(b?.createdAt || ""));
    });
  }

  function reindexSortOrder(items) {
    return sortByOrderThenCreated(items).map((item, index) => ({ ...item, sortOrder: index }));
  }

  function chooseEntityVersion(localEntity, remoteEntity, options = {}) {
    const preferLocal = options.preferLocal === true;
    if (!remoteEntity) return { entity: localEntity, fromLocal: true };
    if (!localEntity) return { entity: remoteEntity, fromLocal: false };

    const localTs = parseTimestamp(localEntity.updatedAt || localEntity.createdAt);
    const remoteTs = parseTimestamp(remoteEntity.updatedAt || remoteEntity.createdAt);

    if (preferLocal) return { entity: localEntity, fromLocal: true };
    if (localTs > remoteTs) return { entity: localEntity, fromLocal: true };
    if (remoteTs > localTs) return { entity: remoteEntity, fromLocal: false };
    return { entity: remoteEntity, fromLocal: false };
  }

  function mergeEntityArraysById(localItems, remoteItems, mergeSameId) {
    const localList = Array.isArray(localItems) ? localItems : [];
    const remoteList = Array.isArray(remoteItems) ? remoteItems : [];
    const localMap = new Map(localList.map((item) => [String(item?.id || ""), item]).filter(([id]) => id));
    const remoteMap = new Map(remoteList.map((item) => [String(item?.id || ""), item]).filter(([id]) => id));
    const ids = new Set([...remoteMap.keys(), ...localMap.keys()]);
    const merged = [];
    let recoveredLocalChanges = false;

    ids.forEach((id) => {
      const localItem = localMap.get(id) || null;
      const remoteItem = remoteMap.get(id) || null;
      if (localItem && !remoteItem) recoveredLocalChanges = true;
      const result = mergeSameId(localItem, remoteItem);
      if (result?.item) merged.push(result.item);
      if (result?.recoveredLocalChanges) recoveredLocalChanges = true;
    });

    return { items: merged, recoveredLocalChanges };
  }

  function mergeSubtopics(localSubtopics, remoteSubtopics, preferLocalAll) {
    return mergeEntityArraysById(localSubtopics, remoteSubtopics, (localItem, remoteItem) => {
      if (preferLocalAll && !localItem && remoteItem) {
        return { item: null, recoveredLocalChanges: false };
      }
      if (!localItem) return { item: remoteItem, recoveredLocalChanges: false };
      if (!remoteItem) return { item: localItem, recoveredLocalChanges: true };
      const chosen = chooseEntityVersion(localItem, remoteItem, { preferLocal: preferLocalAll });
      return { item: chosen.entity, recoveredLocalChanges: chosen.fromLocal };
    });
  }

  function mergeCards(localCards, remoteCards, preferLocalAll) {
    return mergeEntityArraysById(localCards, remoteCards, (localItem, remoteItem) => {
      if (preferLocalAll && !localItem && remoteItem) {
        return { item: null, recoveredLocalChanges: false };
      }
      if (!localItem) return { item: remoteItem, recoveredLocalChanges: false };
      if (!remoteItem) return { item: localItem, recoveredLocalChanges: true };
      const chosen = chooseEntityVersion(localItem, remoteItem, { preferLocal: preferLocalAll });
      return { item: chosen.entity, recoveredLocalChanges: chosen.fromLocal };
    });
  }

  function mergeTopicEntities(localTopic, remoteTopic, preferLocalAll) {
    if (!localTopic) return { topic: remoteTopic, recoveredLocalChanges: false };
    if (!remoteTopic) return { topic: localTopic, recoveredLocalChanges: true };

    const chosenMeta = chooseEntityVersion(localTopic, remoteTopic, { preferLocal: preferLocalAll });
    const subtopicsMerge = mergeSubtopics(localTopic.subtopics, remoteTopic.subtopics, preferLocalAll);
    const cardsMerge = mergeCards(localTopic.cards, remoteTopic.cards, preferLocalAll);

    const topic = {
      ...chosenMeta.entity,
      subtopics: reindexSortOrder(subtopicsMerge.items),
      cards: reindexSortOrder(cardsMerge.items),
      updatedAt: chosenMeta.entity.updatedAt || new Date().toISOString(),
    };

    return {
      topic,
      recoveredLocalChanges:
        chosenMeta.fromLocal || subtopicsMerge.recoveredLocalChanges || cardsMerge.recoveredLocalChanges,
    };
  }

  function mergeTopics(localTopics, remoteTopics, preferLocalAll) {
    return mergeEntityArraysById(localTopics, remoteTopics, (localItem, remoteItem) => {
      if (preferLocalAll && !localItem && remoteItem) {
        return { item: null, recoveredLocalChanges: false };
      }
      if (!localItem) return { item: remoteItem, recoveredLocalChanges: false };
      if (!remoteItem) return { item: localItem, recoveredLocalChanges: true };
      const merged = mergeTopicEntities(localItem, remoteItem, preferLocalAll);
      return { item: merged.topic, recoveredLocalChanges: merged.recoveredLocalChanges };
    });
  }

  function mergeDeckEntities(localDeck, remoteDeck, userId) {
    if (!localDeck) return { deck: normalizeDeck(remoteDeck), recoveredLocalChanges: false };
    if (!remoteDeck) {
      const normalized = cloneDeckForUser(localDeck, userId);
      return { deck: normalized, recoveredLocalChanges: true };
    }

    const localNormalized = cloneDeckForUser(localDeck, userId);
    const remoteNormalized = cloneDeckForUser(remoteDeck, userId);
    const preferLocalAll = localNormalized.syncStatus === "pending";
    const chosenMeta = chooseEntityVersion(localNormalized, remoteNormalized, { preferLocal: preferLocalAll });
    const topicsMerge = mergeTopics(localNormalized.topics, remoteNormalized.topics, preferLocalAll);
    const topics = reindexSortOrder(topicsMerge.items);
    const deck = {
      ...chosenMeta.entity,
      userId: safeUserId(userId),
      topics,
      cards: [],
      cardsCount: topics.reduce((sum, topic) => sum + (Array.isArray(topic.cards) ? topic.cards.length : 0), 0),
      sortOrder: Number.isFinite(chosenMeta.entity?.sortOrder) ? Number(chosenMeta.entity.sortOrder) : 0,
      syncStatus:
        preferLocalAll || topicsMerge.recoveredLocalChanges ? "pending" : remoteNormalized.syncStatus || "synced",
    };

    return {
      deck,
      recoveredLocalChanges: preferLocalAll || chosenMeta.fromLocal || topicsMerge.recoveredLocalChanges,
    };
  }

  function mergeDeckSnapshotsForRecovery(userId, localDecks, remoteDecks) {
    const uid = safeUserId(userId);
    const localList = Array.isArray(localDecks) ? localDecks.map((deck) => cloneDeckForUser(deck, uid)) : [];
    const remoteList = Array.isArray(remoteDecks) ? remoteDecks.map((deck) => cloneDeckForUser(deck, uid)) : [];

    const localMap = new Map(localList.map((deck) => [String(deck?.id || ""), deck]).filter(([id]) => id));
    const remoteMap = new Map(remoteList.map((deck) => [String(deck?.id || ""), deck]).filter(([id]) => id));
    const ids = new Set([...remoteMap.keys(), ...localMap.keys()]);
    const merged = [];
    let recoveredLocalChanges = false;

    ids.forEach((id) => {
      const mergedDeck = mergeDeckEntities(localMap.get(id) || null, remoteMap.get(id) || null, uid);
      if (mergedDeck.deck) merged.push(mergedDeck.deck);
      if (mergedDeck.recoveredLocalChanges) recoveredLocalChanges = true;
    });

    return {
      decks: reindexSortOrder(merged),
      recoveredLocalChanges,
    };
  }

  function mergeStudyEntriesForRecovery(localEntries, remoteEntries) {
    const local = localEntries && typeof localEntries === "object" ? localEntries : {};
    const remote = remoteEntries && typeof remoteEntries === "object" ? remoteEntries : {};
    const ids = new Set([...Object.keys(remote), ...Object.keys(local)]);
    const merged = {};
    let recoveredLocalChanges = false;

    ids.forEach((id) => {
      const localEntry = local[id];
      const remoteEntry = remote[id];
      if (!localEntry) {
        if (remoteEntry && typeof remoteEntry === "object") merged[id] = remoteEntry;
        return;
      }
      if (!remoteEntry) {
        if (localEntry && typeof localEntry === "object") {
          merged[id] = localEntry;
          recoveredLocalChanges = true;
        }
        return;
      }
      const localTs = parseTimestamp(localEntry.updatedAt);
      const remoteTs = parseTimestamp(remoteEntry.updatedAt);
      const useLocal = localTs > remoteTs;
      merged[id] = useLocal ? localEntry : remoteEntry;
      if (useLocal) recoveredLocalChanges = true;
    });

    return { studyEntries: merged, recoveredLocalChanges };
  }

  function collectCardIdsFromDecks(decks) {
    const ids = new Set();
    (Array.isArray(decks) ? decks : []).forEach((deck) => {
      (Array.isArray(deck?.topics) ? deck.topics : []).forEach((topic) => {
        (Array.isArray(topic?.cards) ? topic.cards : []).forEach((card) => {
          const cardId = String(card?.id || "");
          if (cardId) ids.add(cardId);
        });
      });
    });
    return ids;
  }

  function cloneDeckForUser(deck, userId, options = {}) {
    const normalized = normalizeDeck(deck);
    const forcePending = options.forcePending === true;
    return {
      ...normalized,
      userId: safeUserId(userId),
      syncStatus: forcePending ? "pending" : normalized.syncStatus || "synced",
    };
  }

  function recoverAnonymousSnapshotIntoUser(userId) {
    const uid = safeUserId(userId);
    if (!canUseRemote(uid)) {
      return {
        hasAnonymousData: false,
        migratedDecksCount: 0,
        mergedStudyCount: 0,
        canClearAnonymousWithoutSync: false,
      };
    }

    const anonymousDecks = loadDecksByUser("anonymous");
    const anonymousStudyEntries = getUserStudyEntries("anonymous");
    const hasAnonymousData =
      anonymousDecks.length > 0 || Object.keys(anonymousStudyEntries).length > 0;

    if (!hasAnonymousData) {
      return {
        hasAnonymousData: false,
        migratedDecksCount: 0,
        mergedStudyCount: 0,
        canClearAnonymousWithoutSync: false,
      };
    }

    const currentDecks = loadDecksByUser(uid);
    const currentStudyEntries = getUserStudyEntries(uid);
    const currentDeckIds = new Set(currentDecks.map((deck) => String(deck.id || "")));
    const decksToMigrate = anonymousDecks
      .filter((deck) => !currentDeckIds.has(String(deck.id || "")))
      .map((deck) => cloneDeckForUser(deck, uid, { forcePending: true }));

    const mergedDecks = [...currentDecks, ...decksToMigrate].map((deck, index) => ({
      ...deck,
      sortOrder: index,
      syncStatus: deck?.syncStatus || "pending",
    }));

    const anonymousCardIds = collectCardIdsFromDecks(anonymousDecks);
    const mergedStudyEntries = { ...(currentStudyEntries || {}) };
    let mergedStudyCount = 0;

    Object.entries(anonymousStudyEntries || {}).forEach(([cardId, entry]) => {
      const safeCardId = String(cardId || "");
      if (!safeCardId || !anonymousCardIds.has(safeCardId)) return;
      if (mergedStudyEntries[safeCardId]) return;
      if (!entry || typeof entry !== "object") return;
      mergedStudyEntries[safeCardId] = entry;
      mergedStudyCount += 1;
    });

    const changed = decksToMigrate.length > 0 || mergedStudyCount > 0;
    if (changed) {
      replaceLocalUserSnapshot(uid, mergedDecks, mergedStudyEntries);
    }

    const mergedDeckIds = new Set(mergedDecks.map((deck) => String(deck.id || "")));
    const canClearAnonymousWithoutSync =
      !changed &&
      anonymousDecks.every((deck) => mergedDeckIds.has(String(deck.id || "")));

    return {
      hasAnonymousData,
      migratedDecksCount: decksToMigrate.length,
      mergedStudyCount,
      canClearAnonymousWithoutSync,
    };
  }

  async function initializeForUser(userId) {
    const uid = safeUserId(userId);
    if (!canUseRemote(uid)) return { ok: true, mode: "local_only" };

    if (syncState.initPromises.has(uid)) return syncState.initPromises.get(uid);

    const promise = (async () => {
      try {
        const localDecksBeforeHydration = loadDecksByUser(uid);
        const localStudyBeforeHydration = getUserStudyEntries(uid);
        const localPendingSync = hasPendingSyncForUser(uid);
        const hasAnonymousDataForRecovery =
          loadDecksByUser("anonymous").length > 0 ||
          Object.keys(getUserStudyEntries("anonymous")).length > 0;
        const cachedRemoteFingerprint = getCachedRemoteFingerprintForUser(uid);
        const remoteFingerprint = await fetchRemoteFingerprint(uid);
        const localSnapshotFingerprint = (() => {
          const snapshot = getUserDeckSnapshot(uid);
          return {
            version: 1,
            checkedAt: new Date().toISOString(),
            tables: {
              flashcard_decks: buildTableFingerprintFromRows(snapshot.deckRows),
              flashcard_topics: buildTableFingerprintFromRows(snapshot.topicRows),
              flashcard_subtopics: buildTableFingerprintFromRows(snapshot.subtopicRows),
              flashcard_cards: buildTableFingerprintFromRows(snapshot.cardRows),
              flashcard_study_progress: buildTableFingerprintFromRows(snapshot.studyRows),
            },
          };
        })();
        const canSkipRemoteSnapshot =
          remoteFingerprint &&
          cachedRemoteFingerprint &&
          fingerprintsEqual(remoteFingerprint, cachedRemoteFingerprint) &&
          fingerprintsEqual(localSnapshotFingerprint, cachedRemoteFingerprint) &&
          !localPendingSync &&
          !hasAnonymousDataForRecovery;

        if (canSkipRemoteSnapshot) {
          // Fingerprint match means local cache still mirrors the last known remote snapshot,
          // so delete diff can safely run for upcoming mutations in this session.
          markLocalUserHydrationFresh(uid);
          return { ok: true, mode: "remote_unchanged_use_cache", fingerprintMatched: true };
        }

        let anonymousRecovery = {
          hasAnonymousData: false,
          migratedDecksCount: 0,
          mergedStudyCount: 0,
          canClearAnonymousWithoutSync: false,
        };
        if (localPendingSync) {
          await syncUserSnapshotToRemote(uid);
          const refreshed = await fetchRemoteSnapshot(uid);
          if (refreshed?.fingerprint) setCachedRemoteFingerprintForUser(uid, refreshed.fingerprint);
          replaceLocalUserSnapshot(uid, refreshed.decks, refreshed.studyEntries);

          anonymousRecovery = recoverAnonymousSnapshotIntoUser(uid);
          const recoveredAnonymous =
            anonymousRecovery.migratedDecksCount > 0 || anonymousRecovery.mergedStudyCount > 0;
          if (recoveredAnonymous) {
            await syncUserSnapshotToRemote(uid);
            const refreshedAfterAnonymous = await fetchRemoteSnapshot(uid);
            if (refreshedAfterAnonymous?.fingerprint) {
              setCachedRemoteFingerprintForUser(uid, refreshedAfterAnonymous.fingerprint);
            }
            replaceLocalUserSnapshot(uid, refreshedAfterAnonymous.decks, refreshedAfterAnonymous.studyEntries);
            clearLocalCacheByUser("anonymous");
            return {
              ok: true,
              mode: "local_pending_flushed_and_recovered_anonymous",
              recovered: anonymousRecovery,
            };
          }
          if (anonymousRecovery.canClearAnonymousWithoutSync) clearLocalCacheByUser("anonymous");
          return { ok: true, mode: "local_pending_flushed_remote_hydrated" };
        }

        const remote = await fetchRemoteSnapshot(uid);
        if (remote?.fingerprint) {
          setCachedRemoteFingerprintForUser(uid, remote.fingerprint);
        }
        const hasRemoteData = Array.isArray(remote.decks) && remote.decks.length > 0;

        if (hasRemoteData) {
          replaceLocalUserSnapshot(uid, remote.decks, remote.studyEntries);
          anonymousRecovery = recoverAnonymousSnapshotIntoUser(uid);
          const recoveredAnonymous =
            anonymousRecovery.migratedDecksCount > 0 || anonymousRecovery.mergedStudyCount > 0;

          if (recoveredAnonymous) {
            await syncUserSnapshotToRemote(uid);
            const refreshed = await fetchRemoteSnapshot(uid);
            if (refreshed?.fingerprint) setCachedRemoteFingerprintForUser(uid, refreshed.fingerprint);
            replaceLocalUserSnapshot(uid, refreshed.decks, refreshed.studyEntries);
            clearLocalCacheByUser("anonymous");
            return {
              ok: true,
              mode: "remote_hydrated_and_recovered_anonymous",
              recovered: anonymousRecovery,
            };
          }

          if (anonymousRecovery.canClearAnonymousWithoutSync) {
            clearLocalCacheByUser("anonymous");
          }

          return { ok: true, mode: "remote_hydrated" };
        }

        anonymousRecovery = recoverAnonymousSnapshotIntoUser(uid);
        const localDecks = localDecksBeforeHydration;
        const localStudyEntries = localStudyBeforeHydration;
        const hasLocalData = localDecks.length > 0 || Object.keys(localStudyEntries).length > 0;

        if (hasLocalData) {
          await syncUserSnapshotToRemote(uid);
          const refreshed = await fetchRemoteSnapshot(uid);
          if (refreshed?.fingerprint) setCachedRemoteFingerprintForUser(uid, refreshed.fingerprint);
          replaceLocalUserSnapshot(uid, refreshed.decks, refreshed.studyEntries);
          if (
            anonymousRecovery.migratedDecksCount > 0 ||
            anonymousRecovery.mergedStudyCount > 0
          ) {
            clearLocalCacheByUser("anonymous");
            return {
              ok: true,
              mode: "local_seeded_remote_and_recovered_anonymous",
              recovered: anonymousRecovery,
            };
          }
          return { ok: true, mode: "local_seeded_remote" };
        }

        return { ok: true, mode: "empty" };
      } catch (error) {
        if (isDeferredSyncGatewayError(error)) {
          const localDecksNow = loadDecksByUser(uid);
          const localStudyNow = getUserStudyEntries(uid);
          const hasLocalDataNow =
            localDecksNow.length > 0 || Object.keys(localStudyNow).length > 0;

          if (!hasLocalDataNow) {
            try {
              const remoteFallback = await fetchRemoteSnapshot(uid);
              if (remoteFallback?.fingerprint) {
                setCachedRemoteFingerprintForUser(uid, remoteFallback.fingerprint);
              }
              if (Array.isArray(remoteFallback?.decks) && remoteFallback.decks.length > 0) {
                replaceLocalUserSnapshot(uid, remoteFallback.decks, remoteFallback.studyEntries);
                return {
                  ok: true,
                  mode: "degraded_sync_deferred_remote_hydrated",
                  deferredReason: String(error?.message || "sync_gateway_deferred"),
                };
              }
            } catch (fallbackError) {
              if (DEBUG_CLIENT_LOGS) {
                console.warn("[flashcardsCache] initializeForUser fallback hydration failed", fallbackError);
              }
            }
          }

          if (DEBUG_CLIENT_LOGS) {
            console.warn("[flashcardsCache] initializeForUser deferred sync", {
              userId: uid,
              reason: String(error?.message || "sync_gateway_deferred"),
              keptLocalData: hasLocalDataNow,
            });
          }
          return {
            ok: true,
            mode: hasLocalDataNow ? "degraded_sync_deferred_use_local" : "degraded_sync_deferred_no_data",
            deferredReason: String(error?.message || "sync_gateway_deferred"),
          };
        }

        console.warn("[flashcardsCache] initializeForUser failed", error);
        return { ok: false, mode: "error", error };
      } finally {
        syncState.initPromises.delete(uid);
      }
    })();

    syncState.initPromises.set(uid, promise);
    return promise;
  }

  window.addEventListener("online", () => {
    flushSyncQueue();
  });

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushSyncQueue();
  });

  window.flashcardsCache = {
    CACHE_KEY,
    loadDecksByUser,
    loadDeckById,
    existsDeckName,
    existsTopicName,
    createDeck,
    createTopic,
    createSubtopic,
    renameSubtopic,
    deleteSubtopic,
    renameDeck,
    renameTopic,
    addCardToDeck,
    addCardToTopic,
    deleteDeck,
    deleteTopic,
    moveTopicToDeck,
    deleteCardFromTopic,
    renameCardInTopic,
    updateCardInTopic,
    clearDecksByUser,
    clearLocalCacheByUser,
    saveDeckOrderByUser,
    initializeForUser,
    flushSyncQueue,
    flushUserNow,
    hasPendingSyncForUser,
    scheduleStudySync,
    canUseRemote,
  };
})();
