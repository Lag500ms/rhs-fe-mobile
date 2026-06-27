import React, { useState, useLayoutEffect, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';
import { housingDocumentApi, UploadDocumentResponse, DocumentItem } from '../api/housingDocumentApi';
import { housingApplicationApi, ReviewHistory } from '../api/housingApplicationApi';

const DOC_TYPES = [
  {
    key: 'HOUSING_CONDITION_PROOF' as const,
    label: 'Minh chứng điều kiện nhà ở',
    subtitle: 'Giấy chứng nhận thực trạng nhà ở',
  },
  {
    key: 'POVERTY_HOUSEHOLD_CERTIFICATE' as const,
    label: 'Chứng nhận hộ nghèo/cận nghèo',
    subtitle: 'Giấy chứng nhận do địa phương cấp',
  },
];

type DocKey = typeof DOC_TYPES[number]['key'];

interface UploadedFile {
  documentId: string;
  fileName: string;
  fileSize: number;
  documentType: DocKey;
  verificationStatus?: string; // PENDING | VERIFIED | REJECTED
}

function formatFileSize(bytes: number): string {
  if (!bytes) return 'Không rõ';
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

function isNeedMoreDocsMode(status?: string): boolean {
  return status === 'NEED_MORE_DOCUMENTS';
}

/**
 * Lấy ghi chú mới nhất từ lịch sử xét duyệt (action = REQUEST_MORE_DOCUMENTS).
 */
function findLatestReviewNote(histories: ReviewHistory[]): string | null {
  const requestNotes = histories.filter(h => h.action === 'REQUEST_MORE_DOCUMENTS' && h.note);
  return requestNotes.length > 0 ? requestNotes[0].note : null;
}

export const UploadDocumentsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId, applicationStatus } = route.params;
  const isSupplementMode = isNeedMoreDocsMode(applicationStatus);

  // Hide bottom tab bar when in creation flow
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

  const [uploadedFiles, setUploadedFiles] = useState<Record<DocKey, UploadedFile | null>>({
    HOUSING_CONDITION_PROOF: null,
    POVERTY_HOUSEHOLD_CERTIFICATE: null,
  });
  const [uploading, setUploading] = useState<Record<DocKey, boolean>>({
    HOUSING_CONDITION_PROOF: false,
    POVERTY_HOUSEHOLD_CERTIFICATE: false,
  });
  const [deleting, setDeleting] = useState<Record<DocKey, boolean>>({
    HOUSING_CONDITION_PROOF: false,
    POVERTY_HOUSEHOLD_CERTIFICATE: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupplementMode);

  // Load existing documents + reviewNote nếu đang ở chế độ bổ sung
  useEffect(() => {
    if (!isSupplementMode) return;

    (async () => {
      try {
        // 1. Fetch detail để lấy reviewHistories và tìm reviewNote
        const detail = await housingApplicationApi.getApplicationDetail(applicationId);
        const note = findLatestReviewNote(detail.reviewHistories);
        setReviewNote(note);

        // 2. Fetch danh sách documents từ application detail
        // (BE không có endpoint GET documents riêng — documents nằm trong detail)
        const docs = detail.documents || [];
        const fileMap: Record<DocKey, UploadedFile | null> = {
          HOUSING_CONDITION_PROOF: null,
          POVERTY_HOUSEHOLD_CERTIFICATE: null,
        };
        for (const doc of docs) {
          if (doc.documentType === 'HOUSING_CONDITION_PROOF' || doc.documentType === 'POVERTY_HOUSEHOLD_CERTIFICATE') {
            fileMap[doc.documentType] = {
              documentId: doc.documentId,
              fileName: doc.fileName,
              fileSize: doc.fileSizeBytes,
              documentType: doc.documentType,
              verificationStatus: doc.verificationStatus,
            };
          }
        }
        setUploadedFiles(fileMap);
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Không thể tải thông tin hồ sơ.';
        Alert.alert('Lỗi', msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId, isSupplementMode]);

  const totalFiles = Object.values(uploadedFiles).filter(Boolean).length;

  const pickAndUpload = async (docKey: DocKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setUploading(prev => ({ ...prev, [docKey]: true }));

      const response: UploadDocumentResponse = await housingDocumentApi.uploadDocument(
        applicationId,
        docKey,
        file.uri
      );

      setUploadedFiles(prev => ({
        ...prev,
        [docKey]: {
          documentId: response.documentId,
          fileName: file.name,
          fileSize: file.size || 0,
          documentType: docKey,
        },
      }));
      setUploading(prev => ({ ...prev, [docKey]: false }));
    } catch (e: any) {
      setUploading(prev => ({ ...prev, [docKey]: false }));
      const msg = e?.response?.data?.message || e?.message || 'Không thể upload tài liệu.';
      Alert.alert('Lỗi upload', msg);
    }
  };

  const handleDelete = async (docKey: DocKey) => {
    const file = uploadedFiles[docKey];
    if (!file) return;

    setDeleting(prev => ({ ...prev, [docKey]: true }));
    try {
      await housingDocumentApi.deleteDocument(applicationId, file.documentId);
      setUploadedFiles(prev => ({ ...prev, [docKey]: null }));
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể xóa tài liệu.';
      Alert.alert('Lỗi', msg);
    } finally {
      setDeleting(prev => ({ ...prev, [docKey]: false }));
    }
  };

  const handleContinue = async () => {
    navigation.navigate('ReviewSubmit', {
      applicationId,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <BrandBar />
        <View style={styles.whiteHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bổ sung giấy tờ</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Thin brand bar at top */}
      <BrandBar />

      {/* White header */}
      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSupplementMode ? 'Bổ sung giấy tờ' : 'Tải lên giấy tờ'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hiển thị stepper chỉ khi tạo mới, ẩn khi bổ sung */}
      {!isSupplementMode && (
        <View style={styles.stepper}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleDone]}>
              <Feather name="check" size={14} color="#fff" />
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelDone]}>Thông tin</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineActive]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepCircleText}>2</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Giấy tờ</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepCircleTextInactive}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Nộp hồ sơ</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner cho chế độ bổ sung */}
        {isSupplementMode && (
          <View style={styles.supplementBanner}>
            <Feather name="alert-circle" size={18} color={RHSColors.amber700} />
            <Text style={styles.supplementBannerText}>
              Hồ sơ của bạn đang được yêu cầu bổ sung giấy tờ. Vui lòng kiểm tra ghi chú bên dưới và tải lên giấy tờ còn thiếu.
            </Text>
          </View>
        )}

        {/* Ghi chú từ officer (chỉ hiển thị khi có) */}
        {reviewNote && (
          <View style={styles.noteCard}>
            <Feather name="message-square" size={16} color={RHSColors.amber700} />
            <View style={styles.noteContent}>
              <Text style={styles.noteLabel}>Ghi chú từ cán bộ thẩm định:</Text>
              <Text style={styles.noteText}>{reviewNote}</Text>
            </View>
          </View>
        )}

        <Text style={styles.description}>
          {isSupplementMode
            ? 'Tải lên file PDF (tối đa 10MB mỗi file) cho các giấy tờ còn thiếu hoặc thay thế giấy tờ cũ.'
            : 'Tải lên file PDF (tối đa 10MB mỗi file) cho từng loại giấy tờ bên dưới. Bạn chỉ cần 1 file cho mỗi loại.'}
        </Text>

        {DOC_TYPES.map(({ key, label, subtitle }) => {
          const file = uploadedFiles[key];
          const isUploading = uploading[key];
          const isDeleting = deleting[key];

          return (
            <View key={key} style={styles.uploadZone}>
              <Text style={styles.uploadLabel}>{label}</Text>
              <Text style={styles.uploadSubtitle}>{subtitle}</Text>

              {file ? (
                <View>
                  {/* Verification status badge (chỉ hiển thị khi có) */}
                  {file.verificationStatus && file.verificationStatus === 'REJECTED' && (
                    <View style={styles.rejectedBanner}>
                      <Feather name="alert-triangle" size={14} color={RHSColors.red600} />
                      <Text style={styles.rejectedBannerText}>
                        Giấy tờ này bị từ chối. Vui lòng xóa và tải lên giấy tờ mới.
                      </Text>
                    </View>
                  )}
                  {file.verificationStatus && file.verificationStatus === 'PENDING' && (
                    <View style={styles.pendingBanner}>
                      <Feather name="clock" size={14} color={RHSColors.amber700} />
                      <Text style={styles.pendingBannerText}>
                        Đang chờ xác minh. Bạn có thể thay thế bằng giấy tờ khác nếu cần.
                      </Text>
                    </View>
                  )}
                  {file.verificationStatus && file.verificationStatus === 'VERIFIED' && (
                    <View style={styles.verifiedBanner}>
                      <Feather name="check-circle" size={14} color={RHSColors.green600} />
                      <Text style={styles.verifiedBannerText}>
                        Đã được xác minh. Bạn có thể thay thế nếu cần.
                      </Text>
                    </View>
                  )}
                  <View style={styles.fileCard}>
                    <View style={styles.fileCardLeft}>
                      <View style={[styles.pdfIconWrap, file.verificationStatus === 'REJECTED' && styles.pdfIconWrapRejected]}>
                        <Feather name="file" size={28} color={file.verificationStatus === 'REJECTED' ? RHSColors.red600 : RHSColors.blue700} />
                        <Text style={[styles.pdfLabel, file.verificationStatus === 'REJECTED' && { color: RHSColors.red600 }]}>PDF</Text>
                      </View>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.fileName}
                        </Text>
                        <Text style={styles.fileSize}>{formatFileSize(file.fileSize)}</Text>
                      </View>
                    </View>
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={RHSColors.red600} />
                    ) : (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          Alert.alert(
                            'Xóa tài liệu',
                            'Bạn có chắc muốn xóa tài liệu này?',
                            [
                              { text: 'Hủy', style: 'cancel' },
                              { text: 'Xóa', style: 'destructive', onPress: () => handleDelete(key) },
                            ]
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <Feather name="x" size={18} color={RHSColors.red600} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.dashedZone, isUploading && styles.dashedZoneActive]}
                  onPress={() => pickAndUpload(key)}
                  disabled={isUploading}
                  activeOpacity={0.7}
                >
                  {isUploading ? (
                    <View style={styles.uploadingContent}>
                      <ActivityIndicator size="small" color={RHSColors.blue700} />
                      <Text style={styles.uploadingText}>Đang tải lên...</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadingContent}>
                      <Feather name="upload" size={24} color="#B0BEC5" />
                      <Text style={styles.dashedZoneText}>Chạm để chọn file PDF</Text>
                      <Text style={styles.dashedZoneHint}>Chỉ chấp nhận định dạng .pdf</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Continue Button - BLUE */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <View style={styles.continueGrad}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.continueText}>
                  {isSupplementMode ? 'Lưu thay đổi' : 'Tiếp tục'}
                </Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </View>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },

  // White header
  whiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: RHSColors.blue700 },

  // Stepper - refined circles
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
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: RHSColors.grey300,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: RHSColors.blue700, borderColor: RHSColors.blue700 },
  stepCircleDone: { backgroundColor: RHSColors.green600, borderColor: RHSColors.green600 },
  stepCircleText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepCircleTextInactive: { fontSize: 13, fontWeight: '700', color: RHSColors.grey500 },
  stepLabel: { fontSize: 11, fontWeight: '500', color: RHSColors.grey500 },
  stepLabelActive: { color: RHSColors.blue700, fontWeight: '700' },
  stepLabelDone: { color: RHSColors.green600, fontWeight: '700' },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: RHSColors.grey300,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepLineActive: { backgroundColor: RHSColors.blue700 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 40 },
  description: {
    ...typography.bodySmall,
    color: RHSColors.textSecondary,
    paddingHorizontal: 2,
    marginBottom: 20,
    lineHeight: 20,
  },

  // Upload Zones
  uploadZone: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  uploadLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 2,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: RHSColors.textMuted,
    marginBottom: 14,
  },

  // Dashed Zone - white bg, grey-blue border
  dashedZone: {
    borderWidth: 2,
    borderColor: '#B0BEC5',
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dashedZoneActive: {
    borderColor: RHSColors.blue700,
    backgroundColor: '#F5FAFF',
  },
  uploadingContent: {
    alignItems: 'center',
    gap: 8,
  },
  dashedZoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#90A4AE',
  },
  dashedZoneHint: {
    fontSize: 12,
    color: RHSColors.textMuted,
  },
  uploadingText: {
    fontSize: 13,
    color: RHSColors.blue700,
    fontWeight: '500',
  },

  // File Card
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5FAFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.blue200,
    padding: 12,
  },
  fileCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  pdfIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: RHSColors.blue700,
    marginTop: -2,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: RHSColors.text,
    maxWidth: '90%',
  },
  fileSize: {
    fontSize: 12,
    color: RHSColors.textMuted,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RHSColors.red50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },

  // Supplement banner
  supplementBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: borderRadius.md,
    marginBottom: 16,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: RHSColors.amber700,
  },
  supplementBannerText: {
    fontSize: 13,
    color: RHSColors.amber700,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Verification status banners
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: RHSColors.red50,
    padding: 8,
    borderRadius: borderRadius.xs,
    marginBottom: 8,
    gap: 6,
  },
  rejectedBannerText: {
    fontSize: 12,
    color: RHSColors.red600,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: RHSColors.amber50,
    padding: 8,
    borderRadius: borderRadius.xs,
    marginBottom: 8,
    gap: 6,
  },
  pendingBannerText: {
    fontSize: 12,
    color: RHSColors.amber700,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: RHSColors.green50,
    padding: 8,
    borderRadius: borderRadius.xs,
    marginBottom: 8,
    gap: 6,
  },
  verifiedBannerText: {
    fontSize: 12,
    color: RHSColors.green700,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  pdfIconWrapRejected: {
    backgroundColor: RHSColors.red50,
  },

  // Note card from officer
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: RHSColors.amber50,
    padding: 12,
    borderRadius: borderRadius.md,
    marginBottom: 16,
    gap: 8,
  },
  noteContent: { flex: 1, gap: 4 },
  noteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: RHSColors.amber700,
  },
  noteText: {
    fontSize: 13,
    color: RHSColors.amber700,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Continue - BLUE
  continueBtn: {
    marginTop: 12,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  continueGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    backgroundColor: RHSColors.blue700,
  },
  continueText: { ...typography.button, color: '#fff' },
});