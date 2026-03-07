"use client";

import { useState } from "react";
import {
  Save,
  Upload,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Building2,
  Shield,
  Bell,
  FileText,
  Users,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
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

  const Input = ({ label, value, onChange, placeholder, icon: Icon, disabled }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ElementType; disabled?: boolean }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          className={cn("w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 transition-colors",
            Icon && "pl-9", disabled && "opacity-50 cursor-not-allowed")}
          style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties} />
      </div>
    </div>
  );

  const Toggle = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) => (
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
            <button onClick={() => setShowSaveConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        }
      />

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
                <Input label="Barangay Name" value={barangayName} onChange={setBarangayName} icon={Building2} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Municipality / City" value={municipality} onChange={setMunicipality} />
                  <Input label="Province" value={province} onChange={setProvince} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Region" value={region} onChange={setRegion} />
                  <Input label="ZIP Code" value={zipCode} onChange={setZipCode} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="PSGC Code" value={barangayCode} onChange={setBarangayCode} />
                  <Input label="Population" value={population} onChange={setPopulation} />
                  <Input label="Number of Puroks" value={numPuroks} onChange={setNumPuroks} />
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
                  <Input label="Landline" value={contactPhone} onChange={setContactPhone} icon={Phone} />
                  <Input label="Mobile" value={contactMobile} onChange={setContactMobile} icon={Phone} />
                </div>
                <Input label="Email Address" value={contactEmail} onChange={setContactEmail} icon={Mail} />
                <Input label="Office Address" value={contactAddress} onChange={setContactAddress} icon={MapPin} />
                <Input label="Office Hours" value={officeHours} onChange={setOfficeHours} icon={Clock} />
              </div>
            </div>
          )}

          {/* Branding */}
          {activeSection === "branding" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Barangay Branding</h2>
              <p className="text-sm text-muted-foreground mb-5">Upload your barangay logo and seal. These appear on documents and the public portal.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
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
                <Toggle label="Automatic Backup" description="Create daily automated backups of all barangay data" checked={autoBackup} onChange={setAutoBackup} />
                <Toggle label="Public Portal" description="Enable your barangay.org.ph public-facing website" checked={publicPortal} onChange={setPublicPortal} />
                <Toggle label="Require Document Approval" description="Documents need approval from the Barangay Captain before issuance" checked={requireApproval} onChange={setRequireApproval} />
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
                  <Input label="Document ID Prefix" value={documentPrefix} onChange={setDocumentPrefix} placeholder="e.g., TMB" />
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
                <Input label="Default Number of Copies" value={defaultCopies} onChange={setDefaultCopies} icon={Printer} />
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
                <Toggle label="Email Notifications" description="Receive email alerts for new requests, approvals, and system events" checked={emailNotif} onChange={setEmailNotif} />
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
            <ModalButton variant="primary" onClick={() => setShowSaveConfirm(false)}>Save Changes</ModalButton>
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
            <ModalButton variant="danger" onClick={() => setShowResetConfirm(false)}>Reset Settings</ModalButton>
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

    </div>
  );
}
