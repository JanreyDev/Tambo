"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Toast as ToastModel } from "../_lib/types";

export type { Toast as ToastModel } from "../_lib/types";

interface ToastContainerProps {
  toasts: ToastModel[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastModel; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dur = toast.duration ?? 5000;
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, dur);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const colors = {
    success: { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
    error:   { bg: "bg-red-50 dark:bg-red-950/40",         border: "border-red-200 dark:border-red-800",         icon: "text-red-600 dark:text-red-400",         bar: "bg-red-500" },
    warning: { bg: "bg-amber-50 dark:bg-amber-950/40",     border: "border-amber-200 dark:border-amber-800",     icon: "text-amber-600 dark:text-amber-400",     bar: "bg-amber-500" },
    info:    { bg: "bg-blue-50 dark:bg-blue-950/40",       border: "border-blue-200 dark:border-blue-800",       icon: "text-blue-600 dark:text-blue-400",       bar: "bg-blue-500" },
  }[toast.type];

  const Icon = toast.type === "success" ? CheckCircle : toast.type === "error" ? X : AlertTriangle;

  return (
    <div className={cn(
      "pointer-events-auto w-96 rounded-xl border shadow-2xl overflow-hidden transition-all duration-300",
      colors.bg, colors.border,
      exiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0 animate-in slide-in-from-right-5 fade-in"
    )}>
      <div className="flex items-start gap-3 p-4">
        <div className={cn("shrink-0 mt-0.5", colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.message && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toast.message}</p>}
        </div>
        <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 w-full bg-black/5 dark:bg-white/5">
        <div className={cn("h-full rounded-full", colors.bar)} style={{ animation: `shrink ${toast.duration ?? 5000}ms linear forwards` }} />
      </div>
    </div>
  );
}
