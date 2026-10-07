import { createServer } from "vite";

export const SITE_ORIGIN = "https://rylestate.com";
export const MAX_URLS_PER_SITEMAP = 50_000;

export async function loadSitemapData() {
  const server = await createServer({
    configFile: "vite.config.ts",
    mode: "production",
    logLevel: "silent",
    server: { middlewareMode: true, ws: false },
    appType: "custom",
  });

  try {
    const [japanModule, usModule, articleModule, regionModule, prefectureModule, bulkModule, moreModule] =
      await Promise.all([
        server.ssrLoadModule("/src/data/properties.ts"),
        server.ssrLoadModule("/src/data/us-listings.ts"),
        server.ssrLoadModule("/src/data/articles.ts"),
        server.ssrLoadModule("/src/data/regions.ts"),
        server.ssrLoadModule("/src/data/prefectures.ts"),
        server.ssrLoadModule("/src/data/bulk-listings.ts"),
        server.ssrLoadModule("/src/data/more-properties.ts"),
      ]);

    return {
      japanProperties: japanModule.properties,
      usProperties: usModule.usListings,
      articles: articleModule.articles,
      regions: regionModule.regions,
      prefectures: prefectureModule.prefectures,
      categories: japanModule.propertyCategories,
      demoJapanPropertyIds: new Set([
        ...bulkModule.bulkListings.map((property) => property.id),
        ...moreModule.moreProperties.map((property) => property.id),
      ]),
    };
  } finally {
    await server.close();
  }
}

function lastModified(record) {
  const value = record.updated_at ?? record.updatedAt ?? record.lastModified;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return undefined;
  return new Date(value).toISOString().slice(0, 10);
}

function uniqueEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (!entry.path || seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });
}

export function buildSitemapGroups(data) {
  const staticPages = [
    "/",
    "/japan-properties",
    "/us-properties",
    "/search",
    "/map",
    "/consult",
  ].map((path) => ({ path }));

  const categories = data.categories
    .filter((category) => category.count > 0 && category.slug)
    .map((category) => ({ path: `/category/${encodeURIComponent(category.slug)}` }));

  const detailIds = new Set();
  const propertyEntries = (properties) =>
    properties.flatMap((property) => {
      const id = property?.id;
      if (
        typeof id !== "string" ||
        !id.trim() ||
        /[/?#]/.test(id) ||
        detailIds.has(id)
      ) {
        return [];
      }
      detailIds.add(id);
      return [
        {
          path: `/property/${encodeURIComponent(id)}`,
          lastmod: lastModified(property),
        },
      ];
    });

  // The Japan inventory currently consists of featured samples plus generated/demo data.
  // Only source-backed, non-demo Japan records can enter the sitemap when live records exist.
  const japanProperties = propertyEntries(
    data.japanProperties.filter(
      (property) => property.sourceUrl && !data.demoJapanPropertyIds.has(property.id),
    ),
  );
  const usProperties = propertyEntries(
    data.usProperties.filter((property) => property.sourceUrl && property.lastCheckedAt),
  );

  const locations = [
    ...data.regions
      .filter((region) => region.count > 0 && region.slug)
      .map((region) => ({ path: `/region/${encodeURIComponent(region.slug)}` })),
    ...data.prefectures
      .filter((prefecture) => prefecture.count > 0 && prefecture.slug)
      .map((prefecture) => ({ path: `/prefecture/${encodeURIComponent(prefecture.slug)}` })),
  ];

  const groups = [
    { name: "pages", entries: uniqueEntries([...staticPages, ...categories]) },
    { name: "japan-properties", entries: uniqueEntries(japanProperties) },
    { name: "us-properties", entries: uniqueEntries(usProperties) },
    { name: "japan-locations", entries: uniqueEntries(locations) },
    {
      name: "articles",
      entries: data.articles.length > 0 ? [{ path: "/articles" }] : [],
    },
  ].filter((group) => group.entries.length > 0);

  const seenPaths = new Set();
  for (const group of groups) {
    group.entries = group.entries.filter((entry) => {
      if (seenPaths.has(entry.path)) return false;
      seenPaths.add(entry.path);
      return true;
    });
  }

  return groups.filter((group) => group.entries.length > 0);
}
