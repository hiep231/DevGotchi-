import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ChevronLeft, ChevronRight, Sparkles, Heart, Zap, Shield, Wand2 } from 'lucide-react';
import { STARTER_PETS } from '../data/petConfigs';
import { usePetStore } from '../store/usePetStore';
import { PetCanvas } from './3d/PetCanvas';

export const StarterSelection: React.FC = () => {
  const { adoptPet } = usePetStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [petName, setPetName] = useState('');

  const currentConfig = STARTER_PETS[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? STARTER_PETS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === STARTER_PETS.length - 1 ? 0 : prev + 1));
  };

  const handleAdopt = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    adoptPet(currentConfig.id, petName.trim() || currentConfig.name);
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          DevGotchi 3D Virtual Pet
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-['Fredoka']">
          Chọn Thú Cưng Khởi Đầu
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          Mỗi linh thú mang một tính cách và kỹ năng bổ trợ riêng cho hành trình code của bạn. Hãy chọn người bạn đồng hành ưng ý nhất!
        </p>
      </header>

      {/* Main 3D Showcase & Info */}
      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-6">
        {/* Left Column: 3D Pet Viewer with Carousel Controls */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          {/* Glowing Aura Behind 3D Canvas */}
          <div
            className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl opacity-25 transition-all duration-700 pointer-events-none"
            style={{ backgroundColor: currentConfig.primaryColor }}
          />

          {/* 3D Pet Canvas */}
          <div className="relative w-full h-[320px] md:h-[400px] flex items-center justify-center z-10">
            <PetCanvas type={currentConfig.id} mood="HAPPY" className="w-full h-full" />
          </div>

          {/* Carousel Arrows & Dots */}
          <div className="flex items-center gap-6 mt-4 z-20">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 shadow-lg hover:scale-110 active:scale-95 transition-all"
              title="Thú cưng trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {STARTER_PETS.map((pet, idx) => (
                <button
                  key={pet.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-8 bg-cyan-400 shadow-md shadow-cyan-400/50'
                      : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={pet.name}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 shadow-lg hover:scale-110 active:scale-95 transition-all"
              title="Thú cưng tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Column: Pet Details Card */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Header & Badges */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                {currentConfig.species}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: `${currentConfig.primaryColor}20`,
                  color: currentConfig.primaryColor,
                  border: `1px solid ${currentConfig.primaryColor}40`,
                }}
              >
                {currentConfig.archetype}
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white mt-3 font-['Fredoka']">
              {currentConfig.name}
            </h2>
            <p className="text-slate-400 text-xs italic mt-1 font-['JetBrains_Mono']">
              "{currentConfig.tagline}"
            </p>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">
            {currentConfig.description}
          </p>

          {/* Stats Bar */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Focus Energy</span>
                <span className="font-semibold text-slate-200">{currentConfig.stats.focusBonus}/100</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${currentConfig.stats.focusBonus}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-cyan-400" /> Decay Resistance</span>
                <span className="font-semibold text-slate-200">{currentConfig.stats.decayResistance}/100</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${currentConfig.stats.decayResistance}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-400" /> Initial Happiness</span>
                <span className="font-semibold text-slate-200">{currentConfig.stats.initialHappiness}/100</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${currentConfig.stats.initialHappiness}%` }}
                />
              </div>
            </div>
          </div>

          {/* Passive Perk Box */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">Kỹ Năng Bị Động (Passive Buff):</div>
              <div className="text-xs text-slate-300 mt-0.5">{currentConfig.passivePerk}</div>
            </div>
          </div>

          {/* Name Input & Adopt Button */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Đặt tên cho bé (hoặc giữ tên mặc định):
              </label>
              <input
                type="text"
                placeholder={currentConfig.name}
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <button
              onClick={handleAdopt}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer font-['Fredoka'] text-base tracking-wide"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              Nhận nuôi {petName.trim() || currentConfig.name}!
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-500 pb-2">
        DevGotchi &copy; 2026 • 3D Gamified Virtual Pet for Developers • React & Three.js
      </footer>
    </div>
  );
};
