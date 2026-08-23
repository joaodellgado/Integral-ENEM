/**
 * Guarda de autenticação para páginas protegidas (roles: ADMIN, ALUNO).
 * Requer que `window.supabaseClient` já esteja definido (createClient com URL/KEY).
 */
(function () {
  const AUTH_READY_KEY = "mm_auth_ok";
  const GUARD_CACHE_KEY = "mm_guard_v1";
  const GUARD_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

  const cache = window.profileCache || {
    load() {
      return null;
    },
    save() {},
  };

  function loadGuardCache(userId) {
    try {
      const raw = sessionStorage.getItem(GUARD_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.userId !== userId) return null;
      if (Date.now() - parsed.ts > GUARD_CACHE_TTL) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function saveGuardCache(userId, role) {
    try {
      sessionStorage.setItem(GUARD_CACHE_KEY, JSON.stringify({ userId, role, ts: Date.now() }));
    } catch (_) {}
  }

  function clearGuardCache() {
    try {
      sessionStorage.removeItem(GUARD_CACHE_KEY);
    } catch (_) {}
  }

  function buildLoginRedirectUrl() {
    const path = String(window.location.pathname || "/");
    const search = String(window.location.search || "");
    const hash = String(window.location.hash || "");
    const target = `${path}${search}${hash}` || "/";
    const next = target.startsWith("/") ? target : "/";
    return `/?next=${encodeURIComponent(next)}`;
  }

  /**
   * Detecta erros de autenticação/JWT do Supabase e força logout + redirect
   * para o login, preservando a URL atual como destino pós-login.
   * @param {Object} error Erro retornado por uma chamada do Supabase.
   * @param {Object} [supabaseClient] Cliente Supabase; usa `window.supabaseClient` por padrão.
   * @returns {Promise<void>}
   */
  async function handleSupabaseAuthError(error, supabaseClient = window.supabaseClient) {
    if (!error || !supabaseClient) return;
    const message = (error.message || "").toLowerCase();
    const status = error.status || error.code || error?.name || "";
    const authKeywords = ["invalid jwt", "jwt expired", "not authenticated", "auth error", "invalid token", "expired"];

    const matches =
      authKeywords.some((kw) => message.includes(kw)) ||
      String(status).includes("JWT") ||
      String(status).includes("auth");

    if (matches) {
      try {
        await supabaseClient.auth.signOut();
      } catch (_) {}
      sessionStorage.removeItem(AUTH_READY_KEY);
      window.location.href = buildLoginRedirectUrl();
    }
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

  /**
   * Valida a sessão do usuário e exige role ADMIN ou ALUNO, redirecionando
   * para o login quando não autenticado ou não autorizado. Usa um cache de
   * sessão (30 min) para evitar consultas repetidas ao perfil.
   * @param {Object} [options]
   * @param {string} [options.redirectTo] URL de redirecionamento em caso de falha.
   * @returns {Promise<{user: Object, profile: Object|null}|null>} `null` se o acesso for negado.
   */
  async function enforceAdminGuard(options = {}) {
    const redirectTo = options.redirectTo || buildLoginRedirectUrl();
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      window.location.href = redirectTo;
      return null;
    }

    try {
      const hadAuthReadyFlag = sessionStorage.getItem(AUTH_READY_KEY) === "1";
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      const sessionUser = sessionData?.session?.user || null;
      if (sessionError || !sessionUser) {
        sessionStorage.removeItem(AUTH_READY_KEY);
        clearGuardCache();
        window.location.href = redirectTo;
        return null;
      }
      if (!hadAuthReadyFlag) {
        sessionStorage.setItem(AUTH_READY_KEY, "1");
      }

      // Fast path: guard cache válido + profileCache disponível → pula query ao banco
      const guardCached = loadGuardCache(sessionUser.id);
      const ALLOWED_ROLES = ["ADMIN", "ALUNO"];
      if (ALLOWED_ROLES.includes(guardCached?.role) && cache.load()) {
        return { user: sessionUser, profile: null };
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("role, nome, avatar_url, avatar_transform")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (profileError) {
        await handleSupabaseAuthError(profileError, supabaseClient);
      }

      const rawRole = profile?.role || sessionUser.user_metadata?.role || null;
      const normalizedRole = rawRole ? String(rawRole).toUpperCase() : null;
      const isAuthorized = ALLOWED_ROLES.includes(normalizedRole);

      if (!isAuthorized) {
        alert("Sua conta não tem permissão de acesso à plataforma.");
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem(AUTH_READY_KEY);
        clearGuardCache();
        window.location.href = redirectTo;
        return null;
      }

      saveGuardCache(sessionUser.id, normalizedRole);

      const cached = cache.load();
      const defaultTransform = { scale: 1, offsetX: 0, offsetY: 0 };
      let transform = defaultTransform;

      if (profile?.avatar_url) {
        transform = profile?.avatar_transform || cached?.transform || defaultTransform;
      } else {
        if (profile?.avatar_transform) {
          try {
            await supabaseClient.from("profiles").update({ avatar_transform: null }).eq("id", sessionUser.id);
          } catch (_) {
            /* noop */
          }
        }
      }

      const normalizedAvatarPath = normalizeAvatarPath(profile?.avatar_url);

      cache.save({
        name: profile?.nome || sessionUser.email || "Usuário",
        avatarPath: normalizedAvatarPath,
        avatarUrl: normalizedAvatarPath ? cached?.avatarUrl || "/imagens/default-avatar.png" : "/imagens/default-avatar.png",
        transform: normalizedAvatarPath ? transform : defaultTransform,
        pending: normalizedAvatarPath ? cached?.pending ?? false : false,
      });

      return { user: sessionUser, profile };
    } catch (err) {
      console.warn("[AuthGuard] Erro ao validar sessão/role:", err);
      sessionStorage.removeItem(AUTH_READY_KEY);
      window.location.href = redirectTo;
      return null;
    }
  }

  window.handleSupabaseAuthError = handleSupabaseAuthError;
  window.enforceAdminGuard = enforceAdminGuard;
})();
