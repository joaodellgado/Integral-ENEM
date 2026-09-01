# Integral ENEM

A study platform for the ENEM (Brazil's national college entrance exam): question bank, custom question lists, flashcards, mock exams, a study calendar, and a dashboard to track progress.

This is my first bigger public project. I built the whole interface in **plain HTML, CSS and JavaScript** — at the time I didn't have enough experience with frameworks to structure a project on top of one, so I chose to actually learn the native web platform before abstracting that layer away. What I focused on learning:

- **Data caching**: a local IndexedDB mirror that keeps the app usable offline / with low latency, synced to the backend through an event queue (outbox pattern) instead of writing straight to the database on every interaction.
- **SQL and data modeling**: a relational schema in Postgres (via Supabase), with Row Level Security controlling per-user access at the database level.
- **Request overload and data flow**: the sync queue batches changes by size (bytes/event count), applies exponential backoff with a retry limit, and dedupes/coalesces redundant events before sending — instead of firing a request on every keystroke or click.

This was also the first project where I used AI (Codex and Claude) as a dev copilot on purpose — not to auto-generate features, but to understand architecture, discuss design trade-offs, and learn how to steer a whole project through well-written prompts.

## Features

- **Question bank** — search and filter by subject, year, exam format and difficulty, with custom PDF list generation.
- **Flashcards** — decks organized by subject/topic/subtopic, with automatic card generation from PDFs/images using the Google Gemini API.
- **Mock exams** — logs results per day (Languages + Humanities / Math + Sciences) and ranks performance level.
- **Calendar and journey** — weekly study planning and progress tracking over time.
- **Dashboard** — combined metrics: questions answered, accuracy rate, study hours, and progress per subject.

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
| `GEMINI_API_KEY` | Google Gemini API key (flashcard generation) |

## License

See the [LICENSE](./LICENSE) file.
