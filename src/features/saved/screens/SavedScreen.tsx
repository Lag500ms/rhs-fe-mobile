import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors } from '../../../lib/theme';

export const SavedScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      <LinearGradient
        colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Quan tâm</Text>
        <Text style={styles.subtitle}>Các dự án bạn đã lưu</Text>
      </LinearGradient>

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="heart" size={40} color={RHSColors.govRed} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có dự án quan tâm</Text>
            <Text style={styles.emptyDesc}>
              Nhấn vào biểu tượng trái tim ở mỗi dự án để lưu lại tại đây
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  brandBar: {
    flexDirection: 'row',
    height: 4,
  },
  brandBarStripeRed: {
    flex: 2,
    backgroundColor: RHSColors.govRed,
  },
  brandBarStripeGold: {
    flex: 0.4,
    backgroundColor: RHSColors.govGold,
  },
  brandBarStripeBlue: {
    flex: 2,
    backgroundColor: RHSColors.govBlue,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RHSColors.white,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: RHSColors.white,
    borderRadius: 20,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    width: '100%',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffe5e7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: RHSColors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});