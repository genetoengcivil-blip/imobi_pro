import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  MapPin, Bed, Bath, Ruler, MessageCircle, 
  Home, Loader2, ArrowUpRight, Instagram, Phone,
  Send, ShieldCheck, Check, Heart, Share2,
  X, Menu, ChevronRight, Star, Award, Users,
  Building2, Clock, DollarSign, Maximize2,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Play, TrendingUp, Sparkles, Calendar, Key,
  Zap, Globe, Linkedin, Youtube, Facebook, Twitter,
  ThumbsUp, Quote, Camera, Layers, Compass,
  BadgeCheck, Gem, Crown, Briefcase, FileText,
  UserCheck, CalendarDays, CircleDollarSign, HandshakeIcon,
  LayoutGrid, Grid3X3, List, Mail, Quote as QuoteIcon,
  Map, Mail as MailIcon, MapPin as MapPinIcon, PhoneCall,
  Waves, Dumbbell, Flame, TreePine, Shield, Wifi, Coffee, Building
} from 'lucide-react';

// CONSTANTES DAS COMODIDADES
const AMENITIES = [
  { id: 'has_pool', label: 'Piscina', icon: Waves, category: 'Lazer' },
  { id: 'has_gym', label: 'Academia', icon: Dumbbell, category: 'Esporte' },
  { id: 'has_bbq', label: 'Churrasqueira', icon: Flame, category: 'Gourmet' },
  { id: 'has_elevator', label: 'Elevador', icon: Building2, category: 'Infraestrutura' },
  { id: 'has_games', label: 'Salão de Jogos', icon: Grid3X3, category: 'Lazer' },
  { id: 'has_party', label: 'Salão de Festas', icon: Coffee, category: 'Social' },
  { id: 'has_spa', label: 'Spa', icon: Waves, category: 'Bem-estar' },
  { id: 'has_playground', label: 'Playground', icon: TreePine, category: 'Infantil' },
  { id: 'has_court', label: 'Quadra Esportiva', icon: Ruler, category: 'Esporte' },
  { id: 'has_gourmet', label: 'Espaço Gourmet', icon: Flame, category: 'Gourmet' },
  { id: 'has_conciege', label: 'Portaria 24h', icon: Shield, category: 'Segurança' },
  { id: 'has_laundry', label: 'Lavanderia', icon: Zap, category: 'Serviços' }
];

export default function PublicSitePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [broker, setBroker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [showWhatsAppFloat, setShowWhatsAppFloat] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Depoimentos Premium - Carrossel Contínuo
  const testimonials = [
    {
      id: 1,
      name: 'Dra. Mariana Oliveira',
      role: 'CEO, Grupo Oliveira',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      text: 'O profissionalismo e a transparência durante todo o processo foram impecáveis. Conseguiram vender o imóvel em apenas 45 dias, por um valor acima do mercado. Recomendo fortemente!',
      rating: 5,
      date: 'Março 2024'
    },
    {
      id: 2,
      name: 'Carlos Eduardo Mendes',
      role: 'Investidor Imobiliário',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      text: 'Já realizei mais de 10 transações com esta equipe. O atendimento é diferenciado, com análise de mercado precisa e negociações justas. Nota 10!',
      rating: 5,
      date: 'Fevereiro 2024'
    },
    {
      id: 3,
      name: 'Ana Paula Costa & Rafael Souza',
      role: 'Primeiro Imóvel',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      text: 'Desde a busca até a assinatura do contrato, tudo foi conduzido com muita paciência e clareza. Hoje estamos morando no apartamento dos sonhos!',
      rating: 5,
      date: 'Janeiro 2024'
    },
    {
      id: 4,
      name: 'Roberto Almeida',
      role: 'Empresário',
      avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
      text: 'Me auxiliou na locação de um ponto comercial estratégico para minha empresa. A negociação foi ágil e as condições foram excelentes.',
      rating: 5,
      date: 'Dezembro 2023'
    },
    {
      id: 5,
      name: 'Fernanda Lima',
      role: 'Arquiteta',
      avatar: 'https://randomuser.me/api/portraits/women/90.jpg',
      text: 'Fiquei impressionada com a qualidade das opções apresentadas e o cuidado em entender exatamente o que eu procurava.',
      rating: 5,
      date: 'Novembro 2023'
    },
    {
      id: 6,
      name: 'Thiago Rodrigues',
      role: 'Médico',
      avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
      text: 'Foram muito além da intermediação tradicional, me orientando sobre documentação, financiamento e até indicação de profissionais.',
      rating: 5,
      date: 'Outubro 2023'
    }
  ];

  // Duplicar depoimentos para efeito de loop infinito
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  // Animação de carrossel contínuo
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let animationId: number;
    let currentScroll = 0;
    const speed = 0.5;
    const cardWidth = 380;
    const gap = 24;
    const totalWidth = (cardWidth + gap) * testimonials.length;

    const animate = () => {
      if (!carousel) return;
      
      if (!isHovering) {
        currentScroll = carousel.scrollLeft;
        currentScroll += speed;
        
        if (currentScroll >= totalWidth) {
          currentScroll = 0;
        }
        if (currentScroll < 0) {
          currentScroll = totalWidth - speed;
        }
        
        carousel.scrollLeft = currentScroll;
      }
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isHovering, testimonials.length]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const cardWidth = 380;
      const gap = 24;
      carouselRef.current.scrollBy({
        left: -(cardWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const cardWidth = 380;
      const gap = 24;
      carouselRef.current.scrollBy({
        left: cardWidth + gap,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadSiteData() {
      if (!slug) return;
      
      setLoading(true);
      setError('');

      try {
        const { data: brokerData, error: bError } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (bError) {
          console.error('Erro na busca do perfil:', bError);
          throw bError;
        }
        
        if (!brokerData) {
          if (isMounted) setError('Corretor não encontrado.');
          return;
        }

        console.log('📊 Dados do corretor carregados:', brokerData);

        const formattedBroker = {
          id: brokerData.id,
          full_name: brokerData.full_name || 'Corretor',
          slug: brokerData.slug,
          bio: brokerData.bio || '',
          phone: brokerData.phone || '',
          whatsapp_message: brokerData.whatsapp_message || '',
          social_media: brokerData.social_media || {},
          avatar: brokerData.avatar || null,
          logo: brokerData.logo || null,
          professional_title: brokerData.professional_title || 'Consultor Imobiliário',
          specialties: brokerData.specialties ? brokerData.specialties.split(',') : [],
          email: brokerData.email || brokerData.full_name?.replace(/\s/g, '').toLowerCase() + '@imobipro.com'
        };

        console.log('📸 Logo:', formattedBroker.logo);

        if (isMounted) setBroker(formattedBroker);

        const { data: pData, error: pError } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', brokerData.id)
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (pError) throw pError;
        if (isMounted) {
          setProperties(pData || []);
          setFeaturedProperties(pData?.filter(p => p.featured) || []);
          console.log('🏠 Imóveis carregados:', pData?.length || 0);
        }

      } catch (err: any) {
        if (isMounted) {
          console.error("Erro na busca:", err);
          setError('Ocorreu um erro ao carregar o site.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSiteData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [showModal]);

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      alert('Preencha nome e telefone');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!broker) return;

      const leadData: any = {
        name: leadForm.name.trim(),
        phone: leadForm.phone.replace(/\D/g, ''),
        user_id: broker.id,
        source: 'site_publico',
        status: 'novo'
      };
      
      if (leadForm.email && leadForm.email.trim()) {
        leadData.email = leadForm.email.trim();
      }
      
      if (selectedProperty?.title) {
        leadData.property_interest = selectedProperty.title;
      }

      console.log('📝 Enviando lead:', leadData);

      const { error } = await supabase.from('leads').insert([leadData]);

      if (error) throw error;

      setSent(true);
      
      const propertyText = selectedProperty 
        ? `\n\nTenho interesse no imóvel: ${selectedProperty.title}`
        : '';
      
      const message = encodeURIComponent(
        (broker.whatsapp_message || 'Olá! Vi seu site e gostaria de saber mais sobre os imóveis.') + 
        propertyText
      );

      setTimeout(() => {
        window.open(`https://wa.me/${broker.phone?.replace(/\D/g, '')}?text=${message}`, '_blank');
        setSent(false);
        setShowModal(false);
        setLeadForm({ name: '', phone: '', email: '' });
        setSelectedProperty(null);
        setImageIndex(0);
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
    setImageIndex(0);
    setShowModal(true);
  };

  const nextImage = () => {
    if (selectedProperty?.images?.length) {
      setImageIndex((prev) => (prev + 1) % selectedProperty.images.length);
    }
  };

  const prevImage = () => {
    if (selectedProperty?.images?.length) {
      setImageIndex((prev) => (prev - 1 + selectedProperty.images.length) % selectedProperty.images.length);
    }
  };

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPhoneDisplay = (phone: string) => {
    const numbers = phone?.replace(/\D/g, '') || '';
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // 🔥 Função para obter comodidades do imóvel
  const getPropertyAmenities = (property: any) => {
    return AMENITIES.filter(amenity => property[amenity.id] === true);
  };

  const filteredProperties = properties.filter(prop => {
    if (selectedCategory !== 'todos' && prop.type !== selectedCategory) return false;
    return true;
  });

  const themeColors = {
    primary: broker?.theme_config?.primaryColor || '#0217ff',
    accent: broker?.theme_config?.accentColor || '#00c6ff'
  };

  const stats = [
    { value: '10+', label: 'Anos de Experiência', icon: Award },
    { value: '500+', label: 'Clientes Atendidos', icon: Users },
    { value: '98%', label: 'Taxa de Satisfação', icon: ThumbsUp },
    { value: '24h', label: 'Resposta Rápida', icon: Clock }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white flex flex-col items-center justify-center p-10">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#0217ff]/20 rounded-full animate-spin border-t-[#0217ff]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Home size={24} className="text-[#0217ff]" />
          </div>
        </div>
        <p className="mt-6 text-sm text-zinc-500 font-medium">Carregando...</p>
      </div>
    );
  }

  if (error || !broker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Home size={40} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-black mb-2">Página não encontrada</h2>
        <p className="text-zinc-500 mb-6 max-w-md">{error || 'Este perfil não existe ou foi removido.'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-[#0217ff] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#0217ff]/90 transition-all shadow-lg"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#0217ff]/10">
      
      {/* WHATSAPP FLOAT */}
      {showWhatsAppFloat && broker.phone && (
        <div className="fixed bottom-6 right-6 z-50 group">
          <a
            href={`https://wa.me/${broker.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-all"
          >
            <MessageCircle size={20} />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Fale Conosco</span>
          </a>
        </div>
      )}

      {/* HEADER COM LOGO */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-100 h-20 flex items-center px-6 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollToSection('top')}>
            {broker.logo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-md border border-zinc-200">
                <img 
                  src={broker.logo} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Erro ao carregar logo');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl transition-all group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})` }}>
                {broker.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-black uppercase italic tracking-tighter leading-none text-lg">{broker.full_name}</h1>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Consultor Imobiliário</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('imoveis')} className="text-sm font-medium hover:text-[#0217ff] transition-colors">Imóveis</button>
            <button onClick={() => scrollToSection('sobre')} className="text-sm font-medium hover:text-[#0217ff] transition-colors">Sobre</button>
            <button onClick={() => scrollToSection('depoimentos')} className="text-sm font-medium hover:text-[#0217ff] transition-colors">Depoimentos</button>
            <button onClick={() => scrollToSection('contato')} className="px-6 py-2.5 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md" style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})` }}>
              Contato
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-white border-b border-zinc-100 p-6 md:hidden shadow-xl">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollToSection('imoveis')} className="text-sm font-bold uppercase py-2 text-left">Imóveis</button>
              <button onClick={() => scrollToSection('sobre')} className="text-sm font-bold uppercase py-2 text-left">Sobre</button>
              <button onClick={() => scrollToSection('depoimentos')} className="text-sm font-bold uppercase py-2 text-left">Depoimentos</button>
              <button onClick={() => scrollToSection('contato')} className="px-6 py-3 text-white rounded-xl text-sm font-black uppercase text-center" style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})` }}>
                Contato
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section id="top" className="relative min-h-screen flex items-center pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px]" style={{ background: `radial-gradient(circle, ${themeColors.primary}10, transparent 70%)` }}></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px]" style={{ background: `radial-gradient(circle, ${themeColors.accent}10, transparent 70%)` }}></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white rounded-full border border-zinc-100 shadow-sm">
              <BadgeCheck size={16} style={{ color: themeColors.primary }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Credibilidade & Excelência</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">
              O <span style={{ color: themeColors.primary }}>Imóvel</span><br />
              dos Seus Sonhos
            </h1>
            
            <p className="text-zinc-500 text-lg max-w-lg leading-relaxed">
              {broker.bio || `Especialista em encontrar o lar ideal para você e sua família, com atendimento personalizado e assessoria completa.`}
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={() => scrollToSection('contato')} className="px-8 py-4 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-xl flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})` }}>
                <Send size={18} /> Agendar Consultoria
              </button>
              <button onClick={() => scrollToSection('imoveis')} className="px-8 py-4 bg-white border-2 border-zinc-200 rounded-2xl font-black text-sm uppercase tracking-wider hover:border-[#0217ff] hover:scale-105 transition-all flex items-center gap-2">
                <Compass size={18} /> Explorar Imóveis
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-zinc-100">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="text-center">
                    <Icon size={24} className="mx-auto mb-2" style={{ color: themeColors.primary }} />
                    <div className="text-2xl font-black" style={{ color: themeColors.primary }}>{stat.value}</div>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0217ff]/20 to-[#00c6ff]/20 rounded-[48px] blur-2xl"></div>
            <div className="relative bg-white rounded-[48px] shadow-2xl overflow-hidden border border-zinc-100">
              <div className="p-8 bg-gradient-to-br from-zinc-50 to-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0217ff] to-[#00c6ff] flex items-center justify-center">
                    <Quote size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase">Cliente Satisfeito</p>
                    <p className="font-bold">Experiência Transformadora</p>
                  </div>
                </div>
                <p className="text-lg italic text-zinc-600 mb-6">
                  "Profissionalismo impecável. Encontrei o apartamento perfeito em menos de 15 dias. Recomendo!"
                </p>
                <div className="flex items-center gap-3">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" className="w-10 h-10 rounded-full object-cover" alt="Cliente" />
                  <div>
                    <p className="font-bold text-sm">Patrícia Oliveira</p>
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} size={12} fill="#fbbf24" className="text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      {featuredProperties.length > 0 && (
        <section className="py-20 px-6 bg-zinc-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0217ff] mb-2 block">Destaques</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Imóveis em <span style={{ color: themeColors.primary }}>Destaque</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.slice(0, 3).map((prop) => {
                const amenities = getPropertyAmenities(prop);
                return (
                  <div key={prop.id} className="group bg-white rounded-[32px] overflow-hidden border border-zinc-100 hover:shadow-2xl transition-all duration-500 cursor-pointer" onClick={() => openPropertyModal(prop)}>
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img src={prop.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={prop.title} />
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-[9px] font-black uppercase">Destaque</div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 line-clamp-1">{prop.title}</h3>
                      <div className="flex items-center gap-2 text-zinc-400 mb-4">
                        <MapPin size={14} style={{ color: themeColors.primary }} />
                        <span className="text-xs font-bold uppercase line-clamp-1">{prop.location}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-[8px] text-zinc-400 uppercase">Valor</span>
                          <div className="text-xl font-black" style={{ color: themeColors.primary }}>{formatCurrency(prop.price)}</div>
                        </div>
                        <div className="flex gap-3 text-[9px] font-bold text-zinc-500">
                          <span>{prop.bedrooms} qts</span>
                          <span>{prop.bathrooms} ban</span>
                          <span>{prop.area}m²</span>
                        </div>
                      </div>
                      {/* 🔥 COMODIDADES NO CARD */}
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100">
                          {amenities.slice(0, 4).map((amenity) => {
                            const Icon = amenity.icon;
                            return (
                              <div key={amenity.id} className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded-full" title={amenity.label}>
                                <Icon size={10} className="text-[#0217ff]" />
                                <span className="text-[8px] font-medium text-zinc-600">{amenity.label}</span>
                              </div>
                            );
                          })}
                          {amenities.length > 4 && (
                            <div className="px-2 py-1 bg-zinc-50 rounded-full text-[8px] font-bold text-zinc-500">
                              +{amenities.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ALL PROPERTIES */}
      <section id="imoveis" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0217ff] mb-2 block">Portfólio</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Vitrine de <span style={{ color: themeColors.primary }}>Oportunidades</span></h2>
            <p className="text-zinc-500 mt-2">{filteredProperties.length} imóveis disponíveis</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#0217ff] text-white' : 'bg-zinc-100'}`}>
              <Grid3X3 size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#0217ff] text-white' : 'bg-zinc-100'}`}>
              <List size={18} />
            </button>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-zinc-50 rounded-[48px] p-16 text-center border border-zinc-100">
            <Home size={48} className="mx-auto mb-4 text-zinc-300" />
            <h3 className="text-xl font-bold mb-2">Em breve, novas oportunidades</h3>
            <p className="text-zinc-400">Entre em contato para ser o primeiro a saber</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((prop) => {
              const amenities = getPropertyAmenities(prop);
              return (
                <div key={prop.id} className="group bg-white rounded-[32px] overflow-hidden border border-zinc-100 hover:shadow-2xl transition-all duration-500 cursor-pointer" onClick={() => openPropertyModal(prop)}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img src={prop.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={prop.title} />
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-[9px] font-black uppercase">
                      {prop.type === 'venda' ? 'Venda' : prop.type === 'locacao' ? 'Locação' : 'Venda/Locação'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 line-clamp-1 group-hover:text-[#0217ff] transition-colors">{prop.title}</h3>
                    <div className="flex items-center gap-2 text-zinc-400 mb-4">
                      <MapPin size={14} className="text-[#0217ff]" />
                      <span className="text-xs font-bold uppercase line-clamp-1">{prop.location}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-4 mb-4 border-y border-zinc-100">
                      <div className="text-center">
                        <Bed size={14} className="mx-auto mb-1 text-zinc-400" />
                        <span className="text-[9px] font-black uppercase">{prop.bedrooms}</span>
                      </div>
                      <div className="text-center">
                        <Bath size={14} className="mx-auto mb-1 text-zinc-400" />
                        <span className="text-[9px] font-black uppercase">{prop.bathrooms}</span>
                      </div>
                      <div className="text-center">
                        <Ruler size={14} className="mx-auto mb-1 text-zinc-400" />
                        <span className="text-[9px] font-black uppercase">{prop.area}m²</span>
                      </div>
                    </div>
                    {/* 🔥 COMODIDADES NO CARD GRID */}
                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-100">
                        {amenities.slice(0, 4).map((amenity) => {
                          const Icon = amenity.icon;
                          return (
                            <div key={amenity.id} className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded-full" title={amenity.label}>
                              <Icon size={10} className="text-[#0217ff]" />
                              <span className="text-[8px] font-medium text-zinc-600">{amenity.label}</span>
                            </div>
                          );
                        })}
                        {amenities.length > 4 && (
                          <div className="px-2 py-1 bg-zinc-50 rounded-full text-[8px] font-bold text-zinc-500">
                            +{amenities.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <span className="text-[8px] text-zinc-400 uppercase">Valor</span>
                        <div className="text-xl font-black" style={{ color: themeColors.primary }}>{formatCurrency(prop.price)}</div>
                      </div>
                      <button className="p-3 bg-zinc-50 rounded-xl group-hover:bg-[#0217ff] group-hover:text-white transition-all">
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProperties.map((prop) => {
              const amenities = getPropertyAmenities(prop);
              return (
                <div key={prop.id} className="group bg-white rounded-[32px] overflow-hidden border border-zinc-100 hover:shadow-2xl transition-all duration-500 cursor-pointer" onClick={() => openPropertyModal(prop)}>
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/5 aspect-[4/3] relative overflow-hidden">
                      <img src={prop.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={prop.title} />
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-[9px] font-black uppercase">
                        {prop.type === 'venda' ? 'Venda' : prop.type === 'locacao' ? 'Locação' : 'Venda/Locação'}
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#0217ff] transition-colors">{prop.title}</h3>
                      <div className="flex items-center gap-2 text-zinc-400 mb-4">
                        <MapPin size={14} className="text-[#0217ff]" />
                        <span className="text-xs font-bold uppercase">{prop.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-6 mb-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1"><Bed size={14} /> {prop.bedrooms} quartos</span>
                        <span className="flex items-center gap-1"><Bath size={14} /> {prop.bathrooms} banheiros</span>
                        <span className="flex items-center gap-1"><Ruler size={14} /> {prop.area}m²</span>
                      </div>
                      {/* 🔥 COMODIDADES NO CARD LIST */}
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {amenities.slice(0, 5).map((amenity) => {
                            const Icon = amenity.icon;
                            return (
                              <div key={amenity.id} className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded-full" title={amenity.label}>
                                <Icon size={10} className="text-[#0217ff]" />
                                <span className="text-[8px] font-medium text-zinc-600">{amenity.label}</span>
                              </div>
                            );
                          })}
                          {amenities.length > 5 && (
                            <div className="px-2 py-1 bg-zinc-50 rounded-full text-[8px] font-bold text-zinc-500">
                              +{amenities.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                        <div>
                          <span className="text-[8px] text-zinc-400 uppercase">Valor</span>
                          <div className="text-xl font-black" style={{ color: themeColors.primary }}>{formatCurrency(prop.price)}</div>
                        </div>
                        <button className="px-6 py-3 bg-[#0217ff] text-white rounded-xl text-sm font-bold hover:scale-105 transition-all">
                          <MessageCircle size={16} className="inline mr-2" /> Tenho Interesse
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* DEPOIMENTOS - CARROSSEL CONTÍNUO */}
      <section id="depoimentos" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-zinc-200 shadow-sm mb-6">
              <QuoteIcon size={14} style={{ color: themeColors.primary }} />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Depoimentos</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
              O que nossos <span style={{ color: themeColors.primary }}>clientes</span> dizem
            </h2>
            <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">
              Histórias reais de quem confiou em nosso trabalho
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 text-center border border-zinc-100 shadow-sm">
              <div className="flex justify-center mb-3">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} size={20} fill="#fbbf24" className="text-yellow-400" />
                ))}
              </div>
              <div className="text-3xl font-black" style={{ color: themeColors.primary }}>4.98</div>
              <p className="text-xs text-zinc-500 mt-1">Média de avaliações</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-zinc-100 shadow-sm">
              <div className="text-3xl font-black" style={{ color: themeColors.primary }}>500+</div>
              <p className="text-xs text-zinc-500 mt-1">Clientes atendidos</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-zinc-100 shadow-sm">
              <div className="text-3xl font-black" style={{ color: themeColors.primary }}>100%</div>
              <p className="text-xs text-zinc-500 mt-1">Recomendam os serviços</p>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={scrollLeft}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0217ff] hover:text-white transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={scrollRight}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0217ff] hover:text-white transition-all"
            >
              <ChevronRightIcon size={20} />
            </button>

            <div 
              ref={carouselRef}
              className="flex overflow-x-auto gap-6 pb-6 scroll-smooth hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {duplicatedTestimonials.map((testimonial, idx) => (
                <div 
                  key={`${testimonial.id}-${idx}`}
                  className="flex-none w-[380px] bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <img 
                      src={testimonial.avatar} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#0217ff]/20" 
                      alt={testimonial.name}
                    />
                    <div>
                      <h4 className="font-black text-lg">{testimonial.name}</h4>
                      <p className="text-xs text-zinc-500">{testimonial.role}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={12} fill="#fbbf24" className="text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <QuoteIcon size={32} className="ml-auto text-[#0217ff]/20" />
                  </div>
                  
                  <p className="text-zinc-600 leading-relaxed mb-6 italic text-sm">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="pt-4 border-t border-zinc-100">
                    <p className="text-[10px] text-zinc-400 flex items-center gap-2">
                      <CalendarDays size={10} />
                      {testimonial.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0217ff] mb-2 block">Sobre</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
              Especialista em <br />
              <span style={{ color: themeColors.primary }}>Mercado Imobiliário</span>
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-6">
              {broker.bio || `Com mais de 10 anos de experiência no mercado imobiliário, já ajudei centenas de famílias a realizarem o sonho da casa própria. Meu compromisso é oferecer atendimento personalizado, transparência em todas as etapas e as melhores oportunidades.`}
            </p>
            
            {broker.specialties && broker.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {broker.specialties.map((spec: string) => (
                  <span key={spec} className="px-4 py-2 bg-white rounded-xl text-[10px] font-bold uppercase shadow-sm border border-zinc-100" style={{ color: themeColors.primary }}>
                    {spec}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex gap-4">
              {broker.phone && (
                <a href={`https://wa.me/${broker.phone.replace(/\D/g, '')}`} target="_blank" className="px-6 py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})` }}>
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {broker.social_media?.instagram && (
                <a href={broker.social_media.instagram} target="_blank" className="px-6 py-3 bg-white border border-zinc-200 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:border-[#0217ff] transition-all">
                  <Instagram size={14} /> Instagram
                </a>
              )}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0217ff]/10 to-[#00c6ff]/10 rounded-[48px] blur-2xl"></div>
            <div className="relative bg-white rounded-[48px] p-8 shadow-xl border border-zinc-100">
              <div className="flex items-center gap-4 mb-6">
                {broker.logo ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-lg border-2 border-[#0217ff]/20 flex items-center justify-center">
                    <img 
                      src={broker.logo} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Erro ao carregar logo na seção sobre');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0217ff] to-[#00c6ff] flex items-center justify-center text-white font-black text-2xl">
                    {broker.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-xl">{broker.full_name}</h3>
                  <p className="text-zinc-500 text-sm">{broker.professional_title || 'Consultor Imobiliário'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div className="text-center">
                  <div className="text-2xl font-black" style={{ color: themeColors.primary }}>+{properties.length}</div>
                  <div className="text-[9px] text-zinc-500 uppercase">Imóveis Vendidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black" style={{ color: themeColors.primary }}>100%</div>
                  <div className="text-[9px] text-zinc-500 uppercase">Clientes Satisfeitos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contato" className="py-24 px-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})` }}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Sparkles size={40} className="mx-auto mb-6 opacity-80" />
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
            Pronto para <br />Encontrar o Imóvel dos Sonhos?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Entre em contato e agende uma consultoria personalizada
          </p>
          
          <form onSubmit={handleLeadCapture} className="max-w-md mx-auto space-y-4">
            <div className="flex gap-3 flex-wrap">
              <input 
                required
                type="text"
                placeholder="Seu Nome"
                value={leadForm.name}
                onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                className="flex-1 min-w-[200px] p-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-white/70 outline-none focus:bg-white/30 transition-all"
              />
              <input 
                required
                type="tel"
                placeholder="WhatsApp"
                value={leadForm.phone}
                onChange={e => setLeadForm({...leadForm, phone: e.target.value.replace(/\D/g, '')})}
                className="flex-1 min-w-[200px] p-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-white/70 outline-none focus:bg-white/30 transition-all"
              />
              <input 
                type="email"
                placeholder="E-mail (opcional)"
                value={leadForm.email}
                onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                className="flex-1 min-w-[200px] p-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-white/70 outline-none focus:bg-white/30 transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting || sent}
              className="w-full py-5 bg-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
              style={{ color: themeColors.primary }}
            >
              {sent ? <><Check size={18} /> Enviado!</> : isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Quero Receber Ofertas</>}
            </button>
          </form>
        </div>
      </section>

      {/* MODAL DE DETALHES COM COMODIDADES */}
      {showModal && selectedProperty && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-white rounded-[48px] max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 z-10 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-[#0217ff] hover:text-white transition-all">
              <X size={20} />
            </button>
            
            <div className="relative aspect-video">
              <img src={selectedProperty.images?.[imageIndex] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000'} className="w-full h-full object-cover rounded-t-[48px]" alt={selectedProperty.title} />
              {selectedProperty.images?.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all">
                    <ChevronRightIcon size={20} />
                  </button>
                </>
              )}
            </div>

            <div className="p-8 md:p-12 space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-4">{selectedProperty.title}</h2>
                <div className="flex items-center gap-2 text-zinc-500">
                  <MapPin size={16} style={{ color: themeColors.primary }} />
                  <span className="font-bold">{selectedProperty.location}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-zinc-50 rounded-[32px]">
                <div className="text-center">
                  <Bed size={24} className="mx-auto mb-2" style={{ color: themeColors.primary }} />
                  <div className="font-black text-xl">{selectedProperty.bedrooms}</div>
                  <div className="text-[9px] text-zinc-500 uppercase">Quartos</div>
                </div>
                <div className="text-center">
                  <Bath size={24} className="mx-auto mb-2" style={{ color: themeColors.primary }} />
                  <div className="font-black text-xl">{selectedProperty.bathrooms}</div>
                  <div className="text-[9px] text-zinc-500 uppercase">Banheiros</div>
                </div>
                <div className="text-center">
                  <Ruler size={24} className="mx-auto mb-2" style={{ color: themeColors.primary }} />
                  <div className="font-black text-xl">{selectedProperty.area}</div>
                  <div className="text-[9px] text-zinc-500 uppercase">m²</div>
                </div>
                <div className="text-center">
                  <Maximize2 size={24} className="mx-auto mb-2" style={{ color: themeColors.primary }} />
                  <div className="font-black text-xl">{selectedProperty.parking_spaces || 0}</div>
                  <div className="text-[9px] text-zinc-500 uppercase">Vagas</div>
                </div>
              </div>

              {/* 🔥 COMODIDADES NO MODAL DE DETALHES */}
              {getPropertyAmenities(selectedProperty).length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Building size={14} className="text-[#0217ff]" />
                    Comodidades do Condomínio
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getPropertyAmenities(selectedProperty).map((amenity) => {
                      const Icon = amenity.icon;
                      return (
                        <div key={amenity.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
                          <Icon size={18} className="text-[#0217ff]" />
                          <span className="text-sm font-medium text-zinc-700">{amenity.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedProperty.description && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-3">Descrição</h3>
                  <p className="text-zinc-600 leading-relaxed">{selectedProperty.description}</p>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-zinc-100">
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1 uppercase">Valor</span>
                  <div className="text-4xl font-black" style={{ color: themeColors.primary }}>{formatCurrency(selectedProperty.price)}</div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={() => { setShowModal(false); setTimeout(() => scrollToSection('contato'), 100); }} className="flex-1 md:flex-none px-8 py-4 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg" style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})` }}>
                    <MessageCircle size={16} /> Tenho Interesse
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                {broker.logo ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-md">
                    <img 
                      src={broker.logo} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl bg-gradient-to-r from-[#0217ff] to-[#00c6ff]">
                    {broker.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-black uppercase text-lg tracking-tighter">{broker.full_name}</h3>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest">Consultor Imobiliário</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {broker.bio?.substring(0, 120) || `Especialista em encontrar o lar ideal para você e sua família.`}
                {broker.bio?.length > 120 ? '...' : ''}
              </p>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#0217ff]" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Profissional Credenciado</span>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[#0217ff] mb-6">Navegação</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('imoveis')} className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"><ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /> Imóveis</button></li>
                <li><button onClick={() => scrollToSection('sobre')} className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"><ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /> Sobre</button></li>
                <li><button onClick={() => scrollToSection('depoimentos')} className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"><ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /> Depoimentos</button></li>
                <li><button onClick={() => scrollToSection('contato')} className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"><ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /> Contato</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[#0217ff] mb-6">Contato</h4>
              <div className="space-y-4">
                {broker.phone && (
                  <div className="flex items-start gap-3">
                    <PhoneCall size={16} className="text-[#0217ff] mt-0.5" />
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">WhatsApp</p>
                      <a href={`https://wa.me/${broker.phone.replace(/\D/g, '')}`} target="_blank" className="text-sm text-white hover:text-[#0217ff] transition-colors">
                        {formatPhoneDisplay(broker.phone)}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MailIcon size={16} className="text-[#0217ff] mt-0.5" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">E-mail</p>
                    <a href={`mailto:${broker.email || 'contato@imobipro.com'}`} className="text-sm text-white hover:text-[#0217ff] transition-colors break-all">
                      {broker.email || 'contato@imobipro.com'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[#0217ff] mb-6">Redes Sociais</h4>
              <div className="flex flex-wrap gap-3 mb-6">
                {broker.social_media?.instagram && <a href={broker.social_media.instagram} target="_blank" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-[#E1306C] transition-all"><Instagram size={18} className="text-zinc-400 hover:text-white" /></a>}
                {broker.social_media?.facebook && <a href={broker.social_media.facebook} target="_blank" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-[#1877F2] transition-all"><Facebook size={18} className="text-zinc-400 hover:text-white" /></a>}
                {broker.social_media?.youtube && <a href={broker.social_media.youtube} target="_blank" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-[#FF0000] transition-all"><Youtube size={18} className="text-zinc-400 hover:text-white" /></a>}
                {broker.social_media?.linkedin && <a href={broker.social_media.linkedin} target="_blank" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-[#0A66C2] transition-all"><Linkedin size={18} className="text-zinc-400 hover:text-white" /></a>}
              </div>
              <div className="mt-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Receba Novidades</p>
                <div className="flex gap-2">
                  <input type="email" placeholder="Seu e-mail" className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#0217ff]" />
                  <button className="px-3 py-2 bg-[#0217ff] rounded-lg hover:bg-[#0217ff]/80 transition-all"><Send size={14} /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em]">
                ImobiPro © {new Date().getFullYear()} — Inteligência Imobiliária
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-[10px] text-zinc-500 hover:text-white transition-colors">Política de Privacidade</a>
                <a href="#" className="text-[10px] text-zinc-500 hover:text-white transition-colors">Termos de Uso</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}