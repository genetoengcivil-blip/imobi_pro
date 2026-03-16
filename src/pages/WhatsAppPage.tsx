import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile, Unplug
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔒 CONFIGURAÇÕES
const EVO_URL = "/evo-api";
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { user, leads, darkMode } = useGlobal() as any;

  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  
  // 🔥 ESTADO DE MENSAGENS
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ TEMA (garantir que sempre tenha um valor)
  const theme = {
    bgApp: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    bgCard: darkMode ? 'bg-black' : 'bg-white',
    bgSidebar: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    border: darkMode ? 'border-white/5' : 'border-zinc-200',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    textMuted: darkMode ? 'text-zinc-500' : 'text-zinc-500',
    inputBg: darkMode ? 'bg-black' : 'bg-white',
    msgSentBg: 'bg-[#0217ff]',
    msgReceivedBg: darkMode ? 'bg-zinc-900' : 'bg-white',
  };

  // ✅ FUNÇÃO PARA ADICIONAR MENSAGEM
  const addLocalMessage = (leadId: string, content: string, direction: 'sent' | 'received') => {
    const newMsg = { 
      id: Date.now().toString(), 
      leadId, 
      content, 
      direction, 
      timestamp: new Date().toISOString() 
    };
    
    setLocalMessages(prev => {
      // Evita duplicatas
      if (prev.some(m => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  };

  const activeMessages = useMemo(() => {
    if (!selectedLead) return [];
    return localMessages.filter((m: any) => m.leadId === selectedLead.id);
  }, [localMessages, selectedLead]);

  // ✅ SCROLL AUTOMÁTICO
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // ✅ FORMATAR NÚMERO DE TELEFONE
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = `55${cleanPhone}`;
    }
    return cleanPhone;
  };

  // ✅ VERIFICAR STATUS DA INSTÂNCIA
  useEffect(() => {
    const checkInstance = async () => {
      try {
        console.log('Verificando instância...');
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Status:', data);
          
          if (data.instance?.state === 'open' || data.instance?.status === 'open' || data.state === 'open') {
            setIsWhatsappConnected(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar:', error);
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    checkInstance();
  }, []);

  // ✅ MONITORAR CONEXÃO DO QR CODE
  const startConnectionWatcher = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.instance?.state === 'open' || data.instance?.status === 'open' || data.state === 'open') {
            clearInterval(interval);
            setIsWhatsappConnected(true);
            setConnectionStatus('disconnected');
          }
        }
      } catch (e) {}
    }, 3000);
    
    setTimeout(() => clearInterval(interval), 120000);
  };

  // ✅ GERAR QR CODE
  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setErrorMessage(null);
    setQrCodeBase64(null);
    setIsLoading(true);

    try {
      console.log('Conectando na instância...');
      const connectRes = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: { 'apikey': EVO_GLOBAL_KEY }
      });
      
      if (connectRes.ok) {
        const connectData = await connectRes.json();
        console.log('Resposta:', connectData);
        
        if (connectData.base64) {
          setQrCodeBase64(connectData.base64);
          setConnectionStatus('waiting_scan');
          startConnectionWatcher();
        } else if (connectData.status === 'open') {
          setIsWhatsappConnected(true);
        } else {
          setErrorMessage('Não foi possível obter o QR Code');
          setConnectionStatus('disconnected');
        }
      } else {
        // Tenta criar uma nova instância
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
            setQrCodeBase64(createData.qrcode.base64);
            setConnectionStatus('waiting_scan');
            startConnectionWatcher();
          }
        } else {
          setErrorMessage('Erro ao criar instância');
          setConnectionStatus('disconnected');
        }
      }
    } catch (error: any) {
      console.error('Erro:', error);
      setErrorMessage(error.message || 'Erro ao conectar');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ DESCONECTAR
  const handleDisconnect = async () => {
    if (window.confirm("Desconectar o WhatsApp?")) {
      try {
        await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
          method: 'DELETE',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        setIsWhatsappConnected(false);
        setConnectionStatus('disconnected');
        setQrCodeBase64(null);
      } catch (e) {
        console.error('Erro ao desconectar:', e);
      }
    }
  };

  // ✅ ENVIAR MENSAGEM
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !selectedLead.phone) return;

    const messageText = newMessage;
    setNewMessage('');
    
    // Mostra na tela imediatamente
    addLocalMessage(selectedLead.id, messageText, 'sent');

    try {
      const cleanPhone = formatPhoneNumber(selectedLead.phone);
      
      const res = await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVO_GLOBAL_KEY
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: messageText,
          delay: 1200
        })
      });

      if (!res.ok) {
        console.error('Erro ao enviar');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  // ✅ LOADING INICIAL
  if (!initialCheckDone) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme.bgApp}`}>
        <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-sm text-zinc-500">Verificando conexão...</p>
      </div>
    );
  }

  // ✅ TELA DO CHAT (QUANDO CONECTADO)
  if (isWhatsappConnected) {
    return (
      <div className={`h-screen flex ${theme.bgApp} ${theme.textMain}`}>
        {/* SIDEBAR */}
        <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
          <div className={`p-4 border-b ${theme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Conversas</h2>
              <button 
                onClick={handleDisconnect}
                className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <Unplug size={16} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar..."
                className={`w-full pl-9 pr-3 py-2 rounded-lg border ${theme.border} ${theme.inputBg} text-sm focus:outline-none focus:border-emerald-500`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {leads?.map((lead: any) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full p-3 flex items-center gap-3 border-b ${theme.border} hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                  selectedLead?.id === lead.id ? (darkMode ? 'bg-zinc-900' : 'bg-zinc-100') : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  {lead.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{lead.name}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {lead.phone || 'Sem telefone'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CHAT AREA */}
        {selectedLead ? (
          <div className="flex-1 flex flex-col">
            {/* HEADER */}
            <div className={`h-16 px-4 border-b ${theme.border} ${theme.bgCard} flex items-center gap-3`}>
              <button 
                onClick={() => setSelectedLead(null)}
                className="lg:hidden p-2"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                {selectedLead.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium">{selectedLead.name}</h3>
                <p className="text-xs text-zinc-500">{selectedLead.phone}</p>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.direction === 'sent'
                        ? 'bg-[#0217ff] text-white'
                        : `${theme.msgReceivedBg} border ${theme.border}`
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* INPUT */}
            <div className={`p-4 border-t ${theme.border} ${theme.bgCard}`}>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className={`flex-1 px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} focus:outline-none focus:border-emerald-500`}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-[#0217ff] text-white rounded-lg disabled:opacity-50 hover:bg-[#0211bf] transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Selecione uma conversa
          </div>
        )}
      </div>
    );
  }

  // ✅ TELA DE QR CODE (QUANDO DESCONECTADO)
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme.bgApp}`}>
      <div className={`max-w-md w-full ${theme.bgCard} rounded-2xl border ${theme.border} p-8 shadow-xl`}>
        <div className="text-center mb-6">
          <MessageSquare className="text-emerald-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2">Conectar WhatsApp</h1>
          <p className="text-sm text-zinc-500">
            Escaneie o QR Code com seu WhatsApp para começar
          </p>
        </div>

        <div className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center p-4 mb-4 ${
          connectionStatus === 'waiting_scan' ? 'border-emerald-500' : theme.border
        }`}>
          {connectionStatus === 'disconnected' && (
            <div className="text-center">
              <QrCode className="text-zinc-400 mx-auto mb-4" size={64} />
              <button
                onClick={handleGenerateQR}
                disabled={isLoading}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Gerando...' : 'Gerar QR Code'}
              </button>
            </div>
          )}

          {connectionStatus === 'generating' && (
            <div className="text-center">
              <Loader2 className="text-emerald-500 animate-spin mx-auto mb-4" size={48} />
              <p className="text-sm text-zinc-500">Obtendo QR Code...</p>
            </div>
          )}

          {connectionStatus === 'waiting_scan' && qrCodeBase64 && (
            <div className="text-center">
              <img src={qrCodeBase64} alt="QR Code" className="w-full max-w-[200px] mx-auto mb-4" />
              <p className="text-sm text-emerald-500 animate-pulse">
                Aguardando leitura...
              </p>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm text-center">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}