export type UserRole = 'USER' | 'LAND_OWNER' | 'FARMER' | 'INVESTOR' | 'LEGAL_ADVISOR' | 'ADMIN' | 'SUPER_ADMIN';

export type LandType = 'AGRICULTURAL' | 'GRAZING' | 'ARABLE' | 'IRRIGATED' | 'GREENHOUSE' | 'ORCHARD' | 'OTHER';

export type OfferType = 'FOR_RENT' | 'FOR_PARTNERSHIP' | 'FOR_INVESTMENT' | 'NONE';

export type VerificationStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO' | 'UNVERIFIED';

export type RequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVISION';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING_SIGNATURE';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type ReportType = 'INCORRECT_LAND' | 'SUSPICIOUS_DOC' | 'FALSE_INFO' | 'SUSPICIOUS_ACCOUNT' | 'INAPPROPRIATE_CONTENT' | 'FRAUD_ATTEMPT' | 'OTHER';

export type NotificationType = 'ACCOUNT_APPROVED' | 'REQUEST_UPDATE' | 'LAND_APPROVED' | 'LAND_REJECTED' | 'DOC_UPDATE' | 'NEW_MESSAGE' | 'CONTRACT_UPDATE' | 'CONTRACT_EXPIRING' | 'LEGAL_REPLY' | 'ADMIN_ALERT';

export type LegalServiceType = 'PROPERTY_CONSULTATION' | 'DOC_REVIEW' | 'RENT_CONTRACT_HELP' | 'PARTNERSHIP_CONTRACT_HELP' | 'LEGAL_GUIDANCE' | 'DISPUTE_REPORT';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type ConversationType = 'INVESTMENT' | 'RENTAL' | 'PARTNERSHIP' | 'GENERAL' | 'LEGAL';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  wilaya: string | null;
  commune: string | null;
  bio: string | null;
  experience: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Land {
  id: string;
  owner_id: string;
  name: string;
  wilaya: string;
  commune: string;
  area: number;
  land_type: LandType;
  offer_type: OfferType;
  verification_status: VerificationStatus;
  description: string | null;
  agricultural_info: string | null;
  price: number | null;
  latitude: number | null;
  longitude: number | null;
  is_published: boolean;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandImage {
  id: string;
  land_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface LandDocument {
  id: string;
  land_id: string;
  doc_type: string;
  doc_url: string;
  doc_name: string;
  verification_status: DocumentStatus;
  created_at: string;
}

export interface InvestmentRequest {
  id: string;
  land_id: string;
  requester_id: string;
  investment_type: string;
  duration_months: number | null;
  project_description: string | null;
  budget: number | null;
  experience: string | null;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface RentalRequest {
  id: string;
  land_id: string;
  requester_id: string;
  proposed_terms: string | null;
  duration_months: number | null;
  budget: number | null;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface PartnershipRequest {
  id: string;
  land_id: string;
  requester_id: string;
  proposed_terms: string | null;
  duration_months: number | null;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  land_id: string;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  terms: string | null;
  status: ContractStatus;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractParty {
  id: string;
  contract_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface Project {
  id: string;
  land_id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  update_text: string;
  created_by: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  related_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface LegalService {
  id: string;
  type: LegalServiceType;
  title: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface LegalRequest {
  id: string;
  user_id: string;
  service_type: LegalServiceType;
  description: string;
  land_id: string | null;
  priority: Priority;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  land_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  report_type: ReportType;
  target_type: string;
  target_id: string;
  description: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  target_type: string;
  target_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  related_type: string | null;
  related_id: string | null;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
