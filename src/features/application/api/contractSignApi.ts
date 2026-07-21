import apiClient from '../../../lib/apiClient';

export interface ContractSignStatus {
  applicationId: string;
  isSigned: boolean;
  signedAt?: string | null;
  pdfUrl?: string | null;
  applicationStatus: string;
}

export interface ContractSignResult {
  success: boolean;
  message: string;
  data?: { signedAt?: string };
}

export const contractSignApi = {
  getStatus: async (applicationId: string): Promise<ContractSignStatus | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: ContractSignStatus }>(
        `/contract-sign/${applicationId}/status`,
      );
      return response.data.data;
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },

  sign: async (applicationId: string): Promise<ContractSignResult> => {
    const response = await apiClient.post<ContractSignResult>(
      `/contract-sign/${applicationId}/sign`,
    );
    return response.data;
  },
};
