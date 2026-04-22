# Voyage

Flight-booking travel app with an AI assistant.

- **Flights**: [Duffel](https://duffel.com) — real search + test-mode bookings (sandbox is free, live bookings are pay-per-order)
- **AI**: [Vercel AI Gateway](https://vercel.com/ai-gateway) via `ai` SDK v5 (`anthropic/claude-sonnet-4`) with tool-calls for `searchFlights`, `getOffer`, `trackPrice`, `planItinerary`
- **Alerts**: `expo-notifications` local notifications when tracked-route prices drop
- **Base**: forked from [`ExpoStartup/propia`](https://github.com/ExpoStartup/propia), then gutted

## Prerequisites

- Node 20
- iOS Simulator (Xcode) or Android emulator
- A **Duffel** test-access token (free) — `https://duffel.com` -> Developers
- A **Vercel AI Gateway** API key — `https://vercel.com/ai-gateway`

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env
# edit .env with your two keys
npx expo start -c
```

Press `i` for iOS simulator or `a` for Android.

## How it works

- `app/api/*+api.ts` — Expo Router API routes run on the Metro dev server. They hold `DUFFEL_ACCESS_TOKEN` and `AI_GATEWAY_API_KEY` so keys never reach the device.
- `app/(tabs)/(home)/index.tsx` — flight search + results (Duffel offers).
- `app/(tabs)/chat.tsx` — AI assistant with streaming + inline flight cards.
- `app/(tabs)/favorites.tsx` — tracked routes. Re-polled on app foreground.
- `app/(tabs)/trips.tsx` — created Duffel orders.

## Testing

On a physical device, either connect to the same LAN as your dev server or use `npx expo start --tunnel`.

The Duffel sandbox accepts real-shaped passenger data and returns real-shaped orders — no credit card needed (payment type `balance`).
