import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Star, Check, ChevronDown, 
  MessageSquare, Globe, Calculator, ShieldCheck, Zap, 
  Database, Cpu, Smartphone, Layout, MessageCircle, Users, Building2, TrendingUp,
  Shield, Award, BarChart3, Play
} from 'lucide-react';
import { Logo } from '../components/Logo';

export default function LandingPage() {
  const navigate = useNavigate();
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
    { label: 'Leads Capturados', value: '+240k', icon: Users },
    { label: 'VGV Gerenciado', value: 'R$ 1.8B', icon: BarChart3 },
    { label: 'Corretores Ativos', value: '+4.5k', icon: Award },
    { label: 'Mensagens Auto', value: '+12M', icon: MessageSquare },
  ];

  const testimonials = [
    { name: "Ricardo Almeida", role: "Corretor Luxury", text: "O ImobiPro mudou meu jogo. O lead chega no Instagram e em 5 segundos meu WhatsApp já respondeu." },
    { name: "Juliana Costa", role: "Imobiliária High-End", text: "A melhor taxa de conversão que já tive. O site que o sistema gera é absurdamente rápido." },
    { name: "Marcos Silva", role: "Top Producer", text: "Gerenciar meu VGV e o WhatsApp no mesmo lugar é o que eu precisava para escalar meu negócio." },
    { name: "Ana Beatriz", role: "Consultora Imobiliária", text: "A automação de boas-vindas filtra os curiosos e me entrega apenas os leads realmente quentes." },
    { name: "Felipe Melo", role: "Diretor Comercial", text: "Segurança total. As instâncias isoladas dão uma tranquilidade que nenhum outro CRM oferece." },
  ];

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
    <div className="min-h-screen bg-black text-white selection:bg-[#0217ff]/30 overflow-x-hidden font-['Inter',sans-serif]">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .animate-marquee-slow { animation: marquee 60s linear infinite; }
        
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
      <section className="pt-48 pb-20 px-6 relative overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0217ff]/20 via-transparent to-transparent opacity-60 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[#0217ff] text-[10px] font-black uppercase tracking-[0.3em] mb-12">
            <Zap className="w-4 h-4 fill-[#0217ff]" /> Tecnologia Nexano Systems
          </div>
          <h1 className="text-5xl md:text-[110px] font-[900] mb-10 leading-[0.85] tracking-tighter italic uppercase animate-in fade-in slide-in-from-bottom-10 duration-1000">
            PARE DE TRABALHAR <br />
            <span className="text-[#0217ff]">PARA O SEU CRM.</span>
          </h1>
          <p className="text-lg md:text-2xl text-zinc-400 mb-16 max-w-3xl mx-auto font-medium italic leading-relaxed">
            Deixe que o ImobiPro cuide das automações enquanto você foca no fechamento. 100% integrado com WhatsApp via instâncias exclusivas.
          </p>
          <button onClick={scrollToPlans} className="px-12 py-7 bg-[#0217ff] text-white rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto mb-20">
            Começar Jornada <ArrowRight className="w-6 h-6" />
          </button>

          {/* SECTION VÍDEO DEMONSTRAÇÃO */}
          <div className="max-w-5xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#0217ff] to-cyan-500 rounded-[40px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-zinc-950 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
               <video 
                autoPlay 
                muted 
                loop 
                playsInline
                className="w-full h-full object-cover opacity-60"
                poster="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2000"
               >
                 <source src="SEU_LINK_DE_VIDEO_AQUI.mp4" type="video/mp4" />
               </video>
               <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center group-hover:bg-black/20 transition-all cursor-pointer">
                  <div className="w-24 h-24 bg-[#0217ff] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 fill-white text-white ml-2" />
                  </div>
                  <span className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] italic">Ver demonstração técnica</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Métricas do SaaS */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center p-10 rounded-[48px] border border-white/5 bg-zinc-950/50 hover:border-[#0217ff]/30 transition-all">
              <div className="flex justify-center mb-4 text-[#0217ff]"><s.icon size={28} /></div>
              <div className="text-5xl font-[900] italic tracking-tighter mb-1">{s.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Carrossel Infinito de Depoimentos */}
      <section className="py-32 bg-zinc-950 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 mb-16 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">
              Resultados de <span className="text-[#0217ff]">quem decidiu escalar.</span>
            </h2>
            <p className="text-zinc-500 font-bold uppercase text-[10px] mt-2 tracking-widest">Feedback real dos nossos usuários Black Edition</p>
          </div>
        </div>
        <div className="flex overflow-hidden relative">
          <div className="flex w-max animate-marquee-slow gap-8 px-4 pause-on-hover">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-[450px] p-10 rounded-[50px] border border-white/10 bg-black flex flex-col justify-between shadow-xl">
                <p className="text-zinc-300 italic font-medium text-lg leading-relaxed mb-10">"{t.text}"</p>
                <div>
                  <div className="flex gap-1 mb-4 text-[#0217ff]">
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                  </div>
                  <div className="font-[900] uppercase italic text-lg">{t.name}</div>
                  <div className="text-[10px] font-black text-[#0217ff] uppercase tracking-[0.2em] mt-1">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Gradients para suavizar o loop */}
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10"></div>
        </div>
      </section>

      {/* Pricing */}
      <section id="plans" className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {plans.map((p, i) => (
            <div key={i} className={`p-14 rounded-[70px] border-2 transition-all duration-500 flex flex-col ${p.highlight ? 'bg-[#0217ff]/5 border-[#0217ff] scale-105 relative shadow-[0_0_50px_rgba(2,23,255,0.1)]' : 'bg-black border-white'}`}>
              {p.highlight && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-10 py-3 bg-[#0217ff] text-white text-[10px] font-[900] uppercase tracking-widest rounded-full shadow-lg">Mais Assinado</div>
              )}
              <div className="mb-14">
                <h3 className="text-2xl font-[900] italic uppercase tracking-widest mb-6">{p.name}</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-7xl font-[900] italic tracking-tighter">{p.price}</span>
                  <span className="text-zinc-500 font-black uppercase text-xs">{p.period}</span>
                </div>
                <p className="text-zinc-500 font-medium italic text-lg">{p.description}</p>
              </div>
              <div className="space-y-6 flex-1 mb-14">
                {['Instância WhatsApp Própria', 'CRM de VGV Integrado', 'Automação de Boas-vindas', 'Site Público de Vendas', 'Suporte 24/7 Nexano'].map((f, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-5 h-5 bg-[#0217ff]/20 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-[#0217ff]" strokeWidth={4} />
                    </div>
                    <span className="text-zinc-300 text-[11px] font-black uppercase tracking-[0.15em]">{f}</span>
                  </div>
                ))}
              </div>
              <a href={p.url} className={`w-full py-7 rounded-[30px] font-[900] text-sm uppercase tracking-[0.25em] transition-all text-center ${p.highlight ? 'bg-[#0217ff] text-white hover:bg-[#0211bf]' : 'bg-white text-black hover:bg-zinc-200'}`}>
                Entrar para a Elite
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* LGPD Banner */}
      {showLGPD && (
        <div className="fixed bottom-6 left-6 right-6 z-[110]">
          <div className="max-w-4xl mx-auto bg-zinc-900/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-6 text-left">
              <Shield className="w-12 h-12 text-[#0217ff]" />
              <div>
                <h4 className="font-black italic uppercase text-sm mb-1 tracking-tight">Segurança de Dados Nexano</h4>
                <p className="text-[11px] text-zinc-500 font-medium italic">Utilizamos tecnologias para otimizar sua experiência técnica. <Link to="/privacy" className="text-white underline">Saiba mais</Link>.</p>
              </div>
            </div>
            <button onClick={acceptLGPD} className="px-10 py-4 bg-white text-black font-[900] text-[10px] uppercase tracking-widest rounded-2xl">Eu Aceito</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 text-center bg-zinc-950">
        <Logo className="w-16 h-16 mx-auto mb-10" />
        <div className="flex gap-10 justify-center mb-14 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
          <Link to="/terms" className="hover:text-[#0217ff] transition-colors">Termos</Link>
          <Link to="/privacy" className="hover:text-[#0217ff] transition-colors">Privacidade</Link>
          <a href="mailto:contato@imobipro.tech" className="lowercase tracking-normal italic hover:text-white transition-colors">contato@imobipro.tech</a>
        </div>
        <div className="text-zinc-800 text-[10px] font-black uppercase tracking-[0.6em]">NEXANO SYSTEMS — IMOBIPRO PRO</div>
      </footer>
    </div>
  );
}