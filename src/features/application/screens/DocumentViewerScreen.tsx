import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { appAlert } from '../../../lib/appDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { ApplicationStackParamList } from '../navigation/ApplicationNavigator';

type DocumentViewerRouteProp = RouteProp<ApplicationStackParamList, 'DocumentViewer'>;

/** Android WebView không render file:// PDF — render qua PDF.js + base64 (HiDPI để không mờ). */
function buildPdfHtml(base64: string): string {
  const safe = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
  <style>
    html, body { margin: 0; padding: 0; background: #525659; }
    #c { padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    canvas { display: block; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); }
    .err { color: #fff; padding: 24px; font-family: sans-serif; text-align: center; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <div id="c"><p class="err">Đang render PDF…</p></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    (async function () {
      var box = document.getElementById('c');
      try {
        var raw = atob('${safe}');
        var data = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) data[i] = raw.charCodeAt(i);
        var pdf = await pdfjsLib.getDocument({ data: data }).promise;
        box.innerHTML = '';
        var dpr = Math.min(window.devicePixelRatio || 1, 3);
        var cssWidth = Math.max(280, window.innerWidth - 16);
        for (var p = 1; p <= pdf.numPages; p++) {
          var page = await pdf.getPage(p);
          var base = page.getViewport({ scale: 1 });
          var fitScale = cssWidth / base.width;
          var renderScale = Math.max(1.5, fitScale * dpr);
          var viewport = page.getViewport({ scale: renderScale });
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d', { alpha: false });
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = Math.floor(viewport.width / dpr) + 'px';
          canvas.style.height = Math.floor(viewport.height / dpr) + 'px';
          box.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport: viewport, intent: 'display' }).promise;
        }
      } catch (e) {
        box.innerHTML = '<p class="err">Không hiển thị được PDF. Hãy dùng nút Tải xuống.<br/>' +
          (e && e.message ? e.message : '') + '</p>';
      }
    })();
  </script>
</body>
</html>`;
}

export const DocumentViewerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<DocumentViewerRouteProp>();
  const { fileUrl, title } = route.params;

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [viewerHtml, setViewerHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepareViewer = useCallback(async (fileUri: string) => {
    setLocalUri(fileUri);
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    setViewerHtml(buildPdfHtml(base64));
  }, []);

  const loadPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLocalUri(null);
    setViewerHtml(null);

    try {
      if (!fileUrl || !/^https?:\/\//i.test(fileUrl)) {
        setError('Không tìm thấy đường dẫn giấy tờ hợp lệ.');
        return;
      }
      const dir = FileSystem.documentDirectory;
      if (!dir) throw new Error('Không truy cập được bộ nhớ máy để lưu file.');
      const fileUri = `${dir}doc_${Date.now()}.pdf`;
      const result = await FileSystem.downloadAsync(fileUrl, fileUri);
      if (result.status && result.status >= 400) {
        throw new Error(`Máy chủ trả về lỗi ${result.status} khi tải giấy tờ.`);
      }
      await prepareViewer(result.uri);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Không thể tải giấy tờ. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fileUrl, prepareViewer]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  const handleDownload = useCallback(async () => {
    if (!localUri) {
      appAlert('Lỗi', 'Chưa có file để lưu.');
      return;
    }
    try {
      setDownloadProgress(true);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Lưu / mở giấy tờ',
        });
      } else {
        appAlert('Tải xuống thành công', `File đã lưu tại: ${localUri}`);
      }
    } catch (e: any) {
      appAlert('Tải xuống thất bại', e?.message || 'Không thể lưu file.');
    } finally {
      setDownloadProgress(false);
    }
  }, [localUri]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="x" size={24} color={RHSColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Xem giấy tờ'}
        </Text>
        <TouchableOpacity onPress={handleDownload} style={styles.headerBtn} disabled={!localUri}>
          <Feather name="external-link" size={20} color={localUri ? RHSColors.blue700 : RHSColors.grey300} />
        </TouchableOpacity>
      </View>

      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
          <Text style={styles.loadingText}>Đang tải giấy tờ...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={RHSColors.red600} />
          <Text style={styles.errorTitle}>Không thể mở giấy tờ</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadPdf} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : viewerHtml ? (
        <WebView
          source={{ html: viewerHtml, baseUrl: 'https://cdnjs.cloudflare.com/' }}
          style={styles.webView}
          onLoad={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { description } = syntheticEvent.nativeEvent;
            setError(description || 'Không thể hiển thị file PDF.');
            setLoading(false);
          }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => <View />}
        />
      ) : null}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          activeOpacity={0.9}
          disabled={downloadProgress || !localUri}
        >
          {downloadProgress ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.downloadBtnText}>Đang xử lý...</Text>
            </>
          ) : (
            <>
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.downloadBtnText}>Tải xuống & Lưu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey200,
    backgroundColor: '#fff',
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: RHSColors.text, flex: 1, textAlign: 'center' },
  webView: { flex: 1, backgroundColor: RHSColors.grey100 },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: RHSColors.textSecondary, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: RHSColors.text, marginTop: 8 },
  errorMessage: { fontSize: 14, color: RHSColors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    gap: 8,
    marginTop: 8,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: RHSColors.grey200,
    backgroundColor: '#fff',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.blue700,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  downloadBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
