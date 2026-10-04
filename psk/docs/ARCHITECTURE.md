# Architecture
`public/` static site → `api/*.js` Vercel Functions (stateless, ≤60 s) → `engine/router.mjs` (registry + verified bodies, loaded once per cold start, ~0.7 s) → `engine/providers.mjs` (free-tier OpenAI-compatible chat, failover).

V3 compatibility: same endpoints and request shapes. Changes: `/api/health` adds `skillContent` and a `provider.providers` list; `answer` mode now calls a free provider instead of always failing; failure codes are `NO_PROVIDER_CONFIGURED`, `PROVIDERS_EXHAUSTED`, `PROVIDER_REJECTED`, `SKILL_CONTENT_MISSING`.

Not used: a local daemon, local models (owner laptop has 4 GB RAM), or any always-on process. freelm (MIT) was reviewed; its failover design was adopted in ~80 lines instead of adding a 6-star dependency, and its in-memory quota state would not survive serverless cold starts anyway.

## Durable task history (Supabase free tier)
`api/tasks.js` → `api/_store.mjs` `logTask()` → `POST {SUPABASE_URL}/rest/v1/rpc/poors_log_task` (built-in fetch, 3 s timeout, headers `apikey` + `Authorization: Bearer <publishable key>`). `GET /api/history?limit=1..50` (same `guard()` as every endpoint) → `listTasks()` → `rpc/poors_list_tasks`, newest first.

- Schema: `supabase/migrations/20261004000000_poors_task_history.sql`. Table `public.poors_tasks` (id, created_at, mode, input ≤4000, status, error_code, selected_skills jsonb (top 8 stored), result_kind, answer ≤20000, provider, model, events jsonb ≤50). The RPC keeps only the newest 5,000 rows.
- Best effort: persistence runs after the task has finished, inside the same invocation. The response carries `persisted:true`, or `persisted:false` + `persistReason` (`STORE_DISABLED`, `STORE_DENIED`, `STORE_TIMEOUT`, `STORE_UNREACHABLE`, `STORE_HTTP_<n>`, `STORE_BAD_RESPONSE`). A storage failure never changes the task `status`.
- Disabled unless `SUPABASE_URL` (https), `SUPABASE_PUBLISHABLE_KEY` and `HISTORY_SECRET` are all set; then `/api/history` returns `{enabled:false}` and nothing else changes.
- `storeStatus()` (exported from `api/_store.mjs`) returns `{enabled, backend, reason?}` without URL/key/secret, ready to be wired into `/api/health`.
