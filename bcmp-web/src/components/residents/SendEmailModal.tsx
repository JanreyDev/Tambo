"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, Mail, Loader2, CheckCircle2, AlertTriangle,
  Sparkles, Contact, AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface EmailTargetResident {
  id: string;
  name: string; // full display name
  email: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  resident: EmailTargetResident | null;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function SendEmailModal({ open, onClose, resident }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [draftingAi, setDraftingAi] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);

  // Track mounted to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSubject("");
      setBody("");
      setStatus("idle");
      setErrorMsg("");
      setDraftingAi(false);
      // Focus subject input on open
      setTimeout(() => subjectInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, sending, onClose]);

  // Derived values
  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !sending && !!resident?.email;

  // ── Draft with Mabini AI ──
  const draftWithAi = useCallback(async () => {
    if (!resident || draftingAi) return;
    setDraftingAi(true);
    try {
      const prompt = `Draft a professional email subject and body in Filipino (Tagalog) to a barangay resident named ${resident.name}. The email should be a general notification from the Barangay Hall. Respond in this format:\nSubject: [Subject here]\nBody: [Body here]`;
      
      let draft = "";
      await api.ai.createConversation(prompt, (event) => {
        if (event.event === "content_delta") {
          draft += event.data.text;
        }
      });
      
      if (mounted.current && draft.trim()) {
        const text = draft.trim();
        const subjectMatch = text.match(/Subject:\s*(.*)/i);
        const bodyMatch = text.match(/Body:\s*([\s\S]*)/i);
        
        if (subjectMatch && subjectMatch[1]) {
          setSubject(subjectMatch[1].trim());
        }
        if (bodyMatch && bodyMatch[1]) {
          setBody(bodyMatch[1].trim());
        } else {
          // Fallback if formatting is irregular
          setBody(text);
        }
      }
    } catch {
      // silent — AI draft is optional
    } finally {
      if (mounted.current) setDraftingAi(false);
    }
  }, [resident, draftingAi]);

  // ── Send Email ──
  const handleSend = async () => {
    if (!canSend || !resident) return;
    setSending(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      await api.residents.sendEmail(resident.id, subject.trim(), body.trim());
      if (mounted.current) {
        setStatus("success");
      }
    } catch (err: unknown) {
      if (mounted.current) {
        setStatus("error");
        setErrorMsg(
          (err as { message?: string })?.message ||
          "Failed to send email. Please try again."
        );
      }
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  if (!open || !resident) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) !sending && onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Mail className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Send Email</h2>
              <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">{resident.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !sending && onClose()}
            disabled={sending}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Success State ── */}
        {status === "success" ? (
          <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Email Sent</p>
              <p className="text-sm text-muted-foreground mt-1">
                Message successfully delivered to {resident.email}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: "var(--accent-primary)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">

            {/* Resend Sandbox Mode Notice */}
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Resend Sandbox Warning:</span> During testing, emails will only deliver if the recipient is the verified test address (<span className="font-mono">janreyminadev@gmail.com</span>). Other addresses will be rejected by the provider.
              </div>
            </div>

            {/* ── Recipient ── */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Contact className="h-3.5 w-3.5" />
                  Recipient Email Address
                </span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground font-mono select-none">
                {resident.email ?? (
                  <span className="text-muted-foreground italic">No email address registered</span>
                )}
                <span className="ml-auto text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  READ-ONLY
                </span>
              </div>
            </div>

            {/* ── Subject Input ── */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject *</label>
              <input
                ref={subjectInputRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending || draftingAi}
                placeholder="e.g. Announcement / Document Update Notification"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring transition-colors disabled:opacity-50"
              />
            </div>

            {/* ── Message Textarea ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">Message Body *</label>
                {/* Mabini AI Draft */}
                <button
                  type="button"
                  onClick={draftWithAi}
                  disabled={draftingAi || sending}
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 transition-colors disabled:opacity-40"
                  title="Let Mabini AI draft an email"
                >
                  {draftingAi
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Sparkles className="h-3 w-3" />
                  }
                  {draftingAi ? "Drafting..." : "Draft with AI"}
                </button>
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending || draftingAi}
                placeholder="Write your email message here..."
                rows={6}
                className="w-full px-3 py-3 text-sm rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent-ring transition-colors disabled:opacity-50"
              />
            </div>

            {/* ── Error Banner ── */}
            {status === "error" && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => !sending && onClose()}
                disabled={sending}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canSend ? "var(--accent-primary)" : undefined }}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}
