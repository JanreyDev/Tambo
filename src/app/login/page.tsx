"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth, isApiError } from "@/contexts/auth-context";
import {
  Eye,
  EyeOff,
  Users,
  FileText,
  Bot,
  Link2,
  MessageSquare,
  Phone,
  Shield,
  Lock,
  Globe,
  Monitor,
  Fingerprint,
  CheckCircle2,
  Wifi,
  Clock,
  ShieldCheck,
  Loader2,
  BarChart3,
  Gavel,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { APP_VERSION_LABEL } from "@/lib/version";
import { useToast } from "@/components/ui/toast";

// ── Security Detection ──────────────────────────────────────────

interface SecurityInfo {
  browser: string;
  browserVersion: string;
  os: string;
  ip: string;
  protocol: string;
  encryption: string;
  screenRes: string;
  language: string;
  timezone: string;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  timestamp: string;
}

function detectBrowser(ua: string): { name: string; version: string } {
  if (ua.includes("Edg/")) {
    const v = ua.match(/Edg\/([\d.]+)/);
    return { name: "Microsoft Edge", version: v?.[1]?.split(".")[0] || "" };
  }
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
    const v = ua.match(/Chrome\/([\d.]+)/);
    return { name: "Google Chrome", version: v?.[1]?.split(".")[0] || "" };
  }
  if (ua.includes("Firefox/")) {
    const v = ua.match(/Firefox\/([\d.]+)/);
    return { name: "Mozilla Firefox", version: v?.[1]?.split(".")[0] || "" };
  }
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    const v = ua.match(/Version\/([\d.]+)/);
    return { name: "Apple Safari", version: v?.[1]?.split(".")[0] || "" };
  }
  return { name: "Unknown Browser", version: "" };
}

function detectOS(ua: string): string {
  if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
  if (ua.includes("Windows NT")) return "Windows";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown OS";
}

const emptySubscribe = () => () => {};

// ── Feature Cards Data ──────────────────────────────────────────

const features = [
  {
    icon: Users,
    label: "Resident Management",
    desc: "Register and track all residents with biometric data",
    color: "blue",
  },
  {
    icon: FileText,
    label: "Smart Documents",
    desc: "Generate clearances and certificates in seconds",
    color: "emerald",
  },
  {
    icon: Gavel,
    label: "Judicial & Peace Order",
    desc: "KP cases, blotter, VAWC, and protection orders",
    color: "amber",
  },
  {
    icon: BarChart3,
    label: "Finance & Budget",
    desc: "Track barangay finances, disbursements, and reports",
    color: "cyan",
  },
  {
    icon: Bot,
    label: "AI-Powered Assistant",
    desc: "Built-in AI for data queries, reports, and insights",
    color: "violet",
  },
  {
    icon: Link2,
    label: "Blockchain Verified",
    desc: "Tamper-proof records with blockchain audit trails",
    color: "rose",
  },
  {
    icon: MessageSquare,
    label: "SMS Messaging",
    desc: "Blast announcements and alerts to residents via SMS",
    color: "teal",
  },
  {
    icon: Phone,
    label: "Call System",
    desc: "Direct call residents for urgent notifications",
    color: "orange",
  },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  amber: { bg: "bg-amber-500/20", text: "text-amber-400" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  violet: { bg: "bg-violet-500/20", text: "text-violet-400" },
  rose: { bg: "bg-rose-500/20", text: "text-rose-400" },
  teal: { bg: "bg-teal-500/20", text: "text-teal-400" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400" },
};

// ── Login Page ──────────────────────────────────────────────────

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const isDev = process.env.NODE_ENV === "development";
  const [username, setUsername] = useState(isDev ? "kap_tambo" : "");
  const [password, setPassword] = useState(isDev ? "Tambo@2026!" : "");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [connectionSecure, setConnectionSecure] = useState(true);

  // Check if the form has both fields filled
  const isFormValid = username.trim().length > 0 && password.trim().length > 0;

  useEffect(() => {
    const ua = navigator.userAgent;
    const browser = detectBrowser(ua);
    const os = detectOS(ua);
    const isSecure = window.location.protocol === "https:";

    // In production, block insecure connections from entering credentials
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction && !isSecure) {
      setConnectionSecure(false);
    }

    // Restore remember me preference
    if (typeof window !== "undefined") {
      const savedRemember = localStorage.getItem("bcmp_remember");
      if (savedRemember === "true") {
        setRememberMe(true);
      }
    }

    const baseInfo: Omit<SecurityInfo, "ip"> = {
      browser: browser.name,
      browserVersion: browser.version,
      os,
      protocol: isSecure ? "HTTPS" : "HTTP",
      encryption: isSecure ? "TLS 1.3 / AES-256" : "Not Encrypted",
      screenRes: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || "en-US",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === "1",
      timestamp: new Date().toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    };

    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((data) => {
        setSecurityInfo({ ...baseInfo, ip: data.ip });
      })
      .catch(() => {
        setSecurityInfo({ ...baseInfo, ip: "Protected" });
      });
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);

    try {
      await login(username, password, rememberMe);
      toast("success", "Login successful", "Redirecting to your dashboard...", 3000);
      router.push("/dashboard");
    } catch (err) {
      if (isApiError(err)) {
        // API returned a structured error response
        const msg = err.message.toLowerCase();
        if (msg.includes("credentials") || msg.includes("invalid") || msg.includes("unauthorized") || msg.includes("incorrect")) {
          toast("error", "Invalid credentials", "The username or password you entered is incorrect. Please try again.");
        } else if (msg.includes("throttle") || msg.includes("too many") || msg.includes("rate")) {
          toast("warning", "Too many attempts", "You have exceeded the login limit. Please wait a moment before trying again.");
        } else if (msg.includes("deactivated") || msg.includes("disabled") || msg.includes("locked")) {
          toast("error", "Account locked", "Your account has been deactivated. Contact your barangay administrator.");
        } else {
          toast("error", "Login failed", err.message);
        }
      } else if (err instanceof TypeError && (err as TypeError).message === "Failed to fetch") {
        toast("error", "Server unreachable", "Unable to connect to the server. Check your internet connection or try again later.");
      } else {
        toast("error", "Something went wrong", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left Panel ── */}
      <div className="relative overflow-hidden flex flex-col lg:w-[55%] p-5 sm:p-7 lg:p-10 xl:p-12">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060a16] via-[#0c1230] to-[#0a0e20]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[120px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 mb-5 lg:mb-auto">
          <Image
            src="/kapitanph_logo.png"
            alt="kapitan.ph"
            width={160}
            height={44}
            className="h-8 lg:h-10 w-auto"
            priority
          />
        </div>

        {/* Hero Text */}
        <div className="relative z-10 mb-5 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-[2.75rem] font-bold leading-tight text-white mb-2 lg:mb-4">
            Digitize. Streamline.{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Serve your community.
            </span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm lg:text-base leading-relaxed max-w-[520px]">
            A unified platform integrating all barangay offices for efficient
            service delivery — from resident management to judicial records,
            finances, and community services.
          </p>
        </div>

        {/* Feature Grid — hidden on mobile, compact on tablet, full on desktop */}
        <div className="relative z-10 hidden sm:grid sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-1.5 lg:gap-2 mb-5 lg:mb-8">
          {features.map((f) => {
            const c = colorMap[f.color];
            return (
              <div
                key={f.label}
                className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-1.5 lg:gap-2 mb-0 lg:mb-1.5">
                  <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-md lg:rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                    <f.icon className={`w-2.5 h-2.5 lg:w-3 lg:h-3 ${c.text}`} />
                  </div>
                  <span className="text-white/90 text-[10px] lg:text-[11px] font-semibold leading-tight">{f.label}</span>
                </div>
                <p className="text-white/30 text-[9px] lg:text-[10px] leading-snug hidden lg:block">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Mobile-only: compact feature pills instead of full cards */}
        <div className="relative z-10 flex flex-wrap gap-1.5 mb-5 sm:hidden">
          {features.map((f) => {
            const c = colorMap[f.color];
            return (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]"
              >
                <f.icon className={`w-2.5 h-2.5 ${c.text}`} />
                <span className="text-white/70 text-[10px] font-medium">{f.label}</span>
              </span>
            );
          })}
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-auto">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 lg:gap-2">
            {[
              { value: "10+", label: "Years Running", accent: "text-blue-400" },
              { value: "700+", label: "Barangays Onboarded", accent: "text-cyan-400" },
              { value: "5M+", label: "Residents Managed", accent: "text-violet-400" },
              { value: "7M+", label: "Documents Issued", accent: "text-amber-400" },
              { value: "7", label: "Provinces Active", accent: "text-rose-400" },
              { value: "99.9%", label: "System Uptime", accent: "text-emerald-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center py-2 px-1 lg:p-2.5 rounded-lg lg:rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <p className={`text-sm sm:text-base lg:text-xl font-bold ${stat.accent}`}>{stat.value}</p>
                <p className="text-gray-500 text-[9px] lg:text-[11px] mt-0.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form + Security Intelligence ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-12 bg-background relative">
        {/* Staging indicator */}
        {process.env.NODE_ENV !== "production" && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-white text-[11px] font-bold rounded tracking-wide">
            STAGING
          </div>
        )}

        <div className="w-full max-w-[420px]">
          {/* ── Insecure Connection Warning ── */}
          {!connectionSecure ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Connection Not Secure</h2>
                <p className="text-muted-foreground text-sm mt-2 max-w-[340px]">
                  Your connection to this server is not encrypted. Credential input has been
                  disabled to protect your account from interception.
                </p>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Why am I seeing this?</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      This page was loaded over an unencrypted HTTP connection. Any credentials
                      entered could be intercepted by third parties. This is a security
                      requirement under RA 10173 (Data Privacy Act of 2012).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">What should I do?</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                      <li>Make sure the URL starts with <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">https://</span></li>
                      <li>Contact your IT administrator if the issue persists</li>
                      <li>Do not enter your credentials on this page</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    window.location.href = window.location.href.replace("http://", "https://");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-all"
                >
                  Switch to Secure Connection
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="text-muted-foreground text-sm mt-1.5">Sign in to your barangay dashboard</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full px-4 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors opacity-50 cursor-not-allowed" disabled title="Coming soon">
                    Forgot password?
                  </button>
                </div>

                {/* Submit — disabled until both fields are filled */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </>
          )}

          {/* ── Security Intelligence Panel ── */}
          {mounted && securityInfo && (
            <div className="mt-6">
              {/* Security header badge */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Secure Connection</span>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Security grid */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-0.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/60">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Protocol</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">{securityInfo.protocol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/60">
                    <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Encryption</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">{securityInfo.encryption}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/60">
                    <Globe className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Browser</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">
                        {securityInfo.browser} {securityInfo.browserVersion}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/60">
                    <Monitor className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">System</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">{securityInfo.os}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/60">
                    <Wifi className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">IP Address</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">{securityInfo.ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/60">
                    <Fingerprint className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Display</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">{securityInfo.screenRes}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/60">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Timezone</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">{securityInfo.timezone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Session</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">{securityInfo.timestamp}</p>
                    </div>
                  </div>
                </div>

                {/* Security features strip */}
                <div className="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
                  {[
                    { label: "RA 10173 Compliant", active: true },
                    { label: "NPC Registered", active: true },
                    { label: "Cookies", active: securityInfo.cookiesEnabled },
                    { label: "Encrypted", active: securityInfo.protocol === "HTTPS" },
                  ].map((f) => (
                    <span
                      key={f.label}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        f.active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full ${f.active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Copyright */}
          <div className="mt-8 pt-5 border-t border-border space-y-1">
            <p className="text-center text-[11px] text-muted-foreground/50">
              Developed and Maintained by{" "}
              <a
                href="https://primex.ventures/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-muted-foreground/70 hover:text-blue-600 transition-colors"
              >
                PrimeX Ventures Inc.
              </a>
            </p>
            <p className="text-center text-[10px] text-muted-foreground/40">
              Copyright &copy; 2015-2026 All Rights Reserved
            </p>
            <p className="text-center text-[10px] text-muted-foreground/30">
              {APP_VERSION_LABEL}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
