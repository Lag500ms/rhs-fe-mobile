import apiClient from '../../../lib/apiClient';
import { HouseholdMember, HouseholdMemberRequest } from '../types/household';

export const householdMemberApi = {
  getMembers: async (applicationId: string): Promise<HouseholdMember[]> => {
    const response = await apiClient.get<HouseholdMember[]>(
      `/housing-applications/${applicationId}/members`,
    );
    return response.data;
  },

  addMember: async (
    applicationId: string,
    data: HouseholdMemberRequest,
  ): Promise<HouseholdMember> => {
    const response = await apiClient.post<HouseholdMember>(
      `/housing-applications/${applicationId}/members`,
      data,
    );
    return response.data;
  },

  updateMember: async (
    applicationId: string,
    memberId: string,
    data: HouseholdMemberRequest,
  ): Promise<HouseholdMember> => {
    const response = await apiClient.put<HouseholdMember>(
      `/housing-applications/${applicationId}/members/${memberId}`,
      data,
    );
    return response.data;
  },

  removeMember: async (applicationId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/housing-applications/${applicationId}/members/${memberId}`);
  },
};
