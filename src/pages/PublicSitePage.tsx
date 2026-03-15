import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  MapPin, Bed, Bath, Ruler, MessageCircle, 
  Home, Loader2, ArrowUpRight, Instagram, Phone 
} from 'lucide-react';

export default function PublicSitePage() {
  const { slug } = useParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [broker, setBroker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#0217ff] mb-4" size={48} />
      <span className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Carregando Portfólio</span>
    </div>
  );

  if (!broker) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <h1 className="text-2xl font-black uppercase italic tracking-tighter">Portfólio não localizado</h1>
    </div>
  );

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-[#0217ff] selection:text-white">
      
      {/* NAVBAR DE LUXO */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-black uppercase italic tracking-tighter leading-none">
              {broker.full_name?.split(' ')[0]}<span className="text-[#0217ff]">.</span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Luxury Real Estate</span>
          </div>
          <div className="flex items-center gap-4">
             <a href={`https://wa.me/${broker.phone?.replace(/\D/g, '')}`} className="px-6 py-3 bg-[#0217ff] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-600/20">
               Contato Direto
             </a>
          </div>
        </div>
      </nav>

      {/* HERO / HEADER DO CORRETOR */}
      <header className="py-24 px-6 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-zinc-100 rounded-full mb-8 overflow-hidden border-2 border-zinc-50">
             {broker.avatar_url ? (
               <img src={broker.avatar_url} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-zinc-300 uppercase font-black text-2xl italic">{broker.full_name?.[0]}</div>
             )}
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.85] mb-6">
            Curadoria de <br />
            <span className="text-[#0217ff]">Ativos Premium</span>
          </h1>
          <p className="max-w-2xl text-zinc-500 font-medium italic text-lg md:text-xl leading-relaxed">
            {broker.bio || 'Especialista em propriedades de alto padrão e investimentos estratégicos. Encontre o cenário perfeito para o seu próximo capítulo.'}
          </p>
        </div>
      </header>

      {/* CATÁLOGO DE IMÓVEIS */}
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-16">
          <div>
            <span className="text-[#0217ff] font-black uppercase text-[10px] tracking-[0.4em] block mb-2">Exclusividade</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">Oportunidades de Investimento</h2>
          </div>
          <div className="hidden md:block text-right">
            <span className="text-zinc-400 font-bold text-sm uppercase italic">{properties.length} Ativos Disponíveis</span>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-zinc-200 rounded-[64px]">
             <span className="font-black uppercase text-zinc-300 tracking-widest italic">Nenhum ativo disponível no momento</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {properties.map(p => (
              <div key={p.id} className="group cursor-pointer">
                {/* Imagem com Proporção de Cinema */}
                <div className="aspect-[16/10] overflow-hidden rounded-[48px] bg-zinc-100 relative mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-200"><Home size={64}/></div>
                  )}
                  <div className="absolute top-6 left-6">
                     <span className="px-5 py-2 bg-white/90 backdrop-blur-sm text-black text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl">
                       {p.type || 'EXCLUSIVO'}
                     </span>
                  </div>
                  {/* Overlay no Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="p-6 bg-white rounded-full text-[#0217ff] scale-75 group-hover:scale-100 transition-transform shadow-2xl">
                       <ArrowUpRight size={32} />
                    </button>
                  </div>
                </div>

                {/* Info do Ativo */}
                <div className="space-y-4 px-2">
                  <div className="flex items-center gap-2 text-[#0217ff] font-black uppercase text-[10px] tracking-widest">
                    <MapPin size={16} fill="currentColor" fillOpacity={0.2} /> {p.location || 'Localização Premium'}
                  </div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none group-hover:text-[#0217ff] transition-colors">{p.title}</h3>
                  
                  {/* Mini-Ficha Técnica */}
                  <div className="flex flex-wrap gap-4 text-zinc-500 font-bold text-xs uppercase italic py-4 border-y border-zinc-100">
                    <span className="flex items-center gap-2"><Bed size={16}/> {p.bedrooms} Qts</span>
                    <span className="flex items-center gap-2"><Bath size={16}/> {p.bathrooms} Banh</span>
                    <span className="flex items-center gap-2"><Ruler size={16}/> {p.area} m²</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                     <span className="text-3xl font-black tracking-tighter italic">{formatBRL(p.price)}</span>
                     <a 
                      href={`https://wa.me/${broker.phone?.replace(/\D/g, '')}?text=Olá! Gostaria de mais informações técnicas sobre o imóvel: ${p.title}`}
                      className="p-4 bg-zinc-900 text-white rounded-[20px] hover:bg-[#0217ff] transition-all"
                     >
                       <MessageCircle size={24} />
                     </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER PREMIUM */}
      <footer className="bg-white py-32 border-t border-zinc-100 px-6">
         <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8">Interessado em um <br /> <span className="text-[#0217ff]">Atendimento Privado?</span></h2>
            <p className="text-zinc-500 font-medium italic mb-12">Consulte disponibilidade para visitas exclusivas e assessoria jurídica completa.</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
               <a href={`https://wa.me/${broker.phone?.replace(/\D/g, '')}`} className="w-full md:w-auto px-10 py-6 bg-zinc-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-[#0217ff] transition-all">
                  Solicitar Dossier Técnico
               </a>
               <a href={`tel:${broker.phone?.replace(/\D/g, '')}`} className="w-full md:w-auto px-10 py-6 bg-transparent border-2 border-zinc-100 text-zinc-900 rounded-3xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3">
                  <Phone size={18} /> Chamar Agora
               </a>
            </div>
            <div className="mt-24 pt-8 border-t border-zinc-50 text-zinc-400 font-black uppercase text-[9px] tracking-[0.5em]">
               Powered by ImobiPro Elite • {new Date().getFullYear()}
            </div>
         </div>
      </footer>
    </div>
  );
}