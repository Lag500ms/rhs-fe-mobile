/**
 * Mọi chuỗi hiện trên UI khi lỗi API phải đi qua đây.
 * Giữ message nghiệp vụ tiếng Việt từ BE; chặn copy dành cho dev
 * (Axios, ProblemDetails, exception, mã lỗi, HTTP status).
 */

const DEFAULT_USER_ERROR = 'Có lỗi xảy ra. Vui lòng thử lại.';

const VIETNAMESE_RE =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

const TECHNICAL_RE =
  /Request failed with status code|Network Error|timeout of \d+ms|One or more validation errors|AxiosError|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ENETUNREACH|ECONNABORTED|Callback failed|MISSING_PRIORITY_GROUP|ProblemDetails|TraceId|traceId|stack trace|errorCode|\[Field:|\(Mã:|^\[\d{3}\]|npm i |@microsoft\/signalr|websocket closed|WebSocket|HttpRequestException|NullReference|InvalidOperation|ArgumentNull|Object reference not set|SqlException|Npgsql|System\.|Microsoft\.|at [A-Z]\w+\.|Internal Server Error|Unsupported Media Type|www-authenticate|application\/json|Status code \d+|HTTP \d{3}/i;

const ENGLISH_STATUS_TITLES = new Set([
  'bad request',
  'unauthorized',
  'forbidden',
  'not found',
  'method not allowed',
  'conflict',
  'unprocessable entity',
  'too many requests',
  'internal server error',
  'bad gateway',
  'service unavailable',
  'gateway timeout',
]);

function hasVietnamese(text: string): boolean {
  return VIETNAMESE_RE.test(text);
}

function isTechnical(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (TECHNICAL_RE.test(trimmed)) return true;
  if (ENGLISH_STATUS_TITLES.has(trimmed.toLowerCase())) return true;
  if (/^error:\s/i.test(trimmed)) return true;
  if (trimmed.length > 280) return true;
  if (/\n\s+at\s+/.test(trimmed)) return true;
  return false;
}

function isUserFacingCopy(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || isTechnical(trimmed)) return false;
  return hasVietnamese(trimmed);
}

function flattenValidationErrors(errors: unknown): string[] {
  if (!errors || typeof errors !== 'object') return [];
  return Object.values(errors as Record<string, unknown>)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function collectCandidates(error: unknown): string[] {
  if (error == null) return [];
  if (typeof error === 'string') return [error];

  const err = error as {
    message?: unknown;
    response?: { data?: unknown; status?: number };
  };
  const data = err.response?.data;
  const out: string[] = [];

  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) out.push(value.trim());
  };

  if (typeof data === 'string') push(data);
  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    push(body.message);
    push(body.Message);
    push(body.detail);
    push(body.Detail);
    push(body.title);
    push(body.Title);
    flattenValidationErrors(body.errors ?? body.Errors).forEach(push);
  }

  push(err.message);
  return out;
}

function isNetworkError(error: unknown): boolean {
  if (error == null || typeof error === 'string') return false;
  const err = error as {
    response?: unknown;
    request?: unknown;
    code?: string;
    message?: string;
    isAxiosError?: boolean;
  };
  if (err.response) return false;
  if (err.code && /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ENETUNREACH|ECONNABORTED|ERR_NETWORK/i.test(err.code)) {
    return true;
  }
  if (typeof err.message === 'string' && /Network Error|timeout of \d+ms|ERR_NETWORK/i.test(err.message)) {
    return true;
  }
  if (err.isAxiosError && !err.response) return true;
  if (err.request && !err.response) return true;
  return false;
}

export function messageByStatus(status?: number, fallback = DEFAULT_USER_ERROR): string {
  if (status == null || status === 0) return fallback;
  if (status === 400 || status === 422) {
    return 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.';
  }
  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }
  if (status === 404) {
    return 'Không tìm thấy dữ liệu. Vui lòng thử lại.';
  }
  if (status === 409) {
    return 'Dữ liệu bị trùng hoặc xung đột. Vui lòng kiểm tra lại.';
  }
  if (status === 413) {
    return 'Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn.';
  }
  if (status === 429) {
    return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.';
  }
  if (status >= 500) {
    return 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
  }
  return fallback;
}

function statusFromError(error: unknown): number | undefined {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return typeof status === 'number' ? status : undefined;
}

/** Chuỗi từ BE / Error.message → copy người dùng. */
export function toUserErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_USER_ERROR,
): string {
  const safeFallback = fallback.trim() || DEFAULT_USER_ERROR;
  if (isNetworkError(error)) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  }
  for (const candidate of collectCandidates(error)) {
    if (isUserFacingCopy(candidate)) return candidate;
  }
  return messageByStatus(statusFromError(error), safeFallback);
}
