import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  X,
  CheckCircle2,
  Trash2,
  Calendar as CalendarIcon,
  Edit3,
  Eye,
  Check,
  AlertCircle,
  Briefcase,
  Home,
  FileText,
  Users,
  Video,
  Phone,
  MessageSquare,
  MoreVertical,
  Filter,
  Search,
  CalendarDays,
  ChevronDown,
  Bell,
  BellRing,
  Repeat,
  Link as LinkIcon,
  Mail,
  Send
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Appointment } from '../types';
import { format, isToday, isTomorrow, isPast, isFuture, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarPage() {
  const { appointments, addAppointment, deleteAppointment, darkMode } = useGlobal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedFilter, setSelectedFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [newApp, setNewApp] = useState<Omit<Appointment, 'id'>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    endTime: '',
    type: 'visita',
    notes: '',
    location: '',
    clientName: '',
    clientPhone: '',
    status: 'pendente',
    reminder: true
  });

  // Dias da semana
  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  // Horários do dia (9h às 19h)
  const dayHours = useMemo(() => {
    const hours = [];
    for (let i = 9; i <= 19; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
      if (i !== 19) hours.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return hours;
  }, []);

  // Dias do mês
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Adicionar dias do mês anterior para completar a primeira semana
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }
    
    // Dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Adicionar dias do próximo mês para completar a última semana
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, [currentDate]);

  // Dias da semana para a semana atual
  const weekDaysList = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentDate]);

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    let filtered = appointments.filter(a => a.date === dateStr);
    
    if (selectedFilter !== 'todos') {
      filtered = filtered.filter(a => a.type === selectedFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const selectedDayApps = useMemo(() => {
    return getAppointmentsForDate(currentDate);
  }, [appointments, currentDate, selectedFilter, searchTerm]);

  const getAppointmentTypeStyle = (type: string) => {
    const styles = {
      visita: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: Home, label: 'Visita' },
      reunião: { bg: 'bg-purple-500/10', text: 'text-purple-500', icon: Users, label: 'Reunião' },
      'follow-up': { bg: 'bg-green-500/10', text: 'text-green-500', icon: MessageSquare, label: 'Follow-up' },
      assinatura: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: FileText, label: 'Assinatura' }
    };
    return styles[type as keyof typeof styles] || styles.visita;
  };

  const getStatusStyle = (status: string) => {
    const styles = {
      pendente: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Pendente' },
      confirmado: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Confirmado' },
      realizado: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Realizado' },
      cancelado: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Cancelado' }
    };
    return styles[status as keyof typeof styles] || styles.pendente;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const appointmentToSave = {
      ...newApp,
      id: editingAppointment?.id || Date.now().toString()
    };
    
    if (editingAppointment) {
      addAppointment(appointmentToSave);
    } else {
      addAppointment(appointmentToSave);
    }
    
    setIsModalOpen(false);
    setEditingAppointment(null);
    setNewApp({
      title: '',
      date: currentDate.toISOString().split('T')[0],
      time: '',
      endTime: '',
      type: 'visita',
      notes: '',
      location: '',
      clientName: '',
      clientPhone: '',
      status: 'pendente',
      reminder: true
    });
  };

  const handleDelete = (id: string) => {
    deleteAppointment(id);
    if (showDetailsModal) setShowDetailsModal(false);
  };

  const handleEdit = (app: Appointment) => {
    setEditingAppointment(app);
    setNewApp({
      title: app.title,
      date: app.date,
      time: app.time,
      endTime: app.endTime || '',
      type: app.type,
      notes: app.notes || '',
      location: app.location || '',
      clientName: app.clientName || '',
      clientPhone: app.clientPhone || '',
      status: app.status || 'pendente',
      reminder: app.reminder ?? true
    });
    setIsModalOpen(true);
    setShowDetailsModal(false);
  };

  const handleViewDetails = (app: Appointment) => {
    setSelectedAppointment(app);
    setShowDetailsModal(true);
  };

  const cardStyles = darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900';
  const inputStyles = darkMode ? 'bg-zinc-800 border-white/10 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400';

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Agenda</h1>
          <p className="text-zinc-500 font-medium mt-1">Gerencie suas visitas e compromissos</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar compromissos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-11 pr-4 py-3 rounded-xl text-sm ${inputStyles} w-64`}
            />
          </div>
          <button 
            onClick={() => {
              setEditingAppointment(null);
              setNewApp({
                title: '',
                date: currentDate.toISOString().split('T')[0],
                time: '',
                endTime: '',
                type: 'visita',
                notes: '',
                location: '',
                clientName: '',
                clientPhone: '',
                status: 'pendente',
                reminder: true
              });
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Novo Compromisso
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedFilter('todos')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all
            ${selectedFilter === 'todos' 
              ? 'bg-[#0217ff] text-white' 
              : `${cardStyles} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
        >
          Todos
        </button>
        <button
          onClick={() => setSelectedFilter('visita')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2
            ${selectedFilter === 'visita' 
              ? 'bg-[#0217ff] text-white' 
              : `${cardStyles} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
        >
          <Home size={12} /> Visitas
        </button>
        <button
          onClick={() => setSelectedFilter('reunião')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2
            ${selectedFilter === 'reunião' 
              ? 'bg-[#0217ff] text-white' 
              : `${cardStyles} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
        >
          <Users size={12} /> Reuniões
        </button>
        <button
          onClick={() => setSelectedFilter('follow-up')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2
            ${selectedFilter === 'follow-up' 
              ? 'bg-[#0217ff] text-white' 
              : `${cardStyles} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
        >
          <MessageSquare size={12} /> Follow-up
        </button>
        <button
          onClick={() => setSelectedFilter('assinatura')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2
            ${selectedFilter === 'assinatura' 
              ? 'bg-[#0217ff] text-white' 
              : `${cardStyles} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
        >
          <FileText size={12} /> Assinaturas
        </button>
      </div>

      {/* VIEW MODE TOGGLE */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-white/10 pb-4">
        <button
          onClick={() => setViewMode('day')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
            ${viewMode === 'day' 
              ? 'bg-[#0217ff] text-white shadow-md' 
              : `${cardStyles} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
        >
          Dia
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
            ${viewMode === 'week' 
              ? 'bg-[#0217ff] text-white shadow-md' 
              : `${cardStyles} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
        >
          Semana
        </button>
        <button
          onClick={() => setViewMode('month')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
            ${viewMode === 'month' 
              ? 'bg-[#0217ff] text-white shadow-md' 
              : `${cardStyles} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
        >
          Mês
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CALENDAR SIDEBAR */}
        <div className={`p-6 rounded-[32px] border ${cardStyles}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">Calendário</h2>
            <div className="flex gap-1">
              <button 
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(currentDate.getMonth() - 1);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(currentDate.getMonth() + 1);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-2xl font-black">
              {format(currentDate, 'MMMM', { locale: ptBR })}
            </div>
            <div className="text-sm text-zinc-500">
              {format(currentDate, 'yyyy', { locale: ptBR })}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[9px] font-black text-zinc-400 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, i) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isSelected = date.toDateString() === currentDate.toDateString();
              const isTodayDate = isToday(date);
              const hasApps = getAppointmentsForDate(date).length > 0;
              
              return (
                <button
                  key={i}
                  onClick={() => setCurrentDate(date)}
                  className={`
                    aspect-square rounded-xl text-sm font-bold flex flex-col items-center justify-center relative transition-all
                    ${!isCurrentMonth ? 'text-zinc-400' : ''}
                    ${isSelected ? 'bg-[#0217ff] text-white shadow-md' : ''}
                    ${isTodayDate && !isSelected ? 'border-2 border-[#0217ff] text-[#0217ff]' : ''}
                    ${!isSelected && !isTodayDate ? 'hover:bg-zinc-100 dark:hover:bg-white/5' : ''}
                  `}
                >
                  {date.getDate()}
                  {hasApps && !isSelected && (
                    <div className="absolute bottom-1.5 w-1.5 h-1.5 bg-[#0217ff] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* APPOINTMENTS SECTION */}
        <div className={`lg:col-span-2 p-6 rounded-[32px] border ${cardStyles}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">
                {viewMode === 'day' ? 'Compromissos do Dia' : viewMode === 'week' ? 'Agenda da Semana' : 'Agenda do Mês'}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {viewMode === 'day' 
                  ? format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                  : viewMode === 'week'
                  ? `${format(weekDaysList[0], 'dd/MM')} - ${format(weekDaysList[6], 'dd/MM/yyyy')}`
                  : format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className="text-sm font-bold text-[#0217ff]">
              {selectedDayApps.length} compromisso{selectedDayApps.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-3">
            {viewMode === 'day' && (
              selectedDayApps.length > 0 ? (
                selectedDayApps.map((app) => {
                  const typeStyle = getAppointmentTypeStyle(app.type);
                  const StatusIcon = typeStyle.icon;
                  return (
                    <div 
                      key={app.id} 
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:border-[#0217ff]/30 transition-all cursor-pointer group"
                      onClick={() => handleViewDetails(app)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${typeStyle.bg}`}>
                            <StatusIcon size={20} className={typeStyle.text} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{app.title}</h3>
                            {app.clientName && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                                <User size={14} />
                                <span>{app.clientName}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-500">
                              <div className="flex items-center gap-1.5">
                                <Clock size={14} className="text-[#0217ff]" />
                                <span>{app.time}{app.endTime && ` - ${app.endTime}`}</span>
                              </div>
                              {app.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={14} className="text-[#0217ff]" />
                                  <span>{app.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(app); }}
                            className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <Edit3 size={16} className="text-zinc-500" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                            className="p-2 hover:bg-red-500/10 rounded-xl transition-colors"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Nenhum compromisso</h3>
                  <p className="text-sm text-zinc-500">Clique em "Novo Compromisso" para agendar</p>
                </div>
              )
            )}

            {viewMode === 'week' && (
              <div className="space-y-6">
                {weekDaysList.map((day, idx) => {
                  const dayApps = getAppointmentsForDate(day);
                  const isTodayDate = isToday(day);
                  const isSelectedDay = day.toDateString() === currentDate.toDateString();
                  
                  return (
                    <div key={idx} className="border-b border-zinc-100 dark:border-white/10 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          isTodayDate ? 'bg-[#0217ff] text-white' : 'bg-zinc-100 dark:bg-white/10'
                        }`}>
                          {format(day, 'dd')}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{weekDays[idx]}</p>
                          <p className="text-[10px] text-zinc-500">{format(day, 'MMMM', { locale: ptBR })}</p>
                        </div>
                        {dayApps.length > 0 && (
                          <span className="ml-auto text-[10px] font-bold text-[#0217ff]">{dayApps.length} comp.</span>
                        )}
                      </div>
                      
                      {dayApps.length > 0 ? (
                        <div className="space-y-2 ml-14">
                          {dayApps.map(app => {
                            const typeStyle = getAppointmentTypeStyle(app.type);
                            return (
                              <div 
                                key={app.id}
                                onClick={() => handleViewDetails(app)}
                                className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${typeStyle.text.replace('text', 'bg')}`} />
                                  <span className="text-xs font-mono text-zinc-500">{app.time}</span>
                                  <span className="font-medium text-sm flex-1">{app.title}</span>
                                  {app.clientName && (
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                      <User size={10} /> {app.clientName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="ml-14 text-xs text-zinc-400 italic py-2">
                          Nenhum compromisso
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((date, idx) => {
                  const dayApps = getAppointmentsForDate(date);
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isSelected = date.toDateString() === currentDate.toDateString();
                  const isTodayDate = isToday(date);
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => setCurrentDate(date)}
                      className={`
                        min-h-[100px] p-2 rounded-xl border cursor-pointer transition-all
                        ${!isCurrentMonth ? 'opacity-40' : ''}
                        ${isSelected ? 'border-[#0217ff] bg-[#0217ff]/5' : 'border-zinc-100 dark:border-white/10 hover:border-[#0217ff]/30'}
                      `}
                    >
                      <div className={`text-sm font-bold mb-2 ${
                        isTodayDate ? 'text-[#0217ff]' : ''
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayApps.slice(0, 2).map(app => {
                          const typeStyle = getAppointmentTypeStyle(app.type);
                          return (
                            <div 
                              key={app.id}
                              className="text-[9px] font-medium truncate flex items-center gap-1"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${typeStyle.text.replace('text', 'bg')}`} />
                              <span>{app.title}</span>
                            </div>
                          );
                        })}
                        {dayApps.length > 2 && (
                          <div className="text-[8px] text-zinc-500 font-bold">
                            +{dayApps.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO - CORRIGIDO: FUNDO BRANCO FIXO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] border border-zinc-200 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0217ff] to-[#00c6ff]" />
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setEditingAppointment(null);
              }} 
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold mb-2 text-zinc-900">
                {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
              </h2>
              <p className="text-sm text-zinc-500 mb-6">Preencha os detalhes do agendamento</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título *</label>
                    <input 
                      required
                      type="text"
                      value={newApp.title}
                      onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      placeholder="Ex: Visita Apartamento Moema"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo *</label>
                    <select
                      value={newApp.type}
                      onChange={(e) => setNewApp({ ...newApp, type: e.target.value as any })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    >
                      <option value="visita">Visita</option>
                      <option value="reunião">Reunião</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="assinatura">Assinatura</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data *</label>
                    <input 
                      required
                      type="date"
                      value={newApp.date}
                      onChange={(e) => setNewApp({ ...newApp, date: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Horário *</label>
                      <input 
                        required
                        type="time"
                        value={newApp.time}
                        onChange={(e) => setNewApp({ ...newApp, time: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Até</label>
                      <input 
                        type="time"
                        value={newApp.endTime}
                        onChange={(e) => setNewApp({ ...newApp, endTime: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome do Cliente</label>
                    <input 
                      type="text"
                      value={newApp.clientName}
                      onChange={(e) => setNewApp({ ...newApp, clientName: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      placeholder="Nome do cliente"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Telefone</label>
                    <input 
                      type="tel"
                      value={newApp.clientPhone}
                      onChange={(e) => setNewApp({ ...newApp, clientPhone: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Local / Endereço</label>
                  <input 
                    type="text"
                    value={newApp.location}
                    onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    placeholder="Endereço do imóvel ou local da reunião"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações</label>
                  <textarea 
                    rows={3}
                    value={newApp.notes}
                    onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all resize-none"
                    placeholder="Detalhes adicionais, instruções, etc..."
                  />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50">
                  <input
                    type="checkbox"
                    id="reminder"
                    checked={newApp.reminder}
                    onChange={(e) => setNewApp({ ...newApp, reminder: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-2 border-zinc-300 accent-[#0217ff]"
                  />
                  <label htmlFor="reminder" className="text-sm font-medium text-zinc-700 cursor-pointer">
                    Enviar lembrete por WhatsApp
                  </label>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-2xl font-black uppercase tracking-wider text-sm hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  {editingAppointment ? <Check size={20} /> : <Plus size={20} />}
                  {editingAppointment ? 'Atualizar Compromisso' : 'Agendar Compromisso'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES - CORRIGIDO: FUNDO BRANCO FIXO */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] border border-zinc-200 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0217ff] to-[#00c6ff]" />
            <button 
              onClick={() => setShowDetailsModal(false)} 
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>

            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${getAppointmentTypeStyle(selectedAppointment.type).bg}`}>
                  {getAppointmentTypeStyle(selectedAppointment.type).icon({ 
                    size: 24, 
                    className: getAppointmentTypeStyle(selectedAppointment.type).text 
                  })}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-zinc-900">{selectedAppointment.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${getAppointmentTypeStyle(selectedAppointment.type).bg} ${getAppointmentTypeStyle(selectedAppointment.type).text}`}>
                      {getAppointmentTypeStyle(selectedAppointment.type).label}
                    </span>
                    {selectedAppointment.status && (
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${getStatusStyle(selectedAppointment.status).bg} ${getStatusStyle(selectedAppointment.status).text}`}>
                        {getStatusStyle(selectedAppointment.status).label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
                  <CalendarIcon size={20} className="text-[#0217ff]" />
                  <div>
                    <p className="text-xs text-zinc-500">Data e Horário</p>
                    <p className="font-medium text-zinc-900">
                      {format(new Date(selectedAppointment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • {selectedAppointment.time}
                      {selectedAppointment.endTime && ` - ${selectedAppointment.endTime}`}
                    </p>
                  </div>
                </div>

                {selectedAppointment.clientName && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
                    <User size={20} className="text-[#0217ff]" />
                    <div>
                      <p className="text-xs text-zinc-500">Cliente</p>
                      <p className="font-medium text-zinc-900">{selectedAppointment.clientName}</p>
                      {selectedAppointment.clientPhone && (
                        <p className="text-sm text-zinc-500">{selectedAppointment.clientPhone}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedAppointment.location && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
                    <MapPin size={20} className="text-[#0217ff]" />
                    <div>
                      <p className="text-xs text-zinc-500">Local</p>
                      <p className="font-medium text-zinc-900">{selectedAppointment.location}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="p-3 rounded-xl bg-zinc-50">
                    <p className="text-xs text-zinc-500 mb-1">Observações</p>
                    <p className="text-sm text-zinc-700">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(selectedAppointment)}
                  className="flex-1 py-4 bg-zinc-100 rounded-2xl font-bold text-sm text-zinc-700 flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                >
                  <Edit3 size={18} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(selectedAppointment.id)}
                  className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                  Excluir
                </button>
                {selectedAppointment.clientPhone && (
                  <a
                    href={`https://wa.me/${selectedAppointment.clientPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
                  >
                    <Send size={18} />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}