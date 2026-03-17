import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'; // Importação para Virtualização
import { 
  MessageSquare, Send, QrCode, Loader2, Smartphone, User 
} from 'lucide-react';

export default function WhatsAppPage() {
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode || false;
  const user = context?.user;

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Referência para controlo do scroll na lista virtualizada
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // ✅ 1. GERIR MENSAGENS COM REALTIME
  const loadMessages = useCallback(async (leadId: string) => {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    loadMessages(selectedLead.id);

    const channel = supabase
      .channel(`chat-${selectedLead.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  // Scroll automático para a última mensagem quando as mensagens mudam
  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // ✅ 2. STATUS DA INSTÂNCIA
  const checkStatus = useCallback(async () => {
    if (!user?.id) return;
    setIsConnected(true); // Lógica de UI simplificada
  }, [user]);

  useEffect(() => {
    if (!initialCheckDone) {
      checkStatus();
      setInitialCheckDone(true);
    }
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus, initialCheckDone]);

  // ✅ 3. ENVIO SEGURO (VIA PROXY)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !user) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const { error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: {
          instance: user.id,
          number: selectedLead.phone.replace(/\D/g, ""),
          text: messageContent
        }
      });

      if (error) throw error;

      await supabase.from('whatsapp_messages').insert([{
        lead_id: selectedLead.id,
        content: messageContent,
        direction: 'sent',
        user_id: user.id
      }]);

    } catch (err) {
      console.error("Erro no envio:", err);
    }
  };

  return (
    <div className={`flex h-[calc(100vh-140px)] rounded-[32px] overflow-hidden border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200'}`}>
      
      {/* LISTA DE LEADS (ESQUERDA) */}
      <div className={`w-80 border-r flex flex-col ${darkMode ? 'border-white/5 bg-black' : 'border-zinc-100 bg-zinc-50'}`}>
        <div className="p-6 border-b dark:border-white/5">
          <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <MessageSquare className="text-[#0217ff]" size={20} /> Chat
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leads.map((lead: any) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`w-full p-4 flex items-center gap-4 transition-all border-b dark:border-white/5 ${
                selectedLead?.id === lead.id 
                ? (darkMode ? 'bg-[#0217ff]/10 border-r-4 border-r-[#0217ff]' : 'bg-white border-r-4 border-r-[#0217ff]') 
                : 'hover:bg-white/5'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-white/5 flex items-center justify-center font-black text-zinc-400 uppercase">
                {lead.name.charAt(0)}
              </div>
              <div className="text-left overflow-hidden">
                <div className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{lead.name}</div>
                <div className="text-[10px] font-black text-zinc-500 uppercase truncate">{lead.source || 'Lead Direto'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DO CHAT VIRTUALIZADO (DIREITA) */}
      <div className="flex-1 flex flex-col bg-transparent relative">
        {selectedLead ? (
          <>
            <div className={`p-6 border-b font-black uppercase tracking-widest text-[11px] z-10 ${darkMode ? 'border-white/5 text-white bg-zinc-900' : 'bg-white shadow-sm'}`}>
              Conversa com: <span className="text-[#0217ff]">{selectedLead.name}</span>
            </div>
            
            {/* COMPONENTE DE VIRTUALIZAÇÃO */}
            <div className="flex-1 overflow-hidden">
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                initialTopMostItemIndex={messages.length - 1}
                followOutput="smooth"
                itemContent={(index, m) => (
                  <div className={`flex p-4 ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-[24px] shadow-sm ${
                      m.direction === 'sent' 
                      ? 'bg-[#0217ff] text-white rounded-br-none' 
                      : (darkMode ? 'bg-zinc-800 border-zinc-700 text-white rounded-bl-none' : 'bg-white border text-zinc-900 rounded-bl-none')
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{m.content}</p>
                      <div className={`text-[9px] mt-1 opacity-50 font-black uppercase ${m.direction === 'sent' ? 'text-right' : 'text-left'}`}>
                        {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>

            <form onSubmit={handleSendMessage} className={`p-6 border-t flex gap-3 ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white'}`}>
              <input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Escreva uma mensagem..." 
                className="flex-1 p-4 rounded-2xl border dark:bg-zinc-900 dark:border-white/5 focus:outline-none focus:border-[#0217ff] transition-all font-medium text-sm" 
              />
              <button 
                type="submit" 
                className="p-4 bg-[#0217ff] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
              >
                <Send size={20}/>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-[#0217ff]/10 rounded-[32px] flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-[#0217ff]" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Selecione um cliente</h3>
            <p className="text-zinc-500 text-sm max-w-xs font-medium">Escolha um lead na lista lateral para iniciar ou continuar o atendimento via WhatsApp.</p>
          </div>
        )}
      </div>
    </div>
  );
}