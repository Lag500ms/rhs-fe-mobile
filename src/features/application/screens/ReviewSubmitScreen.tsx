import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { appAlert } from '../../../lib/appDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { housingDocumentApi } from '../api/housingDocumentApi';
import { lookupApi } from '../api/lookupApi';
import {
  ApplicationAuditResult,
  ApplicationDetail,
  ApplicationDocument,
  DocumentFormCheck,
  RequiredDocumentItem,
} from '../types/application';
import { getHousingStatusLabel, getMaritalStatusLabel } from '../utils/statusConfig';
import { formatPriorityGroup } from '../../../lib/priorityGroup';
import { ApplicationStepper } from '../components/ApplicationStepper';
import { formatVnd } from '../../user/types/citizenProfile';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function resolveDocLabel(
  documentType: string,
  requiredItems: RequiredDocumentItem[],
): string {
  const fromApi = requiredItems.find((r) => r.documentType === documentType);
  if (fromApi?.label) return fromApi.label;

  switch (documentType) {
    case 'HOUSING_CONDITION_PROOF':
      return 'Giấy xác nhận điều kiện nhà ở';
    case 'POVERTY_HOUSEHOLD_CERTIFICATE':
      return 'Giấy chứng nhận hộ nghèo/cận nghèo';
    case 'MERIT_PERSON_CERTIFICATE':
      return 'Giấy xác nhận người có công với cách mạng';
    case 'LOW_INCOME_CERTIFICATE':
      return 'Giấy xác nhận thu nhập thấp tại đô thị';
    case 'EMPLOYMENT_CERTIFICATE':
      return 'Giấy xác nhận đang làm việc tại DN/HTX/KCN';
    case 'MILITARY_SERVICE_CERTIFICATE':
      return 'Giấy xác nhận phục vụ lực lượng vũ trang/cơ yếu';
    case 'CIVIL_SERVANT_CERTIFICATE':
      return 'Giấy xác nhận cán bộ/công chức/viên chức';
    case 'PUBLIC_HOUSING_RETURN_CERTIFICATE':
      return 'Văn bản trả lại nhà ở công vụ';
    case 'LAND_RECOVERY_DECISION':
      return 'Quyết định thu hồi đất/giải tỏa nhà ở';
    case 'INCOME_CERTIFICATE':
      return 'Giấy xác nhận thu nhập';
    default:
      return documentType;
  }
}

export const ReviewSubmitScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId, applicationStatus } = route.params;
  const isSupplementMode = applicationStatus === 'NEED_MORE_DOCUMENTS';

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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [requiredItems, setRequiredItems] = useState<RequiredDocumentItem[]>([]);
  const [priorityGroupLabel, setPriorityGroupLabel] = useState<string | null>(null);
  const [missingPriorityGroup, setMissingPriorityGroup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConflictSheet, setShowConflictSheet] = useState(false);
  const [commitment, setCommitment] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<ApplicationAuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await housingApplicationApi.getApplicationDetail(applicationId);

        if (!result.priorityGroup?.trim()) {
          setDetail(result);
          setMissingPriorityGroup(true);
          setRequiredItems([]);
          setPriorityGroupLabel(null);
          return;
        }

        setMissingPriorityGroup(false);
        const [requiredDocs, groups] = await Promise.all([
          housingApplicationApi.getRequiredDocumentsByPriorityGroup(result.priorityGroup),
          lookupApi.getPriorityGroups().catch(() => []),
        ]);
        const group = groups.find((g) => g.code === result.priorityGroup);
        setPriorityGroupLabel(
          formatPriorityGroup(group?.label) || formatPriorityGroup(result.priorityGroup),
        );
        setDetail(result);
        setRequiredItems(requiredDocs);
      } catch (e: any) {
        if (e?.message === 'MISSING_PRIORITY_GROUP') {
          setMissingPriorityGroup(true);
          setRequiredItems([]);
          return;
        }
        const msg = e?.response?.data?.message || 'Không thể tải thông tin hồ sơ.';
        appAlert('Lỗi', msg);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId, navigation]);

  const docs = detail?.documents ?? [];
  const uploadedTypes = new Set(docs.map((d) => d.documentType));
  const missingRequired = requiredItems.filter((r) => !uploadedTypes.has(r.documentType));
  const hasRequiredDocs =
    !missingPriorityGroup && requiredItems.length > 0 && missingRequired.length === 0;
  const ineligible = !!detail?.eligibility && detail.eligibility.eligible === false;
  const isDisabled = !hasRequiredDocs || submitting || !commitment || ineligible;

  const runAiCheck = async () => {
    if (auditing) return;
    setAuditing(true);
    setAuditError(null);
    setAuditResult(null);
    try {
      const result = await housingDocumentApi.auditDocuments(applicationId);
      setAuditResult(result);
    } catch (e: any) {
      setAuditError(e?.message || 'Không thể kiểm tra giấy tờ. Vui lòng thử lại.');
    } finally {
      setAuditing(false);
    }
  };

  const handleSubmit = async () => {
    if (!commitment) {
      appAlert('Cam kết bắt buộc', 'Vui lòng tích cam kết thông tin chính xác trước khi nộp.');
      return;
    }
    setSubmitting(true);
    try {
      await housingApplicationApi.submitApplication(applicationId);
      setShowSuccess(true);
    } catch (e: any) {
      setSubmitting(false);
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Không thể nộp hồ sơ.';

      if (status === 409) {
        // Conflict - duplicate CCCD
        setShowConflictSheet(true);
      } else if (status === 422) {
        appAlert('Không thể nộp hồ sơ', msg);
      } else {
        appAlert('Lỗi', msg);
      }
    }
  };

  const handleBackToDashboard = () => {
    setShowSuccess(false);
    // Reset stack to MyApplications screen (triggers useFocusEffect refresh)
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MyApplications' }],
      })
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Thin brand bar at top */}
      <BrandBar />

      {/* White header */}
      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSupplementMode ? 'Nộp lại hồ sơ' : 'Bước 3/3 — Rà soát'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stepper - chỉ hiện khi tạo mới */}
      {!isSupplementMode && <ApplicationStepper current={3} />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Header */}
        <View style={styles.summaryCard}>
          <Feather name="info" size={18} color={RHSColors.blue700} />
          <Text style={styles.summaryTitle}>
            Xác nhận lại thông tin lấy từ hồ sơ công dân trước khi nộp
          </Text>
        </View>

        {/* Personal Info Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          <InfoRow icon="user" label="Họ và tên" value={detail.fullName} />
          <InfoRow icon="credit-card" label="Số CCCD" value={detail.citizenId} />
          {detail.occupation ? <InfoRow icon="briefcase" label="Nghề nghiệp" value={detail.occupation} /> : null}
          {detail.workPlace ? <InfoRow icon="map-pin" label="Nơi làm việc" value={detail.workPlace} /> : null}
          {detail.monthlyIncome != null ? (
            <InfoRow icon="dollar-sign" label="Thu nhập tháng" value={formatVnd(detail.monthlyIncome)} />
          ) : null}
          {detail.maritalStatus?.toUpperCase() === 'MARRIED' && detail.spouseMonthlyIncome != null ? (
            <InfoRow
              icon="dollar-sign"
              label="Thu nhập vợ/chồng"
              value={formatVnd(detail.spouseMonthlyIncome)}
            />
          ) : null}
        </View>

        {/* Address Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Địa chỉ</Text>
          <InfoRow icon="home" label="Nơi ở hiện tại" value={detail.currentResidence} />
          <InfoRow icon="bookmark" label="Thường trú" value={detail.permanentAddress} />
        </View>

        {/* Housing */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Thực trạng nhà ở & Hộ gia đình</Text>
          <InfoRow
            icon="layers"
            label="Thực trạng nhà ở"
            value={getHousingStatusLabel(detail.housingStatus)}
          />
          <InfoRow
            icon="heart"
            label="Tình trạng hôn nhân"
            value={getMaritalStatusLabel(detail.maritalStatus)}
          />
          {detail.housingStatus?.toUpperCase() === 'SMALL_HOUSE' &&
          detail.averageHousingAreaPerPerson != null ? (
            <InfoRow
              icon="maximize"
              label="Diện tích bình quân"
              value={`${detail.averageHousingAreaPerPerson} m²/người`}
            />
          ) : null}
          <InfoRow
            icon="users"
            label="Số thành viên"
            value={String(detail.householdMembersCount || '—')}
          />
          <InfoRow
            icon="star"
            label="Nhóm ưu tiên"
            value={
              priorityGroupLabel || formatPriorityGroup(detail.priorityGroup) || '—'
            }
          />
        </View>

        {detail.eligibility ? (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: detail.eligibility.eligible
                  ? RHSColors.green50
                  : RHSColors.amber50,
              },
            ]}
          >
            <Text style={styles.cardTitle}>
              {detail.eligibility.eligible
                ? 'Đủ điều kiện (ước lượng)'
                : 'Chưa đủ điều kiện — không nộp được'}
            </Text>
            {!!detail.eligibility.summaryMessage && (
              <Text style={styles.eligSummary}>{detail.eligibility.summaryMessage}</Text>
            )}
            {(detail.eligibility.reasons || []).map((r) => (
              <Text key={r} style={styles.eligReason}>
                • {r}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Documents */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Giấy tờ đính kèm</Text>
          {missingPriorityGroup ? (
            <View style={styles.noDocs}>
              <Feather name="alert-triangle" size={16} color={RHSColors.amber600} />
              <Text style={styles.noDocsText}>
                Thiếu nhóm đối tượng — chưa xác định được giấy tờ bắt buộc (2 hoặc 3 tệp).
              </Text>
            </View>
          ) : detail.documents.length === 0 ? (
            <View style={styles.noDocs}>
              <Feather name="alert-triangle" size={16} color={RHSColors.amber600} />
              <Text style={styles.noDocsText}>Chưa có giấy tờ nào được tải lên</Text>
            </View>
          ) : (
            detail.documents.map((doc: ApplicationDocument) => (
              <View key={doc.documentId} style={styles.docItem}>
                <View style={styles.docIconSmall}>
                  <Feather name="file" size={16} color={RHSColors.blue700} />
                  <Text style={styles.docIconSmallLabel}>PDF</Text>
                </View>
                <View style={styles.docInfoSmall}>
                  <Text style={styles.docNameSmall} numberOfLines={1}>
                    {doc.fileName}
                  </Text>
                  <Text style={styles.docTypeSmall}>
                    {resolveDocLabel(doc.documentType, requiredItems)}
                  </Text>
                </View>
                {!!doc.fileUrl && (
                  <TouchableOpacity
                    style={styles.docEye}
                    onPress={() =>
                      navigation.navigate('DocumentViewer', {
                        fileUrl: doc.fileUrl,
                        title: doc.fileName || 'Xem giấy tờ',
                      })
                    }
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="eye" size={18} color={RHSColors.blue700} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Tự kiểm tra giấy tờ bằng AI trước khi nộp (chỉ hỗ trợ, không chặn nộp) */}
        {!missingPriorityGroup && detail.documents.length > 0 && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconWrap}>
                <Feather name="shield" size={18} color={RHSColors.blue700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiTitle}>Tự kiểm tra giấy tờ bằng AI</Text>
                <Text style={styles.aiSubtitle}>
                  Đối chiếu họ tên, CCCD và loại giấy tờ trước khi nộp
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.aiBtn, auditing && styles.aiBtnDisabled]}
              onPress={runAiCheck}
              disabled={auditing}
              activeOpacity={0.85}
            >
              {auditing ? (
                <>
                  <ActivityIndicator size="small" color={RHSColors.blue700} />
                  <Text style={styles.aiBtnText}>Đang đọc giấy tờ…</Text>
                </>
              ) : (
                <>
                  <Feather
                    name={auditResult ? 'refresh-cw' : 'check-circle'}
                    size={16}
                    color={RHSColors.blue700}
                  />
                  <Text style={styles.aiBtnText}>
                    {auditResult ? 'Kiểm tra lại' : 'Kiểm tra AI trước khi nộp'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {auditing && (
              <Text style={styles.aiHint}>
                AI đang đọc từng giấy tờ, có thể mất vài chục giây.
              </Text>
            )}

            {auditError && !auditing && (
              <View style={styles.aiErrorBox}>
                <Feather name="alert-circle" size={14} color={RHSColors.red600} />
                <Text style={styles.aiErrorText}>{auditError}</Text>
              </View>
            )}

            {auditResult && !auditing && (
              <View style={styles.aiResult}>
                <View
                  style={[
                    styles.aiSummary,
                    auditResult.isComplete ? styles.aiSummaryOk : styles.aiSummaryWarn,
                  ]}
                >
                  <Feather
                    name={auditResult.isComplete ? 'check-circle' : 'alert-triangle'}
                    size={16}
                    color={auditResult.isComplete ? RHSColors.green600 : RHSColors.amber700}
                  />
                  <Text
                    style={[
                      styles.aiSummaryText,
                      { color: auditResult.isComplete ? RHSColors.green700 : RHSColors.amber700 },
                    ]}
                  >
                    {auditResult.isComplete
                      ? `Tất cả ${auditResult.totalCount} giấy tờ đều đạt. Bạn có thể nộp.`
                      : `Đạt ${auditResult.passedCount}/${auditResult.totalCount} giấy tờ. Nên kiểm lại các mục bên dưới.`}
                  </Text>
                </View>

                {auditResult.missingDocumentNames?.length > 0 && (
                  <Text style={styles.aiMissing}>
                    Còn thiếu: {auditResult.missingDocumentNames.join(', ')}
                  </Text>
                )}

                {auditResult.checkedDocuments.map((c, idx) => (
                  <AiDocRow key={`${c.documentId}-${idx}`} check={c} />
                ))}

                {!auditResult.isComplete && (
                  <Text style={styles.aiFootnote}>
                    AI chỉ hỗ trợ rà soát, không thay quyết định. Bạn vẫn có thể nộp; cán bộ sẽ
                    thẩm định lại.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.commitmentRow}
          onPress={() => setCommitment((v) => !v)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, commitment && styles.checkboxChecked]}>
            {commitment && <Feather name="check" size={14} color="#fff" />}
          </View>
          <Text style={styles.commitmentText}>
            Tôi cam kết thông tin và tài liệu đã cung cấp là chính xác. Sau khi nộp, hồ sơ sẽ được đóng băng để thẩm định.
          </Text>
        </TouchableOpacity>

        {/* Submit Button - BLUE */}
        <TouchableOpacity
          style={[styles.submitBtn, isDisabled && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isDisabled}
          activeOpacity={0.9}
        >
          <View style={[styles.submitGrad, isDisabled && { backgroundColor: RHSColors.grey400 }]}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Nộp hồ sơ</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
        {isDisabled && !hasRequiredDocs && (
          <Text style={styles.disabledHint}>
            {missingPriorityGroup
              ? 'Hồ sơ thiếu nhóm đối tượng thụ hưởng. Hãy khai đối tượng trên hồ sơ công dân rồi xác nhận lại.'
              : `Còn thiếu ${missingRequired.length} giấy tờ bắt buộc theo nhóm đối tượng. Quay lại bước giấy tờ để bổ sung.`}
          </Text>
        )}
        {hasRequiredDocs && ineligible && (
          <Text style={styles.disabledHint}>
            Hồ sơ chưa đủ điều kiện theo quy định. Bổ sung hồ sơ công dân rồi tạo lại nháp, hoặc chỉnh hộ/thu nhập/nhà ở.
          </Text>
        )}
        {hasRequiredDocs && !ineligible && !commitment && (
          <Text style={styles.disabledHint}>Vui lòng tích cam kết thông tin chính xác để nộp hồ sơ.</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successContainer}>
            <View style={styles.successIconWrap}>
              <Feather name="check-circle" size={64} color={RHSColors.green600} />
            </View>
            <Text style={styles.successTitle}>Nộp hồ sơ thành công!</Text>
            <Text style={styles.successDesc}>
              Hồ sơ của bạn đã được gửi đến cơ quan thẩm định. Chúng tôi sẽ thông báo kết quả
              trong thời gian sớm nhất.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={handleBackToDashboard}
              activeOpacity={0.8}
            >
              <View style={styles.successBtnGrad}>
                <Feather name="list" size={18} color="#fff" />
                <Text style={styles.successBtnText}>Về quản lý hồ sơ</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Conflict Bottom Sheet (409) */}
      <Modal visible={showConflictSheet} transparent animationType="slide">
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowConflictSheet(false)}
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetIconWrap}>
              <Feather name="alert-octagon" size={40} color={RHSColors.red600} />
            </View>
            <Text style={styles.sheetTitle}>Trùng CCCD</Text>
            <Text style={styles.sheetDesc}>
              CCCD này đã tồn tại trong dự án. Vui lòng kiểm tra mục "Hồ sơ của tôi" để xem
              trạng thái hồ sơ hiện tại.
            </Text>
            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => {
                setShowConflictSheet(false);
                handleBackToDashboard();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.sheetBtnGrad}>
                <Text style={styles.sheetBtnText}>Đến Hồ sơ của tôi</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={() => setShowConflictSheet(false)}
            >
              <Text style={styles.sheetCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Feather name={icon as any} size={16} color={RHSColors.textMuted} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const AiBadge = ({
  ok,
  okText,
  failText,
  detail,
}: {
  ok: boolean;
  okText: string;
  failText: string;
  detail?: string | null;
}) => (
  <View style={styles.aiBadgeBlock}>
    <View style={styles.aiBadgeRow}>
      <Feather
        name={ok ? 'check-circle' : 'x-circle'}
        size={13}
        color={ok ? RHSColors.green600 : RHSColors.red600}
      />
      <Text style={[styles.aiBadgeText, { color: ok ? RHSColors.green600 : RHSColors.red600 }]}>
        {ok ? okText : failText}
      </Text>
    </View>
    {!ok && !!detail && <Text style={styles.aiBadgeDetail}>{detail}</Text>}
  </View>
);

const AiDocRow = ({ check }: { check: DocumentFormCheck }) => {
  const isMissing = check.formMatchStatus === 'MISSING';
  const isError = check.formMatchStatus === 'ERROR';
  return (
    <View style={styles.aiDoc}>
      <Text style={styles.aiDocName} numberOfLines={2}>
        {check.documentTypeName}
      </Text>
      {isMissing ? (
        <View style={styles.aiBadgeRow}>
          <Feather name="minus-circle" size={13} color={RHSColors.grey500} />
          <Text style={styles.aiBadgeNeutral}>Chưa nộp</Text>
        </View>
      ) : isError ? (
        <View style={styles.aiBadgeRow}>
          <Feather name="help-circle" size={13} color={RHSColors.amber700} />
          <Text style={styles.aiBadgeWarn}>Chưa đọc được giấy tờ, hãy thử lại</Text>
        </View>
      ) : (
        <>
          <AiBadge
            ok={check.isNameMatch}
            okText="Đúng tên người nộp"
            failText="Sai tên hoặc CCCD"
            detail={check.nameCheckDetails}
          />
          <AiBadge
            ok={check.isDocumentTypeMatch}
            okText="Đúng loại giấy tờ"
            failText="Sai loại giấy tờ"
            detail={check.documentTypeCheckDetails}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface },

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

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 40 },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.blue50,
    padding: 14,
    borderRadius: borderRadius.md,
    marginBottom: 24,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: RHSColors.blue700,
  },
  summaryTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: RHSColors.blue700, lineHeight: 20 },

  // Cards - reduced borders, using spacing instead
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 12,
  },
  eligSummary: {
    fontSize: 13,
    color: RHSColors.text,
    lineHeight: 18,
    marginBottom: 6,
  },
  eligReason: {
    fontSize: 12,
    color: RHSColors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: RHSColors.textMuted,
    width: 110,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: RHSColors.text,
    flex: 1,
    fontWeight: '600',
  },

  // Documents
  noDocs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  noDocsText: {
    fontSize: 13,
    color: RHSColors.amber700,
    fontWeight: '500',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.xs,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  docIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docEye: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconSmallLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: RHSColors.blue700,
    marginTop: -2,
  },
  docInfoSmall: { flex: 1, gap: 2 },
  docNameSmall: { fontSize: 12, fontWeight: '600', color: RHSColors.text },
  docTypeSmall: { fontSize: 11, color: RHSColors.textMuted },
  docStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  docStatusVerified: {
    fontSize: 11,
    color: RHSColors.green600,
    fontWeight: '600',
  },
  docStatusRejected: {
    fontSize: 11,
    color: RHSColors.red600,
    fontWeight: '600',
    flex: 1,
  },
  docStatusPending: {
    fontSize: 11,
    color: RHSColors.amber700,
    fontWeight: '600',
  },
  docStatusNone: {
    fontSize: 11,
    color: RHSColors.grey500,
    fontWeight: '500',
  },

  // AI self-check
  aiCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: RHSColors.blue100,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: RHSColors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: 14, fontWeight: '700', color: RHSColors.text },
  aiSubtitle: { fontSize: 12, color: RHSColors.textMuted, marginTop: 2, lineHeight: 16 },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: RHSColors.blue700,
    backgroundColor: RHSColors.blue50,
  },
  aiBtnDisabled: { opacity: 0.7 },
  aiBtnText: { fontSize: 14, fontWeight: '700', color: RHSColors.blue700 },
  aiHint: { fontSize: 11, color: RHSColors.textMuted, textAlign: 'center', marginTop: 8 },
  aiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: RHSColors.red50,
    borderRadius: borderRadius.sm,
    padding: 10,
    marginTop: 10,
  },
  aiErrorText: { flex: 1, fontSize: 12, color: RHSColors.red600, fontWeight: '500' },
  aiResult: { marginTop: 12, gap: 10 },
  aiSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: borderRadius.sm,
  },
  aiSummaryOk: { backgroundColor: RHSColors.green50 },
  aiSummaryWarn: { backgroundColor: RHSColors.amber50 },
  aiSummaryText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  aiMissing: { fontSize: 12, color: RHSColors.amber700, fontWeight: '500', lineHeight: 17 },
  aiDoc: {
    borderTopWidth: 1,
    borderTopColor: RHSColors.grey100,
    paddingTop: 10,
    gap: 6,
  },
  aiDocName: { fontSize: 13, fontWeight: '700', color: RHSColors.text },
  aiBadgeBlock: { gap: 2 },
  aiBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBadgeText: { fontSize: 12, fontWeight: '600', flex: 1 },
  aiBadgeDetail: {
    fontSize: 11,
    color: RHSColors.textSecondary,
    lineHeight: 16,
    marginLeft: 19,
  },
  aiBadgeNeutral: { fontSize: 12, fontWeight: '600', color: RHSColors.grey600 },
  aiBadgeWarn: { fontSize: 12, fontWeight: '600', color: RHSColors.amber700, flex: 1 },
  aiFootnote: {
    fontSize: 11,
    color: RHSColors.textMuted,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Submit - BLUE
  submitBtn: {
    marginTop: 8,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    backgroundColor: RHSColors.blue700,
  },
  submitText: { ...typography.button, color: '#fff' },
  disabledHint: {
    fontSize: 12,
    color: RHSColors.red600,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  commitmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: 12,
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: RHSColors.blue700,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: RHSColors.blue700,
  },
  commitmentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: RHSColors.text,
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: RHSColors.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    ...typography.h2,
    color: RHSColors.green700,
    marginBottom: 12,
    textAlign: 'center',
  },
  successDesc: {
    ...typography.bodySmall,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successBtn: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  successBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: RHSColors.blue700,
  },
  successBtnText: { ...typography.button, color: '#fff' },

  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: RHSColors.grey300,
    marginBottom: 20,
  },
  sheetIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: RHSColors.red50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: 8,
  },
  sheetDesc: {
    fontSize: 14,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sheetBtn: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  sheetBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: RHSColors.blue700,
  },
  sheetBtnText: { ...typography.button, color: '#fff' },
  sheetClose: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  sheetCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.textSecondary,
  },
});