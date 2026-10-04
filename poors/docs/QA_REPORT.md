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
- Project `poors-3000` (team PS, Hobby), root `poors`, deployment `dpl_3bQixMjDyoePvdBxKWoHpLDthJ5y` → READY.
- `https://poors-3000.vercel.app/` → 200, V4 HTML served.
- `/api/health` without a token → 401 (expected: function loaded, token guard active; a missing token would give 503).
- Authenticated API calls were not run from the build container: its network policy blocks `*.vercel.app`. Run them from the site's «موتور ۳۰۰۰» panel.

## Router evaluation (2026-10-04, Node 22, cloud container)
Harness: `node scripts/eval-router.mjs [--json] [--show-holdout] [--router <file>] [--min-hit5 x]` over `tests/gold.jsonl`
(96 owner-style requests: 64 Persian, 17 Finglish, 15 English; expected skills chosen by reading the registry and SKILL.md
descriptions). The registry is loaded exactly like `api/_core.mjs` (verified bodies). Regression floor:
`tests/router-eval.test.mjs` (hit@5 ≥ 0.95, MRR ≥ 0.90, holdout hit@5 ≥ 0.89). CI: `.github/workflows/poors-ci.yml`.

Splits: 58 **train** (tuned on); 20 **holdout** written together with train but never inspected while tuning (their misses
are hidden unless `--show-holdout`); 18 **post-freeze** holdout queries (`"set":"post-freeze"`) written after the router was
frozen and scored once. Caveat: one author wrote the queries and the bridge/Finglish tables, so the 20-query holdout is
optimistic; the post-freeze set is the more honest generalization number.

| set | n | hit@1 | hit@3 | hit@5 | MRR | baseline hit@5 / MRR |
|---|---|---|---|---|---|---|
| overall | 96 | 0.917 | 0.979 | 0.979 | 0.945 | 0.667 / 0.591 |
| train | 58 | 0.931 | 1.000 | 1.000 | 0.963 | 0.707 / 0.633 |
| holdout (all) | 38 | 0.895 | 0.947 | 0.947 | 0.919 | 0.605 / 0.527 |
| holdout, post-freeze only | 18 | 0.833 | 0.889 | 0.889 | 0.857 | 0.611 / 0.602 |
| fa | 64 | 0.922 | 1.000 | 1.000 | 0.956 | 0.672 / 0.580 |
| finglish | 17 | 0.882 | 0.941 | 0.941 | 0.912 | 0.529 / 0.546 |
| en | 15 | 0.933 | 0.933 | 0.933 | 0.939 | 0.800 / 0.687 |

Latency: route p95 ≈ 5 ms (baseline ≈ 4.6 ms); cold registry load incl. SHA-256 of 3,000 SKILL.md ≈ 0.65 s (baseline ≈ 0.52 s).
Remaining misses (both post-freeze): «nazarsanji az moshtariha» (Finglish word missing from the table) and
"monthly cash flow forecast spreadsheet" (`cashflow` is one word in the skill name).

Router changes, with train hit@1 / hit@5 when each is removed (full model: 0.931 / 1.000): field weighting
name > triggers > description (0.914 / 1.000); name-subject coverage bonus (0.776 / 0.948); bigram matching incl. ZWNJ
compounds (0.879 / 0.983); 0.82× penalty on domain-templated derivative skills such as `cafe-slogan-workflow`
(0.879 / 0.966). Also: Persian normalization (Persian digits, ة, ZWNJ compounds → joined form + parts), vocabulary-aware
suffix/prefix stripping and compound splitting at query time, colloquial → written forms, a Finglish → Persian table,
more Persian → English bridges, and per-word concept groups so stems/aliases never double-count. The old hand-written
domain priors are kept at half strength (removing them changed one train query).
