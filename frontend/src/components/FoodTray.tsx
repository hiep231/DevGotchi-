import React from 'react';
import { Sparkles, Utensils } from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { STARTER_PETS } from '../data/petConfigs';
import { useFeedPetMutation, useFoodsQuery } from '../hooks/usePetQueries';

export const FoodTray: React.FC = () => {
  const { pet, isFeeding, foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const feedMutation = useFeedPetMutation();

  if (!pet) return null;

  const config = STARTER_PETS.find((p) => p.id === pet.type);

  const handleFeed = (foodId: string) => {
    feedMutation.mutate({
      foodId,
      pet,
      foods,
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
            <Utensils className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white font-['Fredoka']">Khay Thức Ăn (Inventory)</h3>
        </div>
        <span className="text-[11px] text-slate-400">Bấm món để cho bé ăn</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {foods.map((food) => {
          const isFav = config?.favoriteFood.toLowerCase().includes(food.name.toLowerCase());
          const isAvailable = food.count > 0;
          const isBusy = isFeeding || feedMutation.isPending;

          return (
            <button
              key={food.id}
              disabled={!isAvailable || isBusy}
              onClick={() => handleFeed(food.id)}
              className={`relative p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group ${
                isAvailable && !isBusy
                  ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-cyan-500/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 active:translate-y-0 cursor-pointer'
                  : 'bg-slate-900/40 border-slate-800/40 opacity-40 cursor-not-allowed'
              } ${isFav ? 'ring-1 ring-amber-400/50' : ''}`}
            >
              {isFav && (
                <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> Khoái khẩu!
                </span>
              )}

              <div className="flex items-center justify-between">
                <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
                  {food.icon}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-700">
                  x{food.count}
                </span>
              </div>

              <div className="mt-2">
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {food.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="text-emerald-400">+{food.hungerRestored} No</span>
                  <span>•</span>
                  <span className="text-rose-400">+{food.happinessBonus} Vui</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
