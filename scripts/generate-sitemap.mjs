import { readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildSitemapGroups,
  loadSitemapData,
  MAX_URLS_PER_SITEMAP,
  SITE_ORIGIN,
} from "./sitemap-data.mjs";

const publicDirectory = join(process.cwd(), "public");
const xmlEscape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const data = await loadSitemapData();
const groups = buildSitemapGroups(data);
const sitemapFiles = [];

for (const group of groups) {
  const chunks = [];
  for (let offset = 0; offset < group.entries.length; offset += MAX_URLS_PER_SITEMAP) {
    chunks.push(group.entries.slice(offset, offset + MAX_URLS_PER_SITEMAP));
  }

  for (const [index, entries] of chunks.entries()) {
    const suffix = chunks.length > 1 ? `-${index + 1}` : "";
    const filename = `sitemap-${group.name}${suffix}.xml`;
    const body = entries
      .map(({ path, lastmod }) => {
        const url = `${SITE_ORIGIN}${path}`;
        const lastmodTag = lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
        return `  <url>\n    <loc>${xmlEscape(url)}</loc>${lastmodTag}\n  </url>`;
      })
      .join("\n");
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

    await writeFile(join(publicDirectory, filename), xml, "utf8");
    sitemapFiles.push({ filename, count: entries.length });
  }
}

const indexBody = sitemapFiles
  .map(
    ({ filename }) =>
      `  <sitemap>\n    <loc>${SITE_ORIGIN}/${filename}</loc>\n  </sitemap>`,
  )
  .join("\n");
const indexXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexBody}\n</sitemapindex>\n`;

await writeFile(join(publicDirectory, "sitemap.xml"), indexXml, "utf8");
await writeFile(
  join(publicDirectory, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
  "utf8",
);

const generatedNames = new Set(["sitemap.xml", ...sitemapFiles.map((file) => file.filename)]);
const staleSitemapPattern = /^sitemap-(?:pages|japan-properties|us-properties|japan-locations|us-locations|articles)(?:-\d+)?\.xml$/;
for (const filename of await readdir(publicDirectory)) {
  if (staleSitemapPattern.test(filename) && !generatedNames.has(filename)) {
    await rm(join(publicDirectory, filename));
  }
}

for (const file of sitemapFiles) {
  console.log(`${file.filename}: ${file.count} URLs`);
}
console.log(`sitemap.xml: ${sitemapFiles.length} sitemap files, ${sitemapFiles.reduce((sum, file) => sum + file.count, 0)} URLs total`);
