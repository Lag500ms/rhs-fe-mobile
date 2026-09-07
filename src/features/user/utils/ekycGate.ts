import { MAX_SMALL_HOUSE_AREA, maritalAllowsSpouse } from '../../../lib/fieldRules';
import { getToken } from '../../../lib/tokenStorage';
import { userApi } from '../api/userApi';
import type { UserProfileDto } from '../types/user';
import type { CitizenFullProfileDto } from '../types/citizenProfile';

/**
 * Đã eKYC khi BE báo isEkycVerified HOẶC đã có CCCD
 * (mobile eKYC hiện ghi CCCD qua PUT /profile, không set cờ IsEkycVerified).
 */
export function isEkycVerified(
  user?: UserProfileDto | CitizenFullProfileDto | null,
): boolean {
  if (!user) return false;
  const anyUser = user as UserProfileDto &
    CitizenFullProfileDto & { isCitizenIdVerified?: boolean };
  if (typeof anyUser.isEkycVerified === 'boolean' && anyUser.isEkycVerified) return true;
  if (typeof anyUser.isCitizenIdVerified === 'boolean' && anyUser.isCitizenIdVerified)
    return true;
  const cid = anyUser.citizenId;
  return !!(cid && cid.trim());
}

/** Đủ dữ liệu để điền form tạo hồ sơ (CCCD + họ tên + địa chỉ). */
export function isReadyForApplicationForm(user?: UserProfileDto | null): boolean {
  if (!isEkycVerified(user)) return false;
  return !!(user?.fullName?.trim() && user?.address?.trim());
}

/**
 * Hard gate trước khi đăng ký hồ sơ.
 * @returns profile nếu đã eKYC; null nếu chưa (caller hiện Alert).
 */
export async function ensureEkycForApplication(): Promise<UserProfileDto | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const profileRes = await userApi.getProfile();
    if (!profileRes?.success || !profileRes.user) return null;
    if (!isEkycVerified(profileRes.user)) return null;
    return profileRes.user;
  } catch {
    return null;
  }
}

export function getCitizenProfileReadyGaps(p?: CitizenFullProfileDto | null): string[] {
  if (!p) return ['Không tải được hồ sơ công dân.'];
  const gaps: string[] = [];
  if (!isEkycVerified(p)) gaps.push('Chưa xác minh danh tính (eKYC).');
  if (!p.fullName?.trim()) gaps.push('Thiếu họ và tên.');
  if (!p.citizenId?.trim()) gaps.push('Thiếu số căn cước công dân.');
  if (!p.maritalStatus) gaps.push('Chưa khai tình trạng hôn nhân.');
  if (p.maritalStatus?.toUpperCase() === 'MARRIED' && !p.spouseFullName?.trim()) {
    gaps.push('Đã kết hôn nhưng chưa khai họ tên vợ/chồng.');
  }
  const hasSpouse = (p.householdMembers || []).some(
    (m) => m.relationship?.toUpperCase() === 'SPOUSE',
  );
  if (p.maritalStatus?.toUpperCase() === 'MARRIED' && !hasSpouse) {
    gaps.push('Hộ gia đình chưa có thành viên vợ/chồng.');
  }
  if (p.maritalStatus && p.maritalStatus.toUpperCase() !== 'MARRIED' && hasSpouse) {
    gaps.push('Độc thân / ly hôn / góa không được khai vợ/chồng trong hộ.');
  }
  if (!p.occupation?.trim()) gaps.push('Chưa khai nghề nghiệp.');
  if (!p.workPlace?.trim()) gaps.push('Chưa khai nơi làm việc.');
  if (!p.currentResidence?.trim() && !p.address?.trim()) gaps.push('Chưa khai chỗ ở hiện tại.');
  if (p.monthlyIncome != null && p.monthlyIncome < 0) gaps.push('Thu nhập không được âm.');
  if (!p.housingStatus) gaps.push('Chưa khai thực trạng nhà ở.');
  if (p.housingStatus?.toUpperCase() === 'SMALL_HOUSE') {
    if (p.averageHousingAreaPerPerson == null) {
      gaps.push('Nhà chật hẹp bắt buộc nhập diện tích bình quân đầu người.');
    } else if (p.averageHousingAreaPerPerson >= MAX_SMALL_HOUSE_AREA) {
      gaps.push(`Diện tích bình quân phải dưới ${MAX_SMALL_HOUSE_AREA} m²/người (Đ29.2 Nghị định 100/2024).`);
    }
  }
  return gaps;
}

export function isCitizenProfileReadyForApplication(p?: CitizenFullProfileDto | null): boolean {
  return getCitizenProfileReadyGaps(p).length === 0;
}

export function getCitizenProfileCompleteness(p?: CitizenFullProfileDto | null): {
  identity: boolean;
  personal: boolean;
  household: boolean;
  documents: boolean;
  percent: number;
} {
  if (!p) {
    return { identity: false, personal: false, household: false, documents: false, percent: 0 };
  }

  const identity = isEkycVerified(p);
  const hasSpouse = (p.householdMembers || []).some(
    (m) => m.relationship?.toUpperCase() === 'SPOUSE',
  );
  const personal = !!(
    p.maritalStatus &&
    p.housingStatus &&
    p.occupation?.trim() &&
    p.workPlace?.trim() &&
    (p.currentResidence?.trim() || p.address?.trim()) &&
    (p.monthlyIncome == null || p.monthlyIncome >= 0) &&
    (p.housingStatus !== 'SMALL_HOUSE' || p.averageHousingAreaPerPerson != null) &&
    (p.maritalStatus !== 'MARRIED' || p.spouseFullName)
  );
  const household = maritalAllowsSpouse(p.maritalStatus) ? hasSpouse : !hasSpouse;
  const documents = (p.missingDocumentTypes?.length ?? 0) === 0 && personal;

  const flags = [identity, personal, household, documents];
  const done = flags.filter(Boolean).length;
  return {
    identity,
    personal,
    household,
    documents,
    percent: Math.round((done / flags.length) * 100),
  };
}
