# rhs-fe-mobile

Ứng dụng React Native (Expo) cho **Resilience Housing Supply (RHS)** — phía **người dân (Applicant)** đăng ký mua nhà ở xã hội.

> Tài liệu nghiệp vụ chi tiết (BE + mobile): xem thêm `BUSINESS_FLOW.md` trong repo này và `../SEP490_Resilience_Housing_Supply_Backend/BUSINESS_FLOW.md`.  
> Cập nhật: 2026-07-13

---

## Phạm vi app

- Khám phá dự án NOXH, wishlist  
- eKYC (CCCD + face match)  
- Tạo / sửa hồ sơ, upload **2 giấy tờ bắt buộc**, nộp hồ sơ  
- Theo dõi trạng thái, thanh toán đặt cọc VNPay  
- Xem **hợp đồng nguyên tắc** và kết quả bốc thăm (nếu BE trả)  
- Thông báo, báo cáo sự cố, tài khoản  

**Không** làm UI CĐT/SXD/Admin (nằm ở web). AI thẩm định giấy tờ là **trợ lý phía CĐT trên web/BE** — mobile không bắt buộc chờ AI để nộp.

---

## Giấy tờ & form (khớp BE)

Bắt buộc đủ 2 PDF trước khi nộp:

1. `POVERTY_HOUSEHOLD_CERTIFICATE` — Giấy chứng nhận hộ nghèo / cận nghèo  
2. `HOUSING_CONDITION_PROOF` — Giấy xác nhận nhà ở  

Thực trạng nhà ở trên form:

| Value | Ý nghĩa |
|---|---|
| `NO_HOUSE` | Chưa có nhà thuộc sở hữu (Đ29.1) |
| `SMALL_HOUSE` | Có nhà, diện tích bình quân &lt; 15 m²/người (Đ29.2) |

Đối tượng: `URBAN_POOR` / `URBAN_NEAR_POOR` (Đ30.3 — không nhập thu nhập 15/30 triệu).

Thông tin định danh (họ tên, CCCD, địa chỉ) **khóa từ eKYC**; sau eKYC profile chỉ cho sửa SĐT.

---

## Luồng người dân (tóm tắt)

```
eKYC → Chọn dự án → DRAFT (form)
  → Upload 2 giấy tờ
  → Nộp SUBMITTED
  → (CĐT / SXD xử lý trên web)
  → APPROVED → Đặt cọc VNPay (trong hạn policy)
  → DEPOSIT_PAID + HĐ nguyên tắc + mã tham dự bốc thăm
  → Chờ bốc thăm (WON / PRIORITY_WON / LOST)
```

- Đặt cọc = **đủ điều kiện tham gia bốc thăm**, không phải đã giữ căn.  
- HĐ nguyên tắc = cam kết tham gia phân suất; HĐ mua bán chính thức sau khi trúng (ngoài scope mobile hiện tại).

Trạng thái chính:  
`DRAFT → SUBMITTED → REVIEWING → NEED_MORE_DOCUMENTS → PENDING_SXD_REVIEW → APPROVED → DEPOSIT_PAID`  
(+ `REJECTED`, `CANCELED`, `EXPIRED`).

---

## Tech

| | |
|---|---|
| Framework | React Native + Expo |
| Language | TypeScript |
| Navigation | React Navigation |
| HTTP | Axios (`src/lib/apiClient.ts`) |
| Payment UI | WebView VNPay |
| PDF | WebView / download |

Chi tiết cấu trúc thư mục: [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).

---

## Chạy local

```bash
npm install
# Cấu hình EXPO_PUBLIC_API_BASE_URL trỏ về RHS.API
npx expo start
```

---

## Ghi chú cho AI / dev

- Không chặn nộp vì `VerificationStatus` AI trên mobile (CĐT chạy AI khi tiếp nhận).  
- Gate nộp: đủ 2 loại giấy + form hợp lệ (BE cũng validate).  
- Copy UX: tránh “giữ chỗ/giữ căn” sau duyệt — dùng “tham gia bốc thăm”.  
- Không sửa web trong phạm vi tài liệu mobile này.
