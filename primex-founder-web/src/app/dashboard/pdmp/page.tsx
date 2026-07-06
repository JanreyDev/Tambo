"use client";

import { toast } from "sonner";
import { ChevronRight, Vote, Shield, Lock, Target } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

export default function PdmpPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>PDMP</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Campaigns</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">PDMP - Political Data Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Campaign intelligence and ground operations</p>
      </div>

      <MabiniInsightBanner message="2028 national elections are 2 years away. Start infrastructure planning and pilot client outreach now for a smooth launch." />

      {/* Status banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Vote className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Product in Planning Phase</h3>
            <p className="text-sm text-muted-foreground mt-1">
              PDMP is being redesigned as a standalone reusable product. No active campaigns at this time.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>RA 10173 compliance framework required</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Separate infrastructure from BCMP/LGMP</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Target: 1 paid pilot for 2028 elections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Previous deployments */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Previous Campaign Deployments</h3>
        <div className="space-y-3">
          {[
            { brand: "mayap.ph", client: "Tarlac Province (Yap campaign)", status: "Ended", year: "2025" },
            { brand: "robes.ph", client: "CSJDM, Bulacan", status: "Ended", year: "2025" },
          ].map((d) => (
            <div key={d.brand} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Vote className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{d.brand}</p>
                <p className="text-[11px] text-muted-foreground">{d.client}</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{d.year}</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 text-[10px] font-semibold">{d.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Planned Features */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Planned Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Voter profiling and segmentation",
            "Campaign CRM (contact tracking)",
            "Survey analytics and sentiment",
            "Ground operations tracking",
            "Beneficiary monitoring",
            "SMS and call voter contact",
            "Network mapping",
            "RA 10173 consent framework",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-xs text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
