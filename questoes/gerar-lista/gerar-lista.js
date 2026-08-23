    const { createClient } = window.supabase || {};
    const SUPABASE_URL = window.__MM_CONFIG__?.supabaseUrl || "";
    const SUPABASE_ANON_KEY = window.__MM_CONFIG__?.supabaseAnonKey || "";
    const supabaseClient = createClient
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;
    window.supabaseClient = supabaseClient;
    const adminGuardPromise = enforceAdminGuard();
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

    function defaultOnConflictForTable(table, payload, explicitOnConflict) {
      if (explicitOnConflict) return explicitOnConflict;
      const row = Array.isArray(payload) ? payload[0] : payload;
      if (!row || typeof row !== "object") return undefined;
      if (table === "lista_itens" && row.lista_id != null && row.user_id != null && row.questao_id != null) {
        return "lista_id,user_id,questao_id";
      }
      return undefined;
    }

    function generateUuid() {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
      }
      const bytes = new Uint8Array(16);
      if (window.crypto && typeof window.crypto.getRandomValues === "function") {
        window.crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
      }
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    async function logAdminAction(action) {
      if (!supabaseClient) return;
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          await handleSupabaseAuthError({ message: "not authenticated" }, supabaseClient);
        }
        const autorId = user?.id || null;
        const autorEmail = user?.email || null;
        let autorNome =
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          null;

        if (autorId) {
          const { data: profileRow, error: profileErr } = await supabaseClient
            .from("profiles")
            .select("nome")
            .eq("id", autorId)
            .maybeSingle();
          if (!profileErr && profileRow?.nome) {
            autorNome = profileRow.nome;
          }
        }
        const row = {
          autor_id: autorId,
          autor_nome: autorNome || autorEmail || "Usuário",
          autor_email: autorEmail,
          acao: action,
        };
        const syncGateway = await getSyncGateway();
        if (syncGateway && typeof syncGateway.enqueueUpsert === "function") {
          await syncGateway.enqueueUpsert({
            table: "admin_logs",
            key: `${autorId || "anon"}:${Date.now()}`,
            payload: row,
            userId: autorId || null,
            flush: "soon",
          });
        } else {
          console.warn("[Listas] Log admin não enfileirado: syncGateway indisponível.");
        }
      } catch (err) {
        console.warn("[Listas] Falha ao registrar log:", err);
      }
    }

    if (!supabaseClient) {
      console.warn(
        "[Listas] Supabase não inicializado. Verifique o script CDN e as chaves públicas."
      );
    }

    // Logout real usando Supabase Auth
    document.addEventListener("matriz:logout", async () => {
      if (!supabaseClient) {
        // Sem Supabase inicializado, apenas redireciona
        window.location.href = "/";
        return;
      }

      try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) await handleSupabaseAuthError(error, supabaseClient);
        if (error) {
          console.error("[Listas] Erro ao fazer logout:", error);
        }
      } catch (err) {
        console.error("[Listas] Exceção no logout:", err);
      } finally {
        window.location.href = "/";
      }
    });

    // =========================
    // Carregar nome do usuário no menu do avatar
    // =========================
    /**
     * Carrega o nome de exibição do usuário logado no menu do avatar,
     * usando o perfil do Supabase e caindo para o e-mail se ausente.
     * @returns {Promise<void>}
     */
    async function loadUserDisplayName() {
      if (!supabaseClient) return;

      try {
        await adminGuardPromise;
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) await handleSupabaseAuthError(error, supabaseClient);
        if (error || !user) {
          console.warn("[Listas] Não foi possível obter o usuário logado:", error);
          return;
        }

        const nameElement = document.querySelector(".user-menu-name");
        if (!nameElement) return;

        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("nome")
          .eq("id", user.id)
          .single();

        if (!profileError && profile && profile.nome) {
          nameElement.textContent = profile.nome;
        } else {
          nameElement.textContent = user.email || "Usuário";
        }
      } catch (err) {
        console.error("[Listas] Erro ao carregar nome do usuário:", err);
      }
    }

    loadUserDisplayName();

    // =========================
    // Controles da UI
    // =========================
    const disciplineList = document.getElementById('discipline-list');
    const addDisciplineBtn = document.querySelector('.btn-add-discipline');
    const infoTooltipWraps = document.querySelectorAll(".info-tooltip-wrap");
    const saveSuccessModal = document.getElementById("save-success-modal");
    const goToListasBtn = document.getElementById("go-to-listas-btn");
    const goToPdfBtn = document.getElementById("go-to-pdf-btn");
    const generationProgress = document.getElementById("generation-progress");
    const generationProgressTitle = document.getElementById("generation-progress-title");
    const generationProgressPercent = document.getElementById("generation-progress-percent");
    const generationProgressFill = document.getElementById("generation-progress-fill");
    const generationProgressHint = document.getElementById("generation-progress-hint");
    let isGeneratingList = false;

    function setGenerationProgress(percent, title, hint) {
      const safePercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
      if (generationProgressTitle && title) generationProgressTitle.textContent = title;
      if (generationProgressPercent) generationProgressPercent.textContent = `${safePercent}%`;
      if (generationProgressFill) generationProgressFill.style.width = `${safePercent}%`;
      if (generationProgressHint && hint) generationProgressHint.textContent = hint;
    }

    function setGenerationBusyState(isBusy) {
      if (saveListBtn) {
        saveListBtn.disabled = isBusy;
        saveListBtn.textContent = isBusy ? "Gerando lista..." : "Salvar Lista";
        saveListBtn.setAttribute("aria-busy", isBusy ? "true" : "false");
      }
      if (generationProgress) {
        generationProgress.classList.toggle("is-visible", isBusy);
        generationProgress.setAttribute("aria-hidden", isBusy ? "false" : "true");
      }
    }

    function resetGenerationProgress() {
      setGenerationProgress(
        0,
        "Preparando filtros e validando dados...",
        "Isso pode levar alguns segundos dependendo da quantidade de itens da lista."
      );
    }

    function setupInfoTooltips() {
      if (!infoTooltipWraps.length) return;
      infoTooltipWraps.forEach((wrap) => {
        if (wrap.dataset.tooltipReady) return;
        const trigger = wrap.querySelector(".info-tooltip-trigger");
        if (!trigger) return;
        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          wrap.classList.toggle("open");
        });
        wrap.dataset.tooltipReady = "true";
      });

      document.addEventListener("click", (event) => {
        infoTooltipWraps.forEach((wrap) => {
          if (!wrap.contains(event.target)) {
            wrap.classList.remove("open");
          }
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        infoTooltipWraps.forEach((wrap) => wrap.classList.remove("open"));
      });
    }

    function setupSaveSuccessModal() {
      if (!saveSuccessModal) return;
      if (goToListasBtn) {
        goToListasBtn.addEventListener("click", () => {
          window.location.href = "/questoes/listas";
        });
      }
      if (goToPdfBtn) {
        goToPdfBtn.addEventListener("click", () => {
          window.location.href = "/questoes/diagramacao";
        });
      }
    }

    function openSaveSuccessModal() {
      if (!saveSuccessModal) return;
      saveSuccessModal.classList.add("is-open");
      saveSuccessModal.setAttribute("aria-hidden", "false");
    }

    const DEFAULT_MODALITIES_FALLBACK = [
      { value: "ENEM", label: "ENEM" },
      { value: "ENEM Regular", label: "ENEM Regular" },
      { value: "ENEM PPL", label: "ENEM PPL" },
      { value: "ENEM Digital", label: "ENEM Digital" },
      { value: "Autoral", label: "Autoral" },
      { value: "CESUPA", label: "CESUPA" },
      { value: "Outros", label: "Outros" }
    ];

    const SUBJECTS = window.materiasData || {};
    const INSTITUTIONS_LIST = (window.INSTITUICOES || []).map((name) => ({
      value: name,
      label: name
    }));
    const BASE_MODALITIES =
      INSTITUTIONS_LIST.length > 0 ? INSTITUTIONS_LIST.slice() : DEFAULT_MODALITIES_FALLBACK.slice();
    if (!BASE_MODALITIES.some((m) => String(m.value || "").toLowerCase() === "enem")) {
      BASE_MODALITIES.unshift({ value: "ENEM", label: "ENEM" });
    }

    const STATUS_ALLOWED = ["aprovada"];

    function isEnemInstitution(value) {
      return String(value || "").toLowerCase().includes("enem");
    }

    let enemMetaCache = null;
    let enemMetaLoading = null;

    async function loadEnemMetaOptions() {
      if (enemMetaCache) return enemMetaCache;
      if (enemMetaLoading) return enemMetaLoading;
      if (!supabaseClient) {
        enemMetaCache = { competencias: [], habilidades: [] };
        return enemMetaCache;
      }
      enemMetaLoading = supabaseClient
        .from("questions")
        .select("competencia, habilidade")
        .eq("status", "aprovada")
        .ilike("modalidade", "%ENEM%")
        .range(0, 9999)
        .then(({ data, error }) => {
          if (error || !data) {
            console.error("[Listas] Erro ao carregar competências/habilidades:", error);
            return { competencias: [], habilidades: [] };
          }
          const competencias = new Set();
          const habilidades = new Set();
          data.forEach((row) => {
            if (row.competencia) competencias.add(String(row.competencia).trim());
            if (row.habilidade) habilidades.add(String(row.habilidade).trim());
          });
          return {
            competencias: Array.from(competencias).filter(Boolean).sort(),
            habilidades: Array.from(habilidades).filter(Boolean).sort()
          };
        })
        .finally(() => {
          enemMetaLoading = null;
        });
      enemMetaCache = await enemMetaLoading;
      return enemMetaCache;
    }

    function normalizeString(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }

    function normalizeDisciplinaValue(value) {
      const raw = normalizeString(value);
      if (!raw) return "";
      if (raw.includes("mat")) return "matematica";
      if (raw.includes("fis")) return "fisica";
      if (raw.includes("bio")) return "biologia";
      if (raw.includes("qui")) return "quimica";
      if (raw.includes("his")) return "historia";
      if (raw.includes("geo")) return "geografia";
      if (raw.includes("soc")) return "sociologia";
      if (raw.includes("fil")) return "filosofia";
      if (raw.includes("port") || raw.includes("lingua") || raw.includes("lit") || raw.includes("art")) return "linguagens";
      return raw;
    }

    function normalizeDifficultyValue(value) {
      const raw = normalizeString(value);
      if (!raw) return "";
      if (raw.includes("fac")) return "fácil";
      if (raw.includes("dif")) return "difícil";
      return "média";
    }

    function hasArrayValues(value) {
      return Array.isArray(value) && value.length > 0;
    }

    function hasScalarValue(value) {
      return !Array.isArray(value) && value !== null && value !== undefined && value !== "";
    }

    function normalizeSearchKeyword(value) {
      return String(value || "").trim();
    }

    function shouldSearchKeywordAcrossAllDisciplines(item) {
      const hasKeyword = Boolean(normalizeSearchKeyword(item?.busca));
      const hasContentFilter = hasArrayValues(item?.conteudo) || hasScalarValue(item?.conteudo);
      return hasKeyword && !hasContentFilter;
    }

    function applyQuestionFilters(query, item) {
      const keyword = normalizeSearchKeyword(item?.busca);

      if (item.disciplina && !shouldSearchKeywordAcrossAllDisciplines(item)) {
        const disciplinaValue = normalizeDisciplinaValue(item.disciplina);
        if (disciplinaValue) query = query.eq("disciplina", disciplinaValue);
      }
      if (hasArrayValues(item.modalidade)) {
        query = query.in("modalidade", item.modalidade);
      } else if (hasScalarValue(item.modalidade)) {
        query = query.eq("modalidade", item.modalidade);
      }
      if (hasArrayValues(item.ano)) {
        const anos = item.ano
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0);
        if (anos.length) query = query.in("ano", anos);
      } else if (hasScalarValue(item.ano)) {
        query = query.eq("ano", Number(item.ano));
      }
      if (hasArrayValues(item.dificuldade)) {
        const dificuldades = item.dificuldade
          .map(normalizeDifficultyValue)
          .filter(Boolean);
        if (dificuldades.length) query = query.in("dificuldade", dificuldades);
      } else if (hasScalarValue(item.dificuldade)) {
        const dificuldadeValue = normalizeDifficultyValue(item.dificuldade);
        if (dificuldadeValue) query = query.eq("dificuldade", dificuldadeValue);
      }
      if (hasArrayValues(item.conteudo)) {
        query = query.in("conteudo", item.conteudo);
      } else if (hasScalarValue(item.conteudo)) {
        query = query.eq("conteudo", item.conteudo);
      }
      if (hasArrayValues(item.topico)) {
        query = query.in("tags", item.topico);
      } else if (hasScalarValue(item.topico)) {
        query = query.eq("tags", item.topico);
      }
      if (hasArrayValues(item.competencia)) {
        query = query.in("competencia", item.competencia);
      } else if (hasScalarValue(item.competencia)) {
        query = query.eq("competencia", item.competencia);
      }
      if (hasArrayValues(item.habilidade)) {
        query = query.in("habilidade", item.habilidade);
      } else if (hasScalarValue(item.habilidade)) {
        query = query.eq("habilidade", item.habilidade);
      }
      if (keyword) {
        const normalized = keyword.replace("#", "").trim();
        const buscaId = /^\d+$/.test(normalized) ? Number(normalized) : null;
        if (Number.isFinite(buscaId) && buscaId > 0) {
          query = query.eq("id", buscaId);
        } else {
          query = query.ilike("enunciado", `%${keyword}%`);
        }
      }

      return query;
    }

    function getContentsForDiscipline(area) {
      return (SUBJECTS[area]?.conteudos || []).slice();
    }

    function getTopicsForContent(area, content) {
      const byContent = SUBJECTS[area]?.topicosPorConteudo || {};
      if (content && Array.isArray(byContent[content]) && byContent[content].length) {
        return byContent[content].slice();
      }
      return [];
    }

    function populateSelect(select, options, placeholderLabel = "Todos") {
      if (!select) return;
      select.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = placeholderLabel;
      select.appendChild(placeholder);
      options.forEach((opt) => {
        const optionEl = document.createElement("option");
        if (typeof opt === "string") {
          optionEl.value = opt;
          optionEl.textContent = opt;
        } else {
          optionEl.value = opt.value ?? opt.label;
          optionEl.textContent = opt.label ?? opt.value;
        }
        select.appendChild(optionEl);
      });
    }

    function ensureContentMultiSelect(conteudoSelect) {
      if (!conteudoSelect) return null;
      if (conteudoSelect.dataset.multiReady) {
        return conteudoSelect.parentElement.querySelector(".multi-select-content");
      }
      const wrapper = document.createElement("div");
      wrapper.className = "multi-select multi-select-content";
      wrapper.dataset.values = JSON.stringify([]);

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "input-base multi-trigger";
      trigger.textContent = "Todos";

      const menu = document.createElement("div");
      menu.className = "multi-menu";

      wrapper.appendChild(trigger);
      wrapper.appendChild(menu);
      conteudoSelect.style.display = "none";
      conteudoSelect.parentElement.appendChild(wrapper);

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.classList.toggle("open");
      });

      document.addEventListener("click", (event) => {
        if (wrapper.contains(event.target)) return;
        wrapper.classList.remove("open");
      });

      conteudoSelect.dataset.multiReady = "true";
      conteudoSelect.dataset.multiWrapper = "true";
      return wrapper;
    }

    function setMultiSelectOptions(wrapper, options) {
      if (!wrapper) return;
      const menu = wrapper.querySelector(".multi-menu");
      if (!menu) return;
      const selected = new Set(JSON.parse(wrapper.dataset.values || "[]"));
      menu.innerHTML = "";
      options.forEach((opt) => {
        const value = typeof opt === "string" ? opt : (opt.value ?? opt.label);
        const labelText = typeof opt === "string" ? opt : (opt.label ?? opt.value);
        const option = document.createElement("div");
        option.className = "multi-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = value;
        checkbox.checked = selected.has(value);
        checkbox.tabIndex = -1;
        const text = document.createElement("span");
        text.textContent = labelText;
        option.appendChild(checkbox);
        option.appendChild(text);
        menu.appendChild(option);
      });
    }

    function setAllowedValues(wrapper, allowedValues) {
      if (!wrapper) return;
      wrapper.dataset.allowedValues = JSON.stringify(allowedValues || []);
    }

    function bindMultiMenuChange(menu, wrapper, onChange) {
      if (!menu || menu.dataset.changeBound) return;
      menu.addEventListener("change", () => {
        const allowedValues = wrapper
          ? JSON.parse(wrapper.dataset.allowedValues || "[]")
          : [];
        updateMultiSelectState(wrapper, allowedValues);
        if (typeof onChange === "function") {
          onChange();
        }
      });
      menu.dataset.changeBound = "true";
    }

    function bindMultiMenu(menu) {
      if (!menu || menu.dataset.toggleBound) return;
      const toggleHandler = (event) => {
        const targetEl = event.target && event.target.nodeType === 3
          ? event.target.parentElement
          : event.target;
        if (targetEl && targetEl.tagName === "INPUT") return;
        const option = targetEl && targetEl.closest
          ? targetEl.closest(".multi-option")
          : null;
        if (!option) return;
        const input = option.querySelector("input[type='checkbox']");
        if (!input) return;
        event.preventDefault();
        event.stopPropagation();
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      menu.addEventListener("click", toggleHandler);
      menu.dataset.toggleBound = "true";
    }

    function updateMultiSelectState(wrapper, allowedValues = null) {
      if (!wrapper) return [];
      const checks = wrapper.querySelectorAll("input[type='checkbox']");
      let selected = Array.from(checks)
        .filter((el) => el.checked)
        .map((el) => el.value);
      if (allowedValues && Array.isArray(allowedValues)) {
        const allowedSet = new Set(allowedValues);
        selected = selected.filter((value) => allowedSet.has(value));
        checks.forEach((el) => {
          if (!allowedSet.has(el.value)) el.checked = false;
        });
      }
      wrapper.dataset.values = JSON.stringify(selected);
      const trigger = wrapper.querySelector(".multi-trigger");
      if (trigger) {
        if (!selected.length) trigger.textContent = "Todos";
        else if (selected.length === 1) trigger.textContent = selected[0];
        else trigger.textContent = `${selected.length} selecionados`;
      }
      return selected;
    }

    function clearMultiSelect(wrapper) {
      if (!wrapper) return;
      wrapper.dataset.values = JSON.stringify([]);
      wrapper.querySelectorAll("input[type='checkbox']").forEach((el) => {
        el.checked = false;
      });
      const allowedValues = JSON.parse(wrapper.dataset.allowedValues || "[]");
      updateMultiSelectState(wrapper, allowedValues);
    }

    function ensureTopicoMultiSelect(topicoSelect) {
      if (!topicoSelect) return null;
      if (topicoSelect.dataset.multiReady) {
        return topicoSelect.parentElement.querySelector(".multi-select-topico");
      }
      const wrapper = document.createElement("div");
      wrapper.className = "multi-select multi-select-topico";
      wrapper.dataset.values = JSON.stringify([]);

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "input-base multi-trigger";
      trigger.textContent = "Todos";

      const menu = document.createElement("div");
      menu.className = "multi-menu";

      wrapper.appendChild(trigger);
      wrapper.appendChild(menu);
      topicoSelect.style.display = "none";
      topicoSelect.parentElement.appendChild(wrapper);

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.classList.toggle("open");
      });

      document.addEventListener("click", (event) => {
        if (wrapper.contains(event.target)) return;
        wrapper.classList.remove("open");
      });

      topicoSelect.dataset.multiReady = "true";
      topicoSelect.dataset.multiWrapper = "true";
      return wrapper;
    }

    function ensureDificuldadeMultiSelect(dificuldadeSelect) {
      if (!dificuldadeSelect) return null;
      if (dificuldadeSelect.dataset.multiReady) {
        return dificuldadeSelect.parentElement.querySelector(".multi-select-dificuldade");
      }
      const wrapper = document.createElement("div");
      wrapper.className = "multi-select multi-select-dificuldade";
      wrapper.dataset.values = JSON.stringify([]);

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "input-base multi-trigger";
      trigger.textContent = "Todas";

      const menu = document.createElement("div");
      menu.className = "multi-menu";

      wrapper.appendChild(trigger);
      wrapper.appendChild(menu);
      dificuldadeSelect.style.display = "none";
      dificuldadeSelect.parentElement.appendChild(wrapper);

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.classList.toggle("open");
      });

      document.addEventListener("click", (event) => {
        if (wrapper.contains(event.target)) return;
        wrapper.classList.remove("open");
      });

      dificuldadeSelect.dataset.multiReady = "true";
      dificuldadeSelect.dataset.multiWrapper = "true";
      return wrapper;
    }

    function ensureGenericMultiSelect(select, className, placeholderText) {
      if (!select) return null;
      if (select.dataset.multiReady) {
        return select.parentElement.querySelector(`.${className}`);
      }
      const wrapper = document.createElement("div");
      wrapper.className = `multi-select ${className}`;
      wrapper.dataset.values = JSON.stringify([]);

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "input-base multi-trigger";
      trigger.textContent = placeholderText || "Todos";

      const menu = document.createElement("div");
      menu.className = "multi-menu";

      wrapper.appendChild(trigger);
      wrapper.appendChild(menu);
      select.style.display = "none";
      select.parentElement.appendChild(wrapper);

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.classList.toggle("open");
      });

      document.addEventListener("click", (event) => {
        if (wrapper.contains(event.target)) return;
        wrapper.classList.remove("open");
      });

      select.dataset.multiReady = "true";
      select.dataset.multiWrapper = "true";
      return wrapper;
    }

    function setTopicoMultiOptions(wrapper, groupedOptions) {
      if (!wrapper) return;
      const menu = wrapper.querySelector(".multi-menu");
      if (!menu) return;
      const selected = new Set(JSON.parse(wrapper.dataset.values || "[]"));
      menu.innerHTML = "";
      groupedOptions.forEach((group) => {
        if (!group.options || !group.options.length) return;
        const groupWrap = document.createElement("div");
        groupWrap.className = "multi-group";
        const title = document.createElement("div");
        title.className = "multi-group-title";
        title.textContent = group.label;
        groupWrap.appendChild(title);
        group.options.forEach((opt) => {
          const option = document.createElement("div");
          option.className = "multi-option";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = opt;
          checkbox.checked = selected.has(opt);
          checkbox.tabIndex = -1;
          const text = document.createElement("span");
          text.textContent = opt;
          option.appendChild(checkbox);
          option.appendChild(text);
          groupWrap.appendChild(option);
        });
        menu.appendChild(groupWrap);
      });
    }

    function initDynamicFilters(card) {
      if (!card) return;
      const selects = card.querySelectorAll("select");
      const disciplinaSelect = selects[0];
      const conteudoSelect = selects[1];
      const topicoSelect = selects[2];
      const modalidadeSelect = selects[3];
      const anoSelect = selects[4];
      const dificuldadeSelect = selects[5];
      const competenciaSelect = selects[6];
      const habilidadeSelect = selects[7];
      const competenciaGroup = card.querySelector(".enem-competencia");
      const habilidadeGroup = card.querySelector(".enem-habilidade");
      const competenciaWrapper = competenciaSelect
        ? ensureGenericMultiSelect(competenciaSelect, "multi-select-competencia", "Todas")
        : null;
      const habilidadeWrapper = habilidadeSelect
        ? ensureGenericMultiSelect(habilidadeSelect, "multi-select-habilidade", "Todas")
        : null;

      populateSelect(modalidadeSelect, BASE_MODALITIES, "Todas");
      const updateEnemFilters = async () => {
        const modalityWrapper = card.querySelector(".multi-select-modalidade");
        const values = modalityWrapper
          ? JSON.parse(modalityWrapper.dataset.values || "[]")
          : (modalidadeSelect ? [modalidadeSelect.value] : []);
        const hasEnem = values.some(isEnemInstitution);
        if (competenciaGroup) competenciaGroup.classList.toggle("is-visible", hasEnem);
        if (habilidadeGroup) habilidadeGroup.classList.toggle("is-visible", hasEnem);
        if (!hasEnem) {
          clearMultiSelect(competenciaWrapper);
          clearMultiSelect(habilidadeWrapper);
          return;
        }
        const { competencias, habilidades } = await loadEnemMetaOptions();
        if (competenciaWrapper) {
          setMultiSelectOptions(competenciaWrapper, competencias);
          setAllowedValues(competenciaWrapper, competencias);
          updateMultiSelectState(competenciaWrapper, competencias);
          const menu = competenciaWrapper.querySelector(".multi-menu");
          if (menu) bindMultiMenu(menu);
          bindMultiMenuChange(menu, competenciaWrapper);
        }
        if (habilidadeWrapper) {
          setMultiSelectOptions(habilidadeWrapper, habilidades);
          setAllowedValues(habilidadeWrapper, habilidades);
          updateMultiSelectState(habilidadeWrapper, habilidades);
          const menu = habilidadeWrapper.querySelector(".multi-menu");
          if (menu) bindMultiMenu(menu);
          bindMultiMenuChange(menu, habilidadeWrapper);
        }
      };

      if (modalidadeSelect) {
        const modalidadeOptions = Array.from(modalidadeSelect.options)
          .map((option) => ({
            value: option.value,
            label: option.textContent.trim()
          }))
          .filter((option) => option.value);
        const allowedValues = modalidadeOptions.map((option) => option.value);
        const wrapper = ensureGenericMultiSelect(modalidadeSelect, "multi-select-modalidade", "Todas");
        setMultiSelectOptions(wrapper, modalidadeOptions);
        setAllowedValues(wrapper, allowedValues);
        updateMultiSelectState(wrapper, allowedValues);
        const menu = wrapper ? wrapper.querySelector(".multi-menu") : null;
        if (menu) {
          bindMultiMenu(menu);
        }
        bindMultiMenuChange(menu, wrapper, updateEnemFilters);
        modalidadeSelect.addEventListener("change", updateEnemFilters);
      }

      if (anoSelect) {
        const anoOptions = Array.from(anoSelect.options)
          .map((option) => ({
            value: option.value,
            label: option.textContent.trim()
          }))
          .filter((option) => option.value);
        const allowedValues = anoOptions.map((option) => option.value);
        const wrapper = ensureGenericMultiSelect(anoSelect, "multi-select-ano", "Todos");
        setMultiSelectOptions(wrapper, anoOptions);
        setAllowedValues(wrapper, allowedValues);
        updateMultiSelectState(wrapper, allowedValues);
        const menu = wrapper ? wrapper.querySelector(".multi-menu") : null;
        if (menu) {
          bindMultiMenu(menu);
        }
        bindMultiMenuChange(menu, wrapper);
      }

      if (dificuldadeSelect) {
        const dificuldadeOptions = Array.from(dificuldadeSelect.options)
          .map((option) => ({
            value: option.value,
            label: option.textContent.trim()
          }))
          .filter((option) => option.value);
        const allowedValues = dificuldadeOptions.map((option) => option.value);
        const wrapper = ensureDificuldadeMultiSelect(dificuldadeSelect);
        setMultiSelectOptions(wrapper, dificuldadeOptions);
        setAllowedValues(wrapper, allowedValues);
        updateMultiSelectState(wrapper, allowedValues);
        const menu = wrapper ? wrapper.querySelector(".multi-menu") : null;
        if (menu) {
          bindMultiMenu(menu);
        }
        bindMultiMenuChange(menu, wrapper);
      }

      const updateTopics = () => {
        const area = disciplinaSelect ? disciplinaSelect.value : "";
        const wrapper = conteudoSelect ? conteudoSelect.parentElement.querySelector(".multi-select-content") : null;
        const selectedContents = wrapper ? JSON.parse(wrapper.dataset.values || "[]") : [];
        const contentsToShow = selectedContents.length ? selectedContents : getContentsForDiscipline(area);
        if (!topicoSelect) return;
        topicoSelect.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Todos";
        topicoSelect.appendChild(placeholder);
        const grouped = [];
        contentsToShow.forEach((content) => {
          const topics = getTopicsForContent(area, content);
          if (!topics.length) return;
          const group = document.createElement("optgroup");
          group.label = content;
          topics.forEach((topic) => {
            const opt = document.createElement("option");
            opt.value = topic;
            opt.textContent = topic;
            group.appendChild(opt);
          });
          topicoSelect.appendChild(group);
          grouped.push({ label: content, options: topics });
        });

        const topicoWrapper = ensureTopicoMultiSelect(topicoSelect);
        if (topicoWrapper) {
          setTopicoMultiOptions(topicoWrapper, grouped);
          const flatOptions = grouped.flatMap((group) => group.options);
          setAllowedValues(topicoWrapper, flatOptions);
          updateMultiSelectState(topicoWrapper, flatOptions);
          const menu = topicoWrapper.querySelector(".multi-menu");
          if (menu) {
            bindMultiMenu(menu);
          }
          bindMultiMenuChange(menu, topicoWrapper);
        }
      };

      const updateContentsAndTopics = () => {
        const area = disciplinaSelect ? disciplinaSelect.value : "";
        const contents = getContentsForDiscipline(area);
        if (conteudoSelect) {
          populateSelect(conteudoSelect, contents, "Todos");
          const wrapper = ensureContentMultiSelect(conteudoSelect);
          setMultiSelectOptions(wrapper, contents);
          setAllowedValues(wrapper, contents);
          updateMultiSelectState(wrapper, contents);
          const menu = wrapper.querySelector(".multi-menu");
          if (menu) {
            bindMultiMenu(menu);
          }
          bindMultiMenuChange(menu, wrapper, updateTopics);
        }
        updateTopics();
      };

      if (disciplinaSelect) {
        disciplinaSelect.addEventListener("change", updateContentsAndTopics);
      }
      if (conteudoSelect) {
        conteudoSelect.addEventListener("change", updateTopics);
      }

      updateContentsAndTopics();
      updateEnemFilters();
    }

    function updateCardTitles() {
      const cards = disciplineList.querySelectorAll('.discipline-card');
      cards.forEach((card, index) => {
        let titleEl = card.querySelector('.card-title');
        if (!titleEl) {
          titleEl = document.createElement('div');
          titleEl.className = 'card-title';
          card.insertBefore(titleEl, card.firstChild);
        }
        titleEl.textContent = `Item ${index + 1}`;
      });
    }

    if (disciplineList && addDisciplineBtn) {
      addDisciplineBtn.addEventListener('click', () => {
        const firstCard = disciplineList.querySelector('.discipline-card');
        if (!firstCard) return;

        const clone = firstCard.cloneNode(true);

        // limpa inputs
        clone.querySelectorAll('input').forEach(input => {
          if (input.type === 'number') {
            input.value = '10';
          } else {
            input.value = '';
          }
        });

        // reseta selects para a primeira opção
        clone.querySelectorAll('select').forEach(select => {
          select.selectedIndex = 0;
          select.style.display = "";
          delete select.dataset.multiReady;
          delete select.dataset.multiWrapper;
        });

        // remove wrappers duplicados dos multiselects
        clone.querySelectorAll('.multi-select').forEach((wrapper) => wrapper.remove());

        disciplineList.appendChild(clone);
        updateCardTitles();
        initDynamicFilters(clone);
      });
    }

    if (disciplineList) {
      disciplineList.querySelectorAll(".discipline-card").forEach((card) => {
        initDynamicFilters(card);
      });
    }

    setupInfoTooltips();

    // delete card
    document.addEventListener("click", e => {
      const deleteBtn = e.target.closest(".delete-card-btn");
      if (!deleteBtn) return;

      const card = deleteBtn.closest(".discipline-card");
      if (card && disciplineList.children.length > 1) {
        card.remove();
        updateCardTitles();
      }
    });

    /**
     * Coleta a configuração de filtros de cada card de disciplina na UI.
     * @returns {Array<Object>} Um item de configuração por card.
     */
    function collectListConfig() {
      const cards = disciplineList.querySelectorAll('.discipline-card');
      const config = [];

      const sanitizeSelection = (values) => {
        if (!Array.isArray(values)) return [];
        return values.filter((value) => {
          if (!value) return false;
          const normalized = value.toString().trim().toLowerCase();
          return normalized !== "todos" && normalized !== "todas";
        });
      };

      cards.forEach((card, index) => {
        const selects = card.querySelectorAll('select');
        const qtdInput = card.querySelector('input[type="number"]');
        const searchInput = card.querySelector('.filters-row.secondary input[type="text"]');

        // primeira linha
        const disciplinaSelect = selects[0]; // Disciplina
        const conteudoSelect = selects[1];   // Conteúdo (hidden)
        const topicoSelect = selects[2];     // Tópico
        const conteudoWrapper = card.querySelector(".multi-select-content");
        const topicoWrapper = card.querySelector(".multi-select-topico");
        const dificuldadeWrapper = card.querySelector(".multi-select-dificuldade");
        const modalidadeWrapper = card.querySelector(".multi-select-modalidade");
        const anoWrapper = card.querySelector(".multi-select-ano");
        const competenciaWrapper = card.querySelector(".multi-select-competencia");
        const habilidadeWrapper = card.querySelector(".multi-select-habilidade");
        const conteudosSelecionados = sanitizeSelection(
          conteudoWrapper
            ? JSON.parse(conteudoWrapper.dataset.values || "[]")
            : (conteudoSelect ? [conteudoSelect.value] : [])
        );
        const topicosSelecionados = sanitizeSelection(
          topicoWrapper
            ? JSON.parse(topicoWrapper.dataset.values || "[]")
            : (topicoSelect ? [topicoSelect.value] : [])
        );

        // segunda linha
        const modalidadeSelect = selects[3]; // Modalidade
        const anoSelect = selects[4];        // Ano
        const dificuldadeSelect = selects[5];// Dificuldade (hidden)
        const modalidadesSelecionadas = sanitizeSelection(
          modalidadeWrapper
            ? JSON.parse(modalidadeWrapper.dataset.values || "[]")
            : (modalidadeSelect ? [modalidadeSelect.value] : [])
        );
        const anosSelecionados = sanitizeSelection(
          anoWrapper
            ? JSON.parse(anoWrapper.dataset.values || "[]")
            : (anoSelect ? [anoSelect.value] : [])
        );
        const dificuldadesSelecionadas = sanitizeSelection(
          dificuldadeWrapper
            ? JSON.parse(dificuldadeWrapper.dataset.values || "[]")
            : (dificuldadeSelect ? [dificuldadeSelect.value] : [])
        );
        const competenciasSelecionadas = sanitizeSelection(
          competenciaWrapper
            ? JSON.parse(competenciaWrapper.dataset.values || "[]")
            : []
        );
        const habilidadesSelecionadas = sanitizeSelection(
          habilidadeWrapper
            ? JSON.parse(habilidadeWrapper.dataset.values || "[]")
            : []
        );

        config.push({
          index: index + 1,
          disciplina: disciplinaSelect ? disciplinaSelect.value : "",
          quantidade: qtdInput ? Number(qtdInput.value || 0) : 0,
          conteudo: conteudosSelecionados,
          topico: topicosSelecionados,
          busca: searchInput ? searchInput.value.trim() : "",
          modalidade: modalidadesSelecionadas,
          ano: anosSelecionados,
          dificuldade: dificuldadesSelecionadas,
          competencia: competenciasSelecionadas,
          habilidade: habilidadesSelecionadas
        });
      });

      return config;
    }

    // =========================
    // Salvar lista: valida os filtros, consulta o Supabase e redireciona para /questoes/diagramacao
    // =========================
    const saveListBtn = document.getElementById("save-list-btn");
    resetGenerationProgress();

    if (saveListBtn) {
      saveListBtn.addEventListener("click", async () => {
        if (isGeneratingList) return;
        isGeneratingList = true;
        setGenerationBusyState(true);
        resetGenerationProgress();

        const listTitleInput = document.getElementById("list-title");
        const listTitle = listTitleInput ? listTitleInput.value.trim() : "";

        try {
          setGenerationProgress(6, "Validando dados da lista...", "Estamos conferindo o titulo, os filtros e a quantidade de questoes.");

          // Título obrigatório
          if (!listTitle) {
            alert("Defina um título para a lista antes de salvar.");
            if (listTitleInput) {
              listTitleInput.focus();
            }
            return;
          }

          const shuffleGlobalCheckbox = document.getElementById("shuffle-global");
          const ignoreCorrectCheckbox = document.getElementById("ignore-correct-global");
          const listModeCheckbox = document.getElementById("list-mode");

          const shuffleGlobal = shuffleGlobalCheckbox
            ? shuffleGlobalCheckbox.checked
            : false;
          const ignoreCorrect = ignoreCorrectCheckbox
            ? ignoreCorrectCheckbox.checked
            : false;
          const listMode = listModeCheckbox
            ? listModeCheckbox.checked
            : false;

          const config = collectListConfig();

          // Pelo menos um item na lista
          if (!config.length) {
            alert("Adicione pelo menos um item na lista antes de salvar.");
            return;
          }

          // Regra por item:
          // 1) disciplina obrigatória, exceto na busca por palavra-chave sem conteúdo (busca geral)
          // 2) conteúdo opcional quando disciplina está selecionada (busca todos os conteúdos)
          for (const item of config) {
            const hasContentFilter = hasArrayValues(item.conteudo) || hasScalarValue(item.conteudo);
            const hasKeyword = Boolean(normalizeSearchKeyword(item.busca));
            const keywordAcrossAllDisciplines = shouldSearchKeywordAcrossAllDisciplines(item);
            if (!item.disciplina && !hasContentFilter && !hasKeyword) {
              alert(`Selecione uma disciplina, um conteúdo ou informe uma palavra-chave para o Item ${item.index}.`);
              return;
            }
            if (!item.disciplina && !keywordAcrossAllDisciplines) {
              alert(`Selecione a disciplina para o Item ${item.index}.`);
              return;
            }
          }

          // Quantidade de questões obrigatória (> 0) por item
          for (const item of config) {
            if (!item.quantidade || item.quantidade <= 0) {
              alert(`Defina a quantidade de questões para o Item ${item.index}.`);
              return;
            }
          }

          // Verificação de disponibilidade no Supabase:
          // se não houver NENHUMA questão para todos os filtros somados,
          // avisamos e não deixamos prosseguir.
          if (!supabaseClient) {
            alert("Supabase não está configurado. Verifique a URL e a chave pública em gerar-lista.html");
            return;
          }

          setGenerationProgress(12, "Consultando o banco de questões...", `Buscando ${config.length} ${config.length === 1 ? "item" : "itens"} em paralelo.`);

          // Busca todos os itens em paralelo — elimina o N+1 de dois loops sequenciais.
          // Os N COUNTs sequenciais foram removidos: a ausência de resultados é detectada
          // pelos próprios dados retornados, sem custo extra de round-trip.
          let fetchCompleted = 0;
          const fetchResults = await Promise.all(
            config.map(async (item) => {
              let query = supabaseClient
                .from("questions")
                .select(`
                  id, ano, modalidade, disciplina, dificuldade,
                  enunciado, sub_enunciado, imagem_url, fonte,
                  alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
                  alternativa_a_imagem_url, alternativa_b_imagem_url, alternativa_c_imagem_url,
                  alternativa_d_imagem_url, alternativa_e_imagem_url,
                  gabarito, gabarito_comentado
                `);
              query = query.in("status", STATUS_ALLOWED);
              query = applyQuestionFilters(query, item);
              const { data: rows, error } = await query.limit(Math.max(item.quantidade, 100));
              fetchCompleted += 1;
              setGenerationProgress(
                12 + Math.round((fetchCompleted / config.length) * 60),
                `Buscando questões... (${fetchCompleted}/${config.length})`,
                "Processando filtros e montando a seleção final."
              );
              return { item, rows: rows || [], error };
            })
          );

          const fetchErrors = fetchResults.filter((r) => r.error);
          if (fetchErrors.length > 0) {
            console.error("[Listas] Erros ao buscar questões:", fetchErrors.map((e) => ({ item: e.item.index, error: e.error })));
            alert("Erro ao consultar o banco de questões em um ou mais itens. Veja o console para mais detalhes.");
            return;
          }

          const questoesSelecionadas = [];
          for (const { item, rows } of fetchResults) {
            const shuffled = rows
              .map((q) => ({ sort: Math.random(), value: q }))
              .sort((a, b) => a.sort - b.sort)
              .map((o) => o.value);
            const quantidade = item.quantidade && item.quantidade > 0 ? Number(item.quantidade) : shuffled.length;
            questoesSelecionadas.push(...shuffled.slice(0, quantidade));
          }

          if (questoesSelecionadas.length === 0) {
            alert("Nenhuma questão foi encontrada no banco para os filtros selecionados. Ajuste os filtros e tente novamente.");
            return;
          }

          setGenerationProgress(76, "Salvando sua lista...", "Registrando a lista e preparando os dados para as próximas telas.");

          let userId = null;
          try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            userId = user?.id || null;
          } catch (_) {}

          // Salva no Supabase diretamente (sem syncGateway/outbox) para evitar dependência do IndexedDB
          let listaId = null;
          if (userId) {
            listaId = generateUuid();

            const { error: listaError } = await supabaseClient.from("listas").upsert({
              id: listaId,
              owner_id: userId,
              titulo: listTitle,
              status: "ativa",
              total_itens: questoesSelecionadas.length,
              modo_lista: listMode
            }, { onConflict: "id" });

            if (listaError) {
              console.warn("[Listas] Falha ao salvar lista:", listaError.message, listaError);
              listaId = null;
            }

            if (listaId && questoesSelecionadas.length) {
              setGenerationProgress(84, "Sincronizando os itens da lista...", "Enviando cada questão selecionada para ficar disponível nas suas listas.");

              const itensPayload = questoesSelecionadas.map((q, idx) => ({
                lista_id: listaId,
                questao_id: q.id,
                ordem: idx + 1,
                user_id: userId
              }));

              const BATCH_SIZE = 50;
              for (let i = 0; i < itensPayload.length; i += BATCH_SIZE) {
                const batch = itensPayload.slice(i, i + BATCH_SIZE);
                const { error: batchError } = await supabaseClient.from("lista_itens").insert(batch);
                if (batchError) {
                  console.warn("[Listas] Falha ao inserir lote de itens:", batchError.message, batchError);
                }
                const progress = 84 + Math.round(((i + batch.length) / itensPayload.length) * 10);
                setGenerationProgress(
                  progress,
                  "Sincronizando os itens da lista...",
                  `${Math.min(i + batch.length, itensPayload.length)} de ${itensPayload.length} ${itensPayload.length === 1 ? "item sincronizado" : "itens sincronizados"}.`
                );
              }
            }
          }

          const payload = {
            titulo: listTitle,
            embaralhar: shuffleGlobal,
            ignorarCorretas: ignoreCorrect,
            modoLista: listMode,
            itens: config,
            questoes: questoesSelecionadas,
            salvoEm: new Date().toISOString()
          };

          setGenerationProgress(95, "Finalizando a criação da lista...", "Salvando os dados neste navegador e registrando a ação.");
          localStorage.setItem("lista-diagramacao", JSON.stringify(payload));
          if (listaId && questoesSelecionadas.length) {
            try {
              localStorage.setItem(`lista-questoes-cache-${listaId}`, JSON.stringify(questoesSelecionadas));
            } catch (_) {}
          }
          console.log("[Listas] Lista salva no localStorage:", payload);
          await logAdminAction(
            `A lista de questões: ${listTitle}, com ${questoesSelecionadas.length} questões foi criada com o banco privado de itens.`
          );
          setGenerationProgress(100, "Lista criada com sucesso!", "Tudo pronto. Agora você pode abrir suas listas ou seguir para gerar o PDF.");
          openSaveSuccessModal();
        } catch (err) {
          console.error("[Listas] Erro ao salvar no Supabase/localStorage:", err);
          alert("Não consegui salvar a lista neste navegador.");
        } finally {
          isGeneratingList = false;
          window.setTimeout(() => {
            setGenerationBusyState(false);
            resetGenerationProgress();
          }, 500);
        }
      });
    }

    // Atualiza títulos iniciais
    updateCardTitles();

    setupSaveSuccessModal();
  
