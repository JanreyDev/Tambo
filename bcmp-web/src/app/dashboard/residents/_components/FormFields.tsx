"use client";

/**
 * Reusable form-field primitives used by the Resident Create/Edit form.
 *
 * Each field accepts (name, value, onChange) so the parent owns state — these
 * components are pure UI. The shared signature lets the parent treat them
 * uniformly when feeding a `Record<string, string | boolean>` form state.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAYS_SHORT, MONTHS, type SmartEntry } from "../_lib/constants";

// ══════════════════════════════════════════════════════════════════════
// FInput
// ══════════════════════════════════════════════════════════════════════

export function FInput({
  label, name, required, type = "text", placeholder = "",
  value, onChange, className, valid, error, maxLength,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (name: string, value: string | boolean) => void;
  className?: string;
  valid?: boolean;
  error?: string;
  maxLength?: number;
}) {
  const forceUpper = type === "text" || type === "search";
  // Normalize value to uppercase at the controlled-input level so DB-loaded
  // values are reflected uppercase in the form state, not just via CSS.
  const displayValue = forceUpper ? (value || "").toUpperCase() : (value || "");
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={displayValue}
        maxLength={maxLength}
        autoComplete="off"
        onChange={(e) => onChange(name, forceUpper ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200",
          forceUpper && "uppercase placeholder:normal-case",
          error
            ? "border border-red-500 focus:ring-2 focus:ring-red-300 bg-red-50 dark:bg-red-950/20"
            : valid
              ? "border border-green-500 focus:ring-2 focus:ring-green-300 bg-green-50 dark:bg-green-950/20"
              : "glass-input"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// FDatePicker
// ══════════════════════════════════════════════════════════════════════

export function FDatePicker({
  label, name, required, value, onChange, className, valid, error,
}: {
  label: string;
  name: string;
  required?: boolean;
  value: string;
  onChange: (name: string, value: string | boolean) => void;
  className?: string;
  valid?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  // Strip time component if API returns ISO datetime
  const dateOnly = value?.includes("T") ? value.split("T")[0] : value;
  const parsed = dateOnly ? new Date(dateOnly + "T00:00:00") : null;
  const isBirthField = name.toLowerCase().includes("birth") || name.toLowerCase().includes("date_of_birth");
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : (isBirthField ? today.getFullYear() - 25 : today.getFullYear()));

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectDate = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(name, `${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const isSelected = (day: number) =>
    !!parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const age = parsed ? (() => {
    let a = today.getFullYear() - parsed.getFullYear();
    const m = today.getMonth() - parsed.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) a--;
    return a;
  })() : null;

  const displayValue = parsed
    ? `${MONTHS[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`
    : "";

  const yearOptions: number[] = [];
  for (let y = today.getFullYear(); y >= 1920; y--) yearOptions.push(y);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div className={cn("relative", className)} ref={ref}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <button
        type="button"
        name={name}
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl text-left focus:outline-none transition-all duration-200",
          error
            ? "border border-red-500 focus:ring-2 focus:ring-red-300 bg-red-50 dark:bg-red-950/20"
            : valid
              ? "border border-green-500 focus:ring-2 focus:ring-green-300 bg-green-50 dark:bg-green-950/20"
              : "glass-input"
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className={cn("flex-1 truncate", !displayValue && "text-muted-foreground")}>
          {displayValue || "Select date"}
        </span>
        {age !== null && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-bg text-accent-text shrink-0">
            {age} yrs
          </span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

      {open && typeof window !== "undefined" && createPortal(
        <div ref={dropdownRef} className="fixed z-[9999] w-72 rounded-xl bg-background border border-border shadow-lg p-3"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}>
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-sm font-semibold bg-transparent border-none focus:outline-none cursor-pointer hover:text-accent-text transition-colors">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-sm font-semibold bg-transparent border-none focus:outline-none cursor-pointer hover:text-accent-text transition-colors">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDate(day)}
                    className={cn(
                      "w-8 h-8 text-xs rounded-lg transition-colors font-medium",
                      isSelected(day)
                        ? "text-white shadow-sm"
                        : isToday(day)
                          ? "bg-accent-bg/30 text-accent-text font-bold"
                          : "text-foreground hover:bg-muted"
                    )}
                    style={isSelected(day) ? { background: "var(--accent-primary)" } : undefined}
                  >
                    {day}
                  </button>
                ) : <div className="w-8 h-8" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => { onChange(name, ""); setOpen(false); }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const mm = String(today.getMonth() + 1).padStart(2, "0");
                const dd = String(today.getDate()).padStart(2, "0");
                onChange(name, `${today.getFullYear()}-${mm}-${dd}`);
                setOpen(false);
              }}
              className="text-[11px] font-medium hover:text-accent-text transition-colors"
              style={{ color: "var(--accent-primary)" }}
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// FSelect
// ══════════════════════════════════════════════════════════════════════

export function FSelect({
  label, name, options, required, value, onChange, className, error, disabled,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  value: string | null | undefined;
  onChange: (name: string, value: string | boolean) => void;
  className?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(className, disabled && "opacity-40 pointer-events-none")}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200",
          error ? "border border-red-500 focus:ring-2 focus:ring-red-300 bg-red-50 dark:bg-red-950/20" : "glass-input",
          disabled && "cursor-not-allowed"
        )}
      >
        {options.map((o) => (
          <option key={o} value={o === options[0] && o === "" ? "" : o}>
            {o || `Select ${label.toLowerCase()}`}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// FCheckbox
// ══════════════════════════════════════════════════════════════════════

export function FCheckbox({
  label, name, checked, onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (name: string, value: string | boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(name, e.target.checked)}
        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring"
      />
      <span className="text-sm text-foreground group-hover:text-accent-text transition-colors">{label}</span>
    </label>
  );
}

// ══════════════════════════════════════════════════════════════════════
// FCombobox (Smart Address Entry with fuzzy matching)
// ══════════════════════════════════════════════════════════════════════

// Common Filipino address abbreviations
const addressAbbreviations: Record<string, string> = {
  "st.": "street", "st": "street", "ave.": "avenue", "ave": "avenue",
  "blvd.": "boulevard", "blvd": "boulevard", "dr.": "drive", "dr": "drive",
  "rd.": "road", "rd": "road", "ln.": "lane", "ln": "lane",
  "brgy.": "barangay", "brgy": "barangay", "sts.": "streets",
};

export function normalizeAddress(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => addressAbbreviations[w] || w)
    .join(" ");
}

export function similarity(a: string, b: string): number {
  const na = normalizeAddress(a);
  const nb = normalizeAddress(b);
  if (na === nb) return 1;
  // Trigram similarity — same approach as PostgreSQL pg_trgm
  const triA = new Set<string>();
  const triB = new Set<string>();
  const pa = `  ${na} `;
  const pb = `  ${nb} `;
  for (let i = 0; i < pa.length - 2; i++) triA.add(pa.slice(i, i + 3));
  for (let i = 0; i < pb.length - 2; i++) triB.add(pb.slice(i, i + 3));
  let intersect = 0;
  triA.forEach((t) => { if (triB.has(t)) intersect++; });
  return intersect / (triA.size + triB.size - intersect);
}

export function FCombobox({
  label, name, entries, required, value, onChange, onSubmit, onEntriesChange,
  placeholder: customPlaceholder, disabled,
}: {
  label: string;
  name: string;
  entries: SmartEntry[];
  required?: boolean;
  value: string;
  onChange: (name: string, value: string | boolean) => void;
  onSubmit?: (value: string) => void;
  onEntriesChange?: React.Dispatch<React.SetStateAction<SmartEntry[]>>;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const sorted = [...entries].sort((a, b) => a.canonical.localeCompare(b.canonical));

  const matched = trimmed
    ? sorted.map((e) => {
        const sub = e.canonical.toLowerCase().includes(trimmed.toLowerCase());
        const sim = similarity(trimmed, e.canonical);
        const aliasMatch = e.aliases.some((a) => similarity(trimmed, a) > 0.6);
        return { ...e, score: sub ? 1 : Math.max(sim, aliasMatch ? 0.7 : 0), sim };
      }).filter((e) => e.score > 0.35).sort((a, b) => b.score - a.score || a.canonical.localeCompare(b.canonical))
    : sorted.map((e) => ({ ...e, score: 1, sim: 0 }));

  const exactMatch = entries.some((e) => normalizeAddress(e.canonical) === normalizeAddress(trimmed));
  const fuzzyMatch = trimmed && !exactMatch
    ? entries.find((e) => {
        const sim = similarity(trimmed, e.canonical);
        return sim > 0.55 && sim < 1;
      })
    : null;

  const openCombobox = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setOpen(true);
    setQuery("");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submitValue = (val: string) => {
    if (onSubmit) {
      onSubmit(val);
    } else if (onEntriesChange) {
      onEntriesChange((prev) => {
        const existing = prev.find((e) => e.canonical.toUpperCase() === val.toUpperCase());
        if (existing) return prev.map((e) => e === existing ? { ...e, count: e.count + 1 } : e);
        return [...prev, { canonical: val, count: 1, aliases: [] }];
      });
    }
  };

  const handleSelect = (val: string) => {
    submitValue(val);
    onChange(name, val);
    setQuery("");
    setOpen(false);
  };

  const handleNew = () => {
    if (!trimmed) return;
    submitValue(trimmed);
    onChange(name, trimmed);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", disabled && "opacity-40 pointer-events-none")}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger button — visually identical to Civil Status / FSelect */}
      <button
        type="button"
        disabled={disabled}
        onClick={openCombobox}
        className="flex items-center w-full rounded-xl glass-input px-3 py-2.5 text-sm text-left transition-all duration-200 focus:outline-none focus-visible:outline-none"
      >
        <span className={cn("flex-1 truncate uppercase", !value && "text-muted-foreground normal-case")}>
          {value || customPlaceholder || "Type to search or add..."}
        </span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(name, ""); }}
            className="px-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 ml-1 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {/* Portal dropdown */}
      {open && typeof window !== "undefined" && createPortal(
        <div
          className="fixed z-[9999] rounded-xl shadow-xl bg-background border border-border overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {/* Search input lives inside the dropdown */}
          <div className="px-2 py-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={query}
              placeholder="Search..."
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && trimmed) {
                  e.preventDefault();
                  if (fuzzyMatch) handleSelect(fuzzyMatch.canonical);
                  else handleNew();
                }
                if (e.key === "Escape") setOpen(false);
              }}
              className="w-full px-2 py-1.5 text-sm bg-muted/50 rounded-lg border border-border/50 outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted-foreground/60 uppercase placeholder:normal-case"
            />
          </div>

          {/* Options list */}
          <div ref={dropdownRef} className="max-h-48 overflow-y-auto">
            {fuzzyMatch && (
              <button type="button" onClick={() => handleSelect(fuzzyMatch.canonical)}
                className="w-full text-left px-3 py-2.5 text-sm bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
                <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Did you mean:</span>
                <span className="ml-1.5 font-semibold text-foreground">{fuzzyMatch.canonical}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">({fuzzyMatch.count} uses)</span>
              </button>
            )}
            {matched.length === 0 && !trimmed && (
              <div className="px-3 py-2.5 text-sm text-muted-foreground italic">
                Type above to search or add a new entry.
              </div>
            )}
            {matched.length === 0 && trimmed && !fuzzyMatch && (
              <div className="px-3 py-2 text-xs text-muted-foreground italic">No matches found</div>
            )}
            {matched.map((e) => (
              <button key={e.canonical} type="button" onClick={() => handleSelect(e.canonical)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between",
                  e.canonical === value && "font-medium text-accent-text bg-accent-primary/5"
                )}>
                <span>{e.canonical}</span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">{e.count}</span>
              </button>
            ))}
            {trimmed && !exactMatch && (
              <button type="button" onClick={handleNew}
                className="w-full text-left px-3 py-2 text-sm border-t border-border text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors flex items-center gap-2 font-medium">
                <Plus className="h-4 w-4" />
                Save &ldquo;{trimmed}&rdquo; as new entry
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// FRadio
// ══════════════════════════════════════════════════════════════════════

export function FRadio({
  label, name, options, value, onChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (name: string, value: string | boolean) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="flex items-center rounded-xl glass-input overflow-hidden">
        {options.map((o, i) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(name, o.value)}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-all duration-200",
              i > 0 && "border-l border-border/40",
              value === o.value
                ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/5"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Section (collapsible accordion with blue header)
// ══════════════════════════════════════════════════════════════════════

export function Section({
  icon, title, open, onToggle, children,
}: {
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-xl transition-all duration-200",
          open
            ? "glass-accordion text-foreground"
            : "glass-accordion-closed text-foreground hover:shadow-md"
        )}
      >
        <span className="shrink-0 text-blue-600 dark:text-blue-300 [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span>
        <span className="flex-1 text-sm font-bold uppercase tracking-wider">{title}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className={cn(open ? "overflow-visible" : "overflow-hidden")}>
          <div className="glass-section rounded-b-xl mt-px px-5 pt-5 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
