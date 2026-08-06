import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";
import { fetchAdminProperties, isCurrentUserAdmin } from "@/lib/property-db";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Property admin — Yadori Estate" },
      { name: "description", content: "Manage manually entered property listings." },
      { property: "og:title", content: "Property admin — Yadori Estate" },
      { property: "og:description", content: "Manage manually entered property listings." },
    ],
  }),
  component: AdminList,
});

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { data: isAdmin, isPending } = useQuery({
    queryKey: ["is-admin"],
    queryFn: isCurrentUserAdmin,
  });

  if (isPending) return <PageShell title="Loading…" />;
  if (!isAdmin)
    return (
      <PageShell
        title="Admin access required"
        description="Your account does not have the admin role yet. Ask an existing admin to grant it."
      />
    );
  return <>{children}</>;
}

function AdminList() {
  return (
    <AdminGate>
      <List />
    </AdminGate>
  );
}

function List() {
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: fetchAdminProperties,
  });

  return (
    <PageShell title="Properties" description="Manually entered listings you are authorized to reuse.">
      <div className="mb-8">
        <Button asChild>
          <Link to="/admin/new">
            <Plus className="h-4 w-4" /> Add property
          </Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{(error as Error).message}</p> : null}
      {isPending ? <p className="text-sm text-muted-foreground">Loading listings…</p> : null}

      {data && data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No properties yet — add your first listing.</p>
      ) : null}

      <ul className="grid gap-4">
        {data?.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <img
              src={p.cover_image_url ?? p.property_images[0]?.url ?? "/placeholder.svg"}
              alt=""
              className="h-16 w-24 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{p.title}</p>
              <p className="text-sm text-muted-foreground">
                {[p.city, p.prefecture, p.country].filter(Boolean).join(", ")} · ID {p.source_listing_id}
              </p>
            </div>
            <Badge variant={p.status === "published" ? "solidBlue" : "neutral"} size="sm">
              {p.status}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/$id" params={{ id: p.id }}>
                Edit
              </Link>
            </Button>
            {p.status === "published" ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/property/$id" params={{ id: p.id }}>
                  View
                </Link>
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
