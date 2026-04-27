# Kapperszaak Style - Afsprakensysteem

Een complete, moderne website voor een kapperszaak met klant- en admin-functionaliteit. Gebouwd met React, TypeScript, Tailwind CSS, Express en SQLite.

## Functionaliteiten

### Voor Klanten
- **Homepage** met introductie en dienstenoverzicht
- **Online boekingssysteem** met:
  - Keuze uit verschillende behandelingen
  - Datum- en tijdselectie met kalender
  - Validatie om dubbele afspraken te voorkomen
  - Bevestiging na succesvolle boeking

### Voor Admin (Eigenaar)
- **Beveiligde login** met JWT authenticatie
- **Dashboard** met statistieken:
  - Totaal aantal afspraken
  - Aankomende afspraken
  - Afspraken van vandaag
  - Verlopen afspraken
- **Afsprakenoverzicht** met tabs voor:
  - Vandaag
  - Aankomend
  - Verlopen
  - Alle afspraken
- **Beheer functionaliteit**:
  - Afspraken verwijderen
  - Overzicht per datum

## Technische Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + SQLite3
- **Authenticatie**: JWT (JSON Web Tokens) + bcryptjs
- **Datum/Time**: date-fns

## Installatie

### Vereisten
- Node.js 18+ 
- npm of yarn

### Stap 1: Clone en Installeer

```bash
cd /mnt/okcomputer/output/app
npm install
```

### Stap 2: Start de Backend Server

```bash
npm run server
```

De server draait op `http://localhost:3001`

### Stap 3: Start de Frontend (nieuwe terminal)

```bash
npm run dev
```

De website is beschikbaar op `http://localhost:5173`

## Standaard Login Gegevens

- **Gebruikersnaam**: `admin`
- **Wachtwoord**: `admin123`

Je kunt deze wijzigen in de database of nieuwe gebruikers toevoegen via de SQLite database.

## Scripts

| Script | Beschrijving |
|--------|--------------|
| `npm run dev` | Start de development server (frontend) |
| `npm run server` | Start de backend API server |
| `npm run build` | Bouwt de productieversie |
| `npm run start` | Bouwt en start de productieversie |
| `npm run preview` | Preview de productiebuild |

## API Endpoints

### Authenticatie
- `POST /api/auth/login` - Admin login

### Afspraken
- `GET /api/appointments` - Alle afspraken (auth required)
- `GET /api/appointments/available-slots` - Beschikbare tijdslots
- `POST /api/appointments` - Nieuwe afspraak maken
- `PUT /api/appointments/:id` - Afspraak bijwerken (auth required)
- `DELETE /api/appointments/:id` - Afspraak verwijderen (auth required)

### Statistieken
- `GET /api/stats` - Dashboard statistieken (auth required)

## Database

SQLite database wordt automatisch aangemaakt in `server/database.sqlite`. De database bevat twee tabellen:

### appointments
- `id` - Primaire sleutel
- `name` - Klantnaam
- `email` - Klant e-mail
- `phone` - Telefoonnummer (optioneel)
- `service` - Gekozen behandeling
- `date` - Afspraakdatum (YYYY-MM-DD)
- `time` - Afspraaktijd (HH:MM)
- `notes` - Opmerkingen (optioneel)
- `status` - active/deleted
- `created_at` - Aanmaakdatum

### users
- `id` - Primaire sleutel
- `username` - Gebruikersnaam
- `password` - Gehasht wachtwoord
- `role` - Gebruikersrol (default: admin)

## Diensten & Prijzen

| Dienst | Duur | Prijs |
|--------|------|-------|
| Knippen | 30 min | €25 |
| Scheren | 20 min | €15 |
| Knippen & Scheren | 45 min | €35 |
| Kleuren | 90 min | €55 |
| Highlights | 120 min | €75 |
| Haarbehandeling | 60 min | €40 |

## Openingstijden

- **Maandag - Woensdag**: 09:00 - 18:00
- **Donderdag**: 09:00 - 20:00
- **Vrijdag**: 09:00 - 18:00
- **Zaterdag**: 09:00 - 17:00
- **Zondag**: Gesloten

## Mapstructuur

```
app/
├── server/                 # Backend code
│   ├── server.js          # Express server
│   └── database.js        # SQLite database setup
├── src/
│   ├── components/        # shadcn/ui componenten
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities & API
│   ├── sections/          # Pagina secties
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Hoofd component
│   └── main.tsx           # Entry point
├── public/                # Statische bestanden
├── package.json
├── vite.config.ts
└── README.md
```

## Productie Deploy

### Build
```bash
npm run build
```

Dit maakt een `dist/` map met de geoptimaliseerde frontend.

### Start Productie
```bash
npm run start
```

Dit bouwt de frontend en start de server op poort 3001 (of de poort uit de `PORT` omgevingsvariabele).

## Omgevingsvariabelen

Maak een `.env` bestand in de root:

```env
PORT=3001
JWT_SECRET=jouw-geheime-sleutel-hier
NODE_ENV=production
```

## Licentie

MIT License - Vrij te gebruiken en aan te passen.

---

Gemaakt met ❤️ voor Kapperszaak Style
