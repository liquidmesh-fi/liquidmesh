#!/bin/sh
set -e

# Install onchainos CLI if not present
if ! command -v onchainos >/dev/null 2>&1; then
  echo "[startup] Installing onchainos CLI..."
  LATEST_TAG=$(curl -sSL "https://api.github.com/repos/okx/onchainos-skills/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": "\(.*\)".*/\1/')
  curl -sSL "https://raw.githubusercontent.com/okx/onchainos-skills/${LATEST_TAG}/install.sh" | sh
fi

# Authenticate onchainos with API key (non-interactive)
STATUS=$(onchainos wallet status 2>/dev/null || echo '{"ok":false}')
LOGGED_IN=$(echo "$STATUS" | grep -o '"loggedIn": *true' || echo "")

if [ -z "$LOGGED_IN" ]; then
  echo "[startup] Authenticating onchainos with API key..."
  onchainos wallet login
fi

# Switch to executor account for swap execution
if [ -n "$EXECUTOR_ACCOUNT_ID" ]; then
  echo "[startup] Switching to executor account..."
  onchainos wallet switch "$EXECUTOR_ACCOUNT_ID" >/dev/null 2>&1 || true
fi

echo "[startup] Ready"
exec bun run src/index.ts
