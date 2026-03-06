"use client";

import { useState } from "react";
import {
  UserCog,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Award,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface Personnel {
  id: string;
  name: string;
  position: string;
  department: string;
  employment_type: string;
  status: string;
  contact: string;
  email: string;
  start_date: string;
  monthly_rate: number;
}

const mockPersonnel: Personnel[] = [
  { id: "1", name: "Hon. Roberto Dela Cruz", position: "Punong Barangay", department: "Executive", employment_type: "Elected", status: "active", contact: "0917-000-0001", email: "captain@brgy-tambo.gov.ph", start_date: "2023-06-30", monthly_rate: 15000 },
  { id: "2", name: "Elena Santos", position: "Barangay Secretary", department: "Administrative", employment_type: "Appointed", status: "active", contact: "0918-000-0002", email: "secretary@brgy-tambo.gov.ph", start_date: "2023-07-01", monthly_rate: 12000 },
  { id: "3", name: "Carmen Reyes", position: "Barangay Treasurer", department: "Finance", employment_type: "Appointed", status: "active", contact: "0919-000-0003", email: "treasurer@brgy-tambo.gov.ph", start_date: "2023-07-01", monthly_rate: 12000 },
  { id: "4", name: "Marco Lopez", position: "Kagawad", department: "Legislative", employment_type: "Elected", status: "active", contact: "0920-000-0004", email: "", start_date: "2023-06-30", monthly_rate: 10000 },
  { id: "5", name: "Angelica Reyes", position: "Kagawad", department: "Legislative", employment_type: "Elected", status: "active", contact: "0921-000-0005", email: "", start_date: "2023-06-30", monthly_rate: 10000 },
  { id: "6", name: "Rosa Pascual", position: "SK Chairperson", department: "SK", employment_type: "Elected", status: "active", contact: "0922-000-0006", email: "sk@brgy-tambo.gov.ph", start_date: "2023-10-30", monthly_rate: 5000 },
  { id: "7", name: "Maria Cruz", position: "Barangay Health Worker", department: "Health", employment_type: "Volunteer", status: "active", contact: "0923-000-0007", email: "", start_date: "2024-01-15", monthly_rate: 3000 },
  { id: "8", name: "Ricardo Garcia", position: "Tanod Chief", department: "Peace & Order", employment_type: "Appointed", status: "active", contact: "0917-111-2222", email: "", start_date: "2022-01-15", monthly_rate: 5000 },
  { id: "9", name: "Luisa Mendoza", position: "Day Care Worker", department: "Social Services", employment_type: "Appointed", status: "active", contact: "0924-000-0009", email: "", start_date: "2020-06-01", monthly_rate: 8000 },
  { id: "10", name: "Pedro Bautista", position: "Utility Worker", department: "Administrative", employment_type: "Job Order", status: "active", contact: "0925-000-0010", email: "", start_date: "2025-01-02", monthly_rate: 6000 },
];

const departments = ["All", "Executive", "Administrative", "Finance", "Legislative", "SK", "Health", "Peace & Order", "Social Services"];

export default function HrisPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [viewPerson, setViewPerson] = useState<Personnel | null>(null);

  const filtered = mockPersonnel.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.position.toLowerCase().includes(q);
    }
    if (deptFilter !== "All" && p.department !== deptFilter) return false;
    return true;
  });

  const totalPayroll = mockPersonnel.filter((p) => p.status === "active").reduce((sum, p) => sum + p.monthly_rate, 0);
  const electedCount = mockPersonnel.filter((p) => p.employment_type === "Elected").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="HRIS"
        description="Barangay personnel and human resources"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "HRIS" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Add Personnel</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Personnel" value={mockPersonnel.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Elected Officials" value={electedCount} icon={<Award className="h-5 w-5" />} />
        <StatCard label="Departments" value={departments.length - 1} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Monthly Payroll" value={`₱${totalPayroll.toLocaleString()}`} icon={<UserCog className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or position..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Position</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monthly Rate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No personnel found.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewPerson(p)}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {p.contact}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.position}</td>
                  <td className="px-4 py-3"><Badge variant="muted">{p.department}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={p.employment_type === "Elected" ? "info" : p.employment_type === "Volunteer" ? "warning" : "muted"}>{p.employment_type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">₱{p.monthly_rate.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewPerson} onClose={() => setViewPerson(null)} title={viewPerson?.name || ""} description={viewPerson?.position || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewPerson(null)}>Close</ModalButton><ModalButton variant="primary">Edit Record</ModalButton></>}>
        {viewPerson && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewPerson.status} />
              <Badge variant={viewPerson.employment_type === "Elected" ? "info" : "muted"}>{viewPerson.employment_type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Department</p><p className="text-sm">{viewPerson.department}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Monthly Rate</p><p className="text-sm">₱{viewPerson.monthly_rate.toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Contact</p><p className="text-sm">{viewPerson.contact}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Email</p><p className="text-sm">{viewPerson.email || "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Start Date</p><p className="text-sm">{viewPerson.start_date}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
