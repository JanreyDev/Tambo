"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFounderAuth } from "@/contexts/founder-auth-context";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { HeartbeatResponse } from "@/lib/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isChecking } = useFounderAuth();
  const router = useRouter();

  // Redirect to passcode if not authenticated
  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace("/passcode");
    }
  }, [isAuthenticated, isChecking, router]);

  // API heartbeat every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const heartbeat = () => {
      api
        .get<HeartbeatResponse>("/founder/heartbeat")
        .catch(() => {
          // Token expired or API unreachable -- handled by api.ts 401 logic
        });
    };

    const timer = setInterval(heartbeat, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border px-6 py-3 text-[11px] text-muted-foreground/60 flex items-center justify-between">
          <span>Copyright 2015-{new Date().getFullYear()} All Rights Reserved | PrimeX Ventures Inc.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            v1.0.0
          </span>
        </footer>
      </div>
    </div>
  );
}
