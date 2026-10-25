import React from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Zap, Heart, Utensils, Compass, Gift } from 'lucide-react';
import { AfkAdventureData, PetState } from '../../types/pet';
import { MASCOT_IMAGES } from '../3d/PetCanvas';
import { tg } from '../../utils/telegram';
import { useFoodsQuery, useClaimAfkMutation } from '../../hooks/usePetQueries';
import { usePetStore } from '../../store/usePetStore';

interface AfkAdventureModalProps {
  afkData: AfkAdventureData;
  pet: PetState;
  onClose: () => void;
}

export const AfkAdventureModal: React.FC<AfkAdventureModalProps> = ({
  afkData,
  pet,
  onClose,
}) => {
  const { foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const claimMutation = useClaimAfkMutation();

  const petMascotSrc = MASCOT_IMAGES[pet.type];

  const handleClaim = async () => {
    tg.haptic.notification('success');
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.4 },
      colors: ['#FFB703', '#FF6B6B', '#2EC4B6', '#8E7CFF'],
    });

    try {
      await claimMutation.mutateAsync({
        pet,
        foods,
        afkData,
      });
    } catch (err) {
      console.error('Failed to claim AFK adventure reward:', err);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="card-sticker bg-white max-w-[340px] w-full p-5 flex flex-col items-center text-center gap-3 animate-pop-in shadow-[0_12px_32px_rgba(45,42,74,0.2)] relative">
        {/* Floating Top Badge */}
        <div className="absolute -top-3.5 bg-[var(--coral)] text-white text-[11px] font-heading font-black px-3 py-0.5 rounded-full border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)] flex items-center gap-1 animate-bounce">
          <Compass className="w-3.5 h-3.5 stroke-[2.5px]" />
          <span>Thám Hiểm Khi Vắng Nhà</span>
        </div>

        {/* Mascot Avatar with Backpack Theme */}
        <div className="relative mt-2">
          <div className="w-20 h-20 rounded-3xl bg-[var(--primary-tint)] border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)] flex items-center justify-center overflow-hidden">
            {petMascotSrc ? (
              <img
                src={petMascotSrc}
                alt={pet.customName}
                className="w-16 h-16 object-contain drop-shadow-sm"
              />
            ) : (
              <span className="text-3xl">🎒</span>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 text-lg">🎒</span>
        </div>

        {/* Title & Time Away */}
        <div>
          <h3 className="text-lg font-heading font-black text-[var(--ink)] tracking-tight">
            {pet.customName} vừa đi dạo về!
          </h3>
          <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-[var(--ink-soft)] border border-amber-200 text-[10px] font-heading font-extrabold">
            ⏱️ Đã vắng nhà: <b>{afkData.hoursAway} tiếng</b>
          </span>
        </div>

        {/* Story Bubble */}
        <div className="w-full p-2.5 rounded-2xl bg-[#FFF9E6] border border-[#F59E0B]/30 text-xs text-[var(--ink)] font-medium leading-relaxed italic text-left relative">
          <span className="text-[var(--coral-deep)] font-black not-italic block mb-0.5">
            🐾 {pet.customName} hào hứng kể:
          </span>
          "{afkData.story}"
        </div>

        {/* Loot Inventory Grid */}
        <div className="w-full flex flex-col gap-1.5 p-3 rounded-2xl bg-[var(--mint-tint)] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)] text-left">
          <span className="text-[10px] font-heading font-black text-[var(--mint-deep)] uppercase flex items-center gap-1">
            <Gift className="w-3 h-3" />
            <span>Chiến lợi phẩm thu hoạch:</span>
          </span>

          <div className="flex flex-col gap-1 text-xs font-heading font-extrabold text-[var(--ink)]">
            {/* Food items */}
            {afkData.loot.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                </span>
                <span className="text-[var(--primary-deep)] font-black">+{item.count} phần</span>
              </div>
            ))}

            {/* EXP */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--mint-deep)]" />
                <span>Kinh nghiệm tích lũy:</span>
              </span>
              <span className="text-[var(--mint-deep)] font-black">+{afkData.expGained} EXP</span>
            </div>

            {/* Energy Fully Recharged */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Năng lượng (⚡):</span>
              </span>
              <span className="text-amber-600 font-black">Sạc đầy 100%</span>
            </div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={claimMutation.isPending}
          className="w-full py-3 px-4 rounded-2xl border-2 border-[var(--ink)] bg-[var(--primary)] text-xs font-heading font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)] active:translate-y-[2px] active:shadow-none hover:border-[var(--primary-deep)] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
        >
          <Gift className="w-4 h-4" />
          <span>
            {claimMutation.isPending ? 'Đang nhận quà...' : 'NHẬN CHIẾN LỢI PHẨM 🎁'}
          </span>
        </button>
      </div>
    </div>
  );
};
