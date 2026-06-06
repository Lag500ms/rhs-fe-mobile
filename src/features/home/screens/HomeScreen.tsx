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
            <Feather name="home" size={40} color="#CCCCCC" />
          </View>
        )}
        {project.status && (
          <View style={styles.statusBadge}>
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
          <Text style={styles.projectArea}>
            {formatArea(project.minArea, project.maxArea)}
          </Text>
        </View>
        <View style={styles.projectLocationRow}>
          <Feather name="map-pin" size={12} color="#999" />
          <Text style={styles.projectLocation} numberOfLines={1}>
            {project.province}, {project.district}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.buildingIllustration}>
            <View style={styles.buildingRed} />
            <View style={styles.buildingGray} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm dự án nhà ở..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#999"
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); fetchHousingProjects(1); }}>
              <Feather name="x" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Cards */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity style={styles.categoryCard}>
            <View style={styles.categoryIconContainer}>
              <View style={styles.houseIcon}>
                <View style={styles.houseRoof} />
                <View style={styles.houseBody} />
              </View>
            </View>
            <Text style={styles.categoryText}>Mua bán</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.categoryCard}>
            <View style={styles.categoryIconContainer}>
              <View style={styles.rentIcon}>
                <View style={styles.rentRoof} />
                <View style={styles.rentBody} />
                <Text style={styles.rentLabel}>THUÊ</Text>
              </View>
            </View>
            <Text style={styles.categoryText}>Cho thuê</Text>
          </TouchableOpacity>
        </View>

        {/* Housing Projects List */}
        <View style={styles.projectsSection}>
          <View style={styles.projectsHeader}>
            <Feather name="home" size={24} color="#000" />
            <Text style={styles.projectsTitle}>Danh sách nhà ở</Text>
          </View>

          {loading && pageIndex === 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D93843" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={40} color="#D93843" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchHousingProjects(1)}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : housingProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color="#CCCCCC" />
              <Text style={styles.emptyText}>Không có dự án nào</Text>
            </View>
          ) : (
            <>
              <View style={styles.projectsGrid}>
                {housingProjects.map(renderProjectCard)}
              </View>

              {pageIndex < totalPages && (
                <TouchableOpacity 
                  style={styles.loadMoreButton} 
                  onPress={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#D93843" />
                  ) : (
                    <Text style={styles.loadMoreText}>Xem thêm</Text>
                  )}
                </TouchableOpacity>
              )}

              {refreshing && (
                <View style={styles.refreshingContainer}>
                  <ActivityIndicator size="small" color="#D93843" />
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  logo: {
    width: 150,
    height: 40,
  },
  buildingIllustration: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  buildingRed: {
    width: 60,
    height: 50,
    backgroundColor: '#D93843',
    marginRight: 2,
  },
  buildingGray: {
    width: 60,
    height: 40,
    backgroundColor: '#CCCCCC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 15,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  houseIcon: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D93843',
    position: 'absolute',
    top: 0,
  },
  houseBody: {
    width: 40,
    height: 30,
    backgroundColor: '#D93843',
    position: 'absolute',
    bottom: 0,
    left: 5,
  },
  rentIcon: {
    width: 50,
    height: 50,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rentRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D93843',
    position: 'absolute',
    top: 0,
  },
  rentBody: {
    width: 40,
    height: 30,
    backgroundColor: '#D93843',
    position: 'absolute',
    bottom: 0,
  },
  rentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    position: 'absolute',
    bottom: 8,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    color: '#000',
    marginLeft: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#D93843',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#D93843',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  projectsGrid: {
    gap: 15,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  projectThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
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
    backgroundColor: '#F5F5F5',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectInfo: {
    padding: 12,
  },
  projectName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
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
    color: '#D93843',
    marginRight: 10,
  },
  projectArea: {
    fontSize: 14,
    color: '#666',
  },
  projectLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectLocation: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  loadMoreButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D93843',
    borderRadius: 8,
  },
  loadMoreText: {
    color: '#D93843',
    fontWeight: '600',
    fontSize: 14,
  },
  refreshingContainer: {
    padding: 10,
    alignItems: 'center',
  },
});