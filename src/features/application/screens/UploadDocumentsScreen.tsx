import React, { useState, useLayoutEffect } from 'react';
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
import { housingDocumentApi, UploadDocumentResponse } from '../api/housingDocumentApi';

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
}

function formatFileSize(bytes: number): string {
  if (!bytes) return 'Không rõ';
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

export const UploadDocumentsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId } = route.params;

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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Thin brand bar at top */}
      <BrandBar />

      {/* White header */}
      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tải lên giấy tờ</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stepper */}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Tải lên file PDF (tối đa 10MB mỗi file) cho từng loại giấy tờ bên dưới.
          Bạn chỉ cần 1 file cho mỗi loại.
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
                // File Card - after successful upload
                <View style={styles.fileCard}>
                  <View style={styles.fileCardLeft}>
                    <View style={styles.pdfIconWrap}>
                      <Feather name="file" size={28} color={RHSColors.blue700} />
                      <Text style={styles.pdfLabel}>PDF</Text>
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
                      onPress={() => handleDelete(key)}
                      activeOpacity={0.7}
                    >
                      <Feather name="x" size={18} color={RHSColors.red600} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                // Dashed upload zone - new style: white bg, #B0BEC5 border
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
                <Text style={styles.continueText}>Tiếp tục</Text>
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