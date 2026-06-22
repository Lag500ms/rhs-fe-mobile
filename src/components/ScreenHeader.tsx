import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { RHSColors } from '../lib/theme';

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
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBack = true,
  backIcon = 'arrow-left',
  rightAction,
  onBack,
  isWhite = false,
}) => {
  const navigation = useNavigation<any>();

  const handleBack = () => (onBack ? onBack() : navigation.goBack());

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
      style={styles.header}
    >
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name={backIcon} size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      {rightAction || <View style={styles.spacer} />}
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
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
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