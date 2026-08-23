(function () {
  const MODAL_FX_MS = 190;

  const SUBJECT_LABELS = {
    matematica: "Matemática",
    fisica: "Física",
    biologia: "Biologia",
    quimica: "Química",
    historia: "História",
    geografia: "Geografia",
    sociologia: "Sociologia",
    filosofia: "Filosofia",
    linguagens: "Linguagens",
    ingles: "Inglês",
    redacao: "Redação",
  };

  const MOTIVO_LABELS = {
    nao_sabia_conteudo: "Não sabia o conteúdo",
    erro_interpretacao: "Erro de interpretação",
    erro_calculo: "Erro de cálculo",
    falta_tempo: "Falta de tempo",
    confundi_alternativas: "Confundi as alternativas",
    erro_atencao: "Erro de atenção / descuido",
    chute: "Chute sem certeza",
    outro: "Outro",
  };

  const DIFICULDADE_LABELS = {
    facil: "Fácil",
    medio: "Médio",
    dificil: "Difícil",
  };

  const state = {
    userId: null,
    simulados: [],
    erros: [],
    revisoes: new Set(),
    activeSimuladoId: null,
    modalFxTimer: null,
    selectedDificuldade: null,
    datePopoverTarget: null,
    datePopoverViewDate: null,
    editingSimuladoId: null,
    editingErroId: null,
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateBR(isoDate) {
    const parts = String(isoDate || "").split("-");
    if (parts.length !== 3) return isoDate || "";
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }

  function formatDateRangeBR(dataDia1, dataDia2) {
    if (dataDia1 && dataDia2) return `${formatDateBR(dataDia1)} → ${formatDateBR(dataDia2)}`;
    if (dataDia1) return formatDateBR(dataDia1);
    if (dataDia2) return formatDateBR(dataDia2);
    return "";
  }

  function effectiveDate(s) {
    return s.data_dia1 || s.data_dia2 || "";
  }

  function sortByMostRecent(list) {
    return list.sort((a, b) => (effectiveDate(b) > effectiveDate(a) ? 1 : effectiveDate(b) < effectiveDate(a) ? -1 : 0));
  }

  function sumAcertos(s) {
    const fields = [s.acertos_linguagens, s.acertos_humanas, s.acertos_matematica, s.acertos_natureza];
    const filled = fields.filter((v) => v != null);
    if (!filled.length) return null;
    return filled.reduce((acc, v) => acc + Number(v), 0);
  }

  async function getUserId() {
    const client = window.supabaseClient;
    if (!client) return null;
    try {
      const { data } = await client.auth.getSession();
      return data?.session?.user?.id || null;
    } catch (_) {
      return null;
    }
  }

  /* ─── Data fetching ─────────────────────────────────── */
  async function fetchSimulados() {
    const client = window.supabaseClient;
    if (!client || !state.userId) return [];

    const [simuladosRes, errosRes] = await Promise.all([
      client
        .from("simulados")
        .select("*")
        .eq("user_id", state.userId)
        .order("created_at", { ascending: false }),
      client.from("simulado_erros").select("simulado_id").eq("user_id", state.userId),
    ]);

    if (simuladosRes.error) {
      console.error("Erro ao buscar simulados:", simuladosRes.error);
      return [];
    }

    const countsBySimulado = {};
    (errosRes.data || []).forEach((row) => {
      countsBySimulado[row.simulado_id] = (countsBySimulado[row.simulado_id] || 0) + 1;
    });

    return sortByMostRecent(
      (simuladosRes.data || []).map((s) => ({ ...s, errosCount: countsBySimulado[s.id] || 0 }))
    );
  }

  async function fetchRevisoes(simuladoId) {
    const client = window.supabaseClient;
    if (!client || !state.userId) return new Set();
    const { data, error } = await client
      .from("simulado_revisoes")
      .select("materia, conteudo")
      .eq("simulado_id", simuladoId)
      .eq("user_id", state.userId);
    if (error) { console.error("Erro ao buscar revisões:", error); return new Set(); }
    return new Set((data || []).map((r) => `${r.materia}::${r.conteudo}`));
  }

  async function fetchErros(simuladoId) {
    const client = window.supabaseClient;
    if (!client) return [];
    const { data, error } = await client
      .from("simulado_erros")
      .select("*")
      .eq("simulado_id", simuladoId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erro ao buscar erros do simulado:", error);
      return [];
    }
    return data || [];
  }

  /* ─── Rendering: lista de simulados ───────────────────── */
  function buildPerformanceBadgeHtml(acertosSum, questoesTotal) {
    if (acertosSum == null || !questoesTotal) return "";
    const pct = (acertosSum / questoesTotal) * 100;
    let label, modifier;
    if (pct <= 60) {
      label = "Precisa melhorar!"; modifier = "needs-improvement";
    } else if (pct <= 70) {
      label = "Construção..."; modifier = "construction";
    } else if (pct <= 80) {
      label = "Mediano"; modifier = "median";
    } else if (pct <= 85) {
      label = "Muito bom!"; modifier = "good";
    } else {
      label = "Nível Medicina!"; modifier = "medicine";
    }
    return `<span class="perf-badge perf-badge--${modifier}">${label}</span>`;
  }

  function buildSimuladoCardHtml(s) {
    const dificuldadeLabel = DIFICULDADE_LABELS[s.dificuldade] || "";
    const acertosSum = sumAcertos(s);
    const perfBadge = buildPerformanceBadgeHtml(acertosSum, s.questoes_total);
    const dificuldadeBadge = dificuldadeLabel
      ? `<span class="simulado-badge simulado-badge--${s.dificuldade}">${dificuldadeLabel}</span>`
      : "";
    const scoreHtml =
      acertosSum != null
        ? `<span><strong>${acertosSum}</strong>${s.questoes_total != null ? `/${s.questoes_total}` : ""} acertos</span>${perfBadge}${dificuldadeBadge}`
        : dificuldadeBadge;
    const redacaoHtml = s.nota_redacao != null ? `<span>Redação <strong>${s.nota_redacao}</strong></span>` : "";

    return `
      <article class="simulado-card" data-id="${s.id}">
        <div class="simulado-card__top">
          <div class="simulado-card__info">
            <p class="simulado-card__name" data-name>${escapeHtml(s.nome)}</p>
            <p class="simulado-card__date">${formatDateRangeBR(s.data_dia1, s.data_dia2)}</p>
          </div>
          <div class="simulado-card__actions">
            <div class="simulado-card__menu-wrap">
              <button type="button" class="simulado-card__menu-btn" data-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="Opções do simulado">⋯</button>
              <div class="simulado-card__menu" data-menu hidden>
                <button type="button" data-action="edit">Editar</button>
                <button type="button" data-action="rename">Renomear</button>
                <button type="button" data-action="delete">Excluir</button>
              </div>
            </div>
          </div>
        </div>
        <div class="simulado-card__stats">${scoreHtml}${redacaoHtml}</div>
        <div class="simulado-card__erros-count">
          <span>${s.errosCount} erro${s.errosCount === 1 ? "" : "s"} mapeado${s.errosCount === 1 ? "" : "s"}</span>
        </div>
      </article>
    `;
  }

  function renderList() {
    els.simuladosGrid.innerHTML = state.simulados.map(buildSimuladoCardHtml).join("");
    els.simuladosEmpty.hidden = state.simulados.length > 0;
    els.openRaioXBtn.hidden = state.simulados.length < 2;
  }

  /* ─── Rendering: detalhe + erros ──────────────────────── */
  function buildSimuladoDetailHtml(s) {
    const dificuldadeLabel = DIFICULDADE_LABELS[s.dificuldade] || "";
    const metaParts = [];
    if (s.acertos_linguagens != null) metaParts.push(`<span>Ling <strong>${s.acertos_linguagens}</strong></span>`);
    if (s.acertos_humanas != null) metaParts.push(`<span>Hum <strong>${s.acertos_humanas}</strong></span>`);
    if (s.acertos_matematica != null) metaParts.push(`<span>Mat <strong>${s.acertos_matematica}</strong></span>`);
    if (s.acertos_natureza != null) metaParts.push(`<span>Nat <strong>${s.acertos_natureza}</strong></span>`);
    if (s.nota_redacao != null) metaParts.push(`<span>Redação <strong>${s.nota_redacao}</strong></span>`);
    if (s.questoes_total != null) metaParts.push(`<span>Questões <strong>${s.questoes_total}</strong></span>`);

    return `
      <div class="simulado-detail__title">${escapeHtml(s.nome)}</div>
      <div class="simulado-detail__meta">
        <span>${formatDateRangeBR(s.data_dia1, s.data_dia2)}</span>
        ${dificuldadeLabel ? `<span class="simulado-badge simulado-badge--${s.dificuldade}">${dificuldadeLabel}</span>` : ""}
        ${metaParts.join("")}
      </div>
      ${s.observacoes ? `<p class="simulado-detail__obs">${escapeHtml(s.observacoes)}</p>` : ""}
    `;
  }

  function buildErroCardHtml(e) {
    const materiaLabel = SUBJECT_LABELS[e.materia] || e.materia;
    const motivoLabel = MOTIVO_LABELS[e.motivo] || e.motivo;
    const topicLine = e.subtopico ? `${escapeHtml(e.conteudo)} • ${escapeHtml(e.subtopico)}` : escapeHtml(e.conteudo);

    return `
      <article class="erro-card" data-id="${e.id}">
        <div class="erro-card__top">
          <div>
            <p class="erro-card__subject">${escapeHtml(materiaLabel)}${e.numero_questao != null ? `<span class="erro-card__questao">Q.${e.numero_questao}</span>` : ""}</p>
            <p class="erro-card__topic" data-topic>${topicLine}</p>
          </div>
          <div class="erro-card__menu-wrap">
            <button type="button" class="erro-card__menu-btn" data-erro-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="Opções do erro">⋯</button>
            <div class="erro-card__menu" data-erro-menu hidden>
              <button type="button" data-erro-action="edit">Editar</button>
              <button type="button" data-erro-action="rename">Renomear</button>
              <button type="button" data-erro-action="delete">Excluir</button>
            </div>
          </div>
        </div>
        <span class="erro-card__motivo">${escapeHtml(motivoLabel)}</span>
        ${e.observacao ? `<p class="erro-card__obs">${escapeHtml(e.observacao)}</p>` : ""}
      </article>
    `;
  }

  /* ─── Menu dos erros ──────────────────────────────────── */
  function closeAllErroCardMenus() {
    els.errosGrid.querySelectorAll("[data-erro-menu]").forEach((m) => { m.hidden = true; });
    els.errosGrid.querySelectorAll("[data-erro-menu-toggle]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  function toggleErroCardMenu(toggleBtn) {
    const menu = toggleBtn.parentElement.querySelector("[data-erro-menu]");
    const willOpen = menu.hidden;
    closeAllErroCardMenus();
    menu.hidden = !willOpen;
    toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  }

  function openEditErro(erro) {
    state.editingErroId = erro.id;
    els.erroFormTitle.textContent = "Editar erro";
    els.erroFormSub.textContent = "Atualize os dados deste erro mapeado.";
    csSelect("materia", erro.materia, SUBJECT_LABELS[erro.materia] || erro.materia);
    csSelect("conteudo", erro.conteudo, erro.conteudo);
    if (erro.subtopico) csSelect("subtopico", erro.subtopico, erro.subtopico);
    els.erroNumeroQuestao.value = erro.numero_questao ?? "";
    csSelect("motivo", erro.motivo, MOTIVO_LABELS[erro.motivo] || erro.motivo);
    els.erroObservacao.value = erro.observacao || "";
    openModal(els.erroFormModal);
  }

  function startErroRename(cardEl, erro) {
    const topicEl = cardEl.querySelector("[data-topic]");
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 160;
    input.className = "erro-card__conteudo-input";
    input.value = erro.conteudo;
    topicEl.replaceWith(input);
    input.focus();
    input.select();

    let settled = false;
    const finish = async (commit) => {
      if (settled) return;
      settled = true;
      const novoConteudo = input.value.trim();
      if (commit && novoConteudo && novoConteudo !== erro.conteudo) {
        await renameErroConteudo(erro.id, novoConteudo);
      } else {
        renderDetail();
      }
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); finish(true); }
      else if (event.key === "Escape") { event.preventDefault(); finish(false); }
    });
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("click", (event) => event.stopPropagation());
  }

  async function renameErroConteudo(id, novoConteudo) {
    const client = window.supabaseClient;
    const { error } = await client.from("simulado_erros").update({ conteudo: novoConteudo }).eq("id", id);
    if (error) {
      console.error("Erro ao renomear:", error);
      window.alert("Não foi possível renomear o erro.");
    } else {
      const erro = state.erros.find((e) => e.id === id);
      if (erro) erro.conteudo = novoConteudo;
    }
    renderDetail();
  }

  function buildChecklistItems(erros) {
    const groups = {};
    for (const e of erros) {
      const key = `${e.materia}::${e.conteudo}`;
      if (!groups[key]) groups[key] = { materia: e.materia, conteudo: e.conteudo, count: 0, motivos: [] };
      groups[key].count += 1;
      groups[key].motivos.push(e.motivo);
    }
    const MOTIVO_PRIORITY = { nao_sabia_conteudo: 2, erro_interpretacao: 3 };
    const tierOf = (item) => {
      if (item.count > 1) return 1;
      return MOTIVO_PRIORITY[item.motivos[0]] || 4;
    };
    return Object.values(groups).sort((a, b) => {
      const ta = tierOf(a), tb = tierOf(b);
      if (ta !== tb) return ta - tb;
      return b.count - a.count;
    });
  }

  function renderRevisaoChecklist() {
    if (state.erros.length < 2) {
      els.revisaoToggle.hidden = true;
      els.revisaoPanelSection.hidden = true;
      return;
    }
    els.revisaoToggle.hidden = false;
    const items = buildChecklistItems(state.erros);
    const checkedCount = items.filter((item) => state.revisoes.has(`${item.materia}::${item.conteudo}`)).length;
    const isComplete = checkedCount === items.length && items.length > 0;
    els.revisaoCounter.textContent = `${checkedCount}/${items.length}`;
    els.revisaoCounter.classList.toggle("is-complete", isComplete);

    els.revisaoList.innerHTML = items.map((item) => {
      const key = `${item.materia}::${item.conteudo}`;
      const checked = state.revisoes.has(key);
      const materiaLabel = SUBJECT_LABELS[item.materia] || item.materia;
      const checkSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
      return `
        <li class="revisao-item${checked ? " is-checked" : ""}" data-materia="${escapeHtml(item.materia)}" data-conteudo="${escapeHtml(item.conteudo)}">
          <button type="button" class="revisao-item__check" aria-label="${checked ? "Desmarcar revisão de" : "Marcar como revisado:"} ${escapeHtml(item.conteudo)}" data-revisao-toggle>${checkSvg}</button>
          <div class="revisao-item__body">
            <span class="revisao-item__conteudo" title="${escapeHtml(item.conteudo)}">${escapeHtml(item.conteudo)}</span>
            <div class="revisao-item__tags">
              <span class="revisao-item__materia">${escapeHtml(materiaLabel)}</span>
              ${item.count > 1 ? `<span class="revisao-item__count">${item.count}×</span>` : ""}
            </div>
          </div>
        </li>
      `;
    }).join("");
  }

  async function toggleRevisao(materia, conteudo) {
    const client = window.supabaseClient;
    if (!client || !state.userId || !state.activeSimuladoId) return;
    const key = `${materia}::${conteudo}`;
    const wasChecked = state.revisoes.has(key);
    // Optimistic update
    if (wasChecked) { state.revisoes.delete(key); } else { state.revisoes.add(key); }
    renderRevisaoChecklist();
    if (wasChecked) {
      const { error } = await client
        .from("simulado_revisoes")
        .delete()
        .eq("user_id", state.userId)
        .eq("simulado_id", state.activeSimuladoId)
        .eq("materia", materia)
        .eq("conteudo", conteudo);
      if (error) {
        console.error("Erro ao remover revisão:", error);
        state.revisoes.add(key);
        renderRevisaoChecklist();
      }
    } else {
      const { error } = await client
        .from("simulado_revisoes")
        .insert({ user_id: state.userId, simulado_id: state.activeSimuladoId, materia, conteudo });
      if (error) {
        console.error("Erro ao salvar revisão:", error);
        state.revisoes.delete(key);
        renderRevisaoChecklist();
      }
    }
  }

  function renderDetail() {
    const simulado = state.simulados.find((s) => s.id === state.activeSimuladoId);
    if (!simulado) return;
    els.simuladoDetailCardContent.innerHTML = buildSimuladoDetailHtml(simulado);
    els.errosGrid.innerHTML = state.erros.map(buildErroCardHtml).join("");
    els.errosEmpty.hidden = state.erros.length > 0;
    renderRevisaoChecklist();
  }

  function showListView() {
    els.simuladoDetailView.hidden = true;
    els.simuladosListView.hidden = false;
    state.activeSimuladoId = null;
    state.revisoes = new Set();
    renderList();
  }

  async function showDetailView(simuladoId) {
    state.activeSimuladoId = simuladoId;
    state.revisoes = new Set();
    els.simuladosListView.hidden = true;
    els.simuladoDetailView.hidden = false;
    els.simuladoDetailCardContent.innerHTML = "";
    els.errosGrid.innerHTML = "";
    els.revisaoToggle.hidden = true;
    els.revisaoToggle.classList.remove("is-active");
    els.revisaoToggle.setAttribute("aria-expanded", "false");
    els.revisaoPanelSection.hidden = true;
    const [erros, revisoes] = await Promise.all([fetchErros(simuladoId), fetchRevisoes(simuladoId)]);
    state.erros = erros;
    state.revisoes = revisoes;
    renderDetail();
  }

  /* ─── Raio-X ───────────────────────────────────────────── */
  function computeRaioXItems(allErros, dismissals) {
    const groups = {};
    for (const erro of allErros) {
      const key = `${erro.materia}::${erro.conteudo}`;
      if (!groups[key]) {
        groups[key] = { materia: erro.materia, conteudo: erro.conteudo, simulados: new Set(), totalErros: 0, latestAt: null };
      }
      groups[key].simulados.add(erro.simulado_id);
      groups[key].totalErros++;
      if (!groups[key].latestAt || erro.created_at > groups[key].latestAt) {
        groups[key].latestAt = erro.created_at;
      }
    }

    const dismissalMap = {};
    for (const d of dismissals) {
      dismissalMap[`${d.materia}::${d.conteudo}`] = d.dismissed_at;
    }

    return Object.values(groups)
      .filter((item) => item.simulados.size >= 2)
      .filter((item) => {
        const dismissedAt = dismissalMap[`${item.materia}::${item.conteudo}`];
        if (!dismissedAt) return true;
        return item.latestAt > dismissedAt;
      })
      .map((item) => ({ ...item, simuladoCount: item.simulados.size }))
      .sort((a, b) => b.simuladoCount - a.simuladoCount || b.totalErros - a.totalErros);
  }

  function renderRaioXModal(items) {
    if (items.length === 0) {
      els.raioXList.innerHTML = `
        <div class="raio-x-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p>Nenhum conteúdo recorrente!</p>
          <span>Continue registrando erros nos seus simulados para identificar padrões.</span>
        </div>`;
      return;
    }

    const checkSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
    const arrowSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;
    els.raioXList.innerHTML = items.map((item) => {
      const materiaLabel = SUBJECT_LABELS[item.materia] || item.materia;
      const errosText = `${item.totalErros} ${item.totalErros === 1 ? "erro" : "erros"}`;
      const simuladosText = `${item.simuladoCount} simulados`;
      return `
        <div class="raio-x-item" data-raio-x-materia="${escapeHtml(item.materia)}" data-raio-x-conteudo="${escapeHtml(item.conteudo)}">
          <div class="raio-x-item__info">
            <div class="raio-x-item__name" title="${escapeHtml(item.conteudo)}">${escapeHtml(item.conteudo)}</div>
            <div class="raio-x-item__meta">
              <span class="raio-x-item__materia">${escapeHtml(materiaLabel)}</span>
              <span class="raio-x-item__stat">${errosText} · ${simuladosText}</span>
            </div>
          </div>
          <div class="raio-x-item__actions">
            <span class="raio-x-item__badge">${item.totalErros}×</span>
            <div class="raio-x-item__menu-wrap">
              <button type="button" class="raio-x-item__menu-btn" data-raio-x-menu-toggle aria-label="Opções">⋯</button>
              <div class="raio-x-item__menu" data-raio-x-menu hidden>
                <button type="button" class="raio-x-item__menu-option" data-raio-x-dismiss data-materia="${escapeHtml(item.materia)}" data-conteudo="${escapeHtml(item.conteudo)}">
                  ${checkSvg} Já revisei!
                </button>
              </div>
            </div>
            <span class="raio-x-item__arrow" aria-hidden="true">${arrowSvg}</span>
          </div>
        </div>`;
    }).join("");
  }

  let _raioXFetchId = 0;
  let _raioXAllErros = [];
  let _raioXDismissals = [];

  async function openRaioXModal() {
    const client = window.supabaseClient;
    if (!client || !state.userId) return;
    els.raioXList.innerHTML = `<div class="raio-x-loading">Analisando seus erros…</div>`;
    openModal(els.raioXModal);
    const myId = ++_raioXFetchId;
    const [errosRes, dismissalsRes] = await Promise.all([
      client.from("simulado_erros").select("simulado_id, materia, conteudo, subtopico, motivo, observacao, created_at").eq("user_id", state.userId),
      client.from("raio_x_dismissals").select("materia, conteudo, dismissed_at").eq("user_id", state.userId),
    ]);
    if (myId !== _raioXFetchId) return;
    if (errosRes.error || dismissalsRes.error) {
      els.raioXList.innerHTML = `<div class="raio-x-error">Erro ao carregar dados. Tente novamente.</div>`;
      return;
    }
    _raioXAllErros = errosRes.data || [];
    _raioXDismissals = dismissalsRes.data || [];
    renderRaioXModal(computeRaioXItems(_raioXAllErros, _raioXDismissals));
  }

  function showRaioXDetail(materia, conteudo) {
    const materiaLabel = SUBJECT_LABELS[materia] || materia;
    const erros = _raioXAllErros
      .filter((e) => e.materia === materia && e.conteudo === conteudo)
      .sort((a, b) => a.simulado_id.localeCompare(b.simulado_id) || a.created_at.localeCompare(b.created_at));
    const calSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:5px;opacity:.55"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    els.raioXList.innerHTML = `
      <button class="raio-x-back" data-raio-x-back>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        <span>${escapeHtml(conteudo)}<span class="raio-x-back__sep">·</span>${escapeHtml(materiaLabel)}</span>
      </button>
      ${erros.map((erro) => {
        const simulado = state.simulados.find((s) => s.id === erro.simulado_id);
        const simuladoNome = simulado?.nome || "Simulado removido";
        const motivoLabel = MOTIVO_LABELS[erro.motivo] || erro.motivo;
        return `
          <div class="raio-x-detail-card">
            <div class="raio-x-detail-card__simulado">${calSvg}${escapeHtml(simuladoNome)}</div>
            <div class="raio-x-detail-card__meta">
              <span class="raio-x-detail-card__motivo">${escapeHtml(motivoLabel)}</span>
              ${erro.subtopico ? `<span class="raio-x-detail-card__topico">· ${escapeHtml(erro.subtopico)}</span>` : ""}
            </div>
            ${erro.observacao ? `<p class="raio-x-detail-card__obs">"${escapeHtml(erro.observacao)}"</p>` : ""}
          </div>`;
      }).join("")}`;
  }

  async function dismissRaioXItem(materia, conteudo) {
    const client = window.supabaseClient;
    if (!client || !state.userId) return;
    const itemEl = els.raioXList.querySelector(
      `[data-raio-x-dismiss][data-materia="${CSS.escape(materia)}"][data-conteudo="${CSS.escape(conteudo)}"]`
    )?.closest(".raio-x-item");
    if (itemEl) itemEl.classList.add("is-dismissing");
    const { error } = await client.from("raio_x_dismissals").upsert(
      { user_id: state.userId, materia, conteudo, dismissed_at: new Date().toISOString() },
      { onConflict: "user_id,materia,conteudo" }
    );
    if (error) {
      console.error("Erro ao salvar dismissal Raio-X:", error);
      if (itemEl) itemEl.classList.remove("is-dismissing");
      return;
    }
    const idx = _raioXDismissals.findIndex((d) => d.materia === materia && d.conteudo === conteudo);
    const entry = { materia, conteudo, dismissed_at: new Date().toISOString() };
    if (idx >= 0) { _raioXDismissals[idx] = entry; } else { _raioXDismissals.push(entry); }
    if (itemEl) {
      itemEl.remove();
      if (!els.raioXList.querySelector(".raio-x-item")) renderRaioXModal([]);
    }
  }

  /* ─── Modais ───────────────────────────────────────────── */
  function openModal(modalEl) {
    if (typeof modalEl.showModal === "function") {
      modalEl.showModal();
      modalEl.classList.remove("is-closing");
      void modalEl.offsetWidth;
      modalEl.classList.add("is-opening");
      if (state.modalFxTimer) window.clearTimeout(state.modalFxTimer);
      state.modalFxTimer = window.setTimeout(() => modalEl.classList.remove("is-opening"), MODAL_FX_MS);
      return;
    }
    modalEl.setAttribute("open", "open");
  }

  function closeModal(modalEl, onClosed) {
    if (modalEl.classList.contains("is-closing")) return;
    if (typeof modalEl.close === "function") {
      modalEl.classList.remove("is-opening");
      modalEl.classList.add("is-closing");
      if (state.modalFxTimer) window.clearTimeout(state.modalFxTimer);
      state.modalFxTimer = window.setTimeout(() => {
        modalEl.close();
        modalEl.classList.remove("is-closing");
        if (onClosed) onClosed();
      }, MODAL_FX_MS);
      return;
    }
    modalEl.removeAttribute("open");
    if (onClosed) onClosed();
  }

  function setDificuldade(value) {
    state.selectedDificuldade = value;
    els.simuladoDificuldade.querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-value") === value);
    });
  }

  function setSimuladoFormMode(simulado) {
    state.editingSimuladoId = simulado ? simulado.id : null;
    els.simuladoFormTitle.textContent = simulado ? "Editar simulado" : "Novo simulado";
    els.simuladoFormSub.textContent = simulado
      ? "Atualize os dados desse simulado."
      : "Registre os dados gerais do simulado que você fez.";
  }

  function fillDateField(target, iso) {
    const { hidden, label } = dateFieldRefs(target);
    if (iso) {
      hidden.value = iso;
      label.textContent = formatDateBR(iso);
      label.classList.remove("is-placeholder");
    } else {
      hidden.value = "";
      label.textContent = "Selecionar data";
      label.classList.add("is-placeholder");
    }
  }

  function openEditSimulado(simulado) {
    setSimuladoFormMode(simulado);
    els.simuladoNome.value = simulado.nome || "";
    fillDateField("dia1", simulado.data_dia1 || "");
    fillDateField("dia2", simulado.data_dia2 || "");
    setDificuldade(simulado.dificuldade || null);
    els.simuladoAcertosLing.value = simulado.acertos_linguagens ?? "";
    els.simuladoAcertosHum.value = simulado.acertos_humanas ?? "";
    els.simuladoAcertosMat.value = simulado.acertos_matematica ?? "";
    els.simuladoAcertosNat.value = simulado.acertos_natureza ?? "";
    els.simuladoNotaRedacao.value = simulado.nota_redacao ?? "";
    els.simuladoQuestoesTotal.value = simulado.questoes_total ?? "";
    els.simuladoObservacoes.value = simulado.observacoes || "";
    openModal(els.simuladoFormModal);
  }

  function resetSimuladoForm() {
    els.simuladoForm.reset();
    setDificuldade(null);
    resetDateFields();
    setSimuladoFormMode(null);
  }

  function resetErroForm() {
    state.editingErroId = null;
    els.erroFormTitle.textContent = "Adicionar erro";
    els.erroFormSub.textContent = "Mapeie o que você errou para revisar com foco.";
    els.erroForm.reset();
    csResetSelection("materia");
    populateConteudoOptions("");
    csResetSelection("motivo");
  }

  /* ─── Custom select genérico ─────────────────────────── */
  const cs = {};

  function csClose(key) {
    const s = cs[key]; if (!s || s.panel.hidden) return;
    s.panel.hidden = true;
    s.trigger.setAttribute("aria-expanded", "false");
    s.trigger.classList.remove("is-open");
  }

  function csOpen(key) {
    Object.keys(cs).forEach((k) => { if (k !== key) csClose(k); });
    const s = cs[key];
    s.panel.hidden = false;
    s.trigger.setAttribute("aria-expanded", "true");
    s.trigger.classList.add("is-open");
  }

  function csSelect(key, value, label) {
    const s = cs[key];
    s.hidden.value = value;
    if (value) {
      s.label.textContent = label;
      s.label.classList.remove("is-placeholder");
    } else {
      s.label.textContent = s._ph;
      s.label.classList.add("is-placeholder");
    }
    s.list.querySelectorAll(".custom-select__option").forEach((o) =>
      o.classList.toggle("is-selected", o.dataset.value === value)
    );
    csClose(key);
    if (s._change) s._change(value);
  }

  function csPopulate(key, items, ph, { disabled = false, clearable = false } = {}) {
    const s = cs[key];
    s._ph = ph;
    s.hidden.value = "";
    s.label.textContent = ph;
    s.label.classList.add("is-placeholder");
    csClose(key);
    if (disabled || !items.length) {
      s.trigger.disabled = true;
      s.list.innerHTML = "";
      return;
    }
    s.trigger.disabled = false;
    s.list.innerHTML =
      (clearable ? `<li class="custom-select__option custom-select__option--clear" data-value="">Limpar seleção</li>` : "") +
      items.map(([v, l]) =>
        `<li class="custom-select__option" role="option" data-value="${escapeHtml(v)}">${escapeHtml(l)}</li>`
      ).join("");
  }

  function csResetSelection(key) {
    const s = cs[key]; if (!s) return;
    s.hidden.value = "";
    s.label.textContent = s._ph || "Selecione";
    s.label.classList.add("is-placeholder");
    s.list.querySelectorAll(".custom-select__option").forEach((o) => o.classList.remove("is-selected"));
    csClose(key);
  }

  function registerCustomSelects() {
    const reg = (key, wrap, trigger, label, panel, list, hidden, change) => {
      cs[key] = { wrap: els[wrap], trigger: els[trigger], label: els[label], panel: els[panel], list: els[list], hidden: els[hidden], _change: change, _ph: "Selecione" };
    };
    reg("materia",  "erroMateriaWrap",  "erroMateriaTrigger",  "erroMateriaLabel",  "erroMateriaPanel",  "erroMateriaList",  "erroMateria",  (v) => populateConteudoOptions(v));
    reg("conteudo", "erroConteudoWrap", "erroConteudoTrigger", "erroConteudoLabel", "erroConteudoPanel", "erroConteudoList", "erroConteudo", (v) => populateSubtopicoOptions(els.erroMateria.value, v));
    reg("subtopico","erroSubtopicoWrap","erroSubtopicoTrigger","erroSubtopicoLabel","erroSubtopicoPanel","erroSubtopicoList","erroSubtopico", null);
    reg("motivo",   "erroMotivoWrap",   "erroMotivoTrigger",   "erroMotivoLabel",   "erroMotivoPanel",   "erroMotivoList",   "erroMotivo",   null);
  }

  /* ─── Matéria / Conteúdo / Subtópico cascata ─────────── */
  function populateMateriaOptions() {
    csPopulate("materia", Object.entries(SUBJECT_LABELS), "Selecione");
  }

  function populateConteudoOptions(materiaKey) {
    const conteudos = window.materiasData?.[materiaKey]?.conteudos || [];
    if (!materiaKey || !conteudos.length) {
      csPopulate("conteudo", [], materiaKey ? "Nenhum conteúdo" : "Selecione a matéria primeiro", { disabled: true });
    } else {
      csPopulate("conteudo", conteudos.map((c) => [c, c]), "Selecione");
    }
    populateSubtopicoOptions(materiaKey, "");
  }

  function populateSubtopicoOptions(materiaKey, conteudoKey) {
    const topicos = window.materiasData?.[materiaKey]?.topicosPorConteudo?.[conteudoKey] || [];
    if (!conteudoKey || !topicos.length) {
      csPopulate("subtopico", [], conteudoKey ? "Nenhum subtópico" : "Selecione o conteúdo primeiro", { disabled: true });
    } else {
      csPopulate("subtopico", topicos.map((t) => [t, t]), "Opcional", { clearable: true });
    }
  }

  function populateMotivoOptions() {
    csPopulate("motivo", Object.entries(MOTIVO_LABELS), "Selecione");
  }

  /* ─── Submits ──────────────────────────────────────────── */
  async function handleSimuladoSubmit(event) {
    event.preventDefault();
    const client = window.supabaseClient;
    if (!client || !state.userId) return;

    const nome = els.simuladoNome.value.trim();
    const data_dia1 = els.simuladoDataDia1.value || null;
    const data_dia2 = els.simuladoDataDia2.value || null;
    if (!nome) return;
    if (!data_dia1 && !data_dia2) {
      window.alert("Informe a data do dia 1, do dia 2, ou de ambos.");
      return;
    }

    const payload = {
      user_id: state.userId,
      nome,
      data_dia1,
      data_dia2,
      dificuldade: state.selectedDificuldade || null,
      questoes_total: els.simuladoQuestoesTotal.value ? Number(els.simuladoQuestoesTotal.value) : null,
      acertos_linguagens: els.simuladoAcertosLing.value ? Number(els.simuladoAcertosLing.value) : null,
      acertos_humanas: els.simuladoAcertosHum.value ? Number(els.simuladoAcertosHum.value) : null,
      acertos_matematica: els.simuladoAcertosMat.value ? Number(els.simuladoAcertosMat.value) : null,
      acertos_natureza: els.simuladoAcertosNat.value ? Number(els.simuladoAcertosNat.value) : null,
      nota_redacao: els.simuladoNotaRedacao.value ? Number(els.simuladoNotaRedacao.value) : null,
      observacoes: els.simuladoObservacoes.value.trim() || null,
    };

    const editingId = state.editingSimuladoId;
    const { user_id: _uid, ...updatePayload } = payload;
    const query = editingId
      ? client.from("simulados").update(updatePayload).eq("id", editingId)
      : client.from("simulados").insert(payload);
    const { data, error } = await query.select().single();
    if (error) {
      console.error("Erro ao salvar simulado:", error);
      window.alert("Não foi possível salvar o simulado. Tente novamente.");
      return;
    }

    if (editingId) {
      const existing = state.simulados.find((s) => s.id === editingId);
      const errosCount = existing ? existing.errosCount : 0;
      state.simulados = state.simulados.map((s) => (s.id === editingId ? { ...data, errosCount } : s));
    } else {
      state.simulados.push({ ...data, errosCount: 0 });
    }
    sortByMostRecent(state.simulados);
    renderList();
    closeModal(els.simuladoFormModal, resetSimuladoForm);
  }

  async function handleErroSubmit(event) {
    event.preventDefault();
    const client = window.supabaseClient;
    if (!client || !state.userId || !state.activeSimuladoId) return;

    const materia = els.erroMateria.value;
    const conteudo = els.erroConteudo.value;
    const motivo = els.erroMotivo.value;
    if (!materia || !conteudo || !motivo) return;

    const editingId = state.editingErroId;
    const erroFields = {
      materia,
      conteudo,
      subtopico: els.erroSubtopico.value.trim() || null,
      numero_questao: els.erroNumeroQuestao.value ? Number(els.erroNumeroQuestao.value) : null,
      motivo,
      observacao: els.erroObservacao.value.trim() || null,
    };
    const payload = editingId
      ? erroFields
      : { ...erroFields, simulado_id: state.activeSimuladoId, user_id: state.userId };
    const query = editingId
      ? client.from("simulado_erros").update(payload).eq("id", editingId)
      : client.from("simulado_erros").insert(payload);
    const { data, error } = await query.select().single();
    if (error) {
      console.error("Erro ao salvar erro do simulado:", error);
      window.alert("Não foi possível salvar o erro. Tente novamente.");
      return;
    }

    if (editingId) {
      state.erros = state.erros.map((e) => (e.id === editingId ? data : e));
    } else {
      state.erros.unshift(data);
      const simulado = state.simulados.find((s) => s.id === state.activeSimuladoId);
      if (simulado) simulado.errosCount += 1;
    }
    renderDetail();
    closeModal(els.erroFormModal, resetErroForm);
  }

  /* ─── Exclusão ─────────────────────────────────────────── */
  async function deleteSimulado(id) {
    if (!window.confirm("Excluir este simulado e todos os erros mapeados nele?")) return;
    const client = window.supabaseClient;
    const { error } = await client.from("simulados").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir simulado:", error);
      window.alert("Não foi possível excluir o simulado.");
      return;
    }
    state.simulados = state.simulados.filter((s) => s.id !== id);
    renderList();
  }

  async function deleteErro(id) {
    if (!window.confirm("Excluir este erro?")) return;
    const client = window.supabaseClient;
    const { error } = await client.from("simulado_erros").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir erro:", error);
      window.alert("Não foi possível excluir o erro.");
      return;
    }
    state.erros = state.erros.filter((e) => e.id !== id);
    const simulado = state.simulados.find((s) => s.id === state.activeSimuladoId);
    if (simulado) simulado.errosCount = Math.max(0, simulado.errosCount - 1);
    renderDetail();
  }

  /* ─── Menu do card (renomear / excluir) ───────────────── */
  function closeAllCardMenus() {
    els.simuladosGrid.querySelectorAll("[data-menu]").forEach((menu) => {
      menu.hidden = true;
    });
    els.simuladosGrid.querySelectorAll("[data-menu-toggle]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function toggleCardMenu(toggleBtn) {
    const menu = toggleBtn.parentElement.querySelector("[data-menu]");
    const willOpen = menu.hidden;
    closeAllCardMenus();
    menu.hidden = !willOpen;
    toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  }

  function startRename(cardEl, simulado) {
    const nameEl = cardEl.querySelector("[data-name]");
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 120;
    input.className = "simulado-card__name-input";
    input.value = simulado.nome;
    nameEl.replaceWith(input);
    input.focus();
    input.select();

    let settled = false;
    const finish = async (commit) => {
      if (settled) return;
      settled = true;
      const novoNome = input.value.trim();
      if (commit && novoNome && novoNome !== simulado.nome) {
        await renameSimulado(simulado.id, novoNome);
      } else {
        renderList();
      }
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("click", (event) => event.stopPropagation());
  }

  async function renameSimulado(id, novoNome) {
    const client = window.supabaseClient;
    const { error } = await client.from("simulados").update({ nome: novoNome }).eq("id", id);
    if (error) {
      console.error("Erro ao renomear simulado:", error);
      window.alert("Não foi possível renomear o simulado.");
      renderList();
      return;
    }
    const simulado = state.simulados.find((s) => s.id === id);
    if (simulado) simulado.nome = novoNome;
    renderList();
  }

  /* ─── Calendário personalizado (date popover) ─────────── */
  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toISODate(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function parseISODate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function dateFieldRefs(target) {
    return target === "dia2"
      ? { hidden: els.simuladoDataDia2, trigger: els.simuladoDataDia2Trigger, label: els.simuladoDataDia2Label }
      : { hidden: els.simuladoDataDia1, trigger: els.simuladoDataDia1Trigger, label: els.simuladoDataDia1Label };
  }

  function handleDatePopoverOutsideClick(event) {
    if (els.datePopover.contains(event.target)) return;
    const { trigger } = dateFieldRefs(state.datePopoverTarget);
    if (trigger && trigger.contains(event.target)) return;
    closeDatePopover();
  }

  function positionDatePopover(trigger) {
    const rect = trigger.getBoundingClientRect();
    const width = 272;
    const height = 360;
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
    if (top + height > window.innerHeight - 12) top = Math.max(12, rect.top - height - 6);
    els.datePopover.style.left = `${Math.max(8, left)}px`;
    els.datePopover.style.top = `${Math.max(8, top)}px`;
  }

  function renderDatePopoverGrid() {
    const viewDate = state.datePopoverViewDate;
    els.datePopoverTitle.textContent = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

    const { hidden } = dateFieldRefs(state.datePopoverTarget);
    const selectedIso = hidden.value || null;
    const todayIso = toISODate(new Date());

    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    let html = "";
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + i);
      const iso = toISODate(cellDate);
      const classes = ["date-popover__day"];
      if (cellDate.getMonth() !== viewDate.getMonth()) classes.push("is-muted");
      if (iso === todayIso) classes.push("is-today");
      if (iso === selectedIso) classes.push("is-selected");
      html += `<button type="button" class="${classes.join(" ")}" data-iso="${iso}">${cellDate.getDate()}</button>`;
    }
    els.datePopoverGrid.innerHTML = html;
  }

  function openDatePopover(target, trigger) {
    state.datePopoverTarget = target;
    const { hidden } = dateFieldRefs(target);
    const current = parseISODate(hidden.value) || new Date();
    state.datePopoverViewDate = new Date(current.getFullYear(), current.getMonth(), 1);
    renderDatePopoverGrid();
    els.datePopover.hidden = false;
    positionDatePopover(trigger);
    window.setTimeout(() => document.addEventListener("mousedown", handleDatePopoverOutsideClick, true), 0);
  }

  function closeDatePopover() {
    els.datePopover.hidden = true;
    state.datePopoverTarget = null;
    document.removeEventListener("mousedown", handleDatePopoverOutsideClick, true);
  }

  function shiftDatePopoverMonth(delta) {
    const v = state.datePopoverViewDate;
    state.datePopoverViewDate = new Date(v.getFullYear(), v.getMonth() + delta, 1);
    renderDatePopoverGrid();
  }

  function selectDatePopoverDay(iso) {
    const { hidden, label } = dateFieldRefs(state.datePopoverTarget);
    hidden.value = iso;
    label.textContent = formatDateBR(iso);
    label.classList.remove("is-placeholder");
    closeDatePopover();
  }

  function clearDatePopoverSelection() {
    const { hidden, label } = dateFieldRefs(state.datePopoverTarget);
    hidden.value = "";
    label.textContent = "Selecionar data";
    label.classList.add("is-placeholder");
    closeDatePopover();
  }

  function resetDateFields() {
    [els.simuladoDataDia1, els.simuladoDataDia2].forEach((input) => { input.value = ""; });
    [els.simuladoDataDia1Label, els.simuladoDataDia2Label].forEach((label) => {
      label.textContent = "Selecionar data";
      label.classList.add("is-placeholder");
    });
  }

  /* ─── Eventos ──────────────────────────────────────────── */
  function bindEvents() {
    els.openSimuladoFormBtn.addEventListener("click", () => {
      resetSimuladoForm();
      openModal(els.simuladoFormModal);
    });
    els.closeSimuladoFormBtn.addEventListener("click", () => closeModal(els.simuladoFormModal, resetSimuladoForm));
    els.closeSimuladoFormBtnX.addEventListener("click", () => closeModal(els.simuladoFormModal, resetSimuladoForm));
    els.simuladoForm.addEventListener("submit", handleSimuladoSubmit);

    els.simuladoDificuldade.querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.getAttribute("data-value");
        setDificuldade(state.selectedDificuldade === value ? null : value);
      });
    });

    els.openRaioXBtn.addEventListener("click", () => openRaioXModal());
    els.raioXModalClose.addEventListener("click", () => closeModal(els.raioXModal));
    els.raioXModal.addEventListener("click", (event) => {
      if (event.target === els.raioXModal) { closeModal(els.raioXModal); return; }
      if (!event.target.closest("[data-raio-x-menu-toggle]") && !event.target.closest("[data-raio-x-menu]")) {
        els.raioXList.querySelectorAll("[data-raio-x-menu]:not([hidden])").forEach((m) => { m.hidden = true; });
      }
      if (event.target.closest("[data-raio-x-back]")) {
        renderRaioXModal(computeRaioXItems(_raioXAllErros, _raioXDismissals));
        return;
      }
      const menuToggle = event.target.closest("[data-raio-x-menu-toggle]");
      if (menuToggle) {
        event.stopPropagation();
        const menu = menuToggle.closest(".raio-x-item__menu-wrap")?.querySelector("[data-raio-x-menu]");
        if (!menu) return;
        const wasHidden = menu.hidden;
        els.raioXList.querySelectorAll("[data-raio-x-menu]:not([hidden])").forEach((m) => { m.hidden = true; });
        menu.hidden = !wasHidden;
        return;
      }
      const dismissBtn = event.target.closest("[data-raio-x-dismiss]");
      if (dismissBtn) { dismissRaioXItem(dismissBtn.dataset.materia, dismissBtn.dataset.conteudo); return; }
      const item = event.target.closest("[data-raio-x-materia]");
      if (item && !event.target.closest(".raio-x-item__menu-wrap")) {
        showRaioXDetail(item.dataset.raioXMateria, item.dataset.raioXConteudo);
      }
    });

    els.openErroFormBtn.addEventListener("click", () => openModal(els.erroFormModal));
    els.closeErroFormBtn.addEventListener("click", () => closeModal(els.erroFormModal, resetErroForm));
    els.closeErroFormBtnX.addEventListener("click", () => closeModal(els.erroFormModal, resetErroForm));
    els.erroForm.addEventListener("submit", handleErroSubmit);

    document.addEventListener("mousedown", (event) => {
      Object.keys(cs).forEach((key) => {
        if (!cs[key].panel.hidden && !cs[key].wrap.contains(event.target)) csClose(key);
      });
    }, true);

    Object.keys(cs).forEach((key) => {
      const s = cs[key];
      s.trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        s.panel.hidden ? csOpen(key) : csClose(key);
      });
      s.list.addEventListener("mousedown", (event) => {
        const opt = event.target.closest(".custom-select__option");
        if (opt) csSelect(key, opt.dataset.value, opt.textContent.trim());
      });
    });

    els.simuladoDetailBack.addEventListener("click", showListView);

    els.revisaoToggle.addEventListener("click", () => {
      const willOpen = els.revisaoPanelSection.hidden;
      els.revisaoPanelSection.hidden = !willOpen;
      els.revisaoToggle.classList.toggle("is-active", willOpen);
      els.revisaoToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    els.revisaoList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-revisao-toggle]");
      if (!btn) return;
      const item = btn.closest(".revisao-item");
      if (!item) return;
      toggleRevisao(item.dataset.materia, item.dataset.conteudo);
    });

    els.simuladosGrid.addEventListener("click", (event) => {
      const menuToggle = event.target.closest("[data-menu-toggle]");
      if (menuToggle) {
        event.stopPropagation();
        toggleCardMenu(menuToggle);
        return;
      }

      const actionBtn = event.target.closest("[data-action]");
      if (actionBtn) {
        event.stopPropagation();
        const card = actionBtn.closest(".simulado-card");
        const id = card.getAttribute("data-id");
        closeAllCardMenus();
        const action = actionBtn.getAttribute("data-action");
        if (action === "delete") {
          deleteSimulado(id);
        } else if (action === "rename") {
          const simulado = state.simulados.find((s) => s.id === id);
          if (simulado) startRename(card, simulado);
        } else if (action === "edit") {
          const simulado = state.simulados.find((s) => s.id === id);
          if (simulado) openEditSimulado(simulado);
        }
        return;
      }

      const nameInput = event.target.closest(".simulado-card__name-input");
      if (nameInput) return;

      const card = event.target.closest(".simulado-card");
      if (card) showDetailView(card.getAttribute("data-id"));
    });

    document.addEventListener("click", closeAllCardMenus);

    els.errosGrid.addEventListener("click", (event) => {
      const menuToggle = event.target.closest("[data-erro-menu-toggle]");
      if (menuToggle) {
        event.stopPropagation();
        toggleErroCardMenu(menuToggle);
        return;
      }

      const actionBtn = event.target.closest("[data-erro-action]");
      if (actionBtn) {
        event.stopPropagation();
        const card = actionBtn.closest(".erro-card");
        const id = card.getAttribute("data-id");
        closeAllErroCardMenus();
        const action = actionBtn.getAttribute("data-erro-action");
        const erro = state.erros.find((e) => e.id === id);
        if (action === "delete") {
          deleteErro(id);
        } else if (action === "rename" && erro) {
          startErroRename(card, erro);
        } else if (action === "edit" && erro) {
          openEditErro(erro);
        }
        return;
      }
    });

    document.addEventListener("click", closeAllErroCardMenus);

    [els.simuladoDataDia1Trigger, els.simuladoDataDia2Trigger].forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        const target = trigger.getAttribute("data-date-target");
        if (!els.datePopover.hidden && state.datePopoverTarget === target) {
          closeDatePopover();
        } else {
          openDatePopover(target, trigger);
        }
      });
    });

    els.datePopover.addEventListener("mousedown", (event) => event.stopPropagation());
    els.datePopoverPrev.addEventListener("click", () => shiftDatePopoverMonth(-1));
    els.datePopoverNext.addEventListener("click", () => shiftDatePopoverMonth(1));
    els.datePopoverToday.addEventListener("click", () => {
      const today = new Date();
      state.datePopoverViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
      renderDatePopoverGrid();
    });
    els.datePopoverClear.addEventListener("click", clearDatePopoverSelection);
    els.datePopoverGrid.addEventListener("click", (event) => {
      const dayBtn = event.target.closest("[data-iso]");
      if (dayBtn) selectDatePopoverDay(dayBtn.getAttribute("data-iso"));
    });
  }

  /* ─── Init ─────────────────────────────────────────────── */
  async function init() {
    const guard = await (window.adminGuardPromise || Promise.resolve(null));
    if (!guard) return;

    [
      "simuladosLoading",
      "simuladosListView",
      "simuladosGrid",
      "simuladosEmpty",
      "simuladoDetailView",
      "simuladoDetailBack",
      "simuladoDetailCard",
      "simuladoDetailCardContent",
      "revisaoPanelSection",
      "revisaoToggle",
      "revisaoCounter",
      "revisaoList",
      "errosGrid",
      "errosEmpty",
      "openErroFormBtn",
      "openSimuladoFormBtn",
      "openRaioXBtn",
      "raioXModal",
      "raioXModalClose",
      "raioXList",
      "simuladoFormModal",
      "simuladoForm",
      "simuladoFormTitle",
      "simuladoFormSub",
      "closeSimuladoFormBtn",
      "closeSimuladoFormBtnX",
      "simuladoNome",
      "simuladoDataDia1",
      "simuladoDataDia1Trigger",
      "simuladoDataDia1Label",
      "simuladoDataDia2",
      "simuladoDataDia2Trigger",
      "simuladoDataDia2Label",
      "datePopover",
      "datePopoverTitle",
      "datePopoverPrev",
      "datePopoverNext",
      "datePopoverGrid",
      "datePopoverToday",
      "datePopoverClear",
      "simuladoDificuldade",
      "simuladoQuestoesTotal",
      "simuladoAcertosLing",
      "simuladoAcertosHum",
      "simuladoAcertosMat",
      "simuladoAcertosNat",
      "simuladoNotaRedacao",
      "simuladoObservacoes",
      "erroFormModal",
      "erroForm",
      "erroFormTitle",
      "erroFormSub",
      "closeErroFormBtn",
      "closeErroFormBtnX",
      "erroMateriaWrap", "erroMateriaTrigger", "erroMateriaLabel", "erroMateriaPanel", "erroMateriaList", "erroMateria",
      "erroConteudoWrap", "erroConteudoTrigger", "erroConteudoLabel", "erroConteudoPanel", "erroConteudoList", "erroConteudo",
      "erroSubtopicoWrap", "erroSubtopicoTrigger", "erroSubtopicoLabel", "erroSubtopicoPanel", "erroSubtopicoList", "erroSubtopico",
      "erroNumeroQuestao",
      "erroMotivoWrap", "erroMotivoTrigger", "erroMotivoLabel", "erroMotivoPanel", "erroMotivoList", "erroMotivo",
      "erroObservacao",
    ].forEach((id) => {
      els[id] = $(id);
    });

    registerCustomSelects();
    populateMateriaOptions();
    populateConteudoOptions("");
    populateMotivoOptions();
    bindEvents();

    state.userId = await getUserId();
    state.simulados = await fetchSimulados();
    renderList();

    els.simuladosLoading.hidden = true;
    els.simuladosListView.hidden = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
