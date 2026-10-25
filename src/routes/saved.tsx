import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Bell, BellOff, Clock3, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";
import {
  editSavedSearch,
  listSavedSearches,
  removeSavedSearch,
  type AlertFrequency,
  type SavedSearch,
} from "@/lib/saved-searches.functions";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,follow" },
      { title: "Saved Searches — Rylestate" },
      { name: "description", content: "Manage saved property searches and email alerts." },
    ],
  }),
  component: SavedPage,
});

function searchHref(search: SavedSearch) {
  const filters = search.filters;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== "all") params.set(key, value);
  }
  const source = filters.source;
  if (source === "mls") {
    params.delete("source");
    const aliases: Record<string, string> = {
      region: "region",
      kind: "kind",
      minBedrooms: "minBedrooms",
    };
    for (const [key, value] of Object.entries(aliases)) {
      const savedValue = params.get(key);
      params.delete(key);
      if (savedValue) params.set(value, savedValue);
    }
    return `/properties?${params.toString()}`;
  }
  if (source === "us") {
    return `/us-properties?${params.toString()}`;
  }
  return `/search${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ""}`;
}

function prettyCriteria(filters: Record<string, string>) {
  const labels: Record<string, string> = {
    q: "Keywords",
    city: "City / ZIP",
    region: "State / market",
    state: "State",
    category: "Category",
    kind: "Listing type",
    minPrice: "Min price",
    maxPrice: "Max price",
    minBedrooms: "Bedrooms",
    bedrooms: "Bedrooms",
    status: "Status",
  };
  return Object.entries(filters)
    .filter(([key, value]) => key !== "source" && Boolean(value) && value !== "all")
    .map(([key, value]) => `${labels[key] ?? key}: ${value}`);
}

function SavedPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftFilters, setDraftFilters] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setSearches(await listSavedSearches());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not load saved searches.";
      setError(
        /unauthorized|bearer|token/i.test(message)
          ? "Log in to see the saved searches in your account."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setFrequency(search: SavedSearch, frequency: AlertFrequency) {
    setNotice(null);
    try {
      await editSavedSearch({ id: search.id, alertFrequency: frequency });
      await refresh();
      setNotice(
        frequency === "disabled"
          ? "Email alerts disabled."
          : `${frequency[0]?.toUpperCase()}${frequency.slice(1)} email alerts enabled.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update alert preferences.");
    }
  }

  function beginEdit(search: SavedSearch) {
    setEditingId(search.id);
    setDraftName(search.name);
    setDraftFilters({ ...search.filters });
  }

  async function saveEdit(searchId: string) {
    try {
      await editSavedSearch({ id: searchId, name: draftName, filters: draftFilters });
      setEditingId(null);
      await refresh();
      setNotice("Saved search updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this saved search.");
    }
  }

  async function deleteSearch(search: SavedSearch) {
    if (
      !window.confirm(
        `Delete “${search.name}”? Its saved filters and alert history will be removed.`,
      )
    )
      return;
    try {
      await removeSavedSearch({ id: search.id });
      await refresh();
      setNotice("Saved search deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this saved search.");
    }
  }

  return (
    <PageShell
      title="Saved Searches"
      description="Rerun your searches and choose which ones send email alerts."
    >
      <p className="mb-5 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Alerts use the confirmed email on your account. Listings are checked once daily; daily
        alerts are sent at most once per day, while weekly alerts are batched for Monday. Instant
        alerts are not available.
      </p>
      {notice ? (
        <p
          role="status"
          className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <div role="alert" className="mb-6 rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-foreground">{error}</p>
          {error.includes("Log in") ? (
            <Button asChild className="mt-4">
              <Link to="/login">Log in</Link>
            </Button>
          ) : (
            <Button className="mt-4" onClick={() => void refresh()}>
              Try again
            </Button>
          )}
        </div>
      ) : null}
      {busy ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading saved searches…
        </p>
      ) : null}
      {!busy && !error && searches.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Bookmark className="h-10 w-10 text-subtle" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-semibold text-foreground">No saved searches yet</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Save filters from US Properties or MLS Listings to return to them here. You can turn on
            email alerts whenever you are ready.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/us-properties">Browse US properties</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/properties">Search MLS listings</Link>
            </Button>
          </div>
        </div>
      ) : null}
      {!busy && searches.length > 0 ? (
        <ul className="grid gap-5 lg:grid-cols-2">
          {searches.map((search) => {
            const criteria = prettyCriteria(search.filters);
            return (
              <li
                key={search.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-elevated md:p-6"
              >
                {editingId === search.id ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-foreground">
                      Search name
                      <input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        maxLength={80}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Edit any saved filter value. Clear a field to remove that criterion.
                    </p>
                    {Object.entries(draftFilters).map(([key, value]) => (
                      <label key={key} className="block text-xs font-medium text-muted-foreground">
                        {key}
                        <input
                          value={value}
                          onChange={(event) =>
                            setDraftFilters((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    ))}
                    <div className="flex gap-2">
                      <Button onClick={() => void saveEdit(search.id)}>Save changes</Button>
                      <Button variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-foreground">{search.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {search.filters.source === "mls"
                            ? "MLS listings"
                            : search.filters.source === "us"
                              ? "US properties"
                              : "Property search"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${search.alerts_enabled ? "bg-primary/15 text-primary-light" : "bg-elevated text-muted-foreground"}`}
                      >
                        {search.alerts_enabled ? (
                          <Bell className="h-3.5 w-3.5" />
                        ) : (
                          <BellOff className="h-3.5 w-3.5" />
                        )}
                        {search.alerts_enabled ? `${search.alert_frequency} alerts` : "Alerts off"}
                      </span>
                    </div>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {criteria.map((item) => (
                        <li
                          key={item}
                          className="rounded-full border border-border bg-elevated px-3 py-1 text-xs text-muted-foreground"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        Last checked:{" "}
                        {search.last_checked_at
                          ? new Date(search.last_checked_at).toLocaleString()
                          : "Not checked yet"}
                      </span>
                      <span>
                        Last alert:{" "}
                        {search.last_notification_at
                          ? new Date(search.last_notification_at).toLocaleString()
                          : "None"}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild>
                        <a href={searchHref(search)}>Run Search</a>
                      </Button>
                      <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                        Email alerts
                        <select
                          aria-label={`Email alert frequency for ${search.name}`}
                          value={search.alert_frequency}
                          onChange={(event) =>
                            void setFrequency(search, event.target.value as AlertFrequency)
                          }
                          className="bg-transparent py-2 font-semibold"
                        >
                          <option value="disabled">Off</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </label>
                      <Button
                        variant="outline"
                        onClick={() => beginEdit(search)}
                        aria-label={`Edit ${search.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void deleteSearch(search)}
                        aria-label={`Delete ${search.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-subtle">
                      {search.last_match_count !== null && search.match_count_checked_at
                        ? `${search.last_match_count.toLocaleString()} matching properties as of ${new Date(search.match_count_checked_at).toLocaleString()}.`
                        : "Matching count is unavailable until a reliable source count is returned."}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </PageShell>
  );
}
