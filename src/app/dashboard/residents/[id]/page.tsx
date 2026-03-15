"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, Printer, Archive, User, Calendar, Heart, MapPin,
  Phone, Mail, Briefcase, GraduationCap, IdCard, Vote,
  Home, Flag, Users, AlertTriangle, Loader2, Contact,
  HandHeart, Link2, PawPrint, Globe, Fingerprint,
  ScrollText, Activity, FolderOpen, Clock,
  MessageSquare, Sparkles, CheckCircle2, ChevronRight,
} from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useAiStream } from "@/hooks/use-ai-stream";
import type { ResidentDetail } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s: string) {
  // Extract date part only to avoid timezone shift
  const datePart = s.split("T")[0];
  const [y, m, day] = datePart.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function age(dob: string) {
  const d = parseDate(dob);
  if (isNaN(d.getTime())) return "?";
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const mo = now.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const dt = parseDate(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function cap(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

// ── Field — Tanga-Proof: always shows "Not indicated" when empty ──────────────

function Field({
  label,
  value,
  icon,
  mono,
  wide,
}: {
  label: string;
  value: string | number | null | undefined | React.ReactNode;
  icon?: React.ReactNode;
  mono?: boolean;
  wide?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === "" || value === false;
  return (
    <div className={cn("flex flex-col gap-1", wide && "col-span-2")}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className={cn(
        "flex items-center gap-1.5 text-sm",
        mono && "font-mono",
        isEmpty ? "text-muted-foreground/50 italic" : "text-foreground"
      )}>
        {icon && !isEmpty && <span className="text-muted-foreground shrink-0">{icon}</span>}
        <span>{isEmpty ? "Not indicated" : (value as React.ReactNode)}</span>
      </div>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <hr className="border-border" />;
}

function PlaceholderTab({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

// ── Mabini AI Summary Card ────────────────────────────────────────────────────

function MabiniSummaryCard({
  content,
  isStreaming,
  error,
}: {
  content: string;
  isStreaming: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const hasContent = content.length > 0;

  return (
    <div className="rounded-xl border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/10 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-orange-200/60 dark:border-orange-800/40">
        <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mabini-ai.png" alt="Mabini AI" className="w-full h-full object-cover" />
        </div>
        <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Mabini AI Summary</span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-[10px] text-orange-500 ml-auto">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Generating...
          </span>
        )}
        {!isStreaming && hasContent && (
          <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 ml-auto">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        )}
      </div>
      <div className="p-4">
        {error ? (
          <p className="text-xs text-muted-foreground">AI summary unavailable.</p>
        ) : !hasContent && isStreaming ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
            <span>Mabini is reading the resident record...</span>
          </div>
        ) : hasContent ? (
          <Markdown content={content} className="text-sm" />
        ) : null}
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="mt-3 flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
          Ask Mabini more about this resident
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Personal Info Tab ─────────────────────────────────────────────────────────

function PersonalInfoTab({
  r,
  mabini,
}: {
  r: ResidentDetail;
  mabini: { content: string; isStreaming: boolean; error: string | null };
}) {
  const fullAddress = [r.house_block_lot, r.street, r.purok ? `Purok ${r.purok}` : null, r.subdivision_village, r.sitio]
    .filter(Boolean).join(", ");

  return (
    <div className="space-y-6">

      {/* Mabini AI summary — auto-shown when streaming starts */}
      {(mabini.isStreaming || mabini.content) && (
        <MabiniSummaryCard content={mabini.content} isStreaming={mabini.isStreaming} error={mabini.error} />
      )}

      {/* Cross-barangay flags */}
      {(r.cross_barangay_flags?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {r.cross_barangay_flags?.map((fl, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
              <Flag className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Cross-barangay record detected in another barangay (confidence: {fl.match_confidence}). Verify before issuing official documents.</span>
            </div>
          ))}
        </div>
      )}

      {/* Personal Information */}
      <Section title="Personal Information" icon={<User className="h-4 w-4" />}>
        <Field label="Sex" value={cap(r.sex)} />
        <Field label="Date of Birth" value={r.date_of_birth ? `${formatDate(r.date_of_birth)} (${age(r.date_of_birth)} yrs)` : null} />
        <Field label="Civil Status" value={cap(r.civil_status)} />
        <Field label="Blood Type" value={r.blood_type} />
        <Field label="Place of Birth" value={cap(r.place_of_birth)} />
        <Field label="Citizenship" value={cap(r.citizenship)} />
        <Field label="Religion" value={cap(r.religion)} />
        <Field label="Ethnicity" value={cap(r.ethnicity)} />
        <Field label="Height" value={r.height_cm ? `${r.height_cm} cm` : null} />
        <Field label="Weight" value={r.weight_kg ? `${r.weight_kg} kg` : null} />
        <Field label="Complexion" value={cap(r.complexion)} />
        <Field label="Resident Type" value={cap(r.resident_type)} />
        <Field label="Mother's Maiden Name" value={cap(r.mothers_maiden_name)} wide />
      </Section>

      <Divider />

      {/* Contact & Address */}
      <Section title="Contact & Address" icon={<Phone className="h-4 w-4" />}>
        <Field label="Mobile" value={r.mobile_number} icon={<Phone className="h-3 w-3" />} />
        <Field label="Email" value={r.email} icon={<Mail className="h-3 w-3" />} />
        <Field label="Full Address" value={fullAddress || null} icon={<MapPin className="h-3 w-3" />} wide />
        <Field label="Purok" value={r.purok} />
        <Field label="Street" value={r.street} />
        <Field label="House / Block / Lot" value={r.house_block_lot} />
        <Field label="Subdivision / Village" value={r.subdivision_village} />
        <Field label="Sitio" value={r.sitio} />
        <Field label="Zip Code" value={r.zip_code} />
        <Field label="Coordinates" value={(r.latitude && r.longitude) ? `${r.latitude}, ${r.longitude}` : null} icon={<Globe className="h-3 w-3" />} wide />
      </Section>

      <Divider />

      {/* Employment & Livelihood */}
      <Section title="Employment & Livelihood" icon={<Briefcase className="h-4 w-4" />}>
        <Field label="Occupation" value={cap(r.occupation)} />
        <Field label="Employer" value={cap(r.employer)} />
        <Field label="Monthly Income Range" value={cap(r.monthly_income_range)} />
        <Field label="Source of Income" value={cap(r.source_of_income)} />
        <Field label="Livelihood Type" value={cap(r.livelihood_type)} />
        <Field label="Skills" value={cap(r.skills)} wide />
      </Section>

      <Divider />

      {/* Education */}
      <Section title="Education" icon={<GraduationCap className="h-4 w-4" />}>
        <Field label="Highest Education" value={cap(r.highest_education)} wide />
      </Section>

      {Array.isArray(r.education_details) && (r.education_details as Record<string, string>[]).length > 0 && (
        <div className="mt-3 space-y-2">
          {(r.education_details as Record<string, string>[]).map((e, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg glass-subtle text-sm">
              <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{e.degree || e.level || "—"}</p>
                {e.school && <p className="text-xs text-muted-foreground">{e.school}{e.year_graduated ? ` · ${e.year_graduated}` : ""}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Divider />

      {/* Government IDs — encrypted, privacy notice */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <IdCard className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Government IDs</h3>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
          <IdCard className="h-4 w-4 shrink-0" />
          Government ID numbers (PhilHealth, SSS/GSIS, Pag-IBIG, TIN, PWD ID) are encrypted and stored securely. They are not displayed to protect resident privacy.
        </div>
      </div>

      <Divider />

      {/* Voter & Household */}
      <Section title="Voter & Household" icon={<Vote className="h-4 w-4" />}>
        <Field label="Registered Voter" value={r.is_voter ? "Yes" : "No"} />
        <Field label="Resident Voter" value={r.is_resident_voter ? "Yes" : "No"} />
        <Field label="Precinct Number" value={r.voter_precinct_number} mono />
        <Field label="Head of Household" value={r.is_head_of_household ? "Yes" : "No"} />
        <Field label="Household Number" value={r.household?.household_number} mono />
      </Section>

      <Divider />

      {/* Barangay Position — always shown, Tanga-Proof */}
      <Section title="Barangay Position" icon={<Contact className="h-4 w-4" />}>
        <Field label="Position" value={cap(r.barangay_position)} />
        <Field label="Start Date" value={formatDate(r.barangay_role_start)} />
        <Field label="End Date" value={formatDate(r.barangay_role_end)} />
      </Section>

      <Divider />

      {/* Emergency Contact — always shown */}
      <Section title="Emergency Contact" icon={<AlertTriangle className="h-4 w-4" />}>
        <Field label="Name" value={cap(r.emergency_contact_name)} wide />
        <Field label="Phone" value={r.emergency_contact_phone} />
        <Field label="Relationship" value={cap(r.emergency_contact_relationship)} />
        <Field label="Address" value={cap(r.emergency_contact_address)} wide />
      </Section>

      <Divider />

      {/* Work History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Work History</h3>
        </div>
        {Array.isArray(r.work_history) && (r.work_history as Record<string, string>[]).length > 0 ? (
          <div className="space-y-2">
            {(r.work_history as Record<string, string>[]).map((w, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg glass-subtle text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{w.position || w.job_title || "—"}</p>
                  {w.employer && <p className="text-xs text-muted-foreground">{w.employer}{w.year_started ? ` · ${w.year_started}${w.year_ended ? `–${w.year_ended}` : "–present"}` : ""}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">Not indicated</p>
        )}
      </div>

      <Divider />

      {/* Business / Enterprise */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business / Enterprise</h3>
        </div>
        {Array.isArray(r.business_details) && (r.business_details as Record<string, string>[]).length > 0 ? (
          <div className="space-y-2">
            {(r.business_details as Record<string, string>[]).map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg glass-subtle text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{b.business_name || b.name || "—"}</p>
                  {(b.type || b.address) && <p className="text-xs text-muted-foreground">{[b.type, b.address].filter(Boolean).join(" · ")}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">Not indicated</p>
        )}
      </div>

      <Divider />

      {/* Assistance History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HandHeart className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assistance History</h3>
        </div>
        {Array.isArray(r.assistance_history) && (r.assistance_history as Record<string, string>[]).length > 0 ? (
          <div className="space-y-2">
            {(r.assistance_history as Record<string, string>[]).map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg glass-subtle text-sm">
                <HandHeart className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{a.type || a.program || "—"}</p>
                  {a.date && <p className="text-xs text-muted-foreground">{a.date}{a.amount ? ` · ₱${a.amount}` : ""}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">Not indicated</p>
        )}
      </div>

      <Divider />

      {/* Linked Relatives */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linked Relatives</h3>
        </div>
        {Array.isArray(r.relative_links) && (r.relative_links as Record<string, string>[]).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(r.relative_links as Record<string, string>[]).map((rel, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg glass-subtle text-sm">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs">{rel.name || "—"}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{rel.relationship || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">Not indicated</p>
        )}
      </div>

      <Divider />

      {/* Pet Records */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <PawPrint className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pet Records</h3>
        </div>
        {Array.isArray(r.pet_records) && (r.pet_records as Record<string, string>[]).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(r.pet_records as Record<string, string>[]).map((pet, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg glass-subtle text-sm">
                <PawPrint className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs">{pet.name || "—"}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{pet.species || pet.type || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">Not indicated</p>
        )}
      </div>

      <Divider />

      {/* Health & Remarks — always shown, Tanga-Proof */}
      <Section title="Health & Remarks" icon={<Fingerprint className="h-4 w-4" />}>
        <Field label="Health History" value={r.health_history} wide />
        <Field label="Organ Donor" value={r.is_organ_donor ? "Yes" : null} />
        <Field label="Sector (Other)" value={r.sector_other} />
        <Field label="Other Remarks" value={r.other_remarks} wide />
      </Section>

    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ResidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { streamingContent, isStreaming, error: streamError, sendMessage } = useAiStream();
  const aiTriggered = useRef(false);

  const fetchResident = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.residents.get(id);
      setResident(data);
    } catch {
      setError("Could not load resident record. It may have been deleted or you may not have access.");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) fetchResident();
  }, [fetchResident, authLoading]);

  // Auto-trigger Mabini AI summary once resident data is loaded
  useEffect(() => {
    if (!resident || aiTriggered.current) return;
    aiTriggered.current = true;

    const name = `${resident.first_name} ${resident.last_name}`;
    const dobStr = resident.date_of_birth ? `born ${formatDate(resident.date_of_birth)}` : "";
    const ageStr = resident.date_of_birth ? `, ${age(resident.date_of_birth)} years old` : "";
    const sexStr = resident.sex ? `, ${resident.sex}` : "";
    const purokStr = resident.purok ? `, Purok ${resident.purok}` : "";
    const occupStr = resident.occupation ? `. Occupation: ${resident.occupation}` : "";
    const voterStr = resident.is_voter ? ". Registered voter" : ". Not a registered voter";
    const hohStr = resident.is_head_of_household ? ". Head of household" : "";
    const sectorStr = resident.sectoral_tags?.length
      ? `. Sectoral tags: ${resident.sectoral_tags.map(t => t.sector).join(", ")}`
      : "";
    const completionStr = `Profile is ${resident.profile_completion_pct}% complete.`;

    const prompt = `You are a barangay management assistant. Provide a concise 3-4 sentence resident profile summary for barangay staff. Include key facts: ${name}${dobStr}${ageStr}${sexStr}${purokStr}${occupStr}${voterStr}${hohStr}${sectorStr}. ${completionStr} Highlight anything the staff should be aware of. Keep it direct and professional.`;

    sendMessage(prompt);
  }, [resident, sendMessage]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Error ──
  if (error || !resident) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground text-center max-w-sm">{error || "Resident not found."}</p>
        <button
          onClick={() => router.push("/dashboard/residents")}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Residents
        </button>
      </div>
    );
  }

  // ── Derived values ──
  const fullName = [
    resident.last_name.toUpperCase() + ",",
    resident.first_name,
    resident.middle_name ? resident.middle_name[0] + "." : null,
    resident.extension_name || null,
  ].filter(Boolean).join(" ");

  const initials = (resident.last_name[0] + resident.first_name[0]).toUpperCase();
  const avatarColor = resident.sex === "female" ? "bg-pink-400" : "bg-blue-400";

  const completionPct = resident.profile_completion_pct;
  const completionColor =
    completionPct >= 80 ? "#22c55e" :
    completionPct >= 50 ? "#f59e0b" : "#ef4444";

  const missingFields = [
    !resident.date_of_birth && "Date of Birth",
    !resident.mobile_number && "Mobile Number",
    !resident.purok && "Purok",
    !resident.blood_type && "Blood Type",
    !resident.place_of_birth && "Place of Birth",
    !resident.emergency_contact_name && "Emergency Contact",
    !resident.occupation && "Occupation",
    !resident.email && "Email",
  ].filter(Boolean) as string[];

  const tabs = [
    { id: "info", label: "Personal Info", icon: <User className="h-3.5 w-3.5" /> },
    { id: "cases", label: "Cases", icon: <FolderOpen className="h-3.5 w-3.5" /> },
    { id: "documents", label: "Documents", icon: <ScrollText className="h-3.5 w-3.5" /> },
    { id: "family", label: "Family", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">

      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/residents")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Residents
      </button>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── Left Panel ── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">

          {/* Identity Card */}
          <div className="rounded-2xl border border-border glass p-5">

            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center mb-4">
              {resident.photo_url ? (
                <img src={resident.photo_url} alt={initials} className="w-24 h-24 rounded-2xl object-cover shadow-lg mb-3" />
              ) : (
                <div className={cn(
                  "w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-3",
                  avatarColor
                )}>
                  {initials}
                </div>
              )}
              <h1 className="text-base font-bold text-foreground leading-tight">{fullName}</h1>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{resident.resident_number}</p>

              {/* Status + key badges */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                <StatusBadge status={resident.status} />
                {resident.is_voter && <Badge variant="success" dot>Voter</Badge>}
                {resident.is_head_of_household && <Badge variant="warning" dot>HOH</Badge>}
                {resident.is_organ_donor && <Badge variant="info" dot>Organ Donor</Badge>}
              </div>

              {/* Sectoral tags */}
              {(resident.sectoral_tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                  {resident.sectoral_tags?.map(t => (
                    <Badge key={t.id} variant="info" className="text-[9px] px-1.5">{t.sector}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Quick facts — Tanga-Proof: all shown */}
            <div className="space-y-2 py-3 border-t border-border">
              {/* Age & Sex */}
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {resident.date_of_birth ? (
                  <span className="text-foreground">
                    {age(resident.date_of_birth)} yrs
                    {resident.sex && <span className="text-muted-foreground"> · {cap(resident.sex)}</span>}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Age not indicated</span>
                )}
              </div>

              {/* Civil Status */}
              <div className="flex items-center gap-2 text-xs">
                <Heart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {resident.civil_status ? (
                  <span className="text-foreground">{cap(resident.civil_status)}</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Civil status not indicated</span>
                )}
              </div>

              {/* Purok */}
              <div className="flex items-center gap-2 text-xs">
                <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {resident.purok ? (
                  <span className="text-foreground">Purok {resident.purok}</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Purok not indicated</span>
                )}
              </div>

              {/* Mobile */}
              <div className="flex items-center gap-2 text-xs">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {resident.mobile_number ? (
                  <span className="text-foreground">{resident.mobile_number}</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Mobile not indicated</span>
                )}
              </div>

              {/* Occupation */}
              {resident.occupation && (
                <div className="flex items-center gap-2 text-xs">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{cap(resident.occupation)}</span>
                </div>
              )}
            </div>

            {/* Registered & Updated */}
            <div className="pt-3 border-t border-border space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Registered: {formatDate(resident.registration_date || resident.created_at) ?? "Not indicated"}</span>
              </div>
              {resident.updated_at && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Updated: {formatDate(resident.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion Card */}
          <div className="rounded-2xl border border-border glass p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Completion</p>
              <span className="text-sm font-bold" style={{ color: completionColor }}>{completionPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${completionPct}%`, background: completionColor }}
              />
            </div>
            {missingFields.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] text-muted-foreground mb-1.5">Missing information:</p>
                <div className="space-y-1">
                  {missingFields.slice(0, 5).map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {f}
                    </div>
                  ))}
                  {missingFields.length > 5 && (
                    <p className="text-[10px] text-muted-foreground">+{missingFields.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map Preview — only when coordinates exist */}
          {resident.latitude && resident.longitude && (
            <div className="rounded-2xl border border-border glass overflow-hidden">
              <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
              </div>
              <iframe
                title="Resident Location"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(resident.longitude) - 0.003},${Number(resident.latitude) - 0.003},${Number(resident.longitude) + 0.003},${Number(resident.latitude) + 0.003}&layer=mapnik&marker=${resident.latitude},${resident.longitude}`}
                width="100%"
                height="140"
                style={{ border: "none", display: "block", pointerEvents: "none" }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="rounded-2xl border border-border glass p-4 space-y-2">
            <button
              onClick={() => router.push(`/dashboard/residents?edit=${resident.id}`)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition-colors"
              style={{ background: "var(--accent-primary)" }}
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Send SMS
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">
              <Printer className="h-4 w-4 text-muted-foreground" />
              Print Resident ID
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-amber-300/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
              <Archive className="h-4 w-4" />
              Archive Record
            </button>
          </div>

        </div>
        {/* ── End Left Panel ── */}

        {/* ── Right Panel ── */}
        <div className="flex-1 min-w-0">
          <Tabs tabs={tabs} defaultTab="info">
            {(active) => (
              <div className="rounded-2xl border border-border glass p-6">

                {active === "info" && (
                  <PersonalInfoTab
                    r={resident}
                    mabini={{ content: streamingContent, isStreaming, error: streamError }}
                  />
                )}

                {active === "cases" && (
                  <div className="space-y-4">
                    {(resident.cross_barangay_flags?.length ?? 0) > 0 && (
                      <div className="space-y-2 mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cross-Barangay Flags</p>
                        {resident.cross_barangay_flags?.map((fl, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-400">
                            <Flag className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>Cross-barangay record detected (confidence: {fl.match_confidence})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <PlaceholderTab
                      icon={<FolderOpen className="h-6 w-6" />}
                      title="Cases & Blotter Records"
                      description="Blotter entries, VAWC cases, and other records linked to this resident will appear here."
                    />
                  </div>
                )}

                {active === "documents" && (
                  <PlaceholderTab
                    icon={<ScrollText className="h-6 w-6" />}
                    title="Generated Documents"
                    description="Certificates, clearances, and IDs issued to this resident will appear here."
                  />
                )}

                {active === "family" && (
                  <PlaceholderTab
                    icon={<Users className="h-6 w-6" />}
                    title="Family & Relatives"
                    description="Household members and linked relatives will appear here."
                  />
                )}

                {active === "activity" && (
                  <PlaceholderTab
                    icon={<Activity className="h-6 w-6" />}
                    title="Activity Log"
                    description="All actions on this record — creates, edits, views, prints, and document issuances — will be logged here."
                  />
                )}

              </div>
            )}
          </Tabs>
        </div>
        {/* ── End Right Panel ── */}

      </div>
    </div>
  );
}
