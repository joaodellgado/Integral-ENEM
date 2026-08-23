const prevMonthBtn = document.querySelector("#prevMonth");
const nextMonthBtn = document.querySelector("#nextMonth");
const monthRangeEl = document.querySelector("#monthRange");
const monthSummaryEl = document.querySelector("#monthSummary");
const monthGrid = document.querySelector("#monthGrid");
const saveStateEl = document.querySelector("#saveState");
const exportButton = document.querySelector("#exportWeek");
const clearButton = document.querySelector("#clearWeek");
const dayCards = Array.from(document.querySelectorAll(".day-column"));
const dayDetailColumn = dayCards[0] || null;
const dayDetailAddBtn = document.querySelector(".add-slot-btn");
const currentMonthBtn = document.querySelector("#currentMonthBtn");
const exportMonthImageBtn = document.querySelector("#exportMonthImageBtn");
const dayMenu = document.querySelector("#dayMenu");
const dayMenuTitle = document.querySelector("#dayMenuTitle");
const dayMenuWeekday = document.querySelector("#dayMenuWeekday");
const dayMenuTabs = Array.from(document.querySelectorAll(".day-menu__tab"));
const dayPlanPanel = document.querySelector('[data-day-panel="plan"]');
const dayStudyPanel = document.querySelector('[data-day-panel="study"]');
const dayTaskList = document.querySelector("#dayTaskList");
const dayTaskAddBtn = document.querySelector("#dayTaskAddBtn");
const dayMenuPlannedWrap = document.querySelector(".day-menu__planned-wrap");
const dayMenuPlanned = document.querySelector(".day-menu__planned");
const subjectMenu = document.querySelector("#subjectMenu");
const subjectMenuSubjects = document.querySelector("#subjectMenuSubjects");
const subjectMenuContents = document.querySelector("#subjectMenuContents");
const subjectMenuSubtitle = document.querySelector("#subjectMenuSubtitle");
const subjectMenuBack = document.querySelector("#subjectMenuBack");
const subjectMenuBackDetails = document.querySelector("#subjectMenuBackDetails");
const subjectMenuHours = document.querySelector("#subjectMenuHours");
const subjectMenuQuestions = document.querySelector("#subjectMenuQuestions");
const subjectMenuEssay = document.querySelector("#subjectMenuEssay");
const subjectMenuEssayField = document.querySelector("#subjectMenuEssayField");
const subjectMenuConfirm = document.querySelector("#subjectMenuConfirm");
const subjectMenuSubjectsStep = document.querySelector(".subject-menu__step--subjects");
const subjectMenuContentsStep = document.querySelector(".subject-menu__step--contents");
const subjectMenuDetailsStep = document.querySelector(".subject-menu__step--details");
const subjectMenuSubtopic = document.querySelector("#subjectMenuSubtopic");
const subtopicSuggestions = document.querySelector("#subtopicSuggestions");
const reportMenu = document.querySelector("#reportMenu");
const reportMenuButton = document.querySelector("#reportMenuButton");
const reportMonths = document.querySelector("#reportMonths");
const reportStats = document.querySelector("#reportStats");
const goalsMenu = document.querySelector("#goalsMenu");
const goalsMenuTitle = document.querySelector("#goalsMenuTitle");
const goalsMenuSave = document.querySelector("#goalsMenuSave");
const goalHoursPerDay = document.querySelector("#goalHoursPerDay");
const goalQuestionsPerDay = document.querySelector("#goalQuestionsPerDay");
const monthlyGoalsButton = document.querySelector("#monthlyGoalsButton");

const PLACEHOLDER_ROWS = 4;
const MAX_PLACEHOLDER_ROWS = 30;
const slotsByDay = {};

const DAYS = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const ICON_DRAG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="5" cy="4" r="0.6" fill="currentColor"></circle><circle cx="11" cy="4" r="0.6" fill="currentColor"></circle><circle cx="5" cy="8" r="0.6" fill="currentColor"></circle><circle cx="11" cy="8" r="0.6" fill="currentColor"></circle><circle cx="5" cy="12" r="0.6" fill="currentColor"></circle><circle cx="11" cy="12" r="0.6" fill="currentColor"></circle></svg>`;

const ICON_EDIT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>`;

const ICON_TRASH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>`;

const SUBJECTS = [
  { key: "matematica", label: "Matemática" },
  { key: "fisica", label: "Física" },
  { key: "quimica", label: "Química" },
  { key: "biologia", label: "Biologia" },
  { key: "historia", label: "História" },
  { key: "geografia", label: "Geografia" },
  { key: "filosofia", label: "Filosofia" },
  { key: "sociologia", label: "Sociologia" },
  { key: "linguagens", label: "Linguagens" },
  { key: "ingles", label: "Inglês" },
  { key: "redacao", label: "Redação" },
];

const SUBJECT_GROUPS = [
  { label: "Matemática", accent: "matematica", subjects: ["matematica"] },
  { label: "Ciências da Natureza", accent: "natureza", subjects: ["fisica", "quimica", "biologia"] },
  { label: "Ciências Humanas", accent: "humanas", subjects: ["historia", "geografia", "filosofia", "sociologia"] },
  { label: "Linguagens e Códigos", accent: "linguagens", subjects: ["linguagens", "ingles"] },
  { label: "Outros", accent: "outros", subjects: ["redacao"] },
];

const SUBJECT_ACCENT_COLORS = {
  matematica: { color: "#2563eb", soft: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.3)" },
  fisica:     { color: "#059669", soft: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.3)" },
  quimica:    { color: "#059669", soft: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.3)" },
  biologia:   { color: "#059669", soft: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.3)" },
  historia:   { color: "#d97706", soft: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.3)" },
  geografia:  { color: "#d97706", soft: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.3)" },
  filosofia:  { color: "#d97706", soft: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.3)" },
  sociologia: { color: "#d97706", soft: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.3)" },
  linguagens: { color: "#7c3aed", soft: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.3)" },
  ingles:     { color: "#7c3aed", soft: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.3)" },
  redacao:    { color: "#9d174d", soft: "rgba(157,23,77,0.08)", border: "rgba(157,23,77,0.3)" },
};

const SUBJECT_ICON_SVG_OPEN = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">`;

const SUBJECT_ICONS = {
  matematica: `${SUBJECT_ICON_SVG_OPEN}<circle cx="12" cy="6" r="1" fill="currentColor"></circle><line x1="5" y1="12" x2="19" y2="12"></line><circle cx="12" cy="18" r="1" fill="currentColor"></circle></svg>`,
  fisica: `${SUBJECT_ICON_SVG_OPEN}<circle cx="12" cy="12" r="1" fill="currentColor"></circle><ellipse cx="12" cy="12" rx="10" ry="4.5"></ellipse><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"></ellipse><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)"></ellipse></svg>`,
  biologia: `${SUBJECT_ICON_SVG_OPEN}<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>`,
  quimica: `${SUBJECT_ICON_SVG_OPEN}<path d="M10 2v7.31"></path><path d="M14 2v7.31"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>`,
  historia: `${SUBJECT_ICON_SVG_OPEN}<line x1="3" y1="22" x2="21" y2="22"></line><line x1="6" y1="18" x2="6" y2="11"></line><line x1="10" y1="18" x2="10" y2="11"></line><line x1="14" y1="18" x2="14" y2="11"></line><line x1="18" y1="18" x2="18" y2="11"></line><polygon points="12 2 20 7 4 7"></polygon></svg>`,
  geografia: `${SUBJECT_ICON_SVG_OPEN}<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  filosofia: `${SUBJECT_ICON_SVG_OPEN}<path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>`,
  sociologia: `${SUBJECT_ICON_SVG_OPEN}<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  linguagens: `${SUBJECT_ICON_SVG_OPEN}<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg>`,
  ingles: `${SUBJECT_ICON_SVG_OPEN}<path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>`,
  redacao: `${SUBJECT_ICON_SVG_OPEN}<path d="M12 20h9"></path><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path></svg>`,
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

let week = getWeekRange(new Date());
let storageKey = `study-schedule-${week.startISO}`;

let schedule = loadSchedule();
let activeMenuDay = null;
let activeMenuSlotIndex = null;
let pendingSelection = null;
let activeEditEntryId = null;
let scheduleSaveTimeout = null;
let userIdCache = null;
let currentMonthDate = startOfMonth(new Date());
let currentDayISO = null;
let dailyTasks = [];
let plannedDaysCache = new Set();

function setActiveWeek(date) {
  week = getWeekRange(date);
  storageKey = `study-schedule-${week.startISO}`;
  schedule = loadSchedule();
  renderAll();
  refreshScheduleFromSupabase(week.startISO);
}

const todayISO = formatISODateLocal(new Date());

if (prevMonthBtn) {
  prevMonthBtn.addEventListener("click", () => shiftMonth(-1));
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener("click", () => shiftMonth(1));
}

if (currentMonthBtn) {
  currentMonthBtn.addEventListener("click", () => {
    currentMonthDate = startOfMonth(new Date());
    loadMonthGrid();
  });
}

if (exportMonthImageBtn) {
  exportMonthImageBtn.addEventListener("click", async () => {
    const target = document.querySelector(".app");
    if (!target || typeof window.html2canvas !== "function") return;
    exportMonthImageBtn.disabled = true;
    document.body.classList.add("capture-mode");
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const canvas = await window.html2canvas(target, {
        backgroundColor: null,
        scale: 2.5,
        useCORS: true,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      const year = currentMonthDate.getFullYear();
      const monthNumber = String(currentMonthDate.getMonth() + 1).padStart(2, "0");
      link.download = `calendario-${year}-${monthNumber}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      document.body.classList.remove("capture-mode");
      exportMonthImageBtn.disabled = false;
    }
  });
}

if (dayMenu) {
  dayMenu.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-day-close]");
    if (closeTarget) closeDayDetail();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dayMenu.classList.contains("is-open")) {
      closeDayDetail();
    }
  });
}

loadMonthGrid();
renderAll();
refreshScheduleFromSupabase(week.startISO);

if (clearButton) {
  clearButton.addEventListener("click", () => {
    if (!confirm("Deseja limpar todos os blocos desta semana?")) {
      return;
    }
    schedule = createEmptySchedule();
    persistSchedule("Semana limpa");
    renderAll();
  });
}

if (exportButton) {
  exportButton.addEventListener("click", () => {
    const payload = {
      weekStart: week.startISO,
      weekEnd: week.endISO,
      schedule: schedule.days,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cronograma-${week.startISO}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

dayCards.forEach((card) => {
  const entries = card.querySelector(".entries");
  if (!entries) return;
  entries.addEventListener("click", (event) => {
    const placeholder = event.target.closest(".entry-placeholder");
    if (placeholder && !event.target.closest(".slot-remove")) {
      const dayKey = card.dataset.day;
      const slotIndex = Number(placeholder.dataset.slotIndex);
      if (dayKey) openSubjectMenu(dayKey, Number.isNaN(slotIndex) ? null : slotIndex);
      return;
    }
    const button = event.target.closest("button");
    if (!button || !button.dataset.removeId) {
      return;
    }
    const dayKey = card.dataset.day;
    const dayItems = schedule.days[dayKey] || [];
    schedule.days[dayKey] = dayItems.filter((item) => item.id !== button.dataset.removeId);
    persistSchedule("Bloco removido");
    renderAll();
  });
  entries.addEventListener("dblclick", (event) => {
    const entryEl = event.target.closest(".entry");
    if (!entryEl || entryEl.classList.contains("entry-placeholder")) return;
    if (event.target.closest("button")) return;
    const dayKey = card.dataset.day;
    if (!dayKey) return;
    const entryId = entryEl.dataset.entryId;
    if (!entryId) return;
    const dayItems = schedule.days[dayKey] || [];
    const entry = dayItems.find((item) => item.id === entryId);
    if (!entry) return;
    openSubjectMenuForEdit(dayKey, entry);
  });
  entries.addEventListener("dragstart", (event) => handleDragStart(event, card));
  entries.addEventListener("dragover", (event) => handleDragOver(event, card));
  entries.addEventListener("drop", (event) => handleDrop(event, card));
  entries.addEventListener("dragend", handleDragEnd);
  entries.addEventListener("dragleave", (event) => handleDragLeave(event, card));
  card.addEventListener("dragover", (event) => handleDragOver(event, card));
  card.addEventListener("drop", (event) => handleDrop(event, card));
  card.addEventListener("dragleave", (event) => handleDragLeave(event, card));
});

document.querySelectorAll(".add-slot-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const dayKey = button.dataset.day;
    if (!dayKey) return;
    const current = Math.max(
      slotsByDay[dayKey] || PLACEHOLDER_ROWS,
      schedule.days[dayKey]?.length || 0
    );
    if (current >= MAX_PLACEHOLDER_ROWS) return;
    slotsByDay[dayKey] = current + 1;
    renderDay(dayKey);
  });
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".slot-remove");
  if (!button) return;
  const dayKey = button.dataset.day;
  if (!dayKey) return;
  const current = Math.max(
    slotsByDay[dayKey] || PLACEHOLDER_ROWS,
    schedule.days[dayKey]?.length || 0
  );
  if (current <= PLACEHOLDER_ROWS) return;
  slotsByDay[dayKey] = current - 1;
  renderDay(dayKey);
});

function createEmptySchedule() {
  return {
    days: DAYS.reduce((acc, day) => {
      acc[day.key] = [];
      return acc;
    }, {}),
  };
}

function loadSchedule() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return createEmptySchedule();
  }

  try {
    const parsed = JSON.parse(stored);
    const base = createEmptySchedule();
    const merged = {
      days: { ...base.days, ...parsed.days },
    };
    ensureSlotIndexes(merged);
    return merged;
  } catch (error) {
    console.warn("Não foi possível ler os dados salvos", error);
    return createEmptySchedule();
  }
}

function persistSchedule(message) {
  localStorage.setItem(storageKey, JSON.stringify(schedule));
  if (saveStateEl) saveStateEl.textContent = message;
  scheduleSaveDebounced();
}

function scheduleSaveDebounced() {
  if (scheduleSaveTimeout) clearTimeout(scheduleSaveTimeout);
  scheduleSaveTimeout = setTimeout(() => {
    saveScheduleToSupabase(week.startISO, schedule);
  }, 600);
}

async function saveScheduleToSupabase(weekStartISO, currentSchedule) {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;
  const rows = [];
  DAYS.forEach((day) => {
    const list = currentSchedule.days[day.key] || [];
    list.forEach((item) => {
      item.id = ensureUuid(item.id);
      const hoursNumber = Number.isFinite(item.hoursNumber)
        ? item.hoursNumber
        : parseHours(item.time);
      const questionsNumber = Number.isFinite(item.questionsNumber)
        ? item.questionsNumber
        : parseQuestions(item.notes);
      const hitsNumber = Number.isFinite(item.hitsNumber)
        ? item.hitsNumber
        : parseHits(item.notes);
      const essayScore = Number.isFinite(item.essayScore)
        ? item.essayScore
        : parseEssayScore(item.notes);
      rows.push({
        id: item.id,
        user_id: userId,
        week_start: weekStartISO,
        day_key: day.key,
        slot_index: item.slotIndex || 0,
        topic: item.topic,
        notes: item.notes,
        hours: hoursNumber || null,
        questions: questionsNumber || null,
        hits: hitsNumber || null,
        essay_score: essayScore || null,
        subject: item.subjectKey || null,
        subtopic: item.subtopic || null,
      });
    });
  });

  await window.supabaseClient
    .from("cronograma_entries")
    .delete()
    .eq("user_id", userId)
    .eq("week_start", weekStartISO);

  if (rows.length) {
    await window.supabaseClient.from("cronograma_entries").insert(rows);
  }
}

async function refreshScheduleFromSupabase(weekStartISO) {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;
  const { data, error } = await window.supabaseClient
    .from("cronograma_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStartISO);
  if (error || !data) return;

  const nextSchedule = createEmptySchedule();
  data.forEach((row) => {
    if (!nextSchedule.days[row.day_key]) {
      nextSchedule.days[row.day_key] = [];
    }
    const hoursNumber = row.hours ?? 0;
    const questionsNumber = row.questions ?? 0;
    const hitsNumber = row.hits ?? 0;
    const essayScore = row.essay_score ?? 0;
    const fallbackLabel = row.notes
      ? String(row.notes).split("•")[0].trim()
      : "Matéria";
    nextSchedule.days[row.day_key].push({
      id: row.id,
      topic: row.topic,
      notes: row.notes || buildNotes(fallbackLabel, questionsNumber, hitsNumber, essayScore),
      time: hoursNumber ? `${hoursNumber}h` : "",
      slotIndex: row.slot_index ?? 0,
      hoursNumber,
      questionsNumber,
      hitsNumber,
      essayScore,
      subjectKey: row.subject || resolveSubjectKey({ notes: row.notes }),
      subtopic: row.subtopic || null,
    });
  });
  ensureSlotIndexes(nextSchedule);
  schedule = nextSchedule;
  localStorage.setItem(storageKey, JSON.stringify(schedule));
  renderAll();
}

async function getUserId() {
  if (userIdCache) return userIdCache;
  if (!window.supabaseClient) return null;
  const { data } = await window.supabaseClient.auth.getUser();
  userIdCache = data?.user?.id || null;
  return userIdCache;
}

/* ─── Daily planning tasks (Supabase) ──────────────────── */
async function fetchDailyTasks(userId, dateISO) {
  if (!userId || !window.supabaseClient) return [];
  const { data, error } = await window.supabaseClient
    .from("cronograma_daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_date", dateISO)
    .order("position", { ascending: true });
  if (error || !data) return [];
  return data;
}

async function createDailyTask(dateISO, title, position) {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return null;
  const { data, error } = await window.supabaseClient
    .from("cronograma_daily_tasks")
    .insert({ user_id: userId, task_date: dateISO, title, position, done: false })
    .select()
    .single();
  if (error) return null;
  return data;
}

async function updateDailyTask(id, fields) {
  if (!window.supabaseClient) return;
  await window.supabaseClient
    .from("cronograma_daily_tasks")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
}

async function deleteDailyTask(id) {
  if (!window.supabaseClient) return;
  await window.supabaseClient.from("cronograma_daily_tasks").delete().eq("id", id);
}

async function reorderDailyTasks(orderedIds) {
  if (!window.supabaseClient) return;
  await Promise.all(
    orderedIds.map((id, index) =>
      window.supabaseClient.from("cronograma_daily_tasks").update({ position: index }).eq("id", id)
    )
  );
}

function renderAll() {
  if (dayDetailColumn) {
    renderDay(dayDetailColumn.dataset.day);
  }
  renderMonthGrid();
}

function renderDay(dayKey) {
  const card = dayCards.find((item) => item.dataset.day === dayKey);
  if (!card) return;
  const entriesEl = card.querySelector(".entries");
  if (!entriesEl) return;
  const items = schedule.days[dayKey] || [];
  if (!schedule.days[dayKey]) {
    schedule.days[dayKey] = items;
  }
  const addButton = document.querySelector(`.add-slot-btn[data-day="${dayKey}"]`);
  const maxSlotIndex = items.reduce(
    (maxValue, item) =>
      Number.isFinite(item.slotIndex) ? Math.max(maxValue, item.slotIndex) : maxValue,
    -1
  );
  const slotCount = Math.max(
    slotsByDay[dayKey] || PLACEHOLDER_ROWS,
    items.length || 0,
    maxSlotIndex + 1
  );

  entriesEl.innerHTML = "";

  const slots = Array.from({ length: slotCount }, () => null);
  const unplaced = [];
  items.forEach((item) => {
    if (
      Number.isFinite(item.slotIndex) &&
      item.slotIndex >= 0 &&
      item.slotIndex < slotCount &&
      !slots[item.slotIndex]
    ) {
      slots[item.slotIndex] = item;
    } else {
      unplaced.push(item);
    }
  });
  unplaced.forEach((item) => {
    const nextIndex = slots.findIndex((slot) => !slot);
    if (nextIndex === -1) {
      item.slotIndex = slots.length;
      slots.push(item);
    } else {
      item.slotIndex = nextIndex;
      slots[nextIndex] = item;
    }
  });

  slots.forEach((slotItem, index) => {
    if (slotItem) {
      const entry = document.createElement("li");
      entry.className = "entry";
      entry.dataset.entryId = slotItem.id;
      entry.dataset.slotIndex = String(index);
      entry.setAttribute("draggable", "true");
      const notes = slotItem.notes ? slotItem.notes : "Sem observacoes";
      const hoursValue = Number.isFinite(slotItem.hoursNumber)
        ? slotItem.hoursNumber
        : parseHours(slotItem.time);
      const time = hoursValue > 0 ? formatHours(hoursValue) : "--:--";
      const topicInfo = formatTopicForDisplay(slotItem.topic);
      const subjectKey = resolveSubjectKey(slotItem);
      const notesHtml = formatNotesForDisplay(notes);
      const questionsCount = Number.isFinite(slotItem.questionsNumber)
        ? slotItem.questionsNumber
        : parseQuestions(notes);
      const hasQuestions = Number.isFinite(questionsCount) && questionsCount > 0;
      const displayTopic = topicInfo.html;
      const subtopicHtml = slotItem.subtopic
        ? `<span class="entry-subtopic">${escapeHtml(slotItem.subtopic)}</span>`
        : "";
      entry.innerHTML = `
        <div class="entry-card" data-subject="${escapeHtml(subjectKey)}">
          <div class="entry-header">
            <div class="entry-title">
              <strong>${displayTopic}</strong>
              <span class="entry-badge">${escapeHtml(time)}</span>
            </div>
            ${subtopicHtml}
          </div>
          <span class="entry-subtitle${topicInfo.isMultiLine ? "" : " entry-subtitle--single"}${
            hasQuestions ? "" : " entry-subtitle--offset"
          }">${notesHtml}</span>
          <button class="entry-remove" data-remove-id="${slotItem.id}" type="button" aria-label="Remover">
            <img class="trash-icon trash-icon--light" src="/imagens/white-trash.png" alt="" aria-hidden="true" />
            <img class="trash-icon trash-icon--dark" src="/imagens/white-trash.png" alt="" aria-hidden="true" />
          </button>
        </div>
      `;
      entriesEl.appendChild(entry);
      return;
    }

    const empty = document.createElement("li");
    empty.className = "entry entry-placeholder";
    empty.dataset.slotIndex = String(index);
    if (slotCount > PLACEHOLDER_ROWS) {
      empty.innerHTML = `
        <button class="slot-remove" type="button" data-day="${dayKey}" aria-label="Remover bloco"></button>
      `;
    }
    entriesEl.appendChild(empty);
  });

  if (addButton) {
    addButton.disabled = slotCount >= MAX_PLACEHOLDER_ROWS;
    addButton.textContent = addButton.disabled
      ? "Limite de 30 blocos"
      : "Adicionar bloco";
  }

  updateDaySummary(card, items);
}

function openSubjectMenu(dayKey, slotIndex) {
  if (!subjectMenu) return;
  activeMenuDay = dayKey;
  activeMenuSlotIndex = slotIndex;
  pendingSelection = null;
  activeEditEntryId = null;
  setMenuStep("subjects");
  subjectMenu.classList.add("is-open");
  subjectMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("subject-menu-open");
  document.body.style.overflow = "hidden";
  if (dayMenu) dayMenu.classList.remove("is-open");
}

function openSubjectMenuForEdit(dayKey, entry) {
  if (!subjectMenu || !entry) return;
  const subjectKey = resolveSubjectKey(entry);
  const subject =
    SUBJECTS.find((item) => item.key === subjectKey) || { key: subjectKey, label: entry.notes };
  activeMenuDay = dayKey;
  activeMenuSlotIndex = Number.isFinite(entry.slotIndex) ? entry.slotIndex : null;
  pendingSelection = { subject, content: entry.topic };
  activeEditEntryId = entry.id || null;
  subjectMenu.classList.add("is-edit");
  subjectMenu.classList.add("is-open");
  subjectMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("subject-menu-open");
  document.body.style.overflow = "hidden";
  if (subjectMenuSubtitle) subjectMenuSubtitle.textContent = subject.label || "Conteúdo";
  toggleDetailFields(subjectKey);
  setMenuStep("details");
  if (subjectMenuHours) subjectMenuHours.value = entry.hoursNumber ? entry.hoursNumber : "";
  if (subjectMenuQuestions) subjectMenuQuestions.value = entry.questionsNumber ? entry.questionsNumber : "";
  if (subjectMenuEssay) subjectMenuEssay.value = entry.essayScore ? entry.essayScore : "";
  if (subjectMenuSubtopic) subjectMenuSubtopic.value = entry.subtopic || "";
  if (subtopicSuggestions) {
    subtopicSuggestions.innerHTML = "";
    const subTopics = window.materiasData?.[subjectKey]?.topicosPorConteudo?.[entry.topic] || [];
    subTopics.forEach((st) => {
      const opt = document.createElement("option");
      opt.value = st;
      subtopicSuggestions.appendChild(opt);
    });
  }
  if (subjectMenuHours) subjectMenuHours.focus();
  if (dayMenu) dayMenu.classList.remove("is-open");
}

function closeSubjectMenu() {
  if (!subjectMenu) return;
  subjectMenu.classList.remove("is-open");
  subjectMenu.classList.remove("is-edit");
  subjectMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("subject-menu-open");
  document.body.style.overflow = "";
  activeMenuDay = null;
  activeMenuSlotIndex = null;
  pendingSelection = null;
  activeEditEntryId = null;
  if (subjectMenuContentsStep) subjectMenuContentsStep.hidden = true;
  if (subjectMenuSubjectsStep) subjectMenuSubjectsStep.hidden = false;
  if (subjectMenuDetailsStep) subjectMenuDetailsStep.hidden = true;
  if (subjectMenuHours) subjectMenuHours.value = "";
  if (subjectMenuQuestions) subjectMenuQuestions.value = "";
  if (subjectMenuEssay) subjectMenuEssay.value = "";
  if (subjectMenuSubtopic) subjectMenuSubtopic.value = "";
  if (subtopicSuggestions) subtopicSuggestions.innerHTML = "";
  toggleDetailFields(null);
  if (dayMenu && dayMenu.getAttribute("aria-hidden") === "false") {
    dayMenu.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
}

function setMenuStep(step) {
  if (!subjectMenuSubjectsStep || !subjectMenuContentsStep || !subjectMenuDetailsStep) return;
  const showingSubjects = step === "subjects";
  const showingContents = step === "contents";
  const showingDetails = step === "details";
  subjectMenuSubjectsStep.hidden = !showingSubjects;
  subjectMenuContentsStep.hidden = !showingContents;
  subjectMenuDetailsStep.hidden = !showingDetails;
}

function getSubjectContents(key) {
  const data = window.materiasData ? window.materiasData[key] : null;
  if (!data || !Array.isArray(data.conteudos)) return [];
  return data.conteudos;
}

function addScheduleEntry(
  dayKey,
  subjectLabel,
  subjectKey,
  content,
  subtopicValue,
  hoursValue,
  questionsValue,
  slotIndex,
  hitsValue,
  essayValue
) {
  const hoursNumber = Number.isFinite(hoursValue) ? hoursValue : 0;
  const questionsNumber = Number.isFinite(questionsValue) ? questionsValue : 0;
  const hitsNumber = Number.isFinite(hitsValue) ? hitsValue : 0;
  const essayScore = Number.isFinite(essayValue) ? essayValue : 0;
  const hours = hoursNumber > 0 ? `${hoursNumber}h` : "";
  const notes = buildNotes(subjectLabel, questionsNumber, hitsNumber, essayScore);
  if (!schedule.days[dayKey]) schedule.days[dayKey] = [];
  const dayItems = schedule.days[dayKey];
  const usedSlots = new Set(dayItems.map((item) => item.slotIndex).filter(Number.isFinite));
  let targetSlot = Number.isFinite(slotIndex) ? slotIndex : null;
  if (targetSlot === null || usedSlots.has(targetSlot)) {
    let candidate = 0;
    while (usedSlots.has(candidate)) candidate += 1;
    targetSlot = candidate;
  }
  schedule.days[dayKey].push({
    id: ensureUuid(generateId()),
    topic: content,
    notes,
    time: hours,
    slotIndex: targetSlot,
    hoursNumber,
    questionsNumber,
    hitsNumber,
    essayScore,
    subjectKey: subjectKey || null,
    subtopic: subtopicValue || null,
  });
  persistSchedule("Bloco adicionado");
  renderAll();
}

function updateScheduleEntry(
  dayKey,
  entryId,
  subjectLabel,
  subjectKey,
  content,
  subtopicValue,
  hoursValue,
  questionsValue,
  hitsValue,
  essayValue
) {
  const dayItems = schedule.days[dayKey] || [];
  const target = dayItems.find((item) => item.id === entryId);
  if (!target) return;
  const hoursNumber = Number.isFinite(hoursValue) ? hoursValue : 0;
  const questionsNumber = Number.isFinite(questionsValue) ? questionsValue : 0;
  const hitsNumber = Number.isFinite(hitsValue) ? hitsValue : 0;
  const essayScore = Number.isFinite(essayValue) ? essayValue : 0;
  target.topic = content;
  target.hoursNumber = hoursNumber;
  target.questionsNumber = questionsNumber;
  target.hitsNumber = hitsNumber;
  target.essayScore = essayScore;
  target.time = hoursNumber > 0 ? `${hoursNumber}h` : "";
  target.notes = buildNotes(subjectLabel, questionsNumber, hitsNumber, essayScore);
  target.subjectKey = subjectKey || null;
  target.subtopic = subtopicValue || null;
  persistSchedule("Bloco atualizado");
  renderAll();
}
function renderSubjectOptions() {
  if (!subjectMenuSubjects) return;
  subjectMenuSubjects.innerHTML = "";
  let animIndex = 0;
  SUBJECT_GROUPS.forEach((group) => {
    const header = document.createElement("div");
    header.className = "subject-menu__group-header";
    header.dataset.groupAccent = group.accent;
    header.textContent = group.label;
    subjectMenuSubjects.appendChild(header);
    group.subjects.forEach((key) => {
      const subject = SUBJECTS.find((s) => s.key === key);
      if (!subject) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "subject-menu__option";
      button.dataset.subject = subject.key;
      button.style.setProperty("--delay", `${animIndex * 35}ms`);
      button.innerHTML = `
        <span class="subject-menu__option-icon" aria-hidden="true">${SUBJECT_ICONS[subject.key] || ""}</span>
        <span class="subject-menu__option-label">${escapeHtml(subject.label)}</span>
      `;
      button.addEventListener("click", () => openSubjectContents(subject));
      subjectMenuSubjects.appendChild(button);
      animIndex += 1;
    });
  });
}

function openSubjectContents(subject) {
  if (!subjectMenuContents || !subjectMenuSubtitle) return;
  pendingSelection = { subject };
  subjectMenuSubtitle.textContent = subject.label;
  subjectMenuContents.innerHTML = "";
  toggleDetailFields(subject.key);
  const ac = SUBJECT_ACCENT_COLORS[subject.key];
  if (ac && subjectMenuContentsStep) {
    subjectMenuContentsStep.style.setProperty("--item-accent-color", ac.color);
    subjectMenuContentsStep.style.setProperty("--item-accent-soft", ac.soft);
    subjectMenuContentsStep.style.setProperty("--item-accent-border", ac.border);
  }

  const contents = getSubjectContents(subject.key);
  if (!contents.length) {
    const empty = document.createElement("div");
    empty.className = "subject-menu__empty";
    empty.textContent = "Sem conteúdos cadastrados.";
    subjectMenuContents.appendChild(empty);
    setMenuStep("contents");
    return;
  }

  contents.forEach((content, index) => {
    const displayContent = toTitleCase(content);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "subject-menu__item";
    button.textContent = displayContent;
    button.style.setProperty("--delay", `${index * 35}ms`);
    button.addEventListener("click", () => {
      if (!activeMenuDay) return;
      pendingSelection = { subject, content: displayContent };
      if (subtopicSuggestions) {
        subtopicSuggestions.innerHTML = "";
        const subTopics =
          window.materiasData?.[subject.key]?.topicosPorConteudo?.[content] ||
          window.materiasData?.[subject.key]?.topicosPorConteudo?.[displayContent] || [];
        subTopics.forEach((st) => {
          const opt = document.createElement("option");
          opt.value = st;
          subtopicSuggestions.appendChild(opt);
        });
      }
      if (subjectMenuSubtopic) subjectMenuSubtopic.value = "";
      setMenuStep("details");
      if (subjectMenuHours) subjectMenuHours.focus();
      toggleDetailFields(subject.key);
    });
    subjectMenuContents.appendChild(button);
  });

  setMenuStep("contents");
}

if (subjectMenu) {
  renderSubjectOptions();
  subjectMenu.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-menu-close]");
    if (closeTarget) closeSubjectMenu();
  });
  if (subjectMenuBack) {
    subjectMenuBack.addEventListener("click", () => {
      pendingSelection = null;
      setMenuStep("subjects");
    });
  }
  if (subjectMenuBackDetails) {
    subjectMenuBackDetails.addEventListener("click", () => {
      setMenuStep("contents");
    });
  }
  if (subjectMenuConfirm) {
    subjectMenuConfirm.addEventListener("click", () => {
      if (!activeMenuDay || !pendingSelection?.subject || !pendingSelection?.content) return;
      const hoursValue = subjectMenuHours?.value ? Number(subjectMenuHours.value) : 0;
      const questionsValue = subjectMenuQuestions?.value ? Number(subjectMenuQuestions.value) : 0;
      const essayValue = subjectMenuEssay?.value ? Number(subjectMenuEssay.value) : 0;
      const subtopicValue = subjectMenuSubtopic?.value?.trim() || null;

      const content = pendingSelection.content || "";

      if (activeEditEntryId) {
        updateScheduleEntry(
          activeMenuDay,
          activeEditEntryId,
          pendingSelection.subject.label,
          pendingSelection.subject.key,
          content,
          subtopicValue,
          Number.isNaN(hoursValue) ? 0 : hoursValue,
          Number.isNaN(questionsValue) ? 0 : questionsValue,
          0,
          Number.isNaN(essayValue) ? 0 : essayValue
        );
      } else {
        addScheduleEntry(
          activeMenuDay,
          pendingSelection.subject.label,
          pendingSelection.subject.key,
          content,
          subtopicValue,
          Number.isNaN(hoursValue) ? 0 : hoursValue,
          Number.isNaN(questionsValue) ? 0 : questionsValue,
          activeMenuSlotIndex,
          0,
          Number.isNaN(essayValue) ? 0 : essayValue
        );
      }
      closeSubjectMenu();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && subjectMenu.classList.contains("is-open")) {
      closeSubjectMenu();
    }
  });
}

function toggleDetailFields(subjectKey) {
  if (!subjectMenuQuestions || !subjectMenuEssay) return;
  const questionsField = subjectMenuQuestions.closest(".subject-menu__field");
  if (!questionsField) return;
  if (subjectKey === "redacao") {
    questionsField.hidden = true;
    questionsField.style.display = "none";
    if (subjectMenuEssayField) subjectMenuEssayField.hidden = false;
    if (subjectMenuEssayField) subjectMenuEssayField.style.display = "";
    subjectMenuQuestions.value = "";
  } else {
    questionsField.hidden = false;
    questionsField.style.display = "";
    if (subjectMenuEssayField) subjectMenuEssayField.hidden = true;
    if (subjectMenuEssayField) subjectMenuEssayField.style.display = "none";
    if (subjectMenuEssay) subjectMenuEssay.value = "";
  }
}

function openReportMenu() {
  if (!reportMenu) return;
  reportMenu.classList.add("is-open");
  reportMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("report-menu-open");
  document.body.style.overflow = "hidden";
  renderReportMonths();
}

function closeReportMenu() {
  if (!reportMenu) return;
  reportMenu.classList.remove("is-open");
  reportMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("report-menu-open");
  document.body.style.overflow = "";
}

function renderReportMonths() {
  if (!reportMonths) return;
  reportMonths.innerHTML = "";
  const activeMonth = currentMonthDate.getMonth();
  const activeYear = currentMonthDate.getFullYear();
  MONTHS.forEach((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reports-menu__month-btn";
    button.textContent = label;
    if (index === activeMonth) button.classList.add("is-active");
    button.addEventListener("click", () => {
      reportMonths.querySelectorAll(".reports-menu__month-btn").forEach((el) => {
        el.classList.remove("is-active");
      });
      button.classList.add("is-active");
      void renderMonthlyReport(index, activeYear);
    });
    reportMonths.appendChild(button);
  });
  void renderMonthlyReport(activeMonth, activeYear);
}

function getMonthGridDates(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const gridStartISO = getWeekRange(firstOfMonth).startISO;
  const gridEndISO = getWeekRange(lastOfMonth).endISO;
  const gridStart = new Date(`${gridStartISO}T00:00:00`);
  const gridEnd = new Date(`${gridEndISO}T00:00:00`);
  const dates = [];
  const cursor = new Date(gridStart);
  while (cursor.getTime() <= gridEnd.getTime()) {
    const date = new Date(cursor);
    const weekRange = getWeekRange(date);
    dates.push({
      date,
      iso: formatISODateLocal(date),
      inMonth: date.getMonth() === monthIndex,
      isToday: formatISODateLocal(date) === todayISO,
      weekStart: weekRange.startISO,
      dayKey: DAYS[(date.getDay() + 6) % 7].key,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return { dates, gridStartISO, gridEndISO };
}

async function ensureRangeScheduleCached(startISO, endISO) {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;
  const { data, error } = await window.supabaseClient
    .from("cronograma_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("week_start", startISO)
    .lte("week_start", endISO);
  if (error || !data || data.length === 0) return;
  const byWeek = new Map();
  data.forEach((row) => {
    if (!byWeek.has(row.week_start)) byWeek.set(row.week_start, []);
    byWeek.get(row.week_start).push(row);
  });
  byWeek.forEach((rows, weekStart) => {
    if (weekStart === week.startISO) return;
    const key = `study-schedule-${weekStart}`;
    const nextSchedule = createEmptySchedule();
    rows.forEach((row) => {
      if (!nextSchedule.days[row.day_key]) nextSchedule.days[row.day_key] = [];
      const hoursNumber = row.hours ?? 0;
      const questionsNumber = row.questions ?? 0;
      const hitsNumber = row.hits ?? 0;
      const essayScore = row.essay_score ?? 0;
      const fallbackLabel = row.notes ? String(row.notes).split("•")[0].trim() : "Matéria";
      nextSchedule.days[row.day_key].push({
        id: row.id,
        topic: row.topic,
        notes: row.notes || buildNotes(fallbackLabel, questionsNumber, hitsNumber, essayScore),
        time: hoursNumber ? `${hoursNumber}h` : "",
        slotIndex: row.slot_index ?? 0,
        hoursNumber,
        questionsNumber,
        hitsNumber,
        essayScore,
      });
    });
    try {
      localStorage.setItem(key, JSON.stringify(nextSchedule));
    } catch (_) {}
  });
}

async function ensureRangePlannedDaysCached(startISO, endISO) {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;
  const { data, error } = await window.supabaseClient
    .from("cronograma_daily_tasks")
    .select("task_date")
    .eq("user_id", userId)
    .eq("done", true)
    .gte("task_date", startISO)
    .lte("task_date", endISO);
  if (error) return;
  plannedDaysCache.forEach((iso) => {
    if (iso >= startISO && iso <= endISO) plannedDaysCache.delete(iso);
  });
  (data || []).forEach((row) => plannedDaysCache.add(row.task_date));
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isViewingCurrentMonth() {
  return startOfMonth(new Date()).getTime() === currentMonthDate.getTime();
}

function isViewingFutureMonth() {
  return currentMonthDate.getTime() > startOfMonth(new Date()).getTime();
}

function getScheduleForWeek(weekStartISO) {
  if (weekStartISO === week.startISO) return schedule;
  try {
    const raw = localStorage.getItem(`study-schedule-${weekStartISO}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { days: { ...createEmptySchedule().days, ...parsed.days } };
  } catch (_) {
    return null;
  }
}

function getChipLabel(item) {
  const subjectKey = resolveSubjectKey(item);
  const subject = SUBJECTS.find((entry) => entry.key === subjectKey);
  return subject ? subject.label : toTitleCase(subjectKey);
}

function renderMonthHeader() {
  if (monthRangeEl) {
    monthRangeEl.textContent = `${MONTHS[currentMonthDate.getMonth()]} de ${currentMonthDate.getFullYear()}`;
  }
  const isCurrent = isViewingCurrentMonth();
  if (currentMonthBtn) {
    currentMonthBtn.classList.toggle("is-current", isCurrent);
    currentMonthBtn.textContent = isCurrent ? "Mês Atual" : "Voltar para mês atual";
  }
  if (monthlyGoalsButton) {
    if (isViewingFutureMonth()) {
      monthlyGoalsButton.style.display = "none";
    } else {
      monthlyGoalsButton.style.display = "";
      const label = isCurrent ? "Minhas Metas Mensais" : "Metas Definidas Neste Mês";
      monthlyGoalsButton.textContent = label;
      monthlyGoalsButton.setAttribute("aria-label", label);
    }
  }
  updateMonthSummary();
}

function updateMonthSummary() {
  if (!monthSummaryEl) return;
  const stats = computeMonthlyStats(currentMonthDate.getMonth(), currentMonthDate.getFullYear());
  monthSummaryEl.innerHTML = `
    <div class="month-stat">
      <span class="month-stat__value">${escapeHtml(formatNumber(stats.totalQuestions))}</span>
      <span class="month-stat__label">Questões</span>
    </div>
    <span class="month-stat__divider" aria-hidden="true"></span>
    <div class="month-stat">
      <span class="month-stat__value">${escapeHtml(formatHours(stats.totalHours))}</span>
      <span class="month-stat__label">Horas totais</span>
    </div>
    <span class="month-stat__divider" aria-hidden="true"></span>
    <div class="month-stat">
      <span class="month-stat__value">${escapeHtml(formatHours(stats.avgHours))}h</span>
      <span class="month-stat__label">Por dia</span>
    </div>
  `;
}

function renderMonthGrid() {
  if (!monthGrid) return;
  const { dates } = getMonthGridDates(currentMonthDate.getFullYear(), currentMonthDate.getMonth());
  monthGrid.innerHTML = "";
  dates.forEach((cellInfo) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "month-cell";
    if (!cellInfo.inMonth) cell.classList.add("month-cell--outside");
    if (cellInfo.isToday) cell.classList.add("month-cell--today");
    cell.dataset.date = cellInfo.iso;

    const dateLabel = cellInfo.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const weekdayLabel = DAYS[(cellInfo.date.getDay() + 6) % 7].label;

    const weekSchedule = getScheduleForWeek(cellInfo.weekStart);
    const items = weekSchedule?.days?.[cellInfo.dayKey] || [];

    const visibleItems = items.slice(0, 3);
    const chipsHtml = visibleItems
      .map((item) => {
        const subjectKey = resolveSubjectKey(item);
        return `<span class="month-chip" data-subject="${escapeHtml(subjectKey)}">${escapeHtml(
          getChipLabel(item)
        )}</span>`;
      })
      .join("");
    const moreHtml =
      items.length > visibleItems.length
        ? `<span class="month-chip month-chip--more">+${items.length - visibleItems.length}</span>`
        : "";

    const plannedHtml = plannedDaysCache.has(cellInfo.iso)
      ? `<img class="month-cell__planned" src="/imagens/documento.png" alt="Dia planejado com antecedência" title="Show! Esse dia foi planejado com antecedência." />`
      : "";

    cell.innerHTML = `
      <span class="month-cell__weekday">${escapeHtml(weekdayLabel)}</span>
      <span class="month-cell__date">${escapeHtml(dateLabel)}</span>
      <span class="month-cell__chips">${chipsHtml}${moreHtml}</span>
      <span class="month-cell__add" aria-hidden="true">+</span>
      ${plannedHtml}
    `;

    cell.addEventListener("click", () => openDayDetail(cellInfo));
    monthGrid.appendChild(cell);
  });
}

async function loadMonthGrid() {
  renderMonthHeader();
  renderMonthGrid();
  const { gridStartISO, gridEndISO } = getMonthGridDates(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth()
  );
  await Promise.all([
    ensureRangeScheduleCached(gridStartISO, gridEndISO),
    ensureRangePlannedDaysCached(gridStartISO, gridEndISO),
  ]);
  updateMonthSummary();
  renderMonthGrid();
}

function shiftMonth(delta) {
  currentMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + delta, 1);
  loadMonthGrid();
}

function openDayDetail(cellInfo) {
  if (!dayMenu || !dayDetailColumn) return;
  if (cellInfo.weekStart !== week.startISO) {
    setActiveWeek(cellInfo.date);
  }
  dayDetailColumn.dataset.day = cellInfo.dayKey;
  if (dayDetailAddBtn) dayDetailAddBtn.dataset.day = cellInfo.dayKey;
  const dayInfo = DAYS.find((day) => day.key === cellInfo.dayKey);
  if (dayMenuWeekday) {
    dayMenuWeekday.textContent = `${dayInfo?.label || ""}${cellInfo.isToday ? " · Hoje" : ""}`;
  }
  if (dayMenuTitle) {
    dayMenuTitle.textContent = cellInfo.date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  }
  renderDay(cellInfo.dayKey);

  currentDayISO = cellInfo.iso;
  setActiveDayTab("plan");
  loadDailyTasks(cellInfo.iso);

  dayMenu.classList.add("is-open");
  dayMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("day-menu-open");
  document.body.style.overflow = "hidden";
}

function closeDayDetail() {
  if (!dayMenu) return;
  dayMenu.classList.remove("is-open");
  dayMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("day-menu-open");
  document.body.style.overflow = "";
}

/* ─── Day-menu tab switching ───────────────────────────── */
function setActiveDayTab(tab) {
  dayMenuTabs.forEach((btn) => {
    const isActive = btn.dataset.dayTab === tab;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  if (dayPlanPanel) dayPlanPanel.hidden = tab !== "plan";
  if (dayStudyPanel) dayStudyPanel.hidden = tab !== "study";
}

dayMenuTabs.forEach((btn) => {
  btn.addEventListener("click", () => setActiveDayTab(btn.dataset.dayTab));
});

/* ─── Daily planning: render + interactions ────────────── */
async function loadDailyTasks(dateISO) {
  dailyTasks = [];
  renderTaskList();
  const userId = await getUserId();
  const tasks = await fetchDailyTasks(userId, dateISO);
  if (currentDayISO !== dateISO) return;
  dailyTasks = tasks;
  renderTaskList();
}

function renderTaskList() {
  updateDayPlannedBadge();
  if (!dayTaskList) return;
  dayTaskList.innerHTML = "";

  if (!dailyTasks.length) {
    const empty = document.createElement("li");
    empty.className = "task-list__empty";
    empty.textContent = "Nenhuma tarefa adicionada ainda.";
    dayTaskList.appendChild(empty);
    return;
  }

  dailyTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item${task.done ? " is-done" : ""}`;
    li.dataset.taskId = task.id;
    li.draggable = true;
    li.innerHTML = `
      <span class="task-item__handle" aria-hidden="true">${ICON_DRAG}</span>
      <button class="task-toggle${task.done ? " is-on" : ""}" type="button" role="switch" aria-checked="${task.done ? "true" : "false"}" aria-label="Marcar como concluído"></button>
      <span class="task-item__text">${escapeHtml(task.title)}</span>
      <div class="task-item__actions">
        <button class="task-item__icon-btn task-item__edit" type="button" aria-label="Editar tarefa">${ICON_EDIT}</button>
        <button class="task-item__icon-btn task-item__icon-btn--delete task-item__delete" type="button" aria-label="Remover tarefa">${ICON_TRASH}</button>
      </div>
    `;
    dayTaskList.appendChild(li);
  });
}

/* ─── Day-menu "planned ahead" badge ───────────────────── */
function setMonthCellPlanned(dateISO, isPlanned) {
  if (isPlanned) plannedDaysCache.add(dateISO);
  else plannedDaysCache.delete(dateISO);
  const cell = monthGrid?.querySelector(`.month-cell[data-date="${dateISO}"]`);
  if (!cell) return;
  let icon = cell.querySelector(".month-cell__planned");
  if (isPlanned && !icon) {
    icon = document.createElement("img");
    icon.className = "month-cell__planned";
    icon.src = "/imagens/documento.png";
    icon.alt = "Dia planejado com antecedência";
    icon.title = "Show! Esse dia foi planejado com antecedência.";
    cell.appendChild(icon);
  } else if (!isPlanned && icon) {
    icon.remove();
  }
}

function updateDayPlannedBadge() {
  if (!dayMenuPlannedWrap || !dayMenuPlanned) return;
  const hasCompletedTask = dailyTasks.some((task) => task.done);
  dayMenuPlannedWrap.hidden = !hasCompletedTask;
  if (!hasCompletedTask) {
    dayMenuPlannedWrap.classList.remove("is-open");
    dayMenuPlanned.setAttribute("aria-expanded", "false");
  }
  if (currentDayISO) setMonthCellPlanned(currentDayISO, hasCompletedTask);
}

if (dayMenuPlannedWrap && dayMenuPlanned) {
  const closePlannedTooltip = () => {
    dayMenuPlannedWrap.classList.remove("is-open");
    dayMenuPlanned.setAttribute("aria-expanded", "false");
  };

  const openPlannedTooltip = () => {
    dayMenuPlannedWrap.classList.add("is-open");
    dayMenuPlanned.setAttribute("aria-expanded", "true");
  };

  dayMenuPlannedWrap.addEventListener("mouseenter", openPlannedTooltip);
  dayMenuPlannedWrap.addEventListener("mouseleave", closePlannedTooltip);
  dayMenuPlanned.addEventListener("focus", openPlannedTooltip);

  dayMenuPlanned.addEventListener("click", (event) => {
    event.stopPropagation();
    dayMenuPlannedWrap.classList.toggle("is-open");
    dayMenuPlanned.setAttribute(
      "aria-expanded",
      dayMenuPlannedWrap.classList.contains("is-open") ? "true" : "false"
    );
  });

  dayMenuPlanned.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      dayMenuPlanned.click();
      return;
    }
    if (event.key === "Escape") {
      closePlannedTooltip();
      dayMenuPlanned.blur();
    }
  });

  document.addEventListener("click", (event) => {
    if (!dayMenuPlannedWrap.classList.contains("is-open")) return;
    if (dayMenuPlannedWrap.contains(event.target)) return;
    closePlannedTooltip();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePlannedTooltip();
  });
}

function startEditingTask(li, task) {
  const textEl = li.querySelector(".task-item__text");
  if (!textEl) return;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "task-item__input";
  input.value = task.title;
  textEl.replaceWith(input);
  input.focus();
  input.select();

  const commit = async () => {
    const value = input.value.trim();
    if (value && value !== task.title) {
      task.title = value;
      await updateDailyTask(task.id, { title: value });
    }
    renderTaskList();
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      renderTaskList();
    }
  });
  input.addEventListener("blur", commit, { once: true });
}

if (dayTaskList) {
  dayTaskList.addEventListener("click", (event) => {
    const li = event.target.closest(".task-item");
    if (!li) return;
    const taskId = li.dataset.taskId;
    const task = dailyTasks.find((item) => item.id === taskId);
    if (!task) return;

    if (event.target.closest(".task-toggle")) {
      task.done = !task.done;
      renderTaskList();
      updateDailyTask(taskId, { done: task.done });
      return;
    }

    if (event.target.closest(".task-item__delete")) {
      dailyTasks = dailyTasks.filter((item) => item.id !== taskId);
      renderTaskList();
      deleteDailyTask(taskId);
      return;
    }

    if (event.target.closest(".task-item__edit")) {
      startEditingTask(li, task);
    }
  });

  dayTaskList.addEventListener("dragstart", (event) => {
    const li = event.target.closest(".task-item");
    if (!li || !li.dataset.taskId) return;
    li.classList.add("is-dragging");
    event.dataTransfer.setData("text/plain", li.dataset.taskId);
    event.dataTransfer.effectAllowed = "move";
  });

  dayTaskList.addEventListener("dragover", (event) => {
    const li = event.target.closest(".task-item");
    if (!li || li.classList.contains("is-dragging")) return;
    event.preventDefault();
    li.classList.add("task-drop-target");
  });

  dayTaskList.addEventListener("dragleave", (event) => {
    const li = event.target.closest(".task-item");
    if (li) li.classList.remove("task-drop-target");
  });

  dayTaskList.addEventListener("drop", (event) => {
    event.preventDefault();
    const targetLi = event.target.closest(".task-item");
    const draggingLi = dayTaskList.querySelector(".is-dragging");
    if (!targetLi || !draggingLi || targetLi === draggingLi) return;
    targetLi.classList.remove("task-drop-target");

    const fromIndex = dailyTasks.findIndex((item) => item.id === draggingLi.dataset.taskId);
    const toIndex = dailyTasks.findIndex((item) => item.id === targetLi.dataset.taskId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = dailyTasks.splice(fromIndex, 1);
    dailyTasks.splice(toIndex, 0, moved);
    renderTaskList();
    reorderDailyTasks(dailyTasks.map((item) => item.id));
  });

  dayTaskList.addEventListener("dragend", () => {
    dayTaskList.querySelectorAll(".is-dragging, .task-drop-target").forEach((el) => {
      el.classList.remove("is-dragging", "task-drop-target");
    });
  });
}

if (dayTaskAddBtn) {
  dayTaskAddBtn.addEventListener("click", () => {
    if (dayTaskList.querySelector(".task-item.is-new")) return;
    const emptyEl = dayTaskList.querySelector(".task-list__empty");
    if (emptyEl) emptyEl.remove();

    const li = document.createElement("li");
    li.className = "task-item is-new";
    li.innerHTML = `
      <span class="task-item__handle" aria-hidden="true">${ICON_DRAG}</span>
      <button class="task-toggle" type="button" disabled></button>
      <input type="text" class="task-item__input" placeholder="Nova tarefa..." />
      <div class="task-item__actions"></div>
    `;
    dayTaskList.appendChild(li);
    const input = li.querySelector("input");
    input.focus();

    const commit = async () => {
      const value = input.value.trim();
      li.remove();
      if (!value) {
        if (!dailyTasks.length) renderTaskList();
        return;
      }
      const dateISO = currentDayISO;
      const position = dailyTasks.length;
      const newTask = await createDailyTask(dateISO, value, position);
      if (newTask && currentDayISO === dateISO) {
        dailyTasks.push(newTask);
        renderTaskList();
      }
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      } else if (event.key === "Escape") {
        event.preventDefault();
        input.value = "";
        input.blur();
      }
    });
    input.addEventListener("blur", commit, { once: true });
  });
}

async function renderMonthlyReport(monthIndex, year) {
  if (!reportStats) return;
  const monthRange = getMonthRange(year, monthIndex);
  await ensureRangeScheduleCached(monthRange.startISO, monthRange.endISO);
  const stats = computeMonthlyStats(monthIndex, year);
  const monthlyRow = await getMonthlyGoalsForMonth(year, monthIndex);
  const goals = normalizeMonthlyGoals(monthlyRow) || {};
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const toGoalNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };
  const hoursPerDayGoal = toGoalNumber(goals.hoursPerDay);
  const questionsPerDayGoal = toGoalNumber(goals.questionsPerDay);
  const hoursGoal = hoursPerDayGoal ? hoursPerDayGoal * daysInMonth : null;
  const questionsGoal = questionsPerDayGoal ? questionsPerDayGoal * daysInMonth : null;
  const buildMetaValue = (valueText, goalValue, formatter) => {
    const metaText =
      goalValue && goalValue > 0 ? formatter(goalValue) : "—";
    return `${escapeHtml(valueText)} <span class="reports-menu__stat-meta">/${escapeHtml(
      metaText
    )}</span>`;
  };
  const items = [
    {
      label: "Horas totais",
      category: "tempo",
      value: formatHours(stats.totalHours),
      goalValue: hoursGoal,
      requiresGoal: true,
      valueHtml: buildMetaValue(formatHours(stats.totalHours), hoursGoal, formatHours),
    },
    {
      label: "Horas médias/dia",
      category: "tempo",
      value: formatHours(stats.avgHours),
      goalValue: hoursPerDayGoal,
      requiresGoal: true,
      valueHtml: buildMetaValue(formatHours(stats.avgHours), hoursPerDayGoal, formatHours),
    },
    {
      label: "Maior carga/dia",
      category: "tempo",
      value: formatHours(stats.maxHours),
      goalValue: hoursPerDayGoal,
      requiresGoal: true,
      valueHtml: buildMetaValue(formatHours(stats.maxHours), hoursPerDayGoal, formatHours),
    },
    {
      label: "Total de questões",
      category: "questoes",
      value: stats.totalQuestions.toString(),
      goalValue: questionsGoal,
      requiresGoal: true,
      valueHtml: buildMetaValue(stats.totalQuestions.toString(), questionsGoal, formatNumber),
    },
    {
      label: "Média de questões/dia",
      category: "questoes",
      value: formatNumber(stats.avgQuestions),
      goalValue: questionsPerDayGoal,
      requiresGoal: true,
      valueHtml: buildMetaValue(formatNumber(stats.avgQuestions), questionsPerDayGoal, formatNumber),
    },
    {
      label: "Maior questões/dia",
      category: "questoes",
      value: stats.maxQuestions.toString(),
      goalValue: questionsPerDayGoal,
      requiresGoal: true,
      valueHtml: buildMetaValue(stats.maxQuestions.toString(), questionsPerDayGoal, formatNumber),
    },
    {
      label: "Dias estudados",
      category: "progresso",
      value: stats.daysStudied.toString(),
      goalValue: daysInMonth,
      requiresGoal: true,
      valueHtml: buildMetaValue(stats.daysStudied.toString(), daysInMonth, formatNumber),
    },
    {
      label: "Maior nota — Redação",
      category: "redacao",
      value: formatNumber(stats.maxEssayScore),
      goalValue: null,
      requiresGoal: false,
    },
  ];
  const visibleItems = items.filter((item) => {
    if (!item.requiresGoal) return false;
    const goal = Number(item.goalValue);
    return Number.isFinite(goal) && goal > 0;
  });
  reportStats.innerHTML = "";
  const valueNumbers = visibleItems.map((item) => {
    const text = String(item.value || "");
    if (text.includes(":")) {
      return parseHours(text);
    }
    const numeric = Number(text.replace(",", "."));
    return Number.isFinite(numeric) ? numeric : 0;
  });
  const maxValueNoGoal = Math.max(
    0,
    ...visibleItems.map((item, index) => {
      const goal = Number(item.goalValue);
      const hasGoal = Number.isFinite(goal) && goal > 0;
      return hasGoal ? 0 : valueNumbers[index];
    })
  );
  visibleItems.forEach((item, index) => {
    const valueNumber = valueNumbers[index];
    const goal = Number(item.goalValue);
    const hasGoal = Number.isFinite(goal) && goal > 0;
    const isAchieved = hasGoal && valueNumber >= goal;
    const percent = hasGoal
      ? Math.min((valueNumber / goal) * 100, 100)
      : maxValueNoGoal > 0
        ? (valueNumber / maxValueNoGoal) * 100
        : 0;
    const card = document.createElement("div");
    card.className = `reports-menu__stat${isAchieved ? " reports-menu__stat--achieved" : ""}`;
    if (item.category) card.dataset.category = item.category;
    const valueHtml = item.valueHtml || escapeHtml(item.value);
    const achievementHtml = isAchieved
      ? `
        <button class="reports-menu__stat-achievement" type="button" aria-label="Meta concluída">
          <img src="/imagens/fire.png" alt="" aria-hidden="true" loading="lazy" decoding="async" />
        </button>
        <div class="reports-menu__stat-achievement-tooltip" role="status">
          Parabéns! Você concluiu essa meta.
        </div>
      `
      : "";
    card.innerHTML = `
      <div class="reports-menu__stat-label">${escapeHtml(item.label)}</div>
      <div class="reports-menu__stat-value">
        <span class="reports-menu__stat-value-text">${valueHtml}</span>
        ${achievementHtml}
      </div>
      <div class="reports-menu__stat-bar">
        <div class="reports-menu__stat-bar-fill" style="width:${percent.toFixed(1)}%"></div>
      </div>
    `;
    reportStats.appendChild(card);
  });
}

function computeMonthlyStats(monthIndex, year) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daily = new Map();
  let totalHours = 0;
  let totalQuestions = 0;
  let maxHours = 0;
  let maxQuestions = 0;
  let maxEssayScore = 0;

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    const weekStart = getWeekStartFromKey(key);
    if (!weekStart) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      continue;
    }
    DAYS.forEach((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      if (date.getFullYear() !== year || date.getMonth() !== monthIndex) return;
      const dayKey = date.toISOString().slice(0, 10);
      const list = parsed?.days?.[day.key] || [];
      list.forEach((item) => {
        const hours = parseHours(item?.time);
        const questions = parseQuestions(item?.notes);
        const essayScore = parseEssayScore(item?.notes);
        const subjectKey = resolveSubjectKey(item);
        totalHours += hours;
        totalQuestions += questions;
        if (subjectKey === "redacao") {
          maxEssayScore = Math.max(maxEssayScore, essayScore);
        }
        const current = daily.get(dayKey) || { hours: 0, questions: 0 };
        current.hours += hours;
        current.questions += questions;
        daily.set(dayKey, current);
      });
    });
  }

  daily.forEach((value) => {
    if (value.hours > maxHours) maxHours = value.hours;
    if (value.questions > maxQuestions) maxQuestions = value.questions;
  });

  return {
    totalHours,
    totalQuestions,
    avgHours: daysInMonth ? totalHours / daysInMonth : 0,
    avgQuestions: daysInMonth ? totalQuestions / daysInMonth : 0,
    daysStudied: daily.size,
    maxHours,
    maxQuestions,
    maxEssayScore,
  };
}

function parseHours(value) {
  const normalized = String(value || "").trim();
  const timeMatch = normalized.match(/(\d+)\s*:\s*(\d{1,2})/);
  if (timeMatch) {
    const hours = Number.parseInt(timeMatch[1], 10);
    const minutes = Number.parseInt(timeMatch[2], 10);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      return hours + Math.min(minutes, 59) / 60;
    }
  }
  const match = normalized.replace(",", ".").match(/(\d+(\.\d+)?)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

function parseQuestions(value) {
  const match = String(value || "").match(/(\d+)\s*quest/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function parseHits(value) {
  const match = String(value || "").match(/(\d+)\s*acertos/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function parseEssayScore(value) {
  const match = String(value || "").match(/nota\s*(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.0001) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1).replace(/\.0$/, "");
}

function formatHours(value) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

function getWeekStartFromKey(key) {
  const match = /^study-schedule-(\d{4}-\d{2}-\d{2})$/.exec(key || "");
  if (!match) return null;
  const date = new Date(`${match[1]}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

if (reportMenuButton && reportMenu) {
  reportMenuButton.addEventListener("click", openReportMenu);
  reportMenu.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-report-close]");
    if (closeTarget) closeReportMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reportMenu.classList.contains("is-open")) {
      closeReportMenu();
    }
  });
}

if (monthlyGoalsButton) {
  monthlyGoalsButton.addEventListener("click", openGoalsMenu);
}

const GOALS_STORAGE_KEY = "study-goals";
const MONTHLY_GOALS_CACHE = new Map();
const GOAL_FIELDS = [
  { key: "hoursPerDay", monthly: "avg_hours_per_day" },
  { key: "questionsPerDay", monthly: "avg_questions_per_day" },
];

const GOAL_INPUTS = [
  goalHoursPerDay,
  goalQuestionsPerDay,
];

function setGoalsMenuReadOnly(readOnly) {
  GOAL_INPUTS.forEach((input) => {
    if (input) input.disabled = readOnly;
  });
  if (goalsMenuSave) goalsMenuSave.hidden = readOnly;
  if (goalsMenuTitle) {
    goalsMenuTitle.textContent = readOnly ? "Metas Definidas Neste Mês" : "Definir Metas";
  }
}

function setGoalInputs(goals) {
  if (goalHoursPerDay) goalHoursPerDay.value = goals.hoursPerDay ?? "";
  if (goalQuestionsPerDay) goalQuestionsPerDay.value = goals.questionsPerDay ?? "";
}

async function loadMonthGoalsReadOnly(year, monthIndex) {
  setGoalInputs({});
  const monthlyRow = await getMonthlyGoalsForMonth(year, monthIndex);
  setGoalInputs(normalizeMonthlyGoals(monthlyRow) || {});
}

function openGoalsMenu() {
  if (!goalsMenu) return;
  if (isViewingCurrentMonth()) {
    setGoalsMenuReadOnly(false);
    loadGoals();
  } else {
    setGoalsMenuReadOnly(true);
    void loadMonthGoalsReadOnly(currentMonthDate.getFullYear(), currentMonthDate.getMonth());
  }
  goalsMenu.classList.add("is-open");
  goalsMenu.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.body.classList.add("goals-menu-open");
}

function closeGoalsMenu() {
  if (!goalsMenu) return;
  goalsMenu.classList.remove("is-open");
  goalsMenu.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  document.body.classList.remove("goals-menu-open");
}

function loadGoals() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY));
  } catch (_) {
    stored = null;
  }
  if (!stored) stored = {};
  setGoalInputs(stored);
  refreshGoalsFromSupabase();
}

function saveGoals() {
  const payload = {
    hoursPerDay: goalHoursPerDay?.value ? Number(goalHoursPerDay.value) : "",
    questionsPerDay: goalQuestionsPerDay?.value ? Number(goalQuestionsPerDay.value) : "",
  };
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(payload));
  saveGoalsToSupabase(payload);
  saveMonthlyGoalsSnapshot(payload);
}

if (goalsMenu) {
  goalsMenu.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-goals-close]");
    if (closeTarget) closeGoalsMenu();
  });
  if (goalsMenuSave) {
    goalsMenuSave.addEventListener("click", () => {
      saveGoals();
      closeGoalsMenu();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && goalsMenu.classList.contains("is-open")) {
      closeGoalsMenu();
    }
  });
}

async function refreshGoalsFromSupabase() {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;
  const { data, error } = await window.supabaseClient
    .from("cronograma_goals")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error || !data) return;
  const payload = {
    hoursPerDay: data.hours_per_day ?? "",
    questionsPerDay: data.questions_per_day ?? "",
  };
  const cached = getCachedGoals();
  const merged = { ...cached, ...payload };
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(merged));
  setGoalInputs(merged);
}

async function saveGoalsToSupabase(payload) {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;
  const toNumberOrNull = (value) =>
    value === "" || value === null || Number.isNaN(value) ? null : Number(value);
  await window.supabaseClient.from("cronograma_goals").upsert(
    {
      user_id: userId,
      hours_per_day: toNumberOrNull(payload.hoursPerDay),
      questions_per_day: toNumberOrNull(payload.questionsPerDay),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

function getMonthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getMonthRange(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return {
    startISO: formatISODateLocal(start),
    endISO: formatISODateLocal(end),
  };
}

function toNumberOrNull(value) {
  return value === "" || value === null || Number.isNaN(value) ? null : Number(value);
}

async function saveMonthlyGoalsSnapshot(payload) {
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return;
  const current = new Date();
  const { startISO } = getMonthRange(current.getFullYear(), current.getMonth());
  const monthlyRow = {
    user_id: userId,
    month_start: startISO,
    weeks_count: 1,
    updated_at: new Date().toISOString(),
  };
  GOAL_FIELDS.forEach((field) => {
    monthlyRow[field.monthly] = toNumberOrNull(payload[field.key]);
  });
  await window.supabaseClient
    .from("cronograma_goals_monthly")
    .upsert(monthlyRow, { onConflict: "user_id,month_start" });
  MONTHLY_GOALS_CACHE.set(getMonthKey(current.getFullYear(), current.getMonth()), monthlyRow);
}

async function getMonthlyGoalsForMonth(year, monthIndex) {
  const cacheKey = getMonthKey(year, monthIndex);
  if (MONTHLY_GOALS_CACHE.has(cacheKey)) {
    return MONTHLY_GOALS_CACHE.get(cacheKey);
  }
  const userId = await getUserId();
  if (!userId || !window.supabaseClient) return null;
  const { startISO } = getMonthRange(year, monthIndex);
  const { data, error } = await window.supabaseClient
    .from("cronograma_goals_monthly")
    .select("*")
    .eq("user_id", userId)
    .eq("month_start", startISO)
    .single();
  if (error || !data) return null;
  MONTHLY_GOALS_CACHE.set(cacheKey, data);
  return data;
}

function normalizeMonthlyGoals(monthlyRow) {
  if (!monthlyRow) return null;
  const normalized = {};
  GOAL_FIELDS.forEach((field) => {
    normalized[field.key] = monthlyRow[field.monthly] ?? "";
  });
  return normalized;
}

function ensureSlotIndexes(currentSchedule) {
  if (!currentSchedule?.days) return;
  Object.keys(currentSchedule.days).forEach((dayKey) => {
    const items = currentSchedule.days[dayKey] || [];
    const used = new Set();
    items.forEach((item, index) => {
      if (!Number.isFinite(item.slotIndex) || used.has(item.slotIndex)) {
        let candidate = index;
        while (used.has(candidate)) candidate += 1;
        item.slotIndex = candidate;
      }
      used.add(item.slotIndex);
    });
  });
}

function handleDragStart(event, card) {
  const entry = event.target.closest(".entry");
  if (!entry || entry.classList.contains("entry-placeholder")) return;
  const dayKey = card.dataset.day;
  if (!dayKey) return;
  entry.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify({ id: entry.dataset.entryId, fromDay: dayKey })
  );
}

function handleDragOver(event, card) {
  if (!event.dataTransfer.types.includes("text/plain")) return;
  event.preventDefault();
  clearDropTargets(card);
  const entries = Array.from(card.querySelectorAll(".entry"));
  const entriesEl = card.querySelector(".entries");
  if (!entriesEl) return;
  const dropIndex = getDropIndexFromPointer(entriesEl, event.clientY, entries.length);
  const target = entries[dropIndex] || entries[entries.length - 1];
  if (target) target.classList.add("entry-drop-target");
}

function handleDrop(event, card) {
  if (!event.dataTransfer.types.includes("text/plain")) return;
  event.preventDefault();
  const payload = event.dataTransfer.getData("text/plain");
  if (!payload) return;
  const data = JSON.parse(payload);
  const toDay = card.dataset.day;
  if (!toDay || !data?.id || !data?.fromDay) return;

  const fromItems = schedule.days[data.fromDay] || [];
  const draggedIndex = fromItems.findIndex((item) => item.id === data.id);
  if (draggedIndex === -1) return;
  const [draggedItem] = fromItems.splice(draggedIndex, 1);

  const toItems = schedule.days[toDay] || [];
  const entriesEl = card.querySelector(".entries");
  if (!entriesEl) return;
  const entries = Array.from(entriesEl.querySelectorAll(".entry"));
  const dropIndex = getDropIndexFromPointer(entriesEl, event.clientY, entries.length);
  const target = entries[Math.min(dropIndex, entries.length - 1)];
  const targetSlot = target?.dataset?.slotIndex ? Number(target.dataset.slotIndex) : null;
  if (Number.isFinite(targetSlot)) {
    const targetItem = toItems.find((item) => item.slotIndex === targetSlot);
    if (targetItem) {
      if (toDay === data.fromDay) {
        const originalSlot = draggedItem.slotIndex;
        draggedItem.slotIndex = targetSlot;
        targetItem.slotIndex = originalSlot;
      } else {
        const freeSlot = findFirstAvailableSlot(toItems);
        draggedItem.slotIndex = targetSlot;
        targetItem.slotIndex = freeSlot;
      }
    } else {
      draggedItem.slotIndex = targetSlot;
    }
  }
  toItems.push(draggedItem);
  schedule.days[data.fromDay] = fromItems;
  schedule.days[toDay] = toItems;
  persistSchedule("Bloco movido");
  renderAll();
  clearAllDropTargets();
}

function handleDragEnd(event) {
  const entry = event.target.closest(".entry");
  if (entry) entry.classList.remove("is-dragging");
  clearAllDropTargets();
}

function clearDropTargets(card) {
  const entries = card.querySelectorAll(".entry-drop-target");
  entries.forEach((item) => item.classList.remove("entry-drop-target"));
}

function clearAllDropTargets() {
  dayCards.forEach((card) => clearDropTargets(card));
}

function handleDragLeave(event, card) {
  const related = event.relatedTarget;
  if (related && card.contains(related)) return;
  clearDropTargets(card);
}

function findFirstAvailableSlot(items) {
  const used = new Set(items.map((item) => item.slotIndex).filter(Number.isFinite));
  let candidate = 0;
  while (used.has(candidate)) candidate += 1;
  return candidate;
}

function getDropIndexFromPointer(entriesEl, mouseY, itemCount) {
  const rect = entriesEl.getBoundingClientRect();
  const rowValue = window.getComputedStyle(entriesEl).getPropertyValue("grid-auto-rows");
  const rowHeight = Number.parseFloat(rowValue) || 110;
  const offsetY = Math.max(0, mouseY - rect.top);
  const index = Math.floor(offsetY / rowHeight);
  return Math.min(index, itemCount);
}

function updateDaySummary(card, items) {
  const totalHours = items.reduce((sum, item) => sum + parseHours(item?.time), 0);
  const totalQuestions = items.reduce((sum, item) => sum + parseQuestions(item?.notes), 0);
  const summary = card.querySelector(".day-summary") || createDaySummary(card);
  const hoursValue = summary.querySelector("[data-summary-hours]");
  const questionsValue = summary.querySelector("[data-summary-questions]");
  if (hoursValue) hoursValue.textContent = formatHours(totalHours);
  if (questionsValue) questionsValue.textContent = totalQuestions.toString();
  updateDayGoalBadge(summary, totalHours, totalQuestions);
}

function createDaySummary(card) {
  const wrapper = document.createElement("div");
  wrapper.className = "day-summary";
  wrapper.innerHTML = `
    <div class="day-summary__badge">
      <span class="day-summary__item" data-summary-questions>0</span>
      <span class="day-summary__label">questões</span>
      <span class="day-summary__divider"></span>
      <span class="day-summary__item" data-summary-hours>0:00</span>
      <span class="day-summary__label">horas</span>
    </div>
    <div class="day-summary__fire-wrap">
      <img class="day-summary__fire" src="/imagens/fire.png" alt="Meta atingida" role="button" tabindex="0" aria-expanded="false" />
      <div class="day-summary__tooltip" role="status" aria-live="polite">
        Parabéns, você concluiu as metas do dia!
      </div>
    </div>
  `;
  const addButton = card.querySelector(".add-slot-btn");
  if (addButton) {
    addButton.insertAdjacentElement("afterend", wrapper);
  } else {
    card.appendChild(wrapper);
  }
  setupDayGoalBadgeInteractions(wrapper);
  return wrapper;
}

function updateDayGoalBadge(summary, totalHours, totalQuestions) {
  const fire = summary.querySelector(".day-summary__fire");
  const fireWrap = summary.querySelector(".day-summary__fire-wrap");
  if (!fire || !fireWrap) return;
  const goals = getCachedGoals();
  const hoursGoal = Number.isFinite(goals.hoursPerDay) ? goals.hoursPerDay : null;
  const questionsGoal = Number.isFinite(goals.questionsPerDay) ? goals.questionsPerDay : null;
  const hoursOk = hoursGoal !== null ? totalHours >= hoursGoal : false;
  const questionsOk = questionsGoal !== null ? totalQuestions >= questionsGoal : false;
  const visible = hoursOk && questionsOk;
  fire.classList.toggle("is-visible", visible);
  if (!visible) {
    fireWrap.classList.remove("is-open");
    fire.setAttribute("aria-expanded", "false");
  }
}

function setupDayGoalBadgeInteractions(summary) {
  const fireWrap = summary.querySelector(".day-summary__fire-wrap");
  const fire = summary.querySelector(".day-summary__fire");
  if (!fireWrap || !fire || fireWrap.dataset.bound === "true") return;
  fireWrap.dataset.bound = "true";

  const closeTooltip = () => {
    fireWrap.classList.remove("is-open");
    fire.setAttribute("aria-expanded", "false");
  };

  const openTooltip = () => {
    if (!fire.classList.contains("is-visible")) return;
    fireWrap.classList.add("is-open");
    fire.setAttribute("aria-expanded", "true");
  };

  fireWrap.addEventListener("mouseenter", openTooltip);
  fireWrap.addEventListener("mouseleave", closeTooltip);
  fire.addEventListener("focus", openTooltip);

  fire.addEventListener("click", (event) => {
    if (!fire.classList.contains("is-visible")) return;
    event.stopPropagation();
    fireWrap.classList.toggle("is-open");
    fire.setAttribute("aria-expanded", fireWrap.classList.contains("is-open") ? "true" : "false");
  });

  fire.addEventListener("keydown", (event) => {
    if (!fire.classList.contains("is-visible")) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fire.click();
      return;
    }
    if (event.key === "Escape") {
      closeTooltip();
      fire.blur();
    }
  });

  document.addEventListener("click", (event) => {
    if (!fireWrap.classList.contains("is-open")) return;
    if (fireWrap.contains(event.target)) return;
    closeTooltip();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTooltip();
    }
  });
}

function getCachedGoals() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY));
  } catch (_) {
    stored = null;
  }
  return stored || {};
}

function formatTopicForDisplay(text) {
  const value = (text || "").trim();
  if (value.length <= 14) return { html: escapeHtml(value), isMultiLine: false };
  const words = value.split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  let firstLine = "";
  let index = 0;
  while (index < words.length) {
    const word = words[index];
    const candidate = firstLine ? `${firstLine} ${word}` : word;
    if (candidate.length > 14) break;
    firstLine = candidate;
    index += 1;
  }
  if (!firstLine) {
    const head = value.slice(0, 14);
    const tail = value.slice(14).trim();
    if (!tail) return { html: escapeHtml(head), isMultiLine: false };
    return { html: `${escapeHtml(head)}<br>${escapeHtml(tail)}`, isMultiLine: true };
  }
  const rest = words.slice(index).join(" ");
  if (!rest) return { html: escapeHtml(firstLine), isMultiLine: false };
  return { html: `${escapeHtml(firstLine)}<br>${escapeHtml(rest)}`, isMultiLine: true };
}

function formatNotesForDisplay(text) {
  const value = (text || "").trim();
  if (!value) return "";
  const parts = value.split("•").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return escapeHtml(value);
  return parts.map((part) => escapeHtml(part)).join("<br>");
}

function buildNotes(subjectLabel, questionsNumber, hitsNumber, essayScore) {
  const subjectKey = normalizeLabel(subjectLabel);
  const notesParts = [subjectLabel];
  const questions = questionsNumber > 0 ? `${questionsNumber} questões` : "";
  const essay = essayScore > 0 ? `Nota ${essayScore}` : "";
  if (subjectKey === "redacao") {
    if (essay) notesParts.push(essay);
  } else if (questions) {
    notesParts.push(questions);
  }
  return notesParts.join(" • ");
}

function resolveSubjectKey(item) {
  const notes = item?.notes ? String(item.notes) : "";
  const label = notes.split("•")[0]?.trim();
  const normalized = normalizeLabel(label);
  const map = {
    matematica: "matematica",
    fisica: "fisica",
    biologia: "biologia",
    quimica: "quimica",
    historia: "historia",
    geografia: "geografia",
    sociologia: "sociologia",
    filosofia: "filosofia",
    portugues: "linguagens",
    linguagens: "linguagens",
    literatura: "linguagens",
    artes: "linguagens",
    ingles: "ingles",
    redacao: "redacao",
    simulado: "simulado",
  };
  return map[normalized] || "matematica";
}

function normalizeLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toTitleCase(text) {
  const lowerWords = new Set([
    "a",
    "ao",
    "aos",
    "as",
    "com",
    "da",
    "das",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "na",
    "nas",
    "no",
    "nos",
    "ou",
    "para",
    "por",
    "sem",
    "sob",
    "sobre",
  ]);
  const words = String(text || "").split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && lowerWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function getWeekRange(date) {
  const dayIndex = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayIndex);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startISO: formatISODateLocal(monday),
    endISO: formatISODateLocal(sunday),
    startLabel: formatDate(monday),
    endLabel: formatDate(sunday),
  };
}

function formatISODateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ensureUuid(value) {
  const text = String(value || "");
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(text)) return text;
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function formatDate(date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
