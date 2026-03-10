"use client";

import { Sparkles } from "lucide-react";

export function MabiniInsightBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-950/20 border border-orange-800/30">
      <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-orange-600" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">
          Mabini AI Insight
        </p>
        <p className="text-xs text-orange-400/80">{message}</p>
      </div>
    </div>
  );
}
