#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY is required. Generate one with: docker compose run --rm app php artisan key:generate --show" >&2
    exit 1
fi

mkdir -p storage/app storage/framework/cache storage/framework/sessions storage/framework/views storage/logs
cp -a /opt/orbium-public/. public/
chown -R www-data:www-data storage bootstrap/cache
php artisan migrate --force

exec "$@"
