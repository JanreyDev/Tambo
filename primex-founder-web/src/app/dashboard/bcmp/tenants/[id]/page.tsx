"use client";

import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  FileText,
  Scale,
  Wallet,
  HardDrive,
  MessageSquare,
  Bot,
  Phone,
  Map,
  Shield,
  Building2,
  Home,
  Landmark,
  AlertTriangle,
  ClipboardList,
  UserCheck,
  Clock,
  TrendingUp,
  Activity,
  RefreshCw,
  Settings,
  Eye,
  Globe,
  Briefcase,
  Heart,
  Package,
  MapPin,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import {
  bcmpApi,
  type BarangayDetail,
  type BarangayStats,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@/lib/bcmp-api";

// ── Helpers ──

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function storagePercent(used: number, limit: number): number {
  return limit > 0 ? Math.round((used / limit) * 100) : 0;
}

// ── Stat Card ──

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-blue-400",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{typeof value === "number" ? formatNumber(value) : value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

// ── Module Section ──

function ModuleSection({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/50">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Row ──

function DataRow({ label, value }: { label: string; value: string | number | React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-white">{typeof value === "number" ? formatNumber(value) : value}</span>
    </div>
  );
}

// ── Credit Bar ──

function CreditBar({
  icon: Icon,
  label,
  balance,
  color,
}: {
  icon: React.ElementType;
  label: string;
  balance: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-bold text-white">
        {balance % 1 === 0 ? formatNumber(balance) : balance.toFixed(2)}
      </span>
    </div>
  );
}

// ── Main Page ──

export default function BarangayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<BarangayDetail | null>(null);
  const [stats, setStats] = useState<BarangayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReplenish, setShowReplenish] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, statsRes] = await Promise.all([bcmpApi.tenants.get(id), bcmpApi.tenants.stats(id)]);
      setDetail(detailRes.data);
      setStats(statsRes.data);
      toast.success("Barangay data refreshed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load barangay data.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !detail || !stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 mb-4">{error || "Barangay not found."}</p>
        <button onClick={() => router.push("/dashboard/bcmp/tenants")} className="text-orange-400 hover:text-orange-300 text-sm">
          Back to Tenants
        </button>
      </div>
    );
  }

  const tier = SUBSCRIPTION_TIERS[detail.subscription_plan as SubscriptionTier];
  const storagePct = storagePercent(detail.storage_used_bytes, detail.storage_limit_bytes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/bcmp/tenants")}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </button>
          {/* Barangay + Municipality logos */}
          <div className="relative shrink-0 w-16 h-14">
            {detail.logo_url ? (
              <img src={detail.logo_url} alt={`${detail.name} logo`} className="absolute left-0 top-0 w-14 h-14 rounded-full object-cover border-2 border-slate-800 z-10" />
            ) : (
              <div className="absolute left-0 top-0 w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-bold text-white border-2 border-slate-800 z-10">
                {detail.name.charAt(0)}
              </div>
            )}
            {detail.seal_url ? (
              <img src={detail.seal_url} alt="Municipality seal" className="absolute right-0 bottom-0 w-9 h-9 rounded-full object-cover border-2 border-slate-800 opacity-90" />
            ) : (
              <div className="absolute right-0 bottom-0 w-9 h-9 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{detail.name}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  detail.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : detail.status === "suspended"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                }`}
              >
                {detail.status}
              </span>
              {tier && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400">
                  {tier.baybayin} {tier.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">{detail.full_address || "No address set"}</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard icon={Users} label="Residents" value={stats.residents.total} sub={`${stats.residents.active} active`} color="text-blue-400" />
        <StatCard icon={Home} label="Households" value={stats.records.households} color="text-cyan-400" />
        <StatCard icon={FileText} label="Documents" value={stats.documents.total_issued} sub={`${stats.documents.this_month} this month`} color="text-emerald-400" />
        <StatCard icon={Scale} label="Blotters" value={stats.judicial.blotters} sub={`${stats.judicial.pending_blotters} pending`} color="text-amber-400" />
        <StatCard icon={Shield} label="KP Cases" value={stats.judicial.kp_cases} sub={`${stats.judicial.active_kp_cases} active`} color="text-red-400" />
        <StatCard icon={UserCheck} label="Officials" value={stats.officials.total} sub={`${stats.officials.tanods} tanods`} color="text-purple-400" />
        <StatCard icon={Briefcase} label="Employees" value={stats.hris.employees} color="text-indigo-400" />
        <StatCard icon={HardDrive} label="Storage" value={`${storagePct}%`} sub={`${formatBytes(detail.storage_used_bytes)} / ${formatBytes(detail.storage_limit_bytes)}`} color={storagePct >= 90 ? "text-red-400" : storagePct >= 80 ? "text-amber-400" : "text-emerald-400"} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Residents */}
          <ModuleSection title="Residents" icon={Users} color="text-blue-400">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-white">{formatNumber(stats.residents.active)}</div>
                <div className="text-xs text-emerald-400">Active</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-white">{formatNumber(stats.residents.inactive)}</div>
                <div className="text-xs text-slate-400">Inactive</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-white">{formatNumber(stats.residents.deceased)}</div>
                <div className="text-xs text-red-400">Deceased</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-white">{formatNumber(stats.residents.transferred)}</div>
                <div className="text-xs text-amber-400">Transferred</div>
              </div>
            </div>

            {/* Gender */}
            <div className="flex gap-4 mb-3">
              {Object.entries(stats.residents.gender_distribution).map(([sex, count]) => (
                <div key={sex} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${sex === "male" ? "bg-blue-500" : "bg-pink-500"}`} />
                  <span className="text-xs text-slate-400 capitalize">{sex}: {formatNumber(count)}</span>
                </div>
              ))}
            </div>

            {/* Age Groups */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.residents.age_groups).map(([range, count]) => (
                <div key={range} className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-xs">
                  <span className="text-slate-400">{range}:</span>{" "}
                  <span className="text-white font-medium">{formatNumber(count)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span>Voters: {formatNumber(stats.residents.voters)}</span>
              <span>Resident Voters: {formatNumber(stats.residents.resident_voters)}</span>
              <span>New (7d): {formatNumber(stats.residents.recent_7d)}</span>
            </div>
          </ModuleSection>

          {/* Records & Documents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ModuleSection title="Records" icon={ClipboardList} color="text-cyan-400">
              <DataRow label="Households" value={stats.records.households} />
              <DataRow label="Establishments" value={stats.records.establishments} />
              <DataRow label="Lots & Buildings" value={stats.records.lots_buildings} />
            </ModuleSection>

            <ModuleSection title="Documents" icon={FileText} color="text-emerald-400">
              <DataRow label="Total Issued" value={stats.documents.total_issued} />
              <DataRow label="This Month" value={stats.documents.this_month} />
              <DataRow label="Templates" value={stats.documents.templates} />
            </ModuleSection>
          </div>

          {/* Judicial */}
          <ModuleSection title="Peace & Order" icon={Scale} color="text-amber-400">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-lg font-bold text-white">{stats.judicial.blotters}</div>
                <div className="text-xs text-slate-400">Blotters</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10">
                <div className="text-lg font-bold text-amber-400">{stats.judicial.pending_blotters}</div>
                <div className="text-xs text-amber-400/70">Pending</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-lg font-bold text-white">{stats.judicial.kp_cases}</div>
                <div className="text-xs text-slate-400">KP Cases</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <div className="text-lg font-bold text-red-400">{stats.judicial.active_kp_cases}</div>
                <div className="text-xs text-red-400/70">Active KP</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-500/10">
                <div className="text-lg font-bold text-purple-400">{stats.judicial.vawc_cases}</div>
                <div className="text-xs text-purple-400/70">VAWC</div>
              </div>
            </div>
          </ModuleSection>

          {/* Finance & Assets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ModuleSection title="Finance" icon={Wallet} color="text-green-400">
              <DataRow label="Budgets" value={stats.finance.budgets} />
              <DataRow label="Disbursement Vouchers" value={stats.finance.disbursements} />
              <DataRow label="Payments" value={stats.finance.payments} />
            </ModuleSection>

            <ModuleSection title="Assets & Inventory" icon={Package} color="text-indigo-400">
              <DataRow label="Fixed Assets" value={stats.assets.total_assets} />
              <DataRow label="Inventory Items" value={stats.assets.inventory_items} />
            </ModuleSection>
          </div>

          {/* Officials & Safety */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ModuleSection title="Officials" icon={Landmark} color="text-purple-400">
              <DataRow label="Officials" value={stats.officials.total} />
              <DataRow label="Tanods" value={stats.officials.tanods} />
              <DataRow label="Incident Reports" value={stats.officials.incident_reports} />
            </ModuleSection>

            <ModuleSection title="Disaster" icon={AlertTriangle} color="text-orange-400">
              <DataRow label="Hazard Pins" value={stats.disaster.hazard_pins} />
              <DataRow label="Evacuations" value={stats.disaster.evacuations} />
            </ModuleSection>

            <ModuleSection title="Public Portal" icon={Globe} color="text-teal-400">
              <DataRow label="Complaints" value={stats.public_portal.complaints} />
            </ModuleSection>
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Barangay Info */}
          <ModuleSection title="Barangay Info" icon={Building2} color="text-orange-400">
            <DataRow label="PSGC Code" value={detail.psgc_code} />
            <DataRow label="Population" value={detail.population} />
            <DataRow label="Land Area" value={`${detail.land_area_hectares} ha`} />
            <DataRow label="Contact" value={detail.contact_phone || "—"} />
            <DataRow label="Email" value={detail.contact_email || "—"} />
            {detail.officials_term && <DataRow label="Officials Term" value={detail.officials_term} />}
            <DataRow
              label="Subscription"
              value={
                <span className="text-orange-400">
                  {tier?.label || detail.subscription_plan} — expires{" "}
                  {detail.subscription_expires_at ? formatDate(detail.subscription_expires_at) : "N/A"}
                </span>
              }
            />
          </ModuleSection>

          {/* Credits */}
          <ModuleSection title="Credits" icon={Wallet} color="text-emerald-400">
            <CreditBar icon={MessageSquare} label="SMS" balance={stats.credits.sms_balance} color="text-blue-400" />
            <CreditBar icon={Bot} label="Mabini AI" balance={stats.credits.ai_balance} color="text-purple-400" />
            <CreditBar icon={Phone} label="Call" balance={stats.credits.call_balance} color="text-emerald-400" />
            <CreditBar icon={Map} label="Map" balance={stats.credits.map_balance} color="text-amber-400" />
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">SMS This Month</div>
              <div className="flex gap-3 text-xs">
                <span className="text-slate-300">{stats.credits.sms_this_month.total} total</span>
                <span className="text-emerald-400">{stats.credits.sms_this_month.sent} sent</span>
                <span className="text-red-400">{stats.credits.sms_this_month.failed} failed</span>
                <span className="text-amber-400">₱{stats.credits.sms_this_month.cost.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowReplenish(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-semibold hover:from-orange-700 hover:to-amber-700 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Replenish Credits
            </button>
          </ModuleSection>

          {/* Replenish Credits Modal */}
          {showReplenish && (
            <ReplenishCreditsModal
              barangayId={detail.id}
              barangayName={detail.name}
              currentSms={stats.credits.sms_balance}
              currentAi={stats.credits.ai_balance}
              currentCall={stats.credits.call_balance}
              currentMap={stats.credits.map_balance}
              onClose={() => setShowReplenish(false)}
              onSuccess={() => {
                setShowReplenish(false);
                fetchData();
              }}
            />
          )}

          {/* Storage */}
          <ModuleSection title="Storage" icon={HardDrive} color="text-cyan-400">
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{formatBytes(detail.storage_used_bytes)} used</span>
                <span className="text-slate-400">{formatBytes(detail.storage_limit_bytes)} limit</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    storagePct >= 90 ? "bg-red-500" : storagePct >= 80 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(storagePct, 100)}%` }}
                />
              </div>
              <div className="text-center text-xs text-slate-500 mt-1">{storagePct}% — {formatNumber(stats.storage.total_files)} files</div>
            </div>
            {Object.keys(stats.storage.by_category).length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">By Category</div>
                {Object.entries(stats.storage.by_category).map(([cat, data]) => (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="text-slate-400 capitalize">{cat}</span>
                    <span className="text-slate-300">{data.count} files — {formatBytes(data.bytes)}</span>
                  </div>
                ))}
              </div>
            )}
          </ModuleSection>

          {/* User Accounts */}
          <ModuleSection title={`Accounts (${detail.users?.length || 0})`} icon={UserCheck} color="text-blue-400">
            {detail.users?.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <div>
                  <div className="text-sm text-white font-medium">{u.full_name}</div>
                  <div className="text-xs text-slate-500">{u.username} — {u.role}</div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${u.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {u.status}
                  </span>
                  {u.last_login_at && (
                    <div className="text-xs text-slate-500 mt-1">{formatDateTime(u.last_login_at)}</div>
                  )}
                </div>
              </div>
            ))}
            {(!detail.users || detail.users.length === 0) && (
              <div className="text-sm text-slate-500 text-center py-4">No accounts</div>
            )}
          </ModuleSection>

          {/* Recent Activity */}
          <ModuleSection title="Recent Activity" icon={Activity} color="text-orange-400">
            {stats.recent_activity.map((item, i) => (
              <div key={i} className="py-2 border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${item.type === "resident" ? "bg-blue-400" : "bg-emerald-400"}`} />
                  <span className="text-xs text-slate-300 truncate">{item.description}</span>
                </div>
                <div className="text-xs text-slate-500 ml-4">{formatDateTime(item.created_at)}</div>
              </div>
            ))}
            {stats.recent_activity.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">No recent activity</div>
            )}
          </ModuleSection>

          {/* Recent Sign-ins */}
          <ModuleSection title="Recent Sign-ins" icon={Eye} color="text-slate-400">
            {stats.recent_sign_ins.map((s, i) => (
              <div key={i} className="py-2 border-b border-slate-800/50 last:border-0">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-300">{s.user || "Unknown"}</span>
                  <span className="text-xs text-slate-500">{s.device_type}</span>
                </div>
                <div className="text-xs text-slate-500">{formatDateTime(s.created_at)} — {s.ip_address}</div>
              </div>
            ))}
            {stats.recent_sign_ins.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">No recent sign-ins</div>
            )}
          </ModuleSection>
        </div>
      </div>
    </div>
  );
}

// ── Replenish Credits Modal ──

function ReplenishCreditsModal({
  barangayId,
  barangayName,
  currentSms,
  currentAi,
  currentCall,
  currentMap,
  onClose,
  onSuccess,
}: {
  barangayId: string;
  barangayName: string;
  currentSms: number;
  currentAi: number;
  currentCall: number;
  currentMap: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [addSms, setAddSms] = useState("");
  const [addAi, setAddAi] = useState("");
  const [addCall, setAddCall] = useState("");
  const [addMap, setAddMap] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parseNum = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const hasChanges = parseNum(addSms) > 0 || parseNum(addAi) > 0 || parseNum(addCall) > 0 || parseNum(addMap) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setSubmitting(true);

    const updates: Record<string, number> = {};
    if (parseNum(addSms) > 0) updates.sms_credit_balance = currentSms + parseNum(addSms);
    if (parseNum(addAi) > 0) updates.ai_credit_balance = currentAi + parseNum(addAi);
    if (parseNum(addCall) > 0) updates.call_credit_balance = currentCall + parseNum(addCall);
    if (parseNum(addMap) > 0) updates.map_credit_balance = currentMap + parseNum(addMap);

    try {
      await bcmpApi.tenants.update(barangayId, updates as Partial<BarangayDetail>);
      const parts: string[] = [];
      if (parseNum(addSms) > 0) parts.push(`+${parseNum(addSms)} SMS`);
      if (parseNum(addAi) > 0) parts.push(`+${parseNum(addAi)} AI`);
      if (parseNum(addCall) > 0) parts.push(`+${parseNum(addCall)} Call`);
      if (parseNum(addMap) > 0) parts.push(`+${parseNum(addMap)} Map`);
      toast.success(`Credits added to ${barangayName}: ${parts.join(", ")}`);
      onSuccess();
    } catch {
      toast.error("Failed to replenish credits.");
    } finally {
      setSubmitting(false);
    }
  };

  const creditFields = [
    { label: "SMS Credits", icon: MessageSquare, color: "text-blue-400", current: currentSms, value: addSms, onChange: setAddSms },
    { label: "AI Credits", icon: Bot, color: "text-purple-400", current: currentAi, value: addAi, onChange: setAddAi },
    { label: "Call Credits", icon: Phone, color: "text-emerald-400", current: currentCall, value: addCall, onChange: setAddCall },
    { label: "Map Credits", icon: Map, color: "text-amber-400", current: currentMap, value: addMap, onChange: setAddMap },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md pointer-events-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <div>
              <h3 className="text-sm font-bold text-white">Replenish Credits</h3>
              <p className="text-xs text-slate-400">{barangayName}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {creditFields.map((f) => {
              const Icon = f.icon;
              const addAmount = parseNum(f.value);
              const newTotal = f.current + addAmount;
              return (
                <div key={f.label}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`h-4 w-4 ${f.color}`} />
                    <span className="text-xs font-medium text-slate-300">{f.label}</span>
                    <span className="text-xs text-slate-500 ml-auto">
                      Current: {f.current % 1 === 0 ? formatNumber(f.current) : f.current.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      placeholder="Amount to add"
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                    />
                    {addAmount > 0 && (
                      <span className="text-xs text-emerald-400 whitespace-nowrap">
                        = {newTotal % 1 === 0 ? formatNumber(newTotal) : newTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !hasChanges}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Add Credits"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
