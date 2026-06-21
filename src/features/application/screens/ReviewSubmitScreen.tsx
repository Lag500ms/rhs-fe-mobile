import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { RHSColors, borderRadius, shadows, typography } from '../../../lib/theme';
import { housingApplicationApi, ApplicationDetail, ApplicationDocument } from '../api/housingApplicationApi';
import { getHousingStatusLabel } from '../utils/statusConfig';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatCurrency(num: number): string {
  return num.toLocaleString('vi-VN');
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export const ReviewSubmitScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConflictSheet, setShowConflictSheet] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await housingApplicationApi.getApplicationDetail(applicationId);
        setDetail(result);
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Không thể tải thông tin hồ sơ.';
        Alert.alert('Lỗi', msg);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  const totalFiles = detail?.documents?.length || 0;
  const isDisabled = totalFiles === 0 || submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await housingApplicationApi.submitApplication(applicationId);
      setShowSuccess(true);
    } catch (e: any) {
      setSubmitting(false);
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Không thể nộp hồ sơ.';

      if (status === 409) {
        // Conflict - duplicate CCCD
        setShowConflictSheet(true);
      } else {
        Alert.alert('Lỗi', msg);
      }
    }
  };

  const handleBackToDashboard = () => {
    setShowSuccess(false);
    // Navigate to the "My Applications" tab
    navigation.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: { screen: 'Applications' },
      })
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Stepper */}
      <View style={styles.stepper}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleDone]}>
            <Feather name="check" size={16} color="#fff" />
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelDone]}>Thông tin</Text>
        </View>
        <View style={[styles.stepLine, styles.stepLineDone]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleDone]}>
            <Feather name="check" size={16} color="#fff" />
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelDone]}>Giấy tờ</Text>
        </View>
        <View style={[styles.stepLine, styles.stepLineActive]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepCircleText}>3</Text>
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Nộp hồ sơ</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Header */}
        <View style={styles.summaryCard}>
          <Feather name="info" size={18} color={RHSColors.blue700} />
          <Text style={styles.summaryTitle}>Kiểm tra lại thông tin trước khi nộp</Text>
        </View>

        {/* Personal Info Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          <InfoRow icon="user" label="Họ và tên" value={detail.fullName} />
          <InfoRow icon="credit-card" label="Số CCCD" value={detail.citizenId} />
          {detail.occupation ? <InfoRow icon="briefcase" label="Nghề nghiệp" value={detail.occupation} /> : null}
          {detail.workPlace ? <InfoRow icon="map-pin" label="Nơi làm việc" value={detail.workPlace} /> : null}
        </View>

        {/* Address Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Địa chỉ</Text>
          <InfoRow icon="home" label="Nơi ở hiện tại" value={detail.currentResidence} />
          <InfoRow icon="bookmark" label="Thường trú" value={detail.permanentAddress} />
        </View>

        {/* Housing & Income */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thực trạng nhà ở & Thu nhập</Text>
          <InfoRow
            icon="layers"
            label="Thực trạng nhà ở"
            value={getHousingStatusLabel(detail.housingStatus)}
          />
          <InfoRow
            icon="dollar-sign"
            label="Thu nhập"
            value={`${formatCurrency(detail.estimatedMonthlyIncome)} VNĐ/tháng`}
          />
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giấy tờ đính kèm</Text>
          {detail.documents.length === 0 ? (
            <View style={styles.noDocs}>
              <Feather name="alert-triangle" size={16} color={RHSColors.amber600} />
              <Text style={styles.noDocsText}>Chưa có giấy tờ nào được tải lên</Text>
            </View>
          ) : (
            detail.documents.map((doc: ApplicationDocument) => (
              <View key={doc.documentId} style={styles.docItem}>
                <View style={styles.docIconSmall}>
                  <Feather name="file" size={16} color={RHSColors.red600} />
                  <Text style={styles.docIconSmallLabel}>PDF</Text>
                </View>
                <View style={styles.docInfoSmall}>
                  <Text style={styles.docNameSmall} numberOfLines={1}>
                    {doc.fileName}
                  </Text>
                  <Text style={styles.docTypeSmall}>
                    {doc.documentType === 'HOUSING_CONDITION_PROOF'
                      ? 'Minh chứng nhà ở'
                      : 'Hộ nghèo/cận nghèo'}
                  </Text>
                </View>
                <Feather name="check-circle" size={18} color={RHSColors.green600} />
              </View>
            ))
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, isDisabled && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isDisabled}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={
              isDisabled
                ? [RHSColors.grey400, RHSColors.grey500]
                : [RHSColors.red600, '#B71C1C']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGrad}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Nộp hồ sơ</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        {isDisabled && totalFiles === 0 && (
          <Text style={styles.disabledHint}>
            Vui lòng tải lên ít nhất 1 giấy tờ để nộp hồ sơ
          </Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successContainer}>
            <View style={styles.successIconWrap}>
              <Feather name="check-circle" size={64} color={RHSColors.green600} />
            </View>
            <Text style={styles.successTitle}>Nộp hồ sơ thành công!</Text>
            <Text style={styles.successDesc}>
              Hồ sơ của bạn đã được gửi đến cơ quan thẩm định. Chúng tôi sẽ thông báo kết quả
              trong thời gian sớm nhất.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={handleBackToDashboard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[RHSColors.blue700, '#1565C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successBtnGrad}
              >
                <Feather name="list" size={18} color="#fff" />
                <Text style={styles.successBtnText}>Về quản lý hồ sơ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Conflict Bottom Sheet (409) */}
      <Modal visible={showConflictSheet} transparent animationType="slide">
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowConflictSheet(false)}
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetIconWrap}>
              <Feather name="alert-octagon" size={40} color={RHSColors.red600} />
            </View>
            <Text style={styles.sheetTitle}>Trùng CCCD</Text>
            <Text style={styles.sheetDesc}>
              CCCD này đã tồn tại trong dự án. Vui lòng kiểm tra mục "Hồ sơ của tôi" để xem
              trạng thái hồ sơ hiện tại.
            </Text>
            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => {
                setShowConflictSheet(false);
                handleBackToDashboard();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[RHSColors.blue700, '#1565C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sheetBtnGrad}
              >
                <Text style={styles.sheetBtnText}>Đến Hồ sơ của tôi</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={() => setShowConflictSheet(false)}
            >
              <Text style={styles.sheetCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Feather name={icon as any} size={16} color={RHSColors.textMuted} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey200,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: RHSColors.grey300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: RHSColors.blue700 },
  stepCircleDone: { backgroundColor: RHSColors.green600 },
  stepCircleText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stepCircleTextInactive: { fontSize: 14, fontWeight: '700', color: RHSColors.grey600 },
  stepLabel: { fontSize: 12, fontWeight: '500', color: RHSColors.grey500 },
  stepLabelActive: { color: RHSColors.blue700, fontWeight: '700' },
  stepLabelDone: { color: RHSColors.green600, fontWeight: '700' },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: RHSColors.grey300,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepLineActive: { backgroundColor: RHSColors.blue700 },
  stepLineDone: { backgroundColor: RHSColors.green600 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 40 },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.blue50,
    padding: 14,
    borderRadius: borderRadius.lg,
    marginBottom: 18,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: RHSColors.blue700,
  },
  summaryTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: RHSColors.blue700, lineHeight: 20 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: 16,
    marginBottom: 14,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: RHSColors.textMuted,
    width: 110,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: RHSColors.text,
    flex: 1,
    fontWeight: '600',
  },

  // Documents
  noDocs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  noDocsText: {
    fontSize: 13,
    color: RHSColors.amber700,
    fontWeight: '500',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.md,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  docIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: RHSColors.red50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconSmallLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: RHSColors.red600,
    marginTop: -2,
  },
  docInfoSmall: { flex: 1, gap: 2 },
  docNameSmall: { fontSize: 12, fontWeight: '600', color: RHSColors.text },
  docTypeSmall: { fontSize: 11, color: RHSColors.textMuted },

  // Submit
  submitBtn: {
    marginTop: 8,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.floating,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  submitText: { ...typography.button, color: '#fff' },
  disabledHint: {
    fontSize: 12,
    color: RHSColors.red600,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: RHSColors.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    ...typography.h2,
    color: RHSColors.green700,
    marginBottom: 12,
    textAlign: 'center',
  },
  successDesc: {
    ...typography.bodySmall,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successBtn: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  successBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  successBtnText: { ...typography.button, color: '#fff' },

  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: RHSColors.grey300,
    marginBottom: 20,
  },
  sheetIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: RHSColors.red50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 8,
  },
  sheetDesc: {
    fontSize: 14,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sheetBtn: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  sheetBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sheetBtnText: { ...typography.button, color: '#fff' },
  sheetClose: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  sheetCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.textSecondary,
  },
});