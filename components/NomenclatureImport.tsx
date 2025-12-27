
import React, { useState } from 'react';
import { Upload, FileText, Database, Trash2, CheckCircle2, AlertCircle, XCircle, CheckSquare, Square } from 'lucide-react';
import { CatalogItem } from '../types';
import * as XLSX from 'xlsx';

interface NomenclatureImportProps {
  catalog: CatalogItem[];
  setCatalog: (catalog: CatalogItem[]) => void;
  onDeleteItems: (indices: number[]) => void;
}

export const NomenclatureImport: React.FC<NomenclatureImportProps> = ({ catalog, setCatalog, onDeleteItems }) => {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const [lastImportCount, setLastImportCount] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert("Пожалуйста, выберите файл формата .xlsx или .xls");
      return;
    }

    setProcessing(true);
    setErrorLog([]);
    setLastImportCount(null);
    
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("Не удалось прочитать данные файла");
        
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          throw new Error("Файл пуст или имеет неверную структуру");
        }

        const errors: string[] = [];
        const parsedCatalog: CatalogItem[] = [];

        jsonData.forEach((row, index) => {
          const rawCategory = row['category'] || row['Category'] || row['Категория'];
          const rawName = row['name'] || row['Name'] || row['Наименование'];

          const category = rawCategory ? String(rawCategory).trim() : null;
          const name = rawName ? String(rawName).trim() : null;

          if (!category || !name) {
            errors.push(`Строка ${index + 2}: Отсутствует обязательное поле (${!category ? 'category' : ''}${!category && !name ? ', ' : ''}${!name ? 'name' : ''}). Пропущено.`);
            return;
          }

          parsedCatalog.push({
            category: category,
            name: name
          });
        });

        if (parsedCatalog.length > 0) {
          // Merge with existing catalog instead of replacing it to support multiple "files" logic
          const newCatalog = [...catalog, ...parsedCatalog];
          setCatalog(newCatalog);
          setLastImportCount(parsedCatalog.length);
        }
        
        if (errors.length > 0) {
          setErrorLog(errors);
        }

      } catch (error) {
        console.error("Excel import error:", error);
        setErrorLog([`Критическая ошибка: ${error instanceof Error ? error.message : 'Неверный формат'}`]);
      } finally {
        setProcessing(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearCatalog = () => {
    if (window.confirm("Очистить весь справочник?")) {
      setCatalog([]);
      setLastImportCount(null);
      setErrorLog([]);
      setSelectedIndices(new Set());
    }
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === catalog.length && catalog.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(catalog.map((_, i) => i)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return;
    
    if (window.confirm(`Удалить выбранные элементы (${selectedIndices.size}) из справочника?`)) {
      onDeleteItems(Array.from(selectedIndices));
      setSelectedIndices(new Set());
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold">Строгий импорт номенклатуры</h2>
        </div>
        
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
          }`}
        >
          <Upload className={`w-12 h-12 mx-auto mb-3 transition-colors ${processing ? 'text-indigo-400 animate-bounce' : 'text-slate-300'}`} />
          <p className="text-slate-600 mb-4 font-medium text-sm">
            {processing ? 'Проверка структуры...' : 'Загрузите .xlsx (колонки: category, name)'}
          </p>
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden" 
            id="file-upload" 
            disabled={processing}
          />
          <label 
            htmlFor="file-upload"
            className={`inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-md active:scale-95 ${processing ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            <FileText className="w-5 h-5" />
            Выбрать файл
          </label>
        </div>

        {lastImportCount !== null && (
          <div className="mt-4 flex items-center gap-2 bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">Импорт завершен!</p>
              <p className="text-xs">Загружено {lastImportCount} уникальных записей.</p>
            </div>
          </div>
        )}

        {errorLog.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <XCircle className="w-5 h-5" />
              <p className="text-sm font-bold">Ошибки при импорте:</p>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {errorLog.map((err, i) => (
                <p key={i} className="text-[10px] text-red-600 leading-tight">• {err}</p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Правила системы:</h3>
          <ul className="text-xs text-slate-500 space-y-2">
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">1.</span>
              <span>Колонки должны называться <code className="bg-white px-1 border rounded font-mono">category</code> и <code className="bg-white px-1 border rounded font-mono">name</code>.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">2.</span>
              <span>Импорт дополняет текущий справочник.</span>
            </li>
          </ul>
        </div>
      </section>

      {catalog.length > 0 && (
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Текущий справочник ({catalog.length})</h2>
            <div className="flex gap-2">
              {selectedIndices.size > 0 && (
                <button 
                  onClick={handleDeleteSelected}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all active:scale-95 border border-red-100 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить ({selectedIndices.size})
                </button>
              )}
              <button 
                onClick={clearCatalog} 
                className="text-slate-500 hover:bg-slate-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
              >
                Очистить всё
              </button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/50 relative">
            <table className="w-full text-xs text-left">
              <thead className="bg-white sticky top-0 border-b shadow-sm z-10">
                <tr>
                  <th className="p-4 w-10">
                    <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 rounded transition-colors">
                      {selectedIndices.size === catalog.length && catalog.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </button>
                  </th>
                  <th className="p-4 font-black uppercase text-slate-400 tracking-tighter">Категория</th>
                  <th className="p-4 font-black uppercase text-slate-400 tracking-tighter">Наименование (Title)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalog.map((item, i) => (
                  <tr 
                    key={i} 
                    onClick={() => toggleSelect(i)}
                    className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedIndices.has(i) ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="p-4">
                      {selectedIndices.has(i) ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-200" />}
                    </td>
                    <td className="p-4"><span className="bg-white text-indigo-700 px-2.5 py-1 rounded-md font-bold border border-indigo-100 shadow-xs">{item.category}</span></td>
                    <td className="p-4 font-semibold text-slate-800">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
