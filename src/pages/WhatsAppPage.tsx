import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, QrCode, Loader2, User, Smartphone, AlertTriangle } from 'lucide-react';

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
  const [ready, setReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        const data = await res.json();
        setIsConnected(data?.instance?.state === 'open' || data?.state === 'open');
      } catch (e) { setIsConnected(false); }
      finally { setReady(true); }
    };
    check();
  }, []);

  useEffect(() => {
    if (!selectedLead?.id) return;
    setMessages([]); // Limpa chat ao trocar de lead

    supabase.from('whatsapp_messages').select('*').eq('lead_id', selectedLead.id).order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });

    const channel = supabase.channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `lead_id=eq.${selectedLead.id}` }, 
      (payload) => {
        setMessages(prev => prev.some(m => m.message_id === payload.new.message_id) ? prev : [...prev, payload.new]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead?.phone) return;
    const txt = newMessage;
    const cleanPhone = selectedLead.phone.replace(/\D/g, '').replace(/^(\d{2})(\d{9})$/, '$1$2');
    setNewMessage('');

    try {
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({ number: cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`, textMessage: { text: txt } })
      });
    } catch (e) { alert("Erro ao enviar."); }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, { headers: { 'apikey': EVO_GLOBAL_KEY } });
      const data = await res.json();
      if (data?.base64) setQrCode(data.base64);
    } catch (e) { alert("Erro na API."); }
    finally { setLoading(false); }
  };

  if (!ready) return <div className="h-screen bg-black flex items-center justify-center text-white">Sincronizando...</div>;

  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      {/* Sidebar */}
      <div className={`w-80 border-r flex flex-col ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="p-4 border-b font-bold uppercase text-[10px] text-emerald-500">Contatos</div>
        <div className="flex-1 overflow-y-auto">
          {leads.map((lead: any) => (
            <button key={lead?.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-3 border-b border-zinc-800/20 ${selectedLead?.id === lead?.id ? 'bg-emerald-500/10' : ''}`}>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500 font-bold">{lead?.name?.[0] || "?"}</div>
              <div className="text-left truncate">
                <p className="font-bold text-sm">{lead?.name || "Sem Nome"}</p>
                <p className="text-[10px] opacity-40">{lead?.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative bg-zinc-50 dark:bg-black">
        {!isConnected && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6">
            <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] text-center">
              <QrCode className="mx-auto text-emerald-500 mb-6" size={48} />
              <h3 className="text-white font-bold mb-6">Conectar WhatsApp</h3>
              {qrCode ? <img src={qrCode} alt="QR" className="bg-white p-2 rounded-2xl mb-4" /> : 
              <button onClick={handleGenerateQR} className="w-full py-4 bg-emerald-500 text-white rounded-2xl">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'GERAR QR'}</button>}
            </div>
          </div>
        )}

        {selectedLead ? (
          <>
            <div className={`h-16 p-4 border-b flex items-center font-bold ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white'}`}>{selectedLead.name}</div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : 'bg-white dark:bg-zinc-800 border dark:border-zinc-700'}`}>
                    <p className="text-sm">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-950 border-t flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className="flex-1 p-3 rounded-xl border dark:bg-zinc-900 focus:outline-none" />
              <button type="submit" className="p-4 bg-emerald-500 text-white rounded-xl"><Send size={18}/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10"><Smartphone size={64} /><p className="mt-4 font-bold uppercase text-xs">Selecione um cliente</p></div>
        )}
      </div>
    </div>
  );
}