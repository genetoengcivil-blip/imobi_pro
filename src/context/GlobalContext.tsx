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

  // FUNÇÃO BLINDADA: Corrige dados falhados antes de renderizar a tela
  const carregarDados = async (authUser: any) => {
    try {
      // 1. Perfil
      const { data: profile } = await supabase.from('perfil').select('*').eq('id', authUser.id).single();
      setUser({ 
        ...authUser, 
        ...profile, 
        name: profile?.nome_exibicao || authUser?.user_metadata?.full_name || 'Corretor' 
      });

      // 2. Leads Sanitizados (Impede Tela Branca na aba Leads)
      const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (leadsData) {
        setLeads(leadsData.map((l: any) => ({
          ...l,
          id: l.id?.toString() || Math.random().toString(),
          name: l.name || l.client_name || l.nome || 'Lead sem nome',
          email: l.email || '',
          phone: l.phone || l.telefone || '',
          status: l.status || 'novo',
          value: Number(l.value) || Number(l.valor) || 0,
          createdAt: l.created_at || l.createdAt || new Date().toISOString(),
          commission_rate: Number(l.commission_rate) || Number(l.comissao) || 6
        })));
      }

      // 3. Imóveis Sanitizados
      const { data: propertiesData } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      if (propertiesData) {
        setProperties(propertiesData.map((p: any) => ({
          ...p,
          id: p.id?.toString() || Math.random().toString(),
          title: p.title || p.titulo || 'Imóvel sem título',
          price: Number(p.price) || Number(p.valor) || 0,
          status: p.status || 'disponivel',
          createdAt: p.created_at || p.createdAt || new Date().toISOString()
        })));
      }

      // 4. Financeiro Sanitizado (Impede Tela Branca no Dashboard)
      const { data: transData } = await supabase.from('transactions').select('*');
      if (transData) {
        setTransactions(transData.map((t: any) => ({
          ...t,
          id: t.id?.toString() || Math.random().toString(),
          type: t.type || t.tipo || 'receita',
          amount: Number(t.amount) || Number(t.valor) || 0,
          date: t.date || t.data || t.created_at || new Date().toISOString(),
          description: t.description || t.descricao || 'Sem descrição'
        })));
      }

      // 5. Agenda Sanitizada
      const { data: appData } = await supabase.from('appointments').select('*');
      if (appData) {
        setAppointments(appData.map((a: any) => ({
          ...a,
          id: a.id?.toString() || Math.random().toString(),
          title: a.title || a.titulo || 'Compromisso',
          date: a.date || a.data || a.created_at || new Date().toISOString()
        })));
      }

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
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const addLead = async (leadData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { ...leadData, created_at: leadData.createdAt || new Date().toISOString(), user_id: session?.user?.id };
    delete payload.createdAt;
    const { data } = await supabase.from('leads').insert([payload]).select();
    if (data) setLeads(prev => [{ ...data[0], createdAt: data[0].created_at }, ...prev]);
  };

  const updateLead = async (id: string, updates: any) => {
    const payload = { ...updates, created_at: updates.createdAt };
    delete payload.createdAt;
    await supabase.from('leads').update(payload).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, createdAt: updates.createdAt || new Date().toISOString() } : l));
  };

  const deleteLead = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const addProperty = async (prop: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase.from('properties').insert([{ ...prop, user_id: session?.user?.id }]).select();
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