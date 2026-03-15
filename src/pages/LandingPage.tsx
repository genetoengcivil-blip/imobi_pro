import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Star, Check, Play, ChevronDown, 
  MessageSquare, Globe, Calculator, ShieldCheck, Zap, 
  Database, Cpu, Smartphone, Layout, Rocket, MessageCircle, Users, Building2, TrendingUp,
  Cookie, Shield
} from 'lucide-react';
import { Logo } from '../components/Logo';

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showLGPD, setShowLGPD] = useState(false);

  // Verificação LGPD ao carregar a página
  useEffect(() => {
    const consent = localStorage.getItem('imobipro_consent');
    if (!consent) {
      const timer = setTimeout(() => setShowLGPD(true), 2000); // Aparece após 2 segundos
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

  const stats = [
    { icon: TrendingUp, value: 'R$ 850M+', label: 'VGV TRANSACIONADO' },
    { icon: Users, value: '3.400+', label: 'CORRETORES ATIVOS' },
    { icon: Building2, value: '18.000+', label: 'NEGÓCIOS FECHADOS' },
    { icon: Globe, value: '25.000+', label: 'IMÓVEIS PUBLICADOS' }
  ];

  const testimonials = [
    { name: 'Ricardo Mendes', role: 'Corretor Alto Padrão', text: 'Eu perdia vendas por falta de follow-up. O ImobiPro mudou meu jogo. Fechei 3 imóveis a mais no mês.', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { name: 'Camila Oliveira', role: 'Especialista em Lançamentos', text: 'Finalmente um sistema que entende a rotina de quem está na rua! O design é incrível e rápido.', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Marcos Almeida', role: 'Imobiliária Almeida', text: 'Ter meu próprio site integrado ao CRM me deu uma autoridade absurda. Leads caem direto no WhatsApp.', img: 'https://randomuser.me/api/portraits/men/85.jpg' },
    { name: 'Juliana Costa', role: 'Corretora Autônoma', text: 'O funil de vendas é muito visual. Sei exatamente em que etapa cada cliente está para fechar negócio.', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  ];

  const faqs = [
    { q: 'O sistema possui integração com o WhatsApp?', a: 'Sim! Utilizamos a Evolution API para conectar seu WhatsApp oficial ao CRM. Todos os leads que chegam pelo site são notificados instantaneamente no seu celular.' },
    { q: 'Como funciona o Site Público Automático?', a: 'Ao cadastrar um imóvel no seu dashboard, o sistema gera uma página de vendas otimizada para buscadores (SEO) e pronta para ser compartilhada com seus clientes.' },
    { q: 'Preciso pagar por atualizações?', a: 'Não. Como somos um SaaS, todas as melhorias de performance, segurança e novas funcionalidades são liberadas automaticamente sem custo adicional.' },
    { q: 'Meus dados e de meus clientes estão seguros?', a: 'Totalmente. Utilizamos tecnologia Supabase (Google/AWS) com criptografia de ponta a ponta e backups diários para garantir a integridade do seu inventário.' },
    { q: 'Posso usar meu próprio domínio?', a: 'Sim! No plano Anual e Semestral, você pode vincular seu domínio próprio (ex: www.seunome.com.br) para dar ainda mais credibilidade ao seu trabalho.' }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0217ff]/30 overflow-x-hidden">
      
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .animate-carousel { animation: marquee 50s linear infinite; }
        .pause-on-hover:hover { animation-play-state: paused; }
        @keyframes pulse-blue { 0% { box-shadow: 0 0 0 0 rgba(2, 23, 255, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(2, 23, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(2, 23, 255, 0); } }
        .wa-pulse { animation: pulse-blue 2s infinite; }
      `}</style>

      {/* Botão WhatsApp Flutuante */}
      <a 
        href="https://wa.me/5583986667292" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[100] bg-[#25d366] p-5 rounded-full shadow-2xl wa-pulse hover:scale-110 transition-transform flex items-center justify-center"
      >
        <MessageCircle size={32} color="white" fill="white" />
      </a>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter italic uppercase">
              IMOBI<span className="text-[#0217ff]">PRO</span>
            </span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={scrollToPlans} className="hidden md:flex px-8 py-3 bg-[#0217ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
              Assinar Agora
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-20 px-6 relative">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[#0217ff] text-[10px] font-black uppercase tracking-[0.3em] mb-12">
            <Zap className="w-4 h-4 fill-[#0217ff]" /> Software de Performance Imobiliária
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[0.85] tracking-tighter italic uppercase">
            VENDA MAIS. <br className="hidden md:block"/>
            <span className="text-[#0217ff]">TRABALHE MENOS.</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-zinc-500 mb-16 max-w-4xl mx-auto font-medium italic leading-relaxed">
            A plataforma definitiva para corretores que buscam autoridade, automação e fechamentos em escala.
          </p>
          
          <button onClick={scrollToPlans} className="px-14 py-7 bg-[#0217ff] text-white rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto">
            Garantir Meu Acesso <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[56px] overflow-hidden border-8 border-white/5 bg-zinc-900 aspect-video shadow-2xl">
            <video 
              controls 
              className="w-full h-full object-cover"
              poster="https://tnsppmfyrxazvquaggkg.supabase.co/storage/v1/object/public/public-assets/logo%20imobi%20Pro.jpg" 
            >
              <source src="https://tnsppmfyrxazvquaggkg.supabase.co/storage/v1/object/public/public-assets/Design%20sem%20nome2.mp4" type="video/mp4" />
              O teu navegador não suporta vídeos.
            </video>
          </div>
        </div>
      </section>

      {/* NÚMEROS DO SISTEMA */}
      <section className="py-32 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
          {stats.map((s, i) => (
            <div key={i} className="text-center group">
              <div className="w-16 h-16 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#0217ff] transition-all duration-500">
                <s.icon size={28} className="text-[#0217ff] group-hover:text-white transition-colors" />
              </div>
              <div className="text-4xl md:text-6xl font-black italic tracking-tighter mb-2">{s.value}</div>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Carrossel de Tecnologias */}
      <section className="py-20 bg-zinc-950/50">
        <div className="flex overflow-hidden">
          <div className="flex w-max animate-marquee gap-32 items-center px-10">
            {[1, 2].map((loop) => (
              <div key={loop} className="flex gap-32 items-center">
                <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
                  <Database size={40} className="text-[#0217ff]" /> <span className="font-black text-2xl tracking-tighter">SUPABASE</span>
                </div>
                <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
                  <Cpu size={40} className="text-cyan-400" /> <span className="font-black text-2xl tracking-tighter">REACT ENGINE</span>
                </div>
                <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
                  <Smartphone size={40} className="text-emerald-500" /> <span className="font-black text-2xl tracking-tighter">EVOLUTION API</span>
                </div>
                <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
                  <Layout size={40} className="text-blue-400" /> <span className="font-black text-2xl tracking-tighter">TAILWIND UI</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: MessageSquare, title: 'WhatsApp Hub', desc: 'Sincronização instantânea com Evolution API para capturar e gerir leads no ato.' },
            { icon: Globe, title: 'Páginas Automáticas', desc: 'Cada imóvel cadastrado vira um site profissional de alta conversão para seus clientes.' },
            { icon: Calculator, title: 'Avaliação Técnica', desc: 'Cálculo de ACM (Análise Comparativa de Mercado) para propostas imbatíveis.' },
            { icon: ShieldCheck, title: 'Gestão Blindada', desc: 'Seus dados e leads protegidos por criptografia de nível bancário 24/7.' }
          ].map((feat, i) => (
            <div key={i} className="p-12 rounded-[48px] border border-white/5 bg-zinc-900/30 hover:border-[#0217ff]/50 transition-all group">
              <feat.icon size={48} className="text-[#0217ff] mb-8 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">{feat.title}</h3>
              <p className="text-zinc-500 font-medium leading-relaxed italic">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos Carrossel */}
      <section className="py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter">Quem usa, <span className="text-[#0217ff]">Domina.</span></h2>
        </div>
        <div className="flex overflow-hidden">
          <div className="flex w-max animate-carousel pause-on-hover gap-8 px-4">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-[450px] p-12 rounded-[56px] bg-black border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-8">
                    {[...Array(5)].map((_, j) => <Star key={j} size={18} className="fill-[#0217ff] text-[#0217ff]" />)}
                  </div>
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
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">Perguntas <span className="text-[#0217ff]">Frequentes</span></h2>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em]">Tudo o que você precisa saber</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className={`border border-white/10 rounded-3xl overflow-hidden transition-all ${openFaq === i ? 'bg-zinc-900' : 'bg-black'}`}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                  className="w-full p-8 text-left flex items-center justify-between font-black uppercase text-xs md:text-sm italic tracking-[0.1em]"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-[#0217ff] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-8 pb-8 text-zinc-400 font-medium italic text-base leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos - Bordas Brancas Adicionadas */}
      <section id="plans" className="py-32 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {plans.map((p, i) => (
              <div key={i} className={`p-12 rounded-[64px] border-2 flex flex-col ${p.highlight ? 'bg-[#0217ff]/5 border-[#0217ff] scale-105 relative' : 'bg-black border-white'}`}>
                {p.highlight && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2 bg-[#0217ff] text-white text-[9px] font-black uppercase tracking-widest rounded-full">Top Seller</div>
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
                  {['WhatsApp Ilimitado', 'CRM Inteligente', 'Páginas de Vendas', 'Domínio Próprio'].map((f, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <div className="w-5 h-5 rounded-full bg-[#0217ff]/20 flex items-center justify-center">
                        <Check size={10} className="text-[#0217ff]" strokeWidth={4} />
                      </div>
                      <span className="text-zinc-300 text-xs font-black uppercase tracking-tight">{f}</span>
                    </div>
                  ))}
                </div>
                <a href={p.url} className={`w-full py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all text-center ${p.highlight ? 'bg-[#0217ff] text-white shadow-xl hover:bg-blue-600' : 'bg-white text-black hover:bg-zinc-200'}`}>
                  Assinar Agora
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Reformulado - CORRIGIDO LINKS PARA App.tsx */}
      <footer className="py-24 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center gap-6 mb-12 text-center">
            <Logo className="w-12 h-12" />
            <span className="text-3xl font-black italic uppercase tracking-tighter">IMOBI<span className="text-[#0217ff]">PRO</span></span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {/* Links corrigidos para /terms e /privacy de acordo com as rotas do App.tsx */}
            <Link to="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <a href="mailto:atendimento.imobipro@gmail.com" className="hover:text-white transition-colors italic lowercase tracking-normal">atendimento.imobipro@gmail.com</a>
          </div>

          <div className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] text-center">
            © {new Date().getFullYear()} ImobiPro Software Inc. <br className="md:hidden" /> A nova era imobiliária começou.
          </div>
        </div>
      </footer>

      {/* BANNER LGPD - DESIGN DISCRETO INTEGRADO */}
      {showLGPD && (
        <div className="fixed bottom-6 left-6 right-6 z-[110] animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="max-w-4xl mx-auto bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-[#0217ff]/20 rounded-2xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-[#0217ff]" />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-tighter italic">Privacidade e LGPD</h4>
                <p className="text-xs text-zinc-400 max-w-xl italic">
                  Utilizamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossos <Link to="/terms" className="text-white underline">Termos</Link> e <Link to="/privacy" className="text-white underline">Privacidade</Link>.
                </p>
              </div>
            </div>
            <button 
              onClick={acceptLGPD}
              className="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all whitespace-nowrap"
            >
              Aceitar e Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}