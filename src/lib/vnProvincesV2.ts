/**
 * Địa giới VN — provinces.open-api.vn API v2 (Tỉnh → Phường/Xã).
 * Product khóa Thành phố Hồ Chí Minh (code 79).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HCM_PROVINCE_CODE = 79;
export const HCM_PROVINCE = 'Thành phố Hồ Chí Minh';
export const HCM_PROVINCE_SHORT = 'Hồ Chí Minh';

const API_URL = `https://provinces.open-api.vn/api/v2/p/${HCM_PROVINCE_CODE}?depth=2`;
const CACHE_KEY = 'rhs.hcm.wards.v2';

type ProvinceV2Response = {
  name: string;
  code: number;
  wards?: { name: string; code: number }[];
};

let memoryCache: string[] | null = null;
let inflight: Promise<string[]> | null = null;

async function readCache(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { wards?: string[]; at?: number };
    if (!Array.isArray(parsed.wards) || parsed.wards.length === 0) return null;
    if (parsed.at && Date.now() - parsed.at > 7 * 24 * 60 * 60 * 1000) return null;
    return parsed.wards;
  } catch {
    return null;
  }
}

async function writeCache(wards: string[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ wards, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

function normalizeWards(data: ProvinceV2Response): string[] {
  const list = (data.wards ?? [])
    .map((w) => w.name?.trim())
    .filter((n): n is string => !!n);
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, 'vi'));
}

export async function fetchHcmWards(): Promise<string[]> {
  if (memoryCache?.length) return memoryCache;
  const local = await readCache();
  if (local?.length) {
    memoryCache = local;
    return local;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ProvinceV2Response;
      const wards = normalizeWards(data);
      if (wards.length === 0) throw new Error('Empty wards');
      memoryCache = wards;
      await writeCache(wards);
      return wards;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function getCachedHcmWards(): string[] {
  return memoryCache ?? [];
}
