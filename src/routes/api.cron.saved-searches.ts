import { createFileRoute } from "@tanstack/react-router";
import { runSavedSearchMonitor } from "@/lib/saved-search-monitor.server";

export const Route = createFileRoute("/api/cron/saved-searches")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["SAVED_SEARCH_CRON_SECRET"];
        const authorization = request.headers.get("authorization") ?? "";
        if (!secret || authorization !== `Bearer ${secret}`) {
          return Response.json(
            { error: "Unauthorized" },
            { status: 401, headers: { "Cache-Control": "no-store" } },
          );
        }
        try {
          const summary = await runSavedSearchMonitor();
          return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          console.error(
            "[saved-search-monitor] Scheduled run failed",
            error instanceof Error ? error.name : "UnknownError",
          );
          return Response.json(
            { error: "Monitor run failed" },
            { status: 500, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
