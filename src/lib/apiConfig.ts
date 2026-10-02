/**
 * Cùng host với web đã deploy (CAP/FE VITE_API_BASE_URL).
 * Mail OTP chỉ gửi được từ API này.
 */
const DEPLOYED_API_BASE_URL = 'https://rhs-backend-api.onrender.com/api';

function isLocalApi(url: string): boolean {
  return /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(url);
}

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';
  if (!fromEnv || isLocalApi(fromEnv)) return DEPLOYED_API_BASE_URL;
  return fromEnv.replace(/\/$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();
