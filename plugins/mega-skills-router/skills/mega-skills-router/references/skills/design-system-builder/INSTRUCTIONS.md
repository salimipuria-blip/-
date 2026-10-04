---
name: design-system-builder
description: Create complete design systems with tokens, scales, components and documentation. Use when establishing consistent UI foundations for a product.
---

# Design System Builder

Build or extend a coherent design system.

## Scope
1. **Tokens** — color (primitive + semantic), type scale (modular ratio), spacing scale (4pt base), radius, elevation, motion, breakpoints.
2. **Naming** — clear conventions: `--color-surface-raised`, `text-title-lg`, `space-4`.
3. **Core components** — button, input, select, card, modal, toast, nav, table, badge, avatar, skeleton. Each with variants + all states.
4. **Patterns** — forms, lists, dialogs, empty states, error handling.
5. **Docs** — usage rules, do/don't examples, accessibility notes per component.

## Method
- Start from tokens; never hardcode values in components.
- Deliver as CSS custom properties / Tailwind theme / JSON tokens (+ optional Figma variable mapping).
- Version changes semantically (breaking/minor/patch).

## Output
Token files, component specs with states, and a one-page usage guideline.
