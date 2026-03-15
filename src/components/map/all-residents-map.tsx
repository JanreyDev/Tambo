"use client";

/**
 * AllResidentsMap — Leaflet map showing every resident pin.
 *
 * - Uses CartoDB Voyager tiles (free, no API key)
 * - Each pin is a colored circle div-icon keyed by status
 * - Click on pin → fires onSelect(resident)
 * - Center + zoom from barangay lat/lng passed as props
 * - SSR-safe: loaded via dynamic() in the parent
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapResident {
  id: string;
  resident_number: string;
  full_name: string;
  purok: string | null;
  sex: string | null;
  status: string | null;
  latitude: number;
  longitude: number;
}

interface Props {
  residents: MapResident[];
  centerLat: number;
  centerLng: number;
  selectedId?: string | null;
  onSelect?: (r: MapResident) => void;
  className?: string;
}

// Status → pin color
const STATUS_COLOR: Record<string, string> = {
  active:      "#22c55e",
  deceased:    "#64748b",
  transferred: "#f59e0b",
  archived:    "#ef4444",
};

function makePin(status: string | null, selected: boolean): L.DivIcon {
  const color = STATUS_COLOR[status ?? ""] ?? "#3b82f6";
  const size   = selected ? 16 : 12;
  const border = selected ? "3px solid #fff" : "2px solid rgba(255,255,255,0.8)";
  const shadow = selected ? "0 0 0 3px " + color + "55, 0 2px 6px rgba(0,0,0,0.35)" : "0 1px 4px rgba(0,0,0,0.3)";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:${border};
      box-shadow:${shadow};
      transition:all 0.15s;
      cursor:pointer;
    "></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -(size / 2 + 4)],
  });
}

export default function AllResidentsMap({
  residents,
  centerLat,
  centerLng,
  selectedId,
  onSelect,
  className = "w-full h-full",
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const markersRef    = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef   = useRef(onSelect);
  const residentsRef  = useRef(residents);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { residentsRef.current = residents; }, [residents]);

  // ── Initialize map once ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:   [centerLat, centerLng],
      zoom:     15,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync residents → markers ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = markersRef.current;
    const incoming = new Set(residents.map((r) => r.id));

    // Remove stale markers
    existing.forEach((marker, id) => {
      if (!incoming.has(id)) {
        marker.remove();
        existing.delete(id);
      }
    });

    // Add / update markers
    residents.forEach((r) => {
      const isSelected = r.id === selectedId;
      if (existing.has(r.id)) {
        existing.get(r.id)!.setIcon(makePin(r.status, isSelected));
        return;
      }
      const marker = L.marker([r.latitude, r.longitude], {
        icon: makePin(r.status, isSelected),
      });
      marker.bindPopup(
        `<div style="font-size:12px;line-height:1.5;min-width:160px;">
          <p style="font-weight:700;margin:0 0 2px;">${r.full_name}</p>
          <p style="margin:0;color:#64748b;">${r.resident_number}</p>
          ${r.purok ? `<p style="margin:2px 0 0;color:#475569;">${r.purok}</p>` : ""}
          <p style="margin:4px 0 0;"><span style="
            display:inline-block;padding:1px 7px;border-radius:9999px;font-size:10px;font-weight:600;
            background:${STATUS_COLOR[r.status ?? ""] ?? "#3b82f6"}22;
            color:${STATUS_COLOR[r.status ?? ""] ?? "#3b82f6"};
          ">${r.status ?? "unknown"}</span></p>
        </div>`,
        { maxWidth: 220, className: "resident-popup" }
      );
      marker.on("click", () => {
        onSelectRef.current?.(r);
      });
      marker.addTo(map);
      existing.set(r.id, marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residents, selectedId]);

  // ── Pan to selected marker ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 17), { animate: true });
      marker.openPopup();
    }
  }, [selectedId]);

  return <div ref={containerRef} className={className} />;
}
