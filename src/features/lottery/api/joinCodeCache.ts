/** OTP đã xác thực trong phiên app — để màn Live join Hub mà không nhập lại. */
const codes = new Map<string, string>();

export function rememberLotteryJoinCode(projectId: string, joinCode: string) {
  const id = projectId.trim();
  const code = joinCode.trim();
  if (id && code) codes.set(id, code);
}

export function getRememberedLotteryJoinCode(projectId: string): string | null {
  return codes.get(projectId.trim()) ?? null;
}
