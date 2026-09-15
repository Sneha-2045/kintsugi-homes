import { supabase } from "@/integrations/supabase/client";
import { withCoordinates } from "@/lib/property-coords";
import type { Property } from "@/types/property";

export type ListingStatus = "draft" | "published";

export interface PropertyImageRow {
  id?: string;
  url: string;
  storage_path: string | null;
  alt_text: string | null;
  sort_order: number;
}

export interface PropertyRow {
  id: string;
  source_url: string | null;
  source_listing_id: string;
  title: string;
  price: number | null;
  currency: string;
  country: string;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: string | null;
  listing_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  land_area: number | null;
  building_area: number | null;
  year_built: number | null;
  description: string | null;
  features: string[];
  nearby_places: string[];
  cover_image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyWithImages extends PropertyRow {
  property_images: PropertyImageRow[];
}

const slug = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const JPY_PER_USD = 150;

const daysAgo = (iso: string) =>
  Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000));

/** Maps a database listing onto the existing frontend Property shape. */
export function toProperty(row: PropertyWithImages): Property {
  const images = [...(row.property_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const gallery = images.map((i) => i.url);
  const cover = row.cover_image_url ?? gallery[0];
  const ordered = cover ? [cover, ...gallery.filter((u) => u !== cover)] : gallery;

  const isJpy = (row.currency ?? "JPY").toUpperCase() === "JPY";
  const price = row.price ?? 0;
  const priceJpy = isJpy ? price : Math.round(price * JPY_PER_USD);
  const priceUsd = isJpy ? Math.round(price / JPY_PER_USD) : price;

  const location = [row.city, row.prefecture].filter(Boolean).join(", ") || row.country;
  const tags = row.features.slice(0, 4);

  return withCoordinates({
    id: row.id,
    title: row.title,
    location,
    prefecture: row.prefecture ?? row.country,
    regionSlug: slug(row.prefecture ?? row.country),
    prefectureSlug: slug(row.prefecture ?? row.country),
    categorySlug: slug(row.property_type ?? "house"),
    priceUsd,
    priceJpy,
    addedDaysAgo: daysAgo(row.created_at),
    images: ordered.length > 0 ? ordered : ["/placeholder.svg"],
    tags,
    extraTags: Math.max(0, row.features.length - tags.length),
    ...(row.bedrooms != null ? { bedrooms: row.bedrooms } : {}),
    ...(row.building_area != null ? { floorArea: Number(row.building_area) } : {}),
    ...(row.land_area != null ? { landArea: Number(row.land_area) } : {}),
    ...(row.year_built != null ? { yearBuilt: row.year_built } : {}),
    amenity: row.nearby_places[0] ?? row.address ?? row.country,
    description: row.description ?? "",
    ...(row.latitude != null && row.longitude != null
      ? { latitude: Number(row.latitude), longitude: Number(row.longitude) }
      : {}),
  });
}

const SELECT = "*, property_images(id,url,storage_path,alt_text,sort_order)";

export async function fetchPublishedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as PropertyWithImages[]).map(toProperty);
}

export async function fetchPublishedProperty(id: string): Promise<Property | null> {
  const uuid = /^[0-9a-f-]{36}$/i.test(id);
  if (!uuid) return null;
  const { data, error } = await supabase
    .from("properties")
    .select(SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? toProperty(data as unknown as PropertyWithImages) : null;
}

export async function fetchAdminProperties(): Promise<PropertyWithImages[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(SELECT)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as unknown as PropertyWithImages[];
}

export async function fetchAdminProperty(id: string): Promise<PropertyWithImages | null> {
  const { data, error } = await supabase.from("properties").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as PropertyWithImages) ?? null;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;
  const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (error) return false;
  return Boolean(data);
}
