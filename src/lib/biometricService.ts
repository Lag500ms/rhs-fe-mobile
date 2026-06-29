import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'isBiometricEnabled';
const SECURE_REFRESH_TOKEN_KEY = 'secureRefreshToken';
const SECURE_EMAIL_KEY = 'secureBiometricEmail';

interface BiometricStoredData {
  email: string;
  refreshToken: string;
}

/**
 * Kiểm tra thiết bị có hỗ trợ phần cứng sinh trắc học và đã cài đặt vân tay/khuôn mặt chưa.
 * Trả về { available, enrolled, errorMessage }
 */
export async function checkBiometricSupport(): Promise<{
  available: boolean;
  enrolled: boolean;
  errorMessage?: string;
}> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return {
        available: false,
        enrolled: false,
        errorMessage: 'Thiết bị không hỗ trợ sinh trắc học.',
      };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return {
        available: true,
        enrolled: false,
        errorMessage: 'Bạn chưa cài đặt vân tay hoặc khuôn mặt. Vui lòng cài đặt trong Cài đặt thiết bị.',
      };
    }

    return { available: true, enrolled: true };
  } catch {
    return {
      available: false,
      enrolled: false,
      errorMessage: 'Không thể kiểm tra trạng thái sinh trắc học.',
    };
  }
}

/**
 * Kiểm tra xem user đã bật đăng nhập sinh trắc học chưa.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Gọi popup quét sinh trắc học.
 */
export async function authenticateWithBiometrics(reason: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Sử dụng mật khẩu',
    });
    return result;
  } catch {
    return { success: false, error: 'Xác thực sinh trắc học thất bại.' };
  }
}

/**
 * Bật đăng nhập sinh trắc học:
 * 1. Kiểm tra hỗ trợ
 * 2. Xác thực sinh trắc học
 * 3. Lưu refreshToken + email vào SecureStore
 * 4. Lưu cờ enabled
 */
export async function enableBiometric(
  email: string,
  refreshToken: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const support = await checkBiometricSupport();
    if (!support.available || !support.enrolled) {
      return { success: false, error: support.errorMessage || 'Thiết bị không hỗ trợ sinh trắc học.' };
    }

    const authResult = await authenticateWithBiometrics(
      'Xác thực để bật đăng nhập sinh trắc học',
    );
    if (!authResult.success) {
      return { success: false, error: 'Xác thực sinh trắc học không thành công.' };
    }

    await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(SECURE_EMAIL_KEY, email);
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Không thể bật sinh trắc học.' };
  }
}

/**
 * Tắt đăng nhập sinh trắc học: xoá dữ liệu khỏi SecureStore và xoá cờ.
 */
export async function disableBiometric(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
  } catch {
    // SecureStore may fail — still clear the flag
  }
  try {
    await SecureStore.deleteItemAsync(SECURE_EMAIL_KEY);
  } catch {
    // ignore
  }
  try {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  } catch {
    // ignore
  }
}

/**
 * Lấy refreshToken đã lưu trong SecureStore.
 * Trả về cả email để so sánh — nếu email khác với email login hiện tại thì phải xóa và không dùng.
 */
export async function getStoredBiometricData(): Promise<BiometricStoredData | null> {
  try {
    const [token, email] = await Promise.all([
      SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(SECURE_EMAIL_KEY),
    ]);
    if (!token || !email) return null;
    return { email, refreshToken: token };
  } catch {
    return null;
  }
}

/**
 * Xóa biometric data chỉ khi email không khớp.
 */
export async function clearBiometricIfEmailMismatched(currentEmail: string): Promise<boolean> {
  const data = await getStoredBiometricData();
  if (data && data.email !== currentEmail) {
    await disableBiometric();
    return true;
  }
  return false;
}

/**
 * Cập nhật refreshToken mới vào SecureStore sau khi login thành công.
 * Chỉ thực hiện nếu biometric đang được bật.
 */
export async function updateStoredRefreshToken(newRefreshToken: string): Promise<void> {
  try {
    const enabled = await isBiometricEnabled();
    if (enabled) {
      await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, newRefreshToken);
    }
  } catch {
    // ignore
  }
}
