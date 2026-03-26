import { useState, useEffect } from 'react';
import { 
  Globe, Link as LinkIcon, User, MessageCircle, 
  Check, Loader2, AlertCircle, ExternalLink, Sparkles,
  Instagram, Facebook, Youtube, Linkedin, ChevronLeft,
  Save, Eye, RefreshCw, X
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function SitePage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSlugHelp, setShowSlugHelp] = useState(false);

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
        .maybeSingle();

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
    
    // Validações
    if (!fullName.trim()) {
      setStatus('error');
      setErrorMessage('Nome de exibição é obrigatório');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    if (!slug.trim()) {
      setStatus('error');
      setErrorMessage('URL personalizada é obrigatória');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    // Limpa o slug (apenas letras, números e hífens)
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (cleanSlug !== slug) {
      setSlug(cleanSlug);
    }
    
    setSaving(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          slug: cleanSlug,
          bio: bio.trim(),
          phone: phone.replace(/\D/g, ''),
          whatsapp_message: whatsappMessage.trim(),
          social_media: socials,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Erro ao publicar alterações.');
    } finally {
      setSaving(false);
    }
  }

  const formatPhoneDisplay = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setPhone(formatted);
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    input: darkMode ? 'bg-zinc-800/50 border-white/5 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400',
    text: darkMode ? 'text-white' : 'text-zinc-900',
    secondaryText: darkMode ? 'text-zinc-400' : 'text-zinc-500',
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Meu Site Público</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Configuração da Vitrine • URL: {slug ? `/v/${slug}` : 'não configurada'}
          </p>
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
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-[#0217ff] tracking-widest flex items-center gap-2">
                <User size={14} /> Informações Básicas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">Nome de Exibição *</label>
                  <input 
                    className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all font-bold`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome profissional"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 flex items-center gap-1">
                    URL Personalizada (Slug) *
                    <button 
                      type="button"
                      onClick={() => setShowSlugHelp(!showSlugHelp)}
                      className="text-zinc-400 hover:text-[#0217ff]"
                    >
                      <AlertCircle size={12} />
                    </button>
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">/v/</span>
                    <input 
                      className={`${theme.input} w-full pl-12 pr-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all font-bold`}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="meu-nome"
                    />
                  </div>
                  {showSlugHelp && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-[10px] text-blue-600 dark:text-blue-400">
                      Use apenas letras, números e hífens. Ex: joao-silva-corretor
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CONTATOS */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-[#0217ff] tracking-widest flex items-center gap-2">
                <MessageCircle size={14} /> Contato e Atendimento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">WhatsApp (Com DDD)</label>
                  <input 
                    className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all`}
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
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
            </div>

            {/* BIOGRAFIA */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-[#0217ff] tracking-widest flex items-center gap-2">
                <Sparkles size={14} /> Sobre Você
              </h2>
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

            {/* REDES SOCIAIS */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-[#0217ff] tracking-widest flex items-center gap-2">
                <Globe size={14} /> Redes Sociais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 flex items-center gap-1">
                    <Instagram size={12} /> Instagram
                  </label>
                  <input 
                    className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all`}
                    value={socials.instagram}
                    onChange={(e) => setSocials({...socials, instagram: e.target.value})}
                    placeholder="https://instagram.com/@seuperfil"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 flex items-center gap-1">
                    <Facebook size={12} /> Facebook
                  </label>
                  <input 
                    className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all`}
                    value={socials.facebook}
                    onChange={(e) => setSocials({...socials, facebook: e.target.value})}
                    placeholder="https://facebook.com/@seuperfil"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 flex items-center gap-1">
                    <Youtube size={12} /> YouTube
                  </label>
                  <input 
                    className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all`}
                    value={socials.youtube}
                    onChange={(e) => setSocials({...socials, youtube: e.target.value})}
                    placeholder="https://youtube.com/@seucanal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 flex items-center gap-1">
                    <Linkedin size={12} /> LinkedIn
                  </label>
                  <input 
                    className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none focus:border-[#0217ff] transition-all`}
                    value={socials.linkedin}
                    onChange={(e) => setSocials({...socials, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/seuperfil"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL - BOTÃO DE SALVAR E PREVIEW */}
        <div className="space-y-6">
          <div className={`${theme.card} p-8 rounded-[40px] border space-y-6`}>
            {status === 'success' && (
              <div className="flex items-center gap-3 text-green-500 font-bold text-xs uppercase tracking-widest animate-bounce">
                <Check size={18} /> Salvo com Sucesso!
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                <AlertCircle size={14} /> {errorMessage}
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

            {slug && (
              <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
                <p className="text-[9px] text-zinc-400 uppercase font-bold mb-2">Seu site está no ar:</p>
                <a 
                  href={`/v/${slug}`}
                  target="_blank"
                  className="text-xs font-bold text-[#0217ff] hover:underline break-all flex items-center gap-1"
                >
                  {window.location.origin}/v/{slug}
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>

          {/* DICA */}
          <div className={`${theme.card} p-6 rounded-[32px] border`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0217ff]/10 flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-[#0217ff]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Dica Profissional</p>
                <p className="text-[9px] text-zinc-500 leading-relaxed">
                  Adicione fotos de qualidade aos seus imóveis para aumentar o engajamento. Um site completo pode aumentar suas vendas em até 40%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}