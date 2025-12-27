
import React, { useState } from 'react';
import { Search, Download, Cloud, CheckCircle2, Clock, MapPin, User, FileSpreadsheet, Loader2, AlertCircle, Trash2, CheckSquare, Square } from 'lucide-react';
import { InventoryRecord } from '../types';
import * as XLSX from 'xlsx';

interface RegistryListProps {
  records: InventoryRecord[];
  onDeleteRecords: (ids: string[]) => void;
}

export const RegistryList: React.FC<RegistryListProps> = ({ records, onDeleteRecords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState<'local' | 'drive' | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string) => {
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

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить ${selectedIds.size} выбранных записей? Это действие необратимо.`)) {
      onDeleteRecords(Array.from(selectedIds));
      setSelectedIds(new Set());
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
      
      const wscols = [
        {wch: 5}, {wch: 20}, {wch: 30}, {wch: 10}, {wch: 10}, 
        {wch: 20}, {wch: 15}, {wch: 20}, {wch: 25}, {wch: 12}, 
        {wch: 20}, {wch: 15}, {wch: 15}, {wch: 40}
      ];
      ws['!cols'] = wscols;

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
      await new Promise(resolve => setTimeout(resolve, 2500));
      const confirmMsg = "Функция экспорта в Drive требует настройки Google API Client ID. \n\nВ этой версии MVP сформирован файл и подготовлен к отправке. Выгрузить файл локально?";
      if (window.confirm(confirmMsg)) {
        handleLocalExport();
      }
    } catch (error) {
      alert("Ошибка синхронизации с Google Drive");
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
            placeholder="Поиск по названию, инв. номеру..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleLocalExport}
            disabled={exporting !== null || records.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            {exporting === 'local' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-indigo-600" />}
            XLSX
          </button>
          <button 
            onClick={handleDriveExport}
            disabled={exporting !== null || records.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-2xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50"
          >
            {exporting === 'drive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            Google Drive
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button className="whitespace-nowrap bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Все ({records.length})</button>
          <button className="whitespace-nowrap bg-white text-slate-500 border border-slate-200 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">Последние 24ч</button>
        </div>
        
        {filteredRecords.length > 0 && (
          <button 
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
            Выбрать все
          </button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-slate-600 ml-2">Выбрано: {selectedIds.size}</span>
          <button 
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all active:scale-95 border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Удалить выбранные
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileSpreadsheet className="text-slate-200 w-10 h-10" />
            </div>
            <h3 className="font-black text-slate-900 text-lg tracking-tighter">Реестр пуст</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-[200px] mx-auto leading-snug">Добавьте новые позиции или измените параметры поиска</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="relative group">
              <div 
                onClick={() => toggleSelect(record.id)}
                className={`bg-white p-4 rounded-3xl border transition-all flex gap-4 hover:border-indigo-300 shadow-sm cursor-pointer ${selectedIds.has(record.id) ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200'}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={record.photoUrl} className="w-24 h-24 rounded-2xl object-cover bg-slate-100 border border-slate-100 shadow-inner" />
                  <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${record.isSynced ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {record.isSynced ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Clock className="w-3.5 h-3.5 text-white" />}
                  </div>
                  {/* Selection Overlay Checkbox */}
                  <div className={`absolute top-1 left-1 w-6 h-6 rounded-lg flex items-center justify-center border border-white/50 backdrop-blur-sm transition-all ${selectedIds.has(record.id) ? 'bg-indigo-600' : 'bg-black/20'}`}>
                    {selectedIds.has(record.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest">{record.category}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${
                        record.status === 'Списание' ? 'text-red-600 border-red-100 bg-red-50' : 
                        record.status === 'Б/У' ? 'text-amber-600 border-amber-100 bg-amber-50' :
                        'text-green-600 border-green-100 bg-green-50'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{record.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: {record.inventoryNumber || 'НЕТ НОМЕРА'}</p>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      {record.roomNumber}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      {record.responsible.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {records.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 md:static md:mt-6 bg-indigo-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Всего в реестре</p>
              <p className="text-sm font-black">{records.length} позиций</p>
            </div>
          </div>
          <button 
             onClick={handleLocalExport}
             className="bg-white text-indigo-900 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-colors"
          >
            Экспорт {selectedIds.size > 0 ? `(${selectedIds.size})` : 'всех'}
          </button>
        </div>
      )}
    </div>
  );
};
