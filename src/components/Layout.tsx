import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Map as MapIcon, Calendar, 
  DollarSign, Settings, User, LogOut, Menu, X, 
  MessageSquare, FileText, Globe, Bell
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Logo } from './Logo';

// CORREÇÃO AQUI: Todos os paths agora incluem o prefixo '/app'
const SIDEBAR_NAV = [
  { group: 'PRINCIPAL', items: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { name: 'Leads', icon: Users, path: '/app/leads' },
    { name: 'Pipeline', icon: MapIcon, path: '/app/pipeline' },
    { name: 'WhatsApp', icon: MessageSquare, path: '/app/whatsapp' },
    { name: 'Imóveis', icon: Globe, path: '/app/properties' },
    { name: 'Contratos', icon: FileText, path: '/app/contracts' },
  ]},
  { group: 'GESTÃO', items: [
    { name: 'Meu Site', icon: Globe, path: '/app/site' },
    { name: 'Agenda', icon: Calendar, path: '/app/calendar' },
    { name: 'Financeiro', icon: DollarSign, path: '/app/financial' },
  ]},
  { group: 'CONTA', items: [
    { name: 'Meu Perfil', icon: User, path: '/app/profile' },
    { name: 'Ajustes', icon: Settings, path: '/app/settings' },
  ]}
];

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useGlobal();
  const location = useLocation();
  const navigate = useNavigate();

  // Constantes de estilo (Modo Escuro Padrão)
  const sidebarBg = 'bg-black';
  const borderCol = 'border-white/5';
  const textCol = 'text-white';
  const headerBg = 'bg-black/80';

  const handleLogout = async () => {
    // Encaminha para o login; a própria página de login lidará com a limpeza da sessão, se necessário.
    navigate('/login');
  };

  return (
    <div className={`min-h-screen bg-zinc-950 flex ${textCol} font-sans`}>
      
      {/* OVERLAY DO MENU MOBILE */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MENU LATERAL (SIDEBAR) */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-64 ${sidebarBg} border-r ${borderCol} flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`h-20 flex items-center justify-between px-6 border-b ${borderCol}`}>
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-black italic uppercase tracking-tighter">IMOBI<span className="text-[#0217ff]">PRO</span></span>
          </div>
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
          {SIDEBAR_NAV.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-3">{group.group}</h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={itemIdx}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-[#0217ff]/10 text-[#0217ff]' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
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

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col lg:pl-64 min-h-screen w-full relative">
        <header className={`h-20 ${headerBg} backdrop-blur-xl border-b ${borderCol} flex items-center justify-between px-6 sticky top-0 z-30 transition-colors`}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className={`text-lg font-bold ${textCol} hidden sm:block`}>
              Olá, {user?.name?.split(' ')[0] || user?.nome_exibicao?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Corretor'} 👋
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl text-zinc-400 hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-[#0217ff]/20 border border-[#0217ff]/30 flex items-center justify-center font-black text-[#0217ff] uppercase">
              {(user?.name || user?.nome_exibicao || user?.user_metadata?.full_name || 'C')[0]}
            </div>
          </div>
        </header>

        {/* Aqui é onde as páginas (Dashboard, Leads, etc.) são renderizadas */}
        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}