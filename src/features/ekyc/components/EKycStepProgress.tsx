import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius, typography, spacing } from '../../../lib/theme';

export type EKycFlowStep = 'ocr' | 'facematch';

const STEPS: { key: EKycFlowStep; label: string; hint: string }[] = [
  { key: 'ocr', label: 'CCCD', hint: 'Chụp mặt trước' },
  { key: 'facematch', label: 'Khuôn mặt', hint: 'So khớp ảnh' },
];

type Props = {
  current: EKycFlowStep;
};

/** Thanh tiến trình 2 bước — gọn, đọc được trên mobile */
export const EKycStepProgress: React.FC<Props> = ({ current }) => {
  const activeIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <View style={styles.wrap}>
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <React.Fragment key={step.key}>
            <View style={styles.item}>
              <View
                style={[
                  styles.dot,
                  (done || active) && styles.dotOn,
                  done && styles.dotDone,
                ]}
              >
                {done ? (
                  <Feather name="check" size={14} color="#fff" />
                ) : (
                  <Text style={[styles.dotNum, (done || active) && styles.dotNumOn]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.label, (done || active) && styles.labelOn]} numberOfLines={1}>
                {step.label}
              </Text>
              <Text style={styles.hint} numberOfLines={1}>{step.hint}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.line, i < activeIndex && styles.lineOn]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: RHSColors.surfaceCard,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RHSColors.grey100,
    borderWidth: 1.5,
    borderColor: RHSColors.grey300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: {
    backgroundColor: RHSColors.blue700,
    borderColor: RHSColors.blue700,
  },
  dotDone: { backgroundColor: RHSColors.green600, borderColor: RHSColors.green600 },
  dotNum: { fontSize: 12, fontWeight: '700', color: RHSColors.textMuted },
  dotNumOn: { color: '#fff' },
  label: { fontSize: 12, fontWeight: '600', color: RHSColors.textMuted },
  labelOn: { color: RHSColors.text },
  hint: { fontSize: 10, color: RHSColors.textMuted },
  line: {
    width: 36,
    height: 2,
    backgroundColor: RHSColors.grey200,
    marginTop: 13,
    marginHorizontal: 4,
  },
  lineOn: { backgroundColor: RHSColors.green600 },
});
