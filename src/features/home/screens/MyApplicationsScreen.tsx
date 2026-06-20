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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors, borderRadius, shadows, typography } from '../../../lib/theme';
import {
  housingApplicationApi,
  ApplicationSummary,
  ApplicationDetail,
  ApplicationDocument,
} from '../api/housingApplicationApi';
import { getStatusConfig } from '../utils/statusConfig';

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
      return { label: 'Sửa hồ sơ', icon: 'edit-2', color: RHSColors.blue700 };
    case 'NEED_MORE_DOCUMENTS':
      return { label: 'Cập nhật giấy tờ', icon: 'upload', color: RHSColors.amber700 };
    case 'SUBMITTED':
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

  const handleViewDetail = async (applicationId: string) => {
    setLoadingDetail(true);
    setShowDetail(true);
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

  const handleAction = (item: ApplicationSummary) => {
    const action = getActionForStatus(item.status);
    if (!action) {
      handleViewDetail(item.applicationId);
      return;
    }

    switch (item.status) {
      case 'DRAFT':
        // Navigate to UploadDocuments to let user upload PDFs
        navigation.navigate('UploadDocuments', {
          applicationId: item.applicationId,
        });
        break;
      case 'NEED_MORE_DOCUMENTS':
        // Navigate to UploadDocuments to update documents
        navigation.navigate('UploadDocuments', {
          applicationId: item.applicationId,
        });
        break;
      default:
        handleViewDetail(item.applicationId);
        break;
    }
  };

  const renderItem = ({ item }: { item: ApplicationSummary }) => {
    const config = getStatusConfig(item.status);
    const action = getActionForStatus(item.status);

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
        onPress={() => navigation.navigate('HomeList')}
        activeOpacity={0.8}
      >
        <Feather name="search" size={16} color="#fff" />
        <Text style={styles.exploreBtnText}>Khám phá dự án</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['#0A3A85', '#1565C0', '#1E88E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
        <TouchableOpacity
          style={styles.headerRefresh}
          onPress={() => fetchData(true)}
        >
          <Feather name="refresh-cw" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

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
          onPress={() => setShowDetail(false)}
        >
          <View style={styles.detailContainer}>
            <View style={styles.detailHandle} />
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Chi tiết hồ sơ</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
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
                        const cfg = getStatusConfig(selectedDetail.status);
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

                    {/* Review Note / Rejection Reason */}
                    {selectedDetail.reviewNote && (
                      <View style={styles.noteCard}>
                        <Feather name="message-square" size={16} color={RHSColors.amber700} />
                        <Text style={styles.noteText}>{selectedDetail.reviewNote}</Text>
                      </View>
                    )}
                    {selectedDetail.rejectionReason && (
                      <View style={[styles.noteCard, styles.rejectionCard]}>
                        <Feather name="alert-triangle" size={16} color={RHSColors.red600} />
                        <Text style={styles.rejectionText}>{selectedDetail.rejectionReason}</Text>
                      </View>
                    )}

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
                              <Feather name="file" size={14} color={RHSColors.red600} />
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
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            ) : null}
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

  // Header
  headerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  headerRefresh: { padding: 6 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },

  // List
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  emptyContainer: { flex: 1 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
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

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
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

  // Card Body
  cardBody: { gap: 6, marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardRowText: { fontSize: 12, color: RHSColors.textSecondary },

  // Card Footer
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

  // Empty
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
    borderRadius: borderRadius.lg,
    gap: 8,
    ...shadows.sm,
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
    borderRadius: 20,
    gap: 6,
  },
  detailBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Note
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

  // Detail Sections
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

  // Documents
  noDocText: {
    fontSize: 13,
    color: RHSColors.textMuted,
    fontStyle: 'italic',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.sm,
    padding: 8,
    marginBottom: 6,
    gap: 8,
  },
  docRowIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: RHSColors.red50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docRowIconLabel: {
    fontSize: 6,
    fontWeight: '800',
    color: RHSColors.red600,
    marginTop: -1,
  },
  docRowName: {
    fontSize: 12,
    color: RHSColors.text,
    flex: 1,
    fontWeight: '500',
  },
});