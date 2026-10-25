import { create } from 'zustand';
import { AfkAdventureData, FoodItem, PetMood, PetState, PetType } from '../types/pet';
import { INITIAL_FOODS, STARTER_PETS } from '../data/petConfigs';

interface PetStore {
  pet: PetState | null;
  foods: FoodItem[];
  selectedStarterId: PetType;
  isFeeding: boolean;
  activeFoodFeeding: FoodItem | null;
  feedAnimKey: number;
  pokeAnimKey: number;
  afkAdventure: AfkAdventureData | null;

  // Actions
  setPet: (pet: PetState | null) => void;
  setAfkAdventure: (afk: AfkAdventureData | null) => void;
  setSelectedStarter: (id: PetType) => void;
  adoptPet: (type: PetType, customName: string) => void;
  feedPet: (foodId: string) => boolean;
  applyFeeding: (food: FoodItem, updatedPet: PetState, updatedFoods: FoodItem[]) => void;
  pokePet: () => void;
  setMood: (mood: PetMood) => void;
  toggleSleep: () => void;
  completeFocusSession: (minutes: number, tag?: string) => { expGained: number; leveledUp: boolean };
  penalizeDistraction: (penaltyHappiness?: number) => void;
  resetPet: () => void;
  endFeedingAnim: () => void;
}

import { tg } from '../utils/telegram';

export const getStorageKey = (): string => {
  const tid = tg.user?.id;
  return tid ? `devgotchi_pet_${tid}_v2` : 'devgotchi_pet_guest_v2';
};

export const getFoodStorageKey = (): string => {
  const tid = tg.user?.id;
  return tid ? `devgotchi_food_${tid}_v2` : 'devgotchi_food_guest_v2';
};

const getInitialPet = (): PetState | null => {
  try {
    const saved = localStorage.getItem(getStorageKey());
    if (!saved) return null;
    const pet: PetState = JSON.parse(saved);

    // Calculate real-time hunger decay (48 hours to drop 100 points: 5 points per 2.4 hours)
    if (pet.lastFedAt) {
      const diffHours = (Date.now() - new Date(pet.lastFedAt).getTime()) / (1000 * 60 * 60);
      const intervals = Math.floor(diffHours / 2.4);
      if (intervals > 0) {
        pet.hunger = Math.max(0, pet.hunger - intervals * 5);
        if (pet.hunger <= 25) {
          pet.mood = 'HUNGRY';
        }
        pet.lastFedAt = new Date(new Date(pet.lastFedAt).getTime() + intervals * 2.4 * 60 * 60 * 1000).toISOString();
        localStorage.setItem(getStorageKey(), JSON.stringify(pet));
      }
    }
    return pet;
  } catch {
    return null;
  }
};

const getInitialFoods = (): FoodItem[] => {
  try {
    const saved = localStorage.getItem(getFoodStorageKey());
    if (!saved) return INITIAL_FOODS;
    const parsed: FoodItem[] = JSON.parse(saved);
    // Keep saved counts, but seamlessly add new foods from INITIAL_FOODS
    return INITIAL_FOODS.map((initFood) => {
      const existing = parsed.find((p) => p.id === initFood.id);
      return existing ? { ...initFood, count: existing.count } : initFood;
    });
  } catch {
    return INITIAL_FOODS;
  }
};

export const usePetStore = create<PetStore>((set, get) => ({
  pet: getInitialPet(),
  foods: getInitialFoods(),
  selectedStarterId: 'PUFFY',
  isFeeding: false,
  activeFoodFeeding: null,
  feedAnimKey: 0,
  pokeAnimKey: 0,
  afkAdventure: null,

  setPet: (pet: PetState | null) => {
    if (pet) {
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(pet));
      } catch {}
    } else {
      try {
        localStorage.removeItem(getStorageKey());
      } catch {}
    }
    set({ pet });
  },

  setAfkAdventure: (afk: AfkAdventureData | null) => set({ afkAdventure: afk }),

  setSelectedStarter: (id: PetType) => set({ selectedStarterId: id }),

  adoptPet: (type: PetType, customName: string) => {
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
    set({ pet: newPet, foods: INITIAL_FOODS });
  },

  feedPet: (foodId: string) => {
    const { pet, foods, isFeeding } = get();
    if (!pet || isFeeding) return false;

    const foodIndex = foods.findIndex((f) => f.id === foodId);
    const isInfinite = foodId === 'water' || foods[foodIndex]?.isInfinite;
    if (foodIndex === -1 || (!isInfinite && foods[foodIndex].count <= 0)) return false;

    const food = foods[foodIndex];
    const updatedFoods = [...foods];
    if (!isInfinite) {
      updatedFoods[foodIndex] = { ...food, count: food.count - 1 };
    }

    // Check favorite food bonus
    const config = STARTER_PETS.find((p) => p.id === pet.type);
    const isFav = config && config.favoriteFood.toLowerCase().includes(food.name.toLowerCase());
    const hungerGain = isFav ? food.hungerRestored + 15 : food.hungerRestored;
    const happyGain = isFav ? food.happinessBonus + 15 : food.happinessBonus;
    const energyGain = food.energyBonus ?? (food.id === 'coffee_donut' ? 25 : (food.id === 'fish_ram' ? 15 : 10));

    const updatedPet: PetState = {
      ...pet,
      hunger: Math.min(100, pet.hunger + hungerGain),
      happiness: Math.min(100, pet.happiness + happyGain),
      energy: Math.min(100, (pet.energy ?? 85) + energyGain),
      mood: 'HAPPY',
      lastFedAt: new Date().toISOString(),
    };

    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(updatedFoods));

    set((state) => ({
      pet: updatedPet,
      foods: updatedFoods,
      isFeeding: true,
      activeFoodFeeding: food,
      feedAnimKey: state.feedAnimKey + 1,
    }));

    // Auto clear feeding animation after 1.8s
    setTimeout(() => {
      get().endFeedingAnim();
    }, 1800);

    return true;
  },

  applyFeeding: (food: FoodItem, updatedPet: PetState, updatedFoods: FoodItem[]) => {
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(updatedFoods));

    set((state) => ({
      pet: updatedPet,
      foods: updatedFoods,
      isFeeding: true,
      activeFoodFeeding: food,
      feedAnimKey: state.feedAnimKey + 1,
    }));

    setTimeout(() => {
      get().endFeedingAnim();
    }, 1800);
  },

  endFeedingAnim: () => {
    set({ isFeeding: false, activeFoodFeeding: null });
  },

  pokePet: () => {
    const { pet } = get();
    if (!pet) return;

    const happyBoost = Math.min(100, pet.happiness + 3);
    const updatedPet: PetState = {
      ...pet,
      happiness: happyBoost,
      mood: pet.mood === 'DIZZY' ? 'HAPPY' : pet.mood,
    };

    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    set((state) => ({
      pet: updatedPet,
      pokeAnimKey: state.pokeAnimKey + 1,
    }));
  },

  setMood: (mood: PetMood) => {
    const { pet } = get();
    if (!pet) return;
    const updatedPet: PetState = { ...pet, mood };
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    set({ pet: updatedPet });
  },

  toggleSleep: () => {
    const { pet } = get();
    if (!pet) return;
    const isSleeping = !pet.isSleeping;
    const updatedPet: PetState = {
      ...pet,
      isSleeping,
      mood: isSleeping ? 'SLEEPING' : 'HAPPY',
      energy: isSleeping ? Math.min(100, pet.energy + 20) : pet.energy,
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    set({ pet: updatedPet });
  },

  completeFocusSession: (minutes: number) => {
    const { pet, foods } = get();
    if (!pet) return { expGained: 0, leveledUp: false };

    const baseExp = minutes * 4;
    const config = STARTER_PETS.find((p) => p.id === pet.type);
    let bonusExp = 0;
    if (config?.id === 'PUFFY' && minutes <= 25) {
      bonusExp = Math.round(baseExp * 0.2);
    } else if (config?.id === 'GOLEMY' && minutes >= 45) {
      bonusExp = Math.round(baseExp * 0.25);
    }

    const expGained = baseExp + bonusExp;
    let newExp = pet.exp + expGained;
    let newLevel = pet.level;
    let newMaxExp = pet.maxExp;
    let leveledUp = false;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.35);
      leveledUp = true;
    }

    // Award food drop with Expedition loot table
    let droppedFoodId = 'fish_ram';
    if (minutes >= 45) {
      const legendPool = ['golden_apple', 'coffee_donut', 'docker_jelly'];
      droppedFoodId = legendPool[Math.floor(Math.random() * legendPool.length)];
    } else if (minutes >= 25) {
      const isHighTier = Math.random() < 0.45;
      if (isHighTier) {
        const pool = ['golden_apple', 'coffee_donut', 'docker_jelly'];
        droppedFoodId = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const pool = ['bao', 'noodle_cup', 'pizza', 'fish_ram'];
        droppedFoodId = pool[Math.floor(Math.random() * pool.length)];
      }
    } else {
      const pool = ['shrimp', 'fish_ram', 'bao'];
      droppedFoodId = pool[Math.floor(Math.random() * pool.length)];
    }

    const foodIdx = foods.findIndex((f) => f.id === droppedFoodId);
    const updatedFoods = [...foods];
    if (foodIdx !== -1) {
      updatedFoods[foodIdx] = {
        ...updatedFoods[foodIdx],
        count: updatedFoods[foodIdx].count + (leveledUp ? 3 : 1),
      };
    }

    const updatedPet: PetState = {
      ...pet,
      level: newLevel,
      exp: newExp,
      maxExp: newMaxExp,
      totalFocusMinutes: pet.totalFocusMinutes + minutes,
      energy: Math.min(100, pet.energy + 5),
      happiness: Math.min(100, pet.happiness + 20),
      mood: 'HAPPY',
    };

    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    localStorage.setItem(getFoodStorageKey(), JSON.stringify(updatedFoods));
    set({ pet: updatedPet, foods: updatedFoods });

    return { expGained, leveledUp };
  },

  penalizeDistraction: (penaltyHappiness: number = 15) => {
    const { pet } = get();
    if (!pet) return;
    const newHappiness = Math.max(0, pet.happiness - penaltyHappiness);
    const updatedPet: PetState = {
      ...pet,
      happiness: newHappiness,
      mood: 'DIZZY',
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedPet));
    set({ pet: updatedPet });
  },

  resetPet: () => {
    localStorage.removeItem(getStorageKey());
    localStorage.removeItem(getFoodStorageKey());
    set({ pet: null, foods: INITIAL_FOODS });
  },
}));
