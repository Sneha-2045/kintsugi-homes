import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { ImageUploader, type GalleryImage } from "@/components/admin/ImageUploader";
import { Button } from "@/components/common/Button";
import { supabase } from "@/integrations/supabase/client";
import type { PropertyWithImages } from "@/lib/property-db";

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-elevated px-3 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass = "mb-2 block text-sm font-medium text-foreground";

function Field({
  label,
  htmlFor,
  required,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

interface FormState {
  source_url: string;
  source_listing_id: string;
  title: string;
  price: string;
  currency: string;
  country: string;
  prefecture: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  property_type: string;
  listing_type: string;
  bedrooms: string;
  bathrooms: string;
  land_area: string;
  building_area: string;
  year_built: string;
  description: string;
  features: string;
  nearby_places: string;
}

const emptyState: FormState = {
  source_url: "",
  source_listing_id: "",
  title: "",
  price: "",
  currency: "JPY",
  country: "Japan",
  prefecture: "",
  city: "",
  address: "",
  latitude: "",
  longitude: "",
  property_type: "House",
  listing_type: "sale",
  bedrooms: "",
  bathrooms: "",
  land_area: "",
  building_area: "",
  year_built: "",
  description: "",
  features: "",
  nearby_places: "",
};

const fromRow = (row: PropertyWithImages): FormState => ({
  source_url: row.source_url ?? "",
  source_listing_id: row.source_listing_id,
  title: row.title,
  price: row.price != null ? String(row.price) : "",
  currency: row.currency,
  country: row.country,
  prefecture: row.prefecture ?? "",
  city: row.city ?? "",
  address: row.address ?? "",
  latitude: row.latitude != null ? String(row.latitude) : "",
  longitude: row.longitude != null ? String(row.longitude) : "",
  property_type: row.property_type ?? "",
  listing_type: row.listing_type,
  bedrooms: row.bedrooms != null ? String(row.bedrooms) : "",
  bathrooms: row.bathrooms != null ? String(row.bathrooms) : "",
  land_area: row.land_area != null ? String(row.land_area) : "",
  building_area: row.building_area != null ? String(row.building_area) : "",
  year_built: row.year_built != null ? String(row.year_built) : "",
  description: row.description ?? "",
  features: row.features.join(", "),
  nearby_places: row.nearby_places.join(", "),
});

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const list = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function PropertyForm({ initial }: { initial?: PropertyWithImages | null }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial ? fromRow(initial) : emptyState);
  const [images, setImages] = useState<GalleryImage[]>(
    initial
      ? [...initial.property_images]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => ({
            ...(i.id ? { id: i.id } : {}),
            url: i.url,
            storage_path: i.storage_path,
            alt_text: i.alt_text,
          }))
      : [],
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.cover_image_url ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.source_listing_id.trim()) e["source_listing_id"] = "Source listing ID is required.";
    if (!form.title.trim()) e["title"] = "Title is required.";
    if (!form.country.trim()) e["country"] = "Country is required.";
    if (!form.currency.trim()) e["currency"] = "Currency is required.";
    if (form.price.trim() === "" || Number.isNaN(Number(form.price)) || Number(form.price) < 0)
      e["price"] = "Enter a valid price.";
    if (form.source_url.trim() && !/^https?:\/\//i.test(form.source_url.trim()))
      e["source_url"] = "Source URL must start with http:// or https://";
    if (form.latitude.trim() && Math.abs(Number(form.latitude)) > 90) e["latitude"] = "Latitude must be between -90 and 90.";
    if (form.longitude.trim() && Math.abs(Number(form.longitude)) > 180)
      e["longitude"] = "Longitude must be between -180 and 180.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (status: "draft" | "published") => {
    setMessage(null);
    if (!validate()) return;
    if (status === "published" && images.length === 0) {
      setMessage("Add at least one image before publishing.");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        source_url: form.source_url.trim() || null,
        source_listing_id: form.source_listing_id.trim(),
        title: form.title.trim(),
        price: num(form.price),
        currency: form.currency.trim().toUpperCase(),
        country: form.country.trim(),
        prefecture: form.prefecture.trim() || null,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        latitude: num(form.latitude),
        longitude: num(form.longitude),
        property_type: form.property_type.trim() || null,
        listing_type: form.listing_type,
        bedrooms: num(form.bedrooms),
        bathrooms: num(form.bathrooms),
        land_area: num(form.land_area),
        building_area: num(form.building_area),
        year_built: num(form.year_built),
        description: form.description.trim() || null,
        features: list(form.features),
        nearby_places: list(form.nearby_places),
        cover_image_url: coverUrl ?? images[0]?.url ?? null,
        status,
      };

      let propertyId = initial?.id ?? null;

      if (propertyId) {
        const { error } = await supabase.from("properties").update(payload).eq("id", propertyId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("properties")
          .insert({ ...payload, created_by: userData.user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        propertyId = data.id;
      }

      await supabase.from("property_images").delete().eq("property_id", propertyId);
      if (images.length > 0) {
        const { error } = await supabase.from("property_images").insert(
          images.map((img, i) => ({
            property_id: propertyId,
            url: img.url,
            storage_path: img.storage_path,
            alt_text: img.alt_text,
            sort_order: i,
          })),
        );
        if (error) throw error;
      }

      void navigate({ to: "/admin" });
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === "23505") {
        setErrors((prev) => ({
          ...prev,
          source_listing_id: "A property with this source listing ID already exists.",
        }));
        setMessage("Duplicate source listing ID — this listing has already been added.");
      } else {
        setMessage(e.message ?? "Could not save the property.");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!initial) return;
    if (!window.confirm("Delete this property and its images? This cannot be undone.")) return;
    setSaving(true);
    const paths = images.map((i) => i.storage_path).filter((p): p is string => Boolean(p));
    if (paths.length > 0) await supabase.storage.from("property-images").remove(paths);
    const { error } = await supabase.from("properties").delete().eq("id", initial.id);
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    void navigate({ to: "/admin" });
  };

  const err = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-destructive" role="alert">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save("published");
      }}
      className="space-y-10"
    >
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Source</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter details manually from sources you are authorized to reuse.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Source URL" htmlFor="source_url">
            <input
              id="source_url"
              className={inputClass}
              value={form.source_url}
              onChange={(e) => set("source_url")(e.target.value)}
              placeholder="https://example.com/listing/123"
            />
            {err("source_url")}
          </Field>
          <Field label="Source listing ID" htmlFor="source_listing_id" required hint="Must be unique.">
            <input
              id="source_listing_id"
              className={inputClass}
              value={form.source_listing_id}
              onChange={(e) => set("source_listing_id")(e.target.value)}
              placeholder="ABC-12345"
            />
            {err("source_listing_id")}
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Listing</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Title" htmlFor="title" required>
              <input
                id="title"
                className={inputClass}
                value={form.title}
                onChange={(e) => set("title")(e.target.value)}
                placeholder="Traditional kominka with garden"
              />
              {err("title")}
            </Field>
          </div>
          <Field label="Price" htmlFor="price" required>
            <input
              id="price"
              type="number"
              min="0"
              className={inputClass}
              value={form.price}
              onChange={(e) => set("price")(e.target.value)}
            />
            {err("price")}
          </Field>
          <Field label="Currency" htmlFor="currency" required>
            <select
              id="currency"
              className={inputClass}
              value={form.currency}
              onChange={(e) => set("currency")(e.target.value)}
            >
              <option value="JPY">JPY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            {err("currency")}
          </Field>
          <Field label="Property type" htmlFor="property_type">
            <input
              id="property_type"
              className={inputClass}
              value={form.property_type}
              onChange={(e) => set("property_type")(e.target.value)}
              placeholder="House, Apartment, Land…"
            />
          </Field>
          <Field label="Listing type" htmlFor="listing_type">
            <select
              id="listing_type"
              className={inputClass}
              value={form.listing_type}
              onChange={(e) => set("listing_type")(e.target.value)}
            >
              <option value="sale">For sale</option>
              <option value="rent">For rent</option>
            </select>
          </Field>
          <Field label="Bedrooms / rooms" htmlFor="bedrooms">
            <input
              id="bedrooms"
              type="number"
              min="0"
              className={inputClass}
              value={form.bedrooms}
              onChange={(e) => set("bedrooms")(e.target.value)}
            />
          </Field>
          <Field label="Bathrooms" htmlFor="bathrooms">
            <input
              id="bathrooms"
              type="number"
              min="0"
              className={inputClass}
              value={form.bathrooms}
              onChange={(e) => set("bathrooms")(e.target.value)}
            />
          </Field>
          <Field label="Land area (m²)" htmlFor="land_area">
            <input
              id="land_area"
              type="number"
              min="0"
              className={inputClass}
              value={form.land_area}
              onChange={(e) => set("land_area")(e.target.value)}
            />
          </Field>
          <Field label="Building area (m²)" htmlFor="building_area">
            <input
              id="building_area"
              type="number"
              min="0"
              className={inputClass}
              value={form.building_area}
              onChange={(e) => set("building_area")(e.target.value)}
            />
          </Field>
          <Field label="Year built" htmlFor="year_built">
            <input
              id="year_built"
              type="number"
              className={inputClass}
              value={form.year_built}
              onChange={(e) => set("year_built")(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Location</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Country" htmlFor="country" required>
            <input
              id="country"
              className={inputClass}
              value={form.country}
              onChange={(e) => set("country")(e.target.value)}
            />
            {err("country")}
          </Field>
          <Field label="Prefecture / state" htmlFor="prefecture">
            <input
              id="prefecture"
              className={inputClass}
              value={form.prefecture}
              onChange={(e) => set("prefecture")(e.target.value)}
            />
          </Field>
          <Field label="City" htmlFor="city">
            <input id="city" className={inputClass} value={form.city} onChange={(e) => set("city")(e.target.value)} />
          </Field>
          <Field label="Address" htmlFor="address">
            <input
              id="address"
              className={inputClass}
              value={form.address}
              onChange={(e) => set("address")(e.target.value)}
            />
          </Field>
          <Field label="Latitude" htmlFor="latitude">
            <input
              id="latitude"
              type="number"
              step="any"
              className={inputClass}
              value={form.latitude}
              onChange={(e) => set("latitude")(e.target.value)}
            />
            {err("latitude")}
          </Field>
          <Field label="Longitude" htmlFor="longitude">
            <input
              id="longitude"
              type="number"
              step="any"
              className={inputClass}
              value={form.longitude}
              onChange={(e) => set("longitude")(e.target.value)}
            />
            {err("longitude")}
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Details</h2>
        <div className="mt-5 grid gap-5">
          <Field label="Description" htmlFor="description">
            <textarea
              id="description"
              rows={6}
              className="w-full rounded-lg border border-border bg-elevated p-3 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
            />
          </Field>
          <Field label="Features / tags" htmlFor="features" hint="Comma separated.">
            <input
              id="features"
              className={inputClass}
              value={form.features}
              onChange={(e) => set("features")(e.target.value)}
              placeholder="Renovated, Garden, Near station"
            />
          </Field>
          <Field label="Nearby places" htmlFor="nearby_places" hint="Comma separated.">
            <input
              id="nearby_places"
              className={inputClass}
              value={form.nearby_places}
              onChange={(e) => set("nearby_places")(e.target.value)}
              placeholder="Supermarket 400m, JR station 1.2km"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Image gallery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload multiple authorized images, drag to reorder, pick a cover, preview or delete.
        </p>
        <div className="mt-5">
          <ImageUploader
            images={images}
            onChange={setImages}
            coverUrl={coverUrl}
            onCoverChange={setCoverUrl}
          />
        </div>
      </section>

      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publish
        </Button>
        <Button type="button" variant="outline" size="lg" disabled={saving} onClick={() => void save("draft")}>
          Save draft
        </Button>
        {initial ? (
          <Button type="button" variant="ghost" size="lg" disabled={saving} onClick={() => void remove()}>
            Delete property
          </Button>
        ) : null}
      </div>
    </form>
  );
}
