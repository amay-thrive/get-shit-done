# Sundial OS

The internal operating system for **Sundial Studio** — a venture studio building
vertical AI businesses in performance, health, wellness, and education.

An event-sourced, AI-native management platform: CRM, projects, invoicing,
Notion-style workspace, kanban tasks, and a fleet of autonomous AI agents with
human-in-the-loop approvals — all on a zero-ops serverless stack.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), TypeScript strict |
| Database / Auth / Realtime / Vectors | Supabase (Postgres + pgvector) |
| API | tRPC v11 (end-to-end type safety) |
| AI runtime | Vercel AI SDK + Anthropic Claude (tool use) |
| Editor | BlockNote (Notion-style blocks) |
| UI | Tailwind CSS v4, dnd-kit, TanStack Table, cmdk, lucide |
| Hosting | Vercel (serverless + cron) |

## Architecture in 60 seconds

- **Event spine** — every business action is an immutable row in `events`.
  Agents subscribe to event types; the dashboard streams the feed via
  Supabase Realtime. See `src/server/events.ts`.
- **Agent runtime** — declarative agent definitions (DB) + typed tools (code).
  The orchestrator (`src/server/agents/runtime/orchestrator.ts`) runs a
  Claude tool-use loop, checkpointing every step to `agent_steps` for a
  live forensic timeline. Outbound actions (email) are **approval-gated**:
  they queue in `approvals` for one-click human decision.
- **Semantic memory** — agents store/recall memories in `memories`
  (pgvector, HNSW). Workspace documents are auto-embedded on save, so
  agents can search everything the team writes (`docs.search` tool).
- **Cost telemetry** — every run records tokens + cost in integer
  microdollars. See the Usage page.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

Required env (see `.env.example` for the full annotated list):

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SECRET_KEY` — server-side service role (never expose to client)
- `ANTHROPIC_API_KEY` — powers the agents
- `CRON_SECRET` — protects the Vercel cron endpoint
- `OPENAI_API_KEY` — optional; enables semantic (vs keyword) memory search

## Database

Migrations live in `supabase/migrations/`. Apply them in order in the
Supabase SQL editor (or via the Supabase CLI). `0001` is the core schema
(applied to the live project already); `0002` adds workspace tasks +
document search.

Types in `src/lib/supabase/database.types.ts` are generated from the live
schema — regenerate after any migration (`supabase gen types typescript`).

## Deployment

Vercel project with root directory = this repo. `vercel.json` configures
the daily agent-scheduler cron (Hobby plan allows daily; on Pro, switch to
`*/15 * * * *` and set `SCHEDULER_WINDOW_MINUTES=15`).

## Roadmap

1. HubSpot CRM integration (sync + agent tools + webhooks)
2. Zoho Books + quarterly IFRS/UAE-VAT tax-prep agent
3. UI depth pass (detail pages, charts, pipeline board)
4. Google Calendar + Gmail (OAuth, approval-gated agent actions)
5. Marketing agents (content → approval → Meta Graph API posting)
