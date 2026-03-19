import { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Buscar dados quando o componente montar
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setLoading(false);
      setError('Usuário não logado');
    }
  }, [user]);

  async function loadAllData() {
    setLoading(true);
    setError('');
    
    try {
      console.log('=== INÍCIO DO DIAGNÓSTICO ===');
      console.log('User ID:', user?.id);
      
      // 1. Verificar se o usuário existe
      if (!user?.id) {
        throw new Error('Usuário não identificado');
      }

      // 2. Buscar contratos
      console.log('Buscando contratos...');
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id);

      if (contractsError) {
        console.error('Erro contratos:', contractsError);
        throw contractsError;
      }

      console.log('Contratos encontrados:', contractsData?.length || 0);
      console.log('Dados dos contratos:', contractsData);
      setContracts(contractsData || []);

      // 3. Buscar propriedades
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
      console.log('Dados das propriedades:', propertiesData);
      setProperties(propertiesData || []);

      console.log('=== FIM DO DIAGNÓSTICO ===');

    } catch (err: any) {
      console.error('Erro geral:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Estilo simples
  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0217ff]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className={`text-2xl font-bold ${theme.text} mb-6`}>Diagnóstico de Contratos</h1>
      
      {/* Informações do usuário */}
      <div className="mb-6 p-4 bg-blue-500/10 rounded-xl">
        <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
      </div>

      {/* Erros */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-500 font-bold">Erro: {error}</p>
        </div>
      )}

      {/* Botão recarregar */}
      <button 
        onClick={loadAllData}
        className="mb-6 px-4 py-2 bg-[#0217ff] text-white rounded-xl"
      >
        Recarregar Dados
      </button>

      {/* Propriedades disponíveis */}
      <div className="mb-8">
        <h2 className={`text-lg font-bold ${theme.text} mb-4`}>
          Propriedades encontradas: {properties.length}
        </h2>
        
        {properties.length === 0 ? (
          <div className={`${theme.card} rounded-xl border p-6`}>
            <p className="text-zinc-500">Nenhuma propriedade encontrada para este usuário</p>
            <p className="text-xs text-zinc-400 mt-2">
              Certifique-se de que existem propriedades cadastradas com o user_id = {user?.id}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {properties.map(prop => (
              <div key={prop.id} className={`${theme.card} rounded-xl border p-4`}>
                <p><strong>ID:</strong> {prop.id}</p>
                <p><strong>Título:</strong> {prop.title}</p>
                <p><strong>Localização:</strong> {prop.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contratos */}
      <div>
        <h2 className={`text-lg font-bold ${theme.text} mb-4`}>
          Contratos encontrados: {contracts.length}
        </h2>
        
        {contracts.length === 0 ? (
          <div className={`${theme.card} rounded-xl border p-6`}>
            <p className="text-zinc-500">Nenhum contrato encontrado para este usuário</p>
            <p className="text-xs text-zinc-400 mt-2">
              Certifique-se de que existem contratos com o user_id = {user?.id}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {contracts.map(contract => (
              <div key={contract.id} className={`${theme.card} rounded-xl border p-4`}>
                <p><strong>ID:</strong> {contract.id}</p>
                <p><strong>Cliente:</strong> {contract.client_name}</p>
                <p><strong>Tipo:</strong> {contract.document_type}</p>
                <p><strong>Property ID:</strong> {contract.property_id || 'Nenhum'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}