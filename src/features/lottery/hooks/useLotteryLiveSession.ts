import { useCallback, useEffect, useRef, useState } from 'react';
import { lotteryApi } from '../api/lotteryApi';
import { connectLotteryLobby, leaveLotteryLobby } from '../api/lotteryHub';
import {
  getRememberedLotteryJoinCode,
  rememberLotteryJoinCode,
} from '../api/joinCodeCache';
import {
  LOTTERY_RESULT_LABEL,
  LOTTERY_SESSION_LABEL,
  unitPendingLabel,
  type LiveDrawResult,
  type LotteryLiveState,
  type LotteryScheduleDetail,
} from '../types/lottery';

function logLineFromDraw(r: LiveDrawResult): string {
  const code = r.applicationCode || r.applicationId.slice(0, 8).toUpperCase();
  const result = LOTTERY_RESULT_LABEL[r.result] ?? r.result;
  return `${code} · ${r.applicantName || 'Hồ sơ'} · ${result} · ${unitPendingLabel(r.slotCode)}`;
}

export function useLotteryLiveSession(projectId: string, applicationId?: string) {
  const [schedule, setSchedule] = useState<LotteryScheduleDetail | null>(null);
  const [live, setLive] = useState<LotteryLiveState | null>(null);
  const [otp, setOtp] = useState('');
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [lobbyCount, setLobbyCount] = useState(0);
  const [sxdCount, setSxdCount] = useState(0);
  const [sessionStatus, setSessionStatus] = useState('');
  const [hubStatus, setHubStatus] = useState('Chưa vào sảnh');
  const [hubOk, setHubOk] = useState(false);
  const [useRestMode, setUseRestMode] = useState(false);
  const [myResult, setMyResult] = useState<LiveDrawResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const hubRef = useRef<Awaited<ReturnType<typeof connectLotteryLobby>>>(null);
  const cancelledRef = useRef(false);
  const joiningRef = useRef(false);

  const pushLog = useCallback((line: string) => {
    setLogs((prev) => [line, ...prev].slice(0, 40));
  }, []);

  const applyLive = useCallback(
    (state: LotteryLiveState) => {
      setLive(state);
      if (state.sessionStatus) setSessionStatus(state.sessionStatus);
      if (typeof state.sxdOnlineCount === 'number') setSxdCount(state.sxdOnlineCount);
      if (typeof state.lobbyCount === 'number') setLobbyCount(state.lobbyCount);
      if (applicationId) {
        const mine =
          state.recentWinners.find((w) => w.applicationId === applicationId) ??
          (state.latestDrawResult?.applicationId === applicationId
            ? state.latestDrawResult
            : null);
        if (mine) setMyResult(mine);
      }
    },
    [applicationId],
  );

  const loadSchedule = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await lotteryApi.getSchedule(projectId);
      setSchedule(data);
      if (data.sessionStatus) setSessionStatus(data.sessionStatus);
      if (typeof data.sxdOnlineCount === 'number') setSxdCount(data.sxdOnlineCount);
      if (typeof data.lobbyCount === 'number') setLobbyCount(data.lobbyCount);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không tải được lịch.');
    }
  }, [projectId]);

  const loadLive = useCallback(async () => {
    if (!projectId) return;
    try {
      const state = await lotteryApi.getLiveState(projectId);
      applyLive(state);
      setError('');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400 || status === 404) return;
      setError(err?.response?.data?.message || err?.message || 'Không tải được sảnh.');
    }
  }, [projectId, applyLive]);

  const disconnect = useCallback(async () => {
    await leaveLotteryLobby(hubRef.current, projectId);
    hubRef.current = null;
    setHubOk(false);
  }, [projectId]);

  const joinWithCode = useCallback(
    async (code: string) => {
      if (!projectId || joiningRef.current) return false;
      const trimmed = code.trim();
      if (trimmed.length < 6) {
        setError('Nhập mã xác thực 6 số từ thông báo sau khi Sở duyệt lịch.');
        return false;
      }
      joiningRef.current = true;
      setJoining(true);
      setError('');
      setHubStatus('Đang xác thực mã...');
      try {
        const verified = await lotteryApi.verifyOtp(projectId, trimmed);
        if (!verified.success) {
          throw new Error(verified.message || 'Mã xác thực không hợp lệ');
        }
        rememberLotteryJoinCode(projectId, trimmed);
        if (verified.sessionStatus) setSessionStatus(verified.sessionStatus);

        await disconnect();
        setHubStatus('Đang kết nối sảnh...');
        const conn = await connectLotteryLobby(
          projectId,
          {
            onLobbyCount: (c) => {
              if (!cancelledRef.current) setLobbyCount(c);
            },
            onSxdSupervisorCount: (c) => {
              if (!cancelledRef.current) setSxdCount(c);
            },
            onStatus: (s) => {
              if (cancelledRef.current) return;
              setSessionStatus(s);
              const label = LOTTERY_SESSION_LABEL[s] ?? s;
              pushLog(`Phiên: ${label}`);
            },
            onLiveState: (state) => {
              if (!cancelledRef.current) applyLive(state);
            },
            onDrawResult: (r) => {
              if (cancelledRef.current) return;
              pushLog(logLineFromDraw(r));
              if (applicationId && r.applicationId === applicationId) {
                setMyResult(r);
              }
              void loadLive();
            },
            onError: (msg) => {
              if (cancelledRef.current) return;
              setHubOk(false);
              setUseRestMode(true);
              setHubStatus(msg.includes('signalr') ? 'Chế độ REST' : msg);
            },
          },
          trimmed,
        );

        if (cancelledRef.current) {
          await leaveLotteryLobby(conn, projectId);
          return false;
        }

        hubRef.current = conn;
        const rest = !conn;
        setUseRestMode(rest);
        setJoined(true);
        setHubOk(!!conn);
        setHubStatus(conn ? 'Đã vào sảnh (trực tuyến)' : 'Chế độ REST (không SignalR)');
        await loadLive();
        await loadSchedule();
        return true;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          'Không vào được sảnh';
        setHubStatus(msg);
        setError(msg);
        return false;
      } finally {
        joiningRef.current = false;
        setJoining(false);
      }
    },
    [projectId, disconnect, applyLive, pushLog, applicationId, loadLive, loadSchedule],
  );

  const handleJoin = useCallback(() => joinWithCode(otp), [joinWithCode, otp]);

  useEffect(() => {
    cancelledRef.current = false;
    void loadSchedule();
    const remembered = getRememberedLotteryJoinCode(projectId);
    if (remembered) {
      setOtp(remembered);
      void joinWithCode(remembered);
    }
    return () => {
      cancelledRef.current = true;
      joiningRef.current = false;
      void leaveLotteryLobby(hubRef.current, projectId);
      hubRef.current = null;
    };
    // Chỉ gắn phiên theo projectId — không phụ thuộc joinWithCode để tránh vòng lặp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!joined) return;
    let cancelled = false;
    const tick = async () => {
      try {
        await loadLive();
        if (!cancelled) await loadSchedule();
      } catch {
        /* quiet */
      }
    };
    const id = setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [joined, loadLive, loadSchedule]);

  return {
    schedule,
    live,
    otp,
    setOtp,
    joined,
    joining,
    lobbyCount,
    sxdCount,
    sessionStatus,
    hubStatus,
    hubOk,
    useRestMode,
    myResult,
    logs,
    error,
    setError,
    loadSchedule,
    loadLive,
    handleJoin,
    joinWithCode,
  };
}
