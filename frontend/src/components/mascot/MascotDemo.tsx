import React, { useState } from 'react';
import { Mascot } from './Mascot';
import { MascotMood, MascotType } from './types';
import {
  Eye,
  Compass,
  Wind,
  Sparkles,
  Smartphone,
  Hand,
  RotateCcw,
  X,
  Smile,
  Heart,
  Zap,
  Moon,
  Utensils,
  Cookie,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { tg } from '../../utils/telegram';

interface MascotDemoProps {
  onClose?: () => void;
  initialType?: MascotType;
}

export const MascotDemo: React.FC<MascotDemoProps> = ({ onClose, initialType }) => {
  const [character, setCharacter] = useState<MascotType>(initialType ?? 'puffer');
  const [mood, setMood] = useState<MascotMood>('idle');
  const [mascotSize, setMascotSize] = useState<number>(270);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  // Feature Toggles
  const [enableEyes, setEnableEyes] = useState<boolean>(true);
  const [enableParallax, setEnableParallax] = useState<boolean>(true);
  const [enableBreathing, setEnableBreathing] = useState<boolean>(true);
  const [enableBlink, setEnableBlink] = useState<boolean>(true);
  const [enableGyro, setEnableGyro] = useState<boolean>(true);

  // Stats
  const [pokeCount, setPokeCount] = useState<number>(0);

  const MOODS: {
    id: MascotMood;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    activeStyle: string;
    inactiveStyle: string;
  }[] = [
    {
      id: 'idle',
      label: 'Bình thường',
      icon: Smile,
      accentColor: 'text-sky-500',
      activeStyle: 'bg-gradient-to-b from-sky-50 to-sky-100 border-[var(--ink)] text-sky-950 shadow-[0_3px_0_var(--ink)]',
      inactiveStyle: 'bg-white/90 border-[var(--ink)]/20 text-[var(--ink-soft)] hover:bg-sky-50 hover:border-[var(--ink)]/50',
    },
    {
      id: 'happy',
      label: 'Vui vẻ',
      icon: Heart,
      accentColor: 'text-rose-500',
      activeStyle: 'bg-gradient-to-b from-rose-50 to-rose-100 border-[var(--ink)] text-rose-950 shadow-[0_3px_0_var(--ink)]',
      inactiveStyle: 'bg-white/90 border-[var(--ink)]/20 text-[var(--ink-soft)] hover:bg-rose-50 hover:border-[var(--ink)]/50',
    },
    {
      id: 'focus',
      label: 'Deep Work',
      icon: Zap,
      accentColor: 'text-amber-500',
      activeStyle: 'bg-gradient-to-b from-amber-50 to-amber-100 border-[var(--ink)] text-amber-950 shadow-[0_3px_0_var(--ink)]',
      inactiveStyle: 'bg-white/90 border-[var(--ink)]/20 text-[var(--ink-soft)] hover:bg-amber-50 hover:border-[var(--ink)]/50',
    },
    {
      id: 'sleepy',
      label: 'Buồn ngủ',
      icon: Moon,
      accentColor: 'text-purple-500',
      activeStyle: 'bg-gradient-to-b from-purple-50 to-purple-100 border-[var(--ink)] text-purple-950 shadow-[0_3px_0_var(--ink)]',
      inactiveStyle: 'bg-white/90 border-[var(--ink)]/20 text-[var(--ink-soft)] hover:bg-purple-50 hover:border-[var(--ink)]/50',
    },
    {
      id: 'hungry',
      label: 'Đói bụng',
      icon: Utensils,
      accentColor: 'text-orange-500',
      activeStyle: 'bg-gradient-to-b from-orange-50 to-orange-100 border-[var(--ink)] text-orange-950 shadow-[0_3px_0_var(--ink)]',
      inactiveStyle: 'bg-white/90 border-[var(--ink)]/20 text-[var(--ink-soft)] hover:bg-orange-50 hover:border-[var(--ink)]/50',
    },
    {
      id: 'eating',
      label: 'Đang măm',
      icon: Cookie,
      accentColor: 'text-emerald-500',
      activeStyle: 'bg-gradient-to-b from-emerald-50 to-emerald-100 border-[var(--ink)] text-emerald-950 shadow-[0_3px_0_var(--ink)]',
      inactiveStyle: 'bg-white/90 border-[var(--ink)]/20 text-[var(--ink-soft)] hover:bg-emerald-50 hover:border-[var(--ink)]/50',
    },
    {
      id: 'dizzy',
      label: 'Chóng mặt',
      icon: RotateCcw,
      accentColor: 'text-amber-600',
      activeStyle: 'bg-gradient-to-b from-yellow-100 to-amber-100 border-[var(--ink)] text-amber-950 shadow-[0_3px_0_var(--ink)]',
      inactiveStyle: 'bg-white/90 border-[var(--ink)]/20 text-[var(--ink-soft)] hover:bg-yellow-50 hover:border-[var(--ink)]/50',
    },
  ];

  const CHARACTERS: {
    id: MascotType;
    name: string;
    species: string;
    roleTag: string;
    roleBadgeColor: string;
    svgImage: string;
    avatarBg: string;
  }[] = [
    {
      id: 'puffer',
      name: 'Puffy',
      species: 'Cá Nóc Trí Thức',
      roleTag: 'PO / PM',
      roleBadgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      svgImage: '/mascots/puffy_clean.svg',
      avatarBg: 'bg-[#D5F5F0]',
    },
    {
      id: 'dino',
      name: 'Dino',
      species: 'Khủng Long DevOps',
      roleTag: 'Developer',
      roleBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      svgImage: '/mascots/dino_clean.svg',
      avatarBg: 'bg-[#DDF8E8]',
    },
    {
      id: 'cat',
      name: 'Bytey',
      species: 'Mèo Lofi Sáng Tạo',
      roleTag: 'Designer',
      roleBadgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      svgImage: '/mascots/cat_clean.svg',
      avatarBg: 'bg-[#EFE5FD]',
    },
    {
      id: 'octo',
      name: 'Octy',
      species: 'Bạch Tuộc Soi Bug',
      roleTag: 'QA / Tester',
      roleBadgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      svgImage: '/mascots/octo_clean.svg',
      avatarBg: 'bg-[#FFE2E7]',
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 bg-[#FFF6E5] text-[var(--ink)] select-none pb-24 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--ink)]">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-heading font-black text-[var(--grape-deep)] bg-[var(--grape-tint)] border border-[var(--grape)]/30 px-2 py-0.5 rounded-full inline-flex">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mascot 2D Puppet Animation Studio</span>
          </div>
          <h1 className="text-xl font-heading font-black text-[var(--ink)] mt-1">
            Phòng Thử Nghiệm Linh Thú
          </h1>
        </div>

        {onClose && (
          <button
            onClick={() => {
              tg.haptic.impact('light');
              onClose();
            }}
            className="w-10 h-10 rounded-2xl bg-white border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)] flex items-center justify-center cursor-pointer active:translate-y-0.5"
            title="Đóng trang demo"
          >
            <X className="w-5 h-5 text-[var(--ink)]" />
          </button>
        )}
      </div>

      {/* Mascot Interactive Showcase Stage */}
      <div
        className="relative my-3 w-full h-[320px] rounded-3xl border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] overflow-hidden flex flex-col items-center justify-between p-3 select-none"
        style={{
          background: 'linear-gradient(180deg, var(--bg-sky) 0%, #FFF6E5 100%)',
        }}
      >
        {/* Floating Clouds */}
        <div className="absolute top-3 left-4 animate-cloud-left pointer-events-none opacity-80">
          <svg width="56" height="24" viewBox="0 0 68 28" fill="none">
            <path
              d="M14 26H54C60.6 26 66 21 66 15C66 9.4 61.4 4.8 56 4.2C54 1.6 50.8 0 47 0C41.2 0 36.4 3.8 35 9C33.8 8.4 32.4 8 31 8C26 8 22 12 22 17C17.6 17 14 20.6 14 25"
              fill="#FFFFFF"
              stroke="#2D2A4A"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Live Vector Mascot */}
        <div className="relative w-full h-[240px] flex items-center justify-center z-10">
          <Mascot
            type={character}
            mood={mood}
            size={mascotSize}
            interactive={true}
            enableEyeTracking={enableEyes}
            enableParallax={enableParallax}
            enableBreathing={enableBreathing}
            enableBlink={enableBlink}
            enableGyro={enableGyro}
            swipeOffset={swipeOffset}
            onPoke={() => setPokeCount((c) => c + 1)}
            onDizzy={() => setMood('dizzy')}
          />
        </div>

        {/* Grassy Island Pedestal */}
        <div className="relative w-44 h-7 flex items-center justify-center -mt-4 z-0">
          <div className="absolute w-36 h-4 bg-[#2D2A4A]/15 rounded-full blur-[2px]" />
          <div className="w-40 h-5 bg-[#A7E8BD] border-2 border-[var(--ink)] rounded-full shadow-[0_2.5px_0_var(--ink)] flex items-center justify-center">
            <div className="w-32 h-2 bg-[#84D8A2] rounded-full" />
          </div>
        </div>

        {/* Quick Hint Footer in Stage */}
        <div className="z-10 text-[11px] font-heading font-black text-[var(--ink-soft)] bg-white/80 border border-[var(--ink)]/20 px-3 py-0.5 rounded-full shadow-xs">
          💡 Rê chuột / chạm ngón tay để đảo mắt • Nhấn liên tục 5 lần để làm bé chóng mặt!
        </div>
      </div>

      {/* Control Panels */}
      <div className="space-y-4">
        {/* 1. Character Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--ink)] text-[10px] font-heading font-black flex items-center justify-center border border-[var(--ink)] shadow-xs">
                1
              </span>
              <span className="text-xs font-heading font-black text-[var(--ink)] uppercase tracking-wider">
                Chọn Linh Thú Thử Nghiệm:
              </span>
            </div>
            <span className="text-[11px] font-bold text-[var(--ink-soft)]">
              {CHARACTERS.find((c) => c.id === character)?.species}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {CHARACTERS.map((char) => {
              const isSelected = character === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => {
                    tg.haptic.selection();
                    setCharacter(char.id);
                  }}
                  className={`group relative p-2 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-1 cursor-pointer text-center select-none ${
                    isSelected
                      ? 'bg-white border-[var(--ink)] shadow-[0_4px_0_var(--ink)] -translate-y-1 ring-2 ring-[var(--primary)]'
                      : 'bg-white/70 border-[var(--ink)]/20 hover:bg-white hover:border-[var(--ink)]/40 shadow-[0_1.5px_0_rgba(45,42,74,0.08)] opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Active Sparkle Pill Badge */}
                  {isSelected && (
                    <span className="absolute -top-2.5 px-1.5 py-0.2 bg-[var(--primary)] border border-[var(--ink)] text-[9px] font-heading font-black rounded-full shadow-xs text-[var(--ink)] flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Chọn</span>
                    </span>
                  )}

                  {/* Mascot High-Res SVG Avatar */}
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${char.avatarBg} border-2 border-[var(--ink)]/30 flex items-center justify-center overflow-hidden p-1 transition-transform group-hover:scale-105 shadow-inner`}
                  >
                    <img
                      src={char.svgImage}
                      alt={char.name}
                      className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
                    />
                  </div>

                  {/* Name & Role Tag */}
                  <div className="w-full flex flex-col items-center leading-none">
                    <span className="text-xs font-heading font-black text-[var(--ink)] truncate max-w-full">
                      {char.name}
                    </span>
                    <span
                      className={`mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-heading font-extrabold border ${char.roleBadgeColor} truncate max-w-full`}
                    >
                      {char.roleTag}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Mood Expression Switcher */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[var(--coral)] text-white text-[10px] font-heading font-black flex items-center justify-center border border-[var(--ink)] shadow-xs">
              2
            </span>
            <span className="text-xs font-heading font-black text-[var(--ink)] uppercase tracking-wider">
              Biểu Cảm & Trạng Thái (Mood Swapping):
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const isSelected = mood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    tg.haptic.selection();
                    setMood(m.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-heading font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border-2 select-none ${
                    isSelected
                      ? `${m.activeStyle} -translate-y-0.5 scale-102`
                      : `${m.inactiveStyle} shadow-[0_1.5px_0_rgba(45,42,74,0.08)]`
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${m.accentColor} shrink-0`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Feature Toggles */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[var(--mint)] text-[var(--ink)] text-[10px] font-heading font-black flex items-center justify-center border border-[var(--ink)] shadow-xs">
              3
            </span>
            <span className="text-xs font-heading font-black text-[var(--ink)] uppercase tracking-wider">
              Tinh Chỉnh Hiệu Ứng (Animation Modules):
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Eye Tracking Toggle */}
            <button
              onClick={() => {
                tg.haptic.impact('light');
                setEnableEyes(!enableEyes);
              }}
              className={`p-2.5 rounded-2xl border-2 text-left flex items-center justify-between cursor-pointer transition-all ${
                enableEyes
                  ? 'bg-white border-[var(--ink)] shadow-[0_2.5px_0_var(--ink)]'
                  : 'bg-[#F2ECE1] border-[var(--line)] text-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--sky)]" />
                <span className="text-xs font-heading font-black">Đảo mắt (Cursor)</span>
              </div>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${enableEyes ? 'bg-[var(--mint-tint)] text-[var(--mint-deep)]' : 'bg-gray-300'}`}>
                {enableEyes ? 'BẬT' : 'TẮT'}
              </span>
            </button>

            {/* Parallax Tilt Toggle */}
            <button
              onClick={() => {
                tg.haptic.impact('light');
                setEnableParallax(!enableParallax);
              }}
              className={`p-2.5 rounded-2xl border-2 text-left flex items-center justify-between cursor-pointer transition-all ${
                enableParallax
                  ? 'bg-white border-[var(--ink)] shadow-[0_2.5px_0_var(--ink)]'
                  : 'bg-[#F2ECE1] border-[var(--line)] text-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[var(--grape)]" />
                <span className="text-xs font-heading font-black">Nghiêng Parallax</span>
              </div>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${enableParallax ? 'bg-[var(--mint-tint)] text-[var(--mint-deep)]' : 'bg-gray-300'}`}>
                {enableParallax ? 'BẬT' : 'TẮT'}
              </span>
            </button>

            {/* Breathing & Hover Toggle */}
            <button
              onClick={() => {
                tg.haptic.impact('light');
                setEnableBreathing(!enableBreathing);
              }}
              className={`p-2.5 rounded-2xl border-2 text-left flex items-center justify-between cursor-pointer transition-all ${
                enableBreathing
                  ? 'bg-white border-[var(--ink)] shadow-[0_2.5px_0_var(--ink)]'
                  : 'bg-[#F2ECE1] border-[var(--line)] text-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-[var(--mint)]" />
                <span className="text-xs font-heading font-black">Thở & Lơ lửng</span>
              </div>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${enableBreathing ? 'bg-[var(--mint-tint)] text-[var(--mint-deep)]' : 'bg-gray-300'}`}>
                {enableBreathing ? 'BẬT' : 'TẮT'}
              </span>
            </button>

            {/* Auto Blink Toggle */}
            <button
              onClick={() => {
                tg.haptic.impact('light');
                setEnableBlink(!enableBlink);
              }}
              className={`p-2.5 rounded-2xl border-2 text-left flex items-center justify-between cursor-pointer transition-all ${
                enableBlink
                  ? 'bg-white border-[var(--ink)] shadow-[0_2.5px_0_var(--ink)]'
                  : 'bg-[#F2ECE1] border-[var(--line)] text-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-xs font-heading font-black">Chớp mắt tự động</span>
              </div>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${enableBlink ? 'bg-[var(--mint-tint)] text-[var(--mint-deep)]' : 'bg-gray-300'}`}>
                {enableBlink ? 'BẬT' : 'TẮT'}
              </span>
            </button>
          </div>
        </div>

        {/* 4. Carousel Swipe Simulation Slider */}
        <div className="card-sticker p-3.5 bg-white space-y-3">
          {/* Header with Number 4 Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[var(--sky)] text-white text-[10px] font-heading font-black flex items-center justify-center border border-[var(--ink)] shadow-xs">
                4
              </span>
              <span className="text-xs font-heading font-black text-[var(--ink)] uppercase tracking-wider">
                Góc Nghiêng Vuốt (Swipe Tilt & Gaze):
              </span>
            </div>

            {/* Tactile Status Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-heading font-extrabold border-2 border-[var(--ink)] shadow-xs tabular-nums ${
                swipeOffset === 0
                  ? 'bg-[var(--mint-tint)] text-[var(--mint-deep)]'
                  : 'bg-[var(--primary-tint)] text-[var(--ink)]'
              }`}
            >
              {swipeOffset === 0
                ? '🎯 Chính diện (0%)'
                : swipeOffset < 0
                ? `👈 Trái (${Math.round(swipeOffset * 100)}%)`
                : `👉 Phải (+${Math.round(swipeOffset * 100)}%)`}
            </span>
          </div>

          {/* Preset Chunky Buttons for Quick Tilting */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                tg.haptic.impact('light');
                setSwipeOffset(-0.75);
              }}
              className={`btn-chunky py-1.5 px-2 text-xs flex items-center justify-center gap-1 transition-all ${
                swipeOffset < -0.3 ? 'btn-chunky-primary shadow-[0_2.5px_0_var(--ink)] -translate-y-0.5' : 'btn-chunky-secondary'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Nghiêng Trái</span>
            </button>

            <button
              onClick={() => {
                tg.haptic.impact('medium');
                setSwipeOffset(0);
              }}
              className={`btn-chunky py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 transition-all ${
                swipeOffset === 0 ? 'btn-chunky-mint shadow-[0_2.5px_0_var(--ink)] -translate-y-0.5' : 'btn-chunky-secondary'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Chính Diện</span>
            </button>

            <button
              onClick={() => {
                tg.haptic.impact('light');
                setSwipeOffset(0.75);
              }}
              className={`btn-chunky py-1.5 px-2 text-xs flex items-center justify-center gap-1 transition-all ${
                swipeOffset > 0.3 ? 'btn-chunky-primary shadow-[0_2.5px_0_var(--ink)] -translate-y-0.5' : 'btn-chunky-secondary'
              }`}
            >
              <span>Nghiêng Phải</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Custom Styled Tactile Track Slider */}
          <div className="space-y-1.5">
            <div className="relative w-full flex items-center">
              {/* Center Zero Marker Notch */}
              <div className="absolute left-1/2 -translate-x-1/2 w-1 h-3.5 bg-[var(--ink)]/40 rounded-full z-10 pointer-events-none" />

              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={swipeOffset}
                onChange={(e) => setSwipeOffset(parseFloat(e.target.value))}
                className="w-full h-3 bg-[#F2ECE1] border-2 border-[var(--ink)] rounded-full appearance-none cursor-pointer shadow-inner focus:outline-none accent-[var(--primary)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--ink)] [&::-webkit-slider-thumb]:shadow-[0_2px_0_var(--ink)] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform"
              />
            </div>

            {/* Slider Legend */}
            <div className="flex justify-between items-center text-[10px] text-[var(--ink-soft)] font-heading font-extrabold px-1">
              <span className="flex items-center gap-0.5">
                <span>←</span> Vuốt sang trái (-100%)
              </span>
              <span className="px-2 py-0.2 rounded-full bg-[#F2ECE1] border border-[var(--ink)]/20 text-[9px]">
                Kéo thanh để chỉnh mịn
              </span>
              <span className="flex items-center gap-0.5">
                Vuốt sang phải (+100%) <span>→</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
