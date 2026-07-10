# PROJECT_STRUCTURE.md — RHS Fe-Mobile

> Tài liệu kỹ thuật tổng quan cho dự án **rhs-fe-mobile** (React Native / Expo).  
> Mục tiêu: AI hoặc lập trình viên mới chỉ cần đọc file này là hiểu toàn bộ kiến trúc và sinh code đúng chuẩn.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Tech Stack](#2-tech-stack)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Kiến trúc tổng thể](#4-kiến-trúc-tổng-thể)
5. [Feature Modules](#5-feature-modules)
   - [main — Bottom Tabs](#51-main--bottom-tabs)
   - [auth — Xác thực](#52-auth--xác-thực)
   - [home — Khám phá dự án nhà ở](#53-home--khám-phá-dự-án-nhà-ở)
   - [application — Quản lý hồ sơ](#54-application--quản-lý-hồ-sơ)
   - [payment — Thanh toán](#55-payment--thanh-toán)
   - [ekyc — Định danh điện tử](#56-ekyc--định-danh-điện-tử)
   - [user — Quản lý tài khoản](#57-user--quản-lý-tài-khoản)
   - [saved — Dự án đã lưu](#58-saved--dự-án-đã-lưu)
   - [account — Tab tài khoản](#59-account--tab-tài-khoản)
   - [notification — Thông báo](#510-notification--thông-báo)
   - [issue-reports — Báo cáo sự cố](#511-issue-reports--báo-cáo-sự-cố)
6. [Navigation Architecture](#6-navigation-architecture)
7. [API Layer](#7-api-layer)
8. [Services](#8-services)
9. [Custom Hooks](#9-custom-hooks)
10. [Shared Components](#10-shared-components)
11. [Theme & Design System](#11-theme--design-system)
12. [State Management](#12-state-management)
13. [Cross-Feature Dependencies](#13-cross-feature-dependencies)
14. [Các vấn đề kiến trúc & Đề xuất Refactor](#14-các-vấn-đề-kiến-trúc--đề-xuất-refactor)
15. [How to Add a New Feature](#15-how-to-add-a-new-feature)
16. [Project Coding Standards](#16-project-coding-standards)
17. [Naming Conventions](#17-naming-conventions)
18. [API Convention](#18-api-convention)
19. [Best Practices](#19-best-practices)
20. [Things AI Must Follow When Generating New Code](#20-things-ai-must-follow-when-generating-new-code)

---

## 1. Tổng quan dự án

**rhs-fe-mobile** là ứng dụng di động React Native (Expo) cho nền tảng **Resilience Housing Supply (RHS)** — hệ thống quản lý nhà ở xã hội của chính phủ Việt Nam.

**Chức năng chính:**
- Khám phá và tìm kiếm dự án nhà ở xã hội
- Tạo và quản lý hồ sơ đăng ký mua/thuê nhà
- Định danh điện tử (eKYC) qua CCCD + khuôn mặt
- Thanh toán đặt cọc qua VNPay
- Quản lý thông tin cá nhân, thông báo, danh sách yêu thích
- Đăng nhập sinh trắc học (vân tay/khuôn mặt)

**Ngôn ngữ UI:** Tiếng Việt (vi-VN)

**Tên package Android:** `com.anonymous.femobile`

---

## 2. Tech Stack

| Danh mục | Công nghệ |
|----------|-----------|
| **Framework** | React Native 0.79.1 + Expo SDK 54 |
| **Ngôn ngữ** | TypeScript 5.9.2 (strict mode) |
| **Navigation** | React Navigation 7 (`@react-navigation/native` + `native-stack` + `bottom-tabs`) |
| **HTTP Client** | Axios (với interceptor tự động refresh token) |
| **Storage** | AsyncStorage (token, preferences) + SecureStore (biometric credentials) |
| **Maps** | `@rnmapbox/maps` + `react-native-maps` |
| **Camera** | `expo-camera` |
| **Biometrics** | `expo-local-authentication` |
| **File Picker** | `expo-document-picker`, `expo-image-picker` |
| **WebView** | `react-native-webview` (PDF viewer, VNPay payment gateway) |
| **Icons** | `@expo/vector-icons` (Feather, Ionicons) |
| **Build** | `expo run:android` / `expo run:ios` |

---

## 3. Cấu trúc thư mục

```
rhs-fe-mobile/
├── .env                              # EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_MAPBOX_TOKEN
├── App.tsx                           # Root component: NavigationContainer + Root Stack
├── app.json                          # Expo configuration
├── babel.config.js                   # Babel preset (expo)
├── index.ts                          # Entry point: registerRootComponent(App)
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config (strict, react-jsx, ESNext)
├── assets/                           # Static assets
│   ├── icon.png                      # App icon
│   ├── adaptive-icon.png             # Android adaptive icon
│   ├── splash-icon.png               # Splash screen icon
│   ├── fingerprint.png               # Biometric icon
│   ├── heart.png, like.png           # Wishlist icons
│   ├── google.png                    # Google sign-in icon
│   └── phuong.json                   # Danh sách phường/xã Việt Nam (dùng cho eKYC)
├── src/
│   ├── components/                   # Shared reusable UI components
│   │   ├── ActionButton.tsx          # Generic action button + SubmitButton
│   │   ├── BrandBar.tsx              # Government brand color bar (3px gradient)
│   │   ├── InfoRow.tsx               # Label-value display row
│   │   ├── NotificationBell.tsx      # Bell icon + unread badge
│   │   └── ScreenHeader.tsx          # Dual-mode header (gradient blue / white)
│   ├── lib/                          # Core infrastructure
│   │   ├── apiClient.ts              # Axios instance + JWT refresh interceptor
│   │   ├── biometricService.ts       # Biometric auth service
│   │   ├── tokenStorage.ts           # AsyncStorage wrapper for tokens
│   │   ├── theme.ts                  # Design system (colors, spacing, typography, shadows)
│   │   └── Logo.tsx                  # Brand logo (pure RN View)
│   ├── types/                        # Global type declarations
│   │   └── react-native-vector-icons.d.ts
│   └── features/                     # Feature-based modules
│       ├── main/                     # Bottom tab navigator (root shell)
│       │   └── MainTabNavigator.tsx
│       ├── auth/                     # Authentication
│       │   ├── AuthNavigator.tsx
│       │   ├── api/ (authApi.ts)
│       │   ├── components/ (CustomInput.tsx, Divider.tsx)
│       │   └── screens/ (Login, Register, VerifyOtp, ForgotPassword, ResetPassword)
│       ├── home/                     # Housing project discovery
│       │   ├── navigation/ (HomeNavigator.tsx)
│       │   ├── api/ (housingApi.ts)
│       │   └── screens/ (HomeScreen, HousingProjectDetail, MapFull)
│       ├── application/              # Housing applications
│       │   ├── navigation/ (ApplicationNavigator.tsx)
│       │   ├── api/ (housingApplicationApi.ts, housingDocumentApi.ts)
│       │   ├── components/ (ApplicationPaymentSection.tsx)
│       │   ├── screens/ (MyApplications, BasicInfo, EditInfo, UploadDocuments, ReviewSubmit, ContractViewer, CreateApplication)
│       │   └── utils/ (statusConfig.ts)
│       ├── payment/                  # VNPay payment processing
│       │   ├── navigation/ (PaymentNavigator.tsx — types only)
│       │   ├── api/ (paymentApi.ts)
│       │   └── screens/ (PaymentWebView, PaymentProcessing, PaymentSuccess)
│       ├── ekyc/                     # Identity verification
│       │   ├── EKycNavigator.tsx
│       │   ├── api/ (eKycApi.ts)
│       │   └── screens/ (EKycScreen.tsx)
│       ├── user/                     # User profile management
│       │   ├── UserNavigator.tsx
│       │   ├── api/ (userApi.ts)
│       │   └── screens/ (Profile, EditProfile, ChangePassword, DeleteAccount)
│       ├── saved/                    # Wishlist / saved projects
│       │   ├── api/ (wishlistApi.ts)
│       │   └── screens/ (SavedScreen.tsx)
│       ├── account/                  # Account tab
│       │   └── screens/ (AccountScreen.tsx)
│       ├── notification/             # Notifications
│       │   ├── api/ (notificationApi.ts)
│       │   ├── hooks/ (useNotificationBadge.ts)
│       │   └── screens/ (NotificationListScreen.tsx)
│       └── issue-reports/            # Bug/feedback reporting
│           ├── IssueReportNavigator.tsx
│           ├── api/ (issueReportApi.ts)
│           └── screens/ (IssueReportScreen.tsx)
```

---

## 4. Kiến trúc tổng thể

Dự án tuân theo **Feature Architecture** — mỗi tính năng được đóng gói trong `src/features/<tên-feature>/` với cấu trúc con riêng:

```
features/<feature>/
├── navigation/   # Navigator riêng (NativeStackNavigator)
├── screens/      # Màn hình (React components)
├── api/          # API client functions + TypeScript types
├── components/   # Components chỉ dùng trong feature này
├── hooks/        # Custom hooks chỉ dùng trong feature này
├── utils/        # Utility functions chỉ dùng trong feature này
├── services/     # Business logic services
└── types/        # TypeScript types riêng
```

**Luồng dữ liệu:**
```
Screen → API function → apiClient (axios + JWT interceptor) → Backend (.NET)
                          ↑
                    tokenStorage (AsyncStorage)
                    biometricService (SecureStore)
```

**Không có global state management** (không Redux, không Zustand, không Context).  
State được quản lý qua:
- `useState` / `useEffect` local per-component
- React Navigation params (truyền dữ liệu giữa các màn hình)
- AsyncStorage / SecureStore (dữ liệu persistent)

---

## 5. Feature Modules

### 5.1 main — Bottom Tabs

**Vai trò:** Shell chính sau khi đăng nhập. Chứa 4 tab bottom.

**File:** `src/features/main/MainTabNavigator.tsx`

| Tab | Label | Icon | Nội dung |
|-----|-------|------|----------|
| `Home` | Trang chủ | `home` | `HomeNavigator` (stack) |
| `Applications` | Hồ sơ của tôi | `file-text` | `ApplicationNavigator` (stack) |
| `Saved` | Quan tâm | `heart` | `SavedScreen` (single) |
| `Account` | Tài khoản | `user` | `AccountScreen` (single) |

---

### 5.2 auth — Xác thực

**Vai trò:** Đăng ký, đăng nhập, OTP, quên mật khẩu, đăng nhập sinh trắc học.

**Navigator:** `AuthNavigator.tsx` → `AuthStackParamList`  
**API:** `authApi` — 9 endpoints tại `/auth/*`  
**Components riêng:** `CustomInput` (input có icon, focus state, error, toggle password), `Divider`

**Screens (5):**

| Screen | Route | Mô tả |
|--------|-------|-------|
| `LoginScreen` | `Login` | Email/password, "remember me", biometric login |
| `RegisterScreen` | `Register` | Đăng ký (fullName, email, password, phone) |
| `VerifyOtpScreen` | `VerifyOtp` | Xác thực OTP email (nhận param `email`) |
| `ForgotPasswordScreen` | `ForgotPassword` | Gửi OTP reset password qua email |
| `ResetPasswordScreen` | `ResetPassword` | Nhập OTP + mật khẩu mới (nhận param `email`) |

**Luồng chính:** Login → (nếu chưa verify) VerifyOtp → `navigation.reset()` → MainTabs

---

### 5.3 home — Khám phá dự án nhà ở

**Vai trò:** Tab chính. Hiển thị danh sách dự án nhà ở, tìm kiếm/lọc, chi tiết dự án, bản đồ.

**Navigator:** `navigation/HomeNavigator.tsx` → `HomeStackParamList`  
**API:** `housingApi` — `getHousingProjects`, `getHousingProjectById`, `getSuggestedProjects`

**Screens (3):**

| Screen | Route | Mô tả |
|--------|-------|-------|
| `HomeScreen` | `HomeList` | Search bar, filter (tỉnh/quận/giá/diện tích), danh sách project cards, pull-to-refresh |
| `HousingProjectDetailScreen` | `HousingProjectDetail` | Chi tiết, ảnh, bản đồ Mapbox, toggle wishlist, nút "Đăng ký" → check eKYC → tạo hồ sơ |
| `MapFullScreen` | `MapFull` | Bản đồ Mapbox toàn màn hình, centered at project coordinates |

---

### 5.4 application — Quản lý hồ sơ

**Vai trò:** Toàn bộ vòng đời hồ sơ: tạo, sửa, upload giấy tờ, nộp, xem hợp đồng.

**Navigator:** `navigation/ApplicationNavigator.tsx` → `ApplicationStackParamList & PaymentStackParamList`  
**API:** `housingApplicationApi` (6 endpoints) + `housingDocumentApi` (4 endpoints)  
**Utils:** `statusConfig.ts` — map status → màu/nhãn

**Screens (7):**

| Screen | Route | Mô tả |
|--------|-------|-------|
| `MyApplicationsScreen` | `MyApplications` | Danh sách hồ sơ với status badges, modal chi tiết, nút hủy/xóa/thanh toán |
| `BasicInformationScreen` | `BasicInformation` | Form thông tin cá nhân (bước 1 của quy trình tạo mới) |
| `EditInformationScreen` | `EditInformation` | Sửa thông tin hồ sơ đã tạo |
| `UploadDocumentsScreen` | `UploadDocuments` | Upload giấy tờ PDF, xem kết quả AI verify, upload lại nếu bị reject |
| `ReviewSubmitScreen` | `ReviewSubmit` | Xem lại toàn bộ trước khi nộp |
| `ContractViewerScreen` | `ContractViewer` | Xem PDF hợp đồng qua WebView + download/share |
| `CreateApplicationScreen` | *(alternate)* | Form tạo hồ sơ cũ (có mô tả HOUSING_STATUS) |

**Các loại giấy tờ (`DOC_TYPES`):**
- `HOUSING_CONDITION_PROOF` — Minh chứng điều kiện nhà ở
- `POVERTY_HOUSEHOLD_CERTIFICATE` — Chứng nhận hộ nghèo/cận nghèo

**Trạng thái hồ sơ (`STATUS_CONFIG`):**  
`DRAFT → SUBMITTED → UNDER_REVIEW → PROPOSED | NEED_MORE_DOCUMENTS → APPROVED → DEPOSIT_PAID`  
Cũng có: `REJECTED`, `EXPIRED`, `CANCELED`

---

### 5.5 payment — Thanh toán

**Vai trò:** Tích hợp VNPay — mở WebView thanh toán, poll trạng thái, hiển thị kết quả.

**Navigator:** `PaymentNavigator.tsx` — chỉ export type `PaymentStackParamList` (không có component navigator riêng). Payment screens được nhúng vào `ApplicationNavigator` qua type intersection.

**Screens (3):**

| Screen | Route | Mô tả |
|--------|-------|-------|
| `PaymentWebViewScreen` | `PaymentWebView` | WebView mở VNPay URL, intercept redirect để bắt callback |
| `PaymentProcessingScreen` | `PaymentProcessing` | Poll `getPaymentStatus` mỗi 3s (max 45 lần ≈ 2.25 phút) |
| `PaymentSuccessScreen` | `PaymentSuccess` | Xác nhận thanh toán, mã slot, copy order ID, share |

---

### 5.6 ekyc — Định danh điện tử

**Vai trò:** Xác thực danh tính qua CCCD + khuôn mặt (FPT AI).

**Navigator:** `EKycNavigator.tsx` → 1 screen  
**API:** `eKycApi` — `ocr`, `faceMatch`, `liveness`, `checkCitizenId`, `updateProfileFromOcr`

**Screen:** `EKycScreen` (`EKycHome`) — Multi-step wizard:
1. Welcome → 2. OCR (scan CCCD) → 3. Face match (selfie vs CCCD ảnh) → 4. Liveness (quay video chống spoof) → 5. Complete/Failed

**Trigger:** Từ `HousingProjectDetailScreen` khi user bấm "Apply" mà chưa hoàn thành eKYC.

---

### 5.7 user — Quản lý tài khoản

**Vai trò:** Xem/sửa profile, đổi mật khẩu, xóa tài khoản.

**Navigator:** `UserNavigator.tsx` → `UserStackParamList`  
**API:** `userApi` — `getProfile`, `updateProfile`, `uploadProfileImage`, `deleteProfileImage`, `deleteAccount`

**Screens (4):**

| Screen | Route | Mô tả |
|--------|-------|-------|
| `ProfileScreen` | `Profile` | Xem chi tiết profile, upload/xóa ảnh đại diện |
| `EditProfileScreen` | `EditProfile` | Sửa thông tin (phone editable, còn lại display-only từ OCR) |
| `ChangePasswordScreen` | `ChangePassword` | Form đổi mật khẩu (dùng `authApi.changePassword`) |
| `DeleteAccountScreen` | `DeleteAccount` | Xác nhận xóa tài khoản (password + reason) |

---

### 5.8 saved — Dự án đã lưu

**Vai trò:** Danh sách dự án yêu thích (wishlist).

**API:** `wishlistApi` — `getWishlist`, `addToWishlist`, `removeFromWishlist`, `checkWishlistStatus`, `getWishlistItemByProject`

**Screen:** `SavedScreen` — FlatList paginated, pull-to-refresh, tap → navigate đến project detail, swipe/nút xóa.

---

### 5.9 account — Tab tài khoản

**Vai trò:** Màn hình landing của tab thứ 4.

**Screen:** `AccountScreen` — Hiển thị thông tin user, menu items: Profile, Notifications (có badge unread), Báo cáo sự cố, Cài đặt (push/biometric toggle), Đăng xuất.

---

### 5.10 notification — Thông báo

**Vai trò:** Hiển thị danh sách thông báo, badge unread count.

**API:** `notificationApi` — `getMyNotifications`, `markAsRead`, `markAllAsRead`, `getUnreadCount`  
**Hook:** `useNotificationBadge` — poll mỗi 30s, tự pause khi app background

**Screen:** `NotificationListScreen` — FlatList paginated, color-coded theo `NotificationType` enum.

---

### 5.11 issue-reports — Báo cáo sự cố

**Vai trò:** Gửi bug report, feature request, feedback.

**API:** `issueReportApi` — `create`, `getMyReports`

**Screen:** `IssueReportScreen` (`IssueReportHome`) — 2 tab: "My Reports" (list) + "New Report" (form: title, description, type picker).

---

## 6. Navigation Architecture

```
App.tsx (Root NativeStack, headerShown: false)
│
├── MainTabs → MainTabNavigator (Bottom Tabs, 4 tabs)
│   ├── Home → HomeNavigator (NativeStack, 3 screens)
│   │   ├── HomeList
│   │   ├── HousingProjectDetail { project }
│   │   └── MapFull { latitude, longitude, projectName }
│   │
│   ├── Applications → ApplicationNavigator (NativeStack, 9 screens)
│   │   ├── MyApplications
│   │   ├── BasicInformation { projectId, projectName }
│   │   ├── EditInformation { applicationId }
│   │   ├── UploadDocuments { applicationId, projectName?, applicationStatus? }
│   │   ├── ReviewSubmit { applicationId, applicationStatus? }
│   │   ├── PaymentWebView { paymentUrl, orderId, applicationId }
│   │   ├── PaymentProcessing { orderId, applicationId, projectName, depositAmount }
│   │   ├── PaymentSuccess { orderId, slotCode, pdfUrl, projectName, applicantName, amount, paidAt? }
│   │   └── ContractViewer { pdfUrl, title }
│   │
│   ├── Saved → SavedScreen (single screen)
│   └── Account → AccountScreen (single screen)
│
├── Auth → AuthNavigator (NativeStack, 5 screens)
│   ├── Login
│   ├── Register
│   ├── VerifyOtp { email }
│   ├── ForgotPassword
│   └── ResetPassword { email }
│
├── UserProfile → UserNavigator (NativeStack, 4 screens)
│   ├── Profile
│   ├── EditProfile
│   ├── ChangePassword
│   └── DeleteAccount
│
├── EKyc → EKycNavigator (NativeStack, 1 screen)
│   └── EKycHome { returnTo?, applicationData? }
│
└── IssueReport → IssueReportNavigator (NativeStack, 1 screen)
    └── IssueReportHome
```

**Tổng cộng:** 5 root stacks, 27 màn hình.

---

## 7. API Layer

### apiClient (shared Axios instance)

**File:** `src/lib/apiClient.ts`

- **Base URL:** `http://192.168.1.4:5112/api` (hardcoded — override `.env`)
- **Request interceptor:** Tự động gắn `Authorization: Bearer <token>`
- **Response interceptor:** Khi gặp 401 → gọi `POST /auth/refresh-token` với refresh token → retry queue. Nếu refresh thất bại → clear tokens.

### API files (10 files, 49 endpoint functions)

| File | Endpoints | Domain |
|------|-----------|--------|
| `auth/api/authApi.ts` | 9 | Đăng ký, đăng nhập, OTP, quên MK, refresh/logout |
| `home/api/housingApi.ts` | 3 | Danh sách/chi tiết dự án |
| `application/api/housingApplicationApi.ts` | 6 | CRUD hồ sơ, nộp, nộp lại |
| `application/api/housingDocumentApi.ts` | 4 | Upload/xóa giấy tờ, AI verification |
| `payment/api/paymentApi.ts` | 5 | Tạo URL thanh toán, poll trạng thái, lịch sử |
| `ekyc/api/eKycApi.ts` | 5 | OCR, face match, liveness, check CCCD |
| `user/api/userApi.ts` | 5 | Profile CRUD, ảnh đại diện, xóa TK |
| `notification/api/notificationApi.ts` | 4 | List, unread count, mark read |
| `issue-reports/api/issueReportApi.ts` | 2 | Tạo + xem báo cáo |
| `saved/api/wishlistApi.ts` | 5 | CRUD wishlist |

**Pattern:** Mỗi API file export một object literal chứa các async functions. Tất cả đều dùng chung `apiClient` từ `src/lib/apiClient.ts`. Types được định nghĩa cùng file API (không có types tập trung).

---

## 8. Services

| File | Exports | Mô tả |
|------|---------|-------|
| `src/lib/tokenStorage.ts` | 6 functions | AsyncStorage wrapper: setTokens, getToken, getRefreshToken, clearTokens, saveRememberedEmail, getRememberedEmail |
| `src/lib/biometricService.ts` | 8 functions | Biometric auth lifecycle: check support, authenticate, enable/disable, SecureStore management, email mismatch detection |

---

## 9. Custom Hooks

**Duy nhất 1 custom hook trong toàn dự án:**

| Hook | File | Mô tả |
|------|------|-------|
| `useNotificationBadge` | `src/features/notification/hooks/useNotificationBadge.ts` | Poll `getUnreadCount()` mỗi 30s, pause khi app background. Return `number`. |

---

## 10. Shared Components

| Component | File | Props chính | Dùng ở đâu |
|-----------|------|-------------|------------|
| `BrandBar` | `src/components/BrandBar.tsx` | *(none)* | Tất cả màn hình |
| `ScreenHeader` | `src/components/ScreenHeader.tsx` | `title`, `variant?`, `onBack?`, `rightAction?` | Hầu hết màn hình |
| `InfoRow` | `src/components/InfoRow.tsx` | `label`, `value`, `isHighlight?` | Detail screens |
| `ActionButton` | `src/components/ActionButton.tsx` | `label`, `icon`, `onPress`, `destructive?`, `loading?` | Profile, Account |
| `SubmitButton` | `src/components/ActionButton.tsx` | `label`, `onPress`, `loading?`, `disabled?` | Forms |
| `NotificationBell` | `src/components/NotificationBell.tsx` | *(none)* | Header |

### Feature-local Components

| Component | File | Feature |
|-----------|------|---------|
| `CustomInput` | `auth/components/CustomInput.tsx` | auth |
| `Divider` | `auth/components/Divider.tsx` | auth |
| `ApplicationPaymentSection` | `application/components/ApplicationPaymentSection.tsx` | application |

---

## 11. Theme & Design System

**File:** `src/lib/theme.ts`

### RHSColors (46 màu)

```
Primary (Blue):   blue50 → blue900
Accent (Red):     red50, red400, red600, red700
Success (Green):  green50, green600, green700
Warning (Amber):  amber50, amber600, amber700
Neutrals:         white, grey50 → grey900, black
Semantic:         surface, surfaceCard, text, textSecondary, textMuted, border, borderFocus, shadow
Legacy:           govRed, govGold, govGoldDark, govBlue, govBlueDark, govTeal, govGreen, error, success
```

### Spacing (8pt grid)
`xxs:2, xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, huge:48`

### Typography presets
`h1, h2, h3, body, bodySmall, caption, button, buttonSmall` — mỗi preset: `{ fontSize, fontWeight, letterSpacing?, lineHeight }`

### Khác
- `borderRadius`: `xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, full:9999`
- `shadows`: `sm, md, lg, floating`
- `commonStyles`: `card, cardFlat, buttonPrimary, buttonDestructive, buttonOutline, input, sectionTitle`

### Cách import theme

```typescript
import { RHSColors, spacing, borderRadius, typography, shadows, commonStyles } from '../../../lib/theme';
```

---

## 12. State Management

**Không có global state management.** Không Redux, không Zustand, không Context Provider.

State được quản lý qua:
1. **React `useState` / `useEffect`** — local component state
2. **React Navigation route params** — truyền dữ liệu giữa các màn hình qua typed param lists
3. **AsyncStorage** — token, remembered email, biometric flag
4. **expo-secure-store** — biometric credentials (refresh token + email)

`src/components/states/` là thư mục trống — có thể đã được dự định cho state management trong tương lai.

---

## 13. Cross-Feature Dependencies

| Feature | Phụ thuộc vào |
|---------|---------------|
| `main` | `home/HomeNavigator`, `application/ApplicationNavigator`, `saved/SavedScreen`, `account/AccountScreen` |
| `home` | `user/userApi`, `saved/wishlistApi`, `lib/theme`, `lib/Logo`, `lib/apiClient`, `assets/phuong.json` |
| `application` | `user/userApi`, `payment/paymentApi`, `payment/PaymentNavigator` (types), payment screens |
| `ekyc` | `user/userApi`, `lib/apiClient`, `assets/phuong.json` |
| `account` | `user/userApi`, `notification/useNotificationBadge`, `lib/tokenStorage`, `lib/biometricService` |
| `user` | `auth/components/CustomInput`, `auth/api/authApi` (for changePassword) |
| `saved` | `home/api/housingApi` |
| `notification` | *(self-contained)* |
| `issue-reports` | `lib/apiClient` |
| `payment` | `lib/apiClient` |

---

## 14. Các vấn đề kiến trúc & Đề xuất Refactor

### 14.1 Vấn đề đã phát hiện

| # | Vấn đề | Mức độ | Mô tả |
|---|--------|--------|-------|
| 1 | **Không có path alias** | Medium | Tất cả imports dùng `../../../` relative paths. Nên cấu hình `@/` alias trong `tsconfig.json` + `babel.config.js` (plugin `babel-plugin-module-resolver`). |
| 2 | **Hardcoded API base URL** | High | `apiClient.ts` hardcode `http://192.168.1.4:5112/api`, bỏ qua `.env`. Cần sửa thành `process.env.EXPO_PUBLIC_API_BASE_URL`. |
| 3 | **Không có global state management** | Medium | Với số lượng feature tăng, việc thiếu global state sẽ gây khó khăn. Cân nhắc thêm Zustand hoặc React Context cho user session, notification count. |
| 4 | **Trùng lặp `PagedResult<T>`** | Low | Type này được định nghĩa trong ít nhất 3 API files (`housingApi`, `wishlistApi`, `issueReportApi`). Nên tách ra shared types. |
| 5 | **Trùng lặp màn hình tạo hồ sơ** | Medium | Có cả `BasicInformationScreen` và `CreateApplicationScreen` — dường như là 2 phiên bản của cùng một chức năng. Nên merge hoặc xóa bản cũ. |
| 6 | **Notification API endpoint sai prefix** | Medium | `notificationApi.ts` dùng `/api/notification/...` thay vì `/notification/...` — khác với pattern của các API khác. Có thể gây lỗi nếu backend không có `/api/api/` route. |
| 7 | **Empty directories** | Low | `home/components/`, `home/hooks/`, `home/services/`, `home/types/`, `home/utils/`, `src/components/states/` — các thư mục trống không có file nào, gây nhiễu. |
| 8 | **Cross-feature component import** | Medium | `user/ChangePasswordScreen` import `CustomInput` từ `auth/components/` — đây là component nên được move lên `src/components/` shared. |
| 9 | **Payment screens không có navigator riêng** | Low | Payment screens được nhúng vào `ApplicationNavigator` qua type intersection — cách làm thông minh nhưng khó maintain khi payment flow mở rộng. |
| 10 | **Không có error boundary** | Medium | Không có `ErrorBoundary` component nào. App sẽ crash trắng màn hình nếu có unhandled error. |
| 11 | **Không có loading/empty/error state pattern thống nhất** | Low | Mỗi screen tự xử lý loading/error state khác nhau, không có shared hook hay component. |
| 12 | **package.json thiếu scripts** | Low | Chỉ có `start`, `android`, `ios`, `web`. Thiếu `lint`, `test`, `format`. |

### 14.2 Đề xuất cải thiện

1. **Thêm path alias `@/`** → tránh `../../../` hell
2. **Sửa `apiClient.ts`** → dùng `EXPO_PUBLIC_API_BASE_URL` từ `.env`
3. **Tạo `src/types/common.ts`** → gom các type dùng chung (`PagedResult<T>`, `ApiResponse<T>`)
4. **Tạo `src/hooks/`** → chứa shared hooks: `usePagination`, `useLoading`, `useErrorAlert`
5. **Tạo `ErrorBoundary`** component ở `src/components/`
6. **Dọn dẹp thư mục trống** và merge `CreateApplicationScreen` + `BasicInformationScreen`
7. **Thêm Zustand** cho user session và notification state
8. **Fix `notificationApi.ts`** endpoint prefix
9. **Move `CustomInput`** lên `src/components/` shared
10. **Thêm ESLint + Prettier config**

---

## 15. How to Add a New Feature

### Bước 1: Tạo cấu trúc thư mục

```
src/features/<feature-name>/
├── navigation/
│   └── <Feature>Navigator.tsx
├── screens/
│   ├── <Screen1>Screen.tsx
│   ├── <Screen2>Screen.tsx
│   └── index.ts              # barrel export
├── api/
│   ├── <feature>Api.ts
│   └── index.ts
├── components/               # (nếu cần)
├── hooks/                    # (nếu cần)
├── utils/                    # (nếu cần)
└── types/                    # (nếu cần)
```

### Bước 2: Định nghĩa API

```typescript
// src/features/<feature>/api/<feature>Api.ts
import apiClient from '../../../lib/apiClient';

export interface SomeResponse { ... }
export interface SomeRequest { ... }

export const myFeatureApi = {
  getData: () => apiClient.get<SomeResponse>('/endpoint'),
  createData: (data: SomeRequest) => apiClient.post<SomeResponse>('/endpoint', data),
};
```

### Bước 3: Tạo Navigator

```typescript
// src/features/<feature>/navigation/<Feature>Navigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type FeatureStackParamList = {
  Screen1: undefined;
  Screen2: { id: string };
};

const Stack = createNativeStackNavigator<FeatureStackParamList>();

export const FeatureNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Screen1" component={Screen1Component} />
    <Stack.Screen name="Screen2" component={Screen2Component} />
  </Stack.Navigator>
);
```

### Bước 4: Đăng ký vào App.tsx

```typescript
// Thêm vào RootStackParamList
// Thêm <Stack.Screen name="Feature" component={FeatureNavigator} />
```

### Bước 5: (Nếu là tab) Đăng ký vào MainTabNavigator

```typescript
// Thêm tab mới vào MainTabParamList + Tab.Screen
```

---

## 16. Project Coding Standards

### Chung
- TypeScript **strict mode** bắt buộc
- JSX mode: `react-jsx` (không cần `import React` trong mỗi file)
- Tất cả text hiển thị UI phải là tiếng Việt
- Sử dụng functional components + hooks (không class component)
- Không dùng `any` trừ khi bất khả kháng; luôn định nghĩa type cụ thể

### File
- Mỗi component/screen một file
- Tên file: PascalCase cho components/screens, camelCase cho utils/api/hooks
- File index.ts dùng để barrel export tất cả exports từ thư mục đó

### Import
- Import thứ tự: React/RN → third-party → local (components → lib → features)
- Dùng relative paths (`../../../lib/theme`) — chưa có alias

### Style
- StyleSheet.create() ở cuối file (sau component)
- Dùng `RHSColors`, `spacing`, `borderRadius`, `typography` từ `lib/theme.ts`
- Không inline style phức tạp; chỉ inline những giá trị dynamic

### API
- Mỗi feature có API file riêng
- Export object literal (không export từng function riêng lẻ)
- Types/interfaces định nghĩa cùng file API
- Dùng shared `apiClient` từ `src/lib/apiClient.ts`

### Navigation
- Navigator component đặt trong `navigation/` folder
- Param types export cùng navigator (e.g., `HomeStackParamList`)
- Navigation params dùng để truyền dữ liệu giữa các màn hình

---

## 17. Naming Conventions

### Folder Naming Convention

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Feature folder | **kebab-case** | `issue-reports`, `src/features/` |
| Sub-folder trong feature | **lowercase** | `screens`, `api`, `components`, `hooks`, `utils`, `navigation` |
| Shared folder | **lowercase** | `src/components`, `src/lib`, `src/types` |

### Component Naming Convention

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Screen component | **PascalCase** + suffix `Screen` | `HomeScreen`, `LoginScreen`, `UploadDocumentsScreen` |
| Navigator component | **PascalCase** + suffix `Navigator` | `AuthNavigator`, `HomeNavigator`, `MainTabNavigator` |
| Shared component | **PascalCase**, mô tả chức năng | `BrandBar`, `ScreenHeader`, `ActionButton`, `InfoRow` |
| Feature-local component | **PascalCase**, mô tả chức năng | `CustomInput`, `ApplicationPaymentSection` |
| File name | Trùng tên với component export chính | `BrandBar.tsx` → `export const BrandBar` |

### Hook Naming Convention

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Custom hook | **camelCase** + prefix `use` | `useNotificationBadge` |
| File name | Trùng tên hook | `useNotificationBadge.ts` |

### API Convention

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| API file | **camelCase** + suffix `Api` | `authApi.ts`, `housingApi.ts`, `paymentApi.ts` |
| API object | **camelCase**, tên feature + `Api` | `authApi`, `userApi`, `wishlistApi` |
| API function | **camelCase**, động từ mô tả hành động | `getProfile`, `uploadDocument`, `markAsRead` |
| Request type | **PascalCase** + suffix `Dto` hoặc `Request` | `RegisterDto`, `CreateApplicationRequest` |
| Response type | **PascalCase** + suffix `Response` hoặc mô tả entity | `AuthResponse`, `ApplicationDetail`, `PaymentInfo` |

---

## 18. API Convention

### Cấu trúc file API

```typescript
// src/features/<name>/api/<name>Api.ts
import apiClient from '../../../lib/apiClient';

// ── Request DTOs ──
export interface CreateXxxRequest { ... }

// ── Response types ──
export interface XxxResponse { ... }
export interface XxxDetail { ... }

// ── API object ──
export const xxxApi = {
  getList: () => apiClient.get<XxxResponse[]>('/xxx'),
  getById: (id: string) => apiClient.get<XxxDetail>(`/xxx/${id}`),
  create: (data: CreateXxxRequest) => apiClient.post<XxxResponse>('/xxx', data),
  update: (id: string, data: Partial<CreateXxxRequest>) => apiClient.put<void>(`/xxx/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/xxx/${id}`),
};
```

### Upload file (multipart)

```typescript
uploadDocument: async (applicationId: string, documentType: string, fileUri: string) => {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, type: 'application/pdf', name: 'document.pdf' } as any);
  formData.append('documentType', documentType);
  return apiClient.post<UploadDocumentResponse>(
    `/housing-applications/${applicationId}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
};
```

### Error handling pattern

```typescript
try {
  const result = await xxxApi.someAction(data);
} catch (e: any) {
  const msg = e?.response?.data?.message || e?.message || 'Có lỗi xảy ra.';
  Alert.alert('Lỗi', msg);
}
```

---

## 19. Best Practices

1. **Luôn dùng typed navigation** — định nghĩa `ParamList` cho mỗi navigator, dùng `useNavigation<NativeStackNavigationProp<ParamList>>()`
2. **Không hardcode string** cho route names, statuses, colors — dùng constants hoặc type từ theme/statusConfig
3. **Tách biệt UI và logic** — API calls trong file api/, business logic trong hooks hoặc services
4. **Pull-to-refresh** trên tất cả các FlatList
5. **Loading state** với `ActivityIndicator` trong khi chờ API
6. **Empty state** khi danh sách rỗng — hiển thị icon + message thân thiện
7. **Alert confirm** trước các hành động destructive (xóa, hủy)
8. **SafeAreaView** bao bọc tất cả màn hình
9. **Header riêng** (dùng `ScreenHeader` hoặc custom white header, không dùng navigation header)
10. **Hide tab bar** khi vào flow tạo hồ sơ (dùng `useLayoutEffect` + `parent.setOptions`)
11. **Feather icons** là icon library chính (`@expo/vector-icons`)
12. **Không dùng default export** — dùng named export để IDE auto-import chính xác

---

## 20. Things AI Must Follow When Generating New Code

### ✅ Bắt buộc

1. **Luôn import `RHSColors`, `spacing`, `borderRadius`, `typography` từ `../../../lib/theme`** khi tạo UI mới
2. **Luôn dùng `apiClient` từ `../../../lib/apiClient`** cho mọi API call
3. **Luôn dùng `StyleSheet.create()`** ở cuối file, không inline style phức tạp
4. **Luôn dùng named exports** — không dùng `export default`
5. **Luôn wrap màn hình trong `<SafeAreaView>`** từ `react-native-safe-area-context`
6. **Luôn dùng `BrandBar`** ở đầu mỗi màn hình
7. **Luôn dùng `typography` presets** cho text style (`typography.body`, `typography.h2`, ...)
8. **Luôn định nghĩa TypeScript type** cho tất cả API responses và navigation params
9. **Luôn dùng `Alert.alert()`** cho error handling (pattern: `e?.response?.data?.message || e?.message`)
10. **Luôn dùng tiếng Việt** cho tất cả text hiển thị trong UI
11. **Luôn tạo API file riêng trong `api/` folder** khi thêm API mới, không gọi `apiClient` trực tiếp từ screen
12. **Luôn định nghĩa `ParamList` type** khi tạo navigator mới
13. **Luôn tạo `index.ts` barrel export** trong `screens/` folder

### ❌ Không được làm

1. **Không thêm global state management** (Redux/Zustand) trừ khi đã thảo luận trước
2. **Không dùng default export**
3. **Không hardcode URL/string** — dùng constants hoặc config
4. **Không tạo file/thư mục không cần thiết** — chỉ tạo những gì thực sự cần
5. **Không thay đổi cấu trúc `src/lib/`** (apiClient, theme, tokenStorage, biometricService)
6. **Không dùng `any`** — luôn tạo type/interface cụ thể
7. **Không viết comments bằng tiếng Anh trừ khi là technical term** — comment giải thích code có thể dùng tiếng Anh, nhưng UI text phải là tiếng Việt
8. **Không import cross-feature components** trừ khi đã tồn tại pattern đó (e.g., `CustomInput` từ auth được dùng trong user)
9. **Không tạo component chung nếu chỉ dùng 1 lần** — giữ trong feature folder

### 📐 Template cho Screen mới

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';

type ScreenParams = { /* ... */ };

export const NewFeatureScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [loading, setLoading] = useState(false);

  // ── Effects ──
  useEffect(() => { /* fetch data */ }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <BrandBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──
  return (
    <SafeAreaView style={styles.safe}>
      <BrandBar />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
```

---

*Tài liệu tự động sinh từ phân tích codebase ngày 2026-07-10.*  
*Cập nhật khi có thay đổi kiến trúc lớn.*
