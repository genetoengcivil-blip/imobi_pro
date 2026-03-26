import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, User, ChevronRight, CheckSquare, 
  Trash2, X, CheckCircle2, FileSignature, 
  Loader2, Briefcase, FileText, ArrowRight, Save, 
  AlertCircle, ShieldCheck, ClipboardCheck, Key, FilePlus,
  Download, Edit3, Eye, Clock, Tag, FolderOpen,
  Calendar, DollarSign, Home, Printer, Share2,
  Archive, Copy, FileCheck, FileMinus, FileWarning,
  Check, Phone, CreditCard
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContractEditor from '@/components/ContractEditor';

// --- TIPOS E INTERFACES ---
interface Contract {
  id: string;
  client_name: string;
  client_phone?: string;
  client_document?: string;
  document_type: string;
  category: string;
  value: number;
  property_id: string | null;
  property_name?: string;
  location?: string;
  content: string;
  final_content?: string;
  checklist?: ChecklistItem[];
  status: 'rascunho' | 'ativo' | 'concluido' | 'cancelado';
  created_at: string;
  start_date?: string | null;
  end_date?: string | null;
  properties?: any;
}

interface ChecklistItem {
  task: string;
  done: boolean;
  required?: boolean;
}

interface Property {
  id: string;
  title: string;
  location: string;
}

// --- FUNÇÕES DE FORMATAÇÃO ---
const formatPhone = (value: string) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
};

const formatDocument = (value: string) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
};

const formatCurrency = (value: number) => {
  if (!value || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatCurrencyInput = (value: string) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';
  const valueFloat = parseInt(numbers) / 100;
  return valueFloat.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const unformat = (value: string) => {
  return value.replace(/\D/g, '');
};

// --- DICIONÁRIO DE MODELOS JURÍDICOS ---
const DOCUMENT_TEMPLATES: Record<string, (d: any) => string> = {
  'autorizacao_venda': (d: any) => `AUTORIZAÇÃO EXCLUSIVA DE VENDA DE IMÓVEL\n\n` +
    `Pelo presente instrumento particular, de um lado o(a) Sr(a). ${d.client_name}, inscrito(a) no CPF/CNPJ sob nº ${d.client_document || '[________]'}, telefone ${d.client_phone || '[________]'}, doravante denominado PROPRIETÁRIO, e de outro lado [NOME DA IMOBILIÁRIA], inscrita no CNPJ sob nº [________], doravante denominada CORRETORA, têm entre si justo e acertado o seguinte:\n\n` +
    `1. OBJETO: O PROPRIETÁRIO autoriza a CORRETORA a promover a venda do imóvel ${d.property_name}, localizado em ${d.location}.\n\n` +
    `2. PREÇO: O valor mínimo de venda é de R$ ${formatCurrency(parseFloat(d.value) || 0)}.\n\n` +
    `3. PRAZO: A presente autorização terá validade de 180 dias.\n\n` +
    `4. COMISSÃO: A CORRETORA fará jus a comissão de 6% sobre o valor da venda.\n\n` +
    `Local e data: ${d.location || '________'}, ${new Date().toLocaleDateString('pt-BR')}`,

  'termo_visita': (d: any) => `TERMO DE VISITA E CIÊNCIA DE INTERMEDIAÇÃO\n\n` +
    `Eu, ${d.client_name}, CPF ${d.client_document || '[________]'}, telefone ${d.client_phone || '[________]'}, declaro para os devidos fins que:\n\n` +
    `1. Visitei o imóvel ${d.property_name} localizado em ${d.location}.\n` +
    `2. Fui acompanhado pelo corretor [NOME DO CORRETOR], CRECI [________].\n` +
    `3. Estou ciente que a intermediação é de responsabilidade da imobiliária.\n\n` +
    `Data: ${new Date().toLocaleDateString('pt-BR')}`,
  
  'promessa_venda': (d: any) => `CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL\n\n` +
    `PROMITENTE VENDEDOR: [NOME DO VENDEDOR], CPF [________]\n` +
    `PROMITENTE COMPRADOR: ${d.client_name}, CPF ${d.client_document || '[________]'}, telefone ${d.client_phone || '[________]'}\n\n` +
    `CLÁUSULA 1ª – OBJETO: O presente contrato tem por objeto o imóvel localizado em ${d.location || '________'}, matriculado sob o nº ${d.matricula || '________'} no Cartório de Registro de Imóveis da Comarca de ${d.city || '________'}.\n\n` +
    `CLÁUSULA 2ª – PREÇO E CONDIÇÕES DE PAGAMENTO: O valor total da transação é de ${formatCurrency(parseFloat(d.value) || 0)}, pago da seguinte forma:\n` +
    `a) ${d.sinal ? formatCurrency(parseFloat(d.sinal) || 0) : 'R$ [________]'} como sinal e princípio de pagamento;\n` +
    `b) ${d.parcelas ? formatCurrency(parseFloat(d.parcelas) || 0) : 'R$ [________]'} no ato da escritura;\n` +
    `c) Saldo financiado mediante [________].\n\n` +
    `CLÁUSULA 3ª – DA COMISSÃO DE CORRETAGEM: A comissão de corretagem, no valor de [________], será paga [________].\n\n` +
    `CLÁUSULA 4ª – DA POSSE: A posse do imóvel será transmitida ao COMPRADOR após o pagamento de ${d.posse_percent || '___'}% do preço.\n\n` +
    `CLÁUSULA 5ª – DAS ARRAS: Fica convencionado que o sinal pago tem caráter de arras, conforme artigo 418 do Código Civil.\n\n` +
    `CLÁUSULA 10ª – FORO: Fica eleito o foro da Comarca de ${d.city || '________'} para dirimir quaisquer dúvidas.\n\n` +
    `${d.location}, ${new Date().toLocaleDateString('pt-BR')}`,
  
  'locacao_residencial': (d: any) => `CONTRATO DE LOCAÇÃO RESIDENCIAL\n\n` +
    `LOCADOR: [NOME DO LOCADOR], CPF [________]\n` +
    `LOCATÁRIO: ${d.client_name}, CPF ${d.client_document || '[________]'}, telefone ${d.client_phone || '[________]'}\n` +
    `FIADOR: [________], CPF [________]\n\n` +
    `CLÁUSULA 1ª – OBJETO: O presente contrato tem por objeto a locação do imóvel localizado em ${d.location}, para fins exclusivamente residenciais.\n\n` +
    `CLÁUSULA 2ª – PRAZO: O prazo da locação é de 30 (trinta) meses, iniciando-se em ${d.start_date ? format(new Date(d.start_date), 'dd/MM/yyyy') : '[________]'} e terminando em ${d.end_date ? format(new Date(d.end_date), 'dd/MM/yyyy') : '[________]'}.\n\n` +
    `CLÁUSULA 3ª – ALUGUEL E ENCARGOS: O aluguel mensal é de ${formatCurrency(parseFloat(d.value) || 0)}, com vencimento todo dia [________] de cada mês. O locatário pagará ainda IPTU e condomínio.\n\n` +
    `CLÁUSULA 4ª – GARANTIA: A presente locação é garantida por [FIADOR / CAUÇÃO / SEGURO-FIANÇA].\n\n` +
    `CLÁUSULA 5ª – REAJUSTE: O aluguel será reajustado anualmente pelo IGP-M/FGV.\n\n` +
    `CLÁUSULA 8ª – MULTAS: Em caso de rescisão antecipada, o LOCATÁRIO pagará multa equivalente a [________].\n\n` +
    `${d.location}, ${new Date().toLocaleDateString('pt-BR')}`,

  'termo_entrega_chaves': (d: any) => `TERMO DE ENTREGA E RECEBIMENTO DE CHAVES\n\n` +
    `Pelo presente instrumento, as partes abaixo qualificadas:\n\n` +
    `ENTREGADOR: [NOME], CPF [________]\n` +
    `RECEBEDOR: ${d.client_name}, CPF ${d.client_document || '[________]'}, telefone ${d.client_phone || '[________]'}\n\n` +
    `Declaram que nesta data, o ENTREGADOR entrega e o RECEBEDOR recebe as chaves do imóvel localizado em ${d.location}.\n\n` +
    `O imóvel encontra-se em perfeito estado de conservação e limpeza, conforme vistoria realizada em [________].\n\n` +
    `Por estarem justos e contratados, assinam o presente termo.\n\n` +
    `${d.location}, ${new Date().toLocaleDateString('pt-BR')}`,

  'termo_vistoria': (d: any) => `TERMO DE VISTORIA DE IMÓVEL\n\n` +
    `IMÓVEL: ${d.property_name}\n` +
    `ENDEREÇO: ${d.location}\n` +
    `DATA DA VISTORIA: ${new Date().toLocaleDateString('pt-BR')}\n` +
    `VISTORIADOR: ${d.client_name}\n\n` +
    `CHECKLIST DE VISTORIA:\n` +
    `[ ] PINTURA – OK / [ ] PINTURA – OBS: ________________\n` +
    `[ ] HIDRÁULICA – OK / [ ] HIDRÁULICA – OBS: ________________\n` +
    `[ ] ELÉTRICA – OK / [ ] ELÉTRICA – OBS: ________________\n` +
    `[ ] PISOS – OK / [ ] PISOS – OBS: ________________\n` +
    `[ ] ESQUADRIAS – OK / [ ] ESQUADRIAS – OBS: ________________\n` +
    `[ ] VIDROS – OK / [ ] VIDROS – OBS: ________________\n` +
    `[ ] LOUÇAS/METAIS – OK / [ ] LOUÇAS/METAIS – OBS: ________________\n\n` +
    `OBSERVAÇÕES GERAIS:\n` +
    `_______________________________________________\n\n` +
    `Assinatura do Vistoriador: ________________________`
};

// CONSTANTES
const DOCUMENT_CATEGORIES = {
  intermediacao: { label: 'Intermediação', icon: ShieldCheck, color: 'text-[#0217ff]', bg: 'bg-[#0217ff]/10' },
  venda: { label: 'Venda', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
  locacao: { label: 'Locação', icon: Key, color: 'text-orange-500', bg: 'bg-orange-500/10' }
};

const DOCUMENT_STATUS = {
  rascunho: { label: 'Rascunho', icon: FileMinus, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
  ativo: { label: 'Ativo', icon: FileCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
  concluido: { label: 'Concluído', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  cancelado: { label: 'Cancelado', icon: FileWarning, color: 'text-red-500', bg: 'bg-red-500/10' }
};

export default function ContractsPage() {
  // Forçar modo claro
  const { user } = useGlobal();
  const darkMode = false;
  
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [step, setStep] = useState(1);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [formData, setFormData] = useState({
    category: '', 
    client_name: '', 
    client_phone: '',
    client_document: '',
    property_id: '', 
    property_name: '', 
    location: '',
    value: '', 
    document_type: '', 
    final_content: '', 
    start_date: '',
    end_date: '',
    matricula: '',
    sinal: '',
    parcelas: '',
    posse_percent: '',
    city: '',
    status: 'rascunho' as Contract['status']
  });

  useEffect(() => { 
    if (user) {
      loadData(); 
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      if (!user?.id) return;

      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*, properties(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;
      setContracts(contractsData || []);

      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, location')
        .eq('user_id', user.id)
        .order('title');

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const clientsGrouped = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];

    const filtered = contracts.filter(c => 
      (c.client_name && c.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.document_type && c.document_type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groups: { [key: string]: any } = {};
    
    filtered.forEach(c => {
      const clientName = c.client_name || 'Cliente não identificado';
      
      if (!groups[clientName]) {
        groups[clientName] = { 
          name: clientName, 
          docs: [],
          totalValue: 0,
          lastUpdate: c.created_at
        };
      }
      
      groups[clientName].docs.push(c);
      groups[clientName].totalValue += c.value || 0;
      
      if (new Date(c.created_at) > new Date(groups[clientName].lastUpdate)) {
        groups[clientName].lastUpdate = c.created_at;
      }
    });
    
    return Object.values(groups).sort((a: any, b: any) => 
      new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
    );
  }, [contracts, searchTerm]);

  const handleGenerate = () => {
    const prop = properties.find(p => p.id === formData.property_id);
    const template = DOCUMENT_TEMPLATES[formData.document_type];
    
    if (!template) return;
    
    const content = template({
      ...formData,
      property_name: prop?.title || formData.property_name,
      location: prop?.location || formData.location,
      value: formData.value
    });
    
    setFormData({ ...formData, final_content: content, property_name: prop?.title });
    setStep(4);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        alert('Usuário não autenticado');
        return;
      }

      if (!formData.client_name) {
        alert('Nome do cliente é obrigatório');
        return;
      }

      if (!formData.document_type) {
        alert('Tipo de documento é obrigatório');
        return;
      }

      const cleanValue = unformat(formData.value);
      const cleanSinal = unformat(formData.sinal);
      const cleanParcelas = unformat(formData.parcelas);
      
      const startDate = formData.start_date?.trim() || null;
      const endDate = formData.end_date?.trim() || null;
      
      const cleanPhone = formData.client_phone ? unformat(formData.client_phone) : null;
      const cleanDocument = formData.client_document ? unformat(formData.client_document) : null;
      
      const prop = properties.find(p => p.id === formData.property_id);
      
      const payload = {
        user_id: user.id,
        category: formData.category,
        client_name: formData.client_name,
        client_phone: cleanPhone,
        client_document: cleanDocument,
        property_id: formData.property_id || null,
        property_name: prop?.title || null,
        location: prop?.location || formData.location || null,
        value: cleanValue ? parseFloat(cleanValue) / 100 : 0,
        document_type: formData.document_type,
        final_content: formData.final_content,
        content: formData.final_content,
        start_date: startDate,
        end_date: endDate,
        matricula: formData.matricula || null,
        sinal: cleanSinal ? parseFloat(cleanSinal) / 100 : null,
        parcelas: cleanParcelas ? parseFloat(cleanParcelas) / 100 : null,
        posse_percent: formData.posse_percent || null,
        city: formData.city || null,
        status: formData.status,
        checklist: [
          { task: "RG / CPF", done: false, required: true },
          { task: "Certidão de Matrícula Atualizada", done: false, required: true },
          { task: "Certidões Negativas", done: false, required: true },
          { task: "Comprovante de Endereço", done: false, required: true },
          { task: "Estado Civil e Regime de Bens", done: false, required: true }
        ]
      };

      let error;
      if (editingContract) {
        ({ error } = await supabase
          .from('contracts')
          .update(payload)
          .eq('id', editingContract.id));
      } else {
        ({ error } = await supabase
          .from('contracts')
          .insert([payload]));
      }

      if (error) throw error;
      
      setShowModal(false);
      setStep(1);
      setEditingContract(null);
      await loadData();
      
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setShowDeleteConfirm(null);
      await loadData();
    } catch (error: any) {
      alert('Erro ao deletar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistItem = async (contractId: string, index: number, done: boolean) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract?.checklist) return;

    const newChecklist = [...contract.checklist];
    newChecklist[index].done = done;

    const { error } = await supabase
      .from('contracts')
      .update({ checklist: newChecklist })
      .eq('id', contractId);

    if (!error) await loadData();
  };

  const getDocumentTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: 'bg-white border-zinc-200 shadow-2xl',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400',
    text: darkMode ? 'text-white' : 'text-zinc-900',
    secondaryText: darkMode ? 'text-zinc-400' : 'text-zinc-500',
    border: darkMode ? 'border-white/5' : 'border-zinc-200',
    hover: darkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Documentação</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Gestão de Contratos e Termos • {contracts.length} documentos
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 pr-4 py-2.5 rounded-xl text-sm ${theme.input} w-full md:w-64`}
            />
          </div>
          
          <button 
            onClick={() => {
              setEditingContract(null);
              setFormData({
                category: '', client_name: '', client_phone: '', client_document: '',
                property_id: '', property_name: '', location: '', value: '', 
                document_type: '', final_content: '', start_date: '', end_date: '',
                matricula: '', sinal: '', parcelas: '', posse_percent: '', city: '',
                status: 'rascunho'
              });
              setStep(1);
              setShowModal(true);
            }} 
            className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-[#0217ff]/90 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Novo Documento
          </button>
        </div>
      </div>

      {/* FILTROS POR CATEGORIA */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setFilterCategory('todos')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all
            ${filterCategory === 'todos' 
              ? 'bg-[#0217ff] text-white' 
              : `${theme.card} ${theme.text} ${theme.hover}`}`}
        >
          Todos
        </button>
        {Object.entries(DOCUMENT_CATEGORIES).map(([key, cat]) => {
          const Icon = cat.icon;
          return (
            <button
              key={key}
              onClick={() => setFilterCategory(key)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2
                ${filterCategory === key 
                  ? 'bg-[#0217ff] text-white' 
                  : `${theme.card} ${theme.text} ${theme.hover}`}`}
            >
              <Icon size={12} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#0217ff]" size={40} />
        </div>
      ) : clientsGrouped.length === 0 ? (
        <div className={`${theme.card} rounded-[32px] border p-12 text-center`}>
          <FolderOpen size={48} className="mx-auto mb-4 text-zinc-300" />
          <p className={`${theme.text} font-bold`}>
            {searchTerm ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado'}
          </p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">
            {searchTerm ? (
              <>
                Tente outros termos de busca ou{' '}
                <button onClick={() => setSearchTerm('')} className="text-[#0217ff] underline">
                  limpar busca
                </button>
              </>
            ) : (
              'Clique em "Novo Documento" para começar'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {clientsGrouped.map((client: any) => (
            <div key={client.name} className={`${theme.card} rounded-[32px] border overflow-hidden transition-all hover:shadow-md`}>
              <div 
                onClick={() => setSelectedClient(selectedClient === client.name ? null : client.name)} 
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0217ff]/10 text-[#0217ff] rounded-2xl flex items-center justify-center font-bold text-lg">
                    {client.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-bold ${theme.text}`}>{client.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">
                        {client.docs.length} {client.docs.length === 1 ? 'Documento' : 'Documentos'}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                      <p className="text-[10px] font-bold text-[#0217ff]">
                        {formatCurrency(client.totalValue)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-zinc-400 font-bold">
                    {client.lastUpdate ? format(new Date(client.lastUpdate), "dd/MM/yyyy", { locale: ptBR }) : ''}
                  </span>
                  <ChevronRight 
                    size={20} 
                    className={`text-zinc-400 transition-transform duration-300 
                      ${selectedClient === client.name ? 'rotate-90' : ''}`} 
                  />
                </div>
              </div>

              {selectedClient === client.name && (
                <div className="px-6 pb-6 space-y-4 border-t border-zinc-100 dark:border-white/5 pt-6 bg-zinc-50/30 dark:bg-white/5">
                  {client.docs.map((doc: Contract) => {
                    const CategoryIcon = DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES]?.icon || FileText;
                    const categoryColor = DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES]?.color || 'text-zinc-500';
                    const StatusIcon = DOCUMENT_STATUS[doc.status]?.icon || FileText;
                    const statusColor = DOCUMENT_STATUS[doc.status]?.color || 'text-zinc-500';
                    
                    return (
                      <div key={doc.id} className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 hover:shadow-lg transition-all">
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${categoryColor.replace('text', 'bg')}/10`}>
                                  <CategoryIcon size={16} className={categoryColor} />
                                </div>
                                <span className={`text-xs font-bold ${categoryColor}`}>
                                  {DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES]?.label}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                <span className={`text-xs font-bold flex items-center gap-1 ${statusColor}`}>
                                  <StatusIcon size={12} />
                                  {DOCUMENT_STATUS[doc.status]?.label}
                                </span>
                              </div>
                              
                              <h4 className={`font-bold text-lg ${theme.text}`}>
                                {getDocumentTypeLabel(doc.document_type)}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold">
                                <span className="flex items-center gap-1 text-zinc-500">
                                  <Home size={12} />
                                  {doc.properties?.title || 'Imóvel não especificado'}
                                </span>
                                {doc.value > 0 && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                    <span className="flex items-center gap-1 text-[#0217ff]">
                                      <DollarSign size={12} />
                                      {formatCurrency(doc.value)}
                                    </span>
                                  </>
                                )}
                                <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                <span className="flex items-center gap-1 text-zinc-500">
                                  <Calendar size={12} />
                                  {format(new Date(doc.created_at), "dd/MM/yyyy")}
                                </span>
                              </div>

                              {(doc.client_phone || doc.client_document) && (
                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                                  {doc.client_phone && (
                                    <span className="flex items-center gap-1 text-zinc-500">
                                      <Phone size={10} />
                                      {formatPhone(doc.client_phone)}
                                    </span>
                                  )}
                                  {doc.client_document && (
                                    <span className="flex items-center gap-1 text-zinc-500">
                                      <CreditCard size={10} />
                                      {doc.client_document.length <= 11 ? 'CPF' : 'CNPJ'}: {formatDocument(doc.client_document)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingContract(doc);
                                  setFormData({
                                    ...doc,
                                    final_content: doc.final_content || doc.content || "<p>Documento sem conteúdo</p>",
                                    value: doc.value ? formatCurrencyInput(doc.value.toString()) : '',
                                    sinal: doc.sinal ? formatCurrencyInput(doc.sinal.toString()) : '',
                                    parcelas: doc.parcelas ? formatCurrencyInput(doc.parcelas.toString()) : '',
                                    start_date: doc.start_date || '',
                                    end_date: doc.end_date || '',
                                    client_phone: doc.client_phone ? formatPhone(doc.client_phone) : '',
                                    client_document: doc.client_document ? formatDocument(doc.client_document) : ''
                                  });
                                  setIsViewOnly(true);
                                  setStep(4);
                                  setShowModal(true);
                                }}
                                className="p-2.5 bg-zinc-100 dark:bg-white/10 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-[#0217ff] hover:text-white transition-all"
                                title="Visualizar"
                              >
                                <Eye size={16} />
                              </button>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingContract(doc);
                                  setFormData({
                                    ...doc,
                                    final_content: doc.final_content || doc.content || "<p>Documento sem conteúdo</p>",
                                    value: doc.value ? formatCurrencyInput(doc.value.toString()) : '',
                                    sinal: doc.sinal ? formatCurrencyInput(doc.sinal.toString()) : '',
                                    parcelas: doc.parcelas ? formatCurrencyInput(doc.parcelas.toString()) : '',
                                    start_date: doc.start_date || '',
                                    end_date: doc.end_date || '',
                                    client_phone: doc.client_phone ? formatPhone(doc.client_phone) : '',
                                    client_document: doc.client_document ? formatDocument(doc.client_document) : ''
                                  });
                                  setIsViewOnly(false);
                                  setStep(4);
                                  setShowModal(true);
                                }}
                                className="p-2.5 bg-zinc-100 dark:bg-white/10 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-[#0217ff] hover:text-white transition-all"
                                title="Editar"
                              >
                                <Edit3 size={16} />
                              </button>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(doc.id);
                                }}
                                className="p-2.5 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className={`p-4 rounded-xl bg-zinc-100 text-xs leading-relaxed max-h-32 overflow-y-auto`}>
                            {doc.content?.substring(0, 300)}...
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button className="px-4 py-2 bg-[#0217ff] text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-[#0217ff]/90 transition-all">
                              <Download size={14}/> Baixar PDF
                            </button>
                            <button className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all">
                              <Printer size={14}/> Imprimir
                            </button>
                            <button className="p-2 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 transition-all">
                              <Share2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-white/5 lg:pl-6 pt-4 lg:pt-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-[#0217ff] uppercase tracking-wider flex items-center gap-2">
                              <ClipboardCheck size={14} />
                              Checklist Documental
                            </p>
                            <span className="text-[9px] font-bold text-zinc-400">
                              {doc.checklist?.filter((i: ChecklistItem) => i.done).length || 0}/{doc.checklist?.length || 0}
                            </span>
                          </div>
                          
                          {doc.checklist?.map((item: ChecklistItem, i: number) => (
                            <div 
                              key={i} 
                              className={`flex items-center gap-2 p-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer
                                ${item.done 
                                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                  : `${theme.input} hover:bg-zinc-100 dark:hover:bg-white/10`}`}
                              onClick={() => updateChecklistItem(doc.id, i, !item.done)}
                            >
                              <CheckSquare 
                                size={14} 
                                className={item.done ? 'text-green-500' : 'text-zinc-400'} 
                                fill={item.done ? 'currentColor' : 'none'}
                              />
                              <span className="flex-1">{item.task}</span>
                              {item.required && !item.done && (
                                <AlertCircle size={10} className="text-amber-500" />
                              )}
                            </div>
                          ))}
                          
                          <button className="w-full mt-2 p-2 border border-dashed border-zinc-300 dark:border-white/10 rounded-lg text-[8px] font-bold text-zinc-400 uppercase hover:border-[#0217ff] hover:text-[#0217ff] transition-all">
                            + Adicionar Item
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-[32px] p-8 text-center shadow-2xl border border-zinc-200">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h3 className={`text-lg font-bold text-zinc-900 mb-2`}>Confirmar exclusão</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Esta ação não poderá ser desfeita. O documento será permanentemente removido.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 bg-zinc-100 rounded-xl font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO/EDIÇÃO - CORRIGIDO COM Z-INDEX ALTOS E FORÇA DE CORES */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col relative z-[10000]">
            {/* 🔥 BLOQUEIA DARK MODE DENTRO DO MODAL */}
            <div className="bg-white text-black [&_*]:!text-black [&_*]:!bg-white">
              
              {/* MODAL HEADER */}
              <div className="p-8 border-b border-zinc-200 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                          ${step >= s 
                            ? 'bg-[#0217ff] text-white' 
                            : 'bg-zinc-100 text-zinc-400'}`}>
                          {step > s ? <Check size={14} /> : s}
                        </div>
                        {s < 4 && (
                          <div className={`w-6 h-[2px] ${step > s ? 'bg-[#0217ff]' : 'bg-zinc-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    {editingContract ? 'Editar Documento' : 
                      step === 1 ? 'Selecione a Categoria' : 
                      step === 2 ? 'Escolha o Tipo de Documento' : 
                      step === 3 ? 'Dados do Documento' : 
                      'Revisão Final'}
                  </h2>
                </div>
                <button 
                  onClick={() => { 
                    setShowModal(false); 
                    setStep(1);
                    setEditingContract(null);
                  }} 
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                
                {/* STEP 1: CATEGORIA */}
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(DOCUMENT_CATEGORIES).map(([key, cat]) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => { 
                            setFormData({...formData, category: key}); 
                            setStep(2); 
                          }}
                          className={`${theme.card} p-8 rounded-3xl border text-center hover:border-[#0217ff] hover:scale-[1.02] transition-all group`}
                        >
                          <div className={`w-16 h-16 ${cat.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon size={32} className={cat.color} />
                          </div>
                          <p className={`font-bold text-sm uppercase ${theme.text}`}>{cat.label}</p>
                          <p className="text-[8px] text-zinc-400 mt-2">
                            {key === 'intermediacao' && 'Autorizações e Termos de Visita'}
                            {key === 'venda' && 'Promessas de Compra e Venda'}
                            {key === 'locacao' && 'Contratos e Termos de Locação'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* STEP 2: TIPO ESPECÍFICO */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.category === 'intermediacao' && (
                        <>
                          <DocumentTypeCard
                            type="autorizacao_venda"
                            label="Autorização de Venda"
                            description="Autorização exclusiva para comercialização"
                            icon={ShieldCheck}
                            selected={formData.document_type}
                            onClick={() => { setFormData({...formData, document_type: 'autorizacao_venda'}); setStep(3); }}
                            theme={theme}
                          />
                          <DocumentTypeCard
                            type="termo_visita"
                            label="Termo de Visita"
                            description="Registro de visita ao imóvel"
                            icon={Eye}
                            selected={formData.document_type}
                            onClick={() => { setFormData({...formData, document_type: 'termo_visita'}); setStep(3); }}
                            theme={theme}
                          />
                        </>
                      )}
                      
                      {formData.category === 'venda' && (
                        <DocumentTypeCard
                          type="promessa_venda"
                          label="Promessa de Compra e Venda"
                          description="Contrato preliminar de compra e venda"
                          icon={FileSignature}
                          selected={formData.document_type}
                          onClick={() => { setFormData({...formData, document_type: 'promessa_venda'}); setStep(3); }}
                          theme={theme}
                        />
                      )}
                      
                      {formData.category === 'locacao' && (
                        <>
                          <DocumentTypeCard
                            type="locacao_residencial"
                            label="Contrato de Locação"
                            description="Locação residencial com prazo de 30 meses"
                            icon={Key}
                            selected={formData.document_type}
                            onClick={() => { setFormData({...formData, document_type: 'locacao_residencial'}); setStep(3); }}
                            theme={theme}
                          />
                          <DocumentTypeCard
                            type="termo_entrega_chaves"
                            label="Entrega de Chaves"
                            description="Termo de entrega e recebimento"
                            icon={Home}
                            selected={formData.document_type}
                            onClick={() => { setFormData({...formData, document_type: 'termo_entrega_chaves'}); setStep(3); }}
                            theme={theme}
                          />
                          <DocumentTypeCard
                            type="termo_vistoria"
                            label="Termo de Vistoria"
                            description="Checklist detalhado do imóvel"
                            icon={ClipboardCheck}
                            selected={formData.document_type}
                            onClick={() => { setFormData({...formData, document_type: 'termo_vistoria'}); setStep(3); }}
                            theme={theme}
                          />
                        </>
                      )}
                    </div>

                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => setStep(1)}
                        className="px-6 py-3 text-sm text-zinc-500 hover:text-[#0217ff] transition-colors"
                      >
                        ← Voltar para Categorias
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DADOS DO DOCUMENTO */}
                {step === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest flex items-center gap-2">
                        <User size={14} /> Dados do Cliente
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[9px] font-bold uppercase text-zinc-400">Nome Completo *</label>
                          <input 
                            className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none font-bold`}
                            placeholder="Ex: João da Silva"
                            value={formData.client_name}
                            onChange={e => setFormData({...formData, client_name: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                            <CreditCard size={12} /> CPF/CNPJ
                          </label>
                          <input 
                            className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none`}
                            placeholder="000.000.000-00"
                            value={formData.client_document}
                            onChange={e => setFormData({...formData, client_document: formatDocument(e.target.value)})}
                            maxLength={18}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                            <Phone size={12} /> Telefone
                          </label>
                          <input 
                            className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none`}
                            placeholder="(11) 99999-9999"
                            value={formData.client_phone}
                            onChange={e => setFormData({...formData, client_phone: formatPhone(e.target.value)})}
                            maxLength={15}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest flex items-center gap-2">
                        <Home size={14} /> Dados do Imóvel
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[9px] font-bold uppercase text-zinc-400">Imóvel</label>
                          <select 
                            className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none`}
                            value={formData.property_id}
                            onChange={e => setFormData({...formData, property_id: e.target.value})}
                          >
                            <option value="">Selecione um imóvel...</option>
                            {properties.map(p => (
                              <option key={p.id} value={p.id}>{p.title} - {p.location}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase text-zinc-400">Valor (R$)</label>
                          <input 
                            className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none font-bold text-[#0217ff]`}
                            placeholder="0,00"
                            value={formData.value}
                            onChange={e => setFormData({...formData, value: formatCurrencyInput(e.target.value)})}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase text-zinc-400">Cidade/Foro</label>
                          <input 
                            className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none`}
                            placeholder="São Paulo - SP"
                            value={formData.city}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {formData.document_type === 'promessa_venda' && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase text-[#0217ff] tracking-widest">Detalhes da Venda</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase text-zinc-400">Matrícula</label>
                            <input 
                              className={`${theme.input} w-full px-4 py-3 rounded-xl`}
                              placeholder="Nº da matrícula"
                              value={formData.matricula}
                              onChange={e => setFormData({...formData, matricula: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase text-zinc-400">Sinal (R$)</label>
                            <input 
                              className={`${theme.input} w-full px-4 py-3 rounded-xl`}
                              placeholder="0,00"
                              value={formData.sinal}
                              onChange={e => setFormData({...formData, sinal: formatCurrencyInput(e.target.value)})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase text-zinc-400">% Posse</label>
                            <input 
                              className={`${theme.input} w-full px-4 py-3 rounded-xl`}
                              placeholder="30%"
                              value={formData.posse_percent}
                              onChange={e => setFormData({...formData, posse_percent: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-8">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 py-4 bg-zinc-100 rounded-2xl font-bold uppercase text-[10px] text-zinc-500 hover:bg-zinc-200 transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-[2] py-4 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#0217ff]/90 transition-all shadow-xl"
                      >
                        Gerar Documento
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVISÃO FINAL */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex gap-3 items-start">
                      <div className="text-amber-600 mt-1">⚠️</div>
                      <div>
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                          Revisão obrigatória
                        </p>
                        <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                          Complete as informações entre colchetes <strong>[____]</strong> antes de finalizar.
                          Este documento é uma minuta e deve ser validado por um advogado.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold uppercase text-zinc-400">Conteúdo do Documento</label>
                        <span className="text-[8px] text-zinc-500">
                          {formData.final_content?.length || 0} caracteres
                        </span>
                      </div>
                      <div className="bg-white rounded-2xl p-2 border border-zinc-200 shadow-sm relative isolate">
                        <div className="bg-white text-black [&_*]:!text-black [&_*]:!bg-white">
                          <ContractEditor
                            value={formData.final_content || "<p></p>"}
                            onChange={(val: string) =>
                              setFormData(prev => ({ ...prev, final_content: val }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50">
                      <span className="text-[9px] font-bold uppercase text-zinc-400">Status:</span>
                      <select
                        className="bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl text-xs text-zinc-900"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as Contract['status']})}
                      >
                        <option value="rascunho">Rascunho</option>
                        <option value="ativo">Ativo</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setStep(3)}
                        className="flex-1 py-4 bg-zinc-100 rounded-2xl font-bold uppercase text-[10px] text-zinc-500 hover:bg-zinc-200 transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-[2] py-4 bg-[#0217ff] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0217ff]/90 transition-all shadow-xl disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin mx-auto" size={18} />
                        ) : (
                          editingContract ? 'Atualizar Documento' : 'Salvar na Pasta'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTE AUXILIAR
function DocumentTypeCard({ type, label, description, icon: Icon, selected, onClick, theme }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:shadow-lg
        ${selected === type 
          ? 'border-[#0217ff] bg-[#0217ff]/5' 
          : `${theme.card} ${theme.hover}`}`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${selected === type ? 'bg-[#0217ff]' : 'bg-zinc-100'}`}>
          <Icon size={20} className={selected === type ? 'text-white' : 'text-zinc-500'} />
        </div>
        <div>
          <h4 className={`font-bold text-sm ${theme.text}`}>{label}</h4>
          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}