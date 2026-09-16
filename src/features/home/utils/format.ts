import { HousingProjectResponse } from '../types/housing';
import { formatHousingVndRange } from '../../../lib/money';

/** Giá dự án/căn: 1.000.000 lưu = 1 tỷ tượng trưng. */
export const formatPrice = (min: number, max: number) => formatHousingVndRange(min, max);

export const getThumb = (p: HousingProjectResponse) => {
  if (p.images?.length) {
    const sorted = [...p.images].sort((a, b) => a.displayOrder - b.displayOrder);
    return sorted[0].imageUrl;
  }
  return p.thumbnailUrl || null;
};
