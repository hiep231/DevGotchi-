import React, { useEffect } from 'react';
import { usePetStore } from './store/usePetStore';
import { usePetQuery } from './hooks/usePetQueries';
import { StarterSelection } from './components/StarterSelection';
import { PetDashboard } from './components/PetDashboard';
import { tg } from './utils/telegram';

export const App: React.FC = () => {
  const { pet: localPet } = usePetStore();
  const { data: serverPet, isLoading } = usePetQuery();

  // Initialize Telegram WebApp on launch
  useEffect(() => {
    tg.init();
  }, []);

  const activePet = serverPet ?? localPet;

  if (isLoading && !localPet) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent shadow-lg shadow-cyan-500/20" />
        <span className="text-xs font-bold text-slate-400 font-['Fredoka'] animate-pulse">
          Đang nạp DevGotchi...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center">
      {/* Mobile-first Telegram Web App Viewport Container */}
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-radial from-slate-900 via-slate-950 to-black border-x border-slate-900/60 shadow-2xl overflow-y-auto">
        {!activePet ? <StarterSelection /> : <PetDashboard />}
      </div>
    </div>
  );
};

export default App;
