import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Moon,
  Sun,
  Hand,
  RotateCcw,
  Volume2,
  Bug,
  Smile,
  Zap,
  Heart,
  Fish,
} from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { STARTER_PETS } from '../data/petConfigs';
import { PetCanvas } from './3d/PetCanvas';
import { FoodTray } from './FoodTray';
import { PomodoroTimer } from './PomodoroTimer';
import { useResetPetMutation } from '../hooks/usePetQueries';

export const PetDashboard: React.FC = () => {
  const resetMutation = useResetPetMutation();
  const {
    pet,
    isFeeding,
    activeFoodFeeding,
    feedAnimKey,
    pokeAnimKey,
    pokePet,
    setMood,
    toggleSleep,
  } = usePetStore();

  const [speechQuote, setSpeechQuote] = useState<string>(
    'Chào người anh em coder! Hôm nay chúng ta sẽ giải quyết bug nào đây?'
  );

  if (!pet) return null;

  const config = STARTER_PETS.find((p) => p.id === pet.type) || STARTER_PETS[0];

  // Quick interactions
  const handlePoke = () => {
    pokePet();
    const quotes = [
      'Ái chà! Nhột quá đi mất haha!',
      'Gõ phím tiếp đi, đừng chọc trẫm nữa!',
      'Được xoa đầu sướng quá, thêm 1 Pomodoro nào!',
      'Bé pet tăng 3 điểm hạnh phúc nè!',
    ];
    setSpeechQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  const handleToggleDizzy = () => {
    if (pet.mood === 'DIZZY') {
      setMood('HAPPY');
      setSpeechQuote('Phù... đã hết chóng mặt rồi! Tỉnh táo lại rồi!');
    } else {
      setMood('DIZZY');
      setSpeechQuote('Ôi mẹ ơi... nhiều bug quá, hoa hết cả mắt rồi @@!');
    }
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-4 md:p-6">
      {/* 1. Top Navigation Bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-950 shadow-md font-['Fredoka'] text-lg"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-['Fredoka']">{pet.customName}</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Lv.{pet.level}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-['JetBrains_Mono']">{config.species}</div>
          </div>
        </div>

        {/* Middle: EXP & Streak */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-2xl shadow-sm">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-slate-200">{pet.streak} ngày streak</span>
          </div>

          <div className="w-44 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>EXP</span>
              <span className="text-slate-300 font-semibold">{pet.exp} / {pet.maxExp}</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (pet.exp / pet.maxExp) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isPending}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
          title="Chọn lại thú cưng khác"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Đổi thú cưng</span>
        </button>
      </header>

      {/* 2. Main Center 3D Stage */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 items-center">
        {/* Left Column: 3D Pet & Interactions */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
          {/* Glowing Aura */}
          <div
            className="absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: config.primaryColor }}
          />

          {/* Speech Bubble */}
          <div className="relative mb-2 z-20 max-w-sm px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md text-xs text-slate-200 text-center font-['Fredoka'] tracking-wide">
            💬 {speechQuote}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700/80 rotate-45" />
          </div>

          {/* 3D Canvas with click interaction */}
          <div
            onClick={handlePoke}
            className="relative w-full h-[280px] md:h-[340px] flex items-center justify-center z-10"
          >
            <PetCanvas
              type={pet.type}
              mood={pet.mood}
              isFeeding={isFeeding}
              pokeTrigger={pokeAnimKey}
              feedTrigger={feedAnimKey}
              className="w-full h-full"
            />

            {/* Glowing Feeding Item overlay when feeding (like in user reference image!) */}
            {isFeeding && activeFoodFeeding && (
              <div className="absolute bottom-6 flex flex-col items-center pointer-events-none animate-bounce z-30">
                <div className="w-16 h-16 rounded-full bg-gradient-to-t from-orange-500/40 via-amber-300/30 to-transparent blur-md absolute -inset-2" />
                <span className="text-4xl drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse">
                  {activeFoodFeeding.icon}
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-full mt-1 border border-amber-400/40">
                  {activeFoodFeeding.name}!
                </span>
              </div>
            )}
          </div>

          {/* Interaction Pills Bar */}
          <div className="flex items-center gap-2 mt-2 z-20 flex-wrap justify-center">
            <button
              onClick={handlePoke}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Hand className="w-3.5 h-3.5 text-cyan-400" /> Chọc bé
            </button>

            <button
              onClick={toggleSleep}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {pet.isSleeping ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Đánh thức
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Cho ngủ
                </>
              )}
            </button>

            <button
              onClick={handleToggleDizzy}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                pet.mood === 'DIZZY'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Bật mắt xoáy chóng mặt giống ảnh mẫu!"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              {pet.mood === 'DIZZY' ? 'Hết bug' : 'Gặp Bug @@'}
            </button>
          </div>

          {/* Real-time Pet Vitals (Hunger, Energy, Happiness) */}
          <div className="w-full max-w-md grid grid-cols-3 gap-3 mt-4">
            {/* Hunger */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                <Fish className="w-3 h-3 text-orange-400" /> No bụng
              </div>
              <div className="text-sm font-bold text-slate-100">{pet.hunger}/100</div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${pet.hunger}%` }}
                />
              </div>
            </div>

            {/* Energy */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                <Zap className="w-3 h-3 text-amber-400" /> Năng lượng
              </div>
              <div className="text-sm font-bold text-slate-100">{pet.energy}/100</div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${pet.energy}%` }}
                />
              </div>
            </div>

            {/* Happiness */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                <Heart className="w-3 h-3 text-rose-400" /> Hạnh phúc
              </div>
              <div className="text-sm font-bold text-slate-100">{pet.happiness}/100</div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-300"
                  style={{ width: `${pet.happiness}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pomodoro Focus Timer & Food Tray */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <PomodoroTimer />
          <FoodTray />
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 pt-3 border-t border-slate-800/80">
        DevGotchi &copy; 2026 • Giữ kỷ luật Pomodoro, nuôi dưỡng linh thú công nghệ của bạn.
      </footer>
    </div>
  );
};
