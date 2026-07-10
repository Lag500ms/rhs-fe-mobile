import phuongData from '../../../../assets/phuong.json';

type PhuongEntry = {
  name: string;
  type: string;
  slug: string;
  name_with_type: string;
  path: string;
  path_with_type: string;
  code: string;
  parent_code: string;
};

const phuongList: PhuongEntry[] = Object.values(phuongData);

/** Loại bỏ dấu tiếng Việt để so khớp chính xác */
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Trích xuất ResidentWard từ địa chỉ bằng cách so khớp với danh sách phường/xã */
export function extractWardFromAddress(address: string): string | undefined {
  if (!address) return undefined;
  const normalized = removeDiacritics(address.toLowerCase());

  const matches = phuongList.filter((p) => normalized.includes(removeDiacritics(p.name.toLowerCase())));

  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0].code;

  const byPath = matches.filter((p) => {
    const pathTokens = p.path.toLowerCase().split(',').map((t) => removeDiacritics(t.trim()));
    return pathTokens.some((token) => normalized.includes(token));
  });

  if (byPath.length > 0) {
    return byPath.sort((a, b) => b.name.length - a.name.length)[0].code;
  }

  return matches.sort((a, b) => b.name.length - a.name.length)[0].code;
}
