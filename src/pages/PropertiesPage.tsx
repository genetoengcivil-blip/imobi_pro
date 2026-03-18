import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  X, Loader2, PlusCircle, Check, Globe, ChevronLeft, 
  ChevronRight, Square, Car, ShieldCheck
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
    title: '', price: '', condo_fee: '', type: 'venda',
    bedrooms: '', bathrooms: '', suites: '', area: '',
    description: '', images: [] as string[],
    cep: '', street: '', number: '', neighborhood: '', city: '', state: '', location: '',
    has_elevator: false, has_bbq: false, has_pool: false, has_gym: false,
    has_games: false, has_party: false, has_spa: false, has_playground: false,
    has_court: false, has_gourmet: false
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { if (user) loadProperties(); }, [user]);

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    setProperties(data || []);
  }

  const formatCurrency = (value: any) => {
    const num = parseFloat(String(value).replace(/\D/g, '')) / 100 || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num === 0 ? (parseFloat(value) || 0) : num);
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
      const { error } = editingId 
        ? await supabase.from('properties').update(payload).eq('id', editingId)
        : await supabase.from('properties').insert([payload]);

      if (error) throw error;
      setShowModal(false);
      loadProperties();
    } catch (err: any) { alert("Erro ao salvar: " + err.message); } finally { setLoading(false); }
  };

  const AMENITIES = [
    { id: 'has_pool', label: 'Piscina' }, { id: 'has_gym', label: 'Academia' },
    { id: 'has_bbq', label: 'Churrasqueira' }, { id: 'has_elevator', label: 'Elevador' },
    { id: 'has_games', label: 'Salão Jogos' }, { id: 'has_party', label: 'Salão Festas' },
    { id: 'has_spa', label: 'Spa/Sauna' }, { id: 'has_playground', label: 'Playground' },
    { id: 'has_court', label: 'Quadra' }, { id: 'has_gourmet', label: 'Varanda Gourmet' }
  ];

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-20 md:pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme.text}`}>Imóveis</h1>
          <p className="text-sm text-zinc-500">Gestão profissional do seu catálogo.</p>
        </div>
        <button onClick={() => openModal()} className="px-5 py-2.5 bg-[#0217ff] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#0217ff]/20">
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[32px] border overflow-hidden transition-all group`}>
            {/* FOTO E AÇÕES SEMPRE VISÍVEIS NO MOBILE */}
            <div className="aspect-video relative overflow-hidden">
              <img src={p.images?.[0] || ''} className="w-full h-full object-cover" />
              
              {/* Overlay visível apenas em telas grandes no hover, mas botões sempre acessíveis */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                 <button onClick={() => openModal(p, true)} className="p-3 bg-white/90 backdrop-blur shadow-lg text-black rounded-full hover:bg-white transition-all"><Eye size={18} /></button>
                 <button onClick={() => openModal(p, false)} className="p-3 bg-white/90 backdrop-blur shadow-lg text-black rounded-full hover:bg-white transition-all"><Edit3 size={18} /></button>
                 <button onClick={async () => { if(confirm('Apagar?')) { await supabase.from('properties').delete().eq('id', p.id); loadProperties(); } }} className="p-3 bg-red-500/90 backdrop-blur shadow-lg text-white rounded-full hover:bg-red-600 transition-all"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold truncate text-base ${theme.text}`}>{p.title}</h3>
                <span className="text-base font-black text-[#0217ff]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                </span>
              </div>
              
              <p className="text-[11px] text-zinc-500 font-bold uppercase flex items-center gap-1"><MapPin size={12} className="text-[#0217ff]"/> {p.location}</p>
              
              {/* EXIBE CARACTERÍSTICAS NO CARD */}
              <div className="flex flex-wrap gap-2 py-3 border-y border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 bg-zinc-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                  <Bed size={14}/> {p.bedrooms} Qts
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 bg-zinc-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                  <Square size={12}/> {p.area}m²
                </div>
                {p.condo_fee > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-500/5 px-2 py-1 rounded-lg">
                    Cond. {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.condo_fee)}
                  </div>
                )}
              </div>

              {/* AMENITIES (Ícones rápidos das 3 primeiras marcadas) */}
              <div className="flex gap-2">
                {AMENITIES.filter(a => p[a.id]).slice(0, 3).map(a => (
                  <span key={a.id} className="text-[9px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
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
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[32px] border-none md:border shadow-2xl flex flex-col animate-in zoom-in-95`}>
            
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center sticky top-0 bg-inherit z-10">
              <h2 className={`text-lg font-bold ${theme.text}`}>{isViewOnly ? 'Detalhes' : (editingId ? 'Editar Imóvel' : 'Novo Cadastro')}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-red-500"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar pb-24 md:pb-10">
              
              {/* CARROSSEL NO MODO VIEW */}
              {isViewOnly && formData.images.length > 0 ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-6">
                  <img src={formData.images[currentImgIdx]} className="w-full h-full object-contain" />
                  {formData.images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImgIdx(prev => prev > 0 ? prev - 1 : formData.images.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md text-white rounded-full"><ChevronLeft/></button>
                      <button onClick={() => setCurrentImgIdx(prev => prev < formData.images.length - 1 ? prev + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md text-white rounded-full"><ChevronRight/></button>
                    </>
                  )}
                </div>
              ) : !isViewOnly && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden relative border border-white/10">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={10}/></button>
                    </div>
                  ))}
                  <label className={`aspect-square rounded-xl border-2 border-dashed ${theme.input} flex flex-col items-center justify-center cursor-pointer`}>
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
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Título</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none font-bold`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Preço</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none font-bold text-[#0217ff]`} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{label:'Condomínio', k:'condo_fee'}, {label:'Área m²', k:'area'}, {label:'Quartos', k:'bedrooms'}, {label:'Banheiros', k:'bathrooms'}].map(f => (
                    <div key={f.k} className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400">{f.label}</label>
                      <input disabled={isViewOnly} className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center font-bold`} value={(formData as any)[f.k]} onChange={e => setFormData({...formData, [f.k]: e.target.value})} />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Características do Imóvel</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {AMENITIES.map(item => (
                      <button key={item.id} type="button" disabled={isViewOnly} onClick={() => setFormData({...formData, [item.id]: !(formData as any)[item.id]})}
                        className={`py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                          (formData as any)[item.id] ? 'border-[#0217ff] bg-[#0217ff] text-white' : 'border-zinc-100 dark:border-white/5 text-zinc-500'
                        } ${isViewOnly && !(formData as any)[item.id] ? 'hidden' : ''}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Descrição</label>
                  <textarea disabled={isViewOnly} rows={4} className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none resize-none`} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                {!isViewOnly && (
                  <button disabled={loading || uploading} className="w-full py-4 bg-[#0217ff] text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Alterações'}
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