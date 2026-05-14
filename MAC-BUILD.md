# Build SpherePlan pour macOS

Guide rapide pour générer le `.dmg` de SpherePlan sur ton Mac.

## Prérequis

- **macOS** (Intel ou Apple Silicon)
- **Node.js 18+** → [télécharger ici](https://nodejs.org/) ou via Homebrew : `brew install node`
- **Yarn** → `npm install -g yarn`
- **Git** → déjà installé sur macOS, sinon `xcode-select --install`

## Étapes

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd Planner
```

### 2. Installer les dépendances

```bash
yarn install
```

### 3. Builder

```bash
yarn build:mac
```

### 4. Récupérer le résultat

Le `.dmg` se trouve dans le dossier `dist/` :

```
dist/SpherePlan-1.0.0.dmg
```

Double-clique dessus pour installer l'app.

## Problèmes fréquents

**« SpherePlan ne peut pas être ouvert car son développeur ne peut pas être vérifié »**

C'est normal : l'app n'est pas signée avec un certificat Apple Developer. Pour l'ouvrir :

- Clic droit sur l'app → **Ouvrir** → **Ouvrir** dans la boîte de dialogue

Ou en ligne de commande :

```bash
xattr -cr /Applications/SpherePlan.app
```

**Erreur `dmg-license` manquant**

Tu n'es pas sur macOS. Ce build ne fonctionne que sur un vrai Mac.

**Build bloqué ou très lent**

Vérifie que tu as au moins 4 Go de RAM libre et 2 Go d'espace disque.

## Contact

NaanoCorp — pispros@naanocorp.tech
