/** Lấy OTP 6 số từ nội dung thông báo (BE: "Mã OTP vào sảnh: 123456"). */
export function extractLotteryJoinCode(text?: string | null): string | null {
  if (!text) return null;
  const labeled =
    text.match(/mã\s*otp[^0-9]{0,24}(\d{6})/i) ??
    text.match(/otp\s*(?:vào sảnh)?[^0-9]{0,24}(\d{6})/i) ??
    text.match(/mã\s*(?:xác thực|vào sảnh)[^0-9]{0,24}(\d{6})/i);
  return labeled?.[1] ?? null;
}

export function stripJoinCodeFromContent(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/mã\s*otp\s*vào sảnh:\s*\d{6}\.?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
