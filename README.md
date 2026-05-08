# Scouting Regio Lek- en IJsselstreek — Website

De officiële website van **Scouting Regio Lek- en IJsselstreek**, gebouwd op [Astro](https://astro.build) met het [EmDash CMS](https://emdash.dev).

---

## Voor niet-developers: wat is dit?

Dit is de broncode van de website. Je hoeft hier normaal gesproken niet in te werken — de website heeft een eigen **beheerpaneel** waar je berichten, evenementen en vacatures kunt aanmaken en bewerken.

**Beheerpaneel (live):** de URL van de live site + `/_emdash/admin`

Wil je toch iets technisch aanpassen, of weet je niet hoe je bij het beheerpaneel moet komen? Neem dan contact op met de beheerder van de site.

---

## Inhoudsopgave

- [Wat doet de site?](#wat-doet-de-site)
- [Technische opbouw](#technische-opbouw)
- [Lokaal draaien (voor developers)](#lokaal-draaien-voor-developers)
- [Beheerpaneel](#beheerpaneel)
- [Contentbeheer](#contentbeheer)
- [Deployment](#deployment)
- [Projectstructuur](#projectstructuur)
- [Plugins](#plugins)

---

## Wat doet de site?

De website biedt:

- **Nieuwsberichten** — posts met afbeeldingen, categorieën en tags
- **Evenementen** — met datum, locatie en tijdsindicatie
- **Vacatures** — per groep, met rol, organisatie en inzet
- **Losse pagina's** — zoals een "Over ons" of contactpagina
- **Zoekfunctie** — doorzoek alle content via `/search`
- **RSS-feed** — op `/rss.xml`
- **Contactformulier** — via e-mail (Resend)

---

## Technische opbouw

| Onderdeel | Technologie |
|-----------|-------------|
| Framework | [Astro 6](https://astro.build) (server-rendered) |
| CMS | [EmDash](https://emdash.dev) |
| Database | SQLite (custom bun driver) |
| Runtime | [Bun](https://bun.sh) |
| E-mail | [Resend](https://resend.com) |
| Container | Docker |
| Font | Nunito (Google Fonts) |

---

## Lokaal draaien (voor developers)

### Vereisten

- [Bun](https://bun.sh) geïnstalleerd (`curl -fsSL https://bun.sh/install | bash`)

### Installeren en starten

```bash
# 1. Installeer afhankelijkheden
bun install

# 2. Start de ontwikkelserver (voert ook migraties en seeding uit)
npx emdash dev
```

De site is nu beschikbaar op: **http://localhost:4321**
Het beheerpaneel op: **http://localhost:4321/_emdash/admin**

### Handige commando's

```bash
npx emdash dev                              # Start dev-server
npx emdash types                            # Genereer TypeScript-types opnieuw
npx emdash seed seed/seed.json              # Laad demo-content opnieuw
npx emdash seed seed/seed.json --validate   # Valideer het seed-bestand
bun run typecheck                           # Controleer TypeScript
bun run build                               # Bouw de productie-versie
```

---

## Beheerpaneel

Het beheerpaneel is bereikbaar op `/_emdash/admin`. Hier kun je:

- Berichten, evenementen en vacatures aanmaken, bewerken en verwijderen
- Afbeeldingen en bestanden uploaden
- Menu's aanpassen
- Formulierinzendingen inzien

Op de lokale ontwikkelomgeving is er geen wachtwoord vereist. Op de live omgeving is toegang beveiligd via de omgevingsvariabelen.

---

## Contentbeheer

### Collecties (soorten inhoud)

| Collectie | Velden | URL-patroon |
|-----------|--------|-------------|
| **Posts** | Titel, uitgelichte afbeelding, inhoud, samenvatting | `/posts/[slug]` |
| **Pages** | Titel, inhoud | `/pages/[slug]` |
| **Evenementen** | Titel, datum, locatie, tijdslabel, inhoud | `/events/[slug]` |
| **Vacatures** | Rol, organisatie, inzet, beschrijving, inhoud | `/vacatures/[slug]` |

### Taxonomieën (categorisering)

- **Categories** — voor posts
- **Tags** — voor posts
- **Groep type** — voor evenementen en vacatures
- **Vacature type** — voor vacatures

### Menu's

- **Primary Navigation** — het hoofdnavigatiemenu van de site

---

## Deployment

De site draait in een **Docker-container** en is geoptimaliseerd voor zelf-hosting (bijv. via [Coolify](https://coolify.io)).

### Met Docker Compose

```bash
docker compose up -d
```

Dit start de container op poort **4321**. Data en uploads worden buiten de container bewaard in:

- `/data/emdash` — de SQLite-database
- `/data/emdash-uploads` — geüploade afbeeldingen en bestanden

### Omgevingsvariabelen

| Variabele | Beschrijving | Verplicht |
|-----------|--------------|-----------|
| `DATABASE_URL` | PostgreSQL-verbindingsstring (als je geen SQLite gebruikt) | Nee |
| `BASE_URL` | De publieke URL van de site (bijv. `https://regiolekenijssel.nl`) | Ja (productie) |
| `RESEND_API_KEY` | API-sleutel voor e-mail via Resend | Ja (voor formulieren) |

### Health check

De site heeft een health check-eindpunt op `/health`. Docker gebruikt dit automatisch om te controleren of de applicatie correct opgestart is.

---

## Projectstructuur

```
regio-lek-en-ijssel/
├── src/
│   ├── pages/              # Astro-pagina's (routes van de site)
│   │   ├── index.astro         # Homepage
│   │   ├── posts/              # Nieuwsberichten
│   │   ├── events/             # Evenementen
│   │   ├── vacatures/          # Vacatures
│   │   ├── search.astro        # Zoekpagina
│   │   └── rss.xml.ts          # RSS-feed
│   ├── layouts/
│   │   └── Base.astro          # Basisopmaak (menu, zoekbalk, etc.)
│   ├── components/             # Herbruikbare UI-onderdelen
│   └── styles/                 # CSS-stijlen
├── seed/
│   └── seed.json           # Schemadefinitie + demo-content
├── plugins/
│   └── resend/             # Lokale plugin voor e-mail via Resend
├── data/                   # SQLite-database (niet in git)
├── uploads/                # Geüploade bestanden (niet in git)
├── astro.config.mjs        # Astro- en EmDash-configuratie
├── Dockerfile              # Docker-image definitie
├── compose.yaml            # Docker Compose configuratie
└── emdash-env.d.ts         # Gegenereerde TypeScript-types (automatisch)
```

---

## Plugins

| Plugin | Functie |
|--------|---------|
| **resend** (lokaal, `plugins/resend/`) | Verstuurt e-mails via [Resend](https://resend.com) bij formulierinzendingen |
| **plugin-embeds** | Insluitingen van externe content (bijv. YouTube) in de teksteditor |
| **plugin-forms** | Contactformulieren met opslag van inzendingen in de database |

---

## Hulp nodig?

- **EmDash documentatie:** https://emdash.dev/docs
- **Astro documentatie:** https://docs.astro.build
- **Problemen of vragen:** maak een issue aan in de repository
