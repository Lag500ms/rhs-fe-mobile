# Sửa lỗi Network Error (Android)

## Nguyên nhân thường gặp

1. **Backend chưa chạy** hoặc chỉ lắng nghe `localhost` (máy ảo/máy thật không vào được).
2. **Sai URL** trong `.env` theo loại thiết bị.
3. **Chưa restart Metro** sau khi sửa `.env` (`EXPO_PUBLIC_*` chỉ nạp lúc bundle).

## URL đúng

| Thiết bị | `EXPO_PUBLIC_API_BASE_URL` |
|---|---|
| Android Emulator (Android Studio) | `http://10.0.2.2:5112/api` |
| iOS Simulator | `http://localhost:5112/api` |
| Điện thoại thật (cùng WiFi) | `http://<IP_LAN_máy_PC>:5112/api` (vd `http://192.168.1.10:5112/api`) |

File: `rhs-fe-mobile/.env` (hiện mặc định = emulator `10.0.2.2`).

## Checklist

1. Chạy API như bạn đang dùng:
   ```bash
   dotnet run --project RHS.API --urls=http://0.0.0.0:5112
   ```
2. Trên PC mở: `http://localhost:5112/swagger` — phải thấy Swagger.
3. Emulator: `.env` = `http://10.0.2.2:5112/api`.
4. Máy thật: đổi `.env` sang IP LAN PC; cùng WiFi; tắt VPN nếu có.
5. Restart Metro:
   ```bash
   cd rhs-fe-mobile
   npx expo start -c
   ```
6. Log Metro phải hiện: `[apiClient] baseURL = http://10.0.2.2:5112/api` (hoặc IP LAN).
7. Windows Firewall: cho phép inbound TCP **5112** nếu dùng máy thật.

## Lưu ý

- Không dùng `https://localhost` trên mobile (cert / unreachable).
- `android:usesCleartextTraffic=true` đã bật — HTTP được phép.
- `localhost` trên emulator **không** trỏ về PC — phải dùng `10.0.2.2`.
