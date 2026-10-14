# Repliers MLS setup

## Server secret

The API key is read only by server handlers as `REPLIERS_API_KEY`. Never use a `VITE_` prefix or place it in `.env` (that file is tracked here).

For local Vite development, place the key in the ignored `.env.local` file in the repository root. The app's tracked `.env` is not a safe place for secrets.

```dotenv
REPLIERS_API_KEY=your-key
```

For Cloudflare/Wrangler local runtime, `.dev.vars` is also supported. For deployment, add `REPLIERS_API_KEY` as a Cloudflare Worker secret in the dashboard or with `npx wrangler secret put REPLIERS_API_KEY`.

## MLS display requirements

The server requests active public listings and suppresses listings whose permissions do not allow full internet display. It also withholds street address when the listing permission says not to display it. Listing brokerage information is shown when returned by Repliers. Confirm the terms and required attribution language for the MLS board(s) in the Repliers subscription before launch; board requirements may differ. Do not enable sold listings without the required user verification and disclosure workflow.

## Current scope

`/properties` and `/properties/:id` read current listing data from Repliers through same-origin server endpoints. The search starts across all active datasets available to the key. City and type filters are optional; omitting them allows Repliers to return the account-wide active feed. Listing records are not saved in any database. The short-lived HTTP cache is limited to seconds. This integration does not add database tables, use Supabase, or save lead submissions. The existing repository itself currently contains Supabase-backed property, authentication, and storage code; that existing setup is left unchanged.

The API key has not been verified against the subscription from this workspace. Texas City coverage, API authentication, actual response field coverage, and board-specific display conditions need a live request before the page can be considered production-ready. The current UI starts with Texas City and allows city searches; configure actual supported markets based on the subscription.
