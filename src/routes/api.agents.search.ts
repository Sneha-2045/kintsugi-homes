import { createFileRoute } from "@tanstack/react-router";
import { listAgents } from "@/lib/agents-api.server";

export const Route = createFileRoute("/api/agents/search")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const query = new URL(request.url).searchParams.get("q")?.trim();
        if (!query)
          return Response.json(
            { error: "Enter an agent name or brokerage to search." },
            { status: 400 },
          );
        return listAgents(request, query);
      },
    },
  },
});
