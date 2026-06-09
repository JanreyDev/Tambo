"use client";

import {  useState, useEffect, useCallback, useRef } from "react";
import {
  Upload, Phone, Mail, Clock, Building2, Shield, Bell, FileText,
  AlertTriangle, X, Globe, Loader2, Image as ImageIcon, Banknote,
  MessageSquare, HardDrive, Users, Database, CreditCard,
  ShieldAlert, Heart, Scale, BookOpen, Plus, Trash2,
  Crown, Smartphone, Siren, MapPin, Facebook, Twitter, Instagram, Youtube,
  Calendar, Info, User, ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn, resolvePhotoUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { OfficialsTab } from "@/components/settings/OfficialsTab";
import { SettingsSaveBar } from "@/components/settings/SettingsSaveBar";
import { CertificateTypesList } from "@/components/settings/CertificateTypesList";
import { DocumentLivePreview } from "@/components/settings/DocumentLivePreview";
import { StructureCardHeader } from "@/components/settings/StructureCardHeader";
import type { BarangaySettings, BarangayOfficial, BarangayUsage, ApiError } from "@/lib/types";

// ── Reusable Components ──

function SettingsInput({ label, value, onChange, placeholder, icon: Icon, disabled, error, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  icon?: React.ElementType; disabled?: boolean; error?: string; type?: string;
}) {
  const id = `settings-${label.toLowerCase().replace(/[\s/]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <input id={id} type={type} value={value} onChange={(e) => onChange(type === "number" ? e.target.value : e.target.value.toUpperCase())} placeholder={placeholder} disabled={disabled}
          autoComplete="off"
          data-form-type="other"
          className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 transition-colors uppercase",
            error ? "border-red-500 focus:ring-red-500/30" : "border-border",
            Icon && "pl-9", disabled && "opacity-50 cursor-not-allowed")}
          style={!error ? { "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties : undefined} />
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SettingsTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const id = `settings-${label.toLowerCase().replace(/[\s/]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 transition-colors border-border resize-none uppercase"
        style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties} />
    </div>
  );
}

function SettingsToggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg glass-subtle">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <button onClick={() => onChange(!checked)} className="shrink-0" type="button" role="switch" aria-checked={checked}>
        <div className={cn("w-10 h-6 rounded-full flex items-center px-0.5 transition-colors duration-200",
          checked ? "" : "bg-muted")}
          style={checked ? { background: "var(--accent-primary)" } : undefined}>
          <div className={cn("w-3 h-3 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0")} />
        </div>
      </button>
    </div>
  );
}

/** Tanga-Proof logo normalization: auto-trim solid borders, center-square crop, resize to 512×512 PNG.
 *  Handles white-margin scans, off-center photos, oversized files. SVG passes through (vector). */
type NormalizeResult = {
  file: File;
  dataUrl: string;
  originalDimensions: { w: number; h: number };
  processedDimensions: { w: number; h: number };
  warnings: string[];
};

async function normalizeLogoImage(file: File, outputSize = 512): Promise<NormalizeResult> {
  // Only PNG and JPEG are accepted (SVG + WebP rejected for security/consistency)
  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    throw new Error("Only PNG and JPG files are accepted.");
  }
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const origW = img.width;
      const origH = img.height;
      const work = document.createElement("canvas");
      work.width = origW;
      work.height = origH;
      const ctx = work.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unsupported")); return; }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, origW, origH).data;

      // Sample 4 corners to detect background
      const cornerIdx = [0, (origW - 1) * 4, (origH - 1) * origW * 4, ((origH - 1) * origW + origW - 1) * 4];
      const corners = cornerIdx.map(i => ({ r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] }));
      const isTransparent = corners.every(c => c.a < 50);
      const bgR = Math.round(corners.reduce((s, c) => s + c.r, 0) / 4);
      const bgG = Math.round(corners.reduce((s, c) => s + c.g, 0) / 4);
      const bgB = Math.round(corners.reduce((s, c) => s + c.b, 0) / 4);
      const TOL = 30;
      const isBg = (idx: number): boolean => {
        if (isTransparent) return data[idx + 3] < 50;
        return Math.abs(data[idx] - bgR) <= TOL && Math.abs(data[idx+1] - bgG) <= TOL && Math.abs(data[idx+2] - bgB) <= TOL;
      };

      // Walk in from each edge until we hit a non-bg pixel
      let top = 0, bottom = origH - 1, left = 0, right = origW - 1;
      topLoop: for (; top < origH; top++) {
        for (let x = 0; x < origW; x++) if (!isBg((top * origW + x) * 4)) break topLoop;
      }
      bottomLoop: for (; bottom > top; bottom--) {
        for (let x = 0; x < origW; x++) if (!isBg((bottom * origW + x) * 4)) break bottomLoop;
      }
      leftLoop: for (; left < origW; left++) {
        for (let y = top; y <= bottom; y++) if (!isBg((y * origW + left) * 4)) break leftLoop;
      }
      rightLoop: for (; right > left; right--) {
        for (let y = top; y <= bottom; y++) if (!isBg((y * origW + right) * 4)) break rightLoop;
      }

      // Safety: if trim ate the whole image, revert to full
      if (right - left < 10 || bottom - top < 10) {
        top = 0; left = 0; right = origW - 1; bottom = origH - 1;
      }

      // Pad-to-square: center the trimmed content on a square canvas with longer-side as size.
      // No content loss — padding fills the shorter side with transparency (PNG) or the detected bg color.
      const cw = right - left + 1;
      const ch = bottom - top + 1;
      const squareSize = Math.max(cw, ch);
      const offsetX = Math.floor((squareSize - cw) / 2);
      const offsetY = Math.floor((squareSize - ch) / 2);

      const squared = document.createElement("canvas");
      squared.width = squareSize;
      squared.height = squareSize;
      const sCtx = squared.getContext("2d");
      if (!sCtx) { reject(new Error("Canvas unsupported")); return; }
      // If source had transparent corners, leave padding transparent. Otherwise fill with detected bg.
      if (!isTransparent) {
        sCtx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
        sCtx.fillRect(0, 0, squareSize, squareSize);
      }
      sCtx.drawImage(work, left, top, cw, ch, offsetX, offsetY, cw, ch);

      // Resize the padded square down to outputSize × outputSize
      const output = document.createElement("canvas");
      output.width = outputSize;
      output.height = outputSize;
      const oCtx = output.getContext("2d");
      if (!oCtx) { reject(new Error("Canvas unsupported")); return; }
      oCtx.imageSmoothingEnabled = true;
      oCtx.imageSmoothingQuality = "high";
      oCtx.drawImage(squared, 0, 0, outputSize, outputSize);

      const warnings: string[] = [];
      if (squareSize < 200) warnings.push("Source resolution is low — recommend uploading at least 512×512.");
      if (file.type === "image/jpeg" && !isTransparent) warnings.push("JPEG with solid background detected — PNG with transparent background gives the cleanest look.");
      const aspectRatio = cw / ch;
      if (aspectRatio > 1.5 || aspectRatio < 0.67) warnings.push(`Logo is non-square (${cw}×${ch}). Padded with ${isTransparent ? "transparency" : "matching background"} to keep it square — confirm the result looks right.`);
      if (cw / origW < 0.3 || ch / origH < 0.3) warnings.push("Significant whitespace was trimmed. If the logo looks too tight, upload a version with less surrounding background.");

      output.toBlob((blob) => {
        if (!blob) { reject(new Error("Failed to encode image")); return; }
        const cleanName = file.name.replace(/\.[^.]+$/, "") + ".png";
        const processedFile = new File([blob], cleanName, { type: "image/png" });
        resolve({
          file: processedFile,
          dataUrl: output.toDataURL("image/png"),
          originalDimensions: { w: origW, h: origH },
          processedDimensions: { w: outputSize, h: outputSize },
          warnings,
        });
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/** Modal that shows before/after + sidebar preview, lets user confirm or cancel before upload. */
function LogoPreviewModal({
  isOpen, onClose, onConfirm, originalFile, processed, label,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  originalFile: File | null;
  processed: NormalizeResult | null;
  label: string;
}) {
  if (!isOpen || !processed || !originalFile) return null;
  const originalUrl = URL.createObjectURL(originalFile);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-popover rounded-2xl max-w-xl w-full overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Preview {label}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Auto-cropped to a 512×512 square. Confirm below or pick a different image.</p>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Original</p>
              <div className="aspect-square rounded-lg bg-muted/40 border border-border flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="Original" className="max-w-full max-h-full object-contain" />
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5 text-center tabular-nums">{processed.originalDimensions.w}×{processed.originalDimensions.h}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Processed</p>
              <div className="aspect-square rounded-lg bg-muted/40 border border-border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={processed.dataUrl} alt="Processed" className="w-full h-full object-contain" />
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5 text-center tabular-nums">512×512 PNG</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">In Sidebar</p>
              <div className="aspect-square rounded-lg border border-border flex items-center justify-center" style={{ background: "#1a1f2e" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={processed.dataUrl} alt="Sidebar preview" className="w-14 h-14 rounded-full object-cover ring-1 ring-white/20 shadow-lg" />
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5 text-center">48×48 circle</p>
            </div>
          </div>
          {processed.warnings.length > 0 && (
            <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-1">
              {processed.warnings.map((w, i) => (
                <p key={i} className="text-[12px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground">
            Use Different Image
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
            style={{ background: "var(--accent-primary)" }}>
            Confirm &amp; Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageUpload({ label, hint, currentUrl, onUpload, uploading }: {
  label: string; hint: string; currentUrl: string | null; onUpload: (file: File) => void; uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [pendingOriginal, setPendingOriginal] = useState<File | null>(null);
  const [pendingProcessed, setPendingProcessed] = useState<NormalizeResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Validate MIME explicitly — drag-drop can bypass the `accept` attr
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setFileError("Only PNG and JPG files are accepted.");
      setTimeout(() => setFileError(null), 4000);
      return;
    }

    setFileError(null);
    setProcessing(true);
    try {
      const result = await normalizeLogoImage(file);
      setPendingOriginal(file);
      setPendingProcessed(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process image.";
      setFileError(msg);
      setTimeout(() => setFileError(null), 4000);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (pendingProcessed) onUpload(pendingProcessed.file);
    setPendingOriginal(null);
    setPendingProcessed(null);
  };

  const handleCancel = () => {
    setPendingOriginal(null);
    setPendingProcessed(null);
    inputRef.current?.click();
  };

  const busy = uploading || processing;

  return (
    <>
      <div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFile} />
        <div onClick={() => !busy && inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-muted-foreground/30 transition-colors cursor-pointer min-h-[180px]">
          {busy ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground mt-2">{processing ? "Auto-cropping…" : "Uploading…"}</p>
            </>
          ) : currentUrl ? (
            <div className="w-24 h-24 rounded-lg bg-white border border-border flex items-center justify-center mb-2 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentUrl} alt={label} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 5MB · auto-cropped to 512×512</p>
          <button type="button" className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} disabled={busy}>
            {currentUrl ? "Replace" : "Upload"}
          </button>
        </div>
        {fileError ? (
          <p className="text-[11px] text-red-500 mt-2 px-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {fileError}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground/70 mt-2 px-1">{hint}</p>
        )}
      </div>
      <LogoPreviewModal
        isOpen={!!pendingProcessed}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        originalFile={pendingOriginal}
        processed={pendingProcessed}
        label={label}
      />
    </>
  );
}

const PREVIEW_FALLBACK_OFFICIALS = [
  { key: "kapitan", name: "JUAN DELA CRUZ", position: "Punong Barangay", photoUrl: null, initials: "JD" },
  { key: "kagawad-1", name: "MARIA SANTOS", position: "Kagawad", photoUrl: null, initials: "MS" },
  { key: "kagawad-2", name: "JOSE REYES", position: "Kagawad", photoUrl: null, initials: "JR" },
  { key: "kagawad-3", name: "LINDA OCAMPO", position: "Kagawad", photoUrl: null, initials: "LO" },
  { key: "kagawad-4", name: "RICO MENDOZA", position: "Kagawad", photoUrl: null, initials: "RM" },
  { key: "kagawad-5", name: "ANNA GARCIA", position: "Kagawad", photoUrl: null, initials: "AG" },
  { key: "sk", name: "MARY CRUZ", position: "SK Chairperson", photoUrl: null, initials: "MC" },
  { key: "secretary", name: "ANA REYES", position: "Barangay Secretary", photoUrl: null, initials: "AR" },
  { key: "treasurer", name: "PABLO SANTOS", position: "Barangay Treasurer", photoUrl: null, initials: "PS" },
];

const PREVIEW_POSITION_ORDER: Record<string, number> = {
  kapitan: 0,
  kagawad: 1,
  sk_chair: 2,
  sk_chairperson: 2,
  "sk-chair": 2,
  secretary: 3,
  treasurer: 4,
};

const PREVIEW_POSITION_LABELS: Record<string, string> = {
  kapitan: "Punong Barangay",
  kagawad: "Kagawad",
  sk_chair: "SK Chairperson",
  sk_chairperson: "SK Chairperson",
  "sk-chair": "SK Chairperson",
  secretary: "Barangay Secretary",
  treasurer: "Barangay Treasurer",
};

function getPreviewOfficials(allOfficials: BarangayOfficial[]) {
  const normalized = [...allOfficials]
    .sort((a, b) => (PREVIEW_POSITION_ORDER[a.position] ?? 99) - (PREVIEW_POSITION_ORDER[b.position] ?? 99))
    .map((official) => {
      const firstName = official.resident?.first_name?.trim() || "";
      const lastName = official.resident?.last_name?.trim() || "";
      const fullName = `${firstName} ${lastName}`.trim();

      if (!fullName) return null;

      return {
        key: official.id,
        name: fullName.toUpperCase(),
        position: PREVIEW_POSITION_LABELS[official.position] || official.position || "Official",
        photoUrl: resolvePhotoUrl(official.resident?.photo_url ?? null),
        initials: `${firstName[0] || "?"}${lastName[0] || "?"}`.toUpperCase(),
      };
    })
    .filter((official): official is { key: string; name: string; position: string; photoUrl: string | null; initials: string } => !!official);

  return normalized.length > 0 ? normalized : PREVIEW_FALLBACK_OFFICIALS;
}

function getOfficialDisplayName(official?: BarangayOfficial | null): string | null {
  if (!official?.resident) return null;

  const parts = [
    official.resident.first_name?.trim(),
    official.resident.middle_name?.trim(),
    official.resident.last_name?.trim(),
    official.resident.extension_name?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ").toUpperCase() : null;
}

function findOfficialByPosition(allOfficials: BarangayOfficial[], positions: string[]): BarangayOfficial | null {
  for (const position of positions) {
    const match = allOfficials.find((official) => official.position === position);
    if (match) return match;
  }
  return null;
}

function getPreviewCertificateCopy(barangayName?: string | null, municipality?: string | null) {
  const barangay = barangayName?.trim() || "Barangay San Roque";
  const city = municipality?.trim() || "City of Caloocan";

  return {
    title: "BARANGAY CLEARANCE",
    salutation: "TO WHOM IT MAY CONCERN:",
    paragraphs: [
      `This is to certify that JUAN MIGUEL SANTOS, 32 years old, Filipino, and a resident of ${barangay}, ${city}, is personally known to this office and is a law-abiding member of the community.`,
      "Based on available barangay records, he has no pending derogatory record or unresolved community complaint on file as of the date of issuance.",
      "This certification is issued upon the request of the above-named person for local employment and other lawful purposes.",
    ],
    controlNo: "BC-2026-00123",
    requestedBy: "JUAN MIGUEL SANTOS",
    purpose: "LOCAL EMPLOYMENT",
  };
}

const PREVIEW_FONT_FAMILY: Record<
  "times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair",
  string
> = {
  times: '"Times New Roman", Times, serif',
  arial: "Arial, Helvetica, sans-serif",
  inter: "var(--font-doc-inter), system-ui, sans-serif",
  poppins: "var(--font-doc-poppins), system-ui, sans-serif",
  merriweather: "var(--font-doc-merriweather), Georgia, serif",
  playfair: "var(--font-playfair), Georgia, serif",
};

// ── Main Page ──


const THEMES_LIST = [
  { id: "plain",  label: "Plain",  colors: ["#1f2937"] },
  { id: "blue",   label: "Blue",   colors: ["#1e40af"] },
  { id: "red",    label: "Red",    colors: ["#991b1b"] },
  { id: "green",  label: "Green",  colors: ["#15803d"] },
  { id: "yellow", label: "Yellow", colors: ["#eab308"] },
  { id: "combo-flag",       label: "Philippine Flag", colors: ["#1e40af", "#991b1b", "#eab308"] },
  { id: "combo-festive",    label: "Festive",         colors: ["#991b1b", "#eab308"] },
  { id: "combo-earth",      label: "Earth & Sky",     colors: ["#15803d", "#1e40af"] },
  { id: "combo-gov",        label: "Government",      colors: ["#1e3a8a", "#92400e"] },
  { id: "combo-bayanihan",  label: "Bayanihan",       colors: ["#991b1b", "#1e40af"] },
  { id: "combo-sunrise",    label: "Sunrise",         colors: ["#eab308", "#991b1b"] },
  { id: "combo-coastal",    label: "Coastal",         colors: ["#1e40af", "#15803d"] },
  { id: "combo-heritage",   label: "Heritage",        colors: ["#991b1b", "#15803d"] },
];

function ColorThemeDropdown({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeTheme = THEMES_LIST.find(t => t.id === value) || THEMES_LIST[0];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-background/60 border-2 border-border/60 rounded-lg pl-3 pr-3 py-2 text-sm font-medium text-foreground hover:border-blue-500/40 focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all flex items-center justify-between"
      >
        <span className="truncate">{activeTheme.label}</span>
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-10 rounded border border-border/40 overflow-hidden shadow-sm">
            {activeTheme.colors.map((c, i) => (
              <div key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-background border border-border/80 rounded-lg shadow-xl max-h-60 overflow-y-auto p-1">
          {THEMES_LIST.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => { onChange(theme.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-md transition-colors ${
                value === theme.id ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-semibold" : "text-foreground hover:bg-muted"
              }`}
            >
              <span>{theme.label}</span>
              <div className="flex h-4 w-8 rounded border border-border/40 overflow-hidden shadow-sm">
                {theme.colors.map((c, i) => (
                  <div key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


const PATTERN_LABELS: Record<string, string> = {
  wave: "Wave", gradient: "Gradient", bold: "Bold", photo: "Photo", minimal: "Minimal", stripe: "Stripe",
  wreath: "Wreath", sunburst: "Sunburst", gothic: "Gothic", scroll: "Scroll", diplomatic: "Diplomatic", ornate: "Ornate",
  geometric: "Geometric", "bold-stripe": "Bold Stripe", tech: "Tech",
};

function renderPatternPreviewIcon(id: string) {
  switch(id) {
    case 'wave': return <div className="w-full h-full bg-blue-500/10 overflow-hidden relative"><div className="absolute top-1/2 left-[-10%] w-[120%] h-[120%] bg-blue-500/40 rounded-[50%]" /></div>;
    case 'gradient': return <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(139,92,246,0.5) 100%)" }} />;
    case 'stripe': return <div className="w-full h-full" style={{ background: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(59,130,246,0.3) 2px, rgba(59,130,246,0.3) 4px)" }} />;
    case 'bold-stripe': return <div className="w-full h-full" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(59,130,246,0.6) 4px, rgba(59,130,246,0.6) 8px)" }} />;
    case 'minimal': return <div className="w-full h-full border border-border/40 bg-background/80" />;
    case 'bold': return <div className="w-full h-full bg-foreground/5 border-l-[3px] border-blue-500" />;
    case 'photo': return <div className="w-full h-full bg-foreground/10 flex items-center justify-center"><ImageIcon className="w-2.5 h-2.5 text-muted-foreground/50" /></div>;
    case 'geometric': return <div className="w-full h-full bg-foreground/5 relative overflow-hidden"><div className="absolute -right-1 -top-1 w-4 h-4 bg-blue-500/30 rotate-45" /></div>;
    default: return <div className="w-full h-full border border-dashed border-border/60 bg-foreground/5 flex items-center justify-center"><div className="w-1/2 h-px bg-border/80" /></div>;
  }
}

function DesignPatternDropdown({ value, options, onChange }: { value: string, options: string[], onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = PATTERN_LABELS[value] || value;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-background/60 border-2 border-border/60 rounded-lg pl-3 pr-3 py-2 text-sm font-medium text-foreground hover:border-blue-500/40 focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all flex items-center justify-between"
      >
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-border/40 overflow-hidden shadow-sm flex items-center justify-center">
            {renderPatternPreviewIcon(value)}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-background border border-border/80 rounded-lg shadow-xl max-h-60 overflow-y-auto p-1">
          {options.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => { onChange(id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-md transition-colors ${
                value === id ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-semibold" : "text-foreground hover:bg-muted"
              }`}
            >
              <span>{PATTERN_LABELS[id] || id}</span>
              <div className="w-5 h-5 rounded border border-border/40 overflow-hidden shadow-sm flex items-center justify-center">
                {renderPatternPreviewIcon(id)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Responsive Thumbnail Component for perfectly scaling miniature previews ---
function ResponsiveThumbnail({ layout, docPaperSize, docFont, docColorTheme, docDesignPattern, settings, logoUrl, municipalityLogoUrl, signatoryName, signatoryTitle }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      setScale(width / 560); // 560 is the base width of the DocumentLivePreview
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full relative flex justify-center overflow-hidden" style={{ height: 560 * 1.414 * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", width: 560, height: 560 * 1.414, flexShrink: 0 }}>
        <DocumentLivePreview
          layout={layout}
          paperSize={docPaperSize}
          font={docFont}
          colorTheme={docColorTheme}
          designPattern={docDesignPattern}
          barangayName={settings?.name ?? null}
          municipality={settings?.city_municipality ?? null}
          province={settings?.province ?? null}
          logoUrl={logoUrl}
          municipalityLogoUrl={municipalityLogoUrl}
          signatoryName={signatoryName}
          signatoryTitle={signatoryTitle}
          hideChrome={true}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<BarangaySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("info");

  // Toast
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const toastCounter = useRef(0);
  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Snapshot of originally-loaded values per editable field — used to detect unsaved changes.
  // After successful save, this is refreshed to the new current values for the saved tab.
  const originalsRef = useRef<Record<string, unknown>>({});

  // Form state (editable fields)
  const [zip, setZip] = useState("");
  const [motto, setMotto] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [termStartYear, setTermStartYear] = useState("");
  const [termEndYear, setTermEndYear] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  // ── Contact Details (new fields) ──
  const [mobileNumber, setMobileNumber] = useState("");
  const [emergencyHotline, setEmergencyHotline] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [viberUrl, setViberUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [docHeader, setDocHeader] = useState("");
  const [docFooter, setDocFooter] = useState("");
  const [smsSenderName, setSmsSenderName] = useState("");
  const [notifSmsNewResident, setNotifSmsNewResident] = useState(false);
  const [notifSmsCert, setNotifSmsCert] = useState(false);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifDaily, setNotifDaily] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [municipalityLogoUrl, setMunicipalityLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMunicipalityLogo, setUploadingMunicipalityLogo] = useState(false);
  // Fees & signatory (stored in settings JSONB)
  const [certValidityDays, setCertValidityDays] = useState("180");
  const [clearanceFee, setClearanceFee] = useState("0");
  const [indigencyFee, setIndigencyFee] = useState("0");
  const [idFee, setIdFee] = useState("0");
  const [cedulaFee, setCedulaFee] = useState("0");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("PUNONG BARANGAY");
  const [docLayout, setDocLayout] = useState<"klasiko" | "moderno" | "elegante" | "digital">("klasiko");
  const [docColorTheme, setDocColorTheme] = useState<
    | "plain" | "blue" | "red" | "green" | "yellow"
    | "combo-flag" | "combo-festive" | "combo-earth" | "combo-gov"
    | "combo-bayanihan" | "combo-sunrise" | "combo-coastal" | "combo-heritage"
  >("plain");
  const [docDesignPattern, setDocDesignPattern] = useState<
    // Classic Sidebar set
    | "wave" | "gradient" | "bold" | "photo" | "minimal" | "stripe"
    // Formal Government set
    | "wreath" | "sunburst" | "gothic" | "scroll" | "diplomatic" | "ornate"
    // Centered Modern set
    | "geometric" | "bold-stripe" | "tech"
  >("wave");
  const [docPaperSize, setDocPaperSize] = useState<"a4" | "letter" | "legal">("a4");
  const [docFont, setDocFont] = useState<"times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair">("times");
  // Track whether the user has touched structure/color/paper at least once.
  // Patterns stay as dummy placeholders until first interaction so the user
  // sees the "patterns are generated from your choices" model clearly.
  const [hasGeneratedPatterns, setHasGeneratedPatterns] = useState(false);

  // Structure → 6 compatible design patterns (no cross-structure clashes)
  const STRUCTURE_PATTERNS = {
    klasiko:  ["wave", "gradient", "bold", "photo", "minimal", "stripe"] as const,
    elegante: ["wreath", "sunburst", "gothic", "scroll", "diplomatic", "ornate"] as const,
    moderno:  ["wave", "gradient", "minimal", "geometric", "bold-stripe", "tech"] as const,
    digital:  ["wave", "gradient", "minimal", "geometric", "bold-stripe", "tech"] as const,
  };

  // Reset the design pattern when the structure changes if the current pattern
  // is not in the new structure's compatible set.
  useEffect(() => {
    const set = STRUCTURE_PATTERNS[docLayout] as readonly string[];
    if (!set.includes(docDesignPattern)) {
      setDocDesignPattern(set[0] as typeof docDesignPattern);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docLayout]);

  // Usage/billing data
  const [usage, setUsage] = useState<BarangayUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Current kapitan — derived from barangay_officials (Officials tab is the source of truth)
  const [kapitanOfficial, setKapitanOfficial] = useState<BarangayOfficial | null>(null);
  const [allOfficials, setAllOfficials] = useState<BarangayOfficial[]>([]);

  // Validation errors per editable field — keyed by field name
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  // ── VAWC (RA 9262) ──
  const [vawcOfficerName, setVawcOfficerName] = useState("");
  const [vawcOfficerPhone, setVawcOfficerPhone] = useState("");
  const [vawcBcpcName, setVawcBcpcName] = useState("");
  const [vawcBcpcPhone, setVawcBcpcPhone] = useState("");
  const [vawcDisclaimer, setVawcDisclaimer] = useState("");
  const [vawcAccessRestricted, setVawcAccessRestricted] = useState(true);

  // ── GAD (RA 9710) ──
  const [gadFocalName, setGadFocalName] = useState("");
  const [gadFocalTitle, setGadFocalTitle] = useState("");
  const [gadBudgetPercent, setGadBudgetPercent] = useState("5");
  const [gadPlanUrl, setGadPlanUrl] = useState("");

  // ── KP / Lupong Tagapamayapa (RA 7160 Ch. 7) ──
  const [kpHearingWindowDays, setKpHearingWindowDays] = useState("15");
  const [kpMediationExtensionDays, setKpMediationExtensionDays] = useState("15");
  const [kpArbitrationWindowDays, setKpArbitrationWindowDays] = useState("15");
  const [kpSummonsTemplate, setKpSummonsTemplate] = useState("");

  // ── Residents Dictionaries (replaces 15 mock seed arrays in residents/page.tsx) ──
  type DictKey = "puroks" | "streets" | "citizenships" | "religions" | "ethnicities" | "occupations" | "skills" | "positions" | "employers" | "courses" | "schools" | "placesOfBirth" | "businessTypes" | "sectorsOther" | "emergencyRelations";
  const [dictionaries, setDictionaries] = useState<Record<DictKey, string[]>>({
    puroks: [], streets: [], citizenships: [], religions: [], ethnicities: [],
    occupations: [], skills: [], positions: [], employers: [], courses: [],
    schools: [], placesOfBirth: [], businessTypes: [], sectorsOther: [], emergencyRelations: [],
  });
  const [activeDict, setActiveDict] = useState<DictKey>("puroks");
  const [newDictEntry, setNewDictEntry] = useState("");

  // Load settings
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.settings.get();
        // Capture originals BEFORE setters so dirty diff is accurate on the very first render.
        // Refs don't trigger re-renders, so the values must be in place before React commits the state updates.
        const s = (data.settings as Record<string, unknown> | null) || {};
        const v0 = (s.vawc as Record<string, unknown> | undefined) || {};
        const g0 = (s.gad as Record<string, unknown> | undefined) || {};
        const k0 = (s.kp as Record<string, unknown> | undefined) || {};
        const c0 = (s.contact as Record<string, unknown> | undefined) || {};
        const d0 = (s.residents_dictionaries as Record<string, string[]> | undefined) || {};
        const initialDicts0: Record<DictKey, string[]> = {
          puroks: d0.puroks || [], streets: d0.streets || [], citizenships: d0.citizenships || [],
          religions: d0.religions || [], ethnicities: d0.ethnicities || [], occupations: d0.occupations || [],
          skills: d0.skills || [], positions: d0.positions || [], employers: d0.employers || [],
          courses: d0.courses || [], schools: d0.schools || [], placesOfBirth: d0.placesOfBirth || [],
          businessTypes: d0.businessTypes || [], sectorsOther: d0.sectorsOther || [], emergencyRelations: d0.emergencyRelations || [],
        };
        originalsRef.current = {
          zip: data.zip_code || "",
          motto: data.motto || "",
          officeHours: data.office_hours || "MON-FRI 8AM-5PM",
          establishedYear: data.established_year ? String(data.established_year) : "",
          termStartYear: (typeof data.officials_term === "string" && /^\d{4}-\d{4}$/.test(data.officials_term))
            ? data.officials_term.split("-")[0] ?? "" : "",
          termEndYear: (typeof data.officials_term === "string" && /^\d{4}-\d{4}$/.test(data.officials_term))
            ? data.officials_term.split("-")[1] ?? "" : "",
          captainName: data.captain_name || "",
          contactPhone: data.contact_phone || "",
          contactEmail: data.contact_email || "",
          websiteUrl: data.website_url || "",
          fullAddress: data.full_address || "",
          latitude: data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : "",
          longitude: data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : "",
          mobileNumber: (c0.mobile_number as string) || "",
          emergencyHotline: (c0.emergency_hotline as string) || "",
          facebookUrl: (c0.facebook_url as string) || "",
          viberUrl: (c0.viber_community_url as string) || "",
          youtubeUrl: (c0.youtube_url as string) || "",
          twitterUrl: (c0.twitter_url as string) || "",
          instagramUrl: (c0.instagram_url as string) || "",
          docHeader: data.document_header_text || "",
          docFooter: data.document_footer_text || "",
          smsSenderName: data.sms_sender_name || "",
          notifSmsNewResident: data.notification_preferences?.sms_new_resident || false,
          notifSmsCert: data.notification_preferences?.sms_certificate_issued || false,
          notifEmail: data.notification_preferences?.email_alerts || false,
          notifDaily: data.notification_preferences?.daily_summary || false,
          certValidityDays: String(s.certificate_validity_days ?? 180),
          clearanceFee: String(s.clearance_fee ?? 0),
          indigencyFee: String(s.indigency_fee ?? 0),
          idFee: String(s.id_fee ?? 0),
          cedulaFee: String(s.cedula_fee ?? 0),
          signatoryName: (s.default_signatory_name as string) || "",
          signatoryTitle: (s.default_signatory_title as string) || "PUNONG BARANGAY",
          docLayout: (s.document_layout as string) || "klasiko",
          docPaperSize: (s.document_paper_size as string) || "a4",
          docFont: (s.document_font as string) || "times",
          docColorTheme: (s.document_color_theme as string) || "plain",
          docDesignPattern: (s.document_design_pattern as string) || "wave",
          vawcOfficerName: (v0.confidentiality_officer_name as string) || "",
          vawcOfficerPhone: (v0.confidentiality_officer_phone as string) || "",
          vawcBcpcName: (v0.bcpc_contact_name as string) || "",
          vawcBcpcPhone: (v0.bcpc_contact_phone as string) || "",
          vawcDisclaimer: (v0.ra9262_disclaimer as string) || "",
          vawcAccessRestricted: v0.access_restricted !== false,
          gadFocalName: (g0.focal_person_name as string) || "",
          gadFocalTitle: (g0.focal_person_title as string) || "",
          gadBudgetPercent: String(g0.budget_percent_target ?? 5),
          gadPlanUrl: (g0.plan_url as string) || "",
          kpHearingWindowDays: String(k0.hearing_window_days ?? 15),
          kpMediationExtensionDays: String(k0.mediation_extension_days ?? 15),
          kpArbitrationWindowDays: String(k0.arbitration_window_days ?? 15),
          kpSummonsTemplate: (k0.summons_template as string) || "",
          dictionaries: initialDicts0,
        };

        setSettings(data);
        setZip(data.zip_code || "");
        setMotto(data.motto || "");
        setOfficeHours(data.office_hours || "MON-FRI 8AM-5PM");
        setEstablishedYear(data.established_year ? String(data.established_year) : "");
        // officials_term is stored as "YYYY-YYYY" string, split it for paired inputs
        if (typeof data.officials_term === "string" && /^\d{4}-\d{4}$/.test(data.officials_term)) {
          const [s, e] = data.officials_term.split("-");
          setTermStartYear(s ?? "");
          setTermEndYear(e ?? "");
        } else {
          setTermStartYear("");
          setTermEndYear("");
        }
        setCaptainName(data.captain_name || "");
        setContactPhone(data.contact_phone || "");
        setContactEmail(data.contact_email || "");
        setWebsiteUrl(data.website_url || "");
        setFullAddress(data.full_address || "");
        setLatitude(data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : "");
        setLongitude(data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : "");
        // Contact extras (mobile, hotline, social) stored under settings.contact JSONB
        const c = ((data.settings as Record<string, unknown> | null)?.contact as Record<string, unknown> | undefined) || {};
        setMobileNumber((c.mobile_number as string) || "");
        setEmergencyHotline((c.emergency_hotline as string) || "");
        setFacebookUrl((c.facebook_url as string) || "");
        setViberUrl((c.viber_community_url as string) || "");
        setYoutubeUrl((c.youtube_url as string) || "");
        setTwitterUrl((c.twitter_url as string) || "");
        setInstagramUrl((c.instagram_url as string) || "");
        setDocHeader(data.document_header_text || "");
        setDocFooter(data.document_footer_text || "");
        setSmsSenderName(data.sms_sender_name || "");
        setNotifSmsNewResident(data.notification_preferences?.sms_new_resident || false);
        setNotifSmsCert(data.notification_preferences?.sms_certificate_issued || false);
        setNotifEmail(data.notification_preferences?.email_alerts || false);
        setNotifDaily(data.notification_preferences?.daily_summary || false);
        setLogoUrl(data.logo_url);
        setMunicipalityLogoUrl(data.municipality_logo_url);
        // Fees & signatory from settings JSONB — reuses `s` declared above for originals capture
        setCertValidityDays(String(s.certificate_validity_days ?? 180));
        setClearanceFee(String(s.clearance_fee ?? 0));
        setIndigencyFee(String(s.indigency_fee ?? 0));
        setIdFee(String(s.id_fee ?? 0));
        setCedulaFee(String(s.cedula_fee ?? 0));
        setSignatoryName(s.default_signatory_name || "");
        setSignatoryTitle(s.default_signatory_title || "PUNONG BARANGAY");
        setDocLayout((s.document_layout as "klasiko" | "moderno" | "elegante" | "digital") || "klasiko");
        setDocPaperSize((s.document_paper_size as "a4" | "letter" | "legal") || "a4");
        setDocFont((s.document_font as "times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair") || "times");
        const loadedColorTheme = (s.document_color_theme as typeof docColorTheme) || "plain";
        const loadedDesignPattern = (s.document_design_pattern as typeof docDesignPattern) || "wave";
        setDocColorTheme(loadedColorTheme);
        setDocDesignPattern(loadedDesignPattern);
        // If the barangay has previously customized any design field, skip dummy gating.
        const hasAnyCustom = !!(s.document_paper_size || s.document_font || s.document_color_theme || s.document_design_pattern);
        if (hasAnyCustom) setHasGeneratedPatterns(true);
        // VAWC (RA 9262)
        const v = (s.vawc as Record<string, unknown> | undefined) || {};
        setVawcOfficerName((v.confidentiality_officer_name as string) || "");
        setVawcOfficerPhone((v.confidentiality_officer_phone as string) || "");
        setVawcBcpcName((v.bcpc_contact_name as string) || "");
        setVawcBcpcPhone((v.bcpc_contact_phone as string) || "");
        setVawcDisclaimer((v.ra9262_disclaimer as string) || "");
        setVawcAccessRestricted(v.access_restricted !== false);
        // GAD (RA 9710)
        const g = (s.gad as Record<string, unknown> | undefined) || {};
        setGadFocalName((g.focal_person_name as string) || "");
        setGadFocalTitle((g.focal_person_title as string) || "");
        setGadBudgetPercent(String(g.budget_percent_target ?? 5));
        setGadPlanUrl((g.plan_url as string) || "");
        // KP / Lupong (RA 7160)
        const k = (s.kp as Record<string, unknown> | undefined) || {};
        setKpHearingWindowDays(String(k.hearing_window_days ?? 15));
        setKpMediationExtensionDays(String(k.mediation_extension_days ?? 15));
        setKpArbitrationWindowDays(String(k.arbitration_window_days ?? 15));
        setKpSummonsTemplate((k.summons_template as string) || "");
        // Residents Dictionaries
        const d = (s.residents_dictionaries as Record<string, string[]> | undefined) || {};
        const initialDicts: Record<DictKey, string[]> = {
          puroks: d.puroks || [],
          streets: d.streets || [],
          citizenships: d.citizenships || [],
          religions: d.religions || [],
          ethnicities: d.ethnicities || [],
          occupations: d.occupations || [],
          skills: d.skills || [],
          positions: d.positions || [],
          employers: d.employers || [],
          courses: d.courses || [],
          schools: d.schools || [],
          placesOfBirth: d.placesOfBirth || [],
          businessTypes: d.businessTypes || [],
          sectorsOther: d.sectorsOther || [],
          emergencyRelations: d.emergencyRelations || [],
        };
        setDictionaries(initialDicts);
      } catch {
        addToast("Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save current tab. `postSaveSnapshot` is merged into originalsRef on success so the
  // dirty-state bar clears for the freshly-saved fields.
  const saveSettings = async (fields: Record<string, unknown>, postSaveSnapshot?: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await api.settings.update(fields as Partial<BarangaySettings>);
      setSettings(res.data);
      addToast(t.settings.common.saved);
      refreshUser();
      if (postSaveSnapshot) {
        originalsRef.current = { ...originalsRef.current, ...postSaveSnapshot };
      }
    } catch (e) {
      const err = e as ApiError;
      addToast(err.message || t.settings.common.saveFailed, "error");
    } finally {
      setSaving(false);
    }
  };

  const saveBarangayInfo = () => {
    // Combine paired year inputs back into officials_term ("YYYY-YYYY") if both set,
    // else null. Partial values are rejected — full pair required.
    const officialsTerm = termStartYear && termEndYear
      ? `${termStartYear}-${termEndYear}`
      : null;
    return saveSettings(
      {
        zip_code: zip || null,
        motto: motto || null,
        office_hours: officeHours || null,
        established_year: establishedYear ? parseInt(establishedYear) : null,
        officials_term: officialsTerm,
        // captain_name is now sourced from barangay_officials (Officials tab is source of truth)
      },
      { zip, motto, officeHours, establishedYear, termStartYear, termEndYear },
    );
  };

  const saveContact = () => saveSettings(
    {
      contact_phone: contactPhone || null,
      contact_email: contactEmail || null,
      website_url: websiteUrl || null,
      full_address: fullAddress || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      settings: {
        contact: {
          mobile_number: mobileNumber || null,
          emergency_hotline: emergencyHotline || null,
          facebook_url: facebookUrl || null,
          viber_community_url: viberUrl || null,
          youtube_url: youtubeUrl || null,
          twitter_url: twitterUrl || null,
          instagram_url: instagramUrl || null,
        },
      },
    },
    {
      contactPhone, contactEmail, websiteUrl, fullAddress,
      latitude, longitude,
      mobileNumber, emergencyHotline,
      facebookUrl, viberUrl, youtubeUrl, twitterUrl, instagramUrl,
    },
  );

  const saveSystem = () => saveSettings(
    {
      sms_sender_name: smsSenderName || null,
      settings: {
        default_signatory_name: signatoryName || null,
        default_signatory_title: signatoryTitle || null,
      },
    },
    { smsSenderName, signatoryName, signatoryTitle },
  );

  const saveDocuments = () => saveSettings(
    {
      document_header_text: docHeader || null,
      document_footer_text: docFooter || null,
      settings: {
        certificate_validity_days: certValidityDays ? parseInt(certValidityDays) : 180,
        clearance_fee: clearanceFee ? parseFloat(clearanceFee) : 0,
        indigency_fee: indigencyFee ? parseFloat(indigencyFee) : 0,
        id_fee: idFee ? parseFloat(idFee) : 0,
        cedula_fee: cedulaFee ? parseFloat(cedulaFee) : 0,
        document_layout: docLayout,
        document_paper_size: docPaperSize,
        document_font: docFont,
        document_color_theme: docColorTheme,
        document_design_pattern: docDesignPattern,
      },
    },
    { docHeader, docFooter, certValidityDays, clearanceFee, indigencyFee, idFee, cedulaFee, docLayout, docPaperSize, docFont, docColorTheme, docDesignPattern },
  );

  const saveNotifications = () => saveSettings(
    {
      notification_preferences: {
        sms_new_resident: notifSmsNewResident,
        sms_certificate_issued: notifSmsCert,
        email_alerts: notifEmail,
        daily_summary: notifDaily,
      },
    },
    { notifSmsNewResident, notifSmsCert, notifEmail, notifDaily },
  );

  const saveVawc = () => saveSettings(
    {
      settings: {
        vawc: {
          confidentiality_officer_name: vawcOfficerName || null,
          confidentiality_officer_phone: vawcOfficerPhone || null,
          bcpc_contact_name: vawcBcpcName || null,
          bcpc_contact_phone: vawcBcpcPhone || null,
          ra9262_disclaimer: vawcDisclaimer || null,
          access_restricted: vawcAccessRestricted,
        },
      },
    },
    { vawcOfficerName, vawcOfficerPhone, vawcBcpcName, vawcBcpcPhone, vawcDisclaimer, vawcAccessRestricted },
  );

  const saveGad = () => saveSettings(
    {
      settings: {
        gad: {
          focal_person_name: gadFocalName || null,
          focal_person_title: gadFocalTitle || null,
          budget_percent_target: gadBudgetPercent ? parseFloat(gadBudgetPercent) : 5,
          plan_url: gadPlanUrl || null,
        },
      },
    },
    { gadFocalName, gadFocalTitle, gadBudgetPercent, gadPlanUrl },
  );

  const saveKp = () => saveSettings(
    {
      settings: {
        kp: {
          hearing_window_days: kpHearingWindowDays ? parseInt(kpHearingWindowDays) : 15,
          mediation_extension_days: kpMediationExtensionDays ? parseInt(kpMediationExtensionDays) : 15,
          arbitration_window_days: kpArbitrationWindowDays ? parseInt(kpArbitrationWindowDays) : 15,
          summons_template: kpSummonsTemplate || null,
        },
      },
    },
    { kpHearingWindowDays, kpMediationExtensionDays, kpArbitrationWindowDays, kpSummonsTemplate },
  );

  const saveDictionaries = () => saveSettings(
    { settings: { residents_dictionaries: dictionaries } },
    { dictionaries },
  );

  const addDictEntry = () => {
    const v = newDictEntry.trim();
    if (!v) return;
    if (dictionaries[activeDict].some((e) => e.toLowerCase() === v.toLowerCase())) {
      addToast("Entry already exists", "error");
      return;
    }
    setDictionaries({ ...dictionaries, [activeDict]: [...dictionaries[activeDict], v] });
    setNewDictEntry("");
  };

  const removeDictEntry = (dict: DictKey, idx: number) => {
    setDictionaries({ ...dictionaries, [dict]: dictionaries[dict].filter((_, i) => i !== idx) });
  };

  // ── Dirty-state tracking for the sticky save bar ──
  // Maps each save-bar tab to (a) its current field snapshot and (b) setters to use on Discard.
  const tabFieldSnapshot: Record<string, Record<string, unknown>> = {
    info: { zip, motto, officeHours, establishedYear, termStartYear, termEndYear },
    contact: {
      contactPhone, contactEmail, websiteUrl, fullAddress,
      latitude, longitude,
      mobileNumber, emergencyHotline,
      facebookUrl, viberUrl, youtubeUrl, twitterUrl, instagramUrl,
    },
    documents: { docHeader, docFooter, certValidityDays, clearanceFee, indigencyFee, idFee, cedulaFee, docLayout, docPaperSize, docFont, docColorTheme, docDesignPattern },
    system: { smsSenderName, signatoryName, signatoryTitle },
    notifications: { notifSmsNewResident, notifSmsCert, notifEmail, notifDaily },
    vawc: { vawcOfficerName, vawcOfficerPhone, vawcBcpcName, vawcBcpcPhone, vawcDisclaimer, vawcAccessRestricted },
    gad: { gadFocalName, gadFocalTitle, gadBudgetPercent, gadPlanUrl },
    kp: { kpHearingWindowDays, kpMediationExtensionDays, kpArbitrationWindowDays, kpSummonsTemplate },
    "residents-dict": { dictionaries },
  };

  const tabFieldSetters: Record<string, Record<string, (v: unknown) => void>> = {
    info: { zip: (v) => setZip(v as string), motto: (v) => setMotto(v as string), officeHours: (v) => setOfficeHours(v as string), establishedYear: (v) => setEstablishedYear(v as string), termStartYear: (v) => setTermStartYear(v as string), termEndYear: (v) => setTermEndYear(v as string) },
    contact: {
      contactPhone: (v) => setContactPhone(v as string),
      contactEmail: (v) => setContactEmail(v as string),
      websiteUrl: (v) => setWebsiteUrl(v as string),
      fullAddress: (v) => setFullAddress(v as string),
      latitude: (v) => setLatitude(v as string),
      longitude: (v) => setLongitude(v as string),
      mobileNumber: (v) => setMobileNumber(v as string),
      emergencyHotline: (v) => setEmergencyHotline(v as string),
      facebookUrl: (v) => setFacebookUrl(v as string),
      viberUrl: (v) => setViberUrl(v as string),
      youtubeUrl: (v) => setYoutubeUrl(v as string),
      twitterUrl: (v) => setTwitterUrl(v as string),
      instagramUrl: (v) => setInstagramUrl(v as string),
    },
    documents: {
      docHeader: (v) => setDocHeader(v as string),
      docFooter: (v) => setDocFooter(v as string),
      certValidityDays: (v) => setCertValidityDays(v as string),
      clearanceFee: (v) => setClearanceFee(v as string),
      indigencyFee: (v) => setIndigencyFee(v as string),
      idFee: (v) => setIdFee(v as string),
      cedulaFee: (v) => setCedulaFee(v as string),
      docLayout: (v) => setDocLayout(v as "klasiko" | "moderno" | "elegante" | "digital"),
      docPaperSize: (v) => setDocPaperSize(v as "a4" | "letter" | "legal"),
      docFont: (v) => setDocFont(v as "times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair"),
      docColorTheme: (v) => setDocColorTheme(v as typeof docColorTheme),
      docDesignPattern: (v) => setDocDesignPattern(v as typeof docDesignPattern),
    },
    "customize-template": {
      docLayout: (v) => setDocLayout(v as "klasiko" | "moderno" | "elegante" | "digital"),
      docPaperSize: (v) => setDocPaperSize(v as "a4" | "letter" | "legal"),
      docFont: (v) => setDocFont(v as "times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair"),
      docColorTheme: (v) => setDocColorTheme(v as typeof docColorTheme),
      docDesignPattern: (v) => setDocDesignPattern(v as typeof docDesignPattern),
    },
    system: { smsSenderName: (v) => setSmsSenderName(v as string), signatoryName: (v) => setSignatoryName(v as string), signatoryTitle: (v) => setSignatoryTitle(v as string) },
    notifications: { notifSmsNewResident: (v) => setNotifSmsNewResident(v as boolean), notifSmsCert: (v) => setNotifSmsCert(v as boolean), notifEmail: (v) => setNotifEmail(v as boolean), notifDaily: (v) => setNotifDaily(v as boolean) },
    vawc: { vawcOfficerName: (v) => setVawcOfficerName(v as string), vawcOfficerPhone: (v) => setVawcOfficerPhone(v as string), vawcBcpcName: (v) => setVawcBcpcName(v as string), vawcBcpcPhone: (v) => setVawcBcpcPhone(v as string), vawcDisclaimer: (v) => setVawcDisclaimer(v as string), vawcAccessRestricted: (v) => setVawcAccessRestricted(v as boolean) },
    gad: { gadFocalName: (v) => setGadFocalName(v as string), gadFocalTitle: (v) => setGadFocalTitle(v as string), gadBudgetPercent: (v) => setGadBudgetPercent(v as string), gadPlanUrl: (v) => setGadPlanUrl(v as string) },
    kp: { kpHearingWindowDays: (v) => setKpHearingWindowDays(v as string), kpMediationExtensionDays: (v) => setKpMediationExtensionDays(v as string), kpArbitrationWindowDays: (v) => setKpArbitrationWindowDays(v as string), kpSummonsTemplate: (v) => setKpSummonsTemplate(v as string) },
    "residents-dict": { dictionaries: (v) => setDictionaries(v as Record<DictKey, string[]>) },
    "customize-template": {
      docLayout: (v) => setDocLayout(v as "klasiko" | "moderno" | "elegante" | "digital"),
      docPaperSize: (v) => setDocPaperSize(v as "a4" | "letter" | "legal"),
      docFont: (v) => setDocFont(v as "times" | "arial" | "inter" | "poppins" | "merriweather" | "playfair"),
      docColorTheme: (v) => setDocColorTheme(v as typeof docColorTheme),
      docDesignPattern: (v) => setDocDesignPattern(v as typeof docDesignPattern),
    },
  };

  // Tabs that use the sticky save bar (self-managed tabs excluded: branding/officials/fees handle their own writes)
  const SAVE_BAR_TABS = ["info", "contact", "documents", "customize-template", "system", "notifications", "vawc", "gad", "kp", "residents-dict"];

  // Current tab's dirty diff
  const currentTabSnapshot = tabFieldSnapshot[activeSection] || {};
  const changedFieldKeys = Object.keys(currentTabSnapshot).filter((key) => {
    return JSON.stringify(currentTabSnapshot[key]) !== JSON.stringify(originalsRef.current[key]);
  });
  const isCurrentTabDirty = changedFieldKeys.length > 0;
  const shouldShowSaveBar = SAVE_BAR_TABS.includes(activeSection) && isCurrentTabDirty;

  const handleDiscardChanges = () => {
    const setters = tabFieldSetters[activeSection];
    if (!setters) return;
    for (const key of Object.keys(currentTabSnapshot)) {
      const setter = setters[key];
      if (setter) setter(originalsRef.current[key]);
    }
    // Clear any validation errors — discarded values are guaranteed valid (they came from the API)
    setFieldErrors({});
  };

  const hasValidationErrors = Object.values(fieldErrors).some((v) => v != null && v !== "");

  // Tab-switch guard — warn if current tab has unsaved changes
  const handleTabSwitch = (nextSection: string) => {
    if (nextSection === activeSection) return;
    if (isCurrentTabDirty) {
      const ok = typeof window !== "undefined" && window.confirm(
        `You have ${changedFieldKeys.length} unsaved ${changedFieldKeys.length === 1 ? "change" : "changes"} in this tab. Discard and continue?`,
      );
      if (!ok) return;
      handleDiscardChanges();
    }
    setActiveSection(nextSection);
  };

  // Warn user about unsaved changes when navigating away
  useEffect(() => {
    if (!isCurrentTabDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isCurrentTabDirty]);

  // Fetch the current kapitan from Officials when Barangay Info tab opens
  useEffect(() => {
    if (activeSection !== "info") return;
    let cancelled = false;
    api.officials.list({ position: "kapitan", per_page: 1, is_active: true })
      .then((res) => {
        if (cancelled) return;
        setKapitanOfficial(res.data?.[0] ?? null);
      })
      .catch(() => { /* silent — fall back to legacy captain_name display */ });
    return () => { cancelled = true; };
  }, [activeSection]);

  // Fetch ALL active officials for the Klasiko sidebar preview on the Documents tab.
  // Tenant-scoped by the API; we only need this when the preview is visible.
  useEffect(() => {
    if (activeSection !== "documents" && activeSection !== "customize-template") return;
    let cancelled = false;
    api.officials.list({ per_page: 50, is_active: true, sort_by: "sort_order", sort_dir: "asc" })
      .then((res) => { if (!cancelled) setAllOfficials(res.data ?? []); })
      .catch(() => { /* silent — preview falls back to empty list */ });
    return () => { cancelled = true; };
  }, [activeSection]);

  // Format the kapitan's display name from the eager-loaded resident
  const kapitanDisplayName = (() => {
    if (kapitanOfficial?.resident) {
      const r = kapitanOfficial.resident;
      return [r.first_name, r.middle_name, r.last_name, r.extension].filter(Boolean).join(" ");
    }
    // Legacy fallback: barangays.captain_name (will be deprecated once Officials is fully adopted)
    return captainName || "";
  })();

  const previewOfficials = getPreviewOfficials(allOfficials);
  const previewCopy = getPreviewCertificateCopy(settings?.name, settings?.city_municipality);
  const previewCaptainOfficial = findOfficialByPosition(allOfficials, ["kapitan"]);
  const previewSecretaryOfficial = findOfficialByPosition(allOfficials, ["secretary"]);
  const previewTreasurerOfficial = findOfficialByPosition(allOfficials, ["treasurer"]);
  const previewCaptainName = getOfficialDisplayName(previewCaptainOfficial) || kapitanDisplayName.toUpperCase() || "JUAN DELA CRUZ";
  const previewSecretaryName = getOfficialDisplayName(previewSecretaryOfficial) || "ANA REYES";
  const previewTreasurerName = getOfficialDisplayName(previewTreasurerOfficial) || "PABLO SANTOS";
  const previewSignatoryName = (signatoryName || previewCaptainName || "JUAN DELA CRUZ").toUpperCase();
  const previewSignatoryTitle = (signatoryTitle || "PUNONG BARANGAY").toUpperCase();
  const previewIssueDate = new Date();
  const previewExpiryDate = new Date(previewIssueDate.getTime() + (parseInt(certValidityDays) || 180) * 86_400_000);
  const previewFormatDate = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const previewFontFamily = PREVIEW_FONT_FAMILY[docFont];

  // Load usage data when fees tab is active
  useEffect(() => {
    if (activeSection !== "fees" || usage) return;
    setUsageLoading(true);
    api.settings.getUsage()
      .then((data) => setUsage(data))
      .catch(() => addToast("Failed to load usage data", "error"))
      .finally(() => setUsageLoading(false));
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const res = await api.settings.uploadLogo(file);
      setLogoUrl(res.url);
      addToast("Logo uploaded successfully");
      refreshUser();
    } catch (e) {
      const err = e as ApiError;
      addToast(err.message || "Logo upload failed", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleMunicipalityLogoUpload = async (file: File) => {
    setUploadingMunicipalityLogo(true);
    try {
      const res = await api.settings.uploadMunicipalityLogo(file);
      setMunicipalityLogoUrl(res.url);
      addToast("City/Municipality logo uploaded successfully");
      refreshUser();
    } catch (e) {
      const err = e as ApiError;
      addToast(err.message || "City/Municipality logo upload failed", "error");
    } finally {
      setUploadingMunicipalityLogo(false);
    }
  };

  const sectionGroups = [
    {
      title: t.settings.groups.foundation,
      items: [
        { id: "info", label: t.settings.tabs.info, icon: Building2 },
        { id: "contact", label: t.settings.tabs.contact, icon: Phone },
        { id: "branding", label: t.settings.tabs.branding, icon: Upload },
        { id: "officials", label: t.settings.tabs.officials, icon: Users },
      ],
    },
    {
      title: t.settings.groups.docsServices,
      items: [
        { id: "documents", label: t.settings.tabs.documents, icon: FileText },
        { id: "customize-template", label: "Customize Template", icon: ImageIcon },
        { id: "system", label: t.settings.tabs.systemPrefs, icon: Shield },
      ],
    },
    {
      title: t.settings.groups.compliance,
      items: [
        { id: "vawc", label: t.settings.tabs.vawc, icon: ShieldAlert },
        { id: "gad", label: t.settings.tabs.gad, icon: Heart },
        { id: "kp", label: t.settings.tabs.kp, icon: Scale },
      ],
    },
    {
      title: t.settings.groups.records,
      items: [
        { id: "residents-dict", label: t.settings.tabs.residentsDict, icon: BookOpen },
      ],
    },
    {
      title: t.settings.groups.system,
      items: [
        { id: "notifications", label: t.settings.tabs.notifications, icon: Bell },
        { id: "fees", label: t.settings.tabs.fees, icon: Banknote },
      ],
    },
  ];

  const saveFn: Record<string, () => void> = {
    info: saveBarangayInfo,
    contact: saveContact,
    branding: () => {},
    officials: () => {}, // OfficialsTab manages its own CRUD via per-row save
    fees: () => {},
    system: saveSystem,
    documents: saveDocuments,
    "customize-template": saveDocuments,
    notifications: saveNotifications,
    vawc: saveVawc,
    gad: saveGad,
    kp: saveKp,
    "residents-dict": saveDictionaries,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.settings.pageTitle}
        description={t.settings.pageDescription}
        breadcrumbs={[{ label: t.nav.dashboard, href: "/dashboard" }, { label: t.settings.pageTitle }]}
      />

      <div className="flex gap-6">
        {/* Sidebar — grouped categories */}
        <div className="w-60 shrink-0">
          <div className="sticky top-6 space-y-5">
            {sectionGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/55 tracking-[0.18em] uppercase">
                  {group.title}
                </p>
                <div className="space-y-px">
                  {group.items.map((s) => {
                    const SIcon = s.icon;
                    const active = activeSection === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleTabSwitch(s.id)}
                        className={cn(
                          "group relative w-full flex items-center gap-2.5 pl-3 pr-2.5 py-[7px] rounded-md text-[13px] transition-all duration-150 text-left",
                          active ? "font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        style={active ? { color: "var(--accent-primary)", background: "var(--accent-bg)" } : undefined}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r"
                            style={{ background: "var(--accent-primary)" }}
                          />
                        )}
                        <SIcon className={cn("h-4 w-4 shrink-0 transition-opacity", !active && "opacity-80 group-hover:opacity-100")} />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Tab 1: Barangay Info */}
          {activeSection === "info" && (
            <div className="glass rounded-xl overflow-hidden">
              {/* Page header */}
              <div className="px-6 pt-6 pb-4 border-b border-border/40">
                <h2 className="text-lg font-semibold text-foreground">{t.settings.info.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t.settings.info.description}</p>
              </div>

              {/* ── Section 1: Identity & Demographics ── */}
              <div className="px-6 py-5 border-b border-border/40">
                <SectionHeader
                  icon={Building2}
                  title="Identity & Demographics"
                  subtitle="Synced from PSGC code — not editable here"
                />
                <div className="space-y-4">
                  <SettingsInput label={t.settings.info.barangayName} value={settings?.name || ""} onChange={() => {}} icon={Building2} disabled />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SettingsInput label={t.settings.info.psgcCode} value={settings?.psgc_code || ""} onChange={() => {}} disabled />
                    <SettingsInput label={t.settings.info.cityMunicipality} value={settings?.city_municipality || ""} onChange={() => {}} disabled />
                    <SettingsInput label={t.settings.info.province} value={settings?.province || ""} onChange={() => {}} disabled />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsInput label={t.settings.info.population} value={settings?.population ? settings.population.toLocaleString() : ""} onChange={() => {}} disabled />
                    <SettingsInput
                      label={t.settings.info.zipCode}
                      value={zip}
                      onChange={(v) => {
                        setZip(v);
                        const valid = !v || /^\d{4}$/.test(v);
                        setFieldErrors((p) => ({ ...p, zip: valid ? null : t.settings.info.zipError }));
                      }}
                      placeholder={t.settings.info.zipPlaceholder}
                      error={fieldErrors.zip || undefined}
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 2: Profile ── */}
              <div className="px-6 py-5 border-b border-border/40">
                <SectionHeader
                  icon={Info}
                  title="Profile"
                  subtitle="Identity details printed on documents and shown to constituents"
                />
                <div className="space-y-4">
                  <SettingsInput label={t.settings.info.motto} value={motto} onChange={setMotto} placeholder={t.settings.info.mottoPlaceholder} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsInput
                      label={t.settings.info.establishedYear}
                      value={establishedYear}
                      onChange={(v) => {
                        setEstablishedYear(v);
                        const n = parseInt(v);
                        const thisYear = new Date().getFullYear();
                        const valid = !v || (n >= 1900 && n <= thisYear + 1);
                        setFieldErrors((p) => ({ ...p, establishedYear: valid ? null : `${t.settings.info.yearError} ${thisYear + 1}.` }));
                      }}
                      placeholder={t.settings.info.yearPlaceholder}
                      type="number"
                      error={fieldErrors.establishedYear || undefined}
                    />
                    <SettingsInput
                      label={t.settings.info.officeHours}
                      value={officeHours}
                      onChange={setOfficeHours}
                      placeholder={t.settings.info.officeHoursPlaceholder}
                      icon={Clock}
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 3: Current Term ── */}
              <div className="px-6 py-5 border-b border-border/40">
                <SectionHeader
                  icon={Calendar}
                  title="Current Term"
                  subtitle="Year the active officials were elected and the year their term ends"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingsInput
                    label="Term Start Year"
                    value={termStartYear}
                    onChange={(v) => {
                      const digits = v.replace(/\D/g, "").slice(0, 4);
                      setTermStartYear(digits);
                      const n = parseInt(digits);
                      const thisYear = new Date().getFullYear();
                      const valid = !digits || (digits.length === 4 && n >= 1990 && n <= thisYear + 1);
                      setFieldErrors((p) => ({ ...p, termStartYear: valid ? null : `Year must be 1990 – ${thisYear + 1}.` }));
                    }}
                    placeholder="e.g. 2023"
                    type="number"
                    error={fieldErrors.termStartYear || undefined}
                  />
                  <SettingsInput
                    label="Term End Year"
                    value={termEndYear}
                    onChange={(v) => {
                      const digits = v.replace(/\D/g, "").slice(0, 4);
                      setTermEndYear(digits);
                      const n = parseInt(digits);
                      const start = parseInt(termStartYear);
                      const thisYear = new Date().getFullYear();
                      const valid = !digits || (
                        digits.length === 4 &&
                        n >= 1990 &&
                        n <= thisYear + 10 &&
                        (Number.isNaN(start) || n > start)
                      );
                      setFieldErrors((p) => ({ ...p, termEndYear: valid ? null : "Must be after start year." }));
                    }}
                    placeholder="e.g. 2026"
                    type="number"
                    error={fieldErrors.termEndYear || undefined}
                  />
                </div>
                {termStartYear && termEndYear && !fieldErrors.termStartYear && !fieldErrors.termEndYear && (
                  <p className="text-[11px] text-muted-foreground mt-2 px-1">
                    Stored as <code className="text-[10px] bg-muted/40 px-1 rounded">{termStartYear}-{termEndYear}</code> on every document footer.
                  </p>
                )}
              </div>

              {/* ── Section 4: Leadership ── */}
              <div className="px-6 py-5">
                <SectionHeader
                  icon={Crown}
                  title="Leadership"
                  subtitle="The Punong Barangay name is pulled from the Officials tab"
                />
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl glass-input">
                  {kapitanOfficial ? (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--accent-bg)", color: "var(--accent-primary)" }}>
                        <Crown className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{kapitanDisplayName}</p>
                        <p className="text-[11px] text-muted-foreground">{t.settings.info.captainFromOfficials}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted">
                        <Crown className="w-4 h-4 text-muted-foreground/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground italic">{t.settings.info.captainNotSet}</p>
                        <p className="text-[11px] text-muted-foreground/70">{t.settings.info.captainNotSetHint}</p>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch("officials")}
                    className="shrink-0 text-[12px] font-medium hover:underline"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {t.settings.info.manageInOfficials}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1.5 px-1">
                  {t.settings.info.captainHelper}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Contact Details */}
          {activeSection === "contact" && (
            <div className="space-y-4">
              {/* Top note — set the tone: everything below is optional */}
              <div className="p-3 rounded-lg glass-subtle flex items-start gap-2.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                <p className="text-[12px] text-muted-foreground">{t.settings.contact.topNote}</p>
              </div>

              {/* ─── Section: Communication ──────────────────────────────── */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }}>
                    <Phone className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">{t.settings.contact.communication.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.settings.contact.communication.description}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <SettingsInput
                    label="Office Landline"
                    value={contactPhone}
                    onChange={(v) => {
                      setContactPhone(v);
                      const valid = !v || /^[\d\s\-()+]{7,20}$/.test(v);
                      setFieldErrors((p) => ({ ...p, contactPhone: valid ? null : "Use digits, spaces, +, -, ( )." }));
                    }}
                    icon={Phone}
                    placeholder="e.g. (02) 8123-4567"
                    error={fieldErrors.contactPhone || undefined}
                  />
                  <SettingsInput
                    label="Mobile / SMS Hotline"
                    value={mobileNumber}
                    onChange={(v) => {
                      setMobileNumber(v);
                      const digits = v.replace(/\D/g, "");
                      const valid = !v || /^09\d{9}$/.test(digits);
                      setFieldErrors((p) => ({ ...p, mobileNumber: valid ? null : "Mobile must be Philippine format: 09XXXXXXXXX." }));
                    }}
                    icon={Smartphone}
                    placeholder="e.g. 09171234567"
                    error={fieldErrors.mobileNumber || undefined}
                  />
                  <SettingsInput
                    label="Emergency Hotline"
                    value={emergencyHotline}
                    onChange={setEmergencyHotline}
                    icon={Siren}
                    placeholder="e.g. 09181234567 or (02) 911-1234"
                  />
                  <SettingsInput
                    label="Email"
                    value={contactEmail}
                    onChange={(v) => {
                      setContactEmail(v);
                      const valid = !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                      setFieldErrors((p) => ({ ...p, contactEmail: valid ? null : "Enter a valid email address." }));
                    }}
                    icon={Mail}
                    placeholder="e.g. brgy.tambo@paranaque.gov.ph"
                    error={fieldErrors.contactEmail || undefined}
                  />
                  <SettingsInput
                    label="Website URL"
                    value={websiteUrl}
                    onChange={(v) => {
                      setWebsiteUrl(v);
                      const valid = !v || /^https:\/\/[^\s]+\.[^\s]+/.test(v);
                      setFieldErrors((p) => ({ ...p, websiteUrl: valid ? null : "Website must start with https:// for security." }));
                    }}
                    icon={Globe}
                    placeholder="https://tambo.barangay.org.ph"
                    error={fieldErrors.websiteUrl || undefined}
                  />
                </div>
              </div>

              {/* ─── Section: Address & Location ─────────────────────────── */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }}>
                    <MapPin className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">{t.settings.contact.location.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.settings.contact.location.description}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <SettingsInput
                    label="Office Address"
                    value={fullAddress}
                    onChange={setFullAddress}
                    placeholder="Barangay Hall, Street, City"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsInput
                      label="Latitude"
                      value={latitude}
                      onChange={(v) => {
                        setLatitude(v);
                        const n = parseFloat(v);
                        const valid = !v || (!isNaN(n) && n >= 4.5 && n <= 21.5);
                        setFieldErrors((p) => ({ ...p, latitude: valid ? null : "Latitude must be in Philippine bounds (4.5 to 21.5)." }));
                      }}
                      placeholder="e.g. 14.5184"
                      error={fieldErrors.latitude || undefined}
                    />
                    <SettingsInput
                      label="Longitude"
                      value={longitude}
                      onChange={(v) => {
                        setLongitude(v);
                        const n = parseFloat(v);
                        const valid = !v || (!isNaN(n) && n >= 116 && n <= 127);
                        setFieldErrors((p) => ({ ...p, longitude: valid ? null : "Longitude must be in Philippine bounds (116 to 127)." }));
                      }}
                      placeholder="e.g. 120.9938"
                      error={fieldErrors.longitude || undefined}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 px-1">
                    Find coordinates on Google Maps: right-click on your barangay hall → copy the lat,lng pair.
                  </p>
                </div>
              </div>

              {/* ─── Section: Social Media ───────────────────────────────── */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }}>
                    <Globe className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">{t.settings.contact.social.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.settings.contact.social.description}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <SettingsInput
                    label="Facebook Page"
                    value={facebookUrl}
                    onChange={(v) => {
                      setFacebookUrl(v);
                      const valid = !v || /^https:\/\/(www\.)?(facebook|fb)\.com\/[^\s]+/i.test(v);
                      setFieldErrors((p) => ({ ...p, facebookUrl: valid ? null : "Must be an https:// facebook.com URL." }));
                    }}
                    icon={Facebook}
                    placeholder="https://facebook.com/brgytambo"
                    error={fieldErrors.facebookUrl || undefined}
                  />
                  <SettingsInput
                    label="Viber Community"
                    value={viberUrl}
                    onChange={(v) => {
                      setViberUrl(v);
                      const valid = !v || /^https:\/\/[^\s]+\.[^\s]+/.test(v);
                      setFieldErrors((p) => ({ ...p, viberUrl: valid ? null : "Must start with https://." }));
                    }}
                    icon={MessageSquare}
                    placeholder="https://invite.viber.com/?..."
                    error={fieldErrors.viberUrl || undefined}
                  />
                  <SettingsInput
                    label="YouTube Channel"
                    value={youtubeUrl}
                    onChange={(v) => {
                      setYoutubeUrl(v);
                      const valid = !v || /^https:\/\/(www\.)?youtube\.com\/[^\s]+/i.test(v);
                      setFieldErrors((p) => ({ ...p, youtubeUrl: valid ? null : "Must be an https:// youtube.com URL." }));
                    }}
                    icon={Youtube}
                    placeholder="https://youtube.com/@brgytambo"
                    error={fieldErrors.youtubeUrl || undefined}
                  />
                  <SettingsInput
                    label="Twitter / X"
                    value={twitterUrl}
                    onChange={(v) => {
                      setTwitterUrl(v);
                      const valid = !v || /^https:\/\/(www\.)?(twitter|x)\.com\/[^\s]+/i.test(v);
                      setFieldErrors((p) => ({ ...p, twitterUrl: valid ? null : "Must be an https:// twitter.com or x.com URL." }));
                    }}
                    icon={Twitter}
                    placeholder="https://x.com/brgytambo"
                    error={fieldErrors.twitterUrl || undefined}
                  />
                  <SettingsInput
                    label="Instagram"
                    value={instagramUrl}
                    onChange={(v) => {
                      setInstagramUrl(v);
                      const valid = !v || /^https:\/\/(www\.)?instagram\.com\/[^\s]+/i.test(v);
                      setFieldErrors((p) => ({ ...p, instagramUrl: valid ? null : "Must be an https:// instagram.com URL." }));
                    }}
                    icon={Instagram}
                    placeholder="https://instagram.com/brgytambo"
                    error={fieldErrors.instagramUrl || undefined}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Branding — Barangay Logo + City/Municipality Logo */}
          {activeSection === "branding" && (
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">{t.settings.branding.title}</h2>
              <p className="text-sm text-muted-foreground mb-5">{t.settings.branding.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <ImageUpload label="Barangay Logo" hint="The official logo of this barangay. Appears on documents, certificates, the public portal, and the right circle of the sidebar identity. Recommended: square 512×512px."
                  currentUrl={resolvePhotoUrl(logoUrl)} onUpload={handleLogoUpload} uploading={uploadingLogo} />
                <ImageUpload label="City / Municipality Logo" hint="The official logo of your city or municipality (e.g. Paranaque City). Appears on document letterheads and the left circle of the sidebar identity."
                  currentUrl={resolvePhotoUrl(municipalityLogoUrl)} onUpload={handleMunicipalityLogoUpload} uploading={uploadingMunicipalityLogo} />
              </div>
            </div>
          )}

          {/* Tab 4: Fees & Charges (PrimeX Billing & Usage) */}
          {activeSection === "fees" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Fees & Charges</h2>
                <p className="text-sm text-muted-foreground mb-5">PrimeX platform charges and your barangay&apos;s resource usage.</p>

                {usageLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : usage ? (
                  <div className="space-y-5">
                    {/* Subscription Plan */}
                    <div className="p-4 rounded-xl border border-border bg-accent-bg/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-accent-text" />
                          <h3 className="text-sm font-semibold text-foreground">Subscription Plan</h3>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 uppercase">{usage.subscription.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Plan</p>
                          <p className="text-sm font-medium text-foreground">{usage.subscription.plan}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Renewal Date</p>
                          <p className="text-sm font-medium text-foreground">{usage.subscription.expires_at ? new Date(usage.subscription.expires_at).toLocaleDateString() : "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Credit Balances */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Credit Balances</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">SMS Credits</p>
                          </div>
                          <p className="text-xl font-bold text-foreground">{usage.sms.balance.toFixed(2)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{usage.sms.sent_this_month} sent this month</p>
                        </div>
                        <div className="p-3 rounded-xl border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="h-3.5 w-3.5 text-purple-500" />
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">AI Credits</p>
                          </div>
                          <p className="text-xl font-bold text-foreground">{usage.ai.balance.toFixed(2)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Mabini AI queries</p>
                        </div>
                      </div>
                    </div>

                    {/* SMS Usage Breakdown */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">SMS Usage</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl border border-border text-center">
                          <p className="text-lg font-bold text-foreground">{usage.sms.total_sent}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Total Sent</p>
                        </div>
                        <div className="p-3 rounded-xl border border-border text-center">
                          <p className="text-lg font-bold text-foreground">{usage.sms.total_credits_used.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Credits Used</p>
                        </div>
                        <div className="p-3 rounded-xl border border-border text-center">
                          <p className="text-lg font-bold text-foreground">{usage.sms.credits_this_month.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">This Month</p>
                        </div>
                      </div>
                    </div>

                    {/* Storage Usage */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Storage Usage</h3>
                      <div className="p-4 rounded-xl border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-sm font-medium text-foreground">
                              {(usage.storage.used_bytes / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            of {(usage.storage.limit_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min((usage.storage.used_bytes / usage.storage.limit_bytes) * 100, 100)}%`,
                              background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)",
                            }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">{usage.storage.file_count} files uploaded</p>
                      </div>
                    </div>

                    {/* Data Usage */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Data Usage</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl border border-border text-center">
                          <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                          <p className="text-lg font-bold text-foreground">{usage.data.residents.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Residents</p>
                        </div>
                        <div className="p-3 rounded-xl border border-border text-center">
                          <Shield className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                          <p className="text-lg font-bold text-foreground">{usage.data.active_users}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Active Users</p>
                        </div>
                        <div className="p-3 rounded-xl border border-border text-center">
                          <Building2 className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                          <p className="text-lg font-bold text-foreground">{(usage.data.population || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Population</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Unable to load usage data.</p>
                )}
              </div>

              <div className="p-3 rounded-lg glass-subtle">
                <p className="text-xs text-muted-foreground">
                  To add SMS or AI credits, contact PrimeX support. Storage limits can be upgraded based on your subscription plan.
                </p>
              </div>
            </div>
          )}

          
          {/* Tab: Customize Template */}
          {activeSection === "customize-template" && (
            <div className="space-y-4">
              <div className="glass rounded-xl overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-border/40">
                  <h2 className="text-lg font-semibold text-foreground">Customize Template</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Manage global theme and certificate designs for your documents.</p>
                </div>

                <div className="flex items-center gap-6 px-6 border-b border-border/40 overflow-x-auto">
                  <button className="flex items-center gap-2 py-3 border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-medium text-sm whitespace-nowrap">
                    <Globe className="w-4 h-4" /> Global Theme
                  </button>
                  <button className="flex items-center gap-2 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium text-sm whitespace-nowrap opacity-50 cursor-not-allowed">
                    <User className="w-4 h-4" /> Resident Certificates
                  </button>
                  <button className="flex items-center gap-2 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium text-sm whitespace-nowrap opacity-50 cursor-not-allowed">
                    <Building2 className="w-4 h-4" /> Establishment Certificates
                  </button>
                  <button className="flex items-center gap-2 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium text-sm whitespace-nowrap opacity-50 cursor-not-allowed">
                    <MapPin className="w-4 h-4" /> Lot & Building Certificates
                  </button>
                  <div className="flex-1" />
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground whitespace-nowrap">Reset to Default</button>
                  <button onClick={() => saveDocuments()} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors whitespace-nowrap" style={{ background: "var(--accent-primary)" }}>
                    <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Save Global Theme</div>
                  </button>
                </div>

                <div className="p-6 bg-muted/5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">Global Theme Settings</h3>
                        <p className="text-xs text-muted-foreground mb-5">This theme will be applied as the default design for all certificates.</p>

                        {/* Document Structure — tiny real previews */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Document Structure</p>
                            <div className="flex-1 h-px bg-border/60" />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {([
                              { id: "klasiko" as const, label: "Classic Sidebar" },
                              { id: "elegante" as const, label: "Formal Government" },
                              { id: "moderno" as const, label: "Centered Modern" },
                            ] as const).map((layout) => {
                              const isActive = docLayout === layout.id;
                              return (
                                <button
                                  key={layout.id}
                                  type="button"
                                  onClick={() => { setDocLayout(layout.id as typeof docLayout); setHasGeneratedPatterns(true); }}
                                  aria-label={layout.label}
                                  className={cn(
                                    "rounded-lg border-2 transition-all overflow-hidden group relative bg-background/40",
                                    isActive
                                      ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-md"
                                      : "border-border/60 hover:border-blue-500/40"
                                  )}
                                >
                                  <div className="pointer-events-none select-none w-full">
                                    <ResponsiveThumbnail
                                      layout={layout.id}
                                      docPaperSize={docPaperSize}
                                      docFont={docFont}
                                      docColorTheme={docColorTheme}
                                      docDesignPattern={docDesignPattern}
                                      settings={settings}
                                      logoUrl={resolvePhotoUrl(logoUrl)}
                                      municipalityLogoUrl={resolvePhotoUrl(municipalityLogoUrl)}
                                      signatoryName={signatoryName}
                                      signatoryTitle={signatoryTitle}
                                    />
                                  </div>
                                  <div className="px-2 py-1.5 border-t border-border/40 bg-background/40 flex items-center justify-between gap-1">
                                    <p className="text-[11px] font-semibold text-foreground truncate">{layout.label}</p>
                                    {isActive && (
                                      <span className="text-[8px] font-medium px-1 py-0.5 rounded-full text-white shrink-0" style={{ background: "var(--accent-primary)" }}>Active</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Color Theme and Design Pattern - Compressed Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                          {/* Color Theme */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">Color Theme</p>
                            <ColorThemeDropdown 
                              value={docColorTheme} 
                              onChange={(val) => { setDocColorTheme(val as any); setHasGeneratedPatterns(true); }} 
                            />
                          </div>

                          {/* Design Pattern */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">Design Pattern</p>
                            <DesignPatternDropdown 
                              value={docDesignPattern} 
                              options={STRUCTURE_PATTERNS[docLayout] || STRUCTURE_PATTERNS.klasiko}
                              onChange={(val) => setDocDesignPattern(val as any)} 
                            />
                          </div>
                        </div>

                        {/* Document Font Horizontal Block */}
                        <div className="flex flex-col md:flex-row bg-background/40 rounded-xl p-4 mb-4 border border-border/60 shadow-sm">
                          <div className="md:w-1/3 mb-3 md:mb-0 pr-4">
                            <h4 className="text-[13px] font-semibold text-foreground">Document Font</h4>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Select the default font for all certificates.</p>
                          </div>
                          <div className="md:w-2/3 flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative w-full sm:w-1/2">
                              <select
                                value={docFont}
                                onChange={(e) => { setDocFont(e.target.value as any); setHasGeneratedPatterns(true); }}
                                className="w-full bg-background/60 border-2 border-border/60 rounded-lg pl-3 pr-8 py-2.5 text-sm font-medium text-foreground hover:border-blue-500/40 focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="times">Times New Roman</option>
                                <option value="arial">Arial</option>
                                <option value="inter">Inter</option>
                                <option value="poppins">Poppins</option>
                                <option value="merriweather">Merriweather</option>
                                <option value="playfair">Playfair Display</option>
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                            <div 
                              className="w-full sm:w-1/2 bg-background/60 border border-border/60 rounded-lg p-2.5 text-foreground flex items-center justify-center text-center text-sm"
                              style={{ 
                                fontFamily: docFont === "times" ? "'Times New Roman', Times, serif" : 
                                            docFont === "arial" ? "Arial, sans-serif" :
                                            docFont === "inter" ? "'Inter', sans-serif" :
                                            docFont === "poppins" ? "'Poppins', sans-serif" :
                                            docFont === "merriweather" ? "'Merriweather', serif" :
                                            docFont === "playfair" ? "'Playfair Display', serif" : "inherit"
                              }}
                            >
                              The quick brown fox jumps over the lazy dog.
                            </div>
                          </div>
                        </div>

                        {/* Paper Size Horizontal Block */}
                        <div className="flex flex-col md:flex-row bg-background/40 rounded-xl p-4 mb-6 border border-border/60 shadow-sm">
                          <div className="md:w-1/3 mb-3 md:mb-0 pr-4">
                            <h4 className="text-[13px] font-semibold text-foreground">Paper Size</h4>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Select the default paper size.</p>
                          </div>
                          <div className="md:w-2/3 grid grid-cols-3 gap-3 w-full">
                            {[
                              { id: "a4", label: "A4", dims: "210 x 297 mm" },
                              { id: "letter", label: "Letter", dims: "8.5 x 11 in" },
                              { id: "legal", label: "Legal", dims: "8.5 x 13 in" },
                            ].map((size) => {
                              const isActive = docPaperSize === size.id;
                              return (
                                <button
                                  key={size.id}
                                  type="button"
                                  onClick={() => { setDocPaperSize(size.id as any); setHasGeneratedPatterns(true); }}
                                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                    isActive 
                                      ? "border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10" 
                                      : "border-border/60 bg-background/60 hover:border-blue-500/40 hover:bg-background/80"
                                  }`}
                                >
                                  {isActive && (
                                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded p-0.5">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                  )}
                                  <span className={`font-bold ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>{size.label}</span>
                                  <span className="text-[10px] text-muted-foreground mt-1">{size.dims}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Sticky Live Preview */}
                    <div className="lg:col-span-5 relative">
                      <div className="sticky top-6">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Updates in real-time as you change settings.
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-2 shadow-sm overflow-hidden flex justify-center">
                          <DocumentLivePreview
                            layout={docLayout}
                            paperSize={docPaperSize}
                            font={docFont}
                            colorTheme={docColorTheme}
                            designPattern={docDesignPattern}
                            barangayName={settings?.name ?? null}
                            municipality={settings?.city_municipality ?? null}
                            province={settings?.province ?? null}
                            logoUrl={resolvePhotoUrl(logoUrl)}
                            municipalityLogoUrl={resolvePhotoUrl(municipalityLogoUrl)}
                            signatoryName={signatoryName}
                            signatoryTitle={signatoryTitle}
                          />
                        </div>
                        <div className="mt-4 p-3 rounded-xl border border-border bg-background shadow-sm">
                          <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Current Settings</h4>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <div className="text-muted-foreground">Structure</div><div className="text-foreground capitalize font-medium">{docLayout}</div>
                            <div className="text-muted-foreground">Color Theme</div><div className="text-foreground capitalize font-medium">{docColorTheme}</div>
                            <div className="text-muted-foreground">Pattern</div><div className="text-foreground capitalize font-medium">{docDesignPattern}</div>
                            <div className="text-muted-foreground">Font</div><div className="text-foreground capitalize font-medium">{docFont}</div>
                            <div className="text-muted-foreground">Paper Size</div><div className="text-foreground uppercase font-medium">{docPaperSize}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: System Preferences */}
          {activeSection === "system" && (
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">System Preferences</h2>
              <p className="text-sm text-muted-foreground mb-5">Configure system-wide behavior and defaults.</p>
              <div className="space-y-4">
                <SettingsInput label="SMS Sender Name" value={smsSenderName} onChange={setSmsSenderName} placeholder="E.G. TAMBO (MAX 11 CHARS)" />
                <p className="text-[11px] text-muted-foreground -mt-2 px-1">This name appears in the SMS body header when your barangay sends SMS. Max 11 characters, alphanumeric only.</p>

                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Default Document Signatory</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsInput label="Signatory Name" value={signatoryName} onChange={setSignatoryName} placeholder="E.G. HON. JUAN DELA CRUZ" />
                    <SettingsInput label="Signatory Title" value={signatoryTitle} onChange={setSignatoryTitle} placeholder="E.G. PUNONG BARANGAY" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 px-1">This name and title appear as the default signatory on certificates and official documents.</p>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Display Language</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">Choose the interface language for Kapitan. Saved to your device.</p>
                  <div className="inline-flex rounded-xl glass-subtle p-1">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={cn(
                        "px-4 py-2 text-[13px] font-semibold rounded-lg transition-all",
                        language === "en" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                      style={language === "en" ? { background: "var(--accent-primary)" } : undefined}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("fil")}
                      className={cn(
                        "px-4 py-2 text-[13px] font-semibold rounded-lg transition-all",
                        language === "fil" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                      style={language === "fil" ? { background: "var(--accent-primary)" } : undefined}
                    >
                      Filipino
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg glass-subtle">
                  <p className="text-xs text-muted-foreground">
                    Theme and date format preferences are personal —{" "}
                    <a href="/dashboard/account" className="font-medium underline" style={{ color: "var(--accent-primary)" }}>My Account</a>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Document Settings */}
          {activeSection === "documents" && (
            <div className="space-y-4">
              {/* ── STAGE 1 of 3 — Document Structure (3 production layouts) ── */}
              <div className="glass rounded-xl p-6 relative overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="relative pl-4">
                    <span
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                      style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.7) 0%, rgba(139,92,246,0.3) 100%)" }}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stage 1 of 3</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-primary)" }}>Structure</span>
                    </div>
                    <h2
                      className="text-2xl text-foreground tracking-[-0.01em] leading-tight"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      Document Structure
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                      The layout foundation — where officials, logos, headers, content, signatures, and verification appear on the page. Visual styling comes next. Verification features (QR, hash, ref no., dates) apply to <em>all</em> structures.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-5" />

                {/* 3 production structures — body + footer unified, only headers differ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:w-[90%]">
                  {[
                    {
                      id: "klasiko",
                      label: "Classic Sidebar",
                      tag: "Default",
                      desc: "Officials roster runs vertically on the left, with verification block (QR + ref) below it. Content fills the right. Traditional barangay identity.",
                      regions: [
                        "Header: dual logos + Republic / Province / Barangay",
                        "Left sidebar: officials roster + QR verification",
                        "Right content: title, body, captain signature",
                        "Watermark + security strip footer",
                      ],
                      preview: (
                        <div className="w-full bg-white overflow-hidden border border-gray-200 flex flex-col" style={{ aspectRatio: "3 / 4", fontFamily: previewFontFamily }}>
                          <StructureCardHeader
                            variant="klasiko"
                            barangayName={settings?.name}
                            municipality={settings?.city_municipality}
                            province={settings?.province}
                            logoUrl={resolvePhotoUrl(logoUrl)}
                            municipalityLogoUrl={resolvePhotoUrl(municipalityLogoUrl)}
                          />
                          {/* Body: sidebar (officials + term + dates + QR) | content right */}
                          <div className="flex flex-1 min-h-0">
                            {(() => {
                              const termStart = termStartYear || "2024";
                              const termEnd = termEndYear || "2026";
                              return (
                                <div className="w-[38%] border-r border-gray-400 bg-white flex flex-col">
                                  {/* 1. Title + Year combined */}
                                  <div className="px-1 pt-1 pb-0.5 bg-gradient-to-b from-gray-50/70 to-white border-b border-gray-300">
                                    <div className="h-0.5 w-5 mx-auto bg-gray-800" />
                                    <p
                                      className="text-[3.5px] font-bold tracking-[0.22em] uppercase text-gray-900 text-center mt-0.5 leading-[1.1]"
                                      style={{ fontFamily: previewFontFamily }}
                                    >
                                      Sangguniang Barangay
                                    </p>
                                    <p
                                      className="text-[6.5px] font-bold text-gray-900 tracking-wider text-center mt-0.5 tabular-nums leading-tight"
                                      style={{ fontFamily: previewFontFamily }}
                                    >
                                      {termStart} <span className="text-gray-400 font-normal">—</span> {termEnd}
                                    </p>
                                  </div>

                                  {/* 2. Officials roster (no dividers between names — typography only) +
                                       3. Issued / Valid Until integrated into the same column flow */}
                                  {(() => {
                                    const sorted = previewOfficials;
                                    return (
                                      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                        {/* Officials — no dividers, just rhythm */}
                                        <div className="px-1.5 pt-1.5 pb-1 space-y-[4px] flex-1 overflow-hidden">
                                          {sorted.map((o, index) => {
                                            const fullName = o.name;
                                            const isKapitan = index === 0;
                                            const posLabel = o.position;
                                            return (
                                              <div key={o.key} className="flex flex-col items-center text-center leading-[1]">
                                                <div
                                                  className={cn(
                                                    "shrink-0 mb-0.5",
                                                    isKapitan ? "w-4 h-4" : "w-3 h-3"
                                                  )}
                                                  aria-hidden="true"
                                                />
                                                <p
                                                  className={cn(
                                                    "truncate tracking-wide w-full",
                                                    isKapitan
                                                      ? "text-[4px] font-bold text-gray-900 uppercase"
                                                      : "text-[4.5px] font-semibold text-gray-800 uppercase"
                                                  )}
                                                  style={{ fontFamily: previewFontFamily }}
                                                >
                                                  {fullName}
                                                </p>
                                                <p
                                                  className={cn(
                                                    "truncate italic mt-px w-full",
                                                    isKapitan ? "text-[4px] text-gray-600" : "text-[4.5px] text-gray-500"
                                                  )}
                                                >
                                                  {posLabel}
                                                </p>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Ornament separator between officials and dates */}
                                        <div className="px-3 py-1 flex items-center gap-1">
                                          <div className="h-px flex-1 bg-gray-300" />
                                          <div className="w-1 h-1 rotate-45 bg-gray-400" />
                                          <div className="h-px flex-1 bg-gray-300" />
                                        </div>

                                        {/* Issued / Valid Until — same column flow, smaller */}
                                        <div className="px-2 pb-1.5 space-y-px">
                                          <div className="flex items-baseline justify-between gap-1">
                                            <p className="text-[3.5px] tracking-[0.2em] uppercase text-gray-500 italic">Issued</p>
                                            <p
                                              className="text-[3.5px] font-semibold text-gray-800 tabular-nums truncate"
                                              style={{ fontFamily: previewFontFamily }}
                                            >
                                              {previewFormatDate(previewIssueDate)}
                                            </p>
                                          </div>
                                          <div className="flex items-baseline justify-between gap-1">
                                            <p className="text-[3.5px] tracking-[0.2em] uppercase text-gray-500 italic">Valid Until</p>
                                            <p
                                              className="text-[3.5px] font-semibold text-gray-800 tabular-nums truncate"
                                              style={{ fontFamily: previewFontFamily }}
                                            >
                                              {previewFormatDate(previewExpiryDate)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* 4. QR verification with PrimeX mark embedded in the center */}
                                  <div className="px-1.5 py-1.5 border-t-2 border-gray-800 bg-white">
                                    <p className="text-[3.5px] font-bold tracking-[0.22em] uppercase text-gray-800 text-center mb-0.5">
                                      Verify Document
                                    </p>
                                    <div className="flex justify-center">
                                      <div className="relative w-10 h-10 border border-gray-900 p-0.5 bg-white">
                                        <div className="grid grid-cols-9 gap-px w-full h-full">
                                          {Array.from({ length: 81 }).map((_, i) => {
                                            const row = Math.floor(i / 9);
                                            const col = i % 9;
                                            // 3 finder squares (TL, TR, BL) — outer ring pattern
                                            const isFinder =
                                              (row < 3 && col < 3 && (row === 0 || row === 2 || col === 0 || col === 2)) ||
                                              (row < 3 && col >= 6 && (row === 0 || row === 2 || col === 6 || col === 8)) ||
                                              (row >= 6 && col < 3 && (row === 6 || row === 8 || col === 0 || col === 2));
                                            // Center 3×3 cells reserved for the PrimeX logo overlay → keep blank
                                            const isCenter = row >= 3 && row <= 5 && col >= 3 && col <= 5;
                                            const isData = !isFinder && !isCenter && ((i * 37 + 11) % 5 < 2);
                                            return (
                                              <div
                                                key={i}
                                                className={(isFinder || isData) ? "bg-gray-900" : "bg-transparent"}
                                              />
                                            );
                                          })}
                                        </div>
                                        {/* PrimeX mark — small bordered patch centered over the QR */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                          <div className="bg-white border border-gray-900 p-px rounded-sm">
                                            <svg viewBox="0 0 256 256" className="w-2.5 h-2.5 text-gray-900" fill="currentColor" aria-label="PrimeX">
                                              <path d="M 150.23 144.99 C134.71,147.23 124.05,144.91 128.30,140.22 C129.17,139.26 132.05,137.88 134.69,137.16 C145.76,134.14 148.53,132.70 154.00,127.12 C164.19,116.71 166.86,103.09 161.66,88.00 C159.56,81.88 158.17,79.65 154.12,75.89 C141.79,64.43 123.08,62.95 109.50,72.36 C107.85,73.51 95.93,84.95 83.00,97.80 C58.33,122.32 50.53,128.44 39.24,132.17 C36.19,133.18 31.75,134.00 29.38,134.00 C22.24,134.00 11.00,129.12 11.00,126.01 C11.00,124.72 88.06,48.53 92.15,45.79 C94.54,44.18 100.77,40.82 106.00,38.32 L 115.50 33.78 L 146.50 33.57 L 156.84 38.78 C168.47,44.65 173.48,48.54 179.28,56.22 C187.41,66.98 191.00,78.19 191.00,92.84 C191.00,119.94 174.12,141.53 150.23,144.99 ZM 153.04 211.96 C143.77,216.59 143.19,216.74 132.50,217.22 C115.83,217.99 106.60,216.86 99.91,213.25 C82.41,203.80 73.94,194.54 68.24,178.65 C66.04,172.49 65.68,169.83 65.67,159.50 C65.66,150.59 66.13,146.08 67.47,142.00 C73.00,125.17 82.40,114.75 97.22,109.00 C103.87,106.41 106.26,106.00 114.53,106.00 C124.83,106.00 128.00,106.94 128.00,110.00 C128.00,112.27 126.26,113.28 119.63,114.90 C99.88,119.72 89.33,137.02 93.55,157.66 C96.23,170.80 100.79,176.61 113.00,182.41 C118.57,185.06 120.57,185.49 127.00,185.40 C133.17,185.33 135.71,184.75 141.29,182.18 C147.33,179.39 150.72,176.43 171.79,155.48 C203.74,123.73 212.24,117.99 227.26,118.01 C235.73,118.02 245.00,121.53 245.00,124.73 C245.00,126.65 176.30,196.29 167.54,203.25 C164.81,205.42 158.28,209.34 153.04,211.96 Z" />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                            {/* Content right (title + body + signature) */}
                            <div className="flex-1 p-2 pt-3 flex flex-col relative">
                              {/* Universal barangay logo watermark */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-9 h-9 rounded-full border-2 border-gray-500 opacity-[0.13]">
                                  <div className="absolute inset-1 rounded-full border border-gray-500" />
                                </div>
                              </div>
                              <div className="relative">
                                <p className="text-[8px] font-bold tracking-[0.22em] text-gray-800 uppercase text-center">
                                  {previewCopy.title}
                                </p>
                                <div className="h-1.5 bg-gray-500 rounded w-3/4 mx-auto mt-1 relative" />
                              </div>
                              <div className="mt-1.5 flex-1 relative text-[4.5px] leading-[1.45] text-gray-700">
                                <p className="font-semibold uppercase text-gray-800 mb-1 mt-5">{previewCopy.salutation}</p>
                                {previewCopy.paragraphs.map((paragraph) => (
                                  <p key={paragraph} className="mb-1 text-justify">{paragraph}</p>
                                ))}
                                <div className="mt-2 space-y-0.5 text-[3.5px]">
                                  <p><span className="font-semibold">Requested By:</span> {previewCopy.requestedBy}</p>
                                  <p><span className="font-semibold">Purpose:</span> {previewCopy.purpose}</p>
                                </div>
                              </div>
                              <div className="mt-auto w-24 ml-auto text-center relative">
                                <p className="text-[4.5px] font-bold text-gray-800 uppercase truncate">{previewSignatoryName}</p>
                                <div className="h-px bg-gray-400 mt-0.5" />
                                <div className="text-[4.5px] text-gray-500 uppercase mt-0.5 tracking-wide">{previewSignatoryTitle}</div>
                              </div>
                            </div>
                          </div>
                          {/* Bottom security strip */}
                          <div className="px-2.5 py-0.5 border-t border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <div className="flex items-center justify-between w-full text-[4.5px] uppercase tracking-[0.18em] text-gray-500">
                              <span>{previewCopy.controlNo}</span>
                              <span>Not Valid Without Seal</span>
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "elegante",
                      label: "Formal Government",
                      tag: "Enterprise",
                      desc: "Double-border ornate frame around the whole document. Header has thin rules above/below the title. Body + footer shared.",
                      regions: [
                        "Outer: double-border ornate frame",
                        "Header: dual logos + Republic / Province / Barangay",
                        "Title bar with flanking thin rules",
                        "Body: centered formal text + watermark",
                        "Footer: 3-column signatures (Prepared / Reviewed / Approved)",
                        "Verification strip + security strip",
                      ],
                      preview: (
                        <div className="w-full bg-white overflow-hidden border-2 border-gray-500 flex flex-col" style={{ aspectRatio: "3 / 4", fontFamily: previewFontFamily }}>
                          <div className="m-1 border border-gray-400 flex flex-col flex-1 min-h-0">
                            <StructureCardHeader
                              variant="elegante"
                              barangayName={settings?.name}
                              municipality={settings?.city_municipality}
                              province={settings?.province}
                              logoUrl={resolvePhotoUrl(logoUrl)}
                              municipalityLogoUrl={resolvePhotoUrl(municipalityLogoUrl)}
                            />
                            <div className="px-2 py-1 flex items-center justify-center gap-1 border-b border-gray-200 flex-shrink-0">
                              <div className="flex-1 h-px bg-gray-300" />
                              <div className="h-1 bg-gray-600 rounded w-12" />
                              <div className="flex-1 h-px bg-gray-300" />
                            </div>

                          {/* Body: shared across all structures (centered + watermark) */}
                          <div className="relative flex-1 min-h-0 flex flex-col justify-center px-3 py-2 space-y-1">
                            {/* Universal barangay logo watermark — present on every certificate */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="relative w-10 h-10 rounded-full border-2 border-gray-500 opacity-[0.13]">
                                <div className="absolute inset-1 rounded-full border border-gray-500" />
                              </div>
                            </div>
                            <div className="space-y-1 relative text-center">
                              <p className="text-[7px] font-bold tracking-[0.22em] uppercase text-gray-800">{previewCopy.title}</p>
                              <p className="text-[4px] font-semibold uppercase text-gray-600">{previewCopy.salutation}</p>
                              <div className="space-y-1 text-[3.5px] leading-[1.45] text-gray-700">
                                {previewCopy.paragraphs.map((paragraph) => (
                                  <p key={paragraph} className="text-justify">{paragraph}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* Footer: shared across all structures — 3 signatures + QR verification + security strip */}
                          <div className="px-3 pt-1.5 pb-1 grid grid-cols-3 gap-1.5 border-t border-gray-200 flex-shrink-0">
                            <div className="text-center">
                              <div className="h-px bg-gray-400" />
                              <p className="mt-0.5 text-[4.5px] font-semibold uppercase text-gray-700 truncate">{previewSignatoryName}</p>
                              <p className="text-[4px] uppercase text-gray-500">Prepared By</p>
                            </div>
                            <div className="text-center">
                              <div className="h-px bg-gray-400" />
                              <p className="mt-0.5 text-[4.5px] font-semibold uppercase text-gray-700 truncate">{previewSecretaryName}</p>
                              <p className="text-[4px] uppercase text-gray-500">Reviewed By</p>
                            </div>
                            <div className="text-center">
                              <div className="h-px bg-gray-400" />
                              <p className="mt-0.5 text-[4.5px] font-semibold uppercase text-gray-700 truncate">{previewSignatoryTitle}</p>
                              <p className="text-[4px] uppercase text-gray-500">Approved By</p>
                            </div>
                          </div>
                          <div className="px-3 py-1 border-t border-gray-200 flex items-center gap-1.5 bg-gray-50 flex-shrink-0">
                            <div className="w-3 h-3 border border-gray-500 bg-white flex-shrink-0 flex items-center justify-center">
                              <div className="grid grid-cols-3 gap-px w-3 h-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                  <div key={i} className={(i === 0 || i === 2 || i === 4 || i === 6 || i === 8) ? "bg-gray-700" : "bg-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex-1 space-y-0.5 text-[4.5px] uppercase tracking-[0.16em] text-gray-500">
                              <div>{previewCopy.controlNo}</div>
                              <div>Issued {previewFormatDate(previewIssueDate)}</div>
                            </div>
                          </div>
                          <div className="px-3 py-0.5 border-t border-gray-200 flex justify-center bg-gray-50 flex-shrink-0">
                            <div className="text-[4.5px] uppercase tracking-[0.18em] text-gray-500">Not Valid Without Official Seal</div>
                          </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "moderno",
                      label: "Centered Modern",
                      tag: "Digital-Friendly",
                      desc: "Dual logos centered side-by-side above the Republic header. Modern clean style. Body + footer shared.",
                      regions: [
                        "Header: side-by-side logos + Republic / Province / Barangay",
                        "Title row with hairline accent rule",
                        "Body: centered single column + watermark",
                        "Footer: 3 signatories (Captain / Secretary / Treasurer)",
                        "Verification strip + security strip",
                      ],
                      preview: (
                        <div className="w-full bg-white overflow-hidden border border-gray-200 flex flex-col" style={{ aspectRatio: "3 / 4", fontFamily: previewFontFamily }}>
                          <StructureCardHeader
                            variant="moderno"
                            barangayName={settings?.name}
                            municipality={settings?.city_municipality}
                            province={settings?.province}
                            logoUrl={resolvePhotoUrl(logoUrl)}
                            municipalityLogoUrl={resolvePhotoUrl(municipalityLogoUrl)}
                          />

                          {/* Body: shared across all structures (centered + watermark) */}
                          <div className="relative flex-1 min-h-0 flex flex-col justify-center px-3 py-2 space-y-1">
                            {/* Universal barangay logo watermark — present on every certificate */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="relative w-10 h-10 rounded-full border-2 border-gray-500 opacity-[0.13]">
                                <div className="absolute inset-1 rounded-full border border-gray-500" />
                              </div>
                            </div>
                            <div className="space-y-1 relative text-center">
                              <p className="text-[7px] font-bold tracking-[0.22em] uppercase text-gray-800">{previewCopy.title}</p>
                              <p className="text-[4px] font-semibold uppercase text-gray-600">{previewCopy.salutation}</p>
                              <div className="space-y-1 text-[3.5px] leading-[1.45] text-gray-700">
                                {previewCopy.paragraphs.map((paragraph) => (
                                  <p key={paragraph} className="text-justify">{paragraph}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* Footer: shared across all structures — 3 signatures + QR verification + security strip */}
                          <div className="px-3 pt-1.5 pb-1 grid grid-cols-3 gap-1.5 border-t border-gray-200 flex-shrink-0">
                            <div className="text-center">
                              <div className="h-px bg-gray-400" />
                              <p className="mt-0.5 text-[4.5px] font-semibold uppercase text-gray-700 truncate">{previewSignatoryName}</p>
                              <p className="text-[4px] uppercase text-gray-500">Captain</p>
                            </div>
                            <div className="text-center">
                              <div className="h-px bg-gray-400" />
                              <p className="mt-0.5 text-[4.5px] font-semibold uppercase text-gray-700 truncate">{previewSecretaryName}</p>
                              <p className="text-[4px] uppercase text-gray-500">Secretary</p>
                            </div>
                            <div className="text-center">
                              <div className="h-px bg-gray-400" />
                              <p className="mt-0.5 text-[4.5px] font-semibold uppercase text-gray-700 truncate">{previewTreasurerName}</p>
                              <p className="text-[4px] uppercase text-gray-500">Treasurer</p>
                            </div>
                          </div>
                          <div className="px-3 py-1 border-t border-gray-200 flex items-center gap-1.5 bg-gray-50 flex-shrink-0">
                            <div className="w-3 h-3 border border-gray-500 bg-white flex-shrink-0 flex items-center justify-center">
                              <div className="grid grid-cols-3 gap-px w-3 h-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                  <div key={i} className={(i === 0 || i === 2 || i === 4 || i === 6 || i === 8) ? "bg-gray-700" : "bg-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex-1 space-y-0.5 text-[4.5px] uppercase tracking-[0.16em] text-gray-500">
                              <div>{previewCopy.controlNo}</div>
                              <div>Issued {previewFormatDate(previewIssueDate)}</div>
                            </div>
                          </div>
                          <div className="px-3 py-0.5 border-t border-gray-200 flex justify-center bg-gray-50 flex-shrink-0">
                            <div className="text-[4.5px] uppercase tracking-[0.18em] text-gray-500">Not Valid Without Seal / Signature</div>
                          </div>
                        </div>
                      ),
                    },
                                    ].map((layout) => {
                    const isActive = docLayout === layout.id;
                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => { setDocLayout(layout.id as typeof docLayout); setHasGeneratedPatterns(true); }}
                        aria-label={layout.label}
                        title={layout.label}
                        className={cn(
                          "rounded-xl border-2 transition-all overflow-hidden group relative bg-background/40",
                          isActive
                            ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-md"
                            : "border-border/60 hover:border-blue-500/40"
                        )}
                      >
                        <div className="transition-transform duration-200 group-hover:scale-[1.015] origin-center">
                          {layout.preview}
                        </div>
                        <div className="px-3 py-2.5 border-t border-border/40 bg-background/40 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{layout.label}</p>
                          {isActive && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: "var(--accent-primary)" }}>Active</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Paper size selector */}
                <div className="mt-6 flex items-center gap-2 mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Paper Size</p>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "a4",     label: "A4",     tag: "Default", desc: "210 × 297 mm", aspect: "210 / 297" },
                    { id: "letter", label: "Letter", tag: "US",      desc: "8.5 × 11 in",  aspect: "8.5 / 11" },
                    { id: "legal",  label: "Legal",  tag: "Long",    desc: "8.5 × 13 in (PH long bond)", aspect: "8.5 / 13" },
                  ].map((paper) => {
                    const isActive = docPaperSize === paper.id;
                    return (
                      <button
                        key={paper.id}
                        type="button"
                        onClick={() => { setDocPaperSize(paper.id as typeof docPaperSize); setHasGeneratedPatterns(true); }}
                        aria-label={paper.label}
                        className={cn(
                          "rounded-lg border-2 p-2.5 flex items-center gap-2.5 transition-all relative bg-background/40",
                          isActive
                            ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-sm"
                            : "border-border/60 hover:border-blue-500/40"
                        )}
                      >
                        <div
                          className="bg-white border border-gray-300 flex-shrink-0"
                          style={{ aspectRatio: paper.aspect, height: "40px" }}
                        />
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground">{paper.label}</p>
                            {isActive && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: "var(--accent-primary)" }}>Active</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{paper.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Font selector */}
                <div className="mt-6 flex items-center gap-2 mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Document Font</p>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: "times",        label: "Times New Roman", desc: "Traditional serif — DILG standard",  family: '"Times New Roman", Times, serif' },
                    { id: "arial",        label: "Arial",           desc: "Clean sans-serif — print-safe",      family: 'Arial, Helvetica, sans-serif' },
                    { id: "inter",        label: "Inter",           desc: "Modern sans-serif — UI grade",       family: 'var(--font-doc-inter), system-ui, sans-serif' },
                    { id: "poppins",      label: "Poppins",         desc: "Friendly sans-serif — community",    family: 'var(--font-doc-poppins), system-ui, sans-serif' },
                    { id: "merriweather", label: "Merriweather",    desc: "Premium serif — readable on print",  family: 'var(--font-doc-merriweather), Georgia, serif' },
                    { id: "playfair",     label: "Playfair Display",desc: "Elegant serif — formal documents",   family: 'var(--font-playfair), Georgia, serif' },
                  ].map((font) => {
                    const isActive = docFont === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => { setDocFont(font.id as typeof docFont); setHasGeneratedPatterns(true); }}
                        aria-label={font.label}
                        className={cn(
                          "rounded-lg border-2 p-2.5 flex items-center gap-2.5 transition-all relative bg-background/40",
                          isActive
                            ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-sm"
                            : "border-border/60 hover:border-blue-500/40"
                        )}
                      >
                        <div
                          className="w-10 h-10 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0"
                          style={{ fontFamily: font.family }}
                        >
                          <span className="text-xl text-gray-900 leading-none" style={{ fontFamily: font.family }}>Aa</span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: font.family }}>{font.label}</p>
                            {isActive && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: "var(--accent-primary)" }}>Active</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{font.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* ── STAGE 2 of 3 — Visual Design (color + pattern) ── */}
              <div className="glass rounded-xl p-6 relative overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                <div className="relative pl-4 mb-1">
                  <span
                    className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                    style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.7) 0%, rgba(139,92,246,0.3) 100%)" }}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stage 2 of 3</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-primary)" }}>Design</span>
                  </div>
                  <h2
                    className="text-2xl text-foreground tracking-[-0.01em] leading-tight"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    Visual Design
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                    First pick a color theme, then choose one of 12 modern design patterns. Both layer on top of your selected structure.
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-5" />

                {/* ─────────── PART A — COLOR THEME ─────────── */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/30">1. Color Theme</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {/* Solid — 5 rectangles */}
                <div className="mt-3 mb-2 flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Solid</p>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { id: "plain",  label: "Plain",  bg: "#1f2937" },
                    { id: "blue",   label: "Blue",   bg: "#1e40af" },
                    { id: "red",    label: "Red",    bg: "#991b1b" },
                    { id: "green",  label: "Green",  bg: "#15803d" },
                    { id: "yellow", label: "Yellow", bg: "#eab308" },
                  ].map(({ id, label, bg }) => {
                    const isActive = docColorTheme === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setDocColorTheme(id as typeof docColorTheme); setHasGeneratedPatterns(true); }}
                        aria-label={label}
                        className={cn(
                          "rounded-lg overflow-hidden border-2 transition-all bg-background/40 relative",
                          isActive
                            ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-md"
                            : "border-border/60 hover:border-blue-500/40"
                        )}
                      >
                        <div className="w-full" style={{ aspectRatio: "4 / 3", background: bg }} />
                        <div className="px-2 py-1.5 bg-background/40 flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">{label}</p>
                          {isActive && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: "var(--accent-primary)" }}>Active</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Combinations — 8 rectangles */}
                <div className="mt-5 mb-2 flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Combinations</p>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: "combo-flag",       label: "Philippine Flag", colors: ["#1e40af", "#991b1b", "#eab308"] },
                    { id: "combo-festive",    label: "Festive",         colors: ["#991b1b", "#eab308"] },
                    { id: "combo-earth",      label: "Earth & Sky",     colors: ["#15803d", "#1e40af"] },
                    { id: "combo-gov",        label: "Government",      colors: ["#1e3a8a", "#92400e"] },
                    { id: "combo-bayanihan",  label: "Bayanihan",       colors: ["#991b1b", "#1e40af"] },
                    { id: "combo-sunrise",    label: "Sunrise",         colors: ["#eab308", "#991b1b"] },
                    { id: "combo-coastal",    label: "Coastal",         colors: ["#1e40af", "#15803d"] },
                    { id: "combo-heritage",   label: "Heritage",        colors: ["#991b1b", "#15803d"] },
                  ].map((combo) => {
                    const isActive = docColorTheme === combo.id;
                    const stops = combo.colors.length === 3
                      ? `linear-gradient(90deg, ${combo.colors[0]} 0%, ${combo.colors[0]} 33%, ${combo.colors[1]} 33%, ${combo.colors[1]} 66%, ${combo.colors[2]} 66%, ${combo.colors[2]} 100%)`
                      : `linear-gradient(90deg, ${combo.colors[0]} 0%, ${combo.colors[0]} 50%, ${combo.colors[1]} 50%, ${combo.colors[1]} 100%)`;
                    return (
                      <button
                        key={combo.id}
                        type="button"
                        onClick={() => { setDocColorTheme(combo.id as typeof docColorTheme); setHasGeneratedPatterns(true); }}
                        aria-label={combo.label}
                        className={cn(
                          "rounded-lg overflow-hidden border-2 transition-all bg-background/40 relative",
                          isActive
                            ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-md"
                            : "border-border/60 hover:border-blue-500/40"
                        )}
                      >
                        <div className="w-full" style={{ aspectRatio: "4 / 3", background: stops }} />
                        <div className="px-2 py-1.5 bg-background/40 flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">{combo.label}</p>
                          {isActive && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: "var(--accent-primary)" }}>Active</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Divider between Color Theme and Design Pattern */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-7" />

                {/* ─────────── PART B — DESIGN PATTERN (structure-aware) ─────────── */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/30">2. Design Pattern</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {!hasGeneratedPatterns ? (
                  <>
                    <div className="mb-3 flex items-start gap-2.5 p-3 rounded-lg border border-dashed border-border/60 bg-background/20">
                      <span className="mt-0.5 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30">PICK ABOVE</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Choose a <strong className="text-foreground/80">structure</strong>, <strong className="text-foreground/80">paper size</strong>, and <strong className="text-foreground/80">color theme</strong> above. Your 6 design patterns will generate here based on that combination.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-lg border-2 border-dashed border-border/40 overflow-hidden bg-background/20 relative">
                          <div className="p-1.5">
                            <div className="w-full bg-gray-100 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/40" style={{ fontSize: 0, aspectRatio: "3 / 4" }}>
                              <div className="w-full h-full flex flex-col">
                                <div className="px-1 pt-1 pb-0.5 border-b border-gray-200 dark:border-slate-700/40 flex items-center gap-1 flex-shrink-0">
                                  <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-slate-700/60 flex-shrink-0" />
                                  <div className="flex-1 h-0.5 bg-gray-200 dark:bg-slate-700/60 rounded mx-auto w-3/4" />
                                  <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-slate-700/60 flex-shrink-0" />
                                </div>
                                <div className="flex-1 p-1.5 space-y-0.5">
                                  <div className="h-0.5 bg-gray-200 dark:bg-slate-700/40 rounded" />
                                  <div className="h-0.5 bg-gray-200 dark:bg-slate-700/40 rounded w-5/6" />
                                  <div className="h-0.5 bg-gray-200 dark:bg-slate-700/40 rounded w-4/5" />
                                </div>
                                <div className="px-2 py-0.5 border-t border-gray-200 dark:border-slate-700/40 flex-shrink-0">
                                  <div className="h-0.5 bg-gray-200 dark:bg-slate-700/40 rounded w-1/2" />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-2 py-1.5 border-t border-border/40 bg-background/20">
                            <p className="text-xs font-semibold text-muted-foreground/60">Pattern {i + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (() => {
                  const colorMap: Record<string, { primary: string; accent: string; tint: string; secondary?: string }> = {
                    plain:           { primary: "#1f2937", accent: "#6b7280", tint: "#f3f4f6" },
                    blue:            { primary: "#1e40af", accent: "#3b82f6", tint: "#dbeafe" },
                    red:             { primary: "#991b1b", accent: "#ef4444", tint: "#fee2e2" },
                    green:           { primary: "#15803d", accent: "#22c55e", tint: "#dcfce7" },
                    yellow:          { primary: "#eab308", accent: "#eab308", tint: "#fef3c7" },
                    "combo-flag":      { primary: "#1e40af", accent: "#ef4444", tint: "#fef3c7", secondary: "#991b1b" },
                    "combo-festive":   { primary: "#991b1b", accent: "#eab308", tint: "#fef3c7", secondary: "#eab308" },
                    "combo-earth":     { primary: "#15803d", accent: "#3b82f6", tint: "#dcfce7", secondary: "#1e40af" },
                    "combo-gov":       { primary: "#1e3a8a", accent: "#92400e", tint: "#fef3c7", secondary: "#92400e" },
                    "combo-bayanihan": { primary: "#991b1b", accent: "#3b82f6", tint: "#fee2e2", secondary: "#1e40af" },
                    "combo-sunrise":   { primary: "#eab308", accent: "#ef4444", tint: "#fef3c7", secondary: "#991b1b" },
                    "combo-coastal":   { primary: "#1e40af", accent: "#22c55e", tint: "#dbeafe", secondary: "#15803d" },
                    "combo-heritage":  { primary: "#991b1b", accent: "#22c55e", tint: "#fee2e2", secondary: "#15803d" },
                  };
                  const FALLBACK = { primary: "#1f2937", accent: "#6b7280", tint: "#f3f4f6" } as const;
                  const t = (colorMap[docColorTheme] ?? FALLBACK) as { primary: string; accent: string; tint: string; secondary?: string };

                  const hasSidebar = docLayout === "klasiko";
                  const isFormal = docLayout === "elegante";

                  // Watermark used in body of every preview
                  const Watermark = ({ size = "w-9 h-9" }: { size?: string }) => (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={cn("relative rounded-full border-2 opacity-[0.13]", size)} style={{ borderColor: t.primary }}>
                        <div className="absolute inset-1 rounded-full border" style={{ borderColor: t.primary }} />
                      </div>
                    </div>
                  );

                  // Pattern-specific decoration helpers (reusable across structures)
                  const WreathCorners = () => (
                    <>
                      <span className="absolute top-0 left-0 w-3 h-3 z-10 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${t.accent}66, transparent 60%)`, transform: "rotate(-15deg)" }} />
                      <span className="absolute top-0 right-0 w-3 h-3 z-10 pointer-events-none" style={{ background: `radial-gradient(ellipse at top right, ${t.accent}66, transparent 60%)`, transform: "rotate(15deg)" }} />
                      <span className="absolute bottom-0 left-0 w-3 h-3 z-10 pointer-events-none" style={{ background: `radial-gradient(ellipse at bottom left, ${t.accent}66, transparent 60%)`, transform: "rotate(15deg)" }} />
                      <span className="absolute bottom-0 right-0 w-3 h-3 z-10 pointer-events-none" style={{ background: `radial-gradient(ellipse at bottom right, ${t.accent}66, transparent 60%)`, transform: "rotate(-15deg)" }} />
                    </>
                  );
                  const ScrollDots = () => (
                    <>
                      <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full z-10" style={{ background: t.primary }} />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full z-10" style={{ background: t.primary }} />
                      <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full z-10" style={{ background: t.primary }} />
                      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full z-10" style={{ background: t.primary }} />
                    </>
                  );
                  const DiplomaticBrackets = () => (
                    <>
                      <span className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 z-10 pointer-events-none" style={{ borderColor: t.primary }} />
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 z-10 pointer-events-none" style={{ borderColor: t.primary }} />
                      <span className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 z-10 pointer-events-none" style={{ borderColor: t.primary }} />
                      <span className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 z-10 pointer-events-none" style={{ borderColor: t.primary }} />
                    </>
                  );
                  const OrnateFrame = () => (
                    <div className="absolute inset-2 border z-10 pointer-events-none" style={{ borderColor: t.accent }}>
                      <div className="absolute inset-0.5 border" style={{ borderColor: t.primary, borderStyle: "dashed" }} />
                    </div>
                  );
                  const TechHatch = () => (
                    <div className="absolute top-0 right-0 w-12 h-12 z-10 pointer-events-none overflow-hidden">
                      <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(135deg, ${t.accent}33 0 2px, transparent 2px 5px)` }} />
                    </div>
                  );
                  const SunburstRays = ({ size = "w-16 h-16" }: { size?: string }) => (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={cn("opacity-[0.16] rounded-full", size)} style={{ background: `conic-gradient(from 0deg, ${t.accent} 0deg 10deg, transparent 10deg 30deg, ${t.accent} 30deg 40deg, transparent 40deg 60deg, ${t.accent} 60deg 70deg, transparent 70deg 90deg, ${t.accent} 90deg 100deg, transparent 100deg 120deg, ${t.accent} 120deg 130deg, transparent 130deg 150deg, ${t.accent} 150deg 160deg, transparent 160deg 180deg, ${t.accent} 180deg 190deg, transparent 190deg 210deg, ${t.accent} 210deg 220deg, transparent 220deg 240deg, ${t.accent} 240deg 250deg, transparent 250deg 270deg, ${t.accent} 270deg 280deg, transparent 280deg 300deg, ${t.accent} 300deg 310deg, transparent 310deg 330deg, ${t.accent} 330deg 340deg, transparent 340deg 360deg)` }} />
                    </div>
                  );

                  // Render the full structure (matching Stage 1 detail) + pattern decoration.
                  const renderPreview = (patternId: string) => {
                    const isWave = patternId === "wave";
                    const isGradient = patternId === "gradient";
                    const isBold = patternId === "bold";
                    const isPhoto = patternId === "photo";
                    const isMinimal = patternId === "minimal";
                    const isStripe = patternId === "stripe";
                    const isWreath = patternId === "wreath";
                    const isSunburst = patternId === "sunburst";
                    const isGothic = patternId === "gothic";
                    const isScroll = patternId === "scroll";
                    const isDiplomatic = patternId === "diplomatic";
                    const isOrnate = patternId === "ornate";
                    const isGeometric = patternId === "geometric";
                    const isBoldStripe = patternId === "bold-stripe";
                    const isTech = patternId === "tech";

                    const titleBg = isGothic ? "#111827" : t.primary;
                    const titleHeight = isGothic ? "h-2.5" : "h-1.5";
                    const cornerClip = isGeometric
                      ? "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))"
                      : undefined;

                    // Sidebar styling (Classic only)
                    const sidebarBg = isGradient
                      ? `linear-gradient(180deg, ${t.primary}, ${t.primary}dd)`
                      : isBold
                        ? "#0f172a"
                        : "#f9fafb";
                    const sidebarInverted = isGradient || isBold;
                    const sidebarHeadColor = sidebarInverted ? "rgba(255,255,255,0.9)" : "#6b7280";
                    const sidebarTextColor = sidebarInverted ? "rgba(255,255,255,0.55)" : "#d1d5db";
                    const sidebarFooterBg = sidebarInverted ? "rgba(0,0,0,0.2)" : "#f3f4f6";

                    // ─────────── CLASSIC SIDEBAR ───────────
                    if (hasSidebar) {
                      return (
                        <div className="w-full bg-white overflow-hidden border border-gray-200 flex flex-col relative" style={{ fontSize: 0, aspectRatio: "3 / 4", fontFamily: previewFontFamily }}>
                          {isWreath && <WreathCorners />}
                          {isWave && (
                            <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="w-full h-3 block flex-shrink-0">
                              <path d="M0,0 L200,0 L200,8 Q150,16 100,8 T0,10 Z" fill={t.primary} />
                              <path d="M0,0 L200,0 L200,5 Q150,12 100,5 T0,6 Z" fill={t.accent} fillOpacity="0.5" />
                            </svg>
                          )}
                          {/* Header — 3 column (dual logos + multi-line republic text) */}
                          <div className="px-2.5 pt-2 pb-1.5 border-b border-gray-300 flex items-center gap-2 flex-shrink-0">
                            <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100 flex-shrink-0" />
                            <div className="flex-1 space-y-0.5">
                              <div className="h-0.5 bg-gray-400 rounded mx-auto w-3/4" />
                              <div className="h-0.5 bg-gray-400 rounded mx-auto w-1/2" />
                              <div className={cn(titleHeight, "rounded mx-auto w-2/3 mt-0.5")} style={{ background: titleBg }} />
                            </div>
                            <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100 flex-shrink-0" />
                          </div>
                          {/* Body — sidebar | content right */}
                          <div className="flex flex-1 min-h-0 relative">
                            {isStripe && (
                              <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: "38%", width: "2.5px", background: t.primary, transform: "translateX(-1.25px)" }} />
                            )}
                            <div className="w-[38%] border-r border-gray-300 flex flex-col" style={{ background: sidebarBg }}>
                              {isPhoto && (
                                <div className="p-1.5 border-b border-gray-300" style={{ background: sidebarInverted ? "rgba(0,0,0,0.15)" : "#f3f4f6" }}>
                                  <div className="w-full bg-white border border-gray-300" style={{ aspectRatio: "1 / 1" }} />
                                </div>
                              )}
                              <div className="p-1.5 space-y-0.5 flex-1">
                                <div className="h-0.5 rounded w-3/4" style={{ background: sidebarHeadColor }} />
                                <div className="h-0.5 rounded" style={{ background: sidebarTextColor }} />
                                <div className="h-0.5 rounded w-5/6" style={{ background: sidebarTextColor }} />
                                <div className="h-0.5 rounded" style={{ background: sidebarTextColor }} />
                                <div className="h-0.5 rounded w-3/4" style={{ background: sidebarTextColor }} />
                                <div className="h-0.5 rounded" style={{ background: sidebarTextColor }} />
                                <div className="h-0.5 rounded w-4/5" style={{ background: sidebarTextColor }} />
                              </div>
                              <div className="border-t border-gray-300 p-1.5 flex flex-col items-center gap-0.5" style={{ background: sidebarFooterBg }}>
                                <div className="w-4 h-4 border bg-white flex items-center justify-center" style={{ borderColor: sidebarInverted ? "rgba(255,255,255,0.6)" : "#6b7280" }}>
                                  <div className="grid grid-cols-3 gap-px w-3.5 h-3.5">
                                    {Array.from({ length: 9 }).map((_, i) => (
                                      <div key={i} className={(i === 0 || i === 2 || i === 4 || i === 6 || i === 8) ? "bg-gray-700" : "bg-gray-300"} />
                                    ))}
                                  </div>
                                </div>
                                <div className="h-0.5 rounded w-full mt-0.5" style={{ background: sidebarHeadColor }} />
                                <div className="h-0.5 rounded w-5/6" style={{ background: sidebarTextColor }} />
                                <div className="h-0.5 rounded w-4/5" style={{ background: sidebarTextColor }} />
                              </div>
                            </div>
                            <div className="flex-1 p-2 flex flex-col relative">
                              <Watermark />
                              <div className="h-1.5 rounded w-3/4 relative" style={{ background: t.primary }} />
                              <div className="mt-1.5 space-y-1 flex-1 relative">
                                <div className="h-0.5 bg-gray-200 rounded" />
                                <div className="h-0.5 bg-gray-200 rounded w-5/6" />
                                <div className="h-0.5 bg-gray-200 rounded" />
                                <div className="h-0.5 bg-gray-200 rounded w-4/5" />
                                <div className="h-0.5 bg-gray-200 rounded w-full" />
                                <div className="h-0.5 bg-gray-200 rounded w-3/4" />
                              </div>
                              <div className="mt-auto w-14 ml-auto space-y-0.5 relative">
                                <div className="h-px bg-gray-400" />
                                <div className="h-0.5 bg-gray-300 rounded" />
                              </div>
                            </div>
                          </div>
                          {/* Security strip */}
                          <div className="px-2.5 py-0.5 border-t border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <div className="h-0.5 bg-gray-300 rounded w-2/3" />
                          </div>
                          {isWave && (
                            <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="w-full h-3 block flex-shrink-0">
                              <path d="M0,4 Q50,-4 100,4 T200,4 L200,14 L0,14 Z" fill={t.accent} fillOpacity="0.5" />
                              <path d="M0,6 Q50,0 100,6 T200,6 L200,14 L0,14 Z" fill={t.primary} />
                            </svg>
                          )}
                        </div>
                      );
                    }

                    // ─────────── FORMAL GOVERNMENT ───────────
                    if (isFormal) {
                      return (
                        <div className="w-full bg-white overflow-hidden border-2 flex flex-col relative" style={{ fontSize: 0, aspectRatio: "3 / 4", borderColor: t.primary, clipPath: cornerClip, fontFamily: previewFontFamily }}>
                          {isWreath && <WreathCorners />}
                          {isScroll && <ScrollDots />}
                          {isDiplomatic && <DiplomaticBrackets />}
                          {isOrnate && <OrnateFrame />}
                          {isTech && <TechHatch />}
                          <div className="m-1 border border-gray-400 flex flex-col flex-1 min-h-0">
                            {/* Header — 3-column with multi-line text */}
                            <div className="px-1 pt-1 pb-0.5 border-b border-gray-300 flex items-center gap-1.5 flex-shrink-0">
                              <div className="w-4 h-4 rounded-full border-2 border-gray-500 bg-gray-50 flex-shrink-0" />
                              <div className="flex-1 space-y-0.5">
                                <div className="h-0.5 bg-gray-400 rounded mx-auto w-full" />
                                <div className="h-0.5 bg-gray-400 rounded mx-auto w-2/3" />
                                <div className={cn(titleHeight, "rounded mx-auto w-4/5")} style={{ background: titleBg }} />
                              </div>
                              <div className="w-4 h-4 rounded-full border-2 border-gray-500 bg-gray-50 flex-shrink-0" />
                            </div>
                            {/* Title bar with thin rules flanking */}
                            <div className="px-2 py-1 flex items-center justify-center gap-1 border-b border-gray-200 flex-shrink-0">
                              <div className="flex-1 h-px bg-gray-300" />
                              <div className="h-1 bg-gray-600 rounded w-12" style={{ background: titleBg }} />
                              <div className="flex-1 h-px bg-gray-300" />
                            </div>
                            {/* Body */}
                            <div className="relative flex-1 min-h-0 flex flex-col justify-center px-3 py-2 space-y-1">
                              {isSunburst && <SunburstRays size="w-16 h-16" />}
                              <Watermark size="w-10 h-10" />
                              <div className="space-y-1 relative">
                                <div className="h-0.5 bg-gray-200 rounded w-full" />
                                <div className="h-0.5 bg-gray-200 rounded w-11/12 mx-auto" />
                                <div className="h-0.5 bg-gray-200 rounded w-5/6 mx-auto" />
                                <div className="h-0.5 bg-gray-200 rounded w-full" />
                                <div className="h-0.5 bg-gray-200 rounded w-3/4 mx-auto" />
                              </div>
                            </div>
                            {/* 3-column signatures */}
                            <div className="px-1 pt-1 pb-0.5 grid grid-cols-3 gap-1.5 border-t border-gray-300 flex-shrink-0">
                              <div className="space-y-0.5"><div className="h-px bg-gray-500" /><div className="h-0.5 bg-gray-400 rounded" /><div className="h-0.5 bg-gray-300 rounded w-3/4" /></div>
                              <div className="space-y-0.5"><div className="h-px bg-gray-500" /><div className="h-0.5 bg-gray-400 rounded" /><div className="h-0.5 bg-gray-300 rounded w-3/4" /></div>
                              <div className="space-y-0.5"><div className="h-px bg-gray-500" /><div className="h-0.5 bg-gray-400 rounded" /><div className="h-0.5 bg-gray-300 rounded w-3/4" /></div>
                            </div>
                            {/* Verification strip */}
                            <div className="px-2 py-1 border-t border-gray-300 flex items-center gap-1.5 bg-gray-50 flex-shrink-0">
                              <div className="w-4 h-4 border border-gray-500 bg-white flex-shrink-0 flex items-center justify-center">
                                <div className="grid grid-cols-3 gap-px w-3.5 h-3.5">
                                  {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className={(i === 0 || i === 2 || i === 4 || i === 6 || i === 8) ? "bg-gray-700" : "bg-gray-300"} />
                                  ))}
                                </div>
                              </div>
                              <div className="flex-1 space-y-0.5">
                                <div className="h-0.5 bg-gray-400 rounded w-full" />
                                <div className="h-0.5 bg-gray-300 rounded w-5/6 font-mono" />
                              </div>
                            </div>
                            {/* Security strip */}
                            <div className="px-2 py-0.5 border-t border-gray-300 flex justify-center bg-gray-50 flex-shrink-0">
                              <div className="h-0.5 bg-gray-300 rounded w-2/3" />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ─────────── CENTERED MODERN ───────────
                    return (
                      <div className="w-full bg-white overflow-hidden border border-gray-200 flex flex-col relative" style={{ fontSize: 0, aspectRatio: "3 / 4", clipPath: cornerClip, fontFamily: previewFontFamily }}>
                        {isTech && <TechHatch />}
                        {isBoldStripe && <div className="h-2.5 flex-shrink-0" style={{ background: t.primary }} />}
                        {isGradient && <div className="h-2 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${t.primary}, ${t.primary}dd)` }} />}
                        {isWave && (
                          <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="w-full h-3 block flex-shrink-0">
                            <path d="M0,0 L200,0 L200,8 Q150,16 100,8 T0,10 Z" fill={t.primary} />
                            <path d="M0,0 L200,0 L200,5 Q150,12 100,5 T0,6 Z" fill={t.accent} fillOpacity="0.5" />
                          </svg>
                        )}
                        {/* Header — dual logos centered side-by-side + multi-line text below */}
                        <div className="px-2 pt-1 pb-1 border-b border-gray-300 flex flex-col items-center flex-shrink-0">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-dashed border-gray-400 bg-gray-50 flex-shrink-0" />
                            <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100 flex-shrink-0" />
                          </div>
                          <div className="space-y-0.5 w-3/4 mt-1.5">
                            <div className="h-0.5 bg-gray-400 rounded mx-auto w-full" />
                            <div className="h-0.5 bg-gray-400 rounded mx-auto w-2/3" />
                            <div className={cn(titleHeight, "rounded mx-auto w-5/6")} style={{ background: titleBg }} />
                          </div>
                        </div>
                        {isMinimal && <div className="h-px flex-shrink-0" style={{ background: t.accent }} />}
                        {/* Title row */}
                        <div className="px-3 py-1 flex flex-col items-center flex-shrink-0">
                          <div className="h-1 bg-gray-500 rounded w-1/2" style={{ background: titleBg }} />
                          <div className="mt-0.5 h-px bg-gray-400 rounded w-1/3" />
                        </div>
                        {/* Body */}
                        <div className="relative flex-1 min-h-0 flex flex-col justify-center px-4 py-2 space-y-1">
                          {isSunburst && <SunburstRays size="w-14 h-14" />}
                          <Watermark size="w-9 h-9" />
                          <div className="space-y-1 relative">
                            <div className="h-0.5 bg-gray-200 rounded" />
                            <div className="h-0.5 bg-gray-200 rounded w-5/6 mx-auto" />
                            <div className="h-0.5 bg-gray-200 rounded w-4/5" />
                            <div className="h-0.5 bg-gray-200 rounded" />
                            <div className="h-0.5 bg-gray-200 rounded w-3/4 mx-auto" />
                          </div>
                        </div>
                        {/* 3 signatories row */}
                        <div className="px-3 pt-1.5 pb-1 grid grid-cols-3 gap-1.5 border-t border-gray-200 flex-shrink-0">
                          <div className="space-y-0.5"><div className="h-px bg-gray-400" /><div className="h-0.5 bg-gray-300 rounded" /></div>
                          <div className="space-y-0.5"><div className="h-px bg-gray-400" /><div className="h-0.5 bg-gray-300 rounded" /></div>
                          <div className="space-y-0.5"><div className="h-px bg-gray-400" /><div className="h-0.5 bg-gray-300 rounded" /></div>
                        </div>
                        {/* Verification strip */}
                        <div className="px-3 py-1 border-t border-gray-200 flex items-center gap-1.5 bg-gray-50 flex-shrink-0">
                          <div className="w-3 h-3 border border-gray-500 bg-white flex-shrink-0 flex items-center justify-center">
                            <div className="grid grid-cols-3 gap-px w-3 h-3">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className={(i === 0 || i === 2 || i === 4 || i === 6 || i === 8) ? "bg-gray-700" : "bg-gray-300"} />
                              ))}
                            </div>
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="h-0.5 bg-gray-400 rounded w-full" />
                            <div className="h-0.5 bg-gray-300 rounded w-5/6 font-mono" />
                          </div>
                        </div>
                        {/* Security strip */}
                        <div className="px-3 py-0.5 border-t border-gray-200 flex justify-center bg-gray-50 flex-shrink-0">
                          <div className="h-0.5 bg-gray-300 rounded w-2/3" />
                        </div>
                        {isWave && (
                          <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="w-full h-3 block flex-shrink-0">
                            <path d="M0,4 Q50,-4 100,4 T200,4 L200,14 L0,14 Z" fill={t.accent} fillOpacity="0.5" />
                            <path d="M0,6 Q50,0 100,6 T200,6 L200,14 L0,14 Z" fill={t.primary} />
                          </svg>
                        )}
                      </div>
                    );
                  };

                  // Filter to the 6 patterns curated for the selected structure
                  const PATTERN_LABELS: Record<string, string> = {
                    wave: "Wave", gradient: "Gradient", bold: "Bold", photo: "Photo", minimal: "Minimal", stripe: "Stripe",
                    wreath: "Wreath", sunburst: "Sunburst", gothic: "Gothic", scroll: "Scroll", diplomatic: "Diplomatic", ornate: "Ornate",
                    geometric: "Geometric", "bold-stripe": "Bold Stripe", tech: "Tech",
                  };
                  const patternIds = (STRUCTURE_PATTERNS[docLayout] as readonly string[]) ?? STRUCTURE_PATTERNS.klasiko;
                  const patterns: Array<{ id: string; label: string }> = patternIds.map((id) => ({ id, label: PATTERN_LABELS[id] ?? id }));

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {patterns.map((p) => {
                        const isActive = docDesignPattern === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setDocDesignPattern(p.id as typeof docDesignPattern)}
                            aria-label={p.label}
                            className={cn(
                              "rounded-lg transition-all overflow-hidden group relative bg-background/40 border-2",
                              isActive
                                ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-md"
                                : "border-border/60 hover:border-blue-500/40"
                            )}
                          >
                            <div className="p-1.5">{renderPreview(p.id)}</div>
                            <div className="px-2 py-1.5 bg-background/40 flex items-center justify-between gap-1 border-t border-border/40">
                              <p className="text-xs font-semibold text-foreground truncate">{p.label}</p>
                              {isActive && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: "var(--accent-primary)" }}>Active</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="mt-5 flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-background/30">
                  <span className="mt-0.5 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/30">NEXT</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground/80">Stage 3 — Certificates</strong> below lets you add, edit, and delete the actual certificates your barangay issues. Each one inherits the chosen structure + color + design pattern.
                  </p>
                </div>
              </div>

              {/* ── Live Document Preview ── */}
              <DocumentLivePreview
                layout={docLayout}
                paperSize={docPaperSize}
                font={docFont}
                colorTheme={docColorTheme}
                designPattern={docDesignPattern}
                barangayName={settings?.name ?? null}
                municipality={settings?.city_municipality ?? null}
                province={settings?.province ?? null}
                logoUrl={resolvePhotoUrl(logoUrl)}
                municipalityLogoUrl={resolvePhotoUrl(municipalityLogoUrl)}
                signatoryName={signatoryName}
                signatoryTitle={signatoryTitle}
              />

              {/* ── STAGE 3 of 3 — Certificate Types (CRUD list) ── */}
              <CertificateTypesList
                onToast={(message, type) => addToast(message, type ?? "success")}
                structureLabel={(() => {
                  const m: Record<string, string> = { klasiko: "Classic Sidebar", moderno: "Centered Modern", elegante: "Formal Government", digital: "Classic Sidebar" };
                  return m[docLayout] || "Classic Sidebar";
                })()}
                colorThemeLabel={(() => {
                  const m: Record<string, string> = {
                    plain: "Plain", blue: "Blue", red: "Red", green: "Green", yellow: "Yellow",
                    "combo-flag": "Philippine Flag", "combo-festive": "Festive",
                    "combo-earth": "Earth & Sky", "combo-gov": "Government",
                    "combo-bayanihan": "Bayanihan", "combo-sunrise": "Sunrise",
                    "combo-coastal": "Coastal", "combo-heritage": "Heritage",
                  };
                  return m[docColorTheme] || "Plain";
                })()}
                designPatternLabel={(() => {
                  const m: Record<string, string> = {
                    wave: "Wave", gradient: "Gradient", bold: "Bold", photo: "Photo", minimal: "Minimal", stripe: "Stripe",
                    wreath: "Wreath", sunburst: "Sunburst", gothic: "Gothic", scroll: "Scroll", diplomatic: "Diplomatic", ornate: "Ornate",
                    geometric: "Geometric", "bold-stripe": "Bold Stripe", tech: "Tech",
                  };
                  return m[docDesignPattern] || "Wave";
                })()}
                paperSizeLabel={docPaperSize === "a4" ? "A4" : docPaperSize === "letter" ? "Letter" : "Legal"}
                fontLabel={(() => {
                  const m: Record<typeof docFont, string> = {
                    times: "Times New Roman", arial: "Arial", inter: "Inter",
                    poppins: "Poppins", merriweather: "Merriweather", playfair: "Playfair Display",
                  };
                  return m[docFont] || "Times New Roman";
                })()}
              />
            </div>
          )}

          {/* Tab 6: Notifications */}
          {activeSection === "notifications" && (
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Notifications</h2>
              <p className="text-sm text-muted-foreground mb-5">Configure notification preferences for this barangay.</p>
              <div className="space-y-3">
                <SettingsToggle label="SMS: New Resident Registered" description="Send SMS notification when a new resident is registered"
                  checked={notifSmsNewResident} onChange={setNotifSmsNewResident} />
                <SettingsToggle label="SMS: Certificate Issued" description="Send SMS notification when a certificate is issued"
                  checked={notifSmsCert} onChange={setNotifSmsCert} />
                <SettingsToggle label="Email Alerts" description="Receive email alerts for system events and reminders"
                  checked={notifEmail} onChange={setNotifEmail} />
                <SettingsToggle label="Daily Summary" description="Receive a daily summary of barangay activity"
                  checked={notifDaily} onChange={setNotifDaily} />
              </div>
            </div>
          )}

          {/* Officials — Sangguniang Barangay roster */}
          {activeSection === "officials" && (
            <OfficialsTab onToast={(message, type) => addToast(message, type ?? "success")} />
          )}

          {/* VAWC (RA 9262) — compliance-critical */}
          {activeSection === "vawc" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }}>
                    <ShieldAlert className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">VAWC Configuration</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Compliance with RA 9262 (Anti-Violence Against Women and Their Children Act).</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-red-500/10 text-red-500 uppercase tracking-wide shrink-0">RA 9262</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Confidentiality Officer</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <SettingsInput label="Officer Name" value={vawcOfficerName} onChange={setVawcOfficerName} placeholder="E.G. MARIA SANTOS" icon={Users} />
                      <SettingsInput label="Officer Phone" value={vawcOfficerPhone} onChange={setVawcOfficerPhone} placeholder="0917-XXX-XXXX" icon={Phone} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 px-1">The designated VAWC desk officer who handles confidential reports per RA 9262 Sec 9.</p>
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">BCPC Contact (Barangay Council for the Protection of Children)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <SettingsInput label="BCPC Lead Name" value={vawcBcpcName} onChange={setVawcBcpcName} placeholder="E.G. HON. PEDRO REYES" icon={Users} />
                      <SettingsInput label="BCPC Phone" value={vawcBcpcPhone} onChange={setVawcBcpcPhone} placeholder="0917-XXX-XXXX" icon={Phone} />
                    </div>
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <SettingsTextarea label="RA 9262 Disclaimer (Printed on VAWC Documents)" value={vawcDisclaimer} onChange={setVawcDisclaimer}
                      placeholder="E.G. This record is protected under RA 9262. Unauthorized disclosure is punishable by law." rows={3} />
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <SettingsToggle label="Restrict VAWC Access to Authorized Staff Only"
                      description="When ON, only the Captain, VAWC officer, and BCPC lead can read VAWC records. Required by RA 9262 Sec 44."
                      checked={vawcAccessRestricted} onChange={setVawcAccessRestricted} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GAD (RA 9710) — compliance */}
          {activeSection === "gad" && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }}>
                  <Heart className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">GAD Configuration</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Gender and Development setup per RA 9710 (Magna Carta of Women).</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-pink-500/10 text-pink-500 uppercase tracking-wide shrink-0">RA 9710</span>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">GAD Focal Person</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsInput label="Focal Person Name" value={gadFocalName} onChange={setGadFocalName} placeholder="E.G. ANA DELA CRUZ" icon={Users} />
                    <SettingsInput label="Position / Title" value={gadFocalTitle} onChange={setGadFocalTitle} placeholder="E.G. KAGAWAD" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 px-1">The Sangguniang Barangay member designated as GAD Focal Person per PCW guidelines.</p>
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <SettingsInput label="GAD Budget Target (%)" value={gadBudgetPercent} onChange={setGadBudgetPercent} placeholder="5" type="number" />
                  <p className="text-[11px] text-muted-foreground mt-2 px-1">Minimum percentage of barangay budget allocated to GAD programs. RA 9710 Sec 36(a) mandates at least 5%.</p>
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <SettingsInput label="GAD Plan Document URL (optional)" value={gadPlanUrl} onChange={setGadPlanUrl} placeholder="https://drive.../gad-plan-2026.pdf" icon={FileText} />
                  <p className="text-[11px] text-muted-foreground mt-2 px-1">Link to your approved Annual GAD Plan and Budget (GPB) for transparency and audit.</p>
                </div>
              </div>
            </div>
          )}

          {/* KP / Lupong Tagapamayapa (RA 7160) — compliance */}
          {activeSection === "kp" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }}>
                    <Scale className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">Katarungang Pambarangay</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Lupong Tagapamayapa configuration per RA 7160 (Local Government Code) Book III Chapter 7.</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 uppercase tracking-wide shrink-0">RA 7160</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Procedural Timeframes</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <SettingsInput label="Mediation Window (Days)" value={kpHearingWindowDays} onChange={setKpHearingWindowDays} placeholder="15" type="number" />
                      <SettingsInput label="Mediation Extension (Days)" value={kpMediationExtensionDays} onChange={setKpMediationExtensionDays} placeholder="15" type="number" />
                      <SettingsInput label="Arbitration Window (Days)" value={kpArbitrationWindowDays} onChange={setKpArbitrationWindowDays} placeholder="15" type="number" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 px-1">RA 7160 Sec 410: Punong Barangay must mediate within 15 days. Lupon mediation may extend another 15. Arbitration 15 days max.</p>
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <SettingsTextarea label="Default Summons Template" value={kpSummonsTemplate} onChange={setKpSummonsTemplate}
                      placeholder="E.G. By authority vested in me as Punong Barangay of {barangay}, you are hereby summoned to appear before the Lupon Tagapamayapa on {date} at {time}..." rows={5} />
                    <p className="text-[11px] text-muted-foreground mt-2 px-1">Template used when issuing summons for KP mediation. Variables: {"{barangay}"}, {"{respondent}"}, {"{complainant}"}, {"{date}"}, {"{time}"}, {"{case_no}"}.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg glass-subtle">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground/80">Lupong Members Roster</strong> — list management UI coming in next phase. For now, members are added directly in the KP Cases page.
                </p>
              </div>
            </div>
          )}

          {/* Residents Dictionaries — replaces 15 hardcoded mock seed arrays */}
          {activeSection === "residents-dict" && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }}>
                  <BookOpen className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">Residents Dictionaries</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Autocomplete suggestions for resident form fields. Per-barangay, learned over time.</p>
                </div>
              </div>
              <div className="grid grid-cols-[200px_1fr] gap-4">
                {/* Left: dictionary picker */}
                <div className="space-y-px">
                  {([
                    ["puroks", "Puroks"], ["streets", "Streets"], ["citizenships", "Citizenships"],
                    ["religions", "Religions"], ["ethnicities", "Ethnicities"], ["occupations", "Occupations"],
                    ["skills", "Skills"], ["positions", "Job Positions"], ["employers", "Employers"],
                    ["courses", "Courses / Programs"], ["schools", "Schools"], ["placesOfBirth", "Places of Birth"],
                    ["businessTypes", "Business Types"], ["sectorsOther", "Sectors (Other)"], ["emergencyRelations", "Emergency Relations"],
                  ] as Array<[DictKey, string]>).map(([key, label]) => {
                    const count = dictionaries[key]?.length || 0;
                    const active = activeDict === key;
                    return (
                      <button key={key} onClick={() => { setActiveDict(key); setNewDictEntry(""); }}
                        className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-[12px] transition-colors text-left",
                          active ? "font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
                        style={active ? { color: "var(--accent-primary)", background: "var(--accent-bg)" } : undefined}>
                        <span className="truncate">{label}</span>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", active ? "" : "bg-muted text-muted-foreground")}
                          style={active ? { background: "var(--accent-primary)", color: "white" } : undefined}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Right: entries for active dictionary */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input type="text" value={newDictEntry} onChange={(e) => setNewDictEntry(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDictEntry(); } }}
                      placeholder="Add new entry (press Enter)"
                      className="flex-1 px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 transition-colors uppercase"
                      style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties} />
                    <button onClick={addDictEntry} disabled={!newDictEntry.trim()}
                      className={cn("px-3 py-2 rounded-xl text-sm font-medium text-white transition-colors flex items-center gap-1.5",
                        newDictEntry.trim() ? "" : "opacity-50 cursor-not-allowed")}
                      style={newDictEntry.trim() ? { background: "var(--accent-primary)" } : { background: "var(--muted)" }}>
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </div>
                  {dictionaries[activeDict].length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-8 text-center">
                      <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No entries yet</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">Add the first entry above to start building this dictionary.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {dictionaries[activeDict].map((entry, idx) => (
                        <span key={`${entry}-${idx}`}
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg glass-subtle text-[12px] text-foreground/80 group">
                          {entry}
                          <button onClick={() => removeDictEntry(activeDict, idx)}
                            className="w-3 h-3 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Remove">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground px-1">
                    These appear as autocomplete suggestions in the Residents Create/Edit modal. Type in the resident form to learn new entries automatically once API learning ships.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-in slide-in-from-right-5 fade-in duration-300",
                toast.type === "success" ? "bg-emerald-600" : "bg-red-600")}>
              <span>{toast.message}</span>
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} className="ml-1 hover:opacity-80">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sticky bottom save bar — slides in when current tab has unsaved changes */}
      <SettingsSaveBar
        isDirty={shouldShowSaveBar}
        changedCount={changedFieldKeys.length}
        saving={saving || hasValidationErrors}
        onSave={() => { if (!hasValidationErrors) saveFn[activeSection]?.(); }}
        onDiscard={handleDiscardChanges}
      />

      {/* Pad bottom so the sticky bar doesn't cover content */}
      {shouldShowSaveBar && <div className="h-20" />}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
