import React, { useState, useRef, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import {
  Edit3, Save, Camera, X, Image,
  ArrowLeft, Check, Phone, Award, Mail,
  Instagram, Facebook, Youtube, Linkedin,
  User, Briefcase, Calendar, TrendingUp
} from 'lucide-react';

const SOCIAL_CONFIG = [
  { key: 'instagram', label: 'Instagram', placeholder: '@seuperfil ou URL', color: '#E1306C', icon: Instagram },
  { key: 'facebook', label: 'Facebook', placeholder: 'URL da página', color: '#1877F2', icon: Facebook },
  { key: 'youtube', label: 'YouTube', placeholder: 'URL do canal', color: '#FF0000', icon: Youtube },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'URL do perfil', color: '#0A66C2', icon: Linkedin },
];

const ProfilePage: React.FC = () => {
  const { user, updateUser, leads, transactions, logout } = useGlobal();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    creci: user?.creci || '',
    email: user?.email || '',
    experience: user?.experience || '',
    specialties: user?.specialties || '',
    instagram: user?.socialMedia?.instagram || '',
    facebook: user?.socialMedia?.facebook || '',
    youtube: user?.socialMedia?.youtube || '',
    linkedin: user?.socialMedia?.linkedin || '',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      creci: user?.creci || '',
      email: user?.email || '',
      experience: user?.experience || '',
      specialties: user?.specialties || '',
      instagram: user?.socialMedia?.instagram || '',
      facebook: user?.socialMedia?.facebook || '',
      youtube: user?.socialMedia?.youtube || '',
      linkedin: user?.socialMedia?.linkedin || '',
    });
    setAvatarPreview(user?.avatar || null);
  }, [user]);

  const handleSave = () => {
    const { instagram, facebook, youtube, linkedin, ...rest } = form;
    updateUser({ 
      ...rest, 
      socialMedia: { instagram, facebook, youtube, linkedin } 
    });
    setEditing(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview imediato
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      updateUser({ avatar: result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-sm text-gray-500">Gerencie suas informações profissionais</p>
          </div>
        </div>

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
          {/* AVATAR SECTION */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                {avatarPreview ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-[#0217ff]/20">
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg bg-gradient-to-r from-[#0217ff] to-[#00c6ff]">
                    {getInitials(form.name)}
                  </div>
                )}
                <button 
                  onClick={() => avatarInputRef.current?.click()} 
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input 
                  ref={avatarInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                />
              </div>

              {/* Info Rápida */}
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-900">{form.name || 'Seu Nome'}</h2>
                {form.creci && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#0217ff] bg-[#0217ff]/10 px-2 py-0.5 rounded-full mt-1">
                    <Award size={10} /> CRECI {form.creci}
                  </span>
                )}
                {form.experience && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1 justify-center sm:justify-start">
                    <Calendar size={12} /> {form.experience} anos de experiência
                  </p>
                )}
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-400 mt-4">
              Sua foto aparece no site público e nos relatórios
            </p>
          </div>

          {/* FORM / DISPLAY */}
          <div className="p-6">
            {editing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500 mb-1 block">Nome Completo</label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                    placeholder="Seu nome completo"
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
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0217ff] focus:outline-none text-gray-900"
                    placeholder="seu@email.com"
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

                {/* Redes Sociais */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Redes Sociais</p>
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
                    className="flex-1 py-3 bg-[#0217ff] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0217ff]/90 transition-all"
                  >
                    <Save size={16} /> Salvar Alterações
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
                {/* Informações de Contato */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem icon={Phone} label="WhatsApp" value={form.phone || 'Não informado'} />
                  <InfoItem icon={Mail} label="E-mail" value={form.email || 'Não informado'} />
                  <InfoItem icon={Award} label="CRECI" value={form.creci || 'Não informado'} />
                  <InfoItem icon={Calendar} label="Experiência" value={form.experience ? `${form.experience} anos` : 'Não informado'} />
                </div>

                {/* Especialidades */}
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

                {/* Redes Sociais */}
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

                {/* Botão Editar */}
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

        {/* BOTÃO SAIR */}
        <button 
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full mt-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
};

// Componente auxiliar para exibir informações
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