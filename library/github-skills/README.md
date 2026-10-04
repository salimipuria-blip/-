# GitHub Skills (2,980)

The 2,980 highest-ranked skills collected from 50 public GitHub skill repositories with 5,000+ stars (star counts as shown on GitHub topic pages, 2026-10-04).

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

Remaining skills were deduplicated by name (highest score kept) and ranked by `log10(repo stars)` plus description and content quality. The top 3,000 were taken (all MIT-licensed); their companion files were then fetched and scanned with the same patterns, and 20 skills whose companions matched were dropped, leaving 2,980.

## Files
- `<name>/SKILL.md`: the skill as published upstream.
- `<name>/SOURCE.md`: source URL, repository and license.
- Companion files (`scripts/`, `references/`, assets) from each upstream skill folder are included so skills work as published; files over 1 MB and nested sub-skills are excluded.
- `_licenses/`: the license text of every source repository.
- `INDEX.json`: name, repository, path, license, score, description and URL for every skill.

## Incomplete skills (281)
These reference files that are not in their folder (usually shared scripts at the upstream repo root, or files missing upstream). They stay active, but the steps that need those files will fail. Each is marked `"incomplete": true` in `INDEX.json` and has an `INCOMPLETE:` line in its `SOURCE.md`; delete the folder from `.claude/skills/` to deactivate one.

The automated filter does not replace a human review: read a skill before activating it.
