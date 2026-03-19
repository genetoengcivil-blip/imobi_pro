import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGlobal } from '../context/GlobalContext';

export default function ContractsPage() {
  const { user } = useGlobal();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar contratos
  const fetchContracts = async () => {
    if (!user) {
      console.log('Sem usuário');
      setLoading(false);
      return;
    }

    try {
      console.log('Buscando contratos para:', user.id);
      
      // Busca direta sem joins complexos
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro:', error);
        return;
      }

      console.log('Contratos encontrados:', data);
      
      // FORÇA a atualização do estado
      if (data && data.length > 0) {
        setContracts(data);
      } else {
        setContracts([]);
      }

    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Executa quando o usuário estiver disponível
  useEffect(() => {
    fetchContracts();
  }, [user]);

  // Renderização simples
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Faça login para ver seus contratos</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Carregando contratos...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <button 
          onClick={fetchContracts}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Recarregar
        </button>
      </div>

      {/* Informações de debug */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Total contratos:</strong> {contracts.length}</p>
      </div>

      {/* Lista de contratos */}
      {contracts.length === 0 ? (
        <div className="p-8 bg-gray-50 rounded text-center">
          <p className="text-gray-500">Nenhum contrato encontrado</p>
          <p className="text-sm text-gray-400 mt-2">User ID: {user.id}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map(contract => (
            <div key={contract.id} className="p-4 border rounded-lg">
              <h3 className="font-bold">{contract.client_name}</h3>
              <p className="text-sm text-gray-600">ID: {contract.id}</p>
              <p className="text-sm text-gray-600">Valor: R$ {contract.value}</p>
              <p className="text-sm text-gray-600">Status: {contract.status}</p>
              <p className="text-xs text-gray-400 mt-2">
                Criado em: {new Date(contract.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}