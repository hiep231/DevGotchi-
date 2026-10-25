---
name: qa-testing
description: >-
  Use this skill when designing test plans, writing unit/e2e tests, verifying
  game mechanics, validating hunger decay, testing Telegram bot interactions,
  or running regression tests across DevGotchi.
---

# DevGotchi QA & Testing Verification Skill

Use this skill to execute structured manual and automated Quality Assurance (QA) verification across the DevGotchi platform.

---

## 🧪 1. Danh Mục Test Case Trọng Tâm (Core QA Test Matrix)

### Test Suite 1: Thú Cưng & Cơ Chế Sinh Lực (Vitals & Decay)
| Mã Test | Mô tả kịch bản | Kết quả mong đợi | Phương pháp kiểm tra |
| :--- | :--- | :--- | :--- |
| **TC-VIT-01** | Độ đói tự động giảm theo thời gian | Giảm đúng 5 điểm mỗi 2.4 giờ; sau 48h giảm trọn vẹn 100 điểm | Đặt `lastFedAt` lùi 24h $\to$ hunger giảm đúng 50 điểm |
| **TC-VIT-02** | Chặn cho ăn khi no bụng (100/100) | Báo toast cảnh báo "Bé đã no căng bụng", không trừ thức ăn | Cho ăn liên tục tới 100 $\to$ nút ăn chuyển trạng thái chặn |
| **TC-VIT-03** | Uống Nước Lọc Dev (`water`) | Tăng +10 Hunger, +5 Happiness, +5 Energy; số lượng nước vẫn là $\infty$ | Cho uống nước 5 lần liên tục $\to$ kho vẫn còn 999 |
| **TC-VIT-04** | Ngủ & Sạc Năng Lượng (`/sleep`) | Năng lượng sạc đầy 100/100, pet chuyển sang tư thế nhắm mắt ngủ | Bấm nút ngủ trên Web App hoặc gõ `/sleep` trên Bot |

### Test Suite 2: Mini-Game 30s ("Bắt Bug Xả Stress")
| Mã Test | Mô tả kịch bản | Kết quả mong đợi | Phương pháp kiểm tra |
| :--- | :--- | :--- | :--- |
| **TC-GAME-01** | Bộ đếm thời gian 30s | Đồng hồ chạy từ 30s về 0s, thanh bar co dần đều đặn | Bấm Bắt Đầu Chơi $\to$ quan sát đếm ngược |
| **TC-GAME-02** | Chạm tap diệt bug & tính điểm | Điểm tăng theo loại bọ, tap nhanh $< 0.9s$ kích hoạt Combo $x2, x3$ | Tap liên tục vào bọ thường, boss bug |
| **TC-GAME-03** | Trao thưởng chiến lợi phẩm | Bắt $\ge 20$ bug: tặng Thạch Docker / Donut + EXP; cộng vào kho đồ | Kết thúc 30s $\to$ kiểm tra kho `FoodTray` và database |
| **TC-GAME-04** | Hiệu năng mượt mà (60 FPS) | Không giật lag, hủy bỏ toàn bộ animation frame và timer khi đóng tab | Bật Performance tab trên DevTools kiểm tra memory leak |

### Test Suite 3: Pomodoro & Thăng Cấp (Progression & EXP)
| Mã Test | Mô tả kịch bản | Kết quả mong đợi | Phương pháp kiểm tra |
| :--- | :--- | :--- | :--- |
| **TC-POM-01** | Hoàn thành phiên Pomodoro 25m | Nhận 100 EXP (+ perk nhân vật), rơi đồ ăn ngẫu nhiên | Gọi `POST /api/sessions/complete` với 25m |
| **TC-POM-02** | Thăng cấp Level khi đủ EXP | Level tăng +1, `maxExp` nhân hệ số 1.35, pháo hoa giấy nổ | Nạp đủ 100 EXP ở Level 1 $\to$ lên Level 2 (maxExp 135) |

### Test Suite 4: Telegram Bot & Web App Parity
| Mã Test | Mô tả kịch bản | Kết quả mong đợi | Phương pháp kiểm tra |
| :--- | :--- | :--- | :--- |
| **TC-BOT-01** | Lệnh `/pet` và `/bag` | Trả về thông số chính xác từ database Supabase | Gõ `/pet` trên Telegram, so sánh với Web App |
| **TC-BOT-02** | Lệnh `/game` và `/play` | Gửi hướng dẫn chơi và nút mở Web App mini-game | Gõ `/game` trên Telegram |
| **TC-BOT-03** | AI Chat thông minh | Trả về câu thoại sinh động theo tính cách pet, không lặp quote | Nhắn tin bất kỳ cho Bot (vd: "hôm nay mệt quá") |

---

## 🛠️ 2. Lệnh Tự Động Kiểm Thử Trước Khi Bàn Giao

Trước khi báo cáo hoàn thành cho người dùng:
1. **Kiểm tra Frontend Build:**
   ```bash
   npm run build:frontend
   ```
   *Yêu cầu:* Phải ra Exit code 0, không có lỗi TypeScript.
2. **Kiểm tra Backend Build:**
   ```bash
   npm run build:backend
   ```
   *Yêu cầu:* Nest build thành công, Prisma client biên dịch chuẩn.
3. **Chạy Unit Test Backend:**
   ```bash
   powershell -Command "cd backend; npm test"
   ```
