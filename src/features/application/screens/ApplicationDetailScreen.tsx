import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
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
import { getCitizenNextStep } from '../utils/citizenNextStep';
import { paymentApi } from '../../payment/api/paymentApi';
import { PaymentInfo } from '../../payment/types/payment';
import {
  DEPOSIT_PAYMENT_DAYS,
  formatDepositHhmmss,
  getDepositRemainingMs,
  isPaymentSuccessStatus,
} from '../../../lib/depositDeadline';
import { lotteryApi } from '../../lottery/api/lotteryApi';
import type { LotteryScheduleDetail } from '../../lottery/types/lottery';
import {
  hasLotterySession,
  isLotteryFinishedPhase,
  isLotteryLivePhase,
  normalizeLotterySession,
} from '../utils/lotterySession';

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
  const [lotterySchedule, setLotterySchedule] = useState<LotteryScheduleDetail | null>(null);
  const [loadingLottery, setLoadingLottery] = useState(false);

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
      Alert.alert('Lỗi', msg, [{ text: 'Đồng ý', onPress: () => navigation.goBack() }]);
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
        // Ưu tiên Paid/Success; fallback Pending gần nhất (BE ghi "Paid")
        const forApp = result.data.filter((p: PaymentInfo) => p.applicationId === appId);
        const paid = forApp.find((p) => isPaymentSuccessStatus(p.status));
        const pending = forApp.find((p) => String(p.status).toLowerCase() === 'pending');
        const payment = paid || pending || forApp[0] || null;
        setExistingPayment(payment);
        if (payment && isPaymentSuccessStatus(payment.status)) {
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
      detail?.applicationStatus === 'DEPOSIT_PENDING'
      || detail?.applicationStatus === 'DEPOSIT_PAID'
      || detail?.applicationStatus === 'CONTRACT_PENDING'
      || detail?.applicationStatus === 'CONTRACT_SIGNED'
      || detail?.applicationStatus === 'INSTALLMENT_IN_PROGRESS'
      || detail?.applicationStatus === 'FULLY_PAID'
    ) {
      checkExistingPayment(detail.applicationId);
    } else {
      setExistingPayment(null);
      setPaymentSlotCode(null);
      setPaymentPdfUrl(null);
    }
  }, [detail?.applicationStatus, detail?.applicationId, checkExistingPayment]);

  useEffect(() => {
    const status = detail?.applicationStatus;
    const projectId = detail?.projectId;
    if (!projectId || (status !== 'APPROVED' && status !== 'APPROVED_BY_TIMEOUT')) {
      setLotterySchedule(null);
      return;
    }

    let cancelled = false;
    setLoadingLottery(true);
    (async () => {
      try {
        const schedule = await lotteryApi.getSchedule(projectId);
        if (!cancelled) setLotterySchedule(schedule);
      } catch {
        if (!cancelled) setLotterySchedule(null);
      } finally {
        if (!cancelled) setLoadingLottery(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [detail?.applicationStatus, detail?.projectId]);

  const handleStartPayment = useCallback(async () => {
    if (!detail) return;
    setProcessingPayment(true);
    try {
      // Pending: BE tái tạo URL VNPay cùng OrderId — tiếp tục thanh toán thay vì báo lỗi
      const result = await paymentApi.createPaymentUrl(detail.applicationId);
      if (result.success && result.data?.paymentUrl) {
        navigation.navigate('PaymentWebView', {
          paymentUrl: result.data.paymentUrl,
          orderId: result.data.orderId,
          applicationId: detail.applicationId,
          projectName: detail.projectName || '',
          amount: result.data.amount,
          phaseLabel: 'Tiền cọc',
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
  }, [detail, navigation]);

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
    // HĐ mua bán NOXH sau khi đã cọc (BE: CONTRACT_PENDING trở đi).
    const hasContract =
      status === 'CONTRACT_PENDING' ||
      status === 'CONTRACT_SIGNED' ||
      status === 'INSTALLMENT_IN_PROGRESS' ||
      status === 'DEPOSIT_PAID' ||
      status === 'FULLY_PAID' ||
      !!paymentPdfUrl ||
      !!paymentSlotCode;
    if (appId && hasContract) {
      const hasApartment = !!(detail.apartmentId || detail.apartmentUnitName);
      navigation.navigate('ContractViewer', {
        applicationId: appId,
        title: name ? `Hợp đồng - ${name}` : 'Hợp đồng mua bán NOXH',
        canSign: status === 'CONTRACT_PENDING' && hasApartment,
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

    // APPROVED: chỉ hiện bốc/live khi CĐT đã lên lịch phiên
    if (status === 'APPROVED' || status === 'APPROVED_BY_TIMEOUT') {
      const actions: BottomAction[] = [];
      const scheduled = hasLotterySession(lotterySchedule);
      const live = isLotteryLivePhase(lotterySchedule);
      const finished = isLotteryFinishedPhase(lotterySchedule);
      const phase = normalizeLotterySession(lotterySchedule?.sessionStatus);

      if (loadingLottery) {
        actions.push({
          label: 'Đang kiểm tra lịch bốc thăm…',
          icon: 'shuffle',
          onPress: () => undefined,
          variant: 'secondary',
          loading: true,
          disabled: true,
        });
      } else if (finished) {
        actions.push({
          label: 'Xem kết quả bốc thăm',
          icon: 'award',
          onPress: () =>
            navigation.navigate('LotteryResult', {
              projectId: detail.projectId,
              projectName: detail.projectName,
              applicationId: detail.applicationId,
            }),
          variant: 'primary',
        });
      } else if (live) {
        actions.push({
          label: phase === 'Live' ? 'Vào phiên bốc thăm (Live)' : 'Vào sảnh bốc thăm',
          icon: 'radio',
          onPress: () =>
            navigation.navigate('LotteryLobby', {
              projectId: detail.projectId,
              projectName: detail.projectName,
              applicationId: detail.applicationId,
            }),
          variant: 'primary',
        });
        if (phase === 'Live') {
          actions.push({
            label: 'Xem phiên trực tiếp',
            icon: 'eye',
            onPress: () =>
              navigation.navigate('LotteryLive', {
                projectId: detail.projectId,
                projectName: detail.projectName,
                applicationId: detail.applicationId,
              }),
            variant: 'secondary',
          });
        }
      } else if (scheduled) {
        actions.push({
          label: 'Xem lịch bốc thăm',
          icon: 'calendar',
          onPress: () =>
            navigation.navigate('LotterySchedule', {
              projectId: detail.projectId,
              projectName: detail.projectName,
              applicationId: detail.applicationId,
            }),
          variant: 'primary',
        });
      }
      // Chưa có lịch từ CĐT → không CTA bốc thăm (chỉ biên nhận nếu có)

      if (detail.receiptUrl) {
        actions.push({
          label: loadingReceipt ? 'Đang tải...' : 'Xem biên nhận',
          icon: 'file-text',
          onPress: handleViewReceipt,
          variant: actions.length === 0 ? 'primary' : 'secondary',
          loading: loadingReceipt,
          disabled: loadingReceipt,
        });
      }
      return actions;
    }

    // Trúng/cấp suất → đóng cọc trước khi ký
    if (status === 'DEPOSIT_PENDING') {
      const isPending = String(existingPayment?.status || '').toLowerCase() === 'pending';
      return [
        {
          label: isPending ? 'Tiếp tục đóng cọc' : 'Đóng tiền cọc',
          icon: 'credit-card',
          onPress: handleStartPayment,
          variant: 'destructive',
          loading: processingPayment || checkingPayment,
          disabled: processingPayment || checkingPayment,
        },
        {
          label: 'Xem lịch thanh toán',
          icon: 'calendar',
          onPress: handlePaymentSchedule,
          variant: 'secondary',
        },
      ];
    }

    // Sau cọc → ký HĐ
    if (status === 'CONTRACT_PENDING') {
      const hasApartment = !!(detail?.apartmentId || detail?.apartmentUnitName);
      return [
        {
          label: hasApartment ? 'Ký hợp đồng' : 'Chờ cấp căn để ký',
          icon: 'file-text',
          onPress: hasApartment
            ? handleViewContract
            : () =>
                Alert.alert(
                  'Chưa được cấp căn',
                  'Chủ đầu tư chưa gán căn cụ thể. Bạn có thể thử lại sau khi đã được cấp căn.',
                ),
          variant: hasApartment ? 'primary' : 'secondary',
        },
        {
          label: 'Xem lịch thanh toán',
          icon: 'calendar',
          onPress: handlePaymentSchedule,
          variant: 'secondary',
        },
      ];
    }

    // Đã ký → các khoản còn lại trên lịch
    if (status === 'CONTRACT_SIGNED' || status === 'INSTALLMENT_IN_PROGRESS') {
      return [
        {
          label: 'Xem lịch thanh toán',
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

    if (status === 'DEPOSIT_PAID') {
      const actions: BottomAction[] = [
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
          disabled: checkingPayment,
        },
      ];
      const lr = detail.lotteryResult;
      if (lr === 'WON' || lr === 'PRIORITY_WON' || lr === 'LOST') {
        actions.push({
          label: 'Xem kết quả bốc thăm',
          icon: 'award',
          onPress: () =>
            navigation.navigate('LotteryResult', {
              projectId: detail.projectId,
              projectName: detail.projectName,
              applicationId: detail.applicationId,
            }),
          variant: 'secondary',
        });
      }
      return actions;
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

    if (status === 'FULLY_PAID') {
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

  // Khớp BE ClosedStatuses (+ INSTALLMENT_IN_PROGRESS). Vẫn hủy được tới CONTRACT_PENDING.
  // Dừng hủy từ CONTRACT_SIGNED / DEPOSIT_PAID trở đi.
  const CLOSED_FOR_CANCEL = [
    'DEPOSIT_PAID',
    'FULLY_PAID',
    'CONTRACT_SIGNED',
    'INSTALLMENT_IN_PROGRESS',
    'REJECTED',
    'CANCELED',
    'EXPIRED',
  ];

  const getBottomActions = (): BottomAction[] => {
    const actions = getStatusActions();
    if (
      detail &&
      !CLOSED_FOR_CANCEL.includes(detail.applicationStatus) &&
      detail.applicationStatus !== 'DRAFT'
    ) {
      return [
        ...actions,
        {
          label: 'Hủy hồ sơ',
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
    ?.filter((h) => h.action === 'REQUEST_MORE_DOCUMENTS' && h.note)
    .slice(0, 1)
    .map((h) => h.note)[0];

  const rejectNote = detail?.reviewHistories
    ?.filter((h) => h.action === 'REJECT' && h.note)
    .slice(0, 1)
    .map((h) => h.note)[0];

  const nextStep = detail
    ? getCitizenNextStep(detail.applicationStatus, { needMoreNote: requestNote })
    : null;

  const nextToneStyle =
    nextStep?.tone === 'warn'
      ? styles.nextWarn
      : nextStep?.tone === 'action'
        ? styles.nextAction
        : nextStep?.tone === 'success'
          ? styles.nextSuccess
          : nextStep?.tone === 'danger'
            ? styles.nextDanger
            : styles.nextInfo;

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
                  <Text
                    style={[styles.statusBadgeText, { color: statusConfig.textColor }]}
                    numberOfLines={3}
                  >
                    {statusConfig.label}
                  </Text>
                </View>
                <Text style={styles.projectTitle} numberOfLines={2}>{detail.projectName}</Text>
              </View>
            )}

            {nextStep && (
              <View style={[styles.nextCard, nextToneStyle]}>
                <Text style={styles.nextEyebrow}>Việc của bạn</Text>
                <Text style={styles.nextTitle}>{nextStep.title}</Text>
                <Text style={styles.nextBody}>{nextStep.body}</Text>
              </View>
            )}

            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Tiến độ hồ sơ</Text>
              <ApplicationTimeline
                currentStatus={detail.applicationStatus}
                needMoreNote={requestNote}
              />
            </View>

            {requestNote && detail.applicationStatus === 'NEED_MORE_DOCUMENTS' ? null : requestNote ? (
              <View style={styles.noteCard}>
                <Feather name="message-square" size={16} color={RHSColors.amber700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteLabel}>Ghi chú từ chủ đầu tư</Text>
                  <Text style={styles.noteText}>{requestNote}</Text>
                </View>
              </View>
            ) : null}
            {rejectNote && (
              <View style={[styles.noteCard, styles.rejectionCard]}>
                <Feather name="alert-triangle" size={16} color={RHSColors.red600} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectionLabel}>Lý do từ chối</Text>
                  <Text style={styles.rejectionText}>{rejectNote}</Text>
                </View>
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

            {(detail.applicationStatus === 'APPROVED' ||
              detail.applicationStatus === 'APPROVED_BY_TIMEOUT') && (
              <View style={styles.lotteryInfoCard}>
                <View style={styles.lotteryInfoHead}>
                  <Feather name="info" size={18} color={RHSColors.blue700} />
                  <Text style={styles.lotteryInfoTitle}>Chờ chủ đầu tư chốt suất</Text>
                </View>
                <Text style={styles.lotteryInfoText}>
                  Hồ sơ đã được duyệt. Chủ đầu tư sẽ cấp nhà trực tiếp nếu đủ căn, hoặc tổ chức bốc
                  thăm rồi cấp suất. Khi đã có suất, bạn đóng tiền cọc rồi ký hợp đồng.
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
                  activeOpacity={0.85}
                >
                  <Feather name="radio" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.lotteryInfoBtnText}>
                    Xem lịch / sảnh bốc thăm
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {detail.applicationStatus === 'DEPOSIT_PENDING' && (
              <DepositPendingPaymentContent
                existingPayment={existingPayment}
                checkingPayment={checkingPayment}
                startedAtHint={detail.updatedAt}
              />
            )}

            {detail.applicationStatus === 'CONTRACT_PENDING' && (
              <View style={styles.lotteryInfoCard}>
                <View style={styles.lotteryInfoHead}>
                  <Feather name="file-text" size={18} color={RHSColors.blue700} />
                  <Text style={styles.lotteryInfoTitle}>Sẵn sàng ký hợp đồng</Text>
                </View>
                <Text style={styles.lotteryInfoText}>
                  {detail.apartmentUnitName
                    ? `Bạn được cấp căn ${detail.apartmentUnitName}${
                        detail.apartmentArea ? ` (${detail.apartmentArea}m²)` : ''
                      }. Hãy đọc và ký hợp đồng mua bán. Sau khi ký, các khoản còn lại sẽ mở trên lịch thanh toán.`
                    : 'Hãy đọc và ký hợp đồng mua bán. Nếu chưa thấy căn cụ thể, liên hệ chủ đầu tư hoặc thử lại sau.'}
                </Text>
              </View>
            )}

            {(detail.applicationStatus === 'CONTRACT_SIGNED' ||
              detail.applicationStatus === 'INSTALLMENT_IN_PROGRESS') && (
              <View style={styles.lotteryInfoCard}>
                <View style={styles.lotteryInfoHead}>
                  <Feather name="calendar" size={18} color={RHSColors.blue700} />
                  <Text style={styles.lotteryInfoTitle}>Các khoản còn lại</Text>
                </View>
                <Text style={styles.lotteryInfoText}>
                  Hợp đồng đã ký. Các khoản tiếp theo mở dần theo tiến độ dự án — xem chi tiết trong
                  lịch thanh toán.
                </Text>
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

            {detail.applicationStatus === 'LOTTERY_LOST' && (
              <View style={[styles.lotteryInfoCard, { borderColor: RHSColors.red50 }]}>
                <View style={styles.lotteryInfoHead}>
                  <Feather name="x-circle" size={18} color={RHSColors.red600} />
                  <Text style={[styles.lotteryInfoTitle, { color: RHSColors.red600 }]}>
                    Không trúng bốc thăm
                  </Text>
                </View>
                <Text style={styles.lotteryInfoText}>
                  Rất tiếc, hồ sơ của bạn không được chọn trong đợt bốc thăm này.
                </Text>
                <TouchableOpacity
                  style={[styles.lotteryInfoBtn, { backgroundColor: RHSColors.red600 }]}
                  onPress={() =>
                    navigation.navigate('LotteryResult', {
                      projectId: detail.projectId,
                      projectName: detail.projectName,
                      applicationId: detail.applicationId,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.lotteryInfoBtnText}>Xem kết quả bốc thăm</Text>
                </TouchableOpacity>
              </View>
            )}

            {detail.applicationStatus === 'EXPIRED' && (
              <View style={styles.expiredSection}>
                <View style={styles.expiredBadge}>
                  <Feather name="alert-triangle" size={18} color={RHSColors.red600} />
                  <Text style={styles.expiredTitle}>Hồ sơ đã hết hạn</Text>
                </View>
                <Text style={styles.expiredDescription}>
                  Hồ sơ đã hết hạn (quá hạn đóng cọc hoặc ký hợp đồng). Bạn có thể tạo hồ sơ mới nếu muốn tiếp tục đăng ký.
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

const DepositPendingPaymentContent = ({
  existingPayment,
  checkingPayment,
  startedAtHint,
}: {
  existingPayment: PaymentInfo | null;
  checkingPayment: boolean;
  startedAtHint?: string | null;
}) => {
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null);
  const paid = isPaymentSuccessStatus(existingPayment?.status);

  useEffect(() => {
    if (!startedAtHint || paid) {
      setRemainingLabel(null);
      return;
    }
    const tick = () => {
      const ms = getDepositRemainingMs(startedAtHint);
      if (ms <= 0) {
        setRemainingLabel('Đã hết hạn đóng cọc');
        return;
      }
      setRemainingLabel(`Còn ${formatDepositHhmmss(ms)} để đóng cọc`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAtHint, paid]);

  if (paid) {
    return (
      <View style={styles.depositPaidSection}>
        <View style={styles.depositPaidBadge}>
          <Feather name="check-circle" size={16} color={RHSColors.green600} />
          <Text style={styles.depositPaidText}>Đã đóng cọc thành công</Text>
        </View>
      </View>
    );
  }

  if (checkingPayment) {
    return (
      <View style={styles.paymentSection}>
        <ActivityIndicator size="small" color={RHSColors.blue700} />
      </View>
    );
  }

  const isPending = String(existingPayment?.status || '').toLowerCase() === 'pending';

  return (
    <View style={styles.paymentSection}>
      <View style={styles.waitingPaymentBadge}>
        <Feather
          name={isPending ? 'alert-circle' : 'credit-card'}
          size={16}
          color={isPending ? RHSColors.amber700 : RHSColors.govGoldDark}
        />
        <Text style={styles.waitingPaymentText}>
          {isPending ? 'Đang có giao dịch chờ hoàn tất' : 'Cần đóng tiền cọc'}
        </Text>
      </View>
      {!!remainingLabel && (
        <Text style={[styles.depositInfoText, { fontWeight: '700', color: RHSColors.red600, marginBottom: 6 }]}>
          {remainingLabel} (tối đa {DEPOSIT_PAYMENT_DAYS} ngày sau khi được cấp suất)
        </Text>
      )}
      <Text style={styles.depositInfoText}>
        {isPending
          ? 'Bạn đã mở giao dịch. Nhấn «Tiếp tục đóng cọc» để quay lại cổng thanh toán.'
          : 'Bạn đã được cấp suất. Đóng cọc trước, sau đó mới ký hợp đồng.'}
      </Text>
    </View>
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
      <Text style={styles.depositPaidText}>Đã thanh toán thành công</Text>
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
        ? 'Bạn đã hoàn tất thanh toán sau khi được chốt suất. Tiếp tục theo dõi lịch thanh toán các đợt tiếp theo.'
        : 'Bạn đã hoàn tất thanh toán. Tiếp tục theo dõi lịch thanh toán các đợt tiếp theo.'}
    </Text>

    {(detail.lotteryResult === 'WON' ||
      detail.lotteryResult === 'PRIORITY_WON' ||
      detail.lotteryResult === 'LOST') && (
      <View style={styles.lotteryResultCard}>
        <Text style={styles.lotteryResultText}>
          Kết quả bốc thăm:{' '}
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
      <Text style={styles.slotCodeCardTitle}>Mã suất nhà</Text>
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
  nextCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  nextInfo: { backgroundColor: '#F5F9FC', borderColor: '#D6E4F0' },
  nextAction: { backgroundColor: '#FFF8F0', borderColor: '#FFCC80' },
  nextWarn: { backgroundColor: '#FFF3E0', borderColor: '#FFB74D' },
  nextSuccess: { backgroundColor: '#F1F8F4', borderColor: '#A5D6A7' },
  nextDanger: { backgroundColor: '#FFEBEE', borderColor: '#EF9A9A' },
  nextEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: RHSColors.textMuted,
    marginBottom: 4,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 6,
  },
  nextBody: {
    fontSize: 13,
    lineHeight: 19,
    color: RHSColors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 5 },
  statusBadgeText: {
    ...typography.bodySmall,
    fontWeight: '700',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
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
  noteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: RHSColors.amber700,
    marginBottom: 2,
  },
  noteText: { ...typography.bodySmall, color: RHSColors.amber700, lineHeight: 18 },
  rejectionCard: { backgroundColor: RHSColors.red50 },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: RHSColors.red700,
    marginBottom: 2,
  },
  rejectionText: { ...typography.bodySmall, color: RHSColors.red700, lineHeight: 18 },

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
    flexDirection: 'row',
    alignItems: 'center',
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
