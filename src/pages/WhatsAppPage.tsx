import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Unplug, RefreshCw
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔒 CONFIGURAÇÕES - Verifique se o EVO_URL no seu proxy está correto
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const globalCtx = useGlobal() as any;
  const { leads = [], darkMode = false } = globalCtx;

  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem('@ImobiPro:Msgs');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cores adaptáveis para evitar tela preta
  const theme = {
    bgApp: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    bgCard: darkMode ? 'bg-zinc-900' : 'bg-white',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    border: darkMode ? 'border-zinc-800' : 'border-zinc-200',
  };

  useEffect(() => {
    localStorage.setItem('@ImobiPro:Msgs', JSON.stringify(localMessages));
  }, [localMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead, localMessages]);

  const formatPhone = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;
    return clean;
  };

  // ✅ RADAR COM FILTRO DE SEGURANÇA (Só mostra mensagens do Lead selecionado)
  useEffect(() => {
    if (!isWhatsappConnected || !selectedLead) return;

    const fetchMsgs = async () => {
      try {
        const targetPhone = formatPhone(selectedLead.phone);
        const res = await fetch(`${EVO_URL}/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
          body: JSON.stringify({ where: { remoteJid: `${targetPhone}@s.whatsapp.net` }, take: 15 })
        });

        if (res.ok) {
          const data = await res.json();
          const records = Array.isArray(data) ? data : (data?.messages?.records || []);
          
          records.forEach((msg: any) => {
            const remoteJid = msg.key?.remoteJid || msg.remoteJid || '';
            // 🛡️ FILTRO: Só processa se o ID da mensagem pertencer ao telefone do Lead
            if (remoteJid.includes(targetPhone)) {
              const isFromMe = msg.key?.fromMe || msg.fromMe;
              let content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.text;
              
              if (!content && msg.message) {
                if (msg.message.imageMessage) content = "📷 Imagem";
                else if (msg.message.audioMessage) content = "🎵 Áudio";
                else content = "📎 Mídia";
              }

              if (content) {
                const apiId = msg.key?.id || msg.id;
                setLocalMessages(prev => {
                  if (prev.some(m => m.id === apiId)) return prev;
                  return [...prev, { id: apiId, leadId: selectedLead.id, content, direction: isFromMe ? 'sent' : 'received', timestamp: new Date().toISOString() }];
                });
              }
            }
          });
        }
      } catch (e) {}
    };

    const interval = setInterval(fetchMsgs, 5000);
    return () => clearInterval(interval);
  }, [isWhatsappConnected, selectedLead]);

  // ✅ STATUS DA CONEXÃO
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
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET', headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) {
        setQrCodeBase64(data.base64);
        setConnectionStatus('waiting_scan');
      }
    } catch (e) { alert("Erro ao conectar"); setConnectionStatus('disconnected'); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;
    const msg = newMessage;
    const phone = formatPhone(selectedLead.phone);
    setNewMessage('');

    // Adiciona localmente para feedback instantâneo
    const tempId = Date.now().toString();
    setLocalMessages(prev => [...prev, { id: tempId, leadId: selectedLead.id, content: msg, direction: 'sent', timestamp: new Date().toISOString() }]);

    try {
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

  if (!initialCheckDone) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
    </div>
  );

  if (isWhatsappConnected) {
    return (
      <div className={`h-[calc(100vh-80px)] flex ${theme.bgApp} ${theme.textMain}`}>
        {/* Sidebar */}
        <div className={`w-80 border-r ${theme.border} flex flex-col`}>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-black uppercase italic">Conversas</h2>
            <button onClick={() => { if(confirm("Desconectar?")) setIsWhatsappConnected(false); }} className="text-zinc-500 hover:text-red-500"><Unplug size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leads.map((lead: any) => (
              <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-3 border-b ${theme.border} ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''}`}>
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">{lead.name[0]}</div>
                <div className="text-left truncate font-medium">{lead.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          {selectedLead ? (
            <>
              <div className={`h-16 p-6 border-b ${theme.border} flex items-center font-bold`}>{selectedLead.name}</div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {localMessages.filter(m => m.leadId === selectedLead.id).map(m => (
                  <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : (darkMode ? 'bg-zinc-800' : 'bg-white border ' + theme.border)}`}>
                      <p className="text-sm">{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className="flex-1 p-3 rounded-xl border dark:bg-zinc-900 dark:border-zinc-800 focus:outline-none" />
                <button className="p-3 bg-emerald-500 text-white rounded-xl"><Send size={20}/></button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-20"><MessageSquare size={64}/></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex items-center justify-center ${theme.bgApp}`}>
      <div className={`max-w-md w-full p-10 rounded-[40px] border ${theme.border} ${theme.bgCard} text-center space-y-6 shadow-2xl`}>
        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto text-emerald-500"><QrCode size={40}/></div>
        <h2 className={`text-2xl font-black uppercase italic ${theme.textMain}`}>WhatsApp</h2>
        {connectionStatus === 'waiting_scan' && qrCodeBase64 ? (
          <div className="bg-white p-4 rounded-3xl inline-block border-2 border-emerald-500"><img src={qrCodeBase64} className="w-48 h-48" /></div>
        ) : (
          <button onClick={handleGenerateQR} className="w-full p-4 bg-emerald-500 text-white font-black rounded-2xl hover:scale-105 transition-all">GERAR CONEXÃO</button>
        )}
      </div>
    </div>
  );
}