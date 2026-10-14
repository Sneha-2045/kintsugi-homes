import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, getListing } from "@/lib/repliers.server";

export const Route = createFileRoute("/api/properties/$id")({
  server: { handlers: { GET: async ({ params }) => {
    try { return Response.json(await getListing(params.id), { headers: { "Cache-Control": "private, max-age=10" } }); }
    catch (error) { return errorResponse(error); }
  } } },
});
