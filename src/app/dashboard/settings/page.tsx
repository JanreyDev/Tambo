"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Save, Upload, Phone, Mail, Clock, Building2, Shield, Bell, FileText,
  AlertTriangle, X, Globe, CheckCircle, Loader2, Image as ImageIcon, Banknote,
  MessageSquare, HardDrive, Users, Database, CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { BarangaySettings, BarangayUsage, ApiError } from "@/lib/types";

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
          <div className={cn("w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0")} />
        </div>
      </button>
    </div>
  );
}

/** Compress image client-side if over maxSizeKB. Returns original if SVG or already small. */
async function compressImage(file: File, maxSizeKB = 500, maxDim = 1024): Promise<File> {
  if (file.type === "image/svg+xml" || file.size <= maxSizeKB * 1024) return file;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      // White background for JPEG (handles transparency)
      if (file.type === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob((blob) => {
        resolve(blob ? new File([blob], file.name, { type: outputType }) : file);
      }, outputType, 0.85);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

function ImageUpload({ label, hint, currentUrl, onUpload, uploading }: {
  label: string; hint: string; currentUrl: string | null; onUpload: (file: File) => void; uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      onUpload(compressed);
    }
    e.target.value = "";
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleFile} />
      <div onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-muted-foreground/30 transition-colors cursor-pointer min-h-[180px]">
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : currentUrl ? (
          <div className="w-24 h-24 rounded-lg bg-white border border-border flex items-center justify-center mb-2 overflow-hidden">
            <img src={currentUrl} alt={label} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or SVG, max 5MB</p>
        <button type="button" className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
          {currentUrl ? "Replace" : "Upload"}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-2 px-1">{hint}</p>
    </div>
  );
}

// ── Main Page ──

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
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

  // Form state (editable fields)
  const [zip, setZip] = useState("");
  const [motto, setMotto] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [docHeader, setDocHeader] = useState("");
  const [docFooter, setDocFooter] = useState("");
  const [smsSenderName, setSmsSenderName] = useState("");
  const [notifSmsNewResident, setNotifSmsNewResident] = useState(false);
  const [notifSmsCert, setNotifSmsCert] = useState(false);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifDaily, setNotifDaily] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [sealUrl, setSealUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);
  // Fees & signatory (stored in settings JSONB)
  const [certValidityDays, setCertValidityDays] = useState("180");
  const [clearanceFee, setClearanceFee] = useState("0");
  const [indigencyFee, setIndigencyFee] = useState("0");
  const [idFee, setIdFee] = useState("0");
  const [cedulaFee, setCedulaFee] = useState("0");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("PUNONG BARANGAY");
  const [docLayout, setDocLayout] = useState<"klasiko" | "moderno" | "elegante" | "digital">("klasiko");
  // Usage/billing data
  const [usage, setUsage] = useState<BarangayUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Load settings
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.settings.get();
        setSettings(data);
        setZip(data.zip_code || "");
        setMotto(data.motto || "");
        setOfficeHours(data.office_hours || "MON-FRI 8AM-5PM");
        setEstablishedYear(data.established_year ? String(data.established_year) : "");
        setCaptainName(data.captain_name || "");
        setContactPhone(data.contact_phone || "");
        setContactEmail(data.contact_email || "");
        setWebsiteUrl(data.website_url || "");
        setFullAddress(data.full_address || "");
        setDocHeader(data.document_header_text || "");
        setDocFooter(data.document_footer_text || "");
        setSmsSenderName(data.sms_sender_name || "");
        setNotifSmsNewResident(data.notification_preferences?.sms_new_resident || false);
        setNotifSmsCert(data.notification_preferences?.sms_certificate_issued || false);
        setNotifEmail(data.notification_preferences?.email_alerts || false);
        setNotifDaily(data.notification_preferences?.daily_summary || false);
        setLogoUrl(data.logo_url);
        setSealUrl(data.seal_url);
        // Fees & signatory from settings JSONB
        const s = data.settings || {};
        setCertValidityDays(String(s.certificate_validity_days ?? 180));
        setClearanceFee(String(s.clearance_fee ?? 0));
        setIndigencyFee(String(s.indigency_fee ?? 0));
        setIdFee(String(s.id_fee ?? 0));
        setCedulaFee(String(s.cedula_fee ?? 0));
        setSignatoryName(s.default_signatory_name || "");
        setSignatoryTitle(s.default_signatory_title || "PUNONG BARANGAY");
        setDocLayout((s.document_layout as "klasiko" | "moderno" | "elegante" | "digital") || "klasiko");
      } catch {
        addToast("Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save current tab
  const saveSettings = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await api.settings.update(fields as Partial<BarangaySettings>);
      setSettings(res.data);
      addToast("Settings saved successfully");
      refreshUser();
    } catch (e) {
      const err = e as ApiError;
      addToast(err.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveBarangayInfo = () => saveSettings({
    zip_code: zip || null,
    motto: motto || null,
    office_hours: officeHours || null,
    established_year: establishedYear ? parseInt(establishedYear) : null,
    captain_name: captainName || null,
  });

  const saveContact = () => saveSettings({
    contact_phone: contactPhone || null,
    contact_email: contactEmail || null,
    website_url: websiteUrl || null,
    full_address: fullAddress || null,
  });

  const saveSystem = () => saveSettings({
    sms_sender_name: smsSenderName || null,
    settings: {
      default_signatory_name: signatoryName || null,
      default_signatory_title: signatoryTitle || null,
    },
  });

  const saveDocuments = () => saveSettings({
    document_header_text: docHeader || null,
    document_footer_text: docFooter || null,
    settings: {
      certificate_validity_days: certValidityDays ? parseInt(certValidityDays) : 180,
      clearance_fee: clearanceFee ? parseFloat(clearanceFee) : 0,
      indigency_fee: indigencyFee ? parseFloat(indigencyFee) : 0,
      id_fee: idFee ? parseFloat(idFee) : 0,
      cedula_fee: cedulaFee ? parseFloat(cedulaFee) : 0,
      document_layout: docLayout,
    },
  });

  const saveNotifications = () => saveSettings({
    notification_preferences: {
      sms_new_resident: notifSmsNewResident,
      sms_certificate_issued: notifSmsCert,
      email_alerts: notifEmail,
      daily_summary: notifDaily,
    },
  });

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

  const handleSealUpload = async (file: File) => {
    setUploadingSeal(true);
    try {
      const res = await api.settings.uploadSeal(file);
      setSealUrl(res.url);
      addToast("Seal uploaded successfully");
      refreshUser();
    } catch (e) {
      const err = e as ApiError;
      addToast(err.message || "Seal upload failed", "error");
    } finally {
      setUploadingSeal(false);
    }
  };

  const markSetupComplete = async () => {
    if (!captainName.trim()) { addToast("Captain name is required to complete setup", "error"); return; }
    if (!contactPhone.trim()) { addToast("Contact phone is required to complete setup", "error"); return; }
    await saveSettings({ setup_complete: true });
    addToast("Barangay setup marked as complete!");
  };

  // Can mark complete?
  const canComplete = !!(captainName.trim() && contactPhone.trim());
  const isSetupComplete = settings?.setup_complete ?? false;

  const sections = [
    { id: "info", label: "Barangay Info", icon: Building2 },
    { id: "contact", label: "Contact Details", icon: Phone },
    { id: "branding", label: "Branding", icon: Upload },
    { id: "fees", label: "Fees & Charges", icon: Banknote },
    { id: "system", label: "System Preferences", icon: Shield },
    { id: "documents", label: "Document Settings", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const saveFn: Record<string, () => void> = {
    info: saveBarangayInfo,
    contact: saveContact,
    branding: () => {}, // branding saves via upload
    fees: () => {}, // fees tab is read-only (PrimeX billing)
    system: saveSystem,
    documents: saveDocuments,
    notifications: saveNotifications,
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
        title="Settings"
        description="Configure barangay-level settings, branding, and system preferences"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
        actions={
          <div className="flex items-center gap-2">
            {!isSetupComplete && (
              <button onClick={markSetupComplete} disabled={!canComplete || saving}
                className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors",
                  canComplete ? "bg-emerald-600 hover:bg-emerald-700" : "bg-muted text-muted-foreground cursor-not-allowed")}>
                <CheckCircle className="h-4 w-4" /> Mark Setup Complete
              </button>
            )}
            {activeSection !== "branding" && activeSection !== "fees" && (
              <button onClick={saveFn[activeSection]} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            )}
          </div>
        }
      />

      {/* Setup Incomplete Banner */}
      {!isSetupComplete && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-600">Setup Incomplete</p>
            <p className="text-xs text-amber-500/80">Fill in the required fields (Captain Name, Contact Phone) and upload your logo, then click &quot;Mark Setup Complete&quot;.</p>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0">
          <div className="sticky top-6 space-y-1">
            {sections.map((s) => {
              const SIcon = s.icon;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    activeSection === s.id ? "bg-accent-bg text-accent-text" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  <SIcon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl space-y-6">

          {/* Tab 1: Barangay Info */}
          {activeSection === "info" && (
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Barangay Information</h2>
              <p className="text-sm text-muted-foreground mb-5">Official barangay details used in documents and reports.</p>
              <div className="space-y-4">
                <SettingsInput label="Barangay Name" value={settings?.name || ""} onChange={() => {}} icon={Building2} disabled />
                <div className="grid grid-cols-2 gap-4">
                  <SettingsInput label="PSGC Code" value={settings?.psgc_code || ""} onChange={() => {}} disabled />
                  <SettingsInput label="Population" value={settings?.population ? settings.population.toLocaleString() : ""} onChange={() => {}} disabled />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsInput label="City / Municipality" value={settings?.city_municipality || ""} onChange={() => {}} disabled />
                  <SettingsInput label="Province" value={settings?.province || ""} onChange={() => {}} disabled />
                </div>
                <SettingsInput label="ZIP Code" value={zip} onChange={setZip} placeholder="e.g. 1700" />
                <SettingsInput label="Motto / Tagline" value={motto} onChange={setMotto} placeholder="e.g. Sama-samang Pagbabago" />
                <div className="grid grid-cols-2 gap-4">
                  <SettingsInput label="Established Year" value={establishedYear} onChange={setEstablishedYear} placeholder="e.g. 1946" type="number" />
                  <SettingsInput label="Captain Name" value={captainName} onChange={setCaptainName} placeholder="e.g. Hon. Juan Dela Cruz" />
                </div>
                <SettingsInput label="Office Hours" value={officeHours || "MON-FRI 8AM-5PM"} onChange={setOfficeHours} placeholder="MON-FRI 8AM-5PM" icon={Clock} disabled />
              </div>
            </div>
          )}

          {/* Tab 2: Contact Details */}
          {activeSection === "contact" && (
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Contact Details</h2>
              <p className="text-sm text-muted-foreground mb-5">Contact information displayed on documents and the public portal.</p>
              <div className="space-y-4">
                <SettingsInput label="Contact Phone" value={contactPhone} onChange={setContactPhone} icon={Phone} placeholder="e.g. 0917-123-4567" />
                <SettingsInput label="Contact Email" value={contactEmail} onChange={setContactEmail} icon={Mail} placeholder="e.g. brgy.tambo@paranaque.gov.ph" />
                <SettingsInput label="Website URL" value={websiteUrl} onChange={setWebsiteUrl} icon={Globe} placeholder="e.g. https://tambo.barangay.org.ph" />
                <SettingsInput label="Office Address" value={fullAddress} onChange={setFullAddress} placeholder="Barangay Hall, Street, City" />
              </div>
            </div>
          )}

          {/* Tab 3: Branding */}
          {activeSection === "branding" && (
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Barangay Branding</h2>
              <p className="text-sm text-muted-foreground mb-5">Upload your barangay logo and seal. These appear on documents and the public portal.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <ImageUpload label="Barangay Logo" hint="Recommended: square image, 512x512px. Appears on documents and certificates."
                  currentUrl={logoUrl} onUpload={handleLogoUpload} uploading={uploadingLogo} />
                <ImageUpload label="City/Municipality Logo" hint="Official seal or logo of your city/municipality. PNG with transparent background recommended."
                  currentUrl={sealUrl} onUpload={handleSealUpload} uploading={uploadingSeal} />
              </div>
              <div className="p-3 rounded-lg glass-subtle">
                <p className="text-xs text-muted-foreground">
                  These images appear on official documents (certificates, clearances), printed reports, and your barangay.org.ph public portal.
                </p>
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

                <div className="p-3 rounded-lg glass-subtle">
                  <p className="text-xs text-muted-foreground">
                    Language, date format, and theme preferences are personal settings. Go to{" "}
                    <a href="/dashboard/account" className="font-medium underline" style={{ color: "var(--accent-primary)" }}>My Account</a> to change them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Document Settings */}
          {activeSection === "documents" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Document Settings</h2>
                <p className="text-sm text-muted-foreground mb-5">Configure the header, footer, fees, and validity for certificates and official documents.</p>
                <div className="space-y-4">
                  <SettingsTextarea label="Document Header Text" value={docHeader} onChange={setDocHeader}
                    placeholder="e.g. Republic of the Philippines\nCity of Paranaque\nBarangay Tambo" rows={3} />
                  <SettingsTextarea label="Document Footer Text" value={docFooter} onChange={setDocFooter}
                    placeholder="e.g. This document is valid for 6 months from date of issuance." rows={2} />

                  {/* Preview */}
                  <div className="p-4 rounded-lg border border-border bg-white">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
                    <div className="flex items-center gap-3 justify-center mb-3">
                      {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" />}
                      <div className="text-center">
                        {(docHeader || "Republic of the Philippines\nBarangay Tambo").split("\n").map((line, i) => (
                          <p key={i} className="text-[10px] text-gray-700 font-medium leading-tight">{line}</p>
                        ))}
                      </div>
                      {sealUrl && <img src={sealUrl} alt="City/Municipality Logo" className="h-10 w-10 object-contain" />}
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <p className="text-[9px] text-gray-500 text-center italic">{docFooter || "Footer text will appear here"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Design */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">Certificate Design</h3>
                <p className="text-xs text-muted-foreground mb-4">Choose the layout style for all generated PDF certificates and clearances. Anti-epal compliant (DILG MC 2026-006).</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      id: "klasiko",
                      label: "Klasiko",
                      desc: "Traditional layout with dual seals and double-border header. Standard Philippine government style.",
                      preview: (
                        /* ── KLASIKO: double-border header, dual seals, centered text, navy ── */
                        <div className="w-full bg-white rounded-t-lg overflow-hidden border border-gray-200 font-sans" style={{ fontSize: 0 }}>
                          {/* Header */}
                          <div className="px-3 pt-3 pb-2 border-b-2 border-double border-[#1a3a6e]">
                            <div className="flex items-center justify-between gap-1">
                              {/* Left seal */}
                              <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100" />
                              </div>
                              {/* Center text */}
                              <div className="flex-1 text-center space-y-0.5">
                                <div className="h-1 bg-gray-400 rounded mx-4" />
                                <div className="h-1 bg-gray-500 rounded mx-6" />
                                <div className="h-2 bg-[#1a3a6e] rounded mx-3" />
                                <div className="h-1 bg-gray-400 rounded mx-8" />
                              </div>
                              {/* Right seal */}
                              <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100" />
                              </div>
                            </div>
                          </div>
                          {/* Title */}
                          <div className="px-3 py-1.5 text-center space-y-0.5">
                            <div className="h-2 bg-[#1a3a6e] rounded mx-6" />
                            <div className="h-1 bg-gray-300 rounded mx-10" />
                          </div>
                          {/* Body lines */}
                          <div className="px-4 py-1 space-y-1">
                            <div className="h-1 bg-gray-200 rounded" />
                            <div className="h-1 bg-gray-200 rounded w-5/6" />
                            <div className="h-1 bg-gray-200 rounded w-4/5" />
                            <div className="h-1 bg-gray-200 rounded w-full" />
                          </div>
                          {/* Signature row */}
                          <div className="px-3 pt-1.5 pb-2.5 flex justify-between">
                            <div className="w-14 text-center space-y-0.5">
                              <div className="h-px bg-gray-400" />
                              <div className="h-1 bg-gray-300 rounded" />
                            </div>
                            <div className="w-14 text-center space-y-0.5">
                              <div className="h-px bg-gray-400" />
                              <div className="h-1 bg-gray-300 rounded" />
                            </div>
                          </div>
                          {/* Footer */}
                          <div className="px-3 py-1 border-t border-gray-200 flex justify-between items-center">
                            <div className="space-y-0.5">
                              <div className="h-0.5 w-10 bg-gray-200 rounded" />
                              <div className="h-0.5 w-8 bg-gray-200 rounded" />
                            </div>
                            <div className="w-5 h-5 border border-gray-300 rounded-sm bg-gray-50" />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "moderno",
                      label: "Moderno",
                      desc: "Clean modern design with a blue accent bar, single left-aligned seal, and minimal borders.",
                      preview: (
                        /* ── MODERNO: 4px blue top bar, single seal left, text right, minimal ── */
                        <div className="w-full bg-white rounded-t-lg overflow-hidden border border-gray-200" style={{ fontSize: 0 }}>
                          {/* Blue top accent bar */}
                          <div className="h-1.5 bg-[#1a56db]" />
                          {/* Header: seal left, text right */}
                          <div className="px-3 pt-2 pb-1.5 flex items-start gap-2.5 border-b border-gray-100">
                            <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-gray-50 flex-shrink-0 flex items-center justify-center mt-0.5">
                              <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100" />
                            </div>
                            <div className="flex-1 space-y-0.5 pt-0.5">
                              <div className="h-1 bg-gray-400 rounded w-4/5" />
                              <div className="h-1 bg-gray-400 rounded w-3/5" />
                              <div className="h-1.5 bg-[#1a3a6e] rounded w-full" />
                              <div className="h-1 bg-gray-300 rounded w-2/3" />
                            </div>
                          </div>
                          {/* Title with blue underline */}
                          <div className="px-3 py-1.5">
                            <div className="h-2 bg-[#1a3a6e] rounded w-3/5" />
                            <div className="mt-0.5 h-0.5 bg-[#1a56db] rounded w-3/5" />
                          </div>
                          {/* Body lines */}
                          <div className="px-3 space-y-1 pb-1">
                            <div className="h-1 bg-gray-200 rounded w-full" />
                            <div className="h-1 bg-gray-200 rounded w-5/6" />
                            <div className="h-1 bg-gray-200 rounded w-4/5" />
                          </div>
                          {/* Signature row */}
                          <div className="px-3 pt-1 pb-2 flex justify-between">
                            <div className="w-14 space-y-0.5">
                              <div className="h-px bg-gray-400" />
                              <div className="h-1 bg-gray-300 rounded" />
                            </div>
                            <div className="w-14 space-y-0.5">
                              <div className="h-px bg-gray-400" />
                              <div className="h-1 bg-gray-300 rounded" />
                            </div>
                          </div>
                          {/* Footer */}
                          <div className="px-3 py-1 border-t border-gray-100 flex justify-between items-center">
                            <div className="space-y-0.5">
                              <div className="h-0.5 w-10 bg-gray-200 rounded" />
                              <div className="h-0.5 w-8 bg-gray-200 rounded" />
                            </div>
                            <div className="w-5 h-5 border border-gray-300 rounded-sm bg-gray-50" />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "elegante",
                      label: "Elegante",
                      desc: "Formal style with decorative double-border frame, centered seal, and flanked title rules.",
                      preview: (
                        /* ── ELEGANTE: outer+inner navy border, centered, flanked title rules ── */
                        <div className="w-full bg-white rounded-t-lg overflow-hidden border-2 border-[#1a3a6e]" style={{ fontSize: 0 }}>
                          <div className="m-1 border border-[#8b9dc3] rounded-sm">
                            {/* Centered header */}
                            <div className="px-2 pt-2 pb-1.5 flex flex-col items-center border-b border-[#8b9dc3]/50">
                              <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-gray-50 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100" />
                              </div>
                              <div className="mt-1 space-y-0.5 w-full text-center">
                                <div className="h-1 bg-gray-400 rounded mx-4" />
                                <div className="h-1 bg-gray-400 rounded mx-6" />
                                <div className="h-1.5 bg-[#1a3a6e] rounded mx-4" />
                              </div>
                            </div>
                            {/* Title with flanking rules */}
                            <div className="px-2 py-1.5 flex items-center justify-center gap-1">
                              <div className="flex-1 h-px bg-[#8b9dc3]" />
                              <div className="h-2 bg-[#1a3a6e] rounded w-16" />
                              <div className="flex-1 h-px bg-[#8b9dc3]" />
                            </div>
                            {/* Body lines */}
                            <div className="px-3 space-y-1 pb-1">
                              <div className="h-1 bg-gray-200 rounded" />
                              <div className="h-1 bg-gray-200 rounded w-5/6 mx-auto" />
                              <div className="h-1 bg-gray-200 rounded w-4/5 mx-auto" />
                            </div>
                            {/* Signature centered */}
                            <div className="px-3 pt-1 pb-2 flex justify-center">
                              <div className="w-20 space-y-0.5 text-center">
                                <div className="h-px bg-gray-400" />
                                <div className="h-1 bg-gray-300 rounded" />
                              </div>
                            </div>
                            {/* Footer */}
                            <div className="px-2 py-1 border-t border-[#8b9dc3]/50 flex justify-between items-center">
                              <div className="space-y-0.5">
                                <div className="h-0.5 w-8 bg-gray-200 rounded" />
                                <div className="h-0.5 w-6 bg-gray-200 rounded" />
                              </div>
                              <div className="w-5 h-5 border border-gray-300 rounded-sm bg-gray-50" />
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "digital",
                      label: "Digital",
                      desc: "Minimal dark-header design with SHA hash, blue accent title, and prominent QR code.",
                      preview: (
                        /* ── DIGITAL: dark slate header band, blue title, hash line, footer band ── */
                        <div className="w-full bg-white rounded-t-lg overflow-hidden border border-gray-200" style={{ fontSize: 0 }}>
                          {/* Dark header band */}
                          <div className="bg-[#0f172a] px-3 py-2.5 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-white/30 bg-white/10 flex-shrink-0 flex items-center justify-center">
                              <div className="w-3.5 h-3.5 rounded-full border border-white/40 bg-white/20" />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="h-1 bg-white/70 rounded w-3/4" />
                              <div className="h-1 bg-white/50 rounded w-1/2" />
                              <div className="h-1.5 bg-white/90 rounded w-full" />
                            </div>
                          </div>
                          {/* Blue title + hash line */}
                          <div className="px-3 pt-2 pb-1">
                            <div className="h-2 bg-[#2563eb] rounded w-2/3" />
                            <div className="h-0.5 bg-[#3b82f6]/50 rounded w-4/5 mt-0.5 font-mono" />
                          </div>
                          {/* Body lines */}
                          <div className="px-3 space-y-1 pb-1">
                            <div className="h-1 bg-gray-200 rounded" />
                            <div className="h-1 bg-gray-200 rounded w-5/6" />
                            <div className="h-1 bg-gray-200 rounded w-4/5" />
                          </div>
                          {/* Signature row */}
                          <div className="px-3 pt-0.5 pb-1.5 flex justify-between">
                            <div className="w-12 space-y-0.5">
                              <div className="h-px bg-gray-400" />
                              <div className="h-1 bg-gray-300 rounded" />
                            </div>
                            <div className="w-12 space-y-0.5">
                              <div className="h-px bg-gray-400" />
                              <div className="h-1 bg-gray-300 rounded" />
                            </div>
                          </div>
                          {/* Footer band */}
                          <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-gray-200 flex justify-between items-center">
                            <div className="space-y-0.5">
                              <div className="h-0.5 w-10 bg-gray-300 rounded" />
                              <div className="h-0.5 w-12 bg-[#3b82f6]/50 rounded font-mono" />
                            </div>
                            <div className="w-6 h-6 border-2 border-gray-400 rounded-sm bg-white flex items-center justify-center">
                              <div className="grid grid-cols-3 gap-px w-3 h-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                  <div key={i} className={cn("rounded-px", [0,2,6,8,4].includes(i) ? "bg-gray-700" : "bg-gray-200")} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    },
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setDocLayout(layout.id as typeof docLayout)}
                      className={cn(
                        "text-left rounded-xl border-2 transition-all overflow-hidden group",
                        docLayout === layout.id
                          ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20"
                          : "border-border hover:border-muted-foreground/40"
                      )}
                    >
                      {/* Preview — scales up slightly on hover */}
                      <div className="overflow-hidden transition-transform duration-200 group-hover:scale-[1.015] origin-top">
                        {layout.preview}
                      </div>
                      <div className="px-3 py-2 border-t border-border/60">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground">{layout.label}</p>
                          {docLayout === layout.id && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: "var(--accent-primary)" }}>
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{layout.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Fees */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">Document Fees</h3>
                <p className="text-xs text-muted-foreground mb-4">Default fees for certificates and services. Amount in Philippine Pesos (PHP).</p>
                <div className="space-y-4">
                  <SettingsInput label="Certificate Validity (Days)" value={certValidityDays} onChange={setCertValidityDays} placeholder="180" type="number" />
                  <p className="text-[11px] text-muted-foreground -mt-2 px-1">Number of days a certificate/clearance is valid after issuance. Default: 180 days.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsInput label="Barangay Clearance Fee" value={clearanceFee} onChange={setClearanceFee} placeholder="0.00" type="number" />
                    <SettingsInput label="Certificate of Indigency Fee" value={indigencyFee} onChange={setIndigencyFee} placeholder="0.00" type="number" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsInput label="Barangay ID Fee" value={idFee} onChange={setIdFee} placeholder="0.00" type="number" />
                    <SettingsInput label="Cedula Fee" value={cedulaFee} onChange={setCedulaFee} placeholder="0.00" type="number" />
                  </div>
                  <div className="p-3 rounded-lg glass-subtle">
                    <p className="text-xs text-muted-foreground">
                      These fees are used as defaults when issuing certificates. Staff can override per transaction if needed.
                    </p>
                  </div>
                </div>
              </div>
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

          {/* Setup status */}
          {isSetupComplete && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <p className="text-sm text-emerald-600 font-medium">Barangay setup is complete</p>
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
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
    </div>
  );
}
