#!/bin/bash
# obfuscate.sh — Minifikasi + Obfuskasi semua file JS
# Jalankan sekali sebelum push ke GitHub
# Requirement: Node.js + npx

echo "📦 Install Terser..."
npm install terser --save-dev 2>/dev/null || npx terser --version

echo ""
echo "🔧 Minifikasi + Obfuskasi..."

FILES=("app" "auth" "api" "renderer")

for f in "${FILES[@]}"; do
  INPUT="js/${f}.js"
  OUTPUT="js/${f}.min.js"
  
  npx terser "$INPUT" \
    --compress \
    --mangle \
    --output "$OUTPUT"
  
  echo "  ✅ ${INPUT} → ${OUTPUT}"
done

echo ""
echo "📝 Update canvas-entry.html ke versi .min.js"
sed 's|/js/app.js|/js/app.min.js|g' canvas-entry.html > canvas-entry-prod.html
echo "  ✅ canvas-entry-prod.html siap"

echo ""
echo "✨ Selesai! Upload semua file ke GitHub."
echo "   Gunakan canvas-entry-prod.html (bukan canvas-entry.html) di Canvas Gemini."
