import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, Utensils, Zap, HelpCircle } from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { STARTER_PETS } from '../data/petConfigs';
import { useFeedPetMutation, useFoodsQuery } from '../hooks/usePetQueries';
import { tg } from '../utils/telegram';
import { FOOD_IMAGES, FOOD_ICON_MAP } from './icons/FoodIcons';
import { PetCanvas } from './3d/PetCanvas';
import { ProgressBar } from './ui/ProgressBar';
import { spawnFloatingReaction } from './ui/TapEffectOverlay';

type FoodFilter = 'ALL' | 'FAVORITE' | 'MAIN' | 'SNACK' | 'DRINK';

// Category mapping for the 13 tech foods & drinks
const FOOD_CATEGORIES: Record<string, 'MAIN' | 'SNACK' | 'DRINK'> = {
  water: 'DRINK',
  shrimp: 'SNACK',
  fish_ram: 'SNACK',
  docker_jelly: 'SNACK',
  coffee_donut: 'DRINK',
  bao: 'MAIN',
  noodle_cup: 'MAIN',
  bubble_tea: 'DRINK',
  onigiri: 'MAIN',
  ice_cream: 'SNACK',
  pizza: 'MAIN',
  banh_mi: 'MAIN',
  golden_apple: 'DRINK',
};

// Background tint palettes for food sticker icon boxes
const FOOD_TINTS: Record<string, string> = {
  water: '#E0F2FE',
  shrimp: '#FFEAEA',
  fish_ram: '#FFF8E6',
  docker_jelly: '#EAF8FD',
  coffee_donut: '#FDF1E8',
  bao: '#FFF6E5',
  noodle_cup: '#FFEBEB',
  bubble_tea: '#F3E8FF',
  onigiri: '#EAFBF1',
  ice_cream: '#FFF0F5',
  pizza: '#FFF9E6',
  banh_mi: '#FDF2E9',
  golden_apple: '#FEF9C3',
};

export const FoodTray: React.FC = () => {
  const { pet, isFeeding, feedAnimKey, foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const feedMutation = useFeedPetMutation();

  const [activeFilter, setActiveFilter] = useState<FoodFilter>('ALL');
  const [fullWarning, setFullWarning] = useState<boolean>(false);

  const [feedEffect, setFeedEffect] = useState<{
    foodName: string;
    hungerGained: number;
    happyGained: number;
    isFav: boolean;
  } | null>(null);

  const config = pet ? STARTER_PETS.find((p) => p.id === pet.type) : undefined;

  // Filter foods based on active tab
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const isFav = config ? config.favoriteFood.toLowerCase().includes(food.name.toLowerCase()) : false;
      if (activeFilter === 'FAVORITE') return isFav;
      if (activeFilter === 'MAIN') return FOOD_CATEGORIES[food.id] === 'MAIN';
      if (activeFilter === 'SNACK') return FOOD_CATEGORIES[food.id] === 'SNACK';
      if (activeFilter === 'DRINK') return FOOD_CATEGORIES[food.id] === 'DRINK';
      return true;
    });
  }, [foods, activeFilter, config]);

  if (!pet) return null;

  const handleFeed = (foodId: string) => {
    const food = foods.find((f) => f.id === foodId);
    if (!food || food.count <= 0) return;

    // Check if pet is already 100/100 full
    if (pet.hunger >= 100) {
      tg.haptic.notification('warning');
      setFullWarning(true);
      setTimeout(() => setFullWarning(false), 3000);
      return;
    }

    const isFav = config ? config.favoriteFood.toLowerCase().includes(food.name.toLowerCase()) : false;
    const hungerGained = isFav ? food.hungerRestored + 15 : food.hungerRestored;
    const happyGained = isFav ? food.happinessBonus + 15 : food.happinessBonus;

    // Trigger celebration effects
    tg.haptic.notification('success');
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.3 },
      colors: ['#FFB703', '#FF6B6B', '#2EC4B6', '#8E7CFF'],
    });

    setFeedEffect({
      foodName: food.name,
      hungerGained,
      happyGained,
      isFav,
    });

    if (typeof window !== 'undefined') {
      const x = window.innerWidth / 2;
      const y = 240;
      spawnFloatingReaction(x, y, `+${hungerGained} No • +${happyGained} Vui!`, '#2EC4B6', isFav ? '⭐' : '😋');
    }

    setTimeout(() => {
      setFeedEffect(null);
    }, 2400);

    // Call mutation to update backend and local state
    feedMutation.mutate({
      foodId,
      pet,
      foods,
    });
  };

  return (
    <div className="space-y-3 pb-8 select-none">
      {/* ===================================================================
          1. COMPACT INTERACTIVE FEEDING ARENA (Sân Khấu Đút Ăn Gọn Gàng)
          =================================================================== */}
      <div
        className="relative w-full rounded-3xl border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] overflow-hidden p-3 select-none flex flex-col items-center justify-between"
        style={{
          background: 'linear-gradient(180deg, var(--bg-sky) 0%, #FFF6E5 100%)',
        }}
      >
        {/* Floating Clouds Background */}
        <div className="absolute top-2 left-3 animate-cloud-left pointer-events-none opacity-80">
          <svg width="44" height="18" viewBox="0 0 68 28" fill="none">
            <path
              d="M14 26H54C60.6 26 66 21 66 15C66 9.4 61.4 4.8 56 4.2C54 1.6 50.8 0 47 0C41.2 0 36.4 3.8 35 9C33.8 8.4 32.4 8 31 8C26 8 22 12 22 17C17.6 17 14 20.6 14 25"
              fill="#FFFFFF"
              stroke="#2D2A4A"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="absolute top-3 right-4 animate-cloud-right pointer-events-none opacity-75">
          <svg width="36" height="16" viewBox="0 0 56 24" fill="none">
            <path
              d="M12 22H44C49 22 53 18 53 13C53 8.5 49.5 5 45 4.5C43.5 2 40.5 0.5 37 0.5C32.5 0.5 28.5 3.5 27.5 7.5C26.5 7 25.5 6.5 24 6.5C20 6.5 17 9.5 17 13.5C13.5 13.5 10.5 16.5 10.5 20"
              fill="#FFFFFF"
              stroke="#2D2A4A"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Dynamic Live Speech Bubble */}
        <div className="relative mb-1 max-w-[290px] px-3.5 py-1.5 bg-white border-2 border-[var(--ink)] rounded-2xl shadow-[0_2.5px_0_var(--ink)] text-[11px] font-bold text-[var(--ink)] text-center animate-float-gentle z-20">
          {fullWarning ? (
            <span className="text-[var(--coral-deep)] font-extrabold">
              ⚠️ Bé no căng 100% rồi, sen để dành cho bữa sau nha! 🥰
            </span>
          ) : feedEffect ? (
            feedEffect.isFav ? (
              <span>
                ✨ OẰM! Món <span className="text-[var(--coral-deep)] font-extrabold">{feedEffect.foodName}</span> này béo ngậy chuẩn gu trẫm! 💖
              </span>
            ) : (
              <span>
                😋 Mlem mlem! <span className="text-[var(--mint-deep)] font-extrabold">{feedEffect.foodName}</span> ngon tuyệt cú mèo!
              </span>
            )
          ) : pet.hunger >= 100 ? (
            <span>🥰 Bụng bé no căng tròn xoe 100% rồi sen ơi!</span>
          ) : pet.hunger < 50 ? (
            <span>🥺 Đói meo rồi... sen đút bé đớp chút gì ngon đi!</span>
          ) : (
            <span>🤤 Sen ơi, hôm nay có món gì khoái khẩu cho bé không?</span>
          )}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-[var(--ink)] rotate-45" />
        </div>

        {/* Mascot Center Stage with Jump & Chomp Physics */}
        <div className="relative w-full h-[125px] flex items-center justify-center z-10">
          <PetCanvas
            type={pet.type}
            mood={feedEffect ? 'HAPPY' : pet.hunger < 50 ? 'HUNGRY' : pet.mood}
            isFeeding={isFeeding || !!feedEffect}
            feedTrigger={feedAnimKey}
            className="w-full h-full"
          />

          {/* Floating Chomp Comic Badge */}
          {feedEffect && (
            <div className="absolute top-1 right-8 animate-bounce z-30 pointer-events-none">
              <span className="font-heading font-black text-xs text-[var(--ink)] bg-[var(--primary)] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)] px-2.5 py-0.5 rounded-full rotate-6 inline-block">
                💥 OẰM OẰM!
              </span>
            </div>
          )}

          {/* Floating Stat Numbers Banner */}
          {feedEffect && (
            <div className="absolute bottom-0 flex flex-col items-center pointer-events-none animate-bounce z-30">
              <span className="text-xs font-heading font-black text-[var(--mint-deep)] bg-[var(--mint-tint)] border-2 border-[var(--ink)] shadow-[0_2.5px_0_var(--ink)] px-3 py-0.8 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                +{feedEffect.hungerGained} No bụng • +{feedEffect.happyGained} Vui!
              </span>
            </div>
          )}
        </div>

        {/* Grassy Island Pedestal */}
        <div className="relative w-32 h-5 flex items-center justify-center -mt-2 z-0">
          <div className="absolute w-28 h-3 bg-[#2D2A4A]/15 rounded-full blur-[2px]" />
          <div className="w-28 h-3.5 bg-[#A7E8BD] border-2 border-[var(--ink)] rounded-full shadow-[0_2px_0_var(--ink)] flex items-center justify-center">
            <div className="w-20 h-1.5 bg-[#84D8A2] rounded-full" />
          </div>
        </div>

        {/* Live Mini Vitals Tracker */}
        <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--ink)]/15 z-10">
          {/* No Bụng Bar */}
          <div className="bg-white/95 border-2 border-[var(--ink)] rounded-2xl p-2 shadow-[0_2px_0_var(--ink)]">
            <div className="flex items-center justify-between text-[11px] font-heading font-black text-[var(--ink)] mb-1">
              <span className="flex items-center gap-1 text-[var(--mint-deep)]">
                <Utensils className="w-3 h-3" /> No bụng
              </span>
              <span className="tabular-nums font-black">{pet.hunger ?? 70}/100</span>
            </div>
            <ProgressBar value={pet.hunger ?? 70} max={100} variant="mint" height={7} showGloss={false} />
          </div>

          {/* Hạnh Phúc Bar */}
          <div className="bg-white/95 border-2 border-[var(--ink)] rounded-2xl p-2 shadow-[0_2px_0_var(--ink)]">
            <div className="flex items-center justify-between text-[11px] font-heading font-black text-[var(--ink)] mb-1">
              <span className="flex items-center gap-1 text-[var(--coral-deep)]">
                <Heart className="w-3 h-3 fill-[var(--coral-deep)]" /> Hạnh phúc
              </span>
              <span className="tabular-nums font-black">{pet.happiness ?? 85}/100</span>
            </div>
            <ProgressBar value={pet.happiness ?? 85} max={100} variant="coral" height={7} showGloss={false} />
          </div>
        </div>

        {/* Favorite Food Helper Banner */}
        {config && (
          <div className="w-full mt-2 bg-[var(--primary-tint)] border border-[#E09A00]/40 rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px] font-heading font-bold text-[var(--ink)]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>Khoái khẩu của <b className="font-black">{pet.customName || config.name}</b>:</span>
            </span>
            <span className="font-black text-[var(--primary-deep)] underline decoration-dotted">
              {config.favoriteFood} (+15 Thưởng)
            </span>
          </div>
        )}
      </div>

      {/* ===================================================================
          2. CATEGORY FILTER TABS (Bộ Lọc Danh Mục Món Ăn)
          =================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveFilter('ALL');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-heading font-black whitespace-nowrap transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'btn-chunky btn-chunky-primary shadow-[0_2.5px_0_var(--ink)]'
              : 'bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--ink)]'
          }`}
        >
          🌟 Tất cả ({foods.length})
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveFilter('FAVORITE');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-heading font-black whitespace-nowrap transition-all cursor-pointer ${
            activeFilter === 'FAVORITE'
              ? 'btn-chunky btn-chunky-primary shadow-[0_2.5px_0_var(--ink)]'
              : 'bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--ink)]'
          }`}
        >
          ✨ Khoái khẩu
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveFilter('MAIN');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-heading font-black whitespace-nowrap transition-all cursor-pointer ${
            activeFilter === 'MAIN'
              ? 'btn-chunky btn-chunky-primary shadow-[0_2.5px_0_var(--ink)]'
              : 'bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--ink)]'
          }`}
        >
          🍱 Món chính
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveFilter('SNACK');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-heading font-black whitespace-nowrap transition-all cursor-pointer ${
            activeFilter === 'SNACK'
              ? 'btn-chunky btn-chunky-primary shadow-[0_2.5px_0_var(--ink)]'
              : 'bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--ink)]'
          }`}
        >
          🍰 Ăn vặt
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveFilter('DRINK');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-heading font-black whitespace-nowrap transition-all cursor-pointer ${
            activeFilter === 'DRINK'
              ? 'btn-chunky btn-chunky-primary shadow-[0_2.5px_0_var(--ink)]'
              : 'bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--ink)]'
          }`}
        >
          🧋 Đồ uống
        </button>
      </div>

      {/* ===================================================================
          3. FOOD INVENTORY HEADER & TACTILE 3D CARD GRID
          =================================================================== */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-heading font-black text-[var(--ink)] tracking-tight flex items-center gap-2">
            <span>Túi thức ăn</span>
            <span className="text-xs font-heading font-extrabold px-2 py-0.5 rounded-full bg-[var(--primary-tint)] text-[var(--ink)] border border-[#E09A00]/40">
              {filteredFoods.reduce((acc, f) => acc + f.count, 0)} món có sẵn
            </span>
          </h2>
          <span className="text-[11px] font-semibold text-[var(--ink-soft)]">
            Chạm vào món ăn để đút ngay cho bé!
          </span>
        </div>

        <span className="text-[10px] font-heading font-black text-[var(--ink-soft)] bg-white border border-[var(--line)] px-2 py-0.5 rounded-full shadow-xs">
          Menu 13 món
        </span>
      </div>

      {/* 2-Column Responsive Card Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredFoods.map((food) => {
          const isFav = config ? config.favoriteFood.toLowerCase().includes(food.name.toLowerCase()) : false;
          const isInfinite = food.id === 'water' || food.isInfinite;
          const isAvailable = isInfinite || food.count > 0;
          const isBusy = isFeeding || feedMutation.isPending;
          const IconComponent = FOOD_ICON_MAP[food.id];
          const imageSrc = FOOD_IMAGES[food.id] || `/foods/${food.id}.svg`;
          const tintColor = FOOD_TINTS[food.id] || '#FFF8E6';

          return (
            <div
              key={food.id}
              onClick={() => {
                if (isAvailable && !isBusy) handleFeed(food.id);
              }}
              className={`relative p-3 rounded-3xl text-left flex flex-col justify-between select-none cursor-pointer transition-all duration-150 ${
                isAvailable && !isBusy
                  ? 'bg-white border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--ink)] hover:border-[var(--primary-deep)]'
                  : 'bg-[#F2ECE1] border-2 border-[var(--line-strong)] opacity-60 cursor-not-allowed shadow-none'
              } ${isFav && isAvailable ? 'ring-2 ring-[var(--primary)]' : ''}`}
            >
              {/* Ribbon for Favorite Dish */}
              {isFav && isAvailable && (
                <span className="absolute -top-2.5 right-2 bg-[var(--primary)] text-[var(--ink)] border-2 border-[var(--ink)] text-[10px] font-heading font-black px-2 py-0.2 rounded-full flex items-center gap-1 shadow-[0_2px_0_var(--ink)] z-10 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--ink)] fill-[var(--ink)]" />
                  <span>Khoái khẩu!</span>
                </span>
              )}

              {/* Top Row: Icon Frame & Count Badge */}
              <div className="flex items-start justify-between">
                {/* 14px Rounded Square Icon Box with Pastel Tint */}
                <div
                  className={`w-13 h-13 rounded-2xl border-2 border-[var(--ink)] flex items-center justify-center p-1 shadow-[0_2px_0_var(--ink)] shrink-0 ${
                    !isAvailable ? 'grayscale' : ''
                  }`}
                  style={{ backgroundColor: tintColor }}
                >
                  <img
                    src={imageSrc}
                    alt={food.name}
                    className="w-10 h-10 object-contain drop-shadow-xs"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {!imageSrc && IconComponent && <IconComponent size={40} />}
                </div>

                {/* ×Count Pill Badge */}
                <div
                  className={`font-heading font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-[var(--ink)] shadow-[0_1.5px_0_var(--ink)] tabular-nums shrink-0 ${
                    isInfinite
                      ? 'bg-sky-400 text-white shadow-[0_1.5px_0_#0284c7]'
                      : isAvailable
                        ? 'bg-[var(--primary)] text-[var(--ink)]'
                        : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isInfinite ? 'FREE ∞' : (isAvailable ? `×${food.count}` : 'Hết')}
                </div>
              </div>

              {/* Middle Row: Food Name & Description */}
              <div className="mt-2 min-h-[42px]">
                <div className="text-xs font-heading font-black text-[var(--ink)] leading-snug line-clamp-1">
                  {food.name}
                </div>
                <div className="text-[10px] text-[var(--ink-soft)] font-medium line-clamp-2 mt-0.5 leading-tight">
                  {food.description}
                </div>
              </div>

              {/* Bottom Row: Nutrition Chips & Feed Action */}
              <div className="mt-2 pt-2 border-t border-[var(--line)] flex items-center justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                  {/* +No Bụng Chip */}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--mint-tint)] border border-[#1FA396]/30 text-[9px] font-heading font-black text-[var(--mint-deep)]">
                    <Utensils className="w-2.5 h-2.5" />
                    <span>+{food.hungerRestored}</span>
                  </span>

                  {/* +Vui Chip */}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--coral-tint)] border border-[#D94141]/30 text-[9px] font-heading font-black text-[var(--coral-deep)]">
                    <Heart className="w-2.5 h-2.5 fill-[var(--coral-deep)]" />
                    <span>+{food.happinessBonus}</span>
                  </span>

                  {/* +Năng lượng Chip */}
                  {food.energyBonus && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[9px] font-heading font-black text-amber-700">
                      <Zap className="w-2.5 h-2.5 fill-amber-500" />
                      <span>+{food.energyBonus}</span>
                    </span>
                  )}
                </div>

                {/* Chunky Mini Action Button */}
                <button
                  disabled={!isAvailable || isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFeed(food.id);
                  }}
                  className={`text-[10px] font-heading font-black px-2 py-0.5 rounded-xl border-2 transition-all cursor-pointer ${
                    isAvailable && !isBusy
                      ? 'bg-[var(--primary)] text-[var(--ink)] border-[var(--ink)] shadow-[0_1.5px_0_var(--ink)] active:translate-y-0.5 active:shadow-none'
                      : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isAvailable ? 'Đút ăn' : 'Hết'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================================
          4. POMODORO REWARD HINT BANNER
          =================================================================== */}
      <div className="card-sticker p-3 bg-white flex items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[var(--primary-tint)] border-2 border-[var(--ink)] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-heading font-black text-[var(--ink)]">
              Kiếm thêm thức ăn công nghệ?
            </h4>
            <p className="text-[10px] text-[var(--ink-soft)] font-medium truncate">
              Hoàn thành phiên Pomodoro 25m để rơi thêm thức ăn & món hiếm!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
