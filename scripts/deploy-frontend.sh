#!/bin/bash
# BetMaster Frontend Deploy Script
# Builds and pushes to GitHub → Cloudflare Pages auto-deploys
# Usage: bash scripts/deploy-frontend.sh

set -e

echo "=== BetMaster Frontend Deploy ==="

# Build with production env
echo "[1/3] Building frontend (static export)..."
npm run build

echo ""
echo "[2/3] Build output:"
ls -la out/ | head -5
echo "  ... $(find out -type f | wc -l) files total"

# Git push triggers Cloudflare Pages
echo ""
echo "[3/3] Pushing to GitHub (triggers Cloudflare Pages deploy)..."
git add -A
git status --short

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "No changes to commit. Pushing existing commits..."
else
    git commit -m "Deploy frontend $(date +%Y-%m-%d_%H:%M)"
fi

git push origin main

echo ""
echo "=== Frontend deploy triggered! ==="
echo "Cloudflare Pages will build and deploy automatically."
echo "Site: https://match.tradinglegend.ai"
