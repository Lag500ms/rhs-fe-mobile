import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { getStatusConfig } from '../utils/statusConfig';

/**
 * Tiến độ sau khi nộp — kể chuyện ngắn, không trùng wizard 5 bước tạo hồ sơ.
 * Cọc tiền → Ký HĐ; các đợt sau nằm ở lịch thanh toán.
 */
const PIPELINE = [
  {
    key: 'SUBMITTED',
    label: 'Đã nộp',
    hint: 'Hồ sơ đã gửi lên hệ thống',
  },
  {
    key: 'REVIEWING',
    label: 'Chủ đầu tư tiếp nhận hồ sơ',
    hint: 'CĐT đang tiếp nhận và thẩm định',
  },
  {
    key: 'PENDING_SXD_REVIEW',
    label: 'Sở Xây dựng tiếp nhận hồ sơ',
    hint: 'Sở duyệt hoặc từ chối',
  },
  {
    key: 'APPROVED',
    label: 'Chờ chốt suất',
    hint: 'Cấp thẳng hoặc sau bốc thăm',
  },
  {
    key: 'DEPOSIT_PENDING',
    label: 'Cọc tiền',
    hint: 'Đóng cọc để giữ suất nhà',
  },
  {
    key: 'CONTRACT_PENDING',
    label: 'Ký hợp đồng',
    hint: 'Ký hợp đồng mua bán',
  },
] as const;

const TERMINAL_FAIL = new Set(['REJECTED', 'CANCELED', 'EXPIRED', 'LOTTERY_LOST']);
const WAITLIST_STATUSES = new Set(['WAITLIST']);
const TERMINAL_SUCCESS = new Set([
  'CONTRACT_SIGNED',
  'INSTALLMENT_IN_PROGRESS',
  'DEPOSIT_PAID',
  'FULLY_PAID',
]);

function resolveIndex(status: string, depositPaid?: boolean): number {
  switch (status) {
    case 'DRAFT':
    case 'SUBMITTED':
      return 0;
    case 'REVIEWING':
    case 'NEED_MORE_DOCUMENTS':
      return 1;
    case 'PENDING_SXD_REVIEW':
      return 2;
    case 'APPROVED':
    case 'APPROVED_BY_TIMEOUT':
    case 'LOTTERY_WON':
    case 'LOTTERY_LOST':
    case 'WAITLIST':
      return 3;
    case 'DEPOSIT_PENDING':
      return 4;
    case 'CONTRACT_PENDING':
      // Sau cấp nhà BE để CONTRACT_PENDING trước khi cọc.
      if (depositPaid !== true) return 4;
      return 5;
    case 'CONTRACT_SIGNED':
    case 'INSTALLMENT_IN_PROGRESS':
    case 'DEPOSIT_PAID':
    case 'FULLY_PAID':
      return 5;
    default:
      return 0;
  }
}

type Props = {
  currentStatus: string;
  /** Ghi chú CĐT khi yêu cầu bổ sung */
  needMoreNote?: string | null;
  /** false = CONTRACT_PENDING nhưng chưa cọc Đợt 1 → đứng ở bước cọc */
  depositPaid?: boolean;
};

export function ApplicationTimeline({ currentStatus, needMoreNote, depositPaid }: Props) {
  const status = (currentStatus || '').toUpperCase();
  const currentIdx = resolveIndex(status, depositPaid);
  const isNeedMore = status === 'NEED_MORE_DOCUMENTS';
  const isFailed = TERMINAL_FAIL.has(status);
  const isWaitlist = WAITLIST_STATUSES.has(status);
  const isComplete = TERMINAL_SUCCESS.has(status);
  const isCancellation = status === 'CANCELLATION_REQUESTED';

  return (
    <View style={styles.wrap}>
      {isNeedMore && (
        <View style={[styles.banner, styles.bannerWarn]}>
          <Text style={styles.bannerWarnTitle}>Chủ đầu tư cần bạn bổ sung giấy tờ</Text>
          <Text style={styles.bannerWarnText}>
            {needMoreNote?.trim()
              ? needMoreNote.trim()
              : 'Vui lòng cập nhật giấy tờ theo yêu cầu, rồi nộp lại hồ sơ.'}
          </Text>
        </View>
      )}
      {isFailed && (
        <View style={[styles.banner, styles.bannerDanger]}>
          <Text style={styles.bannerDangerText}>
            Hồ sơ kết thúc: {getStatusConfig(status).label}
          </Text>
        </View>
      )}
      {isWaitlist && (
        <View style={[styles.banner, styles.bannerWarn]}>
          <Text style={styles.bannerWarnTitle}>Đã xếp danh sách chờ (dự bị)</Text>
          <Text style={styles.bannerWarnText}>
            Hồ sơ không bị hủy. Khi có căn trả lại, hệ thống chuyển quyền mua theo thứ hạng.
          </Text>
        </View>
      )}
      {isCancellation && (
        <View style={[styles.banner, styles.bannerWarn]}>
          <Text style={styles.bannerWarnTitle}>Đơn xin ngừng thanh toán đang chờ duyệt</Text>
          <Text style={styles.bannerWarnText}>
            Chủ đầu tư sẽ xác nhận. Tiền cọc đợt đầu bị trừ nếu đơn được chấp thuận.
          </Text>
        </View>
      )}
      {isComplete && (
        <View style={[styles.banner, styles.bannerInfo]}>
          <Text style={styles.bannerInfoText}>
            {status === 'FULLY_PAID'
              ? 'Bạn đã hoàn tất các khoản trên lịch thanh toán.'
              : 'Đã ký hợp đồng. Các khoản còn lại xem trong lịch thanh toán — chủ đầu tư sẽ mở dần theo tiến độ.'}
          </Text>
        </View>
      )}

      <View style={styles.list}>
        {PIPELINE.map((step, idx) => {
          const done =
            !isFailed && (isComplete ? idx <= currentIdx : idx < currentIdx);
          const active = !isFailed && !isComplete && idx === currentIdx;
          const needMoreHere = active && isNeedMore;
          const isLast = idx === PIPELINE.length - 1;

          return (
            <View key={step.key} style={styles.row}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.dot,
                    done && styles.dotDone,
                    active && styles.dotActive,
                    needMoreHere && styles.dotWarn,
                  ]}
                >
                  <Text style={styles.dotText}>{done ? '✓' : idx + 1}</Text>
                </View>
                {!isLast && (
                  <View style={[styles.line, (done || active) && styles.lineActive]} />
                )}
              </View>
              <View style={styles.body}>
                <Text
                  style={[
                    styles.label,
                    active && styles.labelActive,
                    done && styles.labelDone,
                    needMoreHere && styles.labelWarn,
                  ]}
                >
                  {needMoreHere ? 'Cần bổ sung giấy tờ' : step.label}
                </Text>
                <Text style={styles.hint}>
                  {needMoreHere
                    ? 'Bổ sung xong rồi nộp lại để chủ đầu tư xét tiếp'
                    : status === 'LOTTERY_WON' && idx === 3 && active
                      ? 'Đã trúng suất — chờ chủ đầu tư chọn căn'
                      : active
                        ? step.hint
                        : done
                          ? 'Đã xong'
                          : step.hint}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  banner: { borderRadius: borderRadius.md, padding: 12 },
  bannerWarn: { backgroundColor: '#FFF8F0', borderWidth: 1, borderColor: '#FFCC80' },
  bannerWarnTitle: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerWarnText: { color: '#BF360C', fontSize: 13, lineHeight: 19 },
  bannerDanger: { backgroundColor: '#FFEBEE' },
  bannerDangerText: { color: '#C62828', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  bannerInfo: { backgroundColor: '#F0F7FF' },
  bannerInfoText: { color: '#1565C0', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  list: { gap: 0 },
  row: { flexDirection: 'row', minHeight: 52 },
  rail: { width: 28, alignItems: 'center' },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotDone: { backgroundColor: RHSColors.green600 },
  dotActive: { backgroundColor: RHSColors.blue700 },
  dotWarn: { backgroundColor: '#EF6C00' },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#E8E8E8',
    marginVertical: 2,
    minHeight: 18,
  },
  lineActive: { backgroundColor: RHSColors.blue400 },
  body: { flex: 1, paddingLeft: 10, paddingBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: RHSColors.textMuted },
  labelActive: { color: RHSColors.blue700, fontWeight: '700' },
  labelDone: { color: RHSColors.green700 },
  labelWarn: { color: '#E65100', fontWeight: '700' },
  hint: { marginTop: 2, fontSize: 12, color: RHSColors.textMuted, lineHeight: 17 },
});
