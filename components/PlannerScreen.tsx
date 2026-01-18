
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Heart, Clock, Save, Bell, Pencil, X } from 'lucide-react';
import { Task, DayOfWeek, DAYS, IconName } from '../types.ts';
import { ICON_MAP } from '../constants.tsx';
import { IconPicker } from './IconPicker.tsx';
import { audioService } from '../services/audio.ts';

interface PlannerScreenProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const REMINDER_OPTIONS = [
  { label: 'Sin recordatorio', value: 0 },
  { label: 'Al momento', value: 1 },
  { label: '5 min antes', value: 5 },
  { label: '15 min antes', value: 15 },
  { label: '30 min antes', value: 30 },
  { label: '1 hora antes', value: 60 },
];

export const PlannerScreen: React.FC<PlannerScreenProps> = ({ tasks, setTasks }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(() => localStorage.getItem('draft_task_name') || '');
  const [desc, setDesc] = useState(() => localStorage.getItem('draft_task_desc') || '');
  const [time, setTime] = useState(() => localStorage.getItem('draft_task_time') || '');
  const [day, setDay] = useState<DayOfWeek>(() => (localStorage.getItem('draft_task_day') as DayOfWeek) || 'Lunes');
  const [icon, setIcon] = useState<IconName>(() => (localStorage.getItem('draft_task_icon') as IconName) || 'Work');
  const [reminder, setReminder] = useState<number>(0);

  useEffect(() => {
    if (!editingId) {
      localStorage.setItem('draft_task_name', name);
      localStorage.setItem('draft_task_desc', desc);
      localStorage.setItem('draft_task_time', time);
      localStorage.setItem('draft_task_day', day);
      localStorage.setItem('draft_task_icon', icon);
    }

    if (name || desc || time) {
      setIsSaving(true);
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [name, desc, time, day, icon, editingId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !time) return;

    if (editingId) {
      // Corrected 'p' to 't' to match the map callback parameter
      setTasks(prev => prev.map(t => t.id === editingId ? {
        ...t,
        name,
        description: desc,
        time,
        day,
        icon,
        reminderMinutes: reminder > 0 ? reminder : undefined
      } : t));
      setEditingId(null);
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        name,
        description: desc,
        time,
        day,
        done: false,
        icon,
        reminderMinutes: reminder > 0 ? reminder : undefined
      };
      setTasks(prev => [...prev, newTask]);
    }

    resetForm();
    setIsAdding(false);
    audioService.playSuccess();

    if (reminder > 0 && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  const resetForm = () => {
    setName('');
    setDesc('');
    setTime('');
    setIcon('Work');
    setReminder(0);
    setEditingId(null);
    localStorage.removeItem('draft_task_name');
    localStorage.removeItem('draft_task_desc');
    localStorage.removeItem('draft_task_time');
    localStorage.removeItem('draft_task_day');
    localStorage.removeItem('draft_task_icon');
  };

  const handleEdit = (t: Task) => {
    setName(t.name);
    setDesc(t.description);
    setTime(t.time);
    setDay(t.day as DayOfWeek);
    setIcon(t.icon);
    setReminder(t.reminderMinutes || 0);
    setEditingId(t.id);
    setIsAdding(true);
    audioService.playTick();
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (!t.done) audioService.playSuccess();
        else audioService.playTick();
        return { ...t, done: !t.done };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    audioService.playTick();
  };

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    DAYS.forEach(d => groups[d] = []);
    tasks.forEach(t => {
      if (groups[t.day]) groups[t.day].push(t);
    });
    Object.keys(groups).forEach(d => {
      groups[d].sort((a, b) => a.time.localeCompare(b.time));
    });
    return groups;
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-rose-50/20">
      <div className="p-8 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-indigo-800 tracking-tight">Mi Semana</h1>
          {isSaving && (
            <span className="text-[10px] text-purple-400 font-bold uppercase mt-1 animate-pulse flex items-center">
              <Save size={10} className="mr-1" /> {editingId ? 'Editando...' : 'Guardando...'}
            </span>
          )}
        </div>
        <button 
          onClick={() => {
            if (isAdding) resetForm();
            setIsAdding(!isAdding);
          }}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 bg-gradient-to-br from-purple-300 to-purple-500 text-white shadow-purple-200`}
        >
          {isAdding ? <X size={28} /> : <Plus size={28} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {isAdding && (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl shadow-xl border border-purple-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-sm font-bold text-purple-800 uppercase tracking-widest px-1">
              {editingId ? 'Editar Tarea' : 'Nueva Tarea'}
            </h2>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest ml-1">Tarea</label>
              <input 
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full p-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-200 outline-none text-slate-700"
                placeholder="¿Qué planes tienes?"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest ml-1">Detalles</label>
              <textarea 
                value={desc} onChange={e => setDesc(e.target.value)}
                className="w-full p-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-200 outline-none h-20 text-slate-700"
                placeholder="Añade una notita..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest ml-1">Hora</label>
                <input 
                  type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full p-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest ml-1">Día</label>
                <select 
                  value={day} onChange={e => setDay(e.target.value as DayOfWeek)}
                  className="w-full p-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-200 outline-none text-slate-700"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest ml-1 flex items-center">
                <Bell size={12} className="mr-1" /> Recordatorio
              </label>
              <select 
                value={reminder} onChange={e => setReminder(parseInt(e.target.value))}
                className="w-full p-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-200 outline-none text-slate-700"
              >
                {REMINDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
             <div className="space-y-1">
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest ml-1">Icono</label>
              <IconPicker selected={icon} onSelect={setIcon} />
            </div>
            <button type="submit" className="w-full bg-purple-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-200 active:scale-95 transition-transform">
              {editingId ? 'Actualizar Agenda' : 'Añadir a la Agenda'}
            </button>
          </form>
        )}

        {DAYS.map(d => (
          <div key={d} className="space-y-3">
            <h2 className="text-[10px] font-bold text-purple-300 uppercase tracking-widest px-1">{d}</h2>
            <div className="space-y-3">
              {groupedTasks[d].length === 0 ? (
                <div className="p-5 rounded-3xl bg-white/40 border border-dashed border-purple-100 text-center text-purple-200 text-sm italic">
                  Nada planeado
                </div>
              ) : (
                groupedTasks[d].map(t => {
                  const Icon = ICON_MAP[t.icon];
                  return (
                    <div 
                      key={t.id} 
                      className={`p-5 rounded-3xl border transition-all flex items-center space-x-4 bg-white/70 ${
                        t.done 
                        ? 'border-purple-100 bg-purple-50/20' 
                        : 'border-purple-50 shadow-sm'
                      }`}
                    >
                      <button onClick={() => toggleTask(t.id)} className="transition-all active:scale-125">
                        {t.done ? (
                          <Heart size={28} className="text-purple-400 fill-purple-400" />
                        ) : (
                          <Heart size={28} className="text-purple-100" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Icon size={14} className={t.done ? 'text-purple-200' : 'text-purple-400'} />
                          <h3 className={`font-semibold truncate text-sm ${t.done ? 'line-through text-purple-200' : 'text-slate-800'}`}>
                            {t.name}
                          </h3>
                        </div>
                        {t.description && (
                          <p className={`text-xs truncate ${t.done ? 'text-purple-100' : 'text-slate-400'}`}>
                            {t.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 mt-1 text-[9px] font-bold text-purple-300 uppercase">
                          <div className="flex items-center space-x-1">
                            <Clock size={10} />
                            <span>{t.time}</span>
                          </div>
                          {t.reminderMinutes && !t.done && (
                            <div className="flex items-center space-x-1 text-rose-400">
                              <Bell size={10} />
                              <span>-{t.reminderMinutes}m</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <button onClick={() => handleEdit(t)} className="p-2 text-purple-100 hover:text-purple-400 transition-colors">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => deleteTask(t.id)} className="p-2 text-purple-100 hover:text-red-400 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
