export interface CreateApplicationRequest {
  projectId: string;
  /** Mặc định true: BE lấy nhân thân, hộ, giấy tờ từ hồ sơ công dân */
  autoFillFromProfile?: boolean;
  inheritDocumentsFromVault?: boolean;
  fullName?: string;
  citizenId?: string;
  occupation?: string;
  workPlace?: string;
  currentResidence?: string;
  permanentAddress?: string;
  housingStatus?: string;
  maritalStatus?: string;
  priorityGroup?: string;
  monthlyIncome?: number;
  spouseMonthlyIncome?: number;
  averageHousingAreaPerPerson?: number;
  desiredApartmentTypeId?: string;
  desiredApartmentType?: string;
  householdMembers?: Array<{
    fullName: string;
    citizenId?: string;
    dateOfBirth?: string;
    relationship: string;
    occupation?: string;
    monthlyIncome?: number | null;
    isDependent?: boolean;
    dependentReason?: string;
    note?: string;
  }>;
}

export interface UpdateApplicationRequest {
  fullName: string;
  citizenId: string;
  occupation?: string;
  workPlace?: string;
  currentResidence: string;
  permanentAddress: string;
  housingStatus: string;
  maritalStatus: string;
  priorityGroup: string;
  monthlyIncome?: number;
  spouseMonthlyIncome?: number;
  averageHousingAreaPerPerson?: number;
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

export interface RequiredDocumentItem {
  documentType: string;
  label: string;
  subtitle?: string;
  isUploaded?: boolean;
  documentId?: string | null;
}

export interface RequiredDocumentsResponse {
  priorityGroup?: string | null;
  requiredDocuments: RequiredDocumentItem[];
}

/** Đồng bộ LookupController.GetPriorityGroups */
export interface PriorityGroupItem {
  code: string;
  label: string;
  requiresIncomeCertificate?: boolean;
  isPovertyGroup?: boolean;
  requiredDocumentType?: string | null;
  requiredDocumentLabel?: string | null;
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

export interface EligibilityResult {
  assessmentId: string;
  applicationId?: string | null;
  eligible: boolean;
  estimatedScore: number;
  priorityGroupCheckPassed?: boolean;
  incomeCheckPassed?: boolean;
  housingAreaCheckPassed?: boolean;
  totalHouseholdIncome?: number | null;
  maxAllowedIncome?: number | null;
  calculatedAverageArea?: number | null;
  maxAllowedAreaPerPerson?: number | null;
  summaryMessage?: string;
  reasons: string[];
  assessmentDate: string;
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
  receiptUrl: string | null;
  slotCode?: string | null;
  lotteryResult?: string | null;
  apartmentId?: string | null;
  apartmentUnitName?: string | null;
  apartmentArea?: number | null;
  apartmentPrice?: number | null;
  apartmentStatus?: string | null;
  monthlyIncome?: number | null;
  spouseMonthlyIncome?: number | null;
  averageHousingAreaPerPerson?: number | null;
  eligibility?: EligibilityResult | null;

  officerId: string | null;
  officerFullName: string | null;

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
