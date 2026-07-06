// ── GeoJSON types — used by Map page for barangay boundary + spatial overlays ──

export interface GeoJsonGeometry {
  type: "Polygon" | "MultiPolygon" | "Point" | "LineString";
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

export interface GeoJsonFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: GeoJsonGeometry;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

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
  preferred_language: "en" | "fil";
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
  municipality_logo_url: string | null;
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
  municipality_logo_url: string | null;
  national_logo_url: string | null;
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
    document_layout?: "klasiko" | "moderno" | "elegante" | "digital";
    [key: string]: unknown;
  };
  population: number;
  status: string;
}

export type OfficialPosition =
  | "kapitan"
  | "kagawad"
  | "sk_chairperson"
  | "secretary"
  | "treasurer"
  | "tanod_chief"
  | "lupong_chairperson"
  | "lupong_member"
  | "barangay_health_worker"
  | "day_care_worker"
  | "custom";

export interface BarangayOfficial {
  id: string;
  barangay_id: string;
  resident_id: string;
  position: string; // free-text, common values listed in OfficialPosition
  committee: string | null; // legacy single-committee field, kept for backward compat
  committees: string[]; // current: array of committee names (kagawads often chair multiple)
  term_start: string | null;
  term_end: string | null;
  appointment_date: string | null;
  oath_date: string | null;
  is_elected: boolean;
  sort_order: number;
  status: "active" | "inactive" | "suspended";
  photo_file_id: string | null;
  signature_file_id: string | null;
  created_at: string;
  updated_at: string;
  // Eager-loaded resident summary (selected columns + computed photo_url)
  resident?: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    extension_name: string | null;
    mobile_number: string | null;
    email: string | null;
    photo_url?: string | null;
  } | null;
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
  is_village_condo?: boolean;
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
  status?: number;
  retry_after?: number;
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
  // Operational counts (Phase 2 — production dashboard)
  pending_public_requests: number;
  active_vawc_cases: number;
  collections_this_month: number;
  disbursements_this_month: number;
  documents_last_month: number;
  residents_this_month: number;
}

export interface DashboardActivity {
  id: string;
  document_number: string | null;
  template_name: string | null;
  constituent_name: string | null;
  constituent_number: string | null;
  status: string | null;
  created_at: string;
}

export interface DashboardRecentResident {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  age: number | null;
  sex: "male" | "female" | null;
  purok: string | null;
  created_at: string;
  encoded_by: string | null;
}

export interface DashboardDocumentTrendPoint {
  date: string;
  day_label: string;
  count: number;
}

export interface DashboardDocumentTrend {
  trend: DashboardDocumentTrendPoint[];
  total_this_week: number;
  total_last_week: number;
  delta_pct: number | null;
}

export interface DashboardPendingRequest {
  id: string;
  request_number: string;
  requester_name: string;
  document_type: string;
  status: string;
  created_at: string;
  urgency: "low" | "medium" | "high";
}

export interface DashboardUpcomingEvent {
  id: string;
  title: string;
  session_type: string | null;
  date: string | null;
  time_start: string | null;
  venue: string | null;
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
  housing_type?: string | null;
  profile_completion_pct: number;
  photo_file_id: string | null;
  photo_url: string | null;
  registration_date: string | null;
  created_at: string;
  sectoral_tags?: Array<{ id: string; sector: string }>;
  cross_barangay_flags?: Array<{ id: string; barangay_name: string; detected_at: string | null; acknowledged_at: string | null }>;
  // Optional fields that may be included by the API for list views
  case_records?: Array<{ source: string; case_number: string; description: string; status: string; party_type: string; filing_date: string }>;
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
  telephone: string | null;
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
  last_voted_year: string | null;
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
  relationship_to_head: string | null;
  household_id: string | null;
  household?: { id: string; household_number: string } | null;
  // Government IDs — decrypted server-side, returned as plain field names
  philhealth_number: string | null;
  philhealth_expiry: string | null;
  sss_gsis_number: string | null;
  sss_gsis_expiry: string | null;
  pagibig_number: string | null;
  pagibig_expiry: string | null;
  tin_number: string | null;
  tin_expiry: string | null;
  pwd_id: string | null;
  pwd_id_expiry: string | null;
  senior_citizen_id: string | null;
  guardian_name: string | null;
  guardian_relationship: string | null;
  guardian_phone: string | null;
  housing_type: string | null;
  registration_source: string | null;
  import_batch_id: string | null;
  date_of_occupancy: string | null;
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

export type DocumentLayout = "klasiko" | "moderno" | "elegante" | "digital";

export interface DocumentTemplateCustomInput {
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required: boolean;
  label: string;
  options?: string[]; // for select type
}

export interface DocumentTemplateApproval {
  label: string;
  position: string;
}

export type PaperSize = "a4" | "short_bond" | "long_bond";

export interface DocumentTemplateSettings {
  show_qr?: boolean;
  show_ctc?: boolean;
  show_doc_no?: boolean;
  show_or?: boolean;
  show_expiry?: boolean;
  expiry_months?: number;
  show_photo?: boolean;
  show_thumbmark?: boolean;
  paper_size?: PaperSize;
}

export interface DocumentTemplate {
  id: string;
  barangay_id: string | null; // null = system template, string = barangay-owned
  name: string;
  category: string;
  constituent_type: "resident" | "establishment" | "lot_building" | "case";
  title: string | null;
  salutation: string | null;
  content: string | null;
  merge_fields: string[] | null;
  custom_inputs: DocumentTemplateCustomInput[] | null;
  custom_tables: Record<string, unknown>[] | null;
  approval_config: {
    left?: DocumentTemplateApproval;
    right?: DocumentTemplateApproval;
  } | null;
  settings: DocumentTemplateSettings | null;
  status: "active" | "published" | "draft" | "archived";
  sort_order: number;
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
  custom_field_values: Record<string, string> | null;
  approved_by_left: string | null;
  approved_by_right: string | null;
  qr_code_url: string | null;
  blockchain_hash: string | null;
  pdf_file_id: string | null;
  pdf_url: string | null;
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
  custom_field_values?: Record<string, string>;
  approved_by_left?: string;
  approved_by_right?: string;
  /** Manual content override — replaces template body for custom documents or edited previews */
  custom_content?: string;
  /** Manual title override — replaces template title for this issuance only */
  custom_title?: string;
}

// ── Establishment Types ───────────────────────────────────────────────────

export interface Establishment {
  id: string;
  establishment_number: string;
  barangay_id: string;
  business_name: string;
  business_type: string | null;
  owner_resident_id: string | null;
  owner_name: string | null;
  owner_contact: string | null;
  owner_email: string | null;
  owner_address: string | null;
  purok: string | null;
  street: string | null;
  exact_address: string | null;
  registration_type: "DTI" | "SEC" | null;
  registration_number: string | null;
  registration_date: string | null;
  permit_number: string | null;
  permit_expiry: string | null;
  status: "active" | "inactive" | "closed" | "suspended";
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentFormPayload {
  business_name: string;
  business_type?: string | null;
  owner_resident_id?: string | null;
  owner_name: string;
  owner_contact?: string | null;
  owner_email?: string | null;
  owner_address?: string | null;
  purok?: string | null;
  street?: string | null;
  exact_address?: string | null;
  registration_type?: "DTI" | "SEC" | null;
  registration_number?: string | null;
  registration_date?: string | null;
  permit_number?: string | null;
  permit_expiry?: string | null;
  status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// ── Lot/Building Types ────────────────────────────────────────────────────

export interface LotBuilding {
  id: string;
  lot_building_number: string;
  barangay_id: string;
  classification: "lot_only" | "building_only" | "lot_and_building";
  property_classification: string | null;
  owner_resident_id: string | null;
  owner_name: string | null;
  owner_contact: string | null;
  owner_email: string | null;
  owner_address: string | null;
  size: string | null;
  mri: string | null;
  purok: string | null;
  street: string | null;
  exact_address: string | null;
  lot_number: string | null;
  block_number: string | null;
  boundary_north: string | null;
  boundary_south: string | null;
  boundary_east: string | null;
  boundary_west: string | null;
  tax_declaration_number: string | null;
  registration_date: string | null;
  number_of_floors: number | null;
  building_material: string | null;
  year_constructed: number | null;
  assessed_value: string | null;
  market_value: string | null;
  status: "active" | "inactive" | "demolished";
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  updated_at: string;
}

export interface LotBuildingTransaction {
  id: string;
  transaction_type: string;
  year: number;
  notes: string | null;
  created_at: string;
  generated_by?: string;
}

// ── Voters ────────────────────────────────────────────────────────────────

export interface Voter {
  id: string;
  barangay_id: string;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  full_name: string;
  precinct_number: string;
  address: string;
  application_number: string | null;
  resident_id: string | null;
  matched_at: string | null;
  imported_at: string;
  resident?: { id: string; first_name: string; last_name: string; resident_number: string } | null;
}

export interface VoterStats {
  total: number;
  matched: number;
  last_import_date: string | null;
}

export interface VoterImportPreview {
  count: number;
  rows: Array<{
    last_name: string;
    first_name: string;
    middle_name: string | null;
    full_name: string;
    precinct_number: string;
    address: string;
    application_number: string | null;
  }>;
  sample: Array<{
    last_name: string;
    first_name: string;
    middle_name: string | null;
    full_name: string;
    precinct_number: string;
    address: string;
    application_number: string | null;
  }>;
}

export interface VoterImportResult {
  message: string;
  total: number;
  matched: number;
  imported_at: string;
}

// ── KP Cases (Katarungang Pambarangay) ───────────────────────────────────

export interface KpCaseParty {
  id: string;
  case_id: string;
  resident_id: string | null;
  party_type: "complainant" | "respondent" | "witness";
  party_mode: "individual" | "group";
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  full_name: string;
  address: string | null;
  mobile_number: string | null;
  created_at: string;
}

export interface KpCaseHearing {
  id: string;
  case_id: string;
  hearing_type: "mediation" | "conciliation" | "arbitration";
  hearing_date: string;
  hearing_time: string | null;
  venue: string | null;
  minutes: string | null;
  attendees: Array<{ name: string; role?: string }> | null;
  outcome: string | null;
  next_hearing_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface KpCaseListItem {
  id: string;
  case_number: string;
  filing_date: string;
  case_level: "mediation" | "conciliation" | "arbitration";
  nature: string;
  nature_of_complaint: string;
  rpc_article: string | null;
  case_description: string | null;
  status: string;
  remarks: string | null;
  mediation_deadline: string | null;
  conciliation_deadline: string | null;
  conciliation_extended_deadline: string | null;
  settlement_date: string | null;
  cfa_date: string | null;
  certification_to_file_action: boolean;
  created_at: string;
  parties: KpCaseParty[];
}

export interface KpCaseDetail extends KpCaseListItem {
  complainant_type: string;
  respondent_type: string;
  presiding_officer_id: string | null;
  lupon_secretary_id: string | null;
  pangkat_chairman_id: string | null;
  pangkat_members: Array<{ official_id: string; name: string }> | null;
  first_meeting_date: string | null;
  pangkat_constituted_date: string | null;
  pangkat_convene_date: string | null;
  action_taken: string | null;
  settlement_text: string | null;
  arbitration_award: string | null;
  arbitration_date: string | null;
  repudiation_deadline: string | null;
  execution_date: string | null;
  certification_to_file_action: boolean;
  cfa_reason: string | null;
  blockchain_hash: string | null;
  hearings: KpCaseHearing[];
}

// ── Blotter Records ───────────────────────────────────────────────────────

export type BlotterStatus = 'filed' | 'for_hearing' | 'for_subpoena' | 'settled' | 'closed';

export interface BlotterRecord {
  id: string;
  blotter_number: string;
  filing_date: string;
  incident_type: string;
  incident_date: string | null;
  incident_time: string | null;
  incident_place: string | null;
  narrative: string;
  resolution: string | null;
  complainant_name: string;
  complainant_address: string | null;
  complainant_mobile: string | null;
  complainant_resident_id: string | null;
  respondent_name: string;
  respondent_address: string | null;
  respondent_mobile: string | null;
  respondent_resident_id: string | null;
  officer_on_duty_id: string | null;
  status: BlotterStatus;
  linked_kp_case_id: string | null;
  attachment_file_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BlotterStats {
  total: number;
  filed: number;
  for_hearing: number;
  for_subpoena: number;
  settled: number;
  closed: number;
  active: number;
  this_month: number;
}

// ── Platform Updates ──────────────────────────────────────────────────────

export interface PlatformUpdate {
  id: string;
  type: "feature" | "improvement" | "bugfix" | "security" | "maintenance";
  category: string | null;
  version: string | null;
  title: string;
  description: string;
  icon: string | null;
  badge_color: string | null;
  is_published: boolean;
  is_breaking: boolean;
  published_at: string;
  commit_hash: string | null;
  author: string | null;
  created_at: string;
}
