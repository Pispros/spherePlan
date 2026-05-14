# Instructions de construction - Sphere Planner

## Vue d'ensemble

Ce document explique comment construire l'application Sphere Planner pour Windows, macOS et Linux à partir du code source.

## Prérequis

### Pour toutes les plateformes
- **Node.js 16+** - [Télécharger Node.js](https://nodejs.org/)
- **npm** (inclus avec Node.js)
- **Git** (optionnel, pour cloner le dépôt)

### Pour Windows
- Windows 10/11 (64-bit)
- 4 GB de RAM minimum
- 2 GB d'espace disque libre

### Pour macOS
- macOS 10.14+
- Xcode Command Line Tools
- 4 GB de RAM minimum

### Pour Linux
- Ubuntu 18.04+, Fedora 30+, ou distribution équivalente
- Bibliothèques de développement
- 4 GB de RAM minimum

## Installation rapide

### 1. Cloner ou copier le projet
```bash
# Si vous avez Git
git clone <repository-url>
cd Plannerr

# Sinon, copiez simplement le dossier Plannerr
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Générer les icônes
```bash
# Utilisez le script Node.js (recommandé)
node create-simple-icon.js

# Ou créez manuellement les icônes dans assets/
# - icon.png (512x512)
# - icon.ico (Windows)
# - icon.icns (macOS)
```

### 4. Tester l'application
```bash
npm start
```

## Construction pour différentes plateformes

### Méthode 1 : Scripts automatisés

#### Windows
```bash
# Exécutez le script batch
build-windows.bat
```

#### Linux/macOS
```bash
# Rendez le script exécutable
chmod +x build.sh

# Exécutez le script
./build.sh
```

### Méthode 2 : Commandes npm manuelles

#### Pour Windows
```bash
npm run build:win
```

#### Pour macOS
```bash
npm run build:mac
```

#### Pour Linux
```bash
npm run build:linux
```

#### Toutes les plateformes
```bash
npm run dist
```

## Structure des fichiers générés

### Windows
```
dist/
├── Sphere Planner Setup X.X.X.exe     # Installateur
├── Sphere Planner X.X.X.exe           # Version portable
└── Sphere Planner X.X.X.exe.blockmap  # Mise à jour delta
```

### macOS
```
dist/
├── Sphere Planner-X.X.X.dmg           # Image disque
└── Sphere Planner-X.X.X.dmg.blockmap  # Mise à jour delta
```

### Linux
```
dist/
├── naano-planner_X.X.X_amd64.deb     # Package Debian/Ubuntu
├── naano-planner-X.X.X.AppImage      # Application portable
└── *.AppImage.blockmap               # Mise à jour delta
```

## Installation

### Windows
1. Exécutez `Naano Planner Setup X.X.X.exe`
2. Suivez les instructions de l'assistant d'installation
3. L'application sera disponible dans le menu Démarrer

**Version portable :** Exécutez simplement `Naano Planner X.X.X.exe`

### macOS
1. Ouvrez `Naano Planner-X.X.X.dmg`
2. Glissez l'application dans le dossier Applications
3. Exécutez l'application depuis le Launchpad ou Applications

**Note :** Sur macOS, vous devrez peut-être autoriser l'application dans Préférences Système > Sécurité et confidentialité.

### Linux
#### Pour AppImage :
```bash
chmod +x naano-planner-X.X.X.AppImage
./naano-planner-X.X.X.AppImage
```

#### Pour Debian/Ubuntu :
```bash
sudo dpkg -i naano-planner_X.X.X_amd64.deb
```

## Personnalisation

### Icônes
Remplacez les fichiers dans `assets/` :
- `icon.png` - Icône principale (512x512)
- `icon.ico` - Icône Windows (256x256)
- `icon.icns` - Icône macOS (512x512)

### Configuration de l'application
Modifiez `package.json` :
- `name` : Nom du package
- `version` : Version de l'application
- `productName` : Nom affiché
- `appId` : Identifiant unique de l'application

### Configuration du build
Modifiez `electron-builder.yml` pour :
- Changer les paramètres spécifiques à la plateforme
- Ajouter des ressources supplémentaires
- Configurer la signature de code

## Dépannage

### Problèmes courants

#### 1. Erreur "electron-builder not found"
```bash
npm install electron-builder --save-dev
```

#### 2. Erreur de construction sur Windows
- Assurez-vous d'avoir les outils de build Windows
- Exécutez en tant qu'administrateur si nécessaire
- Vérifiez l'espace disque disponible

#### 3. Icônes manquantes
```bash
# Créez des icônes minimales
mkdir -p assets
touch assets/icon.png assets/icon.ico assets/icon.icns
```

#### 4. Problèmes de mémoire
```bash
# Augmentez la mémoire pour Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Logs de construction
Les logs détaillés sont disponibles dans :
- Terminal/Console pendant la construction
- Fichiers dans le dossier `dist/`
- Journal d'événements Windows (Windows)

## Développement

### Mode développement
```bash
npm start
```

### Débogage
- **Processus principal** : Utilisez `console.log()` dans `main.js`
- **Processus de rendu** : Ouvrez les DevTools (F12 ou Cmd+Alt+I)
- **Logs système** : Vérifiez les logs du système d'exploitation

### Mise à jour des dépendances
```bash
npm update
```

## Sécurité

### Stockage des données
- Les projets sont stockés localement dans le navigateur
- Les clés API sont chiffrées localement
- Aucune donnée n'est envoyée à des serveurs externes sans autorisation

### Signature de code
Pour la distribution publique, signez votre application :
- **Windows** : Certificat de signature de code
- **macOS** : Certificat développeur Apple
- **Linux** : Signature GPG (optionnel)

## Support

### Documentation
- `README-electron.md` - Documentation Electron
- `ICONS.md` - Instructions pour les icônes
- Commentaires dans le code source

### Signalement de problèmes
1. Vérifiez les logs de construction
2. Reproduisez le problème en mode développement
3. Créez un rapport avec :
   - Système d'exploitation et version
   - Étapes pour reproduire
   - Messages d'erreur complets

## Licence

© 2024 NaanoCorp. Tous droits réservés.

Ce logiciel est fourni tel quel, sans garantie d'aucune sorte.
```
