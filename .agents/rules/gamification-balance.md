# DevGotchi Gamification & Balancing Rules

## 1. Vital Decay Mechanics
* **Hunger Decay**:
  - Target: Pet drops from 100 to 0 in exactly **48 hours** without food.
  - Formula: -5 Hunger every **2.4 hours** (144 minutes).
  - Time advance: `lastFedAt` advances by `intervals * 2.4 * 3600 * 1000` to preserve remainder time without drift.
* **Energy (⚡)**:
  - Consumed during work or prolonged activity.
  - Restored via `/sleep` (or `toggleSleep`), Pomodoro breaks (+15), feeding (+5 to +25), and daily `/checkin` (100% full recharge).
* **Happiness (💖)**:
  - Increased by feeding (+10 to +25, +15 extra for favorite dish), petting/poking (+3, 30s cooldown), and winning mini-games (+10 to +25).

## 2. Food Tiers & Inventory Rules
* **Survival Tier (`water` - Nước Lọc Dev)**:
  - 100% Free & Infinite (`isInfinite: true`). Never depletes inventory count.
  - Gives +10 Hunger, +5 Happiness, +5 Energy. Pet can never starve to death.
* **Regular Tech Foods (Drop from Pomodoro & Mini-games)**:
  - `shrimp` (Tôm Debug): +30 Hunger, +15 Happiness, +10 Energy.
  - `fish_ram` (Bánh Cá RAM): +25 Hunger, +20 Happiness, +15 Energy.
  - `docker_jelly` (Thạch Docker): +35 Hunger, +10 Happiness, +10 Energy.
  - `coffee_donut` (Donut Espresso): +20 Hunger, +25 Happiness, +25 Energy.
* **Full Belly Check**:
  - If Hunger reaches 100/100, feeding is blocked with a cute warning. Never allow overfeeding beyond 100.

## 3. EXP & Level Progression
* Level 1 -> Level 2: 100 EXP.
* Subsequent levels: $\text{newMaxExp} = \text{round}(\text{prevMaxExp} \times 1.35)$.
* Pomodoro EXP: 25 minutes = 100 Base EXP (with Starter Passive Perk multipliers applied).
* Mini-game EXP: 30s Catch-The-Bug = 15 to 80 EXP depending on score.
