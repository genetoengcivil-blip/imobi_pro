import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔒 CONFIGURAÇÕES DO SERVIDOR ORACLE - CORRIGIDAS
const EVO_URL = "https://api.imobi-pro.com"; // URL com HTTPS
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

  // ✅ VERIFICAR STATUS DA INSTÂNCIA AO CARREGAR
  useEffect(() => {
    const checkInstance = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/fetchInstances`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        
        if (res.ok) {
          const instances = await res.json();
          const instance = instances.find((i: any) => 
            i.instance?.instanceName === INSTANCE_NAME || i.instanceName === INSTANCE_NAME
          );
          
          if (instance?.instance?.status === 'open' || instance?.status === 'open') {
            setWhatsappConnected(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar instância:', error);
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
          if (data.instance?.state === 'open' || data.instance?.status === 'open' || data.state === 'open') {
            clearInterval(interval);
            setWhatsappConnected(true);
            setConnectionStatus('disconnected');
          }
        }
      } catch (e) {
        console.error('Erro no watcher:', e);
      }
    }, 3000);
    
    setTimeout(() => clearInterval(interval), 120000);
  };

  // ✅ FUNÇÃO CORRIGIDA PARA GERAR QR CODE
  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setErrorMessage(null);
    setQrCodeBase64(null);
    setIsLoading(true);

    try {
      // 1. TENTA CONECTAR NA INSTÂNCIA EXISTENTE
      console.log('Tentando conectar na instância:', INSTANCE_NAME);
      
      const connectRes = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      if (connectRes.ok) {
        const connectData = await connectRes.json();
        console.log('Resposta do connect:', connectData);
        
        if (connectData.base64) {
          setQrCodeBase64(connectData.base64);
          setConnectionStatus('waiting_scan');
          startConnectionWatcher();
          setIsLoading(false);
          return;
        } else if (connectData.status === 'open' || connectData.instance?.status === 'open') {
          setWhatsappConnected(true);
          setIsLoading(false);
          return;
        }
      }

      // 2. SE NÃO CONSEGUIU CONECTAR, CRIA NOVA INSTÂNCIA
      console.log('Criando nova instância...');
      
      const createRes = await fetch(`${EVO_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVO_GLOBAL_KEY
        },
        body: JSON.stringify({
          instanceName: INSTANCE_NAME,
          qrcode: true
        })
      });
      
      if (!createRes.ok) {
        const errorText = await createRes.text();
        throw new Error(`Erro ao criar instância (${createRes.status}): ${errorText}`);
      }
      
      const createData = await createRes.json();
      console.log('Resposta da criação:', createData);
      
      if (createData.qrcode?.base64) {
        setQrCodeBase64(createData.qrcode.base64);
        setConnectionStatus('waiting_scan');
        startConnectionWatcher();
      } else {
        throw new Error("QR Code não foi gerado pela API");
      }
      
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      setErrorMessage(error.message || "Erro ao conectar com o servidor");
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if(window.confirm("Tem certeza que deseja desconectar o WhatsApp?")) {
      try {
        await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
          method: 'DELETE',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        setWhatsappConnected(false);
        setConnectionStatus('disconnected');
        setQrCodeBase64(null);
      } catch (e) {
        console.error('Erro ao desconectar:', e);
      }
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
      const response = await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
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

      if (!response.ok) {
        console.error("Erro ao enviar mensagem:", await response.text());
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
    }
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
                Sincronize o seu WhatsApp com o CRM. Leia o QR Code e centralize o seu atendimento de forma automática.
              </p>
              {errorMessage && (
                <div className="mt-4 p-4 bg-red-500/10 text-red-500 rounded-2xl text-[11px] font-mono border border-red-500/20 break-words">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className={`w-full md:w-[400px] aspect-square rounded-[32px] border-2 border-dashed ${connectionStatus === 'waiting_scan' ? 'border-emerald-500/50 bg-emerald-500/5' : theme.border} flex flex-col items-center justify-center p-8 relative transition-all`}>
            {connectionStatus === 'disconnected' && (
              <div className="text-center space-y-6">
                <QrCode size={64} className={`${theme.textMuted} mx-auto opacity-50`} />
                <button 
                  onClick={handleGenerateQR} 
                  disabled={isLoading}
                  className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isLoading ? 'Processando...' : 'Gerar QR Code'}
                </button>
              </div>
            )}

            {connectionStatus === 'generating' && (
              <div className="text-center space-y-4">
                <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto" />
                <p className="font-black uppercase tracking-widest text-[10px] animate-pulse">Consultando servidor...</p>
              </div>
            )}

            {connectionStatus === 'waiting_scan' && qrCodeBase64 && (
              <div className="text-center space-y-4 animate-in zoom-in duration-500">
                <div className="bg-white p-4 rounded-2xl shadow-xl inline-block">
                  <img src={qrCodeBase64} alt="QR Code" className="w-56 h-56" />
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-500">
                  <Loader2 size={16} className="animate-spin" />
                  <p className="font-black uppercase tracking-widest text-[10px]">Aguardando Leitura...</p>
                </div>
              </div>
            )}

            <div className={`absolute -bottom-4 bg-zinc-900 text-white px-6 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/10`}>
              <Shield size={14} className="text-emerald-500" /> End-to-End Encryption
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ... (resto do código do chat permanece igual)
  return (
    <div className={`h-[calc(100vh-80px)] flex animate-fade-in font-sans ${theme.textMain}`}>
      {/* Sidebar e Chat - igual ao código original */}
      <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
        {/* ... conteúdo da sidebar ... */}
      </div>
      
      {selectedLead ? (
        <div className={`flex-1 flex flex-col ${theme.bgApp}`}>
          {/* ... conteúdo do chat ... */}
        </div>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center ${theme.bgApp}`}>
          <div className={`w-24 h-24 rounded-full ${theme.bgCard} border ${theme.border} flex items-center justify-center mb-6 shadow-2xl`}>
            <Smartphone size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">ImobiPro <span className="text-emerald-500">Chat</span></h2>
          <p className={`${theme.textMuted} font-medium`}>Selecione um cliente ao lado para conversar.</p>
        </div>
      )}
    </div>
  );
}