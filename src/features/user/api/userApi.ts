import apiClient from '../../../lib/apiClient';
import { getToken } from '../../../lib/tokenStorage';
import * as FileSystem from 'expo-file-system';
import { FileSystemUploadType } from 'expo-file-system/legacy';

const API_BASE_URL = 'http://192.168.1.16:5112/api';

export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isEmailVerified: boolean;
  profileImageUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UpdateProfileDto {
  fullName: string;
  phoneNumber?: string;
}

export interface DeleteAccountDto {
  password: string;
  reason?: string;
}

export interface ImageAsset {
  uri: string;
  type: string;
  fileName: string;
}

export interface UserResponse {
  success: boolean;
  user?: UserProfileDto;
  message?: string;
}

const uploadProfileImage = async (asset: ImageAsset): Promise<UserResponse> => {
  const token = await getToken();

  const response = await FileSystem.uploadAsync(
    `${API_BASE_URL}/users/profile/image`,
    asset.uri,
    {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: 'Image',
      mimeType: asset.type,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result = JSON.parse(response.body);

  if (response.status >= 200 && response.status < 300) {
    return result;
  }

  throw {
    response: {
      status: response.status,
      data: result,
    },
    message: result.message || `HTTP ${response.status}`,
  };
};

export const userApi = {
  getProfile: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/users/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileDto): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>('/users/profile', data);
    return response.data;
  },

  uploadProfileImage,

  deleteProfileImage: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>('/users/profile/image');
    return response.data;
  },

  deleteAccount: async (data: DeleteAccountDto): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/users/delete-account', data);
    return response.data;
  },
};