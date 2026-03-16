import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, MoreVertical, CheckCheck,
  Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, MessageSquare, Paperclip, Smile
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// 🔒 CONFIGURAÇÕES - USANDO PROXY DA VERCELL
const EVO_URL = "/api/evo"; // Proxy local
const EVO_GLOBAL_KEY = "minha_chave_simples_123"; 
const INSTANCE_NAME = "imobipro";

export default function WhatsAppPage() {
  const { user, leads, messages, addMessage, markAsRead, whatsappConnected, setWhatsappConnected, darkMode } = useGlobal();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'waiting_scan'>('disconnected');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const activeMessages = useMemo(() => {
    if (!selectedLead) return [];
    return (messages || []).filter((m: any) => m.leadId === selectedLead.id);
  }, [messages, selectedLead]);

  useEffect(() => {
    if (selectedLead) markAsRead(selectedLead.id);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead, activeMessages, markAsRead]);

  // ✅ VERIFICAR STATUS DA INSTÂNCIA
  useEffect(() => {
    const checkInstance = async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/fetchInstances`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        
        if (res.ok) {
          const instances = await res.json();
          console.log('Instâncias:', instances);
          
          const instance = instances.find((i: any) => 
            i.instance?.instanceName === INSTANCE_NAME
          );
          
          if (instance?.instance?.status === 'open') {
            setWhatsappConnected(true);
          }
        } else {
          console.error('Erro:', await res.text());
        }
      } catch (error) {
        console.error('Erro:', error);
      }
    };
    
    checkInstance();
  }, []);

  const startConnectionWatcher = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Status:', data);
          
          if (data.instance?.state === 'open' || data.instance?.status === 'open') {
            clearInterval(interval);
            setWhatsappConnected(true);
            setConnectionStatus('disconnected');
          }
        }
      } catch (e) {}
    }, 3000);
    
    setTimeout(() => clearInterval(interval), 120000);
  };

  // ✅ FUNÇÃO PARA GERAR QR CODE (SIMPLIFICADA)
  const handleGenerateQR = async () => {
    setConnectionStatus('generating');
    setErrorMessage(null);
    setQrCodeBase64(null);
    setIsLoading(true);

    try {
      console.log('Conectando na instância:', INSTANCE_NAME);
      
      // Tenta conectar
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
          setWhatsappConnected(true);
        } else {
          setErrorMessage('Instância existe mas não gerou QR Code');
        }
      } else {
        const errorText = await connectRes.text();
        console.error('Erro:', errorText);
        setErrorMessage(`Erro ${connectRes.status}: Não foi possível conectar`);
      }
      
    } catch (error: any) {
      console.error("Erro:", error);
      setErrorMessage(error.message || "Erro ao conectar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if(window.confirm("Desconectar WhatsApp?")) {
      try {
        await fetch(`${EVO_URL}/instance/logout/${INSTANCE_NAME}`, {
          method: 'DELETE',
          headers: { 'apikey': EVO_GLOBAL_KEY }
        });
        setWhatsappConnected(false);
        setConnectionStatus('disconnected');
        setQrCodeBase64(null);
      } catch (e) {}
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !selectedLead.phone) return;

    const messageText = newMessage;
    setNewMessage('');
    addMessage(selectedLead.id, messageText, 'sent');

    try {
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
    } catch (error) {}
  };

  if (!whatsappConnected) {
    return (
      <div className={`p-8 pb-32 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-sans ${theme.textMain}`}>
        <div className={`w-full max-w-4xl flex flex-col md:flex-row items-center gap-12 ${theme.bgCard} p-12 rounded-[48px] border ${theme.border} shadow-2xl`}>
          <div className="flex-1 space-y-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="text-emerald-500" size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Conecte o <span className="text-emerald-500">WhatsApp</span></h1>
              <p className={`${theme.textMuted} font-medium text-lg leading-relaxed`}>
                Sincronize o seu WhatsApp com o CRM. Leia o QR Code e centralize o seu atendimento.
              </p>
              {errorMessage && (
                <div className="mt-4 p-4 bg-red-500/10 text-red-500 rounded-2xl text-[11px] font-mono border border-red-500/20 break-words">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className={`w-full md:w-[400px] aspect-square rounded-[32px] border-2 border-dashed ${connectionStatus === 'waiting_scan' ? 'border-emerald-500/50 bg-emerald-500/5' : theme.border} flex flex-col items-center justify-center p-8 relative transition-all`}>
            {connectionStatus === 'disconnected' && (
              <div className="text-center space-y-6">
                <QrCode size={64} className={`${theme.textMuted} mx-auto opacity-50`} />
                <button 
                  onClick={handleGenerateQR} 
                  disabled={isLoading}
                  className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Conectando...' : 'Gerar QR Code'}
                </button>
              </div>
            )}

            {connectionStatus === 'generating' && (
              <div className="text-center space-y-4">
                <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto" />
                <p className="font-black uppercase tracking-widest text-[10px] animate-pulse">Obtendo QR Code...</p>
              </div>
            )}

            {connectionStatus === 'waiting_scan' && qrCodeBase64 && (
              <div className="text-center space-y-4 animate-in zoom-in">
                <div className="bg-white p-4 rounded-2xl shadow-xl">
                  <img src={qrCodeBase64} alt="QR Code" className="w-56 h-56" />
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-500">
                  <Loader2 size={16} className="animate-spin" />
                  <p className="font-black uppercase tracking-widest text-[10px]">Aguardando Leitura...</p>
                </div>
              </div>
            )}

            <div className={`absolute -bottom-4 bg-zinc-900 text-white px-6 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/10`}>
              <Shield size={14} className="text-emerald-500" /> Criptografia
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-80px)] flex animate-fade-in font-sans ${theme.textMain}`}>
      {/* Sidebar */}
      <div className={`w-80 border-r ${theme.border} ${theme.bgSidebar} flex flex-col`}>
        <div className={`p-6 border-b ${theme.border}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Conversas</h2>
            <button onClick={handleDisconnect} title="Desconectar" className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
            <input type="text" placeholder="Procurar..." className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 ${theme.textMain}`} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(leads || []).map((lead: any) => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)} className={`w-full p-4 border-b ${theme.border} flex items-start gap-4 ${selectedLead?.id === lead.id ? (darkMode ? 'bg-zinc-900' : 'bg-zinc-100') : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg">
                {lead.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <span className={`font-bold text-sm ${theme.textMain} block truncate`}>{lead.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedLead ? (
        <div className={`flex-1 flex flex-col ${theme.bgApp}`}>
          <div className={`h-20 border-b ${theme.border} ${theme.bgCard} flex items-center justify-between px-6`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                {selectedLead.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className={`font-bold ${theme.textMain}`}>{selectedLead.name}</h3>
                <p className={`text-[10px] font-black ${theme.textMuted} uppercase`}>{selectedLead.phone || 'Sem número'}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeMessages.map((msg: any) => (
              <div key={msg.id} className={`flex flex-col ${msg.direction === 'sent' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[70%] p-4 ${msg.direction === 'sent' ? `${theme.msgSentBg} text-white rounded-2xl rounded-tr-sm` : `${theme.msgReceivedBg} border ${theme.border} ${theme.textMain} rounded-2xl rounded-tl-sm`}`}>
                  <p className="text-sm font-medium">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className={`p-4 ${theme.bgCard} border-t ${theme.border}`}>
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input 
                type="text" 
                placeholder="Escreva uma mensagem..." 
                className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-2xl px-6 focus:outline-none focus:border-emerald-500 ${theme.textMain} text-sm`}
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()} className="p-4 bg-[#0217ff] text-white rounded-2xl disabled:opacity-50">
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center ${theme.bgApp}`}>
          <Smartphone size={40} className="text-emerald-500 mb-4 opacity-20" />
          <p className={`${theme.textMuted} font-medium`}>Selecione um cliente</p>
        </div>
      )}
    </div>
  );
}