"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ChevronRight,
  MapPin,
  X,
  Loader2,
  Users,
  FileText,
  MessageSquare,
  Sparkles,
  HardDrive,
  RefreshCw,
  AlertCircle,
  Phone,
  Map,
  Calendar,
  Shield,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";
import {
  bcmpApi,
  type BarangayListItem,
  type BarangayDetail,
  type CreateBarangayPayload,
  type SubscriptionTier,
  type OnboardRole,
  type PsgcProvince,
  type PsgcCity,
  type PsgcBarangay,
  SUBSCRIPTION_TIERS,
  BcmpApiError,
} from "@/lib/bcmp-api";
import { SearchableCombobox, type ComboboxOption } from "@/components/searchable-combobox";

const statusColors: Record<string, string> = {
  active: "#22c55e",
  suspended: "#94a3b8",
  deactivated: "#ef4444",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  deactivated: "Deactivated",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function storagePercent(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
}

/** Render Baybayin tier with tooltip */
function TierBadge({ plan }: { plan: string }) {
  const tier = SUBSCRIPTION_TIERS[plan as SubscriptionTier];
  if (!tier) return <span className="text-[10px] text-muted-foreground capitalize">{plan}</span>;
  return (
    <span className="group relative inline-flex items-center gap-1">
      <span className="text-sm font-medium" title={`${tier.label} - ${tier.description}`}>
        {tier.baybayin}
      </span>
      <span className="text-[10px] text-muted-foreground">{tier.label}</span>
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
        {tier.baybayin} = {tier.label} ({tier.storage})
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  );
}

export default function BcmpTenantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [barangays, setBarangays] = useState<BarangayListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedDetail, setSelectedDetail] = useState<BarangayDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchBarangays = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: "50" };
      if (search) params.search = search;
      if (filter !== "all") params.status = filter;

      const response = await bcmpApi.tenants.list(params);
      setBarangays(response.data);
      setTotal(response.total);
    } catch (err) {
      if (err instanceof BcmpApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to fetch barangays.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchBarangays();
  }, [fetchBarangays]);

  const handleSelectTenant = (id: string) => {
    router.push(`/dashboard/bcmp/tenants/${id}`);
  };

  const counts: Record<string, number> = {
    all: total,
    active: barangays.filter((b) => b.status === "active").length,
    suspended: barangays.filter((b) => b.status === "suspended").length,
    deactivated: barangays.filter((b) => b.status === "deactivated").length,
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>BCMP</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Barangay Tenants</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Barangay Tenants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all registered barangays on kapitan.ph
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBarangays}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Barangay
          </button>
        </div>
      </div>

      {total > 0 && (
        <MabiniInsightBanner
          message={`${total} barangay${total !== 1 ? "s" : ""} registered. ${counts.active} active, ${counts.suspended} suspended.`}
        />
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-2">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {status === "all" ? "All" : statusLabels[status] || status} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search barangays by name, PSGC, or address..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : barangays.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No barangays found.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-amber-700 transition-all"
          >
            Onboard First Barangay
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
            <span>Barangay</span>
            <span className="w-16 text-center">Status</span>
            <span className="w-14 text-center">Users</span>
            <span className="w-20 text-center">Residents</span>
            <span className="w-28 text-center">Tier</span>
            <span className="w-20 text-right">Storage</span>
          </div>
          <div className="divide-y divide-border">
            {barangays.map((b) => (
              <div
                key={b.id}
                onClick={() => handleSelectTenant(b.id)}
                className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Double logo: barangay + municipality */}
                  <div className="relative shrink-0 w-11 h-9">
                    {/* Barangay logo (front) */}
                    {b.logo_url ? (
                      <img
                        src={b.logo_url}
                        alt={`${b.name} logo`}
                        className="absolute left-0 top-0 w-9 h-9 rounded-full object-cover border-2 border-card z-10"
                      />
                    ) : (
                      <div
                        className="absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-card z-10"
                        style={{ background: statusColors[b.status] || "#94a3b8" }}
                      >
                        {b.name.charAt(0)}
                      </div>
                    )}
                    {/* Municipality seal (behind, offset right) */}
                    {b.seal_url ? (
                      <img
                        src={b.seal_url}
                        alt="Municipality seal"
                        className="absolute right-0 top-0 w-7 h-7 rounded-full object-cover border-2 border-card opacity-80"
                      />
                    ) : (
                      <div className="absolute right-0 top-0 w-7 h-7 rounded-full bg-slate-700 border-2 border-card flex items-center justify-center">
                        <Landmark className="w-3 h-3 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {b.full_address || b.psgc_code}
                    </p>
                  </div>
                </div>
                <span className="w-16 text-center">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: `${statusColors[b.status]}15`,
                      color: statusColors[b.status],
                    }}
                  >
                    {statusLabels[b.status] || b.status}
                  </span>
                </span>
                <span className="w-14 text-center text-xs font-medium text-foreground">
                  {b.users_count}
                </span>
                <span className="w-20 text-center text-xs font-medium text-foreground">
                  {b.residents_count.toLocaleString()}
                </span>
                <span className="w-28 text-center">
                  <TierBadge plan={b.subscription_plan} />
                </span>
                <span className="w-20 text-right text-[10px] text-muted-foreground">
                  {formatBytes(b.storage_used_bytes ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {(selectedDetail || loadingDetail) && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedDetail(null)} />
          <div className="fixed right-0 top-0 h-full w-[500px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
            {loadingDetail && !selectedDetail ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedDetail ? (
              <DetailDrawer
                detail={selectedDetail}
                onClose={() => setSelectedDetail(null)}
                onRefresh={() => handleSelectTenant(selectedDetail.id)}
              />
            ) : null}
          </div>
        </>
      )}

      {/* Add Barangay Form */}
      {showAddForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowAddForm(false)} />
          <div className="fixed right-0 top-0 h-full w-[520px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
            <AddBarangayForm
              onClose={() => setShowAddForm(false)}
              onSuccess={() => {
                setShowAddForm(false);
                fetchBarangays();
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Detail Drawer ──

function DetailDrawer({
  detail,
  onClose,
  onRefresh,
}: {
  detail: BarangayDetail;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "accounts" | "credits" | "settings">("overview");
  const [updating, setUpdating] = useState(false);

  const handleStatusToggle = async () => {
    const newStatus = detail.status === "active" ? "suspended" : "active";
    setUpdating(true);
    try {
      await bcmpApi.tenants.update(detail.id, { status: newStatus } as Partial<BarangayDetail>);
      toast.success(`${detail.name} ${newStatus === "active" ? "activated" : "suspended"}.`);
      onRefresh();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const pct = storagePercent(detail.storage_used_bytes, detail.storage_limit_bytes);
  const storageColor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-foreground truncate">{detail.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{detail.full_address}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted shrink-0 ml-2">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Status + Tier row */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: `${statusColors[detail.status]}15`,
            color: statusColors[detail.status],
          }}
        >
          {statusLabels[detail.status]}
        </span>
        <TierBadge plan={detail.subscription_plan} />
        <button
          onClick={handleStatusToggle}
          disabled={updating}
          className="ml-auto px-3 py-1 rounded-lg text-[10px] font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          {updating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : detail.status === "active" ? (
            "Suspend"
          ) : (
            "Activate"
          )}
        </button>
      </div>

      {/* Storage bar */}
      <div className="mb-4 p-3 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <HardDrive className="w-3 h-3" /> Storage
          </span>
          <span className="text-[10px] font-medium text-foreground">
            {formatBytes(detail.storage_used_bytes)} / {formatBytes(detail.storage_limit_bytes)} ({pct}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: storageColor }}
          />
        </div>
        {pct > 80 && (
          <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {pct > 90 ? "Storage critical -- approaching limit" : "Storage nearing limit -- consider upgrading tier"}
          </p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <MiniStat icon={Users} label="Users" value={detail.users_count} />
        <MiniStat icon={MapPin} label="Residents" value={detail.residents_count} />
        <MiniStat icon={FileText} label="Population" value={detail.population} />
        <MiniStat
          icon={Calendar}
          label="Expires"
          value={detail.subscription_expires_at ? new Date(detail.subscription_expires_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
          isText
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4">
        {(["overview", "accounts", "credits", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-orange-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          <InfoRow label="PSGC Code" value={detail.psgc_code} />
          <InfoRow label="Region PSGC" value={detail.region_psgc || "Not set"} />
          <InfoRow label="Province PSGC" value={detail.province_psgc || "Not set"} />
          <InfoRow label="Municipality PSGC" value={detail.municipality_psgc || "Not set"} />
          <InfoRow label="Contact Phone" value={detail.contact_phone || "Not set"} />
          <InfoRow label="Contact Email" value={detail.contact_email || "Not set"} />
          <InfoRow label="Land Area" value={detail.land_area_hectares ? `${detail.land_area_hectares} hectares` : "Not set"} />
          <InfoRow label="Officials Term" value={detail.officials_term || "Not set"} />
          <InfoRow label="Coordinates" value={detail.latitude && detail.longitude ? `${detail.latitude}, ${detail.longitude}` : "Not set"} />
          <InfoRow label="Created" value={new Date(detail.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })} />
          <InfoRow label="Last Updated" value={new Date(detail.updated_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })} />
        </div>
      )}

      {tab === "accounts" && (
        <div className="space-y-3">
          {detail.users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No user accounts yet.</p>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground mb-2">
                {detail.users.length} user{detail.users.length !== 1 ? "s" : ""} -- additional accounts created by kapitan inside V5
              </p>
              {detail.users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{user.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium mr-1">
                        <Shield className="w-2.5 h-2.5" /> {user.role}
                      </span>
                      {user.username} &middot; {user.status}
                    </p>
                    {user.last_login_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Last login: {new Date(user.last_login_at).toLocaleDateString("en-PH")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "credits" && (
        <div className="space-y-3">
          <CreditRow icon={MessageSquare} label="SMS Credits" value={detail.sms_credit_balance} color="#3b82f6" />
          <CreditRow icon={Sparkles} label="AI Credits" value={detail.ai_credit_balance} color="#a855f7" />
          <CreditRow icon={Phone} label="Call Credits" value={detail.call_credit_balance} color="#22c55e" />
          <CreditRow icon={Map} label="Map Credits" value={detail.map_credit_balance} color="#f59e0b" />
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-3">
          {detail.settings && Object.keys(detail.settings).length > 0 ? (
            Object.entries(detail.settings).map(([key, val]) => (
              <InfoRow key={key} label={key.replace(/_/g, " ")} value={String(val)} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Default settings active.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  isText,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  isText?: boolean;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/30 text-center">
      <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
      <p className={`${isText ? "text-[10px]" : "text-sm"} font-bold text-foreground leading-tight`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function CreditRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground">{value.toLocaleString()}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground capitalize">{label}</span>
      <span className="text-xs font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

// ── Add Barangay Form ──

const ONBOARD_ROLES: { value: OnboardRole; label: string }[] = [
  { value: "kapitan", label: "Kapitan" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "councilor", label: "Councilor" },
];

function AddBarangayForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // ── PSGC cascading state ──
  const [provinces, setProvinces] = useState<ComboboxOption[]>([]);
  const [cities, setCities] = useState<ComboboxOption[]>([]);
  const [brgyOptions, setBrgyOptions] = useState<ComboboxOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBrgys, setLoadingBrgys] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBrgy, setSelectedBrgy] = useState("");

  // Raw PSGC data for lookup
  const [rawProvinces, setRawProvinces] = useState<PsgcProvince[]>([]);
  const [rawCities, setRawCities] = useState<PsgcCity[]>([]);
  const [rawBrgys, setRawBrgys] = useState<PsgcBarangay[]>([]);

  // Auto-filled from PSGC selection (editable except psgcCode and population)
  const [name, setName] = useState("");
  const [psgcCode, setPsgcCode] = useState("");
  const [population, setPopulation] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionTier>("munti");

  // Initial account fields
  const [kapRole, setKapRole] = useState<OnboardRole>("kapitan");
  const [kapFirstName, setKapFirstName] = useState("");
  const [kapMiddleName, setKapMiddleName] = useState("");
  const [kapLastName, setKapLastName] = useState("");
  const [kapExtName, setKapExtName] = useState("");
  const [kapPhone, setKapPhone] = useState("");

  // ── Load provinces on mount ──
  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);
    bcmpApi.psgc
      .provinces()
      .then((res) => {
        if (cancelled) return;
        setRawProvinces(res.data);
        setProvinces(
          res.data.map((p) => ({ value: p.psgc_code, label: p.name })),
        );
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load provinces.");
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Load cities when province changes ──
  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      setRawCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    setSelectedCity("");
    setSelectedBrgy("");
    setBrgyOptions([]);
    setRawBrgys([]);
    clearAutoFill();

    bcmpApi.psgc
      .cities(selectedProvince)
      .then((res) => {
        if (cancelled) return;
        setRawCities(res.data);
        setCities(
          res.data.map((c) => ({
            value: c.psgc_code,
            label: c.name,
            sublabel: c.city_class ?? undefined,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load cities.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => { cancelled = true; };
  }, [selectedProvince]);

  // ── Load barangays when city changes ──
  useEffect(() => {
    if (!selectedCity) {
      setBrgyOptions([]);
      setRawBrgys([]);
      return;
    }
    let cancelled = false;
    setLoadingBrgys(true);
    setSelectedBrgy("");
    clearAutoFill();

    // Auto-fill zip code from city data
    const city = rawCities.find((c) => c.psgc_code === selectedCity);
    if (city?.zip_code) {
      setZipCode(city.zip_code);
    }

    bcmpApi.psgc
      .barangays(selectedCity)
      .then((res) => {
        if (cancelled) return;
        setRawBrgys(res.data);
        setBrgyOptions(
          res.data.map((b) => ({
            value: b.psgc_code,
            label: b.name,
            sublabel: b.population ? `Pop: ${b.population.toLocaleString()}` : undefined,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load barangays.");
      })
      .finally(() => {
        if (!cancelled) setLoadingBrgys(false);
      });
    return () => { cancelled = true; };
  }, [selectedCity]);

  function clearAutoFill() {
    setName("");
    setPsgcCode("");
    setPopulation("");
    setZipCode("");
    setCityName("");
    setProvinceName("");
  }

  // ── Auto-fill when barangay selected ──
  function handleBrgySelect(value: string) {
    setSelectedBrgy(value);
    const brgy = rawBrgys.find((b) => b.psgc_code === value);
    if (brgy) {
      setName(brgy.name);
      setPsgcCode(brgy.psgc_code);
      setPopulation(brgy.population ? String(brgy.population) : "");
    }
    // Auto-fill city/province display names from current selection
    const city = rawCities.find((c) => c.psgc_code === selectedCity);
    if (city) setCityName(city.name);
    const prov = rawProvinces.find((p) => p.psgc_code === selectedProvince);
    if (prov) setProvinceName(prov.name);
  }

  // ── Derive region/province/municipality PSGC codes ──
  function getRegionPsgc(): string | undefined {
    const prov = rawProvinces.find((p) => p.psgc_code === selectedProvince);
    return prov?.region_psgc;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    // Build full_address from editable fields
    const addressParts = [
      name ? `Barangay ${name}` : "",
      cityName,
      provinceName,
    ].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    const payload: CreateBarangayPayload = {
      name,
      psgc_code: psgcCode,
      municipality_psgc: selectedCity || undefined,
      province_psgc: selectedProvince || undefined,
      region_psgc: getRegionPsgc(),
      full_address: fullAddress || undefined,
      population: population ? parseInt(population, 10) : undefined,
      zip_code: zipCode || undefined,
      subscription_plan: subscriptionPlan,
      kapitan: {
        first_name: kapFirstName,
        last_name: kapLastName,
        middle_name: kapMiddleName || undefined,
        extension_name: kapExtName || undefined,
        phone: kapPhone,
        role: kapRole,
      },
    };

    try {
      const result = await bcmpApi.tenants.create(payload);
      const user = result.data.initial_user;
      if (result.data.sms_sent) {
        toast.success(
          `${result.data.barangay.name} onboarded! Login credentials sent to ${kapPhone}.`,
        );
      } else {
        toast.success(
          `${result.data.barangay.name} onboarded! SMS not sent -- copy credentials now.`,
          { duration: 15000 },
        );
        toast.info(
          `Username: ${user.username}\nPassword: ${user.password}`,
          { duration: 30000 },
        );
      }
      onSuccess();
    } catch (err) {
      if (err instanceof BcmpApiError) {
        if (err.errors) {
          setErrors(err.errors);
        }
        toast.error(err.message);
      } else {
        toast.error("Failed to onboard barangay.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (field: string) => {
    const e = errors[field];
    if (!e?.length) return null;
    return (
      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {e[0]}
      </p>
    );
  };

  const phoneValid = /^09\d{9}$/.test(kapPhone);
  const canSubmit = name && psgcCode && kapFirstName && kapLastName && phoneValid;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Onboard Barangay</h2>
          <p className="text-xs text-muted-foreground">Select location, set initial account, done.</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location Section -- Cascading PSGC Dropdowns */}
        <div>
          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">
            Location
          </h3>
          <div className="space-y-3">
            <SearchableCombobox
              label="Province *"
              options={provinces}
              value={selectedProvince}
              onChange={(val) => setSelectedProvince(val)}
              placeholder="Select province..."
              loading={loadingProvinces}
            />
            <SearchableCombobox
              label="City / Municipality *"
              options={cities}
              value={selectedCity}
              onChange={(val) => setSelectedCity(val)}
              placeholder={selectedProvince ? "Select city/municipality..." : "Select province first"}
              disabled={!selectedProvince}
              loading={loadingCities}
            />
            <SearchableCombobox
              label="Barangay *"
              options={brgyOptions}
              value={selectedBrgy}
              onChange={(val) => handleBrgySelect(val)}
              placeholder={selectedCity ? "Select barangay..." : "Select city first"}
              disabled={!selectedCity}
              loading={loadingBrgys}
              error={fieldError("psgc_code")}
            />
          </div>
        </div>

        {/* Auto-filled details (disabled inputs like new resident form) */}
        {selectedBrgy && (
          <div>
            <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">
              Barangay Details
            </h3>
            <div className="space-y-3">
              <FormInput
                label="Barangay Name"
                value={name}
                onChange={setName}
                placeholder="Auto-filled"
                error={fieldError("name")}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormInput
                  label="City / Municipality"
                  value={cityName}
                  onChange={setCityName}
                  placeholder="City name"
                />
                <FormInput
                  label="Province"
                  value={provinceName}
                  onChange={setProvinceName}
                  placeholder="Province name"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FormInput
                  label="Zip Code"
                  value={zipCode}
                  onChange={(val) => setZipCode(val.replace(/\D/g, "").slice(0, 4))}
                  placeholder="e.g. 2200"
                />
                <FormInput
                  label="PSGC Code"
                  value={psgcCode}
                  onChange={() => {}}
                  placeholder="Auto-filled"
                  disabled
                />
                <FormInput
                  label="Population"
                  value={population ? Number(population).toLocaleString() : "N/A"}
                  onChange={() => {}}
                  placeholder="N/A"
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tier */}
        <div>
          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">
            Subscription Tier
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][]).map(
              ([key, tier]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSubscriptionPlan(key)}
                  className={`p-3 rounded-lg border text-center transition-all group relative ${
                    subscriptionPlan === key
                      ? "border-orange-500 bg-orange-500/10 text-foreground ring-1 ring-orange-500/30"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  <p className="text-lg mb-0.5" title={`${tier.baybayin} = ${tier.label}`}>{tier.baybayin}</p>
                  <p className="text-xs font-semibold">{tier.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{tier.storage} storage</p>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {tier.baybayin} = &quot;{tier.label}&quot; in Baybayin script
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </span>
                </button>
              ),
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Default: Munti (5 GB). Upgrade available at renewal.
          </p>
        </div>

        {/* Initial Account */}
        <div>
          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">
            Initial Account
          </h3>
          <p className="text-[10px] text-muted-foreground mb-3">
            First user account for this barangay. Username and password are auto-generated and sent via SMS.
          </p>
          <div className="space-y-3">
            {/* Role selector */}
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Role *</label>
              <div className="flex gap-1.5">
                {ONBOARD_ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setKapRole(r.value)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      kapRole === r.value
                        ? "border-orange-500 bg-orange-500/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {fieldError("kapitan.role")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormInput label="First Name *" value={kapFirstName} onChange={setKapFirstName} placeholder="Ricardo" error={fieldError("kapitan.first_name")} />
              <FormInput label="Last Name *" value={kapLastName} onChange={setKapLastName} placeholder="Santos" error={fieldError("kapitan.last_name")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormInput label="Middle Name" value={kapMiddleName} onChange={setKapMiddleName} placeholder="Optional" error={fieldError("kapitan.middle_name")} />
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Suffix</label>
                <select
                  value={kapExtName}
                  onChange={(e) => setKapExtName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
                >
                  <option value="">None</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Sr.">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="V">V</option>
                </select>
                {fieldError("kapitan.extension_name")}
              </div>
            </div>
            <div>
              <FormInput
                label="Phone * (for SMS login credentials)"
                value={kapPhone}
                onChange={(val) => {
                  const digits = val.replace(/\D/g, "").slice(0, 11);
                  setKapPhone(digits);
                }}
                placeholder="09171234567"
                error={fieldError("kapitan.phone")}
              />
              {kapPhone && !phoneValid && (
                <p className="text-[10px] text-amber-400 mt-1">Must be 11 digits starting with 09 (e.g. 09171234567)</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Onboarding...
              </span>
            ) : (
              "Onboard Barangay"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-muted-foreground mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm rounded-lg border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 ${
          disabled ? "opacity-60 cursor-not-allowed bg-muted/50" : ""
        }`}
      />
      {error}
    </div>
  );
}
