"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import {
  useAccentColor,
  ACCENT_COLORS,
  type AccentColor,
} from "@/hooks/use-theme-store";
import { cn } from "@/lib/utils";

const accentOptions: { name: string; value: AccentColor }[] = [
  { name: "Blue", value: "blue" },
  { name: "Emerald", value: "emerald" },
  { name: "Violet", value: "violet" },
  { name: "Rose", value: "rose" },
  { name: "Amber", value: "amber" },
  { name: "Cyan", value: "cyan" },
  { name: "Orange", value: "orange" },
  { name: "Indigo", value: "indigo" },
];

const emptySubscribe = () => () => {};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccentColor();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) return null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize the look and feel of your workspace.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Switch between light and dark mode.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                theme === option.value
                  ? "border-accent bg-accent-bg"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <option.icon
                className={cn(
                  "w-6 h-6",
                  theme === option.value
                    ? "text-accent"
                    : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  theme === option.value
                    ? "text-accent-text"
                    : "text-muted-foreground"
                )}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Accent Color
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose the primary accent color for buttons, links, and highlights.
        </p>

        <div className="grid grid-cols-4 gap-3">
          {accentOptions.map((option) => {
            const colors = ACCENT_COLORS[option.value];
            const isActive = accent === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setAccent(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  isActive
                    ? "border-current shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                )}
                style={isActive ? { borderColor: colors.primary } : undefined}
              >
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ background: colors.primary }}
                  />
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-lg border border-border bg-background">
          <p className="text-sm text-muted-foreground mb-3">Preview</p>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ background: "var(--accent-primary)" }}
            >
              Primary Button
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{
                color: "var(--accent-primary)",
                borderColor: "var(--accent-primary)",
              }}
            >
              Secondary Button
            </button>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "var(--accent-bg)",
                color: "var(--accent-text)",
              }}
            >
              Badge
            </span>
          </div>
        </div>
      </div>

      {/* Barangay Branding (placeholder) */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Barangay Branding
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your barangay logo and seal. These appear on documents and the
          public portal.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-muted-foreground/30 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-lg text-muted-foreground">+</span>
            </div>
            <p className="text-sm font-medium text-card-foreground">
              Barangay Logo
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG or JPG, max 2MB
            </p>
          </div>
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-muted-foreground/30 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-lg text-muted-foreground">+</span>
            </div>
            <p className="text-sm font-medium text-card-foreground">
              Barangay Seal
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG or JPG, max 2MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
