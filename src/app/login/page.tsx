"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Users,
  FileText,
  Shield,
  Bot,
  MapPin,
  BarChart3,
  Link2,
  MessageSquare,
  Phone,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Dark immersive branding */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden flex-col justify-between p-12">
        {/* Base gradient — multi-tone, not just blue */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#080c1a] via-[#0f1535] to-[#0d1025]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Accent glows — multiple colors */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[80px]" />

        {/* Floating feature cards — 2 columns, staggered */}
        {/* Left column */}
        <div className="absolute top-[10%] right-[52%] w-[185px] p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] -rotate-2">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">Resident Management</span>
          </div>
          <p className="text-white/35 text-[11px] leading-relaxed">Register and track all residents with biometric data</p>
        </div>

        <div className="absolute top-[28%] right-[48%] w-[185px] p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rotate-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">Smart Documents</span>
          </div>
          <p className="text-white/35 text-[11px] leading-relaxed">Generate clearances and certificates in seconds</p>
        </div>

        <div className="absolute top-[46%] right-[52%] w-[185px] p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] -rotate-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">AI-Powered</span>
          </div>
          <p className="text-white/35 text-[11px] leading-relaxed">Built-in AI assistant for data queries and reports</p>
        </div>

        {/* Right column */}
        <div className="absolute top-[16%] right-[6%] w-[185px] p-3.5 rounded-2xl bg-gradient-to-br from-violet-500/[0.08] to-white/[0.03] backdrop-blur-sm border border-violet-400/[0.12] rotate-2">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">Blockchain Verified</span>
          </div>
          <p className="text-white/35 text-[11px] leading-relaxed">1st blockchain barangay system — tamper-proof records</p>
        </div>

        <div className="absolute top-[34%] right-[3%] w-[185px] p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] -rotate-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">SMS Messaging</span>
          </div>
          <p className="text-white/35 text-[11px] leading-relaxed">Blast announcements and alerts to all residents via SMS</p>
        </div>

        <div className="absolute top-[52%] right-[6%] w-[185px] p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rotate-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <span className="text-white/90 text-xs font-semibold">Call System</span>
          </div>
          <p className="text-white/35 text-[11px] leading-relaxed">Direct call residents for urgent notifications and follow-ups</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[8%] left-[42%] w-1.5 h-1.5 rounded-full bg-blue-400/40" />
        <div className="absolute top-[22%] left-[38%] w-1 h-1 rounded-full bg-cyan-400/30" />
        <div className="absolute top-[62%] left-[12%] w-2 h-2 rounded-full bg-violet-400/20" />
        <div className="absolute top-[68%] left-[45%] w-1.5 h-1.5 rounded-full bg-emerald-400/30" />
        <div className="absolute bottom-[18%] left-[25%] w-1 h-1 rounded-full bg-rose-400/30" />
        <div className="absolute top-[42%] left-[40%] w-1 h-1 rounded-full bg-amber-400/25" />
        {/* Connecting lines between cards (subtle) */}
        <div className="absolute top-[24%] right-[40%] w-[60px] h-px bg-gradient-to-r from-white/[0.03] to-transparent rotate-12" />
        <div className="absolute top-[40%] right-[38%] w-[50px] h-px bg-gradient-to-r from-transparent to-white/[0.03] -rotate-6" />

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

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background relative">
        {/* V5 Badge */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-[11px] font-bold rounded tracking-wide">
          V5 MOCKUP
        </div>

        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
              K
            </div>
            <span className="text-xl font-semibold text-foreground">
              kapitan<span className="text-blue-600">.ph</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to your barangay dashboard</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/dashboard";
            }}
          >
            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 shadow-lg shadow-blue-600/25"
            >
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
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
            className="w-full py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Request access for your barangay
          </button>

          {/* Support */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Need help?{" "}
            <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact PrimeX Support
            </button>
          </p>

          {/* Copyright */}
          <p className="text-center text-[11px] text-muted-foreground/60 mt-8">
            Developed and Maintained by PrimeX Ventures Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
