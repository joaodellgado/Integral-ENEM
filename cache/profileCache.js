(function () {
  const CACHE_KEY = "mm_profile_cache";
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  function load() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
    } catch (_) {
      /* noop */
    }
  }

  function clear() {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (_) {
      /* noop */
    }
  }

  window.profileCache = {
    load,
    save,
    clear,
    CACHE_KEY,
    CACHE_TTL,
  };
})();
