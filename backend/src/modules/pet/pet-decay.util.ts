/**
 * DevGotchi Pet Vitals Decay Utility
 * Formula:
 * - 48 hours for Hunger to drop completely from 100 to 0.
 * - Interval: 5 points decay every 2.4 hours (144 minutes).
 * - After 24 hours (1 day): hunger drops by 50 points (from 100 to 50).
 * - After 36 hours (1.5 days): hunger drops by 75 points (down to 25 -> mood shifts to HUNGRY).
 * - After 48 hours (2 days): hunger drops by 100 points (down to 0).
 * - If starving (hunger <= 25) for more than 8 hours, happiness decreases slightly (2 points per 8 hours).
 * - Energy recovers slowly while idle (5 points per 3 hours, max 100).
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

// 48 hours total for 100 points: 100 / 20 steps = 5 points per 2.4 hours
export const DECAY_INTERVAL_HOURS = 2.4;
export const DECAY_POINTS_PER_INTERVAL = 5;

export function calculatePetDecay(pet: PetDecayInput): DecayResult {
  const now = new Date();
  const lastFed = pet.lastFedAt ? new Date(pet.lastFedAt) : new Date(pet.updatedAt || now);
  const diffMs = Math.max(0, now.getTime() - lastFed.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);

  const intervals = Math.floor(diffHours / DECAY_INTERVAL_HOURS);

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

  const decayAmount = intervals * DECAY_POINTS_PER_INTERVAL;
  const decayedHunger = Math.max(0, pet.hunger - decayAmount);

  // If starving (<= 25), happiness decreases slightly (2 points per 8 hours)
  let decayedHappiness = pet.happiness;
  if (decayedHunger <= 25) {
    const starvingIntervals = Math.floor(diffHours / 8);
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

  // Advance lastFedAt by exactly the consumed intervals to preserve remaining partial time
  const newLastFedAt = new Date(lastFed.getTime() + intervals * DECAY_INTERVAL_HOURS * 60 * 60 * 1000);

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
