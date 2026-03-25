#!/bin/bash
set -e

APP_ROOT="/workspace/${APP_NAME:-my_app}"

if [ -f "$APP_ROOT/tmp/pids/server.pid" ]; then
  rm "$APP_ROOT/tmp/pids/server.pid"
fi

exec "$@"
