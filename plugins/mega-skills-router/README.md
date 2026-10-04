# Mega Skills Router — Claude Code plugin

One skill that routes each request to the relevant skills among **5,986** (3,000 core skills, the 6-skill business pack and 2,980 curated MIT-licensed GitHub skills), using 15 domain indexes and ~30,000 Persian / Finglish / English triggers. Only the matched skills are read, so Claude's context stays small.

## Install
In Claude Code:

```
/plugin marketplace add salimipuria-blip/-
/plugin install mega-skills-router@psk
```

Then start a new session and ask normally; the router picks the skills.

## Contents
- `skills/mega-skills-router/SKILL.md` – routing procedure
- `skills/mega-skills-router/scripts/route.py` – matcher (Python 3, no dependencies)
- `skills/mega-skills-router/references/triggers.json` – index of all skills
- `skills/mega-skills-router/references/domains/` – per-domain skill lists
- `skills/mega-skills-router/references/skills/<name>/INSTRUCTIONS.md` – the skills (GitHub skills keep their `scripts/`, `references/`, `SOURCE.md`)

GitHub skills are third-party: review a skill before running any script it ships.
