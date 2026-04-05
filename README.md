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
VITE_AERODATABOX_DATE=YYYY-MM-DD
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

## What To Do Now (Codespaces Only)

1. Keep all work inside Codespaces terminal/editor. No local setup is required.
2. Put your real key in `.env.local` and never paste keys into docs, screenshots, or chat.
3. Start the app:

```bash
npm run dev
```

4. Verify API connectivity with one direct request (uses the same env vars as the app):

```bash
set -a && source .env.local && set +a
DATE="${VITE_AERODATABOX_DATE:-$(date -u +%F)}"
START="${VITE_AERODATABOX_WINDOW_START_HOUR:-0}"
END=$(( START == 12 ? 23 : START + 11 ))
printf -v S "%02d" "$START"
printf -v E "%02d" "$END"
curl -sS -o /tmp/aerodatabox.json -w "HTTP %{http_code}\n" \
	"https://${VITE_RAPIDAPI_HOST}/flights/airports/icao/${VITE_AERODATABOX_AIRPORT_ICAO}/${DATE}T${S}:00/${DATE}T${E}:59" \
	-H "X-RapidAPI-Key: ${VITE_RAPIDAPI_KEY}" \
	-H "X-RapidAPI-Host: ${VITE_RAPIDAPI_HOST}"
```

5. In the app, click `Refresh Board` and confirm flights appear.

## AeroDataBox API Map For This Project

Use now:
- `Flight`: main source for dashboard flights list and stats.
- `Airport`: optional validation/metadata for airport lookup.
- `Healthcheck&Status`: quick diagnostics when API behavior is unclear.

Use later (optional):
- `Flight Alert`: webhook/realtime notifications.
- `Aircraft`: deeper aircraft analytics.
- `Industry`, `Statistical`, `Miscellaneous`: advanced reporting extensions.

Webhook note:
- For subscription body `url`, use your own public webhook receiver URL.
- Do not use placeholder hosts (like `your-url`) and do not use AeroDataBox endpoint URLs as receiver URLs.
- Keep public examples sanitized: use placeholders for secrets and load real values from local env vars.

## Troubleshooting

- If you see `Missing VITE_RAPIDAPI_KEY`, your `.env.local` is missing the API key.
- If you receive an HTTP error (`401`, `403`, `429`), verify RapidAPI plan limits and key permissions.
- If you receive HTTP `400` with a period/time-range message, make sure your query window is 12 hours or less.
- If no flights appear, try a different ICAO code or date.
