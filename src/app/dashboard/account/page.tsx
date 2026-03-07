"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import {
  useAccentColor,
  ACCENT_COLORS,
  persistThemePreference,
  type AccentColor,
} from "@/hooks/use-theme-store";
import { cn } from "@/lib/utils";
import {
  Camera,
  User,
  Mail,
  Phone,
  Shield,
  Smartphone,
  Monitor,
  MapPin,
  Globe,
  Key,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  ChevronRight,
  Sun,
  Moon,
  Palette,
  Bell,
  BellOff,
  MessageSquare,
  FileText,
  Users,
  Activity,
  Download,
  Trash2,
  ShieldCheck,
  ScrollText,
  Clock,
  Filter,
  LogIn,
  LogOut,
  UserPlus,
  FilePlus,
  Edit3,
  AlertCircle,
} from "lucide-react";

type TabId = "profile" | "security" | "activity" | "notifications" | "privacy";

export default function AccountPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccentColor();
  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"all" | "login" | "document" | "record">("all");

  const accentOptions: { name: string; value: AccentColor }[] = [
    { name: "Blue", value: "blue" },
    { name: "Emerald", value: "emerald" },
    { name: "Violet", value: "violet" },
    { name: "Rose", value: "rose" },
    { name: "Amber", value: "amber" },
    { name: "Cyan", value: "cyan" },
    { name: "Orange", value: "orange" },
    { name: "Indigo", value: "indigo" },
  ];

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Data & Privacy", icon: ShieldCheck },
  ];

  const initials = user
    ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
    : "??";

  const formatRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return "Staff";
    return roles[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Placeholder activity data — will connect to API
  const activityItems = [
    { type: "login" as const, icon: LogIn, label: "Signed in", detail: "Chrome on Windows", time: "Just now", color: "text-emerald-500" },
    { type: "document" as const, icon: FilePlus, label: "Issued Barangay Clearance", detail: "For: Juan dela Cruz", time: "2 hours ago", color: "text-blue-500" },
    { type: "record" as const, icon: UserPlus, label: "Registered new resident", detail: "Maria Santos, Purok 3", time: "3 hours ago", color: "text-violet-500" },
    { type: "document" as const, icon: FilePlus, label: "Issued Certificate of Indigency", detail: "For: Pedro Reyes", time: "Yesterday, 3:45 PM", color: "text-blue-500" },
    { type: "record" as const, icon: Edit3, label: "Updated resident record", detail: "Ana Gomez — changed address", time: "Yesterday, 2:10 PM", color: "text-amber-500" },
    { type: "login" as const, icon: LogOut, label: "Signed out", detail: "Chrome on Windows", time: "Yesterday, 5:00 PM", color: "text-muted-foreground" },
    { type: "login" as const, icon: LogIn, label: "Signed in", detail: "Chrome on Windows", time: "Yesterday, 8:02 AM", color: "text-emerald-500" },
    { type: "document" as const, icon: FilePlus, label: "Issued Barangay ID", detail: "For: Roberto Lim", time: "2 days ago", color: "text-blue-500" },
    { type: "login" as const, icon: AlertCircle, label: "Failed login attempt", detail: "Wrong password", time: "3 days ago", color: "text-red-500" },
    { type: "record" as const, icon: UserPlus, label: "Registered new resident", detail: "Carlos Tan, Purok 1", time: "3 days ago", color: "text-violet-500" },
  ];

  const filteredActivity = activityFilter === "all"
    ? activityItems
    : activityItems.filter((a) => a.type === activityFilter);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile, security, activity, notifications, and data privacy.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PROFILE TAB                                */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative group">
                {user?.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt="Profile photo"
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-border"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    {initials}
                  </div>
                )}
                <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user?.full_name || "Loading..."}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatRole(user?.roles)}</p>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                    Upload Photo
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Remove
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-2">JPG, PNG, or GIF. Max 2MB. Recommended 256x256px.</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                <input type="text" defaultValue={user?.first_name || ""} className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                <input type="text" defaultValue={user?.last_name || ""} className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Middle Name</label>
                <input type="text" defaultValue={user?.middle_name || ""} placeholder="Optional" className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Extension Name</label>
                <input type="text" defaultValue={user?.extension_name || ""} placeholder="Jr., Sr., III, etc." className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>Save Changes</button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</span>
                </label>
                <div className="flex gap-2">
                  <input type="email" defaultValue={user?.email || ""} placeholder="your@email.com" className="flex-1 px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  <button className="px-3 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap">Verify</button>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Used for password recovery and notifications.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</span>
                </label>
                <div className="flex gap-2">
                  <input type="tel" defaultValue={user?.phone || ""} placeholder="+63 9XX XXX XXXX" className="flex-1 px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  <button className="px-3 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap">Verify</button>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Used for SMS alerts and 2FA verification.</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>Save Changes</button>
            </div>
          </div>

          {/* Username */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Username</h2>
            <p className="text-xs text-muted-foreground mb-4">Your login credential. Changing this will require you to use the new username on next login.</p>
            <div className="max-w-sm">
              <input type="text" defaultValue={user?.username || ""} className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>Update Username</button>
            </div>
          </div>

          {/* Appearance */}
          {mounted && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-card-foreground">Appearance</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Personalize your dashboard theme and accent color. These settings follow your account across devices.</p>

              <div className="mb-6">
                <label className="block text-xs font-medium text-muted-foreground mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System", icon: Monitor },
                  ].map((option) => (
                    <button key={option.value} onClick={() => { setTheme(option.value); persistThemePreference(option.value); }}
                      className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all", theme === option.value ? "border-accent bg-accent-bg" : "border-border hover:border-muted-foreground/30")}>
                      <option.icon className={cn("w-5 h-5", theme === option.value ? "text-accent" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-medium", theme === option.value ? "text-accent-text" : "text-muted-foreground")}>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-3">Accent Color</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {accentOptions.map((option) => {
                    const colors = ACCENT_COLORS[option.value];
                    const isActive = accent === option.value;
                    return (
                      <button key={option.value} onClick={() => setAccent(option.value)}
                        className={cn("flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all", isActive ? "border-current shadow-sm" : "border-border hover:border-muted-foreground/30")}
                        style={isActive ? { borderColor: colors.primary } : undefined}>
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full" style={{ background: colors.primary }} />
                          {isActive && <div className="absolute inset-0 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">{option.name}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 rounded-lg border border-border bg-background">
                  <p className="text-[11px] text-muted-foreground mb-2">Preview</p>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ background: "var(--accent-primary)" }}>Primary</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ color: "var(--accent-primary)", borderColor: "var(--accent-primary)" }}>Secondary</button>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}>Badge</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECURITY TAB (includes sessions)           */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Change Password</h2>
            <p className="text-xs text-muted-foreground mb-4">Update your password regularly for better security.</p>
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Password</label>
                <div className="relative">
                  <input type={showCurrentPassword ? "text" : "password"} placeholder="Enter current password" className="w-full px-3 py-2 pr-10 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} placeholder="Enter new password" className="w-full px-3 py-2 pr-10 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-1 mt-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-1 flex-1 rounded-full bg-border" />)}</div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Minimum 8 characters with uppercase, lowercase, number, and symbol.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" className="w-full px-3 py-2 pr-10 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>Update Password</button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground mb-1">Two-Factor Authentication</h2>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account using authenticator app or SMS.</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-3 h-3" /> Not Enabled
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Smartphone className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Authenticator App</p>
                    <p className="text-[11px] text-muted-foreground">Use Google Authenticator, Authy, or similar app</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Phone className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">SMS Verification</p>
                    <p className="text-[11px] text-muted-foreground">Receive a code via text message on login</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>

          {/* Recovery Options */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Recovery Options</h2>
            <p className="text-xs text-muted-foreground mb-4">Backup methods to regain access if you lose your password or 2FA device.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Mail className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Recovery Email</p>
                    <p className="text-[11px] text-muted-foreground">{user?.email ? `${user.email.slice(0, 3)}***${user.email.slice(user.email.indexOf("@"))}` : "Not set"}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${user?.email ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
                  {user?.email ? <><Check className="w-3 h-3" /> Set</> : "Not Set"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Phone className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Recovery Phone</p>
                    <p className="text-[11px] text-muted-foreground">{user?.phone ? `+63 ***${user.phone.slice(-4)}` : "Not set"}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${user?.phone ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
                  {user?.phone ? <><Check className="w-3 h-3" /> Set</> : "Not Set"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Key className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Backup Codes</p>
                    <p className="text-[11px] text-muted-foreground">One-time use codes for emergency access</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Generate</button>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Active Sessions</h2>
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">This Device</p>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">Active Now</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Chrome on Windows</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Philippines</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Out All Devices */}
          <div className="bg-card border border-red-200 dark:border-red-900 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Sign Out All Devices</h2>
                <p className="text-xs text-muted-foreground">This will immediately revoke all active sessions and tokens across every device. You will need to log in again.</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors whitespace-nowrap">Sign Out All</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ACTIVITY TAB                               */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* Activity Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Actions", value: "247", sub: "This month", color: "text-foreground" },
              { label: "Documents Issued", value: "89", sub: "This month", color: "text-blue-500" },
              { label: "Records Modified", value: "134", sub: "This month", color: "text-violet-500" },
              { label: "Sign-ins", value: "24", sub: "This month", color: "text-emerald-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Activity Log */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Activity Log</h2>
                <p className="text-xs text-muted-foreground mt-0.5">All actions performed under your account</p>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-lg">
                {[
                  { id: "all" as const, label: "All" },
                  { id: "login" as const, label: "Sign-ins" },
                  { id: "document" as const, label: "Documents" },
                  { id: "record" as const, label: "Records" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActivityFilter(f.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activityFilter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              {filteredActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredActivity.length === 0 && (
              <div className="text-center py-8">
                <Filter className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No matching activity</p>
              </div>
            )}

            <div className="flex justify-center mt-4">
              <button className="text-xs font-medium hover:underline transition-colors" style={{ color: "var(--accent-primary)" }}>
                Load More Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* NOTIFICATIONS TAB                          */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">Email Notifications</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Choose which email notifications you want to receive.</p>
            <div className="space-y-4">
              {[
                { label: "Document Requests", desc: "When a resident requests a document online", defaultOn: true },
                { label: "Public Complaints", desc: "When a new complaint is submitted via the public portal", defaultOn: true },
                { label: "System Updates", desc: "Platform updates, maintenance notices, and new features", defaultOn: true },
                { label: "Security Alerts", desc: "Unusual login attempts and password changes", defaultOn: true },
                { label: "Weekly Summary", desc: "Weekly digest of barangay operations and statistics", defaultOn: false },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                    <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-[var(--accent-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">SMS Notifications</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Text message alerts sent to your registered phone number.</p>
            <div className="space-y-4">
              {[
                { label: "Security Codes", desc: "2FA verification codes and security alerts", defaultOn: true },
                { label: "Urgent Alerts", desc: "Disaster warnings, emergency notices from barangay", defaultOn: true },
                { label: "Document Ready", desc: "When a requested document is ready for pickup", defaultOn: false },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                    <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-[var(--accent-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
            {!user?.phone && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  No phone number registered. Add your phone number in the Profile tab to receive SMS notifications.
                </p>
              </div>
            )}
          </div>

          {/* In-App Notifications */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">In-App Notifications</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Notifications shown inside the dashboard.</p>
            <div className="space-y-4">
              {[
                { label: "New Document Requests", desc: "Badge counter on the notification bell", defaultOn: true },
                { label: "Task Assignments", desc: "When you are assigned a new task or follow-up", defaultOn: true },
                { label: "Resident Updates", desc: "When a resident profile is updated by another staff member", defaultOn: false },
                { label: "Sound", desc: "Play a sound when a new notification arrives", defaultOn: false },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                    <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-[var(--accent-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <BellOff className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">Quiet Hours</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Silence non-urgent notifications during specific hours.</p>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">From</label>
                  <input type="time" defaultValue="22:00" className="px-2.5 py-1.5 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                </div>
                <span className="text-muted-foreground mt-5">-</span>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">To</label>
                  <input type="time" defaultValue="06:00" className="px-2.5 py-1.5 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-5">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-[var(--accent-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* DATA & PRIVACY TAB                         */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          {/* RA 10173 Compliance Banner */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-bg)" }}>
                <ShieldCheck className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Data Privacy Protection</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Your data is protected under Republic Act No. 10173 (Data Privacy Act of 2012). This system is registered with the National Privacy Commission (NPC) and follows strict data handling procedures.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3 h-3" /> RA 10173 Compliant
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3 h-3" /> NPC Registered
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Your Data */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Your Data</h2>
            <p className="text-xs text-muted-foreground mb-4">Information stored about you in this system.</p>
            <div className="space-y-3">
              {[
                { category: "Personal Information", items: "Name, username, email, phone", icon: User },
                { category: "Authentication", items: "Hashed password, login tokens, 2FA settings", icon: Key },
                { category: "Activity Logs", items: "Login history, actions performed, IP addresses", icon: Activity },
                { category: "Preferences", items: "Theme, accent color, notification settings", icon: Palette },
                { category: "Documents Issued", items: "Records of documents you created or processed", icon: FileText },
                { category: "Session Data", items: "Browser type, device info, session timestamps", icon: Monitor },
              ].map((item) => (
                <div key={item.category} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.category}</p>
                    <p className="text-[11px] text-muted-foreground">{item.items}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">Download Your Data</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Request a copy of all personal data we store about you. Under RA 10173 Section 18, you have the right to access your personal information.
            </p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                Request Data Export
              </button>
              <p className="text-[11px] text-muted-foreground">Export includes: profile, activity logs, documents issued. Delivered as a ZIP file via email.</p>
            </div>
          </div>

          {/* Consent Management */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <ScrollText className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">Consent & Agreements</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Review and manage your data processing consent.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Terms of Service</p>
                  <p className="text-[11px] text-muted-foreground">Accepted on account creation</p>
                </div>
                <button className="text-xs font-medium hover:underline" style={{ color: "var(--accent-primary)" }}>View</button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                  <p className="text-[11px] text-muted-foreground">Last updated: March 2026</p>
                </div>
                <button className="text-xs font-medium hover:underline" style={{ color: "var(--accent-primary)" }}>View</button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Data Processing Agreement</p>
                  <p className="text-[11px] text-muted-foreground">Consent for processing personal data under RA 10173</p>
                </div>
                <button className="text-xs font-medium hover:underline" style={{ color: "var(--accent-primary)" }}>View</button>
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">Data Retention</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">How long we keep your data.</p>
            <div className="space-y-2">
              {[
                { type: "Activity Logs", retention: "1 year", detail: "Login history and action logs" },
                { type: "Session Data", retention: "30 days", detail: "Active session and device information" },
                { type: "Account Data", retention: "Until deletion", detail: "Profile, preferences, contact info" },
                { type: "Documents Issued", retention: "Permanent", detail: "Official government records (required by law)" },
              ].map((item) => (
                <div key={item.type} className="flex items-center justify-between py-2 px-3 rounded-lg">
                  <div>
                    <p className="text-sm text-foreground">{item.type}</p>
                    <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.retention}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-card border border-red-200 dark:border-red-900 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Request Account Deletion</h2>
                <p className="text-xs text-muted-foreground mb-3">
                  Under RA 10173 Section 18(f), you have the right to erasure or blocking of personal data. Submitting a deletion request will:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4 list-disc list-inside">
                  <li>Remove all personal information (name, email, phone, photo)</li>
                  <li>Anonymize your activity logs and session history</li>
                  <li>Revoke all active sessions immediately</li>
                  <li>Retain only official government records as required by law</li>
                </ul>
                <p className="text-[11px] text-muted-foreground/70 mb-3">
                  This request is reviewed by the barangay administrator and processed within 10 business days. You will receive a confirmation email.
                </p>
                <button className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">
                  Request Account Deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
