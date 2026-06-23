"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bot,
  ClipboardList,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Calendar,
  Upload,
  UserCheck,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import type { Voter, VoterStats, VoterImportPreview, VoterImportResult, Resident } from "@/lib/types";

type ImportStep = "pick" | "preview" | "importing" | "done" | "error";

export default function VotersPage() {
  // --- List state ---
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [precinctFilter, setPrecinctFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 25;

  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loadingList, setLoadingList] = useState(true);

  const [stats, setStats] = useState<VoterStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [precincts, setPrecincts] = useState<string[]>([]);

  // --- Import modal state ---
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("pick");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<VoterImportPreview | null>(null);
  const [importResult, setImportResult] = useState<VoterImportResult | null>(null);
  const [importError, setImportError] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  // --- Resolve Mismatches states ---
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [unmatchedVoters, setUnmatchedVoters] = useState<Voter[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [suggestions, setSuggestions] = useState<Resident[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [residentSearch, setResidentSearch] = useState("");
  const [debouncedResidentSearch, setDebouncedResidentSearch] = useState("");
  const [searchedResidents, setSearchedResidents] = useState<Resident[]>([]);
  const [searchingResidents, setSearchingResidents] = useState(false);
  const [unmatchedPage, setUnmatchedPage] = useState(1);
  const [loadingUnmatched, setLoadingUnmatched] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [unmatchedTotal, setUnmatchedTotal] = useState(0);
  const [unmatchedLastPage, setUnmatchedLastPage] = useState(1);

  // --- Single link modal ---
  const [selectedVoterForLink, setSelectedVoterForLink] = useState<Voter | null>(null);
  const [showSingleLinkModal, setShowSingleLinkModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Debounce search ---
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // --- Fetch stats ---
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await api.voters.stats();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // --- Fetch precincts ---
  const fetchPrecincts = useCallback(async () => {
    try {
      const data = await api.voters.precincts();
      setPrecincts(data);
    } catch {
      // ignore
    }
  }, []);

  // --- Fetch voter list ---
  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (precinctFilter) params.precinct = precinctFilter;
      const res = await api.voters.list(params);
      setVoters(res.data ?? []);
      setTotal(res.total ?? 0);
      setLastPage(res.last_page ?? 1);
    } catch {
      setVoters([]);
    } finally {
      setLoadingList(false);
    }
  }, [page, debouncedSearch, precinctFilter, perPage]);

  useEffect(() => { fetchStats(); fetchPrecincts(); }, [fetchStats, fetchPrecincts]);
  useEffect(() => { fetchList(); }, [fetchList]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, precinctFilter]);

  // --- Clear Voters List ---
  const handleClearVoters = async () => {
    setClearing(true);
    try {
      await api.voters.clear();
      setShowClearConfirm(false);
      fetchStats();
      fetchPrecincts();
      fetchList();
    } catch (err: any) {
      alert(err?.message || "Failed to clear voters list.");
    } finally {
      setClearing(false);
    }
  };

  // --- Link/Unlink Handlers ---
  const handleLinkVoter = async (voterId: string, residentId: string) => {
    try {
      await api.voters.link(voterId, residentId);
      fetchStats();
      fetchList();
      if (showVerifyModal) {
        fetchUnmatched();
        if (selectedVoter?.id === voterId) {
          setSelectedVoter(null);
          setSuggestions([]);
        }
      }
      if (showSingleLinkModal) {
        setShowSingleLinkModal(false);
        setSelectedVoterForLink(null);
      }
      alert("Voter successfully matched and linked to resident.");
    } catch (err: any) {
      alert(err.message || "Failed to link voter.");
    }
  };

  const handleUnlinkVoter = async (voterId: string) => {
    if (!confirm("Are you sure you want to unlink this voter record from their resident profile?")) return;
    try {
      await api.voters.unlink(voterId);
      fetchStats();
      fetchList();
      alert("Voter successfully unlinked.");
    } catch (err: any) {
      alert(err.message || "Failed to unlink voter.");
    }
  };

  // --- Fetch Unmatched Voters ---
  const fetchUnmatched = useCallback(async () => {
    setLoadingUnmatched(true);
    try {
      const res = await api.voters.list({ unmatched: true, page: unmatchedPage, per_page: 15 });
      setUnmatchedVoters(res.data ?? []);
      setUnmatchedTotal(res.total ?? 0);
      setUnmatchedLastPage(res.last_page ?? 1);
    } catch {
      setUnmatchedVoters([]);
    } finally {
      setLoadingUnmatched(false);
    }
  }, [unmatchedPage]);

  useEffect(() => {
    if (showVerifyModal) {
      fetchUnmatched();
    }
  }, [showVerifyModal, fetchUnmatched]);

  // --- Fetch suggestions ---
  const fetchSuggestions = async (voterId: string) => {
    setLoadingSuggestions(true);
    try {
      const res = await api.voters.suggestions(voterId);
      setSuggestions(res ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (selectedVoter) {
      fetchSuggestions(selectedVoter.id);
      setResidentSearch("");
      setSearchedResidents([]);
    }
  }, [selectedVoter]);

  // --- Manual lookup search ---
  useEffect(() => {
    const t = setTimeout(() => setDebouncedResidentSearch(residentSearch), 350);
    return () => clearTimeout(t);
  }, [residentSearch]);

  useEffect(() => {
    const searchResidents = async () => {
      if (!debouncedResidentSearch || debouncedResidentSearch.trim().length < 2) {
        setSearchedResidents([]);
        return;
      }
      setSearchingResidents(true);
      try {
        const res = await api.residents.list({ search: debouncedResidentSearch, per_page: 5 });
        setSearchedResidents((res as any).data ?? []);
      } catch {
        setSearchedResidents([]);
      } finally {
        setSearchingResidents(false);
      }
    };
    searchResidents();
  }, [debouncedResidentSearch]);

  // --- Import handlers ---
  const openImport = () => {
    setImportStep("pick");
    setImportFile(null);
    setPreview(null);
    setImportResult(null);
    setImportError("");
    setShowImport(true);
  };

  const closeImport = () => {
    if (importStep === "importing") return; // block close during import
    setShowImport(false);
    if (importStep === "done") {
      fetchStats();
      fetchList();
      fetchPrecincts();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.type !== "application/pdf") {
      setImportError("Only PDF files are accepted.");
      return;
    }
    setImportError("");
    setImportFile(file);
  };

  const handlePreview = async () => {
    if (!importFile) return;
    setLoadingPreview(true);
    setImportError("");
    try {
      const data = await api.voters.preview(importFile);
      setPreview(data);
      setImportStep("preview");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to parse PDF. Make sure it's a valid COMELEC PDF.";
      setImportError(msg);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportStep("importing");
    setImportError("");
    try {
      const data = await api.voters.import(importFile);
      setImportResult(data);
      setImportStep("done");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Import failed. Please try again.";
      setImportError(msg);
      setImportStep("error");
    }
  };

  // pagination
  const totalPages = Math.max(1, lastPage);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage + 1;
  const end = Math.min(safePage * perPage, total);

  const matchRate = stats && stats.total > 0 ? Math.round((stats.matched / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voters"
        description="COMELEC voter records imported for this barangay"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Records" }, { label: "Voters" }]}
        actions={null}
      />

      {/* Mabini AI Insight */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-bg/30 border border-accent-primary/20">
        <Bot className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Mabini:</span>{" "}
          {stats
            ? `${stats.total.toLocaleString()} voter records on file. ${stats.matched.toLocaleString()} matched to residents (${matchRate}%). Import the latest COMELEC PDF to keep records up to date.`
            : "Loading voter insights..."}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Voters"
          value={loadingStats ? "—" : (stats?.total ?? 0).toLocaleString()}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Total Match"
          value={loadingStats ? "—" : (stats?.matched ?? 0).toLocaleString()}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <div className="glass rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Date of Upload</p>
            <p className="text-2xl font-bold text-foreground">
              {loadingStats
                ? "—"
                : stats?.last_import_date
                ? new Date(stats.last_import_date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.last_import_date ? "Last COMELEC PDF import" : "No import yet"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-accent-bg text-accent-text shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, precinct, or address..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted"
            )}
            title="Filters"
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedVoter(null);
              setSuggestions([]);
              setUnmatchedPage(1);
              setShowVerifyModal(true);
            }}
            className="px-3 py-2 rounded-lg border border-border hover:bg-muted hover:text-foreground text-sm font-semibold flex items-center gap-1.5 transition-colors text-muted-foreground"
            title="Resolve Mismatches"
          >
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Resolve Mismatches</span>
          </button>
          <button
            onClick={openImport}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Import COMELEC"
          >
            <Upload className="h-4 w-4" />
          </button>
          {voters.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              title="Clear Voters List"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg glass-subtle">
            <select
              value={precinctFilter}
              onChange={(e) => setPrecinctFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Precincts</option>
              {precincts.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {precinctFilter && (
              <button
                onClick={() => setPrecinctFilter("")}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Voters Table */}
      <div className="rounded-xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Voter</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-32">Precinct</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading voters...</p>
                    </div>
                  </td>
                </tr>
              ) : voters.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No voter records found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {debouncedSearch || precinctFilter
                            ? "No voters match your search."
                            : "Import voter records from a COMELEC PDF using the Import button."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                voters.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{v.full_name}</p>
                      {v.resident ? (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Linked to: {v.resident.first_name} {v.resident.last_name} ({v.resident.resident_number})
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-500 mt-0.5">Unmatched</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent-bg/50 text-[11px] font-mono font-semibold text-accent-text">
                        {v.precinct_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{v.address || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {v.resident_id ? (
                        <button
                          onClick={() => handleUnlinkVoter(v.id)}
                          className="font-semibold text-rose-500 hover:text-rose-600 hover:underline transition-colors"
                        >
                          Unlink Profile
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedVoterForLink(v);
                            fetchSuggestions(v.id);
                            setShowSingleLinkModal(true);
                          }}
                          className="font-semibold text-accent-primary hover:underline transition-colors"
                        >
                          Link Profile
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > perPage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {start}–{end} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Import COMELEC Modal */}
      <Modal
        open={showImport}
        onClose={closeImport}
        title="Import COMELEC PDF"
        description={
          importStep === "pick" ? "Upload a COMELEC voter list PDF to import." :
          importStep === "preview" ? "Preview parsed results before importing." :
          importStep === "importing" ? "Importing voter records..." :
          importStep === "done" ? "Import complete!" :
          "Import failed."
        }
        size="lg"
        disableOutsideClick={importStep === "importing"}
        footer={
          importStep === "pick" ? (
            <>
              <ModalButton variant="secondary" onClick={closeImport}>Cancel</ModalButton>
              <ModalButton
                variant="primary"
                onClick={handlePreview}
                disabled={!importFile || loadingPreview}
              >
                {loadingPreview ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Parsing...</span>
                ) : "Parse PDF"}
              </ModalButton>
            </>
          ) : importStep === "preview" ? (
            <>
              <ModalButton variant="secondary" onClick={() => { setImportStep("pick"); setPreview(null); }}>Back</ModalButton>
              <ModalButton variant="primary" onClick={handleImport}>
                Import {preview?.count?.toLocaleString()} Records
              </ModalButton>
            </>
          ) : importStep === "importing" ? (
            <ModalButton variant="secondary" disabled>Please wait...</ModalButton>
          ) : importStep === "done" ? (
            <ModalButton variant="primary" onClick={closeImport}>Done</ModalButton>
          ) : (
            <>
              <ModalButton variant="secondary" onClick={() => setImportStep("pick")}>Try Again</ModalButton>
              <ModalButton variant="secondary" onClick={closeImport}>Close</ModalButton>
            </>
          )
        }
      >
        {/* Step: Pick File */}
        {importStep === "pick" && (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                importFile ? "border-accent-primary bg-accent-bg/20" : "border-border hover:border-accent-primary/50"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {importFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-accent-primary" />
                  <p className="text-sm font-medium text-foreground">{importFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(importFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline mt-1"
                    onClick={(e) => { e.stopPropagation(); setImportFile(null); setImportError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Click to select a PDF</p>
                  <p className="text-xs text-muted-foreground">COMELEC Notice of Hearing PDF — max 50MB</p>
                </div>
              )}
            </div>

            {importError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{importError}</p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs font-semibold text-foreground">What happens on import:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>All previous voter records for this barangay will be replaced</li>
                <li>Voters will be auto-matched to residents by name</li>
                <li>Precinct numbers and addresses are extracted from the PDF</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {importStep === "preview" && preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-accent-bg/20 border border-accent-primary/20 text-center">
                <p className="text-3xl font-bold text-foreground">{preview.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Voter records found in PDF</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                <p className="text-3xl font-bold text-foreground">{preview.rows?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Sample rows shown below</p>
              </div>
            </div>

            {/* Sample rows */}
            {preview.sample && preview.sample.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sample (first 5 records)</p>
                <div className="rounded-xl overflow-hidden border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Name</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase w-24">Precinct</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sample.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 font-medium text-foreground">{row.full_name}</td>
                          <td className="px-3 py-2 font-mono text-xs text-foreground">{row.precinct_number}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{row.address || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                This will replace all existing voter records for this barangay. This action cannot be undone.
              </p>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {importStep === "importing" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-accent-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Importing records...</p>
              <p className="text-xs text-muted-foreground mt-1">Deleting old batch, inserting new records, matching residents.</p>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {importStep === "done" && importResult && (
          <div className="py-8 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">Import Successful</p>
              <p className="text-sm text-muted-foreground mt-1">{importResult.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                <p className="text-3xl font-bold text-foreground">{importResult.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Total voters imported</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{importResult.matched.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Matched to residents</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Imported on {new Date(importResult.imported_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        )}

        {/* Step: Error */}
        {importStep === "error" && (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">Import Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{importError}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Resolve Mismatches Modal */}
      <Modal
        open={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="Resolve Mismatches & Link Profiles"
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px] overflow-hidden">
          {/* Left panel: Unmatched Voters */}
          <div className="md:col-span-4 flex flex-col h-full border-r border-border pr-4 overflow-hidden">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Unmatched Voters ({unmatchedTotal})</p>
            {loadingUnmatched ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            ) : unmatchedVoters.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-foreground">All matched!</p>
                <p className="text-xs text-muted-foreground">No unmatched voter records found.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {unmatchedVoters.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoter(v)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border text-xs transition-all",
                        selectedVoter?.id === v.id
                          ? "border-accent-primary bg-accent-bg text-accent-text"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <p className="font-semibold">{v.full_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Precinct: {v.precinct_number}</p>
                    </button>
                  ))}
                </div>
                {/* Pagination */}
                {unmatchedLastPage > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => setUnmatchedPage(p => Math.max(1, p - 1))}
                      disabled={unmatchedPage <= 1}
                      className="px-2 py-1 text-xs rounded border disabled:opacity-30 hover:bg-muted"
                    >
                      Prev
                    </button>
                    <span className="text-xs">{unmatchedPage} / {unmatchedLastPage}</span>
                    <button
                      onClick={() => setUnmatchedPage(p => Math.min(unmatchedLastPage, p + 1))}
                      disabled={unmatchedPage >= unmatchedLastPage}
                      className="px-2 py-1 text-xs rounded border disabled:opacity-30 hover:bg-muted"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right panel: Matcher & suggestions */}
          <div className="md:col-span-8 flex flex-col h-full overflow-hidden">
            {selectedVoter ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden space-y-4">
                {/* Voter Info Card */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold uppercase">
                    Unmatched Voter
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-2">{selectedVoter.full_name}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                    <div>
                      <p className="text-muted-foreground font-semibold">Precinct Number</p>
                      <p className="text-foreground mt-0.5 font-mono">{selectedVoter.precinct_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Address from PDF</p>
                      <p className="text-foreground mt-0.5">{selectedVoter.address || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Match Suggestions / Manual lookup */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Match Suggestions</p>
                  
                  {loadingSuggestions ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {suggestions.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No automatically suggested residents found. Use the lookup tool below.</p>
                      ) : (
                        suggestions.map((r) => (
                          <div key={r.id} className="p-3 rounded-xl border border-border flex items-center justify-between gap-4 hover:border-accent-primary/50 transition-all">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {r.first_name} {r.middle_name ? r.middle_name[0] + '.' : ''} {r.last_name}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                No. {r.resident_number} • Purok {r.purok || "—"} • {r.street || "—"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleLinkVoter(selectedVoter.id, r.id)}
                              className="px-3 py-1 text-xs font-bold bg-accent-primary text-accent-text rounded-lg hover:opacity-90 transition-all"
                            >
                              Link Profile
                            </button>
                          </div>
                        ))
                      )}

                      {/* Manual Lookup Search */}
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manual Resident Lookup</p>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={residentSearch}
                            onChange={(e) => setResidentSearch(e.target.value)}
                            placeholder="Search resident name or number..."
                            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
                          />
                        </div>

                        {searchingResidents ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Searching...</span>
                          </div>
                        ) : searchedResidents.length > 0 ? (
                          <div className="space-y-2 border border-border rounded-xl p-2 bg-muted/10 max-h-32 overflow-y-auto">
                            {searchedResidents.map((r) => (
                              <div key={r.id} className="flex items-center justify-between text-xs p-2 border-b last:border-0 border-border">
                                <div>
                                  <p className="font-semibold text-foreground">{r.first_name} {r.last_name}</p>
                                  <p className="text-[10px] text-muted-foreground">{r.resident_number}</p>
                                </div>
                                <button
                                  onClick={() => handleLinkVoter(selectedVoter.id, r.id)}
                                  className="text-xs text-accent-primary font-bold hover:underline"
                                >
                                  Link
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : residentSearch.length >= 2 ? (
                          <p className="text-xs text-muted-foreground pl-1">No residents found matching "{residentSearch}".</p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">No voter selected</p>
                <p className="text-xs text-muted-foreground mt-1">Select an unmatched voter on the left panel to find suggestions and link their profile.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Direct Single Link Modal */}
      <Modal
        open={showSingleLinkModal}
        onClose={() => { setShowSingleLinkModal(false); setSelectedVoterForLink(null); }}
        title="Link Voter to Resident"
        size="md"
      >
        {selectedVoterForLink && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Voter Record</p>
              <p className="text-sm font-bold mt-1 text-foreground">{selectedVoterForLink.full_name}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">Precinct: {selectedVoterForLink.precinct_number}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Suggested Match</p>
              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No suggested matching profiles found. Use the verification assistant for manual search.</p>
              ) : (
                <div className="space-y-2">
                  {suggestions.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg border border-border flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{r.first_name} {r.last_name}</p>
                        <p className="text-muted-foreground mt-0.5">{r.resident_number}</p>
                      </div>
                      <button
                        onClick={() => handleLinkVoter(selectedVoterForLink.id, r.id)}
                        className="px-2 py-1 bg-accent-primary text-accent-text font-bold rounded"
                      >
                        Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => {
                  setShowSingleLinkModal(false);
                  setSelectedVoter(selectedVoterForLink);
                  setShowVerifyModal(true);
                }}
                className="text-xs text-accent-primary hover:underline font-bold"
              >
                Open Verification Assistant for full search →
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Voters Confirmation Modal */}
      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Voters List"
        description="Are you absolutely sure you want to delete the existing voters list?"
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowClearConfirm(false)} disabled={clearing}>
              Cancel
            </ModalButton>
            <ModalButton variant="danger" onClick={handleClearVoters} disabled={clearing}>
              {clearing ? "Clearing..." : "Delete All Voters"}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This action will permanently delete all parsed voter records for this Barangay.
          </p>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-xs flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>Important:</strong> Deleting this list will also reset the voter status (<code className="bg-amber-500/20 px-1 rounded">is_voter = false</code>) and clear the precinct numbers of all residents who were linked to these voter records.
            </p>
          </div>
        </div>
      </Modal>

      <MabiniButton pageContext="You are on the Voters page. This page manages COMELEC voter records imported via PDF for the barangay. Voters are matched to residents by name." />
    </div>
  );
}
