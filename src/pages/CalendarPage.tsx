import { useState, useMemo } from 'react';
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
  Calendar as CalendarIcon
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Appointment } from '../types';

export default function CalendarPage() {
  const { appointments, addAppointment, deleteAppointment, darkMode } = useGlobal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState<Omit<Appointment, 'id'>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: 'visita',
    notes: ''
  });

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const selectedDayApps = useMemo(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return appointments.filter(a => a.date === dateStr);
  }, [appointments, currentDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAppointment(newApp);
    setIsModalOpen(false);
    setNewApp({
      title: '',
      date: currentDate.toISOString().split('T')[0],
      time: '',
      type: 'visita',
      notes: ''
    });
  };

  const cardStyles = darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900';

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Agenda</h1>
          <p className="text-zinc-500 font-medium">Gerencie suas visitas e compromissos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" />
          Novo Compromisso
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mini Calendar */}
        <div className={`p-8 rounded-[40px] border ${cardStyles}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold uppercase text-xs tracking-widest text-zinc-500">Calendário</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-zinc-400">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((date, i) => {
              const isSelected = date.toDateString() === currentDate.toDateString();
              const hasApps = appointments.some(a => a.date === date.toISOString().split('T')[0]);
              return (
                <button
                  key={i}
                  onClick={() => setCurrentDate(date)}
                  className={`
                    aspect-square rounded-xl text-sm font-bold flex flex-col items-center justify-center relative transition-all
                    ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}
                  `}
                >
                  {date.getDate()}
                  {hasApps && !isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Events */}
        <div className={`lg:col-span-2 p-8 rounded-[40px] border ${cardStyles}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Compromissos do Dia</h2>
            <div className="text-sm font-bold text-blue-500">{currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>

          <div className="space-y-4">
            {selectedDayApps.length > 0 ? (
              selectedDayApps.map((app) => (
                <div key={app.id} className="p-6 rounded-[32px] bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-blue-500/50 transition-colors">
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 text-center min-w-[80px]">
                      <div className="text-blue-600 font-black text-lg">{app.time}</div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{app.type}</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">{app.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{app.time}</span>
                        </div>
                        {app.notes && (
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            <span className="truncate max-w-[200px]">{app.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteAppointment(app.id)}
                      className="p-3 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-zinc-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                </div>
                <h3 className="text-lg font-bold mb-1">Dia livre!</h3>
                <p className="text-sm text-zinc-500">Nenhum compromisso agendado para esta data.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>

            <h2 className="text-2xl font-bold mb-8 dark:text-white">Novo Compromisso</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Título</label>
                <input 
                  required
                  type="text"
                  value={newApp.title}
                  onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500 dark:text-white"
                  placeholder="Ex: Visita Casa Moema"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Hora</label>
                  <input 
                    required
                    type="time"
                    value={newApp.time}
                    onChange={(e) => setNewApp({ ...newApp, time: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Tipo</label>
                  <select
                    value={newApp.type}
                    onChange={(e) => setNewApp({ ...newApp, type: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500 dark:text-white"
                  >
                    <option value="visita">Visita</option>
                    <option value="reunião">Reunião</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="assinatura">Assinatura</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Observações</label>
                <textarea 
                  rows={3}
                  value={newApp.notes}
                  onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500 dark:text-white resize-none"
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
              >
                Agendar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
