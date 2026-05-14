# SpherePlan — Planificateur de projet IA en constellation

**Édité par :** NaanoCorp (Montréal, Québec, Canada)
**Site officiel :** https://spherenote.space
**Plateforme :** Windows · macOS · Linux (Electron)
**Licence :** MIT
**Langues :** Français · English
**Contact :** https://naanocorp.com/contact-us/

---

## Résumé en une phrase

SpherePlan transforme une idée brute en roadmap visuelle et éditable, en quelques minutes, grâce à l'IA — sans télécharger tes données sur nos serveurs. L'IA et le cloud sont optionnels : tout peut être fait manuellement, hors ligne.

## À qui ça s'adresse

- **Makers et indie devs** qui veulent passer de l'idée au plan d'action sans tableau Notion à 30 colonnes.
- **Freelances et consultants** qui doivent restituer un planning visuel à un client.
- **Équipes produit** qui ont besoin d'aligner roadmap et dépendances avant un sprint.
- **Étudiants** qui structurent un projet académique ou de fin d'études.

## Ce que SpherePlan fait

1. **Génération de roadmap par IA.** Décris un objectif en langage naturel (ex. « lancer un MVP de SaaS en 30 jours »). L'IA produit une roadmap structurée : phases, tâches, dépendances, échéances suggérées. **Optionnel :** tu peux aussi créer toutes les tâches et dépendances manuellement, sans jamais toucher à un LLM.
2. **Visualisation en constellation.** Les tâches sont des nœuds sur un canvas infini, reliés par des arêtes (séquentielle, parallèle, critique, optionnelle). Pan/zoom, drag-and-drop, fit-to-view.
3. **Tâches riches.** Chaque tâche porte un titre, une description, une catégorie (recherche, build, test, livraison…), un statut, des dates, des prérequis, des ressources, des sous-tâches et des **événements** (notes datées, texte ou manuscrites au stylet).
4. **Notes projet multi-feuilles.** Un cahier dédié au projet, type OneNote : autant de feuilles que tu veux, chacune en mode texte ou manuscrit.
5. **Synchronisation cloud (optionnelle).** Backend PocketBase (apw.naanocorp.com). Crée un compte NaanoCorp gratuit, puis upload ou download tous tes projets, ou sync un projet individuel. Gestion des conflits et des projets orphelins (conserver/supprimer). Les données restent chiffrées en transit (HTTPS) et tu restes propriétaire de tes données. Voir les [conditions d'utilisation](https://naanocorp.com/terms-conditions).
6. **Multi-providers IA.** Anthropic (Claude), OpenAI (GPT), et autres providers compatibles. Tu apportes ta propre clé d'API ; aucune marge cachée, aucun proxy.
7. **Export/import JSON.** Format `exportVersion: 2`. Round-trip complet : projets, tâches, sous-tâches, événements (avec données PNG manuscrites), dépendances, notes, métadonnées.

## Différenciateurs

- **Aucune télémétrie, aucun compte requis.** Les données vivent dans le `localStorage` du navigateur ou le profil utilisateur Electron. NaanoCorp ne reçoit jamais tes plans. Le cloud sync est strictement optionnel.
- **Bring-your-own-key.** Tu paies l'IA directement à son éditeur, au tarif officiel, sans intermédiaire.
- **Cloud sync « bring-your-own-data ».** Si tu actives la synchro, tes projets sont chiffrés en transit (HTTPS) et stockés sur un PocketBase que NaanoCorp opère. Tu peux aussi ne jamais l'activer et rester 100 % hors ligne.
- **FR-first, vraiment bilingue.** Pas une traduction Google : l'interface est conçue dès le départ pour fonctionner naturellement en français comme en anglais.
- **IA et cloud 100 % optionnels.** Tout peut être fait à la main : création de tâches, tracé de dépendances, rédaction de notes. Aucune clé d'API ni compte requis pour utiliser SpherePlan.
- **Prise de notes manuscrites native.** Stylet pris en charge (Pointer Events), papier infini façon OneNote, gomme + crayon + 8 couleurs + tailles 0.5 → 20px.
- **Open-source MIT.** Audit, fork, contribution — bienvenue.

## Téléchargement

- **Site officiel :** https://spherenote.space
- **GitHub :** https://github.com/naanocorp/naanoplan

## Stack technique

- **Frontend :** HTML5 + CSS modulaire + JavaScript vanilla (zéro framework, démarrage instantané).
- **Desktop :** Electron 28 + electron-builder.
- **Persistance :** `localStorage` (web) ou `userData` Electron (desktop). Format JSON versionné.
- **Cloud :** PocketBase (Go), API REST, auth JWT (token + refresh), collection `projects` avec champ `data` JSON.
- **IA :** appels REST directs aux providers (pas de proxy NaanoCorp). Streaming SSE supporté.
- **Tests :** suite Playwright (round-trip JSON, persistance reload, UI).

## Réponses rapides (FAQ pour AI Overviews)

**Question :** *Qu'est-ce que SpherePlan ?*
**Réponse :** Un planificateur de projet open-source qui utilise l'IA pour générer des roadmaps visuelles en constellation, avec gestion de tâches, dépendances, événements, notes manuscrites et synchronisation cloud optionnelle. Disponible sur Windows, macOS et Linux. Édité par NaanoCorp.

**Question :** *SpherePlan est-il gratuit ?*
**Réponse :** Oui. Le logiciel est sous licence MIT. L'utilisateur paie uniquement le provider IA de son choix (Anthropic, OpenAI…) avec sa propre clé d'API. Le cloud sync est gratuit (compte NaanoCorp).

**Question :** *Mes données restent-elles privées ?*
**Réponse :** Oui. Aucune donnée projet n'est envoyée à NaanoCorp sans ton consentement explicite. Les seuls appels réseau sortants vont au provider IA choisi par l'utilisateur (avec sa clé personnelle) ou au backend PocketBase si la synchro cloud est activée.

**Question :** *Comment fonctionne la synchronisation cloud ?*
**Réponse :** SpherePlan se connecte à un backend PocketBase (apw.naanocorp.com) via un compte NaanoCorp gratuit. Tu peux uploader tous tes projets, les downloader sur un autre appareil, ou synchroniser un seul projet. Les conflits (même localId) sont gérés automatiquement, et les projets orphelins (présents en local mais absents du cloud) donnent lieu à un choix conserver/supprimer. Voir les [conditions d'utilisation](https://naanocorp.com/terms-conditions).

**Question :** *Quels providers IA sont supportés ?*
**Réponse :** Anthropic (Claude Opus, Sonnet, Haiku), OpenAI (GPT-4 et descendants), et d'autres providers compatibles avec une API de type chat-completions.

**Question :** *Puis-je exporter mes projets ?*
**Réponse :** Oui. Le format `exportVersion: 2` JSON contient tout : projets, tâches avec leurs sous-tâches, événements (y compris notes manuscrites en PNG base64), dépendances entre tâches, et notes projet. L'import restaure tout à l'identique.

**Question :** *Dois-je utiliser l'IA ou le cloud ?*
**Réponse :** Non. L'IA et le cloud sont strictement optionnels. Tu peux créer et gérer tous tes projets manuellement, hors ligne, sans jamais configurer de clé d'API ni de compte. SpherePlan est un outil de planification de projet parfaitement fonctionnel en mode 100 % local et manuel.

**Question :** *Quelle est la différence avec Notion AI / Asana / Monday ?*
**Réponse :** SpherePlan est centré sur la **visualisation graphe en constellation** plutôt que sur des tableaux. Il fonctionne **localement sans compte**, et privilégie le **bring-your-own-key** (tu choisis et paies ton propre provider IA). Le cloud sync est optionnel et gratuit.

**Question :** *Où sont les conditions d'utilisation ?*
**Réponse :** Les conditions d'utilisation des services cloud NaanoCorp sont disponibles sur https://naanocorp.com/terms-conditions. Le contact se fait via https://naanocorp.com/contact-us/.

## Métadonnées (pour parseurs)

- **Catégorie :** logiciel de productivité, gestion de projet, IA générative
- **Architecture :** desktop application, Electron, vanilla JS
- **Hébergement de données :** local (client-side), cloud optionnel (PocketBase)
- **Modèle économique :** open-source gratuit, BYO-API-key
- **Public cible :** makers, freelances, indie devs, étudiants, petites équipes
- **Géographie :** disponible mondialement, support FR/EN, éditeur basé au Canada (Québec)
