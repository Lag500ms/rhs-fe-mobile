import apiClient from '../../../lib/apiClient';
import { userApi } from '../../user/api/userApi';
import phuongData from '../../../../assets/phuong.json';

type PhuongEntry = {
  name: string;
  type: string;
  slug: string;
  name_with_type: string;
  path: string;
  path_with_type: string;
  code: string;
  parent_code: string;
};

const phuongList: PhuongEntry[] = Object.values(phuongData);

/** Loại bỏ dấu tiếng Việt để so khớp chính xác */
function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Trích xuất ResidentWard từ địa chỉ bằng cách so khớp với danh sách phường/xã */
function extractWardFromAddress(address: string): string | undefined {
  if (!address) return undefined;
  const normalized = removeDiacritics(address.toLowerCase());

  // Tìm tất cả các phường/xã có tên xuất hiện trong địa chỉ
  const matches = phuongList.filter((p) => normalized.includes(removeDiacritics(p.name.toLowerCase())));

  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0].code;

  // Nhiều kết quả → ưu tiên cái có path trùng với địa chỉ
  const byPath = matches.filter((p) => {
    const pathTokens = p.path.toLowerCase().split(',').map((t) => removeDiacritics(t.trim()));
    return pathTokens.some((token) => normalized.includes(token));
  });

  if (byPath.length > 0) {
    // Ưu tiên tên dài nhất trong những cái khớp path
    return byPath.sort((a, b) => b.name.length - a.name.length)[0].code;
  }

  // Fallback: tên dài nhất
  return matches.sort((a, b) => b.name.length - a.name.length)[0].code;
}

/** Trích xuất message chi tiết từ lỗi 400 của backend */
function extractErrorMessage(e: any, fallback: string): string {
  const data = e?.response?.data;
  if (!data) return fallback;
  const msg = data.message || data.detail || data.title || fallback;
  const field = data.field;
  const code = data.errorCode;
  const parts: string[] = [msg];
  if (code) parts.push(`(Mã: ${code})`);
  if (field) parts.push(`[Field: ${field}]`);
  return parts.join(' ');
}

export interface OcrResult {
  id?: string;
  name?: string;
  dob?: string;
  sex?: string;
  nationality?: string;
  home?: string;
  address?: string;
  doe?: string;
  issueDate?: string;
  issueLoc?: string;
  type?: string;
  overallScore?: number;
}

export interface FaceMatchResult {
  isMatch: boolean;
  similarity: number;
  isBothImgIdCard: boolean;
  fptMessage: string;
}

export interface LivenessResult {
  isLive: boolean;
  spoofProbability: number;
  needToReview: boolean;
  isDeepfake: boolean;
  warning: string;
  livenessCode: string;
  livenessMessage: string;
  fptMessage: string;
}

const getMimeType = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0];
  switch (ext) {
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'mp4': return 'video/mp4';
    case 'mov': return 'video/quicktime';
    case 'avi': return 'video/x-msvideo';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    default: return 'image/jpeg';
  }
};

export const eKycApi = {
  /**
   * Bước 1: OCR - Trích xuất thông tin từ ảnh CCCD
   */
  ocr: async (imageUri: string): Promise<OcrResult> => {
    const filename = imageUri.split('/').pop()?.split('?')[0] || 'cccd.jpg';
    const type = getMimeType(imageUri);

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    try {
      const response = await apiClient.post('/EKyc/ocr', formData);
      return response.data.data;
    } catch (e: any) {
      const msg = extractErrorMessage(e, 'Lỗi không xác định từ OCR API');
      throw new Error(msg);
    }
  },

  /**
   * Bước 3: Liveness - Gửi video + ảnh khuôn mặt để kiểm tra thực thể sống
   * Backend yêu cầu cả videoFile (video) và cmndImage (ảnh selfie)
   */
  liveness: async (videoUri: string, cmndImageUri: string): Promise<LivenessResult> => {
    const videoFilename = videoUri.split('/').pop()?.split('?')[0] || 'face.mp4';
    const videoType = getMimeType(videoUri);
    const imageFilename = cmndImageUri.split('/').pop()?.split('?')[0] || 'selfie.jpg';
    const imageType = getMimeType(cmndImageUri);

    const formData = new FormData();
    formData.append('videoFile', {
      uri: videoUri,
      name: videoFilename,
      type: videoType,
    } as any);
    formData.append('cmndImage', {
      uri: cmndImageUri,
      name: imageFilename,
      type: imageType,
    } as any);

    try {
      const response = await apiClient.post('/EKyc/liveness', formData);
      return response.data.data;
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = extractErrorMessage(e, 'Lỗi không xác định từ Liveness API');
      if (status === 400) {
        throw new Error(`[400] Dữ liệu gửi lên không hợp lệ:\n${msg}\n\nKiểm tra:\n• Dung lượng video (tối đa có thể 5-10MB)\n• Định dạng video (phải là .mp4 / .avi / .mov / .wmv)\n• Ảnh khuôn mặt (cmndImage) không được để trống`);
      }
      throw new Error(msg);
    }
  },

  /**
   * Bước 2b: Face Match - So khớp ảnh selfie với ảnh CCCD
   */
  faceMatch: async (faceImageUri: string, idCardImageUri: string): Promise<FaceMatchResult> => {
    const formData = new FormData();

    const faceFilename = faceImageUri.split('/').pop()?.split('?')[0] || 'selfie.jpg';
    const faceType = getMimeType(faceImageUri);
    const idFilename = idCardImageUri.split('/').pop()?.split('?')[0] || 'cccd.jpg';
    const idType = getMimeType(idCardImageUri);

    formData.append('faceImage', { uri: faceImageUri, name: faceFilename, type: faceType } as any);
    formData.append('idCardImage', { uri: idCardImageUri, name: idFilename, type: idType } as any);

    try {
      const response = await apiClient.post('/EKyc/face-match', formData);
      return response.data.data;
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = extractErrorMessage(e, 'Lỗi không xác định từ FaceMatch API');
      if (status === 400) {
        throw new Error(`[400] Dữ liệu gửi lên không hợp lệ:\n${msg}\n\nKiểm tra:\n• Dung lượng ảnh (tối đa có thể 5-10MB)\n• Định dạng file (phải là .jpg/.jpeg/.png)\n• Ảnh không được rỗng\n• Cả 2 ảnh (selfie + CCCD) đều phải có`);
      }
      throw new Error(msg);
    }
  },

  /**
   * Kiểm tra CCCD đã tồn tại trong hệ thống chưa.
   * Gọi sau bước OCR, trước khi chuyển sang face-match.
   * Trả về true nếu CCCD chưa có ai dùng hoặc thuộc về chính user hiện tại.
   */
  checkCitizenId: async (citizenId: string): Promise<{ available: boolean; message: string }> => {
    try {
      const response = await apiClient.get('/EKyc/check-citizen-id', {
        params: { citizenId },
      });
      return { available: true, message: response?.data?.message || 'CCCD hợp lệ' };
    } catch (e: any) {
      if (e?.response?.status === 409) {
        const msg = e?.response?.data?.message || 'Số CCCD này đã được xác thực bởi tài khoản khác.';
        return { available: false, message: msg };
      }
      throw new Error('Không thể kiểm tra CCCD. Vui lòng thử lại.');
    }
  },

  /**
   * Sau khi xác minh thành công: cập nhật profile từ dữ liệu OCR.
   * Fetch profile hiện tại trước để giữ lại phoneNumber, sau đó merge với dữ liệu OCR.
   */
  updateProfileFromOcr: async (ocr: OcrResult) => {
    // 1. Lấy profile hiện tại để lấy phoneNumber
    let currentPhone: string | undefined;
    try {
      const profileRes = await apiClient.get('/users/profile');
      currentPhone = profileRes?.data?.user?.phoneNumber;
    } catch {
      // Nếu không lấy được profile thì vẫn tiếp tục (không có phoneNumber)
    }

    // 2. Xây dựng payload
    const payload: {
      fullName: string;
      phoneNumber?: string;
      dateOfBirth?: string;
      address?: string;
      citizenId?: string;
      residentWard?: string;
    } = {
      fullName: ocr.name || '',
    };

    // Giữ lại số điện thoại hiện có (chỉ gửi nếu có giá trị)
    if (currentPhone) {
      payload.phoneNumber = currentPhone;
    }

    if (ocr.dob) {
      // Convert DD/MM/YYYY or YYYY-MM-DD to ISO string for API
      try {
        let dateStr = ocr.dob;
        // Handle DD/MM/YYYY format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const [d, m, y] = dateStr.split('/');
          dateStr = `${y}-${m}-${d}`;
        }
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          payload.dateOfBirth = date.toISOString();
        }
      } catch {}
    }

    if (ocr.address || ocr.home) payload.address = ocr.address || ocr.home;
    if (ocr.id) payload.citizenId = ocr.id;

    // Lấy ResidentWard từ địa chỉ (dùng phuong.json)
    const residentWard = extractWardFromAddress(payload.address || '');
    if (residentWard) {
      payload.residentWard = residentWard;
    }

    // 3. Gửi cập nhật
    const response = await apiClient.put('/users/profile', payload);
    return response.data;
  },
};