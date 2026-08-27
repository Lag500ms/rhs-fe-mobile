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
  if (!p.housingStatus) gaps.push('Chưa khai thực trạng nhà ở.');
  if (p.housingStatus?.toUpperCase() === 'SMALL_HOUSE') {
    if (p.averageHousingAreaPerPerson == null) {
      gaps.push('Nhà chật hẹp bắt buộc nhập diện tích bình quân đầu người.');
    } else if (p.averageHousingAreaPerPerson >= 10) {
      gaps.push('Diện tích bình quân phải dưới 10 m²/người (Điều 29).');
    }
  }
  if (p.maritalStatus?.toUpperCase() === 'MARRIED') {
    const hasSpouse = (p.householdMembers || []).some(
      (m) => m.relationship?.toUpperCase() === 'SPOUSE',
    );
    if (!hasSpouse) gaps.push('Hộ gia đình chưa có thành viên vợ/chồng.');
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
  const personal = !!(
    p.maritalStatus &&
    p.housingStatus &&
    (p.housingStatus !== 'SMALL_HOUSE' || p.averageHousingAreaPerPerson != null) &&
    (p.maritalStatus !== 'MARRIED' || p.spouseFullName)
  );
  const household =
    p.maritalStatus !== 'MARRIED' ||
    (p.householdMembers || []).some((m) => m.relationship?.toUpperCase() === 'SPOUSE');
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
