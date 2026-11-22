import type { Map, ProjectionSpecification } from "maplibre-gl";

/*
 * Globe/flat projection switching adapted from OSIRIS's map-projection.ts.
 * Copyright (c) 2025 simplifaisoul. Licensed under the MIT License.
 * https://github.com/simplifaisoul/osiris
 */
const GLOBE_PROJECTION: ProjectionSpecification = { type: "globe" };

export function applyOsirisProjection(map: Map, mode: "globe" | "mercator") {
  const next: ProjectionSpecification = mode === "globe" ? GLOBE_PROJECTION : { type: "mercator" };
  if (map.getProjection()?.type === next.type) return;
  map.setProjection(next);
}
