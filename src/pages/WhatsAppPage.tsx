import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
// ✅ Importação total para evitar o erro "is not defined"
import { 
  MessageSquare, Send, QrCode, Unplug, Smartphone, 
  Search, RefreshCw, Loader2, AlertTriangle, User 
} from 'lucide-react';

const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  // 🛡️ Proteção contra erro de Contexto
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode || false;

  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ 1. CARREGAR MENSAGENS E REALTIME
  useEffect(() => {
    if (!selectedLead?.id) return;

    async function loadInitialMessages() {
      try {
        const { data } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('lead_id', selectedLead.id)
          .order('created_at', { ascending: true });
        if (data) setMessages(data);
      } catch (e) { console.error("Erro Supabase:", e); }
    }
    loadInitialMessages();

    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'whatsapp_messages', 
        filter: `lead_id=eq.${selectedLead.id}` 
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ 2. VERIFICAR CONEXÃO ORACLE
  const checkStatus = async () => {
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      const state = data.instance?.state || data.state;
      setIsConnected(state === 'open');
    } catch (e) { console.log("Oracle Offline"); }
    finally { setInitialCheckDone(true); }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) setQrCode(data.base64);
      else checkStatus();
    } catch (e) { alert("Erro ao conectar."); }
    finally { setLoading(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const text = newMessage;
    const phone = selectedLead.phone?.replace(/\D/g, '');
    const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
    setNewMessage('');

    try {
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({ number: cleanPhone, textMessage: { text } })
      });
    } catch (e) { alert("Erro de envio."); }
  };

  if (!initialCheckDone) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 text-white font-mono text-xs">
      <Loader2 className="animate-spin mr-2" /> CARREGANDO MODULO WHATSAPP...
    </div>
  );

  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} font-sans`}>
      
      {/* SIDEBAR */}
      <div className={`w-80 border-r ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} flex flex-col bg-white dark:bg-zinc-900`}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-black italic uppercase tracking-tighter">Conversas</h2>
          {isConnected ? <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> : <Unplug size={16} className="text-red-500"/>}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {leads.length > 0 ? leads.map((lead: any) => (
            <button 
              key={lead.id} 
              onClick={() => setSelectedLead(lead)}
              className={`w-full p-4 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} text-left flex items-center gap-3 transition-all ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 font-bold">
                {lead.name?.[0] || <User size={16}/>}
              </div>
              <div className="truncate">
                <p className="font-bold text-sm truncate">{lead.name || "Sem Nome"}</p>
                <p className="text-[10px] opacity-50 font-mono">{lead.phone}</p>
              </div>
            </button>
          )) : (
            <div className="p-8 text-center opacity-20"><p className="text-xs font-bold italic">Nenhum Lead</p></div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative">
        {!isConnected ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 text-center">
            <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] shadow-2xl">
              <QrCode className="mx-auto text-emerald-500 mb-6" size={48} />
              <h3 className="text-white font-black uppercase italic mb-6">Conectar WhatsApp</h3>
              {qrCode ? (
                <div className="bg-white p-4 rounded-2xl mb-6 shadow-inner"><img src={qrCode} alt="QR" className="w-full h-auto" /></div>
              ) : (
                <button onClick={handleGenerateQR} disabled={loading} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all">
                  {loading ? 'GERANDO...' : 'GERAR QR CODE'}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {selectedLead ? (
          <>
            <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center bg-white dark:bg-zinc-950 font-bold">
              {selectedLead.name}
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50 dark:bg-black">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : 'bg-white dark:bg-zinc-800 border dark:border-zinc-700'}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Escreva..." 
                className="flex-1 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-emerald-500 text-sm"
              />
              <button type="submit" className="p-4 bg-emerald-500 text-white rounded-xl"><Send size={18}/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <MessageSquare size={48} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Selecione um cliente</p>
          </div>
        )}
      </div>
    </div>
  );
}