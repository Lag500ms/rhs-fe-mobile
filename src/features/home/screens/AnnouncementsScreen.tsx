import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import {
  announcementsApi,
  ANNOUNCEMENT_TYPE_LABEL,
  type AnnouncementDto,
} from '../api/announcementsApi';

function typeLabel(t: string) {
  return ANNOUNCEMENT_TYPE_LABEL[t] || t || 'Thông báo';
}

function formatDate(iso?: string | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
}

export const AnnouncementsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const detailId = route.params?.announcementId as string | undefined;

  const [items, setItems] = useState<AnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<AnnouncementDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async (q?: string) => {
    setError('');
    try {
      const data = await announcementsApi.getPublished({
        page: 1,
        pageSize: 30,
        search: q?.trim() || undefined,
      });
      setItems(data.items);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được thông báo.');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setError('');
    try {
      const data = await announcementsApi.getById(id);
      setDetail(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được chi tiết.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      if (detailId) {
        void openDetail(detailId);
      } else {
        setDetail(null);
        void loadList();
      }
    }, [detailId, loadList, openDetail]),
  );

  if (detail || detailId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Chi tiết thông báo"
          isWhite
          onBack={() => {
            if (detailId) navigation.goBack();
            else setDetail(null);
          }}
        />
        {detailLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={RHSColors.blue700} />
          </View>
        ) : detail ? (
          <ScrollView contentContainerStyle={styles.detailPad} showsVerticalScrollIndicator={false}>
            <View style={styles.typeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{typeLabel(detail.announcementType)}</Text>
              </View>
              {detail.isPinned && (
                <View style={styles.pinRow}>
                  <Feather name="bookmark" size={14} color={RHSColors.amber700} />
                  <Text style={styles.pinText}>Ghim</Text>
                </View>
              )}
            </View>
            <Text style={styles.detailTitle}>{detail.title}</Text>
            <Text style={styles.meta}>
              {detail.createdByName}
              {detail.projectName ? ` · ${detail.projectName}` : ''}
              {detail.createdAt ? ` · ${formatDate(detail.createdAt)}` : ''}
            </Text>
            {detail.legalDocumentNumber ? (
              <Text style={styles.legal}>Số văn bản: {detail.legalDocumentNumber}</Text>
            ) : null}
            <Text style={styles.content}>{stripHtml(detail.content)}</Text>
            {detail.attachments?.length > 0 && (
              <View style={styles.attachBox}>
                <Text style={styles.attachTitle}>Đính kèm</Text>
                {detail.attachments.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.attachRow}
                    onPress={() => Linking.openURL(a.fileUrl)}
                  >
                    <Feather name="paperclip" size={16} color={RHSColors.blue700} />
                    <Text style={styles.attachName} numberOfLines={1}>{a.fileName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error || 'Không tìm thấy thông báo.'}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Thông báo công khai" isWhite />
      <View style={styles.searchRow}>
        <Feather name="search" size={16} color={RHSColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tiêu đề..."
          placeholderTextColor={RHSColors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => {
            setLoading(true);
            void loadList(search);
          }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadList(search);
              }}
              tintColor={RHSColors.blue700}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="megaphone" size={40} color={RHSColors.textMuted} />
              <Text style={styles.emptyText}>
                {error || 'Chưa có thông báo công khai.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => void openDetail(item.id)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.isPinned && <Feather name="bookmark" size={16} color={RHSColors.amber700} />}
              </View>
              <Text style={styles.cardMeta}>
                {typeLabel(item.announcementType)}
                {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ''}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.createdByName}
                {item.projectName ? ` · ${item.projectName}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: RHSColors.surfaceCard,
    borderWidth: 1,
    borderColor: RHSColors.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: RHSColors.text },
  listPad: { padding: spacing.md, paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: RHSColors.border,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { ...typography.body, fontWeight: '700', color: RHSColors.text, flex: 1 },
  cardMeta: { marginTop: 6, fontSize: 12, color: RHSColors.blue700, fontWeight: '600' },
  cardSub: { marginTop: 4, fontSize: 12, color: RHSColors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyText: { textAlign: 'center', color: RHSColors.textMuted, fontSize: 14 },
  errorText: { color: RHSColors.red600, textAlign: 'center' },
  detailPad: { padding: spacing.md, paddingBottom: 48 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  typeBadge: {
    backgroundColor: RHSColors.blue50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: RHSColors.blue700 },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinText: { fontSize: 12, color: RHSColors.amber700, fontWeight: '600' },
  detailTitle: { fontSize: 20, fontWeight: '800', color: RHSColors.text, marginBottom: 8 },
  meta: { fontSize: 13, color: RHSColors.textMuted, marginBottom: 8 },
  legal: { fontSize: 13, color: RHSColors.text, marginBottom: 12, fontWeight: '600' },
  content: { fontSize: 15, lineHeight: 22, color: RHSColors.text },
  attachBox: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: RHSColors.border },
  attachTitle: { fontWeight: '700', marginBottom: 8, color: RHSColors.text },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  attachName: { flex: 1, color: RHSColors.blue700, fontWeight: '600' },
});
