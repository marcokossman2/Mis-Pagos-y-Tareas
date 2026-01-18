
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Heart, Circle, Clock, Save } from 'lucide-react';
import { Task, DayOfWeek, DAYS, IconName } from '../types.ts';
import { ICON_MAP } from '../constants.tsx';
import { IconPicker } from './IconPicker.tsx';
import { audioService } from '../services/audio.ts';

interface PlannerScreenProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const PlannerScreen: React.FC<PlannerScreenProps> = ({ tasks, setTasks }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(() => localStorage.getItem('draft_task_name') || '');
  const [desc, setDesc] = useState(() => localStorage.getItem('draft_task_desc') || '');
  const [time, setTime] = useState(() => localStorage.getItem('draft_task_time') || '');
  const [day, setDay] = useState<DayOfWeek>(() => (localStorage.getItem('draft_task_day') as DayOfWeek) || 'Lunes');
  const [icon, setIcon] = useState<IconName>(() => (localStorage.getItem('draft_task_icon') as IconName) || 'Work');

  useEffect(() => {
    localStorage.setItem('draft_task_name', name);
    localStorage.setItem('draft_task_desc', desc);
    localStorage.setItem('draft_task_time', time);
    localStorage.setItem('draft_task_day', day);
    localStorage.setItem('draft_task_icon', icon);

    if (name || desc || time) {
      setIsSaving(true);
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [name, desc, time, day, icon]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !time) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      name,
      description: desc,
      time,
      day,
      done: false,
      icon
    };

    setTasks(prev => [...prev, newTask]);
    setName('');
    setDesc('');
    setTime('');
    setIcon('Work');
    setIsAdding(false);
    
    localStorage.removeItem('draft_task_name');
    localStorage.removeItem('draft_task_desc');
    localStorage.removeItem('draft_task_time');
    localStorage.removeItem('draft_task_day');
    localStorage.removeItem('draft_task_icon');
    
    audioService.playSuccess();
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
    <div className="flex flex-col h-full bg-rose-50/30">
      <div className="p-6 flex justify-between items-center bg-white border-b border-purple-100">
        <div>
          <h1 className="text-2xl font-bold text-purple-800">Semana</h1>
          <div className="flex items-center space-x-1 h-4">
            {isSaving && (
              <span className="text-[10px] text-purple-400 font-bold uppercase flex items-center animate-pulse">
                <Save size={10} className="mr-1" /> Guardado
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`p-2 rounded-full shadow-lg transition-all active:scale-95 ${
            isAdding ? 'bg-purple-50 text-purple-500' : 'bg-purple-500 text-white shadow-purple-100'
          }`}
        >
          <Plus size={24} className={`transition-transform duration-300 ${isAdding ? 'rotate-45' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {isAdding && (
          <form onSubmit={addTask} className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider ml-1">Tarea</label>
              <input 
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full p-3 bg-purple-50/30 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-slate-700"
                placeholder="¿Qué planes tienes?"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider ml-1">Detalles</label>
              <textarea 
                value={desc} onChange={e => setDesc(e.target.value)}
                className="w-full p-3 bg-purple-50/30 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none h-20 text-slate-700"
                placeholder="Añade una notita..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider ml-1">Hora</label>
                <input 
                  type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full p-3 bg-purple-50/30 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider ml-1">Día</label>
                <select 
                  value={day} onChange={e => setDay(e.target.value as DayOfWeek)}
                  className="w-full p-3 bg-purple-50/30 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-slate-700"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
             <div className="space-y-1">
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider ml-1">Icono</label>
              <IconPicker selected={icon} onSelect={setIcon} />
            </div>
            <button type="submit" className="w-full bg-purple-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-50 active:opacity-90 active:scale-[0.98] transition-all">
              Añadir a la Agenda
            </button>
          </form>
        )}

        {DAYS.map(d => (
          <div key={d} className="space-y-3">
            <h2 className="text-[10px] font-bold text-purple-300 uppercase tracking-widest px-1">{d}</h2>
            <div className="space-y-2">
              {groupedTasks[d].length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/40 border border-dashed border-purple-100 text-center text-purple-200 text-xs italic">
                  Nada planeado
                </div>
              ) : (
                groupedTasks[d].map(t => {
                  const Icon = ICON_MAP[t.icon];
                  return (
                    <div 
                      key={t.id} 
                      className={`p-4 rounded-2xl border transition-all flex items-center space-x-4 bg-white ${
                        t.done 
                        ? 'border-purple-100 bg-purple-50/30' 
                        : 'border-purple-50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <button onClick={() => toggleTask(t.id)} className="transition-all active:scale-125">
                        {t.done ? (
                          <Heart size={26} className="text-purple-400 fill-purple-400" />
                        ) : (
                          <Heart size={26} className="text-purple-100" />
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
                        <div className="flex items-center space-x-1 mt-1 text-[9px] font-bold text-purple-300 uppercase">
                          <Clock size={10} />
                          <span>{t.time}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(t.id)} className="p-2 text-purple-100 hover:text-red-400 transition-colors">
                        <Trash2 size={18} />
                      </button>
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
