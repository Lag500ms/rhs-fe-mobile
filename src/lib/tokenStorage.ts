import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageDelete, storageGet, storageSet } from './secureStorage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

export const setTokens = async (accessToken: string, refreshToken?: string) => {
  await storageSet(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await storageSet(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getToken = async (): Promise<string | null> => {
  return storageGet(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return storageGet(REFRESH_TOKEN_KEY);
};

export const clearTokens = async () => {
  await storageDelete(ACCESS_TOKEN_KEY);
  await storageDelete(REFRESH_TOKEN_KEY);
};

export const saveRememberedEmail = async (email: string) => {
  await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
};

export const getRememberedEmail = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
};
