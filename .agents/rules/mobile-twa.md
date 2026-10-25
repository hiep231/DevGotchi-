# Telegram Web App (TWA) & Mobile UX Rules

## 1. Ergonomics & Touch Targets
* All clickable elements (buttons, food cards, icons) must have a touch target $\ge 44 \times 44\text{px}$.
* Bottom actions must account for mobile thumb zones and safe-area insets (`padding-bottom: env(safe-area-inset-bottom)`).
* Prevent accidental browser pull-to-refresh or overscroll bouncing inside Telegram WebView.

## 2. Telegram SDK Integration
* Always initialize Telegram Web App safely via `Telegram.WebApp.ready()` and `Telegram.WebApp.expand()`.
* **Safe Fallback**: Always check `window.Telegram?.WebApp` before calling SDK methods so the app runs smoothly in standard desktop and mobile browsers.

## 3. Haptic Feedback Standards
* Button taps, quick navigation: `tg.haptic.selection()` or `tg.haptic.impact('light')`.
* Feeding, poking, mini-game normal hit: `tg.haptic.impact('medium')`.
* Boss bug smash, Pomodoro completion, Level-up: `tg.haptic.notification('success')`.
* Full belly warning, validation error: `tg.haptic.notification('warning')` or `'error'`.

## 4. Visual Identity (Candy Claymorphism)
* Tactile 3D press buttons with physical bottom depth: `btn-chunky shadow-[0_3px_0_var(--ink)] active:translate-y-[2px] active:shadow-none`.
* Pillowy rounded cards: `rounded-3xl` or `card-sticker` with dark navy outlines (`#1B2A4A` / `var(--ink)`).
* High-contrast playful color palette: Candy pastels (Mint, Coral, Lavender, Amber) with strong readability.
