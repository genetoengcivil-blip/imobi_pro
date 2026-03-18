import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  Image as ImageIcon, X, Loader2, PlusCircle, Check, 
  Globe, AlertCircle, Search, Ruler, Square
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

  const openModal = (p: any = null, viewOnly = false) => {
    setIsViewOnly(viewOnly);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir permanentemente este imóvel?')) return;
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (!error) loadProperties();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    setLoading(true);
    
    const payload = {
      ...formData,
      user_id: user?.id,
      price: parseFloat(formData.price.replace(/\D/g, '')),
      condo_fee: parseFloat(formData.condo_fee.replace(/\D/g, '')) || 0,
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
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  const AMENITIES = [
    { id: 'has_pool', label: 'Piscina' }, { id: 'has_gym', label: 'Academia' },
    { id: 'has_bbq', label: 'Churrasqueira' }, { id: 'has_elevator', label: 'Elevador' },
    { id: 'has_games', label: 'Salão Jogos' }, { id: 'has_party', label: 'Salão Festas' },
    { id: 'has_spa', label: 'Spa/Sauna' }, { id: 'has_playground', label: 'Playground' },
    { id: 'has_court', label: 'Quadra' }, { id: 'has_gourmet', label: 'Varanda Gourmet' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme.text}`}>Imóveis</h1>
          <p className="text-sm text-zinc-500">Gestão de catálogo profissional.</p>
        </div>
        <button onClick={() => openModal()} className="px-5 py-2.5 bg-[#0217ff] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2">
          <Plus size={16} /> Novo Ativo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-3xl border overflow-hidden transition-all group`}>
            <div className="aspect-video relative overflow-hidden">
              <img src={p.images?.[0] || ''} className="w-full h-full object-cover" />
              {/* OVERLAY DE AÇÕES MINIMALISTA */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button title="Ver detalhes" onClick={() => openModal(p, true)} className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-black transition-all"><Eye size={18} /></button>
                <button title="Editar" onClick={() => openModal(p, false)} className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-black transition-all"><Edit3 size={18} /></button>
                <button title="Excluir" onClick={() => handleDelete(p.id)} className="p-3 bg-red-500/20 backdrop-blur-md text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold truncate text-sm ${theme.text}`}>{p.title}</h3>
                <span className="text-sm font-bold text-[#0217ff]">R$ {Number(p.price).toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-4 flex items-center gap-1"><MapPin size={10}/> {p.location}</p>
              
              <div className="flex gap-4 border-t border-zinc-100 dark:border-white/5 pt-4">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500"><Bed size={14}/> {p.bedrooms}</div>
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500"><Square size={12}/> {p.area}m²</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-xl flex flex-col`}>
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
              <h2 className={`text-lg font-bold ${theme.text}`}>
                {isViewOnly ? 'Detalhes do Imóvel' : (editingId ? 'Editar Imóvel' : 'Novo Cadastro')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar">
              {isViewOnly && (
                <div className="p-4 bg-[#0217ff]/5 border border-[#0217ff]/20 rounded-2xl flex items-center gap-3 text-[#0217ff] text-xs font-bold uppercase">
                  <AlertCircle size={16} /> Modo de apenas visualização
                </div>
              )}

              <section className="space-y-4">
                <p className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Localização</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input disabled={isViewOnly} className={`${theme.input} px-4 py-3 rounded-xl outline-none text-sm`} placeholder="CEP" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCEPBlur} />
                  <input disabled={isViewOnly} className={`md:col-span-2 ${theme.input} px-4 py-3 rounded-xl outline-none text-sm`} placeholder="Rua (Privado)" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                  <input disabled={isViewOnly} className={`${theme.input} px-4 py-3 rounded-xl outline-none text-sm`} placeholder="Nº" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                </div>
                <div className="text-xs font-bold text-zinc-500 uppercase">Site Público: <span className="text-[#0217ff]">{formData.location || '---'}</span></div>
              </section>

              <section className="space-y-4">
                <p className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Informações Técnicas</p>
                <input disabled={isViewOnly} required className={`w-full ${theme.input} px-4 py-3 rounded-xl outline-none font-bold`} placeholder="Título do Anúncio" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input disabled={isViewOnly} className={`${theme.input} px-4 py-3 rounded-xl outline-none`} placeholder="Preço" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  <input disabled={isViewOnly} className={`${theme.input} px-4 py-3 rounded-xl outline-none`} placeholder="Condomínio" value={formData.condo_fee} onChange={e => setFormData({...formData, condo_fee: e.target.value})} />
                  <input disabled={isViewOnly} type="number" className={`${theme.input} px-4 py-3 rounded-xl text-center`} placeholder="m²" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                  <input disabled={isViewOnly} type="number" className={`${theme.input} px-4 py-3 rounded-xl text-center`} placeholder="Quartos" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
                </div>
              </section>

              <section className="space-y-4">
                <p className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Lazer e Amenidades</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {AMENITIES.map(item => (
                    <button key={item.id} type="button" disabled={isViewOnly} onClick={() => setFormData({...formData, [item.id]: !(formData as any)[item.id]})}
                      className={`py-2.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                        (formData as any)[item.id] ? 'border-[#0217ff] bg-[#0217ff] text-white' : 'border-zinc-100 dark:border-white/5 text-zinc-500'
                      } ${isViewOnly && (formData as any)[item.id] ? 'opacity-100' : isViewOnly ? 'opacity-30' : ''}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>

              {!isViewOnly && (
                <button disabled={loading} className="w-full py-4 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-[#0217ff]/20">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? 'Salvar Alterações' : 'Publicar Imóvel')}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}