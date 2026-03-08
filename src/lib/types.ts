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
  full_address: string;
  logo_url: string | null;
  status: string;
  subscription_plan: string | null;
  sms_credit_balance: string;
  ai_credit_balance: string;
  call_credit_balance: string;
  storage_used_bytes: number;
  storage_limit_bytes: number;
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
