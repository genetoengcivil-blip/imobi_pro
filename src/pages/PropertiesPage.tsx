import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  Image as ImageIcon, X, Loader2, PlusCircle, Check, 
  Globe, ChevronLeft, ChevronRight, Square
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const openModal = (p: any = null, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    setCurrentImgIdx(0);
    if (p) {
      setEditingId(p.id);
      setFormData({
        ...p,
        price: p.price.toString(),
        condo_fee: p.condo_fee?.toString() || ''
      });
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
      price: parseFloat(String(formData.price).replace(/\D/g, '')),
      condo_fee: parseFloat(String(formData.condo_fee).replace(/\D/g, '')) || 0,
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
    } catch (err: any) { 
      alert("Erro ao salvar: " + err.message); 
    } finally { 
      setLoading(false); 
    }
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
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme.text}`}>Imóveis</h1>
          <p className="text-sm text-zinc-500">Gestão profissional do seu catálogo.</p>
        </div>
        <button onClick={() => openModal()} className="px-5 py-2.5 bg-[#0217ff] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#0217ff]/20">
          <Plus size={16} /> Novo Imóvel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-3xl border overflow-hidden group transition-all`}>
            <div className="aspect-video relative overflow-hidden">
              <img src={p.images?.[0] || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => openModal(p, true)} className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-black transition-all"><Eye size={18} /></button>
                <button onClick={() => openModal(p, false)} className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-black transition-all"><Edit3 size={18} /></button>
                <button onClick={async () => { if(confirm('Apagar?')) { await supabase.from('properties').delete().eq('id', p.id); loadProperties(); } }} className="p-3 bg-red-500/20 backdrop-blur-md text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-bold truncate text-sm ${theme.text}`}>{p.title}</h3>
                <span className="text-sm font-bold text-[#0217ff]">{formatCurrency(p.price)}</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1 mb-4"><MapPin size={10}/> {p.location}</p>
              <div className="flex gap-4 border-t border-zinc-100 dark:border-white/5 pt-4">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500"><Bed size={14}/> {p.bedrooms}</div>
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500"><Square size={12}/> {p.area}m²</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[32px] border shadow-2xl flex flex-col animate-in zoom-in-95`}>
            
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/5">
              <h2 className={`text-lg font-bold ${theme.text}`}>{isViewOnly ? 'Detalhes' : (editingId ? 'Editar' : 'Novo')}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar">
              
              {/* GALERIA DE IMAGENS (CARROSSEL NO MODO VIEW) */}
              <div className="space-y-4">
                {isViewOnly && formData.images.length > 0 ? (
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-black">
                    <img src={formData.images[currentImgIdx]} className="w-full h-full object-contain" />
                    {formData.images.length > 1 && (
                      <>
                        <button onClick={() => setCurrentImgIdx(prev => prev > 0 ? prev - 1 : formData.images.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20"><ChevronLeft/></button>
                        <button onClick={() => setCurrentImgIdx(prev => prev < formData.images.length - 1 ? prev + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20"><ChevronRight/></button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-[10px] rounded-full font-bold">{currentImgIdx + 1} / {formData.images.length}</div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {formData.images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group border border-white/10">
                        <img src={img} className="w-full h-full object-cover" />
                        {!isViewOnly && <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={10}/></button>}
                      </div>
                    ))}
                    {!isViewOnly && (
                      <label className={`aspect-square rounded-2xl border-2 border-dashed ${theme.input} flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff]`}>
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
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">Título do Anúncio</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3.5 rounded-2xl outline-none font-bold`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">Preço de Venda</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3.5 rounded-2xl outline-none font-bold text-[#0217ff]`} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Condomínio', key: 'condo_fee' },
                    { label: 'Área m²', key: 'area' },
                    { label: 'Quartos', key: 'bedrooms' },
                    { label: 'Banheiros', key: 'bathrooms' }
                  ].map(f => (
                    <div key={f.key} className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">{f.label}</label>
                      <input disabled={isViewOnly} className={`w-full ${theme.input} px-4 py-3 rounded-xl text-center font-bold`} value={(formData as any)[f.key]} onChange={e => setFormData({...formData, [f.key]: e.target.value})} />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest ml-2">Lazer e Detalhes do Condomínio</p>
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

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">Descrição Completa</label>
                  <textarea disabled={isViewOnly} rows={4} className={`w-full ${theme.input} px-6 py-4 rounded-3xl outline-none resize-none`} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                {!isViewOnly && (
                  <button disabled={loading || uploading} className="w-full py-5 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl shadow-[#0217ff]/20">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? 'Salvar Alterações' : 'Publicar Agora')}
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