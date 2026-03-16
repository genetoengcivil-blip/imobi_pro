import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import {
  MessageSquare, Send, QrCode, Unplug, User, Loader2, Moon, Sun, CheckCircle2, Search
} from 'lucide-react';

// 🔒 CONFIGURAÇÕES REAIS
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123";
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const context = useGlobal() as any;
  const leads = context?.leads || [];
  const darkMode = context?.darkMode ?? true;
  const setDarkMode = context?.setDarkMode;

  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // ✅ CORES
  const colors = {
    bg: darkMode ? '#111827' : '#f9fafb',
    card: darkMode ? '#1f2937' : '#ffffff',
    border: darkMode ? '#374151' : '#e5e7eb',
    text: darkMode ? '#f9fafb' : '#111827',
    textMuted: darkMode ? '#9ca3af' : '#6b7280',
    inputBg: darkMode ? '#374151' : '#ffffff',
    msgSent: '#10b981',
    msgReceived: darkMode ? '#374151' : '#f3f4f6'
  };

  // ✅ CARREGAR MENSAGENS
  const loadMessages = useCallback(async (leadId: string) => {
    try {
      console.log('📥 Carregando mensagens do lead:', leadId);
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
        return;
      }
      
      if (data) {
        console.log(`✅ ${data.length} mensagens carregadas`);
        processedMessagesRef.current.clear();
        data.forEach(msg => processedMessagesRef.current.add(msg.id));
        setMessages(data);
      }
    } catch (e) {
      console.error("❌ Erro ao carregar mensagens:", e);
    }
  }, []);

  // ✅ REAL TIME
  useEffect(() => {
    if (!selectedLead?.id) return;

    loadMessages(selectedLead.id);

    const channel = supabase
      .channel(`chat_${selectedLead.id}`)
      .on('postgres_changes', {
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `lead_id=eq.${selectedLead.id}`
      }, (payload: any) => {
        console.log('📨 Nova mensagem recebida via Supabase:', payload.new);
        if (!processedMessagesRef.current.has(payload.new.id)) {
          processedMessagesRef.current.add(payload.new.id);
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [selectedLead, loadMessages]);

  // ✅ SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ VERIFICAR STATUS
  const checkStatus = async () => {
    try {
      console.log('🔍 Verificando status da conexão...');
      const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      if (!res.ok) {
        console.log('❌ Erro na verificação de status:', res.status);
        setIsConnected(false);
        return;
      }
      
      const data = await res.json();
      console.log('📊 Status da conexão:', data);
      
      const state = data.instance?.state || data.state || data.status;
      setIsConnected(state === 'open');
      console.log('✅ Conectado:', state === 'open');
    } catch (e) {
      console.log("❌ Erro ao conectar com API Oracle:", e);
      setIsConnected(false);
    } finally {
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  // ✅ GERAR QR CODE
  const handleGenerateQR = async () => {
    setLoading(true);
    setQrCode('');
    setError('');
    
    try {
      console.log('🔄 Gerando QR Code...');
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      console.log('📊 Resposta do connect:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('📊 Dados recebidos:', data);
        
        if (data.base64) {
          console.log('✅ QR Code gerado com sucesso');
          setQrCode(data.base64);
        } else if (data.status === 'open') {
          console.log('✅ Instância já está aberta');
          setIsConnected(true);
        }
      } else {
        console.log('🔄 Criando nova instância...');
        const createRes = await fetch(`${EVO_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVO_GLOBAL_KEY
          },
          body: JSON.stringify({ 
            instanceName: INSTANCE_NAME, 
            qrcode: true 
          })
        });
        
        if (createRes.ok) {
          const createData = await createRes.json();
          console.log('📊 Dados da criação:', createData);
          if (createData.qrcode?.base64) {
            setQrCode(createData.qrcode.base64);
          }
        } else {
          const errorText = await createRes.text();
          console.error('❌ Erro ao criar instância:', errorText);
          setError('Erro ao criar instância no servidor');
        }
      }
    } catch (e: any) {
      console.error('❌ Erro ao gerar QR Code:', e);
      setError(e.message || 'Erro ao conectar com servidor');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENVIAR MENSAGEM - CORRIGIDO
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || sending) return;

    const text = newMessage.trim();
    const phone = selectedLead.phone?.replace(/\D/g, '');
    const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
    
    console.log('📤 Enviando mensagem:', { text, phone: cleanPhone, lead: selectedLead.name });
    
    setNewMessage('');
    setSending(true);
    setError('');

    try {
      // 1. Salva no Supabase
      console.log('💾 Salvando no Supabase...');
      const { data: savedMsg, error: dbError } = await supabase
        .from('whatsapp_messages')
        .insert({
          lead_id: selectedLead.id,
          content: text,
          direction: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Erro ao salvar no Supabase:', dbError);
        throw new Error('Erro ao salvar mensagem no banco');
      }

      console.log('✅ Mensagem salva no Supabase:', savedMsg);

      if (savedMsg) {
        processedMessagesRef.current.add(savedMsg.id);
        setMessages(prev => [...prev, savedMsg]);
      }

      // 2. Envia via Evolution API
      console.log('📤 Enviando para Evolution API...');
      const response = await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'apikey': EVO_GLOBAL_KEY 
        },
        body: JSON.stringify({ 
          number: cleanPhone, 
          text: text
        })
      });

      const responseData = await response.json().catch(() => ({}));
      console.log('📊 Resposta da Evolution:', { status: response.status, data: responseData });

      if (!response.ok) {
        console.error('❌ Erro na Evolution API:', responseData);
        throw new Error(`Erro ${response.status}: ${responseData.message || 'Falha no envio'}`);
      }

      console.log('✅ Mensagem enviada com sucesso!');

    } catch (e: any) {
      console.error('❌ Erro ao enviar mensagem:', e);
      setError(e.message || 'Erro ao enviar mensagem');
      
      // Remove a mensagem em caso de erro
      setMessages(prev => prev.filter(m => m.id !== prev[prev.length-1]?.id));
    } finally {
      setSending(false);
    }
  };

  const filteredLeads = leads.filter((lead: any) =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm)
  );

  if (!initialCheckDone) return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: colors.bg,
      color: colors.text
    }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#10b981' }} size={32} />
        <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5 }}>Iniciando ImobiPro Chat</p>
      </div>
    </div>
  );

  return (
    <div style={{ 
      height: 'calc(100vh - 80px)', 
      display: 'flex',
      backgroundColor: colors.bg,
      color: colors.text
    }}>
      {/* SIDEBAR */}
      <div style={{ 
        width: 320, 
        borderRight: `1px solid ${colors.border}`,
        backgroundColor: colors.card,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '16px', 
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '14px' }}>WHATSAPP</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setDarkMode?.(!darkMode)} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              {darkMode ? <Sun size={14} color={colors.text} /> : <Moon size={14} color={colors.text} />}
            </button>
            {isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: 8, height: 8, backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#10b981' }}>Online</span>
              </div>
            ) : (
              <Unplug size={14} color="#ef4444" />
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar contato..."
              style={{
                width: '100%',
                padding: '8px 8px 8px 36px',
                borderRadius: '12px',
                fontSize: '12px',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Leads List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredLeads.map((lead: any) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: selectedLead?.id === lead.id ? (darkMode ? '#374151' : '#f3f4f6') : 'transparent',
                color: colors.text,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                backgroundColor: darkMode ? '#374151' : '#e5e7eb',
                color: '#10b981'
              }}>
                {lead.name?.[0] || "?"}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{lead.name}</p>
                <p style={{ fontSize: '10px', color: colors.textMuted, margin: 0 }}>{lead.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Overlay de conexão */}
        {!isConnected && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}>
            <div style={{
              maxWidth: 320,
              width: '100%',
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              padding: '32px',
              borderRadius: '40px',
              textAlign: 'center'
            }}>
              <QrCode size={56} style={{ margin: '0 auto 24px', color: '#10b981' }} />
              <h3 style={{ color: colors.text, fontWeight: 'bold', marginBottom: '24px' }}>Conectar WhatsApp</h3>
              {qrCode ? (
                <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '24px', marginBottom: '16px' }}>
                  <img src={qrCode} alt="QR" style={{ width: '100%', height: 'auto' }} />
                </div>
              ) : (
                <button 
                  onClick={handleGenerateQR} 
                  disabled={loading} 
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  {loading ? 'GERANDO...' : 'GERAR QR CODE'}
                </button>
              )}
              {error && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Header */}
        {selectedLead ? (
          <>
            <div style={{
              height: 64,
              padding: '0 24px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 'bold'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  backgroundColor: darkMode ? '#374151' : '#e5e7eb',
                  color: '#10b981'
                }}>
                  {selectedLead.name?.[0] || "?"}
                </div>
                <span>{selectedLead.name}</span>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              backgroundColor: colors.bg,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: colors.textMuted,
                  marginTop: '40px'
                }}>
                  Nenhuma mensagem ainda. Envie uma mensagem para começar.
                </div>
              ) : (
                messages.map((m: any) => (
                  <div key={m.id} style={{
                    display: 'flex',
                    justifyContent: m.direction === 'sent' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      backgroundColor: m.direction === 'sent' ? '#10b981' : colors.msgReceived,
                      color: m.direction === 'sent' ? 'white' : colors.text,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap' }}>{m.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} style={{
              padding: '16px',
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              display: 'flex',
              gap: '8px'
            }}>
              <input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Digite sua mensagem..." 
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  fontSize: '14px',
                  outline: 'none'
                }}
                disabled={sending}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim() || sending}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                  opacity: sending || !newMessage.trim() ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {sending ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.3
          }}>
            <MessageSquare size={64} style={{ marginBottom: '16px' }} />
            <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}>Selecione um cliente</p>
          </div>
        )}
      </div>
    </div>
  );
}