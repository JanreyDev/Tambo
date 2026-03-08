"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Upload,
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
  Shield,
  Bell,
  FileText,
  Printer,
  AlertTriangle,
  Bot,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

function SettingsInput({ label, value, onChange, placeholder, icon: Icon, disabled, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ElementType; disabled?: boolean; error?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 transition-colors",
            error ? "border-red-500 focus:ring-red-500/30" : "border-border",
            Icon && "pl-9", disabled && "opacity-50 cursor-not-allowed")}
          style={!error ? { "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties : undefined} />
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SettingsToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <button onClick={() => onChange(!checked)} className="shrink-0">
        {checked
          ? <div className="w-10 h-6 rounded-full flex items-center justify-end px-0.5" style={{ background: "var(--accent-primary)" }}>
              <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          : <div className="w-10 h-6 rounded-full bg-muted flex items-center px-0.5">
              <div className="w-5 h-5 rounded-full bg-white shadow" />
            </div>
        }
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Form Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!barangayName.trim()) errors.barangayName = "Barangay name is required";
    if (!municipality.trim()) errors.municipality = "Municipality is required";
    if (!province.trim()) errors.province = "Province is required";
    if (!zipCode.trim()) errors.zipCode = "ZIP code is required";
    if (!documentPrefix.trim()) errors.documentPrefix = "Document prefix is required";
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      errors.contactEmail = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Barangay Info
  const [barangayName, setBarangayName] = useState("Barangay Tambo");
  const [municipality, setMunicipality] = useState("Olongapo City");
  const [province, setProvince] = useState("Zambales");
  const [region, setRegion] = useState("Region III - Central Luzon");
  const [zipCode, setZipCode] = useState("2200");
  const [barangayCode, setBarangayCode] = useState("037101001");
  const [population, setPopulation] = useState("12,450");
  const [numPuroks, setNumPuroks] = useState("8");

  // Contact Info
  const [contactPhone, setContactPhone] = useState("(047) 222-1234");
  const [contactMobile, setContactMobile] = useState("0917-123-4567");
  const [contactEmail, setContactEmail] = useState("tambo@olongapo.gov.ph");
  const [contactAddress, setContactAddress] = useState("Barangay Hall, National Highway, Tambo, Olongapo City");
  const [officeHours, setOfficeHours] = useState("Mon-Fri, 8:00 AM - 5:00 PM");

  // System Preferences
  const [documentPrefix, setDocumentPrefix] = useState("TMB");
  const [fiscalYear, setFiscalYear] = useState("January - December");
  const [defaultCopies, setDefaultCopies] = useState("1");
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [publicPortal, setPublicPortal] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);

  // Modals
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState("info");

  const sections = [
    { id: "info", label: "Barangay Info", icon: Building2 },
    { id: "contact", label: "Contact Details", icon: Phone },
    { id: "branding", label: "Branding", icon: Upload },
    { id: "system", label: "System Preferences", icon: Shield },
    { id: "documents", label: "Document Settings", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure barangay-level settings, branding, and system preferences"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
              Reset to Default
            </button>
            <button onClick={() => { if (validateForm()) setShowSaveConfirm(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Settings Check</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Barangay logo and seal not yet uploaded — required for official documents. Automatic backup is enabled. Public portal is active with 9 modules.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
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
          {/* Barangay Info */}
          {activeSection === "info" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Barangay Information</h2>
              <p className="text-sm text-muted-foreground mb-5">Official barangay details used in documents and reports.</p>
              <div className="space-y-4">
                <SettingsInput label="Barangay Name" value={barangayName} onChange={(v) => { setBarangayName(v); clearError("barangayName"); }} icon={Building2} error={formErrors.barangayName} />
                <div className="grid grid-cols-2 gap-4">
                  <SettingsInput label="Municipality / City" value={municipality} onChange={(v) => { setMunicipality(v); clearError("municipality"); }} error={formErrors.municipality} />
                  <SettingsInput label="Province" value={province} onChange={(v) => { setProvince(v); clearError("province"); }} error={formErrors.province} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsInput label="Region" value={region} onChange={setRegion} />
                  <SettingsInput label="ZIP Code" value={zipCode} onChange={(v) => { setZipCode(v); clearError("zipCode"); }} error={formErrors.zipCode} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <SettingsInput label="PSGC Code" value={barangayCode} onChange={setBarangayCode} />
                  <SettingsInput label="Population" value={population} onChange={setPopulation} />
                  <SettingsInput label="Number of Puroks" value={numPuroks} onChange={setNumPuroks} />
                </div>
              </div>
            </div>
          )}

          {/* Contact Details */}
          {activeSection === "contact" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Contact Details</h2>
              <p className="text-sm text-muted-foreground mb-5">Contact information displayed on documents and the public portal.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <SettingsInput label="Landline" value={contactPhone} onChange={setContactPhone} icon={Phone} />
                  <SettingsInput label="Mobile" value={contactMobile} onChange={setContactMobile} icon={Phone} />
                </div>
                <SettingsInput label="Email Address" value={contactEmail} onChange={(v) => { setContactEmail(v); clearError("contactEmail"); }} icon={Mail} error={formErrors.contactEmail} />
                <SettingsInput label="Office Address" value={contactAddress} onChange={setContactAddress} icon={MapPin} />
                <SettingsInput label="Office Hours" value={officeHours} onChange={setOfficeHours} icon={Clock} />
              </div>
            </div>
          )}

          {/* Branding */}
          {activeSection === "branding" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Barangay Branding</h2>
              <p className="text-sm text-muted-foreground mb-5">Upload your barangay logo and seal. These appear on documents and the public portal.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-muted-foreground/30 transition-colors cursor-pointer">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Barangay Logo</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 2MB</p>
                    <button className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                      Upload File
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-2 px-1">Recommended: square image, 512x512px minimum. Appears on documents and certificates.</p>
                </div>
                <div>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-muted-foreground/30 transition-colors cursor-pointer">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Barangay Seal</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 2MB</p>
                    <button className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                      Upload File
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-2 px-1">Official seal used for document authentication. PNG with transparent background recommended.</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground">
                  These images will appear on official documents (certificates, clearances), printed reports, and your barangay.org.ph public portal.
                </p>
              </div>
            </div>
          )}

          {/* System Preferences */}
          {activeSection === "system" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">System Preferences</h2>
              <p className="text-sm text-muted-foreground mb-5">Configure system-wide behavior and defaults.</p>
              <div className="space-y-3">
                <SettingsToggle label="Automatic Backup" description="Create daily automated backups of all barangay data" checked={autoBackup} onChange={setAutoBackup} />
                <SettingsToggle label="Public Portal" description="Enable your barangay.org.ph public-facing website" checked={publicPortal} onChange={setPublicPortal} />
                <SettingsToggle label="Require Document Approval" description="Documents need approval from the Barangay Captain before issuance" checked={requireApproval} onChange={setRequireApproval} />
              </div>
            </div>
          )}

          {/* Document Settings */}
          {activeSection === "documents" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Document Settings</h2>
              <p className="text-sm text-muted-foreground mb-5">Configure document numbering, default values, and printing options.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <SettingsInput label="Document ID Prefix" value={documentPrefix} onChange={(v) => { setDocumentPrefix(v); clearError("documentPrefix"); }} placeholder="e.g., TMB" error={formErrors.documentPrefix} />
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Fiscal Year Start</label>
                    <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties}>
                      <option>January - December</option>
                      <option>July - June</option>
                    </select>
                  </div>
                </div>
                <SettingsInput label="Default Number of Copies" value={defaultCopies} onChange={setDefaultCopies} icon={Printer} />
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground">
                    Document IDs are auto-generated as: {documentPrefix}-YYYY-NNNNN (e.g., {documentPrefix}-2026-00001). This prefix applies to all documents issued by this barangay.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Notifications</h2>
              <p className="text-sm text-muted-foreground mb-5">Configure how you receive alerts and updates.</p>
              <div className="space-y-3">
                <SettingsToggle label="Email Notifications" description="Receive email alerts for new requests, approvals, and system events" checked={emailNotif} onChange={setEmailNotif} />
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                    <p className="text-[11px] text-muted-foreground">Receive SMS alerts for urgent events (requires SMS credits)</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">Coming Soon</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Push Notifications</p>
                    <p className="text-[11px] text-muted-foreground">Browser push notifications for real-time updates</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">Coming Soon</span>
                </div>
              </div>
            </div>
          )}

          {/* Info Notice */}
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              Looking for theme and accent color settings? Those are now in{" "}
              <a href="/dashboard/account" className="font-medium underline hover:text-foreground transition-colors" style={{ color: "var(--accent-primary)" }}>
                My Account
              </a>
              {" "}since they are personal preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
        <Modal open={showSaveConfirm} title="Save Settings" onClose={() => setShowSaveConfirm(false)} size="sm"
          footer={<>
            <ModalButton variant="secondary" onClick={() => setShowSaveConfirm(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={() => { setShowSaveConfirm(false); addToast("Settings saved successfully", "success"); }}>Save Changes</ModalButton>
          </>}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to save all changes? This will update barangay settings across the entire system including documents, reports, and the public portal.
            </p>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Changes to document prefix will not affect previously issued documents.
              </p>
            </div>
          </div>
        </Modal>

      {/* Reset Confirmation Modal */}
        <Modal open={showResetConfirm} title="Reset to Default" onClose={() => setShowResetConfirm(false)} size="sm"
          footer={<>
            <ModalButton variant="secondary" onClick={() => setShowResetConfirm(false)}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => { setShowResetConfirm(false); addToast("Settings reset to default", "success"); }}>Reset Settings</ModalButton>
          </>}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will reset all settings to their default values. Your barangay information, contact details, and system preferences will be cleared.
            </p>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> This action cannot be undone. Branding images will not be affected.
              </p>
            </div>
          </div>
        </Modal>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-in slide-in-from-right-5 fade-in duration-300",
                toast.type === "success" ? "bg-emerald-600" : "bg-red-600")}>
              <span>{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="ml-1 hover:opacity-80">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
