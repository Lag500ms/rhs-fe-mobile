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
import { RHSColors } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { housingApi, HousingProjectResponse } from '../api/housingApi';
import { HomeStackParamList } from '../navigation/HomeNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [housingProjects, setHousingProjects] = useState<HousingProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHousingProjects = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (page === 1) setLoading(true);
      setError(null);

      const result = await housingApi.getHousingProjects({
        pageIndex: page,
        pageSize: 10,
        search: searchText || undefined,
      });

      if (page === 1) {
        setHousingProjects(result.items);
      } else {
        setHousingProjects(prev => [...prev, ...result.items]);
      }
      setPageIndex(result.pageIndex);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhà');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchText]);

  useEffect(() => {
    fetchHousingProjects(1);
  }, [fetchHousingProjects]);

  const handleSearch = () => {
    fetchHousingProjects(1);
  };

  const handleLoadMore = () => {
    if (pageIndex < totalPages && !loading) {
      fetchHousingProjects(pageIndex + 1);
    }
  };

  const formatPrice = (minPrice: number, maxPrice: number) => {
    if (minPrice === 0 && maxPrice === 0) return 'Liên hệ';
    if (minPrice >= 1000000000) {
      const minB = minPrice / 1000000000;
      const maxB = maxPrice / 1000000000;
      if (minB === maxB) return `${minB} tỷ`;
      return `${minB} - ${maxB} tỷ`;
    }
    if (minPrice >= 1000000) {
      const minM = minPrice / 1000000;
      const maxM = maxPrice / 1000000;
      if (minM === maxM) return `${minM} triệu`;
      return `${minM} - ${maxM} triệu`;
    }
    return `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} VNĐ`;
  };

  const formatArea = (minArea: number, maxArea: number) => {
    if (minArea === 0 && maxArea === 0) return '';
    if (minArea === maxArea) return `${minArea} m²`;
    return `${minArea} - ${maxArea} m²`;
  };

  const getThumbnailUrl = (project: HousingProjectResponse): string | null => {
    if (project.images && project.images.length > 0) {
      const sorted = [...project.images].sort((a, b) => a.displayOrder - b.displayOrder);
      return sorted[0].imageUrl;
    }
    return project.thumbnailUrl || null;
  };

  const handleProjectPress = (project: HousingProjectResponse) => {
    navigation.navigate('HousingProjectDetail', { project });
  };

  const renderProjectCard = (project: HousingProjectResponse) => {
    const thumbUrl = getThumbnailUrl(project);
    return (
      <TouchableOpacity
        key={project.id}
        style={styles.projectCard}
        activeOpacity={0.85}
        onPress={() => handleProjectPress(project)}
      >
        <View style={styles.projectThumbnail}>
          {thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.projectImage} />
          ) : (
            <View style={styles.projectImagePlaceholder}>
              <Feather name="home" size={40} color={RHSColors.textMuted} />
            </View>
          )}
          {project.status && (
            <View style={[styles.statusBadge, { backgroundColor: RHSColors.govGreen }]}>
              <Text style={styles.statusText}>{project.status}</Text>
            </View>
          )}
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName} numberOfLines={2}>
            {project.projectName}
          </Text>
          <View style={styles.projectMeta}>
            <Text style={styles.projectPrice}>
              {formatPrice(project.minPrice, project.maxPrice)}
            </Text>
            {formatArea(project.minArea, project.maxArea) ? (
              <Text style={styles.projectArea}>
                {formatArea(project.minArea, project.maxArea)}
              </Text>
            ) : null}
          </View>
          <View style={styles.projectLocationRow}>
            <Feather name="map-pin" size={13} color={RHSColors.textMuted} />
            <Text style={styles.projectLocation} numberOfLines={1}>
              {project.province}, {project.district}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Brand bar */}
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      {/* Header with gradient */}
      <LinearGradient
        colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerBrand}>
          <RHSLogo size={44} />
          <View style={styles.headerTitles}>
            <Text style={styles.orgLine}>Cổng thông tin điều phối & thẩm định</Text>
            <Text style={styles.appName}>Hệ thống cung ứng nhà ở xã hội bền vững</Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Feather name="search" size={20} color={RHSColors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm dự án nhà ở..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              placeholderTextColor={RHSColors.textMuted}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchText(''); fetchHousingProjects(1); }}>
                <Feather name="x" size={20} color={RHSColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Housing Projects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconWrap}>
                <Feather name="home" size={16} color={RHSColors.white} />
              </View>
              <Text style={styles.sectionTitle}>Danh sách nhà ở</Text>
            </View>
            <Text style={styles.sectionCount}>{housingProjects.length} dự án</Text>
          </View>

          {loading && pageIndex === 1 ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={RHSColors.govRed} />
              <Text style={styles.stateText}>Đang tải dữ liệu...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Feather name="alert-circle" size={48} color={RHSColors.govRed} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchHousingProjects(1)}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : housingProjects.length === 0 ? (
            <View style={styles.stateBox}>
              <Feather name="inbox" size={48} color={RHSColors.textMuted} />
              <Text style={styles.stateText}>Không có dự án nào</Text>
            </View>
          ) : (
            <>
              <View style={styles.grid}>
                {housingProjects.map(renderProjectCard)}
              </View>
              {pageIndex < totalPages && (
                <TouchableOpacity
                  style={styles.loadMore}
                  onPress={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={RHSColors.white} />
                  ) : (
                    <Text style={styles.loadMoreText}>Xem thêm dự án</Text>
                  )}
                </TouchableOpacity>
              )}
              {refreshing && (
                <View style={styles.refreshWrap}>
                  <ActivityIndicator size="small" color={RHSColors.govRed} />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RHSColors.surface },
  container: { flex: 1 },
  brandBar: { flexDirection: 'row', height: 4 },
  brandBarStripeRed: { flex: 2, backgroundColor: RHSColors.govRed },
  brandBarStripeGold: { flex: 0.4, backgroundColor: RHSColors.govGold },
  brandBarStripeBlue: { flex: 2, backgroundColor: RHSColors.govBlue },

  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitles: { flex: 1 },
  orgLine: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#ffd166',
    marginBottom: 2,
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.white,
    lineHeight: 20,
  },

  searchCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: RHSColors.white,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: RHSColors.text },

  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: RHSColors.govBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: RHSColors.text },
  sectionCount: { fontSize: 12, color: RHSColors.textMuted, fontWeight: '500' },

  stateBox: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: RHSColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  stateText: { marginTop: 12, fontSize: 14, color: RHSColors.textMuted },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: RHSColors.govRed,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: RHSColors.govRed,
    borderRadius: 25,
  },
  retryText: { color: RHSColors.white, fontWeight: '600', fontSize: 14 },

  grid: { gap: 12 },
  projectCard: {
    backgroundColor: RHSColors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  projectThumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: RHSColors.surface,
    position: 'relative',
  },
  projectImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  projectImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { color: RHSColors.white, fontSize: 11, fontWeight: 'bold' },
  projectInfo: { padding: 12 },
  projectName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: RHSColors.govBlueDark,
    marginBottom: 8,
    lineHeight: 19,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  projectPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: RHSColors.govRed,
    marginRight: 10,
  },
  projectArea: { fontSize: 12, color: RHSColors.textMuted, fontWeight: '500' },
  projectLocationRow: { flexDirection: 'row', alignItems: 'center' },
  projectLocation: {
    fontSize: 12,
    color: RHSColors.textMuted,
    marginLeft: 5,
    flex: 1,
  },

  loadMore: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 13,
    backgroundColor: RHSColors.govBlue,
    borderRadius: 10,
  },
  loadMoreText: { color: RHSColors.white, fontWeight: '700', fontSize: 14 },
  refreshWrap: { padding: 14, alignItems: 'center' },
});