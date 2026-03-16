import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, Send, QrCode, Unplug, User, Loader2, Smartphone 
} from 'lucide-react';

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

  // ✅ 1. GERENCIAR MENSAGENS COM REALTIME
  const loadMessages = useCallback(async (leadId: string) => {
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

    // Escuta em tempo real
    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', {
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}`
      }, (payload) => {
        setMessages(prev => {
          // Filtro rigoroso contra duplicados na interface
          if (prev.some(m => m.id === payload.new.id || m.message_id === payload.new.message_id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ 2. VERIFICAR STATUS DA CONEXÃO
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        const data = await res.json();
        const state = data.instance?.state || data.state || data.status;
        setIsConnected(state === 'open' || state === 'connected');
      } catch (e) {
        setIsConnected(false);
      } finally {
        setInitialCheckDone(true);
      }
    };
    checkStatus();
  }, []);

  const handleGenerateQR = async () => {
    setLoading(true);
    setQrCode('');
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) setQrCode(data.base64);
    } catch (e) {
      alert("Erro ao conectar com a Oracle.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. ENVIAR MENSAGEM (O Webhook fará o resto)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const content = newMessage.trim();
    const phone = selectedLead.phone?.replace(/\D/g, '');
    const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
    setNewMessage('');

    try {
      // Enviamos apenas para a Evolution API
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({
          number: cleanPhone,
          textMessage: { text: content }
        })
      });
    } catch (e) {
      alert("Falha ao enviar.");
    }
  };

  if (!initialCheckDone) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  if (!isConnected) {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-zinc-950' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full p-10 rounded-[40px] border ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200'} text-center shadow-2xl`}>
          <QrCode className="mx-auto text-emerald-500 mb-6" size={56} />
          <h2 className="text-2xl font-black uppercase italic mb-6 tracking-tighter">WhatsApp Hub</h2>
          {qrCode ? (
            <div className="bg-white p-4 rounded-3xl inline-block border-2 border-emerald-500"><img src={qrCode} alt="QR" className="w-48 h-48" /></div>
          ) : (
            <button onClick={handleGenerateQR} disabled={loading} className="w-full p-4 bg-emerald-500 text-white font-black rounded-2xl hover:scale-105 transition-all">
              {loading ? 'GERANDO...' : 'GERAR QR CODE'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-zinc-900'}`}>
      {/* Sidebar */}
      <div className={`w-80 border-r ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'} flex flex-col`}>
        <div className="p-4 border-b font-black uppercase italic text-emerald-500 tracking-widest text-xs">Conversas</div>
        <div className="flex-1 overflow-y-auto">
          {(leads || []).map((lead: any) => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-3 border-b ${darkMode ? 'border-zinc-800' : 'border-gray-200'} ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''}`}>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center font-bold text-emerald-500">{lead.name?.[0] || "?"}</div>
              <div className="text-left truncate">
                <p className="font-bold text-sm truncate">{lead.name}</p>
                <p className="text-[10px] opacity-40">{lead.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedLead ? (
          <>
            <div className={`h-16 p-4 border-b flex items-center justify-between font-bold ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white'}`}>
              <span>{selectedLead.name}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 dark:bg-black bg-zinc-50">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : (darkMode ? 'bg-zinc-800' : 'bg-white border')}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className={`p-4 border-t flex gap-2 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white'}`}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className={`flex-1 p-3 rounded-xl border ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100'} focus:outline-none`} />
              <button type="submit" className="p-3 bg-emerald-500 text-white rounded-xl"><Send size={20}/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20"><Smartphone size={64} /><p className="mt-4 font-bold uppercase tracking-widest text-xs">Selecione um cliente</p></div>
        )}
      </div>
    </div>
  );
}