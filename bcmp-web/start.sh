#!/bin/bash
# Auto-rebuild Next.js if the production build is missing, then start on port 3002
if [ ! -f ".next/BUILD_ID" ]; then
  echo "[start.sh] .next build missing — rebuilding..."
  NODE_OPTIONS="--max-old-space-size=2048" npx next build
fi
exec npx next start -p 3002
