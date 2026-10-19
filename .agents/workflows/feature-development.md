# Workflow: Chu Trình Phát Triển Tính Năng (Feature Development Workflow)

Mỗi khi bổ sung hoặc cập nhật tính năng mới trong dự án DevGotchi, toàn bộ team và AI agent cần tuân thủ nghiêm ngặt 5 bước sau:

---

## 📋 Bước 1: Phân Tích & Đặc Tả Yêu Cầu (Requirements & Spec)
1. Xác định rõ tính năng thuộc phạm vi **Frontend (UI/3D/Zustand)** hay **Backend (API/DB/AI)** hay **Fullstack**.
2. Kiểm tra xem có ảnh hưởng đến cấu trúc dữ liệu thú cưng (`PetState`) đã lưu trữ trên trình duyệt của người dùng không.
3. Nếu có schema mới, đảm bảo có giá trị mặc định (`fallback defaults`) để không làm crash tài khoản hiện tại.

---

## 💻 Bước 2: Triển Khai Mã Nguồn (Implementation)
1. **Frontend**:
   - Khai báo kiểu TypeScript rõ ràng trong `frontend/src/types/`.
   - Nếu có quản lý trạng thái, cập nhật store trong `frontend/src/store/`.
   - Viết component dạng module hóa, sử dụng Tailwind CSS v4.
2. **Backend**:
   - Luôn tạo thư mục module riêng: `dto/`, `controller`, `service`, `module`.
   - Bắt buộc validate dữ liệu đầu vào bằng `class-validator` DTOs.

---

## 🎨 Bước 3: Kiểm Tra Tương Tác 3D & Hiệu Năng (3D WebGL Verification)
1. Đảm bảo FPS không bị sụt giảm khi mở nhiều tab hoặc chạy lâu.
2. Kiểm tra chuột parallax (di chuột khắp màn hình xem pet có quay mặt theo tự nhiên không).
3. Kiểm tra các hiệu ứng nảy (squash & stretch), hoạt ảnh cho ăn và biểu cảm mood.

---

## 🛡️ Bước 4: Kiểm Thử Build & Chất Lượng (Quality Gate)
Trước khi bàn giao hoặc tạo commit, bắt buộc chạy lệnh kiểm tra build:

```bash
# Kiểm tra build Frontend (Type-check + Bundling)
npm --prefix frontend run build

# Kiểm tra build Backend
npm --prefix backend run build
```
Cả hai lệnh phải kết thúc với **mã thoát 0 (Exit code 0)** và không có bất kỳ lỗi linter/type error nào.

---

## 📦 Bước 5: Commit Chuẩn Hóa (Conventional Commits)
Sử dụng format chuẩn:
- `feat: ...` (Tính năng mới)
- `fix: ...` (Sửa lỗi)
- `perf: ...` (Tối ưu hiệu năng 3D/render)
- `refactor: ...` (Tái cấu trúc mã nguồn)
- `docs: ...` (Cập nhật tài liệu/hướng dẫn)
