import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RHSColors, borderRadius } from '../../../lib/theme';
import { getStatusConfig } from '../utils/statusConfig';

const PIPELINE = [
  'DRAFT',
  'SUBMITTED',
  'REVIEWING',
  'PENDING_SXD_REVIEW',
  'APPROVED',
] as const;

const TERMINAL_FAIL = new Set(['REJECTED', 'CANCELED', 'EXPIRED', 'LOTTERY_LOST']);
const APPROVED_ALIASES = new Set([
  'APPROVED',
  'APPROVED_BY_TIMEOUT',
  'DEPOSIT_PAID',
  'CONTRACT_PENDING',
  'CONTRACT_SIGNED',
  'FULLY_PAID',
]);

function resolveIndex(status: string): number {
  if (status === 'NEED_MORE_DOCUMENTS') return 1;
  if (APPROVED_ALIASES.has(status)) return PIPELINE.indexOf('APPROVED');
  const idx = PIPELINE.indexOf(status as (typeof PIPELINE)[number]);
  return idx >= 0 ? idx : 0;
}

export function ApplicationTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = resolveIndex(currentStatus);
  const isNeedMore = currentStatus === 'NEED_MORE_DOCUMENTS';
  const isFailed = TERMINAL_FAIL.has(currentStatus);
  const isApproved = APPROVED_ALIASES.has(currentStatus);

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

      <View style={styles.row}>
        {PIPELINE.map((code, idx) => {
          const done = !isFailed && (isApproved ? true : idx < currentIdx);
          const active = !isFailed && !isApproved && idx === currentIdx;
          const cfg = getStatusConfig(code);
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
                {cfg.label}
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
