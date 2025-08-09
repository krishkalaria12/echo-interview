## Echo Interviews

AI-powered interview recording, real-time assistance, automatic transcription, and rich post-call analysis with searchable transcripts and follow-up chat.

### Highlights
- **AI interview agent**: Generates role- and level-aware instructions and joins calls as a realtime assistant.
- **Transcription + recording**: Automatically enabled on each call; transcript is processed into a summary and analysis.
- **Post-call QA chat**: Ask questions about the interview; answers are grounded in the generated summary and context.
- **Type-safe full stack**: Next.js App Router, tRPC v11, Drizzle ORM, Zod validation, TanStack Query.

## Tech Stack
- **Web**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI
- **Auth**: better-auth (email/password + Google/GitHub OAuth)
- **Data**: PostgreSQL (Neon), Drizzle ORM + drizzle-kit
- **RPC/Data fetching**: tRPC v11 + @tanstack/react-query v5
- **Media & chat**: Stream Video (calls, recording, transcription) and Stream Chat (post-call chat)
- **Background jobs**: Inngest
- **AI**: LangChain + Google Gemini 2.5 (via @langchain/google-genai and OpenAI-compatible endpoint for chat)

## Quick Start
1) Clone and install
```bash
pnpm install
# or: npm install / yarn / bun
```

2) Configure environment variables
- Copy `env-example` to `.env` and fill in values (see the Environment section below).

3) Create database schema (Neon or any Postgres)
```bash
pnpm db:push
# optional visual studio
pnpm db:studio
```

4) Run the dev server
```bash
pnpm dev
# open http://localhost:3000
```

5) (Optional) Expose a public URL for webhooks during local dev
```bash
pnpm dev:webhook
# then configure your Stream Video/Chat webhook to point to: https://<your-ngrok-domain>/api/webhook
```

## Environment
Set these in `.env` (see `env-example` for the full list):

- **DATABASE_URI**: Postgres connection string (e.g., Neon)
- **BETTER_AUTH_SECRET**: Secret for better-auth
- **BETTER_AUTH_URL**: Public base URL for auth callbacks (e.g., http://localhost:3000 or your prod domain)
- **GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET**: OAuth credentials
- **GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET**: OAuth credentials
- **NEXT_PUBLIC_APP_URL**: Public base URL used on the client
- **NEXT_PUBLIC_STREAM_VIDEO_API_KEY / STREAM_VIDEO_SECRET_KEY**: Stream Video API keys
- **NEXT_PUBLIC_STREAM_CHAT_API_KEY / STREAM_CHAT_SECRET_KEY**: Stream Chat API keys
- **OPENAI_API_KEY**: Used to connect Stream Video’s realtime agent bridge
- **GEMINI_API_KEY**: Used by LangChain (analysis + profile enrichment) and OpenAI-compat chat calls

Notes:
- `src/ai/*` prefer `GEMINI_API_KEY` but also accept `GOOGLE_API_KEY`.
- Webhook signature verification uses the Stream Video server secret configured in `src/lib/stream-video.ts`.

## Architecture Overview
Flow of an interview lifecycle:
1) **Create interview** via UI
   - Persists to `interviews` table and creates a Stream Video call with recording + transcription auto-on
   - Creates an `agents` row with role-aware instructions (see `src/lib/system-prompt.ts`)
   - Sends an Inngest event `interviews/profile.enrich` to augment the agent prompt from resume/links
2) **Join call**
   - Client requests a Stream Video token through tRPC and joins the call
3) **Realtime agent**
   - On `call.session_started` webhook, the server connects an AI agent to the call (`connectOpenAi`) and updates its session instructions
4) **End of call**
   - On `call.session_ended`, status moves to `processing`
5) **Transcription ready**
   - On `call.transcription_ready`, transcript URL is saved and Inngest event `interviews/processing` is fired
6) **Summarization + analysis** (Inngest)
   - `interviews/processing`: builds a readable summary and marks the interview `completed`
   - `interviews/analysis`: computes scores, strengths, improvements, feedback and updates DB
7) **Post-call chat**
   - Stream Chat channel is created per interview; user messages trigger the webhook `message.new`
   - The server answers using Gemini, grounded in the stored summary and original agent instructions

## Data Model
- **Auth** (`src/db/schemas/auth.schema.ts`): `user`, `session`, `account`, `verification`
- **Interviews** (`src/db/schemas/interview.schema.ts`):
  - Core fields: `id`, `name`, `userId`, `position`, `experienceLevel`, `interviewType`, `scheduledFor`
  - Links: `resumeUrl`, `portfolioUrl`, `githubUrl`, `linkedinUrl`
  - Status/timing: `status`, `startedAt`, `endedAt`
  - Media: `transcriptUrl`, `recordingUrl`
  - Results: `overallScore`, `feedback`, `strengths`, `improvements`, `recommendation`, `summary`
- **Agents** (`src/db/schemas/agent.schema.ts`): one per interview with generated `instructions`

## API (tRPC)
Defined in `src/modules/interviews/server/procedures.ts` and wired in `src/trpc/routers/_app.ts`.
- **interviews.generateToken()**: Stream Video user token
- **interviews.generateChatToken()**: Stream Chat user token
- **interviews.create(input)**: Create interview, Stream call, agent; fire profile enrichment event
- **interviews.update(input)**: Update interview
- **interviews.remove({ id })**: Delete interview
- **interviews.getOne({ id })**: Fetch one
- **interviews.getMany({ page, pageSize, search, status })**: Paginated list (includes computed `duration`)
- **interviews.getTranscript({ id })**: JSONL transcript enriched with speaker names/avatars

Context & protection:
- `protectedProcedure` checks session via better-auth (`src/trpc/init.ts`)
- Server utilities: `src/trpc/server.tsx` sets up SSR-friendly QueryClient + proxy

## Webhooks (`src/app/api/webhook/route.ts`)
Accepts Stream events and routes behavior:
- `call.session_started`: mark active; connect realtime AI agent and set agent instructions
- `call.session_participant_left`: end call
- `call.session_ended`: mark `processing`
- `call.transcription_ready`: save transcript URL; send `interviews/processing` (Inngest)
- `call.recording_ready`: save recording URL
- `message.new` (Stream Chat): respond with Gemini grounded in the interview summary

Headers expected:
- `x-signature`: Stream signature (verified using the Stream SDK)
- `x-api-key`: presence is required (you can enhance by validating against your own secret)

## Background Jobs (Inngest) (`src/inngest/functions.ts`)
- **interviews/processing**: fetch + parse transcript, enrich speakers, summarize, mark completed
- **interviews/profile.enrich**: build candidate profile from resume/GitHub/LinkedIn/portfolio and append to agent prompt
- **interviews/analysis**: deep analysis (scores, feedback, recommendation)

## UI & Feature Walkthrough
- **Auth**
  - Views: `src/modules/auth/ui/views/sign-in-view.tsx`, `sign-up-view.tsx`
  - Server routes: `src/app/api/auth/[...all]/route.ts`
- **Dashboard**
  - Shell: `src/app/(dashboard)/layout.tsx` with sidebar/navbar
  - Sidebar/Nav: `src/modules/dashboard/ui/components/*`
- **Interviews**
  - List page: `src/app/(dashboard)/interviews/page.tsx` (SSR prefetch + hydration)
  - List view: `src/modules/interviews/ui/views/interviews-view.tsx` with filters and pagination
  - Columns: `src/modules/interviews/ui/components/columns.tsx`
  - Create/Update: `new-interview-dialog.tsx`, `update-interview-dialog.tsx`, shared `interview-form.tsx`
  - Detail page: `src/app/(dashboard)/interviews/[interviewId]/page.tsx`
  - Detail view: `interview-id-view.tsx` switches by status to `upcoming`, `active`, `processing`, `completed`, `cancelled`
  - Completed views include: `summary-header.tsx`, `transcript.tsx`, `score-card.tsx`, `competency-radar.tsx`, and post-call `chat-provider.tsx`/`chat-ui.tsx`
- **Calls**
  - Route: `src/app/call/[interviewId]/page.tsx`
  - Connect + token: `call-provider.tsx` → `call-connect.tsx` (creates `StreamVideoClient`, joins call)
  - In-call UI: `call-ui.tsx` → `call-lobby.tsx`, `call-active.tsx`, `call-ended.tsx`

## Development Notes
- **Type-safety**: Zod schemas (`src/modules/interviews/schemas.ts`) validate inputs. DB schema is typed via Drizzle.
- **SSR + hydration**: Pages prefetch with `getQueryClient` and dehydrate; client uses `useSuspenseQuery`.
- **Prompts & AI**: System prompt builder in `src/lib/system-prompt.ts`. Post-call chat instructions in `src/lib/chat-instructions.ts`.
- **Drizzle**: Config in `drizzle.config.ts`, client in `src/db/index.ts`. Run `pnpm db:push` to sync schema.

## Scripts
- **dev**: start Next.js with Turbopack
- **build / start**: build and run production server
- **lint**: run ESLint
- **db:push**: push Drizzle schema to DB
- **db:studio**: open Drizzle studio
- **dev:webhook**: run ngrok to expose `http://localhost:3000` (update the URL or your reserved domain as needed)

## Deployment
- Host on your platform of choice (e.g., Vercel). Set all required env vars.
- Update OAuth callback URLs in Google/GitHub to your production domain.
- Configure Stream Video/Chat webhooks to `https://<your-domain>/api/webhook` and ensure secrets match.

## Troubleshooting
- **401 from tRPC**: ensure you are signed in; verify OAuth secrets; set `BETTER_AUTH_URL`.
- **Webhook signature invalid**: verify Stream server secret and that your webhook URL points to `/api/webhook`.
- **No AI responses**: set `GEMINI_API_KEY`; for realtime agent, also set `OPENAI_API_KEY`.
- **Chat not loading**: set Stream Chat API keys and ensure `generateChatToken` is reachable.
- **DB errors**: check `DATABASE_URI` and that `pnpm db:push` completed successfully.
