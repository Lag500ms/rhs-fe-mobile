import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { RHSColors, borderRadius, spacing, typography } from '../lib/theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  backIcon?: 'arrow-left' | 'x';
  rightAction?: React.ReactNode;
  onBack?: () => void;
  /** 
   * false = Gradient blue header for brand/auth screens
   * true = White header for functional screens (detail, form, profile...)
   */
  isWhite?: boolean;
  /**
   * Biến thể cong, cao hơn, có vòng tròn trang trí — dùng cho màn hình
   * mở đầu một luồng (kết quả bốc thăm, ví, hợp đồng...).
   */
  hero?: boolean;
  /** Dòng phụ dưới tiêu đề, chỉ hiển thị ở biến thể hero. */
  subtitle?: string;
  /** Nội dung chèn dưới tiêu đề trong nền gradient, ví dụ dãy StatTile. */
  children?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBack = true,
  backIcon = 'arrow-left',
  rightAction,
  onBack,
  isWhite = false,
  hero = false,
  subtitle,
  children,
}) => {
  const navigation = useNavigation<any>();

  const handleBack = () => (onBack ? onBack() : navigation.goBack());

  const backButton = showBack ? (
    <TouchableOpacity
      onPress={handleBack}
      style={[styles.backButton, hero && styles.backButtonHero]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather name={backIcon} size={22} color={isWhite ? RHSColors.blue700 : '#fff'} />
    </TouchableOpacity>
  ) : (
    <View style={styles.spacer} />
  );

  if (isWhite) {
    return (
      <View style={styles.whiteHeader}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name={backIcon} size={22} color={RHSColors.blue700} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        <Text style={styles.whiteHeaderTitle} numberOfLines={1}>{title}</Text>
        {rightAction || <View style={styles.spacer} />}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0A3A85', '#1565C0', '#1E88E5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={hero ? styles.heroHeader : styles.header}
    >
      {hero && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.circle, styles.circleTop]} />
          <View style={[styles.circle, styles.circleLeft]} />
          <View style={[styles.circle, styles.circleBottom]} />
        </View>
      )}

      <View style={styles.titleRow}>
        {backButton}
        <Text
          style={[styles.headerTitle, hero && styles.heroTitle]}
          numberOfLines={hero ? 2 : 1}
        >
          {title}
        </Text>
        {rightAction || <View style={styles.spacer} />}
      </View>

      {hero && !!subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
      {hero && !!children && <View style={styles.heroChildren}>{children}</View>}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.1,
    borderRadius: 999,
  },
  circleTop: { width: 130, height: 130, top: -48, right: -28 },
  circleLeft: { width: 80, height: 80, top: 46, left: -32 },
  circleBottom: { width: 110, height: 110, bottom: -58, right: 72 },
  whiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  backButtonHero: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  heroTitle: {
    ...typography.h2,
    color: '#fff',
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
    marginLeft: 48,
  },
  heroChildren: {
    marginTop: spacing.lg,
  },
  whiteHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1565C0',
  },
  spacer: {
    width: 36,
  },
});
