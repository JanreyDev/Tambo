"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, ShieldAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFounderAuth } from "@/contexts/founder-auth-context";

export default function PasscodePage() {
  const [passphrase, setPassphrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await verifyPasscode(passphrase.trim());

    if (result.success) {
      router.replace("/dashboard");
    } else {
      setAttempts((prev) => prev + 1);
      setError(result.error || "Access denied");
      setIsShaking(true);
      setPassphrase("");
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.focus();
    }

    setIsSubmitting(false);
  };

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
            <Zap className="h-7 w-7 text-accent" />
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
              disabled={isSubmitting}
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
          {error && (
            <p
              id="passcode-error"
              className="text-center text-xs font-medium text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Rate limit warning */}
          {attempts >= 2 && (
            <p className="text-center text-[10px] text-amber-400/80">
              Multiple failed attempts detected. Further attempts may be rate limited.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!passphrase.trim() || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-orange-400 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:from-accent-hover hover:to-accent disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Access"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-[9px] text-muted-foreground/50">
          PrimeX Ventures Inc. Founder Access Only.
        </p>
      </div>
    </div>
  );
}
