// Serve window.__MM_CONFIG__ dinamicamente a partir de variáveis de ambiente,
// para que a URL/chave do Supabase não fiquem hardcoded no código-fonte versionado.
// A anon key do Supabase é pública por design (protegida por Row Level Security),
// mas mesmo assim mantida fora do repositório por boa prática e organização.
module.exports = function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.end(`(function () {
  window.__MM_CONFIG__ = ${JSON.stringify({ supabaseUrl, supabaseAnonKey })};

  window.addEventListener("unhandledrejection", function (event) {
    console.error("[MM] Promise não tratada:", event.reason);
  });

  window.addEventListener("error", function (event) {
    console.error("[MM] Erro não capturado:", event.message, event.filename + ":" + event.lineno);
  });
})();
`);
};
