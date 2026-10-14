# Barbershop Mo & Ma
D? mannenkapper van Volendam - Online afspraken systeem

## Deployment op Render

1. Push deze code naar GitHub
2. Maak een Web Service op https://render.com
3. **Build Command:** `npm run build`
4. **Start Command:** `npm start`
5. **Environment Variable:** `NODE_ENV=production`

## Admin
- **URL:** https://JOUW-DOMEIN.onrender.com/admin
- **Gebruikersnaam:** admin
- **Wachtwoord:** wordt bij een nieuwe database ingesteld via de environment variable `ADMIN_PASSWORD`. Wijzig het daarna via de admin; het wordt bij herstart niet meer overschreven.
