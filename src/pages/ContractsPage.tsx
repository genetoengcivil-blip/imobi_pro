import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, User, ChevronRight, CheckSquare, 
  Trash2, X, CheckCircle2, FileSignature, 
  Loader2, Briefcase, FileText, ArrowRight, Save, 
  AlertCircle, ShieldCheck, ClipboardCheck, Key, FilePlus
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

// --- DICIONÁRIO DE MODELOS JURÍDICOS (BLOCOS 1, 2 e 3) ---
const DOCUMENT_TEMPLATES: any = {
  // BLOCO 1 - INTERMEDIAÇÃO
  'autorizacao_venda': (d: any) => `AUTORIZAÇÃO DE VENDA DE IMÓVEL\n\nPROPRIETÁRIO: ${d.client_name}\nIMÓVEL: ${d.property_name}\n\nO proprietário acima qualificado autoriza o corretor a promover a venda do imóvel pelo valor de ${d.value}.`,
  'termo_visita': (d: any) => `TERMO DE VISITA\n\nImóvel: ${d.location}\nVisitante: ${d.client_name}\nData: ${new Date().toLocaleDateString()}\n\nO visitante declara que conheceu o imóvel através da intermediação do corretor.`,
  
  // BLOCO 2 - VENDA
  'promessa_venda': (d: any) => `CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL\n\nPROMITENTE VENDEDOR: [NOME DO VENDEDOR]\nPROMITENTE COMPRADOR: ${d.client_name}\n\nCLÁUSULA 1ª – OBJETO: Imóvel em ${d.location || '________'}. Matrícula nº ${d.matricula || '________'}.\n\nCLÁUSULA 2ª – PREÇO: O valor total é de ${d.value}, pago da seguinte forma:\na) Sinal de ${d.sinal || '________'};\nb) Parcelas: ${d.parcelas || '________'}.\n\nCLÁUSULA 3ª – ARRAS: Art. 418 do Código Civil.\n\nCLÁUSULA 4ª – POSSE: Transmitida após pagamento de ${d.posse_percent || '___'}%.\n\nCLÁUSULA 10ª – FORO: Comarca de ${d.city || '________'}.`,
  
  // BLOCO 3 - LOCAÇÃO
  'locacao_residencial': (d: any) => `CONTRATO DE LOCAÇÃO RESIDENCIAL\n\nLOCADOR: [NOME DO LOCADOR]\nLOCATÁRIO: ${d.client_name}\n\nCLÁUSULA 1ª – OBJETO: Fins exclusivamente residenciais.\nCLÁUSULA 2ª – PRAZO: Prazo de 30 meses.\nCLÁUSULA 3ª – ALUGUEL: Valor mensal de ${d.value}, com vencimento em [DIA].\nCLÁUSULA 6ª – GARANTIA: [CAUÇÃO/FIADOR].`,
  'termo_entrega_chaves': (d: any) => `TERMO DE ENTREGA DE CHAVES\n\nDeclaro que recebi as chaves do imóvel localizado em ${d.location} nesta data, estando o imóvel em condições de uso.`,
  'termo_vistoria': (d: any) => `TERMO DE VISTORIA DE IMÓVEL\n\nImóvel: ${d.property_name}\nPINTURA: [OK]\nHIDRÁULICA: [OK]\nELÉTRICA: [OK]\nOBSERVAÇÕES: ________________`
};

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Categoria, 2: Tipo, 3: Dados, 4: Revisão

  const [formData, setFormData] = useState({
    category: '', client_name: '', property_id: '', property_name: '', location: '',
    value: '', document_type: '', final_content: '', start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([
      supabase.from('contracts').select('*, properties(*)').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('properties').select('*').eq('user_id', user?.id)
    ]);
    setContracts(cRes.data || []);
    setProperties(pRes.data || []);
    setLoading(false);
  }

  const clientsGrouped = useMemo(() => {
    const groups: any = {};
    contracts.forEach(c => {
      if (!groups[c.client_name]) groups[c.client_name] = { name: c.client_name, docs: [] };
      groups[c.client_name].docs.push(c);
    });
    return Object.values(groups);
  }, [contracts]);

  const handleGenerate = () => {
    const prop = properties.find(p => p.id === formData.property_id);
    const content = DOCUMENT_TEMPLATES[formData.document_type]({
      ...formData,
      property_name: prop?.title,
      location: prop?.location
    });
    setFormData({ ...formData, final_content: content });
    setStep(4);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('contracts').insert([{
      ...formData,
      user_id: user?.id,
      value: parseFloat(String(formData.value).replace(/\D/g, '')) || 0,
      content: formData.final_content,
      checklist: [
        { task: "RG / CPF", done: false },
        { task: "Certidão de Matrícula", done: false },
        { task: "Certidões Negativas", done: false }
      ]
    }]);
    if (!error) { setShowModal(false); setStep(1); loadData(); }
    setLoading(false);
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200 shadow-2xl',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Documentação</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gestão de Contratos e Termos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">
          Novo Documento
        </button>
      </div>

      {/* LISTAGEM CRM STYLE */}
      <div className="space-y-4">
        {clientsGrouped.map((client: any) => (
          <div key={client.name} className={`${theme.card} rounded-[32px] border overflow-hidden`}>
            <div onClick={() => setSelectedClient(selectedClient === client.name ? null : client.name)} className="p-6 flex justify-between items-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0217ff]/10 text-[#0217ff] rounded-2xl flex items-center justify-center font-bold">{client.name[0]}</div>
                <div>
                  <h3 className={`font-bold ${theme.text}`}>{client.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{client.docs.length} Documentos na Pasta</p>
                </div>
              </div>
              <ChevronRight className={`text-zinc-300 transition-transform ${selectedClient === client.name ? 'rotate-90' : ''}`} />
            </div>

            {selectedClient === client.name && (
              <div className="px-6 pb-6 space-y-4 border-t border-zinc-100 dark:border-white/5 pt-6 bg-zinc-50/30 dark:bg-white/5">
                {client.docs.map((doc: any) => (
                  <div key={doc.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#0217ff] font-bold text-sm"><FileText size={16}/> {doc.document_type.replace('_', ' ').toUpperCase()}</div>
                      <p className="text-xs text-zinc-500 uppercase font-bold">{doc.properties?.title || 'Imóvel s/ nome'}</p>
                      <div className="flex gap-2 pt-2">
                        <button className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><Download size={14}/> Baixar</button>
                        <button onClick={async () => { if(confirm('Apagar?')) { await supabase.from('contracts').delete().eq('id', doc.id); loadData(); } }} className="p-2 text-red-500/20 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    {/* CHECKLIST NO DOSSIÊ */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-[#0217ff] uppercase">Checklist Pendente</p>
                      {doc.checklist?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-black/20 rounded-lg text-[10px] font-bold text-zinc-500 border border-zinc-100 dark:border-white/5">
                          <CheckSquare size={14} className={item.done ? 'text-green-500' : 'text-zinc-300'}/> {item.task}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE FLUXO (4 PASSOS) */}
      {showModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className={`${theme.modal} w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col`}>
            
            <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-inherit">
              <h2 className={`text-lg font-bold ${theme.text}`}>
                {step === 1 ? 'Qual a categoria?' : step === 2 ? 'Qual documento?' : step === 3 ? 'Dados Base' : 'Revisão Jurídica'}
              </h2>
              <button onClick={() => { setShowModal(false); setStep(1); }} className="text-zinc-500 hover:text-red-500"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar pb-32">
              
              {/* PASSO 1: CATEGORIA */}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={() => { setFormData({...formData, category: 'intermediacao'}); setStep(2); }} className={`${theme.card} p-8 rounded-3xl border text-center hover:border-[#0217ff] transition-all`}>
                    <ShieldCheck size={32} className="mx-auto mb-4 text-[#0217ff]" />
                    <p className="font-bold text-sm uppercase">Intermediação</p>
                  </button>
                  <button onClick={() => { setFormData({...formData, category: 'venda'}); setStep(2); }} className={`${theme.card} p-8 rounded-3xl border text-center hover:border-[#0217ff] transition-all`}>
                    <DollarSign size={32} className="mx-auto mb-4 text-green-500" />
                    <p className="font-bold text-sm uppercase">Venda</p>
                  </button>
                  <button onClick={() => { setFormData({...formData, category: 'locacao'}); setStep(2); }} className={`${theme.card} p-8 rounded-3xl border text-center hover:border-[#0217ff] transition-all`}>
                    <Key size={32} className="mx-auto mb-4 text-orange-500" />
                    <p className="font-bold text-sm uppercase">Locação</p>
                  </button>
                </div>
              )}

              {/* PASSO 2: TIPO ESPECÍFICO */}
              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.category === 'intermediacao' && (
                    <>
                      <button onClick={() => { setFormData({...formData, document_type: 'autorizacao_venda'}); setStep(3); }} className="p-4 rounded-xl border text-left font-bold text-xs uppercase hover:bg-zinc-50">Autorização de Venda</button>
                      <button onClick={() => { setFormData({...formData, document_type: 'termo_visita'}); setStep(3); }} className="p-4 rounded-xl border text-left font-bold text-xs uppercase hover:bg-zinc-50">Termo de Visita</button>
                    </>
                  )}
                  {formData.category === 'venda' && (
                    <>
                      <button onClick={() => { setFormData({...formData, document_type: 'promessa_venda'}); setStep(3); }} className="p-4 rounded-xl border text-left font-bold text-xs uppercase hover:bg-zinc-50">Promessa de Compra e Venda</button>
                    </>
                  )}
                  {formData.category === 'locacao' && (
                    <>
                      <button onClick={() => { setFormData({...formData, document_type: 'locacao_residencial'}); setStep(3); }} className="p-4 rounded-xl border text-left font-bold text-xs uppercase hover:bg-zinc-50">Contrato de Locação (30 meses)</button>
                      <button onClick={() => { setFormData({...formData, document_type: 'termo_entrega_chaves'}); setStep(3); }} className="p-4 rounded-xl border text-left font-bold text-xs uppercase hover:bg-zinc-50">Entrega de Chaves</button>
                    </>
                  )}
                </div>
              )}

              {/* PASSO 3: DADOS DO CLIENTE/IMÓVEL */}
              {step === 3 && (
                <div className="space-y-6">
                  <input className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none font-bold`} placeholder="Nome Completo do Cliente" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <select className={`${theme.input} px-6 py-4 rounded-2xl outline-none text-sm`} value={formData.property_id} onChange={e => setFormData({...formData, property_id: e.target.value})}>
                      <option value="">Escolha o Imóvel...</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <input className={`${theme.input} px-6 py-4 rounded-2xl outline-none font-bold text-[#0217ff]`} placeholder="Valor R$" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                  </div>
                  <button onClick={handleGenerate} className="w-full py-5 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest">Revisar Documento</button>
                </div>
              )}

              {/* PASSO 4: EDITOR/REVISÃO */}
              {step === 4 && (
                <div className="space-y-6">
                   <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                      <AlertCircle className="text-amber-500 shrink-0" size={20}/>
                      <p className="text-[10px] font-bold text-amber-600 uppercase">Atenção: Revise as informações e complete as cláusulas pendentes antes de salvar.</p>
                   </div>
                   <textarea 
                    className={`w-full ${theme.input} p-8 rounded-[32px] min-h-[400px] outline-none border focus:border-[#0217ff] leading-relaxed text-sm`}
                    value={formData.final_content}
                    onChange={e => setFormData({...formData, final_content: e.target.value})}
                  />
                  <div className="flex gap-4">
                    <button onClick={() => setStep(3)} className="flex-1 py-4 bg-zinc-100 dark:bg-white/5 rounded-2xl font-bold uppercase text-[10px] text-zinc-500">Voltar</button>
                    <button onClick={handleSave} disabled={loading} className="flex-[2] py-4 bg-[#0217ff] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar e Salvar na Pasta'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}