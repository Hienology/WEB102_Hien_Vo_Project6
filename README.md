# AeroTrack (Aviationstack)

AeroTrack is a React + Vite flight dashboard that fetches live flight data from Aviationstack.

## 1) Install

```bash
npm install
```

## 2) Configure environment variables

Create `.env.local` in the project root:

```env
VITE_AVIATIONSTACK_KEY=your_aviationstack_key
VITE_AVIATIONSTACK_BASE_URL=https://api.aviationstack.com/v1
VITE_AVIATIONSTACK_DEPARTURE_IATA=JFK
VITE_AVIATIONSTACK_FLIGHT_DATE=
VITE_AVIATIONSTACK_LIMIT=100
```

Required:
- `VITE_AVIATIONSTACK_KEY`

Optional:
- `VITE_AVIATIONSTACK_BASE_URL` (default: `https://api.aviationstack.com/v1`)
- `VITE_AVIATIONSTACK_DEPARTURE_IATA` (default: `JFK`)
- `VITE_AVIATIONSTACK_FLIGHT_DATE` in `YYYY-MM-DD` format (default: empty / not sent)
- `VITE_AVIATIONSTACK_LIMIT` from `1` to `100` (default: `100`)

Note:
- If your Aviationstack plan does not support HTTPS, set `VITE_AVIATIONSTACK_BASE_URL=http://api.aviationstack.com/v1` in `.env.local`.
- Some free plans do not support the `flight_date` filter. If you get `function_access_restricted`, keep `VITE_AVIATIONSTACK_FLIGHT_DATE` empty.

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
LIMIT="${VITE_AVIATIONSTACK_LIMIT:-100}"
curl -sS -o /tmp/aviationstack.json -w "HTTP %{http_code}\n" \
	"${VITE_AVIATIONSTACK_BASE_URL}/flights?access_key=${VITE_AVIATIONSTACK_KEY}&dep_iata=${VITE_AVIATIONSTACK_DEPARTURE_IATA}&limit=${LIMIT}"
```

5. In the app, click `Refresh Board` and confirm flights appear.

## Aviationstack API Scope For This Project

Use now:
- `Flights`: main source for dashboard rows and stats.

## Troubleshooting

- If you see `Missing VITE_AVIATIONSTACK_KEY`, your `.env.local` is missing the API key.
- If you receive an HTTP error (`401`, `403`, `429`), verify key validity and plan limits.
- If HTTPS requests fail, switch `VITE_AVIATIONSTACK_BASE_URL` to `http://api.aviationstack.com/v1` depending on your plan.
- If no flights appear, try a different IATA code or date.
