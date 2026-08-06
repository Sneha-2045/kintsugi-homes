import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { PageShell } from "@/components/layout/PageShell";
import { fetchAdminProperty } from "@/lib/property-db";
import { AdminGate } from "./index";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  head: () => ({
    meta: [
      { title: "Edit property — Yadori Estate admin" },
      { name: "description", content: "Edit an existing property listing and its image gallery." },
      { property: "og:title", content: "Edit property — Yadori Estate admin" },
      {
        property: "og:description",
        content: "Edit an existing property listing and its image gallery.",
      },
    ],
  }),
  component: EditRoute,
});

function EditRoute() {
  const { id } = Route.useParams();
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-property", id],
    queryFn: () => fetchAdminProperty(id),
  });

  return (
    <AdminGate>
      <PageShell title="Edit property" description="Update listing details, images and publication status.">
        {isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {error ? <p className="text-sm text-destructive">{(error as Error).message}</p> : null}
        {data ? <PropertyForm initial={data} /> : null}
      </PageShell>
    </AdminGate>
  );
}
