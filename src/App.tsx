import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import { supabase } from './lib/supabase';
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
import LandingPage from './pages/LandingPage';
import WelcomePage from './pages/WelcomePage';
import SuccessPage from './pages/SuccessPage'; 
import PublicSitePage from './pages/PublicSitePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

// Mata o loop de carregamento limpando Service Workers antigos
const clearCaches = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  }
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useGlobal();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#0217ff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export default function App() {
  clearCaches();
  return (
    <GlobalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/v/:slug" element={<PublicSitePage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leads" element={<LeadsListPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/site" element={<SitePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GlobalProvider>
  );
}