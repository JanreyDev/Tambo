/* -------------------------------------------------------
   Command Center API response types
   ------------------------------------------------------- */

export interface FounderVerifyResponse {
  token: string;
  message: string;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  source: string;
  created_at: string;
  acknowledged: boolean;
}

export interface MabiniInsight {
  summary: string;
  analyzed_at: string;
  highlights: string[];
}

export interface MabiniMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface MabiniChatResponse {
  message: MabiniMessage;
}

export interface DropletMetrics {
  id: string;
  name: string;
  ip: string;
  status: "active" | "off" | "error";
  region: string;
  spec: string;
  cpu_percent: number;
  ram_percent: number;
  disk_percent: number;
  uptime_seconds: number;
}

export interface DatabaseStatus {
  id: string;
  name: string;
  engine: string;
  version: string;
  status: "online" | "offline" | "maintenance";
  connection_count: number;
  size_bytes: number;
  host: string;
}

export interface ProductHealth {
  product: string;
  slug: "bcmp" | "lgmp" | "pdmp";
  api_status: "healthy" | "degraded" | "unhealthy" | "unknown";
  response_time_ms: number;
  error_rate: number;
  active_users: number;
  last_checked_at: string;
}

export interface RevenueData {
  month: string;
  bcmp: number;
  lgmp: number;
  pdmp: number;
  total: number;
}

export interface DomainStatus {
  domain: string;
  ssl_status: "active" | "expired" | "pending";
  proxy_status: "proxied" | "dns_only";
  plan: string;
  product_group: string;
}

export interface Deployment {
  id: string;
  project_name: string;
  branch: string;
  status: "success" | "failed" | "running" | "pending";
  commit_message: string;
  triggered_by: string;
  created_at: string;
  duration_seconds: number | null;
}

export interface SecurityFeed {
  failed_logins_24h: number;
  blocked_requests_24h: number;
  suspicious_ips: SuspiciousIp[];
  last_updated_at: string;
}

export interface SuspiciousIp {
  ip: string;
  attempts: number;
  last_seen: string;
  country: string;
}

export interface ActivityEvent {
  id: string;
  action: string;
  actor: string;
  product: "bcmp" | "lgmp" | "pdmp" | "pulitika" | "system";
  description: string;
  timestamp: string;
}

export interface HeartbeatResponse {
  status: "ok";
  server_time: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
