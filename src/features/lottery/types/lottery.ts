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
}

export interface LiveDrawResult {
  projectId: string;
  applicationId: string;
  applicantId: string;
  applicantName: string;
  citizenId: string;
  /** WON | PRIORITY_WON | LOST */
  result: string;
  slotCode?: string | null;
  drawnAt: string;
  remainingUnits: number;
  priorityGroup?: string | null;
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
