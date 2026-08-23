function shouldInstallDevInterceptor() {
    const host = window.location.hostname || "";
    return host === "localhost" || host === "127.0.0.1";
}
function isSupabaseUrl(value) {
    try {
        const str = String(value || "");
        return /supabase/i.test(str);
    }
    catch {
        return false;
    }
}
function shouldWarnForSupabaseRequest(url, method) {
    const upper = String(method || "GET").toUpperCase();
    if (upper === "GET" || upper === "HEAD" || upper === "OPTIONS")
        return false;
    if (/\/auth\/v1\//i.test(url))
        return false;
    if (/\/storage\/v1\//i.test(url))
        return false;
    return true;
}
function warnDirectSupabaseCall(kind, url) {
    const globalRef = window;
    if (globalRef.__syncOutboxSending)
        return;
    const stack = new Error().stack || "";
    if (stack.includes("outboxSenderSupabase"))
        return;
    console.warn("[SYNC] Direct Supabase call detected (should go via outbox)", { kind, url });
    console.trace();
    if (window.__MM_THROW_ON_DIRECT_SUPABASE_WRITE__) {
        throw new Error("Direct Supabase write blocked in dev (use outbox)");
    }
}
export function installDirectSupabaseCallInterceptor() {
    if (!shouldInstallDevInterceptor())
        return;
    const globalRef = window;
    if (globalRef.__syncDirectSupabaseInterceptorInstalled)
        return;
    globalRef.__syncDirectSupabaseInterceptorInstalled = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ||
            (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET") ||
            "GET";
        if (isSupabaseUrl(url) && shouldWarnForSupabaseRequest(url, method))
            warnDirectSupabaseCall("fetch", url);
        return originalFetch(input, init);
    });
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function patchedOpen(method, url, async, username, password) {
        const target = typeof url === "string" ? url : url.toString();
        if (isSupabaseUrl(target) && shouldWarnForSupabaseRequest(target, method))
            warnDirectSupabaseCall("xhr", target);
        return origOpen.call(this, method, url, async ?? true, username, password);
    };
}
//# sourceMappingURL=devSupabaseDirectInterceptor.js.map