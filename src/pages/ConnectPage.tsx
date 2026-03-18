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

  // Lógica de verificação robusta com alertas de erro
  const checkConnection = useCallback(async () => {
    // SE JÁ ESTIVER A CARREGAR, NÃO FAZ NADA (O CADEADO)
    if (loading || !user?.id) return;

    setLoading(true);
    console.log("Iniciando verificação para:", user.id);
    
    try {
      // Usamos um timeout manual no frontend para não deixar o navegador "desistir" sozinho
      const { data, error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, action: 'status' }
      });

      if (error) {
        // Se for um erro de "Abort", ignoramos porque foi apenas o sistema a limpar pedidos velhos
        if (error.message?.includes('Abort')) return;
        throw error;
      }

      if (data?.status === 'creating') {
        setStatus('disconnected');
        setQrCode(null); // Instância está a ser criada, aguarde
      } else if (data?.instance?.state === 'open') {
        setStatus('connected');
        setQrCode(null);
      } else {
        setStatus('disconnected');
        const base64 = data?.qrcode?.base64 || data?.qrcode;
        if (base64) setQrCode(base64);
      }
    } catch (err: any) {
      console.error("Erro real detetado:", err);
      // Só mostramos o alerta se não for um erro de cancelamento automático
      if (!err.message?.includes('Abort')) {
        alert("Erro de conexão. Tente atualizar a página em 5 segundos.");
      }
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  // Executa ao abrir a página e a cada 20 segundos
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 20000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Estilos globais dos cards
  const cardClass = `p-8 rounded-[40px] border transition-all duration-300 ${
    darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200'
  }`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 p-6">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Conexão WhatsApp</h1>
          <p className="text-zinc-500 font-medium">Gestão da Instância Oficial.</p>
        </div>
        <button 
          onClick={() => { setLoading(true); checkConnection(); }} 
          className="flex items-center gap-2 px-6 py-3 bg-[#0217ff] text-white rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#0217ff]/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ÁREA CENTRAL (QR CODE OU STATUS) */}
        <div className={`md:col-span-2 ${cardClass} flex flex-col items-center justify-center min-h-[400px]`}>
          {status === 'connected' ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-green-500 w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-green-500">Conectado</h2>
              <p className="text-zinc-500 font-medium">O seu dispositivo está perfeitamente sincronizado e pronto a usar.</p>
            </div>
          ) : (
            <div className="text-center space-y-6 flex flex-col items-center">
              {qrCode ? (
                <div className="animate-fade-in flex flex-col items-center">
                  <div className="p-4 bg-white rounded-3xl shadow-2xl mb-6">
                    <img 
                      src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`} 
                      alt="QR Code do WhatsApp" 
                      className="w-64 h-64 object-contain" 
                    />
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Aguardando Conexão</h3>
                  <p className="text-zinc-500 font-medium max-w-sm mt-2">
                    Abra o WhatsApp no seu telemóvel, vá a "Aparelhos Conectados" e escaneie este código.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                  <Loader2 className="w-16 h-16 text-[#0217ff] animate-spin mb-6" />
                  <p className="text-zinc-500 text-sm font-black uppercase italic tracking-widest">
                    A comunicar com o servidor...
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-2">(Se demorar muito, verifique os alertas no ecrã)</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUNA DE INFORMAÇÕES */}
        <div className="space-y-6">
          <div className={`${cardClass} !p-6`}>
            <div className="flex items-center gap-3 mb-4 text-[#0217ff]">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Segurança</span>
            </div>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
              A sua conexão é encriptada e processada numa instância isolada. Não armazenamos o conteúdo das suas conversas privadas.
            </p>
          </div>

          <div className={`${cardClass} !p-6 bg-[#0217ff] text-white border-none shadow-xl shadow-[#0217ff]/30`}>
            <div className="flex items-center gap-3 mb-4">
              <Zap size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Dica Pro</span>
            </div>
            <p className="text-xs font-bold leading-relaxed italic opacity-90">
              Mantenha o seu telemóvel sempre ligado à internet para garantir que as automações e mensagens não sofrem atrasos no envio.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}