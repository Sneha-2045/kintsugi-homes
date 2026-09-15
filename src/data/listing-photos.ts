import type { Property } from "@/types/property";

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const akiya = (file: string) =>
  `https://akiyajapan.sgp1.cdn.digitaloceanspaces.com/storage/property/${file}`;

/** Public listing photos from Akiya Japan (referenced, not rehosted). */
export const AKIYA_PHOTOS = {
  hadanoExterior: akiya(
    "hm/hm_b8eb8254-7f5a-11f1-a659-a6ae20f6eefe_c591839511fc1.jpg",
  ),
  hadanoKitchen: akiya(
    "hm/hm_b8eb8254-7f5a-11f1-a659-a6ae20f6eefe_dee7c58dfff53.jpg",
  ),
  hadanoFloorplan: akiya(
    "hm/hm_b8eb8254-7f5a-11f1-a659-a6ae20f6eefe_ea195114edcbf.jpg",
  ),
  newHouseWhite: akiya(
    "sp/sp_f8ec5029-75be-11f1-a659-a6ae20f6eefe_5e55ec424aa2a.jpg",
  ),
  newHouseSle: akiya(
    "sp/sp_167fe476-75ad-11f1-a659-a6ae20f6eefe_5a2be96d15109.jpg",
  ),
  newHousesCorner: akiya(
    "sp/sp_0f9e6784-759b-11f1-a659-a6ae20f6eefe_e81efc40f9bee.jpg",
  ),
  landPlot: akiya(
    "sp/sp_9c96b709-759f-11f1-a659-a6ae20f6eefe_1a9a06af90456.jpg",
  ),
  kashiwazakiAthome:
    "https://www.athome.co.jp/image_files/path/RQ2hTydzBm-RMxQ5Y6irJA==.jpeg",
};

const HOUSE_EXTERIORS = [
  AKIYA_PHOTOS.hadanoExterior,
  AKIYA_PHOTOS.newHouseWhite,
  AKIYA_PHOTOS.newHouseSle,
  AKIYA_PHOTOS.newHousesCorner,
  unsplash("photo-1570459027562-4a916cc6113f"),
  unsplash("photo-1493976040374-85c8e12f0c0e"),
  unsplash("photo-1478436127897-769e1b3f0f36"),
  unsplash("photo-1568605114967-8130f3a36994"),
  unsplash("photo-1570129477492-45c003edd2be"),
  unsplash("photo-1600585154340-be6161a56a0c"),
  unsplash("photo-1605276374104-dee2a0ed3cd6"),
  unsplash("photo-1583608205776-bfd35f0d9f83"),
  unsplash("photo-1613490493576-7fde63acd811"),
  unsplash("photo-1600210492486-724fe5c67fb0"),
  unsplash("photo-1605146769289-440113cc3d00"),
  unsplash("photo-1564013799919-ab600027ffc6"),
  unsplash("photo-1512917774080-9991f1c4c750"),
  unsplash("photo-1582268611958-ebfd161ef9cf"),
  unsplash("photo-1600585154526-990dced4db0d"),
];

const INTERIORS = [
  AKIYA_PHOTOS.hadanoKitchen,
  unsplash("photo-1503899036084-c55cdd92da26"),
  unsplash("photo-1580216643062-cf460548a66a"),
  unsplash("photo-1502672260266-1c1ef2d93688"),
  unsplash("photo-1484154218962-a197022b5858"),
  unsplash("photo-1600566753190-17f0baa2a6c3"),
  unsplash("photo-1600210492493-0946911123ea"),
  unsplash("photo-1600607687939-ce8a6c25118c"),
  unsplash("photo-1522708323590-d24dbb6b0267"),
  unsplash("photo-1493809842364-78817add7ffb"),
];

const LAND = [
  AKIYA_PHOTOS.landPlot,
  unsplash("photo-1524413840807-0c3cb6fa808d"),
  unsplash("photo-1478436127897-769e1b3f0f36"),
  unsplash("photo-1500382017468-9049fed747ef"),
];

const APARTMENTS = [
  unsplash("photo-1502672260266-1c1ef2d93688"),
  unsplash("photo-1522708323590-d24dbb6b0267"),
  unsplash("photo-1493809842364-78817add7ffb"),
  unsplash("photo-1560448204-e02f11c3d0e2"),
  unsplash("photo-1600566753086-00f18fb6b3ea"),
  unsplash("photo-1600607687644-c7171b42498f"),
];

const FEATURED_GALLERIES: Record<string, string[]> = {
  "hadano-kanagawa-4ldk": [
    AKIYA_PHOTOS.hadanoExterior,
    AKIYA_PHOTOS.hadanoKitchen,
    AKIYA_PHOTOS.newHouseWhite,
    AKIYA_PHOTOS.hadanoFloorplan,
  ],
  "kashiwazaki-niigata-5k": [
    AKIYA_PHOTOS.kashiwazakiAthome,
    AKIYA_PHOTOS.hadanoKitchen,
    unsplash("photo-1503899036084-c55cdd92da26"),
    unsplash("photo-1502672260266-1c1ef2d93688"),
  ],
  "shimabara-nagasaki-6dk": [
    AKIYA_PHOTOS.newHouseSle,
    AKIYA_PHOTOS.hadanoKitchen,
    unsplash("photo-1570129477492-45c003edd2be"),
    unsplash("photo-1503899036084-c55cdd92da26"),
  ],
  "miyoshi-tokushima-kominka": [
    AKIYA_PHOTOS.newHousesCorner,
    unsplash("photo-1570459027562-4a916cc6113f"),
    unsplash("photo-1503899036084-c55cdd92da26"),
    unsplash("photo-1524413840807-0c3cb6fa808d"),
  ],
  "miyako-fukuoka-7ldk": [
    unsplash("photo-1570459027562-4a916cc6113f"),
    unsplash("photo-1524413840807-0c3cb6fa808d"),
    unsplash("photo-1503899036084-c55cdd92da26"),
    AKIYA_PHOTOS.hadanoKitchen,
  ],
  "ayabe-kyoto-kominka": [
    unsplash("photo-1493976040374-85c8e12f0c0e"),
    unsplash("photo-1570459027562-4a916cc6113f"),
    unsplash("photo-1503899036084-c55cdd92da26"),
    unsplash("photo-1524413840807-0c3cb6fa808d"),
  ],
  "togakushi-nagano-4k": [
    unsplash("photo-1478436127897-769e1b3f0f36"),
    unsplash("photo-1570459027562-4a916cc6113f"),
    unsplash("photo-1503899036084-c55cdd92da26"),
    AKIYA_PHOTOS.hadanoKitchen,
  ],
};

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = Math.imul(31, hash) + id.charCodeAt(i);
  }
  return Math.abs(hash);
}

function pick(pool: string[], start: number, count: number): string[] {
  const unique: string[] = [];
  for (let i = 0; unique.length < count && i < pool.length * 2; i += 1) {
    const src = pool[(start + i) % pool.length];
    if (!unique.includes(src)) unique.push(src);
  }
  return unique;
}

export function listingGalleryFor(property: Pick<Property, "id" | "categorySlug">): string[] {
  const pinned = FEATURED_GALLERIES[property.id];
  if (pinned) return pinned;

  const seed = hashId(property.id);

  if (property.categorySlug === "land") {
    return pick(LAND, seed, 3);
  }

  if (property.categorySlug === "apartment") {
    return pick(APARTMENTS, seed, 4);
  }

  const rural = ["farmhouse", "akiya-bank", "traditional-house"].includes(
    property.categorySlug,
  );

  const exteriors = rural
    ? [
        unsplash("photo-1570459027562-4a916cc6113f"),
        unsplash("photo-1478436127897-769e1b3f0f36"),
        unsplash("photo-1493976040374-85c8e12f0c0e"),
        AKIYA_PHOTOS.newHousesCorner,
        ...HOUSE_EXTERIORS,
      ]
    : HOUSE_EXTERIORS;

  const cover = exteriors[seed % exteriors.length];
  const restPool = [...INTERIORS, ...exteriors.filter((src) => src !== cover)];
  return [cover, ...pick(restPool, seed, 3)];
}

const REAL_HOSTS = [
  "akiyajapan.sgp1.cdn.digitaloceanspaces.com",
  "athome.co.jp",
];

export function withListingPhotos(property: Property): Property {
  const pinned = FEATURED_GALLERIES[property.id];
  if (pinned) {
    return { ...property, images: pinned };
  }

  const hasUnsplash = property.images.some((src) => src.includes("unsplash.com"));
  const realPhotos = property.images.filter((src) =>
    REAL_HOSTS.some((host) => src.includes(host)),
  );

  if (!hasUnsplash && realPhotos.length > 0) {
    return property;
  }

  return { ...property, images: listingGalleryFor(property) };
}
