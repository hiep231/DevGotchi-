---
name: database-migration
description: >-
  Use this skill when modifying Prisma schemas, executing Supabase database
  migrations, seeding starter items/pets, or handling data persistence
  without breaking existing user records in DevGotchi.
---

# DevGotchi Database & Migration Skill

Use this skill when managing the PostgreSQL database (via Supabase & Prisma ORM) for DevGotchi.

---

## 🗄️ 1. Nguyên Tắc Bảo Toàn Dữ Liệu (Zero-Data-Loss Principles)

1. **Không Drop Bảng hoặc Cột Đang Chứa Dữ Liệu:**
   - Thay vì xóa cột, đánh dấu `@deprecated` hoặc chuyển trường sang tùy chọn (`optional?`).
2. **Giá Trị Mặc Định An Toàn (Safe Defaults):**
   - Khi thêm cột mới vào bảng `Pet` hoặc `User`, luôn cung cấp `@default(...)` hợp lệ (vd: `energy Int @default(85)`).
3. **Upsert cho Túi Đồ (Inventory Upsert):**
   - Luôn sử dụng upsert hoặc kiểm tra tồn tại khi cấp thức ăn cho người dùng, tránh tạo trùng bản ghi.

---

## 🔄 2. Quy Trình Cập Nhật Schema (Migration Workflow)

Khi cần thay đổi `backend/prisma/schema.prisma`:

### Bước 1: Chỉnh sửa schema
Cập nhật file `backend/prisma/schema.prisma`.

### Bước 2: Tạo migration an toàn
```bash
powershell -Command "cd backend; npx prisma migrate dev --name <migration_name>"
```
*Lưu ý:* Nếu chạy trên môi trường production/CI:
```bash
powershell -Command "cd backend; npx prisma migrate deploy"
```

### Bước 3: Tạo lại Prisma Client
```bash
powershell -Command "cd backend; npx prisma generate"
```

### Bước 4: Kiểm tra đồng bộ TypeScript
Sau khi generate, build lại backend để đảm bảo không có file nào bị lệch type:
```bash
powershell -Command "cd backend; npx nest build"
```

---

## 📦 3. Danh Mục Các Bảng Cốt Lõi (Core Database Models)

* **`User`**: Lưu `telegramId`, `username`, `streak`, `lastCheckinDate`.
* **`Pet`**: Lưu thông số thú cưng (`name`, `type`, `level`, `exp`, `maxExp`, `hunger`, `energy`, `happiness`, `lastFedAt`, `isSleeping`, `totalFocusMinutes`).
* **`InventoryItem`**: Quản lý túi đồ (`userId`, `foodId`, `count`).
* **`FocusSession`**: Lịch sử phiên Pomodoro (`durationMinutes`, `tag`, `expGained`).
