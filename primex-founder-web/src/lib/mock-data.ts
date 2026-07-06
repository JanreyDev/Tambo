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
} from "./types";

export const mockAlerts: Alert[] = [
  {
    id: "alert-1",
    severity: "warning",
    title: "High RAM Usage Detected",
    description:
      "RAM usage on a production droplet has been above 85% for the last 2 hours. Consider investigating memory-heavy processes.",
    source: "infrastructure-monitor",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
];

export const mockInsight: MabiniInsight = {
  summary:
    "All systems operational on production. Core apps running on primex-production. Revenue stable. No critical security incidents.",
  analyzed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  highlights: [
    "All core apps live on production",
    "Staging infrastructure eliminated",
    "Next priority: Full Mabini AI integration with live data",
  ],
};

export const mockDroplets: DropletMetrics[] = [
  {
    id: "primex-production",
    name: "primex-production",
    ip: "private",
    status: "active",
    region: "SGP1",
    spec: "2vCPU / 4GB",
    cpu_percent: 12,
    ram_percent: 19,
    disk_percent: 6,
    uptime_seconds: 604800,
  },
  {
    id: "legacy-production",
    name: "legacy-production",
    ip: "private",
    status: "active",
    region: "SGP1",
    spec: "2vCPU / 4GB",
    cpu_percent: 13,
    ram_percent: 85,
    disk_percent: 42,
    uptime_seconds: 2592000,
  },
  {
    id: "venture-production",
    name: "venture-production",
    ip: "private",
    status: "active",
    region: "SGP1",
    spec: "2vCPU / 2GB",
    cpu_percent: 3,
    ram_percent: 52,
    disk_percent: 25,
    uptime_seconds: 1728000,
  },
];

export const mockDatabases: DatabaseStatus[] = [
  {
    id: "db-mysql-v4",
    name: "db-mysql-v4",
    engine: "MySQL",
    version: "8.0",
    status: "online",
    connection_count: 24,
    size_bytes: 2147483648,
    host: "private",
  },
  {
    id: "primex-db",
    name: "primex-db",
    engine: "PostgreSQL",
    version: "18",
    status: "online",
    connection_count: 12,
    size_bytes: 134217728,
    host: "private",
  },
  {
    id: "tarlac-db",
    name: "tarlac-db",
    engine: "PostgreSQL",
    version: "18",
    status: "online",
    connection_count: 12,
    size_bytes: 536870912,
    host: "private",
  },
];

export const mockProductHealth: ProductHealth[] = [
  {
    product: "Kapitan.ph V5",
    slug: "bcmp",
    api_status: "healthy",
    response_time_ms: 142,
    error_rate: 0.1,
    active_users: 0,
    last_checked_at: new Date().toISOString(),
  },
  {
    product: "Tarlac.ph",
    slug: "lgmp",
    api_status: "healthy",
    response_time_ms: 89,
    error_rate: 0.3,
    active_users: 0,
    last_checked_at: new Date().toISOString(),
  },
  {
    product: "PDMP",
    slug: "pdmp",
    api_status: "unknown",
    response_time_ms: 0,
    error_rate: 0,
    active_users: 0,
    last_checked_at: new Date().toISOString(),
  },
];

export const mockRevenue: RevenueData[] = [
  { month: "Oct 2025", bcmp: 0, lgmp: 0, pdmp: 0, total: 0 },
  { month: "Nov 2025", bcmp: 0, lgmp: 0, pdmp: 0, total: 0 },
  { month: "Dec 2025", bcmp: 0, lgmp: 0, pdmp: 0, total: 0 },
  { month: "Jan 2026", bcmp: 0, lgmp: 0, pdmp: 0, total: 0 },
  { month: "Feb 2026", bcmp: 0, lgmp: 0, pdmp: 0, total: 0 },
  { month: "Mar 2026", bcmp: 0, lgmp: 0, pdmp: 0, total: 0 },
];

export const mockDomains: DomainStatus[] = [
  { domain: "kapitan.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "BCMP" },
  { domain: "kabataan.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "BCMP" },
  { domain: "barangay.org.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "BCMP" },
  { domain: "primex.ventures", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "Corporate" },
  { domain: "tarlac.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "LGMP" },
  { domain: "spacall.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "SPACALL" },
  { domain: "barangaymo.com", ssl_status: "active", proxy_status: "proxied", plan: "Pro", product_group: "Barangaymo" },
  { domain: "vantagehunt.com", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "VantageHunt" },
  { domain: "robes.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "PDMP" },
  { domain: "sdn.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "Legacy" },
  { domain: "gobernor.ph", ssl_status: "active", proxy_status: "dns_only", plan: "Free", product_group: "Parked" },
  { domain: "kongreso.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "Parked" },
  { domain: "senador.ph", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "Parked" },
  { domain: "gpptradingandservices.com", ssl_status: "active", proxy_status: "proxied", plan: "Free", product_group: "External" },
];

export const mockDeployments: Deployment[] = [
  {
    id: "deploy-1",
    project_name: "bcmp-web",
    branch: "main",
    status: "success",
    commit_message: "Apply 12 Non-Negotiable Principles to all 21 dashboard pages",
    triggered_by: "Claude",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    duration_seconds: 94,
  },
  {
    id: "deploy-2",
    project_name: "bcmp-api",
    branch: "main",
    status: "success",
    commit_message: "Add Smart Photo System with tanga-proof camera error handling",
    triggered_by: "Claude",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duration_seconds: 68,
  },
  {
    id: "deploy-3",
    project_name: "primex-founder-web",
    branch: "main",
    status: "success",
    commit_message: "Orange accent color scheme applied, Command Center landing",
    triggered_by: "Claude",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    duration_seconds: 82,
  },
  {
    id: "deploy-4",
    project_name: "primex-api",
    branch: "main",
    status: "success",
    commit_message: "Deploy with PHP-FPM + Nginx, Pest tests passing",
    triggered_by: "Claude",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    duration_seconds: 55,
  },
];

export const mockSecurityFeed: SecurityFeed = {
  failed_logins_24h: 0,
  blocked_requests_24h: 0,
  suspicious_ips: [],
  last_updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
};

export const mockActivity: ActivityEvent[] = [
  {
    id: "act-1",
    action: "CI/CD Pipeline Passed",
    actor: "Claude",
    product: "bcmp",
    description: "bcmp-web deployed to kapitan.ph successfully",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "act-2",
    action: "Tests Passed",
    actor: "Claude",
    product: "bcmp",
    description: "All Pest tests green on bcmp-api main branch",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "act-3",
    action: "Documentation Updated",
    actor: "Claude",
    product: "primex",
    description: "BCMP Master Doc updated with 29 pages across 5 sections",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act-4",
    action: "Infrastructure Consolidated",
    actor: "Claude",
    product: "system",
    description: "3 droplets consolidated into venture-production, saves $6/mo",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act-5",
    action: "Dev Team Pulled",
    actor: "Jeager",
    product: "system",
    description: "All development moved to Claude + Jeager. Dev team on standby.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];
