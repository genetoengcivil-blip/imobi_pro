import { useState, useEffect } from 'react';
import { 
  Plus, Home, MapPin, Bed, Bath, Trash2, Edit3, Eye,
  X, Loader2, PlusCircle, Check, Globe, Star, Square, 
  Car, ShieldCheck, Info, ChevronLeft, ChevronRight,
  Calculator, AlertTriangle, TrendingUp // Novos ícones
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

  // --- ESTADOS PARA AVALIAÇÃO COMPARATIVA ---
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [baseArea, setBaseArea] = useState(''); // Área do imóvel que está sendo avaliado
  const [comparables, setComparables] = useState([
    { price: '', area: '' },
    { price: '', area: '' },
    { price: '', area: '' },
  ]);

  const initialForm = {
    title: '', price: '', condo_fee: '', type: 'venda', status: 'disponivel',
    bedrooms: '', bathrooms: '', suites: '', area: '', parking_spaces: '',
    description: '', images: [] as string[],
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

  // --- LÓGICA DE AVALIAÇÃO ---
  const addComparable = () => {
    if (comparables.length < 10) {
      setComparables([...comparables, { price: '', area: '' }]);
    }
  };

  const calculateValuation = () => {
    const validComparables = comparables.filter(c => c.price && c.area);
    if (validComparables.length === 0) return { avgM2: 0, total: 0 };

    const sumM2 = validComparables.reduce((acc, c) => {
      const price = parseFloat(c.price.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      const area = parseFloat(c.area) || 1;
      return acc + (price / area);
    }, 0);

    const avgM2 = sumM2 / validComparables.length;
    const total = avgM2 * (parseFloat(baseArea) || 0);

    return { avgM2, total };
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
      parking_spaces: parseInt(formData.parking_spaces) || 0,
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
    { id: 'has_gourmet', label: 'Gourmet' }, { id: 'has_conciege', label: 'Portaria' }, { id: 'has_laundry', label: 'Lavanderia' }
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
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Imóveis</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ativos Gerenciados</p>
        </div>
        
        {/* BOTÕES DE CABEÇALHO */}
        <div className="flex gap-2">
          <button 
            onClick={() => setShowValuationModal(true)}
            className="px-6 py-2.5 bg-zinc-100 dark:bg-white/5 text-[#0217ff] rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-[#0217ff]/20"
          >
            <Calculator size={14} /> Avaliação
          </button>
          <button 
            onClick={() => { setEditingId(null); setFormData(initialForm); setIsViewOnly(false); setShowModal(true); }} 
            className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg"
          >
            Novo
          </button>
        </div>
      </div>

      {/* GRID DE IMÓVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} className={`${theme.card} rounded-[32px] border overflow-hidden relative group`}>
            <div className="absolute top-3 right-3 z-10 flex gap-2">
               <button onClick={() => { setEditingId(p.id); setFormData({...p}); setIsViewOnly(true); setShowModal(true); }} className="p-2.5 bg-white/90 backdrop-blur rounded-full text-black shadow-lg"><Eye size={16} /></button>
               <button onClick={() => { setEditingId(p.id); setFormData({...p}); setIsViewOnly(false); setShowModal(true); }} className="p-2.5 bg-white/90 backdrop-blur rounded-full text-black shadow-lg"><Edit3 size={16} /></button>
               <button onClick={async () => { if(confirm('Apagar imóvel?')) { await supabase.from('properties').delete().eq('id', p.id); loadProperties(); } }} className="p-2.5 bg-red-500 text-white rounded-full shadow-lg"><Trash2 size={16} /></button>
            </div>
            <div className="aspect-video relative overflow-hidden">
              <img src={p.images?.[0] || ''} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold truncate text-sm w-3/5 ${theme.text}`}>{p.title}</h3>
                <span className="text-sm font-black text-[#0217ff]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><MapPin size={10} className="text-[#0217ff]" /> {p.location}</p>
              <div className="flex flex-wrap gap-4 py-3 border-y border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500"><Square size={14}/> {p.area}m²</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500"><Bed size={14}/> {p.bedrooms}</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500"><Car size={14}/> {p.parking_spaces || 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE AVALIAÇÃO COMPARATIVA (MCDDM) */}
      {showValuationModal && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col shadow-2xl animate-in zoom-in-95`}>
            
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-inherit">
              <div className="flex items-center gap-3">
                <Calculator className="text-[#0217ff]" size={20} />
                <h2 className={`text-lg font-bold ${theme.text}`}>Método Comparativo</h2>
              </div>
              <button onClick={() => setShowValuationModal(false)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar pb-32">
              
              {/* DISCLAIMER */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 items-start">
                <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[9px] font-black text-amber-600 uppercase leading-relaxed">
                  Atenção: Os dados abaixo são estimativas baseadas em mercado. A validação final e conferência técnica é de inteira responsabilidade do corretor.
                </p>
              </div>

              {/* DADOS DO IMÓVEL BASE */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest ml-2">1. Área do Imóvel Avaliado</label>
                <input 
                  className={`w-full ${theme.input} px-6 py-4 rounded-2xl outline-none font-bold`} 
                  placeholder="Ex: 120 (m²)" 
                  value={baseArea}
                  onChange={(e) => setBaseArea(e.target.value)}
                />
              </div>

              {/* LISTA DE COMPARATIVOS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">2. Imóveis Comparados ({comparables.length}/10)</label>
                  {comparables.length < 10 && (
                    <button onClick={addComparable} className="p-1.5 bg-[#0217ff]/10 text-[#0217ff] rounded-lg hover:bg-[#0217ff] hover:text-white transition-all">
                      <Plus size={16} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {comparables.map((comp, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 relative group">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Preço Venda</label>
                        <input 
                          className={`w-full ${theme.input} px-4 py-2 rounded-xl text-xs outline-none`} 
                          placeholder="R$ 0,00"
                          value={comp.price}
                          onChange={(e) => {
                            const newComps = [...comparables];
                            newComps[idx].price = e.target.value;
                            setComparables(newComps);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Área (m²)</label>
                        <input 
                          className={`w-full ${theme.input} px-4 py-2 rounded-xl text-xs outline-none`} 
                          placeholder="m²"
                          value={comp.area}
                          onChange={(e) => {
                            const newComps = [...comparables];
                            newComps[idx].area = e.target.value;
                            setComparables(newComps);
                          }}
                        />
                      </div>
                      {comparables.length > 1 && (
                        <button 
                          onClick={() => setComparables(comparables.filter((_, i) => i !== idx))}
                          className="absolute -right-2 -top-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* RESULTADO (Dashboard de Valor) */}
              <div className="p-8 rounded-[32px] bg-[#0217ff] text-white space-y-6 shadow-2xl shadow-[#0217ff]/30">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.2em] mb-1">Média do m² na Região</p>
                    <p className="text-3xl font-black italic tracking-tighter">
                      R$ {calculateValuation().avgM2.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingUp size={24} className="opacity-40" />
                </div>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.2em] mb-1">Avaliação Sugerida</p>
                  <p className="text-5xl font-black italic tracking-tighter">
                    R$ {calculateValuation().total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO ORIGINAL (MANTIDO) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col`}>
            {/* ... o código do seu modal de cadastro original continua exatamente aqui ... */}
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-inherit">
              <h2 className={`text-lg font-bold ${theme.text}`}>{isViewOnly ? 'Visualizar Detalhes' : 'Cadastro de Imóvel'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-red-500"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar pb-32">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Inputs de título, preço, m2, etc. conforme seu código original */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Título</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none font-bold`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">CEP</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none`} value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCEPBlur} />
                  </div>
                  <div className="space-y-2 text-center">
                    <label className="text-[10px] font-bold uppercase text-[#0217ff]">Site Público</label>
                    <div className="text-[10px] font-bold text-zinc-500 mt-3">{formData.location || '---'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Venda R$</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none font-bold text-[#0217ff]`} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Condomínio</label>
                    <input disabled={isViewOnly} className={`w-full ${theme.input} px-5 py-3 rounded-xl outline-none`} value={formData.condo_fee} onChange={e => setFormData({...formData, condo_fee: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Vagas Garagem</label>
                    <input disabled={isViewOnly} type="number" className={`w-full ${theme.input} px-5 py-3 rounded-xl text-center`} value={formData.parking_spaces} onChange={e => setFormData({...formData, parking_spaces: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">m² Área</label>
                    <input disabled={isViewOnly} type="number" className={`w-full ${theme.input} px-5 py-3 rounded-xl text-center`} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                  </div>
                </div>
                <button disabled={loading || uploading} className="w-full py-4 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar Cadastro'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}