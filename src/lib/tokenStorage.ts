import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

/** Đọc token: ưu tiên SecureStore, fallback AsyncStorage (migrate 1 lần). */
async function getSecureOrMigrate(key: string): Promise<string | null> {
  const secure = await SecureStore.getItemAsync(key);
  if (secure) return secure;

  const legacy = await AsyncStorage.getItem(key);
  if (legacy) {
    await SecureStore.setItemAsync(key, legacy);
    await AsyncStorage.removeItem(key);
    return legacy;
  }
  return null;
}

export const setTokens = async (accessToken: string, refreshToken?: string) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const getToken = async (): Promise<string | null> => {
  return getSecureOrMigrate(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return getSecureOrMigrate(REFRESH_TOKEN_KEY);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => undefined);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => undefined);
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
};

export const saveRememberedEmail = async (email: string) => {
  await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
};

export const getRememberedEmail = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
};
