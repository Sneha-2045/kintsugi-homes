import { createFileRoute } from "@tanstack/react-router";
import { listAgents } from "@/lib/agents-api.server";

export const Route = createFileRoute("/api/agents")({
  server: { handlers: { GET: ({ request }) => listAgents(request) } },
});
