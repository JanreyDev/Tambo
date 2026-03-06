import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted" | "accent";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-foreground/10 text-foreground",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  muted: "bg-muted text-muted-foreground",
  accent: "bg-accent-bg text-accent-text",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-foreground/50": variant === "default",
            "bg-emerald-500": variant === "success",
            "bg-amber-500": variant === "warning",
            "bg-red-500": variant === "danger",
            "bg-blue-500": variant === "info",
            "bg-muted-foreground": variant === "muted",
            "bg-accent-primary": variant === "accent",
          })}
        />
      )}
      {children}
    </span>
  );
}

// Pre-mapped status badges for common patterns
const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "muted" },
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  deceased: { label: "Deceased", variant: "muted" },
  transferred: { label: "Transferred", variant: "info" },
  archived: { label: "Archived", variant: "muted" },
  filed: { label: "Filed", variant: "info" },
  settled: { label: "Settled", variant: "success" },
  closed: { label: "Closed", variant: "muted" },
  dismissed: { label: "Dismissed", variant: "muted" },
  mediation: { label: "Mediation", variant: "warning" },
  conciliation: { label: "Conciliation", variant: "warning" },
  arbitration: { label: "Arbitration", variant: "danger" },
  draft: { label: "Draft", variant: "muted" },
  released: { label: "Released", variant: "success" },
  revoked: { label: "Revoked", variant: "danger" },
  for_hearing: { label: "For Hearing", variant: "warning" },
  for_subpoena: { label: "For Subpoena", variant: "danger" },
  open: { label: "Open", variant: "info" },
  resolved: { label: "Resolved", variant: "success" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const mapped = statusMap[status] ?? { label: status, variant: "default" as BadgeVariant };
  return (
    <Badge variant={mapped.variant} dot className={className}>
      {mapped.label}
    </Badge>
  );
}
