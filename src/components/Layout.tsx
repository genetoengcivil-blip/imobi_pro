import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Map as MapIcon, Calendar, 
  DollarSign, Settings, User, LogOut, Menu, X, 
  FileText, Globe, Bell, Sun, Moon, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Logo } from './Logo';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'lead' | 'appointment' | 'system';
  read: boolean;
  created_at: string;
  link?: string;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-6 bg-red-500/10 border-2 border-red-500/50 rounded-3xl animate-fade-in">
          <h2 className="text-xl font-black text-red-500 mb-2 uppercase tracking-widest">Erro Detetado</h2>
          <pre className="bg-black p-6 rounded-2xl text-red-400 font-mono text-xs overflow-x-auto shadow-inner border border-white/5">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-red-500 text-white font-black rounded-xl text-[10px] uppercase">Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SIDEBAR_NAV = [
  { group: 'PRINCIPAL', items: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Leads', icon: Users, path: '/leads' },
    { name: 'Pipeline', icon: MapIcon, path: '/pipeline' },
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, darkMode, toggleDarkMode, leads, appointments } = useGlobal();
  const location = useLocation();
  const navigate = useNavigate();

  // Gerar notificações baseadas em leads e compromissos
  useEffect(() => {
    const newNotifications: Notification[] = [];
    
    // Notificações de novos leads (últimos 7 dias)
    const recentLeads = leads.filter(l => {
      const createdAt = new Date(l.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdAt >= sevenDaysAgo;
    });
    
    recentLeads.forEach(lead => {
      newNotifications.push({
        id: `lead-${lead.id}`,
        title: 'Novo Lead!',
        message: `${lead.name} acabou de se cadastrar com valor de ${formatCurrency(lead.value)}`,
        type: 'lead',
        read: false,
        created_at: lead.createdAt,
        link: '/leads'
      });
    });
    
    // Notificações de compromissos de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today);
    
    todayAppointments.forEach(app => {
      newNotifications.push({
        id: `app-${app.id}`,
        title: 'Compromisso Hoje!',
        message: `${app.title} às ${app.time}${app.clientName ? ` com ${app.clientName}` : ''}`,
        type: 'appointment',
        read: false,
        created_at: new Date().toISOString(),
        link: '/calendar'
      });
    });
    
    // Carregar notificações salvas
    const savedReadNotifications = localStorage.getItem('imobipro_read_notifications');
    const readIds = savedReadNotifications ? JSON.parse(savedReadNotifications) : [];
    
    const finalNotifications = newNotifications.map(n => ({
      ...n,
      read: readIds.includes(n.id)
    }));
    
    // Ordenar por data (mais recentes primeiro)
    finalNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setNotifications(finalNotifications);
    setUnreadCount(finalNotifications.filter(n => !n.read).length);
  }, [leads, appointments]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    
    // Salvar IDs lidos
    const readIds = updated.filter(n => n.read).map(n => n.id);
    localStorage.setItem('imobipro_read_notifications', JSON.stringify(readIds));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    const allIds = updated.map(n => n.id);
    localStorage.setItem('imobipro_read_notifications', JSON.stringify(allIds));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <Users size={14} className="text-green-500" />;
      case 'appointment':
        return <Calendar size={14} className="text-blue-500" />;
      default:
        return <AlertCircle size={14} className="text-amber-500" />;
    }
  };

  // 🔥 CORREÇÃO: Obter a primeira letra do nome ou inicial do email
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'C';
  };

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
    <div className={`min-h-screen flex font-sans ${theme.bgApp} ${theme.textMain}`}>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-64 ${theme.bgSidebar} border-r ${theme.border} flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`h-20 flex items-center justify-between px-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-black italic uppercase tracking-tighter">IMOBI<span className="text-[#0217ff]">PRO</span></span>
          </div>
          <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
          {SIDEBAR_NAV.map((group, idx) => (
            <div key={idx}>
              <h3 className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest mb-4 px-3`}>{group.group}</h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={itemIdx} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[#0217ff]/10 text-[#0217ff]' : `${theme.textMuted} ${theme.hover}`}`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-[#0217ff]' : ''}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* BOTÃO SAIR NA SIDEBAR */}
        <div className={`p-4 border-t ${theme.border}`}>
          <button onClick={handleLogout} className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium ${theme.textMuted} hover:text-red-500 hover:bg-red-500/10 transition-all`}>
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col lg:pl-64 min-h-screen w-full">
        <header className={`h-20 ${theme.bgHeader} backdrop-blur-xl border-b ${theme.border} flex items-center justify-between px-6 sticky top-0 z-30`}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold hidden sm:block">
              Olá, {user?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Corretor'} 👋
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* BOTÃO TEMA */}
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* SINO DE NOTIFICAÇÕES */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* DROPDOWN DE NOTIFICAÇÕES */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className={`absolute right-0 mt-2 w-80 max-h-96 overflow-hidden rounded-xl shadow-xl border z-50 ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                      <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notificações</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-[#0217ff] hover:underline"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-y-auto max-h-80">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 border-b cursor-pointer transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} ${!notif.read ? (darkMode ? 'bg-blue-500/10' : 'bg-blue-50') : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-full ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${!notif.read ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-zinc-400' : 'text-gray-500')}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: darkMode ? '#a1a1aa' : '#6b7280' }}>
                                  {notif.message}
                                </p>
                                <p className="text-[10px] mt-1.5" style={{ color: darkMode ? '#52525b' : '#9ca3af' }}>
                                  {new Date(notif.created_at).toLocaleDateString('pt-BR', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell size={24} className={`mx-auto mb-2 ${darkMode ? 'text-zinc-600' : 'text-gray-300'}`} />
                          <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Nenhuma notificação</p>
                          <p className={`text-[10px] mt-1 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Novos leads e compromissos aparecerão aqui</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* 🔥 AVATAR COM FOTO DO PERFIL */}
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover border-2 border-[#0217ff]/20 shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0217ff] to-[#00c6ff] flex items-center justify-center font-black text-white shadow-md">
                {getInitial()}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}