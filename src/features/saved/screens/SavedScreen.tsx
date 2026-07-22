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
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors, shadows, borderRadius, typography, spacing } from '../../../lib/theme';
import { getToken } from '../../../lib/tokenStorage';
import { wishlistApi } from '../api/wishlistApi';
import { WishlistItemResponse, PagedResult } from '../types/wishlist';
import { housingApi } from '../../home/api/housingApi';
import { priceRange } from '../utils/format';
import { WishlistHeart } from '../../../components/WishlistHeart';

const PAGE_SIZE = 10;

export const SavedScreen = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<WishlistItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích.');
    }
  }, []);

  const checkAuthAndLoad = useCallback(async () => {
    const token = await getToken();
    // Chưa đăng nhập: không reload / không gọi API
    if (!token) {
      setIsLoggedIn(false);
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setIsLoggedIn(true);
    setLoading(true);
    try {
      await fetchWishlist(1, false);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích.');
    } finally {
      setLoading(false);
    }
  }, [fetchWishlist]);

  useFocusEffect(
    useCallback(() => {
      void checkAuthAndLoad();
    }, [checkAuthAndLoad])
  );

  const onRefresh = async () => {
    const token = await getToken();
    if (!token) {
      setIsLoggedIn(false);
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    await fetchWishlist(1, false);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (!isLoggedIn || !hasNextPage || loadingMore) return;
    setLoadingMore(true);
    await fetchWishlist(pageIndex + 1, true);
    setLoadingMore(false);
  };

  const handleRemove = async (projectId: string) => {
    setRemovingId(projectId);
    try {
      await wishlistApi.removeFromWishlist(projectId);
      setItems((prev) => prev.filter((item) => item.projectId !== projectId));
    } catch {
      Alert.alert('Lỗi', 'Không thể bỏ quan tâm dự án.');
    } finally {
      setRemovingId(null);
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
      activeOpacity={0.88}
      onPress={() => handleItemPress(item.projectId)}
    >
      <View style={styles.thumbWrap}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Feather name="home" size={28} color={RHSColors.grey400} />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.projectName} numberOfLines={2}>
            {item.projectName}
          </Text>
          <WishlistHeart
            active
            loading={removingId === item.projectId}
            onPress={() => handleRemove(item.projectId)}
            size={20}
          />
        </View>

        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={RHSColors.textMuted} />
          <Text style={styles.projectLocation} numberOfLines={1}>
            {item.address || [item.district, item.province].filter(Boolean).join(', ')}
          </Text>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaChip}>
            <Feather name="tag" size={11} color={RHSColors.red600} />
            <Text style={styles.metaText}>{priceRange(item.minPrice, item.maxPrice)}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: RHSColors.blue50 }]}>
            <Feather name="maximize" size={11} color={RHSColors.blue700} />
            <Text style={[styles.metaText, { color: RHSColors.blue700 }]}>
              {item.minArea > 0 ? `${item.minArea}–${item.maxArea} m²` : `${item.maxArea} m²`}
            </Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: RHSColors.green50 }]}>
            <Feather name="home" size={11} color={RHSColors.green600} />
            <Text style={[styles.metaText, { color: RHSColors.green600 }]}>
              {item.availableUnits} căn
            </Text>
          </View>
        </View>
      </View>
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
          <View style={styles.illustrationBox}>
            <Ionicons name="heart-outline" size={56} color={RHSColors.red600} />
          </View>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptyDesc}>
            Đăng nhập để xem và quản lý dự án bạn đã lưu
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
        <View style={styles.illustrationBox}>
          <Ionicons name="heart-outline" size={56} color={RHSColors.red600} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có dự án quan tâm</Text>
        <Text style={styles.emptyDesc}>
          Nhấn trái tim trên thẻ dự án để lưu lại và theo dõi nhanh tại đây.
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
              isLoggedIn ? (
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[RHSColors.blue700]} />
              ) : undefined
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
  safeArea: { flex: 1, backgroundColor: RHSColors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: RHSColors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: RHSColors.text,
    letterSpacing: -0.3,
  },
  countBadge: {
    marginLeft: 10,
    backgroundColor: RHSColors.red600,
    borderRadius: borderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
    minWidth: 26,
    alignItems: 'center',
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, ...typography.bodySmall, color: RHSColors.textMuted },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 28 },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 24 },
  illustrationBox: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: RHSColors.red50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RHSColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    ...typography.bodySmall,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  card: {
    flexDirection: 'row',
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: RHSColors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  thumbWrap: { width: 96, backgroundColor: RHSColors.grey100 },
  thumb: { width: '100%', height: '100%', minHeight: 108 },
  thumbPlaceholder: {
    flex: 1,
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, padding: 12, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  projectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: RHSColors.text,
    lineHeight: 20,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  projectLocation: { fontSize: 12, color: RHSColors.textMuted, flex: 1 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: RHSColors.red50,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  metaText: { fontSize: 10, fontWeight: '600', color: RHSColors.red700 },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: { fontSize: 13, color: RHSColors.textMuted },
});
