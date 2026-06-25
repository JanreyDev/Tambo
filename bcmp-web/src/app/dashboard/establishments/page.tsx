"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Building2, Plus, Search, Filter, MapPin, Phone, Mail, User,
  Clock, FileText, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, X, Store, Wrench, ShoppingBag, UtensilsCrossed, Pill, Wifi,
  Droplets, Scissors, Hammer, Eye, Edit, Bot, CheckCircle2,
  AlertTriangle, Loader2, ChevronDown, CalendarDays, RefreshCw, XCircle,
  BadgeCheck, Calendar, Printer, MessageSquare, Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { DocumentLivePreview } from "@/components/settings/DocumentLivePreview";
import { SendSmsModal } from "@/components/residents/SendSmsModal";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn, resolvePhotoUrl } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import type { AiStreamEvent, Establishment, ApiError, BarangaySettings, DocumentTemplate, IssueDocumentPayload } from "@/lib/types";

interface SavedCertificateDesign {
  id: string;
  isGlobal?: boolean;
  design_settings?: {
    use_global_design?: boolean;
    document_layout?: string;
    document_color_theme?: string;
    document_font?: string;
    document_design_pattern?: string;
    document_paper_size?: string;
    custom_content?: string;
  };
}

// ── Toast ─────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const businessTypeOptions = [
  "", "Sari-sari Store", "Restaurant/Eatery", "Pharmacy", "Hardware",
  "Grocery", "Salon/Barbershop", "Internet Cafe", "Repair Shop",
  "Manufacturing", "Services", "Others",
];

const statusOptions = ["All Status", "active", "inactive", "closed"];
const statusLabels: Record<string, string> = {
  "All Status": "All Status", active: "Active", inactive: "Inactive", closed: "Closed",
};
const formStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "closed", label: "Closed" },
];

const typeIcons: Record<string, React.ElementType> = {
  "Sari-sari Store": Store, "Restaurant/Eatery": UtensilsCrossed,
  "Repair Shop": Wrench, Hardware: Hammer, Pharmacy: Pill,
  Grocery: ShoppingBag, "Internet Cafe": Wifi, "Water Refilling": Droplets,
  "Salon/Barbershop": Scissors, Manufacturing: Hammer, Services: Building2,
};

// Seed entries — no fake counts, just canonical name + common aliases for fuzzy match
// Actual entries are loaded from existing establishment records on mount
const seedBusinessTypeEntries: SmartEntry[] = [
  { canonical: "Sari-sari Store", count: 0, aliases: ["sarisari", "sari sari", "tindahan"] },
  { canonical: "Restaurant/Eatery", count: 0, aliases: ["carinderia", "eatery", "restaurant", "lutuan"] },
  { canonical: "Pharmacy", count: 0, aliases: ["botika", "drug store", "drugstore"] },
  { canonical: "Hardware", count: 0, aliases: ["hardware store", "construction supply"] },
  { canonical: "Grocery", count: 0, aliases: ["grocery store", "supermarket", "tiangge"] },
  { canonical: "Salon/Barbershop", count: 0, aliases: ["salon", "barbershop", "parlor", "beauty salon"] },
  { canonical: "Internet Cafe", count: 0, aliases: ["computer shop", "net cafe", "icafe"] },
  { canonical: "Repair Shop", count: 0, aliases: ["auto repair", "vulcanizing", "mechanic", "repair"] },
  { canonical: "Water Refilling Station", count: 0, aliases: ["water station", "mineral water", "purified water"] },
  { canonical: "Laundry Shop", count: 0, aliases: ["laundry", "laundromat", "laundry service"] },
  { canonical: "Bakery", count: 0, aliases: ["panaderya", "bread shop"] },
  { canonical: "Catering Services", count: 0, aliases: ["catering", "caterer"] },
  { canonical: "Welding Shop", count: 0, aliases: ["welding", "fabrication"] },
  { canonical: "Printing Shop", count: 0, aliases: ["print shop", "printing", "tarpaulin"] },
  { canonical: "Manufacturing", count: 0, aliases: ["factory", "production"] },
  { canonical: "Services", count: 0, aliases: ["service provider", "consultant"] },
  { canonical: "Others", count: 0, aliases: ["other", "misc", "miscellaneous"] },
];

const emptyForm = {
  business_name: "", business_type: "", owner_name: "", owner_contact: "",
  owner_email: "", owner_address: "", purok: "", street: "", exact_address: "",
  registration_type: "", registration_number: "", registration_date: "",
  permit_number: "", permit_expiry: "", status: "active",
};

// ── Field Components ───────────────────────────────────────────────────────

function FInput({
  label, name, value, placeholder, required, type, error, hint, disabled, noUppercase, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  required?: boolean; type?: string; error?: string; hint?: string;
  disabled?: boolean; noUppercase?: boolean;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type || "text"}
        value={noUppercase ? value : value.toUpperCase()}
        onChange={(e) => onChange(name, noUppercase ? e.target.value : e.target.value.toUpperCase())}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring transition-all",
          error ? "ring-2 ring-red-500/50 border-red-500" : "border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {hint && !error && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FDatePicker({
  label, name, value, required, error, hint, disabled, onChange,
}: {
  label: string; name: string; value: string; required?: boolean;
  error?: string; hint?: string; disabled?: boolean;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <input
          type="date" value={value}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full pl-9 pr-3 py-2.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring transition-all",
            "[&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
            error ? "ring-2 ring-red-500/50 border-red-500" : "border-border",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
      {hint && !error && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FSelect({
  label, name, value, options, required, error, onChange,
}: {
  label: string; name: string; value: string;
  options: { value: string; label: string }[];
  required?: boolean; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value} onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-2.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring transition-all",
          error ? "ring-2 ring-red-500/50 border-red-500" : "border-border"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
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
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <textarea
        value={value.toUpperCase()}
        onChange={(e) => onChange(name, e.target.value.toUpperCase())}
        placeholder={placeholder} rows={rows || 3}
        className="w-full px-3 py-2.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none border-border transition-all"
      />
    </div>
  );
}

// ── Smart Combobox (same pattern as residents form) ───────────────────────

const addressAbbreviations: Record<string, string> = {
  "st.": "street", "st": "street", "ave.": "avenue", "ave": "avenue",
  "blvd.": "boulevard", "blvd": "boulevard", "dr.": "drive", "dr": "drive",
  "rd.": "road", "rd": "road", "ln.": "lane", "ln": "lane",
};

function normalizeStr(input: string): string {
  return input.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim()
    .split(" ").map((w) => addressAbbreviations[w] || w).join(" ");
}

function strSimilarity(a: string, b: string): number {
  const na = normalizeStr(a); const nb = normalizeStr(b);
  if (na === nb) return 1;
  const triA = new Set<string>(); const triB = new Set<string>();
  const pa = `  ${na} `; const pb = `  ${nb} `;
  for (let i = 0; i < pa.length - 2; i++) triA.add(pa.slice(i, i + 3));
  for (let i = 0; i < pb.length - 2; i++) triB.add(pb.slice(i, i + 3));
  let intersect = 0;
  triA.forEach((t) => { if (triB.has(t)) intersect++; });
  return intersect / (triA.size + triB.size - intersect);
}

interface SmartEntry { canonical: string; count: number; aliases: string[] }

function FCombobox({
  label, name, entries, required, value, onChange, onEntriesChange,
  placeholder: customPlaceholder, disabled, uppercase, error,
}: {
  label: string; name: string; entries: SmartEntry[]; required?: boolean; value: string;
  onChange: (name: string, value: string) => void;
  onEntriesChange?: React.Dispatch<React.SetStateAction<SmartEntry[]>>;
  placeholder?: string; disabled?: boolean; uppercase?: boolean; error?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const sorted = [...entries].sort((a, b) => b.count - a.count);

  const matched = trimmed
    ? sorted.map((e) => {
        const sub = e.canonical.toLowerCase().includes(trimmed.toLowerCase());
        const sim = strSimilarity(trimmed, e.canonical);
        const aliasMatch = e.aliases.some((a) => strSimilarity(trimmed, a) > 0.6);
        return { ...e, score: sub ? 1 : Math.max(sim, aliasMatch ? 0.7 : 0) };
      }).filter((e) => e.score > 0.35).sort((a, b) => b.score - a.score || b.count - a.count)
    : sorted;

  const exactMatch = entries.some((e) => normalizeStr(e.canonical) === normalizeStr(trimmed));
  const fuzzyMatch = trimmed && !exactMatch
    ? entries.find((e) => { const s = strSimilarity(trimmed, e.canonical); return s > 0.55 && s < 1; })
    : null;

  const openCombobox = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setOpen(true); setQuery("");
  };

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const submitVal = (val: string) => {
    if (onEntriesChange) {
      onEntriesChange((prev) => {
        const existing = prev.find((e) => e.canonical.toLowerCase() === val.toLowerCase());
        if (existing) return prev.map((e) => e === existing ? { ...e, count: e.count + 1 } : e);
        return [...prev, { canonical: val, count: 1, aliases: [] }];
      });
    }
  };

  const handleSelect = (val: string) => {
    submitVal(val); onChange(name, val); setQuery(""); setOpen(false);
  };

  const handleNew = () => {
    if (!trimmed) return;
    const val = uppercase ? trimmed.toUpperCase() : trimmed;
    submitVal(val); onChange(name, val); setQuery(""); setOpen(false);
  };

  const displayVal = uppercase ? value.toUpperCase() : value;

  return (
    <div ref={wrapperRef} className={cn("relative", disabled && "opacity-40 pointer-events-none")}>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger button — visually identical to Civil Status / FSelect */}
      <button
        type="button"
        disabled={disabled}
        onClick={openCombobox}
        className={cn(
          "flex items-center w-full rounded-xl glass-input px-3 py-2.5 text-sm text-left transition-all duration-200 focus:outline-none focus-visible:outline-none",
          error && !open && "ring-2 ring-red-500/50 border-red-500"
        )}
      >
        <span className={cn("flex-1 truncate uppercase", !value && "text-muted-foreground normal-case")}>
          {displayVal || customPlaceholder || "Type to search..."}
        </span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(name, ""); }}
            className="px-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 ml-1 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

      {/* Portal dropdown */}
      {open && typeof window !== "undefined" && createPortal(
        <div
          className="fixed z-[9999] rounded-xl shadow-xl bg-background border border-border overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {/* Search input lives inside the dropdown */}
          <div className="px-2 py-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={query}
              placeholder="Search..."
              onChange={(e) => setQuery(uppercase ? e.target.value.toUpperCase() : e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && trimmed) {
                  e.preventDefault();
                  if (fuzzyMatch) handleSelect(fuzzyMatch.canonical);
                  else handleNew();
                }
                if (e.key === "Escape") setOpen(false);
              }}
              className="w-full px-2 py-1.5 text-sm bg-muted/50 rounded-lg border border-border/50 outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted-foreground/60 uppercase placeholder:normal-case"
            />
          </div>

          {/* Options list */}
          <div ref={dropdownRef} className="max-h-48 overflow-y-auto">
            {fuzzyMatch && (
              <button type="button" onClick={() => handleSelect(fuzzyMatch.canonical)}
                className="w-full text-left px-3 py-2.5 text-sm bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
                <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Did you mean:</span>
                <span className="ml-1.5 font-semibold text-foreground">{fuzzyMatch.canonical}</span>
              </button>
            )}
            {matched.length === 0 && !trimmed && (
              <div className="px-3 py-2.5 text-sm text-muted-foreground italic">
                Type above to search or add a new entry.
              </div>
            )}
            {matched.length === 0 && trimmed && !fuzzyMatch && (
              <div className="px-3 py-2 text-xs text-muted-foreground italic">No matches found</div>
            )}
            {matched.map((e) => (
              <button key={e.canonical} type="button" onClick={() => handleSelect(e.canonical)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between",
                  e.canonical === value && "font-medium text-accent-text bg-accent-primary/5"
                )}>
                <span>{e.canonical}</span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">{e.count}</span>
              </button>
            ))}
            {trimmed && !exactMatch && (
              <button type="button" onClick={handleNew}
                className="w-full text-left px-3 py-2 text-sm border-t border-border text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors flex items-center gap-2 font-medium">
                <Plus className="h-4 w-4" />
                Save &ldquo;{uppercase ? trimmed.toUpperCase() : trimmed}&rdquo; as new entry
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color?: string }) {
  return (
    <div className={cn("flex items-center gap-2 pb-3 border-b mb-4", color ? `border-${color}-500/30` : "border-border")}>
      <div className={cn("p-1.5 rounded-lg", color ? `bg-${color}-500/10 text-${color}-500` : "bg-accent-bg text-accent-text")}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted/60 rounded animate-pulse" style={{ width: i === 0 ? "80%" : i === 6 ? "24px" : "60%" }} />
        </td>
      ))}
    </tr>
  );
}

// ── Action Menu Portal ────────────────────────────────────────────────────
// Renders outside the overflow-hidden table container via portal so the
// dropdown never gets clipped regardless of row position.

function ActionMenuPortal({
  menuRef, activeId, position, establishment,
  onClose, onNew, onRenewal, onClosure, onView, onEdit, onSms, onDelete,
}: {
  menuRef: React.RefObject<HTMLDivElement | null>;
  activeId: string | null;
  position: { top: number; right: number } | null;
  establishment: Establishment | null;
  settings?: any;
  onClose: () => void;
  onNew: (e: Establishment) => void;
  onRenewal: (e: Establishment) => void;
  onClosure: (e: Establishment) => void;
  onView: (e: Establishment) => void;
  onEdit: (e: Establishment) => void;
  onSms: (e: Establishment) => void;
  onDelete: (e: Establishment) => void;
}) {
  if (!activeId || !position || !establishment) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: position.top, right: position.right, zIndex: 9999 }}
      className="w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl py-1 overflow-hidden"
      onClick={(ev) => ev.stopPropagation()}
    >
      {/* Transaction section */}
      <div className="px-3 py-1.5">
        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction</p>
      </div>
      <button
        onClick={() => onNew(establishment)}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-blue-600 dark:text-blue-400 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> New
      </button>
      <button
        onClick={() => onRenewal(establishment)}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 disabled:opacity-40 transition-colors"
        disabled={establishment.status === "closed"}
      >
        <RefreshCw className="h-3.5 w-3.5" /> Renewal
      </button>
      <button
        onClick={() => onClosure(establishment)}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-amber-600 dark:text-amber-400 disabled:opacity-40 transition-colors"
        disabled={establishment.status === "closed"}
      >
        <XCircle className="h-3.5 w-3.5" /> Closure
      </button>
      <div className="border-t border-gray-200 dark:border-slate-600 my-1" />
      {/* Standard actions */}
      <button
        onClick={() => onView(establishment)}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-800 dark:text-gray-100 transition-colors"
      >
        <Eye className="h-3.5 w-3.5" /> View
      </button>
      <button
        onClick={() => onEdit(establishment)}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-800 dark:text-gray-100 transition-colors"
      >
        <Edit className="h-3.5 w-3.5" /> Edit
      </button>
      <button
        onClick={() => onSms(establishment)}
        disabled={!establishment.owner_contact}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-orange-600 dark:text-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5" /> Send SMS
      </button>
      <div className="border-t border-gray-200 dark:border-slate-600 my-1" />
      <button
        onClick={() => onDelete(establishment)}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-red-600 dark:text-red-400 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>,
    document.body
  );
}

// ── Document Generation Modal ─────────────────────────────────────────────
// Full-screen overlay: live-editable document preview + Mabini AI inline editor + single Issue & Print button

function DocGenModal({
  open, type, establishment, settings, templates, printOnly, processing, onConfirm, onClose,
}: {
  open: boolean;
  type: "new" | "renewal" | "closure";
  establishment: Establishment | null;
  settings?: BarangaySettings | null;
  templates: DocumentTemplate[];
  printOnly?: boolean;
  processing?: boolean;
  onConfirm: (data: {
    template: DocumentTemplate;
    customContent: string;
    customFieldValues: Record<string, string>;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const docRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const year = today.getFullYear();
  const dateStr = today.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const validUntilDate = new Date(today);
  const templateCategory = {
    new: "business_clearance_new",
    renewal: "business_clearance_renewal",
    closure: "business_closure",
  }[type];
  const barangayDocumentSettings = settings?.settings ?? {};
  const customCertificates = Array.isArray(barangayDocumentSettings.customized_establishment_certificates)
    ? barangayDocumentSettings.customized_establishment_certificates as SavedCertificateDesign[]
    : [];
  const categoryTemplates = templates.filter((template) => template.category === templateCategory);
  const configuredTemplate = categoryTemplates.find((template) =>
    customCertificates.some((certificate) => certificate.id === template.id)
  );
  const selectedTemplate = configuredTemplate
    ?? categoryTemplates.find((template) => template.barangay_id !== null)
    ?? categoryTemplates[0]
    ?? null;
  if (selectedTemplate?.settings?.show_expiry && selectedTemplate.settings.expiry_months) {
    validUntilDate.setMonth(validUntilDate.getMonth() + selectedTemplate.settings.expiry_months);
  }
  const validUntilStr = selectedTemplate?.settings?.show_expiry
    ? validUntilDate.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "No Expiry";
  const customConfig = customCertificates.find((certificate) => certificate.id === selectedTemplate?.id);
  const customDesignSettings = customConfig?.design_settings ?? {};
  const useGlobalDesign = customConfig
    ? (customConfig.isGlobal ?? customDesignSettings.use_global_design ?? true)
    : true;

  // ── Editable document content (Mabini can modify these) ──
  const defaultCertBody = type === "closure"
    ? `This certifies that the above-named business has ceased operations and has been officially closed as of ${dateStr}.`
    : `This certifies that the business herein described is duly registered and authorized to operate within the jurisdiction of this barangay. This permit is issued pursuant to existing barangay ordinances and shall be displayed conspicuously in the place of business.`;

  const defaultFooterNote = type === "closure"
    ? "The business premises shall be vacated and all business operations shall cease upon the issuance of this notice."
    : "This permit does not authorize the holder to violate any zoning laws, environmental regulations, or any other applicable laws.";

  const [certBody, setCertBody] = useState(defaultCertBody);
  const [footerNote, setFooterNote] = useState(defaultFooterNote);
  const [issuanceContent, setIssuanceContent] = useState("");

  const issuanceAddress = establishment
    ? [establishment.purok, establishment.street].filter(Boolean).join(", ") || establishment.exact_address || "—"
    : "";
  const issuanceFields: Record<string, string> = {
    business_name: establishment?.business_name || "",
    business_type: establishment?.business_type || "",
    nature_of_business: establishment?.business_type || "",
    owner_name: establishment?.owner_name || "",
    business_address: issuanceAddress,
    prev_permit_no: establishment?.permit_number || "",
    closure_date: dateStr,
    closure_reason: "Business closure",
    full_name: establishment?.business_name || "",
    address: issuanceAddress,
    age: "",
    civil_status: "",
    sex: "",
    purpose: type === "new" ? "New Registration" : type === "renewal" ? "Permit Renewal" : "Business Closure",
  };

  const mergeIssuanceFields = (content: string) => {
    let mergedContent = content;
    Object.entries(issuanceFields).forEach(([key, value]) => {
      mergedContent = mergedContent.split(`{{${key}}}`).join(value);
    });
    return mergedContent.replace(/\{\{[^{}]+\}\}/g, "");
  };

  // Reset editable fields when modal opens for a new type/establishment
  useEffect(() => {
    const storedContent = !useGlobalDesign && customDesignSettings.custom_content
      ? customDesignSettings.custom_content
      : `${selectedTemplate?.content || defaultCertBody}\n\n${defaultFooterNote}`;
    setCertBody(selectedTemplate?.content || defaultCertBody);
    setFooterNote(defaultFooterNote);
    setIssuanceContent(mergeIssuanceFields(storedContent));
    setMabiniInput("");
    setMabiniReply("");
    setMabiniConvId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, establishment?.id, selectedTemplate?.id, customConfig?.id]);

  // ── Mabini inline editor ──
  const [mabiniInput, setMabiniInput] = useState("");
  const [mabiniReply, setMabiniReply] = useState("");
  const [mabiniLoading, setMabiniLoading] = useState(false);
  const [mabiniConvId, setMabiniConvId] = useState<string | null>(null);
  const mabiniAbortRef = useRef<AbortController | null>(null);

  const handleMabiniSend = async () => {
    if (!mabiniInput.trim() || mabiniLoading || !establishment) return;
    setMabiniLoading(true);
    setMabiniReply("");

    const docTitle = type === "new" ? "BARANGAY BUSINESS PERMIT" : type === "renewal" ? "BUSINESS RENEWAL CERTIFICATE" : "NOTICE OF BUSINESS CLOSURE";
    const systemContext = `You are Mabini AI, helping edit a Philippine barangay official document.

DOCUMENT TYPE: ${docTitle}
ESTABLISHMENT: ${establishment.business_name} (${establishment.establishment_number})
TYPE: ${establishment.business_type || "—"}
OWNER: ${establishment.owner_name || "—"}

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
        }
      };

      if (mabiniConvId) {
        await api.ai.sendMessage(mabiniConvId, message, onEvent, ac.signal);
      } else {
        await api.ai.createConversation(message, onEvent, ac.signal);
      }

      // Parse JSON from response
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
        // If not JSON, show as plain reply — user can use it as reference
      }

      setMabiniInput("");
    } catch {
      setMabiniReply("Failed to connect to Mabini AI.");
    } finally {
      setMabiniLoading(false);
    }
  };

  if (!open || !establishment) return null;
  if (typeof document === "undefined") return null;

  const docConfig = {
    new:     { title: "BARANGAY BUSINESS PERMIT",     subtitle: "New Registration",  badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",   confirmBg: "var(--accent-primary)", confirmLabel: "Issue & Print",  icon: <Plus className="h-4 w-4" /> },
    renewal: { title: "BUSINESS RENEWAL CERTIFICATE", subtitle: "Permit Renewal",    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", confirmBg: "#059669", confirmLabel: "Process & Print", icon: <RefreshCw className="h-4 w-4" /> },
    closure: { title: "NOTICE OF BUSINESS CLOSURE",   subtitle: "Business Closure",  badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", confirmBg: "#d97706", confirmLabel: "Confirm & Print", icon: <XCircle className="h-4 w-4" /> },
  }[type];

  const handleIssuePrint = async () => {
    if (!selectedTemplate || processing) return;

    await onConfirm({
      template: selectedTemplate,
      customContent: issuanceContent,
      customFieldValues: {
        business_name: establishment.business_name || "",
        business_type: establishment.business_type || "",
        nature_of_business: establishment.business_type || "",
        owner_name: establishment.owner_name || "",
        business_address: issuanceAddress,
        prev_permit_no: establishment.permit_number || "",
        closure_date: today.toISOString().slice(0, 10),
        closure_reason: "Business closure",
        full_name: establishment.business_name || "",
        address: issuanceAddress,
        age: "",
        civil_status: "",
        sex: "",
        purpose: docConfig.subtitle,
      },
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[95vh] flex rounded-2xl overflow-hidden shadow-2xl border border-border bg-background">

        {/* ── Left: Document Preview ── */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-800/60 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar">
          {(() => {
            const docTitle = selectedTemplate?.title || docConfig.title;
            const fontVal = useGlobalDesign
              ? (barangayDocumentSettings.document_font || "times")
              : (customDesignSettings.document_font || "times");
            const pattern = useGlobalDesign
              ? (barangayDocumentSettings.document_design_pattern || "wave")
              : (customDesignSettings.document_design_pattern || "wave");
            const colors = useGlobalDesign
              ? (barangayDocumentSettings.document_color_theme || "plain")
              : (customDesignSettings.document_color_theme || "plain");
            const layout = useGlobalDesign
              ? (barangayDocumentSettings.document_layout || "klasiko")
              : (customDesignSettings.document_layout || "klasiko");
            const paperSize = useGlobalDesign
              ? (barangayDocumentSettings.document_paper_size || "a4")
              : (customDesignSettings.document_paper_size || "a4");

            return (
              <div ref={docRef} className="flex w-full justify-center shrink-0">
                <DocumentLivePreview
                  key={`${establishment.id}-${type}-${selectedTemplate?.id || "default"}`}
                  layout={layout as any}
                  paperSize={paperSize as any}
                  font={fontVal as any}
                  colorTheme={colors as any}
                  designPattern={pattern as any}
                  barangayName={settings?.name}
                  municipality={settings?.city_municipality}
                  province={settings?.province}
                  logoUrl={resolvePhotoUrl(settings?.logo_url) || undefined}
                  municipalityLogoUrl={resolvePhotoUrl(settings?.municipality_logo_url) || undefined}
                  signatoryName={barangayDocumentSettings.default_signatory_name || settings?.captain_name || "JUAN DELA CRUZ"}
                  signatoryTitle={barangayDocumentSettings.default_signatory_title || "PUNONG BARANGAY"}
                  contentTitle={docTitle}
                  contentSalutation={selectedTemplate?.salutation}
                  contentBodyHtml={issuanceContent}
                  rawContent={issuanceContent}
                  onContentChange={setIssuanceContent}
                  contentControlNo={`NO. ${establishment.establishment_number}`}
                  contentIssuedDate={dateStr}
                  contentValidUntil={validUntilStr}
                  contentRequestedBy={establishment.owner_name || establishment.business_name}
                  contentPurpose={docConfig.subtitle}
                  hideChrome={true}
                />
              </div>
            );
          })()}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Click the certificate body to edit this issuance only. The saved template will not be changed.
          </p>
        </div>
        
        {/* ── Right: Controls ── */}
        <div className="w-72 flex flex-col border-l border-border shrink-0">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Generate Document</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">{docConfig.subtitle}</p>
            </div>
            <button onClick={onClose} disabled={processing} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Document type */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Document Type</p>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0", docConfig.badge)}>
                  {docConfig.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{docConfig.subtitle}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{docConfig.title}</p>
                </div>
              </div>
            </div>

            {/* Establishment info */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Establishment</p>
              <div className="rounded-xl border border-border p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground leading-tight uppercase">{establishment.business_name}</p>
                <p className="text-[11px] font-mono text-muted-foreground">{establishment.establishment_number}</p>
                {establishment.business_type && <p className="text-[11px] text-muted-foreground">{establishment.business_type}</p>}
                {establishment.owner_name && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <User className="h-2.5 w-2.5" /> {establishment.owner_name}
                  </p>
                )}
              </div>
            </div>

            {/* Mabini AI inline editor */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bot className="h-3 w-3" /> Mabini AI — Live Edit
              </p>
              <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                {/* Reply bubble */}
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
                {/* Input area */}
                <div className="p-2 flex flex-col gap-2">
                  <textarea
                    value={mabiniInput}
                    onChange={(e) => setMabiniInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleMabiniSend(); } }}
                    placeholder="Tell Mabini what to change&#10;ex. Make the cert text more formal"
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

            {/* Date */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date Issued</p>
              <p className="text-sm text-foreground">{dateStr}</p>
            </div>
          </div>

          {/* Footer — single action button */}
          <div className="px-5 py-4 border-t border-border shrink-0 space-y-2">
            <button
              onClick={handleIssuePrint}
              disabled={processing || !selectedTemplate}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: docConfig.confirmBg }}
            >
              {processing
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                : printOnly
                  ? <><Printer className="h-4 w-4" /> Print Document</>
                  : <><Printer className="h-4 w-4" /> {docConfig.confirmLabel}</>}
            </button>
            <button
              onClick={onClose}
              disabled={processing}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 rounded-lg"
            >
              {printOnly ? "Close" : "Cancel — Do Not Process"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function EstablishmentsPage() {
  const { user } = useAuth();

  // Data
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [settings, setSettings] = useState<BarangaySettings | null>(null);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);

  useEffect(() => {
    api.settings.get().then(setSettings).catch(console.error);
    api.documentTemplates.list({ constituent_type: "establishment", is_active: true, per_page: 100 })
      .then((response) => setDocumentTemplates(response.data))
      .catch(console.error);
  }, []);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [stats, setStats] = useState<{ total: number; active: number; total_documents: number; current_year: number } | null>(null);

  // Filters / sort / pagination
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("business_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 15;

  // Drawer form
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<Establishment | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);

  // Smart combobox entries — populated from real DB records on mount
  const [businessTypeEntries, setBusinessTypeEntries] = useState<SmartEntry[]>(seedBusinessTypeEntries);
  const [purokEntries, setPurokEntries] = useState<SmartEntry[]>([]);
  const [streetEntries, setStreetEntries] = useState<SmartEntry[]>([]);

  // Modals
  const [viewEstablishment, setViewEstablishment] = useState<Establishment | null>(null);
  const [viewTransactions, setViewTransactions] = useState<Array<{
    id: string; transaction_type: string; year: number; notes: string | null; created_at: string; generated_by?: string;
  }>>([]);
  const [txLoading, setTxLoading] = useState(false);
  // SMS modal
  const [smsTarget, setSmsTarget] = useState<Establishment | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);

  // SMS history in view modal
  const [viewSmsHistory, setViewSmsHistory] = useState<Array<{
    id: string; recipient_phone: string; message: string; status: string; credit_cost: number; created_at: string;
  }>>([]);
  const [smsHistoryLoading, setSmsHistoryLoading] = useState(false);

  // Activity history in view modal
  const [viewActivity, setViewActivity] = useState<Array<{
    id: string;
    action: string;
    changes: Record<string, { from: unknown; to: unknown }> | null;
    ip_address: string | null;
    created_at: string;
    user?: { id: string; username: string; first_name: string; middle_name: string | null; last_name: string };
  }>>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Document generation modal
  const [docGenOpen, setDocGenOpen] = useState(false);
  const [docGenType, setDocGenType] = useState<"new" | "renewal" | "closure">("new");
  const [docGenTarget, setDocGenTarget] = useState<Establishment | null>(null);
  const [docGenPrintOnly, setDocGenPrintOnly] = useState(false);
  const [docGenProcessing, setDocGenProcessing] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Establishment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Closure confirmation (legacy — kept for dup-modal flow, replaced by DocGenModal elsewhere)
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dynamic type filter options loaded from DB
  const [dbTypeOptions, setDbTypeOptions] = useState<string[]>([]);


  // Real-time duplicate detection (inline form warning)
  const [dupCheckResult, setDupCheckResult] = useState<Establishment | null>(null);
  const [dupChecking, setDupChecking] = useState(false);

  // Duplicate detection modal (on submit)
  const [dupTarget, setDupTarget] = useState<Establishment | null>(null);
  const [showDupModal, setShowDupModal] = useState(false);

  // Action menu (portal-rendered to avoid overflow-hidden clipping)
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts((p) => [...p, { ...toast, id }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  // Close action menu on outside click
  useEffect(() => {
    if (!actionMenu) return;
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenu(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [actionMenu]);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.establishments.list({
        page, per_page: pageSize,
        search: search || undefined,
        type: typeFilter !== "All Types" ? typeFilter : undefined,
        status: statusFilter !== "All Status" ? statusFilter : undefined,
        sort_by: sortKey, sort_dir: sortDir,
      });
      setEstablishments(res.data);
      setTotalCount(res.total);
      setLastPage(res.last_page);
    } catch {
      addToast({ type: "error", title: "Failed to load establishments" });
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, sortKey, sortDir, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.establishments.stats();
      setStats(res);
    } catch { /* non-critical */ }
  }, []);

  // Load real puroks, streets, business types from existing DB records for comboboxes
  const fetchComboboxData = useCallback(async () => {
    try {
      const res = await api.establishments.list({ per_page: 100, sort_by: "business_name", sort_dir: "asc" });
      const all = res.data;

      // Build unique purok entries with real frequency counts
      const purokMap = new Map<string, number>();
      const streetMap = new Map<string, number>();
      const typeMap = new Map<string, number>();

      for (const e of all) {
        if (e.purok?.trim()) purokMap.set(e.purok.trim(), (purokMap.get(e.purok.trim()) ?? 0) + 1);
        if (e.street?.trim()) streetMap.set(e.street.trim(), (streetMap.get(e.street.trim()) ?? 0) + 1);
        if (e.business_type?.trim()) typeMap.set(e.business_type.trim(), (typeMap.get(e.business_type.trim()) ?? 0) + 1);
      }

      if (purokMap.size > 0) {
        setPurokEntries(
          Array.from(purokMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([canonical, count]) => ({ canonical, count, aliases: [] }))
        );
      }

      if (streetMap.size > 0) {
        setStreetEntries(
          Array.from(streetMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([canonical, count]) => ({ canonical, count, aliases: [] }))
        );
      }

      if (typeMap.size > 0) {
        // Populate filter dropdown with real types from DB (sorted by frequency)
        setDbTypeOptions(
          Array.from(typeMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([t]) => t)
        );
        // Merge real counts into seed entries, add any new types not in seed
        setBusinessTypeEntries((prev) => {
          const updated = prev.map((entry) => ({
            ...entry,
            count: typeMap.get(entry.canonical) ?? 0,
          }));
          typeMap.forEach((count, canonical) => {
            if (!updated.find((e) => e.canonical === canonical)) {
              updated.push({ canonical, count, aliases: [] });
            }
          });
          return updated.sort((a, b) => b.count - a.count);
        });
      }
    } catch { /* non-critical — comboboxes still work with seed data */ }
  }, []);

  const fetchTransactions = useCallback(async (id: string) => {
    setTxLoading(true);
    setViewTransactions([]);
    try {
      const res = await api.establishments.transactions(id);
      setViewTransactions(res.transactions);
    } catch { /* non-critical */ }
    finally { setTxLoading(false); }
  }, []);

  const fetchSmsHistory = useCallback(async (id: string) => {
    setSmsHistoryLoading(true);
    setViewSmsHistory([]);
    try {
      const res = await api.establishments.smsHistory(id);
      setViewSmsHistory(res.data ?? []);
    } catch { /* non-critical */ }
    finally { setSmsHistoryLoading(false); }
  }, []);

  const fetchActivity = useCallback(async (id: string) => {
    setActivityLoading(true);
    setViewActivity([]);
    try {
      const res = await api.establishments.activity(id);
      setViewActivity(res.data ?? []);
    } catch { /* non-critical */ }
    finally { setActivityLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchComboboxData(); }, [fetchComboboxData]);
  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);
  useEffect(() => {
    if (viewEstablishment) {
      fetchTransactions(viewEstablishment.id);
      fetchSmsHistory(viewEstablishment.id);
      fetchActivity(viewEstablishment.id);
    } else {
      setViewTransactions([]);
      setViewSmsHistory([]);
      setViewActivity([]);
    }
  }, [viewEstablishment, fetchTransactions, fetchSmsHistory, fetchActivity]);

  // ── Real-time duplicate check (create mode only, 600ms debounce) ─────────

  useEffect(() => {
    // Only run in create mode, and only when business_name is filled
    const businessName = form.business_name || "";
    const businessType = form.business_type || "";
    if (drawerMode !== "create" || !businessName.trim()) {
      setDupCheckResult(null);
      return;
    }
    setDupChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.establishments.checkDuplicate(
          businessName.trim(),
          businessType.trim() || undefined,
        );
        setDupCheckResult(res.duplicate ? (res.establishment ?? null) : null);
      } catch {
        setDupCheckResult(null);
      } finally {
        setDupChecking(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.business_name, form.business_type, drawerMode]);

  // ── Form helpers ────────────────────────────────────────────────────────

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value } as typeof emptyForm));
    if (formErrors[name]) setFormErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const businessName = form.business_name || "";
    const businessType = form.business_type || "";
    const ownerName = form.owner_name || "";
    const ownerContact = form.owner_contact || "";

    if (!businessName.trim()) errors.business_name = "Business name is required.";
    if (!businessType.trim()) errors.business_type = "Business type is required.";
    if (!ownerName.trim()) errors.owner_name = "Owner name is required.";
    if (!ownerContact.trim()) errors.owner_contact = "Contact number is required.";
    else if (ownerContact.length !== 11) errors.owner_contact = "Must be exactly 11 digits.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setFormErrors({});
    setEditTarget(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openEdit = (e: Establishment) => {
    setEditTarget(e);
    setForm({
      business_name: e.business_name,
      business_type: e.business_type || "",
      owner_name: e.owner_name || "",
      owner_contact: e.owner_contact || "",
      owner_email: e.owner_email || "",
      owner_address: e.owner_address || "",
      purok: e.purok || "",
      street: e.street || "",
      exact_address: e.exact_address || "",
      registration_type: e.registration_type || "",
      registration_number: e.registration_number || "",
      registration_date: e.registration_date || "",
      permit_number: e.permit_number || "",
      permit_expiry: e.permit_expiry || "",
      status: e.status,
    });
    setFormErrors({});
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setFormErrors({});
    setEditTarget(null);
  };

  const handleSave = async () => {
    if (formSaving) return; // prevent double-submit
    if (!validateForm()) {
      addToast({ type: "error", title: "Check Required Fields", message: "Business name, type, owner name, and contact number are required." });
      return;
    }
    setFormSaving(true);
    const businessName = (form.business_name || "").trim();
    const businessType = (form.business_type || "").trim();
    const ownerName = (form.owner_name || "").trim();
    const ownerContact = form.owner_contact || null;
    try {
      const payload = {
        business_name: businessName,
        business_type: businessType || null,
        owner_name: ownerName,
        owner_contact: ownerContact,
        owner_email: form.owner_email || null,
        owner_address: form.owner_address || null,
        purok: form.purok || null,
        street: form.street || null,
        exact_address: form.exact_address || null,
        registration_type: (form.registration_type as "DTI" | "SEC" | "") || null,
        // Clear registration details if no type selected
        registration_number: form.registration_type ? (form.registration_number || null) : null,
        registration_date: form.registration_type ? (form.registration_date || null) : null,
        permit_number: form.permit_number || null,
        permit_expiry: form.permit_expiry || null,
        status: form.status || "active",
      };
      if (drawerMode === "edit" && editTarget) {
        const updateRes = await api.establishments.update(editTarget.id, payload);
        addToast({
          type: "success",
          title: "Establishment Updated",
          message: `${businessName} has been updated successfully.`,
        });
        // Auto-SMS — fire and forget; only if owner has a contact number
        if (updateRes.establishment?.owner_contact) {
          const estNum = updateRes.establishment.establishment_number;
          api.establishments.sendSms(
            editTarget.id,
            `Your business establishment "${businessName}" (${estNum}) has been updated in our barangay records. For inquiries, please visit the barangay hall.`,
          ).then(() => {
            addToast({ type: "info", title: "SMS Sent", message: `Update notification sent to ${updateRes.establishment.owner_contact}.` });
          }).catch(() => { /* non-critical — save already succeeded */ });
        }
      } else {
        // Duplicate check via dedicated endpoint (real-time check may already have caught it,
        // but re-check on submit as the final gate to prevent any race condition)
        const dupCheck = await api.establishments.checkDuplicate(
          businessName,
          businessType || undefined,
        );
        if (dupCheck.duplicate && dupCheck.establishment) {
          setDupTarget(dupCheck.establishment);
          setShowDupModal(true);
          setDupCheckResult(dupCheck.establishment);
          setFormSaving(false);
          return;
        }

        const res = await api.establishments.create(payload);
        addToast({
          type: "success",
          title: "Establishment Registered",
          message: `${businessName} registered as ${res.establishment.establishment_number}.`,
        });
        // Auto-SMS — fire and forget; only if owner has a contact number
        if (res.establishment?.owner_contact) {
          const estNum = res.establishment.establishment_number;
          api.establishments.sendSms(
            res.establishment.id,
            `Your business "${businessName}" (${estNum}) has been successfully registered with the barangay. Please keep this for your records.`,
          ).then(() => {
            addToast({ type: "info", title: "SMS Sent", message: `Registration confirmation sent to ${res.establishment.owner_contact}.` });
          }).catch(() => { /* non-critical — save already succeeded */ });
        }
        closeDrawer();
        fetchList();
        fetchStats();
        // Open DocGenModal to print the new business permit (print-only — transaction already created)
        setDocGenTarget(res.establishment);
        setDocGenType("new");
        setDocGenPrintOnly(true);
        setDocGenOpen(true);
        return; // skip the closeDrawer/fetchList below
      }
      closeDrawer();
      fetchList();
      fetchStats();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? (v[0] ?? "") : String(v); });
        setFormErrors(mapped);
        addToast({ type: "error", title: "Please Fix the Errors", message: "Some fields have invalid values." });
      } else {
        addToast({
          type: "error",
          title: "Save Failed",
          message: apiErr.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setFormSaving(false);
    }
  };


  // Open DocGenModal for renewal (replaces direct API call + old confirm modal)
  const handleRenewal = (e: Establishment) => {
    setDocGenTarget(e);
    setDocGenType("renewal");
    setDocGenPrintOnly(false);
    setDocGenOpen(true);
    setActionMenu(null);
    setMenuPosition(null);
  };

  // Open DocGenModal for closure
  const handleClosure = (e: Establishment) => {
    setDocGenTarget(e);
    setDocGenType("closure");
    setDocGenPrintOnly(false);
    setDocGenOpen(true);
    setActionMenu(null);
    setMenuPosition(null);
  };

  // Open DocGenModal for issuing/re-issuing permit on an existing establishment
  const handleNewPermit = (e: Establishment) => {
    setDocGenTarget(e);
    setDocGenType("new");
    setDocGenPrintOnly(false);
    setDocGenOpen(true);
    setActionMenu(null);
    setMenuPosition(null);
  };

  // Confirm & process the transaction shown in DocGenModal
  const handleDocGenConfirm = async ({
    template,
    customContent,
    customFieldValues,
  }: {
    template: DocumentTemplate;
    customContent: string;
    customFieldValues: Record<string, string>;
  }) => {
    if (!docGenTarget || docGenProcessing) return;
    setDocGenProcessing(true);
    try {
      const issuedDate = new Date();
      const payload: IssueDocumentPayload = {
        template_id: template.id,
        constituent_type: "establishment",
        constituent_id: docGenTarget.id,
        issued_date: issuedDate.toISOString().split("T")[0],
        custom_field_values: customFieldValues,
        custom_content: customContent,
      };

      if (template.settings?.show_expiry && template.settings.expiry_months) {
        issuedDate.setMonth(issuedDate.getMonth() + template.settings.expiry_months);
        payload.valid_until = issuedDate.toISOString().split("T")[0];
      }

      const result = await api.issuedDocuments.create(payload);

      if (docGenType === "new") {
        if (!docGenPrintOnly) await api.establishments.permit(docGenTarget.id);
        addToast({ type: "success", title: "Permit Issued", message: `Business permit issued for ${docGenTarget.business_name}.` });
      } else if (docGenType === "renewal") {
        await api.establishments.renew(docGenTarget.id);
        addToast({ type: "success", title: "Renewal Processed", message: `${docGenTarget.business_name} renewed for ${new Date().getFullYear()}.` });
      } else if (docGenType === "closure") {
        await api.establishments.close(docGenTarget.id);
        addToast({ type: "success", title: "Closure Processed", message: `${docGenTarget.business_name} has been marked as closed.` });
      }
      setDocGenOpen(false);
      setDocGenTarget(null);
      window.open(`/api/v1/issued-documents/${result.issued_document.id}/pdf`, "_blank");
      fetchList();
      fetchStats();
      // Refresh history if view modal is open for this establishment
      if (viewEstablishment?.id === docGenTarget.id) {
        fetchTransactions(docGenTarget.id);
        fetchActivity(docGenTarget.id);
      }
    } catch (err) {
      addToast({ type: "error", title: "Processing Failed", message: (err as ApiError).message || "Something went wrong." });
    } finally {
      setDocGenProcessing(false);
    }
  };


  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.establishments.delete(deleteTarget.id);
      addToast({ type: "success", title: "Deleted", message: "Establishment deleted successfully." });
      setDeleteTarget(null);
      fetchList();
      fetchStats();
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message || "Failed to delete establishment." });
    } finally {
      setDeleteLoading(false);
    }
  };


  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const isPermitExpiringSoon = (v: string | null) => {
    if (!v) return false;
    const diff = (new Date(v).getTime() - Date.now()) / 86400000;
    return diff <= 90 && diff > 0;
  };
  const isPermitExpired = (v: string | null) => !!v && new Date(v) < new Date();

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" onClick={() => { setActionMenu(null); setMenuPosition(null); }}>
      <PageHeader
        title="Establishments"
        description="Manage registered businesses and commercial establishments"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Records" },
          { label: "Establishments" },
        ]}
      />

      {/* Mabini AI Insight */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-bg/30 border border-accent-primary/20">
        <Bot className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <p className="text-[11px] text-muted-foreground flex-1">
          <span className="font-semibold text-foreground">Mabini:</span>{" "}
          {stats
            ? `${stats.total} total establishment${stats.total !== 1 ? "s" : ""} on record. ${stats.active} active ${stats.current_year === new Date().getFullYear() ? `in ${stats.current_year}` : `(${stats.current_year})`} (new + renewed). ${stats.total_documents} document${stats.total_documents !== 1 ? "s" : ""} generated.`
            : "Loading establishment insights..."}
        </p>
        <MabiniButton pageContext="You are on the Establishments page. This page manages business establishments and permits in the barangay." />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Establishments"
          value={stats?.total ?? 0}
          subtitle="All statuses, all years"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Active Businesses"
          value={stats?.active ?? 0}
          subtitle={stats ? `New + Renewed in ${stats.current_year}` : "New + Renewed this year"}
          icon={<Store className="h-5 w-5" />}
        />
        <StatCard
          label="Total Documents Generated"
          value={stats?.total_documents ?? 0}
          subtitle="New + Renewal + Closure"
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Toolbar — search flex-1, buttons on right */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Search — takes all remaining space */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, number, or owner..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring transition-all"
            />
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Filter */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "relative inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all",
                showFilters
                  ? "border-accent-primary bg-accent-bg text-accent-text shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Filters"
            >
              <Filter className="h-4 w-4" />
              {(typeFilter !== "All Types" || statusFilter !== "All Status") && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-primary" />
              )}
            </button>
            {/* New Establishment */}
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              style={{ background: "var(--accent-primary)" }}
            >
              <Plus className="h-4 w-4" /> New Establishment
            </button>
          </div>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 px-1 py-3 rounded-xl glass-subtle border border-border">
            <span className="text-[11px] font-medium text-muted-foreground px-2">Filters:</span>
            {/* Type filter — uses real types from DB */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg glass-input focus:outline-none focus:ring-1 focus:ring-accent-ring border-border"
            >
              <option value="All Types">All Types</option>
              {dbTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg glass-input focus:outline-none focus:ring-1 focus:ring-accent-ring border-border"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{statusLabels[s] ?? s}</option>
              ))}
            </select>
            {(typeFilter !== "All Types" || statusFilter !== "All Status") && (
              <button
                onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Establishment" field="business_name" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Type" field="business_type" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registration</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Status" field="status" />
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(15)].map((_, i) => <SkeletonRow key={i} />)
              ) : establishments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No establishments found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {search || typeFilter !== "All Types" || statusFilter !== "All Status"
                            ? "Try adjusting your search or filters."
                            : "Register your first business establishment to get started."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                establishments.map((e) => {
                  const TypeIcon = typeIcons[e.business_type || ""] || Building2;
                  const isActioning = actionLoading === e.id;
                  const addressParts = [e.purok, e.street].filter(Boolean);
                  const registeredYear = e.created_at ? new Date(e.created_at).getFullYear() : null;
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setViewEstablishment(e)}
                    >
                      {/* Establishment */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center shrink-0">
                            <TypeIcon className="h-4 w-4 text-accent-text" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate leading-tight">{e.business_name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{e.establishment_number}</p>
                            {registeredYear && (
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5" /> Reg. {registeredYear}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Business Type */}
                      <td className="px-4 py-3">
                        {e.business_type
                          ? <Badge variant="info">{e.business_type}</Badge>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </td>

                      {/* Address */}
                      <td className="px-4 py-3">
                        {addressParts.length > 0 ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-sm text-foreground">{addressParts[0]}</span>
                            </div>
                            {addressParts[1] && <p className="text-[11px] text-muted-foreground mt-0.5 pl-4">{addressParts[1]}</p>}
                            {e.exact_address && !addressParts.length && (
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{e.exact_address}</p>
                            )}
                          </div>
                        ) : e.exact_address ? (
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{e.exact_address}</p>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground leading-tight">{e.owner_name || "—"}</p>
                        {e.owner_contact && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" /> {e.owner_contact}
                          </p>
                        )}
                        {e.owner_email && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">{e.owner_email}</p>
                        )}
                      </td>

                      {/* Registration */}
                      <td className="px-4 py-3">
                        {e.registration_type ? (
                          <div>
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold",
                              e.registration_type === "DTI"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            )}>
                              <BadgeCheck className="h-3 w-3" />
                              {e.registration_type}
                            </span>
                            {e.registration_number && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{e.registration_number}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60">Not registered</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (actionMenu === e.id) {
                              setActionMenu(null);
                              setMenuPosition(null);
                            } else {
                              const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setActionMenu(e.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-muted"
                          disabled={isActioning}
                        >
                          {isActioning
                            ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                            : <MoreHorizontal className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-3 py-1 text-sm font-medium">{page} / {lastPage}</span>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setPage(lastPage)} disabled={page >= lastPage} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Menu Portal (renders at document.body to avoid overflow-hidden clipping) ── */}
      <ActionMenuPortal
        menuRef={menuRef}
        activeId={actionMenu}
        position={menuPosition}
        establishment={establishments.find((e) => e.id === actionMenu) ?? null}
        onClose={() => { setActionMenu(null); setMenuPosition(null); }}
        onNew={(e) => { handleNewPermit(e); }}
        onRenewal={(e) => { handleRenewal(e); }}
        onClosure={(e) => { handleClosure(e); }}
        onView={(e) => { setViewEstablishment(e); setActionMenu(null); setMenuPosition(null); }}
        onEdit={(e) => { openEdit(e); setActionMenu(null); setMenuPosition(null); }}
        onSms={(e) => { setSmsTarget(e); setShowSmsModal(true); setActionMenu(null); setMenuPosition(null); }}
        onDelete={(e) => { setDeleteTarget(e); setActionMenu(null); setMenuPosition(null); }}
      />

      {/* ── View Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!viewEstablishment}
        onClose={() => setViewEstablishment(null)}
        title=""
        size="xl"
        hideCloseButton
        footer={
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => setViewEstablishment(null)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
            <div className="flex-1" />
            <button
              onClick={() => {
                if (viewEstablishment) { openEdit(viewEstablishment); setViewEstablishment(null); }
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-accent-primary hover:bg-accent-hover text-white transition-colors"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Establishment
            </button>
          </div>
        }
      >
        {viewEstablishment && (
          <div>
            {/* ── Hero header ── */}
            <div className="flex items-start gap-4 pb-5 mb-5 border-b border-border">
              <div className="w-14 h-14 rounded-2xl bg-accent-bg flex items-center justify-center shrink-0">
                {(() => { const Icon = typeIcons[viewEstablishment.business_type || ""] || Building2; return <Icon className="h-7 w-7 text-accent-text" />; })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-lg font-bold text-foreground leading-tight">{viewEstablishment.business_name}</h2>
                  <StatusBadge status={viewEstablishment.status} />
                </div>
                <p className="text-[11px] font-mono text-muted-foreground mb-1.5">{viewEstablishment.establishment_number}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {viewEstablishment.business_type && (
                    <Badge variant="info">{viewEstablishment.business_type}</Badge>
                  )}
                  {viewEstablishment.registration_type && (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold",
                      viewEstablishment.registration_type === "DTI"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    )}>
                      <BadgeCheck className="h-3 w-3" /> {viewEstablishment.registration_type}
                    </span>
                  )}
                  {viewEstablishment.created_at && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Registered {new Date(viewEstablishment.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewEstablishment(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Info cards ── */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Business info card */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" /> Business Info
                </p>
                {viewEstablishment.business_type && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Type</p>
                    <p className="text-sm font-medium text-foreground">{viewEstablishment.business_type}</p>
                  </div>
                )}
                {(viewEstablishment.purok || viewEstablishment.street || viewEstablishment.exact_address) && (
                  <div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> Address</p>
                    <p className="text-sm text-foreground">
                      {[viewEstablishment.purok, viewEstablishment.street].filter(Boolean).join(", ") || viewEstablishment.exact_address}
                    </p>
                  </div>
                )}
                {viewEstablishment.exact_address && (viewEstablishment.purok || viewEstablishment.street) && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Full Address</p>
                    <p className="text-xs text-muted-foreground">{viewEstablishment.exact_address}</p>
                  </div>
                )}
              </div>

              {/* Owner info card */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Owner Information
                </p>
                <div>
                  <p className="text-[10px] text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-foreground">{viewEstablishment.owner_name || "—"}</p>
                </div>
                {viewEstablishment.owner_contact && (
                  <div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> Contact</p>
                    <p className="text-sm text-foreground">{viewEstablishment.owner_contact}</p>
                  </div>
                )}
                {viewEstablishment.owner_email && (
                  <div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> Email</p>
                    <p className="text-sm text-foreground">{viewEstablishment.owner_email}</p>
                  </div>
                )}
                {viewEstablishment.owner_address && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Owner Address</p>
                    <p className="text-xs text-muted-foreground">{viewEstablishment.owner_address}</p>
                  </div>
                )}
              </div>

              {/* Permit & Registration */}
              {(viewEstablishment.registration_type || viewEstablishment.permit_number || viewEstablishment.permit_expiry) && (
                <div className="col-span-2 rounded-xl border border-border p-4 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Permit & Registration
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {viewEstablishment.registration_type && (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Registration Type</p>
                        <p className="text-sm font-semibold" style={{ color: viewEstablishment.registration_type === "DTI" ? "#2563eb" : "#7c3aed" }}>{viewEstablishment.registration_type}</p>
                      </div>
                    )}
                    {viewEstablishment.registration_number && (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Registration No.</p>
                        <p className="text-sm font-mono text-foreground">{viewEstablishment.registration_number}</p>
                      </div>
                    )}
                    {viewEstablishment.registration_date && (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Date of Registration</p>
                        <p className="text-sm text-foreground">{new Date(viewEstablishment.registration_date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
                      </div>
                    )}
                    {viewEstablishment.permit_number && (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Permit No.</p>
                        <p className="text-sm font-mono text-foreground">{viewEstablishment.permit_number}</p>
                      </div>
                    )}
                    {viewEstablishment.permit_expiry && (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Permit Expiry</p>
                        <p className={cn("text-sm font-medium", isPermitExpired(viewEstablishment.permit_expiry) ? "text-red-600" : isPermitExpiringSoon(viewEstablishment.permit_expiry) ? "text-amber-600" : "text-foreground")}>
                          {new Date(viewEstablishment.permit_expiry).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                          {isPermitExpired(viewEstablishment.permit_expiry) && " — Expired"}
                          {isPermitExpiringSoon(viewEstablishment.permit_expiry) && " — Expiring Soon"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Documents History ── */}
            <div className="rounded-xl border border-border overflow-hidden mb-4">
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Documents History
                </p>
                {txLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
              {txLoading ? (
                <div className="px-4 py-6 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : viewTransactions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No transaction history yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {viewTransactions.map((tx) => {
                    const txConfig = {
                      new:     { label: "New Registration", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",     icon: <Plus className="h-3 w-3" />,     dot: "bg-blue-500" },
                      renewal: { label: "Renewal",          badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <RefreshCw className="h-3 w-3" />, dot: "bg-emerald-500" },
                      closure: { label: "Closure",          badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",  icon: <XCircle className="h-3 w-3" />,  dot: "bg-amber-500" },
                    }[tx.transaction_type] ?? {
                      label: tx.transaction_type,
                      badge: "bg-muted text-muted-foreground",
                      icon: <FileText className="h-3 w-3" />,
                      dot: "bg-muted-foreground",
                    };
                    return (
                      <div key={tx.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                        {/* Dot */}
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", txConfig.dot)} />
                        {/* Type badge */}
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0", txConfig.badge)}>
                          {txConfig.icon} {txConfig.label}
                        </span>
                        {/* Year */}
                        <span className="text-xs font-semibold text-muted-foreground shrink-0">{tx.year}</span>
                        {/* Generated by */}
                        <div className="flex-1 min-w-0">
                          {tx.generated_by && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <User className="h-2.5 w-2.5 shrink-0" /> {tx.generated_by}
                            </p>
                          )}
                        </div>
                        {/* Date + time */}
                        <div className="text-right shrink-0">
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            {new Date(tx.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SMS History ── */}
            <div className="rounded-xl border border-border overflow-hidden mb-4">
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> SMS History
                </p>
                {smsHistoryLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
              {smsHistoryLoading ? (
                <div className="px-4 py-6 space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : viewSmsHistory.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No SMS messages sent yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {viewSmsHistory.map((sms) => (
                    <div key={sms.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                      {/* Status dot */}
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", sms.status === "sent" ? "bg-emerald-500" : "bg-red-500")} />
                      {/* Status badge */}
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0",
                        sms.status === "sent"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {sms.status === "sent" ? "Sent" : "Failed"}
                      </span>
                      {/* Recipient */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                          {sms.recipient_phone}
                        </p>
                      </div>
                      {/* Cost */}
                      <span className="text-[11px] text-muted-foreground shrink-0">₱{Number(sms.credit_cost).toFixed(2)}</span>
                      {/* Date + time */}
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(sms.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {new Date(sms.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Activity History ── */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Activity History
                </p>
                {activityLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
              {activityLoading ? (
                <div className="px-4 py-6 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : viewActivity.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {viewActivity.map((log) => {
                    const actionConfig: Record<string, { label: string; dot: string; badge: string }> = {
                      created:       { label: "Registered",      dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                      updated:       { label: "Updated",         dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                      renewed:       { label: "Renewed",         dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
                      closed:        { label: "Closed",          dot: "bg-slate-500",   badge: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300" },
                      permit_issued: { label: "Permit Issued",   dot: "bg-violet-500",  badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
                      deleted:       { label: "Deleted",         dot: "bg-red-500",     badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                    };
                    const cfg = actionConfig[log.action] ?? { label: log.action, dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground" };
                    const actorName = log.user
                      ? `${log.user.first_name}${log.user.middle_name ? ` ${log.user.middle_name}` : ""} ${log.user.last_name}`.trim()
                      : "System";
                    const changeKeys = log.changes ? Object.keys(log.changes) : [];
                    return (
                      <div key={log.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", cfg.dot)} />
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0", cfg.badge)}>
                            {cfg.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <User className="h-2.5 w-2.5 shrink-0" /> {actorName}
                              {log.user?.username && (
                                <span className="font-mono text-[10px] opacity-60">(@{log.user.username})</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(log.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">
                              {new Date(log.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        {changeKeys.length > 0 && (
                          <div className="mt-1.5 ml-5 flex flex-wrap gap-1">
                            {changeKeys.slice(0, 4).map((field) => (
                              <span key={field} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                {field.replace(/_/g, " ")}
                              </span>
                            ))}
                            {changeKeys.length > 4 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                +{changeKeys.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Doc Generation Modal ──────────────────────────────────────── */}
      <DocGenModal
        open={docGenOpen}
        type={docGenType}
        establishment={docGenTarget}
        settings={settings}
        templates={documentTemplates}
        printOnly={docGenPrintOnly}
        processing={docGenProcessing}
        onConfirm={handleDocGenConfirm}
        onClose={() => { setDocGenOpen(false); setDocGenTarget(null); }}
      />

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Establishment"
        size="md"
      >
        <div className="flex items-center gap-4 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl mb-6">
          <AlertTriangle className="h-8 w-8 shrink-0" />
          <p className="text-sm font-medium">
            Are you sure you want to delete <strong>{deleteTarget?.business_name}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleteLoading} className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2">
            {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Establishment
          </button>
        </div>
      </Modal>

      {/* ── SMS Modal ─────────────────────────────────────────────────── */}
      <SendSmsModal
        open={showSmsModal}
        onClose={() => { setShowSmsModal(false); setSmsTarget(null); }}
        resident={smsTarget ? {
          id: smsTarget.id,
          name: `${smsTarget.business_name}${smsTarget.owner_name ? ` (${smsTarget.owner_name})` : ""}`,
          mobile_number: smsTarget.owner_contact ?? null,
        } : null}
        creditBalance={user?.barangay?.sms_credit_balance != null ? parseFloat(String(user.barangay.sms_credit_balance)) : null}
        sendFn={api.establishments.sendSms}
      />

      {/* ── Duplicate Detection Modal ──────────────────────────────────── */}
      <Modal
        open={showDupModal}
        onClose={() => { setShowDupModal(false); setDupTarget(null); }}
        title="Existing Record Found"
        description="A business with the same name and type is already registered."
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowDupModal(false); setDupTarget(null); }}>
              Cancel
            </ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => {
                if (dupTarget) {
                  const target = dupTarget;
                  setShowDupModal(false); setDupTarget(null); closeDrawer();
                  handleRenewal(target);
                }
              }}
              disabled={dupTarget?.status === "closed"}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Renew
            </ModalButton>
            <ModalButton
              variant="secondary"
              onClick={() => {
                if (dupTarget) {
                  const target = dupTarget;
                  setShowDupModal(false); setDupTarget(null); closeDrawer();
                  handleClosure(target);
                }
              }}
              disabled={dupTarget?.status === "closed"}
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Close Business
            </ModalButton>
          </>
        }
      >
        {dupTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Instead of creating a duplicate, you can <strong>renew</strong> the existing permit or <strong>close</strong> the business if it has shut down.
              </p>
            </div>
            {/* Existing record snapshot */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-bg flex items-center justify-center shrink-0">
                  {(() => { const Icon = typeIcons[dupTarget.business_type || ""] || Building2; return <Icon className="h-5 w-5 text-accent-text" />; })()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{dupTarget.business_name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{dupTarget.establishment_number}</p>
                </div>
                <div className="ml-auto"><StatusBadge status={dupTarget.status} /></div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                {dupTarget.business_type && (
                  <div><span className="text-muted-foreground">Type: </span><span className="font-medium">{dupTarget.business_type}</span></div>
                )}
                {dupTarget.owner_name && (
                  <div><span className="text-muted-foreground">Owner: </span><span className="font-medium">{dupTarget.owner_name}</span></div>
                )}
                {[dupTarget.purok, dupTarget.street].filter(Boolean).length > 0 && (
                  <div className="col-span-2"><span className="text-muted-foreground">Address: </span><span className="font-medium">{[dupTarget.purok, dupTarget.street].filter(Boolean).join(", ")}</span></div>
                )}
                {dupTarget.registration_type && (
                  <div><span className="text-muted-foreground">Registration: </span><span className={cn("font-semibold", dupTarget.registration_type === "DTI" ? "text-blue-600" : "text-purple-600")}>{dupTarget.registration_type}</span></div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Drawer ───────────────────────────────────────── */}
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm"
        />
      )}
      {/* Drawer panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full z-[9991] w-full max-w-xl bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {drawerMode === "edit" ? "Edit Establishment" : "Register Establishment"}
            </h2>
            {drawerMode === "edit" && editTarget && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{editTarget.establishment_number}</p>
            )}
          </div>
          <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* Section 1: Business Information */}
          <div>
            <SectionHeader icon={<Building2 className="h-4 w-4" />} title="Business Information" />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FInput
                  label="Business Name" name="business_name" value={form.business_name}
                  placeholder="ex. JUAN SARI-SARI STORE"
                  required error={formErrors.business_name}
                  onChange={handleFieldChange}
                />
              </div>
              <div className="col-span-2">
                <FCombobox
                  label="Business Type" name="business_type" value={form.business_type}
                  entries={businessTypeEntries}
                  onEntriesChange={setBusinessTypeEntries}
                  placeholder="ex. Sari-sari Store, Pharmacy..."
                  required
                  uppercase
                  error={formErrors.business_type}
                  onChange={handleFieldChange}
                />
              </div>

              {/* Real-time duplicate warning */}
              {drawerMode === "create" && (dupChecking || dupCheckResult) && (
                <div className="col-span-2">
                  {dupChecking ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-xs">
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      <span>Checking for duplicates...</span>
                    </div>
                  ) : dupCheckResult ? (
                    <div className="rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-950/40 overflow-hidden">
                      {/* Header strip */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/50 border-b border-amber-300/50">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide flex-1">
                          Duplicate record found — saving is blocked
                        </p>
                        <button
                          type="button"
                          onClick={() => setViewEstablishment(dupCheckResult)}
                          className="shrink-0 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline underline-offset-2 transition-colors"
                        >
                          View Record
                        </button>
                      </div>
                      {/* Record info */}
                      <div className="px-3 py-2.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-200/70 dark:bg-amber-800/50 flex items-center justify-center shrink-0">
                          {(() => { const Icon = typeIcons[dupCheckResult.business_type || ""] || Building2; return <Icon className="h-4 w-4 text-amber-700 dark:text-amber-300" />; })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase leading-tight truncate">
                            {dupCheckResult.business_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                              {dupCheckResult.establishment_number}
                            </span>
                            {dupCheckResult.business_type && (
                              <span className="text-[10px] text-amber-500 dark:text-amber-500">
                                &middot; {dupCheckResult.business_type}
                              </span>
                            )}
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                              dupCheckResult.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                : dupCheckResult.status === "closed"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {dupCheckResult.status.charAt(0).toUpperCase() + dupCheckResult.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Business Address */}
          <div>
            <SectionHeader icon={<MapPin className="h-4 w-4" />} title="Business Address" />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FTextarea
                  label="Business Address" name="exact_address" value={form.exact_address}
                  placeholder="ex. #10 Aguinaldo St., East Tapinac, Olongapo City"
                  rows={2} onChange={handleFieldChange}
                />
              </div>
              <FCombobox
                label="Purok / Sitio" name="purok" value={form.purok}
                entries={purokEntries} onEntriesChange={setPurokEntries}
                placeholder="ex. Purok Sampaguita"
                uppercase
                onChange={handleFieldChange}
              />
              <FCombobox
                label="Street / Road" name="street" value={form.street}
                entries={streetEntries} onEntriesChange={setStreetEntries}
                placeholder="ex. Rizal Street"
                uppercase
                onChange={handleFieldChange}
              />
            </div>
          </div>

          {/* Section 3: Owner Information */}
          <div>
            <SectionHeader icon={<User className="h-4 w-4" />} title="Owner Information" />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FInput
                  label="Complete Name" name="owner_name" value={form.owner_name}
                  placeholder="ex. JUAN DELA CRUZ"
                  required error={formErrors.owner_name}
                  onChange={handleFieldChange}
                />
              </div>
              <div>
                <FInput
                  label="Contact No." name="owner_contact" value={form.owner_contact}
                  placeholder="ex. 09XXXXXXXXX"
                  required
                  noUppercase
                  error={formErrors.owner_contact}
                  onChange={(name, val) => handleFieldChange(name, val.replace(/\D/g, "").slice(0, 11))}
                />
              </div>
              <FInput
                label="E-mail Address" name="owner_email" value={form.owner_email}
                placeholder="ex. juan@email.com"
                noUppercase
                onChange={handleFieldChange}
              />
              <div className="col-span-2">
                <FInput label="Owner Address" name="owner_address" value={form.owner_address} placeholder="ex. #10 Aguinaldo St., Olongapo City" onChange={handleFieldChange} />
              </div>
            </div>
          </div>

          {/* Section 4: Permit & Registration */}
          <div>
            <SectionHeader icon={<FileText className="h-4 w-4" />} title="Permit & Registration" />

            {/* Registration type cards */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Registration Type <span className="normal-case font-normal opacity-60">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["DTI", "SEC"] as const).map((opt) => {
                  const selected = form.registration_type === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleFieldChange("registration_type", selected ? "" : opt)}
                      className={cn(
                        "relative flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200",
                        selected
                          ? "border-accent-primary/60 bg-accent-bg shadow-sm"
                          : "border-border hover:border-accent-primary/30 hover:bg-muted/40"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all",
                        selected ? "bg-accent-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {opt}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-semibold leading-tight", selected ? "text-accent-text" : "text-foreground")}>
                          {opt === "DTI" ? "DTI" : "SEC"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                          {opt === "DTI" ? "Sole proprietorship / trade name" : "Corporation / partnership"}
                        </p>
                      </div>
                      {selected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-accent-primary flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Registration details — only shown when type is selected */}
            {form.registration_type && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/60">
                <div className="col-span-2">
                  <FInput
                    label={`${form.registration_type} Registration Number`}
                    name="registration_number" value={form.registration_number}
                    placeholder={form.registration_type === "SEC" ? "CS-XXXX-XXXXXX" : "DTI-NCR-XXXX-XXXXXX"}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="col-span-2">
                  <FDatePicker
                    label="Date of Registration"
                    name="registration_date" value={form.registration_date}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Drawer footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={closeDrawer} disabled={formSaving}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={formSaving || (drawerMode === "create" && !!dupCheckResult)}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition-all disabled:cursor-not-allowed",
              drawerMode === "create" && dupCheckResult
                ? "bg-amber-400/60 opacity-70 dark:bg-amber-700/40"
                : "hover:opacity-90 disabled:opacity-60"
            )}
            style={drawerMode === "create" && dupCheckResult ? {} : { background: "var(--accent-primary)" }}
            title={drawerMode === "create" && dupCheckResult ? "Duplicate record found — resolve before saving" : undefined}
          >
            {formSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : drawerMode === "create" && dupCheckResult ? (
              <><AlertTriangle className="h-4 w-4" /> Duplicate Found</>
            ) : drawerMode === "edit" ? (
              "Update Establishment"
            ) : (
              "Save Establishment"
            )}
          </button>
        </div>
      </div>

      {/* ── Toasts ────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[10001] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[320px] max-w-[420px] animate-in slide-in-from-right pointer-events-auto",
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30" :
              toast.type === "error" ? "bg-red-500/10 border-red-500/30" :
              toast.type === "warning" ? "bg-amber-500/10 border-amber-500/30" :
              "bg-blue-500/10 border-blue-500/30"
            )}
          >
            <div className={cn("w-5 h-5 flex items-center justify-center shrink-0 mt-0.5",
              toast.type === "success" ? "text-emerald-500" : toast.type === "error" ? "text-red-500" :
              toast.type === "warning" ? "text-amber-500" : "text-blue-500"
            )}>
              {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
               toast.type === "error" ? <X className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              {toast.message && <p className="text-xs text-muted-foreground mt-0.5">{toast.message}</p>}
            </div>
            <button onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── View Modal Item ────────────────────────────────────────────────────────

function ViewItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
