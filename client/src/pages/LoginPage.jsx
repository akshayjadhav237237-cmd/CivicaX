import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../stores/themeStore';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = [
    { email: 'citizen@civicax.demo', role: 'Citizen' },
    { email: 'dept@civicax.demo',    role: 'Dept Op' },
    { email: 'gov@civicax.demo',     role: 'Gov'     },
    { email: 'admin@civicax.demo',   role: 'Admin'   },
  ];

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Welcome back to CivicaX!');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid credentials');
        toast.error('Login failed');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--bg-base)' }}>
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/20 blur-[100px]" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-medium mb-6 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <GlassCard padding="p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-500/40 mx-auto mb-4">
              C
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Welcome Back
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to your CivicaX account</p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{
                background: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2',
                border: `1px solid ${isDark ? 'rgba(239,68,68,0.35)' : '#FECACA'}`,
                color: isDark ? '#FCA5A5' : '#991B1B',
              }}
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <GlassInput
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <GlassInput
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-1">
              <a href="#" className="text-sm font-semibold text-blue-500 hover:text-blue-400">Forgot password?</a>
            </div>
            <GlassButton type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </GlassButton>
          </form>

          {/* Footer */}
          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-500 hover:text-blue-400">Create Account</Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--divider)' }}>
            <p className="text-xs text-center font-medium mb-3 tracking-wider" style={{ color: 'var(--text-muted)' }}>
              DEMO CREDENTIALS — click to fill
            </p>
            <div className="flex flex-col gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword('demo1234'); }}
                  className="flex items-center justify-between w-full rounded-xl px-3 py-2 text-[11px] transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: email === acc.email
                      ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)')
                      : (isDark ? 'rgba(51,65,85,0.5)' : 'rgba(248,250,252,0.8)'),
                    border: `1px solid ${email === acc.email ? 'rgba(59,130,246,0.5)' : 'var(--divider)'}`,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span><b>{acc.role}</b> — {acc.email}</span>
                  <span style={{ color: 'var(--text-muted)' }}>demo1234</span>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
