import apiClient from '../../../lib/apiClient';
import { OcrResult, FaceMatchResult } from '../types/ekyc';
import { toUserErrorMessage } from '../../../lib/userError';

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

    const response = await apiClient.post('/EKyc/ocr', formData);
    return response.data.data;
  },

  /**
   * Face Match - So khớp ảnh selfie với ảnh CCCD (VNPT eKYC Face Compare)
   */
  faceMatch: async (faceImageUri: string, idCardImageUri: string): Promise<FaceMatchResult> => {
    const formData = new FormData();

    const faceFilename = faceImageUri.split('/').pop()?.split('?')[0] || 'selfie.jpg';
    const faceType = getMimeType(faceImageUri);
    const idFilename = idCardImageUri.split('/').pop()?.split('?')[0] || 'cccd.jpg';
    const idType = getMimeType(idCardImageUri);

    formData.append('faceImage', { uri: faceImageUri, name: faceFilename, type: faceType } as any);
    formData.append('idCardImage', { uri: idCardImageUri, name: idFilename, type: idType } as any);

    const response = await apiClient.post('/EKyc/face-match', formData);
    return response.data.data;
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
      return {
        available: true,
        message: toUserErrorMessage(response?.data?.message, 'CCCD hợp lệ'),
      };
    } catch (e: any) {
      if (e?.response?.status === 409) {
        return {
          available: false,
          message: toUserErrorMessage(
            e,
            'Số CCCD này đã được xác thực bởi tài khoản khác.',
          ),
        };
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

    // 3. Gửi cập nhật
    const response = await apiClient.put('/users/profile', payload);
    return response.data;
  },
};
