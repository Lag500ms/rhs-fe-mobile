import { formatHousingVnd, formatHousingVndRange } from '../../../lib/money';

export const formatPrice = (value: number): string => formatHousingVnd(value);

export const priceRange = (min: number, max: number): string => formatHousingVndRange(min, max);
