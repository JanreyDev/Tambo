"use client";

/**
 * Census Mode — Independent mobile-first resident registration wizard.
 *
 * IDENTICAL fields to the desktop create resident form.
 * This page is COMPLETELY INDEPENDENT from the main residents form.
 * Same API endpoint (POST /api/v1/residents), different UI.
 *
 * Principles applied:
 *   1. AI-First — Mabini contextual tips per step
 *   2. Tanga-Proof — 44px touch targets, step validation, no technical errors,
 *      uppercase enforcement, auto-duplicate check, GPS auto-detect,
 *      simple Taglish labels, confirmation dialogs, auto-save drafts
 *   6. Offline-Ready — IndexedDB queue, connection status, auto-sync,
 *      draft preservation across page close/refresh
 *   9. Fast on Slow Hardware — lightweight, no heavy deps, image resize
 */

import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from "react";
import {
  ChevronLeft, ChevronRight, Check, Loader2, Camera, Upload,
  X, UserCheck, AlertTriangle, MapPin, Sparkles,
  User, Home, Phone, FileImage, ClipboardCheck, RotateCcw,
  Heart, GraduationCap, Briefcase, CreditCard, ShieldAlert,
  Stethoscope, Plus, Trash2, WifiOff, CloudOff,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { queueSubmission, saveDraft, loadDraft, clearDraft } from "@/lib/census-offline";

// ══════════════════════════════════════════════════════════════════════════════
// Constants — Steps, options, AI tips
// ══════════════════════════════════════════════════════════════════════════════

const STEPS = [
  { id: "identity",   label: "Pangalan",   desc: "Name & Identity",   icon: User },
  { id: "physical",   label: "Personal",   desc: "Physical & Demographics", icon: Heart },
  { id: "address",    label: "Tirahan",    desc: "Address & Household", icon: Home },
  { id: "contact",    label: "Kontak",     desc: "Contact & Voter",    icon: Phone },
  { id: "sector",     label: "Sektor",     desc: "Sector & Health",    icon: Stethoscope },
  { id: "education",  label: "Edukasyon",  desc: "Education",          icon: GraduationCap },
  { id: "work",       label: "Trabaho",    desc: "Work & Business",    icon: Briefcase },
  { id: "govid",      label: "Gov IDs",    desc: "Government IDs",     icon: CreditCard },
  { id: "emergency",  label: "Emergency",  desc: "Emergency Contact",  icon: ShieldAlert },
  { id: "photo",      label: "Litrato",    desc: "Photo",              icon: FileImage },
  { id: "review",     label: "Review",     desc: "Review & Submit",    icon: ClipboardCheck },
] as const;

const extensions = ["", "Jr.", "Sr.", "II", "III", "IV", "V"];
const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Divorced", "Annulled", "Live-In"];
const residentTypes = ["Permanent", "Transient", "Transferee"];
const sexOptions = ["Male", "Female"];
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const complexions = ["Fair", "Light Brown", "Brown", "Dark Brown", "Dark"];
const sectorOptions = [
  "Senior Citizen", "PWD", "Solo Parent", "4Ps Beneficiary", "Farmer",
  "Nano/Micro Entrepreneur", "Student", "OFW", "TODA Driver", "JODA Driver",
  "Other Driver", "Vendor", "Working Student", "LGBTQIA+",
  "With Comorbidities", "IP (Indigenous People)",
];
const educationLevels = [
  "No Formal Education", "Elementary", "High School", "Senior High School",
  "Vocational", "College", "Post Graduate",
];
const livelihoodTypes = ["Employed", "Self-employed", "Unemployed", "Retired", "Student", "OFW"];
const employmentTypes = ["Full-Time", "Part-Time", "Casual", "Seasonal", "Contractual", "Self-Employed", "Freelance", "OFW"];
const incomeRanges = [
  "Below ₱5,000", "₱5,000 - ₱9,999", "₱10,000 - ₱14,999",
  "₱15,000 - ₱19,999", "₱20,000 - ₱29,999", "₱30,000 - ₱49,999",
  "₱50,000 - ₱99,999", "₱100,000 and above",
];
const businessStatuses = ["Active", "Inactive", "Closed"];
const relationshipsToHead = [
  "Head", "Spouse", "Son", "Daughter", "Father", "Mother",
  "Brother", "Sister", "Grandson", "Granddaughter",
  "Nephew", "Niece", "Boarder", "Helper", "Others",
];
const emergencyRelationships = ["Spouse", "Parent", "Sibling", "Child", "Relative", "Friend", "Neighbor", "Others"];

const AI_TIPS: Record<string, string> = {
  identity: "Tip: I-check muna kung naka-rehistro na — i-type ang pangalan sa search box para ma-check ang duplicate.",
  physical: "Tip: Hindi required lahat — i-fill in lang kung alam. Mas maraming info, mas accurate ang barangay records.",
  address: "Tip: I-allow ang GPS para auto-detect ang lokasyon ng bahay. Makakatulong ito sa disaster response planning.",
  contact: "Tip: Kunin ang mobile number — magagamit ng barangay para mag-send ng SMS announcements at emergency alerts.",
  sector: "Tip: I-check lahat ng applicable na sector. Ito ang ginagamit para sa beneficiary targeting at reporting.",
  education: "Tip: I-click ang '+ Add School' para mag-dagdag ng educational background. Hindi required pero helpful.",
  work: "Tip: I-record ang current employment. Mahalaga ito para sa livelihood programs at skills matching.",
  govid: "Tip: I-fill in ang available government IDs. Makakatulong ito sa faster document processing.",
  emergency: "Tip: Siguraduhing may emergency contact — ito ang unang tatawagan kung may emergency.",
  photo: "Tip: Kunan ng photo habang nandito pa. Clear front-facing photo para sa ID verification.",
  review: "Tip: I-double check ang spelling ng pangalan at date of birth — mahirap itama after registration.",
};

// Year options for dropdowns
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 80 }, (_, i) => String(currentYear - i));
const recentYearOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

// ══════════════════════════════════════════════════════════════════════════════
// Smart dropdown suggestions (same as desktop FCombobox)
// ══════════════════════════════════════════════════════════════════════════════

const S_PLACE_OF_BIRTH = [
  "Olongapo City", "Subic", "San Marcelino", "Castillejos", "San Antonio",
  "Iba", "Tarlac City", "Manila", "Quezon City", "Angeles City",
  "San Fernando", "Dagupan City", "Baguio City", "Zambales",
  "Caloocan City", "Makati City", "Cebu City", "Davao City", "Zamboanga City", "Bataan",
];
const S_CITIZENSHIP = [
  "Filipino", "American", "Chinese", "Japanese", "Korean", "Australian",
  "British", "Canadian", "Indian", "Indonesian", "Malaysian", "Singaporean", "Spanish", "Taiwanese",
];
const S_RELIGION = [
  "Catholic", "INC (Iglesia ni Cristo)", "Born Again", "Muslim", "Protestant",
  "Seventh Day Adventist", "Baptist", "Methodist", "Jehovah's Witness",
  "Mormon", "Buddhist", "Aglipayan",
];
const S_ETHNICITY = [
  "Tagalog", "Cebuano", "Ilocano", "Bisaya/Binisaya", "Hiligaynon/Ilonggo",
  "Bikol", "Waray", "Kapampangan", "Pangasinan", "Maranao",
  "Maguindanao", "Tausug", "Zamboangueño", "Ibanag", "Ivatan",
  "Kankanaey", "Ibaloi", "Ifugao", "Kalinga", "Aeta",
];
const S_STREET = [
  "Rizal Street", "Mabini Street", "Bonifacio Avenue", "Luna Street",
  "Del Pilar Street", "Quezon Boulevard", "Aguinaldo Street",
];
const S_SECTOR_OTHER = [
  "Tricycle Driver", "Fish Vendor", "Sari-Sari Store Owner", "Construction Worker",
  "Barangay Health Worker", "Barangay Nutrition Scholar", "Barangay Tanod",
  "Lupon Member", "SK Member", "Women's Association", "Jeepney Driver",
  "Teacher", "Kasambahay", "Church Worker", "Cooperative Member",
  "Senior Citizen Association", "PWD Organization", "Market Vendor",
  "Laundry Worker", "Security Guard",
];
const S_OCCUPATION = [
  "Farmer", "Fisherman", "Tricycle Driver", "Vendor", "Construction Worker",
  "Teacher", "Housewife/Homemaker", "Driver", "Domestic Worker",
  "Government Employee", "Security Guard", "Barangay Health Worker",
  "Sari-Sari Store Owner", "Electrician", "Mechanic", "OFW",
  "Nurse", "Laundry Worker", "Student", "Retired",
];
const S_SKILLS = [
  "Welding", "Carpentry", "Dressmaking/Tailoring", "Cooking/Food Preparation",
  "Driving (Professional)", "Farming/Agriculture", "Electrical Installation",
  "Plumbing", "Masonry", "Fishing", "Beauty/Hairdressing",
  "Auto/Motor Repair", "Computer Literacy", "Electronics Repair",
  "Livestock/Animal Husbandry", "Handicraft/Weaving", "Massage/Hilot",
  "Painting (House)", "Baking/Pastry", "Online Selling/E-Commerce",
];
const S_COURSE = [
  "BS Computer Science", "BS Information Technology", "BS Nursing",
  "BS Education", "BS Criminology", "BS Accountancy",
  "BS Business Administration", "BS Civil Engineering", "BS Agriculture",
  "BS Social Work", "Associate in Computer Technology",
  "BS Hotel & Restaurant Management", "BS Marine Transportation",
  "Technical Vocational (TESDA)", "General Academic Strand (GAS)",
  "STEM", "ABM", "HUMSS", "TVL", "BS Pharmacy",
];
const S_SCHOOL = [
  "Gordon College", "Columban College", "Olongapo City National High School",
  "Zambales National High School", "President Ramon Magsaysay State University",
  "Philippine Christian University", "STI College", "AMA Computer College",
  "University of the Philippines", "Polytechnic University of the Philippines",
  "Technological University of the Philippines", "Don Bosco Training Center",
  "Subic Bay Colleges", "Philippine Science High School", "DepEd ALS",
];
const S_POSITION = [
  "Laborer/Helper", "Driver", "Cashier", "Sales Associate", "Teacher/Instructor",
  "Security Guard", "Machine Operator", "Office Staff/Clerk", "Foreman/Supervisor",
  "Nurse/Midwife", "Barangay Health Worker", "Maintenance/Janitor",
  "Cook/Kitchen Staff", "Delivery Rider", "Technician", "Farm Worker",
  "Construction Worker", "Domestic Helper", "Factory Worker", "Seaman/Seafarer",
];
const S_COMPANY = [
  "Self-Employed", "Department of Education (DepEd)", "Local Government Unit (LGU)",
  "SM Group", "Jollibee Foods Corp.", "Security Agency", "Construction Company",
  "Private Household", "Department of Health (DOH)", "Philippine National Police (PNP)",
  "Armed Forces of the Philippines (AFP)", "DOLE/PESO", "Universal Robina Corp.",
  "Puregold", "BPO/Call Center", "Grab/Delivery Platform",
  "Factory/Manufacturing", "Cooperative", "Church/Religious Org", "NGO/Foundation",
];
const S_BUSINESS_TYPE = [
  "Sari-Sari Store", "Carinderia/Eatery", "Tricycle Operation", "Buy and Sell",
  "Water Refilling Station", "Laundry Service", "Piggery/Livestock", "Rice Trading",
  "Welding/Fabrication", "Beauty Salon/Barbershop", "Farming/Agriculture",
  "Fishing", "Vulcanizing Shop", "Computer Shop/Internet Cafe", "Bakery",
  "Construction/Contractor", "Jeepney Operation", "Food Vending",
  "Auto/Motor Repair", "Online Selling",
];
const S_EMERGENCY_REL = [
  "Spouse", "Parent", "Sibling", "Child", "Friend", "Relative",
  "Neighbor", "Grandparent", "Guardian", "Employer", "Co-worker",
];

// ══════════════════════════════════════════════════════════════════════════════
// Types for repeatable entries
// ══════════════════════════════════════════════════════════════════════════════

interface EducationEntry {
  level: string; school: string; course: string;
  start_year: string; end_year: string; currently_studying: boolean;
}

interface WorkEntry {
  position: string; company: string; employment_type: string;
  start_year: string; end_year: string; description: string;
}

interface BusinessEntry {
  business_name: string; business_type: string; business_address: string;
  business_permit_no: string; dti_sec_no: string; monthly_income: string;
  start_year: string; status: string; description: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

function formatDatePreview(d: string): string {
  if (!d) return "";
  const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function getAge(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob.includes("T") ? dob : dob + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const mo = now.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

// Online status hook (SSR-safe)
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
}
function getOnline() { return navigator.onLine; }
function getOnlineServer() { return true; }

// ══════════════════════════════════════════════════════════════════════════════
// Reusable input components — 44px min touch targets, mobile-first
// ══════════════════════════════════════════════════════════════════════════════

function CField({
  label, name, type = "text", required, value, onChange, placeholder, maxLength, readOnly, mono, rows, max, min, step,
}: {
  label: string; name: string; type?: string; required?: boolean;
  value: string; onChange: (name: string, value: string) => void;
  placeholder?: string; maxLength?: number; readOnly?: boolean; mono?: boolean; rows?: number;
  max?: string; min?: string; step?: string;
}) {
  const forceUpper = type === "text" && !mono;
  const display = forceUpper ? value.toUpperCase() : value;
  const base = "w-full px-3 py-3 text-sm rounded-xl border border-border bg-background min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-accent-primary placeholder:text-muted-foreground/50 transition-colors";
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          id={name} name={name} value={display} readOnly={readOnly} rows={rows}
          maxLength={maxLength} placeholder={placeholder}
          onChange={(e) => onChange(name, forceUpper ? e.target.value.toUpperCase() : e.target.value)}
          className={cn(base, "min-h-[80px] resize-none", readOnly && "bg-muted cursor-not-allowed")}
        />
      ) : (
        <input
          id={name} name={name} type={type} value={display} readOnly={readOnly}
          maxLength={maxLength} placeholder={placeholder} max={max} min={min} step={step}
          onChange={(e) => onChange(name, forceUpper ? e.target.value.toUpperCase() : e.target.value)}
          className={cn(base, readOnly && "bg-muted cursor-not-allowed", mono && "font-mono text-xs")}
        />
      )}
    </div>
  );
}

function CSelect({
  label, name, required, value, onChange, options, placeholder,
}: {
  label: string; name: string; required?: boolean;
  value: string; onChange: (name: string, value: string) => void;
  options: string[]; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={name} name={name} value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-3 text-sm rounded-xl border border-border bg-background min-h-[44px]",
          "focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-accent-primary transition-colors",
          !value && "text-muted-foreground",
        )}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((o) => <option key={o} value={o.toLowerCase().replace(/\s+/g, "-").replace(/[₱,]/g, "")}>{o}</option>)}
      </select>
    </div>
  );
}

function CSelectRaw({
  label, name, required, value, onChange, options, placeholder,
}: {
  label: string; name: string; required?: boolean;
  value: string; onChange: (name: string, value: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={name} name={name} value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-3 text-sm rounded-xl border border-border bg-background min-h-[44px]",
          "focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-accent-primary transition-colors",
          !value && "text-muted-foreground",
        )}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function CRadio({
  label, name, value, onChange, options,
}: {
  label: string; name: string; value: string;
  onChange: (name: string, value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value} type="button"
            onClick={() => onChange(name, o.value)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] border transition-colors text-center",
              value === o.value
                ? "border-accent-primary bg-accent-bg/30 text-accent-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pt-2 pb-0.5">{children}</p>;
}

/** Lightweight mobile combobox — searchable dropdown with suggestions, allows custom input */
function CCombobox({
  label, name, required, value, onChange, suggestions, placeholder,
}: {
  label: string; name: string; required?: boolean;
  value: string; onChange: (name: string, value: string) => void;
  suggestions: string[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [open]);

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes((query || value).toLowerCase())
  ).slice(0, 8);

  const display = value.toUpperCase();

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label htmlFor={name} className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={name} name={name} type="text" value={display}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            onChange(name, v);
            setQuery(v);
            if (!open) setOpen(true);
          }}
          onFocus={() => { setQuery(value); setOpen(true); }}
          className={cn(
            "w-full px-3 py-3 pr-8 text-sm rounded-xl border border-border bg-background min-h-[44px]",
            "focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-accent-primary",
            "placeholder:text-muted-foreground/50 transition-colors",
          )}
        />
        {value && (
          <button type="button" aria-label="Clear" onClick={() => { onChange(name, ""); setQuery(""); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
          {filtered.map((s) => (
            <button
              key={s} type="button"
              onClick={() => { onChange(name, s.toUpperCase()); setOpen(false); setQuery(""); }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 active:bg-muted min-h-[44px] border-b border-border/50 last:border-b-0 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Census Page
// ══════════════════════════════════════════════════════════════════════════════

export default function CensusPage() {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnline, getOnlineServer);

  // ── Form state (all flat fields) ──────────────────────────────────────
  const [form, setForm] = useState<Record<string, string>>({
    // Identity
    first_name: "", last_name: "", middle_name: "", extension_name: "",
    date_of_birth: "", place_of_birth: "", sex: "", civil_status: "",
    citizenship: "FILIPINO", mothers_maiden_name: "",
    // Physical
    blood_type: "", height_cm: "", weight_kg: "", complexion: "",
    religion: "", ethnicity: "",
    // Address
    purok: "", sitio: "", street: "", house_block_lot: "", zip_code: "",
    latitude: "", longitude: "", resident_type: "permanent",
    is_head_of_household: "", relationship_to_head: "",
    // Contact
    mobile_number: "", telephone: "", email: "",
    // Voter
    is_voter: "", is_resident_voter: "", voter_precinct_number: "", last_voted_year: "",
    // Sectors / Health
    sector_other: "", health_history: "", is_organ_donor: "",
    skills: "", other_remarks: "",
    barangay_position: "", barangay_role_start: "", barangay_role_end: "",
    // Employment
    livelihood_type: "", occupation: "", employer: "",
    monthly_income_range: "", source_of_income: "",
    // Gov IDs
    philhealth_number: "", philhealth_expiry: "",
    sss_gsis_number: "", sss_gsis_expiry: "",
    pagibig_number: "", pagibig_expiry: "",
    tin_number: "", tin_expiry: "",
    pwd_id: "", pwd_id_expiry: "",
    senior_citizen_id: "",
    // Emergency
    emergency_contact_name: "", emergency_contact_phone: "",
    emergency_contact_address: "", emergency_contact_relationship: "",
    // Education top-level
    highest_education: "",
  });

  // Repeatable entries
  const [sectors, setSectors] = useState<string[]>([]);
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [businessEntries, setBusinessEntries] = useState<BusinessEntry[]>([]);

  // Photo
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ── Wizard state ──────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; number: string } | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // ── Duplicate check ───────────────────────────────────────────────────
  const [dupLoading, setDupLoading] = useState(false);
  const [dupResults, setDupResults] = useState<Array<{ id: string; full_name: string; date_of_birth: string; purok: string | null; status: string }>>([]);
  const [dupChecked, setDupChecked] = useState(false);
  const dupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Puroks from API ───────────────────────────────────────────────────
  const [purokOptions, setPurokOptions] = useState<string[]>([]);
  useEffect(() => {
    api.puroks.list()
      .then((res) => setPurokOptions((res.data || []).map((p: { name: string }) => p.name)))
      .catch(() => {});
  }, []);

  // ── GPS ───────────────────────────────────────────────────────────────
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const detectGps = useCallback(() => {
    if (!navigator.geolocation) { setGpsError("GPS not available sa device na ito"); return; }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.code === 1 ? "Hindi ma-access ang location. I-enable ang GPS sa browser settings." : "Hindi makuha ang location. Try ulit sa labas.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  // ── Photo ─────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const [photoError, setPhotoError] = useState<string | null>(null);
  const handlePhoto = useCallback(async (file: File) => {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      const blob = await resizeImage(file, 800);
      if (!isOnline) {
        // Offline: keep preview, skip upload (photo_file_id stays null)
        setPhotoError("Offline — photo saved locally. Will upload when online.");
        setPhotoUploading(false);
        return;
      }
      const res = await api.files.uploadPhoto(blob);
      setPhotoFileId(res.file.id);
    } catch {
      setPhotoError("Hindi ma-upload ang photo. Subukan ulit.");
      // Keep the preview so user sees the image was captured
    } finally {
      setPhotoUploading(false);
    }
  }, [isOnline]);

  // ── Update helper ─────────────────────────────────────────────────────
  const updateForm = useCallback((name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setStepErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  }, []);

  // ── Auto-save draft to IndexedDB ──────────────────────────────────────
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft("census-form", { form, sectors, educationEntries, workEntries, businessEntries, step }).catch(() => {});
    }, 1000);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [form, sectors, educationEntries, workEntries, businessEntries, step]);

  // ── Load draft on mount ───────────────────────────────────────────────
  const [draftLoaded, setDraftLoaded] = useState(false);
  useEffect(() => {
    loadDraft("census-form").then((data) => {
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (d.form) setForm(d.form as Record<string, string>);
        if (d.sectors) setSectors(d.sectors as string[]);
        if (d.educationEntries) setEducationEntries(d.educationEntries as EducationEntry[]);
        if (d.workEntries) setWorkEntries(d.workEntries as WorkEntry[]);
        if (d.businessEntries) setBusinessEntries(d.businessEntries as BusinessEntry[]);
        if (typeof d.step === "number") setStep(d.step);
        setDraftLoaded(true);
      } else {
        setDraftLoaded(false);
      }
    }).catch(() => setDraftLoaded(false));
  }, []);

  // ── Duplicate check (auto-fires when identity fields change) ──────────
  useEffect(() => {
    if (dupTimer.current) clearTimeout(dupTimer.current);
    const fn = form.first_name.trim();
    const ln = form.last_name.trim();
    const dob = form.date_of_birth;
    if (!fn || !ln || !dob) { setDupResults([]); setDupChecked(false); return; }
    if (!isOnline) { setDupChecked(false); return; }
    dupTimer.current = setTimeout(async () => {
      setDupLoading(true);
      try {
        const res = await api.residents.checkDuplicate({
          first_name: fn, last_name: ln,
          middle_name: form.middle_name.trim() || undefined,
          date_of_birth: dob,
        });
        setDupResults(res.has_duplicates ? res.matches : []);
        setDupChecked(true);
      } catch { setDupChecked(true); setDupResults([]); }
      finally { setDupLoading(false); }
    }, 600);
    return () => { if (dupTimer.current) clearTimeout(dupTimer.current); };
  }, [form.first_name, form.last_name, form.middle_name, form.date_of_birth, isOnline]);

  // ── Step validation ───────────────────────────────────────────────────
  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {};
    if (s === 0) { // Identity
      if (!form.first_name.trim()) errors.first_name = "Required";
      if (!form.last_name.trim()) errors.last_name = "Required";
      if (!form.date_of_birth) errors.date_of_birth = "Required";
      if (!form.place_of_birth.trim()) errors.place_of_birth = "Required";
      if (!form.sex) errors.sex = "Required";
      if (!form.civil_status) errors.civil_status = "Required";
    }
    if (s === 2) { // Address
      if (!form.resident_type) errors.resident_type = "Required";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    if (step > 0) setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Build payload ─────────────────────────────────────────────────────
  const buildPayload = (): Record<string, unknown> => {
    return {
      // Identity
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      middle_name: form.middle_name.trim() || null,
      extension_name: form.extension_name || null,
      mothers_maiden_name: form.mothers_maiden_name.trim() || null,
      date_of_birth: form.date_of_birth,
      place_of_birth: form.place_of_birth.trim(),
      sex: form.sex,
      civil_status: form.civil_status,
      citizenship: form.citizenship.trim() || "FILIPINO",
      resident_type: form.resident_type || "permanent",
      registration_source: "census",

      // Physical
      blood_type: form.blood_type || null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      complexion: form.complexion || null,
      religion: form.religion.trim() || null,
      ethnicity: form.ethnicity.trim() || null,

      // Address
      purok: form.purok || null,
      sitio: form.sitio.trim() || null,
      street: form.street.trim() || null,
      house_block_lot: form.house_block_lot.trim() || null,
      zip_code: form.zip_code.trim() || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,

      // Household
      is_head_of_household: form.is_head_of_household === "yes",
      relationship_to_head: form.relationship_to_head || null,

      // Contact
      mobile_number: form.mobile_number.trim() || null,
      telephone: form.telephone.trim() || null,
      email: form.email.trim() || null,

      // Voter
      is_voter: form.is_voter === "yes",
      is_resident_voter: form.is_resident_voter === "yes",
      voter_precinct_number: form.voter_precinct_number.trim() || null,
      last_voted_year: form.last_voted_year ? parseInt(form.last_voted_year) : null,

      // Sectors & Health
      sectors: sectors.length > 0 ? sectors : null,
      sector_other: form.sector_other.trim() || null,
      health_history: form.health_history.trim() || null,
      is_organ_donor: form.is_organ_donor === "yes",
      skills: form.skills.trim() || null,
      other_remarks: form.other_remarks.trim() || null,
      barangay_position: form.barangay_position.trim() || null,
      barangay_role_start: form.barangay_role_start || null,
      barangay_role_end: form.barangay_role_end || null,

      // Education
      highest_education: form.highest_education || null,
      education_entries: educationEntries.length > 0
        ? educationEntries.filter((e) => e.level)
        : null,

      // Employment
      livelihood_type: form.livelihood_type || null,
      occupation: form.occupation.trim() || null,
      employer: form.employer.trim() || null,
      monthly_income_range: form.monthly_income_range || null,
      source_of_income: form.source_of_income.trim() || null,
      work_entries: workEntries.length > 0
        ? workEntries.filter((w) => w.position)
        : null,
      business_entries: businessEntries.length > 0
        ? businessEntries.filter((b) => b.business_name)
        : null,

      // Gov IDs
      philhealth_number: form.philhealth_number.trim() || null,
      philhealth_expiry: form.philhealth_expiry || null,
      sss_gsis_number: form.sss_gsis_number.trim() || null,
      sss_gsis_expiry: form.sss_gsis_expiry || null,
      pagibig_number: form.pagibig_number.trim() || null,
      pagibig_expiry: form.pagibig_expiry || null,
      tin_number: form.tin_number.trim() || null,
      tin_expiry: form.tin_expiry || null,
      pwd_id: form.pwd_id.trim() || null,
      pwd_id_expiry: form.pwd_id_expiry || null,
      senior_citizen_id: form.senior_citizen_id.trim() || null,

      // Emergency
      emergency_contact_name: form.emergency_contact_name.trim() || null,
      emergency_contact_phone: form.emergency_contact_phone.trim() || null,
      emergency_contact_address: form.emergency_contact_address.trim() || null,
      emergency_contact_relationship: form.emergency_contact_relationship || null,

      // Photo
      photo_file_id: photoFileId || null,
    };
  };

  // ── Submit (online) or queue (offline) ────────────────────────────────
  const submittingRef = useRef(false);
  const handleSubmit = async () => {
    // Synchronous double-submit guard (ref beats async state update)
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    // Re-validate identity step before submit (in case user went back and cleared fields)
    if (!validateStep(0)) {
      setStep(0);
      setSubmitting(false);
      submittingRef.current = false;
      setSubmitError("May kulang na required fields sa Pangalan step.");
      return;
    }

    const payload = buildPayload();

    if (!isOnline) {
      // Offline: queue to IndexedDB
      try {
        await queueSubmission(payload);
        setRegisteredCount((c) => c + 1);
        setSuccess({
          name: `${form.last_name}, ${form.first_name} ${form.middle_name ? form.middle_name.charAt(0) + "." : ""}`.trim(),
          number: "QUEUED (will sync when online)",
        });
        await clearDraft("census-form");
      } catch {
        setSubmitError("Hindi ma-save offline. Subukan ulit.");
      } finally {
        setSubmitting(false);
        submittingRef.current = false;
      }
      return;
    }

    try {
      const res = await api.residents.create(payload as Record<string, string>);
      const r = res.resident;
      setRegisteredCount((c) => c + 1);
      setSuccess({
        name: `${form.last_name}, ${form.first_name} ${form.middle_name ? form.middle_name.charAt(0) + "." : ""}`.trim(),
        number: r.resident_number,
      });
      await clearDraft("census-form");
    } catch (err) {
      const e = err as { message?: string; errors?: Record<string, string[]> };
      if (e.errors) {
        const first = Object.values(e.errors)[0]?.[0] ?? "Validation failed";
        setSubmitError(first);
      } else {
        setSubmitError(e.message || "Hindi ma-register. Check ang connection at try ulit.");
      }
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  // ── Reset form ────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({
      first_name: "", last_name: "", middle_name: "", extension_name: "",
      date_of_birth: "", place_of_birth: "", sex: "", civil_status: "",
      citizenship: "FILIPINO", mothers_maiden_name: "",
      blood_type: "", height_cm: "", weight_kg: "", complexion: "",
      religion: "", ethnicity: "",
      purok: "", sitio: "", street: "", house_block_lot: "", zip_code: "",
      latitude: "", longitude: "", resident_type: "permanent",
      is_head_of_household: "", relationship_to_head: "",
      mobile_number: "", telephone: "", email: "",
      is_voter: "", is_resident_voter: "", voter_precinct_number: "", last_voted_year: "",
      sector_other: "", health_history: "", is_organ_donor: "",
      skills: "", other_remarks: "",
      barangay_position: "", barangay_role_start: "", barangay_role_end: "",
      livelihood_type: "", occupation: "", employer: "",
      monthly_income_range: "", source_of_income: "",
      philhealth_number: "", philhealth_expiry: "",
      sss_gsis_number: "", sss_gsis_expiry: "",
      pagibig_number: "", pagibig_expiry: "",
      tin_number: "", tin_expiry: "",
      pwd_id: "", pwd_id_expiry: "",
      senior_citizen_id: "",
      emergency_contact_name: "", emergency_contact_phone: "",
      emergency_contact_address: "", emergency_contact_relationship: "",
      highest_education: "",
    });
    setSectors([]);
    setEducationEntries([]);
    setWorkEntries([]);
    setBusinessEntries([]);
    setPhotoFileId(null);
    setPhotoPreview(null);
    setStep(0);
    setSuccess(null);
    setSubmitError(null);
    setStepErrors({});
    setDupResults([]);
    setDupChecked(false);
    clearDraft("census-form").catch(() => {});
  };

  const f = (key: string) => form[key] ?? "";

  // ══════════════════════════════════════════════════════════════════════
  // Success screen
  // ══════════════════════════════════════════════════════════════════════

  if (success) {
    const isQueued = success.number.startsWith("QUEUED");
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6",
          isQueued ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
        )}>
          {isQueued
            ? <CloudOff className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            : <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          }
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {isQueued ? "Naka-save offline!" : "Na-register na!"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          <span className="font-semibold text-foreground">{success.name}</span>
          {isQueued ? " — i-sync kapag may signal na." : " — naidagdag na sa system."}
        </p>
        <div className={cn("px-4 py-3 rounded-xl border mb-8",
          isQueued ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-muted/50 border-border"
        )}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Resident Number</p>
          <p className={cn("text-lg font-bold font-mono", isQueued ? "text-amber-600" : "text-accent-primary")}>
            {success.number}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={resetForm}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold min-h-[48px] transition-colors"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            <RotateCcw className="h-4 w-4" />
            Mag-register ng Isa Pa
          </button>
          <div className="flex items-center gap-1.5 justify-center px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{registeredCount}</span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">na-register ngayong session</span>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // Draft restore banner
  // ══════════════════════════════════════════════════════════════════════

  const showDraftBanner = draftLoaded && step > 0 && form.first_name;

  // ══════════════════════════════════════════════════════════════════════
  // Wizard UI
  // ══════════════════════════════════════════════════════════════════════

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">

      {/* ── Progress bar + session counter ────────────────────────────── */}
      <div className="sticky top-0 z-40 px-3 pt-2 pb-1 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-foreground">
            Step {step + 1}/{STEPS.length}: <span style={{ color: "var(--accent-primary)" }}>{currentStep.desc}</span>
          </p>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <UserCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{registeredCount}</span>
          </div>
        </div>
        {/* Step dots */}
        <div className="flex gap-0.5">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: i < step ? "100%" : i === step ? "50%" : "0%",
                  background: "var(--accent-primary)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Draft restore banner ─────────────────────────────────────── */}
      {showDraftBanner && step === 0 && (
        <div className="mx-3 mt-2 flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">May naka-save na draft para kay <b>{form.first_name} {form.last_name}</b></p>
          <button onClick={resetForm} className="text-[10px] font-bold text-blue-600 underline ml-2">Clear</button>
        </div>
      )}

      {/* ── Duplicate alert ──────────────────────────────────────────── */}
      {dupResults.length > 0 && step === 0 && (
        <div className="mx-3 mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
              May {dupResults.length} existing record na!
            </p>
          </div>
          {dupResults.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-t border-amber-200 dark:border-amber-800 first:border-t-0">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{r.full_name}</p>
                <p className="text-[10px] text-muted-foreground">{r.date_of_birth ? formatDatePreview(r.date_of_birth) : "No DOB"}{r.purok ? ` — ${r.purok}` : ""}</p>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0",
                r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
              )}>{r.status || "active"}</span>
            </div>
          ))}
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">I-verify muna bago mag-proceed para maiwasan ang duplicate.</p>
        </div>
      )}

      {dupChecked && dupResults.length === 0 && step === 0 && form.first_name && form.last_name && form.date_of_birth && (
        <div className="mx-3 mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Walang match — hindi pa naka-register ang taong ito.</p>
          {dupLoading && <Loader2 className="h-3 w-3 animate-spin text-emerald-500 ml-auto shrink-0" />}
        </div>
      )}

      {/* ── Step content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">

        {/* ═══════ STEP 1: IDENTITY ═══════ */}
        {step === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <CField label="First Name / Pangalan" name="first_name" required value={f("first_name")} onChange={updateForm} placeholder="JUAN" maxLength={100} />
              <CField label="Last Name / Apelyido" name="last_name" required value={f("last_name")} onChange={updateForm} placeholder="DELA CRUZ" maxLength={100} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CField label="Middle Name" name="middle_name" value={f("middle_name")} onChange={updateForm} placeholder="SANTOS" maxLength={100} />
              <CSelectRaw label="Ext." name="extension_name" value={f("extension_name")} onChange={updateForm}
                options={extensions.map((e) => ({ value: e.toLowerCase(), label: e || "None" }))} placeholder="None" />
            </div>
            <CField label="Date of Birth / Kaarawan" name="date_of_birth" type="date" required value={f("date_of_birth")} onChange={updateForm} max={new Date().toISOString().split("T")[0]} />
            {f("date_of_birth") && getAge(f("date_of_birth")) !== null && (
              <p className="text-xs text-muted-foreground -mt-1.5 ml-1">Edad: <span className="font-semibold text-foreground">{getAge(f("date_of_birth"))} taon</span></p>
            )}
            <CCombobox label="Place of Birth / Lugar ng Kapanganakan" name="place_of_birth" required value={f("place_of_birth")} onChange={updateForm} placeholder="OLONGAPO CITY, ZAMBALES" suggestions={S_PLACE_OF_BIRTH} />
            <div className="grid grid-cols-2 gap-3">
              <CSelectRaw label="Sex / Kasarian" name="sex" required value={f("sex")} onChange={updateForm}
                options={sexOptions.map((s) => ({ value: s.toLowerCase(), label: s }))} />
              <CSelectRaw label="Civil Status" name="civil_status" required value={f("civil_status")} onChange={updateForm}
                options={civilStatuses.map((s) => ({ value: s.toLowerCase().replace(/\s+/g, "-"), label: s }))} />
            </div>
            <CCombobox label="Citizenship / Nasyonalidad" name="citizenship" value={f("citizenship")} onChange={updateForm} placeholder="FILIPINO" suggestions={S_CITIZENSHIP} />
            <CField label="Mother's Maiden Name" name="mothers_maiden_name" value={f("mothers_maiden_name")} onChange={updateForm} placeholder="REYES" maxLength={200} />
            {Object.keys(stepErrors).length > 0 && (
              <p className="text-xs text-red-500 font-medium">Pakiusap, i-fill in lahat ng may * (required)</p>
            )}
          </div>
        )}

        {/* ═══════ STEP 2: PHYSICAL & DEMOGRAPHICS ═══════ */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground mb-1">Hindi required ang mga ito — i-fill in lang kung alam.</p>
            <div className="grid grid-cols-2 gap-3">
              <CSelectRaw label="Blood Type / Uri ng Dugo" name="blood_type" value={f("blood_type")} onChange={updateForm}
                options={bloodTypes.map((b) => ({ value: b, label: b }))} />
              <CSelectRaw label="Complexion / Kulay" name="complexion" value={f("complexion")} onChange={updateForm}
                options={complexions.map((c) => ({ value: c.toLowerCase().replace(/\s+/g, "-"), label: c }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CField label="Height (cm) / Taas" name="height_cm" type="number" value={f("height_cm")} onChange={updateForm} placeholder="165" min="30" max="250" />
              <CField label="Weight (kg) / Timbang" name="weight_kg" type="number" value={f("weight_kg")} onChange={updateForm} placeholder="60" min="1" max="500" />
            </div>
            <CCombobox label="Religion / Relihiyon" name="religion" value={f("religion")} onChange={updateForm} placeholder="ROMAN CATHOLIC" suggestions={S_RELIGION} />
            <CCombobox label="Ethnicity / Lahi" name="ethnicity" value={f("ethnicity")} onChange={updateForm} placeholder="TAGALOG" suggestions={S_ETHNICITY} />
          </div>
        )}

        {/* ═══════ STEP 3: ADDRESS & HOUSEHOLD ═══════ */}
        {step === 2 && (
          <div className="space-y-3">
            <CField label="House No. / Blk & Lot / Subdivision / Village" name="house_block_lot" value={f("house_block_lot")} onChange={updateForm} placeholder="UNIT 4B BLK 5 LOT 12, VILLA VERDE SUBD. PHASE 2" maxLength={255} />
            {purokOptions.length > 0 ? (
              <CSelectRaw label="Purok / Sitio" name="purok" value={f("purok")} onChange={updateForm}
                options={purokOptions.map((p) => ({ value: p, label: p }))} />
            ) : (
              <CField label="Purok / Sitio" name="purok" value={f("purok")} onChange={updateForm} placeholder="PUROK 1" />
            )}
            <CCombobox label="Street / Road" name="street" value={f("street")} onChange={updateForm} placeholder="RIZAL STREET" suggestions={S_STREET} />
            <CSelectRaw label="Resident Type / Uri ng Residente" name="resident_type" required value={f("resident_type")} onChange={updateForm}
              options={residentTypes.map((r) => ({ value: r.toLowerCase(), label: r }))} />

            {/* GPS */}
            <div className="space-y-1.5">
              <SectionLabel>GPS Location / Lokasyon</SectionLabel>
              <button
                onClick={detectGps} disabled={gpsLoading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold min-h-[48px] border transition-colors",
                  f("latitude")
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted/50 border-border text-foreground hover:bg-muted",
                  gpsLoading && "opacity-60",
                )}
              >
                {gpsLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Kinukuha ang lokasyon...</>
                ) : f("latitude") ? (
                  <><MapPin className="h-4 w-4" /> Nakuha na ang lokasyon — tap para i-update</>
                ) : (
                  <><MapPin className="h-4 w-4" /> I-detect ang GPS Location</>
                )}
              </button>
              {f("latitude") && <p className="text-[10px] font-mono text-muted-foreground text-center">{f("latitude")}, {f("longitude")}</p>}
              {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}
            </div>

            {/* Household */}
            <SectionLabel>Household / Sambahayan</SectionLabel>
            <CRadio label="Head of Household?" name="is_head_of_household" value={f("is_head_of_household")}
              onChange={updateForm} options={[{ value: "yes", label: "Oo (Head)" }, { value: "no", label: "Hindi" }]} />
            {f("is_head_of_household") === "no" && (
              <CSelectRaw label="Relationship to Head / Relasyon" name="relationship_to_head" value={f("relationship_to_head")} onChange={updateForm}
                options={relationshipsToHead.map((r) => ({ value: r.toLowerCase(), label: r }))} />
            )}
            {Object.keys(stepErrors).length > 0 && (
              <p className="text-xs text-red-500 font-medium">Pakiusap, i-fill in lahat ng may * (required)</p>
            )}
          </div>
        )}

        {/* ═══════ STEP 4: CONTACT & VOTER ═══════ */}
        {step === 3 && (
          <div className="space-y-3">
            <SectionLabel>Contact Information</SectionLabel>
            <CField label="Mobile Number / Cellphone" name="mobile_number" type="tel" value={f("mobile_number")} onChange={updateForm} placeholder="09171234567" maxLength={13} />
            <CField label="Telephone / Landline" name="telephone" type="tel" value={f("telephone")} onChange={updateForm} placeholder="(047) 222-3456" maxLength={20} />
            <CField label="Email" name="email" type="email" value={f("email")} onChange={updateForm} placeholder="juan@email.com" />

            <SectionLabel>Voter Information / Impormasyon ng Botante</SectionLabel>
            <CRadio label="Registered Voter?" name="is_voter" value={f("is_voter")}
              onChange={updateForm} options={[{ value: "yes", label: "Oo" }, { value: "no", label: "Hindi" }]} />
            {f("is_voter") === "yes" && (
              <>
                <CRadio label="Resident Voter dito sa barangay?" name="is_resident_voter" value={f("is_resident_voter")}
                  onChange={updateForm} options={[{ value: "yes", label: "Oo" }, { value: "no", label: "Hindi" }]} />
                <CField label="Precinct No." name="voter_precinct_number" value={f("voter_precinct_number")} onChange={updateForm} placeholder="0001A" />
                <CSelectRaw label="Last Voted Year" name="last_voted_year" value={f("last_voted_year")} onChange={updateForm}
                  options={recentYearOptions.map((y) => ({ value: y, label: y }))} />
              </>
            )}
          </div>
        )}

        {/* ═══════ STEP 5: SECTORS & HEALTH ═══════ */}
        {step === 4 && (
          <div className="space-y-3">
            <SectionLabel>Sector / Organisasyon</SectionLabel>
            <p className="text-[10px] text-muted-foreground -mt-1">I-tap lahat ng applicable:</p>
            <div className="grid grid-cols-2 gap-2">
              {sectorOptions.map((s) => {
                const active = sectors.includes(s);
                return (
                  <button
                    key={s} type="button"
                    onClick={() => setSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium min-h-[44px] border transition-all text-left",
                      active
                        ? "border-accent-primary bg-accent-bg/40 text-accent-primary ring-1 ring-accent-primary/30"
                        : "border-border bg-background text-foreground hover:bg-muted/50",
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                      active
                        ? "border-accent-primary bg-accent-primary"
                        : "border-muted-foreground/30 bg-background",
                    )}>
                      {active && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="leading-tight">{s}</span>
                  </button>
                );
              })}
            </div>
            <CCombobox label="Other Sector (kung wala sa list)" name="sector_other" value={f("sector_other")} onChange={updateForm} placeholder="WOMEN'S ORG, SENIOR DANCE GROUP" suggestions={S_SECTOR_OTHER} />

            <SectionLabel>Health / Kalusugan</SectionLabel>
            <CField label="Health History / Sakit, Allergy, Disability" name="health_history" value={f("health_history")} onChange={updateForm} placeholder="HYPERTENSION, ASTHMA, ALLERGIC SA SEAFOOD" rows={3} maxLength={5000} />
            <CRadio label="Organ Donor?" name="is_organ_donor" value={f("is_organ_donor")}
              onChange={updateForm} options={[{ value: "yes", label: "Oo" }, { value: "no", label: "Hindi" }]} />

            <SectionLabel>Skills / Kakayahan</SectionLabel>
            <CCombobox label="Skills" name="skills" value={f("skills")} onChange={updateForm} placeholder="CARPENTRY, COOKING, SEWING, DRIVING" suggestions={S_SKILLS} />

            <SectionLabel>Barangay Position / Posisyon</SectionLabel>
            <CField label="Position (kung may posisyon)" name="barangay_position" value={f("barangay_position")} onChange={updateForm} placeholder="KAGAWAD, SK CHAIRMAN, TANOD" />
            {f("barangay_position") && (
              <div className="grid grid-cols-2 gap-3">
                <CField label="Start Date" name="barangay_role_start" type="date" value={f("barangay_role_start")} onChange={updateForm} />
                <CField label="End Date" name="barangay_role_end" type="date" value={f("barangay_role_end")} onChange={updateForm} />
              </div>
            )}

            <SectionLabel>Other Remarks / Iba pang Impormasyon</SectionLabel>
            <CField label="Remarks" name="other_remarks" value={f("other_remarks")} onChange={updateForm} placeholder="KAHIT ANONG KARAGDAGANG INFO" rows={2} maxLength={5000} />
          </div>
        )}

        {/* ═══════ STEP 6: EDUCATION ═══════ */}
        {step === 5 && (
          <div className="space-y-3">
            <CSelectRaw label="Highest Education / Pinakamataas na Natapos" name="highest_education" value={f("highest_education")} onChange={updateForm}
              options={educationLevels.map((l) => ({ value: l.toLowerCase().replace(/\s+/g, "-"), label: l }))} />

            <SectionLabel>Educational Background</SectionLabel>
            {educationEntries.map((entry, i) => (
              <div key={i} className="p-3 rounded-xl border border-border space-y-2.5 bg-muted/10">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground">SCHOOL #{i + 1}</p>
                  <button onClick={() => setEducationEntries((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <CSelectRaw label="Level" name={`edu_level_${i}`} required value={entry.level}
                  onChange={(_, v) => setEducationEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, level: v } : e))}
                  options={educationLevels.map((l) => ({ value: l.toLowerCase().replace(/\s+/g, "-"), label: l }))} />
                <CCombobox label="School / Institution" name={`edu_school_${i}`} value={entry.school}
                  onChange={(_, v) => setEducationEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, school: v } : e))} placeholder="GORDON COLLEGE" suggestions={S_SCHOOL} />
                <CCombobox label="Course / Program" name={`edu_course_${i}`} value={entry.course}
                  onChange={(_, v) => setEducationEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, course: v } : e))} placeholder="BS COMPUTER SCIENCE" suggestions={S_COURSE} />
                <div className="grid grid-cols-2 gap-3">
                  <CSelectRaw label="Start Year" name={`edu_start_${i}`} value={entry.start_year}
                    onChange={(_, v) => setEducationEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, start_year: v } : e))}
                    options={yearOptions.map((y) => ({ value: y, label: y }))} />
                  <CSelectRaw label="End Year" name={`edu_end_${i}`} value={entry.end_year}
                    onChange={(_, v) => setEducationEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, end_year: v } : e))}
                    options={yearOptions.map((y) => ({ value: y, label: y }))} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer min-h-[40px]">
                  <input type="checkbox" checked={entry.currently_studying}
                    onChange={(e) => setEducationEntries((prev) => prev.map((en, idx) => idx === i ? { ...en, currently_studying: e.target.checked, end_year: e.target.checked ? "" : en.end_year } : en))}
                    className="w-5 h-5 rounded border-border text-accent-primary focus:ring-accent-ring" />
                  <span className="text-xs text-foreground">Currently studying</span>
                </label>
              </div>
            ))}
            <button
              onClick={() => setEducationEntries((prev) => [...prev, { level: "", school: "", course: "", start_year: "", end_year: "", currently_studying: false }])}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold border border-dashed border-border hover:bg-muted/50 min-h-[48px] transition-colors"
            >
              <Plus className="h-4 w-4" /> Mag-dagdag ng School
            </button>
          </div>
        )}

        {/* ═══════ STEP 7: WORK & BUSINESS ═══════ */}
        {step === 6 && (
          <div className="space-y-3">
            <CSelectRaw label="Livelihood Type / Uri ng Hanapbuhay" name="livelihood_type" value={f("livelihood_type")} onChange={updateForm}
              options={livelihoodTypes.map((l) => ({ value: l.toLowerCase().replace(/\s+/g, "-"), label: l }))} />

            {(f("livelihood_type") === "employed" || f("livelihood_type") === "self-employed" || f("livelihood_type") === "ofw") && (
              <>
                <CCombobox label="Occupation / Trabaho" name="occupation" value={f("occupation")} onChange={updateForm} placeholder="CONSTRUCTION WORKER" suggestions={S_OCCUPATION} />
                <CCombobox label="Employer / Kumpanya" name="employer" value={f("employer")} onChange={updateForm} placeholder="ABC CONSTRUCTION" suggestions={S_COMPANY} />
                <CSelectRaw label="Monthly Income Range" name="monthly_income_range" value={f("monthly_income_range")} onChange={updateForm}
                  options={incomeRanges.map((r) => ({ value: r.toLowerCase().replace(/[₱,\s]+/g, ""), label: r }))} />
                <CField label="Source of Income" name="source_of_income" value={f("source_of_income")} onChange={updateForm} placeholder="SALARY, BUSINESS, REMITTANCE" />
              </>
            )}

            {/* Work entries */}
            <SectionLabel>Employment Records / Work History</SectionLabel>
            {workEntries.map((entry, i) => (
              <div key={i} className="p-3 rounded-xl border border-border space-y-2.5 bg-muted/10">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground">WORK #{i + 1}</p>
                  <button onClick={() => setWorkEntries((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <CCombobox label="Position / Posisyon" name={`work_pos_${i}`} required value={entry.position}
                  onChange={(_, v) => setWorkEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, position: v } : e))} placeholder="FOREMAN" suggestions={S_POSITION} />
                <CCombobox label="Company / Kumpanya" name={`work_co_${i}`} value={entry.company}
                  onChange={(_, v) => setWorkEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, company: v } : e))} placeholder="ABC CONSTRUCTION" suggestions={S_COMPANY} />
                <CSelectRaw label="Employment Type" name={`work_type_${i}`} value={entry.employment_type}
                  onChange={(_, v) => setWorkEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, employment_type: v } : e))}
                  options={employmentTypes.map((t) => ({ value: t.toLowerCase().replace(/\s+/g, "-"), label: t }))} />
                <div className="grid grid-cols-2 gap-3">
                  <CSelectRaw label="Start Year" name={`work_start_${i}`} value={entry.start_year}
                    onChange={(_, v) => setWorkEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, start_year: v } : e))}
                    options={yearOptions.map((y) => ({ value: y, label: y }))} />
                  <CSelectRaw label="End Year" name={`work_end_${i}`} value={entry.end_year}
                    onChange={(_, v) => setWorkEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, end_year: v } : e))}
                    options={yearOptions.map((y) => ({ value: y, label: y }))} />
                </div>
              </div>
            ))}
            <button
              onClick={() => setWorkEntries((prev) => [...prev, { position: "", company: "", employment_type: "", start_year: "", end_year: "", description: "" }])}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold border border-dashed border-border hover:bg-muted/50 min-h-[48px] transition-colors"
            >
              <Plus className="h-4 w-4" /> Mag-dagdag ng Work Record
            </button>

            {/* Business entries */}
            <SectionLabel>Business Records / Negosyo</SectionLabel>
            {businessEntries.map((entry, i) => (
              <div key={i} className="p-3 rounded-xl border border-border space-y-2.5 bg-muted/10">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground">BUSINESS #{i + 1}</p>
                  <button onClick={() => setBusinessEntries((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <CField label="Business Name / Pangalan ng Negosyo" name={`biz_name_${i}`} required value={entry.business_name}
                  onChange={(_, v) => setBusinessEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, business_name: v } : e))} placeholder="SARI-SARI STORE NI MARIA" />
                <CCombobox label="Business Type / Uri" name={`biz_type_${i}`} value={entry.business_type}
                  onChange={(_, v) => setBusinessEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, business_type: v } : e))} placeholder="RETAIL, FOOD, SERVICES" suggestions={S_BUSINESS_TYPE} />
                <CSelectRaw label="Status" name={`biz_status_${i}`} value={entry.status}
                  onChange={(_, v) => setBusinessEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, status: v } : e))}
                  options={businessStatuses.map((s) => ({ value: s.toLowerCase(), label: s }))} />
                <CField label="Business Address" name={`biz_addr_${i}`} value={entry.business_address}
                  onChange={(_, v) => setBusinessEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, business_address: v } : e))} placeholder="PUROK 3, RIZAL ST" />
                <div className="grid grid-cols-2 gap-3">
                  <CField label="Business Permit No." name={`biz_permit_${i}`} value={entry.business_permit_no}
                    onChange={(_, v) => setBusinessEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, business_permit_no: v } : e))} />
                  <CField label="DTI/SEC No." name={`biz_dti_${i}`} value={entry.dti_sec_no}
                    onChange={(_, v) => setBusinessEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, dti_sec_no: v } : e))} />
                </div>
                <CSelectRaw label="Monthly Income" name={`biz_income_${i}`} value={entry.monthly_income}
                  onChange={(_, v) => setBusinessEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, monthly_income: v } : e))}
                  options={incomeRanges.map((r) => ({ value: r.toLowerCase().replace(/[₱,\s]+/g, ""), label: r }))} />
                <CSelectRaw label="Start Year" name={`biz_start_${i}`} value={entry.start_year}
                  onChange={(_, v) => setBusinessEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, start_year: v } : e))}
                  options={yearOptions.map((y) => ({ value: y, label: y }))} />
              </div>
            ))}
            <button
              onClick={() => setBusinessEntries((prev) => [...prev, { business_name: "", business_type: "", business_address: "", business_permit_no: "", dti_sec_no: "", monthly_income: "", start_year: "", status: "", description: "" }])}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold border border-dashed border-border hover:bg-muted/50 min-h-[48px] transition-colors"
            >
              <Plus className="h-4 w-4" /> Mag-dagdag ng Business
            </button>
          </div>
        )}

        {/* ═══════ STEP 8: GOVERNMENT IDs ═══════ */}
        {step === 7 && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground mb-1">I-fill in lang kung available. Hindi required.</p>

            <SectionLabel>GSIS / SSS</SectionLabel>
            <CField label="GSIS/SSS Number" name="sss_gsis_number" value={f("sss_gsis_number")} onChange={updateForm} placeholder="00-0000000-0" mono maxLength={50} />
            <CField label="Expiry Date" name="sss_gsis_expiry" type="date" value={f("sss_gsis_expiry")} onChange={updateForm} />

            <SectionLabel>PhilHealth</SectionLabel>
            <CField label="PhilHealth Number" name="philhealth_number" value={f("philhealth_number")} onChange={updateForm} placeholder="00-000000000-0" mono maxLength={50} />
            <CField label="Expiry Date" name="philhealth_expiry" type="date" value={f("philhealth_expiry")} onChange={updateForm} />

            <SectionLabel>Pag-IBIG</SectionLabel>
            <CField label="Pag-IBIG Number" name="pagibig_number" value={f("pagibig_number")} onChange={updateForm} placeholder="0000-0000-0000" mono maxLength={50} />
            <CField label="Expiry Date" name="pagibig_expiry" type="date" value={f("pagibig_expiry")} onChange={updateForm} />

            <SectionLabel>TIN</SectionLabel>
            <CField label="TIN Number" name="tin_number" value={f("tin_number")} onChange={updateForm} placeholder="000-000-000-000" mono maxLength={50} />
            <CField label="Expiry Date" name="tin_expiry" type="date" value={f("tin_expiry")} onChange={updateForm} />

            <SectionLabel>PWD ID</SectionLabel>
            <CField label="PWD ID Number" name="pwd_id" value={f("pwd_id")} onChange={updateForm} mono maxLength={50} />
            <CField label="Expiry Date" name="pwd_id_expiry" type="date" value={f("pwd_id_expiry")} onChange={updateForm} />

            <SectionLabel>Senior Citizen</SectionLabel>
            <CField label="Senior Citizen ID" name="senior_citizen_id" value={f("senior_citizen_id")} onChange={updateForm} mono maxLength={50} />
          </div>
        )}

        {/* ═══════ STEP 9: EMERGENCY CONTACT ═══════ */}
        {step === 8 && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground mb-1">Sino ang dapat tawagan kung may emergency?</p>
            <CField label="Contact Person / Pangalan" name="emergency_contact_name" value={f("emergency_contact_name")} onChange={updateForm} placeholder="MARIA DELA CRUZ" />
            <CField label="Phone Number / Numero" name="emergency_contact_phone" type="tel" value={f("emergency_contact_phone")} onChange={updateForm} placeholder="09171234567" />
            <CField label="Address / Tirahan" name="emergency_contact_address" value={f("emergency_contact_address")} onChange={updateForm} placeholder="PUROK 5, BRGY. TAMBO" maxLength={1000} />
            <CCombobox label="Relationship / Relasyon" name="emergency_contact_relationship" value={f("emergency_contact_relationship")} onChange={updateForm}
              placeholder="SPOUSE, PARENT, SIBLING" suggestions={S_EMERGENCY_REL} />
          </div>
        )}

        {/* ═══════ STEP 10: PHOTO ═══════ */}
        {step === 9 && (
          <div className="space-y-4">
            <SectionLabel>Resident Photo / Litrato</SectionLabel>

            {photoPreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-border shadow-md">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPhotoPreview(null); setPhotoFileId(null); setCameraActive(true); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted min-h-[44px] transition-colors">
                    <RotateCcw className="h-3.5 w-3.5" /> Ulitin
                  </button>
                  <button onClick={() => { setPhotoPreview(null); setPhotoFileId(null); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 min-h-[44px] transition-colors">
                    <X className="h-3.5 w-3.5" /> Alisin
                  </button>
                </div>
              </div>
            ) : cameraActive ? (
              /* Live camera viewfinder */
              <LiveCamera
                onCapture={(blob, preview) => {
                  setCameraActive(false);
                  setPhotoPreview(preview);
                  setPhotoUploading(true);
                  resizeImage(new File([blob], "photo.jpg", { type: "image/jpeg" }), 800)
                    .then((resized) => api.files.uploadPhoto(resized))
                    .then((res) => setPhotoFileId(res.file.id))
                    .catch(() => { setPhotoPreview(null); setPhotoFileId(null); })
                    .finally(() => setPhotoUploading(false));
                }}
                onCancel={() => setCameraActive(false)}
              />
            ) : (
              <div className="space-y-3">
                {/* Primary: open live camera */}
                <button onClick={() => setCameraActive(true)} disabled={photoUploading}
                  className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors min-h-[200px]">
                  {photoUploading ? (
                    <><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /><p className="text-xs text-muted-foreground">Uploading...</p></>
                  ) : (
                    <>
                      <Camera className="h-10 w-10 text-muted-foreground/50" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Tap para buksan ang camera</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Kukuha ng litrato ng residente</p>
                      </div>
                    </>
                  )}
                </button>
                {/* Fallback: pick from gallery */}
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold border border-border hover:bg-muted min-h-[44px] transition-colors text-muted-foreground">
                  <Upload className="h-4 w-4" /> Pumili mula sa gallery
                </button>
                <p className="text-[10px] text-muted-foreground text-center">Optional lang ang photo — pwede itong idagdag sa office mamaya.</p>
                {photoError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">{photoError}</p>
                  </div>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhoto(file); e.target.value = ""; }} />
          </div>
        )}

        {/* ═══════ STEP 11: REVIEW ═══════ */}
        {step === 10 && (
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">I-review bago i-submit</p>

            {/* Identity card */}
            <ReviewCard icon={User} title="PANGALAN / IDENTITY">
              <div className="flex items-center gap-3">
                {photoPreview && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {f("last_name")}, {f("first_name")} {f("middle_name") ? f("middle_name").charAt(0) + "." : ""} {f("extension_name")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDatePreview(f("date_of_birth"))}{getAge(f("date_of_birth")) !== null ? ` (${getAge(f("date_of_birth"))} taon)` : ""}
                    {f("sex") ? ` — ${f("sex") === "male" ? "Lalaki" : "Babae"}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {f("civil_status") ? f("civil_status").charAt(0).toUpperCase() + f("civil_status").slice(1) : ""}
                    {f("citizenship") ? ` — ${f("citizenship")}` : ""}
                  </p>
                </div>
              </div>
              {f("mothers_maiden_name") && <ReviewLine label="Mother's Maiden" value={f("mothers_maiden_name")} />}
            </ReviewCard>

            {/* Physical */}
            {(f("blood_type") || f("height_cm") || f("weight_kg") || f("religion") || f("ethnicity")) && (
              <ReviewCard icon={Heart} title="PISIKAL / PHYSICAL">
                {f("blood_type") && <ReviewLine label="Blood Type" value={f("blood_type")} />}
                {(f("height_cm") || f("weight_kg")) && <ReviewLine label="Height / Weight" value={`${f("height_cm") ? f("height_cm") + "cm" : "—"} / ${f("weight_kg") ? f("weight_kg") + "kg" : "—"}`} />}
                {f("complexion") && <ReviewLine label="Complexion" value={f("complexion")} />}
                {f("religion") && <ReviewLine label="Religion" value={f("religion")} />}
                {f("ethnicity") && <ReviewLine label="Ethnicity" value={f("ethnicity")} />}
              </ReviewCard>
            )}

            {/* Address */}
            <ReviewCard icon={Home} title="TIRAHAN / ADDRESS">
              <p className="text-xs text-foreground">
                {[f("house_block_lot"), f("street"), f("sitio"), f("purok")].filter(Boolean).join(", ") || <span className="text-muted-foreground/50 italic">Walang address</span>}
              </p>
              <ReviewLine label="Type" value={f("resident_type") ? f("resident_type").charAt(0).toUpperCase() + f("resident_type").slice(1) : "Permanent"} />
              {f("latitude") && <ReviewLine label="GPS" value={`${f("latitude")}, ${f("longitude")}`} />}
              {f("is_head_of_household") && <ReviewLine label="Household" value={f("is_head_of_household") === "yes" ? "Head" : `${f("relationship_to_head") || "Member"}`} />}
            </ReviewCard>

            {/* Contact */}
            <ReviewCard icon={Phone} title="KONTAK / CONTACT">
              {f("mobile_number") && <ReviewLine label="Mobile" value={f("mobile_number")} />}
              {f("telephone") && <ReviewLine label="Telephone" value={f("telephone")} />}
              {f("email") && <ReviewLine label="Email" value={f("email")} />}
              {f("is_voter") && <ReviewLine label="Voter" value={f("is_voter") === "yes" ? `Oo${f("voter_precinct_number") ? ` — Precinct ${f("voter_precinct_number")}` : ""}` : "Hindi"} />}
              {f("emergency_contact_name") && (
                <ReviewLine label="Emergency" value={`${f("emergency_contact_name")} (${f("emergency_contact_relationship") || "—"}) ${f("emergency_contact_phone")}`} />
              )}
            </ReviewCard>

            {/* Sectors */}
            {sectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sectors.map((s) => (
                  <span key={s} className="px-2 py-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{s}</span>
                ))}
              </div>
            )}

            {/* Education */}
            {(f("highest_education") || educationEntries.length > 0) && (
              <ReviewCard icon={GraduationCap} title="EDUKASYON / EDUCATION">
                {f("highest_education") && <ReviewLine label="Highest" value={f("highest_education")} />}
                {educationEntries.filter((e) => e.level).map((e, i) => (
                  <p key={i} className="text-xs text-foreground">{e.level}{e.school ? ` — ${e.school}` : ""}{e.course ? ` (${e.course})` : ""}{e.start_year ? ` ${e.start_year}` : ""}{e.end_year ? `-${e.end_year}` : e.currently_studying ? " (present)" : ""}</p>
                ))}
              </ReviewCard>
            )}

            {/* Work */}
            {(f("livelihood_type") || workEntries.length > 0 || businessEntries.length > 0) && (
              <ReviewCard icon={Briefcase} title="TRABAHO / WORK">
                {f("livelihood_type") && <ReviewLine label="Livelihood" value={f("livelihood_type")} />}
                {f("occupation") && <ReviewLine label="Occupation" value={f("occupation")} />}
                {f("employer") && <ReviewLine label="Employer" value={f("employer")} />}
                {f("monthly_income_range") && <ReviewLine label="Income" value={f("monthly_income_range")} />}
                {workEntries.filter((w) => w.position).map((w, i) => (
                  <p key={i} className="text-xs text-foreground">{w.position}{w.company ? ` sa ${w.company}` : ""}{w.start_year ? ` (${w.start_year}${w.end_year ? `-${w.end_year}` : ""})` : ""}</p>
                ))}
                {businessEntries.filter((b) => b.business_name).map((b, i) => (
                  <p key={i} className="text-xs text-foreground">Business: {b.business_name}{b.business_type ? ` (${b.business_type})` : ""}{b.status ? ` — ${b.status}` : ""}</p>
                ))}
              </ReviewCard>
            )}

            {/* Gov IDs */}
            {(f("sss_gsis_number") || f("philhealth_number") || f("pagibig_number") || f("tin_number") || f("pwd_id") || f("senior_citizen_id")) && (
              <ReviewCard icon={CreditCard} title="GOV IDs">
                {f("sss_gsis_number") && <ReviewLine label="SSS/GSIS" value={f("sss_gsis_number")} />}
                {f("philhealth_number") && <ReviewLine label="PhilHealth" value={f("philhealth_number")} />}
                {f("pagibig_number") && <ReviewLine label="Pag-IBIG" value={f("pagibig_number")} />}
                {f("tin_number") && <ReviewLine label="TIN" value={f("tin_number")} />}
                {f("pwd_id") && <ReviewLine label="PWD" value={f("pwd_id")} />}
                {f("senior_citizen_id") && <ReviewLine label="Senior" value={f("senior_citizen_id")} />}
              </ReviewCard>
            )}

            {/* Source badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <ClipboardCheck className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                {isOnline ? "I-reregister bilang: Census (Field Survey)" : "OFFLINE — I-queue at i-sync kapag may signal"}
              </p>
            </div>

            {!isOnline && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800">
                <WifiOff className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Walang internet — ang record ay i-save sa device at automatic na mag-sync kapag may signal na ulit.
                </p>
              </div>
            )}

            {submitError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* ── AI Tip (every step) ────────────────────────────────────── */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-accent-bg/30 border border-accent-primary/15">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{AI_TIPS[currentStep.id]}</p>
        </div>
      </div>

      {/* ── Bottom nav (sticky) ──────────────────────────────────────── */}
      <div className="sticky bottom-0 z-40 px-3 py-3 bg-background/95 backdrop-blur-sm border-t border-border flex gap-3">
        {step > 0 && (
          <button onClick={goBack}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-muted min-h-[48px] transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        {isLast ? (
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold min-h-[48px] transition-colors disabled:opacity-60"
            style={{ background: "var(--accent-primary)", color: "#fff" }}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {isOnline ? "Nag-submit..." : "Saving offline..."}</> : <><Check className="h-4 w-4" /> {isOnline ? "I-register" : "Save Offline"}</>}
          </button>
        ) : (
          <button onClick={goNext}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold min-h-[48px] transition-colors"
            style={{ background: "var(--accent-primary)", color: "#fff" }}>
            Susunod <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Live Camera component — uses getUserMedia for real camera viewfinder
// ══════════════════════════════════════════════════════════════════════════════

function LiveCamera({
  onCapture,
  onCancel,
}: {
  onCapture: (blob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Start camera on mount
  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      try {
        // Try rear camera first (environment), fall back to any camera
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setReady(true); };
        }
      } catch (err) {
        if (!cancelled) {
          const e = err as { name?: string };
          if (e.name === "NotAllowedError") {
            setError("Camera access denied. I-allow ang camera permission sa browser settings.");
          } else if (e.name === "NotFoundError") {
            setError("Walang camera sa device na ito.");
          } else {
            setError("Hindi ma-open ang camera. Subukan ang 'Pumili mula sa gallery' sa ibaba.");
          }
        }
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    // Stop camera
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          onCapture(blob, url);
        }
      },
      "image/jpeg",
      0.9,
    );
  }, [onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-xs text-center text-muted-foreground px-4">{error}</p>
        <button onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted min-h-[44px] transition-colors">
          <X className="h-3.5 w-3.5" /> Bumalik
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Viewfinder */}
      <div className="relative w-full max-w-[300px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-border shadow-md bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {/* Crosshair overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-4 right-4 h-px bg-white/20" />
          <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/20" />
        </div>
      </div>

      {/* Capture + Cancel buttons */}
      <div className="flex items-center gap-4">
        <button onClick={onCancel}
          className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <button onClick={capturePhoto} disabled={!ready}
          className="w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40"
          style={{ background: "var(--accent-primary)" }}>
          <Camera className="h-7 w-7 text-white" />
        </button>
        <div className="w-12 h-12" /> {/* Spacer for centering */}
      </div>
      <p className="text-[10px] text-muted-foreground">I-point ang camera sa residente at i-tap ang capture button</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Review helper components
// ══════════════════════════════════════════════════════════════════════════════

function ReviewCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-3 space-y-1.5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] text-muted-foreground shrink-0 w-20">{label}:</span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Image resize helper (reduces upload size on mobile data)
// ══════════════════════════════════════════════════════════════════════════════

function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxSize && height <= maxSize) { resolve(file); return; }
      if (width > height) { height = Math.round(height * (maxSize / width)); width = maxSize; }
      else { width = Math.round(width * (maxSize / height)); height = maxSize; }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))), "image/jpeg", 0.85);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}
