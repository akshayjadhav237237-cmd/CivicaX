import { useState } from 'react';
import { User, Mail, MapPin, Phone, LogOut, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
            <User className="text-blue-500" /> Account Identity
          </h1>
          <p className="text-slate-600">Manage your persona, emergency contact details, and role.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="col-span-1">
          <GlassCard padding="p-6" className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/30 mb-4 border-4 border-white/50">
              {user?.name?.charAt(0) || 'U'}
            </div>
            
            <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>{user?.name}</h2>
            <p className="text-sm text-slate-500 mb-6 flex items-center justify-center gap-1">
              <Shield size={14} className="text-blue-500" />
              <span className="capitalize">{user?.role.replace('_', ' ')}</span> Account
            </p>

            <div className="w-full h-px bg-slate-200 my-2" />

            <div className="w-full flex flex-col gap-3 py-4 text-sm text-slate-600 text-left">
              <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400" /> <span className="truncate">{user?.email}</span></div>
              <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-400" /> <span>{user?.city}</span></div>
              <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /> <span>{user?.phone || 'Not provided'}</span></div>
            </div>

            <div className="w-full h-px bg-slate-200 my-2" />

            <GlassButton variant="ghost" onClick={handleLogout} className="w-full mt-4 text-red-600 hover:text-red-700 hover:bg-red-50 justify-center">
              <LogOut size={16} /> Sign Out Securely
            </GlassButton>
          </GlassCard>
        </div>

        {/* Edit Form */}
        <div className="col-span-1 md:col-span-2">
          <GlassCard padding="p-6 md:p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Update Information</h3>
            
            <form onSubmit={handleUpdate} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <GlassInput
                  label="Full Name"
                  name="name"
                  icon={User}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <GlassInput
                  label="City / Region"
                  name="city"
                  icon={MapPin}
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <GlassInput
                  label="Email Address (Locked)"
                  type="email"
                  icon={Mail}
                  value={user?.email}
                  onChange={()=>{}}
                  disabled
                  title="Email cannot be changed"
                  className="opacity-70"
                />
                <GlassInput
                  label="Emergency Phone"
                  name="phone"
                  icon={Phone}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 "
                />
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl mt-4 flex items-start gap-3">
                <CheckCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  Your phone number will be used exclusively for highly critical push notifications via the NDMA emergency SMS gateway in the event of an internet blackout.
                </p>
              </div>

              <div className="flex justify-end mt-4">
                <GlassButton type="submit" disabled={isSubmitting} className="min-w-[150px]">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
