
import React from 'react';
import { PieChart, TrendingUp, Package, AlertTriangle, CheckSquare, ClipboardCheck } from 'lucide-react';
import { InventoryRecord, ItemStatus } from '../types';

interface StatisticsViewProps {
  records: InventoryRecord[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ records }) => {
  const totalItems = records.reduce((acc, r) => acc + r.quantity, 0);
  const statusCounts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const writeOffCount = statusCounts[ItemStatus.WRITE_OFF] || 0;
  const repairCount = statusCounts[ItemStatus.REPAIR_NEEDED] || 0;
  const excellentCount = statusCounts[ItemStatus.EXCELLENT] || 0;

  const cards = [
    { title: 'Всего предметов', value: totalItems, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Отличное сост.', value: excellentCount, icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Нужен ремонт', value: repairCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Списание', value: writeOffCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`${card.bg} ${card.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Chart Simulation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold">Распределение по статусу</h3>
          </div>
          <TrendingUp className="w-4 h-4 text-slate-300" />
        </div>

        <div className="space-y-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            // Fix: Explicitly cast count to number to resolve the arithmetic operation type error
            const percentage = Math.round(((count as number) / records.length) * 100) || 0;
            return (
              <div key={status} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                  <span className="text-slate-600">{status}</span>
                  <span className="text-slate-900">{percentage}% ({count})</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      status === ItemStatus.WRITE_OFF ? 'bg-red-500' :
                      status === ItemStatus.REPAIR_NEEDED ? 'bg-amber-500' :
                      status === ItemStatus.USED ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {records.length === 0 && <p className="text-center text-slate-400 py-4 italic text-sm">Данных для анализа пока нет</p>}
        </div>
      </div>

      {/* Room Utilization Log Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold mb-4 flex items-center gap-2">
           <CheckSquare className="w-5 h-5 text-indigo-600" />
           Активность по кабинетам
        </h3>
        <div className="divide-y divide-slate-100">
           {Array.from(new Set(records.map(r => r.roomNumber))).slice(0, 5).map((room, i) => {
              const count = records.filter(r => r.roomNumber === room).length;
              return (
                <div key={i} className="py-3 flex justify-between items-center text-sm">
                  <span className="text-slate-700 font-medium">Кабинет №{room}</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full font-bold text-xs">{count} ед.</span>
                </div>
              )
           })}
           {records.length === 0 && <p className="text-center text-slate-400 py-2 text-xs">Добавьте записи для отображения активности</p>}
        </div>
      </div>
    </div>
  );
};
