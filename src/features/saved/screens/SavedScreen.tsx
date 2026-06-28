import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors, shadows, borderRadius, typography } from '../../../lib/theme';
import { getToken } from '../../../lib/tokenStorage';
import { wishlistApi, WishlistItemResponse, PagedResult } from '../api/wishlistApi';
import { housingApi } from '../../home/api/housingApi';

const PAGE_SIZE = 10;

/** Định dạng tiền VND */
const formatPrice = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} triệu`;
  return value.toLocaleString('vi-VN');
};

/** Hiển thị khoảng giá */
const priceRange = (min: number, max: number): string => {
  if (min <= 0 && max <= 0) return 'Liên hệ';
  if (min <= 0) return `≤ ${formatPrice(max)}`;
  if (max <= 0 || max === min) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
};

export const SavedScreen = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<WishlistItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchWishlist = useCallback(async (page: number, append = false) => {
    try {
      const result: PagedResult<WishlistItemResponse> = await wishlistApi.getWishlist(page, PAGE_SIZE);
      if (append) {
        setItems((prev) => [...prev, ...result.items]);
      } else {
        setItems(result.items);
      }
      setHasNextPage(result.hasNextPage);
      setPageIndex(page);
    } catch (e: any) {
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích.');
    }
  }, []);

  const checkAuthAndLoad = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setItems([]);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
      await fetchWishlist(1, false);
    } catch (e: any) {
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích.');
    } finally {
      setLoading(false);
    }
  }, [fetchWishlist]);

  useFocusEffect(
    useCallback(() => {
      checkAuthAndLoad();
    }, [checkAuthAndLoad])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWishlist(1, false);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (!hasNextPage || loadingMore) return;
    setLoadingMore(true);
    await fetchWishlist(pageIndex + 1, true);
    setLoadingMore(false);
  };

  const handleRemove = async (projectId: string) => {
    try {
      await wishlistApi.removeFromWishlist(projectId);
      setItems((prev) => prev.filter((item) => item.projectId !== projectId));
    } catch {
      // silently fail — the item will stay in the list
    }
  };

  const handleItemPress = async (projectId: string) => {
    try {
      const project = await housingApi.getHousingProjectById(projectId);
      navigation.navigate('Home', {
        screen: 'HousingProjectDetail',
        params: { project },
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể tải thông tin dự án');
    }
  };

  const renderItem = ({ item }: { item: WishlistItemResponse }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => handleItemPress(item.projectId)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.projectName} numberOfLines={2}>
            {item.projectName}
          </Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={RHSColors.textMuted} />
            <Text style={styles.projectLocation} numberOfLines={1}>
              {item.address || `${item.district}, ${item.province}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(item.projectId)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={18} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Feather name="dollar-sign" size={14} color={RHSColors.green600} />
          <Text style={styles.metaText}>{priceRange(item.minPrice, item.maxPrice)}</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <Feather name="maximize" size={14} color={RHSColors.blue700} />
          <Text style={styles.metaText}>
            {item.minArea > 0 ? `${item.minArea}–${item.maxArea} m²` : `${item.maxArea} m²`}
          </Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <Feather name="home" size={14} color={RHSColors.amber600} />
          <Text style={styles.metaText}>{item.availableUnits} căn</Text>
        </View>
      </View>

      {item.status ? (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={RHSColors.blue700} />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  const handleLoginPress = () => {
    navigation.navigate('Auth', { screen: 'Login', params: { returnTo: 'Account' } });
  };

  const renderEmpty = () => {
    if (loading) return null;

    if (!isLoggedIn) {
      return (
        <View style={styles.emptyContainer}>
          {/* Illustration */}
          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationBox}>
              <Feather name="heart" size={72} color={RHSColors.govRed} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptyDesc}>
            Vui lòng đăng nhập để xem danh sách dự án quan tâm của bạn
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleLoginPress} activeOpacity={0.85}>
            <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationBox}>
            <Feather name="bookmark" size={72} color={RHSColors.govRed} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>Lưu lại dự án bạn quan tâm</Text>
        <Text style={styles.emptyDesc}>
          Nhấn vào biểu tượng trái tim khi lướt tìm kiếm để lưu lại dự án.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Home', { screen: 'HomeList' })}
          activeOpacity={0.85}
        >
          <Feather name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonText}>Khám phá dự án</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quan tâm</Text>
        {items.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={RHSColors.blue700} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.wishlistId}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            contentContainerStyle={items.length === 0 ? styles.emptyList : styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[RHSColors.blue700]} />
            }
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: RHSColors.text,
    letterSpacing: -0.5,
  },
  countBadge: {
    marginLeft: 10,
    backgroundColor: RHSColors.govRed,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  // ── Empty / Illustration State ──
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  illustrationWrap: {
    marginBottom: 28,
    width: '100%',
    alignItems: 'center',
  },
  illustrationBox: {
    width: 200,
    height: 180,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: RHSColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 15,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // ── Card ──
  card: {
    backgroundColor: RHSColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: RHSColors.border,
    ...shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: RHSColors.govRed,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectLocation: {
    fontSize: 13,
    color: RHSColors.textMuted,
    flex: 1,
  },
  removeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
  },
  divider: {
    height: 1,
    backgroundColor: RHSColors.border,
    marginVertical: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: RHSColors.grey300,
  },
  metaText: {
    fontSize: 13,
    color: RHSColors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: RHSColors.blue50,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: RHSColors.blue700,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: RHSColors.textMuted,
  },
});
