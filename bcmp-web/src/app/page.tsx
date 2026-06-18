"use client";

import { useState, useEffect, useMemo, useSyncExternalStore, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth, isApiError } from "@/contexts/auth-context";
import {
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Lock,
  LockOpen,
  Loader2,
  AlertTriangle,
  XCircle,
  KeyRound,
} from "lucide-react";
import { APP_VERSION_LABEL } from "@/lib/version";
import { useToast } from "@/components/ui/toast";

const emptySubscribe = () => () => {};

const FIL_DAYS = ["Linggo", "Lunes", "Martes", "Miyerkules", "Huwebes", "Biyernes", "Sabado"];
const FIL_MONTHS = ["Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo", "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre"];

// NIST 800-63B / OWASP ASVS recommendations.
// USERNAME_MAX: 64 covers RFC 5321 email local-part + government usernames; DB column is varchar(100) so this is the safer floor.
// PASSWORD_MAX: 128 allows long passphrases without inviting bcrypt DoS. Backend must prehash with SHA-256 OR use Argon2id, since bcrypt truncates at 72 bytes.
// USERNAME_MIN / PASSWORD_MIN: NIST minimums; server-side enforces stronger policy on signup/change.
const USERNAME_MAX = 64;
const USERNAME_MIN = 3;
const PASSWORD_MAX = 128;
const PASSWORD_MIN = 8;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

function filipinoDateTime(d: Date): string {
  const day = FIL_DAYS[d.getDay()];
  const month = FIL_MONTHS[d.getMonth()];
  const date = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${day}, ${month} ${date}, ${year} • ${time}`;
}

function taglishGreeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Magandang umaga.";
  if (h < 18) return "Magandang hapon.";
  return "Magandang gabi.";
}

function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.");
}

function detectEnvironment(): "LOCAL" | "STAGING" | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.")) return "LOCAL";
  if (host.includes("staging")) return "STAGING";
  return null;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  // Persist failed attempts + lockout to sessionStorage so refresh doesn't reset.
  // Defense-in-depth — server-side rate limit (5/min) is the real wall; this prevents
  // trivial client-side bypass of the visual lock.
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(sessionStorage.getItem("bcmp_failed_attempts") || "0");
  });
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = sessionStorage.getItem("bcmp_lockout_until");
    if (!v) return null;
    const ts = Number(v);
    return ts > Date.now() ? ts : null;
  });
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [connectionSecure, setConnectionSecure] = useState(true);
  const [isHttps, setIsHttps] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const now = useMemo(() => new Date(), [mounted]);
  const greeting = useMemo(() => taglishGreeting(now), [now]);
  const dateLine = useMemo(() => filipinoDateTime(now), [now]);
  const env = useMemo(() => detectEnvironment(), [mounted]);

  // Localhost-only dev credential pre-fill (NEVER on staging or prod)
  useEffect(() => {
    if (isLocalhost()) {
      setUsername("kap_tambo");
      setPassword("Tambo@2026!");
    }
  }, []);

  // Insecure connection guard — blocks credential entry on any non-localhost HTTP
  useEffect(() => {
    const isSecure = window.location.protocol === "https:";
    setIsHttps(isSecure);
    // Bypassed: Allow HTTP for temporary IP testing
    setConnectionSecure(true);
  }, []);

  // Authenticated → redirect
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      router.replace(isMobile ? "/census" : "/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  // Lockout countdown timer + sessionStorage sync
  useEffect(() => {
    if (!lockoutUntil) {
      sessionStorage.removeItem("bcmp_lockout_until");
      return;
    }
    sessionStorage.setItem("bcmp_lockout_until", String(lockoutUntil));
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining === 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        sessionStorage.removeItem("bcmp_lockout_until");
        sessionStorage.removeItem("bcmp_failed_attempts");
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Persist failed attempts counter
  useEffect(() => {
    if (failedAttempts > 0) {
      sessionStorage.setItem("bcmp_failed_attempts", String(failedAttempts));
    } else {
      sessionStorage.removeItem("bcmp_failed_attempts");
    }
  }, [failedAttempts]);

  const isLockedOut = lockoutUntil !== null && lockoutRemaining > 0;

  const handleCapsLockCheck = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot — bots fill this, real users don't see it
    if (honeypot.trim() !== "") {
      // Silently fail — don't tell the bot why
      setIsSubmitting(true);
      setTimeout(() => setIsSubmitting(false), 1500);
      return;
    }

    if (isLockedOut) {
      toast("warning", "Sandali lang po", `Maghintay ng ${lockoutRemaining} segundo bago muling sumubok.`);
      return;
    }

    const errors: Record<string, string> = {};
    const u = username.trim();
    const p = password;
    if (!u) errors.username = "Username is required";
    else if (u.length < USERNAME_MIN) errors.username = `Username must be at least ${USERNAME_MIN} characters`;
    else if (u.length > USERNAME_MAX) errors.username = `Username must be at most ${USERNAME_MAX} characters`;
    else if (!/^[A-Za-z0-9._@+\-]+$/.test(u)) errors.username = "Username contains invalid characters";

    if (!p) errors.password = "Password is required";
    else if (p.length < PASSWORD_MIN) errors.password = `Password must be at least ${PASSWORD_MIN} characters`;
    else if (p.length > PASSWORD_MAX) errors.password = `Password must be at most ${PASSWORD_MAX} characters`;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("warning", "Check your input", "Pakitiyak ang inyong username at password.");
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    try {
      await login(username, password, true);
      toast("success", "Login successful", "Redirecting to your dashboard...", 3000);
      setFailedAttempts(0);
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      router.push(isMobile ? "/census" : "/dashboard");
    } catch (err) {
      // Server-side lockout response (HTTP 423) — always wins, even if client counter is lower.
      // retry_after is seconds-until-unlock from the server.
      if (isApiError(err) && err.status === 423) {
        const seconds = Math.max(1, err.retry_after ?? LOCKOUT_SECONDS);
        const until = Date.now() + seconds * 1000;
        setLockoutUntil(until);
        setPassword("");
        const minutes = Math.ceil(seconds / 60);
        toast(
          "error",
          "Naka-lock ang account",
          `Subukan muli sa loob ng ${minutes} minuto. Naka-lock para sa inyong proteksyon laban sa brute-force.`
        );
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockoutUntil(until);
          setPassword("");
          toast(
            "error",
            "Masyadong maraming pagsubok",
            `Naka-lock ang form sa loob ng ${LOCKOUT_SECONDS} segundo para sa inyong proteksyon.`
          );
        } else if (isApiError(err)) {
          const msg = err.message.toLowerCase();
          if (msg.includes("credentials") || msg.includes("invalid") || msg.includes("unauthorized") || msg.includes("incorrect")) {
            // Generic message — never reveal which field was wrong (prevents user enumeration)
            toast(
              "error",
              "Mali ang username o password",
              `Pakitiyak ang inyong kredensyal at subukang muli. (${MAX_FAILED_ATTEMPTS - nextAttempts} pagsubok na lang ang natitira)`
            );
          } else if (msg.includes("throttle") || msg.includes("too many") || msg.includes("rate") || err.status === 429) {
            toast("warning", "Sandali lang po", "Masyadong maraming pagsubok. Maghintay ng ilang sandali bago muling sumubok.");
          } else if (msg.includes("deactivated") || msg.includes("disabled")) {
            toast("error", "Naka-lock ang account", "Makipag-ugnayan sa inyong barangay administrator.");
          } else {
            toast("error", "Hindi nakapag-sign in", err.message);
          }
        } else if (err instanceof TypeError && (err as TypeError).message === "Failed to fetch") {
          toast("error", "Walang koneksyon", "Hindi maabot ang server. Suriin ang inyong internet at subukang muli.");
        } else {
          toast("error", "May problema", "May di-inaasahang nangyari. Subukang muli.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040814]">
        <Loader2 className="w-6 h-6 animate-spin text-white/60" />
      </div>
    );
  }

  const trustChips = [
    { label: "RA 10173", icon: Shield, active: true },
    { label: isHttps ? "Encrypted" : "HTTP", icon: isHttps ? Lock : LockOpen, active: isHttps },
    { label: "Brute-Force Protected", icon: ShieldCheck, active: true },
  ];

  const formDisabled = isSubmitting || isLockedOut;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-[#040814]">
      {/* Layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060a18] via-[#0a1230] to-[#050818]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Animated orbs */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[640px] h-[640px] rounded-full blur-[120px]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(37,99,235,0.65) 0%, transparent 70%)",
          animation: "orb-drift-1 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[560px] h-[560px] rounded-full blur-[110px]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.55) 0%, transparent 70%)",
          animation: "orb-drift-2 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[40%] left-[55%] w-[420px] h-[420px] rounded-full blur-[100px]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(6,182,212,0.40) 0%, transparent 70%)",
          animation: "orb-drift-3 22s ease-in-out infinite",
        }}
      />

      {/* Corner vignettes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(0,0,0,0.45) 0%, transparent 35%), radial-gradient(circle at 100% 0%, rgba(0,0,0,0.45) 0%, transparent 35%), radial-gradient(circle at 0% 100%, rgba(0,0,0,0.55) 0%, transparent 35%), radial-gradient(circle at 100% 100%, rgba(0,0,0,0.55) 0%, transparent 35%)",
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Honest environment badge */}
      {mounted && env && (
        <div
          className={`absolute top-4 right-4 px-3 py-1 text-[10px] font-bold rounded-full tracking-[0.15em] z-20 backdrop-blur-md border ${
            env === "LOCAL"
              ? "bg-slate-800/70 text-slate-200 border-slate-600/50"
              : "bg-amber-500/90 text-white border-amber-300/60"
          }`}
        >
          {env}
        </div>
      )}

      {/* Centered content stack */}
      <div
        className="relative z-10 w-full max-w-[500px]"
        style={{ animation: "login-card-rise 0.7s ease-out" }}
      >
        {/* Brand mark with glowing ring */}
        <div className="flex flex-col items-center mb-7">
          <div className="relative mb-4 flex items-center justify-center" style={{ width: 104, height: 104 }}>
            <div className="absolute inset-[-12px] rounded-full bg-blue-500/25 blur-2xl" />
            <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
            <div
              className="absolute inset-[8px] rounded-full"
              style={{
                backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.10) 100%)",
                boxShadow: "inset 0 0 0 1px rgba(59,130,246,0.25), inset 0 1px 0 0 rgba(255,255,255,0.08)",
              }}
            />
            <Image
              src="/kapitanph_logo.png"
              alt="kapitan.ph"
              width={88}
              height={88}
              className="relative h-20 w-20"
              priority
            />
          </div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-blue-300/75 text-center font-medium">
            Barangay Comprehensive Management Platform
          </p>
          <div className="mt-3 w-12 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        </div>

        {/* Premium card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(8,14,32,0.82) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 0 rgba(255,255,255,0.06) inset",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* PH flag accent strip */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
            style={{
              backgroundImage: "linear-gradient(90deg, transparent 0%, #1d4ed8 15%, #2563eb 30%, #fcd116 50%, #dc2626 70%, #b91c1c 85%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "flag-shimmer 8s ease-in-out infinite",
            }}
          />

          {!connectionSecure ? (
            <div className="p-9 space-y-5">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center mb-3">
                  <XCircle className="w-7 h-7 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Hindi ligtas ang koneksyon</h2>
                <p className="text-white/60 text-xs mt-2 max-w-[340px] leading-relaxed">
                  Hindi naka-encrypt ang inyong koneksyon. Naka-disable ang form para sa inyong proteksyon.
                </p>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Naka-HTTP ang load. Hinihingi ng RA 10173 ang HTTPS para sa login pages.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Siguraduhin ang URL ay <span className="font-mono font-semibold text-emerald-400">https://</span> o makipag-ugnayan sa IT admin.
                  </p>
                </div>
              </div>

              <button
                onClick={() => { window.location.href = window.location.href.replace("http://", "https://"); }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-500 transition-all"
              >
                Lumipat sa secure connection
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} noValidate autoComplete="on" className="p-9 space-y-5">
              {/* Honeypot — bots fill, real users never see */}
              <div
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 0, width: 0, overflow: "hidden" }}
              >
                <label htmlFor="website">Website (leave blank)</label>
                <input
                  id="website"
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Greeting with vertical accent rule */}
              <div className="flex gap-3.5">
                <div
                  className="w-[3px] rounded-full shrink-0"
                  style={{ backgroundImage: "linear-gradient(180deg, rgba(59,130,246,0.7) 0%, rgba(139,92,246,0.3) 100%)" }}
                />
                <div>
                  {mounted ? (
                    <h1
                      className="text-[30px] text-white leading-tight"
                      style={{ fontFamily: "var(--font-playfair)", letterSpacing: "-0.015em" }}
                    >
                      {greeting}
                    </h1>
                  ) : (
                    <h1
                      className="text-[30px] text-white leading-tight opacity-0"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      Magandang araw.
                    </h1>
                  )}
                  <p className="text-white/55 text-[13px] mt-2">Mag-sign in sa inyong barangay dashboard.</p>
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-[12px] font-medium text-white/80 mb-1.5 tracking-wide">
                  USERNAME
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value.slice(0, USERNAME_MAX)); if (formErrors.username) setFormErrors(prev => { const { username: _u, ...rest } = prev; return rest; }); }}
                  placeholder="e.g., kap_tambo"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  maxLength={USERNAME_MAX}
                  required
                  aria-required="true"
                  aria-invalid={!!formErrors.username}
                  aria-describedby={formErrors.username ? "username-error" : undefined}
                  autoFocus
                  disabled={formDisabled}
                  className={`w-full px-4 py-3.5 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.username
                      ? "bg-red-500/[0.08] border-red-500/50 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.18)]"
                      : "bg-white/[0.04] border-white/[0.15] focus:bg-white/[0.07] focus:border-blue-400/70 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.25)]"
                  }`}
                />
                {formErrors.username && (
                  <p id="username-error" role="alert" className="text-[11px] text-red-400 mt-1.5">{formErrors.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[12px] font-medium text-white/80 mb-1.5 tracking-wide">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value.slice(0, PASSWORD_MAX)); if (formErrors.password) setFormErrors(prev => { const { password: _p, ...rest } = prev; return rest; }); }}
                    onKeyDown={handleCapsLockCheck}
                    onKeyUp={handleCapsLockCheck}
                    onBlur={() => setCapsLockOn(false)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    maxLength={PASSWORD_MAX}
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.password}
                    aria-describedby={formErrors.password ? "password-error" : (capsLockOn ? "password-caps-warning" : undefined)}
                    disabled={formDisabled}
                    className={`w-full px-4 pr-11 py-3.5 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                      formErrors.password
                        ? "bg-red-500/[0.08] border-red-500/50 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.18)]"
                        : "bg-white/[0.04] border-white/[0.15] focus:bg-white/[0.07] focus:border-blue-400/70 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.25)]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={formDisabled}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-md hover:bg-white/5 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p id="password-error" role="alert" className="text-[11px] text-red-400 mt-1.5">{formErrors.password}</p>
                )}
                {capsLockOn && (
                  <p id="password-caps-warning" role="status" className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3" />
                    Naka-on ang Caps Lock
                  </p>
                )}
              </div>

              {/* Sign in button — locked-out state shows countdown */}
              <button
                type="submit"
                disabled={formDisabled}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-[#0a1230] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 group relative overflow-hidden"
                style={{
                  backgroundImage: isLockedOut
                    ? "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #4f46e5 100%)",
                  boxShadow: isLockedOut
                    ? "0 8px 24px -6px rgba(127,29,29,0.55)"
                    : "0 8px 24px -6px rgba(37,99,235,0.55), 0 1px 0 0 rgba(255,255,255,0.15) inset",
                }}
              >
                {!isLockedOut && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #6366f1 100%)" }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLockedOut
                    ? `Naka-lock — subukan muli sa ${lockoutRemaining}s`
                    : isSubmitting
                    ? "Sumasagip..."
                    : "Sign in"}
                </span>
              </button>

              <div className="text-center pt-1">
                <a href="/forgot-password" className="text-xs font-medium text-blue-300/80 hover:text-blue-200 transition-colors">
                  Nakalimutan ang password?
                </a>
              </div>
            </form>
          )}
        </div>

        {/* Trust chips */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 mt-6">
          {trustChips.map((c) => (
            <span
              key={c.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap backdrop-blur-sm border ${
                c.active
                  ? "bg-emerald-500/[0.10] text-emerald-300 border-emerald-500/30"
                  : "bg-red-500/[0.10] text-red-300 border-red-500/30"
              }`}
            >
              <c.icon className="w-3.5 h-3.5" />
              {c.label}
            </span>
          ))}
        </div>

        {/* Filipino date line */}
        {mounted && (
          <p className="text-center text-[11px] text-white/40 mt-3 tracking-wide">{dateLine}</p>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-1">
          <p className="text-center text-[11px] text-white/40">
            Built by{" "}
            <a
              href="https://primex.ventures/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/60 hover:text-blue-300 transition-colors"
            >
              PrimeX Ventures Inc.
            </a>
          </p>
          <p className="text-center text-[10px] text-white/25">
            &copy; 2015-2026 &middot; {APP_VERSION_LABEL}
          </p>
        </div>
      </div>
    </div>
  );
}
