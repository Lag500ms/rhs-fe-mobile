import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius, spacing } from '../../../lib/theme';
import { HCM_PROVINCE_SHORT } from '../utils/hcmLocations';

export type SortKey = 'default' | 'price_asc' | 'price_desc' | 'units_desc';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'Mặc định' },
  { key: 'price_asc', label: 'Giá tăng' },
  { key: 'price_desc', label: 'Giá giảm' },
  { key: 'units_desc', label: 'Còn nhiều căn' },
];

type Props = {
  filterDistrict: string | null;
  priceLabel: string | null;
  areaLabel: string | null;
  sortKey: SortKey;
  hasActiveFilters: boolean;
  onOpenDistrict: () => void;
  onOpenPrice: () => void;
  onOpenArea: () => void;
  onOpenSort: () => void;
  onReset: () => void;
};

export const HomeFilterBar: React.FC<Props> = ({
  filterDistrict,
  priceLabel,
  areaLabel,
  sortKey,
  hasActiveFilters,
  onOpenDistrict,
  onOpenPrice,
  onOpenArea,
  onOpenSort,
  onReset,
}) => {
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label || 'Sắp xếp';

  return (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.chip, styles.chipLocked]}>
          <Feather name="map-pin" size={13} color={RHSColors.blue700} />
          <Text style={[styles.chipText, { color: RHSColors.blue700 }]}>{HCM_PROVINCE_SHORT}</Text>
        </View>

        <Chip
          icon="navigation"
          label={filterDistrict || 'Quận/Huyện'}
          active={!!filterDistrict}
          onPress={onOpenDistrict}
        />
        <Chip icon="tag" label={priceLabel || 'Giá'} active={!!priceLabel} onPress={onOpenPrice} />
        <Chip icon="maximize" label={areaLabel || 'Diện tích'} active={!!areaLabel} onPress={onOpenArea} />
        <Chip
          icon="sliders"
          label={sortKey === 'default' ? 'Sắp xếp' : sortLabel}
          active={sortKey !== 'default'}
          onPress={onOpenSort}
        />

        {hasActiveFilters && (
          <TouchableOpacity style={styles.reset} onPress={onReset} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={12} color={RHSColors.red600} />
            <Text style={styles.resetText}>Đặt lại</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const Chip = ({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Feather name={icon} size={13} color={active ? '#fff' : RHSColors.textSecondary} />
    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
      {label}
    </Text>
    <Feather name="chevron-down" size={12} color={active ? '#fff' : RHSColors.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  filterBar: {
    backgroundColor: RHSColors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
    paddingVertical: spacing.sm,
  },
  scroll: { paddingHorizontal: spacing.lg, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: RHSColors.grey100,
    borderWidth: 1,
    borderColor: RHSColors.border,
    maxWidth: 160,
  },
  chipLocked: {
    backgroundColor: RHSColors.blue50,
    borderColor: RHSColors.blue200,
  },
  chipActive: {
    backgroundColor: RHSColors.blue700,
    borderColor: RHSColors.blue700,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: RHSColors.textSecondary, flexShrink: 1 },
  chipTextActive: { color: '#fff' },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resetText: { fontSize: 12, fontWeight: '700', color: RHSColors.red600 },
});
