# DevGotchi Project Rules & Architecture Guidelines

Welcome to the **DevGotchi** codebase! All agents, developers, and tools working on this repository MUST strictly follow the architecture and development guidelines defined below.

---

## 🎯 1. Core Vision & Platform Target

* **Project Purpose:** DevGotchi is a 3D gamified virtual pet productivity platform for software developers.
* **Target Platform:** **Telegram Web App (TWA) / Mobile-first Web App**.
  * Optimized for mobile touch screens inside Telegram while scaling gracefully to Desktop.
  * Mobile ergonomics: Touch targets >= 44px, thumb-friendly bottom zones, pull-to-refresh prevention, safe-area inset support.
* **Design Philosophy:** **Playful UI / Gamified Soft UI (Candy Claymorphism)**:
  * Tactile 3D buttons with physical bottom depth (`border-b-4 active:border-b-0 active:translate-y-1`).
  * Pillowy rounded cards (`rounded-3xl`) with dual soft drop-shadows and vibrant candy pastel accents.
  * Expressive micro-interactions: Haptic vibration feedback on tap, squash & stretch bounce, floating bubbles, sparkle confetti.
* **Performance Budget:**
  * 3D WebGL scenes must sustain **60 FPS** on mobile browsers and inside Telegram WebView.
  * Always clean up geometries, materials, textures, and requestAnimationFrame loops upon unmounting.
* **Zero-Breaking-Change Policy:** All new features must maintain backward compatibility with existing saved pet data (`localStorage` and Database).

---

## 📱 2. Telegram Web App (TWA) Standards

* **SDK Initialization:** Always initialize via `Telegram.WebApp.ready()` and expand viewport with `Telegram.WebApp.expand()`.
* **Haptic Feedback:**
  * Trigger `HapticFeedback.impactOccurred('medium')` on button taps, food drops, and pet pokes.
  * Trigger `HapticFeedback.notificationOccurred('success')` on Pomodoro session completion and level-ups.
* **Theme Adaptability:** Respect Telegram's `themeParams` (dark/light background, text colors) while preserving the signature DevGotchi playful palette.
* **Safe Fallback:** The application must run flawlessly in standard browsers when `window.Telegram?.WebApp` is not present.

---

## 💻 3. Frontend Engineering Standards (`frontend/`)

* **Framework:** React 19 + TypeScript (Strict Mode).
* **Styling & Typography:** Tailwind CSS v4.
  * Follow the **Gamified Soft UI** design token standard (tactile 3D press buttons, pillowy surfaces, candy gradients).
  * **Typography Standard:** Always use `'Nunito'` and `'Be Vietnam Pro'` font family with complete Vietnamese Latin subset (`subset=vietnamese`). Do NOT use fonts lacking Vietnamese diacritics (like standard Fredoka) which cause broken glyph fallback.
  * Follow art-direction guidelines from `design-taste-frontend` skill (`.agents/skills/design-taste-frontend`) to avoid generic AI styling and guarantee premium visual craft.
  * Do NOT use raw inline styles except for dynamic 3D hex color tints.
* **Data Fetching & Server State:** TanStack Query (`@tanstack/react-query`).
  * Use TanStack Query for all asynchronous server state, API queries, mutations, and cache invalidation.
  * Define query keys as typed tuples/arrays (e.g. `PET_QUERY_KEY`, `FOODS_QUERY_KEY`).
  * Ensure offline-first optimistic synchronization with `localStorage`.
* **Client / UI State Management:** Zustand.
  * Keep stores atomic or modularized by domain (`usePetStore`, `useTimerStore`, etc.).
  * Avoid deep nested mutations; always use immutable spread patterns.
* **Three.js & 3D WebGL Guidelines:**
  * Place all 3D procedural components inside `src/components/3d/`.
  * Every 3D Canvas component must handle responsive container resizing via `ResizeObserver`.
  * Group logical character parts into `THREE.Group` (body, eyes, accessories, fins/limbs).
  * Use `THREE.MeshStandardMaterial` with soft roughness (0.2–0.35) and low metalness (0.05–0.1) to achieve the cute clay/vinyl texture.

---

## ⚙️ 4. Backend Engineering Standards (`backend/`)

* **Framework:** NestJS + TypeScript.
* **Architecture:** Clean Architecture with strict separation of concerns:
  * `Controllers`: Handle HTTP requests, Telegram `initData` validation, routing, and DTO validation (`class-validator`).
  * `Services`: Contain pure business logic (EXP calculation, level thresholds, decay mechanics, streak verification).
  * `Repositories / Prisma Modules`: Handle database persistence and data mapping.
* **API Conventions:**
  * Global prefix: `/api/v1` or `/api`.
  * Return standard response payloads: `{ success: boolean, data?: any, message?: string }`.
  * Use HTTP status codes accurately (200 OK, 201 Created, 400 Bad Request, 404 Not Found).

---

## 🎮 5. Gamification & Balancing Formulas

* **Focus Sessions:** 25m Focus = 100 Base EXP (with Starter Passive Perks applied).
* **Level Progression:** Level 1 -> 2 = 100 EXP; $\text{maxExp} = \text{round}(\text{prevMaxExp} \times 1.35)$.
* **Vitals & Decay:**
  * `Hunger` (0–100): Decreases 5 points every **2.4 hours** (exactly 48 hours from 100 to 0).
  * `Energy` (0–100): Restored by sleeping (`/sleep` or `toggleSleep`), Pomodoro breaks (+15), feeding (+5 to +25), and daily `/checkin` (100% full recharge).
  * `Happiness` (0–100): Boosted by feeding favorite foods (+15 bonus), petting/poking (+3), and winning mini-games (+10 to +25).
* **Food Survival Tier:** `water` (Nước Lọc Dev) is 100% free and infinite. Never blocks pet survival.

---

## 🛠️ 6. Verified Development Commands

* `npm run dev`: Launch Vite frontend dev server (`http://localhost:5173`).
* `npm run dev:backend`: Launch NestJS backend dev server (`http://localhost:3001/api`).
* `npm run build:frontend`: Verify production build for frontend.
* `npm run build:backend`: Verify production build for backend.
* Always ensure both frontend and backend builds exit with code 0 before completing any task.

---

## 🛑 7. Strict Git & Commit Policy

* **GOLDEN RULE: NEVER COMMIT OR PUSH AUTOMATICALLY.**
* The agent must **NEVER** execute `git commit` or `git push` unless the user explicitly commands it in the chat prompt (e.g. *"commit cho tôi"*, *"hãy commit code"*).
* All work must remain in the working directory for user testing and verification.

---

## 📚 8. Workspace Customization System

* **Rules (`.agents/rules/`):**
  * `code-quality.md`: Zero-breaking changes, TypeScript strictness, clean state updates.
  * `mobile-twa.md`: Telegram Web App mobile ergonomics, touch targets $\ge 44\text{px}$, haptic feedback.
  * `gamification-balance.md`: Vital formulas, decay intervals, loot tables.
  * `git-workflow.md`: Strict no auto-commit rule and Conventional Commits standards.
* **Specialized Skills (`.agents/skills/`):**
  * `system-analysis`: Phân tích yêu cầu, đánh giá tác động kiến trúc và cân bằng game.
  * `code-review`: Review code, kiểm tra memory leak, bảo mật, và anti-slop visual.
  * `qa-testing`: Kiểm thử toàn diện frontend, backend, mini-game, và Telegram bot.
  * `database-migration`: Quản lý schema Prisma, Supabase PostgreSQL và bảo toàn dữ liệu.
  * `telegram-playful-ui`: Chuẩn thiết kế Candy Claymorphism cho Telegram Mini App.
  * `backend-api-pipeline`: Xây dựng module NestJS, DTO validation, AI Speech endpoint.
  * `pet-3d-creation`: Thiết kế procedural 3D pet Three.js đạt chuẩn 60 FPS.
  * `pomodoro-gamification`: Cân bằng Pomodoro, EXP, drop rate và streak.

