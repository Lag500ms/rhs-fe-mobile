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
import { Feather } from '@expo/vector-icons';
import { RHSColors } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { housingApi, HousingProjectResponse } from '../api/housingApi';

export const HomeScreen = () => {
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

  const renderProjectCard = (project: HousingProjectResponse) => (
    <TouchableOpacity key={project.id} style={styles.projectCard} activeOpacity={0.8}>
      <View style={styles.projectThumbnail}>
        {project.thumbnailUrl ? (
          <Image source={{ uri: project.thumbnailUrl }} style={styles.projectImage} />
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
        <Text style={[styles.projectName, { color: RHSColors.govBlueDark }]} numberOfLines={2}>
          {project.projectName}
        </Text>
        <View style={styles.projectMeta}>
          <Text style={[styles.projectPrice, { color: RHSColors.govRed }]}>
            {formatPrice(project.minPrice, project.maxPrice)}
          </Text>
          <Text style={[styles.projectArea, { color: RHSColors.textMuted }]}>
            {formatArea(project.minArea, project.maxArea)}
          </Text>
        </View>
        <View style={styles.projectLocationRow}>
          <Feather name="map-pin" size={12} color={RHSColors.textMuted} />
          <Text style={[styles.projectLocation, { color: RHSColors.textMuted }]} numberOfLines={1}>
            {project.province}, {project.district}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Brand header bar */}
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with brand logo */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <RHSLogo size={44} />
            <View style={styles.headerTitles}>
              <Text style={styles.orgLine}>Cổng thông tin điều phối & thẩm định</Text>
              <Text style={styles.appName}>Hệ thống cung ứng nhà ở xã hội bền vững</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
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

        {/* Housing Projects List */}
        <View style={styles.projectsSection}>
          <View style={styles.projectsHeader}>
            <Feather name="home" size={22} color={RHSColors.govBlueDark} />
            <Text style={[styles.projectsTitle, { color: RHSColors.govBlueDark }]}>Danh sách nhà ở</Text>
          </View>

          {loading && pageIndex === 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={RHSColors.govRed} />
              <Text style={[styles.loadingText, { color: RHSColors.textMuted }]}>Đang tải dữ liệu...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={40} color={RHSColors.govRed} />
              <Text style={[styles.errorText, { color: RHSColors.govRed }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: RHSColors.govRed }]}
                onPress={() => fetchHousingProjects(1)}
              >
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : housingProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color={RHSColors.textMuted} />
              <Text style={[styles.emptyText, { color: RHSColors.textMuted }]}>Không có dự án nào</Text>
            </View>
          ) : (
            <>
              <View style={styles.projectsGrid}>
                {housingProjects.map(renderProjectCard)}
              </View>

              {pageIndex < totalPages && (
                <TouchableOpacity
                  style={[styles.loadMoreButton, { borderColor: RHSColors.govBlue }]}
                  onPress={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={RHSColors.govBlue} />
                  ) : (
                    <Text style={[styles.loadMoreText, { color: RHSColors.govBlue }]}>Xem thêm</Text>
                  )}
                </TouchableOpacity>
              )}

              {refreshing && (
                <View style={styles.refreshingContainer}>
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
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surfaceCard,
  },
  container: {
    flex: 1,
  },
  brandBar: {
    flexDirection: 'row',
    height: 4,
  },
  brandBarStripeRed: {
    flex: 2,
    backgroundColor: RHSColors.govRed,
  },
  brandBarStripeGold: {
    flex: 0.4,
    backgroundColor: RHSColors.govGold,
  },
  brandBarStripeBlue: {
    flex: 2,
    backgroundColor: RHSColors.govBlue,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: RHSColors.surface,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitles: {
    flex: 1,
  },
  orgLine: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: RHSColors.govGoldDark,
    marginBottom: 2,
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.govBlueDark,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.surfaceCard,
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: RHSColors.text,
  },
  projectsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  projectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  projectsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: RHSColors.govBlueDark,
    marginLeft: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: RHSColors.govRed,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: RHSColors.govRed,
    borderRadius: 8,
  },
  retryText: {
    color: RHSColors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  projectsGrid: {
    gap: 15,
  },
  projectCard: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RHSColors.border,
    overflow: 'hidden',
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  projectThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: RHSColors.surface,
    position: 'relative',
  },
  projectImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
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
    backgroundColor: RHSColors.govGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: RHSColors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectInfo: {
    padding: 12,
  },
  projectName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: RHSColors.govBlueDark,
    marginBottom: 6,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: RHSColors.govRed,
    marginRight: 10,
  },
  projectArea: {
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  projectLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectLocation: {
    fontSize: 12,
    color: RHSColors.textMuted,
    marginLeft: 4,
  },
  loadMoreButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: RHSColors.govBlue,
    borderRadius: 8,
  },
  loadMoreText: {
    color: RHSColors.govBlue,
    fontWeight: '600',
    fontSize: 14,
  },
  refreshingContainer: {
    padding: 10,
    alignItems: 'center',
  },
});