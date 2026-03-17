import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { 
  MessageSquare, Send, Search, Loader2, Wifi, WifiOff, RefreshCw, AlertCircle
} from 'lucide-react';

export default function WhatsAppPage() {
  // 1. DADOS GLOBAIS COM PROTEÇÃO CONTRA UNDEFINED
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode || false;
  const user = context?.user;

  // 2. ESTADOS DA PÁGINA
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading');
  const [isSending, setIsSending] = useState(false);
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // 3. FILTRO DE LEADS (Protegido)
  const filteredLeads = leads.filter((lead: any) => {
    const search = searchQuery.toLowerCase();
    const nameMatch = lead?.name?.toLowerCase().includes(search);
    const phoneMatch = lead?.phone?.includes(searchQuery);
    return nameMatch || phoneMatch;
  });

  // 4. VERIFICAÇÃO DE STATUS DA EDGE FUNCTION
  const checkWhatsAppStatus = useCallback(async () => {
    if (!user?.id) return;
    setConnectionStatus('loading');
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, action: 'status' }
      });
      
      if (error) throw error;
      
      if (data?.instance?.state === 'open') {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      console.error("Erro ao verificar WhatsApp:", err);
      setConnectionStatus('error');
    }
  }, [user]);

  // Executa ao abrir a página
  useEffect(() => {
    checkWhatsAppStatus();
  }, [checkWhatsAppStatus]);

  // 5. CARREGAR MENSAGENS E ESCUTAR O SUPABASE
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
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages', 
        filter: `lead_id=eq.${selectedLead.id}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  // Faz scroll para baixo quando chegam novas mensagens
  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
    }
  }, [messages]);

  // 6. ENVIO DE MENSAGEM
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !user || isSending) return;
    
    const msg = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // Tenta enviar via Edge Function
      const { error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, number: selectedLead.phone, text: msg }
      });

      if (error) throw error;

      // Se sucesso, guarda no banco
      await supabase.from('whatsapp_messages').insert([{ 
        lead_id: selectedLead.id, 
        content: msg, 
        direction: 'sent', 
        user_id: user.id 
      }]);

    } catch (err) { 
      console.error(err);
      alert("Falha ao enviar. Verifique o status da conexão.");
      setNewMessage(msg); // Devolve o texto em caso de erro
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

  // 7. RENDERIZAÇÃO (ESTILOS PROTEGIDOS E CONSISTENTES)
  const bgMain = darkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900';
  const borderCol = darkMode ? 'border-white/10' : 'border-zinc-200';
  const bgPanel = darkMode ? 'bg-zinc-950' : 'bg-white';
  const bgHover = darkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50';

  return (
    <div className={`flex h-[calc(100vh-120px)] rounded-[32px] overflow-hidden border shadow-sm ${bgPanel} ${borderCol} ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* --- COLUNA ESQUERDA: LISTA DE LEADS --- */}
      <div className={`w-80 border-r flex flex-col ${borderCol} ${bgMain}`}>
        
        {/* Cabeçalho Esquerdo */}
        <div className={`p-6 border-b space-y-4 ${borderCol}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
              <MessageSquare className="text-[#0217ff]" size={20} /> Chats
            </h2>
            
            {/* Ícone de Status do WhatsApp */}
            <div className="flex items-center gap-2">
              <button onClick={checkWhatsAppStatus} className="p-1 hover:opacity-70 transition-opacity" title="Atualizar Status">
                <RefreshCw size={14} className={`text-zinc-500 ${connectionStatus === 'loading' ? 'animate-spin' : ''}`} />
              </button>
              {connectionStatus === 'connected' && <Wifi className="text-green-500" size={18} title="Conectado" />}
              {connectionStatus === 'disconnected' && <WifiOff className="text-yellow-500" size={18} title="Desconectado" />}
              {connectionStatus === 'error' && <AlertCircle className="text-red-500" size={18} title="Erro na API" />}
            </div>
          </div>
          
          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-3 pl-10 pr-4 rounded-xl text-xs font-bold outline-none border transition-all ${
                darkMode ? 'bg-zinc-900 border-white/5 focus:border-[#0217ff]' : 'bg-white border-zinc-200 focus:border-[#0217ff]'
              }`}
            />
          </div>
        </div>
        
        {/* Lista de Leads */}
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filteredLeads.map((lead: any) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <button 
                  key={lead.id} 
                  onClick={() => setSelectedLead(lead)} 
                  className={`w-full p-4 flex items-center gap-4 border-b transition-all ${borderCol} ${
                    isSelected 
                      ? (darkMode ? 'bg-[#0217ff]/20 border-l-4 border-l-[#0217ff]' : 'bg-blue-50 border-l-4 border-l-[#0217ff]') 
                      : `${bgHover} border-l-4 border-l-transparent`
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 ${
                    darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-500'
                  }`}>
                    {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="text-left overflow-hidden">
                    <div className="font-bold text-sm truncate">{lead.name || 'Sem Nome'}</div>
                    <div className="text-[10px] text-zinc-500 font-bold truncate mt-1">{lead.phone || 'Sem Número'}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* --- COLUNA DIREITA: ÁREA DO CHAT --- */}
      <div className={`flex-1 flex flex-col relative ${bgPanel}`}>
        {selectedLead ? (
          <>
            {/* Cabeçalho do Chat */}
            <div className={`px-8 py-5 border-b flex justify-between items-center z-10 ${borderCol}`}>
              <div>
                <div className="font-black text-lg uppercase tracking-tight">{selectedLead.name}</div>
                <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                  connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {connectionStatus === 'connected' ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE / VERIFICANDO...'}
                </div>
              </div>
            </div>
            
            {/* Histórico de Mensagens */}
            <div className={`flex-1 overflow-hidden px-4 ${darkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                className="h-full py-6"
                itemContent={(index, m) => {
                  const isSent = m.direction === 'sent';
                  return (
                    <div className={`flex w-full mb-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                        isSent 
                        ? 'bg-[#0217ff] text-white rounded-br-none' 
                        : (darkMode ? 'bg-zinc-800 text-white rounded-bl-none' : 'bg-white text-black border border-zinc-200 rounded-bl-none')
                      }`}>
                        <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        <div className={`text-[9px] mt-1 font-bold uppercase text-right ${
                          isSent ? 'text-blue-200' : 'text-zinc-500'
                        }`}>
                          {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            {/* Input de Envio */}
            <div className={`p-4 border-t flex gap-3 items-end ${borderCol}`}>
              <div className={`flex-1 rounded-[24px] border overflow-hidden flex items-end transition-all focus-within:border-[#0217ff] ${
                darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-300'
              }`}>
                <textarea 
                  value={newMessage} 
                  onChange={e => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }} 
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva a mensagem... (Shift + Enter para pular linha)" 
                  className="w-full max-h-[120px] p-4 bg-transparent outline-none font-medium text-sm resize-none" 
                  rows={1}
                />
              </div>

              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending || connectionStatus !== 'connected'}
                className="p-4 bg-[#0217ff] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shrink-0"
              >
                {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20}/>}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-60">
            <MessageSquare size={64} className="mb-6 text-[#0217ff]" />
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Central de Atendimento</h3>
            <p className="text-zinc-500 text-sm font-medium max-w-sm">
              Selecione um cliente na lista à esquerda para começar a trocar mensagens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}