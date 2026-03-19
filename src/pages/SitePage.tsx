import { useState, useEffect } from 'react';
import { 
  Globe, Link as LinkIcon, User, MessageCircle, 
  Check, Loader2, AlertCircle, ExternalLink, Sparkles,
  Instagram, Facebook, Youtube, Linkedin, ChevronLeft,
  Save, Eye, RefreshCw
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function SitePage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados dos campos
  const [fullName, setFullName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [socials, setSocials] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    linkedin: ''
  });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  // PRIMEIRA FUNÇÃO: CARREGAR (Busca os dados ou retorna vazio sem erro)
  async function loadProfile() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // MUDANÇA: Não dá erro se a tabela estiver vazia

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setSlug(data.slug || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setWhatsappMessage(data.whatsapp_message || '');
        setSocials(data.social_media || {
          instagram: '',
          facebook: '',
          youtube: '',
          linkedin: ''
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar perfil:", err);
    } finally {
      setLoading(false);
    }
  }

  // SEGUNDA FUNÇÃO: GUARDAR (Cria se não existe / Atualiza se existe)
  async function handleSave() {
    if (!user?.id) return;
    
    setSaving(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // O método UPSERT é o segredo para salvar quando a tabela está vazia
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, // O ID liga o Auth ao Perfil
          full_name: fullName,
          slug: slug.toLowerCase().trim().replace(/\s+/g, '-'), // Limpa o slug
          bio: bio,
          phone: phone,
          whatsapp_message: whatsappMessage,
          social_media: socials,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id' // Se o ID já existir, apenas atualiza
        });

      if (error) throw error;

      setStatus('success');
      // Feedback visual de sucesso por 3 segundos
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Erro ao publicar alterações.');
    } finally {
      setSaving(false);
    }
  }

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    input: darkMode ? 'bg-zinc-800/50 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#0217ff]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Meu Site Público</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Configuração da Vitrine</p>
        </div>
        {slug && (
          <a 
            href={`/v/${slug}`} 
            target="_blank" 
            className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-[#0217ff] hover:text-white transition-all"
          >
            <Eye size={14} /> Ver Meu Site
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={`${theme.card} p-8 rounded-[40px] border space-y-8`}>
            
            {/* INFORMAÇÕES BÁSICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">Nome de Exibição</label>
                <input 
                  className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome profissional"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">URL Personalizada (Slug)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">/v/</span>
                  <input 
                    className={`${theme.input} w-full pl-12 pr-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all font-bold`}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="meu-nome"
                  />
                </div>
              </div>
            </div>

            {/* CONTATOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">WhatsApp (Com DDD)</label>
                <input 
                  className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 11999999999"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">Mensagem Automática</label>
                <input 
                  className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all`}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Olá, vi seu imóvel no site..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">Biografia / Descrição</label>
              <textarea 
                rows={4}
                className={`${theme.input} w-full px-6 py-4 rounded-3xl outline-none focus:border-[#0217ff] transition-all resize-none`}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre sua experiência no mercado imobiliário..."
              />
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL - BOTÃO DE SALVAR */}
        <div className="space-y-6">
          <div className={`${theme.card} p-8 rounded-[40px] border space-y-6`}>
            {status === 'success' && (
              <div className="flex items-center gap-3 text-green-500 font-bold text-xs uppercase tracking-widest animate-bounce">
                <Check size={18} /> Salvo com Sucesso!
              </div>
            )}
            {status === 'error' && (
              <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest">
                <AlertCircle className="inline mr-2" size={14} /> {errorMessage}
              </div>
            )}
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-6 bg-[#0217ff] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0217ff]/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Salvando...' : 'Publicar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}