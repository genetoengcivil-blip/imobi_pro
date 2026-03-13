import React, { useState, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Shield, ChevronRight, LogOut, Mail, Phone, Building2,
  Edit3, Save, Globe, Award, HelpCircle, CreditCard, Camera, X, Image,
  ArrowLeft, Check, MessageCircle, ExternalLink, Star, Zap, Crown,
  KeyRound, Eye, EyeOff, Lock, ChevronDown, Instagram, Facebook, Youtube, Linkedin
} from 'lucide-react';
import { getThemeColors } from '../utils/theme';

const SOCIAL_CONFIG = [
  { key: 'instagram', label: 'Instagram', placeholder: '@seuperfil ou URL', color: '#E1306C', renderIcon: () => <Instagram className="w-3.5 h-3.5" style={{ color: '#E1306C' }} /> },
  { key: 'facebook',  label: 'Facebook',  placeholder: 'URL da página',       color: '#1877F2', renderIcon: () => <Facebook  className="w-3.5 h-3.5" style={{ color: '#1877F2' }} /> },
  { key: 'youtube',  label: 'YouTube',   placeholder: 'URL do canal',         color: '#FF0000', renderIcon: () => <Youtube   className="w-3.5 h-3.5" style={{ color: '#FF0000' }} /> },
  { key: 'linkedin', label: 'LinkedIn',  placeholder: 'URL do perfil',        color: '#0A66C2', renderIcon: () => <Linkedin  className="w-3.5 h-3.5" style={{ color: '#0A66C2' }} /> },
  { key: 'tiktok',   label: 'TikTok',    placeholder: '@seuhandle ou URL',    color: '#010101', renderIcon: () => <span className="text-[10px] font-black" style={{ color: '#010101' }}>TK</span> },
];

const ProfilePage: React.FC = () => {
  const { user, logout, updateUser, leads, transactions, darkMode } = useGlobal();
  const nav = useNavigate();
  const tc = getThemeColors(darkMode);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:      user?.name      || '',
    company:   user?.company   || '',
    phone:     user?.phone     || '',
    creci:     user?.creci     || '',
    bio:       user?.bio       || '',
    email:     user?.email     || '',
    instagram: user?.socialMedia?.instagram || '',
    facebook:  user?.socialMedia?.facebook  || '',
    youtube:   user?.socialMedia?.youtube   || '',
    linkedin:  user?.socialMedia?.linkedin  || '',
    tiktok:    user?.socialMedia?.tiktok    || '',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef   = useRef<HTMLInputElement>(null);

  const [modal,        setModal]        = useState<'none' | 'ajuda' | 'assinatura' | 'seguranca'>('none');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw,    setCurrentPw]    = useState('');
  const [newPw,        setNewPw]        = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');
  const [pwSaved,      setPwSaved]      = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'semestral' | 'anual'>('anual');
  const [expandedFaq,  setExpandedFaq]  = useState<number | null>(null);

  const handleSave = () => {
    const { instagram, facebook, youtube, linkedin, tiktok, ...rest } = form;
    updateUser({ ...rest, socialMedia: { instagram, facebook, youtube, linkedin, tiktok } });
    setEditing(false);
  };

  const closeModal = () => {
    setModal('none');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwSaved(false);
  };

  const totalSales = leads.filter(l => l.status === 'fechado').length;
  const totalRev   = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const fmt = (n: number) => n >= 1000 ? `R$${(n / 1000).toFixed(0)}k` : `R$${n}`;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUser({ avatar: ev.target?.result as string });
    reader.readAsDataURL(file); e.target.value = '';
  };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUser({ logo: ev.target?.result as string });
    reader.readAsDataURL(file); e.target.value = '';
  };
  const handleSavePassword = () => {
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) return; // inline validation already shown
    if (newPw.length < 6) return;   // inline validation already shown
    setPwSaved(true); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSaved(false), 3000);
  };

  const faqs = [
    { q: 'Como adicionar um novo lead?', a: 'Acesse a aba "Leads" e clique no botão "+" no canto superior direito. Preencha as informações e salve.' },
    { q: 'Como o site público funciona?', a: 'Seu site é gerado automaticamente com seus imóveis e dados de perfil. Os imóveis cadastrados no CRM aparecem automaticamente.' },
    { q: 'Como funciona o funil de vendas?', a: 'No Pipeline, use os botões ←→ nos cards para mover leads entre as etapas: Novo → Contato → Visita → Proposta → Fechado.' },
    { q: 'Como cancelar minha assinatura?', a: 'Entre em contato pelo WhatsApp ou e-mail de suporte. O cancelamento é processado em até 24 horas.' },
    { q: 'Os dados são salvos automaticamente?', a: 'Sim! Todos os dados são salvos automaticamente no seu dispositivo. Sincronização em nuvem em breve.' },
  ];

  const socialLinks = SOCIAL_CONFIG.filter(s => user?.socialMedia?.[s.key as keyof typeof user.socialMedia]);

  return (
    <div className="page space-y-5 lg:max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => nav(-1)} className="p-2 rounded-[10px] transition-colors lg:hidden" style={{ background: tc.surfaceBg, color: tc.text }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: tc.text }}>Meu Perfil</h1>
          <p className="text-[13px]" style={{ color: tc.textSec }}>Suas informações aparecem no site público</p>
        </div>
      </div>

      {/* Avatar + Logo Card */}
      <div className="rounded-[24px] p-6 animate-slide-up" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>

        {/* Photo + Logo row (Centered) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.05em] mb-1" style={{ color: tc.textSec }}>Foto do Perfil</p>
            <div className="relative group">
              {user?.avatar ? (
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-2" style={{ borderColor: tc.border }}>
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-[34px] font-bold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)' }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </button>
              {user?.avatar && (
                <button onClick={() => updateUser({ avatar: '' })} className="absolute -top-1 -right-1 w-6 h-6 bg-apple-red text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} className="text-[11px] font-medium text-apple-blue mt-1">
              {user?.avatar ? 'Alterar Foto' : 'Adicionar Foto'}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>

          <div className="hidden sm:block h-20 w-px" style={{ background: tc.border }} />

          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.05em] mb-1" style={{ color: tc.textSec }}>Logomarca</p>
            <div className="relative group">
              {user?.logo ? (
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 bg-white" style={{ borderColor: tc.border }}>
                    <img src={user.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  </div>
                  <button onClick={() => logoInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  <button onClick={() => updateUser({ logo: '' })} className="absolute -top-1 -right-1 w-6 h-6 bg-apple-red text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-apple-blue transition-colors bg-white/5" style={{ borderColor: tc.border }} onClick={() => logoInputRef.current?.click()}>
                  <Image className="w-7 h-7" style={{ color: tc.textMut }} />
                  <span className="text-[10px] font-medium" style={{ color: tc.textMut }}>Logo</span>
                </div>
              )}
            </div>
            <button onClick={() => logoInputRef.current?.click()} className="text-[11px] font-medium text-apple-blue mt-1">
              {user?.logo ? 'Alterar Logo' : 'Adicionar Logo'}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </div>
        </div>

        {/* Info hint */}
        <div className="rounded-[12px] px-4 py-3 mb-5 flex items-center gap-2" style={{ background: '#0A84FF10', border: '1px solid #0A84FF20' }}>
          <Globe className="w-4 h-4 text-apple-blue shrink-0" />
          <p className="text-[12px] text-apple-blue font-medium">Foto, logo e redes sociais aparecem automaticamente no seu site público</p>
        </div>

        {/* Edit form or display */}
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5 block" style={{ color: tc.textSec }}>Nome</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" className="input" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5 block" style={{ color: tc.textSec }}>Empresa</label>
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Nome da empresa" className="input" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5 block" style={{ color: tc.textSec }}>Telefone / WhatsApp</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className="input" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5 block" style={{ color: tc.textSec }}>CRECI</label>
                <input value={form.creci} onChange={e => setForm({ ...form, creci: e.target.value })} placeholder="CRECI 000000/SP" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5 block" style={{ color: tc.textSec }}>E-mail</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@email.com" className="input" />
                <p className="text-[10px] mt-1" style={{ color: tc.textMut }}>Este é o mesmo e-mail usado no login</p>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5 block" style={{ color: tc.textSec }}>Bio / Apresentação</label>
              <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Sua apresentação para clientes..." className="input resize-none" />
            </div>

            {/* Social Media Section */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3" style={{ borderTop: `1px solid ${tc.border}`, paddingTop: '12px' }}>
                <Globe className="w-4 h-4 text-apple-blue" />
                <p className="text-[14px] font-bold" style={{ color: tc.text }}>Redes Sociais</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#0A84FF15', color: '#0A84FF' }}>Aparecem no site</span>
              </div>
              <div className="space-y-2.5">
                {SOCIAL_CONFIG.map(({ key, label, placeholder, color, renderIcon }) => (
                  <div key={key} className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${color}18` }}>
                      {renderIcon()}
                    </div>
                    <input
                      value={(form as Record<string, string>)[key] || ''}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={`${label} — ${placeholder}`}
                      className="input !pl-13"
                      style={{ paddingLeft: '3.25rem' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn btn-primary flex-1 !rounded-[14px]">
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-soft !rounded-[14px] !px-5">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-[24px] font-bold tracking-tight" style={{ color: tc.text }}>{user?.name}</h2>
            <p className="text-[14px] mt-1" style={{ color: tc.textSec }}>{user?.email}</p>
            {user?.company && <p className="text-[13px] mt-0.5" style={{ color: tc.textMut }}>{user.company}</p>}
            {user?.creci && (
              <div className="inline-flex items-center gap-1.5 mt-2 text-[12px] text-apple-blue font-semibold bg-apple-blue/[0.06] px-3 py-1.5 rounded-full">
                <Award className="w-3.5 h-3.5" /> {user.creci}
              </div>
            )}
            {user?.bio && <p className="text-[13px] mt-4 leading-relaxed max-w-sm mx-auto" style={{ color: tc.textSec }}>{user.bio}</p>}

            {/* Social Media Icons (view mode) */}
            {socialLinks.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                {SOCIAL_CONFIG.filter(s => user?.socialMedia?.[s.key as keyof typeof user.socialMedia]).map(({ key, label, color, renderIcon }) => {
                  const url = user?.socialMedia?.[key as keyof typeof user.socialMedia] || '';
                  const href = url.startsWith('http') ? url : `https://${url}`;
                  return (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer" title={label}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                      {renderIcon()}
                    </a>
                  );
                })}
              </div>
            )}

            <button onClick={() => setEditing(true)} className="btn btn-soft !rounded-full !py-3 !px-6 !text-[13px] mt-5 mx-auto">
              <Edit3 className="w-3.5 h-3.5" /> Editar Perfil
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5" style={{ borderTop: `1px solid ${tc.border}` }}>
          {[
            { label: 'Leads',   value: leads.length.toString(), color: '#0A84FF' },
            { label: 'Vendas',  value: totalSales.toString(),   color: '#30D158' },
            { label: 'Receita', value: fmt(totalRev),           color: '#FF9F0A' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[24px] font-bold tabular" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em] mt-1" style={{ color: tc.textSec }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-[20px] overflow-hidden animate-slide-up" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${tc.border}` }}>
          <p className="text-[12px] font-bold uppercase tracking-[0.05em]" style={{ color: tc.textSec }}>Contato</p>
        </div>
        {[
          { icon: Mail,      color: '#0A84FF', bg: '#0A84FF10', label: 'E-mail',    value: user?.email   || '' },
          { icon: Phone,     color: '#30D158', bg: '#30D15810', label: 'WhatsApp',  value: user?.phone   || '' },
          { icon: Building2, color: '#5E5CE6', bg: '#5E5CE610', label: 'Empresa',   value: user?.company || '' },
        ].map((item, i) => (
          <div key={item.label} className="px-5 py-4 flex items-center gap-4" style={{ borderTop: i > 0 ? `1px solid ${tc.border}` : 'none' }}>
            <div className="p-3 rounded-[14px]" style={{ background: item.bg }}>
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em]" style={{ color: tc.textSec }}>{item.label}</p>
              <p className="text-[14px] font-medium mt-0.5" style={{ color: tc.text }}>{item.value || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Social Media Display Card */}
      {socialLinks.length > 0 && (
        <div className="rounded-[20px] overflow-hidden animate-slide-up" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${tc.border}` }}>
            <p className="text-[12px] font-bold uppercase tracking-[0.05em]" style={{ color: tc.textSec }}>Redes Sociais</p>
          </div>
          {SOCIAL_CONFIG.filter(s => user?.socialMedia?.[s.key as keyof typeof user.socialMedia]).map(({ key, label, color, renderIcon }, i) => {
            const val = user?.socialMedia?.[key as keyof typeof user.socialMedia] || '';
            const href = val.startsWith('http') ? val : `https://${val}`;
            return (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                className="px-5 py-4 flex items-center gap-4 hover:opacity-80 transition-opacity"
                style={{ borderTop: i > 0 ? `1px solid ${tc.border}` : 'none', display: 'flex' }}>
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: `${color}18` }}>
                  {renderIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.04em]" style={{ color: tc.textSec }}>{label}</p>
                  <p className="text-[13px] font-medium mt-0.5 truncate" style={{ color: tc.text }}>{val}</p>
                </div>
                <ExternalLink className="w-4 h-4 shrink-0" style={{ color: tc.textFaint }} />
              </a>
            );
          })}
        </div>
      )}

      {/* Site Público Card */}
      <div className="rounded-[20px] overflow-hidden animate-slide-up bg-gradient-to-br from-apple-blue to-apple-teal p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[12px] bg-white/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">Seu Site Público</p>
              <p className="text-[11px] text-white/70">Disponível para todos verem</p>
            </div>
          </div>
          <button onClick={() => window.open('#/site', '_blank')}
            className="px-4 py-2 rounded-[10px] bg-white text-apple-blue font-semibold text-[12px] flex items-center gap-1.5 hover:bg-white/90 transition-all shadow-lg">
            Visitar <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-white/10 rounded-[12px] p-3 mb-4">
          <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mb-1">URL do site</p>
          <code className="text-[12px] text-white font-mono">#/site</code>
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed">
          Seus imóveis, foto, logomarca e redes sociais aparecem automaticamente no site.
        </p>
      </div>

      {/* Menu links */}
      <div className="rounded-[20px] overflow-hidden animate-slide-up" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
        {[
          { action: () => nav('/settings'),       icon: Settings,    color: '#8E8E93', bg: '#8E8E9310', label: 'Configurações',    desc: 'Notificações, modo escuro' },
          { action: () => setModal('assinatura'),  icon: CreditCard,  color: '#FF9F0A', bg: '#FF9F0A10', label: 'Assinatura',       desc: 'Plano atual e pagamento' },
          { action: () => setModal('seguranca'),   icon: Shield,      color: '#30D158', bg: '#30D15810', label: 'Segurança',        desc: 'Senha e autenticação' },
          { action: () => setModal('ajuda'),       icon: HelpCircle,  color: '#5E5CE6', bg: '#5E5CE610', label: 'Ajuda & Suporte',  desc: 'FAQ e contato' },
        ].map((item, i) => (
          <button key={item.label} onClick={item.action}
            className="w-full px-5 py-4 flex items-center gap-4 transition-all group hover:opacity-80 text-left"
            style={{ borderTop: i > 0 ? `1px solid ${tc.border}` : 'none' }}>
            <div className="p-2.5 rounded-[12px]" style={{ background: item.bg }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium" style={{ color: tc.text }}>{item.label}</p>
              <p className="text-[11px]" style={{ color: tc.textSec }}>{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: tc.textFaint }} />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button onClick={() => { logout(); nav('/login'); }}
        className="w-full py-4 rounded-[16px] font-semibold flex items-center justify-center gap-2 text-[15px] transition-all animate-slide-up"
        style={{ background: '#FF375F08', border: '1px solid #FF375F20', color: '#FF375F' }}>
        <LogOut className="w-5 h-5" /> Sair da Conta
      </button>

      {/* ─── MODALS ─── */}
      {modal !== 'none' && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] animate-fade" onClick={closeModal} />}

      {/* Ajuda Modal */}
      {modal === 'ajuda' && (
        <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-4 pointer-events-none">
          <div className="w-full max-w-lg rounded-[28px] overflow-hidden pointer-events-auto animate-scale max-h-[90vh] overflow-y-auto" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${tc.border}` }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px]" style={{ background: '#5E5CE610' }}><HelpCircle className="w-5 h-5" style={{ color: '#5E5CE6' }} /></div>
                <div><h3 className="text-[17px] font-bold" style={{ color: tc.text }}>Ajuda & Suporte</h3><p className="text-[12px]" style={{ color: tc.textSec }}>Dúvidas frequentes</p></div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full" style={{ background: tc.surfaceBg }}><X className="w-5 h-5" style={{ color: tc.textSec }} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="rounded-[16px] overflow-hidden" style={{ background: tc.surfaceBg }}>
                    <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3">
                      <p className="text-[13px] font-semibold" style={{ color: tc.text }}>{faq.q}</p>
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} style={{ color: tc.textSec }} />
                    </button>
                    {expandedFaq === i && <div className="px-4 pb-4"><p className="text-[13px] leading-relaxed" style={{ color: tc.textSec }}>{faq.a}</p></div>}
                  </div>
                ))}
              </div>
              <div className="rounded-[16px] p-5 space-y-3" style={{ background: '#5E5CE608', border: '1px solid #5E5CE620' }}>
                <p className="text-[13px] font-bold" style={{ color: tc.text }}>Ainda precisa de ajuda?</p>
                <p className="text-[12px]" style={{ color: tc.textSec }}>Nossa equipe responde em até 2 horas nos dias úteis.</p>
                <div className="flex flex-col gap-2">
                  <a href="https://wa.me/5511999999999?text=Olá! Preciso de ajuda com o ImobiPro." target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 py-3 px-4 rounded-[12px] font-semibold text-[13px] text-white" style={{ background: '#30D158' }}>
                    <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
                  </a>
                  <a href="mailto:suporte@imobipro.com.br"
                    className="flex items-center gap-2.5 py-3 px-4 rounded-[12px] font-semibold text-[13px]" style={{ background: tc.surfaceBg, color: tc.text }}>
                    <Mail className="w-4 h-4" /> suporte@imobipro.com.br
                  </a>
                </div>
              </div>
              <p className="text-center text-[11px]" style={{ color: tc.textFaint }}>ImobiPro v3.0 Premium</p>
            </div>
          </div>
        </div>
      )}

      {/* Assinatura Modal */}
      {modal === 'assinatura' && (
        <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-4 pointer-events-none">
          <div className="w-full max-w-lg rounded-[28px] overflow-hidden pointer-events-auto animate-scale max-h-[90vh] overflow-y-auto" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${tc.border}` }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px]" style={{ background: '#FF9F0A10' }}><CreditCard className="w-5 h-5" style={{ color: '#FF9F0A' }} /></div>
                <div><h3 className="text-[17px] font-bold" style={{ color: tc.text }}>Assinatura</h3><p className="text-[12px]" style={{ color: tc.textSec }}>Gerencie seu plano</p></div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full" style={{ background: tc.surfaceBg }}><X className="w-5 h-5" style={{ color: tc.textSec }} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="rounded-[16px] p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #FF9F0A15, #FF375F10)', border: '1px solid #FF9F0A30' }}>
                <div className="p-2.5 rounded-[12px]" style={{ background: '#FF9F0A20' }}><Crown className="w-5 h-5" style={{ color: '#FF9F0A' }} /></div>
                <div className="flex-1"><p className="text-[13px] font-bold" style={{ color: tc.text }}>Plano Premium Ativo</p><p className="text-[11px]" style={{ color: tc.textSec }}>Próxima renovação: 15/02/2026</p></div>
                <div className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: '#30D15820', color: '#30D158' }}>ATIVO</div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { id: 'mensal' as const, name: 'Mensal', price: 'R$ 97,00', period: '/mês', saving: null, icon: Zap, color: '#0A84FF' },
                  { id: 'semestral' as const, name: 'Semestral', price: 'R$ 497,00', period: '/6 meses', saving: 'Economize R$ 85,00', icon: Star, color: '#5E5CE6' },
                  { id: 'anual' as const, name: 'Anual', price: 'R$ 697,00', period: '/ano', saving: 'Economize R$ 167,00', icon: Crown, color: '#FF9F0A' },
                ].map(plan => (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                    className="rounded-[20px] p-4 text-left transition-all border-2 flex items-center gap-4"
                    style={{ background: selectedPlan === plan.id ? `${plan.color}10` : tc.surfaceBg, borderColor: selectedPlan === plan.id ? plan.color : 'transparent' }}>
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: `${plan.color}20` }}>
                      <plan.icon className="w-6 h-6" style={{ color: plan.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-bold" style={{ color: tc.text }}>{plan.name}</p>
                        {plan.saving && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#30D15820', color: '#30D158' }}>{plan.saving}</span>}
                      </div>
                      <p className="text-[18px] font-bold mt-0.5" style={{ color: plan.color }}>{plan.price}<span className="text-[12px] font-medium opacity-60 ml-1">{plan.period}</span></p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan === plan.id ? 'border-apple-blue bg-apple-blue' : 'border-gray-300'}`}>
                      {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-[20px] p-5 space-y-3" style={{ background: tc.surfaceBg }}>
                <p className="text-[12px] font-bold" style={{ color: tc.text }}>O que você terá no ImobiPro:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                  {['Leads e Pipeline ilimitados','Imóveis ilimitados','Site público completo','Gestão de contratos','Agenda e follow-ups','Métricas financeiras','Suporte via WhatsApp','Atualizações do sistema'].map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-apple-green/20 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-apple-green" /></div>
                      <p className="text-[12.5px]" style={{ color: tc.textSec }}>{f}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full py-4 rounded-[18px] font-bold text-[16px] text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)', boxShadow: '0 8px 32px rgba(10,132,255,0.25)' }}>
                  <CreditCard className="w-5 h-5" /> Alterar Plano para {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                </button>
                <p className="text-center text-[11px] px-6" style={{ color: tc.textFaint }}>Ao confirmar, você será redirecionado para concluir a alteração do plano.</p>
              </div>
              <p className="text-center text-[11px]" style={{ color: tc.textFaint }}>Cancele quando quiser • Sem taxa de cancelamento</p>
            </div>
          </div>
        </div>
      )}

      {/* Segurança Modal */}
      {modal === 'seguranca' && (
        <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-4 pointer-events-none">
          <div className="w-full max-w-lg rounded-[28px] overflow-hidden pointer-events-auto animate-scale max-h-[90vh] overflow-y-auto" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${tc.border}` }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px]" style={{ background: '#30D15810' }}><Shield className="w-5 h-5" style={{ color: '#30D158' }} /></div>
                <div><h3 className="text-[17px] font-bold" style={{ color: tc.text }}>Segurança</h3><p className="text-[12px]" style={{ color: tc.textSec }}>Senha e autenticação</p></div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full" style={{ background: tc.surfaceBg }}><X className="w-5 h-5" style={{ color: tc.textSec }} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="rounded-[16px] p-4 flex items-center gap-3" style={{ background: tc.surfaceBg }}>
                <div className="p-2.5 rounded-[12px]" style={{ background: '#0A84FF10' }}><Mail className="w-5 h-5" style={{ color: '#0A84FF' }} /></div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: tc.textSec }}>E-mail de acesso</p>
                  <p className="text-[14px] font-semibold" style={{ color: tc.text }}>{user?.email || '—'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-apple-blue" /><p className="text-[14px] font-bold" style={{ color: tc.text }}>Alterar Senha</p></div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Senha atual" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="input !pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: tc.textSec }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input type={showPassword ? 'text' : 'password'} placeholder="Nova senha (mín. 6 caracteres)" value={newPw} onChange={e => setNewPw(e.target.value)} className="input" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Confirmar nova senha" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="input" />
                {newPw && confirmPw && newPw !== confirmPw && <p className="text-[12px] text-apple-red font-medium">As senhas não conferem</p>}
                {pwSaved ? (
                  <div className="flex items-center gap-2 text-apple-green text-[13px] font-semibold py-2 px-4 rounded-[12px]" style={{ background: '#30D15810' }}>
                    <Check className="w-4 h-4" /> Senha alterada com sucesso!
                  </div>
                ) : (
                  <button onClick={handleSavePassword} disabled={!currentPw || !newPw || !confirmPw || newPw !== confirmPw} className="btn btn-primary w-full !rounded-[14px] disabled:opacity-40 disabled:cursor-not-allowed">
                    <Lock className="w-4 h-4" /> Alterar Senha
                  </button>
                )}
              </div>
              <div className="rounded-[16px] p-4 space-y-2" style={{ background: '#30D15808', border: '1px solid #30D15820' }}>
                <p className="text-[12px] font-bold text-apple-green">Dicas de segurança</p>
                {['Use uma senha com letras, números e símbolos','Não use a mesma senha em outros serviços','Troque sua senha regularmente'].map(tip => (
                  <div key={tip} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-apple-green mt-0.5 shrink-0" />
                    <p className="text-[12px]" style={{ color: tc.textSec }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
