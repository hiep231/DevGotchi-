---
name: pomodoro-gamification
description: >-
  Use this skill when implementing, tuning, or balancing gamification loops,
  productivity Pomodoro timer mechanics, EXP/Level progression, streak calculations,
  vital decay formulas, and loot/food drop tables in DevGotchi.
---

# Pomodoro & Gamification Systems Guide

This skill governs the motivational and mathematical mechanics of DevGotchi, turning deep work into an addictive, rewarding RPG progression.

---

## 📊 1. Core Progression Formulas

### EXP Generation Formula
```typescript
function calculateSessionExp(durationMinutes: number, petType: PetType): number {
  const baseExp = durationMinutes * 4; // 25m = 100 EXP, 50m = 200 EXP
  let bonusMultiplier = 0;

  // Starter Archetype Passives
  if (petType === 'PUFFY' && durationMinutes <= 25) {
    bonusMultiplier = 0.20; // +20% for quick sprint sessions
  } else if (petType === 'GOLEMY' && durationMinutes >= 45) {
    bonusMultiplier = 0.25; // +25% for long marathon sessions
  }

  return Math.round(baseExp * (1 + bonusMultiplier));
}
```

### Level-Up Threshold Formula
Progression follows a geometric curve with a `1.35x` exponent:
* Level 1 ➔ 2: `100 EXP`
* Level 2 ➔ 3: `135 EXP`
* Level 3 ➔ 4: `182 EXP`
* Level $N$: $\text{maxExp}_N = \text{round}(\text{maxExp}_{N-1} \times 1.35)$

---

## 🍖 2. Vitals & Decay Mechanics

A pet has 3 primary vitals, each bounded between `0` and `100`:

| Vital | Depletion Trigger | Restoration Action | Consequence at 0 |
| :--- | :--- | :--- | :--- |
| **Hunger** | Loses 5 points every 2 hours without sessions | Feed items from Inventory | Pet gets weak, EXP gains halved |
| **Energy** | Drained by 10 points per completed focus session | Put pet to sleep (`toggleSleep`) or rest | Pet falls asleep automatically |
| **Happiness** | Decreases by 5 points every 24h of inactivity | Feeding favorite food (+30), Poking (+3) | Pet enters `DIZZY` or grumpy mood |

### Favorite Food Synergy
Each pet has a designated favorite dish:
* **Puffy:** Tôm Debug (Shrimp)
* **Bytey:** Bánh Cá RAM
* **Golemy:** Thạch Docker
* **Octy:** Donut Espresso

Feeding a pet its favorite dish grants an extra **+15 Hunger** and **+15 Happiness** bonus!

---

## 🎁 3. Focus Loot & Drop Tables

Completing a Pomodoro session awards random food drops to sustain your pet:

```typescript
const DROP_TABLE = [
  { item: 'shrimp', weight: 40 },
  { item: 'fish_ram', weight: 30 },
  { item: 'docker_jelly', weight: 20 },
  { item: 'coffee_donut', weight: 10 },
];
```
* **Regular Session:** Awards 1 random food item.
* **Level-Up Session:** Awards a bonus "Feast Chest" containing 3 random food items + celebratory confetti.

---

## 🔥 4. Daily Streak Rules

* A streak increments when at least **1 Focus Session (>= 15 minutes)** is completed within a calendar day (local timezone).
* If 48 hours elapse without an active session, the streak breaks unless revived with an emergency 45-minute deep work session.
