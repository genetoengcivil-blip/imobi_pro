import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { RefreshCw, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

export default function ConnectPage() {
  const { user, darkMode } = useGlobal();
  const [status, setStatus] = useState<'idle' | 'loading' | 'disconnected' | 'connected'>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startConnection = async () => {
    if (!user?.id) {
      alert("Erro: Utilizador não identificado. Verifique o login.");
      return;
    }

    setStatus('loading');
    setErrorMsg(null);
    setQrCode(null);
    console.log("🚀 Iniciando pedido MANUAL para:", user.id);

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, action: 'status' }
      });

      if (error) throw error;

      console.log("✅ Resposta recebida:", data);

      if (data?.instance?.state === 'open') {
        setStatus('connected');
      } else {
        setStatus('disconnected');
        const base64 = data?.qrcode?.base64 || data?.qrcode;
        if (base64) setQrCode(base64);
      }
    } catch (err: any) {
      console.error("❌ Falha crítica:", err);
      setErrorMsg("O servidor não respondeu. Verifique se a Edge Function está ativa.");
      setStatus('disconnected');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-10 space-y-8 mt-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">WhatsApp Pro</h1>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">Painel de Controle</p>
      </div>

      <div className={`p-10 rounded-[40px] border-4 flex flex-col items-center justify-center min-h-[400px] transition-all ${
        darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-100 shadow-2xl'
      }`}>
        
        {status === 'idle' && (
          <button 
            onClick={startConnection}
            className="group flex flex-col items-center gap-4 hover:scale-105 transition-all"
          >
            <div className="w-20 h-20 bg-[#0217ff] rounded-full flex items-center justify-center shadow-xl shadow-[#0217ff]/40">
              <RefreshCw size={32} className="text-white group-hover:rotate-180 transition-all duration-500" />
            </div>
            <span className="font-black uppercase italic tracking-tighter text-[#0217ff]">Iniciar Conexão</span>
          </button>
        )}

        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 size={48} className="animate-spin text-[#0217ff] mx-auto" />
            <p className="font-bold text-zinc-400 animate-pulse">A falar com o servidor...</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center space-y-4">
            <CheckCircle2 size={64} className="text-green-500 mx-auto" />
            <h2 className="text-2xl font-black uppercase text-green-500">Conectado!</h2>
            <button onClick={() => setStatus('idle')} className="text-xs font-bold text-zinc-400 underline">Reiniciar</button>
          </div>
        )}

        {status === 'disconnected' && qrCode && (
          <div className="text-center space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-2xl inline-block">
              <img src={qrCode.startsWith('data') ? qrCode : `data:image/png;base64,${qrCode}`} className="w-64 h-64" alt="QR" />
            </div>
            <p className="font-bold text-zinc-500 italic text-sm">Escaneie para ativar a automação</p>
            <button onClick={startConnection} className="text-[10px] font-black uppercase tracking-widest text-[#0217ff]">Gerar Novo</button>
          </div>
        )}

        {errorMsg && (
          <div className="text-center space-y-4 text-red-500">
            <AlertTriangle size={48} className="mx-auto" />
            <p className="font-bold text-sm">{errorMsg}</p>
            <button onClick={startConnection} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase">Tentar de novo</button>
          </div>
        )}
      </div>
    </div>
  );
}