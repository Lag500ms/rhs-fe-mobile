export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  citizenId?: string;
  dateOfBirth?: string;
  address?: string;
  residentWard?: string;
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
  residentWard?: string;
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
