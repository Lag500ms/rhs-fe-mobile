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
  opts?: { needMoreNote?: string | null },
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
        body: 'Chờ chủ đầu tư cấp nhà trực tiếp hoặc tổ chức bốc thăm rồi cấp suất. Sau khi có suất, bạn sẽ đóng cọc.',
        tone: 'info',
      };
    case 'DEPOSIT_PENDING':
      return {
        title: 'Việc tiếp theo: đóng tiền cọc',
        body: 'Bạn đã được cấp suất. Đóng cọc để giữ suất, sau đó mới ký hợp đồng.',
        tone: 'action',
      };
    case 'CONTRACT_PENDING':
      return {
        title: 'Việc tiếp theo: ký hợp đồng',
        body: 'Đọc kỹ và ký hợp đồng mua bán. Các khoản còn lại sẽ hiện trên lịch thanh toán sau khi ký.',
        tone: 'action',
      };
    case 'CONTRACT_SIGNED':
    case 'INSTALLMENT_IN_PROGRESS':
    case 'DEPOSIT_PAID':
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
        body: 'Bạn có thể xem kết quả bốc thăm để biết chi tiết.',
        tone: 'danger',
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
        body: 'Quá hạn đóng cọc hoặc ký hợp đồng. Hãy tạo hồ sơ mới nếu muốn tiếp tục.',
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
