import React from 'react';
import { usePetStore } from './store/usePetStore';
import { StarterSelection } from './components/StarterSelection';
import { PetDashboard } from './components/PetDashboard';

export const App: React.FC = () => {
  const { pet } = usePetStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!pet ? <StarterSelection /> : <PetDashboard />}
    </div>
  );
};

export default App;
