# DevGotchi Project Rules & Architecture Guidelines

Welcome to the **DevGotchi** codebase! All agents, developers, and tools working on this repository MUST strictly follow the architecture and development guidelines defined below.

---

## 🎯 1. Core Vision & Non-Negotiables

* **Project Purpose:** DevGotchi is a 3D gamified virtual pet productivity platform for software developers.
* **Aesthetic Standard:** Stylized Chibi / Clay-like 3D cartoon style (smooth spheres, pastel vibrancy, expressive face animations, playful bouncy micro-interactions).
* **Performance Budget:**
  * 3D WebGL scenes must sustain **60 FPS** on standard consumer devices and mobile browsers.
  * Always clean up geometries, materials, textures, and requestAnimationFrame loops upon unmounting.
* **Zero-Breaking-Change Policy:** All new features must maintain backward compatibility with existing saved pet data (`localStorage` and Database).

---

## 💻 2. Frontend Engineering Standards (`frontend/`)

* **Framework:** React 19 + TypeScript (Strict Mode).
* **Styling:** Tailwind CSS v4. Do NOT use inline styles except for dynamic 3D hex color tints.
* **State Management:** Zustand.
  * Keep stores atomic or modularized by domain (`usePetStore`, `useTimerStore`, etc.).
  * Always persist state updates to `localStorage` or sync with the backend.
  * Avoid deep nested mutations; always use immutable spread patterns.
* **Three.js & 3D WebGL Guidelines:**
  * Place all 3D procedural components inside `src/components/3d/`.
  * Every 3D Canvas component must handle responsive container resizing via `ResizeObserver`.
  * Group logical character parts into `THREE.Group` (body, eyes, accessories, fins/limbs).
  * Use `THREE.MeshStandardMaterial` with soft roughness (0.2–0.4) and low metalness (0.05–0.1) to achieve the signature cute clay/rubber texture.
  * Mouse parallax / look-at smoothing should use lerp factors between `0.05` and `0.1` for butter-smooth movement.

---

## ⚙️ 3. Backend Engineering Standards (`backend/`)

* **Framework:** NestJS + TypeScript.
* **Architecture:** Clean Architecture with strict separation of concerns:
  * `Controllers`: Handle HTTP requests, routing, status codes, and input validation via DTOs (`class-validator`).
  * `Services`: Contain pure business logic (EXP calculation, level thresholds, decay mechanics, streak verification).
  * `Repositories / Prisma Modules`: Handle database persistence and data mapping.
* **API Conventions:**
  * Global prefix: `/api/v1` or `/api`.
  * Return standard response payloads: `{ success: boolean, data?: any, message?: string }`.
  * Use HTTP status codes accurately (200 OK, 201 Created, 400 Bad Request, 404 Not Found).

---

## 🎮 4. Gamification & Balancing Formulas

* **Focus Sessions:**
  * 25m Focus = 100 Base EXP.
  * Starter Passive Perks must be factored in (e.g. Puffy +20% for <=25m, Golemy +25% for >=45m).
* **Level Progression:**
  * Level 1 -> 2 = 100 EXP.
  * Next level threshold formula: `maxExp = Math.round(prevMaxExp * 1.35)`.
* **Vitals & Decay:**
  * `Hunger` (0–100): Decreases 5 points every 2 hours without sessions.
  * `Energy` (0–100): Restored by sleeping (`toggleSleep`) or rest periods.
  * `Happiness` (0–100): Boosted by feeding favorite foods (+15 bonus) and petting/poking (+3).

---

## 🛠️ 5. Verified Development Commands

* `npm run dev`: Launch Vite frontend dev server (`http://localhost:5173`).
* `npm run dev:backend`: Launch NestJS backend dev server (`http://localhost:3000/api`).
* `npm run build`: Verify production builds for both frontend and backend.
* Always ensure `npm run build:frontend` exits with code 0 before completing any task.
