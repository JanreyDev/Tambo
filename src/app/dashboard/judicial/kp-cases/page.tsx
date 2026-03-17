"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Scale,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  Users,
  FileText,
  Eye,
  Edit,
  Printer,
  Save,
  Bot,
  CheckCircle,
  Gavel,
  ArrowUpRight,
  AlertCircle,
  BookOpen,
  ChevronDown,
  Phone,
  MapPin,
  MessageSquare,
  Loader2,
  Smartphone,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { KpCaseListItem, KpCaseDetail, KpCaseParty } from "@/lib/types";

// ── KP Form Reference (RA 7160 / Katarungang Pambarangay Handbook) ──
const KP_FORMS = [
  { number: 1, name: "Notice to Constitute the Lupon", stage: "lupon" },
  { number: 2, name: "Appointment Letter", stage: "lupon" },
  { number: 3, name: "Notice of Appointment", stage: "lupon" },
  { number: 4, name: "List of Appointed Lupon Members", stage: "lupon" },
  { number: 5, name: "Lupon Member Oath Statement", stage: "lupon" },
  { number: 6, name: "Withdrawal of Appointment", stage: "lupon" },
  { number: 7, name: "Complainant's Form", stage: "filing" },
  { number: 8, name: "Notice of Hearing (Mediation)", stage: "mediation" },
  { number: 9, name: "Summons for Respondent", stage: "mediation" },
  { number: 10, name: "Notice for Constitution of Pangkat", stage: "conciliation" },
  { number: 11, name: "Notice to Chosen Pangkat Member", stage: "conciliation" },
  { number: 12, name: "Notice of Hearing (Conciliation)", stage: "conciliation" },
  { number: 13, name: "Subpoena Letter", stage: "conciliation" },
  { number: 14, name: "Agreement for Arbitration", stage: "arbitration" },
  { number: 15, name: "Arbitration Award", stage: "arbitration" },
  { number: 16, name: "Amicable Settlement", stage: "settlement" },
  { number: 17, name: "Repudiation", stage: "settlement" },
  { number: 18, name: "Notice of Hearing (Complainant Failure to Appear)", stage: "enforcement" },
  { number: 19, name: "Notice of Hearing (Respondent Failure to Appear)", stage: "enforcement" },
  { number: 20, name: "Certification to File Action (Lupon Secretary)", stage: "cfa" },
  { number: 21, name: "Certification to File Action (Pangkat Secretary)", stage: "cfa" },
  { number: 22, name: "Certification to File Action", stage: "cfa" },
  { number: 23, name: "Certification to Bar Action", stage: "cfa" },
  { number: 24, name: "Certification to Bar Counterclaim", stage: "cfa" },
  { number: 25, name: "Motion for Execution", stage: "execution" },
  { number: 26, name: "Notice of Hearing (Motion for Execution)", stage: "execution" },
  { number: 27, name: "Notice of Execution", stage: "execution" },
  { number: 28, name: "Monthly Transmittal of Final Reports", stage: "reporting" },
];

// Forms shown per case status in the Generate Document modal
const KP_FORMS_BY_STATUS: Record<string, number[]> = {
  filed:        [7, 8, 9],
  mediation:    [7, 8, 9, 18, 19, 20],
  conciliation: [10, 11, 12, 13, 18, 19, 21],
  arbitration:  [14, 15],
  settled:      [16, 17, 25, 26, 27],
  cfa_issued:   [20, 21, 22, 23, 24],
  dismissed:    [20, 21, 22, 23],
};

// ── KP Form print generator ──────────────────────────────────────────────────
function generateKpFormHtml(
  formNumber: number,
  kpCase: { case_number: string; filing_date: string; case_level: string; nature: string; nature_of_complaint: string; case_description?: string | null; parties?: Array<{ party_type: string; party_mode: string; first_name?: string | null; middle_name?: string | null; last_name?: string | null; full_name: string; address?: string | null; mobile_number?: string | null }> },
  barangay?: { name?: string; city_municipality?: string | null; province?: string | null; captain_name?: string | null } | null
): string {
  const form = KP_FORMS.find((f) => f.number === formNumber);
  if (!form) return "";

  const parties = kpCase.parties ?? [];
  const complainants = parties.filter((p) => p.party_type === "complainant");
  const respondents  = parties.filter((p) => p.party_type === "respondent");

  const partyName = (p: typeof parties[0]) =>
    p.party_mode === "group"
      ? p.full_name
      : [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");

  const complainantNames  = complainants.map(partyName).join(", ") || "_______________";
  const respondentNames   = respondents.map(partyName).join(", ")  || "_______________";
  const complainantAddr   = complainants[0]?.address       || "";
  const respondentAddr    = respondents[0]?.address        || "";
  const complainantMobile = complainants[0]?.mobile_number || "";
  const respondentMobile  = respondents[0]?.mobile_number  || "";

  const filingDate = kpCase.filing_date
    ? new Date(kpCase.filing_date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "_______________";

  const brgyName    = barangay?.name              ?? "_______________";
  const munName     = barangay?.city_municipality ?? "_______________";
  const provName    = barangay?.province          ?? "_______________";
  const captainName = barangay?.captain_name      ?? "_______________";
  const year        = new Date().getFullYear();

  const css = `<style>
    *{box-sizing:border-box}
    body{font-family:"Times New Roman",Times,serif;margin:0;padding:22mm 20mm;font-size:11pt;color:#000}
    @page{size:A4;margin:0}
    table{border-collapse:collapse;width:100%}
    td{padding:5px 4px;vertical-align:top}
    .bb{border-bottom:1px solid #000}
    .box{border:1px solid #000;padding:8px 10px;margin:10px 0}
    .sig{border-top:1px solid #000;padding-top:4px;text-align:center;display:inline-block;min-width:220px}
    .center{text-align:center}
    .bold{font-weight:bold}
  </style>`;

  const letterhead = `
    <div class="center" style="border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px">
      <p style="margin:0;font-size:10.5pt">Republic of the Philippines</p>
      <p style="margin:2px 0;font-size:10.5pt">Province of ${provName}</p>
      <p style="margin:2px 0;font-size:10.5pt">Municipality / City of ${munName}</p>
      <p style="margin:4px 0;font-size:14pt;font-weight:bold">Barangay ${brgyName}</p>
      <p style="margin:6px 0 0;font-size:11pt;font-weight:bold;text-transform:uppercase">Lupong Tagapamayapa</p>
    </div>
    <div class="center" style="margin-bottom:18px">
      <span style="border:1px solid #000;font-size:9pt;padding:2px 10px">KP FORM NO. ${formNumber}</span>
      <h2 style="font-size:13pt;font-weight:bold;text-transform:uppercase;margin:8px 0 4px">${form.name}</h2>
      <p style="font-size:10pt;margin:0">Case No.: <strong>${kpCase.case_number}</strong></p>
    </div>`;

  const officerFooter = `
    <div style="margin-top:40px;display:flex;gap:40px">
      <div>
        <p style="font-size:10pt;margin-bottom:28px">Signed this _____ day of _______________, ${year}</p>
        <div class="sig"><p class="bold" style="margin:0">${captainName}</p><p style="font-size:9pt;margin:0">Punong Barangay / Lupon Chairman</p></div>
      </div>
      <div style="margin-top:38px">
        <div class="sig"><p class="bold" style="margin:0">_______________________________</p><p style="font-size:9pt;margin:0">Lupon Secretary</p></div>
      </div>
    </div>`;

  let body = "";

  if (formNumber === 7) {
    body = `
      <p style="margin-bottom:14px">This is to certify that on <strong>${filingDate}</strong>, the undersigned personally appeared before the Punong Barangay and filed this complaint.</p>
      <table style="margin-bottom:14px">
        <tr><td style="width:32%" class="bold">Complainant:</td><td class="bb">${complainantNames}</td></tr>
        <tr><td class="bold">Address:</td><td class="bb">${complainantAddr || "_______________"}</td></tr>
        <tr><td class="bold">Contact No.:</td><td class="bb">${complainantMobile || "_______________"}</td></tr>
        <tr><td class="bold" style="padding-top:10px">Respondent:</td><td class="bb">${respondentNames}</td></tr>
        <tr><td class="bold">Address:</td><td class="bb">${respondentAddr || "_______________"}</td></tr>
        <tr><td class="bold">Contact No.:</td><td class="bb">${respondentMobile || "_______________"}</td></tr>
        <tr><td class="bold">Nature:</td><td class="bb">${kpCase.nature_of_complaint || kpCase.nature}</td></tr>
        <tr><td class="bold" style="vertical-align:top">Facts:</td><td class="bb" style="padding-bottom:30px">${kpCase.case_description ?? ""}</td></tr>
      </table>
      <p style="font-size:9pt"><em>Filing Fee Paid: P_______ &nbsp; O.R. No. _______</em></p>
      <div style="margin-top:30px;text-align:center">
        <div class="sig"><p class="bold" style="margin:0">${complainantNames}</p><p style="font-size:9pt;margin:0">Complainant's Signature over Printed Name</p></div>
      </div>
      ${officerFooter}`;
  } else if (formNumber === 8) {
    body = `
      <p>To: <strong>${complainantNames}</strong> and <strong>${respondentNames}</strong></p>
      <p style="line-height:1.9;margin:14px 0">
        You are hereby notified that there will be a <strong>MEDIATION HEARING</strong> on the above-captioned case on:<br/>
        Date: <strong>_________________________________</strong><br/>
        Time: <strong>_________________________________</strong><br/>
        Venue: <strong>Barangay Hall, Barangay ${brgyName}</strong>
      </p>
      <p style="margin-bottom:16px">Please be punctual and bring all documents pertinent to the case.</p>
      <div class="box"><p style="margin:0"><strong>NOTE:</strong> Failure to appear without justifiable cause shall subject the absent party to the sanctions under Section 417, R.A. 7160.</p></div>
      ${officerFooter}`;
  } else if (formNumber === 9) {
    body = `
      <p>To: <strong>${respondentNames}</strong><br/>Address: ${respondentAddr || "_______________"}</p>
      <p style="line-height:1.9;margin:14px 0">
        You are hereby summoned to appear before the undersigned on:<br/>
        Date: <strong>_________________________________</strong><br/>
        Time: <strong>_________________________________</strong><br/>
        Venue: <strong>Barangay Hall, Barangay ${brgyName}</strong>
      </p>
      <p>in connection with the complaint filed against you by <strong>${complainantNames}</strong> regarding <em>${kpCase.nature_of_complaint || kpCase.nature}</em>.</p>
      <p style="margin:14px 0">You are required to bring this summons with you and answer the complaint in writing or verbally.</p>
      <div class="box"><p style="margin:0"><strong>IMPORTANT:</strong> Non-appearance without valid excuse is a ground for issuance of a Certification to File Action (CFA) against you per Sec. 417, R.A. 7160.</p></div>
      ${officerFooter}`;
  } else if (formNumber === 16) {
    body = `
      <p>This AMICABLE SETTLEMENT, entered into this _____ day of _______________, ${year}, between:</p>
      <div class="box"><p style="margin:2px 0"><strong>COMPLAINANT:</strong> ${complainantNames}</p><p style="margin:2px 0">Address: ${complainantAddr || "_______________"}</p></div>
      <p class="center" style="margin:8px 0">— and —</p>
      <div class="box"><p style="margin:2px 0"><strong>RESPONDENT:</strong> ${respondentNames}</p><p style="margin:2px 0">Address: ${respondentAddr || "_______________"}</p></div>
      <p style="margin:16px 0 6px"><strong>TERMS OF SETTLEMENT:</strong></p>
      <div style="min-height:80px;border-bottom:1px solid #000;margin-bottom:4px"></div>
      <div style="min-height:60px;border-bottom:1px solid #000;margin-bottom:16px"></div>
      <p style="font-size:9pt"><em>This settlement shall have the force and effect of a final judgment of a court upon expiration of ten (10) days from the date hereof, unless repudiated within such period pursuant to Sec. 418, R.A. 7160.</em></p>
      <div style="margin-top:30px;display:flex;gap:40px;justify-content:center">
        <div class="sig"><p class="bold" style="margin:0">${complainantNames}</p><p style="font-size:9pt;margin:0">Complainant</p></div>
        <div class="sig"><p class="bold" style="margin:0">${respondentNames}</p><p style="font-size:9pt;margin:0">Respondent</p></div>
      </div>
      <p class="center bold" style="margin-top:24px">ATTESTED BY:</p>
      <div class="center" style="margin-top:12px"><div class="sig"><p class="bold" style="margin:0">${captainName}</p><p style="font-size:9pt;margin:0">Punong Barangay / Lupon Chairman</p></div></div>`;
  } else if (formNumber === 20 || formNumber === 21 || formNumber === 22) {
    const by = formNumber === 20 ? "Lupon Secretary" : formNumber === 21 ? "Pangkat Secretary" : "Lupon/Pangkat Secretary";
    body = `
      <p class="center" style="font-size:10pt;font-style:italic;margin-bottom:16px">(Pursuant to Sections 410 and 412, Chapter VII, Title I, Book III of R.A. 7160)</p>
      <p>This is to certify that the dispute between:</p>
      <p style="margin:10px 0"><strong>COMPLAINANT:</strong> ${complainantNames}</p>
      <p style="margin:10px 0"><strong>RESPONDENT:</strong> ${respondentNames}</p>
      <p style="margin:16px 0;line-height:1.9">
        involving <em>${kpCase.nature_of_complaint || kpCase.nature}</em>, was duly submitted for mediation/conciliation proceedings before the Lupong Tagapamayapa of Barangay <strong>${brgyName}</strong>, ${munName}, ${provName}, but the same was not settled amicably. The complaint is hereby certified for the filing of the appropriate action in court or government office.
      </p>
      <p>Issued this _____ day of _______________, ${year} at Barangay ${brgyName}, ${munName}, ${provName}.</p>
      <div style="margin-top:36px">
        <div class="sig"><p class="bold" style="margin:0">_______________________________</p><p style="font-size:9pt;margin:0">${by}</p></div>
      </div>
      <p class="bold" style="margin-top:20px">NOTED BY:</p>
      <div style="margin-top:10px"><div class="sig"><p class="bold" style="margin:0">${captainName}</p><p style="font-size:9pt;margin:0">Punong Barangay</p></div></div>`;
  } else {
    body = `
      <table style="margin-bottom:14px">
        <tr><td style="width:32%" class="bold">Case No.:</td><td class="bb">${kpCase.case_number}</td></tr>
        <tr><td class="bold">Filing Date:</td><td class="bb">${filingDate}</td></tr>
        <tr><td class="bold">Nature:</td><td class="bb">${kpCase.nature_of_complaint || kpCase.nature}</td></tr>
        <tr><td class="bold">Complainant:</td><td class="bb">${complainantNames}</td></tr>
        <tr><td class="bold">Respondent:</td><td class="bb">${respondentNames}</td></tr>
      </table>
      <p style="font-size:9pt;font-style:italic;margin-top:16px">Fill in remaining fields per the official KP Form No. ${formNumber} template.</p>
      ${officerFooter}`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>KP Form ${formNumber} — ${kpCase.case_number}</title>${css}</head><body>${letterhead}${body}</body></html>`;
}

// Case nature options per RA 7160 jurisdiction
const NATURE_OPTIONS = ["Civil", "Criminal"];
const CASE_TYPE_OPTIONS = [
  "Property Dispute",
  "Boundary Dispute",
  "Right of Way",
  "Collection of Sum of Money",
  "Unpaid Debt",
  "Slight Physical Injuries (Art. 266)",
  "Less Serious Physical Injuries (Art. 265)",
  "Physical Injuries in Tumultuous Affray (Art. 252)",
  "Oral Defamation / Intriguing Against Honor (Art. 364)",
  "Light Threats (Art. 283)",
  "Light Coercion (Art. 287)",
  "Trespass to Dwelling (Art. 280)",
  "Other Trespass (Art. 281)",
  "Theft (under P50) (Art. 309)",
  "Qualified Theft (under P500) (Art. 310)",
  "Swindling/Estafa (under P200) (Art. 315)",
  "Malicious Mischief (under P1,000) (Art. 328)",
  "Simple Seduction (Art. 338)",
  "Alarms and Scandals (Art. 155)",
  "Damage to Property",
  "Nuisance / Noise Complaint",
  "Breach of Contract",
  "BP 22 (Bouncing Check)",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "filed", label: "Filed", color: "bg-slate-500" },
  { value: "mediation", label: "Mediation", color: "bg-blue-500" },
  { value: "conciliation", label: "Conciliation", color: "bg-violet-500" },
  { value: "arbitration", label: "Arbitration", color: "bg-amber-500" },
  { value: "settled", label: "Settled", color: "bg-emerald-500" },
  { value: "cfa_issued", label: "Certification to File Action (CFA)", color: "bg-red-500" },
  { value: "dismissed", label: "Dismissed", color: "bg-gray-500" },
  { value: "closed", label: "Closed", color: "bg-gray-400" },
];

const CASE_LEVEL_OPTIONS = [
  { value: "mediation", label: "Mediation (Punong Barangay)" },
  { value: "conciliation", label: "Conciliation (Pangkat Tagapagkasundo)" },
  { value: "arbitration", label: "Arbitration" },
];

// ── Form Field Components ──
function FormInput({ label, value, onChange, required, type = "text", placeholder = "", error, disabled, maxLength, digitsOnly }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string; error?: string; disabled?: boolean; maxLength?: number; digitsOnly?: boolean }) {
  const handleChange = (raw: string) => {
    let v = type === "text" ? raw.toUpperCase() : raw;
    if (digitsOnly) v = v.replace(/\D/g, "");
    if (maxLength !== undefined) v = v.slice(0, maxLength);
    onChange(v);
  };
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} disabled={disabled} maxLength={maxLength}
        style={type === "text" ? { textTransform: "uppercase" } : undefined}
        className={cn("w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring disabled:opacity-50", error && "border-red-500")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, value, onChange, options, required, error }: { label: string; value: string; onChange: (value: string) => void; options: string[] | { value: string; label: string }[]; required?: boolean; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring", error && "border-red-500")}>
        <option value="">Select {label}</option>
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lbl = typeof o === "string" ? o : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormCombobox({ label, value, onChange, options, required, error, placeholder }: {
  label: string; value: string; onChange: (value: string) => void;
  options: string[] | { value: string; label: string }[];
  required?: boolean; error?: string; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = options.map((o) => ({
    value: typeof o === "string" ? o : o.value,
    label: typeof o === "string" ? o : o.label,
  }));

  const filtered = query.trim()
    ? normalized.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : normalized;

  const selectedLabel = normalized.find((o) => o.value === value)?.label ?? "";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 220);
    }
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {open ? (
        <div className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl border bg-background focus-within:ring-2 focus-within:ring-accent-ring", error ? "border-red-500" : "border-accent-primary")}>
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder={`Search ${label.toLowerCase()}...`}
            style={{ textTransform: "uppercase" }}
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground text-sm" />
          <button onClick={() => { setOpen(false); setQuery(""); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={handleOpen}
          className={cn("w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl border bg-background text-left transition-colors hover:bg-muted/50",
            error ? "border-red-500" : "border-border",
            value ? "text-foreground" : "text-muted-foreground")}>
          <span>{selectedLabel || (placeholder ?? `Select ${label}`)}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      )}
      {open && filtered.length > 0 && (
        <div className={cn("absolute left-0 right-0 z-[9999] bg-white dark:bg-slate-800 border border-border rounded-xl shadow-xl overflow-hidden",
          dropUp ? "bottom-full mb-1" : "top-full mt-1")}>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((o) => (
              <button key={o.value} type="button" onClick={() => handleSelect(o.value)}
                className={cn("w-full text-left px-3 py-2 text-sm transition-colors hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-700 dark:hover:text-orange-300",
                  o.value === value ? "bg-orange-50 dark:bg-slate-700 text-orange-700 dark:text-orange-300 font-medium" : "text-slate-800 dark:text-slate-100")}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className={cn("absolute left-0 right-0 z-[9999] bg-white dark:bg-slate-800 border border-border rounded-xl shadow-xl px-3 py-4 text-center", dropUp ? "bottom-full mb-1" : "top-full mt-1")}>
          <p className="text-xs text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
        </div>
      )}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, value, onChange, required, rows = 3, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} rows={rows} placeholder={placeholder}
        style={{ textTransform: "uppercase" }}
        className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

// ── Timeline badge helper ──
function DeadlineBadge({ deadline, label }: { deadline: string | null; label: string }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const isOverdue = d < now;
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
      isOverdue ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" : daysLeft <= 3 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400")}>
      <Clock className="w-3 h-3" />
      {label}: {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
    </span>
  );
}

// ── KP Form Stage Indicator ──
function CaseFlowIndicator({ level, status }: { level: string; status: string }) {
  const stages = [
    { key: "filed", label: "Filed" },
    { key: "mediation", label: "Mediation" },
    { key: "conciliation", label: "Conciliation" },
    { key: "resolution", label: "Resolution" },
  ];

  const activeIndex = status === "filed" ? 0
    : level === "mediation" ? 1
    : level === "conciliation" ? 2
    : 3;

  const isDone = ["settled", "cfa_issued", "dismissed", "closed"].includes(status);

  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div className={cn("w-2 h-2 rounded-full",
            isDone ? "bg-emerald-500" : i < activeIndex ? "bg-emerald-500" : i === activeIndex ? "bg-accent-primary animate-pulse" : "bg-muted")} />
          {i < stages.length - 1 && <div className={cn("w-4 h-0.5", i < activeIndex || isDone ? "bg-emerald-500" : "bg-muted")} />}
        </div>
      ))}
    </div>
  );
}

// ── KP SMS Modal ─────────────────────────────────────────────────────────────
const CHARS_PER_SEG = 159;
const SMS_COST = 0.50;
const MAX_SMS_CHARS = CHARS_PER_SEG * 4;
const KP_SMS_TEMPLATES = [
  { label: "Notice of Hearing", text: "Abiso: Mayroon kayong scheduled hearing para sa inyong KP case sa barangay hall. Mangyaring dumalo sa itinakdang oras. Pakikontak ang barangay para sa detalye." },
  { label: "Mediation Reminder", text: "Paalaala: Ang mediation ng inyong kaso ay itutuloy sa barangay hall. Ang inyong kooperasyon ay lubos na kailangan. Maraming salamat." },
  { label: "Settlement Notice", text: "Maligayang balita! Ang inyong kaso ay matagumpay na naayos. Mangyaring pumunta sa barangay hall para pumirma sa kasunduan. Salamat sa inyong pakikiisa." },
  { label: "Summons", text: "Kayo ay isinasapanganib na dumalo sa hearing ng inyong KP case sa barangay hall. Mahalagang makilahok kayo. Para sa katanungan, makipag-ugnayan sa aming opisina." },
] as const;

function KpSmsModal({ caseNumber, parties, caseId, creditBalance, onClose }: {
  caseNumber: string;
  parties: KpCaseParty[];
  caseId: string;
  creditBalance: number | null;
  onClose: () => void;
}) {
  const complainant = parties.find((p) => p.party_type === "complainant");
  const respondent  = parties.find((p) => p.party_type === "respondent");
  const [recipient, setRecipient] = useState<"complainant" | "respondent" | "both">("complainant");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [draftingAi, setDraftingAi] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 100); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !sending) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sending, onClose]);

  const chars = message.length;
  const segments = chars === 0 ? 0 : Math.ceil(chars / CHARS_PER_SEG);
  const multiplier = recipient === "both" ? 2 : 1;
  const cost = segments * SMS_COST * multiplier;
  const balance = remainingBalance ?? creditBalance ?? 0;
  const hasCredits = balance >= cost || chars === 0;

  const phoneFor = (type: "complainant" | "respondent") =>
    type === "complainant" ? complainant?.mobile_number : respondent?.mobile_number;
  const nameFor = (type: "complainant" | "respondent") =>
    type === "complainant" ? complainant?.full_name : respondent?.full_name;

  const canSend = chars > 0 && chars <= MAX_SMS_CHARS && hasCredits && !sending &&
    (recipient === "both"
      ? (!!complainant?.mobile_number || !!respondent?.mobile_number)
      : !!phoneFor(recipient));

  const draftWithAi = useCallback(async () => {
    if (draftingAi) return;
    setDraftingAi(true);
    try {
      const name = recipient === "both" ? "both parties" : (nameFor(recipient) ?? "the party");
      const prompt = `Draft a short, professional SMS message in Filipino (Tagalog) for a Katarungang Pambarangay case notification. Recipient: ${name}. Context: KP case ${caseNumber}. Keep it under 159 characters. Return only the SMS text, nothing else.`;
      let draft = "";
      await api.ai.createConversation(prompt, (event) => {
        if (event.event === "content_delta") draft += event.data.text;
      });
      if (mounted.current && draft.trim()) setMessage(draft.trim().slice(0, MAX_SMS_CHARS));
    } catch { /* silent */ } finally {
      if (mounted.current) setDraftingAi(false);
    }
  }, [draftingAi, recipient, caseNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setStatus("idle");
    try {
      const res = await api.kpCases.sendSms(caseId, { recipient, message: message.trim() });
      if (mounted.current) {
        setStatus("success");
        setSentCount(res.sent);
        setRemainingBalance(res.remaining_balance);
      }
    } catch (err: unknown) {
      if (mounted.current) {
        setStatus("error");
        setErrorMsg((err as { message?: string })?.message || "Failed to send SMS. Please try again.");
      }
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  const counterColor = chars > MAX_SMS_CHARS ? "text-red-500" : chars > CHARS_PER_SEG * 3 ? "text-amber-500" : "text-muted-foreground";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Send SMS</h2>
              <p className="text-[11px] text-muted-foreground">{caseNumber}</p>
            </div>
          </div>
          <button type="button" onClick={() => !sending && onClose()} disabled={sending}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success */}
        {status === "success" ? (
          <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">SMS Sent</p>
              <p className="text-sm text-muted-foreground mt-1">{sentCount} message{sentCount !== 1 ? "s" : ""} delivered</p>
              {remainingBalance !== null && (
                <p className="text-xs text-muted-foreground mt-2">Remaining balance: <span className="font-medium text-foreground">₱{remainingBalance.toFixed(2)}</span></p>
              )}
            </div>
            <button type="button" onClick={onClose} className="mt-2 px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "var(--accent-primary)" }}>Done</button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">

            {/* Recipient selector */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Recipient</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/40 border border-border">
                {(["complainant", "respondent", "both"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRecipient(r)}
                    className={cn("py-1.5 text-xs font-medium rounded-lg transition-all capitalize",
                      recipient === r ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {r === "complainant" ? "Complainant" : r === "respondent" ? "Respondent" : "Both"}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone display */}
            {recipient !== "both" ? (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" /> {nameFor(recipient) ?? "—"}
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm font-mono">
                  {phoneFor(recipient) ?? <span className="text-muted-foreground italic text-xs">No mobile number registered</span>}
                  <span className="ml-auto text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">READ-ONLY</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(["complainant", "respondent"] as const).map((type) => (
                  <div key={type} className="px-3 py-2 rounded-xl border border-border bg-muted/40">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase mb-0.5">{type}</p>
                    <p className="text-xs font-mono text-foreground truncate">
                      {phoneFor(type) ?? <span className="text-muted-foreground/60 italic">No number</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Credit balance */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">SMS Credits:</span>
              <span className={cn("font-semibold ml-auto", balance < 1 ? "text-red-500" : balance < 5 ? "text-amber-500" : "text-green-600 dark:text-green-400")}>
                ₱{(remainingBalance ?? creditBalance ?? 0).toFixed(2)}
              </span>
              {recipient === "both" && <span className="text-muted-foreground">(×2 recipients)</span>}
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={draftWithAi} disabled={draftingAi || sending}
                    className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 transition-colors disabled:opacity-40">
                    {draftingAi ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {draftingAi ? "Drafting..." : "Draft with AI"}
                  </button>
                  <div className="relative">
                    <button type="button" onClick={() => setShowTemplates((v) => !v)} disabled={sending}
                      className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-40">
                      Templates <ChevronDown className="h-3 w-3" />
                    </button>
                    {showTemplates && (
                      <div className="absolute right-0 top-7 z-50 w-56 bg-white dark:bg-slate-800 border border-border rounded-xl shadow-lg py-1.5 text-xs">
                        {KP_SMS_TEMPLATES.map((t) => (
                          <button key={t.label} type="button" onClick={() => { setMessage(t.text); setShowTemplates(false); setTimeout(() => textareaRef.current?.focus(), 50); }}
                            className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-foreground">
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <textarea ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)}
                disabled={sending || draftingAi} placeholder="I-type ang mensahe..." rows={4}
                className={cn("w-full px-3 py-3 text-sm rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 transition-colors disabled:opacity-50",
                  chars > MAX_SMS_CHARS ? "border-red-400 focus:ring-red-300" : "border-border focus:ring-accent-ring")} />
              <div className="flex items-center justify-between mt-1.5 px-0.5">
                <div className="flex items-center gap-3 text-[11px]">
                  {segments > 0 && <span className="text-muted-foreground">{segments} msg × {multiplier} — <span className="font-medium text-foreground">₱{cost.toFixed(2)}</span></span>}
                  {!hasCredits && chars > 0 && <span className="text-red-500 font-medium">Insufficient credits</span>}
                </div>
                <span className={cn("text-[11px] font-medium tabular-nums", counterColor)}>{chars}/{MAX_SMS_CHARS}</span>
              </div>
              {chars > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-all",
                      i < segments ? (segments === 1 ? "bg-green-400" : segments === 2 ? "bg-amber-400" : "bg-red-400") : "bg-muted")} />
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {status === "error" && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <button type="button" onClick={() => !sending && onClose()} disabled={sending}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40">
                Cancel
              </button>
              <button type="button" onClick={handleSend} disabled={!canSend}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canSend ? "var(--accent-primary)" : undefined }}>
                {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><MessageSquare className="h-4 w-4" /> Send SMS</>}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center -mt-1">159 chars = 1 message = ₱0.50. Barangay sender header added automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KpCasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("filing_date");
  const [sortDir, setSortDir] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<KpCaseListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ year: number; total: number; active: number; settled: number; mediation: number; conciliation: number; arbitration: number; cfa_issued: number; dismissed: number; overdue_mediation: number; overdue_conciliation: number } | null>(null);

  // Modals
  const [viewCase, setViewCase] = useState<KpCaseDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [caseSmsHistory, setCaseSmsHistory] = useState<Array<{ id: string; recipient_number: string; message: string; segments: number; cost: number; status: string; created_at: string }>>([]);
  const [caseActivity, setCaseActivity] = useState<Array<{ id: string; action: string; changes: Record<string, unknown> | null; created_at: string; user?: { first_name: string; last_name: string; username: string } }>>([]);
  const [showSendSms, setShowSendSms] = useState(false);
  const [smsCaseForm, setSmsCaseForm] = useState<{ recipient: string; message: string }>({ recipient: "complainant", message: "" });
  const [smsSending, setSmsSending] = useState(false);
  const [showRowSms, setShowRowSms] = useState(false);
  const [rowSmsCase, setRowSmsCase] = useState<{ id: string; case_number: string; parties: KpCaseParty[] } | null>(null);
  const [showFileCase, setShowFileCase] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editCaseId, setEditCaseId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
const [showScheduleHearing, setShowScheduleHearing] = useState(false);
  const [hearingForm, setHearingForm] = useState<Record<string, string>>({ hearing_type: "mediation", date: "", time: "", venue: "Barangay Hall", notes: "" });
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [statusForm, setStatusForm] = useState<Record<string, string>>({ status: "", remarks: "" });
  const [showKpFormModal, setShowKpFormModal] = useState(false);
  const [kpFormCase, setKpFormCase] = useState<KpCaseListItem | null>(null);
  const [selectedFormNumber, setSelectedFormNumber] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"dilg" | "doj">("dilg");
  const [reviewFormNumber, setReviewFormNumber] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});


  const kpFormPreview = useMemo(() => {
    if (reviewFormNumber === null) return null;
    const form = KP_FORMS.find((f) => f.number === reviewFormNumber);
    if (!form) return null;
    const stageLabel: Record<string, string> = {
      lupon: "Lupon Administration", filing: "Case Filing", mediation: "Mediation (Punong Barangay)",
      conciliation: "Conciliation (Pangkat Tagapagkasundo)", arbitration: "Arbitration",
      settlement: "Settlement & Repudiation", enforcement: "Failure to Appear",
      cfa: "Certifications (CFA)", execution: "Execution", reporting: "Reporting",
    };
    const previewFields: Record<number, { label: string; lines?: number }[]> = {
      7:  [{ label: "Name of Complainant" }, { label: "Address" }, { label: "Contact Number" }, { label: "Name of Respondent" }, { label: "Address of Respondent" }, { label: "Nature of Complaint / Cause of Action", lines: 4 }, { label: "Relief Sought", lines: 2 }, { label: "Date of Filing" }],
      8:  [{ label: "To (Complainant Name)" }, { label: "Address" }, { label: "Case Number" }, { label: "You are hereby notified that a hearing is set on:" }, { label: "Date" }, { label: "Time" }, { label: "Venue" }, { label: "Punong Barangay (Presiding Officer)" }],
      9:  [{ label: "To (Respondent Name)" }, { label: "Address" }, { label: "Case Number" }, { label: "You are hereby summoned to appear on:" }, { label: "Date" }, { label: "Time" }, { label: "Venue" }, { label: "Failure to appear: monetary penalty applies" }],
      16: [{ label: "Case Number" }, { label: "Complainant" }, { label: "Respondent" }, { label: "Terms of Settlement", lines: 5 }, { label: "Repudiation Deadline (10 days from)" }, { label: "Signature of Complainant" }, { label: "Signature of Respondent" }, { label: "Attested by: Lupon/Pangkat Secretary" }, { label: "Witnessed by: Punong Barangay" }],
      20: [{ label: "Case Number" }, { label: "Complainant" }, { label: "Respondent" }, { label: "This certifies that the dispute was not settled after mediation and conciliation." }, { label: "Reason for Failure", lines: 3 }, { label: "The parties may now file the case in court." }, { label: "Lupon Secretary" }, { label: "Date" }],
      22: [{ label: "Case Number" }, { label: "Complainant" }, { label: "Respondent" }, { label: "This certifies that the dispute has been brought to the Lupong Tagapamayapa for conciliation." }, { label: "Issued to party: Complainant / Respondent" }, { label: "Punong Barangay" }, { label: "Date" }],
    };
    const fields = previewFields[form.number] ?? [
      { label: "Case Number" }, { label: "Complainant" }, { label: "Respondent" },
      { label: "Relevant Details", lines: 3 }, { label: "Authorized Signatory" }, { label: "Date" },
    ];
    return (
      <div className="bg-white dark:bg-slate-50 text-slate-900 rounded-xl border-2 border-slate-300 p-8 space-y-4 font-serif text-sm">
        <div className="text-center space-y-0.5 pb-4 border-b-2 border-slate-400">
          <p className="text-[10px] font-sans uppercase tracking-widest text-slate-500">Republic of the Philippines</p>
          <p className="text-[10px] font-sans uppercase tracking-widest text-slate-500">Province / City / Municipality of ___________________</p>
          <p className="text-[10px] font-sans uppercase tracking-widest text-slate-500">Barangay ___________________</p>
          <div className="mt-2">
            <span className="text-[10px] font-sans font-bold bg-slate-800 text-white px-3 py-0.5 rounded uppercase tracking-wider">
              KP Form No. {form.number}
            </span>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2 uppercase tracking-wide">{form.name}</p>
          <p className="text-[11px] font-sans text-slate-500">({stageLabel[form.stage]} — Katarungang Pambarangay)</p>
        </div>
        <div className="space-y-4 pt-2">
          {fields.map((field, i) => (
            <div key={i}>
              <p className="text-[11px] font-sans font-semibold text-slate-600 uppercase tracking-wide mb-1">{field.label}</p>
              {field.lines ? (
                <div className="space-y-1.5">
                  {Array.from({ length: field.lines }).map((_, li) => (
                    <div key={li} className="border-b border-slate-300 h-6" />
                  ))}
                </div>
              ) : (
                <div className="border-b border-slate-400 h-6" />
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] font-sans text-slate-400 text-center pt-4 border-t border-slate-200">
          Sample template — Katarungang Pambarangay Form #{form.number} per RA 7160
        </p>
      </div>
    );
  }, [reviewFormNumber]);
  const [complainantMode, setComplainantMode] = useState<"individual" | "group">("individual");
  const [respondentMode, setRespondentMode] = useState<"individual" | "group">("individual");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const pageSize = 15;

  // Toast system
  const [toasts, setToasts] = useState<{ id: number; message: string; type?: string }[]>([]);
  const addToast = useCallback((message: string, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch cases
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.kpCases.list({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        case_level: levelFilter || undefined,
        filing_date_from: dateFrom || undefined,
        filing_date_to: dateTo || undefined,
        page,
        per_page: pageSize,
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      setCases(res.data);
      setTotalPages(res.last_page);
      setTotalCount(res.total);
    } catch {
      addToast("Failed to load cases", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, levelFilter, dateFrom, dateTo, sortBy, sortDir, page, addToast]);

  // Fetch stats — per current year
  const currentYear = new Date().getFullYear();
  const fetchStats = useCallback(async () => {
    try {
      const s = await api.kpCases.stats(currentYear);
      setStats(s);
    } catch { /* silent */ }
  }, [currentYear]);

  useEffect(() => { fetchCases(); }, [fetchCases]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, levelFilter]);

  // View case detail
  const openViewCase = useCallback(async (id: string) => {
    setViewLoading(true);
    try {
      const [caseRes, smsRes, actRes] = await Promise.all([
        api.kpCases.show(id),
        api.kpCases.smsHistory(id).catch(() => ({ data: [] })),
        api.kpCases.activity(id).catch(() => ({ data: [] })),
      ]);
      setViewCase(caseRes.kp_case);
      setCaseSmsHistory(smsRes.data ?? []);
      setCaseActivity(actRes.data ?? []);
    } catch {
      addToast("Failed to load case details", "error");
    } finally {
      setViewLoading(false);
    }
  }, [addToast]);

  const emptyForm: Record<string, string> = {
    nature: "", nature_of_complaint: "", rpc_article: "", filing_date: new Date().toISOString().split("T")[0],
    case_description: "", remarks: "",
    complainant_first_name: "", complainant_middle_name: "", complainant_last_name: "",
    complainant_names: "", complainant_contact: "", complainant_address: "",
    respondent_first_name: "", respondent_middle_name: "", respondent_last_name: "",
    respondent_names: "", respondent_contact: "", respondent_address: "",
  };

  const openFileCase = () => {
    setForm({ ...emptyForm });
    setComplainantMode("individual");
    setRespondentMode("individual");
    setFormTab(0);
    setFormErrors({});
    setShowFileCase(true);
  };

  const openEditCase = async (c: KpCaseListItem) => {
    try {
      const res = await api.kpCases.show(c.id);
      const kp = res.kp_case;
      const complainants = (kp.parties || []).filter((p) => p.party_type === "complainant");
      const respondents  = (kp.parties || []).filter((p) => p.party_type === "respondent");
      const cMode = (complainants[0]?.party_mode as "individual" | "group") || "individual";
      const rMode = (respondents[0]?.party_mode  as "individual" | "group") || "individual";
      setComplainantMode(cMode);
      setRespondentMode(rMode);
      setForm({
        nature: kp.nature || "",
        nature_of_complaint: kp.nature_of_complaint || "",
        rpc_article: kp.rpc_article || "",
        filing_date: kp.filing_date?.split("T")[0] || "",
        case_description: kp.case_description || "",
        remarks: kp.remarks || "",
        complainant_first_name: complainants[0]?.first_name || "",
        complainant_middle_name: complainants[0]?.middle_name || "",
        complainant_last_name: complainants[0]?.last_name || "",
        complainant_names: cMode === "group" ? complainants.map((p) => p.full_name).join(", ") : "",
        complainant_contact: complainants[0]?.mobile_number || "",
        complainant_address: complainants[0]?.address || "",
        respondent_first_name: respondents[0]?.first_name || "",
        respondent_middle_name: respondents[0]?.middle_name || "",
        respondent_last_name: respondents[0]?.last_name || "",
        respondent_names: rMode === "group" ? respondents.map((p) => p.full_name).join(", ") : "",
        respondent_contact: respondents[0]?.mobile_number || "",
        respondent_address: respondents[0]?.address || "",
      });
      setEditCaseId(c.id);
      setFormTab(0);
      setFormErrors({});
      setShowEdit(true);
    } catch {
      addToast("Failed to load case for editing", "error");
    }
  };

  const openEditFromView = (kp: KpCaseDetail) => {
    const complainants = (kp.parties || []).filter((p) => p.party_type === "complainant");
    const respondents  = (kp.parties || []).filter((p) => p.party_type === "respondent");
    const cMode = (complainants[0]?.party_mode as "individual" | "group") || "individual";
    const rMode = (respondents[0]?.party_mode  as "individual" | "group") || "individual";
    setComplainantMode(cMode);
    setRespondentMode(rMode);
    setForm({
      nature: kp.nature || "",
      nature_of_complaint: kp.nature_of_complaint || "",
      rpc_article: kp.rpc_article || "",
      filing_date: kp.filing_date?.split("T")[0] || "",
      case_description: kp.case_description || "",
      remarks: kp.remarks || "",
      complainant_first_name: complainants[0]?.first_name || "",
      complainant_middle_name: complainants[0]?.middle_name || "",
      complainant_last_name: complainants[0]?.last_name || "",
      complainant_names: cMode === "group" ? complainants.map((p) => p.full_name).join(", ") : "",
      complainant_contact: complainants[0]?.mobile_number || "",
      complainant_address: complainants[0]?.address || "",
      respondent_first_name: respondents[0]?.first_name || "",
      respondent_middle_name: respondents[0]?.middle_name || "",
      respondent_last_name: respondents[0]?.last_name || "",
      respondent_names: rMode === "group" ? respondents.map((p) => p.full_name).join(", ") : "",
      respondent_contact: respondents[0]?.mobile_number || "",
      respondent_address: respondents[0]?.address || "",
    });
    setEditCaseId(kp.id);
    setFormTab(0);
    setFormErrors({});
    setViewCase(null);
    setShowEdit(true);
  };

const closeFormModal = () => {
    setShowFileCase(false);
    setShowEdit(false);
    setEditCaseId(null);
    setComplainantMode("individual");
    setRespondentMode("individual");
  };

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.nature?.trim()) errors.nature = "Nature is required";
    if (!form.nature_of_complaint?.trim()) errors.nature_of_complaint = "Case type is required";
    if (!form.filing_date?.trim()) errors.filing_date = "Filing date is required";

    // Complainant
    if (complainantMode === "individual") {
      if (!form.complainant_first_name?.trim()) errors.complainant_first_name = "First name is required";
      if (!form.complainant_last_name?.trim()) errors.complainant_last_name = "Last name is required";
    } else {
      if (!form.complainant_names?.trim()) errors.complainant_names = "Group names are required";
    }

    // Respondent
    if (respondentMode === "individual") {
      if (!form.respondent_first_name?.trim()) errors.respondent_first_name = "First name is required";
      if (!form.respondent_last_name?.trim()) errors.respondent_last_name = "Last name is required";
    } else {
      if (!form.respondent_names?.trim()) errors.respondent_names = "Group names are required";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.nature || errors.nature_of_complaint || errors.filing_date) setFormTab(0);
      else setFormTab(1);
      return false;
    }
    return true;
  };

  const handleSaveCase = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nature: form.nature,
        nature_of_complaint: form.nature_of_complaint,
        rpc_article: form.rpc_article || null,
        filing_date: form.filing_date,
        case_description: form.case_description || null,
        remarks: form.remarks || null,
        ...(!showEdit && { status: "filed", case_level: "mediation" }),
      };

      let caseId: string;

      if (showEdit && editCaseId) {
        const res = await api.kpCases.update(editCaseId, payload);
        caseId = res.kp_case.id;
        addToast("Case updated");
      } else {
        const res = await api.kpCases.create(payload);
        caseId = res.kp_case.id;

        // Add complainant party
        if (complainantMode === "individual") {
          await api.kpCases.addParty({
            case_id: caseId,
            party_type: "complainant",
            party_mode: "individual",
            first_name: form.complainant_first_name.trim().toUpperCase(),
            middle_name: form.complainant_middle_name?.trim().toUpperCase() || undefined,
            last_name: form.complainant_last_name.trim().toUpperCase(),
            address: form.complainant_address || undefined,
            mobile_number: form.complainant_contact || undefined,
          });
        } else {
          // Group: one party record for the whole group
          await api.kpCases.addParty({
            case_id: caseId,
            party_type: "complainant",
            party_mode: "group",
            full_name: form.complainant_names.trim().toUpperCase(),
            address: form.complainant_address || undefined,
            mobile_number: form.complainant_contact || undefined,
          });
        }

        // Add respondent party
        if (respondentMode === "individual") {
          await api.kpCases.addParty({
            case_id: caseId,
            party_type: "respondent",
            party_mode: "individual",
            first_name: form.respondent_first_name.trim().toUpperCase(),
            middle_name: form.respondent_middle_name?.trim().toUpperCase() || undefined,
            last_name: form.respondent_last_name.trim().toUpperCase(),
            address: form.respondent_address || undefined,
            mobile_number: form.respondent_contact || undefined,
          });
        } else {
          await api.kpCases.addParty({
            case_id: caseId,
            party_type: "respondent",
            party_mode: "group",
            full_name: form.respondent_names.trim().toUpperCase(),
            address: form.respondent_address || undefined,
            mobile_number: form.respondent_contact || undefined,
          });
        }
        addToast("Case filed successfully");
      }

      closeFormModal();
      fetchCases();
      fetchStats();
    } catch (err) {
      addToast((err as { message?: string })?.message || "Failed to save case", "error");
    } finally {
      setSaving(false);
    }
  };

const handleScheduleHearing = async () => {
    if (!viewCase || !hearingForm.date) return;
    setSaving(true);
    try {
      await api.kpCases.addHearing({
        case_id: viewCase.id,
        hearing_type: hearingForm.hearing_type || viewCase.case_level,
        hearing_date: hearingForm.date,
        hearing_time: hearingForm.time || undefined,
        venue: hearingForm.venue || undefined,
        minutes: hearingForm.notes || undefined,
      });
      addToast(`Hearing scheduled (KP Form #${viewCase.case_level === "mediation" ? "8" : "12"})`);
      setShowScheduleHearing(false);
      fetchCases();
      // Refresh detail if open
      if (viewCase) openViewCase(viewCase.id);
    } catch (err) {
      addToast((err as { message?: string })?.message || "Failed to schedule hearing", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!viewCase || !statusForm.status) return;
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        status: statusForm.status,
        remarks: statusForm.remarks || null,
      };

      // Auto-set case_level and deadlines based on status
      if (statusForm.status === "mediation") {
        updateData.case_level = "mediation";
        // 15-day mediation deadline from today
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 15);
        updateData.mediation_deadline = deadline.toISOString().split("T")[0];
        updateData.first_meeting_date = new Date().toISOString().split("T")[0];
      } else if (statusForm.status === "conciliation") {
        updateData.case_level = "conciliation";
        // 15-day conciliation deadline
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 15);
        updateData.conciliation_deadline = deadline.toISOString().split("T")[0];
        updateData.pangkat_constituted_date = new Date().toISOString().split("T")[0];
      } else if (statusForm.status === "arbitration") {
        updateData.case_level = "arbitration";
      } else if (statusForm.status === "settled") {
        updateData.settlement_date = new Date().toISOString().split("T")[0];
        // 10-day repudiation deadline
        const repDeadline = new Date();
        repDeadline.setDate(repDeadline.getDate() + 10);
        updateData.repudiation_deadline = repDeadline.toISOString().split("T")[0];
      } else if (statusForm.status === "cfa_issued") {
        updateData.certification_to_file_action = true;
        updateData.cfa_date = new Date().toISOString().split("T")[0];
        updateData.cfa_reason = statusForm.remarks || null;
      }

      await api.kpCases.update(viewCase.id, updateData);
      addToast("Status updated");
      setShowUpdateStatus(false);
      fetchCases();
      fetchStats();
      if (viewCase) openViewCase(viewCase.id);
    } catch (err) {
      addToast((err as { message?: string })?.message || "Failed to update status", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSendCaseSms = async () => {
    if (!viewCase || !smsCaseForm.message.trim()) return;
    setSmsSending(true);
    try {
      const res = await api.kpCases.sendSms(viewCase.id, smsCaseForm);
      addToast(res.message, "success");
      setShowSendSms(false);
      setSmsCaseForm({ recipient: "complainant", message: "" });
      // Refresh SMS history
      const smsRes = await api.kpCases.smsHistory(viewCase.id).catch(() => ({ data: [] }));
      setCaseSmsHistory(smsRes.data ?? []);
    } catch (err) {
      addToast((err as { message?: string })?.message || "Failed to send SMS", "error");
    } finally {
      setSmsSending(false);
    }
  };

  const formTabs = ["Case Info", "Parties", "Details"];

  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormCombobox label="Nature" value={form.nature || ""} onChange={(v) => updateForm("nature", v)} options={NATURE_OPTIONS} required error={formErrors.nature} />
            <FormInput label="Date Filed" value={form.filing_date || ""} onChange={(v) => updateForm("filing_date", v)} type="date" required error={formErrors.filing_date} />
          </div>
          <FormCombobox label="Type of Case / Complaint" value={form.nature_of_complaint || ""} onChange={(v) => updateForm("nature_of_complaint", v)} options={CASE_TYPE_OPTIONS} required error={formErrors.nature_of_complaint} />
          <FormInput label="RPC Article (if criminal)" value={form.rpc_article || ""} onChange={(v) => updateForm("rpc_article", v)} placeholder="e.g. Art. 266, Art. 155" />
        </div>
      );
      case 1: return (
        <div className="space-y-5">

          {/* ── Complainant ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Complainant <span className="text-muted-foreground font-normal text-xs">(Nagrereklamo)</span>
              </h4>
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-800 border border-slate-600">
                {(["individual", "group"] as const).map((m) => (
                  <button key={m} type="button"
                    onClick={() => { setComplainantMode(m); setFormErrors((e) => { const n = { ...e }; delete n.complainant_first_name; delete n.complainant_last_name; delete n.complainant_names; return n; }); }}
                    className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-all",
                      complainantMode === m
                        ? "text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200")}
                    style={complainantMode === m ? { background: "var(--accent-primary)" } : undefined}>
                    {m === "individual" ? "Individual" : "Group"}
                  </button>
                ))}
              </div>
            </div>

            {complainantMode === "individual" ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <FormInput label="First Name" required value={form.complainant_first_name || ""} onChange={(v) => updateForm("complainant_first_name", v.toUpperCase())} placeholder="JUAN" error={formErrors.complainant_first_name} />
                  <FormInput label="Middle Name" value={form.complainant_middle_name || ""} onChange={(v) => updateForm("complainant_middle_name", v.toUpperCase())} placeholder="DELA" />
                  <FormInput label="Last Name" required value={form.complainant_last_name || ""} onChange={(v) => updateForm("complainant_last_name", v.toUpperCase())} placeholder="SANTOS" error={formErrors.complainant_last_name} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Contact Number" value={form.complainant_contact || ""} onChange={(v) => updateForm("complainant_contact", v)} placeholder="09XXXXXXXXX" maxLength={11} digitsOnly />
                  <FormInput label="Complete Address" value={form.complainant_address || ""} onChange={(v) => updateForm("complainant_address", v)} placeholder="Purok 1, Brgy. San Jose" />
                </div>
              </>
            ) : (
              <>
                <FormInput label="Names (comma-separated)" required value={form.complainant_names || ""} onChange={(v) => updateForm("complainant_names", v.toUpperCase())} placeholder="JUAN SANTOS, MARIA DELA CRUZ, et al." error={formErrors.complainant_names} />
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Contact Number" value={form.complainant_contact || ""} onChange={(v) => updateForm("complainant_contact", v)} placeholder="09XXXXXXXXX" maxLength={11} digitsOnly />
                  <FormInput label="Complete Address" value={form.complainant_address || ""} onChange={(v) => updateForm("complainant_address", v)} placeholder="Purok 1, Brgy. San Jose" />
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border" />

          {/* ── Respondent ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Respondent <span className="text-muted-foreground font-normal text-xs">(Inirereklamo)</span>
              </h4>
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-800 border border-slate-600">
                {(["individual", "group"] as const).map((m) => (
                  <button key={m} type="button"
                    onClick={() => { setRespondentMode(m); setFormErrors((e) => { const n = { ...e }; delete n.respondent_first_name; delete n.respondent_last_name; delete n.respondent_names; return n; }); }}
                    className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-all",
                      respondentMode === m
                        ? "text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200")}
                    style={respondentMode === m ? { background: "var(--accent-primary)" } : undefined}>
                    {m === "individual" ? "Individual" : "Group"}
                  </button>
                ))}
              </div>
            </div>

            {respondentMode === "individual" ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <FormInput label="First Name" required value={form.respondent_first_name || ""} onChange={(v) => updateForm("respondent_first_name", v.toUpperCase())} placeholder="PEDRO" error={formErrors.respondent_first_name} />
                  <FormInput label="Middle Name" value={form.respondent_middle_name || ""} onChange={(v) => updateForm("respondent_middle_name", v.toUpperCase())} placeholder="GARCIA" />
                  <FormInput label="Last Name" required value={form.respondent_last_name || ""} onChange={(v) => updateForm("respondent_last_name", v.toUpperCase())} placeholder="REYES" error={formErrors.respondent_last_name} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Contact Number" value={form.respondent_contact || ""} onChange={(v) => updateForm("respondent_contact", v)} placeholder="09XXXXXXXXX" maxLength={11} digitsOnly />
                  <FormInput label="Complete Address" value={form.respondent_address || ""} onChange={(v) => updateForm("respondent_address", v)} placeholder="Purok 2, Brgy. San Jose" />
                </div>
              </>
            ) : (
              <>
                <FormInput label="Names (comma-separated)" required value={form.respondent_names || ""} onChange={(v) => updateForm("respondent_names", v.toUpperCase())} placeholder="PEDRO REYES, ANTONIO GARCIA, et al." error={formErrors.respondent_names} />
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Contact Number" value={form.respondent_contact || ""} onChange={(v) => updateForm("respondent_contact", v)} placeholder="09XXXXXXXXX" maxLength={11} digitsOnly />
                  <FormInput label="Complete Address" value={form.respondent_address || ""} onChange={(v) => updateForm("respondent_address", v)} placeholder="Purok 2, Brgy. San Jose" />
                </div>
              </>
            )}
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <p className="text-[11px] text-amber-700 dark:text-amber-400">Individual names are automatically matched against registered residents upon filing. A red flag will appear on their profile if a match is found.</p>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <FormTextarea label="Brief Description / Facts of the Case (Mga Pangyayari)" value={form.case_description || ""} onChange={(v) => updateForm("case_description", v)} rows={4} placeholder="Ilarawan ang mga pangyayari at sirkumstansya ng reklamo..." />
          <FormTextarea label="Notes / Remarks" value={form.remarks || ""} onChange={(v) => updateForm("remarks", v)} rows={2} placeholder="Anumang karagdagang tala..." />
        </div>
      );
      default: return null;
    }
  };

  // ── Mabini AI insight text ──
  const mabiniInsight = useMemo(() => {
    if (!stats) return "Loading case insights...";
    const parts: string[] = [];
    if (stats.total === 0) return "No KP cases filed yet. When residents file disputes, they will appear here for mediation and conciliation per RA 7160.";
    const rate = stats.total > 0 ? Math.round((stats.settled / stats.total) * 100) : 0;
    parts.push(`Settlement rate: ${rate}%.`);
    if (stats.overdue_mediation > 0) parts.push(`${stats.overdue_mediation} case(s) past 15-day mediation deadline -- consider escalating to Pangkat (conciliation).`);
    if (stats.overdue_conciliation > 0) parts.push(`${stats.overdue_conciliation} case(s) past conciliation deadline -- issue CFA (KP Form #21).`);
    if (stats.mediation > 0) parts.push(`${stats.mediation} in mediation.`);
    if (stats.conciliation > 0) parts.push(`${stats.conciliation} in conciliation.`);
    return parts.join(" ");
  }, [stats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Katarungang Pambarangay Cases"
        description="Manage KP case records, hearings, and settlements per RA 7160"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Judicial" }, { label: "KP Cases" }]}
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI -- Katarungang Pambarangay Insights</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{mabiniInsight}</p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      {/* Stat Cards */}
      {(() => {
        const pct = (n: number) => stats && stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;
        const totalOverdue = (stats?.overdue_mediation ?? 0) + (stats?.overdue_conciliation ?? 0);
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Case Summary</p>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">

              {/* Total Cases */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <Scale className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">{stats?.year ?? currentYear}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.total ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Cases Filed</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Active</span><span className="font-medium text-foreground">{pct(stats?.active ?? 0)}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct(stats?.active ?? 0)}%` }} />
                  </div>
                </div>
              </div>

              {/* Active Cases */}
              <div className={cn("relative overflow-hidden rounded-xl border bg-card p-4 flex flex-col gap-3", totalOverdue > 0 ? "border-amber-400/60" : "border-border")}>
                <div className="flex items-start justify-between">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", totalOverdue > 0 ? "bg-amber-50 dark:bg-amber-950/40" : "bg-emerald-50 dark:bg-emerald-950/40")}>
                    <Gavel className={cn("h-4 w-4", totalOverdue > 0 ? "text-amber-500" : "text-emerald-500")} />
                  </div>
                  {totalOverdue > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" />{totalOverdue} overdue
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">On track</span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.active ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Active Cases</p>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="flex items-center gap-1 text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />Med: {stats?.mediation ?? 0}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />Con: {stats?.conciliation ?? 0}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />Arb: {stats?.arbitration ?? 0}</span>
                </div>
              </div>

              {/* Settled */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">{pct(stats?.settled ?? 0)}% rate</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.settled ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Settled Amicably</p>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct(stats?.settled ?? 0)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Settlement rate vs total</p>
                </div>
              </div>

              {/* CFA */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  </div>
                  {(stats?.cfa_issued ?? 0) > 0 && (
                    <span className="text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">{pct(stats?.cfa_issued ?? 0)}%</span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.cfa_issued ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Cert. to File Action</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">Dispute unresolved — parties referred to court per RA 7160 §412.</p>
              </div>

              {/* Dismissed */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <X className="h-4 w-4 text-slate-500" />
                  </div>
                  {(stats?.dismissed ?? 0) > 0 && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{pct(stats?.dismissed ?? 0)}%</span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.dismissed ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Dismissed</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">Cases closed without settlement or referral.</p>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Case Flow — RA 7160 topology: Mediation + Conciliation → Arbitration → Settled / CFA / Dismissed */}
      <div className="flex items-stretch gap-2">

        {/* Zone 1 — Entry levels */}
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Entry Levels</p>
          <button onClick={() => setStatusFilter("mediation")}
            className={cn("flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm",
              statusFilter === "mediation" ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40" : "border-border bg-card hover:bg-muted/50")}>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-semibold text-foreground">Mediation</span>
            <span className="text-[10px] text-muted-foreground">PB · 15 days</span>
            <span className="text-xs font-bold text-blue-500">{stats?.mediation ?? "—"}</span>
          </button>
          <button onClick={() => setStatusFilter("conciliation")}
            className={cn("flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm",
              statusFilter === "conciliation" ? "border-violet-400 bg-violet-50 dark:bg-violet-950/40" : "border-border bg-card hover:bg-muted/50")}>
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-[11px] font-semibold text-foreground">Conciliation</span>
            <span className="text-[10px] text-muted-foreground">Pangkat · 15–30 days</span>
            <span className="text-xs font-bold text-violet-500">{stats?.conciliation ?? "—"}</span>
          </button>
        </div>

        {/* Arrow 1 */}
        <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 pt-6">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground leading-none">either</span>
        </div>

        {/* Zone 2 — Arbitration */}
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Arbitration</p>
          <button onClick={() => setStatusFilter("arbitration")}
            className={cn("flex-1 flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm",
              statusFilter === "arbitration" ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40" : "border-border bg-card hover:bg-muted/50")}>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-semibold text-foreground">Arbitration</span>
            <span className="text-[10px] text-muted-foreground">By agreement</span>
            <span className="text-xs font-bold text-amber-500">{stats?.arbitration ?? "—"}</span>
          </button>
        </div>

        {/* Arrow 2 */}
        <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 pt-6">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground leading-none">outcome</span>
        </div>

        {/* Zone 3 — Terminal outcomes */}
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Outcomes</p>
          <button onClick={() => setStatusFilter("settled")}
            className={cn("flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all hover:shadow-sm",
              statusFilter === "settled" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" : "border-border bg-card hover:bg-muted/50")}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-foreground">Settled</span>
            <span className="text-xs font-bold text-emerald-500">{stats?.settled ?? "—"}</span>
          </button>
          <button onClick={() => setStatusFilter("cfa_issued")}
            className={cn("flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all hover:shadow-sm",
              statusFilter === "cfa_issued" ? "border-red-400 bg-red-50 dark:bg-red-950/40" : "border-border bg-card hover:bg-muted/50")}>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[11px] font-semibold text-foreground leading-tight text-center">Cert. to File Action</span>
            <span className="text-xs font-bold text-red-500">{stats?.cfa_issued ?? "—"}</span>
          </button>
          <button onClick={() => setStatusFilter("dismissed")}
            className={cn("flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all hover:shadow-sm",
              statusFilter === "dismissed" ? "border-slate-400 bg-slate-50 dark:bg-slate-800/60" : "border-border bg-card hover:bg-muted/50")}>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[11px] font-semibold text-foreground">Dismissed</span>
            <span className="text-xs font-bold text-slate-500">{stats?.dismissed ?? "—"}</span>
          </button>
        </div>

        {/* Clear filter button */}
        {statusFilter && (
          <div className="flex items-center justify-center pt-6 shrink-0">
            <button onClick={() => setStatusFilter("")} className="flex items-center justify-center w-7 h-7 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      {(() => {
        const activeFilterCount = [statusFilter, levelFilter, dateFrom, dateTo].filter(Boolean).length;
        const clearAll = () => { setStatusFilter(""); setLevelFilter(""); setDateFrom(""); setDateTo(""); setSortBy("filing_date"); setSortDir("desc"); setPage(1); };
        return (
          <div className="space-y-3">
            {/* Search row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by case number, complaint type, or party names..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring" />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setShowFilters(!showFilters)}
                  className={cn("relative flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-colors",
                    showFilters || activeFilterCount > 0 ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted text-muted-foreground")}>
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white" style={{ background: "var(--accent-primary)" }}>{activeFilterCount}</span>
                  )}
                </button>
                <button onClick={() => { setShowLibrary(true); setLibraryTab("dilg"); }} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors"><BookOpen className="h-4 w-4" /> KP Library</button>
                <button onClick={openFileCase} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> File New Case</button>
              </div>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="rounded-xl border border-border bg-card divide-y divide-border">

                {/* Status */}
                <div className="flex items-start gap-4 px-4 py-3">
                  <span className="text-[11px] font-semibold text-muted-foreground w-16 shrink-0 pt-1">Status</span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {[{ value: "", label: "All" }, ...STATUS_OPTIONS.filter((s) => s.value !== "filed" && s.value !== "closed")].map((s) => (
                      <button key={s.value} onClick={() => { setStatusFilter(s.value); setPage(1); }}
                        className={cn("px-3 py-1 text-xs font-medium rounded-lg border transition-colors",
                          statusFilter === s.value ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
                        {s.label === "Certification to File Action (CFA)" ? "CFA Issued" : s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Case Level */}
                <div className="flex items-start gap-4 px-4 py-3">
                  <span className="text-[11px] font-semibold text-muted-foreground w-16 shrink-0 pt-1">Level</span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {[{ value: "", label: "All" }, ...CASE_LEVEL_OPTIONS.map((l) => ({ value: l.value, label: l.value === "mediation" ? "Mediation (PB)" : l.value === "conciliation" ? "Conciliation (Pangkat)" : "Arbitration" }))].map((l) => (
                      <button key={l.value} onClick={() => { setLevelFilter(l.value); setPage(1); }}
                        className={cn("px-3 py-1 text-xs font-medium rounded-lg border transition-colors",
                          levelFilter === l.value ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date + Sort */}
                <div className="flex items-center gap-6 px-4 py-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Filed</span>
                    <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                    <span className="text-muted-foreground text-xs">→</span>
                    <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Sort</span>
                    <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring">
                      <option value="filing_date">Filing Date</option>
                      <option value="case_number">Case Number</option>
                      <option value="status">Status</option>
                      <option value="case_level">Case Level</option>
                      <option value="created_at">Date Entered</option>
                    </select>
                    <button onClick={() => { setSortDir((d) => d === "asc" ? "desc" : "asc"); setPage(1); }}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors shrink-0">
                      {sortDir === "desc" ? "↓ Newest" : "↑ Oldest"}
                    </button>
                    {activeFilterCount > 0 && (
                      <button onClick={clearAll} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/40 transition-colors">
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && !showFilters && (
              <div className="flex flex-wrap items-center gap-1.5">
                {statusFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-accent-bg border border-accent-primary/30 text-accent-text">
                    Status: {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ?? statusFilter}
                    <button onClick={() => { setStatusFilter(""); setPage(1); }} className="ml-0.5 hover:opacity-70"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {levelFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-accent-bg border border-accent-primary/30 text-accent-text">
                    Level: {CASE_LEVEL_OPTIONS.find((l) => l.value === levelFilter)?.label ?? levelFilter}
                    <button onClick={() => { setLevelFilter(""); setPage(1); }} className="ml-0.5 hover:opacity-70"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {(dateFrom || dateTo) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-accent-bg border border-accent-primary/30 text-accent-text">
                    Date: {dateFrom || "…"} → {dateTo || "…"}
                    <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} className="ml-0.5 hover:opacity-70"><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Case Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl glass animate-pulse" />)}</div>
        ) : cases.length === 0 ? (
          <div className="p-16 text-center rounded-xl glass">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Scale className="w-6 h-6 text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">No KP cases filed</p>
                <p className="text-xs text-muted-foreground mt-1">When residents file disputes, cases will appear here for mediation and conciliation per RA 7160.</p>
              </div>
              <button onClick={openFileCase} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>+ File New Case</button>
            </div>
          </div>
        ) : (
          cases.map((c) => {
            const complainantParties = (c.parties || []).filter((p) => p.party_type === "complainant");
            const respondentParties  = (c.parties || []).filter((p) => p.party_type === "respondent");
            const complainantName = complainantParties[0]?.full_name || "—";
            const respondentName  = respondentParties[0]?.full_name  || "—";
            const deadline = c.case_level === "mediation" ? c.mediation_deadline
              : (c.conciliation_extended_deadline || c.conciliation_deadline);
            const isSettled = ["settled", "closed", "cfa_issued", "dismissed"].includes(c.status);

            return (
              <div key={c.id}
                className="group/row px-5 py-4 rounded-xl glass hover:shadow-md hover:ring-1 hover:ring-accent-primary/20 transition-all cursor-pointer"
                onClick={() => openViewCase(c.id)}>
                <div className="flex items-start gap-4">

                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="h-4 w-4 text-accent-text" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: case number + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{c.case_number}</span>
                      {c.status !== "filed" && <StatusBadge status={c.status} />}
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        c.nature === "criminal" ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400")}>
                        {c.nature === "criminal" ? "Criminal" : "Civil"}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                        {c.case_level}
                      </span>
                      {c.certification_to_file_action && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">CFA</span>
                      )}
                    </div>

                    {/* Row 2: case type + RPC article */}
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                      {c.nature_of_complaint}
                      {c.rpc_article && <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">({c.rpc_article})</span>}
                    </p>

                    {/* Row 3: parties */}
                    <div className="flex items-center gap-1.5 mt-1.5 text-[12px]">
                      <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-foreground font-medium truncate max-w-[220px]">{complainantName}</span>
                      <span className="text-muted-foreground/60 shrink-0">vs.</span>
                      <span className="text-foreground font-medium truncate max-w-[220px]">{respondentName}</span>
                    </div>

                    {/* Row 4: deadline + settlement info */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {deadline && !isSettled && <DeadlineBadge deadline={deadline} label={c.case_level === "mediation" ? "Mediation" : "Conciliation"} />}
                      {c.settlement_date && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Settled {c.settlement_date.split("T")[0]}</span>
                      )}
                      {c.cfa_date && (
                        <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">CFA {c.cfa_date.split("T")[0]}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: meta + inline actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Filed date */}
                    <p className="text-[11px] text-muted-foreground">Filed {c.filing_date?.split("T")[0]}</p>

                    {/* Inline action icons */}
                    <div className="flex items-center gap-1">

                      {/* Edit */}
                      <div className="relative group/tip">
                        <button onClick={() => openEditCase(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                          title="Edit Case">
                          <Edit className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                        </button>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] font-medium rounded bg-slate-900 text-white whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">Edit</span>
                      </div>
                      {/* Generate Document */}
                      <div className="relative group/tip">
                        <button onClick={() => { setKpFormCase(c); setSelectedFormNumber(null); setShowKpFormModal(true); }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 transition-colors"
                          title="Generate Document">
                          <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] font-medium rounded bg-slate-900 text-white whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">Generate Document</span>
                      </div>
                      {/* Update Status */}
                      <div className="relative group/tip">
                        <button onClick={() => openViewCase(c.id).then(() => { setStatusForm({ status: c.status, remarks: "" }); setShowUpdateStatus(true); })}
                          className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 transition-colors"
                          title="Update Status">
                          <FileText className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        </button>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] font-medium rounded bg-slate-900 text-white whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">Update Status</span>
                      </div>
                      {/* Send SMS */}
                      <div className="relative group/tip">
                        <button onClick={() => { setRowSmsCase({ id: c.id, case_number: c.case_number, parties: c.parties || [] }); setShowRowSms(true); }}
                          className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 transition-colors"
                          title="Send SMS">
                          <MessageSquare className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        </button>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] font-medium rounded bg-slate-900 text-white whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">Send SMS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination — always visible when there are results */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(((page - 1) * pageSize) + 1, totalCount)}–{Math.min(page * pageSize, totalCount)} of {totalCount} case{totalCount !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-xs font-medium text-foreground">{page} / {Math.max(totalPages, 1)}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* ══ VIEW CASE MODAL ══ */}
      <Modal open={!!viewCase && !showScheduleHearing && !showUpdateStatus} onClose={() => setViewCase(null)} title={viewCase?.case_number || ""} description={viewCase?.nature_of_complaint} size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button onClick={() => setViewCase(null)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors">
              Close
            </button>
            <button onClick={() => { if (viewCase) openEditFromView(viewCase); }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              <FileText className="h-3.5 w-3.5" /> Edit Record
            </button>
          </div>
        }>
        {viewLoading ? (
          <div className="h-40 flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-accent-primary border-t-transparent rounded-full" /></div>
        ) : viewCase && (
          <div className="space-y-5">
            {/* Status + Flow */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={viewCase.status} />
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                viewCase.nature === "criminal" ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400")}>
                {viewCase.nature === "criminal" ? "Criminal" : "Civil"}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                {viewCase.case_level}
              </span>
              <CaseFlowIndicator level={viewCase.case_level} status={viewCase.status} />
            </div>

            {/* Deadlines */}
            <div className="flex flex-wrap gap-2">
              {viewCase.case_level === "mediation" && <DeadlineBadge deadline={viewCase.mediation_deadline} label="Mediation deadline" />}
              {viewCase.case_level === "conciliation" && <DeadlineBadge deadline={viewCase.conciliation_extended_deadline || viewCase.conciliation_deadline} label="Conciliation deadline" />}
              {viewCase.settlement_date && <DeadlineBadge deadline={viewCase.repudiation_deadline} label="Repudiation deadline" />}
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4">
              {/* Complainant */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Complainant / Nagrereklamo</p>
                </div>
                {(viewCase.parties || []).filter((p) => p.party_type === "complainant").map((p) => (
                  <div key={p.id} className="space-y-1">
                    {/* Individual: show separated name fields */}
                    {p.party_mode === "individual" && p.first_name ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">{p.full_name}</p>
                        <div className="flex gap-3 text-[11px] text-muted-foreground">
                          <span>First: <span className="text-foreground">{p.first_name}</span></span>
                          {p.middle_name && <span>Middle: <span className="text-foreground">{p.middle_name}</span></span>}
                          <span>Last: <span className="text-foreground">{p.last_name}</span></span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 mb-1">Group</span>
                        <p className="text-sm font-semibold text-foreground">{p.full_name}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      {p.mobile_number && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" /> {p.mobile_number}
                        </p>
                      )}
                      {p.address && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" /> {p.address}
                        </p>
                      )}
                    </div>
                    {p.resident_id && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Matched to resident
                      </span>
                    )}
                  </div>
                ))}
                {(viewCase.parties || []).filter((p) => p.party_type === "complainant").length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">No complainants recorded</p>
                )}
              </div>

              {/* Respondent */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Respondent / Inirereklamo</p>
                </div>
                {(viewCase.parties || []).filter((p) => p.party_type === "respondent").map((p) => (
                  <div key={p.id} className="space-y-1">
                    {p.party_mode === "individual" && p.first_name ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">{p.full_name}</p>
                        <div className="flex gap-3 text-[11px] text-muted-foreground">
                          <span>First: <span className="text-foreground">{p.first_name}</span></span>
                          {p.middle_name && <span>Middle: <span className="text-foreground">{p.middle_name}</span></span>}
                          <span>Last: <span className="text-foreground">{p.last_name}</span></span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 mb-1">Group</span>
                        <p className="text-sm font-semibold text-foreground">{p.full_name}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      {p.mobile_number && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" /> {p.mobile_number}
                        </p>
                      )}
                      {p.address && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" /> {p.address}
                        </p>
                      )}
                    </div>
                    {p.resident_id && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Matched to resident
                      </span>
                    )}
                  </div>
                ))}
                {(viewCase.parties || []).filter((p) => p.party_type === "respondent").length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">No respondents recorded</p>
                )}
              </div>
            </div>

            {/* Description */}
            {viewCase.case_description && (
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Description / Facts (Mga Pangyayari)</p>
                <p className="text-sm text-foreground leading-relaxed">{viewCase.case_description}</p>
              </div>
            )}

            {/* Settlement / CFA */}
            {viewCase.settlement_text && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Amicable Settlement (KP Form #16)</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-300">{viewCase.settlement_text}</p>
              </div>
            )}
            {viewCase.arbitration_award && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Arbitration Award (KP Form #15)</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{viewCase.arbitration_award}</p>
              </div>
            )}
            {viewCase.certification_to_file_action && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <p className="text-[11px] font-medium text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Certification to File Action (CFA)</p>
                <p className="text-sm text-red-800 dark:text-red-300">Issued: {viewCase.cfa_date?.split("T")[0]}</p>
                {viewCase.cfa_reason && <p className="text-sm text-red-800 dark:text-red-300 mt-1">Reason: {viewCase.cfa_reason}</p>}
              </div>
            )}

            {/* Timeline Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Date Filed</p><p className="text-sm">{viewCase.filing_date?.split("T")[0]}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Case Level</p><p className="text-sm capitalize">{viewCase.case_level}</p></div>
              {viewCase.first_meeting_date && <div><p className="text-[11px] text-muted-foreground uppercase">First Meeting</p><p className="text-sm">{viewCase.first_meeting_date?.split("T")[0]}</p></div>}
              {viewCase.pangkat_constituted_date && <div><p className="text-[11px] text-muted-foreground uppercase">Pangkat Constituted</p><p className="text-sm">{viewCase.pangkat_constituted_date?.split("T")[0]}</p></div>}
              {viewCase.settlement_date && <div><p className="text-[11px] text-muted-foreground uppercase">Settlement Date</p><p className="text-sm">{viewCase.settlement_date?.split("T")[0]}</p></div>}
              {viewCase.execution_date && <div><p className="text-[11px] text-muted-foreground uppercase">Execution Date</p><p className="text-sm">{viewCase.execution_date?.split("T")[0]}</p></div>}
            </div>

            {/* Hearings Timeline */}
            {viewCase.hearings && viewCase.hearings.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Hearing History</p>
                <div className="space-y-3">
                  {viewCase.hearings.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg glass-subtle">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        h.hearing_type === "mediation" ? "bg-blue-100 dark:bg-blue-950" : h.hearing_type === "conciliation" ? "bg-violet-100 dark:bg-violet-950" : "bg-amber-100 dark:bg-amber-950")}>
                        <Gavel className={cn("h-4 w-4",
                          h.hearing_type === "mediation" ? "text-blue-600 dark:text-blue-400" : h.hearing_type === "conciliation" ? "text-violet-600 dark:text-violet-400" : "text-amber-600 dark:text-amber-400")} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground capitalize">{h.hearing_type}</span>
                          <span className="text-[10px] text-muted-foreground">{h.hearing_date?.split("T")[0]} {h.hearing_time || ""}</span>
                          {h.outcome && <Badge variant="muted">{h.outcome}</Badge>}
                        </div>
                        {h.venue && <p className="text-[11px] text-muted-foreground mt-0.5">Venue: {h.venue}</p>}
                        {h.minutes && <p className="text-xs text-foreground mt-1">{h.minutes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            {viewCase.remarks && (
              <div className="p-4 rounded-lg glass-subtle">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Remarks</p>
                <p className="text-sm text-foreground">{viewCase.remarks}</p>
              </div>
            )}

            {/* SMS History */}
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">SMS History</p>
              {caseSmsHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No SMS sent for this case yet.</p>
              ) : (
                <div className="space-y-2">
                  {caseSmsHistory.map((sms) => (
                    <div key={sms.id} className="p-3 rounded-lg glass-subtle">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{sms.recipient_number}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${sms.status === "sent" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"}`}>{sms.status}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(sms.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                      <p className="text-xs text-foreground leading-snug">{sms.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{sms.segments} segment{sms.segments !== 1 ? "s" : ""} · ₱{Number(sms.cost).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activities */}
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Activities</p>
              {caseActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No activity recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {caseActivity.map((log) => {
                    const META: Record<string, { label: string; color: string }> = {
                      created:            { label: "Case Filed",          color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" },
                      updated:            { label: "Record Updated",      color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" },
                      status_changed:     { label: "Status Changed",      color: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400" },
                      hearing_scheduled:  { label: "Hearing Scheduled",   color: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" },
                      sms_sent:           { label: "SMS Sent",            color: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400" },
                      document_generated: { label: "Document Generated",  color: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400" },
                    };
                    const meta = META[log.action] ?? { label: log.action.replace(/_/g, " "), color: "bg-muted text-muted-foreground" };
                    const userName = log.user ? `${log.user.first_name} ${log.user.last_name}` : "System";
                    const ts = new Date(log.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

                    // Build a human-readable detail line per action
                    const detail = (() => {
                      const c = log.changes as Record<string, unknown> | null;
                      if (!c) return null;
                      if (log.action === "status_changed") {
                        const s = c.status as { from: string; to: string } | undefined;
                        const r = c.remarks as { to: string } | undefined;
                        return (
                          <p className="text-[11px] text-foreground mt-1">
                            {s ? <><span className="capitalize">{s.from}</span> → <span className="capitalize font-semibold">{s.to}</span></> : null}
                            {r?.to ? <span className="text-muted-foreground"> — {r.to}</span> : null}
                          </p>
                        );
                      }
                      if (log.action === "document_generated") {
                        return <p className="text-[11px] text-foreground mt-1">KP Form #{String(c.form_number)} — {String(c.form_name)}</p>;
                      }
                      if (log.action === "hearing_scheduled") {
                        return (
                          <p className="text-[11px] text-foreground mt-1 capitalize">
                            {String(c.hearing_type)} · {String(c.hearing_date)}{c.venue ? ` · ${String(c.venue)}` : ""}
                          </p>
                        );
                      }
                      if (log.action === "sms_sent") {
                        return <p className="text-[11px] text-foreground mt-1">To: {String(c.recipient)} · {String(c.segments)} segment(s)</p>;
                      }
                      // generic updated — show changed fields
                      const entries = Object.entries(c).slice(0, 4);
                      if (entries.length === 0) return null;
                      return (
                        <div className="mt-1 space-y-0.5">
                          {entries.map(([k, v]) => (
                            <p key={k} className="text-[10px] text-muted-foreground">
                              <span className="font-medium text-foreground">{k.replace(/_/g, " ")}</span>
                              {typeof v === "object" && v !== null && "from" in (v as object)
                                ? `: ${String((v as {from:unknown;to:unknown}).from)} → ${String((v as {from:unknown;to:unknown}).to)}`
                                : `: ${JSON.stringify(v)}`}
                            </p>
                          ))}
                        </div>
                      );
                    })();

                    return (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg glass-subtle">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 mt-2" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">by <span className="font-medium text-foreground">{userName}</span></span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{ts}</span>
                          </div>
                          {detail}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ══ SEND SMS MODAL ══ */}
      <Modal open={showSendSms} onClose={() => setShowSendSms(false)} title="Send SMS" description={viewCase ? `${viewCase.case_number} — notify a party` : ""} size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowSendSms(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleSendCaseSms} disabled={smsSending || !smsCaseForm.message.trim()}>
              {smsSending ? "Sending..." : "Send SMS"}
            </ModalButton>
          </>
        }>
        <div className="space-y-4">
          <FormSelect label="Recipient" value={smsCaseForm.recipient} onChange={(v) => setSmsCaseForm((p) => ({ ...p, recipient: v }))}
            options={[
              { value: "complainant", label: "Complainant (Nagrereklamo)" },
              { value: "respondent", label: "Respondent (Inireklamo)" },
              { value: "both", label: "Both Parties" },
            ]} required />
          <FormTextarea label="Message" value={smsCaseForm.message} onChange={(v) => setSmsCaseForm((p) => ({ ...p, message: v }))} rows={4} placeholder="I-type ang mensahe..." />
          <p className="text-[10px] text-muted-foreground">SMS credits will be deducted from your barangay balance.</p>
        </div>
      </Modal>

      {/* ══ ROW SMS MODAL ══ */}
      {showRowSms && rowSmsCase && typeof window !== "undefined" && createPortal(
        <KpSmsModal
          caseNumber={rowSmsCase.case_number}
          parties={rowSmsCase.parties}
          caseId={rowSmsCase.id}
          creditBalance={user?.barangay?.sms_credit_balance != null ? parseFloat(String(user.barangay.sms_credit_balance)) : null}
          onClose={() => { setShowRowSms(false); setRowSmsCase(null); }}
        />,
        document.body
      )}

      {/* ══ FILE / EDIT CASE MODAL ══ */}
      <Modal open={showFileCase || showEdit} onClose={closeFormModal} title={showEdit ? "Edit KP Case" : "File New KP Case"} description={showEdit ? "Update case record" : "Complainant's Form -- Katarungang Pambarangay"} size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {formTab > 0 ? (
                <button onClick={() => setFormTab((t) => t - 1)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              ) : (
                <button onClick={closeFormModal}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {formTab > 0 && (
                <button onClick={closeFormModal} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted">
                  Cancel
                </button>
              )}
              {formTab < formTabs.length - 1 ? (
                <button onClick={() => setFormTab((t) => t + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSaveCase} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : showEdit ? "Update Case" : "File Case"}
                </button>
              )}
            </div>
          </div>
        }>
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors",
                formTab === i ? "bg-accent-bg text-accent-text" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold mr-1.5"
                style={formTab === i ? { background: "var(--accent-primary)", color: "#fff" } : { background: "var(--muted)", color: "var(--muted-foreground)" }}>
                {i + 1}
              </span>
              {tab}
            </button>
          ))}
        </div>
        {renderFormTab()}
      </Modal>

      {/* ══ SCHEDULE HEARING MODAL ══ */}
      <Modal open={showScheduleHearing} onClose={() => setShowScheduleHearing(false)} title="Schedule Hearing" description={viewCase ? `${viewCase.case_number} -- ${viewCase.nature_of_complaint}` : ""} size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowScheduleHearing(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleScheduleHearing} disabled={saving || !hearingForm.date}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Schedule"}
            </ModalButton>
          </>
        }>
        <div className="space-y-4">
          <FormSelect label="Hearing Type" value={hearingForm.hearing_type} onChange={(v) => setHearingForm((p) => ({ ...p, hearing_type: v }))} options={CASE_LEVEL_OPTIONS} required />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Hearing Date" value={hearingForm.date} onChange={(v) => setHearingForm((p) => ({ ...p, date: v }))} type="date" required />
            <FormInput label="Time" value={hearingForm.time} onChange={(v) => setHearingForm((p) => ({ ...p, time: v }))} type="time" />
          </div>
          <FormInput label="Venue" value={hearingForm.venue} onChange={(v) => setHearingForm((p) => ({ ...p, venue: v }))} placeholder="e.g. Barangay Hall" />
          <FormTextarea label="Notes" value={hearingForm.notes} onChange={(v) => setHearingForm((p) => ({ ...p, notes: v }))} rows={2} placeholder="Hearing agenda or notes..." />
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <p className="text-[11px] text-blue-700 dark:text-blue-400">
              {hearingForm.hearing_type === "mediation" ? "KP Form #8 (Notice of Hearing) + KP Form #9 (Summons) will be generated." :
                hearingForm.hearing_type === "conciliation" ? "KP Form #12 (Notice of Hearing for Conciliation) will be generated." :
                "Arbitration hearing per KP Form #14 (Agreement for Arbitration)."}
            </p>
          </div>
        </div>
      </Modal>

      {/* ══ GENERATE KP DOCUMENT MODAL ══ */}
      <Modal
        open={showKpFormModal}
        onClose={() => setShowKpFormModal(false)}
        title="Generate KP Document"
        description={kpFormCase ? `${kpFormCase.case_number} — ${kpFormCase.nature_of_complaint}` : ""}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button onClick={() => setShowKpFormModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              Cancel
            </button>
            <button
              disabled={selectedFormNumber === null}
              onClick={() => {
                if (!selectedFormNumber || !kpFormCase) return;
                const form = KP_FORMS.find((f) => f.number === selectedFormNumber);
                const html = generateKpFormHtml(selectedFormNumber, kpFormCase, user?.barangay);
                const w = window.open("", "_blank");
                if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
                // Log to audit trail — fire and forget
                if (form) {
                  api.kpCases.logDocument(kpFormCase.id, selectedFormNumber, form.name)
                    .catch(() => null);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
                selectedFormNumber !== null
                  ? "text-white"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
              style={selectedFormNumber !== null ? { background: "var(--accent-primary)" } : undefined}
            >
              <Printer className="w-4 h-4" />
              Generate &amp; Print
            </button>
          </div>
        }
      >
        {kpFormCase && (
          <div className="space-y-4">
            {/* Status context */}
            <div className="flex items-center gap-2 p-3 rounded-lg glass-subtle">
              <span className="text-xs text-muted-foreground">Showing forms for:</span>
              <StatusBadge status={kpFormCase.status} />
              <span className="text-xs text-muted-foreground capitalize">({kpFormCase.case_level})</span>
            </div>

            {/* Form cards */}
            <div className="grid grid-cols-2 gap-3">
              {(KP_FORMS_BY_STATUS[kpFormCase.status] ?? KP_FORMS_BY_STATUS[kpFormCase.case_level] ?? []).map((num) => {
                const f = KP_FORMS.find((x) => x.number === num);
                if (!f) return null;
                const selected = selectedFormNumber === num;
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedFormNumber(selected ? null : num)}
                    className={cn(
                      "relative text-left p-3 rounded-xl border-2 transition-all group",
                      selected
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-muted/40"
                    )}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </span>
                    )}
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", selected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                      KP Form #{num}
                    </p>
                    <p className={cn("text-xs font-semibold leading-snug", selected ? "text-emerald-800 dark:text-emerald-200" : "text-foreground")}>
                      {f.name}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedFormNumber && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  KP Form #{selectedFormNumber} — <strong>{KP_FORMS.find((f) => f.number === selectedFormNumber)?.name}</strong> will be generated with case data pre-filled. A print dialog will open in a new tab.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══ UPDATE STATUS MODAL ══ */}
      <Modal open={showUpdateStatus} onClose={() => setShowUpdateStatus(false)} title="Update Case Status" description={viewCase ? `${viewCase.case_number} -- ${viewCase.nature_of_complaint}` : ""} size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <button onClick={() => setShowUpdateStatus(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              Cancel
            </button>
            <ModalButton variant="primary" onClick={handleUpdateStatus} disabled={saving || !statusForm.status}>
              {saving ? "Saving..." : "Update Status"}
            </ModalButton>
          </div>
        }>
        <div className="space-y-4">
          {viewCase && (
            <div className="flex items-center gap-2 p-3 rounded-lg glass-subtle">
              <span className="text-xs text-muted-foreground">Current:</span>
              <StatusBadge status={viewCase.status} />
              <span className="text-xs text-muted-foreground capitalize">({viewCase.case_level})</span>
            </div>
          )}
          <FormSelect label="New Status" value={statusForm.status} onChange={(v) => setStatusForm((p) => ({ ...p, status: v }))} options={STATUS_OPTIONS.filter((s) => s.value !== "filed" && s.value !== "closed").map((s) => ({ value: s.value, label: s.label }))} required />
          <FormTextarea label="Remarks / Reason" value={statusForm.remarks} onChange={(v) => setStatusForm((p) => ({ ...p, remarks: v }))} rows={3} placeholder="Reason for status change..." />
          {statusForm.status === "mediation" && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <p className="text-[11px] text-blue-700 dark:text-blue-400">Punong Barangay has 15 days to mediate. Deadline auto-calculated.</p>
            </div>
          )}
          {statusForm.status === "conciliation" && (
            <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
              <p className="text-[11px] text-violet-700 dark:text-violet-400">Pangkat Tagapagkasundo constituted. 15 days (extendable to 30) for conciliation. KP Form #10 generated.</p>
            </div>
          )}
          {statusForm.status === "settled" && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Amicable Settlement (KP Form #16). 10-day repudiation period starts. Executory after 10 days.</p>
            </div>
          )}
          {statusForm.status === "cfa_issued" && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <p className="text-[11px] text-red-700 dark:text-red-400">Certification to File Action issued (KP Form #20/21/22). Case may now be filed in court.</p>
            </div>
          )}
        </div>
      </Modal>



      {/* ══ KP REFERENCE LIBRARY MODAL ══ */}
      <Modal open={showLibrary} onClose={() => { setShowLibrary(false); setReviewFormNumber(null); }} title="KP Reference Library" description="Official references for Katarungang Pambarangay proceedings" size="xl"
        footer={<ModalButton variant="secondary" onClick={() => { setShowLibrary(false); setReviewFormNumber(null); }}>Close</ModalButton>}>
        {/* Tab Selector -- Book Covers */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => setLibraryTab("dilg")}
            className={cn("relative p-5 rounded-xl border-2 text-left transition-all group",
              libraryTab === "dilg" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md" : "border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/10")}>
            <div className="flex items-start gap-3">
              <div className={cn("w-12 h-14 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                libraryTab === "dilg" ? "bg-blue-500 text-white" : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400")}>
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", libraryTab === "dilg" ? "text-blue-700 dark:text-blue-300" : "text-foreground")}>DILG KP Handbook</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Katarungang Pambarangay: A Handbook (Philippines-Canada LGSP, 2004)</p>
                <p className="text-[10px] text-muted-foreground mt-1">Complete process guide, case flow, forms reference</p>
              </div>
            </div>
            {libraryTab === "dilg" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />}
          </button>
          <button onClick={() => setLibraryTab("doj")}
            className={cn("relative p-5 rounded-xl border-2 text-left transition-all group",
              libraryTab === "doj" ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-md" : "border-border hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/10")}>
            <div className="flex items-start gap-3">
              <div className={cn("w-12 h-14 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                libraryTab === "doj" ? "bg-amber-500 text-white" : "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400")}>
                <Gavel className="w-6 h-6" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", libraryTab === "doj" ? "text-amber-700 dark:text-amber-300" : "text-foreground")}>DOJ Implementing Rules</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">KP Implementing Rules and Regulations (DOJ, June 1, 1992)</p>
                <p className="text-[10px] text-muted-foreground mt-1">Official legal rules per RA 7160, Chapter 7</p>
              </div>
            </div>
            {libraryTab === "doj" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />}
          </button>
        </div>

        {/* Book Content Area */}
        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border bg-background">
          {libraryTab === "dilg" ? (
            <div className="p-6 space-y-1">
              {/* DILG top bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-blue-500 font-semibold">Republic Act 7160 — Local Government Code of 1991</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">Katarungang Pambarangay Handbook</p>
                </div>
                <a href="/references/kp-dilg-handbook.pdf" download="DILG-KP-Handbook.pdf"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors ml-3">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              </div>

              {/* Handbook Content — Expandable Sections */}
              <div className="space-y-0">
              {[
                { id: "dilg-overview", title: "Overview", content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <p>The Katarungang Pambarangay (Barangay Justice System) is a mechanism for the amicable settlement of disputes at the barangay level. It was institutionalized under Presidential Decree No. 1508 (1978) and later incorporated into Republic Act 7160 (Local Government Code of 1991).</p>
                    <p>The system is designed to relieve the courts of cases that can be settled through mediation, conciliation, or arbitration at the community level. It is mandatory -- disputes within KP jurisdiction must first go through the barangay before they can be filed in court.</p>
                    <p className="font-semibold">Without a Certification to File Action (CFA), courts will dismiss the case for prematurity.</p>
                  </div>
                )},
                { id: "dilg-3levels", title: "3 Levels of Case Resolution", content: (
                  <div className="space-y-5">
                    {/* Level 1 */}
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                        <h5 className="text-sm font-bold text-blue-700 dark:text-blue-300">MEDIATION (through Punong Barangay)</h5>
                      </div>
                      <ul className="text-sm text-foreground space-y-1.5 ml-8 list-disc">
                        <li>Punong Barangay acts as <strong>mediator</strong> (not judge) -- helps parties find a solution, does NOT decide</li>
                        <li>Complainant files <strong>KP Form #7</strong> + pays filing fee (P5-P20)</li>
                        <li>Within next working day: Summons (<strong>KP Form #9</strong>) to respondent + Notice (<strong>KP Form #8</strong>) to complainant</li>
                        <li>Both parties must appear personally -- <strong>no lawyers allowed</strong></li>
                        <li><strong>Timeline: 15 days</strong> from first meeting to reach settlement</li>
                        <li>If settled: <strong>Amicable Settlement (KP Form #16)</strong> -- becomes executory after 10 days</li>
                        <li>If failed: Move to Conciliation (Level 2)</li>
                      </ul>
                    </div>
                    {/* Level 2 */}
                    <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">2</span>
                        <h5 className="text-sm font-bold text-violet-700 dark:text-violet-300">CONCILIATION (through Pangkat Tagapagkasundo)</h5>
                      </div>
                      <ul className="text-sm text-foreground space-y-1.5 ml-8 list-disc">
                        <li>Pangkat = <strong>3-member conciliation panel</strong> chosen from Lupon members</li>
                        <li>Both parties choose members; if they can&apos;t agree, Punong Barangay draws lots</li>
                        <li>Pangkat elects own chairperson and secretary</li>
                        <li>Can issue subpoenas (<strong>KP Form #13</strong>)</li>
                        <li>Pangkat convenes <strong>within 3 days</strong> of constitution</li>
                        <li><strong>Timeline: 15 days</strong> (extendable another 15 days for meritorious cases)</li>
                        <li>If settled: <strong>Amicable Settlement (KP Form #16)</strong> -- force of final court judgment after 10 days</li>
                        <li>If failed: <strong>Certification to File Action (KP Form #21)</strong> -- case moves to court</li>
                      </ul>
                    </div>
                    {/* Level 3 */}
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">3</span>
                        <h5 className="text-sm font-bold text-red-700 dark:text-red-300">CERTIFICATION TO FILE ACTION (CFA)</h5>
                      </div>
                      <ul className="text-sm text-foreground space-y-1.5 ml-8 list-disc">
                        <li>Issued when mediation AND conciliation both fail</li>
                        <li><strong>KP Form #20</strong> (Lupon Secretary), <strong>#21</strong> (Pangkat Secretary), or <strong>#22</strong> (respondent failed to appear)</li>
                        <li>Allows complainant to file case in regular court (Hall of Justice)</li>
                        <li className="font-semibold">Without CFA, courts will DISMISS the case for prematurity</li>
                      </ul>
                    </div>
                    {/* Arbitration */}
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <h5 className="text-sm font-bold text-amber-700 dark:text-amber-300">ARBITRATION (can happen at any level)</h5>
                      </div>
                      <ul className="text-sm text-foreground space-y-1.5 ml-8 list-disc">
                        <li>Both parties can agree <strong>in writing</strong> to submit to arbitration at any stage</li>
                        <li><strong>KP Form #14</strong>: Agreement for Arbitration</li>
                        <li>Unlike mediation/conciliation, the arbitrator <strong>DECIDES</strong> the case</li>
                        <li>Arbitration Award (<strong>KP Form #15</strong>) rendered not earlier than 6th day, not later than 15th day</li>
                        <li>5 days to withdraw from agreement (fraud/violence/intimidation)</li>
                        <li>Award becomes final after 10 days (same as amicable settlement)</li>
                      </ul>
                    </div>
                  </div>
                )},
                { id: "dilg-lupon", title: "Lupon Tagapamayapa (Peace Council)", content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <ul className="space-y-1.5 list-disc ml-4">
                      <li>Organized in <strong>every barangay</strong></li>
                      <li>Punong Barangay = Chairperson</li>
                      <li><strong>10-20 members</strong> appointed by Punong Barangay (exclusive prerogative)</li>
                      <li>Qualifications: actual resident, legal age, integrity, impartiality, independence, fairness</li>
                      <li>Disqualified: under 18, incompetent, convicted criminal, elected official, active military</li>
                      <li>Term: <strong>3 years</strong></li>
                      <li>Serve without compensation (honoraria possible if barangay has funds)</li>
                      <li>CHED Order 62: 2 children of Lupon member qualify for state college scholarship</li>
                      <li>Appointment can be withdrawn with concurrence of majority of all Lupon members</li>
                    </ul>
                  </div>
                )},
                { id: "dilg-jurisdiction", title: "Cases Under KP Jurisdiction", content: (
                  <div className="space-y-4 text-sm text-foreground">
                    <div>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Criminal Cases Covered:</p>
                      <p>Slight/less serious physical injuries, light threats, light coercion, simple theft (under P50), qualified theft (under P500), swindling (under P200), malicious mischief (under P1,000), BP 22 bouncing checks, trespass, oral defamation</p>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Civil Cases Covered:</p>
                      <p>All disputes between residents of the same city/municipality -- property, boundary, debt collection, breach of contract, right of way, etc.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Cases NOT Under KP:</p>
                      <ul className="space-y-1 list-disc ml-4">
                        <li>Involving juridical persons (corporations, cooperatives)</li>
                        <li>Government entity offenses</li>
                        <li>Offenses with penalty &gt; 1 year imprisonment or fine &gt; P5,000</li>
                        <li>No private offended party</li>
                        <li>Real property in different cities/municipalities</li>
                        <li>Urgent legal action needed (habeas corpus, preliminary injunction, attachment, support pendente lite)</li>
                        <li>Labor disputes, land disputes</li>
                        <li>Actions coupled with provisional remedies</li>
                        <li>Where accused is under detention</li>
                        <li>Action may otherwise be barred by statute of limitations</li>
                      </ul>
                    </div>
                  </div>
                )},
                { id: "dilg-timelines", title: "Key Timelines & Deadlines", content: (
                  <div className="text-sm">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        ["Constitute Lupon", "Within 15 days of Punong Barangay taking office"],
                        ["Post notice to constitute", "3 weeks in 3 conspicuous places"],
                        ["Appoint Lupon members", "Within 10 days after 21-day posting period"],
                        ["Issue summons", "Next working day after receipt of complaint"],
                        ["Respondent must appear", "Within 5 days from receipt of summons"],
                        ["Mediation period", "15 days from first meeting"],
                        ["Constitute Pangkat", "Immediately on last day of mediation if failed"],
                        ["Pangkat convenes", "Within 3 days of constitution"],
                        ["Conciliation period", "15 days (extendable 15 more days)"],
                        ["Arbitration award", "Not earlier than 6th day, not later than 15th day after agreement"],
                        ["Repudiation of settlement", "10 days from date of settlement"],
                        ["Prescriptive period suspension", "Max 60 days from filing of complaint"],
                        ["Settlement transmittal to court", "11th to 15th day from settlement date"],
                        ["Voluntary compliance", "5 days from executory date"],
                        ["Execution by Lupon", "Within 6 months of settlement date"],
                        ["After 6 months", "File motion in Municipal Trial Court"],
                        ["Monthly transmittal", "First 5 days of each month (KP Form #28)"],
                        ["Filing fee", "P5.00 to P20.00 (set by Punong Barangay)"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
                          <Clock className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">{label}</span>
                            <span className="text-muted-foreground ml-1">-- {value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )},
                { id: "dilg-rules", title: "Key Rules", content: (
                  <div className="space-y-2 text-sm text-foreground">
                    <ul className="space-y-2 list-disc ml-4">
                      <li><strong>No lawyers</strong> allowed in mediation/conciliation proceedings</li>
                      <li><strong>Personal appearance required</strong> -- no representatives except for minors/incompetents</li>
                      <li>Minors represented by legal guardian or next of kin (not a lawyer)</li>
                      <li>Settlement must be in <strong>language/dialect known to parties</strong></li>
                      <li>Amicable settlement has <strong>force of final court judgment</strong> after 10 days</li>
                      <li>All proceedings are <strong>open to the public</strong> unless excluded for privacy, decency, or public morals</li>
                      <li>Failure to appear without justifiable cause = <strong>dismissal + contempt of court</strong></li>
                      <li>Complainant failure = case dismissed + barred from filing in court</li>
                      <li>Respondent failure = counterclaim dismissed + barred from filing counterclaim</li>
                      <li>Respondent failure at mediation = Punong Barangay must still constitute Pangkat</li>
                      <li>Properties exempt from execution: family home, tools of trade, livestock, clothing, household furniture, provisions (4 months), professional libraries, fishing boat, earnings for family support, life insurance up to P100k</li>
                    </ul>
                  </div>
                )},
                { id: "dilg-indigenous", title: "Indigenous Dispute Resolution", content: (
                  <div className="space-y-2 text-sm text-foreground">
                    <ul className="space-y-1.5 list-disc ml-4">
                      <li>In ICC/IP communities: traditional customs and council of elders/datus apply</li>
                      <li>Must register datus/elders with Mayor&apos;s office</li>
                      <li>NSO must certify majority of inhabitants are ICC/IP</li>
                      <li>Settlement has same force as KP settlement</li>
                      <li>If both parties from different tribes: must agree on which system</li>
                      <li>If parties can&apos;t agree: KP system applies</li>
                      <li>IPRA (RA 8371, 1998) recognizes indigenous justice systems</li>
                    </ul>
                  </div>
                )},
                { id: "dilg-kpforms", title: "KP Forms — All 28 Official Templates (RA 7160)", content: (
                  <div className="space-y-3">
                    {reviewFormNumber !== null ? (
                      <div className="space-y-3">
                        <button onClick={() => setReviewFormNumber(null)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronDown className="h-3.5 w-3.5 rotate-90" /> Back to Forms List
                        </button>
                        {kpFormPreview}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {["lupon", "filing", "mediation", "conciliation", "arbitration", "settlement", "enforcement", "cfa", "execution", "reporting"].map((stage) => {
                          const stageForms = KP_FORMS.filter((f) => f.stage === stage);
                          if (stageForms.length === 0) return null;
                          const stageLabels: Record<string, string> = {
                            lupon: "Lupon Administration", filing: "Case Filing",
                            mediation: "Mediation (Punong Barangay)", conciliation: "Conciliation (Pangkat Tagapagkasundo)",
                            arbitration: "Arbitration", settlement: "Settlement & Repudiation",
                            enforcement: "Failure to Appear", cfa: "Certifications (CFA)",
                            execution: "Execution", reporting: "Reporting",
                          };
                          return (
                            <div key={stage}>
                              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">{stageLabels[stage]}</h4>
                              <div className="space-y-1">
                                {stageForms.map((f) => (
                                  <div key={f.number} className="flex items-center justify-between p-2.5 rounded-lg glass-subtle hover:bg-muted transition-colors group">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-bold text-accent-text bg-accent-bg px-2 py-0.5 rounded">#{f.number}</span>
                                      <span className="text-sm text-foreground">{f.name}</span>
                                    </div>
                                    <button onClick={() => setReviewFormNumber(f.number)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-lg border border-border hover:bg-muted">
                                      <Eye className="h-3 w-3" /> Review
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )},
              ].map((section) => (
                <div key={section.id} className="border-b border-border/50 last:border-0">
                  <button onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                    className="w-full flex items-center justify-between py-3 px-2 text-left hover:bg-muted/50 rounded-lg transition-colors">
                    <span className="text-sm font-semibold text-foreground">{section.title}</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedSections[section.id] && "rotate-180")} />
                  </button>
                  {expandedSections[section.id] && (
                    <div className="px-2 pb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-1">
              {/* DOJ IRR Header */}
              <div className="flex items-start justify-between pb-4 mb-4 border-b border-border">
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold">Department of Justice</p>
                  <h3 className="text-lg font-bold text-foreground mt-1">Katarungang Pambarangay Implementing Rules and Regulations</h3>
                  <p className="text-xs text-muted-foreground mt-1">Promulgated June 1, 1992 (Official Gazette Vol. 88, No. 22)</p>
                  <p className="text-xs text-muted-foreground">Pursuant to Section 421, Chapter 7, Title One, Book III of RA 7160</p>
                </div>
                <a href="/references/kp-doj-irr.pdf" download="DOJ-KP-Implementing-Rules.pdf"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors ml-3">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              </div>

              {/* DOJ Expandable Sections */}
              {[
                { id: "doj-rule1", title: "Rule I -- General Provisions", content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <p><strong>Section 1. Title</strong> -- Sections 399 to 422 (Chapter 7, Title One, Book III) and Section 515 (Title One, Book IV) of RA 7160 shall be known as the Katarungang Pambarangay Law. These implementing rules shall be known as the Katarungang Pambarangay Rules.</p>
                    <p><strong>Section 2. Construction</strong> -- These Rules shall be liberally construed in order to promote their objects of assisting disputants to obtain just, speedy and inexpensive amicable settlement of disputes at the barangay level.</p>
                    <p><strong>Section 3. Scope</strong> -- These Rules shall govern the establishment, administration and operation of the Lupong Tagapamayapa and the Pangkat ng Tagapagkasundo as well as the procedures in settling disputes among barangay members through mediation, conciliation and arbitration.</p>
                  </div>
                )},
                { id: "doj-rule2", title: "Rule II -- Definition of Terms", content: (
                  <div className="space-y-2 text-sm text-foreground leading-relaxed">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        ["Lupong Tagapamayapa (Lupon)", "The body organized in every barangay composed of the Punong Barangay as Chairman and not less than 10 nor more than 20 members from which the members of every Pangkat shall be chosen."],
                        ["Pangkat ng Tagapagkasundo (Pangkat)", "The conciliation panel constituted from the Lupon membership for every dispute brought before the Lupon, consisting of 3 members chosen by agreement of the disputants, or if no agreement, drawn by lot by the Punong Barangay."],
                        ["Habeas Corpus Proceeding", "A judicial proceeding for the purpose of releasing a person who is illegally deprived of liberty or restoring rightful custody."],
                        ["Preliminary Injunction", "A provisional remedy in the form of an order issued by a judge requiring a person to refrain from a particular act."],
                        ["Attachment", "A provisional remedy by which property of the adverse party is taken into legal custody as security for a judgment."],
                        ["Support Pendente Lite", "A provisional order granting allowance for sustenance, dwelling, clothing, education and medical attendance."],
                        ["Arbitration", "A process for the adjudication of disputes by which the parties agree to be bound by the decision of a third person or body."],
                        ["Statute of Limitations", "The law that bars the institution of an action against another after the lapse of the period prescribed."],
                        ["Mediation and Conciliation", "Interchangeable terms indicating the process whereby disputants are persuaded by the Punong Barangay or Pangkat to amicably settle their disputes."],
                        ["Minor", "A person below eighteen (18) years of age."],
                        ["Incompetent", "Includes persons suffering civil interdiction, hospitalized lepers, prodigals, deaf and dumb unable to communicate, those of unsound mind, and persons who by reason of age, disease, weak mind, cannot take care of themselves."],
                        ["Next of Kin", "A relative or a responsible friend with whom the minor or incompetent lives."],
                      ].map(([term, def]) => (
                        <div key={term} className="py-1.5 border-b border-border/30 last:border-0">
                          <span className="font-semibold text-amber-700 dark:text-amber-400">{term}</span>
                          <span className="text-muted-foreground"> -- {def}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )},
                { id: "doj-rule3", title: "Rule III -- Powers and Duties", content: (
                  <div className="space-y-4 text-sm text-foreground leading-relaxed">
                    <div>
                      <p className="font-semibold text-amber-600 dark:text-amber-400 mb-2">Section 1. Punong Barangay -- Constitution of Lupon:</p>
                      <ul className="space-y-1.5 list-disc ml-4">
                        <li>Determine within 15 days the actual number of Lupon members (10-20), considering barangay population and dispute volume</li>
                        <li>Prepare notice to constitute with proposed member names (at least 5 more than needed)</li>
                        <li>Post notice in 3 conspicuous places for 3 weeks</li>
                        <li>Appoint members within 10 days after posting period, considering endorsements and oppositions</li>
                        <li>Swear in appointees, sign appointment papers attested by Barangay Secretary</li>
                        <li>Post list of appointed members in 3 conspicuous places for entire term</li>
                        <li>Withdraw appointment with concurrence of majority of all Lupon members</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-600 dark:text-amber-400 mb-2">Mediation and Arbitration Functions:</p>
                      <ul className="space-y-1.5 list-disc ml-4">
                        <li>Receive all written complaints; put verbal complaints in writing</li>
                        <li>Immediately notify complainant of hearing date; issue summons to respondent within next working day (appear within 5 days)</li>
                        <li>Administer oaths in connection with KP proceedings</li>
                        <li>Resolve all objections to venue</li>
                        <li>Mediate all disputes within jurisdiction; reduce settlement to writing in language known to parties</li>
                        <li>Arbitrate upon written agreement of parties; render award not earlier than 6th day but not later than 15th day</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-600 dark:text-amber-400 mb-2">Section 2. Lupon Secretary (Barangay Secretary):</p>
                      <ul className="space-y-1.5 list-disc ml-4">
                        <li>Keep record book of all complaints (numbered consecutively)</li>
                        <li>Note results of mediation proceedings; submit final report to proper court</li>
                        <li>Record willful failure of parties to comply with summons</li>
                        <li>Issue certification to bar action/counterclaim</li>
                        <li>Transmit settlement to proper court (11th to 15th day from settlement)</li>
                        <li>Issue certification required for filing action in court</li>
                        <li>Furnish copies of settlement/award to all parties and Punong Barangay</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-600 dark:text-amber-400 mb-2">Section 3. Pangkat Chairman:</p>
                      <ul className="space-y-1.5 list-disc ml-4">
                        <li>Preside over all hearings conducted by the Pangkat</li>
                        <li>Issue summons for personal appearance of parties and witnesses</li>
                        <li>Attest to settlement; preside over arbitration hearings when parties agree</li>
                      </ul>
                    </div>
                  </div>
                )},
                { id: "doj-rule4", title: "Rule IV -- Lupong Tagapamayapa", content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <p><strong>Qualifications:</strong> Must have actual residence or place of work in the barangay. Must possess personal characteristics indicating suitability: integrity, impartiality, independence of mind, sense of fairness, reputation for probity, tact, patience, resourcefulness, flexibility and open-mindedness. Must not be expressly disqualified by law from holding public office.</p>
                    <p><strong>Term of Office:</strong> Lupon members hold office until a new Lupon is constituted on the third year following their appointment. Vacancy filled immediately by Punong Barangay.</p>
                    <p><strong>Character of Office:</strong> Lupon members, while performing official duties, are deemed persons in authority as defined in the Revised Penal Code.</p>
                    <p><strong>Nature of Service:</strong> Serve without compensation except as provided in Section 393 of the LGC. While performing duties, they are deemed on official time and shall not suffer any diminution in compensation from employment.</p>
                    <p><strong>Regular Meeting:</strong> Once a month on a date set by the Lupon Chairman, for exchange of ideas on amicable settlement matters.</p>
                    <p><strong>Execution:</strong> The Lupon shall, through the Punong Barangay, enforce by execution the settlement or arbitration award in accordance with Rule VII.</p>
                  </div>
                )},
                { id: "doj-rule5", title: "Rule V -- Pangkat ng Tagapagkasundo", content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <p><strong>Constitution:</strong> Parties choose 3 persons from among the Lupon membership. If they fail to agree, the Punong Barangay draws lots. The 3 regular members elect their own chairman and secretary.</p>
                    <p><strong>Vacancy:</strong> Filled by parties choosing from other Lupon members. If parties fail to agree, filled by lot drawn by Lupon Chairman.</p>
                    <p><strong>Function:</strong> All disputes not successfully settled by the Punong Barangay shall as far as possible be settled through conciliation or arbitration by the Pangkat.</p>
                    <p><strong>Disqualification:</strong> A party may move to disqualify any member by reason of relationship, bias, interest or other similar grounds discovered after constitution. The Pangkat resolves by majority vote. Decision is final.</p>
                    <p><strong>Nature of Service:</strong> Same as Lupon -- serve without compensation, deemed on official time while performing duties.</p>
                  </div>
                )},
                { id: "doj-rule6", title: "Rule VI -- Amicable Settlement of Disputes", content: (
                  <div className="space-y-4 text-sm text-foreground leading-relaxed">
                    <p><strong>Section 1. Parties:</strong> Only individuals may be parties. No complaint by or against corporations, partnerships or other juridical entities.</p>
                    <p><strong>Section 2. Subject Matter:</strong> All disputes may be subject to settlement except: (a) government party, (b) public officer disputes related to official functions, (c) offenses with penalty &gt; 1 year or fine &gt; P5,000, (d) no private offended party, (e) real property in different cities/municipalities, (f) parties in different cities/municipalities, (g) classes determined by the President.</p>
                    <p><strong>Section 4. Commencement:</strong> By verbal or written complaint to the Punong Barangay, upon payment of filing fee (P5.00 to P20.00). The respondent shall answer by denying specifically and/or alleging any lawful defense. May also interpose counterclaim, cross-claim, or third-party complaint.</p>
                    <p><strong>Section 6. Personal Appearance:</strong> Parties must appear in person without assistance of counsel or intervention of anyone. Minors and incompetents assisted by next of kin who is not a lawyer.</p>
                    <p><strong>Section 7. Hearings:</strong> Informal but orderly manner, without regard to technical rules of evidence. Proceedings recorded by Lupon/Pangkat Secretary. All proceedings open to general public unless excluded for privacy, decency or public morals.</p>
                  </div>
                )},
                { id: "doj-rule6-failure", title: "Rule VI -- Failure to Appear (Sanctions)", content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                      <p className="font-semibold text-red-700 dark:text-red-400 mb-2">Section 8. Sanctions for Failure to Appear:</p>
                      <div className="space-y-2">
                        <p><strong>Complainant fails to appear:</strong> (1) Complaint dismissed, (2) Certification to bar filing of action in court issued, (3) Application for contempt filed with local trial court.</p>
                        <p><strong>Respondent fails to appear at mediation:</strong> Punong Barangay must still constitute the Pangkat, but respondent&apos;s counterclaim is dismissed and barred. If respondent also fails at Pangkat, CFA is issued.</p>
                        <p><strong>Respondent fails to appear at conciliation:</strong> (1) Counterclaim dismissed, (2) Certification to bar counterclaim issued, (3) CFA issued for complainant, (4) Application for contempt filed.</p>
                        <p><strong>Witness fails to appear:</strong> Application for contempt filed with local trial court.</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Before imposing sanctions, the absent party must be given opportunity to explain non-appearance.</p>
                  </div>
                )},
                { id: "doj-rule7", title: "Rule VII -- Settlement, Arbitration & Execution", content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <p><strong>Form of Settlement:</strong> All amicable settlements must be in writing, in a language or dialect known to the parties, signed by them, and attested by the Lupon Chairman or Pangkat Chairman.</p>
                    <p><strong>Arbitration:</strong> Parties may at any stage agree in writing to abide by the arbitration award. Agreement may be repudiated within 5 days for fraud, violence, or intimidation. Award rendered after lapse of repudiation period and within 10 days thereafter.</p>
                    <p><strong>Effect:</strong> Settlement and arbitration award have force and effect of a final judgment of a court upon expiration of 10 days from date thereof, unless repudiated or petition to nullify filed.</p>
                    <p><strong>Execution:</strong> Settlement or award may be enforced by the Lupon within 6 months from date of settlement. After 6 months, enforcement by action in the appropriate city or municipal court.</p>
                    <p><strong>Repudiation:</strong> Any party may, within 10 days, repudiate the settlement by filing a sworn statement that consent was vitiated by fraud, violence, or intimidation. This is sufficient basis for issuance of CFA.</p>
                    <p><strong>Transmittal:</strong> The Lupon Secretary shall transmit the settlement/award to the proper local trial court within 5 days from the date of the award or from the lapse of the 10-day repudiation period.</p>
                  </div>
                )},
                { id: "doj-conciliation", title: "Rule VIII -- Conciliation (Pre-condition to Court Filing)", content: (
                  <div className="space-y-3 text-sm text-foreground leading-relaxed">
                    <p><strong>Section 412. Conciliation:</strong> No complaint, petition, action, or proceeding involving any matter within the authority of the Lupon shall be filed or instituted directly in court unless there has been a confrontation between the parties before the Lupon Chairman or the Pangkat, and that no conciliation or settlement has been reached as certified by the Lupon Secretary or Pangkat Secretary.</p>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Exceptions -- Where Parties May Go Directly to Court:</p>
                      <ul className="space-y-1 list-disc ml-4">
                        <li>Where the accused is under detention</li>
                        <li>Where a person has been deprived of personal liberty (habeas corpus)</li>
                        <li>Where actions are coupled with provisional remedies (preliminary injunction, attachment, delivery of personal property, support pendente lite)</li>
                        <li>Where the action may otherwise be barred by the statute of limitations</li>
                      </ul>
                    </div>
                    <p><strong>Suspension of Prescriptive Period:</strong> While the dispute is under mediation, conciliation, or arbitration, the prescriptive periods for offenses and causes of action shall be interrupted upon filing the complaint with the Punong Barangay. Shall resume upon receipt of the complaint or CFA. Provided that such interruption shall not exceed 60 days.</p>
                  </div>
                )},
              ].map((section) => (
                <div key={section.id} className="border-b border-border/50 last:border-0">
                  <button onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                    className="w-full flex items-center justify-between py-3 px-2 text-left hover:bg-muted/50 rounded-lg transition-colors">
                    <span className="text-sm font-semibold text-foreground">{section.title}</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedSections[section.id] && "rotate-180")} />
                  </button>
                  {expandedSections[section.id] && (
                    <div className="px-2 pb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={cn("flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200",
            t.type === "error" ? "bg-red-600 text-white" : "glass")}>
            {t.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            <span className="text-sm font-medium">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-2 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      <MabiniButton pageContext="You are on the KP Cases (Katarungang Pambarangay) page. This manages barangay dispute resolution per RA 7160. The 3 levels are: (1) Mediation by Punong Barangay (15 days), (2) Conciliation by Pangkat Tagapagkasundo (15-30 days), (3) if both fail, CFA (Certification to File Action) is issued allowing the case to go to court. Arbitration can happen at any level if both parties agree. There are 28 KP Forms used throughout the process. Amicable settlements have force of a court judgment after 10 days." />
    </div>
  );
}
