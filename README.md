# rhs-fe-mobile

Ứng dụng React Native (Expo) — phía **người dân** của nền tảng **Resilience Housing Supply (RHS)** (đăng ký mua nhà ở xã hội).

| Tài liệu | Nội dung |
|---|---|
| [`BUSINESS_FLOW.md`](./BUSINESS_FLOW.md) | Quy trình nghiệp vụ phía Applicant (giấy tờ, trạng thái, đặt cọc, bốc thăm) |
| [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | Kiến trúc thư mục, navigation, API, coding standards |
| Backend [`BUSINESS_FLOW.md`](../SEP490_Resilience_Housing_Supply_Backend/BUSINESS_FLOW.md) | Nguồn sự thật nghiệp vụ toàn hệ thống (Đ29–30, Đ38, Đ44, hướng A, AI trợ lý CĐT) |

**Cập nhật:** 2026-08-02

---

## Chạy nhanh

```bash
npm install
# Đặt EXPO_PUBLIC_API_BASE_URL trong .env trỏ tới RHS.API
npx expo start
```

## Phạm vi

- eKYC (**VNPT**: OCR CCCD + Face Match; không dùng Liveness)
- Hồ sơ đăng ký mua NOXH (giấy tờ theo nhóm đối tượng Đ76), nộp, theo dõi trạng thái
- Đặt cọc / đợt thanh toán VNPay, HĐ nguyên tắc, thông báo, wishlist, lottery lobby
- **Không** gồm UI CĐT / SXD / Admin (dùng **CAP/FE** web)
- AI quét giấy tờ = trợ lý thẩm định **cho CĐT** trên BE/web — mobile không bắt chờ AI để nộp
