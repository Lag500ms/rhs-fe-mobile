import { HousingProjectResponse } from '../types/housing';

export const formatPrice = (min: number, max: number) => {
  if (min === 0 && max === 0) return 'Liên hệ';
  if (min >= 1e9) return min === max ? `${min / 1e9} tỷ` : `${min / 1e9} - ${max / 1e9} tỷ`;
  if (min >= 1e6) return min === max ? `${min / 1e6} triệu` : `${min / 1e6} - ${max / 1e6} triệu`;
  return `${min.toLocaleString()}đ`;
};

export const formatArea = (min: number, max: number) => {
  if (min === 0 && max === 0) return '';
  return min === max ? `${min} m²` : `${min} - ${max} m²`;
};

export const getThumb = (p: HousingProjectResponse) => {
  if (p.images?.length) {
    const sorted = [...p.images].sort((a, b) => a.displayOrder - b.displayOrder);
    return sorted[0].imageUrl;
  }
  return p.thumbnailUrl || null;
};
