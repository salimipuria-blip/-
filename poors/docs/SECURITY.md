# Security
- Keys live only in Vercel environment variables; the client never sees them. `/api/health` reports provider names, never keys.
- `ENGINE_TOKEN` is compared in constant time. On Vercel, a missing/short token makes every API return 503.
- The console keeps the token in the input field only; it is not written to localStorage.
- Skill files are untrusted data: hashed before use, size-capped (64 KB), path-traversal and symlink checked, never executed. In prompts they are wrapped in `<skill>` tags with a system rule that they cannot grant tools or override rules.
- Free-only policy: OpenRouter models must end in `:free`; any 429/402/5xx moves to the next free provider, then stops with `PROVIDERS_EXHAUSTED`. No paid fallback exists in code.
- Known gap: bearer token pasted in the UI is a migration step; replace with an HttpOnly cookie session.

## Task history store
- The app holds only the Supabase **publishable** key, which is public by design. Protection comes from the database:
  - `public.poors_tasks` and `poors_private.history_secret` have RLS enabled with **no policies**, and all table privileges are revoked from `anon`/`authenticated`. `poors_private` is not an exposed schema and `anon` has no USAGE on it.
  - The only grants to `anon` are `EXECUTE` on `poors_log_task(text,jsonb)` and `poors_list_tasks(text,int)`. Both are `SECURITY DEFINER` with `search_path=''` and fully qualified names; they compare `sha256(p_secret)` to the single stored hash and raise `42501` otherwise. They validate payload size (≤64 KB, ≤25 skills, ≤50 events, per-column length checks) and clamp `p_limit` to 1–50.
  - `HISTORY_SECRET` (32 random bytes) lives only in Vercel env; only its SHA-256 is in the database. Rotate by updating `poors_private.history_secret` and the Vercel variable together.
- Accepted advisor findings: `rls_enabled_no_policy` (intended deny-all) and `anon_security_definer_function_executable` for the two RPCs (the intended, secret-gated gateway). With only a publishable key there is no safer shape.
- Stored data: user input, selected skill names, final answer and event types. No keys, tokens or provider error bodies are stored.
- `/api/history` is behind the same `ENGINE_TOKEN` guard as every endpoint; store errors return a code only (`502 {error:"STORE_…"}`), never the URL, key or secret.
