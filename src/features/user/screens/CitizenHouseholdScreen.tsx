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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, spacing, typography, shadows } from '../../../lib/theme';
import { appAlert } from '../../../lib/appDialog';
import { citizenProfileApi } from '../api/citizenProfileApi';
import {
  DEPENDENT_REASON_OPTIONS,
  RELATIONSHIP_OPTIONS,
  calcAge,
  formatVnd,
  getDependentReasonLabel,
  getRelationshipLabel,
  type CitizenFullProfileDto,
  type UserHouseholdMemberDto,
  type UserHouseholdMemberRequestDto,
} from '../types/citizenProfile';
import { isValidCitizenId, normalizeCitizenId } from '../../../lib/fieldRules';

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

export const CitizenHouseholdScreen = () => {
  const [profile, setProfile] = useState<CitizenFullProfileDto | null>(null);
  const [members, setMembers] = useState<UserHouseholdMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<UserHouseholdMemberDto | null>(null);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await citizenProfileApi.getFullProfile();
      setProfile(p);
      setMembers(p.householdMembers || []);
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không tải được hộ gia đình.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalVisible(true);
  };

  const openEdit = (m: UserHouseholdMemberDto) => {
    setEditing(m);
    setForm({
      fullName: m.fullName,
      citizenId: m.citizenId || '',
      dateOfBirth: m.dateOfBirth ? m.dateOfBirth.split('T')[0] : '',
      relationship: m.relationship || 'CHILD',
      occupation: m.occupation || '',
      monthlyIncome: m.monthlyIncome != null ? String(m.monthlyIncome) : '',
      isDependent: m.isDependent,
      dependentReason: m.dependentReason || 'UNDER_18',
      hasMeritService: !!m.hasMeritService,
      meritDetails: m.meritDetails || '',
      note: m.note || '',
    });
    setModalVisible(true);
  };

  const onDobChange = (dob: string) => {
    const age = calcAge(dob);
    setForm((prev) => {
      const next = { ...prev, dateOfBirth: dob };
      if (age != null && age < 18) {
        next.isDependent = true;
        next.dependentReason = 'UNDER_18';
        next.monthlyIncome = '';
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      appAlert('Thiếu thông tin', 'Vui lòng nhập họ tên thành viên.');
      return;
    }
    if (form.fullName.trim().length > 100) {
      appAlert('Không hợp lệ', 'Họ tên không được quá 100 ký tự.');
      return;
    }
    if (!form.relationship) {
      appAlert('Thiếu thông tin', 'Vui lòng chọn quan hệ.');
      return;
    }

    const cid = normalizeCitizenId(form.citizenId);
    if (cid) {
      if (!isValidCitizenId(cid)) {
        appAlert('Không hợp lệ', 'Số CCCD phải gồm 9 hoặc 12 chữ số.');
        return;
      }
      if (profile?.citizenId && cid === normalizeCitizenId(profile.citizenId)) {
        appAlert('Không hợp lệ', 'CCCD thành viên không được trùng CCCD chủ hộ.');
        return;
      }
    }

    const age = calcAge(form.dateOfBirth || null);
    if (form.dateOfBirth) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) {
        appAlert('Không hợp lệ', 'Ngày sinh phải theo định dạng năm-tháng-ngày, ví dụ 2010-05-20.');
        return;
      }
    }
    if (age != null && age >= 14 && !cid) {
      appAlert('Thiếu thông tin', 'Thành viên từ 14 tuổi trở lên bắt buộc có số CCCD.');
      return;
    }

    const isDependent =
      form.isDependent || (age != null && age < 18);

    if (isDependent && !form.dependentReason) {
      appAlert('Thiếu thông tin', 'Người phụ thuộc cần chọn lý do.');
      return;
    }

    const dto: UserHouseholdMemberRequestDto = {
      fullName: form.fullName.trim(),
      citizenId: cid || undefined,
      dateOfBirth: form.dateOfBirth
        ? new Date(form.dateOfBirth).toISOString()
        : undefined,
      relationship: form.relationship,
      occupation: form.occupation.trim() || undefined,
      monthlyIncome:
        isDependent || !form.monthlyIncome
          ? null
          : Number(form.monthlyIncome.replace(/[^\d.]/g, '')),
      isDependent,
      dependentReason: isDependent ? form.dependentReason : undefined,
      hasMeritService: form.hasMeritService,
      meritDetails: form.hasMeritService ? form.meritDetails.trim() || undefined : undefined,
      note: form.note.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await citizenProfileApi.updateHouseholdMember(editing.memberId, dto);
      } else {
        await citizenProfileApi.addHouseholdMember(dto);
      }
      setModalVisible(false);
      await load();
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không lưu được thành viên.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (m: UserHouseholdMemberDto) => {
    appAlert('Xóa thành viên', `Xóa ${m.fullName} khỏi hộ gia đình?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await citizenProfileApi.deleteHouseholdMember(m.memberId);
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
      <ScreenHeader title="Hộ gia đình" isWhite />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.summary}>
              <SummaryItem
                label="Nhân khẩu"
                value={`${profile?.householdMembersCount ?? 1}`}
              />
              <SummaryItem
                label="Phụ thuộc"
                value={`${profile?.dependentMembersCount ?? 0}`}
              />
              <SummaryItem
                label="Thu nhập tính"
                value={formatVnd(profile?.countableHouseholdIncome)}
              />
            </View>

            <View style={styles.headCard}>
              <Text style={styles.headTitle}>Chủ hộ (bạn)</Text>
              <Text style={styles.headName}>{profile?.fullName}</Text>
              <Text style={styles.headMeta}>CCCD: {profile?.citizenId || '—'}</Text>
            </View>

            {members.length === 0 ? (
              <Text style={styles.empty}>Chưa có thành viên. Thêm cha mẹ, vợ/chồng, con cái…</Text>
            ) : (
              members.map((m) => (
                <View key={m.memberId} style={styles.memberCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.fullName}</Text>
                    <Text style={styles.memberMeta}>
                      {getRelationshipLabel(m.relationship)}
                      {calcAge(m.dateOfBirth) != null ? ` · ${calcAge(m.dateOfBirth)} tuổi` : ''}
                    </Text>
                    <View style={styles.chipsRow}>
                      {m.isDependent ? (
                        <Chip
                          text={getDependentReasonLabel(m.dependentReason) || 'Phụ thuộc'}
                          tone="amber"
                        />
                      ) : (
                        <Chip
                          text={formatVnd(m.monthlyIncome)}
                          tone="green"
                        />
                      )}
                      {m.hasMeritService ? (
                        <Chip text="Người có công / thân nhân liệt sĩ" tone="amber" />
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => openEdit(m)} style={styles.iconBtn}>
                    <Feather name="edit-2" size={16} color={RHSColors.blue700} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(m)} style={styles.iconBtn}>
                    <Feather name="trash-2" size={16} color={RHSColors.red600} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
            <Feather name="plus" size={22} color="#fff" />
            <Text style={styles.fabText}>Thêm thành viên</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalSheet}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? 'Sửa thành viên' : 'Thêm thành viên'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={RHSColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Label>Quan hệ *</Label>
              <View style={styles.chips}>
                {RELATIONSHIP_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.value}
                    style={[
                      styles.chip,
                      form.relationship === o.value && styles.chipActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, relationship: o.value }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.relationship === o.value && styles.chipTextActive,
                      ]}
                    >
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Label>Họ tên *</Label>
              <Input
                value={form.fullName}
                onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
                maxLength={100}
              />

              <Label>Ngày sinh (năm-tháng-ngày)</Label>
              <Input value={form.dateOfBirth} onChangeText={onDobChange} placeholder="2010-05-20" maxLength={10} />

              <Label>CCCD (bắt buộc nếu từ 14 tuổi)</Label>
              <Input
                value={form.citizenId}
                onChangeText={(v) => setForm((f) => ({ ...f, citizenId: v.replace(/[^\d]/g, '') }))}
                keyboardType="number-pad"
                maxLength={12}
                placeholder="9 hoặc 12 chữ số"
              />

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
                  <Label>Lý do phụ thuộc *</Label>
                  <View style={styles.chips}>
                    {DEPENDENT_REASON_OPTIONS.map((o) => (
                      <TouchableOpacity
                        key={o.value}
                        style={[
                          styles.chip,
                          form.dependentReason === o.value && styles.chipActive,
                        ]}
                        onPress={() =>
                          setForm((f) => ({ ...f, dependentReason: o.value }))
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            form.dependentReason === o.value && styles.chipTextActive,
                          ]}
                        >
                          {o.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Label>Thu nhập tháng (VNĐ)</Label>
                  <Input
                    value={form.monthlyIncome}
                    onChangeText={(v) => setForm((f) => ({ ...f, monthlyIncome: v }))}
                    keyboardType="numeric"
                  />
                  <Label>Nghề nghiệp</Label>
                  <Input
                    value={form.occupation}
                    onChangeText={(v) => setForm((f) => ({ ...f, occupation: v }))}
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
                  Người có công với cách mạng / thân nhân liệt sĩ (cộng điểm ưu tiên thành viên)
                </Text>
              </TouchableOpacity>

              {form.hasMeritService ? (
                <>
                  <Label>Chi tiết người có công</Label>
                  <Input
                    value={form.meritDetails}
                    onChangeText={(v) => setForm((f) => ({ ...f, meritDetails: v }))}
                    placeholder="Ví dụ: thân nhân liệt sĩ, thương binh..."
                    maxLength={500}
                  />
                </>
              ) : null}

              <Label>Ghi chú</Label>
              <Input
                value={form.note}
                onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryValue} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const Chip = ({ text, tone }: { text: string; tone: 'amber' | 'green' }) => (
  <View
    style={[
      styles.tag,
      {
        backgroundColor: tone === 'amber' ? RHSColors.amber50 : RHSColors.green50,
      },
    ]}
  >
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: tone === 'amber' ? RHSColors.amber700 : RHSColors.green700,
      }}
    >
      {text}
    </Text>
  </View>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.label}>{children}</Text>
);

const Input = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput
    {...props}
    style={styles.input}
    placeholderTextColor={RHSColors.grey400}
  />
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: 100 },
  summary: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  summaryItem: {
    flex: 1,
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  summaryValue: { fontSize: 13, fontWeight: '800', color: RHSColors.text },
  summaryLabel: { fontSize: 11, color: RHSColors.textMuted, marginTop: 2 },
  headCard: {
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headTitle: { fontSize: 12, fontWeight: '700', color: RHSColors.blue700 },
  headName: { fontSize: 16, fontWeight: '800', color: RHSColors.text, marginTop: 4 },
  headMeta: { fontSize: 12, color: RHSColors.textSecondary, marginTop: 2 },
  empty: { textAlign: 'center', color: RHSColors.textMuted, marginTop: 24 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  memberName: { fontSize: 15, fontWeight: '700', color: RHSColors.text },
  memberMeta: { fontSize: 12, color: RHSColors.textSecondary, marginTop: 2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  iconBtn: { padding: 8 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    ...shadows.md,
  },
  fabText: { color: '#fff', fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: RHSColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h3, color: RHSColors.text },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: RHSColors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: RHSColors.text,
    backgroundColor: RHSColors.grey50,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    backgroundColor: RHSColors.grey50,
  },
  chipActive: { backgroundColor: RHSColors.blue50, borderColor: RHSColors.blue700 },
  chipText: { fontSize: 12, color: RHSColors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: RHSColors.blue700 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  checkLabel: { fontSize: 14, color: RHSColors.text, flex: 1 },
  saveBtn: {
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: 24,
  },
  saveText: { color: '#fff', fontWeight: '800' },
});
