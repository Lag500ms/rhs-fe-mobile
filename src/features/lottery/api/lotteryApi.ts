import apiClient from '../../../lib/apiClient';
import type {
  ApartmentFundStat,
  LiveDrawResult,
  LotteryDrawResult,
  LotteryLiveState,
  LotteryNextCandidate,
  LotteryScheduleDetail,
  VerifyJoinCodeResult,
} from '../types/lottery';

function pick<T>(raw: unknown): T {
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
    joinCode: (o.joinCode ?? o.JoinCode) as string | null | undefined,
    sessionStatus: (o.sessionStatus ?? o.SessionStatus) as string | null | undefined,
    sxdOnlineCount: Number(o.sxdOnlineCount ?? o.SxdOnlineCount ?? 0),
    lobbyCount: Number(o.lobbyCount ?? o.LobbyCount ?? 0),
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

export function mapLiveDraw(raw: unknown): LiveDrawResult {
  const o = pick<Record<string, unknown>>(raw);
  return {
    projectId: String(o.projectId ?? o.ProjectId ?? ''),
    applicationId: String(o.applicationId ?? o.ApplicationId ?? ''),
    applicationCode: String(o.applicationCode ?? o.ApplicationCode ?? '') || undefined,
    applicantId: String(o.applicantId ?? o.ApplicantId ?? ''),
    applicantName: String(o.applicantName ?? o.ApplicantName ?? ''),
    citizenId: String(o.citizenId ?? o.CitizenId ?? ''),
    maskedCitizenId: String(o.maskedCitizenId ?? o.MaskedCitizenId ?? '') || undefined,
    stt: Number(o.stt ?? o.Stt ?? 0) || undefined,
    result: String(o.result ?? o.Result ?? ''),
    slotCode: (o.slotCode ?? o.SlotCode) as string | null | undefined,
    drawnAt: String(o.drawnAt ?? o.DrawnAt ?? new Date().toISOString()),
    remainingUnits: Number(o.remainingUnits ?? o.RemainingUnits ?? 0),
    priorityGroup: (o.priorityGroup ?? o.PriorityGroup) as string | null | undefined,
  };
}

function mapNextCandidate(raw: unknown): LotteryNextCandidate | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const applicationId = String(o.applicationId ?? o.ApplicationId ?? '');
  if (!applicationId) return null;
  return {
    applicationId,
    applicationCode: String(o.applicationCode ?? o.ApplicationCode ?? '') || undefined,
    applicantName: String(o.applicantName ?? o.ApplicantName ?? ''),
    citizenId: String(o.citizenId ?? o.CitizenId ?? '') || undefined,
    priorityGroup: (o.priorityGroup ?? o.PriorityGroup) as string | null | undefined,
  };
}

function mapFundStat(raw: unknown): ApartmentFundStat {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    categoryName: String(o.categoryName ?? o.CategoryName ?? 'Quỹ căn'),
    totalUnits: Number(o.totalUnits ?? o.TotalUnits ?? 0),
    remainingUnits: Number(o.remainingUnits ?? o.RemainingUnits ?? 0),
    assignedUnits: Number(o.assignedUnits ?? o.AssignedUnits ?? 0),
    remainingPercentage: Number(o.remainingPercentage ?? o.RemainingPercentage ?? 0),
  };
}

export function mapLiveState(raw: unknown): LotteryLiveState {
  const o = pick<Record<string, unknown>>(raw);
  const winnersRaw = o.recentWinners ?? o.RecentWinners;
  const winners = Array.isArray(winnersRaw) ? winnersRaw.map(mapLiveDraw) : [];
  const statsRaw = o.apartmentFundStats ?? o.ApartmentFundStats;
  const stats = Array.isArray(statsRaw) ? statsRaw.map(mapFundStat) : [];
  const latestRaw = o.latestDrawResult ?? o.LatestDrawResult;
  const projectFundRaw = o.projectApartmentFundStat ?? o.ProjectApartmentFundStat;
  return {
    projectId: String(o.projectId ?? o.ProjectId ?? ''),
    projectName: String(o.projectName ?? o.ProjectName ?? ''),
    developerName: String(o.developerName ?? o.DeveloperName ?? '') || undefined,
    sessionStatus: String(o.sessionStatus ?? o.SessionStatus ?? ''),
    totalUnits: Number(o.totalUnits ?? o.TotalUnits ?? 0),
    drawnUnitsCount: Number(o.drawnUnitsCount ?? o.DrawnUnitsCount ?? 0),
    remainingUnits: Number(o.remainingUnits ?? o.RemainingUnits ?? 0),
    totalEligibleParticipants: Number(
      o.totalEligibleParticipants ?? o.TotalEligibleParticipants ?? 0,
    ),
    sxdOnlineCount: Number(o.sxdOnlineCount ?? o.SxdOnlineCount ?? 0),
    lobbyCount: Number(o.lobbyCount ?? o.LobbyCount ?? 0),
    priorityWinnersCount: Number(o.priorityWinnersCount ?? o.PriorityWinnersCount ?? 0),
    randomWinnersCount: Number(o.randomWinnersCount ?? o.RandomWinnersCount ?? 0),
    undrawnParticipantsCount: Number(
      o.undrawnParticipantsCount ?? o.UndrawnParticipantsCount ?? 0,
    ),
    winRatePercentage: Number(o.winRatePercentage ?? o.WinRatePercentage ?? 0),
    nextCandidate: mapNextCandidate(o.nextCandidate ?? o.NextCandidate),
    latestDrawResult: latestRaw ? mapLiveDraw(latestRaw) : null,
    recentWinners: winners,
    projectApartmentFundStat: projectFundRaw ? mapFundStat(projectFundRaw) : null,
    apartmentFundStats: stats,
  };
}

export const lotteryApi = {
  async getSchedule(projectId: string): Promise<LotteryScheduleDetail> {
    const res = await apiClient.get(`/projects/${projectId}/lottery/schedule`);
    return mapSchedule(res.data);
  },

  async verifyOtp(projectId: string, joinCode: string): Promise<VerifyJoinCodeResult> {
    const res = await apiClient.post(`/projects/${projectId}/lottery/session/verify-otp`, {
      joinCode,
    });
    const o = pick<Record<string, unknown>>(res.data);
    return {
      success: (o.success ?? o.Success) !== false,
      message: String(o.message ?? o.Message ?? ''),
      sessionStatus: (o.sessionStatus ?? o.SessionStatus) as string | null | undefined,
    };
  },

  async getLiveState(projectId: string): Promise<LotteryLiveState> {
    const res = await apiClient.get(`/projects/${projectId}/lottery/live-state`);
    return mapLiveState(res.data);
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
