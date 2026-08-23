(function () {
  "use strict";

  /* ─── Subject registry ──────────────────────────────── */
  const SUBJECTS = {
    matematica:  { label: "Matemática",  color: "var(--s-mat)",  cssVar: "--s-mat" },
    fisica:      { label: "Física",      color: "var(--s-sci)",  cssVar: "--s-sci" },
    biologia:    { label: "Biologia",    color: "var(--s-sci)",  cssVar: "--s-sci" },
    quimica:     { label: "Química",     color: "var(--s-sci)",  cssVar: "--s-sci" },
    historia:    { label: "História",    color: "var(--s-hum)",  cssVar: "--s-hum" },
    geografia:   { label: "Geografia",   color: "var(--s-hum)",  cssVar: "--s-hum" },
    sociologia:  { label: "Sociologia",  color: "var(--s-hum)",  cssVar: "--s-hum" },
    filosofia:   { label: "Filosofia",   color: "var(--s-hum)",  cssVar: "--s-hum" },
    linguagens:  { label: "Linguagens",  color: "var(--s-lang)", cssVar: "--s-lang" },
    ingles:      { label: "Inglês",      color: "var(--s-lang)", cssVar: "--s-lang" },
    redacao:     { label: "Redação",     color: "var(--s-redo)", cssVar: "--s-redo" },
    espanhol:    { label: "Espanhol",    color: "var(--s-esp)",  cssVar: "--s-esp" },
    simulado:    { label: "Simulado",    color: "var(--s-sim)",  cssVar: "--s-sim" },
  };

  // Sinônimos antigos que hoje caem todos dentro de "linguagens"
  // (portugues/literatura/artes eram disciplinas separadas antes).
  const SUBJECT_ALIASES = {
    portugues: "linguagens",
    literatura: "linguagens",
    artes: "linguagens",
  };

  function normalizeKey(str) {
    const raw = String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z]/g, "");
    return SUBJECT_ALIASES[raw] || raw;
  }

  function getSubject(raw) {
    const key = normalizeKey(raw);
    // direct match
    if (SUBJECTS[key]) return { key, ...SUBJECTS[key] };
    // partial match
    for (const [k, v] of Object.entries(SUBJECTS)) {
      if (key.includes(k) || k.includes(key)) return { key: k, ...v };
    }
    return { key, label: raw || "Outros", color: "var(--s-def)", cssVar: "--s-def" };
  }

  /**
   * Extrai a chave de disciplina do campo `notes` de cronograma_entries
   * (formato "Matemática • 30 questões • 15 acertos"). Usado como fallback
   * para entradas antigas que não possuem a coluna `subject`.
   * @param {string} notes
   * @returns {string|null} Chave da disciplina, ou null se não identificada.
   */
  function resolveSubjectKeyFromNotes(notes) {
    const label = normalizeKey(String(notes || "").split("•")[0]);
    if (!label) return null;
    for (const k of Object.keys(SUBJECTS)) {
      if (label.includes(k)) return k;
    }
    if (label.includes("linguagens")) return "linguagens";
    return null;
  }

  /* ─── Classification levels ─────────────────────────── */
  // Based on the average number of correct answers (out of 180) across
  // the student's most recently registered simulados.
  const RANK_LEVELS = [
    { name: "Iniciante",   min: 0,   max: 100, color: "var(--rank-1)", hex: "#9ca3af" },
    { name: "Em Evolução", min: 101, max: 120, color: "var(--rank-2)", hex: "#06b6d4" },
    { name: "Competitivo", min: 121, max: 135, color: "var(--rank-3)", hex: "#10b981" },
    { name: "Avançado",    min: 136, max: 145, color: "var(--rank-4)", hex: "#8b5cf6" },
    { name: "Dominante",   min: 146, max: 159, color: "var(--rank-5)", hex: "#2f4bff" },
    { name: "Elite",       min: 160, max: 180, color: "var(--rank-6)", hex: "#c026d3" },
  ];

  function getRank(media) {
    if (media == null) return RANK_LEVELS[0];
    for (let i = RANK_LEVELS.length - 1; i >= 0; i--) {
      if (media >= RANK_LEVELS[i].min) return RANK_LEVELS[i];
    }
    return RANK_LEVELS[0];
  }

  function fmtRankRange(rank) {
    if (rank.min === 0) return `até ${rank.max}/180 acertos`;
    if (rank.max >= 180) return `${rank.min}-180/180 acertos`;
    return `${rank.min}-${rank.max}/180 acertos`;
  }

  /* ─── Rank emblems (badge icons) ─────────────────────── */
  // Cada nível tem um ícone crescente em prestígio: semente → galões → estrela → coroa.
  function chevronGroup(n) {
    const sets = { 1: [32], 2: [26.5, 38.5], 3: [22, 31.5, 41] };
    const positions = sets[n] || [32];
    return positions
      .map(
        (cy) =>
          `<path d="M21,${cy + 6} L32,${cy - 6} L43,${cy + 6}" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`
      )
      .join("");
  }

  function rankIconInner(idx) {
    switch (idx) {
      case 0:
        return `<circle cx="32" cy="34" r="5" fill="currentColor"/>`;
      case 1:
        return chevronGroup(1);
      case 2:
        return chevronGroup(2);
      case 3:
        return chevronGroup(3);
      case 4:
        return `<polygon points="32,20 34.94,27.96 43.41,28.29 36.76,33.55 39.05,41.71 32,37 24.95,41.71 27.24,33.55 20.59,28.29 29.06,27.96" fill="currentColor"/>`;
      case 5:
        return `<polygon points="19,42 19,29 25.5,35.5 32,25 38.5,35.5 45,29 45,42" fill="currentColor"/><circle cx="19" cy="29" r="2.4" fill="currentColor"/><circle cx="32" cy="25" r="2.6" fill="currentColor"/><circle cx="45" cy="29" r="2.4" fill="currentColor"/>`;
      default:
        return "";
    }
  }

  // Emblema grande: escudo com gradiente da tier + ícone branco.
  function svgRankEmblem(idx) {
    const gradId = `rankGrad${idx}`;
    return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" style="stop-color:var(--rank-${idx + 1}-g1)"/>
          <stop offset="100%" style="stop-color:var(--rank-${idx + 1}-g2)"/>
        </linearGradient>
      </defs>
      <path d="M32 3 L56 12.5 V29 C56 46.5 46 57.5 32 61.5 C18 57.5 8 46.5 8 29 V12.5 Z" fill="url(#${gradId})" stroke="rgba(255,255,255,0.55)" stroke-width="1.3"/>
      <path d="M32 3 L56 12.5 V29 C56 46.5 46 57.5 32 61.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      <g style="color:#fff">${rankIconInner(idx)}</g>
    </svg>`;
  }

  // Ícone mini reutilizado na escada de progressão (cor herdada do container).
  function svgRankLadderIcon(idx) {
    return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">${rankIconInner(idx)}</svg>`;
  }

  /* ─── Utilities ─────────────────────────────────────── */
  function fmtHours(h) {
    const v = Math.round(h * 10) / 10;
    return v % 1 === 0 ? `${v}h` : `${v}h`;
  }

  function fmtNum(n) {
    return Number(n).toLocaleString("pt-BR");
  }

  function fmtRate(correct, total) {
    if (!total) return "—";
    return `${Math.round((correct / total) * 100)}%`;
  }

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  function formatWeekLabel(iso) {
    const d = new Date(iso + "T00:00:00");
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function getPeriodStart(period) {
    const now = new Date();
    if (period === "1m") {
      now.setMonth(now.getMonth() - 1);
      return now.toISOString().slice(0, 10);
    }
    if (period === "3m") {
      now.setMonth(now.getMonth() - 3);
      return now.toISOString().slice(0, 10);
    }
    return null; // all time
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
  /**
   * Busca respostas de questões do usuário e agrega totais por disciplina.
   * @param {string|null} userId
   * @param {string|null} periodStart Data ISO de início do período, ou null para todo o histórico.
   * @returns {Promise<{total: number, acertos: number, bySubject: Object}>}
   */
  async function fetchQuestionsData(userId, periodStart) {
    const client = window.supabaseClient;
    if (!client || !userId) return { total: 0, acertos: 0, bySubject: {} };

    try {
      // JOIN em uma única query, evitando um segundo SELECT em questions WHERE id IN (...)
      let q = client
        .from("lista_respostas")
        .select("correta, questao_id, respondida_em, questions(disciplina)")
        .eq("user_id", userId);

      if (periodStart) q = q.gte("respondida_em", periodStart);

      const { data: respostas, error } = await q;
      if (error || !respostas?.length) return { total: 0, acertos: 0, bySubject: {} };

      const total = respostas.length;
      const acertos = respostas.filter((r) => r.correta).length;
      const bySubject = {};

      respostas.forEach((r) => {
        const disc = r.questions?.disciplina || "outros";
        const sub = getSubject(disc);
        const k = sub.key;
        if (!bySubject[k]) bySubject[k] = { subj: sub, total: 0, acertos: 0 };
        bySubject[k].total++;
        if (r.correta) bySubject[k].acertos++;
      });

      return { total, acertos, bySubject };
    } catch (err) {
      console.warn("[Geral] Erro ao buscar questões:", err);
      return { total: 0, acertos: 0, bySubject: {} };
    }
  }

  /**
   * Busca entradas do cronograma do usuário e agrega horas/questões por semana e disciplina.
   * @param {string|null} userId
   * @param {string|null} periodStart Data ISO de início do período, ou null para todo o histórico.
   * @returns {Promise<{totalHours: number, totalQuestions: number, totalHits: number, hoursByWeek: Object, hoursBySubject: Object, questionsBySubject: Object}>}
   */
  async function fetchCronogramaData(userId, periodStart) {
    const client = window.supabaseClient;
    if (!client || !userId) return { totalHours: 0, totalQuestions: 0, totalHits: 0, hoursByWeek: {}, hoursBySubject: {}, questionsBySubject: {} };

    try {
      let q = client
        .from("cronograma_entries")
        .select("week_start, notes, hours, questions, hits, subject")
        .eq("user_id", userId);

      if (periodStart) q = q.gte("week_start", periodStart);

      const { data: entries, error } = await q;
      if (error || !entries?.length) return { totalHours: 0, totalQuestions: 0, totalHits: 0, hoursByWeek: {}, hoursBySubject: {}, questionsBySubject: {} };

      let totalHours = 0;
      let totalQuestions = 0;
      let totalHits = 0;
      const hoursByWeek = {};
      const hoursBySubject = {};
      const questionsBySubject = {};

      entries.forEach((e) => {
        const h = Number(e.hours) || 0;
        const q = Number(e.questions) || 0;
        const hits = Number(e.hits) || 0;

        totalHours += h;
        totalQuestions += q;
        totalHits += hits;

        // Usa coluna "subject" (novas entradas) ou parseia de "notes" (entradas antigas)
        const subjKey = e.subject || resolveSubjectKeyFromNotes(e.notes);
        const sub = subjKey ? getSubject(subjKey) : null;

        if (e.week_start && h > 0) {
          hoursByWeek[e.week_start] = (hoursByWeek[e.week_start] || 0) + h;
        }

        if (sub) {
          const k = sub.key;
          if (h > 0) {
            if (!hoursBySubject[k]) hoursBySubject[k] = { subj: sub, hours: 0 };
            hoursBySubject[k].hours += h;
          }
          if (q > 0) {
            if (!questionsBySubject[k]) questionsBySubject[k] = { subj: sub, total: 0, acertos: 0 };
            questionsBySubject[k].total += q;
            questionsBySubject[k].acertos += hits;
          }
        }
      });

      return { totalHours, totalQuestions, totalHits, hoursByWeek, hoursBySubject, questionsBySubject };
    } catch (err) {
      console.warn("[Geral] Erro ao buscar cronograma:", err);
      return { totalHours: 0, totalQuestions: 0, totalHits: 0, hoursByWeek: {}, hoursBySubject: {}, questionsBySubject: {} };
    }
  }

  /**
   * Busca contagem de flashcards criados e estudados pelo usuário.
   * @param {string|null} userId
   * @param {string|null} periodStart Data ISO de início do período, ou null para todo o histórico.
   * @returns {Promise<{studied: number, total: number}>}
   */
  async function fetchFlashcardsData(userId, periodStart) {
    const client = window.supabaseClient;
    if (!client || !userId) return { studied: 0, total: 0 };

    try {
      let cardsQuery = client.from("flashcard_cards").select("id", { count: "exact", head: true }).eq("user_id", userId);
      if (periodStart) cardsQuery = cardsQuery.gte("created_at", periodStart);

      const [studyRes, totalRes] = await Promise.all([
        client.from("flashcard_study_progress").select("card_id", { count: "exact", head: true }).eq("user_id", userId),
        cardsQuery,
      ]);

      return {
        studied: studyRes.count || 0,
        total: totalRes.count || 0,
      };
    } catch (err) {
      console.warn("[Geral] Erro ao buscar flashcards:", err);
      return { studied: 0, total: 0 };
    }
  }

  /* ─── Simulado scoring ──────────────────────────────── */
  /**
   * Mapa de tópico normalizado → dia do ENEM correspondente.
   * Dia 2 = Matemática + Ciências da Natureza (90 questões).
   * Dia 1 = Linguagens + Ciências Humanas (90 questões).
   */
  const SIMULADO_TOPIC_DAY = {
    "dia 2 - completo": "dia2_completo",
    "dia 1 - completo": "dia1_completo",
    "matematica":       "dia2",
    "naturezas":        "dia2",
    "humanas":          "dia1",
    "linguagens":       "dia1",
  };

  function normSimuladoTopic(t) {
    return String(t || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().trim();
  }

  /**
   * Busca o melhor resultado histórico de simulados do usuário, combinando
   * a fonte legada (cronograma_entries) com a página dedicada /simulados.
   * @param {string|null} userId
   * @param {string|null} periodStart Data ISO de início do período, ou null para todo o histórico.
   * @returns {Promise<{total: number|null, dia1: number, dia2: number}>} `total` é null se nenhum simulado foi registrado.
   */
  async function fetchSimuladoData(userId, periodStart) {
    const client = window.supabaseClient;
    if (!client || !userId) return { total: null, dia1: 0, dia2: 0 };

    try {
      const [legacyRes, novosRes] = await Promise.all([
        (async () => {
          // Fonte legada: simulados registrados pela antiga aba "Simulado" do Calendário
          // (cronograma_entries, com o dia/área embutido no texto de "topic").
          // Mantida somente para leitura — não é mais possível criar entradas assim.
          let q = client
            .from("cronograma_entries")
            .select("topic, hits, questions, week_start")
            .eq("user_id", userId)
            .eq("subject", "simulado")
            .gt("hits", 0);
          if (periodStart) q = q.gte("week_start", periodStart);
          const { data, error } = await q;
          return error ? [] : data || [];
        })(),
        (async () => {
          // Fonte atual: página dedicada /simulados. data_dia1/data_dia2 são
          // individualmente opcionais (simulado parcial), então o filtro de
          // período é feito aqui no cliente pela "data efetiva" (dia1 ou dia2).
          const { data, error } = await client
            .from("simulados")
            .select("data_dia1, data_dia2, acertos_linguagens, acertos_humanas, acertos_matematica, acertos_natureza")
            .eq("user_id", userId);
          if (error) return [];
          const rows = data || [];
          if (!periodStart) return rows;
          return rows.filter((row) => (row.data_dia1 || row.data_dia2 || "") >= periodStart);
        })(),
      ]);

      // Best hits per normalised topic key (fonte legada)
      const bestLegacy = {};
      legacyRes.forEach((row) => {
        const key = normSimuladoTopic(row.topic);
        const h = Number(row.hits) || 0;
        if (h > (bestLegacy[key] ?? -1)) bestLegacy[key] = h;
      });
      const bestDia2Complete = bestLegacy["dia 2 - completo"] ?? 0;
      const bestDia1Complete = bestLegacy["dia 1 - completo"] ?? 0;

      // Melhor acerto histórico por área, combinando fonte legada + página /simulados
      let bestMat  = bestLegacy["matematica"] ?? 0;
      let bestNat  = bestLegacy["naturezas"]  ?? 0;
      let bestHum  = bestLegacy["humanas"]    ?? 0;
      let bestLing = bestLegacy["linguagens"] ?? 0;

      novosRes.forEach((row) => {
        bestLing = Math.max(bestLing, Number(row.acertos_linguagens)  || 0);
        bestHum  = Math.max(bestHum,  Number(row.acertos_humanas)    || 0);
        bestMat  = Math.max(bestMat,  Number(row.acertos_matematica) || 0);
        bestNat  = Math.max(bestNat,  Number(row.acertos_natureza)   || 0);
      });

      // Take whichever is higher: complete day (legado) vs. soma das áreas
      const dia2 = Math.max(bestDia2Complete, bestMat + bestNat);
      const dia1 = Math.max(bestDia1Complete, bestHum + bestLing);
      const total = dia2 + dia1;

      return total > 0 ? { total, dia1, dia2 } : { total: null, dia1: 0, dia2: 0 };
    } catch (err) {
      console.warn("[Geral] Erro ao buscar simulados:", err);
      return { total: null, dia1: 0, dia2: 0 };
    }
  }

  /* ─── Render: KPI cards ─────────────────────────────── */
  function renderKPI(container, data) {
    const { questoes, acertos, horas, flashStudied, flashTotal, period } = data;
    const taxaAcerto = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;
    const flashPct = flashTotal > 0 ? Math.round((flashStudied / flashTotal) * 100) : 0;
    const taxaCls = taxaAcerto >= 70 ? "is-good" : taxaAcerto >= 50 ? "is-ok" : "is-low";
    const taxaColorVar = { "is-good": "#059669", "is-ok": "#d97706", "is-low": "#dc2626" }[taxaCls];

    const cards = [
      {
        color: "var(--s-mat)",
        bg: "rgba(47, 75, 255, 0.1)",
        delay: 0,
        icon: svgList(),
        label: "Questões Respondidas",
        value: fmtNum(questoes),
        meta: questoes > 0
          ? `<strong>${fmtNum(acertos)}</strong> acertos registrados`
          : "Nenhuma questão respondida ainda",
      },
      {
        color: questoes > 0 ? taxaColorVar : "var(--g-accent)",
        bg: questoes > 0 ? `${taxaColorVar}18` : "rgba(47, 75, 255, 0.1)",
        delay: 80,
        icon: svgTarget(),
        label: "Taxa de Acerto",
        value: questoes > 0 ? `${taxaAcerto}%` : "—",
        meta: questoes > 0
          ? `${fmtNum(acertos)} de ${fmtNum(questoes)} questões`
          : "Responda questões para ver sua taxa",
      },
      {
        color: "var(--s-sci)",
        bg: "rgba(5, 150, 105, 0.1)",
        delay: 160,
        icon: svgClock(),
        label: "Horas de Estudo",
        value: fmtHours(horas),
        meta: horas > 0 ? `Acumuladas no calendário` : "Nenhuma hora registrada ainda",
      },
      {
        color: "var(--s-hum)",
        bg: "rgba(217, 119, 6, 0.1)",
        delay: 240,
        icon: svgCards(),
        label: "Flashcards",
        value: fmtNum(flashTotal),
        meta: flashTotal > 0
          ? period === "1m"
            ? "Criados no último mês"
            : period === "3m"
              ? "Criados nos últimos 3 meses"
              : flashStudied > 0
                ? `<strong>${flashPct}%</strong> do baralho em progresso`
                : "Nenhum card estudado ainda"
          : period !== "all"
            ? "Nenhum flashcard criado neste período"
            : "Nenhum flashcard criado ainda",
      },
    ];

    container.innerHTML = cards
      .map(
        ({ color, bg, delay, icon, label, value, meta }) => `
      <div class="kpi-card" style="--kpi-color:${color};--kpi-bg:${bg};--delay:${delay}ms">
        <div class="kpi-card__top-bar"></div>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;">
          <div class="kpi-card__icon">${icon}</div>
        </div>
        <div>
          <p class="kpi-card__label">${label}</p>
          <p class="kpi-card__value">${value}</p>
          ${meta ? `<p class="kpi-card__meta">${meta}</p>` : ""}
        </div>
      </div>
    `
      )
      .join("");
  }

  /* ─── Render: Level showcase (emblema + escada de tiers) ── */
  function renderLevelShowcase(container, data) {
    const { mediaSimulados, simuladoDia1, simuladoDia2 } = data;
    const rank = getRank(mediaSimulados);
    const idx = RANK_LEVELS.indexOf(rank);
    const nextRank = RANK_LEVELS[idx + 1];
    const isElite = idx === RANK_LEVELS.length - 1;

    const rankPct = mediaSimulados == null
      ? 0
      : nextRank
        ? Math.min(100, ((mediaSimulados - rank.min) / (nextRank.min - rank.min)) * 100)
        : 100;
    const rankBarLabel = mediaSimulados == null
      ? "Cadastre seus simulados para descobrir sua classificação"
      : nextRank
        ? `${fmtNum(nextRank.min - mediaSimulados)} acertos para ${nextRank.name}`
        : "Classificação máxima atingida";

    const breakdownHtml = mediaSimulados != null
      ? `<div class="kpi-simulado-breakdown">
           <span>Dia 1: <strong>${simuladoDia1}/90</strong></span>
           <span class="kpi-simulado-sep" aria-hidden="true">·</span>
           <span>Dia 2: <strong>${simuladoDia2}/90</strong></span>
         </div>`
      : "";

    const totalPillHtml = mediaSimulados != null
      ? `<span class="kpi-simulado-total">${mediaSimulados}/180</span>`
      : "";

    const ladderHtml = RANK_LEVELS
      .map((lvl, i) => {
        const cls = i === idx ? "is-current" : i < idx ? "is-done" : "";
        return `
        <div class="level-ladder__step ${cls}"
             style="--step-color:${lvl.hex};--step-bg:${lvl.hex}22;--step-ring:${lvl.hex}26"
             title="${lvl.name} · ${fmtRankRange(lvl)}">
          ${svgRankLadderIcon(i)}
        </div>`;
      })
      .join("");

    container.style.setProperty("--rank-color", rank.hex);
    container.style.setProperty("--rank-tint", `${rank.hex}14`);
    container.style.setProperty("--rank-glow", `${rank.hex}59`);
    container.style.setProperty("--rank-bg", `${rank.hex}18`);
    container.style.setProperty("--kpi-color", rank.hex);

    container.innerHTML = `
      <div class="rank-emblem${isElite ? " rank-emblem--elite" : ""}">${svgRankEmblem(idx)}</div>
      <div class="level-showcase__info">
        <p class="level-showcase__eyebrow">Sua Classificação</p>
        <h3 class="level-showcase__name">${rank.name}</h3>
        <p class="level-showcase__range">${fmtRankRange(rank)}</p>
        ${breakdownHtml}
        <div class="kpi-bar level-showcase__bar">
          <div class="level-showcase__bar-row">
            <div class="kpi-bar__track"><div class="kpi-bar__fill" data-target="${rankPct.toFixed(1)}"></div></div>
            ${totalPillHtml}
          </div>
          <span class="kpi-bar__label">${rankBarLabel}</span>
        </div>
      </div>
      <div class="level-ladder" role="list" aria-label="Progressão de níveis">${ladderHtml}</div>
    `;

    requestAnimationFrame(() => {
      container.querySelectorAll(".kpi-bar__fill[data-target]").forEach((el) => {
        const target = parseFloat(el.dataset.target) || 0;
        setTimeout(() => { el.style.width = `${target}%`; }, 100);
      });
    });
  }

  /* ─── Render: Weekly bar chart ──────────────────────── */
  function renderWeeklyChart(container, legendEl, hoursByWeek) {
    const today = new Date();
    const currentWeekStart = getWeekStart(today);

    // Build last 10 weeks
    const weeks = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      const iso = getWeekStart(d);
      weeks.push({ iso, hours: hoursByWeek[iso] || 0, isCurrent: iso === currentWeekStart });
    }

    const maxH = Math.max(...weeks.map((w) => w.hours), 0.1);
    const totalDisplayed = weeks.reduce((s, w) => s + w.hours, 0);

    if (legendEl) legendEl.textContent = `Total: ${fmtHours(totalDisplayed)}`;

    const barsHtml = weeks
      .map((w) => {
        const pct = maxH > 0 ? (w.hours / maxH) * 100 : 0;
        const tipLabel = w.hours > 0 ? fmtHours(w.hours) : "0h";
        return `
        <div class="bar-chart__col${w.isCurrent ? " is-current" : ""}">
          <div class="bar-chart__bar-wrap">
            <div class="bar-chart__bar${w.hours === 0 ? " is-empty" : ""}${w.isCurrent ? " is-current" : ""}"
                 data-pct="${pct.toFixed(2)}"
                 style="height:0%">
              <div class="bar-chart__bar-tip">${tipLabel}</div>
            </div>
          </div>
          <span class="bar-chart__label">${formatWeekLabel(w.iso)}</span>
        </div>
      `;
      })
      .join("");

    const yMax = maxH > 0 ? Math.ceil(maxH) : 10;
    const yMid = Math.round(yMax / 2);

    container.innerHTML = `
      <div class="bar-chart">${barsHtml}</div>
      <div class="bar-chart__y">
        <span>${yMax}h</span>
        <span>${yMid}h</span>
        <span>0h</span>
      </div>
    `;

    // Animate bars
    requestAnimationFrame(() => {
      container.querySelectorAll(".bar-chart__bar[data-pct]").forEach((bar) => {
        const pct = parseFloat(bar.dataset.pct) || 0;
        setTimeout(() => { bar.style.height = `${pct}%`; }, 80);
      });
    });
  }

  /* ─── Render: Subject bars ──────────────────────────── */
  function renderSubjectBars(container, bySubject) {
    const entries = Object.values(bySubject).sort((a, b) => b.total - a.total).slice(0, 7);

    if (!entries.length) {
      container.innerHTML = `<p style="color:var(--g-muted);font-size:0.88rem;text-align:center;padding:32px 0;">Nenhuma questão respondida ainda.</p>`;
      return;
    }

    const maxTotal = Math.max(...entries.map((e) => e.total), 1);

    container.innerHTML = entries
      .map((e) => {
        const pct = ((e.total / maxTotal) * 100).toFixed(2);
        const rate = e.acertos > 0 ? `${Math.round((e.acertos / e.total) * 100)}%` : "—";
        return `
        <div class="subject-bar" style="--subject-color:${e.subj.color}">
          <div class="subject-bar__top">
            <span class="subject-bar__name">
              <span class="subject-bar__dot"></span>
              ${e.subj.label}
            </span>
            <span class="subject-bar__count">${fmtNum(e.total)} · <span class="subject-bar__accuracy">${rate}</span></span>
          </div>
          <div class="subject-bar__track">
            <div class="subject-bar__fill" data-pct="${pct}"></div>
          </div>
        </div>
      `;
      })
      .join("");

    requestAnimationFrame(() => {
      container.querySelectorAll(".subject-bar__fill[data-pct]").forEach((el) => {
        const pct = parseFloat(el.dataset.pct) || 0;
        setTimeout(() => { el.style.width = `${pct}%`; }, 120);
      });
    });
  }

  /* ─── Render: Subject table ─────────────────────────── */
  function renderSubjectTable(container, bySubject, hoursBySubject) {
    // Merge subjects from both sources
    const subjectMap = {};

    Object.entries(bySubject).forEach(([k, v]) => {
      if (!subjectMap[k]) subjectMap[k] = { subj: v.subj, questions: 0, acertos: 0, hours: 0 };
      subjectMap[k].questions += v.total;
      subjectMap[k].acertos += v.acertos;
    });

    Object.entries(hoursBySubject).forEach(([k, v]) => {
      if (!subjectMap[k]) subjectMap[k] = { subj: v.subj, questions: 0, acertos: 0, hours: 0 };
      subjectMap[k].hours += v.hours;
    });

    const rows = Object.values(subjectMap)
      .filter((r) => r.questions > 0 || r.hours > 0)
      .sort((a, b) => b.questions - a.questions || b.hours - a.hours);

    if (!rows.length) {
      container.innerHTML = `<p style="color:var(--g-muted);font-size:0.88rem;text-align:center;padding:32px 26px;">Nenhum dado disponível ainda.</p>`;
      return;
    }

    const maxQ = Math.max(...rows.map((r) => r.questions), 1);

    const medalCls = ["is-gold", "is-silver", "is-bronze"];

    const rowsHtml = rows
      .map((r, i) => {
        const rate = r.acertos > 0 ? Math.round((r.acertos / r.questions) * 100) : null;
        const rateCls = rate === null ? "" : rate >= 70 ? "is-good" : rate >= 50 ? "is-ok" : "is-low";
        const rateDisplay = rate !== null ? `${rate}%` : "—";
        const barPct = ((r.questions / maxQ) * 100).toFixed(2);
        const barColor = r.subj.color;
        const rankBadge = i < 3
          ? `<span class="td-subject__rank ${medalCls[i]}">${i + 1}</span>`
          : `<span class="td-subject__rank">${i + 1}</span>`;

        return `
        <tr>
          <td>
            <div class="td-subject">
              ${rankBadge}
              <span class="td-subject__dot" style="background:${barColor}"></span>
              ${r.subj.label}
            </div>
          </td>
          <td class="td-number">${fmtNum(r.questions)}</td>
          <td class="td-number">${fmtNum(r.acertos)}</td>
          <td class="td-rate ${rateCls}">${rateDisplay}</td>
          <td class="td-number">${r.hours > 0 ? fmtHours(r.hours) : "—"}</td>
          <td>
            <div class="td-bar">
              <div class="td-bar__track">
                <div class="td-bar__fill" data-pct="${barPct}" style="background:${barColor};opacity:0.7"></div>
              </div>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    container.innerHTML = `
      <table class="subject-table">
        <thead>
          <tr>
            <th>Disciplina</th>
            <th>Questões</th>
            <th>Acertos</th>
            <th>Taxa</th>
            <th>Horas</th>
            <th style="min-width:100px">Progresso</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    requestAnimationFrame(() => {
      container.querySelectorAll(".td-bar__fill[data-pct]").forEach((el) => {
        const pct = parseFloat(el.dataset.pct) || 0;
        setTimeout(() => { el.style.width = `${pct}%`; }, 200);
      });
    });
  }

  /* ─── Animated counter ──────────────────────────────── */
  function animateCounter(el, target, formatter, duration = 900) {
    const start = performance.now();
    const update = (ts) => {
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatter(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = formatter(target);
    };
    requestAnimationFrame(update);
  }

  /* ─── SVG icons ─────────────────────────────────────── */
  function svgTarget() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle></svg>`;
  }
  function svgList() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`;
  }
  function svgClock() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  }
  function svgCards() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>`;
  }

  /* ─── Main dashboard loader ─────────────────────────── */
  let currentPeriod = "all";

  async function loadDashboard() {
    const loadingEl = document.getElementById("geralLoading");
    const contentEl = document.getElementById("geralContent");

    if (loadingEl) loadingEl.hidden = false;
    if (contentEl) contentEl.hidden = true;

    const userId = await getUserId();
    const periodStart = getPeriodStart(currentPeriod);

    try {
      const [questData, cronData, flashData, simData] = await Promise.all([
        fetchQuestionsData(userId, periodStart),
        fetchCronogramaData(userId, periodStart),
        fetchFlashcardsData(userId, periodStart),
        fetchSimuladoData(userId, periodStart),
      ]);

      const mediaSimulados = simData.total; // null → nenhum simulado registrado

      // Mescla questões do Calendário (cronograma_entries) com as do banco de questões
      // (lista_respostas) para exibir o total unificado no Geral.
      const totalQuestoes = questData.total + cronData.totalQuestions;
      const totalAcertos  = questData.acertos + cronData.totalHits;

      // Mescla o breakdown por disciplina das duas fontes. Acertos (para taxa de
      // acerto) vêm apenas de lista_respostas, onde o campo `correta` é registrado
      // com precisão — exceto "simulado", que só existe no cronograma. O total de
      // questões soma as duas fontes.
      const mergedBySubject = {};
      Object.entries(questData.bySubject).forEach(([k, v]) => {
        mergedBySubject[k] = { subj: v.subj, total: v.total, acertos: v.acertos };
      });
      Object.entries(cronData.questionsBySubject).forEach(([k, v]) => {
        if (!mergedBySubject[k]) mergedBySubject[k] = { subj: v.subj, total: 0, acertos: 0 };
        mergedBySubject[k].total += v.total;
        // Para simulado, usa hits do cronograma (não existe em lista_respostas)
        if (k === "simulado") mergedBySubject[k].acertos += v.acertos;
      });

      if (loadingEl) loadingEl.hidden = true;
      if (contentEl) contentEl.hidden = false;

      // Render KPI
      const kpiRow = document.getElementById("kpiRow");
      if (kpiRow) {
        renderKPI(kpiRow, {
          mediaSimulados,
          simuladoDia1: simData.dia1,
          simuladoDia2: simData.dia2,
          questoes: totalQuestoes,
          acertos:  totalAcertos,
          horas: cronData.totalHours,
          flashStudied: flashData.studied,
          flashTotal: flashData.total,
          period: currentPeriod,
        });

        // Animate KPI numbers after render
        setTimeout(() => {
          kpiRow.querySelectorAll(".kpi-card__value").forEach((el) => {
            const text = el.textContent;
            const raw = text.replace(/[^0-9,h%.]/g, "");
            if (raw.endsWith("h")) {
              const num = parseFloat(raw);
              if (!isNaN(num)) animateCounter(el, num, (v) => fmtHours(v));
            } else if (raw.endsWith("%")) {
              const num = parseInt(raw, 10);
              if (!isNaN(num)) animateCounter(el, num, (v) => `${v}%`);
            } else {
              const num = parseInt(raw.replace(/\./g, "").replace(",", ""), 10);
              if (!isNaN(num) && num > 10) animateCounter(el, num, fmtNum);
            }
          });
        }, 60);
      }

      // Level showcase (emblema + escada de classificação)
      const levelShowcase = document.getElementById("levelShowcase");
      if (levelShowcase) {
        renderLevelShowcase(levelShowcase, {
          mediaSimulados,
          simuladoDia1: simData.dia1,
          simuladoDia2: simData.dia2,
        });
      }

      // Weekly chart
      const weeklyBody   = document.getElementById("weeklyChartBody");
      const weeklyLegend = document.getElementById("weeklyChartLegend");
      if (weeklyBody) renderWeeklyChart(weeklyBody, weeklyLegend, cronData.hoursByWeek);

      // Subject bars
      const subjectBars = document.getElementById("subjectBarsBody");
      if (subjectBars) renderSubjectBars(subjectBars, mergedBySubject);

      // Subject table
      const subjectTable = document.getElementById("subjectTableWrap");
      if (subjectTable) renderSubjectTable(subjectTable, mergedBySubject, cronData.hoursBySubject);

    } catch (err) {
      console.error("[Geral] Erro ao carregar dashboard:", err);
      if (loadingEl) loadingEl.hidden = true;
      if (contentEl) contentEl.hidden = false;
    }
  }

  /* ─── Period tabs ───────────────────────────────────── */
  function setupPeriodTabs() {
    document.querySelectorAll(".period-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".period-tab").forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        currentPeriod = btn.dataset.period;
        loadDashboard();
      });
    });
  }

  /* ─── Init ──────────────────────────────────────────── */
  async function init() {
    const guard = await (window.adminGuardPromise || Promise.resolve(null));
    if (!guard) return;

    setupPeriodTabs();
    await loadDashboard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
