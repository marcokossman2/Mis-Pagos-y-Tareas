
export type IconName = 
  | 'Bill' | 'Shopping' | 'Work' | 'Home' | 'Health' | 'Gym' | 'Study' | 'Social' | 'Other'
  | 'Food' | 'Transport' | 'Gift' | 'Stream' | 'Travel' | 'Pet' | 'Tech' | 'Utility' | 'Beauty' | 'Coffee';

export interface Payment {
  id: string;
  description: string;
  amount: number;
  dueDate: string; // ISO string YYYY-MM-DD
  paid: boolean;
  icon: IconName;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  time: string; // HH:mm
  day: string; // Lunes, Martes, etc.
  done: boolean;
  icon: IconName;
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
