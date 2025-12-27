
import React from 'react';
import { User } from '../types';
import { Hand, ArrowRight, Package, ClipboardCheck, BarChart } from 'lucide-react';

interface WelcomeViewProps {
  user: User;
  onNavigate: (view: 'welcome' | 'profile' | 'stats' | 'registry' | 'add' | 'import') => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ user, onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 animate-bounce">
        <Hand className="w-10 h-10" />
      </div>
      
      <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
        Добро пожаловать, <br/>
        <span className="text-indigo-600">{user.fullName}</span>
      </h2>
      
      <p className="text-slate-500 mb-10 max-w-sm">
        Вы авторизованы как <span className="font-bold text-slate-700">{user.jobTitle}</span> в организации <span className="font-bold text-slate-700">{user.organization}</span>.
      </p>

      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        <button 
          onClick={() => onNavigate('add')}
          className="flex items-center justify-between bg-indigo-600 text-white p-5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] group"
        >
          <div className="flex items-center gap-4">
            <Package className="w-6 h-6" />
            <div className="text-left">
              <p className="leading-none mb-1">Начать инвентаризацию</p>
              <p className="text-[10px] opacity-70 font-medium">Создание новой записи имущества</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate('registry')}
            className="flex-1 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all active:scale-95 group"
          >
            <ClipboardCheck className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider group-hover:text-indigo-600 transition-colors">Реестр</span>
          </button>
          
          <button 
            onClick={() => onNavigate('stats')}
            className="flex-1 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all active:scale-95 group"
          >
            <BarChart className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider group-hover:text-indigo-600 transition-colors">Статистика</span>
          </button>
        </div>
      </div>
    </div>
  );
};
