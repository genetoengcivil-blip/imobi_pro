import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123";
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { darkMode } = useGlobal() as any;
  
  // Estados básicos
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Carregar leads
  useEffect(() => {
    const loadLeads = async () => {
      const { data } = await supabase.from('leads').select('*');
      if (data) setLeads(data);
    };
    loadLeads();
  }, []);

  // Carregar mensagens do lead selecionado
  useEffect(() => {
    if (!selectedLead) return;
    
    const loadMessages = async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at');
      if (data) setMessages(data);
    };
    
    loadMessages();
  }, [selectedLead]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Verificar status da conexão
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        const data = await res.json();
        const state = data.instance?.state || data.state;
        setIsConnected(state === 'open');
      } catch (e) {}
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Gerar QR Code
  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      // Tenta conectar
      const res = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      const data = await res.json();
      
      if (data.base64) {
        setQrCode(data.base64);
      } else if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
      } else if (data.status === 'open') {
        setIsConnected(true);
      } else {
        // Cria nova instância
        const createRes = await fetch(`${EVO_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVO_GLOBAL_KEY
          },
          body: JSON.stringify({ instanceName: INSTANCE_NAME, qrcode: true })
        });
        const createData = await createRes.json();
        if (createData.qrcode?.base64) {
          setQrCode(createData.qrcode.base64);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ENVIAR MENSAGEM - VERSÃO SIMPLES
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || sending) return;

    const text = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      // Formata o telefone
      const phone = selectedLead.phone?.replace(/\D/g, '');
      const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;

      // 1. ENVIA PELA EVOLUTION API
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

      if (!response.ok) {
        throw new Error('Erro ao enviar');
      }

      // 2. SE ENVIOU COM SUCESSO, SALVA NO BANCO
      const { data: savedMsg } = await supabase
        .from('whatsapp_messages')
        .insert({
          lead_id: selectedLead.id,
          content: text,
          direction: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (savedMsg) {
        setMessages(prev => [...prev, savedMsg]);
      }

    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Falha ao enviar mensagem. Verifique a conexão com WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  // TELA DE CONEXÃO
  if (!isConnected) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Conectar WhatsApp</h1>
          <div className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center mb-6 bg-gray-50 dark:bg-gray-800">
            {qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            ) : (
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Gerando...' : 'Gerar QR Code'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TELA DO CHAT
  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold">
          Conversas
        </div>
        <div className="overflow-y-auto h-[calc(100%-65px)]">
          {leads.map(lead => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedLead?.id === lead.id ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <div className="font-medium">{lead.name}</div>
              <div className="text-sm text-gray-500">{lead.phone}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {selectedLead ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold">
              {selectedLead.name}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.direction === 'sent'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}