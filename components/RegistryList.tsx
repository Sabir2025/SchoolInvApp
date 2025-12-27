
import React, { useState } from 'react';
import { Search, Download, Cloud, CheckCircle2, Clock, MapPin, User, FileSpreadsheet, Loader2, Trash2, CheckSquare, Square } from 'lucide-react';
import { InventoryRecord } from '../types';
import * as XLSX from 'xlsx';

interface RegistryListProps {
  records: InventoryRecord[];
  onDeleteRecords: (ids: string[]) => void;
}

export const RegistryList: React.FC<RegistryListProps> = ({ records, onDeleteRecords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState<'local' | 'drive' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const idsArray = Array.from(selectedIds);
    if (idsArray.length === 0) return;
    
    if (window.confirm(`ВНИМАНИЕ: Вы удаляете ${idsArray.length} записей из системы навсегда. Подтверждаете удаление?`)) {
      setDeleting(true);
      try {
        // Симуляция задержки для UI-фидбека
        await new Promise(resolve => setTimeout(resolve, 800));
        onDeleteRecords(idsArray);
        setSelectedIds(new Set());
        console.log(`[UI] Successfully triggered deletion for ${idsArray.length} items.`);
      } finally {
        setDeleting(false);
      }
    }
  };

  const prepareExportData = () => {
    const dataToExport = selectedIds.size > 0 
      ? records.filter(r => selectedIds.has(r.id))
      : filteredRecords;

    return dataToExport.map((r, index) => ({
      '№': index + 1,
      'Категория': r.category,
      'Наименование': r.name,
      'Количество': r.quantity,
      'Единица измерения': r.unit,
      'Инвентарный номер': r.inventoryNumber,
      'Модель': r.model,
      'Серийный номер': r.serialNumber,
      'Ответственный': r.responsible,
      '№ кабинета': r.roomNumber,
      'Ссылка на фото': r.photoUrl.startsWith('data:') ? 'Локальное фото (Base64)' : r.photoUrl,
      'Состояние': r.status,
      'Дата инвентаризации': r.date,
      'Примечание': r.note
    }));
  };

  const handleLocalExport = () => {
    setExporting('local');
    try {
      const data = prepareExportData();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      XLSX.writeFile(wb, `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      alert("Ошибка при создании Excel файла");
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  };

  const handleDriveExport = async () => {
    setExporting('drive');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (window.confirm("Настройте Google API. Выгрузить локально?")) handleLocalExport();
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleLocalExport}
            disabled={exporting !== null || records.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-bold text-xs hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting === 'local' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-indigo-600" />}
            XLSX
          </button>
          <button 
            onClick={handleDriveExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-2xl font-bold text-xs shadow-md"
          >
            {exporting === 'drive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            Drive
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Всего: {records.length}</span>
        {filteredRecords.length > 0 && (
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-widest">
            {selectedIds.size === filteredRecords.length ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
            Выбрать все
          </button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-white p-3 rounded-2xl border border-red-100 shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 sticky top-20 z-50">
          <span className="text-xs font-black text-red-600 ml-2 uppercase tracking-tight">Выбрано: {selectedIds.size} поз.</span>
          <button 
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Удалить навсегда
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 text-lg">Реестр пуст</h3>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div 
              key={record.id} 
              onClick={() => toggleSelect(record.id)}
              className={`bg-white p-4 rounded-3xl border transition-all flex gap-4 hover:border-indigo-300 cursor-pointer relative ${selectedIds.has(record.id) ? 'border-indigo-500 bg-indigo-50/20 shadow-md' : 'border-slate-200'}`}
            >
              <div className="relative flex-shrink-0">
                <img src={record.photoUrl} className="w-24 h-24 rounded-2xl object-cover bg-slate-100 border border-slate-100 shadow-inner" />
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-lg flex items-center justify-center border border-white/50 backdrop-blur-sm ${selectedIds.has(record.id) ? 'bg-indigo-600' : 'bg-black/20'}`}>
                  {selectedIds.has(record.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 truncate">{record.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {record.inventoryNumber || 'БЕЗ НОМЕРА'}</p>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {record.roomNumber}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
const Download = ({className}: {className?: string}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
