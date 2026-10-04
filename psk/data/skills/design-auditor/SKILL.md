---
name: design-auditor
description: Audit user interfaces against professional design principles including typography, spacing, accessibility and visual consistency, identifying weaknesses. Use when reviewing UI/screens/designs.
---

# Design Auditor

Perform a professional audit of a UI (screenshot, HTML/CSS, or live description) and return a severity-ranked report.

## Audit dimensions (score each 1-10)
1. **Visual hierarchy** — is the primary action obvious? Scan-path logic.
2. **Typography** — scale, line-height, measure (45-75ch), font pairing, weight contrast.
3. **Spacing & layout** — consistent spacing scale (4/8pt), alignment, grid integrity, whitespace.
4. **Color & contrast** — WCAG 2.2 AA (4.5:1 text / 3:1 large text & UI), palette cohesion.
5. **Accessibility** — focus states, touch targets >= 44px, alt text, keyboard flow, reduced motion.
6. **Consistency** — components reuse styles; states (hover/active/disabled/empty/error) designed.
7. **Content & microcopy** — clarity, labeling, error messages.

## Method
1. Extract the design tokens actually used (colors, fonts, spacing values).
2. Score each dimension with evidence (cite specific elements).
3. List findings as: `[SEVERITY: Critical/High/Medium/Low] issue → why it matters → concrete fix` (with code when possible).
4. End with a prioritized fix plan (P0/P1/P2) and an overall grade.

## Output
Markdown report: summary table of scores, findings list, quick wins, full fix plan.
