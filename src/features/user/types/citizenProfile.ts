/** Citizen full profile + household + document vault types (aligned with BE) */

export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED';
export type HousingStatus = 'NO_HOUSE' | 'SMALL_HOUSE';
export type DependentReason = 'UNDER_18' | 'STUDENT' | 'DISABLED' | 'ELDERLY' | 'OTHER';
export type HouseholdRelationship =
  | 'SPOUSE'
  | 'CHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'GRANDPARENT'
  | 'GRANDCHILD'
  | 'OTHER';

export interface UserHouseholdMemberDto {
  memberId: string;
  userId: string;
  fullName: string;
  citizenId?: string | null;
  dateOfBirth?: string | null;
  relationship: string;
  occupation?: string | null;
  monthlyIncome?: number | null;
  isDependent: boolean;
  dependentReason?: string | null;
  dependentReasonLabel?: string | null;
  hasMeritService: boolean;
  meritDetails?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserDocumentDto {
  documentId: string;
  userId: string;
  documentType: string;
  documentTypeLabel: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  description?: string | null;
  verificationStatus: string;
  uploadedAt: string;
}

export interface CitizenFullProfileDto {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  citizenId?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  role: string;
  profileImageUrl?: string | null;

  isEkycVerified: boolean;
  ekycVerifiedAt?: string | null;
  gender?: string | null;
  nationality?: string | null;
  placeOfOrigin?: string | null;
  idIssueDate?: string | null;
  idIssuePlace?: string | null;

  maritalStatus?: MaritalStatus | string | null;
  maritalStatusLabel?: string | null;
  spouseFullName?: string | null;
  spouseCitizenId?: string | null;
  spouseDateOfBirth?: string | null;
  spouseMonthlyIncome?: number | null;

  occupation?: string | null;
  workPlace?: string | null;
  currentResidence?: string | null;
  permanentAddress?: string | null;
  monthlyIncome?: number | null;

  housingStatus?: HousingStatus | string | null;
  averageHousingAreaPerPerson?: number | null;
  priorityGroup?: string | null;
  priorityGroupLabel?: string | null;

  householdMembersCount: number;
  dependentMembersCount: number;
  countableHouseholdIncome: number;
  householdMembers: UserHouseholdMemberDto[];
  documents: UserDocumentDto[];
  requiredDocumentTypes: string[];
  missingDocumentTypes: string[];

  createdAt: string;
  updatedAt?: string | null;
}

export interface UpdateCitizenProfileDto {
  phoneNumber?: string;
  maritalStatus?: string;
  spouseFullName?: string | null;
  spouseCitizenId?: string | null;
  spouseDateOfBirth?: string | null;
  spouseMonthlyIncome?: number | null;
  occupation?: string | null;
  workPlace?: string | null;
  currentResidence?: string | null;
  permanentAddress?: string | null;
  monthlyIncome?: number | null;
  housingStatus?: string;
  averageHousingAreaPerPerson?: number | null;
  priorityGroup?: string | null;
}

export interface UserHouseholdMemberRequestDto {
  fullName: string;
  citizenId?: string;
  dateOfBirth?: string;
  relationship: string;
  occupation?: string;
  monthlyIncome?: number | null;
  isDependent?: boolean;
  dependentReason?: string;
  hasMeritService?: boolean;
  meritDetails?: string;
  note?: string;
}

export interface UploadUserDocumentParams {
  documentType: string;
  uri: string;
  fileName: string;
  mimeType: string;
  description?: string;
}

export const MARITAL_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'SINGLE', label: 'Độc thân' },
  { value: 'MARRIED', label: 'Đã kết hôn' },
  { value: 'DIVORCED', label: 'Đã ly hôn' },
];

export const HOUSING_OPTIONS: { value: HousingStatus; label: string }[] = [
  { value: 'NO_HOUSE', label: 'Chưa có nhà ở thuộc sở hữu' },
  { value: 'SMALL_HOUSE', label: 'Nhà ở chật hẹp (dưới 10 m²/người)' },
];

export const RELATIONSHIP_OPTIONS: { value: HouseholdRelationship; label: string }[] = [
  { value: 'SPOUSE', label: 'Vợ / Chồng' },
  { value: 'CHILD', label: 'Con' },
  { value: 'PARENT', label: 'Cha / Mẹ' },
  { value: 'SIBLING', label: 'Anh / Chị / Em' },
  { value: 'GRANDPARENT', label: 'Ông / Bà' },
  { value: 'GRANDCHILD', label: 'Cháu' },
  { value: 'OTHER', label: 'Khác' },
];

export const DEPENDENT_REASON_OPTIONS: { value: DependentReason; label: string }[] = [
  { value: 'UNDER_18', label: 'Con dưới 18 tuổi' },
  { value: 'STUDENT', label: 'Học sinh / Sinh viên' },
  { value: 'DISABLED', label: 'Mất sức lao động / Khuyết tật' },
  { value: 'ELDERLY', label: 'Người già hết tuổi lao động' },
  { value: 'OTHER', label: 'Khác' },
];

export const PROFILE_DOC_GROUPS: {
  key: string;
  title: string;
  types: { code: string; label: string }[];
}[] = [
  {
    key: 'identity',
    title: 'Định danh',
    types: [
      { code: 'CITIZEN_ID_FRONT', label: 'CCCD - Mặt trước' },
      { code: 'CITIZEN_ID_BACK', label: 'CCCD - Mặt sau' },
    ],
  },
  {
    key: 'marital',
    title: 'Hôn nhân',
    types: [
      { code: 'MARRIAGE_CERTIFICATE', label: 'Giấy chứng nhận kết hôn' },
      { code: 'SINGLE_STATUS_CERTIFICATE', label: 'Giấy xác nhận tình trạng độc thân' },
      { code: 'DIVORCE_CERTIFICATE', label: 'Quyết định ly hôn' },
    ],
  },
  {
    key: 'income',
    title: 'Thu nhập',
    types: [{ code: 'INCOME_CERTIFICATE', label: 'Giấy xác nhận / bảng lương / sao kê' }],
  },
  {
    key: 'housing',
    title: 'Điều kiện nhà ở',
    types: [{ code: 'HOUSING_CONDITION_PROOF', label: 'Giấy xác nhận điều kiện nhà ở' }],
  },
  {
    key: 'dependent',
    title: 'Người phụ thuộc',
    types: [{ code: 'DEPENDENT_PROOF', label: 'Giấy tờ chứng minh người phụ thuộc' }],
  },
];

export function getRelationshipLabel(value: string): string {
  return RELATIONSHIP_OPTIONS.find((o) => o.value === value)?.label || value;
}

export function getDependentReasonLabel(value?: string | null): string {
  if (!value) return '';
  return DEPENDENT_REASON_OPTIONS.find((o) => o.value === value)?.label || value;
}

export function formatVnd(amount?: number | null): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
}

export function calcAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
