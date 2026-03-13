import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Mail, Key, Rocket } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-[#0217ff]/30 relative overflow-hidden">
      
      {/* Fundo Minimalista */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0217ff]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Logo no Topo */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <Logo className="w-8 h-8" />
        <span className="font-bold text-2xl tracking-tight">Imobi<span className="text-[#0217ff]">Pro</span></span>
      </div>

      <div className="max-w-md w-full bg-zinc-950 border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl relative z-10 text-center animate-fade-in">
        
        {/* Ícone de Sucesso Animado */}
        <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0217ff]/20 rounded-full flex items-center justify-center border border-[#0217ff]/30">
            <Rocket className="w-5 h-5 text-[#0217ff]" />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-3">Pagamento Aprovado!</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Parabéns! A sua assinatura foi confirmada. O ImobiPro já está liberado e pronto para alavancar as suas vendas.
        </p>

        {/* Instruções de Acesso */}
        <div className="space-y-4 text-left mb-10">
          <div className="p-5 rounded-3xl bg-black border border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0217ff]/10 flex items-center justify-center shrink-0 mt-1">
              <Mail className="w-5 h-5 text-[#0217ff]" />
            </div>
            <div>
              <div className="font-bold text-white mb-1">E-mail de Acesso</div>
              <div className="text-zinc-500 text-sm">Utilize o mesmo endereço de e-mail que informou no momento da compra.</div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-black border border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0217ff]/10 flex items-center justify-center shrink-0 mt-1">
              <Key className="w-5 h-5 text-[#0217ff]" />
            </div>
            <div>
              <div className="font-bold text-white mb-1">Sua Senha Inicial</div>
              <div className="text-zinc-500 text-sm">A sua senha padrão é o seu <strong>CPF</strong> (apenas números). Poderá alterá-la mais tarde nas configurações.</div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/login')}
          className="w-full py-5 bg-[#0217ff] hover:bg-[#0211bf] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-transform hover:scale-[1.03] active:scale-95 shadow-[0_0_30px_rgba(2,23,255,0.3)]"
        >
          Acessar o Meu Sistema
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}