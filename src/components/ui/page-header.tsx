"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  /** When true, hides the live clock on the right. */
  hideClock?: boolean;
  className?: string;
}

function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const raf = requestAnimationFrame(update);
    const t = setInterval(update, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);
  return now;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  hideClock,
  className,
}: PageHeaderProps) {
  const now = useLiveClock();

  return (
    <div className={cn("mb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-[12px] text-muted-foreground mb-3 tracking-wide">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span
                  className={
                    i === breadcrumbs.length - 1
                      ? "text-foreground/80 font-medium"
                      : ""
                  }
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1
            className="text-[32px] sm:text-[36px] leading-[1.1] text-foreground tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-[13px] sm:text-sm text-muted-foreground mt-2 max-w-[640px] leading-relaxed">
              {description}
            </p>
          )}
          {/* Accent gradient rule — brand presence on every page header */}
          <div className="mt-4 h-px w-full max-w-[160px] bg-gradient-to-r from-blue-500/60 via-blue-400/30 to-transparent" />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {actions && <div className="flex items-center gap-2">{actions}</div>}
          {!hideClock && now && (
            <div className="text-right select-none hidden md:block">
              <p
                className="text-[26px] sm:text-[28px] leading-none text-foreground tabular-nums tracking-tight"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {now.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1.5">
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
