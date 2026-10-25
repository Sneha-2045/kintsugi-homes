// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";

const savedSearchCron = {
  name: "saved-search-cron",
  nitro: {
    name: "saved-search-cron",
    setup(nitro: {
      options: {
        experimental: { tasks?: boolean };
        tasks: Record<string, unknown>;
        scheduledTasks: Record<string, string | string[]>;
      };
    }) {
      nitro.options.experimental.tasks = true;
      nitro.options.tasks["saved-searches:monitor"] = {
        handler: fileURLToPath(new URL("./tasks/saved-searches-monitor.ts", import.meta.url)),
        description: "Check opted-in saved searches once per day.",
      };
      nitro.options.scheduledTasks["0 12 * * *"] = "saved-searches:monitor";
    },
  },
};

export default defineConfig({
  plugins: [savedSearchCron as never],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
