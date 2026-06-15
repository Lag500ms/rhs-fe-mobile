import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';
import { wishlistApi, WishlistItemResponse, PagedResult } from '../api/wishlistApi';

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchWishlist(1, false);
      setLoading(false);
    })();
  }, [fetchWishlist]);

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

  const handleRemove = (projectId: string, projectName: string) => {
    Alert.alert('Xóa khỏi danh sách', `Bỏ "${projectName}" khỏi danh sách yêu thích?`, [
      { text: 'Giữ lại', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await wishlistApi.removeFromWishlist(projectId);
            setItems((prev) => prev.filter((item) => item.projectId !== projectId));
          } catch (e: any) {
            Alert.alert('Lỗi', 'Không thể xóa dự án khỏi danh sách yêu thích.');
          }
        },
      },
    ]);
  };

  const handleItemPress = (projectId: string) => {
    // Navigate to project detail - adjust route name to match your navigator
    navigation.navigate('ProjectDetail', { id: projectId });
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
          <Text style={styles.projectLocation} numberOfLines={1}>
            <Feather name="map-pin" size={12} color={RHSColors.textMuted} /> {item.address || `${item.district}, ${item.province}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(item.projectId, item.projectName)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="trash-2" size={18} color={RHSColors.red600} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Feather name="dollar-sign" size={14} color={RHSColors.green600} />
          <Text style={styles.metaText}>{priceRange(item.minPrice, item.maxPrice)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="maximize" size={14} color={RHSColors.blue700} />
          <Text style={styles.metaText}>
            {item.minArea > 0 ? `${item.minArea} – ${item.maxArea} m²` : `${item.maxArea} m²`}
          </Text>
        </View>
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

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconWrap}>
          <Feather name="heart" size={40} color={RHSColors.govRed} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có dự án quan tâm</Text>
        <Text style={styles.emptyDesc}>
          Nhấn vào biểu tượng trái tim ở mỗi dự án để lưu lại tại đây
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      <LinearGradient
        colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Quan tâm</Text>
        <Text style={styles.subtitle}>
          {items.length > 0 ? `${items.length} dự án đã lưu` : 'Các dự án bạn đã lưu'}
        </Text>
      </LinearGradient>

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
    backgroundColor: RHSColors.surface,
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
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RHSColors.white,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: RHSColors.white,
    borderRadius: 20,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    width: '100%',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffe5e7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: RHSColors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: RHSColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    marginBottom: 4,
  },
  projectLocation: {
    fontSize: 13,
    color: RHSColors.textMuted,
  },
  removeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
  },
  cardMeta: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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