# Barbershop Mo & Ma

Website met online afsprakensysteem voor Barbershop Mo & Ma in Volendam.

- **Website:** https://barbershopmoma.nl
- **Beheer:** https://barbershopmoma.nl/?page=admin

## Opbouw

| Onderdeel | Techniek | Hosting |
|---|---|---|
| Website (frontend) | React + Vite + Tailwind (`app/src`) | Cloudflare Pages |
| API + database (backend) | Express + SQLite (`app/server`) | Fly.io, app `barbershop-mo-ma-api` |

De frontend praat met de API via `https://barbershop-mo-ma-api.fly.dev/api`
(build-variabele `VITE_API_URL` in Cloudflare Pages).

## Deployen

**Frontend:** elke push naar `main` op GitHub wordt automatisch door Cloudflare Pages gebouwd en live gezet.

**Backend:**

```bash
cd app
fly deploy
```

De database en geüploade foto's staan op het permanente Fly-volume `/app/data`
(`FLY_VM=1` in `fly.toml`). Ze blijven dus bewaard bij een deploy.
Lokale databases en uploads gaan nooit mee in de image (zie `app/.dockerignore`).

### Instellingen op Fly

In `fly.toml`: `NODE_ENV`, `PORT`, `TZ=Europe/Amsterdam`, `APP_URL`, `FLY_VM`, `REMINDER_CRON_SCHEDULE`.

Secrets (`fly secrets set NAAM=waarde`):

| Secret | Doel |
|---|---|
| `JWT_SECRET` | Ondertekening van admin-logins |
| `SENDGRID_API_KEY` | Versturen van bevestigings- en herinneringsmails |
| `ADMIN_PASSWORD` | Optioneel: startwachtwoord, alleen gebruikt als er nog geen admin bestaat |

### Back-up van de database maken

```bash
cd app
fly ssh console -C "node -e \"new (require('sqlite3').Database)('/app/data/database.sqlite').run(\\\"VACUUM INTO '/app/data/backup.sqlite'\\\")\""
fly ssh sftp get /app/data/backup.sqlite ./backup.sqlite
```

## Lokaal ontwikkelen

```bash
cd app
npm install
npm run server   # API op http://localhost:3001
npm run dev      # website op http://localhost:5173
```

Zonder `SENDGRID_API_KEY` worden e-mails alleen in de console gelogd.

## Beheer

Inloggen met gebruikersnaam `admin`. Wijzig het wachtwoord via het sleutel-icoon in het dashboard;
het wordt bij een herstart niet overschreven.
