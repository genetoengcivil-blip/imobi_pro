import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { 
  MessageSquare, Send, Search, Loader2, Wifi, WifiOff, AlertCircle
} from 'lucide-react';

export default function WhatsAppPage() {
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode || false;
  const user = context?.user;

  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading');
  const [isSending, setIsSending] = useState(false);
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Filtro Seguro
  const filteredLeads = leads.filter((lead: any) => {
    if (!lead) return false;
    const search = searchQuery.toLowerCase();
    const nameMatch = lead.name ? lead.name.toLowerCase().includes(search) : false;
    const phoneMatch = lead.phone ? lead.phone.includes(searchQuery) : false;
    return nameMatch || phoneMatch;
  });

  // Verificação de Status do WhatsApp
  const checkWhatsAppStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, action: 'status' }
      });
      if (error) throw error;
      setConnectionStatus(data?.instance?.state === 'open' ? 'connected' : 'disconnected');
    } catch (err) {
      setConnectionStatus('error');
    }
  }, [user]);

  useEffect(() => {
    checkWhatsAppStatus();
    // Verifica a cada 15 segundos silenciosamente
    const interval = setInterval(checkWhatsAppStatus, 15000);
    return () => clearInterval(interval);
  }, [checkWhatsAppStatus]);

  // Carregar e Sincronizar Mensagens
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
    
    const channel = supabase.channel(`chat-${selectedLead.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `lead_id=eq.${selectedLead.id}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
    }
  }, [messages]);

  // Enviar Mensagem
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !user || isSending || connectionStatus !== 'connected') return;
    
    const msg = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, number: selectedLead.phone, text: msg }
      });
      if (error) throw error;

      await supabase.from('whatsapp_messages').insert([{ 
        lead_id: selectedLead.id, content: msg, direction: 'sent', user_id: user.id 
      }]);
    } catch (err) { 
      setNewMessage(msg);
      alert("Falha ao enviar. Verifique se o telemóvel está conectado.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // VARIÁVEIS DE TEMA SEGURAS (Evita conflitos de classes)
  const theme = {
    bg: darkMode ? 'bg-[#09090b]' : 'bg-[#f8fafc]',
    panelBg: darkMode ? 'bg-[#18181b]' : 'bg-white',
    border: darkMode ? 'border-white/5' : 'border-zinc-200',
    text: darkMode ? 'text-zinc-100' : 'text-zinc-900',
    textMuted: darkMode ? 'text-zinc-500' : 'text-zinc-400',
    hover: darkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50',
    inputBg: darkMode ? 'bg-[#09090b]' : 'bg-zinc-50',
  };

  return (
    <div className={`flex h-[calc(100vh-120px)] rounded-[32px] overflow-hidden border shadow-sm ${theme.panelBg} ${theme.border} ${theme.text} font-['Inter',sans-serif]`}>
      
      {/* LADO ESQUERDO: LISTA DE LEADS */}
      <div className={`w-80 border-r flex flex-col ${theme.border} ${theme.bg}`}>
        <div className={`p-6 border-b space-y-5 ${theme.border}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
              <MessageSquare className="text-[#0217ff]" size={20} /> Chats
            </h2>
            <div title="Status do Servidor">
              {connectionStatus === 'connected' && <Wifi className="text-green-500" size={18} />}
              {connectionStatus === 'disconnected' && <WifiOff className="text-red-500" size={18} />}
              {connectionStatus === 'error' && <AlertCircle className="text-yellow-500" size={18} />}
              {connectionStatus === 'loading' && <Loader2 className="text-[#0217ff] animate-spin" size={18} />}
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-3.5 pl-10 pr-4 rounded-xl text-xs font-bold outline-none border transition-all ${theme.inputBg} ${theme.border} focus:border-[#0217ff]/50`}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredLeads.length === 0 ? (
            <div className={`p-8 text-center text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>
              Nenhum contacto encontrado
            </div>
          ) : (
            filteredLeads.map((lead: any) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <button 
                  key={lead.id} 
                  onClick={() => setSelectedLead(lead)} 
                  className={`w-full p-4 flex items-center gap-4 border-b transition-all ${theme.border} ${
                    isSelected ? 'bg-[#0217ff]/10 border-l-4 border-l-[#0217ff]' : `${theme.hover} border-l-4 border-l-transparent`
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                    darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="text-left overflow-hidden">
                    <div className="font-[900] text-sm truncate">{lead.name || 'Sem Nome'}</div>
                    <div className={`text-[10px] font-bold truncate mt-1 ${theme.textMuted}`}>{lead.phone || 'Sem Número'}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* LADO DIREITO: CHAT */}
      <div className={`flex-1 flex flex-col relative ${theme.panelBg}`}>
        {selectedLead ? (
          <>
            <div className={`px-8 py-6 border-b flex justify-between items-center z-10 ${theme.panelBg} ${theme.border}`}>
              <div>
                <div className="font-black text-lg uppercase tracking-tight">{selectedLead.name}</div>
                <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                  {connectionStatus === 'connected' ? '● Online' : '● Offline / A verificar...'}
                </div>
              </div>
            </div>
            
            <div className={`flex-1 overflow-hidden px-4 ${theme.bg}`}>
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                className="h-full py-6 custom-scrollbar"
                itemContent={(_, m) => {
                  const isSent = m.direction === 'sent';
                  return (
                    <div className={`flex w-full mb-3 ${isSent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-5 py-3.5 rounded-2xl shadow-sm ${
                        isSent 
                        ? 'bg-[#0217ff] text-white rounded-br-none' 
                        : (darkMode ? 'bg-zinc-800 text-white rounded-bl-none' : 'bg-white text-zinc-900 border border-zinc-200 rounded-bl-none')
                      }`}>
                        <p className="text-[13px] font-medium whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        <div className={`text-[9px] mt-2 font-bold uppercase text-right ${isSent ? 'text-blue-200' : theme.textMuted}`}>
                          {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            <div className={`p-5 border-t flex gap-3 items-end ${theme.panelBg} ${theme.border}`}>
              <div className={`flex-1 rounded-2xl border overflow-hidden flex items-end transition-all focus-within:border-[#0217ff] ${theme.inputBg} ${theme.border}`}>
                <textarea 
                  value={newMessage} 
                  onChange={e => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }} 
                  onKeyDown={handleKeyDown}
                  disabled={connectionStatus !== 'connected'}
                  placeholder={connectionStatus === 'connected' ? "Escreva a sua mensagem..." : "Aguardando conexão com o telemóvel..."}
                  className="w-full max-h-[120px] p-4 bg-transparent outline-none font-medium text-sm resize-none custom-scrollbar disabled:opacity-50" 
                  rows={1}
                />
              </div>

              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending || connectionStatus !== 'connected'}
                className="p-4 bg-[#0217ff] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shrink-0 shadow-lg shadow-[#0217ff]/20"
              >
                {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20}/>}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-60">
            <div className="w-24 h-24 bg-[#0217ff]/10 rounded-[32px] flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-[#0217ff]" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Central de Comunicação</h3>
            <p className={`text-sm font-medium max-w-sm ${theme.textMuted}`}>
              Selecione um cliente na lista à esquerda para iniciar o atendimento.
            </p>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
      `}</style>
    </div>
  );
}