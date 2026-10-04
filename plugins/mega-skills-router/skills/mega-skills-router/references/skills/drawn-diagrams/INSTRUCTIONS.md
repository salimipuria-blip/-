---
name: drawn-diagrams
description: Create hand-drawn style diagrams and flowcharts with attractive visuals and animations that communicate complex concepts simply. Use for sketches, flowcharts, architecture diagrams.
---

# Drawn Diagrams

Turn concepts into memorable hand-drawn-style diagrams (Excalidraw-style).

## Workflow
1. **Understand** — extract entities, relationships and the single message of the diagram.
2. **Choose type** — flowchart, architecture, sequence, mindmap, timeline, or concept sketch.
3. **Structure** — draft node list + edges; keep 5-9 nodes per view (split if larger); left-to-right or top-down flow.
4. **Render** — produce as:
   - Excalidraw-compatible SVG/JSON (sketchy strokes, doubled rough lines), or
   - SVG with a hand-drawn filter (`stroke-dasharray` wobble, rough.js style), using a handwritten-ish fallback font stack.
5. **Annotate** — short labels (2-4 words), arrows with verbs, highlight the key path with one accent color.
6. **Animate (optional)** — add step-by-step reveal (staggered fade/draw) for presentations.

## Rules
- One idea per diagram; label everything; legends only if needed.
- Use muted paper-like background (#fffdf7 / dark-board variant) and 3-4 marker colors max.

## Output
Diagram file + a plain-text outline of the structure so it can be edited later.
