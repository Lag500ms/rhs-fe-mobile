import apiClient from '../../../lib/apiClient';

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
  isBothFace: boolean;
  requestId: string;
}

export interface LivenessResult {
  isLive: boolean;
  livenessScore: number;
  code: string;
  message: string;
}

const getMimeType = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0];
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
};

const multipartHeaders = { 'Content-Type': 'multipart/form-data' };

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

    const response = await apiClient.post('/EKyc/ocr', formData, { headers: multipartHeaders });
    return response.data.data;
  },

  /**
   * Bước 2: Face Match - So khớp khuôn mặt selfie với ảnh trên CCCD
   */
  faceMatch: async (
    faceImageUri: string,
    idCardImageUri: string,
  ): Promise<FaceMatchResult> => {
    const formData = new FormData();

    const faceFilename = faceImageUri.split('/').pop()?.split('?')[0] || 'selfie.jpg';
    const faceType = getMimeType(faceImageUri);

    const idFilename = idCardImageUri.split('/').pop()?.split('?')[0] || 'cccd_face.jpg';
    const idType = getMimeType(idCardImageUri);

    formData.append('faceImage', {
      uri: faceImageUri,
      name: faceFilename,
      type: faceType,
    } as any);

    formData.append('idCardImage', {
      uri: idCardImageUri,
      name: idFilename,
      type: idType,
    } as any);

    const response = await apiClient.post('/EKyc/face-match', formData, { headers: multipartHeaders });
    return response.data.data;
  },

  /**
   * Bước 3: Liveness - Kiểm tra ảnh selfie có phải người thật
   */
  liveness: async (faceImageUri: string): Promise<LivenessResult> => {
    const filename = faceImageUri.split('/').pop()?.split('?')[0] || 'selfie.jpg';
    const type = getMimeType(faceImageUri);

    const formData = new FormData();
    formData.append('faceImage', {
      uri: faceImageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post('/EKyc/liveness', formData, { headers: multipartHeaders });
    return response.data.data;
  },
};
