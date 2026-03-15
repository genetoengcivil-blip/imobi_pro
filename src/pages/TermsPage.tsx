import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-20">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#0217ff] transition-colors mb-12 text-xs font-black uppercase tracking-widest">
          <ArrowLeft size={16} /> Voltar para a Home
        </Link>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-[#0217ff]/10 rounded-2xl flex items-center justify-center">
            <Shield className="text-[#0217ff]" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Termos de <span className="text-[#0217ff]">Uso</span></h1>
            <p className="text-zinc-500 text-sm font-medium italic">Última atualização: 15 de Março de 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-zinc-400 leading-relaxed italic text-lg">
          <section>
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-4">1. Aceitação dos Termos</h2>
            <p>Ao aceder ao ImobiPro, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis. O software é fornecido como SaaS (Software as a Service) para gestão imobiliária.</p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-4">2. Licença de Uso</h2>
            <p>A licença concedida é pessoal, intransferível e revogável em caso de inadimplência ou violação destes termos. É proibido realizar engenharia reversa ou tentar extrair o código-fonte da plataforma.</p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-4">3. Responsabilidade dos Dados</h2>
            <p>O corretor é o único responsável pela veracidade dos imóveis cadastrados e pelo tratamento dos dados dos leads capturados, devendo este respeitar as diretrizes da LGPD em suas comunicações via WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-4">4. Cancelamento e Reembolso</h2>
            <p>O cancelamento pode ser feito a qualquer momento via plataforma de pagamento (Nexano). O acesso permanecerá ativo até o fim do período já pago. Reembolsos seguem o Código de Defesa do Consumidor (7 dias).</p>
          </section>
        </div>
      </div>
    </div>
  );
}