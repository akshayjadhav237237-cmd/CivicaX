import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Building, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../stores/themeStore';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', city: 'Lonavla', officialId: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password || !formData.city) {
      setError('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await register(formData);
      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Registration failed');
        toast.error('Registration failed');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative" style={{ background: 'var(--bg-base)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/20 blur-[100px]" />
      </div>

      <div className="w-full max-w-lg z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-medium mb-6 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <GlassCard padding="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Join CivicaX
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Create an account to participate in community resilience</p>
          </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <GlassInput label="Full Name *" name="name" placeholder="Priya Citizen" icon={User} value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
              <GlassInput label="City/Region *" name="city" placeholder="Lonavla" icon={MapPin} value={formData.city} onChange={handleChange} required disabled={isSubmitting} />
            </div>
            <GlassInput label="Email Address *" type="email" name="email" placeholder="name@example.com" icon={Mail} value={formData.email} onChange={handleChange} required disabled={isSubmitting} />
            <GlassInput label="Phone Number" type="tel" name="phone" placeholder="+91 98765 43210 (Optional for SMS alerts)" icon={Phone} value={formData.phone || ''} onChange={handleChange} disabled={isSubmitting} />
            <GlassInput label="Password *" type="password" name="password" placeholder="Min. 8 characters" icon={Lock} value={formData.password} onChange={handleChange} required minLength={8} disabled={isSubmitting} />

            <div>
              <GlassInput
                label="Government Official ID (optional)"
                name="officialId"
                placeholder="e.g. GOV-MH-2026-001"
                icon={Building}
                value={formData.officialId}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <p className="text-xs mt-1.5 pl-1" style={{ color: 'var(--text-muted)' }}>
                Government officials: enter your whitelisted Official ID to automatically receive Government portal access. Citizens don't need this.
              </p>
            </div>

            <GlassButton type="submit" disabled={isSubmitting} className="w-full mt-4">
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </GlassButton>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-500 hover:text-blue-400">Sign In</Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
