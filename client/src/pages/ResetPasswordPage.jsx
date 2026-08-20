import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Invalid reset link. Reset token is missing.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      const data = response.data?.data || response.data;
      setIsSuccess(true);
      toast.success('Password reset successfully!');
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
        {/* Back to login */}
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
              Reset Password
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Choose a new password</p>
          </div>

          {isSuccess ? (
            <div className="flex flex-col gap-6 text-center animate-fadeIn">
              <div className="flex flex-col items-center justify-center text-green-500 gap-2">
                <CheckCircle size={48} className="animate-bounce" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Success!</h2>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Your password has been successfully updated. You can now log in using your new credentials.
              </p>
              <GlassButton onClick={() => navigate('/login')} className="w-full mt-4">
                Sign In
              </GlassButton>
            </div>
          ) : (
            <>
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
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <GlassInput
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <GlassButton type="submit" disabled={isSubmitting} className="w-full mt-2">
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </GlassButton>
              </form>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
