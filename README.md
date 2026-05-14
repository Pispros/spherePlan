# SpherePlan

[![Release](https://img.shields.io/github/v/release/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/releases)
[![License](https://img.shields.io/github/license/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/Pispros/spherePlan?style=social)](https://github.com/Pispros/spherePlan)
[![Issues](https://img.shields.io/github/issues/Pispros/spherePlan)](https://github.com/Pispros/spherePlan/issues)

SpherePlan est une application de bureau open-source (licence MIT) conçue pour transformer une idée brute en feuille de route visuelle et exploitable. L'outil s'adresse aux makers, freelances, étudiant·e·s et équipes produit qui veulent planifier rapidement des projets sans dépendre d'un service cloud ni d'un compte utilisateur.

Site officiel : https://spherenote.space  
Code source : https://github.com/Pispros/spherePlan

## Fonctionnalités principales

- Génération de roadmap par IA : décris un objectif en langage naturel (ex. « lancer un MVP en 30 jours ») et l'IA produit une roadmap structurée avec phases, tâches, dépendances et échéances suggérées.
- Visualisation en constellation : tâches affichées comme nœuds sur un canvas infini, connectées par des arêtes (séquentielle, parallèle, critique, optionnelle). Déplacement, zoom et réorganisation libres.
- Tâches riches : titre, description, catégorie, statut, dates, prérequis, ressources, sous-tâches et événements (notes datées, texte ou manuscrites au stylet).
- Cahier multi-feuilles : notes de projet façon OneNote, avec autant de feuilles que nécessaire, texte et notes manuscrites.
- Notifications & rappels : mail quotidien (sauf dimanche) avec synthèse des tâches (terminées, en cours, expirées) et section « comment commencer ? » pour les tâches proches d'échéance.
- Synchronisation cloud optionnelle : backend PocketBase (apw.naanocorp.com). Création d'un compte NaanoCorp gratuit pour upload/download ou synchronisation d'un projet individuel. Gestion automatique des conflits et projets orphelins.
- Export/import JSON : sauvegarde/restauration complètes au format `exportVersion: 2` (projets, tâches, sous-tâches, événements, dépendances, notes, métadonnées).
- Multi-providers IA : compatible Anthropic (Claude), OpenAI (GPT) et tout provider proposant une API de type chat‑completions. L'utilisateur fournit sa propre clé d'API (BYO-API-key).
- Bilingue FR/EN.
- 100 % local par défaut : données stockées dans `localStorage` (web) ou dans le profil utilisateur Electron (desktop). Aucune donnée n'est envoyée à NaanoCorp sans consentement explicite.

## Mode d'utilisation — IA ou 100 % manuel

SpherePlan peut être utilisé uniquement en mode manuel : création de projets, phases, tâches, dépendances et notes entièrement à la main, sans jamais configurer de clé d'API ni contacter un service externe. L'IA est une option pour accélérer la création de roadmaps, pas une obligation.

## Cloud ou pas cloud

La synchronisation cloud est strictement optionnelle. Si tu veux synchroniser des projets entre appareils, crée un compte NaanoCorp et active la sync. Les données transitent en HTTPS et restent ta propriété. Les conditions d'utilisation sont disponibles ici : https://naanocorp.com/terms-conditions

## Éthique et confidentialité

- Zéro télémétrie : aucune collecte sans consentement.
- BYO-API-key : si tu utilises l'IA, tu paies directement le provider. Pas de proxy ni d'abonnement caché.
- Open-source : code sous licence MIT, auditable et modifiable.

## Plateformes distribuées

- Windows (NSIS)
- macOS (DMG, Intel + Apple Silicon)
- Linux (AppImage, .deb)
- Version web accessible sans installation

## Installation & exécution — rapide

Prerequis typiques : Node.js 16+ et un gestionnaire de paquets (`npm`, `yarn` ou `pnpm`). Vérifie le `package.json` du projet pour des scripts et versions exactes.

Exemples (à adapter selon le repo) :

```bash
# installer les dépendances
npm install

# démarrer en mode développement (web / electron selon config)
npm run dev

# builder les binaires / packages
npm run build
```

Pour des instructions précises de build et de packaging, consulte le `README.en.md`/`DEVELOPER.md` du dépôt ou la section "Releases" sur GitHub.

## Import / Export

Utilise l'export JSON (format `exportVersion: 2`) pour sauvegarder et restaurer des projets. Le format préserve projets, tâches, sous-tâches, événements, dépendances, notes et métadonnées pour un round-trip fidèle.

## Contribution

Contributions, rapports de bugs et demandes de fonctionnalités sont bienvenus via le dépôt GitHub : https://github.com/Pispros/spherePlan  
Consulte le fichier `CONTRIBUTING.md` du projet (s'il existe) pour les règles et le workflow.

## Liens utiles

- Site de l'app : https://spherenote.space  
- NaanoCorp : https://naanocorp.com  
- Contact : https://naanocorp.com/contact-us/  
- GitHub : https://github.com/Pispros/spherePlan

## Licence

SpherePlan est distribué sous licence MIT. Voir le fichier `LICENSE` pour le texte complet.
