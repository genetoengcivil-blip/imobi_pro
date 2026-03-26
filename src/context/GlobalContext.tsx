import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';

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
  uploadPropertyImage: (file: File) => Promise<string | null>;
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

  // Carregar dados do localStorage (fallback)
  useEffect(() => {
    const storedTransactions = localStorage.getItem('imobipro_transactions');
    if (storedTransactions) {
      try {
        const parsed = JSON.parse(storedTransactions);
        setTransactions(parsed);
        console.log('Carregadas transações do localStorage:', parsed.length);
      } catch (e) {
        console.error('Erro ao carregar transações do localStorage:', e);
      }
    }
    
    const storedAppointments = localStorage.getItem('imobipro_appointments');
    if (storedAppointments) {
      try {
        const parsed = JSON.parse(storedAppointments);
        setAppointments(parsed);
        console.log('Carregados compromissos do localStorage:', parsed.length);
      } catch (e) {
        console.error('Erro ao carregar compromissos do localStorage:', e);
      }
    }
  }, []);

  // Salvar transações no localStorage
  useEffect(() => {
    localStorage.setItem('imobipro_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Salvar compromissos no localStorage
  useEffect(() => {
    localStorage.setItem('imobipro_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Salvar darkMode no localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const safeFetch = async (query: any) => {
    try {
      const { data, error } = await query;
      if (error) {
        console.error('Erro na query:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error("Erro em query:", err);
      return [];
    }
  };

  const carregarDados = async (authUser: any) => {
    try {
      // Carregar perfil da tabela perfil
      const { data: profile, error: profileError } = await supabase
        .from('perfil')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
      }

      // Se não existe perfil, criar um novo
      let userProfile = profile;
      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('perfil')
          .insert([{ id: authUser.id }])
          .select()
          .single();
        
        if (!insertError && newProfile) {
          userProfile = newProfile;
          console.log('✅ Perfil criado para o usuário:', authUser.id);
        }
      }

      setUser({
        ...authUser,
        ...userProfile,
        name: userProfile?.nome_exibicao || authUser?.user_metadata?.full_name || 'Corretor',
        phone: userProfile?.phone || '',
        creci: userProfile?.creci || '',
        bio: userProfile?.bio || '',
        company: userProfile?.company || '',
        professional_title: userProfile?.professional_title || 'Consultor Imobiliário',
        experience: userProfile?.experience || '',
        specialties: userProfile?.specialties || '',
        socialMedia: userProfile?.social_media || {},
        avatar: userProfile?.avatar || null,
        logo: userProfile?.logo || null,
        slug: userProfile?.slug || ''
      });

      // Carregar dados das tabelas
      const [leadsData, propertiesData, transData, appData] = await Promise.all([
        safeFetch(supabase.from('leads').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('properties').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('transactions').select('*').order('date', { ascending: false })),
        safeFetch(supabase.from('appointments').select('*').order('date', { ascending: false })),
      ]);

      // Processar leads
      setLeads(leadsData.map((l: any) => ({
        ...l,
        id: l.id?.toString(),
        name: l.name || l.nome || l.client_name || 'Lead sem nome',
        email: l.email || '',
        phone: l.phone || l.telefone || '',
        status: l.status || 'novo',
        value: Number(l.value) || Number(l.valor) || 0,
        createdAt: l.created_at || new Date().toISOString(),
        commission_rate: Number(l.commission_rate) || Number(l.comissao) || 6,
      })));

      // Processar propriedades
      setProperties(propertiesData);
      
      // Processar transações
      if (transData && transData.length > 0) {
        const formattedTransactions = transData.map((t: any) => ({
          id: t.id?.toString() || Date.now().toString(),
          description: t.description || 'Sem descrição',
          amount: Number(t.amount) || 0,
          type: t.type || 'receita',
          category: t.category || 'Outros',
          date: t.date || new Date().toISOString().split('T')[0],
          status: t.status || 'pago',
          notes: t.notes || '',
          user_id: t.user_id,
          created_at: t.created_at
        }));
        setTransactions(formattedTransactions);
        console.log('Transações carregadas do Supabase:', formattedTransactions.length);
      }
      
      // Processar compromissos
      if (appData && appData.length > 0) {
        const formattedAppointments = appData.map((a: any) => ({
          id: a.id?.toString() || Date.now().toString(),
          title: a.title || 'Sem título',
          date: a.date || new Date().toISOString().split('T')[0],
          time: a.time || '00:00',
          endTime: a.end_time || null,
          type: a.type || 'visita',
          notes: a.notes || '',
          location: a.location || '',
          clientName: a.client_name || '',
          clientPhone: a.client_phone || '',
          status: a.status || 'pendente',
          reminder: a.reminder || false,
          user_id: a.user_id
        }));
        setAppointments(formattedAppointments);
        console.log('Compromissos carregados do Supabase:', formattedAppointments.length);
      }

    } catch (err) {
      console.error("Erro geral ao carregar dados:", err);
      setUser({
        ...authUser,
        name: authUser?.user_metadata?.full_name || 'Corretor',
      });
    } finally {
      setLoading(false);
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

  // ========== USER FUNCTIONS ==========
  const updateUser = async (updates: any) => {
    console.log('📝 updateUser chamada:', updates);
    
    if (!user?.id) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    try {
      // Mapear os campos para os nomes corretos da tabela perfil
      const payload: any = {};
      
      // 🔥 MAPEAMENTO CORRETO
      if (updates.name !== undefined) payload.nome_exibicao = updates.name;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.creci !== undefined) payload.creci = updates.creci;
      if (updates.bio !== undefined) payload.bio = updates.bio;
      if (updates.company !== undefined) payload.company = updates.company;
      if (updates.professional_title !== undefined) payload.professional_title = updates.professional_title;
      if (updates.experience !== undefined) payload.experience = updates.experience;
      if (updates.specialties !== undefined) payload.specialties = updates.specialties;
      if (updates.avatar !== undefined) payload.avatar = updates.avatar;
      if (updates.logo !== undefined) payload.logo = updates.logo;
      if (updates.slug !== undefined) payload.slug = updates.slug;
      if (updates.socialMedia !== undefined) payload.social_media = updates.socialMedia;
      
      // Adicionar updated_at
      payload.updated_at = new Date().toISOString();
      
      console.log('💾 Payload sendo enviado para o Supabase:', payload);
      
      // Atualizar estado local imediatamente
      setUser((prev: any) => ({ ...prev, ...updates }));
      console.log('✅ Usuário atualizado no estado local');
      
      // Salvar no Supabase
      const { data, error } = await supabase
        .from('perfil')
        .update(payload)
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error('❌ Erro detalhado ao atualizar perfil no Supabase:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('✅ Perfil atualizado no Supabase com sucesso!', data);
      }
    } catch (err) {
      console.error('❌ Erro exceção ao atualizar perfil:', err);
    }
  };

  // ========== LEAD FUNCTIONS ==========
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

  // ========== PROPERTY FUNCTIONS ==========
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

  // ========== TRANSACTION FUNCTIONS ==========
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    if (user?.id) {
      try {
        const payload = {
          ...transaction,
          user_id: user.id
        };
        
        const { data, error } = await supabase
          .from('transactions')
          .insert([payload])
          .select();
        
        if (error) {
          console.error('Erro ao salvar transação:', error);
        } else if (data && data.length > 0 && data[0].id !== newTransaction.id) {
          setTransactions(prev => prev.map(t => 
            t.id === newTransaction.id ? { ...t, id: data[0].id } : t
          ));
        }
      } catch (err) {
        console.error('Erro ao salvar transação:', err);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    if (user?.id) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar transação:', err);
      }
    }
  };

  // ========== APPOINTMENT FUNCTIONS ==========
  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    console.log('📝 addAppointment chamada:', appointment);
    
    if (!appointment.title || !appointment.date || !appointment.time) {
      console.error('❌ Campos obrigatórios faltando');
      alert('Preencha título, data e horário');
      return;
    }
    
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString()
    };
    
    setAppointments(prev => [newAppointment, ...prev]);
    console.log('✅ Compromisso adicionado ao estado local');
    
    if (user?.id) {
      try {
        const payload: any = {
          user_id: user.id,
          title: appointment.title,
          date: appointment.date,
          time: appointment.time,
          type: appointment.type || 'visita',
          status: appointment.status || 'pendente'
        };
        
        if (appointment.endTime && appointment.endTime !== '') {
          payload.end_time = appointment.endTime;
        }
        if (appointment.notes && appointment.notes !== '') {
          payload.notes = appointment.notes;
        }
        if (appointment.location && appointment.location !== '') {
          payload.location = appointment.location;
        }
        if (appointment.clientName && appointment.clientName !== '') {
          payload.client_name = appointment.clientName;
        }
        if (appointment.clientPhone && appointment.clientPhone !== '') {
          payload.client_phone = appointment.clientPhone;
        }
        if (appointment.reminder !== undefined && appointment.reminder !== null) {
          payload.reminder = appointment.reminder;
        }
        
        console.log('💾 Payload sendo enviado:', payload);
        
        const { data, error } = await supabase
          .from('appointments')
          .insert([payload])
          .select();
        
        if (error) {
          console.error('❌ Erro detalhado:', error);
          alert(`Erro ao salvar: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log('✅ Compromisso salvo no Supabase:', data[0]);
          if (data[0].id !== newAppointment.id) {
            setAppointments(prev => prev.map(a => 
              a.id === newAppointment.id ? { ...a, id: data[0].id } : a
            ));
          }
          alert('Compromisso agendado com sucesso!');
        }
      } catch (err) {
        console.error('❌ Erro exceção:', err);
        alert('Erro ao conectar com o servidor');
      }
    } else {
      console.log('⚠️ Usuário não autenticado, salvando apenas localmente');
      alert('Compromisso salvo localmente!');
    }
  };

  const deleteAppointment = async (id: string) => {
    console.log('🗑️ deleteAppointment chamada para id:', id);
    
    setAppointments(prev => prev.filter(a => a.id !== id));
    
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('❌ Erro ao deletar:', error);
        } else {
          console.log('✅ Compromisso deletado do Supabase');
        }
      } catch (err) {
        console.error('❌ Erro exceção:', err);
      }
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

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
        toggleDarkMode,
        updateUser,
        addLead,
        updateLead,
        deleteLead,
        addProperty,
        updateProperty,
        deleteProperty,
        uploadPropertyImage,
        addTransaction,
        deleteTransaction,
        addAppointment,
        deleteAppointment,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal must be used within a GlobalProvider');
  return context;
};