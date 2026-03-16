import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

// 🔒 CONFIGURAÇÕES
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { darkMode } = useGlobal() as any;
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('leads').select('*').order('name', { ascending: true });
      if (data) setLeads(data);
      checkConnection();
    };
    init();
  }, []);

  // ✅ GERENCIAR MENSAGENS (Realtime com Filtro Anti-Duplicação)
  useEffect(() => {
    if (!selectedLead) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    loadMessages();

    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `lead_id=eq.${selectedLead.id}` },
        (payload) => {
          setMessages(prev => {
            // 🛡️ FILTRO ANTI-DUPLICIDADE: Verifica se o ID já existe na tela
            const exists = prev.some(m => m.id === payload.new.id || (m.message_id && m.message_id === payload.new.message_id));
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

  const checkConnection = async () => {
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.instance?.state === 'open' || data.state === 'open') setIsConnected(true);
    } catch (err) { console.log('Sem conexão...'); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const content = newMessage;
    const phone = selectedLead.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    setNewMessage('');

    try {
      // 🚀 APENAS ENVIAMOS PARA A API. 
      // Não salvamos no banco aqui para evitar duplicatas. 
      // O Webhook fará o salvamento e o Realtime mostrará na tela.
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({
          number: cleanPhone,
          textMessage: { text: content }
        })
      });
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) setQrCode(data.base64);
      else if (data.instance?.state === 'open') setIsConnected(true);
    } catch (err) { alert('Erro na Oracle'); }
    finally { setLoading(false); }
  };

  const theme = {
    bgApp: darkMode ? '#0a0a0a' : '#f0f2f5',
    bgCard: darkMode ? '#1a1a1a' : '#fff',
    border: darkMode ? '#2d2d2d' : '#e0e0e0',
    text: darkMode ? '#e1e1e1' : '#111',
    msgSent: '#005c4b',
    msgReceived: darkMode ? '#262626' : '#fff'
  };

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: theme.bgApp, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 400, width: '100%', background: theme.bgCard, borderRadius: 24, padding: 40, border: `1px solid ${theme.border}`, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>WhatsApp ImobiPro</h1>
          <div style={{ aspectRatio: '1/1', border: `2px dashed ${theme.border}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, background: qrCode ? 'white' : 'transparent' }}>
            {qrCode ? <img src={qrCode} alt="QR Code" style={{ width: '90%' }} /> : (
              <button onClick={handleGenerateQR} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? 'GERANDO...' : 'GERAR CONEXÃO'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: theme.bgApp, color: theme.text, fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: isMobile ? (selectedLead ? 0 : '100%') : 350, borderRight: `1px solid ${theme.border}`, background: theme.bgCard, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${theme.border}`, fontWeight: 900 }}>CONVERSAS</div>
        <div style={{ overflowY: 'auto' }}>
          {leads.map(lead => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} style={{ width: '100%', padding: 20, border: 'none', borderBottom: `1px solid ${theme.border}`, background: selectedLead?.id === lead.id ? '#10b98115' : 'transparent', color: theme.text, textAlign: 'left', cursor: 'pointer' }}>
              <div style={{ fontWeight: 'bold' }}>{lead.name}</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>{lead.phone}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', visibility: isMobile && !selectedLead ? 'hidden' : 'visible' }}>
        {selectedLead ? (
          <>
            <div style={{ padding: 16, background: theme.bgCard, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile && <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: theme.text }}>⬅</button>}
              <span style={{ fontWeight: 'bold' }}>{selectedLead.name}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'sent' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '75%', padding: '10px 14px', background: msg.direction === 'sent' ? theme.msgSent : theme.msgReceived, color: msg.direction === 'sent' ? 'white' : theme.text, borderRadius: 12, fontSize: 14 }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={{ padding: 20, background: theme.bgCard, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10 }}>
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mensagem..." style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, outline: 'none' }} />
              <button type="submit" disabled={!newMessage.trim()} style={{ padding: '0 20px', background: '#0217ff', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' }}>ENVIAR</button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>Selecione um cliente</div>
        )}
      </div>
    </div>
  );
}