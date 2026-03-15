import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsListPage from './pages/LeadsListPage';
import PipelinePage from './pages/PipelinePage';
import PropertiesPage from './pages/PropertiesPage';
import FinancialPage from './pages/FinancialPage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SitePage from './pages/SitePage';
import ContractsPage from './pages/ContractsPage';
import WhatsAppPage from './pages/WhatsAppPage';
import LandingPage from './pages/LandingPage';
import WelcomePage from './pages/WelcomePage';
import SuccessPage from './pages/SuccessPage'; 
import PublicSitePage from './pages/PublicSitePage';

// Institucionais
import HelpCenterPage from './pages/HelpCenterPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import UpdatesPage from './pages/UpdatesPage';

// COMPONENTE DE ROTA PROTEGIDA COM LOGICA DE BLOQUEIO
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useGlobal();
  const location = useLocation();

  if (loading) return null; 

  // 1. Bloqueio se não estiver logado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Bloqueio se o Status no Perfil for 'bloqueado'
  // Nota: O 'user.status' vem do seu Contexto que busca da tabela 'perfil'
  if (user.status === 'bloqueado') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black mb-4 uppercase italic">Acesso Suspenso</h1>
        <p className="text-zinc-500 max-w-md mb-8">
          Identificamos uma pendência na sua assinatura. Por favor, regularize seu pagamento na Nexano para retomar o acesso aos seus leads.
        </p>
        <a href="https://wa.me/5583986667292" className="px-8 py-4 bg-[#0217ff] rounded-2xl font-bold uppercase text-xs">
          Falar com Suporte
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <GlobalProvider>
      <Router>
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/success" element={<SuccessPage />} />
          
          {/* Links Institucionais (Sincronizados com o Footer da Landing) */}
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/updates" element={<UpdatesPage />} />
          
          {/* Rota do Site Público */}
          <Route path="/v/:slug" element={<PublicSitePage />} />
          
          {/* --- ROTAS PRIVADAS (ÁREA DO CORRETOR) --- */}
          <Route path="/app" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leads" element={<LeadsListPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="whatsapp" element={<WhatsAppPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="financial" element={<FinancialPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="site" element={<SitePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GlobalProvider>
  );
}