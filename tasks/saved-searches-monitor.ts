import { defineTask } from "nitro/task";
import { runSavedSearchMonitor } from "@/lib/saved-search-monitor.server";

export default defineTask({
  meta: {
    name: "saved-searches:monitor",
    description: "Monitor opted-in saved searches and send alert digests.",
  },
  async run() {
    return { result: await runSavedSearchMonitor() };
  },
});
