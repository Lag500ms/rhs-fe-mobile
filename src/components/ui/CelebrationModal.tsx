import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, borderRadius, spacing, typography } from '../../lib/theme';
import { GradientButton } from './GradientButton';

const { width: SCREEN_W } = Dimensions.get('window');

export type CelebrationTone = 'celebrate' | 'success' | 'info' | 'neutral';

type TonePalette = {
  icon: keyof typeof Feather.glyphMap;
  ring: readonly [string, string];
  glow: string;
  accent: string;
  confetti: boolean;
};

const TONES: Record<CelebrationTone, TonePalette> = {
  celebrate: {
    icon: 'award',
    ring: [RHSColors.amber600, '#FFD54F'],
    glow: RHSColors.amber600,
    accent: RHSColors.amber700,
    confetti: true,
  },
  success: {
    icon: 'check',
    ring: [RHSColors.green700, '#43A047'],
    glow: RHSColors.green600,
    accent: RHSColors.green700,
    confetti: true,
  },
  info: {
    icon: 'info',
    ring: [RHSColors.blue800, RHSColors.blue600],
    glow: RHSColors.blue700,
    accent: RHSColors.blue700,
    confetti: false,
  },
  neutral: {
    icon: 'heart',
    ring: [RHSColors.grey600, RHSColors.grey500],
    glow: RHSColors.grey600,
    accent: RHSColors.textSecondary,
    confetti: false,
  },
};

const CONFETTI_COLORS = [
  RHSColors.blue600,
  RHSColors.amber600,
  RHSColors.red400,
  RHSColors.green600,
  RHSColors.blue200,
];

type ConfettiPiece = {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  color: string;
  size: number;
};

const Confetti: React.FC<{ pieces: ConfettiPiece[] }> = ({ pieces }) => {
  const progress = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = pieces.map((piece, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(piece.delay),
          Animated.timing(progress[i], {
            toValue: 1,
            duration: piece.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(progress[i], {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [pieces, progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confetti,
            {
              left: piece.left,
              width: piece.size,
              height: piece.size * 1.6,
              backgroundColor: piece.color,
              opacity: progress[i].interpolate({
                inputRange: [0, 0.1, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateY: progress[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 320],
                  }),
                },
                {
                  translateX: progress[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, piece.drift],
                  }),
                },
                {
                  rotate: progress[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '540deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

type CelebrationModalProps = {
  visible: boolean;
  tone?: CelebrationTone;
  title: string;
  message?: string;
  /** Con số/mã hiển thị cỡ lớn ở giữa, ví dụ số tiền hoặc mã suất */
  highlightValue?: string;
  highlightLabel?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose: () => void;
};

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  tone = 'success',
  title,
  message,
  highlightValue,
  highlightLabel,
  primaryLabel = 'Tuyệt vời',
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
}) => {
  const palette = TONES[tone];

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.9)).current;
  const highlightOpacity = useRef(new Animated.Value(0)).current;

  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    if (!palette.confetti) return [];
    const cardWidth = Math.min(SCREEN_W - spacing.xxl * 2, 380);
    return Array.from({ length: 14 }).map((_, i) => ({
      left: (cardWidth / 14) * i + Math.random() * 12,
      delay: Math.random() * 900,
      duration: 2200 + Math.random() * 1400,
      drift: (Math.random() - 0.5) * 70,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 4,
    }));
  }, [palette.confetti]);

  useEffect(() => {
    if (!visible) {
      overlayOpacity.setValue(0);
      cardScale.setValue(0.85);
      cardTranslateY.setValue(40);
      iconScale.setValue(0);
      highlightOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(140),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(380),
        Animated.timing(highlightOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const halo = Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale, {
          toValue: 1.12,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 0.9,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    halo.start();
    return () => halo.stop();
  }, [
    visible,
    overlayOpacity,
    cardScale,
    cardTranslateY,
    iconScale,
    haloScale,
    highlightOpacity,
  ]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: cardScale }, { translateY: cardTranslateY }] },
          ]}
        >
          {palette.confetti && <Confetti pieces={confettiPieces} />}

          <TouchableOpacity style={styles.close} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={20} color={RHSColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.iconArea}>
            <Animated.View
              style={[
                styles.halo,
                { backgroundColor: `${palette.glow}22`, transform: [{ scale: haloScale }] },
              ]}
            />
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <LinearGradient
                colors={palette.ring}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.iconCircle, { shadowColor: palette.glow }]}
              >
                <Feather name={palette.icon} size={52} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          {!!highlightValue && (
            <Animated.View style={[styles.highlight, { opacity: highlightOpacity }]}>
              <Text style={[styles.highlightValue, { color: palette.accent }]} numberOfLines={1}>
                {highlightValue}
              </Text>
              {!!highlightLabel && (
                <Text style={styles.highlightLabel}>{highlightLabel.toUpperCase()}</Text>
              )}
            </Animated.View>
          )}

          <GradientButton
            label={primaryLabel}
            onPress={onPrimary ?? onClose}
            variant={tone === 'neutral' ? 'primary' : tone === 'celebrate' ? 'success' : 'primary'}
            size="md"
            pill
            fullWidth
            style={styles.primary}
          />

          {!!secondaryLabel && (
            <TouchableOpacity onPress={onSecondary ?? onClose} style={styles.secondary}>
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 16,
  },
  close: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  halo: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
  },
  iconCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    ...typography.h2,
    color: RHSColors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySmall,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  highlight: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: RHSColors.surface,
  },
  highlightValue: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  highlightLabel: {
    ...typography.caption,
    color: RHSColors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: spacing.xs,
  },
  primary: {
    marginTop: spacing.xl,
  },
  secondary: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    ...typography.bodySmall,
    color: RHSColors.textSecondary,
    fontWeight: '600',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
