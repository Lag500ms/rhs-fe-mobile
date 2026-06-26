import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';
import {
  housingApplicationApi,
  ApplicationSummary,
  ApplicationDetail,
  ApplicationDocument,
} from '../api/housingApplicationApi';
import { getStatusConfig } from '../utils/statusConfig';
import { paymentApi } from '../../payment/api/paymentApi';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function getActionForStatus(status: string): { label: string; icon: string; color: string } | null {
  switch (status) {
    case 'DRAFT':
      return { label: 'Tiếp tục hồ sơ', icon: 'edit-2', color: RHSColors.blue700 };
    case 'NEED_MORE_DOCUMENTS':
      return { label: 'Cập nhật giấy tờ', icon: 'upload', color: RHSColors.amber700 };
    case 'SUBMITTED':
      return { label: 'Xem chi tiết', icon: 'eye', color: RHSColors.blue700 };
    case 'UNDER_REVIEW':
      return { label: 'Xem chi tiết', icon: 'eye', color: RHSColors.blue700 };
    case 'APPROVED':
      return { label: 'Xem chi tiết', icon: 'eye', color: RHSColors.green600 };
    case 'REJECTED':
      return { label: 'Xem chi tiết', icon: 'eye', color: RHSColors.red600 };
    default:
      return null;
  }
}

export const MyApplicationsScreen = () => {
  const navigation = useNavigation<any>();

  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ApplicationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // ── ActionSheet state ──
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [actionSheetApp, setActionSheetApp] = useState<ApplicationSummary | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const result = await housingApplicationApi.getMyApplications();
      setApplications(result.items || []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể tải danh sách hồ sơ.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const hideTabBar = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }
  };

  const showTabBar = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: undefined });
    }
  };

  const handleViewDetail = async (applicationId: string) => {
    setLoadingDetail(true);
    setShowDetail(true);
    hideTabBar();
    try {
      const detail = await housingApplicationApi.getApplicationDetail(applicationId);
      setSelectedDetail(detail);
    } catch (e: any) {
      setShowDetail(false);
      const msg = e?.response?.data?.message || 'Không thể tải chi tiết hồ sơ.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    showTabBar();
  };

  // ── Action for DRAFT: Show ActionSheet ──
  const handleDraftAction = (item: ApplicationSummary) => {
    setActionSheetApp(item);
    setShowActionSheet(true);
    hideTabBar();
  };

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
    showTabBar();
  };

  // ── Navigate EditInformation ──
  const handleEditInfo = () => {
    if (!actionSheetApp) return;
    const item = actionSheetApp;
    setShowActionSheet(false);
    // Tab bar will be hidden by destination screen's useLayoutEffect
    navigation.navigate('EditInformation', {
      applicationId: item.applicationId,
    });
  };

  // ── Navigate UploadDocuments ──
  const handleManageDocs = () => {
    if (!actionSheetApp) return;
    const item = actionSheetApp;
    setShowActionSheet(false);
    // Tab bar will be hidden by destination screen's useLayoutEffect
    navigation.navigate('UploadDocuments', {
      applicationId: item.applicationId,
    });
  };

  // ── Navigate ReviewSubmit ──
  const handleReviewSubmit = () => {
    if (!actionSheetApp) return;
    const item = actionSheetApp;
    setShowActionSheet(false);
    // Tab bar will be hidden by destination screen's useLayoutEffect
    navigation.navigate('ReviewSubmit', {
      applicationId: item.applicationId,
    });
  };

  // ── Payment flow for APPROVED ──
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleStartPayment = useCallback(async () => {
    if (!selectedDetail) return;
    setProcessingPayment(true);
    try {
      const result = await paymentApi.createPaymentUrl(selectedDetail.applicationId);
      if (result.success && result.data?.paymentUrl) {
        handleCloseDetail();
        navigation.navigate('PaymentWebView', {
          paymentUrl: result.data.paymentUrl,
          orderId: result.data.orderId,
          applicationId: selectedDetail.applicationId,
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
  }, [selectedDetail, navigation]);

  // ── View Contract for DEPOSIT_PAID ──
  const handleViewContract = useCallback(() => {
    if (!selectedDetail) return;
    // For DEPOSIT_PAID, we navigate to payment info first to get pdfUrl
    handleCloseDetail();
    // Go to payment success screen which has contract viewer access
    Alert.alert(
      'Xem hợp đồng',
      'Vui lòng kiểm tra trong mục "Thanh toán" để xem hợp đồng của bạn.',
      [{ text: 'Đóng', style: 'cancel' }]
    );
  }, [selectedDetail, navigation]);

  // ── Re-apply for REJECTED ──
  const handleReApply = async () => {
    if (!selectedDetail) return;
    Alert.alert(
      'Tạo lại hồ sơ',
      'Bạn có muốn tạo hồ sơ mới dựa trên thông tin của hồ sơ bị từ chối?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tạo mới',
          onPress: () => {
            handleCloseDetail();
            // Navigate to Home to pick a project, since we need projectId
            setTimeout(() => {
              navigation.getParent()?.navigate('Home', { screen: 'HomeList' });
            }, 300);
          },
        },
      ]
    );
  };

  // ── Main action handler ──
  const handleAction = (item: ApplicationSummary) => {
    const action = getActionForStatus(item.applicationStatus);
    if (!action) {
      handleViewDetail(item.applicationId);
      return;
    }

    switch (item.applicationStatus) {
      case 'DRAFT':
        handleDraftAction(item);
        break;
      case 'NEED_MORE_DOCUMENTS':
        navigation.navigate('UploadDocuments', {
          applicationId: item.applicationId,
          applicationStatus: item.applicationStatus,
        });
        break;
      default:
        handleViewDetail(item.applicationId);
        break;
    }
  };

  const renderItem = ({ item }: { item: ApplicationSummary }) => {
    const config = getStatusConfig(item.applicationStatus);
    const action = getActionForStatus(item.applicationStatus);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleAction(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.projectInfo}>
            <Feather name="home" size={16} color={RHSColors.blue700} />
            <Text style={styles.projectName} numberOfLines={1}>
              {item.projectName}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: config.dotColor }]} />
            <Text style={[styles.badgeText, { color: config.textColor }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Feather name="calendar" size={14} color={RHSColors.textMuted} />
            <Text style={styles.cardRowText}>
              Tạo ngày: {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Feather name="file" size={14} color={RHSColors.textMuted} />
            <Text style={styles.cardRowText}>
              {item.documentCount} giấy tờ
            </Text>
          </View>
        </View>

        {action && (
          <View style={styles.cardFooter}>
            <View style={styles.actionBtn}>
              <Feather name={action.icon as any} size={14} color={action.color} />
              <Text style={[styles.actionBtnText, { color: action.color }]}>
                {action.label}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={RHSColors.textMuted} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Feather name="inbox" size={48} color={RHSColors.grey300} />
      <Text style={styles.emptyTitle}>Chưa có hồ sơ nào</Text>
      <Text style={styles.emptyDesc}>
        Bạn chưa đăng ký hồ sơ mua nhà ở xã hội nào. Hãy khám phá các dự án và tạo hồ sơ mới!
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => navigation.getParent()?.navigate('Home', { screen: 'HomeList' })}
        activeOpacity={0.8}
      >
        <Feather name="search" size={16} color="#fff" />
        <Text style={styles.exploreBtnText}>Khám phá dự án</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Thin brand bar at top */}
      <BrandBar />

      {/* White header */}
      <View style={styles.whiteHeader}>
        <Text style={styles.whiteHeaderTitle}>Hồ sơ của tôi</Text>
        <TouchableOpacity
          style={styles.headerRefresh}
          onPress={() => fetchData(true)}
        >
          <Feather name="refresh-cw" size={20} color={RHSColors.blue700} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderItem}
          keyExtractor={(item) => item.applicationId}
          contentContainerStyle={
            applications.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={[RHSColors.blue700]}
              tintColor={RHSColors.blue700}
            />
          }
        />
      )}

      {/* Detail Modal */}
      <Modal visible={showDetail} transparent animationType="slide">
        <TouchableOpacity
          style={styles.detailOverlay}
          activeOpacity={1}
          onPress={handleCloseDetail}
        >
          <View style={styles.detailContainer}>
            <View style={styles.detailHandle} />
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Chi tiết hồ sơ</Text>
              <TouchableOpacity onPress={handleCloseDetail}>
                <Feather name="x" size={22} color={RHSColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
              <View style={styles.detailLoading}>
                <ActivityIndicator size="large" color={RHSColors.blue700} />
              </View>
            ) : selectedDetail ? (
              <FlatList
                data={[]}
                renderItem={null}
                ListHeaderComponent={() => (
                  <View style={styles.detailBody}>
                    {/* Status Badge */}
                    <View style={styles.detailStatusRow}>
                      {(() => {
                        const cfg = getStatusConfig(selectedDetail.applicationStatus);
                        return (
                          <View style={[styles.detailBadge, { backgroundColor: cfg.bg }]}>
                            <View style={[styles.badgeDot, { backgroundColor: cfg.dotColor }]} />
                            <Text style={[styles.detailBadgeText, { color: cfg.textColor }]}>
                              {cfg.label}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>

                    {/* Review Note / Rejection Reason (lấy từ reviewHistories) */}
                    {(() => {
                      const requestNote = selectedDetail.reviewHistories
                        .filter(h => h.action === 'REQUEST_MORE_DOCUMENTS' && h.note)
                        .slice(0, 1)
                        .map(h => h.note);
                      const rejectNote = selectedDetail.reviewHistories
                        .filter(h => h.action === 'REJECT' && h.note)
                        .slice(0, 1)
                        .map(h => h.note);
                      return (
                        <>
                          {requestNote.length > 0 && (
                            <View style={styles.noteCard}>
                              <Feather name="message-square" size={16} color={RHSColors.amber700} />
                              <Text style={styles.noteText}>{requestNote[0]}</Text>
                            </View>
                          )}
                          {rejectNote.length > 0 && (
                            <View style={[styles.noteCard, styles.rejectionCard]}>
                              <Feather name="alert-triangle" size={16} color={RHSColors.red600} />
                              <Text style={styles.rejectionText}>{rejectNote[0]}</Text>
                            </View>
                          )}
                        </>
                      );
                    })()}

                    {/* Info */}
                    <DetailSection title="Thông tin cá nhân">
                      <DetailRow label="Họ tên" value={selectedDetail.fullName} />
                      <DetailRow label="CCCD" value={selectedDetail.citizenId} />
                    </DetailSection>

                    <DetailSection title="Địa chỉ">
                      <DetailRow label="Nơi ở" value={selectedDetail.currentResidence} />
                      <DetailRow label="Thường trú" value={selectedDetail.permanentAddress} />
                    </DetailSection>

                    <DetailSection title="Giấy tờ đính kèm">
                      {selectedDetail.documents.length === 0 ? (
                        <Text style={styles.noDocText}>Không có giấy tờ</Text>
                      ) : (
                        selectedDetail.documents.map((doc: ApplicationDocument) => (
                          <View key={doc.documentId} style={styles.docRow}>
                            <View style={styles.docRowIcon}>
                              <Feather name="file" size={14} color={RHSColors.blue700} />
                              <Text style={styles.docRowIconLabel}>PDF</Text>
                            </View>
                            <Text style={styles.docRowName} numberOfLines={1}>
                              {doc.fileName}
                            </Text>
                            <Feather name="check-circle" size={16} color={RHSColors.green600} />
                          </View>
                        ))
                      )}
                    </DetailSection>

                    <DetailSection title="Thời gian">
                      <DetailRow label="Tạo lúc" value={formatDate(selectedDetail.createdAt)} />
                      {selectedDetail.updatedAt && (
                        <DetailRow label="Cập nhật" value={formatDate(selectedDetail.updatedAt)} />
                      )}
                    </DetailSection>

                    {/* ── APPROVED: "Đang chờ thanh toán" & Pay button ── */}
                    {selectedDetail.applicationStatus === 'APPROVED' && (
                      <View style={styles.paymentSection}>
                        <View style={styles.waitingPaymentBadge}>
                          <Feather name="clock" size={16} color={RHSColors.govGoldDark} />
                          <Text style={styles.waitingPaymentText}>Đang chờ thanh toán</Text>
                        </View>
                        <Text style={styles.depositInfoText}>
                          Hồ sơ của bạn đã được duyệt. Vui lòng tiến hành đặt cọc để giữ suất tham gia bốc thăm.
                        </Text>
                        <TouchableOpacity
                          style={styles.payNowBtn}
                          onPress={handleStartPayment}
                          activeOpacity={0.9}
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <>
                              <ActivityIndicator size="small" color="#fff" />
                              <Text style={styles.payNowText}>Đang xử lý...</Text>
                            </>
                          ) : (
                            <>
                              <Feather name="credit-card" size={18} color="#fff" />
                              <Text style={styles.payNowText}>Thanh toán ngay</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* ── DEPOSIT_PAID: Show SlotCode & View Contract ── */}
                    {selectedDetail.applicationStatus === 'DEPOSIT_PAID' && (
                      <View style={styles.depositPaidSection}>
                        <View style={styles.depositPaidBadge}>
                          <Feather name="check-circle" size={16} color={RHSColors.green600} />
                          <Text style={styles.depositPaidText}>Đã đặt cọc thành công</Text>
                        </View>
                        <Text style={styles.readyForLotteryText}>
                          Bạn đã hoàn tất đặt cọc. Hãy chờ ngày bốc thăm để nhận kết quả.
                        </Text>
                        <TouchableOpacity
                          style={styles.viewContractBtn}
                          onPress={handleViewContract}
                          activeOpacity={0.9}
                        >
                          <Feather name="file-text" size={18} color={RHSColors.blue700} />
                          <Text style={styles.viewContractBtnText}>Xem hợp đồng</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* ── REJECTED: Re-apply button ── */}
                    {selectedDetail.applicationStatus === 'REJECTED' && (
                      <TouchableOpacity
                        style={styles.reApplyBtn}
                        onPress={handleReApply}
                        activeOpacity={0.9}
                      >
                        <View style={styles.reApplyGrad}>
                          <Feather name="refresh-cw" size={16} color="#fff" />
                          <Text style={styles.reApplyText}>Tạo lại hồ sơ mới</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Action Sheet for DRAFT ── */}
      <Modal visible={showActionSheet} transparent animationType="slide">
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={handleCloseActionSheet}
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Quản lý hồ sơ nháp</Text>
            <Text style={styles.sheetDesc}>
              Chọn thao tác bạn muốn thực hiện với hồ sơ này
            </Text>

            {/* Edit Info */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleEditInfo}
              activeOpacity={0.8}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: RHSColors.blue50 }]}>
                <Feather name="edit-2" size={20} color={RHSColors.blue700} />
              </View>
              <View style={styles.sheetOptionContent}>
                <Text style={styles.sheetOptionTitle}>Chỉnh sửa thông tin</Text>
                <Text style={styles.sheetOptionDesc}>Cập nhật thông tin cá nhân, địa chỉ, thu nhập</Text>
              </View>
              <Feather name="chevron-right" size={18} color={RHSColors.grey400} />
            </TouchableOpacity>

            {/* Manage Documents */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleManageDocs}
              activeOpacity={0.8}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: RHSColors.amber50 }]}>
                <Feather name="upload" size={20} color={RHSColors.amber700} />
              </View>
              <View style={styles.sheetOptionContent}>
                <Text style={styles.sheetOptionTitle}>Quản lý giấy tờ</Text>
                <Text style={styles.sheetOptionDesc}>Tải lên, xóa hoặc thay thế giấy tờ PDF</Text>
              </View>
              <Feather name="chevron-right" size={18} color={RHSColors.grey400} />
            </TouchableOpacity>

            {/* Review & Submit */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleReviewSubmit}
              activeOpacity={0.8}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: RHSColors.green50 }]}>
                <Feather name="eye" size={20} color={RHSColors.green600} />
              </View>
              <View style={styles.sheetOptionContent}>
                <Text style={styles.sheetOptionTitle}>Xem & Nộp hồ sơ</Text>
                <Text style={styles.sheetOptionDesc}>Kiểm tra lại toàn bộ và nộp cho thẩm định</Text>
              </View>
              <Feather name="chevron-right" size={18} color={RHSColors.grey400} />
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={handleCloseActionSheet}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },

  whiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  whiteHeaderTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: RHSColors.blue700 },
  headerRefresh: { padding: 6 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },

  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  emptyContainer: { flex: 1 },

  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.text,
    flex: 1,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  cardBody: { gap: 6, marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardRowText: { fontSize: 12, color: RHSColors.textSecondary },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: RHSColors.grey100,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    ...typography.h3,
    color: RHSColors.text,
    marginTop: 8,
  },
  emptyDesc: {
    ...typography.bodySmall,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Detail Modal
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '85%',
  },
  detailHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: RHSColors.grey300,
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RHSColors.text,
  },
  detailLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  detailBody: { paddingBottom: 20 },
  detailStatusRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  detailBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: RHSColors.amber50,
    padding: 12,
    borderRadius: borderRadius.md,
    marginBottom: 16,
    gap: 8,
  },
  noteText: {
    fontSize: 13,
    color: RHSColors.amber700,
    flex: 1,
    lineHeight: 18,
  },
  rejectionCard: { backgroundColor: RHSColors.red50 },
  rejectionText: {
    fontSize: 13,
    color: RHSColors.red700,
    flex: 1,
    lineHeight: 18,
  },

  // Re-Apply Button for REJECTED
  reApplyBtn: { marginTop: 8, borderRadius: borderRadius.md, overflow: 'hidden' },
  reApplyGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: RHSColors.blue700,
  },
  reApplyText: { ...typography.buttonSmall, color: '#fff' },

  detailSection: { marginBottom: 16 },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
  },
  detailRowLabel: {
    fontSize: 13,
    color: RHSColors.textMuted,
    width: 80,
    fontWeight: '500',
  },
  detailRowValue: {
    fontSize: 13,
    color: RHSColors.text,
    flex: 1,
    fontWeight: '600',
  },

  noDocText: {
    fontSize: 13,
    color: RHSColors.textMuted,
    fontStyle: 'italic',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.xs,
    padding: 8,
    marginBottom: 6,
    gap: 8,
  },
  docRowIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docRowIconLabel: {
    fontSize: 6,
    fontWeight: '800',
    color: RHSColors.blue700,
    marginTop: -1,
  },
  docRowName: {
    fontSize: 12,
    color: RHSColors.text,
    flex: 1,
    fontWeight: '500',
  },

  // ── Action Sheet Styles ──
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
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: RHSColors.grey300,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 6,
  },
  sheetDesc: {
    fontSize: 14,
    color: RHSColors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
    gap: 14,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionContent: { flex: 1, gap: 2 },
  sheetOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.text,
  },
  sheetOptionDesc: {
    fontSize: 12,
    color: RHSColors.textMuted,
    lineHeight: 16,
  },
  sheetCancel: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.grey300,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.textSecondary,
  },

  // ── Payment / Deposit Styles ──
  paymentSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: RHSColors.amber50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.govGold,
    gap: 12,
  },
  waitingPaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waitingPaymentText: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.govGoldDark,
  },
  depositInfoText: {
    fontSize: 13,
    color: RHSColors.textSecondary,
    lineHeight: 18,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.red600,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  payNowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  depositPaidSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: RHSColors.green50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.green600,
    gap: 12,
  },
  depositPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  depositPaidText: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.green700,
  },
  readyForLotteryText: {
    fontSize: 13,
    color: RHSColors.textSecondary,
    lineHeight: 18,
  },
  viewContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: RHSColors.blue700,
    gap: 8,
  },
  viewContractBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.blue700,
  },
});
