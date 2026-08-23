(function () {
  const cache = window.flashcardsCache || {
    loadDecksByUser: () => [],
    loadDeckById: () => null,
    existsDeckName: () => false,
    existsTopicName: () => false,
    createDeck: () => ({ ok: false }),
    createTopic: () => ({ ok: false }),
    createSubtopic: () => ({ ok: false }),
    renameSubtopic: () => ({ ok: false }),
    deleteSubtopic: () => ({ ok: false }),
    addCardToTopic: () => ({ ok: false }),
    deleteDeck: () => ({ ok: false }),
    deleteTopic: () => ({ ok: false }),
    moveTopicToDeck: () => ({ ok: false }),
    deleteCardFromTopic: () => ({ ok: false }),
    renameDeck: () => ({ ok: false }),
    renameTopic: () => ({ ok: false }),
    renameCardInTopic: () => ({ ok: false }),
    updateCardInTopic: () => ({ ok: false }),
    saveDeckOrderByUser: () => [],
    clearDecksByUser: () => [],
  };

  const elements = {
    createActionBtn: document.getElementById("create-action-btn"),
    homeDueBadge: document.getElementById("home-due-badge"),
    openOrderMenuBtn: document.getElementById("open-order-menu-btn"),
    quickCreateBtn: document.getElementById("quick-create-btn"),
    importPdfBtn: document.getElementById("import-pdf-btn"),
    importAnkiBtn: document.getElementById("import-anki-btn"),

    pageHeader: document.querySelector(".page-header"),
    flashcardsPanel: document.querySelector(".flashcards-panel"),
    deckViewHeader: document.querySelector(".deck-view-header"),
    emptyHomeSection: document.getElementById("empty-home-section"),
    decksHomeSection: document.getElementById("decks-home-section"),
    decksGrid: document.getElementById("decks-grid"),
    decksEmpty: document.getElementById("decks-empty"),

    deckView: document.getElementById("deck-view"),
    deckViewTitle: document.getElementById("deck-view-title"),
    deckBackBtn: document.getElementById("deck-back-btn"),
    deckAddTopicBtn: document.getElementById("deck-add-topic-btn"),

    deckTopicsPanel: document.getElementById("deck-topics-panel"),
    topicsList: document.getElementById("topics-list"),
    topicsEmptyState: document.getElementById("topics-empty-state"),
    topicsEmptyAddBtn: document.getElementById("topics-empty-add-btn"),

    topicViewPanel: document.getElementById("topic-view-panel"),
    topicDeckName: document.getElementById("topic-deck-name"),
    topicViewTitle: document.getElementById("topic-view-title"),
    topicBackBtn: document.getElementById("topic-back-btn"),
    topicAddSubtopicBtn: document.getElementById("topic-add-subtopic-btn"),
    deckAddCardBtn: document.getElementById("deck-add-card-btn"),
    deckEmptyState: document.getElementById("deck-empty-state"),
    deckEmptyAddBtn: document.getElementById("deck-empty-add-btn"),
    subtopicToolbar: document.getElementById("subtopic-toolbar"),
    subtopicFilterMenu: document.getElementById("subtopic-filter-menu"),
    subtopicFilterTrigger: document.getElementById("subtopic-filter-trigger"),
    subtopicFilterDropdown: document.getElementById("subtopic-filter-dropdown"),
    subtopicActions: document.getElementById("subtopic-actions"),
    topicHighlightCard: document.getElementById("topic-highlight-card"),
    topicHighlightTotal: document.getElementById("topic-highlight-total"),
    topicHighlightNew: document.getElementById("topic-highlight-new"),
    topicHighlightMastered: document.getElementById("topic-highlight-mastered"),
    topicHighlightAction: document.getElementById("topic-highlight-action"),
    topicCloudSyncProgress: document.getElementById("topic-cloud-sync-progress"),
    topicCloudSyncProgressLabel: document.getElementById("topic-cloud-sync-progress-label"),
    topicCloudSyncProgressFill: document.getElementById("topic-cloud-sync-progress-fill"),
    topicCloudSyncProgressMeta: document.getElementById("topic-cloud-sync-progress-meta"),
    cardEditor: document.getElementById("card-editor"),
    frontEditor: document.getElementById("front-editor"),
    backEditor: document.getElementById("back-editor"),
    reverseToggleInput: document.getElementById("reverse-toggle-input"),
    cardEditorCancelBtn: document.getElementById("card-editor-cancel-btn"),
    cardEditorSaveBtn: document.getElementById("card-editor-save-btn"),
    deckCardsList: document.getElementById("deck-cards-list"),

    deckModal: document.getElementById("deck-modal"),
    deckModalInput: document.getElementById("deck-name-input"),
    deckModalError: document.getElementById("deck-modal-error"),
    deckModalConfirm: document.getElementById("deck-modal-confirm"),
    deckModalCancel: document.getElementById("deck-modal-cancel"),
    deckColorPresets: document.getElementById("deck-color-presets"),
    deckCustomColorInput: document.getElementById("deck-custom-color-input"),

    topicModal: document.getElementById("topic-modal"),
    topicNameInput: document.getElementById("topic-name-input"),
    topicModalError: document.getElementById("topic-modal-error"),
    topicModalConfirm: document.getElementById("topic-modal-confirm"),
    topicModalCancel: document.getElementById("topic-modal-cancel"),

    orderModal: document.getElementById("order-modal"),
    orderList: document.getElementById("order-list"),
    orderCancelBtn: document.getElementById("order-cancel-btn"),
    orderSaveBtn: document.getElementById("order-save-btn"),

    actionModal: document.getElementById("action-modal"),
    actionModalTitle: document.getElementById("action-modal-title"),
    actionModalSubtitle: document.getElementById("action-modal-subtitle"),
    actionModalInputWrap: document.getElementById("action-modal-input-wrap"),
    actionModalInput: document.getElementById("action-modal-input"),
    actionModalError: document.getElementById("action-modal-error"),
    actionModalCancel: document.getElementById("action-modal-cancel"),
    actionModalConfirm: document.getElementById("action-modal-confirm"),

    studyModal: document.getElementById("study-modal"),
    studyModalMeta: document.getElementById("study-modal-meta"),
    studyFrontText: document.getElementById("study-front-text"),
    studyBackText: document.getElementById("study-back-text"),
    studyBackFace: document.getElementById("study-back-face"),
    studyCloseBtn: document.getElementById("study-close-btn"),
    studyPrevBtn: document.getElementById("study-prev-btn"),
    studyRevealBtn: document.getElementById("study-reveal-btn"),
    studyHideBtn: document.getElementById("study-hide-btn"),
    studyMasteredBtn: document.getElementById("study-mastered-btn"),
    studyNextBtn: document.getElementById("study-next-btn"),
    studyRatingPanel: document.getElementById("study-rating-panel"),
    studyRatingButtons: document.querySelectorAll(".study-rating-btn"),

    toolbarButtons: document.querySelectorAll(".toolbar-btn"),

    decksViewTabMine: document.getElementById("decks-view-tab-mine"),
    decksViewTabDiscover: document.getElementById("decks-view-tab-discover"),
    decksViewMine: document.getElementById("decks-view-mine"),
    discoverShortcutBtn: document.getElementById("discover-shortcut-btn"),

    discoverRoot: document.getElementById("discover-root"),
    discoverAreasView: document.getElementById("discover-areas-view"),
    discoverAddCardBtn: document.getElementById("discover-add-card-btn"),
    discoverAreasGrid: document.getElementById("discover-areas-grid"),
    discoverSubjectsView: document.getElementById("discover-subjects-view"),
    discoverSubjectsBackBtn: document.getElementById("discover-subjects-back-btn"),
    discoverSubjectsTitle: document.getElementById("discover-subjects-title"),
    discoverSubjectsList: document.getElementById("discover-subjects-list"),
    discoverContentsView: document.getElementById("discover-contents-view"),
    discoverContentsBackBtn: document.getElementById("discover-contents-back-btn"),
    discoverContentsTitle: document.getElementById("discover-contents-title"),
    discoverContentsList: document.getElementById("discover-contents-list"),
    discoverContentsEmpty: document.getElementById("discover-contents-empty"),
    discoverTopicsView: document.getElementById("discover-topics-view"),
    discoverTopicsBackBtn: document.getElementById("discover-topics-back-btn"),
    discoverTopicsTitle: document.getElementById("discover-topics-title"),
    discoverTopicsList: document.getElementById("discover-topics-list"),
    discoverCardsView: document.getElementById("discover-cards-view"),
    discoverCardsBackBtn: document.getElementById("discover-cards-back-btn"),
    discoverCardsTitle: document.getElementById("discover-cards-title"),
    discoverCardsList: document.getElementById("discover-cards-list"),
    discoverCardsEmpty: document.getElementById("discover-cards-empty"),
    discoverCardsPagination: document.getElementById("discover-cards-pagination"),
    discoverCardsPageInfo: document.getElementById("discover-cards-page-info"),
    discoverCardsPrevPageBtn: document.getElementById("discover-cards-prev-page"),
    discoverCardsNextPageBtn: document.getElementById("discover-cards-next-page"),

    discoverPreviewModal: document.getElementById("discover-preview-modal"),
    discoverPreviewTitle: document.getElementById("discover-preview-title"),
    discoverPreviewAuthorAvatar: document.getElementById("discover-preview-author-avatar"),
    discoverPreviewAuthorName: document.getElementById("discover-preview-author-name"),
    discoverPreviewDesc: document.getElementById("discover-preview-desc"),
    discoverPreviewFront: document.getElementById("discover-preview-front"),
    discoverPreviewBack: document.getElementById("discover-preview-back"),
    discoverPreviewCounter: document.getElementById("discover-preview-counter"),
    discoverPreviewPrevBtn: document.getElementById("discover-preview-prev-btn"),
    discoverPreviewNextBtn: document.getElementById("discover-preview-next-btn"),
    discoverPreviewCancelBtn: document.getElementById("discover-preview-cancel-btn"),
    discoverPreviewImportBtn: document.getElementById("discover-preview-import-btn"),
    discoverPreviewCloseBtn: document.getElementById("discover-preview-close-btn"),

    importPublicModal: document.getElementById("import-public-modal"),
    importPublicFields: document.getElementById("import-public-fields"),
    importPublicDeckSelect: document.getElementById("import-public-deck-select"),
    importPublicTopicSelect: document.getElementById("import-public-topic-select"),
    importPublicSubtopicWrap: document.getElementById("import-public-subtopic-wrap"),
    importPublicSubtopicSelect: document.getElementById("import-public-subtopic-select"),
    importPublicEmpty: document.getElementById("import-public-empty"),
    importPublicCreateDeckBtn: document.getElementById("import-public-create-deck-btn"),
    importPublicModalError: document.getElementById("import-public-modal-error"),
    importPublicCancelBtn: document.getElementById("import-public-cancel-btn"),
    importPublicConfirmBtn: document.getElementById("import-public-confirm-btn"),
    importPublicCloseBtn: document.getElementById("import-public-close-btn"),

    publicCardEditorModal: document.getElementById("public-card-editor-modal"),
    publicCardEditorTitle: document.getElementById("public-card-editor-title"),
    publicCardTitleInput: document.getElementById("public-card-title-input"),
    publicCardDescriptionInput: document.getElementById("public-card-description-input"),
    publicCardAreaSelect: document.getElementById("public-card-area-select"),
    publicCardMateriaSelect: document.getElementById("public-card-materia-select"),
    publicCardConteudoSelect: document.getElementById("public-card-conteudo-select"),
    publicCardTopicoSelect: document.getElementById("public-card-topico-select"),
    publicFrontEditor: document.getElementById("public-front-editor"),
    publicBackEditor: document.getElementById("public-back-editor"),
    publicCardEditorError: document.getElementById("public-card-editor-error"),
    publicCardCancelBtn: document.getElementById("public-card-cancel-btn"),
    publicCardSaveBtn: document.getElementById("public-card-save-btn"),
    publicCardEditorCloseBtn: document.getElementById("public-card-editor-close-btn"),
  };

  let currentUserId = "anonymous";
  let draggingDeckId = null;
  let justDroppedAt = 0;
  let selectedDeckColor = "#1E63FF";
  let orderDraftDecks = [];
  let activeDeckId = null;
  let activeTopicId = null;
  let activeSubtopicId = "";
  let cardEditorSubtopicId = null;
  let subtopicFilterOptions = [];
  let editingCardId = null;
  let closeActiveCardMenu = null;
  let activeActionModal = null;
  let studySession = null;
  let studySyncDebounceTimer = null;
  let studySyncDebounceUserId = null;
  let cardImagePickerInput = null;
  let saveFeedbackToast = null;
  let saveFeedbackToastTimer = null;
  let syncToastHideTimer = null;
  let topicLoadingBadge = null;
  let topicRemoteFlushInFlight = 0;
  let cacheWriteErrorAlertUntil = 0;
  const topicCloudSyncBatchByTopic = new Map();
  const pendingCreateSyncByUser = new Map();
  let lastRetrySyncToastAt = 0;
  const TOOLBAR_TOGGLE_COMMANDS = {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strike: "strikeThrough",
  };
  const CARD_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
  const CARD_IMAGE_BUCKET = "flashcard-card-images";
  const STUDY_CACHE_KEY = "mm_flashcards_study_v1";
  const REVIEW_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const INTEGRITY_CHECK_THROTTLE_MS = 15000;
  let reviewTicker = null;
  let integrityCheckInFlight = null;
  let lastIntegrityCheckAt = 0;
  let cardSelectionMode = false;
  let selectedCardIds = new Set();
  let cardSelectionTargetSubtopicId = "";
  const GENERAL_SUBTOPIC_OPTION_VALUE = "__general__";
  let isAdminUser = false;
  let discoverAreaId = null;
  let discoverMateriaId = null;
  let discoverConteudoId = null;
  let discoverTopicoId = null;
  let discoverCardsAll = [];
  let discoverCardsPage = 1;
  const DISCOVER_CARDS_PAGE_SIZE = 20;
  let discoverPreviewIndex = -1;
  let editingPublicCardId = null;
  let importPublicCard = null;
  const DISCOVER_AREAS = [
    { id: "matematica", label: "Matemática", subjects: ["matematica"], colorFrom: "#2440a8", colorTo: "#111c4c" },
    { id: "natureza", label: "Ciências da Natureza", subjects: ["fisica", "biologia", "quimica"], colorFrom: "#16a34a", colorTo: "#14532d" },
    { id: "humanas", label: "Ciências Humanas", subjects: ["historia", "geografia", "filosofia", "sociologia"], colorFrom: "#b45309", colorTo: "#451a03" },
    { id: "linguagens", label: "Linguagens", subjects: ["linguagens", "ingles", "redacao"], colorFrom: "#b91c1c", colorTo: "#450a0a" },
  ];
  const MATERIA_LABELS = {
    matematica: "Matemática",
    fisica: "Física",
    biologia: "Biologia",
    quimica: "Química",
    historia: "História",
    geografia: "Geografia",
    filosofia: "Filosofia",
    sociologia: "Sociologia",
    linguagens: "Linguagens",
    ingles: "Inglês",
    redacao: "Redação",
  };
  const TITLE_CASE_LOWERCASE_WORDS = new Set([
    "a", "as", "o", "os", "um", "uma", "uns", "umas",
    "de", "do", "da", "dos", "das",
    "em", "no", "na", "nos", "nas",
    "por", "pelo", "pela", "pelos", "pelas",
    "com", "para", "sem", "sob", "sobre", "entre", "até", "após",
    "e", "ou", "mas", "que", "se", "nem",
    "ao", "aos", "à", "às",
  ]);

  /**
   * Converte para Title Case em português: capitaliza palavras principais e
   * mantém preposições/conjunções/artigos curtos em minúsculo, exceto quando
   * são a primeira palavra.
   * @param {string} value
   * @returns {string}
   */
  function toTitleCasePt(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return raw
      .split(/\s+/)
      .map((word, index) => {
        if (!word) return word;
        const lower = word.toLocaleLowerCase("pt-BR");
        if (index > 0 && TITLE_CASE_LOWERCASE_WORDS.has(lower)) return lower;
        return lower.replace(/(^|-)(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("pt-BR"));
      })
      .join(" ");
  }
  const DEBUG_CLIENT_LOGS =
    window.__MM_ENV__ === "dev" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  function normalizeName(value) {
    return String(value || "").trim();
  }

  function normalizeComparable(value) {
    return normalizeName(value).toLocaleLowerCase("pt-BR");
  }

  function formatCardCount(count) {
    const total = Number(count) || 0;
    return `${total} ${total === 1 ? "cartão" : "cartões"}`;
  }

  function ensureSaveFeedbackToast() {
    if (saveFeedbackToast && document.body.contains(saveFeedbackToast)) return saveFeedbackToast;
    const toast = document.createElement("div");
    toast.className = "save-feedback-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    document.body.appendChild(toast);
    saveFeedbackToast = toast;
    return toast;
  }

  function showSaveFeedbackToast(message) {
    showFooterSyncToast({
      message: String(message || "").trim() || "Card salvo com sucesso!",
      state: "success",
      durationMs: 2200,
    });
  }

  function showFooterSyncToast({ message, state = "success", durationMs = 2600 } = {}) {
    const toast = ensureSaveFeedbackToast();
    toast.textContent = String(message || "").trim();
    toast.dataset.state = state;
    toast.classList.remove("is-hiding", "is-visible");
    void toast.offsetWidth;
    toast.classList.add("is-visible");
    if (saveFeedbackToastTimer) clearTimeout(saveFeedbackToastTimer);
    if (syncToastHideTimer) clearTimeout(syncToastHideTimer);
    saveFeedbackToastTimer = setTimeout(() => {
      toast.classList.add("is-hiding");
      toast.classList.remove("is-visible");
      syncToastHideTimer = setTimeout(() => {
        toast.classList.remove("is-hiding");
      }, 260);
    }, Math.max(1400, Number(durationMs) || 2600));
  }

  function formatSyncErrorReason(error) {
    const raw = String(error?.message || error || "").trim();
    if (!raw) return "falha desconhecida";
    if (raw.includes("sync_gateway_not_ready_timeout")) return "tempo limite ao preparar sincronização";
    if (raw.includes("sync_gateway_unavailable")) return "serviço de sincronização indisponível";
    if (raw.includes("outbox_flush_timeout")) return "fila de envio demorou além do esperado";
    if (raw.toLowerCase().includes("network")) return "falha de rede";
    return raw;
  }

  function describeCardSaveFailure(reason) {
    switch (reason) {
      case "empty_card":
        return "Preencha Frente ou Verso para salvar o cartão.";
      case "deck_not_found":
      case "topic_not_found":
        return "Este deck/tópico não foi encontrado (pode ter sido movido ou excluído). Volte e tente novamente.";
      case "subtopic_not_found":
        return "O subtópico selecionado não existe mais. Escolha outro e tente salvar de novo.";
      case "card_not_found":
        return "Este cartão não foi encontrado (pode ter sido excluído em outro dispositivo).";
      case "local_write_failed":
        return "Não foi possível salvar no armazenamento local do navegador (pode estar cheio). Libere espaço ou tente em outro navegador/dispositivo.";
      default:
        return "Não foi possível salvar o cartão. Tente novamente.";
    }
  }

  function getCreateSyncQueueForCurrentUser() {
    const userKey = String(currentUserId || "anonymous");
    if (!pendingCreateSyncByUser.has(userKey)) pendingCreateSyncByUser.set(userKey, []);
    return pendingCreateSyncByUser.get(userKey);
  }

  function registerPendingCreateSync(meta) {
    const queue = getCreateSyncQueueForCurrentUser();
    queue.push({
      key: `${meta.entityType}:${meta.entityId || Date.now()}:${Math.random().toString(16).slice(2, 8)}`,
      entityType: meta.entityType,
      entityId: meta.entityId || "",
      entityName: meta.entityName || "",
    });
  }

  function resolvePendingCreateSync(meta) {
    const queue = getCreateSyncQueueForCurrentUser();
    const idx = queue.findIndex((item) => item.entityType === meta.entityType && String(item.entityId || "") === String(meta.entityId || ""));
    if (idx >= 0) queue.splice(idx, 1);
  }

  function summarizePendingCreateSyncSuccess() {
    const queue = getCreateSyncQueueForCurrentUser();
    if (!queue.length) return null;
    if (queue.length === 1) {
      const only = queue[0];
      queue.length = 0;
      return `${only.entityType} "${only.entityName || only.entityId || "novo item"}" sincronizado com a nuvem.`;
    }
    const total = queue.length;
    queue.length = 0;
    return `${total} itens criados foram sincronizados com a nuvem.`;
  }

  function getCardLabelFromHtml(frontHtml) {
    const plain = String(frontHtml || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!plain) return "Novo cartão";
    return plain.length > 40 ? `${plain.slice(0, 40)}...` : plain;
  }

  function queueCreateSyncFeedback(meta) {
    registerPendingCreateSync(meta);
    showFooterSyncToast({
      message: `${meta.entityType} "${meta.entityName || "novo item"}" salvo no dispositivo. Sincronizando...`,
      state: "info",
      durationMs: 1800,
    });
    void flushRemoteAfterCriticalSave(meta.entityType).then((result) => {
      if (result?.ok) {
        resolvePendingCreateSync(meta);
        showFooterSyncToast({
          message: `${meta.entityType} "${meta.entityName || "novo item"}" sincronizado com sucesso.`,
          state: "success",
          durationMs: 2300,
        });
        return;
      }
      showFooterSyncToast({
        message: `Falha ao sincronizar ${meta.entityType} "${meta.entityName || "novo item"}": ${formatSyncErrorReason(result?.error)}. Vamos tentar novamente em segundo plano.`,
        state: "error",
        durationMs: 4200,
      });
    });
  }

  function nextFrame() {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => resolve());
        return;
      }
      setTimeout(resolve, 16);
    });
  }

  function getTopicCloudSyncTrackerKey(deckId, topicId, userId = currentUserId) {
    return `${String(userId || "anonymous")}::${String(deckId || "")}::${String(topicId || "")}`;
  }

  function registerTopicCloudSyncBatch({ deckId, topicId, cardIds = [] } = {}) {
    const safeDeckId = String(deckId || "");
    const safeTopicId = String(topicId || "");
    if (!safeDeckId || !safeTopicId) return;
    const ids = [...new Set((Array.isArray(cardIds) ? cardIds : []).map((id) => String(id || "")).filter(Boolean))];
    if (!ids.length) return;
    const key = getTopicCloudSyncTrackerKey(safeDeckId, safeTopicId);
    const previous = topicCloudSyncBatchByTopic.get(key);
    const mergedIds = new Set(previous?.cardIds || []);
    ids.forEach((id) => mergedIds.add(id));
    topicCloudSyncBatchByTopic.set(key, {
      deckId: safeDeckId,
      topicId: safeTopicId,
      cardIds: [...mergedIds],
    });
  }

  function getPendingCardUpsertIdsForUser(userId = currentUserId) {
    const keyFromCache = typeof cache?.CACHE_KEY === "string" ? cache.CACHE_KEY : "mm_flashcards_cache_v2";
    try {
      const raw = localStorage.getItem(keyFromCache);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      const pendingByUser = parsed?.pendingSyncOpsByUser;
      if (!pendingByUser || typeof pendingByUser !== "object") return new Set();
      const pendingBucket = pendingByUser[String(userId || "anonymous")];
      const upserts = pendingBucket?.upserts;
      const cardUpserts = upserts?.flashcard_cards;
      if (!cardUpserts || typeof cardUpserts !== "object") return new Set();
      return new Set(Object.keys(cardUpserts).map((id) => String(id || "")).filter(Boolean));
    } catch (_) {
      return new Set();
    }
  }

  function clearTopicCloudSyncProgress() {
    if (!elements.topicCloudSyncProgress) return;
    elements.topicCloudSyncProgress.hidden = true;
    elements.topicCloudSyncProgress.classList.remove("is-active");
    if (elements.topicCloudSyncProgressFill) {
      elements.topicCloudSyncProgressFill.style.width = "0%";
      elements.topicCloudSyncProgressFill.parentElement?.setAttribute("aria-valuenow", "0");
    }
    if (elements.topicCloudSyncProgressMeta) elements.topicCloudSyncProgressMeta.textContent = "0/0 enviados";
  }

  function renderTopicCloudSyncProgress(topic) {
    if (!topic || !activeDeckId || !activeTopicId) {
      clearTopicCloudSyncProgress();
      return;
    }
    const key = getTopicCloudSyncTrackerKey(activeDeckId, activeTopicId);
    const tracker = topicCloudSyncBatchByTopic.get(key);
    if (!tracker || !Array.isArray(tracker.cardIds) || !tracker.cardIds.length) {
      clearTopicCloudSyncProgress();
      return;
    }

    const pendingCardIds = getPendingCardUpsertIdsForUser(currentUserId);
    const total = tracker.cardIds.length;
    const pending = tracker.cardIds.reduce(
      (count, cardId) => count + (pendingCardIds.has(String(cardId || "")) ? 1 : 0),
      0,
    );
    if (pending <= 0) {
      topicCloudSyncBatchByTopic.delete(key);
      clearTopicCloudSyncProgress();
      return;
    }

    const sent = Math.max(0, total - pending);
    const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((sent / total) * 100))) : 0;
    if (elements.topicCloudSyncProgress) {
      elements.topicCloudSyncProgress.hidden = false;
      elements.topicCloudSyncProgress.classList.add("is-active");
    }
    if (elements.topicCloudSyncProgressLabel) {
      elements.topicCloudSyncProgressLabel.textContent = "Importando cartões para a nuvem...";
    }
    if (elements.topicCloudSyncProgressMeta) {
      elements.topicCloudSyncProgressMeta.textContent = `${sent}/${total} enviados · ${pending} restantes`;
    }
    if (elements.topicCloudSyncProgressFill) {
      elements.topicCloudSyncProgressFill.style.width = `${pct}%`;
      elements.topicCloudSyncProgressFill.parentElement?.setAttribute("aria-valuenow", String(pct));
    }
  }

  function ensureTopicLoadingBadge() {
    const existingBadges = [...document.querySelectorAll(".topic-loading-badge")];
    if (existingBadges.length > 1) {
      existingBadges.slice(1).forEach((node) => node.remove());
    }
    if (!topicLoadingBadge && existingBadges[0] instanceof HTMLElement) {
      topicLoadingBadge = existingBadges[0];
    }
    if (topicLoadingBadge && document.body.contains(topicLoadingBadge)) return topicLoadingBadge;
    const badge = document.createElement("div");
    badge.className = "topic-loading-badge";
    badge.setAttribute("role", "status");
    badge.setAttribute("aria-live", "polite");
    badge.setAttribute("aria-atomic", "true");
    badge.textContent = "Carregando...";
    document.body.appendChild(badge);
    topicLoadingBadge = badge;
    return badge;
  }

  function shouldShowTopicLoadingBadge() {
    const topicVisible = Boolean(activeTopicId) && Boolean(elements.topicViewPanel) && !elements.topicViewPanel.hidden;
    if (!topicVisible) return false;
    if (window.__MM_SYNC_BADGE_VISIBLE__ === true) return false;
    const globalSyncBadge = document.getElementById("mm-sync-badge");
    if (
      globalSyncBadge instanceof HTMLElement &&
      !globalSyncBadge.hidden &&
      getComputedStyle(globalSyncBadge).display !== "none"
    ) {
      return false;
    }
    if (topicRemoteFlushInFlight > 0) return true;
    if (integrityCheckInFlight) return true;
    return !getCurrentTopic();
  }

  function updateTopicLoadingBadge() {
    const badge = ensureTopicLoadingBadge();
    badge.classList.toggle("is-visible", shouldShowTopicLoadingBadge());
  }

  async function flushRemoteAfterCriticalSave(entityLabel) {
    const trackTopicBadge = Boolean(activeTopicId) && Boolean(elements.topicViewPanel) && !elements.topicViewPanel.hidden;
    if (trackTopicBadge) {
      topicRemoteFlushInFlight += 1;
      updateTopicLoadingBadge();
    }
    if (!cache || typeof cache.canUseRemote !== "function" || !cache.canUseRemote(currentUserId)) {
      if (trackTopicBadge) {
        topicRemoteFlushInFlight = Math.max(0, topicRemoteFlushInFlight - 1);
        updateTopicLoadingBadge();
      }
      return { ok: true, mode: "local_only" };
    }

    try {
      if (typeof cache.flushUserNow === "function") {
        await cache.flushUserNow(currentUserId);
      } else if (typeof cache.flushSyncQueue === "function") {
        await cache.flushSyncQueue();
      }
      return { ok: true, mode: "synced" };
    } catch (error) {
      console.warn(`[Flashcards] Falha ao sincronizar ${entityLabel || "item"} imediatamente:`, error);
      return { ok: false, error };
    } finally {
      if (trackTopicBadge) {
        topicRemoteFlushInFlight = Math.max(0, topicRemoteFlushInFlight - 1);
        updateTopicLoadingBadge();
      }
    }
  }

  async function flushRemoteAfterDelete(entityLabel) {
    return flushRemoteAfterCriticalSave(entityLabel || "exclusão");
  }

  async function runFlashcardsIntegrityCheck(reason = "navigation", options = {}) {
    const force = options?.force === true;
    const now = Date.now();
    if (!force && now - lastIntegrityCheckAt < INTEGRITY_CHECK_THROTTLE_MS) return null;
    if (integrityCheckInFlight) return integrityCheckInFlight;
    if (!cache || typeof cache.initializeForUser !== "function") return null;

    integrityCheckInFlight = (async () => {
      try {
        lastIntegrityCheckAt = Date.now();
        updateTopicLoadingBadge();
        const result = await cache.initializeForUser(currentUserId);
        if (DEBUG_CLIENT_LOGS && result?.mode && String(result.mode).includes("recovered")) {
          console.info("[Flashcards] Recuperacao de cache aplicada:", {
            reason,
            mode: result.mode,
            recovered: result.recovered || null,
            recoveredLocalPending: result.recoveredLocalPending || null,
          });
        }
        return result;
      } catch (error) {
        console.warn("[Flashcards] Integrity check falhou:", reason, error);
        return null;
      } finally {
        integrityCheckInFlight = null;
        updateTopicLoadingBadge();
      }
    })();

    return integrityCheckInFlight;
  }

  function scheduleFlashcardsIntegrityCheck(reason = "navigation", options = {}) {
    void runFlashcardsIntegrityCheck(reason, options).then((result) => {
      if (!options?.refreshUI) return;
      if (!result || !result.ok) return;
      if (!shouldRefreshAfterIntegrityResult(result)) return;
      refreshCurrentFlashcardsViewFromCache();
      if (options?.showSyncedToast) {
        showFooterSyncToast({
          message: "Flashcards sincronizados com a nuvem.",
          state: "success",
          durationMs: 2200,
        });
      }
    });
  }

  function shouldRefreshAfterIntegrityResult(result) {
    const mode = String(result?.mode || "");
    if (!mode) return false;
    return (
      mode.includes("hydrated") ||
      mode.includes("recovered") ||
      mode.includes("seeded") ||
      mode.includes("degraded_sync_deferred_remote_hydrated")
    );
  }

  function refreshCurrentFlashcardsViewFromCache() {
    const isEditingCard = Boolean(elements.cardEditor) && !elements.cardEditor.hidden;
    if (isEditingCard) return;

    const inTopicView = Boolean(activeTopicId) && Boolean(elements.topicViewPanel) && !elements.topicViewPanel.hidden;
    if (inTopicView) {
      renderTopicState();
      return;
    }

    const inDeckView = Boolean(activeDeckId) && Boolean(elements.deckTopicsPanel) && !elements.deckTopicsPanel.hidden;
    if (inDeckView) {
      renderDeckLevel();
      return;
    }

    renderHome();
  }

  async function getSupabaseAccessToken() {
    const supabaseClient = window.supabaseClient || null;
    if (!supabaseClient) return null;
    try {
      const { data } = await supabaseClient.auth.getSession();
      return data?.session?.access_token || null;
    } catch (_) {
      return null;
    }
  }

  async function ensureAuthenticatedOnlineMutation(kindLabel = "item", actionLabel = "alterar") {
    if (!navigator.onLine) {
      openActionModal({
        title: "Sem internet",
        subtitle: `Conecte-se à internet antes de ${actionLabel} ${kindLabel}.`,
        confirmLabel: "Ok",
      });
      return false;
    }

    const supabaseClient = window.supabaseClient || null;
    if (!supabaseClient) {
      openActionModal({
        title: "Sessão indisponível",
        subtitle: `Não foi possível validar sua sessão agora. Tente novamente antes de ${actionLabel} ${kindLabel}.`,
        confirmLabel: "Ok",
      });
      return false;
    }

    try {
      const { data, error } = await supabaseClient.auth.getSession();
      const sessionUser = data?.session?.user || null;
      if (error || !sessionUser?.id) {
        openActionModal({
          title: "Sessão expirada",
          subtitle: `Sua sessão não está ativa. Faça login novamente antes de ${actionLabel} ${kindLabel}.`,
          confirmLabel: "Ok",
        });
        return false;
      }
      currentUserId = String(sessionUser.id);
    } catch (_) {
      openActionModal({
        title: "Falha de validação",
        subtitle: `Falha ao validar a sessão. Tente novamente antes de ${actionLabel} ${kindLabel}.`,
        confirmLabel: "Ok",
      });
      return false;
    }

    if (
      !cache ||
      typeof cache.canUseRemote !== "function" ||
      !cache.canUseRemote(currentUserId) ||
      String(currentUserId) === "anonymous"
    ) {
      openActionModal({
        title: "Sessão necessária",
        subtitle: `É necessário estar com uma sessão autenticada para ${actionLabel} ${kindLabel}.`,
        confirmLabel: "Ok",
      });
      return false;
    }

    await runFlashcardsIntegrityCheck(`pre_mutation_${actionLabel}_${kindLabel}`, { force: true });

    const hasPendingSync =
      typeof cache.hasPendingSyncForUser === "function" && cache.hasPendingSyncForUser(currentUserId);

    if (hasPendingSync) {
      const syncResult = await flushRemoteAfterCriticalSave(`pendências antes de ${actionLabel} ${kindLabel}`);
      if (!syncResult.ok) {
        openActionModal({
          title: "Sincronização pendente",
          subtitle: `Ainda existem tópicos, subtópicos ou cards pendentes de envio. Aguarde a sincronização antes de ${actionLabel} ${kindLabel}.`,
          confirmLabel: "Ok",
        });
        return false;
      }
    }

    const stillHasPendingSync =
      typeof cache.hasPendingSyncForUser === "function" && cache.hasPendingSyncForUser(currentUserId);
    if (stillHasPendingSync) {
      openActionModal({
        title: "Fila de envio ativa",
        subtitle: `Ainda existem itens na fila de envio. Aguarde concluir a sincronização antes de ${actionLabel} ${kindLabel}.`,
        confirmLabel: "Ok",
      });
      return false;
    }

    return true;
  }

  async function ensureLocalCreateContext(kindLabel = "item") {
    await resolveCurrentUserId();
    if (
      !cache ||
      typeof cache.canUseRemote !== "function" ||
      !cache.canUseRemote(currentUserId) ||
      String(currentUserId) === "anonymous"
    ) {
      openActionModal({
        title: "Sessão necessária",
        subtitle: `Não foi possível identificar sua sessão para criar ${kindLabel}. Faça login novamente.`,
        confirmLabel: "Ok",
      });
      return false;
    }
    return true;
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
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

  function writeStudyStore(store) {
    try {
      localStorage.setItem(STUDY_CACHE_KEY, JSON.stringify(store || {}));
      return true;
    } catch (error) {
      try {
        window.dispatchEvent(
          new CustomEvent("flashcards-cache-write-error", {
            detail: {
              kind: "study",
              message: error instanceof Error ? error.message : String(error || "unknown_error"),
            },
          }),
        );
      } catch (_) {
        /* noop */
      }
      return false;
    }
  }

  function queueStudySync() {
    if (typeof cache.scheduleStudySync !== "function") return;
    studySyncDebounceUserId = currentUserId;
    if (studySyncDebounceTimer) clearTimeout(studySyncDebounceTimer);
    studySyncDebounceTimer = setTimeout(() => {
      const uid = studySyncDebounceUserId || currentUserId;
      studySyncDebounceTimer = null;
      studySyncDebounceUserId = null;
      cache.scheduleStudySync(uid);
    }, 1000);
  }

  function flushPendingStudySync(options = {}) {
    const uid = studySyncDebounceUserId || currentUserId;
    const hadPending = Boolean(studySyncDebounceTimer);
    if (studySyncDebounceTimer) {
      clearTimeout(studySyncDebounceTimer);
      studySyncDebounceTimer = null;
      studySyncDebounceUserId = null;
    }
    if (!hadPending || typeof cache.scheduleStudySync !== "function") return;
    cache.scheduleStudySync(uid);
    if (options?.bestEffortRemote && typeof cache.flushUserNow === "function") {
      try {
        void cache.flushUserNow(uid);
      } catch (_) {
        /* noop */
      }
    }
  }

  function getStudyEntry(cardId) {
    const safeCardId = String(cardId || "");
    if (!safeCardId) return null;
    const store = readStudyStore();
    const userStore = store[currentUserId];
    if (!userStore || typeof userStore !== "object") return null;
    let entry = userStore[safeCardId];
    if (!entry || typeof entry !== "object") return null;

    if (entry.status === "mastered") {
      if (!entry.nextReviewAt && entry.updatedAt) {
        const fallbackBase = Date.parse(String(entry.updatedAt));
        if (Number.isFinite(fallbackBase)) {
          entry.nextReviewAt = new Date(fallbackBase + REVIEW_INTERVAL_MS).toISOString();
          userStore[safeCardId] = entry;
          if (writeStudyStore(store)) queueStudySync();
        }
      }

      const nextAt = Date.parse(String(entry.nextReviewAt || ""));
      if (Number.isFinite(nextAt) && nextAt <= Date.now()) {
        entry = {
          ...entry,
          status: "in_progress",
          nextReviewAt: null,
          updatedAt: new Date().toISOString(),
        };
        userStore[safeCardId] = entry;
        if (writeStudyStore(store)) queueStudySync();
      }
    }

    return entry;
  }

  function markCardStudied(cardId, status = "in_progress", nextReviewAt = null) {
    const safeCardId = String(cardId || "");
    if (!safeCardId) return;
    const normalizedStatus = status === "mastered" ? "mastered" : "in_progress";
    const store = readStudyStore();
    if (!store[currentUserId] || typeof store[currentUserId] !== "object") store[currentUserId] = {};
    store[currentUserId][safeCardId] = {
      status: normalizedStatus,
      lastStudiedDate: getTodayKey(),
      nextReviewAt: normalizedStatus === "mastered" ? String(nextReviewAt || "") : null,
      updatedAt: new Date().toISOString(),
    };
    if (writeStudyStore(store)) queueStudySync();
  }

  function clearCardStudyState(cardId) {
    const safeCardId = String(cardId || "");
    if (!safeCardId) return;
    const store = readStudyStore();
    const userStore = store[currentUserId];
    if (!userStore || typeof userStore !== "object" || !userStore[safeCardId]) return;
    delete userStore[safeCardId];
    if (writeStudyStore(store)) queueStudySync();
  }

  function cardWasStudiedToday(cardId) {
    const entry = getStudyEntry(cardId);
    if (!entry) return false;
    return String(entry.lastStudiedDate || "") === getTodayKey();
  }

  function cardStatus(cardId) {
    const entry = getStudyEntry(cardId);
    return entry?.status === "mastered" ? "mastered" : entry?.status === "in_progress" ? "in_progress" : "not_studied";
  }

  function getCardReviewCountdownText(cardId) {
    const entry = getStudyEntry(cardId);
    if (!entry || entry.status !== "mastered") return "";
    const nextAt = Date.parse(String(entry.nextReviewAt || ""));
    if (!Number.isFinite(nextAt)) return "";
    const remaining = nextAt - Date.now();
    if (remaining <= 0) return "Pronto para revisar este card.";
    const totalMinutes = Math.max(0, Math.ceil(remaining / (60 * 1000)));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const dayLabel = days === 1 ? "dia" : "dias";
    const hourLabel = hours === 1 ? "hora" : "horas";
    const minuteLabel = minutes === 1 ? "minuto" : "minutos";
    if (days > 0) {
      return `Faltam ${days} ${dayLabel}, ${hours} ${hourLabel} e ${minutes} ${minuteLabel} para revisar esse card!`;
    }
    return `Faltam ${hours} ${hourLabel} e ${minutes} ${minuteLabel} para revisar esse card!`;
  }

  function getAllCardsFromUserDecks() {
    const decks = cache.loadDecksByUser(currentUserId);
    const cards = [];
    decks.forEach((deck) => {
      (Array.isArray(deck?.topics) ? deck.topics : []).forEach((topic) => {
        (Array.isArray(topic?.cards) ? topic.cards : []).forEach((card) => {
          cards.push(card);
        });
      });
    });
    return cards;
  }

  function cardIsDueToday(cardId) {
    const entry = getStudyEntry(cardId);
    if (!entry || typeof entry !== "object") return false;
    if (entry.status === "in_progress") return true;
    const nextAt = Date.parse(String(entry.nextReviewAt || ""));
    return entry.status === "mastered" && Number.isFinite(nextAt) && nextAt <= Date.now();
  }

  function getDueCardsForToday() {
    return getAllCardsFromUserDecks().filter((card) => cardIsDueToday(card.id));
  }

  function getPendingCardsFromUserDecks() {
    return getAllCardsFromUserDecks().filter((card) => cardStatus(card.id) !== "mastered");
  }

  function renderHomeDueBadge() {
    if (!elements.homeDueBadge) return;
    const pendingCards = getPendingCardsFromUserDecks();
    const total = pendingCards.length;
    if (total <= 0) {
      const hasAnyCards = getAllCardsFromUserDecks().length > 0;
      elements.homeDueBadge.textContent = hasAnyCards
        ? "Tudo em dia! Sem cartões pendentes."
        : "Você ainda não criou nenhum cartão!";
      elements.homeDueBadge.classList.add("is-empty");
      elements.homeDueBadge.disabled = true;
      return;
    }

    elements.homeDueBadge.textContent = `Você tem ${total} ${total === 1 ? "cartão" : "cartões"} pendentes!`;
    elements.homeDueBadge.classList.remove("is-empty");
    elements.homeDueBadge.disabled = false;
  }

  function shuffleArray(list) {
    const next = [...list];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function normalizeHexColor(input) {
    const value = String(input || "").trim();
    const full = /^#([0-9a-fA-F]{6})$/;
    const short = /^#([0-9a-fA-F]{3})$/;
    if (full.test(value)) return value.toUpperCase();
    if (short.test(value)) {
      const m = value.slice(1);
      return `#${m[0]}${m[0]}${m[1]}${m[1]}${m[2]}${m[2]}`.toUpperCase();
    }
    return "#1E63FF";
  }

  function hexToRgb(hex) {
    const clean = normalizeHexColor(hex).replace("#", "");
    const int = Number.parseInt(clean, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }

  function mixWith(hex, amount, target) {
    const c = hexToRgb(hex);
    const t = target === "black" ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
    const ratio = Math.min(Math.max(amount, 0), 1);
    return `rgb(${Math.round(c.r + (t.r - c.r) * ratio)}, ${Math.round(c.g + (t.g - c.g) * ratio)}, ${Math.round(c.b + (t.b - c.b) * ratio)})`;
  }

  function getReadableTextColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? "#10213F" : "#F3F7FF";
  }

  function applyDeckCardColor(card, colorHex) {
    const base = normalizeHexColor(colorHex || "#1E63FF");
    const top = mixWith(base, 0.14, "white");
    const bottom = mixWith(base, 0.2, "black");
    const border = mixWith(base, 0.32, "white");
    const subtitle = "rgba(255, 255, 255, 0.88)";
    const arrow = "rgba(255, 255, 255, 0.92)";
    card.style.background = `linear-gradient(145deg, ${top}, ${bottom})`;
    card.style.borderColor = border;
    card.style.color = "#FFFFFF";
    const subtitleEl = card.querySelector(".deck-card-subtitle");
    if (subtitleEl) subtitleEl.style.color = subtitle;
    const arrowEl = card.querySelector(".deck-card-arrow");
    if (arrowEl) arrowEl.style.color = arrow;
  }

  function getCurrentDeck() {
    if (!activeDeckId) return null;
    return cache.loadDeckById(currentUserId, activeDeckId);
  }

  function getCurrentTopic() {
    const deck = getCurrentDeck();
    if (!deck || !activeTopicId) return null;
    return deck.topics.find((topic) => topic.id === activeTopicId) || null;
  }

  function getTopicSubtopics(topic) {
    return Array.isArray(topic?.subtopics) ? topic.subtopics : [];
  }

  function getCardsFromActiveSubtopic(topic) {
    const cards = Array.isArray(topic?.cards) ? topic.cards : [];
    if (!activeSubtopicId) return cards;
    return cards.filter((card) => String(card?.subtopicId || "") === String(activeSubtopicId));
  }

  function isCardEditorOpen() {
    return Boolean(elements.cardEditor) && !elements.cardEditor.hidden;
  }

  function getToolbarSubtopicSelectionId() {
    if (isCardEditorOpen()) return String(cardEditorSubtopicId || "");
    return String(activeSubtopicId || "");
  }

  function populateSubtopicControls(topic) {
    if (!(elements.subtopicFilterTrigger instanceof HTMLButtonElement)) return;
    if (!(elements.subtopicFilterDropdown instanceof HTMLElement)) return;

    const subtopics = getTopicSubtopics(topic);
    const previousFilter = String(activeSubtopicId || "");

    const hasPreviousFilter = subtopics.some((subtopic) => String(subtopic.id) === previousFilter);
    activeSubtopicId = hasPreviousFilter ? previousFilter : "";
    const toolbarSelectedId = getToolbarSubtopicSelectionId();
    const hasToolbarSelection = subtopics.some((subtopic) => String(subtopic.id) === toolbarSelectedId);
    const selectedIdForUi = hasToolbarSelection ? toolbarSelectedId : "";
    const activeLabel =
      subtopics.find((subtopic) => String(subtopic.id) === selectedIdForUi)?.name || "Todos";
    elements.subtopicFilterTrigger.textContent = activeLabel;
    elements.subtopicFilterTrigger.setAttribute(
      "aria-label",
      `Selecionar subtópico. Atual: ${activeLabel}`,
    );

    subtopicFilterOptions = [{ id: "", name: "Todos" }, ...subtopics.map((subtopic) => ({
      id: String(subtopic.id),
      name: subtopic.name,
    }))];
    renderSubtopicFilterDropdown();
    renderSubtopicActionsMenu(topic);

    if (elements.subtopicToolbar) {
      elements.subtopicToolbar.hidden = subtopics.length === 0;
    }
    if (subtopics.length === 0) closeSubtopicFilterMenu();
  }

  function renderSubtopicActionsMenu(topic) {
    if (!(elements.subtopicActions instanceof HTMLElement)) return;
    elements.subtopicActions.innerHTML = "";
    const selectedIdForUi = getToolbarSubtopicSelectionId();
    const activeSubtopic = getTopicSubtopics(topic).find(
      (subtopic) => String(subtopic.id) === selectedIdForUi,
    );

    if (!activeSubtopic) {
      elements.subtopicActions.hidden = true;
      return;
    }

    const menu = buildCardMenu(
      [
        {
          label: "Renomear",
          onClick: async () => {
            const nextName = await openActionModal({
              mode: "rename",
              title: "Renomear subtópico",
              subtitle: `Defina um novo nome para o subtópico "${activeSubtopic.name}".`,
              defaultValue: activeSubtopic.name,
              placeholder: "Novo nome do subtópico",
              confirmLabel: "Salvar",
            });
            if (!nextName) return;
            if (!(await ensureAuthenticatedOnlineMutation("subtópico", "renomear"))) return;
            const result = cache.renameSubtopic(
              currentUserId,
              activeDeckId,
              activeTopicId,
              activeSubtopic.id,
              nextName,
            );
            if (!result.ok && result.reason === "duplicate_subtopic_name") {
              openActionModal({
                title: "Nome já existe",
                subtitle: "Já existe um subtópico com esse nome neste tópico.",
                confirmLabel: "Ok",
              });
              return;
            }
            if (!result.ok) {
              openActionModal({
                title: "Erro",
                subtitle: "Não foi possível renomear o subtópico.",
                confirmLabel: "Ok",
              });
              return;
            }
            renderHome();
            renderTopicState();
          },
        },
        {
          label: "Excluir",
          danger: true,
          onClick: async () => {
            const confirmed = await openActionModal({
              title: "Excluir subtópico",
              subtitle: `Tem certeza que deseja excluir o subtópico "${activeSubtopic.name}"? Os cartões ligados a ele ficarão sem subtópico.`,
              confirmLabel: "Excluir",
              danger: true,
            });
            if (!confirmed) return;
            if (!(await ensureAuthenticatedOnlineMutation("subtópico", "excluir"))) return;
            const result = cache.deleteSubtopic(currentUserId, activeDeckId, activeTopicId, activeSubtopic.id);
            if (!result.ok) {
              openActionModal({
                title: "Erro",
                subtitle: "Não foi possível excluir o subtópico.",
                confirmLabel: "Ok",
              });
              return;
            }
            const syncResult = await flushRemoteAfterDelete("exclusão de subtópico");
            if (!syncResult.ok) {
              openActionModal({
                title: "Subtópico excluído localmente",
                subtitle: "Falha temporária ao enviar a exclusão para a nuvem. Vamos tentar sincronizar novamente.",
                confirmLabel: "Ok",
              });
            }
            if (String(activeSubtopicId || "") === String(activeSubtopic.id)) activeSubtopicId = "";
            renderHome();
            renderTopicState();
          },
        },
      ],
      "subtópico",
    );

    elements.subtopicActions.appendChild(menu);
    elements.subtopicActions.hidden = false;
  }

  function closeSubtopicFilterMenu() {
    if (!elements.subtopicFilterMenu || !(elements.subtopicFilterTrigger instanceof HTMLButtonElement)) return;
    elements.subtopicFilterMenu.classList.remove("open");
    elements.subtopicFilterTrigger.setAttribute("aria-expanded", "false");
  }

  function openSubtopicFilterMenu() {
    if (!elements.subtopicFilterMenu || !(elements.subtopicFilterTrigger instanceof HTMLButtonElement)) return;
    elements.subtopicFilterMenu.classList.add("open");
    elements.subtopicFilterTrigger.setAttribute("aria-expanded", "true");
  }

  function renderSubtopicFilterDropdown() {
    if (!(elements.subtopicFilterDropdown instanceof HTMLElement)) return;
    elements.subtopicFilterDropdown.innerHTML = "";
    subtopicFilterOptions.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "subtopic-filter-item";
      button.setAttribute("role", "menuitem");
      const isActive = String(option.id) === getToolbarSubtopicSelectionId();
      if (isActive) button.classList.add("is-active");
      const check = document.createElement("span");
      check.className = "subtopic-filter-item-check";
      check.textContent = isActive ? "✓" : "";
      button.append(check, document.createTextNode(String(option.name || "")));
      button.addEventListener("click", () => {
        const nextSubtopicId = String(option.id || "");
        if (isCardEditorOpen()) {
          cardEditorSubtopicId = normalizeName(nextSubtopicId) || null;
        } else {
          activeSubtopicId = nextSubtopicId;
        }
        if (elements.subtopicFilterTrigger instanceof HTMLButtonElement) {
          elements.subtopicFilterTrigger.textContent = option.name;
          elements.subtopicFilterTrigger.setAttribute(
            "aria-label",
            `Selecionar subtópico. Atual: ${option.name}`,
          );
        }
        closeSubtopicFilterMenu();
        renderTopicState();
      });
      elements.subtopicFilterDropdown.appendChild(button);
    });
  }

  function showDeckHome() {
    scheduleFlashcardsIntegrityCheck("show_deck_home");
    elements.pageHeader.hidden = false;
    elements.flashcardsPanel.hidden = false;
    elements.deckView.hidden = true;
    activeDeckId = null;
    activeTopicId = null;
  }

  function showDeckView() {
    elements.pageHeader.hidden = true;
    elements.flashcardsPanel.hidden = true;
    elements.deckView.hidden = false;
  }

  function setModalVisibility(modalEl, isOpen) {
    if (!(modalEl instanceof HTMLElement)) return;
    if (isOpen) {
      modalEl.classList.add("open");
      modalEl.setAttribute("aria-hidden", "false");
      if ("inert" in modalEl) modalEl.inert = false;
      return;
    }

    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement && modalEl.contains(activeEl)) {
      activeEl.blur();
    }
    if ("inert" in modalEl) modalEl.inert = true;
    modalEl.classList.remove("open");
    modalEl.setAttribute("aria-hidden", "true");
  }

  function openDeckModal(defaultValue = "") {
    scheduleFlashcardsIntegrityCheck("open_deck_modal");
    setModalVisibility(elements.deckModal, true);
    elements.deckModalInput.value = defaultValue;
    elements.deckModalError.textContent = "";
    setSelectedDeckColor(selectedDeckColor || "#1E63FF");
    setTimeout(() => {
      elements.deckModalInput.focus();
      elements.deckModalInput.select();
    }, 0);
  }

  function closeDeckModal() {
    setModalVisibility(elements.deckModal, false);
    elements.deckModalError.textContent = "";
    elements.deckModalInput.value = "";
  }

  function openTopicModal(defaultValue = "") {
    scheduleFlashcardsIntegrityCheck("open_topic_modal");
    setModalVisibility(elements.topicModal, true);
    elements.topicNameInput.value = defaultValue;
    elements.topicModalError.textContent = "";
    setTimeout(() => {
      elements.topicNameInput.focus();
      elements.topicNameInput.select();
    }, 0);
  }

  function closeTopicModal() {
    setModalVisibility(elements.topicModal, false);
    elements.topicModalError.textContent = "";
    elements.topicNameInput.value = "";
  }

  function openOrderModal() {
    scheduleFlashcardsIntegrityCheck("open_order_modal");
    orderDraftDecks = cache.loadDecksByUser(currentUserId).map((deck) => ({ ...deck }));
    if (orderDraftDecks.length < 2) return;
    renderOrderList();
    setModalVisibility(elements.orderModal, true);
  }

  function closeOrderModal() {
    setModalVisibility(elements.orderModal, false);
    orderDraftDecks = [];
  }

  function setSelectedDeckColor(color) {
    selectedDeckColor = normalizeHexColor(color);
    elements.deckCustomColorInput.value = selectedDeckColor;
    const presetButtons = elements.deckColorPresets?.querySelectorAll(".color-preset") || [];
    presetButtons.forEach((btn) => {
      btn.classList.toggle("active", normalizeHexColor(btn.dataset.color) === selectedDeckColor);
    });
  }

  /**
   * Extrai o texto puro de uma string HTML sem anexá-la ao documento, evitando
   * efeitos colaterais (carregamento de imagem, onerror/onload) que um
   * `div.innerHTML =` causaria.
   * @param {string} html
   * @returns {string}
   */
  function safePlainTextFromHtml(html) {
    const raw = String(html || "");
    if (!raw) return "";
    try {
      const doc = new DOMParser().parseFromString(raw, "text/html");
      return (doc.body?.textContent || "").trim();
    } catch (_) {
      return "";
    }
  }

  function stripHtml(html) {
    return safePlainTextFromHtml(html);
  }

  const CARD_HTML_ALLOWED_TAGS = [
    "b", "strong", "i", "em", "u", "s", "strike", "h3", "ul", "ol", "li",
    "sub", "sup", "code", "a", "img", "br", "div", "span", "p",
  ];
  const CARD_HTML_ALLOWED_ATTR = ["href", "src", "alt", "loading", "style", "target", "rel"];

  /**
   * Sanitiza HTML de cartões contra XSS, permitindo apenas as tags/atributos
   * que o editor de texto rico realmente produz.
   * @param {string} html
   * @returns {string} HTML sanitizado, ou string vazia se o DOMPurify não estiver disponível.
   */
  function sanitizeCardHtml(html) {
    const dirty = String(html || "");
    if (!dirty) return "";
    if (window.DOMPurify && typeof window.DOMPurify.sanitize === "function") {
      return window.DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: CARD_HTML_ALLOWED_TAGS,
        ALLOWED_ATTR: CARD_HTML_ALLOWED_ATTR,
      });
    }
    // DOMPurify indisponível (ex.: CDN bloqueado) — falha fechado, sem renderizar HTML.
    return escapeHtml(safePlainTextFromHtml(dirty));
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (ch) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
  }

  function resetCardEditor() {
    elements.frontEditor.innerHTML = "";
    elements.backEditor.innerHTML = "";
    elements.reverseToggleInput.checked = false;
    cardEditorSubtopicId = normalizeName(activeSubtopicId) || null;
    editingCardId = null;
    if (elements.cardEditorSaveBtn) elements.cardEditorSaveBtn.textContent = "Salvar cartão";
  }

  function setCardEditorVisible(visible) {
    elements.cardEditor.hidden = !visible;
    if (!visible) refreshToolbarState("front-editor", false);
    if (!visible) refreshToolbarState("back-editor", false);
  }

  function closeContextMenu() {
    if (!closeActiveCardMenu) return;
    closeActiveCardMenu();
    closeActiveCardMenu = null;
  }

  function closeActionModal(result = null) {
    if (!activeActionModal) return;
    const resolver = activeActionModal.resolve;
    activeActionModal = null;
    setModalVisibility(elements.actionModal, false);
    elements.actionModalInputWrap.hidden = true;
    elements.actionModalError.textContent = "";
    elements.actionModalInput.value = "";
    elements.actionModalConfirm.classList.remove("is-danger");
    elements.actionModalConfirm.textContent = "Confirmar";
    if (typeof resolver === "function") resolver(result);
  }

  function openActionModal(config) {
    scheduleFlashcardsIntegrityCheck("open_action_modal");
    if (activeActionModal) closeActionModal(null);
    const mode = config?.mode === "rename" ? "rename" : "confirm";
    elements.actionModalTitle.textContent = config?.title || "Confirmar ação";
    elements.actionModalSubtitle.textContent = config?.subtitle || "";
    elements.actionModalError.textContent = "";
    elements.actionModalConfirm.textContent = config?.confirmLabel || "Confirmar";
    elements.actionModalConfirm.classList.toggle("is-danger", Boolean(config?.danger));
    elements.actionModalInputWrap.hidden = mode !== "rename";
    elements.actionModalInput.placeholder = config?.placeholder || "Digite aqui";
    elements.actionModalInput.value = config?.defaultValue || "";

    setModalVisibility(elements.actionModal, true);

    if (mode === "rename") {
      setTimeout(() => {
        elements.actionModalInput.focus();
        elements.actionModalInput.select();
      }, 0);
    } else {
      setTimeout(() => elements.actionModalConfirm.focus(), 0);
    }

    return new Promise((resolve) => {
      activeActionModal = { mode, resolve };
    });
  }

  function handleActionModalConfirm() {
    if (!activeActionModal) return;
    if (activeActionModal.mode === "rename") {
      const nextValue = normalizeName(elements.actionModalInput.value);
      if (!nextValue) {
        elements.actionModalError.textContent = "Digite um nome válido.";
        return;
      }
      if (nextValue.length < 2) {
        elements.actionModalError.textContent = "Use pelo menos 2 caracteres.";
        return;
      }
      closeActionModal(nextValue);
      return;
    }
    closeActionModal(true);
  }

  function toPlainTextFromHtml(value) {
    return safePlainTextFromHtml(value);
  }

  function containsImageTag(value) {
    return /<img[\s>]/i.test(String(value || ""));
  }

  function isLightTheme() {
    return document.documentElement?.dataset?.theme === "light";
  }

  function getMenuDotsIconPath(label) {
    const normalized = normalizeName(label).toLocaleLowerCase("pt-BR");
    const supportsAdaptiveIcon = normalized === "tópico" || normalized === "cartão" || normalized === "subtópico";
    if (isLightTheme() && supportsAdaptiveIcon) return "/imagens/black-menu-dots.png";
    return "/imagens/menu-dots.png";
  }

  function buildCardMenu(actions, label) {
    const wrap = document.createElement("div");
    wrap.className = "card-menu";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "card-menu-trigger";
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", `Abrir menu de ${label}`);
    trigger.innerHTML = `<img src="${getMenuDotsIconPath(label)}" alt="" />`;

    const menu = document.createElement("div");
    menu.className = "card-menu-dropdown";
    menu.setAttribute("role", "menu");

    const mainView = document.createElement("div");
    mainView.className = "card-menu-view";
    menu.appendChild(mainView);

    const showMainView = () => {
      menu.querySelectorAll(".card-menu-view-sub").forEach((el) => el.remove());
      mainView.hidden = false;
    };

    const showSubmenu = (action) => {
      mainView.hidden = true;
      menu.querySelectorAll(".card-menu-view-sub").forEach((el) => el.remove());

      const sub = document.createElement("div");
      sub.className = "card-menu-view card-menu-view-sub";

      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "card-menu-back";
      backBtn.setAttribute("role", "menuitem");
      backBtn.innerHTML = `<span class="card-menu-back-arrow" aria-hidden="true">‹</span> ${action.label}`;
      backBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        showMainView();
      });
      sub.appendChild(backBtn);

      const items = (typeof action.submenu === "function" ? action.submenu() : []) || [];
      if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "card-menu-empty";
        empty.textContent = action.emptyLabel || "Nenhuma opção disponível.";
        sub.appendChild(empty);
      }
      items.forEach((item) => {
        const itemBtn = document.createElement("button");
        itemBtn.type = "button";
        itemBtn.className = "card-menu-item";
        itemBtn.setAttribute("role", "menuitem");
        itemBtn.textContent = item.label;
        itemBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          closeMenu();
          item.onClick();
        });
        sub.appendChild(itemBtn);
      });

      menu.appendChild(sub);
    };

    const openMenu = () => {
      if (!actions.length) return;
      if (closeActiveCardMenu && closeActiveCardMenu !== closeMenu) closeActiveCardMenu();
      showMainView();
      wrap.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      closeActiveCardMenu = closeMenu;
    };

    const closeMenu = () => {
      wrap.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
      if (closeActiveCardMenu === closeMenu) closeActiveCardMenu = null;
    };

    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `card-menu-item ${action.danger ? "danger" : ""}`.trim();
      btn.setAttribute("role", "menuitem");
      btn.textContent = action.label;
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (typeof action.submenu === "function") {
          showSubmenu(action);
          return;
        }
        closeMenu();
        action.onClick();
      });
      mainView.appendChild(btn);
    });

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      if (wrap.classList.contains("open")) closeMenu();
      else openMenu();
    });

    wrap.addEventListener("click", (event) => event.stopPropagation());
    wrap.append(trigger, menu);
    return wrap;
  }

  function resetCardSelectionMode() {
    cardSelectionMode = false;
    selectedCardIds = new Set();
    cardSelectionTargetSubtopicId = "";
  }

  function ensureCardSelectionBar() {
    if (!elements.topicViewPanel || !elements.deckCardsList || !elements.deckCardsList.parentNode) return null;
    let bar = elements.topicViewPanel.querySelector(".card-selection-bar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.className = "card-selection-bar";
    bar.hidden = true;
    bar.innerHTML = `
      <div class="card-selection-bar-info"><strong data-role="count">0 selecionados</strong></div>
      <div class="card-selection-bar-actions">
        <div class="card-selection-select-wrap">
          <select data-role="subtopic-select" class="card-selection-select" aria-label="Subtópico de destino"></select>
        </div>
        <button type="button" class="card-selection-cancel-btn" data-role="cancel">Cancelar</button>
        <button type="button" class="primary-btn" data-role="move">Mover</button>
      </div>
    `;

    bar.querySelector('[data-role="cancel"]')?.addEventListener("click", () => {
      resetCardSelectionMode();
      renderTopicState();
    });

    bar.querySelector('[data-role="subtopic-select"]')?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      cardSelectionTargetSubtopicId = String(target.value || "");
      const moveBtn = bar.querySelector('[data-role="move"]');
      if (moveBtn instanceof HTMLButtonElement) {
        moveBtn.disabled = !cardSelectionTargetSubtopicId || selectedCardIds.size === 0;
      }
    });

    bar.querySelector('[data-role="move"]')?.addEventListener("click", async () => {
      const topic = getCurrentTopic();
      if (!topic || !activeDeckId || !activeTopicId) return;
      if (!cardSelectionTargetSubtopicId) {
        openActionModal({ title: "Selecione um subtópico", subtitle: "Escolha o subtópico de destino.", confirmLabel: "Ok" });
        return;
      }
      const selectedIds = [...selectedCardIds];
      if (!selectedIds.length) return;
      if (!(await ensureAuthenticatedOnlineMutation("cartões", "mover"))) return;

      const targetSubtopicId =
        cardSelectionTargetSubtopicId === GENERAL_SUBTOPIC_OPTION_VALUE
          ? null
          : cardSelectionTargetSubtopicId;
      let movedCount = 0;
      for (const selectedId of selectedIds) {
        const card = (Array.isArray(topic.cards) ? topic.cards : []).find((entry) => String(entry.id) === String(selectedId));
        if (!card) continue;
        if (String(card.subtopicId || "") === String(targetSubtopicId || "")) continue;
        const result = cache.updateCardInTopic(currentUserId, activeDeckId, activeTopicId, card.id, {
          frontHtml: card.frontHtml,
          backHtml: card.backHtml,
          reverse: Boolean(card.reverse),
          subtopicId: targetSubtopicId,
        });
        if (!result?.ok) {
          openActionModal({
            title: "Erro",
            subtitle: "Não foi possível mover os cartões selecionados.",
            confirmLabel: "Ok",
          });
          return;
        }
        movedCount += 1;
      }

      if (movedCount === 0) {
        resetCardSelectionMode();
        renderTopicState();
        return;
      }

      const syncResult = await flushRemoteAfterCriticalSave("cartões");
      if (!syncResult.ok) {
        openActionModal({
          title: "Movido localmente",
          subtitle: "Falha temporária ao enviar para a nuvem. Vamos tentar sincronizar novamente.",
          confirmLabel: "Ok",
        });
      } else if (movedCount > 0) {
        showSaveFeedbackToast(movedCount === 1 ? "Cartão movido com sucesso!" : "Cartões movidos com sucesso!");
      }
      resetCardSelectionMode();
      renderHome();
      renderTopicState();
    });

    elements.deckCardsList.parentNode.insertBefore(bar, elements.deckCardsList);
    return bar;
  }

  function renderCardSelectionBar(topic) {
    const bar = ensureCardSelectionBar();
    if (!bar) return;
    const subtopics = getTopicSubtopics(topic);
    if (!cardSelectionMode || !subtopics.length) {
      bar.hidden = true;
      return;
    }
    const validIds = new Set((Array.isArray(topic?.cards) ? topic.cards : []).map((card) => String(card.id)));
    selectedCardIds = new Set([...selectedCardIds].filter((id) => validIds.has(String(id))));
    if (!selectedCardIds.size) {
      bar.hidden = true;
      return;
    }

    bar.hidden = false;
    const countEl = bar.querySelector('[data-role="count"]');
    const selectEl = bar.querySelector('[data-role="subtopic-select"]');
    const moveBtn = bar.querySelector('[data-role="move"]');
    if (countEl) {
      countEl.textContent = `${selectedCardIds.size} ${selectedCardIds.size === 1 ? "selecionado" : "selecionados"}`;
    }
    if (selectEl instanceof HTMLSelectElement) {
      const previous = cardSelectionTargetSubtopicId;
      selectEl.innerHTML = `
        <option value="" disabled>Mover para...</option>
        <option value="${GENERAL_SUBTOPIC_OPTION_VALUE}">Geral (sem subtópico)</option>
      `;
      subtopics.forEach((subtopic) => {
        const option = document.createElement("option");
        option.value = String(subtopic.id);
        option.textContent = subtopic.name;
        selectEl.appendChild(option);
      });
      selectEl.value = [...selectEl.options].some((opt) => opt.value === previous) ? previous : "";
      cardSelectionTargetSubtopicId = selectEl.value;
    }
    if (moveBtn instanceof HTMLButtonElement) {
      moveBtn.disabled = !cardSelectionTargetSubtopicId || selectedCardIds.size === 0;
    }
  }

  function openCardEditor() {
    if (!activeTopicId) return;
    editingCardId = null;
    cardEditorSubtopicId = normalizeName(activeSubtopicId) || null;
    if (elements.cardEditorSaveBtn) elements.cardEditorSaveBtn.textContent = "Salvar cartão";
    setCardEditorVisible(true);
    const topic = getCurrentTopic();
    if (topic) populateSubtopicControls(topic);
    elements.deckEmptyState.hidden = true;
    if (elements.topicHighlightCard) elements.topicHighlightCard.hidden = true;
    elements.deckCardsList.hidden = true;
    setTimeout(() => {
      elements.frontEditor.focus();
      refreshToolbarState("front-editor");
      refreshToolbarState("back-editor", false);
    }, 0);
  }

  function closeCardEditor() {
    setCardEditorVisible(false);
    resetCardEditor();
    renderTopicState();
  }

  function openCardEditorForEdit(card) {
    if (!activeTopicId || !card) return;
    editingCardId = String(card.id || "");
    cardEditorSubtopicId = normalizeName(card.subtopicId) || null;
    elements.frontEditor.innerHTML = sanitizeCardHtml(card.frontHtml);
    elements.backEditor.innerHTML = sanitizeCardHtml(card.backHtml);
    elements.reverseToggleInput.checked = Boolean(card.reverse);
    if (elements.cardEditorSaveBtn) elements.cardEditorSaveBtn.textContent = "Salvar edição";
    setCardEditorVisible(true);
    const topic = getCurrentTopic();
    if (topic) populateSubtopicControls(topic);
    elements.deckEmptyState.hidden = true;
    if (elements.topicHighlightCard) elements.topicHighlightCard.hidden = true;
    elements.deckCardsList.hidden = true;
    setTimeout(() => {
      elements.frontEditor.focus();
      refreshToolbarState("front-editor");
      refreshToolbarState("back-editor", false);
    }, 0);
  }

  function selectionIsInsideEditor(editor) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const anchor = selection.anchorNode;
    const focus = selection.focusNode;
    return Boolean(anchor && focus && editor.contains(anchor) && editor.contains(focus));
  }

  function refreshToolbarState(editorId, forceInactive = null) {
    const editor = document.getElementById(editorId);
    if (!editor) return;
    const buttons = [...elements.toolbarButtons].filter((btn) => btn.dataset.editor === editorId);
    if (!buttons.length) return;

    const canEvaluate =
      forceInactive === null
        ? selectionIsInsideEditor(editor) || document.activeElement === editor
        : !forceInactive;

    buttons.forEach((btn) => {
      const cmd = btn.dataset.cmd || "";
      const mapped = TOOLBAR_TOGGLE_COMMANDS[cmd];
      const active = canEvaluate && mapped ? Boolean(document.queryCommandState(mapped)) : false;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function openDeck(deckId) {
    scheduleFlashcardsIntegrityCheck("open_deck");
    activeDeckId = String(deckId || "");
    activeTopicId = null;
    renderDeckLevel();
    showDeckView();
  }

  function openTopic(topicId) {
    scheduleFlashcardsIntegrityCheck("open_topic");
    activeTopicId = String(topicId || "");
    activeSubtopicId = "";
    resetCardSelectionMode();
    updateTopicLoadingBadge();
    renderTopicState();
  }

  function backToTopics() {
    closeStudyModal();
    activeTopicId = null;
    activeSubtopicId = "";
    resetCardSelectionMode();
    updateTopicLoadingBadge();
    closeCardEditor();
    renderDeckLevel();
  }

  function createDeckCard(deck) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "deck-card";
    button.draggable = true;
    button.dataset.deckId = deck.id;

    const textWrap = document.createElement("div");
    textWrap.className = "deck-card-content";
    const title = document.createElement("h3");
    title.className = "deck-card-title";
    title.textContent = deck.name;
    const subtitle = document.createElement("p");
    subtitle.className = "deck-card-subtitle";
    subtitle.textContent = deck.cardsCount > 0 ? formatCardCount(deck.cardsCount) : "Nenhum cartão adicionado ainda";
    textWrap.append(title, subtitle);

    const arrow = document.createElement("span");
    arrow.className = "deck-card-arrow";
    arrow.textContent = "›";

    const menu = buildCardMenu(
      [
        {
          label: "Renomear",
          onClick: async () => {
            const nextName = await openActionModal({
              mode: "rename",
              title: "Renomear",
              subtitle: `Defina um novo nome para o deck "${deck.name}".`,
              defaultValue: deck.name,
              placeholder: "Novo nome do deck",
              confirmLabel: "Salvar",
            });
            if (!nextName) return;
            if (!(await ensureAuthenticatedOnlineMutation("deck", "renomear"))) return;
            const result = cache.renameDeck(currentUserId, deck.id, nextName);
            if (!result.ok && result.reason === "duplicate_name") {
              openActionModal({
                title: "Nome já existe",
                subtitle: "Você já possui um deck com esse nome.",
                confirmLabel: "Ok",
              });
              return;
            }
            if (!result.ok) {
              openActionModal({
                title: "Erro",
                subtitle: "Não foi possível renomear o deck.",
                confirmLabel: "Ok",
              });
              return;
            }
            renderHome();
            if (activeDeckId === deck.id) renderDeckLevel();
          },
        },
        {
          label: "Deletar",
          danger: true,
          onClick: async () => {
            const confirmed = await openActionModal({
              title: "Deletar",
              subtitle: `Tem certeza que deseja excluir o deck "${deck.name}"?`,
              confirmLabel: "Deletar",
              danger: true,
            });
            if (!confirmed) return;
            if (!(await ensureAuthenticatedOnlineMutation("deck", "excluir"))) return;
            const result = cache.deleteDeck(currentUserId, deck.id);
            if (!result.ok) {
              openActionModal({
                title: "Erro",
                subtitle: "Não foi possível excluir o deck.",
                confirmLabel: "Ok",
              });
              return;
            }
            const syncResult = await flushRemoteAfterDelete("exclusão de deck");
            if (!syncResult.ok) {
              openActionModal({
                title: "Deck excluído localmente",
                subtitle: "Falha temporária ao enviar a exclusão para a nuvem. Vamos tentar sincronizar novamente.",
                confirmLabel: "Ok",
              });
            }
            if (activeDeckId === deck.id) showDeckHome();
            renderHome();
          },
        },
      ],
      "deck",
    );

    button.append(textWrap, arrow, menu);
    applyDeckCardColor(button, deck.color || "#1E63FF");

    button.addEventListener("dragstart", (event) => {
      draggingDeckId = deck.id;
      button.classList.add("dragging");
      event.dataTransfer?.setData("text/plain", deck.id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      elements.decksGrid?.classList.add("drag-active");
    });

    button.addEventListener("dragend", () => {
      button.classList.remove("dragging");
      elements.decksGrid?.classList.remove("drag-active");
      draggingDeckId = null;
    });

    button.addEventListener("click", () => {
      if (Date.now() - justDroppedAt < 250) return;
      openDeck(deck.id);
    });

    return button;
  }

  function renderTopicsList(topics) {
    elements.topicsList.innerHTML = "";
    topics.forEach((topic) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "topic-card";
      button.innerHTML = `
        <span class="topic-card-name"></span>
        <span class="topic-card-meta"></span>
      `;
      button.querySelector(".topic-card-name").textContent = topic.name;
      button.querySelector(".topic-card-meta").textContent = formatCardCount(topic.cards.length);
      button.addEventListener("click", () => openTopic(topic.id));

      const menu = buildCardMenu(
        [
          {
            label: "Renomear",
            onClick: async () => {
              const nextName = await openActionModal({
                mode: "rename",
                title: "Renomear",
                subtitle: `Defina um novo nome para o tópico "${topic.name}".`,
                defaultValue: topic.name,
                placeholder: "Novo nome do tópico",
                confirmLabel: "Salvar",
              });
              if (!nextName) return;
              if (!(await ensureAuthenticatedOnlineMutation("tópico", "renomear"))) return;
              const result = cache.renameTopic(currentUserId, activeDeckId, topic.id, nextName);
              if (!result.ok && result.reason === "duplicate_name") {
                openActionModal({
                  title: "Nome já existe",
                  subtitle: "Já existe um tópico com esse nome neste deck.",
                  confirmLabel: "Ok",
                });
                return;
              }
              if (!result.ok) {
                openActionModal({
                  title: "Erro",
                  subtitle: "Não foi possível renomear o tópico.",
                  confirmLabel: "Ok",
                });
                return;
              }
              renderHome();
              renderDeckLevel();
            },
          },
          {
            label: "Mover",
            emptyLabel: "Você só tem este deck. Crie outro deck para mover o tópico.",
            submenu: () =>
              cache
                .loadDecksByUser(currentUserId)
                .filter((otherDeck) => String(otherDeck.id) !== String(activeDeckId))
                .map((otherDeck) => ({
                  label: otherDeck.name,
                  onClick: async () => {
                    if (!(await ensureAuthenticatedOnlineMutation("tópico", "mover"))) return;
                    const result = cache.moveTopicToDeck(currentUserId, activeDeckId, topic.id, otherDeck.id);
                    if (!result.ok) {
                      const subtitle =
                        result.reason === "duplicate_topic_name"
                          ? `O deck "${otherDeck.name}" já possui um tópico com esse nome.`
                          : "Não foi possível mover o tópico.";
                      openActionModal({ title: "Erro", subtitle, confirmLabel: "Ok" });
                      return;
                    }
                    const syncResult = await flushRemoteAfterCriticalSave("movimentação de tópico");
                    if (!syncResult.ok) {
                      openActionModal({
                        title: "Tópico movido localmente",
                        subtitle: "Falha temporária ao enviar a movimentação para a nuvem. Vamos tentar sincronizar novamente.",
                        confirmLabel: "Ok",
                      });
                    }
                    if (activeTopicId === topic.id) activeTopicId = null;
                    renderHome();
                    renderDeckLevel();
                  },
                })),
          },
          {
            label: "Deletar",
            danger: true,
            onClick: async () => {
              const confirmed = await openActionModal({
                title: "Deletar",
                subtitle: `Tem certeza que deseja excluir o tópico "${topic.name}"?`,
                confirmLabel: "Deletar",
                danger: true,
              });
              if (!confirmed) return;
              if (!(await ensureAuthenticatedOnlineMutation("tópico", "excluir"))) return;
              const result = cache.deleteTopic(currentUserId, activeDeckId, topic.id);
              if (!result.ok) {
                openActionModal({
                  title: "Erro",
                  subtitle: "Não foi possível excluir o tópico.",
                  confirmLabel: "Ok",
                });
                return;
              }
              const syncResult = await flushRemoteAfterDelete("exclusão de tópico");
              if (!syncResult.ok) {
                openActionModal({
                  title: "Tópico excluído localmente",
                  subtitle:
                    "Falha temporária ao enviar a exclusão para a nuvem. Não vamos recuperar esse tópico automaticamente.",
                  confirmLabel: "Ok",
                });
              }
              if (activeTopicId === topic.id) activeTopicId = null;
              renderHome();
              renderDeckLevel();
            },
          },
        ],
        "tópico",
      );

      button.appendChild(menu);
      elements.topicsList.appendChild(button);
    });

    elements.topicsList.hidden = topics.length === 0;
    elements.topicsEmptyState.hidden = topics.length > 0;
  }

  function renderDeckLevel() {
    scheduleFlashcardsIntegrityCheck("render_deck_level");
    const deck = getCurrentDeck();
    if (!deck) {
      showDeckHome();
      renderHome();
      return;
    }

    elements.deckViewTitle.textContent = deck.name;
    if (elements.deckViewHeader) elements.deckViewHeader.hidden = false;
    elements.deckTopicsPanel.hidden = false;
    elements.topicViewPanel.hidden = true;
    renderTopicsList(deck.topics || []);
  }

  async function createSubtopicFromTopicView() {
    if (!activeDeckId || !activeTopicId) return;
    const topic = getCurrentTopic();
    const nextName = await openActionModal({
      mode: "rename",
      title: "Novo subtópico",
      subtitle: `Crie um subtópico dentro de "${topic?.name || "Tópico"}".`,
      defaultValue: "",
      placeholder: "Ex: Membrana plasmática",
      confirmLabel: "Criar",
    });
    if (!nextName) return;
    if (!(await ensureLocalCreateContext("subtópico"))) return;

    const result = cache.createSubtopic(currentUserId, activeDeckId, activeTopicId, nextName);
    if (!result.ok && result.reason === "duplicate_subtopic_name") {
      openActionModal({
        title: "Nome já existe",
        subtitle: "Já existe um subtópico com esse nome neste tópico.",
        confirmLabel: "Ok",
      });
      return;
    }

    if (!result.ok) {
      openActionModal({
        title: "Erro",
        subtitle: "Não foi possível criar o subtópico.",
        confirmLabel: "Ok",
      });
      return;
    }

    renderHome();
    renderTopicState();
    queueCreateSyncFeedback({
      entityType: "Subtópico",
      entityId: result?.subtopic?.id || "",
      entityName: nextName,
    });
  }

  function getCurrentStudyCard() {
    if (!studySession || !Array.isArray(studySession.cards) || !studySession.cards.length) return null;
    const index = Math.min(Math.max(studySession.index || 0, 0), studySession.cards.length - 1);
    return studySession.cards[index] || null;
  }

  function closeStudyModal() {
    studySession = null;
    setModalVisibility(elements.studyModal, false);
  }

  function renderStudyModalCard() {
    const current = getCurrentStudyCard();
    if (!current) {
      closeStudyModal();
      renderTopicState();
      return;
    }
    if (elements.studyModalMeta) {
      elements.studyModalMeta.textContent = `${(studySession.index || 0) + 1} de ${studySession.cards.length}`;
    }
    if (elements.studyFrontText) {
      const safeFront = sanitizeCardHtml(current.frontHtml).trim();
      elements.studyFrontText.innerHTML = safeFront || "<em>(Frente vazia)</em>";
    }
    if (elements.studyBackText) {
      const safeBack = sanitizeCardHtml(current.backHtml).trim();
      elements.studyBackText.innerHTML = safeBack || "<em>(Verso vazio)</em>";
    }
    if (elements.studyBackFace) elements.studyBackFace.hidden = !studySession.revealed;
    if (elements.studyPrevBtn) elements.studyPrevBtn.hidden = (studySession.index || 0) <= 0;
    if (elements.studyRevealBtn) elements.studyRevealBtn.hidden = Boolean(studySession.revealed);
    if (elements.studyHideBtn) elements.studyHideBtn.hidden = !studySession.revealed;
    if (elements.studyMasteredBtn) {
      const mastered = cardStatus(current.id) === "mastered";
      elements.studyMasteredBtn.textContent = mastered ? "Já dominado" : "Marcar dominado";
    }
    if (elements.studyRatingPanel) elements.studyRatingPanel.hidden = !Boolean(studySession.showRatingPanel);
    if (elements.studyNextBtn) {
      elements.studyNextBtn.hidden = studySession.cards.length <= 1;
    }
  }

  function openStudyModalWithCards(cards, startIndex = 0) {
    if (!Array.isArray(cards) || !cards.length) {
      openActionModal({
        title: "Sem cartões para hoje",
        subtitle: "Todos os cartões deste tópico já foram estudados hoje.",
        confirmLabel: "Ok",
      });
      return;
    }
    const safeIndex = Math.min(Math.max(startIndex, 0), cards.length - 1);
    studySession = {
      cards,
      index: safeIndex,
      revealed: false,
      showRatingPanel: false,
    };
    setModalVisibility(elements.studyModal, true);
    renderStudyModalCard();
  }

  function openStudyFromHighlight() {
    const topic = getCurrentTopic();
    if (!topic || !Array.isArray(topic.cards) || !topic.cards.length) return;
    const scopedCards = getCardsFromActiveSubtopic(topic);
    const pending = scopedCards.filter((card) => cardStatus(card.id) !== "mastered");
    const shuffled = shuffleArray(pending);
    openStudyModalWithCards(shuffled, 0);
  }

  function openStudyFromHomeDueBadge() {
    const pendingCards = getPendingCardsFromUserDecks();
    if (!pendingCards.length) return;
    openStudyModalWithCards(shuffleArray(pendingCards), 0);
  }

  function openStudyFromCardId(cardId) {
    const topic = getCurrentTopic();
    if (!topic || !Array.isArray(topic.cards) || !topic.cards.length) return;
    const cards = [...getCardsFromActiveSubtopic(topic)];
    const index = cards.findIndex((card) => String(card.id) === String(cardId));
    if (index < 0) return;
    openStudyModalWithCards(cards, index);
  }

  function revealStudyAnswer() {
    if (!studySession) return;
    studySession.revealed = true;
    renderStudyModalCard();
  }

  function hideStudyAnswer() {
    if (!studySession) return;
    studySession.revealed = false;
    renderStudyModalCard();
  }

  function markCurrentStudyCardAsMastered() {
    const current = getCurrentStudyCard();
    if (!current) return;
    const mastered = cardStatus(current.id) === "mastered";
    if (mastered) {
      clearCardStudyState(current.id);
      if (studySession) studySession.showRatingPanel = false;
    } else if (studySession) {
      studySession.showRatingPanel = !studySession.showRatingPanel;
    }
    renderStudyModalCard();
    renderTopicState();
  }

  function applyStudyReviewPreset(minutes) {
    const current = getCurrentStudyCard();
    if (!current) return;
    const safeMinutes = Math.max(0, Number.parseInt(String(minutes || ""), 10) || 0);
    if (safeMinutes === 0) {
      markCardStudied(current.id, "in_progress", null);
    } else {
      const nextAt = new Date(Date.now() + safeMinutes * 60 * 1000).toISOString();
      markCardStudied(current.id, "mastered", nextAt);
    }
    if (studySession) studySession.showRatingPanel = false;
    renderStudyModalCard();
    renderTopicState();
  }

  function goToNextStudyCard() {
    const current = getCurrentStudyCard();
    if (!current || !studySession) return;
    if (cardStatus(current.id) !== "mastered") {
      markCardStudied(current.id, "in_progress");
    }
    if (studySession.index >= studySession.cards.length - 1) {
      closeStudyModal();
      renderTopicState();
      return;
    }
    studySession.index += 1;
    studySession.revealed = false;
    studySession.showRatingPanel = false;
    renderStudyModalCard();
    renderTopicState();
  }

  function goToPreviousStudyCard() {
    if (!studySession) return;
    if ((studySession.index || 0) <= 0) return;
    studySession.index -= 1;
    studySession.revealed = false;
    studySession.showRatingPanel = false;
    renderStudyModalCard();
  }

  function startReviewTicker() {
    if (reviewTicker) clearInterval(reviewTicker);
    reviewTicker = setInterval(() => {
      if (activeTopicId && elements.cardEditor?.hidden) renderTopicState();
      if (studySession) renderStudyModalCard();
      if (!activeDeckId) renderHomeDueBadge();
    }, 60 * 1000);
  }

  function renderDeckCardsList(cards, subtopicNames = new Map()) {
    elements.deckCardsList.innerHTML = "";
    if (!Array.isArray(cards) || !cards.length) {
      elements.deckCardsList.hidden = true;
      return;
    }

    const canSelectCards = subtopicNames instanceof Map && subtopicNames.size > 0;
    cards.forEach((card, index) => {
      const article = document.createElement("article");
      article.className = "deck-card-item is-clickable";
      article.dataset.cardId = card.id;
      if (cardSelectionMode) article.classList.add("is-selection-mode");
      if (selectedCardIds.has(String(card.id))) article.classList.add("is-selected");
      const status = cardStatus(card.id);
      if (status === "mastered") article.classList.add("is-mastered");
      const frontText = stripHtml(card.frontHtml).slice(0, 140);
      const backText = stripHtml(card.backHtml).slice(0, 140);
      const front = escapeHtml(frontText) || (containsImageTag(card.frontHtml) ? "[imagem]" : "(Frente vazia)");
      const back = escapeHtml(backText) || (containsImageTag(card.backHtml) ? "[imagem]" : "(Verso vazio)");
      const subtopicLabel = subtopicNames.get(String(card.subtopicId || "")) || "";
      article.innerHTML = `
        <div class="deck-card-item-head">Cartão ${cards.length - index}</div>
        <div class="deck-card-item-row"><strong>Frente:</strong> ${front}</div>
        <div class="deck-card-item-row"><strong>Verso:</strong> ${back}</div>
      `;

      if (subtopicLabel) {
        const subtopicBadge = document.createElement("p");
        subtopicBadge.className = "deck-card-subtopic-badge";
        subtopicBadge.textContent = subtopicLabel;
        article.appendChild(subtopicBadge);
      }

      const countdownText = getCardReviewCountdownText(card.id);
      if (countdownText) {
        const timer = document.createElement("p");
        timer.className = "deck-card-review-timer";
        timer.textContent = countdownText;
        article.appendChild(timer);
      }

      const menu = buildCardMenu(
        [
          ...(canSelectCards
            ? [
                {
                  label: selectedCardIds.has(String(card.id)) ? "Desselecionar" : "Selecionar",
                  onClick: () => {
                    cardSelectionMode = true;
                    const safeCardId = String(card.id || "");
                    if (selectedCardIds.has(safeCardId)) selectedCardIds.delete(safeCardId);
                    else selectedCardIds.add(safeCardId);
                    renderTopicState();
                  },
                },
              ]
            : []),
          {
            label: "Editar cartão",
            onClick: () => {
              openCardEditorForEdit(card);
            },
          },
          {
            label: "Renomear",
            onClick: async () => {
              const currentName = toPlainTextFromHtml(card.frontHtml) || "Cartão";
              const nextName = await openActionModal({
                mode: "rename",
                title: "Renomear",
                subtitle: "Defina o novo título do cartão.",
                defaultValue: currentName,
                placeholder: "Novo nome do cartão",
                confirmLabel: "Salvar",
              });
              if (!nextName) return;
              if (!(await ensureAuthenticatedOnlineMutation("cartão", "renomear"))) return;
              const result = cache.renameCardInTopic(
                currentUserId,
                activeDeckId,
                activeTopicId,
                card.id,
                nextName,
              );
              if (!result.ok) {
                openActionModal({
                  title: "Erro",
                  subtitle: "Não foi possível renomear o cartão.",
                  confirmLabel: "Ok",
                });
                return;
              }
              renderHome();
              renderTopicState();
            },
          },
          {
            label: "Deletar",
            danger: true,
            onClick: async () => {
              const confirmed = await openActionModal({
                title: "Deletar",
                subtitle: "Tem certeza que deseja excluir este cartão?",
                confirmLabel: "Deletar",
                danger: true,
              });
              if (!confirmed) return;
              if (!(await ensureAuthenticatedOnlineMutation("cartão", "excluir"))) return;
              const result = cache.deleteCardFromTopic(currentUserId, activeDeckId, activeTopicId, card.id);
              if (!result.ok) {
                openActionModal({
                  title: "Erro",
                  subtitle: "Não foi possível excluir o cartão.",
                  confirmLabel: "Ok",
                });
                return;
              }
              const syncResult = await flushRemoteAfterDelete("exclusão de cartão");
              if (!syncResult.ok) {
                openActionModal({
                  title: "Cartão excluído localmente",
                  subtitle: "Falha temporária ao enviar a exclusão para a nuvem. Vamos tentar sincronizar novamente.",
                  confirmLabel: "Ok",
                });
              }
              renderHome();
              renderTopicState();
            },
          },
        ],
        "cartão",
      );

      article.appendChild(menu);
      if (cardSelectionMode) {
        const indicator = document.createElement("span");
        indicator.className = "deck-card-select-indicator";
        indicator.textContent = selectedCardIds.has(String(card.id)) ? "✓" : "";
        article.appendChild(indicator);
      }
      article.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest(".card-menu")) return;
        if (cardSelectionMode) {
          const safeCardId = String(card.id || "");
          if (selectedCardIds.has(safeCardId)) selectedCardIds.delete(safeCardId);
          else selectedCardIds.add(safeCardId);
          renderTopicState();
          return;
        }
        openStudyFromCardId(card.id);
      });
      elements.deckCardsList.appendChild(article);
    });

    elements.deckCardsList.hidden = false;
  }

  function renderTopicHighlight(cards) {
    if (!elements.topicHighlightCard) return;
    const list = Array.isArray(cards) ? cards : [];
    const mastered = list.filter((card) => cardStatus(card.id) === "mastered").length;
    const notStudied = list.filter((card) => cardStatus(card.id) === "not_studied").length;
    const todayTotal = list.filter((card) => cardStatus(card.id) !== "mastered").length;
    if (elements.topicHighlightTotal) elements.topicHighlightTotal.textContent = String(todayTotal);
    if (elements.topicHighlightNew) elements.topicHighlightNew.textContent = String(notStudied);
    if (elements.topicHighlightMastered) elements.topicHighlightMastered.textContent = String(mastered);
    elements.topicHighlightCard.hidden = list.length === 0;
  }

  function renderTopicState() {
    scheduleFlashcardsIntegrityCheck("render_topic_state");
    const deck = getCurrentDeck();
    const topic = getCurrentTopic();
    if (!deck || !topic) {
      resetCardSelectionMode();
      clearTopicCloudSyncProgress();
      updateTopicLoadingBadge();
      renderDeckLevel();
      return;
    }

    if (elements.deckViewHeader) elements.deckViewHeader.hidden = true;
    elements.deckTopicsPanel.hidden = true;
    elements.topicViewPanel.hidden = false;
    if (elements.topicDeckName) elements.topicDeckName.textContent = deck.name;
    elements.topicViewTitle.textContent = topic.name;
    if (elements.topicBackBtn) elements.topicBackBtn.hidden = false;
    populateSubtopicControls(topic);

    const allTopicCards = Array.isArray(topic.cards) ? topic.cards : [];
    const cards = getCardsFromActiveSubtopic(topic);
    const hasCards = cards.length > 0;
    const subtopicNames = new Map(getTopicSubtopics(topic).map((subtopic) => [String(subtopic.id), subtopic.name]));
    if (!subtopicNames.size && cardSelectionMode) resetCardSelectionMode();
    renderCardSelectionBar(topic);
    renderTopicCloudSyncProgress(topic);

    if (!allTopicCards.length && elements.cardEditor.hidden) {
      elements.deckEmptyState.hidden = false;
      if (elements.topicHighlightCard) elements.topicHighlightCard.hidden = true;
      elements.deckCardsList.hidden = true;
    } else {
      elements.deckEmptyState.hidden = true;
      if (elements.cardEditor.hidden) renderTopicHighlight(cards);
      else if (elements.topicHighlightCard) elements.topicHighlightCard.hidden = true;
      if (elements.cardEditor.hidden) {
        renderDeckCardsList(cards, subtopicNames);
      }
    }
    updateTopicLoadingBadge();
  }

  function getDragAfterElement(container, y) {
    const siblings = [...container.querySelectorAll(".deck-card:not(.dragging)")];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    siblings.forEach((child) => {
      const rect = child.getBoundingClientRect();
      const offset = y - (rect.top + rect.height / 2);
      if (offset < 0 && offset > closest.offset) closest = { offset, element: child };
    });
    return closest.element;
  }

  function setupDragAndDrop() {
    const grid = elements.decksGrid;
    if (!grid) return;
    grid.addEventListener("dragover", (event) => {
      if (!draggingDeckId) return;
      event.preventDefault();
      const draggingEl = grid.querySelector(".deck-card.dragging");
      if (!draggingEl) return;
      const after = getDragAfterElement(grid, event.clientY);
      if (!after) grid.appendChild(draggingEl);
      else grid.insertBefore(draggingEl, after);
    });

    grid.addEventListener("drop", (event) => {
      if (!draggingDeckId) return;
      event.preventDefault();
      const orderedIds = [...grid.querySelectorAll(".deck-card")].map((card) => card.dataset.deckId).filter(Boolean);
      if (orderedIds.length) {
        cache.saveDeckOrderByUser(currentUserId, orderedIds);
        justDroppedAt = Date.now();
        renderHome();
      }
    });
  }

  function moveOrderItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= orderDraftDecks.length) return;
    const next = [...orderDraftDecks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    orderDraftDecks = next;
    renderOrderList();
  }

  function buildOrderListItem(deck, index) {
    const li = document.createElement("li");
    li.className = "order-item";
    li.innerHTML = `
      <div class="order-item-info">
        <span class="order-item-name"></span>
        <span class="order-item-hint"></span>
      </div>
      <div class="order-item-actions">
        <button type="button" class="order-move-btn order-up">↑</button>
        <button type="button" class="order-move-btn order-down">↓</button>
      </div>
    `;
    li.querySelector(".order-item-name").textContent = deck.name;
    li.querySelector(".order-item-hint").textContent = deck.cardsCount > 0 ? formatCardCount(deck.cardsCount) : "Sem cartões";
    const up = li.querySelector(".order-up");
    const down = li.querySelector(".order-down");
    up.disabled = index === 0;
    down.disabled = index === orderDraftDecks.length - 1;
    up.addEventListener("click", () => moveOrderItem(index, -1));
    down.addEventListener("click", () => moveOrderItem(index, 1));
    return li;
  }

  function renderOrderList() {
    elements.orderList.innerHTML = "";
    orderDraftDecks.forEach((deck, index) => elements.orderList.appendChild(buildOrderListItem(deck, index)));
  }

  function renderHome() {
    scheduleFlashcardsIntegrityCheck("render_home");
    const decks = cache.loadDecksByUser(currentUserId);
    elements.decksGrid.innerHTML = "";
    decks.forEach((deck) => elements.decksGrid.appendChild(createDeckCard(deck)));

    const hasDecks = decks.length > 0;
    elements.emptyHomeSection.hidden = hasDecks;
    elements.decksHomeSection.hidden = !hasDecks;
    elements.decksEmpty.style.display = hasDecks ? "none" : "block";
    elements.openOrderMenuBtn.hidden = decks.length < 2;
    renderHomeDueBadge();
  }

  async function handleCreateDeckConfirm() {
    const name = normalizeName(elements.deckModalInput.value);
    if (!name) {
      elements.deckModalError.textContent = "Digite um nome para o deck.";
      return;
    }
    if (name.length < 2) {
      elements.deckModalError.textContent = "Use pelo menos 2 caracteres.";
      return;
    }
    if (cache.existsDeckName(currentUserId, normalizeComparable(name))) {
      elements.deckModalError.textContent = "Você já possui um deck com esse nome.";
      return;
    }
    if (!(await ensureLocalCreateContext("deck"))) return;

    const result = cache.createDeck(currentUserId, name, selectedDeckColor);
    if (!result.ok) {
      elements.deckModalError.textContent = "Não foi possível criar o deck agora.";
      return;
    }

    closeDeckModal();
    renderHome();
    queueCreateSyncFeedback({
      entityType: "Deck",
      entityId: result?.deck?.id || "",
      entityName: name,
    });
  }

  async function handleCreateTopicConfirm() {
    if (!activeDeckId) return;
    const name = normalizeName(elements.topicNameInput.value);
    if (!name) {
      elements.topicModalError.textContent = "Digite um nome para o tópico.";
      return;
    }
    if (name.length < 2) {
      elements.topicModalError.textContent = "Use pelo menos 2 caracteres.";
      return;
    }
    if (cache.existsTopicName(currentUserId, activeDeckId, normalizeComparable(name))) {
      elements.topicModalError.textContent = "Já existe um tópico com esse nome neste deck.";
      return;
    }
    if (!(await ensureLocalCreateContext("tópico"))) return;

    const result = cache.createTopic(currentUserId, activeDeckId, name);
    if (!result.ok) {
      elements.topicModalError.textContent = "Não foi possível criar o tópico agora.";
      return;
    }

    closeTopicModal();
    renderHome();
    renderDeckLevel();
    queueCreateSyncFeedback({
      entityType: "Tópico",
      entityId: result?.topic?.id || "",
      entityName: name,
    });
  }

  function runEditorCommand(editorId, cmd) {
    const editor = document.getElementById(editorId);
    if (!editor) return;
    editor.focus();

    if (cmd === "enhance") {
      editor.innerHTML = editor.innerHTML.trim();
      return;
    }

    if (cmd === "image") {
      pickAndInsertCardImage(editor);
      return;
    }

    if (cmd === "pen") {
      document.execCommand("insertText", false, "✍ ");
      return;
    }

    if (cmd === "highlight") {
      document.execCommand("backColor", false, "#f9e27d");
      return;
    }

    if (cmd === "audio") {
      const text = window.getSelection()?.toString() || editor.textContent || "";
      if (!text.trim()) return;
      const utter = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      return;
    }

    if (cmd === "bold") {
      document.execCommand("bold");
      setTimeout(() => refreshToolbarState(editorId), 0);
      return;
    }
    if (cmd === "italic") {
      document.execCommand("italic");
      setTimeout(() => refreshToolbarState(editorId), 0);
      return;
    }
    if (cmd === "underline") {
      document.execCommand("underline");
      setTimeout(() => refreshToolbarState(editorId), 0);
      return;
    }
    if (cmd === "strike") {
      document.execCommand("strikeThrough");
      setTimeout(() => refreshToolbarState(editorId), 0);
      return;
    }
    if (cmd === "heading") return document.execCommand("formatBlock", false, "h3");
    if (cmd === "ul") return document.execCommand("insertUnorderedList");
    if (cmd === "ol") return document.execCommand("insertOrderedList");
    if (cmd === "sub") return document.execCommand("subscript");
    if (cmd === "sup") return document.execCommand("superscript");

    if (cmd === "code") {
      const selected = window.getSelection()?.toString() || "código";
      document.execCommand("insertHTML", false, `<code>${selected}</code>`);
      return;
    }

    if (cmd === "html") {
      const next = window.prompt("Editar HTML:", editor.innerHTML);
      if (next !== null) editor.innerHTML = next;
      return;
    }

    if (cmd === "link") {
      const url = window.prompt("URL do link:");
      if (!url) return;
      document.execCommand("createLink", false, url);
    }
  }

  function sanitizeFilename(name) {
    return String(name || "imagem")
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }

  function getCardImagePickerInput() {
    if (cardImagePickerInput) return cardImagePickerInput;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.hidden = true;
    document.body.appendChild(input);
    cardImagePickerInput = input;
    return input;
  }

  function pickSingleImageFile() {
    return new Promise((resolve) => {
      const input = getCardImagePickerInput();
      const onChange = () => {
        input.removeEventListener("change", onChange);
        const file = input.files && input.files[0] ? input.files[0] : null;
        input.value = "";
        resolve(file);
      };
      input.addEventListener("change", onChange, { once: true });
      input.click();
    });
  }

  async function uploadCardImageAndGetUrl(file) {
    if (!file) throw new Error("Nenhuma imagem selecionada.");
    if (!String(file.type || "").startsWith("image/")) {
      throw new Error("Selecione um arquivo de imagem válido.");
    }
    if ((Number(file.size) || 0) > CARD_IMAGE_MAX_BYTES) {
      throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const supabase = window.supabaseClient || null;
    const requiresRemoteImageUpload =
      cache && typeof cache.canUseRemote === "function" && cache.canUseRemote(currentUserId);
    const canUpload = supabase && typeof supabase.storage?.from === "function" && /^[0-9a-f-]{36}$/i.test(currentUserId);

    if (requiresRemoteImageUpload && !navigator.onLine) {
      throw new Error("Conecte-se à internet para inserir imagens em flashcards.");
    }

    if (!canUpload) {
      if (requiresRemoteImageUpload) {
        throw new Error("Não foi possível enviar a imagem para a nuvem. Tente novamente em instantes.");
      }
      return readFileAsDataURL(file);
    }

    const ext = sanitizeFilename(file.name || "imagem").split(".").pop() || "png";
    const safeExt = ext.replace(/[^\w]/g, "").toLowerCase() || "png";
    const path = `${currentUserId}/${Date.now()}-${Math.random().toString(16).slice(2, 10)}.${safeExt}`;

    const { error: uploadError } = await supabase.storage.from(CARD_IMAGE_BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || "image/png",
      cacheControl: "3600",
    });
    if (uploadError) throw new Error("Não foi possível enviar a imagem para o armazenamento.");

    const { data } = supabase.storage.from(CARD_IMAGE_BUCKET).getPublicUrl(path);
    const publicUrl = normalizeName(data?.publicUrl);
    if (!publicUrl) throw new Error("Não foi possível obter a URL pública da imagem.");
    return publicUrl;
  }

  async function pickAndInsertCardImage(editor) {
    const file = await pickSingleImageFile();
    if (!file) return;
    const previousHtml = editor.innerHTML;

    try {
      editor.focus();
      document.execCommand("insertText", false, "Enviando imagem...");
      const imageUrl = await uploadCardImageAndGetUrl(file);
      editor.focus();
      editor.innerHTML = previousHtml;
      document.execCommand("insertHTML", false, `<img src="${imageUrl}" alt="Imagem do cartão" loading="lazy" />`);
      refreshToolbarState(editor.id);
    } catch (error) {
      editor.innerHTML = previousHtml;
      const message = error instanceof Error && error.message ? error.message : "Não foi possível inserir a imagem.";
      window.alert(message);
    }
  }

  async function saveCard() {
    if (!activeDeckId || !activeTopicId) return;

    const frontHtml = sanitizeCardHtml(elements.frontEditor.innerHTML).trim();
    const backHtml = sanitizeCardHtml(elements.backEditor.innerHTML).trim();
    const reverse = Boolean(elements.reverseToggleInput.checked);
    const selectedSubtopicId = normalizeName(cardEditorSubtopicId) || null;
    const isEditing = Boolean(editingCardId);
    if (isEditing) {
      if (!(await ensureAuthenticatedOnlineMutation("flashcard", "editar"))) return;
    } else {
      if (!(await ensureLocalCreateContext("cartão"))) return;
    }
    const result = isEditing
      ? cache.updateCardInTopic(currentUserId, activeDeckId, activeTopicId, editingCardId, {
          frontHtml,
          backHtml,
          reverse,
          subtopicId: selectedSubtopicId,
        })
      : cache.addCardToTopic(currentUserId, activeDeckId, activeTopicId, {
          frontHtml,
          backHtml,
          reverse,
          subtopicId: selectedSubtopicId,
        });

    if (!result.ok) {
      window.alert(describeCardSaveFailure(result.reason));
      return;
    }

    if (isEditing) {
      const saveButton = elements.cardEditorSaveBtn;
      const previousDisabled = Boolean(saveButton?.disabled);
      if (saveButton) saveButton.disabled = true;
      const syncResult = await flushRemoteAfterCriticalSave("cartão");
      if (saveButton) saveButton.disabled = previousDisabled;

      if (!syncResult.ok) {
        showFooterSyncToast({
          message: `Falha ao sincronizar edição do cartão: ${formatSyncErrorReason(syncResult.error)}. Vamos tentar novamente em segundo plano.`,
          state: "error",
          durationMs: 4200,
        });
      } else {
        showSaveFeedbackToast("Cartão atualizado com sucesso!");
      }
    } else {
      queueCreateSyncFeedback({
        entityType: "Cartão",
        entityId: result?.card?.id || "",
        entityName: getCardLabelFromHtml(frontHtml),
      });
    }

    if (isEditing) {
      setCardEditorVisible(false);
      resetCardEditor();
      renderHome();
      renderTopicState();
      return;
    }

    resetCardEditor();
    setTimeout(() => elements.frontEditor.focus(), 0);
    renderHome();
    renderTopicState();
  }

  // ─── "Descobrir Cards" — permissão de admin ──────────────
  /**
   * Verifica se o usuário atual tem papel ADMIN, usando o cache de sessão
   * (válido por 30 minutos) antes de consultar o banco.
   * @returns {Promise<boolean>}
   */
  async function isCurrentUserAdmin() {
    try {
      await window.adminGuardPromise;
    } catch (_) {
      /* noop */
    }
    try {
      const raw = sessionStorage.getItem("mm_guard_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.userId === currentUserId && Date.now() - parsed.ts < 30 * 60 * 1000) {
          return parsed.role === "ADMIN";
        }
      }
    } catch (_) {
      /* noop */
    }
    try {
      const supabaseClient = window.supabaseClient;
      if (!supabaseClient || String(currentUserId) === "anonymous") return false;
      const { data } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", currentUserId)
        .maybeSingle();
      return String(data?.role || "").toUpperCase() === "ADMIN";
    } catch (_) {
      return false;
    }
  }

  // ─── "Descobrir Cards" — toggle Meus Decks / Descobrir ───
  function setDecksView(view) {
    const isDiscover = view === "discover";
    if (elements.decksViewMine) elements.decksViewMine.hidden = isDiscover;
    if (elements.discoverRoot) elements.discoverRoot.hidden = !isDiscover;
    if (elements.decksViewTabMine) {
      elements.decksViewTabMine.classList.toggle("is-active", !isDiscover);
      elements.decksViewTabMine.setAttribute("aria-selected", String(!isDiscover));
    }
    if (elements.decksViewTabDiscover) {
      elements.decksViewTabDiscover.classList.toggle("is-active", isDiscover);
      elements.decksViewTabDiscover.setAttribute("aria-selected", String(isDiscover));
    }
    if (isDiscover) showDiscoverAreas();
  }

  // ─── "Descobrir Cards" — navegação áreas → matérias → conteúdos → cards ─
  function showDiscoverView(level) {
    if (elements.discoverAreasView) elements.discoverAreasView.hidden = level !== "areas";
    if (elements.discoverSubjectsView) elements.discoverSubjectsView.hidden = level !== "subjects";
    if (elements.discoverContentsView) elements.discoverContentsView.hidden = level !== "contents";
    if (elements.discoverTopicsView) elements.discoverTopicsView.hidden = level !== "topics";
    if (elements.discoverCardsView) elements.discoverCardsView.hidden = level !== "cards";
  }

  function getDiscoverArea(areaId) {
    return DISCOVER_AREAS.find((item) => item.id === areaId) || null;
  }

  function showDiscoverAreas() {
    discoverAreaId = null;
    discoverMateriaId = null;
    discoverConteudoId = null;
    discoverTopicoId = null;
    showDiscoverView("areas");
    renderDiscoverAreas();
  }

  function renderDiscoverAreas() {
    if (!elements.discoverAreasGrid) return;
    elements.discoverAreasGrid.innerHTML = "";
    DISCOVER_AREAS.forEach((area) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "discover-area-card";
      button.style.background = `linear-gradient(145deg, ${area.colorFrom}, ${area.colorTo})`;

      const title = document.createElement("h3");
      title.className = "discover-area-card-title";
      title.textContent = toTitleCasePt(area.label);

      const arrow = document.createElement("span");
      arrow.className = "discover-area-card-arrow";
      arrow.textContent = "›";

      button.append(title, arrow);
      button.addEventListener("click", () => openDiscoverArea(area.id));
      elements.discoverAreasGrid.appendChild(button);
    });
  }

  // Áreas com uma única matéria (ex.: Matemática) pulam direto pro nível de conteúdos.
  async function openDiscoverArea(areaId) {
    const area = getDiscoverArea(areaId);
    if (!area) return;
    discoverAreaId = areaId;
    discoverMateriaId = null;
    discoverConteudoId = null;
    discoverTopicoId = null;

    if (area.subjects.length === 1) {
      await openDiscoverMateria(area.subjects[0], area.label);
      return;
    }

    if (elements.discoverSubjectsTitle) elements.discoverSubjectsTitle.textContent = toTitleCasePt(area.label);
    showDiscoverView("subjects");
    await renderDiscoverSubjects(area);
  }

  async function fetchDiscoverMateriaCounts(areaId) {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient || !areaId) return {};
    const { data, error } = await supabaseClient
      .from("public_flashcards")
      .select("materia")
      .eq("area", areaId)
      .eq("is_published", true);
    if (error || !Array.isArray(data)) return {};
    const counts = {};
    data.forEach((row) => {
      const key = row?.materia;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  async function renderDiscoverSubjects(area) {
    if (!elements.discoverSubjectsList) return;
    elements.discoverSubjectsList.innerHTML = "";
    const counts = await fetchDiscoverMateriaCounts(area.id);
    if (discoverAreaId !== area.id) return; // usuário já navegou para outro lugar

    elements.discoverSubjectsList.innerHTML = "";
    area.subjects.forEach((materiaId) => {
      const label = MATERIA_LABELS[materiaId] || materiaId;
      const count = counts[materiaId] || 0;
      const conteudosCount = getContentsForMateria(materiaId).length;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "discover-subject-card";

      const badge = document.createElement("span");
      badge.className = "discover-subject-card-badge";
      badge.style.background = `linear-gradient(145deg, ${area.colorFrom}, ${area.colorTo})`;
      badge.textContent = label.charAt(0).toUpperCase();

      const body = document.createElement("span");
      body.className = "discover-subject-card-body";

      const name = document.createElement("span");
      name.className = "discover-subject-card-name";
      name.textContent = toTitleCasePt(label);

      const meta = document.createElement("span");
      meta.className = "discover-subject-card-meta";
      meta.textContent =
        count > 0
          ? `${count} ${count === 1 ? "card disponível" : "cards disponíveis"}`
          : `Nenhum card ainda · ${conteudosCount} conteúdos catalogados`;

      body.append(name, meta);

      const arrow = document.createElement("span");
      arrow.className = "discover-subject-card-arrow";
      arrow.textContent = "›";

      button.append(badge, body, arrow);
      button.addEventListener("click", () => openDiscoverMateria(materiaId, label));
      elements.discoverSubjectsList.appendChild(button);
    });
  }

  async function fetchDiscoverConteudoCounts(areaId, materiaId) {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient || !areaId || !materiaId) return {};
    const { data, error } = await supabaseClient
      .from("public_flashcards")
      .select("conteudo")
      .eq("area", areaId)
      .eq("materia", materiaId)
      .eq("is_published", true);
    if (error || !Array.isArray(data)) return {};
    const counts = {};
    data.forEach((row) => {
      const key = row?.conteudo;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  async function openDiscoverMateria(materiaId, materiaLabel) {
    discoverMateriaId = materiaId;
    discoverConteudoId = null;
    discoverTopicoId = null;
    const area = getDiscoverArea(discoverAreaId);
    const backToAreas = Boolean(area && area.subjects.length === 1);

    if (elements.discoverContentsTitle) elements.discoverContentsTitle.textContent = toTitleCasePt(materiaLabel);
    if (elements.discoverContentsBackBtn) {
      elements.discoverContentsBackBtn.textContent = backToAreas ? "← Áreas" : "← Matérias";
    }
    showDiscoverView("contents");
    await renderDiscoverContents(materiaId);
  }

  async function renderDiscoverContents(materiaId) {
    if (!elements.discoverContentsList) return;
    elements.discoverContentsList.innerHTML = "";
    const area = getDiscoverArea(discoverAreaId);
    const conteudos = getContentsForMateria(materiaId);
    const counts = await fetchDiscoverConteudoCounts(discoverAreaId, materiaId);
    if (discoverMateriaId !== materiaId) return; // usuário já navegou para outro lugar

    elements.discoverContentsList.innerHTML = "";
    if (!conteudos.length) {
      if (elements.discoverContentsEmpty) elements.discoverContentsEmpty.hidden = false;
      return;
    }
    if (elements.discoverContentsEmpty) elements.discoverContentsEmpty.hidden = true;

    conteudos.forEach((conteudo) => {
      const count = counts[conteudo] || 0;
      const topicosCount = getTopicsForMateriaContent(materiaId, conteudo).length;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "discover-subject-card";

      const badge = document.createElement("span");
      badge.className = "discover-subject-card-badge";
      badge.style.background = area
        ? `linear-gradient(145deg, ${area.colorFrom}, ${area.colorTo})`
        : "var(--accent)";
      badge.textContent = conteudo.charAt(0).toUpperCase();

      const body = document.createElement("span");
      body.className = "discover-subject-card-body";

      const name = document.createElement("span");
      name.className = "discover-subject-card-name";
      name.textContent = toTitleCasePt(conteudo);

      const meta = document.createElement("span");
      meta.className = "discover-subject-card-meta";
      meta.textContent =
        count > 0
          ? `${count} ${count === 1 ? "card disponível" : "cards disponíveis"}`
          : topicosCount > 0
            ? `Nenhum card ainda · ${topicosCount} tópicos catalogados`
            : "Nenhum card ainda";

      body.append(name, meta);

      const arrow = document.createElement("span");
      arrow.className = "discover-subject-card-arrow";
      arrow.textContent = "›";

      button.append(badge, body, arrow);
      button.addEventListener("click", () => openDiscoverConteudo(conteudo));
      elements.discoverContentsList.appendChild(button);
    });
  }

  // Conteúdos sem tópicos catalogados (ex.: "Química Ambiental") pulam direto pros cards.
  async function openDiscoverConteudo(conteudo) {
    discoverConteudoId = conteudo;
    discoverTopicoId = null;
    const topicos = getTopicsForMateriaContent(discoverMateriaId, conteudo);

    if (topicos.length > 0) {
      if (elements.discoverTopicsTitle) elements.discoverTopicsTitle.textContent = toTitleCasePt(conteudo);
      showDiscoverView("topics");
      await renderDiscoverTopics(conteudo, topicos);
      return;
    }

    if (elements.discoverCardsTitle) elements.discoverCardsTitle.textContent = toTitleCasePt(conteudo);
    if (elements.discoverCardsBackBtn) elements.discoverCardsBackBtn.textContent = "← Conteúdos";
    if (elements.discoverAddCardBtn) elements.discoverAddCardBtn.hidden = !isAdminUser;
    showDiscoverView("cards");
    await renderDiscoverCards();
  }

  async function fetchDiscoverTopicoCounts(areaId, materiaId, conteudo) {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient || !areaId || !materiaId || !conteudo) return {};
    const { data, error } = await supabaseClient
      .from("public_flashcards")
      .select("topico")
      .eq("area", areaId)
      .eq("materia", materiaId)
      .eq("conteudo", conteudo)
      .eq("is_published", true);
    if (error || !Array.isArray(data)) return {};
    const counts = {};
    data.forEach((row) => {
      const key = row?.topico;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  async function renderDiscoverTopics(conteudo, topicos) {
    if (!elements.discoverTopicsList) return;
    elements.discoverTopicsList.innerHTML = "";
    const area = getDiscoverArea(discoverAreaId);
    const counts = await fetchDiscoverTopicoCounts(discoverAreaId, discoverMateriaId, conteudo);
    if (discoverConteudoId !== conteudo) return; // usuário já navegou para outro lugar

    elements.discoverTopicsList.innerHTML = "";
    topicos.forEach((topico) => {
      const count = counts[topico] || 0;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "discover-subject-card";

      const badge = document.createElement("span");
      badge.className = "discover-subject-card-badge";
      badge.style.background = area
        ? `linear-gradient(145deg, ${area.colorFrom}, ${area.colorTo})`
        : "var(--accent)";
      badge.textContent = topico.charAt(0).toUpperCase();

      const body = document.createElement("span");
      body.className = "discover-subject-card-body";

      const name = document.createElement("span");
      name.className = "discover-subject-card-name";
      name.textContent = toTitleCasePt(topico);

      const meta = document.createElement("span");
      meta.className = "discover-subject-card-meta";
      meta.textContent =
        count > 0 ? `${count} ${count === 1 ? "card disponível" : "cards disponíveis"}` : "Nenhum card ainda";

      body.append(name, meta);

      const arrow = document.createElement("span");
      arrow.className = "discover-subject-card-arrow";
      arrow.textContent = "›";

      button.append(badge, body, arrow);
      button.addEventListener("click", () => openDiscoverTopico(topico));
      elements.discoverTopicsList.appendChild(button);
    });
  }

  async function openDiscoverTopico(topico) {
    discoverTopicoId = topico;
    if (elements.discoverCardsTitle) elements.discoverCardsTitle.textContent = toTitleCasePt(topico);
    if (elements.discoverCardsBackBtn) elements.discoverCardsBackBtn.textContent = "← Tópicos";
    if (elements.discoverAddCardBtn) elements.discoverAddCardBtn.hidden = !isAdminUser;
    showDiscoverView("cards");
    await renderDiscoverCards();
  }

  async function renderDiscoverCards() {
    if (!elements.discoverCardsList) return;
    elements.discoverCardsList.innerHTML = "";
    if (elements.discoverCardsEmpty) elements.discoverCardsEmpty.hidden = true;
    discoverCardsAll = [];
    discoverCardsPage = 1;
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient || !discoverAreaId || !discoverMateriaId || !discoverConteudoId) {
      renderDiscoverCardsPagination();
      return;
    }

    let query = supabaseClient
      .from("public_flashcards")
      .select("*")
      .eq("area", discoverAreaId)
      .eq("materia", discoverMateriaId)
      .eq("conteudo", discoverConteudoId)
      .eq("is_published", true);
    if (discoverTopicoId) query = query.eq("topico", discoverTopicoId);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error || !Array.isArray(data) || data.length === 0) {
      if (elements.discoverCardsEmpty) elements.discoverCardsEmpty.hidden = false;
      renderDiscoverCardsPagination();
      return;
    }

    discoverCardsAll = data;
    renderDiscoverCardsPage();
  }

  function renderDiscoverCardsPage() {
    if (!elements.discoverCardsList) return;
    elements.discoverCardsList.innerHTML = "";
    const totalPages = Math.max(1, Math.ceil(discoverCardsAll.length / DISCOVER_CARDS_PAGE_SIZE));
    discoverCardsPage = Math.min(Math.max(1, discoverCardsPage), totalPages);
    const start = (discoverCardsPage - 1) * DISCOVER_CARDS_PAGE_SIZE;
    const pageCards = discoverCardsAll.slice(start, start + DISCOVER_CARDS_PAGE_SIZE);

    pageCards.forEach((card, indexInPage) => {
      elements.discoverCardsList.appendChild(buildDiscoverCardItem(card, start + indexInPage));
    });

    renderDiscoverCardsPagination();
  }

  function renderDiscoverCardsPagination() {
    if (!elements.discoverCardsPagination) return;
    const totalPages = Math.max(1, Math.ceil(discoverCardsAll.length / DISCOVER_CARDS_PAGE_SIZE));
    const shouldShow = discoverCardsAll.length > DISCOVER_CARDS_PAGE_SIZE;
    elements.discoverCardsPagination.hidden = !shouldShow;
    if (!shouldShow) return;
    if (elements.discoverCardsPageInfo) {
      elements.discoverCardsPageInfo.textContent = `Página ${discoverCardsPage} de ${totalPages}`;
    }
    if (elements.discoverCardsPrevPageBtn) elements.discoverCardsPrevPageBtn.disabled = discoverCardsPage <= 1;
    if (elements.discoverCardsNextPageBtn) elements.discoverCardsNextPageBtn.disabled = discoverCardsPage >= totalPages;
  }

  function buildDiscoverCardItem(card, globalIndex) {
    const article = document.createElement("article");
    article.className = "discover-card-item";

    const title = document.createElement("h3");
    title.className = "discover-card-item-title";
    title.textContent = card.title || "Sem título";
    article.appendChild(title);

    if (isAdminUser) {
      const menu = buildCardMenu(
        [
          {
            label: "Editar",
            onClick: () => openPublicCardEditorModal(card.area, card.materia, card.conteudo, card.topico, card),
          },
          {
            label: "Excluir",
            danger: true,
            onClick: () => handleDeletePublicCard(card),
          },
        ],
        "card público",
      );
      article.appendChild(menu);
    }

    if (card.description) {
      const desc = document.createElement("p");
      desc.className = "discover-card-item-desc";
      desc.textContent = card.description;
      article.appendChild(desc);
    }

    if (!discoverTopicoId && card.topico) {
      const tag = document.createElement("span");
      tag.className = "discover-card-item-topic-tag";
      tag.textContent = toTitleCasePt(card.topico);
      article.appendChild(tag);
    }

    const actions = document.createElement("div");
    actions.className = "discover-card-item-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "ghost-btn discover-card-item-preview-btn";
    previewBtn.textContent = "Visualizar";
    previewBtn.addEventListener("click", () => openDiscoverCardPreview(globalIndex));

    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "primary-btn discover-card-item-import";
    importBtn.textContent = "Importar";
    importBtn.addEventListener("click", () => openImportPublicModal(card));

    actions.append(previewBtn, importBtn);
    article.appendChild(actions);

    return article;
  }

  // ─── "Descobrir Cards" — preview de card com navegação ────
  function openDiscoverCardPreview(index) {
    if (index < 0 || index >= discoverCardsAll.length) return;
    discoverPreviewIndex = index;
    renderDiscoverCardPreview();
    setModalVisibility(elements.discoverPreviewModal, true);
  }

  function closeDiscoverCardPreview() {
    setModalVisibility(elements.discoverPreviewModal, false);
    discoverPreviewIndex = -1;
  }

  const ADMIN_AVATAR_BUCKET = "admin-avatars";
  const DEFAULT_ADMIN_AVATAR_URL = "/imagens/default-avatar.png";

  // Mesmo padrão signed→public→default usado em navbar.js/perfil.js, mas pro
  // avatar do AUTOR do card (não o usuário logado), a partir do path salvo
  // em public_flashcards.author_avatar_path no momento da publicação.
  async function resolveAdminAvatarUrl(avatarPath) {
    if (!avatarPath) return DEFAULT_ADMIN_AVATAR_URL;
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) return DEFAULT_ADMIN_AVATAR_URL;
    try {
      const { data, error } = await supabaseClient.storage.from(ADMIN_AVATAR_BUCKET).createSignedUrl(avatarPath, 3600);
      if (!error && data?.signedUrl) return data.signedUrl;
    } catch (_) {
      /* noop */
    }
    try {
      const { data } = supabaseClient.storage.from(ADMIN_AVATAR_BUCKET).getPublicUrl(avatarPath);
      if (data?.publicUrl) return data.publicUrl;
    } catch (_) {
      /* noop */
    }
    return DEFAULT_ADMIN_AVATAR_URL;
  }

  function renderDiscoverCardPreview() {
    const card = discoverCardsAll[discoverPreviewIndex];
    if (!card) return;
    const previewIndexAtCall = discoverPreviewIndex;

    if (elements.discoverPreviewTitle) elements.discoverPreviewTitle.textContent = card.title || "Sem título";
    if (elements.discoverPreviewAuthorName) {
      elements.discoverPreviewAuthorName.textContent = card.author_name || "Equipe Integral ENEM";
    }
    if (elements.discoverPreviewAuthorAvatar) {
      elements.discoverPreviewAuthorAvatar.src = DEFAULT_ADMIN_AVATAR_URL;
      resolveAdminAvatarUrl(card.author_avatar_path).then((url) => {
        if (discoverPreviewIndex !== previewIndexAtCall) return; // usuário já trocou de card
        if (elements.discoverPreviewAuthorAvatar) elements.discoverPreviewAuthorAvatar.src = url;
      });
    }
    if (elements.discoverPreviewDesc) {
      elements.discoverPreviewDesc.textContent = card.description || "";
      elements.discoverPreviewDesc.hidden = !card.description;
    }
    if (elements.discoverPreviewFront) elements.discoverPreviewFront.innerHTML = sanitizeCardHtml(card.front_html || "");
    if (elements.discoverPreviewBack) elements.discoverPreviewBack.innerHTML = sanitizeCardHtml(card.back_html || "");
    if (elements.discoverPreviewCounter) {
      elements.discoverPreviewCounter.textContent = `${discoverPreviewIndex + 1} de ${discoverCardsAll.length}`;
    }
    if (elements.discoverPreviewPrevBtn) elements.discoverPreviewPrevBtn.disabled = discoverPreviewIndex <= 0;
    if (elements.discoverPreviewNextBtn) {
      elements.discoverPreviewNextBtn.disabled = discoverPreviewIndex >= discoverCardsAll.length - 1;
    }
  }

  function goToPreviousDiscoverPreviewCard() {
    if (discoverPreviewIndex <= 0) return;
    discoverPreviewIndex -= 1;
    renderDiscoverCardPreview();
  }

  function goToNextDiscoverPreviewCard() {
    if (discoverPreviewIndex >= discoverCardsAll.length - 1) return;
    discoverPreviewIndex += 1;
    renderDiscoverCardPreview();
  }

  // ─── "Descobrir Cards" — importar card público pro deck ──
  function populateImportPublicDeckSelect() {
    const decks = cache.loadDecksByUser(currentUserId).filter((deck) => deck.topics.length > 0);
    if (elements.importPublicDeckSelect) {
      elements.importPublicDeckSelect.innerHTML = "";
      decks.forEach((deck) => {
        const option = document.createElement("option");
        option.value = deck.id;
        option.textContent = deck.name;
        elements.importPublicDeckSelect.appendChild(option);
      });
    }
    return decks;
  }

  function populateImportPublicTopicSelect(deck) {
    if (!elements.importPublicTopicSelect) return;
    elements.importPublicTopicSelect.innerHTML = "";
    (deck?.topics || []).forEach((topic) => {
      const option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.name;
      elements.importPublicTopicSelect.appendChild(option);
    });
  }

  function populateImportPublicSubtopicSelect(topic) {
    const subtopics = getTopicSubtopics(topic);
    if (elements.importPublicSubtopicWrap) elements.importPublicSubtopicWrap.hidden = subtopics.length === 0;
    if (!elements.importPublicSubtopicSelect) return;
    elements.importPublicSubtopicSelect.innerHTML = "";
    const generalOption = document.createElement("option");
    generalOption.value = GENERAL_SUBTOPIC_OPTION_VALUE;
    generalOption.textContent = "Geral (sem subtópico)";
    elements.importPublicSubtopicSelect.appendChild(generalOption);
    subtopics.forEach((subtopic) => {
      const option = document.createElement("option");
      option.value = subtopic.id;
      option.textContent = subtopic.name;
      elements.importPublicSubtopicSelect.appendChild(option);
    });
  }

  function refreshImportPublicTopicAndSubtopic() {
    const decks = cache.loadDecksByUser(currentUserId);
    const deck = decks.find((item) => item.id === elements.importPublicDeckSelect?.value) || null;
    populateImportPublicTopicSelect(deck);
    const topic = deck?.topics.find((item) => item.id === elements.importPublicTopicSelect?.value) || deck?.topics[0] || null;
    populateImportPublicSubtopicSelect(topic);
  }

  function openImportPublicModal(card) {
    importPublicCard = card;
    if (elements.importPublicModalError) elements.importPublicModalError.textContent = "";
    const decks = populateImportPublicDeckSelect();
    const hasDecks = decks.length > 0;
    if (elements.importPublicFields) elements.importPublicFields.hidden = !hasDecks;
    if (elements.importPublicEmpty) elements.importPublicEmpty.hidden = hasDecks;
    if (elements.importPublicConfirmBtn) elements.importPublicConfirmBtn.hidden = !hasDecks;
    if (hasDecks) refreshImportPublicTopicAndSubtopic();
    setModalVisibility(elements.importPublicModal, true);
  }

  function closeImportPublicModal() {
    setModalVisibility(elements.importPublicModal, false);
    importPublicCard = null;
  }

  async function confirmImportPublicCard() {
    if (!importPublicCard) return;
    const deckId = elements.importPublicDeckSelect?.value || "";
    const topicId = elements.importPublicTopicSelect?.value || "";
    if (!deckId || !topicId) {
      if (elements.importPublicModalError) {
        elements.importPublicModalError.textContent = "Escolha um deck e um tópico.";
      }
      return;
    }
    const rawSubtopicId = elements.importPublicSubtopicSelect?.value || "";
    const subtopicId = rawSubtopicId && rawSubtopicId !== GENERAL_SUBTOPIC_OPTION_VALUE ? rawSubtopicId : null;

    if (!(await ensureLocalCreateContext("cartão"))) return;

    const result = cache.addCardToTopic(currentUserId, deckId, topicId, {
      frontHtml: sanitizeCardHtml(importPublicCard.front_html || ""),
      backHtml: sanitizeCardHtml(importPublicCard.back_html || ""),
      subtopicId,
      reverse: false,
    });

    if (!result.ok) {
      if (elements.importPublicModalError) {
        elements.importPublicModalError.textContent = describeCardSaveFailure(result.reason);
      }
      return;
    }

    const cardLabel = getCardLabelFromHtml(result?.card?.frontHtml || "");
    closeImportPublicModal();
    renderHome();
    if (activeTopicId === topicId) renderTopicState();
    queueCreateSyncFeedback({
      entityType: "Cartão",
      entityId: result?.card?.id || "",
      entityName: cardLabel,
    });
  }

  // ─── "Descobrir Cards" — criação de card público (admin) ─
  function getContentsForMateria(materiaId) {
    return (window.materiasData?.[materiaId]?.conteudos || []).slice();
  }

  function getTopicsForMateriaContent(materiaId, conteudo) {
    const byContent = window.materiasData?.[materiaId]?.topicosPorConteudo || {};
    return Array.isArray(byContent[conteudo]) ? byContent[conteudo].slice() : [];
  }

  function populatePublicCardAreaSelect() {
    if (!elements.publicCardAreaSelect) return;
    elements.publicCardAreaSelect.innerHTML = "";
    DISCOVER_AREAS.forEach((area) => {
      const option = document.createElement("option");
      option.value = area.id;
      option.textContent = toTitleCasePt(area.label);
      elements.publicCardAreaSelect.appendChild(option);
    });
  }

  function populatePublicCardMateriaSelect(areaId) {
    const area = DISCOVER_AREAS.find((item) => item.id === areaId) || DISCOVER_AREAS[0];
    if (!elements.publicCardMateriaSelect) return;
    elements.publicCardMateriaSelect.innerHTML = "";
    (area?.subjects || []).forEach((materiaId) => {
      const option = document.createElement("option");
      option.value = materiaId;
      option.textContent = toTitleCasePt(MATERIA_LABELS[materiaId] || materiaId);
      elements.publicCardMateriaSelect.appendChild(option);
    });
  }

  function populatePublicCardConteudoSelect(materiaId) {
    if (!elements.publicCardConteudoSelect) return;
    elements.publicCardConteudoSelect.innerHTML = "";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Nenhum";
    elements.publicCardConteudoSelect.appendChild(emptyOption);
    getContentsForMateria(materiaId).forEach((conteudo) => {
      const option = document.createElement("option");
      option.value = conteudo;
      option.textContent = toTitleCasePt(conteudo);
      elements.publicCardConteudoSelect.appendChild(option);
    });
  }

  function populatePublicCardTopicoSelect(materiaId, conteudo) {
    if (!elements.publicCardTopicoSelect) return;
    elements.publicCardTopicoSelect.innerHTML = "";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Nenhum";
    elements.publicCardTopicoSelect.appendChild(emptyOption);
    getTopicsForMateriaContent(materiaId, conteudo).forEach((topico) => {
      const option = document.createElement("option");
      option.value = topico;
      option.textContent = toTitleCasePt(topico);
      elements.publicCardTopicoSelect.appendChild(option);
    });
  }

  function refreshPublicCardTaxonomyFromConteudo() {
    const materiaId = elements.publicCardMateriaSelect?.value || "";
    const conteudo = elements.publicCardConteudoSelect?.value || "";
    populatePublicCardTopicoSelect(materiaId, conteudo);
  }

  function refreshPublicCardTaxonomyFromMateria() {
    const materiaId = elements.publicCardMateriaSelect?.value || "";
    populatePublicCardConteudoSelect(materiaId);
    refreshPublicCardTaxonomyFromConteudo();
  }

  function refreshPublicCardTaxonomyFromArea() {
    const areaId = elements.publicCardAreaSelect?.value || DISCOVER_AREAS[0].id;
    populatePublicCardMateriaSelect(areaId);
    refreshPublicCardTaxonomyFromMateria();
  }

  function resetPublicCardEditor(presetAreaId = null, presetMateriaId = null, presetConteudoId = null, presetTopicoId = null, editingCard = null) {
    editingPublicCardId = editingCard?.id || null;
    if (elements.publicCardTitleInput) elements.publicCardTitleInput.value = editingCard?.title || "";
    if (elements.publicCardDescriptionInput) elements.publicCardDescriptionInput.value = editingCard?.description || "";
    if (elements.publicFrontEditor) {
      elements.publicFrontEditor.innerHTML = editingCard ? sanitizeCardHtml(editingCard.front_html || "") : "";
    }
    if (elements.publicBackEditor) {
      elements.publicBackEditor.innerHTML = editingCard ? sanitizeCardHtml(editingCard.back_html || "") : "";
    }
    if (elements.publicCardEditorError) elements.publicCardEditorError.textContent = "";
    if (elements.publicCardEditorTitle) {
      elements.publicCardEditorTitle.textContent = editingCard ? "Editar card público" : "Novo card público";
    }
    if (elements.publicCardSaveBtn) {
      elements.publicCardSaveBtn.textContent = editingCard ? "Salvar alterações" : "Publicar card";
    }
    populatePublicCardAreaSelect();
    if (presetAreaId && elements.publicCardAreaSelect) {
      elements.publicCardAreaSelect.value = presetAreaId;
    }
    refreshPublicCardTaxonomyFromArea();
    if (presetMateriaId && elements.publicCardMateriaSelect) {
      elements.publicCardMateriaSelect.value = presetMateriaId;
      refreshPublicCardTaxonomyFromMateria();
    }
    if (presetConteudoId && elements.publicCardConteudoSelect) {
      elements.publicCardConteudoSelect.value = presetConteudoId;
      refreshPublicCardTaxonomyFromConteudo();
    }
    if (presetTopicoId && elements.publicCardTopicoSelect) {
      elements.publicCardTopicoSelect.value = presetTopicoId;
    }
  }

  function openPublicCardEditorModal(presetAreaId = null, presetMateriaId = null, presetConteudoId = null, presetTopicoId = null, editingCard = null) {
    resetPublicCardEditor(presetAreaId, presetMateriaId, presetConteudoId, presetTopicoId, editingCard);
    setModalVisibility(elements.publicCardEditorModal, true);
  }

  function closePublicCardEditorModal() {
    setModalVisibility(elements.publicCardEditorModal, false);
  }

  async function savePublicCard() {
    const title = normalizeName(elements.publicCardTitleInput?.value);
    if (!title) {
      if (elements.publicCardEditorError) {
        elements.publicCardEditorError.textContent = "Digite um título para o card.";
      }
      return;
    }
    const frontHtml = sanitizeCardHtml(elements.publicFrontEditor?.innerHTML || "").trim();
    const backHtml = sanitizeCardHtml(elements.publicBackEditor?.innerHTML || "").trim();
    if (!frontHtml && !backHtml) {
      if (elements.publicCardEditorError) {
        elements.publicCardEditorError.textContent = "Preencha Frente ou Verso para salvar o card.";
      }
      return;
    }
    const areaId = elements.publicCardAreaSelect?.value || "";
    const materiaId = elements.publicCardMateriaSelect?.value || "";
    const conteudoId = elements.publicCardConteudoSelect?.value || "";
    if (!areaId || !materiaId || !conteudoId) {
      if (elements.publicCardEditorError) {
        elements.publicCardEditorError.textContent = "Escolha a área, a matéria e o conteúdo do card.";
      }
      return;
    }
    const topicosDisponiveis = getTopicsForMateriaContent(materiaId, conteudoId);
    const topicoId = elements.publicCardTopicoSelect?.value || "";
    if (topicosDisponiveis.length > 0 && !topicoId) {
      if (elements.publicCardEditorError) {
        elements.publicCardEditorError.textContent = "Escolha o tópico do card.";
      }
      return;
    }

    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      if (elements.publicCardEditorError) {
        elements.publicCardEditorError.textContent = "Sessão indisponível. Tente novamente.";
      }
      return;
    }

    const saveButton = elements.publicCardSaveBtn;
    const previousDisabled = Boolean(saveButton?.disabled);
    if (saveButton) saveButton.disabled = true;

    const isEditingPublic = Boolean(editingPublicCardId);
    const payload = {
      title,
      description: normalizeName(elements.publicCardDescriptionInput?.value),
      front_html: frontHtml,
      back_html: backHtml,
      area: areaId,
      materia: materiaId,
      conteudo: conteudoId,
      topico: topicosDisponiveis.length > 0 ? topicoId : null,
    };

    const { error } = isEditingPublic
      ? await supabaseClient.from("public_flashcards").update(payload).eq("id", editingPublicCardId)
      : await supabaseClient.from("public_flashcards").insert({
          ...payload,
          author_id: currentUserId,
          author_name: window.profileCache?.load()?.name || "Equipe Integral ENEM",
          author_avatar_path: window.profileCache?.load()?.avatarPath || null,
        });

    if (saveButton) saveButton.disabled = previousDisabled;

    if (error) {
      if (elements.publicCardEditorError) {
        elements.publicCardEditorError.textContent = isEditingPublic
          ? "Não foi possível salvar as alterações. Verifique sua permissão de admin e tente novamente."
          : "Não foi possível publicar o card. Verifique sua permissão de admin e tente novamente.";
      }
      return;
    }

    closePublicCardEditorModal();
    showSaveFeedbackToast(isEditingPublic ? "Card público atualizado com sucesso!" : "Card público publicado com sucesso!");
    if (discoverMateriaId === materiaId) {
      refreshDiscoverAfterCardMutation();
    }
  }

  function refreshDiscoverAfterCardMutation() {
    if (discoverMateriaId) {
      renderDiscoverContents(discoverMateriaId);
    }
    if (!discoverConteudoId) return;
    // Atualiza a tela de cards se for a que está realmente visível agora (é o
    // caso mais comum, já que editar/excluir só é possível a partir dela).
    // Só recai para a tela de tópicos se ela é que está aberta no momento.
    if (elements.discoverCardsView && !elements.discoverCardsView.hidden) {
      renderDiscoverCards();
      return;
    }
    const topicos = getTopicsForMateriaContent(discoverMateriaId, discoverConteudoId);
    if (topicos.length > 0) renderDiscoverTopics(discoverConteudoId, topicos);
  }

  async function handleDeletePublicCard(card) {
    const confirmed = await openActionModal({
      title: "Excluir card público",
      subtitle: `Tem certeza que deseja excluir o card "${card.title || "Sem título"}"? Essa ação não pode ser desfeita e o card deixará de ficar disponível para todos os alunos.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!confirmed) return;

    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) return;

    const { error } = await supabaseClient.from("public_flashcards").delete().eq("id", card.id);
    if (error) {
      openActionModal({
        title: "Erro",
        subtitle: "Não foi possível excluir o card. Verifique sua permissão de admin e tente novamente.",
        confirmLabel: "Ok",
      });
      return;
    }

    showSaveFeedbackToast("Card público excluído.");
    refreshDiscoverAfterCardMutation();
  }

  function initColorPresets() {
    const presets = elements.deckColorPresets?.querySelectorAll(".color-preset") || [];
    presets.forEach((btn) => {
      const color = normalizeHexColor(btn.dataset.color || "#1E63FF");
      btn.style.background = color;
      btn.style.borderColor = mixWith(color, 0.34, "white");
    });
    setSelectedDeckColor(selectedDeckColor);
  }

  function setupModalEvents() {
    elements.deckModalConfirm?.addEventListener("click", handleCreateDeckConfirm);
    elements.deckModalCancel?.addEventListener("click", closeDeckModal);
    elements.deckModalInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleCreateDeckConfirm();
      }
    });

    elements.deckModal?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("[data-modal-close]")) closeDeckModal();
    });

    elements.topicModalConfirm?.addEventListener("click", handleCreateTopicConfirm);
    elements.topicModalCancel?.addEventListener("click", closeTopicModal);
    elements.topicNameInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleCreateTopicConfirm();
      }
    });

    elements.topicModal?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("[data-topic-close]")) closeTopicModal();
    });

    elements.deckColorPresets?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const preset = target.closest(".color-preset");
      if (!preset) return;
      setSelectedDeckColor(preset.dataset.color || "#1E63FF");
    });

    elements.deckCustomColorInput?.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      setSelectedDeckColor(target.value || "#1E63FF");
    });

    elements.orderModal?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("[data-order-close]")) closeOrderModal();
    });

    elements.orderCancelBtn?.addEventListener("click", closeOrderModal);
    elements.orderSaveBtn?.addEventListener("click", () => {
      const orderedIds = orderDraftDecks.map((deck) => deck.id).filter(Boolean);
      if (orderedIds.length >= 2) cache.saveDeckOrderByUser(currentUserId, orderedIds);
      closeOrderModal();
      renderHome();
    });

    elements.actionModal?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("[data-action-close]")) closeActionModal(null);
    });
    elements.actionModalCancel?.addEventListener("click", () => closeActionModal(null));
    elements.actionModalConfirm?.addEventListener("click", handleActionModalConfirm);
    elements.actionModalInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleActionModalConfirm();
      }
    });

    elements.importPublicModal?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("[data-import-public-close]")) closeImportPublicModal();
    });
    elements.publicCardEditorModal?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("[data-public-card-close]")) closePublicCardEditorModal();
    });

    elements.discoverPreviewModal?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("[data-discover-preview-close]")) closeDiscoverCardPreview();
    });
    elements.discoverPreviewAuthorAvatar?.addEventListener("error", () => {
      if (elements.discoverPreviewAuthorAvatar) elements.discoverPreviewAuthorAvatar.src = DEFAULT_ADMIN_AVATAR_URL;
    });
    elements.discoverPreviewPrevBtn?.addEventListener("click", goToPreviousDiscoverPreviewCard);
    elements.discoverPreviewNextBtn?.addEventListener("click", goToNextDiscoverPreviewCard);
    elements.discoverPreviewImportBtn?.addEventListener("click", () => {
      const card = discoverCardsAll[discoverPreviewIndex];
      if (!card) return;
      closeDiscoverCardPreview();
      openImportPublicModal(card);
    });

    elements.discoverCardsPrevPageBtn?.addEventListener("click", () => {
      discoverCardsPage -= 1;
      renderDiscoverCardsPage();
    });
    elements.discoverCardsNextPageBtn?.addEventListener("click", () => {
      discoverCardsPage += 1;
      renderDiscoverCardsPage();
    });

    elements.studyModal?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("[data-study-close]")) closeStudyModal();
    });
    elements.studyCloseBtn?.addEventListener("click", closeStudyModal);
    elements.studyPrevBtn?.addEventListener("click", goToPreviousStudyCard);
    elements.studyRevealBtn?.addEventListener("click", revealStudyAnswer);
    elements.studyHideBtn?.addEventListener("click", hideStudyAnswer);
    elements.studyNextBtn?.addEventListener("click", goToNextStudyCard);
    elements.studyMasteredBtn?.addEventListener("click", markCurrentStudyCardAsMastered);
    elements.studyRatingButtons?.forEach((btn) => {
      btn.addEventListener("click", () => {
        const minutes = Number.parseInt(btn.dataset.minutes || "0", 10);
        applyStudyReviewPreset(minutes);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (elements.discoverPreviewModal?.classList.contains("open")) {
        if (event.key === "ArrowLeft") goToPreviousDiscoverPreviewCard();
        if (event.key === "ArrowRight") goToNextDiscoverPreviewCard();
      }
      if (event.key !== "Escape") return;
      if (elements.deckModal?.classList.contains("open")) closeDeckModal();
      if (elements.topicModal?.classList.contains("open")) closeTopicModal();
      if (elements.orderModal?.classList.contains("open")) closeOrderModal();
      if (elements.actionModal?.classList.contains("open")) closeActionModal(null);
      if (elements.importPublicModal?.classList.contains("open")) closeImportPublicModal();
      if (elements.publicCardEditorModal?.classList.contains("open")) closePublicCardEditorModal();
      if (elements.discoverPreviewModal?.classList.contains("open")) closeDiscoverCardPreview();
      if (elements.studyModal?.classList.contains("open")) closeStudyModal();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) flushPendingStudySync({ bestEffortRemote: true });
    });
    window.addEventListener("pagehide", () => {
      flushPendingStudySync({ bestEffortRemote: true });
    });
    window.addEventListener("beforeunload", () => {
      flushPendingStudySync({ bestEffortRemote: true });
    });
  }

  function setupActions() {
    elements.createActionBtn?.addEventListener("click", () => openDeckModal("Novo deck"));
    elements.quickCreateBtn?.addEventListener("click", () => openDeckModal("Deck de revisão"));

    elements.openOrderMenuBtn?.addEventListener("click", openOrderModal);
    elements.homeDueBadge?.addEventListener("click", openStudyFromHomeDueBadge);

    elements.importPdfBtn?.addEventListener("click", () => {
      window.alert("Importação de PDF em fase de testes.");
    });

    elements.importAnkiBtn?.addEventListener("click", () => {
      window.alert("Importação de Anki em fase de testes.");
    });

    elements.deckBackBtn?.addEventListener("click", () => {
      closeStudyModal();
      closeCardEditor();
      showDeckHome();
      renderHome();
    });

    elements.decksViewTabMine?.addEventListener("click", () => setDecksView("mine"));
    elements.decksViewTabDiscover?.addEventListener("click", () => setDecksView("discover"));
    elements.discoverShortcutBtn?.addEventListener("click", () => setDecksView("discover"));
    elements.discoverSubjectsBackBtn?.addEventListener("click", () => showDiscoverView("areas"));
    elements.discoverContentsBackBtn?.addEventListener("click", () => {
      const area = getDiscoverArea(discoverAreaId);
      showDiscoverView(area && area.subjects.length === 1 ? "areas" : "subjects");
    });
    elements.discoverTopicsBackBtn?.addEventListener("click", () => showDiscoverView("contents"));
    elements.discoverCardsBackBtn?.addEventListener("click", () => {
      const topicos = getTopicsForMateriaContent(discoverMateriaId, discoverConteudoId);
      showDiscoverView(topicos.length > 0 ? "topics" : "contents");
    });
    elements.discoverAddCardBtn?.addEventListener("click", () =>
      openPublicCardEditorModal(discoverAreaId, discoverMateriaId, discoverConteudoId, discoverTopicoId),
    );

    elements.importPublicDeckSelect?.addEventListener("change", refreshImportPublicTopicAndSubtopic);
    elements.importPublicTopicSelect?.addEventListener("change", () => {
      const decks = cache.loadDecksByUser(currentUserId);
      const deck = decks.find((item) => item.id === elements.importPublicDeckSelect?.value) || null;
      const topic = deck?.topics.find((item) => item.id === elements.importPublicTopicSelect?.value) || null;
      populateImportPublicSubtopicSelect(topic);
    });
    elements.importPublicCreateDeckBtn?.addEventListener("click", () => {
      closeImportPublicModal();
      openDeckModal("Novo deck");
    });
    elements.importPublicConfirmBtn?.addEventListener("click", confirmImportPublicCard);

    elements.publicCardAreaSelect?.addEventListener("change", refreshPublicCardTaxonomyFromArea);
    elements.publicCardMateriaSelect?.addEventListener("change", refreshPublicCardTaxonomyFromMateria);
    elements.publicCardConteudoSelect?.addEventListener("change", refreshPublicCardTaxonomyFromConteudo);
    elements.publicCardSaveBtn?.addEventListener("click", savePublicCard);

    elements.deckAddTopicBtn?.addEventListener("click", () => openTopicModal("Novo tópico"));
    elements.topicsEmptyAddBtn?.addEventListener("click", () => openTopicModal("Novo tópico"));

    elements.topicBackBtn?.addEventListener("click", backToTopics);
    elements.topicAddSubtopicBtn?.addEventListener("click", createSubtopicFromTopicView);
    elements.deckAddCardBtn?.addEventListener("click", openCardEditor);
    elements.deckEmptyAddBtn?.addEventListener("click", openCardEditor);
    elements.topicHighlightAction?.addEventListener("click", openStudyFromHighlight);
    elements.cardEditorCancelBtn?.addEventListener("click", closeCardEditor);
    elements.cardEditorSaveBtn?.addEventListener("click", saveCard);
    elements.subtopicFilterTrigger?.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!elements.subtopicFilterMenu) return;
      if (elements.subtopicFilterMenu.classList.contains("open")) closeSubtopicFilterMenu();
      else openSubtopicFilterMenu();
    });
    elements.subtopicFilterMenu?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    elements.toolbarButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const editorId = btn.dataset.editor;
        const cmd = btn.dataset.cmd;
        if (!editorId || !cmd) return;
        runEditorCommand(editorId, cmd);
      });
    });

    [elements.frontEditor, elements.backEditor, elements.publicFrontEditor, elements.publicBackEditor].forEach((editor) => {
      if (!editor) return;
      ["focus", "keyup", "mouseup", "input"].forEach((eventName) => {
        editor.addEventListener(eventName, () => refreshToolbarState(editor.id));
      });
    });

    document.addEventListener("selectionchange", () => {
      if (!elements.cardEditor.hidden) {
        refreshToolbarState("front-editor");
        refreshToolbarState("back-editor");
      }
      if (elements.publicCardEditorModal?.classList.contains("open")) {
        refreshToolbarState("public-front-editor");
        refreshToolbarState("public-back-editor");
      }
    });

    document.addEventListener("click", () => {
      closeContextMenu();
      closeSubtopicFilterMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeContextMenu();
        closeSubtopicFilterMenu();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        scheduleFlashcardsIntegrityCheck("document_visible", { force: true, refreshUI: true });
      }
    });

    window.addEventListener("focus", () => {
      scheduleFlashcardsIntegrityCheck("window_focus", { force: true, refreshUI: true });
    });

    window.addEventListener("flashcards-cache-write-error", (event) => {
      const now = Date.now();
      if (now < cacheWriteErrorAlertUntil) return;
      cacheWriteErrorAlertUntil = now + 10000;
      const kind = event?.detail?.kind === "study" ? "progresso de estudo" : "flashcards";
      window.alert(
        `Falha ao salvar dados locais de ${kind} no navegador (armazenamento local). Libere espaço e tente novamente para evitar perda de cache.`,
      );
    });

    window.addEventListener("mm-sync-badge-visibilitychange", () => {
      updateTopicLoadingBadge();
    });

    window.addEventListener("flashcards-sync-status", (event) => {
      const detail = event?.detail || {};
      const eventUserId = String(detail.userId || "");
      if (!eventUserId || eventUserId !== String(currentUserId || "")) return;
      renderTopicCloudSyncProgress(getCurrentTopic());
      if (detail.state === "synced") {
        const successMessage = summarizePendingCreateSyncSuccess();
        if (successMessage) {
          showFooterSyncToast({
            message: successMessage,
            state: "success",
            durationMs: 2400,
          });
        }
        return;
      }
      if (detail.state === "retrying") {
        const queue = getCreateSyncQueueForCurrentUser();
        if (!queue.length) return;
        const now = Date.now();
        if (now - lastRetrySyncToastAt < 8000) return;
        lastRetrySyncToastAt = now;
        const first = queue[0];
        showFooterSyncToast({
          message: `Ainda não foi possível sincronizar ${first.entityType} "${first.entityName || first.entityId || "novo item"}" (${formatSyncErrorReason(detail.reason)}). Tentaremos novamente.`,
          state: "warn",
          durationMs: 3800,
        });
      }
    });
  }

  async function resolveCurrentUserId() {
    try {
      const supabaseClient = window.supabaseClient;
      if (!supabaseClient) return;
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (user?.id) currentUserId = user.id;
    } catch (_) {
      currentUserId = "anonymous";
    }
  }

  async function init() {
    await resolveCurrentUserId();
    isAdminUser = await isCurrentUserAdmin();
    initColorPresets();
    setupModalEvents();
    setupActions();
    setupDragAndDrop();
    startReviewTicker();
    renderHome();
    showDeckHome();
    const hasLocalDecks = cache.loadDecksByUser(currentUserId).length > 0;
    const canUseRemoteNow =
      cache && typeof cache.canUseRemote === "function" && cache.canUseRemote(currentUserId);
    if (hasLocalDecks && canUseRemoteNow) {
      showFooterSyncToast({
        message: "Flashcards carregados do dispositivo. Sincronizando com a nuvem...",
        state: "info",
        durationMs: 1800,
      });
    }
    scheduleFlashcardsIntegrityCheck("init", { force: true, refreshUI: true, showSyncedToast: true });
  }

  init();
})();
