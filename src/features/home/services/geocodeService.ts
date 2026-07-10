export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const VIETNAM_FALLBACK: LatLng = { latitude: 21.0285, longitude: 105.8542 };

export const geocode = async (address: string, fallbackProvince?: string): Promise<{ coords: LatLng; error?: string }> => {
  try {
    const enc = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${enc}.json?access_token=${MAPBOX_TOKEN}&country=VN&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { coords: { latitude: lat, longitude: lng } };
    }

    if (fallbackProvince) {
      const fbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fallbackProvince)}.json?access_token=${MAPBOX_TOKEN}&country=VN&limit=1`;
      const fbRes = await fetch(fbUrl);
      const fbData = await fbRes.json();
      if (fbData.features?.length > 0) {
        const [lng, lat] = fbData.features[0].center;
        return { coords: { latitude: lat, longitude: lng } };
      }
    }

    return { coords: VIETNAM_FALLBACK, error: 'Không thể xác định vị trí chính xác' };
  } catch {
    return { coords: VIETNAM_FALLBACK, error: 'Không thể tải bản đồ' };
  }
};
