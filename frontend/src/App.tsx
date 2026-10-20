import React, { useEffect } from 'react';
import { usePetStore } from './store/usePetStore';
import { usePetQuery } from './hooks/usePetQueries';
import { StarterSelection } from './components/StarterSelection';
import { PetDashboard } from './components/PetDashboard';
import { TapEffectOverlay } from './components/ui/TapEffectOverlay';
import { tg } from './utils/telegram';

export const App: React.FC = () => {
  const { pet: localPet, setPet } = usePetStore();
  const { data: serverPet, isLoading } = usePetQuery();

  // Initialize Telegram WebApp on launch
  useEffect(() => {
    tg.init();
  }, []);

  // Sync server pet to zustand store whenever server query settles
  useEffect(() => {
    if (!isLoading && serverPet !== undefined) {
      setPet(serverPet);
    }
  }, [serverPet, isLoading, setPet]);

  // When loading account data from backend, display cute loader to prevent leaking previous user's pet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF6E5] text-[#2D2A4A] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] flex items-center justify-center animate-bounce">
          <span className="text-xl">🐾</span>
        </div>
        <span className="text-sm font-heading font-extrabold text-[var(--ink-soft)] tracking-wide">
          Đang nạp dữ liệu DevGotchi...
        </span>
      </div>
    );
  }

  // Once loaded: serverPet is authoritative if defined, otherwise localPet
  const activePet = serverPet !== undefined ? serverPet : localPet;

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#2D2A4A] flex justify-center">
      {/* Global Interactive Tap/Click Particle & Haptic System */}
      <TapEffectOverlay />

      {/* Mobile-first Telegram Web App Viewport Container */}
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-[#FFF6E5] border-x-2 border-[#E8DCC4] shadow-[0_0_30px_rgba(45,42,74,0.08)] overflow-y-auto">
        {!activePet ? <StarterSelection /> : <PetDashboard />}
      </div>
    </div>
  );
};

export default App;
