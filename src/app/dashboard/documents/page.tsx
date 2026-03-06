"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  CheckCircle2,
  FileCheck2,
  QrCode,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

interface IssuedDocument {
  id: string;
  document_number: string;
  resident_name: string;
  resident_number: string;
  document_type: string;
  purpose: string;
  status: string;
  amount_paid: number;
  or_number: string;
  issued_by: string;
  issued_at: string;
  valid_until: string;
  blockchain_hash: string;
}

const mockDocuments: IssuedDocument[] = [
  { id: "1", document_number: "DOC-2026-0342", resident_name: "Dela Cruz, Maria S.", resident_number: "RES-2026-0001", document_type: "Barangay Clearance", purpose: "Local Employment", status: "released", amount_paid: 50, or_number: "OR-2026-0342", issued_by: "Secretary Santos", issued_at: "2026-03-07 10:30", valid_until: "2026-09-07", blockchain_hash: "0x8a4f..." },
  { id: "2", document_number: "DOC-2026-0341", resident_name: "Santos, Juan R.", resident_number: "RES-2026-0002", document_type: "Certificate of Residency", purpose: "School Enrollment", status: "released", amount_paid: 30, or_number: "OR-2026-0341", issued_by: "Secretary Santos", issued_at: "2026-03-07 09:15", valid_until: "2026-06-07", blockchain_hash: "0x7b3e..." },
  { id: "3", document_number: "DOC-2026-0340", resident_name: "Garcia, Ana L.", resident_number: "RES-2026-0003", document_type: "Certificate of Indigency", purpose: "Medical Assistance", status: "released", amount_paid: 0, or_number: "", issued_by: "Kap. Reyes", issued_at: "2026-03-06 14:00", valid_until: "2026-06-06", blockchain_hash: "0x6c2d..." },
  { id: "4", document_number: "DOC-2026-0339", resident_name: "Reyes, Pedro A.", resident_number: "RES-2026-0004", document_type: "Barangay Clearance", purpose: "NBI Clearance", status: "pending", amount_paid: 50, or_number: "OR-2026-0339", issued_by: "", issued_at: "", valid_until: "", blockchain_hash: "" },
  { id: "5", document_number: "DOC-2026-0338", resident_name: "De Los Santos, Rosa B.", resident_number: "RES-2026-0005", document_type: "Business Permit Endorsement", purpose: "Business Permit Renewal", status: "released", amount_paid: 200, or_number: "OR-2026-0338", issued_by: "Kap. Reyes", issued_at: "2026-03-05 11:00", valid_until: "2027-03-05", blockchain_hash: "0x5d1c..." },
  { id: "6", document_number: "DOC-2026-0337", resident_name: "Manalo, Roberto C.", resident_number: "RES-2026-0006", document_type: "Barangay Clearance", purpose: "Overseas Employment", status: "released", amount_paid: 50, or_number: "OR-2026-0337", issued_by: "Secretary Santos", issued_at: "2026-03-05 09:30", valid_until: "2026-09-05", blockchain_hash: "0x4e0b..." },
  { id: "7", document_number: "DOC-2026-0336", resident_name: "Villanueva, Liza T.", resident_number: "RES-2026-0007", document_type: "Certificate of Good Moral", purpose: "Job Application", status: "draft", amount_paid: 0, or_number: "", issued_by: "", issued_at: "", valid_until: "", blockchain_hash: "" },
  { id: "8", document_number: "DOC-2026-0335", resident_name: "Rivera, Carlos M.", resident_number: "RES-2026-0008", document_type: "Certificate of Residency", purpose: "Pension Application", status: "released", amount_paid: 30, or_number: "OR-2026-0335", issued_by: "Secretary Santos", issued_at: "2026-03-04 15:00", valid_until: "2026-06-04", blockchain_hash: "0x3f9a..." },
];

const documentTypes = ["All Types", "Barangay Clearance", "Certificate of Residency", "Certificate of Indigency", "Business Permit Endorsement", "Certificate of Good Moral"];
const statusOptions = ["All Status", "Draft", "Pending", "Released", "Revoked"];

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 10;

  const filtered = mockDocuments.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.resident_name.toLowerCase().includes(q) && !d.document_number.toLowerCase().includes(q) && !d.document_type.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "All Types" && d.document_type !== typeFilter) return false;
    if (statusFilter !== "All Status" && d.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey as keyof IssuedDocument];
    const bVal = b[sortKey as keyof IssuedDocument];
    return sortDir === "asc" ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true }) : String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const releasedCount = mockDocuments.filter((d) => d.status === "released").length;
  const pendingCount = mockDocuments.filter((d) => d.status === "pending" || d.status === "draft").length;
  const totalRevenue = mockDocuments.reduce((sum, d) => sum + d.amount_paid, 0);

  const docTypeColor = (type: string): string => {
    if (type.includes("Clearance")) return "#3b82f6";
    if (type.includes("Residency")) return "#8b5cf6";
    if (type.includes("Indigency")) return "#22c55e";
    if (type.includes("Business")) return "#f59e0b";
    if (type.includes("Good Moral")) return "#06b6d4";
    return "#64748b";
  };

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">{label}{sortKey === field && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
    </th>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Issue and manage barangay certificates, clearances, and permits"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Services" }, { label: "Documents" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Issue Document</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Issued" value={mockDocuments.length} icon={<FileText className="h-5 w-5" />} trend={{ value: 12, label: "vs last month" }} />
        <StatCard label="Released" value={releasedCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Pending / Draft" value={pendingCount} icon={<Clock className="h-5 w-5" />} trend={{ value: -2, label: "processing" }} />
        <StatCard label="Revenue This Month" value={`₱${totalRevenue.toLocaleString()}`} icon={<FileCheck2 className="h-5 w-5" />} trend={{ value: 8, label: "vs last month" }} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by resident, document number, or type..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted")}>
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {documentTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortHeader label="Document" field="document_number" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resident</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Blockchain</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No documents found.</td></tr>
              ) : (
                paged.map((d) => {
                  const typeColor = docTypeColor(d.document_type);
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeColor}15` }}>
                            <FileText className="h-4 w-4" style={{ color: typeColor }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.document_number}</p>
                            <p className="text-[11px] text-muted-foreground">{d.issued_at || "Not yet issued"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{d.resident_name}</p>
                        <p className="text-[11px] text-muted-foreground">{d.resident_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: `${typeColor}15`, color: typeColor }}>{d.document_type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{d.purpose}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{d.amount_paid > 0 ? `₱${d.amount_paid}` : "Free"}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3">
                        {d.blockchain_hash ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <QrCode className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-mono">{d.blockchain_hash}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          {d.status === "released" && (
                            <button className="p-1.5 rounded hover:bg-muted" title="Print"><Printer className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          )}
                          <button className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
