import { createServerFn } from "@tanstack/react-start";
import { getProperty } from "@/server/property-service";

export const getMongoPropertyForPage = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    if (typeof data?.id !== "string" || data.id.length < 1 || data.id.length > 120)
      throw new Error("Invalid property ID.");
    return { id: data.id };
  })
  .handler(async ({ data }) => getProperty(data.id));
