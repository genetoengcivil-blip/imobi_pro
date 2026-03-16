import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

// 🔒 CONFIGURAÇÕES
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { user, darkMode } = useGlobal() as any;
  
  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ CORES (simplificado)
  const bgColor = darkMode ? '#111' : '#f5f5f5';
  const cardColor = darkMode ? '#000' : '#fff';
  const textColor = darkMode ? '#fff' : '#000';
  const borderColor = darkMode ? '#333' : '#ddd';

  // ✅ CARREGAR LEADS DO SUPABASE
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLeads(data);
  };

  // ✅ CARREGAR MENSAGENS DO LEAD SELECIONADO
  useEffect(() => {
    if (selectedLead) {
      loadMessages(selectedLead.id);
    }
  }, [selectedLead]);

  const loadMessages = async (leadId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
    setLoadingMessages(false);
  };

  // ✅ SCROLL PARA ÚLTIMA MENSAGEM
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ VERIFICAR CONEXÃO WHATSAPP
  useEffect(() => {
    checkConnection();
    
    // Escutar novas mensagens em tempo real
    const subscription = supabase
      .channel('whatsapp_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          if (selectedLead && payload.new.lead_id === selectedLead.id) {
            setMessages(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedLead]);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.instance?.state === 'open') {
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.log('Verificando conexão...');
    }
  };

  // ✅ GERAR QR CODE
  const handleGenerateQR = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.base64) {
          setQrCode(data.base64);
          startWatching();
        } else if (data.status === 'open') {
          setIsConnected(true);
        }
      } else {
        // Criar nova instância
        const createRes = await fetch(`${EVO_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVO_GLOBAL_KEY
          },
          body: JSON.stringify({ instanceName: INSTANCE_NAME, qrcode: true })
        });
        
        if (createRes.ok) {
          const createData = await createRes.json();
          if (createData.qrcode?.base64) {
            setQrCode(createData.qrcode.base64);
            startWatching();
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ MONITORAR CONEXÃO
  const startWatching = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.instance?.state === 'open') {
            clearInterval(interval);
            setIsConnected(true);
          }
        }
      } catch (e) {}
    }, 3000);
  };

  // ✅ DESCONECTAR
  const handleDisconnect = async () => {
    if (window.confirm('Desconectar WhatsApp?')) {
      await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
        method: 'DELETE',
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      setIsConnected(false);
      setQrCode('');
    }
  };

  // ✅ ENVIAR MENSAGEM
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      // Salvar no Supabase
      const { data: savedMsg } = await supabase
        .from('whatsapp_messages')
        .insert({
          lead_id: selectedLead.id,
          content: messageText,
          direction: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (savedMsg) {
        setMessages(prev => [...prev, savedMsg]);
      }

      // Enviar via Evolution API
      const cleanPhone = selectedLead.phone.replace(/\D/g, '');
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVO_GLOBAL_KEY
        },
        body: JSON.stringify({
          number: `55${cleanPhone}`,
          text: messageText,
          delay: 1200
        })
      });

    } catch (error) {
      console.error('Erro ao enviar:', error);
    }
  };

  // ✅ TELA DE CONEXÃO (QR CODE)
  if (!isConnected) {
    return (
      <div style={{
        minHeight: '100vh',
        background: bgColor,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <div style={{
          maxWidth: 400,
          width: '100%',
          background: cardColor,
          borderRadius: 16,
          padding: 32,
          border: `1px solid ${borderColor}`
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Conectar WhatsApp
          </h1>
          <p style={{ color: '#666', marginBottom: 24, textAlign: 'center' }}>
            Escaneie o QR Code com seu WhatsApp
          </p>

          <div style={{
            aspectRatio: '1/1',
            border: `2px dashed ${borderColor}`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            background: qrCode ? 'white' : 'transparent'
          }}>
            {qrCode ? (
              <img 
                src={qrCode} 
                alt="QR Code" 
                style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              />
            ) : (
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  cursor: 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? 'Gerando...' : 'Gerar QR Code'}
              </button>
            )}
          </div>

          {error && (
            <div style={{
              padding: 12,
              background: '#ef4444',
              color: 'white',
              borderRadius: 8,
              fontSize: 14
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ TELA DO CHAT
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      background: bgColor,
      color: textColor
    }}>
      {/* SIDEBAR - LEADS */}
      <div style={{
        width: 300,
        borderRight: `1px solid ${borderColor}`,
        background: cardColor,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: 16,
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold' }}>Conversas</h2>
          <button
            onClick={handleDisconnect}
            style={{
              padding: '6px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Desconectar
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {leads.map(lead => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              style={{
                width: '100%',
                padding: 12,
                border: 'none',
                borderBottom: `1px solid ${borderColor}`,
                background: selectedLead?.id === lead.id ? (darkMode ? '#222' : '#e5e5e5') : 'transparent',
                color: textColor,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{lead.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{lead.phone}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedLead ? (
          <>
            {/* HEADER */}
            <div style={{
              padding: 16,
              borderBottom: `1px solid ${borderColor}`,
              background: cardColor
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold' }}>{selectedLead.name}</h3>
              <p style={{ fontSize: 12, color: '#666' }}>{selectedLead.phone}</p>
            </div>

            {/* MESSAGES */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: '#666' }}>Carregando...</div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.direction === 'sent' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '8px 12px',
                      background: msg.direction === 'sent' ? '#10b981' : cardColor,
                      color: msg.direction === 'sent' ? 'white' : textColor,
                      borderRadius: 12,
                      border: msg.direction === 'sent' ? 'none' : `1px solid ${borderColor}`
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div style={{
              padding: 16,
              borderTop: `1px solid ${borderColor}`,
              background: cardColor
            }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    background: bgColor,
                    color: textColor
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    opacity: !newMessage.trim() ? 0.5 : 1
                  }}
                >
                  Enviar
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}>
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}