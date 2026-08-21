import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { appAlert } from '../../../lib/appDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, shadows, spacing, typography } from '../../../lib/theme';
import { householdMemberApi } from '../api/householdMemberApi';
import {
  HouseholdMember,
  RELATIONSHIP_OPTIONS,
  getRelationshipLabel,
} from '../types/household';
import { ApplicationStepper } from '../components/ApplicationStepper';
import type {
  ApplicationDraftMember,
  ApplicationDraftPersonal,
} from '../types/applicationDraft';

export const HouseholdMembersScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    applicationId,
    projectName,
    applicationStatus,
    next,
    draftPersonal,
  } = route.params as {
    applicationId?: string;
    projectName?: string;
    applicationStatus?: string;
    next?: 'UploadDocuments' | 'PriorityGroup';
    draftPersonal?: ApplicationDraftPersonal;
  };

  const isDraftCreateFlow = !!draftPersonal && next === 'PriorityGroup';
  const isCreateFlow = isDraftCreateFlow || next === 'UploadDocuments';

  const canEdit =
    isDraftCreateFlow ||
    !applicationStatus ||
    applicationStatus === 'DRAFT' ||
    applicationStatus === 'NEED_MORE_DOCUMENTS';

  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [draftMembers, setDraftMembers] = useState<ApplicationDraftMember[]>([]);
  const [loading, setLoading] = useState(!isDraftCreateFlow);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<HouseholdMember | null>(null);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [relationship, setRelationship] = useState('SPOUSE');
  const [note, setNote] = useState('');

  const displayCount = isDraftCreateFlow ? draftMembers.length : members.length;

  const loadMembers = useCallback(async () => {
    if (!applicationId || isDraftCreateFlow) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await householdMemberApi.getMembers(applicationId);
      setMembers(data);
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || e?.message || 'Không tải được danh sách thành viên.');
    } finally {
      setLoading(false);
    }
  }, [applicationId, isDraftCreateFlow]);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers]),
  );

  const resetForm = () => {
    setEditing(null);
    setEditingLocalId(null);
    setFullName('');
    setCitizenId('');
    setRelationship('SPOUSE');
    setNote('');
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (member: HouseholdMember) => {
    setEditing(member);
    setEditingLocalId(null);
    setFullName(member.fullName);
    setCitizenId(member.citizenId || '');
    setRelationship(member.relationship || 'OTHER');
    setNote(member.note || '');
    setModalVisible(true);
  };

  const openEditDraft = (member: ApplicationDraftMember) => {
    setEditing(null);
    setEditingLocalId(member.localId);
    setFullName(member.fullName);
    setCitizenId(member.citizenId || '');
    setRelationship(member.relationship || 'OTHER');
    setNote(member.note || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      appAlert('Thiếu thông tin', 'Vui lòng nhập họ tên.');
      return;
    }
    if (!relationship) {
      appAlert('Thiếu thông tin', 'Vui lòng chọn mối quan hệ.');
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      citizenId: citizenId.replace(/\s/g, '') || undefined,
      relationship,
      note: note.trim() || undefined,
    };

    if (isDraftCreateFlow) {
      if (editingLocalId) {
        setDraftMembers((prev) =>
          prev.map((m) => (m.localId === editingLocalId ? { ...m, ...payload } : m)),
        );
      } else {
        setDraftMembers((prev) => [
          ...prev,
          { localId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...payload },
        ]);
      }
      setModalVisible(false);
      resetForm();
      return;
    }

    if (!applicationId) return;

    setSaving(true);
    try {
      if (editing) {
        await householdMemberApi.updateMember(applicationId, editing.memberId, payload);
      } else {
        await householdMemberApi.addMember(applicationId, payload);
      }
      setModalVisible(false);
      resetForm();
      await loadMembers();
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || e?.message || 'Không lưu được thành viên.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (member: HouseholdMember) => {
    if (!applicationId) return;
    appAlert('Xóa thành viên', `Xóa "${member.fullName}" khỏi hộ gia đình?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await householdMemberApi.removeMember(applicationId, member.memberId);
            await loadMembers();
          } catch (e: any) {
            appAlert('Lỗi', e?.response?.data?.message || e?.message || 'Không xóa được.');
          }
        },
      },
    ]);
  };

  const handleDeleteDraft = (member: ApplicationDraftMember) => {
    appAlert('Xóa thành viên', `Xóa "${member.fullName}" khỏi hộ gia đình?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => setDraftMembers((prev) => prev.filter((m) => m.localId !== member.localId)),
      },
    ]);
  };

  const handleContinue = () => {
    if (next === 'PriorityGroup' && draftPersonal) {
      navigation.navigate('PriorityGroup', {
        draftPersonal,
        draftMembers,
      });
      return;
    }
    if (next === 'UploadDocuments' && applicationId) {
      navigation.replace('UploadDocuments', { applicationId, projectName });
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {isCreateFlow ? (
        <>
          <BrandBar />
          <View style={styles.whiteHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bước 2/5 — Hộ gia đình</Text>
            <View style={{ width: 36 }} />
          </View>
          <ApplicationStepper current={2} />
        </>
      ) : (
        <ScreenHeader title="Thành viên hộ gia đình" isWhite />
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>
            Thêm các thành viên cùng hộ khẩu (họ tên, CCCD, quan hệ) để phục vụ hậu kiểm chéo.
            Độc thân / sống một mình: có thể bỏ trống rồi tiếp tục.
            {(projectName || draftPersonal?.projectName)
              ? ` Dự án: ${projectName || draftPersonal?.projectName}`
              : ''}
          </Text>

          <Text style={styles.countHint}>
            Số người trong hộ = 1 (bạn) + {displayCount} thành viên đã thêm
          </Text>

          {displayCount === 0 ? (
            <View style={styles.empty}>
              <Feather name="users" size={36} color={RHSColors.grey400} />
              <Text style={styles.emptyText}>Chưa có thành viên nào</Text>
            </View>
          ) : isDraftCreateFlow ? (
            draftMembers.map((m) => (
              <View key={m.localId} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{m.fullName}</Text>
                  <Text style={styles.meta}>{getRelationshipLabel(m.relationship)}</Text>
                  {!!m.citizenId && <Text style={styles.meta}>CCCD: {m.citizenId}</Text>}
                </View>
                {canEdit && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openEditDraft(m)} style={styles.iconBtn}>
                      <Feather name="edit-2" size={16} color={RHSColors.blue700} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteDraft(m)} style={styles.iconBtn}>
                      <Feather name="trash-2" size={16} color={RHSColors.red600} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          ) : (
            members.map((m) => (
              <View key={m.memberId} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{m.fullName}</Text>
                  <Text style={styles.meta}>{getRelationshipLabel(m.relationship)}</Text>
                  {!!m.citizenId && <Text style={styles.meta}>CCCD: {m.citizenId}</Text>}
                </View>
                {canEdit && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openEdit(m)} style={styles.iconBtn}>
                      <Feather name="edit-2" size={16} color={RHSColors.blue700} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(m)} style={styles.iconBtn}>
                      <Feather name="trash-2" size={16} color={RHSColors.red600} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}

          {canEdit && (
            <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
              <Feather name="user-plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Thêm thành viên</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.9}>
          <Text style={styles.continueBtnText}>
            {next === 'PriorityGroup'
              ? 'Tiếp tục đối tượng'
              : next === 'UploadDocuments'
                ? 'Tiếp tục nộp giấy tờ'
                : 'Xong'}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? 'Sửa thành viên' : 'Thêm thành viên'}</Text>

            <Text style={styles.label}>Họ tên *</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Nguyễn Văn A" />

            <Text style={styles.label}>Số CCCD</Text>
            <TextInput
              style={styles.input}
              value={citizenId}
              onChangeText={setCitizenId}
              placeholder="9 hoặc 12 số"
              keyboardType="number-pad"
              maxLength={12}
            />

            <Text style={styles.label}>Quan hệ *</Text>
            <View style={styles.relWrap}>
              {RELATIONSHIP_OPTIONS.map((opt) => {
                const active = relationship === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.relChip, active && styles.relChipActive]}
                    onPress={() => setRelationship(opt.value)}
                  >
                    <Text style={[styles.relChipText, active && styles.relChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="Tùy chọn"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); resetForm(); }}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.huge },
  hint: { ...typography.bodySmall, color: RHSColors.textSecondary, marginBottom: spacing.sm, lineHeight: 20 },
  countHint: {
    ...typography.caption,
    color: RHSColors.blue700,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.bodySmall, color: RHSColors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  name: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  addBtnText: { ...typography.button, color: '#fff' },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: RHSColors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    ...shadows.lg,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  continueBtnText: { ...typography.button, color: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalTitle: { ...typography.h3, color: RHSColors.text, marginBottom: spacing.lg },
  label: { ...typography.caption, fontWeight: '700', color: RHSColors.textMuted, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodySmall,
    color: RHSColors.text,
    backgroundColor: RHSColors.grey50,
  },
  relWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: RHSColors.border,
    backgroundColor: '#fff',
  },
  relChipActive: { borderColor: RHSColors.blue700, backgroundColor: RHSColors.blue50 },
  relChipText: { fontSize: 12, color: RHSColors.textSecondary, fontWeight: '600' },
  relChipTextActive: { color: RHSColors.blue700 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  cancelBtnText: { ...typography.button, color: RHSColors.textSecondary },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: RHSColors.blue700,
    minHeight: 48,
  },
  saveBtnText: { ...typography.button, color: '#fff' },
});
