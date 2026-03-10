"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldAlert, Shield, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { PrimeXLogo } from "@/components/primex-logo";
import { cn } from "@/lib/utils";
import { useFounderAuth } from "@/contexts/founder-auth-context";


export default function PasscodePage() {
  const [passphrase, setPassphrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { verifyPasscode, isAuthenticated, isChecking } = useFounderAuth();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isChecking, router]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setCountdown(0);
        setError(null);
        inputRef.current?.focus();
      } else {
        setCountdown(remaining);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && countdown > 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!passphrase.trim() || isSubmitting || isLocked) return;

      setIsSubmitting(true);
      setError(null);

      const result = await verifyPasscode(passphrase.trim());

      if (result.success) {
        toast.success("Access granted. Welcome, Founder.");
        router.replace("/dashboard");
      } else {
        const errorMsg = result.error || "Invalid passphrase. Please try again.";

        // Check if rate limited
        if (result.retryAfter) {
          setLockedUntil(Date.now() + result.retryAfter * 1000);
        }

        setError(errorMsg);
        toast.error(errorMsg);
        setIsShaking(true);
        setPassphrase("");
        setTimeout(() => setIsShaking(false), 500);

        if (!result.retryAfter) {
          inputRef.current?.focus();
        }
      }

      setIsSubmitting(false);
    },
    [passphrase, isSubmitting, isLocked, verifyPasscode, router],
  );

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617]">
      {/* Orange radial gradient from center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(234, 88, 12, 0.08) 0%, rgba(234, 88, 12, 0.02) 40%, transparent 70%)",
        }}
      />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-sm rounded-2xl border border-card-border bg-card/80 p-8 shadow-2xl backdrop-blur-md",
          isShaking && "animate-shake",
        )}
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <PrimeXLogo className="h-7 w-7 text-accent" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">
            Command Center
          </span>
        </div>

        {/* Restricted Access Badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-800/50 bg-red-950/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
            <ShieldAlert className="h-3 w-3" />
            Restricted Access
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase"
              disabled={isSubmitting || isLocked}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                "w-full rounded-lg border bg-input-bg px-4 py-3 pr-10 font-metrics text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50",
                error ? "border-red-600" : "border-input-border",
              )}
              aria-label="Passphrase"
              aria-describedby={error ? "passcode-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Error */}
          {error && !isLocked && (
            <p
              id="passcode-error"
              className="text-center text-xs font-medium text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Rate limit countdown */}
          {isLocked && (
            <div className="flex flex-col items-center gap-1.5" role="alert">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">
                  Try again in {countdown}s
                </span>
              </div>
              <p className="text-center text-[10px] text-muted-foreground">
                Too many attempts. Please wait before trying again.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!passphrase.trim() || isSubmitting || isLocked}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-orange-400 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:from-accent-hover hover:to-accent disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : isLocked ? (
              <>
                <Clock className="h-4 w-4" />
                Locked ({countdown}s)
              </>
            ) : (
              "Access"
            )}
          </button>
        </form>

        {/* Family Vault Link */}
        <div className="mt-6 flex justify-center">
          <a
            href="/vault"
            className="group flex items-center gap-1.5 text-[10px] text-amber-500/60 transition-colors hover:text-amber-400"
          >
            <Shield className="h-3 w-3" />
            <span>Family Vault</span>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[9px] leading-relaxed text-muted-foreground/40">
          <p className="font-medium text-muted-foreground/50">
            Founder Access Only.
          </p>
          <p>Developed by PrimeX Ventures Inc.</p>
          <p>Copyright &copy; 2015&ndash;{new Date().getFullYear()} All Rights Reserved</p>
          <p className="mt-1 font-metrics text-[8px] text-muted-foreground/30">
            v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
