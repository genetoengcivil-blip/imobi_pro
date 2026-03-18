import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { RefreshCw, CheckCircle2, Loader2, Smartphone, AlertTriangle } from 'lucide-react';

export default function ConnectPage() {
  const { user, darkMode } = useGlobal();
  const [status, setStatus] = useState<'loading' | 'disconnected' | 'connected'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // O TRINCO: Impede o loop infinito de pedidos
  const isBusy = useRef(false);

  const checkConnection = async (forceLoading = false) => {
    if (isBusy.current || !user?.id) return;
    
    isBusy.current = true;
    if (forceLoading) setStatus('loading');
    setErrorMsg(null);

    console.log("🚀 A verificar conexão para:", user.id);

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
      console.error("❌ Erro na função:", err);
      setErrorMsg("O servidor demorou a responder. Tente novamente.");
      setStatus('disconnected');
    } finally {
      isBusy.current = false;
    }
  };

  // Efeito limpo: corre uma vez ao entrar e a cada 20s
  useEffect(() => {
    checkConnection();
    const timer = setInterval(() => checkConnection(), 20000);
    return () => clearInterval(timer);
  }, [user?.id]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Conexão</h1>
        <button 
          onClick={() => checkConnection(true)}
          disabled={status === 'loading'}
          className="p-4 bg-[#0217ff] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw size={24} className={status === 'loading' ? 'animate-spin' : ''} />
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 font-bold text-sm">
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      <div className={`p-12 rounded-[40px] border flex flex-col items-center justify-center min-h-[450px] transition-all ${
        darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-100 shadow-xl'
      }`}>
        {status === 'connected' ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase text-green-500">WhatsApp Conectado</h2>
            <p className="text-zinc-500 font-medium">Tudo pronto para enviar mensagens.</p>
          </div>
        ) : qrCode ? (
          <div className="text-center space-y-6">
            <div className="p-6 bg-white rounded-[32px] shadow-2xl inline-block border-8 border-zinc-50">
              <img src={qrCode.startsWith('data') ? qrCode : `data:image/png;base64,${qrCode}`} className="w-64 h-64" alt="QR Code" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black italic uppercase tracking-tighter">Escaneie o código</p>
              <p className="text-sm text-zinc-500 font-medium">Abra o WhatsApp {'>'} Aparelhos Conectados</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 opacity-40">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#0217ff]" />
            <p className="font-black uppercase text-xs tracking-[0.2em]">A estabelecer ponte...</p>
          </div>
        )}
      </div>
    </div>
  );
}