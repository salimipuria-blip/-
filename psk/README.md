# POORS / ALGORITHME 3000 — V4 engine

iPhone-first Persian site plus a serverless engine on Vercel. Nothing here needs a laptop, PowerShell or a running local process.

## What works today (tested)
- **Router**: 3,000 skills, 15,000 triggers, IDF-weighted Persian/English matching with Persian→English bridges and suffix stemming.
- **Verified skill bodies**: all 3,000 `SKILL.md` files ship in `data/skills/`. 2,990 match the registry SHA-256 id exactly; 10 had their frontmatter mechanically repaired and are accepted only via the hash allowlist in `data/skills-repaired.json`. A changed file is rejected.
- **Plan mode**: route + the verified instructions of the chosen skills.
- **Answer mode**: sends the request with the top 3 verified skills to a **free-tier** model (Groq, Cerebras, Google AI Studio, OpenRouter `:free`) with failover. With no key configured it fails with `NO_PROVIDER_CONFIGURED` and still returns the ready skills. It never falls back to a paid route.

## Also in place
- Public story in the V4 order with all 30 frames (`docs/FRAME_MAP.json`).
- Login via HttpOnly cookie, task history in Supabase (free tier), installable PWA.
- Router gold set + CI (`npm run eval`): hit@5 0.979 overall, 0.947 on held-out queries.

## Not done yet
MCP/tool execution, image generation, replacing the 1,650 templated skills (`docs/SKILL_AUDIT.md`). See `docs/FEATURE_STATUS.json`.

## Deploy from iPhone
1. Vercel → Add New → Project → import GitHub repo `salimipuria-blip/-`, **Root Directory `psk`** (project `psk-3000`), framework **Other**.
2. Settings → Environment Variables: `ENGINE_TOKEN` (24+ random chars). Optional: one or more free keys from `.env.example`. Use provider accounts **without billing** attached.
3. Redeploy. Open the site → «موتور ۳۰۰۰» → «ورود به موتور» with the token. It sets a 7-day HttpOnly cookie; the token is never stored in the browser.

Free keys (create on the phone, no card needed at the time of writing; check each site's current terms): Groq `console.groq.com/keys`, Google AI Studio `aistudio.google.com/apikey`, Cerebras `cloud.cerebras.ai`, OpenRouter `openrouter.ai/keys`.

## API
- `GET /api/health` — counts, verified skill bodies, which providers are configured (never keys).
- `GET /api/skills?q=` — ranked skills.
- `POST /api/tasks` `{input, mode: plan|answer}` — completes within one call.
- `POST/GET/DELETE /api/session` — login (cookie), status, logout; POST/DELETE need header `X-Requested-With: poors`.

Engine routes accept the session cookie or `Authorization: Bearer <ENGINE_TOKEN>` (for scripts). Without a token on Vercel they fail closed (503).

## Checks
`npm run check && npm test` · local preview: `ENGINE_TOKEN=... npm run dev` (port 3000).
