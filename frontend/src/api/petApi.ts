import { AfkAdventureData, FoodItem, PetState, PetType } from '../types/pet';
import { INITIAL_FOODS, STARTER_PETS } from '../data/petConfigs';
import { tg } from '../utils/telegram';
import { getStorageKey, getFoodStorageKey, usePetStore } from '../store/usePetStore';

function getTelegramIdParam(): string {
  const tid = tg.user?.id;
  return tid ? `?telegramId=${tid}` : '';
}

export const petApi = {
  // Fetch active pet state
  async getPet(): Promise<PetState | null> {
    try {
      const res = await fetch(`/api/pets/me${getTelegramIdParam()}`);
      if (res.ok) {
        const json = await res.json();
        const p = json.data;
        if (json.afkAdventure) {
          usePetStore.getState().setAfkAdventure(json.afkAdventure);
        }
        if (p) {
          localStorage.setItem('devgotchi_last_active_time', Date.now().toString());
          return {
            ...p,
            customName: p.customName || p.name || 'Pet',
            streak: p.streak ?? 1,
            energy: p.energy ?? 85,
            isSleeping: p.isSleeping ?? false,
            totalFocusMinutes: p.totalFocusMinutes ?? 0,
            lastFedAt: p.lastFedAt ? new Date(p.lastFedAt).toISOString() : new Date().toISOString(),
          };
        }
        return null;
      }
    } catch {
      // Offline fallback
    }

    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      try {
        const parsed: PetState = JSON.parse(saved);
        // Offline AFK Adventure check (>= 4 hours)
        const lastActiveStr = localStorage.getItem('devgotchi_last_active_time');
        const now = Date.now();
        if (lastActiveStr) {
          const diffHours = (now - parseInt(lastActiveStr, 10)) / (1000 * 60 * 60);
          if (diffHours >= 4 && !usePetStore.getState().afkAdventure) {
            usePetStore.getState().setAfkAdventure({
              hoursAway: Math.min(24, Math.floor(diffHours)),
              expGained: Math.min(80, 20 * Math.max(1, Math.floor(diffHours / 4))),
              energyRestored: 100,
              loot: [{ id: 'fish_ram', name: 'Bánh Cá RAM', icon: '🐟', count: 1 }],
              story: 'Lúc sen vắng nhà, trẫm đi dạo qua server và nhặt được quà nè!',
            });
          }
        }
        localStorage.setItem('devgotchi_last_active_time', now.toString());
        return parsed;
      } catch {}
    }
    return null;
  },

  // Fetch food inventory
  async getFoods(): Promise<FoodItem[]> {
    try {
      const res = await fetch(`/api/foods${getTelegramIdParam()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const mapped = json.data.map((f: FoodItem) =>
            f.id === 'water' ? { ...f, isInfinite: true, count: 999 } : f
          );
          localStorage.setItem(getFoodStorageKey(), JSON.stringify(mapped));
          return mapped;
        }
        return json;
      }
    } catch {
      // Offline fallback
    }

    const saved = localStorage.getItem(getFoodStorageKey());
    if (!saved) return INITIAL_FOODS;
    try {
      const parsed: FoodItem[] = JSON.parse(saved);
      return INITIAL_FOODS.map((initFood) => {
        const existing = parsed.find((p) => p.id === initFood.id);
        return existing
          ? { ...initFood, count: initFood.isInfinite ? 999 : existing.count }
          : initFood;
      });
    } catch {
      return INITIAL_FOODS;
    }
  },

  // Adopt Starter Pet
  async adoptPet(type: PetType, customName: string): Promise<PetState> {
    const config = STARTER_PETS.find((p) => p.id === type) || STARTER_PETS[0];
    const newPet: PetState = {
      id: `pet_${Date.now()}`,
      type,
      customName: customName.trim() || config.name,
      level: 1,
      exp: 0,
      maxExp: 100,
      hunger: 65,
      energy: 85,
      happiness: config.stats.initialHappiness,
      streak: 1,
      mood: 'HAPPY',
      isSleeping: false,
      totalFocusMinutes: 0,
      lastFedAt: new Date().toISOString(),
    };

    localStorage.setItem(getStorageKey(), JSON.stringify(newPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(INITIAL_FOODS));

    try {
      await fetch(`/api/pets/adopt${getTelegramIdParam()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: newPet.customName }),
      });
    } catch {
      // Offline fallback
    }

    return newPet;
  },

  // Feed Pet
  async feedPet(foodId: string, currentPet: PetState, foods: FoodItem[]): Promise<{ pet: PetState; foods: FoodItem[] }> {
    const foodIndex = foods.findIndex((f) => f.id === foodId);
    const isInfinite = foodId === 'water' || foods[foodIndex]?.isInfinite;
    if (foodIndex === -1 || (!isInfinite && foods[foodIndex].count <= 0)) {
      throw new Error('Món ăn đã hết!');
    }

    const food = foods[foodIndex];
    const updatedFoods = [...foods];
    if (!isInfinite) {
      updatedFoods[foodIndex] = { ...food, count: food.count - 1 };
    }

    const config = STARTER_PETS.find((p) => p.id === currentPet.type);
    const isFav = config && config.favoriteFood.toLowerCase().includes(food.name.toLowerCase());
    const hungerGain = isFav ? food.hungerRestored + 15 : food.hungerRestored;
    const happyGain = isFav ? food.happinessBonus + 15 : food.happinessBonus;
    const energyGain = food.energyBonus ?? (food.id === 'coffee_donut' ? 25 : (food.id === 'fish_ram' ? 15 : 10));

    let updatedPet: PetState = {
      ...currentPet,
      hunger: Math.min(100, currentPet.hunger + hungerGain),
      happiness: Math.min(100, currentPet.happiness + happyGain),
      energy: Math.min(100, (currentPet.energy ?? 85) + energyGain),
      mood: 'HAPPY',
      lastFedAt: new Date().toISOString(),
    };

    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(updatedFoods));

    try {
      const res = await fetch(`/api/pets/feed${getTelegramIdParam()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          updatedPet = {
            ...updatedPet,
            ...json.data,
            customName: json.data.customName || updatedPet.customName,
          };
          localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
        }
      }
    } catch {
      // Offline fallback
    }

    return { pet: updatedPet, foods: updatedFoods };
  },

  // Complete Pomodoro Focus Session
  async completeSession(
    minutes: number,
    tag: string,
    currentPet: PetState,
    foods: FoodItem[]
  ): Promise<{
    pet: PetState;
    foods: FoodItem[];
    expGained: number;
    leveledUp: boolean;
    droppedFood: string;
    droppedFoodName: string;
    foodTier: string;
  }> {
    const baseExp = minutes * 4;
    const config = STARTER_PETS.find((p) => p.id === currentPet.type);
    let bonusExp = 0;
    if (config?.id === 'PUFFY' && minutes <= 25) {
      bonusExp = Math.round(baseExp * 0.2);
    } else if (config?.id === 'GOLEMY' && minutes >= 45) {
      bonusExp = Math.round(baseExp * 0.25);
    }

    const expGained = baseExp + bonusExp;
    let newExp = currentPet.exp + expGained;
    let newLevel = currentPet.level;
    let newMaxExp = currentPet.maxExp;
    let leveledUp = false;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.35);
      leveledUp = true;
    }

    // Phase 4 Loot Table: Pomodoro as Expedition
    let droppedFood = 'shrimp';
    let droppedFoodName = '🦐 Tôm Debug';
    let foodTier = 'COMMON';

    if (minutes >= 45) {
      const deepWorkDrops = [
        { id: 'golden_apple', name: '🍎 Táo Vàng Hackathon', tier: 'LEGENDARY' },
        { id: 'coffee_donut', name: '🍩 Donut Espresso', tier: 'RARE' },
        { id: 'docker_jelly', name: '🐳 Thạch Docker', tier: 'RARE' },
      ];
      const pick = deepWorkDrops[Math.floor(Math.random() * deepWorkDrops.length)];
      droppedFood = pick.id;
      droppedFoodName = pick.name;
      foodTier = pick.tier;
    } else if (minutes >= 25) {
      const rand = Math.random();
      if (rand < 0.20) {
        droppedFood = 'golden_apple';
        droppedFoodName = '🍎 Táo Vàng Hackathon';
        foodTier = 'LEGENDARY';
      } else if (rand < 0.50) {
        const pick = Math.random() > 0.5
          ? { id: 'coffee_donut', name: '🍩 Donut Espresso' }
          : { id: 'docker_jelly', name: '🐳 Thạch Docker' };
        droppedFood = pick.id;
        droppedFoodName = pick.name;
        foodTier = 'RARE';
      } else {
        const gourmetDrops = [
          { id: 'bao', name: '🥟 Bánh Bao Bug' },
          { id: 'noodle_cup', name: '🍜 Mì Ly Terminal' },
          { id: 'pizza', name: '🍕 Pizza Deadline' },
          { id: 'fish_ram', name: '🐟 Bánh Cá RAM' },
        ];
        const pick = gourmetDrops[Math.floor(Math.random() * gourmetDrops.length)];
        droppedFood = pick.id;
        droppedFoodName = pick.name;
        foodTier = 'GOURMET';
      }
    } else {
      const lightDrops = [
        { id: 'shrimp', name: '🦐 Tôm Debug' },
        { id: 'fish_ram', name: '🐟 Bánh Cá RAM' },
        { id: 'bao', name: '🥟 Bánh Bao Bug' },
      ];
      const pick = lightDrops[Math.floor(Math.random() * lightDrops.length)];
      droppedFood = pick.id;
      droppedFoodName = pick.name;
      foodTier = 'COMMON';
    }

    const updatedFoods = [...foods];
    const foodIdx = updatedFoods.findIndex((f) => f.id === droppedFood);
    if (foodIdx !== -1) {
      updatedFoods[foodIdx] = {
        ...updatedFoods[foodIdx],
        count: updatedFoods[foodIdx].count + (leveledUp ? 2 : 1),
      };
    } else {
      updatedFoods.push({
        id: droppedFood,
        name: droppedFoodName,
        icon: '🍱',
        color: 'from-amber-400 to-orange-500',
        hungerRestored: 30,
        happinessBonus: 20,
        count: leveledUp ? 2 : 1,
        description: 'Phần thưởng viễn chinh Pomodoro!',
      });
    }

    // Energy does not drain to exhaustion; pet gains +5 Energy & +20 Happiness!
    const newEnergy = Math.min(100, (currentPet.energy ?? 85) + 5);

    let updatedPet: PetState = {
      ...currentPet,
      level: newLevel,
      exp: newExp,
      maxExp: newMaxExp,
      totalFocusMinutes: currentPet.totalFocusMinutes + minutes,
      energy: newEnergy,
      happiness: Math.min(100, currentPet.happiness + 20),
      mood: 'HAPPY',
    };

    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(updatedFoods));

    try {
      const res = await fetch(`/api/sessions/complete${getTelegramIdParam()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: minutes, tag }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.pet) {
          updatedPet = {
            ...updatedPet,
            ...json.data.pet,
            customName: json.data.pet.customName || updatedPet.customName,
          };
          localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
        }
      }
    } catch {
      // Offline fallback
    }

    return {
      pet: updatedPet,
      foods: updatedFoods,
      expGained,
      leveledUp,
      droppedFood,
      droppedFoodName,
      foodTier,
    };
  },

  // Claim Minigame Reward (30s Catch-The-Bug)
  async claimMinigameReward(
    score: number,
    currentPet: PetState,
    foods: FoodItem[]
  ): Promise<{
    pet: PetState;
    foods: FoodItem[];
    expGained: number;
    happinessGained: number;
    rewardFood: string;
    rewardFoodName: string;
    leveledUp: boolean;
  }> {
    const expGained = Math.min(80, Math.max(15, score * 3));
    const happinessGain = Math.min(25, Math.max(10, Math.floor(score / 2)));

    let rewardFood = 'shrimp';
    let rewardFoodName = '🦐 Tôm Debug';
    if (score >= 20) {
      rewardFood = Math.random() > 0.5 ? 'docker_jelly' : 'coffee_donut';
      rewardFoodName = rewardFood === 'docker_jelly' ? '🐳 Thạch Docker' : '🍩 Donut Espresso';
    } else if (score >= 10) {
      rewardFood = 'fish_ram';
      rewardFoodName = '🐟 Bánh Cá RAM';
    }

    let newExp = currentPet.exp + expGained;
    let newLevel = currentPet.level;
    let newMaxExp = currentPet.maxExp;
    let leveledUp = false;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.35);
      leveledUp = true;
    }

    let updatedPet: PetState = {
      ...currentPet,
      exp: newExp,
      level: newLevel,
      maxExp: newMaxExp,
      happiness: Math.min(100, currentPet.happiness + happinessGain),
      energy: Math.min(100, (currentPet.energy ?? 85) + 5),
      mood: 'HAPPY',
    };

    // Add 1 reward food to inventory
    const updatedFoods = foods.map((f) =>
      f.id === rewardFood ? { ...f, count: f.count + 1 } : f
    );
    if (!updatedFoods.some((f) => f.id === rewardFood)) {
      updatedFoods.push({
        id: rewardFood,
        name: rewardFoodName,
        icon: '🍱',
        color: 'from-amber-400 to-orange-500',
        hungerRestored: 25,
        happinessBonus: 15,
        count: 1,
        description: 'Chiến lợi phẩm từ Mini-game diệt bug!',
      });
    }

    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(updatedFoods));

    try {
      const res = await fetch(`/api/pets/minigame-reward${getTelegramIdParam()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.pet) {
          updatedPet = {
            ...updatedPet,
            ...json.data.pet,
            customName: json.data.pet.customName || updatedPet.customName,
          };
          localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
        }
      }
    } catch {
      // Offline fallback
    }

    return {
      pet: updatedPet,
      foods: updatedFoods,
      expGained,
      happinessGained: happinessGain,
      rewardFood,
      rewardFoodName,
      leveledUp,
    };
  },

  // Claim AFK Adventure Loot
  async claimAfkReward(
    currentPet: PetState,
    foods: FoodItem[],
    afkData: AfkAdventureData
  ): Promise<{ pet: PetState; foods: FoodItem[] }> {
    let newExp = currentPet.exp + afkData.expGained;
    let newLevel = currentPet.level;
    let newMaxExp = currentPet.maxExp;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.35);
    }

    let updatedPet: PetState = {
      ...currentPet,
      exp: newExp,
      level: newLevel,
      maxExp: newMaxExp,
      energy: 100,
      happiness: Math.min(100, currentPet.happiness + 15),
      mood: 'HAPPY',
    };

    let updatedFoods = [...foods];
    for (const item of afkData.loot) {
      const idx = updatedFoods.findIndex((f) => f.id === item.id);
      if (idx !== -1) {
        updatedFoods[idx] = { ...updatedFoods[idx], count: updatedFoods[idx].count + item.count };
      } else {
        updatedFoods.push({
          id: item.id,
          name: item.name,
          icon: item.icon,
          color: 'from-amber-400 to-orange-500',
          hungerRestored: 25,
          happinessBonus: 15,
          count: item.count,
          description: 'Chiến lợi phẩm thám hiểm khi sen vắng nhà!',
        });
      }
    }

    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(updatedFoods));
    localStorage.setItem('devgotchi_last_active_time', Date.now().toString());

    try {
      const res = await fetch(`/api/pets/claim-afk${getTelegramIdParam()}`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.pet) {
          updatedPet = {
            ...updatedPet,
            ...json.data.pet,
            customName: json.data.pet.customName || updatedPet.customName,
          };
          localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
        }
      }
    } catch {
      // Offline fallback
    }

    return { pet: updatedPet, foods: updatedFoods };
  },

  // Reset Pet
  async resetPet(): Promise<void> {
    localStorage.removeItem(getStorageKey());
    localStorage.removeItem(getFoodStorageKey());
    try {
      await fetch('/api/pets/reset', { method: 'POST' });
    } catch {
      // Offline fallback
    }
  },

  // Generate AI Pet Speech
  async generateSpeech(petName: string, petType: string, mood: string, lastTag?: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petName, petType, mood, lastTag }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.quote) return json.quote;
      }
    } catch {
      // Offline fallback
    }
    return 'Gõ phím tiếp đi, trẫm luôn ở bên bạn! ✨';
  },
};
