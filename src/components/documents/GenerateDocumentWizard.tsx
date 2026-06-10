"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText, Plus, Search, X, User, Save, Eye, Calendar, Hash,
  ArrowRight, ArrowLeft, Building2, MapPin, CreditCard, Sparkles,
  Shield, Loader2, IdCard, QrCode, Edit3, CheckCircle2, AlertTriangle,
  Wand2, Settings,
} from "lucide-react";
import { resolvePhotoUrl } from "@/lib/utils";
import { DocumentLivePreview } from "@/components/settings/DocumentLivePreview";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type {
  BarangaySettings, DocumentTemplate, IssuedDocument, IssueDocumentPayload,
  ResidentSummary,
} from "@/lib/types";

// ── Helper ──
const residentFullName = (r: ResidentSummary) =>
  [r.first_name, r.middle_name, r.last_name, r.extension_name].filter(Boolean).join(" ");

// ── Category groups ──
const CATEGORY_GROUPS = [
  {
    label: "Resident Certificates",
    icon: User,
    color: "text-blue-600",
    types: [
      "clearance", "residency", "indigency", "indigency_relative", "good_moral",
      "cedula", "late_registration", "live_in", "solo_parent", "low_income",
      "no_fixed_income", "vehicle_clearance", "no_record", "actual_occupancy",
      "calamity", "first_time_job_seeker", "senior_citizen", "pwd", "informal_employment",
    ],
  },
  {
    label: "Business / Establishment",
    icon: Building2,
    color: "text-emerald-600",
    types: ["business_clearance_new", "business_clearance_renewal", "business_closure"],
  },
  {
    label: "Lot / Building",
    icon: MapPin,
    color: "text-amber-600",
    types: ["lot_clearance", "building_clearance", "fencing_clearance", "excavation_clearance"],
  },
  {
    label: "ID Cards",
    icon: IdCard,
    color: "text-violet-600",
    types: ["barangay_id", "family_id", "staff_id"],
  },
];

const ID_CARD_CATEGORIES = ["barangay_id", "family_id", "staff_id"];

type WizardStep = "select-type" | "select-resident" | "fill-details";
type MabiniMsg = { role: "mabini" | "user"; text: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (doc: IssuedDocument) => void;
  initialResidentId?: string | null;
  initialTemplateCategory?: string | null;
}

export function GenerateDocumentWizard({
  open, onClose, onSuccess, initialResidentId, initialTemplateCategory,
}: Props) {
  const { user } = useAuth();
  const barangay = user?.barangay;

  // ── Core wizard state ──
  const [wizardStep, setWizardStep] = useState<WizardStep>("select-type");
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentSummary | null>(null);
  const [residentPreloaded, setResidentPreloaded] = useState(false);
  const [wizardTemplateMode, setWizardTemplateMode] = useState<"all" | "resident_certs" | "id_cards">("all");
  const [templateSearch, setTemplateSearch] = useState("");

  // ── Resident search ──
  const [residentSearch, setResidentSearch] = useState("");
  const [residentResults, setResidentResults] = useState<ResidentSummary[]>([]);
  const [residentLoading, setResidentLoading] = useState(false);

  // ── Document fields ──
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [purpose, setPurpose] = useState("");
  const [orNumber, setOrNumber] = useState("");
  const [orAmount, setOrAmount] = useState("");
  const [ctcNumber, setCtcNumber] = useState("");
  const [ctcDate, setCtcDate] = useState("");
  const [ctcPlace, setCtcPlace] = useState("");
  const [approvedByLeft, setApprovedByLeft] = useState("");
  const [approvedByRight, setApprovedByRight] = useState("");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split("T")[0]);

  // ── Mabini AI chat ──
  const [mabiniMessages, setMabiniMessages] = useState<MabiniMsg[]>([]);
  const [mabiniInput, setMabiniInput] = useState("");
  const [mabiniLoading, setMabiniLoading] = useState(false);
  const mabiniChatEndRef = useRef<HTMLDivElement>(null);

  // ── Preview edit mode ──
  const [previewMode, setPreviewMode] = useState<"preview" | "edit">("preview");
  const [manualContent, setManualContent] = useState<string | null>(null);

  // ── Barangay settings (signatory, layout) ──
  const [barangaySettings, setBarangaySettings] = useState<BarangaySettings | null>(null);

  // ── Saving ──
  const [saving, setSaving] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "info" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = (msg: string, type: "ok" | "err" | "info" = "ok") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch templates once ──
  useEffect(() => {
    if (!open || templatesLoaded) return;
    const run = async () => {
      try {
        const res = await api.documentTemplates.list({ is_active: true, per_page: 100 });
        const data = res.data || [];
        const unique = Object.values(data.reduce((acc, curr) => {
          if (!acc[curr.name] || curr.barangay_id) {
            acc[curr.name] = curr;
          }
          return acc;
        }, {} as Record<string, any>));
        setTemplates(unique as any);
        setTemplatesLoaded(true);
      } catch { /* silent */ }
    };
    run();
  }, [open, templatesLoaded]);

  // ── Fetch barangay settings once (for auto-fill signatory) ──
  useEffect(() => {
    if (!open || barangaySettings) return;
    api.settings.get().then((s) => {
      setBarangaySettings(s);
      // Auto-fill signatory from settings (only if not already set)
      setApprovedByRight((prev) => prev || s.settings?.default_signatory_name || "");
    }).catch(() => {});
  }, [open, barangaySettings]);

  // ── Preload resident when opened from residents page ──
  useEffect(() => {
    if (!open || !initialResidentId) return;
    const run = async () => {
      try {
        const resident = await api.residents.get(initialResidentId);
        setSelectedResident(resident);
        setResidentPreloaded(true);
        if (initialTemplateCategory && ID_CARD_CATEGORIES.includes(initialTemplateCategory)) {
          setWizardTemplateMode("id_cards");
        } else {
          setWizardTemplateMode("resident_certs");
        }
      } catch { /* silent */ }
    };
    run();
  }, [open, initialResidentId, initialTemplateCategory]);

  // ── Auto-pick template when opened with category ──
  useEffect(() => {
    if (!initialTemplateCategory || !residentPreloaded || templates.length === 0 || selectedTemplate) return;
    const match = templates.find((t) => t.category === initialTemplateCategory);
    if (!match) return;
    const fields: Record<string, string> = {};
    match.custom_inputs?.forEach((inp) => { fields[inp.name] = ""; });
    setSelectedTemplate(match);
    setCustomFields(fields);
    initMabiniChat(match, selectedResident);
    setWizardStep("fill-details");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, residentPreloaded]);

  // ── Reset everything on open ──
  useEffect(() => {
    if (open) {
      // Don't reset if initialResidentId is provided — preloading is already handled
      if (!initialResidentId) {
        resetWizard();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetWizard = () => {
    setWizardStep("select-type");
    setSelectedTemplate(null);
    setSelectedResident(null);
    setResidentPreloaded(false);
    setWizardTemplateMode("all");
    setResidentSearch("");
    setResidentResults([]);
    setCustomFields({});
    setPurpose("");
    setOrNumber("");
    setOrAmount("");
    setCtcNumber("");
    setCtcDate("");
    setCtcPlace("");
    setApprovedByLeft("");
    setApprovedByRight("");
    setIssuedDate(new Date().toISOString().split("T")[0]);
    setTemplateSearch("");
    setMabiniMessages([]);
    setMabiniInput("");
    setPreviewMode("preview");
    setManualContent(null);
    setSaving(false);
  };

  // ── Resident search debounce ──
  useEffect(() => {
    if (!residentSearch || residentSearch.length < 2) {
      setResidentResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setResidentLoading(true);
      try {
        const res = await api.residents.list({ search: residentSearch, per_page: 10 });
        setResidentResults(res.data);
      } catch { /* silent */ } finally {
        setResidentLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [residentSearch]);

  // ── Sync inline edits from contenteditable ──
  useEffect(() => {
    if (!open) return;
    const container = document.getElementById("document-preview-container");
    if (!container) return;

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.isContentEditable && target.dataset.mergeField) {
        const key = target.dataset.mergeField;
        const text = target.innerText.trim();
        if (key === "purpose") {
          setPurpose(text);
        } else if (key === "or_number") {
          setOrNumber(text);
        } else if (key === "or_amount") {
          setOrAmount(text);
        } else if (key === "ctc_number") {
          setCtcNumber(text);
        } else if (key === "ctc_date") {
          setCtcDate(text);
        } else if (key === "ctc_place") {
          setCtcPlace(text);
        } else {
          setCustomFields(prev => ({ ...prev, [key]: text }));
        }
      }
    };

    container.addEventListener("focusout", handleFocusOut);
    return () => container.removeEventListener("focusout", handleFocusOut);
  }, [open]);

  // ── Init Mabini chat ──
  const initMabiniChat = useCallback((tpl: DocumentTemplate, resident: ResidentSummary | null) => {
    const requiredFields = tpl.custom_inputs?.filter((i) => i.required) ?? [];
    const residentLine = resident ? `para kay **${residentFullName(resident)}**` : "";
    const fieldHints = requiredFields.length
      ? `Kailangan ko: ${requiredFields.map((f) => f.label).join(", ")}.`
      : "Walang required fields — pwede ka nang mag-Generate, o idagdag pa ang ibang detalye.";
    setMabiniMessages([{
      role: "mabini",
      text: `Hi! Mabini AI here. Tutulong ako sa pag-fill ng **${tpl.name}** ${residentLine}.\n\n${fieldHints}\n\nSabihin mo lang ang details — Filipino, English, o Taglish, okay lahat!`,
    }]);
    setMabiniInput("");
    setManualContent(null);
    setPreviewMode("preview");
  }, []);

  // ── Select template ──
  const handleSelectTemplate = (tpl: DocumentTemplate) => {
    setSelectedTemplate(tpl);
    const fields: Record<string, string> = {};
    tpl.custom_inputs?.forEach((inp) => { fields[inp.name] = ""; });
    setCustomFields(fields);
    if (tpl.constituent_type === "resident") {
      if (residentPreloaded && selectedResident) {
        initMabiniChat(tpl, selectedResident);
        setWizardStep("fill-details");
      } else {
        setWizardStep("select-resident");
      }
    } else {
      initMabiniChat(tpl, null);
      setWizardStep("fill-details");
    }
  };

  // ── Select resident ──
  const handleSelectResident = (r: ResidentSummary) => {
    setSelectedResident(r);
    if (selectedTemplate) initMabiniChat(selectedTemplate, r);
    setWizardStep("fill-details");
  };

  // ── Send Mabini message ──
  const sendMabiniMessage = async () => {
    if (!mabiniInput.trim() || !selectedTemplate || mabiniLoading) return;
    const userText = mabiniInput.trim();
    setMabiniInput("");
    setMabiniMessages((prev) => [...prev, { role: "user", text: userText }]);
    setMabiniLoading(true);
    setTimeout(() => mabiniChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const res = await api.issuedDocuments.aiFill({
        template_id: selectedTemplate.id,
        resident_id: selectedResident?.id ?? null,
        message: userText,
        current_fields: { ...customFields, purpose },
      });
      if (res.fields && Object.keys(res.fields).length > 0) {
        setCustomFields((prev) => ({ ...prev, ...res.fields }));
        if (res.fields.purpose !== undefined) setPurpose(res.fields.purpose);
        if (res.fields.or_number !== undefined) setOrNumber(res.fields.or_number);
        if (res.fields.approved_by_left !== undefined) setApprovedByLeft(res.fields.approved_by_left);
        if (res.fields.approved_by_right !== undefined) setApprovedByRight(res.fields.approved_by_right);
        // For custom docs, Mabini may return full_content
        if (res.fields.full_content !== undefined) {
          setManualContent(res.fields.full_content);
          setPreviewMode("preview");
        }
      }
      setMabiniMessages((prev) => [...prev, { role: "mabini", text: res.message }]);
    } catch (err: unknown) {
      const error = err as { status?: number; data?: { code?: string } };
      const isCredits = error?.status === 402 || error?.data?.code === "insufficient_credits";
      setMabiniMessages((prev) => [...prev, {
        role: "mabini",
        text: isCredits
          ? "Hindi ako makasagot — naubusan na ang AI credits ng barangay. Mag-fill na lang ng fields manually, o makipag-ugnayan sa inyong administrator para mag-top up."
          : "Sorry, may error sa AI. Pwede kang mag-type ulit o manually fill ang fields.",
      }]);
    } finally {
      setMabiniLoading(false);
      setTimeout(() => mabiniChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // ── Build merge values ──
  const buildPreviewValues = useCallback((): Record<string, string> => {
    const vals: Record<string, string> = {};
    if (selectedResident) {
      const dob = selectedResident.date_of_birth;
      const dobDate = dob ? new Date(dob.includes("T") ? dob : dob + "T00:00:00") : null;
      vals.full_name = residentFullName(selectedResident);
      vals.first_name = selectedResident.first_name ?? "";
      vals.last_name = selectedResident.last_name ?? "";
      vals.middle_name = selectedResident.middle_name ?? "";
      vals.age = dobDate ? String(new Date().getFullYear() - dobDate.getFullYear()) : "";
      vals.sex = selectedResident.sex
        ? selectedResident.sex.charAt(0).toUpperCase() + selectedResident.sex.slice(1) : "";
      vals.civil_status = selectedResident.civil_status ?? "";
      vals.address = [
        selectedResident.house_block_lot,
        selectedResident.purok ? `Purok ${selectedResident.purok}` : null,
        selectedResident.street,
      ].filter(Boolean).join(", ");
    }
    Object.assign(vals, customFields);
    vals.purpose = purpose;
    if (issuedDate) {
      vals.issued_date = new Date(issuedDate + "T00:00:00").toLocaleDateString("en-PH", {
        month: "long", day: "numeric", year: "numeric",
      });
    }
    return vals;
  }, [selectedResident, customFields, purpose, issuedDate]);

  const customConfigs = (selectedTemplate?.constituent_type === "establishment" ? barangaySettings?.settings?.customized_establishment_certificates : barangaySettings?.settings?.customized_resident_certificates) || [];
  const customConfig = customConfigs.find((c: any) => c.id === selectedTemplate?.id);
  const customSettings = customConfig?.design_settings || {};
  const useGlobalDesign = customConfig ? (customConfig.isGlobal ?? true) : true;
  const baseContent = (!useGlobalDesign && customSettings.custom_content) ? customSettings.custom_content : selectedTemplate?.content;

  const renderMergedHtml = useCallback((text: string): string => {
    const vals = buildPreviewValues();
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const isEditable = key === "purpose" || key.startsWith("or_") || key.startsWith("ctc_") || key.startsWith("custom_") || !vals[key];
      const val = vals[key] || "";
      if (isEditable) {
        return `<span contenteditable="true" data-merge-field="${key}" class="inline-block min-w-[60px] border-b border-dashed border-amber-500 bg-amber-50/50 hover:bg-amber-100/80 focus:bg-blue-50 focus:border-blue-500 focus:border-solid focus:outline-none transition-colors px-1 text-center font-semibold text-slate-900 cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-amber-600/70" data-placeholder="[ ${key.replace(/_/g, " ")} ]" title="Click to edit">${val}</span>`;
      }
      return `<span class="font-semibold text-slate-900">${val}</span>`;
    });
  }, [buildPreviewValues]);

  // ── Generate document ──
  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const payload: IssueDocumentPayload = {
        template_id: selectedTemplate.id,
        constituent_type: selectedTemplate.constituent_type || "resident",
        constituent_id: selectedResident?.id || "",
        purpose: purpose || undefined,
        or_number: orNumber || undefined,
        or_amount: orAmount ? parseFloat(orAmount) : undefined,
        ctc_number: ctcNumber || undefined,
        ctc_date: ctcDate || undefined,
        ctc_place: ctcPlace || undefined,
        approved_by_left: approvedByLeft || undefined,
        approved_by_right: approvedByRight || undefined,
        issued_date: issuedDate || undefined,
        custom_field_values: Object.keys(customFields).length > 0 ? customFields : undefined,
        custom_content: manualContent || undefined,
      };
      if (selectedTemplate.settings?.show_expiry && selectedTemplate.settings?.expiry_months) {
        const issued = new Date(issuedDate || Date.now());
        issued.setMonth(issued.getMonth() + selectedTemplate.settings.expiry_months);
        payload.valid_until = issued.toISOString().split("T")[0];
      }
      const result = await api.issuedDocuments.create(payload);
      onSuccess?.(result.issued_document);
      onClose();
      showToast(`Document generated — ${result.issued_document?.document_number ?? ""}`, "ok");
      if (result.issued_document?.pdf_url) {
        window.open(`/api/v1/issued-documents/${result.issued_document.id}/pdf`, "_blank");
      }
    } catch {
      showToast("Failed to generate document. Check your connection and try again.", "err");
    } finally {
      setSaving(false);
    }
  };

  // ── Step index for progress ──
  const STEPS = [
    { key: "select-type" as WizardStep, label: "Document Type" },
    { key: "select-resident" as WizardStep, label: "Select Resident" },
    { key: "fill-details" as WizardStep, label: "Fill & Preview" },
  ];
  const stepIndex = STEPS.findIndex((s) => s.key === wizardStep);

  // ── Back handler ──
  const handleBack = () => {
    if (wizardStep === "select-type") {
      onClose();
    } else if (wizardStep === "select-resident") {
      setWizardStep("select-type");
    } else if (wizardStep === "fill-details") {
      if (selectedTemplate?.constituent_type === "resident" && !residentPreloaded) {
        setWizardStep("select-resident");
      } else {
        setWizardStep("select-type");
      }
    }
  };

  // ── Filtered templates ──
  const configuredIds = [
    ...(Array.isArray(barangaySettings?.settings?.customized_resident_certificates) ? barangaySettings.settings.customized_resident_certificates : []),
    ...(Array.isArray(barangaySettings?.settings?.customized_establishment_certificates) ? barangaySettings.settings.customized_establishment_certificates : [])
  ].map((c: any) => c.id);
  const wizardFilteredTemplates = templates.filter((t) => {
    if (configuredIds && configuredIds.length > 0 && !configuredIds.includes(t.id)) return false;
    const matchesSearch = !templateSearch
      || t.name.toLowerCase().includes(templateSearch.toLowerCase())
      || t.category.toLowerCase().includes(templateSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (wizardTemplateMode === "resident_certs") {
      return t.constituent_type === "resident" && !ID_CARD_CATEGORIES.includes(t.category);
    }
    if (wizardTemplateMode === "id_cards") return ID_CARD_CATEGORIES.includes(t.category);
    return true;
  });

  // ── Required fields check (skip if user already edited preview manually) ──
  const hasRequiredFields = !manualContent && (
    selectedTemplate?.custom_inputs?.some((i) => i.required && !customFields[i.name]) ?? false
  );

  if (!open) return null;

  // ── Paper width class ──
  const paperSize = selectedTemplate?.settings?.paper_size ?? "short_bond";
  // Paper fills the preview container — padding on the container provides margins.
  // Height is content-driven (not capped), so long documents scroll naturally.
  const paperLabel = paperSize === "a4" ? "A4" : paperSize === "long_bond" ? "Legal (Long Bond)" : "Letter (Short Bond)";

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-[10000] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2",
          toast.type === "ok" && "bg-emerald-600 text-white",
          toast.type === "err" && "bg-red-600 text-white",
          toast.type === "info" && "bg-slate-800 text-white",
        )}>
          {toast.type === "ok" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {toast.type === "err" && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0 bg-background">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {wizardStep === "select-type" ? "Cancel" : "Back"}
          </button>

          <div className="text-center">
            <h1 className="text-base font-bold text-foreground">
              {wizardTemplateMode === "id_cards" ? "Generate ID Card" : "Generate Document"}
            </h1>
            {residentPreloaded && selectedResident && (
              <p className="text-xs text-[var(--accent-primary)] font-medium">
                {residentFullName(selectedResident)}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step progress bar ── */}
        <div className="px-5 py-2.5 border-b border-border/50 shrink-0 bg-muted/10">
          <div className="flex items-center gap-2 max-w-xs mx-auto">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all",
                    i < stepIndex && "bg-[var(--accent-primary)] text-white",
                    i === stepIndex && "bg-[var(--accent-primary)] text-white ring-2 ring-[var(--accent-primary)]/30",
                    i > stepIndex && "bg-muted text-muted-foreground",
                  )}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    i <= stepIndex ? "text-foreground" : "text-muted-foreground/60",
                  )}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 rounded-full transition-all",
                    i < stepIndex ? "bg-[var(--accent-primary)]" : "bg-muted",
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {/* ── Step 1: Select Document Type ── */}
          {wizardStep === "select-type" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-3xl mx-auto px-5 py-5 space-y-4">
                {/* Resident context banner */}
                {residentPreloaded && selectedResident && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--accent-bg)] border border-[var(--accent-primary)]/30">
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{residentFullName(selectedResident)}</p>
                      <p className="text-[11px] text-muted-foreground">{selectedResident.resident_number}</p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-white shrink-0">
                      {wizardTemplateMode === "id_cards" ? "ID Generation" : "Generating for resident"}
                    </span>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search document types..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                    autoFocus
                  />
                </div>

                {/* Category groups */}
                <div className="space-y-5">
                  {CATEGORY_GROUPS.map((group) => {
                    const groupTemplates = wizardFilteredTemplates.filter((t) =>
                      group.types.includes(t.category)
                    );
                    if (groupTemplates.length === 0) return null;
                    const Icon = group.icon;
                    return (
                      <div key={group.label}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Icon className={cn("w-4 h-4", group.color)} />
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {group.label}
                          </h3>
                          <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                            {groupTemplates.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {groupTemplates.map((tpl) => (
                            <button
                              key={tpl.id}
                              onClick={() => handleSelectTemplate(tpl)}
                              className={cn(
                                "text-left px-3.5 py-3 rounded-xl border transition-all hover:border-[var(--accent-primary)] hover:shadow-sm group",
                                selectedTemplate?.id === tpl.id
                                  ? "border-[var(--accent-primary)] bg-[var(--accent-bg)]"
                                  : "border-border bg-background hover:bg-muted/20"
                              )}
                            >
                              <div className="flex items-start gap-2.5">
                                <FileText className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-[var(--accent-primary)] shrink-0 transition-colors" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{tpl.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {tpl.settings?.show_expiry && tpl.settings?.expiry_months && (
                                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                        {tpl.settings.expiry_months}mo validity
                                      </span>
                                    )}
                                    {tpl.settings?.show_photo && (
                                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">Photo</span>
                                    )}
                                    {tpl.settings?.show_or && (
                                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">OR</span>
                                    )}
                                    {(tpl.custom_inputs?.length ?? 0) > 0 && (
                                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                        +{tpl.custom_inputs!.length} fields
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Uncategorized templates (not in CATEGORY_GROUPS but active) */}
                  {(() => {
                    const allKnown = CATEGORY_GROUPS.flatMap((g) => g.types);
                    const uncategorized = wizardFilteredTemplates.filter(
                      (t) => !allKnown.includes(t.category)
                    );
                    if (uncategorized.length === 0) return null;
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other</h3>
                          <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                            {uncategorized.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {uncategorized.map((tpl) => (
                            <button
                              key={tpl.id}
                              onClick={() => handleSelectTemplate(tpl)}
                              className="text-left px-3.5 py-3 rounded-xl border border-border bg-background hover:border-[var(--accent-primary)] hover:bg-muted/20 transition-all"
                            >
                              <div className="flex items-start gap-2.5">
                                <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                <p className="text-sm font-medium text-foreground truncate">{tpl.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Custom Document option */}
                  {(wizardTemplateMode === "all" || wizardTemplateMode === "resident_certs") && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Wand2 className="w-4 h-4 text-fuchsia-600" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom</h3>
                      </div>
                      <button
                        onClick={() => {
                          // Create a virtual template for custom documents
                          const customTpl: DocumentTemplate = {
                            id: "__custom__",
                            name: "Custom Document",
                            category: "custom",
                            constituent_type: "resident",
                            content: "",
                            title: null,
                            salutation: null,
                            settings: {},
                            approval_config: null,
                            custom_inputs: [],
                            custom_tables: null,
                            merge_fields: null,
                            status: "active",
                            sort_order: 999,
                            barangay_id: null,
                            created_at: "",
                            updated_at: "",
                          };
                          setSelectedTemplate(customTpl);
                          setCustomFields({});
                          setMabiniMessages([{
                            role: "mabini",
                            text: "Hi! Para sa Custom Document — sabihin mo lang kung anong klaseng dokumento ang kailangan mo. Hal: \"Gusto ko ng sertipiko ng pagiging miyembro ng barangay health team para kay Juan dela Cruz\" o kahit anong ibang dokumento. Gagawin ko ang buong content para sa iyo!",
                          }]);
                          setManualContent("");
                          setPreviewMode("edit");
                          setWizardStep("fill-details");
                        }}
                        className="w-full sm:w-auto text-left px-3.5 py-3 rounded-xl border border-dashed border-fuchsia-300 dark:border-fuchsia-800 bg-fuchsia-50/50 dark:bg-fuchsia-900/10 hover:border-fuchsia-500 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Wand2 className="w-4 h-4 text-fuchsia-600 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-fuchsia-700 dark:text-fuchsia-400">Custom Document</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Describe the document and Mabini AI generates it</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {wizardFilteredTemplates.length === 0 && !templateSearch && (
                    <div className="text-center py-16 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No document templates found</p>
                      <p className="text-xs mt-1">Add templates in Documents → Manage Templates</p>
                    </div>
                  )}

                  {wizardFilteredTemplates.length === 0 && templateSearch && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No results for &quot;{templateSearch}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Select Resident ── */}
          {wizardStep === "select-resident" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto px-5 py-5 space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border">
                  <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-sm font-medium">{selectedTemplate?.name}</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search resident by name, resident number..."
                    value={residentSearch}
                    onChange={(e) => setResidentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                    autoFocus
                  />
                </div>

                {residentLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!residentLoading && residentSearch.length >= 2 && residentResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No residents found for &quot;{residentSearch}&quot;</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  {residentResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectResident(r)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-[var(--accent-primary)] hover:bg-muted/20",
                        selectedResident?.id === r.id
                          ? "border-[var(--accent-primary)] bg-[var(--accent-bg)]"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{residentFullName(r)}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.resident_number} · {r.purok || "No purok"} · {r.sex}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {!residentSearch && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Type at least 2 characters to search</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Fill Details — Mabini AI + Live Preview ── */}
          {wizardStep === "fill-details" && selectedTemplate && (
            <div className="flex h-full min-h-0">

              {/* ── Left: Mabini AI Chat ── */}
              <div className="flex flex-col w-[38%] min-w-[300px] border-r border-border min-h-0">
                {/* Chat header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/20 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-amber-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">Mabini AI</p>
                    <p className="text-[10px] text-muted-foreground truncate">{selectedTemplate.name}</p>
                  </div>
                  {selectedResident && (
                    <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                      <User className="w-3 h-3 text-[var(--accent-primary)]" />
                      <span className="text-[10px] font-medium text-[var(--accent-primary)] max-w-[80px] truncate">
                        {selectedResident.first_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                  {mabiniMessages.map((msg, i) => (
                    <div key={i} className={cn("flex items-end gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "mabini" && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-amber-500 flex items-center justify-center shrink-0 mb-0.5">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[84%] px-3 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-[var(--accent-primary)] text-white rounded-2xl rounded-br-sm"
                          : "bg-muted/70 text-foreground rounded-2xl rounded-bl-sm"
                      )}>
                        {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                          part.startsWith("**") && part.endsWith("**")
                            ? <strong key={j}>{part.slice(2, -2)}</strong>
                            : part
                        )}
                      </div>
                    </div>
                  ))}
                  {mabiniLoading && (
                    <div className="flex items-end gap-2 justify-start">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-amber-500 flex items-center justify-center shrink-0 mb-0.5">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-muted/70 px-3 py-2.5 rounded-2xl rounded-bl-sm">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={mabiniChatEndRef} />
                </div>

                {/* Hint: required fields reminder */}
                {selectedTemplate.custom_inputs && selectedTemplate.custom_inputs.some((i) => i.required) && !manualContent && (
                  <div className="px-4 py-1.5 border-t border-border/50 bg-amber-50 dark:bg-amber-900/10 shrink-0">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      Required: {selectedTemplate.custom_inputs.filter((i) => i.required).map((i) => i.label).join(", ")} — tell Mabini above, or click <strong>Edit</strong> on the preview.
                    </p>
                  </div>
                )}

                {/* Input box */}
                <div className="px-4 py-3 border-t border-border shrink-0 bg-background">
                  <div className="flex gap-2">
                    <textarea
                      value={mabiniInput}
                      onChange={(e) => setMabiniInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMabiniMessage(); }
                      }}
                      placeholder={selectedTemplate.id === "__custom__"
                        ? "Describe the document you need..."
                        : "Sabihin mo ang detalye... (Enter to send)"}
                      rows={2}
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={sendMabiniMessage}
                      disabled={!mabiniInput.trim() || mabiniLoading}
                      className="px-3 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 self-stretch"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Shift+Enter for new line</p>
                </div>
              </div>

              {/* ── Right: Document Preview ── */}
              <div className="flex flex-col flex-1 min-h-0">
                {/* Preview header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
                  <div className="flex items-center gap-2">
                    {previewMode === "preview" ? (
                      <Eye className="w-4 h-4 text-[var(--accent-primary)]" />
                    ) : (
                      <Edit3 className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-xs font-bold text-foreground">
                      {previewMode === "preview" ? "Live Preview" : "Edit Content"}
                    </span>
                    {previewMode === "edit" && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                        Manual Override
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedTemplate.settings?.show_qr && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-medium">
                        <QrCode className="w-3 h-3" /> QR
                      </span>
                    )}
                    {selectedTemplate.settings?.show_doc_no && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-[10px] font-medium">
                        <Hash className="w-3 h-3" /> Doc No.
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                      <Shield className="w-3 h-3" /> Blockchain
                    </span>
                    {/* Edit toggle */}
                    <button
                      onClick={() => {
                        if (previewMode === "preview") {
                          const currentContent = manualContent ?? baseContent ?? "";
                          const rendered = renderMergedHtml(currentContent)
                            .replace(/<[^>]*>/g, "")
                            .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
                          setManualContent(rendered);
                          setPreviewMode("edit");
                        } else {
                          setPreviewMode("preview");
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors",
                        previewMode === "edit"
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {previewMode === "edit" ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                      {previewMode === "edit" ? "Preview" : "Edit"}
                    </button>
                  </div>
                </div>

                {/* Document paper area */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-slate-100 dark:bg-slate-900/50 px-8 py-6">
                  {previewMode === "edit" ? (
                    <textarea
                      value={manualContent ?? ""}
                      onChange={(e) => setManualContent(e.target.value)}
                      placeholder="Type or paste the document content here. You can use merge fields like {{full_name}}, {{address}}, {{purpose}}, etc."
                      className="w-full h-full min-h-[600px] bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8 text-sm text-slate-800 dark:text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                    />
                  ) : (
                    <div id="document-preview-container" className="flex flex-col items-center w-full">
                      {/* Paper size indicator */}
                      <div className="flex items-center justify-center gap-1.5 mb-3">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">{paperLabel}</span>
                      </div>
                      {(() => {
                        const customConfigs = (selectedTemplate?.constituent_type === "establishment" ? barangaySettings?.settings?.customized_establishment_certificates : barangaySettings?.settings?.customized_resident_certificates) || [];
                        const customConfig = customConfigs.find((c: any) => c.id === selectedTemplate.id);
                        const customSettings = customConfig?.design_settings || {};
                        const useGlobalDesign = customConfig ? (customConfig.isGlobal ?? true) : true;

                        const layoutToUse = useGlobalDesign ? barangaySettings?.settings?.document_layout : customSettings.document_layout;
                        const paperSizeToUse = selectedTemplate.settings?.paper_size || (useGlobalDesign ? barangaySettings?.settings?.document_paper_size : customSettings.document_paper_size);
                        const fontToUse = useGlobalDesign ? barangaySettings?.settings?.document_font : customSettings.document_font;
                        const colorThemeToUse = useGlobalDesign ? barangaySettings?.settings?.document_color_theme : customSettings.document_color_theme;
                        const designPatternToUse = useGlobalDesign ? barangaySettings?.settings?.document_design_pattern : customSettings.document_design_pattern;

                        return (
                          <DocumentLivePreview
                            layout={(layoutToUse as any) || "klasiko"}
                            paperSize={(paperSizeToUse as any) || "short_bond"}
                            font={(fontToUse as any) || "times"}
                            colorTheme={(colorThemeToUse as any) || "plain"}
                            designPattern={(designPatternToUse as any) || "wave"}
                            barangayName={barangaySettings?.name}
                        municipality={barangaySettings?.city_municipality}
                        province={barangaySettings?.province}
                        logoUrl={resolvePhotoUrl(barangaySettings?.logo_url)}
                        municipalityLogoUrl={resolvePhotoUrl(barangaySettings?.municipality_logo_url)}
                        signatoryName={approvedByRight || selectedTemplate.approval_config?.right?.label || barangaySettings?.settings?.default_signatory_name}
                        signatoryTitle={selectedTemplate.approval_config?.right?.position || barangaySettings?.settings?.default_signatory_title}
                        hideChrome={true}
                        fitToContainer={true}
                        contentTitle={selectedTemplate.title ?? selectedTemplate.name}
                        contentSalutation={selectedTemplate.salutation}
                        contentBodyHtml={renderMergedHtml(manualContent ?? baseContent ?? "")}
                        contentControlNo="(assigned on save)"
                        contentIssuedDate={issuedDate ? new Date(issuedDate + "T00:00:00").toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : undefined}
                      />
                        );
                      })()}
                      {/* Inline editing hint */}
                      <p className="mt-2 text-[10px] text-center text-amber-600/80 dark:text-amber-400/70 flex items-center justify-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Click the <span className="font-semibold underline underline-offset-2 decoration-dashed">underlined fields</span> in the document to type directly</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick fields bar */}
                <div className="px-4 py-2.5 border-t border-border shrink-0 bg-background space-y-2">
                  {/* Settings warning — shown if signatory not configured */}
                  {barangaySettings && !barangaySettings.settings?.default_signatory_name && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 flex-1">
                        Document signatory not configured.
                      </p>
                      <a
                        href="/dashboard/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
                      >
                        <Settings className="w-3 h-3" /> Settings
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">Date Issued</label>
                      <input
                        type="date"
                        value={issuedDate}
                        onChange={(e) => setIssuedDate(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">Purpose</label>
                      <input
                        type="text"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. Employment"
                        className="flex-1 px-2 py-1 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                      />
                    </div>
                    {selectedTemplate.settings?.show_or && (
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">OR #</label>
                        <input
                          type="text"
                          value={orNumber}
                          onChange={(e) => setOrNumber(e.target.value)}
                          placeholder="Optional"
                          className="w-28 px-2 py-1 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                        />
                      </div>
                    )}
                    {selectedTemplate.settings?.show_ctc && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">CTC #</label>
                        <input
                          type="text"
                          value={ctcNumber}
                          onChange={(e) => setCtcNumber(e.target.value)}
                          placeholder="Optional"
                          className="w-28 px-2 py-1 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom Action Bar ── */}
        <div className="flex items-center justify-between px-5 h-16 border-t border-border shrink-0 bg-muted/10">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {wizardStep === "select-type" ? "Cancel" : "Back"}
          </button>

          {wizardStep === "fill-details" && selectedTemplate && (
            <div className="flex items-center gap-3">
              {selectedTemplate.settings?.show_expiry && selectedTemplate.settings?.expiry_months && (
                <span className="text-[11px] text-muted-foreground">
                  Expires in {selectedTemplate.settings.expiry_months} month(s)
                </span>
              )}
              <button
                onClick={handleGenerate}
                disabled={saving || hasRequiredFields || (selectedTemplate.id === "__custom__" && !manualContent?.trim())}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                style={{ background: "var(--accent-primary)" }}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                ) : (
                  <><Save className="w-4 h-4" />Generate & Save</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


