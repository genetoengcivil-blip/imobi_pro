import React, { useState, useMemo, useEffect } from 'react';
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

// Função para formatar telefone
const formatPhoneNumber = (value: string) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
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

  // Dias do mês
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
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
    const styles: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      visita: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: Home, label: 'Visita' },
      reunião: { bg: 'bg-purple-500/10', text: 'text-purple-500', icon: Users, label: 'Reunião' },
      'follow-up': { bg: 'bg-green-500/10', text: 'text-green-500', icon: MessageSquare, label: 'Follow-up' },
      assinatura: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: FileText, label: 'Assinatura' }
    };
    return styles[type] || styles.visita;
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pendente: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Pendente' },
      confirmado: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Confirmado' },
      realizado: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Realizado' },
      cancelado: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Cancelado' }
    };
    return styles[status] || styles.pendente;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newApp.title.trim()) {
      alert('Preencha o título do compromisso');
      return;
    }
    
    if (!newApp.time) {
      alert('Preencha o horário');
      return;
    }
    
    setIsSubmitting(true);
    
    const appointmentToSave = {
      ...newApp,
      id: editingAppointment?.id || Date.now().toString()
    };
    
    try {
      await addAppointment(appointmentToSave);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
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
    } catch (error) {
      console.error('Erro ao salvar compromisso:', error);
      alert('Erro ao salvar compromisso. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
      deleteAppointment(id);
      if (showDetailsModal) setShowDetailsModal(false);
    }
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

  const renderIcon = (IconComponent: any, size: number = 20, className: string = '') => {
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} />;
  };

  const cardStyles = darkMode 
    ? 'bg-zinc-900 border-white/10 text-white' 
    : 'bg-white border-gray-200 text-gray-900 shadow-sm';
  
  const inputStyles = darkMode 
    ? 'bg-zinc-800 border-white/10 text-white placeholder-zinc-500' 
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto p-4 md:p-0">
      {/* MENSAGEM DE SUCESSO */}
      {showSuccessMessage && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="flex items-center gap-3 px-5 py-3 bg-green-500 text-white rounded-xl shadow-lg">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">Compromisso agendado com sucesso!</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0217ff] to-[#00c6ff] rounded-xl flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Agenda</h1>
          </div>
          <p className={`${darkMode ? 'text-zinc-400' : 'text-gray-500'} font-medium mt-1`}>
            Gerencie suas visitas e compromissos
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`} size={18} />
            <input
              type="text"
              placeholder="Buscar compromissos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-11 pr-4 py-3 rounded-xl text-sm ${inputStyles} w-64 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all`}
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
        {[
          { id: 'todos', label: 'Todos', icon: null },
          { id: 'visita', label: 'Visitas', icon: Home },
          { id: 'reunião', label: 'Reuniões', icon: Users },
          { id: 'follow-up', label: 'Follow-up', icon: MessageSquare },
          { id: 'assinatura', label: 'Assinaturas', icon: FileText }
        ].map((filter) => {
          const Icon = filter.icon;
          const isActive = selectedFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2
                ${isActive 
                  ? 'bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white shadow-md' 
                  : `${cardStyles} hover:bg-gray-100 dark:hover:bg-white/10`}`}
            >
              {Icon && <Icon size={12} />}
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* VIEW MODE TOGGLE */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-white/10 pb-4">
        {['day', 'week', 'month'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
              ${viewMode === mode 
                ? 'bg-[#0217ff] text-white shadow-md' 
                : `${cardStyles} hover:bg-gray-100 dark:hover:bg-white/10`}`}
          >
            {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CALENDAR SIDEBAR */}
        <div className={`p-6 rounded-2xl border ${cardStyles}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">Calendário</h2>
            <div className="flex gap-1">
              <button 
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(currentDate.getMonth() - 1);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(currentDate.getMonth() + 1);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
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
                    ${!isSelected && !isTodayDate ? 'hover:bg-gray-100 dark:hover:bg-white/5' : ''}
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
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardStyles}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">
                {viewMode === 'day' ? 'Compromissos do Dia' : viewMode === 'week' ? 'Agenda da Semana' : 'Agenda do Mês'}
              </h2>
              <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'} mt-1`}>
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
                      className="p-5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-[#0217ff]/30 transition-all cursor-pointer group"
                      onClick={() => handleViewDetails(app)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${typeStyle.bg}`}>
                            {renderIcon(StatusIcon, 20, typeStyle.text)}
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.title}</h3>
                            {app.clientName && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <User size={14} />
                                <span>{app.clientName}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
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
                            className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <Edit3 size={16} className="text-gray-500" />
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
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-gray-300 dark:text-zinc-700" />
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nenhum compromisso</h3>
                  <p className="text-sm text-gray-500">Clique em "Novo Compromisso" para agendar</p>
                </div>
              )
            )}

            {viewMode === 'week' && (
              <div className="space-y-6">
                {weekDaysList.map((day, idx) => {
                  const dayApps = getAppointmentsForDate(day);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <div key={idx} className="border-b border-gray-100 dark:border-white/10 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          isTodayDate ? 'bg-[#0217ff] text-white' : 'bg-gray-100 dark:bg-white/10'
                        }`}>
                          {format(day, 'dd')}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{weekDays[idx]}</p>
                          <p className="text-[10px] text-gray-500">{format(day, 'MMMM', { locale: ptBR })}</p>
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
                                className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${typeStyle.text.replace('text', 'bg')}`} />
                                  <span className="text-xs font-mono text-gray-500">{app.time}</span>
                                  <span className={`font-medium text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.title}</span>
                                  {app.clientName && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <User size={10} /> {app.clientName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="ml-14 text-xs text-gray-400 italic py-2">
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
                        ${isSelected ? 'border-[#0217ff] bg-[#0217ff]/5' : 'border-gray-100 dark:border-white/10 hover:border-[#0217ff]/30'}
                      `}
                    >
                      <div className={`text-sm font-bold mb-2 ${
                        isTodayDate ? 'text-[#0217ff]' : darkMode ? 'text-white' : 'text-gray-900'
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
                              <span className={darkMode ? 'text-zinc-300' : 'text-gray-700'}>{app.title}</span>
                            </div>
                          );
                        })}
                        {dayApps.length > 2 && (
                          <div className="text-[8px] text-gray-500 font-bold">
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

      {/* MODAL DE CRIAÇÃO/EDIÇÃO - PREMIUM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0217ff] to-[#00c6ff]" />
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setEditingAppointment(null);
              }} 
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">Preencha os detalhes do agendamento</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título *</label>
                    <input 
                      required
                      type="text"
                      value={newApp.title}
                      onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      placeholder="Ex: Visita Apartamento Moema"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo *</label>
                    <select
                      value={newApp.type}
                      onChange={(e) => setNewApp({ ...newApp, type: e.target.value as any })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data *</label>
                    <input 
                      required
                      type="date"
                      value={newApp.date}
                      onChange={(e) => setNewApp({ ...newApp, date: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Horário *</label>
                      <input 
                        required
                        type="time"
                        value={newApp.time}
                        onChange={(e) => setNewApp({ ...newApp, time: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Até</label>
                      <input 
                        type="time"
                        value={newApp.endTime}
                        onChange={(e) => setNewApp({ ...newApp, endTime: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Cliente</label>
                    <input 
                      type="text"
                      value={newApp.clientName}
                      onChange={(e) => setNewApp({ ...newApp, clientName: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      placeholder="Nome do cliente"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone</label>
                    <input 
                      type="tel"
                      value={newApp.clientPhone}
                      onChange={(e) => setNewApp({ ...newApp, clientPhone: formatPhoneNumber(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Local / Endereço</label>
                  <input 
                    type="text"
                    value={newApp.location}
                    onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    placeholder="Endereço do imóvel ou local da reunião"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações</label>
                  <textarea 
                    rows={3}
                    value={newApp.notes}
                    onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all resize-none"
                    placeholder="Detalhes adicionais, instruções, etc..."
                  />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
                  <input
                    type="checkbox"
                    id="reminder"
                    checked={newApp.reminder}
                    onChange={(e) => setNewApp({ ...newApp, reminder: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 accent-[#0217ff]"
                  />
                  <label htmlFor="reminder" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Enviar lembrete por WhatsApp
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-xl font-black uppercase tracking-wider text-sm hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    editingAppointment ? <Check size={20} /> : <Plus size={20} />
                  )}
                  {isSubmitting ? 'Salvando...' : (editingAppointment ? 'Atualizar Compromisso' : 'Agendar Compromisso')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES - PREMIUM */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0217ff] to-[#00c6ff]" />
            <button 
              onClick={() => setShowDetailsModal(false)} 
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-4 rounded-xl ${getAppointmentTypeStyle(selectedAppointment.type).bg}`}>
                  {renderIcon(getAppointmentTypeStyle(selectedAppointment.type).icon, 24, getAppointmentTypeStyle(selectedAppointment.type).text)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedAppointment.title}</h2>
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
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <CalendarIcon size={20} className="text-[#0217ff]" />
                  <div>
                    <p className="text-xs text-gray-500">Data e Horário</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(selectedAppointment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • {selectedAppointment.time}
                      {selectedAppointment.endTime && ` - ${selectedAppointment.endTime}`}
                    </p>
                  </div>
                </div>

                {selectedAppointment.clientName && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <User size={20} className="text-[#0217ff]" />
                    <div>
                      <p className="text-xs text-gray-500">Cliente</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.clientName}</p>
                      {selectedAppointment.clientPhone && (
                        <p className="text-sm text-gray-500">{formatPhoneNumber(selectedAppointment.clientPhone)}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedAppointment.location && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <MapPin size={20} className="text-[#0217ff]" />
                    <div>
                      <p className="text-xs text-gray-500">Local</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.location}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Observações</p>
                    <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(selectedAppointment)}
                  className="flex-1 py-4 bg-gray-100 rounded-xl font-bold text-sm text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                >
                  <Edit3 size={18} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(selectedAppointment.id)}
                  className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                  Excluir
                </button>
                {selectedAppointment.clientPhone && (
                  <a
                    href={`https://wa.me/${selectedAppointment.clientPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-4 bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
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
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}