import apiClient from '../../../lib/apiClient';

export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  citizenId?: string;
  dateOfBirth?: string;
  address?: string;
  role: string;
  isEmailVerified: boolean;
  profileImageUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UpdateProfileDto {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  citizenId?: string;
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
  const formData = new FormData();
  formData.append('Image', {
    uri: asset.uri,
    name: asset.fileName,
    type: asset.type,
  } as any);

  const response = await apiClient.post<UserResponse>('/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
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