import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  X, Loader2, PlusCircle, Check, Globe, Star, Square, Tag, Map as MapIcon
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

  // Busca CEP e preenche Bairro/Cidade automaticamente
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
    { id: 'has_elevator', label: 'Elevador' }, { id: 'has_games', label: 'Jogos' }, { id: 'has_party', label: 'Festas' },
    { id: 'has_spa', label: 'Spa' }, { id: 'has_playground', label: 'Play' }, { id: 'has_court', label: 'Quadra' },
    { id: 'has_gourmet', label: 'Gourmet' }, { id: 'has_conciege', label: 'Portaria' }, { id: 'has_laundry', label: 'Lavand.' }
  ];

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${theme.text}`}>Imóveis</h1>
        <button onClick={() => { setEditingId(null); setFormData(initialForm); setShowModal(true); }} className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
          Novo Ativo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[32px] border overflow-hidden`}>
            <div className="aspect-video relative group">
              <img src={p.images?.[0] || ''} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                 <button onClick={() => { setEditingId(p.id); setFormData({...p}); setShowModal(true); }} className="p-2.5 bg-white rounded-full text-black shadow-xl"><Edit3 size={16} /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold truncate text-sm ${theme.text}`}>{p.title}</h3>
                <span className="text-sm font-black text-[#0217ff]">R$ {Number(p.price).toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><MapPin size={10}/> {p.location}</p>
              
              <div className="flex gap-3 py-3 border-y border-zinc-100 dark:border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Square size={12}/> {p.area}m²</div>
                <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Bed size={14}/> {p.bedrooms} Qts</div>
                {p.condo_fee > 0 && <div className="text-[10px] font-bold text-green-600 bg-green-500/5 px-2 py-0.5 rounded">Cond. R$ {Number(p.condo_fee).toLocaleString('pt-BR')}</div>}
              </div>

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
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col`}>
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
              <h2 className={`text-lg font-bold ${theme.text}`}>{editingId ? 'Editar Imóvel' : 'Novo Cadastro'}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar">
              
              {/* ENDEREÇO COM CEP */}
              <section className="space-y-4">
                <p className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Localização (Privada)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input className={`${theme.input} px-5 py-3.5 rounded-2xl outline-none text-sm`} placeholder="CEP" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCEPBlur} />
                  <input className={`md:col-span-2 ${theme.input} px-5 py-3.5 rounded-2xl outline-none text-sm`} placeholder="Rua" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                  <input className={`${theme.input} px-5 py-3.5 rounded-2xl outline-none text-sm`} placeholder="Nº" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                </div>
                <div className="text-xs font-bold text-zinc-500 uppercase">Publicado como: <span className="text-[#0217ff]">{formData.location || 'Digite o CEP...'}</span></div>
              </section>

              {/* FINANCEIRO E AMENITIES */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <input className={`${theme.input} px-5 py-3.5 rounded-2xl outline-none font-bold text-[#0217ff]`} placeholder="Valor R$" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                 <input className={`${theme.input} px-5 py-3.5 rounded-2xl outline-none`} placeholder="Condomínio R$" value={formData.condo_fee} onChange={e => setFormData({...formData, condo_fee: e.target.value})} />
                 <input className={`${theme.input} px-5 py-3.5 rounded-2xl outline-none text-center`} placeholder="m²" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                 <input className={`${theme.input} px-5 py-3.5 rounded-2xl outline-none text-center`} placeholder="Quartos" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Lazer do Condomínio</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {AMENITIES.map(item => (
                    <button key={item.id} type="button" onClick={() => setFormData({...formData, [item.id]: !(formData as any)[item.id]})}
                      className={`py-2 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                        (formData as any)[item.id] ? 'border-[#0217ff] bg-[#0217ff] text-white' : 'border-zinc-100 dark:border-white/5 text-zinc-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* GALERIA COM CAPA (ESTRELA) */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase text-zinc-400">Galeria (A 1ª foto é a Capa ⭐)</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className={`aspect-square rounded-2xl overflow-hidden relative border-2 ${i === 0 ? 'border-[#0217ff]' : 'border-transparent'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                         <button type="button" onClick={() => setAsCover(i)} className="p-1.5 bg-white text-black rounded-full"><Star size={12} fill={i === 0 ? "black" : "none"} /></button>
                         <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="p-1.5 bg-red-500 text-white rounded-full"><X size={12}/></button>
                      </div>
                    </div>
                  ))}
                  <label className={`aspect-square rounded-2xl border-2 border-dashed ${theme.input} flex items-center justify-center cursor-pointer`}>
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
              </div>

              <button disabled={loading || uploading} className="w-full py-5 bg-[#0217ff] text-white rounded-3xl font-bold uppercase text-[10px] tracking-widest shadow-2xl">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}