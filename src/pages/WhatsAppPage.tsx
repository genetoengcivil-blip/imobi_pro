import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile, Unplug
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔒 CONFIGURAÇÕES
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { leads, darkMode } = useGlobal() as any;
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  
  // Histórico local
  const [localMessages, setLocalMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('@ImobiPro:WhatsAppMessages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    if (localMessages.length > 0) {
      localStorage.setItem('@ImobiPro:WhatsAppMessages', JSON.stringify(localMessages));
    }
  }, [localMessages]);

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

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

  const addLocalMessage = (leadId: string, content: string, direction: 'sent' | 'received', apiId?: string) => {
    setLocalMessages(prev => {
      if (apiId && prev.some(m => m.id === apiId)) return prev;
      const newMsg = { id: apiId || Date.now().toString(), leadId, content, direction, timestamp: new Date().toISOString() };
      return [...prev, newMsg].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
  };

  const activeMessages = useMemo(() => {
    if (!selectedLead) return [];
    return localMessages.filter((m: any) => m.leadId === selectedLead.id);
  }, [localMessages, selectedLead]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead, activeMessages]);

  const formatPhoneNumber = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = clean.substring(1);
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;
    return clean;
  };

  // ✅ RADAR REFORÇADO (Puxa mensagens e identifica mídias)
  useEffect(() => {
    if (!isWhatsappConnected || !selectedLead) return;

    const fetchChatHistory = async () => {
      try {
        const cleanPhone = formatPhoneNumber(selectedLead.phone);
        const remoteJid = `${cleanPhone}@s.whatsapp.net`;

        const res = await fetch(`${EVO_URL}/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
          body: JSON.stringify({ where: { remoteJid }, take: 20 })
        });

        if (res.ok) {
          const data = await res.json();
          let records = Array.isArray(data) ? data : (data?.messages?.records || []);

          records.forEach((msg: any) => {
            const msgJid = msg.key?.remoteJid || msg.remoteJid || '';
            if (msgJid.includes(cleanPhone)) {
              const apiId = msg.key?.id || msg.id;
              const isFromMe = msg.key?.fromMe || msg.fromMe;
              
              // Lógica de Extração de Conteúdo (Texto e Mídia)
              let content = msg.message?.conversation || 
                            msg.message?.extendedTextMessage?.text || 
                            msg.text || '';

              if (!content && msg.message) {
                if (msg.message.imageMessage) content = "📷 Imagem recebida";
                else if (msg.message.audioMessage) content = "🎵 Áudio recebido";
                else if (msg.message.videoMessage) content = "🎥 Vídeo recebido";
                else if (msg.message.stickerMessage) content = "✨ Figurinha";
                else if (msg.message.documentMessage) content = "📎 Documento";
                else content = "📎 Arquivo de mídia";
              }

              if (content) addLocalMessage(selectedLead.id, content, isFromMe ? 'sent' : 'received', apiId);
            }
          });
        }
      } catch (e) {}
    };

    fetchChatHistory();
    const interval = setInterval(fetchChatHistory, 4000); // 4 segundos para ser mais rápido
    return () => clearInterval(interval);
  }, [isWhatsappConnected, selectedLead]);

  // ✅ VERIFICAÇÃO DE STATUS
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        if (res.ok) {
          const data = await res.json();
          setIsWhatsappConnected(data.instance?.state === 'open' || data.state === 'open');
        }
      } catch (e) {} finally { setInitialCheckDone(true); }
    };
    check();
  }, []);

  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setIsLoading(true);
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) {
        setQrCodeBase64(data.base64);
        setConnectionStatus('waiting_scan');
        // Watcher simples
        const timer = setInterval(async () => {
          const r = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
            method: 'GET', headers: { 'apikey': EVO_GLOBAL_KEY }
          });
          const d = await r.json();
          if (d.instance?.state === 'open' || d.state === 'open') {
            clearInterval(timer);
            setIsWhatsappConnected(true);
            setConnectionStatus('disconnected');
          }
        }, 3000);
      }
    } catch (e) { setErrorMessage("Erro ao gerar QR Code"); } finally { setIsLoading(false); }
  };

  const handleDisconnect = async () => {
    if(!window.confirm("Isso apagará a conexão atual. Deseja continuar?")) return;
    try {
      await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
        method: 'DELETE', headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      setIsWhatsappConnected(false);
      setConnectionStatus('disconnected');
    } catch (e) {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const msg = newMessage;
    setNewMessage('');
    addLocalMessage(selectedLead.id, msg, 'sent');

    try {
      const phone = formatPhoneNumber(selectedLead.phone);
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({
          number: phone,
          textMessage: { text: msg }
        })
      });
    } catch (e) {}
  };

  if (!initialCheckDone) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (isWhatsappConnected) {
    return (
      <div className={`h-[calc(100vh-80px)] flex animate-fade-in ${theme.textMain}`}>
        {/* Sidebar */}
        <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-black uppercase italic tracking-tighter">Conversas</h2>
            <button onClick={handleDisconnect} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Resetar Conexão"><Unplug size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leads.map((lead: any) => (
              <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-4 items-center border-b ${theme.border} ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''}`}>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center font-bold">{lead.name[0]}</div>
                <div className="text-left truncate">
                  <p className="font-bold text-sm truncate">{lead.name}</p>
                  <p className="text-xs opacity-50 truncate">{localMessages.filter(m => m.leadId === lead.id).slice(-1)[0]?.content || "Sem mensagens"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        {selectedLead ? (
          <div className="flex-1 flex flex-col">
            <div className={`h-20 p-6 border-b ${theme.border} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">{selectedLead.name[0]}</div>
                <div><p className="font-bold">{selectedLead.name}</p><p className="text-[10px] opacity-50">{selectedLead.phone}</p></div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeMessages.map(m => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : theme.bgReceivedBg + ' border ' + theme.border}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escreva..." className={`flex-1 p-3 rounded-xl border ${theme.border} ${theme.inputBg}`} />
              <button className="p-3 bg-emerald-500 text-white rounded-xl"><Send size={20}/></button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-30">Selecione um cliente</div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-8">
      <div className={`max-w-md w-full p-8 rounded-3xl border ${theme.border} ${theme.bgCard} text-center space-y-6 shadow-2xl`}>
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto"><QrCode className="text-emerald-500" size={32}/></div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Conectar WhatsApp</h2>
        {connectionStatus === 'waiting_scan' && qrCodeBase64 ? (
          <div className="bg-white p-4 rounded-xl inline-block"><img src={qrCodeBase64} className="w-48 h-48" /></div>
        ) : (
          <button onClick={handleGenerateQR} className="w-full p-4 bg-emerald-500 text-white font-black rounded-2xl hover:scale-105 transition-all">GERAR QR CODE</button>
        )}
        {errorMessage && <p className="text-red-500 text-xs">{errorMessage}</p>}
      </div>
    </div>
  );
}