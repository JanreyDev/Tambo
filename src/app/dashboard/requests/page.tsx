"use client";

import { useState } from "react";
import {
  Receipt,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface ServiceRequest {
  id: string;
  request_number: string;
  document_type: string;
  purpose: string;
  requestor_name: string;
  requestor_contact: string;
  status: string;
  requested_at: string;
  processed_at: string;
  processed_by: string;
  amount: number;
  or_number: string;
  notes: string;
}

const mockRequests: ServiceRequest[] = [
  { id: "1", request_number: "REQ-2026-0201", document_type: "Barangay Clearance", purpose: "Employment", requestor_name: "Maria Dela Cruz", requestor_contact: "0917-123-4567", status: "pending", requested_at: "2026-03-07 08:30", processed_at: "", processed_by: "", amount: 50, or_number: "", notes: "" },
  { id: "2", request_number: "REQ-2026-0200", document_type: "Certificate of Residency", purpose: "School enrollment", requestor_name: "Ana Garcia", requestor_contact: "0918-222-3344", status: "pending", requested_at: "2026-03-07 08:15", processed_at: "", processed_by: "", amount: 30, or_number: "", notes: "" },
  { id: "3", request_number: "REQ-2026-0199", document_type: "Certificate of Indigency", purpose: "Medical assistance (PhilHealth)", requestor_name: "Roberto Cruz Sr.", requestor_contact: "0920-555-6677", status: "processing", requested_at: "2026-03-06 14:00", processed_at: "", processed_by: "Secretary Santos", amount: 0, or_number: "", notes: "Verifying indigency status" },
  { id: "4", request_number: "REQ-2026-0198", document_type: "Barangay Clearance", purpose: "NBI Clearance requirement", requestor_name: "Juan Santos Jr.", requestor_contact: "0919-444-5566", status: "ready", requested_at: "2026-03-06 10:00", processed_at: "2026-03-06 15:00", processed_by: "Secretary Santos", amount: 50, or_number: "OR-2026-0150", notes: "" },
  { id: "5", request_number: "REQ-2026-0195", document_type: "Business Permit Clearance", purpose: "Business permit renewal", requestor_name: "Pedro Reyes", requestor_contact: "0917-888-9900", status: "released", requested_at: "2026-03-05 09:00", processed_at: "2026-03-05 16:00", processed_by: "Secretary Santos", amount: 100, or_number: "OR-2026-0148", notes: "" },
  { id: "6", request_number: "REQ-2026-0190", document_type: "Certificate of Residency", purpose: "Voter registration", requestor_name: "Liza De Los Santos", requestor_contact: "0918-111-2233", status: "released", requested_at: "2026-03-04 13:00", processed_at: "2026-03-04 16:30", processed_by: "Kag. Lopez", amount: 30, or_number: "OR-2026-0145", notes: "" },
  { id: "7", request_number: "REQ-2026-0185", document_type: "Barangay Clearance", purpose: "Employment abroad (OFW)", requestor_name: "Angelo Pascual", requestor_contact: "0920-333-4455", status: "rejected", requested_at: "2026-03-03 10:30", processed_at: "2026-03-03 14:00", processed_by: "Secretary Santos", amount: 0, or_number: "", notes: "Incomplete requirements. Missing valid ID." },
];

const docTypes = ["All Documents", "Barangay Clearance", "Certificate of Residency", "Certificate of Indigency", "Business Permit Clearance"];
const statusOptions = ["All Status", "Pending", "Processing", "Ready", "Released", "Rejected"];

export default function RequestsPage() {
  const [search, setSearch] = useState("");
  const [docFilter, setDocFilter] = useState("All Documents");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewReq, setViewReq] = useState<ServiceRequest | null>(null);
  const pageSize = 10;

  const filtered = mockRequests.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.request_number.toLowerCase().includes(q) && !r.requestor_name.toLowerCase().includes(q)
        && !r.document_type.toLowerCase().includes(q)) return false;
    }
    if (docFilter !== "All Documents" && r.document_type !== docFilter) return false;
    if (statusFilter !== "All Status" && r.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const pendingCount = mockRequests.filter((r) => r.status === "pending" || r.status === "processing").length;
  const readyCount = mockRequests.filter((r) => r.status === "ready").length;
  const todayRevenue = mockRequests.filter((r) => r.or_number && r.processed_at.startsWith("2026-03-06")).reduce((sum, r) => sum + r.amount, 0);

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case "processing": return <Clock className="h-3.5 w-3.5 text-blue-500" />;
      case "ready": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "released": return <CheckCircle2 className="h-3.5 w-3.5 text-gray-500" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Requests"
        description="Track document requests and service transactions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Services" }, { label: "Requests" }]}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={mockRequests.length} icon={<Receipt className="h-5 w-5" />} />
        <StatCard label="Pending / Processing" value={pendingCount} icon={<Clock className="h-5 w-5" />} trend={{ value: 2, label: "today" }} />
        <StatCard label="Ready for Pickup" value={readyCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Revenue (Mar 6)" value={`₱${todayRevenue.toLocaleString()}`} icon={<Receipt className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by request number, name, or document type..."
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
            <select value={docFilter} onChange={(e) => { setDocFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {docTypes.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setDocFilter("All Documents"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Clear</button>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Request #</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Document</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Requestor</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Purpose</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No requests found.</td></tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewReq(r)}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{r.request_number}</p>
                      <p className="text-[11px] text-muted-foreground">{r.requested_at}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-foreground"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> {r.document_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{r.requestor_name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.requestor_contact}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{r.purpose}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium capitalize">
                        {statusIcon(r.status)} {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.amount > 0 ? `₱${r.amount}` : "Free"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      <Modal open={!!viewReq} onClose={() => setViewReq(null)} title={viewReq?.request_number || ""} description={viewReq?.document_type || ""} size="lg"
        footer={<><ModalButton variant="secondary" onClick={() => setViewReq(null)}>Close</ModalButton>{viewReq?.status === "ready" && <ModalButton variant="primary"><Printer className="h-4 w-4 mr-1" />Print & Release</ModalButton>}{viewReq?.status === "pending" && <ModalButton variant="primary">Process Request</ModalButton>}</>}>
        {viewReq && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewReq.status} />
              {viewReq.or_number && <Badge variant="success">OR: {viewReq.or_number}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Requestor</p><p className="text-sm font-medium">{viewReq.requestor_name}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Contact</p><p className="text-sm">{viewReq.requestor_contact}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Purpose</p><p className="text-sm">{viewReq.purpose}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Amount</p><p className="text-sm">{viewReq.amount > 0 ? `₱${viewReq.amount}` : "Free"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Requested At</p><p className="text-sm">{viewReq.requested_at}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Processed At</p><p className="text-sm">{viewReq.processed_at || "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Processed By</p><p className="text-sm">{viewReq.processed_by || "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">OR Number</p><p className="text-sm">{viewReq.or_number || "—"}</p></div>
            </div>
            {viewReq.notes && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-foreground">{viewReq.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
