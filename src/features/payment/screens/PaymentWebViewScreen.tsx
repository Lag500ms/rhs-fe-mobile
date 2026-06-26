import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { PaymentStackParamList } from '../navigation/PaymentNavigator';

type PaymentWebViewRouteProp = RouteProp<PaymentStackParamList, 'PaymentWebView'>;

export const PaymentWebViewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentWebViewRouteProp>();
  const { paymentUrl, orderId, applicationId } = route.params;

  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigationChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    // Detect VNPay callback redirect patterns
    const callbackPatterns = [
      'payment-callback',
      'vnp_ResponseCode',
    ];

    const isCallback = callbackPatterns.some((pattern) => url.includes(pattern));

    if (!isCallback) return;

    // Navigate to processing screen
    navigation.replace('PaymentProcessing', {
      orderId,
      applicationId,
      projectName: '',
      depositAmount: 0,
    });
  };

  const handleError = () => {
    setError('Không thể tải trang thanh toán. Vui lòng kiểm tra kết nối và thử lại.');
    setLoading(false);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
            <Feather name="x" size={24} color={RHSColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={RHSColors.red600} />
          <Text style={styles.errorTitle}>Không thể tải trang thanh toán</Text>
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
            style={styles.cancelBtn}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
          <Feather name="x" size={24} color={RHSColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cổng thanh toán VNPay</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
          <Text style={styles.loadingText}>Đang kết nối cổng thanh toán...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        style={styles.webView}
        onNavigationStateChange={handleNavigationChange}
        onLoad={() => setLoading(false)}
        onError={handleError}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => <View />}
      />
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
  webView: {
    flex: 1,
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
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.textSecondary,
  },
});