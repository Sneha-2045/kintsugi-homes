import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { buildSitemapGroups, loadSitemapData, SITE_ORIGIN } from "./sitemap-data.mjs";

const publicDirectory = join(process.cwd(), "public");
const sitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const fail = (message) => {
  throw new Error(`Sitemap validation failed: ${message}`);
};

function assertWellFormedXml(xml, filename) {
  const tokens = /<\?xml[^?]*\?>|<\/[A-Za-z][^>]*>|<[A-Za-z][^>]*>|[^<]+/gy;
  const stack = [];
  let cursor = 0;
  let rootName;

  while (cursor < xml.length) {
    tokens.lastIndex = cursor;
    const match = tokens.exec(xml);
    if (!match) fail(`${filename} contains malformed XML near character ${cursor}`);
    const token = match[0];
    cursor = tokens.lastIndex;
    if (token.startsWith("<?xml")) continue;

    if (token.startsWith("</")) {
      const name = token.match(/^<\/([A-Za-z][\w.-]*)>$/)?.[1];
      if (!name || stack.pop() !== name) fail(`${filename} has mismatched XML tags`);
      continue;
    }

    if (token.startsWith("<")) {
      const name = token.match(/^<([A-Za-z][\w.-]*)\b[^>]*>$/)?.[1];
      if (!name) fail(`${filename} contains an invalid XML tag`);
      if (!rootName) rootName = name;
      stack.push(name);
      continue;
    }

    if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/i.test(token)) {
      fail(`${filename} contains an unescaped XML entity`);
    }
  }

  if (stack.length || !rootName) fail(`${filename} has an incomplete XML document`);
  return rootName;
}

function extractLocations(xml, filename) {
  const values = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) =>
    match[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'"),
  );
  if (values.length === 0) fail(`${filename} contains no <loc> entries`);
  return values;
}

function assertProductionUrl(value, filename) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${filename} contains an invalid URL: ${value}`);
  }
  if (url.origin !== SITE_ORIGIN) fail(`${filename} contains a non-production URL: ${value}`);
  if (url.search || url.hash) fail(`${filename} contains a query or fragment: ${value}`);
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    fail(`${filename} contains a trailing slash variant: ${value}`);
  }
  if (/\b(?:localhost|staging|preview|dev)\b/i.test(value)) {
    fail(`${filename} contains a local, staging, or development URL: ${value}`);
  }
  if (/^\/(?:login|signup|account|saved|settings|checkout|pricing|admin|_authenticated|api)(?:\/|$)/i.test(url.pathname)) {
    fail(`${filename} contains a private or intentionally excluded route: ${value}`);
  }
}

const names = await readdir(publicDirectory);
const indexPath = join(publicDirectory, "sitemap.xml");
const indexXml = await readFile(indexPath, "utf8");
if (assertWellFormedXml(indexXml, "sitemap.xml") !== "sitemapindex") {
  fail("sitemap.xml must be a sitemap index");
}
if (!indexXml.includes(`xmlns="${sitemapNamespace}"`)) fail("sitemap.xml has the wrong namespace");

const referencedSitemaps = extractLocations(indexXml, "sitemap.xml");
const allPropertyPageUrls = new Set();
const referencedFiles = [];

for (const reference of referencedSitemaps) {
  assertProductionUrl(reference, "sitemap.xml");
  const parsed = new URL(reference);
  const filename = parsed.pathname.slice(1);
  if (!/^sitemap-[a-z-]+(?:-\d+)?\.xml$/.test(filename)) {
    fail(`sitemap index references an unexpected file: ${filename}`);
  }
  if (!names.includes(filename)) fail(`sitemap index references missing file ${filename}`);
  referencedFiles.push(filename);

  const xml = await readFile(join(publicDirectory, filename), "utf8");
  if (assertWellFormedXml(xml, filename) !== "urlset") fail(`${filename} must be a URL set`);
  if (!xml.includes(`xmlns="${sitemapNamespace}"`)) fail(`${filename} has the wrong namespace`);

  const locations = extractLocations(xml, filename);
  if (locations.length > 50_000) fail(`${filename} exceeds the 50,000 URL sitemap limit`);
  for (const [, lastmod] of xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod) || !Number.isFinite(Date.parse(lastmod))) {
      fail(`${filename} contains an invalid lastmod date: ${lastmod}`);
    }
  }

  for (const value of locations) {
    assertProductionUrl(value, filename);
    if (allPropertyPageUrls.has(value)) fail(`duplicate URL across sitemap files: ${value}`);
    allPropertyPageUrls.add(value);
  }
}

if (new Set(referencedFiles).size !== referencedFiles.length) fail("sitemap index has duplicate references");

const data = await loadSitemapData();
const expectedPaths = new Set(buildSitemapGroups(data).flatMap((group) => group.entries.map((entry) => entry.path)));
const actualPaths = new Set([...allPropertyPageUrls].map((value) => new URL(value).pathname));
for (const path of expectedPaths) {
  if (!actualPaths.has(path)) fail(`expected route from current application data is missing: ${path}`);
}
for (const path of actualPaths) {
  if (!expectedPaths.has(path)) fail(`sitemap contains a route absent from current application data: ${path}`);
}

const robots = await readFile(join(publicDirectory, "robots.txt"), "utf8");
if (!/^User-agent: \*\nAllow: \/\n/m.test(robots)) fail("robots.txt must allow crawling for all user agents");
if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) fail("robots.txt is missing the production sitemap URL");

console.log(`Validated ${allPropertyPageUrls.size} unique URLs across ${referencedFiles.length} sitemap files.`);
