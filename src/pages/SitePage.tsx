import { useState, useEffect } from 'react';
import { 
  Globe, Link as LinkIcon, User, MessageCircle, 
  Check, Loader2, AlertCircle, ExternalLink, Sparkles,
  Instagram, Facebook, Youtube, Linkedin, ChevronLeft
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function SitePage() {
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados dos campos (Sincronizados com o Profiles do Supabase)
  const [fullName, setFullName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [socials, setSocials] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    linkedin: ''
  });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) {
      setFullName(data.full_name || '');
      setSlug(data.slug || '');
      setBio(data.bio || '');
      setPhone(data.phone || '');
      setSocials(data.social_media || { instagram: '', facebook: '', youtube: '', linkedin: '' });
    }
  }

  const handleSlugChange = (val: string) => {
    const formatted = val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    setSlug(formatted);
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      // Validar slug duplicado
      if (slug) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', slug)
          .neq('id', user?.id)
          .maybeSingle();

        if (existing) throw new Error('Este link já está sendo usado por outro corretor.');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          slug: slug,
          bio: bio,
          phone: phone,
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
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-700">
      
      {/* Header de Gestão */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/50 p-8 rounded-[40px] border border-white/5">
        <div>
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <Globe size={18} />
            <span className="font-black uppercase text-[10px] tracking-[0.3em]">Identidade Digital</span>
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Configurar <span className="text-blue-600">Site Público</span></h1>
        </div>
        
        {slug && (
          <a 
            href={`/v/${slug}`} 
            target="_blank" 
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-600/10"
          >
            Acessar Site Vivo <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Seção do Link / Slug */}
          <div className="bg-zinc-900/30 p-10 rounded-[48px] border border-white/5 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <LinkIcon size={14} /> Seu Link Exclusivo
              </label>
              <div className="flex items-center bg-black border-2 border-white/5 rounded-2xl overflow-hidden focus-within:border-blue-600 transition-all">
                <span className="pl-6 pr-2 text-zinc-600 font-bold text-sm">imobi-pro.com/v/</span>
                <input 
                  type="text"
                  className="w-full py-5 pr-6 bg-transparent outline-none font-bold text-white placeholder-zinc-800"
                  placeholder="seu-nome-ou-imobiliaria"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome de Exibição</label>
                <input 
                  type="text"
                  className="w-full bg-black border-2 border-white/5 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 transition-all font-bold text-white"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">WhatsApp de Vendas</label>
                <input 
                  type="text"
                  className="w-full bg-black border-2 border-white/5 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 transition-all font-bold text-white"
                  placeholder="DDD + Número (ex: 83988887777)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sua Bio (Aparece no topo do site)</label>
              <textarea 
                rows={4}
                className="w-full bg-black border-2 border-white/5 rounded-[32px] py-6 px-6 outline-none focus:border-blue-600 transition-all font-medium italic text-zinc-300 resize-none"
                placeholder="Ex: Especialista em imóveis de alto padrão na região..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="bg-zinc-900/30 p-10 rounded-[48px] border border-white/5 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Redes Sociais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Instagram', icon: Instagram, key: 'instagram' },
                { label: 'Facebook', icon: Facebook, key: 'facebook' },
                { label: 'YouTube', icon: Youtube, key: 'youtube' },
                { label: 'LinkedIn', icon: Linkedin, key: 'linkedin' }
              ].map((social) => (
                <div key={social.key} className="relative">
                  <social.icon className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input 
                    type="text"
                    placeholder={`Link do ${social.label}`}
                    className="w-full bg-black border-2 border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-600 transition-all text-xs font-bold text-white"
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
          <div className="bg-blue-600 p-8 rounded-[40px] shadow-2xl shadow-blue-600/20">
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

          <div className="bg-zinc-900/50 p-8 rounded-[40px] border border-white/5 space-y-6">
            {status === 'success' && (
              <div className="flex items-center gap-3 text-green-500 font-bold text-xs uppercase italic tracking-widest animate-bounce">
                <Check size={18} /> Salvo com Sucesso!
              </div>
            )}
            {status === 'error' && (
              <div className="text-red-500 text-[10px] font-bold uppercase italic tracking-widest">
                <AlertCircle className="inline mr-2" size={14} /> {errorMessage}
              </div>
            )}
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Publicar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}