import { getToken } from '../../lib/tokenStorage';
import { userApi } from '../user/api/userApi';
import type { UserProfileDto } from '../user/types/user';

/**
 * Đồng bộ quy tắc web: đã eKYC khi có CCCD trên profile
 * (hoặc cờ isCitizenIdVerified nếu BE bổ sung sau).
 */
export function isEkycVerified(user?: UserProfileDto | null): boolean {
  if (!user) return false;
  const flag = (user as UserProfileDto & { isCitizenIdVerified?: boolean }).isCitizenIdVerified;
  if (typeof flag === 'boolean') return flag;
  return !!(user.citizenId && user.citizenId.trim());
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
