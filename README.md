# 🐡 DevGotchi: 3D Virtual Pet & Productivity for Developers

> Biến mỗi phiên Pomodoro tập trung và commit code của bạn thành thức ăn và chỉ số tiến hóa cho linh thú 3D!

![DevGotchi](https://img.shields.io/badge/DevGotchi-3D%20Virtual%20Pet-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Three.js%20%7C%20Tailwind%20%7C%20NestJS-purple?style=for-the-badge)

---

## 🌟 Tính Năng Đã Khởi Tạo

1. **Bộ 4 Thú Cưng Khởi Đầu (3D Procedural Starters)**:
   - **🐡 Puffy (Cá Nóc Biển - The Bug Hunter)**: Thân cầu xanh ngọc bích, gai vàng cao su mềm mại, mắt xoáy tít khi gặp bug, thích ăn **Tôm Debug (Shrimp)**.
   - **🐱 Bytey (Mèo Cyber - The Frontend Ninja)**: Mèo tím hạt đậu, tai nhọn, đuôi cáp sạc USB đổi màu, thích ăn **Bánh Cá RAM**.
   - **🪨 Golemy (Khối Đá Server - The Backend Golem)**: Khối lập phương bo tròn xanh rêu, mầm cây xanh trên đỉnh đầu, mắt LED phát sáng, thích ăn **Thạch Docker**.
   - **🐙 Octy (Bạch Tuộc Git - The Fullstack Kraken)**: Thân cầu hồng dâu, các xúc tu uốn lượn nhịp nhàng, thích uống **Donut Espresso**.

2. **Hệ Thống Tương Tác 3D (Interactive Gameplay)**:
   - **Tương tác chuột (Mouse Look-at)**: Thú cưng xoay mặt ngước nhìn theo con trỏ chuột.
   - **Cho ăn (Feeding Interaction)**: Bấm chọn món ăn từ khay đồ ăn (Inventory) -> Món ăn bay lên phát sáng hào quang bay vào miệng thú cưng -> Pet há mồm đớp và nảy lên sung sướng!
   - **Chọc / Vuốt ve (Poke & Petting)**: Click chuột vào pet để kích hoạt hiệu ứng nảy co giãn (squash & stretch) và tăng thanh hạnh phúc.
   - **Chế độ Gặp Bug (Dizzy Mode)**: Mắt xoáy tít liên tục biểu cảm hài hước.

3. **Vòng Lặp Năng Suất (Pomodoro Game Loop)**:
   - Chế độ Focus 25m, Nghỉ ngắn 5m, Nghỉ dài 15m.
   - Chọn chủ đề làm việc (#Frontend, #Backend, #Bugfix, #LeetCode, #Design).
   - Hoàn thành phiên Pomodoro: Pet được cộng EXP, tăng Cấp (Level Up), tăng Streak và rơi thêm thức ăn ngẫu nhiên vào túi đồ.

---

## 🛠️ Cấu Trúc Dự Án

```
DevGotchi/
├── frontend/               # React 19 + TypeScript + Three.js + Tailwind CSS v4 + Zustand
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/
│   │   │   │   └── PetCanvas.tsx       # Bộ dựng 3D Three.js cho 4 thú cưng & animation
│   │   │   ├── StarterSelection.tsx    # Bệ xoay 3D Carousel chọn & đặt tên pet
│   │   │   ├── PetDashboard.tsx        # Màn hình chính nuôi pet & tương tác
│   │   │   ├── PomodoroTimer.tsx       # Đồng hồ tập trung vòng tròn tiến trình
│   │   │   └── FoodTray.tsx            # Khay thức ăn & kiểm tra món khoái khẩu
│   │   ├── store/
│   │   │   └── usePetStore.ts          # Zustand store (lưu trữ localStorage)
│   │   └── data/
│   │       └── petConfigs.ts           # Cấu hình 4 starter pets & items
├── backend/                # NestJS + TypeScript API chuẩn Clean Architecture
│   ├── src/
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts                     # CORS & Global Prefix /api
└── package.json            # Root workspace scripts
```

---

## 🚀 Hướng Dẫn Chạy Dự Án

### Khởi động Frontend:
```bash
npm run dev
# hoặc
npm run dev:frontend
```
Ứng dụng sẽ chạy tại: `http://localhost:5173`

### Khởi động Backend API:
```bash
npm run dev:backend
```
Backend API sẽ chạy tại: `http://localhost:3000/api`
