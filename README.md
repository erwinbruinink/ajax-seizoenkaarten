# Ajax Seizoenkaarten &middot; Vak 123

Beheer- en verdeel-app voor twee Ajax seizoenkaarten (Johan Cruijff ArenA, Vak 123, Rij 3, Stoel 302 & 303). Gebouwd met **Nuxt 3** (Vue 3 + TypeScript + Tailwind CSS) en **Vercel Postgres** met **Drizzle ORM**.

## Features

- PIN-login ("Wie ben jij?") voor Admins (Erwin, Sharon), Kinderen (Nova, Noor, Stijn) en Vrienden (gedeelde pincode + eigen naam)
- Next Match hero met live afteltimer, stadion-/parkeerinfo (P3 Mikado) met Waze/Google Maps links, en .ics agenda-download
- Speelschema met stoelbezetting per wedstrijd, filters (alles / vrije stoelen / mijn wedstrijden / resale)
- 5-dagen resale alert wanneer een wedstrijd bijna is en een stoel nog geen definitieve bezetting heeft
- Ticket-overdracht toggle ("Kaart verzonden in Ajax App")
- Eerlijke-verdeling dashboard (aantal wedstrijden per persoon)
- Admin-beheerpaneel: aanvragen goedkeuren/afwijzen, wedstrijden toevoegen/bewerken

## Projectstructuur

```
server/
  db/
    schema.ts        Drizzle schema (users, matches, seat_allocations)
    index.ts          Drizzle client (drizzle-orm/vercel-postgres)
    migrate.ts         Migratie-runner script
  utils/
    auth.ts            Sessie (JWT via jose) - cookie helpers
    pin.ts              PIN hashing (bcryptjs)
    ics.ts              .ics kalenderbestand generator
  api/                 Nitro API routes (auth, matches, seats, stats, users)
drizzle/               Gegenereerde SQL migraties (drizzle-kit generate)
scripts/seed.ts         Seed-script met de initiele seizoendata
pages/, components/,
composables/, layouts/  Nuxt frontend
```

## Lokale setup

1. **Dependencies installeren**
   ```bash
   npm install
   ```

2. **Env-variabelen**
   ```bash
   cp .env.example .env
   ```
   Vul in `.env`:
   - `POSTGRES_URL` - connectiestring van je Postgres database
   - `JWT_SECRET` - genereer met `openssl rand -base64 32`
   - `ADMIN_ERWIN_PIN`, `ADMIN_SHARON_PIN`, `CHILD_NOVA_PIN`, `CHILD_NOOR_PIN`, `CHILD_STIJN_PIN`, `FRIENDS_PIN` - kies zelf 4-cijferige pincodes (worden alleen gebruikt door het seed-script, nooit gecommit)

3. **Database migreren en seeden**
   ```bash
   npm run db:generate   # alleen nodig als je server/db/schema.ts wijzigt
   npm run db:migrate    # voert drizzle/*.sql uit tegen POSTGRES_URL
   npm run db:seed       # maakt de 6 profielen + alle thuiswedstrijden + bezetting aan
   ```

4. **Dev server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Deployen op Vercel

1. **Vercel Postgres aanmaken**
   - Vercel dashboard &rarr; project &rarr; tab **Storage** &rarr; **Create Database** &rarr; **Postgres**
   - Koppel de database aan dit project. Vercel zet automatisch `POSTGRES_URL` (en varianten) in de project env vars.

2. **Overige env vars zetten** (Project &rarr; Settings &rarr; Environment Variables)
   - `JWT_SECRET` (verplicht, genereer met `openssl rand -base64 32`)
   - `ADMIN_ERWIN_PIN`, `ADMIN_SHARON_PIN`, `CHILD_NOVA_PIN`, `CHILD_NOOR_PIN`, `CHILD_STIJN_PIN`, `FRIENDS_PIN` (alleen tijdelijk nodig om lokaal te seeden - zie stap 4)

3. **Pushen naar GitHub**
   ```bash
   git remote add origin git@github.com:<jouw-gebruiker>/ajax-seizoenkaarten.git
   git add .
   git commit -m "Initial commit: Ajax seizoenkaarten app"
   git push -u origin main
   ```

4. **Vercel project koppelen**
   ```bash
   npx vercel link
   npx vercel env pull .env    # haalt POSTGRES_URL van Vercel naar lokaal .env
   npm run db:migrate           # migreert de productie-database
   npm run db:seed              # eenmalig: seedt profielen + wedstrijden
   npx vercel --prod             # of: koppel de GitHub-repo in het Vercel dashboard voor auto-deploys
   ```

   > De seed-pincodes staan alleen in jouw lokale `.env` (nooit gecommit). Na het seeden mag je de `*_PIN` env vars weer verwijderen uit Vercel - ze worden nergens anders gebruikt dan door `scripts/seed.ts`.

5. Bezoek de gedeployde URL, log in met "Wie ben jij?" en de pincode die je hebt gekozen.

## Rollen samengevat

| Rol | Profielen | Rechten |
|---|---|---|
| ADMIN | Erwin, Sharon | Alles: stoelen direct toewijzen/overschrijven, wedstrijden toevoegen/bewerken, aanvragen goedkeuren/afwijzen, resale- en transfer-status zetten |
| CHILD | Nova, Noor, Stijn | Aanvraag doen voor een vrije stoel (komt op "in afwachting" tot admin-goedkeuring) |
| FRIEND | Vrienden (gedeelde pin) | Naam invullen + gedeelde pincode, aanvraag doen voor een vrije stoel |

## Belangrijk

- Aftraptijden zijn in de seed-data standaard op 20:00 gezet (niet gegeven in de brondata) - pas dit per wedstrijd aan via **Beheer &rarr; Alle wedstrijden beheren**.
- Alleen thuiswedstrijden worden bijgehouden; uitwedstrijden horen niet in dit model.
