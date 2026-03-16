import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

// Configurações
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123";
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { user, darkMode } = useGlobal() as any;
  
  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar leads
  useEffect(() => {
    const loadLeads = async () => {
      const { data } = await supabase.from('leads').select('*');
      if (data) setLeads(data);
    };
    loadLeads();
  }, []);

  // Buscar mensagens do lead selecionado
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
        if (res.ok) {
          const data = await res.json();
          const state = data.instance?.state || data.state;
          setIsConnected(state === 'open');
        }
      } catch (e) {
        console.log('Erro ao verificar status');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Gerar QR Code
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
        } else if (data.status === 'open') {
          setIsConnected(true);
        }
      } else {
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
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const text = newMessage;
    setNewMessage('');

    try {
      // Salvar no Supabase
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

      // Enviar via Evolution
      const phone = selectedLead.phone?.replace(/\D/g, '');
      const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
      
      await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
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
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  // Tela de conexão
  if (!isConnected) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
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
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela do chat
  return (
    <div className={`h-[calc(100vh-80px)] flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold">Conversas</h2>
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="font-bold">{selectedLead.name}</h3>
              <p className="text-sm text-gray-500">{selectedLead.phone}</p>
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
                        : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white'
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
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
                >
                  Enviar
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