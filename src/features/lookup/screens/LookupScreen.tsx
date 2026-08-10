import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { getToken } from '../../../lib/tokenStorage';
import { housingApplicationApi } from '../../application/api/housingApplicationApi';
import { getStatusConfig } from '../../application/utils/statusConfig';
import { LOTTERY_RESULT_LABEL } from '../../lottery/types/lottery';
import {
  publicPostCheckApi,
  type PublicPostCheckItem,
  type PublicPostCheckStats,
} from '../api/publicPostCheckApi';

type AuthDetail = {
  projectName?: string;
  fullName?: string;
  citizenId?: string;
  applicationStatus?: string;
  reviewHistories?: Array<{ action?: string; changedAt?: string; note?: string | null }>;
};

export const LookupScreen = () => {
  const navigation = useNavigation<any>();
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authDetail, setAuthDetail] = useState<AuthDetail | null>(null);
  const [publicItem, setPublicItem] = useState<PublicPostCheckItem | null>(null);
  const [publicList, setPublicList] = useState<PublicPostCheckItem[]>([]);
  const [stats, setStats] = useState<PublicPostCheckStats | null>(null);

  const search = useCallback(async () => {
    const trimmed = id.trim();
    if (!trimmed) {
      setError('Vui lòng nhập mã hồ sơ.');
      return;
    }
    setLoading(true);
    setError('');
    setAuthDetail(null);
    setPublicItem(null);
    try {
      const token = await getToken();
      if (token) {
        try {
          const detail = await housingApplicationApi.getApplicationDetail(trimmed);
          setAuthDetail({
            projectName: detail.projectName,
            fullName: detail.fullName,
            citizenId: detail.citizenId,
            applicationStatus: detail.applicationStatus,
            reviewHistories: detail.reviewHistories,
          });
          return;
        } catch (err: any) {
          if (err?.response?.status === 401) {
            setError('Vui lòng đăng nhập để tra cứu hồ sơ này.');
            return;
          }
          // Fall through to public lookup
        }
      }
      const item = await publicPostCheckApi.getById(trimmed);
      if (item) setPublicItem(item);
      else setError('Không tìm thấy hồ sơ trong danh sách công bố.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không tra cứu được hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadPublicList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, statsData] = await Promise.all([
        publicPostCheckApi.list(),
        publicPostCheckApi.stats(),
      ]);
      setPublicList(list);
      setStats(statsData);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không tải được danh sách công bố.');
    } finally {
      setLoading(false);
    }
  }, []);

  const statusLabel = (status?: string) => getStatusConfig(String(status || '')).label;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Tra cứu hồ sơ" onBack={() => navigation.goBack()} isWhite />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>Tra cứu công khai</Text>
          <Text style={styles.subtitle}>
            Tra cứu hồ sơ nhà ở xã hội. Có thể xem danh sách đã công bố mà không cần đăng nhập.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tìm kiếm</Text>
            <Text style={styles.cardHint}>
              Nhập mã hồ sơ để xem trạng thái công bố.
            </Text>
            <View style={styles.searchRow}>
              <View style={styles.inputWrap}>
                <Feather name="search" size={16} color={RHSColors.textMuted} style={styles.searchIcon} />
                <TextInput
                  value={id}
                  onChangeText={setId}
                  placeholder="Nhập mã hồ sơ..."
                  placeholderTextColor={RHSColors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  returnKeyType="search"
                  onSubmitEditing={() => void search()}
                />
              </View>
              <TouchableOpacity
                style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
                onPress={() => void search()}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.searchBtnText}>{loading ? '...' : 'Tra cứu'}</Text>
              </TouchableOpacity>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>

          {loading && (
            <ActivityIndicator color={RHSColors.blue700} style={{ marginVertical: spacing.lg }} />
          )}

          {!loading && !authDetail && !publicItem && !error && publicList.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa tra cứu</Text>
              <Text style={styles.emptyDesc}>Nhập mã hồ sơ ở trên để xem tiến độ xử lý.</Text>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => void loadPublicList()} activeOpacity={0.85}>
                <Text style={styles.outlineBtnText}>Xem danh sách công bố</Text>
              </TouchableOpacity>
            </View>
          )}

          {authDetail && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{authDetail.projectName || 'Hồ sơ'}</Text>
              <Text style={styles.meta}>
                {authDetail.fullName || '—'} · {authDetail.citizenId || '—'}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel(authDetail.applicationStatus)}</Text>
              </View>
              {!!authDetail.reviewHistories?.length && (
                <View style={styles.timeline}>
                  <Text style={[styles.cardTitle, { marginTop: spacing.md }]}>Lịch sử xử lý</Text>
                  {authDetail.reviewHistories.map((h, i) => (
                    <View key={`${h.changedAt}-${i}`} style={styles.timelineItem}>
                      <Text style={styles.timelineTitle}>{h.action || 'Cập nhật'}</Text>
                      <Text style={styles.timelineMeta}>
                        {h.changedAt ? new Date(h.changedAt).toLocaleString('vi-VN') : '—'}
                      </Text>
                      {!!h.note && <Text style={styles.timelineNote}>{h.note}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {publicItem && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{publicItem.projectName || 'Dự án'}</Text>
              <Text style={styles.meta}>
                {publicItem.fullName || '—'} · {publicItem.citizenId || '—'}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel(publicItem.applicationStatus)}</Text>
              </View>
              {!!publicItem.slotCode && (
                <Text style={styles.meta}>Mã căn: {publicItem.slotCode}</Text>
              )}
              {!!publicItem.lotteryResult && (
                <Text style={styles.meta}>
                  Kết quả bốc thăm:{' '}
                  {LOTTERY_RESULT_LABEL[String(publicItem.lotteryResult)] ??
                    publicItem.lotteryResult}
                </Text>
              )}
            </View>
          )}

          {publicList.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Danh sách hồ sơ công bố ({publicList.length})</Text>
              {stats && (
                <Text style={styles.cardHint}>
                  Tổng: {stats.totalApplications ?? '—'} · Đạt: {stats.approved ?? '—'} · Từ chối:{' '}
                  {stats.rejected ?? '—'}
                </Text>
              )}
              {publicList.slice(0, 50).map((it) => (
                <TouchableOpacity
                  key={it.applicationId}
                  style={styles.listItem}
                  onPress={() => {
                    setId(it.applicationId);
                    setPublicItem(it);
                    setAuthDetail(null);
                    setError('');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listName}>{it.fullName || '—'}</Text>
                    <Text style={styles.listMeta}>{it.projectName || ''}</Text>
                  </View>
                  <Text style={styles.listStatus}>{statusLabel(it.applicationStatus)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  eyebrow: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: RHSColors.blue700,
  },
  subtitle: { ...typography.body, color: RHSColors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg },
  card: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  cardTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  cardHint: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4, marginBottom: spacing.md },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    backgroundColor: RHSColors.surface,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { marginRight: spacing.sm },
  input: { flex: 1, height: 44, ...typography.body, color: RHSColors.text },
  searchBtn: {
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    height: 44,
    justifyContent: 'center',
  },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { ...typography.bodySmall, fontWeight: '700', color: '#fff' },
  error: { ...typography.caption, color: RHSColors.red600, marginTop: spacing.sm },
  emptyCard: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  emptyTitle: { ...typography.h3, color: RHSColors.text },
  emptyDesc: { ...typography.body, color: RHSColors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  outlineBtn: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  outlineBtnText: { ...typography.bodySmall, fontWeight: '600', color: RHSColors.blue700 },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: { ...typography.caption, fontWeight: '700', color: RHSColors.blue700 },
  timeline: { marginTop: spacing.sm },
  timelineItem: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: RHSColors.border,
  },
  timelineTitle: { ...typography.bodySmall, fontWeight: '600', color: RHSColors.text },
  timelineMeta: { ...typography.caption, color: RHSColors.textMuted },
  timelineNote: { ...typography.caption, color: RHSColors.text, marginTop: 2 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: RHSColors.border,
  },
  listName: { ...typography.bodySmall, fontWeight: '600', color: RHSColors.text },
  listMeta: { ...typography.caption, color: RHSColors.textMuted, marginTop: 2 },
  listStatus: { ...typography.caption, color: RHSColors.blue700, fontWeight: '600' },
});
