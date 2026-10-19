import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ChevronLeft, ChevronRight, Sparkles, Heart, Zap, Shield, Wand2 } from 'lucide-react';
import { STARTER_PETS } from '../data/petConfigs';
import { useAdoptPetMutation } from '../hooks/usePetQueries';
import { PetCanvas } from './3d/PetCanvas';
import { tg } from '../utils/telegram';

export const StarterSelection: React.FC = () => {
  const adoptMutation = useAdoptPetMutation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [petName, setPetName] = useState('');

  const currentConfig = STARTER_PETS[currentIndex];

  const handlePrev = () => {
    tg.haptic.selection();
    setCurrentIndex((prev) => (prev === 0 ? STARTER_PETS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    tg.haptic.selection();
    setCurrentIndex((prev) => (prev === STARTER_PETS.length - 1 ? 0 : prev + 1));
  };

  const handleAdopt = () => {
    tg.haptic.notification('success');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    adoptMutation.mutate({
      type: currentConfig.id,
      customName: petName.trim() || currentConfig.name,
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 md:p-6 text-slate-100 select-none">
      {/* Top Header */}
      <header className="text-center space-y-1.5 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
          DevGotchi • Telegram Mini App
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white font-['Fredoka'] tracking-tight">
          Chọn Thú Cưng Khởi Đầu
        </h1>
        <p className="text-slate-400 text-xs max-w-xs mx-auto">
          Linh thú 3D đồng hành, thúc đẩy kỷ luật code mỗi ngày!
        </p>
      </header>

      {/* 3D Pet Showcase Card */}
      <div className="flex flex-col items-center justify-center relative my-auto py-2">
        {/* Soft Glowing Aura */}
        <div
          className="absolute w-56 h-56 rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: currentConfig.primaryColor }}
        />

        {/* 3D Pet Canvas */}
        <div className="relative w-full h-[260px] flex items-center justify-center z-10">
          <PetCanvas type={currentConfig.id} mood="HAPPY" className="w-full h-full" />
        </div>

        {/* Tactile Carousel Controls */}
        <div className="flex items-center gap-4 mt-1 z-20">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-2xl bg-slate-800 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Thú cưng trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2 items-center px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800">
            {STARTER_PETS.map((pet, idx) => (
              <button
                key={pet.id}
                onClick={() => {
                  tg.haptic.selection();
                  setCurrentIndex(idx);
                }}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={pet.name}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-2xl bg-slate-800 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Thú cưng tiếp theo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gamified Soft UI Details Card */}
      <div className="soft-card p-4 md:p-5 space-y-3.5 my-2">
        {/* Badges & Name */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white font-['Fredoka']">
                {currentConfig.name}
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs"
                style={{
                  backgroundColor: `${currentConfig.primaryColor}25`,
                  color: currentConfig.primaryColor,
                  border: `1px solid ${currentConfig.primaryColor}50`,
                }}
              >
                {currentConfig.archetype}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-['JetBrains_Mono'] mt-0.5">
              {currentConfig.species} • "{currentConfig.tagline}"
            </p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Focus
            </span>
            <div className="text-xs font-black text-slate-200 mt-0.5">{currentConfig.stats.focusBonus}/100</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" /> Kháng
            </span>
            <div className="text-xs font-black text-slate-200 mt-0.5">{currentConfig.stats.decayResistance}/100</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> Vui vẻ
            </span>
            <div className="text-xs font-black text-slate-200 mt-0.5">{currentConfig.stats.initialHappiness}/100</div>
          </div>
        </div>

        {/* Passive Perk */}
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-2.5 flex items-start gap-2.5">
          <div className="p-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold mt-0.5">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-amber-300 block">Kỹ Năng Bị Động:</span>
            <span className="text-[11px] text-slate-300 leading-tight block">{currentConfig.passivePerk}</span>
          </div>
        </div>

        {/* Name input & 3D Tactile Adopt Button */}
        <div className="space-y-2 pt-1">
          <input
            type="text"
            placeholder={`Đặt tên cho bé (mặc định: ${currentConfig.name})`}
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            maxLength={18}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 font-['Fredoka'] transition-colors"
          />

          <button
            onClick={handleAdopt}
            disabled={adoptMutation.isPending}
            className="w-full py-3.5 btn-3d-cyan text-sm tracking-wide"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            Nhận nuôi {petName.trim() || currentConfig.name}!
          </button>
        </div>
      </div>

      <footer className="text-center text-[10px] text-slate-500 pt-2 pb-1">
        DevGotchi Mini App • Chạm để tương tác 3D
      </footer>
    </div>
  );
};
