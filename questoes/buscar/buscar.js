    // =========================
    // Supabase Client
    // =========================
    const { createClient } = window.supabase || {};

    const SUPABASE_URL = window.__MM_CONFIG__?.supabaseUrl || "";
    const SUPABASE_ANON_KEY = window.__MM_CONFIG__?.supabaseAnonKey || "";

    const supabaseClient = createClient
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;
    window.supabaseClient = supabaseClient;
    const adminGuardPromise = enforceAdminGuard();

    // =========================
    if (!supabaseClient) {
      console.warn("[Buscar] Supabase não inicializado. Verifique URL e ANON KEY.");
    }

    // =========================
    // Carregar nome do administrador logado
    // =========================
    async function loadAdminName() {
      if (!supabaseClient) return;

      try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError) await handleSupabaseAuthError(userError, supabaseClient);
        if (userError || !user) {
          console.warn("[Buscar] Nenhum usuário autenticado encontrado para exibir nome.");
          return;
        }

        const nameEl = document.getElementById("user-menu-name");
        if (!nameEl) return;

        let displayName =
          (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
          user.email ||
          "Administrador";

        const { data: profileRow, error: profileError } = await supabaseClient
          .from("profiles")
          .select("nome")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileError && profileRow) {
          if (profileRow.nome)      displayName = profileRow.nome;
          else if (profileRow.name) displayName = profileRow.name;
          else if (profileRow.full_name) displayName = profileRow.full_name;
        }

        nameEl.textContent = displayName;
      } catch (e) {
        console.error("[Buscar] Erro ao carregar nome do administrador:", e);
      }
    }

    // =========================
    // Helpers de UI
    // =========================
    function setNoResults(message) {
      const cardsWrap = document.getElementById("results-cards");
      if (!cardsWrap) return;
      cardsWrap.innerHTML = `<div class="no-results">${message}</div>`;
    }

    function setSearchLayoutEmptyState(isEmpty) {
      const layout = document.querySelector(".search-layout");
      if (layout) layout.classList.toggle("is-empty-state", isEmpty);
    }

    function getAreaLabelFromDisciplina(disciplina) {
      if (!disciplina) return "";
      switch (disciplina) {
        case "matematica": return "Matemática";
        case "fisica":     return "Física";
        case "biologia":   return "Biologia";
        case "quimica":    return "Química";
        case "historia":   return "História";
        case "geografia":  return "Geografia";
        case "sociologia": return "Sociologia";
        case "filosofia":  return "Filosofia";
        case "linguagens": return "Linguagens";
        case "portugues":  return "Linguagens";
        case "literatura": return "Linguagens";
        case "artes":      return "Linguagens";
        default:           return disciplina.toUpperCase();
      }
    }

    function formatModalidadeLabel(modalidade) {
      if (!modalidade) return "-";
      const match = BASE_INSTITUTIONS.find(
        (item) => String(item.value).toLowerCase() === String(modalidade).toLowerCase()
      );
      if (match) return match.label || match.value;
      const m = String(modalidade).toLowerCase();
      switch (m) {
        case "regular":
        case "enem_regular":
          return "ENEM Regular";
        case "ppl":
        case "enem_ppl":
          return "ENEM PPL";
        case "digital":
        case "enem_digital":
          return "ENEM Digital";
        case "cesupa":
          return "CESUPA";
        case "outros":
          return "Outros";
        case "autoral":
          return "INTEGRAL ENEM";
        default:
          return modalidade.toString().toUpperCase();
      }
    }

    function sanitizeHtmlAllowImages(html) {
      if (!html) return "";
      const template = document.createElement("template");
      template.innerHTML = html;
      template.content.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
      template.content.querySelectorAll("*").forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          if (attr.name.toLowerCase().startsWith("on")) {
            el.removeAttribute(attr.name);
          }
        });
      });
      return template.innerHTML;
    }

    function extractPlainText(html) {
      if (!html) return "";
      const div = document.createElement("div");
      div.innerHTML = html;
      return (div.textContent || "").trim();
    }

    const DEFAULT_INSTITUTIONS_FALLBACK = [
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
    const BASE_INSTITUTIONS =
      INSTITUTIONS_LIST.length > 0 ? INSTITUTIONS_LIST.slice() : DEFAULT_INSTITUTIONS_FALLBACK.slice();
    if (!BASE_INSTITUTIONS.some((item) => String(item.value || "").toLowerCase() === "enem")) {
      BASE_INSTITUTIONS.unshift({ value: "ENEM", label: "ENEM" });
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

    function isEnemInstitution(value) {
      return String(value || "").toLowerCase().includes("enem");
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
            console.error("[Buscar] Erro ao carregar competências/habilidades:", error);
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

    function clearMultiSelect(wrapper) {
      if (!wrapper) return;
      wrapper.dataset.values = JSON.stringify([]);
      wrapper.querySelectorAll("input[type='checkbox']").forEach((el) => {
        el.checked = false;
      });
      const allowedValues = JSON.parse(wrapper.dataset.allowedValues || "[]");
      updateMultiSelectState(wrapper, allowedValues);
    }

    function ensureGenericMultiSelect(select, className, placeholderText) {
      if (!select) return null;
      if (select.dataset.multiReady) {
        return select.parentElement.querySelector(`.${className}`);
      }
      const wrapper = document.createElement("div");
      wrapper.className = `multi-select ${className}`;
      wrapper.dataset.values = JSON.stringify([]);
      wrapper.dataset.placeholder = placeholderText || "Todos";

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
      checks.forEach((el) => {
        const option = el.closest(".multi-option");
        if (option) {
          option.classList.toggle("is-selected", el.checked);
        }
      });
      if (trigger) {
        const placeholder = wrapper.dataset.placeholder || "Todos";
        if (!selected.length) trigger.textContent = placeholder;
        else if (selected.length === 1) trigger.textContent = selected[0];
        else trigger.textContent = `${selected.length} selecionados`;
      }
      return selected;
    }

    function getMultiValues(wrapper) {
      if (!wrapper) return [];
      return JSON.parse(wrapper.dataset.values || "[]");
    }

    // =========================
    // Variáveis globais da busca
    // =========================
    const PAGE_SIZE = 7;
    let lastSearchData = [];
    let currentPage = 1;
    let questionFilterMode = "all";
    const incorrectQuestionIds = new Set();

    function getDisplayData() {
      if (!Array.isArray(lastSearchData)) return [];
      if (questionFilterMode !== "incorrect") return lastSearchData;
      return lastSearchData.filter((q) => incorrectQuestionIds.has(String(q.id)));
    }

    function updateFilterMenuUI() {
      const menu = document.getElementById("results-filter-menu");
      if (!menu) return;
      const options = menu.querySelectorAll(".results-filter-option");
      options.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.filter === questionFilterMode);
      });
    }

    function recordAnswerResult(questionId, isCorrect) {
      if (!questionId) return;
      const key = String(questionId);
      if (isCorrect) {
        incorrectQuestionIds.delete(key);
      } else {
        incorrectQuestionIds.add(key);
      }
      if (questionFilterMode === "incorrect") {
        renderCurrentPage();
        renderPagination(getDisplayData().length);
      }
    }

    // =========================
    // Modal de visualização e resposta
    // =========================
    const modalOverlay = document.getElementById("question-modal-overlay");
    const modalCloseBtn = document.getElementById("question-modal-close");
    const modalTitle = document.getElementById("question-modal-title");
    const modalMeta = document.getElementById("question-modal-meta");
    const modalText = document.getElementById("question-modal-text");
    const modalEnunciado = document.getElementById("question-modal-enunciado");
    const modalEnunciadoTitle = document.getElementById("question-modal-enunciado-title");
    const modalFonte = document.getElementById("question-modal-source");
    const modalImage = document.getElementById("question-modal-image");
    const modalOptionsList = document.getElementById("question-modal-options");
    const modalAnswerBox = document.getElementById("question-modal-answer");
    const modalGabaritoSpan = document.getElementById("question-modal-gabarito");
    const modalExplainer = document.getElementById("question-modal-explainer");
    const modalPrevBtn = document.getElementById("question-modal-prev");
    const modalNextBtn = document.getElementById("question-modal-next");

    const modalContainer = modalOverlay ? modalOverlay.querySelector(".question-modal") : null;
    const navbarRoot = document.getElementById("navbar-root");

    let currentQuestionInModal = null;
    let currentQuestionIndexInModal = -1;
    let alreadyAnswered = false;
    let currentSelectedLetter = null;

    function updateModalNavButtons() {
      if (!modalPrevBtn || !modalNextBtn) return;
      const data = getDisplayData();
      if (!data || data.length <= 1 || currentQuestionIndexInModal < 0) {
        modalPrevBtn.disabled = true;
        modalNextBtn.disabled = true;
        return;
      }
      modalPrevBtn.disabled = currentQuestionIndexInModal <= 0;
      modalNextBtn.disabled = currentQuestionIndexInModal >= data.length - 1;
    }

    function openQuestionModal(question) {
      if (!modalOverlay) return;

      currentQuestionInModal = question;
      const data = getDisplayData();
      currentQuestionIndexInModal = Array.isArray(data)
        ? data.findIndex((q) => String(q.id) === String(question.id))
        : -1;
      alreadyAnswered = false;
      currentSelectedLetter = null;
      updateModalNavButtons();

      const idInfo = question.id ? `#${question.id}` : "";
      modalTitle.textContent = `QUESTÃO ${idInfo}`;

      const areaLabel = getAreaLabelFromDisciplina(question.disciplina);
      const modLabel = formatModalidadeLabel(question.modalidade);
      const anoLabel = question.ano ? String(question.ano) : "-";
      modalMeta.textContent = `${anoLabel} · ${modLabel} · ${areaLabel}`;

      // Texto / Enunciado separados
      // Aqui, "enunciado" (coluna principal) é o TEXTO/contexto
      // e "sub_enunciado" é a pergunta curta (ENUNCIADO)
      const texto = (question.enunciado || "").toString().trim();
      const enunciado = (question.sub_enunciado || "").toString().trim();
      const fonte = (question.fonte || "").toString().trim();
      const textoHtml = sanitizeHtmlAllowImages(texto || enunciado);
      const enunciadoHtml = sanitizeHtmlAllowImages(enunciado);

      if (modalText) {
        // Se não houver "texto" separado, usa o enunciado como fallback
        modalText.innerHTML = textoHtml || "";
        applyImageSizingToContainer(modalText);
      }

      if (modalEnunciado && modalEnunciadoTitle) {
        // Só mostra a área de ENUNCIADO se existir um enunciado separado
        // e ele for diferente do texto principal
        if (enunciado && enunciado !== texto) {
          modalEnunciado.innerHTML = enunciadoHtml;
          modalEnunciadoTitle.style.display = "";
          modalEnunciado.style.display = "";
          applyImageSizingToContainer(modalEnunciado);
        } else {
          modalEnunciado.textContent = "";
          modalEnunciadoTitle.style.display = "none";
          modalEnunciado.style.display = "none";
        }
      }

      if (modalFonte) {
        if (fonte) {
          modalFonte.textContent = fonte;
          modalFonte.style.display = "";
        } else {
          modalFonte.textContent = "";
          modalFonte.style.display = "none";
        }
      }

      if (modalFonte) {
        const fonte = (question.fonte || "").toString().trim();
        if (fonte) {
          modalFonte.textContent = fonte;
          modalFonte.style.display = "";
        } else {
          modalFonte.textContent = "";
          modalFonte.style.display = "none";
        }
      }

      if (question.imagem_url) {
        modalImage.src = question.imagem_url;
        modalImage.style.display = "block";
        applyImageSizing(modalImage);
      } else {
        modalImage.src = "";
        modalImage.style.display = "none";
      }

      modalOptionsList.innerHTML = "";
      const letras = ["A", "B", "C", "D", "E"];
      const alternativas = [
        { text: question.alternativa_a, imageUrl: question.alternativa_a_imagem_url },
        { text: question.alternativa_b, imageUrl: question.alternativa_b_imagem_url },
        { text: question.alternativa_c, imageUrl: question.alternativa_c_imagem_url },
        { text: question.alternativa_d, imageUrl: question.alternativa_d_imagem_url },
        { text: question.alternativa_e, imageUrl: question.alternativa_e_imagem_url },
      ];

      alternativas.forEach((alt, index) => {
        if (!alt.text && !alt.imageUrl) return;

        const li = document.createElement("li");
        li.className = "question-modal-option";
        li.dataset.letter = letras[index];

        const marker = document.createElement("div");
        marker.className = "question-modal-option-letter";
        marker.textContent = letras[index];

        const content = document.createElement("div");
        content.className = "question-modal-option-text";

        if (alt.imageUrl) {
          const imgAlt = document.createElement("img");
          imgAlt.src = alt.imageUrl;
          imgAlt.alt = `Alternativa ${letras[index]}`;
          imgAlt.className = "question-modal-option-image";
          content.appendChild(imgAlt);
          applyImageSizing(imgAlt);
        } else {
          content.textContent = alt.text || "";
        }

        li.appendChild(marker);
        li.appendChild(content);

        li.addEventListener("click", () => handleOptionClick(letras[index]));

        modalOptionsList.appendChild(li);
      });

      modalAnswerBox.classList.remove("visible");
      modalGabaritoSpan.textContent = "";
      modalExplainer.textContent = "";

      // Reinicia a animação suave toda vez que o painel abrir
      if (modalContainer) {
        modalContainer.classList.remove("modal-enter");
        void modalContainer.offsetWidth; // força reflow para reiniciar a animação
        modalContainer.classList.add("modal-enter");
      }

      if (navbarRoot) {
        document.body.classList.add("modal-open");
      }
      modalOverlay.classList.add("open");
    }

    function closeQuestionModal() {
      if (!modalOverlay) return;
      modalOverlay.classList.remove("open");
      document.body.classList.remove("modal-open");
      currentQuestionInModal = null;
      alreadyAnswered = false;
      currentSelectedLetter = null;
    }

    function handleOptionClick(letter) {
      if (!currentQuestionInModal || alreadyAnswered) return;

      currentSelectedLetter = letter;

      const items = modalOptionsList.querySelectorAll(".question-modal-option");
      items.forEach((item) => {
        const itemLetter = item.dataset.letter;
        item.classList.remove("is-correct", "is-selected-wrong", "is-selected");

        // remove qualquer badge/botão de confirmação anterior
        const existingConfirm = item.querySelector(".option-confirm-btn");
        if (existingConfirm) {
          existingConfirm.remove();
        }

        // adiciona o botãozinho rosa claro neon na alternativa que o aluno selecionou
        if (itemLetter === letter) {
          const confirmBtn = document.createElement("button");
          confirmBtn.type = "button";
          confirmBtn.className = "option-confirm-btn";
          confirmBtn.textContent = "Confirmar";
          confirmBtn.addEventListener("click", (event) => {
            event.stopPropagation(); // evita re-disparar o clique da alternativa
            confirmAnswer(letter);
          });
          item.appendChild(confirmBtn);
          item.classList.add("is-selected");
        }
      });

      // ao mudar a seleção, esconde temporariamente o gabarito até a confirmação
      modalAnswerBox.classList.remove("visible");
      modalGabaritoSpan.textContent = "";
      modalExplainer.textContent = "";
    }

    function confirmAnswer(letter) {
      if (!currentQuestionInModal || alreadyAnswered) return;
      alreadyAnswered = true;

      const correctRaw = (currentQuestionInModal.gabarito || "").toString().trim().toUpperCase();
      const correctLetter = correctRaw.charAt(0) || "";

      const items = modalOptionsList.querySelectorAll(".question-modal-option");
      items.forEach((item) => {
        const itemLetter = item.dataset.letter;
        item.classList.remove("is-correct", "is-selected-wrong", "is-selected");

        // se houver um botão de confirmação nessa alternativa, transforma em "Selecionada"
        const existingConfirm = item.querySelector(".option-confirm-btn");
        if (existingConfirm) {
          existingConfirm.textContent = "Selecionada";
        }

        if (itemLetter === correctLetter) {
          item.classList.add("is-correct");
        } else if (itemLetter === letter && letter !== correctLetter) {
          item.classList.add("is-selected-wrong");
        }
      });

      recordAnswerResult(currentQuestionInModal.id, letter === correctLetter);
      modalGabaritoSpan.textContent = correctLetter || correctRaw || "-";
      const explicacao = (currentQuestionInModal.gabarito_comentado || "").toString().trim();
      modalExplainer.textContent = explicacao ? explicacao : "";

      modalAnswerBox.classList.add("visible");
    }

    if (modalCloseBtn && modalOverlay) {
      modalCloseBtn.addEventListener("click", closeQuestionModal);
      modalOverlay.addEventListener("click", (event) => {
        if (event.target === modalOverlay) {
          closeQuestionModal();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalOverlay.classList.contains("open")) {
          closeQuestionModal();
        }
      });
    }

      if (modalPrevBtn) {
        modalPrevBtn.addEventListener("click", () => {
        const data = getDisplayData();
        if (!Array.isArray(data) || currentQuestionIndexInModal <= 0) return;
        const newIndex = currentQuestionIndexInModal - 1;
        const nextQuestion = data[newIndex];
        if (nextQuestion) {
          openQuestionModal(nextQuestion);
        }
      });
    }

    if (modalNextBtn) {
      modalNextBtn.addEventListener("click", () => {
        const data = getDisplayData();
        if (!Array.isArray(data) || currentQuestionIndexInModal < 0 || currentQuestionIndexInModal >= data.length - 1) return;
        const newIndex = currentQuestionIndexInModal + 1;
        const nextQuestion = data[newIndex];
        if (nextQuestion) {
          openQuestionModal(nextQuestion);
        }
      });
    }

    // =========================
    // Busca no Supabase
    // =========================
    async function runSearch() {
      const yearInput = document.getElementById("filter-year");
      const areaSelect = document.getElementById("filter-area");
      const modalitySelect = document.getElementById("filter-modality");
      const competenciaSelect = document.getElementById("filter-competencia");
      const habilidadeSelect = document.getElementById("filter-habilidade");
      const keywordInput = document.getElementById("filter-keyword");
      const contentInput = document.getElementById("filter-content");
      const topicInput = document.getElementById("filter-topic");
      const cardsWrap = document.getElementById("results-cards");

      if (!cardsWrap) return;

      const yearWrapper = document.querySelector(".multi-select-year");
      const modalityWrapper = document.querySelector(".multi-select-instituicao");
      const contentWrapper = document.querySelector(".multi-select-content");
      const topicWrapper = document.querySelector(".multi-select-topic");
      const competenciaWrapper = document.querySelector(".multi-select-competencia");
      const habilidadeWrapper = document.querySelector(".multi-select-habilidade");

      const year = yearWrapper ? getMultiValues(yearWrapper) : (yearInput ? [yearInput.value.trim()] : []);
      const area = areaSelect ? areaSelect.value : "";
      const modality = modalityWrapper ? getMultiValues(modalityWrapper) : (modalitySelect ? [modalitySelect.value] : []);
      const keyword = keywordInput ? keywordInput.value.trim() : "";
      const content = contentWrapper ? getMultiValues(contentWrapper) : (contentInput ? [contentInput.value.trim()] : []);
      const topic = topicWrapper ? getMultiValues(topicWrapper) : (topicInput ? [topicInput.value.trim()] : []);
      const competencia = competenciaWrapper
        ? getMultiValues(competenciaWrapper)
        : (competenciaSelect ? [competenciaSelect.value.trim()] : []);
      const habilidade = habilidadeWrapper
        ? getMultiValues(habilidadeWrapper)
        : (habilidadeSelect ? [habilidadeSelect.value.trim()] : []);

      const yearValues = year
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value));
      const modalityValues = modality.filter((value) => value);
      const contentValues = content.filter((value) => value);
      const topicValues = topic.filter((value) => value);
      const hasEnem = modalityValues.some(isEnemInstitution);
      const competenciaValues = hasEnem ? competencia.filter((value) => value) : [];
      const habilidadeValues = hasEnem ? habilidade.filter((value) => value) : [];

      const countSpan = document.getElementById("results-count");
      const scorecardsWrap = document.getElementById("results-scorecards");
      const filterIcon = document.querySelector(".results-filter-icon");
      const filterMenu = document.getElementById("results-filter-menu");
      if (!yearValues.length && !area && !modalityValues.length && !keyword && !contentValues.length && !topicValues.length && !competenciaValues.length && !habilidadeValues.length) {
        setNoResults("Defina os parâmetros de busca!");
        setSearchLayoutEmptyState(true);
        if (countSpan) countSpan.textContent = "";
        if (scorecardsWrap) scorecardsWrap.classList.add("is-hidden");
        if (filterIcon) filterIcon.classList.remove("is-visible");
        if (filterMenu) filterMenu.classList.remove("is-open");
        lastSearchData = [];
        currentPage = 1;
        renderPagination(0);
        return;
      }

      setSearchLayoutEmptyState(false);

      if (!supabaseClient) {
        setNoResults("Supabase não está configurado. Ajuste a URL/KEY no buscar.html.");
        if (countSpan) countSpan.textContent = "";
        return;
      }

      let query = supabaseClient
        .from("questions")
        .select(`
          id,
          ano,
          disciplina,
          modalidade,
          enunciado,
          sub_enunciado,
          autor,
          imagem_url,
          alternativa_a,
          alternativa_b,
          alternativa_c,
          alternativa_d,
          alternativa_e,
          alternativa_a_imagem_url,
          alternativa_b_imagem_url,
          alternativa_c_imagem_url,
          alternativa_d_imagem_url,
          alternativa_e_imagem_url,
          gabarito,
          gabarito_comentado,
          conteudo,
          dificuldade,
          fonte
        `)
        .eq("status", "aprovada")
        .order("id", { ascending: true });

      if (yearValues.length) {
        query = query.in("ano", yearValues);
      }

      if (modalityValues.length) {
        query = query.in("modalidade", modalityValues);
      }

      if (area) {
        query = query.eq("disciplina", area);
      }

      if (keyword) {
        const normalized = keyword.replace("#", "").trim();
        const keywordId = /^\d+$/.test(normalized) ? Number(normalized) : null;
        if (Number.isFinite(keywordId) && keywordId > 0) {
          query = query.eq("id", keywordId);
        } else {
          query = query.ilike("enunciado", `%${keyword}%`);
        }
      }

      if (contentValues.length) {
        query = query.in("conteudo", contentValues);
      }

      if (topicValues.length) {
        query = query.in("tags", topicValues);
      }

      if (competenciaValues.length) {
        query = query.in("competencia", competenciaValues);
      }

      if (habilidadeValues.length) {
        query = query.in("habilidade", habilidadeValues);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[Buscar] Erro ao buscar questões:", error);
        setNoResults("Erro ao buscar questões. Veja o console para mais detalhes.");
        if (countSpan) countSpan.textContent = "";
        if (scorecardsWrap) scorecardsWrap.classList.add("is-hidden");
        if (filterIcon) filterIcon.classList.remove("is-visible");
        if (filterMenu) filterMenu.classList.remove("is-open");
        return;
      }

      if (!data || data.length === 0) {
        setNoResults("Nenhuma questão encontrada!");
        if (countSpan) countSpan.textContent = "";
        if (scorecardsWrap) scorecardsWrap.classList.add("is-hidden");
        if (filterIcon) filterIcon.classList.remove("is-visible");
        if (filterMenu) filterMenu.classList.remove("is-open");
        renderPagination(0);
        return;
      }

      lastSearchData = data;
      currentPage = 1;

      if (countSpan) {
        const n = data.length;
        countSpan.textContent =
          n === 1 ? "→ 1 questão encontrada" : `→ ${n} questões encontradas`;
      }
      if (scorecardsWrap) scorecardsWrap.classList.remove("is-hidden");
      if (filterIcon) filterIcon.classList.add("is-visible");
      updateFilterMenuUI();

      renderCurrentPage();
      renderPagination(getDisplayData().length);
    }

    function renderCurrentPage() {
      const cardsWrap = document.getElementById("results-cards");
      if (!cardsWrap) return;
      cardsWrap.innerHTML = "";
      const dataToRender = getDisplayData();
      if (!dataToRender.length) {
        const message = questionFilterMode === "incorrect"
          ? "Nenhuma questão incorreta encontrada!"
          : "Nenhuma questão encontrada!";
        setNoResults(message);
        return;
      }
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageData = dataToRender.slice(start, end);
      pageData.forEach((question) => {
        cardsWrap.appendChild(buildQuestionCard(question));
      });
    }

    function buildQuestionCard(question) {
      const card = document.createElement("article");
      card.className = "question-card";
      card.dataset.questionId = question.id || "";

      const header = document.createElement("div");
      header.className = "question-card-header";

      const title = document.createElement("div");
      title.className = "question-card-title";
      title.textContent = question.id ? `ID #${question.id}` : "Questão";

      const meta = document.createElement("div");
      meta.className = "question-card-meta";
      const areaLabel = getAreaLabelFromDisciplina(question.disciplina);
      const modLabel = formatModalidadeLabel(question.modalidade);
      const anoLabel = question.ano ? String(question.ano) : "-";
      meta.textContent = `${anoLabel} · ${modLabel} · ${areaLabel}`;

      header.appendChild(title);
      header.appendChild(meta);
      card.appendChild(header);

      const body = document.createElement("div");
      body.className = "question-card-body";

      const texto = (question.enunciado || "").toString().trim();
      const enunciado = (question.sub_enunciado || "").toString().trim();
      const textoHtml = sanitizeHtmlAllowImages(texto || enunciado);
      const enunciadoHtml = sanitizeHtmlAllowImages(enunciado);

      if (textoHtml) {
        const textTitle = document.createElement("div");
        textTitle.className = "question-card-section-title";
        textTitle.textContent = "Texto";
        const textContent = document.createElement("div");
        textContent.className = "question-card-text";
        textContent.innerHTML = textoHtml;
        body.appendChild(textTitle);
        body.appendChild(textContent);
        applyImageSizingToContainer(textContent);
      }

      if (question.imagem_url) {
        const img = document.createElement("img");
        img.className = "question-card-image";
        img.src = question.imagem_url;
        img.alt = "Imagem da questão";
        body.appendChild(img);
        applyImageSizing(img);
      }

      if (enunciado && enunciado !== texto) {
        const enTitle = document.createElement("div");
        enTitle.className = "question-card-section-title";
        enTitle.textContent = "Enunciado";
        const enContent = document.createElement("div");
        enContent.className = "question-card-text";
        enContent.innerHTML = enunciadoHtml;
        body.appendChild(enTitle);
        body.appendChild(enContent);
        applyImageSizingToContainer(enContent);
      }

      const optionsTitle = document.createElement("div");
      optionsTitle.className = "question-card-section-title";
      optionsTitle.textContent = "Alternativas";
      body.appendChild(optionsTitle);

      const optionsList = document.createElement("ol");
      optionsList.className = "question-modal-options";

      const letras = ["A", "B", "C", "D", "E"];
      const alternativas = [
        { text: question.alternativa_a, imageUrl: question.alternativa_a_imagem_url },
        { text: question.alternativa_b, imageUrl: question.alternativa_b_imagem_url },
        { text: question.alternativa_c, imageUrl: question.alternativa_c_imagem_url },
        { text: question.alternativa_d, imageUrl: question.alternativa_d_imagem_url },
        { text: question.alternativa_e, imageUrl: question.alternativa_e_imagem_url },
      ];

      let answered = false;

      function setSelected(letter) {
        if (answered) return;
        const items = optionsList.querySelectorAll(".question-modal-option");
        items.forEach((item) => {
          const itemLetter = item.dataset.letter;
          item.classList.remove("is-correct", "is-selected-wrong", "is-selected");
          const existingConfirm = item.querySelector(".option-confirm-btn");
          if (existingConfirm) existingConfirm.remove();
          if (itemLetter === letter) {
            const confirmBtn = document.createElement("button");
            confirmBtn.type = "button";
            confirmBtn.className = "option-confirm-btn";
            confirmBtn.textContent = "Confirmar";
            confirmBtn.addEventListener("click", (event) => {
              event.stopPropagation();
              confirmAnswer(letter);
            });
            item.appendChild(confirmBtn);
            item.classList.add("is-selected");
          }
        });
        answerBox.classList.remove("visible");
        gabaritoSpan.textContent = "";
        explainer.textContent = "";
      }

      function confirmAnswer(letter) {
        if (answered) return;
        answered = true;
        const correctRaw = (question.gabarito || "").toString().trim().toUpperCase();
        const correctLetter = correctRaw.charAt(0) || "";
        const items = optionsList.querySelectorAll(".question-modal-option");
        items.forEach((item) => {
          const itemLetter = item.dataset.letter;
          item.classList.remove("is-correct", "is-selected-wrong", "is-selected");
          const existingConfirm = item.querySelector(".option-confirm-btn");
          if (existingConfirm) {
            existingConfirm.textContent = "Selecionada";
          }
          if (itemLetter === correctLetter) {
            item.classList.add("is-correct");
          } else if (itemLetter === letter && letter !== correctLetter) {
            item.classList.add("is-selected-wrong");
          }
        });
        recordAnswerResult(question.id, letter === correctLetter);
        gabaritoSpan.textContent = correctLetter || correctRaw || "-";
        const explicacao = (question.gabarito_comentado || "").toString().trim();
        explainer.textContent = explicacao ? explicacao : "";
        answerBox.classList.add("visible");
      }

      alternativas.forEach((alt, index) => {
        if (!alt.text && !alt.imageUrl) return;
        const li = document.createElement("li");
        li.className = "question-modal-option";
        li.dataset.letter = letras[index];

        const marker = document.createElement("div");
        marker.className = "question-modal-option-letter";
        marker.textContent = letras[index];

        const content = document.createElement("div");
        content.className = "question-modal-option-text";
        if (alt.imageUrl) {
          const imgAlt = document.createElement("img");
          imgAlt.src = alt.imageUrl;
          imgAlt.alt = `Alternativa ${letras[index]}`;
          imgAlt.className = "question-modal-option-image";
          content.appendChild(imgAlt);
          applyImageSizing(imgAlt);
        } else {
          content.textContent = alt.text || "";
        }

        li.appendChild(marker);
        li.appendChild(content);
        li.addEventListener("click", () => setSelected(letras[index]));
        optionsList.appendChild(li);
      });

      body.appendChild(optionsList);

      const answerBox = document.createElement("div");
      answerBox.className = "question-modal-answer";
      const answerRow = document.createElement("div");
      answerRow.innerHTML = `<strong>Gabarito:</strong> <span class="question-gabarito"></span>`;
      const explainer = document.createElement("div");
      explainer.className = "question-modal-explainer";
      const gabaritoSpan = answerRow.querySelector(".question-gabarito");
      answerBox.appendChild(answerRow);
      answerBox.appendChild(explainer);
      body.appendChild(answerBox);

      card.appendChild(body);
      applyImageSizingToContainer(card);
      return card;
    }

    function renderPagination(totalItems) {
      const pagination = document.getElementById("pagination");
      const pagesContainer = document.getElementById("pagination-pages");
      if (!pagination || !pagesContainer) return;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);

      if (totalPages <= 1) {
        pagination.style.display = "none";
        return;
      }

      pagination.style.display = "flex";
      pagesContainer.innerHTML = "";

      const maxPagesToShow = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let page = startPage; page <= endPage; page++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pagination-page";
        btn.textContent = String(page);
        if (page === currentPage) {
          btn.classList.add("active");
        }
        btn.addEventListener("click", () => {
          currentPage = page;
          renderCurrentPage();
          renderPagination(totalItems);
        });
        pagesContainer.appendChild(btn);
      }

      const prevBtn = pagination.querySelector('[data-page="prev"]');
      const nextBtn = pagination.querySelector('[data-page="next"]');
      if (prevBtn) prevBtn.disabled = currentPage <= 1;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    // Listeners de filtro
    document.getElementById("filter-keyword").addEventListener("input", runSearch);

    function setupFilterMultiselects() {
      const yearSelect = document.getElementById("filter-year");
      const areaSelect = document.getElementById("filter-area");
      const modalitySelect = document.getElementById("filter-modality");
      const contentSelect = document.getElementById("filter-content");
      const topicSelect = document.getElementById("filter-topic");
      const competenciaSelect = document.getElementById("filter-competencia");
      const habilidadeSelect = document.getElementById("filter-habilidade");

      if (yearSelect) {
        for (let y = 2026; y >= 2000; y--) {
          const opt = document.createElement("option");
          opt.value = String(y);
          opt.textContent = y;
          yearSelect.appendChild(opt);
        }
        const yearOptions = Array.from(yearSelect.options)
          .map((option) => ({ value: option.value, label: option.textContent.trim() }))
          .filter((option) => option.value);
        const wrapper = ensureGenericMultiSelect(yearSelect, "multi-select-year", "Ano");
        if (wrapper) {
          setMultiSelectOptions(wrapper, yearOptions);
          setAllowedValues(wrapper, yearOptions.map((opt) => opt.value));
          updateMultiSelectState(wrapper, yearOptions.map((opt) => opt.value));
          const menu = wrapper.querySelector(".multi-menu");
          if (menu) bindMultiMenu(menu);
          bindMultiMenuChange(menu, wrapper, runSearch);
        }
      }

      if (modalitySelect) {
        const modalityOptions = BASE_INSTITUTIONS.slice();
        const wrapper = ensureGenericMultiSelect(modalitySelect, "multi-select-instituicao", "Instituição");
        if (wrapper) {
          setMultiSelectOptions(wrapper, modalityOptions);
          setAllowedValues(wrapper, modalityOptions.map((opt) => opt.value));
          updateMultiSelectState(wrapper, modalityOptions.map((opt) => opt.value));
          const menu = wrapper.querySelector(".multi-menu");
          if (menu) bindMultiMenu(menu);
          bindMultiMenuChange(menu, wrapper, () => {
            updateEnemFilters();
            runSearch();
          });
        }
        modalitySelect.addEventListener("change", () => {
          updateEnemFilters();
          runSearch();
        });
      }

      const contentWrapper = contentSelect
        ? ensureGenericMultiSelect(contentSelect, "multi-select-content", "Conteúdo")
        : null;
      const topicWrapper = topicSelect
        ? ensureGenericMultiSelect(topicSelect, "multi-select-topic", "Tópico")
        : null;
      const competenciaWrapper = competenciaSelect
        ? ensureGenericMultiSelect(competenciaSelect, "multi-select-competencia", "Competência")
        : null;
      const habilidadeWrapper = habilidadeSelect
        ? ensureGenericMultiSelect(habilidadeSelect, "multi-select-habilidade", "Habilidade")
        : null;

      if (topicWrapper) {
        topicWrapper.classList.add("multi-filter-topic");
      }

      const refreshContentAndTopics = () => {
        if (!contentWrapper || !topicWrapper) return;
        const area = areaSelect ? areaSelect.value : "";
        const contents = area ? getContentsForDiscipline(area) : [];
        setMultiSelectOptions(contentWrapper, contents);
        setAllowedValues(contentWrapper, contents);
        const selectedContents = updateMultiSelectState(contentWrapper, contents);
        const contentsForTopics = selectedContents.length ? selectedContents : contents;
        const grouped = contentsForTopics
          .map((content) => ({
            label: content,
            options: getTopicsForContent(area, content),
          }))
          .filter((group) => group.options.length);
        setTopicoMultiOptions(topicWrapper, grouped);
        const flatTopics = grouped.flatMap((group) => group.options);
        setAllowedValues(topicWrapper, flatTopics);
        updateMultiSelectState(topicWrapper, flatTopics);
        const topicMenu = topicWrapper.querySelector(".multi-menu");
        if (topicMenu) bindMultiMenu(topicMenu);
      };

      if (contentWrapper) {
        const contentMenu = contentWrapper.querySelector(".multi-menu");
        if (contentMenu) bindMultiMenu(contentMenu);
        bindMultiMenuChange(contentMenu, contentWrapper, () => {
          refreshContentAndTopics();
          runSearch();
        });
      }

      if (topicWrapper) {
        const topicMenu = topicWrapper.querySelector(".multi-menu");
        if (topicMenu) bindMultiMenu(topicMenu);
        bindMultiMenuChange(topicMenu, topicWrapper, runSearch);
      }

      if (areaSelect) {
        areaSelect.addEventListener("change", () => {
          refreshContentAndTopics();
          runSearch();
        });
      }

      const updateEnemFilters = async () => {
        const enemGroups = [
          document.querySelector(".filter-competencia"),
          document.querySelector(".filter-habilidade")
        ];
        const modalityWrapper = document.querySelector(".multi-select-instituicao");
        const values = modalityWrapper ? getMultiValues(modalityWrapper) : (modalitySelect ? [modalitySelect.value] : []);
        const hasEnem = values.some(isEnemInstitution);
        enemGroups.forEach((group) => {
          if (!group) return;
          group.classList.toggle("is-visible", hasEnem);
        });

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
          bindMultiMenuChange(menu, competenciaWrapper, runSearch);
        }
        if (habilidadeWrapper) {
          setMultiSelectOptions(habilidadeWrapper, habilidades);
          setAllowedValues(habilidadeWrapper, habilidades);
          updateMultiSelectState(habilidadeWrapper, habilidades);
          const menu = habilidadeWrapper.querySelector(".multi-menu");
          if (menu) bindMultiMenu(menu);
          bindMultiMenuChange(menu, habilidadeWrapper, runSearch);
        }
      };

      refreshContentAndTopics();
      updateEnemFilters();
    }

    document.addEventListener("DOMContentLoaded", async () => {
      await adminGuardPromise;
      setNoResults("Defina os parâmetros de busca!");
      setSearchLayoutEmptyState(true);
      const countSpan = document.getElementById("results-count");
      const scorecardsWrap = document.getElementById("results-scorecards");
      const filterIcon = document.querySelector(".results-filter-icon");
      const filterImg = document.getElementById("results-filter-img");
      const filterBtn = document.getElementById("results-filter-btn");
      const filterMenu = document.getElementById("results-filter-menu");
      if (countSpan) countSpan.textContent = "";
      if (scorecardsWrap) scorecardsWrap.classList.add("is-hidden");
      if (filterIcon) filterIcon.classList.remove("is-visible");
      renderPagination(0);
      setupFilterMultiselects();
      loadAdminName();

      const updateFilterIconTheme = () => {
        if (!filterImg) return;
        const theme =
          window.ThemeManager?.get?.() ||
          document.documentElement.dataset.theme ||
          "dark";
        filterImg.src =
          theme === "light"
            ? "/imagens/filter.png"
            : "/imagens/white-filter.png";
      };
      updateFilterIconTheme();
      window.addEventListener("themechange", updateFilterIconTheme);

      if (filterBtn && filterMenu) {
        const closeMenu = () => {
          filterMenu.classList.remove("is-open");
          filterMenu.setAttribute("aria-hidden", "true");
          filterBtn.setAttribute("aria-expanded", "false");
        };
        filterBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          const willOpen = !filterMenu.classList.contains("is-open");
          filterMenu.classList.toggle("is-open", willOpen);
          filterMenu.setAttribute("aria-hidden", String(!willOpen));
          filterBtn.setAttribute("aria-expanded", String(willOpen));
        });
        document.addEventListener("click", (event) => {
          if (filterBtn.contains(event.target) || filterMenu.contains(event.target)) return;
          closeMenu();
        });
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape") closeMenu();
        });
        filterMenu.querySelectorAll(".results-filter-option").forEach((btn) => {
          btn.addEventListener("click", () => {
            const mode = btn.dataset.filter === "incorrect" ? "incorrect" : "all";
            questionFilterMode = mode;
            updateFilterMenuUI();
            currentPage = 1;
            renderCurrentPage();
            renderPagination(getDisplayData().length);
            closeMenu();
          });
        });
      }

      const pagination = document.getElementById("pagination");
      if (pagination) {
        pagination.addEventListener("click", (event) => {
          const target = event.target.closest(".pagination-btn");
          if (!target) return;
          if (target.dataset.page === "prev") {
            if (currentPage > 1) {
              currentPage -= 1;
              renderCurrentPage();
              renderPagination(getDisplayData().length);
            }
          } else if (target.dataset.page === "next") {
            const totalPages = Math.ceil(getDisplayData().length / PAGE_SIZE);
            if (currentPage < totalPages) {
              currentPage += 1;
              renderCurrentPage();
              renderPagination(getDisplayData().length);
            }
          }
        });
      }
    });
  
