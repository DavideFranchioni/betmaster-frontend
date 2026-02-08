#!/bin/bash
# BetMaster Full Deploy (Frontend + Backend)
# Usage: bash scripts/deploy.sh

set -e

echo "================================================"
echo "    BetMaster Full Deploy"
echo "================================================"
echo ""

# Deploy backend first
bash scripts/deploy-backend.sh

echo ""
echo "------------------------------------------------"
echo ""

# Deploy frontend
bash scripts/deploy-frontend.sh

echo ""
echo "================================================"
echo "    Deploy Complete!"
echo "================================================"
echo "Frontend: https://match.tradinglegend.ai"
echo "Backend:  https://api.match.tradinglegend.ai"
echo "================================================"
