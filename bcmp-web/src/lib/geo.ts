/**
 * Lightweight geometry helpers for the Map page.
 * Ray-casting point-in-polygon — no external GIS dependency.
 */

import type { GeoJsonFeatureCollection } from "./types";

type LngLat = [number, number];
type Ring = LngLat[];

/**
 * Test if point lies inside a single linear ring using ray-casting.
 * Treats the ring as closed (last point doesn't need to equal first).
 */
function pointInRing(point: LngLat, ring: Ring): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i];
    const pj = ring[j];
    if (!pi || !pj) continue;
    const [xi, yi] = pi;
    const [xj, yj] = pj;
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Test if point lies inside a Polygon (outer ring minus inner holes).
 */
function pointInPolygon(point: LngLat, polygon: Ring[]): boolean {
  if (polygon.length === 0) return false;
  const outer = polygon[0];
  if (!outer) return false;

  if (!pointInRing(point, outer)) return false;

  // If inside any hole, point is NOT inside the polygon
  for (let i = 1; i < polygon.length; i++) {
    const hole = polygon[i];
    if (hole && pointInRing(point, hole)) return false;
  }

  return true;
}

/**
 * Test if (lat, lng) falls inside a GeoJSON FeatureCollection (Polygon or MultiPolygon).
 * Returns false if no boundary provided — caller should treat "no boundary" as
 * "we don't know, don't flag the pin".
 */
export function isPointInsideBoundary(
  lat: number,
  lng: number,
  boundary: GeoJsonFeatureCollection | null | undefined
): boolean {
  if (!boundary || !boundary.features || boundary.features.length === 0) {
    return true;
  }

  const point: LngLat = [lng, lat];

  for (const feature of boundary.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    if (geom.type === "Polygon") {
      const polygon = geom.coordinates as unknown as Ring[];
      if (pointInPolygon(point, polygon)) return true;
    } else if (geom.type === "MultiPolygon") {
      const multi = geom.coordinates as unknown as Ring[][];
      for (const polygon of multi) {
        if (pointInPolygon(point, polygon)) return true;
      }
    }
  }

  return false;
}
