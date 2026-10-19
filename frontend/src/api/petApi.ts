import { FoodItem, PetState, PetType } from '../types/pet';
import { INITIAL_FOODS, STARTER_PETS } from '../data/petConfigs';

const STORAGE_KEY = 'devgotchi_pet_state_v1';
const FOOD_STORAGE_KEY = 'devgotchi_food_state_v1';

export const petApi = {
  // Fetch active pet state
  async getPet(): Promise<PetState | null> {
    try {
      const res = await fetch('/api/pets/me');
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Offline fallback
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  // Fetch food inventory
  async getFoods(): Promise<FoodItem[]> {
    try {
      const res = await fetch('/api/foods');
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Offline fallback
    }

    const saved = localStorage.getItem(FOOD_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_FOODS;
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPet));
    localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(INITIAL_FOODS));

    try {
      await fetch('/api/pets/adopt', {
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

    const updatedPet: PetState = {
      ...currentPet,
      hunger: Math.min(100, currentPet.hunger + hungerGain),
      happiness: Math.min(100, currentPet.happiness + happyGain),
      mood: 'HAPPY',
      lastFedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPet));
    localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(updatedFoods));

    try {
      await fetch('/api/pets/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId }),
      });
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPet));
    localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(updatedFoods));

    try {
      await fetch('/api/sessions/complete', {
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
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FOOD_STORAGE_KEY);
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
