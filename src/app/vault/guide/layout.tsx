"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVaultAuth } from "@/contexts/vault-auth-context";

export default function VaultGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isChecking } = useVaultAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace("/vault");
    }
  }, [isAuthenticated, isChecking, router]);

  if (isChecking) {
    return (
      <div className="vault-theme flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
