export type PetType = 'PUFFY' | 'BYTEY' | 'GOLEMY' | 'OCTY';

export type PetMood = 'HAPPY' | 'FOCUSING' | 'DIZZY' | 'HUNGRY' | 'SLEEPING';

export type UserRole = 'DEV' | 'QA' | 'DESIGN' | 'PRODUCT' | 'ALL';

export interface PetConfig {
  id: PetType;
  name: string;
  species: string;
  roleBadge: string;
  targetRole: string;
  archetype: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  favoriteFood: string;
  passivePerk: string;
  stats: {
    focusBonus: number;
    decayResistance: number;
    initialHappiness: number;
  };
}

export interface PetState {
  id: string;
  type: PetType;
  customName: string;
  level: number;
  exp: number;
  maxExp: number;
  hunger: number;     // 0 - 100
  energy: number;     // 0 - 100
  happiness: number;  // 0 - 100
  streak: number;
  mood: PetMood;
  isSleeping: boolean;
  totalFocusMinutes: number;
  lastFedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  hungerRestored: number;
  happinessBonus: number;
  energyBonus?: number;
  isInfinite?: boolean;
  description: string;
  count: number;
}
