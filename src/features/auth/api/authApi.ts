import axios from 'axios';
import { getToken, getRefreshToken, setTokens, clearTokens } from '../../../lib/tokenStorage';

const API_BASE_URL = 'http://10.0.2.2:5112/api';

interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          processQueue(new Error('No refresh token'));
          throw new Error('No refresh token available');
        }

        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken, success } = response.data;

        if (success && accessToken) {
          await setTokens(accessToken, newRefreshToken);
          apiClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }

        throw new Error('Refresh token failed');
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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