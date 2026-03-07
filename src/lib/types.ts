export interface User {
  id: string;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  role: string;
  barangay_id: string;
  barangay?: Barangay;
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
}

export interface Barangay {
  id: string;
  name: string;
  municipality: string;
  province: string;
  region: string;
  status: string;
}

export interface Resident {
  id: string;
  resident_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  extension_name: string | null;
  date_of_birth: string;
  place_of_birth: string | null;
  sex: "male" | "female";
  civil_status: string | null;
  citizenship: string | null;
  religion: string | null;
  blood_type: string | null;
  email: string | null;
  mobile_number: string | null;
  purok: string | null;
  street: string | null;
  house_block_lot: string | null;
  is_voter: boolean;
  occupation: string | null;
  highest_education: string | null;
  status: "active" | "inactive" | "deceased" | "transferred";
  profile_completion_pct: number;
  registration_date: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface LoginResponse {
  token: string;
  user: User;
}
