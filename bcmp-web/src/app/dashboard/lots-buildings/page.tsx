"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MapPin, Plus, Search, Filter, Phone, Mail, User,
  MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown,
  X, Home, Building2, LandPlot, Ruler, Hash, FileText, Compass, Eye,
  Edit, Trash2, Bot, CheckCircle2, AlertTriangle, Loader2, Clock,
  HardHat, Hammer, Paintbrush, Grid3X3, MessageSquare, Send,
  Receipt, Activity, Info, Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { SortableHeader } from "@/components/ui/sortable-header";
import { DocumentLivePreview } from "@/components/settings/DocumentLivePreview";
import { cn, resolvePhotoUrl } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import type { LotBuilding, AiStreamEvent, BarangayOfficial, BarangaySettings, DocumentTemplate, IssueDocumentPayload } from "@/lib/types";

// ── Toast ──────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

// ── Clearance Type Config ──────────────────────────────────────────────────

const CLEARANCE_TYPES = [
  {
    value: "lot_clearance",
    label: "Lot Clearance",
    title: "BARANGAY LOT CLEARANCE",
    subtitle: "Lot Clearance Certificate",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    confirmBg: "#16a34a",
    icon: LandPlot,
    menuColor: "text-green-700 dark:text-green-400",
  },
  {
    value: "building_clearance",
    label: "Building Clearance",
    title: "BARANGAY BUILDING CLEARANCE",
    subtitle: "Building Clearance Certificate",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    confirmBg: "#2563eb",
    icon: Building2,
    menuColor: "text-blue-700 dark:text-blue-400",
  },
  {
    value: "fencing_clearance",
    label: "Fencing Clearance",
    title: "BARANGAY FENCING CLEARANCE",
    subtitle: "Fencing Clearance Certificate",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    confirmBg: "#d97706",
    icon: Grid3X3,
    menuColor: "text-amber-700 dark:text-amber-400",
  },
  {
    value: "excavation_clearance",
    label: "Excavation Clearance",
    title: "BARANGAY EXCAVATION CLEARANCE",
    subtitle: "Excavation Clearance Certificate",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    confirmBg: "#ea580c",
    icon: HardHat,
    menuColor: "text-orange-700 dark:text-orange-400",
  },
  {
    value: "demolition_clearance",
    label: "Demolition Clearance",
    title: "BARANGAY DEMOLITION CLEARANCE",
    subtitle: "Demolition Clearance Certificate",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    confirmBg: "#dc2626",
    icon: Hammer,
    menuColor: "text-red-700 dark:text-red-400",
  },
  {
    value: "renovation_clearance",
    label: "Renovation Clearance",
    title: "BARANGAY RENOVATION CLEARANCE",
    subtitle: "Renovation Clearance Certificate",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    confirmBg: "#7c3aed",
    icon: Paintbrush,
    menuColor: "text-violet-700 dark:text-violet-400",
  },
] as const;

type ClearanceValue = typeof CLEARANCE_TYPES[number]["value"];

function getClearanceConfig(value: string) {
  return CLEARANCE_TYPES.find((c) => c.value === value) ?? CLEARANCE_TYPES[0];
}

// ── Classification ─────────────────────────────────────────────────────────

const classificationLabels: Record<string, string> = {
  "": "All Types",
  lot_only: "Lot Only",
  building_only: "Building Only",
  lot_and_building: "Lot + Building",
};

const propertyClassOptions = [
  "", "Residential", "Commercial", "Agricultural", "Industrial", "Institutional",
];

const statusLabels: Record<string, string> = {
  "": "All Status",
  active: "Active",
  inactive: "Inactive",
  demolished: "Demolished",
};

const emptyForm: Record<string, string> = {
  classification: "lot_only",
  property_classification: "",
  owner_name: "",
  owner_contact: "",
  owner_email: "",
  owner_address: "",
  size: "",
  mri: "",
  purok: "",
  street: "",
  exact_address: "",
  lot_number: "",
  block_number: "",
  boundary_north: "",
  boundary_south: "",
  boundary_east: "",
  boundary_west: "",
  tax_declaration_number: "",
  registration_date: "",
  number_of_floors: "",
  building_material: "",
  year_constructed: "",
  assessed_value: "",
  market_value: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function classIcon(c: string) {
  switch (c) {
    case "lot_only": return <LandPlot className="h-4 w-4" />;
    case "building_only": return <Building2 className="h-4 w-4" />;
    default: return <Home className="h-4 w-4" />;
  }
}

function classBadge(c: string) {
  switch (c) {
    case "lot_only": return <Badge variant="success">Lot</Badge>;
    case "building_only": return <Badge variant="info">Building</Badge>;
    default: return <Badge variant="accent">Lot + Building</Badge>;
  }
}

function formatAddress(r: LotBuilding) {
  const parts = [r.purok, r.street].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : r.exact_address || "\u2014";
}

// ── Form Field Components ──────────────────────────────────────────────────

function FInput({
  label, name, value, placeholder, required, type, error, hint, disabled, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  required?: boolean; type?: string; error?: string; hint?: string;
  disabled?: boolean;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(name, (type === "text" || !type) ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={(type === "text" || !type) ? { textTransform: "uppercase" } : undefined}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring transition-colors",
          error ? "border-red-500" : "border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function FSelect({
  label, name, value, options, labels, required, error, onChange,
}: {
  label: string; name: string; value: string; options: string[];
  labels?: Record<string, string>; required?: boolean; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring",
          error ? "border-red-500" : "border-border"
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>{(labels?.[o] ?? o) || "\u2014 Select \u2014"}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FTextarea({
  label, name, value, placeholder, rows, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  rows?: number; onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows || 2}
        className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
      />
    </div>
  );
}

// ── Smart Combobox ─────────────────────────────────────────────────────────

const addrAbbr: Record<string, string> = {
  "st.": "street", "st": "street", "ave.": "avenue", "ave": "avenue",
  "blvd.": "boulevard", "blvd": "boulevard", "rd.": "road", "rd": "road",
};
function normStr(s: string) {
  return s.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim()
    .split(" ").map((w) => addrAbbr[w] || w).join(" ");
}
function strSim(a: string, b: string) {
  const na = normStr(a); const nb = normStr(b);
  if (na === nb) return 1;
  const tA = new Set<string>(); const tB = new Set<string>();
  const pa = `  ${na} `; const pb = `  ${nb} `;
  for (let i = 0; i < pa.length - 2; i++) tA.add(pa.slice(i, i + 3));
  for (let i = 0; i < pb.length - 2; i++) tB.add(pb.slice(i, i + 3));
  let n = 0; tA.forEach((t) => { if (tB.has(t)) n++; });
  return n / (tA.size + tB.size - n);
}
interface SmartEntry { canonical: string; count: number; aliases: string[] }
function FCombobox({
  label, name, entries, value, onChange, onEntriesChange, placeholder, uppercase,
}: {
  label: string; name: string; entries: SmartEntry[]; value: string;
  onChange: (name: string, value: string) => void;
  onEntriesChange?: React.Dispatch<React.SetStateAction<SmartEntry[]>>;
  placeholder?: string; uppercase?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const wRef = useRef<HTMLDivElement>(null);
  const dRef = useRef<HTMLDivElement>(null);
  const trimmed = query.trim();
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const matched = trimmed
    ? sorted.map((e) => {
        const sub = e.canonical.toLowerCase().includes(trimmed.toLowerCase());
        const sim = strSim(trimmed, e.canonical);
        return { ...e, score: sub ? 1 : sim };
      }).filter((e) => e.score > 0.35).sort((a, b) => b.score - a.score)
    : sorted;
  const exactMatch = entries.some((e) => normStr(e.canonical) === normStr(trimmed));
  const fuzzyMatch = trimmed && !exactMatch
    ? entries.find((e) => { const s = strSim(trimmed, e.canonical); return s > 0.55 && s < 1; })
    : null;
  const openCb = () => {
    if (!open && wRef.current) {
      const r = wRef.current.getBoundingClientRect();
      setPos({ top: r.bottom - 1, left: r.left, width: r.width });
    }
    setOpen(true); setQuery("");
  };
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wRef.current && !wRef.current.contains(e.target as Node) &&
          dRef.current && !dRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const submitVal = (val: string) => {
    if (onEntriesChange) {
      onEntriesChange((prev) => {
        const ex = prev.find((e) => e.canonical.toLowerCase() === val.toLowerCase());
        if (ex) return prev.map((e) => e === ex ? { ...e, count: e.count + 1 } : e);
        return [...prev, { canonical: val, count: 1, aliases: [] }];
      });
    }
  };
  const handleSelect = (val: string) => { submitVal(val); onChange(name, val); setQuery(""); setOpen(false); };
  const handleNew = () => {
    if (!trimmed) return;
    const val = uppercase ? trimmed.toUpperCase() : trimmed;
    submitVal(val); onChange(name, val); setQuery(""); setOpen(false);
  };
  const displayVal = uppercase ? value.toUpperCase() : value;
  return (
    <div ref={wRef} className="relative">
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <div
        className={cn(
          "flex items-center w-full overflow-hidden border border-border bg-background transition-all",
          open ? "rounded-t-xl rounded-b-none border-b-transparent" : "rounded-xl"
        )}
        style={open ? { borderColor: "var(--accent-primary)", boxShadow: "0 0 0 3px rgba(37,99,235,0.12)" } : undefined}
      >
        <input
          type="text"
          value={open ? query : displayVal}
          placeholder={value ? undefined : (placeholder || "Type to search...")}
          className="flex-1 min-w-0 border-0 bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          style={{ outline: "none", boxShadow: "none", WebkitAppearance: "none", appearance: "none" }}
          onFocus={openCb}
          onChange={(e) => { setQuery(uppercase ? e.target.value.toUpperCase() : e.target.value); if (!open) openCb(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && trimmed) { e.preventDefault(); fuzzyMatch ? handleSelect(fuzzyMatch.canonical) : handleNew(); } }}
        />
        {value && !open && (
          <button type="button" onClick={() => { onChange(name, ""); }} className="px-2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronDown className={cn("h-4 w-4 mr-2 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </div>
      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={dRef}
          className="fixed z-[10001] rounded-b-xl rounded-t-none shadow-xl max-h-52 overflow-y-auto bg-background border border-border border-t-0"
          style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {fuzzyMatch && (
            <button type="button" onClick={() => handleSelect(fuzzyMatch.canonical)}
              className="w-full text-left px-3 py-2.5 text-sm bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 transition-colors">
              <span className="text-amber-600 text-xs font-medium">Did you mean: </span>
              <span className="font-semibold">{fuzzyMatch.canonical}</span>
            </button>
          )}
          {matched.length === 0 && !trimmed && <div className="px-3 py-2.5 text-sm text-muted-foreground italic">Start typing to search or add...</div>}
          {matched.map((e) => (
            <button key={e.canonical} type="button" onClick={() => handleSelect(e.canonical)}
              className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between", e.canonical === value && "font-medium text-accent-text bg-accent-primary/5")}>
              <span>{e.canonical}</span>
              <span className="text-[10px] text-muted-foreground/60">{e.count}</span>
            </button>
          ))}
          {trimmed && !exactMatch && (
            <button type="button" onClick={handleNew}
              className="w-full text-left px-3 py-2 text-sm border-t border-border text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4" /> Save &ldquo;{uppercase ? trimmed.toUpperCase() : trimmed}&rdquo; as new entry
            </button>
          )}
        </div>, document.body
      )}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b mb-4 border-border">
      <div className="p-1.5 rounded-lg bg-accent-bg text-accent-text">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

// ── Info Item ──────────────────────────────────────────────────────────────

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground break-words">{value || "\u2014"}</p>
      </div>
    </div>
  );
}

// ── Skeleton Row ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded-md animate-pulse" style={{ width: `${50 + (i * 7) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Action Menu Portal ─────────────────────────────────────────────────────

function ActionMenuPortal({
  position,
  onView,
  onClearance,
  onEdit,
  onClose,
}: {
  position: { top: number; left: number };
  onView: () => void;
  onClearance: (type: ClearanceValue) => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [showClearanceSub, setShowClearanceSub] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return createPortal(
    <div
      data-action-menu
      className="fixed z-[9999] w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 py-1"
      style={{ top: position.top, left: position.left }}
    >
      <button
        onClick={onView}
        className="w-full px-3 py-2 text-left text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
      >
        <Eye className="h-3.5 w-3.5 text-gray-400 dark:text-gray-400" /> View Details
      </button>

      {/* Clearances submenu trigger */}
      <div
        className="relative"
        onMouseEnter={() => setShowClearanceSub(true)}
        onMouseLeave={() => setShowClearanceSub(false)}
      >
        <button className="w-full px-3 py-2 text-left text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-gray-400" /> Generate Document
          </span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </button>

        {showClearanceSub && (
          <div
            data-action-menu
            className="absolute right-full top-0 z-[10000] w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 py-1 -mr-1"
          >
            {CLEARANCE_TYPES.map((ct) => {
              const Icon = ct.icon;
              return (
                <button
                  key={ct.value}
                  onClick={() => { onClearance(ct.value); onClose(); }}
                  className={cn("w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2", ct.menuColor)}
                >
                  <Icon className="h-3.5 w-3.5" /> {ct.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-slate-600 my-1" />

      <button
        onClick={onEdit}
        className="w-full px-3 py-2 text-left text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
      >
        <Edit className="h-3.5 w-3.5 text-gray-400" /> Edit Record
      </button>
    </div>,
    document.body
  );
}

// ── Clearance Gen Modal ────────────────────────────────────────────────────
// Full-screen overlay: live-editable document preview + Mabini AI + Issue & Print

function ClearanceGenModal({
  open,
  clearanceType,
  record,
  settings,
  templates,
  officials,
  processing,
  onConfirm,
  onClose,
}: {
  open: boolean;
  clearanceType: ClearanceValue;
  record: LotBuilding | null;
  processing: boolean;
  settings: BarangaySettings | null;
  templates: DocumentTemplate[];
  officials: Array<{ name: string; position: string }>;
  onConfirm: (data: { template: DocumentTemplate; notes: string; customContent: string; fields: Record<string, string> }) => Promise<void>;
  onClose: () => void;
}) {
  const docRef = useRef<HTMLDivElement>(null);
  const cfg = getClearanceConfig(clearanceType);
  const template = templates.find((item) => item.category === clearanceType) ?? null;
  const documentSettings = settings?.settings ?? {};
  const customDesigns = Array.isArray(documentSettings.customized_lot_building_certificates)
    ? documentSettings.customized_lot_building_certificates as Array<{ id: string; isGlobal?: boolean; design_settings?: Record<string, string | boolean> }>
    : [];
  const customDesign = customDesigns.find((item) => item.id === template?.id);
  const design = customDesign?.design_settings ?? {};
  const useGlobal = customDesign ? (customDesign.isGlobal ?? design.use_global_design ?? true) : true;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const year = today.getFullYear();

  const defaultCertBody = `This is to certify that the property described herein has been duly evaluated and is hereby granted clearance for the purpose stated. This clearance is issued pursuant to existing barangay ordinances and applicable local government regulations.`;

  const defaultFooterNote = `This clearance does not exempt the holder from compliance with national building codes, environmental regulations, and other applicable laws and ordinances. Any violation shall render this clearance null and void.`;

  const [certBody, setCertBody] = useState(defaultCertBody);
  const [footerNote, setFooterNote] = useState(defaultFooterNote);
  const [notes, setNotes] = useState("");
  const [issuanceContent, setIssuanceContent] = useState("");

  const address = record ? formatAddress(record) : "";
  const previewFields: Record<string, string> = {
    owner_name: record?.owner_name || "", owner_address: record?.owner_address || "",
    lot_address: address, property_address: address, construction_address: address,
    site_address: address, lot_area: record?.size || "", floor_area: record?.size || "",
    tax_dec_no: record?.tax_declaration_number || "", structure_type: record?.classification || "",
    applicant_name: record?.owner_name || "", purpose: cfg.label,
    full_name: record?.owner_name || "", address, age: "", civil_status: "", sex: "",
  };

  const mergeIssuanceFields = (content: string) => {
    let mergedContent = content;
    Object.entries(previewFields).forEach(([key, value]) => {
      mergedContent = mergedContent.split(`{{${key}}}`).join(value);
    });
    return mergedContent.replace(/\{\{[^{}]+\}\}/g, "");
  };

  // Reset on open/type change
  useEffect(() => {
    setCertBody(defaultCertBody);
    setFooterNote(defaultFooterNote);
    setNotes("");
    setMabiniInput("");
    setMabiniReply("");
    setMabiniConvId(null);
    const storedContent = !useGlobal && typeof design.custom_content === "string"
      ? design.custom_content
      : template?.content || `${defaultCertBody}\n\n${defaultFooterNote}`;
    setIssuanceContent(mergeIssuanceFields(storedContent));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clearanceType, record?.id, template?.id, customDesign?.id]);

  // Mabini inline editor
  const [mabiniInput, setMabiniInput] = useState("");
  const [mabiniReply, setMabiniReply] = useState("");
  const [mabiniLoading, setMabiniLoading] = useState(false);
  const [mabiniConvId, setMabiniConvId] = useState<string | null>(null);
  const mabiniAbortRef = useRef<AbortController | null>(null);

  const handleMabiniSend = async () => {
    if (!mabiniInput.trim() || mabiniLoading || !record) return;
    setMabiniLoading(true);
    setMabiniReply("");

    const address = formatAddress(record);
    const systemContext = `You are Mabini AI, helping edit a Philippine barangay official document.

DOCUMENT TYPE: ${cfg.title}
RECORD: ${record.lot_building_number}
CLASSIFICATION: ${classificationLabels[record.classification] ?? record.classification}
LOT/BLOCK: ${[record.lot_number && `Lot ${record.lot_number}`, record.block_number && `Blk ${record.block_number}`].filter(Boolean).join(" / ") || "—"}
LOCATION: ${address}
OWNER: ${record.owner_name || "—"}

CURRENT DOCUMENT CONTENT:
${issuanceContent}

The user wants to modify this document. Respond with a JSON object only — no explanation, no markdown, just raw JSON:
{"cert_body": "new certification text here", "footer_note": "new footer note here"}

If the user only wants to change one field, keep the other field unchanged. Always respond in formal Filipino-government English.`;

    const message = `${systemContext}\n\nUser instruction: ${mabiniInput.trim()}`;

    try {
      const ac = new AbortController();
      mabiniAbortRef.current = ac;
      let fullText = "";

      const onEvent = (event: AiStreamEvent) => {
        if (event.event === "content_delta") {
          fullText += event.data.text;
          setMabiniReply(fullText);
        } else if (event.event === "message_complete") {
          setMabiniConvId(event.data.conversation_id);
        }
      };

      if (mabiniConvId) {
        await api.ai.sendMessage(mabiniConvId, message, onEvent, ac.signal);
      } else {
        await api.ai.createConversation(message, onEvent, ac.signal);
      }

      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as { cert_body?: string; footer_note?: string };
          const nextCertBody = parsed.cert_body || certBody;
          const nextFooterNote = parsed.footer_note || footerNote;
          setCertBody(nextCertBody);
          setFooterNote(nextFooterNote);
          setIssuanceContent(`${nextCertBody}\n\n${nextFooterNote}`);
          setMabiniReply("Applied to document.");
        }
      } catch {
        // Non-JSON reply — show as plain text
      }
      setMabiniInput("");
    } catch {
      setMabiniReply("Failed to connect to Mabini AI.");
    } finally {
      setMabiniLoading(false);
    }
  };

  const handlePrint = () => {
    if (!docRef.current) return;
    const html = docRef.current.innerHTML;
    const win = window.open("", "_blank", "width=860,height=1100");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${cfg.title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", serif; margin: 0; padding: 48px 56px; font-size: 12pt; color: #000; background: #fff; }
  h1 { font-size: 14pt; margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 0; vertical-align: top; }
  .label { width: 40%; font-weight: bold; }
  .sig-line { border-top: 1px solid #000; padding-top: 4px; text-align: center; width: 200px; margin: 0 auto; }
  @media print { body { padding: 32px 40px; } }
</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const handleIssuePrint = async () => {
    if (!record || !template || processing) return;
    await onConfirm({
      template,
      notes,
      customContent: issuanceContent,
      fields: {
        owner_name: record.owner_name || "",
        owner_address: record.owner_address || "",
        full_name: record.owner_name || "",
        address,
        age: "",
        civil_status: "",
        sex: "",
        lot_address: address,
        property_address: address,
        construction_address: address,
        site_address: address,
        lot_area: record.size || "",
        floor_area: record.size || "",
        tax_dec_no: record.tax_declaration_number || "",
        structure_type: record.classification || "",
        applicant_name: record.owner_name || "",
        purpose: cfg.label,
      },
    });
  };

  if (!open || !record) return null;
  if (typeof document === "undefined") return null;

  const Icon = cfg.icon;
  const previewLayout = ((useGlobal ? documentSettings.document_layout : design.document_layout) || "klasiko") as "klasiko" | "elegante" | "moderno" | "digital";
  const previewPaperSize = ((useGlobal ? documentSettings.document_paper_size : design.document_paper_size) || "a4") as "a4" | "letter" | "legal";
  const previewFont = ((useGlobal ? documentSettings.document_font : design.document_font) || "times") as "times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair";
  const previewColorTheme = ((useGlobal ? documentSettings.document_color_theme : design.document_color_theme) || "plain") as "plain" | "blue" | "red" | "green" | "yellow" | "combo-flag" | "combo-festive" | "combo-earth" | "combo-gov" | "combo-bayanihan" | "combo-sunrise" | "combo-coastal" | "combo-heritage";
  const previewDesignPattern = ((useGlobal ? documentSettings.document_design_pattern : design.document_design_pattern) || "wave") as "wave" | "gradient" | "bold" | "photo" | "minimal" | "stripe" | "wreath" | "sunburst" | "gothic" | "scroll" | "diplomatic" | "ornate" | "geometric" | "bold-stripe" | "tech";

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[95vh] flex rounded-2xl overflow-hidden shadow-2xl border border-border bg-background">

        {/* ── Left: Document Preview ── */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-800/60 overflow-y-auto p-6">
          <DocumentLivePreview
            key={`${record.id}-${clearanceType}-${template?.id || "default"}`}
            layout={previewLayout}
            paperSize={previewPaperSize}
            font={previewFont}
            colorTheme={previewColorTheme}
            designPattern={previewDesignPattern}
            barangayName={settings?.name}
            municipality={settings?.city_municipality}
            province={settings?.province}
            logoUrl={resolvePhotoUrl(settings?.logo_url)}
            municipalityLogoUrl={resolvePhotoUrl(settings?.municipality_logo_url)}
            signatoryName={(documentSettings.default_signatory_name as string) || settings?.captain_name}
            signatoryTitle={(documentSettings.default_signatory_title as string) || "PUNONG BARANGAY"}
            contentTitle={template?.title || cfg.title}
            contentSalutation={template?.salutation}
            contentBodyHtml={issuanceContent}
            rawContent={issuanceContent}
            onContentChange={setIssuanceContent}
            contentControlNo={record.lot_building_number}
            contentIssuedDate={dateStr}
            contentRequestedBy={record.owner_name || ""}
            contentPurpose={cfg.label}
            officials={officials}
            hideChrome
            fitToContainer
          />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Click the certificate body to edit this issuance only. The saved template will not be changed.
          </p>
          <div
            ref={docRef}
            className="hidden"
            style={{ fontFamily: "'Times New Roman', serif", fontSize: "12pt", lineHeight: 1.6 }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <p style={{ fontSize: "9pt", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 2px 0" }}>
                Republic of the Philippines
              </p>
              <p style={{ fontSize: "9pt", margin: "0 0 16px 0" }}>Barangay Office</p>
              <div style={{ borderTop: "2.5px solid #000", borderBottom: "2.5px solid #000", padding: "8px 0", margin: "0 0 6px 0" }}>
                <h1 style={{ fontSize: "14pt", fontWeight: "bold", letterSpacing: "1.5px", textTransform: "uppercase", margin: 0 }}>
                  {cfg.title}
                </h1>
              </div>
              <p style={{ fontSize: "10pt", fontFamily: "monospace", margin: "4px 0 0 0" }}>
                No. {record.lot_building_number}
              </p>
            </div>

            <p style={{ textAlign: "justify", marginBottom: "20px" }}>
              <span style={{ fontWeight: "bold" }}>TO WHOM IT MAY CONCERN:</span>
            </p>
            <p style={{ textAlign: "justify", marginBottom: "20px" }}>{certBody}</p>

            {/* Property Details */}
            <table style={{ width: "100%", marginBottom: "20px" }}>
              <tbody>
                <tr>
                  <td style={{ width: "40%", fontWeight: "bold", paddingBottom: "6px" }}>Record Number:</td>
                  <td style={{ fontFamily: "monospace" }}>{record.lot_building_number}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", paddingBottom: "6px" }}>Classification:</td>
                  <td>{classificationLabels[record.classification] ?? record.classification}</td>
                </tr>
                {(record.lot_number || record.block_number) && (
                  <tr>
                    <td style={{ fontWeight: "bold", paddingBottom: "6px" }}>Lot / Block:</td>
                    <td>{[record.lot_number && `Lot ${record.lot_number}`, record.block_number && `Block ${record.block_number}`].filter(Boolean).join(", ")}</td>
                  </tr>
                )}
                {record.size && (
                  <tr>
                    <td style={{ fontWeight: "bold", paddingBottom: "6px" }}>Area / Size:</td>
                    <td>{record.size}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ fontWeight: "bold", paddingBottom: "6px" }}>Location:</td>
                  <td>{address}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", paddingBottom: "6px" }}>Owner / Applicant:</td>
                  <td style={{ fontWeight: "bold", textTransform: "uppercase" }}>{record.owner_name || "—"}</td>
                </tr>
                {record.tax_declaration_number && (
                  <tr>
                    <td style={{ fontWeight: "bold", paddingBottom: "6px" }}>Tax Declaration No.:</td>
                    <td style={{ fontFamily: "monospace" }}>{record.tax_declaration_number}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Boundaries */}
            {(record.boundary_north || record.boundary_south || record.boundary_east || record.boundary_west) && (
              <>
                <p style={{ fontWeight: "bold", marginBottom: "6px" }}>BOUNDARIES:</p>
                <table style={{ width: "100%", marginBottom: "20px" }}>
                  <tbody>
                    {record.boundary_north && <tr><td style={{ width: "20%", fontWeight: "bold" }}>North:</td><td>{record.boundary_north}</td></tr>}
                    {record.boundary_south && <tr><td style={{ fontWeight: "bold" }}>South:</td><td>{record.boundary_south}</td></tr>}
                    {record.boundary_east && <tr><td style={{ fontWeight: "bold" }}>East:</td><td>{record.boundary_east}</td></tr>}
                    {record.boundary_west && <tr><td style={{ fontWeight: "bold" }}>West:</td><td>{record.boundary_west}</td></tr>}
                  </tbody>
                </table>
              </>
            )}

            <p style={{ textAlign: "center", fontWeight: "bold", margin: "0 0 20px 0" }}>
              Year {year}
            </p>

            <p style={{ textAlign: "justify", marginBottom: "32px" }}>{footerNote}</p>

            {notes && (
              <p style={{ textAlign: "justify", marginBottom: "20px", fontStyle: "italic" }}>
                <strong>Notes:</strong> {notes}
              </p>
            )}

            <p style={{ marginBottom: "40px" }}>
              Issued this <span style={{ fontWeight: "bold" }}>{dateStr}</span> at the Barangay Office.
            </p>

            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #000", paddingTop: "4px", width: "200px", margin: "0 auto" }}>
                <p style={{ fontWeight: "bold", fontSize: "10pt", margin: "0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Punong Barangay
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Controls ── */}
        <div className="w-72 flex flex-col border-l border-border shrink-0">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Issue Clearance</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.subtitle}</p>
            </div>
            <button onClick={onClose} disabled={processing} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Clearance type badge */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Clearance Type</p>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0", cfg.badge)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{cfg.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{cfg.title}</p>
                </div>
              </div>
            </div>

            {/* Property info */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Property</p>
              <div className="rounded-xl border border-border p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground leading-tight font-mono">{record.lot_building_number}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{classificationLabels[record.classification] ?? record.classification}</p>
                {record.owner_name && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <User className="h-2.5 w-2.5" /> {record.owner_name}
                  </p>
                )}
                {address !== "—" && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {address}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes (Optional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or remarks..."
                rows={2}
                className="w-full text-[11px] bg-background border border-border rounded-xl px-2.5 py-2 resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
              />
            </div>

            {/* Mabini AI inline editor */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bot className="h-3 w-3" /> Mabini AI — Live Edit
              </p>
              <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                {mabiniReply && (
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-accent-bg flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-3 w-3 text-accent-text" />
                      </div>
                      <p className="text-[11px] text-foreground leading-relaxed">{mabiniReply}</p>
                    </div>
                  </div>
                )}
                <div className="p-2 flex flex-col gap-2">
                  <textarea
                    value={mabiniInput}
                    onChange={(e) => setMabiniInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleMabiniSend(); } }}
                    placeholder={"Tell Mabini what to change\nex. Make the cert text more formal"}
                    rows={3}
                    disabled={mabiniLoading}
                    className="w-full text-[11px] bg-background border border-border rounded-lg px-2.5 py-2 resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/50 disabled:opacity-50"
                  />
                  <button
                    onClick={handleMabiniSend}
                    disabled={mabiniLoading || !mabiniInput.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    {mabiniLoading
                      ? <><Loader2 className="h-3 w-3 animate-spin" /> Thinking...</>
                      : <><Bot className="h-3 w-3" /> Apply to Document</>}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
                Changes apply to the live preview. Press Enter to send.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border shrink-0 space-y-2">
            <button
              onClick={handleIssuePrint}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: cfg.confirmBg }}
            >
              {processing
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                : <><Receipt className="h-4 w-4" /> Issue &amp; Print</>}
            </button>
            <button
              onClick={handlePrint}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              Preview Only (No Issue)
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Send SMS Modal ─────────────────────────────────────────────────────────

function SendSmsModal({
  open,
  record,
  onClose,
  onSent,
}: {
  open: boolean;
  record: LotBuilding | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setMessage(""); setError(""); }
  }, [open]);

  const handleSend = async () => {
    if (!record || !message.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await api.lotsBuildings.sendSms(record.id, message.trim());
      onSent();
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message || "Failed to send SMS.");
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const segCount = Math.ceil(charCount / 160) || 1;

  return (
    <Modal
      open={open && !!record}
      onClose={onClose}
      title="Send SMS"
      description={record ? `To: ${record.owner_name || "Owner"} — ${record.owner_contact}` : ""}
      size="sm"
      footer={
        <>
          <ModalButton variant="secondary" onClick={onClose} disabled={sending}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? <><Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> Sending...</> : <><Send className="h-3.5 w-3.5 inline mr-1" /> Send</>}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Type your message here..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1">{charCount} chars · {segCount} segment{segCount !== 1 ? "s" : ""}</p>
        </div>
        {error && (
          <p className="text-[11px] text-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type ActivityEntry = {
  id: string;
  action: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  created_at: string;
  user: { id: string; username: string; first_name: string; last_name: string } | null;
};

type Transaction = {
  id: string;
  transaction_type: string;
  year: number;
  notes: string | null;
  created_at: string;
  generated_by?: string;
};

type SmsLog = {
  id: string;
  recipient_phone: string;
  message: string;
  status: string;
  credit_cost: number;
  created_at: string;
};

type DupResult = {
  duplicate: boolean;
  reason?: "tax_declaration_number" | "owner_address";
  message?: string;
  lot_building?: { id: string; lot_building_number: string; owner_name: string; classification: string };
} | null;

export default function LotsBuildingsPage() {
  // ── Data ──
  const [records, setRecords] = useState<LotBuilding[]>([]);
  const [settings, setSettings] = useState<BarangaySettings | null>(null);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [officials, setOfficials] = useState<Array<{ name: string; position: string }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number; lots: number; buildings: number; lot_and_building: number;
    active: number; total_clearances_this_year: number;
  } | null>(null);

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [propClassFilter, setPropClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("lot_building_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 15;

  // ── View modal ──
  const [viewRecord, setViewRecord] = useState<LotBuilding | null>(null);
  const [viewTab, setViewTab] = useState<"overview" | "documents" | "sms" | "activity">("overview");
  const [viewTransactions, setViewTransactions] = useState<Transaction[]>([]);
  const [viewSmsHistory, setViewSmsHistory] = useState<SmsLog[]>([]);
  const [viewActivity, setViewActivity] = useState<ActivityEntry[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  // ── Combobox entries ──
  const [purokEntries, setPurokEntries] = useState<SmartEntry[]>([]);
  const [streetEntries, setStreetEntries] = useState<SmartEntry[]>([]);

  // ── Drawer ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<LotBuilding | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);

  // ── Duplicate check (create mode only) ──
  const [dupResult, setDupResult] = useState<DupResult>(null);
  const [dupChecking, setDupChecking] = useState(false);
  const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDupModal, setShowDupModal] = useState(false);
  const [pendingSavePayload, setPendingSavePayload] = useState<Record<string, unknown> | null>(null);

  // ── Clearance gen ──
  const [clearanceOpen, setClearanceOpen] = useState(false);
  const [clearanceType, setClearanceType] = useState<ClearanceValue>("lot_clearance");
  const [clearanceTarget, setClearanceTarget] = useState<LotBuilding | null>(null);
  const [clearanceProcessing, setClearanceProcessing] = useState(false);

  // ── SMS modal ──
  const [smsTarget, setSmsTarget] = useState<LotBuilding | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);


  // ── Action menu ──
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // ── Toast ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((t: Omit<Toast, "id">) => {
    setToasts((p) => [...p, { ...t, id: Date.now().toString() }]);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((p) => p.slice(1)), 5000);
    return () => clearTimeout(timer);
  }, [toasts]);


  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.lotsBuildings.list({
        search: debouncedSearch || undefined,
        classification: classFilter || undefined,
        property_classification: propClassFilter || undefined,
        status: statusFilter || undefined,
        sort_by: sortKey,
        sort_dir: sortDir,
        per_page: pageSize,
        page,
      });
      setRecords(res.data);
      setTotal(res.total);
    } catch {
      addToast({ type: "error", title: "Failed to load records" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, classFilter, propClassFilter, statusFilter, sortKey, sortDir, page, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await api.lotsBuildings.stats();
      setStats(s);
    } catch { /* stats are optional */ }
  }, []);

  const fetchViewData = useCallback(async (id: string) => {
    setViewLoading(true);
    try {
      const [txRes, actRes] = await Promise.all([
        api.lotsBuildings.transactions(id),
        api.lotsBuildings.activity(id),
      ]);
      setViewTransactions(txRes.transactions);
      setViewActivity(actRes.data);
      // SMS history (best effort)
      try {
        const smsRes = await api.lotsBuildings.smsHistory(id);
        setViewSmsHistory(smsRes.data);
      } catch {
        setViewSmsHistory([]);
      }
    } catch {
      setViewTransactions([]);
      setViewActivity([]);
      setViewSmsHistory([]);
    } finally {
      setViewLoading(false);
    }
  }, []);

  // Debounce search — 350ms after typing stops
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    api.settings.get().then(setSettings).catch(() => {});
    api.documentTemplates.list({ constituent_type: "lot_building", is_active: true, per_page: 100 })
      .then((response) => setDocumentTemplates(response.data))
      .catch(() => {});
    api.officials.list({ is_active: true, per_page: 50, sort_by: "sort_order", sort_dir: "asc" })
      .then((response) => setOfficials(response.data.map((official: BarangayOfficial) => ({
        name: [
          official.resident?.first_name,
          official.resident?.middle_name,
          official.resident?.last_name,
          official.resident?.extension_name,
        ].filter(Boolean).join(" ") || official.position,
        position: official.position.replace(/_/g, " "),
      }))))
      .catch(() => {});
  }, []);

  // Load purok/street entries from existing records for comboboxes
  useEffect(() => {
    api.lotsBuildings.list({ per_page: 500, sort_by: "lot_building_number", sort_dir: "asc" }).then((res) => {
      const puroks = new Map<string, number>();
      const streets = new Map<string, number>();
      for (const r of res.data) {
        if (r.purok) puroks.set(r.purok, (puroks.get(r.purok) || 0) + 1);
        if (r.street) streets.set(r.street, (streets.get(r.street) || 0) + 1);
      }
      setPurokEntries(Array.from(puroks.entries()).map(([c, n]) => ({ canonical: c, count: n, aliases: [] })));
      setStreetEntries(Array.from(streets.entries()).map(([c, n]) => ({ canonical: c, count: n, aliases: [] })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (viewRecord) {
      setViewTab("overview");
      fetchViewData(viewRecord.id);
    }
  }, [viewRecord, fetchViewData]);

  // ── Pagination ──────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  // ── Form helpers ────────────────────────────────────────────────────────

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });

    // Duplicate check — triggered on TD#, owner_name, or exact_address changes
    if (["tax_declaration_number", "owner_name", "exact_address"].includes(name)) {
      if (dupTimerRef.current) clearTimeout(dupTimerRef.current);
      setDupResult(null);

      // Need at least TD# or (owner_name + address) to run a check
      const currentForm: Record<string, string> = { ...form, [name]: value };

      const hasTdn = (currentForm.tax_declaration_number ?? "").trim().length >= 2;
      const hasOwnerAddr =
        (currentForm.owner_name ?? "").trim().length >= 3 &&
        (currentForm.exact_address ?? "").trim().length >= 5;

      if (hasTdn || hasOwnerAddr) {
        setDupChecking(true);
        dupTimerRef.current = setTimeout(async () => {
          try {
            const res = await api.lotsBuildings.checkDuplicate({
              tax_declaration_number: hasTdn ? currentForm.tax_declaration_number.trim() : undefined,
              owner_name: hasOwnerAddr ? currentForm.owner_name.trim() : undefined,
              exact_address: hasOwnerAddr ? currentForm.exact_address.trim() : undefined,
              exclude_id: drawerMode === "edit" && editTarget ? editTarget.id : undefined,
            });
            setDupResult(res);
          } catch { /* ignore */ }
          finally { setDupChecking(false); }
        }, 600);
      }
    }
  };

  const validateForm = (): { valid: boolean; firstError: string } => {
    const errors: Record<string, string> = {};
    if (!form.classification) errors.classification = "Record type is required.";
    if (!form.owner_name.trim()) errors.owner_name = "Owner name is required.";
    if (form.owner_contact && form.owner_contact.replace(/\D/g, "").length !== 11)
      errors.owner_contact = "Contact number must be exactly 11 digits.";
    if (form.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.owner_email.trim()))
      errors.owner_email = "Enter a valid email address.";
    setFormErrors(errors);
    const firstError = Object.values(errors)[0] ?? "";
    return { valid: Object.keys(errors).length === 0, firstError };
  };

  const buildPayload = (): Record<string, unknown> => ({
    classification: form.classification,
    property_classification: form.property_classification || null,
    owner_name: form.owner_name.trim(),
    owner_contact: form.owner_contact || null,
    owner_email: form.owner_email || null,
    owner_address: form.owner_address || null,
    size: form.size || null,
    purok: form.purok || null,
    street: form.street || null,
    exact_address: form.exact_address || null,
    boundary_north: form.boundary_north || null,
    boundary_south: form.boundary_south || null,
    boundary_east: form.boundary_east || null,
    boundary_west: form.boundary_west || null,
    tax_declaration_number: form.tax_declaration_number || null,
    // Auto-set registration date to today on create; preserve existing on edit
    registration_date: drawerMode === "create"
      ? new Date().toISOString().split("T")[0]
      : (editTarget?.registration_date ?? null),
    number_of_floors: form.number_of_floors ? parseInt(form.number_of_floors) : null,
    building_material: form.building_material || null,
    year_constructed: form.year_constructed ? parseInt(form.year_constructed) : null,
    assessed_value: form.assessed_value ? parseFloat(form.assessed_value) : null,
    market_value: form.market_value ? parseFloat(form.market_value) : null,
  });

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors({});
    setDupResult(null);
    setEditTarget(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openEdit = (r: LotBuilding) => {
    setEditTarget(r);
    setForm({
      classification: r.classification || "lot_only",
      property_classification: r.property_classification || "",
      owner_name: r.owner_name || "",
      owner_contact: r.owner_contact || "",
      owner_email: r.owner_email || "",
      owner_address: r.owner_address || "",
      size: r.size || "",
      mri: r.mri || "",
      purok: r.purok || "",
      street: r.street || "",
      exact_address: r.exact_address || "",
      lot_number: r.lot_number || "",
      block_number: r.block_number || "",
      boundary_north: r.boundary_north || "",
      boundary_south: r.boundary_south || "",
      boundary_east: r.boundary_east || "",
      boundary_west: r.boundary_west || "",
      tax_declaration_number: r.tax_declaration_number || "",
      registration_date: r.registration_date ? r.registration_date.split("T")[0] : "",
      number_of_floors: r.number_of_floors ? String(r.number_of_floors) : "",
      building_material: r.building_material || "",
      year_constructed: r.year_constructed ? String(r.year_constructed) : "",
      assessed_value: r.assessed_value || "",
      market_value: r.market_value || "",
    });
    setDupResult(null);
    setFormErrors({});
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditTarget(null);
    setFormErrors({});
    setDupResult(null);
    if (dupTimerRef.current) clearTimeout(dupTimerRef.current);
  };

  // ── Save ────────────────────────────────────────────────────────────────

  const doSave = async (payload: Record<string, unknown>) => {
    setFormSaving(true);
    try {
      if (drawerMode === "edit" && editTarget) {
        const res = await api.lotsBuildings.update(editTarget.id, payload);
        addToast({ type: "success", title: "Record Updated", message: `${res.lot_building.lot_building_number} has been updated.` });
        // Auto-SMS if contact exists (fire-and-forget)
        if (editTarget.owner_contact) {
          api.lotsBuildings.sendSms(editTarget.id, `Your lot/building record (${editTarget.lot_building_number}) has been updated in the barangay system.`).catch(() => {});
        }
        if (viewRecord?.id === editTarget.id) {
          setViewRecord(res.lot_building);
        }
      } else {
        const res = await api.lotsBuildings.create(payload);
        addToast({ type: "success", title: "Record Created", message: `${res.lot_building.lot_building_number} has been registered.` });
        // Auto-SMS if contact exists (fire-and-forget)
        if (res.lot_building.owner_contact) {
          api.lotsBuildings.sendSms(res.lot_building.id, `Your lot/building (${res.lot_building.lot_building_number}) has been registered in the barangay system.`).catch(() => {});
        }
      }
      closeDrawer();
      fetchList();
      fetchStats();
    } catch (err) {
      const msg = (err as { message?: string }).message || "Something went wrong.";
      addToast({ type: "error", title: "Save Failed", message: msg });
    } finally {
      setFormSaving(false);
    }
  };

  const handleSave = async () => {
    if (formSaving) return;
    const { valid, firstError } = validateForm();
    if (!valid) {
      addToast({ type: "error", title: "Check Required Fields", message: firstError || "Please fix the errors above." });
      return;
    }

    const payload = buildPayload();

    // TD# duplicate = hard block (same TD# cannot exist twice in the barangay)
    if (dupResult?.duplicate && dupResult.reason === "tax_declaration_number") {
      addToast({ type: "error", title: "Duplicate Tax Declaration #", message: dupResult.message || "This Tax Declaration # is already registered." });
      return;
    }

    // Owner+address duplicate = soft warning — show confirm modal before proceeding
    if (drawerMode === "create" && dupResult?.duplicate && dupResult.reason === "owner_address") {
      setPendingSavePayload(payload);
      setShowDupModal(true);
      return;
    }

    await doSave(payload);
  };

  // ── Clearance ───────────────────────────────────────────────────────────

  const openClearance = (r: LotBuilding, type: ClearanceValue) => {
    setClearanceTarget(r);
    setClearanceType(type);
    setClearanceOpen(true);
  };

  const handleClearanceConfirm = async ({
    template,
    notes,
    customContent,
    fields,
  }: {
    template: DocumentTemplate;
    notes: string;
    customContent: string;
    fields: Record<string, string>;
  }) => {
    if (!clearanceTarget || clearanceProcessing) return;
    setClearanceProcessing(true);
    try {
      const payload: IssueDocumentPayload = {
        template_id: template.id,
        constituent_type: "lot_building",
        constituent_id: clearanceTarget.id,
        custom_field_values: fields,
        custom_content: customContent,
      };
      const result = await api.issuedDocuments.create(payload);
      await api.lotsBuildings.clearance(clearanceTarget.id, clearanceType, notes || undefined);
      const cfg = getClearanceConfig(clearanceType);
      addToast({ type: "success", title: `${cfg.label} Issued`, message: `Clearance for ${clearanceTarget.lot_building_number} has been recorded.` });
      setClearanceOpen(false);
      setClearanceTarget(null);
      window.open(`/api/v1/issued-documents/${result.issued_document.id}/pdf`, "_blank");
      fetchList();
      fetchStats();
      if (viewRecord?.id === clearanceTarget.id) {
        fetchViewData(clearanceTarget.id);
      }
    } catch (err) {
      addToast({ type: "error", title: "Clearance Failed", message: (err as { message?: string }).message || "Something went wrong." });
    } finally {
      setClearanceProcessing(false);
    }
  };


  // ── Render helpers ──────────────────────────────────────────────────────

  const isBuilding = form.classification === "building_only" || form.classification === "lot_and_building";

  const openMenuForRow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (actionMenu === id) { setActionMenu(null); setMenuPosition(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 4, left: rect.right - 208 });
    setActionMenu(id);
  };

  const closeMenu = () => { setActionMenu(null); setMenuPosition(null); };

  const activeMenuRecord = records.find((r) => r.id === actionMenu) ?? null;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lots & Buildings"
        description="Manage barangay lot and building property records"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Records" }, { label: "Lots & Buildings" }]}
        actions={
          <MabiniButton pageContext="You are on the Lots & Buildings page. This page manages land lots, buildings, and real property records including clearance certificates." />
        }
      />

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={stats?.total ?? 0} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Lots Registered" value={stats?.lots ?? 0} icon={<LandPlot className="h-5 w-5" />} />
        <StatCard label="Buildings Registered" value={stats?.buildings ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Lot + Building" value={stats?.lot_and_building ?? 0} icon={<Home className="h-5 w-5" />} />
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by owner, record #, address..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-colors whitespace-nowrap",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted"
            )}
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-90 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
          >
            <Plus className="h-4 w-4" /> New Record
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              {["", "lot_only", "building_only", "lot_and_building"].map((c) => (
                <option key={c} value={c}>{classificationLabels[c] ?? c}</option>
              ))}
            </select>
            <select
              value={propClassFilter}
              onChange={(e) => { setPropClassFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Classifications</option>
              {propertyClassOptions.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              {["", "active", "inactive", "demolished"].map((s) => (
                <option key={s} value={s}>{statusLabels[s] ?? s}</option>
              ))}
            </select>
            <button
              onClick={() => { setClassFilter(""); setPropClassFilter(""); setStatusFilter(""); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Record" field="lot_building_number" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Classification" field="property_classification" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Owner" field="owner_name" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Size" field="size" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Status" field="status" />
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No property records found</p>
                        <p className="text-xs text-muted-foreground mt-1">Start by adding lots, buildings, or land records.</p>
                      </div>
                      <button
                        onClick={openCreate}
                        className="mt-1 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                      >
                        <Plus className="inline h-3 w-3 mr-1" /> New Record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setViewRecord(r)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent-bg flex items-center justify-center text-accent-text shrink-0">
                          {classIcon(r.classification)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground font-mono leading-tight">{r.lot_building_number}</p>
                          {(r.lot_number || r.block_number) && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {[r.lot_number && `Lot ${r.lot_number}`, r.block_number && `Blk ${r.block_number}`].filter(Boolean).join(" / ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{classBadge(r.classification)}</td>
                    <td className="px-4 py-3">
                      {r.property_classification
                        ? <span className="text-sm capitalize">{r.property_classification}</span>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate max-w-[160px]">{formatAddress(r)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground truncate max-w-[140px] font-medium">{r.owner_name || "\u2014"}</p>
                      {r.owner_contact && <p className="text-[11px] text-muted-foreground">{r.owner_contact}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.size || "\u2014"}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => openMenuForRow(e, r.id)}
                        className="p-1.5 rounded-lg hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1}&ndash;{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-3 py-1 text-sm font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Menu Portal ──────────────────────────────────────────── */}
      {actionMenu && menuPosition && activeMenuRecord && (
        <ActionMenuPortal
          position={menuPosition}
          onView={() => { setViewRecord(activeMenuRecord); closeMenu(); }}
          onClearance={(type) => { openClearance(activeMenuRecord, type); closeMenu(); }}
          onEdit={() => { openEdit(activeMenuRecord); closeMenu(); }}
          onClose={closeMenu}
        />
      )}

      {/* ── View Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title={viewRecord?.lot_building_number || ""}
        description={viewRecord ? `${viewRecord.owner_name || "No owner"} — ${classificationLabels[viewRecord.classification] ?? viewRecord.classification}` : ""}
        size="lg"
        disableOutsideClick
        footer={
          <div className="flex items-center justify-between w-full">
            <ModalButton variant="secondary" onClick={() => setViewRecord(null)}>Close</ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => { if (viewRecord) { openEdit(viewRecord); setViewRecord(null); } }}
            >
              Edit Record
            </ModalButton>
          </div>
        }
      >
        {viewRecord && (
          <div className="space-y-4">
            {/* ── Hero strip ── */}
            <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {classBadge(viewRecord.classification)}
                  {viewRecord.property_classification && (
                    <Badge variant="default" className="capitalize">{viewRecord.property_classification}</Badge>
                  )}
                  <StatusBadge status={viewRecord.status} />
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {formatAddress(viewRecord) || "No address on record"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {viewRecord.assessed_value && (
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    ₱{parseFloat(viewRecord.assessed_value).toLocaleString()}
                  </span>
                )}
                {viewRecord.assessed_value && (
                  <span className="text-[10px] text-muted-foreground">Assessed Value</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {(["overview", "documents", "sms", "activity"] as const).map((tab) => {
                const labels: Record<string, string> = { overview: "Overview", documents: "Documents", sms: "SMS History", activity: "Activity" };
                const icons: Record<string, React.ReactNode> = {
                  overview: <Info className="h-3.5 w-3.5" />,
                  documents: <FileText className="h-3.5 w-3.5" />,
                  sms: <MessageSquare className="h-3.5 w-3.5" />,
                  activity: <Activity className="h-3.5 w-3.5" />,
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setViewTab(tab)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                      viewTab === tab
                        ? "border-accent-primary text-accent-text"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {icons[tab]} {labels[tab]}
                    {tab === "documents" && viewTransactions.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-bg text-accent-text text-[10px] font-bold">
                        {viewTransactions.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {viewLoading ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <>
                {/* Overview */}
                {viewTab === "overview" && (
                  <div className="space-y-4">

                    {/* Property Details */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Property Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-border bg-background">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Record No.</p>
                          <p className="text-sm font-semibold font-mono text-foreground">{viewRecord.lot_building_number}</p>
                        </div>
                        <div className="p-3 rounded-xl border border-border bg-background">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Date Registered</p>
                          <p className="text-sm font-semibold text-foreground">
                            {viewRecord.registration_date
                              ? new Date(viewRecord.registration_date + "T00:00:00").toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
                              : "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl border border-border bg-background">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Size / Area</p>
                          <p className="text-sm font-semibold text-foreground">{viewRecord.size ? `${viewRecord.size} sqm` : "—"}</p>
                        </div>
                        <div className="p-3 rounded-xl border border-border bg-background">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Tax Declaration #</p>
                          <p className="text-sm font-semibold text-foreground font-mono">{viewRecord.tax_declaration_number || "—"}</p>
                        </div>
                        {viewRecord.market_value && (
                          <div className="p-3 rounded-xl border border-border bg-background">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Market Value</p>
                            <p className="text-sm font-semibold text-foreground">₱{parseFloat(viewRecord.market_value).toLocaleString()}</p>
                          </div>
                        )}
                        {viewRecord.purok && (
                          <div className="p-3 rounded-xl border border-border bg-background">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Purok / Sitio</p>
                            <p className="text-sm font-semibold text-foreground">{viewRecord.purok}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Building details (conditional) */}
                    {(viewRecord.number_of_floors || viewRecord.building_material || viewRecord.year_constructed) && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Building Details</p>
                        <div className="grid grid-cols-3 gap-3">
                          {viewRecord.number_of_floors && (
                            <div className="p-3 rounded-xl border border-border bg-background">
                              <p className="text-[10px] text-muted-foreground mb-0.5">Floors</p>
                              <p className="text-sm font-semibold text-foreground">{viewRecord.number_of_floors}</p>
                            </div>
                          )}
                          {viewRecord.year_constructed && (
                            <div className="p-3 rounded-xl border border-border bg-background">
                              <p className="text-[10px] text-muted-foreground mb-0.5">Year Built</p>
                              <p className="text-sm font-semibold text-foreground">{viewRecord.year_constructed}</p>
                            </div>
                          )}
                          {viewRecord.building_material && (
                            <div className="p-3 rounded-xl border border-border bg-background col-span-1">
                              <p className="text-[10px] text-muted-foreground mb-0.5">Material</p>
                              <p className="text-sm font-semibold text-foreground truncate">{viewRecord.building_material}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Owner */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Owner Information</p>
                      <div className="p-3 rounded-xl border border-border bg-background space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent-bg flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-accent-text" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{viewRecord.owner_name || "—"}</p>
                            {viewRecord.owner_address && <p className="text-[11px] text-muted-foreground">{viewRecord.owner_address}</p>}
                          </div>
                        </div>
                        {(viewRecord.owner_contact || viewRecord.owner_email) && (
                          <div className="flex items-center gap-4 pt-1 border-t border-border">
                            {viewRecord.owner_contact && (
                              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Phone className="h-3 w-3" /> {viewRecord.owner_contact}
                              </span>
                            )}
                            {viewRecord.owner_email && (
                              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Mail className="h-3 w-3" /> {viewRecord.owner_email}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Boundaries */}
                    {(viewRecord.boundary_north || viewRecord.boundary_south || viewRecord.boundary_east || viewRecord.boundary_west) && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Boundaries / Landmarks</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { dir: "N", label: "North", val: viewRecord.boundary_north },
                            { dir: "S", label: "South", val: viewRecord.boundary_south },
                            { dir: "E", label: "East", val: viewRecord.boundary_east },
                            { dir: "W", label: "West", val: viewRecord.boundary_west },
                          ].map(({ dir, label, val }) => val && (
                            <div key={dir} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-background">
                              <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{dir}</span>
                              <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground">{label}</p>
                                <p className="text-xs font-medium text-foreground truncate">{val}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents */}
                {viewTab === "documents" && (
                  <div>
                    {viewTransactions.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-10">
                        <div className="p-3 rounded-2xl bg-muted/50">
                          <FileText className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">No documents issued</p>
                        <p className="text-[11px] text-muted-foreground">Clearances issued for this property will appear here.</p>
                      </div>
                    ) : (
                      <>
                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 pb-1.5 border-b border-border">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Document</p>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Year</p>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Date Issued</p>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border max-h-72 overflow-y-auto">
                          {[...viewTransactions].reverse().map((tx) => {
                            const cfg = getClearanceConfig(tx.transaction_type);
                            const Icon = cfg.icon;
                            return (
                              <div key={tx.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-3 py-2.5 hover:bg-muted/30 transition-colors">
                                {/* Document name + icon */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={cn("inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0", cfg.badge)}>
                                    <Icon className="h-3.5 w-3.5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{cfg.label}</p>
                                    {tx.notes && <p className="text-[10px] text-muted-foreground truncate italic">{tx.notes}</p>}
                                    {tx.generated_by && <p className="text-[10px] text-muted-foreground truncate">By {tx.generated_by}</p>}
                                  </div>
                                </div>

                                {/* Year */}
                                <p className="text-sm text-muted-foreground text-right tabular-nums shrink-0">{tx.year}</p>

                                {/* Date */}
                                <p className="text-sm text-muted-foreground text-right tabular-nums shrink-0 min-w-[72px]">
                                  {new Date(tx.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "2-digit" })}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Footer count */}
                        <p className="text-[10px] text-muted-foreground text-right pt-2 pr-1">
                          {viewTransactions.length} record{viewTransactions.length !== 1 ? "s" : ""} total
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* SMS History */}
                {viewTab === "sms" && (
                  <div>
                    {viewSmsHistory.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No SMS messages sent yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {viewSmsHistory.map((sms) => (
                          <div key={sms.id} className="flex items-start gap-3 p-3 rounded-xl border border-border">
                            <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-foreground leading-snug">{sms.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {sms.recipient_phone} · {sms.status} · ₱{sms.credit_cost?.toFixed(2)}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(sms.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Activity */}
                {viewTab === "activity" && (
                  <div>
                    {viewActivity.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <Clock className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {viewActivity.map((a) => {
                          const actionColors: Record<string, string> = {
                            created: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                            updated: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            deleted: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            clearance_issued: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          };
                          const changedKeys = a.changes ? Object.keys(a.changes).slice(0, 4) : [];
                          const moreCount = a.changes ? Math.max(0, Object.keys(a.changes).length - 4) : 0;
                          return (
                            <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border">
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize shrink-0",
                                actionColors[a.action] || "bg-muted text-muted-foreground"
                              )}>
                                {a.action.replace("_", " ")}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-foreground leading-tight">
                                  {a.user ? `${a.user.first_name} ${a.user.last_name}` : "System"}
                                  {a.user && <span className="text-muted-foreground ml-1">@{a.user.username}</span>}
                                </p>
                                {changedKeys.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {changedKeys.map((k) => (
                                      <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        {k.replace(/_/g, " ")}
                                      </span>
                                    ))}
                                    {moreCount > 0 && <span className="text-[9px] text-muted-foreground">+{moreCount} more</span>}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {new Date(a.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ── Duplicate Modal ─────────────────────────────────────────────── */}
      <Modal
        open={showDupModal}
        onClose={() => { setShowDupModal(false); setPendingSavePayload(null); }}
        title="Possible Duplicate Detected"
        description="An existing record with the same owner name was found."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDupModal(false); setPendingSavePayload(null); }}>
              Cancel
            </ModalButton>
            <ModalButton
              variant="primary"
              onClick={async () => {
                setShowDupModal(false);
                if (pendingSavePayload) await doSave(pendingSavePayload);
                setPendingSavePayload(null);
              }}
            >
              Continue Anyway
            </ModalButton>
          </>
        }
      >
        {dupResult?.lot_building && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A record already exists for owner <span className="font-semibold text-foreground">{dupResult.lot_building.owner_name}</span>:
            </p>
            <div className="p-3 rounded-xl border border-border bg-muted/30">
              <p className="text-sm font-semibold font-mono">{dupResult.lot_building.lot_building_number}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{classificationLabels[dupResult.lot_building.classification ?? ""]}</p>
              <p className="text-[11px] text-muted-foreground">{dupResult.lot_building.owner_name}</p>
            </div>
            <p className="text-xs text-muted-foreground">Do you want to continue creating a new record anyway?</p>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Drawer ────────────────────────────────────────── */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-[9999] w-full max-w-lg flex flex-col bg-background border-l border-border shadow-2xl transition-transform duration-300",
        drawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Drawer header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {drawerMode === "edit" ? "Edit Record" : "Register Property"}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {drawerMode === "edit" ? `Editing ${editTarget?.lot_building_number}` : "Add a new lot or building record"}
            </p>
          </div>
          <button onClick={closeDrawer} disabled={formSaving} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* ── Section 1: Property Type ── */}
          <div>
            <SectionHeader icon={<LandPlot className="h-4 w-4" />} title="Property Type" />
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(["lot_only", "building_only", "lot_and_building"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleFieldChange("classification", c)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                    form.classification === c
                      ? "border-accent-primary bg-accent-bg text-accent-text"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  {classIcon(c)}
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{classificationLabels[c]}</span>
                </button>
              ))}
            </div>
            {formErrors.classification && (
              <p className="text-[11px] text-red-500 mb-2">{formErrors.classification}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FSelect
                label="Property Classification" name="property_classification" value={form.property_classification}
                options={propertyClassOptions}
                onChange={handleFieldChange}
              />
              <FInput label="Size / Area" name="size" value={form.size} placeholder="ex. 150" type="number" onChange={handleFieldChange} />
            </div>
          </div>

          {/* ── Section 2: Lot & Block Details ── */}
          <div>
            <SectionHeader icon={<Hash className="h-4 w-4" />} title="Lot & Block Details" />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FInput label="Lot & Building Address" name="exact_address" value={form.exact_address} placeholder="ex. #10 Aguinaldo St., East Tapinac, Olongapo City" onChange={handleFieldChange} />
              </div>
              <FCombobox label="Purok / Sitio" name="purok" value={form.purok} entries={purokEntries} onEntriesChange={setPurokEntries} placeholder="ex. Purok Sampaguita" uppercase onChange={handleFieldChange} />
              <FCombobox label="Street / Road" name="street" value={form.street} entries={streetEntries} onEntriesChange={setStreetEntries} placeholder="ex. Rizal Street" uppercase onChange={handleFieldChange} />
              <div className="col-span-2">
                <FInput label="Tax Declaration #" name="tax_declaration_number" value={form.tax_declaration_number} placeholder="ex. TD-2024-001" onChange={handleFieldChange} />
                {dupChecking && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking for duplicates...
                  </p>
                )}
                {!dupChecking && dupResult?.duplicate && dupResult.reason === "tax_declaration_number" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700 mt-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold text-red-700 dark:text-red-400">Duplicate Tax Declaration #</p>
                      <p className="text-[10px] text-red-600 dark:text-red-500 mt-0.5">{dupResult.message}</p>
                    </div>
                  </div>
                )}
                {!dupChecking && dupResult && !dupResult.duplicate && form.tax_declaration_number.trim().length >= 2 && (
                  <p className="text-[11px] text-green-600 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="h-3 w-3" /> Tax Declaration # is available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 2b: Property Valuation ── */}
          <div>
            <SectionHeader icon={<FileText className="h-4 w-4" />} title="Property Valuation" />
            <div className="grid grid-cols-2 gap-4">
              <FInput label="Assessed Value (\u20B1)" name="assessed_value" value={form.assessed_value} placeholder="0.00" type="number" onChange={handleFieldChange} />
              <FInput label="Market Value (\u20B1)" name="market_value" value={form.market_value} placeholder="0.00" type="number" onChange={handleFieldChange} />
            </div>
          </div>

          {/* ── Section 3: Building Details (conditional) ── */}
          {isBuilding && (
            <div>
              <SectionHeader icon={<Building2 className="h-4 w-4" />} title="Building Details" />
              <div className="grid grid-cols-2 gap-4">
                <FInput label="Number of Floors" name="number_of_floors" value={form.number_of_floors} placeholder="1" type="number" onChange={handleFieldChange} />
                <FInput label="Year Constructed" name="year_constructed" value={form.year_constructed} placeholder="ex. 2020" type="number" onChange={handleFieldChange} />
                <div className="col-span-2">
                  <FInput label="Building Material" name="building_material" value={form.building_material} placeholder="ex. Concrete, Steel, Wood" onChange={handleFieldChange} />
                </div>
              </div>
            </div>
          )}

          {/* ── Section 5: Boundaries ── */}
          <div>
            <SectionHeader icon={<Compass className="h-4 w-4" />} title="Boundaries / Landmarks" />
            <div className="grid grid-cols-2 gap-4">
              <FInput label="North" name="boundary_north" value={form.boundary_north} placeholder="Landmark or neighbor" onChange={handleFieldChange} />
              <FInput label="South" name="boundary_south" value={form.boundary_south} placeholder="Landmark or neighbor" onChange={handleFieldChange} />
              <FInput label="East" name="boundary_east" value={form.boundary_east} placeholder="Landmark or neighbor" onChange={handleFieldChange} />
              <FInput label="West" name="boundary_west" value={form.boundary_west} placeholder="Landmark or neighbor" onChange={handleFieldChange} />
            </div>
          </div>

          {/* ── Section 6: Owner Information ── */}
          <div>
            <SectionHeader icon={<User className="h-4 w-4" />} title="Owner Information" />

            {/* Duplicate warning — owner+address match */}
            {!dupChecking && dupResult?.duplicate && dupResult.reason === "owner_address" && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 mb-4">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Possible duplicate detected</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">{dupResult.message}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FInput
                  label="Owner Name" name="owner_name" value={form.owner_name}
                  placeholder="ex. JUAN DELA CRUZ" required
                  error={formErrors.owner_name}
                  onChange={handleFieldChange}
                />
              </div>
              <FInput
                label="Contact No." name="owner_contact" value={form.owner_contact}
                placeholder="ex. 09XXXXXXXXX"
                error={formErrors.owner_contact}
                onChange={(name, val) => handleFieldChange(name, val.replace(/\D/g, "").slice(0, 11))}
              />
              <FInput label="Email" name="owner_email" value={form.owner_email} placeholder="ex. juan@email.com" type="email" error={formErrors.owner_email} onChange={handleFieldChange} />
              <div className="col-span-2">
                <FTextarea label="Owner Address" name="owner_address" value={form.owner_address} placeholder="Home address of owner" onChange={handleFieldChange} />
              </div>
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={closeDrawer}
            disabled={formSaving}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={formSaving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--accent-primary)" }}
          >
            {formSaving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              : drawerMode === "edit" ? "Update Record" : "Save Record"}
          </button>
        </div>
      </div>

      {/* Drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
        />
      )}

      {/* ── Clearance Gen Modal ──────────────────────────────────────────── */}
      <ClearanceGenModal
        open={clearanceOpen}
        clearanceType={clearanceType}
        record={clearanceTarget}
        settings={settings}
        templates={documentTemplates}
        officials={officials}
        processing={clearanceProcessing}
        onConfirm={handleClearanceConfirm}
        onClose={() => { setClearanceOpen(false); setClearanceTarget(null); }}
      />

      {/* ── Send SMS Modal ───────────────────────────────────────────────── */}
      <SendSmsModal
        open={showSmsModal}
        record={smsTarget}
        onClose={() => { setShowSmsModal(false); setSmsTarget(null); }}
        onSent={() => {
          addToast({ type: "success", title: "SMS Sent" });
          if (viewRecord && smsTarget && viewRecord.id === smsTarget.id) fetchViewData(viewRecord.id);
        }}
      />

      {/* ── Toasts ──────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[10001] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[320px] max-w-[420px] animate-in slide-in-from-right-5",
              t.type === "success" ? "bg-emerald-500/10 border-emerald-500/30" :
              t.type === "error" ? "bg-red-500/10 border-red-500/30" :
              "bg-amber-500/10 border-amber-500/30"
            )}
          >
            {t.type === "success"
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              : t.type === "warning"
              ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              : t.type === "info"
              ? <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground shrink-0 pointer-events-auto">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
