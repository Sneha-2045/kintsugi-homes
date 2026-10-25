# Saved searches and email alerts

The Saved Searches link in the header opens `/saved`. Authenticated users can save and edit searches from the Japanese property search, US property search, and MLS listings pages. Data is stored in Supabase and protected by row-level security. A saved search is unique per user and normalized filter set.

## Deploying the database

Apply `supabase/migrations/20261025000000_saved_searches_and_alerts.sql` using the project's normal Supabase migration workflow. It creates user-owned saved searches, service-only match snapshots and alert events, indexes, and a lock used to prevent overlapping monitor runs. The migration does not alter existing rows or tables.

## Email provider and environment

The monitor sends email through Resend. Configure these as server-side Cloudflare Worker secrets or environment variables:

- `RESEND_API_KEY` — Resend API key with permission to send mail.
- `ALERT_FROM_EMAIL` — sender address on a verified Resend domain.
- `APP_BASE_URL` — canonical public site origin, such as `https://rylestate.com`.
- `SAVED_SEARCH_UNSUBSCRIBE_SECRET` — long random secret used to sign one-search unsubscribe links.
- `SAVED_SEARCH_CRON_SECRET` — optional secret for manually calling the protected cron endpoint; Cloudflare's native scheduled trigger does not use the HTTP endpoint.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — already required by the project's server-side Supabase integration.
- `REPLIERS_API_KEY` — already required to monitor opted-in MLS searches; when absent or unavailable, other data sources continue to run.

Only verified account email addresses are used. Do not put these secrets in `VITE_*` variables or the client bundle. The sender domain must be verified with Resend before delivery works.

## Scheduled monitoring

The app builds for Cloudflare Workers. `vite.config.ts` registers a Nitro scheduled task at `0 12 * * *` (daily at 12:00 UTC); the generated Worker config includes its Cron Trigger. Deploy the generated Worker config and confirm the Cron Trigger is active in Cloudflare. `/api/cron/saved-searches` is also available for manual invocation and requires `Authorization: Bearer <SAVED_SEARCH_CRON_SECRET>`.

The first successful check establishes a baseline and does not send a burst of “new listing” emails. Later checks identify newly matching records and actual MLS list-price, status, or supported auction-date changes. Static US and Japanese records can only change when the repository data changes; their estimated values are never treated as verified price changes. Searches run independently, and a database lock, per-search failure handling, and unique event keys protect scheduled delivery from overlap and replay. Daily alerts are sent no more than once per day; weekly alerts are batched on Mondays. Instant alerts are not claimed or offered.

## Source limits

The US foreclosure and Tranchi TypeScript records are static and only change when refreshed in the repository. MLS monitoring uses the server-side Repliers search integration and its first 48 results for each saved search. Rental yield alerts are not offered because the current sources do not provide a consistent reliable yield field. Matching-result counts are omitted where a live count cannot be calculated reliably. Email delivery is implemented through Resend; RentCast is not configured.

The migration and provider secrets must be deployed before users can persist searches or receive messages. Cron triggers are installed by the Cloudflare Worker deployment; a local preview does not run a production scheduled job.
