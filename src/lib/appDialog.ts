import { toUserErrorMessage } from './userError';

export { toUserErrorMessage };

export type AppDialogButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AppDialogRequest = {
  title: string;
  message?: string;
  buttons: AppDialogButton[];
};

type Listener = (current: AppDialogRequest | null) => void;

let listener: Listener | null = null;
const queue: AppDialogRequest[] = [];
let showing = false;

function emit() {
  listener?.(showing ? queue[0] ?? null : null);
}

export function bindAppDialog(fn: Listener | null) {
  listener = fn;
  emit();
}

export function appAlert(
  title: string,
  message?: string,
  buttons?: AppDialogButton[],
) {
  const resolved =
    buttons && buttons.length > 0 ? buttons : [{ text: 'Đồng ý' }];
  queue.push({ title, message, buttons: resolved });
  if (!showing) {
    showing = true;
    emit();
  }
}

/** Alert lỗi API: luôn hiện copy người dùng, không lộ message kỹ thuật. */
export function appErrorAlert(
  title: string,
  error: unknown,
  fallback?: string,
  buttons?: AppDialogButton[],
) {
  appAlert(title, toUserErrorMessage(error, fallback), buttons);
}

export function dismissAppDialog() {
  queue.shift();
  showing = queue.length > 0;
  emit();
}

/** Dùng khi cần await xác nhận: true = bấm nút không phải cancel. */
export function appConfirm(opts: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    appAlert(opts.title, opts.message, [
      { text: opts.cancelText ?? 'Hủy', style: 'cancel', onPress: () => resolve(false) },
      {
        text: opts.confirmText ?? 'Xác nhận',
        style: opts.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
