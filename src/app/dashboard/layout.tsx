"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFounderAuth } from "@/contexts/founder-auth-context";
import { api } from "@/lib/api";
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

  return <>{children}</>;
}
