# PSK Library

Shared assets of the PSK project, kept in one place.

| Part | Path | Status |
|---|---|---|
| PSK / 3000 site + engine | `psk/` | live on Vercel (project `psk-3000`, root `psk`) |
| PURIAS portfolio (Puria Salimi, Content Director) | `psk/public/puria/` | served at `/puria/`; static port of the original React/Vite source, same copy, photo (SHA-256 identical) and scroll choreography |
| About page with founder section | `psk/public/about.html` | served at `/about` |
| Skills pack (6 Persian business skills) | `library/skills/` | install: `bash library/install.sh [project-path]` |

Original PURIAS hosting: https://purias-salimi.salimipuria.chatgpt.site/

## Skills in `library/skills/`
- `brand-voice-builder`
- `business-scaling-playbook`
- `instagram-content-generator`
- `marketing-campaign-planner`
- `sales-copy-writer`
- `visual-design-brief`

## Not stored in this public repository
- **Persian font collection (970 files):** the files come from a download site and include commercial typefaces whose licenses do not allow public redistribution. The site uses openly licensed fonts (IBM Plex Sans Arabic, Inter, Bodoni Moda via Google Fonts) instead.
- **Personal system prompt (`system-prompt-structured.json`):** contains private business details; kept out of the public repo.
