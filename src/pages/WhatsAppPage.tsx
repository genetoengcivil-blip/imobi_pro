import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, Send, QrCode, Unplug, Smartphone, 
  Search, RefreshCw, Loader2, AlertCircle, CheckCircle2 
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

  // ✅ 1. GERENCIAR MENSAGENS (Realtime)
  useEffect(() => {
    if (!selectedLead?.id) return;

    const loadMsgs = async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    loadMsgs();

    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `lead_id=eq.${selectedLead.id}` },
        (payload) => {
          setMessages(prev => {
            const exists = prev.some(m => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ 2. DETETOR UNIVERSAL DE CONEXÃO
  const checkConnection = async () => {
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      
      // Verifica todas as formas possíveis que a API responde "Conectado"
      const status = data.instance?.state || data.instance?.status || data.state || data.status;
      
      if (status === 'open' || status === 'connected') {
        setIsConnected(true);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    } finally {
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Checa a cada 10s
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
      else checkConnection();
    } catch (err) {
      alert('Erro ao conectar com servidor Oracle.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const content = newMessage;
    const phone = selectedLead.phone?.replace(/\D/g, '');
    const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
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
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  const theme = {
    bgApp: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    bgCard: darkMode ? 'bg-zinc-900' : 'bg-white',
    border: darkMode ? 'border-zinc-800' : 'border-zinc-200',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  if (!initialCheckDone) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  // 🔴 TELA DE CONEXÃO (Se não estiver conectado)
  if (!isConnected) {
    return (
      <div className={`h-screen flex items-center justify-center ${theme.bgApp} p-6`}>
        <div className={`max-w-md w-full p-10 rounded-[40px] border ${theme.border} ${theme.bgCard} text-center shadow-2xl`}>
          <QrCode className="mx-auto text-emerald-500 mb-6" size={56} />
          <h2 className={`text-2xl font-black uppercase italic ${theme.text} mb-2`}>WhatsApp Hub</h2>
          <p className="text-zinc-500 text-sm mb-8">Escaneie o código para liberar o chat</p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 aspect-square rounded-3xl mb-8 flex items-center justify-center overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-700">
            {qrCode ? (
              <img src={qrCode} alt="QR" className="w-full h-full p-4" />
            ) : (
              <button onClick={handleGenerateQR} disabled={loading} className="p-4 bg-emerald-500 text-white rounded-xl font-bold hover:scale-105 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : 'GERAR QR CODE'}
              </button>
            )}
          </div>

          {/* 🚨 BOTÃO DE EMERGÊNCIA SE A TELA NÃO ABRIR SOZINHA */}
          {qrCode && (
            <button 
              onClick={checkConnection}
              className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:opacity-70"
            >
              <CheckCircle2 size={14} /> Já escaneei, entrar no chat
            </button>
          )}
        </div>
      </div>
    );
  }

  // 🟢 TELA DO CHAT (Se estiver conectado)
  return (
    <div className={`h-[calc(100vh-80px)] flex ${theme.bgApp} ${theme.text}`}>
      <div className={`w-80 border-r ${theme.border} flex flex-col bg-white dark:bg-zinc-900`}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-black uppercase italic tracking-tighter">Conversas</h2>
          <button onClick={() => setIsConnected(false)} className="text-zinc-400 hover:text-red-500"><Unplug size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leads.map((lead: any) => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex gap-3 border-b ${theme.border} ${selectedLead?.id === lead.id ? 'bg-emerald-500/10' : ''}`}>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center font-bold text-emerald-500">{lead.name?.[0] || "?"}</div>
              <div className="text-left truncate font-medium">{lead.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedLead ? (
          <>
            <div className="h-16 p-6 border-b flex items-center justify-between font-bold bg-white dark:bg-zinc-950">{selectedLead.name}</div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : 'bg-white dark:bg-zinc-800 border ' + theme.border}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mensagem..." className={`flex-1 p-3 rounded-xl border ${theme.border} dark:bg-zinc-900 focus:outline-none`} />
              <button type="submit" className="p-3 bg-emerald-500 text-white rounded-xl"><Send size={20}/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20"><Smartphone size={64} /><p className="mt-4 font-bold">Selecione um cliente</p></div>
        )}
      </div>
    </div>
  );
}