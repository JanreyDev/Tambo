/* -------------------------------------------------------
   Family Vault API response types
   ------------------------------------------------------- */

export interface VaultVerifyResponse {
  message: string;
  data: {
    token: string;
    expires_at: string;
    session_id: string;
  };
}

export interface VaultCategory {
  key: string;
  label: string;
  description: string;
  entry_count: number;
  icon: string;
}

export interface VaultEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  sort_order: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VaultGuideResponse {
  message: string;
  data: {
    entries: VaultEntry[];
  };
}

export interface VaultCategoriesResponse {
  message: string;
  data: {
    categories: VaultCategory[];
  };
}

export interface VaultCategoryEntriesResponse {
  message: string;
  data: {
    category: string;
    label: string;
    entries: VaultEntry[];
  };
}

export interface VaultEntryResponse {
  message: string;
  data: {
    entry: VaultEntry;
  };
}

export interface VaultHeartbeatResponse {
  status: "ok";
  server_time: string;
}
