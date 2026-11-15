# Rylestate

Rylestate is a React + TypeScript website built with Vite and TanStack Start. It currently includes Japan listing fixtures, 74 checked-in US auction listings, 8 automation listings, RentCast Property Intelligence, and Repliers MLS search. These local arrays and APIs are not the missing 49,000+ foreclosure export.

## Rylestate AI assistant

The site-wide chat assistant is implemented in `src/components/ai/AIAssistant.tsx`. Its Express endpoints are mounted in `scripts/express-server.mjs`; MongoDB queries, Gemini function calling, investment calculations, validated property tools, guest sessions, saved properties, knowledge retrieval, rate limiting, and the separate `chat_sessions` / `chat_messages` collections are in `src/server/`.

All assistant property queries read from the existing `properties` collection in the `rylestate` MongoDB database. The assistant does not call an unverified foreclosure API or treat the checked-in fixtures as the full inventory. A listing page passes its ID to chat; the backend resolves that ID against MongoDB before providing property facts. The existing site login and admin property operations still use Supabase pending a verified export/import and deliberate auth/storage cutover; the Mongo JWT routes are not yet the live site login.

### Runtime configuration

Set these as secure Render environment variables. Never add secrets to `.env`, `VITE_*`, or Git:

- `MONGODB_URI` — Atlas connection URI; `src/server/mongo.ts` selects the `rylestate` database.
- `GEMINI_API_KEY` — Google AI Studio / Gemini API key, used only on the server.
- `JWT_ACCESS_SECRET` — at least 32 random bytes for the existing Mongo-backed auth implementation.
- `CLIENT_URL=https://rylestate.com` — exact allowed browser origin.
- `APP_BASE_URL=https://rylestate.com` — site origin for authentication links and CSRF origin checks.
- `GEMINI_MODEL` — optional; defaults to `gemini-2.5-flash`.
- `RENTCAST_API_KEY` and `REPLIERS_API_KEY` — retain these if the deployed TanStack pages need their existing server APIs.
- `RESEND_API_KEY` and `ALERT_FROM_EMAIL` — required for account verification/password reset email.

If the existing frontend remains on its current host and the Node service is on Render, point the frontend build variable `VITE_API_BASE_URL` to a custom API domain such as `https://api.rylestate.com`. Set `CLIENT_URL` and `APP_BASE_URL` to the exact production website origin. Configure the API domain in Render and DNS before enabling cross-origin requests. A custom domain under `rylestate.com` keeps the API and site on the same site for secure cookies.

### Render Node service

`render.yaml` describes a Render Node web service. It builds the existing TanStack SSR output with the Node middleware preset, boots Express, initializes MongoDB indexes and seeds the general foreclosure education documents idempotently. Add the secret values in Render’s dashboard after creating the service. The service binds Render’s `PORT` on `0.0.0.0` and exposes `/__health`.

Deploy from the repository root with the Blueprint, then set `VITE_API_BASE_URL` in the existing frontend host and rebuild that frontend. Do not remove or replace the current frontend deployment until the Node deployment, API origin, authentication cookies, and existing listing routes have been verified.

## Inventory and migration status

The MongoDB migration is still in progress. See [MONGODB_MIGRATION_AUDIT.md](./MONGODB_MIGRATION_AUDIT.md) and [SUPABASE_EXPORT_GUIDE.md](./SUPABASE_EXPORT_GUIDE.md). This checkout does not contain the 49,000-record source, Supabase export, Storage image bytes, or Atlas connection. Do not claim the assistant can search all 49,000 listings until import counts and relationships are verified in Atlas.

The checked-in integrations show RentCast for location-specific property intelligence and Repliers for MLS search. Neither has been verified here as a bulk 49,000-foreclosure inventory API. No new endpoint has been invented for synchronization. Incremental sync and expired-listing detection must be connected only after the actual source API contract, authentication, pagination, and rate limits are available.

## Checks

- `npm run test:mongo-models`
- `npm run test:ai-services`
- `npm run test:comparison`
- `npm run build:node`

A build and unit tests do not validate a live Atlas connection, Gemini credentials, Render CORS/cookie settings, or inventory completeness. Test those after configuring secure runtime secrets and importing the real data.
