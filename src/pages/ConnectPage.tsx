import { useState, useEffect, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { 
  QrCode, RefreshCw, CheckCircle2, AlertCircle, 
  Loader2, Smartphone, ShieldCheck, Zap 
} from 'lucide-react';

export default function ConnectPage() {
  const { user, darkMode } = useGlobal();
  const [status, setStatus] = useState<'loading' | 'disconnected' | 'connected'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lógica para buscar o QR Code ou Status via nossa Edge Function Proxy
  const checkConnection = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { 
          instance: user.id, 
          action: 'status' // Adicionamos uma nova ação no proxy
        }
      });

      if (data?.instance?.state === 'open') {
        setStatus('connected');
        setQrCode(null);
      } else {
        setStatus('disconnected');
        // Se estiver desconectado, tentamos buscar o QR Code
        if (data?.qrcode?.base64) {
          setQrCode(data.qrcode.base64);
        }
      }
    } catch (err) {
      console.error("Erro ao checar conexão:", err);
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 20000); // Checa a cada 20s
    return () => clearInterval(interval);
  }, [checkConnection]);

  const handleRefresh = () => {
    setLoading(true);
    checkConnection();
  };

  const cardClass = `p-8 rounded-[40px] border ${
    darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200 shadow-xl'
  }`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-black italic uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Conexão WhatsApp</h1>
          <p className="text-zinc-500 font-medium">Gerencie sua instância exclusiva e automações.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-[#0217ff] text-white rounded-2xl font-black hover:scale-105 transition-all shadow-lg shadow-[#0217ff]/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />} 
          Atualizar Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CARD DE STATUS */}
        <div className={`md:col-span-2 ${cardClass}`}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-3xl ${status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                <Smartphone size={32} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Status do Dispositivo</div>
                <div className="text-2xl font-black italic uppercase tracking-tight">
                  {status === 'connected' ? 'Conectado' : 'Desconectado'}
                </div>
              </div>
            </div>
            {status === 'connected' && <CheckCircle2 className="text-green-500 w-8 h-8" />}
          </div>

          {status === 'connected' ? (
            <div className="space-y-6">
              <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-3xl">
                <p className="text-green-500 text-sm font-bold italic">
                  Sua instância está operando normalmente. Todas as automações e notificações de leads estão ativas.
                </p>
              </div>
              <button className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">
                Desconectar Dispositivo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-10">
              {qrCode ? (
                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-[32px] inline-block shadow-2xl border-8 border-zinc-100">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-zinc-500 text-sm font-medium max-w-xs mx-auto">
                    Abra o WhatsApp no seu telemóvel, vá em <b>Aparelhos Conectados</b> e aponte a câmera para o código acima.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-[#0217ff] animate-spin" />
                  <p className="text-zinc-500 text-xs font-black uppercase italic">Gerando novo código...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CARD DE INFOS */}
        <div className="space-y-6">
          <div className={`${cardClass} !p-6`}>
            <div className="flex items-center gap-3 mb-4 text-[#0217ff]">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Segurança</span>
            </div>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
              Sua conexão é criptografada e processada em uma instância isolada. Não armazenamos o conteúdo das suas conversas privadas.
            </p>
          </div>

          <div className={`${cardClass} !p-6 bg-[#0217ff] text-white border-none shadow-[#0217ff]/30`}>
            <div className="flex items-center gap-3 mb-4">
              <Zap size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Dica Pro</span>
            </div>
            <p className="text-xs font-bold leading-relaxed italic opacity-90">
              Mantenha o seu telemóvel conectado à internet para garantir que os leads recebam as respostas automáticas instantaneamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}