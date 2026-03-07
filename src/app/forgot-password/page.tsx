"use client";

import { useState } from "react";
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
} from "lucide-react";

type Step = "username" | "otp" | "new-password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Step 1: Send OTP to user's registered phone
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await api.auth.forgotPassword(username.trim());
      setMessage(res.message);
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

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await api.auth.verifyResetOtp(username.trim(), otp);
      setResetToken(res.reset_token);
      setPhoneMasked(res.phone_masked);
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

  // Step 3: Set new password
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
        // Extract validation errors
        const errors = (err as Record<string, unknown>).errors as
          | Record<string, string[]>
          | undefined;
        if (errors?.password) {
          setError(errors.password[0]);
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
                  router.push("/login");
                } else if (step === "otp") {
                  setStep("username");
                  setOtp("");
                  setError("");
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

          {/* Step 1: Enter Username */}
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
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
                  autoFocus
                  autoComplete="username"
                />

                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !username.trim()}
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

          {/* Step 2: Enter OTP */}
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
                  A 6-digit code has been sent to your registered phone number.
                  The code expires in 5 minutes.
                </p>
              </div>

              {message && (
                <div className="bg-blue-50 text-blue-700 text-sm rounded-lg p-3 mb-4">
                  {message}
                </div>
              )}

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
                  disabled={isSubmitting || otp.length !== 6}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Verify Code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtp("");
                    setError("");
                    handleSendOtp({
                      preventDefault: () => {},
                    } as React.FormEvent);
                  }}
                  className="w-full mt-2 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Resend Code
                </button>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
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

          {/* Step 4: Success */}
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
                onClick={() => router.push("/login")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          kapitan.ph v5.0.0 | PrimeX Ventures Inc.
        </p>
      </div>
    </div>
  );
}
