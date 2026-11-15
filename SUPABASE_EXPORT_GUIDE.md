# Preparing the source export for the MongoDB migration

This export is read-only. It does not delete or modify Supabase data. The export contains personal information and password hashes; keep it private and do not commit it to Git or attach it to a public issue.

## 1. Add a temporary secure database URL

In the Supabase Dashboard, open the project and choose **Connect**. Copy the PostgreSQL connection string for **Direct connection** (or **Session pooler** if direct IPv6 access is unavailable). Use the database password from the project’s database settings. A transaction pooler is not appropriate for bulk export.

In a local zsh terminal in this repository, enter the connection string without echoing it or adding it to shell history:

```zsh
read -s 'SUPABASE_DB_URL?Supabase PostgreSQL connection string: '
export SUPABASE_DB_URL
npm run export:supabase-migration -- /private/tmp/rylestate-supabase-export
unset SUPABASE_DB_URL
```

The script reads `public`, `auth`, and `storage` tables in one read-only repeatable-read transaction. It writes newline-delimited JSON and a row-count manifest under `/private/tmp/rylestate-supabase-export` with restrictive file permissions. The `auth.users` export includes `encrypted_password` so the bcrypt hashes can be retained. Supabase documents that its Auth password hashes use bcrypt and that the hash is stored in `auth.users.encrypted_password`.

If the database role cannot read the `auth` schema, stop and request a database-owner export from the project owner. Do not replace it with only the public/publishable API key: that key cannot export protected Auth data.

## 2. Export Storage file bytes separately

The export script captures `storage.objects` and `storage.buckets` metadata, but PostgreSQL backups do not contain the image bytes. For a bulk download, Supabase recommends using its S3-compatible Storage endpoint with an S3 client such as rclone. Enable S3 access in **Storage → Configuration → S3**, create temporary credentials, and download the `property-images` bucket to a private local directory. Keep the object paths unchanged so they can be matched to `storage.objects.name`.

Do not paste S3 credentials into chat or commit them. The final migration will copy the bytes to the chosen object-storage provider and record target keys in MongoDB before any Supabase object is removed.

## 3. Provide the 49,000-listing source

The 49,000-record foreclosure source is not present in this checkout. Place its original export (CSV or JSON/NDJSON), along with any source ID/image manifest needed to associate photos, in a private local directory and provide the path. Do not normalize or delete the source records before the target counts are verified.

## 4. Give the export to the migration run

Once the private export is present, confirm the directory path in this Codex thread. Also configure `MONGODB_URI` through a secure runtime environment (not the tracked `.env` file). The migration will first run in dry-run mode and report source/target counts; it will not alter Supabase. A later cutover requires count and relationship verification for every collection and image object.

Supabase references:

- [Database backups and logical dumps](https://supabase.com/docs/guides/platform/backups)
- [Supabase CLI database dump](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Download Storage objects in bulk](https://supabase.com/docs/guides/storage/management/download-objects)
- [Auth password hashing](https://supabase.com/docs/guides/auth/password-security)
