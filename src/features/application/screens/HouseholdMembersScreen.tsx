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
  HouseholdMemberRequest,
  RELATIONSHIP_OPTIONS,
  getRelationshipLabel,
} from '../types/household';
import { DEPENDENT_REASON_OPTIONS, getDependentReasonLabel } from '../../user/types/citizenProfile';
import {
  ageFromDateOnly,
  isFutureDateOnly,
  isValidCitizenId,
  normalizeCitizenId,
  parseDateOnly,
  parsePositiveNumber,
} from '../../../lib/fieldRules';

const emptyForm = () => ({
  fullName: '',
  citizenId: '',
  dateOfBirth: '',
  relationship: 'CHILD',
  occupation: '',
  monthlyIncome: '',
  isDependent: false,
  dependentReason: 'UNDER_18',
  hasMeritService: false,
  meritDetails: '',
  note: '',
});

/**
 * Sửa thành viên hộ trên hồ sơ đã tạo (nháp / bổ sung giấy).
 * Luồng đăng ký mới kế thừa hộ từ hồ sơ công dân — không tạo nháp tại đây.
 */
export const HouseholdMembersScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId, projectName, applicationStatus, next } = route.params as {
    applicationId: string;
    projectName?: string;
    applicationStatus?: string;
    next?: 'UploadDocuments';
  };

  const canEdit =
    !applicationStatus ||
    applicationStatus === 'DRAFT' ||
    applicationStatus === 'NEED_MORE_DOCUMENTS';

  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<HouseholdMember | null>(null);
  const [form, setForm] = useState(emptyForm());

  const loadMembers = useCallback(async () => {
    if (!applicationId) {
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
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers]),
  );

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (member: HouseholdMember) => {
    setEditing(member);
    setForm({
      fullName: member.fullName,
      citizenId: member.citizenId || '',
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split('T')[0] : '',
      relationship: member.relationship || 'OTHER',
      occupation: member.occupation || '',
      monthlyIncome: member.monthlyIncome != null ? String(member.monthlyIncome) : '',
      isDependent: !!member.isDependent,
      dependentReason: member.dependentReason || 'UNDER_18',
      hasMeritService: !!member.hasMeritService,
      meritDetails: member.meritDetails || '',
      note: member.note || '',
    });
    setModalVisible(true);
  };

  const onDobChange = (dob: string) => {
    const age = ageFromDateOnly(dob);
    setForm((prev) => {
      const nextForm = { ...prev, dateOfBirth: dob };
      if (age != null && age < 18) {
        nextForm.isDependent = true;
        nextForm.dependentReason = 'UNDER_18';
        nextForm.monthlyIncome = '';
      }
      return nextForm;
    });
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      appAlert('Thiếu thông tin', 'Vui lòng nhập họ tên.');
      return;
    }
    if (form.fullName.trim().length > 100) {
      appAlert('Không hợp lệ', 'Họ tên không được quá 100 ký tự.');
      return;
    }
    if (!form.relationship) {
      appAlert('Thiếu thông tin', 'Vui lòng chọn mối quan hệ.');
      return;
    }

    const cid = normalizeCitizenId(form.citizenId);
    if (cid && !isValidCitizenId(cid)) {
      appAlert('Không hợp lệ', 'Số CCCD phải gồm 9 hoặc 12 chữ số.');
      return;
    }

    if (form.dateOfBirth.trim()) {
      if (!parseDateOnly(form.dateOfBirth)) {
        appAlert('Không hợp lệ', 'Ngày sinh phải theo định dạng năm-tháng-ngày, ví dụ 2010-05-20.');
        return;
      }
      if (isFutureDateOnly(form.dateOfBirth)) {
        appAlert('Không hợp lệ', 'Ngày sinh không được ở tương lai.');
        return;
      }
    }

    const age = ageFromDateOnly(form.dateOfBirth || null);
    if (age != null && age >= 14 && !cid) {
      appAlert('Thiếu thông tin', 'Thành viên từ 14 tuổi trở lên bắt buộc có số CCCD.');
      return;
    }

    const isDependent = form.isDependent || (age != null && age < 18);
    if (isDependent && !form.dependentReason) {
      appAlert('Thiếu thông tin', 'Người phụ thuộc cần chọn lý do.');
      return;
    }
    if (form.note.length > 500) {
      appAlert('Không hợp lệ', 'Ghi chú không được quá 500 ký tự.');
      return;
    }
    if (form.occupation.length > 200) {
      appAlert('Không hợp lệ', 'Nghề nghiệp không được quá 200 ký tự.');
      return;
    }

    const income = isDependent ? null : parsePositiveNumber(form.monthlyIncome);
    if (!isDependent && form.monthlyIncome.trim() && income == null) {
      appAlert('Không hợp lệ', 'Thu nhập tháng không hợp lệ.');
      return;
    }

    const payload: HouseholdMemberRequest = {
      fullName: form.fullName.trim(),
      citizenId: cid || undefined,
      dateOfBirth: parseDateOnly(form.dateOfBirth)
        ? new Date(form.dateOfBirth).toISOString()
        : undefined,
      relationship: form.relationship,
      occupation: isDependent ? undefined : form.occupation.trim() || undefined,
      monthlyIncome: isDependent ? null : income,
      isDependent,
      dependentReason: isDependent ? form.dependentReason : undefined,
      hasMeritService: form.hasMeritService,
      meritDetails: form.hasMeritService ? form.meritDetails.trim() || undefined : undefined,
      note: form.note.trim() || undefined,
    };

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

  const handleContinue = () => {
    if (next === 'UploadDocuments' && applicationId) {
      navigation.replace('UploadDocuments', { applicationId, projectName });
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <BrandBar />
      <ScreenHeader title="Thành viên hộ gia đình" isWhite />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>
            Thành viên được kế thừa từ hồ sơ công dân khi tạo hồ sơ. Chỉ chỉnh khi hồ sơ còn là nháp
            hoặc đang bổ sung giấy tờ. Con dưới 18 tuổi, học sinh/sinh viên, người mất sức lao động
            được tính nhân khẩu nhưng không tính thu nhập.
            {projectName ? ` Dự án: ${projectName}` : ''}
          </Text>

          <Text style={styles.countHint}>
            Số người trong hộ = 1 (bạn) + {members.length} thành viên đã thêm
          </Text>

          {members.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="users" size={36} color={RHSColors.grey400} />
              <Text style={styles.emptyText}>Chưa có thành viên nào</Text>
            </View>
          ) : (
            members.map((m) => (
              <View key={m.memberId} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{m.fullName}</Text>
                  <Text style={styles.meta}>
                    {getRelationshipLabel(m.relationship)}
                    {ageFromDateOnly(m.dateOfBirth?.split('T')[0] || m.dateOfBirth)
                      != null
                      ? ` · ${ageFromDateOnly(m.dateOfBirth?.split('T')[0] || m.dateOfBirth)} tuổi`
                      : ''}
                  </Text>
                  {!!m.citizenId && <Text style={styles.meta}>CCCD: {m.citizenId}</Text>}
                  {m.isDependent ? (
                    <Text style={styles.meta}>
                      Người phụ thuộc
                      {m.dependentReason
                        ? ` · ${getDependentReasonLabel(m.dependentReason)}`
                        : ''}
                    </Text>
                  ) : null}
                  {m.hasMeritService ? (
                    <Text style={styles.meta}>
                      Người có công / thân nhân liệt sĩ
                      {m.meritDetails ? ` · ${m.meritDetails}` : ''}
                    </Text>
                  ) : null}
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
            {next === 'UploadDocuments' ? 'Tiếp tục nộp giấy tờ' : 'Xong'}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? 'Sửa thành viên' : 'Thêm thành viên'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Họ tên *</Text>
              <TextInput
                style={styles.input}
                value={form.fullName}
                onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
                placeholder="Nguyễn Văn A"
                maxLength={100}
              />

              <Text style={styles.label}>Ngày sinh (năm-tháng-ngày)</Text>
              <TextInput
                style={styles.input}
                value={form.dateOfBirth}
                onChangeText={onDobChange}
                placeholder="2010-05-20"
                maxLength={10}
              />

              <Text style={styles.label}>Số CCCD (bắt buộc nếu từ 14 tuổi)</Text>
              <TextInput
                style={styles.input}
                value={form.citizenId}
                onChangeText={(v) => setForm((f) => ({ ...f, citizenId: v.replace(/[^\d]/g, '') }))}
                placeholder="9 hoặc 12 chữ số"
                keyboardType="number-pad"
                maxLength={12}
              />

              <Text style={styles.label}>Quan hệ *</Text>
              <View style={styles.relWrap}>
                {RELATIONSHIP_OPTIONS.map((opt) => {
                  const active = form.relationship === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.relChip, active && styles.relChipActive]}
                      onPress={() => setForm((f) => ({ ...f, relationship: opt.value }))}
                    >
                      <Text style={[styles.relChipText, active && styles.relChipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() =>
                  setForm((f) => ({
                    ...f,
                    isDependent: !f.isDependent,
                    monthlyIncome: !f.isDependent ? '' : f.monthlyIncome,
                  }))
                }
              >
                <Feather
                  name={form.isDependent ? 'check-square' : 'square'}
                  size={20}
                  color={RHSColors.blue700}
                />
                <Text style={styles.checkLabel}>Người phụ thuộc (không tính thu nhập)</Text>
              </TouchableOpacity>

              {form.isDependent ? (
                <>
                  <Text style={styles.label}>Lý do phụ thuộc *</Text>
                  <View style={styles.relWrap}>
                    {DEPENDENT_REASON_OPTIONS.map((opt) => {
                      const active = form.dependentReason === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.relChip, active && styles.relChipActive]}
                          onPress={() => setForm((f) => ({ ...f, dependentReason: opt.value }))}
                        >
                          <Text style={[styles.relChipText, active && styles.relChipTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Thu nhập tháng (VNĐ)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.monthlyIncome}
                    onChangeText={(v) => setForm((f) => ({ ...f, monthlyIncome: v }))}
                    keyboardType="numeric"
                    placeholder="Tùy chọn"
                  />
                  <Text style={styles.label}>Nghề nghiệp</Text>
                  <TextInput
                    style={styles.input}
                    value={form.occupation}
                    onChangeText={(v) => setForm((f) => ({ ...f, occupation: v }))}
                    maxLength={200}
                    placeholder="Tùy chọn"
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() =>
                  setForm((f) => ({
                    ...f,
                    hasMeritService: !f.hasMeritService,
                    meritDetails: !f.hasMeritService ? f.meritDetails : '',
                  }))
                }
              >
                <Feather
                  name={form.hasMeritService ? 'check-square' : 'square'}
                  size={20}
                  color={RHSColors.blue700}
                />
                <Text style={styles.checkLabel}>
                  Người có công với cách mạng / thân nhân liệt sĩ
                </Text>
              </TouchableOpacity>

              {form.hasMeritService ? (
                <>
                  <Text style={styles.label}>Chi tiết người có công</Text>
                  <TextInput
                    style={styles.input}
                    value={form.meritDetails}
                    onChangeText={(v) => setForm((f) => ({ ...f, meritDetails: v }))}
                    placeholder="Ví dụ: thân nhân liệt sĩ"
                    maxLength={500}
                  />
                </>
              ) : null}

              <Text style={styles.label}>Ghi chú</Text>
              <TextInput
                style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
                value={form.note}
                onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
                placeholder="Tùy chọn"
                multiline
                maxLength={500}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
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
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  checkLabel: { fontSize: 14, color: RHSColors.text, flex: 1 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginBottom: 12 },
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
