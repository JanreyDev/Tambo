export interface User {
  id: string;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  extension_name: string | null;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  is_super_admin: boolean;
  status: string;
  last_login_at: string | null;
  last_login_ip: string | null;
  preferences: Record<string, unknown>;
  barangay: Barangay | null;
  roles: string[];
  permissions: string[];
  created_at?: string;
}

export interface Barangay {
  id: string;
  name: string;
  psgc_code: string | null;
  full_address: string;
  city_municipality: string | null;
  province: string | null;
  zip_code: string | null;
  logo_url: string | null;
  seal_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website_url: string | null;
  motto: string | null;
  office_hours: string | null;
  captain_name: string | null;
  established_year: number | null;
  latitude: number | null;
  longitude: number | null;
  boundary_geojson: unknown | null;
  setup_complete: boolean;
  status: string;
  subscription_plan: string | null;
  sms_credit_balance: string;
  ai_credit_balance: string;
  call_credit_balance: string;
  storage_used_bytes: number;
  storage_limit_bytes: number;
}

export interface BarangaySettings {
  id: string;
  name: string;
  psgc_code: string | null;
  city_municipality: string | null;
  province: string | null;
  zip_code: string | null;
  full_address: string | null;
  logo_url: string | null;
  seal_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website_url: string | null;
  motto: string | null;
  office_hours: string | null;
  established_year: number | null;
  captain_name: string | null;
  latitude: number | null;
  longitude: number | null;
  boundary_geojson: unknown | null;
  setup_complete: boolean;
  document_header_text: string | null;
  document_footer_text: string | null;
  sms_sender_name: string | null;
  notification_preferences: {
    sms_new_resident: boolean;
    sms_certificate_issued: boolean;
    email_alerts: boolean;
    daily_summary: boolean;
  };
  settings: {
    certificate_validity_days?: number;
    clearance_fee?: number;
    indigency_fee?: number;
    id_fee?: number;
    cedula_fee?: number;
    default_signatory_name?: string;
    default_signatory_title?: string;
    [key: string]: unknown;
  };
  population: number;
  status: string;
}

export interface BarangayUsage {
  subscription: {
    plan: string;
    status: string;
    expires_at: string | null;
  };
  sms: {
    balance: number;
    total_sent: number;
    total_credits_used: number;
    sent_this_month: number;
    credits_this_month: number;
  };
  ai: {
    balance: number;
  };
  storage: {
    used_bytes: number;
    limit_bytes: number;
    file_count: number;
  };
  data: {
    residents: number;
    active_users: number;
    population: number;
  };
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
  expires_at: string;
}

// ── Dashboard Types ──

export interface DashboardStats {
  total_residents: number;
  total_households: number;
  total_establishments: number;
  total_lots_buildings: number;
  total_documents_issued: number;
  total_blotters: number;
  total_kp_cases: number;
  pending_blotters: number;
  active_kp_cases: number;
  gender_distribution: Record<string, number>;
  age_groups: Record<string, number>;
  recent_registrations: number;
  documents_this_month: number;
  // Resident demographics
  voter_count: number;
  pwd_count: number;
  senior_citizen_count: number;
  active_count: number;
  deceased_count: number;
  transferred_count: number;
  archived_count: number;
}

export interface DashboardActivity {
  type: "document" | "resident";
  id: string;
  description: string;
  template_type?: string;
  status: string | null;
  user?: string;
  created_at: string;
}

export interface SignInLog {
  id: string;
  user: string | null;
  photo_url: string | null;
  action: string;
  device_type: string;
  browser: string;
  ip_address: string;
  created_at: string;
}

export interface DashboardCredits {
  credits: {
    sms: { balance: number; label: string };
    ai: { balance: number; label: string };
    call: { balance: number; label: string };
    map: { balance: number; label: string };
  };
  storage: {
    used_bytes: number;
    limit_bytes: number;
    used_formatted: string;
    limit_formatted: string;
    percentage: number;
  };
}

// ── AI / Mabini Types ──

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AiConversation {
  id: string;
  title: string | null;
  module_context: string | null;
  messages: AiMessage[];
  message_count: number;
  tokens_used: number;
  input_tokens_used: number;
  output_tokens_used: number;
  credit_cost: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AiConversationSummary {
  id: string;
  title: string | null;
  module_context: string | null;
  message_count: number;
  tokens_used: number;
  credit_cost: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AiCredits {
  balance: number;
  estimated_cost_per_message: number;
  estimated_messages_remaining: number;
  total_used_by_barangay: number;
  total_used_by_user: number;
  conversation_count: number;
}

export type AiStreamEvent =
  | { event: "content_delta"; data: { text: string } }
  | { event: "message_complete"; data: { conversation_id: string; title: string; tokens_used: number; input_tokens: number; output_tokens: number; credit_cost: number; remaining_balance: number } }
  | { event: "error"; data: { message: string } };

// ── Resident Types ──

export interface ResidentSummary {
  id: string;
  resident_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  extension_name: string | null;
  date_of_birth: string;
  sex: "male" | "female";
  civil_status: string | null;
  purok: string | null;
  street: string | null;
  house_block_lot: string | null;
  mobile_number: string | null;
  email: string | null;
  status: string;
  is_voter: boolean;
  is_head_of_household: boolean;
  occupation: string | null;
  resident_type: string;
  profile_completion_pct: number;
  photo_file_id: string | null;
  photo_url: string | null;
  registration_date: string | null;
  created_at: string;
  sectoral_tags?: Array<{ id: string; sector: string }>;
  cross_barangay_flags?: Array<{ id: string; other_barangay_id: string; match_confidence: string; other_barangay_name?: string }>;
  // Optional fields that may be included by the API for list views
  case_records?: Array<Record<string, string>>;
  last_document?: { type?: string; generated_by?: string } | null;
  precinct_number?: string | null;
  voter_id?: string | null;
}

export interface ResidentDetail extends ResidentSummary {
  place_of_birth: string | null;
  citizenship: string | null;
  religion: string | null;
  blood_type: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  complexion: string | null;
  ethnicity: string | null;
  mothers_maiden_name: string | null;
  resident_type: string;
  email: string | null;
  street: string | null;
  house_block_lot: string | null;
  sitio: string | null;
  zip_code: string | null;
  latitude: string | null;
  longitude: string | null;
  is_voter: boolean;
  is_resident_voter: boolean;
  voter_precinct_number: string | null;
  occupation: string | null;
  employer: string | null;
  monthly_income_range: string | null;
  source_of_income: string | null;
  livelihood_type: string | null;
  skills: string | null;
  highest_education: string | null;
  education_details: unknown[] | null;
  work_history: unknown[] | null;
  business_details: unknown[] | null;
  pet_records: unknown[] | null;
  assistance_history: unknown[] | null;
  relative_links: unknown[] | null;
  health_history: string | null;
  is_organ_donor: boolean;
  barangay_position: string | null;
  barangay_role_start: string | null;
  barangay_role_end: string | null;
  sector_other: string | null;
  other_remarks: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_address: string | null;
  emergency_contact_relationship: string | null;
  is_head_of_household: boolean;
  household_id: string | null;
  household?: { id: string; household_number: string } | null;
  updated_at: string;
}

export interface DuplicateMatch {
  id: string;
  resident_number: string;
  full_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string;
  age: number | null;
  sex: string;
  purok: string | null;
  status: string;
  photo_file_id: string | null;
  mobile_number: string | null;
}

// ── Document Module Types ──

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  constituent_type: string | null;
  title: string | null;
  salutation: string | null;
  status: "active" | "inactive";
  sort_order: number;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface IssuedDocument {
  id: string;
  document_number: string;
  template_id: string;
  template_name: string | null;
  constituent_type: string;
  constituent_id: string;
  constituent_name: string | null;
  constituent_number: string | null;
  purpose: string | null;
  or_number: string | null;
  or_amount: string | null;
  ctc_number: string | null;
  ctc_date: string | null;
  ctc_place: string | null;
  issued_date: string | null;
  valid_until: string | null;
  approved_by_left: string | null;
  approved_by_right: string | null;
  qr_code_url: string | null;
  blockchain_hash: string | null;
  status: "issued" | "released" | "cancelled" | "expired";
  sms_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface IssueDocumentPayload {
  template_id: string;
  constituent_type: string;
  constituent_id: string;
  purpose?: string;
  or_number?: string;
  or_amount?: number;
  ctc_number?: string;
  ctc_date?: string;
  ctc_place?: string;
  issued_date?: string;
  valid_until?: string;
  approved_by_left?: string;
  approved_by_right?: string;
}
