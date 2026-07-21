import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
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
import { HCM_PROVINCE, HCM_PROVINCE_SHORT, HCM_DISTRICTS } from '../utils/hcmLocations';
import { HomeStackParamList } from '../navigation/HomeNavigator';
import { ProjectCard } from '../components/ProjectCard';
import { HomeFilterBar, SortKey, SORT_OPTIONS } from '../components/HomeFilterBar';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;
type FilterSheet = 'district' | 'price' | 'area' | 'sort' | null;

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

const OPEN_STATUS_VALUES = [
  'open',
  'open_for_registration',
  'openforregistration',
  'đang mở đăng ký',
  'đang mở bán',
  'đang mở',
];
const isOpenForRegistration = (status?: string) =>
  !!status && OPEN_STATUS_VALUES.includes(status.trim().toLowerCase());

const TAB_BAR_STYLE = {
  borderTopWidth: 1,
  borderTopColor: RHSColors.border,
  height: 62,
  paddingBottom: 8,
  paddingTop: 6,
  backgroundColor: RHSColors.surfaceCard,
};

export const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [housingProjects, setHousingProjects] = useState<HousingProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);
  const [filterMinPrice, setFilterMinPrice] = useState<number | undefined>();
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | undefined>();
  const [filterMinArea, setFilterMinArea] = useState<number | undefined>();
  const [filterMaxArea, setFilterMaxArea] = useState<number | undefined>();
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [activeSheet, setActiveSheet] = useState<FilterSheet>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  // Ẩn tab bar khi mở sheet lọc
  useEffect(() => {
    const tabNav = navigation.getParent()?.getParent() ?? navigation.getParent();
    if (!tabNav) return;
    tabNav.setOptions({
      tabBarStyle: activeSheet ? { display: 'none' } : TAB_BAR_STYLE,
    });
    return () => {
      tabNav.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [activeSheet, navigation]);

  const hasActiveFilters =
    !!filterDistrict
    || filterMinPrice !== undefined
    || filterMaxPrice !== undefined
    || filterMinArea !== undefined
    || filterMaxArea !== undefined
    || sortKey !== 'default';

  const resetFilters = () => {
    setFilterDistrict(null);
    setFilterMinPrice(undefined);
    setFilterMaxPrice(undefined);
    setFilterMinArea(undefined);
    setFilterMaxArea(undefined);
    setSortKey('default');
  };

  const fetchProjects = useCallback(async (page = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const result = await housingApi.getHousingProjects({
        pageIndex: page,
        pageSize: 12,
        search: debouncedSearch || undefined,
        province: HCM_PROVINCE,
        district: filterDistrict || undefined,
        minPrice: filterMinPrice,
        maxPrice: filterMaxPrice,
        minArea: filterMinArea,
        maxArea: filterMaxArea,
      });

      setHousingProjects((prev) => (page === 1 ? result.items : [...prev, ...result.items]));
      setPageIndex(result.pageIndex);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhà');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, filterDistrict, filterMinPrice, filterMaxPrice, filterMinArea, filterMaxArea]);

  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects]);

  const visibleProjects = useMemo(() => {
    let list = housingProjects.filter((p) => isOpenForRegistration(p.status));
    switch (sortKey) {
      case 'price_asc':
        list = [...list].sort((a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0));
        break;
      case 'price_desc':
        list = [...list].sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
        break;
      case 'units_desc':
        list = [...list].sort((a, b) => (b.availableUnits ?? 0) - (a.availableUnits ?? 0));
        break;
      default:
        break;
    }
    return list;
  }, [housingProjects, sortKey]);

  useEffect(() => {
    if (
      !loading
      && !loadingMore
      && housingProjects.length > 0
      && visibleProjects.length === 0
      && pageIndex < totalPages
    ) {
      fetchProjects(pageIndex + 1, true);
    }
  }, [loading, loadingMore, housingProjects.length, visibleProjects.length, pageIndex, totalPages, fetchProjects]);

  const priceLabel = useMemo(() => {
    if (filterMinPrice === undefined && filterMaxPrice === undefined) return null;
    const hit = PRICE_RANGES.find((r) => r.min === filterMinPrice && r.max === filterMaxPrice);
    return hit && hit.label !== 'Tất cả' ? hit.label.replace(' triệu', 'tr').replace(' tỷ', 'tỷ') : 'Giá tùy chọn';
  }, [filterMinPrice, filterMaxPrice]);

  const areaLabel = useMemo(() => {
    if (filterMinArea === undefined && filterMaxArea === undefined) return null;
    const hit = AREA_RANGES.find((r) => r.min === filterMinArea && r.max === filterMaxArea);
    return hit && hit.label !== 'Tất cả' ? hit.label : 'Diện tích';
  }, [filterMinArea, filterMaxArea]);

  const closeSheet = () => setActiveSheet(null);

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
          <RHSLogo size={36} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Tra cứu nhà ở xã hội</Text>
            <Text style={styles.heroSub}>TP. Hồ Chí Minh · Đang mở đăng ký</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color={RHSColors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên dự án..."
            placeholderTextColor={RHSColors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={() => setDebouncedSearch(searchText.trim())}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearchText(''); setDebouncedSearch(''); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color={RHSColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <HomeFilterBar
        filterDistrict={filterDistrict}
        priceLabel={priceLabel}
        areaLabel={areaLabel}
        sortKey={sortKey}
        hasActiveFilters={hasActiveFilters}
        onOpenDistrict={() => setActiveSheet('district')}
        onOpenPrice={() => setActiveSheet('price')}
        onOpenArea={() => setActiveSheet('area')}
        onOpenSort={() => setActiveSheet('sort')}
        onReset={resetFilters}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Danh sách dự án</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{visibleProjects.length} dự án</Text>
          </View>
        </View>

        {loading && pageIndex === 1 ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={RHSColors.blue700} />
            <Text style={styles.stateText}>Đang tải...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Feather name="alert-circle" size={40} color={RHSColors.red600} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProjects(1)}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : visibleProjects.length === 0 ? (
          <View style={styles.stateBox}>
            <Feather name="inbox" size={40} color={RHSColors.textMuted} />
            <Text style={styles.stateText}>Chưa có dự án đang mở đăng ký</Text>
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              {visibleProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPress={() => navigation.navigate('HousingProjectDetail', { project })}
                />
              ))}
            </View>
            {pageIndex < totalPages && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => fetchProjects(pageIndex + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={RHSColors.blue700} />
                ) : (
                  <Text style={styles.loadMoreText}>Xem thêm</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Sheets */}
      <FilterSheetModal
        visible={activeSheet === 'district'}
        title={`Quận / Huyện — ${HCM_PROVINCE_SHORT}`}
        onClose={closeSheet}
      >
        <SheetItem
          label="Tất cả quận/huyện"
          active={!filterDistrict}
          onPress={() => { setFilterDistrict(null); closeSheet(); }}
        />
        <FlatList
          data={HCM_DISTRICTS}
          keyExtractor={(i) => i}
          renderItem={({ item }) => (
            <SheetItem
              label={item}
              active={filterDistrict === item}
              onPress={() => { setFilterDistrict(item); closeSheet(); }}
            />
          )}
          style={{ maxHeight: 360 }}
        />
      </FilterSheetModal>

      <FilterSheetModal visible={activeSheet === 'price'} title="Khoảng giá" onClose={closeSheet}>
        {PRICE_RANGES.map((range) => (
          <SheetItem
            key={range.label}
            label={range.label}
            active={filterMinPrice === range.min && filterMaxPrice === range.max}
            onPress={() => {
              setFilterMinPrice(range.min);
              setFilterMaxPrice(range.max);
              closeSheet();
            }}
          />
        ))}
      </FilterSheetModal>

      <FilterSheetModal visible={activeSheet === 'area'} title="Diện tích" onClose={closeSheet}>
        {AREA_RANGES.map((range) => (
          <SheetItem
            key={range.label}
            label={range.label}
            active={filterMinArea === range.min && filterMaxArea === range.max}
            onPress={() => {
              setFilterMinArea(range.min);
              setFilterMaxArea(range.max);
              closeSheet();
            }}
          />
        ))}
      </FilterSheetModal>

      <FilterSheetModal visible={activeSheet === 'sort'} title="Sắp xếp" onClose={closeSheet}>
        {SORT_OPTIONS.map((opt) => (
          <SheetItem
            key={opt.key}
            label={opt.label}
            active={sortKey === opt.key}
            onPress={() => { setSortKey(opt.key); closeSheet(); }}
          />
        ))}
      </FilterSheetModal>
    </SafeAreaView>
  );
};

const FilterSheetModal = ({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.sheetOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        {children}
      </View>
    </View>
  </Modal>
);

const SheetItem = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.sheetItem, active && styles.sheetItemActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.sheetItemText, active && styles.sheetItemTextActive]}>{label}</Text>
    {active && <Feather name="check" size={18} color={RHSColors.blue700} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  bar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
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
  scroll: { flex: 1, paddingHorizontal: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: RHSColors.text, flex: 1 },
  countBadge: {
    backgroundColor: RHSColors.grey200,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { fontSize: 11, fontWeight: '600', color: RHSColors.textSecondary },
  stateBox: {
    alignItems: 'center',
    paddingVertical: 56,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  stateText: { marginTop: 10, ...typography.bodySmall, color: RHSColors.textMuted },
  errorText: {
    marginTop: 10,
    ...typography.bodySmall,
    color: RHSColors.red600,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  loadMoreBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: RHSColors.blue700,
    borderRadius: borderRadius.lg,
  },
  loadMoreText: { ...typography.buttonSmall, color: RHSColors.blue700 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: 20,
    paddingBottom: 28,
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
  sheetTitle: { fontSize: 16, fontWeight: '700', color: RHSColors.text, marginBottom: 12 },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  sheetItemActive: { backgroundColor: RHSColors.blue50 },
  sheetItemText: { fontSize: 15, color: RHSColors.text, fontWeight: '500' },
  sheetItemTextActive: { color: RHSColors.blue700, fontWeight: '700' },
});
