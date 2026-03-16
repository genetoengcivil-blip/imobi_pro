import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import {
  MessageSquare, Send, QrCode, Unplug, User, Loader2, Moon, Sun, CheckCircle2
} from 'lucide-react';

// 🔒 CONFIGURAÇÕES REAIS
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123";
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode ?? true;
  const setDarkMode = context?.setDarkMode;

  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ CARREGAR MENSAGENS E REALTIME (Sincronizado com o Banco)
  const loadMessages = useCallback(async (leadId: string) => {
    try {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    } catch (e) {
      console.error("Erro ao carregar mensagens:", e);
    }
  }, []);

  useEffect(() => {
    if (!selectedLead?.id) return;

    loadMessages(selectedLead.id);

    // Ouve o banco de dados em tempo real
    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', {
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}`
      }, (payload: any) => {
        setMessages(prev => {
          // Evita duplicados na tela
          if (prev.some(m => m.id === payload.new.id || (m.message_id && m.message_id === payload.new.message_id))) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ VERIFICAR STATUS DA CONEXÃO ORACLE
  const checkStatus = async () => {
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      const state = data.instance?.state || data.state || data.status;
      setIsConnected(state === 'open' || state === 'connected');
    } catch (e) {
      console.log("Erro ao conectar com API Oracle");
      setIsConnected(false);
    } finally {
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 20000); // Checa a cada 20s
    return () => clearInterval(interval);
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
      else checkStatus();
    } catch (e) {
      alert("Erro ao gerar QR Code. Verifique o servidor Oracle.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENVIAR MENSAGEM (O Webhook salvará no banco para nós)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const text = newMessage.trim();
    const phone = selectedLead.phone?.replace(/\D/g, '');
    const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
    setNewMessage('');

    try {
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({ 
          number: cleanPhone, 
          textMessage: { text: text } 
        })
      });
      // A mensagem aparecerá na tela via Realtime assim que o Webhook a processar
    } catch (e) {
      alert("Falha de rede ao enviar mensagem.");
    }
  };

  const filteredLeads = leads.filter((lead: any) =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm)
  );

  if (!initialCheckDone) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 text-white font-mono">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-emerald-500" size={32} />
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Iniciando ImobiPro Chat</p>
      </div>
    </div>
  );

  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} font-sans`}>

      {/* SIDEBAR */}
      <div className={`w-80 flex-shrink-0 border-r flex flex-col ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <h2 className="font-black italic uppercase tracking-tighter text-sm">WhatsApp</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode?.(!darkMode)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {isConnected ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase">Online</span>
              </div>
            ) : (
              <Unplug size={14} className="text-red-500" />
            )}
          </div>
        </div>

        <div className="p-3">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar contato..."
            className={`w-full px-4 py-2 rounded-xl text-xs outline-none ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'} border`}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredLeads.map((lead: any) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`w-full p-4 border-b text-left flex items-center gap-3 transition-all ${
                darkMode ? 'border-zinc-800' : 'border-zinc-100'
              } ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${darkMode ? 'bg-zinc-800 text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}>
                {lead.name?.[0] || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{lead.name}</p>
                <p className="text-[10px] opacity-40 truncate">{lead.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-zinc-50 dark:bg-black">
        {!isConnected && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6">
            <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] text-center shadow-2xl">
              <QrCode className="mx-auto text-emerald-500 mb-6" size={56} />
              <h3 className="text-white font-black uppercase italic mb-6">Conectar WhatsApp</h3>
              {qrCode ? (
                <div className="bg-white p-4 rounded-3xl mb-4 shadow-xl"><img src={qrCode} alt="QR" className="w-full h-auto" /></div>
              ) : (
                <button onClick={handleGenerateQR} disabled={loading} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all">
                  {loading ? 'GERANDO...' : 'GERAR QR CODE'}
                </button>
              )}
            </div>
          </div>
        )}

        {selectedLead ? (
          <>
            <div className={`h-16 px-6 border-b flex items-center justify-between font-bold shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              {selectedLead.name}
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${m.direction === 'sent' ? 'bg-[#0217ff] text-white rounded-br-sm' : (darkMode ? 'bg-zinc-800' : 'bg-white border')}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className={`p-4 border-t flex gap-2 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className={`flex-1 p-3 rounded-xl border ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'} focus:outline-none focus:border-emerald-500`} />
              <button type="submit" className="p-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"><Send size={20}/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
             <MessageSquare size={64} className="mb-4" />
             <p className="font-black uppercase tracking-widest text-xs">Selecione um cliente</p>
          </div>
        )}
      </div>
    </div>
  );
}