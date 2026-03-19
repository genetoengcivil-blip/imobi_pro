import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  MapPin, Bed, Bath, Ruler, MessageCircle, 
  Home, Loader2, ArrowUpRight, Instagram, Phone,
  Send, ShieldCheck, Check, Heart, Share2,
  X, Menu, ChevronRight, Star, Award, Users,
  Building2, Clock, DollarSign, Maximize2
} from 'lucide-react';

export default function PublicSitePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [broker, setBroker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para o formulário de captura
  const [leadForm, setLeadForm] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSiteData() {
      try {
        setLoading(true);
        
        console.log('Buscando perfil com slug:', slug);

        // Buscar perfil do corretor pelo slug
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          throw profileError;
        }

        console.log('Perfil encontrado:', profile);

        if (!profile) {
          if (isMounted) setError('Perfil não encontrado');
          return;
        }

        if (isMounted) {
          setBroker(profile);
          
          // Buscar imóveis do corretor
          const { data: props, error: propsError } = await supabase
            .from('properties')
            .select('*')
            .eq('user_id', profile.id)
            .in('status', ['disponivel', 'disponível'])
            .order('created_at', { ascending: false });

          if (propsError) {
            console.error('Erro ao buscar imóveis:', propsError);
            throw propsError;
          }
          
          console.log('Imóveis encontrados:', props?.length || 0);
          setProperties(props || []);
        }

      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        if (isMounted) {
          setError('Erro ao carregar o site. Tente novamente mais tarde.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    if (slug) {
      loadSiteData();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!broker) return;

      // Inserir lead no CRM
      const { error } = await supabase.from('leads').insert([{
        name: leadForm.name,
        phone: leadForm.phone,
        user_id: broker.id,
        source: 'site_publico',
        status: 'novo',
        property_interest: selectedProperty?.title || null
      }]);

      if (error) throw error;

      setSent(true);
      
      // Mensagem personalizada
      const propertyText = selectedProperty 
        ? `\n\nTenho interesse no imóvel: ${selectedProperty.title}` 
        : '';
      
      const message = encodeURIComponent(
        (broker.whatsapp_message || 'Olá! Vi o seu site e gostaria de saber mais sobre os imóveis.') + 
        propertyText
      );

      // Redireciona para o WhatsApp
      setTimeout(() => {
        window.open(`https://wa.me/${broker.phone?.replace(/\D/g, '')}?text=${message}`, '_blank');
        setSent(false);
        setShowModal(false);
        setLeadForm({ name: '', phone: '' });
        setSelectedProperty(null);
      }, 1500);

    } catch (err: any) {
      console.error('Erro ao salvar lead:', err);
      alert('Erro ao enviar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPropertyModal = (property: any) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
        <Loader2 className="w-10 h-10 text-[#0217ff] animate-spin mb-4" />
        <div className="w-48 h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#0217ff] animate-pulse" style={{ width: '60%' }}></div>
        </div>
        <p className="mt-4 text-sm text-zinc-400">Carregando site...</p>
      </div>
    );
  }

  if (error || !broker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-zinc-400 font-bold uppercase tracking-widest italic">
        <Home size={48} className="mb-4 opacity-50" />
        <p>{error || 'Perfil não encontrado'}</p>
        <p className="text-sm text-zinc-300 mt-2">Slug: {slug}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-[#0217ff] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0217ff]/90 transition-all"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900 font-sans selection:bg-[#0217ff]/10">
      
      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0217ff] rounded-2xl flex items-center justify-center text-white font-black italic">
              {broker.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-black uppercase italic tracking-tighter leading-none">{broker.full_name}</h1>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Consultor Imobiliário</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#imoveis" className="text-xs font-black uppercase tracking-widest hover:text-[#0217ff] transition-colors">
              Portfólio
            </a>
            <a href="#contato" className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
              Contato
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-white border-b border-zinc-100 p-6 md:hidden">
            <div className="flex flex-col gap-4">
              <a 
                href="#imoveis" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-black uppercase tracking-widest hover:text-[#0217ff] transition-colors py-2"
              >
                Portfólio
              </a>
              <a 
                href="#contato" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-3 bg-[#0217ff] text-white rounded-xl text-sm font-black uppercase tracking-widest text-center"
              >
                Contato
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-zinc-100 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[#0217ff]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Credibilidade & Segurança
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.85]">
              Imóveis <br /> <span className="text-[#0217ff]">Exclusivos.</span>
            </h2>
            <p className="text-zinc-500 font-medium italic text-lg max-w-md leading-relaxed">
              {broker.bio || 'Especialista em encontrar o lar ideal para você e sua família, com atendimento personalizado e assessoria completa.'}
            </p>
            
            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-black text-[#0217ff]">{properties.length}+</div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Imóveis</div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#0217ff]">100%</div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Satisfação</div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#0217ff]">24/7</div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Suporte</div>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO */}
          <div id="contato" className="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl shadow-blue-600/5 border border-zinc-100">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
              Agendar Consultoria
            </h3>
            <p className="text-zinc-400 text-xs font-bold uppercase mb-8">
              Receba o dossier técnico dos imóveis no WhatsApp
            </p>
            
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
                onChange={e => setLeadForm({...leadForm, phone: e.target.value.replace(/\D/g, '')})}
                className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-[#0217ff] font-bold text-sm transition-all"
              />
              <button 
                type="submit"
                disabled={isSubmitting || sent}
                className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                  sent 
                    ? 'bg-green-500 text-white' 
                    : 'bg-[#0217ff] text-white hover:bg-black shadow-xl shadow-blue-600/20'
                }`}
              >
                {sent ? (
                  <><Check size={16} /> Solicitado!</>
                ) : isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <><Send size={16} /> Consultar Agora</>
                )}
              </button>
            </form>

            {/* Social Links */}
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-zinc-100">
              {broker.social_media?.instagram && (
                <a href={broker.social_media.instagram} target="_blank" rel="noopener noreferrer" 
                   className="p-3 bg-zinc-50 rounded-xl hover:bg-[#0217ff] hover:text-white transition-all">
                  <Instagram size={18} />
                </a>
              )}
              {broker.phone && (
                <a href={`https://wa.me/${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                   className="p-3 bg-zinc-50 rounded-xl hover:bg-[#0217ff] hover:text-white transition-all">
                  <Phone size={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LISTA DE IMÓVEIS */}
      <section id="imoveis" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
              Vitrine de <span className="text-[#0217ff]">Destaques</span>
            </h2>
            <p className="text-zinc-400 text-xs font-bold uppercase mt-2 tracking-widest">
              Oportunidades selecionadas por {broker.full_name}
            </p>
          </div>
          <div className="hidden md:block text-sm font-bold text-zinc-400">
            {properties.length} imóveis disponíveis
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-[48px] p-16 text-center border border-zinc-100">
            <Home size={48} className="mx-auto mb-4 text-zinc-300" />
            <h3 className="text-xl font-bold mb-2">Nenhum imóvel disponível no momento</h3>
            <p className="text-zinc-400 text-sm">Entre em contato para conhecer as próximas oportunidades</p>
          </div>
        ) : (
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
                    {prop.type === 'venda' ? 'Venda' : prop.type === 'locacao' ? 'Locação' : 'Venda/Locação'}
                  </div>
                  {prop.featured && (
                    <div className="absolute top-6 right-6 px-4 py-2 bg-[#0217ff] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                      <Star size={12} /> Destaque
                    </div>
                  )}
                </div>
                
                <div className="p-8">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#0217ff] transition-colors line-clamp-1">
                    {prop.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-zinc-400 mb-6">
                    <MapPin size={14} className="text-[#0217ff]" />
                    <span className="text-xs font-bold italic uppercase line-clamp-1">{prop.location}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 border-y border-zinc-100 py-6 mb-6">
                    <div className="text-center">
                      <Bed className="w-4 h-4 mx-auto mb-2 text-zinc-400" />
                      <span className="text-[10px] font-black uppercase">{prop.bedrooms} Quartos</span>
                    </div>
                    <div className="text-center border-x border-zinc-100">
                      <Bath className="w-4 h-4 mx-auto mb-2 text-zinc-400" />
                      <span className="text-[10px] font-black uppercase">{prop.bathrooms} Banheiros</span>
                    </div>
                    <div className="text-center">
                      <Ruler className="w-4 h-4 mx-auto mb-2 text-zinc-400" />
                      <span className="text-[10px] font-black uppercase">{prop.area} m²</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block mb-1">Valor</span>
                      <div className="text-2xl font-black italic tracking-tighter text-[#0217ff]">
                        {formatCurrency(prop.price)}
                      </div>
                    </div>
                    <button 
                      onClick={() => openPropertyModal(prop)}
                      className="p-4 bg-zinc-50 text-zinc-900 rounded-2xl group-hover:bg-[#0217ff] group-hover:text-white transition-all"
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6 bg-[#0217ff] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">
            Encontrou o <br />Imóvel dos Sonhos?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Entre em contato agora mesmo e agende uma visita
          </p>
          <a 
            href={`https://wa.me/${broker.phone?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#0217ff] rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
          >
            <MessageCircle size={20} /> Falar com Corretor
          </a>
        </div>
      </section>

      {/* MODAL */}
      {showModal && selectedProperty && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 z-10 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-[#0217ff] hover:text-white transition-all"
              >
                <X size={20} />
              </button>
              
              {/* Imagens */}
              <div className="aspect-video relative">
                <img 
                  src={selectedProperty.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000'} 
                  className="w-full h-full object-cover rounded-t-[48px]"
                  alt={selectedProperty.title}
                />
              </div>

              {/* Conteúdo */}
              <div className="p-8 md:p-12 space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-4">
                    {selectedProperty.title}
                  </h2>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <MapPin size={16} className="text-[#0217ff]" />
                    <span className="font-bold">{selectedProperty.location}</span>
                  </div>
                </div>

                {/* Características */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-zinc-50 rounded-[32px]">
                  <div className="text-center">
                    <Bed className="w-6 h-6 mx-auto mb-2 text-[#0217ff]" />
                    <div className="font-black text-xl">{selectedProperty.bedrooms}</div>
                    <div className="text-xs text-zinc-500 uppercase font-bold">Quartos</div>
                  </div>
                  <div className="text-center">
                    <Bath className="w-6 h-6 mx-auto mb-2 text-[#0217ff]" />
                    <div className="font-black text-xl">{selectedProperty.bathrooms}</div>
                    <div className="text-xs text-zinc-500 uppercase font-bold">Banheiros</div>
                  </div>
                  <div className="text-center">
                    <Ruler className="w-6 h-6 mx-auto mb-2 text-[#0217ff]" />
                    <div className="font-black text-xl">{selectedProperty.area}</div>
                    <div className="text-xs text-zinc-500 uppercase font-bold">m²</div>
                  </div>
                  <div className="text-center">
                    <Maximize2 className="w-6 h-6 mx-auto mb-2 text-[#0217ff]" />
                    <div className="font-black text-xl">{selectedProperty.parking_spaces || 0}</div>
                    <div className="text-xs text-zinc-500 uppercase font-bold">Vagas</div>
                  </div>
                </div>

                {/* Descrição */}
                {selectedProperty.description && (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-3">Descrição</h3>
                    <p className="text-zinc-600 leading-relaxed">{selectedProperty.description}</p>
                  </div>
                )}

                {/* Preço e Contato */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-zinc-100">
                  <div>
                    <span className="text-sm text-zinc-500 block mb-1">Valor</span>
                    <div className="text-4xl font-black text-[#0217ff]">
                      {formatCurrency(selectedProperty.price)}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 md:flex-none px-8 py-4 bg-[#0217ff] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#0217ff]/90 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} /> Tenho Interesse
                    </button>
                    <button
                      onClick={() => {
                        navigator.share?.({
                          title: selectedProperty.title,
                          text: `Confira este imóvel: ${selectedProperty.title}`,
                          url: window.location.href
                        }).catch(() => {});
                      }}
                      className="p-4 bg-zinc-100 rounded-xl hover:bg-[#0217ff] hover:text-white transition-all"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-zinc-200 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <div className="w-12 h-12 bg-[#0217ff] rounded-2xl flex items-center justify-center text-white font-black italic">
            {broker.full_name?.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex gap-6">
            {broker.social_media?.instagram && (
              <a href={broker.social_media.instagram} target="_blank" rel="noopener noreferrer"
                 className="p-3 bg-zinc-100 rounded-xl hover:bg-[#0217ff] hover:text-white transition-all">
                <Instagram size={18} />
              </a>
            )}
            {broker.phone && (
              <a href={`https://wa.me/${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                 className="p-3 bg-zinc-100 rounded-xl hover:bg-[#0217ff] hover:text-white transition-all">
                <Phone size={18} />
              </a>
            )}
          </div>

          <p className="text-xs text-zinc-400 font-bold uppercase tracking-[0.3em]">
            ImobiPro © {new Date().getFullYear()} — Inteligência Imobiliária
          </p>
        </div>
      </footer>
    </div>
  );
}