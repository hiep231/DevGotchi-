import React from 'react';
import { usePetStore } from './store/usePetStore';
import { usePetQuery } from './hooks/usePetQueries';
import { StarterSelection } from './components/StarterSelection';
import { PetDashboard } from './components/PetDashboard';

export const App: React.FC = () => {
  const { pet: localPet } = usePetStore();
  const { data: serverPet, isLoading } = usePetQuery();

  const activePet = serverPet ?? localPet;

  if (isLoading && !localPet) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!activePet ? <StarterSelection /> : <PetDashboard />}
    </div>
  );
};

export default App;
