import type { HouseholdMemberRequest } from '../types/household';

/** Draft bước 1 (Cá nhân) — chưa tạo hồ sơ BE cho đến bước Đối tượng */
export type ApplicationDraftPersonal = {
  projectId: string;
  projectName?: string;
  fullName: string;
  citizenId: string;
  permanentAddress: string;
  currentResidence: string;
  occupation?: string;
  workPlace?: string;
  housingStatus: string;
  maritalStatus: string;
  monthlyIncome?: number;
  spouseMonthlyIncome?: number;
  averageHousingAreaPerPerson?: number;
};

export type ApplicationDraftMember = HouseholdMemberRequest & {
  /** id tạm trên client trước khi gọi BE */
  localId: string;
};
