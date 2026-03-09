"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasToken } from "@/lib/api";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasToken()) {
      router.replace("/dashboard");
    } else {
      router.replace("/passcode");
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}
