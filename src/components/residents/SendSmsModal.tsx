"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, MessageSquare, Loader2, CheckCircle2, AlertTriangle,
  Smartphone, CreditCard, Sparkles, ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────────
const CHARS_PER_SEGMENT = 159;
const COST_PER_SEGMENT = 0.50;
const MAX_CHARS = CHARS_PER_SEGMENT * 4; // 4 segments max = 636 chars

// Quick message templates — Tanga-Proof: staff can pick instead of typing
const TEMPLATES = [
  { label: "Notice Ready", text: "Magandang araw! Ang inyong hiniling na dokumento mula sa aming barangay ay handa na. Pumunta sa barangay hall upang makuha ito. Maraming salamat." },
  { label: "Appointment Reminder", text: "Paalaala: Mayroon kayong appointment sa barangay hall bukas. Pakidalhin ang valid ID. Para sa katanungan, tumawag sa aming opisina." },
  { label: "Community Meeting", text: "Imbitasyon sa pulong ng komunidad sa barangay hall. Ang inyong presensya ay lubos na kailangan. Mangyaring dumalo upang marinig ang mahahalagang balita." },
  { label: "Health Program", text: "Abiso: Mayroon kaming libreng health program para sa mga residente ng aming barangay. Mangyaring makipag-ugnayan sa barangay health center para sa karagdagang impormasyon." },
] as const;

// ── Types ──────────────────────────────────────────────────────────────────────
export interface SmsTargetResident {
  id: string;
  name: string; // full display name
  mobile_number: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  resident: SmsTargetResident | null;
  creditBalance?: number | null; // current barangay SMS credit balance
  /** Override the default resident SMS API call (e.g. for establishments) */
  sendFn?: (id: string, message: string) => Promise<{ message: string; segments: number; cost: number; remaining_balance: number }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function calcSegments(text: string): number {
  const len = text.length;
  return len === 0 ? 0 : Math.ceil(len / CHARS_PER_SEGMENT);
}

function calcCost(text: string): number {
  return calcSegments(text) * COST_PER_SEGMENT;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function SendSmsModal({ open, onClose, resident, creditBalance, sendFn }: Props) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [draftingAi, setDraftingAi] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(false);

  // Track mounted to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMessage("");
      setStatus("idle");
      setErrorMsg("");
      setDraftingAi(false);
      setShowTemplates(false);
      setRemainingBalance(null);
      // Focus textarea on open
      setTimeout(() => textareaRef.current?.focus(), 100);
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
  const chars = message.length;
  const segments = calcSegments(message);
  const cost = calcCost(message);
  const balance = remainingBalance ?? creditBalance ?? 0;
  const hasEnoughCredits = balance >= cost || chars === 0;
  const canSend = chars > 0 && chars <= MAX_CHARS && hasEnoughCredits && !sending && !!resident?.mobile_number;

  // Character counter color
  const counterColor =
    chars > MAX_CHARS
      ? "text-red-500"
      : chars > CHARS_PER_SEGMENT * 3
      ? "text-amber-500"
      : "text-muted-foreground";

  // ── Draft with Mabini AI ──
  const draftWithAi = useCallback(async () => {
    if (!resident || draftingAi) return;
    setDraftingAi(true);
    setShowTemplates(false);
    try {
      const prompt = `Draft a short, professional SMS message in Filipino (Tagalog) to a barangay resident named ${resident.name}. The message should be a general notification from the Barangay Hall. Keep it under 159 characters. Return only the SMS text, nothing else.`;
      // Use the AI conversation API — stream the response
      let draft = "";
      await api.ai.createConversation(prompt, (event) => {
        if (event.event === "content_delta") {
          draft += event.data.text;
        }
      });
      if (mounted.current && draft.trim()) {
        // Trim to max allowed chars
        setMessage(draft.trim().slice(0, MAX_CHARS));
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    } catch {
      // silent — AI draft is optional, don't disrupt the flow
    } finally {
      if (mounted.current) setDraftingAi(false);
    }
  }, [resident, draftingAi]);

  // ── Send SMS ──
  const handleSend = async () => {
    if (!canSend || !resident) return;
    setSending(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      const res = await (sendFn ?? api.residents.sendSms)(resident.id, message.trim());
      if (mounted.current) {
        setStatus("success");
        setRemainingBalance(res.remaining_balance);
      }
    } catch (err: unknown) {
      if (mounted.current) {
        setStatus("error");
        setErrorMsg(
          (err as { message?: string })?.message ||
          "Failed to send SMS. Please try again."
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
      <div className="relative z-10 w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <MessageSquare className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Send SMS</h2>
              <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">{resident.name}</p>
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
              <p className="text-base font-semibold text-foreground">SMS Sent</p>
              <p className="text-sm text-muted-foreground mt-1">
                Message delivered to {resident.mobile_number}
              </p>
              {remainingBalance !== null && (
                <p className="text-xs text-muted-foreground mt-2">
                  Remaining balance: <span className="font-medium text-foreground">₱{remainingBalance.toFixed(2)}</span>
                </p>
              )}
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

            {/* ── Recipient ── */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  Recipient Mobile Number
                </span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground font-mono select-none">
                {resident.mobile_number ?? (
                  <span className="text-muted-foreground italic">No mobile number registered</span>
                )}
                <span className="ml-auto text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  READ-ONLY
                </span>
              </div>
            </div>

            {/* ── Credit Balance ── */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">SMS Credits:</span>
              <span className={cn(
                "font-semibold ml-auto",
                balance < 1 ? "text-red-500" : balance < 5 ? "text-amber-500" : "text-green-600 dark:text-green-400"
              )}>
                ₱{(remainingBalance ?? creditBalance ?? 0).toFixed(2)}
              </span>
            </div>

            {/* ── Message Textarea ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <div className="flex items-center gap-2">
                  {/* Mabini AI Draft */}
                  <button
                    type="button"
                    onClick={draftWithAi}
                    disabled={draftingAi || sending}
                    className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 transition-colors disabled:opacity-40"
                    title="Let Mabini AI draft a message"
                  >
                    {draftingAi
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Sparkles className="h-3 w-3" />
                    }
                    {draftingAi ? "Drafting..." : "Draft with AI"}
                  </button>
                  {/* Templates */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTemplates((v) => !v)}
                      disabled={sending}
                      className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-40"
                    >
                      Templates <ChevronDown className="h-3 w-3" />
                    </button>
                    {showTemplates && (
                      <div className="absolute right-0 top-7 z-50 w-56 bg-white dark:bg-slate-800 border border-border rounded-xl shadow-lg py-1.5 text-xs">
                        {TEMPLATES.map((t) => (
                          <button
                            key={t.label}
                            type="button"
                            onClick={() => {
                              setMessage(t.text);
                              setShowTemplates(false);
                              setTimeout(() => textareaRef.current?.focus(), 50);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-foreground"
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending || draftingAi}
                placeholder="Type your message here..."
                rows={5}
                maxLength={MAX_CHARS + 50} // allow slight over-limit to show error
                className={cn(
                  "w-full px-3 py-3 text-sm rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 transition-colors disabled:opacity-50",
                  chars > MAX_CHARS
                    ? "border-red-400 focus:ring-red-300"
                    : "border-border focus:ring-accent-ring"
                )}
              />

              {/* Counter + cost */}
              <div className="flex items-center justify-between mt-1.5 px-0.5">
                <div className="flex items-center gap-3 text-[11px]">
                  {segments > 0 && (
                    <span className="text-muted-foreground">
                      {segments} message{segments > 1 ? "s" : ""} — <span className="font-medium text-foreground">₱{cost.toFixed(2)}</span>
                    </span>
                  )}
                  {!hasEnoughCredits && chars > 0 && (
                    <span className="text-red-500 font-medium">Insufficient credits</span>
                  )}
                </div>
                <span className={cn("text-[11px] font-medium tabular-nums", counterColor)}>
                  {chars}/{MAX_CHARS}
                </span>
              </div>

              {/* Segment hint */}
              {chars > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all",
                        i < segments
                          ? segments === 1
                            ? "bg-green-400"
                            : segments === 2
                            ? "bg-amber-400"
                            : "bg-red-400"
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              )}
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
                    <MessageSquare className="h-4 w-4" />
                    Send SMS
                  </>
                )}
              </button>
            </div>

            {/* Tanga-Proof hint */}
            <p className="text-[10px] text-muted-foreground text-center -mt-1">
              159 chars = 1 message = ₱0.50. A barangay sender header is added automatically.
            </p>

          </div>
        )}
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}
