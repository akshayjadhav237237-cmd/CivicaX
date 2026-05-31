import { useEffect, Component, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { useThemeStore } from './stores/themeStore';

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
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "red", background: "#fef2f2", height: "100vh" }}>
          <h2>Something went wrong in this route.</h2>
          <pre>{this.state.error?.toString()}</pre>
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
              
              {/* Government / Admin Only */}
              <Route element={<RoleRoute roles={['government', 'admin']} />}>
                <Route path="/government" element={<GovernmentPage />} />
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
