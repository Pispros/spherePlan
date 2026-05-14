# SpherePlan — Developer Quickstart

[![Release](https://img.shields.io/github/v/release/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/releases)
[![License](https://img.shields.io/github/license/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/blob/main/LICENSE)

Ce document contient des instructions rapides pour les développeur·se·s souhaitant contribuer ou builder l'application localement. Adapte les commandes en fonction des scripts présents dans le `package.json` du dépôt.

## Prérequis

- Node.js 16+ (ou la version recommandée dans le dépôt)
- `npm`, `yarn` ou `pnpm`
- (Optionnel) Docker si tu veux démarrer un backend PocketBase local

## Installation

```bash
# cloner le dépôt
git clone https://github.com/Pispros/spherePlan.git
cd spherePlan

# installer dépendances
npm install
# ou
# yarn install
# ou
# pnpm install
```

## Développement

Exemples de scripts (vérifie `package.json`) :

```bash
# démarrer en mode dev (hot-reload)
npm run dev

# démarrer l'app Electron en mode dev
npm run electron:dev
```

## Packaging / Builds

Les builds varient selon la cible. Exemples génériques :

```bash
# build web / production
npm run build

# créer les packages natifs (NSIS, DMG, AppImage, .deb)
npm run release
```

Consulte la configuration d'`electron-builder` / `packager` dans le dépôt pour détails spécifiques aux plateformes.

## Configuration pour IA et Sync

- BYO-API-key : l'app attend une clé API fournie par l'utilisateur pour Anthropic / OpenAI. Ne commit pas de clés dans le repo.
- PocketBase (optionnel) : si tu veux développer la sync, tu peux lancer un serveur PocketBase local (voir la doc officielle de PocketBase). La configuration (URL du backend, clefs) se trouve dans les paramètres de l'app.

## Tests

Si le projet inclut des tests :

```bash
npm test
```

## Lint & formatting

```bash
npm run lint
npm run format
```

## Dépannage

- Vérifie le `package.json` pour les scripts exacts.
- Si tu rencontres des erreurs natives lors du build, assure-toi d'avoir les outils de build natifs pour ta plateforme (Xcode sur macOS, build-essential/libc-dev sur Linux, etc.).

## Contribuer

- Fork -> PR. Respecte le style du code et les tests existants. Ajoute des commentaires clairs et des tests pour les nouvelles fonctionnalités.
- Ouvre des issues pour bugs ou demandes de features.

---

Merci de contribuer à SpherePlan !
