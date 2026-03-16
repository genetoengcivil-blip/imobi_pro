import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔒 CONFIGURAÇÕES
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { user, leads, messages, addMessage, markAsRead, whatsappConnected, setWhatsappConnected, darkMode } = useGlobal();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const theme = {
    bgApp: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    bgCard: darkMode ? 'bg-black' : 'bg-white',
    bgSidebar: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    border: darkMode ? 'border-white/5' : 'border-zinc-200',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    textMuted: darkMode ? 'text-zinc-500' : 'text-zinc-500',
    inputBg: darkMode ? 'bg-black' : 'bg-white',
    msgSentBg: 'bg-[#0217ff]',
    msgReceivedBg: darkMode ? 'bg-zinc-900' : 'bg-white',
  };

  const activeMessages = useMemo(() => {
    if (!selectedLead) return [];
    return (messages || []).filter((m: any) => m.leadId === selectedLead.id);
  }, [messages, selectedLead]);

  useEffect(() => {
    if (selectedLead) markAsRead(selectedLead.id);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead, activeMessages, markAsRead]);

  // ✅ FUNÇÃO PARA TESTAR O PROXY
  const testProxy = async () => {
    try {
      console.log('Testando proxy...');
      const res = await fetch(`${EVO_URL}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      console.log('Status da resposta:', res.status);
      const text = await res.text();
      console.log('Resposta (primeiros 100 caracteres):', text.substring(0, 100));
      
      try {
        const data = JSON.parse(text);
        console.log('Proxy funcionando! Instâncias:', data);
        return data;
      } catch (e) {
        console.error('Resposta não é JSON:', text);
        return null;
      }
    } catch (error) {
      console.error('Erro no teste:', error);
    }
  };

  // ✅ VERIFICAR STATUS DA INSTÂNCIA
  useEffect(() => {
    testProxy();
    
    const checkInstance = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/fetchInstances`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        
        if (res.ok) {
          const text = await res.text();
          try {
            const instances = JSON.parse(text);
            console.log('Instâncias:', instances);
            
            const instance = instances.find((i: any) => 
              i.instance?.instanceName === INSTANCE_NAME
            );
            
            if (instance?.instance?.status === 'open') {
              setWhatsappConnected(true);
            }
          } catch (e) {
            console.error('Resposta não é JSON:', text);
          }
        }
      } catch (error) {
        console.error('Erro:', error);
      }
    };
    
    checkInstance();
  }, []);

  const startConnectionWatcher = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.instance?.state === 'open' || data.instance?.status === 'open') {
            clearInterval(interval);
            setWhatsappConnected(true);
            setConnectionStatus('disconnected');
          }
        }
      } catch (e) {}
    }, 3000);
    
    setTimeout(() => clearInterval(interval), 120000);
  };

  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setErrorMessage(null);
    setQrCodeBase64(null);
    setIsLoading(true);

    try {
      console.log('Tentando conectar...');
      
      const connectRes = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      const responseText = await connectRes.text();
      console.log('Resposta bruta:', responseText);
      
      if (connectRes.ok) {
        try {
          const connectData = JSON.parse(responseText);
          
          if (connectData.base64) {
            setQrCodeBase64(connectData.base64);
            setConnectionStatus('waiting_scan');
            startConnectionWatcher();
          } else if (connectData.status === 'open') {
            setWhatsappConnected(true);
          } else {
            setErrorMessage('Instância existe mas não gerou QR Code');
          }
        } catch (e) {
          setErrorMessage('Resposta inválida do servidor');
        }
      } else {
        setErrorMessage(`Erro ${connectRes.status}: Servidor não respondeu`);
      }
      
    } catch (error: any) {
      console.error("Erro:", error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if(window.confirm("Desconectar WhatsApp?")) {
      try {
        await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
          method: 'DELETE',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        setWhatsappConnected(false);
        setConnectionStatus('disconnected');
        setQrCodeBase64(null);
      } catch (e) {}
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !selectedLead.phone) return;

    const messageText = newMessage;
    setNewMessage('');
    addMessage(selectedLead.id, messageText, 'sent');

    try {
      const cleanPhone = selectedLead.phone.replace(/\D/g, '');
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVO_GLOBAL_KEY
        },
        body: JSON.stringify({
          number: `55${cleanPhone}`,
          text: messageText,
          delay: 1200
        })
      });
    } catch (error) {}
  };

  if (!whatsappConnected) {
    return (
      <div className={`p-8 pb-32 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-sans ${theme.textMain}`}>
        <div className={`w-full max-w-4xl flex flex-col md:flex-row items-center gap-12 ${theme.bgCard} p-12 rounded-[48px] border ${theme.border} shadow-2xl`}>
          <div className="flex-1 space-y-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="text-emerald-500" size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Conecte o <span className="text-emerald-500">WhatsApp</span></h1>
              <p className={`${theme.textMuted} font-medium text-lg leading-relaxed`}>
                Sincronize o seu WhatsApp com o CRM.
              </p>
              {errorMessage && (
                <div className="mt-4 p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className={`w-full md:w-[400px] aspect-square rounded-[32px] border-2 border-dashed ${connectionStatus === 'waiting_scan' ? 'border-emerald-500/50 bg-emerald-500/5' : theme.border} flex flex-col items-center justify-center p-8 relative`}>
            {connectionStatus === 'disconnected' && (
              <div className="text-center space-y-6">
                <QrCode size={64} className={`${theme.textMuted} mx-auto opacity-50`} />
                <button 
                  onClick={handleGenerateQR} 
                  disabled={isLoading}
                  className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Conectando...' : 'Gerar QR Code'}
                </button>
              </div>
            )}

            {connectionStatus === 'generating' && (
              <div className="text-center space-y-4">
                <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto" />
                <p className="font-black text-[10px] animate-pulse">Obtendo QR Code...</p>
              </div>
            )}

            {connectionStatus === 'waiting_scan' && qrCodeBase64 && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-xl">
                  <img src={qrCodeBase64} alt="QR Code" className="w-56 h-56" />
                </div>
                <p className="text-emerald-500 font-black text-[10px]">Aguardando Leitura...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Resto do código do chat (igual ao anterior)
  return (
    <div className={`h-[calc(100vh-80px)] flex animate-fade-in font-sans ${theme.textMain}`}>
      {/* ... (manter o código do chat igual) ... */}
    </div>
  );
}