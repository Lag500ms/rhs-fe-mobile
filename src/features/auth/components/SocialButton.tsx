import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { authApi } from '../api/authApi';
import { setTokens } from '../../../lib/tokenStorage';
import { useNavigation } from '@react-navigation/native';

WebBrowser.maybeCompleteAuthSession();

interface SocialButtonProps {
  onLoginSuccess?: () => void;
}

export const SocialButton = ({ onLoginSuccess }: SocialButtonProps) => {
  const navigation = useNavigation<any>();
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '669202288774-8ceekboddkll5i8r6o00h76i1tru76gt.apps.googleusercontent.com',
    iosClientId: '669202288774-8ceekboddkll5i8r6o00h76i1tru76gt.apps.googleusercontent.com',
    androidClientId: '669202288774-8ceekboddkll5i8r6o00h76i1tru76gt.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication?.idToken || '');
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    try {
      if (!idToken) {
        Alert.alert('Lỗi', 'Không thể lấy thông tin từ Google');
        return;
      }

      const result = await authApi.googleLogin({
        idToken: idToken,
        accessToken: '', // Backend only needs idToken
      });

      if (result.success && result.accessToken) {
        await setTokens(result.accessToken, result.refreshToken);
        Alert.alert('Thành công', 'Đăng nhập Google thành công!');
        
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          navigation.goBack();
        }
      } else {
        Alert.alert('Lỗi', result.message || 'Đăng nhập Google thất bại');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập với Google');
    }
  };

  const handlePress = () => {
    promptAsync();
  };

  return (
    <TouchableOpacity 
      style={styles.socialButton}
      onPress={handlePress}
      disabled={!request}
    >
      <Image
        source={require('../../../../assets/google.png')}
        style={styles.socialIcon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
});

