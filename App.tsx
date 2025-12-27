
import React, { useState, useEffect } from 'react';
import { AuthView } from './components/Auth';
import { InventoryForm } from './components/InventoryForm';
import { AdminPortal } from './components/AdminPortal';
import { RegistryList } from './components/RegistryList';
import { StatisticsView } from './components/StatisticsView';
import { WelcomeView } from './components/WelcomeView';
import { NomenclatureImport } from './components/NomenclatureImport';
import { InventoryRecord, User, CatalogItem } from './types';
import { List, PlusCircle, BarChart3, User as UserIcon, LogOut, Package, FileUp, Home } from 'lucide-react';

type ViewState = 'welcome' | 'profile' | 'stats' | 'registry' | 'add' | 'import';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('welcome');
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('inventory_user');
    const savedCatalog = localStorage.getItem('inventory_catalog');
    const savedRecords = localStorage.getItem('inventory_records');
    
    if (savedUser) {
      const parsedUser: User = JSON.parse(savedUser);
      if (parsedUser.isVerified) {
        setUser(parsedUser);
      } else {
        localStorage.removeItem('inventory_user');
      }
    }
    
    if (savedCatalog) setCatalog(JSON.parse(savedCatalog));
    if (savedRecords) setRecords(JSON.parse(savedRecords));
  }, []);

  const handleLogin = (user: User) => {
    if (!user.isVerified) return;
    setUser(user);
    localStorage.setItem('inventory_user', JSON.stringify(user));
    setView('welcome');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('inventory_user', JSON.stringify(updatedUser));
    
    // Update in "database"
    const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
    const userIndex = allUsers.findIndex((u: User) => u.email === updatedUser.email);
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser;
      localStorage.setItem('all_users', JSON.stringify(allUsers));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('inventory_user');
    setView('welcome');
  };

  const addRecord = (record: InventoryRecord) => {
    const updatedRecords = [record, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('inventory_records', JSON.stringify(updatedRecords));
    
    setTimeout(() => {
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, isSynced: true } : r));
    }, 2000);
    
    setView('registry');
  };

  const deleteRecords = (ids: string[]) => {
    const updatedRecords = records.filter(r => !ids.includes(r.id));
    setRecords(updatedRecords);
    localStorage.setItem('inventory_records', JSON.stringify(updatedRecords));
  };

  const deleteCatalogItems = (indices: number[]) => {
    const updatedCatalog = catalog.filter((_, index) => !indices.includes(index));
    setCatalog(updatedCatalog);
    localStorage.setItem('inventory_catalog', JSON.stringify(updatedCatalog));
  };

  if (!user || !user.isVerified) {
    return <AuthView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch(view) {
      case 'welcome':
        return <WelcomeView user={user} onNavigate={(v) => setView(v)} />;
      case 'profile':
        return <AdminPortal user={user} records={records} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />;
      case 'stats':
        return <StatisticsView records={records} />;
      case 'registry':
        return <RegistryList records={records} onDeleteRecords={deleteRecords} />;
      case 'import':
        return <NomenclatureImport 
                  catalog={catalog} 
                  setCatalog={(c) => {
                    setCatalog(c);
                    localStorage.setItem('inventory_catalog', JSON.stringify(c));
                  }} 
                  onDeleteItems={deleteCatalogItems}
                />;
      case 'add':
      default:
        return <InventoryForm catalog={catalog} onSubmit={addRecord} />;
    }
  };

  const viewTitles: Record<ViewState, string> = {
    welcome: 'Главная',
    profile: 'Личный кабинет',
    stats: 'Статистика',
    registry: 'Реестр имущества',
    add: 'Новая инвентаризация',
    import: 'Импорт номенклатуры'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0">
      <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Package className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-slate-900">SchoolInvPro</h1>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{viewTitles[view]}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
             <p className="text-xs font-bold text-slate-800 leading-none">{user.fullName}</p>
             <p className="text-[10px] text-slate-400">{user.organization}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setView('welcome')} className={`flex flex-col items-center gap-1 transition-all ${view === 'welcome' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Главная</span>
        </button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 transition-all ${view === 'profile' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">Кабинет</span>
        </button>
        <button onClick={() => setView('registry')} className={`flex flex-col items-center gap-1 transition-all ${view === 'registry' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <List className="w-6 h-6" />
          <span className="text-[10px] font-bold">Реестр</span>
        </button>
        <button onClick={() => setView('add')} className={`flex flex-col items-center gap-1 transition-all ${view === 'add' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <PlusCircle className="w-6 h-6" />
          <span className="text-[10px] font-bold">Добавить</span>
        </button>
        <button onClick={() => setView('import')} className={`flex flex-col items-center gap-1 transition-all ${view === 'import' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <FileUp className="w-6 h-6" />
          <span className="text-[10px] font-bold">Импорт</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
