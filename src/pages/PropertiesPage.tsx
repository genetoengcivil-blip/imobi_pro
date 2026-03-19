import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  X, Loader2, Check, Globe, Star, Square, 
  Car, ShieldCheck, Info, ChevronLeft, ChevronRight,
  Calculator, AlertTriangle, TrendingUp, Camera,
  Wifi, Zap, Flame, Coffee, Dumbbell, Waves,
  Trees, Building2, Ruler, Tag, Copy, Share2,
  Download, Filter, Grid3X3, List, Maximize2,
  DollarSign, Percent, Hash, Clock, Award,
  ArrowLeft, Save, PlusCircle, MinusCircle, Search // <-- ADD SEARCH HERE
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

// ... (resto do código permanece igual)

// --- TIPOS E INTERFACES ---
interface Property {
  id: string;
  title: string;
  price: number;
  condo_fee?: number;
  type: 'venda' | 'locacao' | 'venda_locacao';
  status: 'disponivel' | 'negociacao' | 'vendido' | 'locado' | 'indisponivel';
  bedrooms: number;
  bathrooms: number;
  suites?: number;
  area: number;
  parking_spaces: number;
  description?: string;
  images: string[];
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  location: string;
  has_elevator?: boolean;
  has_bbq?: boolean;
  has_pool?: boolean;
  has_gym?: boolean;
  has_games?: boolean;
  has_party?: boolean;
  has_spa?: boolean;
  has_playground?: boolean;
  has_court?: boolean;
  has_gourmet?: boolean;
  has_conciege?: boolean;
  has_laundry?: boolean;
  featured?: boolean;
  views?: number;
  created_at: string;
}

interface PropertyFormData extends Omit<Property, 'id' | 'created_at' | 'views'> {
  id?: string;
}

// CONSTANTES
const PROPERTY_TYPES = {
  venda: { label: 'Venda', color: 'text-green-500', bg: 'bg-green-500/10' },
  locacao: { label: 'Locação', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  venda_locacao: { label: 'Venda/Locação', color: 'text-[#0217ff]', bg: 'bg-[#0217ff]/10' }
};

const PROPERTY_STATUS = {
  disponivel: { label: 'Disponível', color: 'text-green-500', bg: 'bg-green-500/10' },
  negociacao: { label: 'Em Negociação', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  vendido: { label: 'Vendido', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  locado: { label: 'Locado', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  indisponivel: { label: 'Indisponível', color: 'text-zinc-500', bg: 'bg-zinc-500/10' }
};

const AMENITIES = [
  { id: 'has_pool', label: 'Piscina', icon: Waves },
  { id: 'has_gym', label: 'Academia', icon: Dumbbell },
  { id: 'has_bbq', label: 'Churrasqueira', icon: Flame },
  { id: 'has_elevator', label: 'Elevador', icon: Building2 },
  { id: 'has_games', label: 'Salão de Jogos', icon: Grid3X3 },
  { id: 'has_party', label: 'Salão de Festas', icon: Coffee },
  { id: 'has_spa', label: 'Spa', icon: Waves },
  { id: 'has_playground', label: 'Playground', icon: Trees },
  { id: 'has_court', label: 'Quadra', icon: Ruler },
  { id: 'has_gourmet', label: 'Gourmet', icon: Flame },
  { id: 'has_conciege', label: 'Portaria 24h', icon: ShieldCheck },
  { id: 'has_laundry', label: 'Lavanderia', icon: Zap }
];

export default function PropertiesPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para avaliação
  const [baseArea, setBaseArea] = useState('');
  const [comparables, setComparables] = useState([
    { price: '', area: '' },
    { price: '', area: '' },
    { price: '', area: '' },
  ]);

  const initialForm: PropertyFormData = {
    title: '', price: 0, condo_fee: 0, type: 'venda', status: 'disponivel',
    bedrooms: 0, bathrooms: 0, suites: 0, area: 0, parking_spaces: 0,
    description: '', images: [] as string[],
    cep: '', street: '', number: '', neighborhood: '', city: '', state: '', location: '',
    has_elevator: false, has_bbq: false, has_pool: false, has_gym: false,
    has_games: false, has_party: false, has_spa: false, has_playground: false,
    has_court: false, has_gourmet: false, has_conciege: false, has_laundry: false,
    featured: false
  };

  const [formData, setFormData] = useState<PropertyFormData>(initialForm);

  useEffect(() => { 
    if (user) loadProperties(); 
  }, [user]);

  async function loadProperties() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      setProperties(data || []);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
    } finally {
      setLoading(false);
    }
  }

  // FILTROS
  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ESTATÍSTICAS
  const stats = {
    total: properties.length,
    disponivel: properties.filter(p => p.status === 'disponivel').length,
    negociacao: properties.filter(p => p.status === 'negociacao').length,
    vendido: properties.filter(p => p.status === 'vendido').length,
    valorTotal: properties.reduce((acc, p) => acc + (p.price || 0), 0)
  };

  // AVALIAÇÃO
  const calculateValuation = () => {
    const validComparables = comparables.filter(c => c.price && c.area);
    if (validComparables.length === 0) return { avgM2: 0, total: 0 };

    const sumM2 = validComparables.reduce((acc, c) => {
      const price = parseFloat(String(c.price).replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      const area = parseFloat(c.area) || 1;
      return acc + (price / area);
    }, 0);

    const avgM2 = sumM2 / validComparables.length;
    const total = avgM2 * (parseFloat(baseArea) || 0);

    return { avgM2, total };
  };

  // CEP
  const handleCEPBlur = async () => {
    const cep = formData.cep?.replace(/\D/g, '');
    if (cep?.length !== 8) return;
    
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev, 
          street: data.logradouro, 
          neighborhood: data.bairro, 
          city: data.localidade, 
          state: data.uf,
          location: `${data.bairro}, ${data.localidade} - ${data.uf}`
        }));
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  // UPLOAD DE IMAGENS
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const setAsCover = (index: number) => {
    if (!formData.images) return;
    const newImages = [...formData.images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    setFormData({ ...formData, images: newImages });
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    
    setLoading(true);
    
    const payload = {
      ...formData,
      user_id: user?.id,
      price: formData.price || 0,
      condo_fee: formData.condo_fee || 0,
      bedrooms: formData.bedrooms || 0,
      bathrooms: formData.bathrooms || 0,
      suites: formData.suites || 0,
      area: formData.area || 0,
      parking_spaces: formData.parking_spaces || 0,
      updated_at: new Date()
    };

    try {
      let error;
      if (editingId) {
        ({ error } = await supabase
          .from('properties')
          .update(payload)
          .eq('id', editingId));
      } else {
        ({ error } = await supabase
          .from('properties')
          .insert([payload]));
      }

      if (error) throw error;
      
      setShowModal(false);
      setEditingId(null);
      setFormData(initialForm);
      loadProperties();
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // THEME
  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200 shadow-2xl',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400',
    text: darkMode ? 'text-white' : 'text-zinc-900',
    secondaryText: darkMode ? 'text-zinc-400' : 'text-zinc-500',
    border: darkMode ? 'border-white/5' : 'border-zinc-200',
    hover: darkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Imóveis</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {stats.total} imóveis cadastrados
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* VIEW MODE TOGGLE */}
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 shadow' : ''}`}
            >
              <Grid3X3 size={18} className={viewMode === 'grid' ? 'text-[#0217ff]' : 'text-zinc-400'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 shadow' : ''}`}
            >
              <List size={18} className={viewMode === 'list' ? 'text-[#0217ff]' : 'text-zinc-400'} />
            </button>
          </div>

          <button 
            onClick={() => setShowValuationModal(true)}
            className="px-4 py-2 bg-zinc-100 dark:bg-white/5 text-[#0217ff] rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-[#0217ff]/20 hover:bg-[#0217ff] hover:text-white transition-all"
          >
            <Calculator size={14} /> Avaliação
          </button>

          <button 
            onClick={() => { 
              setEditingId(null); 
              setFormData(initialForm); 
              setIsViewOnly(false); 
              setShowModal(true); 
            }} 
            className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-[#0217ff]/90 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Novo Imóvel
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} icon={Home} theme={theme} />
        <StatCard label="Disponíveis" value={stats.disponivel} icon={Check} color="text-green-500" theme={theme} />
        <StatCard label="Em Negociação" value={stats.negociacao} icon={Clock} color="text-orange-500" theme={theme} />
        <StatCard label="Vendidos/Locados" value={stats.vendido + stats.locado} icon={Award} color="text-blue-500" theme={theme} />
        <StatCard 
          label="Valor Total" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.valorTotal)} 
          icon={DollarSign} 
          color="text-[#0217ff]"
          theme={theme} 
        />
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        {/* SEARCH */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por título, bairro, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-9 pr-4 py-2.5 rounded-xl text-sm ${theme.input} w-full`}
          />
        </div>

        {/* STATUS FILTER */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <FilterButton
            label="Todos"
            active={filterStatus === 'todos'}
            onClick={() => setFilterStatus('todos')}
            theme={theme}
          />
          {Object.entries(PROPERTY_STATUS).map(([key, status]) => (
            <FilterButton
              key={key}
              label={status.label}
              active={filterStatus === key}
              onClick={() => setFilterStatus(key)}
              theme={theme}
              color={status.color}
            />
          ))}
        </div>
      </div>

      {/* PROPERTIES GRID/LIST */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#0217ff]" size={40} />
        </div>
      ) : filteredProperties.length === 0 ? (
        <EmptyState 
          searchTerm={searchTerm} 
          onClear={() => {
            setSearchTerm('');
            setFilterStatus('todos');
          }} 
          theme={theme} 
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onView={(p) => {
                setSelectedProperty(p);
                setShowDetailModal(true);
              }}
              onEdit={(p) => {
                setEditingId(p.id);
                setFormData(p);
                setIsViewOnly(false);
                setShowModal(true);
              }}
              onDelete={async (id) => {
                if (confirm('Tem certeza que deseja excluir este imóvel?')) {
                  await supabase.from('properties').delete().eq('id', id);
                  loadProperties();
                }
              }}
              theme={theme}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <PropertyListItem
              key={property.id}
              property={property}
              onView={(p) => {
                setSelectedProperty(p);
                setShowDetailModal(true);
              }}
              onEdit={(p) => {
                setEditingId(p.id);
                setFormData(p);
                setIsViewOnly(false);
                setShowModal(true);
              }}
              onDelete={async (id) => {
                if (confirm('Tem certeza que deseja excluir este imóvel?')) {
                  await supabase.from('properties').delete().eq('id', id);
                  loadProperties();
                }
              }}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            setEditingId(selectedProperty.id);
            setFormData(selectedProperty);
            setIsViewOnly(false);
            setShowModal(true);
          }}
          theme={theme}
        />
      )}

      {/* VALUATION MODAL */}
      {showValuationModal && (
        <ValuationModal
          baseArea={baseArea}
          setBaseArea={setBaseArea}
          comparables={comparables}
          setComparables={setComparables}
          onClose={() => setShowValuationModal(false)}
          calculateValuation={calculateValuation}
          theme={theme}
        />
      )}

      {/* PROPERTY FORM MODAL */}
      {showModal && (
        <PropertyFormModal
          formData={formData}
          setFormData={setFormData}
          editingId={editingId}
          isViewOnly={isViewOnly}
          loading={loading}
          uploading={uploading}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
            setFormData(initialForm);
          }}
          onSubmit={handleSubmit}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
          onSetCover={setAsCover}
          onCEPBlur={handleCEPBlur}
          theme={theme}
          properties={properties}
        />
      )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function StatCard({ label, value, icon: Icon, color = 'text-zinc-500', theme }: any) {
  return (
    <div className={`${theme.card} p-6 rounded-[24px] border`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <p className={`text-xl font-black ${theme.text}`}>{value}</p>
    </div>
  );
}

function FilterButton({ label, active, onClick, theme, color = '' }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all
        ${active 
          ? 'bg-[#0217ff] text-white' 
          : `${theme.card} ${theme.text} ${theme.hover}`}`}
    >
      {label}
    </button>
  );
}

function EmptyState({ searchTerm, onClear, theme }: any) {
  return (
    <div className={`${theme.card} rounded-[32px] border p-12 text-center`}>
      <Home size={48} className="mx-auto mb-4 text-zinc-300" />
      <p className={`${theme.text} font-bold`}>
        {searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
      </p>
      <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">
        {searchTerm ? (
          <>
            Tente outros termos de busca ou{' '}
            <button onClick={onClear} className="text-[#0217ff] underline">
              limpar filtros
            </button>
          </>
        ) : (
          'Clique em "Novo Imóvel" para começar'
        )}
      </p>
    </div>
  );
}

function PropertyCard({ property, onView, onEdit, onDelete, theme }: any) {
  const status = PROPERTY_STATUS[property.status as keyof typeof PROPERTY_STATUS] || PROPERTY_STATUS.disponivel;
  const type = PROPERTY_TYPES[property.type as keyof typeof PROPERTY_TYPES] || PROPERTY_TYPES.venda;

  return (
    <div className={`${theme.card} rounded-[32px] border overflow-hidden relative group hover:shadow-xl transition-all`}>
      {/* ACTIONS OVERLAY */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={() => onView(property)}
          className="p-2.5 bg-white/90 backdrop-blur rounded-full text-black shadow-lg hover:bg-[#0217ff] hover:text-white transition-all"
          title="Visualizar"
        >
          <Eye size={16} />
        </button>
        <button 
          onClick={() => onEdit(property)}
          className="p-2.5 bg-white/90 backdrop-blur rounded-full text-black shadow-lg hover:bg-[#0217ff] hover:text-white transition-all"
          title="Editar"
        >
          <Edit3 size={16} />
        </button>
        <button 
          onClick={() => onDelete(property.id)}
          className="p-2.5 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all"
          title="Excluir"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* IMAGE */}
      <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {property.images?.[0] ? (
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={32} className="text-zinc-400" />
          </div>
        )}

        {/* STATUS BADGE */}
        <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-[8px] font-bold uppercase ${status.bg} ${status.color}`}>
          {status.label}
        </div>

        {/* TYPE BADGE */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[8px] font-bold uppercase ${type.bg} ${type.color}`}>
          {type.label}
        </div>

        {/* FEATURED BADGE */}
        {property.featured && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-[#0217ff] text-white text-[8px] font-bold uppercase flex items-center gap-1">
            <Star size={10} /> Destaque
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className={`font-bold truncate text-base w-3/5 ${theme.text}`} title={property.title}>
            {property.title}
          </h3>
          <span className="text-sm font-black text-[#0217ff]">
            {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              maximumFractionDigits: 0 
            }).format(property.price)}
          </span>
        </div>

        <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
          <MapPin size={10} className="text-[#0217ff]" /> 
          {property.location || 'Localização não informada'}
        </p>

        <div className="flex flex-wrap gap-4 py-3 border-y border-zinc-100 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
            <Square size={14}/> {property.area}m²
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
            <Bed size={14}/> {property.bedrooms}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
            <Bath size={14}/> {property.bathrooms}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
            <Car size={14}/> {property.parking_spaces}
          </div>
        </div>

        {/* AMENITIES PREVIEW */}
        {Object.entries(property).some(([key, value]) => 
          key.startsWith('has_') && value === true
        ) && (
          <div className="flex flex-wrap gap-2">
            {AMENITIES.slice(0, 3).map(({ id, label, icon: Icon }) => 
              property[id] && (
                <div key={id} className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg" title={label}>
                  <Icon size={12} className="text-zinc-500" />
                </div>
              )
            )}
            {Object.values(property).filter(v => v === true).length > 3 && (
              <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg text-[8px] font-bold text-zinc-500">
                +{Object.values(property).filter(v => v === true).length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyListItem({ property, onView, onEdit, onDelete, theme }: any) {
  const status = PROPERTY_STATUS[property.status as keyof typeof PROPERTY_STATUS] || PROPERTY_STATUS.disponivel;

  return (
    <div className={`${theme.card} rounded-[24px] border p-4 hover:shadow-md transition-all`}>
      <div className="flex items-center gap-4">
        {/* IMAGE */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
          {property.images?.[0] ? (
            <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera size={24} className="text-zinc-400" />
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold truncate ${theme.text}`}>{property.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>

          <p className="text-[9px] text-zinc-500 font-bold uppercase mb-2 flex items-center gap-1">
            <MapPin size={9} /> {property.location || 'Localização não informada'}
          </p>

          <div className="flex flex-wrap gap-4 text-[9px] font-bold text-zinc-500">
            <span className="flex items-center gap-1"><Square size={10}/> {property.area}m²</span>
            <span className="flex items-center gap-1"><Bed size={10}/> {property.bedrooms} quartos</span>
            <span className="flex items-center gap-1"><Bath size={10}/> {property.bathrooms} banheiros</span>
            <span className="flex items-center gap-1"><Car size={10}/> {property.parking_spaces} vagas</span>
          </div>

          <div className="mt-2">
            <span className="text-sm font-black text-[#0217ff]">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                maximumFractionDigits: 0 
              }).format(property.price)}
            </span>
            {property.condo_fee > 0 && (
              <span className="text-[8px] text-zinc-400 ml-2">
                + cond. {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.condo_fee)}
              </span>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
          <button onClick={() => onView(property)} className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-[#0217ff] hover:text-white transition-all">
            <Eye size={16} />
          </button>
          <button onClick={() => onEdit(property)} className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-[#0217ff] hover:text-white transition-all">
            <Edit3 size={16} />
          </button>
          <button onClick={() => onDelete(property.id)} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyDetailModal({ property, onClose, onEdit, theme }: any) {
  const status = PROPERTY_STATUS[property.status as keyof typeof PROPERTY_STATUS] || PROPERTY_STATUS.disponivel;
  const type = PROPERTY_TYPES[property.type as keyof typeof PROPERTY_TYPES] || PROPERTY_TYPES.venda;

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
      <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
          <h2 className={`text-lg font-bold ${theme.text}`}>Detalhes do Imóvel</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-red-500">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {/* IMAGE GALLERY */}
          {property.images && property.images.length > 0 && (
            <div className="mb-8">
              <div className="aspect-video rounded-[32px] overflow-hidden mb-4">
                <img 
                  src={property.images[0]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {property.images.slice(1, 5).map((img: string, i: number) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TITLE AND STATUS */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className={`text-2xl font-bold ${theme.text}`}>{property.title}</h3>
              <p className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                <MapPin size={14} /> {property.location}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${status.bg} ${status.color}`}>
                {status.label}
              </span>
              <p className="text-2xl font-black text-[#0217ff] mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
              </p>
            </div>
          </div>

          {/* SPECS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SpecItem icon={Square} label="Área" value={`${property.area} m²`} />
            <SpecItem icon={Bed} label="Quartos" value={property.bedrooms} />
            <SpecItem icon={Bath} label="Banheiros" value={property.bathrooms} />
            <SpecItem icon={Car} label="Vagas" value={property.parking_spaces} />
          </div>

          {/* DESCRIPTION */}
          {property.description && (
            <div className="mb-8">
              <h4 className="text-[10px] font-bold uppercase text-[#0217ff] mb-2">Descrição</h4>
              <p className={`text-sm ${theme.secondaryText}`}>{property.description}</p>
            </div>
          )}

          {/* AMENITIES */}
          {AMENITIES.some(a => property[a.id]) && (
            <div className="mb-8">
              <h4 className="text-[10px] font-bold uppercase text-[#0217ff] mb-4">Comodidades</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AMENITIES.map(({ id, label, icon: Icon }) => 
                  property[id] && (
                    <div key={id} className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-white/5">
                      <Icon size={14} className="text-[#0217ff]" />
                      <span className="text-[10px] font-bold">{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-4 pt-6 border-t border-zinc-100 dark:border-white/5">
            <button
              onClick={onEdit}
              className="flex-1 py-4 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#0217ff]/90 transition-all"
            >
              Editar Imóvel
            </button>
            <button className="flex-1 py-4 bg-zinc-100 dark:bg-white/5 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-200 dark:hover:bg-white/10 transition-all">
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecItem({ icon: Icon, label, value }: any) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 text-center">
      <Icon size={20} className="mx-auto mb-2 text-[#0217ff]" />
      <p className="text-[8px] font-bold uppercase text-zinc-400">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function ValuationModal({ baseArea, setBaseArea, comparables, setComparables, onClose, calculateValuation, theme }: any) {
  const addComparable = () => {
    if (comparables.length < 10) {
      setComparables([...comparables, { price: '', area: '' }]);
    }
  };

  const valuation = calculateValuation();

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
      <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col shadow-2xl animate-in zoom-in-95`}>
        
        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calculator className="text-[#0217ff]" size={20} />
            <h2 className={`text-lg font-bold ${theme.text}`}>Método Comparativo de Dados de Mercado</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar pb-32">
          
          {/* DISCLAIMER */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 items-start">
            <AlertTriangle className="text-amber-500 shrink-0" size={18} />
            <div>
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">
                Ferramenta de Apoio
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Os dados abaixo são estimativas baseadas em informações inseridas. A validação final 
                e conferência técnica é de inteira responsabilidade do corretor.
              </p>
            </div>
          </div>

          {/* BASE PROPERTY */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest ml-2 flex items-center gap-2">
              <Home size={14} /> 1. Área do Imóvel Avaliado
            </label>
            <div className="relative">
              <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                className={`w-full ${theme.input} pl-12 pr-4 py-4 rounded-2xl outline-none font-bold`} 
                placeholder="Ex: 120 (m²)" 
                value={baseArea}
                onChange={(e) => setBaseArea(e.target.value)}
              />
            </div>
          </div>

          {/* COMPARABLES */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest ml-2 flex items-center gap-2">
                <TrendingUp size={14} /> 2. Imóveis Comparados ({comparables.length}/10)
              </label>
              {comparables.length < 10 && (
                <button 
                  onClick={addComparable} 
                  className="px-3 py-1.5 bg-[#0217ff]/10 text-[#0217ff] rounded-lg hover:bg-[#0217ff] hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold"
                >
                  <Plus size={12} /> Adicionar
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {comparables.map((comp: any, idx: number) => (
                <ComparableRow
                  key={idx}
                  index={idx}
                  comp={comp}
                  comparables={comparables}
                  setComparables={setComparables}
                  theme={theme}
                />
              ))}
            </div>
          </div>

          {/* RESULT */}
          {valuation.avgM2 > 0 && (
            <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#0217ff] to-[#0217ff]/80 text-white space-y-6 shadow-2xl shadow-[#0217ff]/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.2em] mb-1">Média do m² na Região</p>
                  <p className="text-3xl font-black italic tracking-tighter">
                    R$ {valuation.avgM2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp size={24} className="opacity-40" />
              </div>
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.2em] mb-1">Avaliação Sugerida</p>
                <p className="text-5xl font-black italic tracking-tighter">
                  R$ {valuation.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-zinc-100 dark:bg-white/5 rounded-2xl font-bold uppercase text-[10px] hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                // TODO: Salvar avaliação
                onClose();
              }}
              className="flex-1 py-4 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#0217ff]/90 transition-all shadow-xl"
            >
              Salvar Avaliação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparableRow({ index, comp, comparables, setComparables, theme }: any) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 relative group">
      <div className="space-y-1">
        <label className="text-[8px] font-bold text-zinc-400 uppercase flex items-center gap-1">
          <DollarSign size={8} /> Preço Venda
        </label>
        <input 
          className={`w-full ${theme.input} px-4 py-2 rounded-xl text-xs outline-none`} 
          placeholder="R$ 0,00"
          value={comp.price}
          onChange={(e) => {
            const newComps = [...comparables];
            newComps[index].price = e.target.value;
            setComparables(newComps);
          }}
        />
      </div>
      <div className="space-y-1">
        <label className="text-[8px] font-bold text-zinc-400 uppercase flex items-center gap-1">
          <Ruler size={8} /> Área (m²)
        </label>
        <input 
          className={`w-full ${theme.input} px-4 py-2 rounded-xl text-xs outline-none`} 
          placeholder="m²"
          value={comp.area}
          onChange={(e) => {
            const newComps = [...comparables];
            newComps[index].area = e.target.value;
            setComparables(newComps);
          }}
        />
      </div>
      {comparables.length > 1 && (
        <button 
          onClick={() => setComparables(comparables.filter((_: any, i: number) => i !== index))}
          className="absolute -right-2 -top-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

function PropertyFormModal({
  formData,
  setFormData,
  editingId,
  isViewOnly,
  loading,
  uploading,
  onClose,
  onSubmit,
  onImageUpload,
  onRemoveImage,
  onSetCover,
  onCEPBlur,
  theme,
  properties
}: any) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col`}>
        
        {/* HEADER */}
        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-inherit">
          <div className="flex items-center gap-3">
            {editingId ? (
              <Edit3 size={20} className="text-[#0217ff]" />
            ) : (
              <Plus size={20} className="text-[#0217ff]" />
            )}
            <h2 className={`text-lg font-bold ${theme.text}`}>
              {isViewOnly ? 'Visualizar Imóvel' : editingId ? 'Editar Imóvel' : 'Novo Imóvel'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          <form onSubmit={onSubmit} className="space-y-8">
            
            {/* IMAGES UPLOAD */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest flex items-center gap-2">
                <Camera size={14} /> Fotos do Imóvel
              </label>
              
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {formData.images?.map((url: string, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {!isViewOnly && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSetCover(idx)}
                          className="p-1 bg-white rounded-full text-black hover:bg-[#0217ff] hover:text-white transition-all"
                          title="Definir como capa"
                        >
                          <Star size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveImage(idx)}
                          className="p-1 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          title="Remover"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    {idx === 0 && (
                      <div className="absolute top-1 left-1 px-1 py-0.5 bg-[#0217ff] text-white text-[6px] font-bold rounded">
                        CAPA
                      </div>
                    )}
                  </div>
                ))}
                
                {!isViewOnly && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff] transition-colors">
                    {uploading ? (
                      <Loader2 className="animate-spin text-[#0217ff]" size={20} />
                    ) : (
                      <>
                        <PlusCircle size={20} className="text-zinc-400 mb-1" />
                        <span className="text-[8px] font-bold text-zinc-400">Adicionar</span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={onImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* BASIC INFO */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Título do Imóvel</label>
                  <input 
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none font-bold`}
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Apartamento com Vista para o Mar"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Tipo</label>
                  <select
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none`}
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="venda">Venda</option>
                    <option value="locacao">Locação</option>
                    <option value="venda_locacao">Venda ou Locação</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Status</label>
                  <select
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none`}
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="negociacao">Em Negociação</option>
                    <option value="vendido">Vendido</option>
                    <option value="locado">Locado</option>
                    <option value="indisponivel">Indisponível</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PRICES */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Valores</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Preço de Venda (R$)</label>
                  <input 
                    disabled={isViewOnly}
                    type="number"
                    step="0.01"
                    className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none font-bold text-[#0217ff]`}
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Condomínio (R$)</label>
                  <input 
                    disabled={isViewOnly}
                    type="number"
                    step="0.01"
                    className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none`}
                    value={formData.condo_fee}
                    onChange={e => setFormData({...formData, condo_fee: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            {/* SPECS */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Características</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Área (m²)</label>
                  <input 
                    disabled={isViewOnly}
                    type="number"
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`}
                    value={formData.area}
                    onChange={e => setFormData({...formData, area: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Quartos</label>
                  <input 
                    disabled={isViewOnly}
                    type="number"
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`}
                    value={formData.bedrooms}
                    onChange={e => setFormData({...formData, bedrooms: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Suítes</label>
                  <input 
                    disabled={isViewOnly}
                    type="number"
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`}
                    value={formData.suites}
                    onChange={e => setFormData({...formData, suites: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Banheiros</label>
                  <input 
                    disabled={isViewOnly}
                    type="number"
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`}
                    value={formData.bathrooms}
                    onChange={e => setFormData({...formData, bathrooms: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Vagas</label>
                  <input 
                    disabled={isViewOnly}
                    type="number"
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`}
                    value={formData.parking_spaces}
                    onChange={e => setFormData({...formData, parking_spaces: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            {/* ADDRESS */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Endereço</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">CEP</label>
                  <input 
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl`}
                    value={formData.cep}
                    onChange={e => setFormData({...formData, cep: e.target.value})}
                    onBlur={onCEPBlur}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Logradouro</label>
                  <input 
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl`}
                    value={formData.street}
                    onChange={e => setFormData({...formData, street: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Número</label>
                  <input 
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl`}
                    value={formData.number}
                    onChange={e => setFormData({...formData, number: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Bairro</label>
                  <input 
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl`}
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">Cidade</label>
                  <input 
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl`}
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-zinc-400">UF</label>
                  <input 
                    disabled={isViewOnly}
                    className={`w-full ${theme.input} px-4 py-3 rounded-xl`}
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* AMENITIES */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Comodidades</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AMENITIES.map(({ id, label, icon: Icon }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                      ${!isViewOnly && 'hover:bg-zinc-100 dark:hover:bg-white/5'}
                      ${formData[id] 
                        ? 'bg-[#0217ff]/10 border border-[#0217ff]/20' 
                        : theme.input}`}
                  >
                    <input
                      type="checkbox"
                      disabled={isViewOnly}
                      checked={formData[id] || false}
                      onChange={(e) => setFormData({...formData, [id]: e.target.checked})}
                      className="hidden"
                    />
                    <Icon size={16} className={formData[id] ? 'text-[#0217ff]' : 'text-zinc-400'} />
                    <span className={`text-[10px] font-bold ${formData[id] ? 'text-[#0217ff]' : theme.secondaryText}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Descrição</h3>
              
              <textarea
                disabled={isViewOnly}
                className={`w-full ${theme.input} px-5 py-4 rounded-xl outline-none min-h-[120px]`}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva os detalhes do imóvel..."
              />
            </div>

            {/* FEATURED */}
            {!isViewOnly && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-white/5">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured || false}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  className="w-4 h-4 rounded border-zinc-300 text-[#0217ff] focus:ring-[#0217ff]"
                />
                <label htmlFor="featured" className="text-[10px] font-bold uppercase text-zinc-500">
                  Destacar imóvel (aparecerá em primeiro lugar nas buscas)
                </label>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            {!isViewOnly && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-[#0217ff]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} />
                    {editingId ? 'Atualizar Imóvel' : 'Cadastrar Imóvel'}
                  </>
                )}
              </button>
            )}

            {/* VIEW ONLY CLOSE BUTTON */}
            {isViewOnly && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-5 bg-zinc-100 dark:bg-white/5 rounded-2xl font-bold uppercase text-xs hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
              >
                Fechar
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}