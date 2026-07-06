#!/bin/bash
if [ ! -f ".next/BUILD_ID" ]; then
  echo "[start-prod.sh] .next build missing — rebuilding..."
  NODE_OPTIONS="--max-old-space-size=2048" npx next build
fi
exec npx next start -p 3004
