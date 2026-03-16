import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile, Unplug, RefreshCw
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { leads, darkMode } = useGlobal() as any;
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('@ImobiPro:WhatsAppMessages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    localStorage.setItem('@ImobiPro:WhatsAppMessages', JSON.stringify(localMessages));
  }, [localMessages]);

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const theme = {
    bgApp: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    bgCard: darkMode ? 'bg-black' : 'bg-white',
    bgSidebar: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    border: darkMode ? 'border-white/5' : 'border-zinc-200',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    msgSentBg: 'bg-[#0217ff]',
    msgReceivedBg: darkMode ? 'bg-zinc-900' : 'bg-white',
  };

  const addLocalMessage = (leadId: string, content: string, direction: 'sent' | 'received', apiId?: string) => {
    setLocalMessages(prev => {
      if (apiId && prev.some(m => m.id === apiId)) return prev;
      const newMsg = { id: apiId || Date.now().toString(), leadId, content, direction, timestamp: new Date().toISOString() };
      return [...prev, newMsg];
    });
  };

  const formatPhoneNumber = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;
    return clean;
  };

  // ✅ RADAR DE MENSAGENS SIMPLIFICADO (Para não travar a sessão)
  useEffect(() => {
    if (!isWhatsappConnected || !selectedLead) return;

    const fetchMsgs = async () => {
      try {
        const phone = formatPhoneNumber(selectedLead.phone);
        const res = await fetch(`${EVO_URL}/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
          body: JSON.stringify({ where: { remoteJid: `${phone}@s.whatsapp.net` }, take: 10 })
        });

        if (res.ok) {
          const data = await res.json();
          const records = Array.isArray(data) ? data : (data?.messages?.records || []);
          records.forEach((msg: any) => {
            const isFromMe = msg.key?.fromMe || msg.fromMe;
            const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || 
                            (msg.message?.imageMessage ? "📷 Imagem" : msg.message?.audioMessage ? "🎵 Áudio" : "");
            if (content) addLocalMessage(selectedLead.id, content, isFromMe ? 'sent' : 'received', msg.key?.id || msg.id);
          });
        }
      } catch (e) {}
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 5000);
    return () => clearInterval(interval);
  }, [isWhatsappConnected, selectedLead]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET', headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        const data = await res.json();
        setIsWhatsappConnected(data.instance?.state === 'open' || data.state === 'open');
      } catch (e) {} finally { setInitialCheckDone(true); }
    };
    check();
  }, []);

  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setIsLoading(true);
    try {
      // Força a desconexão antes de gerar novo para limpar chaves velhas
      await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, { method: 'DELETE', headers: { 'apikey': EVO_GLOBAL_KEY } }).catch(()=>{});
      
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET', headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) {
        setQrCodeBase64(data.base64);
        setConnectionStatus('waiting_scan');
      }
    } catch (e) { alert("Erro ao conectar"); } finally { setIsLoading(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;
    const msg = newMessage;
    setNewMessage('');
    addLocalMessage(selectedLead.id, msg, 'sent');

    try {
      const phone = formatPhoneNumber(selectedLead.phone);
      // 🔥 O FORMATO MAIS SIMPLES POSSÍVEL PARA NÃO QUEBRAR A SESSÃO
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({
          number: phone,
          text: msg // Algumas versões v1.8 preferem 'text' direto aqui
        })
      });
    } catch (e) {}
  };

  if (!initialCheckDone) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  if (isWhatsappConnected) {
    return (
      <div className={`h-[calc(100vh-80px)] flex ${theme.textMain}`}>
        <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
          <div className="p-6 border-b flex justify-between items-center bg-emerald-500/5">
            <h2 className="font-black uppercase italic tracking-tighter text-emerald-500">ImobiPro Chat</h2>
            <button onClick={() => { localStorage.removeItem('@ImobiPro:WhatsAppMessages'); setLocalMessages([]); }} className="p-2 opacity-50 hover:opacity-100" title="Limpar Histórico"><RefreshCw size={14}/></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leads.map((lead: any) => (
              <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-4 items-center border-b ${theme.border} ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''}`}>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center font-bold">{lead.name[0]}</div>
                <div className="text-left truncate font-medium text-sm">{lead.name}</div>
              </button>
            ))}
          </div>
        </div>
        {selectedLead ? (
          <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-black">
            <div className={`h-16 p-6 border-b ${theme.border} flex items-center bg-white dark:bg-zinc-950`}>
              <p className="font-bold">{selectedLead.name}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {localMessages.filter(m => m.leadId === selectedLead.id).map(m => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : 'bg-white dark:bg-zinc-800 border ' + theme.border}`}>
                    <p className="text-sm">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-950 border-t flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className="flex-1 p-3 rounded-xl border dark:bg-zinc-900 focus:outline-none focus:border-emerald-500" />
              <button className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"><Send size={20}/></button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-20"><MessageSquare size={64}/></div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className={`max-w-md w-full p-10 rounded-[40px] border ${theme.border} bg-white dark:bg-black text-center space-y-8 shadow-2xl`}>
        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto"><QrCode className="text-emerald-500" size={40}/></div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter">WhatsApp</h2>
        <p className="text-zinc-500 text-sm">Escaneie para ativar o atendimento automático.</p>
        {connectionStatus === 'waiting_scan' && qrCodeBase64 ? (
          <div className="bg-white p-6 rounded-3xl inline-block border-4 border-emerald-500 shadow-xl"><img src={qrCodeBase64} className="w-52 h-52" /></div>
        ) : (
          <button onClick={handleGenerateQR} className="w-full p-5 bg-emerald-500 text-white font-black rounded-3xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">ATIVAR AGORA</button>
        )}
      </div>
    </div>
  );
}