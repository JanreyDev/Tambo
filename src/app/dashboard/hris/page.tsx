"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Building2,
  Calendar,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Briefcase,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { MabiniButton } from "@/components/ui/mabini-button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  barangay_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  position: string;
  office_id: string | null;
  employment_type: "permanent" | "casual" | "contract_of_service" | "job_order";
  appointment_date: string | null;
  tin: string | null;
  gsis_number: string | null;
  phic_number: string | null;
  hdmf_number: string | null;
  salary_grade: string | null;
  monthly_salary: string | null;
  status: "active" | "inactive" | "resigned" | "retired";
  email: string | null;
  contact_number: string | null;
}

interface Office {
  id: string;
  name: string;
  description: string | null;
  head_employee_id: string | null;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  status: "present" | "absent" | "late" | "half_day" | "on_leave";
  remarks: string | null;
  employee?: { first_name: string; last_name: string; middle_name: string | null };
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface EmployeeFormData {
  employee_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  position: string;
  office_id: string;
  employment_type: string;
  appointment_date: string;
  tin: string;
  gsis_number: string;
  phic_number: string;
  hdmf_number: string;
  salary_grade: string;
  monthly_salary: string;
  status: string;
  email: string;
  contact_number: string;
}

interface OfficeFormData {
  name: string;
  description: string;
  head_employee_id: string;
}

interface AttendanceFormData {
  employee_id: string;
  attendance_date: string;
  time_in: string;
  time_out: string;
  status: string;
  remarks: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fullName(emp: Pick<Employee, "last_name" | "first_name" | "middle_name">): string {
  const parts = [emp.last_name.toUpperCase(), ",", emp.first_name];
  if (emp.middle_name) parts.push(emp.middle_name);
  return parts.join(" ").replace(", ", ", ");
}

function peso(n: number | string | null | undefined): string {
  const num = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (isNaN(num)) return "₱0.00";
  return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function empTypeBadge(type: Employee["employment_type"]) {
  const map: Record<Employee["employment_type"], { label: string; variant: "success" | "info" | "warning" | "accent" }> = {
    permanent: { label: "Permanent", variant: "success" },
    casual: { label: "Casual", variant: "info" },
    contract_of_service: { label: "Contract of Service", variant: "warning" },
    job_order: { label: "Job Order", variant: "accent" },
  };
  const cfg = map[type] ?? { label: type, variant: "info" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function empStatusBadge(status: Employee["status"]) {
  const map: Record<Employee["status"], { label: string; variant: "success" | "muted" | "danger" | "warning" }> = {
    active: { label: "Active", variant: "success" },
    inactive: { label: "Inactive", variant: "muted" },
    resigned: { label: "Resigned", variant: "danger" },
    retired: { label: "Retired", variant: "warning" },
  };
  const cfg = map[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function attendanceBadge(status: AttendanceRecord["status"]) {
  const map: Record<AttendanceRecord["status"], { label: string; variant: "success" | "danger" | "warning" | "info" | "accent" }> = {
    present: { label: "Present", variant: "success" },
    absent: { label: "Absent", variant: "danger" },
    late: { label: "Late", variant: "warning" },
    half_day: { label: "Half Day", variant: "info" },
    on_leave: { label: "On Leave", variant: "accent" },
  };
  const cfg = map[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FInput({
  label, name, value, placeholder, required, type, error, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  required?: boolean; type?: string; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FSelect({
  label, name, value, options, required, error, onChange,
}: {
  label: string; name: string; value: string;
  options: { value: string; label: string }[];
  required?: boolean; error?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2",
          error ? "border-red-500 focus:ring-red-300" : "border-border focus:ring-accent-ring"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FTextarea({
  label, name, value, placeholder, rows, required, onChange,
}: {
  label: string; name: string; value: string; placeholder?: string;
  rows?: number; required?: boolean;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
      />
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: string; type: ToastType; title: string; message?: string }

function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[320px] max-w-[420px] animate-in slide-in-from-right-5",
            t.type === "success" && "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800",
            t.type === "error" && "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800",
            t.type === "warning" && "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800",
            t.type === "info" && "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800"
          )}
        >
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium",
              t.type === "success" && "text-green-800 dark:text-green-200",
              t.type === "error" && "text-red-800 dark:text-red-200",
              t.type === "warning" && "text-amber-800 dark:text-amber-200",
              t.type === "info" && "text-blue-800 dark:text-blue-200"
            )}>{t.title}</p>
            {t.message && (
              <p className={cn(
                "text-xs mt-0.5",
                t.type === "success" && "text-green-600 dark:text-green-300",
                t.type === "error" && "text-red-600 dark:text-red-300",
                t.type === "warning" && "text-amber-600 dark:text-amber-300",
                t.type === "info" && "text-blue-600 dark:text-blue-300"
              )}>{t.message}</p>
            )}
          </div>
          <button onClick={() => dismiss(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
        </div>
      ))}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_EMP_FORM: EmployeeFormData = {
  employee_number: "", first_name: "", last_name: "", middle_name: "",
  position: "", office_id: "", employment_type: "", appointment_date: "",
  tin: "", gsis_number: "", phic_number: "", hdmf_number: "",
  salary_grade: "", monthly_salary: "", status: "", email: "", contact_number: "",
};

const EMPTY_OFFICE_FORM: OfficeFormData = { name: "", description: "", head_employee_id: "" };

const EMPTY_ATT_FORM: AttendanceFormData = {
  employee_id: "", attendance_date: "", time_in: "", time_out: "", status: "", remarks: "",
};

const EMP_TYPE_OPTIONS = [
  { value: "", label: "— Employment Type —" },
  { value: "permanent", label: "Permanent" },
  { value: "casual", label: "Casual" },
  { value: "contract_of_service", label: "Contract of Service" },
  { value: "job_order", label: "Job Order" },
];

const EMP_STATUS_OPTIONS = [
  { value: "", label: "— Status —" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "resigned", label: "Resigned" },
  { value: "retired", label: "Retired" },
];

const ATT_STATUS_OPTIONS = [
  { value: "", label: "— Status —" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "on_leave", label: "On Leave" },
];

type ActiveTab = "employees" | "offices" | "attendance";

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${50 + (i * 11) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HrisPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("employees");

  // ── Toast ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Employees state ──
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [empPage, setEmpPage] = useState(1);
  const [empLastPage, setEmpLastPage] = useState(1);
  const [empTotal, setEmpTotal] = useState(0);
  const [empSearch, setEmpSearch] = useState("");
  const [empSearchInput, setEmpSearchInput] = useState("");
  const [empStatusFilter, setEmpStatusFilter] = useState("");
  const [empTypeFilter, setEmpTypeFilter] = useState("");
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [showCreateEmp, setShowCreateEmp] = useState(false);
  const [empForm, setEmpForm] = useState<EmployeeFormData>(EMPTY_EMP_FORM);
  const [empFormErrors, setEmpFormErrors] = useState<Record<string, string>>({});
  const [empFormTab, setEmpFormTab] = useState(0);
  const [empSubmitting, setEmpSubmitting] = useState(false);
  const [empDeleting, setEmpDeleting] = useState(false);

  // ── Offices state ──
  const [offices, setOffices] = useState<Office[]>([]);
  const [officesLoading, setOfficesLoading] = useState(true);
  const [viewOffice, setViewOffice] = useState<Office | null>(null);
  const [editOffice, setEditOffice] = useState<Office | null>(null);
  const [deleteOffice, setDeleteOffice] = useState<Office | null>(null);
  const [showCreateOffice, setShowCreateOffice] = useState(false);
  const [officeForm, setOfficeForm] = useState<OfficeFormData>(EMPTY_OFFICE_FORM);
  const [officeFormErrors, setOfficeFormErrors] = useState<Record<string, string>>({});
  const [officeSubmitting, setOfficeSubmitting] = useState(false);
  const [officeDeleting, setOfficeDeleting] = useState(false);

  // ── Attendance state ──
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attLoading, setAttLoading] = useState(true);
  const [attPage, setAttPage] = useState(1);
  const [attLastPage, setAttLastPage] = useState(1);
  const [attTotal, setAttTotal] = useState(0);
  const [attDateFrom, setAttDateFrom] = useState("");
  const [attDateTo, setAttDateTo] = useState("");
  const [attEmployeeId, setAttEmployeeId] = useState("");
  const [attStatusFilter, setAttStatusFilter] = useState("");
  const [showCreateAtt, setShowCreateAtt] = useState(false);
  const [deleteAtt, setDeleteAtt] = useState<AttendanceRecord | null>(null);
  const [attForm, setAttForm] = useState<AttendanceFormData>(EMPTY_ATT_FORM);
  const [attFormErrors, setAttFormErrors] = useState<Record<string, string>>({});
  const [attSubmitting, setAttSubmitting] = useState(false);
  const [attDeleting, setAttDeleting] = useState(false);

  // ── Fetch employees ────────────────────────────────────────────────────────

  const fetchEmployees = useCallback(async () => {
    setEmpLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(empPage));
      params.set("per_page", "15");
      if (empSearch) params.set("search", empSearch);
      if (empStatusFilter) params.set("status", empStatusFilter);
      if (empTypeFilter) params.set("employment_type", empTypeFilter);
      const res = await api.get<PaginatedResponse<Employee>>(`/employees?${params.toString()}`);
      setEmployees(res.data);
      setEmpLastPage(res.last_page);
      setEmpTotal(res.total);
    } catch {
      addToast("error", "Failed to load employees");
    } finally {
      setEmpLoading(false);
    }
  }, [empPage, empSearch, empStatusFilter, empTypeFilter, addToast]);

  // ── Fetch offices ──────────────────────────────────────────────────────────

  const fetchOffices = useCallback(async () => {
    setOfficesLoading(true);
    try {
      const res = await api.get<{ data: Office[] }>("/offices");
      setOffices(res.data);
    } catch {
      addToast("error", "Failed to load offices");
    } finally {
      setOfficesLoading(false);
    }
  }, [addToast]);

  // ── Fetch attendance ───────────────────────────────────────────────────────

  const fetchAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(attPage));
      params.set("per_page", "15");
      if (attEmployeeId) params.set("employee_id", attEmployeeId);
      if (attDateFrom) params.set("date_from", attDateFrom);
      if (attDateTo) params.set("date_to", attDateTo);
      if (attStatusFilter) params.set("status", attStatusFilter);
      const res = await api.get<PaginatedResponse<AttendanceRecord>>(`/attendance-records?${params.toString()}`);
      setAttendance(res.data);
      setAttLastPage(res.last_page);
      setAttTotal(res.total);
    } catch {
      addToast("error", "Failed to load attendance records");
    } finally {
      setAttLoading(false);
    }
  }, [attPage, attEmployeeId, attDateFrom, attDateTo, attStatusFilter, addToast]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === "employees") fetchEmployees();
  }, [activeTab, fetchEmployees]);

  useEffect(() => {
    if (activeTab === "offices") fetchOffices();
  }, [activeTab, fetchOffices]);

  useEffect(() => {
    if (activeTab === "attendance") fetchAttendance();
  }, [activeTab, fetchAttendance]);

  // Always load offices (needed for employee form dropdown)
  useEffect(() => { fetchOffices(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Employee search debounce
  useEffect(() => {
    const t = setTimeout(() => { setEmpSearch(empSearchInput); setEmpPage(1); }, 400);
    return () => clearTimeout(t);
  }, [empSearchInput]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalEmployees = empTotal;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const totalOffices = offices.length;

  // ── Employee form helpers ──────────────────────────────────────────────────

  const handleEmpFieldChange = (name: string, value: string) => {
    setEmpForm((f) => ({ ...f, [name]: value }));
    setEmpFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateEmpForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!empForm.employee_number.trim()) errors.employee_number = "Employee number is required";
    if (!empForm.first_name.trim()) errors.first_name = "First name is required";
    if (!empForm.last_name.trim()) errors.last_name = "Last name is required";
    if (!empForm.position.trim()) errors.position = "Position is required";
    if (empForm.monthly_salary && isNaN(parseFloat(empForm.monthly_salary))) errors.monthly_salary = "Must be a valid number";
    setEmpFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateEmp = () => {
    setEmpForm(EMPTY_EMP_FORM);
    setEmpFormErrors({});
    setEmpFormTab(0);
    setShowCreateEmp(true);
  };

  const openEditEmp = (emp: Employee) => {
    setEmpForm({
      employee_number: emp.employee_number,
      first_name: emp.first_name,
      last_name: emp.last_name,
      middle_name: emp.middle_name ?? "",
      position: emp.position,
      office_id: emp.office_id ?? "",
      employment_type: emp.employment_type,
      appointment_date: emp.appointment_date ?? "",
      tin: emp.tin ?? "",
      gsis_number: emp.gsis_number ?? "",
      phic_number: emp.phic_number ?? "",
      hdmf_number: emp.hdmf_number ?? "",
      salary_grade: emp.salary_grade ?? "",
      monthly_salary: emp.monthly_salary ?? "",
      status: emp.status,
      email: emp.email ?? "",
      contact_number: emp.contact_number ?? "",
    });
    setEmpFormErrors({});
    setEmpFormTab(0);
    setEditEmployee(emp);
  };

  const closeEmpForm = () => {
    setShowCreateEmp(false);
    setEditEmployee(null);
    setEmpForm(EMPTY_EMP_FORM);
    setEmpFormErrors({});
  };

  const handleCreateEmp = async () => {
    if (!validateEmpForm()) return;
    setEmpSubmitting(true);
    try {
      await api.post("/employees", {
        employee_number: empForm.employee_number.trim(),
        first_name: empForm.first_name.trim(),
        last_name: empForm.last_name.trim(),
        middle_name: empForm.middle_name.trim() || null,
        position: empForm.position.trim(),
        office_id: empForm.office_id || null,
        employment_type: empForm.employment_type || null,
        appointment_date: empForm.appointment_date || null,
        tin: empForm.tin.trim() || null,
        gsis_number: empForm.gsis_number.trim() || null,
        phic_number: empForm.phic_number.trim() || null,
        hdmf_number: empForm.hdmf_number.trim() || null,
        salary_grade: empForm.salary_grade.trim() || null,
        monthly_salary: empForm.monthly_salary ? parseFloat(empForm.monthly_salary) : null,
        status: empForm.status || "active",
        email: empForm.email.trim() || null,
        contact_number: empForm.contact_number.trim() || null,
      });
      addToast("success", "Employee added", `${empForm.last_name}, ${empForm.first_name} has been added.`);
      closeEmpForm();
      fetchEmployees();
    } catch (err: unknown) {
      addToast("error", "Create failed", (err as { message?: string })?.message ?? "Failed to add employee.");
    } finally {
      setEmpSubmitting(false);
    }
  };

  const handleUpdateEmp = async () => {
    if (!editEmployee || !validateEmpForm()) return;
    setEmpSubmitting(true);
    try {
      await api.put(`/employees/${editEmployee.id}`, {
        employee_number: empForm.employee_number.trim(),
        first_name: empForm.first_name.trim(),
        last_name: empForm.last_name.trim(),
        middle_name: empForm.middle_name.trim() || null,
        position: empForm.position.trim(),
        office_id: empForm.office_id || null,
        employment_type: empForm.employment_type || null,
        appointment_date: empForm.appointment_date || null,
        tin: empForm.tin.trim() || null,
        gsis_number: empForm.gsis_number.trim() || null,
        phic_number: empForm.phic_number.trim() || null,
        hdmf_number: empForm.hdmf_number.trim() || null,
        salary_grade: empForm.salary_grade.trim() || null,
        monthly_salary: empForm.monthly_salary ? parseFloat(empForm.monthly_salary) : null,
        status: empForm.status || null,
        email: empForm.email.trim() || null,
        contact_number: empForm.contact_number.trim() || null,
      });
      addToast("success", "Employee updated", `${empForm.last_name}, ${empForm.first_name} has been saved.`);
      closeEmpForm();
      if (viewEmployee?.id === editEmployee.id) setViewEmployee(null);
      fetchEmployees();
    } catch (err: unknown) {
      addToast("error", "Update failed", (err as { message?: string })?.message ?? "Failed to update employee.");
    } finally {
      setEmpSubmitting(false);
    }
  };

  const handleDeleteEmp = async () => {
    if (!deleteEmployee) return;
    setEmpDeleting(true);
    try {
      await api.delete(`/employees/${deleteEmployee.id}`);
      addToast("success", "Employee removed", `${deleteEmployee.last_name}, ${deleteEmployee.first_name} has been deleted.`);
      setDeleteEmployee(null);
      if (viewEmployee?.id === deleteEmployee.id) setViewEmployee(null);
      fetchEmployees();
    } catch (err: unknown) {
      addToast("error", "Delete failed", (err as { message?: string })?.message ?? "Failed to delete employee.");
    } finally {
      setEmpDeleting(false);
    }
  };

  // ── Office form helpers ────────────────────────────────────────────────────

  const handleOfficeFieldChange = (name: string, value: string) => {
    setOfficeForm((f) => ({ ...f, [name]: value }));
    setOfficeFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateOfficeForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!officeForm.name.trim()) errors.name = "Office name is required";
    setOfficeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateOffice = () => {
    setOfficeForm(EMPTY_OFFICE_FORM);
    setOfficeFormErrors({});
    setShowCreateOffice(true);
  };

  const openEditOffice = (office: Office) => {
    setOfficeForm({
      name: office.name,
      description: office.description ?? "",
      head_employee_id: office.head_employee_id ?? "",
    });
    setOfficeFormErrors({});
    setEditOffice(office);
  };

  const closeOfficeForm = () => {
    setShowCreateOffice(false);
    setEditOffice(null);
    setOfficeForm(EMPTY_OFFICE_FORM);
    setOfficeFormErrors({});
  };

  const handleCreateOffice = async () => {
    if (!validateOfficeForm()) return;
    setOfficeSubmitting(true);
    try {
      await api.post("/offices", {
        name: officeForm.name.trim(),
        description: officeForm.description.trim() || null,
        head_employee_id: officeForm.head_employee_id || null,
      });
      addToast("success", "Office created", `"${officeForm.name}" has been added.`);
      closeOfficeForm();
      fetchOffices();
    } catch (err: unknown) {
      addToast("error", "Create failed", (err as { message?: string })?.message ?? "Failed to create office.");
    } finally {
      setOfficeSubmitting(false);
    }
  };

  const handleUpdateOffice = async () => {
    if (!editOffice || !validateOfficeForm()) return;
    setOfficeSubmitting(true);
    try {
      await api.put(`/offices/${editOffice.id}`, {
        name: officeForm.name.trim(),
        description: officeForm.description.trim() || null,
        head_employee_id: officeForm.head_employee_id || null,
      });
      addToast("success", "Office updated", `"${officeForm.name}" has been saved.`);
      closeOfficeForm();
      if (viewOffice?.id === editOffice.id) setViewOffice(null);
      fetchOffices();
    } catch (err: unknown) {
      addToast("error", "Update failed", (err as { message?: string })?.message ?? "Failed to update office.");
    } finally {
      setOfficeSubmitting(false);
    }
  };

  const handleDeleteOffice = async () => {
    if (!deleteOffice) return;
    setOfficeDeleting(true);
    try {
      await api.delete(`/offices/${deleteOffice.id}`);
      addToast("success", "Office deleted", `"${deleteOffice.name}" has been removed.`);
      setDeleteOffice(null);
      if (viewOffice?.id === deleteOffice.id) setViewOffice(null);
      fetchOffices();
    } catch (err: unknown) {
      addToast("error", "Delete failed", (err as { message?: string })?.message ?? "Failed to delete office.");
    } finally {
      setOfficeDeleting(false);
    }
  };

  // ── Attendance form helpers ────────────────────────────────────────────────

  const handleAttFieldChange = (name: string, value: string) => {
    setAttForm((f) => ({ ...f, [name]: value }));
    setAttFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateAttForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!attForm.employee_id) errors.employee_id = "Employee is required";
    if (!attForm.attendance_date) errors.attendance_date = "Date is required";
    if (!attForm.status) errors.status = "Status is required";
    setAttFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateAtt = () => {
    setAttForm(EMPTY_ATT_FORM);
    setAttFormErrors({});
    setShowCreateAtt(true);
  };

  const closeAttForm = () => {
    setShowCreateAtt(false);
    setAttForm(EMPTY_ATT_FORM);
    setAttFormErrors({});
  };

  const handleCreateAtt = async () => {
    if (!validateAttForm()) return;
    setAttSubmitting(true);
    try {
      await api.post("/attendance-records", {
        employee_id: attForm.employee_id,
        attendance_date: attForm.attendance_date,
        time_in: attForm.time_in || null,
        time_out: attForm.time_out || null,
        status: attForm.status,
        remarks: attForm.remarks.trim() || null,
      });
      addToast("success", "Attendance recorded", "Record has been saved.");
      closeAttForm();
      fetchAttendance();
    } catch (err: unknown) {
      addToast("error", "Create failed", (err as { message?: string })?.message ?? "Failed to save attendance.");
    } finally {
      setAttSubmitting(false);
    }
  };

  const handleDeleteAtt = async () => {
    if (!deleteAtt) return;
    setAttDeleting(true);
    try {
      await api.delete(`/attendance-records/${deleteAtt.id}`);
      addToast("success", "Attendance record deleted");
      setDeleteAtt(null);
      fetchAttendance();
    } catch (err: unknown) {
      addToast("error", "Delete failed", (err as { message?: string })?.message ?? "Failed to delete record.");
    } finally {
      setAttDeleting(false);
    }
  };

  // ── Office name resolver ──────────────────────────────────────────────────

  const officeMap = new Map(offices.map((o) => [o.id, o.name]));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="HRIS"
        description="Human Resource Information System — employees, offices, and attendance"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "HRIS" },
        ]}
        actions={
          activeTab === "employees" ? (
            <button
              onClick={openCreateEmp}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          ) : activeTab === "offices" ? (
            <button
              onClick={openCreateOffice}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
            >
              <Plus className="h-4 w-4" />
              Add Office
            </button>
          ) : (
            <button
              onClick={openCreateAtt}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
            >
              <Plus className="h-4 w-4" />
              Log Attendance
            </button>
          )
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Employees"
          value={empLoading ? "—" : totalEmployees}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Active"
          value={empLoading ? "—" : activeEmployees}
          icon={<UserCog className="h-5 w-5" />}
        />
        <StatCard
          label="Offices"
          value={officesLoading ? "—" : totalOffices}
          icon={<Building2 className="h-5 w-5" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle w-fit">
        {(["employees", "offices", "attendance"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "attendance" ? "Attendance" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Employees Tab ─────────────────────────────────────────────────── */}
      {activeTab === "employees" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={empSearchInput}
                onChange={(e) => setEmpSearchInput(e.target.value)}
                placeholder="Search name or employee number..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
            </div>
            <select
              value={empStatusFilter}
              onChange={(e) => { setEmpStatusFilter(e.target.value); setEmpPage(1); }}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="resigned">Resigned</option>
              <option value="retired">Retired</option>
            </select>
            <select
              value={empTypeFilter}
              onChange={(e) => { setEmpTypeFilter(e.target.value); setEmpPage(1); }}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Types</option>
              <option value="permanent">Permanent</option>
              <option value="casual">Casual</option>
              <option value="contract_of_service">Contract of Service</option>
              <option value="job_order">Job Order</option>
            </select>
          </div>

          {/* Employees Table */}
          <div className="rounded-xl glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Employee No.</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Full Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Position</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Office</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Type</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Monthly Salary</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="w-24 px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {empLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">No employees found</p>
                          <p className="text-xs text-muted-foreground mt-1">Add barangay employees to manage their records and attendance.</p>
                        </div>
                        <button
                          onClick={openCreateEmp}
                          className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                          style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                        >
                          + Add Employee
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setViewEmployee(emp)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-muted-foreground">{emp.employee_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{fullName(emp)}</p>
                        {emp.contact_number && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{emp.contact_number}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{emp.position}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {emp.office_id ? (officeMap.get(emp.office_id) ?? "—") : "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">{empTypeBadge(emp.employment_type)}</td>
                      <td className="px-4 py-3 text-sm text-foreground text-right hidden lg:table-cell">
                        {emp.monthly_salary ? peso(emp.monthly_salary) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">{empStatusBadge(emp.status)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewEmployee(emp)}
                            title="View"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => openEditEmp(emp)}
                            title="Edit"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60"
                          >
                            <Edit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </button>
                          <button
                            onClick={() => setDeleteEmployee(emp)}
                            title="Delete"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Employees Pagination */}
          {!empLoading && empLastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {empPage} of {empLastPage} — {empTotal} employee{empTotal !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                  disabled={empPage === 1}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEmpPage((p) => Math.min(empLastPage, p + 1))}
                  disabled={empPage === empLastPage}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Offices Tab ───────────────────────────────────────────────────── */}
      {activeTab === "offices" && (
        <div className="rounded-xl glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Office Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="w-24 px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {officesLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
              ) : offices.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">No offices found</p>
                        <p className="text-xs text-muted-foreground mt-1">Create offices to organize employees by department.</p>
                      </div>
                      <button
                        onClick={openCreateOffice}
                        className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                        style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                      >
                        + Add Office
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                offices.map((office) => (
                  <tr
                    key={office.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setViewOffice(office)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{office.name}</p>
                      {office.head_employee_id && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Head: {employees.find((e) => e.id === office.head_employee_id)
                            ? fullName(employees.find((e) => e.id === office.head_employee_id)!)
                            : "—"}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {office.description ?? "—"}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditOffice(office)}
                          title="Edit"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60"
                        >
                          <Edit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </button>
                        <button
                          onClick={() => setDeleteOffice(office)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Attendance Tab ────────────────────────────────────────────────── */}
      {activeTab === "attendance" && (
        <>
          {/* Attendance Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={attEmployeeId}
              onChange={(e) => { setAttEmployeeId(e.target.value); setAttPage(1); }}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring min-w-[180px]"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{fullName(emp)}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
              <input
                type="date"
                value={attDateFrom}
                onChange={(e) => { setAttDateFrom(e.target.value); setAttPage(1); }}
                className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
              <input
                type="date"
                value={attDateTo}
                onChange={(e) => { setAttDateTo(e.target.value); setAttPage(1); }}
                className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
            </div>
            <select
              value={attStatusFilter}
              onChange={(e) => { setAttStatusFilter(e.target.value); setAttPage(1); }}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          {/* Attendance Table */}
          <div className="rounded-xl glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Time In</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Time Out</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Remarks</th>
                  <th className="w-16 px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Del</th>
                </tr>
              </thead>
              <tbody>
                {attLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                ) : attendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">No attendance records</p>
                          <p className="text-xs text-muted-foreground mt-1">Log daily attendance for barangay employees.</p>
                        </div>
                        <button
                          onClick={openCreateAtt}
                          className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                          style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                        >
                          + Log Attendance
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  attendance.map((rec) => {
                    const emp = employees.find((e) => e.id === rec.employee_id);
                    return (
                      <tr key={rec.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {rec.employee
                            ? fullName(rec.employee)
                            : emp ? fullName(emp) : rec.employee_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{rec.attendance_date}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          {rec.time_in ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          {rec.time_out ?? "—"}
                        </td>
                        <td className="px-4 py-3">{attendanceBadge(rec.status)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell max-w-[180px] truncate">
                          {rec.remarks ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteAtt(rec)}
                            title="Delete"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Attendance Pagination */}
          {!attLoading && attLastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {attPage} of {attLastPage} — {attTotal} record{attTotal !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAttPage((p) => Math.max(1, p - 1))}
                  disabled={attPage === 1}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setAttPage((p) => Math.min(attLastPage, p + 1))}
                  disabled={attPage === attLastPage}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── View Employee Modal ──────────────────────────────────────────── */}
      <Modal
        open={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
        title={viewEmployee ? fullName(viewEmployee) : ""}
        description={viewEmployee?.position ?? ""}
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewEmployee(null)}>Close</ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => { if (viewEmployee) { openEditEmp(viewEmployee); setViewEmployee(null); } }}
            >
              Edit Record
            </ModalButton>
          </>
        }
      >
        {viewEmployee && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {empStatusBadge(viewEmployee.status)}
              {empTypeBadge(viewEmployee.employment_type)}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Employee No.</p>
                <p className="text-sm font-mono mt-0.5">{viewEmployee.employee_number}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Office</p>
                <p className="text-sm mt-0.5">{viewEmployee.office_id ? (officeMap.get(viewEmployee.office_id) ?? "—") : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Monthly Salary</p>
                <p className="text-sm mt-0.5">{viewEmployee.monthly_salary ? peso(viewEmployee.monthly_salary) : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Salary Grade</p>
                <p className="text-sm mt-0.5">{viewEmployee.salary_grade ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Appointment Date</p>
                <p className="text-sm mt-0.5">{viewEmployee.appointment_date ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Contact</p>
                <p className="text-sm mt-0.5">{viewEmployee.contact_number ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Email</p>
                <p className="text-sm mt-0.5">{viewEmployee.email ?? "—"}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground uppercase mb-2">Government IDs</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">TIN</p>
                  <p className="text-sm">{viewEmployee.tin ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">GSIS</p>
                  <p className="text-sm">{viewEmployee.gsis_number ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">PhilHealth</p>
                  <p className="text-sm">{viewEmployee.phic_number ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Pag-IBIG / HDMF</p>
                  <p className="text-sm">{viewEmployee.hdmf_number ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Employee Modal ─────────────────────────────────── */}
      {(showCreateEmp || !!editEmployee) && (
        <Modal
          open={showCreateEmp || !!editEmployee}
          onClose={closeEmpForm}
          title={editEmployee ? "Edit Employee" : "Add Employee"}
          description={editEmployee ? `Editing: ${fullName(editEmployee)}` : "Add a new barangay employee record."}
          size="lg"
          footer={
            <>
              <ModalButton variant="secondary" onClick={closeEmpForm}>Cancel</ModalButton>
              {empFormTab > 0 && (
                <ModalButton variant="secondary" onClick={() => setEmpFormTab((t) => t - 1)}>Previous</ModalButton>
              )}
              {empFormTab < 2 ? (
                <ModalButton variant="primary" onClick={() => setEmpFormTab((t) => t + 1)}>Next</ModalButton>
              ) : (
                <ModalButton
                  variant="primary"
                  onClick={editEmployee ? handleUpdateEmp : handleCreateEmp}
                  disabled={empSubmitting}
                >
                  {empSubmitting ? "Saving..." : editEmployee ? "Update" : "Save"}
                </ModalButton>
              )}
            </>
          }
        >
          {/* Form Tabs */}
          <div className="flex border-b border-border mb-6">
            {["Personal Info", "Employment", "Government IDs"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setEmpFormTab(i)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  empFormTab === i
                    ? "border-accent-primary text-accent-text"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {empFormTab === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <FInput
                label="Employee Number"
                name="employee_number"
                value={empForm.employee_number}
                placeholder="e.g. EMP-2026-001"
                required
                error={empFormErrors.employee_number}
                onChange={handleEmpFieldChange}
              />
              <div /> {/* spacer */}
              <FInput
                label="First Name"
                name="first_name"
                value={empForm.first_name}
                placeholder="e.g. Juan"
                required
                error={empFormErrors.first_name}
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="Middle Name"
                name="middle_name"
                value={empForm.middle_name}
                placeholder="e.g. Dela"
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="Last Name"
                name="last_name"
                value={empForm.last_name}
                placeholder="e.g. Cruz"
                required
                error={empFormErrors.last_name}
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="Contact Number"
                name="contact_number"
                value={empForm.contact_number}
                placeholder="e.g. 0917-000-0000"
                onChange={handleEmpFieldChange}
              />
              <div className="col-span-2">
                <FInput
                  label="Email"
                  name="email"
                  value={empForm.email}
                  placeholder="e.g. juan@email.com"
                  type="email"
                  onChange={handleEmpFieldChange}
                />
              </div>
            </div>
          )}

          {empFormTab === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FInput
                  label="Position"
                  name="position"
                  value={empForm.position}
                  placeholder="e.g. Barangay Secretary"
                  required
                  error={empFormErrors.position}
                  onChange={handleEmpFieldChange}
                />
              </div>
              <FSelect
                label="Office"
                name="office_id"
                value={empForm.office_id}
                options={[
                  { value: "", label: "— No Office —" },
                  ...offices.map((o) => ({ value: o.id, label: o.name })),
                ]}
                onChange={handleEmpFieldChange}
              />
              <FSelect
                label="Employment Type"
                name="employment_type"
                value={empForm.employment_type}
                options={EMP_TYPE_OPTIONS}
                onChange={handleEmpFieldChange}
              />
              <FSelect
                label="Status"
                name="status"
                value={empForm.status}
                options={EMP_STATUS_OPTIONS}
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="Appointment Date"
                name="appointment_date"
                value={empForm.appointment_date}
                type="date"
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="Salary Grade"
                name="salary_grade"
                value={empForm.salary_grade}
                placeholder="e.g. SG-11"
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="Monthly Salary"
                name="monthly_salary"
                value={empForm.monthly_salary}
                placeholder="e.g. 15000"
                type="number"
                error={empFormErrors.monthly_salary}
                onChange={handleEmpFieldChange}
              />
            </div>
          )}

          {empFormTab === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <FInput
                label="TIN"
                name="tin"
                value={empForm.tin}
                placeholder="e.g. 123-456-789-000"
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="GSIS Number"
                name="gsis_number"
                value={empForm.gsis_number}
                placeholder="e.g. 0123456789"
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="PhilHealth (PHIC)"
                name="phic_number"
                value={empForm.phic_number}
                placeholder="e.g. 12-345678901-2"
                onChange={handleEmpFieldChange}
              />
              <FInput
                label="Pag-IBIG / HDMF"
                name="hdmf_number"
                value={empForm.hdmf_number}
                placeholder="e.g. 1234-5678-9012"
                onChange={handleEmpFieldChange}
              />
            </div>
          )}
        </Modal>
      )}

      {/* ── View Office Modal ─────────────────────────────────────────────── */}
      <Modal
        open={!!viewOffice}
        onClose={() => setViewOffice(null)}
        title={viewOffice?.name ?? ""}
        description="Office Details"
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewOffice(null)}>Close</ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => { if (viewOffice) { openEditOffice(viewOffice); setViewOffice(null); } }}
            >
              Edit Office
            </ModalButton>
          </>
        }
      >
        {viewOffice && (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase">Description</p>
              <p className="text-sm mt-0.5">{viewOffice.description ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase">Office Head</p>
              <p className="text-sm mt-0.5">
                {viewOffice.head_employee_id
                  ? (() => {
                      const emp = employees.find((e) => e.id === viewOffice.head_employee_id);
                      return emp ? fullName(emp) : "—";
                    })()
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Office Modal ────────────────────────────────────── */}
      {(showCreateOffice || !!editOffice) && (
        <Modal
          open={showCreateOffice || !!editOffice}
          onClose={closeOfficeForm}
          title={editOffice ? "Edit Office" : "Add Office"}
          size="sm"
          footer={
            <>
              <ModalButton variant="secondary" onClick={closeOfficeForm}>Cancel</ModalButton>
              <ModalButton
                variant="primary"
                onClick={editOffice ? handleUpdateOffice : handleCreateOffice}
                disabled={officeSubmitting}
              >
                {officeSubmitting ? "Saving..." : editOffice ? "Update" : "Save"}
              </ModalButton>
            </>
          }
        >
          <div className="space-y-4">
            <FInput
              label="Office Name"
              name="name"
              value={officeForm.name}
              placeholder="e.g. Office of the Punong Barangay"
              required
              error={officeFormErrors.name}
              onChange={handleOfficeFieldChange}
            />
            <FSelect
              label="Office Head"
              name="head_employee_id"
              value={officeForm.head_employee_id}
              options={[
                { value: "", label: "— No Head Assigned —" },
                ...employees.filter((e) => e.status === "active").map((e) => ({
                  value: e.id,
                  label: fullName(e),
                })),
              ]}
              onChange={handleOfficeFieldChange}
            />
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={officeForm.description}
                onChange={(e) => handleOfficeFieldChange("description", e.target.value)}
                placeholder="Brief description of the office..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create Attendance Modal ───────────────────────────────────────── */}
      <Modal
        open={showCreateAtt}
        onClose={closeAttForm}
        title="Log Attendance"
        description="Record an attendance entry for an employee."
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={closeAttForm}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleCreateAtt} disabled={attSubmitting}>
              {attSubmitting ? "Saving..." : "Save Record"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FSelect
              label="Employee"
              name="employee_id"
              value={attForm.employee_id}
              options={[
                { value: "", label: "— Select Employee —" },
                ...employees.map((e) => ({ value: e.id, label: fullName(e) })),
              ]}
              required
              error={attFormErrors.employee_id}
              onChange={handleAttFieldChange}
            />
          </div>
          <FInput
            label="Date"
            name="attendance_date"
            value={attForm.attendance_date}
            type="date"
            required
            error={attFormErrors.attendance_date}
            onChange={handleAttFieldChange}
          />
          <FSelect
            label="Status"
            name="status"
            value={attForm.status}
            options={ATT_STATUS_OPTIONS}
            required
            error={attFormErrors.status}
            onChange={handleAttFieldChange}
          />
          <FInput
            label="Time In"
            name="time_in"
            value={attForm.time_in}
            type="time"
            onChange={handleAttFieldChange}
          />
          <FInput
            label="Time Out"
            name="time_out"
            value={attForm.time_out}
            type="time"
            onChange={handleAttFieldChange}
          />
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Remarks</label>
            <textarea
              value={attForm.remarks}
              onChange={(e) => handleAttFieldChange("remarks", e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete Employee Confirmation ─────────────────────────────────── */}
      <Modal
        open={!!deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
        title="Delete Employee"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setDeleteEmployee(null)}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleDeleteEmp} disabled={empDeleting}>
              {empDeleting ? "Deleting..." : "Delete"}
            </ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">
            {deleteEmployee ? fullName(deleteEmployee) : ""}
          </span>
          ? Their entire employee record will be permanently removed.
        </p>
      </Modal>

      {/* ── Delete Office Confirmation ───────────────────────────────────── */}
      <Modal
        open={!!deleteOffice}
        onClose={() => setDeleteOffice(null)}
        title="Delete Office"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setDeleteOffice(null)}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleDeleteOffice} disabled={officeDeleting}>
              {officeDeleting ? "Deleting..." : "Delete"}
            </ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the office{" "}
          <span className="font-semibold text-foreground">&ldquo;{deleteOffice?.name}&rdquo;</span>?
          Employees in this office will be unassigned.
        </p>
      </Modal>

      {/* ── Delete Attendance Confirmation ───────────────────────────────── */}
      <Modal
        open={!!deleteAtt}
        onClose={() => setDeleteAtt(null)}
        title="Delete Attendance Record"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setDeleteAtt(null)}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={handleDeleteAtt} disabled={attDeleting}>
              {attDeleting ? "Deleting..." : "Delete"}
            </ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Delete attendance record for{" "}
          <span className="font-semibold text-foreground">{deleteAtt?.attendance_date}</span>?
        </p>
      </Modal>

      <Toasts toasts={toasts} dismiss={dismissToast} />

      <MabiniButton
        pageContext="You are on the HRIS (Human Resource Information System) page. This module manages barangay employees, offices, and attendance records. It tracks employment type (permanent, casual, contract of service, job order), government IDs (TIN, GSIS, PhilHealth, Pag-IBIG), and daily attendance."
      />
    </div>
  );
}
