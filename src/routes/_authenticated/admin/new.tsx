import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { PageShell } from "@/components/layout/PageShell";
import { AdminGate } from "./index";

export const Route = createFileRoute("/_authenticated/admin/new")({
  head: () => ({
    meta: [
      { title: "Add property — Yadori Estate admin" },
      { name: "description", content: "Manually add an authorized property listing with images." },
      { property: "og:title", content: "Add property — Yadori Estate admin" },
      {
        property: "og:description",
        content: "Manually add an authorized property listing with images.",
      },
    ],
  }),
  component: () => (
    <AdminGate>
      <PageShell title="Add property" description="Enter listing details manually and upload authorized images.">
        <PropertyForm />
      </PageShell>
    </AdminGate>
  ),
});
