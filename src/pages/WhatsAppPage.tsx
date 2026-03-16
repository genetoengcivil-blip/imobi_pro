import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔗 TÚNEL VERCEL OBRIGATÓRIO (Resolve o CORS e Failed to Fetch)
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123";
const INSTANCE_NAME = "imobipro"; // Nome fixo da instância

export default function WhatsAppPage() {
  const { user, leads, messages, addMessage, markAsRead, whatsappConnected, setWhatsappConnected, darkMode } = useGlobal();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingInstance, setIsCheckingInstance] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Theme configurations
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

  // ✅ VERIFICAR INSTÂNCIA AO CARREGAR
  useEffect(() => {
    const checkExistingInstance = async () => {
      setIsCheckingInstance(true);
      try {
        const response = await fetch(`${EVO_URL}/instance/fetchInstances`, {
          method: 'GET',
          headers: { 
            'apikey': EVO_GLOBAL_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const instances = await response.json();
          const existingInstance = instances.find((inst: any) => 
            inst.instance?.instanceName === INSTANCE_NAME
          );

          if (existingInstance?.instance?.status === 'open') {
            setWhatsappConnected(true);
          }
        }
      } catch (error) {
        console.log("Servidor Vercel a processar...");
      } finally {
        setIsCheckingInstance(false);
      }
    };

    checkExistingInstance();
  }, [setWhatsappConnected]);

  // ✅ FUNÇÃO PARA GERAR QR CODE COM FALLBACK DE CRIAÇÃO
  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setQrCodeBase64(null);
    setErrorMessage(null);

    try {
      // 1. Tenta conectar na instância existente
      const connectResponse = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: { 
          'apikey': EVO_GLOBAL_KEY,
          'Content-Type': 'application/json'
        }
      });

      // Se a instância existe, trata o QR ou o log in
      if (connectResponse.ok) {
        const connectData = await connectResponse.json();
        
        if (connectData.base64) {
          setQrCodeBase64(connectData.base64);
          setConnectionStatus('waiting_scan');
          startConnectionWatcher();
        } else if (connectData.instance?.state === "open" || connectData.status === "open") {
          setWhatsappConnected(true);
          setConnectionStatus('disconnected');
        } else {
          setErrorMessage("A aguardar estabilização do servidor. Tente de novo.");
          setConnectionStatus('disconnected');
        }
      } 
      // 2. Se a instância NÃO EXISTIR (Erro 404), o sistema cria automaticamente
      else if (connectResponse.status === 404) {
        const createResponse = await fetch(`${EVO_URL}/instance/create`, {
          method: 'POST',
          headers: { 
            'apikey': EVO_GLOBAL_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instanceName: INSTANCE_NAME,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
          })
        });

        const createData = await createResponse.json();
        if (createData.qrcode?.base64) {
          setQrCodeBase64(createData.qrcode.base64);
          setConnectionStatus('waiting_scan');
          startConnectionWatcher();
        } else if (createData.instance?.state === "open") {
          setWhatsappConnected(true);
        }
      } else {
        setErrorMessage("Falha de comunicação. Verifique o vercel.json.");
        setConnectionStatus('disconnected');
      }
    } catch (error: any) {
      setErrorMessage("Ocorreu um erro de rede. Certifique-se de estar na Vercel.");
      setConnectionStatus('disconnected');
    }
  };

  // ✅ MONITORIZAÇÃO ATIVA DA LEITURA DO QR CODE
  const startConnectionWatcher = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: { 
            'apikey': EVO_GLOBAL_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          // Verifica os diferentes padrões de estado da Evolution API
          if (data.instance?.state === 'open' || data.instance?.status === 'open' || data.state === 'open') {
            clearInterval(interval);
            setWhatsappConnected(true);
            setConnectionStatus('disconnected');
          }
        }
      } catch (e) {
        // Ignora erros silenciosos durante o polling
      }
    }, 3000);

    // Timeout de segurança após 2 minutos
    setTimeout(() => clearInterval(interval), 120000);
  };

  const handleDisconnect = async () => {
    if(window.confirm("Tem a certeza que deseja desconectar o seu WhatsApp?")) {
      try {
        await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
          method: 'DELETE',
          headers: { 
            'apikey': EVO_GLOBAL_KEY,
            'Content-Type': 'application/json'
          }
        });
      } catch (e) {}
      setWhatsappConnected(false);
      setConnectionStatus('disconnected');
      setQrCodeBase64(null);
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

  if (isCheckingInstance) {
    return (
      <div className={`p-8 pb-32 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-sans ${theme.textMain}`}>
        <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Verificando infraestrutura segura...</p>
      </div>
    );
  }

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
                Sincronize o seu WhatsApp com o CRM. Centralize o atendimento e automatize o envio de mensagens.
              </p>
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold">
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
                  disabled={isCheckingInstance}
                  className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  Gerar QR Code
                </button>
              </div>
            )}

            {connectionStatus === 'generating' && (
              <div className="text-center space-y-4">
                <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto" />
                <p className="font-black uppercase tracking-widest text-[10px] animate-pulse">Estabelecendo túnel seguro...</p>
              </div>
            )}

            {connectionStatus === 'waiting_scan' && qrCodeBase64 && (
              <div className="text-center space-y-4 animate-in zoom-in">
                <div className="bg-white p-4 rounded-2xl shadow-xl">
                  <img src={qrCodeBase64} alt="QR Code WhatsApp" className="w-56 h-56" />
                </div>
                <p className="text-emerald-500 font-black uppercase text-[10px] animate-pulse">Aguardando leitura do telemóvel...</p>
              </div>
            )}

            <div className={`absolute -bottom-4 bg-zinc-900 text-white px-6 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/10`}>
              <Shield size={14} className="text-emerald-500" /> Criptografia Ponta-a-Ponta
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-80px)] flex animate-fade-in font-sans ${theme.textMain}`}>
      {/* SIDEBAR */}
      <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Conversas</h2>
            <button 
              onClick={handleDisconnect} 
              title="Desconectar" 
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
            />
          </div>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
            <input 
              type="text" 
              placeholder="Procurar chat..." 
              className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors ${theme.textMain}`} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {(leads || []).map((lead: any) => {
            const leadMsgs = (messages || []).filter((m: any) => m.leadId === lead.id);
            const lastMsg = leadMsgs[leadMsgs.length - 1];
            return (
              <button 
                key={lead.id} 
                onClick={() => setSelectedLead(lead)} 
                className={`w-full p-4 border-b ${theme.border} flex items-start gap-4 transition-colors ${
                  selectedLead?.id === lead.id 
                    ? (darkMode ? 'bg-zinc-900' : 'bg-zinc-100') 
                    : darkMode ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg">
                  {lead.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm truncate">{lead.name}</div>
                  <p className={`text-xs ${theme.textMuted} truncate`}>
                    {lastMsg ? lastMsg.content : 'Sem mensagens...'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT AREA */}
      {selectedLead ? (
        <div className={`flex-1 flex flex-col ${theme.bgApp}`}>
          <div className={`h-20 border-b ${theme.border} ${theme.bgCard} flex items-center justify-between px-6`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                {selectedLead.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className={`font-bold ${theme.textMain}`}>{selectedLead.name}</h3>
                <p className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>
                  {selectedLead.phone || 'Sem número'}
                </p>
              </div>
            </div>
            <MoreVertical className={theme.textMuted} size={20} />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeMessages.map((msg: any) => {
              const isSent = msg.direction === 'sent';
              return (
                <div key={msg.id} className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] p-4 ${
                    isSent 
                      ? `${theme.msgSentBg} text-white rounded-2xl rounded-tr-sm shadow-lg` 
                      : `${theme.msgReceivedBg} border ${theme.border} ${theme.textMain} rounded-2xl rounded-tl-sm shadow-sm`
                  }`}>
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
                type="text" 
                placeholder="Escreva uma mensagem..." 
                className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-2xl px-6 focus:outline-none focus:border-emerald-500 transition-colors ${theme.textMain} text-sm font-medium`}
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()} 
                className="p-4 bg-emerald-500 text-white rounded-2xl disabled:opacity-50 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Send size={20} className="ml-1" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center ${theme.bgApp}`}>
          <Smartphone size={40} className="text-emerald-500 mb-4 opacity-20" />
          <p className={`${theme.textMuted} font-medium`}>Selecione um cliente para iniciar a conversa.</p>
        </div>
      )}
    </div>
  );
}