# DevGotchi: Bản Đặc Tả Ý Tưởng, Gameplay & Kiến Trúc Kỹ Thuật Toàn Diện

> **Dự án:** DevGotchi  
> **Lĩnh vực:** Productivity & Virtual Pet RPG for Developers  
> **Phiên bản:** 1.0.0 (MVP)  
> **Ngày cập nhật:** 19/10/2026  

---

## 1. TỔNG QUAN DỰ ÁN & TẦM NHÌN (VISION & ELEVATOR PITCH)

* **Tên dự án:** **DevGotchi** (*Code, Focus & Level-up your Pet*)
* **Elevator Pitch:** DevGotchi là ứng dụng nuôi thú ảo 3D tăng năng suất làm việc, biến mỗi phiên Pomodoro tập trung và commit code của lập trình viên thành thức ăn và chỉ số tiến hóa cho linh thú kỹ thuật số. Ứng dụng giải quyết triệt để thói quen trì hoãn, cảm giác cô đơn và burnout bằng vòng lặp phản hồi tích cực mang đậm phong cách RPG.
* **Phong cách thẩm mỹ (Aesthetic DNA):** Stylized Chibi / Clay-like 3D Cartoon (khối tròn trĩnh, bề mặt mềm mịn như đất nặn/cao su, màu sắc pastel rực rỡ, biểu cảm meme ngộ nghĩnh).

---

## 2. BỘ TỨ LINH THÚ 3D KHỞI ĐẦU (THE 4 STARTER PETS)

| Linh Thú | Hình tượng & Phong cách | Thức ăn khoái khẩu | Kỹ năng bị động (Passive Perk) | Biểu cảm độc quyền |
| :--- | :--- | :--- | :--- | :--- |
| **🐡 Puffy** | **Cá Nóc Biển** (*The Bug Hunter*)<br>Thân cầu xanh biển (`#38bdf8`), bụng vàng bơ nhạt, gai cao su mềm mại, miệng tròn O-shape hồng san hô. | **Tôm Debug (🦐)** | +20% EXP khi hoàn thành phiên Pomodoro ngắn (15–25 phút). | **Dizzy / Buggy Mode:** Mắt xoáy ốc 360 độ liên tục khi gặp bug hoặc quá tải deadline. |
| **🐱 Bytey** | **Mèo Cyber** (*The Frontend Ninja*)<br>Mèo tím hạt đậu (`#c084fc`), tai nhọn, đuôi là cáp sạc USB đổi màu theo tâm trạng. | **Bánh Cá RAM (🐟)** | Nhân đôi điểm Hạnh phúc (Happiness) khi duy trì chuỗi Streak 3 ngày liên tục. | **Lofi Focus:** Đeo headphone chụp tai, gật gù theo nhạc khi chủ nhân làm việc. |
| **🪨 Golemy** | **Khối Đá Server** (*The Backend Architect*)<br>Khối lập phương bo tròn xanh rêu (`#34d399`), mầm cây non đung đưa trên đỉnh, mắt LED phát sáng. | **Thạch Docker (🧊)** | +25% EXP cho các phiên Deep Work dài (>45 phút). | **Rock Solid:** Trầm tĩnh, lì lợm trước lỗi 500; nảy tưng bừng và mầm cây nở hoa khi xong mục tiêu lớn. |
| **🐙 Octy** | **Bạch Tuộc Git** (*The Fullstack Kraken*)<br>Thân cầu hồng dâu (`#fb7185`), xúc tu uốn lượn nhịp nhàng. | **Donut Espresso (🍩)** | Hồi năng lượng Energy nhanh hơn 15% sau mỗi giờ nghỉ giải lao (Short Break). | **Multitasker:** Các xúc tu gõ liên hồi trên bàn phím ảo lơ lửng, quấn rối vào nhau khi burnout. |

---

## 3. CƠ CHẾ GAMEPLAY & CÔNG THỨC TOÁN HỌC (GAMIFICATION & BALANCING)

### 3.1. Vòng lặp Pomodoro Focus Loop
* **Chế độ:** Focus (25m), Nghỉ ngắn (5m), Nghỉ dài (15m).
* **Tag công việc:** `#Frontend`, `#Backend`, `#Bugfix`, `#LeetCode`, `#Design`.
* **Công thức EXP:**  
  $$\text{EXP}_{\text{base}} = \text{durationMinutes} \times 4$$  
  *(25m Focus = 100 EXP; 50m Focus = 200 EXP)*. Áp dụng thêm hệ số buff của từng linh thú.

### 3.2. Công thức thăng cấp (Level Progression)
* Level 1 ➔ 2: 100 EXP.
* Ngưỡng EXP các cấp tiếp theo tăng theo hàm mũ 1.35x:  
  $$\text{maxExp}_N = \text{round}(\text{maxExp}_{N-1} \times 1.35)$$

### 3.3. Cơ chế sinh tồn & Suy giảm chỉ số (Vitals Decay)
1. **Hunger (No bụng - 0–100):** Giảm 5 điểm sau mỗi 2 tiếng không có phiên làm việc.
2. **Energy (Năng lượng - 0–100):** Tiêu hao 10 điểm sau mỗi phiên Pomodoro. Hồi phục bằng chế độ ngủ (`toggleSleep`) hoặc rest.
3. **Happiness (Hạnh phúc - 0–100):** Giảm 5 điểm mỗi 24h nếu bị bỏ bê. Tăng khi cho ăn (+10–25) và chọc/vuốt ve (+3).
* **Hiệu ứng Món ăn khoái khẩu:** Tặng thêm **+15 No** và **+15 Vui** khi pet được ăn đúng món yêu thích.

### 3.4. Bảng rơi thức ăn (Loot Table)
* 🦐 **Tôm Debug:** Hồi 30 No, 15 Vui (Tỷ lệ 40%)
* 🐟 **Bánh Cá RAM:** Hồi 25 No, 20 Vui (Tỷ lệ 30%)
* 🧊 **Thạch Docker:** Hồi 35 No, 10 Vui (Tỷ lệ 20%)
* 🍩 **Donut Espresso:** Hồi 20 No, 25 Vui (Tỷ lệ 10%)
* **Level-Up Bonus:** Rơi ngay một Rương tiệc tùng chứa 3 món ăn ngẫu nhiên.

### 3.5. Cơ chế Viral Retention: Dynamic GitHub Readme Badge
* Cung cấp URL động dạng SVG: `GET /api/badge/:username.svg`.
* Cho phép dev nhúng ảnh Pet kèm cấp độ, streak trực tiếp vào GitHub Profile README.

---

## 4. KIẾN TRÚC KỸ THUẬT (TECHNICAL ARCHITECTURE)

### 4.1. Frontend Architecture
* **Framework:** React 19 + TypeScript (Strict Mode) + Vite.
* **Styling:** Tailwind CSS v4.
* **Đồ họa 3D WebGL:** Three.js
  * Dựng khối thủ tục (Procedural Meshes: Spheres, Beveled Cubes, Torus Lips, Rubber Spikes).
  * Ánh sáng chuẩn Studio Clay: AmbientLight + DirectionalLight (Key) + FillLight + RimLight.
  * Vật liệu mềm: `THREE.MeshStandardMaterial` (roughness: 0.25–0.35, metalness: 0.05–0.1).
  * Tương tác chuột: Parallax Look-at mượt mà qua hàm lerp.
  * Hoạt ảnh tương tác: Nảy co giãn (*squash & stretch* khi poke), quỹ đạo thức ăn bay (*feeding arc*), mắt xoáy khi gặp bug.
* **Quản lý dữ liệu đa tầng:**
  * **Server State & Caching:** TanStack Query (`@tanstack/react-query`) quản lý API queries, mutations, cache invalidation và cơ chế sync.
  * **UI & High-Frequency Animation State:** Zustand quản lý timer ticks, key trigger animation 3D và bong bóng thoại.
  * **Offline-First:** Tự động fallback và lưu trữ liên tục xuống `localStorage` (`devgotchi_pet_state_v1`).

### 4.2. Backend Architecture
* **Framework:** NestJS (Node.js, TypeScript).
* **Kiến trúc:** Clean Architecture phân tách rõ rệt: `Controllers` (Routing/Status), `Services` (Nghiệp vụ game), `DTOs` (Validation qua `class-validator`), `Prisma Modules` (Persistence).
* **Database:** PostgreSQL + Prisma ORM.
* **AI Integration:** Google Gemini 2.5 Flash API sinh câu thoại ngắn của thú cưng theo thời gian và chủ đề công việc.

---

## 5. BỘ QUY CHUẨN, SKILLS & WORKFLOWS ĐÃ TÍCH HỢP
1. `AGENTS.md`: Bộ quy tắc tối cao cho toàn bộ lập trình viên và AI agent.
2. `.agents/skills/devgotchi-architecture`: Sổ tay hướng dẫn phân tầng kiến trúc và dữ liệu.
3. `.agents/skills/pet-3d-creation`: Quy trình dựng mô hình và animation 3D procedural trong Three.js.
4. `.agents/skills/pomodoro-gamification`: Công thức cân bằng toán học, EXP và tỷ lệ rơi thức ăn.
5. `.agents/skills/backend-api-pipeline`: Chuẩn thiết kế module NestJS và tích hợp AI Gemini.
6. `.agents/workflows/`: Quy trình phát triển tính năng mới, quy trình thêm pet mới và kiểm thử chất lượng 4 tầng.
