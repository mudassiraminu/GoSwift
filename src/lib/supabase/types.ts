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

export type RequestStatus =
  | "draft"
  | "open"
  | "quoted"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled";

export type QuoteStatus = "pending" | "accepted" | "rejected" | "expired" | "withdrawn";

export type DeliveryStatus =
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "confirmed"
  | "failed"
  | "cancelled";

export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "on_hold";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  created_at: string;
  updated_at: string;
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
};

export type Business = {
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
};

export type DeliveryProvider = {
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
};

export type ProviderVerificationDocument = {
  id: string;
  provider_id: string;
  doc_type: string;
  file_path: string;
  status: DocStatus;
  reviewer_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ProviderServiceArea = {
  id: string;
  provider_id: string;
  country: string | null;
  city: string;
  area: string | null;
  created_at: string;
};

export type ProviderServiceType = {
  id: string;
  provider_id: string;
  service_type: string;
  base_price: number | null;
  created_at: string;
};

export type Rider = {
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
};

export type DeliveryRequest = {
  id: string;
  customer_id: string;
  business_id: string | null;
  pickup_address: string;
  pickup_city: string | null;
  pickup_contact: string | null;
  pickup_phone: string | null;
  dropoff_address: string;
  dropoff_city: string | null;
  dropoff_contact: string | null;
  dropoff_phone: string | null;
  package_description: string | null;
  package_weight_kg: number | null;
  service_type: string | null;
  scheduled_for: string | null;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

export type DeliveryQuote = {
  id: string;
  request_id: string;
  provider_id: string;
  amount: number;
  currency: string;
  eta_minutes: number | null;
  message: string | null;
  status: QuoteStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Delivery = {
  id: string;
  request_id: string;
  quote_id: string | null;
  provider_id: string;
  rider_id: string | null;
  customer_id: string;
  status: DeliveryStatus;
  tracking_code: string | null;
  proof_path: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DeliveryStatusHistory = {
  id: string;
  delivery_id: string;
  status: DeliveryStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  delivery_id: string | null;
  request_id: string | null;
  customer_id: string;
  amount: number;
  currency: string;
  provider_amount: number | null;
  commission_amount: number | null;
  status: PaymentStatus;
  gateway: string | null;
  gateway_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Payout = {
  id: string;
  provider_id: string;
  payment_id: string | null;
  amount: number;
  currency: string;
  status: PayoutStatus;
  reference: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CommissionRule = {
  id: string;
  name: string;
  percentage: number;
  flat_fee: number;
  service_type: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Rating = {
  id: string;
  delivery_id: string;
  rater_id: string;
  provider_id: string | null;
  score: number;
  created_at: string;
};

export type Review = {
  id: string;
  rating_id: string | null;
  provider_id: string | null;
  author_id: string;
  title: string | null;
  body: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
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
      delivery_requests: Table<DeliveryRequest>;
      delivery_quotes: Table<DeliveryQuote>;
      deliveries: Table<Delivery>;
      delivery_status_history: Table<DeliveryStatusHistory>;
      payments: Table<Payment>;
      payouts: Table<Payout>;
      commission_rules: Table<CommissionRule>;
      disputes: Table<Record<string, unknown> & { id: string }>;
      dispute_evidence: Table<Record<string, unknown> & { id: string }>;
      ratings: Table<Rating>;
      reviews: Table<Review>;
      audit_logs: Table<Record<string, unknown> & { id: string }>;
    };
    Views: { [_ in never]: never };
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
      request_status: RequestStatus;
      quote_status: QuoteStatus;
      delivery_status: DeliveryStatus;
      payment_status: PaymentStatus;
      payout_status: PayoutStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
