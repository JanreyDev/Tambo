"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Loader2, Search } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string, option: ComboboxOption | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: React.ReactNode;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  disabled = false,
  loading = false,
  error,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sublabel?.toLowerCase().includes(query.toLowerCase()) ?? false),
      )
    : options;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset highlight when filtered list changes
  const prevFilteredLength = useRef(filtered.length);
  if (prevFilteredLength.current !== filtered.length) {
    prevFilteredLength.current = filtered.length;
    if (highlightIndex !== 0) setHighlightIndex(0);
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-combobox-item]");
    items[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  const handleSelect = useCallback(
    (option: ComboboxOption) => {
      onChange(option.value, option);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setQuery("");
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-[10px] font-medium text-muted-foreground mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (!disabled && !loading) {
            setOpen(!open);
            if (!open) setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
          disabled || loading
            ? "border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
            : open
              ? "border-orange-500 ring-2 ring-orange-500/30 bg-input-bg text-foreground"
              : "border-input-border bg-input-bg text-foreground hover:border-muted-foreground"
        }`}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {loading ? "Loading..." : selected ? selected.label : placeholder}
        </span>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && !disabled && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl shadow-black/20 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Options list */}
          <div ref={listRef} className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                No results found
              </div>
            ) : (
              filtered.map((option, idx) => (
                <div
                  key={option.value}
                  data-combobox-item
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    idx === highlightIndex
                      ? "bg-orange-500/10 text-foreground"
                      : value === option.value
                        ? "bg-muted/50 text-foreground"
                        : "text-foreground hover:bg-muted/30"
                  }`}
                >
                  <p className="text-xs font-medium truncate">{option.label}</p>
                  {option.sublabel && (
                    <p className="text-[10px] text-muted-foreground truncate">{option.sublabel}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error}
    </div>
  );
}
