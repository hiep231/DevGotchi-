import React from 'react';

interface FoodIconProps {
  className?: string;
  size?: number;
}

/**
 * 🦐 Tôm Debug (Debug Shrimp)
 * Flat vector illustration with 2px ink stroke and cute expressive eyes.
 */
export const ShrimpDebugIcon: React.FC<FoodIconProps> = ({ className = '', size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Antennae */}
    <path
      d="M26 18C20 14 12 15 8 18M30 16C28 10 22 8 16 9"
      stroke="#2D2A4A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Shrimp Body Segments */}
    <path
      d="M24 22C32 17 46 18 52 25C57 31 58 40 52 46C47 51 40 50 36 44C32 38 27 34 20 33C14 32 10 27 12 22C14 17 19 17 24 22Z"
      fill="#FF8585"
      stroke="#2D2A4A"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Belly Underlay (Lighter Pink) */}
    <path
      d="M22 29C28 29 36 34 39 42C35 44 30 42 27 38C24 34 20 32 18 31"
      fill="#FFE5E5"
    />
    {/* Segments Lines */}
    <path
      d="M34 20C38 25 39 31 38 35M43 23C47 28 47 34 45 38M49 28C52 33 51 38 48 42"
      stroke="#D94141"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Tail Fan */}
    <path
      d="M14 20L6 18C5 22 8 26 12 27M13 22L7 24C8 27 12 29 15 28"
      stroke="#2D2A4A"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#FF6B6B"
    />
    {/* Cute Big Eye */}
    <circle cx="45" cy="28" r="4.5" fill="#2D2A4A" />
    <circle cx="46.5" cy="26.5" r="1.5" fill="#FFFFFF" />
    <circle cx="44" cy="29.5" r="0.8" fill="#FFFFFF" />
    {/* Rosy Cheek */}
    <ellipse cx="49" cy="35" rx="2.5" ry="1.5" fill="#FF5252" opacity="0.6" />
  </svg>
);

/**
 * 🐟 Bánh Cá RAM (RAM Taiyaki)
 * Golden fish waffle with tech memory chips and circuitry.
 */
export const RamFishIcon: React.FC<FoodIconProps> = ({ className = '', size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Tail fin */}
    <path
      d="M10 22C14 28 15 32 10 42C18 38 20 36 24 32C20 28 18 26 10 22Z"
      fill="#F59E0B"
      stroke="#2D2A4A"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Fish Waffle Body */}
    <path
      d="M20 32C22 22 34 16 46 18C56 20 60 28 58 36C56 44 46 48 34 46C24 44 21 38 20 32Z"
      fill="#FBBF24"
      stroke="#2D2A4A"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* RAM Chip Plate (Center) */}
    <rect
      x="31"
      y="24"
      width="15"
      height="14"
      rx="3"
      fill="#10B981"
      stroke="#2D2A4A"
      strokeWidth="2"
    />
    {/* Gold RAM Contacts (Pins) */}
    <rect x="33" y="38" width="2" height="3" rx="0.5" fill="#F59E0B" stroke="#2D2A4A" strokeWidth="1" />
    <rect x="37" y="38" width="2" height="3" rx="0.5" fill="#F59E0B" stroke="#2D2A4A" strokeWidth="1" />
    <rect x="41" y="38" width="2" height="3" rx="0.5" fill="#F59E0B" stroke="#2D2A4A" strokeWidth="1" />
    {/* RAM Modules */}
    <rect x="33.5" y="27" width="4" height="4" rx="1" fill="#047857" />
    <rect x="39.5" y="27" width="4" height="4" rx="1" fill="#047857" />
    {/* Fish Eye */}
    <circle cx="51" cy="27" r="3.5" fill="#2D2A4A" />
    <circle cx="52" cy="26" r="1.2" fill="#FFFFFF" />
    {/* Mouth smile */}
    <path d="M56 33C54 35 52 34 51 33" stroke="#2D2A4A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * 🧊 Thạch Docker (Docker Jelly)
 * Wobbling cyan jelly cube with friendly smile and stacked shipping containers.
 */
export const DockerJellyIcon: React.FC<FoodIconProps> = ({ className = '', size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Docker Stack Containers on Top */}
    <rect x="22" y="14" width="7" height="6" rx="1.5" fill="#38BDF8" stroke="#2D2A4A" strokeWidth="2" />
    <rect x="31" y="14" width="7" height="6" rx="1.5" fill="#38BDF8" stroke="#2D2A4A" strokeWidth="2" />
    <rect x="26.5" y="7" width="7" height="6" rx="1.5" fill="#0284C7" stroke="#2D2A4A" strokeWidth="2" />

    {/* Jelly Body (Curved Wobble Cube) */}
    <path
      d="M15 26C15 22 19 20 25 20H39C45 20 49 22 49 26L52 46C52 51 46 54 32 54C18 54 12 51 12 46L15 26Z"
      fill="#4CC9F0"
      stroke="#2D2A4A"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Glossy Jelly Highlight */}
    <path
      d="M19 26C20 23 23 22 28 22H36C41 22 44 23 45 26"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M17 31L16 43"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.7"
    />
    {/* Cute Face */}
    <circle cx="26" cy="36" r="3.5" fill="#2D2A4A" />
    <circle cx="27" cy="35" r="1.2" fill="#FFFFFF" />
    <circle cx="38" cy="36" r="3.5" fill="#2D2A4A" />
    <circle cx="39" cy="35" r="1.2" fill="#FFFFFF" />
    {/* Cute Mouth */}
    <path
      d="M29 42C31 45 33 45 35 42"
      stroke="#2D2A4A"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Blushing cheeks */}
    <ellipse cx="22" cy="40" rx="2.5" ry="1.5" fill="#0284C7" opacity="0.4" />
    <ellipse cx="42" cy="40" rx="2.5" ry="1.5" fill="#0284C7" opacity="0.4" />
  </svg>
);

/**
 * 🍩 Donut Espresso (Espresso Donut)
 * Golden baked donut with rich espresso glaze, colorful sprinkles and coffee bean.
 */
export const EspressoDonutIcon: React.FC<FoodIconProps> = ({ className = '', size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Donut Dough Base */}
    <ellipse
      cx="32"
      cy="34"
      rx="24"
      ry="20"
      fill="#FBBF24"
      stroke="#2D2A4A"
      strokeWidth="2.5"
    />
    {/* Espresso Chocolate Frosting */}
    <path
      d="M12 33C11 26 18 18 32 18C46 18 53 26 52 33C48 37 45 33 42 37C39 41 35 38 31 40C27 42 24 37 20 40C16 43 14 37 12 33Z"
      fill="#78350F"
      stroke="#2D2A4A"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Frosting Sheen */}
    <path
      d="M20 22C24 20 30 19 35 20"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
    {/* Donut Hole */}
    <ellipse
      cx="32"
      cy="33"
      rx="7.5"
      ry="6"
      fill="#FFF6E5"
      stroke="#2D2A4A"
      strokeWidth="2.5"
    />
    {/* Coffee Bean Topping */}
    <g transform="translate(37, 21) rotate(15)">
      <ellipse cx="4" cy="3" rx="4" ry="2.8" fill="#451A03" stroke="#2D2A4A" strokeWidth="1.2" />
      <path d="M1.5 3C3 2.5 5 3.5 6.5 3" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
    </g>
    {/* Colorful Sprinkles */}
    <rect x="20" y="24" width="4" height="2" rx="1" transform="rotate(25 20 24)" fill="#38BDF8" />
    <rect x="26" y="22" width="4" height="2" rx="1" transform="rotate(-30 26 22)" fill="#FF6B6B" />
    <rect x="42" y="30" width="4" height="2" rx="1" transform="rotate(45 42 30)" fill="#FBBF24" />
    <rect x="18" y="32" width="4" height="2" rx="1" transform="rotate(-15 18 32)" fill="#34D399" />
  </svg>
);

export const FOOD_ICON_MAP: Record<string, React.FC<FoodIconProps>> = {
  shrimp: ShrimpDebugIcon,
  fish_ram: RamFishIcon,
  docker_jelly: DockerJellyIcon,
  coffee_donut: EspressoDonutIcon,
};

export const FOOD_IMAGES: Record<string, string> = {
  shrimp: '/foods/shrimp.svg',
  fish_ram: '/foods/fish_ram.svg',
  docker_jelly: '/foods/docker_jelly.svg',
  coffee_donut: '/foods/coffee_donut.svg',
  bao: '/foods/bao.svg',
  noodle_cup: '/foods/noodle_cup.svg',
  bubble_tea: '/foods/bubble_tea.svg',
  onigiri: '/foods/onigiri.svg',
  ice_cream: '/foods/ice_cream.svg',
  pizza: '/foods/pizza.svg',
  banh_mi: '/foods/banh_mi.svg',
  golden_apple: '/foods/golden_apple.svg',
};
