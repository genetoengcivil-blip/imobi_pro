import { useState, useMemo } from 'react';
import { Search, MapPin, Phone, Mail, Instagram, Facebook, Youtube, Linkedin, MessageSquare, ChevronLeft, Home, Bed, Bath, Ruler, Heart, Share2, Info, ArrowRight } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Logo } from '../components/Logo';

export default function SitePage() {
  const { user, properties } = useGlobal();
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'venda' | 'locação'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'map'>('info');

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesFilter = filter === 'all' || p.type === filter;
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [properties, filter, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const whatsappLink = `https://wa.me/55${user?.phone?.replace(/\D/g, '') || ''}?text=Olá! Gostaria de mais informações sobre os seus imóveis.`;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-b border-white/10 z-50 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="#/dashboard" className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all group" title="Voltar ao CRM">
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </a>
            <div className="flex items-center gap-3">
              {user?.logo ? (
                <img src={user.logo} alt={user?.company} className="w-10 h-10 rounded-full border border-white/20 object-cover shadow-lg" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold shadow-lg">
                  <Logo className="w-6 h-6" />
                </div>
              )}
              <div className="hidden sm:block">
                <div className="font-bold text-lg leading-tight tracking-tight">{user?.company || 'Imobiliária'}</div>
                {user?.creci && <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase leading-none mt-0.5">CRECI {user.creci}</div>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 mr-6">
              <a href="#hero" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Início</a>
              <a href="#catalog" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Imóveis</a>
              <a href="#contact" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Contato</a>
            </div>
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <MessageSquare className="w-4 h-4" />
              Falar agora
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="pt-40 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            O imóvel que você busca <br />
            <span className="text-zinc-500">está bem aqui.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
            Explore nossa seleção exclusiva de imóveis para venda e locação em {user?.company || 'nossa imobiliária'}.
          </p>
          
          <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Bairro, cidade ou tipo de imóvel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent py-4 pl-12 pr-4 text-white focus:outline-none placeholder-zinc-600"
              />
            </div>
            <div className="flex gap-2 p-1">
              {['all', 'sale', 'rent'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t as any)}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    filter === t 
                    ? 'bg-white text-black shadow-lg' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t === 'all' ? 'Todos' : t === 'sale' ? 'Comprar' : 'Alugar'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="py-20 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-blue-500 font-bold tracking-widest uppercase text-[10px] mb-2">CATÁLOGO EXCLUSIVO</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Imóveis em destaque</h2>
            </div>
            <div className="text-zinc-500 text-sm font-medium">
              Mostrando {filteredProperties.length} propriedades encontradas
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((p) => (
              <div 
                key={p.id}
                onClick={() => { setSelectedProperty(p); setActiveTab('info'); }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-500 group relative"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {p.images?.[0] ? (
                    <img 
                      src={p.images[0]} 
                      alt={p.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <Home className="w-12 h-12 text-zinc-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.type === 'venda' ? 'bg-blue-600' : 'bg-green-600'
                    }`}>
                      {p.type === 'venda' ? 'Venda' : 'Locação'}
                    </span>
                  </div>
                  <button className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mb-3">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{p.location}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 line-clamp-1">{p.title}</h3>
                  <div className="flex items-center justify-between text-zinc-400 text-sm mb-6 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-1.5"><Bed className="w-4 h-4" /> {p.bedrooms}</div>
                    <div className="flex items-center gap-1.5"><Bath className="w-4 h-4" /> {p.bathrooms}</div>
                    <div className="flex items-center gap-1.5"><Ruler className="w-4 h-4" /> {p.area}m²</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">{formatCurrency(p.price)}</div>
                    <button className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProperties.length === 0 && (
            <div className="py-40 text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-zinc-700" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-zinc-500">Tente ajustar seus filtros ou termos de busca.</p>
            </div>
          )}
        </div>
      </section>

      {/* About/Contact */}
      <section id="contact" className="py-24 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="text-blue-500 font-bold tracking-widest uppercase text-[10px] mb-4">ENTRE EM CONTATO</div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Vamos encontrar o <br /> imóvel ideal para você.</h2>
              <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
                {user?.bio || 'Temos uma equipe preparada para te atender com agilidade e transparência. Entre em contato por um dos canais abaixo ou visite nosso escritório.'}
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Telefone</div>
                    <div className="text-lg font-bold">{user?.phone || 'Não informado'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">E-mail</div>
                    <div className="text-lg font-bold">{user?.email || 'Não informado'}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                {[
                  { icon: Instagram, url: user?.socialMedia?.instagram, color: 'hover:bg-pink-600' },
                  { icon: Facebook, url: user?.socialMedia?.facebook, color: 'hover:bg-blue-600' },
                  { icon: Youtube, url: user?.socialMedia?.youtube, color: 'hover:bg-red-600' },
                  { icon: Linkedin, url: user?.socialMedia?.linkedin, color: 'hover:bg-blue-700' }
                ].filter(s => s.url).map((s, i) => (
                  <a 
                    key={i} 
                    href={s.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white transition-all ${s.color}`}
                  >
                    <s.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl relative">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full" />
              <div className="text-2xl font-bold mb-6">Mande uma mensagem</div>
              <div className="space-y-4">
                <input type="text" placeholder="Seu Nome" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50" />
                <input type="email" placeholder="Seu E-mail" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50" />
                <textarea placeholder="Como podemos ajudar?" rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none"></textarea>
                <button className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors">Enviar Mensagem</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-full max-h-[90vh] bg-zinc-950 border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
            <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedProperty.type === 'sale' ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  {selectedProperty.type === 'sale' ? 'Venda' : 'Locação'}
                </span>
                <h3 className="font-bold text-lg truncate">{selectedProperty.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedProperty(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-6 h-6 rotate-90" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Images Container */}
                <div className="bg-black aspect-video lg:aspect-auto lg:h-[calc(90vh-64px)] overflow-y-auto custom-scrollbar p-6 space-y-4">
                  {selectedProperty.images && selectedProperty.images.length > 0 ? (
                    selectedProperty.images.map((img: string, i: number) => (
                      <img key={i} src={img} alt="" className="w-full h-auto rounded-2xl border border-white/5" />
                    ))
                  ) : (
                    <div className="w-full h-full bg-zinc-900 rounded-2xl flex items-center justify-center">
                      <Home className="w-20 h-20 text-zinc-800" />
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="p-8 lg:p-12 overflow-y-auto">
                  <div className="flex gap-4 mb-8">
                    <button 
                      onClick={() => setActiveTab('info')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'info' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Info className="w-4 h-4" />
                      Informações
                    </button>
                    <button 
                      onClick={() => setActiveTab('map')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'map' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      Localização
                    </button>
                  </div>

                  {activeTab === 'info' ? (
                    <div className="space-y-8 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-4xl font-bold text-white mb-2">{formatCurrency(selectedProperty.price)}</div>
                          <div className="flex items-center gap-2 text-zinc-500 font-medium">
                            <MapPin className="w-4 h-4" />
                            {selectedProperty.location}
                          </div>
                        </div>
                        <button className="p-4 bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-colors border border-white/10">
                          <Share2 className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                          <div className="text-zinc-500 mb-1"><Bed className="w-5 h-5 mx-auto" /></div>
                          <div className="text-lg font-bold">{selectedProperty.bedrooms}</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Dormitórios</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                          <div className="text-zinc-500 mb-1"><Bath className="w-5 h-5 mx-auto" /></div>
                          <div className="text-lg font-bold">{selectedProperty.bathrooms}</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Banheiros</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                          <div className="text-zinc-500 mb-1"><Ruler className="w-5 h-5 mx-auto" /></div>
                          <div className="text-lg font-bold">{selectedProperty.area}m²</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Área Total</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-xl">Descrição do Imóvel</h4>
                        <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{selectedProperty.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-fade-in">
                      <div className="aspect-video bg-zinc-900 rounded-[32px] overflow-hidden border border-white/10 relative group">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyA_...&q=${encodeURIComponent(selectedProperty.location)}`}
                          allowFullScreen
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedProperty.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 shadow-2xl transition-transform hover:scale-105"
                          >
                            <MapPin className="w-5 h-5" />
                            Traçar Rota GPS
                          </a>
                        </div>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <div className="font-bold mb-2">Endereço de Referência</div>
                        <p className="text-zinc-400">{selectedProperty.location}</p>
                        <p className="text-xs text-zinc-600 mt-4 italic">* A localização exata é fornecida mediante agendamento.</p>
                      </div>
                    </div>
                  )}

                  <div className="sticky bottom-0 pt-12 pb-4 bg-zinc-950">
                    <a 
                      href={whatsappLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-5 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-xl shadow-blue-600/20"
                    >
                      <MessageSquare className="w-6 h-6" />
                      Tenho Interesse - Chamar agora
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms/Privacy Links */}
      <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
        <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
        <div className="w-1 h-1 bg-zinc-800 rounded-full" />
        <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
      </div>
    </div>
  );
}
