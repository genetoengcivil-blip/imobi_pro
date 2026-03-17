import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { 
  MessageSquare, Send, Paperclip, FileText, Loader2, Search, CheckCircle2 
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
  const [searchQuery, setSearchQuery] = useState(''); // NOVO: Busca de leads
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filtra os leads pela barra de pesquisa
  const filteredLeads = leads.filter((lead: any) => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (lead.phone && lead.phone.includes(searchQuery))
  );

  // ✅ CARREGAR E SINCRONIZAR MENSAGENS
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `lead_id=eq.${selectedLead.id}` }, 
        (p) => setMessages(prev => [...prev, p.new])
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
  }, [messages]);

  // ✅ LÓGICA DE ENVIO DE MÍDIA
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLead || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `chat_media/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
      const mediaType = file.type.startsWith('image') ? 'image' : 'document';
      
      await supabase.functions.invoke('whatsapp-proxy', {
        body: {
          instance: user.id,
          number: selectedLead.phone.replace(/\D/g, ""),
          mediaUrl: publicUrl,
          mediaType: mediaType,
          text: `Enviou um ${mediaType === 'image' ? 'arquivo de imagem' : 'documento'}`
        }
      });

      await supabase.from('whatsapp_messages').insert([{
        lead_id: selectedLead.id,
        content: `📎 ${file.name}`,
        media_url: publicUrl,
        media_type: mediaType,
        direction: 'sent',
        user_id: user.id
      }]);

    } catch (err) {
      console.error("Erro no upload:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Limpa o input
    }
  };

  // ✅ LÓGICA DE ENVIO DE TEXTO (Com suporte a Enter/Shift+Enter)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !user) return;
    
    const msg = newMessage.trim();
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reseta altura

    try {
      // Opcional: Adicionar mensagem otimista no estado para UI mais rápida
      await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, number: selectedLead.phone.replace(/\D/g, ""), text: msg }
      });
      await supabase.from('whatsapp_messages').insert([{ lead_id: selectedLead.id, content: msg, direction: 'sent', user_id: user.id }]);
    } catch (err) { 
      console.error(err); 
      setNewMessage(msg); // Devolve o texto se der erro
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex h-[calc(100vh-120px)] rounded-[32px] overflow-hidden border shadow-sm ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200'}`}>
      
      {/* 📋 LISTA DE LEADS (ESQUERDA) */}
      <div className={`w-80 border-r flex flex-col ${darkMode ? 'border-white/5 bg-black' : 'border-zinc-100 bg-zinc-50'}`}>
        <div className="p-6 border-b dark:border-white/5 space-y-4">
          <h2 className="text-xl font-[900] italic uppercase tracking-tighter flex items-center gap-2">
            <MessageSquare className="text-[#0217ff]" size={20} /> Atendimentos
          </h2>
          {/* NOVO: Barra de Busca de Leads */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-3 pl-10 pr-4 rounded-xl text-xs font-bold outline-none border transition-all ${
                darkMode ? 'bg-zinc-900 border-white/5 focus:border-[#0217ff]/50' : 'bg-white border-zinc-200 focus:border-[#0217ff]/50'
              }`}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredLeads.length === 0 ? (
             <div className="p-6 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">Nenhum cliente encontrado.</div>
          ) : (
            filteredLeads.map((lead: any) => (
              <button 
                key={lead.id} 
                onClick={() => setSelectedLead(lead)} 
                className={`w-full p-4 flex items-center gap-4 border-b transition-all ${
                  darkMode ? 'border-white/5 hover:bg-white/5' : 'border-zinc-100 hover:bg-zinc-100'
                } ${selectedLead?.id === lead.id ? (darkMode ? 'bg-[#0217ff]/10 border-l-4 border-l-[#0217ff]' : 'bg-blue-50 border-l-4 border-l-[#0217ff]') : 'border-l-4 border-l-transparent'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-black text-zinc-500 shrink-0">
                  {lead.name.charAt(0)}
                </div>
                <div className="text-left overflow-hidden">
                  <div className="font-[900] text-sm truncate">{lead.name}</div>
                  <div className="text-[10px] text-zinc-400 font-bold truncate mt-0.5">{lead.phone}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 💬 ÁREA DO CHAT (DIREITA) */}
      <div className="flex-1 flex flex-col relative bg-transparent">
        {selectedLead ? (
          <>
            {/* Cabeçalho do Chat */}
            <div className={`px-8 py-5 border-b flex justify-between items-center z-10 ${darkMode ? 'bg-zinc-900/90 backdrop-blur-md border-white/5' : 'bg-white/90 backdrop-blur-md border-zinc-100'}`}>
              <div>
                <div className="font-[900] text-lg uppercase tracking-tight">{selectedLead.name}</div>
                <div className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                   Conectado via {selectedLead.source || 'WhatsApp'}
                </div>
              </div>
            </div>
            
            {/* Histórico Virtualizado */}
            <div className="flex-1 overflow-hidden px-4">
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                className="custom-scrollbar h-full py-6"
                itemContent={(index, m) => {
                  // Lógica para arredondamento inteligente das bolhas (Agrupamento visual)
                  const prev = index > 0 ? messages[index - 1] : null;
                  const next = index < messages.length - 1 ? messages[index + 1] : null;
                  
                  const isFirstInGroup = !prev || prev.direction !== m.direction;
                  const isLastInGroup = !next || next.direction !== m.direction;

                  const isSent = m.direction === 'sent';

                  return (
                    <div className={`flex w-full mb-${isLastInGroup ? '4' : '1'} ${isSent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-5 py-3 shadow-sm relative group ${
                        isSent 
                        ? `bg-[#0217ff] text-white ${isFirstInGroup ? 'rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl' : 'rounded-l-2xl'} ${isLastInGroup ? 'rounded-br-sm' : 'rounded-r-md'}` 
                        : `text-zinc-900 dark:text-zinc-100 ${darkMode ? 'bg-zinc-800' : 'bg-white border border-zinc-100'} ${isFirstInGroup ? 'rounded-tr-2xl rounded-br-2xl rounded-tl-2xl' : 'rounded-r-2xl'} ${isLastInGroup ? 'rounded-bl-sm' : 'rounded-l-md'}`
                      }`}>
                        
                        {/* Renderização de Mídia Otimizada */}
                        {m.media_url && m.media_type === 'image' && (
                          <div className="mb-2 rounded-xl overflow-hidden bg-black/10">
                            <img src={m.media_url} className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(m.media_url)} alt="Anexo" />
                          </div>
                        )}
                        {m.media_url && m.media_type === 'document' && (
                          <a href={m.media_url} target="_blank" className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${isSent ? 'bg-white/10 hover:bg-white/20' : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>
                            <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg"><FileText size={20} /></div>
                            <div className="flex-1 min-w-0">
                               <div className="text-[11px] font-[900] truncate">Documento PDF</div>
                               <div className="text-[9px] opacity-70 font-bold uppercase">Clique para abrir</div>
                            </div>
                          </a>
                        )}

                        {/* Conteúdo do Texto (Preservando quebras de linha) */}
                        {m.content && m.content !== '📎 undefined' && (
                          <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        )}
                        
                        {/* Timestamp Discreto */}
                        <div className={`text-[9px] mt-1 font-black uppercase flex items-center gap-1 ${isSent ? 'justify-end text-blue-200' : 'justify-start text-zinc-400'}`}>
                          {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {isSent && <CheckCircle2 size={10} />}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            {/* Input Area (Textarea Auto-expansivo) */}
            <div className={`p-4 border-t flex gap-3 items-end ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading}
                className={`p-4 rounded-2xl transition-all ${darkMode ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-white text-zinc-500 hover:text-[#0217ff] border border-zinc-200'} shrink-0`}
              >
                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
              </button>
              
              {/* Textarea no lugar do Input para textos longos */}
              <div className={`flex-1 rounded-[24px] border overflow-hidden flex items-end transition-all focus-within:border-[#0217ff] ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-300'}`}>
                <textarea 
                  ref={textareaRef}
                  value={newMessage} 
                  onChange={e => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; // Cresce até 120px
                  }} 
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva a mensagem... (Shift + Enter para pular linha)" 
                  className="w-full max-h-[120px] p-4 bg-transparent outline-none font-medium text-sm resize-none custom-scrollbar" 
                  rows={1}
                />
              </div>

              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && !uploading}
                className="p-4 bg-[#0217ff] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shrink-0 shadow-lg shadow-blue-600/20"
              >
                <Send size={20}/>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-zinc-50/50 dark:bg-black/50">
            <div className="w-24 h-24 bg-[#0217ff]/5 rounded-[40px] flex items-center justify-center mb-6 shadow-inner">
              <MessageSquare size={48} className="text-[#0217ff]/50" />
            </div>
            <h3 className="text-2xl font-[900] italic uppercase tracking-tighter mb-2 text-zinc-300">Caixa de Entrada</h3>
            <p className="text-zinc-500 text-sm max-w-sm font-medium">
              Selecione um cliente na barra lateral ou utilize a busca para iniciar o atendimento.
            </p>
          </div>
        )}
      </div>

      <style>{`
        /* Scrollbar customizada para o textarea e listas */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
}