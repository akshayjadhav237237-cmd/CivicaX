import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/themeStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  AlertTriangle,
  HardHat,
  ShieldAlert,
  Building2,
  History,
  Users,
  Settings,
  ClipboardList
} from 'lucide-react';

export function Sidebar({ mobile = false }) {
  const { user } = useAuth();
  const { isDark } = useThemeStore();

  const navItems = [
    { name: 'Dashboard',           path: '/dashboard',             icon: LayoutDashboard, roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'Emergency Responder', path: '/emergency',             icon: AlertTriangle,   roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'Civic Manager',       path: '/civic',                 icon: HardHat,         roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'Safety Watch',        path: '/safety',                icon: ShieldAlert,     roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'My Grievances',       path: '/civic?tab=grievances',  icon: ClipboardList,   roles: ['citizen'] },
    { name: 'Command Center',      path: '/government',            icon: Building2,       roles: ['government', 'admin'] },
    { name: 'Alert History',       path: '/alerts',                icon: History,         roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'User Profile',        path: '/profile',               icon: Settings,        roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'Admin Panel',         path: '/admin',                 icon: Users,           roles: ['admin'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role));

  const activeTextColor = isDark ? '#60A5FA' : '#2563EB';
  const activeBgColor = isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)';
  const inactiveTextColor = isDark ? '#CBD5E1' : '#334155';
  const inactiveIconColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div className={`${mobile ? 'flex w-full' : 'hidden md:flex w-[260px]'} flex-col h-screen fixed left-0 top-0 glass-nav z-40`}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
          C
        </div>
        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Civica<span className="text-blue-500">X</span>
        </h1>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-2 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group select-none ${
                isActive ? 'font-semibold shadow-sm' : 'font-medium hover:bg-black/5 dark:hover:bg-white/5'
              }`
            }
            style={({ isActive }) => ({
              background: isActive
                ? isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.10)'
                : 'transparent',
              color: isActive
                ? '#3B82F6'
                : isDark ? '#CBD5E1' : '#475569',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  color={isActive ? '#3B82F6' : isDark ? '#94A3B8' : '#64748B'}
                />
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Card */}
      <div className="p-4 mt-auto">
        <div
          className="p-4 flex flex-col items-center text-center gap-2 rounded-[20px] shadow-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{
              background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)',
              color: isDark ? '#60A5FA' : '#2563EB',
              border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.25)'}`,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="w-full">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'User'}
            </p>
            <p className="text-xs font-medium capitalize mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.role?.replace('_', ' ') || 'Citizen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
