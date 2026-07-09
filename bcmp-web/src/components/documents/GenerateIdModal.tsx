"use client";

import React, { useState, useEffect } from "react";
import {
  X, IdCard, Users, UserCheck, Loader2, CheckCircle2,
  Printer, AlertTriangle, Shield, ChevronRight,
} from "lucide-react";
import { cn, resolvePhotoUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import type { BarangaySettings, DocumentTemplate, IssuedDocument, ResidentDetail } from "@/lib/types";

// ── ID type definitions ──
const ID_TYPES = [
  {
    category: "barangay_id",
    label: "Barangay ID",
    desc: "Standard resident identification card",
    icon: IdCard,
    accent: "#7c3aed",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-700/50",
    borderHover: "hover:border-violet-500 dark:hover:border-violet-400",
    iconColor: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-600",
  },
  {
    category: "family_id",
    label: "Family ID",
    desc: "Household / family identification card",
    icon: Users,
    accent: "#059669",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-700/50",
    borderHover: "hover:border-emerald-500 dark:hover:border-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-600",
  },
  {
    category: "staff_id",
    label: "Staff ID",
    desc: "Barangay officials & staff card",
    icon: UserCheck,
    accent: "#d97706",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-700/50",
    borderHover: "hover:border-amber-500 dark:hover:border-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-600",
  },
] as const;

type IdCategory = typeof ID_TYPES[number]["category"];
type Step = "select" | "generating" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
  residentId: string | null;
  onSuccess?: (doc: IssuedDocument) => void;
}

export function GenerateIdModal({ open, onClose, residentId, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("select");
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [barangay, setBarangay] = useState<BarangaySettings | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IdCategory | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<IssuedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Load resident + templates when modal opens ──
  useEffect(() => {
    if (!open || !residentId) return;
    setStep("select");
    setSelectedCategory(null);
    setGeneratedDoc(null);
    setError(null);

    const loadData = async () => {
      setLoading(true);
      try {
        const [res, tplRes, barangaySettings] = await Promise.all([
          api.residents.get(residentId) as Promise<ResidentDetail>,
          api.documentTemplates.list({ per_page: 100 }),
          api.settings.get(),
        ]);
        setResident(res);
        setBarangay(barangaySettings);
        setTemplates(tplRes.data.filter((t) =>
          ["barangay_id", "family_id", "staff_id"].includes(t.category)
        ));
      } catch {
        setError("Failed to load resident data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [open, residentId]);

  if (!open) return null;

  const residentName = resident
    ? [resident.first_name, resident.middle_name, resident.last_name, resident.extension_name]
        .filter(Boolean).join(" ")
    : "Loading...";

  // ── Find template for a category ──
  const templateFor = (cat: IdCategory) => templates.find((t) => t.category === cat) ?? null;

  // ── Generate handler ──
  const handleGenerate = async (cat: IdCategory) => {
    const tpl = templateFor(cat);
    if (!tpl || !residentId) return;

    setSelectedCategory(cat);
    setStep("generating");
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      const expiryMonths = tpl.settings?.expiry_months ?? 12;
      const validUntilDate = new Date();
      validUntilDate.setMonth(validUntilDate.getMonth() + expiryMonths);
      const validUntil = validUntilDate.toISOString().split("T")[0];

      const result = await api.issuedDocuments.create({
        template_id: tpl.id,
        constituent_type: "resident",
        constituent_id: residentId,
        issued_date: today,
        valid_until: validUntil,
      });

      setGeneratedDoc(result.issued_document);
      setStep("done");
      onSuccess?.(result.issued_document);
    } catch {
      setError("Failed to generate ID. Please try again.");
      setStep("select");
    }
  };

  const selectedIdType = ID_TYPES.find((t) => t.category === selectedCategory);
  const selectedTemplate = selectedCategory ? templateFor(selectedCategory) : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step === "generating" ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <IdCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Generate ID Card</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-[260px]">{residentName}</p>
            </div>
          </div>
          {step !== "generating" && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Step: Select ID type ── */}
        {step === "select" && (
          <div className="p-5 space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {!loading && (
              <>
                <p className="text-xs text-muted-foreground px-0.5">Select the type of ID to generate:</p>
                <div className="space-y-2">
                  {ID_TYPES.map((idType) => {
                    const tpl = templateFor(idType.category);
                    const available = !!tpl;
                    const Icon = idType.icon;

                    return (
                      <button
                        key={idType.category}
                        onClick={() => available ? handleGenerate(idType.category) : undefined}
                        disabled={!available}
                        className={cn(
                          "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center gap-3",
                          available
                            ? cn(idType.bg, idType.border, idType.borderHover, "cursor-pointer group")
                            : "border-border bg-muted/20 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          available ? "bg-white dark:bg-slate-800 shadow-sm" : "bg-muted"
                        )}>
                          <Icon className={cn("w-5 h-5", available ? idType.iconColor : "text-muted-foreground")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-semibold",
                            available ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {idType.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{idType.desc}</p>
                          {!available && (
                           <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                              Template not configured — add in Documents → Templates
                            </p>
                          )}
                        </div>
                        {available && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Step: Generating ── */}
        {step === "generating" && (
          <div className="px-5 py-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: selectedIdType?.accent ?? "#7c3aed" }}>
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Generating {selectedIdType?.label}...</p>
              <p className="text-xs text-muted-foreground mt-1">Creating PDF and saving to records</p>
            </div>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === "done" && generatedDoc && resident && (
          <div className="p-5 space-y-4">
            {/* Success badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {selectedIdType?.label} generated — {generatedDoc.document_number}
              </p>
            </div>

            {/* ── ID Card Preview ── */}
            <IdCardPreview
              resident={resident}
              barangay={barangay}
              doc={generatedDoc}
              template={selectedTemplate}
              idType={selectedIdType ?? ID_TYPES[0]}
            />

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.open(`/api/v1/issued-documents/${generatedDoc.id}/pdf?t=${Date.now()}#zoom=page-width`, "_blank")}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
                style={{ background: selectedIdType?.accent ?? "#7c3aed" }}
              >
                <Printer className="w-4 h-4" />
                Print / Download PDF
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ID Card Preview Component ──
interface IdCardPreviewProps {
  resident: ResidentDetail;
  barangay: BarangaySettings | null;
  doc: IssuedDocument;
  template: DocumentTemplate | null;
  idType: typeof ID_TYPES[number];
}

function IdCardPreview({ resident, barangay, doc, template, idType }: IdCardPreviewProps) {
  const dobRaw = resident.date_of_birth;
  const dobDate = dobRaw ? new Date(dobRaw.includes("T") ? dobRaw : dobRaw + "T00:00:00") : null;
  const dobFormatted = dobDate
    ? dobDate.toLocaleDateString("en-PH", { month: "short", day: "2-digit", year: "numeric" })
    : "—";

  const isTambo = barangay?.name?.toLowerCase() === "tambo";
  const address = [
    resident.house_block_lot,
    resident.purok ? (isTambo ? resident.purok : `Purok ${resident.purok}`) : null,
    resident.street,
    barangay?.name ? `Barangay ${barangay.name}` : null,
    barangay?.city_municipality,
    barangay?.province,
  ].filter(Boolean).join(", ") || "—";

  const issuedFmt = doc.issued_date
    ? new Date(doc.issued_date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "2-digit", year: "numeric" })
    : "—";
  const validFmt = doc.valid_until
    ? new Date(doc.valid_until + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "2-digit", year: "numeric" })
    : "—";

  const signatoryLabel = template?.approval_config?.right?.label ?? "Punong Barangay";
  const barangayLogoUrl = resolvePhotoUrl(barangay?.seal_url ?? barangay?.logo_url);
  const municipalityLogoUrl = resolvePhotoUrl(barangay?.municipality_logo_url);
  const residentPhotoUrl = resolvePhotoUrl(resident.photo_url);
  const idTheme = idType.category === "family_id"
    ? { titleBg: "#14532d", title: "FAMILY I.D." }
    : idType.category === "staff_id"
      ? { titleBg: "#b45309", title: "OFFICIAL I.D." }
      : { titleBg: "#0a1d56", title: "BARANGAY I.D." };

  // CR80 aspect ratio: 85.6mm × 54mm
  if (isTambo) {
    const dobTamboFormatted = dobDate
      ? dobDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()
      : "—";
    const streetAddress = [
      resident.house_block_lot,
      resident.purok,
      resident.street,
    ].filter(Boolean).join(" ") || "—";

    return (
      <div
        className="w-full rounded overflow-hidden border-2 border-[#1a3a8c] shadow-md select-none relative flex flex-col"
        style={{ aspectRatio: "85.6/54", fontFamily: "'Arial', sans-serif", background: "#ffffff" }}
      >
        {/* ═══ HEADER CONTAINER — includes seals, text, waves, and the pill ═══ */}
        <div
          className="relative z-20 flex flex-col justify-between shrink-0"
          style={{
            height: "33%",
            paddingTop: "1.5%",
          }}
        >
          {/* Thick flowing blue ribbon wave curves — like the physical card */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            preserveAspectRatio="none"
            viewBox="0 0 400 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ribbon 1 — widest, lightest, in the middle */}
            <path
              d="M-10,45 C60,25 130,65 200,40 C270,15 340,55 410,35"
              stroke="#5ba3d9"
              strokeWidth="20"
              fill="none"
              opacity="0.4"
              strokeLinecap="round"
            />
            {/* Ribbon 2 — medium, flows through bottom area */}
            <path
              d="M-10,60 C70,40 140,75 210,52 C280,30 350,65 410,48"
              stroke="#3b8fd0"
              strokeWidth="14"
              fill="none"
              opacity="0.5"
              strokeLinecap="round"
            />
            {/* Ribbon 3 — thinner, more saturated, near bottom */}
            <path
              d="M-10,72 C80,55 150,85 220,65 C290,45 360,75 410,60"
              stroke="#2b7cc4"
              strokeWidth="10"
              fill="none"
              opacity="0.6"
              strokeLinecap="round"
            />
          </svg>

          {/* Upper section: Logos and text */}
          <div className="flex items-center justify-between px-[4%]" style={{ height: "65%" }}>
            {/* Left Seal */}
            <div
              className="relative z-10 shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden"
              style={{ width: "13%", aspectRatio: "1/1", boxShadow: "0 1px 3px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.95)" }}
            >
              {barangayLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={barangayLogoUrl} alt="Barangay seal" className="w-full h-full object-contain rounded-full" />
              ) : (
                <Shield className="w-4 h-4 text-blue-600" />
              )}
            </div>

            {/* Header Text */}
            <div className="relative z-10 flex-1 text-center min-w-0 px-1" style={{ lineHeight: 1.15 }}>
              <p style={{ fontSize: "5.5px", fontWeight: 600, color: "#1a3a6e", textTransform: "uppercase", letterSpacing: "0.1px", margin: 0, fontStyle: "italic" }}>
                Republic of the Philippines
              </p>
              <p style={{ fontSize: "6px", fontWeight: 900, color: "#0a1e5e", textTransform: "uppercase", letterSpacing: "0.2px", margin: "0.5px 0 0" }}>
                NATIONAL CAPITAL REGION
              </p>
              <p style={{ fontSize: "5.5px", fontWeight: 500, color: "#1a3a6e", textTransform: "uppercase", letterSpacing: "0.1px", margin: "0.5px 0 0" }}>
                City/Municipality of PARAÑAQUE
              </p>
              <p style={{ fontSize: "9.5px", fontWeight: 900, color: "#0a1050", letterSpacing: "0.3px", margin: "1px 0 0" }}>
                BARANGAY TAMBO
              </p>
            </div>

            {/* Right Seal */}
            <div
              className="relative z-10 shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden"
              style={{ width: "13%", aspectRatio: "1/1", boxShadow: "0 1px 3px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.95)" }}
            >
              {municipalityLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={municipalityLogoUrl} alt="Municipality seal" className="w-full h-full object-contain rounded-full" />
              ) : barangayLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={barangayLogoUrl} alt="Barangay seal" className="w-full h-full object-contain rounded-full" />
              ) : (
                <Shield className="w-4 h-4 text-blue-600" />
              )}
            </div>
          </div>

          {/* Lower section: BARANGAY I.D. Pill */}
          <div className="relative z-10 w-full flex items-center justify-center px-[4%] pb-[1.5%]" style={{ height: "28%" }}>
            <div
              className="w-full text-center font-black uppercase text-white flex items-center justify-center rounded-full py-[4px] mt-[20px]"
              style={{
                background: idTheme.titleBg,
                fontSize: "9.5px",
                letterSpacing: "2.5px",
                boxShadow: "0 1.5px 3px rgba(0,0,0,0.25)",
              }}
            >
              {idTheme.title}
            </div>
          </div>
        </div>

        {/* BODY CONTAINER */}
        <div
          className="flex flex-col bg-white px-[4%]"
          style={{ height: "67%", paddingTop: "20px", paddingBottom: "4px" }}
        >
          {/* TOP ROW: Photo + Right Column */}
          <div className="flex w-full gap-[8px]">
            {/* LEFT: Photo */}
            <div
              className="flex flex-col items-center justify-start shrink-0 p-[2px] bg-white"
              style={{ width: "32%" }}
            >
              {/* Photo box — square, fills column width */}
              <div
                className="w-full flex items-center justify-center overflow-hidden bg-white border-[2px] rounded-[4px]"
                style={{ borderColor: "#1a3a8c", aspectRatio: "1/1" }}
              >
                {residentPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={residentPhotoUrl} alt="Resident photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-300 text-center font-bold" style={{ fontSize: "8px", lineHeight: 1.2 }}>
                    2x2<br />PHOTO
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex-1 flex flex-col justify-start gap-[4px]">
              {/* I.D. NO row (Aligned with the top of the photo) */}
              <div className="flex items-start gap-[4px] pl-[2px] shrink-0 pt-[2px]">
                <div className="text-white font-black px-[4px] py-[1px] tracking-widest leading-none" style={{ background: "#1a3a8c", fontSize: "8.5px" }}>
                  I.D. NO.
                </div>
                <span className="font-black text-black tracking-widest leading-none" style={{ fontSize: "10.5px" }}>
                  {doc.document_number}
                </span>
              </div>

              {/* DETAILS OUTLINED BOX (Contains Text Details) */}
              <div className="border-[2px] border-[#1a3a8c] rounded-[8px] overflow-hidden bg-white flex flex-col justify-start gap-[6px] p-[15px] flex-1">
                
                {/* NAME */}
                <div className="flex items-end w-full">
                  <span className="font-bold text-black shrink-0 mr-[4px]" style={{ fontSize: "9px" }}>
                    NAME:
                  </span>
                  <div
                    className="flex-1 border-b-[1px] border-black text-black font-bold italic truncate pl-[2px] pb-[0.5px]"
                    style={{ fontSize: "10.5px", lineHeight: 1 }}
                  >
                    {resident.first_name}{resident.middle_name ? ` ${resident.middle_name.charAt(0)}.` : ""} {resident.last_name}{resident.extension_name ? ` ${resident.extension_name}` : ""}
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="flex flex-col gap-[3px]">
                  <div className="flex items-end w-full">
                    <span className="font-bold text-black shrink-0 mr-[4px]" style={{ fontSize: "9px" }}>
                      ADDRESS:
                    </span>
                    <div
                      className="flex-1 border-b-[1px] border-black text-black font-bold italic truncate pl-[2px] pb-[0.5px]"
                      style={{ fontSize: "9.5px", lineHeight: 1 }}
                    >
                      {streetAddress}
                    </div>
                  </div>
                  <div className="flex items-end w-full" style={{ paddingLeft: "48px" }}>
                    <div
                      className="flex-1 border-b-[1px] border-black text-black font-bold italic truncate text-center pb-[0.5px]"
                      style={{ fontSize: "9.5px", lineHeight: 1 }}
                    >
                      TAMBO, PARAÑAQUE CITY
                    </div>
                  </div>
                </div>

                {/* PLACE OF BIRTH */}
                <div className="flex items-end w-full">
                  <span className="font-bold text-black shrink-0 mr-[4px]" style={{ fontSize: "9px" }}>
                    PLACE OF BIRTH:
                  </span>
                  <div
                    className="flex-1 border-b-[1px] border-black text-black font-bold italic truncate pl-[2px] pb-[0.5px]"
                    style={{ fontSize: "9.5px", lineHeight: 1 }}
                  >
                    {resident.place_of_birth || "—"}
                  </div>
                </div>

                {/* DATE OF BIRTH */}
                <div className="flex items-end w-full">
                  <span className="font-bold text-black shrink-0 mr-[4px]" style={{ fontSize: "9px" }}>
                    DATE OF BIRTH:
                  </span>
                  <div
                    className="flex-1 border-b-[1px] border-black text-black font-bold italic truncate pl-[2px] pb-[0.5px]"
                    style={{ fontSize: "9.5px", lineHeight: 1 }}
                  >
                    {dobTamboFormatted}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Signature */}
          <div className="flex w-full gap-[8px]">
            <div
              className="flex flex-col items-center justify-start shrink-0 px-[2px]"
              style={{ width: "32%" }}
            >
              {/* Signature line */}
              <div className="w-full flex flex-col items-center mt-[12px] pb-[2px]">
                <div style={{ width: "85%", borderBottom: "1px solid #000", height: "1px" }} />
                <div className="text-black font-medium" style={{ fontSize: "6px", marginTop: "2px", letterSpacing: "0.2px", textAlign: "center" }}>
                  Bearers Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CR80 aspect ratio: 85.6mm × 54mm
  return (
    <div
      className="w-full rounded-lg overflow-hidden border-2 border-[#1a3a6e] shadow-md select-none"
      style={{ aspectRatio: "85.6/54", fontFamily: "sans-serif" }}
    >
      {/* Header band */}
      <div
        className="flex items-center gap-2 px-3"
        style={{ background: "#1a3a6e", height: "28%" }}
      >
        {/* Left seal */}
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          {barangayLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={barangayLogoUrl} alt="Barangay seal" className="w-8 h-8 object-contain rounded-full" />
          ) : (
            <Shield className="w-4 h-4 text-white/40" />
          )}
        </div>
        {/* Text */}
        <div className="flex-1 text-center min-w-0">
          <p className="text-white/70 uppercase tracking-widest leading-none" style={{ fontSize: "5px" }}>
            Republic of the Philippines
          </p>
          <p className="text-white font-bold uppercase tracking-wide leading-tight" style={{ fontSize: "11px" }}>
            Barangay {barangay?.name ?? "—"}
          </p>
          <p className="text-white/70 leading-none" style={{ fontSize: "5.5px" }}>
            {[barangay?.city_municipality, barangay?.province].filter(Boolean).join(", ")}
          </p>
        </div>
        {/* Right seal (mirror) */}
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          {municipalityLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={municipalityLogoUrl} alt="Municipality seal" className="w-8 h-8 object-contain rounded-full" />
          ) : barangayLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={barangayLogoUrl} alt="Barangay seal" className="w-8 h-8 object-contain rounded-full" />
          ) : (
            <Shield className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>

      {/* ID type label */}
      <div
        className="text-center font-bold uppercase tracking-widest leading-none py-0.5"
        style={{ background: idTheme.titleBg, fontSize: "6px", color: "#ffffff" }}
      >
        {idTheme.title}
      </div>

      {/* Body */}
      <div className="flex bg-white" style={{ height: "48%", color: "#1e293b" }}>
        {/* Photo column */}
        <div
          className="flex flex-col items-center justify-start pt-1.5 gap-1 shrink-0"
          style={{ width: "22%", borderRight: "0.5px solid #e5e7eb" }}
        >
          <div
            className="border bg-slate-50 flex items-center justify-center overflow-hidden"
            style={{ borderColor: "#1a3a6e", width: "80%", aspectRatio: "40/44" }}
          >
            {residentPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={residentPhotoUrl}
                alt={`${resident.first_name} ${resident.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-slate-300 text-center leading-tight" style={{ fontSize: "5px" }}>
                2×2<br />PHOTO
              </p>
            )}
          </div>
        </div>

        {/* Details column */}
        <div className="flex-1 flex flex-col justify-start px-2 pt-1.5 gap-0.5 min-w-0">
          {/* Name */}
          <div style={{ borderBottom: "0.75px solid #1a3a6e", paddingBottom: "2px", marginBottom: "2px" }}>
            <p style={{ fontSize: "4.5px", color: "#888", textTransform: "uppercase", letterSpacing: "0.2px" }}>Name</p>
            <p style={{ fontSize: "9.5px", fontWeight: "bold", color: "#1a3a6e", textTransform: "uppercase", lineHeight: 1.1 }}>
              {[resident.last_name, resident.first_name, resident.middle_name ? resident.middle_name.charAt(0) + "." : null]
                .filter(Boolean).join(", ")}
            </p>
          </div>

          {/* DOB / Sex / Blood Type */}
          <div className="flex gap-2">
            <div className="flex-1">
              <p style={{ fontSize: "4.5px", color: "#888", textTransform: "uppercase" }}>Date of Birth</p>
              <p style={{ fontSize: "6px", fontWeight: 600, borderBottom: "0.5px solid #e5e7eb", paddingBottom: "1px" }}>{dobFormatted}</p>
            </div>
            <div style={{ width: "22%" }}>
              <p style={{ fontSize: "4.5px", color: "#888", textTransform: "uppercase" }}>Sex</p>
              <p style={{ fontSize: "6px", fontWeight: 600, borderBottom: "0.5px solid #e5e7eb", paddingBottom: "1px" }}>
                {resident.sex ? resident.sex.charAt(0).toUpperCase() + resident.sex.slice(1) : "—"}
              </p>
            </div>
            <div style={{ width: "22%" }}>
              <p style={{ fontSize: "4.5px", color: "#888", textTransform: "uppercase" }}>Blood Type</p>
              <p style={{ fontSize: "6px", fontWeight: 600, borderBottom: "0.5px solid #e5e7eb", paddingBottom: "1px" }}>
                {resident.blood_type ?? "—"}
              </p>
            </div>
          </div>

          {/* Address */}
          <div>
            <p style={{ fontSize: "4.5px", color: "#888", textTransform: "uppercase" }}>Address</p>
            <p style={{ fontSize: "5.5px", fontWeight: 500, borderBottom: "0.5px solid #e5e7eb", paddingBottom: "1px", lineHeight: 1.2 }}>
              {address}
            </p>
          </div>

          {/* Emergency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <p style={{ fontSize: "4.5px", color: "#888", textTransform: "uppercase" }}>Emergency Contact</p>
              <p style={{ fontSize: "5.5px", fontWeight: 500, borderBottom: "0.5px solid #e5e7eb", paddingBottom: "1px" }}>
                {resident.emergency_contact_name ?? "—"}
              </p>
            </div>
            <div style={{ width: "38%" }}>
              <p style={{ fontSize: "4.5px", color: "#888", textTransform: "uppercase" }}>Contact No.</p>
              <p style={{ fontSize: "5.5px", fontWeight: 500, borderBottom: "0.5px solid #e5e7eb", paddingBottom: "1px" }}>
                {resident.emergency_contact_phone ?? resident.mobile_number ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer band */}
      <div
        className="flex items-center px-3 gap-3"
        style={{ height: "24%", background: "#f8fafc", borderTop: "0.75px solid #e2e8f0", color: "#1e293b" }}
      >
        {/* Validity */}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: "4px", color: "#888", textTransform: "uppercase" }}>Valid From / Until</p>
          <p style={{ fontSize: "6px", fontWeight: 600 }}>
            {issuedFmt} &nbsp;–&nbsp; {validFmt}
          </p>
          <p style={{ fontSize: "4px", color: "#aaa" }}>No. {doc.document_number}</p>
        </div>

        {/* Signatory */}
        <div className="text-center" style={{ width: "30%", flexShrink: 0 }}>
          <div style={{ borderTop: "0.75px solid #1a3a6e", marginBottom: "2px", marginTop: "4px" }} />
          <p style={{ fontSize: "5px", fontWeight: 700, color: "#1a3a6e", textTransform: "uppercase", lineHeight: 1.1 }}>
            {barangay?.captain_name ?? "—"}
          </p>
          <p style={{ fontSize: "4.5px", color: "#555", textTransform: "uppercase", letterSpacing: "0.2px" }}>
            {signatoryLabel}
          </p>
        </div>

        {/* QR placeholder */}
        <div
          className="flex items-center justify-center border border-slate-200 bg-white rounded"
          style={{ width: "24px", height: "24px", flexShrink: 0 }}
        >
          <div className="grid grid-cols-3 gap-px opacity-20">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={cn("w-1.5 h-1.5 bg-slate-900", i % 3 === 1 && "opacity-30")} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
