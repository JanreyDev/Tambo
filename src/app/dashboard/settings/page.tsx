"use client";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure barangay-level settings and branding.
        </p>
      </div>

      {/* Barangay Branding */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Barangay Branding
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your barangay logo and seal. These appear on documents and the
          public portal.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-muted-foreground/30 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-lg text-muted-foreground">+</span>
            </div>
            <p className="text-sm font-medium text-card-foreground">
              Barangay Logo
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG or JPG, max 2MB
            </p>
          </div>
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-muted-foreground/30 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-lg text-muted-foreground">+</span>
            </div>
            <p className="text-sm font-medium text-card-foreground">
              Barangay Seal
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG or JPG, max 2MB
            </p>
          </div>
        </div>
      </div>

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
  );
}
