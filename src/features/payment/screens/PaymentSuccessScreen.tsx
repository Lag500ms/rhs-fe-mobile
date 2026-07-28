import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { PaymentStackParamList } from '../navigation/PaymentNavigator';

type PaymentSuccessRouteProp = RouteProp<PaymentStackParamList, 'PaymentSuccess'>;

/** Chỉ thông báo thành công + thông tin giao dịch. */
export const PaymentSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentSuccessRouteProp>();
  const { orderId, projectName, applicantName, amount, paidAt, phaseLabel } = route.params;
  const phaseText = phaseLabel || 'Thanh toán';

  const handleBackToApplications = () => {
    navigation.navigate('MyApplications');
  };

  const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(
        d.getMinutes(),
      ).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.successBadge}>
            <Feather name="check" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Thanh toán thành công!</Text>
          <Text style={styles.heroSubtitle}>
            Bạn đã hoàn tất thanh toán {phaseText}
            {projectName ? ` cho dự án ${projectName}` : ''}.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Thông tin giao dịch</Text>

          {projectName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dự án</Text>
              <Text style={styles.infoValue}>{projectName}</Text>
            </View>
          ) : null}
          {applicantName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người đăng ký</Text>
              <Text style={styles.infoValue}>{applicantName}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Đợt thanh toán</Text>
            <Text style={styles.infoValue}>{phaseText}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số tiền</Text>
            <Text style={styles.infoValueHighlight}>{formatCurrency(amount)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã giao dịch</Text>
            <Text style={styles.infoValue}>{orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian</Text>
            <Text style={styles.infoValue}>{formatDate(paidAt)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackToApplications}
          activeOpacity={0.9}
        >
          <Feather name="arrow-left" size={18} color="#fff" />
          <Text style={styles.backBtnText}>Quay lại danh sách hồ sơ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: RHSColors.green600,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
    shadowColor: RHSColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: RHSColors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: RHSColors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  infoValueHighlight: {
    fontSize: 15,
    color: RHSColors.red700,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.blue700,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
