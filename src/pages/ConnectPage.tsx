import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { QrCode, RefreshCw, CheckCircle2, Loader2, Smartphone } from 'lucide-react';

export default function ConnectPage() {
  const { user, darkMode } = useGlobal();
  const [status, setStatus] = useState<'loading' | 'disconnected' | 'connected'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const isChecking = useRef(false); // Impede chamadas duplas

  const checkConnection = async (isManual = false) => {
    if (isChecking.current || !user?.id) return;
    
    isChecking.current = true;
    if (isManual) setStatus('loading');

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
      console.error("Erro na Edge Function:", err);
      // Se falhar, não damos alerta para não travar o site, apenas mostramos offline
      setStatus('disconnected');
    } finally {
      isChecking.current = false;
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(() => checkConnection(), 15000);
    return () => clearInterval(interval);
  }, [user?.id]); // Só depende do ID do utilizador

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Conexão WhatsApp</h1>
        <button 
          onClick={() => checkConnection(true)} 
          className="p-3 bg-[#0217ff] text-white rounded-xl hover:opacity-80 transition-all"
        >
          <RefreshCw size={20} className={status === 'loading' ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className={`p-10 rounded-[32px] border flex flex-col items-center justify-center min-h-[400px] ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
        {status === 'connected' ? (
          <div className="text-center animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="text-green-500 w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase">Conectado</h2>
          </div>
        ) : qrCode ? (
          <div className="text-center animate-in fade-in duration-500">
            <div className="p-4 bg-white rounded-2xl shadow-xl mb-6 inline-block">
              <img src={qrCode.startsWith('data') ? qrCode : `data:image/png;base64,${qrCode}`} className="w-64 h-64" alt="QR Code" />
            </div>
            <p className="font-bold text-zinc-500">Escaneie para conectar</p>
          </div>
        ) : (
          <div className="text-center opacity-50">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[#0217ff]" />
            <p className="font-black uppercase text-xs tracking-widest">A aguardar servidor...</p>
          </div>
        )}
      </div>
    </div>
  );
}