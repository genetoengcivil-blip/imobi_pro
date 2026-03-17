import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, Search, CheckCircle2 } from 'lucide-react';

export default function WhatsAppPage() {
  const { leads, darkMode, user } = useGlobal() as any;
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredLeads = (leads || []).filter((lead: any) => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (lead.phone && lead.phone.includes(searchQuery))
  );

  const loadMessages = useCallback(async (leadId: string) => {
    const { data } = await supabase.from('whatsapp_messages').select('*').eq('lead_id', leadId).order('created_at', { ascending: true });
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !user) return;
    
    const msg = newMessage.trim();
    setNewMessage('');

    try {
      // Chama a Edge Function para Enviar!
      await supabase.functions.invoke('whatsapp-proxy', {
        body: { instance: user.id, number: selectedLead.phone, text: msg }
      });

      await supabase.from('whatsapp_messages').insert([{ 
        lead_id: selectedLead.id, content: msg, direction: 'sent', user_id: user.id 
      }]);
    } catch (err) {
      alert("Erro ao enviar. Verifique a conexão.");
      setNewMessage(msg);
    }
  };

  return (
    <div className={`flex h-[calc(100vh-120px)] rounded-[32px] overflow-hidden border shadow-sm ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200'}`}>
      <div className={`w-80 border-r flex flex-col ${darkMode ? 'border-white/5 bg-black' : 'border-zinc-100 bg-zinc-50'}`}>
        <div className="p-6 border-b dark:border-white/5 space-y-4">
          <h2 className="text-xl font-black italic uppercase">Chats</h2>
          <input 
            type="text" placeholder="Buscar cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-zinc-900 border-white/5 focus:border-[#0217ff]' : 'bg-white border-zinc-200 focus:border-[#0217ff]'}`}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.map((lead: any) => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 flex items-center gap-4 border-b transition-all ${selectedLead?.id === lead.id ? 'bg-[#0217ff]/10 border-l-4 border-l-[#0217ff]' : 'hover:bg-zinc-100 border-l-4 border-l-transparent dark:hover:bg-white/5'}`}>
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-black">{lead.name.charAt(0)}</div>
              <div className="text-left"><div className="font-bold text-sm truncate">{lead.name}</div></div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-zinc-50 dark:bg-black/20">
        {selectedLead ? (
          <>
            <div className={`p-6 border-b flex justify-between items-center z-10 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white'}`}>
              <div className="font-black uppercase">{selectedLead.name}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${m.direction === 'sent' ? 'bg-[#0217ff] text-white rounded-br-none' : 'bg-white text-black border rounded-bl-none dark:bg-zinc-800 dark:border-white/5 dark:text-white'}`}>
                    <p className="text-sm">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className={`p-4 border-t flex gap-3 ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white'}`}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escreva..." className="flex-1 p-4 rounded-xl border dark:bg-zinc-900 dark:border-white/5 outline-none font-medium" />
              <button type="submit" className="p-4 bg-[#0217ff] text-white rounded-xl hover:scale-105"><Send/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <MessageSquare size={48} className="mb-4 text-[#0217ff]" />
            <p className="font-black uppercase tracking-widest text-zinc-500">Selecione um Chat</p>
          </div>
        )}
      </div>
    </div>
  );
}