import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Send, Loader2, QrCode, MessageSquare, Unplug } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  // 🛡️ PROTEÇÃO: Se o contexto falhar, usamos valores padrão para não dar tela preta
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode || false;

  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens com segurança
  useEffect(() => {
    try {
      const saved = localStorage.getItem('@ImobiPro:ChatLogs');
      if (saved) setLocalMessages(JSON.parse(saved));
    } catch (e) { console.error("Erro ao carregar cache"); }
  }, []);

  // Salvar mensagens com segurança
  useEffect(() => {
    if (localMessages.length > 0) {
      localStorage.setItem('@ImobiPro:ChatLogs', JSON.stringify(localMessages));
    }
  }, [localMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead, localMessages]);

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;
    return clean;
  };

  // ✅ RADAR COM FILTRO E SUPORTE A MÍDIA
  useEffect(() => {
    if (!isWhatsappConnected || !selectedLead) return;

    const fetchMsgs = async () => {
      try {
        const targetPhone = formatPhone(selectedLead.phone);
        const res = await fetch(`${EVO_URL}/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
          body: JSON.stringify({ where: { remoteJid: `${targetPhone}@s.whatsapp.net` }, take: 10 })
        });

        if (res.ok) {
          const data = await res.json();
          const records = Array.isArray(data) ? data : (data?.messages?.records || []);
          
          records.forEach((msg: any) => {
            const remoteJid = msg.key?.remoteJid || msg.remoteJid || '';
            if (remoteJid.includes(targetPhone)) {
              const apiId = msg.key?.id || msg.id;
              const isFromMe = msg.key?.fromMe || msg.fromMe;
              
              // Identifica Texto ou Mídia
              let content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.text;
              if (!content && msg.message) {
                if (msg.message.imageMessage) content = "📷 Imagem";
                else if (msg.message.audioMessage) content = "🎵 Áudio";
                else content = "📎 Mídia/Arquivo";
              }

              if (content) {
                setLocalMessages(prev => {
                  if (prev.some(m => m.id === apiId)) return prev;
                  return [...prev, { id: apiId, leadId: selectedLead.id, content, direction: isFromMe ? 'sent' : 'received' }];
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
    } catch (e) { setConnectionStatus('disconnected'); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;
    const msg = newMessage;
    const phone = formatPhone(selectedLead.phone);
    setNewMessage('');

    addLocalMessage(selectedLead.id, msg, 'sent');

    try {
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({ number: phone, textMessage: { text: msg } })
      });
    } catch (e) {}
  };

  const addLocalMessage = (leadId: string, content: string, direction: 'sent' | 'received') => {
    setLocalMessages(prev => [...prev, { id: Date.now().toString(), leadId, content, direction }]);
  };

  if (!initialCheckDone) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  if (isWhatsappConnected) {
    return (
      <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
        {/* Sidebar */}
        <div className={`w-80 border-r ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} flex flex-col`}>
          <div className="p-4 border-b flex justify-between items-center">
            <span className="font-bold uppercase text-xs tracking-widest text-emerald-500">Conversas</span>
            <button onClick={() => setIsWhatsappConnected(false)} className="opacity-50 hover:text-red-500"><Unplug size={16}/></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leads.map((lead: any) => (
              <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-3 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''}`}>
                <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center text-white font-bold">{lead.name?.[0] || "?"}</div>
                <div className="text-left truncate font-medium">{lead.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          {selectedLead ? (
            <>
              <div className="h-16 p-4 border-b flex items-center font-bold shadow-sm">{selectedLead.name}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {localMessages.filter(m => m.leadId === selectedLead.id).map(m => (
                  <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl ${m.direction === 'sent' ? 'bg-[#0217ff] text-white shadow-md' : (darkMode ? 'bg-zinc-800' : 'bg-white border shadow-sm')}`}>
                      <p className="text-sm">{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className={`flex-1 p-3 rounded-lg border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} focus:outline-none`} />
                <button className="p-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"><Send size={18}/></button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
              <MessageSquare size={48} className="mb-2" />
              <p>Selecione uma conversa</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className={`max-w-sm w-full p-8 rounded-3xl border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} text-center shadow-xl`}>
        <QrCode className="mx-auto text-emerald-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-6">Conectar WhatsApp</h2>
        {connectionStatus === 'waiting_scan' && qrCodeBase64 ? (
          <div className="bg-white p-4 rounded-xl border-2 border-emerald-500 inline-block">
            <img src={qrCodeBase64} className="w-40 h-40" />
          </div>
        ) : (
          <button onClick={handleGenerateQR} className="w-full p-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600">GERAR QR CODE</button>
        )}
      </div>
    </div>
  );
}