import React, { useState } from 'react';
import {
  Flame,
  Moon,
  Sun,
  Hand,
  RotateCcw,
  Bug,
  Zap,
  Heart,
  Fish,
  Timer,
  Utensils,
  Smile,
} from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { STARTER_PETS } from '../data/petConfigs';
import { PetCanvas } from './3d/PetCanvas';
import { FoodTray } from './FoodTray';
import { PomodoroTimer } from './PomodoroTimer';
import { useResetPetMutation } from '../hooks/usePetQueries';
import { tg } from '../utils/telegram';
import { petApi } from '../api/petApi';

type ActiveTab = 'PET' | 'FOCUS' | 'FOOD';

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

  const [activeTab, setActiveTab] = useState<ActiveTab>('PET');
  const [speechQuote, setSpeechQuote] = useState<string>(
    'Chào người anh em coder! Hôm nay chúng ta sẽ giải quyết bug nào đây?'
  );

  if (!pet) return null;

  const config = STARTER_PETS.find((p) => p.id === pet.type) || STARTER_PETS[0];

  // Quick interactions with Haptic Feedback
  const handlePoke = async () => {
    tg.haptic.impact('medium');
    pokePet();
    const fallbackQuotes = [
      'Ái chà! Nhột quá haha!',
      'Gõ phím tiếp đi, đừng chọc trẫm nữa!',
      'Được xoa đầu sướng quá, thêm 1 Pomodoro nào!',
      'Bé pet tăng 3 điểm hạnh phúc nè!',
      'Hôm nay bạn code đỉnh thật đấy!',
    ];
    // Immediate playful reaction
    setSpeechQuote(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]);

    // Dynamic AI reaction from backend
    try {
      const aiQuote = await petApi.generateSpeech(pet.customName, pet.type, pet.mood);
      if (aiQuote) setSpeechQuote(aiQuote);
    } catch {
      // Fallback kept
    }
  };

  const handleToggleSleep = () => {
    tg.haptic.impact('light');
    toggleSleep();
    setSpeechQuote(pet.isSleeping ? 'Oa... đã ngủ dậy rồi, sẵn sàng code!' : 'Khò khò... trẫm đi ngủ nạp năng lượng đây Zzz');
  };

  const handleToggleDizzy = () => {
    tg.haptic.impact('rigid');
    if (pet.mood === 'DIZZY') {
      setMood('HAPPY');
      setSpeechQuote('Phù... đã hết chóng mặt rồi! Tỉnh táo lại rồi!');
    } else {
      setMood('DIZZY');
      setSpeechQuote('Ôi mẹ ơi... nhiều bug quá, hoa hết cả mắt rồi @@!');
    }
  };

  const handleResetPet = () => {
    tg.haptic.impact('heavy');
    resetMutation.mutate();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-3.5 md:p-5 select-none relative pb-20">
      {/* 1. Playful Top Bar */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-950 shadow-md font-['Fredoka'] text-lg border-b-2 border-black/30"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-white font-['Fredoka']">{pet.customName}</h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 shadow-xs">
                Lv.{pet.level}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-['JetBrains_Mono']">{config.archetype}</div>
          </div>
        </div>

        {/* Streak & Change Pet */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-2xl shadow-xs">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-black text-amber-300 font-['JetBrains_Mono']">{pet.streak}d</span>
          </div>

          <button
            onClick={handleResetPet}
            disabled={resetMutation.isPending}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-700/60 transition-all cursor-pointer active:scale-95"
            title="Đổi thú cưng khác"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* EXP Progress Strip */}
      <div className="mt-2.5 space-y-1">
        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
          <span>Kinh nghiệm (EXP)</span>
          <span className="text-cyan-300 font-['JetBrains_Mono']">{pet.exp} / {pet.maxExp}</span>
        </div>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-400/50"
            style={{ width: `${Math.min(100, (pet.exp / pet.maxExp) * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. Main Content Based on Active Tab */}
      <main className="my-auto py-2">
        {activeTab === 'PET' && (
          <div className="flex flex-col items-center justify-center">
            {/* Speech Bubble */}
            <div className="relative mb-1 max-w-xs px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md text-xs text-slate-100 text-center font-['Fredoka'] tracking-wide animate-float">
              💬 {speechQuote}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700/80 rotate-45" />
            </div>

            {/* 3D Canvas Stage */}
            <div
              onClick={handlePoke}
              className="relative w-full h-[260px] flex items-center justify-center cursor-pointer"
            >
              {/* Glowing Aura */}
              <div
                className="absolute w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700"
                style={{ backgroundColor: config.primaryColor }}
              />

              <PetCanvas
                type={pet.type}
                mood={pet.mood}
                isFeeding={isFeeding}
                pokeTrigger={pokeAnimKey}
                feedTrigger={feedAnimKey}
                className="w-full h-full"
              />

              {/* Feeding Float Sticker */}
              {isFeeding && activeFoodFeeding && (
                <div className="absolute bottom-4 flex flex-col items-center pointer-events-none animate-bounce z-30">
                  <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse">
                    {activeFoodFeeding.icon}
                  </span>
                  <span className="text-[10px] font-black text-amber-300 bg-slate-950/90 px-2 py-0.5 rounded-full mt-1 border border-amber-400/50 shadow-md">
                    +{activeFoodFeeding.hungerRestored} No bụng!
                  </span>
                </div>
              )}
            </div>

            {/* Tactile Quick Action Buttons */}
            <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
              <button
                onClick={handlePoke}
                className="px-3.5 py-2 btn-3d-cyan text-xs"
              >
                <Hand className="w-3.5 h-3.5" /> Chọc bé
              </button>

              <button
                onClick={handleToggleSleep}
                className="px-3.5 py-2 btn-3d-slate text-xs"
              >
                {pet.isSleeping ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Thức dậy
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-400" /> Cho ngủ
                  </>
                )}
              </button>

              <button
                onClick={handleToggleDizzy}
                className={`px-3.5 py-2 text-xs rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-md ${
                  pet.mood === 'DIZZY'
                    ? 'bg-rose-500 text-slate-950 border-rose-800'
                    : 'bg-slate-800 text-slate-200 border-slate-950'
                }`}
                title="Bật biểu cảm mắt xoáy tít!"
              >
                <Bug className="w-3.5 h-3.5 text-rose-400" />
                {pet.mood === 'DIZZY' ? 'Hết bug' : 'Gặp Bug @@'}
              </button>
            </div>

            {/* Soft Pill Vitals Bar */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4">
              <div className="soft-card p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold mb-0.5">
                  <Fish className="w-3 h-3 text-orange-400" /> No bụng
                </div>
                <div className="text-xs font-black text-slate-100 font-['JetBrains_Mono']">{pet.hunger}/100</div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full mt-1 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all duration-300"
                    style={{ width: `${pet.hunger}%` }}
                  />
                </div>
              </div>

              <div className="soft-card p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold mb-0.5">
                  <Zap className="w-3 h-3 text-amber-400" /> Năng lượng
                </div>
                <div className="text-xs font-black text-slate-100 font-['JetBrains_Mono']">{pet.energy}/100</div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full mt-1 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${pet.energy}%` }}
                  />
                </div>
              </div>

              <div className="soft-card p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold mb-0.5">
                  <Heart className="w-3 h-3 text-rose-400" /> Hạnh phúc
                </div>
                <div className="text-xs font-black text-slate-100 font-['JetBrains_Mono']">{pet.happiness}/100</div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full mt-1 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-rose-400 rounded-full transition-all duration-300"
                    style={{ width: `${pet.happiness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'FOCUS' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <PomodoroTimer />
          </div>
        )}

        {activeTab === 'FOOD' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <FoodTray />
          </div>
        )}
      </main>

      {/* 3. Telegram Mini App Fixed Bottom Thumb-Zone Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 border-t border-slate-800/80 px-4 py-2 backdrop-blur-xl z-50 flex items-center justify-around">
        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveTab('PET');
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'PET' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'PET' ? 'bg-cyan-500/20' : ''}`}>
            <Smile className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black font-['Fredoka']">Linh Thú</span>
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveTab('FOCUS');
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'FOCUS' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'FOCUS' ? 'bg-cyan-500/20' : ''}`}>
            <Timer className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black font-['Fredoka']">Pomodoro</span>
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveTab('FOOD');
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'FOOD' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'FOOD' ? 'bg-cyan-500/20' : ''}`}>
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black font-['Fredoka']">Túi Đồ Ăn</span>
        </button>
      </nav>
    </div>
  );
};
