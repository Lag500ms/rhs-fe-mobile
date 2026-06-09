import apiClient from '../../../lib/apiClient';
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

export interface GoogleLoginDto {
  idToken: string;
  accessToken?: string;
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
  user?: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    role: string;
    isEmailVerified: boolean;
  };
}

export const authApi = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  googleLogin: async (data: GoogleLoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google-login', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', data);
    return response.data;
  },

  resendOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/resend-otp', `"${email}"`);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordDto): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/reset-password', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/change-password', data);
    return response.data;
  },

  refreshToken: async (data: RefreshTokenDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh-token', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/logout', { refreshToken });
    return response.data;
  },
};