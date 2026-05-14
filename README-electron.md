# Sphere Planner - Application Electron

## Description
Sphere Planner est une application de planification de projet avec IA, maintenant disponible en tant qu'application de bureau grâce à Electron.

## Prérequis
- Node.js 16 ou supérieur
- npm ou yarn

## Installation

1. **Installer les dépendances :**
```bash
yarn
```

2. **Lancer l'application en mode développement :**
```bash
npm start
```

## Construction de l'application

### Pour Windows
```bash
yarn build:win
```

### Pour macOS
```bash
yarn build:mac
```

### Pour Linux
```bash
yarn build:linux
```

### Toutes les plateformes
```bash
yarn dist
```

## Structure des fichiers

```
SpherePlan/
├── main.js              # Processus principal Electron
├── preload.js           # Script de préchargement pour la sécurité
├── package.json         # Configuration du projet et dépendances
├── index.html           # Point d'entrée de l'application web
├── css/                 # Feuilles de style
├── js/                  # Scripts JavaScript
├── assets/              # Icônes et ressources
│   ├── icon.png         # Icône principale (512x512)
│   ├── icon.ico         # Icône Windows
│   └── icon.icns        # Icône macOS
└── README-electron.md   # Ce fichier
```

## Fonctionnalités Electron

### Menu de l'application
- **Fichier** : Nouveau projet, Exporter, Quitter
- **Édition** : Couper, Copier, Coller, Annuler, Rétablir
- **Affichage** : Recharger, Outils de développement, Zoom
- **Fenêtre** : Réduire, Agrandir, Fermer
- **Aide** : Documentation, Signaler un problème, À propos

### Intégration système
- **Sauvegarde/Chargement** : Dialogue natif pour sauvegarder/charger des projets
- **Exportation** : Exportation de projets en JSON ou PDF
- **Liens externes** : Ouverture dans le navigateur par défaut
- **Raccourcis clavier** : Support des raccourcis standards

### Sécurité
- **Context Isolation** : Isolation entre le code Electron et le code web
- **Node Integration** : Désactivée pour la sécurité
- **Preload Script** : Communication sécurisée via IPC

## Personnalisation

### Icônes
Placez vos icônes dans le dossier `assets/` :
- `icon.png` (512x512) - Icône principale
- `icon.ico` - Icône Windows
- `icon.icns` - Icône macOS

### Configuration du build
Modifiez le fichier `package.json` dans la section `build` pour :
- Changer l'ID de l'application (`appId`)
- Modifier le nom du produit (`productName`)
- Ajuster les paramètres spécifiques à chaque plateforme

## Développement

### Mode développement
```bash
npm start
```

Les outils de développement s'ouvriront automatiquement.

### Débogage
- **Processus principal** : Utilisez `console.log` dans `main.js`
- **Processus de rendu** : Utilisez les DevTools (F12)

### Mise à jour des dépendances
```bash
npm update
```

## Résolution des problèmes

### L'application ne se lance pas
1. Vérifiez que Node.js est installé
2. Supprimez `node_modules` et réinstallez :
```bash
rm -rf node_modules
npm install
```

### Erreur de construction
1. Vérifiez que toutes les icônes sont présentes dans `assets/`
2. Assurez-vous d'avoir les droits d'administration pour l'installation

### Problèmes de performance
- Réduisez la taille des icônes si nécessaire
- Vérifiez la mémoire disponible

## Licence
MIT © 2024 NaanoCorp

## Support
Pour signaler des problèmes ou demander de l'aide :
- [Issues GitHub](https://github.com/naanocorp/plannerr/issues)
- Documentation : [docs.naanocorp.com](https://docs.naanocorp.com)
