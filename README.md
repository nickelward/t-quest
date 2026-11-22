# T-Quest 🚋

**Your night out, routed by the T.** Tell T-Quest your budget, crew size, time, starting station, vibe and craving. A Mastra AI agent running on Gemini picks real spots from our Tiger Data database, orders them into a route along the MBTA, and returns a quest with live train times, per-person cost, and a last-train warning so nobody gets stranded.

Built at BostonHacks 2026 for the **Bos(tons) of Eats and Streets** track.

## How it works
1. **Form**: budget/person, group size, hours, start station, vibe (chill / big night / explore / study / late night), craving, 21+ toggle
2. **Mastra agent (Gemini)** calls tools:
   - `searchPlaces` queries Tiger Data Postgres (filters on price, vibe, hours, group size, 21+)
   - `getLastTrain` queries the MBTA v3 schedules API
3. **Server** turns the plan into a route: T line, transfers, "get off at" stop, **live next-train times** (MBTA predictions API), cost per person and for the whole crew, warnings (over budget, too long, last train)
4. **Gamification**: check in at each stop to collect stamps; finishing a quest unlocks badges (line riders, Night Owl)
5. **Reliability**: no Gemini key or the API fails → rule-based fallback planner. No DATABASE_URL → local `data/places.json`. The demo never dies.

## Run it
```bash
npm install
cp .env.example .env.local   # add your keys
npm run seed                 # creates the users and places tables
npm run dev                  # http://localhost:3000
```

## Authentication

The login and signup pages use the integrated Next.js auth routes:

- `DATABASE_URL` connects to the Postgres/Tiger Data database
- `JWT_SECRET` signs and verifies the two-hour session token
- New accounts are stored in the `users` table with bcrypt password hashes
- The quest page requires a valid session; use the Log out button to end it

### Maintainer test account

Create a maintainer account as a regular database user; it uses the same password verification and login flow as any other account. Set `APP_ENV=development` and fill in the `MAINTAINER_*` values in your ignored `.env.local` with a unique email, username, names, and a strong password of at least 12 characters. Then run:

```bash
npm run seed:maintainer
```

For staging, use a separate isolated staging database and set `APP_ENV=staging`, `MAINTAINER_SEED_ENABLED=true`, and `ISOLATED_STAGING_DB=true` along with the account values. A production `NODE_ENV` is accepted only with those explicit staging settings. The script creates the account once; it will not change the password of an existing account.

## Tiger Data setup
1. Create a free service at Tiger Data and copy the connection string into `DATABASE_URL`
2. `npm run seed` creates the `places` table and loads `data/places.json`

## Deploy
Push to GitHub, import into Vercel, add the env vars, then point your GoDaddy Registry domain at it.

## Stack
Next.js 15 · Mastra · Gemini API · Tiger Data (Postgres) · MBTA v3 API

## ⚠️ Data note
`data/places.json` is a starter list. Prices and hours are approximate, so verify before the demo and add more spots.
