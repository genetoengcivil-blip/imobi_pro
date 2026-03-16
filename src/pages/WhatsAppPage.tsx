import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase, simulateIncomingMessage } from '../lib/supabase';
import {
  MessageSquare, Send, QrCode, Unplug, User, Loader2, Moon, Sun,
} from 'lucide-react';

// In a real app, these would point to the Evolution API
const DEMO_MODE = true; // Set to false when using real Evolution API
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123";
const INSTANCE_NAME = "imobipro";

// Simulated auto-reply messages
const AUTO_REPLIES = [
  "Entendi! Vou verificar e retorno em breve.",
  "Obrigado pela informação! 👍",
  "Pode me enviar mais detalhes?",
  "Perfeito, vamos agendar então!",
  "Estou interessado, pode continuar.",
  "Qual o valor final?",
  "Tudo certo, obrigado!",
  "Vou conversar com minha família e retorno.",
  "Excelente proposta! 🏡",
  "Quando posso visitar o imóvel?",
];

export default function WhatsAppPage() {
  // 🛡️ Safe context access
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode ?? true;
  const setDarkMode = context?.setDarkMode;

  const [isConnected, setIsConnected] = useState(DEMO_MODE);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Load messages when selecting a lead
  const loadMessages = useCallback(async (leadId: string) => {
    try {
      const result = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });
      if (result.data) setMessages(result.data);
    } catch (e) {
      console.error("Erro ao carregar mensagens:", e);
    }
  }, []);

  useEffect(() => {
    if (!selectedLead?.id) return;

    loadMessages(selectedLead.id);

    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}`
      }, (payload: any) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead, loadMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Check connection status
  const checkStatus = async () => {
    if (DEMO_MODE) {
      setIsConnected(true);
      setInitialCheckDone(true);
      return;
    }
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      const state = data.instance?.state || data.state;
      setIsConnected(state === 'open');
    } catch (_e) {
      console.log("API Offline - modo demo ativado");
      setIsConnected(true); // Fallback to demo
    } finally {
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleGenerateQR = async () => {
    setLoading(true);
    if (DEMO_MODE) {
      // Simulate connection after delay
      setTimeout(() => {
        setIsConnected(true);
        setLoading(false);
        setQrCode('');
      }, 2000);
      return;
    }
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) setQrCode(data.base64);
      else checkStatus();
    } catch (_e) {
      alert("Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const text = newMessage.trim();
    setNewMessage('');

    if (DEMO_MODE) {
      // Save to local mock store
      await supabase.from('whatsapp_messages').insert({
        lead_id: selectedLead.id,
        content: text,
        direction: 'sent',
      });
      // Reload messages
      await loadMessages(selectedLead.id);

      // Simulate auto-reply after delay
      setTimeout(async () => {
        const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
        simulateIncomingMessage(selectedLead.id, reply);
        // The realtime subscription should pick it up, but also reload
        await loadMessages(selectedLead.id);
      }, 1500 + Math.random() * 2000);
      return;
    }

    // Real Evolution API
    const phone = selectedLead.phone?.replace(/\D/g, '');
    const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
    try {
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({ number: cleanPhone, textMessage: { text } })
      });
    } catch (_e) {
      alert("Erro de envio.");
    }
  };

  // Filter leads by search
  const filteredLeads = leads.filter((lead: any) =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm)
  );

  // Format time
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!initialCheckDone) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 text-white font-mono text-xs">
      <Loader2 className="animate-spin mr-2" size={18} /> CARREGANDO MÓDULO WHATSAPP...
    </div>
  );

  return (
    <div className={`h-screen flex ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} font-sans`}>

      {/* SIDEBAR */}
      <div className={`w-80 flex-shrink-0 border-r flex flex-col ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <h2 className="font-black italic uppercase tracking-tighter text-sm">WhatsApp</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode?.(!darkMode)}
              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {isConnected ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Unplug size={12} className="text-red-500" />
                <span className="text-[10px] font-bold text-red-500 uppercase">Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className={`p-3 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
            <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" strokeWidth="2" />
            </svg>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar contato..."
              className="bg-transparent text-sm flex-1 outline-none placeholder:opacity-40"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.length > 0 ? filteredLeads.map((lead: any) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`w-full p-3.5 border-b text-left flex items-center gap-3 transition-all ${
                darkMode ? 'border-zinc-800/50' : 'border-zinc-100'
              } ${
                selectedLead?.id === lead.id
                  ? darkMode ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : 'bg-emerald-50 border-l-2 border-l-emerald-500'
                  : darkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                selectedLead?.id === lead.id
                  ? 'bg-emerald-500 text-white'
                  : darkMode ? 'bg-zinc-800 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {lead.name?.[0]?.toUpperCase() || <User size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{lead.name || "Sem Nome"}</p>
                <p className={`text-[11px] font-mono truncate ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {lead.phone?.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}
                </p>
              </div>
              {lead.status && (
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  lead.status === 'Novo' ? 'bg-blue-500/20 text-blue-400' :
                  lead.status === 'Ativo' ? 'bg-emerald-500/20 text-emerald-400' :
                  lead.status === 'Negociando' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {lead.status}
                </span>
              )}
            </button>
          )) : (
            <div className="p-8 text-center">
              <p className={`text-xs font-bold italic ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {searchTerm ? 'Nenhum resultado' : 'Nenhum Lead'}
              </p>
            </div>
          )}
        </div>

        {/* Demo badge */}
        {DEMO_MODE && (
          <div className={`p-3 text-center border-t ${darkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
              ⚡ Modo Demo — Respostas simuladas
            </span>
          </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* QR Code Overlay */}
        {!isConnected && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 text-center">
            <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
              <QrCode className="mx-auto text-emerald-500 mb-6" size={48} />
              <h3 className="text-white font-black uppercase italic mb-2 text-lg">Conectar WhatsApp</h3>
              <p className="text-zinc-500 text-xs mb-6">Escaneie o QR Code com o WhatsApp</p>
              {qrCode ? (
                <div className="bg-white p-4 rounded-2xl mb-6 shadow-inner">
                  <img src={qrCode} alt="QR Code" className="w-full h-auto" />
                </div>
              ) : (
                <button
                  onClick={handleGenerateQR}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> CONECTANDO...</>
                  ) : (
                    'GERAR QR CODE'
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {selectedLead ? (
          <>
            {/* Chat Header */}
            <div className={`h-16 px-6 border-b flex items-center gap-3 flex-shrink-0 ${
              darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {selectedLead.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{selectedLead.name}</p>
                <p className={`text-[11px] font-mono ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {selectedLead.phone}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${darkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center opacity-30">
                    <MessageSquare size={32} className="mx-auto mb-2" />
                    <p className="text-xs font-bold">Nenhuma mensagem ainda</p>
                    <p className="text-[10px] mt-1">Envie a primeira mensagem!</p>
                  </div>
                </div>
              )}
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 shadow-sm ${
                    m.direction === 'sent'
                      ? 'bg-emerald-500 text-white rounded-2xl rounded-br-md'
                      : darkMode
                        ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-2xl rounded-bl-md'
                        : 'bg-white border border-zinc-200 text-zinc-900 rounded-2xl rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${
                      m.direction === 'sent' ? 'text-emerald-200' : darkMode ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>
                      {formatTime(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className={`p-3 flex gap-2 flex-shrink-0 border-t ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className={`flex-1 px-4 py-3 rounded-2xl text-sm outline-none transition-colors ${
                  darkMode
                    ? 'bg-zinc-800 border border-zinc-700 focus:border-emerald-500 text-white placeholder:text-zinc-500'
                    : 'bg-zinc-100 border border-zinc-200 focus:border-emerald-500 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className={`text-center ${darkMode ? 'text-zinc-600' : 'text-zinc-300'}`}>
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
                darkMode ? 'bg-zinc-900' : 'bg-zinc-100'
              }`}>
                <MessageSquare size={40} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider mb-2">ImobiPro Chat</h3>
              <p className="text-xs max-w-[200px] mx-auto leading-relaxed">
                Selecione um contato à esquerda para iniciar uma conversa
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
