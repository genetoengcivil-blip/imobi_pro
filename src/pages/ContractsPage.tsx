import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Home, Phone, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_document: '',
    property_id: '',
    value: '',
    document_type: 'autorizacao_venda',
    category: 'intermediacao'
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      console.log('Carregando dados para usuário:', user?.id);
      
      // Carregar contratos
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user?.id);

      if (contractsError) throw contractsError;
      console.log('Contratos:', contractsData);
      setContracts(contractsData || []);

      // Carregar propriedades
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, location')
        .eq('user_id', user?.id);

      if (propertiesError) throw propertiesError;
      console.log('Propriedades:', propertiesData);
      setProperties(propertiesData || []);

    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!user?.id) {
        alert('Usuário não autenticado');
        return;
      }

      const payload = {
        user_id: user.id,
        client_name: formData.client_name,
        client_phone: formData.client_phone || null,
        client_document: formData.client_document || null,
        property_id: formData.property_id || null,
        value: parseFloat(formData.value) || 0,
        document_type: formData.document_type,
        category: formData.category,
        content: 'Conteúdo do contrato gerado automaticamente',
        status: 'rascunho',
        checklist: [
          { task: "RG / CPF", done: false, required: true },
          { task: "Certidão de Matrícula", done: false, required: true }
        ]
      };

      console.log('Salvando:', payload);

      const { error } = await supabase
        .from('contracts')
        .insert([payload]);

      if (error) throw error;

      alert('Contrato salvo com sucesso!');
      setShowModal(false);
      loadData();
      
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200',
    text: darkMode ? 'text-white' : 'text-zinc-900',
    input: darkMode ? 'bg-zinc-800 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200',
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Contratos</h1>
          <p className="text-zinc-500 text-sm">{contracts.length} contratos encontrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#0217ff] text-white rounded-xl flex items-center gap-2"
        >
          <Plus size={18} /> Novo Contrato
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar contratos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-xl ${theme.input}`}
        />
      </div>

      {/* Lista de Contratos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-[#0217ff]" size={32} />
        </div>
      ) : contracts.length === 0 ? (
        <div className={`${theme.card} rounded-2xl border p-8 text-center`}>
          <Home size={48} className="mx-auto mb-4 text-zinc-400" />
          <p className={`${theme.text} font-bold`}>Nenhum contrato encontrado</p>
          <p className="text-zinc-500 text-sm mt-2">
            Clique em "Novo Contrato" para começar
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts
            .filter(c => c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(contract => (
              <div key={contract.id} className={`${theme.card} rounded-xl border p-4`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-bold ${theme.text}`}>{contract.client_name}</h3>
                    <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                      {contract.client_phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {contract.client_phone}
                        </span>
                      )}
                      {contract.client_document && (
                        <span className="flex items-center gap-1">
                          <CreditCard size={12} /> {contract.client_document}
                        </span>
                      )}
                      {contract.value > 0 && (
                        <span className="flex items-center gap-1 text-[#0217ff]">
                          <DollarSign size={12} /> R$ {contract.value}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal de Novo Contrato */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.card} rounded-2xl border p-6 max-w-md w-full`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>Novo Contrato</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={formData.client_name}
                  onChange={e => setFormData({...formData, client_name: e.target.value})}
                  className={`w-full px-4 py-2 rounded-xl ${theme.input}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.client_phone}
                  onChange={e => setFormData({...formData, client_phone: e.target.value})}
                  className={`w-full px-4 py-2 rounded-xl ${theme.input}`}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CPF/CNPJ</label>
                <input
                  type="text"
                  value={formData.client_document}
                  onChange={e => setFormData({...formData, client_document: e.target.value})}
                  className={`w-full px-4 py-2 rounded-xl ${theme.input}`}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Imóvel</label>
                <select
                  value={formData.property_id}
                  onChange={e => setFormData({...formData, property_id: e.target.value})}
                  className={`w-full px-4 py-2 rounded-xl ${theme.input}`}
                >
                  <option value="">Selecione um imóvel</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} - {p.location}
                    </option>
                  ))}
                </select>
                {properties.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Nenhum imóvel encontrado. Cadastre um imóvel primeiro.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  className={`w-full px-4 py-2 rounded-xl ${theme.input}`}
                  placeholder="0,00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#0217ff] text-white rounded-xl disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}