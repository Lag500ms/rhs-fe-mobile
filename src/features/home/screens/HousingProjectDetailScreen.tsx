import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { RHSColors } from '../../../lib/theme';
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

interface Props {
  route: { params: { project: HousingProjectResponse } };
  navigation: any;
}

interface LatLng { latitude: number; longitude: number; }

const VIETNAM_FALLBACK: LatLng = { latitude: 21.0285, longitude: 105.8542 };

export const HousingProjectDetailScreen = ({ route }: Props) => {
  const navigation = useNavigation<DetailNavProp>();
  const { project } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fullAddress = [project.province, project.district, project.address]
    .filter(Boolean).join(', ');

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
      // Navigate to root to access Auth/EKyc screens
      const rootNav = navigation.getParent()?.getParent();

      // 1. Kiểm tra đã đăng nhập chưa
      const accessToken = await getToken();
      if (!accessToken) {
        Alert.alert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập để đăng ký nhà ở xã hội.',
          [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => rootNav?.navigate('Auth', { screen: 'Login' }) },
          ],
        );
        return;
      }

      // 2. Kiểm tra đã xác minh danh tính chưa
      const verified = await AsyncStorage.getItem(VERIFIED_KEY);
      if (verified !== 'true') {
        Alert.alert(
          'Chưa xác minh danh tính',
          'Bạn cần xác thực danh tính trước khi đăng ký nhà ở xã hội.',
          [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Xác minh ngay', onPress: () => rootNav?.navigate('EKyc') },
          ],
        );
        return;
      }

      // 3. Đã đăng nhập + đã xác minh → chuyển qua tạo đơn
      // TODO: Navigate to CreateApplicationScreen when implemented
      Alert.alert('Thông báo', 'Tính năng tạo đơn đăng ký đang được phát triển.');
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  // Build Mapbox GL HTML
  const mapHtml = coords ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: sans-serif; }
        #map { width: 100vw; height: 100vh; }
        .marker {
          width: 32px; height: 32px; border-radius: 50%;
          background: #e63946; border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .marker svg { width: 18px; height: 18px; fill: #fff; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = '${MAPBOX_TOKEN}';
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [${coords.longitude}, ${coords.latitude}],
          zoom: 15,
          attributionControl: false,
        });

        // Ensure marker is centered on load
        map.on('load', () => {
          map.flyTo({
            center: [${coords.longitude}, ${coords.latitude}],
            zoom: 15,
            duration: 800,
          });
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
        new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([${coords.longitude}, ${coords.latitude}])
          .addTo(map);
      </script>
    </body>
    </html>
  ` : '';

  const formatPrice = (min: number, max: number) => {
    if (min === 0 && max === 0) return 'Liên hệ';
    if (min >= 1e9) return min === max ? `${min/1e9} tỷ` : `${min/1e9} - ${max/1e9} tỷ`;
    if (min >= 1e6) return min === max ? `${min/1e6} triệu` : `${min/1e6} - ${max/1e6} triệu`;
    return `${min.toLocaleString()} - ${max.toLocaleString()} VNĐ`;
  };

  const formatArea = (min: number, max: number) => {
    if (min === 0 && max === 0) return '';
    return min === max ? `${min} m²` : `${min} - ${max} m²`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.govRed }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.govGold }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.govBlue }]} />
      </View>
      <LinearGradient colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết dự án</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.thumb}>
          {project.thumbnailUrl ? <Image source={{ uri: project.thumbnailUrl }} style={styles.thumbImg} /> : (
            <View style={styles.thumbPlace}><Feather name="home" size={60} color={RHSColors.textMuted} /></View>
          )}
          {project.status && <View style={[styles.badge, { backgroundColor: RHSColors.govGreen }]}><Text style={styles.badgeText}>{project.status}</Text></View>}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.name}>{project.projectName}</Text>
          <View style={styles.row}>
            <View style={[styles.chip, { backgroundColor: '#ffebee' }]}>
              <Feather name="dollar-sign" size={14} color={RHSColors.govRed} />
              <Text style={[styles.chipText, { color: RHSColors.govRed }]}>{formatPrice(project.minPrice, project.maxPrice)}</Text>
            </View>
            {formatArea(project.minArea, project.maxArea) ? (
              <View style={[styles.chip, { backgroundColor: '#e0f7fa' }]}>
                <Feather name="maximize" size={14} color={RHSColors.govTeal} />
                <Text style={[styles.chipText, { color: RHSColors.govTeal }]}>{formatArea(project.minArea, project.maxArea)}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.detail}><Feather name="map-pin" size={16} color={RHSColors.govBlueDark} /><Text style={styles.detailText}>{fullAddress}</Text></View>
          <View style={styles.detail}><Feather name="users" size={16} color={RHSColors.textMuted} /><Text style={styles.detailText}>Còn lại: <Text style={{ color: RHSColors.govRed, fontWeight: 'bold' }}>{project.availableUnits}</Text> căn hộ</Text></View>
        </View>

        {project.description && (
          <View style={styles.card}>
            <View style={styles.sectionHead}><Feather name="file-text" size={18} color={RHSColors.govBlueDark} /><Text style={styles.sectionTitle}>Mô tả dự án</Text></View>
            <Text style={styles.desc}>{project.description}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHead}><Feather name="map" size={18} color={RHSColors.govBlueDark} /><Text style={styles.sectionTitle}>Vị trí dự án</Text></View>
          {loading ? (
            <View style={styles.mapLoad}><ActivityIndicator size="large" color={RHSColors.govRed} /><Text style={styles.mapLoadText}>Đang xác định vị trí...</Text></View>
          ) : (
            <View style={styles.mapOuter}>
              {coords && <WebView ref={webViewRef} source={{ html: mapHtml }} style={styles.map} scrollEnabled={false} javaScriptEnabled />}
              {error && <View style={styles.errBar}><Feather name="alert-triangle" size={14} color={RHSColors.govGoldDark} /><Text style={styles.errText}>{error}</Text></View>}
              <TouchableOpacity style={styles.openBtn} onPress={openFullMap}><Feather name="maximize-2" size={16} color="#fff" /><Text style={styles.openText}>Xem bản đồ 3D</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
          <LinearGradient
            colors={[RHSColors.govRed, '#c1121f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.registerGradient}
          >
            <Feather name="edit-3" size={20} color="#fff" />
            <Text style={styles.registerText}>Đăng ký nhà ở</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  bar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff' },
  scroll: { flex: 1 },
  thumb: { width: '100%', height: 250, position: 'relative' },
  thumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlace: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface },
  badge: { position: 'absolute', top: 16, left: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  infoCard: { margin: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: RHSColors.border },
  name: { fontSize: 22, fontWeight: 'bold', color: RHSColors.govBlueDark, marginBottom: 14, lineHeight: 28 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 25 },
  chipText: { fontSize: 14, fontWeight: '700', marginLeft: 6 },
  detail: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  detailText: { fontSize: 14, color: RHSColors.text, marginLeft: 10, flex: 1, lineHeight: 20 },
  card: { marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: RHSColors.border },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: RHSColors.govBlueDark, marginLeft: 10 },
  desc: { fontSize: 14, color: RHSColors.text, lineHeight: 22 },
  mapLoad: { height: 280, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface, borderRadius: 12 },
  mapLoadText: { marginTop: 10, fontSize: 14, color: RHSColors.textMuted },
  mapOuter: { borderRadius: 12, overflow: 'hidden' },
  map: { width: SCREEN_WIDTH - 72, height: 280 },
  errBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: RHSColors.surface, paddingHorizontal: 12, paddingVertical: 8 },
  errText: { fontSize: 12, color: RHSColors.textMuted, marginLeft: 6 },
  openBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: RHSColors.govBlue, paddingVertical: 14, marginTop: 1 },
  openText: { fontSize: 14, fontWeight: '600', color: '#fff', marginLeft: 8 },
  registerBtn: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: RHSColors.govRed, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  registerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  registerText: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
});