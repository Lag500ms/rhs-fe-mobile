export interface CreateApplicationRequest {
  projectId: string;
  fullName: string;
  citizenId: string;
  occupation?: string;
  workPlace?: string;
  currentResidence: string;
  permanentAddress: string;
  housingStatus: string;
  maritalStatus: string;
  householdMembersCount: number;
  priorityGroup?: string;
}

export interface CreateApplicationResponse {
  applicationId: string;
  applicationStatus: string;
  createdAt: string;
  message: string;
}

export interface ApplicationDocument {
  documentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  verificationStatus: string;
  aiRejectedReason?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface ApplicationSummary {
  applicationId: string;
  projectId: string;
  projectName: string;
  applicantId: string;
  applicantFullName: string;
  citizenId: string;
  applicationStatus: string;
  createdAt: string;
  submittedAt: string | null;
  finalDecisionDate: string | null;
  housingStatus: string;
  maritalStatus: string | null;
  householdMembersCount: number;
  priorityGroup: string | null;
  documentCount: number;
  receiptUrl: string | null;
}

export interface ReviewHistory {
  historyId: string;
  action: string;
  oldStatus: string;
  newStatus: string;
  note: string | null;
  changedAt: string;
  changedBy: string;
  changedByFullName: string;
}

export interface ApplicationDetail {
  applicationId: string;
  applicationStatus: string;
  priorityScore: number;
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string | null;
  finalDecisionDate: string | null;

  projectId: string;
  projectName: string;

  applicantId: string;
  fullName: string;
  citizenId: string;
  occupation: string | null;
  workPlace: string | null;
  currentResidence: string;
  permanentAddress: string;
  housingStatus: string;
  maritalStatus: string | null;
  householdMembersCount: number;
  priorityGroup: string | null;

  officerId: string | null;
  officerFullName: string | null;
  receiptUrl: string | null;

  documents: ApplicationDocument[];
  reviewHistories: ReviewHistory[];
}

export interface PagedResponse<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
}

export interface UploadDocumentResponse {
  documentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  uploadedAt: string;
  verificationStatus?: string;
}

export interface DocumentItem {
  documentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  uploadedAt: string;
  verificationStatus: string;
}

export interface VerificationResultResponse {
  verificationId: string;
  documentId: string;
  validationResult: string;
  extractedFullName: string | null;
  extractedCitizenId: string | null;
  extractedAddress: string | null;
  extractedDateOfBirth: string | null;
  errorDetails: string | null;
  verifiedAt: string;
}
