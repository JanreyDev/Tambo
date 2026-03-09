import { cn } from "@/lib/utils";
import { Lock, Globe, Shield } from "lucide-react";
import type { DomainStatus } from "@/lib/types";

interface DomainRowProps {
  domain: DomainStatus;
  className?: string;
}

export function DomainRow({ domain, className }: DomainRowProps) {
  return (
    <tr className={cn("border-b border-card-border text-xs transition-colors hover:bg-surface-elevated/50", className)}>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="font-metrics font-medium text-foreground">
            {domain.domain}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1",
            domain.ssl_status === "active"
              ? "text-status-green"
              : domain.ssl_status === "expired"
                ? "text-status-red"
                : "text-status-amber",
          )}
        >
          <Lock className="h-3 w-3" />
          {domain.ssl_status}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1",
            domain.proxy_status === "proxied"
              ? "text-status-green"
              : "text-muted-foreground",
          )}
        >
          <Shield className="h-3 w-3" />
          {domain.proxy_status === "proxied" ? "Proxied" : "DNS Only"}
        </span>
      </td>
      <td className="px-3 py-2.5 text-muted-foreground">
        {domain.plan}
      </td>
      <td className="px-3 py-2.5 text-muted-foreground">
        {domain.product_group}
      </td>
    </tr>
  );
}
