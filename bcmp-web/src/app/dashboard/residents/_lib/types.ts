/**
 * Resident page local types — not shared with the API client, just internal
 * to the page's form state.
 */

export interface EduEntry {
  level: string;
  course: string;
  school: string;
  start_year: string;
  end_year: string;
  currently_studying: boolean;
}

export const emptyEdu: EduEntry = {
  level: "",
  course: "",
  school: "",
  start_year: "",
  end_year: "",
  currently_studying: false,
};

export interface WorkEntry {
  position: string;
  company: string;
  employment_type: string;
  start_year: string;
  end_year: string;
  description: string;
}

export const emptyWork: WorkEntry = {
  position: "",
  company: "",
  employment_type: "",
  start_year: "",
  end_year: "",
  description: "",
};

export interface BusinessEntry {
  business_name: string;
  business_type: string;
  business_address: string;
  business_permit_no: string;
  dti_sec_no: string;
  monthly_income: string;
  start_year: string;
  status: string;
  description: string;
}

export const emptyBusiness: BusinessEntry = {
  business_name: "",
  business_type: "",
  business_address: "",
  business_permit_no: "",
  dti_sec_no: "",
  monthly_income: "",
  start_year: "",
  status: "",
  description: "",
};

// ── Toast notification ──────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
