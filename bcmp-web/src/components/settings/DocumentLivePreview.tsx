"use client";

import { useMemo, useState, useRef, useEffect, memo } from "react";
import { QrCode, Plus, Bold, Italic, Underline, Type } from "lucide-react";

/** Plain template text → editor HTML; leave existing HTML unchanged. */
function toEditorHtml(text: string): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text.replace(/\n/g, "<br>");
}

type Layout = "klasiko" | "elegante" | "moderno" | "digital" | "tambo";
type PaperSize = "a4" | "letter" | "legal";
type Font = "times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair";
type ColorTheme =
  | "plain" | "blue" | "red" | "green" | "yellow"
  | "combo-flag" | "combo-festive" | "combo-earth" | "combo-gov"
  | "combo-bayanihan" | "combo-sunrise" | "combo-coastal" | "combo-heritage";
type DesignPattern =
  | "plain" | "wave" | "gradient" | "bold" | "photo" | "minimal" | "stripe"
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
  nationalLogoUrl?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  hideChrome?: boolean;
  fitToContainer?: boolean;
  fitScale?: number;
  contentTitle?: string;
  contentSalutation?: string | null;
  contentBodyHtml?: string;
  rawContent?: string;
  onContentChange?: (val: string) => void;
  onTitleChange?: (val: string) => void;
  onSalutationChange?: (val: string) => void;
  contentControlNo?: string;
  contentIssuedDate?: string;
  contentValidUntil?: string;
  contentRequestedBy?: string;
  contentPurpose?: string;
  contentOrNo?: string;
  contentOrAmount?: string;
  officials?: Array<{ name: string; position: string }>;
  isVillageCondo?: boolean;
  expiryMonths?: number;
  resident?: any;
  hideProfileTable?: boolean;
  showTamboResident?: boolean;
  showVillageCondo?: boolean;
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

const getValidityDaysText = (expiryMonths: number | undefined) => {
  const months = expiryMonths ?? 3;
  const days = months * 30;
  const daysToWordsMap: Record<number, string> = {
    30: "thirty (30)",
    60: "sixty (60)",
    90: "ninety (90)",
    120: "one hundred twenty (120)",
    150: "one hundred fifty (150)",
    180: "one hundred eighty (180)",
    360: "three hundred sixty (360)",
  };
  return daysToWordsMap[days] || `${days}`;
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

// Default intro paragraph for Barangay Tambo official clearance form.
export const TAMBO_CLEARANCE_INTRO =
  "This is to certify that the person whose name, signature and thumbmarks appear below has requested a clearance from this barangay and the result/s is/are stated below:";

const TAMBO_SAMPLE_RESIDENT = {
  full_name: "PEDRO M. PENDUKO",
  alias: "",
  date_of_birth: "January 15, 1991",
  age: "35",
  place_of_birth: "Parañaque City",
  civil_status: "Single",
  sex: "Male",
  citizenship: "Filipino",
  address: "Purok 5, Barangay Tambo, Parañaque City",
  remarks: "",
};

const SAMPLE = {
  barangay: "TAMBO",
  municipality: "Paranaque City",
  province: "Metro Manila",
  signName: "HON. JUAN DELA CRUZ",
  signTitle: "PUNONG BARANGAY",
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
  barangayName, municipality, province, logoUrl, municipalityLogoUrl, nationalLogoUrl,
  signatoryName, signatoryTitle, hideChrome, fitToContainer, fitScale = 1,
  contentTitle, contentSalutation, contentBodyHtml, rawContent, onContentChange, onTitleChange, onSalutationChange, contentControlNo, contentIssuedDate,
  contentValidUntil, contentRequestedBy, contentPurpose, contentOrNo, contentOrAmount, officials, isVillageCondo, expiryMonths, resident, hideProfileTable, showTamboResident, showVillageCondo
}: Props) {
  const c = COLORS[colorTheme] ?? COLORS.plain;
  const fontFamily = FONT_FAMILY[font];

  const displayTitle = contentTitle ?? (layout === "tambo" ? "BARANGAY CLEARANCE" : SAMPLE.title);
  const displaySalutation = contentSalutation !== undefined ? contentSalutation : SAMPLE.salutation;
  const displayBody = contentBodyHtml ?? (layout === "tambo" ? TAMBO_CLEARANCE_INTRO : SAMPLE.body);
  const displayRawContent = rawContent ?? (layout === "tambo" ? TAMBO_CLEARANCE_INTRO : SAMPLE.body);
  const displayControlNo = contentControlNo ?? SAMPLE.controlNo;
  const displayIssuedDate = contentIssuedDate ?? SAMPLE.issuedDate;

  const sharedProps: BodyProps = {
    c, designPattern,
    barangay: barangayName || SAMPLE.barangay,
    municipality: municipality || SAMPLE.municipality,
    province: province || SAMPLE.province,
    logoUrl: logoUrl || null,
    municipalityLogoUrl: municipalityLogoUrl || null,
    nationalLogoUrl: nationalLogoUrl || null,
    signName: signatoryName || SAMPLE.signName,
    signTitle: signatoryTitle || SAMPLE.signTitle,
    title: displayTitle,
    salutation: displaySalutation,
    bodyHtml: displayBody,
    rawContent: displayRawContent,
    onContentChange,
    onTitleChange,
    onSalutationChange,
    controlNo: displayControlNo,
    issuedDate: displayIssuedDate,
    validUntil: contentValidUntil || "Nov 16, 2026",
    requestedBy: contentRequestedBy ?? "JUAN MIGUEL SANTOS",
    purpose: contentPurpose ?? "LOCAL EMPLOYMENT",
    orNo: contentOrNo ?? "3270721",
    orAmount: contentOrAmount ?? "50.00",
    officials: officials !== undefined ? officials : SAMPLE_OFFICIALS,
    isVillageCondo: isVillageCondo ?? false,
    expiryMonths,
    resident,
    hideProfileTable,
    showTamboResident: showTamboResident ?? (displayTitle?.toLowerCase().includes("clearance") ? true : false),
    showVillageCondo: showVillageCondo ?? (displayTitle?.toLowerCase().includes("clearance") ? true : false),
  };

  const meta = useMemo(() => ({
    aspect: ASPECT_RATIO[paperSize],
    paperLabel: PAPER_LABEL[paperSize],
    fontLabel: FONT_LABEL[font],
  }), [paperSize, font]);

  // Klasiko & digital both use the sidebar layout
  const effectiveLayout = layout === "digital" ? "klasiko" : layout;

  const previewDocument = (
      <div
        className="bg-white text-[#1a1a1a] shadow-xl border border-gray-200 overflow-hidden"
        style={{
          width: fitToContainer ? "100%" : "560px",
          height: fitToContainer ? "100%" : undefined,
          aspectRatio: meta.aspect,
          fontFamily,
          color: "#1a1a1a",
          "--accent-primary": c.primary
        } as React.CSSProperties}
      >
        {effectiveLayout === "klasiko" && <KlasikoBody {...sharedProps} />}
        {effectiveLayout === "elegante" && <EleganteBody {...sharedProps} />}
        {effectiveLayout === "moderno" && <ModernoBody {...sharedProps} />}
        {effectiveLayout === "tambo" && <TamboClearanceBody {...sharedProps} />}
      </div>
    );

  if (hideChrome) {
    if (fitToContainer && fitScale !== 1) {
      return (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: meta.aspect }}>
          <div
            style={{
              width: "560px",
              transform: `scale(${fitScale})`,
              transformOrigin: "top left",
            }}
          >
            {previewDocument}
          </div>
        </div>
      );
    }
    return previewDocument;
  }

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
        {previewDocument}
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
  nationalLogoUrl: string | null;
  signName: string;
  signTitle: string;
  title: string;
  salutation: string | null;
  bodyHtml: string;
  rawContent?: string;
  onContentChange?: (val: string) => void;
  onTitleChange?: (val: string) => void;
  onSalutationChange?: (val: string) => void;
  controlNo: string;
  issuedDate: string;
  validUntil: string;
  requestedBy: string;
  purpose: string;
  orNo?: string;
  orAmount?: string;
  officials: Array<{ name: string; position: string }>;
  isVillageCondo: boolean;
  expiryMonths?: number;
  resident?: any;
  hideProfileTable?: boolean;
  showTamboResident?: boolean;
  showVillageCondo?: boolean;
}

function FormatToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const apply = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 mb-1.5 p-1 rounded-md border border-gray-200 bg-white/95 shadow-sm"
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        title="Bold"
        onClick={() => apply("bold")}
        className="p-1 rounded hover:bg-gray-100 text-gray-700 font-bold text-[11px] min-w-[22px]"
      >
        <Bold className="w-3 h-3 mx-auto" />
      </button>
      <button
        type="button"
        title="Italic"
        onClick={() => apply("italic")}
        className="p-1 rounded hover:bg-gray-100 text-gray-700 italic text-[11px] min-w-[22px]"
      >
        <Italic className="w-3 h-3 mx-auto" />
      </button>
      <button
        type="button"
        title="Underline"
        onClick={() => apply("underline")}
        className="p-1 rounded hover:bg-gray-100 text-gray-700 underline text-[11px] min-w-[22px]"
      >
        <Underline className="w-3 h-3 mx-auto" />
      </button>
      <span className="w-px h-4 bg-gray-200 mx-0.5" />
      <button
        type="button"
        title="Smaller text"
        onClick={() => apply("fontSize", "2")}
        className="p-1 rounded hover:bg-gray-100 text-gray-600 text-[9px] font-medium min-w-[22px]"
      >
        A
      </button>
      <button
        type="button"
        title="Normal text"
        onClick={() => apply("fontSize", "3")}
        className="p-1 rounded hover:bg-gray-100 text-gray-700 text-[11px] font-medium min-w-[22px]"
      >
        A
      </button>
      <button
        type="button"
        title="Larger text"
        onClick={() => apply("fontSize", "5")}
        className="p-1 rounded hover:bg-gray-100 text-gray-900 text-[13px] font-medium min-w-[22px]"
      >
        A
      </button>
      <span className="flex items-center gap-0.5 text-[7px] text-gray-400 ml-0.5">
        <Type className="w-2.5 h-2.5" />
        Format
      </span>
    </div>
  );
}

function FormatToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const apply = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 mb-1.5 p-1 rounded-md border border-gray-200 bg-white/95 shadow-sm"
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        title="Bold"
        onClick={() => apply("bold")}
        className="p-1 rounded hover:bg-gray-100 text-gray-700 font-bold text-[11px] min-w-[22px]"
      >
        <Bold className="w-3 h-3 mx-auto" />
      </button>
      <button
        type="button"
        title="Italic"
        onClick={() => apply("italic")}
        className="p-1 rounded hover:bg-gray-100 text-gray-700 italic text-[11px] min-w-[22px]"
      >
        <Italic className="w-3 h-3 mx-auto" />
      </button>
      <button
        type="button"
        title="Underline"
        onClick={() => apply("underline")}
        className="p-1 rounded hover:bg-gray-100 text-gray-700 underline text-[11px] min-w-[22px]"
      >
        <Underline className="w-3 h-3 mx-auto" />
      </button>
      <span className="w-px h-4 bg-gray-200 mx-0.5" />
      <button
        type="button"
        title="Smaller text"
        onClick={() => apply("fontSize", "2")}
        className="p-1 rounded hover:bg-gray-100 text-gray-600 text-[9px] font-medium min-w-[22px]"
      >
        A
      </button>
      <button
        type="button"
        title="Normal text"
        onClick={() => apply("fontSize", "3")}
        className="p-1 rounded hover:bg-gray-100 text-gray-700 text-[11px] font-medium min-w-[22px]"
      >
        A
      </button>
      <button
        type="button"
        title="Larger text"
        onClick={() => apply("fontSize", "5")}
        className="p-1 rounded hover:bg-gray-100 text-gray-900 text-[13px] font-medium min-w-[22px]"
      >
        A
      </button>
      <span className="flex items-center gap-0.5 text-[7px] text-gray-400 ml-0.5">
        <Type className="w-2.5 h-2.5" />
        Format
      </span>
    </div>
  );
}

const AVAILABLE_TAGS = [
  { tag: "{{full_name}}", desc: "Resident's full name" },
  { tag: "{{alias}}", desc: "Resident's alias/es" },
  { tag: "{{date_of_birth}}", desc: "Birthdate" },
  { tag: "{{age}}", desc: "Current age" },
  { tag: "{{place_of_birth}}", desc: "Birthplace" },
  { tag: "{{civil_status}}", desc: "Single, Married, etc." },
  { tag: "{{sex}}", desc: "Sex" },
  { tag: "{{citizenship}}", desc: "Citizenship" },
  { tag: "{{address}}", desc: "Complete address" },
];



const EditorArea = memo(({ initialHtml, onInput, onBlur, className, style, innerRef }: any) => {
  return (
    <div
      ref={innerRef}
      contentEditable
      suppressContentEditableWarning
      autoFocus
      onInput={onInput}
      onBlur={onBlur}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: initialHtml }}
    />
  );
}, () => true);

// Reusable inline click-to-edit text component
function EditableTextInner({
  initialValue,
  onChange,
  onBlur,
  className,
  style,
}: {
  initialValue: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Set the text once on mount — never update it so React leaves the cursor alone
  useEffect(() => {
    if (ref.current) {
      ref.current.innerText = initialValue;
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      ref.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.innerText)}
      onBlur={onBlur}
      className={`${className} outline-none ring-[1.5px] ring-[var(--accent-primary)] rounded-sm font-inherit text-black shadow-inner cursor-text relative z-10 bg-white px-2`}
      style={style}
    />
  );
}

function EditableText({
  value,
  onChange,
  className,
  style,
  placeholder,
  tag = "div",
  title = "Click to edit"
}: {
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  tag?: "div" | "h2" | "p" | "span";
  title?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const snapshotRef = useRef(value);

  if (isEditing && onChange) {
    return (
      <EditableTextInner
        initialValue={snapshotRef.current}
        onChange={onChange}
        onBlur={() => setIsEditing(false)}
        className={className}
        style={style}
      />
    );
  }

  const Tag = tag;

  return (
    <Tag
      className={`${className} ${onChange ? 'hover:bg-blue-50/50 hover:ring-[1.5px] hover:ring-[var(--accent-primary)] cursor-pointer rounded-sm transition-all' : ''}`}
      style={style}
      onClick={() => {
        if (onChange) {
          snapshotRef.current = value;
          setIsEditing(true);
        }
      }}
      title={onChange ? title : undefined}
    >
      {value || placeholder || ""}
    </Tag>
  );
}

// Editable body wrapper for click-to-edit support
function EditableBody({ 
  className, bodyHtml, rawContent, onContentChange 
}: { 
  className: string; bodyHtml: string; rawContent?: string; onContentChange?: (v: string) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const [showTags, setShowTags] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const initialContent = useRef(rawContent || "");

  const syncHtml = () => {
    if (editorRef.current && onContentChange) {
      onContentChange(editorRef.current.innerHTML);
    }
  };

  const insertTag = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertText", false, tag);
      setShowTags(false);
      syncHtml();
    }
  };

  if (isEditing && onContentChange) {
    return (
      <div className="relative w-full group">
        <FormatToolbar editorRef={editorRef} />
        <EditorArea
          innerRef={editorRef}
          initialHtml={toEditorHtml(initialContent.current)}
          onInput={() => syncHtml()}
          onBlur={() => {
            syncHtml();
            setIsEditing(false);
          }}
          className={`${className} outline-none ring-[1.5px] ring-[var(--accent-primary)] rounded-sm font-inherit text-black shadow-inner whitespace-pre-wrap cursor-text relative z-10`}
          style={{ 
            display: 'block', 
            width: '100%', 
            minWidth: '100%', 
            minHeight: Math.max(minHeight || 0, 280) + 'px',
            paddingRight: '28px' // Prevent text from hiding under the button
          }}
        />
        
        {/* Floating Variable Picker */}
        <div className="absolute top-1.5 right-1.5 z-50">
          <button
            onMouseDown={(e) => { e.preventDefault(); setShowTags(!showTags); }}
            className="p-1 rounded bg-white/90 border border-gray-200 shadow-sm text-gray-500 hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors backdrop-blur-sm cursor-pointer"
            title="Insert Variable"
          >
            <Plus className="w-[14px] h-[14px]" />
          </button>
          
          {showTags && (
            <div 
              className="absolute top-full right-0 mt-1 w-[160px] bg-white rounded shadow-xl border border-gray-200 overflow-hidden"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="bg-gray-50 px-2 py-1.5 border-b border-gray-100 text-[7px] font-semibold text-gray-600 uppercase tracking-wider text-left">
                Insert Variable
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {AVAILABLE_TAGS.map(t => (
                  <li key={t.tag}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); insertTag(t.tag); }}
                      className="w-full text-left px-2 py-1.5 hover:bg-blue-50/50 transition-colors flex flex-col gap-0.5 border-b border-gray-100 last:border-0 cursor-pointer"
                    >
                      <span className="text-[8.5px] font-mono font-bold text-blue-700">{t.tag}</span>
                      <span className="text-[7px] text-gray-500">{t.desc}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${className} block min-w-full ${onContentChange ? 'hover:bg-blue-50/50 hover:ring-[1.5px] hover:ring-[var(--accent-primary)] cursor-pointer rounded-sm transition-all' : ''}`}
      dangerouslySetInnerHTML={{ __html: bodyHtml || "&nbsp;" }} 
      onClick={(e) => {
        if (onContentChange) {
          initialContent.current = rawContent || bodyHtml || "";
          setMinHeight(e.currentTarget.clientHeight);
          setIsEditing(true);
        }
      }}
      title={onContentChange ? "Click to edit template content" : undefined}
      style={{ minHeight: '280px' }}
    />
  );
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

function formatMunicipalityLine(municipality?: string | null): string {
  const raw = (municipality ?? "").trim();
  if (!raw) return "";
  if (/^city of /i.test(raw) || /^municipality of /i.test(raw)) return raw.toUpperCase();
  if (/\s+city$/i.test(raw)) return `CITY OF ${raw.replace(/\s+city$/i, "").toUpperCase()}`;
  if (/\s+municipality$/i.test(raw)) return raw.toUpperCase();
  return `CITY OF ${raw.toUpperCase()}`;
}

function CenteredModernHeader({
  props,
  showTitle = false,
}: {
  props: BodyProps;
  showTitle?: boolean;
}) {
  const { c, barangay, municipality, province, logoUrl, municipalityLogoUrl, nationalLogoUrl, title } = props;
  const officeName = `Office of ${barangay.replace(/^(brgy\.?\s*|barangay\s*)/i, "")} Barangay Council`;

  return (
    <div className="px-4 pt-5 pb-3 text-center">
      <div className="flex items-center justify-center gap-3 mb-1.5">
        <Seal url={logoUrl} size={36} fallbackLabel="BRGY" c={c} />
        {nationalLogoUrl && <Seal url={nationalLogoUrl} size={36} fallbackLabel="PH" c={c} />}
        <Seal url={municipalityLogoUrl} size={36} fallbackLabel="LGU" c={c} />
      </div>
      <p className="text-[6.5px] tracking-[0.22em] text-gray-500 uppercase">Republic of the Philippines</p>
      <p className="text-[8.5px] font-bold text-gray-800 uppercase tracking-wide mt-0.5">
        {formatMunicipalityLine(municipality)}
      </p>
      <p className="text-[6.5px] tracking-[0.15em] text-gray-500 uppercase mt-0.5">{province}</p>
      <p className="font-medium text-gray-800 text-[9.5px] tracking-wide mt-1">{officeName}</p>
      <div className="h-px w-16 mx-auto mt-1.5" style={{ background: c.primary }} />
      {showTitle && (
        <div className="mt-3">
          <EditableText
            tag="h2"
            value={title}
            onChange={props.onTitleChange}
            className="text-center font-bold tracking-wider w-full"
            style={{ color: c.primary, fontSize: 13, letterSpacing: 1 }}
            title="Click to edit document title"
          />
          <div className="h-0.5 w-12 mx-auto mt-1" style={{ background: c.accent }} />
        </div>
      )}
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
  const {
    c, signName, signTitle, designPattern, title, salutation, bodyHtml,
    controlNo, issuedDate, validUntil, requestedBy, purpose, barangay,
  } = props;
  return (
    <div className="w-full h-full flex flex-col text-[8px] relative overflow-hidden bg-white">
      <PatternDecor c={c} designPattern={designPattern} />
      <HeaderBlock {...props} />

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <aside className="w-[36%] flex-shrink-0 border-r flex flex-col z-10 relative" style={{ borderColor: c.primary + "33", background: c.tint }}>
          <div className="p-3 flex-1 overflow-hidden flex flex-col">
            <div className="text-center mb-3">
              <p className="text-[7.5px] font-bold tracking-[0.15em] leading-tight" style={{ color: c.primary }}>SANGGUNIANG BARANGAY</p>
              <p className="text-[8px] font-bold tracking-widest mt-0.5" style={{ color: c.primary }}>2024 — 2026</p>
            </div>
            
            <div className="h-px w-full mb-3" style={{ background: c.primary + "55" }} />
            
            <ul className="space-y-3 text-center flex-1 overflow-hidden">
              {props.officials.slice(0, 7).map((o) => (
                <li key={o.name}>
                  <p className="font-bold text-[7px] uppercase tracking-wide" style={{ color: c.primary }}>{o.name}</p>
                  <p className="text-[6px] italic text-gray-700">{o.position}</p>
                </li>
              ))}
            </ul>

            <div className="mt-2">
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="h-px flex-1" style={{ background: c.primary + "44" }} />
                <div className="w-1.5 h-1.5 rotate-45" style={{ background: c.primary + "88" }} />
                <div className="h-px flex-1" style={{ background: c.primary + "44" }} />
              </div>
              
              <div className="space-y-1 mb-2">
                <div className="flex justify-between items-center text-[6px]">
                  <span className="uppercase tracking-widest italic text-gray-600">ISSUED</span>
                  <span className="font-bold" style={{ color: c.primary }}>{issuedDate}</span>
                </div>
                <div className="flex justify-between items-center text-[6px]">
                  <span className="uppercase tracking-widest italic text-gray-600">VALID UNTIL</span>
                  <span className="font-bold" style={{ color: c.primary }}>{validUntil}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-[1.5px] p-2 flex flex-col items-center z-10" style={{ borderColor: c.primary, background: c.tint }}>
            <p className="text-[6px] font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: c.primary }}>VERIFY DOCUMENT</p>
            <div className="border-[1.5px] p-0.5 bg-white" style={{ borderColor: c.primary }}>
              <QrCode className="w-10 h-10" strokeWidth={1.5} style={{ color: c.primary }} />
            </div>
          </div>
        </aside>

        {/* Right content */}
        <main className="flex-1 p-6 relative z-10 bg-white/40">
          <Watermark c={c} />
          <div className="relative z-10 h-full flex flex-col">
            <div className="text-center mb-6">
              <EditableText
                tag="h2"
                value={title}
                onChange={props.onTitleChange}
                className="font-bold tracking-[0.2em] text-[13px]"
                style={{ color: c.primary }}
                title="Click to edit document title"
              />
              <div className="h-1.5 rounded-full w-[70%] mx-auto mt-2 opacity-80" style={{ background: c.accent }} />
            </div>
            

            
            <EditableBody 
              className="text-[7.5px] text-justify leading-[1.6] text-gray-800 whitespace-pre-line mb-4" 
              bodyHtml={props.bodyHtml} rawContent={props.rawContent} onContentChange={props.onContentChange} 
            />

            
            {!title?.toLowerCase().includes("clearance") && (
              <div className="text-[6.5px] mb-8 ml-8">
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                  <span className="font-bold" style={{ color: c.primary }}>Requested By:</span>
                  <span className="uppercase text-gray-800">{requestedBy}</span>
                  <span className="font-bold" style={{ color: c.primary }}>Purpose:</span>
                  <span className="uppercase text-gray-800">{purpose}</span>
                </div>
              </div>
            )}
            

            
            <div className="mt-auto self-end text-center w-40">
              <p className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color: c.primary }}>{signName}</p>
              <div className="h-px w-full my-1" style={{ background: c.primary + "88" }} />
              <p className="text-[6px] uppercase tracking-widest text-gray-600">{signTitle}</p>
            </div>
          </div>
        </main>
      </div>

      <footer className="px-3 py-1.5 flex items-center justify-between z-10 border-t" style={{ borderColor: c.primary + "33", background: c.tint }}>
        <span className="text-[6px] tracking-wider uppercase text-gray-500 flex items-center gap-4">
          {!title?.toLowerCase().includes("clearance") && <span>{controlNo}</span>}
          {(props.showTamboResident || props.showVillageCondo) && (
            <span className="flex items-center gap-3 select-none font-sans font-medium text-[5.5px] tracking-normal text-gray-600 normal-case">
              {props.isVillageCondo && props.showVillageCondo && (
                <span className="flex items-center gap-0.5">
                  <span className="text-[7px] font-mono" style={{ color: c.primary }}>☑</span>
                  <span>Village/Condo Resident</span>
                </span>
              )}
              {!props.isVillageCondo && props.showTamboResident && (
                <span className="flex items-center gap-0.5">
                  <span className="text-[7px] font-mono" style={{ color: c.primary }}>☑</span>
                  <span>Official Tambo Resident</span>
                </span>
              )}
            </span>
          )}
        </span>
        {title?.toLowerCase().includes("clearance") ? (
          <span className="text-[5px] font-bold italic text-right leading-tight max-w-[280px]" style={{ color: c.accent }}>
            Note: This clearance is valid only for {getValidityDaysText(props.expiryMonths)} days from the date of issue. Not valid without the official seal.
          </span>
        ) : (
          <span className="text-[6px] tracking-wider uppercase text-gray-500 font-semibold">NOT VALID WITHOUT SEAL</span>
        )}
      </footer>
    </div>
  );
}

// ── ELEGANTE — Formal Government (ornate frame) ───────────────────

function EleganteBody(props: BodyProps) {
  const { c, signName, signTitle, designPattern, title, salutation, bodyHtml, controlNo, issuedDate } = props;
  return (
    <div className="w-full h-full p-2.5 relative overflow-hidden" style={{ background: c.tint }}>
      <PatternDecor c={c} designPattern={designPattern} />
      <div className="w-full h-full border-2 p-1.5" style={{ borderColor: c.primary }}>
        <div className="w-full h-full border bg-white flex flex-col text-[8px]" style={{ borderColor: c.accent, borderStyle: "dashed" }}>
          <HeaderBlock {...props} compact={true} />

          <main className="flex-1 px-4 pt-3 pb-2 relative flex flex-col min-h-0 overflow-hidden">
            <Watermark c={c} />
            <div className="relative max-w-[94%] mx-auto w-full flex-1 flex flex-col">
              <div className="flex items-center justify-center gap-3 mb-2 w-full shrink-0">
                <div className="shrink-0" style={{ background: c.primary, width: "15px", height: "1px" }} />
                <EditableText
                  tag="h2"
                  value={title}
                  onChange={props.onTitleChange}
                  className="font-bold tracking-[0.22em] uppercase text-center shrink-0"
                  style={{ color: c.primary, fontSize: 11.5, display: "inline-block" }}
                  title="Click to edit document title"
                />
                <div className="shrink-0" style={{ background: c.primary, width: "15px", height: "1px" }} />
              </div>

              <EditableBody 
                className="text-[7.5px] text-justify leading-relaxed text-gray-800 whitespace-pre-line mb-3" 
                bodyHtml={props.bodyHtml} rawContent={props.rawContent} onContentChange={props.onContentChange} 
              />




            </div>
          </main>

          {/* Officials row (anti-epal compliant placement — below content) */}
          <div className="px-5 py-1.5 border-t shrink-0" style={{ borderColor: c.primary + "33", background: c.tint }}>
            <p className="text-[6.5px] font-bold uppercase tracking-wider mb-1 text-center" style={{ color: c.primary }}>
              Sangguniang Barangay {props.barangay}
            </p>
            <div className="grid grid-cols-4 gap-1 text-[5.5px] leading-tight">
              {props.officials.slice(0, 8).map((o) => (
                <div key={o.name} className="text-center">
                  <p className="font-semibold text-gray-800 truncate">{o.name}</p>
                  <p className="text-gray-500 truncate">{o.position}</p>
                </div>
              ))}
            </div>
          </div>

          <footer className="px-4 py-1.5 flex items-center justify-between border-t shrink-0 animate-fade-in" style={{ borderColor: c.primary }}>
            <div className="text-[7px] leading-tight select-none">
              {(() => {
                const isClearance = title?.toLowerCase().includes("clearance");
                const hasCheckboxes = props.showTamboResident || props.showVillageCondo;
                return (
                  <>
                    {hasCheckboxes && (
                      <div className="flex items-center gap-2 text-[6.5px] select-none font-sans font-medium mb-1 normal-case text-gray-700">
                        {props.isVillageCondo && props.showVillageCondo && (
                          <div className="flex items-center gap-0.5">
                            <span className="text-[8px] font-mono" style={{ color: c.primary }}>☑</span>
                            <span>Village/Condo Resident</span>
                          </div>
                        )}
                        {!props.isVillageCondo && props.showTamboResident && (
                          <div className="flex items-center gap-0.5">
                            <span className="text-[8px] font-mono" style={{ color: c.primary }}>☑</span>
                            <span>Official Tambo Resident</span>
                          </div>
                        )}
                      </div>
                    )}
                    {isClearance ? (
                      <p className="text-gray-500">Issued: {issuedDate}</p>
                    ) : (
                      <>
                        <p className="font-semibold tracking-wider uppercase mt-1" style={{ color: c.primary }}>
                          Control No.
                        </p>
                        <p className="text-gray-700 font-mono">{controlNo}</p>
                        <p className="text-gray-500">Issued: {issuedDate}</p>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
            {title?.toLowerCase().includes("clearance") ? (
              <span className="text-[5px] font-bold italic text-right leading-tight max-w-[280px]" style={{ color: c.accent }}>
                Note: This clearance is valid only for {getValidityDaysText(props.expiryMonths)} days from the date of issue.<br />Not valid without the official seal.
              </span>
            ) : (
              <span className="text-[6px] tracking-wider uppercase text-gray-500 text-right">Republic of the Philippines<br />Not Valid Without Seal</span>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

// ── TAMBO — Official Barangay Clearance Form (Tambo only) ─────────

function FieldRow({ label, value, labelWidth = "auto" }: { label: string; value: string; labelWidth?: string }) {
  return (
    <div className="flex items-end gap-1 mb-1">
      <span className="font-bold shrink-0 text-[6.5px]" style={{ minWidth: labelWidth }}>{label}</span>
      <span className="flex-1 border-b border-gray-900 text-[6.5px] pb-px min-h-[10px]">{value}</span>
    </div>
  );
}

function TamboClearanceBody(props: BodyProps) {
  const r = props.resident ?? TAMBO_SAMPLE_RESIDENT;
  const field = (key: string, fallback = "") => {
    const map: Record<string, string> = {
      full_name: r.full_name ?? props.requestedBy ?? TAMBO_SAMPLE_RESIDENT.full_name,
      alias: r.alias ?? "",
      date_of_birth: r.date_of_birth ?? "",
      age: r.age != null ? String(r.age) : "",
      place_of_birth: r.place_of_birth ?? "",
      civil_status: r.civil_status ?? "",
      sex: r.sex ?? "",
      citizenship: r.citizenship ?? "Filipino",
      address: r.address ?? r.full_address ?? "",
      remarks: r.other_remarks ?? r.remarks ?? "",
    };
    return map[key] || fallback;
  };

  const expiryDays = (props.expiryMonths ?? 3) * 30;

  return (
    <div className="w-full h-full flex flex-col bg-white text-[#111] relative overflow-hidden pb-2">
      <PatternDecor c={props.c} designPattern={props.designPattern} />
      <CenteredModernHeader props={props} showTitle />

      <div className="px-4 pb-1 flex justify-end gap-3 text-[5.5px]">
        <span>No.: <span className="border-b border-gray-900 inline-block min-w-[52px]">{props.controlNo}</span></span>
        <span>Date.: <span className="border-b border-gray-900 inline-block min-w-[52px]">{props.issuedDate}</span></span>
      </div>

      <div className="px-4 relative flex-1 min-h-0">
        <Watermark c={props.c} />

      <EditableText
        tag="p"
        value={props.salutation || "TO WHOM IT MAY CONCERN:"}
        onChange={props.onSalutationChange}
        className="font-bold text-[6.5px] mb-1"
        title="Click to edit salutation"
      />

      <EditableBody
        className="text-[6px] text-justify leading-snug mb-2"
        bodyHtml={props.bodyHtml}
        rawContent={props.rawContent}
        onContentChange={props.onContentChange}
      />

      <div className="flex gap-0.5 mb-0.5 text-[6px]">
        <span className="font-bold shrink-0">NAME:</span>
        <span className="flex-[2] border-b border-gray-900">{field("full_name")}</span>
        <span className="font-bold shrink-0 ml-1">ALIAS/ES:</span>
        <span className="flex-1 border-b border-gray-900">{field("alias")}</span>
      </div>
      <div className="flex gap-0.5 mb-0.5 text-[6px]">
        <span className="font-bold shrink-0">BIRTHDATE:</span>
        <span className="flex-1 border-b border-gray-900">{field("date_of_birth")}</span>
        <span className="font-bold shrink-0">AGE:</span>
        <span className="w-6 border-b border-gray-900">{field("age")}</span>
        <span className="font-bold shrink-0">BIRTHPLACE:</span>
        <span className="flex-1 border-b border-gray-900">{field("place_of_birth")}</span>
      </div>
      <div className="flex gap-0.5 mb-0.5 text-[6px]">
        <span className="font-bold shrink-0">CIVIL STATUS:</span>
        <span className="flex-1 border-b border-gray-900">{field("civil_status")}</span>
        <span className="font-bold shrink-0">GENDER:</span>
        <span className="w-10 border-b border-gray-900">{field("sex")}</span>
        <span className="font-bold shrink-0">CITIZENSHIP:</span>
        <span className="flex-1 border-b border-gray-900">{field("citizenship")}</span>
      </div>
      <FieldRow label="ADDRESS:" value={field("address")} />
      <FieldRow label="REMARKS:" value={field("remarks")} />

      <div className="flex gap-2 mt-2 flex-1 min-h-0">
        <div className="w-[48%]">
          <div className="flex border border-gray-900 mb-0.5">
            <div className="flex-1 h-8 border-r border-gray-900 flex items-center justify-center text-[5px] text-gray-500">Left</div>
            <div className="flex-1 h-8 flex items-center justify-center text-[5px] text-gray-500">Right</div>
          </div>
          <p className="text-center text-[5px] tracking-[0.25em] mb-1">T H U M B M A R K S</p>
          <div className="border-b border-gray-900 h-5" />
          <p className="text-center text-[5.5px] mt-0.5">Signature</p>
          <div className="mt-2 space-y-0.5 text-[5.5px]">
            <div className="flex gap-1"><span>Res. Cert No.</span><span className="flex-1 border-b border-gray-900" /></div>
            <div className="flex gap-1"><span>Issued on</span><span className="flex-1 border-b border-gray-900" /></div>
            <div className="flex gap-1"><span>Issued at</span><span className="flex-1 border-b border-gray-900" /></div>
          </div>
          <p className="text-[4.5px] italic mt-1 leading-tight">
            Note: This clearance is good only for {expiryDays} days from the date of issue. Not valid without official seal.
          </p>
          <div className="flex gap-1 mt-1 text-[5.5px]">
            <span>OR No.</span>
            <span className="flex-1 border-b border-gray-900">{props.orNo ?? ""}</span>
            <span>Amount P</span>
            <span className="w-10 border-b border-gray-900">{props.orAmount ?? ""}</span>
          </div>
        </div>
        <div className="w-[52%]">
          <p className="text-[5.5px] font-bold mb-0.5">THIS CLEARANCE IS HEREBY ISSUED FOR PURPOSES OF:</p>
          <div className="border-b border-gray-900 min-h-[14px] text-[6px] mb-2">{props.purpose}</div>
          <p className="text-[5.5px]">Processed by:</p>
          <div className="border-b border-gray-900 w-3/4 h-5 mt-1" />
          <p className="text-[5.5px] font-bold mt-0.5">Clerk In-charge</p>
          <p className="text-[5.5px] font-bold mt-3">APPROVED BY:</p>
          <div className="border-b border-gray-900 w-3/4 h-6 mt-4" />
          <p className="text-[6.5px] font-bold uppercase mt-0.5">{props.signName}</p>
          <p className="text-[5.5px]">Barangay Captain</p>
        </div>
      </div>
      </div>
    </div>
  );
}

// ── MODERNO — Centered Modern (clean) ─────────────────────────────

function ModernoBody(props: BodyProps) {
  const { c, signName, signTitle, designPattern, title, controlNo, issuedDate } = props;
  return (
    <div className="w-full h-full flex flex-col bg-white text-[8px] relative overflow-hidden pb-16">
      <PatternDecor c={c} designPattern={designPattern} />
      <CenteredModernHeader props={props} showTitle />

      <main className="flex-1 px-4 pt-2 pb-3 relative">
        <Watermark c={c} />
        <div className="relative">
          <EditableBody 
            className="text-[8px] text-justify leading-relaxed text-gray-800 whitespace-pre-line" 
            bodyHtml={props.bodyHtml} rawContent={props.rawContent} onContentChange={props.onContentChange} 
          />


        </div>
      </main>

      <div className="absolute bottom-4 left-4 right-4 flex items-start justify-between border-t border-gray-100/40 bg-white pt-2">
        {/* Metadata Block (Bottom Left) */}
        <div className="text-left font-sans text-[7.5px] leading-relaxed text-gray-700 select-none">
          {(() => {
            const isClearance = title?.toLowerCase().includes("clearance");
            return (
              <>
                <p className="font-semibold" style={{ color: c.primary }}>
                  {isClearance ? "Series No." : "CTC No."}: <span className="font-mono text-gray-800 font-normal">{controlNo}</span>
                </p>
                <p className="font-semibold" style={{ color: c.primary }}>
                  Or No.: <span className="font-mono text-gray-800 font-normal">OR-9876543</span>
                </p>
                {(props.showTamboResident || props.showVillageCondo) && (
                  <div className="flex items-center gap-2 text-[6.5px] select-none font-sans font-medium mt-0.5 mb-0.5">
                    {props.isVillageCondo && props.showVillageCondo && (
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px] font-mono" style={{ color: c.primary }}>☑</span>
                        <span>Village/Condo Resident</span>
                      </div>
                    )}
                    {!props.isVillageCondo && props.showTamboResident && (
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px] font-mono" style={{ color: c.primary }}>☑</span>
                        <span>Official Tambo Resident</span>
                      </div>
                    )}
                  </div>
                )}
                {isClearance ? (
                  <p className="italic font-bold mt-0.5 leading-tight text-[5px]" style={{ color: c.accent }}>
                    Note: This clearance is valid only for {getValidityDaysText(props.expiryMonths)} days from the date of issue. Not valid without the official seal.
                  </p>
                ) : (
                  <p className="italic font-medium mt-0.5" style={{ color: c.accent }}>
                    Not Valid Without Official Seal
                  </p>
                )}
              </>
            );
          })()}
        </div>
        {/* Signature (Bottom Right) */}
        <div className="text-center shrink-0" style={{ width: 140 }}>
          <p className="text-[8px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: c.primary }}>{signName}</p>
          <div className="h-px w-full my-0.5" style={{ background: c.primary }} />
          <p className="text-[6.5px] uppercase tracking-wider text-gray-700 whitespace-nowrap">{signTitle}</p>
        </div>
      </div>
    </div>
  );
}

// ── TAMBO — Official Barangay Clearance Form (Tambo only) ─────────

function FieldRow({ label, value, labelWidth = "auto" }: { label: string; value: string; labelWidth?: string }) {
  return (
    <div className="flex items-end gap-1 mb-1">
      <span className="font-bold shrink-0 text-[6.5px]" style={{ minWidth: labelWidth }}>{label}</span>
      <span className="flex-1 border-b border-gray-900 text-[6.5px] pb-px min-h-[10px]">{value}</span>
    </div>
  );
}

function TamboClearanceBody(props: BodyProps) {
  const r = props.resident ?? TAMBO_SAMPLE_RESIDENT;
  const field = (key: string, fallback = "") => {
    const map: Record<string, string> = {
      full_name: r.full_name ?? props.requestedBy ?? TAMBO_SAMPLE_RESIDENT.full_name,
      alias: r.alias ?? "",
      date_of_birth: r.date_of_birth ?? "",
      age: r.age != null ? String(r.age) : "",
      place_of_birth: r.place_of_birth ?? "",
      civil_status: r.civil_status ?? "",
      sex: r.sex ?? "",
      citizenship: r.citizenship ?? "Filipino",
      address: r.address ?? r.full_address ?? "",
      remarks: r.other_remarks ?? r.remarks ?? "",
    };
    return map[key] || fallback;
  };

  const cityLine = props.municipality?.toUpperCase().startsWith("CITY") || props.municipality?.toUpperCase().startsWith("MUNICIPALITY")
    ? props.municipality.toUpperCase()
    : `CITY OF ${props.municipality?.toUpperCase() ?? "PARAÑAQUE"}`;
  const officeName = `Office of ${props.barangay.replace(/^(brgy\.?\s*|barangay\s*)/i, "")} Barangay Council`;
  const expiryDays = (props.expiryMonths ?? 3) * 30;

  return (
    <div className="w-full h-full flex flex-col bg-white text-[#111] relative overflow-hidden p-3">
      <table className="w-full mb-1">
        <tbody>
          <tr>
            <td className="w-[18%] align-top">
              <Seal url={props.logoUrl} size={34} fallbackLabel="BRGY" c={props.c} />
            </td>
            <td className="text-center align-top px-1">
              <div className="flex justify-center mb-0.5">
                <Seal url={props.nationalLogoUrl} size={32} fallbackLabel="PH" c={props.c} />
              </div>
              <p className="text-[5px] tracking-widest uppercase text-gray-600">Republic of the Philippines</p>
              <p className="text-[7px] font-bold uppercase">{cityLine}</p>
              <p className="text-[5px] uppercase text-gray-600">{props.province}</p>
              <p className="text-[6.5px] font-bold mt-0.5">{officeName}</p>
            </td>
            <td className="w-[28%] align-top text-right">
              <Seal url={props.municipalityLogoUrl} size={34} fallbackLabel="LGU" c={props.c} />
              <p className="text-[5.5px] mt-1">No.: <span className="border-b border-gray-900 inline-block min-w-[48px]">{props.controlNo}</span></p>
              <p className="text-[5.5px] mt-0.5">Date.: <span className="border-b border-gray-900 inline-block min-w-[48px]">{props.issuedDate}</span></p>
            </td>
          </tr>
        </tbody>
      </table>

      <EditableText
        tag="h2"
        value={props.title}
        onChange={props.onTitleChange}
        className="text-center font-bold my-2 w-full"
        style={{ fontSize: 11, letterSpacing: 6 }}
        title="Click to edit document title"
      />

      <EditableText
        tag="p"
        value={props.salutation || "TO WHOM IT MAY CONCERN:"}
        onChange={props.onSalutationChange}
        className="font-bold text-[6.5px] mb-1"
        title="Click to edit salutation"
      />

      <EditableBody
        className="text-[6px] text-justify leading-snug mb-2"
        bodyHtml={props.bodyHtml}
        rawContent={props.rawContent}
        onContentChange={props.onContentChange}
      />

      <div className="flex gap-0.5 mb-0.5 text-[6px]">
        <span className="font-bold shrink-0">NAME:</span>
        <span className="flex-[2] border-b border-gray-900">{field("full_name")}</span>
        <span className="font-bold shrink-0 ml-1">ALIAS/ES:</span>
        <span className="flex-1 border-b border-gray-900">{field("alias")}</span>
      </div>
      <div className="flex gap-0.5 mb-0.5 text-[6px]">
        <span className="font-bold shrink-0">BIRTHDATE:</span>
        <span className="flex-1 border-b border-gray-900">{field("date_of_birth")}</span>
        <span className="font-bold shrink-0">AGE:</span>
        <span className="w-6 border-b border-gray-900">{field("age")}</span>
        <span className="font-bold shrink-0">BIRTHPLACE:</span>
        <span className="flex-1 border-b border-gray-900">{field("place_of_birth")}</span>
      </div>
      <div className="flex gap-0.5 mb-0.5 text-[6px]">
        <span className="font-bold shrink-0">CIVIL STATUS:</span>
        <span className="flex-1 border-b border-gray-900">{field("civil_status")}</span>
        <span className="font-bold shrink-0">GENDER:</span>
        <span className="w-10 border-b border-gray-900">{field("sex")}</span>
        <span className="font-bold shrink-0">CITIZENSHIP:</span>
        <span className="flex-1 border-b border-gray-900">{field("citizenship")}</span>
      </div>
      <FieldRow label="ADDRESS:" value={field("address")} />
      <FieldRow label="REMARKS:" value={field("remarks")} />

      <div className="flex gap-2 mt-2 flex-1 min-h-0">
        <div className="w-[48%]">
          <div className="flex border border-gray-900 mb-0.5">
            <div className="flex-1 h-8 border-r border-gray-900 flex items-center justify-center text-[5px] text-gray-500">Left</div>
            <div className="flex-1 h-8 flex items-center justify-center text-[5px] text-gray-500">Right</div>
          </div>
          <p className="text-center text-[5px] tracking-[0.25em] mb-1">T H U M B M A R K S</p>
          <div className="border-b border-gray-900 h-5" />
          <p className="text-center text-[5.5px] mt-0.5">Signature</p>
          <div className="mt-2 space-y-0.5 text-[5.5px]">
            <div className="flex gap-1"><span>Res. Cert No.</span><span className="flex-1 border-b border-gray-900" /></div>
            <div className="flex gap-1"><span>Issued on</span><span className="flex-1 border-b border-gray-900" /></div>
            <div className="flex gap-1"><span>Issued at</span><span className="flex-1 border-b border-gray-900" /></div>
          </div>
          <p className="text-[4.5px] italic mt-1 leading-tight">
            Note: This clearance is good only for {expiryDays} days from the date of issue. Not valid without official seal.
          </p>
          <div className="flex gap-1 mt-1 text-[5.5px]">
            <span>OR No.</span>
            <span className="flex-1 border-b border-gray-900">{props.orNo ?? ""}</span>
            <span>Amount P</span>
            <span className="w-10 border-b border-gray-900">{props.orAmount ?? ""}</span>
          </div>
        </div>
        <div className="w-[52%]">
          <p className="text-[5.5px] font-bold mb-0.5">THIS CLEARANCE IS HEREBY ISSUED FOR PURPOSES OF:</p>
          <div className="border-b border-gray-900 min-h-[14px] text-[6px] mb-2">{props.purpose}</div>
          <p className="text-[5.5px]">Processed by:</p>
          <div className="border-b border-gray-900 w-3/4 h-5 mt-1" />
          <p className="text-[5.5px] font-bold mt-0.5">Clerk In-charge</p>
          <p className="text-[5.5px] font-bold mt-3">APPROVED BY:</p>
          <div className="border-b border-gray-900 w-3/4 h-6 mt-4" />
          <p className="text-[6.5px] font-bold uppercase mt-0.5">{props.signName}</p>
          <p className="text-[5.5px]">Barangay Captain</p>
        </div>
      </div>
    </div>
  );
}
