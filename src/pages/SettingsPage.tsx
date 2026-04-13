import { useState, useEffect, useRef } from 'react';
import { 
  Bell, Moon, Sun, Shield, Palette, Globe, Smartphone, Mail, 
  CheckCircle2, Loader2, Eye, EyeOff, Save, KeyRound, 
  Database, Trash2, RefreshCw, ChevronRight, Info, Download, Upload, X
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode, user, leads, properties, transactions, appointments } = useGlobal();
  const [successMessage, setSuccessMessage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status do Servidor (Simulado)
  const [serverStatus] = useState<'operacional' | 'manutencao'>('operacional');

  // Notificações habilitadas por padrão
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    push: true
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ new: '', confirm: '' });

  // Carregar preferências salvas
  useEffect(() => {
    const savedNotifications = localStorage.getItem('imobipro_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Erro ao carregar notificações:', e);
      }
    }
  }, []);

  // --- FUNÇÃO: SALVAR PREFERÊNCIAS ---
  const saveNotifications = () => {
    setSaveLoading(true);
    setTimeout(() => {
      localStorage.setItem('imobipro_notifications', JSON.stringify(notifications));
      setSuccessMessage('Preferências salvas com sucesso!');
      setSaveLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 600);
  };

  // --- FUNÇÃO: EXPORTAR BACKUP JSON (CORRIGIDA) ---
  const handleExportBackup = async () => {
    setLoading(true);
    try {
      // Buscamos os dados mais recentes diretamente do banco para garantir o backup completo
      const [props, lds, trans, apps, conts, prof] = await Promise.all([
        supabase.from('properties').select('*').eq('user_id', user?.id),
        supabase.from('leads').select('*').eq('user_id', user?.id),
        supabase.from('transactions').select('*').eq('user_id', user?.id),
        supabase.from('appointments').select('*').eq('user_id', user?.id),
        supabase.from('contracts').select('*').eq('user_id', user?.id),
        supabase.from('profiles').select('*').eq('id', user?.id).single()
      ]);

      const backupData = {
        app: 'ImobiPro',
        version: '4.5.1',
        date: new Date().toISOString(),
        content: { 
          properties: props.data || [],
          leads: lds.data || [], 
          transactions: trans.data || [], 
          appointments: apps.data || [],
          contracts: conts.data || [],
          profile: prof.data || {}
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_completo_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      setSuccessMessage('Arquivo de backup gerado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert('Erro ao gerar backup completo.');
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO: RESTAURAR VIA ARQUIVO (CORRIGIDA) ---
  const handleRestoreFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    if (!window.confirm('Atenção: Todos os dados atuais (Imóveis, Leads, Contratos e Site) serão substituídos pelos do arquivo. Confirmar?')) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        if (!backup.content) throw new Error("Arquivo inválido");

        const { content } = backup;

        // 1. Limpeza de todas as tabelas
        const tables = ['properties', 'leads', 'transactions', 'appointments', 'contracts'];
        for (const table of tables) {
          await supabase.from(table).delete().eq('user_id', user.id);
        }

        // 2. Inserção dos dados restaurados
        for (const table of tables) {
          const tableData = content[table];
          if (tableData && tableData.length > 0) {
            const dataToInsert = tableData.map((item: any) => {
              const { id, created_at, ...rest } = item;
              return { ...rest, user_id: user.id };
            });
            await supabase.from(table).insert(dataToInsert);
          }
        }

        // 3. Restauração do Perfil/Site
        if (content.profile && Object.keys(content.profile).length > 0) {
          const { id, created_at, ...profileData } = content.profile;
          await supabase.from('profiles').update(profileData).eq('id', user.id);
        }

        setSuccessMessage('Sistema restaurado com sucesso!');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        alert('Erro: O arquivo não é um backup válido ou está corrompido.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- FUNÇÃO: ZERAR SISTEMA (LIMPEZA TOTAL CORRIGIDA) ---
  const handleFullReset = async () => {
    const confirm = window.confirm(
      '⚠️ AVISO FINAL: Isso apagará TODOS os seus leads, imóveis, contratos, financeiro e configurações do site permanentemente.\n\nDeseja continuar?'
    );
    
    if (!confirm) return;

    setLoading(true);
    try {
      if (!user?.id) throw new Error("Sessão expirada.");

      // 1. Limpar Tabelas Operacionais (Incluindo Contratos)
      const tables = ['leads', 'properties', 'transactions', 'appointments', 'contracts'];
      for (const table of tables) {
        await supabase.from(table).delete().eq('user_id', user.id);
      }
      
      // 2. Limpar o Perfil/Site (Reset total dos campos)
      await supabase.from('profiles').update({
        avatar: null,
        logo: null,
        full_name: '',
        slug: '',
        bio: '',
        phone: '',
        creci: '',
        company: '',
        experience: '',
        specialties: '',
        whatsapp_message: '',
        social_media: { instagram: '', facebook: '', youtube: '', linkedin: '' }
      }).eq('id', user.id);

      setSuccessMessage('Sistema zerado com sucesso!');

      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login'; 
      }, 2000);

    } catch (err: any) {
      alert('Erro ao zerar o sistema: ' + err.message);
      setLoading(false);
    }
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-gray-200 shadow-sm',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-gray-500',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    bgHover: darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50',
    inputBg: darkMode ? 'bg-zinc-800 border-white/10' : 'bg-gray-50 border-gray-200'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20 p-4">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${theme.text}`}>Ajustes</h1>
        <p className={`${theme.textMuted} text-sm mt-1`}>Configure sua conta e faça a manutenção dos seus dados</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} /> <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* APARÊNCIA */}
      <div className={`p-6 rounded-3xl border ${theme.card}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#0217ff]/10 text-[#0217ff]"><Palette size={20} /></div>
          <h2 className={`text-lg font-bold ${theme.text}`}>Aparência</h2>
        </div>
        <div className={`flex items-center justify-between p-5 rounded-2xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-50'} border ${theme.border}`}>
          <div className="flex items-center gap-4">
            {darkMode ? <Moon className="text-[#0217ff]" /> : <Sun className="text-amber-500" />}
            <div>
              <p className={`font-bold ${theme.text}`}>Modo Escuro</p>
              <p className={`text-xs ${theme.textMuted}`}>Personalize sua experiência visual</p>
            </div>
          </div>
          <button onClick={toggleDarkMode} className={`w-14 h-8 rounded-full relative transition-all ${darkMode ? 'bg-[#0217ff]' : 'bg-gray-300'}`}>
            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-md ${darkMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* NOTIFICAÇÕES */}
      <div className={`p-6 rounded-3xl border ${theme.card}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#0217ff]/10 text-[#0217ff]"><Bell size={20} /></div>
          <h2 className={`text-lg font-bold ${theme.text}`}>Notificações</h2>
        </div>
        <div className="space-y-3">
          <NotificationItem icon={Mail} title="E-mail" description="Receba alertas e resumos na sua conta" enabled={notifications.email} onToggle={() => setNotifications({...notifications, email: !notifications.email})} darkMode={darkMode} />
          <NotificationItem icon={Smartphone} title="WhatsApp" description="Notificações de novos leads via Zap" enabled={notifications.whatsapp} onToggle={() => setNotifications({...notifications, whatsapp: !notifications.whatsapp})} darkMode={darkMode} />
          <NotificationItem icon={Globe} title="Push Browser" description="Alertas instantâneos no navegador" enabled={notifications.push} onToggle={() => setNotifications({...notifications, push: !notifications.push})} darkMode={darkMode} />
        </div>
        <button onClick={saveNotifications} disabled={saveLoading} className="mt-6 w-full py-4 bg-[#0217ff] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:opacity-90 active:scale-95 transition-all">
          {saveLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar Preferências
        </button>
      </div>

      {/* DADOS E BACKUP */}
      <div className={`p-6 rounded-3xl border ${theme.card}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#0217ff]/10 text-[#0217ff]"><Database size={20} /></div>
          <h2 className={`text-lg font-bold ${theme.text}`}>Dados e Backup</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleExportBackup} disabled={loading} className={`flex items-center gap-4 p-5 rounded-2xl border ${theme.border} ${theme.bgHover} transition-all`}>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><Download size={20} /></div>
            <div className="text-left">
              <p className={`font-bold ${theme.text}`}>Salvar Backup</p>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Exportar tudo (.JSON)</p>
            </div>
          </button>

          <button onClick={() => setShowRestoreModal(true)} disabled={loading} className={`flex items-center gap-4 p-5 rounded-2xl border ${theme.border} ${theme.bgHover} transition-all`}>
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500"><RefreshCw size={20} /></div>
            <div className="text-left">
              <p className={`font-bold ${theme.text}`}>Restaurar Sistema</p>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Gerenciar restauração</p>
            </div>
          </button>
        </div>
      </div>

      {/* INFORMAÇÕES DO SISTEMA */}
      <div className={`p-6 rounded-3xl border ${theme.card}`}>
        <div className="flex items-center gap-3 mb-4">
          <Info size={18} className="text-[#0217ff]" />
          <h2 className={`text-sm font-bold ${theme.text}`}>Informações do Sistema</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className={`flex justify-between py-2 border-b ${theme.border}`}>
            <span className={theme.textMuted}>Versão</span>
            <span className={`font-bold ${theme.text}`}>v4.5.1 PRO</span>
          </div>
          <div className={`flex justify-between py-2 border-b ${theme.border}`}>
            <span className={theme.textMuted}>Servidor</span>
            <span className={`font-bold flex items-center gap-2 ${serverStatus === 'operacional' ? 'text-green-500' : 'text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${serverStatus === 'operacional' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {serverStatus === 'operacional' ? 'Operacional' : 'Em Manutenção'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className={theme.textMuted}>Canal de Suporte</span>
            <a href="mailto:atendimento.imobipro@gmail.com" className="text-[#0217ff] font-bold hover:underline">atendimento.imobipro@gmail.com</a>
          </div>
        </div>
      </div>

      {/* --- MODAL DE RESTAURAÇÃO --- */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className={`w-full max-w-md p-8 rounded-[40px] border ${theme.card} shadow-2xl relative animate-fade-in`}>
            <button onClick={() => setShowRestoreModal(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-red-500"><X size={24} /></button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw size={32} className="text-[#0217ff]" />
              </div>
              <h3 className={`text-xl font-bold ${theme.text}`}>Restaurar Sistema</h3>
              <p className={`text-sm ${theme.textMuted} mt-2`}>Como você deseja proceder?</p>
            </div>

            <div className="space-y-4">
              <button onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center gap-4 p-5 rounded-2xl border ${theme.border} ${theme.bgHover} transition-all`}>
                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Upload size={20} /></div>
                <div className="text-left"><p className={`font-bold ${theme.text}`}>Backup de Sistema</p><p className="text-[10px] text-zinc-500 uppercase">Usar arquivo local (.json)</p></div>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestoreFile} />

              <button onClick={handleFullReset} className="w-full flex items-center gap-4 p-5 rounded-2xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-all">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={20} /></div>
                <div className="text-left"><p className="font-bold text-red-600">Zerar Sistema</p><p className="text-[10px] text-red-400 uppercase">Limpeza total e novo login</p></div>
              </button>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 rounded-[40px] flex flex-col items-center justify-center">
                <Loader2 size={40} className="animate-spin text-[#0217ff] mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-[#0217ff]">Processando...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTE AUXILIAR PARA NOTIFICAÇÕES
function NotificationItem({ icon: Icon, title, description, enabled, onToggle, darkMode }: any) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-50'} border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${darkMode ? 'bg-zinc-900' : 'bg-white'} border shadow-sm`}><Icon size={20} className="text-[#0217ff]" /></div>
        <div>
          <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
          <p className="text-[11px] text-gray-500">{description}</p>
        </div>
      </div>
      <button onClick={onToggle} className={`w-12 h-6 rounded-full relative transition-all ${enabled ? 'bg-[#0217ff]' : 'bg-gray-300 dark:bg-zinc-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${enabled ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}