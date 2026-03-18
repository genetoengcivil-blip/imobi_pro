import { useState, useEffect } from 'react';
import { 
  Plus, Search, Home, MapPin, Bed, Bath, Ruler, 
  Trash2, Edit3, Image as ImageIcon, X, Loader2, 
  PlusCircle, Check, DollarSign, FileText, Globe, AlertCircle
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function PropertiesPage() {
  const { user, darkMode } = useGlobal(); // darkMode adicionado para controle de tema
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Definição de cores baseada no tema
  const theme = {
    card: darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900/50 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
    textMuted: 'text-zinc-500',
    border: darkMode ? 'border-white/5' : 'border-zinc-100'
  };

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
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-black uppercase italic tracking-tighter ${theme.text}`}>Gestão de <span className="text-[#0217ff]">Ativos</span></h1>
          <p className="text-zinc-500 font-medium italic">Você possui {properties.length} imóveis no portfólio público.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-[#0217ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#0217ff]/20"
        >
          <Plus size={16} /> Novo Imóvel
        </button>
      </div>

      {/* GRID DE IMÓVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[40px] overflow-hidden group border transition-all`}>
            <div className="aspect-video relative overflow-hidden">
              {p.images?.[0] ? (
                <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.title} />
              ) : (
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-400"><Home size={48} /></div>
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
              <h3 className={`text-lg font-black uppercase italic tracking-tighter truncate mb-4 ${theme.text}`}>{p.title}</h3>
              <div className={`grid grid-cols-3 gap-4 border-y ${theme.border} py-4 mb-6`}>
                <div className="text-center"><span className="block text-zinc-500 text-[9px] font-black uppercase">Área</span><span className="text-xs font-bold">{p.area}m²</span></div>
                <div className="text-center"><span className="block text-zinc-500 text-[9px] font-black uppercase">Quartos</span><span className="text-xs font-bold">{p.bedrooms}</span></div>
                <div className="text-center"><span className="block text-zinc-500 text-[9px] font-black uppercase">Suítes</span><span className="text-xs font-bold">{p.suites}</span></div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xl font-black italic ${theme.text}`}>R$ {p.price.toLocaleString('pt-BR')}</span>
                <button className="text-[#0217ff] hover:scale-110 transition-transform"><Edit3 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CADASTRO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10 overflow-y-auto">
          <div className={`${theme.modal} w-full max-w-5xl rounded-[48px] border shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300`}>
            
            {/* Header do Modal */}
            <div className={`p-8 border-b ${theme.border} flex items-center justify-between`}>
              <div>
                <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${theme.text}`}>Cadastrar <span className="text-[#0217ff]">Novo Ativo</span></h2>
                <div className="flex items-center gap-2 mt-1 text-[#0217ff]">
                  <Globe size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Este imóvel será publicado no seu site oficial</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-full ${theme.hover} text-zinc-500`}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-12 overflow-y-auto space-y-10 no-scrollbar">
              
              {/* Aviso de Visibilidade */}
              <div className="p-4 bg-[#0217ff]/5 border border-[#0217ff]/20 rounded-2xl flex items-start gap-4">
                <AlertCircle className="text-[#0217ff] shrink-0" size={20} />
                <p className="text-xs font-medium text-zinc-500 leading-relaxed">
                  <strong className={theme.text}>Atenção:</strong> Ao salvar, este imóvel ficará disponível imediatamente para visualização de clientes no seu domínio público. Certifique-se de que as fotos e descrições estão corretas.
                </p>
              </div>

              {/* Seção de Fotos */}
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <ImageIcon size={14} /> Galeria de Imagens
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl relative group overflow-hidden border border-zinc-200 dark:border-white/10">
                      <img src={img} className="w-full h-full object-cover" alt="Preview" />
                      <button 
                        type="button" onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label className={`aspect-square rounded-2xl border-2 border-dashed ${theme.border} flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff] hover:bg-[#0217ff]/5 transition-all`}>
                    {uploading ? <Loader2 className="animate-spin text-[#0217ff]" /> : <PlusCircle className="text-zinc-400" />}
                    <span className="text-[9px] font-black uppercase mt-2 text-zinc-500">Adicionar</span>
                    <input type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* Seção de Dados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Título do Anúncio</label>
                  <input required className={`w-full ${theme.input} rounded-2xl py-4 px-6 outline-none focus:ring-2 ring-[#0217ff]/20 transition-all`} 
                    placeholder="Ex: Cobertura de Luxo no Jardins"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Valor de Venda (R$)</label>
                  <input required className={`w-full ${theme.input} rounded-2xl py-4 px-6 outline-none focus:ring-2 ring-[#0217ff]/20 transition-all`} 
                    placeholder="0,00"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Localização</label>
                  <input required className={`w-full ${theme.input} rounded-2xl py-4 px-6 outline-none focus:ring-2 ring-[#0217ff]/20 transition-all`} 
                    placeholder="Bairro, Cidade - UF"
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-3"><label className="text-[9px] font-black uppercase text-zinc-500 text-center block">Quartos</label>
                  <input type="number" className={`w-full ${theme.input} rounded-xl py-4 text-center`} 
                    value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} /></div>
                  <div className="space-y-3"><label className="text-[9px] font-black uppercase text-zinc-500 text-center block">Banheiros</label>
                  <input type="number" className={`w-full ${theme.input} rounded-xl py-4 text-center`} 
                    value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} /></div>
                  <div className="space-y-3"><label className="text-[9px] font-black uppercase text-zinc-500 text-center block">m² Total</label>
                  <input type="number" className={`w-full ${theme.input} rounded-xl py-4 text-center`} 
                    value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} /></div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descrição Detalhada</label>
                <textarea rows={5} className={`w-full ${theme.input} rounded-[32px] py-6 px-8 outline-none focus:ring-2 ring-[#0217ff]/20 resize-none`}
                  placeholder="Descreva os diferenciais do imóvel..."
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <button disabled={loading || uploading} className="w-full py-6 bg-[#0217ff] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#0217ff]/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Publicar no Site Profissional</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}