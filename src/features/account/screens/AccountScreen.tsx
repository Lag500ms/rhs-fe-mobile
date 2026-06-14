import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { getToken, clearTokens } from '../../../lib/tokenStorage';
import { userApi, UserProfileDto } from '../../user/api/userApi';

export const AccountScreen = () => {
  const navigation = useNavigation<any>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      checkAuthStatus();
    }, [])
  );

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const accessToken = await getToken();
      if (accessToken) {
        setIsLoggedIn(true);
        await loadProfile();
      } else {
        setIsLoggedIn(false);
        setProfile(null);
      }
    } catch (error) {
      setIsLoggedIn(false);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const result = await userApi.getProfile();
      if (result.success && result.user) {
        setProfile(result.user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Auth', { screen: 'Login' });
  };

  const handleProfilePress = () => {
    navigation.navigate('UserProfile');
  };

  const handleLogout = async () => {
    await clearTokens();
    setIsLoggedIn(false);
    setProfile(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.govBlue} />
        </View>
      </SafeAreaView>
    );
  }

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
        style={styles.brandHeader}
      >
        <RHSLogo size={32} />
        <Text style={styles.brandHeaderText}>RHS</Text>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Login/Profile Section */}
        {!isLoggedIn ? (
          <View style={styles.loginCard}>
            <View style={styles.loginIconWrap}>
              <Feather name="user" size={48} color={RHSColors.govBlue} />
            </View>
            <Text style={styles.loginTitle}>Chào bạn!</Text>
            <Text style={styles.loginDesc}>
              Đăng nhập để xem thông tin và đăng ký nhà ở xã hội phù hợp với bạn.
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
            >
              <Text style={styles.registerText}>Chưa có tài khoản? Đăng ký</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.profileCard} onPress={handleProfilePress}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>
                {profile?.fullName?.charAt(0)?.toUpperCase() || 'R'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.fullName || 'Người dùng'}</Text>
              <Text style={styles.profileRole}>{profile?.role || 'Applicant'}</Text>
            </View>
            <Feather name="chevron-right" size={22} color={RHSColors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Menu Sections */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSectionTitle}>Hướng dẫn</Text>
          <MenuItem icon="help-circle" text="Câu hỏi thường gặp" />
          <MenuItem
            icon="message-circle"
            text="Góp ý báo lỗi"
            onPress={() => navigation.navigate('IssueReport')}
          />
          <MenuItem icon="users" text="Về chúng tôi" last />
        </View>

        <View style={styles.menuCard}>
          <Text style={styles.menuSectionTitle}>Quy định</Text>
          <MenuItem icon="file-text" text="Điều khoản thỏa thuận" />
          <MenuItem icon="shield" text="Chính sách bảo mật" last />
        </View>

        {isLoggedIn && (
          <View style={styles.menuCard}>
            <Text style={styles.menuSectionTitle}>Tài khoản & thông báo</Text>
            <MenuItem icon="settings" text="Cài đặt tài khoản" />
            <MenuItem
              icon="key"
              text="Đổi mật khẩu"
              onPress={() => navigation.navigate('UserProfile', { screen: 'ChangePassword' })}
            />
            <MenuItem icon="bell" text="Cài đặt thông báo" />
            <MenuItem icon="log-out" text="Đăng xuất" isDestructive onPress={handleLogout} last />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <RHSLogo size={24} />
          <Text style={styles.footerText}>Hệ thống cung ứng nhà ở xã hội bền vững</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Menu Item Component
const MenuItem = ({ icon, text, onPress, isDestructive, last }: {
  icon: string;
  text: string;
  onPress?: () => void;
  isDestructive?: boolean;
  last?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.menuItem, last && styles.menuItemLast]}
    onPress={onPress}
  >
    <Feather
      name={icon as any}
      size={20}
      color={isDestructive ? RHSColors.govRed : RHSColors.text}
    />
    <Text style={[styles.menuItemText, isDestructive && { color: RHSColors.govRed }]}>
      {text}
    </Text>
    <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  container: {
    flex: 1,
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
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  brandHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: RHSColors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },
  loginCard: {
    margin: 16,
    padding: 32,
    backgroundColor: RHSColors.white,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  loginIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: RHSColors.text,
    marginBottom: 8,
  },
  loginDesc: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: RHSColors.govBlue,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.white,
  },
  registerText: {
    fontSize: 14,
    color: RHSColors.govRed,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 18,
    backgroundColor: RHSColors.white,
    borderRadius: 16,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: RHSColors.govBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RHSColors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: RHSColors.text,
  },
  profileRole: {
    fontSize: 13,
    color: RHSColors.textMuted,
    marginTop: 2,
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: RHSColors.white,
    borderRadius: 16,
    paddingHorizontal: 4,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: RHSColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.surface,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: RHSColors.text,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: RHSColors.govBlueDark,
    textAlign: 'center',
    opacity: 0.7,
  },
});