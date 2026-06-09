"use client";

import { useMemo } from "react";
import { QrCode } from "lucide-react";

type Layout = "klasiko" | "elegante" | "moderno" | "digital";
type PaperSize = "a4" | "letter" | "legal";
type Font = "times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair";
type ColorTheme =
  | "plain" | "blue" | "red" | "green" | "yellow"
  | "combo-flag" | "combo-festive" | "combo-earth" | "combo-gov"
  | "combo-bayanihan" | "combo-sunrise" | "combo-coastal" | "combo-heritage";
type DesignPattern =
  | "wave" | "gradient" | "bold" | "photo" | "minimal" | "stripe"
  | "wreath" | "sunburst" | "gothic" | "scroll" | "diplomatic" | "ornate"
  | "geometric" | "bold-stripe" | "tech";

interface Props {
  layout: Layout;
  paperSize: PaperSize;
  font: Font;
  colorTheme: ColorTheme;
  designPattern: DesignPattern;
  barangayName?: string | null;
  municipality?: string | null;
  province?: string | null;
  logoUrl?: string | null;
  municipalityLogoUrl?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
}

const ASPECT_RATIO: Record<PaperSize, string> = {
  a4: "1 / 1.414",
  letter: "1 / 1.294",
  legal: "1 / 1.529", // PH legal 8.5 x 13
};

const FONT_FAMILY: Record<Font, string> = {
  times: '"Times New Roman", Times, serif',
  arial: 'Arial, Helvetica, sans-serif',
  inter: 'var(--font-doc-inter), system-ui, sans-serif',
  poppins: 'var(--font-doc-poppins), system-ui, sans-serif',
  merriweather: 'var(--font-doc-merriweather), Georgia, serif',
  playfair: 'var(--font-playfair), Georgia, serif',
};

const FONT_LABEL: Record<Font, string> = {
  times: "Times New Roman", arial: "Arial", inter: "Inter",
  poppins: "Poppins", merriweather: "Merriweather", playfair: "Playfair Display",
};

const PAPER_LABEL: Record<PaperSize, string> = {
  a4: "A4 (210 × 297mm)",
  letter: "Letter (8.5 × 11in)",
  legal: "Legal PH (8.5 × 13in)",
};

const COLORS: Record<ColorTheme, { primary: string; accent: string; tint: string }> = {
  plain:            { primary: "#1f2937", accent: "#6b7280", tint: "#f3f4f6" },
  blue:             { primary: "#1e40af", accent: "#3b82f6", tint: "#dbeafe" },
  red:              { primary: "#991b1b", accent: "#ef4444", tint: "#fee2e2" },
  green:            { primary: "#15803d", accent: "#22c55e", tint: "#dcfce7" },
  yellow:           { primary: "#a16207", accent: "#eab308", tint: "#fef3c7" },
  "combo-flag":     { primary: "#1e40af", accent: "#991b1b", tint: "#fef3c7" },
  "combo-festive":  { primary: "#991b1b", accent: "#eab308", tint: "#fef3c7" },
  "combo-earth":    { primary: "#15803d", accent: "#1e40af", tint: "#dcfce7" },
  "combo-gov":      { primary: "#1e3a8a", accent: "#92400e", tint: "#fef3c7" },
  "combo-bayanihan":{ primary: "#991b1b", accent: "#1e40af", tint: "#fee2e2" },
  "combo-sunrise":  { primary: "#a16207", accent: "#991b1b", tint: "#fef3c7" },
  "combo-coastal":  { primary: "#1e40af", accent: "#15803d", tint: "#dbeafe" },
  "combo-heritage": { primary: "#991b1b", accent: "#15803d", tint: "#fee2e2" },
};

// Sample Barangay Clearance content — placeholders filled with realistic values.
const SAMPLE = {
  title: "BARANGAY CLEARANCE",
  salutation: "TO WHOM IT MAY CONCERN:",
  body: `This is to certify that PEDRO M. PENDUKO, 35 years old, single, Filipino, and a resident of Purok 5, is personally known to be a person of good moral character, trustworthy, diligent, and a law-abiding citizen.

Records on file with this office show that he has no pending case nor any derogatory record filed against his name.

This certification is being issued upon the request of the above-named person for LOCAL EMPLOYMENT purposes.`,
  controlNo: "BC-2026-00123",
  issuedDate: "May 16, 2026",
};

const SAMPLE_OFFICIALS = [
  { name: "Hon. Juan Dela Cruz", position: "Punong Barangay" },
  { name: "Hon. Maria Santos", position: "Kagawad" },
  { name: "Hon. Jose Reyes", position: "Kagawad" },
  { name: "Hon. Linda Ocampo", position: "Kagawad" },
  { name: "Hon. Rico Mendoza", position: "Kagawad" },
  { name: "Hon. Anna Garcia", position: "Kagawad" },
  { name: "Hon. Ben Lim", position: "Kagawad" },
  { name: "Hon. Carlos Tan", position: "Kagawad" },
  { name: "Mary Cruz", position: "SK Chairperson" },
  { name: "Ana Reyes", position: "Barangay Secretary" },
  { name: "Pablo Santos", position: "Barangay Treasurer" },
];

export function DocumentLivePreview({
  layout, paperSize, font, colorTheme, designPattern,
  barangayName, municipality, province, logoUrl, municipalityLogoUrl,
  signatoryName, signatoryTitle,
}: Props) {
  const c = COLORS[colorTheme] ?? COLORS.plain;
  const fontFamily = FONT_FAMILY[font];
  const docBarangay = (barangayName?.trim()) || "Barangay San Roque";
  const docMunicipality = (municipality?.trim()) || "City of Caloocan";
  const docProvince = (province?.trim()) || "Metro Manila";
  const docSignName = (signatoryName?.trim()) || "Hon. Juan Dela Cruz";
  const docSignTitle = (signatoryTitle?.trim()) || "PUNONG BARANGAY";

  const meta = useMemo(() => ({
    aspect: ASPECT_RATIO[paperSize],
    paperLabel: PAPER_LABEL[paperSize],
    fontLabel: FONT_LABEL[font],
  }), [paperSize, font]);

  // Klasiko & digital both use the sidebar layout
  const effectiveLayout = layout === "digital" ? "klasiko" : layout;

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30">Live Preview</span>
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[10px] text-muted-foreground">
          {meta.paperLabel} · {meta.fontLabel}
        </span>
      </div>

      <div className="flex justify-center">
        <div
          className="bg-white text-[#1a1a1a] shadow-xl border border-gray-200 overflow-hidden"
          style={{
            width: "min(100%, 560px)",
            aspectRatio: meta.aspect,
            fontFamily,
            color: "#1a1a1a",
          }}
        >
          {effectiveLayout === "klasiko" && (
            <KlasikoBody
              c={c}
              barangay={docBarangay}
              municipality={docMunicipality}
              province={docProvince}
              logoUrl={logoUrl ?? null}
              municipalityLogoUrl={municipalityLogoUrl ?? null}
              signName={docSignName}
              signTitle={docSignTitle}
              designPattern={designPattern}
            />
          )}
          {effectiveLayout === "elegante" && (
            <EleganteBody
              c={c}
              barangay={docBarangay}
              municipality={docMunicipality}
              province={docProvince}
              logoUrl={logoUrl ?? null}
              municipalityLogoUrl={municipalityLogoUrl ?? null}
              signName={docSignName}
              signTitle={docSignTitle}
              designPattern={designPattern}
            />
          )}
          {effectiveLayout === "moderno" && (
            <ModernoBody
              c={c}
              barangay={docBarangay}
              municipality={docMunicipality}
              province={docProvince}
              logoUrl={logoUrl ?? null}
              municipalityLogoUrl={municipalityLogoUrl ?? null}
              signName={docSignName}
              signTitle={docSignTitle}
              designPattern={designPattern}
            />
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-3">
        Sample content. Real certificate data is merged in at issuance.
      </p>
    </div>
  );
}

interface BodyProps {
  c: { primary: string; accent: string; tint: string };
  designPattern: DesignPattern;
  barangay: string;
  municipality: string;
  province: string;
  logoUrl: string | null;
  municipalityLogoUrl: string | null;
  signName: string;
  signTitle: string;
}

// ── Reusable building blocks ──────────────────────────────────────

function HeaderBlock({ c, barangay, municipality, province, logoUrl, municipalityLogoUrl, compact }: BodyProps & { compact?: boolean }) {
  const sealSize = compact ? 44 : 56;
  const titleSize = compact ? 13 : 16;
  return (
    <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: c.primary, borderBottomWidth: 2, borderBottomStyle: "double" }}>
      <div className="flex items-center justify-between gap-3">
        <Seal url={municipalityLogoUrl} size={sealSize} fallbackLabel="LGU" c={c} />
        <div className="flex-1 text-center">
          <p className="text-[8px] tracking-[0.18em] text-gray-600 uppercase">Republic of the Philippines</p>
          <p className="text-[9px] text-gray-700">Province of <span className="font-semibold">{province}</span></p>
          <p className="text-[10px] text-gray-800 font-semibold">{municipality}</p>
          <p
            className="font-bold uppercase tracking-wide"
            style={{ color: c.primary, fontSize: titleSize, lineHeight: 1.15, marginTop: 2 }}
          >
            {barangay}
          </p>
        </div>
        <Seal url={logoUrl} size={sealSize} fallbackLabel="BRGY" c={c} />
      </div>
    </div>
  );
}

function Seal({ url, size, fallbackLabel, c }: { url: string | null; size: number; fallbackLabel: string; c: BodyProps["c"] }) {
  if (url) {
    return (
      <div
        className="rounded-full overflow-hidden bg-white border flex-shrink-0"
        style={{ width: size, height: size, borderColor: c.primary }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="seal" className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div
      className="rounded-full border flex items-center justify-center bg-gray-50 flex-shrink-0"
      style={{ width: size, height: size, borderColor: c.primary }}
    >
      <span className="text-[7px] tracking-wider text-gray-500 font-semibold">{fallbackLabel}</span>
    </div>
  );
}

function QrAndControl({ c, controlNo, dateLabel }: { c: BodyProps["c"]; controlNo: string; dateLabel: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="border bg-white flex items-center justify-center flex-shrink-0"
        style={{ width: 40, height: 40, borderColor: c.primary }}
      >
        <QrCode className="w-6 h-6" style={{ color: c.primary }} />
      </div>
      <div className="text-[7px] leading-tight">
        <p className="font-semibold tracking-wider uppercase" style={{ color: c.primary }}>Control No.</p>
        <p className="text-gray-700">{controlNo}</p>
        <p className="text-gray-500">Issued: {dateLabel}</p>
      </div>
    </div>
  );
}

function SignatureLine({ c, name, title }: { c: BodyProps["c"]; name: string; title: string }) {
  return (
    <div className="text-center mt-3">
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: c.primary }}>{name}</p>
      <div className="h-px w-32 mx-auto my-0.5" style={{ background: c.primary }} />
      <p className="text-[8px] uppercase tracking-wider text-gray-700">{title}</p>
    </div>
  );
}

function Watermark({ c }: { c: BodyProps["c"] }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="rounded-full border-2 opacity-[0.06]" style={{ width: 220, height: 220, borderColor: c.primary }}>
        <div className="absolute inset-3 rounded-full border" style={{ borderColor: c.primary }} />
      </div>
    </div>
  );
}

function PatternDecor({
  c,
  designPattern,
}: {
  c: BodyProps["c"];
  designPattern: DesignPattern;
}) {
  switch (designPattern) {
    case "minimal":
      return <div className="absolute inset-x-8 top-6 h-px opacity-70 pointer-events-none" style={{ background: c.accent }} />;
    case "gradient":
      return <div className="absolute inset-x-0 top-0 h-10 opacity-20 pointer-events-none" style={{ background: `linear-gradient(90deg, ${c.primary}, ${c.accent})` }} />;
    case "wave":
      return (
        <>
          <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -left-px -right-px top-0 h-8 w-[calc(100%+2px)] opacity-30 pointer-events-none">
            <path d="M0,6 Q50,18 100,8 T200,10 L200,0 L0,0 Z" fill={c.primary} />
          </svg>
          <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -left-px -right-px bottom-0 h-8 w-[calc(100%+2px)] opacity-20 pointer-events-none">
            <path d="M0,20 Q50,2 100,12 T200,10 L200,20 L0,20 Z" fill={c.accent} />
          </svg>
        </>
      );
    case "bold":
    case "bold-stripe":
      return <div className="absolute inset-x-0 top-0 h-10 pointer-events-none" style={{ background: c.primary, opacity: designPattern === "bold" ? 0.18 : 0.28 }} />;
    case "stripe":
      return <div className="absolute top-0 bottom-0 left-[36%] w-1 opacity-35 pointer-events-none" style={{ background: c.primary }} />;
    case "photo":
      return <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: `radial-gradient(circle at 20% 20%, ${c.accent} 0, transparent 28%), radial-gradient(circle at 80% 70%, ${c.primary} 0, transparent 30%)` }} />;
    case "wreath":
      return (
        <>
          <div className="absolute top-2 left-2 w-12 h-12 rounded-full opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle, ${c.accent}, transparent 65%)` }} />
          <div className="absolute top-2 right-2 w-12 h-12 rounded-full opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle, ${c.accent}, transparent 65%)` }} />
        </>
      );
    case "sunburst":
      return <div className="absolute left-1/2 top-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] pointer-events-none" style={{ background: `conic-gradient(${c.accent} 0 12deg, transparent 12deg 24deg)` }} />;
    case "gothic":
      return <div className="absolute inset-x-0 top-0 h-6 pointer-events-none" style={{ background: "#111827", opacity: 0.14 }} />;
    case "scroll":
      return (
        <>
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full pointer-events-none" style={{ background: c.primary, opacity: 0.45 }} />
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full pointer-events-none" style={{ background: c.primary, opacity: 0.45 }} />
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full pointer-events-none" style={{ background: c.primary, opacity: 0.45 }} />
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full pointer-events-none" style={{ background: c.primary, opacity: 0.45 }} />
        </>
      );
    case "diplomatic":
      return (
        <>
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 opacity-40 pointer-events-none" style={{ borderColor: c.primary }} />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 opacity-40 pointer-events-none" style={{ borderColor: c.primary }} />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 opacity-40 pointer-events-none" style={{ borderColor: c.primary }} />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 opacity-40 pointer-events-none" style={{ borderColor: c.primary }} />
        </>
      );
    case "ornate":
      return <div className="absolute inset-3 border border-dashed opacity-30 pointer-events-none" style={{ borderColor: c.accent }} />;
    case "geometric":
      return (
        <>
          <div className="absolute top-0 right-0 w-16 h-16 opacity-15 pointer-events-none" style={{ background: `linear-gradient(135deg, ${c.primary} 0 50%, transparent 50% 100%)` }} />
          <div className="absolute bottom-0 left-0 w-16 h-16 opacity-10 pointer-events-none" style={{ background: `linear-gradient(315deg, ${c.accent} 0 50%, transparent 50% 100%)` }} />
        </>
      );
    case "tech":
      return <div className="absolute top-0 right-0 w-28 h-28 opacity-[0.12] pointer-events-none" style={{ background: `repeating-linear-gradient(135deg, ${c.accent} 0 2px, transparent 2px 6px)` }} />;
    default:
      return null;
  }
}

// ── KLASIKO — Classic Sidebar ─────────────────────────────────────

function KlasikoBody(props: BodyProps) {
  const { c, signName, signTitle, designPattern } = props;
  return (
    <div className="w-full h-full flex flex-col text-[8px] relative overflow-hidden">
      <PatternDecor c={c} designPattern={designPattern} />
      <HeaderBlock {...props} />

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar: officials + QR */}
        <aside className="w-[36%] flex-shrink-0 border-r flex flex-col" style={{ borderColor: c.primary + "33", background: c.tint }}>
          <div className="p-2 flex-1 overflow-hidden">
            <p className="text-[8px] font-bold uppercase tracking-wider mb-1 pb-1 border-b" style={{ color: c.primary, borderColor: c.primary + "55" }}>
              Sangguniang Barangay
            </p>
            <ul className="space-y-0.5 text-[7px] leading-tight">
              {SAMPLE_OFFICIALS.slice(0, 9).map((o) => (
                <li key={o.name}>
                  <p className="font-semibold text-gray-800">{o.name}</p>
                  <p className="text-gray-500">{o.position}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-2 border-t flex justify-center" style={{ borderColor: c.primary + "33", background: "white" }}>
            <QrAndControl c={c} controlNo={SAMPLE.controlNo} dateLabel={SAMPLE.issuedDate} />
          </div>
        </aside>

        {/* Right content */}
        <main className="flex-1 p-4 relative">
          <Watermark c={c} />
          <div className="relative">
            <h2
              className="text-center font-bold tracking-wider mb-2"
              style={{ color: c.primary, fontSize: 14, letterSpacing: 1 }}
            >
              {SAMPLE.title}
            </h2>
            <p className="text-[9px] font-semibold uppercase mb-2" style={{ color: c.primary }}>{SAMPLE.salutation}</p>
            <div className="text-[8px] text-justify leading-relaxed text-gray-800 whitespace-pre-line">{SAMPLE.body}</div>
            <SignatureLine c={c} name={signName} title={signTitle} />
          </div>
        </main>
      </div>

      <footer className="px-3 py-1 border-t flex items-center justify-between" style={{ borderColor: c.primary + "33", background: c.tint }}>
        <span className="text-[6px] tracking-wider uppercase text-gray-500">Not Valid Without Seal</span>
        <span className="text-[6px] tracking-wider uppercase" style={{ color: c.primary }}>{props.barangay}</span>
      </footer>
    </div>
  );
}

// ── ELEGANTE — Formal Government (ornate frame) ───────────────────

function EleganteBody(props: BodyProps) {
  const { c, signName, signTitle, designPattern } = props;
  return (
    <div className="w-full h-full p-2.5 relative overflow-hidden" style={{ background: c.tint }}>
      <PatternDecor c={c} designPattern={designPattern} />
      <div className="w-full h-full border-2 p-1.5" style={{ borderColor: c.primary }}>
        <div className="w-full h-full border bg-white flex flex-col text-[8px]" style={{ borderColor: c.accent, borderStyle: "dashed" }}>
          <HeaderBlock {...props} />

          <main className="flex-1 p-5 relative">
            <Watermark c={c} />
            <div className="relative max-w-[85%] mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-px flex-1" style={{ background: c.primary }} />
                <h2 className="font-bold tracking-[0.22em] uppercase" style={{ color: c.primary, fontSize: 14 }}>
                  {SAMPLE.title}
                </h2>
                <div className="h-px flex-1" style={{ background: c.primary }} />
              </div>
              <p className="text-[9px] font-semibold uppercase text-center mb-3" style={{ color: c.primary, letterSpacing: 1 }}>
                {SAMPLE.salutation}
              </p>
              <div className="text-[8px] text-justify leading-relaxed text-gray-800 whitespace-pre-line">{SAMPLE.body}</div>
              <SignatureLine c={c} name={signName} title={signTitle} />
            </div>
          </main>

          {/* Officials row (anti-epal compliant placement — below content) */}
          <div className="px-5 py-2 border-t" style={{ borderColor: c.primary + "33", background: c.tint }}>
            <p className="text-[7px] font-bold uppercase tracking-wider mb-1 text-center" style={{ color: c.primary }}>
              Sangguniang Barangay {props.barangay}
            </p>
            <div className="grid grid-cols-4 gap-1 text-[6px] leading-tight">
              {SAMPLE_OFFICIALS.slice(0, 8).map((o) => (
                <div key={o.name} className="text-center">
                  <p className="font-semibold text-gray-800 truncate">{o.name}</p>
                  <p className="text-gray-500 truncate">{o.position}</p>
                </div>
              ))}
            </div>
          </div>

          <footer className="px-4 py-1.5 border-t flex items-center justify-between" style={{ borderColor: c.primary }}>
            <QrAndControl c={c} controlNo={SAMPLE.controlNo} dateLabel={SAMPLE.issuedDate} />
            <span className="text-[6px] tracking-wider uppercase text-gray-500 text-right">Republic of the Philippines<br />Not Valid Without Seal</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ── MODERNO — Centered Modern (clean) ─────────────────────────────

function ModernoBody(props: BodyProps) {
  const { c, signName, signTitle, designPattern } = props;
  return (
    <div className="w-full h-full flex flex-col bg-white text-[8px] relative overflow-hidden">
      <PatternDecor c={c} designPattern={designPattern} />
      {/* Compact centered header */}
      <div className="px-4 pt-5 pb-3 text-center">
        <div className="flex items-center justify-center gap-3 mb-1.5">
          <Seal url={props.municipalityLogoUrl} size={36} fallbackLabel="LGU" c={c} />
          <Seal url={props.logoUrl} size={36} fallbackLabel="BRGY" c={c} />
        </div>
        <p className="text-[7px] tracking-[0.22em] text-gray-500 uppercase">Republic of the Philippines</p>
        <p className="text-[8px] text-gray-600">{props.province} · {props.municipality}</p>
        <p className="font-bold uppercase tracking-wide mt-1" style={{ color: c.primary, fontSize: 13 }}>{props.barangay}</p>
        <div className="h-px w-16 mx-auto mt-1.5" style={{ background: c.primary }} />
      </div>

      <main className="flex-1 px-8 pt-2 pb-3 relative">
        <Watermark c={c} />
        <div className="relative">
          <h2 className="text-center font-bold tracking-wider mb-1" style={{ color: c.primary, fontSize: 13, letterSpacing: 1 }}>
            {SAMPLE.title}
          </h2>
          <div className="h-0.5 w-12 mx-auto mb-3" style={{ background: c.accent }} />
          <p className="text-[9px] font-semibold mb-2 uppercase" style={{ color: c.primary }}>{SAMPLE.salutation}</p>
          <div className="text-[8px] text-justify leading-relaxed text-gray-800 whitespace-pre-line">{SAMPLE.body}</div>
          <SignatureLine c={c} name={signName} title={signTitle} />
        </div>
      </main>

      {/* Footer: officials grid + QR */}
      <div className="px-5 py-2 border-t" style={{ borderColor: c.primary + "22" }}>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <p className="text-[7px] font-bold uppercase tracking-wider mb-1" style={{ color: c.primary }}>Sangguniang Barangay</p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[6px] leading-tight">
              {SAMPLE_OFFICIALS.slice(0, 9).map((o) => (
                <div key={o.name}>
                  <p className="font-semibold text-gray-800 truncate">{o.name}</p>
                  <p className="text-gray-500 truncate">{o.position}</p>
                </div>
              ))}
            </div>
          </div>
          <QrAndControl c={c} controlNo={SAMPLE.controlNo} dateLabel={SAMPLE.issuedDate} />
        </div>
      </div>
    </div>
  );
}
