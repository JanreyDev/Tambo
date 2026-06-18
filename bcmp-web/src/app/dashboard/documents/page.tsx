"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Search,
  Download,
  Printer,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  User,
  Eye,
  Ban,
  AlertTriangle,
  Shield,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn } from "@/lib/utils";
import { MabiniButton } from "@/components/ui/mabini-button";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GenerateDocumentWizard } from "@/components/documents/GenerateDocumentWizard";
import type {
  DocumentTemplate,
  IssuedDocument,
  PaginatedResponse,
} from "@/lib/types";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  issued: { label: "Issued", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  released: { label: "Released", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  cancelled: { label: "Cancelled", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  expired: { label: "Expired", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
};

const SOURCE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  resident: { label: "Resident", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  establishment: { label: "Business", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  lot_building: { label: "Lot/Bldg", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  kp_case: { label: "KP Case", color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
  vawc_case: { label: "VAWC", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  blotter: { label: "Blotter", color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-900/30" },
};

export default function DocumentsPage() {
  const searchParams = useSearchParams();

  // ── List state ──
  const [documents, setDocuments] = useState<IssuedDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ── Stat counts ──
  const [stats, setStats] = useState({ total: 0, issued: 0, released: 0, cancelled: 0 });

  // ── Wizard state (passed to GenerateDocumentWizard) ──
  const [showWizard, setShowWizard] = useState(false);
  const [wizardResidentId, setWizardResidentId] = useState<string | null>(null);
  const [wizardTemplateCategory, setWizardTemplateCategory] = useState<string | null>(null);

  // ── View modal ──
  const [viewDoc, setViewDoc] = useState<IssuedDocument | null>(null);

  // ── Dropdown ──
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Toast notifications ──
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "info" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = (msg: string, type: "ok" | "err" | "info" = "ok") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch documents ──
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.issuedDocuments.list({
        page,
        per_page: perPage,
        search: search || undefined,
        status: filterStatus || undefined,
        template_id: filterTemplate || undefined,
        constituent_type: filterSource || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      setDocuments(res.data);
      setTotalDocs(res.total);
      setLastPage(res.last_page);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, filterStatus, filterTemplate, filterSource, sortBy, sortDir]);

  // ── Fetch templates ──
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.documentTemplates.list({ is_active: true, per_page: 100 });
      setTemplates(res.data);
    } catch {
      // silent
    }
  }, []);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.issuedDocuments.stats();
      setStats({
        total: data.total,
        issued: data.issued,
        released: data.released,
        cancelled: data.cancelled,
      });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, [fetchTemplates, fetchStats]);

  // ── Search debounce ──
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── URL param: open wizard from direct link (e.g. shared link) ──
  useEffect(() => {
    const residentId = searchParams.get("resident_id");
    if (!residentId) return;
    setWizardResidentId(residentId);
    setWizardTemplateCategory(searchParams.get("template_category"));
    setShowWizard(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Sort handler ──
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  // ── Open PDF in new tab ──
  const handleViewPdf = (doc: IssuedDocument) => {
    if (doc.pdf_url) {
      window.open(`/api/v1/issued-documents/${doc.id}/pdf`, "_blank");
    }
  };

  // ── Download PDF ──
  const handleDownloadPdf = async (doc: IssuedDocument) => {
    try {
      const response = await fetch(`/api/v1/issued-documents/${doc.id}/pdf`);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.document_number}-${(doc.template_name || "document").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Download failed. Try opening the PDF instead.", "err");
    }
  };

  // ── Update document status ──
  const handleStatusChange = async (docId: string, newStatus: string) => {
    try {
      await api.issuedDocuments.update(docId, { status: newStatus });
      fetchDocuments();
      fetchStats();
      setOpenDropdown(null);
      if (viewDoc?.id === docId) {
        setViewDoc((prev) => prev ? { ...prev, status: newStatus as IssuedDocument["status"] } : null);
      }
      const label = newStatus === "released" ? "marked as released" : newStatus === "cancelled" ? "cancelled" : `updated to ${newStatus}`;
      showToast(`Document ${label}.`, "ok");
    } catch {
      showToast("Failed to update document status. Try again.", "err");
    }
  };

  // ── Format date ──
  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    try {
      return new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Toast notification ── */}
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in slide-in-from-top-2",
            toast.type === "ok" && "bg-emerald-600 text-white",
            toast.type === "err" && "bg-red-600 text-white",
            toast.type === "info" && "bg-slate-800 text-white"
          )}
        >
          {toast.type === "ok" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {toast.type === "err" && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <PageHeader
        title="Documents"
        description="Generated documents and certificates from all barangay modules."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Issued" value={stats.total} icon={<FileText className="w-5 h-5" />} />
        <StatCard label="Pending Release" value={stats.issued} icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Released" value={stats.released} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard label="Cancelled" value={stats.cancelled} icon={<Ban className="w-5 h-5" />} />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents, names, OR numbers..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
        >
          <option value="">All Status</option>
          <option value="issued">Issued (Pending)</option>
          <option value="released">Released</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
        >
          <option value="">All Sources</option>
          <option value="resident">Residents</option>
          <option value="establishment">Establishments</option>
          <option value="lot_building">Lots &amp; Buildings</option>
          <option value="kp_case">KP Cases</option>
          <option value="vawc_case">VAWC Records</option>
          <option value="blotter">Blotter</option>
        </select>
        <select
          value={filterTemplate}
          onChange={(e) => { setFilterTemplate(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
        >
          <option value="">All Types</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Documents Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <SortableHeader label="Doc #" field="document_number" sortKey={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resident</th>
                <SortableHeader label="Document Type" field="template_name" sortKey={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Purpose</th>
                <SortableHeader label="Issued" field="issued_date" sortKey={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Status" field="status" sortKey={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-muted/50 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No documents found</p>
                    <p className="text-xs mt-1">Generate your first document to get started.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const st = STATUS_CFG[doc.status] || { label: "Issued", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" };
                  const sourceCfg = doc.constituent_type ? SOURCE_CFG[doc.constituent_type] : null;
                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setViewDoc(doc)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium">{doc.document_number}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{doc.constituent_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{doc.constituent_number || ""}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        <div className="flex flex-col gap-1">
                          <span className="text-foreground">{doc.template_name || "—"}</span>
                          {sourceCfg && (
                            <span className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium w-fit",
                              sourceCfg.bg,
                              sourceCfg.color
                            )}>
                              {sourceCfg.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{doc.purpose || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(doc.issued_date)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", st.bg, st.color)}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative" ref={openDropdown === doc.id ? dropdownRef : undefined}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === doc.id ? null : doc.id)}
                            className="p-1 rounded hover:bg-muted/50 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {openDropdown === doc.id && (
                            <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-border py-1">
                              <button onClick={() => { setViewDoc(doc); setOpenDropdown(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5" /> View Details
                              </button>
                              {doc.pdf_url && (
                                <>
                                  <button onClick={() => { handleViewPdf(doc); setOpenDropdown(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2">
                                    <Printer className="w-3.5 h-3.5" /> Print PDF
                                  </button>
                                  <button onClick={() => { handleDownloadPdf(doc); setOpenDropdown(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2">
                                    <Download className="w-3.5 h-3.5" /> Download PDF
                                  </button>
                                </>
                              )}
                              {doc.status === "issued" && (
                                <button onClick={() => handleStatusChange(doc.id, "released")} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2 text-emerald-600">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Released
                                </button>
                              )}
                              {(doc.status === "issued" || doc.status === "released") && (
                                <button onClick={() => handleStatusChange(doc.id, "cancelled")} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2 text-red-600">
                                  <Ban className="w-3.5 h-3.5" /> Cancel Document
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalDocs > perPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalDocs)} of {totalDocs}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
                <ChevronLeft className="w-4 h-4 -ml-3" />
              </button>
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium">Page {page} of {lastPage}</span>
              <button onClick={() => setPage(page + 1)} disabled={page === lastPage} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(lastPage)} disabled={page === lastPage} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
                <ChevronRight className="w-4 h-4 -ml-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ GENERATE DOCUMENT WIZARD ═══ */}
      <GenerateDocumentWizard
        open={showWizard}
        onClose={() => { setShowWizard(false); setWizardResidentId(null); setWizardTemplateCategory(null); }}
        onSuccess={(doc) => {
          fetchDocuments();
          fetchStats();
          setViewDoc(doc);
        }}
        initialResidentId={wizardResidentId}
        initialTemplateCategory={wizardTemplateCategory}
      />
      {/* ═══ VIEW DOCUMENT MODAL ═══ */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-background rounded-2xl shadow-2xl border border-border max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
              <div>
                <h3 className="text-base font-bold">Document Details</h3>
                <p className="text-xs text-muted-foreground font-mono">{viewDoc.document_number}</p>
              </div>
              <button onClick={() => setViewDoc(null)} className="p-2 rounded-lg hover:bg-muted/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                  STATUS_CFG[viewDoc.status]?.bg,
                  STATUS_CFG[viewDoc.status]?.color
                )}>
                  {STATUS_CFG[viewDoc.status]?.label}
                </span>
                {viewDoc.blockchain_hash && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                    <Shield className="w-3 h-3" /> {viewDoc.blockchain_hash.slice(0, 16)}...
                  </span>
                )}
              </div>

              {/* Resident info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{viewDoc.constituent_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{viewDoc.constituent_number}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Document Type</p>
                  <p className="font-medium">{viewDoc.template_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Purpose</p>
                  <p className="font-medium">{viewDoc.purpose || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Date Issued</p>
                  <p className="font-medium">{fmtDate(viewDoc.issued_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Valid Until</p>
                  <p className="font-medium">{fmtDate(viewDoc.valid_until)}</p>
                </div>
                {viewDoc.or_number && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">OR Number</p>
                    <p className="font-medium">{viewDoc.or_number}</p>
                  </div>
                )}
                {viewDoc.or_amount && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Amount</p>
                    <p className="font-medium">₱{parseFloat(viewDoc.or_amount).toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Custom field values */}
              {viewDoc.custom_field_values && Object.keys(viewDoc.custom_field_values).length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Additional Details</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {Object.entries(viewDoc.custom_field_values).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Actions */}
              {viewDoc.pdf_url && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300 flex-1">PDF Generated</span>
                  <button
                    onClick={() => handleViewPdf(viewDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => handleViewPdf(viewDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(viewDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              )}

              {/* Status Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {viewDoc.status === "issued" && (
                  <button
                    onClick={() => handleStatusChange(viewDoc.id, "released")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Released
                  </button>
                )}
                {(viewDoc.status === "issued" || viewDoc.status === "released") && (
                  <button
                    onClick={() => handleStatusChange(viewDoc.id, "cancelled")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => setViewDoc(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MabiniButton
        pageContext={`Documents & Certificates management page. Current data: ${stats.total} total documents issued, ${stats.issued} pending release, ${stats.released} released, ${stats.cancelled} cancelled. Available document templates: ${templates.map(t => t.name).join(", ")}. User can generate, print, download, release, and cancel barangay documents. Anti-epal compliant (DILG MC 2026-006). Document types: Barangay Clearance, Certificate of Residency, Certificate of Indigency, Good Moral Character, Business Clearance, and more.`}
      />
    </div>
  );
}

