import apiClient from '../../../lib/apiClient';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  RefreshTokenDto,
  AuthResponse,
} from '../types/auth';

export const authApi = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', data);
    return response.data;
  },

  resendOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/resend-otp',
      `"${email}"`,
      { headers: { 'Content-Type': 'application/json' } },
    );
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