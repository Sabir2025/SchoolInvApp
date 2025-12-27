
import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Send, Image as ImageIcon, Check } from 'lucide-react';
import { CatalogItem, InventoryRecord, ItemStatus } from '../types';
import { GoogleGenAI } from '@google/genai';

interface InventoryFormProps {
  catalog: CatalogItem[];
  onSubmit: (record: InventoryRecord) => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ catalog, onSubmit }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
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
        // Analyze image with AI for auto-fill (optional extra feature)
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
      // Fix: Follow @google/genai guidelines - use process.env.API_KEY directly and named parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Fix: Follow guidelines for multi-part content generation
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "What kind of school equipment is this? Identify category, model, and serial number if visible. Return format: JSON with category, model, serialNumber." },
            { inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } }
          ]
        }
      });
      // Logic to merge AI findings with form...
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
      setFormData({
        ...formData,
        inventoryNumber: '',
        model: '',
        serialNumber: '',
        note: ''
      });
      setLoading(false);
      window.scrollTo(0, 0);
    }, 500);
  };

  const onCatalogSelect = (name: string) => {
    const item = catalog.find(i => i.name === name);
    if (item) {
      // Fix: Remove access to inventoryNumber, model, serialNumber, and unit as they are no longer part of CatalogItem
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
                onClick={() => setPhoto(null)}
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg"
              >
                <RefreshCw className="w-5 h-5 text-slate-700" />
              </button>
            </>
          ) : showCamera ? (
            <div className="relative w-full h-full bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button 
                  onClick={handleCapture}
                  className="w-16 h-16 rounded-full border-4 border-white bg-red-500 shadow-xl"
                />
              </div>
            </div>
          ) : (
            <button 
              onClick={startCamera}
              className="flex flex-col items-center gap-3 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <div className="p-4 bg-indigo-50 rounded-full">
                <Camera className="w-10 h-10 text-indigo-600" />
              </div>
              <span className="font-medium">Сфотографировать</span>
            </button>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Категория *</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Выберите категорию</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Наименование *</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label className="text-sm font-semibold text-slate-700">Инв. номер</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.inventoryNumber}
                onChange={(e) => setFormData({...formData, inventoryNumber: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Кол-во *</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  required
                  className="w-20 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                />
                <input 
                  type="text"
                  placeholder="шт"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Ответственный *</label>
              <input 
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.responsible}
                onChange={(e) => setFormData({...formData, responsible: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">№ Кабинета *</label>
              <input 
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.roomNumber}
                onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Состояние *</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ItemStatus).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, status: s})}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    formData.status === s 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Примечание</label>
            <textarea 
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-70 transition-all"
          >
            {loading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Отправить в реестр
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
