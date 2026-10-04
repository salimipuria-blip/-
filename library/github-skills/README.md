# GitHub Skills (3,000)

The 3,000 highest-ranked skills collected from 50 public GitHub skill repositories with 5,000+ stars (star counts as shown on GitHub topic pages, 2026-10-04).

**Active.** Every skill here is also installed in `.claude/skills/`, so Claude Code loads it in any session opened on this repo. To deactivate one, delete its folder from `.claude/skills/` (the copy here stays as the archive).

## How they were selected
From 10,859 `SKILL.md` files (4,192 unique names after filtering):

| Filter | Removed |
|---|---|
| No permissive license (only MIT, Apache-2.0, BSD, ISC, CC-BY-4.0, CC0, Unlicense kept) | 1,276 |
| Invalid frontmatter (`name` / `description`) | 827 |
| Suspicious patterns (pipe-to-shell, `rm -rf /`, "ignore previous instructions", key material, …) | 304 |
| Same name as one of the project's own 3,006 skills | 71 |
| Too short or too long | 52 |

Remaining skills were deduplicated by name (highest score kept) and ranked by `log10(repo stars)` plus description and content quality. All 3,000 selected are MIT-licensed.

## Files
- `<name>/SKILL.md`: the skill as published upstream.
- `<name>/SOURCE.md`: source URL, repository and license. Only `SKILL.md` is copied; scripts or assets from the upstream folder are not included.
- `_licenses/`: the license text of every source repository.
- `INDEX.json`: name, repository, path, license, score, description and URL for every skill.

The automated filter does not replace a human review: read a skill before activating it.
