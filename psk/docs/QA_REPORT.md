# QA report (2026-10-04, cloud container, Node 22)

## npm run check && npm test
```
check: OK
ok 1 - cloud auth: rejects missing token and fails closed in production without configuration
ok 2 - registry counts, verified skill bodies and Persian routing are genuine
ok 3 - plan returns verified skill content; answer without provider fails honestly
ok 4 - answer uses the free provider with failover and never invents output
ok 5 - OpenRouter is refused unless the model is a :free model
ok 6 - invalid methods, modes and oversized requests rejected
ok 7 - tampered skill body is rejected by the integrity check
# pass 7
# fail 0
```

## Browser (Playwright Chromium, iPhone 13 emulation, local dev server)
- Page loads, no horizontal overflow (scrollWidth − innerWidth = 0).
- Token entered → health shows 3,000 skills · 3,000 verified bodies · no free model.
- «برای کافه‌ام یک پوستر اینستاگرام طراحی کن» → top skills: poster-generator-skill, nuts-poster-analyzer, saffron-poster-analyzer (all verified).
- Answer mode without a key → NO_PROVIDER_CONFIGURED with the ready skills listed.
- Only console error: the expected 401 from the first health call before a token is entered.
- External fonts were blocked in this test, so system fallback fonts were used.

## Not tested
- Real Safari on a physical iPhone, a live free provider call, and Vercel deployment (see README).

## Vercel deployment (2026-10-04)
- Project `psk-3000` (team PS, Hobby), root `psk`, deployment `dpl_3bQixMjDyoePvdBxKWoHpLDthJ5y` → READY.
- `https://psk-3000.vercel.app/` → 200, V4 HTML served.
- `/api/health` without a token → 401 (expected: function loaded, token guard active; a missing token would give 503).
- Authenticated API calls were not run from the build container: its network policy blocks `*.vercel.app`. Run them from the site's «موتور ۳۰۰۰» panel.
