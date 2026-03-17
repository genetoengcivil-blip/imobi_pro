import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  MapPin, Bed, Bath, Ruler, MessageCircle, 
  Home, Loader2, ArrowUpRight, Instagram, Phone,
  Send, ShieldCheck, Check
} from 'lucide-react';

export default function PublicSitePage() {
  const { slug } = useParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [broker, setBroker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para o formulário de captura
  const [leadForm, setLeadForm] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function loadSiteData() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .single();

        if (profile) {
          setBroker(profile);
          const { data: props } = await supabase
            .from('properties')
            .select('*')
            .eq('user_id', profile.id)
            .eq('status', 'disponível')
            .order('created_at', { ascending: false });
          
          setProperties(props || []);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSiteData();
  }, [slug]);

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Inserção no CRM que dispara a automação que criámos anteriormente
      await supabase.from('leads').insert([{
        name: leadForm.name,
        phone: leadForm.phone,
        user_id: broker.id,
        source: 'site_publico',
        status: 'novo'
      }]);

      setSent(true);
      // Redireciona para o WhatsApp após 1.5s
      setTimeout(() => {
        window.open(`https://wa.me/${broker.phone?.replace(/\D/g, '')}?text=Olá! Vi o seu site e gostaria de saber mais sobre os seus imóveis.`, '_blank');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
        <Loader2 className="w-10 h-10 text-[#0217ff] animate-spin mb-4" />
        <div className="w-48 h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#0217ff] animate-progress"></div>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400 font-bold uppercase tracking-widest italic">
        Perfil não encontrado
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900 font-sans selection:bg-[#0217ff]/10">
      
      {/* HEADER PREMIUM */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#0217ff] rounded-2xl flex items-center justify-center text-white font-black italic">
                {broker.full_name?.charAt(0)}
             </div>
             <div>
                <h1 className="font-black uppercase italic tracking-tighter leading-none">{broker.full_name}</h1>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Consultor Imobiliário</span>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
             <a href="#imoveis" className="text-xs font-black uppercase tracking-widest hover:text-[#0217ff] transition-colors">Portfólio</a>
             <a href="#contato" className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">Contato</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-10 duration-700">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-zinc-100 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-[#0217ff]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Credibilidade & Segurança</span>
               </div>
               <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85]">
                  Imóveis <br /> <span className="text-[#0217ff]">Exclusivos.</span>
               </h2>
               <p className="text-zinc-500 font-medium italic text-lg max-w-md leading-relaxed">
                  {broker.bio || 'Especialista em encontrar o lar ideal para você e sua família, com atendimento personalizado e assessoria completa.'}
               </p>
            </div>

            {/* FORMULÁRIO DE CAPTURA RÁPIDA (LEAD MAGNET) */}
            <div id="contato" className="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl shadow-blue-600/5 border border-zinc-100 animate-in fade-in zoom-in duration-1000">
               <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Agendar Consultoria</h3>
               <p className="text-zinc-400 text-xs font-bold uppercase mb-8">Receba o dossier técnico dos imóveis no WhatsApp</p>
               
               <form onSubmit={handleLeadCapture} className="space-y-4">
                  <input 
                    required
                    placeholder="Seu Nome Completo"
                    value={leadForm.name}
                    onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                    className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-[#0217ff] font-bold text-sm transition-all"
                  />
                  <input 
                    required
                    placeholder="WhatsApp (com DDD)"
                    value={leadForm.phone}
                    onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                    className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-[#0217ff] font-bold text-sm transition-all"
                  />
                  <button 
                    disabled={isSubmitting || sent}
                    className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                      sent ? 'bg-green-500 text-white' : 'bg-[#0217ff] text-white hover:bg-black shadow-xl shadow-blue-600/20'
                    }`}
                  >
                    {sent ? <><Check /> Solicitado!</> : isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Consultar Agora</>}
                  </button>
               </form>
            </div>
         </div>
      </section>

      {/* LISTA DE IMÓVEIS (VITRINE) */}
      <section id="imoveis" className="py-20 px-6 max-w-7xl mx-auto">
         <div className="flex items-end justify-between mb-12">
            <div>
               <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Vitrine de <span className="text-[#0217ff]">Destaques</span></h2>
               <p className="text-zinc-400 text-xs font-bold uppercase mt-2 tracking-widest">Oportunidades selecionadas por {broker.full_name}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((prop) => (
               <div key={prop.id} className="group bg-white rounded-[40px] overflow-hidden border border-zinc-100 hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500">
                  <div className="aspect-[4/3] relative overflow-hidden">
                     <img 
                        src={prop.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000'} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={prop.title}
                     />
                     <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        {prop.type}
                     </div>
                  </div>
                  <div className="p-8">
                     <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#0217ff] transition-colors">{prop.title}</h3>
                     <div className="flex items-center gap-2 text-zinc-400 mb-6">
                        <MapPin size={14} className="text-[#0217ff]" />
                        <span className="text-xs font-bold italic uppercase">{prop.location}</span>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-4 border-y border-zinc-50 py-6 mb-6">
                        <div className="text-center">
                           <Bed className="w-4 h-4 mx-auto mb-2 text-zinc-400" />
                           <span className="text-[10px] font-black uppercase">{prop.bedrooms} Quartos</span>
                        </div>
                        <div className="text-center border-x border-zinc-50">
                           <Bath className="w-4 h-4 mx-auto mb-2 text-zinc-400" />
                           <span className="text-[10px] font-black uppercase">{prop.bathrooms} Banheiros</span>
                        </div>
                        <div className="text-center">
                           <Ruler className="w-4 h-4 mx-auto mb-2 text-zinc-400" />
                           <span className="text-[10px] font-black uppercase">{prop.area} m²</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between">
                        <div className="text-2xl font-black italic tracking-tighter">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(prop.price)}
                        </div>
                        <button className="p-4 bg-zinc-50 text-zinc-900 rounded-2xl group-hover:bg-[#0217ff] group-hover:text-white transition-all">
                           <ArrowUpRight size={20} />
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-zinc-200 text-center">
         <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
            <div className="w-12 h-12 bg-[#0217ff] rounded-2xl flex items-center justify-center text-white font-black italic">
               {broker.full_name?.charAt(0)}
            </div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-[0.3em]">ImobiPro © 2026 — Inteligência Imobiliária</p>
         </div>
      </footer>
    </div>
  );
}