import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { getStatusConfig } from '../utils/statusConfig';

/** Pipeline người dân: nộp → Sở → duyệt → ký HĐ → Đợt 1 */
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
  DEPOSIT_PAID: 'Đợt 1',
};

const TERMINAL_FAIL = new Set(['REJECTED', 'CANCELED', 'EXPIRED', 'LOTTERY_LOST']);

function resolveIndex(status: string): number {
  switch (status) {
    case 'DRAFT':
    case 'NEED_MORE_DOCUMENTS':
      return 0;
    case 'SUBMITTED':
    case 'REVIEWING':
      return 0;
    case 'PENDING_SXD_REVIEW':
      return 1;
    case 'APPROVED':
    case 'APPROVED_BY_TIMEOUT':
      return 2;
    case 'CONTRACT_PENDING':
    case 'CONTRACT_SIGNED':
      return 3;
    case 'DEPOSIT_PAID':
    case 'FULLY_PAID':
      return 4;
    default:
      return 0;
  }
}

function isStepDone(status: string, stepIdx: number, currentIdx: number): boolean {
  if (TERMINAL_FAIL.has(status)) return false;
  if (status === 'CONTRACT_SIGNED' && stepIdx === 3) return true;
  if (status === 'FULLY_PAID') return true;
  return stepIdx < currentIdx;
}

function isStepActive(status: string, stepIdx: number, currentIdx: number): boolean {
  if (TERMINAL_FAIL.has(status)) return false;
  if (status === 'CONTRACT_SIGNED' && stepIdx === 3) return false;
  if (status === 'CONTRACT_SIGNED' && stepIdx === 4) return true;
  return stepIdx === currentIdx;
}

export function ApplicationTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = resolveIndex(currentStatus);
  const isNeedMore = currentStatus === 'NEED_MORE_DOCUMENTS';
  const isFailed = TERMINAL_FAIL.has(currentStatus);

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
            Hồ sơ kết thúc: {getStatusConfig(currentStatus).label}
          </Text>
        </View>
      )}
      {currentStatus === 'CONTRACT_SIGNED' && (
        <View style={[styles.banner, styles.bannerInfo]}>
          <Text style={styles.bannerInfoText}>
            Đã ký hợp đồng mua bán NOXH — bước tiếp theo: thanh toán Đợt 1 VNPay.
          </Text>
        </View>
      )}

      <View style={styles.row}>
        {PIPELINE.map((code, idx) => {
          const done = isStepDone(currentStatus, idx, currentIdx);
          const active = isStepActive(currentStatus, idx, currentIdx);
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
