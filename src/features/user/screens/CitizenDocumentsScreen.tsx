import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, spacing, typography, shadows } from '../../../lib/theme';
import { appAlert } from '../../../lib/appDialog';
import { citizenProfileApi } from '../api/citizenProfileApi';
import {
  PROFILE_DOC_GROUPS,
  type CitizenFullProfileDto,
  type UserDocumentDto,
} from '../types/citizenProfile';

export const CitizenDocumentsScreen = () => {
  const [profile, setProfile] = useState<CitizenFullProfileDto | null>(null);
  const [docs, setDocs] = useState<UserDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await citizenProfileApi.getFullProfile();
      setProfile(p);
      setDocs(p.documents || []);
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không tải được kho giấy tờ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const byType = useMemo(() => {
    const map = new Map<string, UserDocumentDto>();
    docs.forEach((d) => map.set(d.documentType.toUpperCase(), d));
    return map;
  }, [docs]);

  const required = new Set(
    (profile?.requiredDocumentTypes || []).map((t) => t.toUpperCase()),
  );
  const missing = new Set(
    (profile?.missingDocumentTypes || []).map((t) => t.toUpperCase()),
  );

  const visibleGroups = useMemo(() => {
    return PROFILE_DOC_GROUPS.map((g) => {
      let types = g.types;
      if (g.key === 'marital') {
        const m = profile?.maritalStatus?.toUpperCase();
        if (m === 'MARRIED')
          types = types.filter((t) => t.code === 'MARRIAGE_CERTIFICATE');
        else if (m === 'SINGLE')
          types = types.filter((t) => t.code === 'SINGLE_STATUS_CERTIFICATE');
        else if (m === 'DIVORCED')
          types = types.filter((t) => t.code === 'DIVORCE_CERTIFICATE');
        else types = [];
      }
      if (g.key === 'dependent' && (profile?.dependentMembersCount ?? 0) === 0) {
        types = [];
      }
      return { ...g, types };
    }).filter((g) => g.types.length > 0);
  }, [profile]);

  const pickAndUpload = (documentType: string) => {
    appAlert('Tải giấy tờ', 'Chọn nguồn tài liệu', [
      {
        text: 'Chụp ảnh',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            appAlert('Cần quyền', 'Cho phép camera để chụp giấy tờ.');
            return;
          }
          const r = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            quality: 0.85,
          });
          if (r.canceled || !r.assets?.[0]) return;
          await upload(documentType, r.assets[0].uri, `doc_${Date.now()}.jpg`, 'image/jpeg');
        },
      },
      {
        text: 'Thư viện ảnh',
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            quality: 0.85,
          });
          if (r.canceled || !r.assets?.[0]) return;
          const uri = r.assets[0].uri;
          const name = r.assets[0].fileName || `doc_${Date.now()}.jpg`;
          await upload(documentType, uri, name, 'image/jpeg');
        },
      },
      {
        text: 'File PDF',
        onPress: async () => {
          const r = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true,
          });
          if (r.canceled || !r.assets?.[0]) return;
          const a = r.assets[0];
          await upload(
            documentType,
            a.uri,
            a.name || `doc_${Date.now()}.pdf`,
            a.mimeType || 'application/pdf',
          );
        },
      },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const upload = async (
    documentType: string,
    uri: string,
    fileName: string,
    mimeType: string,
  ) => {
    setUploadingType(documentType);
    try {
      await citizenProfileApi.uploadDocument({
        documentType,
        uri,
        fileName,
        mimeType,
      });
      await load();
      appAlert('Thành công', 'Đã tải giấy tờ vào kho hồ sơ.');
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không tải được giấy tờ.');
    } finally {
      setUploadingType(null);
    }
  };

  const removeDoc = (doc: UserDocumentDto) => {
    appAlert('Xóa giấy tờ', `Xóa ${doc.documentTypeLabel}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await citizenProfileApi.deleteDocument(doc.documentId);
            await load();
          } catch (e: any) {
            appAlert('Lỗi', e?.response?.data?.message || 'Không xóa được.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScreenHeader title="Kho giấy tờ" isWhite />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {(profile?.missingDocumentTypes?.length ?? 0) > 0 && (
            <View style={styles.warnBox}>
              <Feather name="alert-triangle" size={16} color={RHSColors.amber700} />
              <Text style={styles.warnText}>
                Còn thiếu {profile!.missingDocumentTypes.length} giấy tờ bắt buộc theo hồ sơ
                hiện tại.
              </Text>
            </View>
          )}

          {visibleGroups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.types.map((t) => {
                const doc = byType.get(t.code);
                const isRequired = required.has(t.code);
                const isMissing = missing.has(t.code);
                const busy = uploadingType === t.code;

                return (
                  <View key={t.code} style={styles.slot}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotTitle}>
                        {t.label}
                        {isRequired ? ' *' : ''}
                      </Text>
                      <Text
                        style={[
                          styles.slotStatus,
                          {
                            color: doc
                              ? RHSColors.green700
                              : isMissing
                                ? RHSColors.amber700
                                : RHSColors.textMuted,
                          },
                        ]}
                      >
                        {doc
                          ? `${doc.fileName} · ${doc.verificationStatus}`
                          : isMissing
                            ? 'Bắt buộc — chưa có'
                            : 'Chưa tải lên'}
                      </Text>
                    </View>
                    {busy ? (
                      <ActivityIndicator color={RHSColors.blue700} />
                    ) : (
                      <View style={styles.slotActions}>
                        {doc && (
                          <>
                            <TouchableOpacity
                              onPress={() => Linking.openURL(doc.fileUrl)}
                              style={styles.iconBtn}
                            >
                              <Feather name="eye" size={18} color={RHSColors.blue700} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => removeDoc(doc)}
                              style={styles.iconBtn}
                            >
                              <Feather name="trash-2" size={18} color={RHSColors.red600} />
                            </TouchableOpacity>
                          </>
                        )}
                        <TouchableOpacity
                          onPress={() => pickAndUpload(t.code)}
                          style={styles.uploadBtn}
                        >
                          <Feather
                            name={doc ? 'refresh-cw' : 'upload'}
                            size={14}
                            color="#fff"
                          />
                          <Text style={styles.uploadText}>{doc ? 'Đổi' : 'Tải'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <Text style={styles.hint}>
            PDF hoặc ảnh ≤ 10MB. Mỗi loại chỉ giữ 1 file mới nhất. Ảnh cũng được kế thừa khi nộp
            hồ sơ dự án.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  warnBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: RHSColors.amber50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  warnText: { flex: 1, fontSize: 13, color: RHSColors.amber700, fontWeight: '600' },
  group: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  groupTitle: { ...typography.h3, color: RHSColors.text, marginBottom: spacing.md },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: RHSColors.border,
  },
  slotTitle: { fontSize: 14, fontWeight: '700', color: RHSColors.text },
  slotStatus: { fontSize: 12, marginTop: 2 },
  slotActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
  },
  uploadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  hint: {
    fontSize: 12,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
