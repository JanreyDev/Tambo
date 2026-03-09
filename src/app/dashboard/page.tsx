"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { usePolling } from "@/hooks/use-polling";
import {
  mockAlerts,
  mockInsight,
  mockDroplets,
  mockDatabases,
  mockProductHealth,
  mockRevenue,
  mockDomains,
  mockDeployments,
  mockSecurityFeed,
  mockActivity,
} from "@/lib/mock-data";
import type {
  Alert,
  MabiniInsight,
  DropletMetrics,
  DatabaseStatus,
  ProductHealth,
  RevenueData,
  DomainStatus,
  Deployment,
  SecurityFeed,
  ActivityEvent,
} from "@/lib/types";

import { HeaderBar } from "@/components/header-bar";
import { MabiniPanel } from "@/components/mabini-panel";
import { AlertBanner } from "@/components/alert-banner";
import { MabiniInsightCard } from "@/components/mabini-insight";
import { DropletCard } from "@/components/droplet-card";
import { DatabaseCard } from "@/components/database-card";
import { ProductHealthCard } from "@/components/product-health-card";
import { RevenueChart } from "@/components/revenue-chart";
import { DomainRow } from "@/components/domain-row";
import { DeploymentRow } from "@/components/deployment-row";
import { SecurityStats } from "@/components/security-stats";
import { ActivityFeed } from "@/components/activity-feed";
import { SkeletonCard } from "@/components/skeleton";

import {
  Server,
  Database,
  Globe,
  GitBranch,
} from "lucide-react";

// Fetchers with mock fallback
async function fetchWithFallback<T>(path: string, fallback: T, signal: AbortSignal): Promise<T> {
  try {
    return await api.get<T>(path, { signal });
  } catch {
    return fallback;
  }
}

export default function DashboardPage() {
  const [isMabiniOpen, setIsMabiniOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );

  // Polling data sources
  const alerts = usePolling<Alert[]>({
    fetcher: (signal) =>
      fetchWithFallback("/founder/alerts", mockAlerts, signal),
    interval: 30000,
  });

  const insight = usePolling<MabiniInsight>({
    fetcher: (signal) =>
      fetchWithFallback("/founder/mabini/insights", mockInsight, signal),
    interval: 60000,
  });

  const droplets = usePolling<DropletMetrics[]>({
    fetcher: (signal) =>
      fetchWithFallback(
        "/founder/infrastructure/droplets",
        mockDroplets,
        signal,
      ),
    interval: 30000,
  });

  const databases = usePolling<DatabaseStatus[]>({
    fetcher: (signal) =>
      fetchWithFallback(
        "/founder/infrastructure/databases",
        mockDatabases,
        signal,
      ),
    interval: 30000,
  });

  const products = usePolling<ProductHealth[]>({
    fetcher: (signal) =>
      fetchWithFallback("/founder/products/health", mockProductHealth, signal),
    interval: 30000,
  });

  const revenue = usePolling<RevenueData[]>({
    fetcher: (signal) =>
      fetchWithFallback("/founder/revenue", mockRevenue, signal),
    interval: 300000,
  });

  const domains = usePolling<DomainStatus[]>({
    fetcher: (signal) =>
      fetchWithFallback(
        "/founder/infrastructure/domains",
        mockDomains,
        signal,
      ),
    interval: 60000,
  });

  const deployments = usePolling<Deployment[]>({
    fetcher: (signal) =>
      fetchWithFallback(
        "/founder/deployments/recent",
        mockDeployments,
        signal,
      ),
    interval: 30000,
  });

  const security = usePolling<SecurityFeed>({
    fetcher: (signal) =>
      fetchWithFallback("/founder/security/feed", mockSecurityFeed, signal),
    interval: 30000,
  });

  const activity = usePolling<ActivityEvent[]>({
    fetcher: (signal) =>
      fetchWithFallback("/founder/activity", mockActivity, signal),
    interval: 30000,
  });

  // Determine overall system status
  const systemStatus = (() => {
    const activeAlerts =
      alerts.data?.filter(
        (a) => !a.acknowledged && !dismissedAlerts.has(a.id),
      ) || [];
    if (activeAlerts.some((a) => a.severity === "critical")) return "error" as const;
    if (activeAlerts.some((a) => a.severity === "warning")) return "warning" as const;
    return "connected" as const;
  })();

  const handleAcknowledgeAlert = useCallback((id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id));
    api.post(`/founder/alerts/${id}/acknowledge`).catch(() => {});
  }, []);

  // Filter visible alerts
  const visibleAlerts =
    alerts.data?.filter(
      (a) => !a.acknowledged && !dismissedAlerts.has(a.id),
    ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderBar
        systemStatus={systemStatus}
        onToggleMabini={() => setIsMabiniOpen(!isMabiniOpen)}
        isMabiniOpen={isMabiniOpen}
      />

      {/* Mabini Panel */}
      <MabiniPanel
        isOpen={isMabiniOpen}
        onClose={() => setIsMabiniOpen(false)}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Section 2: Critical Alerts */}
        {visibleAlerts.length > 0 && (
          <section aria-label="Critical alerts">
            <div className="space-y-2">
              {visibleAlerts.map((alert) => (
                <AlertBanner
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledgeAlert}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Mabini Daily Brief */}
        <section aria-label="Mabini AI daily brief">
          <MabiniInsightCard
            insight={insight.data}
            isLoading={insight.isLoading}
          />
        </section>

        {/* Section 4: Infrastructure Grid */}
        <section aria-label="Infrastructure monitoring">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Server className="h-4 w-4 text-accent" />
            Infrastructure
          </h2>
          {droplets.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(droplets.data || []).map((droplet) => (
                <DropletCard key={droplet.id} droplet={droplet} />
              ))}
            </div>
          )}
        </section>

        {/* Section 5: Database Status */}
        <section aria-label="Database status">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Database className="h-4 w-4 text-accent" />
            Databases
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {databases.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[240px] flex-shrink-0">
                    <SkeletonCard />
                  </div>
                ))
              : (databases.data || []).map((db) => (
                  <DatabaseCard key={db.id} database={db} />
                ))}
          </div>
        </section>

        {/* Section 6: Product Health */}
        <section aria-label="Product health">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Product Health
          </h2>
          {products.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(products.data || []).map((product) => (
                <ProductHealthCard key={product.slug} health={product} />
              ))}
            </div>
          )}
        </section>

        {/* Section 7: Revenue Overview */}
        <section aria-label="Revenue overview">
          <RevenueChart data={revenue.data || mockRevenue} />
        </section>

        {/* Section 8: Domain Monitor */}
        <section aria-label="Domain monitoring">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe className="h-4 w-4 text-accent" />
            Domain Monitor
          </h2>
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Domain</th>
                  <th className="px-3 py-2.5 font-medium">SSL</th>
                  <th className="px-3 py-2.5 font-medium">Proxy</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium">Group</th>
                </tr>
              </thead>
              <tbody>
                {(domains.data || []).map((domain) => (
                  <DomainRow key={domain.domain} domain={domain} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 9 & 10: Deployments + Security (side by side) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Section 9: Deployment Feed */}
          <section aria-label="Recent deployments">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <GitBranch className="h-4 w-4 text-accent" />
              Recent Deployments
            </h2>
            <div className="space-y-2">
              {deployments.isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                : (deployments.data || []).map((deployment) => (
                    <DeploymentRow
                      key={deployment.id}
                      deployment={deployment}
                    />
                  ))}
            </div>
          </section>

          {/* Section 10: Security Feed */}
          <section aria-label="Security feed">
            <SecurityStats
              feed={security.data}
              isLoading={security.isLoading}
            />
          </section>
        </div>

        {/* Section 11: Activity Timeline */}
        <section aria-label="Activity timeline">
          <ActivityFeed
            events={activity.data}
            isLoading={activity.isLoading}
          />
        </section>
      </main>
    </div>
  );
}
