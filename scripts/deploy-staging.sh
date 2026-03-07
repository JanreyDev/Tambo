#!/bin/bash
# Manual deploy script for staging-bcmp.primex.ventures
# Usage: bash scripts/deploy-staging.sh
set -e

STAGING_HOST="159.89.207.105"
STAGING_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519"

echo "[1/4] Building Next.js standalone..."
pnpm build

echo "[2/4] Packaging deploy archive..."
cp package.json .next/standalone/
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cd .next/standalone
tar -czf ../../deploy.tar.gz --exclude="node_modules" .
cd ../..

echo "[3/4] Uploading to staging server..."
scp -i "$SSH_KEY" deploy.tar.gz "${STAGING_USER}@${STAGING_HOST}:/tmp/deploy.tar.gz"

echo "[4/4] Deploying on server..."
ssh -i "$SSH_KEY" "${STAGING_USER}@${STAGING_HOST}" << 'DEPLOY'
  set -e
  rm -rf /var/www/bcmp-web/*
  cd /var/www/bcmp-web
  tar -xzf /tmp/deploy.tar.gz
  npm install --omit=dev
  pm2 delete bcmp-web 2>/dev/null || true
  PORT=3000 HOSTNAME=0.0.0.0 NODE_ENV=production pm2 start server.js --name bcmp-web
  pm2 save
  rm /tmp/deploy.tar.gz
  echo "Deployed at $(date)"
DEPLOY

rm deploy.tar.gz
echo ""
echo "Deployed to https://staging-bcmp.primex.ventures"
