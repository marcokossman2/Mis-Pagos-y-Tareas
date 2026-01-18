
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

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('payments');
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('lifeflow_payments');
    return saved ? JSON.parse(saved) : [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('lifeflow_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedPayments, setDeletedPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('lifeflow_deleted_payments');
    return saved ? JSON.parse(saved) : [];
  });

  // PWA Install logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const notifiedPaymentsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('lifeflow_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('lifeflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('lifeflow_deleted_payments', JSON.stringify(deletedPayments));
  }, [deletedPayments]);

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Evento para Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('lifeflow_install_dismissed');
      if (!dismissed && !isStandalone) {
        setShowInstallBanner(true);
      }
    };

    // Para iOS, mostramos el banner manualmente si no es standalone
    if (isIosDevice && !isStandalone) {
      const dismissed = sessionStorage.getItem('lifeflow_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Recordatorios
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

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('lifeflow_install_dismissed', 'true');
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full max-w-md mx-auto bg-rose-50 shadow-2xl overflow-hidden relative border-x border-rose-100">
      
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="absolute top-[env(safe-area-inset-top,1rem)] left-4 right-4 z-[100] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white/95 backdrop-blur-xl border border-rose-100 p-4 rounded-[2rem] shadow-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100">
                {isIOS ? <Share size={20} /> : <Download size={20} />}
              </div>
              <div className="pr-2">
                <p className="text-sm font-bold text-slate-800">Instalar LifeFlow</p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {isIOS ? 'Añade a tu inicio para recibir alertas' : 'Acceso rápido y notificaciones'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={handleInstallClick}
                className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-transform whitespace-nowrap"
              >
                {isIOS ? '¿Cómo?' : 'Instalar'}
              </button>
              <button 
                onClick={dismissInstallBanner}
                className="p-2 text-slate-300 hover:text-slate-500"
              >
                <X size={18} />
              </button>
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

      <nav className="bg-white/95 backdrop-blur-lg border-t border-rose-100 pb-[env(safe-area-inset-bottom,1rem)] shadow-[0_-8px_30px_rgba(244,63,94,0.08)] z-10">
        <div className="flex justify-around items-center h-16 px-4">
          <button 
            onClick={() => { setActiveScreen('payments'); audioService.playTick(); }}
            className={`flex flex-col items-center justify-center w-full transition-all ${activeScreen === 'payments' ? 'text-rose-500' : 'text-slate-300'}`}
          >
            <CreditCard size={22} strokeWidth={activeScreen === 'payments' ? 2.5 : 1.5} />
            <span className="text-[8px] font-extrabold uppercase mt-1 tracking-tighter">Pagos</span>
          </button>
          
          <button 
            onClick={() => { setActiveScreen('planner'); audioService.playTick(); }}
            className={`flex flex-col items-center justify-center w-full transition-all ${activeScreen === 'planner' ? 'text-purple-500' : 'text-slate-300'}`}
          >
            <Calendar size={22} strokeWidth={activeScreen === 'planner' ? 2.5 : 1.5} />
            <span className="text-[8px] font-extrabold uppercase mt-1 tracking-tighter">Agenda</span>
          </button>

          <button 
            onClick={() => { setActiveScreen('history'); audioService.playTick(); }}
            className={`flex flex-col items-center justify-center w-full transition-all ${activeScreen === 'history' ? 'text-blue-500' : 'text-slate-300'}`}
          >
            <History size={22} strokeWidth={activeScreen === 'history' ? 2.5 : 1.5} />
            <span className="text-[8px] font-extrabold uppercase mt-1 tracking-tighter">Historial</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
