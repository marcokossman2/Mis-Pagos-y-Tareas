
import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Calendar } from 'lucide-react';
import { Payment, Task, DayOfWeek } from './types.ts';
import { PaymentScreen } from './components/PaymentScreen.tsx';
import { PlannerScreen } from './components/PlannerScreen.tsx';
import { audioService } from './services/audio.ts';

type Screen = 'payments' | 'planner';

const SPANISH_DAYS: Record<number, DayOfWeek> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
};

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

  // Para evitar duplicar notificaciones en el mismo minuto
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('lifeflow_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('lifeflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Solicitar permisos de notificación al inicio
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Lógica de recordatorios
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
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

        // Clave única para hoy y esta tarea
        const notificationKey = `${task.id}-${now.toDateString()}-${triggerTime}`;

        if (currentTimeInMinutes === triggerTime && !notifiedTasksRef.current.has(notificationKey)) {
          if (Notification.permission === "granted") {
            new Notification(`Recordatorio: ${task.name}`, {
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

      // Limpiar el set de tareas antiguas cada día (opcional, por memoria)
      if (notifiedTasksRef.current.size > 100) notifiedTasksRef.current.clear();
    };

    const interval = setInterval(checkReminders, 30000); // Revisar cada 30 segundos para mayor precisión
    return () => clearInterval(interval);
  }, [tasks]);

  const handleTabChange = (screen: Screen) => {
    setActiveScreen(screen);
    audioService.playTick();
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-rose-50 shadow-2xl overflow-hidden relative border-x border-rose-100">
      <main className="flex-1 overflow-hidden">
        {activeScreen === 'payments' ? (
          <PaymentScreen payments={payments} setPayments={setPayments} />
        ) : (
          <PlannerScreen tasks={tasks} setTasks={setTasks} />
        )}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-rose-100 pb-safe shadow-[0_-8px_30px_rgba(244,63,94,0.08)]">
        <div className="flex justify-around items-center h-20 px-8">
          <button 
            onClick={() => handleTabChange('payments')}
            className={`flex flex-col items-center justify-center w-full transition-all ${
              activeScreen === 'payments' ? 'text-rose-500' : 'text-blue-200'
            }`}
          >
            <div className={`p-1 transition-transform ${activeScreen === 'payments' ? 'scale-110' : ''}`}>
              <CreditCard size={28} strokeWidth={activeScreen === 'payments' ? 2.5 : 1.5} />
            </div>
            <span className={`text-[10px] font-extrabold uppercase mt-1 tracking-[0.2em] transition-opacity ${activeScreen === 'payments' ? 'opacity-100' : 'opacity-60'}`}>
              Pagos
            </span>
          </button>
          
          <button 
            onClick={() => handleTabChange('planner')}
            className={`flex flex-col items-center justify-center w-full transition-all ${
              activeScreen === 'planner' ? 'text-purple-500' : 'text-blue-200'
            }`}
          >
            <div className={`p-1 transition-transform ${activeScreen === 'planner' ? 'scale-110' : ''}`}>
              <Calendar size={28} strokeWidth={activeScreen === 'planner' ? 2.5 : 1.5} />
            </div>
            <span className={`text-[10px] font-extrabold uppercase mt-1 tracking-[0.2em] transition-opacity ${activeScreen === 'planner' ? 'opacity-100' : 'opacity-60'}`}>
              Semana
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;