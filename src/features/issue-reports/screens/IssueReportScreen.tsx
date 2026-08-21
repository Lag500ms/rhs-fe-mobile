import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { appAlert } from '../../../lib/appDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors, shadows, borderRadius, spacing, typography } from '../../../lib/theme';
import { getToken } from '../../../lib/tokenStorage';
import { EmptyStateIllustration } from '../../../components/EmptyStateIllustration';
import { issueReportApi } from '../api/issueReportApi';
import { IssueReportListItem, CreateIssueReportRequest } from '../types/issueReport';

const ISSUE_TYPES = [
  { value: 'Bug', label: 'Báo lỗi', icon: 'alert-triangle' },
  { value: 'FeatureRequest', label: 'Góp ý tính năng', icon: 'lightbulb' },
  { value: 'Improvement', label: 'Cải thiện', icon: 'trending-up' },
  { value: 'Other', label: 'Khác', icon: 'more-horizontal' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  Open: { label: 'Chờ xử lý', color: RHSColors.govGoldDark, bg: '#FFF8E1' },
  InProgress: { label: 'Đang xử lý', color: RHSColors.govBlue, bg: '#E3F2FD' },
  Resolved: { label: 'Đã xử lý', color: RHSColors.govGreen, bg: '#E8F5E9' },
  Closed: { label: 'Đã đóng', color: RHSColors.textMuted, bg: '#F5F5F5' },
};

export const IssueReportScreen = () => {
  const navigation = useNavigation<any>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('Bug');
  const [submitting, setSubmitting] = useState(false);

  const [reports, setReports] = useState<IssueReportListItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useFocusEffect(
    useCallback(() => {
      void checkAuthAndLoad();
    }, []),
  );

  const checkAuthAndLoad = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setReports([]);
        setShowForm(false);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
      await loadReports(1);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async (page: number) => {
    setLoadingReports(true);
    try {
      const result = await issueReportApi.getMyReports(page, pageSize);
      if (page === 1) {
        setReports(result.items);
      } else {
        setReports((prev) => [...prev, ...result.items]);
      }
      setPageIndex(page);
      setTotalCount(result.totalCount);
    } catch (error: any) {
      console.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleLoadMore = () => {
    if (reports.length < totalCount && !loadingReports) {
      void loadReports(pageIndex + 1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports(1);
    setRefreshing(false);
  };

  const handleLoginPress = () => {
    navigation.navigate('Auth', { screen: 'Login', params: { returnTo: 'Account' } });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIssueType('Bug');
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      appAlert('Lỗi', 'Vui lòng nhập tiêu đề.');
      return;
    }
    if (!description.trim()) {
      appAlert('Lỗi', 'Vui lòng nhập mô tả chi tiết.');
      return;
    }

    setSubmitting(true);
    try {
      const request: CreateIssueReportRequest = {
        title: title.trim(),
        description: description.trim(),
        issueType,
      };
      await issueReportApi.create(request);
      appAlert('Thành công', 'Cảm ơn bạn đã gửi góp ý/báo lỗi!');
      resetForm();
      void loadReports(1);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể gửi báo cáo. Vui lòng thử lại.';
      appAlert('Lỗi', message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderReportItem = ({ item }: { item: IssueReportListItem }) => {
    const statusInfo = STATUS_MAP[item.status] || {
      label: item.status,
      color: RHSColors.textMuted,
      bg: '#F5F5F5',
    };

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        <View style={styles.reportMeta}>
          <View style={styles.reportMetaItem}>
            <Feather name="tag" size={12} color={RHSColors.textMuted} />
            <Text style={styles.reportMetaText}>{item.issueType}</Text>
          </View>
          <View style={styles.reportMetaDot} />
          <View style={styles.reportMetaItem}>
            <Feather name="calendar" size={12} color={RHSColors.textMuted} />
            <Text style={styles.reportMetaText}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading || loadingReports) return null;

    if (!isLoggedIn) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationWrap}>
            <EmptyStateIllustration name="login" size={240} />
          </View>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptyDesc}>
            Vui lòng đăng nhập để gửi góp ý hoặc báo lỗi đến chúng tôi
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleLoginPress} activeOpacity={0.85}>
            <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.illustrationWrap}>
          <EmptyStateIllustration name="feedback" size={240} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có góp ý / báo lỗi</Text>
        <Text style={styles.emptyDesc}>
          Nhấn nút bên dưới để gửi phản hồi, góp ý hoặc báo lỗi đến chúng tôi.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowForm(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonText}>Tạo góp ý / báo lỗi</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderForm = () => (
    <KeyboardAvoidingView
      style={styles.formFlex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <ScrollView
        contentContainerStyle={styles.formScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Tạo góp ý / báo lỗi mới</Text>

          <Text style={styles.label}>Loại</Text>
          <View style={styles.issueTypeGrid}>
            {ISSUE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.issueTypeChip,
                  issueType === type.value && styles.issueTypeChipActive,
                ]}
                onPress={() => setIssueType(type.value)}
              >
                <Feather
                  name={type.icon as any}
                  size={14}
                  color={issueType === type.value ? RHSColors.white : RHSColors.govBlue}
                />
                <Text
                  style={[
                    styles.issueTypeChipText,
                    issueType === type.value && styles.issueTypeChipTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nhập tiêu đề ngắn gọn..."
            placeholderTextColor={RHSColors.textMuted}
            maxLength={255}
          />

          <Text style={styles.label}>Mô tả chi tiết</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả chi tiết vấn đề hoặc góp ý của bạn..."
            placeholderTextColor={RHSColors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (showForm) resetForm();
            else navigation.goBack();
          }}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{showForm ? 'Tạo góp ý' : 'Góp ý báo lỗi'}</Text>
        {!showForm && reports.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{reports.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={RHSColors.blue700} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : showForm && isLoggedIn ? (
          renderForm()
        ) : (
          <FlatList
            data={isLoggedIn ? reports : []}
            keyExtractor={(item) => item.id}
            renderItem={renderReportItem}
            ListEmptyComponent={renderEmpty}
            ListHeaderComponent={
              isLoggedIn && reports.length > 0 ? (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setShowForm(true)}
                  activeOpacity={0.85}
                >
                  <Feather name="plus-circle" size={20} color={RHSColors.white} />
                  <Text style={styles.createButtonText}>Tạo góp ý / báo lỗi mới</Text>
                </TouchableOpacity>
              ) : null
            }
            contentContainerStyle={reports.length === 0 ? styles.emptyList : styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              isLoggedIn ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void onRefresh()}
                  colors={[RHSColors.blue700]}
                />
              ) : undefined
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingReports && reports.length > 0 ? (
                <ActivityIndicator
                  size="small"
                  color={RHSColors.govBlue}
                  style={{ paddingVertical: 16 }}
                />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: RHSColors.white,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: RHSColors.text,
    letterSpacing: -0.3,
  },
  countBadge: {
    marginLeft: 10,
    backgroundColor: RHSColors.govBlue,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  illustrationWrap: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: RHSColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 15,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.blue700,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.white,
  },
  formFlex: { flex: 1 },
  formScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  formCard: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: RHSColors.border,
    ...shadows.sm,
  },
  formTitle: {
    ...typography.h3,
    color: RHSColors.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  issueTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: RHSColors.border,
    backgroundColor: RHSColors.white,
  },
  issueTypeChipActive: {
    borderColor: RHSColors.govBlue,
    backgroundColor: RHSColors.govBlue,
  },
  issueTypeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: RHSColors.govBlue,
  },
  issueTypeChipTextActive: {
    color: RHSColors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: RHSColors.text,
    backgroundColor: RHSColors.surface,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RHSColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.textMuted,
  },
  submitButton: {
    flex: 1,
    backgroundColor: RHSColors.blue700,
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.white,
  },
  reportCard: {
    backgroundColor: RHSColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderLeftWidth: 4,
    borderLeftColor: RHSColors.govBlue,
    ...shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  reportTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: RHSColors.grey300,
  },
  reportMetaText: {
    fontSize: 12,
    color: RHSColors.textMuted,
  },
});
