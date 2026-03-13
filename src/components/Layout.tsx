import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Map as MapIcon, Calendar, 
  DollarSign, Settings, User, LogOut, Menu, X, 
  MessageSquare, FileText, Globe, Bell
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Logo } from './Logo';

const SIDEBAR_NAV = [
  { group: 'PRINCIPAL', items: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Leads', icon: Users, path: '/leads' },
    { name: 'Pipeline', icon: MapIcon, path: '/pipeline' },
    { name: 'WhatsApp', icon: MessageSquare, path: '/whatsapp' },
    { name: 'Imóveis', icon: Globe, path: '/properties' },
    { name: 'Contratos', icon: FileText, path: '/contracts' },
  ]},
  { group: 'GESTÃO', items: [
    { name: 'Meu Site', icon: Globe, path: '/site' },
    { name: 'Agenda', icon: Calendar, path: '/calendar' },
    { name: 'Financeiro', icon: DollarSign, path: '/financial' },
  ]},
  { group: 'CONTA', items: [
    { name: 'Meu Perfil', icon: User, path: '/profile' },
    { name: 'Ajustes', icon: Settings, path: '/settings' },
  ]}
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, darkMode } = useGlobal();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 🛡️ LÓGICA DE CORES MANUAIS (Ignora o tema do Windows)
  const sidebarBg = darkMode ? 'bg-[#0a0a0a]' : 'bg-white';
  const headerBg = darkMode ? 'bg-[#0a0a0a]/80' : 'bg-white/80';
  const borderCol = darkMode ? 'border-white/5' : 'border-zinc-200';
  const textCol = darkMode ? 'text-white' : 'text-zinc-900';
  const mainBg = darkMode ? 'bg-black' : 'bg-zinc-50';

  return (
    <div className={`min-h-screen flex w-full transition-colors duration-300 ${mainBg}`}>
      
      {/* SIDEBAR */}
      <aside className={`w-64 hidden lg:flex flex-col ${sidebarBg} border-r ${borderCol} fixed inset-y-0 left-0 z-40 transition-colors`}>
        <div className={`h-20 flex items-center px-6 border-b ${borderCol}`}>
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className={`font-bold text-xl tracking-tight ${textCol}`}>Imobi<span className="text-[#0217ff]">Pro</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {SIDEBAR_NAV.map((group, i) => (
            <div key={i}>
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-3">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all font-medium ${
                        isActive 
                          ? 'bg-[#0217ff]/10 text-[#0217ff] font-bold' 
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-[#0217ff]' : 'text-zinc-400'}`} />
                      <span className={isActive ? 'text-[#0217ff]' : textCol}>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`p-4 border-t ${borderCol}`}>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        <header className={`h-20 ${headerBg} backdrop-blur-xl border-b ${borderCol} flex items-center justify-between px-6 sticky top-0 z-30 transition-colors`}>
          <h2 className={`text-lg font-bold ${textCol}`}>Olá, {user?.name?.split(' ')[0] || 'Corretor'} 👋</h2>
          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl text-zinc-400 hover:bg-zinc-100"><Bell className="w-5 h-5" /></button>
            <div className="w-10 h-10 rounded-xl bg-[#0217ff] flex items-center justify-center text-white font-bold uppercase">{user?.name?.charAt(0) || 'C'}</div>
          </div>
        </header>

        <div className="flex-1 p-6 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}