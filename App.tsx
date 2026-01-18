
import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar } from 'lucide-react';
import { Payment, Task } from './types';
import { PaymentScreen } from './components/PaymentScreen';
import { PlannerScreen } from './components/PlannerScreen';
import { audioService } from './services/audio';

type Screen = 'payments' | 'planner';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('payments');
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('lifeflow_payments');
    return saved ? JSON.parse(saved) : [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('lifeflow_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('lifeflow_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('lifeflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleTabChange = (screen: Screen) => {
    setActiveScreen(screen);
    audioService.playTick();
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-rose-50 shadow-2xl overflow-hidden relative border-x border-rose-100">
      <main className="flex-1 overflow-hidden">
        {activeScreen === 'payments' ? (
          <PaymentScreen payments={payments} setPayments={setPayments} />
        ) : (
          <PlannerScreen tasks={tasks} setTasks={setTasks} />
        )}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-rose-100 pb-safe shadow-[0_-4px_20px_rgba(244,63,94,0.1)]">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => handleTabChange('payments')}
            className={`flex flex-col items-center space-y-1 w-full transition-all ${
              activeScreen === 'payments' ? 'text-rose-500 scale-105' : 'text-slate-300'
            }`}
          >
            <CreditCard size={24} strokeWidth={activeScreen === 'payments' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pagos</span>
          </button>
          
          <button 
            onClick={() => handleTabChange('planner')}
            className={`flex flex-col items-center space-y-1 w-full transition-all ${
              activeScreen === 'planner' ? 'text-purple-500 scale-105' : 'text-slate-300'
            }`}
          >
            <Calendar size={24} strokeWidth={activeScreen === 'planner' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Semana</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
