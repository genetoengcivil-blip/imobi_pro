import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';

// --- INTERFACES ---
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
  status: 'pendente' | 'pago';
  notes?: string;
  user_id?: string;
  created_at?: string;
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  type: string;
  notes?: string;
  location?: string;
  clientName?: string;
  clientPhone?: string;
  status?: string;
  reminder?: boolean;
  user_id?: string;
}

interface GlobalContextType {
  user: any | null;
  leads: Lead[];
  properties: any[];
  transactions: Transaction[];
  appointments: Appointment[];
  darkMode: boolean;
  loading: boolean;
  toggleDarkMode: () => void;
  updateUser: (updates: any) => Promise<void>;
  addLead: (lead: any) => Promise<void>;
  updateLead: (id: string, lead: any) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addProperty: (property: any) => Promise<void>;
  updateProperty: (id: string, property: any) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Salvar apenas preferências estéticas no localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const safeFetch = async (query: any) => {
    try {
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Erro na busca de dados:", err);
      return [];
    }
  };

  const carregarDados = async (authUser: any) => {
    try {
      // 1. Perfil do Usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      let userProfile = profile;
      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ 
            id: authUser.id,
            full_name: authUser?.user_metadata?.full_name || 'Corretor',
            professional_title: 'Consultor Imobiliário',
            theme_config: { primaryColor: '#0217ff', accentColor: '#00c6ff', heroStyle: 'modern' }
          }])
          .select().single();
        userProfile = newProfile;
      }

      setUser({ ...authUser, ...userProfile });

      // 2. Carregar Dados com filtro estrito de USER_ID
      const [leadsData, propertiesData, transData, appData] = await Promise.all([
        safeFetch(supabase.from('leads').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false })),
        safeFetch(supabase.from('properties').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false })),
        safeFetch(supabase.from('transactions').select('*').eq('user_id', authUser.id).order('date', { ascending: false })),
        safeFetch(supabase.from('appointments').select('*').eq('user_id', authUser.id).order('date', { ascending: false })),
      ]);

      // Formatação para compatibilidade com a UI
      setLeads(leadsData.map((l: any) => ({
        ...l,
        id: l.id.toString(),
        name: l.name || l.nome || 'Lead sem nome',
        createdAt: l.created_at
      })));

      setProperties(propertiesData);
      setTransactions(transData);
      setAppointments(appData.map((a: any) => ({
        ...a,
        id: a.id.toString(),
        clientName: a.client_name,
        clientPhone: a.client_phone,
        endTime: a.end_time
      })));

    } catch (err) {
      console.error("Erro ao sincronizar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  // Monitor de Autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        carregarDados(session.user);
      } else {
        setUser(null);
        setLeads([]);
        setProperties([]);
        setTransactions([]);
        setAppointments([]);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ========== FUNÇÕES DE TRANSAÇÕES ==========
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, user_id: user.id }])
      .select().single();
    
    if (!error && data) setTransactions(prev => [data, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ========== FUNÇÕES DE IMÓVEIS ==========
  const addProperty = async (prop: any) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('properties')
      .insert([{ ...prop, user_id: user.id }])
      .select().single();
    
    if (!error && data) setProperties(prev => [data, ...prev]);
  };

  const deleteProperty = async (id: string) => {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (!error) setProperties(prev => prev.filter(p => p.id !== id));
  };

  // ========== FUNÇÕES DE COMPROMISSOS ==========
  const addAppointment = async (app: Omit<Appointment, 'id'>) => {
    if (!user?.id) return;
    const payload = {
      ...app,
      user_id: user.id,
      client_name: app.clientName,
      client_phone: app.clientPhone,
      end_time: app.endTime
    };
    // Limpar campos de UI antes de salvar no banco
    delete (payload as any).clientName;
    delete (payload as any).clientPhone;
    delete (payload as any).endTime;

    const { data, error } = await supabase
      .from('appointments')
      .insert([payload])
      .select().single();

    if (!error && data) {
      const formatted = { ...data, clientName: data.client_name, clientPhone: data.client_phone };
      setAppointments(prev => [formatted, ...prev]);
    }
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // ========== FUNÇÕES DE LEADS E PERFIL ==========
  const addLead = async (leadData: any) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...leadData, user_id: user.id }])
      .select().single();
    if (!error && data) setLeads(prev => [data, ...prev]);
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) setLeads(prev => prev.filter(l => l.id !== id));
  };

  const updateUser = async (updates: any) => {
    if (!user?.id) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) setUser((prev: any) => ({ ...prev, ...updates }));
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <GlobalContext.Provider
      value={{
        user, leads, properties, transactions, appointments, loading, darkMode,
        toggleDarkMode, updateUser, addLead, updateLead: async () => {}, deleteLead,
        addProperty, updateProperty: async () => {}, deleteProperty,
        addTransaction, deleteTransaction, addAppointment, deleteAppointment,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal deve ser usado dentro de GlobalProvider');
  return context;
};