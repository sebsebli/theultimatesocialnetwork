#!/usr/bin/env bash
# Generate app icons, splash, favicon, and web icons from logo-source.png.
# Uses app background color #0B0B0C for all icon backgrounds.
# Requires ImageMagick (brew install imagemagick).
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE="$SCRIPT_DIR/logo-source.png"
WEB_PUBLIC="$REPO_ROOT/apps/web/public"
MOBILE_ASSETS="$REPO_ROOT/apps/mobile/assets"
APP_BG='#0B0B0C'

# Resize logo and replace black background with app color
icon_cmd() { magick "$SOURCE" -resize "$1" -fuzz 2% -fill "$APP_BG" -opaque black "$2"; }

if [[ ! -f "$SOURCE" ]]; then
  echo "Missing $SOURCE. Add logo-source.png to scripts/."
  exit 1
fi

echo "Generating icons from $SOURCE (background $APP_BG)"

# --- Web: public ---
mkdir -p "$WEB_PUBLIC"

# Favicon sizes (PNG)
icon_cmd 16x16 "$WEB_PUBLIC/favicon-16x16.png"
icon_cmd 32x32 "$WEB_PUBLIC/favicon-32x32.png"
icon_cmd 48x48 "$WEB_PUBLIC/favicon-48x48.png"

# Multi-size favicon.ico (16 + 32)
icon_cmd 16x16 "$WEB_PUBLIC/favicon-16.png"
icon_cmd 32x32 "$WEB_PUBLIC/favicon-32.png"
magick "$WEB_PUBLIC/favicon-16.png" "$WEB_PUBLIC/favicon-32.png" "$WEB_PUBLIC/favicon.ico"
rm -f "$WEB_PUBLIC/favicon-16.png" "$WEB_PUBLIC/favicon-32.png"

# PWA / manifest
icon_cmd 192x192 "$WEB_PUBLIC/icon-192.png"
icon_cmd 512x512 "$WEB_PUBLIC/icon-512.png"

# Apple touch icon
icon_cmd 180x180 "$WEB_PUBLIC/apple-touch-icon.png"

# Extra PWA sizes (optional but recommended)
icon_cmd 72x72   "$WEB_PUBLIC/icon-72.png"
icon_cmd 96x96   "$WEB_PUBLIC/icon-96.png"
icon_cmd 128x128 "$WEB_PUBLIC/icon-128.png"
icon_cmd 144x144 "$WEB_PUBLIC/icon-144.png"
icon_cmd 152x152 "$WEB_PUBLIC/icon-152.png"

# Legacy single icon.png for manifest if referenced
cp "$WEB_PUBLIC/icon-192.png" "$WEB_PUBLIC/icon.png"

echo "Web icons written to $WEB_PUBLIC"

# --- Mobile: assets ---
mkdir -p "$MOBILE_ASSETS"

# App icon (Expo: 1024x1024)
icon_cmd 1024x1024 "$MOBILE_ASSETS/icon.png"

# Adaptive icon foreground (Android)
icon_cmd 1024x1024 "$MOBILE_ASSETS/adaptive-icon.png"

# Splash icon (centered icon for splash screen)
icon_cmd 1024x1024 "$MOBILE_ASSETS/splash-icon.png"

# Full splash image: canvas #0B0B0C with centered logo (portrait 1284x2778)
SPLASH_W=1284
SPLASH_H=2778
LOGO_SIZE=512
magick -size "${SPLASH_W}x${SPLASH_H}" xc:"$APP_BG" \
  \( "$SOURCE" -resize "${LOGO_SIZE}x${LOGO_SIZE}" -fuzz 2% -fill "$APP_BG" -opaque black \) \
  -gravity center -composite "$MOBILE_ASSETS/splash.png"

# Web favicon for Expo web
icon_cmd 48x48 "$MOBILE_ASSETS/favicon.png"

echo "Mobile icons written to $MOBILE_ASSETS"
echo "Done."
