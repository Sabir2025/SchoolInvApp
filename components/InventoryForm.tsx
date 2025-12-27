
import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Send, Image as ImageIcon, Check, Trash2, RotateCcw } from 'lucide-react';
import { CatalogItem, InventoryRecord, ItemStatus } from '../types';
import { GoogleGenAI } from '@google/genai';

interface InventoryFormProps {
  catalog: CatalogItem[];
  onSubmit: (record: InventoryRecord) => void;
}

const getDefaultFormData = () => ({
  category: '',
  name: '',
  inventoryNumber: '',
  model: '',
  serialNumber: '',
  quantity: 1,
  unit: 'шт',
  responsible: '',
  roomNumber: '',
  status: ItemStatus.GOOD,
  date: new Date().toISOString().split('T')[0],
  note: ''
});

export const InventoryForm: React.FC<InventoryFormProps> = ({ catalog, onSubmit }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState(getDefaultFormData());

  // Unique lists from catalog
  const categories = Array.from(new Set(catalog.map(i => i.category)));
  const filteredNames = catalog
    .filter(i => !formData.category || i.category === formData.category)
    .map(i => i.name);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
        // Analyze image with AI for auto-fill
        analyzePhoto(dataUrl);
      }
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error", err);
      alert("Не удалось получить доступ к камере");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const analyzePhoto = async (base64: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "What kind of school equipment is this? Identify category, model, and serial number if visible. Return format: JSON with category, model, serialNumber." },
            { inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } }
          ]
        }
      });
      console.log("AI Analysis:", response.text);
    } catch (e) {
      console.warn("AI analysis failed, skipping...");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      alert("Сфотографируйте имущество!");
      return;
    }
    
    setLoading(true);
    
    const record: InventoryRecord = {
      ...formData,
      id: Math.random().toString(36).substring(2),
      photoUrl: photo,
      isSynced: false
    };

    onSubmit(record);
    
    // Reset
    setTimeout(() => {
      setPhoto(null);
      setFormData(getDefaultFormData());
      setLoading(false);
      window.scrollTo(0, 0);
    }, 500);
  };

  const handleClearForm = () => {
    if (window.confirm("Вы уверены, что хотите очистить все поля формы? Введенные данные будут потеряны.")) {
      setPhoto(null);
      setFormData(getDefaultFormData());
      if (showCamera) stopCamera();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onCatalogSelect = (name: string) => {
    const item = catalog.find(i => i.name === name);
    if (item) {
      setFormData(prev => ({
        ...prev,
        name: item.name,
        category: item.category
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="relative aspect-video bg-slate-100 flex items-center justify-center">
          {photo ? (
            <>
              <img src={photo} alt="Inventory" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-slate-700" />
              </button>
            </>
          ) : showCamera ? (
            <div className="relative w-full h-full bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button 
                  type="button"
                  onClick={handleCapture}
                  className="w-16 h-16 rounded-full border-4 border-white bg-red-500 shadow-xl active:scale-95 transition-transform"
                />
              </div>
            </div>
          ) : (
            <button 
              type="button"
              onClick={startCamera}
              className="flex flex-col items-center gap-3 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <div className="p-4 bg-indigo-50 rounded-full">
                <Camera className="w-10 h-10 text-indigo-600" />
              </div>
              <span className="font-medium text-sm">Сфотографировать объект</span>
            </button>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Категория *</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Выберите категорию</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Наименование *</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={formData.name}
                onChange={(e) => onCatalogSelect(e.target.value)}
              >
                <option value="">Выберите из справочника</option>
                {filteredNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Инв. номер</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={formData.inventoryNumber}
                onChange={(e) => setFormData({...formData, inventoryNumber: e.target.value})}
                placeholder="INV-0000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Количество *</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  required
                  min="1"
                  className="w-20 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                />
                <input 
                  type="text"
                  placeholder="шт"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Ответственный *</label>
              <input 
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={formData.responsible}
                onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                placeholder="ФИО сотрудника"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">№ Кабинета *</label>
              <input 
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={formData.roomNumber}
                onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                placeholder="101"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Состояние *</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ItemStatus).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, status: s})}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    formData.status === s 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 active:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Примечание</label>
            <textarea 
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              placeholder="Дополнительная информация..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-70 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Отправить в реестр
                </>
              )}
            </button>
            
            <button 
              type="button"
              onClick={handleClearForm}
              className="sm:w-1/3 bg-white border border-slate-200 text-slate-500 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Очистить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
