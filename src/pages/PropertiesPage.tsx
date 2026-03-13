import { useState, useMemo } from 'react';
import { 
  Plus, Search, MapPin, Home, Bed, Bath, Ruler, Trash2, Edit2, 
  Loader2, Image as ImageIcon, X, Upload, Car, Check, Star, 
  Wind, Shield, Coffee, Waves, Dumbbell, Utensils, Baby, TreePine, PawPrint
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

export default function PropertiesPage() {
  const { properties, addProperty, deleteProperty, updateProperty, uploadPropertyImage, darkMode } = useGlobal();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lista de Características (Amenidades) Premium
  const amenitiesList = [
    { id: 'piscina', label: 'Piscina', icon: Waves },
    { id: 'academia', label: 'Academia', icon: Dumbbell },
    { id: 'churrasqueira', label: 'Churrasqueira', icon: Utensils },
    { id: 'salao_festas', label: 'Salão de Festas', icon: Coffee },
    { id: 'portaria', label: 'Portaria 24h', icon: Shield },
    { id: 'ar_condicionado', label: 'Ar Condicionado', icon: Wind },
    { id: 'playground', label: 'Playground', icon: Baby },
    { id: 'jardim', label: 'Jardim', icon: TreePine },
    { id: 'pet_friendly', label: 'Pet Friendly', icon: PawPrint },
    { id: 'mobiliado', label: 'Mobiliado', icon: Home },
  ];

  const statusOptions = [
    { label: 'Disponível', value: 'disponível', color: 'bg-emerald-500' },
    { label: 'Oportunidade', value: 'oportunidade', color: 'bg-orange-500' },
    { label: 'Reservado', value: 'reservado', color: 'bg-blue-600' },
    { label: 'Vendido', value: 'vendido', color: 'bg-zinc-500' }
  ];

  const [newProperty, setNewProperty] = useState({
    title: '', description: '', price: 0, location: '',
    type: 'venda', status: 'disponível', 
    bedrooms: 0, suites: 0, bathrooms: 0, parkings: 0, 
    area: 0, condominium: 0, iptu: 0,
    images: [] as string[], features: [] as string[],
    address: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' }
  });

  const filtered = useMemo(() => {
    return (properties || []).filter(p => 
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.address?.bairro || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [properties, searchTerm]);

  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    setNewProperty(prev => ({ ...prev, address: { ...prev.address!, cep: cleanCEP } }));
    if (cleanCEP.length === 8) {
      setIsSearchingCEP(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setNewProperty(prev => ({
            ...prev,
            location: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`,
            address: { ...prev.address!, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }
          }));
        }
      } catch (err) { console.error(err); } finally { setIsSearchingCEP(false); }
    }
  };

  const toggleFeature = (id: string) => {
    setNewProperty(prev => ({
      ...prev,
      features: prev.features.includes(id) 
        ? prev.features.filter(f => f !== id) 
        : [...prev.features, id]
    }));
  };

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

  // ESTILOS DE ALTO CONTRASTE
  const textPrimary = darkMode ? 'text-white' : 'text-zinc-900';
  const textSecondary = darkMode ? 'text-zinc-400' : 'text-zinc-600';
  const cardBg = darkMode ? 'bg-[#0c0c0c] border-white/10' : 'bg-white border-zinc-200 shadow-2xl shadow-zinc-200/50';
  const innerCard = darkMode ? 'bg-zinc-900/50' : 'bg-zinc-50';

  return (
    <div className={`space-y-8 animate-fade-in pb-24 font-sans px-4 lg:px-0 ${textPrimary}`}>
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
            MEU<span className="text-[#0217ff]">INVENTÁRIO</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-12 bg-[#0217ff] rounded-full"></span>
            <p className="text-[#0217ff] font-black text-[10px] uppercase tracking-[0.3em]">Catálogo de Ativos Luxo</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 max-w-2xl gap-3">
          <div className={`flex-1 relative flex items-center rounded-[24px] border-2 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <Search className="absolute left-5 w-5 h-5 text-[#0217ff]" />
            <input 
              type="text" 
              placeholder="PESQUISAR POR BAIRRO OU NOME..." 
              className="w-full bg-transparent pl-14 pr-6 py-5 outline-none font-black text-xs uppercase dark:text-white placeholder:text-zinc-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => { setEditingProperty(null); setIsModalOpen(true); }} className="px-10 py-5 bg-[#0217ff] text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/40 hover:scale-[1.02] active:scale-95 transition-all">
            ADICIONAR ATIVO
          </button>
        </div>
      </div>

      {/* GRID DE CARDS RESPONSIVO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
        {filtered.map(p => {
          const statusObj = statusOptions.find(s => s.value === p.status) || statusOptions[0];
          return (
            <div key={p.id} className={`rounded-[48px] border-2 overflow-hidden flex flex-col transition-all duration-500 group hover:-translate-y-2 ${cardBg}`}>
              
              {/* Imagem + Badge de Status */}
              <div className="aspect-[4/3] bg-zinc-800 relative overflow-hidden">
                {p.images?.[0] ? (
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Capa" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700"><Home size={64} /></div>
                )}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <span className={`px-4 py-2 ${statusObj.color} text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-2xl`}>
                    {statusObj.label}
                  </span>
                </div>
              </div>

              {/* Informações Técnicas */}
              <div className="p-8 md:p-10 flex-1 flex flex-col gap-5">
                <div className="flex items-center gap-2 text-[#0217ff] text-sm font-black uppercase tracking-widest">
                  <MapPin size={22} fill="currentColor" fillOpacity={0.2} /> 
                  <span>{p.address?.bairro || 'Localização'}</span>
                </div>

                <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-[0.85] ${textPrimary}`}>
                  {p.title || 'IMÓVEL SEM TÍTULO'}
                </h3>
                
                {/* Exibição das Features (Caracteristicas) no Card */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {p.features?.slice(0, 3).map((fId: string) => {
                    const feature = amenitiesList.find(a => a.id === fId);
                    if (!feature) return null;
                    return (
                      <span key={fId} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${darkMode ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-50 border-zinc-100 text-zinc-500'}`}>
                        {feature.label}
                      </span>
                    )
                  })}
                  {p.features?.length > 3 && <span className="text-[9px] font-black text-[#0217ff] uppercase">+ {p.features.length - 3} itens</span>}
                </div>

                {/* Specs Grid (Maiores para Mobile) */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Bed, val: `${p.bedrooms || 0} Qts` },
                    { icon: Car, val: `${p.parkings || 0} Vagas` },
                    { icon: Bath, val: `${p.bathrooms || 0} Banh` },
                    { icon: Ruler, val: `${p.area || 0} m²` }
                  ].map((item, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-4 rounded-[24px] border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                      <item.icon size={22} className="text-[#0217ff]" />
                      <span className={`font-black text-sm uppercase ${textPrimary}`}>{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* Footer do Card */}
                <div className="mt-auto pt-8 border-t-2 border-zinc-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-3xl font-black text-[#0217ff] tracking-tighter italic">{formatBRL(p.price)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProperty(p); setNewProperty(p); setIsModalOpen(true); }} className={`p-4 rounded-2xl transition-all ${darkMode ? 'bg-white/5 text-zinc-500 hover:text-blue-500' : 'bg-zinc-100 text-zinc-500 hover:text-blue-500'}`}><Edit2 size={22}/></button>
                    <button onClick={() => deleteProperty(p.id)} className={`p-4 rounded-2xl transition-all ${darkMode ? 'bg-white/5 text-zinc-500 hover:text-red-500' : 'bg-zinc-100 text-zinc-500 hover:text-red-500'}`}><Trash2 size={22}/></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CADASTRO PREMIUM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-2 lg:p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-[56px] shadow-2xl overflow-hidden flex flex-col my-auto border-2 ${darkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-zinc-200'}`}>
            
            <div className={`p-8 lg:p-12 border-b-2 flex items-center justify-between ${darkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
              <h2 className={`text-3xl lg:text-4xl font-black italic uppercase tracking-tighter ${textPrimary}`}>Configurar Ativo</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-red-500 text-white rounded-2xl shadow-xl active:scale-90 transition-all"><X size={32} /></button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); editingProperty ? updateProperty(editingProperty.id, newProperty) : addProperty(newProperty); setIsModalOpen(false); }} className="p-8 lg:p-12 space-y-12 overflow-y-auto max-h-[75vh] custom-scrollbar">
              
              {/* STATUS DE MERCADO */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-[#0217ff] uppercase tracking-[0.2em] ml-1">Status de Mercado</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewProperty({...newProperty, status: opt.value})}
                      className={`py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        newProperty.status === opt.value 
                        ? 'bg-[#0217ff] border-[#0217ff] text-white shadow-xl scale-105' 
                        : `bg-transparent ${darkMode ? 'border-white/10 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* GALERIA FOTOGRÁFICA */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-[#0217ff] uppercase tracking-[0.2em]">Book Fotográfico</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {newProperty.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[32px] overflow-hidden border-2 border-white/10 shadow-xl group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setNewProperty(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl shadow-lg"><Trash2 size={12}/></button>
                    </div>
                  ))}
                  <label className={`aspect-square rounded-[32px] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                    {isUploading ? <Loader2 className="animate-spin text-[#0217ff]" /> : <><Upload size={36} className="text-[#0217ff] mb-2"/><span className="text-[10px] font-black text-zinc-500 uppercase">Upload</span></>}
                    <input type="file" multiple className="hidden" onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      setIsUploading(true);
                      for (const f of files) {
                        const url = await uploadPropertyImage(f);
                        if (url) setNewProperty(prev => ({...prev, images: [...prev.images, url]}));
                      }
                      setIsUploading(false);
                    }} disabled={isUploading} />
                  </label>
                </div>
              </div>

              {/* LOCALIZAÇÃO PRIVADA */}
              <div className={`p-8 rounded-[48px] border-2 ${darkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">CEP</label>
                    <div className="relative">
                      <input type="text" className={`w-full rounded-2xl py-4 px-6 outline-none border-2 font-black ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`} value={newProperty.address?.cep} onChange={e => handleCEPChange(e.target.value)} placeholder="00000-000" />
                      {isSearchingCEP && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0217ff] animate-spin" />}
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Endereço Público (Bairro / Cidade)</label>
                    <input required className={`w-full rounded-2xl py-4 px-6 outline-none border-2 font-black ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`} value={newProperty.location} onChange={e => setNewProperty({...newProperty, location: e.target.value})} placeholder="MANAÍRA, JOÃO PESSOA - PB" />
                  </div>
                </div>
              </div>

              {/* DADOS E CARACTERÍSTICAS (AMENIDADES) */}
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#0217ff] uppercase tracking-widest ml-1">Título do Anúncio</label>
                    <input required className={`w-full rounded-2xl py-5 px-6 outline-none border-2 font-black text-lg ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`} value={newProperty.title} onChange={e => setNewProperty({...newProperty, title: e.target.value})} placeholder="EX: COBERTURA DUPLEX COM VISTA MAR" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-6 rounded-[32px] border-2 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100'}`}>
                      <label className="text-[9px] font-black text-[#0217ff] uppercase block mb-2">Preço de Venda</label>
                      <input type="number" className="bg-transparent font-black w-full outline-none text-2xl text-[#0217ff]" value={newProperty.price || ''} onChange={e => setNewProperty({...newProperty, price: Number(e.target.value)})} />
                    </div>
                    <div className={`p-6 rounded-[32px] border-2 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100'}`}>
                      <label className="text-[9px] font-black text-zinc-500 uppercase block mb-2">Área (M²)</label>
                      <input type="number" className="bg-transparent font-black w-full outline-none text-2xl" value={newProperty.area || ''} onChange={e => setNewProperty({...newProperty, area: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                {/* AMENIDADES (O QUE VOCÊ PEDIU) */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-[#0217ff] uppercase tracking-[0.2em] ml-1">O que o imóvel oferece? (Tags)</label>
                  <div className="flex flex-wrap gap-3">
                    {amenitiesList.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleFeature(item.id)}
                        className={`px-5 py-3 rounded-2xl flex items-center gap-2 border-2 transition-all font-black text-[10px] uppercase ${
                          newProperty.features.includes(item.id)
                          ? 'bg-[#0217ff] border-[#0217ff] text-white shadow-lg'
                          : `bg-transparent ${darkMode ? 'border-white/10 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`
                        }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SPECS TÉCNICAS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { label: 'QUARTOS', key: 'bedrooms', icon: Bed },
                     { label: 'SUÍTES', key: 'suites', icon: Star },
                     { label: 'BANHEIROS', key: 'bathrooms', icon: Bath },
                     { icon: Car, label: 'VAGAS', key: 'parkings' }
                   ].map((spec) => (
                     <div key={spec.key} className={`p-5 rounded-[32px] border-2 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100'}`}>
                        <label className="text-[9px] font-black text-zinc-500 uppercase block mb-2">{spec.label}</label>
                        <div className="flex items-center gap-3">
                           <spec.icon size={20} className="text-[#0217ff]" />
                           <input type="number" className="bg-transparent font-black w-full text-2xl outline-none" value={(newProperty as any)[spec.key]} onChange={e => setNewProperty({...newProperty, [spec.key]: Number(e.target.value)})} />
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-[#0217ff] uppercase tracking-widest ml-1">Descrição Comercial</label>
                <textarea rows={6} className={`w-full rounded-[40px] py-8 px-10 outline-none border-2 font-medium italic text-lg leading-relaxed ${darkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} value={newProperty.description} onChange={e => setNewProperty({...newProperty, description: e.target.value})} placeholder="Conte a história deste imóvel..." />
              </div>

              <button type="submit" className="w-full py-8 bg-[#0217ff] text-white rounded-[40px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/50 hover:scale-[1.01] transition-all">
                PUBLICAR ATIVO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}