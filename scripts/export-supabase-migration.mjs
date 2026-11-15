import { chmod, mkdir, open, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const outputDir = path.resolve(process.argv[2] ?? "/private/tmp/rylestate-supabase-export");
const databaseUrl = process.env["SUPABASE_DB_URL"];

if (!databaseUrl) {
  console.error(
    "Set SUPABASE_DB_URL in the secure shell environment; do not put it in source control.",
  );
  process.exit(2);
}

const sources = [
  {
    schema: "auth",
    table: "users",
    output: "auth_users.ndjson",
    required: true,
    columns: [
      "id",
      "email",
      "encrypted_password",
      "email_confirmed_at",
      "phone",
      "phone_confirmed_at",
      "created_at",
      "updated_at",
      "last_sign_in_at",
      "raw_app_meta_data",
      "raw_user_meta_data",
      "is_anonymous",
      "banned_until",
      "deleted_at",
    ],
  },
  { schema: "public", table: "user_roles", output: "user_roles.ndjson", required: true },
  { schema: "public", table: "properties", output: "properties.ndjson", required: true },
  { schema: "public", table: "property_images", output: "property_images.ndjson", required: true },
  {
    schema: "public",
    table: "listing_issue_reports",
    output: "listing_issue_reports.ndjson",
    required: true,
  },
  { schema: "public", table: "saved_searches", output: "saved_searches.ndjson", required: true },
  {
    schema: "public",
    table: "saved_search_matches",
    output: "saved_search_matches.ndjson",
    required: true,
  },
  {
    schema: "public",
    table: "saved_search_events",
    output: "saved_search_events.ndjson",
    required: true,
  },
  {
    schema: "public",
    table: "saved_search_monitor_lock",
    output: "saved_search_monitor_lock.ndjson",
    required: true,
  },
  { schema: "storage", table: "buckets", output: "storage_buckets.ndjson", required: true },
  { schema: "storage", table: "objects", output: "storage_objects.ndjson", required: true },
];

const quoteIdentifier = (value) => `"${value.replaceAll('"', '""')}"`;
const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
  application_name: "rylestate-migration-export",
});
const manifest = { generatedAt: new Date().toISOString(), database: "supabase", files: [] };
let client;

try {
  client = await pool.connect();
  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  await mkdir(outputDir, { recursive: true, mode: 0o700 });
  await chmod(outputDir, 0o700);

  for (const source of sources) {
    const qualifiedName = `${quoteIdentifier(source.schema)}.${quoteIdentifier(source.table)}`;
    const exists = await client.query("SELECT to_regclass($1) IS NOT NULL AS present", [
      `${source.schema}.${source.table}`,
    ]);
    if (!exists.rows[0]?.present) {
      if (source.required)
        throw new Error(`Required source table is not available: ${source.schema}.${source.table}`);
      continue;
    }

    let columns;
    if (source.columns) {
      const available = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2",
        [source.schema, source.table],
      );
      const names = new Set(available.rows.map((row) => row.column_name));
      columns = source.columns.filter((column) => names.has(column));
      if (!names.has("encrypted_password"))
        throw new Error(
          "auth.users.encrypted_password is inaccessible; account passwords cannot be preserved from this export.",
        );
      columns = [...new Set([...columns, "encrypted_password"])];
    }
    const selectColumns = columns?.map(quoteIdentifier).join(", ") ?? "*";
    const countResult = await client.query(
      `SELECT count(*)::bigint AS count FROM ${qualifiedName}`,
    );
    const rowCount = Number(countResult.rows[0]?.count ?? 0);
    const filePath = path.join(outputDir, source.output);
    const file = await open(filePath, "w", 0o600);
    try {
      for (let offset = 0; offset < rowCount; offset += 1000) {
        const result = await client.query(
          `SELECT ${selectColumns} FROM ${qualifiedName} ORDER BY 1 LIMIT $1 OFFSET $2`,
          [1000, offset],
        );
        for (const row of result.rows) await file.write(`${JSON.stringify(row)}\n`);
      }
    } finally {
      await file.close();
      await chmod(filePath, 0o600);
    }
    manifest.files.push({
      schema: source.schema,
      table: source.table,
      file: source.output,
      rowCount,
    });
    console.log(`Exported ${source.schema}.${source.table}: ${rowCount} rows`);
  }

  await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(path.join(outputDir, "manifest.json"), 0o600);
  await client.query("COMMIT");
  console.log(`Export complete: ${outputDir}`);
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  console.error(error instanceof Error ? error.message : "Supabase export failed.");
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
