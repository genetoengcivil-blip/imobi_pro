import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, QrCode, Loader2, Unplug, User, Smartphone } from 'lucide-react';

const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123";
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
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

  // ✅ 1. GERIR MENSAGENS (Realtime + Histórico)
  const loadMessages = useCallback(async (leadId: string) => {
    if (!leadId) return;
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  useEffect(() => {
    if (!selectedLead?.id) return;
    loadMessages(selectedLead.id);

    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}` 
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.message_id === payload.new.message_id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ 2. VERIFICAR STATUS DA INSTÂNCIA
  const checkStatus = async () => {
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      const state = data?.instance?.state || data?.state || data?.status;
      setIsConnected(state === 'open' || state === 'connected');
    } catch (e) {
      setIsConnected(false);
    } finally {
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateQR = async () => {
    setLoading(true);
    setQrCode('');
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data?.base64) setQrCode(data.base64);
    } catch (e) {
      alert("Erro ao conectar com a Oracle.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. ENVIAR MENSAGEM (O Webhook tratará de salvar no banco)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead?.phone) return;

    const content = newMessage;
    const phone = selectedLead.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    setNewMessage('');

    try {
      // Formato exato para Evolution API v1.8+
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({
          number: cleanPhone,
          textMessage: { text: content }
        })
      });
    } catch (e) {
      console.error("Erro de envio");
    }
  };

  if (!initialCheckDone) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 text-emerald-500 font-mono text-xs">
      <Loader2 className="animate-spin mr-2" /> RECONECTANDO...
    </div>
  );

  if (!isConnected) {
    return (
      <div className={`h-screen flex items-center justify-center p-6 ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white'}`}>
        <div className="max-w-sm w-full p-10 rounded-[40px] border border-zinc-200 dark:border-zinc-800 text-center shadow-2xl">
          <QrCode className="mx-auto text-emerald-500 mb-6" size={56} />
          <h2 className="text-xl font-black uppercase italic mb-6">WhatsApp Hub</h2>
          <div className="bg-white p-4 rounded-3xl inline-block border-2 border-emerald-500 mb-6">
            {qrCode ? (
              <img src={qrCode} alt="QR" className="w-48 h-48" />
            ) : (
              <button onClick={handleGenerateQR} disabled={loading} className="p-4 text-emerald-500 font-bold uppercase text-xs tracking-widest">
                {loading ? 'A carregar...' : 'Gerar QR Code'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      {/* Sidebar */}
      <div className={`w-80 border-r flex flex-col ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="p-4 border-b font-black uppercase italic text-emerald-500 text-[10px] tracking-[0.2em]">Conversas</div>
        <div className="flex-1 overflow-y-auto">
          {leads.map((lead: any) => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-3 border-b transition-all ${darkMode ? 'border-zinc-800' : 'border-zinc-100'} ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''}`}>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center font-bold text-emerald-500">{lead.name?.[0] || "?"}</div>
              <div className="text-left truncate">
                <p className="font-bold text-sm truncate">{lead.name || "Sem Nome"}</p>
                <p className="text-[10px] opacity-40">{lead.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-black">
        {selectedLead ? (
          <>
            <div className={`h-16 p-4 border-b flex items-center font-bold ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white'}`}>
              {selectedLead.name}
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${m.direction === 'sent' ? 'bg-[#0217ff] text-white rounded-br-none' : (darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border')}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className={`p-4 border-t flex gap-2 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white'}`}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className="flex-1 p-3 rounded-xl border dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none" />
              <button type="submit" className="p-4 bg-emerald-500 text-white rounded-xl"><Send size={18}/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 font-black uppercase tracking-widest text-xs">
            <Smartphone size={48} className="mb-4" /> Selecione um cliente
          </div>
        )}
      </div>
    </div>
  );
}