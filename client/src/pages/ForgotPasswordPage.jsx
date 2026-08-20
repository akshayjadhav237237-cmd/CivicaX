import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPreviewUrl(null);
    if (!email) { setError('Please enter your email address'); return; }
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      const data = response.data?.data || response.data;
      setIsSent(true);
      if (response.data?.previewUrl || response.previewUrl) {
        setPreviewUrl(response.data?.previewUrl || response.previewUrl);
      }
      toast.success('Reset email sent successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An unexpected error occurred. Please try again.');
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
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 font-medium mb-6 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        <GlassCard padding="p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-500/40 mx-auto mb-4">
              C
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Forgot Password
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Recover your CivicaX account</p>
          </div>

          {/* Success layout */}
          {isSent ? (
            <div className="flex flex-col gap-6 text-center animate-fadeIn">
              <div className="flex flex-col items-center justify-center text-green-500 gap-2">
                <CheckCircle size={48} className="animate-bounce" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Reset Email Sent</h2>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Check your inbox! We've sent password reset instructions if the email matches an active account.
              </p>
              
              {previewUrl && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col gap-2">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-bold">Dev Fallback Preview URL:</p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono break-all font-semibold"
                  >
                    {previewUrl}
                  </a>
                </div>
              )}
              
              <GlassButton onClick={() => navigate('/login')} className="w-full mt-4">
                Return to Sign In
              </GlassButton>
            </div>
          ) : (
            <>
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
                <GlassButton type="submit" disabled={isSubmitting} className="w-full mt-2">
                  {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                </GlassButton>
              </form>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
