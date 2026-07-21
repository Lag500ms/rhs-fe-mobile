/**
 * Đọc địa giới TP.HCM từ assets JSON (không hardcode danh sách quận).
 * Chuẩn lưu DB / filter API = name_with_type trong file.
 *
 * Lưu ý: code tỉnh trong tinh_thanh.json (HCM = "12") KHÔNG khớp
 * parent_code trong quan_huyen.json (HCM = "79"). Vì vậy chỉ lọc theo
 * path_with_type chứa "Thành phố Hồ Chí Minh" — không dùng parent_code.
 */
import tinhThanh from '../../../../assets/tinh_thanh.json';
import quanHuyen from '../../../../assets/quan_huyen.json';

type TinhEntry = {
  name: string;
  slug: string;
  name_with_type: string;
  code: string;
};

type QuanEntry = {
  name: string;
  name_with_type: string;
  path: string;
  path_with_type: string;
  code: string;
  parent_code: string;
};

function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tìm tỉnh HCM trong tinh_thanh.json theo name/slug (không hardcode code). */
function findHcmProvince(): TinhEntry {
  const entries = Object.values(tinhThanh as Record<string, TinhEntry>);
  const found = entries.find((t) => {
    const n = normalizeKey(t.name);
    const slug = normalizeKey(t.slug ?? '');
    const full = normalizeKey(t.name_with_type ?? '');
    return (
      n === 'ho chi minh' ||
      slug === 'ho-chi-minh' ||
      full.includes('ho chi minh')
    );
  });

  if (!found) {
    throw new Error(
      'Không tìm thấy Thành phố Hồ Chí Minh trong assets/tinh_thanh.json'
    );
  }
  return found;
}

const hcmTinh = findHcmProvince();

/** Province gửi API / lưu DB = name_with_type từ JSON. */
export const HCM_PROVINCE = hcmTinh.name_with_type;

/** Chip hiển thị = name từ JSON. */
export const HCM_PROVINCE_SHORT = hcmTinh.name;

/**
 * Quận/huyện HCM từ quan_huyen.json — chỉ theo path_with_type.
 * Không dùng parent_code (lệch mã giữa 2 file JSON).
 */
function loadHcmDistricts(): string[] {
  const quanMap = quanHuyen as Record<string, QuanEntry>;
  const provinceFull = hcmTinh.name_with_type;
  const suffix = `, ${provinceFull}`;

  const list = Object.values(quanMap).filter((q) => {
    const pathFull = q.path_with_type ?? '';
    return pathFull === provinceFull || pathFull.endsWith(suffix);
  });

  const unique = new Map<string, string>();
  for (const q of list) {
    if (q.name_with_type) unique.set(q.name_with_type, q.name_with_type);
  }

  return [...unique.values()].sort((a, b) => a.localeCompare(b, 'vi'));
}

/** Danh sách quận/huyện HCM — name_with_type, khớp DemoDataSeeder. */
export const HCM_DISTRICTS: string[] = loadHcmDistricts();
