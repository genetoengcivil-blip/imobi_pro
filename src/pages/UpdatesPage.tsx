import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, Star, Wrench } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function UpdatesPage() {
  const navigate = useNavigate();

  const updates = [
    {
      version: 'v2.1.0',
      date: 'Nesta semana',
      type: 'feature',
      icon: Star,
      title: 'Sistema de Avaliação Pro',
      desc: 'Adicionada uma calculadora de avaliação de mercado inteligente na secção de Imóveis, permitindo gerar estimativas com base em dados manuais do raio.'
    },
    {
      version: 'v2.0.0',
      date: 'Na semana passada',
      type: 'feature',
      icon: Rocket,
      title: 'Novo Design e Pipeline Kanban',
      desc: 'Remodelação completa da interface visual com o novo azul oficial. O Pipeline agora permite "arrastar e largar" leads de forma instantânea sem falhas.'
    },
    {
      version: 'v1.5.2',
      date: 'Mês passado',
      type: 'fix',
      icon: Wrench,
      title: 'Correção de Telas Brancas',
      desc: 'Implementámos travas de segurança avançadas nas páginas de Contratos e Imóveis para impedir travamentos quando os dados ainda estão a carregar.'
    }
  ];

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
        <h1 className="text-4xl font-black mb-4">Atualizações do Sistema</h1>
        <p className="text-zinc-500 mb-16">Acompanhe as últimas melhorias e novos recursos do ImobiPro.</p>

        <div className="space-y-8">
          {updates.map((update, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${update.type === 'feature' ? 'bg-[#0217ff]/20 text-[#0217ff]' : 'bg-zinc-800 text-zinc-400'}`}>
                  <update.icon className="w-5 h-5" />
                </div>
                {i !== updates.length - 1 && <div className="w-px h-full bg-white/10 mt-4" />}
              </div>
              <div className="pb-8 pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-white/10 text-white text-xs font-bold rounded-md">{update.version}</span>
                  <span className="text-sm text-zinc-500 font-medium">{update.date}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{update.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{update.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}