import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, User, ChevronRight, CheckSquare, 
  Trash2, X, CheckCircle2, FileSignature, 
  Loader2, Briefcase, FileText, ArrowRight, Save, 
  AlertCircle, ShieldCheck, ClipboardCheck, Key, FilePlus,
  Download, Edit3, Eye, Clock, Tag, FolderOpen,
  Calendar, DollarSign, Home, Printer, Share2,
  Archive, Copy, FileCheck, FileMinus, FileWarning,
  Check, Phone, CreditCard, Filter, Grid3X3, List,
  BarChart3, TrendingUp, Award, Users, Building2,
  MessageCircle, Mail, Link2, ExternalLink, Star,
  ChevronDown, ChevronUp, PieChart, Percent
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
  sinal?: number;
  parcelas?: number;
  matricula?: string;
  city?: string;
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

const formatCompactCurrency = (value: number) => {
  if (!value || isNaN(value)) return 'R$ 0';
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value);
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
    `2. PREÇO: O valor mínimo de venda é de ${formatCurrency(parseFloat(d.value) || 0)}.\n\n` +
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
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
    if (user) loadData(); 
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

  // Estatísticas
  const stats = useMemo(() => {
    const total = contracts.length;
    const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0);
    const byCategory = {
      intermediacao: contracts.filter(c => c.category === 'intermediacao').length,
      venda: contracts.filter(c => c.category === 'venda').length,
      locacao: contracts.filter(c => c.category === 'locacao').length
    };
    const byStatus = {
      rascunho: contracts.filter(c => c.status === 'rascunho').length,
      ativo: contracts.filter(c => c.status === 'ativo').length,
      concluido: contracts.filter(c => c.status === 'concluido').length,
      cancelado: contracts.filter(c => c.status === 'cancelado').length
    };
    return { total, totalValue, byCategory, byStatus };
  }, [contracts]);

  const clientsGrouped = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];

    let filtered = contracts.filter(c => 
      (c.client_name && c.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.document_type && c.document_type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filterCategory !== 'todos') {
      filtered = filtered.filter(c => c.category === filterCategory);
    }

    if (filterStatus !== 'todos') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

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
  }, [contracts, searchTerm, filterCategory, filterStatus]);

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
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0217ff] to-[#00c6ff] rounded-xl flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <h1 className={`text-3xl font-black ${theme.text}`}>Documentação</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Gestão de Contratos e Termos • {stats.total} documentos • {formatCompactCurrency(stats.totalValue)} em contratos
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
            className="px-6 py-2.5 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Novo Documento
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Total</p>
          <p className={`text-2xl font-black ${theme.text}`}>{stats.total}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">VGV Total</p>
          <p className="text-lg font-black text-[#0217ff] truncate">{formatCompactCurrency(stats.totalValue)}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Intermediação</p>
          <p className="text-2xl font-black text-[#0217ff]">{stats.byCategory.intermediacao}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Venda</p>
          <p className="text-2xl font-black text-green-500">{stats.byCategory.venda}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Locação</p>
          <p className="text-2xl font-black text-orange-500">{stats.byCategory.locacao}</p>
        </div>
        <div className={`${theme.card} p-4 rounded-2xl border`}>
          <p className="text-[9px] font-bold uppercase text-zinc-400">Ativos</p>
          <p className="text-2xl font-black text-green-500">{stats.byStatus.ativo}</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
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
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
              showFilters ? 'bg-[#0217ff] text-white border-[#0217ff]' : `${theme.card} ${theme.text}`
            }`}
          >
            <Filter size={14} /> Filtros
          </button>
          
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-100">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
            >
              <Grid3X3 size={18} className={viewMode === 'grid' ? 'text-[#0217ff]' : 'text-zinc-400'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
            >
              <List size={18} className={viewMode === 'list' ? 'text-[#0217ff]' : 'text-zinc-400'} />
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDED FILTERS */}
      {showFilters && (
        <div className={`p-5 rounded-2xl border ${theme.border} ${theme.card} animate-fade-in`}>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[9px] font-bold uppercase text-zinc-400">Status:</span>
            {Object.entries(DOCUMENT_STATUS).map(([key, status]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? 'todos' : key)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all ${
                  filterStatus === key 
                    ? `${status.bg} ${status.color}` 
                    : `${theme.badgeBg} text-zinc-500`
                }`}
              >
                {status.label}
              </button>
            ))}
            {filterStatus !== 'todos' && (
              <button
                onClick={() => setFilterStatus('todos')}
                className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase bg-zinc-100 text-zinc-500 hover:bg-red-500 hover:text-white transition-all"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#0217ff]" size={40} />
        </div>
      ) : clientsGrouped.length === 0 ? (
        <div className={`${theme.card} rounded-[32px] border p-12 text-center`}>
          <FolderOpen size={48} className="mx-auto mb-4 text-zinc-300" />
          <p className={`${theme.text} font-bold`}>
            {searchTerm || filterCategory !== 'todos' || filterStatus !== 'todos' 
              ? 'Nenhum contrato encontrado' 
              : 'Nenhum contrato cadastrado'}
          </p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">
            {(searchTerm || filterCategory !== 'todos' || filterStatus !== 'todos') ? (
              <>
                Tente outros termos de busca ou{' '}
                <button onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('todos');
                  setFilterStatus('todos');
                }} className="text-[#0217ff] underline">
                  limpar filtros
                </button>
              </>
            ) : (
              'Clique em "Novo Documento" para começar'
            )}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientsGrouped.map((client: any) => (
            <div key={client.name} className={`${theme.card} rounded-2xl border overflow-hidden transition-all hover:shadow-lg`}>
              <div 
                onClick={() => setSelectedClient(selectedClient === client.name ? null : client.name)} 
                className="p-5 bg-gradient-to-r from-[#0217ff]/5 to-transparent cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0217ff] rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {client.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${theme.text}`}>{client.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">
                        {client.docs.length} documento{client.docs.length !== 1 ? 's' : ''}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                      <p className="text-[9px] font-bold text-[#0217ff]">
                        {formatCompactCurrency(client.totalValue)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight 
                    size={18} 
                    className={`text-zinc-400 transition-transform duration-300 
                      ${selectedClient === client.name ? 'rotate-90' : ''}`} 
                  />
                </div>
              </div>

              {selectedClient === client.name && (
                <div className="p-4 space-y-3 border-t border-zinc-100">
                  {client.docs.map((doc: Contract) => {
                    const CategoryIcon = DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES]?.icon || FileText;
                    const categoryColor = DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES]?.color || 'text-zinc-500';
                    const StatusIcon = DOCUMENT_STATUS[doc.status]?.icon || FileText;
                    const statusColor = DOCUMENT_STATUS[doc.status]?.color || 'text-zinc-500';
                    
                    return (
                      <div key={doc.id} className="p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CategoryIcon size={14} className={categoryColor} />
                              <span className={`text-[9px] font-bold ${categoryColor}`}>
                                {DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES]?.label}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                              <StatusIcon size={12} className={statusColor} />
                              <span className={`text-[9px] font-bold ${statusColor}`}>
                                {DOCUMENT_STATUS[doc.status]?.label}
                              </span>
                            </div>
                            <h4 className={`font-bold text-sm mb-1 ${theme.text}`}>
                              {getDocumentTypeLabel(doc.document_type)}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-[9px] text-zinc-500">
                              <span className="flex items-center gap-1"><Home size={10} /> {doc.properties?.title || 'Imóvel não especificado'}</span>
                              {doc.value > 0 && <span className="flex items-center gap-1 text-[#0217ff]"><DollarSign size={10} /> {formatCompactCurrency(doc.value)}</span>}
                              <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(doc.created_at), "dd/MM/yyyy")}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingContract(doc); setFormData({ ...doc, final_content: doc.final_content || doc.content || "<p></p>", value: doc.value ? formatCurrencyInput(doc.value.toString()) : '' }); setIsViewOnly(true); setStep(4); setShowModal(true); }} className="p-2 rounded-lg hover:bg-white transition-all"><Eye size={14} /></button>
                            <button onClick={() => { setEditingContract(doc); setFormData({ ...doc, final_content: doc.final_content || doc.content || "<p></p>", value: doc.value ? formatCurrencyInput(doc.value.toString()) : '' }); setIsViewOnly(false); setStep(4); setShowModal(true); }} className="p-2 rounded-lg hover:bg-white transition-all"><Edit3 size={14} /></button>
                            <button onClick={() => setShowDeleteConfirm(doc.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {clientsGrouped.map((client: any) => (
            <div key={client.name} className={`${theme.card} rounded-2xl border overflow-hidden`}>
              <div 
                onClick={() => setSelectedClient(selectedClient === client.name ? null : client.name)} 
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-zinc-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0217ff] rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {client.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-bold ${theme.text}`}>{client.name}</h3>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">
                      {client.docs.length} documento{client.docs.length !== 1 ? 's' : ''} • {formatCompactCurrency(client.totalValue)}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className={`text-zinc-400 transition-transform ${selectedClient === client.name ? 'rotate-90' : ''}`} />
              </div>
              {selectedClient === client.name && (
                <div className="divide-y divide-zinc-100 border-t">
                  {client.docs.map((doc: Contract) => {
                    const CategoryIcon = DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES]?.icon || FileText;
                    const categoryColor = DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES]?.color || 'text-zinc-500';
                    
                    return (
                      <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-all">
                        <div className="flex items-center gap-4 flex-1">
                          <CategoryIcon size={20} className={categoryColor} />
                          <div>
                            <h4 className="font-bold text-sm">{getDocumentTypeLabel(doc.document_type)}</h4>
                            <p className="text-[9px] text-zinc-500">{doc.properties?.title || 'Imóvel não especificado'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#0217ff]">{formatCompactCurrency(doc.value)}</p>
                          <p className="text-[9px] text-zinc-400">{format(new Date(doc.created_at), "dd/MM/yyyy")}</p>
                        </div>
                        <div className="flex gap-1 ml-4">
                          <button onClick={() => { setEditingContract(doc); setFormData({ ...doc, final_content: doc.final_content || doc.content || "<p></p>" }); setIsViewOnly(true); setStep(4); setShowModal(true); }} className="p-2 rounded-lg hover:bg-white"><Eye size={14} /></button>
                          <button onClick={() => { setEditingContract(doc); setFormData({ ...doc, final_content: doc.final_content || doc.content || "<p></p>" }); setIsViewOnly(false); setStep(4); setShowModal(true); }} className="p-2 rounded-lg hover:bg-white"><Edit3 size={14} /></button>
                          <button onClick={() => setShowDeleteConfirm(doc.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 size={14} /></button>
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
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-zinc-500 mb-6">Esta ação não poderá ser desfeita. O documento será permanentemente removido.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-zinc-100 rounded-xl font-bold text-sm">Cancelar</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} disabled={loading} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden md:rounded-[40px] flex flex-col relative z-[10000]">
            <div className="bg-white text-black [&_*]:!text-black [&_*]:!bg-white">
              <div className="p-8 border-b border-zinc-200 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#0217ff] text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                          {step > s ? <Check size={14} /> : s}
                        </div>
                        {s < 4 && <div className={`w-6 h-[2px] ${step > s ? 'bg-[#0217ff]' : 'bg-zinc-200'}`} />}
                      </div>
                    ))}
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    {editingContract ? 'Editar Documento' : step === 1 ? 'Selecione a Categoria' : step === 2 ? 'Escolha o Tipo de Documento' : step === 3 ? 'Dados do Documento' : 'Revisão Final'}
                  </h2>
                </div>
                <button onClick={() => { setShowModal(false); setStep(1); setEditingContract(null); }} className="p-2 text-zinc-500 hover:text-red-500"><X size={28} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                {/* STEP 1 - Categoria */}
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(DOCUMENT_CATEGORIES).map(([key, cat]) => {
                      const Icon = cat.icon;
                      return (
                        <button key={key} onClick={() => { setFormData({...formData, category: key}); setStep(2); }} className={`${theme.card} p-8 rounded-3xl border text-center hover:border-[#0217ff] hover:scale-[1.02] transition-all group`}>
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

                {/* STEP 2 - Tipo de Documento */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.category === 'intermediacao' && (
                        <>
                          <DocumentTypeCard type="autorizacao_venda" label="Autorização de Venda" description="Autorização exclusiva para comercialização" icon={ShieldCheck} selected={formData.document_type} onClick={() => { setFormData({...formData, document_type: 'autorizacao_venda'}); setStep(3); }} theme={theme} />
                          <DocumentTypeCard type="termo_visita" label="Termo de Visita" description="Registro de visita ao imóvel" icon={Eye} selected={formData.document_type} onClick={() => { setFormData({...formData, document_type: 'termo_visita'}); setStep(3); }} theme={theme} />
                        </>
                      )}
                      {formData.category === 'venda' && (
                        <DocumentTypeCard type="promessa_venda" label="Promessa de Compra e Venda" description="Contrato preliminar de compra e venda" icon={FileSignature} selected={formData.document_type} onClick={() => { setFormData({...formData, document_type: 'promessa_venda'}); setStep(3); }} theme={theme} />
                      )}
                      {formData.category === 'locacao' && (
                        <>
                          <DocumentTypeCard type="locacao_residencial" label="Contrato de Locação" description="Locação residencial com prazo de 30 meses" icon={Key} selected={formData.document_type} onClick={() => { setFormData({...formData, document_type: 'locacao_residencial'}); setStep(3); }} theme={theme} />
                          <DocumentTypeCard type="termo_entrega_chaves" label="Entrega de Chaves" description="Termo de entrega e recebimento" icon={Home} selected={formData.document_type} onClick={() => { setFormData({...formData, document_type: 'termo_entrega_chaves'}); setStep(3); }} theme={theme} />
                          <DocumentTypeCard type="termo_vistoria" label="Termo de Vistoria" description="Checklist detalhado do imóvel" icon={ClipboardCheck} selected={formData.document_type} onClick={() => { setFormData({...formData, document_type: 'termo_vistoria'}); setStep(3); }} theme={theme} />
                        </>
                      )}
                    </div>
                    <div className="flex justify-center pt-6">
                      <button onClick={() => setStep(1)} className="px-6 py-3 text-sm text-zinc-500 hover:text-[#0217ff]">← Voltar para Categorias</button>
                    </div>
                  </div>
                )}

                {/* STEP 3 - Dados do Documento */}
                {step === 3 && (
                  <div className="space-y-8">
                    {/* Dados do Cliente */}
                    <div><h3 className="text-[10px] font-bold uppercase text-[#0217ff] mb-4">Dados do Cliente</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><input className={`${theme.input} w-full px-5 py-4 rounded-xl`} placeholder="Nome Completo *" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} /></div>
                        <div><input className={`${theme.input} w-full px-5 py-4 rounded-xl`} placeholder="CPF/CNPJ" value={formData.client_document} onChange={e => setFormData({...formData, client_document: formatDocument(e.target.value)})} /></div>
                        <div><input className={`${theme.input} w-full px-5 py-4 rounded-xl`} placeholder="Telefone" value={formData.client_phone} onChange={e => setFormData({...formData, client_phone: formatPhone(e.target.value)})} /></div>
                      </div>
                    </div>

                    {/* Dados do Imóvel */}
                    <div><h3 className="text-[10px] font-bold uppercase text-[#0217ff] mb-4">Dados do Imóvel</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <select className={`${theme.input} w-full px-5 py-4 rounded-xl`} value={formData.property_id} onChange={e => setFormData({...formData, property_id: e.target.value})}>
                            <option value="">Selecione um imóvel...</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.title} - {p.location}</option>)}
                          </select>
                        </div>
                        <div><input className={`${theme.input} w-full px-5 py-4 rounded-xl font-bold text-[#0217ff]`} placeholder="Valor (R$)" value={formData.value} onChange={e => setFormData({...formData, value: formatCurrencyInput(e.target.value)})} /></div>
                        <div><input className={`${theme.input} w-full px-5 py-4 rounded-xl`} placeholder="Cidade/Foro" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                      </div>
                    </div>

                    {formData.document_type === 'promessa_venda' && (
                      <div><h3 className="text-[10px] font-bold uppercase text-[#0217ff] mb-4">Detalhes da Venda</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input className={`${theme.input} px-4 py-3 rounded-xl`} placeholder="Matrícula" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value})} />
                          <input className={`${theme.input} px-4 py-3 rounded-xl`} placeholder="Sinal (R$)" value={formData.sinal} onChange={e => setFormData({...formData, sinal: formatCurrencyInput(e.target.value)})} />
                          <input className={`${theme.input} px-4 py-3 rounded-xl`} placeholder="% Posse" value={formData.posse_percent} onChange={e => setFormData({...formData, posse_percent: e.target.value})} />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-8">
                      <button onClick={() => setStep(2)} className="flex-1 py-4 bg-zinc-100 rounded-2xl font-bold text-[10px] uppercase">Voltar</button>
                      <button onClick={handleGenerate} className="flex-[2] py-4 bg-[#0217ff] text-white rounded-2xl font-bold text-[10px] uppercase shadow-xl">Gerar Documento</button>
                    </div>
                  </div>
                )}

                {/* STEP 4 - Revisão Final */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex gap-3"><AlertCircle size={18} className="text-amber-500" /><div><p className="text-[10px] font-bold text-amber-800">Revisão obrigatória</p><p className="text-sm text-amber-700">Complete as informações entre colchetes antes de finalizar.</p></div></div>
                    <div><label className="text-[9px] font-bold uppercase text-zinc-400">Conteúdo do Documento</label><div className="bg-white rounded-2xl p-2 border border-zinc-200"><ContractEditor value={formData.final_content || "<p></p>"} onChange={(val) => setFormData(prev => ({ ...prev, final_content: val }))} /></div></div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50"><span className="text-[9px] font-bold uppercase">Status:</span><select className="bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="rascunho">Rascunho</option><option value="ativo">Ativo</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></div>
                    <div className="flex gap-4"><button onClick={() => setStep(3)} className="flex-1 py-4 bg-zinc-100 rounded-2xl font-bold text-[10px] uppercase">Voltar</button><button onClick={handleSave} disabled={loading} className="flex-[2] py-4 bg-[#0217ff] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">{loading ? <Loader2 className="animate-spin" size={18} /> : (editingContract ? 'Atualizar' : 'Salvar')}</button></div>
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

function DocumentTypeCard({ type, label, description, icon: Icon, selected, onClick, theme }: any) {
  return (
    <button onClick={onClick} className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:shadow-lg ${selected === type ? 'border-[#0217ff] bg-[#0217ff]/5' : `${theme.card} ${theme.hover}`}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${selected === type ? 'bg-[#0217ff]' : 'bg-zinc-100'}`}>
          <Icon size={20} className={selected === type ? 'text-white' : 'text-zinc-500'} />
        </div>
        <div><h4 className={`font-bold text-sm ${theme.text}`}>{label}</h4><p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">{description}</p></div>
      </div>
    </button>
  );
}