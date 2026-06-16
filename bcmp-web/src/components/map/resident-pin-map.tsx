"use client";

/**
 * ResidentPinMap — Leaflet-based location picker for resident registration.
 *
 * Why Leaflet instead of Google Maps:
 *   - Google Maps SDK fires internal events (POI clicks, info windows) that bubble up
 *     and interact with React's synthetic event system in ways that reset form state.
 *   - Leaflet is a pure DOM library with no SDK-level side effects.
 *   - No API key required for the tile layer (uses OpenStreetMap).
 *   - Google Geocoding API is still used for address→coords (just an HTTP call, no SDK).
 *
 * SSR: must be loaded with `dynamic(..., { ssr: false })` — Leaflet requires `window`.
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoJsonFeatureCollection } from "@/lib/types";

// Fix Leaflet's default marker icon paths (broken by webpack/Next.js asset hashing)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  lat: number | null;
  lng: number | null;
  centerLat: number;
  centerLng: number;
  /** When true the map is a read-only viewer — no click-to-pin, no drag. */
  readOnly?: boolean;
  /**
   * Barangay boundary polygon. Auto-fetched on barangay onboarding by
   * BarangayObserver server-side. When present, the map fits to bounds on
   * mount (when no pin exists yet) and overlays a dashed accent stroke
   * matching the Map page style. One source of truth: every map component
   * reads from the same stored boundary, no per-page Overpass fetch.
   */
  boundary?: GeoJsonFeatureCollection | null;
  onPin?: (lat: number, lng: number) => void;
  className?: string;
}

export default function ResidentPinMap({
  lat,
  lng,
  centerLat,
  centerLng,
  readOnly = false,
  boundary = null,
  onPin,
  className = "w-full h-56 rounded-lg border border-border overflow-hidden",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const onPinRef = useRef(onPin);

  // Keep the callback ref current so map click handler never has a stale closure
  useEffect(() => { onPinRef.current = onPin; }, [onPin]);

  // ── Initialize map once ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 16,
      zoomControl: !readOnly,
      attributionControl: true,
      // In read-only mode disable all interaction
      dragging: !readOnly,
      touchZoom: !readOnly,
      doubleClickZoom: !readOnly,
      scrollWheelZoom: !readOnly,
      boxZoom: !readOnly,
      keyboard: !readOnly,
    });

    // CartoDB Voyager tiles — free, no API key, no referer restriction
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Place initial marker if coords exist
    if (lat !== null && lng !== null) {
      const draggable = !readOnly;
      const m = L.marker([lat, lng], { draggable }).addTo(map);
      if (!readOnly) {
        m.on("dragend", () => {
          const p = m.getLatLng();
          onPinRef.current?.(p.lat, p.lng);
        });
      }
      markerRef.current = m;
      map.setView([lat, lng], 18);
    }

    // Click to pin — only in edit mode
    if (!readOnly) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          const m = L.marker([clickLat, clickLng], { draggable: true }).addTo(map);
          m.on("dragend", () => {
            const p = m.getLatLng();
            onPinRef.current?.(p.lat, p.lng);
          });
          markerRef.current = m;
        }

        onPinRef.current?.(clickLat, clickLng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      boundaryLayerRef.current = null;
    };
    // intentionally only runs on mount — center/boundary/readOnly are mount-time values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync external lat/lng changes (e.g. auto-geocode) ─────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (lat === null || lng === null) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const draggable = !readOnly;
      const m = L.marker([lat, lng], { draggable }).addTo(mapRef.current);
      if (!readOnly) {
        m.on("dragend", () => {
          const p = m.getLatLng();
          onPinRef.current?.(p.lat, p.lng);
        });
      }
      markerRef.current = m;
    }

    mapRef.current.setView([lat, lng], 18);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // ── Sync barangay boundary overlay ─────────────────────────────────
  // Matches the Map page's overlay style (blue dashed stroke, light fill).
  // Fits to bounds when no marker is placed yet so the user sees the full
  // barangay extent. When a marker exists (edit mode), preserves the
  // marker view so the saved pin stays centered.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (!boundary || !boundary.features?.length) return;

    const geoLayer = L.geoJSON(boundary as unknown as GeoJSON.GeoJsonObject, {
      style: {
        color: "#3b82f6",
        weight: 2.5,
        opacity: 0.9,
        fillColor: "#3b82f6",
        fillOpacity: 0.04,
        dashArray: "6,4",
      },
      // Pass clicks through to the underlying map so the user can still pin
      // anywhere — boundary is informational, not blocking.
      interactive: false,
    });
    geoLayer.addTo(map);
    boundaryLayerRef.current = geoLayer;

    if (!markerRef.current) {
      try {
        map.fitBounds(geoLayer.getBounds(), { padding: [20, 20], maxZoom: 16 });
      } catch {
        // Geometry may be invalid; ignore.
      }
    }
  }, [boundary]);

  return <div ref={containerRef} className={className} />;
}
