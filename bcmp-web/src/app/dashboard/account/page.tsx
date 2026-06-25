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
import { cn, resolvePhotoUrl } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import {
  Camera,
  User,
  Mail,
  Phone,
  Shield,
  Monitor,
  Key,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
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
  Smartphone,
  Globe,
  MapPin,
  Lock,
  Fingerprint,
  QrCode,
  Copy,
  RefreshCw,
  X,
  Bot,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Hash,
  Coins,
} from "lucide-react";
import Image from "next/image";
import type { AiConversationSummary, AiCredits, AiConversation } from "@/lib/types";
import { Markdown } from "@/components/ui/markdown";
import { MabiniButton } from '@/components/ui/mabini-button';

function MabiniIcon({ size = 32 }: { size?: number }) {
  return (
    <div className="overflow-hidden shrink-0 bg-white rounded-lg" style={{ width: size, height: size }}>
      <Image src="/mabini-ai.png" alt="Mabini AI" width={size} height={size} className="object-cover" />
    </div>
  );
}

type TabId = "profile" | "security" | "activity" | "mabini" | "notifications" | "privacy";
type Status = "idle" | "loading" | "success" | "error";

type Session = {
  id: string;
  name: string;
  is_current: boolean;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
  ip_address?: string;
  browser?: string;
  browser_version?: string;
  platform?: string;
  device_type?: string;
  location?: string;
};

type ActivityLog = {
  id: string;
  action: string;
  category: string;
  description: string;
  ip_address: string;
  device_type: string;
  browser: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

function SaveButton({ status, label = "Save Changes", onClick }: { status: Status; label?: string; onClick: () => void }) {
  return (
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
}

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
  const [usernameMessage, setUsernameMessage] = useState("");
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

  // ── Mabini AI History ──
  const [aiConversations, setAiConversations] = useState<AiConversationSummary[]>([]);
  const [aiCredits, setAiCredits] = useState<AiCredits | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPage, setAiPage] = useState(1);
  const [aiLastPage, setAiLastPage] = useState(1);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<AiConversation | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // ── Phone verification ──
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [phoneToVerify, setPhoneToVerify] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerifyStatus, setPhoneVerifyStatus] = useState<Status>("idle");
  const [phoneVerifyMessage, setPhoneVerifyMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [phoneOtpExpiry, setPhoneOtpExpiry] = useState(0);

  // ── Email verification ──
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerifyStatus, setEmailVerifyStatus] = useState<Status>("idle");
  const [emailVerifyMessage, setEmailVerifyMessage] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCooldown, setEmailOtpCooldown] = useState(0);
  const [emailOtpExpiry, setEmailOtpExpiry] = useState(0);

  // ── Data export ──
  const [exportStatus, setExportStatus] = useState<Status>("idle");

  // ── Sign out all ──
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);

  // ── Username cooldown ──
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 2FA ──
  const [twoFASetupStep, setTwoFASetupStep] = useState<"idle" | "qr" | "verify" | "done">("idle");
  const [twoFASecret, setTwoFASecret] = useState("");
  const [twoFAQrCode, setTwoFAQrCode] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFARecoveryCodes, setTwoFARecoveryCodes] = useState<string[]>([]);
  const [twoFAStatus, setTwoFAStatus] = useState<Status>("idle");
  const [twoFAMessage, setTwoFAMessage] = useState("");
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState("");
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  // ── Activity filter ──
  const [activityFilter, setActivityFilter] = useState("all");
  const [activityPage, setActivityPage] = useState(1);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [activityTotal, setActivityTotal] = useState(0);

  // ── Deletion ──
  const [deletionStatus, setDeletionStatus] = useState<Status>("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Load Mabini AI history when tab is active
  useEffect(() => {
    if (activeTab === "mabini") {
      loadAiHistory(1);
      loadAiCredits();
    }
  }, [activeTab]);

  // OTP cooldown timers
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (emailOtpCooldown <= 0) return;
    const timer = setInterval(() => setEmailOtpCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [emailOtpCooldown]);

  // OTP expiry countdown timers (5 minutes)
  useEffect(() => {
    if (phoneOtpExpiry <= 0) return;
    const timer = setInterval(() => setPhoneOtpExpiry((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [phoneOtpExpiry]);

  useEffect(() => {
    if (emailOtpExpiry <= 0) return;
    const timer = setInterval(() => setEmailOtpExpiry((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [emailOtpExpiry]);

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

  const loadActivity = async (page = 1, type = "all") => {
    setActivityLoading(true);
    try {
      const data = await api.account.getActivity({ page, type: type === "all" ? undefined : type });
      if (page === 1) {
        setActivityLogs(data.activity);
      } else {
        setActivityLogs((prev) => [...prev, ...data.activity]);
      }
      setActivityTotal(data.total);
      setActivityHasMore(data.has_more);
    } catch {
      // silently fail
    } finally {
      setActivityLoading(false);
    }
  };

  const loadAiHistory = async (page: number) => {
    setAiLoading(true);
    try {
      const data = await api.ai.getConversations(page);
      if (page === 1) {
        setAiConversations(data.data);
      } else {
        setAiConversations((prev) => [...prev, ...data.data]);
      }
      setAiPage(data.current_page);
      setAiLastPage(data.last_page);
    } catch {
      // silently fail
    } finally {
      setAiLoading(false);
    }
  };

  const loadAiCredits = async () => {
    try {
      const data = await api.ai.getCredits();
      setAiCredits(data);
    } catch {
      // silently fail
    }
  };

  const loadConversationDetail = async (id: string) => {
    if (expandedConv === id) {
      setExpandedConv(null);
      setExpandedMessages(null);
      return;
    }
    setExpandedConv(id);
    setExpandedLoading(true);
    try {
      const data = await api.ai.getConversation(id);
      setExpandedMessages(data);
    } catch {
      setExpandedMessages(null);
    } finally {
      setExpandedLoading(false);
    }
  };

  // ── Handlers ──

  const handleSaveProfile = async () => {
    setProfileStatus("loading");
    try {
      await api.account.updateProfile({ first_name: firstName, last_name: lastName, middle_name: middleName || null, extension_name: extensionName || null });
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
      await api.account.updateProfile({ email, phone: phone || null });
      setContactStatus("success");
      refreshUser();
      setTimeout(() => setContactStatus("idle"), 2000);
    } catch {
      setContactStatus("error");
      setTimeout(() => setContactStatus("idle"), 3000);
    }
  };

  const handleCheckUsername = (value: string) => {
    setUsername(value);
    setUsernameAvailable(null);
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    if (!value || value.length < 3 || value === user?.username) return;
    setUsernameCheckLoading(true);
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await api.account.checkUsername(value);
        setUsernameAvailable(res.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setUsernameCheckLoading(false);
      }
    }, 500);
  };

  const handleUpdateUsername = async () => {
    if (!username || username.length < 3) {
      setUsernameStatus("error");
      setUsernameMessage("Username must be at least 3 characters.");
      setTimeout(() => { setUsernameStatus("idle"); setUsernameMessage(""); }, 3000);
      return;
    }
    if (username === user?.username) {
      setUsernameStatus("error");
      setUsernameMessage("No changes to save.");
      setTimeout(() => { setUsernameStatus("idle"); setUsernameMessage(""); }, 3000);
      return;
    }
    if (usernameAvailable === false) {
      setUsernameStatus("error");
      setUsernameMessage("This username is already taken. Please choose another.");
      setTimeout(() => { setUsernameStatus("idle"); setUsernameMessage(""); }, 3000);
      return;
    }
    setUsernameStatus("loading");
    try {
      await api.account.updateUsername(username);
      setUsernameStatus("success");
      setUsernameMessage("Username updated. You can change it again after 3 months.");
      setUsernameAvailable(null);
      refreshUser();
      setTimeout(() => { setUsernameStatus("idle"); setUsernameMessage(""); }, 4000);
    } catch (e: unknown) {
      setUsernameStatus("error");
      setUsernameMessage(isApiError(e) ? (e.errors?.username?.[0] || e.message) : "Failed to update username.");
      setTimeout(() => { setUsernameStatus("idle"); setUsernameMessage(""); }, 3000);
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
    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus("error");
      setPasswordMessage("Password must be at least 8 characters.");
      setTimeout(() => { setPasswordStatus("idle"); setPasswordMessage(""); }, 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordMessage("Passwords do not match.");
      setTimeout(() => { setPasswordStatus("idle"); setPasswordMessage(""); }, 3000);
      return;
    }
    setPasswordStatus("loading");
    try {
      const res = await api.account.updatePassword(currentPassword, newPassword, confirmPassword);
      setPasswordStatus("success");
      setPasswordMessage(res.message || "Password updated. You can change it again after 3 months.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      refreshUser();
      setTimeout(() => { setPasswordStatus("idle"); setPasswordMessage(""); }, 4000);
    } catch (e: unknown) {
      setPasswordStatus("error");
      setPasswordMessage(
        isApiError(e) ? (e.errors?.current_password?.[0] || e.errors?.password?.[0] || e.message) : "Failed to change password"
      );
      setTimeout(() => { setPasswordStatus("idle"); setPasswordMessage(""); }, 3000);
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
    setSignOutAllLoading(true);
    try {
      await api.auth.logoutAll();
      api.clearToken();
      window.location.href = "/";
    } catch {
      setSignOutAllLoading(false);
    }
  };

  const handleSaveNotificationPreference = async (key: string, value: unknown) => {
    try {
      await api.account.updatePreferences({ [key]: value });
    } catch {
      // silently fail
    }
  };

  // ── Phone verification ──

  const handleSendPhoneOtp = async () => {
    const phoneNum = phoneToVerify || phone;
    if (!phoneNum) return;
    setPhoneVerifyStatus("loading");
    try {
      await api.account.sendPhoneOtp(phoneNum);
      setOtpSent(true);
      setPhoneOtp("");
      setPhoneVerifyStatus("idle");
      setPhoneVerifyMessage("Verification code sent to your phone.");
      setOtpCooldown(60);
      setPhoneOtpExpiry(300);
    } catch (e: unknown) {
      setPhoneVerifyStatus("error");
      setPhoneVerifyMessage(isApiError(e) ? e.message : "Failed to send code.");
      setTimeout(() => { setPhoneVerifyStatus("idle"); setPhoneVerifyMessage(""); }, 3000);
    }
  };

  const handleVerifyPhone = async () => {
    const phoneNum = phoneToVerify || phone;
    if (!phoneNum || !phoneOtp) return;
    setPhoneVerifyStatus("loading");
    try {
      await api.account.verifyPhone(phoneNum, phoneOtp);
      setPhoneVerifyStatus("success");
      setPhoneVerifyMessage("Phone number verified.");
      refreshUser();
      setTimeout(() => {
        setShowPhoneVerify(false);
        setPhoneOtp("");
        setOtpSent(false);
        setPhoneVerifyStatus("idle");
        setPhoneVerifyMessage("");
      }, 2000);
    } catch (e: unknown) {
      setPhoneVerifyStatus("error");
      setPhoneVerifyMessage(isApiError(e) ? e.message : "Invalid code.");
      setTimeout(() => { setPhoneVerifyStatus("idle"); setPhoneVerifyMessage(""); }, 3000);
    }
  };

  // ── Email verification ──

  const handleSendEmailOtp = async () => {
    const emailAddr = emailToVerify || email;
    if (!emailAddr) return;
    setEmailVerifyStatus("loading");
    try {
      await api.account.sendEmailOtp(emailAddr);
      setEmailOtpSent(true);
      setEmailOtp("");
      setEmailVerifyStatus("idle");
      setEmailVerifyMessage("Verification code sent to your email.");
      setEmailOtpCooldown(60);
      setEmailOtpExpiry(300);
    } catch (e: unknown) {
      setEmailVerifyStatus("error");
      setEmailVerifyMessage(isApiError(e) ? e.message : "Failed to send code.");
      setTimeout(() => { setEmailVerifyStatus("idle"); setEmailVerifyMessage(""); }, 3000);
    }
  };

  const handleVerifyEmail = async () => {
    const emailAddr = emailToVerify || email;
    if (!emailAddr || !emailOtp) return;
    setEmailVerifyStatus("loading");
    try {
      await api.account.verifyEmail(emailAddr, emailOtp);
      setEmailVerifyStatus("success");
      setEmailVerifyMessage("Email address verified.");
      refreshUser();
      setTimeout(() => {
        setShowEmailVerify(false);
        setEmailOtp("");
        setEmailOtpSent(false);
        setEmailVerifyStatus("idle");
        setEmailVerifyMessage("");
      }, 2000);
    } catch (e: unknown) {
      setEmailVerifyStatus("error");
      setEmailVerifyMessage(isApiError(e) ? e.message : "Invalid code.");
      setTimeout(() => { setEmailVerifyStatus("idle"); setEmailVerifyMessage(""); }, 3000);
    }
  };

  // ── Data export ──

  const handleDataExport = async () => {
    setExportStatus("loading");
    try {
      const res = await api.account.requestDataExport();
      // Download as JSON file
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch {
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
    }
  };

  // ── Helpers ──

  const initials = user
    ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
    : "??";

  const formatRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return "Staff";
    return roles[0]!.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
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

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isPhoneVerified = !!(user?.preferences as Record<string, unknown>)?.phone_verified;
  const isEmailVerified = !!(user?.preferences as Record<string, unknown>)?.email_verified;
  const is2FAEnabled = !!(user?.preferences as Record<string, unknown>)?.two_factor_enabled;
  const twoFAMethod = (user?.preferences as Record<string, unknown>)?.two_factor_method as string | undefined;

  // Cooldown helpers (3-month = 90 days)
  const getCooldownRemaining = (changedAt: unknown): { locked: boolean; daysLeft: number; dateStr: string } => {
    if (!changedAt || typeof changedAt !== "string") return { locked: false, daysLeft: 0, dateStr: "" };
    const changed = new Date(changedAt);
    const unlockDate = new Date(changed.getTime() + 90 * 24 * 60 * 60 * 1000);
    const now = new Date();
    if (now >= unlockDate) return { locked: false, daysLeft: 0, dateStr: "" };
    const daysLeft = Math.ceil((unlockDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return { locked: true, daysLeft, dateStr: unlockDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) };
  };

  const prefs = (user?.preferences || {}) as Record<string, unknown>;
  const usernameCooldown = getCooldownRemaining(prefs.username_changed_at);
  const passwordCooldown = getCooldownRemaining(prefs.password_changed_at);

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
    { id: "mabini", label: "Mabini AI History", icon: Bot },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Data & Privacy", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader title="My Account" description="Manage your profile, security settings, activity logs, and notification preferences. All changes are logged and protected under RA 10173 (Data Privacy Act of 2012)." />

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
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative group">
                {user?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolvePhotoUrl(user.photo_url) || ""}
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
                  disabled={avatarStatus === "loading"}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer disabled:cursor-wait"
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
                {user?.photo_url && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={avatarStatus === "loading"}
                    className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Remove Photo
                  </button>
                )}
                <p className="text-[11px] text-muted-foreground/70 mt-2">
                  {avatarStatus === "success" ? "Photo updated." : avatarStatus === "error" ? "Upload failed. Try again." : "Hover the photo to change it. JPG, PNG, GIF, or WebP. Max 2MB."}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase().replace(/[^A-ZÑ\s\-'.]/g, ""))} className="w-full px-3 py-2 rounded-xl glass-input text-sm text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                <p className="text-[10px] text-muted-foreground/60 mt-1">Capital letters only</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase().replace(/[^A-ZÑ\s\-'.]/g, ""))} className="w-full px-3 py-2 rounded-xl glass-input text-sm text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                <p className="text-[10px] text-muted-foreground/60 mt-1">Capital letters only</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Middle Name</label>
                <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value.toUpperCase().replace(/[^A-ZÑ\s\-'.]/g, ""))} placeholder="Optional" className="w-full px-3 py-2 rounded-xl glass-input text-sm text-foreground uppercase placeholder:text-muted-foreground/50 placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                <p className="text-[10px] text-muted-foreground/60 mt-1">Capital letters only</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Extension Name</label>
                <select value={extensionName} onChange={(e) => setExtensionName(e.target.value)} className="w-full px-3 py-2 rounded-xl glass-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent">
                  <option value="">None</option>
                  <option value="JR.">Jr.</option>
                  <option value="SR.">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="V">V</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <SaveButton status={profileStatus} onClick={handleSaveProfile} />
            </div>
          </div>

          {/* Contact Information */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</span>
                </label>
                <div className="flex gap-2">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 px-3 py-2 rounded-xl glass-input text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  {email && (
                    <button
                      onClick={() => { setEmailToVerify(email); setShowEmailVerify(true); }}
                      className={cn(
                        "px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                        isEmailVerified && email === user?.email
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default"
                          : "text-white"
                      )}
                      style={!(isEmailVerified && email === user?.email) ? { background: "var(--accent-primary)" } : undefined}
                      disabled={isEmailVerified && email === user?.email}
                    >
                      {isEmailVerified && email === user?.email ? (
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span>
                      ) : "Verify"}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Used for password recovery and notifications.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</span>
                </label>
                <div className="flex gap-2">
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="flex-1 px-3 py-2 rounded-xl glass-input text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                  {phone && (
                    <button
                      onClick={() => { setPhoneToVerify(phone); setShowPhoneVerify(true); }}
                      className={cn(
                        "px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                        isPhoneVerified && phone === user?.phone
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default"
                          : "text-white"
                      )}
                      style={!(isPhoneVerified && phone === user?.phone) ? { background: "var(--accent-primary)" } : undefined}
                      disabled={isPhoneVerified && phone === user?.phone}
                    >
                      {isPhoneVerified && phone === user?.phone ? (
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span>
                      ) : "Verify"}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Used for SMS alerts and 2FA verification.</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <SaveButton status={contactStatus} onClick={handleSaveContact} />
            </div>
          </div>

          {/* Username */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Username</h2>
            <p className="text-xs text-muted-foreground mb-4">Your login credential. Changing this will require you to use the new username on next login.</p>
            {usernameCooldown.locked ? (
              <div className="max-w-sm">
                <input type="text" value={username} disabled className="w-full px-3 py-2 rounded-xl glass-input bg-muted/50 text-sm text-muted-foreground cursor-not-allowed" />
                <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Username change is locked for 3 months after each change. You can change it again on <span className="font-semibold">{usernameCooldown.dateStr}</span> ({usernameCooldown.daysLeft} days remaining).
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="max-w-sm">
                  <div className="relative">
                    <input type="text" value={username} onChange={(e) => handleCheckUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="w-full px-3 py-2 pr-10 rounded-xl glass-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                    {usernameCheckLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                    {!usernameCheckLoading && usernameAvailable === true && username !== user?.username && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    )}
                    {!usernameCheckLoading && usernameAvailable === false && (
                      <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">Only lowercase letters, numbers, and underscores. Minimum 3 characters.</p>
                  {usernameAvailable === false && (
                    <p className="text-[11px] text-red-500 mt-1">This username is already taken. Please choose another.</p>
                  )}
                  {usernameAvailable === true && username !== user?.username && (
                    <p className="text-[11px] text-emerald-500 mt-1">Username is available.</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 mt-1">After changing, you will not be able to change it again for 3 months.</p>
                </div>
                {usernameMessage && (
                  <p className={`text-xs mt-2 ${usernameStatus === "error" ? "text-red-500" : "text-emerald-500"}`}>{usernameMessage}</p>
                )}
                <div className="flex justify-end mt-4">
                  <SaveButton status={usernameStatus} label="Update Username" onClick={handleUpdateUsername} />
                </div>
              </>
            )}
          </div>

          {/* Appearance */}
          {mounted && (
            <div className="glass rounded-xl p-6">
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
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Change Password</h2>
            <p className="text-xs text-muted-foreground mb-4">Update your password regularly for better security.</p>
            {passwordCooldown.locked ? (
              <div className="max-w-md">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Password change is locked for 3 months after each change. You can change it again on <span className="font-semibold">{passwordCooldown.dateStr}</span> ({passwordCooldown.daysLeft} days remaining).
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Password</label>
                    <div className="relative">
                      <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full px-3 py-2 pr-10 rounded-xl glass-input text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">New Password</label>
                    <div className="relative">
                      <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full px-3 py-2 pr-10 rounded-xl glass-input text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">Minimum 8 characters with uppercase, lowercase, and number.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full px-3 py-2 pr-10 rounded-xl glass-input text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-2 max-w-md">After changing, you will not be able to change it again for 3 months.</p>
                {passwordMessage && (
                  <p className={`text-xs mt-3 ${passwordStatus === "error" ? "text-red-500" : "text-emerald-500"}`}>{passwordMessage}</p>
                )}
                <div className="flex justify-end mt-4">
                  <SaveButton status={passwordStatus} label="Update Password" onClick={handleChangePassword} />
                </div>
              </>
            )}
          </div>

          {/* Two-Factor Authentication */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Fingerprint className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-card-foreground">Two-Factor Authentication (2FA)</h2>
                </div>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account by requiring a second form of verification.</p>
              </div>
              {is2FAEnabled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                  <Check className="w-3 h-3" /> Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                  <AlertTriangle className="w-3 h-3" /> Disabled
                </span>
              )}
            </div>

            <div className="space-y-3">
              {/* Authenticator App */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Authenticator App</p>
                    <p className="text-[11px] text-muted-foreground">Use Google Authenticator, Authy, or similar apps</p>
                  </div>
                </div>
                {is2FAEnabled && twoFAMethod === "authenticator" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-500 font-medium">Active</span>
                    <button onClick={() => setShowDisable2FA(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                      Disable
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setTwoFAStatus("loading");
                      try {
                        const res = await api.account.setup2FA();
                        setTwoFASecret(res.secret);
                        setTwoFAQrCode(res.qr_code);
                        setTwoFARecoveryCodes(res.recovery_codes);
                        setTwoFASetupStep("qr");
                        setTwoFAStatus("idle");
                      } catch (e: unknown) {
                        setTwoFAStatus("error");
                        setTwoFAMessage(isApiError(e) ? e.message : "Failed to setup 2FA.");
                        setTimeout(() => { setTwoFAStatus("idle"); setTwoFAMessage(""); }, 3000);
                      }
                    }}
                    disabled={twoFAStatus === "loading" || is2FAEnabled}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    {twoFAStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Setup"}
                  </button>
                )}
              </div>

              {/* SMS 2FA */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">SMS Verification</p>
                    <p className="text-[11px] text-muted-foreground">
                      {user?.phone ? (isPhoneVerified ? `Verified: ${user.phone}` : "Phone not verified yet") : "No phone number set"}
                    </p>
                  </div>
                </div>
                {!user?.phone ? (
                  <button onClick={() => setActiveTab("profile")} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                    Add Phone
                  </button>
                ) : !isPhoneVerified ? (
                  <button onClick={() => { setPhoneToVerify(user.phone || ""); setShowPhoneVerify(true); }} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                    Verify Now
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>
                )}
              </div>

              {/* Email 2FA */}
              {/* <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Verification</p>
                    <p className="text-[11px] text-muted-foreground">
                      {user?.email ? (isEmailVerified ? `Verified: ${user.email}` : "Email not verified yet") : "No email set"}
                    </p>
                  </div>
                </div>
                {!user?.email ? (
                  <button onClick={() => setActiveTab("profile")} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                    Add Email
                  </button>
                ) : !isEmailVerified ? (
                  <button onClick={() => { setEmailToVerify(user.email || ""); setShowEmailVerify(true); }} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                    Verify Now
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>
                )}
              </div> */}

              {/* Recovery Codes */}
              {is2FAEnabled && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Key className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Recovery Codes</p>
                      <p className="text-[11px] text-muted-foreground">Backup codes for when you lose access to your authenticator</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await api.account.getRecoveryCodes();
                        setTwoFARecoveryCodes(res.recovery_codes);
                        setShowRecoveryCodes(true);
                      } catch { /* silent */ }
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View Codes
                  </button>
                </div>
              )}
            </div>

            {twoFAMessage && (
              <p className={`text-xs mt-3 ${twoFAStatus === "error" ? "text-red-500" : "text-emerald-500"}`}>{twoFAMessage}</p>
            )}
          </div>

          {/* 2FA Setup Flow (inline) */}
          {twoFASetupStep === "qr" && (
            <div className="glass border-2 border-dashed rounded-xl p-6" style={{ borderColor: "var(--accent-primary)" }}>
              <h3 className="text-lg font-semibold text-card-foreground mb-1">Step 1: Scan QR Code</h3>
              <p className="text-xs text-muted-foreground mb-4">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
              <div className="flex flex-col items-center gap-4">
                {twoFAQrCode && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={twoFAQrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg border border-border p-2 bg-white" />
                )}
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Or enter this key manually:</p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1.5 rounded-lg bg-muted text-xs font-mono text-foreground tracking-wider">{twoFASecret}</code>
                    <button onClick={() => navigator.clipboard.writeText(twoFASecret)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Copy">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { setTwoFASetupStep("idle"); setTwoFACode(""); }} className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button onClick={() => setTwoFASetupStep("verify")} className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>Next</button>
              </div>
            </div>
          )}

          {twoFASetupStep === "verify" && (
            <div className="glass border-2 border-dashed rounded-xl p-6" style={{ borderColor: "var(--accent-primary)" }}>
              <h3 className="text-lg font-semibold text-card-foreground mb-1">Step 2: Verify Code</h3>
              <p className="text-xs text-muted-foreground mb-4">Enter the 6-digit code from your authenticator app to confirm setup.</p>
              <div className="max-w-xs mx-auto space-y-3">
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-3 rounded-xl glass-input text-lg text-foreground text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={async () => {
                    setTwoFAStatus("loading");
                    try {
                      const res = await api.account.enable2FA(twoFACode);
                      setTwoFARecoveryCodes(res.recovery_codes);
                      setTwoFASetupStep("done");
                      setTwoFAStatus("success");
                      refreshUser();
                    } catch (e: unknown) {
                      setTwoFAStatus("error");
                      setTwoFAMessage(isApiError(e) ? e.message : "Invalid code. Try again.");
                      setTimeout(() => { setTwoFAStatus("idle"); setTwoFAMessage(""); }, 3000);
                    }
                  }}
                  disabled={twoFACode.length !== 6 || twoFAStatus === "loading"}
                  className="w-full px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "var(--accent-primary)" }}
                >
                  {twoFAStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify & Enable 2FA
                </button>
              </div>
              {twoFAMessage && (
                <p className={`text-xs mt-3 text-center ${twoFAStatus === "error" ? "text-red-500" : "text-emerald-500"}`}>{twoFAMessage}</p>
              )}
              <div className="flex justify-center mt-4">
                <button onClick={() => { setTwoFASetupStep("qr"); setTwoFACode(""); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Back to QR Code</button>
              </div>
            </div>
          )}

          {twoFASetupStep === "done" && (
            <div className="glass border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">2FA Enabled Successfully</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Save these recovery codes in a safe place. You will need them if you lose access to your authenticator app.</p>
              <div className="grid grid-cols-2 gap-2 p-4 rounded-lg glass-subtle mb-4">
                {twoFARecoveryCodes.map((code, i) => (
                  <code key={i} className="text-xs font-mono text-foreground">{code}</code>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(twoFARecoveryCodes.join("\n"))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy All
                </button>
                <button onClick={() => setTwoFASetupStep("idle")} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Active Sessions */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Active Sessions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Devices and browsers currently signed into your account.</p>
              </div>
              <button onClick={loadSessions} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
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
                      "p-4 rounded-lg border",
                      session.is_current
                        ? "border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mt-0.5",
                          session.is_current ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"
                        )}>
                          {session.device_type === "mobile" ? (
                            <Smartphone className={cn("w-5 h-5", session.is_current ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
                          ) : (
                            <Monitor className={cn("w-5 h-5", session.is_current ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {session.browser || session.name || "Web Session"}
                              {session.browser_version ? ` ${session.browser_version}` : ""}
                            </p>
                            {session.is_current && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">This Device</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                            {session.platform && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Monitor className="w-3 h-3" /> {session.platform}
                              </span>
                            )}
                            {session.ip_address && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Globe className="w-3 h-3" /> {session.ip_address}
                              </span>
                            )}
                            {session.location && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {session.location}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {session.is_current ? "Active now" : session.last_used_at ? `Last active: ${formatTime(session.last_used_at)}` : `Created: ${formatTime(session.created_at)}`}
                          </p>
                        </div>
                      </div>
                      {!session.is_current && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors whitespace-nowrap"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sign Out All Devices */}
          <div className="glass border border-red-200 dark:border-red-900 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Sign Out All Devices</h2>
                <p className="text-xs text-muted-foreground">This will immediately revoke all active sessions including this one. You will need to log in again.</p>
              </div>
              <button
                onClick={handleSignOutAll}
                disabled={signOutAllLoading}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
              >
                {signOutAllLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign Out All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ACTIVITY TAB                               */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Activity Log</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete history of all actions performed on your account.
                  {activityTotal > 0 && <span className="ml-1 font-medium">{activityTotal} total entries</span>}
                </p>
              </div>
              <button onClick={() => { setActivityPage(1); loadActivity(1, activityFilter); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto">
              {[
                { value: "all", label: "All Activity" },
                { value: "auth", label: "Sign-in/Out" },
                { value: "document", label: "Documents" },
                { value: "resident", label: "Residents" },
                { value: "record", label: "Records" },
                { value: "settings", label: "Settings" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setActivityFilter(f.value); setActivityPage(1); loadActivity(1, f.value); }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                    activityFilter === f.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {activityLoading && activityLogs.length === 0 ? (
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
                {activityLogs.map((log) => {
                  const getIcon = () => {
                    switch (log.category || log.action) {
                      case "auth": case "login": return <LogIn className="w-4 h-4 text-emerald-500" />;
                      case "logout": return <LogOut className="w-4 h-4 text-muted-foreground" />;
                      case "login_failed": return <AlertTriangle className="w-4 h-4 text-red-500" />;
                      case "document": return <FileText className="w-4 h-4 text-blue-500" />;
                      case "resident": return <User className="w-4 h-4 text-violet-500" />;
                      case "record": return <FileText className="w-4 h-4 text-amber-500" />;
                      case "settings": return <Key className="w-4 h-4 text-orange-500" />;
                      case "security": return <Shield className="w-4 h-4 text-red-500" />;
                      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
                    }
                  };

                  const getLabel = () => {
                    if (log.description) return log.description;
                    switch (log.action) {
                      case "login": return "Signed in";
                      case "logout": return "Signed out";
                      case "login_failed": return "Failed sign-in attempt";
                      case "password_changed": return "Password changed";
                      case "username_changed": return "Username changed";
                      case "profile_updated": return "Profile updated";
                      case "avatar_uploaded": return "Profile photo updated";
                      case "avatar_deleted": return "Profile photo removed";
                      case "document_issued": return "Document issued";
                      case "document_printed": return "Document printed";
                      case "resident_created": return "New resident registered";
                      case "resident_updated": return "Resident profile updated";
                      case "2fa_enabled": return "Two-factor authentication enabled";
                      case "2fa_disabled": return "Two-factor authentication disabled";
                      case "session_revoked": return "Session revoked";
                      case "preferences_updated": return "Preferences updated";
                      default: return log.action.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                    }
                  };

                  return (
                    <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          {getIcon()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{getLabel()}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{log.browser || "Unknown"} on {log.device_type || "Unknown"}</span>
                            <span>&middot;</span>
                            <span>{log.ip_address}</span>
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <>
                                <span>&middot;</span>
                                <span className="text-muted-foreground/60">
                                  {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-3">{formatTime(log.created_at)}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load more */}
            {activityHasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => { const next = activityPage + 1; setActivityPage(next); loadActivity(next, activityFilter); }}
                  disabled={activityLoading}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {activityLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MABINI AI HISTORY TAB                      */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "mabini" && (
        <div className="space-y-6">
          {/* Credit Summary Card */}
          {aiCredits && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <MabiniIcon size={48} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-card-foreground">Mabini AI Usage</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Track your AI conversation history and credit usage</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Coins className="w-3.5 h-3.5" />
                        Balance
                      </div>
                      <p className="text-lg font-bold text-foreground">P{aiCredits.balance.toFixed(2)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Conversations
                      </div>
                      <p className="text-lg font-bold text-foreground">{aiCredits.conversation_count}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        Your Usage
                      </div>
                      <p className="text-lg font-bold text-foreground">P{aiCredits.total_used_by_user.toFixed(2)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Hash className="w-3.5 h-3.5" />
                        Est. Remaining
                      </div>
                      <p className="text-lg font-bold text-foreground">~{aiCredits.estimated_messages_remaining.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation History */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-card-foreground">Conversation History</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">All your Mabini AI sessions with full chat logs and cost breakdown</p>
            </div>

            {aiLoading && aiConversations.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : aiConversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-2 opacity-50"><MabiniIcon size={32} /></div>
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start chatting with Mabini in the Mabini AI page</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {aiConversations.map((conv) => (
                  <div key={conv.id}>
                    {/* Conversation Row */}
                    <button
                      onClick={() => loadConversationDetail(conv.id)}
                      className="w-full flex items-center gap-3 px-6 py-3.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <MabiniIcon size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{conv.title || "Untitled"}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(conv.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conv.message_count} msgs
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            P{parseFloat(conv.credit_cost).toFixed(4)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {conv.tokens_used.toLocaleString()} tokens
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {expandedConv === conv.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Chat History */}
                    {expandedConv === conv.id && (
                      <div className="bg-muted/30 border-t border-border px-6 py-4">
                        {expandedLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : expandedMessages ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {expandedMessages.messages.map((msg, i) => (
                              <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                                {msg.role === "assistant" && (
                                  <MabiniIcon size={24} />
                                )}
                                <div className={cn(
                                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                  msg.role === "user"
                                    ? "bg-[var(--accent-primary)] text-white"
                                    : "glass-subtle"
                                )}>
                                  {msg.role === "assistant" ? (
                                    <Markdown content={msg.content} className="text-xs text-justify" />
                                  ) : (
                                    <p className="text-sm text-justify">{msg.content}</p>
                                  )}
                                  <p className={cn("text-[10px] mt-1", msg.role === "user" ? "text-white/60" : "text-muted-foreground")}>
                                    {new Date(msg.timestamp).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
                                  </p>
                                </div>
                                {msg.role === "user" && (
                                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: "var(--accent-bg)", color: "var(--accent-primary)" }}>
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                  </div>
                                )}
                              </div>
                            ))}
                            {/* Session Summary */}
                            <div className="flex items-center gap-4 pt-2 mt-2 border-t border-border text-[11px] text-muted-foreground">
                              <span>Input: {expandedMessages.input_tokens_used.toLocaleString()} tokens</span>
                              <span>Output: {expandedMessages.output_tokens_used.toLocaleString()} tokens</span>
                              <span>Total Cost: P{parseFloat(expandedMessages.credit_cost).toFixed(4)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Failed to load conversation</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {aiPage < aiLastPage && (
              <div className="px-6 py-3 border-t border-border">
                <button
                  onClick={() => loadAiHistory(aiPage + 1)}
                  disabled={aiLoading}
                  className="w-full text-sm text-center py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Load more conversations"}
                </button>
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
          {/* <div className="glass rounded-xl p-6">
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
                <NotificationToggle
                  key={item.key}
                  label={item.label}
                  desc={item.desc}
                  defaultChecked={(user?.preferences as Record<string, unknown>)?.[item.key] as boolean ?? item.defaultOn}
                  onChange={(v) => handleSaveNotificationPreference(item.key, v)}
                />
              ))}
            </div>
          </div> */}

          {/* SMS Notifications */}
          <div className="glass rounded-xl p-6">
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
                <NotificationToggle
                  key={item.key}
                  label={item.label}
                  desc={item.desc}
                  defaultChecked={(user?.preferences as Record<string, unknown>)?.[item.key] as boolean ?? item.defaultOn}
                  onChange={(v) => handleSaveNotificationPreference(item.key, v)}
                />
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
          <div className="glass rounded-xl p-6">
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
                <NotificationToggle
                  key={item.key}
                  label={item.label}
                  desc={item.desc}
                  defaultChecked={(user?.preferences as Record<string, unknown>)?.[item.key] as boolean ?? item.defaultOn}
                  onChange={(v) => handleSaveNotificationPreference(item.key, v)}
                />
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <BellOff className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">Quiet Hours</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Silence non-urgent notifications during specific hours.</p>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">From</label>
                  <input
                    type="time"
                    defaultValue={(user?.preferences as Record<string, unknown>)?.quiet_hours_start as string ?? "22:00"}
                    onChange={(e) => handleSaveNotificationPreference("quiet_hours_start", e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl glass-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent"
                  />
                </div>
                <span className="text-muted-foreground mt-5">-</span>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">To</label>
                  <input
                    type="time"
                    defaultValue={(user?.preferences as Record<string, unknown>)?.quiet_hours_end as string ?? "06:00"}
                    onChange={(e) => handleSaveNotificationPreference("quiet_hours_end", e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl glass-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent"
                  />
                </div>
              </div>
              <NotificationToggleSmall
                defaultChecked={(user?.preferences as Record<string, unknown>)?.quiet_hours_enabled as boolean ?? false}
                onChange={(v) => handleSaveNotificationPreference("quiet_hours_enabled", v)}
              />
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
          <div className="glass rounded-xl p-6">
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
          <div className="glass rounded-xl p-6">
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
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">Download Your Data</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Under RA 10173 Section 18, you have the right to access your personal information.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDataExport}
                disabled={exportStatus === "loading"}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                style={{ background: exportStatus === "success" ? "#059669" : "var(--accent-primary)" }}
              >
                {exportStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                {exportStatus === "success" && <Check className="w-4 h-4" />}
                {exportStatus === "success" ? "Downloaded" : exportStatus === "loading" ? "Exporting..." : "Download My Data"}
              </button>
              <p className="text-[11px] text-muted-foreground">JSON file with all your personal data.</p>
            </div>
          </div>

          {/* Data Retention */}
          <div className="glass rounded-xl p-6">
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

          {/* Consent & Agreements */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-card-foreground">Consent & Agreements</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Legal agreements and consent you have provided.</p>
            <div className="space-y-3">
              {[
                { label: "Terms of Service", desc: "Agreement to use kapitan.ph platform", accepted: true, date: user?.created_at },
                { label: "Privacy Policy", desc: "How we collect, use, and protect your data", accepted: true, date: user?.created_at },
                { label: "Data Processing Agreement", desc: "Consent for processing personal information under RA 10173", accepted: true, date: user?.created_at },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                      <Check className="w-3 h-3" /> Accepted
                    </span>
                    {item.date && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(item.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Account */}
          <div className="glass border border-red-200 dark:border-red-900 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Request Account Deletion</h2>
                <p className="text-xs text-muted-foreground mb-1">
                  Under RA 10173 Section 18(f), you have the right to erasure of personal data. This request is reviewed by your barangay administrator and processed within 10 business days.
                </p>
                <p className="text-[11px] text-muted-foreground/70 mb-3">
                  Note: Official government records (barangay certificates, clearances, etc.) you have issued are permanent and cannot be deleted as required by law. Only your personal account data will be removed.
                </p>
                {(prefs.deletion_requested) ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">Deletion request submitted. Under review by your barangay administrator.</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deletionStatus === "loading"}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deletionStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                    Request Account Deletion
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* PHONE VERIFICATION MODAL                   */}
      {/* ═══════════════════════════════════════════ */}
      {showPhoneVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPhoneVerify(false)}>
          <div className="glass rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-card-foreground mb-1">Verify Phone Number</h3>
            <p className="text-xs text-muted-foreground mb-4">
              We will send a 6-digit verification code to <span className="font-medium text-foreground">{phoneToVerify}</span>
            </p>

            {!otpSent ? (
              <button
                onClick={handleSendPhoneOtp}
                disabled={phoneVerifyStatus === "loading"}
                className="w-full px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--accent-primary)" }}
              >
                {phoneVerifyStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Verification Code
              </button>
            ) : (
              <div className="space-y-3">
                {/* Expiry timer */}
                {phoneOtpExpiry > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg glass-subtle">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className={`text-xs font-mono font-medium ${phoneOtpExpiry <= 60 ? "text-red-500" : "text-muted-foreground"}`}>
                      Code expires in {formatCountdown(phoneOtpExpiry)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-500">Code expired. Please resend.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Enter 6-digit code</label>
                  <input
                    type="text"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-3 py-2 rounded-xl glass-input text-sm text-foreground text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleVerifyPhone}
                  disabled={phoneVerifyStatus === "loading" || phoneOtp.length !== 6 || phoneOtpExpiry <= 0}
                  className="w-full px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: phoneVerifyStatus === "success" ? "#059669" : "var(--accent-primary)" }}
                >
                  {phoneVerifyStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {phoneVerifyStatus === "success" && <Check className="w-4 h-4" />}
                  {phoneVerifyStatus === "success" ? "Verified" : "Verify"}
                </button>
                <button
                  onClick={handleSendPhoneOtp}
                  disabled={otpCooldown > 0 || phoneVerifyStatus === "loading"}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : "Resend code"}
                </button>
              </div>
            )}

            {phoneVerifyMessage && (
              <p className={`text-xs mt-3 ${phoneVerifyStatus === "error" ? "text-red-500" : phoneVerifyStatus === "success" ? "text-emerald-500" : "text-muted-foreground"}`}>
                {phoneVerifyMessage}
              </p>
            )}

            <button
              onClick={() => { setShowPhoneVerify(false); setOtpSent(false); setPhoneOtp(""); setPhoneVerifyMessage(""); setPhoneOtpExpiry(0); }}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* EMAIL VERIFICATION MODAL                    */}
      {/* ═══════════════════════════════════════════ */}
      {showEmailVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEmailVerify(false)}>
          <div className="glass rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-card-foreground mb-1">Verify Email Address</h3>
            <p className="text-xs text-muted-foreground mb-4">
              We will send a 6-digit verification code to <span className="font-medium text-foreground">{emailToVerify}</span>
            </p>

            {!emailOtpSent ? (
              <button
                onClick={handleSendEmailOtp}
                disabled={emailVerifyStatus === "loading"}
                className="w-full px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--accent-primary)" }}
              >
                {emailVerifyStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Verification Code
              </button>
            ) : (
              <div className="space-y-3">
                {/* Expiry timer */}
                {emailOtpExpiry > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg glass-subtle">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className={`text-xs font-mono font-medium ${emailOtpExpiry <= 60 ? "text-red-500" : "text-muted-foreground"}`}>
                      Code expires in {formatCountdown(emailOtpExpiry)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-500">Code expired. Please resend.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Enter 6-digit code</label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-3 py-2 rounded-xl glass-input text-sm text-foreground text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleVerifyEmail}
                  disabled={emailVerifyStatus === "loading" || emailOtp.length !== 6 || emailOtpExpiry <= 0}
                  className="w-full px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: emailVerifyStatus === "success" ? "#059669" : "var(--accent-primary)" }}
                >
                  {emailVerifyStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {emailVerifyStatus === "success" && <Check className="w-4 h-4" />}
                  {emailVerifyStatus === "success" ? "Verified" : "Verify"}
                </button>
                <button
                  onClick={handleSendEmailOtp}
                  disabled={emailOtpCooldown > 0 || emailVerifyStatus === "loading"}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {emailOtpCooldown > 0 ? `Resend code in ${emailOtpCooldown}s` : "Resend code"}
                </button>
              </div>
            )}

            {emailVerifyMessage && (
              <p className={`text-xs mt-3 ${emailVerifyStatus === "error" ? "text-red-500" : emailVerifyStatus === "success" ? "text-emerald-500" : "text-muted-foreground"}`}>
                {emailVerifyMessage}
              </p>
            )}

            <button
              onClick={() => { setShowEmailVerify(false); setEmailOtpSent(false); setEmailOtp(""); setEmailVerifyMessage(""); setEmailOtpExpiry(0); }}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* DISABLE 2FA MODAL                           */}
      {/* ═══════════════════════════════════════════ */}
      {showDisable2FA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDisable2FA(false)}>
          <div className="glass rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Disable Two-Factor Authentication</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter your password to confirm. This will remove the extra security layer from your account.
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={disable2FAPassword}
                onChange={(e) => setDisable2FAPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 rounded-xl glass-input text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={async () => {
                  if (!disable2FAPassword) return;
                  setTwoFAStatus("loading");
                  try {
                    await api.account.disable2FA(disable2FAPassword);
                    setShowDisable2FA(false);
                    setDisable2FAPassword("");
                    setTwoFAStatus("idle");
                    refreshUser();
                  } catch (e: unknown) {
                    setTwoFAStatus("error");
                    setTwoFAMessage(isApiError(e) ? e.message : "Wrong password.");
                    setTimeout(() => { setTwoFAStatus("idle"); setTwoFAMessage(""); }, 3000);
                  }
                }}
                disabled={!disable2FAPassword || twoFAStatus === "loading"}
                className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {twoFAStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                Disable 2FA
              </button>
            </div>
            {twoFAMessage && (
              <p className="text-xs mt-3 text-red-500">{twoFAMessage}</p>
            )}
            <button onClick={() => { setShowDisable2FA(false); setDisable2FAPassword(""); }} className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* RECOVERY CODES MODAL                        */}
      {/* ═══════════════════════════════════════════ */}
      {showRecoveryCodes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRecoveryCodes(false)}>
          <div className="glass rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-card-foreground mb-1">Recovery Codes</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Store these codes securely. Each code can only be used once. If you lose access to your authenticator, use a recovery code to sign in.
            </p>
            <div className="grid grid-cols-2 gap-2 p-4 rounded-lg glass-subtle mb-4">
              {twoFARecoveryCodes.map((code, i) => (
                <code key={i} className="text-xs font-mono text-foreground">{code}</code>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(twoFARecoveryCodes.join("\n"))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy All
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await api.account.regenerateRecoveryCodes();
                    setTwoFARecoveryCodes(res.recovery_codes);
                  } catch { /* silent */ }
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
              <button onClick={() => setShowRecoveryCodes(false)} className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* DELETE CONFIRM MODAL                        */}
      {/* ═══════════════════════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="glass border border-red-200 dark:border-red-900 rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Confirm Deletion Request</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Are you sure you want to request account deletion? This will be sent to your barangay administrator for review and processed within 10 business days. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeletionStatus("loading");
                  try {
                    await api.account.requestDeletion();
                    await api.account.updatePreferences({ deletion_requested: true });
                    refreshUser();
                    setShowDeleteConfirm(false);
                    setDeletionStatus("success");
                  } catch {
                    setDeletionStatus("error");
                    setTimeout(() => setDeletionStatus("idle"), 3000);
                  }
                }}
                disabled={deletionStatus === "loading"}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletionStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Request Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable notification toggle component ──

function NotificationToggle({ label, desc, defaultChecked, onChange }: {
  label: string;
  desc: string;
  defaultChecked: boolean;
  onChange: (value: boolean) => void;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-start justify-between py-1">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => { setChecked(e.target.checked); onChange(e.target.checked); }}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-[var(--accent-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
      </label>
      <MabiniButton pageContext="You are on the Account Settings page. This page allows barangay staff to update their profile, password, and system preferences." />
    </div>
  );
}

function NotificationToggleSmall({ defaultChecked, onChange }: {
  defaultChecked: boolean;
  onChange: (value: boolean) => void;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label className="relative inline-flex items-center cursor-pointer mt-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { setChecked(e.target.checked); onChange(e.target.checked); }}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-[var(--accent-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
    </label>
  );
}
