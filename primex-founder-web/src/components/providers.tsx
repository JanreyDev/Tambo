"use client";

import { ThemeProvider } from "next-themes";
import { FounderAuthProvider } from "@/contexts/founder-auth-context";
import { VaultAuthProvider } from "@/contexts/vault-auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
      <FounderAuthProvider>
        <VaultAuthProvider>{children}</VaultAuthProvider>
      </FounderAuthProvider>
    </ThemeProvider>
  );
}
