import { useState, useEffect, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { QrCode, RefreshCw, CheckCircle2, Loader2, ShieldCheck, Zap } from 'lucide-react';

export default function ConnectPage() {
  const { user, darkMode } = useGlobal();
  const [status, setStatus] = useState<'loading' | 'disconnected' | 'connected'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, action: 'status' }
      });

      if (data?.instance?.state === 'open') {
        setStatus('connected');
        setQrCode(null);
      } else {
        setStatus('disconnected');
        if (data?.qrcode?.base64) setQrCode(data.qrcode.base64);
      }
    } catch (err) {
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 20000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Conexão WhatsApp</h1>
          <p className="text-zinc-500 font-medium">Gestão da Instância Oficial.</p>
        </div>
        <button onClick={() => { setLoading(true); checkConnection(); }} className="flex items-center gap-2 px-6 py-3 bg-[#0217ff] text-white rounded-2xl font-black">
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Atualizar
        </button>
      </div>

      <div className={`p-8 rounded-[40px] border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200'} text-center`}>
        {status === 'connected' ? (
          <div className="py-10">
            <CheckCircle2 className="text-green-500 w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase text-green-500">Dispositivo Conectado</h2>
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center">
            {qrCode ? (
              <div className="p-4 bg-white rounded-3xl shadow-2xl mb-4">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <Loader2 className="w-12 h-12 text-[#0217ff] animate-spin mb-4" />
            )}
            <p className="text-zinc-500 font-medium">Escaneie o QR Code com o seu WhatsApp.</p>
          </div>
        )}
      </div>
    </div>
  );
}