# News Navigator v2

A full-stack news app with **live news**, **full article detail view**, and **8-language support**.

---

## What's new in v2
- Live news via **RSS feeds** (free, no key needed) — BBC, NYT, and more
- Optional **GNews API** for 100 articles/day in any language (free at gnews.io)
- **Article detail view** — click any headline for full story + source link
- **8 languages** — English, Hindi, Tamil, French, German, Spanish, Arabic, Chinese
- **Live weather** via Open-Meteo (free, no key needed)
- **Real-time search** across live headlines

---

## Project structure

```
news-navigator/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env                  ← put your GNews key here (optional)
│   ├── services/
│   │   └── newsService.js    ← GNews + RSS fetcher with cache
│   └── routes/
│       ├── articles.js
│       └── weather.js
└── README.md
```

---

## Quick start

### 1. Start the backend
```bash
cd backend
npm install
npm start
```
You'll see which news source is active:
- **RSS feeds** — works immediately, no key needed
- **GNews API** — add key to `.env` for multilingual live news

### 2. Open the frontend
Open `frontend/index.html` with **Live Server** in VS Code (right-click → Open with Live Server).

---

## (Optional) Get a free GNews API key

1. Go to https://gnews.io and sign up for free
2. Copy your API key
3. Open `backend/.env` and replace `your_gnews_api_key_here` with your key
4. Restart the backend

Free tier: **100 requests/day**, 10 articles per request.

---

## API reference

| Endpoint | Params | Description |
|---|---|---|
| `GET /api/health` | — | Check news source status |
| `GET /api/articles` | `cat`, `lang`, `q`, `max` | Live articles |
| `GET /api/articles/trending` | — | Top 5 trending |
| `GET /api/weather` | `city` | Live weather (Open-Meteo) |

### Category values
`general` `world` `tech` `business` `science` `health` `sports` `entertainment`

### Language values (GNews only)
`en` `hi` `ta` `fr` `de` `es` `ar` `zh`
