---
name: nothing-design
description: Design minimal, monochromatic user interfaces inspired by Nothing's industrial design language with a modern and distinctive look. Use for minimal monochrome UI design.
---

# Nothing Design (Minimal Mono UI)

Design interfaces in Nothing's industrial language: monochrome, mechanical, dot-matrix charm.

## Visual language
- **Palette** — black (#000), white (#fff), greys (#1a1a1a, #2b2b2b, #808080), one signature red accent (#ff3b30) used sparingly (record-like states, key CTAs).
- **Typography** — monospaced or dot-matrix style for numerals/labels ("5X Dots" vibe); clean geometric sans for body; uppercase micro-labels with wide letter-spacing.
- **Texture** — visible "engineering": module frames, screws/ticks as micro-details, exposed grid lines, subtle noise.
- **Iconography** — outlined, 1.5px strokes, geometric, glyph-like.
- **Layout** — strict grids, rounded cards (r=16-24px) floating on dark surfaces, negative space as a feature.
- **Motion** — mechanical, snappy (120-240ms), metered/segmented animations like physical gauges; LED-like blinking indicators.

## Rules
- Max 1 accent hue; never use gradients or drop shadows heavier than hairline glows.
- Every element must look manufactured, not drawn.
- Dark mode is the canonical mode; light mode = inverted, same rules.

## Output
HTML/CSS (or Tailwind) components + a brief style-token sheet (colors, radius, type scale).
