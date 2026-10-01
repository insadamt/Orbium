FROM php:8.4-fpm-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev libzip-dev libonig-dev unzip git \
    && docker-php-ext-install mbstring pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/orbium-uploads.ini

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader \
    && npm ci \
    && npm run build \
    && rm -rf node_modules \
    && cp -a public /opt/orbium-public \
    && mkdir -p storage/app storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/app/entrypoint.sh /usr/local/bin/orbium-entrypoint
RUN chmod +x /usr/local/bin/orbium-entrypoint

ENTRYPOINT ["orbium-entrypoint"]
CMD ["php-fpm"]
