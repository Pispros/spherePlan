#!/bin/bash

# Script pour générer des icônes valides pour Sphere Planner
# Avec transparence correctement préservée

set -e

echo "==========================================="
echo "Génération des icônes pour Sphere Planner"
echo "==========================================="
echo ""

# Vérifier ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ Erreur: ImageMagick (convert) n'est pas installé."
    echo "   - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "   - macOS: brew install imagemagick"
    exit 1
fi

# Vérifier png2icns pour Linux (optionnel mais recommandé)
HAS_PNG2ICNS=false
if command -v png2icns &> /dev/null; then
    HAS_PNG2ICNS=true
fi

mkdir -p assets

# Trouver le logo source
LOGO_SOURCE=""
if [ -f "logo.png" ]; then
    LOGO_SOURCE="logo.png"
elif [ -f "logo.svg" ]; then
    LOGO_SOURCE="logo.svg"
elif [ -f "assets/logo.png" ]; then
    LOGO_SOURCE="assets/logo.png"
fi

if [ -z "$LOGO_SOURCE" ]; then
    echo "❌ Aucun logo source trouvé (logo.png, logo.svg ou assets/logo.png)"
    exit 1
fi

echo "✓ Logo source : $LOGO_SOURCE"
echo ""

# ─────────────────────────────────────────────────────────────
# 1. Génération des PNG aux différentes tailles
# ─────────────────────────────────────────────────────────────
# IMPORTANT : on utilise PNG32: pour FORCER le format RGBA
# et on N'UTILISE PAS -alpha background (qui écrase la transparence !)
echo "Génération des PNG..."

# Squarifier le logo avant resize (le logo source n'est pas forcément carré)
# -extent ajoute du padding transparent pour obtenir un canvas carré
LOGO_SQUARE="assets/_logo_square.png"
convert "$LOGO_SOURCE" \
    -background none \
    -gravity center \
    -extent "$(identify -format '%[fx:max(w,h)]x%[fx:max(w,h)]' "$LOGO_SOURCE")" \
    PNG32:"$LOGO_SQUARE"

for size in 16 32 64 128 256 512 1024; do
    convert "$LOGO_SQUARE" \
        -background none \
        -resize ${size}x${size} \
        PNG32:"assets/icon_${size}x${size}.png"
    echo "  ✓ ${size}x${size}"
done

rm -f "$LOGO_SQUARE"

cp "assets/icon_512x512.png" "assets/icon.png"
echo "✓ PNG principal : assets/icon.png"
echo ""

# ─────────────────────────────────────────────────────────────
# 2. ICO Windows
# ─────────────────────────────────────────────────────────────
# IMPORTANT : pas de -colors 256 (ça casse l'alpha)
# On force PNG32 en entrée pour conserver l'alpha
echo "Génération de l'ICO Windows..."
convert \
    assets/icon_16x16.png \
    assets/icon_32x32.png \
    assets/icon_48x48.png 2>/dev/null \
    assets/icon_64x64.png \
    assets/icon_128x128.png \
    assets/icon_256x256.png \
    -background none \
    assets/icon.ico 2>/dev/null || \
convert \
    assets/icon_16x16.png \
    assets/icon_32x32.png \
    assets/icon_64x64.png \
    assets/icon_128x128.png \
    assets/icon_256x256.png \
    -background none \
    assets/icon.ico

echo "✓ ICO : assets/icon.ico"
echo ""

# ─────────────────────────────────────────────────────────────
# 3. ICNS macOS
# ─────────────────────────────────────────────────────────────
echo "Génération de l'ICNS macOS..."

if command -v iconutil &> /dev/null; then
    # ✅ Méthode officielle macOS
    mkdir -p assets/icon.iconset
    cp assets/icon_16x16.png    assets/icon.iconset/icon_16x16.png
    cp assets/icon_32x32.png    assets/icon.iconset/icon_16x16@2x.png
    cp assets/icon_32x32.png    assets/icon.iconset/icon_32x32.png
    cp assets/icon_64x64.png    assets/icon.iconset/icon_32x32@2x.png
    cp assets/icon_128x128.png  assets/icon.iconset/icon_128x128.png
    cp assets/icon_256x256.png  assets/icon.iconset/icon_128x128@2x.png
    cp assets/icon_256x256.png  assets/icon.iconset/icon_256x256.png
    cp assets/icon_512x512.png  assets/icon.iconset/icon_256x256@2x.png
    cp assets/icon_512x512.png  assets/icon.iconset/icon_512x512.png
    cp assets/icon_1024x1024.png assets/icon.iconset/icon_512x512@2x.png

    iconutil -c icns assets/icon.iconset -o assets/icon.icns
    rm -rf assets/icon.iconset
    echo "✓ ICNS (iconutil) : assets/icon.icns"

elif [ "$HAS_PNG2ICNS" = true ]; then
    # ✅ Méthode Linux propre avec icnsutils
    png2icns assets/icon.icns \
        assets/icon_16x16.png \
        assets/icon_32x32.png \
        assets/icon_128x128.png \
        assets/icon_256x256.png \
        assets/icon_512x512.png \
        assets/icon_1024x1024.png
    echo "✓ ICNS (png2icns) : assets/icon.icns"

else
    # ⚠️  Fallback ImageMagick — qualité dégradée mais transparence préservée
    convert \
        assets/icon_16x16.png \
        assets/icon_32x32.png \
        assets/icon_128x128.png \
        assets/icon_256x256.png \
        assets/icon_512x512.png \
        -background none \
        assets/icon.icns

    echo "⚠️  ICNS (ImageMagick fallback) : assets/icon.icns"
    echo "    Pour une meilleure qualité, installe icnsutils :"
    echo "    sudo apt-get install icnsutils"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# Nettoyage
# ─────────────────────────────────────────────────────────────
# On garde uniquement icon.png, icon.ico et icon.icns
rm -f assets/icon_16x16.png \
      assets/icon_32x32.png \
      assets/icon_64x64.png \
      assets/icon_128x128.png \
      assets/icon_256x256.png \
      assets/icon_512x512.png \
      assets/icon_1024x1024.png

echo "==========================================="
echo "✅ Icônes générées avec transparence !"
echo ""
echo "  • assets/icon.png   (PNG 512x512)"
echo "  • assets/icon.ico   (Windows)"
echo "  • assets/icon.icns  (macOS)"
echo "==========================================="
