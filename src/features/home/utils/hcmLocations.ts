/**
 * Địa giới TP.HCM — nguồn provinces.open-api.vn API v2 (không dùng JSON local).
 * v2: Tỉnh → Phường/Xã (không còn quận/huyện).
 */
export {
  HCM_PROVINCE,
  HCM_PROVINCE_SHORT,
  HCM_PROVINCE_CODE,
  fetchHcmWards,
  getCachedHcmWards,
} from '../../../lib/vnProvincesV2';

/** @deprecated Dùng fetchHcmWards() — giữ alias tạm cho import cũ. */
export const HCM_DISTRICTS: string[] = [];
