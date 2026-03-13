import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, Phone, Video, MoreVertical, CheckCheck,
  Settings, Shield, Smartphone, ChevronLeft, Loader2,
  QrCode, Info, MessageSquare, Paperclip, Smile,
  Maximize2, User, Power
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

export default function WhatsAppPage() {
  const { leads, messages, addMessage, markAsRead, whatsappConnected, setWhatsappConnected, darkMode } = useGlobal();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filtra mensagens do lead selecionado
  const activeMessages = useMemo(() => {
    if (!selectedLead) return [];
    return (messages || []).filter(m => m.leadId === selectedLead.id);
  }, [messages, selectedLead]);

  // Scroll automático e marcação de lida
  useEffect(() => {
    if (selectedLead) {
      markAsRead(selectedLead.id);
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead, activeMessages, markAsRead]);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setWhatsappConnected(true);
      setIsConnecting(false);
    }, 2500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    addMessage({
      leadId: selectedLead.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'user',
      status: 'sent'
    });
    setNewMessage('');
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // TELA DE CONEXÃO (QR CODE)
  if (!whatsappConnected) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center animate-fade-in p-4">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-0 bg-white dark:bg-zinc-900 rounded-[40px] overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/5">
          <div className="p-12 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0217ff] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0217ff]/30">
                <MessageSquare className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black dark:text-white italic">IMOBIPRO<span className="text-[#0217ff]">.CONNECT</span></h1>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl font-black leading-tight dark:text-white">Escaneie para <br/><span className="text-[#0217ff]">sincronizar.</span></h2>
              <div className="space-y-5">
                {[
                  { icon: Smartphone, t: "Abra o WhatsApp", d: "No seu celular, acesse as configurações." },
                  { icon: Settings, t: "Aparelhos Conectados", d: "Toque em 'Conectar um aparelho'." },
                  { icon: QrCode, t: "Aponte a Câmera", d: "Capture o código ao lado para espelhar." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-[#0217ff]">
                      <step.icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black dark:text-white uppercase tracking-tighter">{step.t}</h4>
                      <p className="text-xs text-zinc-500 font-medium">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#f8f9fa] dark:bg-zinc-800/50 p-12 flex flex-col items-center justify-center relative">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl relative group">
              {isConnecting ? (
                <div className="w-64 h-64 flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="w-12 h-12 text-[#0217ff] animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 animate-pulse">Autenticando instância...</p>
                </div>
              ) : (
                <>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=imobipro-${Date.now()}`} 
                    alt="QR Code" 
                    className="w-64 h-64 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-white/80 backdrop-blur-sm rounded-[40px]">
                    <button onClick={handleConnect} className="px-8 py-4 bg-[#0217ff] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">
                      Gerar novo código
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              <Shield className="w-4 h-4 text-green-500" /> API CRIPTOGRAFADA PONTO-A-PONTO
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TELA DE CHAT ATIVA
  return (
    <div className={`h-[calc(100vh-140px)] flex border border-zinc-200 dark:border-white/5 rounded-[40px] overflow-hidden animate-fade-in shadow-2xl ${darkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
      
      {/* Sidebar: Lista de Conversas */}
      <div className={`w-80 md:w-96 flex flex-col border-r border-zinc-200 dark:border-[#202c33] ${darkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
        <div className={`p-5 flex items-center justify-between ${darkMode ? 'bg-[#202c33]' : 'bg-zinc-50'}`}>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#0217ff] flex items-center justify-center text-white font-black italic shadow-md">IP</div>
             <span className="text-xs font-black uppercase tracking-tighter dark:text-white">Conversas</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowConfig(true)} className="p-2.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5 rounded-xl transition-all"><Settings size={18} /></button>
          </div>
        </div>

        <div className="p-4">
          <div className={`relative flex items-center rounded-2xl px-4 py-2.5 ${darkMode ? 'bg-[#202c33]' : 'bg-zinc-100'}`}>
            <Search className="w-4 h-4 text-zinc-500 mr-3" />
            <input type="text" placeholder="Procurar lead..." className="bg-transparent border-none focus:outline-none text-sm w-full dark:text-white font-medium" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`w-full p-4 flex items-center gap-4 transition-all relative ${
                selectedLead?.id === lead.id ? (darkMode ? 'bg-[#2a3942]' : 'bg-zinc-100') : (darkMode ? 'hover:bg-[#202c33]' : 'hover:bg-zinc-50')
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#0217ff]/10 text-[#0217ff] flex items-center justify-center font-black text-xl flex-shrink-0">
                {lead.name.charAt(0)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-sm truncate dark:text-white uppercase tracking-tighter">{lead.name}</span>
                  <span className="text-[9px] text-zinc-500 font-black">12:45</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500 truncate font-medium">Certo, vamos agendar a visita...</p>
                  <div className={`w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]`} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col relative">
        {selectedLead ? (
          <>
            {/* Header do Chat */}
            <div className={`p-4 flex items-center justify-between border-b border-zinc-200 dark:border-[#202c33] z-10 ${darkMode ? 'bg-[#202c33]' : 'bg-white'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0217ff] to-blue-700 flex items-center justify-center text-white font-black text-lg shadow-xl shadow-blue-500/20">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black dark:text-white text-sm uppercase tracking-tighter">{selectedLead.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Aparelho Conectado</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all"><Phone size={18} /></button>
                <button className="p-3 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all"><Video size={18} /></button>
                <button className="p-3 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Mensagens com Wallpaper Estilo WhatsApp */}
            <div className={`flex-1 overflow-y-auto p-8 space-y-4 relative ${darkMode ? 'bg-[#0b141a]' : 'bg-[#e5ddd5]'}`}>
              {/* Wallpaper Pattern */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" />
              
              <div className="max-w-3xl mx-auto space-y-4 relative z-10">
                {activeMessages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-[22px] shadow-sm relative group ${
                        isUser 
                          ? (darkMode ? 'bg-[#005c4b] text-white rounded-tr-none' : 'bg-[#dcf8c6] text-zinc-900 rounded-tr-none') 
                          : (darkMode ? 'bg-[#202c33] text-white rounded-tl-none' : 'bg-white text-zinc-900 rounded-tl-none')
                      }`}>
                        <p className="text-sm font-medium leading-relaxed pr-10">{msg.content}</p>
                        <div className="flex items-center gap-1 absolute bottom-1.5 right-3">
                          <span className={`text-[9px] font-bold ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>{formatTime(msg.timestamp)}</span>
                          {isUser && <CheckCheck size={14} className="text-blue-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Barra de Input Estilizada */}
            <div className={`p-6 ${darkMode ? 'bg-[#202c33]' : 'bg-zinc-50'}`}>
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4">
                <button type="button" className="p-3 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5 rounded-2xl transition-all"><Paperclip size={20} /></button>
                <div className={`flex-1 rounded-2xl px-6 py-4 shadow-inner ${darkMode ? 'bg-[#2a3942]' : 'bg-white'}`}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escreva sua mensagem aqui..."
                    className="w-full bg-transparent border-none focus:outline-none dark:text-white font-medium text-sm"
                  />
                </div>
                <button type="submit" disabled={!newMessage.trim()} className={`p-4 rounded-2xl transition-all ${
                  newMessage.trim() ? 'bg-[#0217ff] text-white shadow-xl shadow-blue-600/30' : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800'
                }`}>
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center p-12 text-center ${darkMode ? 'bg-[#222e35]' : 'bg-[#f8f9fa]'}`}>
            <div className="w-24 h-24 bg-[#0217ff]/5 rounded-[32px] flex items-center justify-center text-[#0217ff] mb-8 animate-bounce">
              <MessageSquare size={40} />
            </div>
            <h2 className="text-3xl font-black dark:text-white italic mb-4">MENSAGENS<span className="text-[#0217ff]">.IMOBIPRO</span></h2>
            <p className="text-zinc-500 max-w-sm font-medium leading-relaxed mb-12">
              Selecione um lead ao lado para gerenciar a conversa. Toda a comunicação é sincronizada em tempo real com seu WhatsApp.
            </p>
            <div className="flex gap-4">
               <div className="px-6 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center gap-2">
                  <Shield size={14} className="text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Criptografia Ativa</span>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Painel de Configuração da API (Nível SaaS) */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[48px] shadow-2xl p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-[#0217ff]" />
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-[#0217ff]" />
                <h2 className="text-2xl font-black dark:text-white italic">API Gateway</h2>
              </div>
              <button onClick={() => setShowConfig(false)} className="p-3 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Endpoint do Servidor</label>
                <input type="text" defaultValue="https://evolution-api.imobipro.io" className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 px-5 focus:outline-none dark:text-white font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">ID Instância</label>
                  <input type="text" defaultValue="INST_019283" className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 px-5 focus:outline-none dark:text-white font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status</label>
                  <div className="w-full bg-green-500/10 border border-green-500/20 rounded-2xl py-4 px-5 text-green-500 font-black text-center text-xs">ONLINE</div>
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button onClick={() => {setWhatsappConnected(false); setShowConfig(false);}} className="flex-1 py-5 bg-red-500/10 text-red-500 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Desconectar</button>
                <button onClick={() => setShowConfig(false)} className="flex-1 py-5 bg-[#0217ff] text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-[#0217ff]/30">Salvar Gateway</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}