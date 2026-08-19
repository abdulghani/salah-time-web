# Salah Times

A prayer-times web app built with **React 19**, **React Router v8 in framework mode (SPA)**, and **Tailwind CSS v4**.

Prayer times are computed entirely in the browser with [`adhan`](https://github.com/batoulapps/adhan-js) — there is no backend, no API key, and no request leaves the device except the optional city search.

## Features

- **Today** — next-prayer countdown, live "now" highlighting, full timetable, midnight and last-third-of-the-night, and day-by-day navigation (`/?date=YYYY-MM-DD`).
- **Month** — full monthly timetable with today highlighted (`/month?month=YYYY-MM`).
- **Settings** — city search (Open-Meteo geocoding) or device geolocation, calculation method, Asr madhab, high-latitude rule, 12/24-hour clock, and light/dark theme. Saved to `localStorage`.

## Stack notes

- `react-router.config.ts` sets `ssr: false`, so every route loads data through `clientLoader` / `clientAction` and the build emits a static client bundle plus an SPA `index.html`.
- Times are calculated for the *location's* time zone, not the browser's: `civilDateIn()` resolves the calendar day in that zone and all formatting goes through `Intl.DateTimeFormat` with an explicit `timeZone`.
- Requires **Node 22.22+** (see `.nvmrc`).

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build      # → build/client
npm start          # preview the production build
```

## Deployment

`npm run build` produces a static site in `build/client`. Deploy it to any static host with an SPA rewrite:

```
/*    /index.html   200
```
