const REVISION_UNLOCK_DATE = new Date("2026-08-01T00:00:00");
const TAP_TOOLTIP_DURATION = 2200;

function initRevisionLocks() {
  const lockedChecks = document.querySelectorAll(".jornada-topic__check--locked");

  if (Date.now() >= REVISION_UNLOCK_DATE.getTime()) {
    lockedChecks.forEach((label) => {
      const input = label.querySelector('input[type="checkbox"]');
      label.classList.remove("jornada-topic__check--locked");
      label.removeAttribute("data-locked-message");
      if (input) {
        input.disabled = false;
      }
    });
    return;
  }

  lockedChecks.forEach((label) => {
    label.addEventListener("click", (event) => {
      event.preventDefault();
      label.classList.add("is-tapped");
      window.clearTimeout(label.tapTimeoutId);
      label.tapTimeoutId = window.setTimeout(() => {
        label.classList.remove("is-tapped");
      }, TAP_TOOLTIP_DURATION);
    });
  });
}

const QUICKNAV_SCROLL_OFFSET = 84;
const QUICKNAV_SCROLL_DURATION = 700;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothScrollTo(targetY) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / QUICKNAV_SCROLL_DURATION, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function initQuickNav() {
  const quads = document.querySelectorAll(".jornada-quicknav__quad");

  quads.forEach((quad) => {
    quad.addEventListener("click", (event) => {
      event.preventDefault();

      const target = document.querySelector(quad.getAttribute("href"));
      if (!target) return;

      quad.classList.remove("is-pressed");
      void quad.offsetWidth;
      quad.classList.add("is-pressed");

      const targetY = target.getBoundingClientRect().top + window.scrollY - QUICKNAV_SCROLL_OFFSET;
      smoothScrollTo(targetY);

      const header = target.querySelector(".jornada-frente__header") || target;
      header.classList.remove("is-highlighted");
      void header.offsetWidth;
      header.classList.add("is-highlighted");
    });

    quad.addEventListener("animationend", () => {
      quad.classList.remove("is-pressed");
    });
  });
}

function getTheoryCheckboxes() {
  return document.querySelectorAll(
    '.jornada-topic__tracking .jornada-topic__check:first-child input[type="checkbox"]'
  );
}

function updateProgressBadge() {
  const badge = document.getElementById("jornada-progress-badge");
  if (!badge) return;

  const checkboxes = getTheoryCheckboxes();
  const total = checkboxes.length;
  const done = Array.from(checkboxes).filter((input) => input.checked).length;
  const pct = total ? (done / total) * 100 : 0;

  const fg = badge.querySelector(".jornada-progress-badge__fg");
  const value = badge.querySelector(".jornada-progress-badge__value");
  if (fg) fg.setAttribute("stroke-dasharray", `${pct}, 100`);
  if (value) value.textContent = `${pct.toFixed(2)}%`;

  badge.classList.remove("is-low", "is-mid", "is-high");
  badge.classList.add(pct >= 70 ? "is-high" : pct >= 34 ? "is-mid" : "is-low");
}

function initProgressBadge() {
  updateProgressBadge();
}

const masterySelectedByGroup = new Map();

function initMasteryToggle() {
  const masteryRadios = document.querySelectorAll('.jornada-topic__mastery input[type="radio"]');

  masteryRadios.forEach((radio) => {
    radio.addEventListener("click", () => {
      if (masterySelectedByGroup.get(radio.name) === radio) {
        radio.checked = false;
        masterySelectedByGroup.delete(radio.name);
      } else {
        masterySelectedByGroup.set(radio.name, radio);
      }
      handleMasteryChange(radio);
    });
  });
}

/* ─── Persistência (Supabase + cache local) ──────────────────── */

const JORNADA_TABLE = "jornada_progress";
const JORNADA_CACHE_KEY = "mm_jornada_progress_cache_v1";
const JORNADA_SYNC_DEBOUNCE = 600;

let progressByTopic = {};
let userIdCache;
const pendingSyncTimers = new Map();

let calendarHitRates = {};
let calendarHitRatesLoaded = false;

function normStr(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadCalendarHitRates() {
  if (calendarHitRatesLoaded) return;
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;

  const { data, error } = await window.supabaseClient
    .from("cronograma_entries")
    .select("topic, subtopic, questions, hits")
    .eq("user_id", userId)
    .gt("questions", 0);

  if (error || !data) return;

  const map = {};
  const addToMap = (key, q, h) => {
    const norm = normStr(key);
    if (!norm || norm.length < 4) return;
    if (!map[norm]) map[norm] = { questions: 0, hits: 0 };
    map[norm].questions += Number(q) || 0;
    map[norm].hits += Number(h) || 0;
  };

  data.forEach((row) => {
    if (row.topic) addToMap(row.topic, row.questions, row.hits);
    if (row.subtopic) addToMap(row.subtopic, row.questions, row.hits);
  });

  calendarHitRates = map;
  calendarHitRatesLoaded = true;
}

function getCalendarHitRate(item) {
  const frente = normStr(item.frenteName);
  const title = normStr(item.title);
  let totalQ = 0;
  let totalH = 0;

  for (const [key, stats] of Object.entries(calendarHitRates)) {
    if (key.length < 4) continue;
    if (frente.includes(key) || title.includes(key)) {
      totalQ += stats.questions;
      totalH += stats.hits;
    }
  }

  return totalQ > 0 ? totalH / totalQ : null;
}

async function getUserId() {
  if (userIdCache !== undefined) return userIdCache;
  if (!window.supabaseClient) return null;
  const { data } = await window.supabaseClient.auth.getUser();
  userIdCache = data?.user?.id || null;
  return userIdCache;
}

function readProgressCache() {
  try {
    const raw = localStorage.getItem(JORNADA_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.topics === "object" && parsed.topics ? parsed.topics : {};
  } catch {
    return {};
  }
}

function writeProgressCache() {
  try {
    localStorage.setItem(
      JORNADA_CACHE_KEY,
      JSON.stringify({ topics: progressByTopic, updatedAt: Date.now() })
    );
  } catch {
    /* localStorage indisponível (modo privado, quota cheia, etc.) */
  }
}

function getTopicId(el) {
  const article = el.closest(".jornada-topic");
  return article ? article.dataset.topic : null;
}

function getOrCreateEntry(topicId) {
  if (!progressByTopic[topicId]) {
    progressByTopic[topicId] = { theory: false, questions: false, revision: false, mastery: null };
  }
  return progressByTopic[topicId];
}

function applyProgressToDOM() {
  document.querySelectorAll(".jornada-topic").forEach((article) => {
    const entry = progressByTopic[article.dataset.topic] || {};

    const checks = article.querySelectorAll(
      '.jornada-topic__tracking .jornada-topic__check input[type="checkbox"]'
    );
    if (checks[0]) checks[0].checked = !!entry.theory;
    if (checks[1]) checks[1].checked = !!entry.questions;
    if (checks[2]) checks[2].checked = !!entry.revision;

    article.querySelectorAll('.jornada-topic__mastery input[type="radio"]').forEach((radio) => {
      const checked = entry.mastery === radio.value;
      radio.checked = checked;
      if (checked) {
        masterySelectedByGroup.set(radio.name, radio);
      } else if (masterySelectedByGroup.get(radio.name) === radio) {
        masterySelectedByGroup.delete(radio.name);
      }
    });
  });
}

function scheduleSync(topicId) {
  if (pendingSyncTimers.has(topicId)) {
    clearTimeout(pendingSyncTimers.get(topicId));
  }
  pendingSyncTimers.set(
    topicId,
    setTimeout(() => {
      pendingSyncTimers.delete(topicId);
      syncTopicToSupabase(topicId);
    }, JORNADA_SYNC_DEBOUNCE)
  );
}

async function syncTopicToSupabase(topicId) {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;

  const entry = getOrCreateEntry(topicId);
  await window.supabaseClient.from(JORNADA_TABLE).upsert(
    {
      user_id: userId,
      topic_id: topicId,
      theory_done: !!entry.theory,
      questions_done: !!entry.questions,
      revision_done: !!entry.revision,
      mastery: entry.mastery || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" }
  );
}

function persistProgress(topicId) {
  writeProgressCache();
  scheduleSync(topicId);
}

function handleMasteryChange(radio) {
  const topicId = getTopicId(radio);
  if (!topicId) return;

  const entry = getOrCreateEntry(topicId);
  entry.mastery = radio.checked ? radio.value : null;
  persistProgress(topicId);
}

function handleTrackingChange(input) {
  const topicId = getTopicId(input);
  if (!topicId) return;

  const checks = Array.from(
    input.closest(".jornada-topic__tracking").querySelectorAll('input[type="checkbox"]')
  );
  const index = checks.indexOf(input);
  const entry = getOrCreateEntry(topicId);
  if (index === 0) entry.theory = input.checked;
  else if (index === 1) entry.questions = input.checked;
  else if (index === 2) entry.revision = input.checked;

  persistProgress(topicId);

  if (index === 0) updateProgressBadge();
}

function initTrackingPersistence() {
  document
    .querySelectorAll('.jornada-topic__tracking .jornada-topic__check input[type="checkbox"]')
    .forEach((input) => {
      input.addEventListener("change", () => handleTrackingChange(input));
    });
}

async function fetchRemoteProgress(userId) {
  const { data, error } = await window.supabaseClient
    .from(JORNADA_TABLE)
    .select("topic_id, theory_done, questions_done, revision_done, mastery")
    .eq("user_id", userId);

  if (error || !data) return null;

  const map = {};
  data.forEach((row) => {
    map[row.topic_id] = {
      theory: !!row.theory_done,
      questions: !!row.questions_done,
      revision: !!row.revision_done,
      mastery: row.mastery || null,
    };
  });
  return map;
}

async function syncProgressFromRemote() {
  const badge = document.getElementById("jornada-progress-badge");

  try {
    const userId = await getUserId();
    if (!userId || !window.supabaseClient) return;

    const remote = await fetchRemoteProgress(userId);
    if (!remote) return;

    progressByTopic = remote;
    applyProgressToDOM();
    updateProgressBadge();
    writeProgressCache();
  } finally {
    if (badge) badge.classList.remove("is-loading");
  }
}

function initJornadaProgress() {
  progressByTopic = readProgressCache();
  applyProgressToDOM();
  initTrackingPersistence();
  syncProgressFromRemote();
}

/* ─── Modal de prioridades ──────────────────── */

const PRIORITY_WEIGHT = { high: 4, medium: 3, low: 2, vlow: 1 };
const MASTERY_NEED_WEIGHT = { high: 1, mid: 2, low: 3 };
const MASTERY_LABEL = { low: "Domínio baixo", mid: "Domínio médio", high: "Domínio alto" };
const PRIORITY_AREAS = [
  { id: "matematica", name: "Matemática" },
  { id: "natureza", name: "Natureza" },
  { id: "humanas", name: "Humanas" },
  { id: "linguagens", name: "Linguagens" },
];
const PRIORITY_ITEMS_PER_AREA = 5;

function getTopicArea(article) {
  const frente = article.closest(".jornada-frente");
  if (frente?.classList.contains("jornada-frente--natureza")) return "natureza";
  if (frente?.classList.contains("jornada-frente--humanas")) return "humanas";
  if (frente?.classList.contains("jornada-frente--linguagens")) return "linguagens";
  return "matematica";
}

function getTopicPriority(article) {
  const tag = article.querySelector(".jornada-priority");
  const key =
    ["high", "medium", "low", "vlow"].find((k) => tag?.classList.contains(`jornada-priority--${k}`)) || "medium";
  return { key, label: tag ? tag.textContent.trim() : "Média" };
}

function buildPriorityLists() {
  const byArea = { matematica: [], natureza: [], humanas: [], linguagens: [] };

  document.querySelectorAll(".jornada-topic").forEach((article) => {
    const entry = progressByTopic[article.dataset.topic] || {};
    if (entry.theory && entry.questions && entry.mastery === "high") return;

    const priority = getTopicPriority(article);
    const needWeight = MASTERY_NEED_WEIGHT[entry.mastery] || MASTERY_NEED_WEIGHT.low;
    const score = (PRIORITY_WEIGHT[priority.key] || 0) * needWeight;
    const frenteName =
      article.closest(".jornada-frente")?.querySelector(".jornada-frente__name")?.textContent.trim() || "";

    byArea[getTopicArea(article)].push({
      title: article.querySelector(".jornada-topic__title")?.textContent.trim() || "",
      frenteName,
      priority,
      mastery: entry.mastery || null,
      score,
    });
  });

  Object.values(byArea).forEach((list) => list.sort((a, b) => b.score - a.score));
  return byArea;
}

function buildPriorityListItem(item, rankIndex) {
  const li = document.createElement("li");
  li.className = "jornada-priority-item";

  const rank = document.createElement("span");
  rank.className = "jornada-priority-item__rank";
  rank.textContent = String(rankIndex + 1);

  const text = document.createElement("div");
  text.className = "jornada-priority-item__text";

  const titleRow = document.createElement("span");
  titleRow.className = "jornada-priority-item__title";
  titleRow.textContent = item.title;

  const hitRate = getCalendarHitRate(item);
  if (hitRate !== null && hitRate < 0.8) {
    const pct = Math.round(hitRate * 100);
    const alertBadge = document.createElement("span");
    alertBadge.className = "jornada-priority-item__alert";
    alertBadge.textContent = "!";
    alertBadge.setAttribute("title", `Taxa de acerto no Calendário: ${pct}%`);
    alertBadge.setAttribute("aria-label", `Atenção: apenas ${pct}% de acerto no Calendário`);
    titleRow.appendChild(alertBadge);

    const calNote = document.createElement("span");
    calNote.className = "jornada-priority-item__cal-rate";
    calNote.textContent = `${pct}% de acerto no Calendário`;
    text.append(titleRow, calNote);
  } else {
    text.appendChild(titleRow);
  }

  const frente = document.createElement("span");
  frente.className = "jornada-priority-item__frente";
  frente.textContent = item.frenteName;
  text.appendChild(frente);

  const tags = document.createElement("div");
  tags.className = "jornada-priority-item__tags";

  const priorityTag = document.createElement("span");
  priorityTag.className = `jornada-tag jornada-tag--priority-${item.priority.key}`;
  priorityTag.textContent = item.priority.label;

  const masteryTag = document.createElement("span");
  if (item.mastery) {
    masteryTag.className = `jornada-tag jornada-tag--mastery-${item.mastery}`;
    masteryTag.textContent = MASTERY_LABEL[item.mastery];
  } else {
    masteryTag.className = "jornada-tag jornada-tag--mastery-unset";
    masteryTag.textContent = "Não avaliado";
  }

  tags.append(priorityTag, masteryTag);
  li.append(rank, text, tags);
  return li;
}

function renderPriorityModal() {
  const grid = document.getElementById("jornada-priority-grid");
  if (!grid) return;

  const byArea = buildPriorityLists();
  grid.innerHTML = "";

  PRIORITY_AREAS.forEach((area) => {
    const allItems = byArea[area.id];
    const visibleItems = allItems.slice(0, PRIORITY_ITEMS_PER_AREA);
    const extraItems = allItems.slice(PRIORITY_ITEMS_PER_AREA);

    const section = document.createElement("section");
    section.className = `jornada-priority-area jornada-priority-area--${area.id}`;

    const header = document.createElement("header");
    header.className = "jornada-priority-area__header";
    const dot = document.createElement("span");
    dot.className = "jornada-priority-area__dot";
    const heading = document.createElement("h3");
    heading.textContent = area.name;
    header.append(dot, heading);
    section.appendChild(header);

    if (!visibleItems.length) {
      const empty = document.createElement("p");
      empty.className = "jornada-priority-area__empty";
      empty.textContent = "Você está em dia nesta área.";
      section.appendChild(empty);
    } else {
      const list = document.createElement("ol");
      list.className = "jornada-priority-area__list";
      visibleItems.forEach((item, index) => list.appendChild(buildPriorityListItem(item, index)));
      section.appendChild(list);

      if (extraItems.length) {
        const moreWrap = document.createElement("div");
        moreWrap.className = "jornada-priority-more";

        const moreBtn = document.createElement("button");
        moreBtn.type = "button";
        moreBtn.className = "jornada-priority-more__btn";
        moreBtn.setAttribute("aria-expanded", "false");
        moreBtn.setAttribute("aria-controls", `priority-more-${area.id}`);

        const btnText = document.createElement("span");
        btnText.textContent = `Ver mais ${extraItems.length} ${extraItems.length === 1 ? "assunto" : "assuntos"}`;

        const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        chevron.setAttribute("class", "jornada-priority-more__chevron");
        chevron.setAttribute("viewBox", "0 0 16 16");
        chevron.setAttribute("fill", "none");
        chevron.setAttribute("aria-hidden", "true");
        const chevronPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        chevronPath.setAttribute("d", "M3 5.5L8 10.5L13 5.5");
        chevronPath.setAttribute("stroke", "currentColor");
        chevronPath.setAttribute("stroke-width", "1.8");
        chevronPath.setAttribute("stroke-linecap", "round");
        chevronPath.setAttribute("stroke-linejoin", "round");
        chevron.appendChild(chevronPath);

        moreBtn.append(btnText, chevron);

        const panel = document.createElement("div");
        panel.className = "jornada-priority-more__panel";
        panel.id = `priority-more-${area.id}`;
        panel.setAttribute("aria-hidden", "true");

        const extraList = document.createElement("ol");
        extraList.className = "jornada-priority-area__list jornada-priority-more__list";
        extraItems.forEach((item, idx) =>
          extraList.appendChild(buildPriorityListItem(item, PRIORITY_ITEMS_PER_AREA + idx))
        );
        panel.appendChild(extraList);

        moreBtn.addEventListener("click", () => {
          const isOpen = moreWrap.classList.toggle("is-open");
          moreBtn.setAttribute("aria-expanded", String(isOpen));
          panel.setAttribute("aria-hidden", String(!isOpen));
          btnText.textContent = isOpen
            ? "Mostrar menos"
            : `Ver mais ${extraItems.length} ${extraItems.length === 1 ? "assunto" : "assuntos"}`;
        });

        moreWrap.append(moreBtn, panel);
        section.appendChild(moreWrap);
      }
    }

    grid.appendChild(section);
  });
}

const PRIORITY_MODAL_CLOSE_MS = 180;
let priorityModalCloseTimer = null;

function openPriorityModal() {
  const overlay = document.getElementById("jornada-priority-overlay");
  const modal = document.getElementById("jornada-priority-modal");
  if (!overlay) return;

  clearTimeout(priorityModalCloseTimer);
  overlay.classList.remove("is-closing");
  renderPriorityModal();
  overlay.classList.add("is-open");
  document.body.classList.add("jornada-modal-open");
  modal?.focus();

  loadCalendarHitRates().then(() => {
    if (overlay.classList.contains("is-open")) renderPriorityModal();
  });
}

function closePriorityModal() {
  const overlay = document.getElementById("jornada-priority-overlay");
  if (!overlay || !overlay.classList.contains("is-open")) return;

  overlay.classList.add("is-closing");
  document.body.classList.remove("jornada-modal-open");
  document.getElementById("jornada-progress-badge")?.focus();

  clearTimeout(priorityModalCloseTimer);
  priorityModalCloseTimer = setTimeout(() => {
    overlay.classList.remove("is-open", "is-closing");
  }, PRIORITY_MODAL_CLOSE_MS);
}

function initPriorityModal() {
  const badge = document.getElementById("jornada-progress-badge");
  const overlay = document.getElementById("jornada-priority-overlay");
  const closeBtn = document.getElementById("jornada-priority-close");
  if (!badge || !overlay) return;

  badge.addEventListener("click", openPriorityModal);
  closeBtn?.addEventListener("click", closePriorityModal);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closePriorityModal();
  });
  document.addEventListener("keydown", (event) => {
    if (!overlay.classList.contains("is-open")) return;
    if (event.key === "Escape") closePriorityModal();
  });
}

initJornadaProgress();
initRevisionLocks();
initMasteryToggle();
initQuickNav();
initProgressBadge();
initPriorityModal();
