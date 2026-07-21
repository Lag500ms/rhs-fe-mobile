# Đối chiếu Flow bắt buộc ↔ Backend thật ↔ Mobile — Phân tích Gap

> Mục đích: chốt luồng nghiệp vụ **bắt buộc phải theo**, đối chiếu với **API backend hiện có**, chỉ ra **khoảng trống (gap)** để (a) gửi team BE bổ sung và (b) làm cơ sở cho kế hoạch mobile.
>
> Nguyên tắc mobile đã thống nhất: **bám flow bắt buộc**; bước nào BE **chưa có API** thì mobile **mock có nhãn rõ ràng** ("Dữ liệu mô phỏng / chờ BE"), nối API thật khi BE sẵn sàng. **Không chỉnh sửa BE** trong phạm vi hiện tại.
>
> Nguồn: rà soát code `SEP490_Resilience_Housing_Supply_Backend` (controllers, services, background services, DTOs) và `rhs-fe-mobile`.

---

## 1. Vòng đời bắt buộc (canonical)

```
xem dự án → nộp hồ sơ → duyệt (CĐT) → xác minh (Sở)
→ (vượt số căn) BỐC THĂM → nếu TRÚNG → KÝ HỢP ĐỒNG → THANH TOÁN → hoàn tất → hậu kiểm
```

Thứ tự cốt lõi bắt buộc: **BỐC THĂM → KÝ HỢP ĐỒNG → THANH TOÁN**.

---

## 2. Khác biệt LỚN NHẤT: thứ tự Thanh toán vs Bốc thăm

| | Thứ tự |
|---|---|
| **Flow bắt buộc** | Duyệt → **Bốc thăm** → nếu trúng → Ký HĐ → **Thanh toán** |
| **BE hiện tại** | Duyệt (`APPROVED`) → **Thanh toán cọc** (`DEPOSIT_PAID`) → **Bốc thăm** (chạy trên hồ sơ `DEPOSIT_PAID`) |

➡️ BE đang **ngược thứ tự**: bắt cọc trước rồi mới bốc thăm. Đây là điểm chặn cứng, mobile **không thể** tự sửa — cần BE đổi logic (bốc thăm chạy trên `APPROVED`, thanh toán sau khi `WON`).

---

## 3. Đối chiếu chi tiết — Flow Applicant

| # | Bước bắt buộc | BE thật (endpoint/logic) | Mobile hiện tại | Gap | Kế hoạch mobile |
|---|---|---|---|---|---|
| 1 | Xem danh sách dự án | `GET /api/HousingProjects` (public; status `OPEN`) | `HomeScreen` (lọc OPEN, card grid) | — | ✅ API thật |
| 2 | Chi tiết dự án | `GET /api/HousingProjects/{id}` (`AvailableUnits`) | `HousingProjectDetailScreen` | — | ✅ API thật |
| 3 | Tạo hồ sơ (thông tin cá nhân) | `POST /api/housing-applications` → `DRAFT` | `BasicInformationScreen` | — | ✅ API thật |
| 4 | Thông tin hộ gia đình | **Chỉ có `HouseholdMembersCount`** (không có CRUD thành viên) | (nhập số lượng trong wizard) | ❌ BE thiếu CRUD thành viên (họ tên/CCCD/quan hệ) | ⚠️ Mock danh sách thành viên (nhãn chờ BE) |
| 5 | Chọn nhóm đối tượng | `PriorityGroup` (`URBAN_POOR`/`URBAN_NEAR_POOR`) | trong wizard | — | ✅ API thật |
| 6 | Upload giấy tờ bắt buộc | `POST /api/housing-applications/{id}/documents` (PDF) | `UploadDocumentsScreen` | — | ✅ API thật |
| 7 | Soát lại + Submit | `POST /api/housing-applications/{id}/submit` → `SUBMITTED` | `ReviewSubmitScreen` | Chặn nộp trùng (Case 8) xảy ra **ở submit**, không phải khi chọn dự án | ✅ API thật |
| 8 | Biên nhận điện tử | PDF QuestPDF, `ReceiptUrl` (mã = GUID, **không có mộc đỏ**) | hiển thị trong Chi tiết hồ sơ | Không có "số biên nhận" riêng | ✅ API thật |
| 9 | Theo dõi trạng thái (Timeline) | `GET /api/housing-applications/{id}` (`ReviewHistories`) | `ApplicationDetailScreen` | Chưa có timeline stepper trực quan | 🟡 Nâng cấp UI stepper (API thật) |
| 10 | Bổ sung khi bị yêu cầu | CĐT `developer-review` → `NEED_MORE_DOCUMENTS`; upload lại + submit | `ApplicationDetailScreen` (lý do + CTA) + `UploadDocumentsScreen` | — | ✅ API thật |
| 11 | Rút hồ sơ (Case 9) | `PATCH /api/housing-applications/{id}/cancel` → `CANCELED` | `WithdrawApplicationScreen` | — | ✅ API thật |
| 12 | Chờ duyệt CĐT → gửi Sở → Sở xác minh | `submit-to-department` (REVIEWING→PENDING_SXD_REVIEW); `sxd-review` APPROVE/REJECT | theo dõi qua Chi tiết hồ sơ | Sở chỉ APPROVE/REJECT, **không có "gắn cờ vi phạm/Case 5"** | ✅ API thật (theo dõi) |
| 13 | **Bốc thăm (nếu vượt số căn)** | `POST /projects/{id}/lottery/run` (REST, CĐT) trên `DEPOSIT_PAID`; `GET .../result` | (chưa có màn) | ❌ Không có **phòng chờ live/SignalR/OTP**; ❌ **sai thứ tự** (cọc trước) | ⚠️ Mock phòng chờ + quay số (nhãn chờ BE); có thể đọc `GET result` khi có |
| 14 | **Nếu trúng → Ký hợp đồng** | Hợp đồng PDF tạo **sau khi cọc**; **không có API ký** | (chưa có màn ký) | ❌ BE thiếu API ký (sign/OTP); hợp đồng gắn với cọc, không gắn với "trúng" | ⚠️ Xem PDF: API thật (`download-contract`); **Ký: mock OTP** (nhãn chờ BE) |
| 15 | **Thanh toán** | Cọc VNPay **1 đợt** (`create-payment-url` → callback → `DEPOSIT_PAID`) | `PaymentWebView`/`Processing`/`Success` | ❌ Không có **lịch nhiều đợt** (đợt 1/2); ❌ sai vị trí trong flow | ⚠️ Cọc: API thật; **lịch trả góp: mock** (nhãn chờ BE) |
| 16 | Hoàn tất | Status dừng ở `DEPOSIT_PAID` (+ `LotteryResult`) | Chi tiết hồ sơ | ❌ Không có `Contract Signed`/`Payment Pending`/`Finalized` | 🟡 Hiển thị theo status BE thật |
| 17 | Hộp thư thông báo | `GET /api/Notification/my`, read/read-all | `NotificationListScreen` | — | ✅ API thật |
| 18 | Danh sách công khai cuối (hậu kiểm) | `GET /api/beneficiaries` **chỉ cho cán bộ** | (chưa có màn) | ❌ Không có API public | ⚠️ Mock danh sách công khai (nhãn chờ BE) |
| 19 | Trợ giúp & FAQ | (nội dung tĩnh) | `FaqScreen` | — | ✅ Tĩnh |

Chú thích: ✅ nối API thật · 🟡 làm bằng API thật nhưng cần nâng UI · ⚠️ mock có nhãn tới khi BE bổ sung · ❌ gap BE.

---

## 4. Bản đồ trạng thái: Flow bắt buộc ↔ BE thật

| Nhãn trong flow bắt buộc | StatusCode BE thật | Ghi chú |
|---|---|---|
| Draft | `DRAFT` | ✅ |
| Submitted | `SUBMITTED` | ✅ |
| Waiting Review | `REVIEWING` | tên khác |
| Need Additional | `NEED_MORE_DOCUMENTS` | ✅ |
| Valid by Developer | *(không có)* | BE dùng `REVIEWING` → `submit-to-department` |
| Sent to Department | `PENDING_SXD_REVIEW` | ✅ (tên khác) |
| Under Verification | `PENDING_SXD_REVIEW` | trùng trạng thái trên |
| Approved Candidate | `APPROVED` | ✅ (tên khác) |
| Lottery Pending | *(không có status riêng)* | dùng `LotteryResult = PENDING` |
| Won / Lost | `LotteryResult = WON/PRIORITY_WON / LOST` | field riêng, không phải app status |
| Contracting | *(không có)* | — |
| Contract Signed | *(không có)* | ❌ BE thiếu ký HĐ |
| Payment Pending | *(không có)* | BE: `APPROVED` chờ cọc |
| Paid | `DEPOSIT_PAID` | ✅ (tên khác, chỉ 1 đợt) |
| Finalized | *(không có)* | ❌ |

Thêm trạng thái BE có nhưng flow bắt buộc không nêu: `REJECTED`, `CANCELED`, `EXPIRED` (tự hết hạn cọc 24h).

---

## 5. Danh sách BE CẦN BỔ SUNG/SỬA (gửi team BE)

Ưu tiên theo mức chặn flow bắt buộc:

| Ưu tiên | Hạng mục | Hiện trạng BE | Yêu cầu để khớp flow bắt buộc |
|---|---|---|---|
| 🔴 P0 | **Thứ tự bốc thăm/thanh toán** | Bốc thăm chạy trên `DEPOSIT_PAID` (cọc trước) | Bốc thăm chạy trên `APPROVED`; **thanh toán SAU khi `WON`** |
| 🔴 P0 | **Ký hợp đồng** | Chỉ tạo PDF sau cọc, không có trạng thái ký | API `sign` (+ OTP) + field `SignedAt`/`Status` trên `PrincipleAgreement`; chỉ mở sau `WON` |
| 🔴 P0 | **Lịch thanh toán nhiều đợt** | Chỉ 1 đợt cọc | Entity/endpoint installments (cọc/đợt 1/đợt 2) + trạng thái paid/unpaid/overdue |
| 🟠 P1 | **Bốc thăm LIVE** | REST `run`/`result` (đồng bộ) | SignalR Hub (phòng chờ, đếm ngược, broadcast), `SemaphoreSlim` chống trúng trùng, `ReceiveDrawResult` |
| 🟠 P1 | **Sở gắn cờ vi phạm (Case 5)** | Chỉ APPROVE/REJECT | Action "mark ineligible/flag" + lý do loại |
| 🟡 P2 | **Danh sách công khai cuối** | `beneficiaries` chỉ cho cán bộ | Endpoint **public** (ẩn danh) cho tra cứu người trúng |
| 🟡 P2 | **Thành viên hộ gia đình** | Chỉ `HouseholdMembersCount` | CRUD thành viên (họ tên/CCCD/quan hệ) phục vụ đối chiếu chéo |
| 🟢 P3 | **Announcement, Export PDF/Excel** | Chưa có | (không bắt buộc cho mobile Applicant) |

Đối chiếu bảng task BE bạn cung cấp (điểm ghi SAI so với code):
- **#17 Sở quyết định** ("đang làm"): thực tế chỉ có APPROVE/REJECT, **chưa có gắn cờ Case 5**.
- **#18 Timeout Cron** ("chưa bắt đầu"): thực tế **ĐÃ CÓ** `ProjectAutomationWorker` (BackgroundService, 20 ngày → `APPROVED`); không dùng Quartz; không có status `Approved_by_Timeout`.
- **#21 Live Start & Draw** ("chưa bắt đầu"): **có REST** `lottery/run`+`result`, chỉ thiếu SignalR/SemaphoreSlim.
- **#23 Contract Draft** ("hoàn thành"): gắn với **thanh toán cọc**, không gắn "trúng bốc thăm".
- **#25 Payment Schedule** ("đang làm"): thực chất **chưa có** installments.
- **#8 Active App Check**: chặn ở **submit**, không phải lúc tạo draft.
- **#3**: status thật là `OPEN` (không phải chuỗi `Open_For_Registration`).
- **#26**: status thật `DEPOSIT_PAID` (không phải `Paid_Deposit`).

---

## 6. Kế hoạch mobile theo hướng "bám flow bắt buộc + mock phần thiếu"

**Nối API thật (đã/đang có):** Auth, OTP, Danh sách/Chi tiết dự án, Wizard hồ sơ (tạo/upload/soát/submit), Theo dõi + bổ sung, Rút hồ sơ, Thanh toán cọc VNPay, Xem hợp đồng PDF, Thông báo, FAQ, eKYC (VNPT: OCR + face-match ≥85% + tự lưu/khóa).

**Làm theo flow bắt buộc nhưng MOCK (nhãn "Dữ liệu mô phỏng / chờ BE"), nối API sau:**
1. Phòng chờ bốc thăm live + màn quay số kết quả (chờ SignalR BE).
2. Ký hợp đồng OTP (chờ API sign BE).
3. Lịch thanh toán nhiều đợt (chờ installments BE).
4. Danh sách công khai cuối (chờ API public BE).
5. Thành viên hộ gia đình chi tiết (chờ CRUD BE).

**Cần nâng UI (API thật):**
- Timeline stepper trực quan cho tiến trình hồ sơ.
- Màn "Sảnh khởi tạo hồ sơ" (welcome + checklist giấy tờ) trước wizard.

**Lưu ý hiển thị thứ tự:** vì BE đang cọc-trước-bốc-thăm, khi mock theo flow bắt buộc (bốc thăm→ký→trả tiền) cần ghi chú rõ đây là **luồng đích**; luồng chạy thật với API hiện tại là cọc-trước-bốc-thăm.

---

## 7. Luồng test được NGAY với BE hiện tại (thực tế)

```
Đăng ký → OTP → eKYC (VNPT: CCCD + selfie) → xem dự án (OPEN)
→ tạo hồ sơ → upload PDF → submit (SUBMITTED)
→ [CĐT] developer-review → submit-to-department (PENDING_SXD_REVIEW)
→ [Sở] sxd-review APPROVE (APPROVED)   (hoặc tự động sau 20 ngày)
→ thanh toán cọc VNPay (DEPOSIT_PAID)
→ [CĐT] lottery/run → kết quả WON/LOST (xem trong Chi tiết hồ sơ)
→ tải hợp đồng PDF
```
Các bước [CĐT]/[Sở] cần thực hiện ở vai trò tương ứng (web/Swagger) hoặc seed DB.

---

## 8. Gợi ý trình bày trong báo cáo đồ án
- **Use case diagram** theo role (Applicant/Developer/SXD/Admin).
- **Activity diagram** cho luồng hồ sơ (kèm nhánh bổ sung/rút).
- **State machine** cho application — nên vẽ **2 bản**: (a) flow bắt buộc, (b) BE thật, và nêu gap.
- **Sequence diagram** cho bốc thăm & ký hợp đồng (đánh dấu phần "đề xuất/cần bổ sung BE").
