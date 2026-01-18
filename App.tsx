
import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Calendar, History, Download, X } from 'lucide-react';
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
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('lifeflow_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Combined reminder logic for Tasks and Payments
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      // 1. CHECK TASKS
      const currentDayStr = SPANISH_DAYS[now.getDay()];
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentTimeInMinutes = currentH * 60 + currentM;

      tasks.forEach(task => {
        if (task.done || !task.reminderMinutes) return;
        if (task.day !== currentDayStr) return;

        const [taskH, taskM] = task.time.split(':').map(Number);
        const taskTimeInMinutes = taskH * 60 + taskM;
        const triggerTime = taskTimeInMinutes - task.reminderMinutes;
        const notificationKey = `task-${task.id}-${now.toDateString()}-${triggerTime}`;

        if (currentTimeInMinutes === triggerTime && !notifiedTasksRef.current.has(notificationKey)) {
          if (Notification.permission === "granted") {
            new Notification(`Agenda: ${task.name}`, {
              body: task.reminderMinutes === 1 
                ? `¡Es ahora! ${task.description || ''}`
                : `Inicia en ${task.reminderMinutes} minutos. ${task.description || ''}`,
              icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png'
            });
            audioService.playSuccess();
            notifiedTasksRef.current.add(notificationKey);
          }
        }
      });

      // 2. CHECK PAYMENTS (Due today or tomorrow)
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
              const title = isDueToday ? '¡Pago Vence HOY!' : 'Pago Vence Mañana';
              const body = `Recuerda pagar "${payment.description}" por $${payment.amount.toLocaleString()}.`;
              
              new Notification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png',
                tag: payment.id // Avoid duplicate notices for the same payment
              });
              audioService.playSuccess();
              notifiedPaymentsRef.current.add(notificationKey);
            }
          }
        }
      });

      // Cleanup old entries
      if (notifiedTasksRef.current.size > 100) notifiedTasksRef.current.clear();
      if (notifiedPaymentsRef.current.size > 100) notifiedPaymentsRef.current.clear();
    };

    // Run every 30 seconds for task precision, and it handles daily payment checks too
    const interval = setInterval(checkReminders, 30000);
    // Also run immediately on mount
    checkReminders();
    
    return () => clearInterval(interval);
  }, [tasks, payments]);

  const handleTabChange = (screen: AppScreen) => {
    setActiveScreen(screen);
    audioService.playTick();
  };

  const deletePayment = (id: string) => {
    const paymentToDelete = payments.find(p => p.id === id);
    if (paymentToDelete) {
      setDeletedPayments(prev => [paymentToDelete, ...prev]);
      setPayments(prev => prev.filter(p => p.id !== id));
      audioService.playTick();
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('lifeflow_install_dismissed', 'true');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-rose-50 shadow-2xl overflow-hidden relative border-x border-rose-100">
      
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white/80 backdrop-blur-md border border-rose-100 p-4 rounded-3xl shadow-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100">
                <Download size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Instalar LifeFlow</p>
                <p className="text-[10px] text-slate-500">Acceso rápido desde tu inicio</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleInstallClick}
                className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-transform"
              >
                Instalar
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

      <main className="flex-1 overflow-hidden">
        {activeScreen === 'payments' && (
          <PaymentScreen 
            payments={payments} 
            setPayments={setPayments} 
            onDelete={deletePayment}
          />
        )}
        {activeScreen === 'planner' && (
          <PlannerScreen tasks={tasks} setTasks={setTasks} />
        )}
        {activeScreen === 'history' && (
          <HistoryScreen 
            payments={payments} 
            setPayments={setPayments}
            deletedPayments={deletedPayments} 
            setDeletedPayments={setDeletedPayments}
          />
        )}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-rose-100 pb-safe shadow-[0_-8px_30px_rgba(244,63,94,0.08)] z-10">
        <div className="flex justify-around items-center h-20 px-4">
          <button 
            onClick={() => handleTabChange('payments')}
            className={`flex flex-col items-center justify-center w-full transition-all ${
              activeScreen === 'payments' ? 'text-rose-500' : 'text-slate-300'
            }`}
          >
            <div className={`p-1 transition-transform ${activeScreen === 'payments' ? 'scale-110' : ''}`}>
              <CreditCard size={24} strokeWidth={activeScreen === 'payments' ? 2.5 : 1.5} />
            </div>
            <span className={`text-[9px] font-extrabold uppercase mt-1 tracking-[0.1em] ${activeScreen === 'payments' ? 'opacity-100' : 'opacity-60'}`}>
              Pagos
            </span>
          </button>
          
          <button 
            onClick={() => handleTabChange('planner')}
            className={`flex flex-col items-center justify-center w-full transition-all ${
              activeScreen === 'planner' ? 'text-purple-500' : 'text-slate-300'
            }`}
          >
            <div className={`p-1 transition-transform ${activeScreen === 'planner' ? 'scale-110' : ''}`}>
              <Calendar size={24} strokeWidth={activeScreen === 'planner' ? 2.5 : 1.5} />
            </div>
            <span className={`text-[9px] font-extrabold uppercase mt-1 tracking-[0.1em] ${activeScreen === 'planner' ? 'opacity-100' : 'opacity-60'}`}>
              Semana
            </span>
          </button>

          <button 
            onClick={() => handleTabChange('history')}
            className={`flex flex-col items-center justify-center w-full transition-all ${
              activeScreen === 'history' ? 'text-blue-500' : 'text-slate-300'
            }`}
          >
            <div className={`p-1 transition-transform ${activeScreen === 'history' ? 'scale-110' : ''}`}>
              <History size={24} strokeWidth={activeScreen === 'history' ? 2.5 : 1.5} />
            </div>
            <span className={`text-[9px] font-extrabold uppercase mt-1 tracking-[0.1em] ${activeScreen === 'history' ? 'opacity-100' : 'opacity-60'}`}>
              Historial
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
