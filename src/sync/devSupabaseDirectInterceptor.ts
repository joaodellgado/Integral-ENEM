function shouldInstallDevInterceptor(): boolean {
  const host = window.location.hostname || "";
  return host === "localhost" || host === "127.0.0.1";
}

function isSupabaseUrl(value: unknown): boolean {
  try {
    const str = String(value || "");
    return /supabase/i.test(str);
  } catch {
    return false;
  }
}

function shouldWarnForSupabaseRequest(url: string, method: string): boolean {
  const upper = String(method || "GET").toUpperCase();
  if (upper === "GET" || upper === "HEAD" || upper === "OPTIONS") return false;
  if (/\/auth\/v1\//i.test(url)) return false;
  if (/\/storage\/v1\//i.test(url)) return false;
  return true;
}

function warnDirectSupabaseCall(kind: "fetch" | "xhr", url: string): void {
  const globalRef = window as unknown as { __syncOutboxSending?: boolean };
  if (globalRef.__syncOutboxSending) return;
  const stack = new Error().stack || "";
  if (stack.includes("outboxSenderSupabase")) return;
  console.warn("[SYNC] Direct Supabase call detected (should go via outbox)", { kind, url });
  console.trace();
  if ((window as unknown as { __MM_THROW_ON_DIRECT_SUPABASE_WRITE__?: boolean }).__MM_THROW_ON_DIRECT_SUPABASE_WRITE__) {
    throw new Error("Direct Supabase write blocked in dev (use outbox)");
  }
}

/**
 * Instala, apenas em ambiente de desenvolvimento local, um patch em
 * `window.fetch`/`XMLHttpRequest` que alerta quando uma chamada de escrita
 * atinge o Supabase diretamente em vez de passar pelo outbox de sincronização.
 * Opcionalmente lança uma exceção quando `__MM_THROW_ON_DIRECT_SUPABASE_WRITE__`
 * está habilitado, para detecção mais estrita em testes.
 * @returns {void}
 */
export function installDirectSupabaseCallInterceptor(): void {
  if (!shouldInstallDevInterceptor()) return;
  const globalRef = window as unknown as { __syncDirectSupabaseInterceptorInstalled?: boolean };
  if (globalRef.__syncDirectSupabaseInterceptorInstalled) return;
  globalRef.__syncDirectSupabaseInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method =
      init?.method ||
      (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET") ||
      "GET";
    if (isSupabaseUrl(url) && shouldWarnForSupabaseRequest(url, method)) warnDirectSupabaseCall("fetch", url);
    return originalFetch(input as RequestInfo, init);
  }) as typeof window.fetch;

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function patchedOpen(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    const target = typeof url === "string" ? url : url.toString();
    if (isSupabaseUrl(target) && shouldWarnForSupabaseRequest(target, method)) warnDirectSupabaseCall("xhr", target);
    return origOpen.call(this, method, url, async ?? true, username as string, password as string);
  };
}
