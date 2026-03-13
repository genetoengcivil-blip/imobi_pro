import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0217ff]/30">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => navigate('/landing')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold">
            <ArrowLeft className="w-5 h-5" /> Voltar ao Início
          </button>
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-xl">Imobi<span className="text-[#0217ff]">Pro</span></span>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-black mb-4">Termos de Uso</h1>
        <p className="text-zinc-500 mb-12">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
            <p>Ao aceder e utilizar o sistema ImobiPro, concorda em cumprir e vincular-se a estes Termos de Uso. Se não concordar com alguma parte destes termos, não deverá utilizar a nossa plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Uso da Plataforma</h2>
            <p>O ImobiPro é um software de gestão (CRM) destinado a corretores de imóveis e imobiliárias. É estritamente proibido utilizar a plataforma para fins ilegais, envio de spam ou partilha de conteúdo não autorizado.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Assinaturas e Pagamentos</h2>
            <p>O acesso às ferramentas premium requer uma assinatura ativa (Mensal, Semestral ou Anual). Os pagamentos são processados com segurança através da plataforma Nexano. O não pagamento resultará na suspensão temporária do acesso à conta.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cancelamento</h2>
            <p>Pode cancelar a sua assinatura a qualquer momento através do painel de configurações. O cancelamento interrompe as cobranças futuras, mas não dá direito a reembolso de períodos já faturados e utilizados.</p>
          </section>
        </div>
      </div>
    </div>
  );
}