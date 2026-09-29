# Orbium — Phase 0 foundation

Orbium is a self-hosted knowledge workspace. This phase provides accounts, appearance controls, and the application shell. Workspaces and knowledge content begin in Phase 1. The implementation brief is in [`Docs/`](Docs/START_HERE.md).

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
5. Open `http://localhost:8081` (or the port set by `ORBIUM_PORT`). Create an account, then sign in.

The app runs migrations at startup. PostgreSQL and uploaded application files use named Docker volumes. `docker compose down` keeps them; `docker compose down -v` deletes them. Keep the same `APP_KEY` when restarting or updating. For internet exposure, put HTTPS in front of nginx and set `APP_URL` to the public HTTPS URL. A future Orbium portable archive is different from a server backup; back up the database and application file volume together until archive export arrives in Phase 6.

## Development

The PHP application requires PHP 8.4 or newer with `pdo_pgsql`, Composer, Node.js 22, npm, and PostgreSQL with the `pg_trgm` extension available. The checked-in `.env.example` uses the Compose service name `postgres`; set `DB_HOST=127.0.0.1` when running PHP on the host against a host-accessible PostgreSQL server.

Copy `.env.example` to `.env`, set the local database credentials, `DB_HOST=127.0.0.1`, and `APP_ENV=local` before running. If PostgreSQL is provided by Compose, use `DB_PORT=54329` (or `ORBIUM_DB_PORT`). Set `APP_URL=http://localhost:8000` for `php artisan serve`.

```bash
composer install
npm ci
php artisan key:generate
php artisan migrate
npm run dev
php artisan serve
```

For a separate test database, create `orbium_test` in PostgreSQL and set the test environment's `DB_DATABASE=orbium_test`. Phase 0 has no authored tests by user request.

## Checks

```bash
./vendor/bin/pint --test
npm run types:check
npm run lint
npm run build
composer types:check
```

Vitest and Playwright commands are configured for future phases. This phase intentionally does not run automated tests.
