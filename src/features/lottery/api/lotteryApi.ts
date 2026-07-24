import apiClient from '../../../lib/apiClient';
import type {
  LiveDrawResult,
  LotteryDrawResult,
  LotteryScheduleDetail,
} from '../types/lottery';

function pick<T extends Record<string, unknown>>(raw: unknown): T {
  if (!raw || typeof raw !== 'object') return {} as T;
  const o = raw as Record<string, unknown>;
  const nested = o.data ?? o.Data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as T;
  }
  return o as T;
}

function mapSchedule(raw: unknown): LotteryScheduleDetail {
  const o = pick<Record<string, unknown>>(raw);
  const participantsRaw = (o.eligibleParticipants ?? o.EligibleParticipants) as unknown;
  const list = Array.isArray(participantsRaw) ? participantsRaw : [];
  return {
    projectId: String(o.projectId ?? o.ProjectId ?? ''),
    projectName: String(o.projectName ?? o.ProjectName ?? ''),
    lotteryDate: (o.lotteryDate ?? o.LotteryDate) as string | null | undefined,
    lotteryLocation: (o.lotteryLocation ?? o.LotteryLocation) as string | null | undefined,
    lotteryType: (o.lotteryType ?? o.LotteryType) as string | null | undefined,
    lotteryDescription: (o.lotteryDescription ?? o.LotteryDescription) as
      | string
      | null
      | undefined,
    isLotteryApproved: (o.isLotteryApproved ?? o.IsLotteryApproved) as boolean | null | undefined,
    lotteryApprovedAt: (o.lotteryApprovedAt ?? o.LotteryApprovedAt) as string | null | undefined,
    availableUnits: Number(o.availableUnits ?? o.AvailableUnits ?? 0),
    totalEligibleParticipants: Number(
      o.totalEligibleParticipants ?? o.TotalEligibleParticipants ?? list.length,
    ),
    eligibleParticipants: list.map((it) => {
      const p = (it ?? {}) as Record<string, unknown>;
      return {
        applicationId: String(p.applicationId ?? p.ApplicationId ?? ''),
        applicantId: String(p.applicantId ?? p.ApplicantId ?? ''),
        applicantName: String(p.applicantName ?? p.ApplicantName ?? ''),
        citizenId: String(p.citizenId ?? p.CitizenId ?? ''),
        priorityGroup: (p.priorityGroup ?? p.PriorityGroup) as string | null | undefined,
        applicationStatus: String(p.applicationStatus ?? p.ApplicationStatus ?? ''),
        submittedAt: String(p.submittedAt ?? p.SubmittedAt ?? ''),
      };
    }),
  };
}

function mapLiveDraw(raw: unknown): LiveDrawResult {
  const o = pick<Record<string, unknown>>(raw);
  return {
    projectId: String(o.projectId ?? o.ProjectId ?? ''),
    applicationId: String(o.applicationId ?? o.ApplicationId ?? ''),
    applicantId: String(o.applicantId ?? o.ApplicantId ?? ''),
    applicantName: String(o.applicantName ?? o.ApplicantName ?? ''),
    citizenId: String(o.citizenId ?? o.CitizenId ?? ''),
    result: String(o.result ?? o.Result ?? ''),
    slotCode: (o.slotCode ?? o.SlotCode) as string | null | undefined,
    drawnAt: String(o.drawnAt ?? o.DrawnAt ?? new Date().toISOString()),
    remainingUnits: Number(o.remainingUnits ?? o.RemainingUnits ?? 0),
    priorityGroup: (o.priorityGroup ?? o.PriorityGroup) as string | null | undefined,
  };
}

export const lotteryApi = {
  async getSchedule(projectId: string): Promise<LotteryScheduleDetail> {
    const res = await apiClient.get(`/projects/${projectId}/lottery/schedule`);
    return mapSchedule(res.data);
  },

  async drawUnit(projectId: string): Promise<LiveDrawResult> {
    const res = await apiClient.post(`/projects/${projectId}/lottery/draw-unit`);
    return mapLiveDraw(res.data);
  },

  async getResult(projectId: string): Promise<LotteryDrawResult | null> {
    try {
      const res = await apiClient.get(`/projects/${projectId}/lottery/result`);
      return pick<LotteryDrawResult>(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
};
