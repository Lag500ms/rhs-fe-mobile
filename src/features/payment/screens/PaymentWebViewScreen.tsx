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
import { paymentApi } from '../api/paymentApi';

type PaymentWebViewRouteProp = RouteProp<PaymentStackParamList, 'PaymentWebView'>;

export const PaymentWebViewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentWebViewRouteProp>();
  const { paymentUrl, orderId, applicationId } = route.params;

  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const callbackHandledRef = useRef(false);

  /**
   * Detect VNPay callback redirect.
   * Note: Must check for `vnp_ResponseCode` specifically — the initial VNPay
   * payment URL also contains `payment-callback` inside the `vnp_ReturnUrl`
   * query param, which would cause a false positive on first load.
   */
  const isCallbackUrl = (url: string) => {
    return url.includes('vnp_ResponseCode') && url.includes('payment-callback');
  };

  /** Call backend's payment-callback endpoint directly from mobile app. */
  const processCallback = async (callbackUrl: string) => {
    const queryString = callbackUrl.includes('?') ? callbackUrl.split('?')[1] : '';

    if (queryString) {
      try {
        await paymentApi.processVnpayCallback(queryString);
      } catch (e: any) {
        // Log lỗi để debug — callback có thể fail do signature hoặc network
        console.warn('PaymentWebView: callback failed', e?.response?.data || e?.message);
      }
    }

    navigation.replace('PaymentProcessing', {
      orderId,
      applicationId,
      projectName: '',
      depositAmount: 0,
    });
  };

  /**
   * Intercept and PREVENT the WebView from loading the callback URL
   * (https://localhost:7085/...) on mobile, since localhost is unreachable.
   * Instead, we call the backend directly from React Native code above.
   */
  const handleShouldStartLoad = (request: any) => {
    if (callbackHandledRef.current) return true;

    if (isCallbackUrl(request.url)) {
      callbackHandledRef.current = true;
      setLoading(true);
      processCallback(request.url);
      return false; // Prevent WebView from loading unreachable localhost URL
    }
    return true;
  };

  /**
   * Fallback in case onShouldStartLoadWithRequest doesn't fire on some platforms
   * (e.g., iOS for certain redirect types).
   */
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    if (callbackHandledRef.current) return;
    if (!isCallbackUrl(url)) return;

    callbackHandledRef.current = true;
    setLoading(true);
    processCallback(url);
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
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
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