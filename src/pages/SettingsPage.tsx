import { useState, useEffect } from 'react';
import { 
  Bell, 
  Lock, 
  Moon, 
  Sun, 
  Shield, 
  AlertTriangle,
  Palette,
  Globe,
  Smartphone,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  User,
  Database,
  Trash2,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode, user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Estados para notificações
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: false,
    push: true
  });
  
  // Estados para segurança
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Carregar configurações do localStorage
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

  // Salvar configurações de notificações
  const saveNotifications = () => {
    localStorage.setItem('imobipro_notifications', JSON.stringify(notifications));
    setSuccessMessage('Configurações de notificações salvas!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Alterar senha
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setLoading(true);

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError('Preencha todos os campos');
      setLoading(false);
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('As senhas não conferem');
      setLoading(false);
      return;
    }

    if (passwordData.new.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;

      setPasswordSuccess('Senha alterada com sucesso!');
      setPasswordData({ current: '', new: '', confirm: '' });
      setShowPasswordForm(false);
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error: any) {
      setPasswordError(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  // Limpar dados locais
  const handleClearLocalData = () => {
    if (window.confirm('⚠️ TEM CERTEZA ABSOLUTA?\n\nEsta ação apagará permanentemente todos os seus leads, imóveis, transações e histórico armazenados localmente. Esta ação não pode ser desfeita.')) {
      const keysToRemove = [
        'imobipro_leads',
        'imobipro_properties',
        'imobipro_transactions',
        'imobipro_appointments',
        'imobipro_notifications'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      setSuccessMessage('Dados locais apagados com sucesso! A página será recarregada...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  // Resetar todas as configurações
  const handleResetAllSettings = () => {
    if (window.confirm('Deseja resetar todas as configurações para o padrão?')) {
      localStorage.removeItem('imobipro_notifications');
      setNotifications({ email: true, whatsapp: false, push: true });
      setSuccessMessage('Configurações resetadas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-gray-500',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    bgHover: darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50',
    inputBg: darkMode ? 'bg-zinc-800 border-white/10' : 'bg-gray-50 border-gray-200'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20 p-4 md:p-0">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${theme.text}`}>Ajustes</h1>
        <p className={`${theme.textMuted} text-sm mt-1`}>Configure sua experiência e preferências do sistema</p>
      </div>

      {/* MENSAGENS DE FEEDBACK */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2 animate-fade-in">
          <XCircle size={18} />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* APARÊNCIA */}
      <div className={`p-6 rounded-2xl border ${theme.card} shadow-sm`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#0217ff]/10 text-[#0217ff]">
            <Palette size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${theme.text}`}>Aparência</h2>
            <p className={`text-xs ${theme.textMuted}`}>Personalize o visual do sistema</p>
          </div>
        </div>

        <div className={`flex items-center justify-between p-5 rounded-xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-50'} border ${theme.border}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm border ${theme.border} ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              {darkMode ? <Moon size={22} className="text-[#0217ff]" /> : <Sun size={22} className="text-amber-500" />}
            </div>
            <div>
              <div className={`font-bold ${theme.text}`}>Modo Escuro</div>
              <p className={`text-xs ${theme.textMuted}`}>Alterne entre o visual claro ou escuro</p>
            </div>
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className={`w-14 h-8 rounded-full transition-all relative shadow-sm ${darkMode ? 'bg-[#0217ff]' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-md ${darkMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* NOTIFICAÇÕES */}
      <div className={`p-6 rounded-2xl border ${theme.card} shadow-sm`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#0217ff]/10 text-[#0217ff]">
            <Bell size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${theme.text}`}>Notificações</h2>
            <p className={`text-xs ${theme.textMuted}`}>Configure como deseja receber alertas</p>
          </div>
        </div>

        <div className="space-y-4">
          <NotificationItem
            icon={Mail}
            title="E-mail"
            description="Receba novidades e atualizações por e-mail"
            enabled={notifications.email}
            onToggle={() => setNotifications({ ...notifications, email: !notifications.email })}
            darkMode={darkMode}
          />
          <NotificationItem
            icon={Smartphone}
            title="WhatsApp"
            description="Receba alertas de novos leads no WhatsApp"
            enabled={notifications.whatsapp}
            onToggle={() => setNotifications({ ...notifications, whatsapp: !notifications.whatsapp })}
            darkMode={darkMode}
          />
          <NotificationItem
            icon={Globe}
            title="Push Browser"
            description="Notificações instantâneas no navegador"
            enabled={notifications.push}
            onToggle={() => setNotifications({ ...notifications, push: !notifications.push })}
            darkMode={darkMode}
          />
        </div>

        <button
          onClick={saveNotifications}
          className="mt-6 w-full py-3 bg-[#0217ff] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0217ff]/90 transition-all"
        >
          <Save size={16} /> Salvar Preferências
        </button>
      </div>

      {/* SEGURANÇA */}
      <div className={`p-6 rounded-2xl border ${theme.card} shadow-sm`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#0217ff]/10 text-[#0217ff]">
            <Shield size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${theme.text}`}>Segurança</h2>
            <p className={`text-xs ${theme.textMuted}`}>Gerencie sua senha e segurança da conta</p>
          </div>
        </div>

        {/* Informações do Usuário */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-50'} border ${theme.border} mb-4`}>
          <div className="flex items-center gap-3">
            <User size={18} className="text-[#0217ff]" />
            <div>
              <p className={`text-xs ${theme.textMuted}`}>E-mail da conta</p>
              <p className={`font-medium ${theme.text}`}>{user?.email || 'carregando...'}</p>
            </div>
          </div>
        </div>

        {/* Botão Alterar Senha */}
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl border ${theme.border} ${theme.bgHover} transition-all"
          >
            <div className="flex items-center gap-3">
              <KeyRound size={18} className="text-[#0217ff]" />
              <div className="text-left">
                <p className={`font-medium ${theme.text}`}>Alterar Senha</p>
                <p className={`text-xs ${theme.textMuted}`}>Mantenha sua conta segura</p>
              </div>
            </div>
            <ChevronRight size={18} className={theme.textMuted} />
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-green-500/10 text-green-500 text-sm">
                {passwordSuccess}
              </div>
            )}
            
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Senha atual"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} border ${theme.border} focus:border-[#0217ff] focus:outline-none ${theme.text}`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showCurrentPassword ? <EyeOff size={18} className={theme.textMuted} /> : <Eye size={18} className={theme.textMuted} />}
              </button>
            </div>
            
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Nova senha (mín. 6 caracteres)"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} border ${theme.border} focus:border-[#0217ff] focus:outline-none ${theme.text}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showNewPassword ? <EyeOff size={18} className={theme.textMuted} /> : <Eye size={18} className={theme.textMuted} />}
              </button>
            </div>
            
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar nova senha"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} border ${theme.border} focus:border-[#0217ff] focus:outline-none ${theme.text}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff size={18} className={theme.textMuted} /> : <Eye size={18} className={theme.textMuted} />}
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#0217ff] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0217ff]/90 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ current: '', new: '', confirm: '' });
                  setPasswordError('');
                }}
                className="px-5 py-3 rounded-xl border ${theme.border} ${theme.textMuted} hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* DADOS E BACKUP */}
      <div className={`p-6 rounded-2xl border ${theme.card} shadow-sm`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#0217ff]/10 text-[#0217ff]">
            <Database size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${theme.text}`}>Dados e Backup</h2>
            <p className={`text-xs ${theme.textMuted}`}>Gerencie seus dados locais</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResetAllSettings}
            className="w-full flex items-center justify-between p-4 rounded-xl border ${theme.border} ${theme.bgHover} transition-all"
          >
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="text-amber-500" />
              <div className="text-left">
                <p className={`font-medium ${theme.text}`}>Resetar Configurações</p>
                <p className={`text-xs ${theme.textMuted}`}>Restaura as configurações padrão</p>
              </div>
            </div>
            <ChevronRight size={18} className={theme.textMuted} />
          </button>

          <button
            onClick={handleClearLocalData}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-red-500" />
              <div className="text-left">
                <p className="font-medium text-red-500">Limpar Dados Locais</p>
                <p className="text-xs text-red-400/70">Remove todos os dados salvos no navegador</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* ZONA CRÍTICA */}
      <div className={`p-6 rounded-2xl border border-red-500/20 bg-red-500/5`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={20} className="text-red-500" />
          <h2 className={`text-lg font-bold text-red-500`}>Zona Crítica</h2>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <p className="font-medium text-red-600 dark:text-red-400 mb-1">Reset de Fábrica</p>
            <p className="text-sm text-red-500/70 dark:text-red-400/70">
              Apaga permanentemente todos os seus dados locais. Esta ação não pode ser desfeita.
            </p>
          </div>
          <button
            onClick={handleClearLocalData}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all whitespace-nowrap shadow-lg shadow-red-500/20"
          >
            Apagar Todos os Dados
          </button>
        </div>
      </div>

      {/* INFORMAÇÕES DO SISTEMA */}
      <div className={`p-6 rounded-2xl border ${theme.card} shadow-sm`}>
        <div className="flex items-center gap-3 mb-4">
          <Info size={18} className="text-[#0217ff]" />
          <h2 className={`text-sm font-bold ${theme.text}`}>Informações do Sistema</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b ${theme.border}">
            <span className={theme.textMuted}>Versão</span>
            <span className={theme.text}>ImobiPro v3.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b ${theme.border}">
            <span className={theme.textMuted}>Última atualização</span>
            <span className={theme.text}>Março 2025</span>
          </div>
          <div className="flex justify-between py-2">
            <span className={theme.textMuted}>Suporte</span>
            <a href="atendimento.imobipro@gmail.com" className="text-[#0217ff] hover:underline">atendimento.imobipro@gmail.com</a>
          </div>
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Componente de Item de Notificação
function NotificationItem({ icon: Icon, title, description, enabled, onToggle, darkMode }: any) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-50'} border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white'} shadow-sm`}>
          <Icon size={18} className="text-[#0217ff]" />
        </div>
        <div>
          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
          <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{description}</p>
        </div>
      </div>
      
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative ${enabled ? 'bg-[#0217ff]' : 'bg-gray-300 dark:bg-zinc-600'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${enabled ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}