import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

const EVO_URL = "/evo-api"; 
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const globalCtx = useGlobal() as any; // Usamos 'any' temporariamente para fazer o fallback seguro
  
  // 🛡️ PROTEÇÃO CONTRA O ERRO "is not a function" (Maiúsculas e Minúsculas)
  const setConnected = globalCtx.setWhatsappConnected || globalCtx.setWhatsAppConnected;
  const isConnected = globalCtx.whatsappConnected || globalCtx.whatsAppConnected;
  
  const { user, leads, messages, addMessage, markAsRead, darkMode } = globalCtx;
  
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
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
    if (selectedLead && typeof markAsRead === 'function') markAsRead(selectedLead.id);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead, activeMessages, markAsRead]);

  // Função segura para mudar o estado sem crashar a app
  const safeSetConnected = (status: boolean) => {
    if (typeof setConnected === 'function') {
      setConnected(status);
    } else {
      console.error("ERRO CRÍTICO: setWhatsappConnected não existe no GlobalContext.tsx!");
      setErrorMessage("Erro interno do sistema: O Contexto Global está mal configurado.");
    }
  };

  // ✅ VERIFICA SE JÁ ESTÁ CONECTADO AO CARREGAR A PÁGINA
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.instance?.state === 'open' || data.instance?.status === 'open' || data.state === 'open') {
            console.log("✅ Instância já está conectada na Oracle!");
            safeSetConnected(true);
          }
        }
      } catch (error) {
        console.log("Servidor proxy a estabilizar...");
      } finally {
        setIsChecking(false);
      }
    };
    checkStatus();
  }, []);

  const startConnectionWatcher = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        if(res.ok) {
          const data = await res.json();
          if (data.instance?.state === 'open' || data.instance?.status === 'open' || data.state === 'open') {
            clearInterval(interval);
            safeSetConnected(true);
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

    try {
      const connectRes = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      let connectData = null;
      if (connectRes.ok) {
        connectData = await connectRes.json();
      }

      // Se a API retornar base64 diretamente (porque a instância existe mas não está logada)
      if (connectData && connectData.base64) {
        setQrCodeBase64(connectData.base64);
        setConnectionStatus('waiting_scan');
        startConnectionWatcher();
      } 
      // Se a instância já estiver com estado "open"
      else if (connectData && (connectData.instance?.state === 'open' || connectData.state === 'open')) {
        safeSetConnected(true);
      } 
      // Se a instância não existir, cria-a
      else if (connectRes.status === 404 || !connectRes.ok) {
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
          throw new Error(`A Oracle recusou criar a instância. Detalhes: ${errorText}`);
        }
        
        const createData = await createRes.json();
        
        if (createData.qrcode && createData.qrcode.base64) {
          setQrCodeBase64(createData.qrcode.base64);
          setConnectionStatus('waiting_scan');
          startConnectionWatcher();
        } else if (createData.instance?.state === 'open') {
           safeSetConnected(true);
        } else {
           throw new Error("A API não enviou o QR Code.");
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Erro de proxy com o servidor.");
      setConnectionStatus('disconnected');
    }
  };

  const handleDisconnect = async () => {
    if(window.confirm("Tem a certeza que deseja desconectar o WhatsApp?")) {
      try {
        await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
          method: 'DELETE',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
      } catch (e) {}
      safeSetConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !selectedLead.phone || typeof addMessage !== 'function') return;

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
          options: { delay: 1200, presence: 'composing' },
          textMessage: { text: messageText }
        })
      });
    } catch (error) {}
  };

  // Ecrã de carregamento inicial
  if (isChecking) {
    return (
      <div className={`p-8 pb-32 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-sans ${theme.textMain}`}>
         <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
         <p className="font-black uppercase tracking-widest text-[10px] text-zinc-500">Verificando status do servidor...</p>
      </div>
    );
  }

  // Ecrã de Leitura do QR Code
  if (!isConnected) {
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
                <button onClick={handleGenerateQR} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 shadow-xl shadow-emerald-500/20 transition-all">
                  Gerar QR Code
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

  // Ecrã de Chat (Quando está conectado)
  return (
    <div className={`h-[calc(100vh-80px)] flex animate-fade-in font-sans ${theme.textMain}`}>
      <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
        <div className={`p-6 border-b ${theme.border}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Conversas</h2>
            <button onClick={handleDisconnect} title="Desconectar WhatsApp" className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse cursor-pointer hover:scale-150 transition-all" />
          </div>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
            <input type="text" placeholder="Procurar lead..." className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors ${theme.textMain}`} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {(leads || []).map((lead: any) => {
            const leadMsgs = (messages || []).filter((m: any) => m.leadId === lead.id);
            const lastMsg = leadMsgs[leadMsgs.length - 1];
            return (
              <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 border-b ${theme.border} flex items-start gap-4 transition-colors ${selectedLead?.id === lead.id ? (darkMode ? 'bg-zinc-900' : 'bg-zinc-100') : (darkMode ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-100')}`}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg">
                    {lead.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold text-sm ${theme.textMain} truncate`}>{lead.name}</span>
                  </div>
                  <p className={`text-xs ${theme.textMuted} truncate`}>{lastMsg ? lastMsg.content : 'Iniciar conversa...'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedLead ? (
        <div className={`flex-1 flex flex-col ${theme.bgApp}`}>
          <div className={`h-20 border-b ${theme.border} ${theme.bgCard} flex items-center justify-between px-6`}>
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedLead(null)} className={`lg:hidden p-2 -ml-2 ${theme.textMuted}`}><ChevronLeft size={24} /></button>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                {selectedLead.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className={`font-bold ${theme.textMain}`}>{selectedLead.name}</h3>
                <p className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>{selectedLead.phone || 'Sem número'}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeMessages.map((msg: any) => {
              const isSent = msg.direction === 'sent';
              return (
                <div key={msg.id} className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] p-4 ${isSent ? `${theme.msgSentBg} text-white rounded-2xl rounded-tr-sm` : `${theme.msgReceivedBg} border ${theme.border} ${theme.textMain} rounded-2xl rounded-tl-sm`}`}>
                    <p className="text-sm font-medium">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className={`p-4 ${theme.bgCard} border-t ${theme.border}`}>
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input 
                type="text" placeholder="Escreva uma mensagem..." 
                className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-2xl px-6 focus:outline-none focus:border-emerald-500 transition-colors ${theme.textMain} text-sm font-medium`}
                value={newMessage} onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()} className="p-4 bg-[#0217ff] text-white rounded-2xl disabled:opacity-50 hover:scale-105 transition-all shadow-lg shadow-[#0217ff]/20">
                <Send size={20} className="ml-1" />
              </button>
            </form>
          </div>
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