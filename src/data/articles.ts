import type { Article } from "@/types/property";
import { IMAGES } from "./properties";

export const articles: Article[] = [
  {
    id: "a1",
    slug: "the-wall-that-lets-light-through",
    title: "The Wall That Lets the Light Through",
    category: "Architectural Styles",
    readMinutes: 9,
    excerpt:
      "A roll of shoji paper wide enough for two screens costs about ¥500 — and it still outperforms expectations in a house designed around it.",
    image: IMAGES.interiorShoji,
  },
  {
    id: "a2",
    slug: "doors-that-are-also-walls",
    title: "The Doors That Are Also the Walls",
    category: "Architectural Styles",
    readMinutes: 9,
    excerpt:
      "Fusuma are the sliding panels that divide a Japanese house and hide its storage. Learn how to read their condition before you buy.",
    image: IMAGES.fusuma,
  },
  {
    id: "a3",
    slug: "machiya-anatomy",
    title: "Anatomy of a Kyoto Machiya",
    category: "City Houses",
    readMinutes: 11,
    excerpt:
      "Narrow front, deep plan, a courtyard in the middle. Why the townhouse plan works, and what it costs to bring one back.",
    image: IMAGES.kyoto,
  },
  {
    id: "a4",
    slug: "reading-a-japanese-roof",
    title: "How to Read a Japanese Roof",
    category: "Inspection",
    readMinutes: 7,
    excerpt:
      "Tile, metal, thatch under metal — the roof tells you most of what you need to know about a vacant house before you step inside.",
    image: IMAGES.roof,
  },
  {
    id: "a5",
    slug: "renovating-a-kominka",
    title: "Renovating a Kominka Without Losing It",
    category: "Renovation",
    readMinutes: 13,
    excerpt:
      "Insulation, foundations and earthquake bracing in a 90-year-old timber frame — where the money actually goes.",
    image: IMAGES.farmhouse,
  },
];
