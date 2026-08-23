const MAX_FILES = 24;
const MAX_IMAGE_DATA_URL_LENGTH = 1_600_000;
const MAX_PDF_DATA_URL_LENGTH = 11_000_000;
const MAX_TOTAL_DATA_URL_LENGTH = 12_000_000;
const SCANNER_MODEL = "gemini-3.1-flash-lite-preview";
const CARDS_MODEL = "gemini-3.1-pro-preview";
const GEMINI_API_VERSION = "v1beta";
const INPUT_COST_PER_1M = Number.parseFloat(process.env.GEMINI_SCANNER_INPUT_COST_PER_1M || "");
const OUTPUT_COST_PER_1M = Number.parseFloat(process.env.GEMINI_SCANNER_OUTPUT_COST_PER_1M || "");
const SCANNER_TEMPERATURE = 0.25;
// Mesmos valores usados no cliente (api/config.js), lidos de variáveis de
// ambiente — a anon key do Supabase é segura para expor (protegida por Row
// Level Security); a verificação de identidade real acontece via /auth/v1/user.
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

/**
 * Valida o Bearer token da requisição contra `/auth/v1/user` do Supabase.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<Object|null>} O usuário autenticado, ou null se o token for ausente/inválido.
 */
async function getAuthenticatedUser(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const header = String(req.headers?.authorization || req.headers?.Authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : "";
  if (!token) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!response.ok) return null;
    const user = await response.json().catch(() => null);
    return user?.id ? user : null;
  } catch (_) {
    return null;
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function extractJsonObject(text) {
  if (!text) return null;
  const parsed = tryParseJson(text);
  if (parsed && typeof parsed === "object") return parsed;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return tryParseJson(text.slice(start, end + 1));
}

function sanitizeCards(cards) {
  if (!Array.isArray(cards)) return [];
  return cards
    .map((card) => ({
      front: normalizeText(card?.front || card?.frente),
      back: normalizeText(card?.back || card?.verso),
    }))
    .filter((card) => card.front || card.back);
}

function sanitizeChecklistItems(items) {
  if (!Array.isArray(items)) return [];
  const unique = new Set();
  const sanitized = [];
  for (const entry of items) {
    const text = normalizeText(entry);
    if (!text) continue;
    const key = text.toLocaleLowerCase("pt-BR");
    if (unique.has(key)) continue;
    unique.add(key);
    sanitized.push(text);
  }
  return sanitized;
}

function sanitizeCoverageChecklist(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      identifiedWithCards: [],
      notIdentifiedNoCards: [],
      correctionsApplied: [],
    };
  }
  const correctionsRaw =
    raw.correctionsApplied ||
    raw.correcoes_aplicadas ||
    raw?.checklist_correcoes?.correcoes_aplicadas ||
    raw?.correctionsChecklist?.correctionsApplied ||
    [];
  return {
    identifiedWithCards: sanitizeChecklistItems(raw.identifiedWithCards || raw.identificados_com_card),
    notIdentifiedNoCards: sanitizeChecklistItems(
      raw.notIdentifiedNoCards || raw.nao_identificados_sem_card || raw.nao_identificados_sem_cartao,
    ),
    correctionsApplied: sanitizeChecklistItems(correctionsRaw),
  };
}

/**
 * Extrai contagem de tokens da resposta do Gemini e estima o custo em USD
 * a partir das variáveis de ambiente de preço por milhão de tokens, quando definidas.
 * @returns {Object} Metadados de uso, com `estimatedCostUsd` null se o preço não estiver configurado.
 */
function buildUsageMeta(raw, model, apiVersion) {
  const usage =
    raw?.usageMetadata && typeof raw.usageMetadata === "object"
      ? raw.usageMetadata
      : raw?.usage && typeof raw.usage === "object"
      ? raw.usage
      : {};
  const inputTokens = Number(usage.promptTokenCount ?? usage.input_tokens ?? usage.prompt_tokens) || 0;
  const outputTokens =
    Number(usage.candidatesTokenCount ?? usage.output_tokens ?? usage.completion_tokens) || 0;
  const totalTokens = Number(usage.total_tokens) || inputTokens + outputTokens;
  const hasPricing = Number.isFinite(INPUT_COST_PER_1M) && Number.isFinite(OUTPUT_COST_PER_1M);
  const estimatedCostUsd = hasPricing ? (inputTokens / 1_000_000) * INPUT_COST_PER_1M + (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M : null;

  return {
    model,
    apiVersion,
    instructionMode: "cards_from_documents",
    maxCards: null,
    usage: {
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens,
    },
    estimatedCostUsd: Number.isFinite(estimatedCostUsd) ? Number(estimatedCostUsd.toFixed(6)) : null,
  };
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return tryParseJson(req.body) || {};
  return {};
}

function extractDataUrlParts(dataUrl) {
  const raw = normalizeText(dataUrl);
  const match = raw.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: normalizeText(match[1]).toLowerCase(),
    data: normalizeText(match[2]),
  };
}

function extractGeminiErrorMessage(raw) {
  const message = normalizeText(raw?.error?.message || raw?.message);
  return message || "Falha no Gemini.";
}

function isModelUnavailableError(status, message) {
  if (status === 404) return true;
  const normalized = normalizeText(message).toLowerCase();
  if (!normalized) return false;
  return normalized.includes("not found") || normalized.includes("not supported for generatecontent");
}

async function requestGeminiGenerate({ apiKey, apiVersion, model, systemPrompt, userPrompt, inputParts }) {
  const mergedPrompt = [systemPrompt, "", userPrompt].join("\n");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: mergedPrompt }, ...inputParts],
          },
        ],
        generationConfig: {
          temperature: SCANNER_TEMPERATURE,
        },
      }),
    },
  );

  let raw = {};
  try {
    raw = await response.json();
  } catch (_) {
    raw = {};
  }
  return { response, raw };
}

function extractGeminiText(raw) {
  return (
    normalizeText(
      Array.isArray(raw?.candidates)
        ? raw.candidates
            .flatMap((candidate) => (Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []))
            .map((part) => normalizeText(part?.text))
            .find((text) => text)
        : "",
    ) ||
    normalizeText(
      Array.isArray(raw?.output)
        ? raw.output
            .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
            .map((part) => normalizeText(part?.text))
            .find((text) => text)
        : "",
    )
  );
}

/**
 * Chama a API Gemini para o modelo informado e traduz erros de modelo
 * indisponível (404 ou mensagem equivalente) em uma mensagem acionável.
 * @returns {Promise<{raw: Object, model: string, apiVersion: string}|{error: string, status: number}>}
 */
async function generateWithModel({ apiKey, model, systemPrompt, userPrompt, inputParts }) {
  const { response, raw } = await requestGeminiGenerate({
    apiKey,
    apiVersion: GEMINI_API_VERSION,
    model,
    systemPrompt,
    userPrompt,
    inputParts,
  });
  if (response.ok) return { raw, model, apiVersion: GEMINI_API_VERSION };

  const message = extractGeminiErrorMessage(raw);
  if (isModelUnavailableError(Number(response.status) || 502, message)) {
    return {
      error: `O modelo ${model} não está disponível para a sua chave/projeto na API v1beta. Verifique a chave GEMINI_API_KEY e o projeto no Google AI Studio.`,
      status: 502,
    };
  }

  return { error: message, status: 502 };
}

function buildGeminiResponseSchema() {
  return {
    type: "OBJECT",
    properties: {
      area: { type: "STRING" },
      competencia_enem: { type: "STRING" },
      flashcards: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            frente: { type: "STRING" },
            verso: { type: "STRING" },
            alerta_distrator: { type: "STRING" },
            conexao_intra_area: { type: "STRING" },
            dica_800_mais: { type: "STRING" },
          },
          required: ["frente", "verso"],
        },
      },
      deckName: { type: "STRING" },
      topicName: { type: "STRING" },
    },
    required: ["area", "competencia_enem", "flashcards"],
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return send(res, 405, { error: "Método não permitido." });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return send(res, 500, { error: "SUPABASE_URL/SUPABASE_ANON_KEY não configuradas no servidor." });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return send(res, 401, { error: "Sessão inválida ou expirada. Faça login novamente." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 500, { error: "GEMINI_API_KEY não configurada no servidor." });
  }

  const body = parseBody(req);
  const deckName = normalizeText(body.deckName);
  const topicName = normalizeText(body.topicName);
  const files = Array.isArray(body.files) ? body.files : Array.isArray(body.images) ? body.images : [];

  if (!deckName || deckName.length < 2) {
    return send(res, 400, { error: "Nome de deck inválido." });
  }
  if (!topicName || topicName.length < 2) {
    return send(res, 400, { error: "Nome de tópico inválido." });
  }
  if (!files.length) {
    return send(res, 400, { error: "Envie ao menos 1 arquivo (imagem ou PDF)." });
  }
  if (files.length > MAX_FILES) {
    return send(res, 400, { error: `Limite de ${MAX_FILES} arquivos por envio.` });
  }

  const validFiles = files
    .map((entry) => ({
      name: normalizeText(entry?.name) || "arquivo",
      mimeType: normalizeText(entry?.mimeType).toLowerCase(),
      dataUrl: normalizeText(entry?.dataUrl),
    }))
    .filter((file) => {
      const isImage = /^image\/(png|jpeg|webp)$/i.test(file.mimeType) && file.dataUrl.startsWith("data:image/");
      const isPdf = file.mimeType === "application/pdf" && file.dataUrl.startsWith("data:application/pdf");
      return isImage || isPdf;
    });

  if (!validFiles.length || validFiles.length !== files.length) {
    return send(res, 400, { error: "Formato inválido. Use PNG, JPG, WEBP ou PDF." });
  }

  const hasLargeImage = validFiles.some(
    (file) => file.mimeType.startsWith("image/") && file.dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH,
  );
  if (hasLargeImage) {
    return send(res, 400, { error: "Uma das imagens é grande demais. Reduza e tente novamente." });
  }
  const hasLargePdf = validFiles.some((file) => file.mimeType === "application/pdf" && file.dataUrl.length > MAX_PDF_DATA_URL_LENGTH);
  if (hasLargePdf) {
    return send(res, 400, { error: "Um dos PDFs é grande demais. Reduza e tente novamente." });
  }
  const totalSize = validFiles.reduce((acc, file) => acc + file.dataUrl.length, 0);
  if (totalSize > MAX_TOTAL_DATA_URL_LENGTH) {
    return send(res, 400, { error: "O conjunto de arquivos ficou grande demais. Envie arquivos menores." });
  }

  const inputParts = validFiles
    .map((file) => {
      const parsed = extractDataUrlParts(file.dataUrl);
      if (!parsed || !parsed.data) return null;
      return {
        inlineData: {
          mimeType: parsed.mimeType || file.mimeType,
          data: parsed.data,
        },
      };
    })
    .filter(Boolean);

  if (!inputParts.length) {
    return send(res, 400, { error: "Não foi possível processar os arquivos enviados." });
  }

  const scanSystemPrompt = [
    "Você é um scanner técnico. Sua tarefa é extrair integralmente o conteúdo dos anexos com máxima fidelidade.",
    "É obrigatório ler TODOS os arquivos anexados (todas as imagens e todos os PDFs) sem pular nenhum arquivo.",
    "Para cada PDF, é obrigatório ler TODAS as páginas, da primeira à última, sem omitir nenhuma.",
    "Para imagens, é obrigatório ler TODO o conteúdo visível da imagem, sem recortes parciais.",
    "NÃO invente informações e NÃO resuma em excesso.",
    "Preserve termos técnicos, nomes de funções, fórmulas, símbolos, números, classificações e exceções.",
    "Se alguma parte estiver ilegível, marque explicitamente como [ILEGÍVEL] sem adivinhar.",
    "Organize a saída por tópicos e subtópicos para facilitar geração posterior de flashcards.",
  ].join("\n");
  const scanUserPrompt = [
    "Extraia 100% do conteúdo legível dos arquivos anexados (imagens/PDF).",
    "Confirme internamente que você percorreu todos os arquivos recebidos e todas as páginas de cada PDF antes de finalizar a extração.",
    "Retorne uma transcrição técnica estruturada, cobrindo todo o material sem omitir nenhum ponto importante.",
    "NÃO gere flashcards nesta etapa.",
  ].join("\n");

  const cardsSystemPrompt = [
    "Você é um professor de elite, focado em aprovar alunos em Medicina no ENEM, com TRI de 800+ pontos na média geral.",
    "Sua função é transformar materiais de estudo em flashcards de alta complexidade seguindo SEMPRE a Matriz de Referência do ENEM.",
    "Nesta etapa, use EXCLUSIVAMENTE o conteúdo textual escaneado fornecido. Não use suposições externas.",
    "",
    "DIRETRIZES DE ATUAÇÃO:",
    "1. FIDELIDADE E PRECISÃO: Use apenas as fontes enviadas. Se algo for ilegível, use lógica técnica. NÃO invente dados e nem deduza nada sobre o conteúdo.",
    "2. COBERTURA TOTAL (Obrigatório): todo conceito, definição, processo, fórmula, função, nomenclatura técnica, exceção e detalhe relevante presente nos anexos deve gerar cards. NÃO deixe NENHUM ponto sem card.",
    "3. TIPOS DE CARD COMPLEMENTARES (Obrigatório): crie simultaneamente cards de situação-problema e cards técnicos diretos (conceitos, definições, mecanismos, classificações, comparações e memorização técnica).",
    "4. NÃO SUBSTITUIÇÃO (Obrigatório): nenhum card substitui outro. Se um ponto comporta card de situação-problema e card técnico direto, gere ambos. Cada card deve ser único.",
    "5. INTERCONEXÃO POR ÁREA (Obrigatório):",
    "- Naturezas: Conecte Bio/Fís/Quím (ex: Termorregulação + Calorimetria) com base em questões que já vieram nas provas do ENEM e outros vestibulares de referência.",
    "- Humanas: Conecte Hist/Geo/Soc/Filo (ex: Colonização + Geopolítica do Café).",
    "- Linguagens: Foque em Análises de texto, Funções da Linguagem, Figuras e Estratégias Argumentativas.",
    "- Matemática: Foque em Razão/Proporção, Funções e Geometria, sempre aplicadas a situações reais.",
    "6. QUANTIDADE: não existe limite máximo fixo de cards nesta geração. Gere quantos forem necessários para cobrir integralmente todos os anexos sem lacunas.",
    "7. REVISÃO FINAL OBRIGATÓRIA: antes de concluir, revise se a quantidade de cards criada cobre integralmente o conteúdo escaneado. Se faltar qualquer ponto, gere cards adicionais até cobrir tudo, com base nas fontes enviadas pelo usuário.",
    "8. CHECKLIST DE COBERTURA (Obrigatório): no JSON final, preencha 'checklist_cobertura.identificados_com_card' com os conteúdos identificados nas fontes e cobertos por cards, e 'checklist_cobertura.nao_identificados_sem_card' com o que não foi possível identificar com segurança e ficou sem card.",
    "9. GARANTIA DE LEITURA COMPLETA: considere explicitamente que o conteúdo escaneado representa TODOS os documentos enviados pelo aluno (imagens e PDFs) e TODAS as páginas; não deixe de cobrir nada desse conjunto.",
    '10. VERACIDADE OBRIGATÓRIA: "Você NUNCA deve criar cartões com informações falsas. Se você verificar que o usuário enviou fontes com informações erradas, você DEVE corrigir no cartão. Você SEMPRE deve ajudar o usuário com informações CORRETAS! Mesmo que o usuário tenha anotado algo de errado".',
    "11. TRANSPARÊNCIA DE CORREÇÕES (Obrigatório): sempre que corrigir algo das fontes, registre no JSON final em 'checklist_correcoes.correcoes_aplicadas' descrevendo objetivamente o que foi corrigido.",
  ].join("\n");
  const cardsUserPrompt = [
    `Crie flashcards para o deck "${deckName}" e tópico "${topicName}" com base EXCLUSIVA no conteúdo escaneado recebido.`,
    "Gere todos os cartões necessários para cobrir 100% do conteúdo dos anexos, sem omitir nenhum conceito ou termo técnico.",
    "Balanceie a saída entre: (a) perguntas de situação-problema e (b) perguntas técnicas diretas sobre o conteúdo em si.",
    "Não substitua categorias entre si: card de situação-problema NÃO substitui card técnico direto, e vice-versa. Todos os cards necessários devem ser criados",
    "Cada card deve ser único, específico e não redundante.",
    "Ao final, faça uma checagem de cobertura: se o número de cards ainda não englobar todo o conteúdo das fontes, gere novos cards para os pontos faltantes antes de responder.",
    "Respeite integralmente as diretrizes de professor de elite ENEM/TRI.",
    "Formato de saída JSON obrigatório:",
    "{",
    '  "area": "Naturezas/Humanas/Linguagens/Matemática",',
    '  "competencia_enem": "Descreva a competência da matriz envolvida",',
    '  "checklist_cobertura": {',
    '    "identificados_com_card": ["Item/conceito das fontes que recebeu card"],',
    '    "nao_identificados_sem_card": ["Item das fontes que não foi possível identificar com confiança e ficou sem card"]',
    "  },",
    '  "checklist_correcoes": {',
    '    "correcoes_aplicadas": ["Descreva objetivamente cada correção aplicada quando as fontes tiverem erro"]',
    "  },",
    '  "flashcards": [',
    "    {",
    '      "frente": "Pergunta de situação-problema OU pergunta técnica direta (ambos os tipos devem existir no conjunto final)",',
    '      "verso": "Resposta técnica completa + explicação objetiva do mecanismo/conceito",',
    '      "alerta_distrator": "Qual a pegadinha comum desse tema?",',
    '      "conexao_intra_area": "Relação com outra matéria da mesma área",',
    '      "dica_800_mais": "Pulo do gato para a TRI não baixar sua nota"',
    "    }",
    "  ]",
    "}",
    "Opcionalmente inclua deckName e topicName no topo do JSON.",
  ].join("\n");

  try {
    const scan = await generateWithModel({
      apiKey,
      model: SCANNER_MODEL,
      systemPrompt: scanSystemPrompt,
      userPrompt: scanUserPrompt,
      inputParts,
    });
    if (scan?.error) {
      return send(res, scan.status || 502, { error: scan.error });
    }
    const scannedText = extractGeminiText(scan.raw);
    if (!scannedText) {
      return send(res, 502, { error: "A IA de escaneamento não retornou texto utilizável." });
    }

    const generation = await generateWithModel({
      apiKey,
      model: CARDS_MODEL,
      systemPrompt: cardsSystemPrompt,
      userPrompt: cardsUserPrompt,
      inputParts: [{ text: `CONTEUDO_ESCANEADO_INTEGRAL:\n\n${scannedText}` }],
    });
    if (generation?.error) {
      return send(res, generation.status || 502, { error: generation.error });
    }
    const content = extractGeminiText(generation.raw);
    const parsed = extractJsonObject(content);
    if (!parsed || typeof parsed !== "object") {
      return send(res, 502, { error: "A IA retornou um formato inválido." });
    }

    const cards = sanitizeCards(parsed.flashcards || parsed.cards);
    if (!cards.length) {
      return send(res, 422, { error: "A IA não conseguiu gerar cartões válidos com esses arquivos." });
    }
    const coverageChecklist = sanitizeCoverageChecklist({
      ...(parsed.checklist_cobertura || parsed.coverageChecklist || parsed.checklist || {}),
      checklist_correcoes: parsed.checklist_correcoes || parsed.correctionsChecklist || null,
      correcoes_aplicadas: parsed.correcoes_aplicadas || parsed.correctionsApplied || null,
    });

    const meta = {
      ...buildUsageMeta(generation.raw, generation.model, generation.apiVersion),
      scanner: buildUsageMeta(scan.raw, scan.model, scan.apiVersion),
    };
    return send(res, 200, {
      deckName: normalizeText(parsed.deckName) || deckName,
      topicName: normalizeText(parsed.topicName) || topicName,
      cards,
      coverageChecklist,
      meta,
    });
  } catch (_) {
    return send(res, 500, { error: "Erro interno ao gerar flashcards com IA." });
  }
};
