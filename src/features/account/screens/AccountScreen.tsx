import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors, borderRadius, shadows, typography, spacing } from '../../../lib/theme';
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
    } catch {
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

  const handleLogin = () => navigation.navigate('Auth', { screen: 'Login' });
  const handleProfilePress = () => navigation.navigate('UserProfile');
  const handleLogout = async () => {
    await clearTokens();
    setIsLoggedIn(false);
    setProfile(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Brand bar stripes */}
      <View style={styles.brandBar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.red600 }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.amber600 }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.blue700 }]} />
      </View>

      {/* Header gradient */}
      <LinearGradient
        colors={['#0A3A85', '#1565C0', '#1E88E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBg}
      >
        <RHSLogo size={36} />
        <Text style={styles.headerTitle}>RHS Platform</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile card OR Login prompt */}
        {!isLoggedIn ? (
          <View style={styles.loginCard}>
            <View style={styles.loginAvatarCircle}>
              <Feather name="user" size={44} color={RHSColors.blue700} />
            </View>
            <Text style={styles.loginTitle}>Chào bạn!</Text>
            <Text style={styles.loginSub}>
              Đăng nhập để tra cứu và đăng ký nhà ở xã hội dành cho hộ nghèo, cận nghèo tại phường.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} activeOpacity={0.85}>
              <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Auth', { screen: 'Register' })} style={styles.linkBtn}>
              <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.profileCard} onPress={handleProfilePress} activeOpacity={0.85}>
            {profile?.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'R'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.fullName || 'Người dùng'}</Text>
              <Text style={styles.profileHint}>Xem hồ sơ cá nhân</Text>
            </View>
            <Feather name="chevron-right" size={22} color={RHSColors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Menu: Guide */}
        <View style={styles.menuCard}>
          <Text style={styles.menuTitle}>HƯỚNG DẪN</Text>
          <MenuItem icon="help-circle" label="Câu hỏi thường gặp" />
          <MenuItem icon="message-circle" label="Góp ý, báo lỗi" onPress={() => navigation.navigate('IssueReport')} />
          <MenuItem icon="info" label="Về chúng tôi" last />
        </View>

        {/* Menu: Policy */}
        <View style={styles.menuCard}>
          <Text style={styles.menuTitle}>QUY ĐỊNH</Text>
          <MenuItem icon="file-text" label="Điều khoản thỏa thuận" />
          <MenuItem icon="shield" label="Chính sách bảo mật" last />
        </View>

        {/* Menu: Account (only when logged in) */}
        {isLoggedIn && (
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>TÀI KHOẢN & THÔNG BÁO</Text>
            <MenuItem icon="settings" label="Cài đặt tài khoản" />
            <MenuItem
              icon="lock"
              label="Đổi mật khẩu"
              onPress={() => navigation.navigate('UserProfile', { screen: 'ChangePassword' })}
            />
            <MenuItem icon="bell" label="Thông báo" />
            <MenuItem icon="log-out" label="Đăng xuất" onPress={handleLogout} danger last />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <RHSLogo size={20} />
          <Text style={styles.footerText}>RHS Platform — Nền tảng hỗ trợ nhà ở {'\n'}cho hộ nghèo, cận nghèo tại phường</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Menu Item ──────────────────────────────────────────────────
const MenuItem = ({
  icon,
  label,
  onPress,
  danger,
  last,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.menuItem, last && { borderBottomWidth: 0 }]}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View style={[styles.menuIconWrap, danger && { backgroundColor: RHSColors.red50 }]}>
      <Feather name={icon as any} size={18} color={danger ? RHSColors.red600 : RHSColors.blue700} />
    </View>
    <Text style={[styles.menuLabel, danger && { color: RHSColors.red600 }]}>{label}</Text>
    <Feather name="chevron-right" size={18} color={RHSColors.grey400} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface },
  brandBar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  headerBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Login card ──
  loginCard: {
    margin: 16,
    padding: 28,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  loginAvatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginTitle: { ...typography.h2, color: RHSColors.text, marginBottom: 8 },
  loginSub: { ...typography.bodySmall, color: RHSColors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
    ...shadows.md,
  },
  primaryBtnText: { ...typography.button, color: '#fff' },
  linkBtn: { paddingVertical: 4 },
  linkText: { ...typography.bodySmall, color: RHSColors.blue700, fontWeight: '600', textDecorationLine: 'underline' },

  // ── Profile card ──
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: RHSColors.white,
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: RHSColors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitial: { fontSize: 24, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, color: RHSColors.text },
  profileHint: { fontSize: 12, color: RHSColors.textMuted, marginTop: 2 },

  // ── Menu ──
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    paddingVertical: 8,
    ...shadows.sm,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: RHSColors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: { flex: 1, ...typography.bodySmall, color: RHSColors.text, fontWeight: '500' },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});