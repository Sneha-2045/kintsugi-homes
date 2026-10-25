import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type AlertFrequency = "disabled" | "daily" | "weekly";
export type SavedSearch = {
  id: string;
  name: string;
  filters: Record<string, string>;
  alerts_enabled: boolean;
  alert_frequency: AlertFrequency;
  last_checked_at: string | null;
  last_match_count: number | null;
  match_count_checked_at: string | null;
  last_notification_at: string | null;
  created_at: string;
  criteria_hash: string;
};

function cleanFilters(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Choose search filters before saving.");
  }
  const output: Record<string, string> = {};
  const allowed = new Set([
    "source",
    "q",
    "city",
    "region",
    "state",
    "kind",
    "minPrice",
    "maxPrice",
    "minBedrooms",
    "category",
    "bedrooms",
    "status",
  ]);
  for (const [key, raw] of Object.entries(value)) {
    if (!allowed.has(key)) continue;
    if (typeof raw !== "string") continue;
    const text = raw.trim().slice(0, 120);
    if (text) output[key] = text;
  }
  if (!Object.keys(output).length) throw new Error("Add at least one filter before saving.");
  if (output.source && !["mls", "us", "japan"].includes(output.source))
    throw new Error("Unsupported search source.");
  if (output.kind && !["all", "sale", "lease"].includes(output.kind))
    throw new Error("Unsupported listing type.");
  for (const key of ["minPrice", "maxPrice", "minBedrooms", "bedrooms"]) {
    if (output[key] === undefined) continue;
    const number = Number(output[key]);
    const integerRequired = key === "minBedrooms" || key === "bedrooms";
    if (
      !Number.isFinite(number) ||
      number < 0 ||
      number > (integerRequired ? 20 : 1_000_000_000) ||
      (integerRequired && !Number.isInteger(number))
    ) {
      throw new Error(`Enter a valid ${integerRequired ? "bedroom count" : "price filter"}.`);
    }
  }
  if (output.minPrice && output.maxPrice && Number(output.minPrice) > Number(output.maxPrice))
    throw new Error("Minimum price must not exceed maximum price.");
  return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
}

async function criteriaHash(filters: Record<string, string>) {
  const bytes = new TextEncoder().encode(JSON.stringify(filters));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const saveSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name: string; filters: unknown }) => ({
    name: typeof data?.name === "string" ? data.name.trim().slice(0, 80) : "",
    filters: cleanFilters(data?.filters),
  }))
  .handler(async ({ data, context }) => {
    if (!data.name) throw new Error("Enter a name for this saved search.");
    const hash = await criteriaHash(data.filters);
    const { data: existing, error: lookupError } = await context.supabase
      .from("saved_searches")
      .select("id, name")
      .eq("user_id", context.userId)
      .eq("criteria_hash", hash)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return { duplicate: true, name: existing.name };
    const { error } = await context.supabase.from("saved_searches").insert({
      user_id: context.userId,
      name: data.name,
      filters: data.filters as Json,
      criteria_hash: hash,
    });
    if (error?.code === "23505") return { duplicate: true, name: data.name };
    if (error) throw error;
    return { duplicate: false, name: data.name };
  });

export const createSavedSearch = (input: { name: string; filters: Record<string, string> }) =>
  saveSearch({ data: input });

export const listSavedSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedSearch[]> => {
    const { data, error } = await context.supabase
      .from("saved_searches")
      .select(
        "id, name, filters, alerts_enabled, alert_frequency, last_checked_at, last_match_count, match_count_checked_at, last_notification_at, created_at, criteria_hash",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      filters: (row.filters && typeof row.filters === "object" && !Array.isArray(row.filters)
        ? row.filters
        : {}) as Record<string, string>,
      alert_frequency: row.alert_frequency as AlertFrequency,
    }));
  });

const updateSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (input: { id: string; name?: string; filters?: unknown; alertFrequency?: AlertFrequency }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("Invalid saved search.");
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) {
      const name = data.name.trim().slice(0, 80);
      if (!name) throw new Error("Search name cannot be empty.");
      updates.name = name;
    }
    if (data.filters !== undefined) {
      const filters = cleanFilters(data.filters);
      updates.filters = filters;
      updates.criteria_hash = await criteriaHash(filters);
    }
    if (data.alertFrequency !== undefined) {
      if (!["disabled", "daily", "weekly"].includes(data.alertFrequency))
        throw new Error("Invalid alert frequency.");
      updates.alert_frequency = data.alertFrequency;
      updates.alerts_enabled = data.alertFrequency !== "disabled";
    }
    const { error } = await context.supabase
      .from("saved_searches")
      .update(updates)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error?.code === "23505")
      throw new Error("A saved search with those filters already exists.");
    if (error) throw error;
    return { success: true };
  });

export const editSavedSearch = (input: {
  id: string;
  name?: string;
  filters?: Record<string, string>;
  alertFrequency?: AlertFrequency;
}) => updateSearch({ data: input });

const deleteSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("Invalid saved search.");
    const { error } = await context.supabase
      .from("saved_searches")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { success: true };
  });

export const removeSavedSearch = (input: { id: string }) => deleteSearch({ data: input });
