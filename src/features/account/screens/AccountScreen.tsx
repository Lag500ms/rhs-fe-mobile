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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand header */}
        <View style={styles.brandHeader}>
          <RHSLogo size={32} />
          <Text style={styles.brandHeaderText}>RHS</Text>
        </View>

        {/* Login/Profile Section */}
        {!isLoggedIn ? (
          <View style={styles.loginPromptContainer}>
            <View style={[styles.iconContainer, { backgroundColor: '#e0f4ff' }]}>
              <Feather name="user" size={48} color={RHSColors.govBlue} />
            </View>
            <Text style={styles.loginPromptText}>
              Đăng nhập tài khoản để xem thông tin và liên hệ đăng kí nhà ở xã hội phù hợp với bạn. Nếu chưa có tài khoản, hãy đăng ký ngay để trải nghiệm đầy đủ các tính năng của ứng dụng RHS.
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.profileContainer} onPress={handleProfilePress}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: RHSColors.govBlue }]}>
                <Text style={styles.avatarText}>
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'R'}
                </Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.fullName || 'Người dùng'}</Text>
              <Text style={styles.profileRole}>{profile?.role || 'Applicant'}</Text>
              <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
            </View>
          </TouchableOpacity>
        )}

        {/* Hướng dẫn Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hướng dẫn</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="help-circle" size={20} color={RHSColors.text} />
            <Text style={styles.menuItemText}>Câu hỏi thường gặp</Text>
            <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="message-circle" size={20} color={RHSColors.text} />
            <Text style={styles.menuItemText}>Góp ý báo lỗi</Text>
            <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="users" size={20} color={RHSColors.text} />
            <Text style={styles.menuItemText}>Về chúng tôi</Text>
            <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Quy định Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quy định</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="file-text" size={20} color={RHSColors.text} />
            <Text style={styles.menuItemText}>Điều khoản thỏa thuận</Text>
            <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="shield" size={20} color={RHSColors.text} />
            <Text style={styles.menuItemText}>Chính sách bảo mật</Text>
            <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Tài khoản & thông báo Section - Only show when logged in */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài khoản & thông báo</Text>

            <TouchableOpacity style={styles.menuItem}>
              <Feather name="settings" size={20} color={RHSColors.text} />
              <Text style={styles.menuItemText}>Cài đặt tài khoản</Text>
              <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('UserProfile', { screen: 'ChangePassword' })}
            >
              <Feather name="key" size={20} color={RHSColors.text} />
              <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
              <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Feather name="bell" size={20} color={RHSColors.text} />
              <Text style={styles.menuItemText}>Cài đặt thông báo</Text>
              <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Feather name="log-out" size={20} color={RHSColors.govRed} />
              <Text style={[styles.menuItemText, { color: RHSColors.govRed }]}>Đăng xuất</Text>
              <Feather name="chevron-right" size={20} color={RHSColors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Info */}
        <View style={styles.footer}>
          <RHSLogo size={28} />
          <Text style={styles.footerTitle}>Hệ thống cung ứng nhà ở xã hội bền vững</Text>
        </View>

        {/* Post Button */}
        <TouchableOpacity style={styles.postButton}>
          <Feather name="arrow-right" size={20} color={RHSColors.white} />
          <Text style={styles.postButtonText}>Chuyển sang đăng tin</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surfaceCard,
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
    backgroundColor: RHSColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
  },
  brandHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: RHSColors.govBlueDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptContainer: {
    backgroundColor: RHSColors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginPromptText: {
    fontSize: 14,
    color: RHSColors.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: RHSColors.govBlue,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.white,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    backgroundColor: RHSColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RHSColors.border,
    position: 'relative',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: RHSColors.govBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RHSColors.white,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: RHSColors.text,
    width: '100%',
  },
  profileRole: {
    fontSize: 12,
    color: RHSColors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.textMuted,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.surface,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: RHSColors.text,
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
    gap: 8,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: RHSColors.govBlueDark,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    color: RHSColors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.govBlue,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 25,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.white,
    marginLeft: 8,
  },
});