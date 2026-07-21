import apiClient from '../../../lib/apiClient';
import {
  UserProfileDto,
  UpdateProfileDto,
  DeleteAccountDto,
  ImageAsset,
  UserResponse,
} from '../types/user';

const uploadProfileImage = async (asset: ImageAsset): Promise<UserResponse> => {
  const formData = new FormData();
  formData.append('Image', {
    uri: asset.uri,
    name: asset.fileName,
    type: asset.type,
  } as any);

  const response = await apiClient.post<UserResponse>('/users/profile/image', formData);
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
