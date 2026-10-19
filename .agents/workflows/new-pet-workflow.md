# Workflow: Quy Trình Thêm Linh Thú 3D Mới (New 3D Pet Onboarding Workflow)

Tài liệu này hướng dẫn chi tiết quy trình từng bước để đưa một linh thú 3D mới vào DevGotchi (ví dụ: *DevDoggo, RustCrab, PythonSnake...*).

---

## 🐾 Checklist 5 Bước Thêm Pet Mới

### 1. Khai Báo Kiểu Dữ Liệu
Mở `frontend/src/types/pet.ts`:
* Thêm ID linh thú mới vào `PetType` (VD: `'RUST_CRAB'`).

### 2. Thiết Lập Cấu Hình Linh Thú
Mở `frontend/src/data/petConfigs.ts`:
* Thêm một phần tử vào mảng `STARTER_PETS`:
  * `id`: Khớp với `PetType`.
  * `name`: Tên ngắn gọn (VD: `"Ferris"`).
  * `species`: Loài (VD: `"Cua Rust (The Memory Guardian)"`).
  * `archetype`: Vai trò chuyên môn (VD: `"Systems & Performance"`).
  * `tagline`: Câu châm ngôn hài hước.
  * `description`: Mô tả tạo hình và tính cách.
  * `primaryColor`, `secondaryColor`, `accentColor`: Bảng màu pastel.
  * `favoriteFood`: Món ăn khoái khẩu.
  * `passivePerk`: Kỹ năng bị động khi làm việc.
  * `stats`: Chỉ số `focusBonus`, `decayResistance`, `initialHappiness`.

### 3. Dựng Mô Hình 3D Thủ Tục (Procedural Mesh)
Mở `frontend/src/components/3d/PetCanvas.tsx`:
* Thêm khối `else if (type === 'RUST_CRAB')` bên trong hàm `buildPetMesh()`:
  * Thân chính: Sử dụng hình khối cơ bản bo tròn (`SphereGeometry` hoặc `CylinderGeometry`).
  * Phụ kiện / Chi tiết: Thêm mắt, tai, càng hoặc cánh nhỏ.
  * Kết nối ánh xạ mắt: Gọi `addCuteEyes(...)` hoặc tự viết hàm tạo mắt hỗ trợ các trạng thái `mood` (`HAPPY`, `DIZZY`, `SLEEPING`).

### 4. Thử Nghiệm Trên Giao Diện Chọn Thú (Starter Carousel)
1. Chạy `npm run dev` và mở `http://localhost:5173`.
2. Chuyển sang màn hình chọn pet (hoặc bấm "Đổi thú cưng").
3. Bấm nút mũi tên `<` và `>` để kiểm tra:
   - Pet có xoay theo con trỏ chuột mượt mà không.
   - Thẻ thông số có hiển thị đúng màu chủ đạo và buff bị động không.
   - Nhập tên thử và bấm "Nhận nuôi" xem có chuyển vào Dashboard thành công không.

### 5. Kiểm Thử Vòng Lặp Nuôi Thú
1. Trong Dashboard:
   - Thử bấm nút "Chọc bé" ➔ Kiểm tra phản hồi nảy co giãn (squash & stretch).
   - Thử bấm "Gặp Bug @@" ➔ Kiểm tra mắt xoáy hoặc hoạt ảnh bối rối.
   - Thử cho ăn món khoái khẩu ➔ Kiểm tra thông báo thưởng điểm "Khoái khẩu!".
   - Chạy thử 1 phiên Focus ➔ Kiểm tra nhận EXP và tăng cấp.
