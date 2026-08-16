import { getToken } from '../../../lib/tokenStorage';
import type { LiveDrawResult, LotteryLiveState } from '../types/lottery';
import { mapLiveDraw, mapLiveState } from './lotteryApi';

type HubConnection = {
  state: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  invoke: (method: string, ...args: unknown[]) => Promise<unknown>;
  on: (method: string, cb: (...args: any[]) => void) => void;
  off: (method: string, cb?: (...args: any[]) => void) => void;
  onreconnected?: (cb: (connectionId?: string) => void) => void;
};

function hubBaseUrl(): string {
  const api = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
  // EXPO_PUBLIC_API_BASE_URL thường kết thúc bằng /api → hub ở gốc host
  return api.replace(/\/api\/?$/i, '');
}

/**
 * Kết nối SignalR sảnh bốc thăm.
 * Applicant bắt buộc truyền joinCode (OTP). Nếu chưa cài @microsoft/signalr → trả null.
 */
export async function connectLotteryLobby(
  projectId: string,
  handlers: {
    onLobbyCount?: (count: number) => void;
    onDrawResult?: (result: LiveDrawResult) => void;
    onLiveState?: (state: LotteryLiveState) => void;
    onStatus?: (status: string) => void;
    onSxdSupervisorCount?: (count: number) => void;
    onError?: (message: string) => void;
  },
  joinCode?: string | null,
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
      handlers.onDrawResult?.(mapLiveDraw(data));
    });
  }
  if (handlers.onLiveState) {
    connection.on('ReceiveLiveState', (data: unknown) => {
      handlers.onLiveState?.(mapLiveState(data));
    });
  }
  if (handlers.onStatus) {
    connection.on('ReceiveLotteryStatus', (status: string) => {
      handlers.onStatus?.(String(status ?? ''));
    });
  }
  if (handlers.onSxdSupervisorCount) {
    connection.on('ReceiveSxdSupervisorCount', (count: number) => {
      handlers.onSxdSupervisorCount?.(Number(count) || 0);
    });
  }

  const join = async () => {
    await connection.invoke('JoinProjectLobby', projectId, joinCode ?? null);
  };

  const raw = connection as HubConnection & {
    onreconnected: (cb: (connectionId?: string) => void) => void;
  };
  if (typeof raw.onreconnected === 'function') {
    raw.onreconnected(() => {
      void join().catch((err) =>
        handlers.onError?.(err?.message ?? 'Không rejoin được sảnh'),
      );
    });
  }

  try {
    await connection.start();
    await join();
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
