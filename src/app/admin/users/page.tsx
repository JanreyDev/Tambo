"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  Key,
  Monitor,
  Globe,
  Building2,
} from "lucide-react";

type UserRole = "Super Admin" | "Admin" | "Support" | "Viewer";
type UserStatus = "Active" | "Inactive" | "Locked";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  lastIP: string;
  createdAt: string;
  tenantsAccess: string;
  twoFactor: boolean;
  avatar: string;
}

const users: AdminUser[] = [
  { id: "USR-001", name: "Jeager Manalo", email: "jeager@primex.ventures", phone: "09171234567", role: "Super Admin", status: "Active", lastLogin: "2 min ago", lastIP: "103.214.xx.xx", createdAt: "2024-01-01", tenantsAccess: "All (52)", twoFactor: true, avatar: "JM" },
  { id: "USR-002", name: "Jerry Ballonado", email: "jerry@primex.ventures", phone: "09181234567", role: "Admin", status: "Active", lastLogin: "1 hr ago", lastIP: "49.145.xx.xx", createdAt: "2024-03-15", tenantsAccess: "All (52)", twoFactor: false, avatar: "JB" },
  { id: "USR-003", name: "Howard Garcia", email: "howard@primex.ventures", phone: "09191234567", role: "Support", status: "Active", lastLogin: "3 hrs ago", lastIP: "119.93.xx.xx", createdAt: "2024-06-01", tenantsAccess: "Assigned (12)", twoFactor: false, avatar: "HG" },
  { id: "USR-004", name: "Ryan Calvelo", email: "ryan@primex.ventures", phone: "09201234567", role: "Viewer", status: "Active", lastLogin: "2 days ago", lastIP: "210.4.xx.xx", createdAt: "2024-01-15", tenantsAccess: "Assigned (38)", twoFactor: true, avatar: "RC" },
  { id: "USR-005", name: "Claude AI", email: "claude@primex.ventures", phone: "N/A", role: "Super Admin", status: "Active", lastLogin: "Just now", lastIP: "System", createdAt: "2026-03-06", tenantsAccess: "All (52)", twoFactor: true, avatar: "CA" },
];

const roleConfig: Record<UserRole, { icon: React.ElementType; color: string }> = {
  "Super Admin": { icon: ShieldCheck, color: "#ef4444" },
  Admin: { icon: Shield, color: "#3b82f6" },
  Support: { icon: ShieldAlert, color: "#f59e0b" },
  Viewer: { icon: Globe, color: "#64748b" },
};

const statusColors: Record<UserStatus, string> = {
  Active: "#22c55e",
  Inactive: "#94a3b8",
  Locked: "#ef4444",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage administrator accounts and permissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Admin User
        </button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {(["Super Admin", "Admin", "Support", "Viewer"] as UserRole[]).map((role) => {
          const rc = roleConfig[role];
          const RoleIcon = rc.icon;
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{role}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${rc.color}12` }}>
                  <RoleIcon className="w-4.5 h-4.5" style={{ color: rc.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name, email, or role..."
          className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_120px_100px_48px] gap-3 px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
          <span>User</span>
          <span className="text-center">Role</span>
          <span className="text-center">Status</span>
          <span className="text-center">2FA</span>
          <span className="text-right">Last Login</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {filtered.map((u) => {
            const rc = roleConfig[u.role];
            const RoleIcon = rc.icon;
            return (
              <div key={u.id} onClick={() => setSelectedUser(u)}
                className="grid grid-cols-[1fr_120px_100px_120px_100px_48px] gap-3 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {u.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${rc.color}15`, color: rc.color }}>
                    <RoleIcon className="w-3 h-3" />
                    {u.role}
                  </span>
                </div>
                <div className="flex justify-center">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${statusColors[u.status]}15`, color: statusColors[u.status] }}>
                    {u.status}
                  </span>
                </div>
                <div className="flex justify-center">
                  {u.twoFactor ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Disabled
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground text-right">{u.lastLogin}</span>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors justify-self-center" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Detail Drawer */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedUser(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-card border-l border-border z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">{selectedUser.name}</h2>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-muted">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white">
                  {selectedUser.avatar}
                </div>
                <div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${roleConfig[selectedUser.role].color}15`, color: roleConfig[selectedUser.role].color }}>
                    {selectedUser.role}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{selectedUser.id}</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Email", value: selectedUser.email, icon: Mail },
                  { label: "Phone", value: selectedUser.phone, icon: Phone },
                  { label: "Tenant Access", value: selectedUser.tenantsAccess, icon: Building2 },
                  { label: "Last Login", value: selectedUser.lastLogin, icon: Clock },
                  { label: "Last IP", value: selectedUser.lastIP, icon: Monitor },
                  { label: "Created", value: selectedUser.createdAt, icon: Calendar },
                  { label: "2FA Status", value: selectedUser.twoFactor ? "Enabled" : "Disabled", icon: Key },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-6">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit User
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                  <Key className="w-3.5 h-3.5" /> Reset Password
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
