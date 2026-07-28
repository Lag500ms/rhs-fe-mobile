import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { getStatusConfig } from '../utils/statusConfig';

/** Pipeline người dân — khớp BE, kết thúc ở Thanh toán Đợt 1 */
const PIPELINE = [
  'SUBMITTED',
  'PENDING_SXD_REVIEW',
  'APPROVED',
  'CONTRACT_PENDING',
  'DEPOSIT_PAID',
] as const;

const STEP_LABEL: Record<(typeof PIPELINE)[number], string> = {
  SUBMITTED: 'Nộp hồ sơ',
  PENDING_SXD_REVIEW: 'Chờ Sở',
  APPROVED: 'Đã duyệt',
  CONTRACT_PENDING: 'Ký HĐ',
  DEPOSIT_PAID: 'Thanh toán',
};

const TERMINAL_FAIL = new Set(['REJECTED', 'CANCELED', 'EXPIRED', 'LOTTERY_LOST']);
/** BE: đã xong pipeline tiến độ hồ sơ */
const TERMINAL_SUCCESS = new Set(['DEPOSIT_PAID', 'FULLY_PAID']);

/**
 * Map applicationStatus từ BE → chỉ số bước (0..4).
 * CONTRACT_SIGNED = đang ở bước Đợt 1 (chưa trả).
 * DEPOSIT_PAID / FULLY_PAID = đã xong bước Đợt 1.
 */
function resolveIndex(status: string): number {
  switch (status) {
    case 'DRAFT':
    case 'NEED_MORE_DOCUMENTS':
    case 'SUBMITTED':
    case 'REVIEWING':
      return 0;
    case 'PENDING_SXD_REVIEW':
      return 1;
    case 'APPROVED':
    case 'APPROVED_BY_TIMEOUT':
      return 2;
    case 'CONTRACT_PENDING':
      return 3;
    case 'CONTRACT_SIGNED':
      return 4; // đang chờ thanh toán Đợt 1
    case 'DEPOSIT_PAID':
    case 'FULLY_PAID':
      return 4;
    default:
      return 0;
  }
}

export function ApplicationTimeline({ currentStatus }: { currentStatus: string }) {
  const status = (currentStatus || '').toUpperCase();
  const currentIdx = resolveIndex(status);
  const isNeedMore = status === 'NEED_MORE_DOCUMENTS';
  const isFailed = TERMINAL_FAIL.has(status);
  const isComplete = TERMINAL_SUCCESS.has(status);

  return (
    <View style={styles.wrap}>
      {isNeedMore && (
        <View style={[styles.banner, styles.bannerWarn]}>
          <Text style={styles.bannerWarnText}>
            Hồ sơ cần bổ sung giấy tờ. Vui lòng tải lại tài liệu và nộp lại.
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
      {status === 'CONTRACT_SIGNED' && (
        <View style={[styles.banner, styles.bannerInfo]}>
          <Text style={styles.bannerInfoText}>
            Đã ký hợp đồng — bước tiếp theo: thanh toán.
          </Text>
        </View>
      )}

      <View style={styles.row}>
        {PIPELINE.map((code, idx) => {
          // DEPOSIT_PAID / FULLY_PAID → tất cả bước ✓ (kể cả Đợt 1)
          const done = !isFailed && (isComplete ? idx <= currentIdx : idx < currentIdx);
          const active = !isFailed && !isComplete && idx === currentIdx;

          return (
            <View key={code} style={styles.step}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              >
                <Text style={styles.dotText}>{done ? '✓' : idx + 1}</Text>
              </View>
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                  done && styles.labelDone,
                ]}
                numberOfLines={2}
              >
                {STEP_LABEL[code]}
              </Text>
              {idx < PIPELINE.length - 1 && (
                <View style={[styles.line, (done || active) && styles.lineActive]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  banner: { borderRadius: borderRadius.md, padding: 10 },
  bannerWarn: { backgroundColor: '#FFF3E0' },
  bannerWarnText: { color: '#E65100', fontSize: 13, fontWeight: '600' },
  bannerDanger: { backgroundColor: '#FFEBEE' },
  bannerDangerText: { color: '#C62828', fontSize: 13, fontWeight: '600' },
  bannerInfo: { backgroundColor: '#E3F2FD' },
  bannerInfoText: { color: '#1565C0', fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', position: 'relative' },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotDone: { backgroundColor: RHSColors.green600 },
  dotActive: { backgroundColor: RHSColors.blue700 },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  label: {
    marginTop: 6,
    fontSize: 10,
    textAlign: 'center',
    color: RHSColors.textMuted,
    paddingHorizontal: 2,
  },
  labelActive: { color: RHSColors.blue700, fontWeight: '700' },
  labelDone: { color: RHSColors.green700, fontWeight: '600' },
  line: {
    position: 'absolute',
    top: 12,
    left: '55%',
    width: '90%',
    height: 2,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
  },
  lineActive: { backgroundColor: RHSColors.blue600 },
});
