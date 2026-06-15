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
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { RHSColors, borderRadius, shadows, typography, spacing } from '../../../lib/theme';
import { HousingProjectResponse } from '../api/housingApi';
import { HomeStackParamList } from '../navigation/HomeNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { getToken } from '../../../lib/tokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DetailNavProp = NativeStackNavigationProp<HomeStackParamList, 'HousingProjectDetail'>;

const VERIFIED_KEY = 'identityVerified';
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2lyeGlhb2xpbjJrNCIsImEiOiJjbXE2NXI3aXIwMWdqMnRwdTloemM4am9zIn0.AQVt7JOUOcycgp-G49qwOA';
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props { route: { params: { project: HousingProjectResponse } }; navigation: any; }

interface LatLng { latitude: number; longitude: number; }

const VIETNAM_FALLBACK: LatLng = { latitude: 21.0285, longitude: 105.8542 };

export const HousingProjectDetailScreen = ({ route }: Props) => {
  const navigation = useNavigation<DetailNavProp>();
  const { project } = route.params;
  const carouselRef = useRef<FlatList>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fullAddress = [project.province, project.district, project.address].filter(Boolean).join(', ');
  const sortedImages = project.images?.length
    ? [...project.images].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  useEffect(() => { geocode(fullAddress); }, []);

  const geocode = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      const enc = encodeURIComponent(address);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${enc}.json?access_token=${MAPBOX_TOKEN}&country=VN&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        setCoords({ latitude: lat, longitude: lng });
      } else {
        const fbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(project.province)}.json?access_token=${MAPBOX_TOKEN}&country=VN&limit=1`;
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();
        if (fbData.features?.length > 0) {
          const [lng, lat] = fbData.features[0].center;
          setCoords({ latitude: lat, longitude: lng });
        } else {
          setCoords(VIETNAM_FALLBACK);
          setError('Không thể xác định vị trí chính xác');
        }
      }
    } catch {
      setCoords(VIETNAM_FALLBACK);
      setError('Không thể tải bản đồ');
    } finally { setLoading(false); }
  };

  const openFullMap = () => {
    if (!coords) return;
    navigation.navigate('MapFull', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      projectName: project.projectName,
    });
  };

  const handleRegister = async () => {
    try {
      const rootNav = navigation.getParent()?.getParent();
      const accessToken = await getToken();
      if (!accessToken) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để đăng ký nhà ở xã hội.', [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => rootNav?.navigate('Auth', { screen: 'Login' }) },
        ]);
        return;
      }
      const verified = await AsyncStorage.getItem(VERIFIED_KEY);
      if (verified !== 'true') {
        Alert.alert('Chưa xác minh danh tính', 'Bạn cần xác thực danh tính trước khi đăng ký.', [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Xác minh ngay', onPress: () => rootNav?.navigate('EKyc') },
        ]);
        return;
      }
      Alert.alert('Thông báo', 'Tính năng tạo đơn đăng ký đang được phát triển.');
    } catch { Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.'); }
  };

  const onScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImageIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }, []);

  const renderCarouselItem = ({ item }: { item: { id: string; imageUrl: string; displayOrder: number } }) => (
    <Image source={{ uri: item.imageUrl }} style={styles.carouselImage} />
  );

  const mapHtml = coords ? `
    <!DOCTYPE html><html><head>
    <meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet"/>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif}#map{width:100vw;height:100vh}
    .marker{width:32px;height:32px;border-radius:50%;background:#D32F2F;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center}
    .marker svg{width:18px;height:18px;fill:#fff}</style></head><body><div id="map"></div><script>
    mapboxgl.accessToken='${MAPBOX_TOKEN}';
    const map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/streets-v12',center:[${coords.longitude},${coords.latitude}],zoom:15,attributionControl:false});
    map.on('load',()=>{map.flyTo({center:[${coords.longitude},${coords.latitude}],zoom:15,duration:800})});
    map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-left');
    const el=document.createElement('div');el.className='marker';
    el.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
    new mapboxgl.Marker({element:el,anchor:'bottom'}).setLngLat([${coords.longitude},${coords.latitude}]).addTo(map);
    </script></body></html>` : '';

  const fmtPrice = (min: number, max: number) => {
    if (min === 0 && max === 0) return 'Liên hệ';
    if (min >= 1e9) return min === max ? `${min/1e9} tỷ` : `${min/1e9} - ${max/1e9} tỷ`;
    if (min >= 1e6) return min === max ? `${min/1e6} triệu` : `${min/1e6} - ${max/1e6} triệu`;
    return `${min.toLocaleString()}đ`;
  };

  const fmtArea = (min: number, max: number) => {
    if (min === 0 && max === 0) return '';
    return min === max ? `${min} m²` : `${min} - ${max} m²`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.red600 }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.amber600 }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.blue700 }]} />
      </View>
      <LinearGradient colors={['#0A3A85','#1565C0','#1E88E5']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff"/>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết dự án</Text>
        <View style={{ width: 36 }}/>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Carousel */}
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

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.name}>{project.projectName}</Text>
          <View style={styles.row}>
            <View style={styles.chip}>
              <Feather name="dollar-sign" size={13} color={RHSColors.red600}/>
              <Text style={[styles.chipText, {color: RHSColors.red600}]}>{fmtPrice(project.minPrice, project.maxPrice)}</Text>
            </View>
            {fmtArea(project.minArea, project.maxArea) ? (
              <View style={[styles.chip, {backgroundColor: RHSColors.blue50}]}>
                <Feather name="maximize" size={13} color={RHSColors.blue700}/>
                <Text style={[styles.chipText, {color: RHSColors.blue700}]}>{fmtArea(project.minArea, project.maxArea)}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.detailRow}><Feather name="map-pin" size={15} color={RHSColors.blue700}/><Text style={styles.detailText}>{fullAddress}</Text></View>
          <View style={styles.detailRow}><Feather name="users" size={15} color={RHSColors.textMuted}/><Text style={styles.detailText}>Còn lại: <Text style={{color:RHSColors.red600, fontWeight:'700'}}>{project.availableUnits}</Text> căn hộ</Text></View>
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

        {/* Register */}
        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.9}>
          <LinearGradient colors={[RHSColors.red600,'#B71C1C']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.registerGrad}>
            <Feather name="edit-3" size={18} color="#fff"/>
            <Text style={styles.registerText}>Đăng ký nhà ở</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 40 }}/>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  bar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  carouselWrap: { width: '100%', height: 260, position: 'relative' },
  carouselImage: { width: SCREEN_WIDTH, height: 260, resizeMode: 'cover' },
  thumbPlace: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.grey100 },
  dotsWrap: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4 },
  dotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  counter: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  statusBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: RHSColors.green600, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  infoCard: { margin: 14, padding: 18, backgroundColor: '#fff', borderRadius: borderRadius.xl, ...shadows.md },
  name: { ...typography.h2, color: RHSColors.text, marginBottom: 12, lineHeight: 28 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: RHSColors.red50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  chipText: { fontSize: 13, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  detailText: { ...typography.bodySmall, color: RHSColors.text, marginLeft: 8, flex: 1, lineHeight: 20 },

  card: { marginHorizontal: 14, marginBottom: 14, padding: 18, backgroundColor: '#fff', borderRadius: borderRadius.xl, ...shadows.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { ...typography.h3, color: RHSColors.text, marginLeft: 8 },
  desc: { ...typography.bodySmall, color: RHSColors.textSecondary, lineHeight: 22 },

  mapLoad: { height: 240, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.grey100, borderRadius: borderRadius.md },
  mapLoadText: { marginTop: 8, ...typography.bodySmall, color: RHSColors.textMuted },
  mapOuter: { borderRadius: borderRadius.md, overflow: 'hidden' },
  map: { width: SCREEN_WIDTH - 64, height: 240 },
  errBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: RHSColors.amber50, paddingHorizontal: 12, paddingVertical: 8 },
  errText: { fontSize: 12, color: RHSColors.textMuted, marginLeft: 6 },
  openBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: RHSColors.blue700, paddingVertical: 12, gap: 6 },
  openText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  registerBtn: { marginHorizontal: 14, borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.floating },
  registerGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  registerText: { ...typography.button, color: '#fff' },
});