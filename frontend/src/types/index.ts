export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserSummary;
  roles: string[];
}

export interface UserSummary {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface MeResponse {
  user: UserSummary;
  roles: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  roles: RoleSummary[];
  department?: DepartmentSummary;
  created_at: string;
}

export interface RoleSummary {
  id: string;
  name: string;
  display_name: string;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  department_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: RoleSummary[];
  department?: DepartmentSummary;
}

export interface Document {
  id: string;
  document_number: string;
  title: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_mime?: string;
  mime_type?: string;
  status: string;
  version: number;
  current_version?: number;
  verification_status?: string;
  verified_by?: string;
  verified_at?: string;
  confidentiality?: string;
  retention_type?: string;
  department_id?: string;
  program_id?: string;
  tags: string[];
  created_by: string;
  creator_name?: string;
  uploaded_by?: string;
  responsible_user_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  file_name?: string;
  file_size?: number;
  file_mime?: string;
  change_notes?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
}

export interface Letter {
  id: string;
  letter_type: string;
  agenda_number?: string;
  letter_number?: string;
  letter_date?: string;
  received_date?: string;
  sent_date?: string;
  sender?: string;
  recipient?: string;
  subject: string;
  classification_id?: string;
  attachment_count?: number;
  file_path?: string;
  file_name?: string;
  status: string;
  follow_up_status?: string;
  follow_up_deadline?: string;
  follow_up_notes?: string;
  responsible_user_id?: string;
  department_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LetterAttachment {
  id: string;
  letter_id: string;
  title?: string;
  file_path: string;
  file_name?: string;
  file_size?: number;
  file_mime?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface LetterDisposition {
  id: string;
  letter_id: string;
  from_user_id?: string;
  to_user_id: string;
  instruction?: string;
  priority?: string;
  status?: string;
  read_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  program_type_id?: string;
  program_type_name?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_cost?: number;
  pic_id?: string;
  pic_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  program_id?: string;
  program_name?: string;
  activity_type_id?: string;
  activity_type_name?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  budget?: number;
  actual_cost?: number;
  participant_count?: number;
  pic_id?: string;
  pic_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  partner_type?: string;
  industry?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  website?: string;
  description?: string;
  pipeline_status: string;
  relationship_status?: string;
  internal_notes?: string;
  logo_path?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface PartnerContact {
  id: string;
  partner_id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  notes?: string;
  created_at: string;
}

export interface PartnershipAgreement {
  id: string;
  partner_id: string;
  agreement_number?: string;
  title: string;
  cooperation_type_id?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  file_path?: string;
  file_name?: string;
  reminder_date?: string;
  notes?: string;
  created_at: string;
}

export interface PartnerInteraction {
  id: string;
  partner_id: string;
  interaction_type?: string;
  subject?: string;
  description?: string;
  interaction_date: string;
  user_id?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  created_at: string;
}

export interface PartnerOpportunity {
  id: string;
  partner_id: string;
  opportunity_type?: string;
  title: string;
  description?: string;
  quota?: number;
  deadline?: string;
  status?: string;
  assigned_to?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaAlbum {
  id: string;
  title: string;
  description?: string;
  activity_id?: string;
  program_id?: string;
  album_date?: string;
  cover_image_path?: string;
  is_featured?: boolean;
  status?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  asset_count?: number;
}

export interface MediaAsset {
  id: string;
  album_id?: string;
  activity_id?: string;
  title?: string;
  description?: string;
  media_type: string;
  file_path: string;
  file_name?: string;
  file_size?: number;
  file_mime?: string;
  thumbnail_path?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface Beneficiary {
  id: string;
  nik?: string;
  full_name: string;
  gender?: string;
  birth_date?: string;
  birth_place?: string;
  address?: string;
  phone?: string;
  email?: string;
  education_level?: string;
  occupation?: string;
  income_level?: string;
  family_members?: number;
  status: string;
  notes?: string;
  photo_url?: string;
  registered_date: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  assignee_name?: string;
  created_by: string;
  creator_name?: string;
  program_id?: string;
  program_name?: string;
  activity_id?: string;
  activity_name?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  asset_code: string;
  name: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  location_id?: string;
  location_name?: string;
  acquisition_date?: string;
  acquisition_value?: string;
  condition: string;
  status: string;
  photo_url?: string;
  responsible_person_id?: string;
  responsible_person_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  department_id?: string;
  priority?: string;
  is_pinned?: boolean;
  file_path?: string;
  file_name?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface DashboardOverview {
  total_documents: number;
  total_letters: number;
  total_programs: number;
  total_activities: number;
  total_partners: number;
  total_beneficiaries: number;
  total_tasks: number;
  total_assets: number;
  pending_tasks: number;
  active_programs: number;
  recent_activities: Activity[];
  recent_documents: Document[];
}

export interface Setting {
  id: string;
  key: string;
  value?: string;
  value_type?: string;
  description?: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  head_id?: string;
  head_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
}
