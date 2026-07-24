import React, { useState, useLayoutEffect, useEffect, useCallback } from 'react';
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
import { RHSColors, borderRadius, typography, spacing } from '../../../lib/theme';
import { housingDocumentApi } from '../api/housingDocumentApi';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { lookupApi } from '../api/lookupApi';
import {
  UploadDocumentResponse,
  ReviewHistory,
  ApplicationDocument,
  RequiredDocumentItem,
} from '../types/application';
import { ApplicationStepper } from '../components/ApplicationStepper';

interface UploadedFile {
  documentId: string;
  fileName: string;
  fileSize: number;
  documentType: string;
  verificationStatus?: string;
  aiRejectedReason?: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return 'Không rõ';
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

function isNeedMoreDocsMode(status?: string): boolean {
  return status === 'NEED_MORE_DOCUMENTS';
}

function findLatestReviewNote(histories: ReviewHistory[]): string | null {
  const requestNotes = histories.filter(h => h.action === 'REQUEST_MORE_DOCUMENTS' && h.note);
  return requestNotes.length > 0 ? requestNotes[0].note : null;
}

export const UploadDocumentsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId, applicationStatus } = route.params;
  const isSupplementMode = isNeedMoreDocsMode(applicationStatus);

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

  const [requiredItems, setRequiredItems] = useState<RequiredDocumentItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingPriorityGroup, setMissingPriorityGroup] = useState(false);
  const [priorityGroupLabel, setPriorityGroupLabel] = useState<string | null>(null);

  const applyDocumentsToState = useCallback((docs: ApplicationDocument[], types: string[]) => {
    const next: Record<string, UploadedFile | null> = {};
    types.forEach((t) => {
      next[t] = null;
    });
    docs.forEach((doc) => {
      if (types.includes(doc.documentType)) {
        next[doc.documentType] = {
          documentId: doc.documentId,
          fileName: doc.fileName,
          fileSize: doc.fileSizeBytes,
          documentType: doc.documentType,
          verificationStatus: doc.verificationStatus,
          aiRejectedReason: doc.aiRejectedReason,
        };
      }
    });
    setUploadedFiles(next);
  }, []);

  const loadRequired = useCallback(async () => {
    const detail = await housingApplicationApi.getApplicationDetail(applicationId);

    if (!detail.priorityGroup?.trim()) {
      setMissingPriorityGroup(true);
      setRequiredItems([]);
      setUploadedFiles({});
      setPriorityGroupLabel(null);
      return;
    }

    setMissingPriorityGroup(false);

    const [requiredDocs, groups] = await Promise.all([
      housingApplicationApi.getRequiredDocumentsByPriorityGroup(detail.priorityGroup),
      lookupApi.getPriorityGroups().catch(() => []),
    ]);

    const group = groups.find((g) => g.code === detail.priorityGroup);
    setPriorityGroupLabel(group?.label ?? detail.priorityGroup);

    setRequiredItems(requiredDocs);
    const types = requiredDocs.map((d) => d.documentType);
    applyDocumentsToState(detail.documents || [], types);

    if (isSupplementMode) {
      setReviewNote(findLatestReviewNote(detail.reviewHistories || []));
    }
  }, [applicationId, applyDocumentsToState, isSupplementMode]);

  useEffect(() => {
    (async () => {
      try {
        await loadRequired();
      } catch (e: any) {
        const isMissingPg =
          e?.message === 'MISSING_PRIORITY_GROUP' ||
          e?.response?.data?.message?.includes?.('priority');
        if (isMissingPg) {
          setMissingPriorityGroup(true);
          setRequiredItems([]);
        } else {
          const msg = e?.response?.data?.message || 'Không thể tải danh sách giấy tờ bắt buộc.';
          Alert.alert('Lỗi', msg);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId, loadRequired]);

  const requiredCount = requiredItems.length;
  const uploadedCount = requiredItems.filter((item) => !!uploadedFiles[item.documentType]).length;
  const canProceed =
    !missingPriorityGroup && requiredCount > 0 && uploadedCount === requiredCount;

  const MAX_PDF_BYTES = 10 * 1024 * 1024;

  const pickAndUpload = async (docKey: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      if (file.size && file.size > MAX_PDF_BYTES) {
        Alert.alert('File quá lớn', 'Chỉ chấp nhận PDF tối đa 10MB.');
        return;
      }

      setUploading((prev) => ({ ...prev, [docKey]: true }));

      const response: UploadDocumentResponse = await housingDocumentApi.uploadDocument(
        applicationId,
        docKey,
        file.uri,
      );

      setUploadedFiles((prev) => ({
        ...prev,
        [docKey]: {
          documentId: response.documentId,
          fileName: file.name,
          fileSize: file.size || 0,
          documentType: docKey,
        },
      }));
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể upload tài liệu.';
      Alert.alert('Lỗi upload', msg);
    } finally {
      setUploading((prev) => ({ ...prev, [docKey]: false }));
    }
  };

  const handleDelete = async (docKey: string) => {
    const file = uploadedFiles[docKey];
    if (!file) return;

    setDeleting((prev) => ({ ...prev, [docKey]: true }));
    try {
      await housingDocumentApi.deleteDocument(applicationId, file.documentId);
      setUploadedFiles((prev) => ({ ...prev, [docKey]: null }));
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể xóa tài liệu.';
      Alert.alert('Lỗi', msg);
    } finally {
      setDeleting((prev) => ({ ...prev, [docKey]: false }));
    }
  };

  const handleSaveAndBack = () => {
    Alert.alert('Đã lưu', 'Giấy tờ của bạn đã được lưu. Bạn có thể tiếp tục chỉnh sửa sau.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleContinueToReview = () => {
    navigation.navigate('ReviewSubmit', {
      applicationId,
      applicationStatus,
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
          <Text style={styles.headerTitle}>
            {isSupplementMode ? 'Bổ sung giấy tờ' : 'Bước 3/4 — Giấy tờ'}
          </Text>
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
      <BrandBar />

      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSupplementMode ? 'Bổ sung giấy tờ' : 'Bước 3/4 — Giấy tờ'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {!isSupplementMode && <ApplicationStepper current={3} />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSupplementMode && (
          <View style={styles.supplementBanner}>
            <Feather name="alert-circle" size={18} color={RHSColors.amber700} />
            <Text style={styles.supplementBannerText}>
              Hồ sơ đang được yêu cầu bổ sung giấy tờ. Kiểm tra ghi chú và tải lên giấy còn thiếu.
            </Text>
          </View>
        )}

        {missingPriorityGroup && (
          <View style={styles.supplementBanner}>
            <Feather name="alert-circle" size={18} color={RHSColors.amber700} />
            <Text style={styles.supplementBannerText}>
              Hồ sơ chưa có nhóm đối tượng thụ hưởng. Quay lại bước thông tin để chọn đối tượng — hệ
              thống mới biết cần nộp 2 hay 3 giấy tờ.
            </Text>
          </View>
        )}

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
          {missingPriorityGroup
            ? 'Không thể xác định bộ giấy tờ bắt buộc khi thiếu nhóm đối tượng.'
            : `Bộ giấy tờ bắt buộc theo đối tượng${
                priorityGroupLabel ? ` «${priorityGroupLabel}»` : ''
              } (Đ76 / Đ29–30). Upload PDF, tối đa 10MB mỗi loại.`}
        </Text>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Feather name="upload-cloud" size={18} color={RHSColors.blue700} />
            <Text style={styles.progressTitle}>Tiến độ tải lên</Text>
          </View>
          <Text style={styles.progressValue}>
            Đã tải {uploadedCount}/{requiredCount || '—'}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${requiredCount ? (uploadedCount / requiredCount) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {requiredItems.map(({ documentType, label, subtitle }) => {
          const file = uploadedFiles[documentType];
          const isUploading = !!uploading[documentType];
          const isDeleting = !!deleting[documentType];

          return (
            <View key={documentType} style={styles.uploadZone}>
              <Text style={styles.uploadLabel}>{label}</Text>
              {!!subtitle && <Text style={styles.uploadSubtitle}>{subtitle}</Text>}

              {file ? (
                <View style={styles.fileCard}>
                  <View style={styles.fileCardLeft}>
                    <View
                      style={[
                        styles.pdfIconWrap,
                        file.verificationStatus === 'REJECTED' && styles.pdfIconWrapRejected,
                      ]}
                    >
                      <Feather
                        name="file"
                        size={28}
                        color={
                          file.verificationStatus === 'REJECTED'
                            ? RHSColors.red600
                            : RHSColors.blue700
                        }
                      />
                      <Text
                        style={[
                          styles.pdfLabel,
                          file.verificationStatus === 'REJECTED' && { color: RHSColors.red600 },
                        ]}
                      >
                        PDF
                      </Text>
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
                        Alert.alert('Xóa tài liệu', 'Bạn có chắc muốn xóa tài liệu này?', [
                          { text: 'Hủy', style: 'cancel' },
                          {
                            text: 'Xóa',
                            style: 'destructive',
                            onPress: () => handleDelete(documentType),
                          },
                        ]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Feather name="x" size={18} color={RHSColors.red600} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.dashedZone, isUploading && styles.dashedZoneActive]}
                  onPress={() => pickAndUpload(documentType)}
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
                      <Text style={styles.dashedZoneHint}>Chỉ PDF, tối đa 10MB</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.continueBtn, !canProceed && styles.continueBtnDisabled]}
          onPress={handleContinueToReview}
          activeOpacity={0.9}
          disabled={!canProceed}
        >
          <View style={[styles.continueGrad, !canProceed && { backgroundColor: RHSColors.grey400 }]}>
            {isSupplementMode ? (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.continueText}>Nộp lại hồ sơ</Text>
              </>
            ) : (
              <>
                <Text style={styles.continueText}>Tiếp tục</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </View>
        </TouchableOpacity>
        {!canProceed && (
          <Text style={styles.gateHint}>
            {missingPriorityGroup
              ? 'Cần chọn nhóm đối tượng trước khi tải giấy tờ.'
              : `Vui lòng upload đủ ${requiredCount || '—'} loại giấy tờ bắt buộc`}
          </Text>
        )}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAndBack} activeOpacity={0.9}>
          <Feather name="save" size={18} color={RHSColors.blue700} />
          <Text style={styles.saveBtnText}>Lưu & quay lại</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 40 },
  description: {
    ...typography.bodySmall,
    color: RHSColors.textSecondary,
    paddingHorizontal: 2,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  incomeChoiceCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    gap: 8,
  },
  incomeChoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: RHSColors.text,
  },
  incomeChoiceHint: {
    fontSize: 12,
    color: RHSColors.textMuted,
    lineHeight: 18,
  },
  incomeChoiceRow: { flexDirection: 'row', gap: 10 },
  incomeChoiceBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: RHSColors.grey300,
    alignItems: 'center',
  },
  incomeChoiceBtnActive: {
    borderColor: RHSColors.blue700,
    backgroundColor: RHSColors.blue50,
  },
  incomeChoiceBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: RHSColors.textSecondary,
  },
  incomeChoiceBtnTextActive: { color: RHSColors.blue700 },
  progressCard: {
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: RHSColors.blue200,
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: RHSColors.blue700,
  },
  progressValue: {
    ...typography.h3,
    color: RHSColors.text,
  },
  progressTrack: {
    height: 8,
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.full,
  },
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
    lineHeight: 18,
  },
  dashedZone: {
    borderWidth: 2,
    borderColor: '#B0BEC5',
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    paddingVertical: 40,
    minHeight: 140,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },
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
  pdfIconWrapRejected: {
    backgroundColor: RHSColors.red50,
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    gap: 8,
    marginTop: 10,
  },
  saveBtnText: {
    ...typography.buttonSmall,
    color: RHSColors.blue700,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  gateHint: {
    fontSize: 12,
    color: RHSColors.amber700,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});
