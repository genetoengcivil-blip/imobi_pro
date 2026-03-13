import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Book, MessageSquare, Mail, FileText } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function HelpCenterPage() {
  const navigate = useNavigate();

  const categories = [
    { icon: Book, title: 'Primeiros Passos', desc: 'Aprenda a configurar a sua conta e os primeiros imóveis.' },
    { icon: FileText, title: 'Gestão de Leads', desc: 'Como usar o funil Kanban e organizar os seus clientes.' },
    { icon: MessageSquare, title: 'Integração WhatsApp', desc: 'Configure as respostas rápidas e a conexão.' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0217ff]/30">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => navigate('/landing')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold">
            <ArrowLeft className="w-5 h-5" /> Voltar ao Início
          </button>
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-xl">Imobi<span className="text-[#0217ff]">Pro</span></span>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6">Como podemos ajudar?</h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Pesquise por uma dúvida..." 
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-[#0217ff] text-white text-lg transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {categories.map((c, i) => (
            <div key={i} className="p-6 rounded-3xl bg-zinc-900/50 border border-white/10 hover:border-[#0217ff]/50 transition-colors cursor-pointer group">
              <c.icon className="w-8 h-8 text-[#0217ff] mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">{c.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#0217ff]/20 to-black border border-[#0217ff]/30 text-center">
          <h2 className="text-2xl font-bold mb-4">Não encontrou o que procurava?</h2>
          <p className="text-zinc-400 mb-8">A nossa equipa de suporte está pronta para ajudar a alavancar as suas vendas.</p>
          <button className="px-8 py-4 bg-[#0217ff] hover:bg-[#0211bf] text-white rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 mx-auto">
            <Mail className="w-5 h-5" /> Falar com o Suporte
          </button>
        </div>
      </div>
    </div>
  );
}