/**
 * Database type definitions mirroring the SQL migrations in /supabase/migrations.
 *
 * Shaped to be compatible with @supabase/supabase-js generics so that queries
 * are fully inferred. When the schema changes, regenerate or update this file to
 * keep the two in lockstep (the migrations are the source of truth).
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// --- Enums (mirror of the SQL enum types) -----------------------------------
export type Species = 'cattle' | 'goat' | 'sheep';
export type AnimalSex = 'male' | 'female' | 'unknown';
export type AnimalStatus =
  | 'active'
  | 'sold'
  | 'deceased'
  | 'transferred'
  | 'reserved'
  | 'quarantine';
export type AcquisitionType = 'born_on_farm' | 'purchased' | 'donated' | 'transferred_in';
export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'approve';
export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';
export type AttendanceState = 'present' | 'absent' | 'late' | 'leave' | 'sick' | 'holiday';
export type MovementType = 'in' | 'out' | 'adjustment';
export type FinanceKind = 'income' | 'expense';
export type QurbanStatus = 'open' | 'active' | 'completed' | 'cancelled' | 'defaulted';
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'refunded';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type BreedingResult = 'pregnant' | 'not_pregnant' | 'aborted' | 'birthed' | 'pending';
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
export type NotificationKind =
  | 'customer'
  | 'payment'
  | 'vaccination'
  | 'birth'
  | 'stock'
  | 'task'
  | 'system';

/** Columns auto-managed by the DB; always optional on insert. */
type Auto = 'id' | 'created_at' | 'updated_at';

/** Keys of T whose type permits null (treated as optional on insert). */
type NullableKeys<T> = { [K in keyof T]-?: null extends T[K] ? K : never }[keyof T];

/**
 * Builds a {Row, Insert, Update, Relationships} table definition from a Row.
 * Auto-managed and nullable columns are optional on insert; all else required.
 * Columns with a server-side default that are NOT NULL stay required (callers
 * pass them explicitly) which keeps inserts honest and type-safe.
 */
type Table<Row> = {
  Row: Row;
  Insert: Omit<Row, (Auto & keyof Row) | NullableKeys<Row>> &
    Partial<Pick<Row, (Auto & keyof Row) | NullableKeys<Row>>>;
  Update: Partial<Row>;
  Relationships: [];
};

type Timestamps = { created_at: string; updated_at: string; deleted_at: string | null };
type Created = { created_at: string };

// --- Row shapes -------------------------------------------------------------

export type OrganizationRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  logo_path: string | null;
  settings: Json;
}

export type BranchRow = Timestamps & {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  is_active: boolean;
}

export type ProfileRow = Timestamps & {
  id: string;
  organization_id: string | null;
  full_name: string;
  email: string;
  avatar_path: string | null;
  phone: string | null;
  locale: string;
  is_super_admin: boolean;
  is_active: boolean;
  last_seen_at: string | null;
}

export type DivisionRow = Timestamps & {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
}

export type PermissionRow = Created & {
  id: string;
  resource: string;
  action: PermissionAction;
  description: string | null;
}

export type RoleRow = Timestamps & {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
}

export type RolePermissionRow = Created & {
  role_id: string;
  permission_id: string;
}

export type UserRoleRow = Created & {
  id: string;
  user_id: string;
  role_id: string;
  branch_id: string | null;
}

export type BreedRow = Created & {
  id: string;
  organization_id: string;
  species: Species;
  name: string;
  description: string | null;
  deleted_at: string | null;
}

export type PenRow = Timestamps & {
  id: string;
  branch_id: string;
  name: string;
  capacity: number | null;
  location: string | null;
}

export type AnimalRow = Timestamps & {
  id: string;
  organization_id: string;
  branch_id: string;
  pen_id: string | null;
  breed_id: string | null;
  ear_tag: string;
  barcode: string | null;
  qr_code: string | null;
  name: string | null;
  species: Species;
  sex: AnimalSex;
  color: string | null;
  birth_date: string | null;
  acquisition: AcquisitionType;
  acquired_at: string | null;
  status: AnimalStatus;
  sire_id: string | null;
  dam_id: string | null;
  current_weight_kg: number | null;
  purchase_price: number | null;
  notes: string | null;
  created_by: string | null;
  is_listed: boolean;
  listing_price: number | null;
  listing_title: string | null;
  listing_description: string | null;
  public_image_url: string | null;
  gallery_urls: string[];
}

export type AnimalMediaRow = Created & {
  id: string;
  animal_id: string;
  storage_path: string;
  kind: 'photo' | 'document' | 'certificate';
  caption: string | null;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  uploaded_by: string | null;
  deleted_at: string | null;
}

export type WeightRecordRow = Created & {
  id: string;
  animal_id: string;
  weight_kg: number;
  measured_at: string;
  method: string | null;
  notes: string | null;
  recorded_by: string | null;
  deleted_at: string | null;
}

export type PriceRecordRow = Created & {
  id: string;
  animal_id: string;
  price: number;
  kind: 'purchase' | 'valuation' | 'listing' | 'sale';
  currency: string;
  effective_at: string;
  notes: string | null;
  recorded_by: string | null;
  deleted_at: string | null;
}

export type OwnershipRecordRow = Created & {
  id: string;
  animal_id: string;
  owner_type: 'farm' | 'customer' | 'qurban' | 'external';
  owner_id: string | null;
  owner_label: string | null;
  transferred_at: string;
  notes: string | null;
  recorded_by: string | null;
  deleted_at: string | null;
}

export type HealthRecordRow = Timestamps & {
  id: string;
  animal_id: string;
  kind: 'vaccination' | 'treatment' | 'disease' | 'checkup' | 'note';
  title: string;
  medicine: string | null;
  dosage: string | null;
  diagnosis: string | null;
  veterinarian: string | null;
  notes: string | null;
  cost: number | null;
  performed_at: string;
  next_due_at: string | null;
  recorded_by: string | null;
}

export type BreedingRecordRow = Timestamps & {
  id: string;
  dam_id: string;
  sire_id: string | null;
  method: 'natural' | 'artificial' | null;
  mated_at: string;
  expected_due_at: string | null;
  checked_at: string | null;
  result: BreedingResult;
  birthed_at: string | null;
  offspring_count: number;
  notes: string | null;
  recorded_by: string | null;
}

export type BreedingOffspringRow = {
  breeding_id: string;
  animal_id: string;
}

export type FeedingRecordRow = Created & {
  id: string;
  branch_id: string;
  animal_id: string | null;
  pen_id: string | null;
  feed_item_id: string | null;
  feed_type: string;
  quantity: number;
  unit: string;
  cost: number | null;
  fed_at: string;
  notes: string | null;
  recorded_by: string | null;
  deleted_at: string | null;
}

export type SupplierRow = Timestamps & {
  id: string;
  organization_id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export type InventoryItemRow = Timestamps & {
  id: string;
  branch_id: string;
  name: string;
  category: 'feed' | 'medicine' | 'vitamin' | 'equipment' | 'other';
  sku: string | null;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number | null;
  supplier_id: string | null;
  expires_at: string | null;
}

export type StockMovementRow = Created & {
  id: string;
  item_id: string;
  type: MovementType;
  quantity: number;
  unit_cost: number | null;
  reference: string | null;
  supplier_id: string | null;
  occurred_at: string;
  notes: string | null;
  recorded_by: string | null;
}

export type CustomerRow = Timestamps & {
  id: string;
  organization_id: string;
  branch_id: string | null;
  full_name: string;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  tags: string[];
  created_by: string | null;
  profile_id: string | null;
}

export type CustomerTransactionRow = Created & {
  id: string;
  customer_id: string;
  animal_id: string | null;
  kind: 'sale' | 'deposit' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  status: PaymentStatus;
  occurred_at: string;
  notes: string | null;
  recorded_by: string | null;
  deleted_at: string | null;
}

export type EmployeeRow = Timestamps & {
  id: string;
  organization_id: string;
  branch_id: string | null;
  profile_id: string | null;
  division_id: string | null;
  employee_code: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  address: string | null;
  salary: number | null;
  hired_at: string | null;
  status: EmployeeStatus;
  avatar_path: string | null;
  notes: string | null;
}

export type AttendanceRecordRow = Created & {
  id: string;
  employee_id: string;
  work_date: string;
  state: AttendanceState;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
  recorded_by: string | null;
  deleted_at: string | null;
}

export type FinanceCategoryRow = Created & {
  id: string;
  organization_id: string;
  name: string;
  kind: FinanceKind;
  color: string;
  deleted_at: string | null;
}

export type FinanceTransactionRow = Timestamps & {
  id: string;
  organization_id: string;
  branch_id: string | null;
  category_id: string | null;
  kind: FinanceKind;
  amount: number;
  currency: string;
  description: string;
  reference: string | null;
  customer_id: string | null;
  animal_id: string | null;
  employee_id: string | null;
  occurred_at: string;
  recorded_by: string | null;
}

export type FinanceAttachmentRow = Created & {
  id: string;
  transaction_id: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  byte_size: number | null;
  uploaded_by: string | null;
  deleted_at: string | null;
}

export type QurbanPlanRow = Timestamps & {
  id: string;
  organization_id: string;
  name: string;
  species: Species;
  target_amount: number;
  installment_amount: number | null;
  period_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export type QurbanEnrollmentRow = Timestamps & {
  id: string;
  plan_id: string;
  customer_id: string;
  animal_id: string | null;
  status: QurbanStatus;
  enrolled_at: string;
  notes: string | null;
}

export type QurbanPaymentRow = Timestamps & {
  id: string;
  enrollment_id: string;
  amount: number;
  status: PaymentStatus;
  paid_at: string;
  method: string | null;
  proof_path: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
}

export type TaskRow = Timestamps & {
  id: string;
  organization_id: string;
  branch_id: string | null;
  title: string;
  description: string | null;
  category: 'vaccination' | 'feeding' | 'cleaning' | 'breeding' | 'pregnancy' | 'operational';
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: string | null;
  animal_id: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_by: string | null;
}

export type CalendarEventRow = Timestamps & {
  id: string;
  organization_id: string;
  branch_id: string | null;
  title: string;
  category: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  source_table: string | null;
  source_id: string | null;
  color: string | null;
  created_by: string | null;
}

export type NotificationRow = Created & {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  metadata: Json;
}

export type CmsArticleRow = Timestamps & {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_path: string | null;
  category: 'article' | 'news' | 'education' | 'page';
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  published_at: string | null;
  author_id: string | null;
}

export type TestimonialRow = Created & {
  id: string;
  organization_id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  avatar_path: string | null;
  rating: number | null;
  is_published: boolean;
  deleted_at: string | null;
}

export type AuditLogRow = Created & {
  id: number;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  branch_id: string | null;
}

export type ActivityEventRow = Created & {
  id: number;
  entity_type: string;
  entity_id: string;
  verb: string;
  summary: string;
  metadata: Json;
  actor_id: string | null;
}

export type ChatConversationRow = {
  id: string;
  organization_id: string;
  visitor_name: string | null;
  visitor_contact: string | null;
  status: 'open' | 'closed';
  last_message_at: string;
  unread_for_agent: number;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  sender: 'visitor' | 'agent';
  body: string;
  author_id: string | null;
  created_at: string;
};

// --- View shapes (public projections) ---------------------------------------

export type CatalogAnimalRow = {
  id: string;
  species: Species;
  sex: AnimalSex;
  title: string;
  listing_description: string | null;
  listing_price: number | null;
  public_image_url: string | null;
  gallery_urls: string[];
  current_weight_kg: number | null;
  color: string | null;
  birth_date: string | null;
  breed_name: string | null;
  status: AnimalStatus;
  created_at: string;
};

export type PublicQurbanPlanRow = {
  id: string;
  name: string;
  species: Species;
  target_amount: number;
  installment_amount: number | null;
  period_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

// --- Database (supabase-js generic) -----------------------------------------

export type Database = {
  public: {
    Tables: {
      organizations: Table<OrganizationRow>;
      branches: Table<BranchRow>;
      profiles: Table<ProfileRow>;
      divisions: Table<DivisionRow>;
      permissions: Table<PermissionRow>;
      roles: Table<RoleRow>;
      role_permissions: Table<RolePermissionRow>;
      user_roles: Table<UserRoleRow>;
      breeds: Table<BreedRow>;
      pens: Table<PenRow>;
      animals: Table<AnimalRow>;
      animal_media: Table<AnimalMediaRow>;
      weight_records: Table<WeightRecordRow>;
      price_records: Table<PriceRecordRow>;
      ownership_records: Table<OwnershipRecordRow>;
      health_records: Table<HealthRecordRow>;
      breeding_records: Table<BreedingRecordRow>;
      breeding_offspring: Table<BreedingOffspringRow>;
      feeding_records: Table<FeedingRecordRow>;
      suppliers: Table<SupplierRow>;
      inventory_items: Table<InventoryItemRow>;
      stock_movements: Table<StockMovementRow>;
      customers: Table<CustomerRow>;
      customer_transactions: Table<CustomerTransactionRow>;
      employees: Table<EmployeeRow>;
      attendance_records: Table<AttendanceRecordRow>;
      finance_categories: Table<FinanceCategoryRow>;
      finance_transactions: Table<FinanceTransactionRow>;
      finance_attachments: Table<FinanceAttachmentRow>;
      qurban_plans: Table<QurbanPlanRow>;
      qurban_enrollments: Table<QurbanEnrollmentRow>;
      qurban_payments: Table<QurbanPaymentRow>;
      tasks: Table<TaskRow>;
      calendar_events: Table<CalendarEventRow>;
      notifications: Table<NotificationRow>;
      cms_articles: Table<CmsArticleRow>;
      testimonials: Table<TestimonialRow>;
      audit_logs: Table<AuditLogRow>;
      activity_events: Table<ActivityEventRow>;
      chat_conversations: Table<ChatConversationRow>;
      chat_messages: Table<ChatMessageRow>;
    };
    Views: {
      catalog_animals: { Row: CatalogAnimalRow; Relationships: [] };
      public_qurban_plans: { Row: PublicQurbanPlanRow; Relationships: [] };
    };
    Functions: {
      has_permission: {
        Args: { resource: string; action: PermissionAction; target_branch?: string };
        Returns: boolean;
      };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      auth_branch_ids: { Args: Record<string, never>; Returns: string[] };
      promote_super_admin: { Args: { user_email: string }; Returns: undefined };
      my_access: { Args: Record<string, never>; Returns: Json };
      touch_last_seen: { Args: Record<string, never>; Returns: undefined };
      chat_start: { Args: { p_name: string; p_contact: string; p_body: string }; Returns: string };
      chat_post: { Args: { p_conversation: string; p_body: string }; Returns: undefined };
      chat_fetch: { Args: { p_conversation: string }; Returns: ChatMessageRow[] };
      chat_close: { Args: { p_conversation: string }; Returns: undefined };
      chat_thread: { Args: { p_conversation: string }; Returns: Json };
      ensure_my_customer: { Args: { p_name: string; p_whatsapp: string }; Returns: string };
      qurban_enroll: { Args: { p_plan: string }; Returns: string };
      qurban_submit_payment: {
        Args: { p_enrollment: string; p_amount: number; p_method: string; p_proof: string };
        Returns: string;
      };
      my_qurban_overview: { Args: Record<string, never>; Returns: Json };
      qurban_pending_payments: { Args: Record<string, never>; Returns: Json };
      qurban_confirm_payment: { Args: { p_id: string; p_approve: boolean }; Returns: undefined };
    };
    Enums: {
      species: Species;
      animal_sex: AnimalSex;
      animal_status: AnimalStatus;
      acquisition_type: AcquisitionType;
      permission_action: PermissionAction;
      employee_status: EmployeeStatus;
      attendance_state: AttendanceState;
      movement_type: MovementType;
      finance_kind: FinanceKind;
      qurban_status: QurbanStatus;
      payment_status: PaymentStatus;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      breeding_result: BreedingResult;
      content_status: ContentStatus;
      notification_kind: NotificationKind;
    };
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience helpers for service code. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
