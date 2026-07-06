"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  HardDrive,
  MessageSquare,
  Sparkles,
  Phone,
  Map,
  Calendar,
  AlertTriangle,
  Settings,
  Save,
  Loader2,
  Users,
  Database,
} from "lucide-react";
import { MabiniInsightBanner } from "@/components/mabini-insight-banner";
import { bcmpApi, SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/bcmp-api";

// ── Helpers ──

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function formatPeso(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: value % 1 === 0 ? 0 : 2 })}`;
}

function storagePercent(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.round((used / limit) * 100);
}

function storageColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#f59e0b";
  return "#22c55e";
}

const TIER_COLORS: Record<SubscriptionTier, string> = {
  munti: "#94a3b8",
  gitna: "#3b82f6",
  malaki: "#ea580c",
};

// ── Types ──

interface SubscriptionStats {
  total_barangays: number;
  active_barangays: number;
  tier_distribution: Record<SubscriptionTier, number>;
  tier_details: Record<
    SubscriptionTier,
    Array<{
      id: string;
      name: string;
      storage_used_bytes: number;
      storage_limit_bytes: number;
      users_count: number;
      residents_count: number;
      subscription_expires_at: string | null;
    }>
  >;
  storage: { total_used_bytes: number; total_limit_bytes: number };
  credits: { total_sms: number; total_ai: number; total_call: number; total_map: number };
  expiring_soon: number;
}

interface PricingConfig {
  munti_annual_price: string;
  gitna_annual_price: string;
  malaki_annual_price: string;
  sms_credit_price: string;
  ai_credit_price: string;
  call_credit_price: string;
  map_credit_price: string;
  storage_warning_threshold: string;
}

// ── Baybayin Tooltip ──

function BaybaynLabel({ tier }: { tier: SubscriptionTier }) {
  const info = SUBSCRIPTION_TIERS[tier];
  return (
    <span className="group relative cursor-help">
      <span className="text-2xl leading-none" style={{ fontFamily: "sans-serif" }}>
        {info.baybayin}
      </span>
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity z-50">
        &ldquo;{info.label}&rdquo; in Baybayin
      </span>
    </span>
  );
}

// ── Page ──

export default function BcmpSubscriptionsPage() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editPricing, setEditPricing] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showPricingPanel, setShowPricingPanel] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pricingRes] = await Promise.allSettled([
        bcmpApi.subscriptions.stats(),
        bcmpApi.subscriptions.pricing(),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (pricingRes.status === "fulfilled" && pricingRes.value?.data) {
        setPricing(pricingRes.value.data as unknown as PricingConfig);
        setEditPricing(pricingRes.value.data as unknown as Record<string, string>);
      }
    } catch {
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSavePricing(key: string) {
    setSavingKey(key);
    try {
      await bcmpApi.subscriptions.updatePricing(key, parseFloat(editPricing[key]));
      setPricing((prev) => (prev ? { ...prev, [key]: editPricing[key] } : prev));
      toast.success("Pricing updated");
    } catch {
      toast.error("Failed to update pricing");
      if (pricing) setEditPricing((prev) => ({ ...prev, [key]: (pricing as unknown as Record<string, string>)[key] }));
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalStorage = stats?.storage ?? { total_used_bytes: 0, total_limit_bytes: 0 };
  const totalStoragePct = storagePercent(totalStorage.total_used_bytes, totalStorage.total_limit_bytes);
  const totalRevenue =
    pricing && stats
      ? (stats.tier_distribution.munti ?? 0) * parseFloat(pricing.munti_annual_price || "0") +
        (stats.tier_distribution.gitna ?? 0) * parseFloat(pricing.gitna_annual_price || "0") +
        (stats.tier_distribution.malaki ?? 0) * parseFloat(pricing.malaki_annual_price || "0")
      : 0;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>BCMP</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Subscriptions</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Baybayin tier management, storage, and credit pricing
            </p>
          </div>
          <button
            onClick={() => setShowPricingPanel(!showPricingPanel)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-card border border-border hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Pricing Config
          </button>
        </div>
      </div>

      <MabiniInsightBanner
        message={
          stats?.expiring_soon
            ? `${stats.expiring_soon} barangay subscription${stats.expiring_soon > 1 ? "s" : ""} expiring within 30 days. Send renewal reminders before Dec 31.`
            : "All subscriptions are healthy. Tier upgrades available at annual renewal (Dec 31)."
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: "Annual Revenue",
            value: formatPeso(totalRevenue),
            icon: Database,
            color: "#3b82f6",
          },
          {
            label: "Total Storage",
            value: formatBytes(totalStorage.total_used_bytes),
            sub: `of ${formatBytes(totalStorage.total_limit_bytes)}`,
            icon: HardDrive,
            color: storageColor(totalStoragePct),
          },
          {
            label: "Active Barangays",
            value: String(stats?.active_barangays ?? 0),
            sub: `of ${stats?.total_barangays ?? 0} total`,
            icon: Users,
            color: "#22c55e",
          },
          {
            label: "Expiring Soon",
            value: String(stats?.expiring_soon ?? 0),
            sub: "within 30 days",
            icon: AlertTriangle,
            color: (stats?.expiring_soon ?? 0) > 0 ? "#ef4444" : "#94a3b8",
          },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}15` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            {s.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {(["munti", "gitna", "malaki"] as SubscriptionTier[]).map((tier) => {
          const info = SUBSCRIPTION_TIERS[tier];
          const count = stats?.tier_distribution[tier] ?? 0;
          const details = stats?.tier_details[tier] ?? [];
          const tierPrice = pricing ? parseFloat((pricing as unknown as Record<string, string>)[`${tier}_annual_price`] || "0") : 0;
          const tierStorageUsed = details.reduce((sum, b) => sum + b.storage_used_bytes, 0);
          const tierStorageLimit = details.reduce((sum, b) => sum + b.storage_limit_bytes, 0);
          const tierPct = storagePercent(tierStorageUsed, tierStorageLimit);

          return (
            <div key={tier} className="bg-card border border-border rounded-xl p-5">
              {/* Tier header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${TIER_COLORS[tier]}15` }}
                  >
                    <BaybaynLabel tier={tier} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{info.label}</h3>
                    <p className="text-[10px] text-muted-foreground">{info.description}</p>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `${TIER_COLORS[tier]}15`,
                    color: TIER_COLORS[tier],
                  }}
                >
                  {count}
                </span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-lg font-bold text-foreground">
                  {formatPeso(tierPrice)}
                  <span className="text-[10px] text-muted-foreground font-normal">/year</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Revenue: {formatPeso(tierPrice * count)}
                </p>
              </div>

              {/* Storage bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Storage: {formatBytes(tierStorageUsed)}</span>
                  <span>{formatBytes(tierStorageLimit)} allocated</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(tierPct, 100)}%`,
                      background: storageColor(tierPct),
                    }}
                  />
                </div>
              </div>

              {/* Barangay list */}
              {details.length > 0 ? (
                <div className="space-y-2">
                  {details.map((b) => {
                    const bPct = storagePercent(b.storage_used_bytes, b.storage_limit_bytes);
                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between py-1.5 border-t border-border"
                      >
                        <div>
                          <p className="text-xs font-medium text-foreground">{b.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {b.users_count ?? 0} users &middot; {(b.residents_count ?? 0).toLocaleString()} residents
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-medium" style={{ color: storageColor(bPct) }}>
                            {formatBytes(b.storage_used_bytes)}
                          </p>
                          {b.subscription_expires_at && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(b.subscription_expires_at).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No barangays on this tier</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Credits Overview */}
      {stats && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Platform Credit Balances</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "SMS Credits",
                value: (stats.credits?.total_sms ?? 0).toLocaleString(),
                icon: MessageSquare,
                color: "#3b82f6",
                price: pricing?.sms_credit_price,
              },
              {
                label: "AI Credits",
                value: (stats.credits?.total_ai ?? 0).toLocaleString(),
                icon: Sparkles,
                color: "#8b5cf6",
                price: pricing?.ai_credit_price,
              },
              {
                label: "Call Credits",
                value: (stats.credits?.total_call ?? 0).toLocaleString(),
                icon: Phone,
                color: "#22c55e",
                price: pricing?.call_credit_price,
              },
              {
                label: "Map Credits",
                value: (stats.credits?.total_map ?? 0).toLocaleString(),
                icon: Map,
                color: "#f59e0b",
                price: pricing?.map_credit_price,
              },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${c.color}15` }}
                >
                  <c.icon className="w-4 h-4" style={{ color: c.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.label}
                    {c.price && <span> &middot; {formatPeso(parseFloat(c.price))}/unit</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Config Panel */}
      {showPricingPanel && pricing && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Pricing Configuration</h3>
            <p className="text-[10px] text-muted-foreground">Changes apply immediately</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { key: "munti_annual_price", label: "Munti Annual", prefix: "₱" },
              { key: "gitna_annual_price", label: "Gitna Annual", prefix: "₱" },
              { key: "malaki_annual_price", label: "Malaki Annual", prefix: "₱" },
              { key: "sms_credit_price", label: "SMS Credit Price", prefix: "₱" },
              { key: "ai_credit_price", label: "AI Credit Price", prefix: "₱" },
              { key: "call_credit_price", label: "Call Credit Price", prefix: "₱" },
              { key: "map_credit_price", label: "Map Credit Price", prefix: "₱" },
              { key: "storage_warning_threshold", label: "Storage Warning %", prefix: "", suffix: "%" },
            ].map((field) => {
              const changed = editPricing[field.key] !== (pricing as unknown as Record<string, string>)[field.key];
              return (
                <div key={field.key}>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-1">
                    {field.label}
                  </label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      {field.prefix && (
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {field.prefix}
                        </span>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPricing[field.key] ?? ""}
                        onChange={(e) =>
                          setEditPricing((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className={`w-full rounded-lg border bg-background px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-orange-500/50 ${field.prefix ? "pl-6" : ""} ${
                          changed ? "border-orange-500" : "border-border"
                        }`}
                      />
                    </div>
                    {changed && (
                      <button
                        onClick={() => handleSavePricing(field.key)}
                        disabled={savingKey === field.key}
                        className="px-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        {savingKey === field.key ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Storage includes everything: database, photos, documents, and attachments. Tier upgrade only available at renewal (December 31 annually).
          </p>
        </div>
      )}
    </div>
  );
}
