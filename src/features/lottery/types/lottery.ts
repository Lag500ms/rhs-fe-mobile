export type LotteryType = 'ONLINE' | 'OFFLINE' | 'HYBRID' | string;

export interface LotteryParticipant {
  applicationId: string;
  applicantId: string;
  applicantName: string;
  citizenId: string;
  priorityGroup?: string | null;
  applicationStatus: string;
  submittedAt: string;
}

export interface LotteryScheduleDetail {
  projectId: string;
  projectName: string;
  lotteryDate?: string | null;
  lotteryLocation?: string | null;
  lotteryType?: LotteryType | null;
  lotteryDescription?: string | null;
  isLotteryApproved?: boolean | null;
  lotteryApprovedAt?: string | null;
  availableUnits: number;
  totalEligibleParticipants: number;
  eligibleParticipants: LotteryParticipant[];
  /** OTP vào sảnh (sau khi Sở duyệt lịch). */
  joinCode?: string | null;
  sessionStatus?: string | null;
  /** Số SXD đang giám sát trong hub (BE bắt ≥1 mới cho Live/draw). */
  sxdOnlineCount?: number;
  lobbyCount?: number;
}

export const LOTTERY_SESSION_LABEL: Record<string, string> = {
  NOT_SCHEDULED: 'Chưa lên lịch',
  Scheduled: 'Đã lên lịch',
  WaitingLobby: 'Sảnh chờ',
  Live: 'Đang diễn ra',
  Paused: 'Tạm dừng',
  Finished: 'Đã kết thúc — chờ công bố',
  Published: 'Đã công bố',
  SCHEDULED: 'Đã lên lịch',
  APPROVED: 'Đã duyệt — chờ mở sảnh',
  RUNNING: 'Đang diễn ra',
  FINISHED: 'Đã kết thúc',
};

export interface VerifyJoinCodeResult {
  success: boolean;
  message: string;
  sessionStatus?: string | null;
}

export interface LiveDrawResult {
  projectId: string;
  applicationId: string;
  applicationCode?: string;
  applicantId: string;
  applicantName: string;
  citizenId: string;
  maskedCitizenId?: string;
  stt?: number;
  /** WON | PRIORITY_WON | LOST */
  result: string;
  slotCode?: string | null;
  drawnAt: string;
  remainingUnits: number;
  priorityGroup?: string | null;
}

export interface LotteryNextCandidate {
  applicationId: string;
  applicationCode?: string;
  applicantName: string;
  citizenId?: string;
  priorityGroup?: string | null;
}

export interface ApartmentFundStat {
  categoryName: string;
  totalUnits: number;
  remainingUnits: number;
  assignedUnits: number;
  remainingPercentage: number;
}

export interface LotteryLiveState {
  projectId: string;
  projectName: string;
  developerName?: string;
  sessionStatus: string;
  totalUnits: number;
  drawnUnitsCount: number;
  remainingUnits: number;
  totalEligibleParticipants: number;
  sxdOnlineCount: number;
  lobbyCount: number;
  priorityWinnersCount: number;
  randomWinnersCount: number;
  undrawnParticipantsCount: number;
  winRatePercentage: number;
  nextCandidate?: LotteryNextCandidate | null;
  latestDrawResult?: LiveDrawResult | null;
  recentWinners: LiveDrawResult[];
  projectApartmentFundStat?: ApartmentFundStat | null;
  apartmentFundStats: ApartmentFundStat[];
}

export interface LotteryDrawParticipant {
  applicationId?: string;
  fullName?: string;
  applicantName?: string;
  citizenId?: string;
  result?: string;
  lotteryResult?: string | null;
  slotCode?: string | null;
  priorityGroup?: string | null;
}

export interface LotteryDrawResult {
  projectId?: string;
  projectName?: string;
  drawnAt?: string;
  runAt?: string | null;
  totalUnits?: number;
  availableUnitsAfter?: number;
  participants?: LotteryDrawParticipant[];
  winners?: LotteryDrawParticipant[];
  losers?: LotteryDrawParticipant[];
}

export const LOTTERY_TYPE_LABEL: Record<string, string> = {
  ONLINE: 'Trực tuyến',
  OFFLINE: 'Trực tiếp',
  HYBRID: 'Kết hợp',
};

export const LOTTERY_RESULT_LABEL: Record<string, string> = {
  WON: 'Trúng tuyển',
  PRIORITY_WON: 'Trúng (ưu tiên)',
  LOST: 'Không trúng',
  PENDING: 'Chờ bốc thăm',
};

/** Phiên bốc chỉ công bố suất; căn hộ do chủ dự án gán sau — không hiện mã căn. */
export function unitPendingLabel(_slotCode?: string | null): string {
  return 'Trúng suất — chờ chủ dự án chọn căn';
}

export function isWonLotteryResult(result?: string | null): boolean {
  const r = String(result || '').toUpperCase();
  return r === 'WON' || r === 'PRIORITY_WON';
}
