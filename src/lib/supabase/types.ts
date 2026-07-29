export type AppRole = "customer" | "provider" | "rider" | "admin";
export type ProviderStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "suspended"
  | "inactive";
export type AccountType = "individual" | "business";
export type RiderStatus = "active" | "inactive" | "suspended";
export type DocStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  registration_no: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryProvider {
  id: string;
  owner_id: string;
  company_name: string;
  logo_url: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  office_address: string | null;
  city: string | null;
  description: string | null;
  delivery_terms: string | null;
  status: ProviderStatus;
  rejection_reason: string | null;
  bank_info: Record<string, unknown> | null;
  avg_rating: number;
  completed_count: number;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderVerificationDocument {
  id: string;
  provider_id: string;
  doc_type: string;
  file_path: string;
  status: DocStatus;
  reviewer_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderServiceArea {
  id: string;
  provider_id: string;
  country: string | null;
  city: string;
  area: string | null;
  created_at: string;
}

export interface ProviderServiceType {
  id: string;
  provider_id: string;
  service_type: string;
  base_price: number | null;
  created_at: string;
}

export interface Rider {
  id: string;
  provider_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  id_document_path: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  status: RiderStatus;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

/** Loose row type for the future-workflow tables (structure lives in schema.sql). */
type PlaceholderRow = Record<string, unknown> & { id: string };

export interface Database {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: Table<Profile>;
      user_roles: Table<UserRoleRow>;
      businesses: Table<Business>;
      delivery_providers: Table<DeliveryProvider>;
      provider_verification_documents: Table<ProviderVerificationDocument>;
      provider_service_areas: Table<ProviderServiceArea>;
      provider_service_types: Table<ProviderServiceType>;
      riders: Table<Rider>;
      notifications: Table<AppNotification>;
      delivery_requests: Table<PlaceholderRow>;
      delivery_quotes: Table<PlaceholderRow>;
      deliveries: Table<PlaceholderRow>;
      delivery_status_history: Table<PlaceholderRow>;
      payments: Table<PlaceholderRow>;
      payouts: Table<PlaceholderRow>;
      commission_rules: Table<PlaceholderRow>;
      disputes: Table<PlaceholderRow>;
      dispute_evidence: Table<PlaceholderRow>;
      ratings: Table<PlaceholderRow>;
      reviews: Table<PlaceholderRow>;
      audit_logs: Table<PlaceholderRow>;
    };
    Views: Record<string, never>;
    Functions: {
      has_role: { Args: { _user_id: string; _role: AppRole }; Returns: boolean };
      my_provider_id: { Args: Record<string, never>; Returns: string | null };
      owns_provider: { Args: { _provider_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      provider_status: ProviderStatus;
      account_type: AccountType;
      rider_status: RiderStatus;
      doc_status: DocStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
