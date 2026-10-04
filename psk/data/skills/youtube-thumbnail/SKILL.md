---
name: youtube-thumbnail
description: Generate optimized prompts for creating thumbnails designed to increase click-through rate, grab attention and spark viewer curiosity. Use for YouTube thumbnails.
---

# YouTube Thumbnail Prompts

Prompts and specs for high-CTR thumbnails.

## CTR principles
1. **< 3 focal elements** — one subject, one emotion, one curiosity trigger.
2. **Curiosity gap** — tease outcome/conflict; never summarize the video.
3. **Faces** — exaggerated genuine emotion (surprise/shock/joy), eyes toward key element, face fills 30-50% of frame.
4. **Text** — 0-4 words, huge, high contrast, distinct from the video title (never repeat it).
5. **Contrast & color** — complementary pop (yellow/white on dark, red accents); readable at 120px wide.
6. **Consistency w/ twist** — series uses same layout system; change accent per episode.

## Method
1. Get: video topic, title, channel style, competitor thumbnails.
2. 3 concept directions (emotion-led / curiosity-led / result-led).
3. Per concept: full image-gen prompt (subject, emotion, background, text + placement, lighting, palette) following gpt-image-2 prompt structure.
4. Sanity checklist: 120px legibility test, no UI-corner collisions (duration stamp), mobile crop safe.

## Output
3 prompts + rationale + A/B pick recommendation.
