import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * expo-secure-store native (`getValueWithKeyAsync`) thiếu trên web / native chưa rebuild.
 * Adapter này fallback AsyncStorage để app không crash.
 */
let secureAvailable: boolean | null = null;

async function canUseSecureStore(): Promise<boolean> {
  if (secureAvailable !== null) return secureAvailable;
  if (Platform.OS === 'web') {
    secureAvailable = false;
    return false;
  }
  try {
    secureAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureAvailable = false;
  }
  return secureAvailable;
}

export async function storageGet(key: string): Promise<string | null> {
  if (await canUseSecureStore()) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      secureAvailable = false;
    }
  }
  return AsyncStorage.getItem(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key).catch(() => undefined);
      return;
    } catch {
      secureAvailable = false;
    }
  }
  await AsyncStorage.setItem(key, value);
}

export async function storageDelete(key: string): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(key).catch(() => undefined);
  }
  await AsyncStorage.removeItem(key);
}
