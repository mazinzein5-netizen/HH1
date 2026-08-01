#!/bin/sh
set -e

LOG=/root/HH1/deploy.log
echo "$(date): === HEALTH HIVE AUTONOMOUS DEPLOY ===" > "$LOG"

# ─── Step 1: Wait for pnpm install to finish ──────────────────
echo "$(date): Waiting for pnpm install (PID 29436)..." >> "$LOG"
while kill -0 29436 2>/dev/null; do
  sleep 10
done
echo "$(date): pnpm install process ended" >> "$LOG"

# Check if install succeeded
if [ ! -d "/root/HH1/node_modules/.pnpm" ]; then
  echo "$(date): pnpm install may have failed, retrying..." >> "$LOG"
  cd /root/HH1 && pnpm install --ignore-scripts >> "$LOG" 2>&1 || {
    echo "$(date): INSTALL FAILED — trying npm approach" >> "$LOG"
  }
fi

# Verify workspace links
if [ ! -d "/root/HH1/node_modules/@workspace/website" ]; then
  echo "$(date): Workspace links missing, running pnpm install again..." >> "$LOG"
  cd /root/HH1 && pnpm install >> "$LOG" 2>&1 || true
fi

echo "$(date): node_modules check:" >> "$LOG"
ls /root/HH1/node_modules/@workspace/ 2>/dev/null >> "$LOG" 2>&1 || echo "NO WORKSPACE LINKS" >> "$LOG"
ls /root/HH1/node_modules/.bin/vite 2>/dev/null >> "$LOG" 2>&1 || echo "NO VITE BINARY" >> "$LOG"

# ─── Step 2: Build ────────────────────────────────────────────
echo "$(date): Starting build..." >> "$LOG"
cd /root/HH1

# Try pnpm build first
pnpm --filter @workspace/website run build >> "$LOG" 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo "$(date): pnpm build failed (exit $BUILD_EXIT), trying direct vite..." >> "$LOG"
  cd /root/HH1/artifacts/website
  node ../../node_modules/.pnpm/vite@*/node_modules/vite/bin/vite.js build --config vite.config.ts >> "$LOG" 2>&1
  BUILD_EXIT=$?
fi

if [ $BUILD_EXIT -ne 0 ]; then
  echo "$(date): BUILD FAILED" >> "$LOG"
  echo "CHECK LOG: /root/HH1/deploy.log" >> "$LOG"
  exit 1
fi

echo "$(date): BUILD SUCCEEDED" >> "$LOG"

# Check output
ls -la /root/HH1/artifacts/website/dist/public/ >> "$LOG" 2>&1 || echo "NO DIST OUTPUT" >> "$LOG"

# ─── Step 3: Deploy to Vercel ─────────────────────────────────
echo "$(date): Starting Vercel deploy..." >> "$LOG"

# Check if vercel CLI is available
if ! command -v vercel &>/dev/null; then
  npm install -g vercel >> "$LOG" 2>&1
fi

# Deploy — token must be set via env or we use the CLI
cd /root/HH1/artifacts/website
vercel --yes --prod=false 2>&1 >> "$LOG"
DEPLOY_EXIT=$?

if [ $DEPLOY_EXIT -ne 0 ]; then
  echo "$(date): VERCEL DEPLOY FAILED (exit $DEPLOY_EXIT)" >> "$LOG"
  echo "Likely needs authentication. Manual deploy required." >> "$LOG"
  exit 1
fi

echo "$(date): DEPLOY COMPLETE" >> "$LOG"
echo "=== DONE ===" >> "$LOG"
