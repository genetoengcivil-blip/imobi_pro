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

  // FUNÇÃO BLINDADA PARA CARREGAR DADOS
  const carregarDados = async (authUser: any) => {
    try {
      // 1. Busca na tabela correta (perfil) que criamos com status e plano
      const { data: profile, error } = await supabase
        .from('perfil')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // Junta os dados da Autenticação com os dados do Banco de Dados
      if (profile) {
        setUser({ 
          ...authUser, 
          ...profile, 
          name: profile.nome_exibicao || authUser.user_metadata?.full_name || 'Corretor' 
        });
      } else {
        setUser({ 
          ...authUser, 
          name: authUser.user_metadata?.full_name || 'Corretor' 
        });
      }

      // 2. Busca Leads de forma segura
      const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (leadsData) {
        setLeads(leadsData.map(l => ({ ...l, createdAt: l.created_at, commission_rate: l.commission_rate || 6 })));
      }

      // 3. Busca Imóveis
      const { data: propertiesData } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      if (propertiesData) setProperties(propertiesData);

      // 4. Busca Financeiro
      const { data: transData } = await supabase.from('transactions').select('*');
      if (transData) setTransactions(transData);

      // 5. Busca Agenda
      const { data: appData } = await supabase.from('appointments').select('*');
      if (appData) setAppointments(appData);

    } catch (err) {
      console.error("Erro no Contexto (mas o app não vai quebrar):", err);
      setUser({ ...authUser, name: authUser.user_metadata?.full_name || 'Corretor' });
    } finally {
      // Libera a tela de Loading independentemente de sucesso ou erro
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await carregarDados(session.user);
      } else {
        setLoading(false);
      }
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await carregarDados(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- CRUD METODOS MANTIDOS ---
  const addLead = async (leadData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { ...leadData, created_at: leadData.createdAt, user_id: session?.user?.id };
    delete payload.createdAt;
    const { data } = await supabase.from('leads').insert([payload]).select();
    if (data) setLeads(prev => [{ ...data[0], createdAt: data[0].created_at }, ...prev]);
  };

  const updateLead = async (id: string, updates: any) => {
    const payload = { ...updates, created_at: updates.createdAt };
    delete payload.createdAt;
    await supabase.from('leads').update(payload).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, createdAt: updates.createdAt } : l));
  };

  const deleteLead = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const uploadPropertyImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('properties').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('properties').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) { return null; }
  };

  const addProperty = async (propData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { ...propData, user_id: session?.user?.id };
    const { data } = await supabase.from('properties').insert([payload]).select();
    if (data) setProperties(prev => [data[0], ...prev]);
  };

  const updateProperty = async (id: string, updates: any) => {
    await supabase.from('properties').update(updates).eq('id', id);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProperty = async (id: string) => {
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

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