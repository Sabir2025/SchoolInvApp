
import React, { useState, useMemo } from 'react';
import { Upload, FileText, Database, Trash2, CheckCircle2, Loader2, XCircle, CheckSquare, Square, FileStack, X } from 'lucide-react';
import { CatalogItem } from '../types';
import * as XLSX from 'xlsx';

interface NomenclatureImportProps {
  catalog: CatalogItem[];
  setCatalog: (catalog: CatalogItem[]) => void;
  onDeleteItems: (ids: string[]) => void;
}

export const NomenclatureImport: React.FC<NomenclatureImportProps> = ({ catalog, setCatalog, onDeleteItems }) => {
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastImportCount, setLastImportCount] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedFileNames, setSelectedFileNames] = useState<Set<string>>(new Set());

  const uploadedFiles = useMemo(() => {
    const filesMap = new Map<string, { count: number, date: string }>();
    catalog.forEach(item => {
      if (item.sourceFile) {
        const existing = filesMap.get(item.sourceFile);
        filesMap.set(item.sourceFile, {
          count: (existing?.count || 0) + 1,
          date: item.importDate || new Date().toLocaleDateString()
        });
      }
    });
    return Array.from(filesMap.entries()).map(([name, meta]) => ({ name, ...meta }));
  }, [catalog]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    
    const reader = new FileReader();
    const fileName = file.name;
    const importDate = new Date().toLocaleString();
    
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

        const parsedCatalog: CatalogItem[] = jsonData.map(row => ({
          id: Math.random().toString(36).substr(2, 9) + Date.now(),
          category: String(row['category'] || row['Категория'] || '').trim(),
          name: String(row['name'] || row['Наименование'] || '').trim(),
          sourceFile: fileName,
          importDate: importDate
        })).filter(i => i.category && i.name);

        if (parsedCatalog.length > 0) {
          setCatalog([...catalog, ...parsedCatalog]);
          setLastImportCount(parsedCatalog.length);
        }
      } finally {
        setProcessing(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleItemSelect = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedItemIds(next);
  };

  const toggleFileSelect = (fileName: string) => {
    const next = new Set(selectedFileNames);
    if (next.has(fileName)) next.delete(fileName);
    else next.add(fileName);
    setSelectedFileNames(next);
  };

  const handleClearSelection = () => {
    setSelectedItemIds(new Set());
    setSelectedFileNames(new Set());
  };

  const handleDeleteItems = async () => {
    if (selectedItemIds.size === 0) return;
    if (window.confirm(`Вы уверены, что хотите удалить ${selectedItemIds.size} элементов из справочника?`)) {
      setDeleting(true);
      await new Promise(r => setTimeout(r, 600));
      onDeleteItems(Array.from(selectedItemIds));
      setSelectedItemIds(new Set());
      setDeleting(false);
      console.log(`[UI] Deleted ${selectedItemIds.size} nomenclature items.`);
    }
  };

  const handleDeleteFiles = async () => {
    if (selectedFileNames.size === 0) return;
    if (window.confirm(`Удалить выбранные файлы (${selectedFileNames.size}) и ВСЕ связанные с ними записи?`)) {
      setDeleting(true);
      const idsToDelete = catalog
        .filter(item => item.sourceFile && selectedFileNames.has(item.sourceFile))
        .map(item => item.id);
      
      await new Promise(r => setTimeout(r, 800));
      onDeleteItems(idsToDelete);
      setSelectedFileNames(new Set());
      setDeleting(false);
      console.log(`[UI] Deleted ${selectedFileNames.size} files and ${idsToDelete.length} records.`);
    }
  };

  const hasSelection = selectedItemIds.size > 0 || selectedFileNames.size > 0;

  return (
    <div className="space-y-6 pb-12">
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Загрузка данных</h2>
        </div>
        <div className="border-2 border-dashed rounded-xl p-8 text-center transition-all border-slate-200 hover:border-indigo-300 bg-slate-50/30">
          <Upload className={`w-12 h-12 mx-auto mb-3 ${processing ? 'text-indigo-400 animate-bounce' : 'text-slate-300'}`} />
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" id="file-upload" disabled={processing} />
          <label htmlFor="file-upload" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-indigo-700 shadow-md transition-all active:scale-95">
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            Выбрать файл (.xlsx)
          </label>
        </div>
        {lastImportCount && (
          <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4"/> 
            Успешно загружено {lastImportCount} поз.
          </div>
        )}
      </section>

      {hasSelection && (
        <div className="sticky top-20 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-indigo-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-indigo-800">
            <div className="flex items-center gap-4 ml-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Активный выбор</span>
              <div className="flex gap-3">
                {selectedFileNames.size > 0 && <span className="text-xs font-bold">Файлов: {selectedFileNames.size}</span>}
                {selectedItemIds.size > 0 && <span className="text-xs font-bold">Элементов: {selectedItemIds.size}</span>}
              </div>
            </div>
            <button 
              onClick={handleClearSelection}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              <X className="w-4 h-4" />
              Сбросить выбор
            </button>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileStack className="w-5 h-5 text-indigo-600" /> 
              Файлы
            </h2>
            {selectedFileNames.size > 0 && (
              <button 
                onClick={handleDeleteFiles} 
                disabled={deleting} 
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 flex items-center gap-2 transition-all active:scale-95"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 
                Удалить выбранное ({selectedFileNames.size})
              </button>
            )}
          </div>
          <div className="space-y-2">
            {uploadedFiles.map(file => (
              <div 
                key={file.name} 
                onClick={() => toggleFileSelect(file.name)} 
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedFileNames.has(file.name) ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-3">
                  {selectedFileNames.has(file.name) ? <CheckSquare className="text-indigo-600 w-5 h-5" /> : <Square className="text-slate-300 w-5 h-5" />}
                  <div>
                    <p className="text-sm font-bold text-slate-800">{file.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">
                      {file.date} • {file.count} поз.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {catalog.length > 0 && (
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Справочник ({catalog.length})</h2>
            {selectedItemIds.size > 0 && (
              <button 
                onClick={handleDeleteItems} 
                disabled={deleting} 
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 flex items-center gap-2 transition-all active:scale-95"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 
                Удалить выбранное ({selectedItemIds.size})
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-100 shadow-inner">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                <tr>
                  <th className="p-3 w-10"></th>
                  <th className="p-3 text-[10px] uppercase font-black text-slate-400 tracking-widest">Категория</th>
                  <th className="p-3 text-[10px] uppercase font-black text-slate-400 tracking-widest">Наименование</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalog.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => toggleItemSelect(item.id)} 
                    className={`cursor-pointer transition-colors ${selectedItemIds.has(item.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="p-3">
                      {selectedItemIds.has(item.id) ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-200" />}
                    </td>
                    <td className="p-3 font-bold text-indigo-700 text-xs">{item.category}</td>
                    <td className="p-3 font-medium text-slate-800 text-xs">{item.name}</td>
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
