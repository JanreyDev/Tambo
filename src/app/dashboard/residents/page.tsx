"use client";

import { useState } from "react";
import {
  Users, UserPlus, Home, MapPin, Filter, Download, Upload, MoreHorizontal,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Flag,
  AlertTriangle, Phone, Mail, Calendar, User, Heart, FileText, Edit, Trash2,
  Save, Camera, Printer, Eye,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn } from "@/lib/utils";

// ── Types ──
interface Resident {
  id: string; resident_number: string; first_name: string; middle_name: string; last_name: string;
  extension_name: string; sex: string; date_of_birth: string; age: number; civil_status: string;
  purok: string; street: string; house_number: string; mobile_number: string; email: string;
  status: string; is_voter: boolean; is_head_of_household: boolean; resident_type: string;
  occupation: string; profile_completion_pct: number; flags: { type: "grey" | "red"; label: string }[];
  created_at: string; place_of_birth: string; nationality: string; religion: string; blood_type: string;
  telephone: string; educational_attainment: string; employer: string; monthly_income: string;
  philhealth_number: string; sss_gsis_number: string; pagibig_number: string; tin_number: string;
  voter_id: string; precinct_number: string; household_number: string; relationship_to_head: string;
  is_pwd: boolean; pwd_type: string; is_4ps: boolean; is_solo_parent: boolean;
}

const emptyResident: Partial<Resident> = {
  first_name: "", middle_name: "", last_name: "", extension_name: "", sex: "", date_of_birth: "",
  civil_status: "", purok: "", street: "", house_number: "", mobile_number: "", email: "",
  status: "active", is_voter: false, is_head_of_household: false, resident_type: "permanent",
  occupation: "", place_of_birth: "", nationality: "Filipino", religion: "", blood_type: "",
  telephone: "", educational_attainment: "", employer: "", monthly_income: "",
  philhealth_number: "", sss_gsis_number: "", pagibig_number: "", tin_number: "",
  voter_id: "", precinct_number: "", household_number: "", relationship_to_head: "",
  is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false,
};

// ── Mock Data ──
const mockResidents: Resident[] = [
  { id: "1", resident_number: "RES-2026-0001", first_name: "Maria", middle_name: "Santos", last_name: "Dela Cruz", extension_name: "", sex: "female", date_of_birth: "1985-03-15", age: 41, civil_status: "married", purok: "Sampaguita", street: "Rizal St.", house_number: "123", mobile_number: "09171234567", email: "maria@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Teacher", profile_completion_pct: 92, flags: [], created_at: "2026-01-15", place_of_birth: "Manila", nationality: "Filipino", religion: "Catholic", blood_type: "O+", telephone: "", educational_attainment: "College Graduate", employer: "DepEd", monthly_income: "25000", philhealth_number: "PH-001234567", sss_gsis_number: "GSIS-0987654", pagibig_number: "HD-12345678", tin_number: "123-456-789", voter_id: "VN-001234", precinct_number: "0045A", household_number: "HH-001", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "2", resident_number: "RES-2026-0002", first_name: "Juan", middle_name: "Reyes", last_name: "Santos", extension_name: "Jr.", sex: "male", date_of_birth: "1990-07-22", age: 35, civil_status: "single", purok: "Rosal", street: "Mabini St.", house_number: "45", mobile_number: "09281234567", email: "", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "Tricycle Driver", profile_completion_pct: 78, flags: [{ type: "grey", label: "Also registered in Brgy. Amucao" }], created_at: "2026-01-20", place_of_birth: "Tarlac", nationality: "Filipino", religion: "Catholic", blood_type: "B+", telephone: "", educational_attainment: "High School Graduate", employer: "Self-employed", monthly_income: "12000", philhealth_number: "", sss_gsis_number: "SSS-1234567", pagibig_number: "", tin_number: "", voter_id: "VN-002345", precinct_number: "0045A", household_number: "HH-015", relationship_to_head: "Son", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "3", resident_number: "RES-2026-0003", first_name: "Ana", middle_name: "Lopez", last_name: "Garcia", extension_name: "", sex: "female", date_of_birth: "1972-11-08", age: 53, civil_status: "widowed", purok: "Ilang-Ilang", street: "Bonifacio Ave.", house_number: "67", mobile_number: "09351234567", email: "ana.garcia@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Sari-sari Store Owner", profile_completion_pct: 85, flags: [], created_at: "2026-02-01", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "A+", telephone: "044-123-4567", educational_attainment: "College Level", employer: "Self-employed", monthly_income: "15000", philhealth_number: "PH-009876543", sss_gsis_number: "SSS-7654321", pagibig_number: "HD-87654321", tin_number: "987-654-321", voter_id: "VN-003456", precinct_number: "0046B", household_number: "HH-022", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: true, is_solo_parent: true },
  { id: "4", resident_number: "RES-2026-0004", first_name: "Pedro", middle_name: "Aquino", last_name: "Reyes", extension_name: "", sex: "male", date_of_birth: "1998-01-30", age: 28, civil_status: "single", purok: "Sampaguita", street: "Luna St.", house_number: "89", mobile_number: "09451234567", email: "", status: "active", is_voter: false, is_head_of_household: false, resident_type: "permanent", occupation: "Construction Worker", profile_completion_pct: 65, flags: [{ type: "red", label: "Active blotter case (BLO-2026-003)" }], created_at: "2026-02-05", place_of_birth: "Tarlac", nationality: "Filipino", religion: "INC", blood_type: "", telephone: "", educational_attainment: "High School Graduate", employer: "ABC Construction", monthly_income: "15000", philhealth_number: "", sss_gsis_number: "", pagibig_number: "", tin_number: "", voter_id: "", precinct_number: "", household_number: "HH-001", relationship_to_head: "Nephew", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "5", resident_number: "RES-2026-0005", first_name: "Rosa", middle_name: "Bautista", last_name: "De Los Santos", extension_name: "", sex: "female", date_of_birth: "1965-05-12", age: 60, civil_status: "married", purok: "Dahlia", street: "Del Pilar St.", house_number: "101", mobile_number: "09161234567", email: "", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Barangay Health Worker", profile_completion_pct: 98, flags: [], created_at: "2026-02-10", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "AB+", telephone: "", educational_attainment: "College Graduate", employer: "Barangay Tambo", monthly_income: "8000", philhealth_number: "PH-005555555", sss_gsis_number: "SSS-5555555", pagibig_number: "HD-55555555", tin_number: "555-555-555", voter_id: "VN-005555", precinct_number: "0047C", household_number: "HH-030", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "6", resident_number: "RES-2026-0006", first_name: "Roberto", middle_name: "Cruz", last_name: "Manalo", extension_name: "", sex: "male", date_of_birth: "1988-09-03", age: 37, civil_status: "married", purok: "Rosal", street: "Aguinaldo St.", house_number: "33", mobile_number: "09271234567", email: "roberto.m@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Fisherman", profile_completion_pct: 80, flags: [], created_at: "2026-02-14", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "O-", telephone: "", educational_attainment: "Elementary Graduate", employer: "Self-employed", monthly_income: "10000", philhealth_number: "", sss_gsis_number: "", pagibig_number: "", tin_number: "", voter_id: "VN-006666", precinct_number: "0045A", household_number: "HH-035", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: true, is_solo_parent: false },
  { id: "7", resident_number: "RES-2026-0007", first_name: "Liza", middle_name: "Tan", last_name: "Villanueva", extension_name: "", sex: "female", date_of_birth: "2001-12-25", age: 24, civil_status: "single", purok: "Jasmine", street: "Rizal St.", house_number: "55", mobile_number: "09381234567", email: "liza.v@email.com", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "Nurse", profile_completion_pct: 88, flags: [], created_at: "2026-02-18", place_of_birth: "Manila", nationality: "Filipino", religion: "Catholic", blood_type: "A-", telephone: "", educational_attainment: "College Graduate", employer: "Provincial Hospital", monthly_income: "28000", philhealth_number: "PH-007777777", sss_gsis_number: "SSS-7777777", pagibig_number: "HD-77777777", tin_number: "777-777-777", voter_id: "VN-007777", precinct_number: "0048D", household_number: "HH-015", relationship_to_head: "Daughter", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "8", resident_number: "RES-2026-0008", first_name: "Carlos", middle_name: "Mendoza", last_name: "Rivera", extension_name: "III", sex: "male", date_of_birth: "1955-06-18", age: 70, civil_status: "married", purok: "Sunflower", street: "Quezon Blvd.", house_number: "77", mobile_number: "09191234567", email: "", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Retired", profile_completion_pct: 72, flags: [], created_at: "2026-03-01", place_of_birth: "Pampanga", nationality: "Filipino", religion: "Catholic", blood_type: "B-", telephone: "044-987-6543", educational_attainment: "College Graduate", employer: "", monthly_income: "18000", philhealth_number: "PH-008888888", sss_gsis_number: "GSIS-8888888", pagibig_number: "HD-88888888", tin_number: "888-888-888", voter_id: "VN-008888", precinct_number: "0049E", household_number: "HH-040", relationship_to_head: "Head", is_pwd: true, pwd_type: "Visual", is_4ps: false, is_solo_parent: false },
  { id: "9", resident_number: "RES-2026-0009", first_name: "Josephine", middle_name: "Ramos", last_name: "Ocampo", extension_name: "", sex: "female", date_of_birth: "1995-04-07", age: 30, civil_status: "married", purok: "Orchid", street: "Mabini St.", house_number: "22", mobile_number: "09421234567", email: "josie.o@email.com", status: "inactive", is_voter: false, is_head_of_household: false, resident_type: "transient", occupation: "Vendor", profile_completion_pct: 55, flags: [], created_at: "2026-03-03", place_of_birth: "Bulacan", nationality: "Filipino", religion: "Born Again", blood_type: "", telephone: "", educational_attainment: "High School Graduate", employer: "Self-employed", monthly_income: "8000", philhealth_number: "", sss_gsis_number: "", pagibig_number: "", tin_number: "", voter_id: "", precinct_number: "", household_number: "HH-042", relationship_to_head: "Spouse", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "10", resident_number: "RES-2026-0010", first_name: "Mark", middle_name: "Lim", last_name: "Chavez", extension_name: "", sex: "male", date_of_birth: "2000-08-14", age: 25, civil_status: "single", purok: "Sampaguita", street: "Luna St.", house_number: "89-B", mobile_number: "09331234567", email: "mark.c@email.com", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "IT Freelancer", profile_completion_pct: 70, flags: [], created_at: "2026-03-05", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "O+", telephone: "", educational_attainment: "College Graduate", employer: "Freelance", monthly_income: "35000", philhealth_number: "", sss_gsis_number: "SSS-1010101", pagibig_number: "", tin_number: "101-010-101", voter_id: "VN-010101", precinct_number: "0045A", household_number: "HH-001", relationship_to_head: "Boarder", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "11", resident_number: "RES-2026-0011", first_name: "Gloria", middle_name: "Pangilinan", last_name: "Tolentino", extension_name: "", sex: "female", date_of_birth: "1978-02-28", age: 48, civil_status: "separated", purok: "Dahlia", street: "Bonifacio Ave.", house_number: "15", mobile_number: "09251234567", email: "", status: "deceased", is_voter: false, is_head_of_household: false, resident_type: "permanent", occupation: "Laundrywoman", profile_completion_pct: 90, flags: [], created_at: "2025-11-15", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "AB-", telephone: "", educational_attainment: "Elementary Level", employer: "", monthly_income: "5000", philhealth_number: "", sss_gsis_number: "", pagibig_number: "", tin_number: "", voter_id: "", precinct_number: "", household_number: "HH-028", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: true, is_solo_parent: true },
  { id: "12", resident_number: "RES-2026-0012", first_name: "Angelo", middle_name: "Dizon", last_name: "Pascual", extension_name: "", sex: "male", date_of_birth: "1993-10-19", age: 32, civil_status: "married", purok: "Ilang-Ilang", street: "Del Pilar St.", house_number: "44", mobile_number: "09471234567", email: "angelo.p@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Electrician", profile_completion_pct: 82, flags: [], created_at: "2026-03-06", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "A+", telephone: "", educational_attainment: "Vocational", employer: "Self-employed", monthly_income: "18000", philhealth_number: "PH-012121212", sss_gsis_number: "SSS-1212121", pagibig_number: "HD-12121212", tin_number: "121-212-121", voter_id: "VN-012121", precinct_number: "0046B", household_number: "HH-045", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
];

const puroks = ["All Puroks", "Sampaguita", "Rosal", "Ilang-Ilang", "Dahlia", "Sunflower", "Orchid", "Jasmine"];
const statuses = ["All Status", "Active", "Inactive", "Deceased", "Transferred"];
const sexOptions = ["All", "Male", "Female"];
const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Divorced", "Live-in"];
const bloodTypes = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const educationLevels = ["", "No Formal Education", "Elementary Level", "Elementary Graduate", "High School Level", "High School Graduate", "Vocational", "College Level", "College Graduate", "Post Graduate"];
const religions = ["", "Catholic", "INC (Iglesia ni Cristo)", "Born Again", "Muslim", "Protestant", "Seventh Day Adventist", "Baptist", "Methodist", "Others"];
const extensions = ["", "Jr.", "Sr.", "II", "III", "IV", "V"];
const residentTypes = ["permanent", "transient"];
const relationships = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Grandson", "Granddaughter", "Nephew", "Niece", "Boarder", "Helper", "Others"];
const pwdTypes = ["", "Visual", "Hearing", "Speech", "Physical", "Mental", "Psychosocial", "Learning", "Multiple"];

function ResidentInput({ label, field, required, type = "text", placeholder = "", value, onChange }: { label: string; field: string; required?: boolean; type?: string; placeholder?: string; value: string; onChange: (field: string, value: string | boolean) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(field, e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
    </div>
  );
}

function ResidentSelect({ label, field, options, required, value, onChange }: { label: string; field: string; options: string[]; required?: boolean; value: string; onChange: (field: string, value: string | boolean) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
        {options.map((o) => <option key={o} value={o === options[0] && o === "" ? "" : o}>{o || `Select ${label}`}</option>)}
      </select>
    </div>
  );
}

function ResidentCheckbox({ label, field, checked, onChange }: { label: string; field: string; checked: boolean; onChange: (field: string, value: string | boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(field, e.target.checked)}
        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring" />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

export default function ResidentsPage() {
  const [search, setSearch] = useState("");
  const [purokFilter, setPurokFilter] = useState("All Puroks");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sexFilter, setSexFilter] = useState("All");
  const [voterFilter, setVoterFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewResident, setViewResident] = useState<Resident | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Partial<Resident>>(emptyResident);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const pageSize = 10;

  const filtered = mockResidents.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${r.last_name} ${r.first_name} ${r.middle_name}`.toLowerCase();
      if (!fullName.includes(q) && !r.resident_number.toLowerCase().includes(q) && !r.mobile_number.includes(q)) return false;
    }
    if (purokFilter !== "All Puroks" && r.purok !== purokFilter) return false;
    if (statusFilter !== "All Status" && r.status !== statusFilter.toLowerCase()) return false;
    if (sexFilter !== "All" && r.sex !== sexFilter.toLowerCase()) return false;
    if (voterFilter === "voter" && !r.is_voter) return false;
    if (voterFilter === "non-voter" && r.is_voter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey as keyof Resident];
    const bVal = b[sortKey as keyof Resident];
    if (aVal === bVal) return 0;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const householdCount = mockResidents.filter((r) => r.is_head_of_household).length;
  const voterCount = mockResidents.filter((r) => r.is_voter).length;
  const maleCount = mockResidents.filter((r) => r.sex === "male").length;

  const openCreate = () => { setForm({ ...emptyResident }); setFormTab(0); setShowCreate(true); };
  const openEdit = (r: Resident) => { setForm({ ...r }); setFormTab(0); setShowEdit(true); setViewResident(null); };
  const openDelete = () => { setShowDelete(true); setViewResident(null); };

  const updateForm = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const formTabs = ["Personal", "Contact & Address", "Employment", "Government IDs", "Voter & Household", "Health & Benefits"];

  const formStr = form as Record<string, string>;
  const formBool = form as Record<string, boolean>;

  // ── Render Form Tab Content ──
  const renderFormTab = () => {
    switch (formTab) {
      case 0: return (
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent-primary transition-colors">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1">Upload Photo</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ResidentInput label="First Name" field="first_name" required placeholder="e.g. Maria" value={formStr.first_name || ""} onChange={updateForm} />
            <ResidentInput label="Middle Name" field="middle_name" placeholder="e.g. Santos" value={formStr.middle_name || ""} onChange={updateForm} />
            <ResidentInput label="Last Name" field="last_name" required placeholder="e.g. Dela Cruz" value={formStr.last_name || ""} onChange={updateForm} />
            <ResidentSelect label="Extension" field="extension_name" options={extensions} value={formStr.extension_name || ""} onChange={updateForm} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ResidentSelect label="Sex" field="sex" options={["", "male", "female"]} required value={formStr.sex || ""} onChange={updateForm} />
            <ResidentInput label="Date of Birth" field="date_of_birth" type="date" required value={formStr.date_of_birth || ""} onChange={updateForm} />
            <ResidentInput label="Place of Birth" field="place_of_birth" placeholder="e.g. Manila" value={formStr.place_of_birth || ""} onChange={updateForm} />
            <ResidentSelect label="Civil Status" field="civil_status" options={["", ...civilStatuses]} required value={formStr.civil_status || ""} onChange={updateForm} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ResidentInput label="Nationality" field="nationality" placeholder="Filipino" value={formStr.nationality || ""} onChange={updateForm} />
            <ResidentSelect label="Religion" field="religion" options={religions} value={formStr.religion || ""} onChange={updateForm} />
            <ResidentSelect label="Blood Type" field="blood_type" options={bloodTypes} value={formStr.blood_type || ""} onChange={updateForm} />
            <ResidentSelect label="Resident Type" field="resident_type" options={residentTypes} value={formStr.resident_type || ""} onChange={updateForm} />
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Contact Information</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <ResidentInput label="Mobile Number" field="mobile_number" placeholder="09XX-XXX-XXXX" value={formStr.mobile_number || ""} onChange={updateForm} />
            <ResidentInput label="Telephone" field="telephone" placeholder="044-XXX-XXXX" value={formStr.telephone || ""} onChange={updateForm} />
            <ResidentInput label="Email Address" field="email" type="email" placeholder="email@example.com" value={formStr.email || ""} onChange={updateForm} />
          </div>
          <h4 className="text-sm font-semibold text-foreground mt-6">Address</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ResidentInput label="House/Unit No." field="house_number" placeholder="e.g. 123" value={formStr.house_number || ""} onChange={updateForm} />
            <ResidentInput label="Street" field="street" required placeholder="e.g. Rizal St." value={formStr.street || ""} onChange={updateForm} />
            <ResidentSelect label="Purok/Zone" field="purok" options={["", ...puroks.slice(1)]} required value={formStr.purok || ""} onChange={updateForm} />
            <div />
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ResidentSelect label="Educational Attainment" field="educational_attainment" options={educationLevels} value={formStr.educational_attainment || ""} onChange={updateForm} />
            <ResidentInput label="Occupation" field="occupation" placeholder="e.g. Teacher, Fisherman" value={formStr.occupation || ""} onChange={updateForm} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ResidentInput label="Employer / Business Name" field="employer" placeholder="e.g. DepEd, Self-employed" value={formStr.employer || ""} onChange={updateForm} />
            <ResidentInput label="Monthly Income (PHP)" field="monthly_income" placeholder="e.g. 25000" value={formStr.monthly_income || ""} onChange={updateForm} />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Government-issued ID numbers for official records. Leave blank if not applicable.</p>
          <div className="grid grid-cols-2 gap-4">
            <ResidentInput label="PhilHealth Number" field="philhealth_number" placeholder="PH-XXXXXXXXX" value={formStr.philhealth_number || ""} onChange={updateForm} />
            <ResidentInput label="SSS / GSIS Number" field="sss_gsis_number" placeholder="SSS-XXXXXXX or GSIS-XXXXXXX" value={formStr.sss_gsis_number || ""} onChange={updateForm} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ResidentInput label="Pag-IBIG Number" field="pagibig_number" placeholder="HD-XXXXXXXX" value={formStr.pagibig_number || ""} onChange={updateForm} />
            <ResidentInput label="TIN" field="tin_number" placeholder="XXX-XXX-XXX" value={formStr.tin_number || ""} onChange={updateForm} />
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Voter Information</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="pt-6"><ResidentCheckbox label="Registered Voter" field="is_voter" checked={!!formBool.is_voter} onChange={updateForm} /></div>
            <ResidentInput label="Voter ID Number" field="voter_id" placeholder="VN-XXXXXX" value={formStr.voter_id || ""} onChange={updateForm} />
            <ResidentInput label="Precinct Number" field="precinct_number" placeholder="e.g. 0045A" value={formStr.precinct_number || ""} onChange={updateForm} />
          </div>
          <h4 className="text-sm font-semibold text-foreground mt-6">Household</h4>
          <div className="grid grid-cols-3 gap-4">
            <ResidentInput label="Household Number" field="household_number" placeholder="HH-XXX" value={formStr.household_number || ""} onChange={updateForm} />
            <ResidentSelect label="Relationship to Head" field="relationship_to_head" options={["", ...relationships]} value={formStr.relationship_to_head || ""} onChange={updateForm} />
            <div className="pt-6"><ResidentCheckbox label="Head of Household" field="is_head_of_household" checked={!!formBool.is_head_of_household} onChange={updateForm} /></div>
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">PWD Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="pt-2"><ResidentCheckbox label="Person with Disability (PWD)" field="is_pwd" checked={!!formBool.is_pwd} onChange={updateForm} /></div>
            {form.is_pwd && <ResidentSelect label="PWD Type" field="pwd_type" options={pwdTypes} value={formStr.pwd_type || ""} onChange={updateForm} />}
          </div>
          <h4 className="text-sm font-semibold text-foreground mt-6">Benefits & Programs</h4>
          <div className="grid grid-cols-2 gap-4">
            <ResidentCheckbox label="4Ps (Pantawid Pamilyang Pilipino Program) Beneficiary" field="is_4ps" checked={!!formBool.is_4ps} onChange={updateForm} />
            <ResidentCheckbox label="Solo Parent" field="is_solo_parent" checked={!!formBool.is_solo_parent} onChange={updateForm} />
          </div>
        </div>
      );
      default: return null;
    }
  };

  // ── Registration Form Modal (rendered as JSX, not a component) ──
  const renderResidentFormModal = (open: boolean, onClose: () => void, title: string) => (
    <Modal open={open} onClose={onClose} title={title} size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {formTab > 0 && (
              <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </ModalButton>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
            {formTab < formTabs.length - 1 ? (
              <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </ModalButton>
            ) : (
              <ModalButton variant="primary" onClick={onClose}>
                <Save className="w-4 h-4 mr-1" /> Save Resident
              </ModalButton>
            )}
          </div>
        </div>
      }>
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {formTabs.map((tab, i) => (
          <button key={tab} onClick={() => setFormTab(i)}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors",
              formTab === i ? "bg-accent-bg text-accent-text" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold mr-1.5"
              style={formTab === i ? { background: "var(--accent-primary)", color: "#fff" } : { background: "var(--muted)", color: "var(--muted-foreground)" }}>
              {i + 1}
            </span>
            {tab}
          </button>
        ))}
      </div>
      {renderFormTab()}
    </Modal>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Residents" description="Manage barangay resident records and profiles"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Records" }, { label: "Residents" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Upload className="h-4 w-4" /> Import</button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
              <UserPlus className="h-4 w-4" /> New Resident
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Residents" value={mockResidents.length} icon={<Users className="h-5 w-5" />} trend={{ value: 8, label: "vs last month" }} />
        <StatCard label="Households" value={householdCount} icon={<Home className="h-5 w-5" />} trend={{ value: 3, label: "vs last month" }} />
        <StatCard label="Registered Voters" value={voterCount} icon={<FileText className="h-5 w-5" />} trend={{ value: 0, label: "no change" }} />
        <StatCard label="Male / Female" value={`${maleCount} / ${mockResidents.length - maleCount}`} icon={<Heart className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, resident number, or mobile..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
              showFilters ? "border-accent-primary bg-accent-bg text-accent-text" : "border-border hover:bg-muted")}>
            <Filter className="h-4 w-4" /> Filters
            {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all") && (
              <span className="w-2 h-2 rounded-full bg-accent-primary" />
            )}
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <select value={purokFilter} onChange={(e) => { setPurokFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {puroks.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={sexFilter} onChange={(e) => { setSexFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              {sexOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={voterFilter} onChange={(e) => { setVoterFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
              <option value="all">All Voters</option>
              <option value="voter">Registered Voter</option>
              <option value="non-voter">Non-Voter</option>
            </select>
            <button onClick={() => { setPurokFilter("All Puroks"); setStatusFilter("All Status"); setSexFilter("All"); setVoterFilter("all"); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Resident" field="last_name" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Purok" field="purok" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Age" field="age" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sex</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Voter</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Profile</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-12" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No residents found matching your criteria.</td></tr>
              ) : (
                paged.map((r) => {
                  const initials = `${r.first_name[0]}${r.last_name[0]}`;
                  const fullName = `${r.last_name}, ${r.first_name} ${r.middle_name ? r.middle_name[0] + "." : ""} ${r.extension_name}`.trim();
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewResident(r)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{initials}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
                              {r.flags.map((f, i) => (<Flag key={i} className={cn("h-3 w-3 shrink-0", f.type === "red" ? "text-red-500" : "text-gray-400")} />))}
                              {r.is_head_of_household && <span title="Head of Household"><Home className="h-3 w-3 text-amber-500 shrink-0" /></span>}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{r.resident_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-sm text-foreground">{r.purok}</span></div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{r.street}</p>
                      </td>
                      <td className="px-4 py-3">
                        {r.mobile_number && (<div className="flex items-center gap-1.5 text-sm text-foreground"><Phone className="h-3 w-3 text-muted-foreground" /> {r.mobile_number}</div>)}
                        {r.email && (<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5"><Mail className="h-3 w-3" /> {r.email}</div>)}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{r.age}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-sm capitalize", r.sex === "male" ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400")}>{r.sex}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">{r.is_voter ? <Badge variant="success" dot>Voter</Badge> : <Badge variant="muted">Non-voter</Badge>}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${r.profile_completion_pct}%`, background: r.profile_completion_pct >= 80 ? "#22c55e" : r.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground">{r.profile_completion_pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)} className="p-1.5 rounded hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {actionMenu === r.id && (
                            <div className="absolute right-0 top-8 z-20 w-40 bg-card border border-border rounded-lg shadow-lg py-1">
                              <button onClick={() => { setViewResident(r); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"><Eye className="h-3.5 w-3.5" /> View Profile</button>
                              <button onClick={() => { openEdit(r); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"><Edit className="h-3.5 w-3.5" /> Edit</button>
                              <button onClick={() => { setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"><Printer className="h-3.5 w-3.5" /> Print ID</button>
                              <div className="border-t border-border my-1" />
                              <button onClick={() => { setViewResident(r); openDelete(); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left text-red-600"><Trash2 className="h-3.5 w-3.5" /> Deactivate</button>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length} residents</p>
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

      {/* View Resident Modal */}
      <Modal open={!!viewResident && !showDelete} onClose={() => setViewResident(null)}
        title={viewResident ? `${viewResident.last_name}, ${viewResident.first_name} ${viewResident.middle_name ? viewResident.middle_name[0] + "." : ""} ${viewResident.extension_name}`.trim() : ""}
        description={viewResident?.resident_number} size="xl"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewResident(null)}>Close</ModalButton>
            <ModalButton variant="secondary" onClick={() => viewResident && openEdit(viewResident)}><Edit className="h-4 w-4 mr-1" /> Edit Profile</ModalButton>
            <ModalButton variant="primary"><Printer className="h-4 w-4 mr-1" /> Print ID</ModalButton>
          </>
        }>
        {viewResident && (
          <div className="space-y-6">
            {viewResident.flags.length > 0 && (
              <div className="space-y-2">
                {viewResident.flags.map((f, i) => (
                  <div key={i} className={cn("flex items-center gap-2 p-3 rounded-lg text-sm",
                    f.type === "red" ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900" : "bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800")}>
                    {f.type === "red" ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Flag className="h-4 w-4 shrink-0" />}
                    {f.label}
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Profile Completion</span>
                <span className="text-sm font-bold" style={{ color: viewResident.profile_completion_pct >= 80 ? "#22c55e" : viewResident.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444" }}>{viewResident.profile_completion_pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${viewResident.profile_completion_pct}%`, background: viewResident.profile_completion_pct >= 80 ? "#22c55e" : viewResident.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444" }} />
              </div>
            </div>

            {/* Personal Info */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem icon={<User className="h-4 w-4" />} label="Sex" value={viewResident.sex} />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={`${viewResident.date_of_birth} (${viewResident.age} yrs)`} />
                <InfoItem icon={<Heart className="h-4 w-4" />} label="Civil Status" value={viewResident.civil_status} />
                <InfoItem label="Blood Type" value={viewResident.blood_type || "—"} />
                <InfoItem label="Place of Birth" value={viewResident.place_of_birth || "—"} />
                <InfoItem label="Nationality" value={viewResident.nationality || "—"} />
                <InfoItem label="Religion" value={viewResident.religion || "—"} />
                <InfoItem label="Resident Type" value={viewResident.resident_type} />
              </div>
            </div>

            {/* Contact & Address */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact & Address</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem icon={<Phone className="h-4 w-4" />} label="Mobile" value={viewResident.mobile_number || "—"} />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={viewResident.email || "—"} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={`${viewResident.house_number} ${viewResident.street}, ${viewResident.purok}`} />
                <InfoItem label="Telephone" value={viewResident.telephone || "—"} />
              </div>
            </div>

            {/* Employment */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Employment</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem icon={<FileText className="h-4 w-4" />} label="Occupation" value={viewResident.occupation || "—"} />
                <InfoItem label="Employer" value={viewResident.employer || "—"} />
                <InfoItem label="Monthly Income" value={viewResident.monthly_income ? `₱${Number(viewResident.monthly_income).toLocaleString()}` : "—"} />
                <InfoItem label="Education" value={viewResident.educational_attainment || "—"} />
              </div>
            </div>

            {/* Government IDs */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Government IDs</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem label="PhilHealth" value={viewResident.philhealth_number || "—"} />
                <InfoItem label="SSS/GSIS" value={viewResident.sss_gsis_number || "—"} />
                <InfoItem label="Pag-IBIG" value={viewResident.pagibig_number || "—"} />
                <InfoItem label="TIN" value={viewResident.tin_number || "—"} />
              </div>
            </div>

            {/* Voter & Household */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Voter & Household</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem label="Voter ID" value={viewResident.voter_id || "—"} />
                <InfoItem label="Precinct" value={viewResident.precinct_number || "—"} />
                <InfoItem label="Household" value={viewResident.household_number || "—"} />
                <InfoItem label="Relationship" value={viewResident.relationship_to_head || "—"} />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border flex-wrap">
              <StatusBadge status={viewResident.status} />
              {viewResident.is_voter && <Badge variant="success" dot>Registered Voter</Badge>}
              {viewResident.is_head_of_household && <Badge variant="warning" dot>Head of Household</Badge>}
              {viewResident.is_pwd && <Badge variant="info" dot>PWD ({viewResident.pwd_type})</Badge>}
              {viewResident.is_4ps && <Badge variant="accent" dot>4Ps Beneficiary</Badge>}
              {viewResident.is_solo_parent && <Badge variant="danger" dot>Solo Parent</Badge>}
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Form Modals */}
      {renderResidentFormModal(showCreate, () => setShowCreate(false), "Register New Resident")}
      {renderResidentFormModal(showEdit, () => setShowEdit(false), "Edit Resident Profile")}

      {/* Delete Confirmation */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Deactivate Resident" size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => setShowDelete(false)}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => setShowDelete(false)}>Deactivate</ModalButton></>}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">This will mark the resident as inactive. Their records will be preserved but they will no longer appear in active searches.</p>
          </div>
          <p className="text-sm text-muted-foreground">Are you sure you want to deactivate this resident?</p>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground capitalize">{value}</p>
      </div>
    </div>
  );
}
