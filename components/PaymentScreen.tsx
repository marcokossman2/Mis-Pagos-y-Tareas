
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Heart, Save, Pencil, X } from 'lucide-react';
import { Payment, IconName } from '../types.ts';
import { ICON_MAP } from '../constants.tsx';
import { IconPicker } from './IconPicker.tsx';
import { audioService } from '../services/audio.ts';

interface PaymentScreenProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ payments, setPayments }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [description, setDescription] = useState(() => localStorage.getItem('draft_pay_desc') || '');
  const [amount, setAmount] = useState(() => localStorage.getItem('draft_pay_amount') || '');
  const [date, setDate] = useState(() => localStorage.getItem('draft_pay_date') || '');
  const [icon, setIcon] = useState<IconName>(() => (localStorage.getItem('draft_pay_icon') as IconName) || 'Bill');

  useEffect(() => {
    // Solo guardamos borradores si no estamos editando uno existente
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

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    audioService.playTick();
  };

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [payments]);

  const getStatusColor = (payment: Payment) => {
    if (payment.paid) return 'text-rose-500 bg-rose-50 border-rose-200';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(payment.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-500 bg-red-50 border-red-200';
    if (diffDays <= 3) return 'text-pink-500 bg-pink-50 border-pink-200';
    return 'text-slate-400 bg-white border-slate-100';
  };

  return (
    <div className="flex flex-col h-full bg-rose-50/20">
      <div className="p-8 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-rose-800 tracking-tight">Mis Pagos</h1>
          {isSaving && (
            <span className="text-[10px] text-rose-300 font-bold uppercase mt-1 animate-pulse flex items-center">
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

      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
        {isAdding && (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl shadow-xl border border-rose-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-rose-800 uppercase tracking-widest">
                {editingId ? 'Editar Pago' : 'Nuevo Pago'}
              </h2>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-rose-300 uppercase tracking-widest ml-1">Concepto</label>
              <input 
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full p-4 bg-rose-50/30 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-200 outline-none text-slate-700 placeholder-rose-200"
                placeholder="Ej. Alquiler..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-300 uppercase tracking-widest ml-1">Monto</label>
                <input 
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full p-4 bg-rose-50/30 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-200 outline-none text-slate-700"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-300 uppercase tracking-widest ml-1">Fecha</label>
                <input 
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full p-4 bg-rose-50/30 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-200 outline-none text-slate-700"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-rose-300 uppercase tracking-widest ml-1">Icono</label>
              <IconPicker selected={icon} onSelect={setIcon} />
            </div>
            <button type="submit" className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform">
              {editingId ? 'Actualizar Pago' : 'Guardar Pago'}
            </button>
          </form>
        )}

        <div className="overflow-hidden bg-white/60 rounded-3xl border border-rose-100 shadow-sm">
          <table className="w-full text-left">
            <thead className="text-rose-200 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4">Concepto</th>
                <th className="px-5 py-4 text-center">Monto</th>
                <th className="px-5 py-4 text-center">Vence</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {sortedPayments.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={4} className="px-5 py-24 text-center text-rose-200 italic text-sm">
                    No hay registros aún...
                  </td>
                </tr>
              )}
              {sortedPayments.map((p) => {
                const Icon = ICON_MAP[p.icon];
                const statusStyles = getStatusColor(p);
                return (
                  <tr key={p.id} className={`transition-all ${p.paid ? 'bg-rose-50/20' : 'hover:bg-rose-50/10'}`}>
                    <td className="px-5 py-5">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl border ${statusStyles.split(' ')[2]} ${statusStyles.split(' ')[0]}`}>
                          <Icon size={18} />
                        </div>
                        <span className={`font-semibold text-sm ${p.paid ? 'line-through text-rose-200' : 'text-slate-700'}`}>
                          {p.description}
                        </span>
                      </div>
                    </td>
                    <td className={`px-5 py-5 text-center font-bold text-sm ${p.paid ? 'text-rose-200' : 'text-slate-800'}`}>
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-5 text-center">
                       <span className={`text-[9px] px-2 py-1 rounded-full border font-bold uppercase tracking-tighter ${statusStyles}`}>
                         {p.dueDate}
                       </span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => togglePaid(p.id)} className="transition-all active:scale-125">
                          {p.paid ? <Heart className="text-rose-500 fill-rose-500" size={24} /> : <Heart className="text-rose-100" size={24} />}
                        </button>
                        <button onClick={() => handleEdit(p)} className="text-rose-100 hover:text-rose-400 transition-colors">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => deletePayment(p.id)} className="text-rose-100 hover:text-red-400 transition-colors">
                          <Trash2 size={18} />
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
