import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  X, Loader2, PlusCircle, Check, Globe, Star, Square, 
  Map as MapIcon, ShieldCheck, Info
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

  const initialForm = {
    title: '', price: '', condo_fee: '', type: 'venda', status: 'disponivel',
    bedrooms: '', bathrooms: '', suites: '', area: '', description: '', images: [] as string[],
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

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
  };

  const handleCEPBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf,
          location: `${data.bairro}, ${data.localidade} - ${data.uf}`
        }));
      }
    } catch (e) { console.error(e); }
  };

  const setAsCover = (idx: number) => {
    const newImages = [...formData.images];
    const [selected] = newImages.splice(idx, 1);
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
      price: parseFloat(String(formData.price).replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
      condo_fee: parseFloat(String(formData.condo_fee).replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
      bedrooms: parseInt(formData.bedrooms) || 0,
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
        <h1 className={`text-2xl font-bold ${theme.text}`}>Imóveis</h1>
        <button onClick={() => { setEditingId(null); setFormData(initialForm); setIsViewOnly(false); setShowModal(true); }} className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">
          Novo Cadastro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[32px] border overflow-hidden transition-all relative`}>
            {/* BARRA DE AÇÕES - SEMPRE VISÍVEL */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
               <button onClick={() => { setEditingId(p.id); setFormData({...p}); setIsViewOnly(true); setShowModal(true); }} className="p-2.5 bg-white/90 backdrop-blur rounded-full text-black shadow-lg hover:bg-white"><Eye size={16} /></button>
               <button onClick={() => { setEditingId(p.id); setFormData({...p}); setIsViewOnly(false); setShowModal(true); }} className="p-2.5 bg-white/90 backdrop-blur rounded-full text-black shadow-lg hover:bg-white"><Edit3 size={16} /></button>
               <button onClick={async () => { if(confirm('Excluir imóvel?')) { await supabase.from('properties').delete().eq('id', p.id); loadProperties(); } }} className="p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"><Trash2 size={16} /></button>
            </div>

            <div className="aspect-video relative overflow-hidden">
              <img src={p.images?.[0] || ''} className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[9px] font-black uppercase rounded-lg border border-white/10">
                {p.status}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold truncate text-base w-3/5 ${theme.text}`}>{p.title}</h3>
                <span className="text-base font-black text-[#0217ff]">{formatCurrency(p.price)}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase">
                <MapPin size={12} className="text-[#0217ff]" /> {p.location}
              </div>
              
              <div className="flex gap-4 py-3 border-y border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500"><Square size={14}/> {p.area}m²</div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500"><Bed size={14}/> {p.bedrooms} Qts</div>
                {p.condo_fee > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                    <ShieldCheck size={14}/> Cond. {formatCurrency(p.condo_fee)}
                  </div>
                )}
              </div>

              {/* DIFERENCIAIS NO CARD */}
              <div className="flex flex-wrap gap-1">
                {AMENITIES.filter(a => p[a.id]).map(a => (
                  <span key={a.id} className="px-2 py-0.5 bg-zinc-100 dark:bg-white/5 rounded text-[8px] font-bold text-zinc-400 uppercase border border-zinc-200/50">
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
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-5xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col shadow-2xl`}>
            
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-inherit">
              <div className="flex items-center gap-2">
                <Info className="text-[#0217ff]" size={18} />
                <h2 className={`text-lg font-bold ${theme.text}`}>{isViewOnly ? 'Detalhes do Imóvel' : (editingId ? 'Editar Cadastro' : 'Novo Imóvel')}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar">
              
              {/* LOCALIZAÇÃO COM CEP */}
              <section className="space-y-4">
                <p className="text-[10px] font-black uppercase text-[#0217ff] tracking-widest">Localização Privada</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input disabled={isViewOnly} className={`${theme.input} px-5 py-3.5 rounded-2xl outline-none text-sm`} placeholder="CEP" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCEPBlur} />
                  <input disabled={isViewOnly} className={`md:col-span-2 ${theme.input} px-5 py-3.5 rounded-2xl outline-none text-sm`} placeholder="Logradouro" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                  <input disabled={isViewOnly} className={`${theme.input} px-5 py-3.5 rounded-2xl outline-none text-sm`} placeholder="Nº" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Aparece no site como: <span className="text-[#0217ff]">{formData.location || '---'}</span></div>
              </section>

              {/* DADOS TÉCNICOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">Título do Anúncio</label>
                  <input disabled={isViewOnly} required className={`w-full ${theme.input} px-5 py-3.5 rounded-2xl outline-none font-bold`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">Venda R$</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3.5 rounded-2xl outline-none font-bold text-[#0217ff]`} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 ml-2">Condomínio R$</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3.5 rounded-2xl outline-none font-bold`} value={formData.condo_fee} onChange={e => setFormData({...formData, condo_fee: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* DIFERENCIAIS */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-[#0217ff] tracking-widest ml-2">Lazer & Condomínio</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {AMENITIES.map(item => (
                    <button key={item.id} type="button" disabled={isViewOnly} onClick={() => setFormData({...formData, [item.id]: !(formData as any)[item.id]})}
                      className={`py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                        (formData as any)[item.id] ? 'border-[#0217ff] bg-[#0217ff] text-white shadow-lg' : 'border-zinc-100 dark:border-white/5 text-zinc-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* GALERIA COM ESTRELA */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Galeria (A 1ª foto é a Capa ⭐)</p>
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
                    <label className={`aspect-square rounded-2xl border-2 border-dashed ${theme.input} flex items-center justify-center cursor-pointer hover:border-[#0217ff]`}>
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

              {!isViewOnly && (
                <button disabled={loading || uploading} className="w-full py-5 bg-[#0217ff] text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar e Publicar'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}