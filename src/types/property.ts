export interface Property {
  id: string;
  title: string;
  location: string;
  prefecture: string;
  regionSlug: string;
  prefectureSlug: string;
  categorySlug: string;
  priceUsd: number;
  priceJpy?: number;
  addedDaysAgo: number;
  images: string[];
  tags: string[];
  extraTags: number;
  bedrooms?: number;
  floorArea?: number;
  landArea?: number;
  yearBuilt?: number;
    auctionDate?: string;
propertyType?: string;
  amenity: string;
  description: string;
  latitude?: number;
  longitude?: number;
}

export interface Region {
  slug: string;
  name: string;
  nameJa: string;
  count: number;
  image: string;
  blurb: string;
}

export interface Prefecture {
  slug: string;
  name: string;
  nameJa: string;
  count: number;
  regionSlug: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  readMinutes: number;
  excerpt: string;
  image: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Partner {
  id: string;
  name: string;
  color: string;
  badge: string;
  description: string;
  quote: string;
  author: string;
  rating: number;
}

export interface PropertyCategory {
  slug: string;
  title: string;
  description: string;
  count: number;
}
