export type UserRole = "RESIDENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN";

export type ReportStatus =
  | "SUBMITTED"
  | "PENDING_VERIFICATION"
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "RESOLVED"
  | "REOPENED"
  | "CLOSED"
  | "REJECTED";

export type ReportPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SafetyFlag = "NO" | "POSSIBLY" | "URGENT";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ModerationActionType =
  | "APPROVE"
  | "REJECT"
  | "REQUEST_INFO"
  | "MARK_SPAM"
  | "MERGE_DUPLICATE"
  | "FLAG_USER";

export type ModerationFlagType =
  | "SPAM"
  | "PRANK_FAKE"
  | "DUPLICATE"
  | "INCORRECT_CATEGORY"
  | "INVALID_LOCATION"
  | "INAPPROPRIATE"
  | "MISLEADING"
  | "OTHER";

export type VerificationRequestType =
  | "CONFIRM_LOCATION"
  | "RETAKE_PHOTO"
  | "ADD_DETAILS"
  | "GENERAL";

export interface UserProfile {
  id: string;
  name: string;
  email?: string | null;
  role: UserRole;
  phone?: string | null;
  birthDate?: string | null;
  age?: number | null;
  avatar?: string | null;
  preferredLanguage?: "en" | "fil" | "msb";
  isActive: boolean;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  defaultPriority: ReportPriority;
  defaultAgencyId?: string | null;
  defaultAgency?: AgencyItem | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AgencyItem {
  id: string;
  name: string;
  code: string;
  description: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  coverageArea?: string | null;
  isActive: boolean;
}

export interface ReportPhotoItem {
  id: string;
  photoUrl: string;
  photoType: "BEFORE" | "IN_PROGRESS" | "RESOLUTION";
  caption?: string | null;
  uploadedByUserId?: string | null;
  fingerprint?: string | null;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: string;
  actorId?: string | null;
  actor?: { id: string; name: string; role: string } | null;
  previousStatus?: string | null;
  newStatus: ReportStatus;
  note?: string | null;
  isInternal: boolean;
  photoUrl?: string | null;
  createdAt: string;
}

export interface ReportUpdateItem {
  id: string;
  authorId?: string | null;
  author?: { id: string; name: string; role: string } | null;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  referenceNo: string;
  categoryId: string;
  category: CategoryItem;
  residentId: string;
  resident?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  title: string;
  description: string;
  safetyFlag: SafetyFlag;
  priority: ReportPriority;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  locationSource?: string | null;
  locationCapturedAt?: string | null;
  address: string;
  landmark?: string | null;
  assignedAgencyId?: string | null;
  assignedAgency?: AgencyItem | null;
  assignedStaffId?: string | null;
  assignedStaff?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  slaDeadline?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  riskScore?: number | null;
  riskLevel?: RiskLevel | null;
  verificationStatus?: string | null;
  createdAt: string;
  updatedAt: string;
  photos: ReportPhotoItem[];
  statusHistory?: StatusHistoryItem[];
  updates?: ReportUpdateItem[];
  riskAssessment?: RiskAssessmentItem | null;
  moderationActions?: ModerationActionItem[];
  verificationRequests?: VerificationRequestItem[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  reportId?: string | null;
  report?: { id: string; referenceNo: string; title: string } | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: "NORMAL" | "URGENT";
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

// ─── Anti-Abuse System Types ────────────────────────────────────────────────

export interface RiskAssessmentItem {
  id: string;
  reportId: string;
  totalScore: number;
  riskLevel: RiskLevel;
  textScore: number;
  imageScore: number;
  duplicateScore: number;
  locationScore: number;
  behaviorScore: number;
  categoryMismatchScore: number;
  actionTaken: string;
  signals?: string | null;
  summary?: string | null;
  createdAt: string;
}

export interface UserTrustProfileItem {
  id: string;
  userId: string;
  totalReports: number;
  approvedCount: number;
  rejectedCount: number;
  spamCount: number;
  duplicateCount: number;
  trustScore: number;
  cooldownUntil?: string | null;
  lastFlaggedAt?: string | null;
  lastReportAt?: string | null;
}

export interface ModerationActionItem {
  id: string;
  reportId: string;
  moderatorId: string;
  actionType: ModerationActionType;
  flagType?: ModerationFlagType | null;
  reason?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  riskSignalsUsed?: string | null;
  evidence?: string | null;
  createdAt: string;
}

export interface VerificationRequestItem {
  id: string;
  reportId: string;
  requestType: VerificationRequestType;
  message: string;
  status: "PENDING" | "RESPONDED" | "EXPIRED";
  requestedBy: string;
  response?: string | null;
  responsePhotoUrl?: string | null;
  respondedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

