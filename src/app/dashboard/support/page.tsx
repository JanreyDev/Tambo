"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, X } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

const tickets = [
  { id: "TKT-042", subject: "Cannot generate barangay clearance PDF", product: "BCMP", barangay: "Brgy. Tambo", priority: "High", status: "Open", created: "30 min ago", pColor: "#ef4444" },
  { id: "TKT-041", subject: "Request for 3 additional user accounts", product: "BCMP", barangay: "Brgy. San Jose", priority: "Medium", status: "In Progress", created: "2 hrs ago", pColor: "#f59e0b" },
  { id: "TKT-040", subject: "SMS credits running low - need top up", product: "BCMP", barangay: "Brgy. Mabayuan", priority: "Low", status: "Open", created: "5 hrs ago", pColor: "#3b82f6" },
  { id: "TKT-039", subject: "Data sync error with province dashboard", product: "LGMP", barangay: "PGO Tarlac", priority: "High", status: "In Progress", created: "1 day ago", pColor: "#ef4444" },
  { id: "TKT-038", subject: "Cannot log in after password change", product: "BCMP", barangay: "Brgy. East Bajac-Bajac", priority: "Urgent", status: "Resolved", created: "2 days ago", pColor: "#dc2626" },
];

export default function SupportPage() {
  const [selected, setSelected] = useState<typeof tickets[0] | null>(null);
  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>System</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Support</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Cross-product support management</p>
      </div>

      <MabiniInsightBanner message="Average response time is 2.4 hours. 2 high-priority tickets need immediate attention — TKT-042 and TKT-039." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Open", value: 2, color: "#3b82f6" },
          { label: "In Progress", value: 2, color: "#f59e0b" },
          { label: "Resolved", value: 1, color: "#22c55e" },
          { label: "Avg Response", value: "2.4 hrs", color: "#ea580c" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {tickets.map((t) => (
            <div key={t.id} onClick={() => setSelected(t)}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.pColor }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{t.id}</span>
                  <p className="text-xs font-medium text-foreground truncate">{t.subject}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium text-muted-foreground">{t.product}</span>
                  <span className="text-[10px] text-muted-foreground">{t.barangay} | {t.created}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                t.status === "Open" ? "bg-blue-500/10 text-blue-600" :
                t.status === "In Progress" ? "bg-amber-500/10 text-amber-600" :
                "bg-emerald-500/10 text-emerald-600"
              }`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground">{selected.id}</span>
                <h2 className="text-sm font-bold text-foreground mt-0.5">{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Product", value: selected.product },
                { label: "Source", value: selected.barangay },
                { label: "Priority", value: selected.priority },
                { label: "Status", value: selected.status },
                { label: "Created", value: selected.created },
              ].map((f) => (
                <div key={f.label} className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                  <span className="text-xs font-medium text-foreground">{f.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <textarea placeholder="Type a reply..." rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none" />
              <button className="mt-2 w-full py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-semibold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/20">
                Send Reply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
