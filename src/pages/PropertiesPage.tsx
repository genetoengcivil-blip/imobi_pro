import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Ruler, Trash2, Edit3, 
  Image as ImageIcon, X, Loader2, PlusCircle, Check, 
  Globe, AlertCircle, ArrowUpRight, DollarSign
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function PropertiesPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    title: '', price: '', location: '', type: 'venda',
    bedrooms: '', bathrooms: '', suites: '', area: '',
    description: '', images: [] as string[]
  });

  useEffect(() => { if (user) loadProperties(); }, [user]);

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    setProperties(data || []);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    const uploadedUrls: string[] = [...formData.images];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('properties').upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('properties').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
    }
    setFormData({ ...formData, images: uploadedUrls });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('properties').insert([{
        ...formData,
        user_id: user?.id,
        price: parseFloat(formData.price.replace(/\D/g, '')),
        created_at: new Date()
      }]);
      if (error) throw error;
      setShowModal(false);
      setFormData({ title: '', price: '', location: '', type: 'venda', bedrooms: '', bathrooms: '', suites: '', area: '', description: '', images: [] });
      loadProperties();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-white/10 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    textMuted: 'text-zinc-500 font-medium',
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in">
      
      {/* CABEÇALHO PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#0217ff] font-black text-[10px] uppercase tracking-[0.3em]">
            <Globe size={14} /> Ativos no Site Público
          </div>
          <h1 className={`text-4xl font-black italic uppercase tracking-tighter ${theme.textMain}`}>
            Portfólio de <span className="text-[#0217ff]">Imóveis</span>
          </h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-[#0217ff] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#0217ff]/20 flex items-center gap-3"
        >
          <Plus size={18} /> Adicionar Novo Ativo
        </button>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[40px] border p-4 group transition-all duration-500 hover:border-[#0217ff]/50`}>
            <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden mb-6 shadow-inner">
              {p.images?.[0] ? (
                <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              ) : (
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center"><Home className="text-zinc-400" size={40} /></div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase rounded-full border border-white/10">{p.type}</span>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className={`text-xl font-black uppercase italic tracking-tighter truncate w-2/3 ${theme.textMain}`}>{p.title}</h3>
                <span className="text-[#0217ff] font-black italic text-lg tracking-tighter">
                  R$ {p.price.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className={`flex items-center gap-2 text-xs ${theme.textMuted} mb-6`}>
                <MapPin size={14} /> {p.location}
              </div>

              <div className={`grid grid-cols-3 gap-4 p-4 rounded-3xl ${darkMode ? 'bg-white/5' : 'bg-zinc-50'} border ${theme.card}`}>
                <div className="text-center">
                  <span className="block text-[9px] font-black uppercase text-zinc-500">Área</span>
                  <span className={`text-xs font-bold ${theme.textMain}`}>{p.area}m²</span>
                </div>
                <div className="text-center border-x border-zinc-200 dark:border-white/5">
                  <span className="block text-[9px] font-black uppercase text-zinc-500">Quartos</span>
                  <span className={`text-xs font-bold ${theme.textMain}`}>{p.bedrooms}</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black uppercase text-zinc-500">Banho</span>
                  <span className={`text-xs font-bold ${theme.textMain}`}>{p.bathrooms}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL PREMIUM DE CADASTRO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[48px] border shadow-2xl flex flex-col animate-in zoom-in-95`}>
            
            <div className="p-8 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center">
              <div>
                <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${theme.textMain}`}>Novo Cadastro</h2>
                <p className="text-[10px] text-[#0217ff] font-bold uppercase tracking-widest mt-1">Este imóvel ficará visível em imobi-pro.com/v/{user?.id}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-red-500/10 text-red-500"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
              
              {/* Fotos */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Galeria (Fotos de Alta Qualidade)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-3xl overflow-hidden relative group border border-zinc-200 dark:border-white/10">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                  <label className={`aspect-square rounded-3xl border-2 border-dashed ${theme.input} flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff] transition-all`}>
                    {uploading ? <Loader2 className="animate-spin text-[#0217ff]" /> : <PlusCircle size={32} className="text-zinc-500" />}
                    <span className="text-[9px] font-black uppercase mt-2 text-zinc-500">Adicionar</span>
                    <input type="file" hidden multiple onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Título do Anúncio</label>
                  <input required className={`w-full ${theme.input} px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-[#0217ff]/20`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Apartamento de Luxo - Vista Mar" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Valor (R$)</label>
                  <input required className={`w-full ${theme.input} px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-[#0217ff]/20`} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="1.200.000,00" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">m² Total</label>
                  <input type="number" className={`w-full ${theme.input} px-4 py-4 rounded-2xl text-center`} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quartos</label>
                  <input type="number" className={`w-full ${theme.input} px-4 py-4 rounded-2xl text-center`} value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Banheiros</label>
                  <input type="number" className={`w-full ${theme.input} px-4 py-4 rounded-2xl text-center`} value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Suítes</label>
                  <input type="number" className={`w-full ${theme.input} px-4 py-4 rounded-2xl text-center`} value={formData.suites} onChange={e => setFormData({...formData, suites: e.target.value})} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Localização Estratégica</label>
                <input className={`w-full ${theme.input} px-6 py-4 rounded-2xl`} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ex: Jardins, São Paulo" />
              </div>

              <button disabled={loading || uploading} className="w-full py-6 bg-[#0217ff] text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-[#0217ff]/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Publicar no Site Profissional</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}