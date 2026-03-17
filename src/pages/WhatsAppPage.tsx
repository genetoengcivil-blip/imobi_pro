import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { 
  MessageSquare, Send, Paperclip, FileText, Loader2, Search, 
  CheckCircle2, AlertTriangle, Wifi, WifiOff, RefreshCw
} from 'lucide-react';

export default function WhatsAppPage() {
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode || false;
  const user = context?.user;

  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading');
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ✅ NOVO: Verificar se o WhatsApp está conectado de verdade
  const checkWhatsAppStatus = useCallback(async () => {
    if (!user?.id) return;
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
      console.error("Erro ao validar conexão:", err);
      setConnectionStatus('error');
    }
  }, [user]);

  useEffect(() => {
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 30000); // Checa a cada 30s
    return () => clearInterval(interval);
  }, [checkWhatsAppStatus]);

  const filteredLeads = leads.filter((lead: any) => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (lead.phone && lead.phone.includes(searchQuery))
  );

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
    
    // Escuta em tempo real do Supabase
    const channel = supabase.channel(`chat-${selectedLead.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages', 
        filter: `lead_id=eq.${selectedLead.id}` 
      }, (p) => {
        setMessages(prev => [...prev, p.new]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !user) return;
    
    const msg = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, number: selectedLead.phone.replace(/\D/g, ""), text: msg }
      });

      if (error) throw error;

      await supabase.from('whatsapp_messages').insert([{ 
        lead_id: selectedLead.id, 
        content: msg, 
        direction: 'sent', 
        user_id: user.id 
      }]);

    } catch (err) { 
      alert("Falha ao enviar. Verifique se o seu WhatsApp está conectado no menu 'Conexão'.");
      setNewMessage(msg); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex h-[calc(100vh-140px)] rounded-[32px] overflow-hidden border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200'}`}>
      
      {/* BARRA LATERAL DE LEADS */}
      <div className={`w-80 border-r flex flex-col ${darkMode ? 'border-white/5 bg-black' : 'border-zinc-100 bg-zinc-50'}`}>
        <div className="p-6 border-b dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-[900] italic uppercase tracking-tighter flex items-center gap-2">
              <MessageSquare className="text-[#0217ff]" size={18} /> Chats
            </h2>
            {/* INDICADOR DE STATUS DA INSTÂNCIA */}
            <div title="Status da Conexão">
              {connectionStatus === 'connected' ? <Wifi className="text-green-500" size={16} /> : 
               connectionStatus === 'disconnected' ? <WifiOff className="text-red-500" size={16} /> : 
               <Loader2 className="animate-spin text-zinc-500" size={16} />}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input 
              type="text" placeholder="Buscar..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-9 pr-4 rounded-xl text-xs font-bold bg-zinc-900/50 border border-white/5 outline-none focus:border-[#0217ff]/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.map((lead: any) => (
            <button 
              key={lead.id} onClick={() => setSelectedLead(lead)} 
              className={`w-full p-4 flex items-center gap-4 border-b dark:border-white/5 transition-all ${selectedLead?.id === lead.id ? 'bg-[#0217ff]/10 border-l-4 border-l-[#0217ff]' : 'hover:bg-white/5 border-l-4 border-l-transparent'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-zinc-500">{lead.name.charAt(0)}</div>
              <div className="text-left overflow-hidden">
                <div className="font-[900] text-sm truncate">{lead.name}</div>
                <div className="text-[10px] text-zinc-500 font-bold">{lead.phone}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DO CHAT */}
      <div className="flex-1 flex flex-col relative">
        {selectedLead ? (
          <>
            <div className={`px-8 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white'}`}>
              <div>
                <div className="font-[900] uppercase italic tracking-tight">{selectedLead.name}</div>
                <div className={`text-[9px] font-black uppercase flex items-center gap-1 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                  {connectionStatus === 'connected' ? '● Online' : '● Sistema Offline'}
                </div>
              </div>
              <button onClick={checkWhatsAppStatus} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500">
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden p-4 bg-zinc-950/20">
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                itemContent={(index, m) => (
                  <div className={`flex mb-2 ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-[20px] shadow-sm ${m.direction === 'sent' ? 'bg-[#0217ff] text-white rounded-br-none' : 'bg-zinc-800 text-white rounded-bl-none'}`}>
                      <p className="text-sm font-medium whitespace-pre-wrap">{m.content}</p>
                      <div className="text-[8px] mt-1 opacity-50 text-right uppercase font-black">
                        {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 border-t flex gap-3 items-center bg-black/20">
              <textarea 
                ref={textareaRef} value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva sua mensagem..."
                className="flex-1 p-4 rounded-2xl bg-zinc-900 border border-white/5 outline-none font-medium text-sm resize-none max-h-32"
                rows={1}
              />
              <button type="submit" className="p-4 bg-[#0217ff] text-white rounded-2xl hover:scale-105 transition-all shadow-lg shadow-blue-600/20">
                <Send size={20}/>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-50">
            <MessageSquare size={64} className="mb-4 text-[#0217ff]" />
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Central de Mensagens</h3>
            <p className="text-sm font-medium text-zinc-500">Selecione um lead para visualizar o histórico de conversas.</p>
          </div>
        )}
      </div>
    </div>
  );
}