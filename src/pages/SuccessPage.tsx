import { CheckCircle, Mail, ArrowRight, ShieldCheck, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-[#0217ff]/30 relative overflow-hidden font-['Inter',sans-serif]">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      `}</style>

      {/* Detalhe de fundo para profundidade técnica */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0217ff]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-12 relative z-10 animate-in fade-in zoom-in duration-1000">
        
        {/* Ícone de Sucesso com Glow */}
        <div className="flex justify-center">
          <div className="w-28 h-28 bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] flex items-center justify-center shadow-[0_0_60px_-15px_rgba(16,185,129,0.4)]">
            <CheckCircle size={56} className="text-emerald-500" />
          </div>
        </div>

        {/* Headline de Impacto */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-[900] uppercase italic tracking-tighter leading-[0.85]">
            PAGAMENTO <br /> <span className="text-[#0217ff]">CONFIRMADO!</span>
          </h1>
          <p className="text-zinc-500 text-xl md:text-2xl font-medium italic max-w-lg mx-auto leading-relaxed">
            Bem-vindo à elite. O seu ecossistema imobiliário de alta performance foi ativado.
          </p>
        </div>

        {/* Cards de Instruções de Acesso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="p-10 rounded-[48px] bg-zinc-950 border border-white/5 hover:border-[#0217ff]/40 transition-all group">
            <div className="w-14 h-14 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0217ff] transition-all">
              <Mail className="text-[#0217ff] group-hover:text-white" size={28} />
            </div>
            <h3 className="font-black uppercase text-[10px] tracking-[0.3em] mb-3 text-zinc-400">Acesso via E-mail</h3>
            <p className="text-white text-sm font-bold italic leading-relaxed">Utilize o e-mail registado na compra para aceder à sua conta.</p>
          </div>
          
          <div className="p-10 rounded-[48px] bg-zinc-950 border border-white/5 hover:border-[#0217ff]/40 transition-all group">
            <div className="w-14 h-14 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0217ff] transition-all">
              <ShieldCheck className="text-[#0217ff] group-hover:text-white" size={28} />
            </div>
            <h3 className="font-black uppercase text-[10px] tracking-[0.3em] mb-3 text-zinc-400">Sua Senha Padrão</h3>
            <p className="text-white text-sm font-bold italic leading-relaxed">A sua senha inicial é o seu <b>CPF (apenas números)</b> registado na Nexano.</p>
          </div>

          {/* Card de WhatsApp Informativo */}
          <div className="md:col-span-2 p-8 rounded-[40px] bg-[#0217ff]/5 border border-[#0217ff]/20 flex items-center gap-6 group">
             <div className="w-14 h-14 bg-[#25d366]/10 rounded-2xl flex items-center justify-center shrink-0">
                <MessageCircle size={28} className="text-[#25d366]" />
             </div>
             <p className="text-xs text-zinc-400 font-medium italic leading-relaxed">
                Verifique o seu telemóvel! Acabámos de enviar os seus dados detalhados para o seu <b>WhatsApp</b> através da nossa central automatizada.
             </p>
          </div>
        </div>

        {/* Call to Action Principal */}
        <div className="pt-6">
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-8 bg-[#0217ff] hover:bg-black text-white rounded-[40px] font-[900] text-xl uppercase tracking-[0.25em] shadow-2xl shadow-blue-600/40 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            Aceder ao Painel Agora <ArrowRight size={28} />
          </button>
        </div>

        {/* Footer da Página */}
        <div className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-800 italic">
          NEXANO SYSTEMS — IMOBIPRO PRO SOLUTIONS © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}