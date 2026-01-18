
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Heart, Circle, Save } from 'lucide-react';
import { Payment, IconName } from '../types';
import { ICON_MAP } from '../constants';
import { IconPicker } from './IconPicker';
import { audioService } from '../services/audio';

interface PaymentScreenProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ payments, setPayments }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [description, setDescription] = useState(() => localStorage.getItem('draft_pay_desc') || '');
  const [amount, setAmount] = useState(() => localStorage.getItem('draft_pay_amount') || '');
  const [date, setDate] = useState(() => localStorage.getItem('draft_pay_date') || '');
  const [icon, setIcon] = useState<IconName>(() => (localStorage.getItem('draft_pay_icon') as IconName) || 'Bill');

  useEffect(() => {
    localStorage.setItem('draft_pay_desc', description);
    localStorage.setItem('draft_pay_amount', amount);
    localStorage.setItem('draft_pay_date', date);
    localStorage.setItem('draft_pay_icon', icon);
    
    if (description || amount || date) {
      setIsSaving(true);
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [description, amount, date, icon]);

  const addPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      dueDate: date,
      paid: false,
      icon
    };

    setPayments(prev => [...prev, newPayment]);
    setDescription('');
    setAmount('');
    setDate('');
    setIcon('Bill');
    setIsAdding(false);
    
    localStorage.removeItem('draft_pay_desc');
    localStorage.removeItem('draft_pay_amount');
    localStorage.removeItem('draft_pay_date');
    localStorage.removeItem('draft_pay_icon');
    
    audioService.playSuccess();
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
    return 'text-slate-500 bg-white border-slate-100';
  };

  return (
    <div className="flex flex-col h-full bg-rose-50">
      <div className="p-6 flex justify-between items-center bg-white border-b border-rose-100">
        <div>
          <h1 className="text-2xl font-bold text-rose-800">Pagos</h1>
          <div className="flex items-center space-x-1 h-4">
            {isSaving && (
              <span className="text-[10px] text-rose-400 font-bold uppercase flex items-center animate-pulse">
                <Save size={10} className="mr-1" /> Guardando...
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`p-2 rounded-full shadow-lg transition-all active:scale-95 ${
            isAdding ? 'bg-rose-100 text-rose-500' : 'bg-rose-500 text-white shadow-rose-200'
          }`}
        >
          <Plus size={24} className={`transition-transform duration-300 ${isAdding ? 'rotate-45' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {isAdding && (
          <form onSubmit={addPayment} className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-rose-300 uppercase tracking-wider ml-1">Concepto</label>
              <input 
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full p-3 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-300 outline-none text-slate-700"
                placeholder="Ej. Alquiler, Regalo..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-300 uppercase tracking-wider ml-1">Monto</label>
                <input 
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full p-3 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-300 outline-none text-slate-700"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-300 uppercase tracking-wider ml-1">Vencimiento</label>
                <input 
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full p-3 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-300 outline-none text-slate-700"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-rose-300 uppercase tracking-wider ml-1">Icono</label>
              <IconPicker selected={icon} onSelect={setIcon} />
            </div>
            <button type="submit" className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-rose-100 active:opacity-90 active:scale-[0.98] transition-all">
              Guardar Pago
            </button>
          </form>
        )}

        <div className="overflow-hidden bg-white rounded-2xl border border-rose-100 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-rose-50/50 text-rose-300 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center">Vence</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {sortedPayments.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-rose-200 italic text-sm">
                    No hay registros aún...
                  </td>
                </tr>
              )}
              {sortedPayments.map((p) => {
                const Icon = ICON_MAP[p.icon];
                const statusStyles = getStatusColor(p);
                return (
                  <tr key={p.id} className={`group transition-all ${p.paid ? 'bg-rose-50/30' : 'hover:bg-rose-50/20'}`}>
                    <td className="px-4 py-5">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl border ${statusStyles.split(' ')[2]} ${statusStyles.split(' ')[0]}`}>
                          <Icon size={18} />
                        </div>
                        <span className={`font-semibold text-sm ${p.paid ? 'line-through text-rose-200' : 'text-slate-700'}`}>
                          {p.description}
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-5 text-right font-bold text-sm ${p.paid ? 'text-rose-200' : 'text-slate-800'}`}>
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-5 text-center">
                       <span className={`text-[9px] px-2 py-1 rounded-full border font-bold uppercase tracking-tighter ${statusStyles}`}>
                         {p.dueDate}
                       </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => togglePaid(p.id)} className="transition-all active:scale-125">
                          {p.paid ? <Heart className="text-rose-500 fill-rose-500" size={24} /> : <Heart className="text-rose-100" size={24} />}
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
