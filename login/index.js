console.log("[Login] script carregado");

/* ── Supabase init ─────────────────────────────────── */
const { createClient } = window.supabase || {};
if (!createClient) console.error("[Login] Supabase não carregou.");

const supabaseUrl     = window.__MM_CONFIG__?.supabaseUrl     || "";
const supabaseAnonKey = window.__MM_CONFIG__?.supabaseAnonKey || "";
const supabaseClient  = createClient ? createClient(supabaseUrl, supabaseAnonKey) : null;

/* ── Helpers de UI ─────────────────────────────────── */
function showError(msg) {
  const el   = document.getElementById("loginError");
  const text = document.getElementById("loginErrorText");
  const succ = document.getElementById("loginSuccess");
  if (succ) { succ.style.display = "none"; }
  if (!el || !text) { console.error("[Login] UI erro:", msg); return; }
  text.textContent = msg;
  el.removeAttribute("hidden");
  el.style.display = "flex";
}

function showSuccess(msg) {
  const el   = document.getElementById("loginSuccess");
  const text = document.getElementById("loginSuccessText");
  const err  = document.getElementById("loginError");
  if (err) { err.style.display = "none"; }
  if (!el || !text) return;
  text.textContent = msg;
  el.removeAttribute("hidden");
  el.style.display = "flex";
}

function hideAlerts() {
  const err  = document.getElementById("loginError");
  const succ = document.getElementById("loginSuccess");
  if (err)  { err.style.display  = "none"; }
  if (succ) { succ.style.display = "none"; }
}

function setLoading(on) {
  const btn     = document.getElementById("loginBtn");
  const label   = btn?.querySelector(".l-btn__label");
  const spinner = btn?.querySelector(".l-btn__spinner");
  const email   = document.getElementById("email");
  const pwd     = document.getElementById("password");
  if (!btn) return;
  btn.disabled = on;
  if (label)   label.hidden   = on;
  if (spinner) spinner.hidden = !on;
  if (email) email.disabled   = on;
  if (pwd)   pwd.disabled     = on;
}

/* ── Mensagens de erro por tipo ────────────────────── */
function getErrorMsg(error) {
  const raw = String(error?.message || "").toLowerCase();
  if (raw.includes("invalid login credentials") || raw.includes("invalid credentials") || raw.includes("wrong password") || raw.includes("user not found") || raw.includes("email not found")) {
    return "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.";
  }
  if (raw.includes("email not confirmed")) {
    return "Voce precisa confirmar seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  if (raw.includes("too many requests") || raw.includes("rate limit") || raw.includes("over_email_send_rate_limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }
  if (raw.includes("network") || raw.includes("fetch") || raw.includes("load failed") || raw.includes("offline") || raw.includes("failed to fetch")) {
    return "Sem conexao com a internet. Verifique sua rede e tente novamente.";
  }
  if (raw.includes("signup disabled") || raw.includes("not authorized") || raw.includes("unauthorized")) {
    return "Acesso nao autorizado. Entre em contato com o suporte.";
  }
  return "Ocorreu um erro inesperado. Tente novamente em instantes.";
}

/* ── Show/hide senha ───────────────────────────────── */
document.getElementById("togglePwd")?.addEventListener("click", () => {
  const input   = document.getElementById("password");
  const eyeShow = document.getElementById("eyeShow");
  const eyeHide = document.getElementById("eyeHide");
  if (!input) return;
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  document.getElementById("togglePwd").setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
  if (eyeShow) { eyeShow.removeAttribute("hidden"); eyeShow.style.display = !showing ? "none" : ""; }
  if (eyeHide) { eyeHide.removeAttribute("hidden"); eyeHide.style.display =  showing ? "none" : ""; }
});

/* ── Limpa erro ao digitar ─────────────────────────── */
["email", "password"].forEach(function(id) {
  document.getElementById(id)?.addEventListener("input", function() {
    const err = document.getElementById("loginError");
    if (err) err.style.display = "none";
    document.getElementById(id)?.classList.remove("is-error");
  });
});

/* ── Constantes de sessao ──────────────────────────── */
const AUTH_READY_KEY = "mm_auth_ok";

function resolvePostLoginPath() {
  const params   = new URLSearchParams(window.location.search || "");
  const rawNext  = params.get("next");
  const fallback = "/geral";
  if (!rawNext) return fallback;
  const next = String(rawNext).trim();
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next === "/" || next === "/index" || next === "/index.html") return fallback;
  return next;
}

/* ── Helpers de Supabase ───────────────────────────── */
async function logAdminLogin(user, role) {
  if (!supabaseClient || !user) return;
  try {
    await supabaseClient.from("admin_logs").insert({
      autor_id:    user.id   || null,
      autor_nome:  "Nova Sessao!",
      autor_email: user.email || null,
      acao:        "Um novo login foi registrado no cargo de " + role + "!",
    });
  } catch (err) {
    console.warn("[Login] Falha ao registrar log:", err);
  }
}

async function fetchUserRole(user) {
  if (!user || !supabaseClient) return null;
  const metaRole = user.user_metadata?.role ? String(user.user_metadata.role).toUpperCase() : null;
  if (metaRole) return metaRole;
  const { data, error } = await supabaseClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error) { console.warn("[Login] Falha ao buscar role:", error); return null; }
  return data?.role ? String(data.role).toUpperCase() : null;
}

/* ── Auto-redirect se ja logado ────────────────────── */
(async function() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data?.session?.user) return;
  const role = await fetchUserRole(data.session.user);
  if (role === "ADMIN" || role === "ALUNO") {
    sessionStorage.setItem(AUTH_READY_KEY, "1");
    window.location.replace(resolvePostLoginPath());
  } else {
    sessionStorage.removeItem(AUTH_READY_KEY);
    await supabaseClient.auth.signOut();
  }
})();

/* ── Login ─────────────────────────────────────────── */
window.handleLogin = async function(event) {
  event.preventDefault();
  hideAlerts();

  const emailEl  = document.getElementById("email");
  const pwdEl    = document.getElementById("password");
  const email    = emailEl?.value.trim() || "";
  const password = pwdEl?.value || "";

  console.log("[Login] handleLogin chamado", { email: email, hasPassword: !!password });

  if (!email) {
    showError("Por favor, insira seu e-mail.");
    emailEl?.classList.add("is-error");
    emailEl?.focus();
    return;
  }
  if (!password) {
    showError("Por favor, insira sua senha.");
    pwdEl?.classList.add("is-error");
    pwdEl?.focus();
    return;
  }
  if (!supabaseClient) {
    console.error("[Login] supabaseClient e null");
    showError("Erro de configuracao. Recarregue a pagina e tente novamente.");
    return;
  }

  setLoading(true);
  console.log("[Login] Chamando signInWithPassword...");

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email: email, password: password });

    console.log("[Login] signInWithPassword resultado:", { userId: data?.user?.id, errorMsg: error?.message });

    if (error) {
      showError(getErrorMsg(error));
      emailEl?.classList.add("is-error");
      pwdEl?.classList.add("is-error");
      setLoading(false);
      return;
    }

    if (!data?.user) {
      console.warn("[Login] data.user ausente apos login");
      showError("Usuario nao encontrado. Verifique suas credenciais.");
      setLoading(false);
      return;
    }

    console.log("[Login] Login OK, buscando role...");
    const role = await fetchUserRole(data.user);
    console.log("[Login] Role obtida:", role);

    if (role !== "ADMIN" && role !== "ALUNO") {
      console.warn("[Login] Role sem permissão de acesso:", role);
      await supabaseClient.auth.signOut();
      sessionStorage.removeItem(AUTH_READY_KEY);
      showError("Sua conta não tem permissão de acesso à plataforma. Entre em contato com o suporte.");
      setLoading(false);
      return;
    }

    console.log("[Login] Acesso autorizado (" + role + "), redirecionando para", resolvePostLoginPath());
    sessionStorage.setItem(AUTH_READY_KEY, "1");
    logAdminLogin(data.user, role);
    window.location.replace(resolvePostLoginPath());

  } catch (e) {
    console.error("[Login] Erro inesperado:", e);
    showError(getErrorMsg(e));
    setLoading(false);
  }
};

/* ── Recuperar senha ───────────────────────────────── */
document.getElementById("recoveryBtn")?.addEventListener("click", async function() {
  hideAlerts();
  const emailEl = document.getElementById("email");
  const email   = emailEl?.value.trim() || "";

  if (!email) {
    showError("Insira seu e-mail no campo acima para receber o link de recuperacao.");
    emailEl?.classList.add("is-error");
    emailEl?.focus();
    return;
  }
  if (!supabaseClient) return;

  const btn          = document.getElementById("recoveryBtn");
  const originalText = btn.textContent;
  btn.textContent    = "Enviando...";
  btn.disabled       = true;

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/",
    });
    if (error) {
      showError(getErrorMsg(error));
    } else {
      showSuccess("Link de recuperacao enviado para " + email + ". Verifique sua caixa de entrada (e o spam).");
    }
  } catch (e) {
    showError("Nao foi possivel enviar o e-mail de recuperacao. Tente novamente.");
  } finally {
    btn.textContent = originalText;
    btn.disabled    = false;
  }
});
