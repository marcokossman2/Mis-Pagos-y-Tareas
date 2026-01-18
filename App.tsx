
import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Calendar, History, Download, X, Share } from 'lucide-react';
import { Payment, Task, DayOfWeek, AppScreen } from './types.ts';
import { PaymentScreen } from './components/PaymentScreen.tsx';
import { PlannerScreen } from './components/PlannerScreen.tsx';
import { HistoryScreen } from './components/HistoryScreen.tsx';
import { audioService } from './services/audio.ts';

const SPANISH_DAYS: Record<number, DayOfWeek> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
};

const safeGetItem = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.warn("LocalStorage access denied:", e);
    return null;
  }
};

const safeSetItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("LocalStorage set denied:", e);
  }
};

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('payments');
  const [payments, setPayments] = useState<Payment[]>(() => safeGetItem('lifeflow_payments') || []);
  const [tasks, setTasks] = useState<Task[]>(() => safeGetItem('lifeflow_tasks') || []);
  const [deletedPayments, setDeletedPayments] = useState<Payment[]>(() => safeGetItem('lifeflow_deleted_payments') || []);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const notifiedPaymentsRef = useRef<Set<string>>(new Set());

  useEffect(() => { safeSetItem('lifeflow_payments', payments); }, [payments]);
  useEffect(() => { safeSetItem('lifeflow_tasks', tasks); }, [tasks]);
  useEffect(() => { safeSetItem('lifeflow_deleted_payments', deletedPayments); }, [deletedPayments]);

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) setShowInstallBanner(true);
    };

    if (isIosDevice && !isStandalone) setShowInstallBanner(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      tasks.forEach(task => {
        if (task.done || !task.reminderMinutes) return;
        if (task.day !== SPANISH_DAYS[now.getDay()]) return;

        const [taskH, taskM] = task.time.split(':').map(Number);
        const taskTimeInMinutes = taskH * 60 + taskM;
        const triggerTime = taskTimeInMinutes - task.reminderMinutes;
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
        const notificationKey = `task-${task.id}-${now.toDateString()}-${triggerTime}`;

        if (currentTimeInMinutes === triggerTime && !notifiedTasksRef.current.has(notificationKey)) {
          if (Notification.permission === "granted") {
            new Notification(`Agenda: ${task.name}`, {
              body: `Inicia en ${task.reminderMinutes} min.`,
              icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png'
            });
            audioService.playSuccess();
            notifiedTasksRef.current.add(notificationKey);
          }
        }
      });

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      payments.forEach(payment => {
        if (payment.paid) return;
        const isDueToday = payment.dueDate === todayStr;
        const isDueTomorrow = payment.dueDate === tomorrowStr;
        
        if (isDueToday || isDueTomorrow) {
          const notificationKey = `pay-${payment.id}-${todayStr}`;
          if (!notifiedPaymentsRef.current.has(notificationKey)) {
            if (Notification.permission === "granted") {
              new Notification(isDueToday ? '¡Vence HOY!' : 'Vence Mañana', {
                body: `${payment.description}: $${payment.amount.toLocaleString()}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png'
              });
              audioService.playSuccess();
              notifiedPaymentsRef.current.add(notificationKey);
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    checkReminders();
    return () => clearInterval(interval);
  }, [tasks, payments]);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert("Para instalar: Pulsa el botón 'Compartir' en Safari y selecciona 'Añadir a la pantalla de inicio'.");
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-rose-50 shadow-2xl overflow-hidden relative border-x border-rose-100">
      
      {showInstallBanner && (
        <div className="absolute top-[env(safe-area-inset-top,1rem)] left-4 right-4 z-[100] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white/95 backdrop-blur-xl border border-rose-100 p-4 rounded-[2rem] shadow-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                {isIOS ? <Share size={20} /> : <Download size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Instalar LifeFlow</p>
                <p className="text-[10px] text-slate-500 leading-tight">Mejor experiencia y alertas</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={handleInstallClick} className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md">
                {isIOS ? '¿Cómo?' : 'Instalar'}
              </button>
              <button onClick={() => setShowInstallBanner(false)} className="p-2 text-slate-300"><X size={18} /></button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden pt-[env(safe-area-inset-top,0px)]">
        {activeScreen === 'payments' && (
          <PaymentScreen payments={payments} setPayments={setPayments} onDelete={(id) => {
            const p = payments.find(x => x.id === id);
            if (p) {
              setDeletedPayments(prev => [p, ...prev]);
              setPayments(prev => prev.filter(x => x.id !== id));
              audioService.playTick();
            }
          }} />
        )}
        {activeScreen === 'planner' && <PlannerScreen tasks={tasks} setTasks={setTasks} />}
        {activeScreen === 'history' && (
          <HistoryScreen 
            payments={payments} setPayments={setPayments}
            deletedPayments={deletedPayments} setDeletedPayments={setDeletedPayments}
          />
        )}
      </main>

      <nav className="bg-white/95 backdrop-blur-lg border-t border-rose-100 pb-[env(safe-area-inset-bottom,1rem)] shadow-lg z-10">
        <div className="flex justify-around items-center h-16 px-4">
          <button onClick={() => setActiveScreen('payments')} className={`flex flex-col items-center justify-center w-full ${activeScreen === 'payments' ? 'text-rose-500' : 'text-slate-300'}`}>
            <CreditCard size={22} />
            <span className="text-[8px] font-bold uppercase mt-1">Pagos</span>
          </button>
          <button onClick={() => setActiveScreen('planner')} className={`flex flex-col items-center justify-center w-full ${activeScreen === 'planner' ? 'text-purple-500' : 'text-slate-300'}`}>
            <Calendar size={22} />
            <span className="text-[8px] font-bold uppercase mt-1">Agenda</span>
          </button>
          <button onClick={() => setActiveScreen('history')} className={`flex flex-col items-center justify-center w-full ${activeScreen === 'history' ? 'text-blue-500' : 'text-slate-300'}`}>
            <History size={22} />
            <span className="text-[8px] font-bold uppercase mt-1">Historial</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
