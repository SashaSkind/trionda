# Trionda Assist

A hand-drawn World Cup 2026 travel companion for exploring host stadiums across the US, Canada, and Mexico. Browse a sketchy real-geo map, preview each venue, and ask the floating chat agent for local tips (food, transit, hidden gems).

Built with Next.js 14, TypeScript, Tailwind, d3-geo, and rough.js.

## What it does

- **Map landing** (`/`) — pannable rough.js map of North America with stadium pins; hover a pin to preview the venue in a bottom drawer
- **Stadium pages** (`/stadium/[id]`) — hero photo, schedule, travel info, and nearby spots for each host city
- **Trionda Assist chat** — floating agent on every page; answers questions using Reddit (Exa), Google Maps, and LLM synthesis (or canned demo responses when API keys aren't configured)
- **Storyboard** (`/storyboard`) — internal design preview of key screens

## Prerequisites

- Node.js 20+
- npm

## Installation

```bash
git clone <repo-url>
cd trionda
npm install
cp .env.example .env.local
```

Edit `.env.local` as needed. For a quick local UI preview without external APIs, leave demo mode on:

```bash
NEXT_PUBLIC_DEMO_MODE=true
```

With demo mode enabled, the concierge API serves canned responses from `data/canned-responses.json` instead of calling Gemini, Exa, or Google Maps.

To wire up live agents, set the keys in `.env.example` and run:

```bash
npm run check-keys
```

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other useful scripts:

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript check |
| `npm run check-keys` | Probe configured API keys |
| `npm run smoke` | Smoke-test the concierge API |

## Environment variables

See `.env.example` for the full list. The main groups:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `true` = canned chat responses, no external API calls |
| `GEMINI_API_KEY` | Concierge intent routing and answer synthesis |
| `EXA_API_KEY` | Scout agent — Reddit search via Exa |
| `GOOGLE_MAPS_API_KEY` | Places and distance lookups for official events |
| `GMI_CLOUD_API_KEY` | Optional place extraction for the Scout agent |
| `ROCKETRIDE_URI` | Optional RocketRide pipeline for synthesis (falls back to direct Gemini) |

## Project structure

```
app/                  Next.js App Router pages and API routes
  api/concierge/      Streaming chat endpoint (SSE)
  stadium/[id]/       Per-stadium detail pages
  storyboard/         Design storyboard preview
components/           UI — map, drawer, chat agent, stadium sections
lib/                  Agents, LLM clients, i18n, stadium data helpers
data/                 Canned demo responses and fan-festival data
public/stadiums/      Stadium hero images
project/              Original HTML/JS design prototypes (reference only)
pipelines/            RocketRide pipeline definitions
scripts/              Dev utilities (check-keys, smoke, prewarm)
```

## Design prototypes

The `project/` folder contains the original Claude Design handoff — interactive HTML wireframes and assets used as visual reference when building the Next.js app. The production UI lives in `app/` and `components/`.
