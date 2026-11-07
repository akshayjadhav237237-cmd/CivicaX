import { useEffect, Component, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { useThemeStore } from './stores/themeStore';
import { OfflineBanner } from './components/common/OfflineBanner';
import { CrisisSimulatorModal } from './components/simulation/CrisisSimulatorModal';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  handleReload = () => {
    window.location.reload();
  };
  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-950 text-slate-100 font-sans">
          <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 font-heading">
              {this.props.fallbackTitle || "Something went wrong in this view"}
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              CivicaX isolated a runtime exception in this component to prevent the platform from crashing.
            </p>
            {this.state.error && (
              <div className="text-left bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 mb-6 max-h-32 overflow-y-auto font-mono text-xs text-rose-400">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800/50 text-slate-300 font-medium text-sm transition-all cursor-pointer"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Lazy Loaded Pages (named exports resolved via .then)
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage').then(module => ({ default: module.EmergencyPage })));
const CivicPage = lazy(() => import('./pages/CivicPage').then(module => ({ default: module.CivicPage })));
const SafetyPage = lazy(() => import('./pages/SafetyPage').then(module => ({ default: module.SafetyPage })));
const GovernmentPage = lazy(() => import('./pages/GovernmentPage').then(module => ({ default: module.GovernmentPage })));
const DamageAssessmentPage = lazy(() => import('./pages/DamageAssessmentPage').then(module => ({ default: module.DamageAssessmentPage || module.default })));
const SatelliteImageryPanel = lazy(() => import('./components/satellite/SatelliteImageryPanel').then(module => ({ default: module.SatelliteImageryPanel || module.default })));
const EvacuationRouter = lazy(() => import('./components/evacuation/EvacuationRouter').then(module => ({ default: module.EvacuationRouter || module.default })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(module => ({ default: module.AlertsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));

// Auth Guard
const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center p-8">Loading...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Role Guard
const RoleRoute = ({ roles }) => {
  const { hasRole, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center p-8">Loading...</div>;
  return hasRole(roles) ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

function AppContent() {
  const { checkAuth } = useAuth();
  const { isDark } = useThemeStore();

  // Apply / remove dark class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Initialize WebSocket connection
  useWebSocket();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: isDark ? 'rgba(15,20,35,0.95)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
          borderRadius: '16px',
          color: isDark ? '#F1F5F9' : '#1E293B',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(31,38,135,0.08)'
        }
      }} />
      {/* Offline Emergency Resilience Banner & Hotline Strip */}
      <OfflineBanner />
      {/* Evaluator 1-Click Crisis Simulator HUD */}
      <CrisisSimulatorModal />
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-900/5 dark:bg-slate-950/10 text-slate-500 font-medium">Loading CivicaX...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes inside AppLayout */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/emergency" element={<EmergencyPage />} />
              <Route path="/civic" element={<CivicPage />} />
              <Route path="/safety" element={<SafetyPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/satellite" element={<SatelliteImageryPanel />} />
              <Route path="/evacuation" element={<EvacuationRouter />} />
              <Route path="/damage-assessment" element={<DamageAssessmentPage />} />
              <Route path="/reports" element={<DamageAssessmentPage />} />
              
              {/* Government / Admin / Department Only */}
              <Route element={<RoleRoute roles={['government', 'admin', 'department_op']} />}>
                <Route path="/government" element={<GovernmentPage />} />
                <Route path="/damage-assessment" element={<DamageAssessmentPage />} />
                <Route path="/reports" element={<DamageAssessmentPage />} />
              </Route>

              {/* Admin Only */}
              <Route element={<RoleRoute roles={['admin']} />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
