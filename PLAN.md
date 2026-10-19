# 🗺️ DevGotchi: Bản Kế Hoạch Triển Khai & Theo Dõi Tiến Độ (Execution Roadmap)

> **Dự án:** DevGotchi — 3D Virtual Pet Productivity Platform (Telegram Web App)  
> **Cập nhật lúc:** 19/10/2026  
> **Trạng thái tổng thể:** **Hoàn thành 90% (Fullstack Frontend 3D + Backend NestJS REST API + AI Gemini + GitHub Badges)**

---

## 📊 Bảng Theo Dõi Tiến Độ Tổng Quan

| Giai đoạn | Nội dung công việc | Tiến độ | Trạng thái |
| :--- | :--- | :---: | :---: |
| **P1. Khởi Tạo & Chuẩn Hóa** | Monorepo, AGENTS.md, 5 Skills, 3 Workflows, TanStack Query, Telegram SDK | **100%** | ✅ Hoàn thành |
| **P2. Hệ Thống Thú Cưng 3D** | 4 Linh thú Three.js, Carousel chọn pet, Hoạt ảnh Cho ăn, Poke, Biểu cảm | **100%** | ✅ Hoàn thành |
| **P3. Gameplay Pomodoro** | Vòng lặp Focus 25m/5m/15m, EXP/Level-up, Thức ăn rơi, Tactile UI | **100%** | ✅ Hoàn thành |
| **P4. Backend API & AI Persona** | NestJS Clean Architecture, Prisma PostgreSQL, Gemini Flash AI, GitHub SVG | **100%** | ✅ Hoàn thành |
| **P5. Tích Hợp Bot & Triển Khai** | Tạo Telegram Bot Menu, Deploy Vercel/Railway, Test trên điện thoại thực tế | **0%** | ⏳ Sẵn sàng triển khai |

---

## 🎯 Chi Tiết Từng Giai Đoạn & Checklist Thực Thi

### ✅ GIAI ĐOẠN 1: KHỞI TẠO KIẾN TRÚC & TIÊU CHUẨN DỰ ÁN (HOÀN THÀNH)
- [x] **Monorepo Scaffolding:** Khởi tạo `frontend/` (React 19 + TypeScript + Vite + Tailwind CSS v4) và `backend/` (NestJS).
- [x] **Master Ruleset:** Viết [AGENTS.md](./AGENTS.md) quy định bắt buộc 60 FPS WebGL, zero-leak memory, chuẩn Telegram Web App.
- [x] **Bộ 5 Kỹ Năng (Skills) tại `.agents/skills/`:**
  - `devgotchi-architecture`: Kiến trúc dữ liệu hybrid (TanStack + Zustand + Offline localStorage).
  - `pet-3d-creation`: Sổ tay dựng mô hình và lighting 3D Chibi Three.js.
  - `pomodoro-gamification`: Công thức toán học EXP ($4 \times \text{min}$), Level-up ($1.35^N$), Vitals decay.
  - `backend-api-pipeline`: Chuẩn thiết kế module NestJS, DTO validation.
  - `telegram-playful-ui`: Chuẩn thiết kế Playful UI / Gamified Soft UI, nút bấm 3D xúc giác, Haptic feedback.
- [x] **Bộ 3 Quy Trình (Workflows) tại `.agents/workflows/`:**
  - `feature-development.md`, `new-pet-workflow.md`, `quality-and-test.md`.
- [x] **Tích Hợp Hệ Sinh Thái TanStack:**
  - Cài đặt `@tanstack/react-query`, viết queryClient, custom hooks `usePetQuery`, `useFoodsQuery`, `useFeedPetMutation`, `useCompleteSessionMutation`.
- [x] **Chuẩn Hóa Telegram Web App:**
  - Tích hợp SDK `telegram-web-app.js`, viết wrapper `src/utils/telegram.ts` hỗ trợ Haptics (`impact`, `notification`, `selection`).

---

### ✅ GIAI ĐOẠN 2: THÚ CƯNG 3D & GAMIFIED SOFT UI (HOÀN THÀNH)
- [x] **Bộ 4 Linh Thú Khởi Đầu (3D Procedural Chibi):**
  - 🐡 **Puffy (Cá Nóc Biển)**: Thân cầu tròn, gai cao su vàng, miệng O-shape, mắt xoáy ốc Dizzy mode khi gặp bug.
  - 🐱 **Bytey (Mèo Cyber)**: Mèo tím hạt đậu, tai nhọn, đuôi sạc USB phát sáng đổi màu.
  - 🪨 **Golemy (Server Golem)**: Khối đá bo góc, mầm cây non đung đưa, mắt LED.
  - 🐙 **Octy (Git Kraken)**: Thân cầu hồng dâu, xúc tu uốn lượn mềm mại.
- [x] **Màn hình Chọn Thú Cưng (`StarterSelection.tsx`):**
  - Bệ xoay Carousel 3D, hiển thị chỉ số, kỹ năng bị động, nhập tên riêng, hiệu ứng confetti.
- [x] **Tương Tác Xúc Giác & Đồ Họa 3D:**
  - Mouse Parallax Look-at mượt mà.
  - Nảy co giãn (*squash & stretch*) khi chọc/vuốt ve.
  - Quỹ đạo đồ ăn bay vào miệng pet phát sáng hào quang (`FoodTray.tsx`).
- [x] **Thiết Kế Playful UI / Gamified Soft UI:**
  - Nút bấm 3D có độ dày vật lý (`border-b-4 active:border-b-0 active:translate-y-1`).
  - Thẻ mềm bo cong (`rounded-3xl`) với bóng đa tầng claymorphism.
  - Thanh điều hướng ngón tay cái phía dưới màn hình (Bottom Navigation: Pet | Focus | Food).

---

### 🔄 GIAI ĐOẠN 3: VÒNG LẶP NĂNG SUẤT POMODORO (ĐANG HOÀN THIỆN)
- [x] Giao diện đồng hồ Pomodoro tròn SVG tiến trình (`PomodoroTimer.tsx`).
- [x] 3 chế độ: Focus 25m, Nghỉ ngắn 5m, Nghỉ dài 15m.
- [x] Lựa chọn Tag công việc: `#Frontend`, `#Backend`, `#Bugfix`, `#LeetCode`, `#Design`.
- [x] Tính toán thưởng EXP, thăng cấp Level-up, rơi thức ăn ngẫu nhiên vào khay đồ ăn.
- [ ] *Việc cần làm:* Đồng bộ kết quả phiên vào cơ sở dữ liệu backend thay vì chỉ lưu local.

---

### ⏳ GIAI ĐOẠN 4: BACKEND NESTJS, DATABASE & AI PERSONA (TIẾP THEO)
- [ ] **Khởi tạo Prisma ORM & PostgreSQL Database:**
  - Tạo model `User`, `Pet`, `FocusSession`, `InventoryItem`.
- [ ] **Viết REST API Endpoints trong `backend/src/`:**
  - `GET /api/pets/me`: Lấy thông tin pet theo Telegram ID.
  - `POST /api/pets/adopt`: Nhận nuôi pet ban đầu.
  - `POST /api/pets/feed`: Cho ăn và cập nhật chỉ số No/Vui.
  - `POST /api/sessions/complete`: Lưu phiên Pomodoro, cộng EXP.
  - `GET /api/badge/:username.svg`: Dynamic SVG Badge hiển thị thú cưng cho GitHub README.
- [ ] **AI Assistant Pet Speech (Gemini 2.5 Flash):**
  - Endpoint `POST /api/ai/speech`: Sinh câu thoại động viên hoặc cằn nhằn hài hước theo thời gian thực dựa vào tâm trạng của pet và chủ đề vừa code.
- [ ] **Decay Cron Job:**
  - Chạy background job kiểm tra suy giảm chỉ số đói sau mỗi 2h không hoạt động.

---

### ⏳ GIAI ĐOẠN 5: TÍCH HỢP TELEGRAM BOT & DEPLOY
- [ ] Đăng ký Telegram Bot với `@BotFather` và cấu hình Menu Button URL tới Web App.
- [ ] Triển khai Frontend lên Vercel / Cloudflare Pages.
- [ ] Triển khai Backend lên Render / Railway.
- [ ] Test toàn diện trên ứng dụng Telegram thực tế (iOS / Android / Desktop).
