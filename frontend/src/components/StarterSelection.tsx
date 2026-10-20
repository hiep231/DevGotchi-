import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ChevronLeft, ChevronRight, Sparkles, Heart, Zap, Shield, Wand2 } from 'lucide-react';
import { STARTER_PETS } from '../data/petConfigs';
import { useAdoptPetMutation } from '../hooks/usePetQueries';
import { PetCanvas } from './3d/PetCanvas';
import { tg } from '../utils/telegram';
import { IconButton } from './ui/IconButton';

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
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
    });
    adoptMutation.mutate({
      type: currentConfig.id,
      customName: petName.trim() || currentConfig.name,
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 text-[var(--ink)] select-none">
      {/* Top Header */}
      <header className="text-center space-y-1 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-tint)] border border-[#E09A00]/40 text-[var(--ink)] text-[11px] font-heading font-extrabold uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
          <span>DevGotchi • Telegram Mini App</span>
        </div>
        <h1 className="text-2xl font-heading font-black text-[var(--ink)] tracking-tight">
          Chọn Thú Cưng Khởi Đầu
        </h1>
        <p className="text-[var(--ink-soft)] text-xs max-w-xs mx-auto font-medium">
          Linh thú 3D đồng hành, cùng bạn hoàn thành từng phiên code mỗi ngày!
        </p>
      </header>

      {/* 3D Pet Showcase Stage */}
      <div className="flex flex-col items-center justify-center my-2">
        <div
          className="relative w-full h-[250px] rounded-3xl border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] overflow-hidden flex flex-col items-center justify-between p-2 select-none"
          style={{
            background: 'linear-gradient(180deg, var(--bg-sky) 0%, #FFF6E5 100%)',
          }}
        >
          {/* 3D Pet Canvas */}
          <div className="relative w-full h-[190px] flex items-center justify-center z-10">
            <PetCanvas type={currentConfig.id} mood="HAPPY" className="w-full h-full" />
          </div>

          {/* Grassy Pedestal */}
          <div className="relative w-44 h-7 flex items-center justify-center -mt-3 z-0">
            <div className="absolute w-36 h-4 bg-[#2D2A4A]/15 rounded-full blur-[2px]" />
            <div className="w-36 h-5 bg-[#A7E8BD] border-2 border-[var(--ink)] rounded-full shadow-[0_2.5px_0_var(--ink)] flex items-center justify-center">
              <div className="w-28 h-2 bg-[#84D8A2] rounded-full" />
            </div>
          </div>
        </div>

        {/* Tactile Carousel Controls */}
        <div className="flex items-center gap-4 mt-2.5 z-20">
          <IconButton
            variant="sticker"
            size={42}
            onClick={handlePrev}
            title="Thú cưng trước"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--ink)]" />
          </IconButton>

          <div className="flex gap-2 items-center px-3.5 py-1.5 rounded-full bg-white border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]">
            {STARTER_PETS.map((pet, idx) => (
              <button
                key={pet.id}
                onClick={() => {
                  tg.haptic.selection();
                  setCurrentIndex(idx);
                }}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-[var(--primary)] border border-[var(--ink)] shadow-xs'
                    : 'w-2 bg-[var(--line-strong)] hover:bg-[var(--ink-soft)]'
                }`}
                title={pet.name}
              />
            ))}
          </div>

          <IconButton
            variant="sticker"
            size={42}
            onClick={handleNext}
            title="Thú cưng tiếp theo"
          >
            <ChevronRight className="w-5 h-5 text-[var(--ink)]" />
          </IconButton>
        </div>
      </div>

      {/* Details Sticker Card */}
      <div className="card-sticker p-4 space-y-3 bg-white">
        {/* Name & Archetype Tag */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-heading font-black text-[var(--ink)]">
                {currentConfig.name}
              </h2>
              <span className="text-[11px] font-heading font-black px-2.5 py-0.5 rounded-full bg-[var(--primary-tint)] text-[var(--ink)] border border-[#E09A00]/40 shadow-xs">
                {currentConfig.roleBadge}
              </span>
            </div>
            <div className="text-xs font-heading font-extrabold text-[var(--grape-deep)] mt-1">
              🎯 {currentConfig.targetRole}
            </div>
            <p className="text-[var(--ink-soft)] text-xs mt-0.5 font-medium">
              "{currentConfig.tagline}"
            </p>
          </div>
        </div>

        {/* 3 Stats Chips */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#FFF9EE] border border-[var(--line)] rounded-2xl p-2 text-center">
            <span className="text-[10px] font-heading font-bold text-[var(--ink-soft)] flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Focus
            </span>
            <div className="text-xs font-heading font-black text-[var(--ink)] mt-0.5 tabular-nums">
              {currentConfig.stats.focusBonus}/100
            </div>
          </div>

          <div className="bg-[#FFF9EE] border border-[var(--line)] rounded-2xl p-2 text-center">
            <span className="text-[10px] font-heading font-bold text-[var(--ink-soft)] flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-[var(--sky)]" /> Kháng
            </span>
            <div className="text-xs font-heading font-black text-[var(--ink)] mt-0.5 tabular-nums">
              {currentConfig.stats.decayResistance}/100
            </div>
          </div>

          <div className="bg-[#FFF9EE] border border-[var(--line)] rounded-2xl p-2 text-center">
            <span className="text-[10px] font-heading font-bold text-[var(--ink-soft)] flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-[var(--coral)] fill-[var(--coral)]" /> Vui vẻ
            </span>
            <div className="text-xs font-heading font-black text-[var(--ink)] mt-0.5 tabular-nums">
              {currentConfig.stats.initialHappiness}/100
            </div>
          </div>
        </div>

        {/* Passive Perk Box */}
        <div className="bg-[var(--primary-tint)] border border-[#E09A00]/40 rounded-2xl p-2.5 flex items-start gap-2.5">
          <div className="p-1.5 rounded-xl bg-[var(--primary)] border border-[var(--ink)] text-[var(--ink)] font-bold mt-0.5 shadow-xs">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-heading font-black text-[var(--ink)] block">
              Kỹ Năng Bị Động:
            </span>
            <span className="text-[11px] text-[var(--ink-soft)] font-medium leading-tight block">
              {currentConfig.passivePerk}
            </span>
          </div>
        </div>

        {/* Pet Name Input & 56px Chunky Adopt Button */}
        <div className="space-y-2.5 pt-1">
          <input
            type="text"
            placeholder={`Đặt tên cho bé (mặc định: ${currentConfig.name})`}
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            maxLength={18}
            className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[var(--line)] text-[var(--ink)] placeholder-[var(--ink-soft)]/60 text-xs font-heading font-bold focus:outline-none focus:border-[var(--ink)] transition-colors shadow-xs"
          />

          <button
            onClick={handleAdopt}
            disabled={adoptMutation.isPending}
            className="w-full h-14 btn-chunky btn-chunky-primary text-base flex items-center justify-center gap-2"
          >
            <span>Nhận Nuôi {currentConfig.name}</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
