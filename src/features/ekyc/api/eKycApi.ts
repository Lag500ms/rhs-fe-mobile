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

export const eKycApi = {
  /**
   * Bước 1: OCR - Trích xuất thông tin từ ảnh CCCD
   */
  ocr: async (imageUri: string): Promise<OcrResult> => {
    const filename = imageUri.split('/').pop() || 'cccd.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

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
   * Bước 2: Face Match - So khớp khuôn mặt selfie với ảnh trên CCCD
   */
  faceMatch: async (
    faceImageUri: string,
    idCardImageUri: string,
  ): Promise<FaceMatchResult> => {
    const formData = new FormData();

    const faceFilename = faceImageUri.split('/').pop() || 'selfie.jpg';
    const faceMatch = /\.(\w+)$/.exec(faceFilename);
    const faceType = faceMatch ? `image/${faceMatch[1]}` : 'image/jpeg';

    const idFilename = idCardImageUri.split('/').pop() || 'cccd_face.jpg';
    const idMatch = /\.(\w+)$/.exec(idFilename);
    const idType = idMatch ? `image/${idMatch[1]}` : 'image/jpeg';

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

    const response = await apiClient.post('/EKyc/face-match', formData);
    return response.data.data;
  },

  /**
   * Bước 3: Liveness - Kiểm tra ảnh selfie có phải người thật
   */
  liveness: async (faceImageUri: string): Promise<LivenessResult> => {
    const filename = faceImageUri.split('/').pop() || 'selfie.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('faceImage', {
      uri: faceImageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post('/EKyc/liveness', formData);
    return response.data.data;
  },
};