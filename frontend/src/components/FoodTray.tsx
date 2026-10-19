import React from 'react';
import { Sparkles, Utensils } from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { STARTER_PETS } from '../data/petConfigs';
import { useFeedPetMutation, useFoodsQuery } from '../hooks/usePetQueries';
import { tg } from '../utils/telegram';

export const FoodTray: React.FC = () => {
  const { pet, isFeeding, foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const feedMutation = useFeedPetMutation();

  if (!pet) return null;

  const config = STARTER_PETS.find((p) => p.id === pet.type);

  const handleFeed = (foodId: string) => {
    tg.haptic.impact('heavy');
    feedMutation.mutate({
      foodId,
      pet,
      foods,
    });
  };

  return (
    <div className="soft-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <Utensils className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-black text-white font-['Fredoka']">Túi Thức Ăn</h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
          Chạm để cho bé đớp
        </span>
      </div>

      {/* 3D Tactile Food Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {foods.map((food) => {
          const isFav = config?.favoriteFood.toLowerCase().includes(food.name.toLowerCase());
          const isAvailable = food.count > 0;
          const isBusy = isFeeding || feedMutation.isPending;

          return (
            <button
              key={food.id}
              disabled={!isAvailable || isBusy}
              onClick={() => handleFeed(food.id)}
              className={`relative p-3 rounded-2xl text-left transition-all flex flex-col justify-between select-none ${
                isAvailable && !isBusy
                  ? 'bg-slate-800/90 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 shadow-md hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-900/40 border border-slate-800/40 opacity-40 cursor-not-allowed'
              } ${isFav ? 'ring-2 ring-amber-400/70 shadow-amber-400/10' : 'border-t border-x border-slate-700/50'}`}
            >
              {isFav && (
                <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> Khoái khẩu!
                </span>
              )}

              <div className="flex items-center justify-between">
                <span className="text-3xl filter drop-shadow-sm transition-transform active:scale-125">
                  {food.icon}
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 font-['JetBrains_Mono']">
                  x{food.count}
                </span>
              </div>

              <div className="mt-2">
                <div className="text-xs font-black text-slate-100 font-['Fredoka']">
                  {food.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="text-emerald-400 font-bold">+{food.hungerRestored} No</span>
                  <span>•</span>
                  <span className="text-rose-400 font-bold">+{food.happinessBonus} Vui</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
