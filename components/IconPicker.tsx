
import React from 'react';
import { ICONS } from '../constants.tsx';
import { IconName } from '../types.ts';

interface IconPickerProps {
  selected: IconName;
  onSelect: (name: IconName) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-rose-50/50 rounded-xl border border-rose-100">
      {ICONS.map(({ name, icon: IconComponent }) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelect(name)}
          className={`p-2 rounded-lg transition-all ${
            selected === name 
              ? 'bg-rose-500 text-white scale-110 shadow-md shadow-rose-100' 
              : 'bg-white text-rose-200 hover:text-rose-400 border border-rose-50'
          }`}
        >
          <IconComponent size={20} />
        </button>
      ))}
    </div>
  );
};
