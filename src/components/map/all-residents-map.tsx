"use client";

/**
 * AllResidentsMap — Production Leaflet map for the Map page.
 *
 * Features:
 * - Base layer switcher: Streets (CartoDB Voyager), Satellite (Esri World Imagery), Light (CartoDB Positron)
 * - Barangay boundary polygon overlay (GeoJSON), with optional outside-dim mask
 * - Resident pins with status color + popup + cluster grouping at low zoom
 * - Hazard pins, evacuation centers, establishments — togglable overlay layers
 * - Coordinate hover readout
 * - SSR-safe (parent loads via dynamic())
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { GeoJsonFeatureCollection } from "@/lib/types";

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

export interface MapHazardPin {
  id: string;
  type: string;
  name: string;
  description: string | null;
  severity: string | null;
  status: string | null;
  latitude: number;
  longitude: number;
}

export interface MapEvacuationCenter {
  id: string;
  name: string;
  event_name: string | null;
  cause_type: string | null;
  status: string | null;
  evacuee_count: number;
  family_count: number;
  latitude: number;
  longitude: number;
}

export interface MapEstablishment {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  latitude: number;
  longitude: number;
}

export type BaseLayer = "streets" | "satellite" | "light";

interface Props {
  residents: MapResident[];
  centerLat: number;
  centerLng: number;
  selectedId?: string | null;
  onSelect?: (r: MapResident) => void;
  className?: string;
  boundary?: GeoJsonFeatureCollection | null;
  baseLayer?: BaseLayer;
  showHazards?: boolean;
  showEvacuation?: boolean;
  showEstablishments?: boolean;
  hazardPins?: MapHazardPin[];
  evacuationCenters?: MapEvacuationCenter[];
  establishments?: MapEstablishment[];
  cluster?: boolean;
  outsideBoundaryIds?: Set<string>;
  onCoordinateHover?: (lat: number | null, lng: number | null) => void;
}

// Resident status → pin color
const STATUS_COLOR: Record<string, string> = {
  active:      "#22c55e",
  deceased:    "#64748b",
  transferred: "#f59e0b",
  archived:    "#ef4444",
};

// Hazard severity → color
const HAZARD_COLOR: Record<string, string> = {
  low:      "#22c55e",
  moderate: "#f59e0b",
  high:     "#ef4444",
  critical: "#991b1b",
};

// Base layer tile URLs
const BASE_LAYERS: Record<BaseLayer, { url: string; attribution: string; maxZoom: number; subdomains?: string }> = {
  streets: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19,
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
};

function residentPinIcon(status: string | null, selected: boolean, outsideBoundary: boolean): L.DivIcon {
  const color = STATUS_COLOR[status ?? ""] ?? "#3b82f6";
  const size = selected ? 16 : 12;
  const border = selected
    ? "3px solid #fff"
    : outsideBoundary
      ? "2px solid #f59e0b"
      : "2px solid rgba(255,255,255,0.85)";
  const shadow = selected
    ? `0 0 0 3px ${color}55, 0 2px 6px rgba(0,0,0,0.35)`
    : outsideBoundary
      ? "0 0 0 2px rgba(245,158,11,0.35), 0 1px 4px rgba(0,0,0,0.3)"
      : "0 1px 4px rgba(0,0,0,0.3)";
  const badge = outsideBoundary
    ? `<div style="position:absolute;top:-6px;right:-6px;width:12px;height:12px;border-radius:50%;background:#f59e0b;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#fff;line-height:1;">!</div>`
    : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${shadow};transition:all 0.15s;cursor:pointer;"></div>
      ${badge}
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function hazardPinIcon(severity: string | null): L.DivIcon {
  const color = HAZARD_COLOR[(severity ?? "").toLowerCase()] ?? "#f59e0b";
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
      <span style="color:#fff;font-weight:700;font-size:10px;transform:rotate(45deg);">!</span>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
}

function evacuationIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z"/></svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function establishmentIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:4px;background:#8b5cf6;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/></svg>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

export default function AllResidentsMap({
  residents,
  centerLat,
  centerLng,
  selectedId,
  onSelect,
  className = "w-full h-full",
  boundary,
  baseLayer = "streets",
  showHazards = false,
  showEvacuation = false,
  showEstablishments = false,
  hazardPins = [],
  evacuationCenters = [],
  establishments = [],
  cluster = true,
  outsideBoundaryIds,
  onCoordinateHover,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const residentMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const maskLayerRef = useRef<L.Polygon | null>(null);
  const hazardLayerRef = useRef<L.LayerGroup | null>(null);
  const evacLayerRef = useRef<L.LayerGroup | null>(null);
  const estLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const onCoordinateHoverRef = useRef(onCoordinateHover);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onCoordinateHoverRef.current = onCoordinateHover;
  }, [onCoordinateHover]);

  // ── Initialize map once ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
    });

    map.on("mousemove", (e) => {
      onCoordinateHoverRef.current?.(e.latlng.lat, e.latlng.lng);
    });
    map.on("mouseout", () => {
      onCoordinateHoverRef.current?.(null, null);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      residentMarkersRef.current.clear();
      tileLayerRef.current = null;
      clusterGroupRef.current = null;
      boundaryLayerRef.current = null;
      maskLayerRef.current = null;
      hazardLayerRef.current = null;
      evacLayerRef.current = null;
      estLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync base layer ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const conf = BASE_LAYERS[baseLayer];
    const layer = L.tileLayer(conf.url, {
      attribution: conf.attribution,
      maxZoom: conf.maxZoom,
      subdomains: conf.subdomains ?? "abc",
    });
    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [baseLayer]);

  // ── Sync boundary overlay + outside mask ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }
    if (maskLayerRef.current) {
      map.removeLayer(maskLayerRef.current);
      maskLayerRef.current = null;
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
    });
    geoLayer.addTo(map);
    boundaryLayerRef.current = geoLayer;

    // Fit map to boundary on first render
    try {
      map.fitBounds(geoLayer.getBounds(), { padding: [20, 20], maxZoom: 16 });
    } catch {
      // Geometry may be invalid; ignore.
    }
  }, [boundary]);

  // ── Sync resident markers (with optional clustering) ───────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old cluster group if clustering mode changed
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    residentMarkersRef.current.forEach((marker) => marker.remove());
    residentMarkersRef.current.clear();

    if (residents.length === 0) return;

    const layerHost: L.MarkerClusterGroup | L.Map = cluster
      ? (() => {
          const cg = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            disableClusteringAtZoom: 18,
            maxClusterRadius: 50,
            iconCreateFunction: (c) => {
              const count = c.getChildCount();
              const size = count < 10 ? 32 : count < 50 ? 38 : 44;
              return L.divIcon({
                className: "",
                html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(59,130,246,0.85);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size >= 38 ? 13 : 12}px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);">${count}</div>`,
                iconSize: [size, size],
              });
            },
          });
          clusterGroupRef.current = cg;
          return cg;
        })()
      : map;

    residents.forEach((r) => {
      const isOutside = outsideBoundaryIds?.has(r.id) ?? false;
      const marker = L.marker([r.latitude, r.longitude], {
        icon: residentPinIcon(r.status, r.id === selectedId, isOutside),
      });
      marker.bindPopup(
        `<div style="font-size:12px;line-height:1.5;min-width:180px;">
          <p style="font-weight:700;margin:0 0 2px;font-size:13px;">${r.full_name}</p>
          <p style="margin:0;color:#64748b;font-family:monospace;font-size:10px;">${r.resident_number}</p>
          ${r.purok ? `<p style="margin:3px 0 0;color:#475569;font-size:11px;">Purok ${r.purok}</p>` : ""}
          ${isOutside ? `<p style="margin:5px 0 0;padding:4px 6px;border-radius:6px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:600;">⚠ Outside barangay boundary — verify coordinates</p>` : ""}
          <div style="display:flex;align-items:center;gap:6px;margin:6px 0 0;">
            <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;background:${STATUS_COLOR[r.status ?? ""] ?? "#3b82f6"}22;color:${STATUS_COLOR[r.status ?? ""] ?? "#3b82f6"};text-transform:capitalize;">${r.status ?? "unknown"}</span>
            ${r.sex ? `<span style="font-size:10px;color:#94a3b8;">${r.sex === "M" || r.sex === "male" ? "Male" : "Female"}</span>` : ""}
          </div>
          <a href="/dashboard/residents/${r.id}" style="display:flex;align-items:center;justify-content:center;gap:4px;margin:8px 0 0;padding:6px 12px;border-radius:8px;background:#3b82f6;color:#fff;font-size:11px;font-weight:600;text-decoration:none;">View Profile</a>
        </div>`,
        { maxWidth: 240, className: "resident-popup" }
      );
      marker.on("click", () => onSelectRef.current?.(r));
      if (cluster && clusterGroupRef.current) {
        clusterGroupRef.current.addLayer(marker);
      } else {
        marker.addTo(map);
      }
      residentMarkersRef.current.set(r.id, marker);
    });

    if (cluster && clusterGroupRef.current) {
      (layerHost as L.MarkerClusterGroup).addTo(map);
    }
  }, [residents, selectedId, cluster, outsideBoundaryIds]);

  // ── Sync hazard pins ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hazardLayerRef.current) {
      map.removeLayer(hazardLayerRef.current);
      hazardLayerRef.current = null;
    }

    if (!showHazards || hazardPins.length === 0) return;

    const group = L.layerGroup();
    hazardPins.forEach((h) => {
      const m = L.marker([h.latitude, h.longitude], { icon: hazardPinIcon(h.severity) });
      m.bindPopup(
        `<div style="font-size:12px;min-width:180px;">
          <p style="font-weight:700;margin:0 0 2px;font-size:13px;color:#dc2626;">${h.name}</p>
          <p style="margin:0;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;">${h.type}${h.severity ? ` · ${h.severity}` : ""}</p>
          ${h.description ? `<p style="margin:6px 0 0;color:#475569;font-size:11px;">${h.description}</p>` : ""}
        </div>`,
        { maxWidth: 240 }
      );
      group.addLayer(m);
    });
    group.addTo(map);
    hazardLayerRef.current = group;
  }, [hazardPins, showHazards]);

  // ── Sync evacuation centers ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (evacLayerRef.current) {
      map.removeLayer(evacLayerRef.current);
      evacLayerRef.current = null;
    }

    if (!showEvacuation || evacuationCenters.length === 0) return;

    const group = L.layerGroup();
    evacuationCenters.forEach((e) => {
      const m = L.marker([e.latitude, e.longitude], { icon: evacuationIcon() });
      m.bindPopup(
        `<div style="font-size:12px;min-width:200px;">
          <p style="font-weight:700;margin:0 0 2px;font-size:13px;color:#1d4ed8;">${e.name}</p>
          ${e.event_name ? `<p style="margin:0;color:#64748b;font-size:11px;">${e.event_name}</p>` : ""}
          ${e.cause_type ? `<p style="margin:3px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${e.cause_type}</p>` : ""}
          <div style="display:flex;gap:12px;margin-top:6px;">
            <div><p style="margin:0;font-size:10px;color:#64748b;">Evacuees</p><p style="margin:0;font-weight:700;color:#1d4ed8;">${e.evacuee_count.toLocaleString()}</p></div>
            <div><p style="margin:0;font-size:10px;color:#64748b;">Families</p><p style="margin:0;font-weight:700;color:#1d4ed8;">${e.family_count.toLocaleString()}</p></div>
          </div>
        </div>`,
        { maxWidth: 240 }
      );
      group.addLayer(m);
    });
    group.addTo(map);
    evacLayerRef.current = group;
  }, [evacuationCenters, showEvacuation]);

  // ── Sync establishments ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (estLayerRef.current) {
      map.removeLayer(estLayerRef.current);
      estLayerRef.current = null;
    }

    if (!showEstablishments || establishments.length === 0) return;

    const group = L.layerGroup();
    establishments.forEach((e) => {
      const m = L.marker([e.latitude, e.longitude], { icon: establishmentIcon() });
      m.bindPopup(
        `<div style="font-size:12px;min-width:180px;">
          <p style="font-weight:700;margin:0 0 2px;font-size:13px;color:#6d28d9;">${e.name}</p>
          ${e.type ? `<p style="margin:0;color:#64748b;font-size:11px;">${e.type}</p>` : ""}
          ${e.status ? `<p style="margin:3px 0 0;font-size:10px;color:#94a3b8;text-transform:capitalize;">${e.status}</p>` : ""}
          <a href="/dashboard/establishments" style="display:flex;align-items:center;justify-content:center;gap:4px;margin:8px 0 0;padding:5px 10px;border-radius:6px;background:#8b5cf6;color:#fff;font-size:11px;font-weight:600;text-decoration:none;">View Details</a>
        </div>`,
        { maxWidth: 220 }
      );
      group.addLayer(m);
    });
    group.addTo(map);
    estLayerRef.current = group;
  }, [establishments, showEstablishments]);

  // ── Pan to selected marker ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const marker = residentMarkersRef.current.get(selectedId);
    if (marker) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 17), { animate: true });
      marker.openPopup();
    }
  }, [selectedId]);

  return <div ref={containerRef} className={className} />;
}
