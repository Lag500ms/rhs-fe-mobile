import { Platform } from 'react-native';
import { API_BASE_URL } from '../../../lib/apiConfig';
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
  onreconnected: (cb: (connectionId?: string) => void) => void;
  onreconnecting: (cb: (error?: Error) => void) => void;
  onclose: (cb: (error?: Error) => void) => void;
};

function hubBaseUrl(): string {
  return API_BASE_URL.replace(/\/api\/?$/i, '');
}

function isWsDropNoise(message?: string): boolean {
  return /1006|websocket closed|connection disconnected/i.test(message ?? '');
}

/**
 * Kết nối SignalR sảnh bốc thăm.
 * Applicant bắt buộc truyền joinCode (OTP). Nếu chưa cài @microsoft/signalr → trả null.
 *
 * Trên native, WebSocket hay rớt 1006 (không handshake/proxy). Dùng Long Polling
 * làm vận chuyển chính; web vẫn ưu tiên WebSocket rồi fallback.
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
      'Không kết nối được sảnh trực tuyến. Đang dùng chế độ dự phòng.',
    );
    return null;
  }

  const url = `${hubBaseUrl()}/hubs/lottery`;
  const longPolling = signalR.HttpTransportType.LongPolling;
  const wsAndLp =
    signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling;
  const transport = Platform.OS === 'web' ? wsAndLp : longPolling;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: async () => (await getToken()) ?? '',
      transport,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging({
      log: (level, message) => {
        if (isWsDropNoise(message)) return;
        if (level >= signalR.LogLevel.Error) {
          console.warn('[LotteryHub]', message);
        }
      },
    })
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

  connection.onreconnecting((err) => {
    if (isWsDropNoise(err?.message)) return;
    handlers.onStatus?.('Đang kết nối lại sảnh...');
  });
  connection.onreconnected(() => {
    void join().catch(() =>
      handlers.onError?.('Không vào lại được sảnh. Đang dùng chế độ dự phòng.'),
    );
  });
  connection.onclose((err) => {
    if (!err) return;
    if (isWsDropNoise(err.message)) {
      handlers.onError?.('Mất kết nối sảnh. Đang dùng chế độ dự phòng.');
      return;
    }
    handlers.onError?.('Mất kết nối sảnh. Đang dùng chế độ dự phòng.');
  });

  try {
    await connection.start();
    await join();
    return connection;
  } catch {
    if (transport !== longPolling) {
      try {
        await connection.stop();
      } catch {
        /* ignore */
      }
      return connectLotteryLobbyLongPolling(signalR, url, projectId, joinCode, handlers);
    }
    handlers.onError?.('Không kết nối được sảnh trực tuyến. Đang dùng chế độ dự phòng.');
    try {
      await connection.stop();
    } catch {
      /* ignore */
    }
    return null;
  }
}

async function connectLotteryLobbyLongPolling(
  signalR: typeof import('@microsoft/signalr'),
  url: string,
  projectId: string,
  joinCode: string | null | undefined,
  handlers: Parameters<typeof connectLotteryLobby>[1],
): Promise<HubConnection | null> {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: async () => (await getToken()) ?? '',
      transport: signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging({
      log: (level, message) => {
        if (isWsDropNoise(message)) return;
        if (level >= signalR.LogLevel.Error) console.warn('[LotteryHub]', message);
      },
    })
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
  connection.onreconnected(() => {
    void join().catch(() =>
      handlers.onError?.('Không vào lại được sảnh. Đang dùng chế độ dự phòng.'),
    );
  });

  try {
    await connection.start();
    await join();
    return connection;
  } catch {
    handlers.onError?.('Không kết nối được sảnh trực tuyến. Đang dùng chế độ dự phòng.');
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
