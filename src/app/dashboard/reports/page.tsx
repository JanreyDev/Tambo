"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Printer,
  Filter,
  ChevronRight,
  Users,
  Building2,
  Scale,
  Receipt,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  FileBarChart,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  frequency: string;
  last_generated: string;
  dilg_required: boolean;
}

const reportTemplates: ReportTemplate[] = [
  { id: "1", name: "Barangay Profile Report", category: "General", description: "Complete demographic profile including population count, household summary, and barangay statistics", icon: Users, frequency: "Quarterly", last_generated: "2026-01-15", dilg_required: true },
  { id: "2", name: "Resident Master List", category: "Records", description: "Complete list of all registered residents with personal details and household info", icon: Users, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: false },
  { id: "3", name: "Household Summary Report", category: "Records", description: "Summary of households by purok with member count, income bracket, and household head", icon: Users, frequency: "Quarterly", last_generated: "2026-01-15", dilg_required: true },
  { id: "4", name: "Voter Statistics Report", category: "Records", description: "Voter registration summary by precinct, age group, and gender", icon: Users, frequency: "As needed", last_generated: "2025-10-01", dilg_required: false },
  { id: "5", name: "Establishment Master List", category: "Establishments", description: "List of all registered business establishments with permit status and owner details", icon: Building2, frequency: "Annually", last_generated: "2026-01-05", dilg_required: false },
  { id: "6", name: "KP Case Summary", category: "Judicial", description: "Summary of Katarungang Pambarangay cases filed, settled, and elevated to court", icon: Scale, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: true },
  { id: "7", name: "Blotter Summary Report", category: "Judicial", description: "Monthly summary of blotter entries by incident type, status, and resolution", icon: Scale, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: true },
  { id: "8", name: "VAWC Statistical Report", category: "Judicial", description: "Statistical report on VAWC cases (anonymized) for DILG and DSWD submission", icon: Shield, frequency: "Quarterly", last_generated: "2026-01-15", dilg_required: true },
  { id: "9", name: "Document Issuance Report", category: "Services", description: "Summary of documents issued with revenue collected per document type", icon: FileText, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: false },
  { id: "10", name: "Revenue Collection Report", category: "Finance", description: "Summary of all collections from document issuances, permits, and fees", icon: Receipt, frequency: "Monthly", last_generated: "2026-03-01", dilg_required: false },
  { id: "11", name: "Barangay Annual Report", category: "General", description: "Comprehensive annual report covering all barangay operations for DILG submission", icon: BarChart3, frequency: "Annually", last_generated: "2025-12-31", dilg_required: true },
  { id: "12", name: "Disaster Risk Assessment", category: "Operations", description: "Disaster risk and vulnerability profile of the barangay for DRRM planning", icon: Shield, frequency: "Annually", last_generated: "2025-06-15", dilg_required: true },
];

const categories = ["All", "General", "Records", "Establishments", "Judicial", "Services", "Finance", "Operations"];

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const quarters = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
const years = ["2026", "2025", "2024", "2023"];
const formats = [
  { id: "pdf", label: "PDF Document", icon: FileText, desc: "Best for printing and official submission" },
  { id: "excel", label: "Excel Spreadsheet", icon: FileSpreadsheet, desc: "Best for data analysis and editing" },
  { id: "csv", label: "CSV File", icon: FileBarChart, desc: "Best for importing to other systems" },
];

function ReportSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function ReportsPage() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showDilgOnly, setShowDilgOnly] = useState(false);

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<ReportTemplate | null>(null);
  const [genPeriod, setGenPeriod] = useState("monthly");
  const [genMonth, setGenMonth] = useState(months[new Date().getMonth()]);
  const [genQuarter, setGenQuarter] = useState("Q1 (Jan-Mar)");
  const [genYear, setGenYear] = useState("2026");
  const [genDateFrom, setGenDateFrom] = useState("");
  const [genDateTo, setGenDateTo] = useState("");
  const [genFormat, setGenFormat] = useState("pdf");
  const [genCharts, setGenCharts] = useState(true);

  // Success modal
  const [showSuccess, setShowSuccess] = useState(false);

  // View modal
  const [showView, setShowView] = useState(false);
  const [viewTarget, setViewTarget] = useState<ReportTemplate | null>(null);

  const filtered = reportTemplates.filter((r) => {
    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (showDilgOnly && !r.dilg_required) return false;
    return true;
  });

  const dilgCount = reportTemplates.filter((r) => r.dilg_required).length;

  const openGenerate = (r: ReportTemplate) => {
    setGenerateTarget(r);
    setGenPeriod(r.frequency === "Monthly" ? "monthly" : r.frequency === "Quarterly" ? "quarterly" : r.frequency === "Annually" ? "annually" : "monthly");
    setGenFormat("pdf");
    setGenCharts(true);
    setGenDateFrom("");
    setGenDateTo("");
    setShowGenerate(true);
  };

  const openView = (r: ReportTemplate) => {
    setViewTarget(r);
    setShowView(true);
  };

  const handleGenerate = () => {
    setShowGenerate(false);
    setShowSuccess(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export barangay reports"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Services" }, { label: "Reports" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><TrendingUp className="h-4 w-4" /> Analytics</button>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Templates</p>
          <p className="text-2xl font-bold text-foreground mt-1">{reportTemplates.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">DILG Required</p>
          <p className="text-2xl font-bold text-foreground mt-1">{dilgCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Categories</p>
          <p className="text-2xl font-bold text-foreground mt-1">{categories.length - 1}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                categoryFilter === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setShowDilgOnly(!showDilgOnly)}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
            showDilgOnly ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted text-muted-foreground")}>
          <Filter className="h-3 w-3" /> DILG Required Only
        </button>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all group cursor-pointer"
              onClick={() => openView(r)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-bg)" }}>
                  <Icon className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {r.dilg_required && <Badge variant="warning">DILG</Badge>}
                  <Badge variant="muted">{r.category}</Badge>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{r.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{r.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.frequency}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {r.last_generated}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded hover:bg-muted" title="Download"
                    onClick={(e) => { e.stopPropagation(); }}><Download className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 rounded hover:bg-muted" title="Print"
                    onClick={(e) => { e.stopPropagation(); }}><Printer className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 rounded hover:bg-muted" title="Generate"
                    onClick={(e) => { e.stopPropagation(); openGenerate(r); }}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No reports found for this filter.</div>
      )}

      {/* View Report Details Modal */}
      {viewTarget && (
        <Modal open={showView} title={viewTarget.name} onClose={() => setShowView(false)} size="lg"
          footer={<>
            <ModalButton variant="secondary" onClick={() => setShowView(false)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => { setShowView(false); openGenerate(viewTarget); }}>Generate Report</ModalButton>
          </>}>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-bg)" }}>
                <viewTarget.icon className="h-6 w-6" style={{ color: "var(--accent-primary)" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{viewTarget.name}</h3>
                  {viewTarget.dilg_required && <Badge variant="warning">DILG Required</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{viewTarget.category}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-foreground">{viewTarget.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Frequency</p>
                <p className="text-sm font-medium text-foreground mt-1">{viewTarget.frequency}</p>
              </div>
              <div className="p-3 rounded-lg border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Last Generated</p>
                <p className="text-sm font-medium text-foreground mt-1">{viewTarget.last_generated}</p>
              </div>
            </div>

            {viewTarget.dilg_required && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 font-medium">This report is required by DILG. Ensure timely submission per the prescribed schedule.</p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Report History</p>
              <div className="space-y-2">
                {[
                  { date: viewTarget.last_generated, format: "PDF", size: "245 KB", by: "Kap. Maria Santos" },
                  { date: "2025-12-01", format: "Excel", size: "180 KB", by: "Sec. Ana Cruz" },
                  { date: "2025-11-01", format: "PDF", size: "220 KB", by: "Kap. Maria Santos" },
                ].map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{h.date} - {h.format}</p>
                        <p className="text-[11px] text-muted-foreground">Generated by {h.by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{h.size}</span>
                      <button className="p-1 rounded hover:bg-muted"><Download className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Report Modal */}
      {generateTarget && (
        <Modal open={showGenerate} title={`Generate: ${generateTarget.name}`} onClose={() => setShowGenerate(false)} size="md"
          footer={<>
            <ModalButton variant="secondary" onClick={() => setShowGenerate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleGenerate}>Generate Report</ModalButton>
          </>}>
          <div className="space-y-5">
            {/* Report Period */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Report Period</p>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border mb-3">
                {["monthly", "quarterly", "annually", "custom"].map((p) => (
                  <button key={p} onClick={() => setGenPeriod(p)}
                    className={cn("flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                      genPeriod === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {p}
                  </button>
                ))}
              </div>

              {genPeriod === "monthly" && (
                <div className="grid grid-cols-2 gap-3">
                  <ReportSelect label="Month" value={genMonth} onChange={setGenMonth} options={months} />
                  <ReportSelect label="Year" value={genYear} onChange={setGenYear} options={years} />
                </div>
              )}
              {genPeriod === "quarterly" && (
                <div className="grid grid-cols-2 gap-3">
                  <ReportSelect label="Quarter" value={genQuarter} onChange={setGenQuarter} options={quarters} />
                  <ReportSelect label="Year" value={genYear} onChange={setGenYear} options={years} />
                </div>
              )}
              {genPeriod === "annually" && (
                <ReportSelect label="Year" value={genYear} onChange={setGenYear} options={years} />
              )}
              {genPeriod === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">From</label>
                    <input type="date" value={genDateFrom} onChange={(e) => setGenDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">To</label>
                    <input type="date" value={genDateTo} onChange={(e) => setGenDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--accent-ring)" } as React.CSSProperties} />
                  </div>
                </div>
              )}
            </div>

            {/* Export Format */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Export Format</p>
              <div className="space-y-2">
                {formats.map((f) => {
                  const FIcon = f.icon;
                  return (
                    <button key={f.id} onClick={() => setGenFormat(f.id)}
                      className={cn("w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                        genFormat === f.id ? "border-accent-primary bg-accent-bg" : "border-border hover:bg-muted")}>
                      <FIcon className="h-5 w-5 shrink-0" style={{ color: genFormat === f.id ? "var(--accent-primary)" : "var(--muted-foreground)" }} />
                      <div>
                        <p className={cn("text-sm font-medium", genFormat === f.id ? "text-accent-text" : "text-foreground")}>{f.label}</p>
                        <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Options</p>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Include Charts & Graphs</p>
                  <p className="text-[11px] text-muted-foreground">Add visual data representations to the report</p>
                </div>
                <button onClick={() => setGenCharts(!genCharts)} className="shrink-0">
                  {genCharts
                    ? <div className="w-10 h-6 rounded-full flex items-center justify-end px-0.5" style={{ background: "var(--accent-primary)" }}>
                        <div className="w-5 h-5 rounded-full bg-white" />
                      </div>
                    : <div className="w-10 h-6 rounded-full bg-muted flex items-center px-0.5">
                        <div className="w-5 h-5 rounded-full bg-white shadow" />
                      </div>
                  }
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Summary</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Report:</span>
                <span className="text-foreground font-medium">{generateTarget.name}</span>
                <span className="text-muted-foreground">Period:</span>
                <span className="text-foreground font-medium">
                  {genPeriod === "monthly" && `${genMonth} ${genYear}`}
                  {genPeriod === "quarterly" && `${genQuarter} ${genYear}`}
                  {genPeriod === "annually" && genYear}
                  {genPeriod === "custom" && `${genDateFrom || "..."} to ${genDateTo || "..."}`}
                </span>
                <span className="text-muted-foreground">Format:</span>
                <span className="text-foreground font-medium">{formats.find((f) => f.id === genFormat)?.label}</span>
                <span className="text-muted-foreground">Charts:</span>
                <span className="text-foreground font-medium">{genCharts ? "Included" : "Excluded"}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Modal */}
      {generateTarget && (
        <Modal open={showSuccess} title="Report Generated" onClose={() => setShowSuccess(false)} size="sm"
          footer={<>
            <ModalButton variant="secondary" onClick={() => setShowSuccess(false)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => setShowSuccess(false)}>
              <Download className="h-4 w-4 mr-1.5" /> Download
            </ModalButton>
          </>}>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Report Ready</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {generateTarget.name} has been generated successfully.
            </p>
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-left">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-muted-foreground">File:</span>
                <span className="text-foreground font-medium">{generateTarget.name.replace(/\s+/g, "_")}.{genFormat}</span>
                <span className="text-muted-foreground">Size:</span>
                <span className="text-foreground font-medium">{genFormat === "pdf" ? "245 KB" : genFormat === "excel" ? "180 KB" : "92 KB"}</span>
                <span className="text-muted-foreground">Generated:</span>
                <span className="text-foreground font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
