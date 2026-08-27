import apiClient from '../../../lib/apiClient';
import type {
  CitizenFullProfileDto,
  UpdateCitizenProfileDto,
  UserDocumentDto,
  UserHouseholdMemberDto,
  UserHouseholdMemberRequestDto,
  UploadUserDocumentParams,
} from '../types/citizenProfile';
import type { EligibilityResult } from '../../application/types/application';

export interface ApplicationPrefillDto {
  applicantId: string;
  fullName: string;
  citizenId: string;
  phoneNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  isEkycVerified: boolean;
  occupation?: string | null;
  workPlace?: string | null;
  currentResidence: string;
  permanentAddress: string;
  housingStatus: string;
  maritalStatus: string;
  priorityGroup: string;
  monthlyIncome?: number | null;
  spouseMonthlyIncome?: number | null;
  averageHousingAreaPerPerson?: number | null;
  householdMembersCount: number;
  householdMembers: Array<{
    fullName: string;
    citizenId?: string | null;
    dateOfBirth?: string | null;
    relationship: string;
    occupation?: string | null;
    monthlyIncome?: number | null;
    isDependent?: boolean;
    dependentReason?: string | null;
    note?: string | null;
  }>;
  availableVaultDocuments: Array<{
    documentId: string;
    documentType: string;
    documentTypeLabel: string;
    fileName: string;
    fileUrl: string;
    fileSizeBytes: number;
    verificationStatus: string;
  }>;
}

interface ApiWrap<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const citizenProfileApi = {
  getFullProfile: async (): Promise<CitizenFullProfileDto> => {
    const res = await apiClient.get<ApiWrap<CitizenFullProfileDto>>('/users/profile/full');
    return res.data.data;
  },

  updateCitizenProfile: async (dto: UpdateCitizenProfileDto): Promise<CitizenFullProfileDto> => {
    const res = await apiClient.put<ApiWrap<CitizenFullProfileDto>>('/users/profile/citizen', dto);
    return res.data.data;
  },

  getHouseholdMembers: async (): Promise<UserHouseholdMemberDto[]> => {
    const res = await apiClient.get<ApiWrap<UserHouseholdMemberDto[]>>('/users/household-members');
    return res.data.data ?? [];
  },

  addHouseholdMember: async (dto: UserHouseholdMemberRequestDto): Promise<UserHouseholdMemberDto> => {
    const res = await apiClient.post<ApiWrap<UserHouseholdMemberDto>>('/users/household-members', dto);
    return res.data.data;
  },

  updateHouseholdMember: async (
    memberId: string,
    dto: UserHouseholdMemberRequestDto,
  ): Promise<UserHouseholdMemberDto> => {
    const res = await apiClient.put<ApiWrap<UserHouseholdMemberDto>>(
      `/users/household-members/${memberId}`,
      dto,
    );
    return res.data.data;
  },

  deleteHouseholdMember: async (memberId: string): Promise<void> => {
    await apiClient.delete(`/users/household-members/${memberId}`);
  },

  getDocuments: async (): Promise<UserDocumentDto[]> => {
    const res = await apiClient.get<ApiWrap<UserDocumentDto[]>>('/users/documents');
    return res.data.data ?? [];
  },

  uploadDocument: async (params: UploadUserDocumentParams): Promise<UserDocumentDto> => {
    const form = new FormData();
    form.append('DocumentType', params.documentType);
    if (params.description) form.append('Description', params.description);
    form.append('File', {
      uri: params.uri,
      name: params.fileName,
      type: params.mimeType,
    } as any);

    const res = await apiClient.post<ApiWrap<UserDocumentDto>>('/users/documents', form);
    return res.data.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/users/documents/${documentId}`);
  },

  getPrefill: async (): Promise<ApplicationPrefillDto> => {
    const res = await apiClient.get<ApiWrap<ApplicationPrefillDto>>('/users/profile/prefill');
    return res.data.data;
  },

  checkEligibility: async (): Promise<EligibilityResult> => {
    const res = await apiClient.get<ApiWrap<EligibilityResult>>('/users/profile/eligibility-check');
    return res.data.data;
  },
};
