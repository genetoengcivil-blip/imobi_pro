import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { 
  MessageSquare, Send, Paperclip, Image as ImageIcon, FileText, Loader2, X 
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
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ CARREGAR E SINCRONIZAR MENSAGENS
  const loadMessages = useCallback(async (leadId: string) => {
    const { data } = await supabase.from('whatsapp_messages').select('*').eq('lead_id', leadId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    loadMessages(selectedLead.id);
    const channel = supabase.channel(`chat-${selectedLead.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `lead_id=eq.${selectedLead.id}` }, (p) => setMessages(prev => [...prev, p.new])).subscribe();
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

      // 1. Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);

      // 3. Enviar via Proxy
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

      // 4. Salvar no Banco
      await supabase.from('whatsapp_messages').insert([{
        lead_id: selectedLead.id,
        content: `📎 ${mediaType.toUpperCase()}: ${file.name}`,
        media_url: publicUrl,
        media_type: mediaType,
        direction: 'sent',
        user_id: user.id
      }]);

    } catch (err) {
      console.error("Erro no upload:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !user) return;
    const msg = newMessage;
    setNewMessage('');

    try {
      await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, number: selectedLead.phone.replace(/\D/g, ""), text: msg }
      });
      await supabase.from('whatsapp_messages').insert([{ lead_id: selectedLead.id, content: msg, direction: 'sent', user_id: user.id }]);
    } catch (err) { console.error(err); }
  };

  return (
    <div className={`flex h-[calc(100vh-140px)] rounded-[32px] overflow-hidden border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200'}`}>
      
      {/* LISTA LATERAL (Simplificada para o exemplo) */}
      <div className={`w-80 border-r flex flex-col ${darkMode ? 'border-white/5 bg-black' : 'border-zinc-100 bg-zinc-50'}`}>
        <div className="p-6 border-b dark:border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Chat</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leads.map((lead: any) => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex items-center gap-4 border-b dark:border-white/5 ${selectedLead?.id === lead.id ? 'bg-[#0217ff]/10 border-r-4 border-r-[#0217ff]' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/5 flex items-center justify-center font-black">{lead.name.charAt(0)}</div>
              <div className="text-left"><div className="font-bold text-sm truncate">{lead.name}</div></div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT VIRTUALIZADO */}
      <div className="flex-1 flex flex-col relative">
        {selectedLead ? (
          <>
            <div className={`p-6 border-b font-black uppercase tracking-widest text-[11px] ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white'}`}>
              Conversa: <span className="text-[#0217ff]">{selectedLead.name}</span>
            </div>
            
            <div className="flex-1 overflow-hidden p-4">
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                itemContent={(_, m) => (
                  <div className={`flex mb-4 ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-[24px] ${m.direction === 'sent' ? 'bg-[#0217ff] text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      {m.media_url && m.media_type === 'image' && (
                        <img src={m.media_url} className="rounded-xl mb-2 max-h-60 w-full object-cover cursor-pointer" onClick={() => window.open(m.media_url)} />
                      )}
                      {m.media_url && m.media_type === 'document' && (
                        <a href={m.media_url} target="_blank" className="flex items-center gap-2 p-2 bg-black/10 rounded-xl mb-2 hover:bg-black/20 transition-all">
                          <FileText size={16} /> <span className="text-[10px] font-bold truncate">Ver Documento</span>
                        </a>
                      )}
                      <p className="text-sm font-medium">{m.content}</p>
                    </div>
                  </div>
                )}
              />
            </div>

            <form onSubmit={handleSendMessage} className={`p-6 border-t flex gap-3 items-center ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white'}`}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-[#0217ff] transition-colors">
                {uploading ? <Loader2 className="animate-spin" /> : <Paperclip size={24} />}
              </button>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escreva..." className="flex-1 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 outline-none font-medium" />
              <button type="submit" className="p-4 bg-[#0217ff] text-white rounded-2xl hover:scale-105 transition-all"><Send size={20}/></button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}