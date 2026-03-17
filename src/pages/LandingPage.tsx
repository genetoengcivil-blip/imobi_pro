import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Star, Check, Play, ChevronDown, 
  MessageSquare, Globe, Calculator, ShieldCheck, Zap, 
  Database, Cpu, Smartphone, Layout, MessageCircle, Users, Building2, TrendingUp,
  Shield, Award, BarChart3
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

  const stats = [
    { icon: TrendingUp, value: 'R$ 850M+', label: 'VGV TRANSACIONADO' },
    { icon: Users, value: '3.400+', label: 'CORRETORES ATIVOS' },
    { icon: Building2, value: '18.000+', label: 'NEGÓCIOS FECHADOS' },
    { icon: MessageSquare, value: '12M+', label: 'MENSAGENS AUTO' }
  ];

  const testimonials = [
    { name: 'Ricardo Mendes', role: 'Corretor Alto Padrão', text: 'Eu perdia vendas por falta de follow-up. O ImobiPro mudou meu jogo. Fechei 3 imóveis a mais no mês.', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { name: 'Camila Oliveira', role: 'Especialista em Lançamentos', text: 'Finalmente um sistema que entende a rotina de quem está na rua! O design é incrível e rápido.', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Marcos Almeida', role: 'Imobiliária Almeida', text: 'Ter meu próprio site integrado ao CRM me deu uma autoridade absurda. Leads caem direto no WhatsApp.', img: 'https://randomuser.me/api/portraits/men/85.jpg' },
    { name: 'Juliana Costa', role: 'Corretora Autônoma', text: 'O funil de vendas é muito visual. Sei exatamente em que etapa cada cliente está para fechar negócio.', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  ];

  const plans = [
    {
      name: 'Mensal',
      price: 'R$ 97',
      period: '/mês',
      description: 'Aceleração imediata para sua carreira.',
      url: 'https://checkout.nexano.com.br/checkout/cmm6s7hwb016j1rmj3wse63np?offer=72D7TSV',
      highlight: false
    },
    {
      name: 'Anual',
      price: 'R$ 697',
      period: '/ano',
      description: 'O plano dos Top Producers. Economia real.',
      url: 'https://checkout.nexano.com.br/checkout/cmm6s7hwb016j1rmj3wse63np?offer=Q71NMPM',
      highlight: true
    },
    {
      name: 'Semestral',
      price: 'R$ 497',
      period: '/semestre',
      description: 'Ideal para quem busca consistência técnica.',
      url: 'https://checkout.nexano.com.br/checkout/cmm6s7hwb016j1rmj3wse63np?offer=E5P0U6B',
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#0217ff]/30 overflow-x-hidden font-['Inter',sans-serif]">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .animate-carousel { animation: marquee 50s linear infinite; }
        .pause-on-hover:hover { animation-play-state: paused; }
        @keyframes pulse-blue { 0% { box-shadow: 0 0 0 0 rgba(2, 23, 255, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(2, 23, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(2, 23, 255, 0); } }
        .wa-pulse { animation: pulse-blue 2s infinite; }
      `}</style>

      {/* Botão WhatsApp Flutuante */}
      <a href="https://wa.me/5583986667292" target="_blank" className="fixed bottom-8 right-8 z-[100] bg-[#25d366] p-5 rounded-full shadow-2xl wa-pulse hover:scale-110 transition-transform"><MessageCircle size={32} color="white" fill="white" /></a>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-2xl font-[900] tracking-tighter italic uppercase">IMOBI<span className="text-[#0217ff]">PRO</span></span>
          </div>          
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-20 px-6 relative text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0217ff]/20 via-transparent to-transparent opacity-60 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[#0217ff] text-[10px] font-black uppercase tracking-[0.3em] mb-12"><Zap size={14} className="fill-[#0217ff]" /> Software de Performance Imobiliária</div>
          <h1 className="text-6xl md:text-[110px] font-[900] mb-10 leading-[0.85] tracking-tighter italic uppercase">VENDA MAIS. <br /><span className="text-[#0217ff]">TRABALHE MENOS.</span></h1>
          <p className="text-xl md:text-2xl text-zinc-400 mb-16 max-w-3xl mx-auto font-medium italic leading-relaxed">A plataforma definitiva para corretores que buscam autoridade, automação e fechamentos em escala.</p>
          <button onClick={scrollToPlans} className="px-14 py-7 bg-[#0217ff] text-white rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto mb-20">Garantir Meu Acesso <ArrowRight className="w-6 h-6" /></button>

          {/* Video Section Otimizada */}
          <div className="max-w-5xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#0217ff] to-cyan-500 rounded-[56px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative rounded-[56px] overflow-hidden border-8 border-white/5 bg-zinc-950 aspect-video shadow-2xl">
              <video controls className="w-full h-full object-cover" poster="https://tnsppmfyrxazvquaggkg.supabase.co/storage/v1/object/public/public-assets/logo%20imobi%20Pro.jpg">
                <source src="https://tnsppmfyrxazvquaggkg.supabase.co/storage/v1/object/public/public-assets/Design%20sem%20nome2.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Números do Sistema */}
      <section className="py-32 px-6 border-y border-white/5 bg-zinc-950/30">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((s, i) => (
            <div key={i} className="text-center group">
              <div className="w-16 h-16 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#0217ff] transition-all duration-500"><s.icon size={28} className="text-[#0217ff] group-hover:text-white" /></div>
              <div className="text-5xl font-[900] italic tracking-tighter mb-2">{s.value}</div>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Carrossel de Depoimentos em Loop */}
      <section className="py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16"><h2 className="text-5xl font-[900] italic uppercase tracking-tighter">Quem usa, <span className="text-[#0217ff]">Domina o Mercado.</span></h2></div>
        <div className="flex overflow-hidden relative">
          <div className="flex w-max animate-carousel pause-on-hover gap-8 px-4">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-[450px] p-12 rounded-[56px] bg-black border border-white/5 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex gap-1 mb-8">{[...Array(5)].map((_, j) => <Star key={j} size={18} className="fill-[#0217ff] text-[#0217ff]" />)}</div>
                  <p className="text-zinc-300 text-xl italic font-medium leading-relaxed">"{t.text}"</p>
                </div>
                <div className="mt-12 flex items-center gap-4">
                  <img src={t.img} className="w-16 h-16 rounded-full border-2 border-[#0217ff]/20" />
                  <div>
                    <div className="font-black uppercase tracking-tighter text-lg">{t.name}</div>
                    <div className="text-[10px] text-[#0217ff] font-black uppercase tracking-widest">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10"></div>
        </div>
      </section>

      {/* Planos */}
      <section id="plans" className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {plans.map((p, i) => (
            <div key={i} className={`p-14 rounded-[70px] border-2 flex flex-col ${p.highlight ? 'bg-[#0217ff]/5 border-[#0217ff] scale-105 relative shadow-[0_0_50px_rgba(2,23,255,0.1)]' : 'bg-black border-white'}`}>
              {p.highlight && <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-10 py-3 bg-[#0217ff] text-white text-[10px] font-[900] uppercase tracking-widest rounded-full shadow-lg">Top Producers</div>}
              <div className="mb-14 text-center md:text-left">
                <h3 className="text-xl font-black italic uppercase tracking-widest mb-6">{p.name}</h3>
                <div className="flex items-baseline gap-2 mb-4 justify-center md:justify-start">
                  <span className="text-6xl font-[900] italic tracking-tighter">{p.price}</span>
                  <span className="text-zinc-500 font-bold uppercase text-[10px]">{p.period}</span>
                </div>
                <p className="text-zinc-500 font-medium italic text-lg">{p.description}</p>
              </div>
              <div className="space-y-6 flex-1 mb-14">
                {['WhatsApp Instância Única', 'Automação de Boas-vindas', 'Pipeline de VGV Ativo', 'Site Público Otimizado'].map((f, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-[#0217ff]/20 flex items-center justify-center"><Check size={12} className="text-[#0217ff]" strokeWidth={4} /></div>
                    <span className="text-zinc-300 text-[11px] font-black uppercase tracking-widest">{f}</span>
                  </div>
                ))}
              </div>
              <a href={p.url} className={`w-full py-7 rounded-[30px] font-[900] text-sm uppercase tracking-[0.25em] transition-all text-center ${p.highlight ? 'bg-[#0217ff] text-white hover:bg-[#0211bf]' : 'bg-white text-black hover:bg-zinc-200'}`}>Assinar Agora</a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 bg-zinc-950 text-center">
        <Logo className="w-16 h-16 mx-auto mb-10" />
        <div className="flex gap-10 justify-center mb-14 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
          <Link to="/terms" className="hover:text-white transition-colors">Termos</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
          <a href="mailto:atendimento.imobipro@gmail.com" className="lowercase tracking-normal italic hover:text-white transition-colors">atendimento.imobipro@gmail.com</a>
        </div>
        <div className="text-zinc-800 text-[10px] font-black uppercase tracking-[0.6em]">IMOBIPRO SYSTEMS — ALL RIGHTS RESERVED</div>
      </footer>

      {/* Banner LGPD */}
      {showLGPD && (
        <div className="fixed bottom-6 left-6 right-6 z-[110]">
          <div className="max-w-4xl mx-auto bg-zinc-900/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="flex items-center gap-6 text-left">
              <Shield size={48} className="text-[#0217ff] shrink-0" />
              <div>
                <h4 className="font-black italic uppercase text-sm mb-1">Segurança de Dados Nexano</h4>
                <p className="text-[11px] text-zinc-500 font-medium italic">Utilizamos tecnologias para otimizar sua experiência técnica. <Link to="/privacy" className="text-white underline">Saiba mais</Link>.</p>
              </div>
            </div>
            <button onClick={acceptLGPD} className="px-10 py-4 bg-white text-black font-[900] text-[10px] uppercase tracking-widest rounded-2xl whitespace-nowrap">Aceitar e Continuar</button>
          </div>
        </div>
      )}
    </div>
  );
}