import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-20">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#0217ff] transition-colors mb-12 text-xs font-black uppercase tracking-widest">
          <ArrowLeft size={16} /> Voltar para a Home
        </Link>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center">
            <Lock className="text-[#0217ff]" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Política de <span className="text-[#0217ff]">Privacidade</span></h1>
            <p className="text-zinc-500 text-sm font-medium italic">Conformidade LGPD - ImobiPro</p>
          </div>
        </div>

        <div className="space-y-8 text-zinc-400 leading-relaxed italic text-lg">
          <section>
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-4">1. Coleta de Informações</h2>
            <p>Coletamos dados necessários para a prestação do serviço: nome, e-mail, telefone (WhatsApp) e documento (CPF/CNPJ) para fins de faturamento e criação de acesso via Nexano.</p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-4">2. Segurança dos Dados</h2>
            <p>Utilizamos criptografia de ponta a ponta e a infraestrutura do Supabase para garantir que suas informações e seu inventário de imóveis estejam protegidos contra acessos não autorizados.</p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-4">3. Seus Direitos (LGPD)</h2>
            <p>O utilizador tem o direito de solicitar a exportação ou a exclusão definitiva de seus dados e de seus leads da nossa base de dados a qualquer momento, através do suporte oficial.</p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-4">4. Cookies</h2>
            <p>Utilizamos cookies apenas para manter sua sessão ativa e melhorar o desempenho da ferramenta. Não vendemos dados para terceiros.</p>
          </section>
        </div>
      </div>
    </div>
  );
}