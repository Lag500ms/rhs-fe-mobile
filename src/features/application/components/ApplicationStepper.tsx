import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors } from '../../../lib/theme';

/** Khớp luồng nộp hồ sơ: Hồ sơ → Đối tượng → Giấy tờ → Rà soát */
export const APPLICATION_STEPS = [
  { key: 'info', label: 'Hồ sơ' },
  { key: 'priority', label: 'Đối tượng' },
  { key: 'docs', label: 'Giấy tờ' },
  { key: 'submit', label: 'Rà soát' },
] as const;

export type ApplicationStepIndex = 1 | 2 | 3 | 4;

type Props = {
  current: ApplicationStepIndex;
};

export function ApplicationStepper({ current }: Props) {
  return (
    <View style={styles.stepper}>
      {APPLICATION_STEPS.map((step, index) => {
        const stepNum = (index + 1) as ApplicationStepIndex;
        const done = stepNum < current;
        const active = stepNum === current;
        const isLast = index === APPLICATION_STEPS.length - 1;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  done && styles.stepCircleDone,
                  active && styles.stepCircleActive,
                ]}
              >
                {done ? (
                  <Feather name="check" size={12} color="#fff" />
                ) : (
                  <Text style={active ? styles.stepCircleText : styles.stepCircleTextInactive}>
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  done && styles.stepLabelDone,
                  active && styles.stepLabelActive,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.stepLine,
                  stepNum < current && styles.stepLineDone,
                  stepNum === current && styles.stepLineActive,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey200,
  },
  stepItem: { alignItems: 'center', gap: 3, maxWidth: 58 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: RHSColors.grey300,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: RHSColors.blue700, borderColor: RHSColors.blue700 },
  stepCircleDone: { backgroundColor: RHSColors.green600, borderColor: RHSColors.green600 },
  stepCircleText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepCircleTextInactive: { fontSize: 11, fontWeight: '700', color: RHSColors.grey500 },
  stepLabel: { fontSize: 9, fontWeight: '500', color: RHSColors.grey500 },
  stepLabelActive: { color: RHSColors.blue700, fontWeight: '700' },
  stepLabelDone: { color: RHSColors.green600, fontWeight: '700' },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: RHSColors.grey300,
    marginHorizontal: 2,
    marginBottom: 14,
  },
  stepLineActive: { backgroundColor: RHSColors.blue700 },
  stepLineDone: { backgroundColor: RHSColors.green600 },
});
