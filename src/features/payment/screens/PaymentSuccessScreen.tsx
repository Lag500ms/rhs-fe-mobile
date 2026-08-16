import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, borderRadius, spacing, typography, shadows } from '../../../lib/theme';
import { Card, CelebrationModal, GradientButton } from '../../../components/ui';
import { PaymentStackParamList } from '../navigation/PaymentNavigator';

type PaymentSuccessRouteProp = RouteProp<PaymentStackParamList, 'PaymentSuccess'>;

const formatCurrency = (value: number) => `${(value || 0).toLocaleString('vi-VN')} đ`;

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

/** Chỉ thông báo thành công + thông tin giao dịch. */
export const PaymentSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentSuccessRouteProp>();
  const { orderId, projectName, applicantName, amount, paidAt, phaseLabel } = route.params;
  const phaseText = phaseLabel || 'Thanh toán';

  const [celebrating, setCelebrating] = useState(true);

  const handleBackToApplications = () => {
    navigation.navigate('MyApplications');
  };

  const rows: { label: string; value: string; highlight?: boolean }[] = [
    ...(projectName ? [{ label: 'Dự án', value: projectName }] : []),
    ...(applicantName ? [{ label: 'Người đăng ký', value: applicantName }] : []),
    { label: 'Đợt thanh toán', value: phaseText },
    { label: 'Số tiền', value: formatCurrency(amount), highlight: true },
    { label: 'Mã giao dịch', value: orderId },
    { label: 'Thời gian', value: formatDate(paidAt) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[RHSColors.green700, RHSColors.green600, '#43A047']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.circle, styles.circleTop]} />
            <View style={[styles.circle, styles.circleLeft]} />
            <View style={[styles.circle, styles.circleBottom]} />
          </View>

          <View style={styles.successBadge}>
            <Feather name="check" size={38} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Thanh toán thành công!</Text>
          <Text style={styles.heroAmount}>{formatCurrency(amount)}</Text>
          <Text style={styles.heroSubtitle}>
            Bạn đã hoàn tất {phaseText.toLowerCase()}
            {projectName ? ` cho dự án ${projectName}` : ''}.
          </Text>
        </LinearGradient>

        <Card style={styles.infoCard} elevated>
          <View style={styles.infoCardHead}>
            <Feather name="file-text" size={16} color={RHSColors.blue700} />
            <Text style={styles.infoCardTitle}>Thông tin giao dịch</Text>
          </View>

          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[styles.infoRow, i < rows.length - 1 && styles.infoRowDivider]}
            >
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={row.highlight ? styles.infoValueHighlight : styles.infoValue}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>

        <View style={styles.actions}>
          <GradientButton
            label="Quay lại danh sách hồ sơ"
            icon="arrow-left"
            onPress={handleBackToApplications}
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>

      <CelebrationModal
        visible={celebrating}
        tone="success"
        title="Thanh toán thành công!"
        message={`${phaseText}${projectName ? ` · ${projectName}` : ''}`}
        highlightValue={formatCurrency(amount)}
        highlightLabel="đã thanh toán"
        primaryLabel="Xem biên lai"
        onPrimary={() => setCelebrating(false)}
        secondaryLabel="Về danh sách hồ sơ"
        onSecondary={() => {
          setCelebrating(false);
          handleBackToApplications();
        }}
        onClose={() => setCelebrating(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  hero: {
    paddingTop: 64,
    paddingBottom: spacing.huge,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.1,
    borderRadius: 999,
  },
  circleTop: { width: 150, height: 150, top: -55, right: -35 },
  circleLeft: { width: 90, height: 90, top: 40, left: -35 },
  circleBottom: { width: 120, height: 120, bottom: -60, right: 60 },
  successBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.h3,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#fff',
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xxl,
  },
  infoCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoCardTitle: {
    ...typography.h3,
    fontSize: 15,
    color: RHSColors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 13,
    color: RHSColors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    ...typography.caption,
    fontSize: 13,
    color: RHSColors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  infoValueHighlight: {
    fontSize: 16,
    color: RHSColors.green700,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    ...shadows.sm,
  },
});
