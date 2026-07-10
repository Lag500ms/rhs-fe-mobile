export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyOtpDto {
  email: string;
  otpCode: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  requiresOtpVerification?: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    address?: string;
    role: string;
    isEmailVerified: boolean;
    profileImageUrl?: string;
  };
}
