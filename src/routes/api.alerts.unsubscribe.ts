import { createFileRoute } from "@tanstack/react-router";
import { disableAlertsWithSignature } from "@/lib/saved-search-monitor.server";

function page(message: string, form = "") {
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Saved search alerts</title></head><body style="margin:0;background:#0b1423;color:#f8fafc;font:16px Arial,sans-serif"><main style="max-width:520px;margin:12vh auto;padding:32px;border:1px solid #334155;border-radius:16px;background:#172235"><h1 style="margin-top:0">Saved search alerts</h1><p>${message}</p>${form}</main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export const Route = createFileRoute("/api/alerts/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        const sig = url.searchParams.get("sig") ?? "";
        if (!/^[0-9a-f-]{36}$/i.test(search) || !/^[0-9a-f]{64}$/i.test(sig))
          return page("This unsubscribe link is invalid or expired.");
        const form = `<form method="post"><input type="hidden" name="search" value="${search}"><input type="hidden" name="sig" value="${sig}"><button style="border:0;border-radius:8px;background:#3b82f6;color:white;padding:12px 18px;font-weight:bold">Unsubscribe from this search</button></form>`;
        return page("Confirm to stop email alerts for this saved search.", form);
      },
      POST: async ({ request }) => {
        const form = await request.formData();
        const search = String(form.get("search") ?? "");
        const sig = String(form.get("sig") ?? "");
        if (!/^[0-9a-f-]{36}$/i.test(search) || !/^[0-9a-f]{64}$/i.test(sig))
          return page("This unsubscribe link is invalid or expired.");
        try {
          const disabled = await disableAlertsWithSignature(search, sig);
          return page(
            disabled
              ? "Email alerts for this saved search are now turned off."
              : "This unsubscribe link is invalid or expired.",
          );
        } catch {
          return page("We could not update your alert preference. Please try again later.");
        }
      },
    },
  },
});
