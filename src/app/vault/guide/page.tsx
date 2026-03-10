"use client";

import { useState, useEffect } from "react";
import { useVaultAuth } from "@/contexts/vault-auth-context";
import { vaultApi } from "@/lib/vault-api";
import type {
  VaultCategory,
  VaultEntry,
  VaultCategoriesResponse,
  VaultGuideResponse,
  VaultCategoryEntriesResponse,
} from "@/lib/vault-types";
import { VaultHeader } from "@/components/vault/vault-header";
import { VaultGuideSteps } from "@/components/vault/vault-guide-steps";
import { VaultCategoryCard } from "@/components/vault/vault-category-card";
import { VaultEntryCard } from "@/components/vault/vault-entry-card";
import { VaultSkeleton } from "@/components/vault/vault-skeleton";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Users,
  Handshake,
  Server,
  BookOpen,
  Scale,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  business_overview: Briefcase,
  financial: DollarSign,
  team_contacts: Users,
  clients: Handshake,
  infrastructure: Server,
  guide: BookOpen,
  legal: Scale,
};

const categoryColors: Record<string, string> = {
  business_overview: "#f59e0b",
  financial: "#22c55e",
  team_contacts: "#3b82f6",
  clients: "#ea580c",
  infrastructure: "#8b5cf6",
  guide: "#ec4899",
  legal: "#64748b",
};

export default function VaultGuidePage() {
  const { logout } = useVaultAuth();
  const [categories, setCategories] = useState<VaultCategory[]>([]);
  const [guideEntries, setGuideEntries] = useState<VaultEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryEntries, setCategoryEntries] = useState<VaultEntry[]>([]);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  // Fetch categories and guide entries on mount
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const [catRes, guideRes] = await Promise.all([
          vaultApi.get<VaultCategoriesResponse>("/vault/categories", {
            signal: controller.signal,
          }),
          vaultApi.get<VaultGuideResponse>("/vault/guide", {
            signal: controller.signal,
          }),
        ]);
        setCategories(catRes.data.categories);
        setGuideEntries(guideRes.data.entries);
      } catch {
        // Auth errors handled by vault-api.ts
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  // Fetch entries when a category is selected
  const openCategory = async (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setIsCategoryLoading(true);
    setCategoryEntries([]);

    try {
      const res = await vaultApi.get<VaultCategoryEntriesResponse>(
        `/vault/categories/${categoryKey}`,
      );
      setCategoryEntries(res.data.entries);
      setCategoryLabel(res.data.label);
    } catch {
      // Auth errors handled by vault-api.ts
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const goBack = () => {
    setSelectedCategory(null);
    setCategoryEntries([]);
    setCategoryLabel("");
  };

  if (isLoading) {
    return (
      <div className="vault-theme min-h-screen bg-[var(--background)]">
        <VaultHeader onLogout={logout} />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <VaultSkeleton />
        </main>
      </div>
    );
  }

  // Category detail view
  if (selectedCategory) {
    const Icon = categoryIcons[selectedCategory] || BookOpen;
    const color = categoryColors[selectedCategory] || "#f59e0b";

    return (
      <div className="vault-theme min-h-screen bg-[var(--background)]">
        <VaultHeader onLogout={logout} />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <button
            onClick={goBack}
            className="mb-6 flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Bumalik sa lahat ng categories
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {categoryLabel}
            </h1>
          </div>

          {isCategoryLoading ? (
            <VaultSkeleton />
          ) : categoryEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--muted-foreground)]">
                Wala pang entries sa category na ito.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryEntries.map((entry) => (
                <VaultEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Main vault dashboard
  return (
    <div className="vault-theme min-h-screen bg-[var(--background)]">
      <VaultHeader onLogout={logout} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gradient-amber">
            Maligayang Pagdating sa Family Vault
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Dito makikita mo ang mga importanteng impormasyon tungkol sa ating negosyo at pamilya. Basahin mabuti ang bawat section.
          </p>
        </div>

        {/* Guide Steps */}
        {guideEntries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
              Gabay para sa Pamilya
            </h2>
            <VaultGuideSteps entries={guideEntries} />
          </div>
        )}

        {/* Categories Grid */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Mga Kategorya
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories
              .filter((c) => c.key !== "guide")
              .map((category) => (
                <VaultCategoryCard
                  key={category.key}
                  category={category}
                  icon={categoryIcons[category.key] || BookOpen}
                  color={categoryColors[category.key] || "#f59e0b"}
                  onClick={() => openCategory(category.key)}
                />
              ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-4 text-center">
        <p className="text-[10px] text-[var(--muted-foreground)]/50">
          PrimeX Ventures Inc. | Family Vault | Para lamang sa pamilya ni Jeager
        </p>
      </footer>
    </div>
  );
}
