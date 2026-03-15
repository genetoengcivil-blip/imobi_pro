import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔒 CONFIGURAÇÕES DO SERVIDOR (Via Vercel Rewrite)
const EVO_URL = "/evo-api"; 
const EVO_GLOBAL_KEY = "MIIEowIBAAKCAQEAuI+VrfEFvd8JKK7JVftIwUmTgS3ezht3TFdHuMjp1EH/z5UPVuOwmLb0eYsY0vSqRGXUqeWgN4JcNtKgBI9nGuW6yyj47Jga3HglqQJsneVQdRu/KZMhrz1qVtaLuAsxieVyGetpgz45WlTpavADoybeQpopESH4QhXkKEogjBbgSSXPRiOtfgTtcFC7ji4H9ZqNLWO9cdxR6I9WOgILONUz6PDfvzxGPuRXr61JVzMVjUDtZ/qsP1IPm8Mg+D8+yCK0D7O1UUa3Ih6PK3NRRYf2p+zxoCTjUp+caGB6o4LlrgmhEvJnHkGDrmyucKV46o4HKv3txyC1AINXV+5uPQIDAQABAoIBAAQkfOiVk1pqqir2mWBLrptgCmaI4ApiRXA6OUrlf5IbFSHUp658l9clrCEaRSlfAn9chcR2ef0k+OrmGV9g1KCe7W1n8wZkd53hOH8tpcB5iC/Iuqa1PblQOJXQZPxxi+AbfU8loI2olOL5KvASiRJdafm2uhs/VvIsyZ055LcgNpBISnmAIAQlzv4meYMu0K2ABgN38c8KSBUuMSVCWIeLtSqPwLZLK6KYlpqJg+sR3RC2vEkChXq4mfRLIiB5YiB5DPuPcgPe+81c5rPF5BHaA+LW+gK0ELnupSIu3LkfQg3IYPHni1TWOUz+1h42I+OzF38J+uTA5B16uYeiyUECgYEA3JcEVLt/+ywmprb6SWn602KW6FrOmdM3XP9d5lUPotHe6cDOjCf/xUM2IwtB/Ghi9W8VScMu3HkSeP+vVDkxlcyaNMKZzY5PiVWUTig0pQwRMZkXfyAiim4NPU+rOvcQkGev0UcRp+cSh35T9a8wWMifKJsSRuBvqHepjMFFfBECgYEA1i/7D1/lvQ/w34fU2exz+CFsfsxTIg5bUe/uufQAiof8mtxFQlqFFle0QxClWQNi+/4u8i0Ypfb2jTrz4QCTCZhN8YiLnyKu1rkZpPacgMLvEi3V0kXemJa3FKQbmG6rNfEsnGhrwcJ8Z7N3X/3NKvNLxJvYhS95Yb7UC/Yl620CgYA6Naew7GGTWE1CxRo68Tp9OZD087F9Kh177u9KbrvXjWYzbOuUVKHL3jaU/M2G28zxU0Tc2CKvj0tunpoXsZgCHaG7tnZ7pcgbR3gBP97UhuCqo+ltZH945B2eRj27K6M1WAcvRH/GPNXI528kb/xkEVzejD1Acs1EOX+GYyIA4QKBgCJeSJbK+H5B1JDJpung+yrRkis2dhB85UJckZ3c/Uk9UNc4iRSAmeJf6Fjqjt2doYB15OqPOelHm4BF+WQdR3q+qaMcGetLEWr7AJZry+kNXnc4S5sWAwXRCUeSnarz9x0Mue/PAZtxraymK32HqChAKeQ+bZvRZlS83iGdObBxAoGBANH4GiJM+DBK6ktrzoCxY1fuHcU554MdhpWpu+QSohDLnlJcvvCVF2JwIc2qXBLqMIEjzMU2+4j8PTXyAQtavTriiCjH4ORoHZtwfWxFIMVBnCGZ4s2EyMmpjPoG/tHgUrPRxTEgmr4UAXK14yMu8XdBa7MTB5kgnphJ4KZXruiA";

export default function WhatsAppPage() {
  const { user, leads, messages, addMessage, markAsRead, whatsappConnected, setWhatsappConnected, darkMode } = useGlobal();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  
  // Instância única por usuário
  const instanceName = useMemo(() => `imobipro_user_${user?.id?.split('-')[0] || 'corretor'}`, [user]);
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

  // 1. GERAR QR CODE REAL
  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setQrCodeBase64(null);

    try {
      // Tenta conectar/criar
      const response = await fetch(`${EVO_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVO_GLOBAL_KEY
        },
        body: JSON.stringify({
          instanceName: instanceName,
          token: instanceName + "_token",
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      const data = await response.json();

      if (data.qrcode?.base64) {
        setQrCodeBase64(data.qrcode.base64);
        setConnectionStatus('waiting_scan');
        checkConnectionStatus();
      } else if (data.instance?.status === 'open') {
        setWhatsappConnected(true);
        setConnectionStatus('disconnected');
      } else {
        // Se a instância já existe mas não mandou QR, tentamos o fetchConnect
        fetchConnectInstance();
      }
    } catch (error: any) {
      console.error("Erro na conexão:", error);
      alert(`Erro ao contactar servidor: ${error.message}`);
      setConnectionStatus('disconnected');
    }
  };

  const fetchConnectInstance = async () => {
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) {
        setQrCodeBase64(data.base64);
        setConnectionStatus('waiting_scan');
        checkConnectionStatus();
      }
    } catch (e) {
      setConnectionStatus('disconnected');
    }
  };

  const checkConnectionStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        const data = await res.json();
        
        if (data.instance?.state === 'open') {
          clearInterval(interval);
          setWhatsappConnected(true);
          setConnectionStatus('disconnected');
        }
      } catch (e) {}
    }, 5000);
  };

  const handleDisconnect = async () => {
    if(window.confirm("Tem a certeza que deseja desconectar o seu WhatsApp?")) {
      try {
        await fetch(`${EVO_URL}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
      } catch (e) {}
      setWhatsappConnected(false);
      setConnectionStatus('disconnected');
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
      await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
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
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-xl">
                  <img src={qrCodeBase64} alt="QR Code" className="w-56 h-56" />
                </div>
                <p className="text-emerald-500 font-black uppercase text-[10px] animate-pulse">Aguardando leitura...</p>
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

  return (
    <div className={`h-[calc(100vh-80px)] flex animate-fade-in font-sans ${theme.textMain}`}>
      {/* SIDEBAR */}
      <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Conversas</h2>
            <button onClick={handleDisconnect} title="Desconectar" className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
            <input type="text" placeholder="Procurar chat..." className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors ${theme.textMain}`} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {(leads || []).map((lead: any) => {
            const leadMsgs = (messages || []).filter((m: any) => m.leadId === lead.id);
            const lastMsg = leadMsgs[leadMsgs.length - 1];
            return (
              <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 border-b ${theme.border} flex items-start gap-4 transition-colors ${selectedLead?.id === lead.id ? (darkMode ? 'bg-zinc-900' : 'bg-zinc-100') : theme.bgHover}`}>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm truncate">{lead.name}</div>
                  <p className={`text-xs ${theme.textMuted} truncate`}>{lastMsg ? lastMsg.content : 'Iniciar conversa...'}</p>
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
                {selectedLead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className={`font-bold ${theme.textMain}`}>{selectedLead.name}</h3>
                <p className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>{selectedLead.phone || 'Sem número'}</p>
              </div>
            </div>
            <MoreVertical className={theme.textMuted} size={20} />
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
              <button type="submit" disabled={!newMessage.trim()} className="p-4 bg-emerald-500 text-white rounded-2xl disabled:opacity-50 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                <Send size={20} className="ml-1" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center ${theme.bgApp}`}>
          <Smartphone size={40} className="text-emerald-500 mb-4 opacity-20" />
          <p className={`${theme.textMuted} font-medium`}>Selecione uma conversa para iniciar.</p>
        </div>
      )}
    </div>
  );
}