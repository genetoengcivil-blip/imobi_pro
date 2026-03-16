import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔗 CONFIGURAÇÃO VIA PROXY VERCEL
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
  const [isCheckingInstance, setIsCheckingInstance] = useState(false);
  
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
    const checkInstance = async () => {
      setIsCheckingInstance(true);
      try {
        const response = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        const data = await response.json();
        if (data.instance?.state === 'open') setWhatsappConnected(true);
      } catch (e) {
        console.error("Erro ao verificar instância:", e);
      } finally {
        setIsCheckingInstance(false);
      }
    };
    checkInstance();
  }, [setWhatsappConnected]);

  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setErrorMessage(null);
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      
      if (data.base64) {
        setQrCodeBase64(data.base64);
        setConnectionStatus('waiting_scan');
      } else if (data.instance?.status === 'open') {
        setWhatsappConnected(true);
      } else {
        await fetch(`${EVO_URL}/instance/create`, {
          method: 'POST',
          headers: { 'apikey': EVO_GLOBAL_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceName: INSTANCE_NAME, qrcode: true })
        });
        handleGenerateQR();
      }
    } catch (err) {
      setErrorMessage("Erro de conexão. Verifique o vercel.json.");
      setConnectionStatus('disconnected');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead?.phone) return;
    const msg = newMessage;
    setNewMessage('');
    addMessage(selectedLead.id, msg, 'sent');
    try {
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'apikey': EVO_GLOBAL_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: `55${selectedLead.phone.replace(/\D/g, '')}`, 
          textMessage: { text: msg } 
        })
      });
    } catch (e) { console.error(e); }
  };

  if (!whatsappConnected) {
    return (
      <div className={`p-8 min-h-[80vh] flex items-center justify-center animate-fade-in ${theme.bgApp}`}>
        <div className={`max-w-4xl w-full flex flex-col md:flex-row gap-12 ${theme.bgCard} p-12 rounded-[48px] border ${theme.border} shadow-2xl`}>
          <div className="flex-1 space-y-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="text-emerald-500" size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">WhatsApp <span className="text-emerald-500">SaaS</span></h1>
              <p className={`${theme.textMuted} font-medium text-lg leading-relaxed`}>
                Conecte seu aparelho para gerenciar leads em tempo real.
              </p>
              {errorMessage && <div className="mt-4 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs">{errorMessage}</div>}
            </div>
          </div>
          <div className={`w-full md:w-[350px] aspect-square flex items-center justify-center border-2 border-dashed rounded-[32px] ${theme.border}`}>
            {connectionStatus === 'disconnected' && (
              <button onClick={handleGenerateQR} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-emerald-500/20">
                Gerar QR Code
              </button>
            )}
            {connectionStatus === 'generating' && <Loader2 className="animate-spin text-emerald-500" size={48} />}
            {qrCodeBase64 && <img src={qrCodeBase64} className="w-64 h-64 rounded-xl shadow-2xl" alt="QR Code" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-80px)] flex animate-fade-in ${theme.textMain}`}>
      <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h2 className="text-xl font-black italic tracking-tighter uppercase mb-4">Conversas</h2>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
            <input type="text" placeholder="Procurar..." className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 text-sm`} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leads.map(lead => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 border-b ${theme.border} text-left flex items-center gap-4 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors ${selectedLead?.id === lead.id ? 'bg-zinc-100 dark:bg-white/5' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">{lead.name.charAt(0)}</div>
              <div className="flex-1 truncate">
                <div className="font-bold text-sm truncate">{lead.name}</div>
                <div className="text-xs opacity-50 truncate">{lead.phone}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {activeMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-[70%] text-sm font-medium ${msg.direction === 'sent' ? 'bg-[#0217ff] text-white rounded-tr-none' : 'bg-zinc-100 dark:bg-zinc-800 rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-3">
          <input value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl px-6 text-sm" placeholder="Digite sua mensagem..." />
          <button type="submit" className="p-4 bg-[#0217ff] text-white rounded-2xl hover:scale-105 transition-all shadow-lg shadow-[#0217ff]/20"><Send size={20}/></button>
        </form>
      </div>
    </div>
  );
}