import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, borderRadius, shadows, typography, spacing } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { housingApi } from '../api/housingApi';
import { HousingProjectResponse } from '../types/housing';
import { formatPrice, getThumb } from '../utils/format';
import { HomeStackParamList } from '../navigation/HomeNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

const PROVINCES = [
  'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Long An',
  'Bắc Ninh', 'Hải Dương', 'Bắc Giang', 'Vĩnh Phúc', 'Thái Nguyên',
  'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Thừa Thiên Huế',
  'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Khánh Hòa', 'Lâm Đồng',
  'An Giang', 'Kiên Giang', 'Cà Mau', 'Tiền Giang', 'Bến Tre',
];

const DISTRICTS: Record<string, string[]> = {
  'TP.HCM': ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Tân Phú', 'Phú Nhuận', 'Bình Tân', 'Thủ Đức', 'Hóc Môn', 'Củ Chi', 'Bình Chánh', 'Nhà Bè', 'Cần Giờ'],
  'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Hà Đông', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Thanh Trì', 'Gia Lâm', 'Đông Anh', 'Sóc Sơn', 'Mê Linh'],
};

const PRICE_RANGES = [
  { label: 'Dưới 300 triệu', min: 0, max: 300_000_000 },
  { label: '300 - 500 triệu', min: 300_000_000, max: 500_000_000 },
  { label: '500 triệu - 1 tỷ', min: 500_000_000, max: 1_000_000_000 },
  { label: '1 - 2 tỷ', min: 1_000_000_000, max: 2_000_000_000 },
  { label: 'Trên 2 tỷ', min: 2_000_000_000, max: undefined },
  { label: 'Tất cả', min: undefined, max: undefined },
];

const AREA_RANGES = [
  { label: 'Dưới 30 m²', min: 0, max: 30 },
  { label: '30 - 50 m²', min: 30, max: 50 },
  { label: '50 - 70 m²', min: 50, max: 70 },
  { label: 'Trên 70 m²', min: 70, max: undefined },
  { label: 'Tất cả', min: undefined, max: undefined },
];

type FilterSheet = 'province' | 'district' | 'price' | 'area' | null;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [housingProjects, setHousingProjects] = useState<HousingProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filterProvince, setFilterProvince] = useState<string | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);
  const [filterMinPrice, setFilterMinPrice] = useState<number | undefined>(undefined);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | undefined>(undefined);
  const [filterMinArea, setFilterMinArea] = useState<number | undefined>(undefined);
  const [filterMaxArea, setFilterMaxArea] = useState<number | undefined>(undefined);

  // Sheet
  const [activeSheet, setActiveSheet] = useState<FilterSheet>(null);

  const hasActiveFilters = !!filterProvince || !!filterDistrict
    || filterMinPrice !== undefined || filterMaxPrice !== undefined
    || filterMinArea !== undefined || filterMaxArea !== undefined;

  const resetFilters = () => {
    setFilterProvince(null);
    setFilterDistrict(null);
    setFilterMinPrice(undefined);
    setFilterMaxPrice(undefined);
    setFilterMinArea(undefined);
    setFilterMaxArea(undefined);
  };

  const fetchProjects = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const result = await housingApi.getHousingProjects({
        pageIndex: page,
        pageSize: 10,
        search: searchText || undefined,
        province: filterProvince || undefined,
        district: filterDistrict || undefined,
        minPrice: filterMinPrice,
        maxPrice: filterMaxPrice,
        minArea: filterMinArea,
        maxArea: filterMaxArea,
      });

      if (page === 1) setHousingProjects(result.items);
      else setHousingProjects(prev => [...prev, ...result.items]);

      setPageIndex(result.pageIndex);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhà');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchText, filterProvince, filterDistrict, filterMinPrice, filterMaxPrice, filterMinArea, filterMaxArea]);

  useEffect(() => { fetchProjects(1); }, [fetchProjects]);

  const handleSearch = () => fetchProjects(1);
  const handleLoadMore = () => {
    if (pageIndex < totalPages && !loadingMore) fetchProjects(pageIndex + 1, true);
  };

  const districtsForProvince = useMemo(() => {
    if (!filterProvince) return [];
    return DISTRICTS[filterProvince] || [];
  }, [filterProvince]);

  const priceLabel = useMemo(() => {
    if (filterMinPrice === undefined && filterMaxPrice === undefined) return null;
    if (filterMinPrice === 0 && filterMaxPrice === 300_000_000) return 'Dưới 300tr';
    if (filterMinPrice === 300_000_000 && filterMaxPrice === 500_000_000) return '300-500tr';
    if (filterMinPrice === 500_000_000 && filterMaxPrice === 1_000_000_000) return '500tr-1tỷ';
    if (filterMinPrice === 1_000_000_000 && filterMaxPrice === 2_000_000_000) return '1-2tỷ';
    if (filterMinPrice === 2_000_000_000 && filterMaxPrice === undefined) return 'Trên 2tỷ';
    const min = filterMinPrice ? `${(filterMinPrice / 1_000_000).toFixed(0)}tr` : '';
    const max = filterMaxPrice ? `${(filterMaxPrice / 1_000_000).toFixed(0)}tr` : '';
    if (min && max) return `${min}-${max}`;
    if (min) return `Từ ${min}`;
    return `Đến ${max}`;
  }, [filterMinPrice, filterMaxPrice]);

  const areaLabel = useMemo(() => {
    if (filterMinArea === undefined && filterMaxArea === undefined) return null;
    if (filterMinArea === 0 && filterMaxArea === 30) return 'Dưới 30m²';
    if (filterMinArea === 30 && filterMaxArea === 50) return '30-50m²';
    if (filterMinArea === 50 && filterMaxArea === 70) return '50-70m²';
    if (filterMinArea === 70 && filterMaxArea === undefined) return 'Trên 70m²';
    const min = filterMinArea ? `${filterMinArea}m²` : '';
    const max = filterMaxArea ? `${filterMaxArea}m²` : '';
    if (min && max) return `${min}-${max}`;
    if (min) return `Từ ${min}`;
    return `Đến ${max}`;
  }, [filterMinArea, filterMaxArea]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.red600 }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.amber600 }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.blue700 }]} />
      </View>

      <LinearGradient
        colors={['#0A3A85', '#1565C0', '#1E88E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <RHSLogo size={40} />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Tra cứu nhà ở</Text>
            <Text style={styles.heroSub}>Hỗ trợ nhà ở xã hội cho hộ nghèo, cận nghèo tại phường</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color={RHSColors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm dự án nhà ở..."
            placeholderTextColor={RHSColors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); fetchProjects(1); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={18} color={RHSColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Filter Chips ── */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filterProvince && styles.filterChipActive]}
            onPress={() => setActiveSheet('province')}
            activeOpacity={0.7}
          >
            <Feather name="map-pin" size={13} color={filterProvince ? '#fff' : RHSColors.textSecondary} />
            <Text style={[styles.filterChipText, filterProvince && styles.filterChipTextActive]}>
              {filterProvince || 'Tỉnh/TP'}
            </Text>
            <Feather name="chevron-down" size={12} color={filterProvince ? '#fff' : RHSColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterDistrict && styles.filterChipActive, !filterProvince && styles.filterChipDisabled]}
            onPress={() => filterProvince && setActiveSheet('district')}
            activeOpacity={0.7}
            disabled={!filterProvince}
          >
            <Feather name="navigation" size={13} color={filterDistrict ? '#fff' : RHSColors.textSecondary} />
            <Text style={[styles.filterChipText, filterDistrict && styles.filterChipTextActive, !filterProvince && styles.filterChipTextDisabled]}>
              {filterDistrict || 'Quận/Huyện'}
            </Text>
            <Feather name="chevron-down" size={12} color={filterDistrict ? '#fff' : RHSColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, priceLabel && styles.filterChipActive]}
            onPress={() => setActiveSheet('price')}
            activeOpacity={0.7}
          >
            <Feather name="dollar-sign" size={13} color={priceLabel ? '#fff' : RHSColors.textSecondary} />
            <Text style={[styles.filterChipText, priceLabel && styles.filterChipTextActive]}>
              {priceLabel || 'Giá'}
            </Text>
            <Feather name="chevron-down" size={12} color={priceLabel ? '#fff' : RHSColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, areaLabel && styles.filterChipActive]}
            onPress={() => setActiveSheet('area')}
            activeOpacity={0.7}
          >
            <Feather name="maximize" size={13} color={areaLabel ? '#fff' : RHSColors.textSecondary} />
            <Text style={[styles.filterChipText, areaLabel && styles.filterChipTextActive]}>
              {areaLabel || 'Diện tích'}
            </Text>
            <Feather name="chevron-down" size={12} color={areaLabel ? '#fff' : RHSColors.textMuted} />
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.filterChipReset} onPress={resetFilters} activeOpacity={0.7}>
              <Feather name="refresh-cw" size={12} color={RHSColors.red600} />
              <Text style={styles.filterChipResetText}>Đặt lại</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHead}>
          <View style={styles.sectionBadge}>
            <Feather name="home" size={14} color="#fff" />
          </View>
          <Text style={styles.sectionTitle}>Danh sách nhà ở</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalCount} dự án</Text>
          </View>
        </View>

        {loading && pageIndex === 1 ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={RHSColors.blue700} />
            <Text style={styles.stateText}>Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Feather name="alert-circle" size={44} color={RHSColors.red600} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProjects(1)}>
              <Feather name="refresh-cw" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : housingProjects.length === 0 ? (
          <View style={styles.stateBox}>
            <Feather name="inbox" size={44} color={RHSColors.textMuted} />
            <Text style={styles.stateText}>Không tìm thấy dự án phù hợp</Text>
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              {housingProjects.map(project => {
                const thumb = getThumb(project);
                return (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.card}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('HousingProjectDetail', { project })}
                  >
                    <View style={styles.cardImageWrap}>
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.cardImage} />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <Feather name="home" size={36} color={RHSColors.grey400} />
                        </View>
                      )}
                      {project.status && (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>{project.status}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName} numberOfLines={2}>{project.projectName}</Text>
                      <View style={styles.cardMeta}>
                        <View style={styles.chip}>
                          <Feather name="dollar-sign" size={12} color={RHSColors.red600} />
                          <Text style={styles.chipText}>{formatPrice(project.minPrice, project.maxPrice)}</Text>
                        </View>
                        {project.minArea > 0 && (
                          <View style={[styles.chip, { backgroundColor: RHSColors.blue50 }]}>
                            <Feather name="maximize" size={12} color={RHSColors.blue700} />
                            <Text style={[styles.chipText, { color: RHSColors.blue700 }]}>
                              {project.minArea === project.maxArea ? `${project.minArea}m²` : `${project.minArea}-${project.maxArea}m²`}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.chip, project.availableUnits > 0 ? { backgroundColor: RHSColors.green50 } : { backgroundColor: RHSColors.red50 }]}>
                          <Feather name="home" size={11} color={project.availableUnits > 0 ? RHSColors.green600 : RHSColors.red600} />
                          <Text style={[styles.chipText, project.availableUnits > 0 ? { color: RHSColors.green600 } : { color: RHSColors.red600 }]}>
                            {project.availableUnits > 0 ? `Còn ${project.availableUnits} căn` : 'Đã hết'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.locationRow}>
                        <Feather name="map-pin" size={12} color={RHSColors.textMuted} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {[project.street, project.ward, project.district, project.province].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {pageIndex < totalPages && (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={loadingMore} activeOpacity={0.85}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color={RHSColors.blue700} />
                ) : (
                  <Text style={styles.loadMoreText}>Xem thêm dự án</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Province Sheet ── */}
      <Modal visible={activeSheet === 'province'} transparent animationType="slide">
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setActiveSheet(null)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Chọn Tỉnh / Thành phố</Text>
            <FlatList
              data={PROVINCES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.sheetItem, filterProvince === item && styles.sheetItemActive]}
                  onPress={() => {
                    setFilterProvince(item);
                    setFilterDistrict(null);
                    setActiveSheet(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetItemText, filterProvince === item && styles.sheetItemTextActive]}>
                    {item}
                  </Text>
                  {filterProvince === item && <Feather name="check" size={18} color={RHSColors.blue700} />}
                </TouchableOpacity>
              )}
              style={styles.sheetList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── District Sheet ── */}
      <Modal visible={activeSheet === 'district'} transparent animationType="slide">
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setActiveSheet(null)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Chọn Quận / Huyện — {filterProvince}</Text>
            <FlatList
              data={districtsForProvince}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.sheetItem, filterDistrict === item && styles.sheetItemActive]}
                  onPress={() => {
                    setFilterDistrict(item);
                    setActiveSheet(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetItemText, filterDistrict === item && styles.sheetItemTextActive]}>
                    {item}
                  </Text>
                  {filterDistrict === item && <Feather name="check" size={18} color={RHSColors.blue700} />}
                </TouchableOpacity>
              )}
              style={styles.sheetList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.sheetEmpty}>
                  <Text style={styles.sheetEmptyText}>Không có dữ liệu quận/huyện cho tỉnh này</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Price Sheet ── */}
      <Modal visible={activeSheet === 'price'} transparent animationType="slide">
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setActiveSheet(null)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Chọn khoảng giá</Text>
            {PRICE_RANGES.map((range) => {
              const isActive = filterMinPrice === range.min && filterMaxPrice === range.max;
              return (
                <TouchableOpacity
                  key={range.label}
                  style={[styles.sheetItem, isActive && styles.sheetItemActive]}
                  onPress={() => {
                    setFilterMinPrice(range.min);
                    setFilterMaxPrice(range.max);
                    setActiveSheet(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetItemText, isActive && styles.sheetItemTextActive]}>
                    {range.label}
                  </Text>
                  {isActive && <Feather name="check" size={18} color={RHSColors.blue700} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Area Sheet ── */}
      <Modal visible={activeSheet === 'area'} transparent animationType="slide">
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setActiveSheet(null)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Chọn diện tích</Text>
            {AREA_RANGES.map((range) => {
              const isActive = filterMinArea === range.min && filterMaxArea === range.max;
              return (
                <TouchableOpacity
                  key={range.label}
                  style={[styles.sheetItem, isActive && styles.sheetItemActive]}
                  onPress={() => {
                    setFilterMinArea(range.min);
                    setFilterMaxArea(range.max);
                    setActiveSheet(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetItemText, isActive && styles.sheetItemTextActive]}>
                    {range.label}
                  </Text>
                  {isActive && <Feather name="check" size={18} color={RHSColors.blue700} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  bar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadows.lg,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '500' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    height: 46,
    ...shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: RHSColors.text },

  // ── Filter Bar ──
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey200,
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.grey100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
  },
  filterChipActive: {
    backgroundColor: RHSColors.blue700,
    borderColor: RHSColors.blue700,
  },
  filterChipDisabled: {
    opacity: 0.4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: RHSColors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterChipTextDisabled: {
    color: RHSColors.textMuted,
  },
  filterChipReset: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
    borderWidth: 1,
    borderColor: RHSColors.red300,
    backgroundColor: RHSColors.red50,
  },
  filterChipResetText: {
    fontSize: 12,
    fontWeight: '600',
    color: RHSColors.red600,
  },

  scroll: { flex: 1, paddingHorizontal: 16 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: RHSColors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: { ...typography.h3, color: RHSColors.text, flex: 1 },
  countBadge: {
    backgroundColor: RHSColors.grey200,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { fontSize: 11, fontWeight: '600', color: RHSColors.textSecondary },
  stateBox: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  stateText: { marginTop: 10, ...typography.bodySmall, color: RHSColors.textMuted },
  errorText: { marginTop: 10, ...typography.bodySmall, color: RHSColors.red600, textAlign: 'center', paddingHorizontal: 16 },
  retryBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.red600,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  grid: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardImageWrap: { width: '100%', height: 170, position: 'relative', backgroundColor: RHSColors.grey100 },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: RHSColors.green600,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: 14 },
  cardName: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, marginBottom: 10, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.red50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: RHSColors.red600 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: RHSColors.textMuted, marginLeft: 4, flex: 1 },

  loadMoreBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: RHSColors.blue700,
    borderRadius: borderRadius.lg,
  },
  loadMoreText: { ...typography.buttonSmall, color: RHSColors.blue700 },

  // ── Bottom Sheet ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: RHSColors.grey300,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sheetList: {
    maxHeight: 400,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginBottom: 2,
  },
  sheetItemActive: {
    backgroundColor: RHSColors.blue50,
  },
  sheetItemText: {
    fontSize: 15,
    color: RHSColors.text,
    fontWeight: '500',
  },
  sheetItemTextActive: {
    color: RHSColors.blue700,
    fontWeight: '700',
  },
  sheetEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  sheetEmptyText: {
    fontSize: 14,
    color: RHSColors.textMuted,
  },

  // Old styles kept for compatibility
  wardBadge: {},
  wardBadgeText: {},
});
