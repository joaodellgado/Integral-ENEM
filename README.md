# Integral ENEM

Plataforma web de estudos para o ENEM: banco de questões, listas personalizadas, flashcards, simulados, cronograma/calendário e um painel de acompanhamento de desempenho.

## Funcionalidades

- **Banco de questões** — busca e filtro por disciplina, ano, modalidade e dificuldade, com geração de listas personalizadas em PDF.
- **Flashcards** — decks organizados por disciplina/tópico/subtópico, com geração automática de cartões a partir de PDFs/imagens usando a API do Google Gemini.
- **Simulados** — registro de resultados por dia (Linguagens + Humanas / Matemática + Natureza) e classificação por nível de desempenho.
- **Calendário e jornada** — planejamento semanal de estudos e acompanhamento de progresso ao longo do tempo.
- **Painel geral** — métricas consolidadas: questões respondidas, taxa de acerto, horas de estudo e evolução por disciplina.

## Stack

- **Frontend**: HTML/CSS/JavaScript puro, com módulos TypeScript para a camada de persistência local (`src/`).
- **Persistência local**: IndexedDB como cache/mirror, com fila de sincronização (padrão outbox) para o backend.
- **Backend**: [Supabase](https://supabase.com) (Postgres + Auth + Row Level Security + Storage).
- **Funções serverless**: [Vercel](https://vercel.com) (`api/`), incluindo a integração com a API do Google Gemini para geração de flashcards.

## Rodando localmente

Pré-requisitos: Node.js e uma conta no [Supabase](https://supabase.com).

```bash
npm install
npm run serve   # inicia o ambiente via Vercel CLI
```

Crie um arquivo `.env.local` na raiz do projeto com as variáveis abaixo (ou configure as mesmas chaves no dashboard da Vercel, em Settings → Environment Variables):

| Variável | Descrição |
| --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima pública do Supabase |
| `GEMINI_API_KEY` | Chave da API do Google Gemini (geração de flashcards) |

## Licença

Veja o arquivo [LICENSE](./LICENSE).
