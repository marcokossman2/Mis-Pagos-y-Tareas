
import React, { useState, useMemo } from 'react';
import { RotateCcw, Trash2, Heart, CheckCircle2 } from 'lucide-react';
import { Payment } from '../types.ts';
import { ICON_MAP } from '../constants.tsx';
import { audioService } from '../services/audio.ts';

interface HistoryScreenProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  deletedPayments: Payment[];
  setDeletedPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ 
  payments, 
  setPayments, 
  deletedPayments, 
  setDeletedPayments 
}) => {
  const [tab, setTab] = useState<'paid' | 'deleted'>('paid');

  const paidPayments = useMemo(() => {
    return payments.filter(p => p.paid).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [payments]);

  const restoreDeleted = (payment: Payment) => {
    setDeletedPayments(prev => prev.filter(p => p.id !== payment.id));
    setPayments(prev => [...prev, payment]);
    audioService.playSuccess();
  };

  const permanentDelete = (id: string) => {
    setDeletedPayments(prev => prev.filter(p => p.id !== id));
    audioService.playTick();
  };

  const unpay = (id: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, paid: false } : p));
    audioService.playTick();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <div className="p-8 pb-4 bg-white/50 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-6">Historial</h1>
        
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setTab('paid')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              tab === 'paid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
            }`}
          >
            Completados
          </button>
          <button 
            onClick={() => setTab('deleted')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              tab === 'deleted' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'
            }`}
          >
            Eliminados
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
        {tab === 'paid' ? (
          <div className="space-y-4">
            {paidPayments.length === 0 ? (
              <div className="py-20 text-center text-slate-300 italic text-sm">
                No hay pagos completados aún.
              </div>
            ) : (
              paidPayments.map(p => {
                const Icon = ICON_MAP[p.icon] || ICON_MAP.Other;
                return (
                  <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-700 text-sm">{p.description}</h3>
                      <p className="text-xs text-slate-400 font-medium">${p.amount.toLocaleString()} • {p.dueDate}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => unpay(p.id)}
                        className="p-2 text-slate-200 hover:text-blue-400 transition-colors"
                        title="Marcar como no pagado"
                      >
                        <RotateCcw size={20} />
                      </button>
                      <div className="p-2 text-green-400">
                        <CheckCircle2 size={20} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {deletedPayments.length === 0 ? (
              <div className="py-20 text-center text-slate-300 italic text-sm">
                Papelera vacía.
              </div>
            ) : (
              deletedPayments.map(p => {
                const Icon = ICON_MAP[p.icon] || ICON_MAP.Other;
                return (
                  <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4 opacity-75">
                    <div className="p-3 bg-rose-50 text-rose-400 rounded-2xl">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-500 text-sm line-through">{p.description}</h3>
                      <p className="text-xs text-slate-400 font-medium">${p.amount.toLocaleString()} • {p.dueDate}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => restoreDeleted(p)}
                        className="p-2 text-slate-300 hover:text-green-500 transition-colors"
                        title="Restaurar"
                      >
                        <RotateCcw size={20} />
                      </button>
                      <button 
                        onClick={() => permanentDelete(p.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {deletedPayments.length > 0 && (
              <button 
                onClick={() => {
                  if (confirm('¿Vaciar papelera?')) {
                    setDeletedPayments([]);
                    audioService.playTick();
                  }
                }}
                className="w-full py-4 text-xs font-bold text-rose-400 uppercase tracking-widest border border-dashed border-rose-100 rounded-3xl hover:bg-rose-50 transition-colors"
              >
                Vaciar Papelera
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
