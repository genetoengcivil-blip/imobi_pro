import { useState, useEffect } from 'react';
import { 
  Plus, Search, Home, MapPin, Bed, Bath, Ruler, 
  Trash2, Edit3, Image as ImageIcon, X, Loader2, 
  PlusCircle, Check, DollarSign, FileText, Globe
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function PropertiesPage() {
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    type: 'venda',
    bedrooms: '',
    bathrooms: '',
    suites: '',
    area: '',
    description: '',
    images: [] as string[]
  });

  useEffect(() => {
    if (user) loadProperties();
  }, [user]);

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setProperties(data || []);
  }

  // Lógica de Upload de Imagens
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const files = Array.from(e.target.files);
    const uploadedUrls: string[] = [...formData.images];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('properties')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('properties')
          .getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
    }

    setFormData({ ...formData, images: uploadedUrls });
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
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
      setFormData({
        title: '', price: '', location: '', type: 'venda',
        bedrooms: '', bathrooms: '', suites: '', area: '',
        description: '', images: []
      });
      loadProperties();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
    await supabase.from('properties').delete().eq('id', id);
    loadProperties();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Gestão de <span className="text-blue-600">Ativos</span></h1>
          <p className="text-zinc-500 font-medium italic">Você possui {properties.length} imóveis cadastrados no portfólio.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
        >
          <Plus size={16} /> Novo Imóvel
        </button>
      </div>

      {/* GRID DE IMÓVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((p) => (
          <div key={p.id} className="bg-zinc-900/30 border border-white/5 rounded-[40px] overflow-hidden group hover:border-blue-600/50 transition-all">
            <div className="aspect-video relative overflow-hidden">
              {p.images?.[0] ? (
                <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-800"><Home size={48} /></div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-[9px] font-black uppercase text-white rounded-lg">{p.type}</span>
              </div>
              <button 
                onClick={() => deleteProperty(p.id)}
                className="absolute top-4 right-4 p-2 bg-red-500/20 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-white truncate mb-4">{p.title}</h3>
              <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-4 mb-6">
                <div className="text-center"><span className="block text-zinc-500 text-[9px] font-black uppercase">Área</span><span className="text-xs font-bold">{p.area}m²</span></div>
                <div className="text-center"><span className="block text-zinc-500 text-[9px] font-black uppercase">Quartos</span><span className="text-xs font-bold">{p.bedrooms}</span></div>
                <div className="text-center"><span className="block text-zinc-500 text-[9px] font-black uppercase">Suítes</span><span className="text-xs font-bold">{p.suites}</span></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white italic">R$ {p.price.toLocaleString()}</span>
                <button className="text-blue-500 hover:text-white transition-colors"><Edit3 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CADASTRO (Full Screen) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 overflow-y-auto">
          <div className="bg-zinc-950 w-full max-w-6xl rounded-[48px] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Cadastrar <span className="text-blue-600">Novo Ativo</span></h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full text-zinc-500"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-12 overflow-y-auto custom-scrollbar space-y-12">
              
              {/* Seção de Fotos */}
              <div className="space-y-6">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <ImageIcon size={16} /> Galeria de Imagens (Luxo)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl relative group overflow-hidden border border-white/10">
                      <img src={img} className="w-full h-full object-cover" />
                      <button 
                        type="button" onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-600/5 transition-all">
                    {uploading ? <Loader2 className="animate-spin text-blue-600" /> : <PlusCircle className="text-zinc-600" />}
                    <span className="text-[10px] font-black uppercase mt-2 text-zinc-500">Adicionar</span>
                    <input type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* Seção de Dados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Título do Anúncio</label>
                  <input required className="w-full bg-zinc-900/50 border-2 border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-600" 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Valor (R$)</label>
                  <input required className="w-full bg-zinc-900/50 border-2 border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-600" 
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Localização (Bairro/Cidade)</label>
                  <input required className="w-full bg-zinc-900/50 border-2 border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-600" 
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-4"><label className="text-[9px] font-black uppercase text-zinc-500">Quartos</label>
                  <input type="number" className="w-full bg-zinc-900/50 border-2 border-white/5 rounded-xl py-4 text-center" 
                    value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} /></div>
                  <div className="space-y-4"><label className="text-[9px] font-black uppercase text-zinc-500">Banheiros</label>
                  <input type="number" className="w-full bg-zinc-900/50 border-2 border-white/5 rounded-xl py-4 text-center" 
                    value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} /></div>
                  <div className="space-y-4"><label className="text-[9px] font-black uppercase text-zinc-500">Suítes</label>
                  <input type="number" className="w-full bg-zinc-900/50 border-2 border-white/5 rounded-xl py-4 text-center" 
                    value={formData.suites} onChange={e => setFormData({...formData, suites: e.target.value})} /></div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descrição Técnica</label>
                <textarea rows={6} className="w-full bg-zinc-900/50 border-2 border-white/5 rounded-[32px] py-6 px-8 text-white outline-none focus:border-blue-600 resize-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <button disabled={loading || uploading} className="w-full py-7 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/40 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Salvar e Publicar Ativo</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}