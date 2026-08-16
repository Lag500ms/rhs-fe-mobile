import type { LotteryScheduleDetail } from '../../lottery/types/lottery';

/** Chuẩn hoá sessionStatus từ BE (Scheduled / SCHEDULED / Live / …). */
export function normalizeLotterySession(raw?: string | null): string {
  const s = String(raw || '').trim();
  if (!s) return 'NOT_SCHEDULED';
  const u = s.toUpperCase();
  if (u === 'NOT_SCHEDULED' || u === 'NONE') return 'NOT_SCHEDULED';
  if (u === 'SCHEDULED' || s === 'Scheduled') return 'Scheduled';
  if (u === 'APPROVED') return 'APPROVED';
  if (u === 'WAITINGLOBBY' || s === 'WaitingLobby' || u === 'LOBBY') return 'WaitingLobby';
  if (u === 'LIVE' || u === 'RUNNING' || s === 'Live') return 'Live';
  if (u === 'PAUSED' || s === 'Paused') return 'Paused';
  if (u === 'FINISHED' || s === 'Finished') return 'Finished';
  if (u === 'PUBLISHED' || s === 'Published') return 'Published';
  return s;
}

/** CĐT đã lên lịch / mở phiên (có gì để người dân vào). */
export function hasLotterySession(schedule: LotteryScheduleDetail | null | undefined): boolean {
  if (!schedule) return false;
  const phase = normalizeLotterySession(schedule.sessionStatus);
  if (phase !== 'NOT_SCHEDULED') return true;
  if (schedule.lotteryDate) return true;
  if (schedule.isLotteryApproved) return true;
  return false;
}

export function isLotteryLivePhase(schedule: LotteryScheduleDetail | null | undefined): boolean {
  const phase = normalizeLotterySession(schedule?.sessionStatus);
  return phase === 'Live' || phase === 'WaitingLobby' || phase === 'Paused';
}

export function isLotteryFinishedPhase(schedule: LotteryScheduleDetail | null | undefined): boolean {
  const phase = normalizeLotterySession(schedule?.sessionStatus);
  return phase === 'Finished' || phase === 'Published';
}
