"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
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
} from "lucide-react";

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

// ── Login Page ──────────────────────────────────────────────────

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const browser = detectBrowser(ua);
    const os = detectOS(ua);
    const isSecure = window.location.protocol === "https:";

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

    // Fetch IP then set everything at once (setState only in async callback)
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((data) => {
        setSecurityInfo({ ...baseInfo, ip: data.ip });
      })
      .catch(() => {
        setSecurityInfo({ ...baseInfo, ip: "Protected" });
      });
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Dark immersive branding */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060a16] via-[#0c1230] to-[#0a0e20]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Accent glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-cyan-500/6 rounded-full blur-[100px]" />

        {/* Floating cards — left column */}
        <div className="absolute top-[10%] right-[52%] w-[185px] p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.07] -rotate-2 transition-transform hover:rotate-0 hover:bg-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">Resident Management</span>
          </div>
          <p className="text-white/30 text-[11px] leading-relaxed">Register and track all residents with biometric data</p>
        </div>

        <div className="absolute top-[28%] right-[48%] w-[185px] p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.07] rotate-1 transition-transform hover:rotate-0 hover:bg-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">Smart Documents</span>
          </div>
          <p className="text-white/30 text-[11px] leading-relaxed">Generate clearances and certificates in seconds</p>
        </div>

        <div className="absolute top-[46%] right-[52%] w-[185px] p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.07] -rotate-1 transition-transform hover:rotate-0 hover:bg-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">AI-Powered</span>
          </div>
          <p className="text-white/30 text-[11px] leading-relaxed">Built-in AI assistant for data queries and reports</p>
        </div>

        {/* Floating cards — right column */}
        <div className="absolute top-[16%] right-[6%] w-[185px] p-3.5 rounded-2xl bg-gradient-to-br from-violet-500/[0.07] to-white/[0.02] backdrop-blur-sm border border-violet-400/[0.10] rotate-2 transition-transform hover:rotate-0 hover:from-violet-500/[0.10]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">Blockchain Verified</span>
          </div>
          <p className="text-white/30 text-[11px] leading-relaxed">1st blockchain barangay system — tamper-proof records</p>
        </div>

        <div className="absolute top-[34%] right-[3%] w-[185px] p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.07] -rotate-1 transition-transform hover:rotate-0 hover:bg-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">SMS Messaging</span>
          </div>
          <p className="text-white/30 text-[11px] leading-relaxed">Blast announcements and alerts to all residents via SMS</p>
        </div>

        <div className="absolute top-[52%] right-[6%] w-[185px] p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.07] rotate-1 transition-transform hover:rotate-0 hover:bg-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">Call System</span>
          </div>
          <p className="text-white/30 text-[11px] leading-relaxed">Direct call residents for urgent notifications and follow-ups</p>
        </div>

        {/* Decorative dots */}
        <div className="absolute top-[8%] left-[42%] w-1.5 h-1.5 rounded-full bg-blue-400/30" />
        <div className="absolute top-[22%] left-[38%] w-1 h-1 rounded-full bg-cyan-400/20" />
        <div className="absolute top-[62%] left-[12%] w-2 h-2 rounded-full bg-violet-400/15" />
        <div className="absolute top-[68%] left-[45%] w-1.5 h-1.5 rounded-full bg-emerald-400/20" />
        <div className="absolute bottom-[18%] left-[25%] w-1 h-1 rounded-full bg-rose-400/20" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
              K
            </div>
            <span className="text-white text-xl font-semibold tracking-tight">
              kapitan<span className="text-blue-400">.ph</span>
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-[3.5rem] font-bold leading-[1.05] text-white mb-5">
            Barangay
            <br />
            management,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              simplified.
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-[400px] mb-14">
            Residents, documents, judicial records, finances, and
            community services — unified in one intelligent platform.
          </p>

          {/* Stats row */}
          <div className="flex gap-10">
            <div>
              <p className="text-3xl font-bold text-white">1,200+</p>
              <p className="text-gray-500 text-sm mt-1">Barangays Served</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-gray-500 text-sm mt-1">Documents Generated</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-white">99.9%</p>
              <p className="text-gray-500 text-sm mt-1">Uptime</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-sm text-gray-600">
          <span>Copyright @ 2015-2026 All Rights Reserved</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            All systems operational
          </span>
        </div>
      </div>

      {/* Right Panel — Login Form + Security Intelligence */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background relative">
        {/* Staging indicator */}
        {process.env.NODE_ENV !== "production" && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-white text-[11px] font-bold rounded tracking-wide">
            STAGING
          </div>
        )}

        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
              K
            </div>
            <span className="text-xl font-semibold text-foreground">
              kapitan<span className="text-blue-600">.ph</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1.5">Sign in to your barangay dashboard</p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/dashboard";
            }}
            className="space-y-4"
          >
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
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 shadow-lg shadow-blue-600/20 active:scale-[0.99]"
            >
              Sign in
            </button>
          </form>

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
                {/* Row 1: Connection + Encryption */}
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

                {/* Row 2: Browser + OS */}
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

                {/* Row 3: IP + Fingerprint */}
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

                {/* Row 4: Timezone + Session Time */}
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
                <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                  {[
                    { label: "RA 10173 Compliant", active: true },
                    { label: "2FA Ready", active: true },
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

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-background text-muted-foreground">New barangay?</span>
            </div>
          </div>

          {/* Request Access */}
          <button
            type="button"
            className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-all active:scale-[0.99]"
          >
            Request access for your barangay
          </button>

          {/* Support */}
          <p className="text-center text-sm text-muted-foreground mt-5">
            Need help?{" "}
            <button type="button" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Contact PrimeX Support
            </button>
          </p>

          {/* Copyright */}
          <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
            Developed and Maintained by PrimeX Ventures Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
