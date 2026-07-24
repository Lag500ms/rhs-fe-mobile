import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, shadows, spacing, typography } from '../../../lib/theme';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { ApplicationDetail, ApplicationDocument } from '../types/application';
import { getStatusConfig } from '../utils/statusConfig';
import { formatDate, formatDateTime } from '../utils/format';
import { ApplicationTimeline } from '../components/ApplicationTimeline';
import { paymentApi } from '../../payment/api/paymentApi';
import { PaymentInfo } from '../../payment/types/payment';

type BottomAction = {
  label: string;
  icon: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
};

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.detailSection}>
    <Text style={styles.detailSectionTitle}>{title}</Text>
    {children}
  </View>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailRowLabel}>{label}</Text>
    <Text style={styles.detailRowValue}>{value}</Text>
  </View>
);

export const ApplicationDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId } = route.params as { applicationId: string };

  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [existingPayment, setExistingPayment] = useState<PaymentInfo | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const [paymentSlotCode, setPaymentSlotCode] = useState<string | null>(null);
  const [paymentPdfUrl, setPaymentPdfUrl] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [slotCodeCopied, setSlotCodeCopied] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }
    return () => {
      if (parent) {
        parent.setOptions({ tabBarStyle: undefined });
      }
    };
  }, [navigation]);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await housingApplicationApi.getApplicationDetail(applicationId);
      setDetail(data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Không thể tải chi tiết hồ sơ.';
      Alert.alert('Lỗi', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setLoading(false);
    }
  }, [applicationId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadDetail();
    }, [loadDetail])
  );

  const checkExistingPayment = useCallback(async (appId: string) => {
    setCheckingPayment(true);
    try {
      const result = await paymentApi.getMyPayments();
      if (result.success && result.data) {
        const payment = result.data.find((p: PaymentInfo) => p.applicationId === appId);
        setExistingPayment(payment || null);
        if (payment?.status === 'Success') {
          setPaymentSlotCode(payment.slotCode || null);
          setPaymentPdfUrl(payment.pdfUrl || null);
        } else {
          setPaymentSlotCode(null);
          setPaymentPdfUrl(null);
        }
      } else {
        setExistingPayment(null);
        setPaymentSlotCode(null);
        setPaymentPdfUrl(null);
      }
    } catch {
      setExistingPayment(null);
      setPaymentSlotCode(null);
      setPaymentPdfUrl(null);
    } finally {
      setCheckingPayment(false);
    }
  }, []);

  useEffect(() => {
    if (
      detail?.applicationStatus === 'APPROVED'
      || detail?.applicationStatus === 'APPROVED_BY_TIMEOUT'
      || detail?.applicationStatus === 'DEPOSIT_PAID'
      || detail?.applicationStatus === 'CONTRACT_PENDING'
      || detail?.applicationStatus === 'CONTRACT_SIGNED'
      || detail?.applicationStatus === 'FULLY_PAID'
    ) {
      checkExistingPayment(detail.applicationId);
    } else {
      setExistingPayment(null);
      setPaymentSlotCode(null);
      setPaymentPdfUrl(null);
    }
  }, [detail?.applicationStatus, detail?.applicationId, checkExistingPayment]);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    setIsExpired(false);
  }, []);

  const startCountdown = useCallback((finalDecisionDate: string) => {
    clearCountdown();
    const expiry = new Date(finalDecisionDate).getTime() + 24 * 60 * 60 * 1000;
    const update = () => {
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setCountdown('00:00:00');
        setIsExpired(true);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    update();
    countdownIntervalRef.current = setInterval(update, 1000);
  }, [clearCountdown]);

  useEffect(() => {
    if (detail?.applicationStatus === 'APPROVED' && detail?.finalDecisionDate) {
      startCountdown(detail.finalDecisionDate);
    } else {
      clearCountdown();
    }
    return () => clearCountdown();
  }, [detail?.applicationStatus, detail?.finalDecisionDate, startCountdown, clearCountdown]);

  const handleStartPayment = useCallback(async () => {
    if (!detail) return;
    setProcessingPayment(true);
    try {
      if (existingPayment && existingPayment.status === 'Pending') {
        navigation.navigate('PaymentProcessing', {
          orderId: existingPayment.orderId,
          applicationId: detail.applicationId,
          projectName: '',
          depositAmount: 0,
        });
        setProcessingPayment(false);
        return;
      }

      const result = await paymentApi.createPaymentUrl(detail.applicationId);
      if (result.success && result.data?.paymentUrl) {
        navigation.navigate('PaymentWebView', {
          paymentUrl: result.data.paymentUrl,
          orderId: result.data.orderId,
          applicationId: detail.applicationId,
        });
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể tạo URL thanh toán');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể tạo thanh toán';
      Alert.alert('Lỗi', msg);
    } finally {
      setProcessingPayment(false);
    }
  }, [detail, navigation, existingPayment]);

  const handleViewReceipt = useCallback(() => {
    const receiptUrl = detail?.receiptUrl;
    if (receiptUrl) {
      setLoadingReceipt(true);
      setTimeout(() => {
        setLoadingReceipt(false);
        navigation.navigate('ContractViewer', {
          pdfUrl: receiptUrl,
          title: 'Biên nhận nộp hồ sơ',
        });
      }, 100);
    } else {
      Alert.alert('Không có biên nhận', 'Biên nhận chưa được tạo. Vui lòng thử lại sau.');
    }
  }, [detail, navigation]);

  const handleViewContract = useCallback(() => {
    const appId = detail?.applicationId;
    const name = detail?.projectName;
    const status = detail?.applicationStatus;
    const hasContract = !!paymentPdfUrl || !!paymentSlotCode || status === 'DEPOSIT_PAID'
      || status === 'CONTRACT_SIGNED' || status === 'FULLY_PAID';
    if (appId && hasContract) {
      navigation.navigate('ContractViewer', {
        applicationId: appId,
        title: name ? `Hợp đồng - ${name}` : 'Hợp đồng nguyên tắc',
        canSign: status === 'DEPOSIT_PAID' || status === 'FULLY_PAID' || status === 'CONTRACT_PENDING' || status === 'APPROVED',
      });
    } else {
      Alert.alert('Không có hợp đồng', 'Hợp đồng chưa được tạo. Vui lòng thử lại sau.');
    }
  }, [paymentPdfUrl, paymentSlotCode, navigation, detail]);

  const handleHousehold = useCallback(() => {
    if (!detail) return;
    navigation.navigate('HouseholdMembers', {
      applicationId: detail.applicationId,
      projectName: detail.projectName,
      applicationStatus: detail.applicationStatus,
    });
  }, [detail, navigation]);

  const handlePaymentSchedule = useCallback(() => {
    if (!detail) return;
    navigation.navigate('PaymentSchedule', {
      applicationId: detail.applicationId,
      projectName: detail.projectName,
    });
  }, [detail, navigation]);

  const handleCopySlotCode = useCallback(async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
    } catch {
      // fallback: still show copied feedback
    }
    setSlotCodeCopied(true);
    setTimeout(() => setSlotCodeCopied(false), 2500);
  }, []);

  const handleReApply = () => {
    Alert.alert(
      'Tạo lại hồ sơ',
      'Bạn có muốn tạo hồ sơ mới dựa trên thông tin của hồ sơ bị từ chối?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tạo mới',
          onPress: () => {
            navigation.goBack();
            setTimeout(() => {
              navigation.getParent()?.navigate('Home', { screen: 'HomeList' });
            }, 300);
          },
        },
      ]
    );
  };

  const handleReApplyFromExpired = async () => {
    if (!detail || reapplying) return;
    if (!detail.priorityGroup?.trim()) {
      Alert.alert(
        'Thiếu đối tượng',
        'Hồ sơ cũ không có nhóm đối tượng thụ hưởng. Vui lòng tạo hồ sơ mới và chọn đối tượng.',
      );
      return;
    }
    setReapplying(true);
    try {
      const result = await housingApplicationApi.createApplication({
        projectId: detail.projectId,
        fullName: detail.fullName,
        citizenId: detail.citizenId,
        currentResidence: detail.currentResidence,
        permanentAddress: detail.permanentAddress,
        housingStatus: detail.housingStatus,
        maritalStatus: detail.maritalStatus || 'SINGLE',
        priorityGroup: detail.priorityGroup,
        averageHousingAreaPerPerson: detail.averageHousingAreaPerPerson ?? undefined,
      });
      navigation.replace('UploadDocuments', {
        applicationId: result.applicationId,
        projectName: detail.projectName,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể tạo lại hồ sơ.';
      Alert.alert('Lỗi', msg);
    } finally {
      setReapplying(false);
    }
  };

  const handleUploadDocs = () => {
    if (!detail) return;
    navigation.navigate('UploadDocuments', {
      applicationId: detail.applicationId,
      applicationStatus: detail.applicationStatus,
    });
  };

  const handleWithdraw = () => {
    if (!detail) return;
    navigation.navigate('WithdrawApplication', {
      applicationId: detail.applicationId,
      projectName: detail.projectName,
    });
  };

  const getStatusActions = (): BottomAction[] => {
    if (!detail) return [];

    const status = detail.applicationStatus;

    if (status === 'NEED_MORE_DOCUMENTS') {
      return [{
        label: 'Cập nhật giấy tờ',
        icon: 'upload',
        onPress: handleUploadDocs,
        variant: 'primary',
      }];
    }

    const goLottery = () => {
      navigation.navigate('LotterySchedule', {
        projectId: detail.projectId,
        projectName: detail.projectName,
        applicationId: detail.applicationId,
      });
    };

    if (status === 'APPROVED' || status === 'APPROVED_BY_TIMEOUT') {
      if (existingPayment?.status === 'Success') {
        return [
          {
            label: 'Xem hợp đồng nguyên tắc',
            icon: 'file-text',
            onPress: handleViewContract,
            variant: 'primary',
          },
          {
            label: 'Lịch bốc thăm',
            icon: 'calendar',
            onPress: goLottery,
            variant: 'secondary',
          },
        ];
      }
      if (!isExpired) {
        const isPending = existingPayment?.status === 'Pending';
        return [
          {
            label: isPending ? 'Kiểm tra giao dịch' : 'Đặt cọc ngay',
            icon: isPending ? 'search' : 'credit-card',
            onPress: handleStartPayment,
            variant: 'destructive',
            loading: processingPayment || checkingPayment,
            disabled: processingPayment || checkingPayment,
          },
          {
            label: 'Lịch / sảnh bốc thăm',
            icon: 'radio',
            onPress: goLottery,
            variant: 'secondary',
          },
        ];
      }
    }

    if (status === 'CONTRACT_PENDING') {
      const actions: BottomAction[] = [
        {
          label: 'Xem & ký hợp đồng',
          icon: 'file-text',
          onPress: handleViewContract,
          variant: 'primary',
        },
      ];
      if (!existingPayment || existingPayment.status !== 'Success') {
        actions.push({
          label: 'Đặt cọc VNPay',
          icon: 'credit-card',
          onPress: handleStartPayment,
          variant: 'destructive',
          loading: processingPayment || checkingPayment,
          disabled: processingPayment || checkingPayment,
        });
      }
      return actions;
    }

    if (status === 'DEPOSIT_PAID') {
      const lr = detail.lotteryResult;
      if (lr === 'LOST') {
        return [
          {
            label: 'Xem kết quả bốc thăm',
            icon: 'award',
            onPress: () =>
              navigation.navigate('LotteryResult', {
                projectId: detail.projectId,
                projectName: detail.projectName,
                applicationId: detail.applicationId,
              }),
            variant: 'secondary',
          },
        ];
      }
      if (lr === 'WON' || lr === 'PRIORITY_WON') {
        return [
          {
            label: 'Xem & ký hợp đồng',
            icon: 'file-text',
            onPress: handleViewContract,
            variant: 'primary',
            disabled: checkingPayment,
          },
          {
            label: 'Lịch thanh toán',
            icon: 'calendar',
            onPress: handlePaymentSchedule,
            variant: 'secondary',
          },
        ];
      }
      return [
        {
          label: 'Vào sảnh bốc thăm',
          icon: 'radio',
          onPress: goLottery,
          variant: 'primary',
        },
        {
          label: 'Xem hợp đồng tạm',
          icon: 'file-text',
          onPress: handleViewContract,
          variant: 'secondary',
          disabled: checkingPayment,
        },
      ];
    }

    if (status === 'LOTTERY_LOST') {
      return [
        {
          label: 'Xem kết quả bốc thăm',
          icon: 'award',
          onPress: () =>
            navigation.navigate('LotteryResult', {
              projectId: detail.projectId,
              projectName: detail.projectName,
              applicationId: detail.applicationId,
            }),
          variant: 'secondary',
        },
      ];
    }

    if (status === 'CONTRACT_SIGNED' || status === 'FULLY_PAID') {
      return [
        {
          label: 'Lịch thanh toán',
          icon: 'calendar',
          onPress: handlePaymentSchedule,
          variant: 'primary',
        },
        {
          label: 'Xem hợp đồng',
          icon: 'file-text',
          onPress: handleViewContract,
          variant: 'secondary',
        },
      ];
    }

    if (status === 'DRAFT') {
      return [
        {
          label: 'Thành viên hộ gia đình',
          icon: 'users',
          onPress: handleHousehold,
          variant: 'secondary',
        },
        {
          label: 'Tiếp tục hồ sơ',
          icon: 'upload',
          onPress: handleUploadDocs,
          variant: 'primary',
        },
      ];
    }

    if (status === 'EXPIRED') {
      return [{
        label: 'Tạo hồ sơ đăng ký mới',
        icon: 'refresh-cw',
        onPress: handleReApplyFromExpired,
        variant: 'primary',
        loading: reapplying,
        disabled: reapplying,
      }];
    }

    if (status === 'REJECTED') {
      return [{
        label: 'Tạo lại hồ sơ mới',
        icon: 'refresh-cw',
        onPress: handleReApply,
        variant: 'primary',
      }];
    }

    if (detail.receiptUrl && status !== 'DRAFT') {
      return [{
        label: loadingReceipt ? 'Đang tải...' : 'Xem biên nhận',
        icon: 'file-text',
        onPress: handleViewReceipt,
        variant: 'secondary',
        loading: loadingReceipt,
        disabled: loadingReceipt,
      }];
    }

    return [];
  };

  const WITHDRAWABLE_STATUSES = ['SUBMITTED', 'REVIEWING', 'PENDING_SXD_REVIEW', 'NEED_MORE_DOCUMENTS'];

  const getBottomActions = (): BottomAction[] => {
    const actions = getStatusActions();
    if (detail && WITHDRAWABLE_STATUSES.includes(detail.applicationStatus)) {
      return [
        ...actions,
        {
          label: 'Rút hồ sơ',
          icon: 'x-octagon',
          onPress: handleWithdraw,
          variant: 'secondary',
        },
      ];
    }
    return actions;
  };

  const bottomActions = getBottomActions();
  const statusConfig = detail ? getStatusConfig(detail.applicationStatus) : null;

  const requestNote = detail?.reviewHistories
    .filter(h => h.action === 'REQUEST_MORE_DOCUMENTS' && h.note)
    .slice(0, 1)
    .map(h => h.note)[0];

  const rejectNote = detail?.reviewHistories
    .filter(h => h.action === 'REJECT' && h.note)
    .slice(0, 1)
    .map(h => h.note)[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Chi tiết hồ sơ" isWhite />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : detail ? (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              bottomActions.length > 0 && styles.scrollContentWithBar,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {statusConfig && (
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                  <View style={[styles.badgeDot, { backgroundColor: statusConfig.dotColor }]} />
                  <Text style={[styles.statusBadgeText, { color: statusConfig.textColor }]}>
                    {statusConfig.label}
                  </Text>
                </View>
                <Text style={styles.projectTitle} numberOfLines={2}>{detail.projectName}</Text>
              </View>
            )}

            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Tiến độ hồ sơ</Text>
              <ApplicationTimeline currentStatus={detail.applicationStatus} />
            </View>

            {requestNote && (
              <View style={styles.noteCard}>
                <Feather name="message-square" size={16} color={RHSColors.amber700} />
                <Text style={styles.noteText}>{requestNote}</Text>
              </View>
            )}
            {rejectNote && (
              <View style={[styles.noteCard, styles.rejectionCard]}>
                <Feather name="alert-triangle" size={16} color={RHSColors.red600} />
                <Text style={styles.rejectionText}>{rejectNote}</Text>
              </View>
            )}

            <DetailSection title="Thông tin cá nhân">
              <DetailRow label="Họ tên" value={detail.fullName} />
              <DetailRow label="CCCD" value={detail.citizenId} />
            </DetailSection>

            <DetailSection title="Địa chỉ">
              <DetailRow label="Nơi ở" value={detail.currentResidence} />
              <DetailRow label="Thường trú" value={detail.permanentAddress} />
            </DetailSection>

            <DetailSection title="Giấy tờ đính kèm">
              {detail.documents.length === 0 ? (
                <Text style={styles.noDocText}>Không có giấy tờ</Text>
              ) : (
                detail.documents.map((doc: ApplicationDocument) => (
                  <View key={doc.documentId} style={styles.docRow}>
                    <View style={styles.docRowIcon}>
                      <Feather name="file" size={14} color={RHSColors.blue700} />
                      <Text style={styles.docRowIconLabel}>PDF</Text>
                    </View>
                    <Text style={styles.docRowName} numberOfLines={1}>{doc.fileName}</Text>
                  </View>
                ))
              )}
            </DetailSection>

            <DetailSection title="Thời gian">
              <DetailRow label="Tạo lúc" value={formatDate(detail.createdAt)} />
              {detail.updatedAt && (
                <DetailRow label="Cập nhật" value={formatDate(detail.updatedAt)} />
              )}
              {detail.submittedAt && (
                <DetailRow label="Nộp lúc" value={formatDateTime(detail.submittedAt)} />
              )}
            </DetailSection>

            {detail.receiptUrl && detail.applicationStatus !== 'DRAFT' && (
              <View style={styles.receiptCard}>
                <View style={styles.receiptCardHeader}>
                  <View style={styles.receiptCardIconWrap}>
                    <Feather name="file-text" size={22} color={RHSColors.blue700} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptCardTitle}>Biên nhận nộp hồ sơ</Text>
                    <Text style={styles.receiptCardMeta}>
                      Mã hồ sơ: {(detail.applicationId ?? '').substring(0, 8).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {detail.applicationStatus === 'APPROVED' && (
              <ApprovedPaymentContent
                existingPayment={existingPayment}
                paymentSlotCode={paymentSlotCode}
                checkingPayment={checkingPayment}
                countdown={countdown}
                isExpired={isExpired}
                slotCodeCopied={slotCodeCopied}
                onCopySlotCode={handleCopySlotCode}
              />
            )}

            {(detail.applicationStatus === 'APPROVED' ||
              detail.applicationStatus === 'APPROVED_BY_TIMEOUT' ||
              detail.applicationStatus === 'DEPOSIT_PAID' ||
              detail.applicationStatus === 'CONTRACT_PENDING') && (
              <View style={styles.lotteryInfoCard}>
                <View style={styles.lotteryInfoHead}>
                  <Feather name="radio" size={18} color={RHSColors.blue700} />
                  <Text style={styles.lotteryInfoTitle}>Bốc thăm công khai</Text>
                </View>
                <Text style={styles.lotteryInfoText}>
                  {detail.lotteryResult
                    ? `Kết quả của bạn: ${detail.lotteryResult}`
                    : 'Xem lịch, địa điểm/kênh và vào sảnh chờ khi đến giờ. Sở Xây dựng giám sát phiên bốc thăm.'}
                </Text>
                <TouchableOpacity
                  style={styles.lotteryInfoBtn}
                  onPress={() =>
                    navigation.navigate('LotterySchedule', {
                      projectId: detail.projectId,
                      projectName: detail.projectName,
                      applicationId: detail.applicationId,
                    })
                  }
                >
                  <Text style={styles.lotteryInfoBtnText}>Mở lịch & sảnh bốc thăm</Text>
                </TouchableOpacity>
              </View>
            )}

            {detail.applicationStatus === 'DEPOSIT_PAID' && (
              <DepositPaidContent
                detail={detail}
                paymentSlotCode={paymentSlotCode}
                checkingPayment={checkingPayment}
                slotCodeCopied={slotCodeCopied}
                onCopySlotCode={handleCopySlotCode}
              />
            )}

            {detail.applicationStatus === 'EXPIRED' && (
              <View style={styles.expiredSection}>
                <View style={styles.expiredBadge}>
                  <Feather name="alert-triangle" size={18} color={RHSColors.red600} />
                  <Text style={styles.expiredTitle}>Hồ sơ đã bị hủy</Text>
                </View>
                <Text style={styles.expiredDescription}>
                  Hồ sơ đã bị hủy do quá hạn thanh toán tiền đặt cọc. Vui lòng tạo hồ sơ mới để tiếp tục đăng ký.
                </Text>
              </View>
            )}
          </ScrollView>

          {bottomActions.length > 0 && (
            <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
              {bottomActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bottomBtn,
                    action.variant === 'primary' && styles.bottomBtnPrimary,
                    action.variant === 'secondary' && styles.bottomBtnSecondary,
                    action.variant === 'destructive' && styles.bottomBtnDestructive,
                    (action.disabled || action.loading) && styles.bottomBtnDisabled,
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.9}
                  disabled={action.disabled || action.loading}
                >
                  {action.loading ? (
                    <ActivityIndicator
                      size="small"
                      color={action.variant === 'secondary' ? RHSColors.blue700 : '#fff'}
                    />
                  ) : (
                    <Feather
                      name={action.icon as any}
                      size={18}
                      color={action.variant === 'secondary' ? RHSColors.blue700 : '#fff'}
                    />
                  )}
                  <Text
                    style={[
                      styles.bottomBtnText,
                      action.variant === 'secondary' && styles.bottomBtnTextSecondary,
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </SafeAreaView>
          )}
        </>
      ) : null}
    </SafeAreaView>
  );
};

const ApprovedPaymentContent = ({
  existingPayment,
  paymentSlotCode,
  checkingPayment,
  countdown,
  isExpired,
  slotCodeCopied,
  onCopySlotCode,
}: {
  existingPayment: PaymentInfo | null;
  paymentSlotCode: string | null;
  checkingPayment: boolean;
  countdown: string | null;
  isExpired: boolean;
  slotCodeCopied: boolean;
  onCopySlotCode: (code: string) => void;
}) => {
  if (existingPayment?.status === 'Success') {
    return (
      <View style={styles.depositPaidSection}>
        <View style={styles.depositPaidBadge}>
          <Feather name="check-circle" size={16} color={RHSColors.green600} />
          <Text style={styles.depositPaidText}>Đã thanh toán thành công</Text>
        </View>
        {paymentSlotCode && (
          <SlotCodeCard
            code={paymentSlotCode}
            copied={slotCodeCopied}
            onCopy={onCopySlotCode}
          />
        )}
      </View>
    );
  }

  return (
    <>
      {countdown && (
        <View style={[styles.countdownSection, isExpired && styles.countdownExpired]}>
          <View style={styles.countdownHeader}>
            <Feather
              name={isExpired ? 'alert-triangle' : 'clock'}
              size={18}
              color={isExpired ? RHSColors.red600 : RHSColors.govGoldDark}
            />
            <Text style={[styles.countdownTitle, isExpired && { color: RHSColors.red600 }]}>
              {isExpired ? 'Đã hết hạn thanh toán' : 'Thời hạn thanh toán'}
            </Text>
          </View>
          <Text style={[styles.countdownValue, isExpired && { color: RHSColors.red600 }]}>
            {countdown}
          </Text>
          {!isExpired && (
            <Text style={styles.countdownLabel}>
              Bạn cần thanh toán trong thời gian này để đủ điều kiện tham gia bốc thăm
            </Text>
          )}
        </View>
      )}

      {isExpired ? (
        <View style={styles.paymentSection}>
          <View style={[styles.waitingPaymentBadge, { justifyContent: 'center' }]}>
            <Feather name="x-circle" size={18} color={RHSColors.red600} />
            <Text style={[styles.waitingPaymentText, { color: RHSColors.red600 }]}>
              Đã hết hạn thanh toán
            </Text>
          </View>
          <Text style={styles.depositInfoText}>
            Thời hạn 24 giờ đã kết thúc. Hồ sơ của bạn sẽ bị hủy.
          </Text>
        </View>
      ) : existingPayment?.status === 'Pending' ? (
        <View style={styles.paymentSection}>
          <View style={styles.waitingPaymentBadge}>
            <Feather name="alert-circle" size={16} color={RHSColors.amber700} />
            <Text style={styles.waitingPaymentText}>Đã có giao dịch đang chờ</Text>
          </View>
          <Text style={styles.depositInfoText}>
            Bạn đã có một giao dịch đang chờ xử lý cho hồ sơ này. Vui lòng kiểm tra lại kết quả thanh toán.
          </Text>
        </View>
      ) : checkingPayment ? (
        <View style={styles.paymentSection}>
          <ActivityIndicator size="small" color={RHSColors.blue700} />
        </View>
      ) : (
        <View style={styles.paymentSection}>
          <View style={styles.waitingPaymentBadge}>
            <Feather name="clock" size={16} color={RHSColors.govGoldDark} />
            <Text style={styles.waitingPaymentText}>Đang chờ thanh toán</Text>
          </View>
          <Text style={styles.depositInfoText}>
            Hồ sơ của bạn đã được duyệt. Vui lòng đặt cọc để đủ điều kiện tham gia bốc thăm.
          </Text>
        </View>
      )}
    </>
  );
};

const DepositPaidContent = ({
  detail,
  paymentSlotCode,
  checkingPayment,
  slotCodeCopied,
  onCopySlotCode,
}: {
  detail: ApplicationDetail;
  paymentSlotCode: string | null;
  checkingPayment: boolean;
  slotCodeCopied: boolean;
  onCopySlotCode: (code: string) => void;
}) => (
  <View style={styles.depositPaidSection}>
    <View style={styles.depositPaidBadge}>
      <Feather name="check-circle" size={16} color={RHSColors.green600} />
      <Text style={styles.depositPaidText}>Đã đặt cọc thành công</Text>
    </View>

    {paymentSlotCode ? (
      <SlotCodeCard code={paymentSlotCode} copied={slotCodeCopied} onCopy={onCopySlotCode} />
    ) : checkingPayment ? (
      <View style={styles.paymentSection}>
        <ActivityIndicator size="small" color={RHSColors.blue700} />
      </View>
    ) : null}

    <Text style={styles.readyForLotteryText}>
      {detail.lotteryResult === 'WON' || detail.lotteryResult === 'PRIORITY_WON'
        ? 'Chúc mừng! Bạn đã trúng suất nhà ở xã hội.'
        : detail.lotteryResult === 'LOST'
          ? 'Rất tiếc, bạn chưa trúng trong đợt bốc thăm này.'
          : 'Bạn đã hoàn tất đặt cọc. Hãy chờ ngày bốc thăm để nhận kết quả.'}
    </Text>

    {(detail.lotteryResult === 'WON' ||
      detail.lotteryResult === 'PRIORITY_WON' ||
      detail.lotteryResult === 'LOST') && (
      <View style={styles.lotteryResultCard}>
        <Text style={styles.lotteryResultText}>
          Kết quả:{' '}
          {detail.lotteryResult === 'PRIORITY_WON'
            ? 'Trúng (ưu tiên)'
            : detail.lotteryResult === 'WON'
              ? 'Trúng'
              : detail.lotteryResult === 'LOST'
                ? 'Không trúng'
                : detail.lotteryResult}
        </Text>
      </View>
    )}

    {detail.eligibility && (
      <View style={styles.eligibilityBlock}>
        <Text style={styles.eligibilityTitle}>
          Điều kiện hưởng (Đ29–30):{' '}
          {detail.eligibility.eligible ? 'Đủ điều kiện' : 'Chưa đủ'}
        </Text>
        {detail.eligibility.reasons?.map((r, i) => (
          <Text key={i} style={styles.eligibilityReason}>• {r}</Text>
        ))}
      </View>
    )}
  </View>
);

const SlotCodeCard = ({
  code,
  copied,
  onCopy,
}: {
  code: string;
  copied: boolean;
  onCopy: (code: string) => void;
}) => (
  <View style={styles.slotCodeCard}>
    <View style={styles.slotCodeCardHeader}>
      <Feather name="award" size={18} color={RHSColors.govGold} />
      <Text style={styles.slotCodeCardTitle}>Mã số bốc thăm</Text>
    </View>
    <View style={styles.slotCodeContainer}>
      <Text style={styles.slotCodeText}>{code}</Text>
    </View>
    <TouchableOpacity
      style={[styles.slotCopyBtn, copied && styles.slotCopyBtnCopied]}
      onPress={() => onCopy(code)}
      activeOpacity={0.8}
    >
      <Feather
        name={copied ? 'check' : 'copy'}
        size={14}
        color={copied ? RHSColors.green600 : RHSColors.blue700}
      />
      <Text style={[styles.slotCopyBtnText, copied && { color: RHSColors.green600 }]}>
        {copied ? 'Đã sao chép' : 'Sao chép mã'}
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  scrollContentWithBar: { paddingBottom: spacing.huge },

  statusRow: { marginBottom: spacing.lg, gap: spacing.sm },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadgeText: { ...typography.bodySmall, fontWeight: '700' },
  projectTitle: { ...typography.h3, color: RHSColors.text },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: RHSColors.amber50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  noteText: { ...typography.bodySmall, color: RHSColors.amber700, flex: 1, lineHeight: 18 },
  rejectionCard: { backgroundColor: RHSColors.red50 },
  rejectionText: { ...typography.bodySmall, color: RHSColors.red700, flex: 1, lineHeight: 18 },

  detailSection: { marginBottom: spacing.lg },
  detailSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
  },
  detailRow: { flexDirection: 'row', paddingVertical: spacing.xs, gap: spacing.sm },
  detailRowLabel: { ...typography.bodySmall, color: RHSColors.textMuted, width: 88, fontWeight: '500' },
  detailRowValue: { ...typography.bodySmall, color: RHSColors.text, flex: 1, fontWeight: '600' },

  noDocText: { ...typography.bodySmall, color: RHSColors.textMuted, fontStyle: 'italic' },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.xs,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  docRowIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docRowIconLabel: { fontSize: 6, fontWeight: '800', color: RHSColors.blue700, marginTop: -1 },
  docRowName: { ...typography.caption, color: RHSColors.text, flex: 1, fontWeight: '500' },

  receiptCard: {
    marginBottom: spacing.lg,
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.blue200,
    padding: spacing.lg,
  },
  receiptCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  receiptCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: RHSColors.blue100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptCardTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, marginBottom: 4 },

  lotteryInfoCard: {
    marginBottom: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: spacing.md,
  },
  lotteryInfoHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  lotteryInfoTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  lotteryInfoText: { ...typography.caption, color: RHSColors.textMuted, lineHeight: 18, marginBottom: 10 },
  lotteryInfoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  lotteryInfoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  receiptCardMeta: { ...typography.caption, color: RHSColors.textMuted, lineHeight: 17 },

  paymentSection: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: RHSColors.amber50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.govGold,
    gap: spacing.md,
  },
  waitingPaymentBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  waitingPaymentText: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.govGoldDark },
  depositInfoText: { ...typography.bodySmall, color: RHSColors.textSecondary, lineHeight: 18 },

  depositPaidSection: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: RHSColors.green50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.green600,
    gap: spacing.md,
  },
  depositPaidBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  depositPaidText: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.green700 },
  readyForLotteryText: { ...typography.bodySmall, color: RHSColors.textSecondary, lineHeight: 18 },
  lotteryResultCard: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: RHSColors.blue50,
  },
  lotteryResultText: { fontWeight: '700', color: RHSColors.blue700 },
  eligibilityBlock: { marginTop: spacing.xs },
  eligibilityTitle: { fontWeight: '600', marginBottom: 4, color: RHSColors.text },
  eligibilityReason: { ...typography.caption, color: RHSColors.textMuted, marginBottom: 2 },

  countdownSection: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: RHSColors.amber50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.govGold,
    alignItems: 'center',
    gap: 6,
  },
  countdownExpired: { backgroundColor: RHSColors.red50, borderColor: RHSColors.red400 },
  countdownHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  countdownTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.govGoldDark },
  countdownValue: {
    fontSize: 36,
    fontWeight: '900',
    color: RHSColors.govGoldDark,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  countdownLabel: { ...typography.caption, color: RHSColors.textMuted },

  slotCodeCard: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.govGold,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  slotCodeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  slotCodeCardTitle: { ...typography.bodySmall, fontWeight: '600', color: RHSColors.textSecondary },
  slotCodeContainer: {
    backgroundColor: RHSColors.amber50,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: RHSColors.govGold,
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  slotCodeText: {
    fontSize: 28,
    fontWeight: '900',
    color: RHSColors.red700,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  slotCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: RHSColors.blue700,
    gap: 6,
  },
  slotCopyBtnCopied: { borderColor: RHSColors.green600 },
  slotCopyBtnText: { ...typography.caption, fontWeight: '700', color: RHSColors.blue700 },

  expiredSection: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: RHSColors.red50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.red400,
    gap: spacing.md,
  },
  expiredBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  expiredTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.red700 },
  expiredDescription: { ...typography.bodySmall, color: RHSColors.red700, lineHeight: 18 },

  bottomBar: {
    backgroundColor: RHSColors.white,
    borderTopWidth: 1,
    borderTopColor: RHSColors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.lg,
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    minHeight: 52,
  },
  bottomBtnPrimary: { backgroundColor: RHSColors.blue700, ...shadows.md },
  bottomBtnSecondary: {
    backgroundColor: RHSColors.white,
    borderWidth: 1.5,
    borderColor: RHSColors.blue700,
  },
  bottomBtnDestructive: { backgroundColor: RHSColors.red600, ...shadows.md },
  bottomBtnDisabled: { opacity: 0.6 },
  bottomBtnText: { ...typography.button, color: '#fff' },
  bottomBtnTextSecondary: { color: RHSColors.blue700 },
});
