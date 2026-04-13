import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, FileSignature, Loader2, FileText, Save, 
  AlertCircle, ShieldCheck, Key, Edit3, Trash2, X,
  Calendar, DollarSign, Home, Check, Filter, 
  Grid3X3, List, Info, ChevronRight, Sparkles,
  FolderOpen, Clock, XCircle, Printer, Download,
  MapPin, UserCheck, Scale, Mail, Phone
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContractEditor from '@/components/ContractEditor';

// --- UTILITÁRIOS DE FORMATAÇÃO (MÁSCARAS) ---
const maskCPF_CNPJ = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    v = v.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v.substring(0, 18);
};

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
  return v.substring(0, 15);
};

const maskCurrency = (v: string | number) => {
  if (!v) return "R$ 0,00";
  let value = v.toString().replace(/\D/g, "");
  return (Number(value) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const parseCurrencyToNumber = (v: string) => {
  if (!v) return 0;
  return Number(v.replace(/\D/g, "")) / 100;
};

// --- GERADOR DE CABEÇALHO PROFISSIONAL ---
const generateProfileHeader = (user: any) => `
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0217ff; padding-bottom: 20px; margin-bottom: 30px; font-family: 'Helvetica', sans-serif;">
    <div style="display: flex; align-items: center; gap: 15px;">
      <div style="width: 60px; height: 60px; background: #0217ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 24px;">
        ${user?.full_name?.charAt(0) || 'C'}
      </div>
      <div>
        <h1 style="margin: 0; font-size: 20px; color: #1a1a1a; text-transform: uppercase; letter-spacing: -1px;">${user?.full_name || 'Consultor Imobiliário'}</h1>
        <p style="margin: 2px 0; font-size: 10px; color: #0217ff; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">${user?.professional_title || 'Gestão de Patrimônio'}</p>
      </div>
    </div>
    <div style="text-align: right; font-size: 10px; color: #666; line-height: 1.5;">
      <p style="margin: 0; font-weight: bold; color: #1a1a1a;">CONTATO PROFISSIONAL</p>
      <p style="margin: 0;">${user?.email || 'contato@prosis.com'}</p>
      <p style="margin: 0;">João Pessoa - Paraíba</p>
    </div>
  </div>
`;

// --- TEMPLATES JURÍDICOS COMPLETOS ---
const DOCUMENT_TEMPLATES: Record<string, (d: any, user: any) => string> = {
  'promessa_venda': (d: any, user: any) => `
    ${generateProfileHeader(user)}
    <div style="font-family: 'Times New Roman', serif; line-height: 1.6; color: #000; padding: 10px; text-align: justify;">
      <h2 style="text-align: center; text-transform: uppercase; text-decoration: underline; margin-bottom: 30px;">Instrumento Particular de Promessa de Compra e Venda</h2>
      <p><strong>VENDEDOR(ES):</strong> [NOME COMPLETO], CPF nº [_________], residente em [_________].</p>
      <p><strong>COMPRADOR(ES):</strong> ${d.client_name || '[_________]'}, portador do CPF nº ${d.client_document || '[_________]'}, residente em [_________].</p>
      <h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
      <p>O imóvel objeto deste contrato situa-se em <strong>${d.location || '[_________]'}</strong>, matriculado sob o nº ${d.matricula || '[_________]'} no Cartório de Registro de Imóveis de ${d.city || 'João Pessoa'}.</p>
      <h3>CLÁUSULA SEGUNDA - DO PREÇO E ARRAS</h3>
      <p>O valor total é de <strong>${d.formatted_value || 'R$ 0,00'}</strong>. Fica estipulado o valor de <strong>${d.formatted_sinal || 'R$ 0,00'}</strong> a título de ARRAS (Sinal), conforme Art. 417 a 420 do Código Civil.</p>
      <h3>CLÁUSULA TERCEIRA - DA EVICÇÃO</h3>
      <p>O Vendedor declara que o imóvel está livre de quaisquer ônus, dívidas ou hipotecas até a presente data.</p>
      <p style="margin-top: 60px; text-align: center;">${d.city || 'João Pessoa'}, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.</p>
      <br><br>
      <table width="100%">
        <tr>
          <td align="center">________________________________<br>VENDEDOR</td>
          <td align="center">________________________________<br>COMPRADOR</td>
        </tr>
      </table>
    </div>
  `,
  'locacao_residencial': (d: any, user: any) => `
    ${generateProfileHeader(user)}
    <div style="font-family: 'Times New Roman', serif; line-height: 1.6; color: #000; padding: 10px; text-align: justify;">
      <h2 style="text-align: center; text-transform: uppercase; text-decoration: underline;">Contrato de Locação Residencial Profissional</h2>
      <p><strong>LOCADOR:</strong> [NOME DO PROPRIETÁRIO], CPF nº [_________].</p>
      <p><strong>LOCATÁRIO:</strong> ${d.client_name || '[_________]'}, CPF nº ${d.client_document || '[_________]'}.</p>
      <h3>1. OBJETO E PRAZO</h3>
      <p>Imóvel situado em ${d.location || '[_________]'} para fins residenciais. Prazo de 30 meses a partir de ${format(new Date(), "dd/MM/yyyy")}.</p>
      <h3>2. VALORES E REAJUSTE</h3>
      <p>O aluguel mensal é de <strong>${d.formatted_value || 'R$ 0,00'}</strong>, reajustado anualmente pelo IGPM/FGV.</p>
      <p style="margin-top: 60px;">Assinado em: ${format(new Date(), "dd/MM/yyyy")}</p>
    </div>
  `,
  'termo_visita': (d: any, user: any) => `
    ${generateProfileHeader(user)}
    <div style="font-family: 'Times New Roman', serif; line-height: 1.6; color: #000; padding: 20px; border: 1px solid #eee;">
      <h2 style="text-align: center; text-transform: uppercase;">Ficha de Visita e Proteção de Intermediação</h2>
      <p>Eu, <strong>${d.client_name || '[_________]'}</strong>, portador do CPF ${d.client_document || '[_________]'}, declaro que visitei o imóvel abaixo através do corretor <strong>${user?.full_name || 'Profissional Responsável'}</strong>.</p>
      <p style="background: #f4f4f5; padding: 15px; border-radius: 8px;"><strong>IMÓVEL:</strong> ${d.location || '[DADOS DO IMÓVEL]'}</p>
      <p style="font-size: 13px; margin-top: 30px;"><strong>CIÊNCIA DE COMISSÃO:</strong> Reconheço que este imóvel me foi apresentado pelo corretor acima. Comprometo-me a não realizar negociação direta com o proprietário, sob pena de pagamento da comissão integral de 6% (Art. 725-727 do Código Civil).</p>
      <p style="margin-top: 60px; text-align: center;">Assinatura do Cliente: ________________________________</p>
    </div>
  `
};

const CATEGORIES = {
  venda: { label: 'Venda', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  locacao: { label: 'Locação', icon: Key, color: 'text-amber-500', bg: 'bg-amber-50' },
  intermediacao: { label: 'Intermediação', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' }
};

export default function ContractsPage() {
  const { user, leads, properties: globalProps } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContract, setEditingContract] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    category: '', client_id: '', client_name: '', client_phone: '', client_document: '',
    property_id: '', location: '', value: '', sinal: '', document_type: '', 
    final_content: '', city: 'João Pessoa', status: 'rascunho' as any, matricula: ''
  });

  useEffect(() => { if (user) fetchContracts(); }, [user]);

  async function fetchContracts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, properties(title, location)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setContracts(data);
    } catch (e) { console.error("Erro ao carregar:", e); }
    setLoading(false);
  }

  useEffect(() => {
    if (formData.client_id && leads) {
      const lead = leads.find(l => l.id === formData.client_id);
      if (lead) {
        setFormData(prev => ({
          ...prev,
          client_name: lead.name || '',
          client_phone: maskPhone(lead.phone || ''),
          value: lead.value ? maskCurrency((lead.value * 100).toString()) : prev.value
        }));
      }
    }
  }, [formData.client_id, leads]);

  const handleGenerate = () => {
    const template = DOCUMENT_TEMPLATES[formData.document_type] || DOCUMENT_TEMPLATES['promessa_venda'];
    const prop = (globalProps || []).find(p => p.id === formData.property_id);
    
    const content = template({
      ...formData,
      location: prop?.location || formData.location,
      formatted_value: formData.value,
      formatted_sinal: formData.sinal,
    }, user);

    setFormData(prev => ({ ...prev, final_content: content }));
    setStep(4);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      user_id: user.id,
      category: formData.category,
      client_name: formData.client_name,
      client_phone: (formData.client_phone || "").replace(/\D/g, ''),
      client_document: (formData.client_document || "").replace(/\D/g, ''),
      property_id: formData.property_id || null,
      value: parseCurrencyToNumber(formData.value),
      document_type: formData.document_type,
      final_content: formData.final_content,
      content: formData.final_content,
      status: formData.status,
      city: formData.city
    };

    const { error } = editingContract 
      ? await supabase.from('contracts').update(payload).eq('id', editingContract.id)
      : await supabase.from('contracts').insert([payload]);

    if (!error) {
      setShowModal(false);
      fetchContracts();
      setStep(1);
    }
    setLoading(false);
  };

  const handleExport = (content: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Contrato - ${formData.client_name}</title><style>body { padding: 40mm; font-family: serif; } @media print { .btn { display: none; } body { padding: 0; } }</style></head>
        <body>
          <div class="btn" style="background: #f4f4f5; padding: 20px; text-align: center; font-family: sans-serif; border-bottom: 1px solid #ddd; margin-bottom: 30px;">
            <button onclick="window.print()" style="background: #0217ff; color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(2,23,255,0.2);">Clique para Imprimir ou Salvar em PDF</button>
            <p style="font-size: 10px; color: #666; margin-top: 10px;">Dica: No destino, selecione "Salvar como PDF"</p>
          </div>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-in pb-24 max-w-7xl mx-auto font-sans">
      
      {/* HEADER */}
      <div className="bg-white border border-zinc-200 p-8 rounded-[40px] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[#0217ff] rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Scale size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Central Jurídica</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
              <Sparkles size={12} className="text-[#0217ff]"/> Gerador de Contratos com sua Marca
            </p>
          </div>
        </div>
        <button onClick={() => { setEditingContract(null); setStep(1); setShowModal(true); }} className="px-8 py-4 bg-[#0217ff] text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-3 hover:scale-105 transition-all"><Plus size={20} /> Novo Documento</button>
      </div>

      {/* FERRAMENTAS */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#0217ff] transition-colors" size={20} />
        <input type="text" placeholder="Pesquisar contrato por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-zinc-200 rounded-[24px] text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all" />
      </div>

      {/* LISTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(contracts || []).filter(c => c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(contract => (
          <div key={contract.id} className="bg-white border border-zinc-200 p-7 rounded-[32px] hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`p-4 rounded-2xl ${CATEGORIES[contract.category as keyof typeof CATEGORIES]?.bg || 'bg-zinc-50'}`}>
                <FileSignature size={28} className={CATEGORIES[contract.category as keyof typeof CATEGORIES]?.color || 'text-[#0217ff]'} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport(contract.final_content || contract.content)} className="p-3 bg-zinc-50 text-zinc-400 rounded-2xl hover:bg-green-500 hover:text-white transition-all"><Printer size={18} /></button>
                <button onClick={() => { setEditingContract(contract); setFormData({...contract, value: maskCurrency((contract.value * 100).toString())}); setStep(4); setShowModal(true); }} className="p-3 bg-zinc-50 text-zinc-400 rounded-2xl hover:bg-[#0217ff] hover:text-white transition-all"><Edit3 size={18} /></button>
              </div>
            </div>
            <h3 className="font-black text-base uppercase truncate mb-1">{contract.client_name}</h3>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">{contract.document_type?.replace(/_/g, ' ')}</p>
            <div className="flex justify-between items-end pt-5 border-t border-zinc-100">
              <span className="text-xl font-black text-[#0217ff]">R$ {(contract.value || 0).toLocaleString('pt-BR')}</span>
              <span className="text-[9px] font-black text-zinc-300">{contract.created_at ? format(new Date(contract.created_at), "dd/MM/yy") : '--/--/--'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL FIXO E SEGURO */}
      {showModal && (
        <div className="fixed inset-0 z-[999] bg-zinc-900/80 backdrop-blur-md flex items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[92vh] flex flex-col rounded-none md:rounded-[48px] shadow-2xl overflow-hidden relative border border-zinc-200">
            
            <div className="p-8 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-6">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(s => <div key={s} className={`h-2 rounded-full transition-all duration-500 ${step >= s ? 'w-10 bg-[#0217ff]' : 'w-4 bg-zinc-100'}`} />)}
                </div>
                <h2 className="text-xs font-black uppercase italic text-[#0217ff]">Passo {step} de 4</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 no-scrollbar bg-white">
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <button key={key} onClick={() => { setFormData({...formData, category: key}); setStep(2); }} className="p-12 border-2 border-zinc-50 rounded-[48px] hover:border-[#0217ff] text-center transition-all bg-zinc-50/50 hover:bg-white hover:shadow-xl">
                      <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${cat.bg}`}><cat.icon size={36} className={cat.color} /></div>
                      <span className="font-black uppercase text-xs tracking-widest block">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
                  <button onClick={() => { 
                    const docType = formData.category === 'locacao' ? 'locacao_residencial' : formData.category === 'intermediacao' ? 'termo_visita' : 'promessa_venda';
                    setFormData({...formData, document_type: docType}); 
                    setStep(3); 
                  }} className="p-8 border-2 border-zinc-100 rounded-[40px] text-left hover:border-[#0217ff] flex items-center gap-6 bg-white shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 text-[#0217ff] rounded-2xl flex items-center justify-center"><FileSignature size={32}/></div>
                    <div>
                      <h4 className="font-black text-lg uppercase mb-1">Modelo Jurídico Completo</h4>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Cláusulas de Proteção Atualizadas</p>
                    </div>
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 max-w-3xl mx-auto py-4">
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <label className="text-[11px] font-black uppercase text-[#0217ff] mb-2 block ml-2">Vincular a um Lead Ativo</label>
                    <select className="w-full p-5 rounded-2xl bg-white border border-zinc-200 outline-none font-bold text-sm shadow-sm" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                      <option value="">Nenhum lead selecionado...</option>
                      {(leads || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input className="p-5 rounded-2xl bg-zinc-50 border outline-none font-bold focus:bg-white" placeholder="Nome Completo do Cliente" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                    <input className="p-5 rounded-2xl bg-zinc-50 border outline-none font-bold focus:bg-white" placeholder="CPF / CNPJ" value={formData.client_document} onChange={e => setFormData({...formData, client_document: maskCPF_CNPJ(e.target.value)})} />
                    <div className="md:col-span-2">
                      <select className="w-full p-5 rounded-2xl bg-zinc-50 border outline-none font-bold focus:bg-white" value={formData.property_id} onChange={e => setFormData({...formData, property_id: e.target.value})}>
                        <option value="">Selecionar Imóvel da Base...</option>
                        {(globalProps || []).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    </div>
                    <input className="p-5 rounded-2xl bg-blue-50 border-blue-100 font-black text-[#0217ff] outline-none text-base" placeholder="Valor do Contrato (R$)" value={formData.value} onChange={e => setFormData({...formData, value: maskCurrency(e.target.value)})} />
                    <input className="p-5 rounded-2xl bg-zinc-50 border outline-none font-bold focus:bg-white" placeholder="Sinal / Arras (R$)" value={formData.sinal} onChange={e => setFormData({...formData, sinal: maskCurrency(e.target.value)})} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 h-full min-h-[500px]">
                  <div className="flex justify-between items-center bg-blue-50 p-6 rounded-[24px] border border-blue-100">
                    <div className="flex items-center gap-3"><Sparkles size={24} className="text-[#0217ff]"/><span className="text-[11px] font-black uppercase text-blue-700">Edite os detalhes ou exporte agora</span></div>
                    <button onClick={() => handleExport(formData.final_content)} className="px-8 py-4 bg-[#0217ff] text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 shadow-xl hover:bg-blue-700"><Printer size={18}/> Exportar Minuta</button>
                  </div>
                  <div className="border-4 border-zinc-50 rounded-[40px] overflow-hidden min-h-[550px] shadow-inner bg-white">
                    <ContractEditor value={formData.final_content} onChange={val => setFormData({...formData, final_content: val})} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-zinc-50/50 flex justify-between items-center gap-6">
              <button onClick={() => setStep(prev => prev - 1)} disabled={step === 1} className="px-10 py-5 bg-white border border-zinc-200 rounded-[24px] font-black text-[11px] uppercase disabled:opacity-30 hover:bg-zinc-50 transition-all">Anterior</button>
              {step < 4 ? (
                <button onClick={step === 3 ? handleGenerate : () => setStep(prev => prev + 1)} className="px-16 py-5 bg-[#0217ff] text-white rounded-[24px] font-black text-[11px] uppercase shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Próximo</button>
              ) : (
                <button onClick={handleSave} disabled={loading} className="px-16 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-[11px] uppercase shadow-xl shadow-emerald-500/20 flex items-center gap-3 active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Finalizar & Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}