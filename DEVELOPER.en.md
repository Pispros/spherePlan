# SpherePlan — Developer Quickstart

[![Release](https://img.shields.io/github/v/release/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/releases)
[![License](https://img.shields.io/github/license/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/blob/main/LICENSE)

Quick instructions for developers who want to contribute or build the application locally. Adapt commands to the scripts defined in the project's `package.json`.

## Prerequisites

- Node.js 16+ (or the version recommended in the repo)
- `npm`, `yarn` or `pnpm`
- (Optional) Docker if you want to run a local PocketBase backend

## Install

```bash
# clone
git clone https://github.com/Pispros/spherePlan.git
cd spherePlan

# install dependencies
npm install
# or
# yarn install
# or
# pnpm install
```

## Development

Example scripts (check `package.json`):

```bash
# start dev (hot-reload)
npm run dev

# start Electron in dev mode
npm run electron:dev
```

## Packaging / Builds

Builds vary by target. Generic examples:

```bash
# build web / production
npm run build

# create native packages (NSIS, DMG, AppImage, .deb)
npm run release
```

Check the repo's `electron-builder` / packager config for platform specifics.

## AI & Sync configuration

- BYO-API-key: the app expects the user to provide their own API key for Anthropic / OpenAI. Do not commit keys.
- PocketBase (optional): to work on sync, run a local PocketBase server (see PocketBase docs). Backend URL and keys live in the app settings.

## Tests

If tests exist:

```bash
npm test
```

## Lint & format

```bash
npm run lint
npm run format
```

## Troubleshooting

- Check `package.json` for exact scripts.
- For native build errors, ensure platform build tools are installed (Xcode on macOS, build-essential on Linux, Visual Studio Build Tools on Windows).

## Contributing

- Fork -> PR. Follow code style and existing tests. Add clear descriptions and tests for new features.
- Open issues for bugs or feature requests.

---

Thanks for contributing to SpherePlan!
