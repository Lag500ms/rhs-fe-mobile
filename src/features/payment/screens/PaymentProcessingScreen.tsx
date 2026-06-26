import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { PaymentStackParamList } from '../navigation/PaymentNavigator';
import { paymentApi, DepositPaymentResult } from '../api/paymentApi';

type PaymentProcessingRouteProp = RouteProp<PaymentStackParamList, 'PaymentProcessing'>;

const POLL_INTERVAL_MS = 3000; // poll every 3 seconds
const MAX_POLL_ATTEMPTS = 30; // max 90 seconds before giving up

export const PaymentProcessingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentProcessingRouteProp>();
  const { orderId, applicationId, projectName, depositAmount } = route.params;

  const [status, setStatus] = useState<'polling' | 'success' | 'failed' | 'timeout'>('polling');
  const [result, setResult] = useState<DepositPaymentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = () => {
    pollingRef.current = setInterval(async () => {
      try {
        setAttempts((prev) => prev + 1);

        const response = await paymentApi.getDepositResult(orderId);

        if (response.success && response.data) {
          // Payment confirmed successfully
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setResult(response.data);
          setStatus('success');
          return;
        }
      } catch (e: any) {
        const statusCode = e?.response?.status;
        const msg = e?.response?.data?.message || e?.message || '';

        // If 404, payment not found yet — continue polling
        if (statusCode === 404) {
          // Still processing, continue polling
          return;
        }

        // If we get payment info as a fallback, check status
        try {
          const infoResponse = await paymentApi.getPaymentInfo(orderId);
          if (
            infoResponse.success &&
            infoResponse.data &&
            infoResponse.data.status === 'SUCCESS'
          ) {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            // Try deposit result again as it may now be ready
            const retryResult = await paymentApi.getDepositResult(orderId);
            if (retryResult.success && retryResult.data) {
              setResult(retryResult.data);
              setStatus('success');
              return;
            }
            // Fallback: navigate with minimal info
            navigation.replace('PaymentSuccess', {
              orderId,
              slotCode: '',
              pdfUrl: '',
              projectName: projectName || 'Dự án',
              applicantName: '',
              amount: depositAmount || 0,
              paidAt: new Date().toISOString(),
            });
            return;
          }

          if (infoResponse.data?.status === 'FAILED') {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            setErrorMessage('Giao dịch thất bại. Vui lòng thử lại.');
            setStatus('failed');
            return;
          }
        } catch {
          // Payment info also failed; continue polling
        }
      }
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    startPolling();

    // Max attempts timeout
    const timeoutRef = setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setStatus('timeout');
        setErrorMessage('Không thể xác nhận giao dịch sau thời gian chờ. Vui lòng kiểm tra lại sau.');
      }
    }, POLL_INTERVAL_MS * MAX_POLL_ATTEMPTS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      clearTimeout(timeoutRef);
    };
  }, []);

  const handleViewResult = () => {
    if (result) {
      navigation.replace('PaymentSuccess', {
        orderId: result.orderId,
        slotCode: result.slotCode,
        pdfUrl: result.pdfUrl,
        projectName: result.projectName || projectName,
        applicantName: result.applicantName,
        amount: result.amount,
        paidAt: result.paidAt,
      });
    } else {
      // fallback to MyApplications
      navigation.navigate('MyApplications');
    }
  };

  const handleGoBack = () => {
    navigation.navigate('MyApplications');
  };

  const handleRetry = () => {
    setStatus('polling');
    setErrorMessage('');
    setAttempts(0);
    startPolling();
  };

  // ── Polling state ──
  if (status === 'polling') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.animationArea}>
            <View style={styles.spinnerWrapper}>
              <ActivityIndicator size="large" color={RHSColors.blue700} />
            </View>
            <Feather
              name="clock"
              size={32}
              color={RHSColors.blue700}
              style={styles.clockIcon}
            />
          </View>

          <Text style={styles.title}>Đang kiểm tra giao dịch...</Text>
          <Text style={styles.description}>
            Hệ thống đang xác nhận kết quả thanh toán từ cổng VNPay.{'\n'}
            Vui lòng chờ trong giây lát.
          </Text>

          <View style={styles.orderInfoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã giao dịch</Text>
              <Text style={styles.infoValue}>{orderId}</Text>
            </View>
            {depositAmount > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số tiền</Text>
                <Text style={styles.infoValue}>
                  {depositAmount.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.pollingHint}>
            Đang thử lần {attempts}/{MAX_POLL_ATTEMPTS}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success state ──
  if (status === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.successIconWrapper}>
            <Feather name="check-circle" size={64} color={RHSColors.green600} />
          </View>

          <Text style={styles.successTitle}>Xác nhận thành công!</Text>
          <Text style={styles.description}>
            Giao dịch đặt cọc của bạn đã được xác nhận.{'\n'}
            Nhấn "Xem kết quả" để xem mã bốc thăm.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleViewResult}
            activeOpacity={0.9}
          >
            <Feather name="arrow-right" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Xem kết quả</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Failed state ──
  if (status === 'failed') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.failIconWrapper}>
            <Feather name="x-circle" size={64} color={RHSColors.red600} />
          </View>

          <Text style={styles.failTitle}>Giao dịch thất bại</Text>
          <Text style={styles.description}>
            {errorMessage || 'Thanh toán không thành công. Vui lòng thử lại.'}
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleRetry}
            activeOpacity={0.9}
          >
            <Feather name="refresh-cw" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Kiểm tra lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Quay lại danh sách hồ sơ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Timeout state ──
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.timeoutIconWrapper}>
          <Feather name="alert-triangle" size={64} color={RHSColors.amber700} />
        </View>

        <Text style={styles.failTitle}>Chưa nhận được kết quả</Text>
        <Text style={styles.description}>
          {errorMessage ||
            'Giao dịch có thể đang được xử lý. Bạn có thể kiểm tra lại sau trong danh sách hồ sơ.'}
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleRetry}
          activeOpacity={0.9}
        >
          <Feather name="refresh-cw" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Kiểm tra lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Quay lại danh sách hồ sơ</Text>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  animationArea: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  spinnerWrapper: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockIcon: {
    position: 'absolute',
  },

  // ── Polling ──
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  orderInfoCard: {
    width: '100%',
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: RHSColors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: RHSColors.text,
    fontWeight: '700',
  },
  pollingHint: {
    fontSize: 12,
    color: RHSColors.textMuted,
    fontStyle: 'italic',
  },

  // ── Success ──
  successIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: RHSColors.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: RHSColors.green700,
    marginBottom: 8,
  },

  // ── Failed ──
  failIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: RHSColors.red50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  failTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: RHSColors.red700,
    marginBottom: 8,
  },

  // ── Timeout ──
  timeoutIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: RHSColors.amber50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  // ── Buttons ──
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.textSecondary,
  },
});