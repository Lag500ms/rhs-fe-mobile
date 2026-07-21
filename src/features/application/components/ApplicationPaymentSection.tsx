import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius, typography, shadows, spacing } from '../../../lib/theme';

interface ApplicationPaymentSectionProps {
  expiredAt: string; // ISO 8601 string from backend
  depositAmount: number; // Amount in VND
  onStartPayment: () => void; // Callback to parent to initiate payment
  loading?: boolean; // Loading state from parent
}

export const ApplicationPaymentSection: React.FC<ApplicationPaymentSectionProps> = ({
  expiredAt,
  depositAmount,
  onStartPayment,
  loading = false,
}) => {
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Format VND currency
  const formatVND = useCallback((amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Format time as HH:mm:ss
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Calculate remaining time from expiredAt
  const calculateRemainingTime = useCallback((expiredAtStr: string): number => {
    try {
      const expiredTime = new Date(expiredAtStr).getTime();
      const now = new Date().getTime();
      const remaining = Math.floor((expiredTime - now) / 1000);
      return Math.max(0, remaining); // Return 0 if expired
    } catch (error) {
      console.error('Error parsing expiredAt:', error);
      return 0;
    }
  }, []);

  // Initialize and update countdown timer
  useEffect(() => {
    const initialRemaining = calculateRemainingTime(expiredAt);
    setTimeRemaining(initialRemaining);

    // If already expired on mount, set state
    if (initialRemaining === 0) {
      setIsExpired(true);
      return;
    }

    // Set up interval to update countdown every second
    const interval = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          // Time's up - clear interval and set expired state
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup: clear interval on unmount
    return () => clearInterval(interval);
  }, [expiredAt, calculateRemainingTime]);

  const handlePress = useCallback(() => {
    if (!isExpired && !loading) {
      onStartPayment();
    }
  }, [isExpired, loading, onStartPayment]);

  return (
    <View style={styles.container}>
      {/* Warning Banner */}
      <View style={[
        styles.warningBanner,
        isExpired && styles.warningBannerExpired
      ]}>
        <View style={[
          styles.warningIconContainer,
          isExpired && styles.warningIconContainerExpired
        ]}>
          <Feather 
            name={isExpired ? "alert-circle" : "clock"} 
            size={20} 
            color={isExpired ? RHSColors.red600 : RHSColors.amber700} 
          />
        </View>
        <View style={styles.warningContent}>
          <Text style={[
            styles.warningTitle,
            isExpired ? styles.warningTitleExpired : {}
          ]}>
            {isExpired 
              ? 'Đã quá hạn thanh toán. Hồ sơ của bạn đã bị hủy.'
              : 'Hồ sơ của bạn đã được duyệt. Vui lòng thanh toán tiền đặt cọc để đủ điều kiện tham gia bốc thăm.'
            }
          </Text>
          
          {/* Deposit Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Số tiền đặt cọc:</Text>
            <Text style={styles.amountValue}>{formatVND(depositAmount)}</Text>
          </View>

          {/* Countdown Timer */}
          {!isExpired && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Thời hạn thanh toán còn lại:</Text>
              <Text style={styles.countdownTime}>{formatTime(timeRemaining)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Payment Button */}
      {!isExpired && (
        <TouchableOpacity
          style={[
            styles.payButton,
            loading && styles.payButtonDisabled,
          ]}
          onPress={handlePress}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.payButtonText}>Đang xử lý...</Text>
            </>
          ) : (
            <>
              <Feather name="credit-card" size={18} color="#fff" />
              <Text style={styles.payButtonText}>Thanh toán ngay</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: RHSColors.amber50,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: RHSColors.govGold,
    gap: spacing.md,
    ...shadows.sm,
  },
  warningBannerExpired: {
    backgroundColor: RHSColors.red50,
    borderColor: RHSColors.red600,
  },
  warningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: RHSColors.amber50,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  warningIconContainerExpired: {
    backgroundColor: RHSColors.red50,
  },
  warningContent: {
    flex: 1,
    gap: spacing.sm,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.text,
    lineHeight: 20,
  },
  warningTitleExpired: {
    color: RHSColors.red700,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: RHSColors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: RHSColors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: RHSColors.text,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: RHSColors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: RHSColors.textSecondary,
  },
  countdownTime: {
    fontSize: 16,
    fontWeight: '700',
    color: RHSColors.red600,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.red600,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  payButtonDisabled: {
    backgroundColor: RHSColors.grey300,
    ...shadows.sm,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});