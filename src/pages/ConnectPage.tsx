import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function ConnectPage() {
  const { user, darkMode } = useGlobal();
  const [status, setStatus] = useState<'loading' | 'disconnected' | 'connected'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  // O TRINCO: Impede fisicamente qualquer loop
  const hasInitialized = useRef(false);

  const checkConnection = async () => {
    // Se não houver utilizador ou se já estivermos a processar, aborta
    if (!user?.id) return;

    setStatus('loading');
    console.log("☎️ A tentar ligar para a função...");

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, action: 'status' }
      });

      if (error) throw error;

      if (data?.instance?.state === 'open') {
        setStatus('connected');
        setQrCode(null);
      } else {
        setStatus('disconnected');
        const base64 = data?.qrcode?.base64 || data?.qrcode;
        setQrCode(base64 || null);
      }
    } catch (err: any) {
      console.error("❌ Erro na Edge Function:", err);
      setStatus('disconnected');
    }
  };

  // ESTE EFEITO CORRE APENAS UMA VEZ
  useEffect(() => {
    if (!hasInitialized.current && user?.id) {
      hasInitialized.current = true;
      checkConnection();
    }
  }, [user?.id]);

  return (
    <div className="max-w-2xl mx-auto p-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Conexão WhatsApp</h1>
        <button 
          onClick={checkConnection}
          className="p-4 bg-[#0217ff] text-white rounded-2xl hover:opacity-90 active:scale-95 transition-all"
        >
          <RefreshCw size={24} className={status === 'loading' ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className={`p-12 rounded-[40px] border-2 flex flex-col items-center justify-center min-h-[400px] ${
        darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-100'
      }`}>
        {status === 'connected' ? (
          <div className="text-center text-green-500 font-black uppercase tracking-tighter">
            <CheckCircle2 size={64} className="mx-auto mb-4" />
            <h2 className="text-3xl">Conectado</h2>
          </div>
        ) : qrCode ? (
          <div className="text-center space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-2xl inline-block border-8 border-zinc-50">
              <img src={qrCode.startsWith('data') ? qrCode : `data:image/png;base64,${qrCode}`} className="w-64 h-64" alt="QR" />
            </div>
            <p className="font-bold text-zinc-500 italic">Leia o código no WhatsApp</p>
          </div>
        ) : (
          <div className="text-center opacity-40">
            <Loader2 size={48} className="animate-spin mx-auto mb-4 text-[#0217ff]" />
            <p className="font-black uppercase text-xs tracking-widest">Aguardando Resposta...</p>
          </div>
        )}
      </div>
    </div>
  );
}