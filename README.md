# Integral ENEM

A study platform for the ENEM (Brazil's national college entrance exam): question bank, custom question lists, flashcards, mock exams, a study calendar, and a dashboard to track progress.

This is my first bigger public project. I built the whole interface in **plain HTML, CSS and JavaScript** — at the time I didn't have enough experience with frameworks to structure a project on top of one, so I chose to actually learn the native web platform before abstracting that layer away. What I focused on learning:

- **Data caching**: a local IndexedDB mirror that keeps the app usable offline / with low latency, synced to the backend through an event queue (outbox pattern) instead of writing straight to the database on every interaction.
- **SQL and data modeling**: a relational schema in Postgres (via Supabase), with Row Level Security controlling per-user access at the database level. This was also my first project using Supabase, and the biggest lesson was realizing that the database is technically "exposed" — the API URL and anon key are public and reachable by anyone — but that doesn't mean it's insecure. Real security comes from the access rules you define inside the database itself (RLS policies), not from hiding the connection details.
- **Request overload and data flow**: the sync queue batches changes by size (bytes/event count), applies exponential backoff with a retry limit, and dedupes/coalesces redundant events before sending — instead of firing a request on every keystroke or click.

This was also the first project where I used AI (Codex and Claude) as a dev copilot on purpose — not to auto-generate features, but to understand architecture, discuss design trade-offs, and learn how to steer a whole project through well-written prompts.

## Features

- **Question bank** — search and filter by subject, year, exam format and difficulty, with custom PDF list generation.
- **Flashcards** — decks organized by subject/topic/subtopic, with automatic card generation from PDFs/images using the Google Gemini API (currently disabled in production, see [Live demo](#live-demo)).
- **Mock exams** — logs results per day (Languages + Humanities / Math + Sciences) and ranks performance level.
- **Calendar and journey** — an interactive personal schedule built directly on top of the official [ENEM Reference Matrix](https://download.inep.gov.br/enem/outros_documentos/enem_matriz_de_referencia_v1.pdf) (INEP), mapping study plans to the actual competencies and skills the exam evaluates, instead of a generic to-do list.
- **Dashboard** — combined metrics: questions answered, accuracy rate, study hours, and progress per subject.

## Live demo

**[app.integralenem.com.br](https://app.integralenem.com.br)**

You can log in with a test student account to explore the app:

```
email:    teste@admin.com.br
password: 12345678!
```

This is a real (non-admin) account on a shared environment, so please be respectful with it — data may be reset from time to time. AI-powered flashcard generation is currently disabled in production (the Gemini API key was removed), so that specific feature won't work in the live demo — everything else is fully functional.

## Behind the scenes

The student-facing app you see here is only half of the picture. Content (questions, flashcard topics, etc.) is fed into the same Supabase database by a separate internal admin panel — **admin.integralenem.com.br** — that isn't open source. It's restricted to admin accounts through Supabase Auth and is where the actual content pipeline lives, decoupled from the public-facing app in this repo.

## Stack

- **Frontend**: plain HTML/CSS/JavaScript, with TypeScript modules for the local persistence layer (`src/`).
- **Local persistence**: IndexedDB as cache/mirror, with a sync queue (outbox pattern) to the backend.
- **Backend**: [Supabase](https://supabase.com) (Postgres + Auth + Row Level Security + Storage).
- **Serverless functions**: [Vercel](https://vercel.com) (`api/`), including the Google Gemini API integration for flashcard generation.

## Running locally

Requirements: Node.js and a [Supabase](https://supabase.com) account.

```bash
npm install
npm run serve   # starts the dev environment through the Vercel CLI
```

Create a `.env.local` file in the project root with the variables below (or set the same keys in the Vercel dashboard, under Settings → Environment Variables):

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public anon key |
| `GEMINI_API_KEY` | Google Gemini API key (flashcard generation) — optional, only needed for that feature |

## License

See the [LICENSE](./LICENSE) file.
