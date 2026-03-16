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
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ DETECTAR MOBILE
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ CARREGAR LEADS INICIAL
  useEffect(() => {
    const loadLeads = async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('name', { ascending: true });
      if (data) setLeads(data);
    };
    loadLeads();
    checkConnection();
  }, []);

  // ✅ GERENCIAR MENSAGENS (Histórico + Realtime)
  useEffect(() => {
    if (!selectedLead) {
      setMessages([]);
      return;
    }

    // 1. Carregar Histórico
    const loadMessages = async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    loadMessages();

    // 2. Ouvir novas mensagens via Realtime
    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'whatsapp_messages',
          filter: `lead_id=eq.${selectedLead.id}` 
        },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead]);

  // ✅ AUTO-SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ VERIFICAR CONEXÃO
  const checkConnection = async () => {
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.instance?.state === 'open' || data.state === 'open') setIsConnected(true);
      }
    } catch (err) { console.log('Buscando conexão...'); }
  };

  // ✅ GERAR QR CODE
  const handleGenerateQR = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.base64) {
        setQrCode(data.base64);
        startWatching();
      } else if (data.status === 'open' || data.instance?.state === 'open') {
        setIsConnected(true);
      }
    } catch (err: any) { setError('Falha ao gerar QR Code. Verifique a Oracle.'); }
    finally { setLoading(false); }
  };

  const startWatching = () => {
    const interval = setInterval(async () => {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      if (data.instance?.state === 'open' || data.state === 'open') {
        clearInterval(interval);
        setIsConnected(true);
      }
    }, 3000);
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Desconectar WhatsApp?')) return;
    await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
      method: 'DELETE', headers: { 'apikey': EVO_GLOBAL_KEY }
    });
    setIsConnected(false);
    setQrCode('');
  };

  // ✅ ENVIAR MENSAGEM (O Webhook se encarrega de salvar no banco)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const content = newMessage;
    const phone = selectedLead.phone.replace(/\D/g, '');
    const finalNumber = phone.startsWith('55') ? phone : `55${phone}`;
    setNewMessage('');

    try {
      // Enviamos para a API. O Webhook salvará no banco e o Realtime mostrará na tela.
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_GLOBAL_KEY },
        body: JSON.stringify({
          number: finalNumber,
          textMessage: { text: content }
        })
      });
    } catch (error) { console.error('Erro de rede ao enviar'); }
  };

  // ✅ CORES DO TEMA
  const theme = {
    bgApp: darkMode ? '#0a0a0a' : '#f0f2f5',
    bgCard: darkMode ? '#1a1a1a' : '#fff',
    border: darkMode ? '#2d2d2d' : '#e0e0e0',
    text: darkMode ? '#e1e1e1' : '#111',
    textMuted: darkMode ? '#888' : '#666',
    inputBg: darkMode ? '#262626' : '#fff',
    msgSent: '#005c4b',
    msgReceived: darkMode ? '#262626' : '#fff'
  };

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: theme.bgApp, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 400, width: '100%', background: theme.bgCard, borderRadius: 24, padding: 40, border: `1px solid ${theme.border}`, textAlign: 'center', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.025em' }}>Conectar WhatsApp</h1>
          <p style={{ color: theme.textMuted, marginBottom: 32, fontSize: 14 }}>Escaneie o código para sincronizar o ImobiPro</p>
          <div style={{ aspectRatio: '1/1', border: `2px dashed ${theme.border}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, background: qrCode ? 'white' : 'transparent', overflow: 'hidden' }}>
            {qrCode ? <img src={qrCode} alt="QR Code" style={{ width: '90%', height: '90%' }} /> : (
              <button onClick={handleGenerateQR} disabled={loading} style={{ padding: '14px 28px', background: '#10b981', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
                {loading ? 'GERANDO...' : 'GERAR QR CODE'}
              </button>
            )}
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: theme.bgApp, color: theme.text, fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: isMobile ? (sidebarOpen ? '100%' : '0') : 350,
        position: isMobile ? 'fixed' : 'relative',
        left: 0, top: 0, height: '100%',
        background: theme.bgCard, borderRight: `1px solid ${theme.border}`,
        transition: '0.3s', overflow: 'hidden', zIndex: 100
      }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>Conversas</h2>
          <button onClick={handleDisconnect} style={{ padding: '8px 16px', background: '#ef444415', color: '#ef4444', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>SAIR</button>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 80px)' }}>
          {leads.map(lead => (
            <button key={lead.id} onClick={() => { setSelectedLead(lead); if (isMobile) setSidebarOpen(false); }} style={{ width: '100%', padding: '20px 24px', border: 'none', borderBottom: `1px solid ${theme.border}`, background: selectedLead?.id === lead.id ? '#10b98110' : 'transparent', color: theme.text, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontWeight: 'bold', fontSize: 14 }}>{lead.name}</span>
              <span style={{ fontSize: 11, color: theme.textMuted }}>{lead.phone}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {selectedLead ? (
          <>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border}`, background: theme.bgCard, display: 'flex', alignItems: 'center', gap: 16 }}>
              {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: theme.text, fontSize: 24 }}>☰</button>}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedLead.name}</h3>
                <p style={{ fontSize: 10, color: theme.textMuted, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1 }}>{selectedLead.phone}</p>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'sent' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '12px 16px',
                    background: msg.direction === 'sent' ? theme.msgSent : theme.msgReceived,
                    color: msg.direction === 'sent' ? 'white' : theme.text,
                    borderRadius: msg.direction === 'sent' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    fontSize: 14, boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '20px', background: theme.bgCard, borderTop: `1px solid ${theme.border}` }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite uma mensagem..." style={{ flex: 1, padding: '14px 20px', border: `1px solid ${theme.border}`, borderRadius: 14, background: theme.inputBg, color: theme.text, outline: 'none', fontSize: 14 }} />
                <button type="submit" disabled={!newMessage.trim()} style={{ padding: '0 24px', background: '#0217ff', color: 'white', border: 'none', borderRadius: 14, fontWeight: 'bold', cursor: 'pointer', opacity: !newMessage.trim() ? 0.5 : 1 }}>ENVIAR</button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, gap: 16 }}>
            {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ position: 'absolute', top: 20, left: 20, background: 'none', border: 'none', color: theme.text, fontSize: 24 }}>☰</button>}
            <MessageSquare size={48} style={{ opacity: 0.2 }} />
            <p style={{ fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Selecione um cliente para conversar</p>
          </div>
        )}
      </div>
    </div>
  );
}