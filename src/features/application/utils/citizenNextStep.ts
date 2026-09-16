/**
 * Copy “việc tiếp theo” cho người dân — giọng ngắn, không jargon BE.
 */

export type CitizenNextStep = {
  title: string;
  body: string;
  tone: 'info' | 'action' | 'warn' | 'success' | 'danger';
};

export function getCitizenNextStep(
  status: string,
  opts?: {
    needMoreNote?: string | null;
    hasApartment?: boolean;
    depositPaid?: boolean;
    waitlistNumber?: number | null;
    depositDeadline?: string | null;
  },
): CitizenNextStep | null {
  const s = (status || '').toUpperCase();

  switch (s) {
    case 'DRAFT':
      return {
        title: 'Hồ sơ chưa nộp',
        body: 'Hoàn tất giấy tờ và nộp để chủ đầu tư tiếp nhận.',
        tone: 'action',
      };
    case 'SUBMITTED':
      return {
        title: 'Đã gửi hồ sơ',
        body: 'Chờ chủ đầu tư tiếp nhận hồ sơ. Bạn không cần làm thêm gì lúc này.',
        tone: 'info',
      };
    case 'REVIEWING':
      return {
        title: 'Chủ đầu tư đã tiếp nhận',
        body: 'Hồ sơ đang được thẩm định. Nếu thiếu giấy tờ, bạn sẽ nhận yêu cầu bổ sung.',
        tone: 'info',
      };
    case 'NEED_MORE_DOCUMENTS':
      return {
        title: 'Cần bổ sung giấy tờ',
        body:
          opts?.needMoreNote?.trim() ||
          'Chủ đầu tư yêu cầu bổ sung. Cập nhật giấy tờ rồi nộp lại hồ sơ.',
        tone: 'warn',
      };
    case 'PENDING_SXD_REVIEW':
      return {
        title: 'Sở Xây dựng đã tiếp nhận',
        body: 'Hồ sơ đang ở Sở. Sở duyệt hoặc từ chối — không yêu cầu bổ sung từ bước này.',
        tone: 'info',
      };
    case 'APPROVED':
    case 'APPROVED_BY_TIMEOUT':
      return {
        title: 'Đã duyệt — chờ chốt suất',
        body: 'Chờ chủ đầu tư cấp nhà trực tiếp hoặc tổ chức bốc thăm rồi cấp suất. Khi đã có suất, bạn đóng Đợt 1 (thanh toán lần đầu, gồm đặt cọc).',
        tone: 'info',
      };
    case 'LOTTERY_WON':
      return {
        title: 'Đã trúng — chờ chốt suất',
        body: 'Bạn đã trúng suất. Chủ đầu tư sẽ chọn căn hộ cụ thể. Khi đã có căn, bạn đóng Đợt 1 rồi mới ký hợp đồng.',
        tone: 'info',
      };
    case 'DEPOSIT_PENDING':
      if (opts?.depositPaid === true) {
        return {
          title: 'Việc tiếp theo: ký hợp đồng',
          body: 'Đã đóng Đợt 1. Đọc kỹ và ký hợp đồng mua bán. Đợt 2 sẽ mở trên lịch thanh toán sau khi ký.',
          tone: 'action',
        };
      }
      return {
        title: 'Việc tiếp theo: đóng Đợt 1',
        body: opts?.depositDeadline
          ? `Bạn được đôn từ danh sách chờ. Vui lòng xác nhận và đóng Đợt 1 trước ${new Date(opts.depositDeadline).toLocaleString('vi-VN')}.`
          : 'Bạn đã được cấp suất. Đóng Đợt 1 (thanh toán lần đầu, gồm đặt cọc) để giữ suất, sau đó mới ký hợp đồng.',
        tone: 'action',
      };
    case 'CONTRACT_PENDING':
      if (opts?.hasApartment === false) {
        return {
          title: 'Đã trúng — chờ chủ đầu tư chọn căn',
          body: 'Bạn đã có suất. Khi chủ đầu tư gán căn cụ thể, bạn đóng Đợt 1 rồi mới ký hợp đồng.',
          tone: 'info',
        };
      }
      if (opts?.depositPaid !== true) {
        return {
          title: 'Việc tiếp theo: đóng Đợt 1',
          body: 'Bạn đã được cấp căn. Đóng Đợt 1 (thanh toán lần đầu, gồm đặt cọc) trước, sau đó mới ký hợp đồng. Đợt 2 mở sau khi ký.',
          tone: 'action',
        };
      }
      return {
        title: 'Việc tiếp theo: ký hợp đồng',
        body: 'Đã đóng Đợt 1. Đọc kỹ và ký hợp đồng mua bán. Đợt 2 sẽ mở trên lịch thanh toán sau khi ký.',
        tone: 'action',
      };
    case 'DEPOSIT_PAID':
      return {
        title: 'Việc tiếp theo: ký hợp đồng',
        body: 'Đã đóng Đợt 1. Đọc kỹ và ký hợp đồng mua bán. Đợt 2 sẽ mở trên lịch thanh toán sau khi ký.',
        tone: 'action',
      };
    case 'CONTRACT_SIGNED':
    case 'INSTALLMENT_IN_PROGRESS':
      return {
        title: 'Đã ký hợp đồng',
        body: 'Xem lịch thanh toán để biết khoản nào đang mở. Các đợt theo tiến độ do chủ đầu tư thông báo.',
        tone: 'success',
      };
    case 'FULLY_PAID':
      return {
        title: 'Đã hoàn tất thanh toán',
        body: 'Các khoản trên lịch đã đóng đủ.',
        tone: 'success',
      };
    case 'LOTTERY_LOST':
      return {
        title: 'Không trúng suất lần này',
        body: opts?.waitlistNumber
          ? `Hồ sơ được xếp danh sách chờ thứ ${opts.waitlistNumber}. Nếu có căn trả lại, hệ thống sẽ chuyển quyền mua cho bạn.`
          : 'Bạn có thể xem kết quả bốc thăm để biết chi tiết.',
        tone: opts?.waitlistNumber ? 'warn' : 'danger',
      };
    case 'WAITLIST':
      return {
        title: opts?.waitlistNumber
          ? `Danh sách chờ — thứ hạng ${opts.waitlistNumber}`
          : 'Đã vào danh sách chờ',
        body: opts?.depositDeadline
          ? `Hồ sơ không bị hủy. Khi có căn trả lại, người đứng đầu danh sách được nhận quyền mua. Hạn xác nhận: ${new Date(opts.depositDeadline).toLocaleString('vi-VN')}.`
          : 'Hồ sơ không bị hủy. Khi có căn trả lại, người đứng đầu danh sách được nhận quyền mua và phải xác nhận trong thời hạn hệ thống thông báo.',
        tone: 'warn',
      };
    case 'CANCELLATION_REQUESTED':
      return {
        title: 'Đã gửi đơn xin ngừng thanh toán',
        body: 'Chủ đầu tư đang xét đơn. Nếu chấp thuận, tiền đặt cọc trong Đợt 1 bị trừ; các khoản đã đóng sau đó được hoàn sau khi khấu trừ lãi phạt (nếu có).',
        tone: 'warn',
      };
    case 'REJECTED':
      return {
        title: 'Hồ sơ bị từ chối',
        body: 'Xem lý do bên dưới. Bạn có thể đăng ký dự án khác nếu đủ điều kiện.',
        tone: 'danger',
      };
    case 'EXPIRED':
      return {
        title: 'Hồ sơ đã hết hạn',
        body: 'Quá hạn đóng Đợt 1 hoặc ký hợp đồng. Hãy tạo hồ sơ mới nếu muốn tiếp tục.',
        tone: 'danger',
      };
    case 'CANCELED':
      return {
        title: 'Hồ sơ đã hủy',
        body: 'Hồ sơ này không còn hiệu lực.',
        tone: 'danger',
      };
    default:
      return null;
  }
}
