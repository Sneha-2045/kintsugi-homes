# MongoDB migration audit

## Current architecture

- The frontend remains TanStack Start on Vite/Nitro. An Express Node middleware host wraps the existing TanStack SSR output for the Render deployment target; the Lovable frontend configuration remains in place.
- Supabase is used for Postgres, Auth, and Storage. The Supabase SDK is a direct dependency in `package.json`.
- Repliers and RentCast are external property APIs. Resend sends saved-search alert email. These are integrations, not application databases.
- Mongoose, Express, bcrypt, and JWT dependencies are present for the MongoDB migration and assistant backend.

## Supabase data inventory from migrations and code

| Supabase resource                            | Current use                                                                                | MongoDB target                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `auth.users`                                 | Signup, login, sessions, email confirmation, saved-search ownership, alert recipient email | `users` plus hashed-password/JWT authentication; legacy user IDs retained during migration       |
| `user_roles`                                 | Admin/moderator/user RBAC via `has_role`                                                   | `users.roles` or a role-grants collection; preserve role assignments                             |
| `properties`                                 | Admin-managed listings and published property reads                                        | `properties`                                                                                     |
| `property_images`                            | Property image metadata and ordering                                                       | Embedded ordered `images` array in `properties` or an indexed `propertyImages` collection        |
| `storage.objects` / `property-images` bucket | Admin image upload, signed image reads, deletes                                            | Keep bytes in object storage (for example an S3-compatible provider); store URLs/keys in MongoDB |
| `listing_issue_reports`                      | Anonymous/authenticated issue reports; admin review                                        | `listingIssueReports`                                                                            |
| `saved_searches`                             | User searches, alert settings and monitor cursors                                          | `savedSearches`                                                                                  |
| `saved_search_matches`                       | Last-seen listing snapshots per saved search                                               | `savedSearchMatches`                                                                             |
| `saved_search_events`                        | New/changed listing events and email delivery status                                       | `savedSearchEvents`                                                                              |
| `saved_search_monitor_lock`                  | Prevent overlapping scheduled alert jobs                                                   | MongoDB lease document with atomic conditional update                                            |

The auth tables and storage bucket are not represented as ordinary application tables in the checked-in SQL migrations. Exact live table, user, bucket object and row counts therefore still need a database/storage export or privileged source access.

## Application call sites

- `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, and `auth-attacher.ts`: browser/server Supabase clients and bearer-token auth.
- `src/routes/login.tsx`, `src/routes/_authenticated/route.tsx`: the existing registration, login, and Supabase session guard. Mongo JWT routes are scaffolded, but login cutover awaits the legacy user/hash/role export and import.
- `src/lib/property-db.ts`, `src/components/admin/PropertyForm.tsx`: property CRUD, image relation management, and admin role checks.
- `src/components/admin/ImageUploader.tsx`: object upload, signed URL generation and deletion.
- `src/components/property/ReportListingIssue.tsx`: report inserts.
- `src/lib/saved-searches.functions.ts`: authenticated saved-search CRUD.
- `src/lib/saved-search-monitor.server.ts`, `src/routes/api.cron.saved-searches.ts`, `src/routes/api.alerts.unsubscribe.ts`, and `tasks/saved-searches-monitor.ts`: scheduled match snapshots, event delivery, lock, and unsubscribe flow.
- `src/components/property/PropertyComparison.tsx` and `src/lib/saved-properties.ts`: browser `localStorage` state, not Supabase records; these still need consideration if all user data must be centralized in MongoDB.
- No chatbot conversation store, newsletter subscriber collection, or contact/inquiry collection was found in the source or migrations. `listing_issue_reports` is the existing visitor-submitted report flow. These features would need to be added to MongoDB if/when the corresponding product flows exist.

## Property inventory found in this checkout

- `src/data/us-listings.ts`: 74 checked-in auction listings.
- `src/data/tranchi-properties.ts`: 8 checked-in automation listings.
- `automation/us-listing-history.json`: 395 history entries.
- Other checked-in Japan fixture arrays total a few hundred listings, not 49,000 foreclosure records.
- The 49,000-record source is not present in the tracked listing files. It must be identified and exported/imported separately before that acceptance criterion can be verified.
- MLS and RentCast listings are fetched from their existing APIs; no bulk export of those providers is present in this checkout.

## Migration blockers and safety conditions

1. The Mongoose/Express/bcrypt/JWT dependencies and first-pass model/connection layer are in the repository, but `MONGODB_URI` is not configured in this execution environment. Secret values were not read or copied into this report.
2. The tracked repository has migrations and generated database types, but no Supabase database dump, Auth user export, storage object manifest, or 49,000-listing source file. Record counts and relationships cannot be audited from schema alone.
3. To preserve existing passwords rather than force resets, the migration needs a supported export of Supabase Auth password hashes and auth metadata. A public/publishable Supabase key is insufficient for this.
4. Before removing Supabase, migrate and verify all Postgres records, auth users/roles, and image objects. Keep a restorable backup and compare per-collection counts and relationship checks before cutover.
5. Render was selected as the Node host. Express serves the built TanStack SSR middleware and API; deployment, scheduled jobs, auth cutover, and hosting behavior still need live verification.

## Migration groundwork added

- `src/server/mongo.ts` connects to the single `rylestate` database and can create declared indexes without dropping existing indexes.
- `src/server/models.ts` defines Mongoose collections and indexes for users/auth sessions, properties/images, roles, favorites, comparisons/preferences, saved searches and alert events, reports, chat, inquiries, newsletters, sync logs, storage objects, and job leases.
- Rylestate AI adds MongoDB-backed `chat_sessions`, `chat_messages`, `knowledgeBase`, `apiRateLimits`, and `searchCache` collections, plus validated property query and calculation services.
- `scripts/export-supabase-migration.mjs` exports audited Supabase tables in a read-only repeatable-read transaction, including the Auth bcrypt hash field, into private NDJSON files with a row-count manifest.
- `SUPABASE_EXPORT_GUIDE.md` documents how to create the source export and bulk-download Storage objects without putting credentials in Git or chat.
- `npm run test:mongo-models`, `npm run test:ai-services`, and `npm run test:comparison` pass local checks. They do not prove a live Atlas connection, Gemini request, Render deployment, or data migration.

## Cutover verification required

- Compare source and target counts for every table/collection, including all 49,000 foreclosure listings.
- Check property-image references, user/role ownership, saved-search relations, alert event relations, and object-storage keys.
- Exercise registration, sign-in, refresh/logout, password reset, role protection, property CRUD, image upload/delete, saved searches, reports, alerts/unsubscribe, property search/filtering, and SEO routes against MongoDB.
- Only then remove Supabase SDK/configuration/migrations and delete the original services.
