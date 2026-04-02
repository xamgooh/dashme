# Dashme

Search Performance Dashboard — Next.js 14 + PostgreSQL + Google Search Console API, deployed on Railway.

---

## Stack

- **Next.js 14** App Router, TypeScript
- **PostgreSQL** via Railway
- **Prisma** ORM
- **Google Search Console API** — OAuth 2.0
- **Chart.js** via react-chartjs-2

---

## Setup lokalt

```bash
git clone <repo>
cd dashme
npm install
cp .env.example .env.local
```

Fyll i `.env.local` (se nedan), sedan:

```bash
npm run db:push   # skapar tabellerna
npm run dev       # startar på localhost:3000
```

---

## Google Cloud Console

1. Gå till [console.cloud.google.com](https://console.cloud.google.com)
2. Skapa nytt projekt: `dashme`
3. Aktivera **Google Search Console API**
4. Credentials → Create credentials → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback` (dev)
     - `https://your-app.railway.app/api/auth/callback` (prod)
5. Kopiera Client ID och Client Secret till `.env.local`

---

## Miljövariabler

| Variabel | Beskrivning |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string från Railway |
| `GOOGLE_CLIENT_ID` | Från Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Från Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://your-app.railway.app/api/auth/callback` |
| `DASHBOARD_SECRET` | Eget lösenord, skyddar dashboarden |
| `NEXT_PUBLIC_DASHBOARD_SECRET` | Samma värde som ovan |

---

## Railway Deploy

1. Pusha till GitHub
2. Railway → New Project → Deploy from GitHub repo
3. Lägg till **PostgreSQL** plugin i projektet
4. Kopiera `DATABASE_URL` från PostgreSQL plugin till environment variables
5. Lägg till övriga env vars
6. Deploy triggas automatiskt vid varje push till `main`

Railway kör `npm run build` (inkl. `prisma generate`) och sedan `npm start`.

### Första deploy

Sätt build command i Railway till:

```
prisma generate && prisma db push && next build
```

---

## Flöde — connect en sajt

1. Öppna Dashme
2. Klicka **Connect site**
3. Logga in med Google-kontot som har GSC-access
4. Alla sajter du har access till importeras automatiskt
5. Klicka **Sync** på valfritt kort för att ladda data
6. Klicka **Sync all** för att synca alla på en gång

---

## API Routes

| Route | Metod | Beskrivning |
|-------|-------|-------------|
| `/api/auth/google` | GET | Startar OAuth-flödet |
| `/api/auth/callback` | GET | Hanterar OAuth callback |
| `/api/sites` | GET | Hämtar alla sajter med data |
| `/api/sites/[id]` | DELETE | Tar bort en sajt |
| `/api/sites/[id]/sync` | POST | Syncar GSC-data för en sajt |
| `/api/overview` | GET | Aggregerad data för alla sajter |

---

## Datamodell

```
Site
 └── SiteMetric    (clicks/impr/ctr/pos per dag, 28 dagar)
 └── SitePage      (top 100 sidor, aggregerat 28 dagar)
 └── SiteKeyword   (top 100 keywords, aggregerat 28 dagar)
 └── SiteCountry   (alla länder, aggregerat 28 dagar)
```

Data cachas i Postgres. Sync hämtar alltid färsk data från GSC API och skriver över.
