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

  async function handleSave() {
    if (!user?.id) return;
    
    setSaving(true);
    setStatus('idle');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, // Chave primária para o UPSERT funcionar
          full_name: fullName,
          slug: slug.toLowerCase().trim(), // Garante que o slug é limpo
          bio: bio,
          phone: phone,
          whatsapp_message: whatsappMessage,
          social_media: socials, // Certifique-se que a coluna é jsonb no banco
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id' // Se o ID já existir, ele apenas atualiza
        });

      if (error) throw error;

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Erro ao publicar alterações.');
    } finally {
      setSaving(false);
    }
  }
  const handleSlugChange = (val: string) => {
    const formatted = val.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/^-+|-+$/g, '');
    setSlug(formatted);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      if (!slug) {
        throw new Error('O link do site é obrigatório');
      }

      // Validar slug duplicado
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', slug)
        .neq('id', user?.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) throw new Error('Este link já está sendo usado por outro corretor.');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          slug: slug,
          bio: bio,
          phone: phone,
          whatsapp_message: whatsappMessage,
          social_media: socials,
          updated_at: new Date()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const theme = {
    bg: darkMode ? 'bg-zinc-900' : 'bg-white',
    card: darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200',
    text: darkMode ? 'text-white' : 'text-zinc-900',
    secondary: darkMode ? 'text-zinc-400' : 'text-zinc-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#0217ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-700 px-4 md:px-0">
      
      {/* Header de Gestão */}
      <div className={`${theme.card} flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[40px] border`}>
        <div>
          <div className="flex items-center gap-3 text-[#0217ff] mb-2">
            <Globe size={18} />
            <span className="font-black uppercase text-[10px] tracking-[0.3em]">Identidade Digital</span>
          </div>
          <h1 className={`text-3xl font-black uppercase italic tracking-tighter ${theme.text}`}>
            Configurar <span className="text-[#0217ff]">Site Público</span>
          </h1>
        </div>
        
        {slug && (
          <a 
            href={`/v/${slug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-[#0217ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0217ff]/90 transition-all shadow-xl"
          >
            Acessar Site <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Seção do Link / Slug */}
          <div className={`${theme.card} p-8 md:p-10 rounded-[48px] border space-y-6`}>
            <div className="space-y-4">
              <label className={`text-[10px] font-black uppercase tracking-widest ${theme.secondary} flex items-center gap-2`}>
                <LinkIcon size={14} /> Seu Link Exclusivo
              </label>
              <div className={`flex items-center border-2 rounded-2xl overflow-hidden focus-within:border-[#0217ff] transition-all ${theme.input}`}>
                <span className={`pl-6 pr-2 font-bold text-sm ${theme.secondary}`}>
                  imobi-pro.com/v/
                </span>
                <input 
                  type="text"
                  className="w-full py-5 pr-6 bg-transparent outline-none font-bold"
                  placeholder="seu-nome-ou-imobiliaria"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
              </div>
              {slug && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <Check size={12} /> Link disponível: imobi-pro.com/v/{slug}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <label className={`text-[10px] font-black uppercase tracking-widest ${theme.secondary}`}>
                  Nome de Exibição
                </label>
                <input 
                  type="text"
                  className={`w-full border-2 rounded-2xl py-4 px-6 outline-none focus:border-[#0217ff] transition-all font-bold ${theme.input}`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-3">
                <label className={`text-[10px] font-black uppercase tracking-widest ${theme.secondary}`}>
                  WhatsApp de Vendas
                </label>
                <input 
                  type="text"
                  className={`w-full border-2 rounded-2xl py-4 px-6 outline-none focus:border-[#0217ff] transition-all font-bold ${theme.input}`}
                  placeholder="DDD + Número (ex: 11988887777)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <label className={`text-[10px] font-black uppercase tracking-widest ${theme.secondary}`}>
                Mensagem Padrão do WhatsApp
              </label>
              <input 
                type="text"
                className={`w-full border-2 rounded-2xl py-4 px-6 outline-none focus:border-[#0217ff] transition-all ${theme.input}`}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Olá! Vi o seu site e gostaria de saber mais..."
              />
            </div>

            <div className="space-y-3 pt-4">
              <label className={`text-[10px] font-black uppercase tracking-widest ${theme.secondary}`}>
                Sua Bio (Aparece no topo do site)
              </label>
              <textarea 
                rows={4}
                className={`w-full border-2 rounded-[32px] py-6 px-6 outline-none focus:border-[#0217ff] transition-all font-medium resize-none ${theme.input}`}
                placeholder="Ex: Especialista em imóveis de alto padrão na região..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>

          {/* Redes Sociais */}
          <div className={`${theme.card} p-8 md:p-10 rounded-[48px] border space-y-6`}>
            <h3 className={`text-sm font-black uppercase tracking-widest ${theme.text} mb-6`}>
              Redes Sociais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Instagram', icon: Instagram, key: 'instagram', placeholder: '@seuinstagram' },
                { label: 'Facebook', icon: Facebook, key: 'facebook', placeholder: 'facebook.com/seupagina' },
                { label: 'YouTube', icon: Youtube, key: 'youtube', placeholder: 'youtube.com/@seucanal' },
                { label: 'LinkedIn', icon: Linkedin, key: 'linkedin', placeholder: 'linkedin.com/in/seuperfil' }
              ].map((social) => (
                <div key={social.key} className="relative">
                  <social.icon className={`absolute left-5 top-1/2 -translate-y-1/2 ${theme.secondary}`} size={18} />
                  <input 
                    type="text"
                    placeholder={social.placeholder}
                    className={`w-full border-2 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-[#0217ff] transition-all text-sm font-bold ${theme.input}`}
                    value={(socials as any)[social.key]}
                    onChange={(e) => setSocials({...socials, [social.key]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar de Status */}
        <div className="space-y-6">
          <div className="bg-[#0217ff] p-8 rounded-[40px] shadow-2xl shadow-[#0217ff]/20">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-4 flex items-center gap-2">
              <Sparkles size={20} /> Preview do Link
            </h3>
            <div className="bg-black/20 p-4 rounded-2xl text-[10px] font-mono break-all text-blue-100 mb-6">
              imobi-pro.com/v/{slug || '...'}
            </div>
            <p className="text-blue-100 text-xs font-medium italic leading-relaxed">
              O seu site público é gerado automaticamente com base nos seus imóveis cadastrados e nesta configuração de perfil.
            </p>
          </div>

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

            <button 
              onClick={loadProfile}
              className="w-full py-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Recarregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}