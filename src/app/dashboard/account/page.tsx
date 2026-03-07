"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useAuth, isApiError } from "@/contexts/auth-context";
import { api } from "@/lib/api";
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
  Activity,
  Download,
  Trash2,
  ShieldCheck,
  Clock,
  LogIn,
  LogOut,
  Loader2,
} from "lucide-react";

type TabId = "profile" | "security" | "activity" | "notifications" | "privacy";
type Status = "idle" | "loading" | "success" | "error";

type Session = {
  id: string;
  name: string;
  is_current: boolean;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
};

type ActivityLog = {
  id: string;
  action: string;
  ip_address: string;
  device_type: string;
  browser: string;
  created_at: string;
};

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccentColor();
  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Profile form state ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [extensionName, setExtensionName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [profileStatus, setProfileStatus] = useState<Status>("idle");
  const [contactStatus, setContactStatus] = useState<Status>("idle");
  const [usernameStatus, setUsernameStatus] = useState<Status>("idle");
  const [avatarStatus, setAvatarStatus] = useState<Status>("idle");

  // ── Security form state ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>("idle");
  const [passwordMessage, setPasswordMessage] = useState("");

  // ── Sessions ──
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ── Activity ──
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Populate form from user data
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setMiddleName(user.middle_name || "");
      setExtensionName(user.extension_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setUsername(user.username || "");
    }
  }, [user]);

  // Load sessions when security tab is active
  useEffect(() => {
    if (activeTab === "security") {
      loadSessions();
    }
  }, [activeTab]);

  // Load activity when activity tab is active
  useEffect(() => {
    if (activeTab === "activity") {
      loadActivity();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await api.account.getSessions();
      setSessions(data.sessions);
    } catch {
      // silently fail
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const data = await api.account.getActivity();
      setActivityLogs(data.activity);
    } catch {
      // silently fail
    } finally {
      setActivityLoading(false);
    }
  };

  // ── Handlers ──

  const handleSaveProfile = async () => {
    setProfileStatus("loading");
    try {
      await api.account.updateProfile({ first_name: firstName, last_name: lastName, middle_name: middleName || undefined, extension_name: extensionName || undefined });
      setProfileStatus("success");
      refreshUser();
      setTimeout(() => setProfileStatus("idle"), 2000);
    } catch {
      setProfileStatus("error");
      setTimeout(() => setProfileStatus("idle"), 3000);
    }
  };

  const handleSaveContact = async () => {
    setContactStatus("loading");
    try {
      await api.account.updateProfile({ email, phone: phone || undefined });
      setContactStatus("success");
      refreshUser();
      setTimeout(() => setContactStatus("idle"), 2000);
    } catch {
      setContactStatus("error");
      setTimeout(() => setContactStatus("idle"), 3000);
    }
  };

  const handleUpdateUsername = async () => {
    setUsernameStatus("loading");
    try {
      await api.account.updateUsername(username);
      setUsernameStatus("success");
      refreshUser();
      setTimeout(() => setUsernameStatus("idle"), 2000);
    } catch {
      setUsernameStatus("error");
      setTimeout(() => setUsernameStatus("idle"), 3000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarStatus("loading");
    try {
      await api.account.uploadAvatar(file);
      setAvatarStatus("success");
      refreshUser();
      setTimeout(() => setAvatarStatus("idle"), 2000);
    } catch {
      setAvatarStatus("error");
      setTimeout(() => setAvatarStatus("idle"), 3000);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    setAvatarStatus("loading");
    try {
      await api.account.deleteAvatar();
      setAvatarStatus("success");
      refreshUser();
      setTimeout(() => setAvatarStatus("idle"), 2000);
    } catch {
      setAvatarStatus("error");
      setTimeout(() => setAvatarStatus("idle"), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordMessage("Passwords do not match.");
      setTimeout(() => setPasswordStatus("idle"), 3000);
      return;
    }
    setPasswordStatus("loading");
    try {
      const res = await api.account.updatePassword(currentPassword, newPassword, confirmPassword);
      setPasswordStatus("success");
      setPasswordMessage(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus("idle"), 3000);
    } catch (e: unknown) {
      setPasswordStatus("error");
      setPasswordMessage(
        isApiError(e) ? (e.errors?.current_password?.[0] || e.message) : "Failed to change password"
      );
      setTimeout(() => setPasswordStatus("idle"), 3000);
    }
  };

  const handleRevokeSession = async (tokenId: string) => {
    try {
      await api.account.revokeSession(tokenId);
      setSessions((prev) => prev.filter((s) => s.id !== tokenId));
    } catch {
      // silently fail
    }
  };

  const handleSignOutAll = async () => {
    try {
      await api.auth.logoutAll();
      // This logs out the current session too, so redirect
      api.clearToken();
      window.location.href = "/login";
    } catch {
      // silently fail
    }
  };

  const handleSaveNotificationPreference = async (key: string, value: boolean) => {
    try {
      await api.account.updatePreferences({ [key]: value });
    } catch {
      // silently fail
    }
  };

  // ── Helpers ──

  const initials = user
    ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
    : "??";

  const formatRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return "Staff";
    return roles[0].replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  };

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

  const SaveButton = ({ status, label = "Save Changes", onClick }: { status: Status; label?: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={status === "loading"}
      className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-2"
      style={{ background: status === "success" ? "#059669" : status === "error" ? "#dc2626" : "var(--accent-primary)" }}
    >
      {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === "success" && <Check className="w-4 h-4" />}
      {status === "success" ? "Saved" : status === "loading" ? "Saving..." : label}
    </button>
  );

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
                  // eslint-disable-next-line @next/next/no-img-element
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
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                >
                  {avatarStatus === "loading" ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user?.full_name || "Loading..."}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatRole(user?.roles)}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarStatus === "loading"}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    {avatarStatus === "loading" ? "Uploading..." : "Upload Photo"}
                  </button>
                  {user?.photo_url && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={avatarStatus === "loading"}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-2">JPG, PNG, GIF, or WebP. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Middle Name</label>
                <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Extension Name</label>
                <input type="text" value={extensionName} onChange={(e) => setExtensionName(e.target.value)} placeholder="Jr., Sr., III, etc." className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <SaveButton status={profileStatus} onClick={handleSaveProfile} />
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
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                <p className="text-[11px] text-muted-foreground/70 mt-1">Used for password recovery and notifications.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</span>
                </label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                <p className="text-[11px] text-muted-foreground/70 mt-1">Used for SMS alerts and 2FA verification.</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <SaveButton status={contactStatus} onClick={handleSaveContact} />
            </div>
          </div>

          {/* Username */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Username</h2>
            <p className="text-xs text-muted-foreground mb-4">Your login credential. Changing this will require you to use the new username on next login.</p>
            <div className="max-w-sm">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
            </div>
            <div className="flex justify-end mt-4">
              <SaveButton status={usernameStatus} label="Update Username" onClick={handleUpdateUsername} />
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECURITY TAB                               */}
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
                  <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full px-3 py-2 pr-10 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full px-3 py-2 pr-10 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Minimum 8 characters with uppercase, lowercase, and number.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full px-3 py-2 pr-10 rounded-lg border border-input-border bg-input-bg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            {passwordMessage && (
              <p className={`text-xs mt-3 ${passwordStatus === "error" ? "text-red-500" : "text-emerald-500"}`}>{passwordMessage}</p>
            )}
            <div className="flex justify-end mt-4">
              <SaveButton status={passwordStatus} label="Update Password" onClick={handleChangePassword} />
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground mb-1">Two-Factor Authentication</h2>
                <p className="text-xs text-muted-foreground">Add an extra layer of security using authenticator app or SMS.</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-3 h-3" /> Coming Soon
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Smartphone className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Authenticator App</p>
                    <p className="text-[11px] text-muted-foreground">Google Authenticator, Authy, or similar</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Phone className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">SMS Verification</p>
                    <p className="text-[11px] text-muted-foreground">Receive a code via text message on login</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Active Sessions</h2>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border",
                      session.is_current
                        ? "border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        session.is_current ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"
                      )}>
                        <Monitor className={cn("w-5 h-5", session.is_current ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{session.name || "Web Session"}</p>
                          {session.is_current && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">Active Now</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {session.last_used_at ? `Last active: ${formatTime(session.last_used_at)}` : `Created: ${formatTime(session.created_at)}`}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sign Out All Devices */}
          <div className="bg-card border border-red-200 dark:border-red-900 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Sign Out All Devices</h2>
                <p className="text-xs text-muted-foreground">This will immediately revoke all active sessions. You will need to log in again.</p>
              </div>
              <button onClick={handleSignOutAll} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors whitespace-nowrap">Sign Out All</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ACTIVITY TAB                               */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* Activity Log */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Activity Log</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Sign-in and sign-out history for your account</p>
              </div>
            </div>

            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {log.action === "login" ? (
                          <LogIn className="w-4 h-4 text-emerald-500" />
                        ) : log.action === "logout" ? (
                          <LogOut className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-foreground">
                          {log.action === "login" ? "Signed in" : log.action === "logout" ? "Signed out" : "Failed attempt"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {log.browser} on {log.device_type} &middot; {log.ip_address}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTime(log.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
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
                { key: "notif_email_doc_requests", label: "Document Requests", desc: "When a resident requests a document online", defaultOn: true },
                { key: "notif_email_complaints", label: "Public Complaints", desc: "When a new complaint is submitted via the public portal", defaultOn: true },
                { key: "notif_email_system", label: "System Updates", desc: "Platform updates, maintenance notices, and new features", defaultOn: true },
                { key: "notif_email_security", label: "Security Alerts", desc: "Unusual login attempts and password changes", defaultOn: true },
                { key: "notif_email_weekly", label: "Weekly Summary", desc: "Weekly digest of barangay operations and statistics", defaultOn: false },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input
                      type="checkbox"
                      defaultChecked={(user?.preferences as Record<string, unknown>)?.[item.key] as boolean ?? item.defaultOn}
                      onChange={(e) => handleSaveNotificationPreference(item.key, e.target.checked)}
                      className="sr-only peer"
                    />
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
                { key: "notif_sms_security", label: "Security Codes", desc: "2FA verification codes and security alerts", defaultOn: true },
                { key: "notif_sms_urgent", label: "Urgent Alerts", desc: "Disaster warnings, emergency notices from barangay", defaultOn: true },
                { key: "notif_sms_doc_ready", label: "Document Ready", desc: "When a requested document is ready for pickup", defaultOn: false },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input
                      type="checkbox"
                      defaultChecked={(user?.preferences as Record<string, unknown>)?.[item.key] as boolean ?? item.defaultOn}
                      onChange={(e) => handleSaveNotificationPreference(item.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-[var(--accent-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
            {!user?.phone && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  No phone number registered. Add your phone in the Profile tab to receive SMS notifications.
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
                { key: "notif_app_doc_requests", label: "New Document Requests", desc: "Badge counter on the notification bell", defaultOn: true },
                { key: "notif_app_tasks", label: "Task Assignments", desc: "When you are assigned a new task or follow-up", defaultOn: true },
                { key: "notif_app_residents", label: "Resident Updates", desc: "When a resident profile is updated by another staff member", defaultOn: false },
                { key: "notif_app_sound", label: "Sound", desc: "Play a sound when a new notification arrives", defaultOn: false },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input
                      type="checkbox"
                      defaultChecked={(user?.preferences as Record<string, unknown>)?.[item.key] as boolean ?? item.defaultOn}
                      onChange={(e) => handleSaveNotificationPreference(item.key, e.target.checked)}
                      className="sr-only peer"
                    />
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
                  <input type="time" defaultValue="22:00" onChange={(e) => handleSaveNotificationPreference("quiet_hours_start", e.target.value as unknown as boolean)} className="px-2.5 py-1.5 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                </div>
                <span className="text-muted-foreground mt-5">-</span>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">To</label>
                  <input type="time" defaultValue="06:00" onChange={(e) => handleSaveNotificationPreference("quiet_hours_end", e.target.value as unknown as boolean)} className="px-2.5 py-1.5 rounded-lg border border-input-border bg-input-bg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-5">
                <input
                  type="checkbox"
                  defaultChecked={(user?.preferences as Record<string, unknown>)?.quiet_hours_enabled as boolean ?? false}
                  onChange={(e) => handleSaveNotificationPreference("quiet_hours_enabled", e.target.checked)}
                  className="sr-only peer"
                />
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
                  Your data is protected under Republic Act No. 10173 (Data Privacy Act of 2012). This system is registered with the National Privacy Commission (NPC).
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
              Under RA 10173 Section 18, you have the right to access your personal information.
            </p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                Request Data Export
              </button>
              <p className="text-[11px] text-muted-foreground">Delivered as a ZIP file via email.</p>
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
                  Under RA 10173 Section 18(f), you have the right to erasure of personal data. This request is reviewed by your barangay administrator and processed within 10 business days.
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
