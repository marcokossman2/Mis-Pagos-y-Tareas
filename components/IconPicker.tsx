
import React, { useState } from 'react';
import { ICONS, ALL_ICONS_LIST } from '../constants.tsx';
import { IconName } from '../types.ts';
import { MoreHorizontal, X } from 'lucide-react';

interface IconPickerProps {
  selected: IconName;
  onSelect: (name: IconName) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selected, onSelect }) => {
  const [showFullList, setShowFullList] = useState(false);

  // Mostramos solo los primeros 11 iconos + el botón de "más" en la vista previa
  const previewIcons = ICONS.slice(0, 11);

  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-2 p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
        {previewIcons.map(({ name, icon: IconComponent }) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name as IconName)}
            className={`p-2 rounded-xl transition-all flex items-center justify-center ${
              selected === name 
                ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-200' 
                : 'bg-white text-rose-200 hover:text-rose-400 border border-rose-50'
            }`}
          >
            <IconComponent size={20} />
          </button>
        ))}
        
        {/* Botón de tres puntos para abrir el desplegable completo */}
        <button
          type="button"
          onClick={() => setShowFullList(true)}
          className="p-2 rounded-xl bg-white text-rose-200 hover:text-rose-400 border border-rose-50 flex items-center justify-center transition-all active:scale-90"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Modal / Desplegable completo */}
      {showFullList && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-rose-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-rose-800">Seleccionar Icono</h3>
              <button 
                onClick={() => setShowFullList(false)}
                className="p-2 rounded-full bg-rose-50 text-rose-400 hover:bg-rose-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
              {ALL_ICONS_LIST.map(({ name, icon: IconComponent }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onSelect(name as IconName);
                    setShowFullList(false);
                  }}
                  className={`p-3 rounded-2xl transition-all flex items-center justify-center ${
                    selected === name 
                      ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-200' 
                      : 'bg-rose-50/50 text-rose-300 hover:text-rose-500 border border-transparent'
                  }`}
                >
                  <IconComponent size={24} />
                </button>
              ))}
            </div>
            
            <div className="p-4 bg-rose-50/30">
              <button 
                onClick={() => setShowFullList(false)}
                className="w-full py-3 bg-white border border-rose-100 text-rose-400 font-bold rounded-2xl shadow-sm active:scale-95 transition-transform"
              >
                Cerrar
              </button>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setShowFullList(false)} />
        </div>
      )}
    </div>
  );
};
