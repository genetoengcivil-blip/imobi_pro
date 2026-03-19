import { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit3, Eye, X, Loader2, 
  Save, AlertCircle, Phone, CreditCard, DollarSign,
  Calendar, Home, CheckSquare, Download, Printer, Share2,
  RefreshCw
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

interface Contract {
  id: string;
  client_name: string;
  client_phone?: string;
  client_document?: string;
  document_type: string;
  value: number;
  property_id: string | null;
  status: string;
  created_at: string;
  properties?: {
    title: string;
    location: string;
  };
}

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('edit');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_document: '',
    property_id: '',
    value: '',
    document_type: 'autorizacao_venda',
    status: 'rascunho'
  });

  // CARREGAR DADOS SEMPRE QUE O USUÁRIO MUDAR
  useEffect(() => {
    console.log('USEFFECT - Usuário:', user);
    if (user) {
      loadData();
    } else {
      setLoading(false);
      setContracts([]);
    }
  }, [user]);

  async function loadData() {
    console.log('loadData INICIADO para usuário:', user?.id);
    setLoading(true);
    setError('');
    
    try {
      if (!user?.id) {
        console.log('Sem usuário');
        return;
      }

      // 1. CARREGAR CONTRATOS
      console.log('Buscando contratos...');
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*, properties(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('Erro contratos:', contractsError);
        throw contractsError;
      }

      console.log('Contratos encontrados:', contractsData?.length || 0);
      console.log('Dados dos contratos:', contractsData);
      
      // FORÇAR atualização do state
      setContracts(contractsData || []);

      // 2. CARREGAR PROPRIEDADES
      console.log('Buscando propriedades...');
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, location')
        .eq('user_id', user.id);

      if (propertiesError) {
        console.error('Erro propriedades:', propertiesError);
        throw propertiesError;
      }

      console.log('Propriedades encontradas:', propertiesData?.length || 0);
      setProperties(propertiesData || []);

    } catch (error: any) {
      console.error('Erro geral:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      console.log('loadData FINALIZADO');
    }
  }

  async function handleSave() {
    console.log('handleSave INICIADO');
    
    if (!user?.id) {
      alert('Usuário não autenticado');
      return;
    }

    if (!formData.client_name) {
      alert('Nome do cliente é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        client_name: formData.client_name,
        client_phone: formData.client_phone || null,
        client_document: formData.client_document || null,
        property_id: formData.property_id || null,
        value: parseFloat(formData.value) || 0,
        document_type: formData.document_type,
        status: formData.status,
        content: 'Conteúdo do contrato'
      };

      console.log('Salvando payload:', payload);

      let error;
      if (editingContract) {
        console.log('Atualizando ID:', editingContract.id);
        ({ error } = await supabase
          .from('contracts')
          .update(payload)
          .eq('id', editingContract.id));
      } else {
        console.log('Inserindo novo');
        ({ error } = await supabase
          .from('contracts')
          .insert([payload]));
      }

      if (error) {
        console.error('Erro ao salvar:', error);
        throw error;
      }

      console.log('Salvo com sucesso!');
      
      setShowModal(false);
      setEditingContract(null);
      
      // RECARREGAR dados
      await loadData();
      
    } catch (error: any) {
      console.error('Erro no handleSave:', error);
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;

    console.log('Deletando ID:', id);
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('Deletado com sucesso');
      await loadData();
      
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function openModal(contract: Contract | null = null, mode: 'view' | 'edit' = 'edit') {
    console.log('openModal:', contract, mode);
    
    if (contract) {
      setFormData({
        client_name: contract.client_name,
        client_phone: contract.client_phone || '',
        client_document: contract.client_document || '',
        property_id: contract.property_id || '',
        value: contract.value.toString(),
        document_type: contract.document_type,
        status: contract.status
      });
      setEditingContract(contract);
      setViewMode(mode);
    } else {
      setFormData({
        client_name: '',
        client_phone: '',
        client_document: '',
        property_id: '',
        value: '',
        document_type: 'autorizacao_venda',
        status: 'rascunho'
      });
      setEditingContract(null);
      setViewMode('edit');
    }
    setShowModal(true);
  }

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200',
    text: darkMode ? 'text-white' : 'text-zinc-900',
    modal: darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
  };

  const filteredContracts = contracts.filter(c => 
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Contratos</h1>
          <div className="flex items-center gap-2">
            <p className="text-zinc-500 text-sm">{contracts.length} contratos encontrados</p>
            <button 
              onClick={loadData}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              title="Recarregar"
            >
              <RefreshCw size={14} className="text-zinc-400" />
            </button>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-[#0217ff] text-white rounded-xl flex items-center gap-2 hover:bg-[#0217ff]/90"
        >
          <Plus size={18} /> Novo Contrato
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-xl border ${theme.input}`}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
          {error}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-[#0217ff]" size={32} />
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className={`${theme.card} border rounded-2xl p-12 text-center`}>
          <Home size={48} className="mx-auto mb-4 text-zinc-400" />
          <p className={`${theme.text} font-bold`}>
            {searchTerm ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado'}
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            {searchTerm ? (
              <>
                Tente outro termo de busca ou{' '}
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="text-[#0217ff] underline"
                >
                  limpar busca
                </button>
              </>
            ) : (
              'Clique em "Novo Contrato" para começar'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map(contract => (
            <div key={contract.id} className={`${theme.card} border rounded-xl p-6 hover:shadow-md transition`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className={`font-bold text-lg ${theme.text}`}>{contract.client_name}</h3>
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs">
                      {contract.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {contract.client_phone && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Phone size={14} />
                        <span>{contract.client_phone}</span>
                      </div>
                    )}
                    {contract.client_document && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <CreditCard size={14} />
                        <span>{contract.client_document}</span>
                      </div>
                    )}
                    {contract.value > 0 && (
                      <div className="flex items-center gap-2 text-[#0217ff] font-bold">
                        <DollarSign size={14} />
                        <span>R$ {contract.value.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Calendar size={14} />
                      <span>{new Date(contract.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {contract.properties && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Home size={14} />
                      <span>{contract.properties.title} - {contract.properties.location}</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openModal(contract, 'view')}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-[#0217ff] hover:text-white transition"
                    title="Visualizar"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => openModal(contract, 'edit')}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-[#0217ff] hover:text-white transition"
                    title="Editar"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(contract.id)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.modal} border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {viewMode === 'view' ? 'Visualizar Contrato' : editingContract ? 'Editar Contrato' : 'Novo Contrato'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {viewMode === 'view' ? (
                // Modo visualização
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-500">Nome do Cliente</label>
                    <p className={`text-lg font-bold ${theme.text}`}>{formData.client_name}</p>
                  </div>
                  {formData.client_phone && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500">Telefone</label>
                      <p className={theme.text}>{formData.client_phone}</p>
                    </div>
                  )}
                  {formData.client_document && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500">CPF/CNPJ</label>
                      <p className={theme.text}>{formData.client_document}</p>
                    </div>
                  )}
                  {formData.property_id && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500">Imóvel</label>
                      <p className={theme.text}>
                        {properties.find(p => p.id === formData.property_id)?.title || 'N/A'}
                      </p>
                    </div>
                  )}
                  {formData.value && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500">Valor</label>
                      <p className="text-lg font-bold text-[#0217ff]">
                        R$ {parseFloat(formData.value).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Modo edição
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome do Cliente *</label>
                    <input
                      type="text"
                      required
                      value={formData.client_name}
                      onChange={e => setFormData({...formData, client_name: e.target.value})}
                      className={`w-full px-4 py-2 rounded-xl border ${theme.input}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <input
                      type="text"
                      value={formData.client_phone}
                      onChange={e => setFormData({...formData, client_phone: e.target.value})}
                      className={`w-full px-4 py-2 rounded-xl border ${theme.input}`}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">CPF/CNPJ</label>
                    <input
                      type="text"
                      value={formData.client_document}
                      onChange={e => setFormData({...formData, client_document: e.target.value})}
                      className={`w-full px-4 py-2 rounded-xl border ${theme.input}`}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Imóvel</label>
                    <select
                      value={formData.property_id}
                      onChange={e => setFormData({...formData, property_id: e.target.value})}
                      className={`w-full px-4 py-2 rounded-xl border ${theme.input}`}
                    >
                      <option value="">Selecione um imóvel</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.title} - {p.location}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={e => setFormData({...formData, value: e.target.value})}
                      className={`w-full px-4 py-2 rounded-xl border ${theme.input}`}
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className={`w-full px-4 py-2 rounded-xl border ${theme.input}`}
                    >
                      <option value="rascunho">Rascunho</option>
                      <option value="ativo">Ativo</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-[#0217ff] text-white rounded-xl hover:bg-[#0217ff]/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      {editingContract ? 'Atualizar' : 'Salvar'}
                    </button>
                  </div>
                </form>
              )}

              {viewMode === 'view' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => setViewMode('edit')}
                    className="flex-1 px-4 py-2 bg-[#0217ff] text-white rounded-xl hover:bg-[#0217ff]/90 transition flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} /> Editar
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