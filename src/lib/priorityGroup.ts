/** Nhãn tiếng Việt — khớp CAP/FE và PriorityGroupConstants.Labels. */
export const PRIORITY_GROUP_LABELS: Record<string, string> = {
  MERIT_PERSON: 'Người có công với cách mạng',
  RURAL_POOR: 'Hộ nghèo nông thôn',
  RURAL_NEAR_POOR: 'Hộ cận nghèo nông thôn',
  URBAN_POOR: 'Hộ nghèo đô thị',
  URBAN_NEAR_POOR: 'Hộ cận nghèo đô thị',
  LOW_INCOME_URBAN: 'Người thu nhập thấp tại đô thị',
  LOW_INCOME: 'Người thu nhập thấp tại đô thị',
  URBAN_LOW_INCOME: 'Người thu nhập thấp tại đô thị',
  THU_NHAP_THAP: 'Người thu nhập thấp tại đô thị',
  NGUOI_THU_NHAP_THAP: 'Người thu nhập thấp tại đô thị',
  NGUOI_THU_NHAP_THAP_DO_THI: 'Người thu nhập thấp tại đô thị',
  POOR_HOUSEHOLD: 'Hộ nghèo, cận nghèo',
  WORKER: 'Công nhân, người lao động tại DN/HTX/KCN',
  INDUSTRIAL_PARK_WORKER: 'Công nhân, người lao động tại DN/HTX/KCN',
  MILITARY_PERSONNEL: 'Lực lượng vũ trang, cơ yếu',
  ARMED_FORCES: 'Lực lượng vũ trang, cơ yếu',
  CIVIL_SERVANT: 'Cán bộ, công chức, viên chức',
  PUBLIC_HOUSING_RETURN: 'Đối tượng trả lại nhà công vụ',
  LAND_RECOVERY_AFFECTED: 'Bị thu hồi đất / giải tỏa nhà ở',
};

export function formatPriorityGroup(code: string | null | undefined): string {
  if (!code?.trim()) return '';
  const key = code.trim().toUpperCase();
  if (PRIORITY_GROUP_LABELS[key]) return PRIORITY_GROUP_LABELS[key];
  if (key === 'NONE' || key === 'DEFAULT') return '';
  if (key.includes('LOW_INCOME') || key.includes('THU_NHAP_THAP')) {
    return 'Người thu nhập thấp tại đô thị';
  }
  if (key.includes('MERIT') || key.includes('NGUOI_CO_CONG')) {
    return 'Người có công với cách mạng';
  }
  return code.trim();
}
