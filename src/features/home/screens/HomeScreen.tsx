import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, borderRadius, shadows, typography, spacing } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { housingApi, HousingProjectResponse } from '../api/housingApi';
import { HomeStackParamList } from '../navigation/HomeNavigator';
import { userApi } from '../../user/api/userApi';
import phuongData from '../../../../assets/phuong.json';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

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
const phuongMap: Record<string, PhuongEntry> = phuongData;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [housingProjects, setHousingProjects] = useState<HousingProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [residentWardName, setResidentWardName] = useState<string | null>(null);

  // Lấy ResidentWard code từ profile, tra tên trong phuong.json
  useEffect(() => {
    (async () => {
      try {
        const profile = await userApi.getProfile();
        const code = profile?.user?.residentWard;
        if (code && phuongMap[code]) {
          setResidentWardName(phuongMap[code].name);
        }
      } catch {}
    })();
  }, []);

  const fetchProjects = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const result = await housingApi.getHousingProjects({
        pageIndex: page,
        pageSize: 10,
        search: searchText || undefined,
      });

      let items = result.items;

      // Nếu user có residentWard, đưa dự án cùng phường lên đầu
      if (residentWardName && items.length > 0) {
        items = [...items].sort((a, b) => {
          const aMatch = a.ward?.toLowerCase() === residentWardName.toLowerCase() ? 0 : 1;
          const bMatch = b.ward?.toLowerCase() === residentWardName.toLowerCase() ? 0 : 1;
          return aMatch - bMatch;
        });
      }

      if (page === 1) setHousingProjects(items);
      else setHousingProjects(prev => [...prev, ...items]);

      setPageIndex(result.pageIndex);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhà');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchText, residentWardName]);

  useEffect(() => { fetchProjects(1); }, [fetchProjects]);

  const handleSearch = () => fetchProjects(1);
  const handleLoadMore = () => {
    if (pageIndex < totalPages && !loadingMore) fetchProjects(pageIndex + 1, true);
  };

  const formatPrice = (min: number, max: number) => {
    if (min === 0 && max === 0) return 'Liên hệ';
    if (min >= 1e9) return min === max ? `${min/1e9} tỷ` : `${min/1e9} - ${max/1e9} tỷ`;
    if (min >= 1e6) return min === max ? `${min/1e6} triệu` : `${min/1e6} - ${max/1e6} triệu`;
    return `${min.toLocaleString()}đ`;
  };

  const getThumb = (p: HousingProjectResponse) => {
    if (p.images?.length) {
      const sorted = [...p.images].sort((a, b) => a.displayOrder - b.displayOrder);
      return sorted[0].imageUrl;
    }
    return p.thumbnailUrl || null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Brand stripes */}
      <View style={styles.bar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.red600 }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.amber600 }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.blue700 }]} />
      </View>

      {/* Hero header */}
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

        {/* Search bar inside hero */}
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Section header */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionBadge}>
            <Feather name="home" size={14} color="#fff" />
          </View>
          <Text style={styles.sectionTitle}>Danh sách nhà ở</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{housingProjects.length} dự án</Text>
          </View>
        </View>

        {/* Content */}
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
                const isSameWard = residentWardName && project.ward?.toLowerCase() === residentWardName.toLowerCase();
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
                      {isSameWard && (
                        <View style={styles.wardBadge}>
                          <Feather name="map-pin" size={10} color="#fff" />
                          <Text style={styles.wardBadgeText}>Cùng phường</Text>
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

            {/* Load more */}
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
  wardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.govGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  wardBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
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
});