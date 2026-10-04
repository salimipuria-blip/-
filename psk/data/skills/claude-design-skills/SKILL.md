---
name: claude-design-skills
description: Powerful toolkit for cinematic motion graphics, 3D scenes, animations and interactive visual elements that elevate visual output quality. Use for motion design, 3D, interactive visuals.
---

# 3D & Motion Design

Create cinematic motion graphics, 3D scenes and interactive visuals with web tech (Three.js, GSAP, CSS, SVG animation, Lottie).

## 3D scenes (Three.js)
1. Scene plan: subject, camera (FOV/orbit), light rig (key/fill/rim), environment.
2. Build modular: geometry → materials (PBR) → lights → post (bloom/vignette) → controls.
3. Animate with delta-time; add subtle idle motion (float, rotation) so scenes never look dead.
4. Optimize: cap pixel ratio, reuse geometries, dispose on unmount.

## Motion graphics (GSAP / CSS / SVG)
- Principles: easing (power3.out default), staggering (0.05-0.12s), anticipation + follow-through, 200-600ms UI durations.
- SVG: stroke-draw reveals, morphs via path interpolation; Lottie for exportable micro-animations.

## Interactive elements
- Pointer-parallax, scroll-driven timelines (ScrollTrigger), magnetic buttons, scroll-reveal sections.

## Rules
- Respect `prefers-reduced-motion` (provide static fallback).
- Motion must communicate hierarchy, not decorate randomly.
- 60fps or nothing: animate transform/opacity only.

## Output
Single-file HTML demo with the scene/animation + parameter notes (duration, easing, palette).
