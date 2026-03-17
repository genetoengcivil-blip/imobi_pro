import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, Users, MessageSquare, Building2, 
  Calendar, DollarSign, FileText, Settings, User, 
  LogOut, Menu, X, Globe, Zap, Bell, ChevronLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Logo } from './Logo';

export default function Layout() {
  const { user, darkMode } = useGlobal();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Leads', icon: Users, path: '/leads' },
    { label: 'Pipeline', icon: Zap, path: '/pipeline' },
    { label: 'WhatsApp', icon: MessageSquare, path: '/whatsapp' },
    { label: 'Imóveis', icon: Building2, path: '/properties' },
    { label: 'Agenda', icon: Calendar, path: '/calendar' },
    { label: 'Financeiro', icon: DollarSign, path: '/financial' },
    { label: 'Meu Site', icon: Globe, path: '/site' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${darkMode ? 'bg-black text-white' : 'bg-[#F8F9FA] text-zinc-900'} font-['Inter',sans-serif]`}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        /* Remover barra de scroll horizontal */
        body { overflow-x: hidden; }
      `}</style>

      {/* SIDEBAR - DESKTOP (Apenas visível em telas grandes) */}
      <aside className={`hidden lg:flex flex-col w-72 fixed h-full z-50 border-r ${darkMode ? 'bg-black border-white/5' : 'bg-white border-zinc-200'}`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-[900] italic uppercase tracking-tighter">IMOBI<span className="text-[#0217ff]">PRO</span></span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                  isActive(item.path)
                    ? 'bg-[#0217ff] text-white shadow-lg shadow-blue-600/20'
                    : `text-zinc-500 hover:text-white hover:bg-white/5`
                }`}
              >
                <item.icon size={20} className={isActive(item.path) ? 'text-white' : 'group-hover:text-[#0217ff]'} />
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE & DESKTOP TOP BAR */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0 min-h-screen pb-20 lg:pb-0">
        
        <header className={`h-16 lg:h-20 flex items-center justify-between px-5 md:px-10 sticky top-0 z-40 backdrop-blur-xl border-b ${
          darkMode ? 'bg-black/80 border-white/5' : 'bg-white/80 border-zinc-200'
        }`}>
          {/* Menu Mobile Trigger */}
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-zinc-400">
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-3 lg:hidden absolute left-1/2 -translate-x-1/2">
            <Logo className="w-6 h-6" />
            <span className="text-sm font-[900] italic uppercase tracking-tighter">IMOBI<span className="text-[#0217ff]">PRO</span></span>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Servidor Online</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#0217ff] flex items-center justify-center font-black text-white text-xs italic">
                {user?.full_name?.charAt(0) || <User size={14} />}
              </div>
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 p-4 md:p-10 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </div>
      </div>

      {/* BOTTOM NAVIGATION (Apenas Mobile) */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl px-6 py-3 flex justify-between items-center ${
        darkMode ? 'bg-black/90 border-white/10' : 'bg-white/90 border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
      }`}>
        {[
          { icon: LayoutDashboard, path: '/dashboard', label: 'Início' },
          { icon: Users, path: '/leads', label: 'Leads' },
          { icon: MessageSquare, path: '/whatsapp', label: 'Whats' },
          { icon: Zap, path: '/pipeline', label: 'Vendas' },
          { icon: User, path: '/profile', label: 'Perfil' },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive(item.path) ? 'text-[#0217ff] scale-110' : 'text-zinc-500'
            }`}
          >
            <item.icon size={20} strokeWidth={isActive(item.path) ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* FULLSCREEN MOBILE MENU (Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-300">
          <div className="flex flex-col h-full p-8">
            <div className="flex justify-between items-center mb-12">
              <Logo className="w-10 h-10" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-full">
                <X size={28} className="text-white" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-6 py-5 border-b border-white/5 font-black italic uppercase tracking-tighter text-2xl ${
                    isActive(item.path) ? 'text-[#0217ff]' : 'text-zinc-500'
                  }`}
                >
                  <item.icon size={24} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="pt-8 space-y-4">
               <Link to="/settings" className="flex items-center gap-4 text-zinc-400 font-black uppercase text-xs tracking-widest">
                  <Settings size={20} /> Configurações
               </Link>
               <button onClick={handleSignOut} className="flex items-center gap-4 text-red-500 font-black uppercase text-xs tracking-widest">
                  <LogOut size={20} /> Sair da Conta
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}