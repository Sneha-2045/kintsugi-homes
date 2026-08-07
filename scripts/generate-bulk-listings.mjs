/**
 * Generates ~200 realistic mock Japanese property listings for local demo data.
 * Run: node scripts/generate-bulk-listings.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/data/bulk-listings.ts");

const locations = [
  { city: "Asahikawa", prefecture: "Hokkaido", prefectureSlug: "hokkaido", regionSlug: "hokkaido" },
  { city: "Hakodate", prefecture: "Hokkaido", prefectureSlug: "hokkaido", regionSlug: "hokkaido" },
  { city: "Obihiro", prefecture: "Hokkaido", prefectureSlug: "hokkaido", regionSlug: "hokkaido" },
  { city: "Kushiro", prefecture: "Hokkaido", prefectureSlug: "hokkaido", regionSlug: "hokkaido" },
  { city: "Aomori", prefecture: "Aomori", prefectureSlug: "aomori", regionSlug: "tohoku" },
  { city: "Hirosaki", prefecture: "Aomori", prefectureSlug: "aomori", regionSlug: "tohoku" },
  { city: "Morioka", prefecture: "Iwate", prefectureSlug: "iwate", regionSlug: "tohoku" },
  { city: "Miyako", prefecture: "Iwate", prefectureSlug: "iwate", regionSlug: "tohoku" },
  { city: "Sendai", prefecture: "Miyagi", prefectureSlug: "miyagi", regionSlug: "tohoku" },
  { city: "Ishinomaki", prefecture: "Miyagi", prefectureSlug: "miyagi", regionSlug: "tohoku" },
  { city: "Akita", prefecture: "Akita", prefectureSlug: "akita", regionSlug: "tohoku" },
  { city: "Yokote", prefecture: "Akita", prefectureSlug: "akita", regionSlug: "tohoku" },
  { city: "Yamagata", prefecture: "Yamagata", prefectureSlug: "yamagata", regionSlug: "tohoku" },
  { city: "Tsuruoka", prefecture: "Yamagata", prefectureSlug: "yamagata", regionSlug: "tohoku" },
  { city: "Fukushima", prefecture: "Fukushima", prefectureSlug: "fukushima", regionSlug: "tohoku" },
  { city: "Aizuwakamatsu", prefecture: "Fukushima", prefectureSlug: "fukushima", regionSlug: "tohoku" },
  { city: "Mito", prefecture: "Ibaraki", prefectureSlug: "ibaraki", regionSlug: "kanto" },
  { city: "Hitachi", prefecture: "Ibaraki", prefectureSlug: "ibaraki", regionSlug: "kanto" },
  { city: "Utsunomiya", prefecture: "Tochigi", prefectureSlug: "tochigi", regionSlug: "kanto" },
  { city: "Nikko", prefecture: "Tochigi", prefectureSlug: "tochigi", regionSlug: "kanto" },
  { city: "Maebashi", prefecture: "Gunma", prefectureSlug: "gunma", regionSlug: "kanto" },
  { city: "Takasaki", prefecture: "Gunma", prefectureSlug: "gunma", regionSlug: "kanto" },
  { city: "Kawagoe", prefecture: "Saitama", prefectureSlug: "saitama", regionSlug: "kanto" },
  { city: "Kumagaya", prefecture: "Saitama", prefectureSlug: "saitama", regionSlug: "kanto" },
  { city: "Chiba", prefecture: "Chiba", prefectureSlug: "chiba", regionSlug: "kanto" },
  { city: "Katsuura", prefecture: "Chiba", prefectureSlug: "chiba", regionSlug: "kanto" },
  { city: "Hachioji", prefecture: "Tokyo", prefectureSlug: "tokyo", regionSlug: "kanto" },
  { city: "Ome", prefecture: "Tokyo", prefectureSlug: "tokyo", regionSlug: "kanto" },
  { city: "Yokohama", prefecture: "Kanagawa", prefectureSlug: "kanagawa", regionSlug: "kanto" },
  { city: "Odawara", prefecture: "Kanagawa", prefectureSlug: "kanagawa", regionSlug: "kanto" },
  { city: "Hadano", prefecture: "Kanagawa", prefectureSlug: "kanagawa", regionSlug: "kanto" },
  { city: "Niigata", prefecture: "Niigata", prefectureSlug: "niigata", regionSlug: "hokuriku" },
  { city: "Joetsu", prefecture: "Niigata", prefectureSlug: "niigata", regionSlug: "hokuriku" },
  { city: "Kashiwazaki", prefecture: "Niigata", prefectureSlug: "niigata", regionSlug: "hokuriku" },
  { city: "Toyama", prefecture: "Toyama", prefectureSlug: "toyama", regionSlug: "hokuriku" },
  { city: "Kanazawa", prefecture: "Ishikawa", prefectureSlug: "ishikawa", regionSlug: "hokuriku" },
  { city: "Fukui", prefecture: "Fukui", prefectureSlug: "fukui", regionSlug: "hokuriku" },
  { city: "Kofu", prefecture: "Yamanashi", prefectureSlug: "yamanashi", regionSlug: "chubu" },
  { city: "Fujiyoshida", prefecture: "Yamanashi", prefectureSlug: "yamanashi", regionSlug: "chubu" },
  { city: "Nagano", prefecture: "Nagano", prefectureSlug: "nagano", regionSlug: "chubu" },
  { city: "Matsumoto", prefecture: "Nagano", prefectureSlug: "nagano", regionSlug: "chubu" },
  { city: "Shiojiri", prefecture: "Nagano", prefectureSlug: "nagano", regionSlug: "chubu" },
  { city: "Gifu", prefecture: "Gifu", prefectureSlug: "gifu", regionSlug: "chubu" },
  { city: "Takayama", prefecture: "Gifu", prefectureSlug: "gifu", regionSlug: "chubu" },
  { city: "Shizuoka", prefecture: "Shizuoka", prefectureSlug: "shizuoka", regionSlug: "chubu" },
  { city: "Atami", prefecture: "Shizuoka", prefectureSlug: "shizuoka", regionSlug: "chubu" },
  { city: "Hamamatsu", prefecture: "Shizuoka", prefectureSlug: "shizuoka", regionSlug: "chubu" },
  { city: "Toyota", prefecture: "Aichi", prefectureSlug: "aichi", regionSlug: "chubu" },
  { city: "Nagoya", prefecture: "Aichi", prefectureSlug: "aichi", regionSlug: "chubu" },
  { city: "Tsu", prefecture: "Mie", prefectureSlug: "mie", regionSlug: "kansai" },
  { city: "Ise", prefecture: "Mie", prefectureSlug: "mie", regionSlug: "kansai" },
  { city: "Otsu", prefecture: "Shiga", prefectureSlug: "shiga", regionSlug: "kansai" },
  { city: "Kyoto", prefecture: "Kyoto", prefectureSlug: "kyoto", regionSlug: "kansai" },
  { city: "Ayabe", prefecture: "Kyoto", prefectureSlug: "kyoto", regionSlug: "kansai" },
  { city: "Osaka", prefecture: "Osaka", prefectureSlug: "osaka", regionSlug: "kansai" },
  { city: "Izumisano", prefecture: "Osaka", prefectureSlug: "osaka", regionSlug: "kansai" },
  { city: "Kobe", prefecture: "Hyogo", prefectureSlug: "hyogo", regionSlug: "kansai" },
  { city: "Himeji", prefecture: "Hyogo", prefectureSlug: "hyogo", regionSlug: "kansai" },
  { city: "Nara", prefecture: "Nara", prefectureSlug: "nara", regionSlug: "kansai" },
  { city: "Wakayama", prefecture: "Wakayama", prefectureSlug: "wakayama", regionSlug: "kansai" },
  { city: "Tottori", prefecture: "Tottori", prefectureSlug: "tottori", regionSlug: "chugoku" },
  { city: "Matsue", prefecture: "Shimane", prefectureSlug: "shimane", regionSlug: "chugoku" },
  { city: "Okayama", prefecture: "Okayama", prefectureSlug: "okayama", regionSlug: "chugoku" },
  { city: "Maniwa", prefecture: "Okayama", prefectureSlug: "okayama", regionSlug: "chugoku" },
  { city: "Hiroshima", prefecture: "Hiroshima", prefectureSlug: "hiroshima", regionSlug: "chugoku" },
  { city: "Onomichi", prefecture: "Hiroshima", prefectureSlug: "hiroshima", regionSlug: "chugoku" },
  { city: "Yamaguchi", prefecture: "Yamaguchi", prefectureSlug: "yamaguchi", regionSlug: "chugoku" },
  { city: "Tokushima", prefecture: "Tokushima", prefectureSlug: "tokushima", regionSlug: "shikoku" },
  { city: "Miyoshi", prefecture: "Tokushima", prefectureSlug: "tokushima", regionSlug: "shikoku" },
  { city: "Takamatsu", prefecture: "Kagawa", prefectureSlug: "kagawa", regionSlug: "shikoku" },
  { city: "Matsuyama", prefecture: "Ehime", prefectureSlug: "ehime", regionSlug: "shikoku" },
  { city: "Kochi", prefecture: "Kochi", prefectureSlug: "kochi", regionSlug: "shikoku" },
  { city: "Fukuoka", prefecture: "Fukuoka", prefectureSlug: "fukuoka", regionSlug: "kyushu" },
  { city: "Miyawaka", prefecture: "Fukuoka", prefectureSlug: "fukuoka", regionSlug: "kyushu" },
  { city: "Kurume", prefecture: "Fukuoka", prefectureSlug: "fukuoka", regionSlug: "kyushu" },
  { city: "Saga", prefecture: "Saga", prefectureSlug: "saga", regionSlug: "kyushu" },
  { city: "Nagasaki", prefecture: "Nagasaki", prefectureSlug: "nagasaki", regionSlug: "kyushu" },
  { city: "Shimabara", prefecture: "Nagasaki", prefectureSlug: "nagasaki", regionSlug: "kyushu" },
  { city: "Hirado", prefecture: "Nagasaki", prefectureSlug: "nagasaki", regionSlug: "kyushu" },
  { city: "Kumamoto", prefecture: "Kumamoto", prefectureSlug: "kumamoto", regionSlug: "kyushu" },
  { city: "Misato", prefecture: "Kumamoto", prefectureSlug: "kumamoto", regionSlug: "kyushu" },
  { city: "Oita", prefecture: "Oita", prefectureSlug: "oita", regionSlug: "kyushu" },
  { city: "Beppu", prefecture: "Oita", prefectureSlug: "oita", regionSlug: "kyushu" },
  { city: "Miyazaki", prefecture: "Miyazaki", prefectureSlug: "miyazaki", regionSlug: "kyushu" },
  { city: "Kagoshima", prefecture: "Kagoshima", prefectureSlug: "kagoshima", regionSlug: "kyushu" },
  { city: "Minamikyushu", prefecture: "Kagoshima", prefectureSlug: "kagoshima", regionSlug: "kyushu" },
  { city: "Naha", prefecture: "Okinawa", prefectureSlug: "okinawa", regionSlug: "okinawa" },
  { city: "Ishigaki", prefecture: "Okinawa", prefectureSlug: "okinawa", regionSlug: "okinawa" },
  { city: "Nago", prefecture: "Okinawa", prefectureSlug: "okinawa", regionSlug: "okinawa" },
];

const imageKeys = [
  "roof",
  "garden",
  "interiorShoji",
  "fusuma",
  "interior",
  "village",
  "farmhouse",
  "mountains",
  "coast",
  "machiya",
  "street",
  "hokkaido",
  "okinawa",
  "kyoto",
];

const layouts = ["2K", "2DK", "2LDK", "3K", "3DK", "3LDK", "4K", "4DK", "4LDK", "5K", "5DK", "6DK", "7DK", "8DK"];
const amenities = [
  "Convenience store — 5 min walk",
  "Convenience store — 8 min drive",
  "Station — 10 min walk",
  "Station — 15 min walk",
  "Supermarket — 6 min drive",
  "Quiet residential street",
  "Parking for 2 cars",
  "Parking for 3 cars",
  "Elementary school nearby",
  "Bus stop — 4 min walk",
  "Hospital — 10 min drive",
  "Sea view nearby",
  "Mountain outlook",
  "Garden and storage shed",
  "Neighborhood association required",
];

const titleParts = {
  house: [
    "Detached house with parking",
    "Family home on a quiet lane",
    "Two-storey wooden house",
    "Renovation-ready house",
    "Sunny house with garden",
    "Corner-lot family home",
  ],
  apartment: [
    "Renovated apartment near transit",
    "Corner unit with city views",
    "Compact mansion apartment",
    "Bright 2LDK apartment",
    "Upper-floor apartment",
  ],
  land: [
    "Residential building plot",
    "Cleared lot with road frontage",
    "Sunny residential land",
    "Flat plot ready to build",
  ],
  "akiya-bank": [
    "Municipal vacant-house listing",
    "Akiya bank wooden home",
    "Vacant house programme property",
    "Local government akiya listing",
  ],
  "traditional-house": [
    "Traditional machiya townhouse",
    "Kominka with tatami rooms",
    "Old wooden townhouse",
    "Lattice-front traditional house",
  ],
  farmhouse: [
    "Farmhouse with attached land",
    "Rural farmhouse and barn",
    "Countryside farmhouse",
    "Farmhouse overlooking rice fields",
  ],
};

const descriptions = {
  house: [
    "Two-storey wooden house with a practical layout and room to renovate. Utilities are connected and the plot sits on a quiet residential street.",
    "Solid family home with a south-facing garden. Needs cosmetic work inside but the structure and roof are sound.",
    "Detached house with parking and storage. Close to daily shops; a straightforward move-in or light renovation project.",
  ],
  apartment: [
    "Well-kept apartment unit with elevator access. Management fees are current and the building is regularly maintained.",
    "Bright corner apartment with a compact kitchen and balcony. Ideal as a pied-à-terre or first purchase.",
    "Renovated unit with new flooring and fixtures. Convenient for commuting and everyday errands.",
  ],
  land: [
    "Cleared residential plot with road access and utilities at the boundary. Check local building coverage before design.",
    "Flat lot suitable for a compact house. No major slope work required; confirm setbacks with the municipality.",
    "Quiet residential land with good sun exposure. Suitable for a small home or workshop build.",
  ],
  "akiya-bank": [
    "Listed through the municipal vacant-house programme. Expect registration steps and possible residency conditions.",
    "Affordable akiya-bank home needing renovation. Confirm transfer rules and any local grant programmes.",
    "Vacant wooden house via the city akiya bank. Bring a contractor for a structural check before offering.",
  ],
  "traditional-house": [
    "Traditional wooden house with tatami rooms and an engawa. Character throughout; plan a careful renovation.",
    "Older townhouse with original beams and lattice details. Best suited to buyers who value craft over turnkey finish.",
    "Kominka-style home with connected rooms. Needs updates to kitchen and bath while keeping the timber frame.",
  ],
  farmhouse: [
    "Rural farmhouse with outdoor space for gardening. Includes a shed; farmland parcels may need separate approval.",
    "Countryside home with views over fields. Quiet setting with room for vehicles and outdoor work.",
    "Farmhouse plot with barn and vegetable beds. Ideal for buyers seeking space and a slower pace.",
  ],
};

function pick(arr, i) {
  return arr[i % arr.length];
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function categoryFor(i) {
  const weights = [
    ["house", 90],
    ["farmhouse", 28],
    ["akiya-bank", 28],
    ["traditional-house", 20],
    ["apartment", 20],
    ["land", 14],
  ];
  let n = i % 200;
  for (const [cat, w] of weights) {
    if (n < w) return cat;
    n -= w;
  }
  return "house";
}

function priceFor(cat, i) {
  const base = {
    house: [800_000, 18_000_000],
    farmhouse: [500_000, 8_000_000],
    "akiya-bank": [100_000, 4_000_000],
    "traditional-house": [1_000_000, 15_000_000],
    apartment: [4_000_000, 25_000_000],
    land: [1_500_000, 12_000_000],
  }[cat];
  const t = ((i * 37) % 100) / 100;
  const jpy = Math.round((base[0] + (base[1] - base[0]) * t) / 10_000) * 10_000;
  return { priceJpy: jpy, priceUsd: Math.round(jpy / 150) };
}

function roomsFor(cat, i) {
  if (cat === "land") return {};
  if (cat === "apartment") {
    const beds = 1 + (i % 3);
    return {
      bedrooms: beds,
      floorArea: 35 + (i % 45),
      yearBuilt: 1985 + (i % 35),
    };
  }
  const beds = 2 + (i % 7);
  const floor = 55 + (i % 140);
  const land = cat === "farmhouse" || cat === "akiya-bank" ? 200 + (i % 1200) : 80 + (i % 400);
  return {
    bedrooms: beds,
    floorArea: floor,
    landArea: land,
    yearBuilt: 1920 + (i % 90),
  };
}

function tagsFor(cat, layout, i) {
  const tags = ["Buy"];
  if (cat === "house") tags.push("House", layout, i % 2 ? "Freehold" : "Renovation Project");
  else if (cat === "apartment") tags.push("Apartment", layout, i % 2 ? "Renovated" : "Near Station");
  else if (cat === "land") tags.push("Land", "Residential Zone", i % 2 ? "Utilities Ready" : "Buildable");
  else if (cat === "akiya-bank") tags.push("Akiya Bank", layout, "Needs Renovation");
  else if (cat === "traditional-house") tags.push("Traditional House", layout, i % 2 ? "Machiya" : "Kominka");
  else tags.push("Farmhouse", layout, i % 2 ? "Farmland" : "Rural");
  return tags;
}

const TARGET = 200;
const listings = [];

for (let i = 0; i < TARGET; i++) {
  const loc = pick(locations, i * 3 + 7);
  const cat = categoryFor(i);
  const layout = pick(layouts, i * 5);
  const { priceJpy, priceUsd } = priceFor(cat, i);
  const rooms = roomsFor(cat, i);
  const title = pick(titleParts[cat], i);
  const imgs = [
    pick(imageKeys, i),
    pick(imageKeys, i + 3),
    pick(imageKeys, i + 7),
    pick(imageKeys, i + 11),
  ].filter((v, idx, a) => a.indexOf(v) === idx);
  while (imgs.length < 3) imgs.push(pick(imageKeys, i + imgs.length + 20));

  const id = `${slugify(loc.city)}-${cat}-${String(i + 1).padStart(3, "0")}`;
  const tags = tagsFor(cat, layout, i);
  const locLabel =
    loc.prefecture === "Hokkaido" || loc.prefecture === "Okinawa"
      ? `${loc.city}, ${loc.prefecture}`
      : `${loc.city}, ${loc.prefecture} Prefecture`;

  listings.push({
    id,
    title,
    location: locLabel,
    prefecture: loc.prefecture,
    regionSlug: loc.regionSlug,
    prefectureSlug: loc.prefectureSlug,
    categorySlug: cat,
    priceUsd,
    priceJpy,
    addedDaysAgo: 1 + (i % 14),
    images: imgs,
    tags,
    extraTags: 2 + (i % 6),
    ...rooms,
    amenity: pick(amenities, i * 2),
    description: pick(descriptions[cat], i),
  });
}

const body = listings
  .map((p) => {
    const imageExpr = `[${p.images.map((k) => `IMAGES.${k}`).join(", ")}]`;
    const optional = [
      p.bedrooms != null ? `    bedrooms: ${p.bedrooms},` : null,
      p.floorArea != null ? `    floorArea: ${p.floorArea},` : null,
      p.landArea != null ? `    landArea: ${p.landArea},` : null,
      p.yearBuilt != null ? `    yearBuilt: ${p.yearBuilt},` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return `  {
    id: ${JSON.stringify(p.id)},
    title: ${JSON.stringify(p.title)},
    location: ${JSON.stringify(p.location)},
    prefecture: ${JSON.stringify(p.prefecture)},
    regionSlug: ${JSON.stringify(p.regionSlug)},
    prefectureSlug: ${JSON.stringify(p.prefectureSlug)},
    categorySlug: ${JSON.stringify(p.categorySlug)},
    priceUsd: ${p.priceUsd},
    priceJpy: ${p.priceJpy},
    addedDaysAgo: ${p.addedDaysAgo},
    images: ${imageExpr},
    tags: ${JSON.stringify(p.tags)},
    extraTags: ${p.extraTags},
${optional}
    amenity: ${JSON.stringify(p.amenity)},
    description: ${JSON.stringify(p.description)},
  }`;
  })
  .join(",\n");

const file = `import type { Property } from "@/types/property";
import { IMAGES } from "./images";

/** Auto-generated mock inventory for local demo. Do not edit by hand — re-run scripts/generate-bulk-listings.mjs */
export const bulkListings: Property[] = [
${body},
];
`;

writeFileSync(outPath, file);
console.log(`Wrote ${listings.length} listings to ${outPath}`);
