import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function PrivacyPage() {
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
        <div className="w-16 h-16 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-[#0217ff]" />
        </div>
        <h1 className="text-4xl font-black mb-4">Política de Privacidade</h1>
        <p className="text-zinc-500 mb-12">O ImobiPro está em conformidade com as leis de proteção de dados.</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Recolha de Dados</h2>
            <p>Recolhemos apenas os dados necessários para o funcionamento da plataforma, incluindo o seu nome, email, telefone e os dados dos leads e imóveis que regista no sistema. Não recolhemos dados sensíveis sem o seu consentimento explícito.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Uso e Proteção</h2>
            <p>Os seus dados e a sua carteira de clientes são estritamente confidenciais. Utilizamos criptografia de ponta a ponta na base de dados (Supabase). O ImobiPro nunca venderá, alugará ou partilhará a sua lista de leads com terceiros.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Integrações de Terceiros</h2>
            <p>Ao utilizar integrações como o WhatsApp, processamos essas informações unicamente para facilitar a sua comunicação com o cliente, garantindo que as plataformas parceiras também respeitem rigorosos padrões de segurança.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Os Seus Direitos</h2>
            <p>Tem o direito de solicitar uma cópia dos seus dados, bem como a exclusão permanente da sua conta e de todas as informações associadas aos seus clientes no nosso sistema, a qualquer momento.</p>
          </section>
        </div>
      </div>
    </div>
  );
}