export const formatPrice = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} triệu`;
  return value.toLocaleString('vi-VN');
};

export const priceRange = (min: number, max: number): string => {
  if (min <= 0 && max <= 0) return 'Liên hệ';
  if (min <= 0) return `≤ ${formatPrice(max)}`;
  if (max <= 0 || max === min) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
};
