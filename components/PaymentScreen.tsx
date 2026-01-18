
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Heart, Save, Pencil, X } from 'lucide-react';
import { Payment, IconName } from '../types.ts';
import { ICON_MAP } from '../constants.tsx';
import { IconPicker } from './IconPicker.tsx';
import { audioService } from '../services/audio.ts';

interface PaymentScreenProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  onDelete: (id: string) => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ payments, setPayments, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [description, setDescription] = useState(() => localStorage.getItem('draft_pay_desc') || '');
  const [amount, setAmount] = useState(() => localStorage.getItem('draft_pay_amount') || '');
  const [date, setDate] = useState(() => localStorage.getItem('draft_pay_date') || '');
  const [icon, setIcon] = useState<IconName>(() => (localStorage.getItem('draft_pay_icon') as IconName) || 'Bill');

  useEffect(() => {
    if (!editingId) {
      localStorage.setItem('draft_pay_desc', description);
      localStorage.setItem('draft_pay_amount', amount);
      localStorage.setItem('draft_pay_date', date);
      localStorage.setItem('draft_pay_icon', icon);
    }
    
    if (description || amount || date) {
      setIsSaving(true);
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [description, amount, date, icon, editingId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    if (editingId) {
      setPayments(prev => prev.map(p => p.id === editingId ? {
        ...p,
        description,
        amount: parseFloat(amount),
        dueDate: date,
        icon
      } : p));
      setEditingId(null);
    } else {
      const newPayment: Payment = {
        id: crypto.randomUUID(),
        description,
        amount: parseFloat(amount),
        dueDate: date,
        paid: false,
        icon
      };
      setPayments(prev => [...prev, newPayment]);
    }

    resetForm();
    setIsAdding(false);
    audioService.playSuccess();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate('');
    setIcon('Bill');
    setEditingId(null);
    localStorage.removeItem('draft_pay_desc');
    localStorage.removeItem('draft_pay_amount');
    localStorage.removeItem('draft_pay_date');
    localStorage.removeItem('draft_pay_icon');
  };

  const handleEdit = (p: Payment) => {
    setDescription(p.description);
    setAmount(p.amount.toString());
    setDate(p.dueDate);
    setIcon(p.icon);
    setEditingId(p.id);
    setIsAdding(true);
    audioService.playTick();
  };

  const togglePaid = (id: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === id) {
        if (!p.paid) audioService.playSuccess();
        else audioService.playTick();
        return { ...p, paid: !p.paid };
      }
      return p;
    }));
  };

  const sortedPayments = useMemo(() => {
    return [...payments].filter(p => !p.paid).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [payments]);

  const getStatusColor = (payment: Payment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(payment.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-500 bg-red-50 border-red-200';
    if (diffDays <= 3) return 'text-pink-600 bg-pink-50 border-pink-200';
    return 'text-slate-500 bg-white border-slate-100';
  };

  return (
    <div className="flex flex-col h-full bg-rose-50/20">
      <div className="p-6 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-rose-800 tracking-tight">Mis Pagos</h1>
          {isSaving && (
            <span className="text-[10px] text-rose-400 font-bold uppercase mt-1 animate-pulse flex items-center">
              <Save size={10} className="mr-1" /> {editingId ? 'Editando...' : 'Guardando...'}
            </span>
          )}
        </div>
        <button 
          onClick={() => {
            if (isAdding) resetForm();
            setIsAdding(!isAdding);
          }}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 bg-gradient-to-br from-rose-300 to-rose-500 text-white shadow-rose-200`}
        >
          {isAdding ? <X size={28} /> : <Plus size={28} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {isAdding && (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl shadow-xl border border-rose-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-rose-800 uppercase tracking-widest">
                {editingId ? 'Editar Pago' : 'Nuevo Pago'}
              </h2>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-rose-400 uppercase tracking-widest ml-1">Concepto</label>
              <input 
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full p-4 bg-rose-50/30 border border-rose-200 rounded-2xl focus:ring-2 focus:ring-rose-300 outline-none text-slate-700 placeholder-rose-200"
                placeholder="Ej. Alquiler..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-400 uppercase tracking-widest ml-1">Monto</label>
                <input 
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full p-4 bg-rose-50/30 border border-rose-200 rounded-2xl focus:ring-2 focus:ring-rose-300 outline-none text-slate-700"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-400 uppercase tracking-widest ml-1">Fecha</label>
                <input 
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full p-4 bg-rose-50/30 border border-rose-200 rounded-2xl focus:ring-2 focus:ring-rose-300 outline-none text-slate-700"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-rose-400 uppercase tracking-widest ml-1">Icono</label>
              <IconPicker selected={icon} onSelect={setIcon} />
            </div>
            <button type="submit" className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform">
              {editingId ? 'Actualizar Pago' : 'Guardar Pago'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-rose-50/30 text-rose-400 text-[9px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-2 py-4 text-left w-[35%]">Concepto</th>
                <th className="px-2 py-4 text-center w-[25%]">Monto</th>
                <th className="px-2 py-4 text-center w-[18%]">Vence</th>
                <th className="px-2 py-4 text-right w-[22%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {sortedPayments.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={4} className="px-5 py-24 text-center text-rose-300 italic text-sm">
                    No tienes pagos pendientes.
                  </td>
                </tr>
              )}
              {sortedPayments.map((p) => {
                const Icon = ICON_MAP[p.icon] || ICON_MAP.Other;
                const statusStyles = getStatusColor(p);
                return (
                  <tr key={p.id} className="transition-all active:bg-rose-50/40">
                    <td className="px-2 py-5 overflow-hidden">
                      <div className="flex items-center space-x-1.5">
                        <div className={`p-1.5 rounded-lg border flex-shrink-0 ${statusStyles.split(' ')[2]} ${statusStyles.split(' ')[0]}`}>
                          <Icon size={14} />
                        </div>
                        <span className="font-bold text-[11px] text-slate-700 truncate">
                          {p.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-5 text-center font-extrabold text-[11px] text-slate-800 tabular-nums">
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-1 py-5 text-center">
                       <span className={`text-[8px] px-1 py-0.5 rounded-md border font-bold tracking-tighter block truncate ${statusStyles}`}>
                         {p.dueDate.slice(5)}
                       </span>
                    </td>
                    <td className="px-2 py-5">
                      <div className="flex items-center space-x-0.5 justify-end">
                        <button onClick={() => togglePaid(p.id)} className="p-1 transition-all active:scale-125 text-rose-400 hover:text-rose-600">
                          <Heart size={18} />
                        </button>
                        <button onClick={() => handleEdit(p)} className="p-1 text-slate-400 hover:text-rose-600">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => onDelete(p.id)} className="p-1 text-slate-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
