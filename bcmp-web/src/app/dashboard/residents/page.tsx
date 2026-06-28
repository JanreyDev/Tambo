"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Home, MapPin, Filter, Upload, Download, MoreHorizontal,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Flag,
  AlertTriangle, Phone, Mail, Calendar, User, Heart, FileText, Edit,
  Camera, Printer, Eye, ChevronDown, Plus, Fingerprint, CheckCircle, Loader2,
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
import { useLanguage } from "@/contexts/language-context";
import type { ApiError, DashboardStats, DuplicateMatch, ResidentSummary, ResidentDetail, PaginatedResponse, GeoJsonFeatureCollection } from "@/lib/types";
import { MabiniButton } from "@/components/ui/mabini-button";
import ResidentPinMap from "@/components/map/resident-pin-map-dynamic";
import { GenerateDocumentWizard } from "@/components/documents/GenerateDocumentWizard";
import { GenerateIdModal } from "@/components/documents/GenerateIdModal";
import { SendSmsModal, type SmsTargetResident } from "@/components/residents/SendSmsModal";
import { SendEmailModal, type EmailTargetResident } from "@/components/residents/SendEmailModal";

// ── Local extractions (Phase 1 split) ────────────────────────────────
import {
  type SmartEntry,
  puroks, statuses, sexOptions, civilStatuses,
  bloodTypes, educationLevels, extensions, residentTypes, relationships,
  sectorOptions, employmentStatuses, complexionOptions,
  employmentTypeOptions, incomeRanges,
  businessStatuses, livelihoodTypes, yearOptions,
  defaultPurokEntries, defaultStreetEntries,
  defaultCitizenshipEntries, defaultReligionEntries, defaultEthnicityEntries,
  defaultEmergencyRelEntries, defaultSectorOtherEntries,
  defaultBusinessTypeEntries, defaultOccupationEntries, defaultSkillEntries,
  defaultPositionEntries, defaultEmployerEntries,
  defaultCourseEntries, defaultSchoolEntries, defaultPlaceOfBirthEntries,
  eduFieldRules,
} from "./_lib/constants";
import {
  type EduEntry, type WorkEntry, type BusinessEntry, type PetEntry, type Toast,
  emptyEdu, emptyWork, emptyBusiness, emptyPet,
} from "./_lib/types";
import { isValidPHMobile, isValidEmail, formatPHMobile } from "./_lib/validation";
import { validateResident } from "./_lib/schemas";
import { FInput, FSelect, FCheckbox, FCombobox, FDatePicker, FRadio, Section, normalizeAddress, similarity } from "./_components/FormFields";
import { ToastContainer } from "./_components/Toast";
import { ResidentStatCards } from "./_components/ResidentStatCards";


// tenantConfig derived from auth context inside component (useAuth hook)
// Resident number generated server-side: RES-{PSGC_CODE}-{SEQUENTIAL_4DIGIT}
//
// NOTE: constants, validators, types, FCombobox/FInput/FSelect/etc., and ToastContainer
// were extracted to ./_lib and ./_components in Phase 1 of the production refactor.


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

export default function ResidentsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Toast Notifications ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const isTambo = user?.barangay?.name?.toLowerCase() === "tambo";
  const sectorsList = isTambo
    ? sectorOptions
      .filter((s) => s !== "Farmer")
      .concat(["Banca Owners", "SAPRA Registration", "Tahungan"])
      .sort((a, b) => a.localeCompare(b))
    : sectorOptions;

  // Translate filter "All X" labels while keeping state values in English.
  const filterLabel = (v: string): string => {
    switch (v) {
      case "All Puroks": return isTambo ? "All Blocks/Lots" : t.residents.filters.allPuroks;
      case "All Status": return t.residents.filters.allStatus;
      case "All Civil Status": return t.residents.filters.allCivilStatus;
      case "All Resident Types": return t.residents.filters.allResidentTypes;
      case "All Citizenship": return t.residents.filters.allCitizenship;
      case "All Religion": return t.residents.filters.allReligion;
      case "All Ethnicity": return t.residents.filters.allEthnicity;
      case "All Sectors": return t.residents.filters.allSectors;
      case "Active": return t.residents.status.active;
      case "Inactive": return t.residents.status.inactive;
      case "Deceased": return t.residents.status.deceased;
      case "Transferred": return t.residents.status.transferred;
      case "All": return t.residents.sex.all;
      case "Male": return t.residents.sex.male;
      case "Female": return t.residents.sex.female;
      default: return v;
    }
  };

  // Time-since formatter for table column (today/yesterday/X days/weeks/months/years ago)
  const formatTimeSince = (daysAgo: number): string => {
    if (daysAgo === 0) return t.residents.timeSince.today;
    if (daysAgo === 1) return t.residents.timeSince.yesterday;
    if (daysAgo < 7) return `${daysAgo} ${t.residents.timeSince.daysAgo}`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} ${t.residents.timeSince.weeksAgo}`;
    if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} ${t.residents.timeSince.monthsAgo}`;
    return `${Math.floor(daysAgo / 365)} ${t.residents.timeSince.yearsAgo}`;
  };
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
  const [residentView, setResidentView] = useState<"active" | "archived">("active");
  // Default to latest-registered first so newly added residents surface at the top.
  // User can still click any column header to sort differently.
  const [sortKey, setSortKey] = useState<string | null>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showDelete, setShowDelete] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  // Track which resident is currently generating a PDF (shows spinner on button)
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; first_name: string; last_name: string; sex: string; resident_number: string } | null>(null);
  const pageSize = 15;

  // ── OTP State Variables (Barangay Tambo only) ──
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSentPhone, setOtpSentPhone] = useState("");

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
      if (residentView === "archived") params.archived_only = true;
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
  }, [page, search, purokFilter, statusFilter, sexFilter, voterFilter, civilStatusFilter, residentTypeFilter, hohFilter, citizenshipFilter, religionFilter, ethnicityFilter, sectorFilter, residentView, sortKey, sortDir]);

  // ── Export State & Handler ──
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    addToast({
      type: "success",
      title: t.residents.search.export || "Export CSV",
      message: "Generating export file..."
    });

    try {
      const params: Record<string, string> = {};
      const q = search;
      if (q) params.search = q;
      if (purokFilter !== "All Puroks") params.purok = purokFilter;
      if (statusFilter !== "All Status") params.status = statusFilter.toLowerCase();
      if (sexFilter !== "All") params.sex = sexFilter.toLowerCase();
      if (voterFilter === "voter") params.is_voter = "1";
      if (voterFilter === "non-voter") params.is_voter = "0";
      if (civilStatusFilter !== "All Civil Status") params.civil_status = civilStatusFilter.toLowerCase();
      if (residentTypeFilter !== "All Resident Types") params.resident_type = residentTypeFilter.toLowerCase();
      if (hohFilter === "hoh") params.is_head_of_household = "1";
      if (hohFilter === "non-hoh") params.is_head_of_household = "0";
      if (citizenshipFilter !== "All Citizenship") params.citizenship = citizenshipFilter;
      if (religionFilter !== "All Religion") params.religion = religionFilter;
      if (ethnicityFilter !== "All Ethnicity") params.ethnicity = ethnicityFilter;
      if (sectorFilter !== "All Sectors") params.sector = sectorFilter;
      if (residentView === "archived") params.archived_only = "true";

      const res = await api.residents.exportCsv(params);
      if (!res.ok) {
        throw new Error("Failed to export database");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from Content-Disposition if present
      const disposition = res.headers.get("content-disposition");
      let filename = `residents-${new Date().toISOString().split("T")[0]}.csv`;
      if (disposition && disposition.includes("attachment")) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      addToast({
        type: "error",
        title: "Export Failed",
        message: err instanceof Error ? err.message : "Failed to download CSV export."
      });
    } finally {
      setExporting(false);
    }
  }, [search, purokFilter, statusFilter, sexFilter, voterFilter, civilStatusFilter, residentTypeFilter, hohFilter, citizenshipFilter, religionFilter, ethnicityFilter, sectorFilter, residentView, addToast, t]);

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
  interface OpenSectionsState {
    other: boolean;
    education: boolean;
    work: boolean;
    govinfo: boolean;
    pets: boolean;
    emergency: boolean;
    biometric: boolean;
  }

  const [eduEntries, setEduEntries] = useState<EduEntry[]>([{ ...emptyEdu }]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([{ ...emptyWork }]);
  const [petEntries, setPetEntries] = useState<PetEntry[]>([{ ...emptyPet }]);
  const [openSections, setOpenSections] = useState<OpenSectionsState>({
    other: false,
    education: false, work: false, govinfo: false,
    pets: false,
    emergency: false, biometric: false,
  });

  // ── Form Validation ──
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);



  // ── Document wizard (opened from resident row action buttons) ──
  const [showDocWizard, setShowDocWizard] = useState(false);
  const [docWizardResidentId, setDocWizardResidentId] = useState<string | null>(null);
  const [docWizardCategory, setDocWizardCategory] = useState<string | null>(null);

  // ── ID card modal (purple button) ──
  const [showIdModal, setShowIdModal] = useState(false);
  const [idModalResidentId, setIdModalResidentId] = useState<string | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsModalResident, setSmsModalResident] = useState<SmsTargetResident | null>(null);
  const [emailModalResident, setEmailModalResident] = useState<EmailTargetResident | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);


  // ── Smart Address Entries (per-barangay learned values) ──────────────
  // Seeded with sensible Philippine defaults; hydrated from the
  // /address-entries API once on mount. Every value selected/typed fires a
  // background upsert so the store grows organically per barangay.
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

  // Hydrate entries from /address-entries on mount.
  // Strategy: merge API entries on top of seed defaults — higher counts win.
  // Any API kind with 0 entries falls back to the seed defaults that React initialized with.
  useEffect(() => {
    let cancelled = false;
    api.addressEntries.list().then((res) => {
      if (cancelled) return;
      const byKind = res.entries.reduce<Record<string, SmartEntry[]>>((acc, e) => {
        if (!acc[e.kind]) acc[e.kind] = [];
        acc[e.kind]!.push({ canonical: e.canonical, count: e.count, aliases: e.aliases });
        return acc;
      }, {});
      // Merge helper — prefer API entries over seed defaults when canonical matches
      const merge = (seed: SmartEntry[], fromApi: SmartEntry[] | undefined): SmartEntry[] => {
        if (!fromApi || fromApi.length === 0) return seed;
        const apiByCanonical = new Map(fromApi.map((e) => [e.canonical.toLowerCase(), e]));
        const merged = seed.map((s) => apiByCanonical.get(s.canonical.toLowerCase()) ?? s);
        // Append API-only entries (rows the seed doesn't include)
        const seedCanonicals = new Set(seed.map((s) => s.canonical.toLowerCase()));
        for (const e of fromApi) {
          if (!seedCanonicals.has(e.canonical.toLowerCase())) merged.push(e);
        }
        return merged.sort((a, b) => b.count - a.count);
      };
      setPurokEntries((prev) => merge(prev, byKind["purok"]));
      setStreetEntries((prev) => merge(prev, byKind["street"]));
      setCitizenshipEntries((prev) => merge(prev, byKind["citizenship"]));
      setReligionEntries((prev) => merge(prev, byKind["religion"]));
      setEthnicityEntries((prev) => merge(prev, byKind["ethnicity"]));
      setEmergencyRelEntries((prev) => merge(prev, byKind["emergency_rel"]));
      setSectorOtherEntries((prev) => merge(prev, byKind["sector_other"]));
      setBusinessTypeEntries((prev) => merge(prev, byKind["business_type"]));
      setOccupationEntries((prev) => merge(prev, byKind["occupation"]));
      setSkillEntries((prev) => merge(prev, byKind["skill"]));
      setPositionEntries((prev) => merge(prev, byKind["position"]));
      setEmployerEntries((prev) => merge(prev, byKind["employer"]));
      setCourseEntries((prev) => merge(prev, byKind["course"]));
      setSchoolEntries((prev) => merge(prev, byKind["school"]));
      setPlaceOfBirthEntries((prev) => merge(prev, byKind["place_of_birth"]));
    }).catch(() => {
      // Offline-tolerant: defaults already loaded
    });
    return () => { cancelled = true; };
  }, []);

  // ── Map State (Google Maps) ──
  // Map state — Leaflet handles the map DOM itself; we only track geocoding status
  const [mapLocating, setMapLocating] = useState(false);

  // Contained-scroll form layout — measure from form top to viewport bottom so the
  // action bar sits naturally below the scroll area and can never overlap the map.
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [formContainerHeight, setFormContainerHeight] = useState(0);

  // Update local state immediately for snappy UX, then fire API upsert async.
  // Backend tolerates the duplicate work — it's idempotent on (barangay_id, kind, canonical).
  const submitEntry = (
    _entries: SmartEntry[],
    setEntries: React.Dispatch<React.SetStateAction<SmartEntry[]>>,
    val: string,
    kind?:
      | "purok" | "street"
      | "citizenship" | "religion" | "ethnicity"
      | "occupation" | "skill" | "position" | "employer"
      | "course" | "school" | "place_of_birth"
      | "sector_other" | "business_type" | "emergency_rel",
  ) => {
    setEntries((prev) => {
      const existing = prev.find((e) => normalizeAddress(e.canonical) === normalizeAddress(val));
      if (existing) {
        return prev.map((e) => e.canonical === existing.canonical
          ? { ...e, count: e.count + 1, aliases: e.aliases.includes(val.toLowerCase()) ? e.aliases : [...e.aliases, val.toLowerCase()] }
          : e);
      }
      const fuzzy = prev.find((e) => similarity(val, e.canonical) > 0.65);
      if (fuzzy) {
        return prev.map((e) => e.canonical === fuzzy.canonical
          ? { ...e, count: e.count + 1, aliases: [...e.aliases, val.toLowerCase()] }
          : e);
      }
      return [...prev, { canonical: val, count: 1, aliases: [val.toLowerCase()] }];
    });
    // Fire-and-forget API upsert; silent failure keeps UX uninterrupted offline
    if (kind) {
      api.addressEntries.upsert({ kind, canonical: val }).catch(() => { /* offline-tolerant */ });
    }
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
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      totalLum += 0.299 * r + 0.587 * g + 0.114 * b;
    }
    const brightness = totalLum / pixelCount;

    // Sharpness: Laplacian variance (measures edge contrast)
    const gray = new Float32Array(pixelCount);
    for (let i = 0; i < pixelCount; i++) {
      const r = data[i * 4] ?? 0;
      const g = data[i * 4 + 1] ?? 0;
      const b = data[i * 4 + 2] ?? 0;
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
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

  const toggleSection = (key: keyof OpenSectionsState) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const updateForm = (key: string, value: string | boolean) => {
    let v = value;
    // Auto-format Philippine mobile number
    if (["mobile_number", "guardian_phone", "emergency_contact_phone"].includes(key) && typeof v === "string") {
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
    if (["mobile_number", "guardian_phone", "emergency_contact_phone"].includes(key) && typeof v === "string" && v.replace(/\s/g, "").length === 11) {
      if (!isValidPHMobile(v)) setFormErrors((prev) => ({ ...prev, [key]: "Must be a valid PH mobile number (09XX XXX XXXX)" }));
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
  const handleSubmit = async (verifiedOtpCode?: string | React.MouseEvent) => {
    const actualOtp = typeof verifiedOtpCode === "string" ? verifiedOtpCode : undefined;
    // Run the shared Zod schema first — catches required, format, range, enum.
    // Tested in schemas.test.ts (29 cases). Anything Zod-validated is removed
    // from the inline block below; the remaining checks cover business rules
    // Zod doesn't express (future dates, Gov-ID length quirks).
    const zodResult = validateResident(form as Record<string, string | boolean>);
    const errors: Record<string, string> = zodResult.ok ? {} : { ...zodResult.errors };

    // Business rule: Date of Birth must not be in the future (Zod only validates format).
    if (f("date_of_birth") && !errors.date_of_birth) {
      const dob = new Date(f("date_of_birth") + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dob > today) errors.date_of_birth = "Date of birth cannot be in the future";
    }

    // Gov-ID length hints — issuer-specific, not in Zod schema
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

    // Tambo OTP Verification Interception
    console.log("[OTP DEBUG] mode:", mode, "isTambo:", isTambo, "actualOtp:", actualOtp);
    if (mode === "create" && isTambo && !actualOtp) {
      const phone = f("mobile_number");
      console.log("[OTP DEBUG] Entered OTP block, phone:", phone);
      if (!phone) {
        setFormErrors({ ...errors, mobile_number: "Mobile number is required for Barangay Tambo verification." });
        addToast({
          type: "error",
          title: "Validation Failed",
          message: "Mobile number is required for Barangay Tambo verification.",
          duration: 5000,
        });
        return;
      }

      setSubmitting(true);
      try {
        await api.residents.sendResidentOtp(phone);
        console.log("[OTP DEBUG] OTP sent successfully, opening modal");
        setOtpSentPhone(phone);
        setOtpError("");
        setOtpCode("");
        setShowOtpModal(true);
      } catch (err: any) {
        addToast({
          type: "error",
          title: "SMS Sending Failed",
          message: err?.message || "Failed to send verification code. Please check SMS balance.",
          duration: 6000,
        });
      } finally {
        setSubmitting(false);
      }
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
      "senior_citizen_id", "senior_citizen_id_expiry",
      "solo_parent_id", "solo_parent_id_expiry",
      // Contact
      "telephone",
      // Voter & Household
      "voter_precinct_number", "last_voted_year", "relationship_to_head",
      // Guardian details for minors
      "guardian_name", "guardian_relationship", "guardian_phone",
      "housing_type", "date_of_occupancy",
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
    payload.pet_entries = petEntries.filter((p) => p.name);

    // Sectors — always send (even empty) so edit correctly clears removed sector tags
    payload.sectors = sectors;

    if (actualOtp) {
      payload.otp_code = actualOtp;
    }

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
    setPetEntries([{ ...emptyPet }]);
    setOpenSections({ other: false, education: false, work: false, govinfo: false, pets: false, emergency: false, biometric: false });
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
    const sexMap: Record<string, string> = {
      male: "Male", female: "Female",
      lesbian: "Lesbian", gay: "Gay", bisexual: "Bisexual",
      transgender: "Transgender", queer: "Queer", intersex: "Intersex",
      other: "Other", "prefer not to say": "Prefer not to say",
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
      guardian_name: upper(r.guardian_name),
      guardian_relationship: cap(r.guardian_relationship),
      guardian_phone: upper(r.guardian_phone),
      housing_type: cap(r.housing_type),
      date_of_occupancy: upper(r.date_of_occupancy),
      house_block_lot: upper((r as unknown as Record<string, unknown>).house_block_lot),
      street: upper((r as unknown as Record<string, unknown>).street),
      purok: upper((r as unknown as Record<string, unknown>).purok),
      // Normalize enums to title-case to match FSelect options
      sex: sexMap[String(r.sex || "").toLowerCase()] || cap(r.sex),
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
      senior_citizen_id_expiry: dateOnly((r as unknown as Record<string, unknown>).senior_citizen_id_expiry),
      solo_parent_id: upper((r as unknown as Record<string, unknown>).solo_parent_id),
      solo_parent_id_expiry: dateOnly((r as unknown as Record<string, unknown>).solo_parent_id_expiry),
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
    const upperPet = (e: PetEntry): PetEntry => ({
      ...e,
      name: upper(e.name),
      pet_type: upper(e.pet_type),
      sex: cap(e.sex),
      date_of_birth: dateOnly(e.date_of_birth),
      remarks: upper(e.remarks),
    });
    setEduEntries((r.education_details as EduEntry[])?.length ? (r.education_details as EduEntry[]).map(upperEdu) : [{ ...emptyEdu }]);
    setWorkEntries((r.work_history as WorkEntry[])?.length ? (r.work_history as WorkEntry[]).map(upperWork) : [{ ...emptyWork }]);
    setBusinessEntries(((r.business_details as BusinessEntry[]) || []).map(upperBiz));
    setPetEntries((r.pet_records as PetEntry[])?.length ? (r.pet_records as PetEntry[]).map(upperPet) : [{ ...emptyPet }]);
    setOpenSections({ other: true, education: true, work: true, govinfo: true, pets: true, emergency: true, biometric: true });
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
      const url = URL.createObjectURL(blob);
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

  const lengthOfStay = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    let years = now.getFullYear() - d.getFullYear();
    let months = now.getMonth() - d.getMonth();
    if (now.getDate() < d.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years < 0) return "Not yet moved in";
    if (years === 0 && months === 0) return "Just moved in";
    const yStr = years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : "";
    const mStr = months > 0 ? `${months} month${months !== 1 ? 's' : ''}` : "";
    if (yStr && mStr) return `${yStr}, ${mStr}`;
    return yStr || mStr;
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
    if (age !== null && age < 18 && !sectors.includes("Minor")) {
      suggestions.push({ sector: "Minor", reason: `Age is ${age} (Under 18)` });
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
  // Barangay boundary GeoJSON — auto-fetched server-side on onboarding via
  // BarangayObserver. The map fits to bounds and overlays the polygon, same
  // as the /dashboard/map page.
  const barangayBoundary = (user?.barangay?.boundary_geojson ?? null) as GeoJsonFeatureCollection | null;

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

  // ══════════════════════════════════════════════════════════
  // ── REGISTRATION FORM (V3-style collapsible + V4 fields)
  // ══════════════════════════════════════════════════════════

  if (mode === "create" || mode === "edit") {
    return (
      <>
        {/* Contained-scroll form: height fills from this element to the viewport bottom.
         The action bar is a natural shrink-0 sibling — never fixed, never overlaps the map. */}
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
                <h1 className="text-3xl text-foreground leading-tight" style={{ fontFamily: "var(--font-playfair)", letterSpacing: "-0.015em" }}>{mode === "create" ? "Create Resident" : "Edit Resident"}</h1>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-0.5">
                <div className="font-medium">{new Date().toLocaleDateString(user?.preferred_language === "fil" ? "fil-PH" : "en-PH", { weekday: "short", month: "short", day: "2-digit", year: "numeric" })}</div>
                <div className="font-medium">{new Date().toLocaleTimeString(user?.preferred_language === "fil" ? "fil-PH" : "en-PH", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="form-gradient-bg rounded-2xl p-6 space-y-3 relative">
              {/* 1. Personal Information and Photo (always visible, not collapsible) */}
              <div className="relative z-[1]">
                <div className="relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-foreground glass-accordion">
                  <User className="h-4.5 w-4.5 shrink-0 text-blue-600 dark:text-blue-300" />
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
                          <FSelect label="Sex / Gender" name="sex" options={["", "Male", "Female", "Lesbian", "Gay", "Bisexual", "Transgender", "Queer", "Intersex", "Other", "Prefer not to say"]} required value={f("sex")} onChange={updateForm} error={formErrors.sex} />
                          <FDatePicker label="Date of Birth" name="date_of_birth" required value={f("date_of_birth")} onChange={updateForm} valid={dupOk("date_of_birth")} error={formErrors.date_of_birth} />
                          <FCombobox label="Place of Birth" name="place_of_birth" required entries={placeOfBirthEntries} value={f("place_of_birth")} onChange={updateForm} onSubmit={(val) => submitEntry(placeOfBirthEntries, setPlaceOfBirthEntries, val, "place_of_birth")} />
                          <FSelect label="Civil Status" name="civil_status" options={["", ...civilStatuses]} required value={f("civil_status")} onChange={updateForm} error={formErrors.civil_status} />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <FInput label="Contact No." name="mobile_number" required type="tel" placeholder="09XX XXX XXXX" value={f("mobile_number")} onChange={updateForm} maxLength={13} error={formErrors.mobile_number} />
                          <FInput label="Telephone" name="telephone" type="tel" placeholder="e.g. (02) 8123 4567" value={f("telephone")} onChange={updateForm} />
                          <FInput label="Email Address" name="email" type="email" placeholder="name@example.com" value={f("email")} onChange={updateForm} error={formErrors.email} />
                          <FSelect label="Residence Type" name="resident_type" options={residentTypes} required value={f("resident_type")} onChange={updateForm} error={formErrors.resident_type} />
                          <FSelect label="Housing / Settlement Type" name="housing_type" options={["", "Street", "Barracks", "Subdivision", "House / Apartment"]} value={f("housing_type")} onChange={updateForm} error={formErrors.housing_type} />
                          <FInput label="Date of Occupancy (Length of Stay)" name="date_of_occupancy" type="date" value={f("date_of_occupancy")} onChange={updateForm} error={formErrors.date_of_occupancy} />
                          <FRadio label="Head of Household?" name="is_head_of_household" value={fb("is_head_of_household") ? "yes" : "no"}
                            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                            onChange={(n, v) => updateForm(n, v === "yes")} />
                        </div>

                        {/* Parent / Guardian Information — only rendered if resident is a minor (<18) */}
                        {(() => {
                          const age = getAgeFromDob(f("date_of_birth"));
                          return age !== null && age < 18;
                        })() && (
                            <div className="rounded-xl border border-border bg-blue-50/20 dark:bg-blue-950/5 p-4 space-y-3">
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Parent / Guardian / Beneficiary Information</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FInput
                                  label="Parent / Guardian Name"
                                  name="guardian_name"
                                  required
                                  placeholder="e.g. Maria Dela Cruz"
                                  value={f("guardian_name")}
                                  onChange={updateForm}
                                  error={formErrors.guardian_name}
                                />
                                <FSelect
                                  label="Relationship to Minor"
                                  name="guardian_relationship"
                                  required
                                  options={["", "Mother", "Father", "Grandparent", "Sibling", "Legal Guardian", "Other Relative"]}
                                  value={f("guardian_relationship")}
                                  onChange={updateForm}
                                  error={formErrors.guardian_relationship}
                                />
                                <FInput
                                  label="Guardian Contact No."
                                  name="guardian_phone"
                                  type="tel"
                                  placeholder="09XX XXX XXXX"
                                  value={f("guardian_phone")}
                                  onChange={updateForm}
                                  maxLength={13}
                                  error={formErrors.guardian_phone}
                                />
                              </div>
                            </div>
                          )}
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
                                className="flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15 transition-colors">
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
                                className="hidden md:flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {cameraLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                {cameraLoading ? "Opening..." : "Camera"}
                              </button>
                              {/* Mobile: opens native camera (back-facing default, user can flip to front) */}
                              <button type="button" onClick={() => photoCaptureRef.current?.click()}
                                className="flex md:hidden flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15 transition-colors">
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
                              <p className="text-xs text-muted-foreground mt-0.5">{r.resident_number} &middot; {r.sex} &middot; Age {r.age} &middot; DOB: {r.date_of_birth} &middot; {isTambo ? "Block/Lot" : "Purok"} {r.purok || "N/A"}</p>
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
                <div className="relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-foreground glass-accordion">
                  <MapPin className="h-4.5 w-4.5 shrink-0 text-blue-600 dark:text-blue-300" />
                  <span className="flex-1 text-sm font-bold uppercase tracking-wider">Current Address</span>
                </div>
                <div className="glass-section rounded-b-xl mt-px px-5 pt-5 pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <FInput label={isTambo ? "House No. / Subdivision / Village" : "House No. / Blk & Lot / Subdivision / Village"} name="house_block_lot" placeholder={isTambo ? "E.g. Unit 4B, Villa Verde Subd. Phase 2" : "E.g. Unit 4B Blk 5 Lot 12, Villa Verde Subd. Phase 2"} value={f("house_block_lot")} onChange={updateForm} />
                      <FCombobox label={isTambo ? "Block and Lot" : "Purok / Sitio"} name="purok" entries={purokEntries} value={f("purok")}
                        onChange={updateForm} onSubmit={(val) => submitEntry(purokEntries, setPurokEntries, val, "purok")} />
                      <FCombobox label="Street / Road" name="street" entries={streetEntries} value={f("street")}
                        onChange={updateForm} onSubmit={(val) => submitEntry(streetEntries, setStreetEntries, val, "street")} />
                      <FInput label="Zip Code" name="zip_code" placeholder="e.g. 1230" value={f("zip_code")} onChange={updateForm} maxLength={4} />
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
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Barangay Zip</label>
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
                        boundary={barangayBoundary}
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
                        onChange={updateForm} onSubmit={(val) => submitEntry(citizenshipEntries, setCitizenshipEntries, val, "citizenship")} />
                      <FCombobox label="Religion" name="religion" entries={religionEntries} value={f("religion")}
                        onChange={updateForm} onSubmit={(val) => submitEntry(religionEntries, setReligionEntries, val, "religion")} />
                      <FCombobox label="Ethnicity" name="ethnicity" entries={ethnicityEntries} value={f("ethnicity")}
                        onChange={updateForm} onSubmit={(val) => submitEntry(ethnicityEntries, setEthnicityEntries, val, "ethnicity")} />
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
                      {sectorsList.map((s) => (
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
                          entries={sectorOtherEntries} onSubmit={(val) => submitEntry(sectorOtherEntries, setSectorOtherEntries, val, "sector_other")}
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
                            onSubmit={(val) => submitEntry(courseEntries, setCourseEntries, val, "course")} disabled={courseDisabled} />
                          <FCombobox label="School / Institution" name="school" entries={schoolEntries} value={entry.school}
                            onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, school: String(v) } : x))}
                            onSubmit={(val) => submitEntry(schoolEntries, setSchoolEntries, val, "school")} disabled={allDisabled} />
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
                          entries={occupationEntries} onSubmit={(val) => submitEntry(occupationEntries, setOccupationEntries, val, "occupation")}
                          onChange={updateForm} placeholder="Type to search or add occupation..." />
                        <FSelect label="Monthly Income Range" name="monthly_income_range" options={incomeRanges} value={f("monthly_income_range")} onChange={updateForm} />
                        <FCombobox label="Skills / Specialization" name="skills" value={f("skills")}
                          entries={skillEntries} onSubmit={(val) => submitEntry(skillEntries, setSkillEntries, val, "skill")}
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
                                value={entry.position} entries={positionEntries} onSubmit={(val) => submitEntry(positionEntries, setPositionEntries, val, "position")}
                                onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, position: String(v) } : x))}
                                placeholder="Type to search or add position..." />
                              <FCombobox label="Company / Employer" name="company"
                                value={entry.company} entries={employerEntries} onSubmit={(val) => submitEntry(employerEntries, setEmployerEntries, val, "employer")}
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
                              value={entry.position} entries={positionEntries} onSubmit={(val) => submitEntry(positionEntries, setPositionEntries, val, "position")}
                              onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, position: String(v) } : x))}
                              placeholder="Type to search or add position..." />
                            <FCombobox label="Company / Employer" name="company"
                              value={entry.company} entries={employerEntries} onSubmit={(val) => submitEntry(employerEntries, setEmployerEntries, val, "employer")}
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
                              entries={businessTypeEntries} onSubmit={(val) => submitEntry(businessTypeEntries, setBusinessTypeEntries, val, "business_type")}
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
                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <FInput label="Senior Citizen ID" name="senior_citizen_id" placeholder="e.g. SC-XXXX" value={f("senior_citizen_id")} onChange={updateForm} />
                      <FDatePicker label="Expiration Date" name="senior_citizen_id_expiry" value={f("senior_citizen_id_expiry")} onChange={updateForm} />
                    </div>
                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <FInput label="Solo Parent ID" name="solo_parent_id" placeholder="e.g. SP-XXXX" value={f("solo_parent_id")} onChange={updateForm} />
                      <FDatePicker label="Expiration Date" name="solo_parent_id_expiry" value={f("solo_parent_id_expiry")} onChange={updateForm} />
                    </div>
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
                    onChange={updateForm} onSubmit={(val) => submitEntry(emergencyRelEntries, setEmergencyRelEntries, val, "emergency_rel")} />
                </div>
              </Section>

              {/* 8. Pets Information */}
              <Section icon={<PawPrint className="h-4 w-4" />} title="Pets Information"
                open={openSections.pets} onToggle={() => toggleSection("pets")}>
                <div className="space-y-4">
                  {petEntries.map((entry, idx) => (
                    <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3 bg-muted/10">
                      {petEntries.length > 1 && (
                        <button type="button" onClick={() => setPetEntries((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <FInput label="Pet Name" name="name" required placeholder="e.g. BANTAY"
                          value={entry.name} onChange={(_, v) => setPetEntries((prev) => prev.map((x, i) => i === idx ? { ...x, name: String(v) } : x))} />
                        <FSelect label="Pet Type" name="pet_type" options={["", "Dog", "Cat", "Bird", "Fish", "Rabbit", "Others"]}
                          value={entry.pet_type} onChange={(_, v) => setPetEntries((prev) => prev.map((x, i) => i === idx ? { ...x, pet_type: String(v) } : x))} />
                        <FSelect label="Sex" name="sex" options={["", "Male", "Female"]}
                          value={entry.sex} onChange={(_, v) => setPetEntries((prev) => prev.map((x, i) => i === idx ? { ...x, sex: String(v) } : x))} />
                        <FInput label="Date of Birth" name="date_of_birth" type="date"
                          value={entry.date_of_birth} onChange={(_, v) => setPetEntries((prev) => prev.map((x, i) => i === idx ? { ...x, date_of_birth: String(v) } : x))} />
                      </div>
                      <div>
                        <FInput label="Remarks & Vaccinations" name="remarks" placeholder="e.g. FULLY VACCINATED, SPAYED"
                          value={entry.remarks} onChange={(_, v) => setPetEntries((prev) => prev.map((x, i) => i === idx ? { ...x, remarks: String(v) } : x))} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setPetEntries((prev) => [...prev, { ...emptyPet }])}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                    <Plus className="h-4 w-4" /> Add another pet
                  </button>
                </div>
              </Section>

              {/* 9. Left & Right Thumbmark */}
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
                <button onClick={() => handleSubmit()} disabled={submitting}
                  className="group relative px-7 py-2.5 text-sm font-bold rounded-xl text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: submitting ? "var(--accent-primary)" : "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? (mode === "edit" ? "Saving..." : "Registering...") : (mode === "edit" ? "Save Changes" : "Register Resident")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* OTP Verification Modal (Barangay Tambo only) */}
        <Modal
          open={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          title="Mobile Verification Required"
          description={`A 6-digit verification code has been sent to ${otpSentPhone}.`}
          size="sm"
          footer={
            <>
              <ModalButton
                variant="secondary"
                onClick={() => setShowOtpModal(false)}
                disabled={otpLoading}
              >
                Cancel
              </ModalButton>
              <ModalButton
                variant="primary"
                onClick={async () => {
                  if (otpCode.length !== 6) {
                    setOtpError("Please enter a valid 6-digit code.");
                    return;
                  }
                  setOtpLoading(true);
                  setOtpError("");
                  try {
                    await handleSubmit(otpCode);
                    setShowOtpModal(false);
                  } catch (err: any) {
                    setOtpError(err?.message || "Verification failed. Please try again.");
                  } finally {
                    setOtpLoading(false);
                  }
                }}
                disabled={otpLoading || otpCode.length !== 6}
              >
                {otpLoading ? "Verifying..." : "Verify & Register"}
              </ModalButton>
            </>
          }
        >
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setOtpCode(val);
                  setOtpError("");
                }}
                className="w-full text-center text-2xl font-mono tracking-[0.5em] pl-[0.25em] py-3 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
              {otpError && (
                <p className="text-xs text-red-500 mt-2 text-center font-medium">{otpError}</p>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                disabled={otpLoading}
                onClick={async () => {
                  setOtpLoading(true);
                  setOtpError("");
                  try {
                    await api.residents.sendResidentOtp(otpSentPhone);
                    addToast({ type: "success", title: "Code Resent", message: "A new 6-digit OTP code has been sent." });
                  } catch (err: any) {
                    setOtpError(err?.message || "Failed to resend code.");
                  } finally {
                    setOtpLoading(false);
                  }
                }}
                className="text-xs text-accent-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer"
              >
                Didn't receive the code? Resend SMS
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ── LIST VIEW
  // ══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <PageHeader title={t.residents.pageTitle} description={t.residents.pageDescription}
        breadcrumbs={[{ label: t.residents.breadcrumbs.dashboard, href: "/dashboard" }, { label: t.residents.breadcrumbs.records }, { label: t.residents.breadcrumbs.residents }]}
      />

      <ResidentStatCards residentStats={residentStats} statsLoading={statsLoading} listTotal={listTotal} />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setResidentView("active"); setPage(1); setActionMenu(null); }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              residentView === "active"
                ? "border-accent-primary bg-accent-bg text-accent-text"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t.residents.search.activeTab}
          </button>
          <button
            onClick={() => { setResidentView("archived"); setPage(1); setActionMenu(null); }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              residentView === "archived"
                ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t.residents.search.archivedTab}
          </button>
        </div>
        {/* Search + Actions row — premium with focus glow, filter chip + match counter inside */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            {/* Focus glow ring — appears when input has focus-within */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-primary/0 via-accent-primary/[0.08] to-accent-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -m-px" />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent-primary pointer-events-none transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t.residents.search.placeholder}
              className="relative w-full pl-10 pr-36 py-2.5 text-sm rounded-xl glass-input placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent-primary/30 transition-all duration-200"
            />
            {/* Right-side cluster: match count + Filters chip + Ctrl+K hint */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {search && !listLoading && (
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground px-1.5">
                  {listTotal.toLocaleString()}
                </span>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors",
                  showFilters
                    ? "bg-accent-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={t.residents.search.filtersTitle}
              >
                <Filter className="h-3 w-3" />
                <span>{t.residents.search.filtersTitle}</span>
                {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all" || civilStatusFilter !== "All Civil Status" || residentTypeFilter !== "All Resident Types" || hohFilter !== "all" || citizenshipFilter !== "All Citizenship" || religionFilter !== "All Religion" || ethnicityFilter !== "All Ethnicity" || sectorFilter !== "All Sectors") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </button>
              {/* Ctrl+K hint — keyboard shortcut indicator (hides on focus) */}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 h-6 px-1.5 rounded-md text-[10px] font-medium border border-border bg-muted/40 text-muted-foreground group-focus-within:opacity-0 transition-opacity">
                <span className="text-[9px]">⌘</span>K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-all duration-200 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{t.residents.search.export || "Export CSV"}</span>
            </button>
            {residentView === "active" && (
              <button onClick={openCreate} className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] hover:-translate-y-0.5 duration-200" style={{ background: "var(--accent-primary)" }}>
                <Plus className="h-4 w-4" /> {t.residents.search.newResident}
              </button>
            )}
          </div>
        </div>
        {/* Filter chips row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="inline-flex items-center h-8 px-3 text-xs font-semibold rounded-full bg-muted text-foreground tabular-nums">
              {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all" || civilStatusFilter !== "All Civil Status" || residentTypeFilter !== "All Resident Types" || hohFilter !== "all" || citizenshipFilter !== "All Citizenship" || religionFilter !== "All Religion" || ethnicityFilter !== "All Ethnicity" || sectorFilter !== "All Sectors" || search)
                ? <>{listTotal.toLocaleString()} {t.residents.search.foundOf} <span className="text-muted-foreground font-normal ml-1">{(residentStats?.total_residents ?? listTotal).toLocaleString()} {t.residents.search.total}</span></>
                : <>{(residentStats?.total_residents ?? listTotal).toLocaleString()} {t.residents.search.residentsCount}</>
              }
            </span>
            <select value={purokFilter} onChange={(e) => { setPurokFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {puroks.map((p) => <option key={p} value={p}>{filterLabel(p)}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {statuses.map((s) => <option key={s} value={s}>{filterLabel(s)}</option>)}
            </select>
            <select value={sexFilter} onChange={(e) => { setSexFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {sexOptions.map((s) => <option key={s} value={s}>{filterLabel(s)}</option>)}
            </select>
            <select value={civilStatusFilter} onChange={(e) => { setCivilStatusFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Civil Status", ...civilStatuses].map((s) => <option key={s} value={s}>{filterLabel(s)}</option>)}
            </select>
            <select value={residentTypeFilter} onChange={(e) => { setResidentTypeFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Resident Types", "Permanent", "Transient", "Transferee"].map((s) => <option key={s} value={s}>{filterLabel(s)}</option>)}
            </select>
            <select value={voterFilter} onChange={(e) => { setVoterFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              <option value="all">{t.residents.filters.allVoters}</option>
              <option value="voter">{t.residents.filters.registeredVoter}</option>
              <option value="non-voter">{t.residents.filters.nonVoter}</option>
            </select>
            <select value={hohFilter} onChange={(e) => { setHohFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              <option value="all">{t.residents.filters.allHouseholds}</option>
              <option value="hoh">{t.residents.filters.headOfHousehold}</option>
              <option value="non-hoh">{t.residents.filters.notHead}</option>
            </select>
            <select value={citizenshipFilter} onChange={(e) => { setCitizenshipFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Citizenship", "Filipino", "American", "Chinese", "Japanese", "Korean", "Other"].map((s) => <option key={s} value={s}>{filterLabel(s)}</option>)}
            </select>
            <select value={religionFilter} onChange={(e) => { setReligionFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Religion", "Catholic", "INC (Iglesia ni Cristo)", "Born Again", "Muslim", "Protestant", "Seventh Day Adventist", "Baptist", "Methodist", "Jehovah's Witness", "Mormon", "Aglipayan", "Buddhist", "Other"].map((s) => <option key={s} value={s}>{filterLabel(s)}</option>)}
            </select>
            <select value={ethnicityFilter} onChange={(e) => { setEthnicityFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Ethnicity", "Tagalog", "Ilocano", "Pangasinan", "Pampanga", "Bicolano", "Visayan", "Zamboangueño", "Tausug", "Maranao", "Other"].map((s) => <option key={s} value={s}>{filterLabel(s)}</option>)}
            </select>
            <select value={sectorFilter} onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {["All Sectors", ...sectorsList].map((s) => <option key={s} value={s}>{filterLabel(s)}</option>)}
            </select>
            {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all" || civilStatusFilter !== "All Civil Status" || residentTypeFilter !== "All Resident Types" || hohFilter !== "all" || citizenshipFilter !== "All Citizenship" || religionFilter !== "All Religion" || ethnicityFilter !== "All Ethnicity" || sectorFilter !== "All Sectors") && (
              <button onClick={() => { setPurokFilter("All Puroks"); setStatusFilter("All Status"); setSexFilter("All"); setVoterFilter("all"); setCivilStatusFilter("All Civil Status"); setResidentTypeFilter("All Resident Types"); setHohFilter("all"); setCitizenshipFilter("All Citizenship"); setReligionFilter("All Religion"); setEthnicityFilter("All Ethnicity"); setSectorFilter("All Sectors"); }}
                className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium rounded-full text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors">
                <X className="h-4 w-4" /> {t.residents.search.clearAll}
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
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label={t.residents.table.barangayId} field="resident_number" className="whitespace-nowrap" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label={t.residents.table.fullName} field="last_name" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label={t.residents.table.age} field="age" className="text-center" />
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t.residents.table.gender}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">{t.residents.table.civilStatus}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t.residents.table.voter}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t.residents.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                      <p className="text-sm text-muted-foreground">{t.residents.table.loading}</p>
                    </div>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{residentView === "archived" ? t.residents.table.noArchivedResidents : t.residents.table.noResidentsFound}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {search || purokFilter !== "All Puroks" || statusFilter !== "All Status"
                            ? t.residents.table.adjustSearchOrFilters
                            : residentView === "archived"
                              ? t.residents.table.archivedResidentsWillAppear
                              : t.residents.table.registerOrImport}
                        </p>
                      </div>
                      {residentView === "active" && !search && purokFilter === "All Puroks" && statusFilter === "All Status" && (
                        <button onClick={openCreate} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                          + {t.residents.search.newResident}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((r, index) => {
                  const initials = `${(r.first_name || "")[0] || "?"}${(r.last_name || "")[0] || "?"}`;
                  const fullName = `${(r.last_name || "").toUpperCase()}, ${(r.first_name || "").toUpperCase()} ${r.middle_name ? r.middle_name[0].toUpperCase() + "." : ""}${r.extension_name ? " " + r.extension_name : ""}`.trim();
                  const address = [r.house_block_lot, r.street, r.purok ? (isTambo ? r.purok : `Purok ${r.purok}`) : ""].filter(Boolean).join(", ").toUpperCase() || "—";
                  const age = r.date_of_birth ? Math.floor((Date.now() - new Date(r.date_of_birth).getTime()) / 31557600000) : null;
                  const daysAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
                  const createdLabel = formatTimeSince(daysAgo);
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
                              <img src={resolvePhotoUrl(r.photo_url)!} alt={initials} className="w-12 h-12 rounded-xl object-cover ring-1 ring-border/60 shadow-sm" />
                            ) : (
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/20 shadow-sm",
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
                              <div className="absolute bottom-full left-0 mb-3 z-[9999] pointer-events-none" style={{ width: "260px" }}>
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
                                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${c.source === "kp_case" ? "bg-red-800 text-red-200" : "bg-orange-900 text-orange-300"}`}>
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
                              <div className="absolute bottom-full right-0 mb-3 z-[9999] pointer-events-none" style={{ width: "240px" }}>
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
                                        {t.residents.tooltips.headOfHousehold}
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
                                  {[r.purok ? (isTambo ? `Block/Lot ${r.purok}` : `Purok ${r.purok}`) : null, r.street].filter(Boolean).join(' - ')}
                                </p>
                                {hoveredTooltip === "addr-" + r.id && (<div className="absolute bottom-full left-0 mb-2 z-[60] pointer-events-none">
                                  <div className="bg-slate-900 text-white rounded-xl shadow-2xl overflow-hidden min-w-[220px]">
                                    <div className="px-3 py-2 bg-slate-800 border-b border-slate-700">
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Full Address</p>
                                    </div>
                                    <div className="px-3 py-2 space-y-1">
                                      {r.house_block_lot && <p className="text-xs text-slate-300"><span className="text-slate-500 mr-1">House/Lot:</span>{r.house_block_lot}</p>}
                                      {r.purok && <p className="text-xs text-slate-300"><span className="text-slate-500 mr-1">{isTambo ? "Block/Lot:" : "Purok:"}</span>{r.purok}</p>}
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
                              {t.residents.table.lastTransaction}: {createdLabel}
                              {hoveredTooltip === "lt-" + r.id && (
                                <span className="absolute left-0 bottom-full mb-2 z-[60] pointer-events-none" style={{ width: "250px" }}>
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
                      {/* Gender — subtle pill (premium) */}
                      <td className="px-4 py-3.5 text-center">
                        {r.sex ? (
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
                            r.sex.toLowerCase() === "male"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              : r.sex.toLowerCase() === "female"
                                ? "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300"
                                : ["lesbian", "gay", "bisexual", "transgender", "queer", "intersex"].includes(r.sex.toLowerCase())
                                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                  : "bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
                          )}>
                            {r.sex.toLowerCase() === "male"
                              ? t.residents.sex.male
                              : r.sex.toLowerCase() === "female"
                                ? t.residents.sex.female
                                : r.sex}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Civil Status — Title Case in subtle slate pill (premium) */}
                      <td className="px-4 py-3.5 text-center">
                        {r.civil_status ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                            {r.civil_status.toLowerCase()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Voter */}
                      <td className="px-4 py-3.5 text-center">
                        {r.is_voter ? (
                          <span
                            className="relative inline-flex items-center justify-center cursor-default"
                            onMouseEnter={(e) => { e.stopPropagation(); setHoveredTooltip("voter-" + r.id); }}
                            onMouseLeave={() => setHoveredTooltip(null)}
                          >
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {t.residents.table.voterYes}
                            </span>
                            {hoveredTooltip === "voter-" + r.id && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] pointer-events-none" style={{ width: "220px" }}>
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {t.residents.table.voterNo}
                          </span>
                        )}
                      </td>
                      {/* Actions — unified neutral hover, colored-icon-on-hover (premium look) */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5 rounded-xl border border-border/40 bg-muted/20 px-1 py-0.5">
                          {/* View */}
                          <button
                            onClick={() => router.push(`/dashboard/residents/${r.id}`)}
                            className="group p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"
                            title={t.residents.actions.viewProfile}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                          </button>
                          {/* Generate Document */}
                          <button
                            onClick={() => { setDocWizardResidentId(r.id); setDocWizardCategory(null); setShowDocWizard(true); }}
                            className="group p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                            title={t.residents.actions.generateDocument}
                          >
                            <ScrollText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                          </button>
                          {/* Generate ID Card */}
                          <button
                            onClick={() => { setIdModalResidentId(r.id); setShowIdModal(true); }}
                            className="group p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors"
                            title={t.residents.actions.generateIdCard}
                          >
                            <IdCard className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
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
                            className="group p-1.5 rounded-lg hover:bg-orange-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title={r.mobile_number ? `${t.residents.actions.sendSmsTo} ${r.mobile_number}` : t.residents.actions.noMobileNumber}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-orange-500 transition-colors group-disabled:group-hover:text-muted-foreground" />
                          </button>
                          {/* Email */}
                          <button
                            onClick={() => {
                              setEmailModalResident({
                                id: r.id,
                                name: `${r.last_name}, ${r.first_name}${r.middle_name ? " " + r.middle_name.charAt(0) + "." : ""}${r.extension_name ? " " + r.extension_name : ""}`.trim(),
                                email: r.email ?? null,
                              });
                              setShowEmailModal(true);
                            }}
                            disabled={!r.email}
                            className="group p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title={r.email ? `Send Email to ${r.email}` : "No email registered"}
                          >
                            <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-500 transition-colors group-disabled:group-hover:text-muted-foreground" />
                          </button>
                          {/* More */}
                          <div className="relative">
                            <button
                              onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)}
                              className="group p-1.5 rounded-lg hover:bg-muted transition-colors"
                              title={t.residents.actions.moreActions}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                            {actionMenu === r.id && (
                              <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg py-1.5">
                                <button onClick={async () => { setActionMenu(null); try { const detail = await api.residents.get(r.id); openEdit(detail); } catch { addToast({ type: "error", title: t.residents.actions.failedToLoad }); } }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-100 text-left transition-colors"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /> {t.residents.actions.editProfile}</button>
                                <button
                                  onClick={() => { setActionMenu(null); handlePrint(r.id); }}
                                  disabled={printingId === r.id}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-100 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                  {printingId === r.id
                                    ? <Loader2 className="h-4 w-4 text-gray-500 dark:text-gray-400 animate-spin" />
                                    : <Printer className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                                  {printingId === r.id ? t.residents.actions.generatingPdf : t.residents.actions.printRecord}
                                </button>
                                <div className="border-t border-gray-200 dark:border-slate-600 my-1" />
                                {residentView === "active" && (
                                  <button onClick={() => { setActionMenu(null); setArchiveTarget({ id: r.id, first_name: r.first_name, last_name: r.last_name, sex: r.sex, resident_number: r.resident_number }); setArchiveModal(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20 text-left text-amber-600 dark:text-amber-400 transition-colors"><Archive className="h-4 w-4" /> {t.residents.actions.archiveRecord}</button>
                                )}
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
            <p className="text-sm text-muted-foreground">{t.residents.pagination.showing} {((safePage - 1) * pageSize) + 1}--{Math.min(safePage * pageSize, listTotal)} {t.residents.pagination.of} {listTotal} {t.residents.pagination.residentsLower}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-3 py-1 text-sm font-medium">{safePage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
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
              {t.residents.quickView.close}
            </button>
            <button
              onClick={() => { if (viewResident) { setViewResident(null); router.push(`/dashboard/residents/${viewResident.id}`); } }}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-accent-primary hover:bg-accent-hover text-white transition-all shadow-sm"
            >
              <Eye className="h-4 w-4" /> {t.residents.quickView.viewFullProfile}
            </button>
          </div>
        }>
        {viewResident && (
          <div>
            {/* Cross-barangay alert */}
            {(viewResident.cross_barangay_flags?.length ?? 0) > 0 && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl text-sm bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Flag className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{t.residents.quickView.crossBarangayAlert}</span>
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
                  {viewResident.is_voter && <Badge variant="success" dot>{t.residents.quickView.registeredVoter}</Badge>}
                  {viewResident.is_head_of_household && <Badge variant="warning" dot>{t.residents.quickView.headOfHousehold}</Badge>}
                </div>
              </div>

              {/* Profile completion */}
              <div className="shrink-0 text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t.residents.quickView.profile}</div>
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
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.residents.quickView.personal}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">{t.residents.quickView.born}</span>
                    <span className="text-sm font-medium text-foreground truncate">
                      {viewResident.date_of_birth
                        ? (() => { const d = new Date(viewResident.date_of_birth.includes("T") ? viewResident.date_of_birth : viewResident.date_of_birth + "T00:00:00"); return `${d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} · ${Math.floor((Date.now() - d.getTime()) / 31557600000)} yrs`; })()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">{t.residents.quickView.sex}</span>
                    <span className="text-sm font-medium text-foreground">{viewResident.sex || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">{t.residents.quickView.civil}</span>
                    <span className="text-sm font-medium text-foreground capitalize">{viewResident.civil_status || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">{t.residents.quickView.blood}</span>
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
                    {viewResident.mobile_number && (
                      <button
                        onClick={() => {
                          setSmsModalResident({
                            id: viewResident.id,
                            name: `${viewResident.last_name}, ${viewResident.first_name}${viewResident.middle_name ? " " + viewResident.middle_name.charAt(0) + "." : ""}${viewResident.extension_name ? " " + viewResident.extension_name : ""}`.trim(),
                            mobile_number: viewResident.mobile_number,
                          });
                          setShowSmsModal(true);
                        }}
                        className="ml-auto p-1 rounded-md hover:bg-muted text-orange-500 hover:text-orange-600 transition-colors"
                        title="Send SMS"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Email</span>
                    <span className="text-sm font-medium text-foreground truncate">{viewResident.email || "—"}</span>
                    {viewResident.email && (
                      <button
                        onClick={() => {
                          setEmailModalResident({
                            id: viewResident.id,
                            name: `${viewResident.last_name}, ${viewResident.first_name}${viewResident.middle_name ? " " + viewResident.middle_name.charAt(0) + "." : ""}${viewResident.extension_name ? " " + viewResident.extension_name : ""}`.trim(),
                            email: viewResident.email,
                          });
                          setShowEmailModal(true);
                        }}
                        className="ml-auto p-1 rounded-md hover:bg-muted text-blue-500 hover:text-blue-600 transition-colors"
                        title="Send Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Address</span>
                    <span className="text-sm font-medium text-foreground leading-snug">
                      {[viewResident.house_block_lot, viewResident.street, viewResident.purok ? (isTambo ? viewResident.purok : `Purok ${viewResident.purok}`) : ""].filter(Boolean).join(", ") || "—"}
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
                  <div className="flex items-center gap-2">
                    <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Housing</span>
                    <span className="text-sm font-medium text-foreground truncate">{viewResident.housing_type || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Occupancy</span>
                    <span className="text-sm font-medium text-foreground truncate">
                      {viewResident.date_of_occupancy
                        ? `${new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(viewResident.date_of_occupancy))} (${lengthOfStay(viewResident.date_of_occupancy)})`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Info for Minors */}
            {(() => {
              const age = getAgeFromDob(viewResident.date_of_birth);
              return age !== null && age < 18;
            })() && (
                <div className="mt-3 p-3.5 rounded-xl bg-muted/40 dark:bg-slate-800/40 space-y-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Parent / Guardian Information</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Guardian Name</span>
                      <span className="text-sm font-semibold text-foreground truncate block">{viewResident.guardian_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Relationship</span>
                      <span className="text-sm font-semibold text-foreground truncate block capitalize">{viewResident.guardian_relationship || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Contact Number</span>
                      <span className="text-sm font-semibold text-foreground truncate block">{viewResident.guardian_phone || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

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
      <SendEmailModal
        open={showEmailModal}
        onClose={() => { setShowEmailModal(false); setEmailModalResident(null); }}
        resident={emailModalResident}
      />

      {/* OTP Verification Modal (Barangay Tambo only) */}
      <Modal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Mobile Verification Required"
        description={`A 6-digit verification code has been sent to ${otpSentPhone}.`}
        size="sm"
        footer={
          <>
            <ModalButton
              variant="secondary"
              onClick={() => setShowOtpModal(false)}
              disabled={otpLoading}
            >
              Cancel
            </ModalButton>
            <ModalButton
              variant="primary"
              onClick={async () => {
                if (otpCode.length !== 6) {
                  setOtpError("Please enter a valid 6-digit code.");
                  return;
                }
                setOtpLoading(true);
                setOtpError("");
                try {
                  // Finalize submission with OTP code parameter
                  await handleSubmit(otpCode);
                  setShowOtpModal(false);
                } catch (err: any) {
                  setOtpError(err?.message || "Verification failed. Please try again.");
                } finally {
                  setOtpLoading(false);
                }
              }}
              disabled={otpLoading || otpCode.length !== 6}
            >
              {otpLoading ? "Verifying..." : "Verify & Register"}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setOtpCode(val);
                setOtpError("");
              }}
              className="w-full text-center text-2xl font-mono tracking-[0.5em] pl-[0.25em] py-3 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            />
            {otpError && (
              <p className="text-xs text-red-500 mt-2 text-center font-medium">{otpError}</p>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              disabled={otpLoading}
              onClick={async () => {
                setOtpLoading(true);
                setOtpError("");
                try {
                  await api.residents.sendResidentOtp(otpSentPhone);
                  addToast({ type: "success", title: "Code Resent", message: "A new 6-digit OTP code has been sent." });
                } catch (err: any) {
                  setOtpError(err?.message || "Failed to resend code.");
                } finally {
                  setOtpLoading(false);
                }
              }}
              className="text-xs text-accent-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer"
            >
              Didn't receive the code? Resend SMS
            </button>
          </div>
        </div>
      </Modal>

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
