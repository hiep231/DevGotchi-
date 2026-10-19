---
name: telegram-playful-ui
description: >-
  Use this skill when developing, refactoring, or styling Telegram Web Apps (TWA)
  and Mini Apps within DevGotchi, implementing Playful UI / Gamified Soft UI design systems,
  Telegram SDK hooks, haptic feedback, and mobile touch ergonomics.
---

# Telegram Web App (TWA) & Gamified Soft UI Design Guide

This skill standardizes the mobile-first Telegram Mini App experience and the **Playful / Gamified Soft UI** design system for DevGotchi.

---

## 📱 1. Telegram Web App (TWA) Lifecycle & Integration

### SDK Initialization
Include the Telegram script in `index.html`:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

Wrap all Telegram APIs in a safe TypeScript wrapper with fallback for standard browser testing:

```typescript
// src/utils/telegram.ts
export const tg = {
  get isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData);
  },
  get webApp() {
    return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
  },
  init() {
    const app = this.webApp;
    if (app) {
      app.ready();
      app.expand();
      app.setHeaderColor?.('#0f172a');
      app.setBackgroundColor?.('#020617');
    }
  },
  haptic: {
    impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    },
    notification(type: 'error' | 'success' | 'warning' = 'success') {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
    },
    selection() {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    },
  },
};
```

---

## 🎨 2. Playful UI & Gamified Soft UI Design System

Gamified Soft UI blends **Duolingo-style physical 3D button presses**, **claymorphic soft elevation**, and **candy vibrant pastels**.

### A. Tactile 3D Buttons (Push & Pop)
Buttons have physical bottom depth that compresses into the screen when pressed:

```css
/* Tactile 3D Button Utility */
.btn-tactile-cyan {
  @apply bg-cyan-400 text-slate-950 font-black rounded-2xl
         border-b-4 border-cyan-600
         shadow-lg shadow-cyan-500/20
         active:border-b-0 active:translate-y-1 active:shadow-none
         transition-all cursor-pointer;
}

.btn-tactile-amber {
  @apply bg-amber-400 text-slate-950 font-black rounded-2xl
         border-b-4 border-amber-600
         shadow-lg shadow-amber-500/20
         active:border-b-0 active:translate-y-1 active:shadow-none
         transition-all cursor-pointer;
}

.btn-tactile-rose {
  @apply bg-rose-400 text-slate-950 font-black rounded-2xl
         border-b-4 border-rose-600
         shadow-lg shadow-rose-500/20
         active:border-b-0 active:translate-y-1 active:shadow-none
         transition-all cursor-pointer;
}
```

### B. Soft Pillowy Cards (Clay Surfaces)
Surfaces look like soft extruded clay cards with rounded corners (`rounded-3xl`) and dual shadow layers:

```css
.soft-card {
  @apply bg-slate-900/90 border-2 border-slate-800/80 rounded-3xl
         shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)]
         backdrop-blur-xl;
}
```

### C. Typography & Readability
* **Headings:** Font `'Fredoka', sans-serif` for bubbly, friendly cartoon vibes.
* **Numbers & Code tags:** Font `'JetBrains Mono', monospace` for developer aesthetics.

---

## 🖐️ 3. Mobile Touch Ergonomics in Telegram

1. **Thumb-Zone Accessibility:**
   - Primary action buttons (Start Pomodoro, Feed, Poke) must sit within the lower 50% of the mobile viewport.
2. **Safe Area Padding:**
   - Use `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]` to prevent system notch or Telegram navigation bar overlap.
3. **No Accidental Swipe Closes:**
   - Prevent elastic scroll bounces inside Telegram WebView with `overscroll-behavior-y: none;` on body.
4. **Haptic Feedback on Every Action:**
   - Every button press MUST trigger `tg.haptic.impact('medium')` or `tg.haptic.selection()`.
   - Level-ups and Pomodoro completion trigger `tg.haptic.notification('success')`.
