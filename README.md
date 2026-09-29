# Orbium — Phase 2 document editor

Orbium is a self-hosted knowledge workspace. Workspaces and hierarchy organize content; Phase 2 adds structured documents with Markdown shortcuts, block controls, mentions, attachments, math, diagrams, and autosave. Database views arrive in Phase 3. The implementation brief is in [`Docs/`](Docs/START_HERE.md).

## Start with Docker

Requirements: Docker with Compose.

1. Copy `.env.example` to `.env`.
2. Set a private, non-default `DB_PASSWORD` in `.env`.
3. Generate an application key:

    ```bash
    docker compose run --rm --entrypoint php app artisan key:generate --show
    ```

    Paste the printed `base64:...` value into `APP_KEY` in `.env`.

4. Run `docker compose up --build -d`.
5. Open `http://localhost:18082` (or the port set by `ORBIUM_PORT`). Create an account, then sign in.

The app runs migrations at startup. PostgreSQL and uploaded application files use named Docker volumes. `docker compose down` keeps them; `docker compose down -v` deletes them. Keep the same `APP_KEY` when restarting or updating. For internet exposure, put HTTPS in front of nginx and set `APP_URL` to the public HTTPS URL. A future Orbium portable archive is different from a server backup; back up the database and application file volume together until archive export arrives in Phase 6.

## Local development with `php artisan serve`

PHP and Vite run on your machine. Only PostgreSQL needs to run in Docker, so editing PHP or frontend code does not rebuild the app image. You need PHP 8.4 or newer with `pdo_pgsql`, Composer, Node.js 22, and npm. On Arch Linux, install and enable the PHP driver once:

```bash
sudo pacman -S php-pgsql
printf 'extension=pdo_pgsql\n' | sudo tee /etc/php/conf.d/pdo_pgsql.ini >/dev/null
php -m | rg '^pdo_pgsql$'
```

The last command should print `pdo_pgsql`. Installing `php-pgsql` alone leaves the extension disabled in Arch's default `php.ini`.

One-time setup:

1. Copy `.env.example` to `.env` if it does not exist. Keep any existing `APP_KEY` and `DB_PASSWORD` so your existing account and data remain accessible. Set a private `DB_PASSWORD` if this is a new installation.
2. Set `APP_ENV=local`, `APP_DEBUG=true`, `APP_URL=http://localhost:8000`, `DB_HOST=127.0.0.1`, and `DB_PORT=54329` in `.env`. If you changed `ORBIUM_DB_PORT`, use that port instead of `54329`.
3. Install dependencies and start PostgreSQL:

    ```bash
    docker compose up -d postgres
    composer install
    npm ci
    ```

4. If `APP_KEY` is empty, run `php artisan key:generate` once. Then run `php artisan migrate` and `npm run build`.

For daily development, start `npm run dev` and `php artisan serve` in separate terminals, then open `http://localhost:8000`. PostgreSQL stays running between app restarts and restarts after a machine reboot once the Compose service has been created. If you stop it explicitly, start it again with `docker compose up -d postgres`. This command does not build the PHP app image. If you only need the last built frontend assets, `php artisan serve` is enough without `npm run dev`.

The Compose app keeps production mode and uses its own database host and port. If you also run the Docker web app from this local `.env`, set `ORBIUM_DOCKER_APP_URL=http://localhost:18082` (or its public URL) so its generated links do not point at port 8000. Files uploaded through Docker's app container live in its named `app_storage` volume; local PHP uses this checkout's `storage/app`. To use older Docker uploads locally while the app container is available, copy them once with `docker compose cp app:/var/www/html/storage/app/. storage/app/`.

New installations run the workspace, node, and document migrations at startup. Existing installations keep their accounts; the document migration adds empty document bodies to existing document nodes. The user performs manual acceptance; no automated tests are authored or run by request.

## Checks

```bash
./vendor/bin/pint --test
npm run types:check
npm run lint
npm run build
composer types:check
```

The user manually validates each phase. The lint, type, formatting, and build commands above are the development checks for this phase.
