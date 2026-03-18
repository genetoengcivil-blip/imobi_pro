import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  X, Loader2, PlusCircle, Check, Globe, ChevronLeft, 
  ChevronRight, Square, Star, Share2, ShieldCheck, Tag
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function PropertiesPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const initialForm = {
    title: '', price: '', condo_fee: '', type: 'venda', status: 'disponivel',
    bedrooms: '', bathrooms: '', suites: '', area: '',
    description: '', images: [] as string[],
    cep: '', street: '', number: '', neighborhood: '', city: '', state: '', location: '',
    has_elevator: false, has_bbq: false, has_pool: false, has_gym: false,
    has_games: false, has_party: false, has_spa: false, has_playground: false,
    has_court: false, has_gourmet: false, has_conciege: false, has_laundry: false
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { if (user) loadProperties(); }, [user]);

  async function loadProperties() {
    const { data } = await supabase.from('properties').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setProperties(data || []);
  }

  const formatCurrency = (val: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

  const setAsCover = (idx: number) => {
    const newImages = [...formData.images];
    const [selected] = newImages.splice(idx, 1);
    newImages.unshift(selected); // Move para o início
    setFormData({ ...formData, images: newImages });
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`https://imobi-pro.com/v/${user?.id}/${id}`);
    alert("Link do imóvel copiado!");
  };

  const openModal = (p: any = null, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    setCurrentImgIdx(0);
    if (p) {
      setEditingId(p.id);
      setFormData({ ...p, price: p.price.toString(), condo_fee: p.condo_fee?.toString() || '' });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    setLoading(true);
    const payload = {
      ...formData,
      user_id: user?.id,
      price: parseFloat(String(formData.price).replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
      condo_fee: parseFloat(String(formData.condo_fee).replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      suites: parseInt(formData.suites) || 0,
      area: parseInt(formData.area) || 0,
      updated_at: new Date()
    };
    try {
      const { error } = editingId ? await supabase.from('properties').update(payload).eq('id', editingId) : await supabase.from('properties').insert([payload]);
      if (error) throw error;
      setShowModal(false);
      loadProperties();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const AMENITIES = [
    { id: 'has_pool', label: 'Piscina' }, { id: 'has_gym', label: 'Academia' }, { id: 'has_bbq', label: 'Churrasqueira' },
    { id: 'has_elevator', label: 'Elevador' }, { id: 'has_games', label: 'S. Jogos' }, { id: 'has_party', label: 'S. Festas' },
    { id: 'has_spa', label: 'Spa' }, { id: 'has_playground', label: 'Playground' }, { id: 'has_court', label: 'Quadra' },
    { id: 'has_gourmet', label: 'Gourmet' }, { id: 'has_conciege', label: 'Portaria 24h' }, { id: 'has_laundry', label: 'Lavanderia' }
  ];

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Portfólio</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Gestão de Ativos Públicos</p>
        </div>
        <button onClick={() => openModal()} className="px-6 py-3 bg-[#0217ff] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg">
          Novo Ativo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[32px] border overflow-hidden transition-all relative`}>
            <div className="aspect-video relative overflow-hidden group">
              <img src={p.images?.[0] || ''} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 px-3 py-1 bg-[#0217ff] text-white text-[9px] font-black uppercase rounded-lg shadow-lg">
                {p.status}
              </div>
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                 <button onClick={() => openModal(p, true)} className="p-2.5 bg-white/90 backdrop-blur rounded-full text-black shadow-xl"><Eye size={16} /></button>
                 <button onClick={() => openModal(p, false)} className="p-2.5 bg-white/90 backdrop-blur rounded-full text-black shadow-xl"><Edit3 size={16} /></button>
                 <button onClick={() => copyLink(p.id)} className="p-2.5 bg-white/90 backdrop-blur rounded-full text-[#0217ff] shadow-xl"><Share2 size={16} /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold truncate text-sm w-3/5 ${theme.text}`}>{p.title}</h3>
                <span className="text-sm font-black text-[#0217ff]">{formatCurrency(p.price)}</span>
              </div>
              
              <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><MapPin size={10}/> {p.location}</p>
              
              <div className="flex gap-3 py-3 border-y border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500"><Bed size={14}/> {p.bedrooms}</div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500"><Square size={12}/> {p.area}m²</div>
                {p.condo_fee > 0 && <div className="text-[10px] font-bold text-green-600 bg-green-500/5 px-2 py-0.5 rounded">Cond. {formatCurrency(p.condo_fee)}</div>}
              </div>

              {/* LISTA COMPLETA DE AMENITIES NO CARD */}
              <div className="flex flex-wrap gap-1.5">
                {AMENITIES.filter(a => p[a.id]).map(a => (
                  <span key={a.id} className="px-2 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-md text-[8px] font-bold text-zinc-400 uppercase border border-zinc-200/50 dark:border-white/5">
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] border-none shadow-2xl flex flex-col`}>
            
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center sticky top-0 bg-inherit z-10">
              <div className="flex items-center gap-3">
                <Tag className="text-[#0217ff]" size={20} />
                <h2 className={`text-lg font-bold ${theme.text}`}>{isViewOnly ? 'Detalhes do Ativo' : 'Edição de Imóvel'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar pb-32">
              
              {/* GALERIA COM SELEÇÃO DE CAPA */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Fotos do Imóvel (A primeira é a Capa)</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className={`aspect-square rounded-2xl overflow-hidden relative border-2 ${i === 0 ? 'border-[#0217ff]' : 'border-transparent'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                      {!isViewOnly && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <button type="button" onClick={() => setAsCover(i)} className={`p-1.5 rounded-full ${i === 0 ? 'bg-[#0217ff] text-white' : 'bg-white text-black'}`}><Star size={12} fill={i === 0 ? "white" : "none"} /></button>
                           <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="p-1.5 bg-red-500 text-white rounded-full"><X size={12}/></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {!isViewOnly && (
                    <label className={`aspect-square rounded-2xl border-2 border-dashed ${theme.input} flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff] transition-all`}>
                      <PlusCircle size={24} className="text-zinc-500" />
                      <input type="file" hidden multiple onChange={async (e) => {
                        if (!e.target.files) return;
                        setUploading(true);
                        const files = Array.from(e.target.files);
                        const urls = [...formData.images];
                        for (const file of files) {
                          const name = `${Math.random()}.${file.name.split('.').pop()}`;
                          const { data } = await supabase.storage.from('properties').upload(`${user?.id}/${name}`, file);
                          if (data) urls.push(supabase.storage.from('properties').getPublicUrl(`${user?.id}/${name}`).data.publicUrl);
                        }
                        setFormData({...formData, images: urls});
                        setUploading(false);
                      }} />
                    </label>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">Título do Anúncio</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3.5 rounded-2xl outline-none font-bold`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">Status do Imóvel</label>
                    <select disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3.5 rounded-2xl outline-none font-bold uppercase text-xs`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="disponivel">🟢 Disponível</option>
                      <option value="reservado">🟡 Reservado</option>
                      <option value="vendido">🔴 Vendido</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{label:'Venda R$', k:'price'}, {label:'Condomínio', k:'condo_fee'}, {label:'Área m²', k:'area'}, {label:'Quartos', k:'bedrooms'}].map(f => (
                    <div key={f.k} className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">{f.label}</label>
                      <input disabled={isViewOnly} className={`w-full ${theme.input} px-4 py-3.5 rounded-xl text-center font-bold text-sm`} value={(formData as any)[f.k]} onChange={e => setFormData({...formData, [f.k]: e.target.value})} />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase text-[#0217ff] tracking-[0.2em] ml-2">Itens do Condomínio & Lazer</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {AMENITIES.map(item => (
                      <button key={item.id} type="button" disabled={isViewOnly} onClick={() => setFormData({...formData, [item.id]: !(formData as any)[item.id]})}
                        className={`py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                          (formData as any)[item.id] ? 'border-[#0217ff] bg-[#0217ff] text-white shadow-lg shadow-[#0217ff]/20' : 'border-zinc-100 dark:border-white/5 text-zinc-500'
                        } ${isViewOnly && !(formData as any)[item.id] ? 'hidden' : ''}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!isViewOnly && (
                  <button disabled={loading || uploading} className="w-full py-5 bg-[#0217ff] text-white rounded-3xl font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar e Publicar'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}