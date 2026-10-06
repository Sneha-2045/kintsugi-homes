import type { Region } from "@/types/property";
import { IMAGES, properties } from "./properties";

const regionDefinitions: Omit<Region, "count">[] = [
  {
    slug: "kanto",
    name: "Kanto",
    nameJa: "関東",
    image: IMAGES.tokyo,
    blurb: "Tokyo and the surrounding prefectures — the densest market in Japan.",
  },
  {
    slug: "kyushu",
    name: "Kyushu",
    nameJa: "九州",
    image: IMAGES.village,
    blurb: "Warm winters, active volcanoes and some of the cheapest rural stock.",
  },
  {
    slug: "kansai",
    name: "Kansai",
    nameJa: "関西",
    image: IMAGES.kyoto,
    blurb: "Kyoto machiya, Osaka apartments and the Nara countryside.",
  },
  {
    slug: "hokkaido",
    name: "Hokkaido",
    nameJa: "北海道",
    image: IMAGES.hokkaido,
    blurb: "Powder-snow towns, wide plots and a long, well-established resale market.",
  },
  {
    slug: "chubu",
    name: "Chubu",
    nameJa: "中部",
    image: IMAGES.mountains,
    blurb: "The Japanese Alps, Nagano ski country and the Pacific industrial belt.",
  },
  {
    slug: "okinawa",
    name: "Okinawa",
    nameJa: "沖縄",
    image: IMAGES.okinawa,
    blurb: "Subtropical islands with strong rental demand and limited supply.",
  },
  {
    slug: "tohoku",
    name: "Tohoku",
    nameJa: "東北",
    image: IMAGES.farmhouse,
    blurb: "Deep snow, hot springs and the lowest prices per square metre in Honshu.",
  },
  {
    slug: "chugoku",
    name: "Chugoku",
    nameJa: "中国",
    image: IMAGES.temple,
    blurb: "Inland Sea towns, Hiroshima and quiet farmhouse valleys.",
  },
  {
    slug: "shikoku",
    name: "Shikoku",
    nameJa: "四国",
    image: IMAGES.coast,
    blurb: "The pilgrimage island — mild climate, generous municipal grants.",
  },
  {
    slug: "hokuriku",
    name: "Hokuriku",
    nameJa: "北陸",
    image: IMAGES.roof,
    blurb: "Sea-of-Japan coast with heavy-snow architecture and craft towns.",
  },
];

export const regions: Region[] = regionDefinitions.map((region) => ({
  ...region,
  count: properties.filter((property) => property.regionSlug === region.slug).length,
}));
