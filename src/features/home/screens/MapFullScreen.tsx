import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2lyeGlhb2xpbjJrNCIsImEiOiJjbXE2NXI3aXIwMWdqMnRwdTloemM4am9zIn0.AQVt7JOUOcycgp-G49qwOA';
const { width, height } = Dimensions.get('window');

interface Props {
  route: {
    params: {
      latitude: number;
      longitude: number;
      projectName: string;
    };
  };
  navigation: any;
}

export const MapFullScreen = ({ route, navigation }: Props) => {
  const { latitude, longitude, projectName } = route.params;
  const webViewRef = useRef<WebView>(null);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; touch-action: manipulation; }
        body { font-family: sans-serif; background: #000; }
        #map { width: 100vw; height: 100vh; }
        .marker {
          width: 36px; height: 36px; border-radius: 50%;
          background: #e63946; border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .marker svg { width: 18px; height: 18px; fill: #fff; }

        /* Move navigation controls higher */
        .mapboxgl-ctrl-top-right {
          top: 100px !important;
          right: 12px !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = '${MAPBOX_TOKEN}';

        // Fix touch events for mobile
        mapboxgl.setRTLTextPlugin(
          'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
          null,
          true
        );

        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [${longitude}, ${latitude}],
          zoom: 15,
          pitch: 60,
          bearing: 30,
          attributionControl: false,
          dragRotate: true,
          touchZoomRotate: true,
          touchPitch: true,
          boxZoom: true,
          scrollZoom: true,
          dragPan: true,
          keyboard: false,
          doubleClickZoom: true,
          cooperativeGestures: false,
        });

        // Navigation controls - positioned higher via CSS
        const nav = new mapboxgl.NavigationControl({
          showCompass: false,
          visualizePitch: false,
        });
        map.addControl(nav, 'top-right');

        // Marker
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
        new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([${longitude}, ${latitude}])
          .addTo(map);

        // Popup
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setLngLat([${longitude}, ${latitude}])
          .setHTML('<strong>${projectName}</strong>')
          .addTo(map);

        // 3D buildings after load
        map.on('load', () => {
          map.flyTo({ center: [${longitude}, ${latitude}], zoom: 15, duration: 500 });
          map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.8
            }
          });
        });

        // Prevent default touch behavior that blocks pinch-zoom
        document.addEventListener('touchmove', function(e) {
          if (e.target.closest('#map')) {
            e.stopPropagation();
          }
        }, { passive: true });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Header overlay */}
      <LinearGradient
        colors={['#023e8a', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerOverlay}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{projectName}</Text>
          <Text style={styles.headerSub}>Bản đồ 3D</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Map WebView - scrollEnabled=true for pinch-zoom support */}
      <WebView
        ref={webViewRef}
        source={{ html }}
        javaScriptEnabled
        scrollEnabled
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.map}
      />

      {/* Bottom bar */}
      <LinearGradient
        colors={['transparent', '#023e8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bottomBar}
      >
        <View style={styles.coordRow}>
          <Feather name="map-pin" size={14} color="#fff" />
          <Text style={styles.coordText}>
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
    width,
    height,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace',
  },
});