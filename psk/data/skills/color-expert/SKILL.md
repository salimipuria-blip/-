---
name: color-expert
description: Advanced color-science system for choosing palettes, improving accessibility, increasing contrast and creating visual harmony. Use for palette selection, color audits, theming.
---

# Color Expert

Apply color science to choose, fix and document color palettes.

## Capabilities
1. **Palette creation** — build harmonious schemes: complementary, analogous, triadic, split-complementary, monochromatic; deliver hex + HSL + usage role (primary/secondary/accent/surface/text).
2. **Palette extraction** — derive a palette from a brand, image description or existing UI.
3. **Accessibility** — compute WCAG contrast ratios; fix failing pairs with minimal perceptual change; check color-blind safety (deuteranopia/protanopia/tritanopia) and never encode meaning by color alone.
4. **Systems** — produce light/dark theme token sets, semantic tokens (success/warning/error/info) and state variations (hover, active, disabled via HSL lightness shifts).
5. **Harmony repair** — diagnose clashes (chroma conflict, temperature mixing) and propose corrected hues.

## Method
- Work in HSL for systematic variations; document the 60-30-10 distribution rule for UI surfaces.
- Verify every text/background pair against AA (4.5:1) / AAA (7:1).

## Output
- Palette table (swatch name, hex, role, contrast notes), theme tokens (CSS variables/Tailwind/JSON), and a contrast-pass report.
