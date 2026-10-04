# Skill audit (2026-10-04)

All 3,000 bodies pass the SHA-256 check. That proves they are the audited files, not that they are useful.

**1,650 (55%) are templated derivatives**: the body is the same boilerplate with a business type and a keyword swapped in (marker: «مشتق رابطه‌محور», and «برای حوزهٔ …» in triggers/description). **1,350 are hand-written** (median body 1.1 KB).

The router already scores templated skills at 0.82× (measured: removing the penalty drops gold-set train hit@5 from 1.000 to 0.966). They are kept, not deleted, because they still catch niche requests (e.g. "dental export").

| domain | total | hand-written | templated |
|---|---|---|---|
| travel-outdoors | 438 | 190 | 248 |
| business-sales | 354 | 159 | 195 |
| prompt-requirements | 329 | 153 | 176 |
| social-media | 233 | 113 | 120 |
| agents-automation | 236 | 101 | 135 |
| knowledge-research | 248 | 98 | 150 |
| skill-development | 229 | 94 | 135 |
| web-development | 130 | 61 | 69 |
| general | 129 | 61 | 68 |
| graphic-design | 129 | 59 | 70 |
| data-spreadsheets | 124 | 55 | 69 |
| product-design | 108 | 53 | 55 |
| image-ai | 103 | 53 | 50 |
| video-ai | 112 | 52 | 60 |
| content-writing | 98 | 48 | 50 |

## Recommended next step
Replace each domain's templated set with one parameterised skill per domain (15 skills) that takes the business type as input, then re-run `npm run eval`; keep the change only if hit@5 and the holdout score do not drop.

Reproduce: `record.templated` in `engine/router.mjs`; the body marker is checked in this audit with `/مشتق رابطه‌محور/`; both give the same 1,650 skills.
