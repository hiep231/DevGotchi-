---
name: code-review
description: >-
  Use this skill when reviewing pull requests, inspecting code diffs, auditing
  architecture, memory leaks, performance budgets, or enforcing quality
  standards across DevGotchi frontend, backend, and bot code.
---

# DevGotchi Code Review & Quality Audit Skill

Use this skill to perform thorough, automated or manual code reviews on any code changes in the DevGotchi monorepo.

---

## 🔍 1. Bảng Tiêu Chuẩn Review Code (Review Checklist)

### A. TypeScript & Code Hygiene
- [ ] **Không lạm dụng `any`:** Tất cả interfaces, types phải được định nghĩa rõ ràng trong `types/` hoặc DTO.
- [ ] **Immutability trong Zustand:** Không mutate trực tiếp object (`state.pet.hunger = 100` ❌). Phải dùng object spread hoặc copy (`{ ...state.pet, hunger: 100 }` ✅).
- [ ] **Preserve Comments:** Không xóa các docstring, comments giải thích thuật ngữ nghiệp vụ hoặc math formulas.
- [ ] **Path Aliases & Imports:** Không import chéo vòng lặp (circular dependency).

### B. Mobile Touch Ergonomics & Telegram Web App (TWA)
- [ ] **Touch Target $\ge 44\text{px}$:** Mọi button, icon, chip có thể click đều phải đạt diện tích tối thiểu $44 \times 44\text{px}$.
- [ ] **Haptic Feedback:** Có gọi `tg.haptic.impact()` hoặc `tg.haptic.notification()` ở các tương tác chính không?
- [ ] **Safe-Area Insets:** Thanh điều hướng dưới đáy (bottom nav) và các nút cố định có hỗ trợ `env(safe-area-inset-bottom)` không?
- [ ] **Standard Browser Fallback:** Ứng dụng có chạy mượt mà khi mở ngoài trình duyệt thông thường không có `window.Telegram` không?

### C. WebGL / Three.js & Performance (60 FPS Budget)
- [ ] **Geometries & Materials Disposal:** Component 3D hoặc Canvas khi unmount có gọi `.dispose()` trên geometries, materials và textures không?
- [ ] **requestAnimationFrame Cleanup:** Mọi vòng lặp animation hoặc mini-game loop có lưu ID và gọi `cancelAnimationFrame(id)` trong hàm cleanup của `useEffect` không?
- [ ] **Timer Cleanup:** Tất cả `setInterval` và `setTimeout` có được `clearInterval` / `clearTimeout` khi component unmount không?

### D. Backend NestJS & Database Persistence
- [ ] **DTO & Input Validation:** Mọi endpoint nhận Body/Query có DTO với `class-validator` đầy đủ (`@IsString()`, `@IsInt()`, `@Min()`) không?
- [ ] **Transaction Safety:** Các thao tác ghi đồng thời (vd: trừ inventory và cập nhật pet) có được bọc trong `prisma.$transaction([])` không?
- [ ] **Timezone UTC+7:** Các logic check-in, streak, tính ngày có xử lý múi giờ Việt Nam đúng cách không?
- [ ] **No Secrets Committed:** Không commit API keys, bot tokens, database passwords.

---

## 🎨 2. Anti-Slop Visual & Design Taste Review

Theo tiêu chuẩn `design-taste-frontend`:
- [ ] **Tactile 3D Buttons:** Các nút bấm chính có bottom depth vật lý (`shadow-[0_3px_0_var(--ink)] active:translate-y-[2px] active:shadow-none`) không?
- [ ] **Font Family:** Sử dụng đúng font `'Nunito'` và `'Be Vietnam Pro'` hỗ trợ đầy đủ tiếng Việt có dấu. Không dùng font lỗi glyph fallback.
- [ ] **Candy Palette:** Phối màu pastel kẹo ngọt sống động, độ tương phản chữ rõ nét trên nền mềm (`#FFF6E5`).

---

## 🛑 3. Quy Tắc Commit
- **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG COMMIT.**
- Khi review hoàn tất, tổng hợp báo cáo dạng bảng gồm:
  - 🟢 Điểm đạt chuẩn (Pass)
  - 🟡 Khuyến nghị cải thiện (Suggestions)
  - 🔴 Lỗi nghiêm trọng cần sửa ngay (Blockers)
- Chỉ tiến hành commit khi người dùng xem báo cáo và ra lệnh commit.
