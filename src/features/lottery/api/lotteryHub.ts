import { getToken } from '../../../lib/tokenStorage';
import type { LiveDrawResult } from '../types/lottery';

type HubConnection = {
  state: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  invoke: (method: string, ...args: unknown[]) => Promise<unknown>;
  on: (method: string, cb: (...args: any[]) => void) => void;
  off: (method: string, cb?: (...args: any[]) => void) => void;
};

function hubBaseUrl(): string {
  const api = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
  // EXPO_PUBLIC_API_BASE_URL thường kết thúc bằng /api → hub ở gốc host
  return api.replace(/\/api\/?$/i, '');
}

/**
 * Kết nối SignalR sảnh bốc thăm.
 * Nếu chưa cài @microsoft/signalr → trả null (màn hình vẫn dùng REST draw-unit).
 */
export async function connectLotteryLobby(
  projectId: string,
  handlers: {
    onLobbyCount?: (count: number) => void;
    onDrawResult?: (result: LiveDrawResult) => void;
    onError?: (message: string) => void;
  },
): Promise<HubConnection | null> {
  let signalR: typeof import('@microsoft/signalr');
  try {
    signalR = await import('@microsoft/signalr');
  } catch {
    handlers.onError?.(
      'Chưa cài @microsoft/signalr — dùng chế độ REST. Chạy: npm i @microsoft/signalr',
    );
    return null;
  }

  const token = await getToken();
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${hubBaseUrl()}/hubs/lottery`, {
      accessTokenFactory: () => token ?? '',
    })
    .withAutomaticReconnect()
    .build() as unknown as HubConnection;

  if (handlers.onLobbyCount) {
    connection.on('ReceiveLobbyCount', (count: number) => {
      handlers.onLobbyCount?.(Number(count) || 0);
    });
  }
  if (handlers.onDrawResult) {
    connection.on('ReceiveDrawResult', (data: unknown) => {
      const o = (data ?? {}) as Record<string, unknown>;
      handlers.onDrawResult?.({
        projectId: String(o.projectId ?? o.ProjectId ?? projectId),
        applicationId: String(o.applicationId ?? o.ApplicationId ?? ''),
        applicantId: String(o.applicantId ?? o.ApplicantId ?? ''),
        applicantName: String(o.applicantName ?? o.ApplicantName ?? ''),
        citizenId: String(o.citizenId ?? o.CitizenId ?? ''),
        result: String(o.result ?? o.Result ?? ''),
        slotCode: (o.slotCode ?? o.SlotCode) as string | null | undefined,
        drawnAt: String(o.drawnAt ?? o.DrawnAt ?? new Date().toISOString()),
        remainingUnits: Number(o.remainingUnits ?? o.RemainingUnits ?? 0),
        priorityGroup: (o.priorityGroup ?? o.PriorityGroup) as string | null | undefined,
      });
    });
  }

  try {
    await connection.start();
    await connection.invoke('JoinProjectLobby', projectId);
    return connection;
  } catch (err: any) {
    handlers.onError?.(err?.message ?? 'Không kết nối được sảnh bốc thăm');
    try {
      await connection.stop();
    } catch {
      /* ignore */
    }
    return null;
  }
}

export async function leaveLotteryLobby(
  connection: HubConnection | null,
  projectId: string,
): Promise<void> {
  if (!connection) return;
  try {
    if (connection.state === 'Connected') {
      await connection.invoke('LeaveProjectLobby', projectId);
    }
  } catch {
    /* ignore */
  }
  try {
    await connection.stop();
  } catch {
    /* ignore */
  }
}
