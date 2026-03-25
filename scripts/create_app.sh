#!/bin/bash
set -euo pipefail

APP_NAME=${1:-}

if [ -z "$APP_NAME" ]; then
  echo "Usage: ./scripts/create_app.sh app_name"
  exit 1
fi

if [ -d "$APP_NAME" ]; then
  echo "Directory '$APP_NAME' already exists."
  exit 1
fi

docker compose run --rm -e APP_NAME="$APP_NAME" app rails new "$APP_NAME" \
  --database=mysql \
  --api \
  --skip-javascript \
  --skip-hotwire

echo "Rails app '$APP_NAME' created."
