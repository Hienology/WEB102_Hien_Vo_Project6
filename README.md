# AeroTrack (RapidAPI + AeroDataBox)

AeroTrack is a React + Vite flight dashboard that fetches live departures data from RapidAPI's AeroDataBox endpoint.

## 1) Install

```bash
npm install
```

## 2) Configure environment variables

Create `.env.local` in the project root:

```env
VITE_RAPIDAPI_KEY=your_rapidapi_key
VITE_RAPIDAPI_HOST=aerodatabox.p.rapidapi.com
VITE_AERODATABOX_AIRPORT_ICAO=KJFK
VITE_AERODATABOX_DATE=2026-04-05
VITE_AERODATABOX_WINDOW_START_HOUR=0
```

Required:
- `VITE_RAPIDAPI_KEY`

Optional:
- `VITE_RAPIDAPI_HOST` (default: `aerodatabox.p.rapidapi.com`)
- `VITE_AERODATABOX_AIRPORT_ICAO` (default: `KJFK`)
- `VITE_AERODATABOX_DATE` in `YYYY-MM-DD` format (default: current UTC date)
- `VITE_AERODATABOX_WINDOW_START_HOUR` from `0` to `12` (default: `0`)

Note:
- This AeroDataBox endpoint allows max 12 hours per request. The app queries a 12-hour window from `WINDOW_START_HOUR` to `WINDOW_START_HOUR + 11:59`.

## 3) Run in development

```bash
npm run dev
```

## 4) Build for production

```bash
npm run build
npm run preview
```

## Troubleshooting

- If you see `Missing VITE_RAPIDAPI_KEY`, your `.env.local` is missing the API key.
- If you receive an HTTP error (`401`, `403`, `429`), verify RapidAPI plan limits and key permissions.
- If you receive HTTP `400` with a period/time-range message, make sure your query window is 12 hours or less.
- If no flights appear, try a different ICAO code or date.
