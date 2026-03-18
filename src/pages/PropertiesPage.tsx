import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, 
  Image as ImageIcon, X, Loader2, PlusCircle, Check, 
  Globe, AlertCircle, Map as MapIcon, ChevronDown
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
    title: '', price: '', condo_fee: '', type: 'venda',
    bedrooms: '', bathrooms: '', suites: '', area: '',
    description: '', images: [] as string[],
    cep: '', street: '', number: '', neighborhood: '', city: '', state: '',
    location: '',
    // Diferenciais
    has_elevator: false,
    has_bbq: false,
    has_pool: false,
    has_gym: false
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
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          location: `${data.bairro}, ${data.localidade} - ${data.uf}`
        }));
      }
    } catch (error) { console.error(error); } finally { setCepLoading(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    const uploadedUrls: string[] = [...formData.images];
    for (const file of files) {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
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
        user_id: user?.id,
        title: formData.title,
        price: parseFloat(String(formData.price).replace(/\D/g, '')) || 0,
        condo_fee: parseFloat(String(formData.condo_fee).replace(/\D/g, '')) || 0,
        area: parseInt(formData.area) || 0,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        suites: parseInt(formData.suites) || 0,
        location: formData.location,
        description: formData.description,
        images: formData.images,
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        has_elevator: formData.has_elevator,
        has_bbq: formData.has_bbq,
        has_pool: formData.has_pool,
        has_gym: formData.has_gym,
        created_at: new Date()
      }]);
      if (error) throw error;
      setShowModal(false);
      loadProperties();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-white/10 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-[#0217ff] font-black text-[10px] uppercase tracking-widest mb-1">
            <Globe size={12} /> Portfólio Público
          </div>
          <h1 className={`text-4xl font-black italic uppercase tracking-tighter ${theme.textMain}`}>Meus Imóveis</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="px-8 py-4 bg-[#0217ff] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#0217ff]/20">
          Novo Ativo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[40px] border p-4 group overflow-hidden`}>
            <div className="aspect-[4/3] rounded-[32px] overflow-hidden mb-4 relative">
              <img src={p.images?.[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[9px] font-black uppercase rounded-full">R$ {Number(p.price).toLocaleString('pt-BR')}</div>
            </div>
            <div className="px-2">
              <h3 className={`font-black uppercase italic truncate ${theme.textMain}`}>{p.title}</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase">{p.location}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[48px] border shadow-2xl flex flex-col`}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${theme.textMain}`}>Cadastro Premium</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-red-500"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 no-scrollbar">
              
              {/* LOCALIZAÇÃO */}
              <div className="space-y-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#0217ff]">1. Localização e Privacidade</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <input className={`${theme.input} px-6 py-4 rounded-2xl outline-none`} placeholder="CEP" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCEPBlur} />
                  <input className={`md:col-span-2 ${theme.input} px-6 py-4 rounded-2xl outline-none`} placeholder="Rua (Privado)" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                  <input className={`${theme.input} px-6 py-4 rounded-2xl outline-none`} placeholder="Nº" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                </div>
                <div className="p-6 rounded-3xl bg-[#0217ff]/5 border border-[#0217ff]/20">
                  <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Aparecerá no site como:</p>
                  <p className="text-lg font-black italic text-[#0217ff] uppercase">{formData.location || "Preencha o CEP..."}</p>
                </div>
              </div>

              {/* DADOS TÉCNICOS E FINANCEIRO */}
              <div className="space-y-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#0217ff]">2. Detalhes Financeiros e Técnicos</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input required className={`${theme.input} px-6 py-4 rounded-2xl outline-none`} placeholder="Título do Anúncio" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input className={`${theme.input} px-6 py-4 rounded-2xl outline-none font-bold text-[#0217ff]`} placeholder="Valor Venda" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    <input className={`${theme.input} px-6 py-4 rounded-2xl outline-none`} placeholder="Condomínio" value={formData.condo_fee} onChange={e => setFormData({...formData, condo_fee: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {['area', 'bedrooms', 'bathrooms', 'suites'].map(field => (
                    <div key={field} className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-zinc-500">{field.replace('area', 'm²')}</label>
                      <input type="number" className={`${theme.input} w-full py-4 rounded-xl text-center font-bold`} value={(formData as any)[field]} onChange={e => setFormData({...formData, [field]: e.target.value})} />
                    </div>
                  ))}
                </div>
              </div>

              {/* DIFERENCIAIS */}
              <div className="space-y-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#0217ff]">3. Diferenciais do Condomínio/Imóvel</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'has_elevator', label: 'Elevador' },
                    { id: 'has_bbq', label: 'Churrasqueira' },
                    { id: 'has_pool', label: 'Piscina' },
                    { id: 'has_gym', label: 'Academia' }
                  ].map(item => (
                    <button 
                      key={item.id} type="button"
                      onClick={() => setFormData({...formData, [item.id]: !(formData as any)[item.id]})}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] ${
                        (formData as any)[item.id] ? 'border-[#0217ff] bg-[#0217ff] text-white' : 'border-zinc-200 dark:border-white/5 text-zinc-500'
                      }`}
                    >
                      {(formData as any)[item.id] && <Check size={14} />} {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* IMAGENS */}
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#0217ff]">4. Fotos do Imóvel</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10">
                      <img src={img} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <label className={`aspect-square rounded-2xl border-2 border-dashed ${theme.input} flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff]`}>
                    {uploading ? <Loader2 className="animate-spin text-[#0217ff]" /> : <Plus size={32} className="text-zinc-500" />}
                    <input type="file" hidden multiple onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <button disabled={loading || uploading} className="w-full py-8 bg-[#0217ff] text-white rounded-[32px] font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-[1.01] transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Publicar no Site Profissional"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}