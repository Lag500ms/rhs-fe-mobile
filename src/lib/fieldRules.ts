/** CCCD/CMND: 9 hoặc 12 chữ số (khớp RegularExpression phía máy chủ). */
export const CCCD_PATTERN = /^\d{9}(\d{3})?$/;

export function normalizeCitizenId(value?: string | null): string {
  return (value || '').replace(/\s/g, '');
}

export function isValidCitizenId(value?: string | null): boolean {
  const v = normalizeCitizenId(value);
  return CCCD_PATTERN.test(v);
}

/** Ngày theo YYYY-MM-DD, không cho ngày không tồn tại. */
export function parseDateOnly(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function isFutureDateOnly(value?: string | null): boolean {
  const dt = parseDateOnly(value);
  if (!dt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dt.getTime() > today.getTime();
}

export function ageFromDateOnly(value?: string | null): number | null {
  const dob = parseDateOnly(value);
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function parsePositiveNumber(value: string): number | null {
  const n = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Chỉ chữ số — dùng cho tiền VNĐ. Không cho dấu âm, chữ, dấu phẩy. */
export function sanitizeMoneyInput(value: string): string {
  return String(value).replace(/[^\d]/g, '');
}

/** Số không âm, tối đa `maxDecimals` chữ số thập phân — dùng cho diện tích. */
export function sanitizeDecimalInput(value: string, maxDecimals = 2): string {
  const cleaned = String(value).replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  const head = cleaned.slice(0, dot);
  const tail = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, maxDecimals);
  return `${head}.${tail}`;
}

export function maritalAllowsSpouse(status?: string | null): boolean {
  return (status || '').toUpperCase() === 'MARRIED';
}

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 100;
export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
/** Số di động VN 10 chữ số, bắt đầu bằng 0. */
export const VN_MOBILE_PATTERN = /^0\d{9}$/;

export function isValidEmail(value?: string | null): boolean {
  return EMAIL_PATTERN.test((value || '').trim());
}

export function sanitizePhoneInput(value: string): string {
  return String(value).replace(/\D/g, '').slice(0, 10);
}

export function isValidVnMobile(value?: string | null): boolean {
  return VN_MOBILE_PATTERN.test((value || '').trim());
}

/** Lỗi mật khẩu mới, hoặc null nếu hợp lệ. */
export function newPasswordError(password: string): string | null {
  if (!password) return 'Vui lòng nhập mật khẩu';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Mật khẩu không được quá ${MAX_PASSWORD_LENGTH} ký tự`;
  }
  return null;
}

/** Trần thu nhập điều kiện: độc thân 15 triệu; vợ chồng cộng 30 triệu. */
export const MAX_SINGLE_INCOME = 15_000_000;
export const MAX_COUPLE_INCOME = 30_000_000;

/**
 * Nhà chật hẹp: diện tích bình quân phải dưới 15 m² sàn/người (Đ29.2 Nghị định 100/2024).
 * Trần thật do BE quyết định qua PolicyConfig MAX_AREA_PER_PERSON_M2; hằng số này chỉ để
 * chặn sớm và hiển thị, nên phải khớp mặc định của BE — lệch xuống 10 sẽ chặn oan người dân
 * có 10–15 m²/người mà BE vẫn nhận.
 */
export const MAX_SMALL_HOUSE_AREA = 15;
