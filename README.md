# Integral ENEM

Plataforma web de estudos para o ENEM: banco de questões, listas personalizadas, flashcards, simulados, cronograma/calendário e um painel de acompanhamento de desempenho.

Este é meu primeiro projeto público de maior porte. Construí toda a interface em **HTML, CSS e JavaScript puros** — na época ainda não tinha experiência suficiente com frameworks para estruturar o projeto em cima de um, então optei por entender a fundo a plataforma web nativa antes de abstrair essa camada. O foco de aprendizado foi principalmente em:

- **Infraestrutura de cache de dados**: um mirror local em IndexedDB que mantém a aplicação funcional offline/com latência baixa, sincronizado com o backend por uma fila de eventos (padrão *outbox*) em vez de escrever direto no banco a cada interação.
- **SQL e modelagem de dados**: schema relacional no Postgres (via Supabase), com Row Level Security controlando o acesso por usuário direto no banco.
- **Sobrecarga de requisições e fluxo de dados**: a fila de sincronização agrupa mudanças em lotes por tamanho (bytes/quantidade de eventos), aplica backoff exponencial com limite de tentativas e deduplica/coalesce eventos redundantes antes de enviar — evitando disparar uma requisição a cada tecla digitada ou clique.

Também foi o primeiro projeto em que usei IA (Codex e Claude) como copiloto de desenvolvimento de forma deliberada — não para escrever features no automático, mas para entender arquitetura, discutir trade-offs de design e aprender a conduzir um projeto inteiro através de prompts bem definidos.

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
