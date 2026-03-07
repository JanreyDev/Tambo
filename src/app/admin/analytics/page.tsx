"use client";

import {
  TrendingUp,
  Users,
  FileText,
  Building2,
  ArrowUpRight,
  Calendar,
  Download,
  ChevronRight,
  Globe,
  Activity,
  Clock,
  Target,
  Eye,
} from "lucide-react";

function BarChartHorizontal({ data }: { data: { label: string; value: number; max: number; color: string }[] }) {
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{d.label}</span>
            <span className="text-xs font-semibold text-foreground">{d.value.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(d.value / d.max) * 100}%`, background: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Widget({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}>{children}</div>;
}

function WidgetHeader({ title, icon: Icon, action }: { title: string; icon?: React.ElementType; action?: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {action && (
        <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-PH", { month: "long", year: "numeric" });

  const monthlyDocs = [
    { month: "Oct", value: 2840 },
    { month: "Nov", value: 3120 },
    { month: "Dec", value: 2680 },
    { month: "Jan", value: 3450 },
    { month: "Feb", value: 3890 },
    { month: "Mar", value: 4200 },
  ];
  const maxDocs = Math.max(...monthlyDocs.map(d => d.value));

  const topBarangays = [
    { label: "Brgy. Barretto", value: 3210, max: 3210, color: "#3b82f6" },
    { label: "Brgy. San Jose", value: 2341, max: 3210, color: "#8b5cf6" },
    { label: "Brgy. Mabayuan", value: 1856, max: 3210, color: "#22c55e" },
    { label: "Brgy. Tambo", value: 1247, max: 3210, color: "#f59e0b" },
    { label: "Brgy. East Tapinac", value: 1123, max: 3210, color: "#06b6d4" },
  ];

  const docTypes = [
    { label: "Barangay Clearance", value: 4820, max: 4820, color: "#3b82f6" },
    { label: "Certificate of Residency", value: 3210, max: 4820, color: "#8b5cf6" },
    { label: "Certificate of Indigency", value: 2450, max: 4820, color: "#22c55e" },
    { label: "Business Permit", value: 1890, max: 4820, color: "#f59e0b" },
    { label: "Blotter Report", value: 680, max: 4820, color: "#ef4444" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cross-barangay insights and platform metrics for {dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
            <Calendar className="w-3.5 h-3.5" /> Last 6 Months
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Total Residents (All Brgy)", value: "28,456", trend: "+342 this month", trendUp: true, icon: Users, color: "#3b82f6" },
          { label: "Documents Issued (All)", value: "12,400", trend: "+892 this month", trendUp: true, icon: FileText, color: "#8b5cf6" },
          { label: "Active Users (All)", value: "247", trend: "+18 this month", trendUp: true, icon: Activity, color: "#22c55e" },
          { label: "Avg Session Duration", value: "24 min", trend: "+3 min vs last month", trendUp: true, icon: Clock, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.05]" style={{ background: s.color }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-500">{s.trend}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Document Trend + Document Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget className="lg:col-span-2">
          <WidgetHeader title="Monthly Document Generation" icon={TrendingUp} action="View Details" />
          <div className="px-5 pb-4">
            <div className="flex items-end justify-between gap-4 h-[180px] mt-2">
              {monthlyDocs.map((d, i) => {
                const h = (d.value / maxDocs) * 160;
                const isLast = i === monthlyDocs.length - 1;
                return (
                  <div key={d.month} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">{d.value.toLocaleString()}</span>
                    <div className="w-full relative rounded-t-md overflow-hidden" style={{ height: `${h}px` }}>
                      <div className="absolute inset-0 rounded-t-md" style={{
                        background: isLast ? "linear-gradient(to top, #2563eb, #60a5fa)" : "linear-gradient(to top, #64748b30, #94a3b830)"
                      }} />
                    </div>
                    <span className={`text-[10px] font-medium ${isLast ? "text-blue-600 font-bold" : "text-muted-foreground"}`}>{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title="Document Types" icon={FileText} />
          <div className="px-5 pb-4">
            <BarChartHorizontal data={docTypes} />
          </div>
        </Widget>
      </div>

      {/* Row 3: Top Barangays + Regional + Usage Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget>
          <WidgetHeader title="Top Barangays by Residents" icon={Building2} />
          <div className="px-5 pb-4">
            <BarChartHorizontal data={topBarangays} />
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title="Adoption Metrics" icon={Target} />
          <div className="px-5 pb-4 space-y-4">
            {[
              { label: "Feature Adoption Rate", value: "78%", detail: "Avg modules used per barangay", color: "#3b82f6" },
              { label: "User Engagement", value: "89%", detail: "Monthly active users ratio", color: "#22c55e" },
              { label: "Document Digitization", value: "92%", detail: "Documents issued digitally vs manual", color: "#8b5cf6" },
              { label: "AI Assistant Usage", value: "45%", detail: "Barangays using AI features", color: "#f59e0b" },
              { label: "SMS Integration", value: "67%", detail: "Barangays with active SMS", color: "#06b6d4" },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.detail}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </Widget>

        <Widget>
          <WidgetHeader title="Platform Usage" icon={Eye} />
          <div className="px-5 pb-4 space-y-4">
            {[
              { label: "Peak Hours", value: "9AM - 11AM", detail: "Highest activity period", icon: Clock },
              { label: "Most Used Module", value: "Residents", detail: "Across all barangays", icon: Users },
              { label: "Top Document", value: "Brgy. Clearance", detail: "39% of all documents", icon: FileText },
              { label: "Busiest Day", value: "Tuesday", detail: "Avg 1,200+ actions", icon: Calendar },
              { label: "Mobile Usage", value: "34%", detail: "Users on mobile devices", icon: Globe },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 shrink-0">
                  <m.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.detail}</p>
                </div>
                <span className="text-xs font-bold text-foreground">{m.value}</span>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </div>
  );
}
