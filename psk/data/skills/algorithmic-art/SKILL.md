---
name: algorithmic-art
description: Generate unique generative/algorithmic art using movement patterns, dynamic shapes and algorithm-driven creative processes with striking visual effects. Use for generative art, p5.js sketches, creative coding.
---

# Algorithmic Art

Create original generative art with code (default: p5.js, or Three.js for 3D).

## Workflow
1. **Concept** — choose a movement/pattern idea: flow fields, particle systems, L-systems, fractals, noise terrain, reaction-diffusion, orbitals.
2. **Parameters** — define controllable parameters (seed, density, speed, palette, chaos) so results are reproducible and tweakable.
3. **Sketch** — write a clean p5.js sketch in a single HTML file: `setup()`, `draw()`, `noise()`/`random()` with a fixed `randomSeed()` / `noiseSeed()`.
4. **Palette & motion** — apply a curated color palette (2-5 hues); ensure motion is smooth (delta-time based, 60fps target).
5. **Composition** — frame with intentional margins; elegant compositions beat full-canvas noise.
6. **Export** — include keyboard save (e.g. press `s` to save frame as PNG) and an optional GIF/frame-loop export mode.

## Principles
- Randomness must be structured: drive variation with Perlin noise, not pure random.
- Layer simple rules to get emergent complexity (agents + fields + constraints).
- Always expose the seed so a lucky result can be regenerated.

## Output
Single-file HTML sketch with inline JS, plus a short description of the algorithm and parameter table.
