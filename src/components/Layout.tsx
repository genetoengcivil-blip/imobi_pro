import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Map as MapIcon, Calendar, 
  DollarSign, Settings, User, LogOut, Menu, X, 
  MessageSquare, FileText, Globe, Bell, Sun, Moon
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Logo } from './Logo';

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-6 bg-red-500/10 border-2 border-red-500/50 rounded-3xl animate-fade-in">
          <h2 className="text-xl font-black text-red-500 mb-2 uppercase tracking-widest">Erro Detetado</h2>
          <pre className="bg-black p-6 rounded-2xl text-red-400 font-mono text-xs overflow-x-auto shadow-inner border border-white/5">{this.state.error && this.state.error.toString()}</pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-red-500 text-white font-black rounded-xl text-[10px] uppercase">Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ROTAS SIMPLIFICADAS SEM O /APP
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, darkMode, toggleDarkMode } = useGlobal();
  const location = useLocation();
  const navigate = useNavigate();

  const theme = {
    bgApp: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    bgSidebar: darkMode ? 'bg-black' : 'bg-white',
    bgHeader: darkMode ? 'bg-black/80' : 'bg-white/80',
    border: darkMode ? 'border-white/5' : 'border-zinc-200',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    textMuted: darkMode ? 'text-zinc-500' : 'text-zinc-500',
    hover: darkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-100',
  };

  return (
    <div className={`min-h-screen flex font-sans selection:bg-[#0217ff]/30 ${theme.bgApp} ${theme.textMain}`}>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-64 ${theme.bgSidebar} border-r ${theme.border} flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`h-20 flex items-center justify-between px-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-black italic uppercase tracking-tighter">IMOBI<span className="text-[#0217ff]">PRO</span></span>
          </div>
          <button className={`lg:hidden ${theme.textMuted}`} onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
          {SIDEBAR_NAV.map((group, idx) => (
            <div key={idx}>
              <h3 className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest mb-4 px-3`}>{group.group}</h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={itemIdx} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[#0217ff]/10 text-[#0217ff]' : `${theme.textMuted} ${theme.hover} hover:${theme.textMain}`}`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-[#0217ff]' : theme.textMuted}`} />
                      <span className={isActive ? 'text-[#0217ff]' : theme.textMain}>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`p-4 border-t ${theme.border}`}>
          <button type="button" onClick={() => navigate('/login')} className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium ${theme.textMuted} hover:text-red-500 hover:bg-red-500/10 transition-all`}>
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col lg:pl-64 min-h-screen w-full relative">
        <header className={`h-20 ${theme.bgHeader} backdrop-blur-xl border-b ${theme.border} flex items-center justify-between px-6 sticky top-0 z-30 transition-colors`}>
          <div className="flex items-center gap-4">
            <button type="button" className={`lg:hidden p-2 -ml-2 ${theme.textMuted} hover:${theme.textMain} transition-colors`} onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className={`text-lg font-bold ${theme.textMain} hidden sm:block`}>
              Olá, {user?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Corretor'} 👋
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button type="button" onClick={toggleDarkMode} className={`p-2.5 rounded-xl ${theme.textMuted} ${theme.hover} transition-colors`}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button type="button" className={`p-2.5 rounded-xl ${theme.textMuted} ${theme.hover} transition-colors`}>
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-[#0217ff]/10 border border-[#0217ff]/20 flex items-center justify-center font-black text-[#0217ff] uppercase">
              {(user?.name || user?.user_metadata?.full_name || 'C')[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}