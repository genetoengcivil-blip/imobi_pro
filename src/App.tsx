import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Importação das novas páginas institucionais
import HelpCenterPage from './pages/HelpCenterPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import UpdatesPage from './pages/UpdatesPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useGlobal();
  const location = useLocation();

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
          {/* Public Sales Funnel & Institutional */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/updates" element={<UpdatesPage />} />
          
          {/* Main App Routes (Protected) */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
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

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Router>
    </GlobalProvider>
  );
}