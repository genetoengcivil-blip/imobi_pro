import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, 
  Image as ImageIcon, X, Loader2, PlusCircle, Check, 
  Globe, AlertCircle, Search, Map as MapIcon
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function PropertiesPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '', price: '', type: 'venda',
    bedrooms: '', bathrooms: '', suites: '', area: '',
    description: '', images: [] as string[],
    // Novos campos de endereço
    cep: '', address: '', number: '', neighborhood: '', city: '', state: '',
    location: '' // Este é o campo que vai para o site público
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

  // FUNÇÃO BUSCA CEP (ViaCEP)
  const handleCEPBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          // Define a localização pública (apenas bairro e cidade)
          location: `${data.bairro}, ${data.localidade} - ${data.uf}`
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    } finally {
      setCepLoading(false);
    }
  };

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
      const propertyToSave = {
        user_id: user?.id,
        title: formData.title,
        location: formData.location, // Público: Bairro, Cidade
        type: formData.type,
        description: formData.description,
        images: formData.images,
        price: parseFloat(String(formData.price).replace(/\D/g, '')) || 0,
        bedrooms: parseInt(formData.bedrooms as string) || 0,
        bathrooms: parseInt(formData.bathrooms as string) || 0,
        suites: parseInt(formData.suites as string) || 0,
        area: parseInt(formData.area as string) || 0,
        // Dados privados que podemos salvar como metadados ou colunas extras se houver
        full_address_json: {
          cep: formData.cep,
          rua: formData.address,
          numero: formData.number,
          bairro: formData.neighborhood
        },
        created_at: new Date()
      };

      const { error } = await supabase.from('properties').insert([propertyToSave]);
      if (error) throw error;

      setShowModal(false);
      setFormData({ 
        title: '', price: '', type: 'venda', bedrooms: '', bathrooms: '', 
        suites: '', area: '', description: '', images: [],
        cep: '', address: '', number: '', neighborhood: '', city: '', state: '', location: ''
      });
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
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#0217ff] font-black text-[10px] uppercase tracking-[0.3em]">
            <Globe size={14} /> Site Público Ativo
          </div>
          <h1 className={`text-4xl font-black italic uppercase tracking-tighter ${theme.textMain}`}>
            Meus <span className="text-[#0217ff]">Imóveis</span>
          </h1>
        </div>
        <button onClick={() => setShowModal(true)} className="px-8 py-4 bg-[#0217ff] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-[#0217ff]/20 flex items-center gap-3">
          <Plus size={18} /> Novo Ativo
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[40px] border p-4 group transition-all duration-500`}>
            <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden mb-6">
              {p.images?.[0] ? (
                <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              ) : (
                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"><Home className="text-zinc-400" size={40} /></div>
              )}
            </div>
            <div className="px-4 pb-4 space-y-2">
              <h3 className={`text-xl font-black uppercase italic tracking-tighter truncate ${theme.textMain}`}>{p.title}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                <MapPin size={14} className="text-[#0217ff]" /> {p.location}
              </div>
              <div className="pt-4 flex justify-between items-center">
                <span className="text-[#0217ff] font-black italic text-lg">R$ {Number(p.price).toLocaleString('pt-BR')}</span>
                <button onClick={() => { if(confirm('Excluir?')) supabase.from('properties').delete().eq('id', p.id).then(() => loadProperties()) }} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL PREMIUM */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[48px] border shadow-2xl flex flex-col`}>
            
            <div className="p-8 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/5">
              <div>
                <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${theme.textMain}`}>Cadastro de Ativo</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Os dados de endereço completo são <span className="text-[#0217ff]">privados</span>.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 no-scrollbar">
              
              {/* SEÇÃO 1: LOCALIZAÇÃO PRIVADA */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#0217ff]">
                  <MapIcon size={16} /> Localização e Privacidade
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">CEP</label>
                    <div className="relative">
                      <input className={`w-full ${theme.input} px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-[#0217ff]/20`} 
                        value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCEPBlur} placeholder="00000-000" />
                      {cepLoading && <Loader2 className="absolute right-4 top-4 animate-spin text-[#0217ff]" size={20} />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Logradouro (Privado)</label>
                    <input className={`w-full ${theme.input} px-6 py-4 rounded-2xl outline-none`} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Rua, Avenida..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Número</label>
                    <input className={`w-full ${theme.input} px-6 py-4 rounded-2xl outline-none`} value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} placeholder="123" />
                  </div>
                </div>

                <div className="p-6 rounded-[32px] border-2 border-dashed border-[#0217ff]/20 bg-[#0217ff]/5 flex flex-col md:flex-row gap-6 items-center">
                  <div className="shrink-0 w-12 h-12 bg-[#0217ff] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0217ff]/30">
                    <Globe size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xs font-black uppercase ${theme.textMain}`}>Visualização no Anúncio Público:</h4>
                    <p className="text-lg font-black italic text-[#0217ff] tracking-tighter">
                      {formData.location || "Aguardando preenchimento do endereço..."}
                    </p>
                  </div>
                </div>

                {/* MAPA DINÂMICO (Para o Corretor) */}
                {formData.address && formData.city && (
                  <div className="rounded-[32px] overflow-hidden border-4 border-white/5 h-64 bg-zinc-200">
                    <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=SEU_GOOGLE_MAPS_KEY_AQUI&q=${encodeURIComponent(`${formData.address}, ${formData.number} - ${formData.neighborhood}, ${formData.city}`)}`}
                      allowFullScreen>
                    </iframe>
                    {/* Nota: Substitua pela sua Key se tiver, ou use este iframe apenas como placeholder visual */}
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: DETALHES DO IMÓVEL */}
              <div className="space-y-8">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#0217ff]">
                  <Home size={16} /> Atributos do Imóvel
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Título do Anúncio</label>
                  <input required className={`w-full ${theme.input} px-6 py-4 rounded-2xl text-lg font-bold outline-none`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Mansão Suspensa com Vista para o Mar" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Preço (R$)</label>
                    <input required className={`w-full ${theme.input} px-6 py-4 rounded-2xl font-black text-[#0217ff] outline-none`} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Área (m²)</label>
                    <input type="number" className={`w-full ${theme.input} px-6 py-4 rounded-2xl text-center outline-none`} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Quartos</label>
                    <input type="number" className={`w-full ${theme.input} px-6 py-4 rounded-2xl text-center outline-none`} value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Suítes</label>
                    <input type="number" className={`w-full ${theme.input} px-6 py-4 rounded-2xl text-center outline-none`} value={formData.suites} onChange={e => setFormData({...formData, suites: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: IMAGENS */}
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0217ff]">Galeria de Luxo</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-3xl overflow-hidden relative group border border-white/10 shadow-lg">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center font-black uppercase text-[10px]">Remover</button>
                    </div>
                  ))}
                  <label className={`aspect-square rounded-3xl border-4 border-dashed ${theme.input} flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff] hover:bg-[#0217ff]/5 transition-all`}>
                    {uploading ? <Loader2 className="animate-spin text-[#0217ff]" /> : <PlusCircle size={40} className="text-zinc-500" />}
                    <input type="file" hidden multiple onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <button disabled={loading || uploading} className="w-full py-8 bg-[#0217ff] text-white rounded-[32px] font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-[#0217ff]/40 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                {loading ? <Loader2 className="animate-spin" /> : "Publicar no Portfólio Profissional"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}