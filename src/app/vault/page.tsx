"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2, Clock, Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useVaultAuth } from "@/contexts/vault-auth-context";
import { VaultApiError } from "@/lib/vault-api";

export default function VaultPage() {
  const [keyphrase, setKeyphrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { verifyKeyphrase, isAuthenticated, isChecking } = useVaultAuth();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      router.replace("/vault/guide");
    }
  }, [isAuthenticated, isChecking, router]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (!lockedUntil) {
      setCountdown(0);
      return;
    }

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
      if (!keyphrase.trim() || isSubmitting || isLocked) return;

      setIsSubmitting(true);
      setError(null);

      const result = await verifyKeyphrase(keyphrase.trim());

      if (result.success) {
        toast.success("Maligayang pagdating sa Family Vault.");
        router.replace("/vault/guide");
      } else {
        const errorMsg =
          result.error || "Mali ang keyphrase. Subukan ulit.";

        if (result.retryAfter) {
          setLockedUntil(Date.now() + result.retryAfter * 1000);
        }

        setError(errorMsg);
        toast.error(errorMsg);
        setIsShaking(true);
        setKeyphrase("");
        setTimeout(() => setIsShaking(false), 500);

        if (!result.retryAfter) {
          inputRef.current?.focus();
        }
      }

      setIsSubmitting(false);
    },
    [keyphrase, isSubmitting, isLocked, verifyKeyphrase, router],
  );

  if (isChecking) {
    return (
      <div className="vault-theme flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="vault-theme relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)]">
      {/* Warm amber radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.02) 40%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/80 p-8 shadow-2xl backdrop-blur-md",
          isShaking && "animate-shake",
        )}
      >
        {/* Icon */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <KeyRound className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-lg font-bold text-gradient-amber">
            Family Vault
          </h1>
          <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">
            Para sa pamilya ni Jeager. Ipasok ang keyphrase para ma-access ang mga importanteng dokumento.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={keyphrase}
              onChange={(e) => setKeyphrase(e.target.value)}
              placeholder="Ipasok ang keyphrase"
              disabled={isSubmitting || isLocked}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                "w-full rounded-lg border bg-[var(--input-bg)] px-4 py-3 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50",
                error
                  ? "border-red-600"
                  : "border-[var(--input-border)]",
              )}
              aria-label="Keyphrase"
              aria-describedby={error ? "vault-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              aria-label={showPassword ? "Itago ang keyphrase" : "Ipakita ang keyphrase"}
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
              id="vault-error"
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
                  Subukan ulit sa {countdown}s
                </span>
              </div>
              <p className="text-center text-[10px] text-[var(--muted-foreground)]">
                Masyadong maraming pagsubok. Maghintay bago subukan ulit.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!keyphrase.trim() || isSubmitting || isLocked}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:from-amber-700 hover:to-amber-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Binibigyan ng access...
              </>
            ) : isLocked ? (
              <>
                <Clock className="h-4 w-4" />
                Naka-lock ({countdown}s)
              </>
            ) : (
              "Buksan ang Vault"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--muted-foreground)]/60">
            <Heart className="h-3 w-3 text-amber-500/50" />
            <span>Manalo Family</span>
          </div>
          <p className="mt-1 text-[9px] text-[var(--muted-foreground)]/40">
            Developed by PrimeX Ventures Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
