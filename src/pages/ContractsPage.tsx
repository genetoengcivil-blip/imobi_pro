import { useState, useEffect } from 'react';
import { 
  Plus, FileText, Search, Trash2, X, Check, 
  ChevronRight, Copy, FileSignature, Download, Loader2, Info
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

// MODELOS PRÉ-DEFINIDOS (Hardcoded para início rápido, mas podem vir do banco)
const CONTRACT_MODELS = [
  {
    id: '1',
    name: 'Compra e Venda Residencial',
    category: 'Venda',
    content: `CONTRATO DE COMPRA E VENDA DE IMÓVEL RESIDENCIAL

1. PARTES:
VENDEDOR: {{NOME_CORRETOR}}, na qualidade de representante.
COMPRADOR: {{NOME_CLIENTE}}.

2. OBJETO:
O imóvel localizado em {{LOCALIZACAO}}, denominado {{NOME_IMOVEL}}.

3. PREÇO E FORMA DE PAGAMENTO:
O valor total da transação é de {{VALOR_IMOVEL}}.
Sinal de: ___________
Saldo financiado: ___________

4. POSSE:
A posse será entregue em: ___/___/___

(Assinatura das Partas)`
  },
  {
    id: '2',
    name: 'Locação Residencial (30 meses)',
    category: 'Locação',
    content: `CONTRATO DE LOCAÇÃO RESIDENCIAL

LOCADOR: {{NOME_CORRETOR}}
LOCATÁRIO: {{NOME_CLIENTE}}

O imóvel {{NOME_IMOVEL}} é locado pelo valor mensal de {{VALOR_ALUGUEL}}.
Garantia Locatícia: __________________

(Assinatura das Partes)`
  }
];

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Seleção, 2: Edição
  
  const [formData, setFormData] = useState({
    client_name: '',
    property_name: '',
    selected_template: '',
    final_content: ''
  });

  useEffect(() => { if (user) loadContracts(); }, [user]);

  async function loadContracts() {
    setLoading(true);
    const { data } = await supabase.from('contracts').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setContracts(data || []);
    setLoading(false);
  }

  // Função para carregar modelo e substituir variáveis básicas
  const handleSelectTemplate = (template: any) => {
    let content = template.content;
    content = content.replace('{{NOME_CORRETOR}}', user?.user_metadata?.full_name || 'Corretor');
    
    setFormData({
      ...formData,
      selected_template: template.name,
      final_content: content
    });
    setStep(2);
  };

  const handleSaveContract = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('contracts').insert([{
        user_id: user?.id,
        client_name: formData.client_name,
        property_name: formData.property_name,
        content: formData.final_content,
        status: 'rascunho',
        created_at: new Date()
      }]);
      if (error) throw error;
      setShowModal(false);
      setStep(1);
      loadContracts();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

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
          <h1 className={`text-2xl font-bold ${theme.text}`}>Contratos</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Modelos Jurídicos Prontos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
          Gerar Novo
        </button>
      </div>

      {/* LISTAGEM DE CONTRATOS GERADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((c) => (
          <div key={c.id} className={`${theme.card} p-6 rounded-3xl border flex flex-col gap-4`}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#0217ff]/10 text-[#0217ff] rounded-2xl"><FileSignature size={20} /></div>
              <div>
                <h3 className={`font-bold text-sm ${theme.text}`}>{c.client_name}</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">{c.property_name || 'Sem imóvel'}</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
              <button className="text-[#0217ff] font-bold text-[10px] uppercase flex items-center gap-1 hover:underline">
                <Download size={14} /> Baixar PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE GERAÇÃO DE CONTRATO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-5xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col`}>
            
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-inherit">
              <h2 className={`text-lg font-bold ${theme.text}`}>{step === 1 ? 'Selecione um Modelo' : 'Complemente as Informações'}</h2>
              <button onClick={() => { setShowModal(false); setStep(1); }} className="text-zinc-500"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar pb-32">
              
              {step === 1 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CONTRACT_MODELS.map(model => (
                    <div 
                      key={model.id}
                      onClick={() => handleSelectTemplate(model)}
                      className={`${theme.card} p-6 rounded-3xl border cursor-pointer hover:border-[#0217ff] transition-all group`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-[#0217ff] font-bold uppercase mb-1">{model.category}</p>
                          <h3 className={`font-bold ${theme.text}`}>{model.name}</h3>
                        </div>
                        <ChevronRight className="text-zinc-300 group-hover:text-[#0217ff]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className={`${theme.input} px-5 py-3 rounded-xl outline-none text-sm`} placeholder="Nome do Cliente" onChange={e => setFormData({...formData, client_name: e.target.value})} />
                    <input className={`${theme.input} px-5 py-3 rounded-xl outline-none text-sm`} placeholder="Nome do Imóvel" onChange={e => setFormData({...formData, property_name: e.target.value})} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase ml-2">
                      <Info size={14} /> Edite o texto abaixo para finalizar o contrato
                    </div>
                    <textarea 
                      className={`w-full ${theme.input} p-8 rounded-[32px] min-h-[400px] outline-none border focus:border-[#0217ff] leading-relaxed text-sm no-scrollbar`}
                      value={formData.final_content}
                      onChange={e => setFormData({...formData, final_content: e.target.value})}
                    />
                  </div>

                  <button 
                    onClick={handleSaveContract}
                    disabled={loading}
                    className="w-full py-5 bg-[#0217ff] text-white rounded-3xl font-bold uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Finalizar e Guardar Contrato</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}