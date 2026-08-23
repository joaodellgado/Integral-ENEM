(function () {
  const KEY = "mm_duvidas_tickets_v1";
  const MAX_TICKET_IMAGES = 5;
  const MODAL_FX_MS = 190;
  const VIEW_FX_MS = 220;

  const SUBJECTS = [
    "Matemática",
    "Português",
    "Redação",
    "Física",
    "Química",
    "Biologia",
    "História",
    "Geografia",
    "Filosofia",
    "Sociologia",
    "Inglês",
    "Espanhol",
  ];

  const STATUS_LABEL = {
    aberto: "Aberto",
    respondido: "Respondido",
    resolvido: "Resolvido",
  };

  const state = {
    userId: "anonymous",
    tickets: [],
    activeTicketId: "",
    viewMode: "board",
    currentPage: 1,
    pageSize: 7,
    draftImages: [],
    isPickingImages: false,
    ticketViewFxTimer: null,
    modalFxTimer: null,
    filters: {
      search: "",
      status: "all",
      subject: "all",
    },
  };
  const customSelectState = new Map();

  const elements = {
    openFormBtn: document.getElementById("open-ticket-form-btn"),
    hero: document.getElementById("duvidas-hero"),
    closeFormBtn: document.getElementById("close-ticket-form-btn"),
    modal: document.getElementById("ticket-form-modal"),
    ticketForm: document.getElementById("ticket-form"),
    titleInput: document.getElementById("ticket-title"),
    subjectInput: document.getElementById("ticket-subject"),
    descriptionInput: document.getElementById("ticket-description"),
    ticketImagesInput: document.getElementById("ticket-images-input"),
    ticketImagesBtn: document.getElementById("ticket-images-btn"),
    ticketImagesHint: document.getElementById("ticket-images-hint"),
    ticketImagesList: document.getElementById("ticket-images-list"),
    searchInput: document.getElementById("ticket-search"),
    statusFilter: document.getElementById("status-filter"),
    subjectFilter: document.getElementById("subject-filter"),
    boardGrid: document.getElementById("duvidas-grid"),
    ticketOpenView: document.getElementById("ticket-open-view"),
    ticketBackBtn: document.getElementById("ticket-back-btn"),
    list: document.getElementById("tickets-list"),
    pagination: document.getElementById("tickets-pagination"),
    listEmpty: document.getElementById("tickets-empty"),
    ticketsCount: document.getElementById("tickets-count"),
    statOpen: document.getElementById("stat-open"),
    statAnswered: document.getElementById("stat-answered"),
    statResolved: document.getElementById("stat-resolved"),
    openViewStatus: document.getElementById("open-view-status"),
    openViewSubject: document.getElementById("open-view-subject"),
    openViewTitle: document.getElementById("open-view-title"),
    openViewMeta: document.getElementById("open-view-meta"),
    openViewMessage: document.getElementById("open-view-message"),
    openViewImages: document.getElementById("open-view-images"),
  };

  function uid(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 9)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function formatDate(value) {
    const parsed = Date.parse(String(value || ""));
    if (!Number.isFinite(parsed)) return "data inválida";
    return new Date(parsed).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRelativeAge(value) {
    const parsed = Date.parse(String(value || ""));
    if (!Number.isFinite(parsed)) return "há pouco";
    const diffMs = Math.max(0, Date.now() - parsed);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    if (diffMs < hour) {
      const mins = Math.max(1, Math.floor(diffMs / minute));
      return `há ${mins} min`;
    }
    if (diffMs < day) {
      const hours = Math.max(1, Math.floor(diffMs / hour));
      return `há ${hours} h`;
    }
    if (diffMs < week) {
      const days = Math.max(1, Math.floor(diffMs / day));
      return `há ${days} dia${days > 1 ? "s" : ""}`;
    }
    const weeks = Math.max(1, Math.floor(diffMs / week));
    return `há ${weeks} semana${weeks > 1 ? "s" : ""}`;
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function renderDraftImages() {
    if (!elements.ticketImagesHint || !elements.ticketImagesList) return;
    const count = state.draftImages.length;
    elements.ticketImagesHint.textContent =
      count > 0
        ? `${count}/${MAX_TICKET_IMAGES} imagem(ns) selecionada(s)`
        : "Nenhuma imagem selecionada.";

    elements.ticketImagesList.innerHTML = "";
    state.draftImages.forEach((image, index) => {
      const item = document.createElement("li");
      item.className = "ticket-image-item";
      item.innerHTML = `
        <span class="ticket-image-name">${escapeHtml(image.name)}</span>
        <span class="ticket-image-size">${formatBytes(image.size)}</span>
        <button type="button" class="ticket-image-remove-btn" data-index="${index}" aria-label="Remover imagem">×</button>
      `;
      elements.ticketImagesList.appendChild(item);
    });
  }

  function resetDraftImages() {
    state.draftImages = [];
    if (elements.ticketImagesInput) elements.ticketImagesInput.value = "";
    renderDraftImages();
  }

  function closeAllCustomSelects(exceptSelectId = "") {
    customSelectState.forEach((entry, selectId) => {
      if (exceptSelectId && selectId === exceptSelectId) return;
      entry.root.classList.remove("is-open");
      entry.trigger.setAttribute("aria-expanded", "false");
    });
  }

  function updateCustomSelectUI(selectEl) {
    if (!(selectEl instanceof HTMLSelectElement)) return;
    const key = String(selectEl.id || "");
    const entry = customSelectState.get(key);
    if (!entry) return;

    const selectedText = selectEl.options[selectEl.selectedIndex]?.textContent || "Selecionar";
    entry.trigger.textContent = selectedText;
    entry.menu.innerHTML = "";

    Array.from(selectEl.options).forEach((option) => {
      const optionBtn = document.createElement("button");
      optionBtn.type = "button";
      optionBtn.className = `custom-select-option${selectEl.value === option.value ? " is-selected" : ""}`;
      optionBtn.dataset.value = option.value;
      optionBtn.textContent = option.textContent || option.value;
      entry.menu.appendChild(optionBtn);
    });
  }

  function ensureCustomSelect(selectEl) {
    if (!(selectEl instanceof HTMLSelectElement)) return;
    const selectId = String(selectEl.id || "");
    if (!selectId) return;
    if (customSelectState.has(selectId)) {
      updateCustomSelectUI(selectEl);
      return;
    }

    selectEl.classList.add("native-select-hidden");
    selectEl.setAttribute("tabindex", "-1");
    selectEl.setAttribute("aria-hidden", "true");

    const root = document.createElement("div");
    root.className = "custom-select";
    root.dataset.source = selectId;
    root.innerHTML = `
      <button type="button" class="custom-select-trigger" aria-haspopup="listbox" aria-expanded="false"></button>
      <div class="custom-select-menu" role="listbox"></div>
    `;
    selectEl.insertAdjacentElement("afterend", root);

    const trigger = root.querySelector(".custom-select-trigger");
    const menu = root.querySelector(".custom-select-menu");
    if (!(trigger instanceof HTMLButtonElement) || !(menu instanceof HTMLDivElement)) return;

    customSelectState.set(selectId, { root, trigger, menu, selectEl });
    updateCustomSelectUI(selectEl);

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const willOpen = !root.classList.contains("is-open");
      closeAllCustomSelects(willOpen ? selectId : "");
      root.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    menu.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const optionBtn = target.closest(".custom-select-option");
      if (!(optionBtn instanceof HTMLButtonElement)) return;
      const value = optionBtn.dataset.value ?? "";
      if (selectEl.value !== value) {
        selectEl.value = value;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      }
      closeAllCustomSelects();
      updateCustomSelectUI(selectEl);
    });

    selectEl.addEventListener("change", () => {
      updateCustomSelectUI(selectEl);
    });
  }

  function initCustomSelects() {
    document.querySelectorAll("select").forEach((selectEl) => {
      ensureCustomSelect(selectEl);
    });
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest(".custom-select")) return;
      closeAllCustomSelects();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllCustomSelects();
    });
  }

  function refreshCustomSelect(selectEl) {
    if (!(selectEl instanceof HTMLSelectElement)) return;
    ensureCustomSelect(selectEl);
    updateCustomSelectUI(selectEl);
  }

  function readStore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { tickets: [] };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { tickets: [] };
      return {
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
      };
    } catch (_) {
      return { tickets: [] };
    }
  }

  function getCurrentUserId() {
    const fromSupabase = window.supabaseClient?.auth?.getUser;
    if (typeof fromSupabase !== "function") return Promise.resolve("anonymous");
    return fromSupabase()
      .then(({ data }) => String(data?.user?.id || "anonymous"))
      .catch(() => "anonymous");
  }

  function normalizeTicket(ticket) {
    const subject = String(ticket?.subject || "Outros");
    const status = ["aberto", "respondido", "resolvido"].includes(ticket?.status) ? ticket.status : "aberto";
    return {
      id: String(ticket?.id || uid("ticket")),
      userId: String(ticket?.userId || "anonymous"),
      title: String(ticket?.title || "Sem título"),
      description: String(ticket?.description || "").trim(),
      subject,
      status,
      createdAt: ticket?.createdAt || nowIso(),
      updatedAt: ticket?.updatedAt || ticket?.createdAt || nowIso(),
      images: Array.isArray(ticket?.images)
        ? ticket.images
            .filter(Boolean)
            .map((image) => ({
              name: String(image?.name || "imagem"),
              size: Number(image?.size) || 0,
              type: String(image?.type || "image/*"),
            }))
        : [],
      notes: Array.isArray(ticket?.notes)
        ? ticket.notes
            .filter(Boolean)
            .map((note) => ({
              id: String(note?.id || uid("note")),
              body: String(note?.body || "").trim(),
              createdAt: note?.createdAt || nowIso(),
            }))
            .filter((note) => note.body)
        : [],
    };
  }

  function loadTicketsForUser() {
    const all = readStore().tickets.map(normalizeTicket);
    state.tickets = all
      .filter((ticket) => String(ticket.userId || "anonymous") === state.userId)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  function buildSubjectsFilterOptions() {
    const subjects = new Set([...SUBJECTS, ...state.tickets.map((ticket) => ticket.subject).filter(Boolean)]);
    const selected = elements.subjectFilter.value || "all";
    elements.subjectFilter.innerHTML = `<option value="all">Todas</option>${[...subjects]
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`)
      .join("")}`;
    if (["all", ...subjects].includes(selected)) {
      elements.subjectFilter.value = selected;
    }
    refreshCustomSelect(elements.subjectFilter);
  }

  function persistTickets() {
    const store = readStore();
    const otherUsers = store.tickets
      .map(normalizeTicket)
      .filter((ticket) => String(ticket.userId || "anonymous") !== state.userId);
    state.tickets = state.tickets.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    store.tickets = [...otherUsers, ...state.tickets];
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (_) {
      window.alert("Falha ao salvar tickets localmente. Libere espaço no navegador e tente novamente.");
    }
  }

  function filteredTickets() {
    const search = state.filters.search.trim().toLocaleLowerCase("pt-BR");
    return state.tickets.filter((ticket) => {
      if (state.filters.status !== "all" && ticket.status !== state.filters.status) return false;
      if (state.filters.subject !== "all" && ticket.subject !== state.filters.subject) return false;
      if (!search) return true;
      const text = [
        ticket.title,
        ticket.subject,
        ticket.description,
        ...ticket.notes.map((note) => note.body),
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return text.includes(search);
    });
  }

  function paginateTickets(items) {
    const list = Array.isArray(items) ? items : [];
    const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
    const safePage = Math.min(Math.max(1, state.currentPage), totalPages);
    state.currentPage = safePage;
    const start = (safePage - 1) * state.pageSize;
    const pageItems = list.slice(start, start + state.pageSize);
    return { pageItems, totalPages, currentPage: safePage, totalItems: list.length };
  }

  function renderPagination(totalItems, totalPages, currentPage) {
    if (!elements.pagination) return;
    if (totalItems <= state.pageSize) {
      elements.pagination.hidden = true;
      elements.pagination.innerHTML = "";
      return;
    }
    elements.pagination.hidden = false;
    let html = "";
    html += `<button type="button" class="pagination-btn pagination-nav" data-page="${currentPage - 1}" ${
      currentPage <= 1 ? "disabled" : ""
    }>Anterior</button>`;
    for (let page = 1; page <= totalPages; page += 1) {
      html += `<button type="button" class="pagination-btn${page === currentPage ? " is-active" : ""}" data-page="${page}">${page}</button>`;
    }
    html += `<button type="button" class="pagination-btn pagination-nav" data-page="${currentPage + 1}" ${
      currentPage >= totalPages ? "disabled" : ""
    }>Próxima</button>`;
    elements.pagination.innerHTML = html;
  }

  function renderStats() {
    const openCount = state.tickets.filter((ticket) => ticket.status === "aberto").length;
    const answeredCount = state.tickets.filter((ticket) => ticket.status === "respondido").length;
    const resolvedCount = state.tickets.filter((ticket) => ticket.status === "resolvido").length;
    elements.statOpen.textContent = String(openCount);
    elements.statAnswered.textContent = String(answeredCount);
    elements.statResolved.textContent = String(resolvedCount);
  }

  function renderList() {
    const items = filteredTickets();
    const { pageItems, totalPages, currentPage, totalItems } = paginateTickets(items);
    elements.ticketsCount.textContent = `${totalItems} ticket(s)`;
    elements.list.innerHTML = "";

    if (!totalItems) {
      elements.listEmpty.hidden = false;
      renderPagination(0, 1, 1);
      return;
    }

    elements.listEmpty.hidden = true;
    const fragment = document.createDocumentFragment();

    pageItems.forEach((ticket) => {
      const card = document.createElement("article");
      card.className = `ticket-card${ticket.id === state.activeTicketId ? " is-active" : ""}`;
      card.dataset.status = ticket.status;
      card.dataset.id = ticket.id;
      const descriptionPreview = ticket.description.slice(0, 320);
      const statusLabel = STATUS_LABEL[ticket.status] || "Aberto";
      card.innerHTML = `
        <div class="ticket-card-head">
          <span class="ticket-tag ticket-tag--subject">${escapeHtml(ticket.subject)}</span>
          <span class="ticket-tag ticket-tag--status status-${ticket.status}">${escapeHtml(statusLabel)}</span>
        </div>
        <h3>${escapeHtml(ticket.title)}</h3>
        <p class="ticket-card-subtitle">${escapeHtml(descriptionPreview)}${ticket.description.length > 320 ? "..." : ""}</p>
        <button type="button" class="ticket-access-btn">Acessar Ticket <span aria-hidden="true">→</span></button>
        <div class="ticket-card-footer">
          <p class="ticket-time">◷ ${formatRelativeAge(ticket.updatedAt || ticket.createdAt)}</p>
        </div>
      `;
      const openTicket = () => {
        state.activeTicketId = ticket.id;
        state.viewMode = "ticket";
        renderAll();
      };
      card.addEventListener("click", () => {
        openTicket();
      });
      card.querySelector(".ticket-access-btn")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openTicket();
      });
      fragment.appendChild(card);
    });

    elements.list.appendChild(fragment);
    renderPagination(totalItems, totalPages, currentPage);
  }

  function renderTicketOpenView() {
    const ticket = state.tickets.find((item) => item.id === state.activeTicketId) || null;
    if (!ticket) state.viewMode = "board";

    if (elements.hero) elements.hero.hidden = state.viewMode === "ticket";
    elements.boardGrid.hidden = state.viewMode !== "board";

    if (state.viewMode === "ticket" && ticket) {
      if (elements.ticketOpenView.hidden) {
        elements.ticketOpenView.hidden = false;
        elements.ticketOpenView.classList.remove("is-closing");
        void elements.ticketOpenView.offsetWidth;
        elements.ticketOpenView.classList.add("is-opening");
        if (state.ticketViewFxTimer) window.clearTimeout(state.ticketViewFxTimer);
        state.ticketViewFxTimer = window.setTimeout(() => {
          elements.ticketOpenView.classList.remove("is-opening");
        }, VIEW_FX_MS);
      }
    } else if (!elements.ticketOpenView.hidden) {
      elements.ticketOpenView.classList.remove("is-opening");
      elements.ticketOpenView.classList.add("is-closing");
      if (state.ticketViewFxTimer) window.clearTimeout(state.ticketViewFxTimer);
      state.ticketViewFxTimer = window.setTimeout(() => {
        elements.ticketOpenView.hidden = true;
        elements.ticketOpenView.classList.remove("is-closing");
      }, VIEW_FX_MS);
    }
    if (state.viewMode !== "ticket" || !ticket) return;

    elements.openViewStatus.textContent = STATUS_LABEL[ticket.status] || "Aberto";
    elements.openViewStatus.className = `ticket-open-badge is-status status-${ticket.status}`;
    elements.openViewSubject.textContent = ticket.subject;
    elements.openViewTitle.textContent = ticket.title;
    elements.openViewMeta.textContent = `Criado em ${formatDate(ticket.createdAt)} · Atualizado em ${formatDate(ticket.updatedAt)}${
      ticket.images.length ? ` · ${ticket.images.length} imagem(ns)` : ""
    }`;
    elements.openViewMessage.textContent = ticket.description;
    if (elements.openViewImages) {
      elements.openViewImages.innerHTML = "";
      if (ticket.images.length) {
        elements.openViewImages.hidden = false;
        ticket.images.forEach((image) => {
          const item = document.createElement("li");
          item.className = "ticket-open-image-item";
          item.textContent = `${image.name} (${formatBytes(image.size)})`;
          elements.openViewImages.appendChild(item);
        });
      } else {
        elements.openViewImages.hidden = true;
      }
    }

  }

  function renderAll() {
    buildSubjectsFilterOptions();
    renderStats();
    renderList();
    renderTicketOpenView();
  }

  function openModal() {
    if (typeof elements.modal.showModal === "function") {
      elements.modal.showModal();
      elements.modal.classList.remove("is-closing");
      void elements.modal.offsetWidth;
      elements.modal.classList.add("is-opening");
      if (state.modalFxTimer) window.clearTimeout(state.modalFxTimer);
      state.modalFxTimer = window.setTimeout(() => {
        elements.modal.classList.remove("is-opening");
      }, MODAL_FX_MS);
      return;
    }
    elements.modal.setAttribute("open", "open");
  }

  function closeModal() {
    if (elements.modal.classList.contains("is-closing")) return;
    if (typeof elements.modal.close === "function") {
      elements.modal.classList.remove("is-opening");
      elements.modal.classList.add("is-closing");
      if (state.modalFxTimer) window.clearTimeout(state.modalFxTimer);
      state.modalFxTimer = window.setTimeout(() => {
        elements.modal.close();
        elements.modal.classList.remove("is-closing");
        resetDraftImages();
      }, MODAL_FX_MS);
      return;
    }
    elements.modal.removeAttribute("open");
    resetDraftImages();
  }

  function createTicket(payload) {
    const ticket = normalizeTicket({
      id: uid("ticket"),
      userId: state.userId,
      title: payload.title,
      description: payload.description,
      subject: payload.subject,
      status: "aberto",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      images: Array.isArray(payload.images) ? payload.images : [],
      notes: [],
    });
    state.tickets.unshift(ticket);
    state.activeTicketId = "";
    state.viewMode = "board";
    state.currentPage = 1;
    persistTickets();
    renderAll();
  }

  function bindEvents() {
    elements.openFormBtn.addEventListener("click", openModal);
    elements.closeFormBtn.addEventListener("click", closeModal);

    elements.ticketForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = elements.titleInput.value.trim();
      const subject = elements.subjectInput.value.trim();
      const description = elements.descriptionInput.value.trim();
      if (!title || !subject || !description) return;
      createTicket({
        title,
        subject,
        description,
        images: state.draftImages.map((image) => ({
          name: image.name,
          size: image.size,
          type: image.type,
        })),
      });
      elements.ticketForm.reset();
      refreshCustomSelect(elements.subjectInput);
      resetDraftImages();
      closeModal();
    });

    elements.modal?.addEventListener("cancel", (event) => {
      if (state.isPickingImages) {
        event.preventDefault();
        return;
      }
      if (event.target !== elements.modal) return;
      event.preventDefault();
      closeModal();
    });

    elements.ticketImagesBtn?.addEventListener("click", () => {
      state.isPickingImages = true;
      elements.ticketImagesInput?.click();
    });

    elements.ticketImagesInput?.addEventListener("cancel", (event) => {
      state.isPickingImages = false;
      event.stopPropagation();
    });

    elements.ticketImagesInput?.addEventListener("change", () => {
      state.isPickingImages = false;
      const selected = Array.from(elements.ticketImagesInput?.files || []).filter(
        (file) => String(file.type || "").startsWith("image/"),
      );
      if (!selected.length) return;
      const slotsLeft = MAX_TICKET_IMAGES - state.draftImages.length;
      if (slotsLeft <= 0) {
        window.alert(`Limite de ${MAX_TICKET_IMAGES} imagens por ticket.`);
        elements.ticketImagesInput.value = "";
        return;
      }
      const accepted = selected.slice(0, slotsLeft).map((file) => ({
        name: String(file.name || "imagem"),
        size: Number(file.size) || 0,
        type: String(file.type || "image/*"),
      }));
      state.draftImages = [...state.draftImages, ...accepted];
      if (selected.length > slotsLeft) {
        window.alert(`Apenas ${MAX_TICKET_IMAGES} imagens são permitidas por ticket.`);
      }
      elements.ticketImagesInput.value = "";
      renderDraftImages();
    });

    elements.ticketImagesList?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest(".ticket-image-remove-btn");
      if (!(btn instanceof HTMLButtonElement)) return;
      const index = Number.parseInt(btn.dataset.index || "", 10);
      if (!Number.isFinite(index) || index < 0) return;
      state.draftImages.splice(index, 1);
      renderDraftImages();
    });

    elements.searchInput.addEventListener("input", () => {
      state.filters.search = elements.searchInput.value;
      state.currentPage = 1;
      renderAll();
    });

    elements.statusFilter.addEventListener("change", () => {
      state.filters.status = elements.statusFilter.value;
      state.currentPage = 1;
      renderAll();
    });

    elements.subjectFilter.addEventListener("change", () => {
      state.filters.subject = elements.subjectFilter.value;
      state.currentPage = 1;
      renderAll();
    });

    elements.ticketBackBtn.addEventListener("click", () => {
      state.viewMode = "board";
      renderAll();
    });

    if (elements.pagination) {
      elements.pagination.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest(".pagination-btn");
        if (!(button instanceof HTMLButtonElement)) return;
        const nextPage = Number.parseInt(button.dataset.page || "", 10);
        if (!Number.isFinite(nextPage) || nextPage < 1) return;
        state.currentPage = nextPage;
        renderAll();
      });
    }
  }

  async function init() {
    state.userId = await getCurrentUserId();
    loadTicketsForUser();
    initCustomSelects();
    bindEvents();
    renderDraftImages();
    renderAll();
  }

  init();
})();
