import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { usListings } from "@/data/us-listings";
import { tranchiProperties } from "@/data/tranchi-properties";
import { properties } from "@/data/properties";
import { searchListings, type RepliersListing } from "@/lib/repliers.server";
import {
  changedListingFields,
  listingEventKey,
  matchesSavedSearch,
  type MatchListing,
} from "@/lib/saved-search-matching";

type SavedSearchRow = {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, string>;
  alert_frequency: "disabled" | "daily" | "weekly";
  alerts_enabled: boolean;
  last_notification_at: string | null;
  last_checked_at: string | null;
};
type SavedSearchEvent = {
  id: string;
  event_type: "new" | "price_changed" | "status_changed" | "auction_changed";
  previous_value: Json | null;
  current_value: Json | null;
};

function mapStaticListings(): MatchListing[] {
  const mapRecord = (item: (typeof usListings)[number], source: string, id: string) => ({
    source,
    id,
    title: item.title,
    category: item.dealCategory ?? item.propertyType ?? item.categorySlug,
    address: item.address ?? item.title,
    city: item.city ?? item.location,
    state: item.state ?? item.prefecture ?? "",
    price: item.priceUsd > 0 ? item.priceUsd : null,
    status: item.status ?? item.leadStatus ?? null,
    image: item.images[0] ?? null,
    url: `/property/${encodeURIComponent(item.id)}`,
    bedrooms: item.bedrooms ?? null,
    bathrooms: item.bathrooms ?? null,
    size: item.floorArea ?? null,
    actualPrice: false,
    auctionDate: item.auctionDate ?? null,
  });
  return [
    ...usListings.map((item) => mapRecord(item, "us-static", item.id)),
    ...tranchiProperties.map((item) => mapRecord(item, "tranchi-static", item.sourcePropertyId)),
  ];
}

function mapJapanListings(): MatchListing[] {
  return properties.map((item) => ({
    source: "japan-static",
    id: item.id,
    title: item.title,
    category: item.propertyType,
    address: item.location,
    city: item.location,
    state: item.prefecture,
    price: item.priceUsd > 0 ? item.priceUsd : null,
    status: null,
    image: item.images[0] ?? null,
    url: `/property/${encodeURIComponent(item.id)}`,
    bedrooms: item.bedrooms ?? null,
    bathrooms: item.bathrooms ?? null,
    size: item.floorArea ?? null,
    actualPrice: false,
    auctionDate: null,
  }));
}

function repliersParams(filters: Record<string, string>) {
  const params = new URLSearchParams({ resultsPerPage: "48", pageNum: "1" });
  const location = filters.city?.trim() ?? "";
  if (/^\d{5}(?:-\d{4})?$/.test(location)) params.set("zip", location);
  else if (location) params.set("city", location);
  const region = filters.region?.trim() ?? "";
  if (/^[a-z]{2}$/i.test(region)) params.set("state", region.toUpperCase());
  else if (region) params.set("area", region);
  if (filters.kind && filters.kind !== "all") params.set("type", filters.kind);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.minBedrooms) params.set("minBedrooms", filters.minBedrooms);
  return params;
}

function mapMls(item: RepliersListing): MatchListing {
  const address = (item.address ?? {}) as Record<string, unknown>;
  const details = (item.details ?? {}) as Record<string, unknown>;
  const text = (value: unknown) =>
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  const images = Array.isArray(item.images) ? item.images : [];
  const rawImage = images[0];
  const image =
    typeof rawImage === "string"
      ? rawImage
      : rawImage && typeof rawImage === "object"
        ? (rawImage.url ?? rawImage.path ?? null)
        : null;
  const mlsNumber = text(item.mlsNumber);
  const boardId = text(item.boardId);
  const id = boardId ? `${boardId}~${mlsNumber}` : mlsNumber;
  const price = Number(item.listPrice ?? item.price);
  return {
    source: "repliers",
    id,
    title: text(details.propertyType) || "MLS listing",
    category: text(details.propertyType),
    address: [address.streetNumber, address.streetName, address.streetSuffix]
      .map(text)
      .filter(Boolean)
      .join(" "),
    city: text(address.city),
    state: text(address.state),
    price: Number.isFinite(price) && price > 0 ? price : null,
    status: text(item.status) || null,
    image: typeof image === "string" && /^https?:\/\//i.test(image) ? image : null,
    url: `/properties/${encodeURIComponent(id)}`,
    bedrooms: Number(details.numBedrooms) || null,
    bathrooms: Number(details.numBathrooms) || null,
    size: Number(details.sqft) || null,
    actualPrice: Number.isFinite(price) && price > 0,
    auctionDate: text(item.auctionDate) || null,
  };
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
}

function resultsUrl(search: SavedSearchRow, baseUrl: string) {
  const filters = search.filters;
  if (filters.source === "japan")
    return `${baseUrl}/search${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ""}`;
  const params = new URLSearchParams();
  const keys =
    filters.source === "mls"
      ? ["city", "region", "kind", "minPrice", "maxPrice", "minBedrooms"]
      : ["q", "minPrice", "maxPrice", "state", "city", "category", "bedrooms", "status"];
  for (const key of keys) if (filters[key]) params.set(key, filters[key]);
  const pathname = filters.source === "mls" ? "/properties" : "/us-properties";
  return `${baseUrl}${pathname}${params.size ? `?${params.toString()}` : ""}`;
}

async function unsubscribeSignature(searchId: string, userId: string) {
  const secret = process.env["SAVED_SEARCH_UNSUBSCRIBE_SECRET"];
  if (!secret) throw new Error("Missing unsubscribe signing secret");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${searchId}:${userId}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function sendDigest(search: SavedSearchRow, email: string, events: SavedSearchEvent[]) {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["ALERT_FROM_EMAIL"];
  const baseUrl = process.env["APP_BASE_URL"]?.replace(/\/$/, "");
  if (!apiKey || !from || !baseUrl) throw new Error("Email alert provider is not configured");
  const unsubscribe = `${baseUrl}/api/alerts/unsubscribe?search=${encodeURIComponent(search.id)}&sig=${await unsubscribeSignature(search.id, search.user_id)}`;
  const rows = events
    .map((event) => {
      const listing = event.current_value as unknown as MatchListing;
      const title = escapeHtml(listing.title || listing.address || "Property listing");
      const address = escapeHtml(
        [listing.address, listing.city, listing.state].filter(Boolean).join(", "),
      );
      const price =
        listing.price == null
          ? "Price unavailable"
          : new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(listing.price);
      const priceLabel = listing.actualPrice ? "List price" : "Reported price";
      const reason =
        event.event_type === "new"
          ? "New match for your saved search"
          : event.event_type === "price_changed"
            ? "Listing price changed"
            : event.event_type === "status_changed"
              ? "Listing status changed"
              : "Auction date changed";
      const previous = event.previous_value == null ? "" : escapeHtml(String(event.previous_value));
      const change =
        event.event_type === "price_changed"
          ? `<p>Price changed from <strong>$${previous}</strong> to <strong>${price}</strong>.</p>`
          : event.event_type === "status_changed"
            ? `<p>Status changed from <strong>${previous}</strong> to <strong>${escapeHtml(listing.status ?? "Unavailable")}</strong>.</p>`
            : event.event_type === "auction_changed"
              ? `<p>Auction date changed from <strong>${previous}</strong> to <strong>${escapeHtml(listing.auctionDate ?? "Unavailable")}</strong>.</p>`
              : "";
      const image = listing.image
        ? `<img src="${escapeHtml(listing.image)}" alt="" width="560" style="display:block;width:100%;max-width:560px;border-radius:12px;margin:0 0 14px" />`
        : "";
      return `<article style="padding:20px 0;border-bottom:1px solid #334155">${image}<p style="color:#93c5fd">${escapeHtml(reason)}</p><h2 style="font-size:20px;margin:8px 0">${title}</h2><p>${address}</p><p>Matches your saved search criteria.</p><p><strong>${priceLabel}: ${price}</strong>${listing.status ? ` · ${escapeHtml(listing.status)}` : ""}</p>${change}${listing.bedrooms != null ? `<p>${listing.bedrooms} beds${listing.bathrooms != null ? ` · ${listing.bathrooms} baths` : ""}${listing.size ? ` · ${listing.size.toLocaleString()} sq ft` : ""}</p>` : ""}<p><a href="${baseUrl}${listing.url}" style="color:#60a5fa">View property</a></p></article>`;
    })
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;background:#0b1423;color:#f8fafc;padding:28px;max-width:640px;margin:auto"><p style="color:#93c5fd">RYLESTATE · SAVED SEARCH ALERT</p><h1 style="font-size:26px">${escapeHtml(search.name)}</h1><p>We found ${events.length} new or changed ${events.length === 1 ? "listing" : "listings"} for your saved search.</p>${rows}<p style="margin-top:24px"><a href="${resultsUrl(search, baseUrl)}" style="color:#60a5fa">View matching properties</a> · <a href="${baseUrl}/saved" style="color:#60a5fa">Manage saved searches</a> · <a href="${unsubscribe}" style="color:#94a3b8">Unsubscribe from this search</a></p></div>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `${events.length} update${events.length === 1 ? "" : "s"} for ${search.name}`,
      html,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

async function runMonitorUnlocked() {
  const { data: cursorRow } = await db
    .from("saved_search_monitor_lock")
    .select("last_search_id")
    .eq("id", true)
    .maybeSingle();
  const cursor = cursorRow?.last_search_id;
  let query = db
    .from("saved_searches")
    .select(
      "id, user_id, name, filters, alerts_enabled, alert_frequency, last_notification_at, last_checked_at",
    )
    .eq("alerts_enabled", true)
    .in("alert_frequency", ["daily", "weekly"])
    .order("id")
    .limit(50);
  if (cursor) query = query.gt("id", cursor);
  let { data: searches, error } = await query;
  if (error) throw error;
  if ((!searches || searches.length === 0) && cursor) {
    const wrapped = await db
      .from("saved_searches")
      .select(
        "id, user_id, name, filters, alerts_enabled, alert_frequency, last_notification_at, last_checked_at",
      )
      .eq("alerts_enabled", true)
      .in("alert_frequency", ["daily", "weekly"])
      .order("id")
      .limit(50);
    searches = wrapped.data;
    error = wrapped.error;
    if (error) throw error;
  }
  const results = { checked: 0, failed: 0, discovered: 0, emailed: 0 };
  const staticListings = mapStaticListings();
  const japanListings = mapJapanListings();

  for (const search of (searches ?? []) as SavedSearchRow[]) {
    try {
      let listings: MatchListing[] = [];
      let sourceMatchCount: number | null = null;
      if (search.filters.source === "mls") {
        try {
          const response = await searchListings(repliersParams(search.filters));
          listings = response.listings.map(mapMls);
          sourceMatchCount =
            typeof response.count === "number" &&
            Number.isInteger(response.count) &&
            response.count >= 0
              ? response.count
              : response.listings.length < 48
                ? response.listings.length
                : null;
        } catch (cause) {
          console.warn(
            "[saved-search-monitor] MLS source unavailable for one search",
            cause instanceof Error ? cause.name : "UnknownError",
          );
          results.failed++;
          continue;
        }
      } else if (search.filters.source === "us") {
        listings = staticListings;
      } else if (search.filters.source === "japan") listings = japanListings;
      else listings = [];
      const matches = listings.filter((listing) => matchesSavedSearch(listing, search.filters));
      const supportedMlsCountFilters = new Set([
        "source",
        "city",
        "region",
        "kind",
        "minPrice",
        "maxPrice",
        "minBedrooms",
      ]);
      const upstreamCountIsExact = Object.keys(search.filters).every((key) =>
        supportedMlsCountFilters.has(key),
      );
      const matchCount =
        search.filters.source !== "mls"
          ? matches.length
          : sourceMatchCount !== null && upstreamCountIsExact
            ? sourceMatchCount
            : listings.length < 48
              ? matches.length
              : null;
      for (const listing of matches) {
        const { data: existing, error: readError } = await db
          .from("saved_search_matches")
          .select("id, listing_state")
          .eq("saved_search_id", search.id)
          .eq("source", listing.source)
          .eq("listing_id", listing.id)
          .maybeSingle();
        if (readError) throw readError;
        const state = {
          price: listing.actualPrice ? listing.price : null,
          status: listing.status,
          auctionDate: listing.auctionDate,
        };
        if (!existing) {
          const { error: insertError } = await db.from("saved_search_matches").insert({
            saved_search_id: search.id,
            source: listing.source,
            listing_id: listing.id,
            listing_state: state,
          });
          if (insertError) throw insertError;
          // The first successful check is a baseline, not a burst of "new" emails.
          if (search.last_checked_at) {
            const eventKey = listingEventKey(search.id, listing.source, listing.id, "new");
            const { error: eventError } = await db.from("saved_search_events").upsert(
              {
                saved_search_id: search.id,
                source: listing.source,
                listing_id: listing.id,
                event_type: "new",
                event_key: eventKey,
                current_value: listing as unknown as Json,
              },
              { onConflict: "event_key", ignoreDuplicates: true },
            );
            if (eventError) throw eventError;
            results.discovered++;
          }
        } else {
          const previous = existing.listing_state as {
            price?: number | null;
            status?: string | null;
            auctionDate?: string | null;
          };
          const changes = changedListingFields(previous, listing);
          for (const { type, oldValue, newValue } of changes) {
            const eventKey = listingEventKey(
              search.id,
              listing.source,
              listing.id,
              type,
              oldValue,
              newValue,
            );
            const { error: eventError } = await db.from("saved_search_events").upsert(
              {
                saved_search_id: search.id,
                source: listing.source,
                listing_id: listing.id,
                event_type: type,
                event_key: eventKey,
                previous_value: oldValue,
                current_value: listing as unknown as Json,
              },
              { onConflict: "event_key", ignoreDuplicates: true },
            );
            if (eventError) throw eventError;
            results.discovered++;
          }
          const { error: updateMatchError } = await db
            .from("saved_search_matches")
            .update({ listing_state: state, last_seen_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (updateMatchError) throw updateMatchError;
        }
      }
      const checkedAt = new Date().toISOString();
      const { error: markError } = await db
        .from("saved_searches")
        .update({
          last_checked_at: checkedAt,
          last_match_count: matchCount,
          match_count_checked_at: checkedAt,
        })
        .eq("id", search.id);
      if (markError) throw markError;
      results.checked++;

      const now = Date.now();
      const notifiedAt = search.last_notification_at ? Date.parse(search.last_notification_at) : 0;
      const eligible =
        search.alert_frequency === "daily"
          ? now - notifiedAt >= 23 * 60 * 60 * 1000
          : new Date().getUTCDay() === 1 && now - notifiedAt >= 6 * 24 * 60 * 60 * 1000;
      if (!eligible) continue;
      const { data: events, error: eventsError } = await db
        .from("saved_search_events")
        .select("*")
        .eq("saved_search_id", search.id)
        .is("sent_at", null)
        .order("created_at", { ascending: true })
        .limit(10);
      if (eventsError) throw eventsError;
      if (!events?.length) continue;
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
        search.user_id,
      );
      if (userError) throw userError;
      const email = userData.user?.email;
      if (!email || !userData.user?.email_confirmed_at) continue;
      await sendDigest(search, email, events);
      const ids = events.map((event: { id: string }) => event.id);
      const { error: sentError } = await db
        .from("saved_search_events")
        .update({ sent_at: new Date().toISOString() })
        .in("id", ids);
      if (sentError) throw sentError;
      await db
        .from("saved_searches")
        .update({ last_notification_at: new Date().toISOString() })
        .eq("id", search.id);
      results.emailed++;
    } catch (cause) {
      results.failed++;
      console.error("[saved-search-monitor] Search processing failed", {
        searchId: search.id,
        errorName: cause instanceof Error ? cause.name : "UnknownError",
      });
    }
  }
  if (searches?.length) {
    const { error: cursorError } = await db
      .from("saved_search_monitor_lock")
      .update({ last_search_id: searches[searches.length - 1].id })
      .eq("id", true);
    if (cursorError) throw cursorError;
  }
  return results;
}

export async function runSavedSearchMonitor() {
  const { data: acquired, error } = await db.rpc("acquire_saved_search_monitor_lock");
  if (error) throw error;
  if (!acquired) return { checked: 0, failed: 0, discovered: 0, emailed: 0, lockSkipped: true };
  try {
    return { ...(await runMonitorUnlocked()), lockSkipped: false };
  } finally {
    const { error: releaseError } = await db.rpc("release_saved_search_monitor_lock");
    if (releaseError)
      console.error("[saved-search-monitor] Could not release monitor lock", releaseError.message);
  }
}

export async function disableAlertsWithSignature(searchId: string, signature: string) {
  const { data: search, error } = await db
    .from("saved_searches")
    .select("id, user_id")
    .eq("id", searchId)
    .maybeSingle();
  if (error || !search) return false;
  const expected = await unsubscribeSignature(search.id, search.user_id);
  if (signature.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index++)
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  if (mismatch !== 0) return false;
  const { error: updateError } = await db
    .from("saved_searches")
    .update({ alerts_enabled: false, alert_frequency: "disabled" })
    .eq("id", search.id);
  return !updateError;
}
