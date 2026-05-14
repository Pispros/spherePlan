# SpherePlan

[![Release](https://img.shields.io/github/v/release/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/releases)
[![License](https://img.shields.io/github/license/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/Pispros/spherePlan?style=social)](https://github.com/Pispros/spherePlan)
[![Issues](https://img.shields.io/github/issues/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/issues)

SpherePlan is an open-source desktop application (MIT license) designed to turn a raw idea into a visual, actionable roadmap. It targets makers, freelancers, students and product teams who want to plan projects quickly without relying on a cloud service or user account.

Official site: https://spherenote.space  
Source code: https://github.com/Pispros/spherePlan

## Key features

- AI roadmap generation: describe a goal in natural language (e.g. "launch an MVP in 30 days") and the AI outputs a structured roadmap with phases, tasks, dependencies and suggested deadlines.
- Constellation visualization: tasks displayed as nodes on an infinite canvas, connected by edges (sequential, parallel, critical, optional). Drag, zoom and reorganize freely.
- Rich tasks: title, description, category, status, dates, prerequisites, resources, subtasks and events (dated notes, text or stylus handwriting).
- Multi-sheet notebook: OneNote-style project notebook with as many sheets as needed, supporting text and handwritten notes.
- Notifications & reminders: daily email (except Sunday) summarizing project tasks (done, in-progress, overdue) and a "how to get started" section linking to the most up-to-date task resources near their due date.
- Optional cloud sync: PocketBase backend (apw.naanocorp.com). Create a free NaanoCorp account for uploading/downloading or syncing individual projects. Automatic conflict and orphaned-project handling.
- JSON import/export: full backup/restore using `exportVersion: 2` (projects, tasks, subtasks, events, dependencies, notes, metadata).
- Multi-provider AI support: Anthropic (Claude), OpenAI (GPT) and any provider offering a chat-completions style API. Users provide their own API keys (BYO-API-key).
- Bilingual UI (FR/EN).
- Local-first: data stored in `localStorage` (web) or the Electron user profile (desktop). No data is sent to NaanoCorp without explicit consent.

## AI or fully manual

SpherePlan can be used entirely manually: create projects, phases, tasks, dependencies and notes by hand without ever configuring an API key or contacting an external service. AI is an optional accelerator, not a requirement.

## Cloud optional

Cloud sync is strictly optional. To sync projects across devices, create a free NaanoCorp account and enable sync. Data is transmitted over HTTPS and remains your property. Terms: https://naanocorp.com/terms-conditions

## Privacy & ethics

- No telemetry by default.
- BYO-API-key: you pay the AI provider directly; NaanoCorp does not proxy or add hidden fees.
- Open-source: MIT license, auditable and modifiable.

## Platforms

- Windows (NSIS)
- macOS (DMG, Intel + Apple Silicon)
- Linux (AppImage, .deb)
- Web version (no installation)

## Quick install & run

Typical prerequisites: Node.js 16+ and a package manager (`npm`, `yarn` or `pnpm`). Check the project's `package.json` for exact scripts and versions.

Examples (adapt to the repo):

```bash
# install deps
npm install

# start in development mode (web / electron depending on config)
npm run dev

# build packages / binaries
npm run build
```

For precise build and packaging instructions, see `README.md`/`DEVELOPER.md` or the project's GitHub Releases.

## Import / Export

Use the JSON export (`exportVersion: 2`) to backup and restore projects. The format preserves projects, tasks, subtasks, events, dependencies, notes and metadata for a faithful round-trip.

## Contributing

Bug reports, feature requests and contributions are welcome via GitHub: https://github.com/Pispros/spherePlan  
See `CONTRIBUTING.md` if present for contribution guidelines.

## Useful links

- App: https://spherenote.space  
- Contact: https://naanocorp.com/contact-us/  
- GitHub: https://github.com/Pispros/spherePlan

## License

SpherePlan is available under the MIT license. See `LICENSE` for full text.
