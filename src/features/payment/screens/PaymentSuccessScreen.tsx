import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { PaymentStackParamList } from '../navigation/PaymentNavigator';
import * as Clipboard from 'expo-clipboard';

type PaymentSuccessRouteProp = RouteProp<PaymentStackParamList, 'PaymentSuccess'>;

export const PaymentSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentSuccessRouteProp>();
  const { orderId, slotCode, pdfUrl, projectName, applicantName, amount, paidAt } = route.params;

  const [copied, setCopied] = useState(false);

  const handleCopySlotCode = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(slotCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [slotCode]);

  const handleViewContract = useCallback(() => {
    if (pdfUrl) {
      navigation.navigate('ContractViewer', {
        pdfUrl,
        title: `Hợp đồng - ${projectName}`,
      });
    }
  }, [pdfUrl, projectName, navigation]);

  const handleShareSlotCode = useCallback(async () => {
    try {
      await Share.share({
        message: `Mã bốc thăm nhà ở xã hội của tôi: ${slotCode}\nDự án: ${projectName}`,
        title: 'Mã bốc thăm nhà ở xã hội',
      });
    } catch {
      // user cancelled
    }
  }, [slotCode, projectName]);

  const handleBackToApplications = () => {
    // Navigate back to root of the application stack
    navigation.navigate('MyApplications');
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('vi-VN')} đ`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(
        d.getMinutes()
      ).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <View style={styles.heroSection}>
          <View style={styles.successBadge}>
            <Feather name="check" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Thanh toán thành công!</Text>
          <Text style={styles.heroSubtitle}>
            Bạn đã hoàn tất đặt cọc cho dự án {projectName}
          </Text>
        </View>

        {/* ── Slot Code Card ── */}
        <View style={styles.slotCodeCard}>
          <View style={styles.slotCodeHeader}>
            <Feather name="award" size={20} color={RHSColors.govGold} />
            <Text style={styles.slotCodeLabel}>Mã số bốc thăm của bạn</Text>
          </View>

          <View style={styles.slotCodeContainer}>
            <Text style={styles.slotCodeText}>{slotCode || 'Đang cập nhật...'}</Text>
          </View>

          <Text style={styles.slotCodeHint}>
            Giữ mã này để tham gia bốc thăm chọn suất nhà ở xã hội.
          </Text>

          {/* Action buttons */}
          <View style={styles.slotActions}>
            <TouchableOpacity
              style={[styles.slotActionBtn, copied && styles.slotActionBtnCopied]}
              onPress={handleCopySlotCode}
              activeOpacity={0.8}
            >
              <Feather
                name={copied ? 'check' : 'copy'}
                size={16}
                color={copied ? RHSColors.green600 : RHSColors.blue700}
              />
              <Text
                style={[
                  styles.slotActionText,
                  copied && { color: RHSColors.green600 },
                ]}
              >
                {copied ? 'Đã sao chép' : 'Sao chép mã'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.slotActionBtn}
              onPress={handleShareSlotCode}
              activeOpacity={0.8}
            >
              <Feather name="share-2" size={16} color={RHSColors.blue700} />
              <Text style={styles.slotActionText}>Chia sẻ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Transaction Info ── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Thông tin giao dịch</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dự án</Text>
            <Text style={styles.infoValue}>{projectName}</Text>
          </View>
          {applicantName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người đăng ký</Text>
              <Text style={styles.infoValue}>{applicantName}</Text>
            </View>
          ) : null}
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

        {/* ── View Contract Button ── */}
        {pdfUrl ? (
          <TouchableOpacity
            style={styles.contractBtn}
            onPress={handleViewContract}
            activeOpacity={0.9}
          >
            <View style={styles.contractBtnIcon}>
              <Feather name="file-text" size={20} color={RHSColors.blue700} />
            </View>
            <View style={styles.contractBtnContent}>
              <Text style={styles.contractBtnTitle}>Xem hợp đồng nguyên tắc</Text>
              <Text style={styles.contractBtnDesc}>
                Tải xuống hoặc xem PDF hợp đồng đặt cọc
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={RHSColors.grey400} />
          </TouchableOpacity>
        ) : null}

        {/* ── Back Button ── */}
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

  // ── Hero ──
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
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Slot Code Card ──
  slotCodeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
    shadowColor: RHSColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  slotCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  slotCodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.textSecondary,
  },
  slotCodeContainer: {
    backgroundColor: RHSColors.amber50,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: RHSColors.govGold,
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  slotCodeText: {
    fontSize: 32,
    fontWeight: '900',
    color: RHSColors.red700,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  slotCodeHint: {
    fontSize: 12,
    color: RHSColors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  slotActions: {
    flexDirection: 'row',
    gap: 12,
  },
  slotActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: RHSColors.blue700,
    gap: 6,
  },
  slotActionBtnCopied: {
    borderColor: RHSColors.green600,
  },
  slotActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: RHSColors.blue700,
  },

  // ── Info Card ──
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
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

  // ── Contract Button ──
  contractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
    gap: 12,
  },
  contractBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contractBtnContent: {
    flex: 1,
  },
  contractBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: RHSColors.text,
  },
  contractBtnDesc: {
    fontSize: 12,
    color: RHSColors.textMuted,
    marginTop: 2,
  },

  // ── Back Button ──
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