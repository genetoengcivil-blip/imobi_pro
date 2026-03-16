import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, QrCode, Loader2, Smartphone, User } from 'lucide-react';

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

  // Buscar leads iniciais
  useEffect(() => {
    const loadLeads = async () => {
      const { data } = await supabase.from('leads').select('*').order('name');
      if (data) setLeads(data);
    };
    loadLeads();
  }, []);

  // ✅ REALTIME: O segredo para receber mensagens na hora
  useEffect(() => {
    if (!selectedLead) return;
    
    // Carregar histórico
    const loadMessages = async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    loadMessages();

    // Ouvir novas mensagens no banco em tempo real
    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}` 
      }, (payload) => {
        setMessages(prev => {
          // Evita duplicados na interface
          if (prev.some(m => m.message_id === payload.new.message_id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Verificar status da conexão
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        const data = await res.json();
        const state = data.instance?.state || data.state;
        setIsConnected(state === 'open');
      } catch (e) { console.log('Offline'); }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Enviar mensagem (Simplificado para evitar duplicação)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const text = newMessage;
    setNewMessage('');

    try {
      // ✅ APENAS ENVIAMOS. O Webhook salvará no banco e o Realtime mostrará na tela.
      const phone = selectedLead.phone?.replace(/\D/g, '');
      const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
      
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({ number: cleanPhone, textMessage: { text: text } })
      });
    } catch (err) {
      console.error('Erro de rede');
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) setQrCode(data.base64);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!isConnected) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-black'}`}>
        <div className={`max-w-md w-full rounded-[40px] p-10 border shadow-2xl text-center ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
          <QrCode className="mx-auto text-emerald-500 mb-6" size={56} />
          <h2 className="text-2xl font-black italic uppercase mb-8">Conectar WhatsApp</h2>
          <div className="bg-white p-4 rounded-3xl inline-block border-2 border-dashed border-emerald-500 shadow-inner">
            {qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            ) : (
              <button onClick={handleGenerateQR} disabled={loading} className="p-4 font-bold text-emerald-600">
                {loading ? 'GERANDO...' : 'CLIQUE PARA GERAR QR'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-zinc-900'}`}>
      {/* Sidebar */}
      <div className={`w-80 border-r flex flex-col ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
        <div className="p-4 border-b font-black uppercase italic text-emerald-500 text-xs tracking-widest">Conversas</div>
        <div className="flex-1 overflow-y-auto">
          {leads.map(lead => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`w-full p-4 flex gap-3 border-b transition-all ${darkMode ? 'border-zinc-800/50' : 'border-gray-100'} ${
                selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''
              }`}
            >
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center font-bold text-emerald-500">{lead.name?.[0] || "?"}</div>
              <div className="text-left truncate">
                <p className="font-bold text-sm truncate">{lead.name}</p>
                <p className="text-[10px] opacity-40">{lead.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area - ✅ CORREÇÃO DA TELA PRETA */}
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-black' : 'bg-white'}`}>
        {selectedLead ? (
          <>
            <div className={`h-16 p-4 border-b flex items-center font-bold ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white shadow-sm'}`}>
              {selectedLead.name}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                      msg.direction === 'sent' 
                        ? 'bg-[#0217ff] text-white rounded-br-none' 
                        : (darkMode ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'bg-white border border-gray-200')
                    }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className={`p-4 border-t flex gap-2 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white'}`}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className={`flex-1 p-3 rounded-xl border outline-none ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-gray-100 border-transparent'}`}
              />
              <button type="submit" className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <MessageSquare size={64} />
            <p className="mt-4 font-bold uppercase tracking-widest text-xs">Selecione um cliente</p>
          </div>
        )}
      </div>
    </div>
  );
}