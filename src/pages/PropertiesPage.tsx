import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  X, Loader2, Check, Globe, Star, Square, 
  Car, ShieldCheck, Info, ChevronLeft, ChevronRight,
  Calculator, AlertTriangle, TrendingUp, Camera,
  Wifi, Zap, Flame, Coffee, Dumbbell, Waves,
  Trees, Building2, Ruler, Tag, Copy, Share2,
  Download, Filter, Grid3X3, List, Maximize2,
  DollarSign, Percent, Hash, Clock, Award,
  ArrowLeft, Save, PlusCircle, MinusCircle, Search,
  Heart, TrendingDown, BarChart3, PieChart, ExternalLink,
  Link2, MessageCircle, Phone, Mail, UserCheck,
  CalendarDays, AreaChart, Layers, Compass, Navigation
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

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
  full_address?: string;
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
  latitude?: number;
  longitude?: number;
}

interface PropertyFormData extends Omit<Property, 'id' | 'created_at' | 'views'> {
  id?: string;
}

// CONSTANTES
const PROPERTY_TYPES = {
  venda: { label: 'Venda', color: 'text-green-500', bg: 'bg-green-500/10', icon: DollarSign },
  locacao: { label: 'Locação', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: CalendarDays },
  venda_locacao: { label: 'Venda/Locação', color: 'text-[#0217ff]', bg: 'bg-[#0217ff]/10', icon: ArrowLeft }
};

const PROPERTY_STATUS = {
  disponivel: { label: 'Disponível', color: 'text-green-500', bg: 'bg-green-500/10', icon: Check },
  negociacao: { label: 'Em Negociação', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Clock },
  vendido: { label: 'Vendido', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: TrendingUp },
  locado: { label: 'Locado', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Home },
  indisponivel: { label: 'Indisponível', color: 'text-zinc-500', bg: 'bg-zinc-500/10', icon: X }
};

const AMENITIES = [
  { id: 'has_pool', label: 'Piscina', icon: Waves, category: 'Lazer' },
  { id: 'has_gym', label: 'Academia', icon: Dumbbell, category: 'Esporte' },
  { id: 'has_bbq', label: 'Churrasqueira', icon: Flame, category: 'Gourmet' },
  { id: 'has_elevator', label: 'Elevador', icon: Building2, category: 'Infraestrutura' },
  { id: 'has_games', label: 'Salão de Jogos', icon: Grid3X3, category: 'Lazer' },
  { id: 'has_party', label: 'Salão de Festas', icon: Coffee, category: 'Social' },
  { id: 'has_spa', label: 'Spa', icon: Waves, category: 'Bem-estar' },
  { id: 'has_playground', label: 'Playground', icon: Trees, category: 'Infantil' },
  { id: 'has_court', label: 'Quadra Esportiva', icon: Ruler, category: 'Esporte' },
  { id: 'has_gourmet', label: 'Espaço Gourmet', icon: Flame, category: 'Gourmet' },
  { id: 'has_conciege', label: 'Portaria 24h', icon: ShieldCheck, category: 'Segurança' },
  { id: 'has_laundry', label: 'Lavanderia', icon: Zap, category: 'Serviços' }
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
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterType, setFilterType] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc'>('recent');
  const [showFilters, setShowFilters] = useState(false);

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
    cep: '', street: '', number: '', neighborhood: '', city: '', state: '', location: '', full_address: '',
    has_elevator: false, has_bbq: false, has_pool: false, has_gym: false,
    has_games: false, has_party: false, has_spa: false, has_playground: false,
    has_court: false, has_gourmet: false, has_conciege: false, has_laundry: false,
    featured: false, latitude: undefined, longitude: undefined
  };

  const [formData, setFormData] = useState<PropertyFormData>(initialForm);

  useEffect(() => { 
    if (user) loadProperties(); 
  }, [user]);

  async function loadProperties() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
    } finally {
      setLoading(false);
    }
  }

  // FILTROS E ORDENAÇÃO
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = [...properties];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(term) ||
        p.location?.toLowerCase().includes(term) ||
        p.neighborhood?.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    if (filterType !== 'todos') {
      filtered = filtered.filter(p => p.type === filterType);
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return (a.price || 0) - (b.price || 0);
        case 'price_desc': return (b.price || 0) - (a.price || 0);
        case 'area_asc': return (a.area || 0) - (b.area || 0);
        case 'area_desc': return (b.area || 0) - (a.area || 0);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return filtered;
  }, [properties, searchTerm, filterStatus, filterType, sortBy]);

  // ESTATÍSTICAS
  const stats = useMemo(() => {
    const total = properties.length;
    const disponivel = properties.filter(p => p.status === 'disponivel').length;
    const negociacao = properties.filter(p => p.status === 'negociacao').length;
    const vendido = properties.filter(p => p.status === 'vendido').length;
    const locado = properties.filter(p => p.status === 'locado').length;
    const valorTotal = properties.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
    return { total, disponivel, negociacao, vendido, locado, valorTotal };
  }, [properties]);

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (!value || isNaN(value)) return 'R$ 0';
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value);
  };

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

  const handleCEPBlur = async () => {
    const cep = formData.cep?.replace(/\D/g, '');
    if (cep?.length !== 8) return;
    
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const enderecoCompleto = `${data.logradouro}${data.logradouro ? ', ' : ''}${data.bairro}, ${data.localidade} - ${data.uf}`;
        setFormData(prev => ({
          ...prev, 
          street: data.logradouro, 
          neighborhood: data.bairro, 
          city: data.localidade, 
          state: data.uf,
          location: `${data.bairro}, ${data.localidade} - ${data.uf}`,
          full_address: enderecoCompleto
        }));
        alert(`Endereço encontrado: ${enderecoCompleto}`);
      } else {
        alert('CEP não encontrado');
      }
    } catch (e) { 
      console.error(e);
      alert('Erro ao buscar CEP');
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    
    setLoading(true);
    
    const payload = {
      ...formData,
      user_id: user?.id,
      price: Number(formData.price) || 0,
      condo_fee: Number(formData.condo_fee) || 0,
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      suites: Number(formData.suites) || 0,
      area: Number(formData.area) || 0,
      parking_spaces: Number(formData.parking_spaces) || 0
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

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
      await supabase.from('properties').delete().eq('id', id);
      loadProperties();
    }
  };

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
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0217ff] to-[#00c6ff] rounded-xl flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <h1 className={`text-3xl font-black ${theme.text}`}>Imóveis</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {stats.total} imóveis cadastrados • {formatCompactCurrency(stats.valorTotal)} em VGV
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* 🔥 VIEW MODE TOGGLE - CORRIGIDO */}
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/5">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#0217ff] text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
            >
              <Grid3X3 size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#0217ff] text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
            >
              <List size={18} />
            </button>
          </div>

          <button onClick={() => setShowValuationModal(true)} className="px-4 py-2 bg-zinc-100 dark:bg-white/5 text-[#0217ff] rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-[#0217ff]/20 hover:bg-[#0217ff] hover:text-white transition-all">
            <Calculator size={14} /> Avaliação
          </button>

          <button onClick={() => { setEditingId(null); setFormData(initialForm); setIsViewOnly(false); setShowModal(true); }} className="px-6 py-2.5 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
            <Plus size={16} /> Novo Imóvel
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Total</p>
          <p className={`text-2xl font-black ${theme.text}`}>{stats.total}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Disponíveis</p>
          <p className="text-2xl font-black text-green-500">{stats.disponivel}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Negociação</p>
          <p className="text-2xl font-black text-orange-500">{stats.negociacao}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Vendidos</p>
          <p className="text-2xl font-black text-blue-500">{stats.vendido}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Locados</p>
          <p className="text-2xl font-black text-purple-500">{stats.locado}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">VGV Total</p>
          <p className={`text-lg font-black text-[#0217ff] truncate`}>{formatCompactCurrency(stats.valorTotal)}</p>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input type="text" placeholder="Buscar por título, bairro, cidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 pr-4 py-2.5 rounded-xl text-sm ${theme.input} w-full`} />
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${showFilters ? 'bg-[#0217ff] text-white border-[#0217ff]' : `${theme.card} ${theme.text}`}`}>
            <Filter size={14} /> Filtros
          </button>
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${theme.input}`}>
            <option value="recent">Mais Recentes</option>
            <option value="price_asc">Menor Preço</option>
            <option value="price_desc">Maior Preço</option>
            <option value="area_asc">Menor Área</option>
            <option value="area_desc">Maior Área</option>
          </select>
        </div>
      </div>

      {/* EXPANDED FILTERS */}
      {showFilters && (
        <div className={`p-5 rounded-2xl border ${theme.border} ${theme.card} animate-fade-in`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-400 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterStatus('todos')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all ${filterStatus === 'todos' ? 'bg-[#0217ff] text-white' : `${theme.card} ${theme.text}`}`}>Todos</button>
                {Object.entries(PROPERTY_STATUS).map(([key, status]) => (
                  <button key={key} onClick={() => setFilterStatus(key)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all ${filterStatus === key ? 'bg-[#0217ff] text-white' : `${theme.card} ${theme.text}`}`}>{status.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-400 mb-2 block">Tipo de Negócio</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterType('todos')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all ${filterType === 'todos' ? 'bg-[#0217ff] text-white' : `${theme.card} ${theme.text}`}`}>Todos</button>
                {Object.entries(PROPERTY_TYPES).map(([key, type]) => (
                  <button key={key} onClick={() => setFilterType(key)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all ${filterType === key ? 'bg-[#0217ff] text-white' : `${theme.card} ${theme.text}`}`}>{type.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROPERTIES GRID/LIST */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0217ff]" size={40} /></div>
      ) : filteredAndSortedProperties.length === 0 ? (
        <div className={`${theme.card} rounded-[32px] border p-12 text-center`}>
          <Home size={48} className="mx-auto mb-4 text-zinc-300" />
          <p className={`${theme.text} font-bold`}>{searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">{searchTerm ? 'Tente outros termos de busca' : 'Clique em "Novo Imóvel" para começar'}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProperties.map((property) => {
            const status = PROPERTY_STATUS[property.status as keyof typeof PROPERTY_STATUS] || PROPERTY_STATUS.disponivel;
            const type = PROPERTY_TYPES[property.type as keyof typeof PROPERTY_TYPES] || PROPERTY_TYPES.venda;
            const amenitiesCount = AMENITIES.filter(a => property[a.id as keyof Property]).length;
            return (
              <div key={property.id} className={`${theme.card} rounded-2xl border overflow-hidden relative group hover:shadow-xl transition-all`}>
                <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setSelectedProperty(property); setShowDetailModal(true); }} className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-[#0217ff] hover:text-white transition-all"><Eye size={14} /></button>
                  <button onClick={() => { setEditingId(property.id); setFormData(property); setIsViewOnly(false); setShowModal(true); }} className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-[#0217ff] hover:text-white transition-all"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(property.id)} className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                </div>
                <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {property.images?.[0] ? <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Camera size={32} className="text-zinc-400" /></div>}
                  <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-[8px] font-bold uppercase ${status.bg} ${status.color}`}>{status.label}</div>
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[8px] font-bold uppercase ${type.bg} ${type.color}`}>{type.label}</div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start"><h3 className={`font-bold truncate text-base w-3/5 ${theme.text}`}>{property.title}</h3><span className="text-sm font-black text-[#0217ff]">{formatCurrency(property.price)}</span></div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><MapPin size={10} className="text-[#0217ff]" /> {property.location || 'Localização não informada'}</p>
                  <div className="flex flex-wrap gap-3 py-2 border-y border-zinc-100 dark:border-white/5">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-500"><Square size={12}/> {property.area}m²</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-500"><Bed size={12}/> {property.bedrooms}</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-500"><Bath size={12}/> {property.bathrooms}</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-500"><Car size={12}/> {property.parking_spaces}</span>
                  </div>
                  {/* 🔥 AMENITIES PREVIEW - PARA APARECER NO SITE PÚBLICO */}
                  {amenitiesCount > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {AMENITIES.filter(a => property[a.id as keyof Property]).slice(0, 4).map((amenity) => {
                        const Icon = amenity.icon;
                        return (
                          <div key={amenity.id} className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg" title={amenity.label}>
                            <Icon size={10} className="text-zinc-500" />
                          </div>
                        );
                      })}
                      {amenitiesCount > 4 && (
                        <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg text-[8px] font-bold text-zinc-500">
                          +{amenitiesCount - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedProperties.map((property) => {
            const status = PROPERTY_STATUS[property.status as keyof typeof PROPERTY_STATUS] || PROPERTY_STATUS.disponivel;
            const amenitiesCount = AMENITIES.filter(a => property[a.id as keyof Property]).length;
            return (
              <div key={property.id} className={`${theme.card} rounded-2xl border p-4 hover:shadow-md transition-all`}>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">{property.images?.[0] ? <img src={property.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Camera size={20} className="text-zinc-400" /></div>}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><h3 className={`font-bold truncate ${theme.text}`}>{property.title}</h3><span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${status.bg} ${status.color}`}>{status.label}</span></div>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase mb-2 flex items-center gap-1"><MapPin size={9} /> {property.location || 'Localização não informada'}</p>
                    <div className="flex flex-wrap gap-3 text-[9px] font-bold text-zinc-500">
                      <span className="flex items-center gap-1"><Square size={10}/> {property.area}m²</span>
                      <span className="flex items-center gap-1"><Bed size={10}/> {property.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath size={10}/> {property.bathrooms}</span>
                      <span className="flex items-center gap-1"><Car size={10}/> {property.parking_spaces}</span>
                    </div>
                    {/* 🔥 AMENITIES PREVIEW NA LISTA */}
                    {amenitiesCount > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {AMENITIES.filter(a => property[a.id as keyof Property]).slice(0, 4).map((amenity) => {
                          const Icon = amenity.icon;
                          return (
                            <div key={amenity.id} className="p-1 bg-zinc-100 dark:bg-white/5 rounded-lg" title={amenity.label}>
                              <Icon size={8} className="text-zinc-500" />
                            </div>
                          );
                        })}
                        {amenitiesCount > 4 && (
                          <div className="p-1 bg-zinc-100 dark:bg-white/5 rounded-lg text-[7px] font-bold text-zinc-500">
                            +{amenitiesCount - 4}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-2"><span className="text-sm font-black text-[#0217ff]">{formatCurrency(property.price)}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedProperty(property); setShowDetailModal(true); }} className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-[#0217ff] hover:text-white transition-all"><Eye size={16} /></button>
                    <button onClick={() => { setEditingId(property.id); setFormData(property); setIsViewOnly(false); setShowModal(true); }} className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-[#0217ff] hover:text-white transition-all"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(property.id)} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VALUATION MODAL */}
      {showValuationModal && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col shadow-2xl`}>
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center"><div className="flex items-center gap-3"><Calculator className="text-[#0217ff]" size={20} /><h2 className={`text-lg font-bold ${theme.text}`}>Avaliação Comparativa</h2></div><button onClick={() => setShowValuationModal(false)} className="p-2 text-zinc-500 hover:text-red-500"><X size={28} /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3"><AlertTriangle className="text-amber-500 shrink-0" size={18} /><div><p className="text-[9px] font-black text-amber-600 uppercase">Ferramenta de Apoio</p><p className="text-[10px] text-amber-700">Estimativa baseada em informações inseridas. A validação final é responsabilidade do corretor.</p></div></div>
              <div><label className="text-[10px] font-bold uppercase text-[#0217ff] mb-2 block">Área do Imóvel (m²)</label><input className={`w-full ${theme.input} px-4 py-3 rounded-xl`} placeholder="Ex: 120" value={baseArea} onChange={(e) => setBaseArea(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold uppercase text-[#0217ff] mb-2 block">Imóveis Comparáveis</label>
                {comparables.map((comp, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-3 mb-3"><input className={`${theme.input} px-4 py-2 rounded-xl text-sm`} placeholder="Preço" value={comp.price} onChange={(e) => { const newComps = [...comparables]; newComps[idx].price = e.target.value; setComparables(newComps); }} /><input className={`${theme.input} px-4 py-2 rounded-xl text-sm`} placeholder="Área m²" value={comp.area} onChange={(e) => { const newComps = [...comparables]; newComps[idx].area = e.target.value; setComparables(newComps); }} /></div>
                ))}
                <button onClick={() => setComparables([...comparables, { price: '', area: '' }])} className="text-[10px] font-bold text-[#0217ff] flex items-center gap-1"><PlusCircle size={12} /> Adicionar comparável</button>
              </div>
              {(() => { const val = calculateValuation(); return val.avgM2 > 0 && (<div className="p-6 rounded-2xl bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white"><p className="text-[10px] font-bold uppercase opacity-80">Valor médio por m²</p><p className="text-3xl font-black">R$ {val.avgM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-[10px] font-bold uppercase opacity-80 mt-4">Avaliação Sugerida</p><p className="text-4xl font-black">R$ {val.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>); })()}
            </div>
            <div className="p-6 border-t border-zinc-100 dark:border-white/5 flex gap-4"><button onClick={() => setShowValuationModal(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-white/5 rounded-xl font-bold text-[10px] uppercase">Fechar</button><button className="flex-1 py-3 bg-[#0217ff] text-white rounded-xl font-bold text-[10px] uppercase">Salvar Avaliação</button></div>
          </div>
        </div>
      )}

      {/* PROPERTY FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col`}>
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center"><div className="flex items-center gap-3">{editingId ? <Edit3 size={20} className="text-[#0217ff]" /> : <Plus size={20} className="text-[#0217ff]" />}<h2 className={`text-lg font-bold ${theme.text}`}>{isViewOnly ? 'Visualizar Imóvel' : editingId ? 'Editar Imóvel' : 'Novo Imóvel'}</h2></div><button onClick={() => { setShowModal(false); setEditingId(null); }} className="p-2 text-zinc-500 hover:text-red-500"><X size={28} /></button></div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10"><form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3"><label className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff] transition-colors">{uploading ? <Loader2 className="animate-spin text-[#0217ff]" size={20} /> : <><PlusCircle size={20} className="text-zinc-400" /><span className="text-[8px] font-bold text-zinc-400">Fotos</span></>}<input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} /></label>{formData.images?.map((url, idx) => (<div key={idx} className="relative aspect-square rounded-xl overflow-hidden group"><img src={url} className="w-full h-full object-cover" /><button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Trash2 size={16} className="text-white" /></button></div>))}</div>
              <div><label className="text-[9px] font-bold uppercase text-zinc-400">Título</label><input disabled={isViewOnly} className={`w-full ${theme.input} px-4 py-3 rounded-xl`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[9px] font-bold uppercase text-zinc-400">Preço (R$)</label><input disabled={isViewOnly} type="number" className={`w-full ${theme.input} px-4 py-3 rounded-xl`} value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} /></div><div><label className="text-[9px] font-bold uppercase text-zinc-400">Condomínio</label><input disabled={isViewOnly} type="number" className={`w-full ${theme.input} px-4 py-3 rounded-xl`} value={formData.condo_fee} onChange={e => setFormData({...formData, condo_fee: parseFloat(e.target.value)})} /></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[9px] font-bold uppercase text-zinc-400">Tipo</label><select disabled={isViewOnly} className={`w-full ${theme.input} px-4 py-3 rounded-xl`} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="venda">Venda</option><option value="locacao">Locação</option><option value="venda_locacao">Venda/Locação</option></select></div><div><label className="text-[9px] font-bold uppercase text-zinc-400">Status</label><select disabled={isViewOnly} className={`w-full ${theme.input} px-4 py-3 rounded-xl`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="disponivel">Disponível</option><option value="negociacao">Em Negociação</option><option value="vendido">Vendido</option><option value="locado">Locado</option><option value="indisponivel">Indisponível</option></select></div></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><label className="text-[9px] font-bold uppercase text-zinc-400">Área (m²)</label><input disabled={isViewOnly} type="number" className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`} value={formData.area} onChange={e => setFormData({...formData, area: parseInt(e.target.value)})} /></div><div><label className="text-[9px] font-bold uppercase text-zinc-400">Quartos</label><input disabled={isViewOnly} type="number" className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`} value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: parseInt(e.target.value)})} /></div><div><label className="text-[9px] font-bold uppercase text-zinc-400">Banheiros</label><input disabled={isViewOnly} type="number" className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`} value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: parseInt(e.target.value)})} /></div><div><label className="text-[9px] font-bold uppercase text-zinc-400">Vagas</label><input disabled={isViewOnly} type="number" className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center`} value={formData.parking_spaces} onChange={e => setFormData({...formData, parking_spaces: parseInt(e.target.value)})} /></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-[9px] font-bold uppercase text-zinc-400">CEP</label><input disabled={isViewOnly} className={`w-full ${theme.input} px-4 py-3 rounded-xl`} value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCEPBlur} /></div>
                <div><label className="text-[9px] font-bold uppercase text-zinc-400">Número</label><input disabled={isViewOnly} className={`w-full ${theme.input} px-4 py-3 rounded-xl`} value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} /></div>
              </div>
              {/* 🔥 ENDEREÇO COMPLETO - PARA CONSULTA DO CORRETOR */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase text-zinc-400">Endereço Completo</label>
                <textarea 
                  disabled={isViewOnly}
                  rows={2}
                  className={`w-full ${theme.input} px-4 py-3 rounded-xl resize-none`}
                  value={formData.full_address || ''}
                  onChange={e => setFormData({...formData, full_address: e.target.value})}
                  placeholder="Endereço completo (preenchido automaticamente pelo CEP)"
                />
                <p className="text-[8px] text-zinc-400">Este endereço é visível apenas para o corretor</p>
              </div>
              <div><label className="text-[9px] font-bold uppercase text-zinc-400">Descrição</label><textarea disabled={isViewOnly} rows={3} className={`w-full ${theme.input} px-4 py-3 rounded-xl resize-none`} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva os detalhes do imóvel..." /></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3"><h3 className="col-span-full text-[10px] font-bold uppercase text-[#0217ff]">Comodidades</h3>{AMENITIES.map(({ id, label, icon: Icon }) => (<label key={id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer ${formData[id] ? 'bg-[#0217ff]/10 border border-[#0217ff]/20' : theme.input}`}><input type="checkbox" disabled={isViewOnly} checked={formData[id] || false} onChange={(e) => setFormData({...formData, [id]: e.target.checked})} className="hidden" /><Icon size={14} className={formData[id] ? 'text-[#0217ff]' : 'text-zinc-400'} /><span className={`text-[10px] font-bold ${formData[id] ? 'text-[#0217ff]' : theme.secondaryText}`}>{label}</span></label>))}</div>
              {!isViewOnly && <button type="submit" disabled={loading} className="w-full py-4 bg-[#0217ff] text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-[#0217ff]/90 transition-all flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {editingId ? 'Atualizar Imóvel' : 'Cadastrar Imóvel'}</>}</button>}
              {isViewOnly && <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="w-full py-4 bg-zinc-100 dark:bg-white/5 rounded-xl font-bold uppercase text-xs">Fechar</button>}
            </form></div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedProperty && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col`}>
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center"><h2 className={`text-lg font-bold ${theme.text}`}>Detalhes do Imóvel</h2><button onClick={() => setShowDetailModal(false)} className="p-2 text-zinc-500 hover:text-red-500"><X size={28} /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedProperty.images?.[0] && <img src={selectedProperty.images[0]} alt="" className="w-full h-64 object-cover rounded-2xl" />}
              <div><h3 className={`text-2xl font-bold ${theme.text}`}>{selectedProperty.title}</h3><p className="text-sm text-zinc-500 flex items-center gap-2 mt-1"><MapPin size={14} /> {selectedProperty.location}</p></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 text-center"><Ruler size={18} className="mx-auto mb-1 text-[#0217ff]" /><p className="text-[8px] font-bold uppercase text-zinc-400">Área</p><p className="font-bold">{selectedProperty.area} m²</p></div><div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 text-center"><Bed size={18} className="mx-auto mb-1 text-[#0217ff]" /><p className="text-[8px] font-bold uppercase text-zinc-400">Quartos</p><p className="font-bold">{selectedProperty.bedrooms}</p></div><div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 text-center"><Bath size={18} className="mx-auto mb-1 text-[#0217ff]" /><p className="text-[8px] font-bold uppercase text-zinc-400">Banheiros</p><p className="font-bold">{selectedProperty.bathrooms}</p></div><div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 text-center"><Car size={18} className="mx-auto mb-1 text-[#0217ff]" /><p className="text-[8px] font-bold uppercase text-zinc-400">Vagas</p><p className="font-bold">{selectedProperty.parking_spaces}</p></div></div>
              {/* 🔥 COMODIDADES NO DETAIL MODAL */}
              {AMENITIES.filter(a => selectedProperty[a.id as keyof Property]).length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-[#0217ff] mb-3">Comodidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.filter(a => selectedProperty[a.id as keyof Property]).map((amenity) => {
                      const Icon = amenity.icon;
                      return (
                        <div key={amenity.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-full">
                          <Icon size={12} className="text-[#0217ff]" />
                          <span className="text-[10px] font-medium">{amenity.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedProperty.description && <div><h4 className="text-[10px] font-bold uppercase text-[#0217ff] mb-2">Descrição</h4><p className={theme.secondaryText}>{selectedProperty.description}</p></div>}
              <div className="flex gap-4 pt-4"><button onClick={() => { setShowDetailModal(false); setEditingId(selectedProperty.id); setFormData(selectedProperty); setIsViewOnly(false); setShowModal(true); }} className="flex-1 py-3 bg-[#0217ff] text-white rounded-xl font-bold text-[10px] uppercase">Editar</button><button className="flex-1 py-3 bg-zinc-100 dark:bg-white/5 rounded-xl font-bold text-[10px] uppercase">Compartilhar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}