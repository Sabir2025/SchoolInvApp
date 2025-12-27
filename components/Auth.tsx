
import React, { useState } from 'react';
import { Mail, Lock, CheckCircle, Building2, Briefcase, AlertCircle, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const AuthView: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organization: '',
    fullName: '',
    jobTitle: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering) {
      if (!formData.fullName || !formData.organization || !formData.jobTitle || !formData.email || !formData.password) {
        setError('Пожалуйста, заполните все обязательные поля.');
        return;
      }

      const newUser: User = {
        email: formData.email,
        fullName: formData.fullName,
        organization: formData.organization,
        jobTitle: formData.jobTitle,
        password: formData.password,
        isAdmin: formData.email.includes('admin'),
        isVerified: false,
        notificationsEnabled: true
      };
      
      localStorage.setItem(`pending_user_${formData.email}`, JSON.stringify(newUser));
      setConfirmationSent(true);
    } else {
      const users = JSON.parse(localStorage.getItem('all_users') || '[]');
      const user = users.find((u: User) => u.email === formData.email && u.password === formData.password);
      
      if (!user) {
        setError('Неверный email или пароль.');
        return;
      }

      if (!user.isVerified) {
        setError('Email не подтвержден. Пожалуйста, перейдите по ссылке в письме.');
        return;
      }

      onLogin(user);
    }
  };

  const handleVerifySimulation = () => {
    const pendingData = localStorage.getItem(`pending_user_${formData.email}`);
    if (!pendingData) return;
    
    const pending = JSON.parse(pendingData);
    const verifiedUser = { ...pending, isVerified: true };
    
    const users = JSON.parse(localStorage.getItem('all_users') || '[]');
    users.push(verifiedUser);
    localStorage.setItem('all_users', JSON.stringify(users));
    localStorage.removeItem(`pending_user_${formData.email}`);
    
    onLogin(verifiedUser);
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Подтвердите Email</h2>
          <p className="text-slate-500 mb-6 text-sm">
            Мы отправили ссылку для подтверждения на <strong>{formData.email}</strong>. 
            Пожалуйста, проверьте почту и перейдите по ссылке для активации аккаунта.
          </p>
          <button 
            onClick={handleVerifySimulation}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Имитировать подтверждение
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tighter">SchoolInvPro</h1>
          <p className="text-slate-500 text-sm">
            {isRegistering ? 'Регистрация новой организации' : 'Вход в систему'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Название организации *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" required value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} placeholder="Лицей №1 или ГБОУ..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">ФИО *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Иванов Иван Иванович" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Должность *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" required value={formData.jobTitle} onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} placeholder="Завхоз / Учитель..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"/>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="school@example.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"/>
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Пароль *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"/>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-4 active:scale-95">
            {isRegistering ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-slate-500">
            {isRegistering ? 'Уже есть аккаунт?' : 'Нет аккаунта организации?'} 
          </span>
          <button onClick={() => { setIsRegistering(!isRegistering); setError(null); }} className="ml-1 text-indigo-600 font-bold hover:underline">
            {isRegistering ? 'Войти' : 'Регистрация'}
          </button>
        </div>
      </div>
    </div>
  );
};
