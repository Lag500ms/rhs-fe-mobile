import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { ApplicationStackParamList } from '../navigation/ApplicationNavigator';
import { paymentApi } from '../../payment/api/paymentApi';
import { contractSignApi } from '../api/contractSignApi';

type ContractViewerRouteProp = RouteProp<ApplicationStackParamList, 'ContractViewer'>;

export const ContractViewerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ContractViewerRouteProp>();
  const { applicationId, pdfUrl, title, canSign } = route.params;

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleClose = () => {
    navigation.goBack();
  };

  const loadSignStatus = useCallback(async () => {
    if (!applicationId || !canSign) return;
    try {
      const status = await contractSignApi.getStatus(applicationId);
      if (status) {
        setIsSigned(status.isSigned);
        setSignedAt(status.signedAt || null);
      }
    } catch {
      // ignore — PDF vẫn xem được
    }
  }, [applicationId, canSign]);

  const loadPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLocalUri(null);

    try {
      if (applicationId) {
        const uri = await paymentApi.downloadContractToFile(applicationId);
        setLocalUri(uri);
        return;
      }

      if (pdfUrl && /^https?:\/\//i.test(pdfUrl)) {
        const fileName = `doc_${Date.now()}.pdf`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const result = await FileSystem.downloadAsync(pdfUrl, fileUri);
        setLocalUri(result.uri);
        return;
      }

      setError('Không có hợp đồng hoặc thiếu mã hồ sơ để tải.');
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Không thể tải file PDF. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [applicationId, pdfUrl]);

  useEffect(() => {
    loadPdf();
    loadSignStatus();
  }, [loadPdf, loadSignStatus]);

  const handleDownload = useCallback(async () => {
    if (!localUri) {
      Alert.alert('Lỗi', 'Chưa có file để lưu');
      return;
    }

    try {
      setDownloadProgress(true);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Lưu hợp đồng',
        });
      } else {
        Alert.alert('Tải xuống thành công', `File đã lưu tại: ${localUri}`);
      }
    } catch (e: any) {
      Alert.alert('Tải xuống thất bại', e?.message || 'Không thể lưu file');
    } finally {
      setDownloadProgress(false);
    }
  }, [localUri]);

  const handleOpenInBrowser = useCallback(() => {
    if (pdfUrl && /^https?:\/\//i.test(pdfUrl)) {
      Linking.openURL(pdfUrl);
      return;
    }
    if (localUri) {
      Linking.openURL(localUri).catch(() => {
        Alert.alert('Thông báo', 'Không mở được file bằng trình duyệt. Hãy dùng nút Tải xuống.');
      });
    }
  }, [pdfUrl, localUri]);

  const handleSign = () => {
    if (!applicationId || !agreed) return;
    Alert.alert(
      'Xác nhận ký hợp đồng',
      'Bạn đồng ý với toàn bộ điều khoản hợp đồng nguyên tắc? Hệ thống sẽ ghi nhận chữ ký điện tử (không dùng OTP).',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý & Ký',
          onPress: async () => {
            setSigning(true);
            try {
              const result = await contractSignApi.sign(applicationId);
              if (result.success) {
                setIsSigned(true);
                setSignedAt(result.data?.signedAt || new Date().toISOString());
                Alert.alert('Thành công', result.message || 'Đã ký hợp đồng nguyên tắc.');
              } else {
                Alert.alert('Không ký được', result.message || 'Vui lòng thử lại.');
              }
            } catch (e: any) {
              Alert.alert('Lỗi', e?.response?.data?.message || e?.message || 'Không ký được hợp đồng.');
            } finally {
              setSigning(false);
            }
          },
        },
      ],
    );
  };

  const handleRetry = () => {
    loadPdf();
    loadSignStatus();
  };

  if (!applicationId && !pdfUrl) {
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

  const showSignPanel = !!canSign && !!applicationId;

  return (
    <SafeAreaView style={styles.safe}>
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

      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
          <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={RHSColors.red600} />
          <Text style={styles.errorTitle}>Không thể tải hợp đồng</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : localUri ? (
        <WebView
          source={{ uri: localUri }}
          style={styles.webView}
          onLoad={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { description } = syntheticEvent.nativeEvent;
            setError(description || 'Không thể hiển thị file PDF');
            setLoading(false);
          }}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowUniversalAccessFromFileURLs
          originWhitelist={['*']}
          startInLoadingState
          renderLoading={() => <View />}
        />
      ) : null}

      <View style={styles.bottomBar}>
        {showSignPanel && (
          <View style={styles.signPanel}>
            {isSigned ? (
              <View style={styles.signedRow}>
                <Feather name="check-circle" size={18} color={RHSColors.green600} />
                <Text style={styles.signedText}>
                  Đã ký{signedAt ? ` · ${new Date(signedAt).toLocaleString('vi-VN')}` : ''}
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.agreeRow}
                  onPress={() => setAgreed((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                    {agreed && <Feather name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.agreeText}>Tôi đã đọc và đồng ý điều khoản hợp đồng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signBtn, (!agreed || signing) && styles.btnDisabled]}
                  onPress={handleSign}
                  disabled={!agreed || signing}
                  activeOpacity={0.9}
                >
                  {signing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Feather name="edit-3" size={18} color="#fff" />
                      <Text style={styles.signBtnText}>Đồng ý & Ký hợp đồng</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          activeOpacity={0.9}
          disabled={downloadProgress || !localUri}
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
  headerActions: { flexDirection: 'row', gap: 4 },
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: RHSColors.text, marginTop: 8 },
  emptyDesc: { fontSize: 14, color: RHSColors.textMuted, textAlign: 'center', lineHeight: 20 },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: RHSColors.grey200,
    backgroundColor: '#fff',
    gap: 10,
  },
  signPanel: { gap: 10 },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: RHSColors.grey400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: RHSColors.blue700, borderColor: RHSColors.blue700 },
  agreeText: { flex: 1, fontSize: 13, color: RHSColors.textSecondary, lineHeight: 18 },
  signBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.green600,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    gap: 8,
    minHeight: 48,
  },
  signBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  signedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  signedText: { fontSize: 13, fontWeight: '600', color: RHSColors.green700, flex: 1 },
  btnDisabled: { opacity: 0.5 },
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
