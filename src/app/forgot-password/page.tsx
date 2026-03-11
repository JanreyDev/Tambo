"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { isApiError } from "@/contexts/auth-context";
import {
  ArrowLeft,
  Loader2,
  Phone,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  RefreshCw,
  UserCheck,
} from "lucide-react";

type Step = "username" | "otp" | "new-password" | "success";
type UsernameStatus = "idle" | "checking" | "valid" | "invalid" | "no-phone";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>("username");

  // Username step
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [phoneMasked, setPhoneMasked] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // OTP step
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password step
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Shared
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Username validation (debounced) ──

  const checkUsername = useCallback(async (value: string) => {
    if (!value.trim()) {
      setUsernameStatus("idle");
      setPhoneMasked("");
      return;
    }

    setUsernameStatus("checking");
    setError("");

    try {
      const res = await api.auth.checkUsername(value.trim());
      if (!res.exists) {
        setUsernameStatus("invalid");
        setPhoneMasked("");
      } else if (!res.has_phone) {
        setUsernameStatus("no-phone");
        setPhoneMasked("");
      } else {
        setUsernameStatus("valid");
        setPhoneMasked(res.phone_masked || "");
      }
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameStatus("idle");
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length >= 3) {
      debounceRef.current = setTimeout(() => {
        checkUsername(value);
      }, 600);
    }
  };

  // Also check on blur for short usernames
  const handleUsernameBlur = () => {
    if (username.trim() && usernameStatus === "idle") {
      checkUsername(username);
    }
  };

  // ── OTP countdown timer ──

  useEffect(() => {
    if (!otpExpiresAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
      setOtpTimeLeft(remaining);
      if (remaining <= 0) {
        setOtpExpiresAt(null);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  // ── Resend cooldown timer ──

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Format seconds as M:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── Step 1: Send OTP ──

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (usernameStatus !== "valid") return;

    setIsSubmitting(true);
    setError("");

    try {
      await api.auth.forgotPassword(username.trim());
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000); // 5 minutes
      setResendCooldown(60); // 60 second cooldown before resend
      setStep("otp");
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message || "Failed to send verification code.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Verify OTP ──

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await api.auth.verifyResetOtp(username.trim(), otp);
      setResetToken(res.reset_token);
      if (res.phone_masked) setPhoneMasked(res.phone_masked);
      setStep("new-password");
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message || "Invalid verification code.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Resend OTP ──

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setOtp("");

    try {
      await api.auth.forgotPassword(username.trim());
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
      setResendCooldown(60);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message || "Failed to resend code.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 3: Set new password ──

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await api.auth.resetPassword(
        username.trim(),
        resetToken,
        password,
        passwordConfirmation
      );
      setStep("success");
    } catch (err) {
      if (isApiError(err)) {
        const errObj = err as unknown as { errors?: Record<string, string[]> };
        if (errObj.errors?.password) {
          setError(errObj.errors.password[0]);
        } else {
          setError(err.message || "Failed to reset password.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Username input border class ──

  const usernameInputClass = () => {
    const base =
      "w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all pr-12";
    if (usernameStatus === "invalid" || usernameStatus === "no-phone") {
      return `${base} border-red-400 focus:ring-red-500/50 focus:border-red-400`;
    }
    if (usernameStatus === "valid") {
      return `${base} border-green-400 focus:ring-green-500/50 focus:border-green-400`;
    }
    return `${base} border-slate-200 focus:ring-blue-500/50 focus:border-blue-300`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo-white.png"
            alt="Barangay Comprehensive Management Platform"
            width={220}
            height={60}
            priority
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Back button */}
          {step !== "success" && (
            <button
              type="button"
              onClick={() => {
                if (step === "username") {
                  router.push("/");
                } else if (step === "otp") {
                  setStep("username");
                  setOtp("");
                  setError("");
                  setOtpExpiresAt(null);
                } else if (step === "new-password") {
                  setStep("otp");
                  setOtp("");
                  setError("");
                }
              }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {/* ──────── Step 1: Enter Username ──────── */}
          {step === "username" && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Forgot Password
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Enter your username and we&apos;ll send a verification code to
                  your registered phone number.
                </p>
              </div>

              <form onSubmit={handleSendOtp}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    onBlur={handleUsernameBlur}
                    placeholder="Enter your username"
                    className={usernameInputClass()}
                    autoFocus
                    autoComplete="username"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && (
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    )}
                    {usernameStatus === "valid" && (
                      <UserCheck className="w-5 h-5 text-green-500" />
                    )}
                    {(usernameStatus === "invalid" || usernameStatus === "no-phone") && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                {/* Status messages */}
                {usernameStatus === "valid" && phoneMasked && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Code will be sent to {phoneMasked}
                  </p>
                )}
                {usernameStatus === "invalid" && (
                  <p className="text-sm text-red-600 mt-2">
                    Username not found. Please check and try again.
                  </p>
                )}
                {usernameStatus === "no-phone" && (
                  <p className="text-sm text-red-600 mt-2">
                    No phone number registered for this account. Contact your
                    administrator.
                  </p>
                )}

                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || usernameStatus !== "valid"}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Send Verification Code
                </button>
              </form>
            </>
          )}

          {/* ──────── Step 2: Enter OTP ──────── */}
          {step === "otp" && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Enter Verification Code
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  A 6-digit code has been sent to{" "}
                  {phoneMasked && (
                    <span className="font-medium text-slate-700">
                      {phoneMasked}
                    </span>
                  )}
                  .
                </p>
              </div>

              {/* OTP Timer */}
              {otpTimeLeft > 0 ? (
                <div className="flex items-center justify-center gap-2 text-sm mb-4 bg-blue-50 text-blue-700 rounded-lg py-2.5 px-3">
                  <Clock className="w-4 h-4" />
                  Code expires in{" "}
                  <span className="font-mono font-bold">
                    {formatTime(otpTimeLeft)}
                  </span>
                </div>
              ) : otpExpiresAt === null && step === "otp" ? (
                <div className="flex items-center justify-center gap-2 text-sm mb-4 bg-red-50 text-red-600 rounded-lg py-2.5 px-3">
                  <AlertCircle className="w-4 h-4" />
                  Code has expired. Please resend.
                </div>
              ) : null}

              <form onSubmit={handleVerifyOtp}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-center text-2xl font-mono tracking-[0.3em] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
                  autoFocus
                />

                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || otp.length !== 6 || otpTimeLeft <= 0}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Verify Code
                </button>

                {/* Resend button - enabled after cooldown */}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="w-full mt-2 py-2.5 text-sm rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50 hover:border-blue-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : "Resend Code"}
                </button>
              </form>
            </>
          )}

          {/* ──────── Step 3: New Password ──────── */}
          {step === "new-password" && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Set New Password
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {phoneMasked && (
                    <>
                      Verified via {phoneMasked}.{" "}
                    </>
                  )}
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters, mixed case + number"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all pr-12"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={passwordConfirmation}
                        onChange={(e) =>
                          setPasswordConfirmation(e.target.value)
                        }
                        placeholder="Re-enter your new password"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password requirements */}
                <div className="mt-3 space-y-1">
                  {[
                    {
                      ok: password.length >= 8,
                      label: "At least 8 characters",
                    },
                    {
                      ok: /[a-z]/.test(password) && /[A-Z]/.test(password),
                      label: "Mixed case (uppercase + lowercase)",
                    },
                    { ok: /\d/.test(password), label: "At least one number" },
                    {
                      ok:
                        password.length > 0 &&
                        password === passwordConfirmation,
                      label: "Passwords match",
                    },
                  ].map((req) => (
                    <div
                      key={req.label}
                      className={`flex items-center gap-2 text-xs ${req.ok ? "text-green-600" : "text-slate-400"}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {req.label}
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-red-600 mt-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    password.length < 8 ||
                    password !== passwordConfirmation
                  }
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Reset Password
                </button>
              </form>
            </>
          )}

          {/* ──────── Step 4: Success ──────── */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                Password Reset Complete
              </h1>
              <p className="text-sm text-slate-500 mb-6">
                Your password has been changed successfully. All existing
                sessions have been signed out. Please sign in with your new
                password.
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 mt-6 space-y-0.5">
          <p>Developed and Maintained by PrimeX Ventures Inc.</p>
          <p>Copyright &copy; 2015-2026 All Rights Reserved</p>
          <p>v5.0.0</p>
        </div>
      </div>
    </div>
  );
}
