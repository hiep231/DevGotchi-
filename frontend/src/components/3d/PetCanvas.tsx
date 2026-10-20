import React from 'react';
import { PetMood, PetType } from '../../types/pet';
import { Mascot } from '../mascot/Mascot';
import { MascotMood, MascotType } from '../mascot/types';

interface PetCanvasProps {
  type: PetType;
  mood?: PetMood;
  isFeeding?: boolean;
  activeFoodIcon?: string;
  isInteractive?: boolean;
  pokeTrigger?: number;
  feedTrigger?: number;
  className?: string;
  swipeOffset?: number;
  speechBubble?: string | null;
  onPoke?: () => void;
}

export const MASCOT_IMAGES: Record<PetType, string> = {
  PUFFY: '/mascots/puffy_clean.svg',
  BYTEY: '/mascots/cat_clean.svg',
  GOLEMY: '/mascots/dino_clean.svg',
  OCTY: '/mascots/octo_clean.svg',
};

const TYPE_MAP: Record<PetType, MascotType> = {
  PUFFY: 'puffer',
  BYTEY: 'cat',
  GOLEMY: 'dino',
  OCTY: 'octo',
};

export const PetCanvas: React.FC<PetCanvasProps> = ({
  type,
  mood = 'HAPPY',
  isFeeding = false,
  isInteractive = true,
  className = 'w-full h-80',
  swipeOffset = 0,
  speechBubble = null,
  onPoke,
}) => {
  // Map PetMood to MascotMood
  let mascotMood: MascotMood = 'idle';
  if (isFeeding) {
    mascotMood = 'eating';
  } else if (mood === 'SLEEPING') {
    mascotMood = 'sleepy';
  } else if (mood === 'HUNGRY') {
    mascotMood = 'hungry';
  } else if (mood === 'DIZZY') {
    mascotMood = 'dizzy';
  } else if (mood === 'FOCUSING') {
    mascotMood = 'focus';
  } else if (mood === 'HAPPY') {
    mascotMood = 'happy';
  }

  const mascotType = TYPE_MAP[type] || 'puffer';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Mascot
        type={mascotType}
        mood={mascotMood}
        size="100%"
        interactive={isInteractive}
        enableEyeTracking={true}
        enableParallax={true}
        enableBreathing={true}
        enableBlink={true}
        enableGyro={true}
        swipeOffset={swipeOffset}
        speechBubble={speechBubble}
        onPoke={onPoke}
      />
    </div>
  );
};
