import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { SubmitButton } from '../../../components/ActionButton';
import { getToken } from '../../../lib/tokenStorage';
import {
  issueReportApi,
  IssueReportListItem,
  CreateIssueReportRequest,
} from '../api/issueReportApi';

const ISSUE_TYPES = [
  { value: 'Bug', label: 'Báo lỗi', icon: 'alert-triangle' },
  { value: 'FeatureRequest', label: 'Góp ý tính năng', icon: 'lightbulb' },
  { value: 'Improvement', label: 'Cải thiện', icon: 'trending-up' },
  { value: 'Other', label: 'Khác', icon: 'more-horizontal' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Open: { label: 'Đang xử lý', color: RHSColors.govGoldDark },
  InProgress: { label: 'Đang xử lý', color: RHSColors.govBlue },
  Resolved: { label: 'Đã xử lý', color: RHSColors.govGreen },
  Closed: { label: 'Đã đóng', color: RHSColors.textMuted },
};

export const IssueReportScreen = () => {
  const navigation = useNavigation<any>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('Bug');
  const [submitting, setSubmitting] = useState(false);

  // My reports state
  const [reports, setReports] = useState<IssueReportListItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useFocusEffect(
    React.useCallback(() => {
      checkAuthAndLoad();
    }, []),
  );

  const checkAuthAndLoad = async () => {
    const token = await getToken();
    if (token) {
      setIsLoggedIn(true);
      loadReports(1);
    } else {
      setIsLoggedIn(false);
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
      loadReports(pageIndex + 1);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả chi tiết.');
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
      Alert.alert('Thành công', 'Cảm ơn bạn đã gửi góp ý/báo lỗi!');
      // Reset form
      setTitle('');
      setDescription('');
      setIssueType('Bug');
      setShowForm(false);
      // Reload reports from page 1
      loadReports(1);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể gửi báo cáo. Vui lòng thử lại.';
      Alert.alert('Lỗi', message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderReportItem = ({ item }: { item: IssueReportListItem }) => {
    const statusInfo = STATUS_MAP[item.status] || {
      label: item.status,
      color: RHSColors.textMuted,
    };

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        <View style={styles.reportMeta}>
          <Feather name="tag" size={12} color={RHSColors.textMuted} />
          <Text style={styles.reportMetaText}>{item.issueType}</Text>
          <Feather
            name="calendar"
            size={12}
            color={RHSColors.textMuted}
            style={{ marginLeft: 12 }}
          />
          <Text style={styles.reportMetaText}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loadingReports) return null;
    return (
      <View style={styles.emptyContainer}>
        <Feather name="inbox" size={48} color={RHSColors.textMuted} />
        <Text style={styles.emptyText}>
          Bạn chưa có góp ý/báo lỗi nào.
        </Text>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Góp ý báo lỗi" onBack={() => navigation.goBack()} />
        <View style={styles.centeredContainer}>
          <Feather name="lock" size={48} color={RHSColors.textMuted} />
          <Text style={styles.notLoggedInTitle}>Yêu cầu đăng nhập</Text>
          <Text style={styles.notLoggedInDesc}>
            Vui lòng đăng nhập để gửi góp ý hoặc báo lỗi.
          </Text>
          <SubmitButton
            text="Đăng nhập"
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Góp ý báo lỗi" onBack={() => navigation.goBack()} />

      {/* Create new button */}
      {!showForm && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowForm(true)}
        >
          <Feather name="plus-circle" size={20} color={RHSColors.white} />
          <Text style={styles.createButtonText}>Tạo góp ý / báo lỗi mới</Text>
        </TouchableOpacity>
      )}

      {/* Form */}
      {showForm && (
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Tạo góp ý / báo lỗi mới</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Feather name="x" size={22} color={RHSColors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Issue Type Selector */}
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
                    color={
                      issueType === type.value
                        ? RHSColors.white
                        : RHSColors.govBlue
                    }
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

            {/* Title */}
            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập tiêu đề ngắn gọn..."
              placeholderTextColor={RHSColors.textMuted}
              maxLength={255}
            />

            {/* Description */}
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

            {/* Submit / Cancel */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <SubmitButton
                  text={submitting ? 'Đang gửi...' : 'Gửi'}
                  onPress={handleSubmit}
                  disabled={submitting}
                  loading={submitting}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* My Reports List */}
      <View style={styles.listSection}>
        <Text style={styles.listSectionTitle}>
          Danh sách góp ý / báo lỗi của bạn
        </Text>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
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
        refreshing={loadingReports && reports.length === 0}
        onRefresh={() => loadReports(1)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notLoggedInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: RHSColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  notLoggedInDesc: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.govBlue,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.white,
  },
  formContainer: {
    flex: 0,
    maxHeight: 480,
  },
  formContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: RHSColors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: RHSColors.text,
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
    minHeight: 100,
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
  listSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  reportCard: {
    backgroundColor: RHSColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.text,
    marginRight: 12,
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
    gap: 4,
  },
  reportMetaText: {
    fontSize: 12,
    color: RHSColors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: RHSColors.textMuted,
    marginTop: 12,
  },
});