import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Lead } from '../types';

interface GlobalContextType {
  user: any | null;
  leads: Lead[];
  properties: any[];
  transactions: any[];
  appointments: any[];
  darkMode: boolean;
  loading: boolean;
  toggleDarkMode: () => void;
  addLead: (lead: any) => Promise<void>;
  updateLead: (id: string, lead: any) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addProperty: (property: any) => Promise<void>;
  updateProperty: (id: string, property: any) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  uploadPropertyImage: (file: File) => Promise<string | null>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [transactions, setTransactions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  

  const carregarDados = async (authUser: any) => {
    try {
      const { data: profile } = await supabase.from('perfil').select('*').eq('id', authUser.id).single();
      setUser({ ...authUser, ...profile, name: profile?.nome_exibicao || authUser?.user_metadata?.full_name || 'Corretor' });

      const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (leadsData) {
        setLeads(leadsData.map((l: any) => ({
          ...l,
          id: l.id?.toString(),
          name: l.name || l.nome || l.client_name || 'Lead sem nome',
          email: l.email || '',
          phone: l.phone || l.telefone || '',
          status: l.status || 'novo',
          value: Number(l.value) || Number(l.valor) || 0,
          createdAt: l.created_at || l.createdAt || new Date().toISOString(),
          commission_rate: Number(l.commission_rate) || Number(l.comissao) || Number(l.commission) || 6
        })));
      }

      const { data: propertiesData } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      if (propertiesData) setProperties(propertiesData);

      const { data: transData } = await supabase.from('transactions').select('*');
      if (transData) setTransactions(transData);

      const { data: appData } = await supabase.from('appointments').select('*');
      if (appData) setAppointments(appData);

    } catch (err) {
      console.error("Erro ignorado no carregamento:", err);
      if (!user) setUser({ ...authUser, name: authUser?.user_metadata?.full_name || 'Corretor' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await carregarDados(session.user);
      else setLoading(false);
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) await carregarDados(session.user);
      else { setUser(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 🛡️ ADICIONAR LEAD - Agora usa a memória (user.id) e evita o erro de Lock do Supabase!
  const addLead = async (leadData: any) => {
    const payload = { ...leadData, user_id: user?.id };
    
    const { data, error } = await supabase.from('leads').insert([payload]).select();
    
    if (error) throw error; 

    if (data && data.length > 0) {
      setLeads(prev => [{ ...data[0], createdAt: data[0].created_at }, ...prev]);
    }
  };

  const updateLead = async (id: string, updates: any) => {
    const { error } = await supabase.from('leads').update(updates).eq('id', id);
    if (error) throw error; 
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLead = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const addProperty = async (prop: any) => {
    // Também ajustado para propriedades para evitar o erro no futuro
    const payload = { ...prop, user_id: user?.id };
    const { data } = await supabase.from('properties').insert([payload]).select();
    if (data) setProperties(prev => [data[0], ...prev]);
  };

  const updateProperty = async (id: string, prop: any) => {
    await supabase.from('properties').update(prop).eq('id', id);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...prop } : p));
  };

  const deleteProperty = async (id: string) => {
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const uploadPropertyImage = async (file: File) => { return null; };

  return (
    <GlobalContext.Provider value={{
      user, leads, properties, transactions, appointments, loading, darkMode, 
      toggleDarkMode: () => setDarkMode(!darkMode),
      addLead, updateLead, deleteLead,
      addProperty, updateProperty, deleteProperty, uploadPropertyImage
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal error');
  return context;
};