"use client";

import { createContext, useContext, useCallback, useState, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────

type ToastType = "error" | "success" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

// ── Context ─────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ── Toast Item ──────────────────────────────────────────────────

const iconMap: Record<ToastType, typeof XCircle> = {
  error: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const styleMap: Record<ToastType, { icon: string; border: string; bg: string; progress: string }> = {
  error: {
    icon: "text-red-500",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    progress: "bg-red-500",
  },
  success: {
    icon: "text-emerald-500",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    progress: "bg-emerald-500",
  },
  warning: {
    icon: "text-amber-500",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    progress: "bg-amber-500",
  },
  info: {
    icon: "text-blue-500",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    progress: "bg-blue-500",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const Icon = iconMap[toast.type];
  const styles = styleMap[toast.type];

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Progress bar countdown
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 50);

    // Auto dismiss
    timerRef.current = setTimeout(handleDismiss, toast.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [toast.duration, handleDismiss]);

  return (
    <div
      className={`
        relative overflow-hidden w-[380px] max-w-[calc(100vw-2rem)]
        rounded-xl border ${styles.border} ${styles.bg}
        backdrop-blur-xl shadow-2xl shadow-black/10
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 mt-0.5">
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] w-full bg-border/30">
        <div
          className={`h-full ${styles.progress} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Provider ────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string, duration = 10000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration, createdAt: Date.now() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Toast container — bottom left */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
