import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';

interface DraftActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onManageDocs: () => void;
  onReviewSubmit: () => void;
}

export const DraftActionSheet: React.FC<DraftActionSheetProps> = ({
  visible,
  onClose,
  onManageDocs,
  onReviewSubmit,
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.sheetOverlay}>
      <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Quản lý hồ sơ nháp</Text>
        <Text style={styles.sheetDesc}>
          Thông tin định danh lấy từ eKYC — chỉ quản lý giấy tờ và nộp hồ sơ.
        </Text>

        <TouchableOpacity style={styles.sheetOption} onPress={onManageDocs} activeOpacity={0.8}>
          <View style={[styles.sheetOptionIcon, { backgroundColor: RHSColors.amber50 }]}>
            <Feather name="upload" size={20} color={RHSColors.amber700} />
          </View>
          <View style={styles.sheetOptionContent}>
            <Text style={styles.sheetOptionTitle}>Quản lý giấy tờ</Text>
            <Text style={styles.sheetOptionDesc}>Tải lên, xóa hoặc thay thế giấy tờ PDF</Text>
          </View>
          <Feather name="chevron-right" size={18} color={RHSColors.grey400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetOption} onPress={onReviewSubmit} activeOpacity={0.8}>
          <View style={[styles.sheetOptionIcon, { backgroundColor: RHSColors.green50 }]}>
            <Feather name="eye" size={20} color={RHSColors.green600} />
          </View>
          <View style={styles.sheetOptionContent}>
            <Text style={styles.sheetOptionTitle}>Xem & Nộp hồ sơ</Text>
            <Text style={styles.sheetOptionDesc}>Kiểm tra lại toàn bộ và nộp cho thẩm định</Text>
          </View>
          <Feather name="chevron-right" size={18} color={RHSColors.grey400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetCancel} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.sheetCancelText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject },
  sheetContainer: {
    backgroundColor: RHSColors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xxl,
    paddingBottom: 40,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: RHSColors.grey300, alignSelf: 'center', marginBottom: spacing.xl,
  },
  sheetTitle: { ...typography.h2, color: RHSColors.text, marginBottom: 6 },
  sheetDesc: { ...typography.bodySmall, color: RHSColors.textSecondary, marginBottom: spacing.xl, lineHeight: 20 },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: spacing.xs, borderBottomWidth: 1, borderBottomColor: RHSColors.grey100, gap: 14,
  },
  sheetOptionIcon: { width: 44, height: 44, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  sheetOptionContent: { flex: 1, gap: 2 },
  sheetOptionTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  sheetOptionDesc: { ...typography.caption, color: RHSColors.textMuted, lineHeight: 16 },
  sheetCancel: {
    marginTop: spacing.lg, paddingVertical: 14, alignItems: 'center',
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: RHSColors.grey300,
  },
  sheetCancelText: { ...typography.bodySmall, fontWeight: '600', color: RHSColors.textSecondary },
});
