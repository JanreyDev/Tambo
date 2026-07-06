"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFounderAuth } from "@/contexts/founder-auth-context";
import PasscodePage from "./passcode/page";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isChecking } = useFounderAuth();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isChecking, router]);

  // If authenticated, show loading while redirecting to dashboard
  if (isChecking || isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Not authenticated -- show passcode page directly (no redirect)
  return <PasscodePage />;
}
