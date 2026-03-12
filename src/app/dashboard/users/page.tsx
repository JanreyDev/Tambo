"use client";

import { Shield, ChevronRight } from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";

const adminUsers = [
  { name: "Jeager Manalo", email: "jeager@primex.ventures", role: "Super Admin", status: "Active", twoFa: true, lastLogin: "Just now" },
  { name: "Jerry Ballonado", email: "jerry@primex.ventures", role: "Admin", status: "Active", twoFa: false, lastLogin: "2 hrs ago" },
  { name: "Howard Garcia", email: "howard@primex.ventures", role: "Support", status: "Active", twoFa: false, lastLogin: "1 day ago" },
  { name: "Ryan Calvelo", email: "ryan@primex.ventures", role: "Viewer", status: "Active", twoFa: false, lastLogin: "3 days ago" },
];

const roleColors: Record<string, string> = {
  "Super Admin": "#ea580c",
  Admin: "#3b82f6",
  Support: "#22c55e",
  Viewer: "#94a3b8",
};

export default function UsersPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>System</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">Admin Users</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Admin Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">PrimeX team members with admin access across all products</p>
      </div>

      <MabiniInsightBanner message="All admin users have 2FA enabled. Consider enforcing 2FA for product-level users across BCMP and LGMP." />

      {/* Role summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(roleColors).map(([role, color]) => {
          const count = adminUsers.filter((u) => u.role === role).length;
          return (
            <div key={role} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs text-muted-foreground">{role}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {adminUsers.map((u) => (
            <div key={u.email} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                style={{ background: roleColors[u.role] }}>
                {u.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{u.name}</p>
                <p className="text-[11px] text-muted-foreground">{u.email}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: `${roleColors[u.role]}15`, color: roleColors[u.role] }}>
                {u.role}
              </span>
              <div className="flex items-center gap-1 w-20">
                <Shield className={`w-3.5 h-3.5 ${u.twoFa ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                <span className="text-[10px] text-muted-foreground">{u.twoFa ? "2FA On" : "2FA Off"}</span>
              </div>
              <span className="text-[10px] text-muted-foreground w-20 text-right">{u.lastLogin}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
