const THEME_SCRIPT_PATH = "/theme.js";
const SUPABASE_CDN_SRC = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const SUPABASE_URL = window.__MM_CONFIG__?.supabaseUrl || "";
const SUPABASE_ANON_KEY = window.__MM_CONFIG__?.supabaseAnonKey || "";

function ensureThemeManager() {
  if (window.ThemeManager) return Promise.resolve(window.ThemeManager);
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${THEME_SCRIPT_PATH}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.ThemeManager));
      return;
    }
    const script = document.createElement("script");
    script.src = THEME_SCRIPT_PATH;
    script.async = true;
    script.onload = () => resolve(window.ThemeManager);
    document.head.appendChild(script);
  });
}

function initSupabaseClientFromWindow() {
  if (window.supabaseClient) return window.supabaseClient;
  const createClient = window.supabase?.createClient;
  if (!createClient) return null;
  try {
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window.supabaseClient;
  } catch (err) {
    console.warn("[Navbar] Falha ao iniciar Supabase:", err);
    return null;
  }
}

function ensureSupabaseClient() {
  const existingClient = initSupabaseClientFromWindow();
  if (existingClient) return Promise.resolve(existingClient);

  return new Promise((resolve) => {
    const existingScript = document.querySelector(`script[src="${SUPABASE_CDN_SRC}"]`);
    if (existingScript) {
      if (window.supabase?.createClient) {
        resolve(initSupabaseClientFromWindow());
        return;
      }
      existingScript.addEventListener("load", () => resolve(initSupabaseClientFromWindow()), { once: true });
      existingScript.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SUPABASE_CDN_SRC;
    script.async = true;
    script.onload = () => resolve(initSupabaseClientFromWindow());
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function attachNavbarEvents(navEl) {
  const menu = navEl.querySelector("#questionsMenu");
  const desktopBtn = navEl.querySelector("#questionsMenuButton");
  const avatarBtn = navEl.querySelector("#user-avatar-btn");
  const userAvatarImg = navEl.querySelector(".user-avatar img");
  const userMenu = navEl.querySelector("#user-menu");
  const userNameEl = navEl.querySelector("#user-menu-name");
  const clearCacheBtn = navEl.querySelector("#clear-cache-btn");
  const cacheClearModal = navEl.querySelector("#cache-clear-modal");
  const cacheClearStatus = navEl.querySelector("#cache-clear-status");
  const cacheClearCancelBtn = navEl.querySelector("#cache-clear-cancel-btn");
  const cacheClearConfirmBtn = navEl.querySelector("#cache-clear-confirm-btn");
  const cacheClearCloseBtn = navEl.querySelector("#cache-clear-close-btn");
  const navbar = navEl;
  const hamburger = navEl.querySelector("#hamburger");
  const navLinksMobile = navEl.querySelector("#navLinksMobile");
  const navButtons = navEl.querySelectorAll(".questions-menu-btn");
  const desktopLinks = navEl.querySelectorAll(".nav-links a");
  const mobileLinks = navEl.querySelectorAll(".nav-links-mobile a");
  const DEFAULT_AVATAR = "/imagens/default-avatar.png";
  const BUCKET = "admin-avatars";
  const cache = window.profileCache || { load: () => null, save: () => {} };
  let cacheClearInFlight = false;
  let cacheClearForceArmed = false;
  let cacheClearWaitChoiceEnabled = false;
  let cacheClearWaitingForSync = false;
  let cacheClearWaitRunId = 0;
  let lastFocusedBeforeModal = null;

  // Keep the confirmation modal outside the transformed navbar so `position: fixed`
  // centers relative to the viewport, not the navbar box.
  if (cacheClearModal && cacheClearModal.parentElement !== document.body) {
    document.body.appendChild(cacheClearModal);
  }

  /**
   * Normaliza um caminho/URL de avatar para o caminho relativo dentro do
   * bucket `admin-avatars`, removendo prefixos de URL do Storage do Supabase.
   * @param {string|null} path
   * @returns {string|null}
   */
  function normalizeAvatarPath(path) {
    if (!path) return null;
    let cleaned = String(path).trim().replace(/\\/g, "/");
    cleaned = cleaned.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(public|sign)\/admin-avatars\//, "");
    cleaned = cleaned.replace(/^admin-avatars\//, "");
    cleaned = cleaned.replace(/^\/+/, "");
    return cleaned || null;
  }

  function getTransformFromCache() {
    const cached = cache.load();
    return cached?.transform || { scale: 1, offsetX: 0, offsetY: 0 };
  }

  function applyAvatarTransform(img, transform) {
    if (!img) return;
    const scale = Math.min(Math.max(transform?.scale ?? 1, 1), 1.8);
    const maxOffset = Math.max(0, (scale - 1) * 50);
    const offsetX = Math.min(Math.max(transform?.offsetX ?? 0, -maxOffset), maxOffset);
    const offsetY = Math.min(Math.max(transform?.offsetY ?? 0, -maxOffset), maxOffset);
    img.style.objectFit = "cover";
    img.style.transformOrigin = "center";
    img.style.transform = `translate3d(${offsetX}%, ${offsetY}%, 0) scale(${scale})`;
  }

  function resolveCachedAvatarSrc(cached) {
    if (!cached) return DEFAULT_AVATAR;
    const url = cached.avatarUrl;
    if (typeof url === "string" && url.trim()) return url;
    return DEFAULT_AVATAR;
  }

  function ensureAvatarFallback(img) {
    if (!img || img.dataset.fallbackReady) return;
    img.addEventListener("error", () => {
      img.src = DEFAULT_AVATAR;
    });
    img.dataset.fallbackReady = "true";
  }

  /**
   * Resolve a URL do avatar seguindo a ordem de precedência: URL absoluta
   * salva no perfil, URL assinada, URL pública e, por fim, o caminho bruto.
   * Retorna o avatar padrão se nenhuma fonte estiver disponível.
   * @returns {string}
   */
  function resolveAvatarUrlFromProfile(avatarUrl, avatarPath, signedUrl, publicUrl) {
    if (avatarUrl && (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://"))) {
      return avatarUrl;
    }
    if (signedUrl) return signedUrl;
    if (publicUrl) return publicUrl;
    if (avatarPath) return `${avatarPath}`;
    return DEFAULT_AVATAR;
  }

  function clearPendingHint() {
    const hint = document.getElementById("pending-hint");
    if (hint) hint.style.display = "none";
  }

  function setCacheClearStatus(message, state) {
    if (!cacheClearStatus) return;
    cacheClearStatus.textContent = message || "";
    if (state) cacheClearStatus.dataset.state = state;
    else delete cacheClearStatus.dataset.state;
  }

  function setCacheClearButtonsDisabled(disabled) {
    if (cacheClearCancelBtn) cacheClearCancelBtn.disabled = disabled;
    if (cacheClearConfirmBtn) cacheClearConfirmBtn.disabled = disabled;
    if (cacheClearCloseBtn) cacheClearCloseBtn.disabled = disabled;
  }

  function setCacheClearForceMode(enabled) {
    cacheClearForceArmed = Boolean(enabled);
    if (!cacheClearConfirmBtn) return;
    cacheClearConfirmBtn.textContent = cacheClearForceArmed ? "Limpar mesmo assim" : "Confirmar limpeza";
  }

  function setCacheClearWaitChoiceMode(enabled) {
    cacheClearWaitChoiceEnabled = Boolean(enabled);
    if (!cacheClearCancelBtn) return;
    cacheClearCancelBtn.textContent = cacheClearWaitChoiceEnabled ? "Esperar sincronizacao" : "Cancelar";
  }

  function setCacheClearWaitingMode(enabled) {
    cacheClearWaitingForSync = Boolean(enabled);
    if (!cacheClearCloseBtn) return;
    cacheClearCloseBtn.textContent = "×";
    cacheClearCloseBtn.setAttribute("aria-label", cacheClearWaitingForSync ? "Parar espera" : "Fechar");
    cacheClearCloseBtn.title = cacheClearWaitingForSync ? "Parar espera" : "Fechar";
  }

  function setCacheClearButtonsInteractive({ cancel = true, confirm = true, close = true } = {}) {
    if (cacheClearCancelBtn) cacheClearCancelBtn.disabled = !cancel;
    if (cacheClearConfirmBtn) cacheClearConfirmBtn.disabled = !confirm;
    if (cacheClearCloseBtn) cacheClearCloseBtn.disabled = !close;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function withTimeout(promise, timeoutMs, onTimeoutValue) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(onTimeoutValue);
      }, Math.max(0, Number(timeoutMs) || 0));

      Promise.resolve(promise)
        .then((value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  function openCacheClearModal() {
    if (!cacheClearModal) return;
    closeUserMenu();
    lastFocusedBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCacheClearStatus("", null);
    setCacheClearForceMode(false);
    setCacheClearWaitChoiceMode(false);
    setCacheClearWaitingMode(false);
    cacheClearWaitRunId += 1;
    cacheClearModal.hidden = false;
    cacheClearModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      if (cacheClearCancelBtn) cacheClearCancelBtn.focus();
      else if (cacheClearConfirmBtn) cacheClearConfirmBtn.focus();
    }, 0);
  }

  function closeCacheClearModal() {
    if (!cacheClearModal) return;
    if (cacheClearInFlight && !cacheClearWaitingForSync) return;
    cacheClearWaitRunId += 1;
    cacheClearInFlight = false;
    setCacheClearWaitingMode(false);
    setCacheClearWaitChoiceMode(false);
    setCacheClearForceMode(false);
    cacheClearModal.hidden = true;
    cacheClearModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedBeforeModal?.focus) {
      try {
        lastFocusedBeforeModal.focus();
      } catch (_) {
        /* noop */
      }
    }
  }

  function isAuthSensitiveKey(key) {
    const normalized = String(key || "").toLowerCase();
    return normalized.startsWith("sb-") || (normalized.includes("auth") && normalized.includes("token"));
  }

  function snapshotAuthStorageState() {
    const localEntries = [];
    const sessionEntries = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !isAuthSensitiveKey(key)) continue;
        localEntries.push([key, localStorage.getItem(key)]);
      }
    } catch (_) {
      /* noop */
    }
    try {
      for (let i = 0; i < sessionStorage.length; i += 1) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        if (key !== "mm_auth_ok" && !isAuthSensitiveKey(key)) continue;
        sessionEntries.push([key, sessionStorage.getItem(key)]);
      }
    } catch (_) {
      /* noop */
    }
    return { localEntries, sessionEntries };
  }

  function restoreAuthStorageState(snapshot) {
    if (!snapshot) return;
    const localEntries = Array.isArray(snapshot.localEntries) ? snapshot.localEntries : [];
    const sessionEntries = Array.isArray(snapshot.sessionEntries) ? snapshot.sessionEntries : [];
    localEntries.forEach(([key, value]) => {
      if (!key || value == null) return;
      try {
        localStorage.setItem(key, value);
      } catch (_) {
        /* noop */
      }
    });
    sessionEntries.forEach(([key, value]) => {
      if (!key || value == null) return;
      try {
        sessionStorage.setItem(key, value);
      } catch (_) {
        /* noop */
      }
    });
  }

  function isSafeAppCacheKey(key) {
    const k = String(key || "");
    if (!k) return false;
    if (isAuthSensitiveKey(k)) return false;
    if (k === "mm_theme") return false;
    if (k === "mm_profile_cache") return true;
    if (k === "mm_flashcards_cache_v2") return true;
    if (k === "mm_flashcards_study_v1") return true;
    if (k === "study-goals") return true;
    if (k === "lista-diagramacao") return true;
    if (k.startsWith("study-schedule-")) return true;
    if (k.startsWith("lista-respostas-")) return true;
    if (k.startsWith("mm_")) return true;
    return false;
  }

  function listLocalCacheKeysToClear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && isSafeAppCacheKey(key)) keys.push(key);
    }
    return keys.sort();
  }

  async function tryFlushPendingSync() {
    const flushFn = window.__MM_FLUSH__;
    if (typeof flushFn !== "function") {
      return { ok: true, reason: "flush_unavailable" };
    }
    try {
      const timeoutMs = 10000;
      const result = await withTimeout(
        flushFn({ timeoutMs }),
        timeoutMs + 350,
        { ok: false, reason: "timeout" },
      );
      return result || { ok: false, reason: "flush_unknown" };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : String(error || "flush_error"),
      };
    }
  }

  async function getSyncAuditSnapshot() {
    const auditFn = window.__MM_AUDIT__;
    if (typeof auditFn !== "function") return null;
    try {
      return (
        (await withTimeout(
          auditFn(),
          1200,
          null,
        )) || null
      );
    } catch (_) {
      return null;
    }
  }

  async function guardAgainstPendingUnsyncedData() {
    const flush = await tryFlushPendingSync();
    const audit = await getSyncAuditSnapshot();
    const pending = Number(audit?.pendingOutboxCount || 0);
    const dead = Number(audit?.deadOutboxCount || 0);
    const auditUnavailable = !audit;
    const shouldAssumePendingOnTimeout = auditUnavailable && flush?.ok === false && String(flush?.reason || "") === "timeout";
    const effectivePending = shouldAssumePendingOnTimeout ? Math.max(pending, 1) : pending;

    if (effectivePending > 0 || dead > 0) {
      return {
        ok: false,
        pending: effectivePending,
        dead,
        flush,
        auditUnavailable,
        message:
          effectivePending > 0
            ? `Existem ${effectivePending} item(ns) pendentes de sincronizacao. Tente novamente apos sincronizar para evitar perda local.`
            : `Existem ${dead} item(ns) com falha definitiva no cache local. A limpeza foi bloqueada para evitar perda de dados ainda nao enviados.`,
      };
    }
    return { ok: true, flush, audit };
  }

  async function clearIndexedDbLocalCache() {
    if (typeof indexedDB === "undefined") return { ok: true, clearedStores: 0, via: "unsupported" };

    try {
      const [{ openAppDB, withStore }, { STORES }] = await Promise.all([
        import("/dist/db/openDB.js"),
        import("/dist/db/schema.js"),
      ]);
      const db = await openAppDB();
      let clearedStores = 0;
      try {
        for (const storeName of [STORES.localStorageMirror, STORES.outbox, STORES.meta]) {
          if (!db.objectStoreNames.contains(storeName)) continue;
          await withStore(db, storeName, "readwrite", async (store) => {
            store.clear();
          });
          clearedStores += 1;
        }
      } finally {
        try {
          db.close();
        } catch (_) {
          /* noop */
        }
      }
      return { ok: true, clearedStores, via: "store_clear" };
    } catch (error) {
      try {
        const result = await new Promise((resolve) => {
          let blocked = false;
          const req = indexedDB.deleteDatabase("matrizMentoriaDB");
          req.onblocked = () => {
            blocked = true;
          };
          req.onsuccess = () => resolve({ ok: !blocked, blocked, via: "deleteDatabase" });
          req.onerror = () => resolve({ ok: false, blocked, via: "deleteDatabase", error: req.error });
        });
        if (result?.ok) return { ok: true, clearedStores: 3, via: "deleteDatabase" };
      } catch (_) {
        /* noop */
      }

      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error || "indexeddb_clear_failed"),
      };
    }
  }

  async function clearLocalCachesSafely() {
    return clearLocalCachesSafelyWithOptions();
  }

  async function clearLocalCachesSafelyWithOptions(options = {}) {
    const force = Boolean(options.force);
    const guard = await guardAgainstPendingUnsyncedData();
    if (!guard.ok && !force) return { ok: false, stage: "guard", ...guard };

    const authSnapshot = snapshotAuthStorageState();
    let localKeys = [];
    try {
      localKeys = listLocalCacheKeysToClear();
      localKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (_) {
          /* noop */
        }
      });
      try {
        if (window.profileCache?.clear) window.profileCache.clear();
      } catch (_) {
        /* noop */
      }

      const idb = await withTimeout(
        clearIndexedDbLocalCache(),
        7000,
        { ok: false, error: "indexeddb_clear_timeout", timedOut: true },
      );
      if (!idb.ok) {
        if (force) {
          return {
            ok: true,
            localKeysCleared: localKeys.length,
            indexedDb: idb,
            flush: guard.flush,
            forced: true,
            partial: true,
          };
        }
        return {
          ok: false,
          stage: "indexeddb",
          localKeysCleared: localKeys.length,
          idb,
        };
      }

      return {
        ok: true,
        localKeysCleared: localKeys.length,
        indexedDb: idb,
        flush: guard.flush,
        forced: !guard.ok && force,
      };
    } finally {
      restoreAuthStorageState(authSnapshot);
    }
  }

  async function attemptCacheClear(force) {
    setCacheClearButtonsDisabled(true);
    setCacheClearStatus(force ? "Limpando cache local em modo forcado..." : "Verificando sincronizacao pendente...", "working");
    const result = await clearLocalCachesSafelyWithOptions({ force });
    if (!result.ok) {
      if (result.stage === "guard") {
        const pending = Number(result.pending || 0);
        const dead = Number(result.dead || 0);
        const flushTimedOut = result.flush?.ok === false && String(result.flush?.reason || "") === "timeout";
        const extra =
          result.flush?.ok === false
            ? ` (tentativa de sincronizacao falhou: ${result.flush.reason || "erro"})`
            : "";
        setCacheClearForceMode(true);
        setCacheClearWaitChoiceMode(flushTimedOut && pending > 0 && dead === 0);
        setCacheClearStatus(
          flushTimedOut && pending > 0 && dead === 0
            ? `A sincronizacao nao concluiu em 10s. Pendentes: ${pending}.${extra} Voce pode limpar mesmo assim (risco de perda local) ou esperar a sincronizacao.`
            : `Ha risco de perda de dados locais nao sincronizados. Pendentes: ${pending}. Falhas definitivas: ${dead}.${extra} Clique em "Limpar mesmo assim" para forcar.`,
          "error",
        );
      } else {
        setCacheClearWaitChoiceMode(false);
        setCacheClearStatus(
          "Parte do cache local foi limpa, mas houve falha ao limpar o IndexedDB. Recarregue a pagina e tente novamente.",
          "error",
        );
      }
      return result;
    }

    clearPendingHint();
    setCacheClearForceMode(false);
    setCacheClearWaitChoiceMode(false);
    setCacheClearWaitingMode(false);
    setCacheClearStatus(
      result.partial
        ? `Cache local limpo parcialmente (${result.localKeysCleared} chave(s) localStorage) em modo forcado. O IndexedDB pode nao ter sido limpo neste dispositivo. A pagina sera recarregada.`
        : `Cache local limpo com sucesso (${result.localKeysCleared} chave(s) localStorage)${result.forced ? " em modo forcado" : ""}. A pagina sera recarregada.`,
      "success",
    );
    setTimeout(() => {
      try {
        window.location.reload();
      } catch (_) {
        /* noop */
      }
    }, 900);
    return result;
  }

  async function waitForSyncThenClearCache() {
    if (cacheClearInFlight) return;
    cacheClearInFlight = true;
    const runId = ++cacheClearWaitRunId;
    setCacheClearWaitingMode(true);
    setCacheClearWaitChoiceMode(false);
    setCacheClearButtonsInteractive({ cancel: false, confirm: true, close: true });
    setCacheClearStatus("Aguardando sincronizacao... Vamos tentar novamente ate concluir.", "working");
    try {
      while (cacheClearWaitRunId === runId) {
        const guard = await guardAgainstPendingUnsyncedData();
        if (cacheClearWaitRunId !== runId) return;

        if (guard.ok) {
          setCacheClearStatus("Sincronizacao concluida. Limpando cache local...", "working");
          await attemptCacheClear(false);
          return;
        }

        const pending = Number(guard.pending || 0);
        const dead = Number(guard.dead || 0);
        if (dead > 0) {
          setCacheClearWaitingMode(false);
          setCacheClearForceMode(true);
          setCacheClearWaitChoiceMode(false);
          setCacheClearStatus(
            `A espera foi interrompida: existem ${dead} falha(s) definitiva(s) na fila. Use "Limpar mesmo assim" para forcar ou feche o modal.`,
            "error",
          );
          return;
        }

        setCacheClearStatus(
          `Aguardando sincronizacao... Ainda ha ${pending} item(ns) pendente(s). Voce pode clicar em "Limpar mesmo assim" a qualquer momento.`,
          "working",
        );
        await delay(2500);
      }
    } finally {
      if (cacheClearWaitRunId === runId) {
        cacheClearInFlight = false;
        setCacheClearWaitingMode(false);
        setCacheClearButtonsInteractive({ cancel: true, confirm: true, close: true });
      }
    }
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      if (target) window.location.href = target;
    });
  });

  const pathSlug = (window.location.pathname.replace(/\/+$/, "").split("/").pop() || "index")
    .replace(/\.html?$/i, "") || "index";
  const isQuestionsPage = ["banco", "buscar", "gerar-lista", "listas", "diagramacao", "leitor-pdf"].includes(pathSlug);

  function syncQuestionsButtonState(isOpen) {
    if (!desktopBtn) return;
    if (isQuestionsPage) {
      desktopBtn.classList.add("active");
    } else {
      desktopBtn.classList.toggle("active", !!isOpen);
    }
  }

  function toggleQuestionsMenu(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!menu) return;
    const isOpen = menu.classList.contains("open");
    menu.classList.toggle("open", !isOpen);
    syncQuestionsButtonState(!isOpen);
  }

  function closeUserMenu() {
    if (userMenu) userMenu.classList.remove("open");
    if (avatarBtn) avatarBtn.setAttribute("aria-expanded", "false");
  }

  function toggleUserMenu(event) {
    if (event) event.stopPropagation();
    if (!userMenu) return;
    const willOpen = !userMenu.classList.contains("open");
    userMenu.classList.toggle("open", willOpen);
    if (avatarBtn) avatarBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  }

  if (desktopBtn) desktopBtn.addEventListener("click", toggleQuestionsMenu);
  if (avatarBtn) avatarBtn.addEventListener("click", toggleUserMenu);
  if (userMenu) userMenu.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("click", () => {
    if (menu) menu.classList.remove("open");
    if (!isQuestionsPage && desktopBtn) desktopBtn.classList.remove("active");
    closeUserMenu();
    if (navLinksMobile) navLinksMobile.classList.remove("open");
    if (hamburger) hamburger.classList.remove("active");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cacheClearModal && !cacheClearModal.hidden) {
      e.stopPropagation();
      closeCacheClearModal();
    }
  });

  if (hamburger && navLinksMobile) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !navLinksMobile.classList.contains("open");
      navLinksMobile.classList.toggle("open", willOpen);
      hamburger.classList.toggle("active", willOpen);
    });
  }

  if (navbar) {
    navbar.addEventListener("click", (e) => e.stopPropagation());
    const handleScroll = () => {
      if (window.scrollY > 10) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
  }

  // Marca a rota ativa
  [...desktopLinks, ...mobileLinks].forEach((link) => {
    const href = link.getAttribute("href") || "";
    const hrefSlug = (href.replace(/\/+$/, "").split("/").pop() || href).replace(/\.html?$/i, "") || href;
    if (hrefSlug && hrefSlug === pathSlug) {
      link.classList.add("active");
      if (link.closest(".questions-menu")) {
        if (desktopBtn) desktopBtn.classList.add("active");
      }
    }
  });

  // Destaca o botão de Questões apenas nas páginas relacionadas
  if (isQuestionsPage) {
    if (desktopBtn) desktopBtn.classList.add("active");
  }

  // Supabase: preenche nome e logout, se cliente estiver disponível
  let avatarHydrating = false;

  function waitForSupabaseClient(maxAttempts = 20, intervalMs = 250) {
    if (window.supabaseClient) return Promise.resolve(window.supabaseClient);
    return new Promise((resolve) => {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (window.supabaseClient) {
          clearInterval(timer);
          resolve(window.supabaseClient);
        } else if (attempts >= maxAttempts) {
          clearInterval(timer);
          resolve(null);
        }
      }, intervalMs);
    });
  }

  async function hydrateUser(client = window.supabaseClient) {
    const supabaseClient = client;
    if (!supabaseClient || avatarHydrating) return false;
    avatarHydrating = true;

    const cached = cache.load();
    if (cached) {
      if (userNameEl && cached.name) userNameEl.textContent = cached.name;
      if (userAvatarImg) {
        ensureAvatarFallback(userAvatarImg);
        userAvatarImg.src = resolveCachedAvatarSrc(cached);
        applyAvatarTransform(userAvatarImg, cached.transform);
      }
    }

    if (cached?.pending) return;

    try {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();
      if (error || !user) {
        avatarHydrating = false;
        return true;
      }
      if (userNameEl) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("nome, avatar_url, avatar_transform, role")
          .eq("id", user.id)
          .single();
        if (profile && profile.nome) {
          userNameEl.textContent = profile.nome;
        } else {
          userNameEl.textContent = user.email || "Usuário";
        }

        const roleBadge = document.getElementById("role-badge");
        if (roleBadge) {
          const role = profile?.role;
          if (role === "admin") {
            roleBadge.className = "role-badge role-admin";
            roleBadge.textContent = "ADMIN";
            roleBadge.style.display = "";
          } else if (role === "aluno") {
            roleBadge.className = "role-badge role-aluno";
            roleBadge.textContent = "ALUNO";
            roleBadge.style.display = "";
          } else {
            roleBadge.style.display = "none";
          }
        }

        // Avatar
        const avatarRawUrl = profile?.avatar_url || "";
        const avatarPath = normalizeAvatarPath(avatarRawUrl);
        const dbTransform =
          avatarPath && profile?.avatar_transform
            ? profile.avatar_transform
            : { scale: 1, offsetX: 0, offsetY: 0 };
        let finalUrl = DEFAULT_AVATAR;
        if (avatarPath) {
          try {
            const { data, error: signedErr } = await supabaseClient.storage
              .from(BUCKET)
              .createSignedUrl(avatarPath, 3600);
            if (!signedErr && data?.signedUrl) {
              finalUrl = resolveAvatarUrlFromProfile(avatarRawUrl, avatarPath, data.signedUrl, null);
            } else {
              const { data: publicData } = supabaseClient.storage.from(BUCKET).getPublicUrl(avatarPath);
              finalUrl = resolveAvatarUrlFromProfile(avatarRawUrl, avatarPath, null, publicData?.publicUrl);
            }
          } catch (_) {
            finalUrl = resolveAvatarUrlFromProfile(avatarRawUrl, avatarPath);
          }
        } else if (avatarRawUrl) {
          finalUrl = resolveAvatarUrlFromProfile(avatarRawUrl, avatarPath);
        }
        if (userAvatarImg) {
          ensureAvatarFallback(userAvatarImg);
          userAvatarImg.src = finalUrl;
          applyAvatarTransform(userAvatarImg, dbTransform);
        }
        const existing = cache.load() || {};
        cache.save({
          name: userNameEl?.textContent,
          avatarPath,
          avatarUrl: finalUrl,
          transform: avatarPath ? dbTransform : { scale: 1, offsetX: 0, offsetY: 0 },
          pending: false,
        });
      }
      avatarHydrating = false;
      return true;
    } catch (err) {
      console.warn("[Navbar] Falha ao carregar nome do usuário:", err);
      avatarHydrating = false;
      return true;
    }
  }

  (async () => {
    await ensureSupabaseClient();
    const hydrated = await hydrateUser();
    if (!hydrated) {
      const client = await waitForSupabaseClient();
      if (client) await hydrateUser(client);
    }
  })();

  const logoutBtn = navEl.querySelector("#logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const supabaseClient = window.supabaseClient;
        if (supabaseClient) await supabaseClient.auth.signOut();
      } catch (err) {
        console.error("Erro ao deslogar:", err);
      }
      try { sessionStorage.removeItem("mm_guard_v1"); } catch (_) {}
      window.location.href = "/";
    });
  }

  const profileBtn = navEl.querySelector("#profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "/perfil/info";
    });
  }

  if (clearCacheBtn) {
    clearCacheBtn.addEventListener("click", () => {
      openCacheClearModal();
    });
  }

  if (cacheClearModal) {
    cacheClearModal.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.cacheClearClose === "backdrop") {
        closeCacheClearModal();
      }
    });
  }

  if (cacheClearCancelBtn) {
    cacheClearCancelBtn.addEventListener("click", () => {
      if (cacheClearInFlight) return;
      if (cacheClearWaitChoiceEnabled) {
        void waitForSyncThenClearCache();
        return;
      }
      closeCacheClearModal();
    });
  }

  if (cacheClearCloseBtn) {
    cacheClearCloseBtn.addEventListener("click", () => {
      closeCacheClearModal();
    });
  }

  if (cacheClearConfirmBtn) {
    cacheClearConfirmBtn.addEventListener("click", async () => {
      if (cacheClearInFlight && !cacheClearWaitingForSync) return;
      if (cacheClearWaitingForSync) {
        cacheClearWaitRunId += 1;
        cacheClearWaitingForSync = false;
      }
      cacheClearInFlight = true;
      setCacheClearButtonsDisabled(true);

      try {
        await attemptCacheClear(cacheClearForceArmed);
      } catch (error) {
        setCacheClearForceMode(false);
        setCacheClearWaitChoiceMode(false);
        setCacheClearWaitingMode(false);
        setCacheClearStatus(
          `Falha ao limpar cache local: ${error instanceof Error ? error.message : String(error || "erro")}`,
          "error",
        );
      } finally {
        cacheClearInFlight = false;
        setCacheClearButtonsDisabled(false);
      }
    });
  }

  const themeBtn = navEl.querySelector("#theme-toggle-btn");
  ensureThemeManager().then((ThemeManager) => {
    if (!ThemeManager) return;

    const updateLabel = (theme) => {
      themeBtn.textContent = theme === "dark" ? "Modo Claro" : "Modo Escuro";
    };

    const applyThemeUI = (theme) => {
      if (themeBtn) updateLabel(theme);
    };

    applyThemeUI(ThemeManager.get());

    themeBtn.addEventListener("click", () => {
      try {
        sessionStorage.setItem("mm_scroll_top", "1");
      } catch (_) {
        /* noop */
      }
      const next = ThemeManager.toggle();
      applyThemeUI(next);
      setTimeout(() => {
        try {
          window.location.reload();
        } catch (_) {
          /* ignore */
        }
      }, 0);
    });

    window.addEventListener("themechange", (e) => {
      const next = e.detail?.theme || ThemeManager.get();
      applyThemeUI(next);
    });
  });
}

async function loadNavbar() {
  try {
    // Tenta primeiro o caminho absoluto para evitar 404 em subpastas
    const candidates = [
      "/navbar/navbar.html",
      "navbar/navbar.html",
      "../navbar/navbar.html",
      "../../navbar/navbar.html",
    ];
    let html = null;

    for (const path of candidates) {
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (res.ok) {
          html = await res.text();
          break;
        }
      } catch (_) {
        continue;
      }
    }

    if (!html) throw new Error("Não foi possível carregar navbar.html");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const navEl = wrapper.firstElementChild;
    const host = document.getElementById("navbar-root") || document.body;
    if (host.firstChild) {
      host.insertBefore(navEl, host.firstChild);
    } else {
      host.appendChild(navEl);
    }
    attachNavbarEvents(navEl);
  } catch (err) {
    console.error("[Navbar] Erro ao injetar navbar:", err);
  }
}

function initBackToTop() {
  const SHOW_AFTER = 480;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "back-to-top";
  btn.id = "back-to-top";
  btn.setAttribute("aria-label", "Voltar ao topo");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">' +
    '<path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  document.body.appendChild(btn);

  let ticking = false;
  const updateVisibility = () => {
    btn.classList.toggle("is-visible", window.scrollY > SHOW_AFTER);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateVisibility);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateVisibility();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
  initBackToTop();
});
