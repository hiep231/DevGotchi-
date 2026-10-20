# 🐾 Tổng Hợp Tính Năng Hệ Thống DevGotchi

> **DevGotchi** là nền tảng năng suất kết hợp nuôi thú ảo 2D/3D gamified dành cho lập trình viên, tối ưu hóa giao diện **Telegram Web App (TWA) / Mobile-first Web App** theo phong cách thiết kế **Gamified Soft UI (Candy Claymorphism & Sticker Art)**.

---

## 📑 Mục Lục
1. [Nền Tảng & Trải Nghiệm Người Dùng (TWA & Mobile Ergonomics)](#1-nền-tảng--trải-nghiệm-người-dùng-twa--mobile-ergonomics)
2. [Hệ Thống 4 Linh Thú Khởi Đầu (4 Starter Mascots)](#2-hệ-thống-4-linh-thú-khởi-đầu-4-starter-mascots)
3. [Tương Tác Nuôi Pet & Chỉ Số Sinh Tồn (Tamagotchi Mechanics)](#3-tương-tác-nuôi-pet--chỉ-số-sinh-tồn-tamagotchi-mechanics)
4. [Hệ Thống Kho Thức Ăn Công Nghệ (Tech Foods & Inventory)](#4-hệ-thống-kho-thức-ăn-công-nghệ-tech-foods--inventory)
5. [Vòng Lặp Tập Trung Pomodoro Gamified (Productivity Loop)](#5-vòng-lặp-tập-trung-pomodoro-gamified-productivity-loop)
6. [Phòng Thử Nghiệm Linh Thú (Mascot Puppet Animation Studio)](#6-phòng-thử-nghiệm-linh-thú-mascot-puppet-animation-studio)
7. [Kiến Trúc Kỹ Thuật & Luồng Dữ Liệu (Technical Architecture)](#7-kiến-trúc-kỹ-thuật--luồng-dữ-liệu-technical-architecture)
8. [Hệ Thống Kiểm Thử & Đảm Bảo Chất Lượng (Quality Assurance)](#8-hệ-thống-kiểm-thử--đảm-bảo-chất-lượng-quality-assurance)

---

## 1. Nền Tảng & Trải Nghiệm Người Dùng (TWA & Mobile Ergonomics)

* **Thiết Kế Đậm Chất Mini App:** Khung nhìn chuẩn mobile-first (320px – 420px), hỗ trợ full safe-area insets trên iOS/Android Telegram.
* **Ngôn Ngữ Thiết Kế Playful / Gamified Soft UI:**
  * **Nút bấm 3D xúc giác vật lý (`btn-chunky`):** Viền đáy nổi 4px, khi nhấn lún xuống 1px kèm độ nảy tự nhiên.
  * **Thẻ Sticker dập nổi (`card-sticker`):** Viền mực navy đậm `#2D2A4A` (stroke 2px), góc bo tròn mềm mại (`rounded-3xl`), bóng đổ kép êm dịu.
  * **Bảng màu Candy Pastel:** Vàng chuối `#FFD23F`, Xanh bạc hà mint `#4ECCA3`, Hồng dâu coral `#FF6B8B`, Tím nho `#9B5DE5`, Xanh trời `#38B6FF`.
* **Phản Hồi Xúc Giác (Telegram Haptic Feedback):**
  * Chạm nút, vuốt chuyển tab: `impact('light')` / `selection()`.
  * Cho ăn, chọc pet: `impact('medium')`.
  * Chọc liên tục gây chóng mặt: `impact('rigid')`.
  * Hoàn thành phiên Pomodoro, lên cấp (Level Up): `notification('success')`.
* **Typography Chuẩn Tiếng Việt:** Sử dụng font `Nunito` & `Be Vietnam Pro` (subset Vietnamese), hiển thị trọn vẹn dấu thanh không bị lỗi vỡ font glyph.
* **Khả Năng Chống Tràn Giao Diện:** Responsive hoàn hảo trên các màn hình siêu hẹp từ 320px (iPhone SE cũ) đến 390px, 420px mà không bị tràn chữ, vỡ thanh EXP hay nút action.

---

## 2. Hệ Thống 4 Linh Thú Khởi Đầu (4 Starter Mascots)

Mỗi linh thú đại diện cho một vai trò điển hình trong giới công nghệ với thiết kế chibi sticker đặc trưng:

| Linh Thú | Tên & Vai Trò | Tạo Hình & Nhận Diện | Món Khoái Khẩu | Nội Tại (Perk) |
| :--- | :--- | :--- | :--- | :--- |
| 🐡 **Puffy** | **Cá Nóc Biển**<br>*(Product & Data)* | Thân cầu xanh teal-cyan, gai cam mềm, bụng RAM vi mạch vàng, đeo kính tròn tri thức. | 🦐 Tôm Debug | Nhận thêm +20% EXP cho các phiên làm việc Data / Product. |
| 🦕 **Dino / Golemy** | **Khủng Long Coder**<br>*(Software Engineer)* | Thân xanh bạc hà mint, 3 vây lưng kem, đội mũ lưỡi trai ngược có dán sticker laptop. | 🐳 Thạch Docker | Tăng độ bền năng lượng, giảm tốc độ tiêu hao Energy khi code lâu. |
| 🐱 **Bytey** | **Mèo Cyber**<br>*(UI/UX & Design)* | Thân tím lavender, tai nhọn lót hồng, đeo headphone gaming, đuôi uốn hình dấu ngoặc `{`. | 🐟 Bánh Cá RAM | Tăng tỉ lệ nhận rơi thêm thức ăn hiếm sau mỗi phiên Pomodoro. |
| 🐙 **Octy** | **Bạch Tuộc Git**<br>*(QA & Bug Hunter)* | Thân hồng san hô coral, 4 xúc tu uốn lượn có giác hút kem, đốm bọ bug, cầm kính lúp soi bug. | 🍩 Donut Espresso | Nhân đôi chỉ số Hạnh phúc khi giải quyết các task dán nhãn `#Bugfix`. |

---

## 3. Tương Tác Nuôi Pet & Chỉ Số Sinh Tồn (Tamagotchi Mechanics)

### 3.1. Các Chỉ Số Sức Khỏe (Vitals)
* **🍖 Đói bụng (Hunger: 0 – 100):** Tự động giảm dần theo thời gian nếu không được chăm sóc. Hồi phục khi được cho ăn.
* **⚡ Năng lượng (Energy: 0 – 100):** Tiêu hao dần sau các phiên tập trung làm việc. Hồi phục khi đưa pet vào trạng thái Ngủ.
* **💖 Hạnh phúc (Happiness: 0 – 100):** Tăng khi được cho ăn món yêu thích (+15 điểm thưởng khoái khẩu), tăng khi vuốt ve, chọc ghẹo (+3 điểm).
* **⭐ Cấp độ & Kinh nghiệm (Level & EXP):** 
  * Cấp 1 lên Cấp 2: 100 EXP.
  * Các cấp tiếp theo: $\text{maxExp} = \text{round}(\text{prevMaxExp} \times 1.35)$.
* **🔥 Chuỗi Ngày (Streak):** Ghi nhận số ngày tập trung liên tục để duy trì thói quen làm việc năng suất.

### 3.2. Hành Động Tương Tác
* **Chọc / Vuốt ve (Poke & Pet):** Nhấn chuột hoặc chạm tay vào pet kích hoạt hiệu ứng nảy co giãn vật lý (*squash & stretch bounce*) và tăng điểm hạnh phúc.
* **Đi Ngủ (Toggle Sleep):** Đưa linh thú vào giấc ngủ với hiệu ứng bọt ngủ `Zzz`, chuyển đổi ánh sáng sân khấu sang ban đêm để phục hồi thể lực.
* **Gặp Bug & Chóng Mặt (Dizzy Mode):** Nhấn liên tục hoặc ấn nút thử thách bug khiến mắt xoay tít vòng lốc xoáy hài hước, kèm câu thoại than thở lập trình viên.
* **Hộp Thoại Tâm Sự (AI Speech Speech-Bubble):** Pet phát biểu các câu thoại động viên theo ngữ cảnh tâm trạng (Happy, Hungry, Sleepy, Dizzy) bằng tiếng Việt tự nhiên.
* **Đổi Thú Cưng (Reset Pet):** Cho phép đặt lại linh thú để nhận nuôi một người bạn đồng hành mới bất kỳ lúc nào.

---

## 4. Hệ Thống Kho Thức Ăn Công Nghệ (Tech Foods & Inventory)

Tất cả món ăn được minh họa theo phong cách **Flat Vector Game Sticker** (viền navy `#1B2A4A`, bóng đất phẳng, mặt kawaii nhấp nháy, highlight trắng hình con nhộng):

1. **🦐 Tôm Debug (Debug Shrimp):** Tôm hồng mũm mĩm ôm râu, biểu cảm tươi cười, món ruột của chuyên gia săn bug.
2. **🐟 Bánh Cá RAM (RAM Taiyaki):** Bánh nướng vàng ươm in vân thanh RAM máy tính chân mạ vàng.
3. **🐳 Thạch Docker (Docker Jelly):** Khối thạch rau câu xanh ngọc hình chú cá voi chở container mát lạnh.
4. **🍩 Donut Espresso (Espresso Donut):** Bánh vòng phủ sốt cà phê mocha đậm đà rắc kẹo cốm tiếp sức chạy deadline.
5. **🥟 Bánh Bao Bug:** Bánh bao trắng sữa nóng hổi với các đốm bọ cánh cứng bốc hơi nghi ngút.
6. **🍜 Mì Ly Terminal:** Cốc mì ăn liền đỏ vàng mở nắp, làn khói bốc lên uốn thành ký tự `>_`.
7. **🧋 Trà Sữa Sét:** Ly trà sữa trân châu vuông hình khối mang biểu tượng tia chớp năng lượng.
8. **🍙 Cơm Nắm Git Branch:** Cơm nắm tam giác quấn lá rong biển tạo hình nhánh cây phân nhánh Git.

* **Hoạt Ảnh Cho Ăn Mượt Mà:** Chọn món ➔ Món ăn bay bổng phát sáng hào quang ➔ Pet há miệng đớp trọn ➔ Nảy người sung sướng kèm hiệu ứng hạt sao lấp lánh.
* **Ngăn Tràn Chữ Thông Minh:** Giao diện khay hiển thị số lượng badge nhỏ gọn, tên món và chỉ số hồi phục được bố trí ngăn nắp, chống tràn chữ 100%.

---

## 5. Vòng Lặp Tập Trung Pomodoro Gamified (Productivity Loop)

Biến thời gian tập trung làm việc của coder thành tài nguyên nuôi dưỡng linh thú:

* **3 Chế Độ Đồng Hồ Tiêu Chuẩn:**
  * **Focus:** 25 phút tập trung cao độ.
  * **Short Break:** 5 phút nghỉ ngơi thư giãn.
  * **Long Break:** 15 phút nạp lại năng lượng sau 4 chu kỳ.
* **Gắn Thẻ Công Việc (Task Tags):** Cho phép lập trình viên dán nhãn phiên làm việc:
  * `#Frontend`, `#Backend`, `#Bugfix`, `#Design`, `#LeetCode`, `#Review`.
* **Giao Diện Đồng Hồ SVG Tròn:**
  * Vòng tròn tiến trình SVG mịn màng với gradient kẹo ngọt.
  * Bộ đếm thời gian số to rõ ràng dạng `MM:SS`.
  * Cụm nút điều khiển vật lý: **Bắt đầu / Tạm dừng**, **Đặt lại**, **Bỏ qua phiên**.
* **Phần Thưởng Hoàn Thành Phiên:**
  * Thưởng ngay **100 Base EXP** + Bonus chỉ số theo linh thú.
  * Tăng chuỗi Streak ngày.
  * **Rơi Thức Ăn Ngẫu Nhiên (Loot Drop Table):** Tự động tặng thêm thức ăn vào khay kho đồ.
  * Kích hoạt pháo hoa giấy **Confetti** rực rỡ và rung thông báo Telegram.

---

## 6. Phòng Thử Nghiệm Linh Thú (Mascot Puppet Animation Studio)

Trang Studio chuyên biệt (kích hoạt bằng nút `✨` trên thanh tiêu đề) mô phỏng linh thú hoạt họa rối 2D vector thời gian thực:

* **Đồng Bộ Tự Động 100% với Dashboard:** 
  * Đang nuôi **Dino** ➔ Mở Studio hiển thị ngay **Dino**.
  * Đang nuôi **Bytey** ➔ Mở Studio hiển thị ngay **Bytey**.
  * Đang nuôi **Octy** ➔ Mở Studio hiển thị ngay **Octy**.
  * Đang nuôi **Puffy** ➔ Mở Studio hiển thị ngay **Puffy**.
  * Người dùng vẫn có thể click đổi linh thú tự do để xem thử các bé khác.
* **Tương Tác Theo Dõi Con Trỏ (Look-at & Eye Tracking):**
  * Đồng tử mắt di chuyển theo vị trí chuột trên desktop hoặc điểm chạm cảm ứng trên điện thoại.
  * Giới hạn di chuyển đồng tử tự nhiên (Clamp 12% bán kính mắt) chống méo hình.
* **Hiệu Ứng Nghiêng Đa Tầng Parallax:**
  * Các tầng (Bóng chân, Thân, Đầu, Mắt, Phụ kiện mũ/tai nghe/kính lúp) trượt lệch pha tạo chiều sâu 2.5D.
  * Hỗ trợ cảm biến con quay hồi chuyển (`DeviceOrientation` / Gyroscope) trên điện thoại thật.
* **Hiệu Ứng Thở & Lơ Lửng Bồng Bềnh (Idle Breathing & Floating):** Chuyển động hàm Sin uốn lượn nhịp nhàng giúp nhân vật luôn sống động.
* **Chớp Mắt Tự Động (Auto-Blink):** Thuật toán kích hoạt nhắm mắt ngẫu nhiên sau mỗi 3 – 5 giây.
* **Chuyển Đổi 6 Biểu Cảm (Mood Swapping):**
  * `idle`: Bình thường tươi tắn.
  * `happy`: Cười tít mắt dạng cung tròn (^ ^), ửng hồng gò má.
  * `hungry`: Mắt nheo đói bụng, thèm ăn.
  * `sleepy`: Mắt lim dim, bong bóng ngủ `Zzz`.
  * `focus`: Biểu cảm nghiêm túc ngọn lửa nhiệt huyết.
  * `dizzy`: Mắt xoáy trôn ốc khi bị chọc quá nhiều.
* **Thanh Trượt Mô Phỏng Vuốt Carousel (Swipe Tilt & Gaze):** Cho phép kéo trượt từ -100% đến +100% để kiểm tra độ nghiêng đầu và liếc mắt khi chuyển trang.

---

## 7. Kiến Trúc Kỹ Thuật & Luồng Dữ Liệu (Technical Architecture)

```
DevGotchi Monorepo
│
├── frontend/ (Vite + React 19 + TypeScript + Tailwind CSS v4)
│   ├── src/components/
│   │   ├── 3d/                 # Bộ dựng 3D WebGL Three.js & hoạt ảnh Canvas
│   │   ├── mascot/             # Puppet Engine 2D SVG: Parallax, EyeTracking, Breathing
│   │   ├── icons/              # Bộ SVG Sticker 8 món ăn công nghệ độc quyền
│   │   ├── ui/                 # Nút Chunky 3D, Thanh ProgressBar kẹo ngọt, IconButton
│   │   ├── StarterSelection    # Bệ xoay Carousel 3D chọn linh thú lúc bắt đầu
│   │   ├── PetDashboard        # Màn hình chính điều khiển và nuôi dưỡng
│   │   ├── FoodTray            # Khay chứa thức ăn và cơ chế đớp mồi
│   │   └── PomodoroTimer       # Bộ đếm năng suất Pomodoro dán nhãn công việc
│   ├── src/store/              # Zustand atomic stores (usePetStore, useTimerStore)
│   ├── src/hooks/              # TanStack Query (usePetQuery, useAdoptPet, useFeedPet)
│   └── src/utils/              # Telegram WebApp SDK helpers & haptic feedback wrappers
│
├── backend/ (NestJS + TypeScript - Clean Architecture)
│   ├── src/modules/
│   │   ├── pet/                # Quản lý hồ sơ pet, adopt, reset, decay stats
│   │   ├── session/            # Quản lý phiên làm việc, tính toán EXP, Level, Streak
│   │   ├── food/               # Quản lý danh mục và kho thức ăn
│   │   └── ai/                 # Endpoint sinh câu thoại động viên lập trình viên
│   └── src/main.ts             # CORS, Global Validation Pipe, Prefix /api
│
└── tests/ (E2E Test Suites - Chrome DevTools Protocol & Jest)
    ├── test-studio-sync.mjs    # Test xác minh đồng bộ 4 linh thú giữa Dashboard và Studio
    ├── verify-all-mascots.mjs  # Test render visual 4 mascot vector
    ├── header-widths.mjs       # Test kiểm tra layout không vỡ trên màn 320px - 390px
    └── journey-test.mjs        # Test trọn vẹn luồng Adopt -> Feed -> Poke -> Focus
```

---

## 8. Hệ Thống Kiểm Thử & Đảm Bảo Chất Lượng (Quality Assurance)

Dự án duy trì cam kết **Zero-Breaking-Change** và kiểm thử tự động nghiêm ngặt:

1. **Kiểm Tra Biên Dịch Type-Safe:** Lệnh `npm --prefix frontend run build` (`tsc && vite build`) luôn đảm bảo **Exit code 0** không có bất kỳ lỗi TypeScript Strict Mode nào.
2. **Kiểm Thử Backend Unit Tests:** `pet.service.spec.ts` và `session.service.spec.ts` kiểm tra độ chính xác của các công thức tăng trưởng EXP, tính toán streak và trừ năng lượng.
3. **Kiểm Thử Trực Quan Headless Chrome (CDP Testing):**
   * Tự động khởi chạy Chrome không đầu (Headless mode).
   * Đo đạc kích thước bounding box chống tràn trên mobile viewport `420x860` và `320x640`.
   * Chụp ảnh màn hình đối soát kết quả trực quan (Visual regression artifacts).
