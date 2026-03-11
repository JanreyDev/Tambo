"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Home, MapPin, Filter, Download, Upload, MoreHorizontal,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Flag,
  AlertTriangle, Phone, Mail, Calendar, User, Heart, FileText, Edit,
  Camera, Printer, Eye, TrendingUp, ChevronDown, Plus, Fingerprint, CheckCircle, Loader2,
  GraduationCap, Briefcase, Contact, Globe,
  IdCard, Vote, MessageSquare, ScrollText, Archive,
  PawPrint, HandHeart, Link2, Paperclip, Image, Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
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

// ── Mock Data ──
const mockResidents: Resident[] = [
  { id: "1", resident_number: "RES-1376040160-0001", first_name: "Maria", middle_name: "Santos", last_name: "Dela Cruz", extension_name: "", sex: "female", date_of_birth: "1985-03-15", age: 41, civil_status: "married", purok: "Sampaguita", street: "Rizal St.", house_number: "123", mobile_number: "09171234567", email: "maria@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Teacher", profile_completion_pct: 92, flags: [], created_at: "2026-01-15", place_of_birth: "Manila", nationality: "Filipino", religion: "Catholic", blood_type: "O+", telephone: "", educational_attainment: "College Graduate", employer: "DepEd", monthly_income: "25000", philhealth_number: "PH-001234567", sss_gsis_number: "GSIS-0987654", pagibig_number: "HD-12345678", tin_number: "123-456-789", voter_id: "VN-001234", precinct_number: "0045A", household_number: "HH-001", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "2", resident_number: "RES-1376040160-0002", first_name: "Juan", middle_name: "Reyes", last_name: "Santos", extension_name: "Jr.", sex: "male", date_of_birth: "1990-07-22", age: 35, civil_status: "single", purok: "Rosal", street: "Mabini St.", house_number: "45", mobile_number: "09281234567", email: "", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "Tricycle Driver", profile_completion_pct: 78, flags: [{ type: "grey", label: "This resident also has records registered in Brgy. Amucao, Tarlac City. Cross-barangay verification recommended before issuing official documents." }], created_at: "2026-01-20", place_of_birth: "Tarlac", nationality: "Filipino", religion: "Catholic", blood_type: "B+", telephone: "", educational_attainment: "High School Graduate", employer: "Self-employed", monthly_income: "12000", philhealth_number: "", sss_gsis_number: "SSS-1234567", pagibig_number: "", tin_number: "", voter_id: "VN-002345", precinct_number: "0045A", household_number: "HH-015", relationship_to_head: "Son", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "3", resident_number: "RES-1376040160-0003", first_name: "Ana", middle_name: "Lopez", last_name: "Garcia", extension_name: "", sex: "female", date_of_birth: "1972-11-08", age: 53, civil_status: "widowed", purok: "Ilang-Ilang", street: "Bonifacio Ave.", house_number: "67", mobile_number: "09351234567", email: "ana.garcia@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Sari-sari Store Owner", profile_completion_pct: 85, flags: [], created_at: "2026-02-01", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "A+", telephone: "044-123-4567", educational_attainment: "College Level", employer: "Self-employed", monthly_income: "15000", philhealth_number: "PH-009876543", sss_gsis_number: "SSS-7654321", pagibig_number: "HD-87654321", tin_number: "987-654-321", voter_id: "VN-003456", precinct_number: "0046B", household_number: "HH-022", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: true, is_solo_parent: true },
  { id: "4", resident_number: "RES-1376040160-0004", first_name: "Pedro", middle_name: "Aquino", last_name: "Reyes", extension_name: "", sex: "male", date_of_birth: "1998-01-30", age: 28, civil_status: "single", purok: "Sampaguita", street: "Luna St.", house_number: "89", mobile_number: "09451234567", email: "", status: "active", is_voter: false, is_head_of_household: false, resident_type: "permanent", occupation: "Construction Worker", profile_completion_pct: 65, flags: [{ type: "red", label: "This resident has an active case record: BLO-2026-003 (Blotter complaint filed 2026-01-18). Review the Blotter Records module for case details before issuing clearances." }], created_at: "2026-02-05", place_of_birth: "Tarlac", nationality: "Filipino", religion: "INC", blood_type: "", telephone: "", educational_attainment: "High School Graduate", employer: "ABC Construction", monthly_income: "15000", philhealth_number: "", sss_gsis_number: "", pagibig_number: "", tin_number: "", voter_id: "", precinct_number: "", household_number: "HH-001", relationship_to_head: "Nephew", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "5", resident_number: "RES-1376040160-0005", first_name: "Rosa", middle_name: "Bautista", last_name: "De Los Santos", extension_name: "", sex: "female", date_of_birth: "1965-05-12", age: 60, civil_status: "married", purok: "Dahlia", street: "Del Pilar St.", house_number: "101", mobile_number: "09161234567", email: "", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Barangay Health Worker", profile_completion_pct: 98, flags: [], created_at: "2026-02-10", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "AB+", telephone: "", educational_attainment: "College Graduate", employer: "Barangay Tambo", monthly_income: "8000", philhealth_number: "PH-005555555", sss_gsis_number: "SSS-5555555", pagibig_number: "HD-55555555", tin_number: "555-555-555", voter_id: "VN-005555", precinct_number: "0047C", household_number: "HH-030", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "6", resident_number: "RES-1376040160-0006", first_name: "Roberto", middle_name: "Cruz", last_name: "Manalo", extension_name: "", sex: "male", date_of_birth: "1988-09-03", age: 37, civil_status: "married", purok: "Rosal", street: "Aguinaldo St.", house_number: "33", mobile_number: "09271234567", email: "roberto.m@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Fisherman", profile_completion_pct: 80, flags: [{ type: "grey", label: "This resident also has records registered in Brgy. San Nicolas, Tarlac City. Cross-barangay verification recommended before issuing official documents." }, { type: "grey", label: "This resident also has records registered in Brgy. Amucao, Tarlac City. Cross-barangay verification recommended before issuing official documents." }, { type: "grey", label: "This resident also has records registered in Brgy. Dalayap, Tarlac City. Cross-barangay verification recommended before issuing official documents." }, { type: "grey", label: "This resident also has records registered in Brgy. Maliwalo, Tarlac City. Cross-barangay verification recommended before issuing official documents." }, { type: "grey", label: "This resident also has records registered in Brgy. San Roque, Tarlac City. Cross-barangay verification recommended before issuing official documents." }], created_at: "2026-02-14", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "O-", telephone: "", educational_attainment: "Elementary Graduate", employer: "Self-employed", monthly_income: "10000", philhealth_number: "", sss_gsis_number: "", pagibig_number: "", tin_number: "", voter_id: "VN-006666", precinct_number: "0045A", household_number: "HH-035", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: true, is_solo_parent: false },
  { id: "7", resident_number: "RES-1376040160-0007", first_name: "Liza", middle_name: "Tan", last_name: "Villanueva", extension_name: "", sex: "female", date_of_birth: "2001-12-25", age: 24, civil_status: "single", purok: "Jasmine", street: "Rizal St.", house_number: "55", mobile_number: "09381234567", email: "liza.v@email.com", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "Nurse", profile_completion_pct: 88, flags: [], created_at: "2026-02-18", place_of_birth: "Manila", nationality: "Filipino", religion: "Catholic", blood_type: "A-", telephone: "", educational_attainment: "College Graduate", employer: "Provincial Hospital", monthly_income: "28000", philhealth_number: "PH-007777777", sss_gsis_number: "SSS-7777777", pagibig_number: "HD-77777777", tin_number: "777-777-777", voter_id: "VN-007777", precinct_number: "0048D", household_number: "HH-015", relationship_to_head: "Daughter", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "8", resident_number: "RES-1376040160-0008", first_name: "Eduardo", middle_name: "Navarro", last_name: "Ramos", extension_name: "Sr.", sex: "male", date_of_birth: "1955-04-10", age: 70, civil_status: "married", purok: "Sunflower", street: "Quezon Blvd.", house_number: "12", mobile_number: "09191234567", email: "", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Retired", profile_completion_pct: 70, flags: [], created_at: "2026-02-22", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "B-", telephone: "044-987-6543", educational_attainment: "High School Graduate", employer: "", monthly_income: "5000", philhealth_number: "PH-008888888", sss_gsis_number: "GSIS-8888888", pagibig_number: "HD-88888888", tin_number: "888-888-888", voter_id: "VN-008888", precinct_number: "0049E", household_number: "HH-040", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "9", resident_number: "RES-1376040160-0009", first_name: "Carmen", middle_name: "Flores", last_name: "Gonzales", extension_name: "", sex: "female", date_of_birth: "1995-08-17", age: 30, civil_status: "married", purok: "Orchid", street: "Mabini St.", house_number: "77", mobile_number: "09321234567", email: "carmen.g@email.com", status: "inactive", is_voter: false, is_head_of_household: false, resident_type: "transient", occupation: "Cashier", profile_completion_pct: 55, flags: [], created_at: "2026-02-28", place_of_birth: "Bulacan", nationality: "Filipino", religion: "Born Again", blood_type: "O+", telephone: "", educational_attainment: "College Level", employer: "SM Supermarket", monthly_income: "13000", philhealth_number: "PH-009999999", sss_gsis_number: "SSS-9999999", pagibig_number: "", tin_number: "", voter_id: "", precinct_number: "", household_number: "HH-022", relationship_to_head: "Spouse", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "10", resident_number: "RES-1376040160-0010", first_name: "Miguel", middle_name: "Torres", last_name: "Aquino", extension_name: "", sex: "male", date_of_birth: "2003-06-05", age: 22, civil_status: "single", purok: "Sampaguita", street: "Luna St.", house_number: "89-B", mobile_number: "09491234567", email: "", status: "active", is_voter: true, is_head_of_household: false, resident_type: "permanent", occupation: "Student", profile_completion_pct: 60, flags: [], created_at: "2026-03-01", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "", telephone: "", educational_attainment: "College Level", employer: "", monthly_income: "", philhealth_number: "", sss_gsis_number: "", pagibig_number: "", tin_number: "", voter_id: "VN-010101", precinct_number: "0045A", household_number: "HH-001", relationship_to_head: "Son", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
  { id: "11", resident_number: "RES-1376040160-0011", first_name: "Luisa", middle_name: "Mendoza", last_name: "Fernandez", extension_name: "", sex: "female", date_of_birth: "1980-02-14", age: 46, civil_status: "separated", purok: "Dahlia", street: "Rizal St.", house_number: "200", mobile_number: "09211234567", email: "", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Laundress", profile_completion_pct: 72, flags: [], created_at: "2026-03-03", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "AB-", telephone: "", educational_attainment: "Elementary Graduate", employer: "Self-employed", monthly_income: "8000", philhealth_number: "PH-011111111", sss_gsis_number: "", pagibig_number: "", tin_number: "", voter_id: "VN-011111", precinct_number: "0047C", household_number: "HH-050", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: true, is_solo_parent: true },
  { id: "12", resident_number: "RES-1376040160-0012", first_name: "Angelo", middle_name: "Dizon", last_name: "Pascual", extension_name: "", sex: "male", date_of_birth: "1993-10-19", age: 32, civil_status: "married", purok: "Ilang-Ilang", street: "Del Pilar St.", house_number: "44", mobile_number: "09471234567", email: "angelo.p@email.com", status: "active", is_voter: true, is_head_of_household: true, resident_type: "permanent", occupation: "Electrician", profile_completion_pct: 82, flags: [], created_at: "2026-03-06", place_of_birth: "Zambales", nationality: "Filipino", religion: "Catholic", blood_type: "A+", telephone: "", educational_attainment: "Vocational", employer: "Self-employed", monthly_income: "18000", philhealth_number: "PH-012121212", sss_gsis_number: "SSS-1212121", pagibig_number: "HD-12121212", tin_number: "121-212-121", voter_id: "VN-012121", precinct_number: "0046B", household_number: "HH-045", relationship_to_head: "Head", is_pwd: false, pwd_type: "", is_4ps: false, is_solo_parent: false },
];

// Mock learned address entries -- in production, fetched from barangay_address_entries API
// The system learns these over time from clerk input (no manual Settings config needed)
const defaultPurokEntries: SmartEntry[] = [
  { canonical: "Sampaguita", count: 89, aliases: ["sampaguita", "sampagita"] },
  { canonical: "Rosal", count: 67, aliases: ["rosal"] },
  { canonical: "Ilang-Ilang", count: 54, aliases: ["ilang ilang", "ylang ylang"] },
  { canonical: "Dahlia", count: 41, aliases: ["dahlia"] },
  { canonical: "Sunflower", count: 38, aliases: ["sun flower"] },
  { canonical: "Orchid", count: 25, aliases: ["orchid"] },
  { canonical: "Jasmine", count: 19, aliases: ["jasmin", "jazmine"] },
];
const defaultStreetEntries: SmartEntry[] = [
  { canonical: "Rizal Street", count: 112, aliases: ["rizal st.", "rizal st", "rizal ave"] },
  { canonical: "Mabini Street", count: 85, aliases: ["mabini st.", "mabini st"] },
  { canonical: "Bonifacio Avenue", count: 63, aliases: ["bonifacio ave.", "bonifacio ave", "bonifacio blvd"] },
  { canonical: "Luna Street", count: 47, aliases: ["luna st.", "luna st"] },
  { canonical: "Del Pilar Street", count: 39, aliases: ["del pilar st.", "del pilar st", "delpillar st"] },
  { canonical: "Quezon Boulevard", count: 31, aliases: ["quezon blvd.", "quezon blvd", "quezon ave"] },
  { canonical: "Aguinaldo Street", count: 22, aliases: ["aguinaldo st.", "aguinaldo st"] },
];
const defaultPuroks = defaultPurokEntries.map((e) => e.canonical);

// Mock tenant data — in production, fetched from API (set during Pulitika onboarding)
const tenantConfig = {
  barangay: "TAMBO",
  city_municipality: "OLONGAPO CITY",
  province: "ZAMBALES",
  zip_code: "2200",
  logo_url: "", // Production: uploaded via Settings > Branding, fetched from API
};

// ── Barangay ID (resident_number) Auto-Generation ──
// Format: RES-{PSGC_CODE}-{SEQUENTIAL_PADDED}
// Example: RES-1376040160-0001
// - PSGC_CODE = Philippine Standard Geographic Code of the barangay (assigned during onboarding in Pulitika)
// - SEQUENTIAL = auto-incrementing per barangay, zero-padded to 4 digits (expandable)
// - Generated server-side on submit (bcmp-api), NOT editable by user
// - Primary key in residents table, unique constraint, indexed
// - In production: POST /api/residents returns the generated resident_number
// - Frontend displays it AFTER successful creation (confirmation modal)
const generateMockResidentNumber = () => {
  const maxNum = mockResidents.reduce((max, r) => {
    const num = parseInt(r.resident_number.split("-").pop() || "0", 10);
    return num > max ? num : max;
  }, 0);
  return `RES-1376040160-${String(maxNum + 1).padStart(4, "0")}`;
};

// ── Validation Helpers ──
const isValidPHMobile = (v: string) => /^09\d{9}$/.test(v.replace(/\s/g, ""));
const isValidEmail = (v: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
const formatPHMobile = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  // Auto-format: 09XX XXX XXXX
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
};

const puroks = ["All Puroks", ...defaultPuroks];
const statuses = ["All Status", "Active", "Inactive", "Deceased", "Transferred"];
const sexOptions = ["All", "Male", "Female"];
const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Divorced", "Live-in"];
const bloodTypes = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const educationLevels = ["", "No Formal Education", "Elementary Level", "Elementary Graduate", "High School Level", "High School Graduate", "Vocational", "College Level", "College Graduate", "Post Graduate"];
// religions, citizenshipOptions, ethnicityOptions replaced by SmartEntry arrays (dynamic combobox)
const extensions = ["", "Jr.", "Sr.", "II", "III", "IV", "V"];
const residentTypes = ["", "Permanent", "Transient", "Seasonal", "Migrant"];
const relationships = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Grandson", "Granddaughter", "Nephew", "Niece", "Boarder", "Helper", "Others"];
const sectorOptions = ["Senior Citizen", "PWD", "Solo Parent", "4Ps Beneficiary", "Farmer", "Nano/Micro Entrepreneur", "Student", "OFW", "TODA Driver", "JODA Driver", "Other Driver", "Vendor", "Working Student", "LGBTQIA+", "With Comorbidities", "IP (Indigenous People)"];
const employmentStatuses = ["", "Employed", "Self-employed", "Unemployed", "Retired", "Student", "OFW"];
const complexionOptions = ["", "Fair", "Light Brown", "Brown", "Dark Brown", "Dark"];
// Smart combobox entries -- in production, learned from clerk input via API
const defaultCitizenshipEntries: SmartEntry[] = [
  { canonical: "Filipino", count: 950, aliases: ["pinoy", "filipina", "pilipino"] },
  { canonical: "American", count: 12, aliases: ["us", "usa", "united states"] },
  { canonical: "Chinese", count: 8, aliases: ["chinese national"] },
  { canonical: "Japanese", count: 5, aliases: [] },
  { canonical: "Korean", count: 5, aliases: ["south korean"] },
  { canonical: "Australian", count: 3, aliases: ["aussie"] },
  { canonical: "British", count: 3, aliases: ["uk", "english"] },
  { canonical: "Canadian", count: 2, aliases: [] },
  { canonical: "Indian", count: 2, aliases: [] },
  { canonical: "Indonesian", count: 1, aliases: [] },
  { canonical: "Malaysian", count: 1, aliases: [] },
  { canonical: "Singaporean", count: 1, aliases: [] },
  { canonical: "Spanish", count: 1, aliases: [] },
  { canonical: "Taiwanese", count: 1, aliases: [] },
];
const defaultReligionEntries: SmartEntry[] = [
  { canonical: "Catholic", count: 620, aliases: ["roman catholic", "rc"] },
  { canonical: "INC (Iglesia ni Cristo)", count: 85, aliases: ["iglesia ni cristo", "inc", "iglesia"] },
  { canonical: "Born Again", count: 72, aliases: ["born again christian", "evangelical"] },
  { canonical: "Muslim", count: 45, aliases: ["islam", "islamic"] },
  { canonical: "Protestant", count: 28, aliases: [] },
  { canonical: "Seventh Day Adventist", count: 22, aliases: ["sda", "adventist"] },
  { canonical: "Baptist", count: 18, aliases: [] },
  { canonical: "Methodist", count: 12, aliases: ["united methodist"] },
  { canonical: "Jehovah's Witness", count: 10, aliases: ["jw", "jehovahs witness"] },
  { canonical: "Mormon", count: 5, aliases: ["lds", "latter day saints"] },
  { canonical: "Buddhist", count: 3, aliases: [] },
  { canonical: "Aglipayan", count: 8, aliases: ["philippine independent church", "pic"] },
];
const defaultEthnicityEntries: SmartEntry[] = [
  { canonical: "Tagalog", count: 340, aliases: [] },
  { canonical: "Cebuano", count: 85, aliases: ["bisaya", "cebuano bisaya"] },
  { canonical: "Ilocano", count: 78, aliases: ["ilokano"] },
  { canonical: "Bisaya/Binisaya", count: 65, aliases: ["bisaya", "binisaya"] },
  { canonical: "Hiligaynon/Ilonggo", count: 42, aliases: ["hiligaynon", "ilonggo"] },
  { canonical: "Bikol", count: 38, aliases: ["bicolano", "bikolano"] },
  { canonical: "Waray", count: 32, aliases: ["waray-waray"] },
  { canonical: "Kapampangan", count: 55, aliases: ["pampango", "pampanga"] },
  { canonical: "Pangasinan", count: 28, aliases: ["pangasinense"] },
  { canonical: "Maranao", count: 12, aliases: [] },
  { canonical: "Maguindanao", count: 10, aliases: ["maguindanaon"] },
  { canonical: "Tausug", count: 8, aliases: [] },
  { canonical: "Zamboangueño", count: 15, aliases: ["zamboangueno", "chavacano"] },
  { canonical: "Ibanag", count: 6, aliases: [] },
  { canonical: "Ivatan", count: 4, aliases: [] },
  { canonical: "Kankanaey", count: 3, aliases: [] },
  { canonical: "Ibaloi", count: 2, aliases: [] },
  { canonical: "Ifugao", count: 2, aliases: [] },
  { canonical: "Kalinga", count: 2, aliases: [] },
  { canonical: "Aeta", count: 20, aliases: ["ayta", "agta"] },
];
const employmentTypeOptions = ["", "Full-Time", "Part-Time", "Casual", "Seasonal", "Contractual", "Self-Employed", "Freelance", "OFW"];
const incomeRanges = ["", "Below 5,000", "5,001 - 10,000", "10,001 - 15,000", "15,001 - 20,000", "20,001 - 30,000", "30,001 - 50,000", "50,001 - 75,000", "75,001 - 100,000", "100,001 - 150,000", "150,001 - 250,000", "250,001 - 500,000", "500,001 - 1,000,000", "Above 1,000,000"];

// ── Reusable Form Fields ──
function FInput({ label, name, required, type = "text", placeholder = "", value, onChange, className, valid, error, maxLength }: {
  label: string; name: string; required?: boolean; type?: string; placeholder?: string; value: string; onChange: (name: string, value: string | boolean) => void; className?: string; valid?: boolean; error?: string; maxLength?: number;
}) {
  const forceUpper = type === "text" || type === "search";
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} name={name} value={value} maxLength={maxLength}
        onChange={(e) => onChange(name, forceUpper ? e.target.value.toUpperCase() : e.target.value)} placeholder={placeholder}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 transition-colors",
          forceUpper && "uppercase",
          error ? "border-red-500 focus:ring-red-300 bg-red-50 dark:bg-red-950/20" :
          valid ? "border-green-500 focus:ring-green-300 bg-green-50 dark:bg-green-950/20" : "border-border focus:ring-accent-ring")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Custom Date Picker with calendar dropdown ──
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function FDatePicker({ label, name, required, value, onChange, className, valid, error }: {
  label: string; name: string; required?: boolean; value: string; onChange: (name: string, value: string | boolean) => void; className?: string; valid?: boolean; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  // Parse current value or default to a sensible view date
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear() - 25);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Build calendar grid for viewMonth/viewYear
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectDate = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(name, `${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  };

  const isToday = (day: number) => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  // Age calculation
  const age = parsed ? (() => {
    let a = today.getFullYear() - parsed.getFullYear();
    const m = today.getMonth() - parsed.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) a--;
    return a;
  })() : null;

  // Display value
  const displayValue = parsed
    ? `${MONTHS[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`
    : "";

  // Year options: 1920 to current year
  const yearOptions: number[] = [];
  for (let y = today.getFullYear(); y >= 1920; y--) yearOptions.push(y);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div className={cn("relative", className)} ref={ref}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {/* Trigger button */}
      <button type="button" name={name} onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border bg-background text-left focus:outline-none focus:ring-2 transition-colors",
          error ? "border-red-500 focus:ring-red-300 bg-red-50 dark:bg-red-950/20" :
          valid ? "border-green-500 focus:ring-green-300 bg-green-50 dark:bg-green-950/20" : "border-border focus:ring-accent-ring"
        )}>
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className={cn("flex-1 truncate", !displayValue && "text-muted-foreground")}>
          {displayValue || "Select date"}
        </span>
        {age !== null && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-bg text-accent-text shrink-0">
            {age} yrs
          </span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-xl glass shadow-lg p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Month/Year header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-sm font-semibold bg-transparent border-none focus:outline-none cursor-pointer hover:text-accent-text transition-colors">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-sm font-semibold bg-transparent border-none focus:outline-none cursor-pointer hover:text-accent-text transition-colors">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">{d}</div>
            ))}
          </div>
          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button type="button" onClick={() => selectDate(day)}
                    className={cn(
                      "w-8 h-8 text-xs rounded-lg transition-colors font-medium",
                      isSelected(day)
                        ? "text-white shadow-sm"
                        : isToday(day)
                        ? "bg-accent-bg/30 text-accent-text font-bold"
                        : "text-foreground hover:bg-muted"
                    )}
                    style={isSelected(day) ? { background: "var(--accent-primary)" } : undefined}>
                    {day}
                  </button>
                ) : <div className="w-8 h-8" />}
              </div>
            ))}
          </div>
          {/* Quick actions */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <button type="button" onClick={() => { onChange(name, ""); setOpen(false); }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Clear</button>
            <button type="button" onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
              className="text-[11px] font-medium hover:text-accent-text transition-colors" style={{ color: "var(--accent-primary)" }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FSelect({ label, name, options, required, value, onChange, className, error }: {
  label: string; name: string; options: string[]; required?: boolean; value: string; onChange: (name: string, value: string | boolean) => void; className?: string; error?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select name={name} value={value} onChange={(e) => onChange(name, e.target.value)}
        className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 transition-colors",
          error ? "border-red-500 focus:ring-red-300 bg-red-50 dark:bg-red-950/20" : "border-border focus:ring-accent-ring")}>
        {options.map((o) => <option key={o} value={o === options[0] && o === "" ? "" : o}>{o || `Select ${label.toLowerCase()}`}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FCheckbox({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(name, e.target.checked)}
        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring" />
      <span className="text-sm text-foreground group-hover:text-accent-text transition-colors">{label}</span>
    </label>
  );
}

// ── Smart Address Entry (AI-powered fuzzy matching) ──
// In production: entries stored in barangay_address_entries table via API
// Learns from clerk input over time -- no manual Settings configuration needed

// Common abbreviation map for Filipino address normalization
const addressAbbreviations: Record<string, string> = {
  "st.": "street", "st": "street", "ave.": "avenue", "ave": "avenue",
  "blvd.": "boulevard", "blvd": "boulevard", "dr.": "drive", "dr": "drive",
  "rd.": "road", "rd": "road", "ln.": "lane", "ln": "lane",
  "brgy.": "barangay", "brgy": "barangay", "sts.": "streets",
};

function normalizeAddress(input: string): string {
  return input.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim()
    .split(" ").map((w) => addressAbbreviations[w] || w).join(" ");
}

function similarity(a: string, b: string): number {
  const na = normalizeAddress(a);
  const nb = normalizeAddress(b);
  if (na === nb) return 1;
  // Trigram similarity (same approach as PostgreSQL pg_trgm)
  const triA = new Set<string>(); const triB = new Set<string>();
  const pa = `  ${na} `; const pb = `  ${nb} `;
  for (let i = 0; i < pa.length - 2; i++) triA.add(pa.slice(i, i + 3));
  for (let i = 0; i < pb.length - 2; i++) triB.add(pb.slice(i, i + 3));
  let intersect = 0;
  triA.forEach((t) => { if (triB.has(t)) intersect++; });
  return intersect / (triA.size + triB.size - intersect);
}

interface SmartEntry { canonical: string; count: number; aliases: string[] }

function FCombobox({ label, name, entries, required, value, onChange, onSubmit, onEntriesChange, placeholder: customPlaceholder }: {
  label: string; name: string; entries: SmartEntry[]; required?: boolean; value: string;
  onChange: (name: string, value: string | boolean) => void;
  onSubmit?: (value: string) => void;
  onEntriesChange?: React.Dispatch<React.SetStateAction<SmartEntry[]>>;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const sorted = [...entries].sort((a, b) => b.count - a.count);

  // Fuzzy match: filter by substring OR similarity > 0.4
  const matched = trimmed
    ? sorted.map((e) => {
        const sub = e.canonical.toLowerCase().includes(trimmed.toLowerCase());
        const sim = similarity(trimmed, e.canonical);
        const aliasMatch = e.aliases.some((a) => similarity(trimmed, a) > 0.6);
        return { ...e, score: sub ? 1 : Math.max(sim, aliasMatch ? 0.7 : 0), sim };
      }).filter((e) => e.score > 0.35).sort((a, b) => b.score - a.score || b.count - a.count)
    : sorted.map((e) => ({ ...e, score: 1, sim: 0 }));

  // Find "did you mean" suggestion -- high similarity but not exact
  const exactMatch = entries.some((e) => normalizeAddress(e.canonical) === normalizeAddress(trimmed));
  const fuzzyMatch = trimmed && !exactMatch
    ? entries.find((e) => {
        const sim = similarity(trimmed, e.canonical);
        return sim > 0.55 && sim < 1;
      })
    : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submitValue = (val: string) => {
    if (onSubmit) { onSubmit(val); }
    else if (onEntriesChange) {
      onEntriesChange((prev) => {
        const existing = prev.find((e) => e.canonical.toUpperCase() === val.toUpperCase());
        if (existing) return prev.map((e) => e === existing ? { ...e, count: e.count + 1 } : e);
        return [...prev, { canonical: val, count: 1, aliases: [] }];
      });
    }
  };

  const handleSelect = (val: string) => {
    submitValue(val);
    onChange(name, val);
    setQuery("");
    setOpen(false);
  };

  const handleNew = () => {
    if (!trimmed) return;
    submitValue(trimmed);
    onChange(name, trimmed);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className={cn("flex items-center w-full rounded-lg border bg-background transition-colors",
        open ? "ring-2 ring-accent-ring border-accent-primary/50" : "border-border")}>
        <input type="text" value={open ? query : value} placeholder={value || customPlaceholder || `Type to search or add...`}
          className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none min-w-0 uppercase"
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => { setQuery(e.target.value.toUpperCase()); if (!open) setOpen(true); }}
          onKeyDown={(e) => { if (e.key === "Enter" && trimmed) { e.preventDefault(); fuzzyMatch ? handleSelect(fuzzyMatch.canonical) : handleNew(); } }} />
        {value && !open && (
          <button type="button" onClick={() => { onChange(name, ""); setOpen(true); }}
            className="px-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronDown className={cn("h-4 w-4 mr-2 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg max-h-56 overflow-y-auto">
          {/* "Did you mean" suggestion */}
          {fuzzyMatch && (
            <button type="button" onClick={() => handleSelect(fuzzyMatch.canonical)}
              className="w-full text-left px-3 py-2.5 text-sm bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
              <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Did you mean:</span>
              <span className="ml-1.5 font-semibold text-foreground">{fuzzyMatch.canonical}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">({fuzzyMatch.count} uses)</span>
            </button>
          )}
          {/* Matched entries sorted by relevance + frequency */}
          {matched.length === 0 && !trimmed && (
            <div className="px-3 py-2.5 text-sm text-muted-foreground italic">Start typing to add entries. The system learns as you go.</div>
          )}
          {matched.length === 0 && trimmed && !fuzzyMatch && (
            <div className="px-3 py-2 text-xs text-muted-foreground italic">No matches found</div>
          )}
          {matched.map((e) => (
            <button key={e.canonical} type="button" onClick={() => handleSelect(e.canonical)}
              className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between",
                e.canonical === value && "font-medium text-accent-text bg-accent-primary/5")}>
              <span>{e.canonical}</span>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">{e.count}</span>
            </button>
          ))}
          {/* Add new entry */}
          {trimmed && !exactMatch && (
            <button type="button" onClick={handleNew}
              className="w-full text-left px-3 py-2 text-sm border-t border-border text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors flex items-center gap-2 font-medium">
              <Plus className="h-3.5 w-3.5" />
              Save &ldquo;{trimmed}&rdquo; as new entry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FRadio({ label, name, options, value, onChange }: { label: string; name: string; options: { value: string; label: string }[]; value: string; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="flex items-center rounded-lg border border-border overflow-hidden">
        {options.map((o, i) => (
          <button key={o.value} type="button" onClick={() => onChange(name, o.value)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              i > 0 && "border-l border-border",
              value === o.value
                ? "text-white shadow-sm"
                : "bg-background text-foreground hover:bg-muted"
            )}
            style={value === o.value ? { background: "var(--accent-primary)" } : undefined}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Collapsible Section (V3-style blue header accordion) ──
function Section({ icon, title, open, onToggle, children }: {
  icon: React.ReactNode; title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button type="button" onClick={onToggle}
        className={cn("w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors",
          open
            ? "text-white shadow-sm"
            : "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-700")}
        style={open ? { background: "var(--accent-primary)" } : undefined}>
        <span className="shrink-0 [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span>
        <span className="flex-1 text-sm font-bold uppercase tracking-wider">{title}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-200", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="pt-5 pb-3 px-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Education Entry ──
interface EduEntry { level: string; course: string; school: string; start_year: string; end_year: string; currently_studying: boolean; }
const emptyEdu: EduEntry = { level: "", course: "", school: "", start_year: "", end_year: "", currently_studying: false };

// ── Work / Employment Entry ──
interface WorkEntry { position: string; company: string; employment_type: string; start_year: string; end_year: string; description: string; }
const emptyWork: WorkEntry = { position: "", company: "", employment_type: "", start_year: "", end_year: "", description: "" };

// ── Business / Self-Employment Entry ──
interface BusinessEntry { business_name: string; business_type: string; business_address: string; business_permit_no: string; dti_sec_no: string; monthly_income: string; start_year: string; status: string; description: string; }
const emptyBusiness: BusinessEntry = { business_name: "", business_type: "", business_address: "", business_permit_no: "", dti_sec_no: "", monthly_income: "", start_year: "", status: "", description: "" };
const businessStatuses = ["", "Active", "Temporarily Closed", "Closed", "Seasonal"];
const livelihoodTypes = ["", "Employed", "Self-Employed / Business Owner", "Both", "Unemployed", "Retired", "Student", "OFW"];

// ── Relative Entry ──
interface RelativeEntry { resident_id: string; resident_name: string; relationship: string; }
const emptyRelative: RelativeEntry = { resident_id: "", resident_name: "", relationship: "" };
const relativeRelationships = ["", "Spouse", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Grandfather", "Grandmother", "Grandson", "Granddaughter", "Uncle", "Aunt", "Nephew", "Niece", "Cousin", "Father-in-law", "Mother-in-law", "Son-in-law", "Daughter-in-law", "Brother-in-law", "Sister-in-law", "Stepfather", "Stepmother", "Stepson", "Stepdaughter", "Guardian", "Ward", "Others"];

// ── Pet Entry ──
interface PetAttachment { name: string; type: "image" | "document"; preview?: string; }
interface PetEntry { name: string; date_of_birth: string; pet_type: string; sex: string; remarks: string; photo: string | null; attachments: PetAttachment[]; }
const emptyPet: PetEntry = { name: "", date_of_birth: "", pet_type: "", sex: "", remarks: "", photo: null, attachments: [] };
const defaultEmergencyRelEntries: SmartEntry[] = [
  { canonical: "Spouse", count: 180, aliases: ["wife", "husband", "asawa"] },
  { canonical: "Parent", count: 120, aliases: ["father", "mother", "tatay", "nanay", "mama", "papa"] },
  { canonical: "Sibling", count: 85, aliases: ["brother", "sister", "kapatid"] },
  { canonical: "Child", count: 60, aliases: ["son", "daughter", "anak"] },
  { canonical: "Friend", count: 35, aliases: ["kaibigan"] },
  { canonical: "Relative", count: 28, aliases: ["kamag-anak"] },
  { canonical: "Neighbor", count: 22, aliases: ["kapitbahay"] },
  { canonical: "Grandparent", count: 15, aliases: ["lolo", "lola", "grandfather", "grandmother"] },
  { canonical: "Guardian", count: 10, aliases: ["legal guardian"] },
  { canonical: "Employer", count: 5, aliases: ["boss"] },
  { canonical: "Co-worker", count: 3, aliases: ["katrabaho", "officemate"] },
];
const defaultPetTypeEntries: SmartEntry[] = [
  { canonical: "Dog", count: 320, aliases: ["aso", "puppy", "aspin"] },
  { canonical: "Cat", count: 180, aliases: ["pusa", "kitten", "puspin"] },
  { canonical: "Bird", count: 45, aliases: ["ibon"] },
  { canonical: "Fish", count: 35, aliases: ["isda", "goldfish", "koi"] },
  { canonical: "Chicken", count: 60, aliases: ["manok", "rooster", "hen"] },
  { canonical: "Rabbit", count: 12, aliases: ["kuneho", "bunny"] },
  { canonical: "Goat", count: 25, aliases: ["kambing"] },
  { canonical: "Pig", count: 40, aliases: ["baboy"] },
  { canonical: "Cow", count: 15, aliases: ["baka"] },
  { canonical: "Carabao", count: 18, aliases: ["kalabaw", "water buffalo"] },
  { canonical: "Horse", count: 8, aliases: ["kabayo"] },
  { canonical: "Turtle", count: 6, aliases: ["pagong"] },
  { canonical: "Duck", count: 20, aliases: ["pato", "itik"] },
];
const petSexOptions = ["", "Male", "Female"];

// ── Assistance/Solicitation Entry ──
interface AssistanceAttachment { name: string; type: "image" | "document"; preview?: string; }
interface AssistanceEntry { date: string; type: string; description: string; amount: string; source: string; status: string; remarks: string; attachments: AssistanceAttachment[]; }
const emptyAssistance: AssistanceEntry = { date: "", type: "", description: "", amount: "", source: "", status: "", remarks: "", attachments: [] };
const defaultAssistanceTypeEntries: SmartEntry[] = [
  { canonical: "Financial", count: 220, aliases: ["cash", "monetary", "financial assistance", "pera"] },
  { canonical: "Medical", count: 180, aliases: ["medicine", "hospital", "medical assistance", "gamot"] },
  { canonical: "Food Pack", count: 150, aliases: ["food", "grocery", "relief goods", "bigas"] },
  { canonical: "Livelihood", count: 65, aliases: ["livelihood assistance", "puhunan", "capital"] },
  { canonical: "Educational", count: 55, aliases: ["school", "tuition", "school supplies", "pang-aral"] },
  { canonical: "Housing/Shelter", count: 30, aliases: ["housing", "shelter", "bahay", "roof repair"] },
  { canonical: "Burial", count: 45, aliases: ["death", "funeral", "libing", "burial assistance"] },
  { canonical: "Calamity Relief", count: 40, aliases: ["calamity", "disaster", "typhoon", "flood"] },
  { canonical: "Legal", count: 12, aliases: ["legal assistance", "legal aid"] },
  { canonical: "Referral Letter", count: 35, aliases: ["referral", "endorsement"] },
  { canonical: "Transportation", count: 20, aliases: ["fare", "pamasahe"] },
  { canonical: "Scholarship", count: 15, aliases: ["iskolar", "scholarship grant"] },
];
const defaultAssistanceSourceEntries: SmartEntry[] = [
  { canonical: "Barangay Fund", count: 310, aliases: ["barangay", "brgy fund", "brgy"] },
  { canonical: "Municipal/City Fund", count: 85, aliases: ["city fund", "municipal fund", "city hall"] },
  { canonical: "Provincial Fund", count: 45, aliases: ["provincial", "capitol"] },
  { canonical: "DSWD", count: 120, aliases: ["dswd assistance"] },
  { canonical: "4Ps/Pantawid", count: 95, aliases: ["4ps", "pantawid", "cct"] },
  { canonical: "AICS", count: 60, aliases: ["assistance to individuals in crisis situation"] },
  { canonical: "Congressional Fund", count: 30, aliases: ["congressman", "congress", "district fund"] },
  { canonical: "SK Fund", count: 50, aliases: ["sk", "sangguniang kabataan"] },
  { canonical: "Private/NGO", count: 25, aliases: ["ngo", "private", "charity", "foundation"] },
  { canonical: "Red Cross", count: 15, aliases: ["philippine red cross", "prc"] },
  { canonical: "PCSO", count: 20, aliases: ["pcso medical", "lotto"] },
  { canonical: "DOH", count: 18, aliases: ["department of health", "malasakit"] },
  { canonical: "Senatorial Fund", count: 10, aliases: ["senator", "senador"] },
];
const defaultSectorOtherEntries: SmartEntry[] = [
  { canonical: "Tricycle Driver", count: 180, aliases: ["trike", "traysikel", "trisikad"] },
  { canonical: "Fish Vendor", count: 120, aliases: ["tindera ng isda", "fish seller", "magisda"] },
  { canonical: "Sari-Sari Store Owner", count: 110, aliases: ["tindahan", "sari sari", "store owner", "tindero", "tindera"] },
  { canonical: "Construction Worker", count: 95, aliases: ["mason", "karpintero", "carpenter", "tubero", "plumber", "construction"] },
  { canonical: "Barangay Health Worker", count: 85, aliases: ["bhw", "health worker", "midwife", "hilot"] },
  { canonical: "Barangay Nutrition Scholar", count: 70, aliases: ["bns", "nutrition scholar"] },
  { canonical: "Barangay Tanod", count: 65, aliases: ["tanod", "bantay bayan", "peace officer"] },
  { canonical: "Lupon Member", count: 55, aliases: ["lupon", "lupon tagapamayapa", "katarungang pambarangay"] },
  { canonical: "SK Member", count: 50, aliases: ["sangguniang kabataan", "sk council", "kabataan"] },
  { canonical: "Women's Association", count: 45, aliases: ["kababaihan", "women org", "samahan ng kababaihan"] },
  { canonical: "Jeepney Driver", count: 40, aliases: ["tsuper", "driver", "jeep driver"] },
  { canonical: "Teacher", count: 38, aliases: ["guro", "titser", "educator"] },
  { canonical: "Kasambahay", count: 35, aliases: ["katulong", "helper", "domestic worker", "yaya", "maid"] },
  { canonical: "Church Worker", count: 30, aliases: ["sakristan", "choir", "simbahan", "church volunteer"] },
  { canonical: "Cooperative Member", count: 28, aliases: ["coop", "kooperatiba", "credit coop"] },
  { canonical: "Senior Citizen Association", count: 25, aliases: ["osca", "senior org", "samahan ng matatanda"] },
  { canonical: "PWD Organization", count: 22, aliases: ["pwd org", "disabled org", "samahan ng pwd"] },
  { canonical: "Market Vendor", count: 20, aliases: ["magtitinda", "palengke", "market seller", "vendor sa palengke"] },
  { canonical: "Laundry Worker", count: 18, aliases: ["labandera", "labandero", "maglalaba"] },
  { canonical: "Security Guard", count: 15, aliases: ["guard", "guwardiya", "security"] },
];
const defaultBusinessTypeEntries: SmartEntry[] = [
  { canonical: "Sari-Sari Store", count: 280, aliases: ["tindahan", "store", "sari sari", "magtitinda"] },
  { canonical: "Carinderia / Eatery", count: 150, aliases: ["karinderia", "karinderya", "eatery", "kainan", "turo-turo", "turo turo"] },
  { canonical: "Tricycle Operation", count: 130, aliases: ["traysikel", "trike operation", "tricycle", "trike"] },
  { canonical: "Buy and Sell", count: 95, aliases: ["buy & sell", "trading", "negosyo", "reseller"] },
  { canonical: "Water Refilling Station", count: 80, aliases: ["water station", "tubig", "refilling", "purified water"] },
  { canonical: "Laundry Service", count: 70, aliases: ["labahan", "laundry shop", "labandera"] },
  { canonical: "Piggery / Livestock", count: 65, aliases: ["babuyan", "pig farm", "manukan", "poultry", "livestock"] },
  { canonical: "Rice Trading", count: 55, aliases: ["bigas", "rice dealer", "bigasan", "rice mill"] },
  { canonical: "Welding / Fabrication", count: 50, aliases: ["panday", "welding shop", "fabrication", "metal works"] },
  { canonical: "Beauty Salon / Barbershop", count: 48, aliases: ["parlor", "barbershop", "salon", "beauty parlor", "gupit"] },
  { canonical: "Farming / Agriculture", count: 45, aliases: ["magsasaka", "bukid", "farm", "palay", "agriculture"] },
  { canonical: "Fishing", count: 42, aliases: ["mangingisda", "isda", "fishpond", "aquaculture"] },
  { canonical: "Vulcanizing Shop", count: 38, aliases: ["vulcanizing", "gomahan", "tire repair"] },
  { canonical: "Computer Shop / Internet Cafe", count: 35, aliases: ["comp shop", "internet cafe", "pisonet", "pisowifi"] },
  { canonical: "Bakery", count: 32, aliases: ["panaderya", "bakeshop", "bread", "tinapay"] },
  { canonical: "Construction / Contractor", count: 30, aliases: ["kontratista", "construction", "builder", "mason"] },
  { canonical: "Jeepney Operation", count: 28, aliases: ["jeepney", "jeep operation", "jeep"] },
  { canonical: "Food Vending", count: 25, aliases: ["food cart", "street food", "tusok-tusok", "fishball", "vendor"] },
  { canonical: "Auto / Motor Repair", count: 22, aliases: ["talyer", "mechanic", "auto repair", "motor shop"] },
  { canonical: "Online Selling", count: 20, aliases: ["online shop", "shopee seller", "lazada", "facebook selling", "online business"] },
];
const defaultOccupationEntries: SmartEntry[] = [
  { canonical: "Farmer", count: 280, aliases: ["magsasaka", "mag-uuma", "bukid", "palay farmer"] },
  { canonical: "Fisherman", count: 200, aliases: ["mangingisda", "fisher", "isda"] },
  { canonical: "Tricycle Driver", count: 180, aliases: ["trike driver", "traysikel", "trisikad driver"] },
  { canonical: "Vendor", count: 160, aliases: ["magtitinda", "tindera", "tindero", "market vendor", "ambulant vendor"] },
  { canonical: "Construction Worker", count: 150, aliases: ["mason", "karpintero", "carpenter", "tubero", "laborer"] },
  { canonical: "Teacher", count: 140, aliases: ["guro", "titser", "educator", "instructor"] },
  { canonical: "Housewife / Homemaker", count: 130, aliases: ["housewife", "homemaker", "maybahay", "nag-aalaga ng bahay"] },
  { canonical: "Driver", count: 120, aliases: ["tsuper", "jeepney driver", "truck driver", "delivery driver"] },
  { canonical: "Domestic Worker", count: 110, aliases: ["kasambahay", "katulong", "helper", "yaya", "maid"] },
  { canonical: "Government Employee", count: 100, aliases: ["gov employee", "empleyado ng gobyerno", "public servant"] },
  { canonical: "Security Guard", count: 90, aliases: ["guard", "guwardiya", "watchman"] },
  { canonical: "Barangay Health Worker", count: 85, aliases: ["bhw", "health worker", "midwife"] },
  { canonical: "Sari-Sari Store Owner", count: 80, aliases: ["tindahan owner", "store owner", "magtitinda"] },
  { canonical: "Electrician", count: 70, aliases: ["elektrista", "elektrisyan", "electrical"] },
  { canonical: "Mechanic", count: 65, aliases: ["mekaniko", "auto mechanic", "motor mechanic"] },
  { canonical: "OFW", count: 60, aliases: ["overseas filipino worker", "abroad", "migrant worker"] },
  { canonical: "Nurse", count: 55, aliases: ["nars", "registered nurse", "rn"] },
  { canonical: "Laundry Worker", count: 50, aliases: ["labandera", "labandero", "maglalaba"] },
  { canonical: "Student", count: 45, aliases: ["estudyante", "mag-aaral", "scholar"] },
  { canonical: "Retired", count: 40, aliases: ["retirado", "pensioner", "senior"] },
];
const defaultSkillEntries: SmartEntry[] = [
  { canonical: "Welding", count: 150, aliases: ["welder", "panday", "arc welding", "metal fabrication"] },
  { canonical: "Carpentry", count: 140, aliases: ["karpintero", "woodwork", "furniture making"] },
  { canonical: "Dressmaking / Tailoring", count: 120, aliases: ["mananahi", "seamstress", "tailor", "sewing"] },
  { canonical: "Cooking / Food Preparation", count: 110, aliases: ["pagluluto", "chef", "cook", "baking"] },
  { canonical: "Driving (Professional)", count: 100, aliases: ["pagmamaneho", "professional driver", "LTO license"] },
  { canonical: "Farming / Agriculture", count: 95, aliases: ["pagsasaka", "crop production", "organic farming"] },
  { canonical: "Electrical Installation", count: 85, aliases: ["elektrista", "wiring", "electrical work"] },
  { canonical: "Plumbing", count: 80, aliases: ["tubero", "pipe fitting", "water system"] },
  { canonical: "Masonry", count: 75, aliases: ["mason", "brick laying", "concrete work", "pagtatayo"] },
  { canonical: "Fishing", count: 70, aliases: ["pangingisda", "net making", "fish processing"] },
  { canonical: "Beauty / Hairdressing", count: 65, aliases: ["parlor", "salon", "hair cutting", "gupit", "rebond"] },
  { canonical: "Auto / Motor Repair", count: 60, aliases: ["mekaniko", "automotive", "motor repair", "talyer"] },
  { canonical: "Computer Literacy", count: 55, aliases: ["computer", "MS Office", "typing", "encoding"] },
  { canonical: "Electronics Repair", count: 50, aliases: ["technician", "cellphone repair", "appliance repair"] },
  { canonical: "Livestock / Animal Husbandry", count: 45, aliases: ["pag-aalaga ng hayop", "piggery", "poultry", "manukan"] },
  { canonical: "Handicraft / Weaving", count: 40, aliases: ["paghahabi", "basket weaving", "handicraft", "banig"] },
  { canonical: "Massage / Hilot", count: 35, aliases: ["hilot", "spa", "therapeutic massage", "wellness"] },
  { canonical: "Painting (House)", count: 30, aliases: ["pintor", "house painting", "wall painting"] },
  { canonical: "Baking / Pastry", count: 28, aliases: ["baker", "panaderya", "cake making", "pastry chef"] },
  { canonical: "Online Selling / E-Commerce", count: 25, aliases: ["online business", "shopee", "lazada", "facebook selling"] },
];
const defaultPositionEntries: SmartEntry[] = [
  { canonical: "Laborer / Helper", count: 200, aliases: ["labor", "helper", "kargador", "utility worker"] },
  { canonical: "Driver", count: 150, aliases: ["tsuper", "delivery driver", "company driver"] },
  { canonical: "Cashier", count: 120, aliases: ["kahera", "cahier", "cash handler"] },
  { canonical: "Sales Associate", count: 100, aliases: ["saleslady", "salesman", "sales clerk", "tindera"] },
  { canonical: "Teacher / Instructor", count: 95, aliases: ["guro", "titser", "faculty", "substitute teacher"] },
  { canonical: "Security Guard", count: 90, aliases: ["guard", "guwardiya", "security officer"] },
  { canonical: "Machine Operator", count: 80, aliases: ["operator", "factory worker", "production"] },
  { canonical: "Office Staff / Clerk", count: 75, aliases: ["clerk", "admin staff", "office assistant", "encoder"] },
  { canonical: "Foreman / Supervisor", count: 65, aliases: ["forman", "kapatas", "team leader", "supervisor"] },
  { canonical: "Nurse / Midwife", count: 60, aliases: ["nars", "registered nurse", "komadrona", "midwife"] },
  { canonical: "Barangay Health Worker", count: 55, aliases: ["bhw", "health worker"] },
  { canonical: "Maintenance / Janitor", count: 50, aliases: ["janitor", "custodian", "cleaner", "utility"] },
  { canonical: "Cook / Kitchen Staff", count: 48, aliases: ["cook", "kitchen helper", "kusinero", "kusinera"] },
  { canonical: "Delivery Rider", count: 45, aliases: ["rider", "grab rider", "foodpanda", "lalamove"] },
  { canonical: "Technician", count: 42, aliases: ["tech", "electrician", "aircon tech", "IT tech"] },
  { canonical: "Farm Worker", count: 40, aliases: ["farm hand", "magsasaka", "harvester", "plantation worker"] },
  { canonical: "Construction Worker", count: 38, aliases: ["mason", "carpenter", "welder", "steel man"] },
  { canonical: "Domestic Helper", count: 35, aliases: ["kasambahay", "katulong", "yaya", "househelp"] },
  { canonical: "Factory Worker", count: 30, aliases: ["production staff", "packer", "assembly line"] },
  { canonical: "Seaman / Seafarer", count: 25, aliases: ["seaman", "marino", "sailor", "ofw seaman"] },
];
const defaultEmployerEntries: SmartEntry[] = [
  { canonical: "Self-Employed", count: 300, aliases: ["sarili", "own business", "self employed", "freelance"] },
  { canonical: "Department of Education (DepEd)", count: 120, aliases: ["deped", "dep ed", "public school"] },
  { canonical: "Local Government Unit (LGU)", count: 100, aliases: ["lgu", "municipal", "city hall", "barangay"] },
  { canonical: "SM Group", count: 80, aliases: ["sm supermarket", "sm mall", "savemore", "sm retail"] },
  { canonical: "Jollibee Foods Corp.", count: 75, aliases: ["jollibee", "jfc", "chowking", "greenwich", "mang inasal"] },
  { canonical: "Security Agency", count: 70, aliases: ["agency", "guard agency", "security service"] },
  { canonical: "Construction Company", count: 65, aliases: ["contractor", "construction firm", "building company"] },
  { canonical: "Private Household", count: 60, aliases: ["private", "bahay", "employer household", "family employer"] },
  { canonical: "Department of Health (DOH)", count: 55, aliases: ["doh", "hospital", "rural health unit", "rhu"] },
  { canonical: "Philippine National Police (PNP)", count: 50, aliases: ["pnp", "police", "pulis"] },
  { canonical: "Armed Forces of the Philippines (AFP)", count: 45, aliases: ["afp", "military", "army", "sundalo"] },
  { canonical: "DOLE / PESO", count: 40, aliases: ["dole", "peso", "public employment service"] },
  { canonical: "Universal Robina Corp.", count: 35, aliases: ["urc", "jack n jill", "c2"] },
  { canonical: "Puregold", count: 30, aliases: ["puregold", "s&r"] },
  { canonical: "BPO / Call Center", count: 28, aliases: ["bpo", "call center", "outsourcing", "customer service"] },
  { canonical: "Grab / Delivery Platform", count: 25, aliases: ["grab", "foodpanda", "lalamove", "angkas"] },
  { canonical: "Factory / Manufacturing", count: 22, aliases: ["factory", "pabrika", "manufacturing plant"] },
  { canonical: "Cooperative", count: 20, aliases: ["coop", "kooperatiba", "multi-purpose coop"] },
  { canonical: "Church / Religious Org", count: 18, aliases: ["simbahan", "church", "religious"] },
  { canonical: "NGO / Foundation", count: 15, aliases: ["ngo", "foundation", "charity", "non-profit"] },
];
const assistanceStatuses = ["", "Received", "Pending", "Approved", "Denied", "Partially Received"];

// ── Smart Entries: Education ──
const defaultCourseEntries: SmartEntry[] = [
  { canonical: "BS Computer Science", count: 45, aliases: ["bscs", "compsci", "cs"] },
  { canonical: "BS Information Technology", count: 42, aliases: ["bsit", "it", "infotech"] },
  { canonical: "BS Nursing", count: 80, aliases: ["bsn", "nursing"] },
  { canonical: "BS Education", count: 75, aliases: ["bsed", "education", "teaching"] },
  { canonical: "BS Criminology", count: 60, aliases: ["bscrim", "crim", "criminology"] },
  { canonical: "BS Accountancy", count: 35, aliases: ["bsa", "accountancy", "accounting"] },
  { canonical: "BS Business Administration", count: 55, aliases: ["bsba", "business admin", "business"] },
  { canonical: "BS Civil Engineering", count: 30, aliases: ["bsce", "civil eng", "engineering"] },
  { canonical: "BS Agriculture", count: 28, aliases: ["bsa agri", "agriculture", "agri"] },
  { canonical: "BS Social Work", count: 22, aliases: ["bssw", "social work"] },
  { canonical: "Associate in Computer Technology", count: 18, aliases: ["act", "computer tech"] },
  { canonical: "BS Hotel & Restaurant Management", count: 25, aliases: ["bshrm", "hrm", "hotel management"] },
  { canonical: "BS Marine Transportation", count: 15, aliases: ["bsmt", "marine", "seaman course"] },
  { canonical: "Technical Vocational (TESDA)", count: 40, aliases: ["tesda", "tvet", "vocational", "nc2"] },
  { canonical: "General Academic Strand (GAS)", count: 20, aliases: ["gas", "shs gas", "senior high"] },
  { canonical: "STEM", count: 18, aliases: ["shs stem", "science tech"] },
  { canonical: "ABM", count: 15, aliases: ["shs abm", "accountancy business"] },
  { canonical: "HUMSS", count: 12, aliases: ["shs humss", "humanities"] },
  { canonical: "TVL", count: 10, aliases: ["shs tvl", "tech voc livelihood"] },
  { canonical: "BS Pharmacy", count: 20, aliases: ["bspharm", "pharmacy"] },
];
const defaultSchoolEntries: SmartEntry[] = [
  { canonical: "Gordon College", count: 120, aliases: ["gc", "gordon"] },
  { canonical: "Columban College", count: 85, aliases: ["columban", "cc olongapo"] },
  { canonical: "Olongapo City National High School", count: 95, aliases: ["ocnhs", "city high"] },
  { canonical: "Zambales National High School", count: 60, aliases: ["znhs"] },
  { canonical: "President Ramon Magsaysay State University", count: 55, aliases: ["prmsu", "prms", "magsaysay univ"] },
  { canonical: "Philippine Christian University", count: 25, aliases: ["pcu"] },
  { canonical: "STI College", count: 40, aliases: ["sti", "sti olongapo"] },
  { canonical: "AMA Computer College", count: 35, aliases: ["ama", "amacc"] },
  { canonical: "University of the Philippines", count: 20, aliases: ["up", "up diliman", "up manila"] },
  { canonical: "Polytechnic University of the Philippines", count: 30, aliases: ["pup"] },
  { canonical: "Technological University of the Philippines", count: 25, aliases: ["tup"] },
  { canonical: "Don Bosco Training Center", count: 18, aliases: ["don bosco", "dbti"] },
  { canonical: "Subic Bay Colleges", count: 15, aliases: ["sbc"] },
  { canonical: "Philippine Science High School", count: 10, aliases: ["pisay", "pshs"] },
  { canonical: "DepEd ALS (Alternative Learning System)", count: 22, aliases: ["als", "alternative learning"] },
];
const defaultPlaceOfBirthEntries: SmartEntry[] = [
  { canonical: "Olongapo City", count: 350, aliases: ["olongapo", "olongapo city, zambales"] },
  { canonical: "Subic, Zambales", count: 120, aliases: ["subic"] },
  { canonical: "San Marcelino, Zambales", count: 85, aliases: ["san marcelino"] },
  { canonical: "Castillejos, Zambales", count: 70, aliases: ["castillejos"] },
  { canonical: "San Antonio, Zambales", count: 55, aliases: ["san antonio zambales"] },
  { canonical: "Iba, Zambales", count: 65, aliases: ["iba"] },
  { canonical: "Tarlac City", count: 45, aliases: ["tarlac", "tarlac city"] },
  { canonical: "Manila", count: 80, aliases: ["manila city", "city of manila"] },
  { canonical: "Quezon City", count: 50, aliases: ["qc", "quezon"] },
  { canonical: "Angeles City, Pampanga", count: 35, aliases: ["angeles city", "angeles"] },
  { canonical: "San Fernando, Pampanga", count: 28, aliases: ["san fernando pampanga"] },
  { canonical: "Dagupan City, Pangasinan", count: 22, aliases: ["dagupan"] },
  { canonical: "Baguio City", count: 25, aliases: ["baguio"] },
  { canonical: "Zambales", count: 40, aliases: ["zambales province"] },
  { canonical: "Caloocan City", count: 20, aliases: ["caloocan"] },
  { canonical: "Makati City", count: 18, aliases: ["makati"] },
  { canonical: "Cebu City", count: 15, aliases: ["cebu"] },
  { canonical: "Davao City", count: 12, aliases: ["davao"] },
  { canonical: "Zamboanga City", count: 10, aliases: ["zamboanga"] },
  { canonical: "Bataan", count: 30, aliases: ["bataan province", "balanga"] },
];

// ── Year options ──
const yearOptions = ["", ...Array.from({ length: 60 }, (_, i) => String(2026 - i))];

// ── Toast Notification System ──
interface Toast { id: string; type: "success" | "error" | "warning" | "info"; title: string; message?: string; duration?: number; }

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dur = toast.duration ?? 5000;
    timerRef.current = setTimeout(() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }, dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, toast.duration, onDismiss]);

  const colors = {
    success: { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
    error: { bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200 dark:border-red-800", icon: "text-red-600 dark:text-red-400", bar: "bg-red-500" },
    warning: { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
    info: { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", icon: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
  }[toast.type];

  const Icon = toast.type === "success" ? CheckCircle : toast.type === "error" ? X : AlertTriangle;

  return (
    <div className={cn(
      "pointer-events-auto w-96 rounded-xl border shadow-2xl overflow-hidden transition-all duration-300",
      colors.bg, colors.border,
      exiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0 animate-in slide-in-from-right-5 fade-in"
    )}>
      <div className="flex items-start gap-3 p-4">
        <div className={cn("shrink-0 mt-0.5", colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.message && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toast.message}</p>}
        </div>
        <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-black/5 dark:bg-white/5">
        <div className={cn("h-full rounded-full", colors.bar)} style={{ animation: `shrink ${toast.duration ?? 5000}ms linear forwards` }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════

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
  const [showDelete, setShowDelete] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const pageSize = 10;

  // ── Form State ──
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [sectors, setSectors] = useState<string[]>([]);
  const [eduEntries, setEduEntries] = useState<EduEntry[]>([{ ...emptyEdu }]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([{ ...emptyWork }]);
  const [relativeEntries, setRelativeEntries] = useState<RelativeEntry[]>([]);
  const [petEntries, setPetEntries] = useState<PetEntry[]>([]);
  const [assistanceEntries, setAssistanceEntries] = useState<AssistanceEntry[]>([]);
  const [relativeSearch, setRelativeSearch] = useState("");
  const [relativeResults, setRelativeResults] = useState<{ id: string; name: string; purok: string }[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    other: false,
    education: false, work: false, govinfo: false,
    emergency: false, relatives: false, pets: false, assistance: false, biometric: false,
  });

  // ── Form Validation ──
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Toast Notifications ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // ── Smart Address Entries (AI-learned, no manual config needed) ──
  const [purokEntries, setPurokEntries] = useState<SmartEntry[]>(defaultPurokEntries);
  const [streetEntries, setStreetEntries] = useState<SmartEntry[]>(defaultStreetEntries);
  const [citizenshipEntries, setCitizenshipEntries] = useState<SmartEntry[]>(defaultCitizenshipEntries);
  const [religionEntries, setReligionEntries] = useState<SmartEntry[]>(defaultReligionEntries);
  const [ethnicityEntries, setEthnicityEntries] = useState<SmartEntry[]>(defaultEthnicityEntries);
  const [emergencyRelEntries, setEmergencyRelEntries] = useState<SmartEntry[]>(defaultEmergencyRelEntries);
  const [petTypeEntries, setPetTypeEntries] = useState<SmartEntry[]>(defaultPetTypeEntries);
  const [assistanceTypeEntries, setAssistanceTypeEntries] = useState<SmartEntry[]>(defaultAssistanceTypeEntries);
  const [assistanceSourceEntries, setAssistanceSourceEntries] = useState<SmartEntry[]>(defaultAssistanceSourceEntries);
  const [sectorOtherEntries, setSectorOtherEntries] = useState<SmartEntry[]>(defaultSectorOtherEntries);
  const [businessTypeEntries, setBusinessTypeEntries] = useState<SmartEntry[]>(defaultBusinessTypeEntries);
  const [occupationEntries, setOccupationEntries] = useState<SmartEntry[]>(defaultOccupationEntries);
  const [skillEntries, setSkillEntries] = useState<SmartEntry[]>(defaultSkillEntries);
  const [positionEntries, setPositionEntries] = useState<SmartEntry[]>(defaultPositionEntries);
  const [employerEntries, setEmployerEntries] = useState<SmartEntry[]>(defaultEmployerEntries);
  const [businessEntries, setBusinessEntries] = useState<BusinessEntry[]>([]);
  const [courseEntries, setCourseEntries] = useState<SmartEntry[]>(defaultCourseEntries);
  const [schoolEntries, setSchoolEntries] = useState<SmartEntry[]>(defaultSchoolEntries);
  const [placeOfBirthEntries, setPlaceOfBirthEntries] = useState<SmartEntry[]>(defaultPlaceOfBirthEntries);

  // ── Map State (Leaflet + Google Geocoding) ──
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapLocating, setMapLocating] = useState(false);
  const [mapError, setMapError] = useState("");

  const submitEntry = (entries: SmartEntry[], setEntries: React.Dispatch<React.SetStateAction<SmartEntry[]>>, val: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => normalizeAddress(e.canonical) === normalizeAddress(val));
      if (existing) {
        // Increment usage count + add alias if new variation
        return prev.map((e) => e.canonical === existing.canonical
          ? { ...e, count: e.count + 1, aliases: e.aliases.includes(val.toLowerCase()) ? e.aliases : [...e.aliases, val.toLowerCase()] }
          : e);
      }
      // Check if it's a close match to existing (merge as alias)
      const fuzzy = prev.find((e) => similarity(val, e.canonical) > 0.65);
      if (fuzzy) {
        return prev.map((e) => e.canonical === fuzzy.canonical
          ? { ...e, count: e.count + 1, aliases: [...e.aliases, val.toLowerCase()] }
          : e);
      }
      // Truly new entry
      return [...prev, { canonical: val, count: 1, aliases: [val.toLowerCase()] }];
    });
  };

  // ── Smart Photo System ──
  interface PhotoAnalysis {
    status: "good" | "fair" | "poor";
    faceDetected: boolean;
    faceSupported: boolean; // whether browser supports FaceDetector
    issues: string[];       // blocking/quality issues
    notes: string[];        // non-blocking informational notes
    brightness: number;     // 0-255
    sharpness: number;      // higher = sharper
  }

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoCaptureRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Photo Analysis (runs entirely in browser — zero cost) ──
  const analyzePhoto = useCallback(async (imageDataUrl: string): Promise<PhotoAnalysis> => {
    const img = new globalThis.Image();
    const imgLoaded = await new Promise<boolean>((resolve) => { img.onload = () => resolve(true); img.onerror = () => resolve(false); img.src = imageDataUrl; });
    if (!imgLoaded || !img.width || !img.height) {
      return { status: "fair" as const, faceDetected: false, faceSupported: false, issues: [], notes: [], brightness: 128, sharpness: 100 };
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Brightness: average luminance across all pixels
    let totalLum = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const brightness = totalLum / pixelCount;

    // Sharpness: Laplacian variance (measures edge contrast)
    const gray = new Float32Array(pixelCount);
    for (let i = 0; i < pixelCount; i++) {
      gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    }
    let lapSum = 0;
    let lapCount = 0;
    const w = canvas.width;
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const lap = -4 * gray[idx] + gray[idx - 1] + gray[idx + 1] + gray[idx - w] + gray[idx + w];
        lapSum += lap * lap;
        lapCount++;
      }
    }
    const sharpness = lapSum / lapCount;

    // Face detection: use browser's native FaceDetector API (Chrome/Edge — free, no library)
    let faceDetected = false;
    let faceBounds: { x: number; y: number; width: number; height: number } | null = null;
    try {
      if ("FaceDetector" in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).FaceDetector({ maxDetectedFaces: 5 });
        const faces = await detector.detect(canvas);
        if (faces.length === 1) {
          faceDetected = true;
          faceBounds = faces[0].boundingBox;
        }
      }
    } catch { /* FaceDetector not supported — skip gracefully */ }

    // Build issues (quality problems) and notes (non-blocking info)
    const issues: string[] = [];
    const notes: string[] = [];
    const faceSupported = "FaceDetector" in window;

    if (brightness < 60) issues.push("Too dark — improve lighting");
    else if (brightness > 210) issues.push("Too bright — reduce lighting or glare");

    if (sharpness < 50) issues.push("Photo is blurry — hold steady or move closer");

    if (img.width < 200 || img.height < 200) {
      issues.push("Photo too small — use a higher resolution");
    }

    // No-face is a NOTE not a blocker — photo is still accepted
    if (faceSupported && !faceDetected) {
      notes.push("No face detected — photo will still be saved, but you may want to retake");
    }

    // Auto-crop to ID proportions (2:2.5 ratio) if face is detected
    if (faceDetected && faceBounds) {
      const idW = faceBounds.width * 2.2;
      const idH = idW * 1.25; // 2x2.5 ID ratio
      let cropX = faceBounds.x + faceBounds.width / 2 - idW / 2;
      let cropY = faceBounds.y - faceBounds.height * 0.5; // headroom above face
      cropX = Math.max(0, Math.min(cropX, img.width - idW));
      cropY = Math.max(0, Math.min(cropY, img.height - idH));
      const cropW = Math.min(idW, img.width);
      const cropH = Math.min(idH, img.height);

      if (cropW > 100 && cropH > 100) {
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = 320;
        cropCanvas.height = 400;
        const cropCtx = cropCanvas.getContext("2d")!;
        cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 320, 400);
        // Replace preview with auto-cropped version
        setPhotoPreview(cropCanvas.toDataURL("image/jpeg", 0.92));
      }
    }

    // Status based on real quality issues only (not face detection)
    const status: PhotoAnalysis["status"] =
      issues.length === 0 && (faceDetected || !faceSupported) ? "good" :
      issues.length === 0 ? "fair" : // no quality issues but no face = fair
      issues.some((i) => i.includes("Too dark") || i.includes("blurry") || i.includes("too small")) ? "poor" : "fair";

    return { status, faceDetected, faceSupported, issues, notes, brightness, sharpness };
  }, []);

  // ── Barangay Logo Watermark (stamps bottom-right, semi-transparent) ──
  // Production: logo URL comes from barangay settings (uploaded via Settings > Branding)
  // Dev: falls back to static kapitanph_logo.png
  const barangayLogoUrl = tenantConfig.logo_url || "/kapitanph_logo.png";

  const stampWatermark = useCallback(async (dataUrl: string): Promise<string> => {
    try {
      const img = new globalThis.Image();
      const imgLoaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = dataUrl;
      });
      if (!imgLoaded || !img.width || !img.height) return dataUrl;

      const logo = new globalThis.Image();
      logo.crossOrigin = "anonymous";
      const logoLoaded = await new Promise<boolean>((resolve) => {
        logo.onload = () => resolve(true);
        logo.onerror = () => resolve(false);
        logo.src = barangayLogoUrl;
      });

      if (!logoLoaded) return dataUrl; // logo not available — return original without watermark

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return dataUrl;
      ctx.drawImage(img, 0, 0);

      // Stamp logo: 30% of photo width, bottom-right corner, 35% opacity
      const logoSize = Math.round(img.width * 0.3);
      const padding = Math.round(img.width * 0.03);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(logo, img.width - logoSize - padding, img.height - logoSize - padding, logoSize, logoSize);
      ctx.globalAlpha = 1;

      return canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      return dataUrl; // any failure — return original photo, never throw
    }
  }, [barangayLogoUrl]);

  const processPhoto = useCallback(async (dataUrl: string) => {
    setPhotoAnalyzing(true);
    setPhotoAnalysis(null);
    setCameraError(null);

    // Stamp barangay logo watermark (never throws — returns original on any failure)
    const watermarked = await stampWatermark(dataUrl);
    setPhotoPreview(watermarked);

    try {
      const analysis = await analyzePhoto(watermarked);
      setPhotoAnalysis(analysis);
    } catch {
      // Analysis failed — photo still usable, just no smart feedback
      setPhotoAnalysis({ status: "fair", faceDetected: false, faceSupported: false, issues: [], notes: [], brightness: 128, sharpness: 100 });
    }
    setPhotoAnalyzing(false);
  }, [analyzePhoto, stampWatermark]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCameraError("Invalid file type. Please select an image file (JPG, PNG, or WebP).");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCameraError("File is too large (max 10 MB). Please choose a smaller image or take a photo with the camera.");
      e.target.value = "";
      return;
    }
    setCameraError(null);
    const reader = new FileReader();
    reader.onload = (ev) => { processPhoto(ev.target?.result as string); stopCamera(); };
    reader.onerror = () => { setCameraError("Failed to read the file. Please try again or use a different image."); };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new DOMException("Camera not supported on this browser or connection.", "NotSupportedError");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 800 } } });
      streamRef.current = stream;
      setCameraActive(true);
      setPhotoAnalysis(null);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch (err) {
      const e = err instanceof DOMException ? err : new DOMException("Unknown camera error");
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setCameraError("Camera access was denied. Please allow camera permission in your browser settings, then try again.");
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device. Please connect a camera or use the Upload button instead.");
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        setCameraError("Camera is being used by another application. Close other apps using the camera, then try again.");
      } else if (e.name === "NotSupportedError" || e.name === "TypeError") {
        setCameraError("Camera is not available. This may be because the site is not using HTTPS. Please use the Upload button instead.");
      } else if (e.name === "OverconstrainedError") {
        setCameraError("Camera settings not supported. Please use the Upload button instead.");
      } else {
        setCameraError("Could not access camera. Please use the Upload button instead.");
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const vw = videoRef.current.videoWidth;
    const vh = videoRef.current.videoHeight;
    if (!vw || !vh) {
      setCameraError("Camera is still loading. Please wait a moment and try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Could not process the photo. Please try again or use the Upload button.");
      return;
    }
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    processPhoto(dataUrl);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setCameraError(null);
    setCameraLoading(false);
  };

  // ── Duplicate Detection State ──
  interface DupMatch { resident: Resident; score: number; matchedFields: string[] }
  const [dupMatches, setDupMatches] = useState<DupMatch[]>([]);
  const [dupModal, setDupModal] = useState(false);
  const [dupChecked, setDupChecked] = useState(false);
  const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkDuplicates = useCallback((formData: Record<string, string | boolean>) => {
    const firstName = String(formData.first_name || "").trim().toLowerCase();
    const lastName = String(formData.last_name || "").trim().toLowerCase();
    const middleName = String(formData.middle_name || "").trim().toLowerCase();
    const dob = String(formData.date_of_birth || "");

    if (!firstName || !lastName) { setDupMatches([]); setDupChecked(false); return; }

    const scored: DupMatch[] = [];
    for (const r of mockResidents) {
      const rFirst = r.first_name.toLowerCase();
      const rLast = r.last_name.toLowerCase();
      const rMiddle = r.middle_name.toLowerCase();
      const rDob = r.date_of_birth;
      let score = 0;
      const matched: string[] = [];
      if (rFirst === firstName) { score += 30; matched.push("First Name"); }
      if (rLast === lastName) { score += 30; matched.push("Last Name"); }
      if (middleName && rMiddle === middleName) { score += 15; matched.push("Middle Name"); }
      if (dob && rDob === dob) { score += 25; matched.push("Date of Birth"); }
      if (score >= 55) scored.push({ resident: r, score, matchedFields: matched });
    }
    scored.sort((a, b) => b.score - a.score);

    setDupMatches(scored);
    setDupChecked(true);
    if (scored.length > 0) setDupModal(true);
  }, []);

  const toggleSection = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const updateForm = (key: string, value: string | boolean) => {
    let v = value;
    // Auto-format Philippine mobile number
    if (key === "mobile_number" && typeof v === "string") {
      v = formatPHMobile(v);
    }
    const next = { ...form, [key]: v };
    setForm(next);
    // Clear field error on change
    if (formErrors[key]) setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    // Real-time validation for mobile/email
    if (key === "mobile_number" && typeof v === "string" && v.replace(/\s/g, "").length === 11) {
      if (!isValidPHMobile(v)) setFormErrors((prev) => ({ ...prev, mobile_number: "Must be a valid PH mobile number (09XX XXX XXXX)" }));
    }
    if (key === "email" && typeof v === "string" && v.length > 0) {
      if (!isValidEmail(v)) setFormErrors((prev) => ({ ...prev, email: "Must be a valid email address" }));
      else setFormErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
    }
    // Trigger duplicate check on name/DOB changes with debounce
    if (["first_name", "last_name", "middle_name", "date_of_birth"].includes(key)) {
      setDupChecked(false);
      if (dupTimerRef.current) clearTimeout(dupTimerRef.current);
      dupTimerRef.current = setTimeout(() => checkDuplicates(next), 600);
    }
    // Recompute sector warnings when related fields change
    if (["date_of_birth", "civil_status", "livelihood_type", "pwd_id"].includes(key)) {
      setSectorWarnings(computeSectorWarnings(sectors, next));
    }
  };
  const f = (key: string) => String(form[key] || "");
  const fb = (key: string) => !!form[key];

  const dupOk = (key: string) => dupChecked && dupMatches.length === 0 && !!f(key);

  // ── Submit Handler ──
  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    // Required fields
    if (!f("first_name").trim()) errors.first_name = "First name is required";
    if (!f("last_name").trim()) errors.last_name = "Last name is required";
    if (!f("sex")) errors.sex = "Sex is required";
    if (!f("date_of_birth")) errors.date_of_birth = "Date of birth is required";
    if (!f("place_of_birth").trim()) errors.place_of_birth = "Place of birth is required";
    if (!f("civil_status")) errors.civil_status = "Civil status is required";
    if (!f("resident_type")) errors.resident_type = "Residence type is required";

    // Tanga-proof: Date of Birth must not be in the future
    if (f("date_of_birth")) {
      const dob = new Date(f("date_of_birth") + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dob > today) errors.date_of_birth = "Date of birth cannot be in the future";
      // Must be at least 1 day old (no same-day — use hospital records for newborns)
      const ageDays = Math.floor((today.getTime() - dob.getTime()) / 86400000);
      if (ageDays < 0) errors.date_of_birth = "Date of birth cannot be in the future";
    }

    // Tanga-proof: Height bounds (30cm to 250cm)
    const height = f("height_cm");
    if (height && (parseFloat(height) < 30 || parseFloat(height) > 250)) {
      errors.height_cm = "Height must be between 30 and 250 cm";
    }

    // Tanga-proof: Weight bounds (1kg to 500kg)
    const weight = f("weight_kg");
    if (weight && (parseFloat(weight) < 1 || parseFloat(weight) > 500)) {
      errors.weight_kg = "Weight must be between 1 and 500 kg";
    }

    // Mobile validation (optional but must be valid if filled)
    const mobile = f("mobile_number").replace(/\s/g, "");
    if (mobile && !isValidPHMobile(mobile)) errors.mobile_number = "Must be a valid PH number (09XX XXX XXXX)";

    // Email validation (optional but must be valid if filled)
    const email = f("email");
    if (email && !isValidEmail(email)) errors.email = "Must be a valid email address";

    // Tanga-proof: Government ID format hints
    const tin = f("tin_number").replace(/[^0-9]/g, "");
    if (tin && tin.length !== 9 && tin.length !== 12) errors.tin_number = "TIN must be 9 or 12 digits";
    const sss = f("sss_gsis_number").replace(/[^0-9]/g, "");
    if (sss && sss.length < 7) errors.sss_gsis_number = "SSS/GSIS number too short";
    const philhealth = f("philhealth_number").replace(/[^0-9]/g, "");
    if (philhealth && philhealth.length < 8) errors.philhealth_number = "PhilHealth number too short";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      addToast({ type: "error", title: "Validation Failed", message: `Please fix ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? "s" : ""} before submitting.`, duration: 4000 });
      return;
    }

    setSubmitting(true);
    const residentNumber = generateMockResidentNumber();
    setTimeout(() => {
      setSubmitting(false);
      setMode("list");
      addToast({ type: "success", title: "Resident Registered Successfully", message: `Barangay ID: ${residentNumber}`, duration: 8000 });
    }, 800);
  };

  const openCreate = () => {
    setForm({ nationality: "Filipino", resident_type: "Permanent", status: "active" });
    setSectors([]);
    setEduEntries([{ ...emptyEdu }]);
    setWorkEntries([{ ...emptyWork }]);
    setBusinessEntries([]);
    setOpenSections({ other: false, education: false, work: false, govinfo: false, emergency: false, biometric: false });
    setPhotoPreview(null);
    setPhotoAnalysis(null);
    setDupMatches([]);
    setDupChecked(false);
    setDupModal(false);
    setMode("create");
  };

  const openEdit = (r: Resident) => {
    setForm({ ...r } as unknown as Record<string, string | boolean>);
    setSectors([]);
    setEduEntries([{ ...emptyEdu }]);
    setWorkEntries([{ ...emptyWork }]);
    setBusinessEntries([]);
    setOpenSections({ other: true, education: true, work: true, govinfo: true, emergency: true, biometric: true });
    setMode("edit");
    setViewResident(null);
  };

  const openDelete = () => { setShowDelete(true); setViewResident(null); };

  // ── Smart Sector Sync ──
  // Auto-sync sectors with other form fields to prevent contradictions.
  // Sector warnings appear inline when a conflict is detected.
  const [sectorWarnings, setSectorWarnings] = useState<Record<string, string>>({});

  const getAgeFromDob = (dob: string) => {
    if (!dob) return null;
    const d = new Date(dob + "T00:00:00");
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  const computeSectorWarnings = useCallback((currentSectors: string[], formData: Record<string, string | boolean>) => {
    const warnings: Record<string, string> = {};
    const age = getAgeFromDob(String(formData.date_of_birth || ""));
    const civil = String(formData.civil_status || "");
    const livelihood = String(formData.livelihood_type || "");

    // Senior Citizen: must be 60+
    if (currentSectors.includes("Senior Citizen") && age !== null && age < 60) {
      warnings["Senior Citizen"] = `Age is ${age}. Senior Citizen requires 60+.`;
    }
    // PWD: should have PWD ID filled
    if (currentSectors.includes("PWD") && !String(formData.pwd_id || "").trim()) {
      warnings["PWD"] = "Fill in PWD ID under Government Info.";
    }
    // Solo Parent: married is contradictory
    if (currentSectors.includes("Solo Parent") && civil === "Married") {
      warnings["Solo Parent"] = "Civil status is Married. Verify if Solo Parent applies.";
    }
    // Student vs livelihood
    if (currentSectors.includes("Student") && livelihood && livelihood !== "Student" && livelihood !== "") {
      warnings["Student"] = `Livelihood is "${livelihood}". Consider "Working Student" instead.`;
    }
    // OFW vs livelihood
    if (currentSectors.includes("OFW") && livelihood && livelihood !== "OFW" && livelihood !== "") {
      warnings["OFW"] = `Livelihood is "${livelihood}". Set Livelihood Type to "OFW" to match.`;
    }
    return warnings;
  }, []);

  const toggleSector = (s: string) => {
    setSectors((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      // Recompute warnings with updated sectors
      const w = computeSectorWarnings(next, form);
      setSectorWarnings(w);
      return next;
    });
  };

  // Auto-suggest sectors from other fields (non-intrusive: add info badge, don't force)
  const sectorSuggestions = (() => {
    const suggestions: { sector: string; reason: string }[] = [];
    const age = getAgeFromDob(f("date_of_birth"));
    if (age !== null && age >= 60 && !sectors.includes("Senior Citizen")) {
      suggestions.push({ sector: "Senior Citizen", reason: `Age is ${age}` });
    }
    if (f("pwd_id") && !sectors.includes("PWD")) {
      suggestions.push({ sector: "PWD", reason: "PWD ID is filled" });
    }
    if (f("livelihood_type") === "Student" && !sectors.includes("Student") && !sectors.includes("Working Student")) {
      suggestions.push({ sector: "Student", reason: "Livelihood is Student" });
    }
    if (f("livelihood_type") === "OFW" && !sectors.includes("OFW")) {
      suggestions.push({ sector: "OFW", reason: "Livelihood is OFW" });
    }
    return suggestions;
  })();

  // ── Relative Search (mock — in production, API call to /api/residents/search) ──
  const searchResidents = useCallback((query: string) => {
    setRelativeSearch(query);
    if (query.length < 2) { setRelativeResults([]); return; }
    const q = query.toLowerCase();
    const results = mockResidents
      .filter((r) => {
        const name = `${r.last_name}, ${r.first_name} ${r.middle_name}`.toLowerCase();
        return name.includes(q) || r.resident_number.toLowerCase().includes(q);
      })
      .filter((r) => !relativeEntries.some((rel) => rel.resident_id === r.id))
      .slice(0, 5)
      .map((r) => ({ id: r.id, name: `${r.last_name}, ${r.first_name} ${r.middle_name} ${r.extension_name}`.trim().replace(/\s+/g, " "), purok: r.purok }));
    setRelativeResults(results);
  }, [relativeEntries]);

  const addRelative = (resident: { id: string; name: string }) => {
    setRelativeEntries((prev) => [...prev, { resident_id: resident.id, resident_name: resident.name, relationship: "" }]);
    setRelativeSearch("");
    setRelativeResults([]);
  };

  // ── Pet photo handler ──
  const handlePetPhoto = (idx: number, file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, photo: reader.result as string } : x));
    reader.readAsDataURL(file);
  };

  // ── Attachment handler (for pets and assistance) ──
  const handleAttachments = (files: FileList, callback: (attachments: { name: string; type: "image" | "document"; preview?: string }[]) => void) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const newAttachments: { name: string; type: "image" | "document"; preview?: string }[] = [];
    let processed = 0;
    Array.from(files).filter((f) => allowed.includes(f.type)).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          newAttachments.push({ name: file.name, type: "image", preview: reader.result as string });
          processed++;
          if (processed === Array.from(files).filter((f) => allowed.includes(f.type)).length) callback(newAttachments);
        };
        reader.readAsDataURL(file);
      } else {
        newAttachments.push({ name: file.name, type: "document" });
        processed++;
        if (processed === Array.from(files).filter((f) => allowed.includes(f.type)).length) callback(newAttachments);
      }
    });
  };

  // ── Leaflet Map + Google Geocoding ──
  const initLeafletMap = useCallback(async () => {
    if (!mapContainerRef.current || leafletMapRef.current) return;
    const L = (await import("leaflet")).default;

    // Default center: Olongapo City, Zambales
    const defaultLat = parseFloat(String(f("latitude"))) || 14.8386;
    const defaultLng = parseFloat(String(f("longitude"))) || 120.2842;
    const hasCoords = !!f("latitude") && !!f("longitude");

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: hasCoords ? 18 : 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    if (hasCoords) {
      placeLeafletMarker(defaultLat, defaultLng);
    }

    // Click to place/move marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      placeLeafletMarker(e.latlng.lat, e.latlng.lng);
    });

    setMapReady(true);
  }, []);

  // Build pin icon HTML -- shows resident photo if available, "K" fallback
  const buildPinHtml = useCallback((photo?: string | null) => {
    if (photo) {
      // Photo pin: drop shape with circular photo clipped inside
      return `<div style="position:relative;width:44px;height:56px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
        <svg width="44" height="56" viewBox="0 0 44 56" style="position:absolute;top:0;left:0">
          <path d="M22 0C9.85 0 0 9.85 0 22c0 15.4 22 34 22 34s22-18.6 22-34C44 9.85 34.15 0 22 0z" fill="#4338ca"/>
        </svg>
        <div style="position:absolute;top:4px;left:5px;width:34px;height:34px;border-radius:50%;overflow:hidden;border:2px solid white">
          <img src="${photo}" style="width:100%;height:100%;object-fit:cover" />
        </div>
      </div>`;
    }
    // Default: "K" branded pin
    return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <defs><filter id="pin-shadow" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/></filter></defs>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 30 18 30s18-17.4 18-30C36 8.06 27.94 0 18 0z" fill="#4338ca" filter="url(#pin-shadow)"/>
      <circle cx="18" cy="17" r="11" fill="white"/>
      <text x="18" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="16" fill="#4338ca">K</text>
    </svg>`;
  }, []);

  const placeLeafletMarker = useCallback(async (lat: number, lng: number) => {
    if (!leafletMapRef.current) return;
    const L = (await import("leaflet")).default;
    const hasPhoto = !!photoPreview;
    const pinHtml = buildPinHtml(photoPreview);
    const size: [number, number] = hasPhoto ? [44, 56] : [36, 48];
    const anchor: [number, number] = hasPhoto ? [22, 56] : [18, 48];

    if (leafletMarkerRef.current) {
      leafletMarkerRef.current.setLatLng([lat, lng]);
      // Update icon in case photo changed
      const newIcon = L.divIcon({ html: pinHtml, className: "", iconSize: size, iconAnchor: anchor, popupAnchor: [0, -(size[1] - 6)] });
      leafletMarkerRef.current.setIcon(newIcon);
    } else {
      const icon = L.divIcon({ html: pinHtml, className: "", iconSize: size, iconAnchor: anchor, popupAnchor: [0, -(size[1] - 6)] });
      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(leafletMapRef.current);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        updateForm("latitude", String(pos.lat));
        updateForm("longitude", String(pos.lng));
      });
      marker.bindPopup("<div style='text-align:center;font-family:sans-serif'><strong style='color:#4338ca'>kapitan.ph</strong><br><small>Drag pin to adjust location</small></div>");
      leafletMarkerRef.current = marker;
    }
    updateForm("latitude", String(lat));
    updateForm("longitude", String(lng));
  }, [updateForm, photoPreview, buildPinHtml]);

  // Update marker icon when photo changes
  useEffect(() => {
    if (!leafletMarkerRef.current || !leafletMapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const hasPhoto = !!photoPreview;
      const pinHtml = buildPinHtml(photoPreview);
      const size: [number, number] = hasPhoto ? [44, 56] : [36, 48];
      const anchor: [number, number] = hasPhoto ? [22, 56] : [18, 48];
      const newIcon = L.divIcon({ html: pinHtml, className: "", iconSize: size, iconAnchor: anchor, popupAnchor: [0, -(size[1] - 6)] });
      leafletMarkerRef.current?.setIcon(newIcon);
    })();
  }, [photoPreview, buildPinHtml]);

  const geocodeAddress = useCallback(async (addressStr: string) => {
    if (!leafletMapRef.current) return;
    setMapLocating(true);
    setMapError("");

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!apiKey) {
      // Fallback: use Nominatim (free, no key needed) if no Google key
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&countrycodes=ph&limit=1`,
          { headers: { "User-Agent": "BCMP-Kapitan/1.0" } }
        );
        const data = await res.json();
        setMapLocating(false);
        if (data?.[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          leafletMapRef.current?.setView([lat, lng], 18, { animate: true });
          placeLeafletMarker(lat, lng);
        }
      } catch { setMapLocating(false); }
      return;
    }

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressStr)}&key=${apiKey}&region=ph`
      );
      const data = await res.json();
      setMapLocating(false);

      if (data.status === "OK" && data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        leafletMapRef.current?.setView([loc.lat, loc.lng], 18, { animate: true });
        placeLeafletMarker(loc.lat, loc.lng);
      }
    } catch {
      setMapLocating(false);
    }
  }, [placeLeafletMarker]);

  // Auto-geocode when address fields change (debounced 1.5s)
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!mapReady || mode !== "create") return;
    const parts = [
      f("house_block_lot"), f("street"), f("purok"),
      tenantConfig.barangay, tenantConfig.city_municipality,
      tenantConfig.province
    ].filter(Boolean).map(String);
    // Need at least purok or street to attempt geocoding
    const hasMeaningfulAddress = !!(f("purok") || f("street"));
    if (!hasMeaningfulAddress) return;

    const address = parts.join(", ");
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(() => geocodeAddress(address), 1500);
    return () => { if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current); };
  }, [f("house_block_lot"), f("street"), f("purok"), f("subdivision_village"), mapReady, mode]);

  // Initialize Leaflet map when entering create mode
  useEffect(() => {
    if (mode === "create") {
      const timer = setTimeout(() => initLeafletMap(), 100);
      return () => clearTimeout(timer);
    }
    // Cleanup on mode change
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      leafletMarkerRef.current = null;
      setMapReady(false);
    }
  }, [mode, initLeafletMap]);

  // ── Filtering / Sorting / Pagination ──
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

  // ══════════════════════════════════════════════════════════
  // ── REGISTRATION FORM (V3-style collapsible + V4 fields)
  // ══════════════════════════════════════════════════════════

  if (mode === "create" || mode === "edit") {
    return (
      <div className="space-y-5">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        {/* Header: Back + Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setMode("list")} className="text-xs text-accent-text hover:underline">&larr; Back to list</button>
            </div>
            <h1 className="text-xl font-bold text-foreground">{mode === "create" ? "CREATE RESIDENT" : "EDIT RESIDENT"}</h1>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="font-medium">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" })}</div>
            <div className="text-lg font-bold text-foreground">{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-2">
          {/* 1. Personal Information and Photo (always visible, not collapsible) */}
          <div>
            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-sm" style={{ background: "var(--accent-primary)" }}>
              <User className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1 text-sm font-bold uppercase tracking-wider">Personal Information and Photo</span>
            </div>
            <div className="pt-5 pb-3 px-1">
              <div className="space-y-5">
                <div className="flex items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <FInput label="First Name" name="first_name" required placeholder="e.g. Juan" value={f("first_name")} onChange={updateForm} valid={dupOk("first_name")} error={formErrors.first_name} />
                      <FInput label="Middle Name" name="middle_name" placeholder="e.g. Santiago" value={f("middle_name")} onChange={updateForm} valid={dupOk("middle_name")} />
                      <FInput label="Last Name" name="last_name" required placeholder="e.g. Dela Cruz" value={f("last_name")} onChange={updateForm} valid={dupOk("last_name")} error={formErrors.last_name} />
                      <FSelect label="Extension" name="extension_name" options={extensions} value={f("extension_name")} onChange={updateForm} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <FSelect label="Sex" name="sex" options={["", "Male", "Female"]} required value={f("sex")} onChange={updateForm} error={formErrors.sex} />
                      <FDatePicker label="Date of Birth" name="date_of_birth" required value={f("date_of_birth")} onChange={updateForm} valid={dupOk("date_of_birth")} error={formErrors.date_of_birth} />
                      <FCombobox label="Place of Birth" name="place_of_birth" required entries={placeOfBirthEntries} value={f("place_of_birth")} onChange={updateForm} onEntriesChange={setPlaceOfBirthEntries} />
                      <FSelect label="Civil Status" name="civil_status" options={["", ...civilStatuses]} required value={f("civil_status")} onChange={updateForm} error={formErrors.civil_status} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <FInput label="Contact No." name="mobile_number" type="tel" placeholder="09XX XXX XXXX" value={f("mobile_number")} onChange={updateForm} maxLength={13} error={formErrors.mobile_number} />
                      <FInput label="Email Address" name="email" type="email" placeholder="name@example.com" value={f("email")} onChange={updateForm} error={formErrors.email} />
                      <FSelect label="Residence Type" name="resident_type" options={residentTypes} required value={f("resident_type")} onChange={updateForm} error={formErrors.resident_type} />
                      <FRadio label="Head of Household?" name="is_head_of_household" value={fb("is_head_of_household") ? "yes" : "no"}
                        options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                        onChange={(n, v) => updateForm(n, v === "yes")} />
                    </div>
                  </div>
                  {/* Smart Photo Area */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                    {/* Mobile camera input: capture="environment" opens back camera by default, user can flip to front */}
                    <input ref={photoCaptureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
                    <div className={cn(
                      "w-36 h-44 rounded-xl bg-muted border-2 flex flex-col items-center justify-center overflow-hidden relative",
                      photoAnalysis?.status === "good" ? "border-green-400" :
                      photoAnalysis?.status === "poor" ? "border-red-400" :
                      photoPreview ? "border-amber-400" : "border-dashed border-border"
                    )}>
                      {cameraActive ? (
                        <>
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                          {/* Face Guide Overlay — oval silhouette */}
                          <div className="absolute inset-0 pointer-events-none">
                            <svg viewBox="0 0 144 176" className="w-full h-full" preserveAspectRatio="none">
                              <defs>
                                <mask id="face-guide-mask">
                                  <rect width="144" height="176" fill="white" />
                                  <ellipse cx="72" cy="78" rx="38" ry="50" fill="black" />
                                </mask>
                              </defs>
                              <rect width="144" height="176" fill="rgba(0,0,0,0.35)" mask="url(#face-guide-mask)" />
                              <ellipse cx="72" cy="78" rx="38" ry="50" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
                            </svg>
                            <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-white font-medium drop-shadow-sm">
                              Align face inside oval
                            </span>
                          </div>
                        </>
                      ) : photoPreview ? (
                        <>
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                          {/* Analysis Status Badge */}
                          {photoAnalyzing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                            </div>
                          )}
                          {photoAnalysis && !photoAnalyzing && (
                            <div className={cn(
                              "absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm",
                              photoAnalysis.status === "good" ? "bg-green-500 text-white" :
                              photoAnalysis.status === "poor" ? "bg-red-500 text-white" :
                              "bg-amber-500 text-white"
                            )}>
                              {photoAnalysis.status === "good" ? <CheckCircle className="h-2.5 w-2.5" /> :
                               photoAnalysis.status === "poor" ? <AlertTriangle className="h-2.5 w-2.5" /> :
                               <AlertTriangle className="h-2.5 w-2.5" />}
                              {photoAnalysis.status === "good" ? "Good" : photoAnalysis.status === "poor" ? "Poor" : "Fair"}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <User className="w-10 h-10 text-muted-foreground/40" />
                          <span className="text-[10px] text-muted-foreground mt-1">No photo</span>
                        </>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-1.5 w-36">
                      {cameraActive ? (
                        <>
                          <button type="button" onClick={capturePhoto}
                            className="flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-colors hover:opacity-90" style={{ background: "var(--accent-primary)" }}>
                            Capture
                          </button>
                          <button type="button" onClick={stopCamera}
                            className="px-2 py-1.5 text-[11px] font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Desktop: getUserMedia webcam | Mobile: hidden (use native capture instead) */}
                          <button type="button" onClick={startCamera} disabled={cameraLoading}
                            className="hidden md:flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--accent-primary)" }}>
                            {cameraLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                            {cameraLoading ? "Opening..." : "Camera"}
                          </button>
                          {/* Mobile: opens native camera (back-facing default, user can flip to front) */}
                          <button type="button" onClick={() => photoCaptureRef.current?.click()}
                            className="flex md:hidden flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-colors hover:opacity-90" style={{ background: "var(--accent-primary)" }}>
                            <Camera className="h-3 w-3" /> Take Photo
                          </button>
                          <button type="button" onClick={() => photoInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                            <Upload className="h-3 w-3" /> Upload
                          </button>
                        </>
                      )}
                    </div>
                    {/* Camera Error Message */}
                    {cameraError && (
                      <div className="w-36 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                        <p className="text-[10px] text-red-600 dark:text-red-400 leading-tight flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-px" />
                          <span>{cameraError}</span>
                        </p>
                        <button type="button" onClick={() => setCameraError(null)}
                          className="mt-1.5 w-full text-[9px] font-medium text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                          Dismiss
                        </button>
                      </div>
                    )}
                    {/* Smart Feedback Messages */}
                    {photoAnalysis && !photoAnalyzing && !cameraActive && (
                      <div className="w-36 space-y-1">
                        {/* Quality issues (red/amber) */}
                        {photoAnalysis.issues.map((issue, i) => (
                          <p key={i} className={cn(
                            "text-[10px] flex items-start gap-1",
                            photoAnalysis.status === "poor" ? "text-red-500" : "text-amber-600 dark:text-amber-400"
                          )}>
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0 mt-px" />
                            <span>{issue}</span>
                          </p>
                        ))}
                        {/* Face detection results */}
                        {photoAnalysis.faceDetected && (
                          <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5 shrink-0" /> Face detected, auto-cropped
                          </p>
                        )}
                        {/* No-face note — prominent amber box, NOT a blocker */}
                        {photoAnalysis.notes.length > 0 && (
                          <div className="mt-1 px-2 py-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                            {photoAnalysis.notes.map((note, i) => (
                              <p key={i} className="text-[9px] text-amber-700 dark:text-amber-300 leading-tight">
                                {note}
                              </p>
                            ))}
                          </div>
                        )}
                        {/* All good message */}
                        {photoAnalysis.issues.length === 0 && photoAnalysis.notes.length === 0 && (
                          <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5 shrink-0" /> Photo looks great
                          </p>
                        )}
                      </div>
                    )}
                    {/* Remove Button */}
                    {photoPreview && !cameraActive && !photoAnalyzing && (
                      <button type="button" onClick={() => { setPhotoPreview(null); setPhotoAnalysis(null); }}
                        className="text-[10px] text-red-500 hover:underline">
                        {photoAnalysis?.status === "poor" ? "Retake Photo" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Duplicate Match Modal */}
          <Modal open={dupModal} onClose={() => setDupModal(false)} title="" size="lg">
            <div className="space-y-5">
              {/* Header with icon */}
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Possible Duplicate Detected</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We found {dupMatches.length} existing record{dupMatches.length !== 1 ? "s" : ""} with similar information.
                    Review the match{dupMatches.length !== 1 ? "es" : ""} below before proceeding.
                  </p>
                </div>
              </div>

              {/* Match cards */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dupMatches.map(({ resident: r, score, matchedFields }) => (
                  <div key={r.id} className={cn("rounded-xl border-2 p-4 transition-colors",
                    score >= 90 ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" :
                    score >= 70 ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" :
                    "border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20"
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0",
                          r.sex === "female" ? "bg-pink-500" : "bg-blue-500")}>
                          {r.first_name[0]}{r.last_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{r.last_name.toUpperCase()}, {r.first_name.toUpperCase()} {r.middle_name ? r.middle_name[0].toUpperCase() + "." : ""} {r.extension_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.resident_number} &middot; {r.sex} &middot; DOB: {r.date_of_birth} &middot; Purok {r.purok}</p>
                        </div>
                      </div>
                      {/* Match % badge */}
                      <div className={cn("shrink-0 px-2.5 py-1 rounded-full text-xs font-bold",
                        score >= 90 ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                        score >= 70 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                      )}>
                        {score}% match
                      </div>
                    </div>
                    {/* Matched fields pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {matchedFields.map((field) => (
                        <span key={field} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/5 dark:bg-white/10 text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-emerald-500" /> {field}
                        </span>
                      ))}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <button onClick={() => { setDupModal(false); setViewResident(r); setMode("list"); }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors hover:opacity-90 flex items-center gap-1.5" style={{ background: "var(--accent-primary)" }}>
                        <Eye className="h-3.5 w-3.5" /> View Profile
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1.5">
                        <ScrollText className="h-3.5 w-3.5" /> Documents
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-[11px] text-muted-foreground">
                  {dupMatches.some((d) => d.score >= 90) ? "High confidence match found. Verify carefully before continuing." : "Partial match detected. Review and decide."}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => { setDupModal(false); setMode("list"); }}
                    className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => setDupModal(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors">
                    Not a Duplicate — Continue
                  </button>
                </div>
              </div>
            </div>
          </Modal>

          {/* 2. Current Address (always visible, not collapsible) */}
          <div>
            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-sm" style={{ background: "var(--accent-primary)" }}>
              <MapPin className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1 text-sm font-bold uppercase tracking-wider">Current Address</span>
            </div>
            <div className="pt-5 pb-3 px-1">
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <FInput label="Unit / Floor / House / Block / Lot No." name="house_block_lot" placeholder="e.g. Unit 4B, Blk 5 Lot 12" value={f("house_block_lot")} onChange={updateForm} />
                <FInput label="Building / Subdivision / Village / Phase" name="subdivision_village" placeholder="e.g. Villa Verde Subd. Phase 2" value={f("subdivision_village")} onChange={updateForm} />
                <FCombobox label="Purok / Sitio" name="purok" entries={purokEntries} value={f("purok")}
                  onChange={updateForm} onSubmit={(val) => submitEntry(purokEntries, setPurokEntries, val)} />
                <FCombobox label="Street / Road" name="street" entries={streetEntries} value={f("street")}
                  onChange={updateForm} onSubmit={(val) => submitEntry(streetEntries, setStreetEntries, val)} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Barangay</label>
                  <input type="text" value={tenantConfig.barangay} readOnly tabIndex={-1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground font-medium cursor-default opacity-80" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">City / Municipality</label>
                  <input type="text" value={tenantConfig.city_municipality} readOnly tabIndex={-1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground font-medium cursor-default opacity-80" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Province</label>
                  <input type="text" value={tenantConfig.province} readOnly tabIndex={-1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground font-medium cursor-default opacity-80" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Zip Code</label>
                  <input type="text" value={tenantConfig.zip_code} readOnly tabIndex={-1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground font-medium cursor-default opacity-80" />
                </div>
              </div>

              {/* Smart Map -- auto-locates as address is typed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Pin Location on Map</label>
                    {mapLocating && (
                      <span className="text-[10px] text-accent-text flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Auto-locating...
                      </span>
                    )}
                  </div>
                  {f("latitude") && f("longitude") && !mapLocating && (
                    <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {parseFloat(String(f("latitude"))).toFixed(6)}, {parseFloat(String(f("longitude"))).toFixed(6)}
                    </span>
                  )}
                </div>
                <div ref={mapContainerRef} className="w-full h-56 rounded-lg border border-border overflow-hidden bg-muted z-0">
                  {!mapReady && (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mb-2" />
                      <p className="text-xs text-muted-foreground">Loading map...</p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Map auto-updates as you fill in the address above. Click the map or drag the pin to adjust the exact location.
                </p>
              </div>
            </div>
            </div>
          </div>

          {/* 3. Other Information */}
          <Section icon={<Globe className="h-4 w-4" />} title="Other Information"
            open={openSections.other} onToggle={() => toggleSection("other")}>
            <div className="space-y-5">
              {/* Identity */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identity</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <FCombobox label="Citizenship" name="citizenship" entries={citizenshipEntries} value={f("citizenship")}
                    onChange={updateForm} onSubmit={(val) => submitEntry(citizenshipEntries, setCitizenshipEntries, val)} />
                  <FCombobox label="Religion" name="religion" entries={religionEntries} value={f("religion")}
                    onChange={updateForm} onSubmit={(val) => submitEntry(religionEntries, setReligionEntries, val)} />
                  <FCombobox label="Ethnicity" name="ethnicity" entries={ethnicityEntries} value={f("ethnicity")}
                    onChange={updateForm} onSubmit={(val) => submitEntry(ethnicityEntries, setEthnicityEntries, val)} />
                  <FInput label="Mother's Maiden Name" name="mothers_maiden_name" placeholder="e.g. Santos" value={f("mothers_maiden_name")} onChange={updateForm} />
                </div>
              </div>

              {/* Physical */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Physical</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <FSelect label="Blood Type" name="blood_type" options={bloodTypes} value={f("blood_type")} onChange={updateForm} />
                  <FInput label="Height (cm)" name="height_cm" type="number" placeholder="e.g. 165" value={f("height_cm")} onChange={updateForm} error={formErrors.height_cm} />
                  <FInput label="Weight (kg)" name="weight_kg" type="number" placeholder="e.g. 60" value={f("weight_kg")} onChange={updateForm} error={formErrors.weight_kg} />
                  <FSelect label="Complexion" name="complexion" options={complexionOptions} value={f("complexion")} onChange={updateForm} />
                </div>
              </div>

              {/* Sector / Organization */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sector / Organization</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-1.5 gap-x-2">
                  {sectorOptions.map((s) => (
                    <div key={s}>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={sectors.includes(s)} onChange={() => toggleSector(s)}
                          className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring" />
                        <span className={cn("text-sm transition-colors",
                          sectorWarnings[s] ? "text-amber-600 dark:text-amber-400 font-medium" : "text-foreground group-hover:text-accent-text"
                        )}>{s}</span>
                        {sectorWarnings[s] && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      </label>
                      {sectorWarnings[s] && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 ml-6 mt-0.5 leading-tight">{sectorWarnings[s]}</p>
                      )}
                    </div>
                  ))}
                  {/* Others with smart combobox */}
                  <div className="col-span-2 md:col-span-3 lg:col-span-4 mt-1">
                    <FCombobox label="Others" name="sector_other" value={f("sector_other")}
                      entries={sectorOtherEntries} onEntriesChange={setSectorOtherEntries}
                      onChange={updateForm} placeholder="Type to search or add sector/organization..." />
                  </div>
                </div>
                {/* Auto-suggestions from other fields */}
                {sectorSuggestions.length > 0 && (
                  <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                    <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-2">Suggested sectors based on form data:</p>
                    <div className="flex flex-wrap gap-2">
                      {sectorSuggestions.map(({ sector, reason }) => (
                        <button key={sector} type="button" onClick={() => toggleSector(sector)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Plus className="h-3 w-3" /> {sector} <span className="text-blue-500 dark:text-blue-400">({reason})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3">
                  <FRadio label="Organ Donor?" name="is_organ_donor" value={f("is_organ_donor") || "no"}
                    options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} onChange={updateForm} />
                </div>
              </div>

              {/* Health & Skills */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Health & Skills</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Health History</label>
                      <textarea value={f("health_history")} onChange={(e) => updateForm("health_history", e.target.value.toUpperCase())} placeholder="e.g. Past illnesses, allergies, disabilities"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-20 uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Skills</label>
                      <textarea value={f("skills")} onChange={(e) => updateForm("skills", e.target.value.toUpperCase())} placeholder="e.g. Carpentry, Cooking, Sewing, Driving"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-20 uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Other Remarks</label>
                <textarea value={f("other_remarks")} onChange={(e) => updateForm("other_remarks", e.target.value.toUpperCase())} placeholder="e.g. Any additional notes about this resident"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-16 uppercase" />
              </div>
            </div>
          </Section>

          {/* 4. Educational Attainment */}
          <Section icon={<GraduationCap className="h-4 w-4" />} title="Educational Attainment"
            open={openSections.education} onToggle={() => toggleSection("education")}>
            <div className="space-y-4">
              {eduEntries.map((entry, idx) => (
                <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                  {eduEntries.length > 1 && (
                    <button onClick={() => setEduEntries((e) => e.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                  )}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <FSelect label="Level" name="level" options={educationLevels}
                      value={entry.level} onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, level: String(v) } : x))} />
                    <FCombobox label="Course / Program" name="course" entries={courseEntries} value={entry.course}
                      onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, course: String(v) } : x))} onEntriesChange={setCourseEntries} />
                    <FCombobox label="School / Institution" name="school" entries={schoolEntries} value={entry.school}
                      onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, school: String(v) } : x))} onEntriesChange={setSchoolEntries} />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <FSelect label="Start Year" name="start_year" options={yearOptions}
                      value={entry.start_year} onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, start_year: String(v) } : x))} />
                    <FSelect label="End Year" name="end_year" options={yearOptions}
                      value={entry.end_year} onChange={(_, v) => setEduEntries((e) => e.map((x, i) => i === idx ? { ...x, end_year: String(v) } : x))} />
                    <div className="pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={entry.currently_studying} onChange={(e) => setEduEntries((es) => es.map((x, i) => i === idx ? { ...x, currently_studying: e.target.checked } : x))}
                          className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-ring" />
                        <span className="text-sm text-foreground">Currently studying?</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setEduEntries((e) => [...e, { ...emptyEdu }])}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                <Plus className="h-4 w-4" /> + Add another educational attainment
              </button>
            </div>
          </Section>

          {/* 5. Livelihood & Employment */}
          <Section icon={<Briefcase className="h-4 w-4" />} title="Livelihood & Employment"
            open={openSections.work} onToggle={() => toggleSection("work")}>
            <div className="space-y-5">
              {/* Livelihood Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <FSelect label="Livelihood Type" name="livelihood_type" options={livelihoodTypes} value={f("livelihood_type")} onChange={updateForm} />
                <FCombobox label="Current Occupation" name="occupation" value={f("occupation")}
                  entries={occupationEntries} onEntriesChange={setOccupationEntries}
                  onChange={updateForm} placeholder="Type to search or add occupation..." />
                <FSelect label="Monthly Income Range" name="monthly_income_range" options={incomeRanges} value={f("monthly_income_range")} onChange={updateForm} />
                <FCombobox label="Skills / Specialization" name="skills" value={f("skills")}
                  entries={skillEntries} onEntriesChange={setSkillEntries}
                  onChange={updateForm} placeholder="Type to search or add skill..." />
              </div>

              {/* Employment History — shown for Employed, Both, OFW */}
              {(f("livelihood_type") === "Employed" || f("livelihood_type") === "Both" || f("livelihood_type") === "OFW") && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider">Employment History</h4>
                  {workEntries.map((entry, idx) => (
                    <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                      {workEntries.length > 1 && (
                        <button onClick={() => setWorkEntries((e) => e.filter((_, i) => i !== idx))}
                          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                      )}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FCombobox label="Position / Job Title" name="position"
                          value={entry.position} entries={positionEntries} onEntriesChange={setPositionEntries}
                          onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, position: String(v) } : x))}
                          placeholder="Type to search or add position..." />
                        <FCombobox label="Company / Employer" name="company"
                          value={entry.company} entries={employerEntries} onEntriesChange={setEmployerEntries}
                          onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, company: String(v) } : x))}
                          placeholder="Type to search or add employer..." />
                        <FSelect label="Type of Employment" name="employment_type" options={employmentTypeOptions}
                          value={entry.employment_type} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, employment_type: String(v) } : x))} />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FSelect label="Start Year" name="start_year" options={yearOptions}
                          value={entry.start_year} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, start_year: String(v) } : x))} />
                        <FSelect label="End Year" name="end_year" options={yearOptions}
                          value={entry.end_year} onChange={(_, v) => setWorkEntries((e) => e.map((x, i) => i === idx ? { ...x, end_year: String(v) } : x))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Description</label>
                        <textarea value={entry.description} onChange={(e) => setWorkEntries((es) => es.map((x, i) => i === idx ? { ...x, description: e.target.value.toUpperCase() } : x))}
                          placeholder="Brief summary of responsibilities and achievements"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-16 uppercase" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setWorkEntries((e) => [...e, { ...emptyWork }])}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                    <Plus className="h-4 w-4" /> + Add employment record
                  </button>
                </div>
              )}

              {/* Business / Self-Employment — shown for Self-Employed / Business Owner, Both */}
              {(f("livelihood_type") === "Self-Employed / Business Owner" || f("livelihood_type") === "Both") && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider">Business / Self-Employment</h4>
                  {(businessEntries.length === 0 ? [{ ...emptyBusiness }] : businessEntries).map((entry, idx) => (
                    <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                      {businessEntries.length > 1 && (
                        <button onClick={() => setBusinessEntries((e) => e.filter((_, i) => i !== idx))}
                          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                      )}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FInput label="Business Name" name="business_name" placeholder="e.g. Maria's Sari-Sari Store"
                          value={entry.business_name} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, business_name: String(v) } : x); })} />
                        <FCombobox label="Business Type" name="business_type"
                          value={entry.business_type}
                          entries={businessTypeEntries} onEntriesChange={setBusinessTypeEntries}
                          onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, business_type: String(v) } : x); })}
                          placeholder="Type to search or add business type..." />
                        <FSelect label="Status" name="business_status" options={businessStatuses}
                          value={entry.status} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, status: String(v) } : x); })} />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FInput label="Business Address" name="business_address" placeholder="e.g. 123 Rizal St., Purok Sampaguita"
                          value={entry.business_address} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, business_address: String(v) } : x); })} />
                        <FInput label="Business Permit No." name="business_permit_no" placeholder="e.g. BP-2026-001"
                          value={entry.business_permit_no} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, business_permit_no: String(v) } : x); })} />
                        <FInput label="DTI / SEC Registration" name="dti_sec_no" placeholder="e.g. DTI-2026-12345"
                          value={entry.dti_sec_no} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, dti_sec_no: String(v) } : x); })} />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FSelect label="Est. Monthly Income" name="business_monthly_income" options={incomeRanges}
                          value={entry.monthly_income} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, monthly_income: String(v) } : x); })} />
                        <FSelect label="Started" name="business_start_year" options={yearOptions}
                          value={entry.start_year} onChange={(_, v) => setBusinessEntries((e) => { const arr = e.length === 0 ? [{ ...emptyBusiness }] : [...e]; return arr.map((x, i) => i === idx ? { ...x, start_year: String(v) } : x); })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description / Notes</label>
                        <textarea value={entry.description} onChange={(e) => setBusinessEntries((es) => { const arr = es.length === 0 ? [{ ...emptyBusiness }] : [...es]; return arr.map((x, i) => i === idx ? { ...x, description: e.target.value.toUpperCase() } : x); })}
                          placeholder="e.g. Operates daily, 2 employees, sells snacks and household items"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-16 uppercase" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setBusinessEntries((e) => [...(e.length === 0 ? [{ ...emptyBusiness }] : e), { ...emptyBusiness }])}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                    <Plus className="h-4 w-4" /> + Add another business
                  </button>
                </div>
              )}

              {/* Hint when no livelihood type selected */}
              {!f("livelihood_type") && (
                <p className="text-xs text-muted-foreground italic">Select a livelihood type above to show relevant fields.</p>
              )}
            </div>
          </Section>

          {/* 6. Government Related Info */}
          <Section icon={<IdCard className="h-4 w-4" />} title="Government Related Info"
            open={openSections.govinfo} onToggle={() => toggleSection("govinfo")}>
            <div className="space-y-5">
              {/* Government IDs */}
              <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider">Government IDs</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="GSIS/SSS No." name="sss_gsis_number" placeholder="e.g. GSIS/SSS No." value={f("sss_gsis_number")} onChange={updateForm} error={formErrors.sss_gsis_number} />
                  <FDatePicker label="Expiration Date" name="sss_gsis_expiry" value={f("sss_gsis_expiry")} onChange={updateForm} />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="PhilHealth No." name="philhealth_number" placeholder="e.g. PhilHealth No." value={f("philhealth_number")} onChange={updateForm} error={formErrors.philhealth_number} />
                  <FDatePicker label="Expiration Date" name="philhealth_expiry" value={f("philhealth_expiry")} onChange={updateForm} />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="Pag-IBIG No." name="pagibig_number" placeholder="e.g. Pag-IBIG No." value={f("pagibig_number")} onChange={updateForm} />
                  <FDatePicker label="Expiration Date" name="pagibig_expiry" value={f("pagibig_expiry")} onChange={updateForm} />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="TIN No." name="tin_number" placeholder="e.g. TIN No." value={f("tin_number")} onChange={updateForm} error={formErrors.tin_number} />
                  <FDatePicker label="Expiration Date" name="tin_expiry" value={f("tin_expiry")} onChange={updateForm} />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <FInput label="PWD ID" name="pwd_id" placeholder="e.g. PWD ID" value={f("pwd_id")} onChange={updateForm} />
                  <FDatePicker label="Expiration Date" name="pwd_id_expiry" value={f("pwd_id_expiry")} onChange={updateForm} />
                </div>
                <FInput label="Senior Citizen ID" name="senior_citizen_id" placeholder="e.g. Senior Citizen ID" value={f("senior_citizen_id")} onChange={updateForm} />
                <FInput label="Voter&apos;s No." name="voter_id" placeholder="e.g. Voter's No." value={f("voter_id")} onChange={updateForm} />
              </div>

              {/* Voter & Household */}
              <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider pt-2">Voter & Household</h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <FRadio label="Registered Voter?" name="is_voter" value={fb("is_voter") ? "yes" : "no"}
                  options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                  onChange={(n, v) => updateForm(n, v === "yes")} />
                <FInput label="Voter Precinct Number" name="voter_precinct_number" placeholder="e.g. 0045A" value={f("voter_precinct_number")} onChange={updateForm} />
                <FSelect label="Last Voted Year" name="last_voted_year" options={["", ...Array.from({ length: 10 }, (_, i) => String(2025 - i))]} value={f("last_voted_year")} onChange={updateForm} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <FInput label="Household Number" name="household_number" placeholder="HH-XXX" value={f("household_number")} onChange={updateForm} />
                <FSelect label="Relationship to Head" name="relationship_to_head" options={["", ...relationships]} value={f("relationship_to_head")} onChange={updateForm} />
              </div>

              {/* Barangay Role */}
              <h4 className="text-xs font-semibold text-accent-text uppercase tracking-wider pt-2">Barangay Role (if applicable)</h4>
              <p className="text-[11px] text-muted-foreground -mt-1">Is this person a Barangay employee or staff? Fill out the details below if yes.</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <FInput label="Barangay Position" name="barangay_position" placeholder="e.g. Staff, Kagawad" value={f("barangay_position")} onChange={updateForm} />
                <FDatePicker label="Start Date" name="barangay_role_start" value={f("barangay_role_start")} onChange={updateForm} />
                <FDatePicker label="End Date" name="barangay_role_end" value={f("barangay_role_end")} onChange={updateForm} />
              </div>
            </div>
          </Section>

          {/* 7. In Case of Emergency */}
          <Section icon={<Contact className="h-4 w-4" />} title="In Case of Emergency"
            open={openSections.emergency} onToggle={() => toggleSection("emergency")}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <FInput label="Full Name" name="emergency_contact_name" placeholder="e.g. Juan Dela Cruz" value={f("emergency_contact_name")} onChange={updateForm} />
              <FInput label="Contact No." name="emergency_contact_phone" placeholder="09XX XXX XXXX" value={f("emergency_contact_phone")} onChange={updateForm} />
              <FInput label="Address" name="emergency_contact_address" placeholder="e.g. #10 Aguinaldo St., East Tapinac, Olongapo City" value={f("emergency_contact_address")} onChange={updateForm} />
              <FCombobox label="Relationship" name="emergency_contact_relationship" entries={emergencyRelEntries} value={f("emergency_contact_relationship")}
                onChange={updateForm} onSubmit={(val) => submitEntry(emergencyRelEntries, setEmergencyRelEntries, val)} />
            </div>
          </Section>

          {/* 8. Relatives */}
          <Section icon={<Link2 className="h-4 w-4" />} title="Relatives"
            open={openSections.relatives} onToggle={() => toggleSection("relatives")}>
            <div className="space-y-4">
              {/* Search existing resident */}
              <div className="relative">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Search Resident to Link</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" value={relativeSearch} onChange={(e) => searchResidents(e.target.value)}
                    placeholder="Type resident name or ID to search..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                </div>
                {relativeResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                    {relativeResults.map((r) => (
                      <button key={r.id} onClick={() => addRelative(r)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent-bg transition-colors flex items-center justify-between">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-muted-foreground">Purok {r.purok}</span>
                      </button>
                    ))}
                  </div>
                )}
                {relativeSearch.length >= 2 && relativeResults.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">No matching residents found. The person must be registered first.</p>
                )}
              </div>

              {/* Linked relatives list */}
              {relativeEntries.length > 0 ? (
                <div className="space-y-2">
                  {relativeEntries.map((rel, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="w-8 h-8 rounded-full bg-accent-bg flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-accent-text" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{rel.resident_name}</p>
                      </div>
                      <select value={rel.relationship} onChange={(e) => setRelativeEntries((es) => es.map((x, i) => i === idx ? { ...x, relationship: e.target.value } : x))}
                        className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring w-44">
                        {relativeRelationships.map((o) => <option key={o} value={o}>{o || "Select relationship"}</option>)}
                      </select>
                      <button onClick={() => setRelativeEntries((es) => es.filter((_, i) => i !== idx))}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                  <Link2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No relatives linked yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Search and select an existing resident above to link them</p>
                </div>
              )}
            </div>
          </Section>

          {/* 9. Pets */}
          <Section icon={<PawPrint className="h-4 w-4" />} title="Pets"
            open={openSections.pets} onToggle={() => toggleSection("pets")}>
            <div className="space-y-4">
              {petEntries.map((pet, idx) => (
                <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                  {petEntries.length > 0 && (
                    <button onClick={() => setPetEntries((e) => e.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                  )}
                  <div className="flex gap-4">
                    {/* Pet photo */}
                    <div className="shrink-0">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Photo</label>
                      <div className="relative w-20 h-20 rounded-lg border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-accent-primary transition-colors group">
                        {pet.photo ? (
                          <>
                            <img src={pet.photo} alt="Pet" className="w-full h-full object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, photo: null } : x)); }}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                            <Camera className="h-5 w-5 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground mt-0.5">Add</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePetPhoto(idx, e.target.files[0])} />
                          </label>
                        )}
                      </div>
                    </div>
                    {/* Pet details */}
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <FInput label="Pet Name" name="pet_name" placeholder="e.g. Bantay" value={pet.name}
                        onChange={(_, v) => setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, name: String(v) } : x))} />
                      <FCombobox label="Pet Type" name="pet_type" entries={petTypeEntries} value={pet.pet_type}
                        onChange={(_, v) => setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, pet_type: String(v) } : x))}
                        onSubmit={(val) => submitEntry(petTypeEntries, setPetTypeEntries, val)} />
                      <FSelect label="Sex" name="pet_sex" options={petSexOptions} value={pet.sex}
                        onChange={(_, v) => setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, sex: String(v) } : x))} />
                      <FDatePicker label="Date of Birth" name="pet_dob" value={pet.date_of_birth}
                        onChange={(_, v) => setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, date_of_birth: String(v) } : x))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Remarks</label>
                    <textarea value={pet.remarks} onChange={(e) => setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, remarks: e.target.value.toUpperCase() } : x))}
                      placeholder="e.g. Breed, color, vaccination status, special notes"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-14 uppercase" />
                  </div>
                  {/* Attachments */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Attachments</label>
                    {pet.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {pet.attachments.map((att, aidx) => (
                          <div key={aidx} className="relative group">
                            {att.type === "image" && att.preview ? (
                              <div className="w-16 h-16 rounded-lg border border-border overflow-hidden shadow-sm">
                                <img src={att.preview} alt={att.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 pl-2.5 pr-6 py-2 rounded-lg border border-border bg-muted/50 text-xs shadow-sm">
                                <div className="w-7 h-7 rounded bg-accent-bg flex items-center justify-center flex-shrink-0">
                                  <FileText className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                                </div>
                                <span className="max-w-[100px] truncate font-medium text-foreground">{att.name}</span>
                              </div>
                            )}
                            <button onClick={() => setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, attachments: x.attachments.filter((_, ai) => ai !== aidx) } : x))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center gap-1.5 py-4 px-4 rounded-lg border-2 border-dashed border-border hover:border-accent-primary hover:bg-accent-bg/30 cursor-pointer transition-all group">
                      <Upload className="h-5 w-5 text-muted-foreground group-hover:text-accent-primary transition-colors" />
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-accent-text transition-colors">Click to upload files</span>
                      <span className="text-[10px] text-muted-foreground/60">JPG, PNG, PDF, DOC up to 10MB</span>
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx" className="hidden"
                        onChange={(e) => e.target.files && handleAttachments(e.target.files, (atts) => setPetEntries((es) => es.map((x, i) => i === idx ? { ...x, attachments: [...x.attachments, ...atts] } : x)))} />
                    </label>
                  </div>
                </div>
              ))}
              {petEntries.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                  <PawPrint className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No pets registered</p>
                  <p className="text-xs text-muted-foreground mt-1">Click below to add a pet</p>
                </div>
              )}
              <button onClick={() => setPetEntries((e) => [...e, { ...emptyPet }])}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                <Plus className="h-4 w-4" /> Add a pet
              </button>
            </div>
          </Section>

          {/* 10. Assistance / Solicitation */}
          <Section icon={<HandHeart className="h-4 w-4" />} title="Assistance / Solicitation"
            open={openSections.assistance} onToggle={() => toggleSection("assistance")}>
            <div className="space-y-4">
              {assistanceEntries.map((entry, idx) => (
                <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                  <button onClick={() => setAssistanceEntries((e) => e.filter((_, i) => i !== idx))}
                    className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <FDatePicker label="Date" name="assistance_date" value={entry.date}
                      onChange={(_, v) => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, date: String(v) } : x))} />
                    <FCombobox label="Type of Assistance" name="assistance_type" entries={assistanceTypeEntries} value={entry.type}
                      onChange={(_, v) => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, type: String(v) } : x))}
                      onSubmit={(val) => submitEntry(assistanceTypeEntries, setAssistanceTypeEntries, val)} />
                    <FCombobox label="Source / Program" name="assistance_source" entries={assistanceSourceEntries} value={entry.source}
                      onChange={(_, v) => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, source: String(v) } : x))}
                      onSubmit={(val) => submitEntry(assistanceSourceEntries, setAssistanceSourceEntries, val)} />
                    <FInput label="Amount (if applicable)" name="assistance_amount" type="number" placeholder="e.g. 5000" value={entry.amount}
                      onChange={(_, v) => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, amount: String(v) } : x))} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                      <textarea value={entry.description} onChange={(e) => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, description: e.target.value.toUpperCase() } : x))}
                        placeholder="Details of assistance received"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-16 uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Remarks</label>
                      <textarea value={entry.remarks} onChange={(e) => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, remarks: e.target.value.toUpperCase() } : x))}
                        placeholder="e.g. Received by spouse, partial amount, etc."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none h-16 uppercase" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <FSelect label="Status" name="assistance_status" options={assistanceStatuses} value={entry.status}
                      onChange={(_, v) => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, status: String(v) } : x))} className="w-48" />
                  </div>
                  {/* Attachments */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Attachments</label>
                    {entry.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {entry.attachments.map((att, aidx) => (
                          <div key={aidx} className="relative group">
                            {att.type === "image" && att.preview ? (
                              <div className="w-16 h-16 rounded-lg border border-border overflow-hidden shadow-sm">
                                <img src={att.preview} alt={att.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 pl-2.5 pr-6 py-2 rounded-lg border border-border bg-muted/50 text-xs shadow-sm">
                                <div className="w-7 h-7 rounded bg-accent-bg flex items-center justify-center flex-shrink-0">
                                  <FileText className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                                </div>
                                <span className="max-w-[100px] truncate font-medium text-foreground">{att.name}</span>
                              </div>
                            )}
                            <button onClick={() => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, attachments: x.attachments.filter((_, ai) => ai !== aidx) } : x))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center gap-1.5 py-4 px-4 rounded-lg border-2 border-dashed border-border hover:border-accent-primary hover:bg-accent-bg/30 cursor-pointer transition-all group">
                      <Upload className="h-5 w-5 text-muted-foreground group-hover:text-accent-primary transition-colors" />
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-accent-text transition-colors">Click to upload files</span>
                      <span className="text-[10px] text-muted-foreground/60">JPG, PNG, PDF, DOC up to 10MB</span>
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx" className="hidden"
                        onChange={(e) => e.target.files && handleAttachments(e.target.files, (atts) => setAssistanceEntries((es) => es.map((x, i) => i === idx ? { ...x, attachments: [...x.attachments, ...atts] } : x)))} />
                    </label>
                  </div>
                </div>
              ))}
              {assistanceEntries.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                  <HandHeart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No assistance records yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click below to record assistance received by this resident</p>
                </div>
              )}
              <button onClick={() => setAssistanceEntries((e) => [...e, { ...emptyAssistance }])}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-accent-primary text-accent-text hover:bg-accent-bg transition-colors">
                <Plus className="h-4 w-4" /> Add assistance record
              </button>
            </div>
          </Section>

          {/* 11. Left & Right Thumbmark */}
          <Section icon={<Fingerprint className="h-4 w-4" />} title="Left & Right Thumbmark"
            open={openSections.biometric} onToggle={() => toggleSection("biometric")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <Fingerprint className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Scan Left Thumbmark</p>
                <p className="text-[11px] text-muted-foreground mb-3">Scanner preview</p>
                <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                  Scan Left Thumb
                </button>
              </div>
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <Fingerprint className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Scan Right Thumbmark</p>
                <p className="text-[11px] text-muted-foreground mb-3">Scanner preview</p>
                <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}>
                  Scan Right Thumb
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-30 -mx-6 px-6 py-4 bg-card/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Required fields must be filled before submitting
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setMode("list")}
                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-all hover:shadow-sm">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="group relative px-7 py-2.5 text-sm font-bold rounded-lg text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: submitting ? "var(--accent-primary)" : "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Registering..." : "Register Resident"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ── LIST VIEW
  // ══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <PageHeader title="Residents" description="Manage barangay resident records, profiles, and demographics. Register new residents, update existing records, generate documents and IDs, and track population data across all puroks."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Records" }, { label: "Residents" }]}
      />

      {/* Population Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Population</p>
              <p className="text-3xl font-bold text-foreground">{mockResidents.length.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5" /> +8% vs last month
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">Male</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{maleCount}</p>
                <p className="text-[11px] text-blue-500/70 dark:text-blue-400/50">{mockResidents.length > 0 ? Math.round((maleCount / mockResidents.length) * 100) : 0}% of total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 p-3.5">
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-pink-600/70 dark:text-pink-400/70 uppercase tracking-wider">Female</p>
                <p className="text-xl font-bold text-pink-700 dark:text-pink-300">{mockResidents.length - maleCount}</p>
                <p className="text-[11px] text-pink-500/70 dark:text-pink-400/50">{mockResidents.length > 0 ? Math.round(((mockResidents.length - maleCount) / mockResidents.length) * 100) : 0}% of total</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>Gender Distribution</span>
              <span>{maleCount}M / {mockResidents.length - maleCount}F</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-l-full transition-all" style={{ width: `${mockResidents.length > 0 ? (maleCount / mockResidents.length) * 100 : 50}%` }} />
              <div className="h-full bg-pink-500 dark:bg-pink-400 rounded-r-full flex-1" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex-1 rounded-xl glass p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
              <Home className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Households</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-foreground">{householdCount}</p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">+3%</span>
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-xl glass p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Registered Voters</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-foreground">{voterCount}</p>
                <span className="text-[11px] text-muted-foreground font-medium">{mockResidents.length > 0 ? Math.round((voterCount / mockResidents.length) * 100) : 0}% of population</span>
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-xl glass p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Residents</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-foreground">{mockResidents.filter(r => r.status === "active").length}</p>
                <span className="text-[11px] text-muted-foreground font-medium">{mockResidents.filter(r => r.status === "inactive").length} inactive, {mockResidents.filter(r => r.status === "deceased").length} deceased</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Search + Actions row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search residents..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent transition-shadow" />
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn("relative inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all",
                showFilters ? "border-accent-primary bg-accent-bg text-accent-text shadow-sm" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted")}
              title="Filters">
              <Filter className="h-4 w-4" />
              {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all") && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background" style={{ background: "var(--accent-primary)" }} />
              )}
            </button>
            <button className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all" title="Import">
              <Upload className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all" title="Export">
              <Download className="h-4 w-4" />
            </button>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]" style={{ background: "var(--accent-primary)" }}>
            <Plus className="h-4 w-4" /> New Resident
          </button>
        </div>
        {/* Filter chips row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <select value={purokFilter} onChange={(e) => { setPurokFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {puroks.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={sexFilter} onChange={(e) => { setSexFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              {sexOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={voterFilter} onChange={(e) => { setVoterFilter(e.target.value); setPage(1); }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent-ring cursor-pointer transition-colors">
              <option value="all">All Voters</option>
              <option value="voter">Registered Voter</option>
              <option value="non-voter">Non-Voter</option>
            </select>
            {(purokFilter !== "All Puroks" || statusFilter !== "All Status" || sexFilter !== "All" || voterFilter !== "all") && (
              <button onClick={() => { setPurokFilter("All Puroks"); setStatusFilter("All Status"); setSexFilter("All"); setVoterFilter("all"); }}
                className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium rounded-full text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Barangay ID" field="resident_number" className="whitespace-nowrap" />
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Full Name" field="last_name" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Address</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Age" field="age" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gender</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Civil Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Voter</th>
                <SortableHeader sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} label="Created At" field="created_at" className="whitespace-nowrap" />
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No residents found</p>
                        <p className="text-xs text-muted-foreground mt-1">Register your first resident or import records from BIMS to get started.</p>
                      </div>
                      <button onClick={openCreate} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                        + New Resident
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((r) => {
                  const initials = `${r.first_name[0]}${r.last_name[0]}`;
                  const fullName = `${r.last_name.toUpperCase()}, ${r.first_name.toUpperCase()} ${r.middle_name ? r.middle_name[0].toUpperCase() + "." : ""}${r.extension_name ? " " + r.extension_name : ""}`.trim();
                  const address = [r.house_number, r.street, r.purok ? `Purok ${r.purok}` : "", "Tambo", "City of Paranaque"].filter(Boolean).join(", ").toUpperCase();
                  const daysAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
                  const createdLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : daysAgo < 7 ? `${daysAgo} days ago` : daysAgo < 30 ? `${Math.floor(daysAgo / 7)} weeks ago` : daysAgo < 365 ? `${Math.floor(daysAgo / 30)} months ago` : `${Math.floor(daysAgo / 365)} years ago`;
                  const hasGreyFlag = r.flags.some((f) => f.type === "grey");
                  const hasRedFlag = r.flags.some((f) => f.type === "red");
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewResident(r)}>
                      {/* Barangay ID */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-muted-foreground font-mono">{r.resident_number}</p>
                      </td>
                      {/* Full Name + Avatar + Last Transaction + Flags */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                            r.sex === "female" ? "bg-gradient-to-br from-pink-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-blue-500"
                          )}>{initials}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                              {r.is_head_of_household && <span title="Head of Household"><Home className="h-3 w-3 text-amber-500 shrink-0" /></span>}
                            </div>
                            <p className="text-[11px] text-muted-foreground">Last Transaction: {createdLabel}</p>
                            {(hasGreyFlag || hasRedFlag) && (() => {
                              const greyFlags = r.flags.filter((f) => f.type === "grey");
                              const redFlags = r.flags.filter((f) => f.type === "red");
                              const greyTooltip = greyFlags.length > 0 ? greyFlags.map((f) => f.label).join("\n\n") : "";
                              const greyBadgeLabel = greyFlags.length > 1 ? `${greyFlags.length} Other Brgy.` : "Other Brgy.";
                              return (
                                <div className="flex items-center gap-1 mt-1">
                                  {greyFlags.length > 0 && (
                                    <span title={greyTooltip} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                      <Flag className="h-2.5 w-2.5" />
                                      {greyBadgeLabel}
                                    </span>
                                  )}
                                  {redFlags.map((fl, i) => (
                                    <span key={i} title={fl.label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                                      <Flag className="h-2.5 w-2.5" />
                                      Case Record
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                      {/* Address */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-foreground leading-relaxed">{address}</p>
                      </td>
                      {/* Age */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm text-foreground">{r.age}</span>
                      </td>
                      {/* Gender */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-foreground uppercase">{r.sex === "male" ? "MALE" : "FEMALE"}</span>
                      </td>
                      {/* Civil Status */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-foreground uppercase">{r.civil_status.toUpperCase()}</span>
                      </td>
                      {/* Voter */}
                      <td className="px-4 py-3.5 text-center">
                        {r.is_voter ? (
                          <span title="Likely voter — COMELEC name match found. Not verified (name-only match, no DOB confirmation)." className="inline-flex items-center justify-center">
                            <Vote className="h-4 w-4 text-emerald-500" />
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Created At */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{createdLabel}</span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => setViewResident(r)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group" title="View Profile">
                            <Eye className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                          </button>
                          <button onClick={() => {}} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors group" title="Generate Document">
                            <ScrollText className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                          </button>
                          <button onClick={() => {}} className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors group" title="Generate Barangay ID">
                            <IdCard className="h-4 w-4 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                          </button>
                          <button onClick={() => {}} disabled={!r.mobile_number} className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent" title={r.mobile_number ? `Send SMS to ${r.mobile_number}` : "No mobile number registered"}>
                            <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
                          </button>
                          <div className="relative">
                            <button onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="More actions">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {actionMenu === r.id && (
                              <div className="absolute right-0 top-8 z-20 w-44 glass rounded-xl shadow-lg py-1.5">
                                <button onClick={() => { openEdit(r); setActionMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted text-left transition-colors"><Edit className="h-3.5 w-3.5 text-muted-foreground" /> Edit Profile</button>
                                <button onClick={() => { setActionMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted text-left transition-colors"><Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print Record</button>
                                <div className="border-t border-border my-1" />
                                <button onClick={() => { setViewResident(r); setArchiveModal(true); setActionMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20 text-left text-amber-600 dark:text-amber-400 transition-colors"><Archive className="h-3.5 w-3.5" /> Archive Record</button>
                              </div>
                            )}
                          </div>
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
            <p className="text-sm text-muted-foreground">Showing {start + 1}--{Math.min(start + pageSize, sorted.length)} of {sorted.length} residents</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-3 py-1 text-sm font-medium">{safePage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* View Resident Modal */}
      <Modal open={!!viewResident && !showDelete && !archiveModal} onClose={() => setViewResident(null)}
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
                {viewResident.flags.map((fl, i) => (
                  <div key={i} className={cn("flex items-center gap-2 p-3 rounded-lg text-sm",
                    fl.type === "red" ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900" : "bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800")}>
                    {fl.type === "red" ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Flag className="h-4 w-4 shrink-0" />}
                    {fl.label}
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 rounded-lg glass-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Profile Completion</span>
                <span className="text-sm font-bold" style={{ color: viewResident.profile_completion_pct >= 80 ? "#22c55e" : viewResident.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444" }}>{viewResident.profile_completion_pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${viewResident.profile_completion_pct}%`, background: viewResident.profile_completion_pct >= 80 ? "#22c55e" : viewResident.profile_completion_pct >= 50 ? "#f59e0b" : "#ef4444" }} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem icon={<User className="h-4 w-4" />} label="Sex" value={viewResident.sex} />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={`${viewResident.date_of_birth} (${viewResident.age} yrs)`} />
                <InfoItem icon={<Heart className="h-4 w-4" />} label="Civil Status" value={viewResident.civil_status} />
                <InfoItem label="Blood Type" value={viewResident.blood_type || "\u2014"} />
                <InfoItem label="Place of Birth" value={viewResident.place_of_birth || "\u2014"} />
                <InfoItem label="Nationality" value={viewResident.nationality || "\u2014"} />
                <InfoItem label="Religion" value={viewResident.religion || "\u2014"} />
                <InfoItem label="Resident Type" value={viewResident.resident_type} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact & Address</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem icon={<Phone className="h-4 w-4" />} label="Mobile" value={viewResident.mobile_number || "\u2014"} />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={viewResident.email || "\u2014"} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={`${viewResident.house_number} ${viewResident.street}, ${viewResident.purok}`} />
                <InfoItem label="Telephone" value={viewResident.telephone || "\u2014"} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Employment</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem icon={<FileText className="h-4 w-4" />} label="Occupation" value={viewResident.occupation || "\u2014"} />
                <InfoItem label="Employer" value={viewResident.employer || "\u2014"} />
                <InfoItem label="Monthly Income" value={viewResident.monthly_income ? `\u20B1${Number(viewResident.monthly_income).toLocaleString()}` : "\u2014"} />
                <InfoItem label="Education" value={viewResident.educational_attainment || "\u2014"} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Government IDs</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem label="PhilHealth" value={viewResident.philhealth_number || "\u2014"} />
                <InfoItem label="SSS/GSIS" value={viewResident.sss_gsis_number || "\u2014"} />
                <InfoItem label="Pag-IBIG" value={viewResident.pagibig_number || "\u2014"} />
                <InfoItem label="TIN" value={viewResident.tin_number || "\u2014"} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Voter & Household</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                <InfoItem label="Voter ID" value={viewResident.voter_id || "\u2014"} />
                <InfoItem label="Precinct" value={viewResident.precinct_number || "\u2014"} />
                <InfoItem label="Household" value={viewResident.household_number || "\u2014"} />
                <InfoItem label="Relationship" value={viewResident.relationship_to_head || "\u2014"} />
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

      {/* Delete Confirmation */}
      {/* Archive Record Modal */}
      <Modal open={archiveModal} onClose={() => { setArchiveModal(false); setArchiveReason(""); }} title="Archive Resident Record" size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setArchiveModal(false); setArchiveReason(""); }}>Cancel</ModalButton><ModalButton variant="danger" disabled={!archiveReason} onClick={() => { setArchiveModal(false); setArchiveReason(""); }}>Archive Record</ModalButton></>}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <Archive className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">This record will be moved to the archive. All data is preserved and can be viewed in Settings &gt; Archived Records.</p>
          </div>
          {viewResident && (
            <div className="flex items-center gap-3 p-3 rounded-lg glass-subtle">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", viewResident.sex === "female" ? "bg-pink-400" : "bg-blue-400")}>
                {viewResident.last_name[0]}{viewResident.first_name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{viewResident.last_name.toUpperCase()}, {viewResident.first_name.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground font-mono">{viewResident.resident_number}</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Reason for archiving <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              {[
                { value: "deceased", label: "Deceased", desc: "Resident has passed away" },
                { value: "transferred", label: "Transferred Out", desc: "Resident moved to another barangay" },
                { value: "other", label: "Other Reason", desc: "Specify in the remarks below" },
              ].map((opt) => (
                <label key={opt.value} className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors", archiveReason === opt.value ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-700" : "border-border hover:bg-muted/30")}>
                  <input type="radio" name="archive_reason" value={opt.value} checked={archiveReason === opt.value} onChange={() => setArchiveReason(opt.value)} className="mt-0.5 accent-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
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
