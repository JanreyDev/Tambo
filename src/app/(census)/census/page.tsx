"use client";

/**
 * Census Mode -- Form-only mobile resident registration
 *
 * Renders ResidentsPage in censusMode (form-only, no list view).
 * Adds quick search for duplicate checking (fname, lname, mname, DOB).
 * Shows registration counter for today's session.
 */
import { useState, useCallback, useRef } from "react";
import { Search, X, UserCheck, AlertTriangle, Loader2 } from "lucide-react";
import ResidentsPage from "@/app/dashboard/residents/page";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface QuickSearchResult {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  purok: string;
  status: string;
}

export default function CensusPage() {
  const [registeredCount, setRegisteredCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<QuickSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRegistered = useCallback(() => {
    setRegisteredCount((c) => c + 1);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setSearchDone(false);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.residents.list({ search: value.trim(), per_page: 5 });
        setSearchResults(res.data as unknown as QuickSearchResult[]);
        setSearchDone(true);
      } catch {
        setSearchResults([]);
        setSearchDone(true);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, []);

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchDone(false);
  };

  return (
    <div className="relative">
      {/* Census session counter + search toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{registeredCount}</span>
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">today</span>
          </div>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px]",
            showSearch
              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          <Search className="h-3.5 w-3.5" />
          Check if Registered
        </button>
      </div>

      {/* Quick search overlay */}
      {showSearch && (
        <div className="border-b border-border bg-background px-3 py-3 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Type name or date of birth..."
              className="w-full pl-9 pr-9 py-3 text-sm rounded-xl glass-input min-h-[44px]"
            />
            {searchQuery && (
              <button onClick={closeSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Search results */}
          {searchLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {searchDone && !searchLoading && searchResults.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">No match found</p>
                <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">This person is not yet registered. Proceed with registration.</p>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  {searchResults.length} existing record{searchResults.length > 1 ? "s" : ""} found
                </p>
              </div>
              {searchResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {r.last_name}, {r.first_name} {r.middle_name ? r.middle_name.charAt(0) + "." : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.date_of_birth ? new Date(r.date_of_birth + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No DOB"}
                      {r.purok ? ` -- ${r.purok}` : ""}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0",
                    r.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                    {r.status || "active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resident registration form */}
      <ResidentsPage censusMode onCensusRegistered={handleRegistered} />
    </div>
  );
}
