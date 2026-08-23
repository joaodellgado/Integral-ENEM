(function () {
  const supabaseClient = window.supabaseClient || null;
  const adminGuardPromise = window.adminGuardPromise || Promise.resolve();
  const cache = window.profileCache || { load() { return null; } };

  const listsGrid = document.getElementById("lists-grid");
  const emptyCard = document.getElementById("lists-empty");
  const loadingCard = document.getElementById("lists-loading");
  const renameModal = document.getElementById("rename-modal");
  const renameInput = document.getElementById("rename-input");
  const renameCancelBtn = document.getElementById("rename-cancel");
  const renameConfirmBtn = document.getElementById("rename-confirm");
  const modeModal = document.getElementById("mode-modal");
  const modeMessage = document.getElementById("mode-message");
  const modeCancelBtn = document.getElementById("mode-cancel");
  const modeConfirmBtn = document.getElementById("mode-confirm");
  let pendingRename = null;
  let pendingModeToggle = null;
  let syncGatewayModulePromise = null;

  async function getSyncGateway() {
    try {
      if (!syncGatewayModulePromise) syncGatewayModulePromise = import("/dist/sync/syncGateway.js");
      const mod = await syncGatewayModulePromise;
      return mod?.syncGateway || null;
    } catch (error) {
      console.warn("[Listas] Falha ao carregar syncGateway:", error);
      return null;
    }
  }

  function setLoading(state) {
    if (loadingCard) loadingCard.style.display = state ? "block" : "none";
  }

  function setEmpty(state) {
    if (emptyCard) emptyCard.style.display = state ? "block" : "none";
    if (listsGrid) listsGrid.style.display = state ? "none" : "grid";
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  }

  function formatRelativeDays(iso) {
    if (!iso) return "Data indisp.";
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (days === 0) return "Atualizada hoje";
    if (days === 1) return "Atualizada há 1 dia";
    return `Atualizada há ${days} dias`;
  }

  function applyImageSizing(img) {
    if (!img) return;
    const update = () => {
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      const shouldBoost = w > 0 && h > 0 && w < 100 && h < 100;
      img.classList.remove("img-natural");
      img.classList.toggle("img-boost", shouldBoost);
      img.classList.toggle("img-small", !shouldBoost);
    };
    if (img.complete) {
      update();
    } else {
      img.addEventListener("load", update, { once: true });
      img.addEventListener("error", () => {
        img.classList.remove("img-natural");
        img.classList.remove("img-boost");
        img.classList.add("img-small");
      }, { once: true });
    }
  }

  function applyImageSizingToContainer(root) {
    if (!root) return;
    root.querySelectorAll("img").forEach((img) => applyImageSizing(img));
  }

  const MAX_TITLE_LENGTH = 30;

  function formatListTitle(rawTitle) {
    return rawTitle || "Sem título";
  }

  function updateListTitleElement(el, rawTitle) {
    if (!el) return;
    el.textContent = formatListTitle(rawTitle);
  }

  function openRenameModal(lista, titleEl) {
    if (!renameModal || !renameInput || !lista) return;
    pendingRename = { lista, titleEl };
    renameInput.value = (lista.titulo || "").toString();
    renameModal.classList.add("open");
    renameModal.setAttribute("aria-hidden", "false");
    setTimeout(() => renameInput.focus(), 0);
  }

  function closeRenameModal() {
    if (!renameModal) return;
    renameModal.classList.remove("open");
    renameModal.setAttribute("aria-hidden", "true");
    pendingRename = null;
  }

  async function submitRename() {
    if (!pendingRename || !supabaseClient) return;
    const { lista, titleEl } = pendingRename;
    const currentTitle = (lista.titulo || "").toString();
    const nextTitle = (renameInput?.value || "").trim();

    if (!nextTitle) {
      alert("O nome da lista não pode ficar vazio.");
      return;
    }
    if (nextTitle.length > MAX_TITLE_LENGTH) {
      alert(`O título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.`);
      return;
    }
    if (nextTitle === currentTitle) {
      closeRenameModal();
      return;
    }

    try {
      const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
      if (userErr || !user) throw new Error("unauthenticated");
      if (lista.owner_id && lista.owner_id !== user.id) throw new Error("not_owner");
      await queueDbUpsert("listas", String(lista.id), { id: lista.id, titulo: nextTitle }, user.id);
      const flush = await flushQueuedSync(10000);
      if (!flush?.ok) throw new Error("queue_flush_timeout");
    } catch (error) {
      console.error("[Listas] Erro ao renomear lista:", error);
      alert("Não foi possível renomear a lista.");
      return;
    }

    lista.titulo = nextTitle;
    const index = currentListas.findIndex((item) => item.id === lista.id);
    if (index >= 0) currentListas[index].titulo = nextTitle;
    updateListTitleElement(titleEl, nextTitle);
    closeRenameModal();
  }

  function setupRenameModal() {
    if (!renameModal) return;
    if (renameCancelBtn) {
      renameCancelBtn.addEventListener("click", closeRenameModal);
    }
    if (renameConfirmBtn) {
      renameConfirmBtn.addEventListener("click", submitRename);
    }
    renameModal.addEventListener("click", (event) => {
      if (event.target === renameModal) closeRenameModal();
    });
    document.addEventListener("keydown", (event) => {
      if (!renameModal.classList.contains("open")) return;
      if (event.key === "Escape") closeRenameModal();
      if (event.key === "Enter") submitRename();
    });
  }

  function openModeModal(lista) {
    if (!modeModal || !modeMessage || !lista) return;
    const isEnabled = !!lista.modo_lista;
    pendingModeToggle = { lista, nextValue: !isEnabled };
    modeMessage.textContent = `Atualmente o modo da lista de questões está ${isEnabled ? "ativado" : "desativado"}. Aperte "Ok" para ${isEnabled ? "desativar" : "ativar"} e "Cancelar" para voltar às suas listas de questões.`;
    modeModal.classList.add("open");
    modeModal.setAttribute("aria-hidden", "false");
  }

  function closeModeModal() {
    if (!modeModal) return;
    modeModal.classList.remove("open");
    modeModal.setAttribute("aria-hidden", "true");
    pendingModeToggle = null;
  }

  async function submitModeToggle() {
    if (!pendingModeToggle || !supabaseClient) return;
    const { lista, nextValue } = pendingModeToggle;
    try {
      const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
      if (userErr || !user) throw new Error("unauthenticated");
      if (lista.owner_id && lista.owner_id !== user.id) throw new Error("not_owner");
      await queueDbUpsert("listas", String(lista.id), { id: lista.id, modo_lista: nextValue }, user.id);
      const flush = await flushQueuedSync(10000);
      if (!flush?.ok) throw new Error("queue_flush_timeout");
    } catch (error) {
      console.error("[Listas] Erro ao alterar modo da lista:", error);
      alert("Não foi possível alterar o modo da lista.");
      return;
    }
    lista.modo_lista = nextValue;
    const index = currentListas.findIndex((item) => item.id === lista.id);
    if (index >= 0) currentListas[index].modo_lista = nextValue;
    closeModeModal();
  }

  function setupModeModal() {
    if (!modeModal) return;
    if (modeCancelBtn) {
      modeCancelBtn.addEventListener("click", closeModeModal);
    }
    if (modeConfirmBtn) {
      modeConfirmBtn.addEventListener("click", submitModeToggle);
    }
    modeModal.addEventListener("click", (event) => {
      if (event.target === modeModal) closeModeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (!modeModal.classList.contains("open")) return;
      if (event.key === "Escape") closeModeModal();
      if (event.key === "Enter") submitModeToggle();
    });
  }

  async function getDominantDifficulty(listaId) {
    if (!supabaseClient || !listaId) return "—";
    if (difficultyCache.has(listaId)) return difficultyCache.get(listaId);

    const { data, error } = await supabaseClient
      .from("lista_itens")
      .select("questao_id, questions!inner(dificuldade)")
      .eq("lista_id", listaId);

    if (error || !data) return "—";

    const counts = { facil: 0, medio: 0, dificil: 0 };
    data.forEach((row) => {
      const diff = (row.questions?.dificuldade || "").toLowerCase();
      if (diff.includes("fac")) counts.facil += 1;
      else if (diff.includes("dif")) counts.dificil += 1;
      else counts.medio += 1;
    });

    const winner =
      counts.facil >= counts.medio && counts.facil >= counts.dificil
        ? "Fácil"
        : counts.medio >= counts.dificil
        ? "Médio"
        : "Difícil";

    difficultyCache.set(listaId, winner);
    return winner;
  }

  let currentView = "mine"; // mine | recommended
  let currentFilter = "all"; // all | resolvendo | finalizadas
  let currentListas = [];
  const PAGE_SIZE = 20;
  let currentPage = 1;
  const difficultyCache = new Map();
  const headerActions = document.querySelector(".header-actions");
  const finalizacaoKey = (listaId) => `lista-finalizada-${listaId}`;
  const responderState = {
    open: false,
    lista: null,
    questoes: [],
    respostas: {},
    pendingRespostas: {},
    currentIndex: 0,
    isReadonly: false,
    view: "question",
    userId: null,
    loadToken: 0,
    lastRenderKey: null
  };
  const toggleHeaderCreateVisibility = (isVisible) => {
    if (!headerActions) return;
    headerActions.style.display = isVisible ? "flex" : "none";
  };

  const renderHeaderCreateCard = () => {
    if (!headerActions) return;
    headerActions.innerHTML = "";

    const link = document.createElement("a");
    link.className = "header-create-card";
    link.href = "/questoes/gerar-lista";
    link.innerHTML = `
      <div class="header-create-icon"><span class="header-create-icon-symbol">+</span></div>
      <div class="header-create-body">
        <span class="header-create-label">Criar lista</span>
        <span class="header-create-sub">Monte uma nova lista</span>
      </div>
    `;

    const personalBadge = document.createElement("div");
    personalBadge.className = "header-create-card header-personal-card";
    personalBadge.innerHTML = `
      <div class="header-create-body">
        <span class="header-create-label">Lista pessoal</span>
        <span class="header-create-sub">Utilize suas próprias questões</span>
      </div>
    `;

    headerActions.appendChild(personalBadge);
    headerActions.appendChild(link);
  };

  function applyFilter(listas) {
    if (currentFilter === "all") return listas;
    if (currentFilter === "resolvendo") {
      return listas.filter((l) => {
        const status = getListaStatus(l);
        return status !== "concluida" && status !== "finalizada" && status !== "desistiu";
      });
    }
    if (currentFilter === "finalizadas") {
      return listas.filter((l) => {
        const status = getListaStatus(l);
        return status === "concluida" || status === "finalizada";
      });
    }
    return listas;
  }

  function renderLists(listas) {
    if (!listsGrid) return;
    if (currentView === "recommended") {
      currentListas = [];
      listsGrid.innerHTML = "";
      setEmpty(true);
      updateFilterCounts([]);
      return;
    }
    listsGrid.innerHTML = "";
    currentListas = listas || [];
    const filtered = applyFilter(listas || []);
    const sliced = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    if (!filtered.length) {
      setEmpty(true);
      return;
    }
    setEmpty(false);

    sliced.forEach((lista) => {
      const card = document.createElement("article");
      card.className = "list-card";

      const topBand = document.createElement("div");
      topBand.className = "list-topband";
      const icon = document.createElement("span");
      icon.className = "list-icon";
      icon.style.backgroundImage = "url('/imagens/folder.png')";
      icon.style.backgroundSize = "cover";
      icon.style.backgroundPosition = "center";
      icon.textContent = "";
      topBand.appendChild(icon);

      const header = document.createElement("div");
      header.className = "list-body";

      const title = document.createElement("h3");
      title.className = "list-title";
      updateListTitleElement(title, lista.titulo || "Sem título");
      header.appendChild(title);

      const subtitle = document.createElement("p");
      subtitle.className = "list-subtitle";
      subtitle.textContent = `Esta lista contém ${lista.total_itens || 0} questões.`;
      header.appendChild(subtitle);

      const status = document.createElement("span");
      const statusValue = getListaStatus(lista) || "ativa";
      status.className = `status-pill ${statusValue === "concluida" || statusValue === "finalizada" ? "is-finalizada" : "is-ativa"}`;
      const label = statusValue === "concluida" || statusValue === "finalizada" ? "FEITO" : "ATIVO";
      status.innerHTML = `<span class="dot-anim"></span> ${label}`;
      header.appendChild(status);

      const optionsBadge = document.createElement("span");
      optionsBadge.className = "options-badge";
      optionsBadge.innerHTML = `<img src="/imagens/options.png" alt="Opções">`;
      const optionsMenu = document.createElement("div");
      optionsMenu.className = "options-menu";
      optionsMenu.innerHTML = `
        <button class="option-item" data-action="rename">Renomear</button>
        ${statusValue === "concluida" || statusValue === "finalizada" ? "" : `<button class="option-item" data-action="mode">Alterar Modo</button>`}
        <button class="option-item" data-action="pdf">Gerar PDF</button>
        <button class="option-item danger" data-action="delete">Excluir</button>
      `;
      const toggleMenu = (open) => {
        optionsMenu.classList.toggle("open", open);
      };
      optionsBadge.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = !optionsMenu.classList.contains("open");
        toggleMenu(willOpen);
      });
      optionsMenu.addEventListener("click", (e) => e.stopPropagation());
      document.addEventListener("click", () => toggleMenu(false));

      optionsMenu.querySelector("[data-action='rename']").addEventListener("click", () => {
        toggleMenu(false);
        openRenameModal(lista, title);
      });
      const modeAction = optionsMenu.querySelector("[data-action='mode']");
      if (modeAction) {
        modeAction.addEventListener("click", () => {
          toggleMenu(false);
          openModeModal(lista);
        });
      }
      optionsMenu.querySelector("[data-action='pdf']").addEventListener("click", () => {
        toggleMenu(false);
        gerarPdf(lista);
      });
      optionsMenu.querySelector("[data-action='delete']").addEventListener("click", () => {
        toggleMenu(false);
        excluirLista(lista.id);
      });

      topBand.appendChild(optionsBadge);
      topBand.appendChild(optionsMenu);

      card.appendChild(topBand);
      card.appendChild(header);

      const meta = document.createElement("div");
      meta.className = "list-meta";

      const total = lista.total_itens || 0;
      const acertosTop = lista.acertos || 0;
      const ratio = document.createElement("span");
      ratio.className = "stat stat-ratio";
      ratio.innerHTML = `<span class="dot"></span> <strong>${acertosTop}/${total}</strong> acertos`;
      if (statusValue === "concluida" || statusValue === "finalizada") {
        ratio.classList.add("ratio-floating");
        const badgeWrapper = document.createElement("div");
        badgeWrapper.className = "topband-badges";
        badgeWrapper.appendChild(ratio);
        optionsBadge.classList.add("inline");
        badgeWrapper.appendChild(optionsBadge);
        topBand.appendChild(badgeWrapper);
      } else {
        topBand.appendChild(optionsBadge);
      }

      card.appendChild(meta);

      const details = document.createElement("div");
      details.className = "list-details";

      const detailList = document.createElement("div");
      detailList.className = "detail-list";

      const totalQuest = lista.total_itens || 0;
      const resp = lista.respondidos || 0;
      const acertos = acertosTop;
      const nota = lista.notaPercent != null ? Math.round(lista.notaPercent) : totalQuest > 0 ? Math.round((acertos / totalQuest) * 100) : 0;
      const delta = typeof lista.progressDelta === "number" ? lista.progressDelta : null;
      const deltaText =
        delta === null
          ? "Progresso: 0% (primeira lista respondida)"
          : `Progresso: ${delta > 0 ? "+" : ""}${delta.toFixed(1)}% X lista passada`;

      const detailItems = [
        { icon: "/imagens/rocket.png", text: `Acertos: ${acertos} de ${totalQuest}` },
        { icon: "/imagens/graph.png", text: deltaText },
      ];

      detailItems.forEach((item) => {
        const row = document.createElement("div");
        row.className = "detail-item";
        const ic = document.createElement("span");
        ic.className = "detail-icon";
        const icImg = document.createElement("img");
        icImg.src = item.icon;
        icImg.alt = "";
        ic.appendChild(icImg);
        const tx = document.createElement("span");
        tx.className = "detail-text";
        tx.textContent = item.text;
        row.appendChild(ic);
        row.appendChild(tx);
        detailList.appendChild(row);
      });

      const diffRow = document.createElement("div");
      diffRow.className = "detail-item";
      const diffIcon = document.createElement("span");
      diffIcon.className = "detail-icon";
      const diffImg = document.createElement("img");
      diffImg.src = "/imagens/difficulty.png";
      diffImg.alt = "";
      diffIcon.appendChild(diffImg);
      const diffText = document.createElement("span");
      diffText.className = "detail-text";
      diffText.textContent = "Dificuldade: —";
      diffRow.appendChild(diffIcon);
      diffRow.appendChild(diffText);
      detailList.appendChild(diffRow);

      const notaRow = document.createElement("div");
      notaRow.className = "detail-item";
      const notaIcon = document.createElement("span");
      notaIcon.className = "detail-icon";
      const notaImg = document.createElement("img");
      notaImg.src = "/imagens/info.png";
      notaImg.alt = "";
      notaIcon.appendChild(notaImg);
      const notaText = document.createElement("span");
      notaText.className = "detail-text";
      notaText.textContent = `Nota: ${nota}%`;
      notaRow.appendChild(notaIcon);
      notaRow.appendChild(notaText);
      detailList.appendChild(notaRow);

      const dateRow = document.createElement("div");
      dateRow.className = "detail-item";
      const dateIcon = document.createElement("span");
      dateIcon.className = "detail-icon";
      const dateImg = document.createElement("img");
      dateImg.src = "/imagens/clock.png";
      dateImg.alt = "";
      dateIcon.appendChild(dateImg);
      const dateText = document.createElement("span");
      dateText.className = "detail-text";
      dateText.textContent = formatRelativeDays(lista.updated_at || lista.created_at);
      dateRow.appendChild(dateIcon);
      dateRow.appendChild(dateText);
      detailList.appendChild(dateRow);

      getDominantDifficulty(lista.id).then((label) => {
        diffText.textContent = `Dificuldade: ${label}`;
      });

      details.appendChild(detailList);

      card.appendChild(details);

      const getArrowIcon = (expanded) => {
        const isLight = document.documentElement.dataset.theme === "light";
        if (expanded) return isLight ? "/imagens/dark-arrow-up.png" : "/imagens/white-arrow-up.png";
        return isLight ? "/imagens/dark-arrow-down.png" : "/imagens/white-arrow-down.png";
      };

      const expandBtn = document.createElement("button");
      expandBtn.className = "expand-btn";
      expandBtn.innerHTML = `<span class="expand-label">Clique para mais detalhes</span><span class="expand-icon"><img src="${getArrowIcon(false)}" alt="Expandir"></span>`;
      card.appendChild(expandBtn);

      card.appendChild(details);

      const responderInline = document.createElement("div");
      responderInline.className = "card-responder-action";
      const btnResponder = document.createElement("button");
      btnResponder.className = "btn btn-success";
      const isFinalizada = statusValue === "concluida" || statusValue === "finalizada";
      btnResponder.textContent = isFinalizada ? "Ver Relatório" : "Responder";
      if (isFinalizada) btnResponder.classList.add("is-report");
      btnResponder.addEventListener("click", () => responderLista(lista));
      responderInline.appendChild(btnResponder);
      card.appendChild(responderInline);

      const updateExpandIcon = (isExpanded) => {
        const ic = expandBtn.querySelector(".expand-icon img");
        const label = expandBtn.querySelector(".expand-label");
        if (ic) {
          ic.src = getArrowIcon(isExpanded);
        }
        if (label) {
          label.textContent = isExpanded ? "Clique para ocultar os detalhes" : "Clique para mais detalhes";
        }
      };

      const toggleDetails = () => {
        const isExpanded = card.classList.toggle("expanded");
        updateExpandIcon(isExpanded);
      };

      expandBtn.addEventListener("click", toggleDetails);
      title.addEventListener("click", toggleDetails);
      updateExpandIcon(false);

      listsGrid.appendChild(card);
    });

    renderPagination(filtered.length);
  }

  function renderPagination(totalFiltered) {
    let pager = document.getElementById("lists-pager");
    if (!pager) {
      pager = document.createElement("div");
      pager.id = "lists-pager";
      pager.className = "pager";
      const parent = listsGrid?.parentElement;
      if (parent) parent.appendChild(pager);
    }
    pager.innerHTML = "";
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (totalPages <= 1) {
      pager.style.display = "none";
      return;
    }
    pager.style.display = "flex";

    const info = document.createElement("span");
    info.textContent = `Página ${currentPage} de ${totalPages}`;
    pager.appendChild(info);

    const makePageBtn = (page) => {
      const btn = document.createElement("button");
      btn.textContent = page;
      btn.className = "page-number";
      if (page === currentPage) btn.classList.add("active");
      btn.disabled = page === currentPage;
      btn.addEventListener("click", () => {
        currentPage = page;
        renderLists(currentListas);
      });
      return btn;
    };

    const maxButtons = 7;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

    if (start > 1) {
      pager.appendChild(makePageBtn(1));
      if (start > 2) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        ellipsis.className = "pager-ellipsis";
        pager.appendChild(ellipsis);
      }
    }

    for (let p = start; p <= end; p += 1) {
      pager.appendChild(makePageBtn(p));
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        ellipsis.className = "pager-ellipsis";
        pager.appendChild(ellipsis);
      }
      pager.appendChild(makePageBtn(totalPages));
    }

    const prev = document.createElement("button");
    prev.textContent = "Anterior";
    prev.disabled = currentPage <= 1;
    prev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderLists(currentListas);
      }
    });

    const next = document.createElement("button");
    next.textContent = "Próxima";
    next.disabled = currentPage >= totalPages;
    next.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        renderLists(currentListas);
      }
    });

    pager.appendChild(prev);
    pager.appendChild(next);
  }

  /**
   * Carrega as listas do usuário (próprias ou já respondidas), enriquecidas
   * com estatísticas de progresso, e dispara a renderização.
   * @returns {Promise<void>}
   */
  async function carregarListas() {
    if (currentView === "recommended") {
      // Placeholder: nenhuma recomendada ainda
      renderLists([]);
      return;
    }

      if (!supabaseClient) {
        console.warn("[Listas] Supabase não inicializado.");
        setEmpty(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      await adminGuardPromise;
      try {
        const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
        if (userErr || !user) {
          setEmpty(true);
          setLoading(false);
          return;
        }

      // Busca IDs de listas que pertencem ao usuário ou que ele já respondeu
      const [ownerIdsResult, respondedIdsResult] = await Promise.all([
        supabaseClient.from("listas").select("id").eq("owner_id", user.id),
        supabaseClient.from("lista_respostas").select("lista_id").eq("user_id", user.id)
      ]);

      if (ownerIdsResult.error || respondedIdsResult.error) {
        console.error("[Listas] Erro ao carregar ids de listas:", ownerIdsResult.error || respondedIdsResult.error);
        setEmpty(true);
        setLoading(false);
        return;
      }

      const idSet = new Set();
      (ownerIdsResult.data || []).forEach((row) => row.id && idSet.add(row.id));
      (respondedIdsResult.data || []).forEach((row) => row.lista_id && idSet.add(row.lista_id));

      const allIds = Array.from(idSet);
      if (!allIds.length) {
        renderLists([]);
        updateFilterCounts([]);
        setEmpty(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient
        .from("listas")
        .select("*")
        .in("id", allIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Listas] Erro ao carregar listas:", error);
        setEmpty(true);
        setLoading(false);
        return;
      }

      // Garante filtragem final apenas para IDs permitidos (segurança defensiva)
      const filteredByUser = (data || []).filter((l) => idSet.has(l.id));

      // Enriquecer com estatísticas de respostas (acertos/progresso)
      const listaIds = (data || []).map((l) => l.id).filter(Boolean);
      if (listaIds.length && supabaseClient) {
        try {
          const { data: respostasRows, error: respErr } = await supabaseClient
            .from("lista_respostas")
            .select("lista_id, correta, respondida_em")
            .eq("user_id", user.id)
            .in("lista_id", listaIds);
          let respostaData = Array.isArray(respostasRows) ? respostasRows : [];

          // Fallback: se não encontrou nada, tenta buscar registros legados que tenham user_id do próprio usuário
          if (!respErr && respostaData.length === 0) {
            const ownedIds = (data || []).filter((l) => l.owner_id === user.id).map((l) => l.id);
            if (ownedIds.length) {
              const { data: legacyRows, error: legacyErr } = await supabaseClient
                .from("lista_respostas")
                .select("lista_id, correta, respondida_em")
                .eq("user_id", user.id)
                .in("lista_id", ownedIds);
              if (!legacyErr && Array.isArray(legacyRows)) {
                respostaData = legacyRows;
              }
            }
          }

          if (!respErr && Array.isArray(respostaData)) {
            const mapStats = new Map();
            respostaData.forEach((row) => {
              const entry = mapStats.get(row.lista_id) || { respondidos: 0, acertos: 0, lastAnsweredAt: null };
              entry.respondidos += 1;
              entry.acertos += row.correta ? 1 : 0;
              const ts = row.respondida_em ? new Date(row.respondida_em).getTime() : null;
              if (ts && (!entry.lastAnsweredAt || ts > entry.lastAnsweredAt)) {
                entry.lastAnsweredAt = ts;
              }
              mapStats.set(row.lista_id, entry);
            });
            data.forEach((l) => {
              const stats = mapStats.get(l.id);
              if (stats) {
                l.respondidos = stats.respondidos;
                l.acertos = stats.acertos;
                l.lastAnsweredAt = stats.lastAnsweredAt;
              }
              const total = l.total_itens || 0;
              const localFinalizada = isListaFinalizadaLocalmente(l.id, user.id);
              l.acertos = l.acertos || 0;
              l.respondidos = l.respondidos || 0;
              l.notaPercent = total > 0 && l.acertos != null ? (l.acertos / total) * 100 : 0;
              if (!l.progressDelta) l.progressDelta = 0;
              if (localFinalizada || (total > 0 && l.respondidos >= total)) {
                l.user_status = "concluida";
              }
            });

            // Calcula progresso X lista anterior respondida (ordenação por respondida_em)
            const responded = data
              .filter((l) => (l.respondidos || 0) > 0)
              .sort((a, b) => {
                const da = a.lastAnsweredAt || 0;
                const db = b.lastAnsweredAt || 0;
                return db - da;
              });

            const prevMap = new Map();
            responded.forEach((item, idx) => {
              const prev = responded[idx + 1];
              if (prev) prevMap.set(item.id, prev.notaPercent || 0);
            });

            data.forEach((item) => {
              if ((item.respondidos || 0) > 0) {
                const prevNota = prevMap.has(item.id) ? prevMap.get(item.id) : null;
                item.progressDelta = prevNota === null ? 0 : (item.notaPercent || 0) - prevNota;
              } else {
                item.progressDelta = 0;
              }
            });
          }
        } catch (err) {
          console.warn("[Listas] Falha ao carregar estatísticas de respostas:", err);
        }
      }

      (filteredByUser || []).forEach((lista) => {
        if (isListaFinalizadaLocalmente(lista.id, user.id)) {
          lista.user_status = "concluida";
        }
      });

      renderLists(filteredByUser || []);
      updateFilterCounts(filteredByUser || []);
    } catch (err) {
      console.error("[Listas] Erro inesperado ao carregar listas:", err);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchListaQuestoes(listaId) {
    if (!supabaseClient) {
      console.error("[Listas] fetchListaQuestoes: supabaseClient não inicializado.");
      return [];
    }
    if (!listaId) {
      console.error("[Listas] fetchListaQuestoes: listaId não informado.");
      return [];
    }

    // Busca itens da lista sem filtrar user_id para suportar listas de outros admins
    const { data: itens, error: itensError } = await supabaseClient
      .from("lista_itens")
      .select("questao_id, ordem")
      .eq("lista_id", listaId)
      .order("ordem", { ascending: true });

    if (itensError) {
      console.error("[Listas] Erro ao buscar lista_itens:", itensError.message, itensError);
      return [];
    }
    if (!itens || !itens.length) {
      console.warn("[Listas] Nenhum item encontrado para a lista:", listaId, "— verifique se a sincronização foi concluída.");
      return [];
    }

    const ids = itens.map((i) => i.questao_id).filter(Boolean);
    if (!ids.length) return [];

    // Chunking para evitar limite de tamanho do .in() no Supabase (max ~500 IDs)
    const CHUNK_SIZE = 200;
    const SELECT_FIELDS = `
      id, ano, modalidade, disciplina, dificuldade,
      tags,
      enunciado, sub_enunciado, imagem_url, fonte,
      alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
      alternativa_a_imagem_url, alternativa_b_imagem_url, alternativa_c_imagem_url,
      alternativa_d_imagem_url, alternativa_e_imagem_url
    `;

    let allQuestoes = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const { data, error: qErr } = await supabaseClient
        .from("questions")
        .select(SELECT_FIELDS)
        .in("id", chunk);
      if (qErr) {
        console.error("[Listas] Erro ao buscar questões chunk:", qErr.message, qErr);
        continue;
      }
      if (data) allQuestoes = allQuestoes.concat(data);
    }

    if (!allQuestoes.length) {
      console.warn("[Listas] Nenhuma questão retornada para os IDs:", ids);
      return [];
    }

    const questoesMap = new Map(allQuestoes.map((q) => [q.id, q]));
    return itens
      .map((item) => {
        const q = questoesMap.get(item.questao_id);
        return q ? { ...q, ordem: item.ordem } : null;
      })
      .filter(Boolean);
  }

  async function fetchGabaritoForQuestoes(ids) {
    if (!supabaseClient || !ids.length) return {};
    const map = {};
    const CHUNK = 200;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const { data } = await supabaseClient
        .from("questions")
        .select("id, gabarito, gabarito_comentado")
        .in("id", chunk);
      if (Array.isArray(data)) {
        data.forEach((q) => {
          map[q.id] = { gabarito: q.gabarito || null, gabarito_comentado: q.gabarito_comentado || null };
        });
      }
    }
    return map;
  }

  async function enrichWithGabarito(questoes) {
    if (!Array.isArray(questoes) || !questoes.length) return;
    const ids = questoes.map((q) => q.id).filter(Boolean);
    const map = await fetchGabaritoForQuestoes(ids);
    questoes.forEach((q) => {
      const entry = map[q.id];
      if (entry) {
        q.gabarito = entry.gabarito;
        q.gabarito_comentado = entry.gabarito_comentado;
      }
    });
  }

  // Remove imagens embutidas no HTML das questões (evita exibir URLs no texto)
  function stripImagesFromHtml(html) {
    if (!html) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      doc.querySelectorAll("img").forEach((el) => el.remove());
      doc.querySelectorAll("br").forEach((el) => el.replaceWith("\n"));
      doc
        .querySelectorAll("p, div, li, section, article, h1, h2, h3, h4, h5, h6, tr")
        .forEach((el) => {
          if (!el.nextSibling || el.nextSibling.nodeType !== Node.TEXT_NODE) {
            el.after("\n");
          }
        });
      return (doc.body.textContent || doc.body.innerText || "").replace(/\u00a0/g, " ");
    } catch (e) {
      return html;
    }
  }

  // ==================== Responder Lista ====================
  const respostaKey = (listaId) => `lista-respostas-${listaId}`;

  function normalizeListaStatus(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function getListaStatus(lista) {
    return normalizeListaStatus(lista?.user_status || lista?.status || "ativa");
  }

  function isListaConcluida(lista) {
    const status = getListaStatus(lista);
    return status === "concluida" || status === "finalizada";
  }

  function loadFinalizacaoLocal(listaId) {
    try {
      const raw = localStorage.getItem(finalizacaoKey(listaId));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveFinalizacaoLocal(listaId, userId) {
    try {
      localStorage.setItem(
        finalizacaoKey(listaId),
        JSON.stringify({
          userId: userId || null,
          concluida: true,
          concluidaEm: new Date().toISOString()
        }),
      );
    } catch (e) {
      console.warn("Não foi possível salvar finalização localmente:", e);
    }
  }

  function isListaFinalizadaLocalmente(listaId, userId) {
    const marker = loadFinalizacaoLocal(listaId);
    if (!marker || marker.concluida !== true) return false;
    if (!userId) return false;
    return Boolean(marker.userId) && marker.userId === userId;
  }

  function loadRespostas(listaId) {
    try {
      const raw = localStorage.getItem(respostaKey(listaId));
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveRespostas(listaId, respostas) {
    try {
      localStorage.setItem(respostaKey(listaId), JSON.stringify(respostas || {}));
    } catch (e) {
      console.warn("Não foi possível salvar respostas localmente:", e);
    }
  }

  function buildRespostaRow({ listaId, userId, questaoId, resposta, correta }) {
    const nowIso = new Date().toISOString();
    return {
      lista_id: listaId,
      user_id: userId,
      questao_id: questaoId,
      resposta: resposta || null,
      correta: !!correta,
      status: resposta ? "respondida" : "pendente",
      respondida_em: resposta ? nowIso : null,
      created_at: nowIso
    };
  }

  function defaultOnConflictForTable(table, payload, explicitOnConflict) {
    if (explicitOnConflict) return explicitOnConflict;
    if (table === "lista_respostas") {
      const row = Array.isArray(payload) ? payload[0] : payload;
      if (row && row.lista_id != null && row.user_id != null && row.questao_id != null) {
        return "lista_id,user_id,questao_id";
      }
    }
    return undefined;
  }

  async function queueDbUpsert(table, key, payload, userId, onConflict) {
    const syncGateway = await getSyncGateway();
    if (syncGateway && typeof syncGateway.enqueueUpsert === "function") {
      await syncGateway.enqueueUpsert({
        table,
        key: String(key || ""),
        payload,
        userId: userId || null,
        onConflict: defaultOnConflictForTable(table, payload, onConflict),
        flush: "none"
      });
      return { queued: true };
    }
    return null;
  }

  async function queueDbDelete(table, key, userId, filters) {
    const syncGateway = await getSyncGateway();
    if (syncGateway && typeof syncGateway.enqueueDelete === "function") {
      await syncGateway.enqueueDelete({ table, key: String(key || ""), userId: userId || null, filters, flush: "none" });
      return { queued: true };
    }
    return null;
  }

  async function flushQueuedSync(timeoutMs) {
    const syncGateway = await getSyncGateway();
    if (syncGateway && typeof syncGateway.flushNow === "function") {
      return syncGateway.flushNow({ timeoutMs: timeoutMs || 10000 });
    }
    return { ok: true, mode: "direct" };
  }

  async function saveRespostaToSupabase({ listaId, userId, questaoId, resposta, correta }) {
    if (!supabaseClient || !listaId || !userId || !questaoId) return;
    const row = buildRespostaRow({ listaId, userId, questaoId, resposta, correta });
    try {
      const queuedDelete = await queueDbDelete("lista_respostas", `${listaId}:${userId}:${questaoId}`, userId, [
        { op: "eq", column: "lista_id", value: listaId },
        { op: "eq", column: "user_id", value: userId },
        { op: "eq", column: "questao_id", value: questaoId },
      ]);
      const queuedInsert = await queueDbUpsert("lista_respostas", `${listaId}:${userId}:${questaoId}`, row, userId);
      if (!queuedDelete || !queuedInsert) {
        throw new Error("sync_gateway_unavailable");
      }
    } catch (err) {
      console.warn("[Listas] Falha ao salvar resposta no Supabase:", err);
    }
  }

  async function saveAllRespostasToSupabase({ listaId, userId, questoes, respostas }) {
    if (!supabaseClient || !listaId || !userId || !Array.isArray(questoes)) return;
    const rows = questoes.map((q) => {
      const selected = respostas[q.id] || null;
      const correct = (q.gabarito || "").toString().trim().toLowerCase();
      const isCorrect = selected && correct && selected.toString().trim().toLowerCase() === correct;
      return buildRespostaRow({
        listaId,
        userId,
        questaoId: q.id,
        resposta: selected,
        correta: isCorrect
      });
    });
    try {
      const queuedDelete = await queueDbDelete("lista_respostas", `${listaId}:${userId}:all`, userId, [
        { op: "eq", column: "lista_id", value: listaId },
        { op: "eq", column: "user_id", value: userId },
      ]);
      let queuedAll = Boolean(queuedDelete);
      if (queuedAll) {
        for (const row of rows) {
          const rowKey = `${row.lista_id}:${row.user_id}:${row.questao_id}`;
          const q = await queueDbUpsert("lista_respostas", rowKey, row, userId);
          if (!q) {
            queuedAll = false;
            break;
          }
        }
      }
      if (!queuedAll) throw new Error("sync_gateway_unavailable");
    } catch (err) {
      console.warn("[Listas] Falha ao sincronizar respostas no Supabase:", err);
    }
  }

  let responderUI = null;

  function ensureResponderUI() {
    if (responderUI) return responderUI;
    const overlay = document.createElement("div");
    overlay.className = "responder-overlay";
    overlay.innerHTML = `
      <div class="responder-modal">
        <div class="responder-header">
          <div>
            <div class="responder-list-title">Lista</div>
            <h3 id="resp-title">Carregando...</h3>
            <p id="resp-sub"> </p>
          </div>
          <div class="responder-header-actions">
            <button type="button" class="pill-btn" id="resp-clear">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6"/></svg>
              Limpar respostas
            </button>
            <button type="button" class="pill-btn primary" id="resp-close">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Salvar e fechar
            </button>
          </div>
        </div>
      <div class="responder-body">
        <aside class="responder-sidebar">
            <div class="responder-progress">
              <div class="progress-label">Progresso</div>
              <div class="progress-count"><span id="resp-current">1</span>/<span id="resp-total">0</span></div>
              <div class="progress-bar"><span id="resp-bar"></span></div>
            </div>
            <div class="responder-nav">
              <button id="resp-prev" class="ghost-nav">‹ Anterior</button>
              <button id="resp-next" class="ghost-nav">Próxima ›</button>
            </div>
            <div class="responder-answers" id="resp-answers"></div>
            <div class="responder-finalize" id="resp-finalize-wrap">
            <button type="button" class="finalize-btn" id="resp-finalize-btn">Relatório Geral</button>
            <span class="finalize-hint">Todas as questões respondidas. Revise e finalize.</span>
            </div>
          </aside>
        <section class="responder-question">
          <div class="question-meta">
            <span class="meta-badge" id="resp-diff">Dificuldade</span>
            <span class="meta-badge" id="resp-num">Questão</span>
            </div>
            <div class="question-content">
              <p class="question-text" id="resp-enunciado"></p>
              <p class="question-sub" id="resp-sub-enunciado"></p>
              <div class="question-image" id="resp-img-wrap" style="display:none;">
                <img id="resp-img" alt="Imagem da questão">
              </div>
            </div>
            <div class="question-options" id="resp-options"></div>
          </section>
        </div>
      </div>
      <div class="responder-summary" id="resp-summary">
        <div class="summary-card">
          <div class="summary-header">
            <div>
              <div class="summary-eyebrow">Resumo</div>
              <h4 id="summary-title">Resultados da lista</h4>
            </div>
            <button type="button" class="pill-btn" id="summary-close">Fechar</button>
          </div>
          <div class="summary-metrics">
            <div class="summary-pill ok">
              <span>Acertos</span>
              <strong id="summary-correct">0</strong>
            </div>
            <div class="summary-pill warn">
              <span>Erros</span>
              <strong id="summary-wrong">0</strong>
            </div>
          </div>
          <div class="summary-status" id="summary-status">Salvando no Supabase...</div>
          <div class="summary-list" id="summary-list"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    responderUI = {
      overlay,
      title: overlay.querySelector("#resp-title"),
      subtitle: overlay.querySelector("#resp-sub"),
      current: overlay.querySelector("#resp-current"),
      total: overlay.querySelector("#resp-total"),
      bar: overlay.querySelector("#resp-bar"),
      progressLabel: overlay.querySelector(".progress-label"),
      diff: overlay.querySelector("#resp-diff"),
      num: overlay.querySelector("#resp-num"),
      enunciado: overlay.querySelector("#resp-enunciado"),
      sub: overlay.querySelector("#resp-sub-enunciado"),
      imgWrap: overlay.querySelector("#resp-img-wrap"),
      img: overlay.querySelector("#resp-img"),
      options: overlay.querySelector("#resp-options"),
      answers: overlay.querySelector("#resp-answers"),
      finalizeWrap: overlay.querySelector("#resp-finalize-wrap"),
      finalizeBtn: overlay.querySelector("#resp-finalize-btn"),
      finalizeHint: overlay.querySelector(".finalize-hint"),
      prevBtn: overlay.querySelector("#resp-prev"),
      nextBtn: overlay.querySelector("#resp-next"),
      closeBtn: overlay.querySelector("#resp-close"),
      clearBtn: overlay.querySelector("#resp-clear"),
      summary: overlay.querySelector("#resp-summary"),
      summaryList: overlay.querySelector("#summary-list"),
      summaryStatus: overlay.querySelector("#summary-status"),
      summaryClose: overlay.querySelector("#summary-close"),
      summaryCorrect: overlay.querySelector("#summary-correct"),
      summaryWrong: overlay.querySelector("#summary-wrong"),
      summaryTitle: overlay.querySelector("#summary-title"),
      meta: overlay.querySelector(".question-meta"),
      questionPane: overlay.querySelector(".responder-question")
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeResponder();
    });
    responderUI.closeBtn.addEventListener("click", closeResponder);
    responderUI.clearBtn.addEventListener("click", () => {
      const ok = confirm("Deseja limpar todas as respostas desta lista? Elas serão removidas do salvamento local.");
      if (!ok) return;
      responderState.respostas = {};
      saveRespostas(responderState.lista.id, responderState.respostas);
      if (responderState.userId) {
        saveAllRespostasToSupabase({
          listaId: responderState.lista.id,
          userId: responderState.userId,
          questoes: responderState.questoes,
          respostas: responderState.respostas
        });
      }
      renderResponder();
    });
    responderUI.prevBtn.addEventListener("click", () => {
      if (responderState.currentIndex > 0) {
        responderState.currentIndex -= 1;
        renderResponder();
      }
    });
    responderUI.nextBtn.addEventListener("click", () => {
      if (responderState.currentIndex < responderState.questoes.length - 1) {
        responderState.currentIndex += 1;
        renderResponder();
      }
    });
    responderUI.finalizeBtn.addEventListener("click", handleFinalizeClick);
    responderUI.summaryClose.addEventListener("click", closeSummary);

    return responderUI;
  }

  function renderAnswersGrid() {
    if (!responderUI) return;
    const { answers } = responderUI;
    answers.innerHTML = "";
    const showGabarito = responderState.isReadonly || !!responderState.lista?.modo_lista;
    responderState.questoes.forEach((q, idx) => {
      const btn = document.createElement("button");
      btn.className = "answer-dot";
      const letterRaw = responderState.respostas[q.id];
      const letter = letterRaw ? letterRaw.toString().trim().toLowerCase() : "";
      const correct = (q.gabarito || "").toString().trim().toLowerCase();
      if (letter) {
        btn.classList.add("filled");
        const isCorrect = correct && letter === correct;
        if (showGabarito) {
          if (isCorrect) btn.classList.add("is-correct");
          else btn.classList.add("is-wrong");
        }
      } else if (responderState.isReadonly) {
        btn.classList.add("is-unanswered");
      }
      btn.textContent = idx + 1;
      if (idx === responderState.currentIndex) btn.classList.add("active");
      btn.addEventListener("click", () => {
      responderState.currentIndex = idx;
      responderState.view = "question";
      renderResponder();
    });
      answers.appendChild(btn);
    });

    toggleFinalizeVisibility();

    if (responderUI.finalizeHint && responderUI.finalizeBtn) {
      const showHint = responderUI.finalizeBtn.textContent.toLowerCase().includes("finalizar");
      responderUI.finalizeHint.style.display = showHint ? "block" : "none";
    }
  }

  function isAllAnswered() {
    if (!responderState.questoes.length) return false;
    return responderState.questoes.every((q) => responderState.respostas[q.id]);
  }

  function toggleFinalizeVisibility() {
    if (!responderUI || !responderUI.finalizeWrap) return;
    if (responderState.isReadonly) {
      responderUI.finalizeWrap.style.display = "flex";
      if (responderUI.finalizeBtn) {
        responderUI.finalizeBtn.disabled = false;
        responderUI.finalizeBtn.textContent = "Relatório Geral";
      }
      return;
    }
    responderUI.finalizeWrap.style.display = isAllAnswered() ? "flex" : "none";
    if (responderUI.finalizeBtn) {
      responderUI.finalizeBtn.disabled = false;
      responderUI.finalizeBtn.textContent = "Finalizar Lista";
    }
  }

  function renderResponder() {
    if (!responderUI || !responderState.lista) return;
    const { questoes, currentIndex, respostas, lista } = responderState;
    const isReadonly = responderState.isReadonly;
    const showGabarito = isReadonly || !!lista?.modo_lista;
    const q = questoes[currentIndex];
    responderUI.title.textContent = lista.titulo || "Lista de Questões";
    responderUI.subtitle.textContent = `${questoes.length} questões`;
    responderUI.total.textContent = questoes.length;
    responderUI.current.textContent = currentIndex + 1;
    const percent =
      responderState.view === "report"
        ? 100
        : questoes.length
        ? (currentIndex / Math.max(1, questoes.length - 1)) * 100
        : 0;
    responderUI.bar.style.width = `${percent}%`;
    if (responderState.view === "report") {
      responderUI.current.parentElement.style.display = "none";
    } else {
      responderUI.current.parentElement.style.display = "flex";
    }

    const formatDifficulty = (value) => {
      const raw = (value || "").toString().toLowerCase();
      if (raw.includes("fac")) return "Fácil";
      if (raw.includes("dif")) return "Difícil";
      return raw ? "Médio" : "—";
    };
    const diffSlug = (() => {
      const raw = (q.dificuldade || "").toString().toLowerCase();
      if (raw.includes("fac")) return "facil";
      if (raw.includes("dif")) return "dificil";
      return "medio";
    })();
    responderUI.diff.textContent = `Dificuldade: ${formatDifficulty(q.dificuldade)}`;
    responderUI.diff.className = `meta-badge diff-${diffSlug}`;
    if (responderUI.questionPane) responderUI.questionPane.dataset.difficulty = diffSlug;
    responderUI.num.textContent = `ID #${q.id || q.ordem || currentIndex + 1}`;
    responderUI.num.style.display = "inline-flex";
    if (responderUI.meta) {
      responderUI.meta.querySelectorAll("[data-tag-badge='true']").forEach((el) => el.remove());
      const showMeta = responderState.isReadonly && responderState.view !== "report";
      responderUI.meta.style.display = showMeta ? "flex" : "none";
      if (showMeta && q.tags) {
        const tags = Array.isArray(q.tags)
          ? q.tags
          : q.tags.toString().split(/[,;]+/).map((t) => t.trim()).filter(Boolean);
        tags.forEach((tag) => {
          const badge = document.createElement("span");
          badge.className = "meta-badge";
          badge.dataset.tagBadge = "true";
          badge.textContent = tag;
          responderUI.meta.appendChild(badge);
        });
      }
    }
    responderUI.enunciado.textContent = stripImagesFromHtml(q.enunciado) || "Questão sem enunciado.";
    responderUI.sub.textContent = stripImagesFromHtml(q.sub_enunciado);
    responderUI.sub.style.display = responderUI.sub.textContent ? "block" : "none";
    if (responderUI.progressLabel) {
      responderUI.progressLabel.textContent = isReadonly ? "Revisando..." : "Progresso";
    }
    if (responderUI.clearBtn) {
      responderUI.clearBtn.style.display = isReadonly ? "none" : "inline-block";
    }
    if (responderUI.finalizeHint && responderUI.finalizeBtn) {
      const showHint = !isReadonly && responderUI.finalizeBtn.textContent.toLowerCase().includes("finalizar");
      responderUI.finalizeHint.style.display = showHint ? "block" : "none";
    }

    // Ordem: texto -> imagem -> subtexto
    responderUI.enunciado.after(responderUI.imgWrap);
    responderUI.imgWrap.after(responderUI.sub);
    if (q.imagem_url) {
      responderUI.imgWrap.style.display = "block";
      responderUI.img.src = q.imagem_url;
      applyImageSizing(responderUI.img);
    } else {
      responderUI.imgWrap.style.display = "none";
      responderUI.img.removeAttribute("src");
    }

    responderUI.options.innerHTML = "";
    const options = ["a", "b", "c", "d", "e"];
    if (responderState.isReadonly && responderState.view === "report") {
      responderUI.imgWrap.style.display = "none";
      responderUI.img.removeAttribute("src");
      responderUI.enunciado.textContent = "";
      responderUI.sub.textContent = "";
      responderUI.diff.textContent = "Resumo";
      responderUI.diff.className = "meta-badge";
      if (responderUI.questionPane) delete responderUI.questionPane.dataset.difficulty;
      responderUI.num.textContent = "";
      responderUI.num.style.display = "none";
      const stats = buildSummary();
      const pct = stats.total ? Math.round((stats.correctCount / stats.total) * 100) : 0;
      const gaugeClass = pct >= 70 ? "is-high" : pct >= 50 ? "is-mid" : "is-low";
      const pageSize = 12;
      const totalPages = Math.max(1, Math.ceil(stats.items.length / pageSize));
      const currentPage = Math.min(Math.max(responderState.reportPage || 1, 1), totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const pageItems = stats.items.slice(startIndex, startIndex + pageSize);
      responderUI.options.innerHTML = `
        <div class="report-summary">
          <div class="report-headline">Relatório de Questões</div>
          <div class="report-cards">
            <div class="report-card ok">
              <div class="report-card-label">Acertos</div>
              <div class="report-card-sub">Respostas corretas</div>
              <div class="report-card-value">${stats.correctCount}</div>
            </div>
            <div class="report-card bad">
              <div class="report-card-label">Erros</div>
              <div class="report-card-sub">Respostas erradas</div>
              <div class="report-card-value">${stats.total - stats.correctCount}</div>
            </div>
            <div class="report-gauge">
              <div class="gauge-ring">
                <svg viewBox="0 0 36 36">
                  <path class="gauge-bg" d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path class="gauge-fg ${gaugeClass}" stroke-dasharray="${pct}, 100" d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"/>
                </svg>
                <div class="gauge-text">
                  <strong>${pct}%</strong>
                  <span>Nota Final</span>
                </div>
              </div>
            </div>
          </div>
          <div class="report-table-wrap">
            <div class="report-table-title">Tabela de Questões</div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Questão</th>
                  <th>Disciplina</th>
                  <th>Dificuldade</th>
                  <th>Sua resposta</th>
                  <th>Gabarito</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${pageItems
                  .map(
                    (item) => `
                      <tr class="${item.isCorrect ? "is-correct" : "is-wrong"}">
                        <td>${item.seq}</td>
                        <td>${item.disciplina}</td>
                        <td>
                          <span class="difficulty-chip ${item.dificuldadeSlug}">
                            ${item.dificuldadeSlug === "facil" ? "Fácil" : item.dificuldadeSlug === "dificil" ? "Difícil" : "Médio"}
                          </span>
                        </td>
                        <td>${item.selected}</td>
                        <td>${item.correct}</td>
                        <td>
                          <span class="result-chip ${item.isCorrect ? "ok" : "bad"}">
                            ${item.isCorrect ? "Certa" : "Errada"}
                          </span>
                        </td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
            ${totalPages > 1 ? `
              <div class="report-pager">
                <button type="button" data-report-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>Anterior</button>
                <div class="pager-pages">
                  ${Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    return `<button type="button" class="page-number ${page === currentPage ? "active" : ""}" data-report-page="${page}">${page}</button>`;
                  }).join("")}
                </div>
                <button type="button" data-report-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>Próxima</button>
              </div>
            ` : ""}
          </div>
        </div>
      `;
      const pagerButtons = responderUI.options.querySelectorAll("[data-report-page]");
      pagerButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          responderState.reportPage = Number(btn.dataset.reportPage || "1");
          renderResponder();
        });
      });
    } else {
      options.forEach((opt) => {
        const text = q[`alternativa_${opt}`];
        const imgUrl = q[`alternativa_${opt}_imagem_url`];
        if (!text && !imgUrl) return;
        const btn = document.createElement("button");
        btn.className = "option-btn";
        const selected = respostas[q.id];
        const selectedLower = selected ? selected.toString().trim().toLowerCase() : "";
        const correct = (q.gabarito || "").toString().trim().toLowerCase();
        const isSelected = selectedLower === opt;
        const isCorrectOption = correct && opt === correct;
        const isAnswered = !!selectedLower;
        const isCorrect = isAnswered && correct && selectedLower === correct;
        const pending = responderState.pendingRespostas[q.id];
        const isPending = !isAnswered && pending === opt;
        if (isSelected) btn.classList.add("selected");
        if (isPending) btn.classList.add("pending");
        if (showGabarito && isAnswered && isSelected) {
          btn.classList.add(isCorrect ? "is-correct" : "is-wrong");
        }
        if (showGabarito && isAnswered && !isCorrect && isCorrectOption) {
          btn.classList.add("is-correct");
        }
        btn.innerHTML = `
          <span class="option-letter">${opt.toUpperCase()}</span>
          ${imgUrl ? `<img class="option-img" src="${imgUrl}" alt="Alternativa ${opt.toUpperCase()}">` : ""}
          <span class="option-text">${stripImagesFromHtml(text) || ""}</span>
          ${isPending ? `<span class="confirm-badge" data-confirm="true">Confirmar</span>` : ""}
        `;
        if (!isReadonly) {
          btn.addEventListener("click", () => {
            if (responderState.respostas[q.id]) return;
            if (responderState.pendingRespostas[q.id] === opt) {
              delete responderState.pendingRespostas[q.id];
            } else {
              responderState.pendingRespostas[q.id] = opt;
            }
            renderResponder();
          });
        }
        const confirmBadge = btn.querySelector("[data-confirm='true']");
        if (confirmBadge && !isReadonly) {
          confirmBadge.addEventListener("click", (event) => {
            event.stopPropagation();
            const pendingValue = responderState.pendingRespostas[q.id];
            if (!pendingValue) return;
            responderState.respostas[q.id] = pendingValue;
            delete responderState.pendingRespostas[q.id];
            saveRespostas(lista.id, responderState.respostas);
            if (responderState.userId) {
              const correct = (q.gabarito || "").toString().trim().toLowerCase();
              const isCorrect = correct && pendingValue === correct;
              saveRespostaToSupabase({
                listaId: lista.id,
                userId: responderState.userId,
                questaoId: q.id,
                resposta: pendingValue,
                correta: isCorrect
              });
            }
            renderResponder();
          });
        }
        responderUI.options.appendChild(btn);
      });
      applyImageSizingToContainer(responderUI.options);
    }

    responderUI.prevBtn.disabled = currentIndex <= 0 || responderState.view === "report";
    responderUI.nextBtn.disabled = currentIndex >= questoes.length - 1 || responderState.view === "report";

    renderAnswersGrid();

    const renderKey = `${responderState.view}:${currentIndex}`;
    if (renderKey !== responderState.lastRenderKey) {
      responderState.lastRenderKey = renderKey;
      if (responderUI.questionPane) {
        responderUI.questionPane.classList.remove("q-enter");
        void responderUI.questionPane.offsetWidth;
        responderUI.questionPane.classList.add("q-enter");
      }
    }
  }

  function buildSummary() {
    const normalizeDisciplina = (value) => {
      if (!value) return "—";
      const raw = value.toString().trim().toLowerCase();
      if (raw.includes("mat")) return "Matemática";
      if (raw.includes("bio")) return "Biologia";
      if (raw.includes("qui")) return "Química";
      if (raw.includes("fis")) return "Física";
      if (raw.includes("his")) return "História";
      if (raw.includes("geo")) return "Geografia";
      if (raw.includes("soc")) return "Sociologia";
      if (raw.includes("fil")) return "Filosofia";
      if (raw.includes("port") || raw.includes("lingua")) return "Português";
      if (raw.includes("lit")) return "Literatura";
      if (raw.includes("art")) return "Artes";
      return value.toString().trim();
    };

    const items = responderState.questoes.map((q, idx) => {
      const selected = responderState.respostas[q.id];
      const correct = (q.gabarito || "").toString().trim().toLowerCase();
      const isCorrect = selected && correct && selected.toLowerCase() === correct;
      return {
        seq: idx + 1,
        num: q.ordem || q.id || idx + 1,
        selected: selected ? selected.toUpperCase() : "—",
        correct: correct ? correct.toUpperCase() : "—",
        isCorrect,
        disciplina: normalizeDisciplina(q.disciplina),
        dificuldade: q.dificuldade || "—",
        dificuldadeSlug: (() => {
          const raw = (q.dificuldade || "").toString().toLowerCase();
          if (raw.includes("fac")) return "facil";
          if (raw.includes("dif")) return "dificil";
          return "medio";
        })()
      };
    });
    const correctCount = items.filter((i) => i.isCorrect).length;
    return { items, correctCount, total: items.length };
  }

  function openSummary(summary) {
    if (!responderUI || !responderUI.summary) return;
    responderUI.summaryTitle.textContent = responderState.lista?.titulo || "Resumo da lista";
    responderUI.summaryCorrect.textContent = `${summary.correctCount}/${summary.total}`;
    responderUI.summaryWrong.textContent = summary.total - summary.correctCount;
    responderUI.summaryList.innerHTML = "";
    summary.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = `summary-item ${item.isCorrect ? "is-correct" : "is-wrong"}`;
      row.innerHTML = `
        <div class="summary-num">${item.num}</div>
        <div class="summary-body">
          <div class="summary-line"><strong>Marcada:</strong> ${item.selected}</div>
          <div class="summary-line"><strong>Gabarito:</strong> ${item.correct}</div>
        </div>
        <span class="summary-chip ${item.isCorrect ? "ok" : "bad"}">${item.isCorrect ? "Acertou" : "Errou"}</span>
      `;
      responderUI.summaryList.appendChild(row);
    });
    setSummaryStatus("Salvando no Supabase...", "pending");
    responderUI.summary.classList.add("open");
  }

  function setSummaryStatus(message, state = "info") {
    if (!responderUI || !responderUI.summaryStatus) return;
    responderUI.summaryStatus.textContent = message;
    responderUI.summaryStatus.dataset.state = state;
  }

  function closeSummary() {
    if (!responderUI || !responderUI.summary) return;
    responderUI.summary.classList.remove("open");
  }

  async function handleFinalizeClick() {
    if (responderState.isReadonly) {
      responderState.view = "report";
      responderState.reportPage = 1;
      renderResponder();
      return;
    }
    if (!isAllAnswered()) {
      alert("Responda todas as questões antes de finalizar.");
      return;
    }
    await enrichWithGabarito(responderState.questoes);
    const summary = buildSummary();
    const originalLabel = responderUI.finalizeBtn.textContent;
    responderUI.finalizeBtn.disabled = true;
    responderUI.finalizeBtn.textContent = "Finalizando...";
    closeSummary();
    const persisted = await persistFinalizacao(summary);
    responderUI.finalizeBtn.disabled = false;
    responderUI.finalizeBtn.textContent = persisted ? "Relatório Geral" : originalLabel;
    if (persisted) {
      responderState.view = "report";
      responderState.reportPage = 1;
      renderResponder();
    }
  }

  async function persistFinalizacao(summary) {
    if (!supabaseClient) {
      setSummaryStatus("Supabase não está configurado.", "error");
      return false;
    }

    try {
      await adminGuardPromise;
      const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
      if (userErr || !user) {
        setSummaryStatus("Não foi possível identificar o usuário autenticado.", "error");
        return false;
      }

      const nowIso = new Date().toISOString();
      const rows = responderState.questoes.map((q) => {
        const selected = responderState.respostas[q.id];
        const correct = (q.gabarito || "").toString().trim().toLowerCase();
        const isCorrect = selected && correct && selected.toLowerCase() === correct;
        return {
          lista_id: responderState.lista.id,
          user_id: user.id,
          questao_id: q.id,
          resposta: selected || null,
          correta: !!isCorrect,
          status: "respondida",
          respondida_em: nowIso,
          created_at: nowIso
        };
      });

      let queuedOk = false;
      try {
        const queuedDelete = await queueDbDelete("lista_respostas", `${responderState.lista.id}:${user.id}:all`, user.id, [
          { op: "eq", column: "lista_id", value: responderState.lista.id },
          { op: "eq", column: "user_id", value: user.id },
        ]);
        queuedOk = Boolean(queuedDelete);
        if (queuedOk) {
          for (const row of rows) {
            const q = await queueDbUpsert("lista_respostas", `${row.lista_id}:${row.user_id}:${row.questao_id}`, row, user.id);
            if (!q) {
              queuedOk = false;
              break;
            }
          }
        }
      } catch (queueErr) {
        console.warn("[Listas] Falha ao enfileirar sincronização da finalização:", queueErr);
        queuedOk = false;
      }

      saveFinalizacaoLocal(responderState.lista.id, user.id);
      responderState.lista.user_status = "concluida";
      responderState.isReadonly = true;

      if (queuedOk) {
        const flush = await flushQueuedSync(12000).catch(() => null);
        if (flush?.ok) {
          setSummaryStatus("Respostas salvas e sincronizadas com o Supabase.", "success");
        } else {
          setSummaryStatus("Respostas salvas neste dispositivo. A sincronização com o Supabase será tentada novamente.", "pending");
        }
      } else {
        setSummaryStatus("Respostas salvas neste dispositivo. A sincronização com o Supabase será tentada novamente.", "pending");
      }
      carregarListas();
      return true;
    } catch (err) {
      console.error("[Listas] Erro ao salvar finalização:", err);
      const msg = err?.message || err?.details || "Não foi possível salvar no Supabase. Verifique a estrutura da tabela e tente novamente.";
      setSummaryStatus(msg, "error");
      return false;
    }
  }

  async function responderLista(lista) {
    const ui = ensureResponderUI();
    responderState.loadToken += 1;
    const activeLoadToken = responderState.loadToken;
    responderState.lista = lista;
    responderState.isReadonly = isListaConcluida(lista) || isListaFinalizadaLocalmente(lista.id, responderState.userId);
    const localRespostas = loadRespostas(lista.id);
    responderState.respostas = localRespostas;
    responderState.pendingRespostas = {};
    responderState.currentIndex = 0;
    responderState.view = responderState.isReadonly ? "report" : "question";
    responderState.reportPage = 1;
    responderState.lastRenderKey = null;
    ui.overlay.classList.add("open");
    ui.overlay.dataset.loading = "true";
    responderState.open = true;
    const questoes = await fetchListaQuestoes(lista.id);
    if (!responderState.open || responderState.loadToken !== activeLoadToken || responderState.lista?.id !== lista.id) return;
    responderState.questoes = questoes;
    if (supabaseClient) {
      try {
        await adminGuardPromise;
        const { data: { user } } = await supabaseClient.auth.getUser();
        responderState.userId = user?.id || null;
        responderState.isReadonly = isListaConcluida(lista) || isListaFinalizadaLocalmente(lista.id, responderState.userId);
        if (responderState.userId) {
          const { data: respRows } = await supabaseClient
            .from("lista_respostas")
            .select("questao_id, resposta")
            .eq("lista_id", lista.id)
            .eq("user_id", responderState.userId);
          const remote = {};
          if (Array.isArray(respRows)) {
            respRows.forEach((row) => {
              if (row.questao_id != null && row.resposta) remote[row.questao_id] = row.resposta;
            });
          }
          if (Object.keys(remote).length > 0) {
            if (responderState.open && responderState.loadToken === activeLoadToken && responderState.lista?.id === lista.id) {
              // Prioriza respostas locais/em memória para evitar perder marcações recém-feitas.
              responderState.respostas = { ...remote, ...responderState.respostas };
              saveRespostas(lista.id, responderState.respostas);
            }
          } else if (Object.keys(localRespostas).length > 0) {
            saveAllRespostasToSupabase({
              listaId: lista.id,
              userId: responderState.userId,
              questoes,
              respostas: localRespostas
            });
          }
        }
      } catch (err) {
        console.warn("[Responder] Falha ao carregar respostas remotas:", err);
      }
    }
    if (!responderState.open || responderState.loadToken !== activeLoadToken || responderState.lista?.id !== lista.id) return;
    if (responderState.isReadonly) {
      await enrichWithGabarito(responderState.questoes);
    }
    ui.overlay.dataset.loading = "false";
    if (!questoes.length) {
      ui.title.textContent = "Nenhuma questão encontrada";
      ui.subtitle.textContent = "";
      ui.options.innerHTML = "";
      ui.answers.innerHTML = "";
      return;
    }
    renderResponder();
  }

  function closeResponder() {
    if (responderUI) responderUI.overlay.classList.remove("open");
    responderState.open = false;
  }

  /**
   * Gera o PDF de uma lista, buscando as questões em `lista_itens` e recorrendo
   * a fontes alternativas (cache local, depois `lista_respostas`) quando a
   * fonte primária está vazia — cenário comum em listas antigas ou corrompidas.
   * @param {Object} lista Registro da lista, precisa conter `id`.
   * @returns {Promise<void>}
   */
  async function gerarPdf(lista) {
    if (!lista?.id) {
      alert("Erro: lista sem identificador. Recarregue a página e tente novamente.");
      return;
    }
    setLoading(true);
    let questoes = await fetchListaQuestoes(lista.id);

    // Fallback 1: cache local criado no momento de salvar a lista
    if (!questoes.length) {
      try {
        const cached = localStorage.getItem(`lista-questoes-cache-${lista.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length) questoes = parsed;
        }
      } catch (_) {}
    }

    // Fallback 2: recupera via lista_respostas e repara lista_itens em background
    if (!questoes.length && supabaseClient) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user?.id) {
          const { data: respostasRows } = await supabaseClient
            .from("lista_respostas")
            .select("questao_id")
            .eq("lista_id", lista.id)
            .eq("user_id", user.id);

          const respostaIds = (respostasRows || []).map((r) => r.questao_id).filter(Boolean);
          if (respostaIds.length) {
            const SELECT_FIELDS = `
              id, ano, modalidade, disciplina, dificuldade, tags,
              enunciado, sub_enunciado, imagem_url, fonte,
              alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
              alternativa_a_imagem_url, alternativa_b_imagem_url, alternativa_c_imagem_url,
              alternativa_d_imagem_url, alternativa_e_imagem_url
            `;
            const CHUNK_SIZE = 200;
            let recovered = [];
            for (let i = 0; i < respostaIds.length; i += CHUNK_SIZE) {
              const chunk = respostaIds.slice(i, i + CHUNK_SIZE);
              const { data } = await supabaseClient.from("questions").select(SELECT_FIELDS).in("id", chunk);
              if (data) recovered = recovered.concat(data);
            }
            if (recovered.length) {
              questoes = recovered;
              // Repara lista_itens silenciosamente em background
              (async () => {
                try {
                  for (let idx = 0; idx < recovered.length; idx += 1) {
                    const q = recovered[idx];
                    await queueDbUpsert("lista_itens", `${lista.id}:${q.id}`, {
                      lista_id: lista.id,
                      questao_id: q.id,
                      ordem: idx + 1,
                      user_id: user.id
                    }, user.id);
                  }
                  flushQueuedSync(15000);
                } catch (_) {}
              })();
            }
          }
        }
      } catch (_) {}
    }

    setLoading(false);
    if (!questoes.length) {
      alert("Não encontrei as questões desta lista.\n\nPossíveis causas:\n• A sincronização ainda não foi concluída — aguarde alguns segundos e tente novamente.\n• Erro de acesso ao banco de dados — verifique o console (F12) para mais detalhes.");
      return;
    }
    await enrichWithGabarito(questoes);
    const payload = {
      titulo: lista.titulo || "Lista de Questões",
      embaralhar: false,
      ignorarCorretas: false,
      itens: [],
      questoes,
      salvoEm: new Date().toISOString()
    };
    localStorage.setItem("lista-diagramacao", JSON.stringify(payload));
    window.location.href = "/questoes/diagramacao";
  }

  async function excluirLista(listaId) {
    if (!supabaseClient || !listaId) return;

    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !user) {
      alert("Não foi possível identificar o usuário autenticado.");
      return;
    }

    const listaObj = currentListas.find((l) => l.id === listaId);
    if (listaObj?.owner_id && listaObj.owner_id !== user.id) {
      alert("Você não tem permissão para excluir esta lista.");
      return;
    }

    const ok = confirm("Excluir esta lista? Itens e respostas associados serão removidos.");
    if (!ok) return;

    let queued = false;
    try {
      queued = Boolean(await queueDbDelete("lista_respostas", `${listaId}:${user.id}:all`, user.id, [
        { op: "eq", column: "lista_id", value: listaId },
        { op: "eq", column: "user_id", value: user.id },
      ]));
      if (queued) {
        queued = Boolean(await queueDbDelete("listas", String(listaId), user.id, [
          { op: "eq", column: "id", value: listaId },
          { op: "eq", column: "owner_id", value: user.id },
        ]));
      }
    } catch (queueErr) {
      console.warn("[Listas] Falha ao enfileirar exclusão:", queueErr);
      queued = false;
    }

    if (queued) {
      flushQueuedSync(12000).catch(() => null);
    } else {
      try {
        const del1 = await supabaseClient.from("lista_respostas").delete()
          .eq("lista_id", listaId).eq("user_id", user.id);
        if (del1.error) throw del1.error;
        const del2 = await supabaseClient.from("listas").delete()
          .eq("id", listaId).eq("owner_id", user.id);
        if (del2.error) throw del2.error;
      } catch (err) {
        console.error("[Listas] Erro inesperado ao excluir lista:", err);
        alert("Erro inesperado ao excluir a lista.");
        return;
      }
    }

    try {
      localStorage.removeItem(respostaKey(listaId));
    } catch (_) {}
    currentListas = currentListas.filter((l) => l.id !== listaId);
    renderLists(currentListas);
    updateFilterCounts(currentListas);
  }

  function bindTabsAndFilters() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabButtons.forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        currentView = btn.dataset.view || "mine";
        toggleHeaderCreateVisibility(currentView === "mine");
        setEmpty(false);
        setLoading(false);
        updateFilterCounts([]);
        carregarListas();
      });
    });

    const sideItems = document.querySelectorAll(".side-item");
    sideItems.forEach((item) => {
      const countEl = document.createElement("span");
      countEl.className = "side-count";
      countEl.textContent = "…";
      item.appendChild(countEl);

      item.addEventListener("click", () => {
        sideItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        currentFilter = item.dataset.filter || "all";
        carregarListas();
      });
    });
  }

  function updateFilterCounts(listas) {
    if (currentView === "recommended") {
      document.querySelectorAll(".side-item").forEach((item) => {
        const countEl = item.querySelector(".side-count");
        if (countEl) countEl.textContent = "—";
      });
      return;
    }

    const total = listas.length;
    const resolvendo = listas.filter((l) => {
      const status = getListaStatus(l);
      return status !== "concluida" && status !== "finalizada" && status !== "desistiu";
    }).length;
    const finalizadas = listas.filter((l) => {
      const status = getListaStatus(l);
      return status === "concluida" || status === "finalizada";
    }).length;

    document.querySelectorAll(".side-item").forEach((item) => {
      const filter = item.dataset.filter;
      const countEl = item.querySelector(".side-count");
      if (!countEl) return;
      if (filter === "all") countEl.textContent = total;
      else if (filter === "resolvendo") countEl.textContent = resolvendo;
      else if (filter === "finalizadas") countEl.textContent = finalizadas;
    });
  }

  setupRenameModal();
  setupModeModal();
  bindTabsAndFilters();
  renderHeaderCreateCard();
  toggleHeaderCreateVisibility(currentView === "mine");
  carregarListas();
})();
