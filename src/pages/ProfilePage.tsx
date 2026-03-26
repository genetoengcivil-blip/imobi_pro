import React, { useState, useRef, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import {
  Edit3, Save, Camera, X, Image,
  ArrowLeft, Check, Phone, Award, Mail,
  Instagram, Facebook, Youtube, Linkedin,
  User, Briefcase, Calendar, TrendingUp, Building2, Loader2, AlertCircle
} from 'lucide-react';

const SOCIAL_CONFIG = [
  { key: 'instagram', label: 'Instagram', placeholder: '@seuperfil ou URL', color: '#E1306C', icon: Instagram },
  { key: 'facebook', label: 'Facebook', placeholder: 'URL da página', color: '#1877F2', icon: Facebook },
  { key: 'youtube', label: 'YouTube', placeholder: 'URL do canal', color: '#FF0000', icon: Youtube },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'URL do perfil', color: '#0A66C2', icon: Linkedin },
];

const ProfilePage: React.FC = () => {
  const { user, updateUser, leads, transactions } = useGlobal();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    creci: user?.creci || '',
    email: user?.email || '',
    experience: user?.experience || '',
    specialties: user?.specialties || '',
    company: user?.company || '',
    instagram: user?.socialMedia?.instagram || '',
    facebook: user?.socialMedia?.facebook || '',
    youtube: user?.socialMedia?.youtube || '',
    linkedin: user?.socialMedia?.linkedin || '',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logo || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      creci: user?.creci || '',
      email: user?.email || '',
      experience: user?.experience || '',
      specialties: user?.specialties || '',
      company: user?.company || '',
      instagram: user?.socialMedia?.instagram || '',
      facebook: user?.socialMedia?.facebook || '',
      youtube: user?.socialMedia?.youtube || '',
      linkedin: user?.socialMedia?.linkedin || '',
    });
    setAvatarPreview(user?.avatar || null);
    setLogoPreview(user?.logo || null);
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      const { instagram, facebook, youtube, linkedin, email, ...rest } = form;
      await updateUser({ 
        ...rest, 
        socialMedia: { instagram, facebook, youtube, linkedin } 
      });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveError('Erro ao salvar as alterações. Tente novamente.');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAvatar(true);
    
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      setUploadingAvatar(false);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      setUploadingAvatar(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      await updateUser({ avatar: result });
      setUploadingAvatar(false);
    };
    reader.onerror = () => {
      alert('Erro ao carregar imagem');
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(true);
    
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      setUploadingLogo(false);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      setUploadingLogo(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setLogoPreview(result);
      await updateUser({ logo: result });
      setUploadingLogo(false);
    };
    reader.onerror = () => {
      alert('Erro ao carregar logo');
      setUploadingLogo(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatPhoneDisplay = (phone: string) => {
    const numbers = phone?.replace(/\D/g, '') || '';
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const totalLeads = leads.length;
  const totalSales = leads.filter(l => l.status === 'fechado').length;
  const totalRevenue = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  
  const fmt = (n: number) => {
    if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}K`;
    return `R$ ${n.toLocaleString('pt-BR')}`;
  };

  const socialLinks = SOCIAL_CONFIG.filter(s => user?.socialMedia?.[s.key as keyof typeof user.socialMedia]);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-sm text-gray-500">Gerencie suas informações profissionais</p>
          </div>
        </div>

        {/* MENSAGENS */}
        {saveSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-center gap-2 animate-fade-in">
            <Check size={18} />
            <span className="text-sm font-medium">Perfil atualizado com sucesso!</span>
          </div>
        )}
        
        {saveError && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 flex items-center gap-2 animate-fade-in">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{saveError}</span>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-gray-400">LEADS</span>
              <User size={14} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
            <p className="text-[10px] text-gray-400 mt-1">em andamento</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-gray-400">VENDAS</span>
              <TrendingUp size={14} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
            <p className="text-[10px] text-gray-400 mt-1">fechadas</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-gray-400">RECEITA</span>
              <Briefcase size={14} className="text-[#0217ff]" />
            </div>
            <p className="text-2xl font-bold text-[#0217ff]">{fmt(totalRevenue)}</p>
            <p className="text-[10px] text-gray-400 mt-1">total recebido</p>
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* AVATAR & LOGO SECTION */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  {avatarPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-[#0217ff]/20 bg-white">
                      <img 
                        src={avatarPreview} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg bg-gradient-to-r from-[#0217ff] to-[#00c6ff]">
                      {getInitials(form.name)}
                    </div>
                  )}
                  <button 
                    onClick={() => avatarInputRef.current?.click()} 
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input 
                    ref={avatarInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                  />
                </div>
                <span className="text-xs text-gray-500">Foto de Perfil</span>
              </div>

              <div className="h-12 w-px bg-gray-200 hidden sm:block" />

              {/* Logo - AGORA COM object-cover PARA PREENCHER TODO O ESPAÇO */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  {logoPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-[#0217ff]/20 bg-white">
                      <img 
                        src={logoPreview} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#0217ff] transition-colors bg-gray-50" onClick={() => logoInputRef.current?.click()}>
                      <Building2 className="w-6 h-6 text-gray-400" />
                      <span className="text-[9px] text-gray-400">Logo</span>
                    </div>
                  )}
                  <button 
                    onClick={() => logoInputRef.current?.click()} 
                    disabled={uploadingLogo}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input 
                    ref={logoInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                </div>
                <span className="text-xs text-gray-500">Logo da Imobiliária</span>
                <p className="text-[9px] text-gray-400 text-center">Aparece no site público</p>
              </div>
            </div>
          </div>

          {/* FORM / DISPLAY - Restante do código igual... */}
          <div className="p-6">
            {editing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
                {/* ... campos do formulário ... */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500 mb-1 block">Nome Completo</label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-gray-500 mb-1 block flex items-center gap-1">
                      <Phone size={12} /> WhatsApp
                    </label>
                    <input 
                      value={form.phone} 
                      onChange={e => setForm({ ...form, phone: e.target.value })} 
                      placeholder="(11) 99999-9999" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-gray-500 mb-1 block flex items-center gap-1">
                      <Award size={12} /> CRECI
                    </label>
                    <input 
                      value={form.creci} 
                      onChange={e => setForm({ ...form, creci: e.target.value })} 
                      placeholder="CRECI 000000/SP" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500 mb-1 block flex items-center gap-1">
                    <Mail size={12} /> E-mail
                  </label>
                  <input 
                    value={form.email} 
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-gray-500 mb-1 block flex items-center gap-1">
                      <Calendar size={12} /> Anos de Experiência
                    </label>
                    <input 
                      value={form.experience} 
                      onChange={e => setForm({ ...form, experience: e.target.value })} 
                      placeholder="Ex: 10" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-gray-500 mb-1 block">Especialidades</label>
                    <input 
                      value={form.specialties} 
                      onChange={e => setForm({ ...form, specialties: e.target.value })} 
                      placeholder="Alto padrão, lançamentos..." 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500 mb-1 block">Empresa / Imobiliária</label>
                  <input 
                    value={form.company} 
                    onChange={e => setForm({ ...form, company: e.target.value })} 
                    placeholder="Nome da sua imobiliária" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Redes Sociais (aparecem no site público)</p>
                  <div className="space-y-3">
                    {SOCIAL_CONFIG.map(({ key, label, placeholder, color, icon: Icon }) => (
                      <div key={key} className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Icon size={14} style={{ color }} />
                        </div>
                        <input
                          value={(form as Record<string, string>)[key] || ''}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-1 py-3 bg-[#0217ff] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0217ff]/90 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditing(false)} 
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem icon={User} label="Nome" value={form.name || 'Não informado'} />
                  <InfoItem icon={Phone} label="WhatsApp" value={form.phone ? formatPhoneDisplay(form.phone) : 'Não informado'} />
                  <InfoItem icon={Mail} label="E-mail" value={form.email || 'Não informado'} />
                  <InfoItem icon={Award} label="CRECI" value={form.creci || 'Não informado'} />
                  <InfoItem icon={Calendar} label="Experiência" value={form.experience ? `${form.experience} anos` : 'Não informado'} />
                  <InfoItem icon={Briefcase} label="Empresa" value={form.company || 'Não informado'} />
                </div>

                {form.specialties && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-bold uppercase text-gray-500 mb-2">Especialidades</p>
                    <div className="flex flex-wrap gap-2">
                      {form.specialties.split(',').map((spec, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {socialLinks.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-bold uppercase text-gray-500 mb-3">Redes Sociais</p>
                    <div className="flex flex-wrap gap-3">
                      {SOCIAL_CONFIG.filter(s => user?.socialMedia?.[s.key as keyof typeof user.socialMedia]).map(({ key, label, color, icon: Icon }) => {
                        const url = user?.socialMedia?.[key as keyof typeof user.socialMedia] || '';
                        const href = url.startsWith('http') ? url : `https://${url}`;
                        return (
                          <a 
                            key={key} 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <Icon size={14} style={{ color }} />
                            <span className="text-xs text-gray-600">{label}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    onClick={() => setEditing(true)} 
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                  >
                    <Edit3 size={16} /> Editar Perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
      <Icon size={16} className="text-gray-400 mt-0.5" />
      <div>
        <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700">{value}</p>
      </div>
    </div>
  );
}

export default ProfilePage;