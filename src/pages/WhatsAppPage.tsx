import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Send, Loader2, QrCode, MessageSquare, Unplug, Smartphone, AlertCircle } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode || false;

  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ 1. GERENCIAMENTO DE MENSAGENS COM REALTIME (SEGURO)
  useEffect(() => {
    if (!selectedLead?.id) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('lead_id', selectedLead.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages(data || []);
      } catch (e) {
        console.error("Erro ao buscar histórico:", e);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}` 
      }, (payload) => {
        console.log("📩 Nova mensagem detectada via Realtime!", payload.new);
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe((status) => {
        console.log("📡 Status do Canal Realtime:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ 2. VERIFICAR STATUS DA CONEXÃO ORACLE (COM TIMEOUT PARA NÃO DAR TELA PRETA)
  useEffect(() => {
    const checkStatus = async () => {
      const timeout = setTimeout(() => setInitialCheckDone(true), 5000); // Destrava a tela após 5s mesmo se falhar
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET', headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        const data = await res.json();
        setIsWhatsappConnected(data.instance?.state === 'open' || data.state === 'open' || data.status === 'open');
      } catch (e) {
        console.error("Erro Oracle:", e);
      } finally {
        clearTimeout(timeout);
        setInitialCheckDone(true);
      }
    };
    checkStatus();
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
    } catch (e) {
      setConnectionStatus('disconnected');
      alert("Erro ao conectar com a API");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead?.phone) return;

    const content = newMessage;
    const rawPhone = selectedLead.phone.replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    setNewMessage('');

    try {
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({
          number: cleanPhone,
          textMessage: { text: content }
        })
      });
    } catch (e) {
      alert("Erro ao enviar.");
    }
  };

  // 🛡️ SEGURO: Tela de carregamento
  if (!initialCheckDone) return (
    <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
      <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
      <p className="text-xs uppercase tracking-widest opacity-50">Sincronizando Oracle...</p>
    </div>
  );

  if (isWhatsappConnected) {
    return (
      <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
        {/* Sidebar */}
        <div className={`w-80 border-r ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} flex flex-col bg-white dark:bg-black`}>
          <div className="p-6 border-b font-black uppercase italic tracking-tighter text-emerald-500">ImobiPro Chat</div>
          <div className="flex-1 overflow-y-auto">
            {leads?.length > 0 ? leads.map((lead: any) => (
              <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-3 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center font-bold text-emerald-500">{lead.name?.[0] || "?"}</div>
                <div className="text-left truncate font-medium">{lead.name || "Sem nome"}</div>
              </button>
            )) : <p className="p-4 text-xs opacity-50">Nenhum lead encontrado.</p>}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedLead ? (
            <>
              <div className="h-16 p-4 border-b flex items-center justify-between bg-white dark:bg-zinc-950 shadow-sm font-bold">
                {selectedLead.name}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50 dark:bg-black">
                {messages.length > 0 ? messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : (darkMode ? 'bg-zinc-800' : 'bg-white border border-zinc-200')}`}>
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <MessageSquare size={32} className="mb-2" />
                    <p className="text-xs uppercase font-bold tracking-widest">Inicie a conversa</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2 bg-white dark:bg-zinc-950">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className={`flex-1 p-3 rounded-xl border ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200'} focus:outline-none`} />
                <button type="submit" className="p-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"><Send size={20}/></button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
               <Smartphone size={64} className="mb-4" />
               <p className="font-bold uppercase tracking-widest text-xs">Selecione um cliente para conversar</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // TELA DE CONEXÃO
  return (
    <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
      <div className={`max-w-sm w-full p-10 rounded-[48px] border ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200'} text-center shadow-2xl`}>
        <QrCode className="mx-auto text-emerald-500 mb-6" size={56} />
        <h2 className="text-2xl font-black uppercase italic mb-6">WhatsApp Hub</h2>
        {connectionStatus === 'waiting_scan' && qrCodeBase64 ? (
          <div className="bg-white p-4 rounded-3xl border-2 border-emerald-500 inline-block shadow-xl"><img src={qrCodeBase64} className="w-48 h-48" /></div>
        ) : (
          <button onClick={handleGenerateQR} className="w-full p-5 bg-emerald-500 text-white font-black rounded-2xl">CONECTAR AGORA</button>
        )}
      </div>
    </div>
  );
}