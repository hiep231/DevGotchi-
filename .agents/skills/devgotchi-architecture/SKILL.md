---
name: devgotchi-architecture
description: >-
  Use this skill when designing, refactoring, or reviewing architectural decisions
  across the DevGotchi monorepo, including frontend React/Zustand state synchronization,
  backend NestJS module boundaries, and end-to-end data pipelines.
---

# DevGotchi Architecture & System Design Guide

This skill provides the architectural blueprints and design principles for the DevGotchi platform, ensuring clean separation of concerns, scalability, and seamless game state persistence.

---

## 1. System High-Level Topology

```
┌──────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  React 19 + Three.js 3D Viewport + Tailwind CSS + Zustand    │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP / WebSocket
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    NestJS API Gateway                        │
│  ├─ AuthModule        (JWT / Google OAuth)                   │
│  ├─ PetModule         (Vitals, Evolution, AI Dialogues)      │
│  ├─ SessionModule     (Focus Sessions, EXP, Drops)           │
│  └─ BadgeModule       (Dynamic GitHub SVG Profile Badges)    │
└──────────────────────────────┬───────────────────────────────┘
                               │ Prisma ORM
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 PostgreSQL Primary Database                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend State Flow (Zustand & Local Persistence)

The frontend uses an optimistic offline-first state architecture:
1. **Single Source of Truth:** `src/store/usePetStore.ts`.
2. **Local Sync:** Every mutation immediately saves to `localStorage` (`devgotchi_pet_state_v1`), so users never lose their pet or streak if they refresh or close the tab.
3. **Remote Sync (When Backend is connected):**
   - On initial load: Fetch latest pet state from `GET /api/pets/me`.
   - On Focus completion: Send `POST /api/sessions/complete` with `{ minutes, tag }`.
   - On Feed: Send `POST /api/pets/feed` with `{ foodId }`.

---

## 3. Directory Layout Rules

```text
frontend/src/
├── components/
│   ├── 3d/                 # Three.js 3D Procedural Pet Viewports
│   ├── common/             # Buttons, Modals, Sliders, Badges
│   ├── StarterSelection.tsx# Onboarding 3D carousel
│   ├── PetDashboard.tsx    # Primary pet care & stats view
│   ├── PomodoroTimer.tsx   # Productivity countdown & tags
│   └── FoodTray.tsx        # Inventory & feeding interaction
├── store/                  # Zustand state stores
├── types/                  # Shared TypeScript interfaces & types
└── data/                   # Initial configs, foods, and pet definitions
```

---

## 4. Architectural Rules & Best Practices

1. **Decouple 3D Rendering from UI Logic:**
   - The 3D canvas (`PetCanvas.tsx`) only receives props (`type`, `mood`, `isFeeding`, `pokeTrigger`, `feedTrigger`).
   - It NEVER directly mutates game store state; UI interactions trigger actions in Zustand, which pass triggers down as clean props.
2. **Deterministic Gamification Math:**
   - Keep EXP and Level calculations pure functions in a utility or domain service to allow identical computation on both Frontend and Backend.
3. **Resilient Error Handling:**
   - If the backend is unavailable or offline, the client must fallback gracefully to local `localStorage` without breaking the user experience.
