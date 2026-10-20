export type MascotType = 'puffer' | 'dino' | 'cat' | 'octo' | 'PUFFY' | 'GOLEMY' | 'BYTEY' | 'OCTY';

export type MascotMood = 'idle' | 'happy' | 'hungry' | 'sleepy' | 'focus' | 'eating' | 'dizzy';

export interface Point2D {
  x: number;
  y: number;
}

export interface EyeGeometry {
  centerL: Point2D;
  centerR: Point2D;
  rx: number;
  ry: number;
  pupilRadius: number;
  maxPupilClamp: number; // Max distance pupil can travel from center (~12% eye size)
}

export interface LayerConfig {
  id: string;
  name: string;
  depth: number; // e.g. shadow 0.3, tail 0.6, fin 0.7, body 1.0, blush 1.4, mouth 1.5, eyes 1.6, accessories 1.7
  pivot?: Point2D; // Pivot point for rotation in percentage (0-100) or SVG units
  src?: string; // Optional PNG layer path
  zIndex: number;
}

export interface MascotConfig {
  id: MascotType;
  displayName: string;
  roleTitle: string;
  viewBox: string; // e.g. '0 0 400 400'
  themeColor: string;
  secondaryColor: string;
  eyes: EyeGeometry;
  layers: LayerConfig[];
  tailWag?: {
    pivot: Point2D; // percentage e.g. { x: 75, y: 55 }
    amplitudeDeg: number; // ±8deg
    speedSec: number; // 2s
  };
  finFlap?: {
    pivot: Point2D;
    amplitudeDeg: number; // ±10deg
    speedSec: number;
  };
  quotes: Record<MascotMood, string[]>;
}

export interface MascotProps {
  type?: MascotType;
  mood?: MascotMood;
  level?: number;
  size?: number | string; // e.g. 240, '100%', 'w-64 h-64'
  interactive?: boolean;
  enableEyeTracking?: boolean;
  enableParallax?: boolean;
  enableBreathing?: boolean;
  enableBlink?: boolean;
  enableGyro?: boolean;
  swipeOffset?: number; // -1 to 1 for carousel swipe tilt and gaze
  onPoke?: () => void;
  onDizzy?: () => void;
  className?: string;
  speechBubble?: string | null;
}
