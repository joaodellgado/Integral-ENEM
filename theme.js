(function () {
  const STORAGE_KEY = "mm_theme";
  const SCROLL_TOP_KEY = "mm_scroll_top";
  const root = document.documentElement;
  const mediaQuery = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function resolveTheme(value) {
    if (value === "light" || value === "dark") return value;
    if (mediaQuery && mediaQuery.matches) return "dark";
    return "light";
  }

  function applyTheme(value, persist) {
    const next = resolveTheme(value);
    root.dataset.theme = next;
    root.style.colorScheme = next;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (_) {
        /* noop */
      }
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    return next;
  }

  const storedTheme = getStoredTheme();
  applyTheme(storedTheme, false);

  try {
    if (sessionStorage.getItem(SCROLL_TOP_KEY)) {
      const toTop = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      toTop();
      window.addEventListener("DOMContentLoaded", toTop, { once: true });
      window.addEventListener("load", () => {
        toTop();
        sessionStorage.removeItem(SCROLL_TOP_KEY);
      });
    }
  } catch (_) {
    /* noop */
  }

  if (mediaQuery) {
    const handleChange = (event) => {
      if (getStoredTheme()) return;
      applyTheme(event.matches ? "dark" : "light", false);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
  }

  window.ThemeManager = {
    get() {
      return resolveTheme(root.dataset.theme || getStoredTheme());
    },
    set(theme) {
      return applyTheme(theme, true);
    },
    toggle() {
      const current = resolveTheme(root.dataset.theme || getStoredTheme());
      return applyTheme(current === "light" ? "dark" : "light", true);
    },
  };
})();
