import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  bindAppDialog,
  dismissAppDialog,
  type AppDialogButton,
  type AppDialogRequest,
} from '../../lib/appDialog';
import { RHSColors, borderRadius, spacing, typography } from '../../lib/theme';

type Tone = 'danger' | 'success' | 'warning' | 'info';

function inferTone(req: AppDialogRequest): Tone {
  if (req.buttons.some((b) => b.style === 'destructive')) return 'danger';
  const t = req.title.toLowerCase();
  if (t.includes('thành công') || t.startsWith('đã ')) return 'success';
  if (t.includes('lỗi') || t.includes('thất bại')) return 'warning';
  return 'info';
}

const TONE: Record<Tone, { icon: keyof typeof Feather.glyphMap; bg: string; fg: string }> = {
  danger: { icon: 'alert-triangle', bg: RHSColors.red50, fg: RHSColors.red600 },
  success: { icon: 'check-circle', bg: RHSColors.green50, fg: RHSColors.green600 },
  warning: { icon: 'alert-circle', bg: '#FFF8E1', fg: RHSColors.amber700 },
  info: { icon: 'info', bg: RHSColors.blue50, fg: RHSColors.blue700 },
};

function orderButtons(buttons: AppDialogButton[]) {
  const cancel = buttons.filter((b) => b.style === 'cancel');
  const rest = buttons.filter((b) => b.style !== 'cancel');
  if (buttons.length > 2) return [...rest, ...cancel];
  return [...cancel, ...rest];
}

export function AppDialogHost() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<AppDialogRequest | null>(null);

  useEffect(() => {
    bindAppDialog(setCurrent);
    return () => bindAppDialog(null);
  }, []);

  const closeAndRun = (btn?: AppDialogButton) => {
    if (!btn && current && current.buttons.length !== 1) return;
    dismissAppDialog();
    (btn ?? current?.buttons[0])?.onPress?.();
  };

  const dismissSoft = () => {
    const cancel = current?.buttons.find((b) => b.style === 'cancel');
    if (cancel) closeAndRun(cancel);
    else if (current?.buttons.length === 1) closeAndRun(current.buttons[0]);
  };

  const tone = current ? inferTone(current) : 'info';
  const palette = TONE[tone];
  const buttons = current ? orderButtons(current.buttons) : [];
  const stacked = buttons.length > 2;

  return (
    <Modal
      visible={!!current}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={dismissSoft}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissSoft} />
        {current ? (
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
            <View style={styles.handle} />
            <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
              <Feather name={palette.icon} size={26} color={palette.fg} />
            </View>
            <Text style={[styles.title, !current.message && { marginBottom: spacing.xl }]}>
              {current.title}
            </Text>
            {current.message ? (
              <Text style={styles.message}>{current.message}</Text>
            ) : null}

            <View style={[styles.actions, stacked && styles.actionsCol]}>
              {buttons.map((btn, i) => {
                const isCancel = btn.style === 'cancel';
                const isDanger = btn.style === 'destructive';
                const isPrimary = !isCancel && !stacked;
                if (isPrimary && isDanger) {
                  return (
                    <TouchableOpacity
                      key={`${btn.text}-${i}`}
                      style={[styles.btn, stacked && styles.btnFull]}
                      onPress={() => closeAndRun(btn)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={[RHSColors.red700, RHSColors.red600]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.btnFill}
                      >
                        <Text style={styles.btnFillText}>{btn.text}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }
                if (isPrimary) {
                  return (
                    <TouchableOpacity
                      key={`${btn.text}-${i}`}
                      style={[styles.btn, stacked && styles.btnFull]}
                      onPress={() => closeAndRun(btn)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={[RHSColors.blue800, RHSColors.blue600]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.btnFill}
                      >
                        <Text style={styles.btnFillText}>{btn.text}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={`${btn.text}-${i}`}
                    style={[styles.btn, styles.btnGhost, stacked && styles.btnFull]}
                    onPress={() => closeAndRun(btn)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.btnGhostText, !isCancel && stacked && styles.btnOptionText]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: RHSColors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: RHSColors.grey300,
    marginBottom: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    fontWeight: '700',
    color: RHSColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    ...typography.bodySmall,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionsCol: {
    flexDirection: 'column',
  },
  btn: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    minHeight: 48,
  },
  btnFull: {
    flex: 0,
    alignSelf: 'stretch',
  },
  btnFill: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  btnFillText: {
    ...typography.button,
    color: '#fff',
  },
  btnGhost: {
    borderWidth: 1.5,
    borderColor: RHSColors.border,
    backgroundColor: RHSColors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnGhostText: {
    ...typography.button,
    color: RHSColors.textSecondary,
    fontWeight: '600',
  },
  btnOptionText: {
    color: RHSColors.blue700,
  },
});
