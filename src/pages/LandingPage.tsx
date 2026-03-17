import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Star, Check, ChevronDown, 
  MessageSquare, Globe, Calculator, ShieldCheck, Zap, 
  Database, Cpu, Smartphone, Layout, MessageCircle, Users, Building2, TrendingUp,
  Shield, Award, BarChart3
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
      <section className="pt-48 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0217ff]/15 via-transparent to-transparent opacity-60 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[#0217ff] text-[10px] font-black uppercase tracking-[0.3em] mb-12">
            <Zap className="w-4 h-4 fill-[#0217ff]" /> Ecossistema para Top Producers
          </div>
          <h1 className="text-6xl md:text-[110px] font-[900] mb-10 leading-[0.85] tracking-tighter italic uppercase">
            VENDA MAIS <br />
            <span className="text-[#0217ff]">AUTOMATIZE TUDO.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 mb-16 max-w-3xl mx-auto font-medium italic leading-relaxed">
            O único CRM que combina instâncias exclusivas de WhatsApp com inteligência de dados para o mercado imobiliário.
          </p>
          <button onClick={scrollToPlans} className="px-12 py-7 bg-[#0217ff] text-white rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto">
            Garantir minha vaga <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Métricas do SaaS */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center p-8 rounded-[40px] border border-white/5 bg-zinc-950">
              <div className="flex justify-center mb-4 text-[#0217ff]"><s.icon size={24} /></div>
              <div className="text-4xl font-black italic tracking-tighter mb-1">{s.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Carrossel Infinito de Depoimentos */}
      <section className="py-32 bg-zinc-950/50 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter border-l-4 border-[#0217ff] pl-6">
            Quem usa, <span className="text-[#0217ff]">domina o mercado.</span>
          </h2>
        </div>
        <div className="flex overflow-hidden relative">
          <div className="flex w-max animate-marquee-slow gap-8 px-4 pause-on-hover">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-[400px] p-8 rounded-[40px] border border-white/10 bg-black flex flex-col justify-between">
                <p className="text-zinc-400 italic font-medium mb-8">"{t.text}"</p>
                <div>
                  <div className="flex gap-1 mb-2 text-[#0217ff]">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="currentColor" />)}
                  </div>
                  <div className="font-black uppercase italic text-sm">{t.name}</div>
                  <div className="text-[10px] font-bold text-[#0217ff] uppercase tracking-widest">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: MessageSquare, title: 'Multi-Instâncias', desc: 'Sua conta é única. Sem compartilhamento de IP, reduzindo o risco de banimento ao extremo.' },
            { icon: Globe, title: 'Lead Magnet v4', desc: 'Sites que carregam em 0.8s, otimizados para converter o tráfego do seu Instagram.' },
            { icon: Calculator, title: 'Finanças de Elite', desc: 'Calcule comissões, VGV e lucro líquido automaticamente a cada fechamento.' },
            { icon: ShieldCheck, title: 'Infra Oracle', desc: 'Hospedado na infraestrutura mais robusta do mundo para garantir 99.9% de uptime.' }
          ].map((feat, i) => (
            <div key={i} className="p-10 rounded-[48px] border border-white/5 bg-zinc-900/20 group hover:border-[#0217ff]/50 transition-all">
              <div className="w-16 h-16 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0217ff] transition-all">
                <feat.icon size={32} className="text-[#0217ff] group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">{feat.title}</h3>
              <p className="text-zinc-500 font-medium italic text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="plans" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter">Planos <span className="text-[#0217ff]">Estratégicos.</span></h2>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {plans.map((p, i) => (
            <div key={i} className={`p-12 rounded-[64px] border-2 flex flex-col ${p.highlight ? 'bg-[#0217ff]/5 border-[#0217ff] scale-105 relative' : 'bg-black border-white'}`}>
              {p.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2 bg-[#0217ff] text-white text-[9px] font-black uppercase tracking-widest rounded-full">Melhor Custo-Benefício</div>
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
                {['WhatsApp Instância Única', 'Automação de Boas-vindas', 'Pipeline de VGV Ativo', 'Site Público Otimizado', 'Suporte VIP via Whats'].map((f, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <Check size={16} className="text-[#0217ff]" strokeWidth={4} />
                    <span className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">{f}</span>
                  </div>
                ))}
              </div>
              <a href={p.url} className={`w-full py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all text-center ${p.highlight ? 'bg-[#0217ff] text-white' : 'bg-white text-black hover:bg-zinc-100'}`}>
                Começar agora
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* LGPD Banner */}
      {showLGPD && (
        <div className="fixed bottom-6 left-6 right-6 z-[110]">
          <div className="max-w-4xl mx-auto bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-4 text-left">
              <Shield className="w-10 h-10 text-[#0217ff]" />
              <p className="text-xs text-zinc-400 italic">Este site utiliza cookies técnicos para garantir sua segurança. Leia nossa <Link to="/privacy" className="text-white underline">Política de Privacidade</Link>.</p>
            </div>
            <button onClick={acceptLGPD} className="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl">Concordar</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 text-center bg-zinc-950">
        <Logo className="w-12 h-12 mx-auto mb-8" />
        <div className="flex gap-8 justify-center mb-12 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <Link to="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
          <a href="mailto:contato@imobipro.tech" className="lowercase tracking-normal italic hover:text-white transition-colors">contato@imobipro.tech</a>
        </div>
        <div className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.5em]">IMOBIPRO SYSTEMS — ALL RIGHTS RESERVED</div>
      </footer>
    </div>
  );
}