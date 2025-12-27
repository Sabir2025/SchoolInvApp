
import React, { useState } from 'react';
import { Settings, ShieldCheck, Mail, Package, ClipboardCheck, History, Bell, BellOff, Lock, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InventoryRecord, User } from '../types';

interface AdminPortalProps {
  user: User;
  records: InventoryRecord[];
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, records, onUpdateUser, onLogout }) => {
  const [modal, setModal] = useState<'password' | 'delete' | null>(null);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const toggleNotifications = () => {
    const updated = { ...user, notificationsEnabled: !user.notificationsEnabled };
    onUpdateUser(updated);
    
    if (updated.notificationsEnabled) {
      console.log(`[Notification Engine] Enabled for ${user.email}. Sending test email...`);
    } else {
      console.log(`[Notification Engine] Disabled for ${user.email}.`);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (passwordData.current !== user.password) {
      setFeedback({ type: 'error', message: 'Неверный текущий пароль.' });
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setFeedback({ type: 'error', message: 'Новые пароли не совпадают.' });
      return;
    }
    if (passwordData.new.length < 6) {
      setFeedback({ type: 'error', message: 'Новый пароль слишком короткий (мин. 6 симв).' });
      return;
    }

    onUpdateUser({ ...user, password: passwordData.new });
    setFeedback({ type: 'success', message: 'Пароль успешно изменен!' });
    setTimeout(() => setModal(null), 1500);
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== user.password) {
      alert('Неверный пароль для удаления аккаунта.');
      return;
    }

    if (window.confirm('ВНИМАНИЕ: Все ваши данные будут удалены навсегда. Продолжить?')) {
      const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      const filtered = allUsers.filter((u: User) => u.email !== user.email);
      localStorage.setItem('all_users', JSON.stringify(filtered));
      localStorage.removeItem('inventory_records'); // Purge data associated with user (simulated)
      onLogout();
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold truncate tracking-tight">{user.fullName}</h2>
            {user.isAdmin && <ShieldCheck className="w-4 h-4 text-green-500" title="Администратор" />}
          </div>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest leading-none mb-1">{user.jobTitle}</p>
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </section>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
          <Package className="w-6 h-6 text-indigo-500 mb-2" />
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Имущество</span>
          <span className="text-xl font-black">{records.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
          <ClipboardCheck className="w-6 h-6 text-green-500 mb-2" />
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Синхронно</span>
          <span className="text-xl font-black">{records.filter(r => r.isSynced).length}</span>
        </div>
      </div>

      {/* Functional Settings */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold">Управление профилем</h2>
        </div>
        
        <div className="space-y-4">
          {/* Real Notification Switch */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${user.notificationsEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                {user.notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold">Уведомления</p>
                <p className="text-[10px] text-slate-400">Email и Push отчеты</p>
              </div>
            </div>
            <button 
              onClick={toggleNotifications}
              className={`w-12 h-6 rounded-full transition-colors relative ${user.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.notificationsEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <button 
            onClick={() => setModal('password')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all font-bold text-sm"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-slate-400" />
              Изменить пароль
            </div>
          </button>

          <button 
            onClick={() => setModal('delete')}
            className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 transition-all font-bold text-sm"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4" />
              Удалить аккаунт
            </div>
          </button>
        </div>
      </section>

      {/* Password Modal */}
      {modal === 'password' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">Смена пароля</h3>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            {feedback && (
              <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                {feedback.message}
              </div>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <input type="password" required placeholder="Текущий пароль" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})}/>
              <input type="password" required placeholder="Новый пароль" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})}/>
              <input type="password" required placeholder="Подтвердите новый пароль" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}/>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700">Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 border-2 border-red-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6"/>
                <h3 className="text-xl font-black">Удаление данных</h3>
              </div>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-slate-500 text-sm mb-6 font-medium">Это действие необратимо. Будет удален ваш профиль и все связанные записи инвентаризации.</p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Введите текущий пароль для подтверждения</label>
              <input type="password" required placeholder="Ваш пароль" className="w-full p-3 bg-red-50 border border-red-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}/>
              <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-700">Я ПОНИМАЮ, УДАЛИТЬ АККАУНТ</button>
            </form>
          </div>
        </div>
      )}

      {/* Version Info */}
      <section className="text-center py-6 opacity-40">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">School Inventory Pro Enterprise v2.0.0</p>
      </section>
    </div>
  );
};

const UserIcon = ({className}: {className?: string}) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
