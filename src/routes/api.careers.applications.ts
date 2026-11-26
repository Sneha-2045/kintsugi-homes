import { createFileRoute } from "@tanstack/react-router";
import { submitCareerApplication } from "@/lib/careers.server";

export const Route = createFileRoute("/api/careers/applications")({
  server: { handlers: { POST: ({ request }) => submitCareerApplication(request) } },
});
