#!/bin/bash
set -euo pipefail

APP_NAME=${1:-}

if [ -z "$APP_NAME" ]; then
  echo "Usage: ./scripts/setup_app.sh app_name"
  exit 1
fi

if [ ! -d "$APP_NAME" ]; then
  echo "Directory '$APP_NAME' does not exist."
  exit 1
fi

echo "Adding core gems..."

cat template/Gemfile.extra >> "$APP_NAME/Gemfile"

docker compose run --rm -e APP_NAME="$APP_NAME" app bash -lc "cd \"$APP_NAME\" && bundle install"

echo "Installing RSpec..."
docker compose run --rm -e APP_NAME="$APP_NAME" app bash -lc "cd \"$APP_NAME\" && bin/rails generate rspec:install"

echo "Installing Devise..."
docker compose run --rm -e APP_NAME="$APP_NAME" app bash -lc "cd \"$APP_NAME\" && bin/rails generate devise:install"
docker compose run --rm -e APP_NAME="$APP_NAME" app bash -lc "cd \"$APP_NAME\" && bin/rails generate devise User"

echo "Installing Pundit..."
docker compose run --rm -e APP_NAME="$APP_NAME" app bash -lc "cd \"$APP_NAME\" && bin/rails generate pundit:install"

echo "Adding role column..."

docker compose run --rm -e APP_NAME="$APP_NAME" app bash -lc "cd \"$APP_NAME\" && bin/rails generate migration AddRoleToUsers role:integer"

docker compose run --rm -e APP_NAME="$APP_NAME" app bash -lc "cd \"$APP_NAME\" && bin/rails db:migrate"

echo "Setup complete."
