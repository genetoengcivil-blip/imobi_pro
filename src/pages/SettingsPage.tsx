import { useState } from 'react';
import { 
  Bell, 
  Lock, 
  Moon, 
  Sun, 
  Shield, 
  AlertTriangle,
  Palette
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

export default function SettingsPage() {
  const { toggleDarkMode, darkMode } = useGlobal();

  const cardStyles = darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Ajustes</h1>
        <p className="text-zinc-500 font-medium">Configure a sua experiência e preferências do sistema.</p>
      </div>

      {/* Appearance Section */}
      <div className={`p-8 rounded-[40px] border ${cardStyles}`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#0217ff]/10 rounded-2xl text-[#0217ff]">
            <Palette className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Aparência do Sistema</h2>
        </div>

        <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-black flex items-center justify-center shadow-sm border border-zinc-200 dark:border-white/10">
              {darkMode ? <Moon className="w-6 h-6 text-[#0217ff]" /> : <Sun className="w-6 h-6 text-amber-500" />}
            </div>
            <div>
              <div className="font-bold text-lg mb-1">Tema Noturno (Modo Escuro)</div>
              <div className="text-sm text-zinc-500">Alterne entre o visual claro ou escuro para descansar a visão.</div>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <button 
            onClick={toggleDarkMode}
            className={`w-16 h-8 rounded-full transition-colors relative shadow-inner ${darkMode ? 'bg-[#0217ff]' : 'bg-zinc-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-md ${darkMode ? 'left-9' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className={`p-8 rounded-[40px] border ${cardStyles}`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#0217ff]/10 rounded-2xl text-[#0217ff]">
            <Bell className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Notificações</h2>
        </div>
        <p className="text-zinc-500 italic mb-6">As configurações de notificações por email e WhatsApp estão a ser implementadas.</p>
      </div>

      {/* Security Section */}
      <div className={`p-8 rounded-[40px] border ${cardStyles}`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#0217ff]/10 rounded-2xl text-[#0217ff]">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Privacidade & Segurança</h2>
        </div>
        <div className="space-y-4">
          <button className="w-full text-left p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:border-[#0217ff]/50 transition-colors flex items-center gap-4">
            <Lock className="w-5 h-5 text-zinc-400" />
            <span className="font-bold">Alterar a minha palavra-passe (Senha)</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={`p-8 rounded-[40px] border border-red-500/20 bg-red-500/5 text-red-500 mt-12`}>
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-lg font-bold">Zona Crítica (Reset de Fábrica)</h2>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-lg">
            <div className="font-bold text-base mb-1">Limpar Dados Locais</div>
            <div className="text-sm opacity-80 leading-relaxed">
              Isto apagará permanentemente todos os seus leads, imóveis e histórico de configurações armazenados no seu navegador. Esta ação não tem volta.
            </div>
          </div>
          <button 
            onClick={() => {
              if (window.confirm('TEM CERTEZA ABSOLUTA? Esta ação apagará TUDO permanentemente.')) {
                localStorage.clear();
                window.location.href = '/';
              }
            }}
            className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-transform active:scale-95 shadow-lg shadow-red-500/20 whitespace-nowrap"
          >
            Apagar Tudo
          </button>
        </div>
      </div>
    </div>
  );
}