import { createFileRoute } from "@tanstack/react-router";
import { readAgent } from "@/lib/agents-api.server";

export const Route = createFileRoute("/api/agents/$id")({
  server: { handlers: { GET: ({ params }) => readAgent(params.id) } },
});
