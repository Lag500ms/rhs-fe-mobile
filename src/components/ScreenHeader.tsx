import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBack = true,
  backIcon = 'arrow-left',
  rightAction,
  onBack,
}) => {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <LinearGradient
      colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name={backIcon} size={24} color={RHSColors.white} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      {rightAction || <View style={styles.placeholder} />}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: RHSColors.white,
  },
  placeholder: {
    width: 40,
  },
});