import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123";
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { darkMode } = useGlobal() as any;
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLeads = async () => {
      const { data } = await supabase.from('leads').select('*').order('name');
      if (data) setLeads(data);
    };
    loadLeads();
  }, []);

  // ✅ GERENCIAR MENSAGENS COM REALTIME
  useEffect(() => {
    if (!selectedLead) return;
    
    const loadMessages = async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    loadMessages();

    // Ativa escuta em tempo real: o chat atualiza sozinho quando o Webhook insere no banco
    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}` 
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id || m.message_id === payload.new.message_id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Verificar status da conexão com a Oracle
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        if (res.ok) {
          const data = await res.json();
          const state = data.instance?.state || data.state || data.status;
          setIsConnected(state === 'open' || state === 'connected');
        }
      } catch (e) {}
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) setQrCode(data.base64);
      else if (data.status === 'open') setIsConnected(true);
    } catch (err) {} finally { setLoading(false); }
  };

  // ✅ ENVIAR MENSAGEM (O Webhook se encarrega de atualizar a tela)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const phone = selectedLead.phone?.replace(/\D/g, '');
      const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
      
      // Payload corrigido para a Evolution API v1.8+
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({
          number: cleanPhone,
          textMessage: { text: text }
        })
      });
    } catch (err) {
      console.error('Erro ao enviar:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-black text-white' : 'bg-gray-50'}`}>
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl p-10 text-center border dark:border-gray-800">
          <h1 className="text-2xl font-black uppercase italic mb-6">WhatsApp Hub</h1>
          <div className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center mb-8 bg-gray-50 dark:bg-gray-800 overflow-hidden">
            {qrCode ? (
              <img src={qrCode} alt="QR" className="w-full h-full p-4" />
            ) : (
              <button onClick={handleGenerateQR} disabled={loading} className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold hover:scale-105 transition-all">
                {loading ? 'GERANDO...' : 'CONECTAR AGORA'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 font-bold uppercase text-xs tracking-widest text-green-500">Conversas</div>
        <div className="overflow-y-auto flex-1">
          {leads.map(lead => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-700 transition-colors ${selectedLead?.id === lead.id ? 'bg-green-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <div className="font-bold text-sm">{lead.name}</div>
              <div className="text-[10px] opacity-50">{lead.phone}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black">
        {selectedLead ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 font-bold">{selectedLead.name}</div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${msg.direction === 'sent' ? 'bg-[#0217ff] text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-bl-none'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className="flex-1 p-3 rounded-xl border dark:bg-gray-900 focus:outline-none focus:border-green-500" />
                <button type="submit" disabled={!newMessage.trim()} className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold">Enviar</button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-20 font-bold uppercase tracking-widest">Selecione um cliente</div>
        )}
      </div>
    </div>
  );
}