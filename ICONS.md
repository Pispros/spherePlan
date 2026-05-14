# Instructions pour les icônes - Naano Planner

## Icônes requises

Pour construire l'application Electron, vous avez besoin des icônes suivantes dans le dossier `assets/` :

### Icônes principales
1. **icon.png** (512x512 pixels) - Icône principale
2. **icon.ico** (256x256 pixels) - Icône Windows
3. **icon.icns** (512x512 pixels) - Icône macOS

### Icônes supplémentaires (optionnelles)
- **icon_small.png** (128x128)
- **icon_tiny.png** (64x64)
- **icon_micro.png** (32x32)
- **icon_nano.png** (16x16)

## Méthodes de génération

### Méthode 1 : Utiliser le script Python (recommandé)
```bash
# Assurez-vous d'avoir Python 3 et Pillow installé
python3 -m pip install Pillow

# Exécutez le script de génération
python3 generate-icon.py
```

### Méthode 2 : Générer manuellement

#### Pour Windows (.ico)
1. Créez une image 256x256 pixels
2. Utilisez un convertisseur en ligne ou un outil comme GIMP
3. Enregistrez au format `.ico`

#### Pour macOS (.icns)
```bash
# Si vous avez une image icon.png (512x512)
sips -s format icns assets/icon.png --out assets/icon.icns

# Alternative avec iconutil (macOS uniquement)
mkdir icon.iconset
# Créez des images aux tailles requises :
# icon_16x16.png, icon_16x16@2x.png (32x32)
# icon_32x32.png, icon_32x32@2x.png (64x64)
# icon_128x128.png, icon_128x128@2x.png (256x256)
# icon_256x256.png, icon_256x256@2x.png (512x512)
# icon_512x512.png, icon_512x512@2x.png (1024x1024)
iconutil -c icns icon.iconset -o assets/icon.icns
```

### Méthode 3 : Utiliser des outils en ligne
1. **Favicon.io** - Génère .ico, .icns, et favicons
2. **CloudConvert** - Conversion entre formats
3. **ImageMagick** (en ligne de commande)

## Vérification

Après avoir généré les icônes, vérifiez que :
1. Le dossier `assets/` contient au moins `icon.png`, `icon.ico`, et `icon.icns`
2. Les fichiers ne sont pas vides (taille > 0)
3. Les formats sont corrects

## Dépannage

### Problème : Les icônes ne s'affichent pas
- Vérifiez les chemins dans `package.json` et `electron-builder.yml`
- Assurez-vous que les icônes sont dans le dossier `assets/`
- Vérifiez les permissions des fichiers

### Problème : Erreur de construction
- Si les icônes manquent, créez des fichiers vides :
```bash
mkdir -p assets
touch assets/icon.png assets/icon.ico assets/icon.icns
```

### Problème : Icônes de mauvaise qualité
- Utilisez des images vectorielles (SVG) comme source
- Exportez en haute résolution (minimum 512x512)
- Évitez la compression avec perte

## Icônes par défaut

Si vous ne pouvez pas générer d'icônes, l'application utilisera l'icône par défaut d'Electron. Cependant, il est fortement recommandé de créer des icônes personnalisées pour une expérience utilisateur professionnelle.

## Ressources utiles

- **Design d'icône** : Canva, Figma, Adobe Illustrator
- **Conversion** : ImageMagick, GIMP, Photoshop
- **Validation** : `file` command (Linux/macOS) pour vérifier les formats

## Notes pour le développement

1. Les icônes sont mises en cache par le système d'exploitation
2. Après avoir changé les icônes, vous devrez peut-être :
   - Supprimer le cache de l'application
   - Réinstaller l'application
   - Redémarrer l'explorateur de fichiers (Windows)
3. Pour les tests rapides, utilisez des icônes temporaires

## Support multiplateforme

| Plateforme | Format | Taille recommandée | Notes |
|------------|--------|-------------------|-------|
| Windows | .ico | 256x256 | Supporte plusieurs tailles dans un fichier |
| macOS | .icns | 512x512 | Format conteneur Apple |
| Linux | .png | 512x512 | Utilise PNG pour la plupart des distributions |

```

<function_calls>
<invoke name="edit_file">
<parameter name="display_description" string="true">Créer un script simple pour générer une icône de base sans dépendances</parameter>
<parameter name="path" string="true">Plannerr/create-simple-icon.js</parameter>
<parameter name="mode" string="true">create</parameter>
</invoke>
</function_calls>