# RentCast Property Intelligence

The `/property-intelligence` page uses a server-only integration. It requests active listing records from RentCast's sale or long-term rental endpoint and fetches property records, value estimates, rent estimates, and comparables only after a user opens a property.

## Configure the API key

This project uses Nitro server routes. The local production build currently emits Cloudflare module output; Nitro also supports Vercel deployments and can select the provider preset during deployment. Add `RENTCAST_API_KEY` as a server-side secret in the hosting dashboard, never as a `VITE_` variable or a client-exposed value.

- For the Vercel deployment shown in the project's deployment screenshot, open **Project Settings → Environment Variables**, add `RENTCAST_API_KEY` for Production and Preview, and redeploy.
- If deploying this build to Cloudflare Workers instead, add `RENTCAST_API_KEY` as a Worker Secret under **Workers & Pages → Settings → Variables and Secrets**, or run `npx wrangler secret put RENTCAST_API_KEY` and provide the key at the prompt.
- For local development, put the key in `.dev.vars` next to the Wrangler configuration. That file is ignored by Git.

The server reads secrets through `process.env`. The browser only calls this application's `/api/property-intelligence` endpoints; RentCast credentials are attached to requests on the server. Nitro's Vercel preset is documented at [nitro.build](https://nitro.build/deploy/providers/vercel).

## API endpoints

- `GET /api/property-intelligence`: active sale or long-term rental search, 24 results per page, offset-based Load More.
- `GET /api/property-intelligence/details`: property record plus value, long-term rent and comparable estimates.

Property result saves live in the current browser's local storage. Existing Repliers MLS routes and data source remain separate.

## Data notes

RentCast listings may not include a photo or original listing URL. The interface shows “Photo unavailable” or omits the source link when those fields are absent. Estimated value and rent are provider estimates; calculator results also depend on the user's assumptions. No properties are fabricated when search fails or returns no matches.
