# À propos de SpherePlan

SpherePlan est une application de bureau open-source (licence MIT) conçue pour transformer une idée brute en feuille de route visuelle et exploitable. L'application s'adresse aux makers, freelances, étudiants et équipes produit qui souhaitent planifier leurs projets rapidement, sans dépendre d'un service cloud ou d'un compte utilisateur.

**Domaine :** https://spherenote.space

## Ce que fait SpherePlan

- **Génération de roadmap par IA :** décris un objectif en langage naturel (ex. « lancer un MVP en 30 jours ») et l'IA produit une roadmap structurée avec phases, tâches, dépendances et échéances suggérées.
- **Visualisation en constellation :** les tâches sont affichées comme des nœuds sur un canvas infini, reliés par des arêtes (séquentielle, parallèle, critique, optionnelle). L'utilisateur peut librement déplacer, zoomer et réorganiser les nœuds.
- **Tâches riches :** chaque tâche comporte un titre, une description, une catégorie, un statut, des dates, des prérequis, des ressources, des sous-tâches et des événements (notes datées, texte ou manuscrites au stylet).
- **Notes projet multi-feuilles :** un cahier intégré façon OneNote, avec autant de feuilles que souhaité, chacune pouvant contenir du texte ou des notes manuscrites (support stylet).
- - **Notifications de rappels :** Un mail journalier sauf le dimanche avec les tâches de chaque projet en cours regroupés en terminées, en cours et expirées. Avec une section "comment commencer ?" qui contient les liens vers les ressources les plus actualisées des taches à +/- 7 jours d'expiration.
- **Synchronisation cloud optionnelle :** backend PocketBase (apw.naanocorp.com). Création d'un compte NaanoCorp gratuit, puis upload/download de tous les projets, ou synchronisation d'un projet individuel. Gestion automatique des conflits (même localId) et des projets orphelins (choix conserver/supprimer). Les données transitent en HTTPS. Voir les [conditions d'utilisation](https://naanocorp.com/terms-conditions).
- **Export/import JSON :** sauvegarde et restauration complètes au format `exportVersion: 2` (projets, tâches, sous-tâches, événements, dépendances, notes, métadonnées). Round-trip fidèle.
- **Multi-providers IA :** compatible avec Anthropic (Claude), OpenAI (GPT) et tout autre provider offrant une API de type chat-completions. L'utilisateur apporte sa propre clé d'API, sans intermédiaire ni marge cachée.
- **Bilingue FR/EN :** interface conçue dès le départ pour fonctionner naturellement en français et en anglais.
- **100 % local par défaut :** les données sont stockées dans le `localStorage` du navigateur (version web) ou dans le profil utilisateur Electron (version desktop). Aucune donnée n'est envoyée à NaanoCorp sans ton consentement explicite.

## IA ou pas IA — tu choisis

SpherePlan est souvent présenté comme un planificateur « piloté par IA », mais il est important de souligner que **tout peut aussi être fait entièrement à la main, sans jamais toucher à un LLM**.

La génération automatique de roadmap par IA est une option pratique pour démarrer vite, mais tu peux tout à fait :

- Créer tes projets, phases, tâches et sous-tâches manuellement, de zéro.
- Tracer et éditer les dépendances entre tâches à la main, directement sur le canvas en constellation.
- Rédiger toi-même les descriptions, événements et notes, texte comme manuscrites.
- Ne jamais configurer de clé d'API ni dépendre d'un quelconque service externe.

Autrement dit, l'IA est un **accélérateur optionnel**, pas une obligation. SpherePlan reste un outil de planification de projet parfaitement fonctionnel en mode 100 % manuel, hors ligne et sans compte.

## Cloud ou pas cloud — tu choisis aussi

La synchronisation cloud est également **strictement optionnelle**. SpherePlan fonctionne intégralement en local sans compte. Si tu souhaites synchroniser tes projets entre plusieurs appareils, tu peux créer un compte NaanoCorp gratuit et utiliser les fonctions d'upload/download. Tu restes libre de ne jamais activer cette fonctionnalité.

Le cloud sync repose sur PocketBase, un backend open-source opéré par NaanoCorp. Les données sont transmises en HTTPS et restent ta propriété. Les conditions d'utilisation sont disponibles sur https://naanocorp.com/terms-conditions.

## Éthique et confidentialité

- **Zéro télémétrie :** SpherePlan ne collecte rien et n'envoie aucune donnée à NaanoCorp sans ton consentement.
- **BYO-API-key :** si tu choisis d'utiliser l'IA, tu paies directement le provider (Anthropic, OpenAI…), au tarif officiel, sans passer par un proxy ou un abonnement NaanoCorp.
- **Open-source :** le code est sous licence MIT, disponible sur GitHub, auditable et modifiable librement.

## Éditeur

SpherePlan est développé et maintenu par **NaanoCorp**, un studio basé à Montréal (Québec, Canada).

- **Site officiel de l'app :** https://spherenote.space
- **Site NaanoCorp :** https://naanocorp.com
- **Contact :** https://naanocorp.com/contact-us/
- **Conditions d'utilisation :** https://naanocorp.com/terms-conditions
- **GitHub :** https://github.com/Pispros/spherePlan

## Plateformes

Windows (NSIS) · macOS (DMG, Intel + Apple Silicon) · Linux (AppImage, deb) · Version web sans installation
