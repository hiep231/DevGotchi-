/**
 * DevGotchi Pet Vitals Decay Utility
 * Formula:
 * - Hunger decays 5 points every 2 hours without feeding (1 day = -60 hunger).
 * - If starving (hunger < 30) for more than 4 hours, happiness decreases slightly (2 points per 4 hours).
 * - Energy recovers slowly while idle (5 points per 3 hours, max 100).
 * - When hunger drops <= 25, mood shifts to HUNGRY.
 */

export interface PetDecayInput {
  id: string;
  hunger: number;
  happiness: number;
  energy: number;
  mood: string;
  lastFedAt: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface DecayResult {
  hasDecayed: boolean;
  decayedHunger: number;
  decayedHappiness: number;
  decayedEnergy: number;
  newMood: string;
  newLastFedAt: Date;
  diffHours: number;
  decayAmount: number;
}

export function calculatePetDecay(pet: PetDecayInput): DecayResult {
  const now = new Date();
  const lastFed = pet.lastFedAt ? new Date(pet.lastFedAt) : new Date(pet.updatedAt || now);
  const diffMs = Math.max(0, now.getTime() - lastFed.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);

  // Decays 5 points every 2 hours
  const intervals = Math.floor(diffHours / 2);

  if (intervals <= 0) {
    return {
      hasDecayed: false,
      decayedHunger: pet.hunger,
      decayedHappiness: pet.happiness,
      decayedEnergy: pet.energy,
      newMood: pet.mood,
      newLastFedAt: lastFed,
      diffHours,
      decayAmount: 0,
    };
  }

  const decayAmount = intervals * 5;
  const decayedHunger = Math.max(0, pet.hunger - decayAmount);

  // If starving (< 30), happiness decreases slightly (2 points per 4 hours)
  let decayedHappiness = pet.happiness;
  if (decayedHunger < 30) {
    const starvingIntervals = Math.floor(diffHours / 4);
    decayedHappiness = Math.max(15, pet.happiness - starvingIntervals * 2);
  }

  // Energy: recovers slowly while resting/idle (+5 per 3 hours, max 100)
  const energyIntervals = Math.floor(diffHours / 3);
  const decayedEnergy = Math.min(100, pet.energy + energyIntervals * 5);

  // Determine mood
  let newMood = pet.mood;
  if (decayedHunger <= 25) {
    newMood = 'HUNGRY';
  } else if (decayedHappiness <= 25) {
    newMood = 'DIZZY';
  } else if (pet.mood === 'HUNGRY' && decayedHunger > 25) {
    newMood = 'HAPPY';
  }

  // Advance lastFedAt by exactly the consumed 2-hour intervals to preserve remainder time
  const newLastFedAt = new Date(lastFed.getTime() + intervals * 2 * 60 * 60 * 1000);

  return {
    hasDecayed: true,
    decayedHunger,
    decayedHappiness,
    decayedEnergy,
    newMood,
    newLastFedAt,
    diffHours,
    decayAmount,
  };
}
