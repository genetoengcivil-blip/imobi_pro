import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // 🔥 NÃO pode travar a aplicação
  const safeFetch = async (query: any) => {
    try {
      const { data } = await query;
      return data || [];
    } catch (err) {
      console.error("Erro em query:", err);
      return [];
    }
  };

  const carregarDados = async (authUser: any) => {
    try {
      // 🔥 PERFIL seguro
      const { data: profile } = await supabase
        .from('perfil')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      setUser({
        ...authUser,
        ...profile,
        name:
          profile?.nome_exibicao ||
          authUser?.user_metadata?.full_name ||
          'Corretor',
      });

      // 🔥 NÃO BLOQUEIA UI
      const [leadsData, propertiesData, transData, appData] = await Promise.all([
        safeFetch(supabase.from('leads').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('properties').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('transactions').select('*')),
        safeFetch(supabase.from('appointments').select('*')),
      ]);

      setLeads(
        leadsData.map((l: any) => ({
          ...l,
          id: l.id?.toString(),
          name: l.name || l.nome || l.client_name || 'Lead sem nome',
          email: l.email || '',
          phone: l.phone || l.telefone || '',
          status: l.status || 'novo',
          value: Number(l.value) || Number(l.valor) || 0,
          createdAt: l.created_at || new Date().toISOString(),
          commission_rate:
            Number(l.commission_rate) ||
            Number(l.comissao) ||
            Number(l.commission) ||
            6,
        }))
      );

      setProperties(propertiesData);
      setTransactions(transData);
      setAppointments(appData);

    } catch (err) {
      console.error("Erro geral:", err);

      setUser({
        ...authUser,
        name: authUser?.user_metadata?.full_name || 'Corretor',
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setLoading(false);

        // 🔥 carrega dados depois
        carregarDados(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          setLoading(false);

          carregarDados(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const uploadPropertyImage = async () => null;

  return (
    <GlobalContext.Provider
      value={{
        user,
        leads,
        properties,
        transactions,
        appointments,
        loading,
        darkMode,
        toggleDarkMode: () => setDarkMode(!darkMode),
        addLead,
        updateLead,
        deleteLead,
        addProperty,
        updateProperty,
        deleteProperty,
        uploadPropertyImage,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal error');
  return context;
};