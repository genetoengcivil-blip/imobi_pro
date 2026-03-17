import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Star, Check, ChevronDown, 
  MessageSquare, Globe, Calculator, ShieldCheck, Zap, 
  Database, Cpu, Smartphone, Layout, MessageCircle, Users, Building2, TrendingUp,
  Shield
} from 'lucide-react';
import { Logo } from '../components/Logo';

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showLGPD, setShowLGPD] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('imobipro_consent');
    if (!consent) {
      const timer = setTimeout(() => setShowLGPD(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptLGPD = () => {
    localStorage.setItem('imobipro_consent', 'true');
    setShowLGPD(false);
  };

  const scrollToPlans = () => {
    document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
  };

  const plans = [
    {
      name: 'Professional',
      price: 'R$ 97',
      period: '/mês',
      description: 'Perfeito para corretores autônomos.',
      url: 'https://checkout.nexano.com.br/checkout/cmm6s7hwb016j1rmj3wse63np?offer=72D7TSV',
      highlight: false
    },
    {
      name: 'Black Edition',
      price: 'R$ 697',
      period: '/ano',
      description: 'Otimizado para quem vende alto padrão.',
      url: 'https://checkout.nexano.com.br/checkout/cmm6s7hwb016j1rmj3wse63np?offer=Q71NMPM',
      highlight: true
    },
    {
      name: 'Performance',
      price: 'R$ 497',
      period: '/semestre',
      description: 'Escala e automação para seu pipeline.',
      url: 'https://checkout.nexano.com.br/checkout/cmm6s7hwb016j1rmj3wse63np?offer=E5P0U6B',
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0217ff]/30 overflow-x-hidden">
      
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .pause-on-hover:hover { animation-play-state: paused; }
        @keyframes pulse-blue { 0% { box-shadow: 0 0 0 0 rgba(2, 23, 255, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(2, 23, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(2, 23, 255, 0); } }
        .wa-pulse { animation: pulse-blue 2s infinite; }
      `}</style>

      {/* Botão WhatsApp Suporte */}
      <a href="https://wa.me/5583986667292" target="_blank" className="fixed bottom-8 right-8 z-[100] bg-[#25d366] p-5 rounded-full shadow-2xl wa-pulse hover:scale-110 transition-transform">
        <MessageCircle size={32} color="white" fill="white" />
      </a>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter italic uppercase">IMOBI<span className="text-[#0217ff]">PRO</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest hover:text-[#0217ff] transition-colors">Acessar CRM</button>
            <button onClick={scrollToPlans} className="px-8 py-3 bg-[#0217ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">Assinar</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0217ff]/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[#0217ff] text-[10px] font-black uppercase tracking-[0.3em] mb-12 animate-fade-in">
            <Zap className="w-4 h-4 fill-[#0217ff]" /> Ecossistema para Top Producers
          </div>
          <h1 className="text-6xl md:text-[120px] font-black mb-10 leading-[0.85] tracking-tighter italic uppercase">
            PARE DE PERDER <br />
            <span className="text-[#0217ff]">CLIENTES NO WHATSAPP.</span>
          </h1>
          <p className="text-xl md:text-3xl text-zinc-500 mb-16 max-w-4xl mx-auto font-medium italic leading-relaxed">
            O único CRM imobiliário que automatiza o primeiro contato e gera sites de alta conversão em segundos.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button onClick={scrollToPlans} className="px-14 py-7 bg-[#0217ff] text-white rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
              Começar Agora <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Tech Stack Marquee */}
      <section className="py-20 border-y border-white/5 bg-zinc-950/50">
        <div className="flex overflow-hidden">
          <div className="flex w-max animate-marquee gap-32 items-center px-10">
            {[1, 2].map((loop) => (
              <div key={loop} className="flex gap-32 items-center">
                <div className="flex items-center gap-4 opacity-30"><Database size={40} className="text-[#0217ff]" /> <span className="font-black text-2xl">SUPABASE DB</span></div>
                <div className="flex items-center gap-4 opacity-30"><Cpu size={40} className="text-cyan-400" /> <span className="font-black text-2xl">EDGE FUNCTIONS</span></div>
                <div className="flex items-center gap-4 opacity-30"><Smartphone size={40} className="text-emerald-500" /> <span className="font-black text-2xl">EVOLUTION API</span></div>
                <div className="flex items-center gap-4 opacity-30"><Layout size={40} className="text-blue-400" /> <span className="font-black text-2xl">VITE ENGINE</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: MessageSquare, title: 'Instância Isolada', desc: 'Cada corretor tem sua própria instância de WhatsApp, garantindo segurança e 0% de interrupção.' },
            { icon: Globe, title: 'Site de Vendas v4', desc: 'Capture leads automaticamente com sites otimizados para a bio do seu Instagram.' },
            { icon: Calculator, title: 'Inteligência de VGV', desc: 'Acompanhe seu volume geral de vendas e previsões de comissão em tempo real.' },
            { icon: ShieldCheck, title: 'Protocolo de Dados', desc: 'Total conformidade com a LGPD e criptografia de ponta a ponta em todos os leads.' }
          ].map((feat, i) => (
            <div key={i} className="p-10 rounded-[48px] border border-white/5 bg-zinc-900/20 hover:border-[#0217ff]/50 transition-all group">
              <div className="w-16 h-16 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0217ff] transition-all">
                <feat.icon size={32} className="text-[#0217ff] group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">{feat.title}</h3>
              <p className="text-zinc-500 font-medium italic text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing - White Border Design */}
      <section id="plans" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter">Escolha seu <span className="text-[#0217ff]">Nível de Jogo.</span></h2>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {plans.map((p, i) => (
            <div key={i} className={`p-12 rounded-[64px] border-2 flex flex-col ${p.highlight ? 'bg-[#0217ff]/5 border-[#0217ff] scale-105 relative' : 'bg-black border-white'}`}>
              {p.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2 bg-[#0217ff] text-white text-[9px] font-black uppercase tracking-widest rounded-full">Recomendado</div>
              )}
              <div className="mb-12">
                <h3 className="text-xl font-black italic uppercase tracking-widest mb-6">{p.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-6xl font-black italic tracking-tighter">{p.price}</span>
                  <span className="text-zinc-500 font-bold uppercase text-[10px]">{p.period}</span>
                </div>
                <p className="text-zinc-500 font-medium italic">{p.description}</p>
              </div>
              <div className="space-y-6 flex-1 mb-12">
                {['Automação de Boas-vindas', 'Instância WhatsApp Inclusa', 'Gestão de VGV Ativo', 'Site Público de Vendas'].map((f, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <Check size={16} className="text-[#0217ff]" strokeWidth={4} />
                    <span className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">{f}</span>
                  </div>
                ))}
              </div>
              <a href={p.url} className={`w-full py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all text-center ${p.highlight ? 'bg-[#0217ff] text-white' : 'bg-white text-black'}`}>
                Assinar Agora
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* LGPD Banner */}
      {showLGPD && (
        <div className="fixed bottom-6 left-6 right-6 z-[110]">
          <div className="max-w-4xl mx-auto bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-4 text-left">
              <Shield className="w-10 h-10 text-[#0217ff]" />
              <p className="text-xs text-zinc-400 italic">Utilizamos tecnologias de rastreio para otimizar sua experiência técnica. Ao continuar, você aceita nossa <Link to="/privacy" className="text-white underline">Política de Privacidade</Link>.</p>
            </div>
            <button onClick={acceptLGPD} className="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl">Aceitar</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 text-center">
        <Logo className="w-12 h-12 mx-auto mb-8" />
        <div className="flex gap-8 justify-center mb-12 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <Link to="/terms" className="hover:text-white">Termos</Link>
          <Link to="/privacy" className="hover:text-white">Privacidade</Link>
          <a href="mailto:suporte@imobipro.com" className="lowercase tracking-normal italic">suporte@imobipro.com</a>
        </div>
        <div className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} IMOBIPRO TECH.</div>
      </footer>
    </div>
  );
}