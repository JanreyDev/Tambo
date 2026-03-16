/**
 * BCMP tenant API functions.
 *
 * All BCMP requests go through primex-api (api.primex.ventures),
 * which proxies them server-side to bcmp-api. The founder dashboard
 * only talks to one API using the existing founder auth token.
 */

import { api, ApiError } from "./api";

// Re-export ApiError for backward compat in the tenants page
export { ApiError as BcmpApiError };

// ── Types ──

export interface BarangayListItem {
  id: string;
  name: string;
  psgc_code: string;
  full_address: string | null;
  municipality_psgc: string | null;
  province_psgc: string | null;
  region_psgc: string | null;
  logo_url: string | null;
  seal_url: string | null;
  status: "active" | "suspended" | "deactivated";
  subscription_plan: string;
  subscription_expires_at: string | null;
  users_count: number;
  residents_count: number;
  sms_credit_balance: number;
  ai_credit_balance: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  contact_phone: string | null;
  contact_email: string | null;
  population: number;
  created_at: string;
}

export interface BarangayUser {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  extension_name: string | null;
  full_name: string;
  photo_url: string | null;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
}

export interface BarangayDetail {
  id: string;
  name: string;
  psgc_code: string;
  full_address: string | null;
  municipality_psgc: string | null;
  province_psgc: string | null;
  region_psgc: string | null;
  logo_url: string | null;
  seal_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number;
  land_area_hectares: number;
  officials_term: string | null;
  status: "active" | "suspended" | "deactivated";
  subscription_plan: string;
  subscription_expires_at: string | null;
  sms_credit_balance: number;
  call_credit_balance: number;
  map_credit_balance: number;
  ai_credit_balance: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  users_count: number;
  residents_count: number;
  settings: Record<string, unknown>;
  users: BarangayUser[];
  created_at: string;
  updated_at: string;
}

export interface BarangayStats {
  residents: {
    total: number;
    active: number;
    inactive: number;
    deceased: number;
    transferred: number;
    gender_distribution: Record<string, number>;
    age_groups: Record<string, number>;
    voters: number;
    resident_voters: number;
    recent_7d: number;
    registration_trend: Record<string, number>;
  };
  records: {
    households: number;
    establishments: number;
    lots_buildings: number;
  };
  documents: {
    total_issued: number;
    this_month: number;
    templates: number;
  };
  judicial: {
    blotters: number;
    pending_blotters: number;
    kp_cases: number;
    active_kp_cases: number;
    vawc_cases: number;
  };
  officials: {
    total: number;
    tanods: number;
    incident_reports: number;
  };
  finance: {
    budgets: number;
    disbursements: number;
    payments: number;
  };
  hris: {
    employees: number;
  };
  assets: {
    total_assets: number;
    inventory_items: number;
  };
  disaster: {
    hazard_pins: number;
    evacuations: number;
  };
  public_portal: {
    complaints: number;
  };
  storage: {
    used_bytes: number;
    limit_bytes: number;
    total_files: number;
    total_file_bytes: number;
    by_category: Record<string, { count: number; bytes: number }>;
  };
  credits: {
    sms_balance: number;
    ai_balance: number;
    call_balance: number;
    map_balance: number;
    sms_this_month: {
      total: number;
      sent: number;
      failed: number;
      cost: number;
    };
  };
  recent_activity: Array<{
    type: string;
    description: string;
    status: string | null;
    created_at: string;
  }>;
  recent_sign_ins: Array<{
    user: string | null;
    action: string;
    device_type: string | null;
    ip_address: string | null;
    created_at: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Baybayin subscription tier names */
export type SubscriptionTier = "munti" | "gitna" | "malaki";

export const SUBSCRIPTION_TIERS: Record<
  SubscriptionTier,
  { baybayin: string; label: string; description: string; storage: string }
> = {
  munti: {
    baybayin: "\u170B\u1713\u1708\u0302\u1706\u1712",
    label: "Munti",
    description: "Small barangay tier - up to 5 GB storage",
    storage: "5 GB",
  },
  gitna: {
    baybayin: "\u1704\u1712\u1706\u0302\u1708",
    label: "Gitna",
    description: "Medium barangay tier - up to 15 GB storage",
    storage: "15 GB",
  },
  malaki: {
    baybayin: "\u170B\u170E\u1703\u1712",
    label: "Malaki",
    description: "Large barangay tier - up to 50 GB storage",
    storage: "50 GB",
  },
};

// ── PSGC Types ──

export interface PsgcProvince {
  psgc_code: string;
  name: string;
  region_psgc: string;
}

export interface PsgcCity {
  psgc_code: string;
  name: string;
  city_class: string | null;
  zip_code: string | null;
}

export interface PsgcBarangay {
  psgc_code: string;
  name: string;
  population: number | null;
  population_year: number | null;
}

export type OnboardRole = "kapitan" | "secretary" | "treasurer" | "councilor";

export interface CreateBarangayPayload {
  name: string;
  psgc_code: string;
  municipality_psgc?: string;
  province_psgc?: string;
  region_psgc?: string;
  full_address?: string;
  city_municipality?: string;
  province?: string;
  population?: number;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  subscription_plan: SubscriptionTier;
  kapitan: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    extension_name?: string;
    phone: string;
    role?: OnboardRole;
  };
}

// ── API Functions ──
// All routed through /founder/bcmp/tenants on primex-api

export const bcmpApi = {
  tenants: {
    list(params?: Record<string, string>): Promise<PaginatedResponse<BarangayListItem>> {
      return api.get("/founder/bcmp/tenants", { params });
    },

    get(id: string): Promise<{ data: BarangayDetail }> {
      return api.get(`/founder/bcmp/tenants/${id}`);
    },

    create(
      data: CreateBarangayPayload,
    ): Promise<{
      message: string;
      data: {
        barangay: { id: string; name: string; psgc_code: string; status: string; subscription_plan: string };
        initial_user: { id: string; username: string; password?: string; email: string | null; phone: string | null; full_name: string; role: string };
        templates_count: number;
        sms_sent: boolean;
      };
    }> {
      return api.post("/founder/bcmp/tenants", data);
    },

    update(id: string, data: Partial<BarangayDetail>): Promise<{ message: string }> {
      return api.patch(`/founder/bcmp/tenants/${id}`, data);
    },

    deactivate(id: string): Promise<{ message: string }> {
      return api.delete(`/founder/bcmp/tenants/${id}`);
    },

    stats(id: string): Promise<{ data: BarangayStats }> {
      return api.get(`/founder/bcmp/tenants/${id}/stats`);
    },
  },

  subscriptions: {
    stats(): Promise<{
      data: {
        total_barangays: number;
        active_barangays: number;
        tier_distribution: Record<SubscriptionTier, number>;
        tier_details: Record<SubscriptionTier, Array<{
          id: string;
          name: string;
          storage_used_bytes: number;
          storage_limit_bytes: number;
          users_count: number;
          residents_count: number;
          subscription_expires_at: string | null;
        }>>;
        storage: { total_used_bytes: number; total_limit_bytes: number };
        credits: { total_sms: number; total_ai: number; total_call: number; total_map: number };
        expiring_soon: number;
      };
    }> {
      return api.get("/founder/bcmp/subscription-stats");
    },

    pricing(): Promise<{
      data: Record<string, string>;
    }> {
      return api.get("/founder/bcmp/pricing");
    },

    updatePricing(key: string, value: number): Promise<{ message: string }> {
      return api.put(`/founder/bcmp/pricing/${key}`, { value });
    },
  },

  psgc: {
    provinces(): Promise<{ data: PsgcProvince[] }> {
      return api.get("/founder/psgc/provinces");
    },

    cities(provinceCode: string): Promise<{ data: PsgcCity[] }> {
      return api.get(`/founder/psgc/provinces/${provinceCode}/cities`);
    },

    barangays(cityCode: string): Promise<{ data: PsgcBarangay[] }> {
      return api.get(`/founder/psgc/cities/${cityCode}/barangays`);
    },
  },

  documentTemplates: {
    list(params?: {
      search?: string;
      category?: string;
      per_page?: number;
    }): Promise<SystemDocumentTemplateList> {
      const p: Record<string, string> = {
        per_page: String(params?.per_page ?? 100),
        sort_by: "sort_order",
      };
      if (params?.search) p.search = params.search;
      if (params?.category) p.category = params.category;
      return api.get("/founder/bcmp/document-templates", { params: p });
    },

    get(id: string): Promise<SystemDocumentTemplateDetail> {
      return api.get(`/founder/bcmp/document-templates/${id}`);
    },

    create(data: SystemDocumentTemplatePayload): Promise<SystemDocumentTemplateDetail> {
      return api.post("/founder/bcmp/document-templates", data);
    },

    update(id: string, data: Partial<SystemDocumentTemplatePayload>): Promise<SystemDocumentTemplateDetail> {
      return api.patch(`/founder/bcmp/document-templates/${id}`, data);
    },

    delete(id: string): Promise<{ message: string }> {
      return api.delete(`/founder/bcmp/document-templates/${id}`);
    },
  },
};

// ── Document Template types (system-level, barangay_id = null) ──

export interface SystemDocumentTemplateCustomInput {
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  label: string;
  required: boolean;
  options?: string[];
}

export interface SystemDocumentTemplate {
  id: string;
  barangay_id: null;
  name: string;
  category: string;
  constituent_type: "resident" | "establishment" | "lot_building" | "case";
  title: string | null;
  salutation: string | null;
  content: string | null;
  merge_fields: string[] | null;
  custom_inputs: SystemDocumentTemplateCustomInput[] | null;
  custom_tables: Record<string, unknown>[] | null;
  approval_config: {
    left?: { label: string; position: string };
    right?: { label: string; position: string };
  } | null;
  settings: {
    show_qr?: boolean;
    show_ctc?: boolean;
    show_or?: boolean;
    show_doc_no?: boolean;
    show_expiry?: boolean;
    show_photo?: boolean;
    show_thumbmark?: boolean;
    expiry_months?: number;
  } | null;
  status: "active" | "draft" | "archived";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SystemDocumentTemplateList {
  data: SystemDocumentTemplate[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface SystemDocumentTemplateDetail {
  document_template?: SystemDocumentTemplate;
  message?: string;
  // index returns paginated, show returns single wrapped in document_template
  data?: SystemDocumentTemplate[];
}

export type SystemDocumentTemplatePayload = Omit<SystemDocumentTemplate,
  "id" | "barangay_id" | "created_at" | "updated_at">;
