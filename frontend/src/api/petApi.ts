import { FoodItem, PetState, PetType } from '../types/pet';
import { INITIAL_FOODS, STARTER_PETS } from '../data/petConfigs';
import { tg } from '../utils/telegram';
import { getStorageKey, getFoodStorageKey } from '../store/usePetStore';

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
        if (p) {
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
    return saved ? JSON.parse(saved) : null;
  },

  // Fetch food inventory
  async getFoods(): Promise<FoodItem[]> {
    try {
      const res = await fetch(`/api/foods${getTelegramIdParam()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          localStorage.setItem(getFoodStorageKey(), JSON.stringify(json.data));
          return json.data;
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
        return existing ? { ...initFood, count: existing.count } : initFood;
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
    if (foodIndex === -1 || foods[foodIndex].count <= 0) {
      throw new Error('Món ăn đã hết!');
    }

    const food = foods[foodIndex];
    const updatedFoods = [...foods];
    updatedFoods[foodIndex] = { ...food, count: food.count - 1 };

    const config = STARTER_PETS.find((p) => p.id === currentPet.type);
    const isFav = config && config.favoriteFood.toLowerCase().includes(food.name.toLowerCase());
    const hungerGain = isFav ? food.hungerRestored + 15 : food.hungerRestored;
    const happyGain = isFav ? food.happinessBonus + 15 : food.happinessBonus;

    let updatedPet: PetState = {
      ...currentPet,
      hunger: Math.min(100, currentPet.hunger + hungerGain),
      happiness: Math.min(100, currentPet.happiness + happyGain),
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
  ): Promise<{ pet: PetState; foods: FoodItem[]; expGained: number; leveledUp: boolean }> {
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

    const randomFoodIndex = Math.floor(Math.random() * foods.length);
    const updatedFoods = [...foods];
    updatedFoods[randomFoodIndex] = {
      ...updatedFoods[randomFoodIndex],
      count: updatedFoods[randomFoodIndex].count + (leveledUp ? 3 : 1),
    };

    const updatedPet: PetState = {
      ...currentPet,
      level: newLevel,
      exp: newExp,
      maxExp: newMaxExp,
      totalFocusMinutes: currentPet.totalFocusMinutes + minutes,
      energy: Math.max(10, currentPet.energy - 10),
      happiness: Math.min(100, currentPet.happiness + 15),
      mood: 'HAPPY',
    };

    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(updatedFoods));

    try {
      await fetch(`/api/sessions/complete${getTelegramIdParam()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: minutes, tag }),
      });
    } catch {
      // Offline fallback
    }

    return { pet: updatedPet, foods: updatedFoods, expGained, leveledUp };
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
