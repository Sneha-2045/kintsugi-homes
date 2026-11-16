import { createFileRoute } from "@tanstack/react-router";
import { syncAgents } from "@/lib/agents-api.server";

export const Route = createFileRoute("/api/admin/agents/sync")({
  server: { handlers: { POST: ({ request }) => syncAgents(request) } },
});
