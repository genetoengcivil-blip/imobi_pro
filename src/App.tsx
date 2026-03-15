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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useGlobal();
  const location = useLocation();

  if (loading) return null; // Aguarda o Supabase verificar a sessão

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <GlobalProvider>
      <Router>
        <Routes>
          {/* --- ROTAS PÚBLICAS (NÃO PROTEGIDAS) --- */}
          {/* Agora a raiz "/" abre a Landing Page sem pedir login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sucesso" element={<SuccessPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/updates" element={<UpdatesPage />} />
          
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
            <Route path="/v/:slug" element={<PublicSitePage />} />
          </Route>

          {/* Redirecionamento automático para a Landing se a página não existir */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GlobalProvider>
  );
}