"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Home, MapPin, Filter, Upload, MoreHorizontal,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Flag,
  AlertTriangle, Phone, Mail, Calendar, User, Heart, FileText, Edit,
  Camera, Printer, Eye, TrendingUp, ChevronDown, Plus, Fingerprint, CheckCircle, Loader2,
  GraduationCap, Briefcase, Contact, Globe,
  IdCard, Vote, MessageSquare, ScrollText, Archive,
  PawPrint, HandHeart, Link2, Paperclip, Image, Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Modal, ModalButton } from "@/components/ui/modal";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn, resolvePhotoUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { ApiError, DashboardStats, DuplicateMatch, ResidentSummary, ResidentDetail, PaginatedResponse } from "@/lib/types";
import { MabiniButton } from "@/components/ui/mabini-button";
import ResidentPinMap from "@/components/map/resident-pin-map-dynamic";
import { GenerateDocumentWizard } from "@/components/documents/GenerateDocumentWizard";
import { GenerateIdModal } from "@/components/documents/GenerateIdModal";
import { SendSmsModal, type SmsTargetResident } from "@/components/residents/SendSmsModal";


// Mock learned address entries -- in production, fetched from barangay_address_entries API
// The system learns these over time from clerk input (no manual Settings config needed)
const defaultPurokEntries: SmartEntry[] = [
  { canonical: "Sampaguita", count: 89, aliases: ["sampaguita", "sampagita"] },
  { canonical: "Rosal", count: 67, aliases: ["rosal"] },
  { canonical: "Ilang-Ilang", count: 54, aliases: ["ilang ilang", "ylang ylang"] },
  { canonical: "Dahlia", count: 41, aliases: ["dahlia"] },
  { canonical: "Sunflower", count: 38, aliases: ["sun flower"] },
  { canonical: "Orchid", count: 25, aliases: ["orchid"] },
  { canonical: "Jasmine", count: 19, aliases: ["jasmin", "jazmine"] },
];
const defaultStreetEntries: SmartEntry[] = [
  { canonical: "Rizal Street", count: 112, aliases: ["rizal st.", "rizal st", "rizal ave"] },
  { canonical: "Mabini Street", count: 85, aliases: ["mabini st.", "mabini st"] },
  { canonical: "Bonifacio Avenue", count: 63, aliases: ["bonifacio ave.", "bonifacio ave", "bonifacio blvd"] },
  { canonical: "Luna Street", count: 47, aliases: ["luna st.", "luna st"] },
  { canonical: "Del Pilar Street", count: 39, aliases: ["del pilar st.", "del pilar st", "delpillar st"] },
  { canonical: "Quezon Boulevard", count: 31, aliases: ["quezon blvd.", "quezon blvd", "quezon ave"] },
  { canonical: "Aguinaldo Street", count: 22, aliases: ["aguinaldo st.", "aguinaldo st"] },
];
const defaultPuroks = defaultPurokEntries.map((e) => e.canonical);

// tenantConfig derived from auth context inside component (useAuth hook)

// Resident number generated server-side: RES-{PSGC_CODE}-{SEQUENTIAL_4DIGIT}

// ── Validation Helpers ──
const isValidPHMobile = (v: string) => /^09\d{9}$/.test(v.replace(/\s/g, ""));
const isValidEmail = (v: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
const formatPHMobile = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  // Auto-format: 09XX XXX XXXX
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
};

const puroks = ["All Puroks", ...defaultPuroks];
const statuses = ["All Status", "Active", "Inactive", "Deceased", "Transferred"];
const sexOptions = ["All", "Male", "Female"];
const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Divorced", "Annulled", "Live-in"];
const bloodTypes = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const educationLevels = ["", "No Formal Education", "Elementary Graduate", "High School Graduate", "Vocational", "College Graduate", "Post Graduate"];

// Per-level field rules for Educational Attainment
function eduFieldRules(level: string) {
  const noFormal = level === "No Formal Education";
  const noCourse = noFormal || level === "Elementary Graduate" || level === "High School Graduate";
  return {
    allDisabled: noFormal,           // lock every other field
    courseDisabled: noCourse,        // Course/Program not applicable
  };
}
// religions, citizenshipOptions, ethnicityOptions replaced by SmartEntry arrays (dynamic combobox)
const extensions = ["", "Jr.", "Sr.", "II", "III", "IV", "V"];
const residentTypes = ["", "Permanent", "Transient", "Transferee"];
const relationships = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Grandson", "Granddaughter", "Nephew", "Niece", "Boarder", "Helper", "Others"];
const sectorOptions = ["Senior Citizen", "PWD", "Solo Parent", "4Ps Beneficiary", "Farmer", "Nano/Micro Entrepreneur", "Student", "OFW", "TODA Driver", "JODA Driver", "Other Driver", "Vendor", "Working Student", "LGBTQIA+", "With Comorbidities", "IP (Indigenous People)"];
const employmentStatuses = ["", "Employed", "Self-employed", "Unemployed", "Retired", "Student", "OFW"];
const complexionOptions = ["", "Fair", "Light Brown", "Brown", "Dark Brown", "Dark"];
// Smart combobox entries -- in production, learned from clerk input via API
const defaultCitizenshipEntries: SmartEntry[] = [
  { canonical: "Filipino", count: 950, aliases: ["pinoy", "filipina", "pilipino"] },
  { canonical: "American", count: 12, aliases: ["us", "usa", "united states"] },
  { canonical: "Chinese", count: 8, aliases: ["chinese national"] },
  { canonical: "Japanese", count: 5, aliases: [] },
  { canonical: "Korean", count: 5, aliases: ["south korean"] },
  { canonical: "Australian", count: 3, aliases: ["aussie"] },
  { canonical: "British", count: 3, aliases: ["uk", "english"] },
  { canonical: "Canadian", count: 2, aliases: [] },
  { canonical: "Indian", count: 2, aliases: [] },
  { canonical: "Indonesian", count: 1, aliases: [] },
  { canonical: "Malaysian", count: 1, aliases: [] },
  { canonical: "Singaporean", count: 1, aliases: [] },
  { canonical: "Spanish", count: 1, aliases: [] },
  { canonical: "Taiwanese", count: 1, aliases: [] },
];
const defaultReligionEntries: SmartEntry[] = [
  { canonical: "Catholic", count: 620, aliases: ["roman catholic", "rc"] },
  { canonical: "INC (Iglesia ni Cristo)", count: 85, aliases: ["iglesia ni cristo", "inc", "iglesia"] },
  { canonical: "Born Again", count: 72, aliases: ["born again christian", "evangelical"] },
  { canonical: "Muslim", count: 45, aliases: ["islam", "islamic"] },
  { canonical: "Protestant", count: 28, aliases: [] },
  { canonical: "Seventh Day Adventist", count: 22, aliases: ["sda", "adventist"] },
  { canonical: "Baptist", count: 18, aliases: [] },
  { canonical: "Methodist", count: 12, aliases: ["united methodist"] },
  { canonical: "Jehovah's Witness", count: 10, aliases: ["jw", "jehovahs witness"] },
  { canonical: "Mormon", count: 5, aliases: ["lds", "latter day saints"] },
  { canonical: "Buddhist", count: 3, aliases: [] },
  { canonical: "Aglipayan", count: 8, aliases: ["philippine independent church", "pic"] },
];
const defaultEthnicityEntries: SmartEntry[] = [
  { canonical: "Tagalog", count: 340, aliases: [] },
  { canonical: "Cebuano", count: 85, aliases: ["bisaya", "cebuano bisaya"] },
  { canonical: "Ilocano", count: 78, aliases: ["ilokano"] },
  { canonical: "Bisaya/Binisaya", count: 65, aliases: ["bisaya", "binisaya"] },
  { canonical: "Hiligaynon/Ilonggo", count: 42, aliases: ["hiligaynon", "ilonggo"] },
  { canonical: "Bikol", count: 38, aliases: ["bicolano", "bikolano"] },
  { canonical: "Waray", count: 32, aliases: ["waray-waray"] },
  { canonical: "Kapampangan", count: 55, aliases: ["pampango", "pampanga"] },
  { canonical: "Pangasinan", count: 28, aliases: ["pangasinense"] },
  { canonical: "Maranao", count: 12, aliases: [] },
  { canonical: "Maguindanao", count: 10, aliases: ["maguindanaon"] },
  { canonical: "Tausug", count: 8, aliases: [] },
  { canonical: "Zamboangueño", count: 15, aliases: ["zamboangueno", "chavacano"] },
  { canonical: "Ibanag", count: 6, aliases: [] },
  { canonical: "Ivatan", count: 4, aliases: [] },
  { canonical: "Kankanaey", count: 3, aliases: [] },
  { canonical: "Ibaloi", count: 2, aliases: [] },
  { canonical: "Ifugao", count: 2, aliases: [] },
  { canonical: "Kalinga", count: 2, aliases: [] },
  { canonical: "Aeta", count: 20, aliases: ["ayta", "agta"] },
];
const employmentTypeOptions = ["", "Full-Time", "Part-Time", "Casual", "Seasonal", "Contractual", "Self-Employed", "Freelance", "OFW"];
const incomeRanges = ["", "Below 5,000", "5,001 - 10,000", "10,001 - 15,000", "15,001 - 20,000", "20,001 - 30,000", "30,001 - 50,000", "50,001 - 75,000", "75,001 - 100,000", "100,001 - 150,000", "150,001 - 250,000", "250,001 - 500,000", "500,001 - 1,000,000", "Above 1,000,000"];

// ── Reusable Form Fields ──
function FInput({ label, name, required, type = "text", placeholder = "", value, onChange, className, valid, error, maxLength }: {
  label: string; name: string; required?: boolean; type?: string; placeholder?: string; value: string; onChange: (name: string, value: string | boolean) => void; className?: string; valid?: boolean; error?: string; maxLength?: number;
}) {
  const forceUpper = type === "text" || type === "search";
  // Normalize value to uppercase at the controlled-input level.
  // This ensures that values loaded from the DB (edit mode) also reflect the correct case
  // in the actual form state, not just visually via CSS text-transform.
  const displayValue = forceUpper ? (value || "").toUpperCase() : (value || "");
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} name={name} value={displayValue} maxLength={maxLength} autoComplete="off"
        onChange={(e) => onChange(name, forceUpper ? e.target.value.toUpperCase() : e.target.value)} placeholder={placeholder}
        className={cn("w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200",
          forceUpper && "uppercase",
          error ? "border border-red-500 focus:ring-2 focus:ring-red-300 bg-red-50 dark:bg-red-950/20" :
          valid ? "border border-green-500 focus:ring-2 focus:ring-green-300 bg-green-50 dark:bg-green-950/20" : "glass-input")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Custom Date Picker with calendar dropdown ──
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function FDatePicker({ label, name, required, value, onChange, className, valid, error }: {
  label: string; name: string; required?: boolean; value: string; onChange: (name: string, value: string | boolean) => void; className?: string; valid?: boolean; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  // Parse current value or default to a sensible view date
  // Birth date fields default 25 years back; all other date fields default to current year
  // Strip time component if API returns ISO datetime (e.g. "1990-03-15T00:00:00+00:00")
  const dateOnly = value?.includes("T") ? value.split("T")[0] : value;
  const parsed = dateOnly ? new Date(dateOnly + "T00:00:00") : null;
  const isBirthField = name.toLowerCase().includes("birth") || name.toLowerCase().includes("date_of_birth");
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : (isBirthField ? today.getFullYear() - 25 : today.getFullYear()));

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Build calendar grid for viewMonth/viewYear
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectDate = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(name, `${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  };

  const isToday = (day: number) => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  // Age calculation
  const age = parsed ? (() => {
    let a = today.getFullYear() - parsed.getFullYear();
    const m = today.getMonth() - parsed.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) a--;
    return a;
  })() : null;

  // Display value
  const displayValue = parsed
    ? `${MONTHS[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`
    : "";

  // Year options: 1920 to current year
  const yearOptions: number[] = [];
  for (let y = today.getFullYear(); y >= 1920; y--) yearOptions.push(y);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div className={cn("relative", className)} ref={ref}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {/* Trigger button */}
      <button type="button" name={name} onClick={handleToggle}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl text-left focus:outline-none transition-all duration-200",
          error ? "border border-red-500 focus:ring-2 focus:ring-red-300 bg-red-50 dark:bg-red-950/20" :
          valid ? "border border-green-500 focus:ring-2 focus:ring-green-300 bg-green-50 dark:bg-green-950/20" : "glass-input"
        )}>
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className={cn("flex-1 truncate", !displayValue && "text-muted-foreground")}>
          {displayValue || "Select date"}
        </span>
        {age !== null && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-bg text-accent-text shrink-0">
            {age} yrs
          </span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

      {/* Calendar dropdown */}
      {open && typeof window !== "undefined" && createPortal(
        <div ref={dropdownRef} className="fixed z-[9999] w-72 rounded-xl bg-background border border-border shadow-lg p-3"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}>
          {/* Month/Year header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-sm font-semibold bg-transparent border-none focus:outline-none cursor-pointer hover:text-accent-text transition-colors">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-sm font-semibold bg-transparent border-none focus:outline-none cursor-pointer hover:text-accent-text transition-colors">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">{d}</div>
            ))}
          </div>
          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button type="button" onClick={() => selectDate(day)}
                    className={cn(
                      "w-8 h-8 text-xs rounded-lg transition-colors font-medium",
                      isSelected(day)
                        ? "text-white shadow-sm"
                        : isToday(day)
                        ? "bg-accent-bg/30 text-accent-text font-bold"
                        : "text-foreground hover:bg-muted"
                    )}
                    style={isSelected(day) ? { background: "var(--accent-primary)" } : undefined}>
                    {day}
                  </button>
                ) : <div className="w-8 h-8" />}
              </div>
            ))}
          </div>
          {/* Quick actions */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <button type="button" onClick={() => { onChange(name, ""); setOpen(false); }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Clear</button>
            <button type="button" onClick={() => {
              const mm = String(today.getMonth() + 1).padStart(2, "0");
              const dd = String(today.getDate()).padStart(2, "0");
              onChange(name, `${today.getFullYear()}-${mm}-${dd}`);
              setOpen(false);
            }}
              className="text-[11px] font-medium hover:text-accent-text transition-colors" style={{ color: "var(--accent-primary)" }}>Today</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function FSelect({ label, name, options, required, value, onChange, className, error, disabled }: {
  label: string; name: string; options: string[]; required?: boolean; value: string; onChange: (name: string, value: string | boolean) => void; className?: string; error?: string; disabled?: boolean;
}) {
  return (
    <div className={cn(className, disabled && "opacity-40 pointer-events-none")}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select name={name} value={value} onChange={(e) => onChange(name, e.target.value)} disabled={disabled}
        className={cn("w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200",
          error ? "border border-red-500 focus:ring-2 focus:ring-red-300 bg-red-50 dark:bg-red-950/20" : "glass-input",
          disabled && "cursor-not-allowed")}>
        {options.map((o) => <option key={o} value={o === options[0] && o === "" ? "" : o}>{o || `Select ${label.toLowerCase()}`}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FCheckbox({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(name, e.target.checked)}
        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring" />
      <span className="text-sm text-foreground group-hover:text-accent-text transition-colors">{label}</span>
    </label>
  );
}

// ── Smart Address Entry (AI-powered fuzzy matching) ──
// In production: entries stored in barangay_address_entries table via API
// Learns from clerk input over time -- no manual Settings configuration needed

// Common abbreviation map for Filipino address normalization
const addressAbbreviations: Record<string, string> = {
  "st.": "street", "st": "street", "ave.": "avenue", "ave": "avenue",
  "blvd.": "boulevard", "blvd": "boulevard", "dr.": "drive", "dr": "drive",
  "rd.": "road", "rd": "road", "ln.": "lane", "ln": "lane",
  "brgy.": "barangay", "brgy": "barangay", "sts.": "streets",
};

function normalizeAddress(input: string): string {
  return input.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim()
    .split(" ").map((w) => addressAbbreviations[w] || w).join(" ");
}

function similarity(a: string, b: string): number {
  const na = normalizeAddress(a);
  const nb = normalizeAddress(b);
  if (na === nb) return 1;
  // Trigram similarity (same approach as PostgreSQL pg_trgm)
  const triA = new Set<string>(); const triB = new Set<string>();
  const pa = `  ${na} `; const pb = `  ${nb} `;
  for (let i = 0; i < pa.length - 2; i++) triA.add(pa.slice(i, i + 3));
  for (let i = 0; i < pb.length - 2; i++) triB.add(pb.slice(i, i + 3));
  let intersect = 0;
  triA.forEach((t) => { if (triB.has(t)) intersect++; });
  return intersect / (triA.size + triB.size - intersect);
}

interface SmartEntry { canonical: string; count: number; aliases: string[] }

function FCombobox({ label, name, entries, required, value, onChange, onSubmit, onEntriesChange, placeholder: customPlaceholder, disabled }: {
  label: string; name: string; entries: SmartEntry[]; required?: boolean; value: string;
  onChange: (name: string, value: string | boolean) => void;
  onSubmit?: (value: string) => void;
  onEntriesChange?: React.Dispatch<React.SetStateAction<SmartEntry[]>>;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const sorted = [...entries].sort((a, b) => b.count - a.count);

  // Fuzzy match: filter by substring OR similarity > 0.4
  const matched = trimmed
    ? sorted.map((e) => {
        const sub = e.canonical.toLowerCase().includes(trimmed.toLowerCase());
        const sim = similarity(trimmed, e.canonical);
        const aliasMatch = e.aliases.some((a) => similarity(trimmed, a) > 0.6);
        return { ...e, score: sub ? 1 : Math.max(sim, aliasMatch ? 0.7 : 0), sim };
      }).filter((e) => e.score > 0.35).sort((a, b) => b.score - a.score || b.count - a.count)
    : sorted.map((e) => ({ ...e, score: 1, sim: 0 }));

  // Find "did you mean" suggestion -- high similarity but not exact
  const exactMatch = entries.some((e) => normalizeAddress(e.canonical) === normalizeAddress(trimmed));
  const fuzzyMatch = trimmed && !exactMatch
    ? entries.find((e) => {
        const sim = similarity(trimmed, e.canonical);
        return sim > 0.55 && sim < 1;
      })
    : null;

  const openCombobox = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setOpen(true);
    setQuery("");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submitValue = (val: string) => {
    if (onSubmit) { onSubmit(val); }
    else if (onEntriesChange) {
      onEntriesChange((prev) => {
        const existing = prev.find((e) => e.canonical.toUpperCase() === val.toUpperCase());
        if (existing) return prev.map((e) => e === existing ? { ...e, count: e.count + 1 } : e);
        return [...prev, { canonical: val, count: 1, aliases: [] }];
      });
    }
  };

  const handleSelect = (val: string) => {
    submitValue(val);
    onChange(name, val);
    setQuery("");
    setOpen(false);
  };

  const handleNew = () => {
    if (!trimmed) return;
    submitValue(trimmed);
    onChange(name, trimmed);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", disabled && "opacity-40 pointer-events-none")}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className={cn("flex items-center w-full rounded-xl transition-all duration-200",
        open ? "glass-input" : "glass-input")}
        style={open ? { borderColor: "var(--accent-primary)", boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)" } : undefined}>
        <input type="text" value={open ? query : value} placeholder={value || customPlaceholder || `Type to search or add...`}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none min-w-0 uppercase"
          disabled={disabled}
          onFocus={disabled ? undefined : openCombobox}
          onChange={(e) => { setQuery(e.target.value.toUpperCase()); if (!open) openCombobox(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && trimmed) { e.preventDefault(); fuzzyMatch ? handleSelect(fuzzyMatch.canonical) : handleNew(); } }} />
        {value && !open && (
          <button type="button" onClick={() => { onChange(name, ""); setOpen(true); }}
            className="px-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
        <ChevronDown className={cn("h-4 w-4 mr-2 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </div>
      {open && typeof window !== "undefined" && createPortal(
        <div ref={dropdownRef} className="fixed z-[9999] rounded-xl shadow-xl max-h-56 overflow-y-auto bg-background border border-border"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
          {/* "Did you mean" suggestion */}
          {fuzzyMatch && (
            <button type="button" onClick={() => handleSelect(fuzzyMatch.canonical)}
              className="w-full text-left px-3 py-2.5 text-sm bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
              <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Did you mean:</span>
              <span className="ml-1.5 font-semibold text-foreground">{fuzzyMatch.canonical}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">({fuzzyMatch.count} uses)</span>
            </button>
          )}
          {/* Matched entries sorted by relevance + frequency */}
          {matched.length === 0 && !trimmed && (
            <div className="px-3 py-2.5 text-sm text-muted-foreground italic">Start typing to add entries. The system learns as you go.</div>
          )}
          {matched.length === 0 && trimmed && !fuzzyMatch && (
            <div className="px-3 py-2 text-xs text-muted-foreground italic">No matches found</div>
          )}
          {matched.map((e) => (
            <button key={e.canonical} type="button" onClick={() => handleSelect(e.canonical)}
              className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between",
                e.canonical === value && "font-medium text-accent-text bg-accent-primary/5")}>
              <span>{e.canonical}</span>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">{e.count}</span>
            </button>
          ))}
          {/* Add new entry */}
          {trimmed && !exactMatch && (
            <button type="button" onClick={handleNew}
              className="w-full text-left px-3 py-2 text-sm border-t border-border text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4" />
              Save &ldquo;{trimmed}&rdquo; as new entry
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function FRadio({ label, name, options, value, onChange }: { label: string; name: string; options: { value: string; label: string }[]; value: string; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="flex items-center rounded-xl glass-input overflow-hidden">
        {options.map((o, i) => (
          <button key={o.value} type="button" onClick={() => onChange(name, o.value)}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-all duration-200",
              i > 0 && "border-l border-white/20 dark:border-white/10",
              value === o.value
                ? "glass-accordion text-white shadow-md"
                : "text-foreground hover:bg-white/30 dark:hover:bg-white/5"
            )}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Collapsible Section (V3-style blue header accordion) ──
function Section({ icon, title, open, onToggle, children }: {
  icon: React.ReactNode; title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="group">
      <button type="button" onClick={onToggle}
        className={cn("w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-xl transition-all duration-200",
          open
            ? "glass-accordion text-white shadow-lg"
            : "glass-accordion-closed text-blue-700 dark:text-blue-300 hover:shadow-md")}
        >
        <span className="shrink-0 [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span>
        <span className="flex-1 text-sm font-bold uppercase tracking-wider">{title}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className={cn(open ? "overflow-visible" : "overflow-hidden")}>
          <div className="glass-section rounded-b-xl mt-px px-5 pt-5 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Education Entry ──
interface EduEntry { level: string; course: string; school: string; start_year: string; end_year: string; currently_studying: boolean; }
const emptyEdu: EduEntry = { level: "", course: "", school: "", start_year: "", end_year: "", currently_studying: false };

// ── Work / Employment Entry ──
interface WorkEntry { position: string; company: string; employment_type: string; start_year: string; end_year: string; description: string; }
const emptyWork: WorkEntry = { position: "", company: "", employment_type: "", start_year: "", end_year: "", description: "" };

// ── Business / Self-Employment Entry ──
interface BusinessEntry { business_name: string; business_type: string; business_address: string; business_permit_no: string; dti_sec_no: string; monthly_income: string; start_year: string; status: string; description: string; }
const emptyBusiness: BusinessEntry = { business_name: "", business_type: "", business_address: "", business_permit_no: "", dti_sec_no: "", monthly_income: "", start_year: "", status: "", description: "" };
const businessStatuses = ["", "Active", "Temporarily Closed", "Closed", "Seasonal"];
const livelihoodTypes = ["", "Employed", "Self-Employed / Business Owner", "Unemployed", "Retired", "Student", "OFW"];

const defaultEmergencyRelEntries: SmartEntry[] = [
  { canonical: "Spouse", count: 180, aliases: ["wife", "husband", "asawa"] },
  { canonical: "Parent", count: 120, aliases: ["father", "mother", "tatay", "nanay", "mama", "papa"] },
  { canonical: "Sibling", count: 85, aliases: ["brother", "sister", "kapatid"] },
  { canonical: "Child", count: 60, aliases: ["son", "daughter", "anak"] },
  { canonical: "Friend", count: 35, aliases: ["kaibigan"] },
  { canonical: "Relative", count: 28, aliases: ["kamag-anak"] },
  { canonical: "Neighbor", count: 22, aliases: ["kapitbahay"] },
  { canonical: "Grandparent", count: 15, aliases: ["lolo", "lola", "grandfather", "grandmother"] },
  { canonical: "Guardian", count: 10, aliases: ["legal guardian"] },
  { canonical: "Employer", count: 5, aliases: ["boss"] },
  { canonical: "Co-worker", count: 3, aliases: ["katrabaho", "officemate"] },
];
const defaultSectorOtherEntries: SmartEntry[] = [
  { canonical: "Tricycle Driver", count: 180, aliases: ["trike", "traysikel", "trisikad"] },
  { canonical: "Fish Vendor", count: 120, aliases: ["tindera ng isda", "fish seller", "magisda"] },
  { canonical: "Sari-Sari Store Owner", count: 110, aliases: ["tindahan", "sari sari", "store owner", "tindero", "tindera"] },
  { canonical: "Construction Worker", count: 95, aliases: ["mason", "karpintero", "carpenter", "tubero", "plumber", "construction"] },
  { canonical: "Barangay Health Worker", count: 85, aliases: ["bhw", "health worker", "midwife", "hilot"] },
  { canonical: "Barangay Nutrition Scholar", count: 70, aliases: ["bns", "nutrition scholar"] },
  { canonical: "Barangay Tanod", count: 65, aliases: ["tanod", "bantay bayan", "peace officer"] },
  { canonical: "Lupon Member", count: 55, aliases: ["lupon", "lupon tagapamayapa", "katarungang pambarangay"] },
  { canonical: "SK Member", count: 50, aliases: ["sangguniang kabataan", "sk council", "kabataan"] },
  { canonical: "Women's Association", count: 45, aliases: ["kababaihan", "women org", "samahan ng kababaihan"] },
  { canonical: "Jeepney Driver", count: 40, aliases: ["tsuper", "driver", "jeep driver"] },
  { canonical: "Teacher", count: 38, aliases: ["guro", "titser", "educator"] },
  { canonical: "Kasambahay", count: 35, aliases: ["katulong", "helper", "domestic worker", "yaya", "maid"] },
  { canonical: "Church Worker", count: 30, aliases: ["sakristan", "choir", "simbahan", "church volunteer"] },
  { canonical: "Cooperative Member", count: 28, aliases: ["coop", "kooperatiba", "credit coop"] },
  { canonical: "Senior Citizen Association", count: 25, aliases: ["osca", "senior org", "samahan ng matatanda"] },
  { canonical: "PWD Organization", count: 22, aliases: ["pwd org", "disabled org", "samahan ng pwd"] },
  { canonical: "Market Vendor", count: 20, aliases: ["magtitinda", "palengke", "market seller", "vendor sa palengke"] },
  { canonical: "Laundry Worker", count: 18, aliases: ["labandera", "labandero", "maglalaba"] },
  { canonical: "Security Guard", count: 15, aliases: ["guard", "guwardiya", "security"] },
];
const defaultBusinessTypeEntries: SmartEntry[] = [
  { canonical: "Sari-Sari Store", count: 280, aliases: ["tindahan", "store", "sari sari", "magtitinda"] },
  { canonical: "Carinderia / Eatery", count: 150, aliases: ["karinderia", "karinderya", "eatery", "kainan", "turo-turo", "turo turo"] },
  { canonical: "Tricycle Operation", count: 130, aliases: ["traysikel", "trike operation", "tricycle", "trike"] },
  { canonical: "Buy and Sell", count: 95, aliases: ["buy & sell", "trading", "negosyo", "reseller"] },
  { canonical: "Water Refilling Station", count: 80, aliases: ["water station", "tubig", "refilling", "purified water"] },
  { canonical: "Laundry Service", count: 70, aliases: ["labahan", "laundry shop", "labandera"] },
  { canonical: "Piggery / Livestock", count: 65, aliases: ["babuyan", "pig farm", "manukan", "poultry", "livestock"] },
  { canonical: "Rice Trading", count: 55, aliases: ["bigas", "rice dealer", "bigasan", "rice mill"] },
  { canonical: "Welding / Fabrication", count: 50, aliases: ["panday", "welding shop", "fabrication", "metal works"] },
  { canonical: "Beauty Salon / Barbershop", count: 48, aliases: ["parlor", "barbershop", "salon", "beauty parlor", "gupit"] },
  { canonical: "Farming / Agriculture", count: 45, aliases: ["magsasaka", "bukid", "farm", "palay", "agriculture"] },
  { canonical: "Fishing", count: 42, aliases: ["mangingisda", "isda", "fishpond", "aquaculture"] },
  { canonical: "Vulcanizing Shop", count: 38, aliases: ["vulcanizing", "gomahan", "tire repair"] },
  { canonical: "Computer Shop / Internet Cafe", count: 35, aliases: ["comp shop", "internet cafe", "pisonet", "pisowifi"] },
  { canonical: "Bakery", count: 32, aliases: ["panaderya", "bakeshop", "bread", "tinapay"] },
  { canonical: "Construction / Contractor", count: 30, aliases: ["kontratista", "construction", "builder", "mason"] },
  { canonical: "Jeepney Operation", count: 28, aliases: ["jeepney", "jeep operation", "jeep"] },
  { canonical: "Food Vending", count: 25, aliases: ["food cart", "street food", "tusok-tusok", "fishball", "vendor"] },
  { canonical: "Auto / Motor Repair", count: 22, aliases: ["talyer", "mechanic", "auto repair", "motor shop"] },
  { canonical: "Online Selling", count: 20, aliases: ["online shop", "shopee seller", "lazada", "facebook selling", "online business"] },
];
const defaultOccupationEntries: SmartEntry[] = [
  { canonical: "Farmer", count: 280, aliases: ["magsasaka", "mag-uuma", "bukid", "palay farmer"] },
  { canonical: "Fisherman", count: 200, aliases: ["mangingisda", "fisher", "isda"] },
  { canonical: "Tricycle Driver", count: 180, aliases: ["trike driver", "traysikel", "trisikad driver"] },
  { canonical: "Vendor", count: 160, aliases: ["magtitinda", "tindera", "tindero", "market vendor", "ambulant vendor"] },
  { canonical: "Construction Worker", count: 150, aliases: ["mason", "karpintero", "carpenter", "tubero", "laborer"] },
  { canonical: "Teacher", count: 140, aliases: ["guro", "titser", "educator", "instructor"] },
  { canonical: "Housewife / Homemaker", count: 130, aliases: ["housewife", "homemaker", "maybahay", "nag-aalaga ng bahay"] },
  { canonical: "Driver", count: 120, aliases: ["tsuper", "jeepney driver", "truck driver", "delivery driver"] },
  { canonical: "Domestic Worker", count: 110, aliases: ["kasambahay", "katulong", "helper", "yaya", "maid"] },
  { canonical: "Government Employee", count: 100, aliases: ["gov employee", "empleyado ng gobyerno", "public servant"] },
  { canonical: "Security Guard", count: 90, aliases: ["guard", "guwardiya", "watchman"] },
  { canonical: "Barangay Health Worker", count: 85, aliases: ["bhw", "health worker", "midwife"] },
  { canonical: "Sari-Sari Store Owner", count: 80, aliases: ["tindahan owner", "store owner", "magtitinda"] },
  { canonical: "Electrician", count: 70, aliases: ["elektrista", "elektrisyan", "electrical"] },
  { canonical: "Mechanic", count: 65, aliases: ["mekaniko", "auto mechanic", "motor mechanic"] },
  { canonical: "OFW", count: 60, aliases: ["overseas filipino worker", "abroad", "migrant worker"] },
  { canonical: "Nurse", count: 55, aliases: ["nars", "registered nurse", "rn"] },
  { canonical: "Laundry Worker", count: 50, aliases: ["labandera", "labandero", "maglalaba"] },
  { canonical: "Student", count: 45, aliases: ["estudyante", "mag-aaral", "scholar"] },
  { canonical: "Retired", count: 40, aliases: ["retirado", "pensioner", "senior"] },
];
const defaultSkillEntries: SmartEntry[] = [
  { canonical: "Welding", count: 150, aliases: ["welder", "panday", "arc welding", "metal fabrication"] },
  { canonical: "Carpentry", count: 140, aliases: ["karpintero", "woodwork", "furniture making"] },
  { canonical: "Dressmaking / Tailoring", count: 120, aliases: ["mananahi", "seamstress", "tailor", "sewing"] },
  { canonical: "Cooking / Food Preparation", count: 110, aliases: ["pagluluto", "chef", "cook", "baking"] },
  { canonical: "Driving (Professional)", count: 100, aliases: ["pagmamaneho", "professional driver", "LTO license"] },
  { canonical: "Farming / Agriculture", count: 95, aliases: ["pagsasaka", "crop production", "organic farming"] },
  { canonical: "Electrical Installation", count: 85, aliases: ["elektrista", "wiring", "electrical work"] },
  { canonical: "Plumbing", count: 80, aliases: ["tubero", "pipe fitting", "water system"] },
  { canonical: "Masonry", count: 75, aliases: ["mason", "brick laying", "concrete work", "pagtatayo"] },
  { canonical: "Fishing", count: 70, aliases: ["pangingisda", "net making", "fish processing"] },
  { canonical: "Beauty / Hairdressing", count: 65, aliases: ["parlor", "salon", "hair cutting", "gupit", "rebond"] },
  { canonical: "Auto / Motor Repair", count: 60, aliases: ["mekaniko", "automotive", "motor repair", "talyer"] },
  { canonical: "Computer Literacy", count: 55, aliases: ["computer", "MS Office", "typing", "encoding"] },
  { canonical: "Electronics Repair", count: 50, aliases: ["technician", "cellphone repair", "appliance repair"] },
  { canonical: "Livestock / Animal Husbandry", count: 45, aliases: ["pag-aalaga ng hayop", "piggery", "poultry", "manukan"] },
  { canonical: "Handicraft / Weaving", count: 40, aliases: ["paghahabi", "basket weaving", "handicraft", "banig"] },
  { canonical: "Massage / Hilot", count: 35, aliases: ["hilot", "spa", "therapeutic massage", "wellness"] },
  { canonical: "Painting (House)", count: 30, aliases: ["pintor", "house painting", "wall painting"] },
  { canonical: "Baking / Pastry", count: 28, aliases: ["baker", "panaderya", "cake making", "pastry chef"] },
  { canonical: "Online Selling / E-Commerce", count: 25, aliases: ["online business", "shopee", "lazada", "facebook selling"] },
];
const defaultPositionEntries: SmartEntry[] = [
  { canonical: "Laborer / Helper", count: 200, aliases: ["labor", "helper", "kargador", "utility worker"] },
  { canonical: "Driver", count: 150, aliases: ["tsuper", "delivery driver", "company driver"] },
  { canonical: "Cashier", count: 120, aliases: ["kahera", "cahier", "cash handler"] },
  { canonical: "Sales Associate", count: 100, aliases: ["saleslady", "salesman", "sales clerk", "tindera"] },
  { canonical: "Teacher / Instructor", count: 95, aliases: ["guro", "titser", "faculty", "substitute teacher"] },
  { canonical: "Security Guard", count: 90, aliases: ["guard", "guwardiya", "security officer"] },
  { canonical: "Machine Operator", count: 80, aliases: ["operator", "factory worker", "production"] },
  { canonical: "Office Staff / Clerk", count: 75, aliases: ["clerk", "admin staff", "office assistant", "encoder"] },
  { canonical: "Foreman / Supervisor", count: 65, aliases: ["forman", "kapatas", "team leader", "supervisor"] },
  { canonical: "Nurse / Midwife", count: 60, aliases: ["nars", "registered nurse", "komadrona", "midwife"] },
  { canonical: "Barangay Health Worker", count: 55, aliases: ["bhw", "health worker"] },
  { canonical: "Maintenance / Janitor", count: 50, aliases: ["janitor", "custodian", "cleaner", "utility"] },
  { canonical: "Cook / Kitchen Staff", count: 48, aliases: ["cook", "kitchen helper", "kusinero", "kusinera"] },
  { canonical: "Delivery Rider", count: 45, aliases: ["rider", "grab rider", "foodpanda", "lalamove"] },
  { canonical: "Technician", count: 42, aliases: ["tech", "electrician", "aircon tech", "IT tech"] },
  { canonical: "Farm Worker", count: 40, aliases: ["farm hand", "magsasaka", "harvester", "plantation worker"] },
  { canonical: "Construction Worker", count: 38, aliases: ["mason", "carpenter", "welder", "steel man"] },
  { canonical: "Domestic Helper", count: 35, aliases: ["kasambahay", "katulong", "yaya", "househelp"] },
  { canonical: "Factory Worker", count: 30, aliases: ["production staff", "packer", "assembly line"] },
  { canonical: "Seaman / Seafarer", count: 25, aliases: ["seaman", "marino", "sailor", "ofw seaman"] },
];
const defaultEmployerEntries: SmartEntry[] = [
  { canonical: "Self-Employed", count: 300, aliases: ["sarili", "own business", "self employed", "freelance"] },
  { canonical: "Department of Education (DepEd)", count: 120, aliases: ["deped", "dep ed", "public school"] },
  { canonical: "Local Government Unit (LGU)", count: 100, aliases: ["lgu", "municipal", "city hall", "barangay"] },
  { canonical: "SM Group", count: 80, aliases: ["sm supermarket", "sm mall", "savemore", "sm retail"] },
  { canonical: "Jollibee Foods Corp.", count: 75, aliases: ["jollibee", "jfc", "chowking", "greenwich", "mang inasal"] },
  { canonical: "Security Agency", count: 70, aliases: ["agency", "guard agency", "security service"] },
  { canonical: "Construction Company", count: 65, aliases: ["contractor", "construction firm", "building company"] },
  { canonical: "Private Household", count: 60, aliases: ["private", "bahay", "employer household", "family employer"] },
  { canonical: "Department of Health (DOH)", count: 55, aliases: ["doh", "hospital", "rural health unit", "rhu"] },
  { canonical: "Philippine National Police (PNP)", count: 50, aliases: ["pnp", "police", "pulis"] },
  { canonical: "Armed Forces of the Philippines (AFP)", count: 45, aliases: ["afp", "military", "army", "sundalo"] },
  { canonical: "DOLE / PESO", count: 40, aliases: ["dole", "peso", "public employment service"] },
  { canonical: "Universal Robina Corp.", count: 35, aliases: ["urc", "jack n jill", "c2"] },
  { canonical: "Puregold", count: 30, aliases: ["puregold", "s&r"] },
  { canonical: "BPO / Call Center", count: 28, aliases: ["bpo", "call center", "outsourcing", "customer service"] },
  { canonical: "Grab / Delivery Platform", count: 25, aliases: ["grab", "foodpanda", "lalamove", "angkas"] },
  { canonical: "Factory / Manufacturing", count: 22, aliases: ["factory", "pabrika", "manufacturing plant"] },
  { canonical: "Cooperative", count: 20, aliases: ["coop", "kooperatiba", "multi-purpose coop"] },
  { canonical: "Church / Religious Org", count: 18, aliases: ["simbahan", "church", "religious"] },
  { canonical: "NGO / Foundation", count: 15, aliases: ["ngo", "foundation", "charity", "non-profit"] },
];
// ── Smart Entries: Education ──
const defaultCourseEntries: SmartEntry[] = [
  { canonical: "BS Computer Science", count: 45, aliases: ["bscs", "compsci", "cs"] },
  { canonical: "BS Information Technology", count: 42, aliases: ["bsit", "it", "infotech"] },
  { canonical: "BS Nursing", count: 80, aliases: ["bsn", "nursing"] },
  { canonical: "BS Education", count: 75, aliases: ["bsed", "education", "teaching"] },
  { canonical: "BS Criminology", count: 60, aliases: ["bscrim", "crim", "criminology"] },
  { canonical: "BS Accountancy", count: 35, aliases: ["bsa", "accountancy", "accounting"] },
  { canonical: "BS Business Administration", count: 55, aliases: ["bsba", "business admin", "business"] },
  { canonical: "BS Civil Engineering", count: 30, aliases: ["bsce", "civil eng", "engineering"] },
  { canonical: "BS Agriculture", count: 28, aliases: ["bsa agri", "agriculture", "agri"] },
  { canonical: "BS Social Work", count: 22, aliases: ["bssw", "social work"] },
  { canonical: "Associate in Computer Technology", count: 18, aliases: ["act", "computer tech"] },
  { canonical: "BS Hotel & Restaurant Management", count: 25, aliases: ["bshrm", "hrm", "hotel management"] },
  { canonical: "BS Marine Transportation", count: 15, aliases: ["bsmt", "marine", "seaman course"] },
  { canonical: "Technical Vocational (TESDA)", count: 40, aliases: ["tesda", "tvet", "vocational", "nc2"] },
  { canonical: "General Academic Strand (GAS)", count: 20, aliases: ["gas", "shs gas", "senior high"] },
  { canonical: "STEM", count: 18, aliases: ["shs stem", "science tech"] },
  { canonical: "ABM", count: 15, aliases: ["shs abm", "accountancy business"] },
  { canonical: "HUMSS", count: 12, aliases: ["shs humss", "humanities"] },
  { canonical: "TVL", count: 10, aliases: ["shs tvl", "tech voc livelihood"] },
  { canonical: "BS Pharmacy", count: 20, aliases: ["bspharm", "pharmacy"] },
];
const defaultSchoolEntries: SmartEntry[] = [
  { canonical: "Gordon College", count: 120, aliases: ["gc", "gordon"] },
  { canonical: "Columban College", count: 85, aliases: ["columban", "cc olongapo"] },
  { canonical: "Olongapo City National High School", count: 95, aliases: ["ocnhs", "city high"] },
  { canonical: "Zambales National High School", count: 60, aliases: ["znhs"] },
  { canonical: "President Ramon Magsaysay State University", count: 55, aliases: ["prmsu", "prms", "magsaysay univ"] },
  { canonical: "Philippine Christian University", count: 25, aliases: ["pcu"] },
  { canonical: "STI College", count: 40, aliases: ["sti", "sti olongapo"] },
  { canonical: "AMA Computer College", count: 35, aliases: ["ama", "amacc"] },
  { canonical: "University of the Philippines", count: 20, aliases: ["up", "up diliman", "up manila"] },
  { canonical: "Polytechnic University of the Philippines", count: 30, aliases: ["pup"] },
  { canonical: "Technological University of the Philippines", count: 25, aliases: ["tup"] },
  { canonical: "Don Bosco Training Center", count: 18, aliases: ["don bosco", "dbti"] },
  { canonical: "Subic Bay Colleges", count: 15, aliases: ["sbc"] },
  { canonical: "Philippine Science High School", count: 10, aliases: ["pisay", "pshs"] },
  { canonical: "DepEd ALS (Alternative Learning System)", count: 22, aliases: ["als", "alternative learning"] },
];
const defaultPlaceOfBirthEntries: SmartEntry[] = [
  { canonical: "Olongapo City", count: 350, aliases: ["olongapo", "olongapo city, zambales"] },
  { canonical: "Subic, Zambales", count: 120, aliases: ["subic"] },
  { canonical: "San Marcelino, Zambales", count: 85, aliases: ["san marcelino"] },
  { canonical: "Castillejos, Zambales", count: 70, aliases: ["castillejos"] },
  { canonical: "San Antonio, Zambales", count: 55, aliases: ["san antonio zambales"] },
  { canonical: "Iba, Zambales", count: 65, aliases: ["iba"] },
  { canonical: "Tarlac City", count: 45, aliases: ["tarlac", "tarlac city"] },
  { canonical: "Manila", count: 80, aliases: ["manila city", "city of manila"] },
  { canonical: "Quezon City", count: 50, aliases: ["qc", "quezon"] },
  { canonical: "Angeles City, Pampanga", count: 35, aliases: ["angeles city", "angeles"] },
  { canonical: "San Fernando, Pampanga", count: 28, aliases: ["san fernando pampanga"] },
  { canonical: "Dagupan City, Pangasinan", count: 22, aliases: ["dagupan"] },
  { canonical: "Baguio City", count: 25, aliases: ["baguio"] },
  { canonical: "Zambales", count: 40, aliases: ["zambales province"] },
  { canonical: "Caloocan City", count: 20, aliases: ["caloocan"] },
  { canonical: "Makati City", count: 18, aliases: ["makati"] },
  { canonical: "Cebu City", count: 15, aliases: ["cebu"] },
  { canonical: "Davao City", count: 12, aliases: ["davao"] },
  { canonical: "Zamboanga City", count: 10, aliases: ["zamboanga"] },
  { canonical: "Bataan", count: 30, aliases: ["bataan province", "balanga"] },
];

// ── Year options ──
const yearOptions = ["", ...Array.from({ length: 60 }, (_, i) => String(new Date().getFullYear() - i))];

// ── Toast Notification System ──
interface Toast { id: string; type: "success" | "error" | "warning" | "info"; title: string; message?: string; duration?: number; }

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dur = toast.duration ?? 5000;
    timerRef.current = setTimeout(() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }, dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, toast.duration, onDismiss]);

  const colors = {
    success: { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
    error: { bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200 dark:border-red-800", icon: "text-red-600 dark:text-red-400", bar: "bg-red-500" },
    warning: { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
    info: { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", icon: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
  }[toast.type];

  const Icon = toast.type === "success" ? CheckCircle : toast.type === "error" ? X : AlertTriangle;

  return (
    <div className={cn(
      "pointer-events-auto w-96 rounded-xl border shadow-2xl overflow-hidden transition-all duration-300",
      colors.bg, colors.border,
      exiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0 animate-in slide-in-from-right-5 fade-in"
    )}>
      <div className="flex items-start gap-3 p-4">
        <div className={cn("shrink-0 mt-0.5", colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.message && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toast.message}</p>}
        </div>
        <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-black/5 dark:bg-white/5">
        <div className={cn("h-full rounded-full", colors.bar)} style={{ animation: `shrink ${toast.duration ?? 5000}ms linear forwards` }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Data URL → Blob (no fetch — works under any CSP) ──
function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const [header, b64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return new Blob([], { type: "image/jpeg" });
  }
}

// ══════════════════════════════════════════════════════════════
// ── Overpass → GeoJSON helpers (barangay boundary overlay) ──
interface OverpassPoint { lat: number; lon: number; }
interface OverpassMember { type: string; role: string; ref: number; geometry?: OverpassPoint[]; }
interface OverpassRelation { type: string; id: number; members: OverpassMember[]; tags?: Record<string, string>; }

/** Chain Overpass ways end-to-end into a single coordinate ring [lng, lat][] */
const assembleRing = (ways: number[][][]): number[][] => {
  if (ways.length === 0) return [];
  if (ways.length === 1) return ways[0];
  const remaining = ways.map(w => [...w]);
  const ring: number[][] = [...remaining.shift()!];
  while (remaining.length > 0) {
    const tail = ring[ring.length - 1];
    let matched = false;
    for (let i = 0; i < remaining.length; i++) {
      const w = remaining[i];
      const d = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d(tail, w[0]) < 0.0002) { ring.push(...w.slice(1)); remaining.splice(i, 1); matched = true; break; }
      if (d(tail, w[w.length - 1]) < 0.0002) { ring.push(...[...w].reverse().slice(1)); remaining.splice(i, 1); matched = true; break; }
    }
    if (!matched) ring.push(...remaining.shift()!); // disconnected way — append as-is
  }
  return ring;
};

/** Convert an Overpass relation (with `out geom;`) to a GeoJSON Feature */
const overpassRelationToGeoJson = (relation: OverpassRelation): object | null => {
  const outerWays = relation.members
    .filter(m => m.role === "outer" && m.geometry && m.geometry.length >= 2)
    .map(m => m.geometry!.map(p => [p.lon, p.lat]));
  if (outerWays.length === 0) return null;
  const ring = assembleRing(outerWays);
  if (ring.length < 3) return null;
  const first = ring[0]; const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]); // close ring
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
};

// ── MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════

interface ResidentsPageProps {
  censusMode?: boolean;
  onCensusRegistered?: () => void;
}

export default function ResidentsPage({ censusMode, onCensusRegistered }: ResidentsPageProps = {}) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantConfig = {
    barangay: user?.barangay?.name?.toUpperCase() || "",
    city_municipality: user?.barangay?.city_municipality?.toUpperCase() || "",
    province: user?.barangay?.province?.toUpperCase() || "",
    zip_code: user?.barangay?.zip_code || "",
    logo_url: user?.barangay?.logo_url || "",
  };
  const [search, setSearch] = useState("");
  const [purokFilter, setPurokFilter] = useState("All Puroks");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sexFilter, setSexFilter] = useState("All");
  const [voterFilter, setVoterFilter] = useState("all");
  const [civilStatusFilter, setCivilStatusFilter] = useState("All Civil Status");
  const [residentTypeFilter, setResidentTypeFilter] = useState("All Resident Types");
  const [hohFilter, setHohFilter] = useState("all");
  const [citizenshipFilter, setCitizenshipFilter] = useState("All Citizenship");
  const [religionFilter, setReligionFilter] = useState("All Religion");
  const [ethnicityFilter, setEthnicityFilter] = useState("All Ethnicity");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewResident, setViewResident] = useState<ResidentDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showDelete, setShowDelete] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  // Track which resident is currently generating a PDF (shows spinner on button)
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; first_name: string; last_name: string; sex: string; resident_number: string } | null>(null);
  const pageSize = 15;

  // ── API List State ──
  const [residents, setResidents] = useState<ResidentSummary[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLastPage, setListLastPage] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Resident Stats (full barangay — not current page) ──
  const [residentStats, setResidentStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchResidentStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const stats = await api.dashboard.getStats();
      setResidentStats(stats);
    } catch {
      // silently fail — stat cards fall back to list-based approximations
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchResidents = useCallback(async (opts?: { searchOverride?: string; pageOverride?: number }) => {
    setListLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: opts?.pageOverride ?? page,
        per_page: pageSize,
      };
      const q = opts?.searchOverride ?? search;
      if (q) params.search = q;
      if (purokFilter !== "All Puroks") params.purok = purokFilter;
      if (statusFilter !== "All Status") params.status = statusFilter.toLowerCase();
      if (sexFilter !== "All") params.sex = sexFilter.toLowerCase();
      if (voterFilter === "voter") params.is_voter = true;
      if (voterFilter === "non-voter") params.is_voter = false;
      if (civilStatusFilter !== "All Civil Status") params.civil_status = civilStatusFilter.toLowerCase();
      if (residentTypeFilter !== "All Resident Types") params.resident_type = residentTypeFilter.toLowerCase();
      if (hohFilter === "hoh") params.is_head_of_household = true;
      if (hohFilter === "non-hoh") params.is_head_of_household = false;
      if (citizenshipFilter !== "All Citizenship") params.citizenship = citizenshipFilter;
      if (religionFilter !== "All Religion") params.religion = religionFilter;
      if (ethnicityFilter !== "All Ethnicity") params.ethnicity = ethnicityFilter;
      if (sectorFilter !== "All Sectors") params.sector = sectorFilter;
      if (sortKey) {
        // Map frontend sort keys to backend column names
        const sortMap: Record<string, string> = { age: "date_of_birth", resident_number: "resident_number", last_name: "last_name", created_at: "created_at" };
        params.sort_by = sortMap[sortKey] || sortKey;
        // age sort is inverted (older DOB = younger age)
        params.sort_dir = sortKey === "age" ? (sortDir === "asc" ? "desc" : "asc") : sortDir;
      }
      const res = await api.residents.list(params as Parameters<typeof api.residents.list>[0]);
      setResidents(res.data);
      setListTotal(res.total);
      setListLastPage(res.last_page);
    } catch {
      // silently fail -- user sees empty state
    } finally {
      setListLoading(false);
    }
  }, [page, search, purokFilter, statusFilter, sexFilter, voterFilter, civilStatusFilter, residentTypeFilter, hohFilter, citizenshipFilter, religionFilter, ethnicityFilter, sectorFilter, sortKey, sortDir]);

  // ── Form State ──
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");

  // Handle ?edit={id} URL param — navigating from resident detail page "Edit Profile" button
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || mode !== "list") return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await api.residents.get(editId);
        if (!cancelled) {
          openEdit(detail);
          // Clean up the URL param without re-triggering navigation
          router.replace("/dashboard/residents", { scroll: false });
        }
      } catch {
        // Resident not found or access denied — ignore silently
      }
    })();
    return () => { cancelled = true; };
  // openEdit intentionally excluded — it's stable but defined lower in the file;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch residents + stats on mount and when returning to list mode
  useEffect(() => {
    if (mode === "list") {
      fetchResidents();
      fetchResidentStats();
    }
  }, [mode, fetchResidents, fetchResidentStats]);


  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchResidents({ searchOverride: value, pageOverride: 1 });
    }, 400);
  }, [fetchResidents]);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [sectors, setSectors] = useState<string[]>([]);
  const [eduEntries, setEduEntries] = useState<EduEntry[]>([{ ...emptyEdu }]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([{ ...emptyWork }]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    other: false,
    education: false, work: false, govinfo: false,
    emergency: false, biometric: false,
  });

  // ── Form Validation ──
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Toast Notifications ──
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Document wizard (opened from resident row action buttons) ──
  const [showDocWizard, setShowDocWizard] = useState(false);
  const [docWizardResidentId, setDocWizardResidentId] = useState<string | null>(null);
  const [docWizardCategory, setDocWizardCategory] = useState<string | null>(null);

  // ── ID card modal (purple button) ──
  const [showIdModal, setShowIdModal] = useState(false);
  const [idModalResidentId, setIdModalResidentId] = useState<string | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsModalResident, setSmsModalResident] = useState<SmsTargetResident | null>(null);
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // ── Smart Address Entries (AI-learned, no manual config needed) ──
  const [purokEntries, setPurokEntries] = useState<SmartEntry[]>(defaultPurokEntries);
  const [streetEntries, setStreetEntries] = useState<SmartEntry[]>(defaultStreetEntries);
  const [citizenshipEntries, setCitizenshipEntries] = useState<SmartEntry[]>(defaultCitizenshipEntries);
  const [religionEntries, setReligionEntries] = useState<SmartEntry[]>(defaultReligionEntries);
  const [ethnicityEntries, setEthnicityEntries] = useState<SmartEntry[]>(defaultEthnicityEntries);
  const [emergencyRelEntries, setEmergencyRelEntries] = useState<SmartEntry[]>(defaultEmergencyRelEntries);
  const [sectorOtherEntries, setSectorOtherEntries] = useState<SmartEntry[]>(defaultSectorOtherEntries);
  const [businessTypeEntries, setBusinessTypeEntries] = useState<SmartEntry[]>(defaultBusinessTypeEntries);
  const [occupationEntries, setOccupationEntries] = useState<SmartEntry[]>(defaultOccupationEntries);
  const [skillEntries, setSkillEntries] = useState<SmartEntry[]>(defaultSkillEntries);
  const [positionEntries, setPositionEntries] = useState<SmartEntry[]>(defaultPositionEntries);
  const [employerEntries, setEmployerEntries] = useState<SmartEntry[]>(defaultEmployerEntries);
  const [businessEntries, setBusinessEntries] = useState<BusinessEntry[]>([]);
  const [courseEntries, setCourseEntries] = useState<SmartEntry[]>(defaultCourseEntries);
  const [schoolEntries, setSchoolEntries] = useState<SmartEntry[]>(defaultSchoolEntries);
  const [placeOfBirthEntries, setPlaceOfBirthEntries] = useState<SmartEntry[]>(defaultPlaceOfBirthEntries);

  // ── Map State (Google Maps) ──
  // Map state — Leaflet handles the map DOM itself; we only track geocoding status
  const [mapLocating, setMapLocating] = useState(false);

  // Contained-scroll form layout — measure from form top to viewport bottom so the
  // action bar sits naturally below the scroll area and can never overlap the map.
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [formContainerHeight, setFormContainerHeight] = useState(0);

  const submitEntry = (entries: SmartEntry[], setEntries: React.Dispatch<React.SetStateAction<SmartEntry[]>>, val: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => normalizeAddress(e.canonical) === normalizeAddress(val));
      if (existing) {
        // Increment usage count + add alias if new variation
        return prev.map((e) => e.canonical === existing.canonical
          ? { ...e, count: e.count + 1, aliases: e.aliases.includes(val.toLowerCase()) ? e.aliases : [...e.aliases, val.toLowerCase()] }
          : e);
      }
      // Check if it's a close match to existing (merge as alias)
      const fuzzy = prev.find((e) => similarity(val, e.canonical) > 0.65);
      if (fuzzy) {
        return prev.map((e) => e.canonical === fuzzy.canonical
          ? { ...e, count: e.count + 1, aliases: [...e.aliases, val.toLowerCase()] }
          : e);
      }
      // Truly new entry
      return [...prev, { canonical: val, count: 1, aliases: [val.toLowerCase()] }];
    });
  };

  // ── Smart Photo System ──
  interface PhotoAnalysis {
    status: "good" | "fair" | "poor";
    faceDetected: boolean;
    faceSupported: boolean; // whether browser supports FaceDetector
    issues: string[];       // blocking/quality issues
    notes: string[];        // non-blocking informational notes
    brightness: number;     // 0-255
    sharpness: number;      // higher = sharper
  }

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoCaptureRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Photo Analysis (runs entirely in browser — zero cost) ──
  const analyzePhoto = useCallback(async (imageDataUrl: string): Promise<PhotoAnalysis> => {
    const img = new globalThis.Image();
    const imgLoaded = await new Promise<boolean>((resolve) => { img.onload = () => resolve(true); img.onerror = () => resolve(false); img.src = imageDataUrl; });
    if (!imgLoaded || !img.width || !img.height) {
      return { status: "fair" as const, faceDetected: false, faceSupported: false, issues: [], notes: [], brightness: 128, sharpness: 100 };
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Brightness: average luminance across all pixels
    let totalLum = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const brightness = totalLum / pixelCount;

    // Sharpness: Laplacian variance (measures edge contrast)
    const gray = new Float32Array(pixelCount);
    for (let i = 0; i < pixelCount; i++) {
      gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    }
    let lapSum = 0;
    let lapCount = 0;
    const w = canvas.width;
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const lap = -4 * gray[idx] + gray[idx - 1] + gray[idx + 1] + gray[idx - w] + gray[idx + w];
        lapSum += lap * lap;
        lapCount++;
      }
    }
    const sharpness = lapSum / lapCount;

    // Face detection: use browser's native FaceDetector API (Chrome/Edge — free, no library)
    let faceDetected = false;
    let faceBounds: { x: number; y: number; width: number; height: number } | null = null;
    try {
      if ("FaceDetector" in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).FaceDetector({ maxDetectedFaces: 5 });
        const faces = await detector.detect(canvas);
        if (faces.length === 1) {
          faceDetected = true;
          faceBounds = faces[0].boundingBox;
        }
      }
    } catch { /* FaceDetector not supported — skip gracefully */ }

    // Build issues (quality problems) and notes (non-blocking info)
    const issues: string[] = [];
    const notes: string[] = [];
    const faceSupported = "FaceDetector" in window;

    if (brightness < 60) issues.push("Too dark — improve lighting");
    else if (brightness > 210) issues.push("Too bright — reduce lighting or glare");

    if (sharpness < 50) issues.push("Photo is blurry — hold steady or move closer");

    if (img.width < 200 || img.height < 200) {
      issues.push("Photo too small — use a higher resolution");
    }

    // No-face is a NOTE not a blocker — photo is still accepted
    if (faceSupported && !faceDetected) {
      notes.push("No face detected — photo will still be saved, but you may want to retake");
    }

    // Auto-crop to ID proportions (2:2.5 ratio) if face is detected
    if (faceDetected && faceBounds) {
      const idW = faceBounds.width * 2.2;
      const idH = idW * 1.25; // 2x2.5 ID ratio
      let cropX = faceBounds.x + faceBounds.width / 2 - idW / 2;
      let cropY = faceBounds.y - faceBounds.height * 0.5; // headroom above face
      cropX = Math.max(0, Math.min(cropX, img.width - idW));
      cropY = Math.max(0, Math.min(cropY, img.height - idH));
      const cropW = Math.min(idW, img.width);
      const cropH = Math.min(idH, img.height);

      if (cropW > 100 && cropH > 100) {
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = 320;
        cropCanvas.height = 400;
        const cropCtx = cropCanvas.getContext("2d")!;
        cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 320, 400);
        // Replace preview with auto-cropped version
        setPhotoPreview(cropCanvas.toDataURL("image/jpeg", 0.92));
      }
    }

    // Status based on real quality issues only (not face detection)
    const status: PhotoAnalysis["status"] =
      issues.length === 0 && (faceDetected || !faceSupported) ? "good" :
      issues.length === 0 ? "fair" : // no quality issues but no face = fair
      issues.some((i) => i.includes("Too dark") || i.includes("blurry") || i.includes("too small")) ? "poor" : "fair";

    return { status, faceDetected, faceSupported, issues, notes, brightness, sharpness };
  }, []);

  // ── Barangay Logo Watermark (stamps bottom-right, semi-transparent) ──
  // Production: logo URL comes from barangay settings (uploaded via Settings > Branding)
  // Dev: falls back to static kapitanph_logo.png
  const barangayLogoUrl = tenantConfig.logo_url || "/kapitanph_logo.png";

  const stampWatermark = useCallback(async (dataUrl: string): Promise<string> => {
    try {
      const img = new globalThis.Image();
      const imgLoaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = dataUrl;
      });
      if (!imgLoaded || !img.width || !img.height) return dataUrl;

      const logo = new globalThis.Image();
      logo.crossOrigin = "anonymous";
      const logoLoaded = await new Promise<boolean>((resolve) => {
        logo.onload = () => resolve(true);
        logo.onerror = () => resolve(false);
        logo.src = barangayLogoUrl;
      });

      if (!logoLoaded) return dataUrl; // logo not available — return original without watermark

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return dataUrl;
      ctx.drawImage(img, 0, 0);

      // Stamp logo: 30% of photo width, bottom-right corner, 35% opacity
      const logoSize = Math.round(img.width * 0.3);
      const padding = Math.round(img.width * 0.03);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(logo, img.width - logoSize - padding, img.height - logoSize - padding, logoSize, logoSize);
      ctx.globalAlpha = 1;

      return canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      return dataUrl; // any failure — return original photo, never throw
    }
  }, [barangayLogoUrl]);

  const processPhoto = useCallback(async (dataUrl: string) => {
    setPhotoAnalyzing(true);
    setPhotoAnalysis(null);
    setCameraError(null);

    // Stamp barangay logo watermark (never throws — returns original on any failure)
    const watermarked = await stampWatermark(dataUrl);
    setPhotoPreview(watermarked);

    // Resize to ID photo dimensions (max 480×600, JPEG 0.88) and convert to Blob.
    // Uses atob() instead of fetch(dataUrl) — fetch() on data: URLs is blocked by CSP.
    const photoBlob = await new Promise<Blob>((resolve) => {
      const img = new globalThis.Image();
      img.onload = () => {
        try {
          const MAX_W = 480, MAX_H = 600;
          const scale = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("no ctx");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => resolve(b ?? dataUrlToBlob(watermarked)), "image/jpeg", 0.88);
        } catch {
          resolve(dataUrlToBlob(watermarked));
        }
      };
      img.onerror = () => resolve(dataUrlToBlob(watermarked));
      img.src = watermarked;
    });

    // Upload to API — silent fail, never show red error to user (Tanga-Proof)
    try {
      const uploaded = await api.files.uploadPhoto(photoBlob);
      updateForm("photo_file_id", uploaded.file.id);
    } catch (err) {
      // Log for debugging — don't block the user or show a scary error
      console.warn("[Photo upload]", err);
    }

    try {
      const analysis = await analyzePhoto(watermarked);
      setPhotoAnalysis(analysis);
    } catch {
      setPhotoAnalysis({ status: "fair", faceDetected: false, faceSupported: false, issues: [], notes: [], brightness: 128, sharpness: 100 });
    }
    setPhotoAnalyzing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzePhoto, stampWatermark]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCameraError("Invalid file type. Please select an image file (JPG, PNG, or WebP).");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCameraError("File is too large (max 10 MB). Please choose a smaller image or take a photo with the camera.");
      e.target.value = "";
      return;
    }
    setCameraError(null);
    const reader = new FileReader();
    reader.onload = (ev) => { processPhoto(ev.target?.result as string); stopCamera(); };
    reader.onerror = () => { setCameraError("Failed to read the file. Please try again or use a different image."); };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new DOMException("Camera not supported on this browser or connection.", "NotSupportedError");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 800 } } });
      streamRef.current = stream;
      setCameraActive(true);
      setPhotoAnalysis(null);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch (err) {
      const e = err instanceof DOMException ? err : new DOMException("Unknown camera error");
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setCameraError("Camera access was denied. Please allow camera permission in your browser settings, then try again.");
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device. Please connect a camera or use the Upload button instead.");
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        setCameraError("Camera is being used by another application. Close other apps using the camera, then try again.");
      } else if (e.name === "NotSupportedError" || e.name === "TypeError") {
        setCameraError("Camera is not available. This may be because the site is not using HTTPS. Please use the Upload button instead.");
      } else if (e.name === "OverconstrainedError") {
        setCameraError("Camera settings not supported. Please use the Upload button instead.");
      } else {
        setCameraError("Could not access camera. Please use the Upload button instead.");
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const vw = videoRef.current.videoWidth;
    const vh = videoRef.current.videoHeight;
    if (!vw || !vh) {
      setCameraError("Camera is still loading. Please wait a moment and try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Could not process the photo. Please try again or use the Upload button.");
      return;
    }
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    processPhoto(dataUrl);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setCameraError(null);
    setCameraLoading(false);
  };

  // ── Duplicate Detection State ──
  const [dupMatches, setDupMatches] = useState<DuplicateMatch[]>([]);
  const [dupModal, setDupModal] = useState(false);
  const [dupChecked, setDupChecked] = useState(false);
  const [dupDismissed, setDupDismissed] = useState(false);
  const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkDuplicates = useCallback((formData: Record<string, string | boolean>) => {
    const firstName = String(formData.first_name || "").trim();
    const lastName = String(formData.last_name || "").trim();
    const middleName = String(formData.middle_name || "").trim();
    const dob = String(formData.date_of_birth || "");

    if (!firstName || !lastName || !dob) { setDupMatches([]); setDupChecked(false); return; }

    api.residents.checkDuplicate({
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || undefined,
      date_of_birth: dob,
    }).then((res) => {
      setDupMatches(res.matches);
      setDupChecked(true);
      if (res.has_duplicates && !dupDismissed) setDupModal(true);
    }).catch(() => {
      // Silently fail -- duplicate check is advisory, not blocking
      setDupChecked(true);
    });
  }, [dupDismissed]);

  const toggleSection = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const updateForm = (key: string, value: string | boolean) => {
    let v = value;
    // Auto-format Philippine mobile number
    if (key === "mobile_number" && typeof v === "string") {
      v = formatPHMobile(v);
    }
    // Use functional setState so async callers (geocoding, map pin) never overwrite
    // fields that were typed after the callback was captured — stale-closure safe.
    setForm((prev) => ({ ...prev, [key]: v }));
    // Advisory side-effects: snapshot using current `form` + new value.
    // Minor staleness is acceptable here (dup check + sector warnings are advisory).
    const next = { ...form, [key]: v };
    // Clear field error on change
    if (formErrors[key]) setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    // Real-time validation for mobile/email
    if (key === "mobile_number" && typeof v === "string" && v.replace(/\s/g, "").length === 11) {
      if (!isValidPHMobile(v)) setFormErrors((prev) => ({ ...prev, mobile_number: "Must be a valid PH mobile number (09XX XXX XXXX)" }));
    }
    if (key === "email" && typeof v === "string" && v.length > 0) {
      if (!isValidEmail(v)) setFormErrors((prev) => ({ ...prev, email: "Must be a valid email address" }));
      else setFormErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
    }
    // Trigger duplicate check on name/DOB changes with debounce
    if (["first_name", "last_name", "middle_name", "date_of_birth"].includes(key)) {
      setDupChecked(false);
      if (dupTimerRef.current) clearTimeout(dupTimerRef.current);
      dupTimerRef.current = setTimeout(() => checkDuplicates(next), 600);
    }
    // Recompute sector warnings when related fields change
    if (["date_of_birth", "civil_status", "livelihood_type", "pwd_id"].includes(key)) {
      setSectorWarnings(computeSectorWarnings(sectors, next));
    }
  };
  const f = (key: string) => String(form[key] || "");
  const fb = (key: string) => !!form[key];

  const dupOk = (key: string) => dupChecked && dupMatches.length === 0 && !!f(key);

  // ── Submit Handler ──
  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    // Required fields
    if (!f("first_name").trim()) errors.first_name = "First name is required";
    if (!f("last_name").trim()) errors.last_name = "Last name is required";
    if (!f("sex")) errors.sex = "Sex is required";
    if (!f("date_of_birth")) errors.date_of_birth = "Date of birth is required";
    if (!f("place_of_birth").trim()) errors.place_of_birth = "Place of birth is required";
    if (!f("civil_status")) errors.civil_status = "Civil status is required";
    if (!f("resident_type")) errors.resident_type = "Residence type is required";

    // Tanga-proof: Date of Birth must not be in the future
    if (f("date_of_birth")) {
      const dob = new Date(f("date_of_birth") + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dob > today) errors.date_of_birth = "Date of birth cannot be in the future";
      // Must be at least 1 day old (no same-day — use hospital records for newborns)
      const ageDays = Math.floor((today.getTime() - dob.getTime()) / 86400000);
      if (ageDays < 0) errors.date_of_birth = "Date of birth cannot be in the future";
    }

    // Tanga-proof: Height bounds (30cm to 250cm)
    const height = f("height_cm");
    if (height && (parseFloat(height) < 30 || parseFloat(height) > 250)) {
      errors.height_cm = "Height must be between 30 and 250 cm";
    }

    // Tanga-proof: Weight bounds (1kg to 500kg)
    const weight = f("weight_kg");
    if (weight && (parseFloat(weight) < 1 || parseFloat(weight) > 500)) {
      errors.weight_kg = "Weight must be between 1 and 500 kg";
    }

    // Mobile validation (optional but must be valid if filled)
    const mobile = f("mobile_number").replace(/\s/g, "");
    if (mobile && !isValidPHMobile(mobile)) errors.mobile_number = "Must be a valid PH number (09XX XXX XXXX)";

    // Email validation (optional but must be valid if filled)
    const email = f("email");
    if (email && !isValidEmail(email)) errors.email = "Must be a valid email address";

    // Tanga-proof: Government ID format hints
    const tin = f("tin_number").replace(/[^0-9]/g, "");
    if (tin && tin.length !== 9 && tin.length !== 12) errors.tin_number = "TIN must be 9 or 12 digits";
    const sss = f("sss_gsis_number").replace(/[^0-9]/g, "");
    if (sss && sss.length < 7) errors.sss_gsis_number = "SSS/GSIS number too short";
    const philhealth = f("philhealth_number").replace(/[^0-9]/g, "");
    if (philhealth && philhealth.length < 8) errors.philhealth_number = "PhilHealth number too short";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const firstMsg = errors[firstKey];
      const el = document.querySelector(`[name="${firstKey}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      const count = Object.keys(errors).length;
      addToast({
        type: "error",
        title: count > 1 ? `${count} fields need attention` : "Required field missing",
        message: count > 1 ? `${firstMsg} (+ ${count - 1} more)` : firstMsg,
        duration: 5000,
      });
      return;
    }

    // Block if duplicate detected and not dismissed (skip in edit mode -- already registered)
    if (mode !== "edit" && dupMatches.length > 0 && !dupDismissed) {
      setDupModal(true);
      return;
    }

    setSubmitting(true);

    // Build API payload
    const payload: Record<string, unknown> = {};

    // Flat string/boolean fields -> map directly
    const directFields = [
      "first_name", "last_name", "middle_name", "extension_name",
      "mothers_maiden_name", "date_of_birth", "place_of_birth",
      "citizenship", "religion", "ethnicity", "blood_type",
      "complexion", "email", "mobile_number",
      "purok", "house_block_lot", "street",
      "zip_code",
      "occupation", "employer", "monthly_income_range", "source_of_income",
      "livelihood_type", "skills", "highest_education",
      "health_history", "barangay_position", "barangay_role_start", "barangay_role_end",
      "transfer_date",
      "sector_other", "other_remarks",
      "emergency_contact_name", "emergency_contact_phone",
      "emergency_contact_address", "emergency_contact_relationship",
      "photo_file_id",
      // Gov IDs (plain names -- backend encrypts them)
      "philhealth_number", "philhealth_expiry",
      "sss_gsis_number", "sss_gsis_expiry",
      "pagibig_number", "pagibig_expiry",
      "tin_number", "tin_expiry",
      "pwd_id", "pwd_id_expiry",
      "senior_citizen_id",
      // Contact
      "telephone",
      // Voter & Household
      "voter_precinct_number", "last_voted_year", "relationship_to_head",
    ];
    for (const key of directFields) {
      const val = f(key);
      if (val) payload[key] = val;
    }

    // Sex: normalize to lowercase (backend expects male/female)
    const sexVal = f("sex").toLowerCase();
    if (sexVal) payload.sex = sexVal;

    // Civil status: normalize to lowercase (backend CivilStatus enum expects lowercase)
    const civilVal = f("civil_status").toLowerCase();
    if (civilVal) payload.civil_status = civilVal;

    // Resident type: normalize to lowercase
    const residentType = f("resident_type").toLowerCase();
    // Backend enum: permanent | transient | transferee (all lowercase)
    const residentTypeMap: Record<string, string> = { permanent: "permanent", transient: "transient", transferee: "transferee" };
    if (residentType) payload.resident_type = residentTypeMap[residentType] ?? "permanent";

    // Boolean fields — is_voter and is_head_of_household use (v === "yes") conversion in FRadio onChange,
    // so they arrive as actual booleans. is_organ_donor FRadio also stores as boolean via onChange.
    if (form.is_voter !== undefined) payload.is_voter = !!form.is_voter;
    if (form.is_resident_voter !== undefined) payload.is_resident_voter = !!form.is_resident_voter;
    if (form.is_head_of_household !== undefined) payload.is_head_of_household = !!form.is_head_of_household;
    if (form.is_organ_donor !== undefined) payload.is_organ_donor = !!form.is_organ_donor;

    // Status — only include in edit mode (update can change status; create always defaults to active)
    if (mode === "edit") {
      const statusVal = f("status");
      if (statusVal) payload.status = statusVal;
    }

    // Numeric fields — must be sent as numbers, not strings
    const hCm = f("height_cm");
    if (hCm) payload.height_cm = parseFloat(hCm);
    const wKg = f("weight_kg");
    if (wKg) payload.weight_kg = parseFloat(wKg);
    const lat = f("latitude");
    if (lat) payload.latitude = parseFloat(lat);
    const lng = f("longitude");
    if (lng) payload.longitude = parseFloat(lng);

    // JSONB arrays — always send (even empty) so edit correctly clears removed entries
    payload.education_entries = eduEntries.filter((e) => e.level);
    payload.work_entries = workEntries.filter((e) => e.position);
    payload.business_entries = businessEntries.filter((e) => e.business_name);

    // Sectors — always send (even empty) so edit correctly clears removed sector tags
    payload.sectors = sectors;

    try {
      if (mode === "edit") {
        const residentId = String(form["id"] || "");
        if (!residentId) throw new Error("Resident ID is missing. Cannot save changes.");
        const result = await api.residents.update(residentId, payload);
        setSubmitting(false);
        // Reload updated resident in detail modal, go back to list
        setMode("list");
        setViewResident(result.resident);
        addToast({
          type: "success",
          title: "Resident Updated Successfully",
          message: result.resident.last_name + ", " + result.resident.first_name + " — profile saved.",
          duration: 6000,
        });
      } else {
        const result = await api.residents.create(payload);
        setSubmitting(false);
        // Go back to list (triggers fetchResidents via useEffect)
        setMode("list");
        // Open the new resident detail modal immediately (no extra round trip)
        setViewResident(result.resident);
        addToast({
          type: "success",
          title: "Resident Registered Successfully",
          message: "Barangay ID: " + result.resident_number,
          duration: 8000,
        });
      }
    } catch (err) {
      setSubmitting(false);
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        // Map API validation errors to form field errors
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(apiErr.errors)) {
          mapped[field] = messages[0];
        }
        setFormErrors(mapped);
        addToast({ type: "error", title: "Validation Failed", message: apiErr.message || "Please fix the errors.", duration: 5000 });
      } else if (apiErr.message?.includes("already exists")) {
        // Duplicate blocked by backend
        addToast({ type: "error", title: "Duplicate Detected", message: apiErr.message, duration: 6000 });
      } else {
        const isEdit = mode === "edit";
        addToast({ type: "error", title: isEdit ? "Update Failed" : "Registration Failed", message: apiErr.message || "Something went wrong.", duration: 5000 });
      }
    }
  };

  const openCreate = () => {
    setForm({ citizenship: "Filipino", resident_type: "Permanent", status: "active" });
    setSectors([]);
    setEduEntries([{ ...emptyEdu }]);
    setWorkEntries([{ ...emptyWork }]);
    setBusinessEntries([]);
    setOpenSections({ other: false, education: false, work: false, govinfo: false, emergency: false, biometric: false });
    setPhotoPreview(null);
    setPhotoAnalysis(null);
    setDupMatches([]);
    setDupChecked(false);
    setDupModal(false);
    setDupDismissed(false);
    setMode("create");
  };

  const openViewResident = useCallback(async (id: string) => {
    setViewLoading(true);
    try {
      const detail = await api.residents.get(id);
      setViewResident(detail);
    } catch {
      addToast({ type: "error", title: "Failed to load resident details" });
    } finally {
      setViewLoading(false);
    }
  }, [addToast]);

  const openEdit = (r: ResidentDetail) => {
    // Normalize API values before storing in form state.
    // Laravel toArray() returns:
    //   - dates as ISO 8601 with time ("1990-03-15T00:00:00+00:00") — strip to YYYY-MM-DD
    //   - enums as their backing value (lowercase: "male", "single", "permanent")
    //   - FSelect options use title-case ("Male", "Single", "Permanent") — must match exactly
    //   - text fields may be mixed/lower case from V4 migration — uppercase to match FInput forceUpper
    const dateOnly = (v: unknown): string => {
      if (!v) return "";
      const s = String(v);
      return s.includes("T") ? s.split("T")[0] : s;
    };
    const cap = (v: unknown): string => {
      if (!v) return "";
      const s = String(v);
      return s.charAt(0).toUpperCase() + s.slice(1);
    };
    // All FInput type="text" fields force uppercase via onChange — ensure form state matches
    const upper = (v: unknown): string => {
      if (!v) return "";
      return String(v).toUpperCase();
    };
    const civilStatusMap: Record<string, string> = {
      single: "Single", married: "Married", widowed: "Widowed",
      separated: "Separated", divorced: "Divorced", annulled: "Annulled",
      "live-in": "Live-in",
    };
    const residentTypeMap: Record<string, string> = {
      permanent: "Permanent", transient: "Transient", transferee: "Transferee",
    };

    setForm({
      ...r,
      // Uppercase all text input fields to match FInput forceUpper behavior
      first_name: upper(r.first_name),
      middle_name: upper(r.middle_name),
      last_name: upper(r.last_name),
      mothers_maiden_name: upper((r as unknown as Record<string, unknown>).mothers_maiden_name),
      place_of_birth: upper(r.place_of_birth),
      citizenship: upper((r as unknown as Record<string, unknown>).citizenship),
      religion: upper((r as unknown as Record<string, unknown>).religion),
      ethnicity: upper((r as unknown as Record<string, unknown>).ethnicity),
      occupation: upper((r as unknown as Record<string, unknown>).occupation),
      employer: upper((r as unknown as Record<string, unknown>).employer),
      source_of_income: upper((r as unknown as Record<string, unknown>).source_of_income),
      livelihood_type: upper((r as unknown as Record<string, unknown>).livelihood_type),
      skills: upper((r as unknown as Record<string, unknown>).skills),
      health_history: upper((r as unknown as Record<string, unknown>).health_history),
      barangay_position: upper(r.barangay_position),
      sector_other: upper((r as unknown as Record<string, unknown>).sector_other),
      other_remarks: upper((r as unknown as Record<string, unknown>).other_remarks),
      emergency_contact_name: upper(r.emergency_contact_name),
      emergency_contact_address: upper(r.emergency_contact_address),
      emergency_contact_relationship: upper(r.emergency_contact_relationship),
      house_block_lot: upper((r as unknown as Record<string, unknown>).house_block_lot),
      street: upper((r as unknown as Record<string, unknown>).street),
      purok: upper((r as unknown as Record<string, unknown>).purok),
      // Normalize enums to title-case to match FSelect options
      sex: cap(r.sex),
      civil_status: civilStatusMap[String(r.civil_status || "").toLowerCase()] || cap(r.civil_status),
      resident_type: residentTypeMap[String(r.resident_type || "").toLowerCase()] || cap(r.resident_type),
      // Normalize all date fields: strip ISO time component → YYYY-MM-DD
      date_of_birth: dateOnly(r.date_of_birth),
      registration_date: dateOnly((r as unknown as Record<string, unknown>).registration_date),
      transfer_date: dateOnly((r as unknown as Record<string, unknown>).transfer_date),
      barangay_role_start: dateOnly(r.barangay_role_start),
      barangay_role_end: dateOnly(r.barangay_role_end),
      philhealth_expiry: dateOnly(r.philhealth_expiry),
      sss_gsis_expiry: dateOnly(r.sss_gsis_expiry),
      pagibig_expiry: dateOnly(r.pagibig_expiry),
      tin_expiry: dateOnly(r.tin_expiry),
      pwd_id_expiry: dateOnly(r.pwd_id_expiry),
    } as unknown as Record<string, string | boolean>);
    setSectors(r.sectoral_tags?.map(t => t.sector) || []);
    // Uppercase text fields in JSONB entry arrays too
    const upperEdu = (e: EduEntry): EduEntry => ({
      ...e, course: upper(e.course), school: upper(e.school),
    });
    const upperWork = (e: WorkEntry): WorkEntry => ({
      ...e, position: upper(e.position), company: upper(e.company), description: upper(e.description),
    });
    const upperBiz = (e: BusinessEntry): BusinessEntry => ({
      ...e,
      business_name: upper(e.business_name),
      business_type: upper(e.business_type),
      business_address: upper(e.business_address),
      business_permit_no: upper(e.business_permit_no),
      dti_sec_no: upper(e.dti_sec_no),
      description: upper(e.description),
    });
    setEduEntries((r.education_details as EduEntry[])?.length ? (r.education_details as EduEntry[]).map(upperEdu) : [{ ...emptyEdu }]);
    setWorkEntries((r.work_history as WorkEntry[])?.length ? (r.work_history as WorkEntry[]).map(upperWork) : [{ ...emptyWork }]);
    setBusinessEntries(((r.business_details as BusinessEntry[]) || []).map(upperBiz));
    setOpenSections({ other: true, education: true, work: true, govinfo: true, emergency: true, biometric: true });
    // Pre-populate photo preview from existing photo_url so the photo area isn't blank in edit mode
    const existingPhoto = r.photo_url ? resolvePhotoUrl(r.photo_url) : null;
    setPhotoPreview(existingPhoto ?? null);
    setPhotoAnalysis(null);
    // Clear any stale duplicate detection state from previous form session
    setDupMatches([]);
    setDupChecked(false);
    setDupModal(false);
    setDupDismissed(false);
    setMode("edit");
    setViewResident(null);
  };

  const openDelete = () => { setShowDelete(true); setViewResident(null); };

  /**
   * Generate PDF for a resident and open it in a new browser tab.
   * Records print in audit log + documents tab on the backend.
   */
  const handlePrint = useCallback(async (residentId: string) => {
    if (printingId) return; // prevent double-trigger
    setPrintingId(residentId);
    try {
      const blob = await api.residents.print(residentId);
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // Revoke the object URL after a short delay to free memory
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      addToast({ type: "success", title: "Record PDF Opened", message: "Check your new browser tab.", duration: 4000 });
    } catch (err) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Print Failed", message: e?.message || "Could not generate PDF. Try again." });
    } finally {
      setPrintingId(null);
    }
  }, [printingId, addToast]);

  // ── Smart Sector Sync ──
  // Auto-sync sectors with other form fields to prevent contradictions.
  // Sector warnings appear inline when a conflict is detected.
  const [sectorWarnings, setSectorWarnings] = useState<Record<string, string>>({});

  const getAgeFromDob = (dob: string) => {
    if (!dob) return null;
    const d = new Date(dob + "T00:00:00");
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  const computeSectorWarnings = useCallback((currentSectors: string[], formData: Record<string, string | boolean>) => {
    const warnings: Record<string, string> = {};
    const age = getAgeFromDob(String(formData.date_of_birth || ""));
    const civil = String(formData.civil_status || "");
    const livelihood = String(formData.livelihood_type || "");

    // Senior Citizen: must be 60+
    if (currentSectors.includes("Senior Citizen") && age !== null && age < 60) {
      warnings["Senior Citizen"] = `Age is ${age}. Senior Citizen requires 60+.`;
    }
    // PWD: should have PWD ID filled
    if (currentSectors.includes("PWD") && !String(formData.pwd_id || "").trim()) {
      warnings["PWD"] = "Fill in PWD ID under Government Info.";
    }
    // Solo Parent: married is contradictory
    if (currentSectors.includes("Solo Parent") && civil === "Married") {
      warnings["Solo Parent"] = "Civil status is Married. Verify if Solo Parent applies.";
    }
    // Student vs livelihood
    if (currentSectors.includes("Student") && livelihood && livelihood !== "Student" && livelihood !== "") {
      warnings["Student"] = `Livelihood is "${livelihood}". Consider "Working Student" instead.`;
    }
    // OFW vs livelihood
    if (currentSectors.includes("OFW") && livelihood && livelihood !== "OFW" && livelihood !== "") {
      warnings["OFW"] = `Livelihood is "${livelihood}". Set Livelihood Type to "OFW" to match.`;
    }
    return warnings;
  }, []);

  const toggleSector = (s: string) => {
    setSectors((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      // Recompute warnings with updated sectors
      const w = computeSectorWarnings(next, form);
      setSectorWarnings(w);
      return next;
    });
  };

  // Auto-suggest sectors from other fields (non-intrusive: add info badge, don't force)
  const sectorSuggestions = (() => {
    const suggestions: { sector: string; reason: string }[] = [];
    const age = getAgeFromDob(f("date_of_birth"));
    if (age !== null && age >= 60 && !sectors.includes("Senior Citizen")) {
      suggestions.push({ sector: "Senior Citizen", reason: `Age is ${age}` });
    }
    if (f("pwd_id") && !sectors.includes("PWD")) {
      suggestions.push({ sector: "PWD", reason: "PWD ID is filled" });
    }
    if (f("livelihood_type") === "Student" && !sectors.includes("Student") && !sectors.includes("Working Student")) {
      suggestions.push({ sector: "Student", reason: "Livelihood is Student" });
    }
    if (f("livelihood_type") === "OFW" && !sectors.includes("OFW")) {
      suggestions.push({ sector: "OFW", reason: "Livelihood is OFW" });
    }
    return suggestions;
  })();


  // ── Map (Leaflet) — center from barangay record (set during onboarding). Fallback: Manila. ──
  const _bLat = user?.barangay?.latitude ? parseFloat(String(user.barangay.latitude)) : NaN;
  const _bLng = user?.barangay?.longitude ? parseFloat(String(user.barangay.longitude)) : NaN;
  const barangayLat = _bLat >= 4 && _bLat <= 21 ? _bLat : 14.5995;
  const barangayLng = _bLng >= 116 && _bLng <= 127 ? _bLng : 120.9842;

  // Geocode address text → lat/lng using Nominatim (free, no API key required).
  // Leaflet handles map display; geocoding is a plain HTTP call that updates form state.
  const geocodeAddress = useCallback(async (addressStr: string) => {
    if (!addressStr.trim()) return;
    setMapLocating(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&countrycodes=ph&limit=1`,
        { headers: { "User-Agent": "BCMP-Kapitan/1.0" } }
      );
      const data = await res.json();
      if (data?.[0]) {
        updateForm("latitude", parseFloat(data[0].lat).toFixed(7));
        updateForm("longitude", parseFloat(data[0].lon).toFixed(7));
      }
    } catch { /* silent fail — user can pin manually */ }
    finally { setMapLocating(false); }
  }, [updateForm]);

  // Auto-geocode when address fields change (debounced 1.5s)
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (mode !== "create") return;
    const parts = [
      f("house_block_lot"), f("street"), f("purok"),
      tenantConfig.barangay, tenantConfig.city_municipality,
      tenantConfig.province
    ].filter(Boolean).map(String);
    if (!(f("purok") || f("street"))) return;
    const address = parts.join(", ");
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(() => geocodeAddress(address), 1500);
    return () => { if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f("house_block_lot"), f("street"), f("purok"), mode]);

  // Measure form container height whenever mode enters create/edit or window resizes.
  // This drives the contained-scroll layout so the action bar never overlaps the map.
  useEffect(() => {
    if (mode !== "create" && mode !== "edit") return;
    const measure = () => {
      if (!formContainerRef.current) return;
      const top = formContainerRef.current.getBoundingClientRect().top;
      setFormContainerHeight(window.innerHeight - top);
    };
    // rAF lets the browser finish the first layout paint before measuring
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [mode]);

  // ── Sorting / Pagination (server-side — residents already filtered by API) ──
  const totalPages = Math.max(1, listLastPage);
  const safePage = Math.min(page, totalPages);
  const paged = residents;
  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  // Real stats from API — full barangay population, not just the current page
  const totalPopulation = residentStats?.total_residents ?? listTotal;
  const maleCount = residentStats?.gender_distribution?.male ?? residentStats?.gender_distribution?.Male ?? 0;
  const femaleCount = residentStats?.gender_distribution?.female ?? residentStats?.gender_distribution?.Female ?? 0;
  const householdCount = residentStats?.total_households ?? 0;
  const voterCount = residentStats?.voter_count ?? 0;
  const pwdCount = residentStats?.pwd_count ?? 0;
  const seniorCount = residentStats?.senior_citizen_count ?? 0;
  const activeCount = residentStats?.active_count ?? 0;
  const deceasedCount = residentStats?.deceased_count ?? 0;
  const nonActiveCount = (residentStats?.transferred_count ?? 0) + (residentStats?.archived_count ?? 0);

  // ══════════════════════════════════════════════════════════
  // ── REGISTRATION FORM (V3-style collapsible + V4 fields)
  // ══════════════════════════════════════════════════════════

  if (mode === "create" || mode === "edit") {
    return (
      // Contained-scroll form: height fills from this element to the viewport bottom.
      // The action bar is a natural shrink-0 sibling — never fixed, never overlaps the map.
      <div
        ref={formContainerRef}
        className="flex flex-col -m-6"
        style={{ height: formContainerHeight ? `${formContainerHeight}px` : "calc(100dvh - 120px)" }}
      >
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header: Back + Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setMode("list")} className="text-xs text-accent-text hover:underline">&larr; Back to list</button>
            </div>
            <h1 className="text-xl font-bold text-foreground">{mode === "create" ? "CREATE RESIDENT" : "EDIT RESIDENT"}</h1>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="font-medium">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" })}</div>
            <div className="text-lg font-bold text-foreground">{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="form-gradient-bg rounded-2xl p-6 space-y-3 relative">
          {/* 1. Personal Information and Photo (always visible, not collapsible) */}
          <div className="relative z-[1]">
            <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-white glass-accordion shadow-lg">
              <User className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1 text-sm font-bold uppercase tracking-wider">Personal Information and Photo</span>
            </div>
            <div className="glass-section rounded-b-xl mt-px px-5 pt-5 pb-4">
              <div className="space-y-5">
                <div className="flex items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <FInput label="First Name" name="first_name" required placeholder="e.g. Juan" value={f("first_name")} onChange={updateForm} valid={dupOk("first_name")} error={formErrors.first_name} />
                      <FInput label="Middle Name" name="middle_name" placeholder="e.g. Santiago" value={f("middle_name")} onChange={updateForm} valid={dupOk("middle_name")} />
                      <FInput label="Last Name" name="last_name" required placeholder="e.g. Dela Cruz" value={f("last_name")} onChange={updateForm} valid={dupOk("last_name")} error={formErrors.last_name} />
                      <FSelect label="Extension" name="extension_name" options={extensions} value={f("extension_name")} onChange={updateForm} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <FSelect label="Sex" name="sex" options={["", "Male", "Female"]} required value={f("sex")} onChange={updateForm} error={formErrors.sex} />
                      <FDatePicker label="Date of Birth" name="date_of_birth" required value={f("date_of_birth")} onChange={updateForm} valid={dupOk("date_of_birth")} error={formErrors.date_of_birth} />
                      <FCombobox label="Place of Birth" name="place_of_birth" required entries={placeOfBirthEntries} value={f("place_of_birth")} onChange={updateForm} onEntriesChange={setPlaceOfBirthEntries} />
                      <FSelect label="Civil Status" name="civil_status" options={["", ...civilStatuses]} required value={f("civil_status")} onChange={updateForm} error={formErrors.civil_status} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <FInput label="Contact No." name="mobile_number" type="tel" placeholder="09XX XXX XXXX" value={f("mobile_number")} onChange={updateForm} maxLength={13} error={formErrors.mobile_number} />
                      <FInput label="Email Address" name="email" type="email" placeholder="name@example.com" value={f("email")} onChange={updateForm} error={formErrors.email} />
                      <FSelect label="Residence Type" name="resident_type" options={residentTypes} required value={f("resident_type")} onChange={updateForm} error={formErrors.resident_type} />
                      <FRadio label="Head of Household?" name="is_head_of_household" value={fb("is_head_of_household") ? "yes" : "no"}
                        options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                        onChange={(n, v) => updateForm(n, v === "yes")} />
                    </div>
                    {/* Record Status — edit mode only */}
                    {mode === "edit" && (
                      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Record Status</p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                          <div>
                            <FSelect label="Status" name="status"
                              options={["active", "inactive", "deceased", "transferred"]}
                              value={f("status") || "active"}
                              onChange={updateForm} />
                            {f("status") === "deceased" && (
                              <p className="text-[10px] text-red-500 mt-1">Removes from active population count.</p>
                            )}
                          </div>
                          {f("status") === "transferred" && (
                            <FDatePicker label="Transfer Date" name="transfer_date"
                              value={f("transfer_date")} onChange={updateForm} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Smart Photo Area */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                    {/* Mobile camera input: capture="environment" opens back camera by default, user can flip to front */}
                    <input ref={photoCaptureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
                    <div className={cn(
                      "w-36 h-44 rounded-xl bg-muted border-2 flex flex-col items-center justify-center overflow-hidden relative",
                      photoAnalysis?.status === "good" ? "border-green-400" :
                      photoAnalysis?.status === "poor" ? "border-red-400" :
                      photoPreview ? "border-amber-400" : "border-dashed border-border"
                    )}>
                      {cameraActive ? (
                        <>
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                          {/* Face Guide Overlay — oval silhouette */}
                          <div className="absolute inset-0 pointer-events-none">
                            <svg viewBox="0 0 144 176" className="w-full h-full" preserveAspectRatio="none">
                              <defs>
                                <mask id="face-guide-mask">
                                  <rect width="144" height="176" fill="white" />
                                  <ellipse cx="72" cy="78" rx="38" ry="50" fill="black" />
                                </mask>
                              </defs>
                              <rect width="144" height="176" fill="rgba(0,0,0,0.35)" mask="url(#face-guide-mask)" />
                              <ellipse cx="72" cy="78" rx="38" ry="50" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
                            </svg>
                            <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-white font-medium drop-shadow-sm">
                              Align face inside oval
                            </span>
                          </div>
                        </>
                      ) : photoPreview ? (
                        <>
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                          {/* Analysis Status Badge */}
                          {photoAnalyzing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                            </div>
                          )}
                          {photoAnalysis && !photoAnalyzing && (
                            <div className={cn(
                              "absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm",
                              photoAnalysis.status === "good" ? "bg-green-500 text-white" :
                              photoAnalysis.status === "poor" ? "bg-red-500 text-white" :
                              "bg-amber-500 text-white"
                            )}>
                              {photoAnalysis.status === "good" ? <CheckCircle className="h-2.5 w-2.5" /> :
                               photoAnalysis.status === "poor" ? <AlertTriangle className="h-2.5 w-2.5" /> :
                               <AlertTriangle className="h-2.5 w-2.5" />}
                              {photoAnalysis.status === "good" ? "Good" : photoAnalysis.status === "poor" ? "Poor" : "Fair"}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* BCMP logo watermark */}
                          <img
                            src="/kapitanph_logo.png?v=2"
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                            style={{ opacity: 0.18, mixBlendMode: "multiply" }}
                          />
                          <User className="w-10 h-10 text-muted-foreground/40 relative z-10" />
                          <span className="text-[10px] text-muted-foreground mt-1 relative z-10">No photo</span>
                        </>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-1.5 w-36">
                      {cameraActive ? (
                        <>
                          <button type="button" onClick={capturePhoto}
                            className="flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-colors hover:opacity-90" style={{ background: "var(--accent-primary)" }}>
                            Capture
                          </button>
                          <button type="button" onClick={stopCamera}
                            className="px-2 py-1.5 text-[11px] font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Desktop: getUserMedia webcam | Mobile: hidden (use native capture instead) */}
                          <button type="button" onClick={startCamera} disabled={cameraLoading}
                            className="hidden md:flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--accent-primary)" }}>
                            {cameraLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            {cameraLoading ? "Opening..." : "Camera"}
                          </button>
                          {/* Mobile: opens native camera (back-facing default, user can flip to front) */}
                          <button type="button" onClick={() => photoCaptureRef.current?.click()}
                            className="flex md:hidden flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-colors hover:opacity-90" style={{ background: "var(--accent-primary)" }}>
                            <Camera className="h-4 w-4" /> Take Photo
                          </button>
                          <button type="button" onClick={() => photoInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                            <Upload className="h-4 w-4" /> Upload
                          </button>
                        </>
                      )}
                    </div>
                    {/* Camera Error Message */}
                    {cameraError && (
                      <div className="w-36 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                        <p className="text-[10px] text-red-600 dark:text-red-400 leading-tight flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-px" />
                          <span>{cameraError}</span>
                        </p>
                        <button type="button" onClick={() => setCameraError(null)}
                          className="mt-1.5 w-full text-[9px] font-medium text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                          Dismiss
                        </button>
                      </div>
                    )}
                    {/* Smart Feedback Messages */}
                    {photoAnalysis && !photoAnalyzing && !cameraActive && (
                      <div className="w-36 space-y-1">
                        {/* Quality issues (red/amber) */}
                        {photoAnalysis.issues.map((issue, i) => (
                          <p key={i} className={cn(
                            "text-[10px] flex items-start gap-1",
                            photoAnalysis.status === "poor" ? "text-red-500" : "text-amber-600 dark:text-amber-400"
                          )}>
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0 mt-px" />
                            <span>{issue}</span>
                          </p>
                        ))}
                        {/* Face detection results */}
                        {photoAnalysis.faceDetected && (
                          <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5 shrink-0" /> Face detected, auto-cropped
                          </p>
                        )}
                        {/* No-face note — prominent amber box, NOT a blocker */}
                        {photoAnalysis.notes.length > 0 && (
                          <div className="mt-1 px-2 py-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                            {photoAnalysis.notes.map((note, i) => (
                              <p key={i} className="text-[9px] text-amber-700 dark:text-amber-300 leading-tight">
                                {note}
                              </p>
                            ))}
                          </div>
                        )}
                        {/* All good message */}
                        {photoAnalysis.issues.length === 0 && photoAnalysis.notes.length === 0 && (
                          <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5 shrink-0" /> Photo looks great
                          </p>
                        )}
                      </div>
                    )}
                    {/* Remove Button */}
                    {photoPreview && !cameraActive && !photoAnalyzing && (
                      <button type="button" onClick={() => { setPhotoPreview(null); setPhotoAnalysis(null); updateForm("photo_file_id", ""); }}
                        className="text-[10px] text-red-500 hover:underline">
                        {photoAnalysis?.status === "poor" ? "Retake Photo" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Duplicate Match Modal */}
          <Modal open={dupModal} onClose={() => setDupModal(false)} title="" size="lg">
            <div className="space-y-5">
              {/* Header with icon */}
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Possible Duplicate Detected</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We found {dupMatches.length} existing record{dupMatches.length !== 1 ? "s" : ""} with similar information.
                    Review the match{dupMatches.length !== 1 ? "es" : ""} below before proceeding.
                  </p>
                </div>
              </div>

              {/* Match cards */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dupMatches.map((r) => (
                  <div key={r.id} className="rounded-xl border-2 border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0",
                          r.sex === "female" ? "bg-pink-500" : "bg-blue-500")}>
                          {r.first_name[0]}{r.last_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{r.full_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.resident_number} &middot; {r.sex} &middot; Age {r.age} &middot; DOB: {r.date_of_birth} &middot; Purok {r.purok || "N/A"}</p>
                          {r.mobile_number && <p className="text-xs text-muted-foreground">{r.mobile_number}</p>}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <button onClick={() => { setDupModal(false); setMode("list"); }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors hover:opacity-90 flex items-center gap-1.5" style={{ background: "var(--accent-primary)" }}>
                        <Eye className="h-4 w-4" /> View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-[11px] text-muted-foreground">
                  A resident with the same name already exists. In a barangay, one person cannot have multiple records.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => { setDupModal(false); setMode("list"); }}
                    className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                    Cancel Registration
                  </button>
                  <button onClick={() => { setDupDismissed(true); setDupModal(false); }}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors">
                    Not the Same Person — Continue
                  </button>
                </div>
              </div>
            </div>
          </Modal>

          {/* 2. Current Address (always visible, not collapsible) */}
          <div className="relative z-[1]">
            <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-white glass-accordion shadow-lg">
              <MapPin className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1 text-sm font-bold uppercase tracking-wider">Current Address</span>
            </div>
            <div className="glass-section rounded-b-xl mt-px px-5 pt-5 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <FInput label="House No. / Blk & Lot / Subdivision / Village" name="house_block_lot" placeholder="E.g. Unit 4B Blk 5 Lot 12, Villa Verde Subd. Phase 2" value={f("house_block_lot")} onChange={updateForm} />
                <FCombobox label="Purok / Sitio" name="purok" entries={purokEntries} value={f("purok")}
                  onChange={updateForm} onSubmit={(val) => submitEntry(purokEntries, setPurokEntries, val)} />
                <FCombobox label="Street / Road" name="street" entries={streetEntries} value={f("street")}
                  onChange={updateForm} onSubmit={(val) => submitEntry(streetEntries, setStreetEntries, val)} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Barangay</label>
                  <input type="text" value={tenantConfig.barangay} readOnly tabIndex={-1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground font-medium cursor-default opacity-80" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">City / Municipality</label>
                  <input type="text" value={tenantConfig.city_municipality} readOnly tabIndex={-1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground font-medium cursor-default opacity-80" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Province</label>
                  <input type="text" value={tenantConfig.province} readOnly tabIndex={-1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground font-medium cursor-default opacity-80" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Zip Code</label>
                  <input type="text" value={tenantConfig.zip_code} readOnly tabIndex={-1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground font-medium cursor-default opacity-80" />
                </div>
              </div>

              {/* Smart Map — Leaflet (no SDK side-effects, safe to click freely) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Pin Location on Map</label>
                    {mapLocating && (
                      <span className="text-[10px] text-accent-text flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Auto-locating...
                      </span>
                    )}
                  </div>
                  {f("latitude") && f("longitude") && !mapLocating && (
                    <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {parseFloat(String(f("latitude"))).toFixed(6)}, {parseFloat(String(f("longitude"))).toFixed(6)}
                    </span>
                  )}
                </div>
                <ResidentPinMap
                  key={`map-${barangayLat}-${barangayLng}`}
                  lat={f("latitude") ? parseFloat(String(f("latitude"))) : null}
                  lng={f("longitude") ? parseFloat(String(f("longitude"))) : null}
                  centerLat={barangayLat}
                  centerLng={barangayLng}
                  onPin={(lat, lng) => {
                    updateForm("latitude", lat.toFixed(7));
                    updateForm("longitude", lng.toFixed(7));
                  }}
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Map auto-updates as you fill in the address above. Click the map or drag the pin to adjust the exact location.
                </p>
              </div>
            </div>
            </div>
          </div>

          {/* 3. Other Information */}
          <Section icon={<Globe className="h-4 w-4" />} title="Other Information"
            open={openSections.other} onToggle={() => toggleSection("other")}>
            <div className="space-y-5">
              {/* Identity */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identity</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <FCombobox label="Citizenship" name="citizenship" entries={citizenshipEntries} value={f("citizenship")}
                    onChange={updateForm} onSubmit={(val) => submitEntry(citizenshipEntries, setCitizenshipEntries, val)} />
                  <FCombobox label="Religion" name="religion" entries={religionEntries} value={f("religion")}
                    onChange={updateForm} onSubmit={(val) => submitEntry(religionEntries, setReligionEntries, val)} />
                  <FCombobox label="Ethnicity" name="ethnicity" entries={ethnicityEntries} value={f("ethnicity")}
                    onChange={updateForm} onSubmit={(val) => submitEntry(ethnicityEntries, setEthnicityEntries, val)} />
                  <FInput label="Mother's Maiden Name" name="mothers_maiden_name" placeholder="e.g. Santos" value={f("mothers_maiden_name")} onChange={updateForm} />
                </div>
              </div>

              {/* Physical */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Physical</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <FSelect label="Blood Type" name="blood_type" options={bloodTypes} value={f("blood_type")} onChange={updateForm} />
                  <FInput label="Height (cm)" name="height_cm" type="number" placeholder="e.g. 165" value={f("height_cm")} onChange={updateForm} error={formErrors.height_cm} />
                  <FInput label="Weight (kg)" name="weight_kg" type="number" placeholder="e.g. 60" value={f("weight_kg")} onChange={updateForm} error={formErrors.weight_kg} />
                  <FSelect label="Complexion" name="complexion" options={complexionOptions} value={f("complexion")} onChange={updateForm} />
                </div>
              </div>

              {/* Sector / Organization */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sector / Organization</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-1.5 gap-x-2">
                  {sectorOptions.map((s) => (
                    <div key={s}>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={sectors.includes(s)} onChange={() => toggleSector(s)}
                          className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring" />
                        <span className={cn("text-sm transition-colors",
                          sectorWarnings[s] ? "text-amber-600 dark:text-amber-400 font-medium" : "text-foreground group-hover:text-accent-text"
                        )}>{s}</span>
                        {sectorWarnings[s] && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                      </label>
                      {sectorWarnings[s] && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 ml-6 mt-0.5 leading-tight">{sectorWarnings[s]}</p>
                      )}
                    </div>
                  ))}
                  {/* Others with smart combobox */}
                  <div className="col-span-2 md:col-span-3 lg:col-span-4 mt-1">
                    <FCombobox label="Others" name="sector_other" value={f("sector_other")}
                      entries={sectorOtherEntries} onEntriesChange={setSectorOtherEntries}
                      onChange={updateForm} placeholder="Type to search or add sector/organization..." />
                  </div>
                </div>
                {/* Auto-suggestions from other fields */}
                {sectorSuggestions.length > 0 && (
                  <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                    <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-2">Suggested sectors based on form data:</p>
                    <div className="flex flex-wrap gap-2">
                      {sectorSuggestions.map(({ sector, reason }) => (
                        <button key={sector} type="button" onClick={() => toggleSector(sector)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Plus className="h-4 w-4" /> {sector} <span className="text-blue-500 dark:text-blue-400">({reason})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3">
                  <FRadio label="Organ Donor?" name="is_organ_donor" value={fb("is_organ_donor") ? "yes" : "no"}
                    options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                    onChange={(n, v) => updateForm(n, v === "yes")} />
                </div>
              </div>

              {/* Health & Skills */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Health & Skills</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Health History</label>
                      <textarea value={f("health_history")} onChange={(e) => updateForm("health_history", e.target.value.toUpperCase())} placeholder="e.g. Past illnesses, allergies, disabilities"
                        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-20 uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Skills</label>
                      <textarea value={f("skills")} onChange={(e) => updateForm("skills", e.target.value.toUpperCase())} placeholder="e.g. Carpentry, Cooking, Sewing, Driving"
                        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-20 uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Other Remarks</label>
                <textarea value={f("other_remarks")} onChange={(e) => updateForm("other_remarks", e.target.value.toUpperCase())} placeholder="e.g. Any additional notes about this resident"
                  className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-16 uppercase" />
              </div>
            </div>
          </Section>

          {/* 4. Educational Attainment */}
          <Section icon={<GraduationCap className="h-4 w-4" />} title="Educational Attainment"
            open={openSections.education} onToggle={() => toggleSection("education")}>
            <div className="space-y-4">
              {eduEntries.map((entry, idx) => {
                const { allDisabled, courseDisabled } = eduFieldRules(entry.level);
                return (
                  <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                    {eduEntries.length > 1 && (
                      <button type="button" onClick={() => setEduEntries((e) => e.filter((_, i) => i !== idx))}
                        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                    )}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <FSelect label="Level" name="level" options={educationLevels}
                        value={entry.level} onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, level: String(v) } : x))} />
                      <FCombobox label="Course / Program" name="course" entries={courseEntries} value={entry.course}
                        onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, course: String(v) } : x))}
                        onEntriesChange={setCourseEntries} disabled={courseDisabled} />
                      <FCombobox label="School / Institution" name="school" entries={schoolEntries} value={entry.school}
                        onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, school: String(v) } : x))}
                        onEntriesChange={setSchoolEntries} disabled={allDisabled} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <FSelect label="Start Year" name="start_year" options={yearOptions}
                        value={entry.start_year}
                        onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, start_year: String(v) } : x))}
                        disabled={allDisabled} />
                      <FSelect label="End Year" name="end_year" options={yearOptions}
                        value={entry.end_year}
                        onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, end_year: String(v) } : x))}
                        disabled={allDisabled || entry.currently_studying} />
                      <div className={`pt-6 ${allDisabled ? "opacity-40 pointer-events-none" : ""}`}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={entry.currently_studying}
                            onChange={(e) => setEduEntries((es) => es.map((x, i) => i === idx ? { ...x, currently_studying: e.target.checked } : x))}
                            disabled={allDisabled}
                            className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring" />
                          <span className="text-sm text-foreground">Currently studying?</span>
                        </label>
                      </div>
                    </div>
                    {allDisabled && (
                      <p className="text-xs text-muted-foreground italic">No fields to fill — no formal education selected.</p>
                    )}
                  </div>
                );
              })}
              <button type="button" onClick={() => setEduEntries((e) => [...e, { ...emptyEdu }])}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                <Plus className="h-4 w-4" /> Add another educational attainment
              </button>
            </div>
          </Section>

          {/* 5. Livelihood & Employment */}
          <Section icon={<Briefcase className="h-4 w-4" />} title="Livelihood & Employment"
            open={openSections.work} onToggle={() => toggleSection("work")}>
            <div className="space-y-5">
              {/* Livelihood Type — always visible */}
              <div className="max-w-xs">
                <FSelect label="Livelihood Type" name="livelihood_type" options={livelihoodTypes} value={f("livelihood_type")} onChange={updateForm} />
              </div>

              {/* ── EMPLOYED: occupation + income + skills + work records ── */}
              {f("livelihood_type") === "Employed" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <FCombobox label="Current Occupation" name="occupation" value={f("occupation")}
                      entries={occupationEntries} onEntriesChange={setOccupationEntries}
                      onChange={updateForm} placeholder="Type to search or add occupation..." />
                    <FSelect label="Monthly Income Range" name="monthly_income_range" options={incomeRanges} value={f("monthly_income_range")} onChange={updateForm} />
                    <FCombobox label="Skills / Specialization" name="skills" value={f("skills")}
                      entries={skillEntries} onEntriesChange={setSkillEntries}
                      onChange={updateForm} placeholder="Type to search or add skill..." />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider">Employment Records</h4>
                    {workEntries.map((entry, idx) => (
                      <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                        {workEntries.length > 1 && (
                          <button type="button" onClick={() => setWorkEntries((e) => e.filter((_, i) => i !== idx))}
                            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                        )}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          <FCombobox label="Position / Job Title" name="position"
                            value={entry.position} entries={positionEntries} onEntriesChange={setPositionEntries}
                            onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, position: String(v) } : x))}
                            placeholder="Type to search or add position..." />
                          <FCombobox label="Company / Employer" name="company"
                            value={entry.company} entries={employerEntries} onEntriesChange={setEmployerEntries}
                            onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, company: String(v) } : x))}
                            placeholder="Type to search or add employer..." />
                          <FSelect label="Type of Employment" name="employment_type" options={employmentTypeOptions}
                            value={entry.employment_type} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, employment_type: String(v) } : x))} />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          <FSelect label="Start Year" name="start_year" options={yearOptions}
                            value={entry.start_year} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, start_year: String(v) } : x))} />
                          <FSelect label="End Year (blank = current)" name="end_year" options={yearOptions}
                            value={entry.end_year} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, end_year: String(v) } : x))} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Description</label>
                          <textarea value={entry.description} onChange={(e) => setWorkEntries((es) => es.map((x, i) => i === idx ? { ...x, description: e.target.value.toUpperCase() } : x))}
                            placeholder="Brief summary of responsibilities and achievements"
                            className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-16 uppercase" />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setWorkEntries((e) => [...e, { ...emptyWork }])}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                      <Plus className="h-4 w-4" /> Add employment record
                    </button>
                  </div>
                </div>
              )}

              {/* ── OFW: work records only (no occupation/income/skills) ── */}
              {f("livelihood_type") === "OFW" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider">Employment Records (OFW)</h4>
                  {workEntries.map((entry, idx) => (
                    <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                      {workEntries.length > 1 && (
                        <button type="button" onClick={() => setWorkEntries((e) => e.filter((_, i) => i !== idx))}
                          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                      )}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FCombobox label="Position / Job Title" name="position"
                          value={entry.position} entries={positionEntries} onEntriesChange={setPositionEntries}
                          onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, position: String(v) } : x))}
                          placeholder="Type to search or add position..." />
                        <FCombobox label="Company / Employer" name="company"
                          value={entry.company} entries={employerEntries} onEntriesChange={setEmployerEntries}
                          onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, company: String(v) } : x))}
                          placeholder="Type to search or add employer..." />
                        <FSelect label="Country of Work" name="employment_type" options={["", "Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain", "Hong Kong", "Singapore", "Taiwan", "Japan", "South Korea", "Italy", "UK", "USA", "Canada", "Australia", "Other"]}
                          value={entry.employment_type} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, employment_type: String(v) } : x))} />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FSelect label="Start Year" name="start_year" options={yearOptions}
                          value={entry.start_year} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, start_year: String(v) } : x))} />
                        <FSelect label="End Year (blank = currently abroad)" name="end_year" options={yearOptions}
                          value={entry.end_year} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, end_year: String(v) } : x))} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setWorkEntries((e) => [...e, { ...emptyWork }])}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                    <Plus className="h-4 w-4" /> Add employment record
                  </button>
                </div>
              )}

              {/* ── SELF-EMPLOYED / BUSINESS OWNER: business records only ── */}
              {f("livelihood_type") === "Self-Employed / Business Owner" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider">Business / Self-Employment Records</h4>
                  {(businessEntries.length === 0 ? [{ ...emptyBusiness }] : businessEntries).map((entry, idx) => (
                    <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                      {businessEntries.length > 1 && (
                        <button type="button" onClick={() => setBusinessEntries((e) => e.filter((_, i) => i !== idx))}
                          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                      )}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FInput label="Business Name" name="business_name" placeholder="e.g. Maria's Sari-Sari Store"
                          value={entry.business_name} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, business_name: String(v) } : x); })} />
                        <FCombobox label="Business Type" name="business_type"
                          value={entry.business_type}
                          entries={businessTypeEntries} onEntriesChange={setBusinessTypeEntries}
                          onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, business_type: String(v) } : x); })}
                          placeholder="Type to search or add business type..." />
                        <FSelect label="Status" name="business_status" options={businessStatuses}
                          value={entry.status} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, status: String(v) } : x); })} />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FInput label="Business Address" name="business_address" placeholder="e.g. 123 Rizal St., Purok Sampaguita"
                          value={entry.business_address} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, business_address: String(v) } : x); })} />
                        <FInput label="Business Permit No." name="business_permit_no" placeholder="e.g. BP-2026-001"
                          value={entry.business_permit_no} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, business_permit_no: String(v) } : x); })} />
                        <FInput label="DTI / SEC Registration" name="dti_sec_no" placeholder="e.g. DTI-2026-12345"
                          value={entry.dti_sec_no} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, dti_sec_no: String(v) } : x); })} />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FSelect label="Est. Monthly Income" name="business_monthly_income" options={incomeRanges}
                          value={entry.monthly_income} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, monthly_income: String(v) } : x); })} />
                        <FSelect label="Started" name="business_start_year" options={yearOptions}
                          value={entry.start_year} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, start_year: String(v) } : x); })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description / Notes</label>
                        <textarea value={entry.description} onChange={(e) => setBusinessEntries((es) => { const arr = es.length === 0 ? [{ ...emptyBusiness }] : [...es]; return arr.map((x, i) => i === idx ? { ...x, description: e.target.value.toUpperCase() } : x); })}
                          placeholder="e.g. Operates daily, 2 employees, sells snacks and household items"
                          className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-16 uppercase" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setBusinessEntries((e) => [...(e.length === 0 ? [{ ...emptyBusiness }] : e), { ...emptyBusiness }])}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                    <Plus className="h-4 w-4" /> Add another business
                  </button>
                </div>
              )}

              {/* ── UNEMPLOYED / RETIRED / STUDENT: no additional fields ── */}
              {(f("livelihood_type") === "Unemployed" || f("livelihood_type") === "Retired" || f("livelihood_type") === "Student") && (
                <p className="text-xs text-muted-foreground italic px-1">No additional fields needed for this livelihood type.</p>
              )}

              {/* ── No selection hint ── */}
              {!f("livelihood_type") && (
                <p className="text-xs text-muted-foreground italic px-1">Select a livelihood type above to show relevant fields.</p>
              )}
            </div>
          </Section>

          {/* 6. Government Related Info */}
          <Section icon={<IdCard className="h-4 w-4" />} title="Government Related Info"
            open={openSections.govinfo} onToggle={() => toggleSection("govinfo")}>
            <div className="space-y-5">
              {/* Government IDs */}
              <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider">Government IDs</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="GSIS/SSS No." name="sss_gsis_number" placeholder="e.g. GSIS/SSS No." value={f("sss_gsis_number")} onChange={updateForm} error={formErrors.sss_gsis_number} />
                  <FDatePicker label="Expiration Date" name="sss_gsis_expiry" value={f("sss_gsis_expiry")} onChange={updateForm} />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="PhilHealth No." name="philhealth_number" placeholder="e.g. PhilHealth No." value={f("philhealth_number")} onChange={updateForm} error={formErrors.philhealth_number} />
                  <FDatePicker label="Expiration Date" name="philhealth_expiry" value={f("philhealth_expiry")} onChange={updateForm} />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="Pag-IBIG No." name="pagibig_number" placeholder="e.g. Pag-IBIG No." value={f("pagibig_number")} onChange={updateForm} />
                  <FDatePicker label="Expiration Date" name="pagibig_expiry" value={f("pagibig_expiry")} onChange={updateForm} />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="TIN No." name="tin_number" placeholder="e.g. TIN No." value={f("tin_number")} onChange={updateForm} error={formErrors.tin_number} />
                  <FDatePicker label="Expiration Date" name="tin_expiry" value={f("tin_expiry")} onChange={updateForm} />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="PWD ID" name="pwd_id" placeholder="e.g. PWD ID" value={f("pwd_id")} onChange={updateForm} />
                  <FDatePicker label="Expiration Date" name="pwd_id_expiry" value={f("pwd_id_expiry")} onChange={updateForm} />
                </div>
                <FInput label="Senior Citizen ID" name="senior_citizen_id" placeholder="e.g. SC-XXXX" value={f("senior_citizen_id")} onChange={updateForm} />
              </div>

              {/* Voter & Household */}
              <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider pt-2">Voter & Household</h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <FRadio label="Registered Voter?" name="is_voter" value={fb("is_voter") ? "yes" : "no"}
                  options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                  onChange={(n, v) => updateForm(n, v === "yes")} />
                <FInput label="Voter Precinct Number" name="voter_precinct_number" placeholder="e.g. 0045A" value={f("voter_precinct_number")} onChange={updateForm} />
                <FSelect label="Last Voted Year" name="last_voted_year" options={["", ...Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i))]} value={f("last_voted_year")} onChange={updateForm} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <FSelect label="Relationship to Head" name="relationship_to_head" options={["", ...relationships]} value={f("relationship_to_head")} onChange={updateForm} />
              </div>

              {/* Barangay Role */}
              <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider pt-2">Barangay Role (if applicable)</h4>
              <p className="text-[11px] text-muted-foreground -mt-1">Is this person a Barangay employee or staff? Fill out the details below if yes.</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <FInput label="Barangay Position" name="barangay_position" placeholder="e.g. Staff, Kagawad" value={f("barangay_position")} onChange={updateForm} />
                <FDatePicker label="Start Date" name="barangay_role_start" value={f("barangay_role_start")} onChange={updateForm} />
                <FDatePicker label="End Date" name="barangay_role_end" value={f("barangay_role_end")} onChange={updateForm} />
              </div>
            </div>
          </Section>

          {/* 7. In Case of Emergency */}
          <Section icon={<Contact className="h-4 w-4" />} title="In Case of Emergency"
            open={openSections.emergency} onToggle={() => toggleSection("emergency")}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <FInput label="Full Name" name="emergency_contact_name" placeholder="e.g. Juan Dela Cruz" value={f("emergency_contact_name")} onChange={updateForm} />
              <FInput label="Contact No." name="emergency_contact_phone" placeholder="09XX XXX XXXX" value={f("emergency_contact_phone")} onChange={updateForm} />
              <FInput label="Address" name="emergency_contact_address" placeholder="e.g. #10 Aguinaldo St., East Tapinac, Olongapo City" value={f("emergency_contact_address")} onChange={updateForm} />
              <FCombobox label="Relationship" name="emergency_contact_relationship" entries={emergencyRelEntries} value={f("emergency_contact_relationship")}
                onChange={updateForm} onSubmit={(val) => submitEntry(emergencyRelEntries, setEmergencyRelEntries, val)} />
            </div>
          </Section>

          {/* 8. Left & Right Thumbmark */}
          <Section icon={<Fingerprint className="h-4 w-4" />} title="Left & Right Thumbmark"
            open={openSections.biometric} onToggle={() => toggleSection("biometric")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <Fingerprint className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Scan Left Thumbmark</p>
                <p className="text-[11px] text-muted-foreground mb-3">Scanner preview</p>
                <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                  Scan Left Thumb
                </button>
              </div>
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <Fingerprint className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Scan Right Thumbmark</p>
                <p className="text-[11px] text-muted-foreground mb-3">Scanner preview</p>
                <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                  Scan Right Thumb
                </button>
              </div>
            </div>
          </Section>
        </div>
        </div>{/* end scrollable content */}

        {/* Action Bar — shrink-0, sits naturally below the scroll area.
            NO position:fixed — the map can never scroll under this bar. */}
        <div className="shrink-0 px-6 py-4 glass-header backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Required fields must be filled before submitting
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setMode("list")}
                className="px-5 py-2.5 text-sm font-medium rounded-xl glass-input hover:shadow-md transition-all">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="group relative px-7 py-2.5 text-sm font-bold rounded-xl text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: submitting ? "var(--accent-primary)" : "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? (mode === "edit" ? "Saving..." : "Registering...") : (mode === "edit" ? "Save Changes" : "Register Resident")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ── LIST VIEW
  // ══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <PageHeader title="Residents" description="Manage barangay resident records, profiles, and demographics. Register new residents, update existing records, generate documents and IDs, and track population data across all puroks."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Records" }, { label: "Residents" }]}
      />

      {/* Population Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl glass p-5">
          {listTotal === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">No residents registered yet</p>
              <p className="text-sm text-muted-foreground max-w-sm">Register your first resident to see population demographics, gender distribution, and household statistics.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Population</p>
                  {statsLoading && !residentStats ? (
                    <div className="h-9 w-24 rounded-lg bg-muted animate-pulse mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{totalPopulation.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3.5">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">Male</p>
                    {statsLoading && !residentStats ? <div className="h-7 w-12 rounded bg-blue-100 animate-pulse mt-0.5" /> : (
                      <>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{maleCount.toLocaleString()}</p>
                        <p className="text-[11px] text-blue-500/70 dark:text-blue-400/50">{totalPopulation > 0 ? Math.round((maleCount / totalPopulation) * 100) : 0}% of total</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 p-3.5">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-pink-600/70 dark:text-pink-400/70 uppercase tracking-wider">Female</p>
                    {statsLoading && !residentStats ? <div className="h-7 w-12 rounded bg-pink-100 animate-pulse mt-0.5" /> : (
                      <>
                        <p className="text-xl font-bold text-pink-700 dark:text-pink-300">{femaleCount.toLocaleString()}</p>
                        <p className="text-[11px] text-pink-500/70 dark:text-pink-400/50">{totalPopulation > 0 ? Math.round((femaleCount / totalPopulation) * 100) : 0}% of total</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Gender Distribution</span>
                  <span>{maleCount}M / {femaleCount}F</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-l-full transition-all" style={{ width: `${totalPopulation > 0 ? (maleCount / totalPopulation) * 100 : 50}%` }} />
                  <div className="h-full bg-pink-500 dark:bg-pink-400 rounded-r-full flex-1" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex-1 rounded-xl glass p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
              <Home className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Households</p>
              {statsLoading && !residentStats ? <div className="h-7 w-16 rounded bg-muted animate-pulse mt-0.5" /> : (
                <p className="text-xl font-bold text-foreground">{householdCount.toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="flex-1 rounded-xl glass p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <Vote className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Registered Voters</p>
              {statsLoading && !residentStats ? <div className="h-7 w-20 rounded bg-muted animate-pulse mt-0.5" /> : (
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-foreground">{voterCount.toLocaleString()}</p>
                  <span className="text-[11px] text-muted-foreground font-medium">{totalPopulation > 0 ? Math.round((voterCount / totalPopulation) * 100) : 0}% of pop.</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 rounded-xl glass p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-teal-500 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Residents</p>
              {statsLoading && !residentStats ? <div className="h-7 w-20 rounded bg-muted animate-pulse mt-0.5" /> : (
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-foreground">{activeCount.toLocaleString()}</p>
                  <span className="text-[11px] text-muted-foreground font-medium">{nonActiveCount > 0 ? `${nonActiveCount} transferred/archived` : ""}{deceasedCount > 0 ? `${nonActiveCount > 0 ? ", " : ""}${deceasedCount} deceased` : ""}{nonActiveCount === 0 && deceasedCount === 0 ? "all active" : ""}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Search + Actions row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input type="text" value={search} onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search residents..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl glass-input placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn("relative inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all",
                showFilters ? "border-accent-primary bg-accent-bg text-accent-text shadow-sm" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted")}
              title="Filters">
              <Filter className="h-4 w-4" />
              {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all" || civilStatusFilter !== "All Civil Status" || residentTypeFilter !== "All Resident Types" || hohFilter !== "all" || citizenshipFilter !== "All Citizenship" || religionFilter !== "All Religion" || ethnicityFilter !== "All Ethnicity" || sectorFilter !== "All Sectors") && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background" style={{ background: "var(--accent-primary)" }} />
              )}
            </button>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]" style={{ background: "var(--accent-primary)" }}>
            <Plus className="h-4 w-4" /> New Resident
          </button>
        </div>
        {/* Filter chips row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="inline-flex items-center h-8 px-3 text-xs font-semibold rounded-full bg-muted text-foreground tabular-nums">
              {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all" || civilStatusFilter !== "All Civil Status" || residentTypeFilter !== "All Resident Types" || hohFilter !== "all" || citizenshipFilter !== "All Citizenship" || religionFilter !== "All Religion" || ethnicityFilter !== "All Ethnicity" || sectorFilter !== "All Sectors" || search)
                ? <>{listTotal.toLocaleString()} found <span className="text-muted-foreground font-normal ml-1">of {(residentStats?.total_residents ?? listTotal).toLocaleString()} total</span></>
                : <>{(residentStats?.total_residents ?? listTotal).toLocaleString()} residents</>
              }
            </span>
            <select value={purokFilter} onChange={(e) => { setPurokFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {puroks.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={sexFilter} onChange={(e) => { setSexFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {sexOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={civilStatusFilter} onChange={(e) => { setCivilStatusFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Civil Status", ...civilStatuses].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={residentTypeFilter} onChange={(e) => { setResidentTypeFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Resident Types", "Permanent", "Transient", "Transferee"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={voterFilter} onChange={(e) => { setVoterFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              <option value="all">All Voters</option>
              <option value="voter">Registered Voter</option>
              <option value="non-voter">Non-Voter</option>
            </select>
            <select value={hohFilter} onChange={(e) => { setHohFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              <option value="all">All Households</option>
              <option value="hoh">Head of Household</option>
              <option value="non-hoh">Not Head</option>
            </select>
            <select value={citizenshipFilter} onChange={(e) => { setCitizenshipFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Citizenship", "Filipino", "American", "Chinese", "Japanese", "Korean", "Other"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={religionFilter} onChange={(e) => { setReligionFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Religion", "Catholic", "INC (Iglesia ni Cristo)", "Born Again", "Muslim", "Protestant", "Seventh Day Adventist", "Baptist", "Methodist", "Jehovah's Witness", "Mormon", "Aglipayan", "Buddhist", "Other"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={ethnicityFilter} onChange={(e) => { setEthnicityFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Ethnicity", "Tagalog", "Ilocano", "Pangasinan", "Pampanga", "Bicolano", "Visayan", "Zamboangueño", "Tausug", "Maranao", "Other"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={sectorFilter} onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Sectors", ...sectorOptions].map((s) => <option key={s}>{s}</option>)}
            </select>
            {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all" || civilStatusFilter !== "All Civil Status" || residentTypeFilter !== "All Resident Types" || hohFilter !== "all" || citizenshipFilter !== "All Citizenship" || religionFilter !== "All Religion" || ethnicityFilter !== "All Ethnicity" || sectorFilter !== "All Sectors") && (
              <button onClick={() => { setPurokFilter("All Puroks"); setStatusFilter("All Status"); setSexFilter("All"); setVoterFilter("all"); setCivilStatusFilter("All Civil Status"); setResidentTypeFilter("All Resident Types"); setHohFilter("all"); setCitizenshipFilter("All Citizenship"); setReligionFilter("All Religion"); setEthnicityFilter("All Ethnicity"); setSectorFilter("All Sectors"); }}
                className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium rounded-full text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors">
                <X className="h-4 w-4" /> Clear all
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
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Barangay ID" field="resident_number" className="whitespace-nowrap" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Full Name" field="last_name" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Age" field="age" className="text-center" />
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Gender</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">Civil Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Voter</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Created At" field="created_at" className="whitespace-nowrap text-center" />
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading residents...</p>
                    </div>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No residents found</p>
                        <p className="text-xs text-muted-foreground mt-1">{search || purokFilter !== "All Puroks" || statusFilter !== "All Status" ? "Try adjusting your search or filters." : "Register your first resident or import records from BIMS to get started."}</p>
                      </div>
                      {!search && purokFilter === "All Puroks" && statusFilter === "All Status" && (
                        <button onClick={openCreate} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                          + New Resident
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((r, index) => {
                  const initials = `${(r.first_name || "")[0] || "?"}${(r.last_name || "")[0] || "?"}`;
                  const fullName = `${(r.last_name || "").toUpperCase()}, ${(r.first_name || "").toUpperCase()} ${r.middle_name ? r.middle_name[0].toUpperCase() + "." : ""}${r.extension_name ? " " + r.extension_name : ""}`.trim();
                  const address = [r.house_block_lot, r.street, r.purok ? `Purok ${r.purok}` : ""].filter(Boolean).join(", ").toUpperCase() || "—";
                  const age = r.date_of_birth ? Math.floor((Date.now() - new Date(r.date_of_birth).getTime()) / 31557600000) : null;
                  const daysAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
                  const createdLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : daysAgo < 7 ? `${daysAgo} days ago` : daysAgo < 30 ? `${Math.floor(daysAgo / 7)} weeks ago` : daysAgo < 365 ? `${Math.floor(daysAgo / 30)} months ago` : `${Math.floor(daysAgo / 365)} years ago`;
                  const greyFlags = r.cross_barangay_flags || [];
                  const hasGreyFlag = greyFlags.length > 0;
                  const hasRedFlag = Array.isArray(r.case_records) && r.case_records.length > 0;
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openViewResident(r.id)}>
                      {/* Barangay ID */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-muted-foreground font-mono">{r.resident_number}</p>
                      </td>
                      {/* Full Name + Avatar + Last Transaction + Flags */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Avatar + flag badges — tooltip anchored to this container, NOT inside the badge span */}
                          <div className="relative shrink-0">
                            {r.photo_url ? (
                              <img src={resolvePhotoUrl(r.photo_url)!} alt={initials} className="w-11 h-11 rounded-xl object-cover" />
                            ) : (
                              <div className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold text-white",
                                r.sex === "female" ? "bg-gradient-to-br from-pink-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-blue-500"
                              )}>{initials}</div>
                            )}

                            {/* Red flag badge */}
                            {hasRedFlag && (
                              <span
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 cursor-default"
                                onMouseEnter={(e) => { e.stopPropagation(); setHoveredTooltip("red-" + r.id); }}
                                onMouseLeave={() => setHoveredTooltip(null)}
                              >
                                <Flag className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}

                            {/* Red flag tooltip — sibling of badge, positioned relative to avatar container */}
                            {hasRedFlag && hoveredTooltip === "red-" + r.id && (
                              <div className="absolute bottom-full left-0 mb-3 z-[9999] pointer-events-none" style={{width: "260px"}}>
                                <div className="bg-red-950 border border-red-800 text-white rounded-xl shadow-2xl overflow-hidden">
                                  <div className="px-3 py-2 bg-red-900/60 border-b border-red-800 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Flag className="h-3 w-3 text-red-400" />
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-red-300">Case Record</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-red-300 bg-red-800/60 px-1.5 py-0.5 rounded-full">{r.case_records?.length ?? 0}</span>
                                  </div>
                                  <div className="px-3 py-2 space-y-2">
                                    {(r.case_records && r.case_records.length > 0) ? (
                                      <>
                                        {r.case_records.slice(0, 3).map((c, i) => (
                                          <div key={i} className={i > 0 ? "border-t border-red-800/50 pt-2" : ""}>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${c.source === "kp_case" ? "bg-red-800 text-red-200" : "bg-orange-900 text-orange-300"}`}>
                                                {c.source === "kp_case" ? "KP Case" : "Blotter"}
                                              </span>
                                              <span className="text-xs text-white font-semibold">{c.case_number}</span>
                                            </div>
                                            <p className="text-[10px] text-red-200 leading-tight mb-0.5">{c.description}</p>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[9px] text-red-400 capitalize">{c.party_type}</span>
                                              <span className="text-[9px] text-red-600">·</span>
                                              <span className="text-[9px] text-red-400 capitalize">{c.status?.replace(/_/g, " ")}</span>
                                            </div>
                                          </div>
                                        ))}
                                        {r.case_records.length > 3 && (
                                          <p className="text-[10px] text-red-500 border-t border-red-800/50 pt-1.5">+{r.case_records.length - 3} more — view profile</p>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-xs text-red-300">Active case record on file. View profile for details.</p>
                                    )}
                                  </div>
                                </div>
                                {/* Caret pointing down-left toward the badge */}
                                <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-950"></div>
                              </div>
                            )}

                            {/* Grey flag badge */}
                            {hasGreyFlag && !hasRedFlag && (
                              <span
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 cursor-default"
                                onMouseEnter={(e) => { e.stopPropagation(); setHoveredTooltip("gray-" + r.id); }}
                                onMouseLeave={() => setHoveredTooltip(null)}
                              >
                                <Flag className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}

                            {/* Grey flag tooltip — sibling of badge, positioned relative to avatar container */}
                            {hasGreyFlag && !hasRedFlag && hoveredTooltip === "gray-" + r.id && (
                              <div className="absolute bottom-full right-0 mb-3 z-[9999] pointer-events-none" style={{width: "240px"}}>
                                <div className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl overflow-hidden">
                                  <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 flex items-center gap-1.5">
                                    <Flag className="h-3 w-3 text-slate-400" />
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Other Barangay Record</p>
                                  </div>
                                  <div className="px-3 py-2 space-y-2">
                                    {(r.cross_barangay_flags && r.cross_barangay_flags.length > 0) ? (
                                      r.cross_barangay_flags.slice(0, 3).map((flag, i) => (
                                        <div key={i}>
                                          <p className="text-xs font-semibold text-slate-200">{flag.barangay_name || "Unknown Barangay"}</p>
                                          {flag.detected_at && <p className="text-[10px] text-slate-400">Detected: {flag.detected_at}</p>}
                                          {flag.acknowledged_at && <p className="text-[10px] text-slate-500">Acknowledged: {flag.acknowledged_at}</p>}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-[10px] text-slate-400">No flags</p>
                                    )}
                                  </div>
                                </div>
                                <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                              {r.is_head_of_household && (
                              <span
                                className="relative shrink-0"
                                onMouseEnter={(e) => { e.stopPropagation(); setHoveredTooltip("hoh-" + r.id); }}
                                onMouseLeave={() => setHoveredTooltip(null)}
                              >
                                <Home className="h-4 w-4 text-amber-500 cursor-default" />
                                {hoveredTooltip === "hoh-" + r.id && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] pointer-events-none whitespace-nowrap">
                                    <div className="bg-amber-900 text-amber-100 text-xs font-semibold rounded-lg px-3 py-1.5 shadow-2xl">
                                      Head of Household
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-amber-900"></div>
                                  </div>
                                )}
                              </span>
                            )}
                            </div>
                            {(r.purok || r.street) && (
                              <div
                              className="relative"
                              onMouseEnter={(e) => { e.stopPropagation(); setHoveredTooltip("addr-" + r.id); }}
                              onMouseLeave={() => setHoveredTooltip(null)}
                            >
                                <p className="text-xs text-slate-400 truncate max-w-[220px] cursor-default">
                                  {[r.purok ? `Purok ${r.purok}` : null, r.street].filter(Boolean).join(' - ')}
                                </p>
                                {hoveredTooltip === "addr-" + r.id && (<div className="absolute bottom-full left-0 mb-2 z-[60] pointer-events-none">
                                  <div className="bg-slate-900 text-white rounded-xl shadow-2xl overflow-hidden min-w-[220px]">
                                    <div className="px-3 py-2 bg-slate-800 border-b border-slate-700">
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Full Address</p>
                                    </div>
                                    <div className="px-3 py-2 space-y-1">
                                      {r.house_block_lot && <p className="text-xs text-slate-300"><span className="text-slate-500 mr-1">House/Lot:</span>{r.house_block_lot}</p>}
                                      {r.purok && <p className="text-xs text-slate-300"><span className="text-slate-500 mr-1">Purok:</span>{r.purok}</p>}
                                      {r.street && <p className="text-xs text-slate-300"><span className="text-slate-500 mr-1">Street:</span>{r.street}</p>}
                                      {!r.house_block_lot && !r.purok && !r.street && <p className="text-xs text-slate-500 italic">No address on record</p>}
                                    </div>
                                  </div>
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
                                </div>)}
                            </div>
                            )}
                            <p
                              className="text-[10px] text-muted-foreground/70 cursor-default"
                              onMouseEnter={(e) => { e.stopPropagation(); setHoveredTooltip("lt-" + r.id); }}
                              onMouseLeave={() => setHoveredTooltip(null)}
                            >
                              Last Transaction: {createdLabel}
                              {hoveredTooltip === "lt-" + r.id && (
                                <span className="absolute left-0 bottom-full mb-2 z-[60] pointer-events-none" style={{width: "250px"}}>
                                  <span className="block bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl overflow-hidden">
                                    <span className="block px-3 py-2 bg-slate-800 border-b border-slate-700">
                                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Last Transaction</span>
                                    </span>
                                    <span className="block px-3 py-2 space-y-1">
                                      {r.last_document ? (
                                        <>
                                          <span className="block text-xs font-semibold text-slate-200">{r.last_document.type || "Document Issued"}</span>
                                          {r.last_document.generated_by && <span className="block text-[10px] text-slate-400">By: {r.last_document.generated_by}</span>}
                                          <span className="block text-[10px] text-slate-500">{createdLabel}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="block text-xs text-slate-300">Registration record</span>
                                          <span className="block text-[10px] text-slate-400">Generated by: Barangay Secretary</span>
                                          <span className="block text-[10px] text-slate-500">{createdLabel}</span>
                                        </>
                                      )}
                                    </span>
                                  </span>
                                  <span className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900 block"></span>
                                </span>
                              )}
                            </p>

                          </div>
                        </div>
                      </td>

                      {/* Age */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm text-foreground">{age ?? "—"}</span>
                      </td>
                      {/* Gender */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm text-foreground uppercase">{r.sex === "male" ? "MALE" : "FEMALE"}</span>
                      </td>
                      {/* Civil Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm text-foreground uppercase">{(r.civil_status || "—").toUpperCase()}</span>
                      </td>
                      {/* Voter */}
                      <td className="px-4 py-3.5 text-center">
                        {r.is_voter ? (
                          <span
                            className="relative inline-flex items-center justify-center cursor-default"
                            onMouseEnter={(e) => { e.stopPropagation(); setHoveredTooltip("voter-" + r.id); }}
                            onMouseLeave={() => setHoveredTooltip(null)}
                          >
                            <Vote className="h-4 w-4 text-emerald-500" />
                            {hoveredTooltip === "voter-" + r.id && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] pointer-events-none" style={{width: "220px"}}>
                                <div className="bg-emerald-950 border border-emerald-800 text-white rounded-xl shadow-2xl overflow-hidden">
                                  <div className="px-3 py-2 bg-emerald-900/60 border-b border-emerald-800 flex items-center gap-1.5">
                                    <Vote className="h-3 w-3 text-emerald-400" />
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Registered Voter</p>
                                  </div>
                                  <div className="px-3 py-2 space-y-1">
                                    {r.precinct_number ? (
                                      <>
                                        <p className="text-xs text-emerald-200"><span className="text-emerald-500 mr-1">Precinct:</span>{r.precinct_number}</p>
                                        {r.voter_id && <p className="text-xs text-emerald-200"><span className="text-emerald-500 mr-1">Voter ID:</span>{r.voter_id}</p>}
                                      </>
                                    ) : (
                                      <p className="text-xs text-emerald-300">COMELEC name match found. Precinct not yet on file.</p>
                                    )}
                                    <p className="text-[10px] text-emerald-600 italic">Name-match only — not DOB verified</p>
                                  </div>
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-emerald-950"></div>
                              </div>
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Created At */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{createdLabel}</span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => router.push(`/dashboard/residents/${r.id}`)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </button>
                          {/* Generate Document */}
                          <button
                            onClick={() => { setDocWizardResidentId(r.id); setDocWizardCategory(null); setShowDocWizard(true); }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 transition-colors"
                            title="Generate Document"
                          >
                            <ScrollText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          </button>
                          {/* Generate ID Card */}
                          <button
                            onClick={() => { setIdModalResidentId(r.id); setShowIdModal(true); }}
                            className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 transition-colors"
                            title="Generate ID Card"
                          >
                            <IdCard className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                          </button>
                          {/* SMS */}
                          <button
                            onClick={() => {
                              setSmsModalResident({
                                id: r.id,
                                name: `${r.last_name}, ${r.first_name}${r.middle_name ? " " + r.middle_name.charAt(0) + "." : ""}${r.extension_name ? " " + r.extension_name : ""}`.trim(),
                                mobile_number: r.mobile_number ?? null,
                              });
                              setShowSmsModal(true);
                            }}
                            disabled={!r.mobile_number}
                            className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={r.mobile_number ? "Send SMS to " + r.mobile_number : "No mobile number registered"}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                          </button>
                          {/* More */}
                          <div className="relative">
                            <button
                              onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                              title="More actions"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                            </button>
                            {actionMenu === r.id && (
                              <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg py-1.5">
                                <button onClick={async () => { setActionMenu(null); try { const detail = await api.residents.get(r.id); openEdit(detail); } catch { addToast({ type: "error", title: "Failed to load resident" }); } }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-100 text-left transition-colors"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Edit Profile</button>
                                <button
                                  onClick={() => { setActionMenu(null); handlePrint(r.id); }}
                                  disabled={printingId === r.id}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-100 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                  {printingId === r.id
                                    ? <Loader2 className="h-4 w-4 text-gray-500 dark:text-gray-400 animate-spin" />
                                    : <Printer className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                                  {printingId === r.id ? "Generating PDF..." : "Print Record"}
                                </button>
                                <div className="border-t border-gray-200 dark:border-slate-600 my-1" />
                                <button onClick={() => { setActionMenu(null); setArchiveTarget({ id: r.id, first_name: r.first_name, last_name: r.last_name, sex: r.sex, resident_number: r.resident_number }); setArchiveModal(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20 text-left text-amber-600 dark:text-amber-400 transition-colors"><Archive className="h-4 w-4" /> Archive Record</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {((safePage - 1) * pageSize) + 1}--{Math.min(safePage * pageSize, listTotal)} of {listTotal} residents</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-3 py-1 text-sm font-medium">{safePage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <Modal open={!!viewResident && !showDelete} onClose={() => setViewResident(null)} size="lg" hideCloseButton
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setViewResident(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              Close
            </button>
            <button
              onClick={() => { if (viewResident) { setViewResident(null); router.push(`/dashboard/residents/${viewResident.id}`); } }}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-accent-primary hover:bg-accent-hover text-white transition-all shadow-sm"
            >
              <Eye className="h-4 w-4" /> View Full Profile
            </button>
          </div>
        }>
        {viewResident && (
          <div>
            {/* Cross-barangay alert */}
            {(viewResident.cross_barangay_flags?.length ?? 0) > 0 && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl text-sm bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Flag className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Cross-barangay record detected. Verify before issuing documents.</span>
              </div>
            )}

            {/* Header: Photo + Name + Status + Completion */}
            <div className="flex items-start gap-4 mb-5">
              {/* Photo */}
              <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-muted shrink-0 border-2 border-border">
                {viewResident.photo_url ? (
                  <img src={resolvePhotoUrl(viewResident.photo_url) ?? undefined} alt={viewResident.first_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                    <User className="h-7 w-7 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Name + number + badges */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {viewResident.first_name}{viewResident.middle_name ? ` ${viewResident.middle_name[0]}.` : ""} {viewResident.last_name}{viewResident.extension_name ? ` ${viewResident.extension_name}` : ""}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{viewResident.resident_number}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge status={viewResident.status} />
                  {viewResident.is_voter && <Badge variant="success" dot>Registered Voter</Badge>}
                  {viewResident.is_head_of_household && <Badge variant="warning" dot>Head of Household</Badge>}
                </div>
              </div>

              {/* Profile completion */}
              <div className="shrink-0 text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Profile</div>
                <div className="text-2xl font-bold leading-none" style={{ color: viewResident.profile_completion_pct >= 80 ? "#22c55e" : viewResident.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {viewResident.profile_completion_pct}%
                </div>
                <div className="w-14 h-1.5 rounded-full bg-muted mt-1.5 ml-auto overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${viewResident.profile_completion_pct}%`, background: viewResident.profile_completion_pct >= 80 ? "#22c55e" : viewResident.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444" }} />
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Personal */}
              <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-slate-800/40 space-y-2.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Personal</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Born</span>
                    <span className="text-sm font-medium text-foreground truncate">
                      {viewResident.date_of_birth
                        ? (() => { const d = new Date(viewResident.date_of_birth.includes("T") ? viewResident.date_of_birth : viewResident.date_of_birth + "T00:00:00"); return `${d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} · ${Math.floor((Date.now() - d.getTime()) / 31557600000)} yrs`; })()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Sex</span>
                    <span className="text-sm font-medium text-foreground">{viewResident.sex || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Civil</span>
                    <span className="text-sm font-medium text-foreground capitalize">{viewResident.civil_status || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Blood</span>
                    <span className="text-sm font-medium text-foreground">{viewResident.blood_type || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Citizen</span>
                    <span className="text-sm font-medium text-foreground truncate">{viewResident.citizenship || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-slate-800/40 space-y-2.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contact & Location</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Mobile</span>
                    <span className="text-sm font-medium text-foreground">{viewResident.mobile_number || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Email</span>
                    <span className="text-sm font-medium text-foreground truncate">{viewResident.email || "—"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Address</span>
                    <span className="text-sm font-medium text-foreground leading-snug">
                      {[viewResident.house_block_lot, viewResident.street, viewResident.purok ? `Purok ${viewResident.purok}` : ""].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Work</span>
                    <span className="text-sm font-medium text-foreground truncate">{viewResident.occupation || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Vote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Voter</span>
                    <span className="text-sm font-medium text-foreground">
                      {viewResident.is_voter ? `Yes${viewResident.voter_precinct_number ? ` · Pct ${viewResident.voter_precinct_number}` : ""}` : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sectoral tags */}
            {(viewResident.sectoral_tags?.length ?? 0) > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {viewResident.sectoral_tags?.map(t => (
                  <Badge key={t.id} variant="info" dot>{t.sector}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      {/* Archive Record Modal */}
      <Modal open={archiveModal} onClose={() => { setArchiveModal(false); setArchiveReason(""); setArchiveTarget(null); }} title="Archive Resident Record" size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setArchiveModal(false); setArchiveReason(""); setArchiveTarget(null); }}>Cancel</ModalButton><ModalButton variant="danger" disabled={!archiveReason} onClick={async () => {
          if (!archiveTarget) return;
          try {
            await api.residents.delete(archiveTarget.id);
            addToast({ type: "success", title: "Record archived", message: `${archiveTarget.first_name} ${archiveTarget.last_name} has been moved to archive.` });
            setArchiveModal(false);
            setArchiveReason("");
            setArchiveTarget(null);
            fetchResidents();
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to archive resident";
            addToast({ type: "error", title: "Archive failed", message: msg });
          }
        }}>Archive Record</ModalButton></>}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <Archive className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">This record will be moved to the archive. All data is preserved and can be viewed in Settings &gt; Archived Records.</p>
          </div>
          {archiveTarget && (
            <div className="flex items-center gap-3 p-3 rounded-lg glass-subtle">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", archiveTarget.sex === "female" ? "bg-pink-400" : "bg-blue-400")}>
                {archiveTarget.last_name[0]}{archiveTarget.first_name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{archiveTarget.last_name.toUpperCase()}, {archiveTarget.first_name.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground font-mono">{archiveTarget.resident_number}</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Reason for archiving <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              {[
                { value: "deceased", label: "Deceased", desc: "Resident has passed away" },
                { value: "transferred", label: "Transferred Out", desc: "Resident moved to another barangay" },
                { value: "other", label: "Other Reason", desc: "Specify in the remarks below" },
              ].map((opt) => (
                <label key={opt.value} className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors", archiveReason === opt.value ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-700" : "border-border hover:bg-muted/30")}>
                  <input type="radio" name="archive_reason" value={opt.value} checked={archiveReason === opt.value} onChange={() => setArchiveReason(opt.value)} className="mt-0.5 accent-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
      <GenerateDocumentWizard
        open={showDocWizard}
        onClose={() => { setShowDocWizard(false); setDocWizardResidentId(null); setDocWizardCategory(null); }}
        initialResidentId={docWizardResidentId}
        initialTemplateCategory={docWizardCategory}
      />
      <GenerateIdModal
        open={showIdModal}
        onClose={() => { setShowIdModal(false); setIdModalResidentId(null); }}
        residentId={idModalResidentId}
      />
      <SendSmsModal
        open={showSmsModal}
        onClose={() => { setShowSmsModal(false); setSmsModalResident(null); }}
        resident={smsModalResident}
        creditBalance={user?.barangay?.sms_credit_balance != null ? parseFloat(String(user.barangay.sms_credit_balance)) : null}
      />

      <MabiniButton pageContext="You are on the Residents page. This page lists all registered residents of the barangay, with search, filter, and CRUD operations for resident records." />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground capitalize">{value}</p>
      </div>
    </div>
  );
}
