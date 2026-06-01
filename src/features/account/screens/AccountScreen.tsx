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
          <ActivityIndicator size="large" color="#000000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Login/Profile Section */}
        {!isLoggedIn ? (
          <View style={styles.loginPromptContainer}>
            <View style={styles.iconContainer}>
              <Feather name="smile" size={48} color="#007AFF" />
            </View>
            <Text style={styles.loginPromptText}>
              Đăng nhập tài khoản để xem thông tin và liên hệ người bán/cho thuê
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.profileContainer} onPress={handleProfilePress}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'V'}
                </Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.fullName || 'Người dùng'}</Text>
              <Feather name="chevron-right" size={20} color="#999" />
            </View>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>1</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Hướng dẫn Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hướng dẫn</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="help-circle" size={20} color="#333" />
            <Text style={styles.menuItemText}>Câu hỏi thường gặp</Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="message-circle" size={20} color="#333" />
            <Text style={styles.menuItemText}>Góp ý báo lỗi</Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="users" size={20} color="#333" />
            <Text style={styles.menuItemText}>Về chúng tôi</Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Quy định Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quy định</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="file-text" size={20} color="#333" />
            <Text style={styles.menuItemText}>Điều khoản thỏa thuận</Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="shield" size={20} color="#333" />
            <Text style={styles.menuItemText}>Chính sách bảo mật</Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Tài khoản & thông báo Section - Only show when logged in */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài khoản & thông báo</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <Feather name="settings" size={20} color="#333" />
              <Text style={styles.menuItemText}>Cài đặt tài khoản</Text>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('UserProfile', { screen: 'ChangePassword' })}
            >
              <Feather name="key" size={20} color="#333" />
              <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Feather name="bell" size={20} color="#333" />
              <Text style={styles.menuItemText}>Cài đặt thông báo</Text>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Feather name="log-out" size={20} color="#D93843" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Đăng xuất</Text>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Giấy ĐKKD số 0104630479 do Sở KHĐT TP Hà Nội cấp ngày 02/03/2007. Chịu trách nhiệm nội dung: Ông Nguyễn Trọng Dương
          </Text>
        </View>

        {/* Post Button */}
        <TouchableOpacity style={styles.postButton}>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
          <Text style={styles.postButtonText}>Chuyển sang đăng tin</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptContainer: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  notificationBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#D93843',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutText: {
    color: '#D93843',
  },
  footer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 25,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
