---
name: frontend-design
description: Makes Claude design structure, appearance and UX before coding, producing modern, professional, user-focused outputs instead of clichéd generic interfaces. Use before building any frontend/UI.
---

# Frontend Design (design-first, anti-generic)

Prevent generic "AI look" UIs. Design first, then code.

## Phase 1 — Design system brief (before any code)
1. **Purpose & audience** — what user goal does this screen serve?
2. **Aesthetic direction** — commit to ONE strong direction (name it): e.g. "refined brutalism", "editorial luxury", "playful retro", "minimal Japanese", "industrial mono". Reject the default SaaS look.
3. **Tokens** — define palette (distinct, not default blue), type pairing (display + body, non-Inter family when possible), spacing scale, radius, shadows, motion rules.
4. **Signature element** — one memorable detail per project (cursor, transition, typographic moment, texture).
5. **Layout idea** — asymmetric or grid-breaking compositions when appropriate.

## Phase 2 — Build
- Framework per project (React/Next, Vue or static HTML+Tailwind); component structure first, then pages.
- States for every component: hover, active, focus, disabled, loading, empty, error.
- Real microcopy, realistic data, responsive (mobile-first), accessible (WCAG AA).

## Quality bar
- No purple-gradient hero, no 3-columns-of-icons feature sections, no emoji bullets.
- Typography does the heavy lifting; spacing is generous and consistent.
- Would a designer post this on their portfolio? If not, iterate.

## Output
Design brief + full implementation + a checklist confirming tokens, states and responsiveness.
