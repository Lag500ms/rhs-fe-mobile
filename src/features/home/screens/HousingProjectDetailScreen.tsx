import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, typography, spacing } from '../../../lib/theme';
import { HousingProjectResponse } from '../types/housing';
import { housingApi } from '../api/housingApi';
import { formatPrice, formatArea, getThumb } from '../utils/format';
import { geocode, LatLng, VIETNAM_FALLBACK, MAPBOX_TOKEN } from '../services/geocodeService';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { getToken } from '../../../lib/tokenStorage';
import { wishlistApi } from '../../saved/api/wishlistApi';
import { userApi } from '../../user/api/userApi';
import { WishlistHeart } from '../../../components/WishlistHeart';


const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props { route: { params: { project: HousingProjectResponse } }; navigation: any; }

export const HousingProjectDetailScreen = ({ route }: Props) => {
  const navigation = useNavigation<any>();
  const { project } = route.params;
  const carouselRef = useRef<FlatList>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [suggestedProjects, setSuggestedProjects] = useState<HousingProjectResponse[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  const fullAddress = [project.street, project.ward, project.district, project.province].filter(Boolean).join(', ');
  const sortedImages = project.images?.length
    ? [...project.images].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  useEffect(() => {
    geocodeAddress(fullAddress);
    checkWishlist();
    fetchSuggestedProjects();
  }, []);

  const fetchSuggestedProjects = async () => {
    if (!project.ward) return;
    setLoadingSuggested(true);
    try {
      const result = await housingApi.getSuggestedProjects(
        project.id,
        project.ward,
        [],
        5
      );
      setSuggestedProjects(result);
    } catch {
      // silently fail
    } finally {
      setLoadingSuggested(false);
    }
  };

  const checkWishlist = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const status = await wishlistApi.checkWishlistStatus(project.id);
      setIsWishlisted(status);
    } catch {}
  };

  const geocodeAddress = async (address: string) => {
    setLoading(true);
    setError(null);
    const result = await geocode(address, project.province);
    setCoords(result.coords);
    setError(result.error || null);
    setLoading(false);
  };

  const openFullMap = () => {
    if (!coords) return;
    navigation.navigate('MapFull', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      projectName: project.projectName,
    });
  };

  const toggleWishlist = async () => {
    const token = await getToken();
    if (!token) {
      const rootNav = navigation.getParent()?.getParent();
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để lưu dự án yêu thích.', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => rootNav?.navigate('Auth', { screen: 'Login' }) },
      ]);
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await wishlistApi.removeFromWishlist(project.id);
        setIsWishlisted(false);
      } else {
        await wishlistApi.addToWishlist(project.id);
        setIsWishlisted(true);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể cập nhật danh sách yêu thích.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const rootNav = navigation.getParent()?.getParent();

      // 1. Check login
      const accessToken = await getToken();
      if (!accessToken) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để đăng ký nhà ở xã hội.', [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => rootNav?.navigate('Auth', { screen: 'Login' }) },
        ]);
        return;
      }

      // 2. Check identity verified
      const profileRes = await userApi.getProfile();
      if (!profileRes?.success || !profileRes?.user?.citizenId) {
        Alert.alert('Chưa xác minh danh tính', 'Bạn cần xác thực danh tính (eKYC) trước khi đăng ký nhà ở.', [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Xác minh ngay', onPress: () => rootNav?.navigate('EKyc') },
        ]);
        return;
      }

      // 3. OK → chuyển sang Application tab
      navigation.dispatch(
        CommonActions.navigate({
          name: 'MainTabs',
          params: {
            screen: 'Applications',
            params: {
              screen: 'BasicInformation',
              params: {
                projectId: project.id,
                projectName: project.projectName,
              },
            },
          },
        })
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái tài khoản. Vui lòng thử lại.');
    }
  };

  const onScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImageIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }, []);

  const renderCarouselItem = ({ item }: { item: { id: string; imageUrl: string; displayOrder: number } }) => (
    <Image source={{ uri: item.imageUrl }} style={styles.carouselImage} />
  );

  // Blue marker for map
  const mapHtml = coords ? `
    <!DOCTYPE html><html><head>
    <meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet"/>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif}#map{width:100vw;height:100vh}
    .marker{width:32px;height:32px;border-radius:50%;background:#1565C0;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center}
    .marker svg{width:18px;height:18px;fill:#fff}</style></head><body><div id="map"></div><script>
    mapboxgl.accessToken='${MAPBOX_TOKEN}';
    const map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/streets-v12',center:[${coords.longitude},${coords.latitude}],zoom:15,attributionControl:false});
    map.on('load',()=>{map.flyTo({center:[${coords.longitude},${coords.latitude}],zoom:15,duration:800})});
    map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-left');
    const el=document.createElement('div');el.className='marker';
    el.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
    new mapboxgl.Marker({element:el,anchor:'bottom'}).setLngLat([${coords.longitude},${coords.latitude}]).addTo(map);
    </script></body></html>` : '';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Thin brand bar at top */}
      <BrandBar />

      {/* White header for functional screens */}
      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết dự án</Text>
        <WishlistHeart
          active={isWishlisted}
          loading={wishlistLoading}
          onPress={toggleWishlist}
          size={24}
          style={styles.wishlistBtn}
        />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Full-width Carousel 300px */}
        <View style={styles.carouselWrap}>
          {sortedImages.length > 0 ? (
            <>
              <FlatList ref={carouselRef} data={sortedImages} keyExtractor={i=>i.id} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} renderItem={renderCarouselItem}/>
              {sortedImages.length > 1 && (
                <View style={styles.dotsWrap}>
                  {sortedImages.map((_, i) => <View key={i} style={[styles.dot, i===activeImageIndex && styles.dotActive]}/>)}
                </View>
              )}
              <View style={styles.counter}><Text style={styles.counterText}>{activeImageIndex+1}/{sortedImages.length}</Text></View>
            </>
          ) : (
            <View style={styles.thumbPlace}><Feather name="home" size={52} color={RHSColors.grey400}/></View>
          )}
          {project.status && (
            <View style={styles.statusBadge}><Text style={styles.statusText}>{project.status}</Text></View>
          )}
        </View>

        {/* Info Card - refined chips without shadow */}
        <View style={styles.infoCard}>
          <Text style={styles.name}>{project.projectName}</Text>
          <View style={styles.row}>
            <View style={[styles.chip, { backgroundColor: '#E3F2FD' }]}>
              <Feather name="tag" size={13} color={RHSColors.blue700} />
              <Text style={[styles.chipText, {color: RHSColors.blue700}]}>{formatPrice(project.minPrice, project.maxPrice)}</Text>
            </View>
            {formatArea(project.minArea, project.maxArea) ? (
              <View style={[styles.chip, {backgroundColor: '#E3F2FD'}]}>
                <Feather name="maximize" size={13} color={RHSColors.blue700} />
                <Text style={[styles.chipText, {color: RHSColors.blue700}]}>{formatArea(project.minArea, project.maxArea)}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.detailRow}><Feather name="map-pin" size={15} color={RHSColors.blue700}/><Text style={styles.detailText}>{fullAddress}</Text></View>
          <View style={styles.detailRow}><Feather name="users" size={15} color={RHSColors.textMuted}/><Text style={styles.detailText}>Còn lại: <Text style={{color:RHSColors.blue700, fontWeight:'700'}}>{project.availableUnits}</Text> căn hộ</Text></View>
          {project.depositAmount > 0 && (
            <View style={styles.detailRow}>
              <Feather name="credit-card" size={15} color={RHSColors.textMuted}/>
              <Text style={styles.detailText}>
                Tiền đặt cọc:{' '}
                <Text style={{ color: RHSColors.blue700, fontWeight: '700' }}>
                  {project.depositAmount.toLocaleString('vi-VN')} VNĐ
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* Lịch bốc thăm công khai */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Feather name="calendar" size={16} color={RHSColors.blue700}/>
            <Text style={styles.sectionTitle}>Bốc thăm / phân suất</Text>
          </View>
          {project.lotteryDate ? (
            <>
              <Text style={styles.desc}>
                Thời gian: {new Date(project.lotteryDate).toLocaleString('vi-VN')}
              </Text>
              {!!project.lotteryLocation && (
                <Text style={[styles.desc, { marginTop: 6 }]}>
                  Địa điểm / kênh: {project.lotteryLocation}
                </Text>
              )}
              <TouchableOpacity
                style={styles.lotteryBtn}
                onPress={() =>
                  navigation.navigate('LotterySchedule', {
                    projectId: project.id,
                    projectName: project.projectName,
                  })
                }
                activeOpacity={0.85}
              >
                <Feather name="radio" size={16} color="#fff" />
                <Text style={styles.lotteryBtnText}>Xem lịch & kênh bốc thăm</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.desc}>
              Chưa công bố lịch bốc thăm. Khi số hồ sơ vượt số căn, chủ đầu tư sẽ lên lịch và thông báo.
            </Text>
          )}
        </View>

        {/* Description */}
        {project.description && (
          <View style={styles.card}>
            <View style={styles.sectionHead}><Feather name="file-text" size={16} color={RHSColors.blue700}/><Text style={styles.sectionTitle}>Mô tả dự án</Text></View>
            <Text style={styles.desc}>{project.description}</Text>
          </View>
        )}

        {/* Map */}
        <View style={styles.card}>
          <View style={styles.sectionHead}><Feather name="map" size={16} color={RHSColors.blue700}/><Text style={styles.sectionTitle}>Vị trí dự án</Text></View>
          {loading ? (
            <View style={styles.mapLoad}><ActivityIndicator size="large" color={RHSColors.blue700}/><Text style={styles.mapLoadText}>Đang xác định vị trí...</Text></View>
          ) : (
            <View style={styles.mapOuter}>
              {coords && <WebView source={{html: mapHtml}} style={styles.map} scrollEnabled={false} javaScriptEnabled/>}
              {error && <View style={styles.errBar}><Feather name="alert-triangle" size={13} color={RHSColors.amber700}/><Text style={styles.errText}>{error}</Text></View>}
              <TouchableOpacity style={styles.openBtn} onPress={openFullMap} activeOpacity={0.85}>
                <Feather name="maximize-2" size={15} color="#fff"/><Text style={styles.openText}>Xem bản đồ 3D</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Register button - BLUE */}
        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.9}>
          <View style={styles.registerGrad}>
            <Feather name="edit-3" size={18} color="#fff"/>
            <Text style={styles.registerText}>Đăng ký nhà ở</Text>
          </View>
        </TouchableOpacity>

        {/* Suggested projects - same ward */}
        {loadingSuggested ? (
          <View style={styles.suggestedWrap}>
            <ActivityIndicator size="small" color={RHSColors.blue700} />
          </View>
        ) : suggestedProjects.length > 0 ? (
          <View style={styles.suggestedWrap}>
            <View style={styles.suggestedHead}>
              <View style={styles.suggestedBadge}>
                <Feather name="map-pin" size={14} color="#fff" />
              </View>
              <Text style={styles.suggestedTitle}>Dự án cùng phường</Text>
            </View>
            {suggestedProjects.map(sp => {
              const thumb = getThumb(sp);
              return (
                <TouchableOpacity
                  key={sp.id}
                  style={styles.suggestedCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.push('HousingProjectDetail', { project: sp })}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.suggestedThumb} />
                  ) : (
                    <View style={styles.suggestedThumbPlace}>
                      <Feather name="home" size={22} color={RHSColors.grey400} />
                    </View>
                  )}
                  <View style={styles.suggestedInfo}>
                    <Text style={styles.suggestedName} numberOfLines={2}>{sp.projectName}</Text>
                    <Text style={styles.suggestedAddr} numberOfLines={1}>
                      {[sp.street, sp.ward].filter(Boolean).join(', ')}
                    </Text>
                    <View style={styles.suggestedMeta}>
                      <View style={styles.suggestedChip}>
                        <Feather name="tag" size={10} color={RHSColors.red600} />
                        <Text style={styles.suggestedChipText}>
                          {formatPrice(sp.minPrice, sp.maxPrice)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={16} color={RHSColors.grey400} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <View style={{ height: 40 }}/>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },

  // White header
  whiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  backBtn: { padding: 4, marginRight: 10 },
  wishlistBtn: { marginRight: -4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: RHSColors.blue700 },
  scroll: { flex: 1 },

  // Full-width carousel 300px
  carouselWrap: { width: '100%', height: 300, position: 'relative' },
  carouselImage: { width: SCREEN_WIDTH, height: 300, resizeMode: 'cover' },
  thumbPlace: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.grey100 },
  dotsWrap: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4 },
  dotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  counter: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  statusBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: RHSColors.green600, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Info card - no shadow, thin border
  infoCard: { margin: 14, padding: 18, backgroundColor: '#fff', borderRadius: borderRadius.md, borderWidth: 1, borderColor: RHSColors.border },
  name: { ...typography.h2, color: RHSColors.text, marginBottom: 12, lineHeight: 28 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, gap: 4 },
  chipText: { fontSize: 13, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  detailText: { ...typography.bodySmall, color: RHSColors.text, marginLeft: 8, flex: 1, lineHeight: 20 },

  // Cards
  card: { marginHorizontal: 14, marginBottom: 14, padding: 18, backgroundColor: '#fff', borderRadius: borderRadius.md, borderWidth: 1, borderColor: RHSColors.border },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { ...typography.h3, color: RHSColors.text, marginLeft: 8 },
  desc: { ...typography.bodySmall, color: RHSColors.textSecondary, lineHeight: 22 },

  // Map
  mapLoad: { height: 240, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.grey100, borderRadius: borderRadius.md },
  mapLoadText: { marginTop: 8, ...typography.bodySmall, color: RHSColors.textMuted },
  mapOuter: { borderRadius: borderRadius.md, overflow: 'hidden' },
  map: { width: SCREEN_WIDTH - 64, height: 240 },
  errBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: RHSColors.amber50, paddingHorizontal: 12, paddingVertical: 8 },
  errText: { fontSize: 12, color: RHSColors.textMuted, marginLeft: 6 },
  openBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: RHSColors.blue700, paddingVertical: 12, gap: 6 },
  openText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Suggested projects section
  suggestedWrap: { marginHorizontal: 14, marginBottom: 14, marginTop: 18 },
  suggestedHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  suggestedBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: RHSColors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  suggestedTitle: { ...typography.h3, color: RHSColors.text, flex: 1 },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: 10,
    marginBottom: 10,
  },
  suggestedThumb: { width: 62, height: 62, borderRadius: 8, resizeMode: 'cover' },
  suggestedThumbPlace: {
    width: 62,
    height: 62,
    borderRadius: 8,
    backgroundColor: RHSColors.grey100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedInfo: { flex: 1, marginLeft: 10 },
  suggestedName: { fontSize: 13, fontWeight: '700', color: RHSColors.text, lineHeight: 18 },
  suggestedAddr: { fontSize: 11, color: RHSColors.textMuted, marginTop: 2 },
  suggestedMeta: { flexDirection: 'row', marginTop: 4 },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.red50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  suggestedChipText: { fontSize: 10, fontWeight: '700', color: RHSColors.red600 },

  // Lottery CTA
  lotteryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
  },
  lotteryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Register button - BLUE no gradient
  registerBtn: { marginHorizontal: 14, borderRadius: borderRadius.md, overflow: 'hidden' },
  registerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    backgroundColor: RHSColors.blue700,
  },
  registerText: { ...typography.button, color: '#fff' },

});