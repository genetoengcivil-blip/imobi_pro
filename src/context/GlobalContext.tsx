import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Lead } from '../types';

interface GlobalContextType {
  user: User | null;
  leads: Lead[];
  properties: any[]; // Novo estado para imóveis
  transactions: any[];
  appointments: any[];
  darkMode: boolean;
  loading: boolean;
  toggleDarkMode: () => void;
  // Leads
  addLead: (lead: any) => Promise<void>;
  updateLead: (id: string, lead: any) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  // Imóveis (Novas Funções)
  addProperty: (property: any) => Promise<void>;
  updateProperty: (id: string, property: any) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  uploadPropertyImage: (file: File) => Promise<string | null>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<any[]>([]); // Estado dos imóveis
  const [transactions, setTransactions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) carregarDados(session.user.id);
      else setLoading(false);
    });
  }, []);

  const carregarDados = async (userId: string) => {
    // 1. Perfil
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) setUser({ id: profile.id, name: profile.full_name, email: profile.email || '', phone: profile.phone, avatar: profile.avatar_url });
    
    // 2. Leads
    const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (leadsData) {
      setLeads(leadsData.map(l => ({ ...l, createdAt: l.created_at, commission_rate: l.commission_rate || 6 })));
    }

    // 3. Imóveis (Carregamento Inicial)
    const { data: propertiesData } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (propertiesData) setProperties(propertiesData);

    // 4. Financeiro
    const { data: transData } = await supabase.from('transactions').select('*');
    if (transData) setTransactions(transData);

    // 5. Agenda
    const { data: appData } = await supabase.from('appointments').select('*');
    if (appData) setAppointments(appData);

    setLoading(false);
  };

  // --- LÓGICA DE UPLOAD PARA O BUCKET 'properties' ---
  const uploadPropertyImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('properties')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('properties')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  // --- CRUD DE IMÓVEIS ---
  const addProperty = async (propData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { ...propData, user_id: session?.user.id };
    
    const { data, error } = await supabase.from('properties').insert([payload]).select();
    if (data) setProperties(prev => [data[0], ...prev]);
    if (error) console.error("Erro ao salvar imóvel:", error);
  };

  const updateProperty = async (id: string, updates: any) => {
    const { error } = await supabase.from('properties').update(updates).eq('id', id);
    if (!error) {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const deleteProperty = async (id: string) => {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (!error) setProperties(prev => prev.filter(p => p.id !== id));
  };

  // --- CRUD DE LEADS ---
  const addLead = async (leadData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { ...leadData, created_at: leadData.createdAt, user_id: session?.user.id };
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
  if (!context) throw new Error('useGlobal must be used within a GlobalProvider');
  return context;
};