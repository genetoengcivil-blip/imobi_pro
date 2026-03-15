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

  useEffect(() => {
    // 1. Verificar sessão inicial
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Ouvir mudanças de estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('perfil')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser({ ...authUser, ...profile });
      } else {
        setUser(authUser);
      }
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  // --- MÉTODOS CRUD (Mantidos conforme seu original) ---
  const addLead = async (leadData: any) => {
    const payload = { ...leadData, user_id: user?.id };
    const { data } = await supabase.from('leads').insert([payload]).select();
    if (data) setLeads(prev => [data[0], ...prev]);
  };

  const updateLead = async (id: string, updates: any) => {
    await supabase.from('leads').update(updates).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLead = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const addProperty = async (prop: any) => { /* sua lógica */ };
  const updateProperty = async (id: string, prop: any) => { /* sua lógica */ };
  const deleteProperty = async (id: string) => { /* sua lógica */ };
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
  if (!context) throw new Error('useGlobal deve ser usado dentro de um GlobalProvider');
  return context;
};