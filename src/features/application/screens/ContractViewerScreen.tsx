import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';
import { ApplicationStackParamList } from '../navigation/ApplicationNavigator';

type ContractViewerRouteProp = RouteProp<ApplicationStackParamList, 'ContractViewer'>;

export const ContractViewerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ContractViewerRouteProp>();
  const { pdfUrl, title } = route.params;

  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleDownload = useCallback(async () => {
    if (!pdfUrl) {
      Alert.alert('Lỗi', 'Không có đường dẫn hợp đồng');
      return;
    }

    try {
      setDownloadProgress(true);

      // Generate a filename
      const fileName = `hop_dong_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      setDownloadProgress(false);

      // Try to open/share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Lưu hợp đồng',
        });
      } else {
        // Fallback: open in browser
        Alert.alert(
          'Tải xuống thành công',
          `Hợp đồng đã được tải về: ${downloadResult.uri}`,
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: 'Mở bằng trình duyệt',
              onPress: () => {
                Linking.openURL(pdfUrl);
              },
            },
          ]
        );
      }
    } catch (e: any) {
      setDownloadProgress(false);
      const msg = e?.message || 'Không thể tải xuống hợp đồng';
      Alert.alert('Tải xuống thất bại', msg);
    }
  }, [pdfUrl]);

  const handleOpenInBrowser = useCallback(() => {
    if (pdfUrl) {
      Linking.openURL(pdfUrl);
    }
  }, [pdfUrl]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
  };

  // Ensure we have a valid PDF URL
  if (!pdfUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
            <Feather name="x" size={24} color={RHSColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Hợp đồng'}
          </Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="file" size={48} color={RHSColors.grey300} />
          <Text style={styles.emptyTitle}>Không có hợp đồng</Text>
          <Text style={styles.emptyDesc}>
            Hợp đồng chưa được tạo hoặc không có sẵn để xem.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
          <Feather name="x" size={24} color={RHSColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Hợp đồng nguyên tắc'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleOpenInBrowser} style={styles.headerBtn}>
            <Feather name="external-link" size={20} color={RHSColors.blue700} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Loading overlay ── */}
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
          <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
        </View>
      )}

      {/* ── Error state ── */}
      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={RHSColors.red600} />
          <Text style={styles.errorTitle}>Không thể tải hợp đồng</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.openBrowserBtn}
            onPress={handleOpenInBrowser}
            activeOpacity={0.8}
          >
            <Feather name="external-link" size={16} color={RHSColors.blue700} />
            <Text style={styles.openBrowserBtnText}>Mở bằng trình duyệt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── PDF WebView ── */
        <WebView
          source={{
            uri: pdfUrl,
            headers: {
              'Content-Type': 'application/pdf',
              Accept: 'application/pdf',
            },
          }}
          style={styles.webView}
          onLoad={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { description } = syntheticEvent.nativeEvent;
            setError(description || 'Không thể tải file PDF');
            setLoading(false);
          }}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowUniversalAccessFromFileURLs
          startInLoadingState
          renderLoading={() => <View />}
        />
      )}

      {/* ── Bottom action bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          activeOpacity={0.9}
          disabled={downloadProgress}
        >
          {downloadProgress ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.downloadBtnText}>Đang tải...</Text>
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
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: RHSColors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  webView: {
    flex: 1,
    backgroundColor: RHSColors.grey100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: RHSColors.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RHSColors.text,
    marginTop: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
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
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  openBrowserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.blue700,
    gap: 8,
    marginTop: 8,
  },
  openBrowserBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.blue700,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RHSColors.text,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Bottom Bar ──
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
  downloadBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});