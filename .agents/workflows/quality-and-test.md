# Workflow: Quy Trình Kiểm Thử & Đảm Bảo Chất Lượng (Quality & Test Workflow)

Mục đích: Đảm bảo nền tảng DevGotchi luôn ổn định, không rò rỉ bộ nhớ WebGL và không có lỗi TypeScript trước khi bàn giao.

---

## 🔍 Checklist Kiểm Thử 4 Tầng

### Tầng 1: Static Type Check & Bundling
Chạy lệnh kiểm tra độc lập cho cả hai dự án:
```bash
# Frontend Type check & Rollup bundling
npm --prefix frontend run build

# Backend NestJS TypeScript compilation
npm --prefix backend run build
```
👉 *Bắt buộc: Cả 2 lệnh phải build thành công 100%.*

---

### Tầng 2: WebGL 3D Performance & Memory Leak Check
1. **Kiểm tra FPS:**
   - Mở Chrome DevTools (`F12` ➔ `Rendering` ➔ `Frame Rendering Stats`).
   - Đảm bảo FPS luôn duy trì ổn định ở mức ~60 FPS.
2. **Kiểm tra Memory Leaks:**
   - Đổi thú cưng liên tục 5-10 lần trên màn hình Carousel.
   - Quan sát tab Memory trong DevTools xem số lượng WebGL Geometries và Materials có được giải phóng sạch sẽ khi component unmount không.
   - Đảm bảo hàm cleanup trong `useEffect` của `PetCanvas.tsx` luôn gọi `renderer.dispose()` và `cancelAnimationFrame()`.

---

### Tầng 3: Persistence & Offline Fallback Check
1. Nhận nuôi một thú cưng và đổi tên thành một tên tùy ý (VD: `"MyPuffy"`).
2. Tăng EXP bằng cách bấm hoàn thành một phiên Pomodoro.
3. Cho ăn 2 con Tôm Debug để số lượng tôm giảm từ 5 xuống 3.
4. Tải lại trang (`F5` / `Ctrl+R`).
5. **Kỳ vọng:** Toàn bộ tên, cấp độ, thanh no bụng và số lượng thức ăn còn lại phải được phục hồi nguyên vẹn từ `localStorage`.

---

### Tầng 4: Cross-Platform & Responsive Check
1. Kiểm tra trên màn hình máy tính để bàn (Desktop >= 1200px).
2. Kiểm tra trên màn hình máy tính bảng (Tablet 768px - 1024px).
3. Kiểm tra trên chế độ giả lập điện thoại di động (Mobile 375px - 414px).
4. Đảm bảo vòng tròn Pomodoro và khung 3D tự động co dãn vừa vặn, không bị tràn màn hình ngang.
