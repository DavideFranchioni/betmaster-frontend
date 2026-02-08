#!/bin/bash
# BetMaster Backend Deploy Script (Windows-compatible: uses tar+scp)
# Usage: bash scripts/deploy-backend.sh

set -e

VPS_HOST="95.217.216.153"
VPS_USER="root"
REMOTE_DIR="/opt/betmaster"
BACKEND_DIR="backend"

echo "=== BetMaster Backend Deploy ==="
echo "Target: ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"

# Create tarball (excluding non-deploy files)
echo ""
echo "[1/4] Packaging backend..."
tar --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='*.db' \
    --exclude='ninjabet_session.json' \
    --exclude='logs' \
    --exclude='*.png' \
    --exclude='*.pkl' \
    --exclude='venv' \
    -czf /tmp/backend.tar.gz -C "${BACKEND_DIR}" .
echo "Package: $(du -h /tmp/backend.tar.gz | cut -f1)"

# Upload
echo ""
echo "[2/4] Uploading to VPS..."
scp /tmp/backend.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/backend.tar.gz

# Deploy on server
echo ""
echo "[3/4] Deploying on server..."
ssh ${VPS_USER}@${VPS_HOST} "
    set -e
    cd ${REMOTE_DIR}/backend
    tar xzf /tmp/backend.tar.gz
    rm /tmp/backend.tar.gz

    # Create .env if missing
    if [ ! -f ${REMOTE_DIR}/backend/.env ]; then
        cp ${REMOTE_DIR}/backend/.env.production ${REMOTE_DIR}/backend/.env
        echo 'Created .env from .env.production'
    fi

    # Install deps
    cd ${REMOTE_DIR}
    . venv/bin/activate
    pip install -q -r backend/requirements.txt 2>&1 | tail -5

    # Fix ownership
    chown -R betmaster:betmaster ${REMOTE_DIR}
"

# Restart
echo ""
echo "[4/4] Restarting service..."
ssh ${VPS_USER}@${VPS_HOST} "
    systemctl restart betmaster
    sleep 2
    systemctl is-active betmaster && echo 'Service: RUNNING' || echo 'Service: FAILED'
"

# Cleanup
rm -f /tmp/backend.tar.gz

echo ""
echo "=== Backend deploy complete! ==="
echo "API: https://matchapi.tradinglegend.ai"
