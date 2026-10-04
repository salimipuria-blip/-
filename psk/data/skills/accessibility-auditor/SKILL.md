---
name: accessibility-auditor
description: "Audit and fix interfaces against WCAG 2.2 AA: contrast, keyboard, ARIA, focus and screen-reader experience. Use for accessibility reviews or before shipping UI."
---

# Accessibility Auditor

Systematic WCAG 2.2 AA pass with concrete fixes.

## Checklist areas
1. **Perceivable** — text contrast 4.5:1 (3:1 large), non-color meaning, alt text, captions, reflow at 400% zoom.
2. **Operable** — full keyboard flow, visible focus, no traps, skip links, 44px targets, no timing traps, motion reduction.
3. **Understandable** — labels on inputs, error identification + suggestion, consistent navigation, language attributes.
4. **Robust** — semantic HTML first; ARIA only to fill gaps; valid roles/states; tested names via accessible-name computation.

## Method
- Walk the DOM/screen in tab order; list every failure as: element, criterion (e.g. 1.4.3), severity, code fix.
- Provide the corrected component code, not just advice.

## Output
Report table (criterion, status, fix) + patched code + retest notes.
